/**
 * Body tab: whole-body overview → region → structure (decision 0011).
 * Mirrors apps/app/src/screens/BodyScreen.tsx; keep the two in step.
 */
import { createViewer } from '../../utils/core';
import type { Viewer } from '../../utils/core';
import { KINDS, loadDetail, loadOverview, overviewCatalog, related } from '../../utils/content';
import type { CatalogEntry, ContentBundle, Detail, OverviewNode, Region, Structure } from '../../utils/content';
import { navBarStyle } from '../../utils/layout';
import { finishBenchmark, report, store } from '../../utils/store';
import { applyTabLabels } from '../../utils/tabbar';
import { t, tDynamic } from '../../utils/text';
import type { Lang, TextKey } from '../../utils/text';
import { MODEL_COLORS, SELECT_COLOR } from '../../utils/tokens';

/** Fit the camera to bones and pulleys: long muscles would stretch a region up the arm. */
const FRAME_KINDS = ['bone', 'pulley'];
/** Front view of the whole body, seen from slightly above. */
const FRONT = { theta: 0, phi: 1.47 };
/** Time the camera takes to fly towards a region before the detailed model replaces the overview. */
const FLY_MS = 400;

type Level = 'overview' | 'region';
type Status = 'loading' | 'ready' | 'err_webgl2' | 'err_load';
type Side = 'left' | 'right';
type NodeSide = OverviewNode['side'];

interface RowView {
  key: string;
  title: string;
  sub: string;
  note: string;
  chevron: boolean;
  current: boolean;
  id: string;
  region: string;
  side: string;
}

interface GroupView {
  kind: string;
  color: string;
  head: string;
  note: string;
  rows: RowView[];
}

interface CardView {
  name: string;
  en: string;
  sep: string;
  la: string;
  regionK: string;
  regionV: string;
  incK: string;
  incV: string;
  links: { key: string; k: string; v: string }[];
}

// Page-level state that is not rendered directly. The body tab is a single page instance.
let viewer: Viewer | null = null;
let overview: { glb: ArrayBuffer; catalog: CatalogEntry[]; nodes: OverviewNode[] } | null = null;
let content: ContentBundle | null = null;
const details: Record<string, Promise<Detail>> = {};
let flyTimer: ReturnType<typeof setTimeout> | undefined;
let flying = false;
let origin = { left: 0, top: 0 };

const st = {
  status: 'loading' as Status,
  level: 'overview' as Level,
  region: null as Region | null,
  side: 'left' as Side,
  notice: null as { region: Region; side: NodeSide } | null,
  group: null as string | null,
  selected: null as string | null,
  hidden: {} as Record<string, boolean>,
  listOpen: false,
};

function lang(): Lang {
  return store().lang;
}

function message(e: unknown): string {
  return String((e as Error) && (e as Error).message ? (e as Error).message : e);
}

function regionLabel(r: Region, s: NodeSide, l: Lang): string {
  if (!r.bilateral || s === 'mid') return r.name[l];
  const word = t(s === 'left' ? 'side_word_left' : 'side_word_right', l);
  return l === 'zh' ? word + r.name.zh : word + ' ' + r.name.en;
}

function detailFor(model: string): Promise<Detail> {
  if (!details[model]) details[model] = loadDetail(model);
  return details[model];
}

function layerColor(kind: string): string {
  return 'var(--c-layer-' + kind + ')';
}

Page({
  data: {
    navStyle: '',
    // The docs list webgl2 for getContext but not for the component's type attribute, so try both.
    canvasType: 'webgl2',
    showCanvas: true,
    ready: false,
    level: 'overview' as Level,
    title: '',
    sideRight: false,
    tx: {} as Record<string, string>,
    layers: [] as { kind: string; label: string; on: boolean; color: string }[],
    sheet: 'status',
    statusText: '',
    statusError: false,
    noticeTitle: '',
    card: null as CardView | null,
    listOpen: false,
    listTitle: '',
    listScope: '',
    regionRows: [] as RowView[],
    groups: [] as GroupView[],
  },

  onLoad(): void {
    this.setData({ navStyle: navBarStyle() });
  },

  onReady(): void {
    this.render();
    this.init();
  },

  onShow(): void {
    applyTabLabels(lang());
    this.render();
    const g = store();
    if (g.benchPending) {
      g.benchPending = false;
      // give the tab switch a moment so the canvas is visible before measuring
      setTimeout(() => this.runBenchmark(), 300);
    }
  },

  onUnload(): void {
    clearTimeout(flyTimer);
    if (viewer) viewer.dispose();
    viewer = null;
  },

  // ---------- setup ----------

  init(): void {
    wx.createSelectorQuery()
      .select('#gl')
      .fields({ node: true, size: true, rect: true })
      .exec((res) => {
        const info = res && res[0];
        const type = this.data.canvasType;
        if (!info || !info.node) {
          if (type === 'webgl2') {
            report('canvas type=webgl2 gave no node, retrying with type=webgl');
            this.retryWithWebgl();
            return;
          }
          this.fail('err_load', 'canvas node not found');
          return;
        }
        origin = { left: info.left || 0, top: info.top || 0 };
        const width = Math.max(1, Math.round(info.width));
        const height = Math.max(1, Math.round(info.height));
        let dpr = 2;
        try {
          dpr = Math.min(2, wx.getWindowInfo().pixelRatio || 1);
        } catch {
          // keep 2
        }
        if (type === 'webgl2') {
          try {
            const base = wx.getAppBaseInfo();
            const device = wx.getDeviceInfo();
            report('lib ' + base.SDKVersion + ' | ' + device.platform + ' ' + device.system + ' | ' + device.model);
          } catch {
            report('lib/device info unavailable');
          }
        }
        let v: Viewer;
        try {
          v = createViewer({
            canvas: info.node,
            width,
            height,
            pixelRatio: dpr,
            background: null,
            colors: MODEL_COLORS,
            selectColor: SELECT_COLOR,
          });
        } catch (e) {
          const msg = message(e);
          if (msg === 'WEBGL2_UNAVAILABLE' && type === 'webgl2') {
            report('type=webgl2 gave no WebGL2 context, retrying with type=webgl');
            this.retryWithWebgl();
            return;
          }
          this.fail(msg === 'WEBGL2_UNAVAILABLE' ? 'err_webgl2' : 'err_load', 'createViewer: ' + msg);
          return;
        }
        viewer = v;
        v.onTap = (id) => this.pick(id);
        report('canvas type=' + type + ' ' + width + 'x' + height + ' @' + dpr + 'x');
        const started = Date.now();
        loadOverview()
          .then((loaded) => {
            const read = Date.now();
            const catalog = overviewCatalog(loaded.nodes, loaded.content.regions);
            overview = { glb: loaded.glb, catalog, nodes: loaded.nodes };
            v.load(loaded.glb, catalog);
            v.setOrbit(FRONT.theta, FRONT.phi);
            const s = v.stats();
            report('GL ' + s.glVersion);
            report('overview: ' + s.meshes + ' parts, ' + s.triangles + ' triangles');
            report('read+unpack ' + (read - started) + ' ms, build ' + (Date.now() - read) + ' ms');
            content = loaded.content;
            st.status = 'ready';
            this.render();
            // unpack region models in the background so entering a region does not wait
            loaded.content.regions.forEach((r) => {
              if (r.detail) detailFor(r.detail.model).catch(() => {});
            });
          })
          .catch((e: unknown) => this.fail('err_load', message(e)));
      });
  },

  retryWithWebgl(): void {
    this.setData({ showCanvas: false }, () => {
      this.setData({ showCanvas: true, canvasType: 'webgl' }, () => this.init());
    });
  },

  fail(status: Status, msg: string): void {
    st.status = status;
    report('ERROR ' + msg);
    this.render();
  },

  // ---------- navigation between levels ----------

  /** Fly into a region; regions without a page only show a notice. */
  enterRegion(r: Region, s: NodeSide): void {
    const v = viewer;
    if (!v || flying) return;
    if (!r.detail) {
      st.notice = { region: r, side: s };
      st.listOpen = false;
      this.render();
      return;
    }
    const d = r.detail;
    const targetSide: Side = s === 'mid' ? d.side : s;
    st.notice = null;
    st.listOpen = false;
    this.render();
    v.focus({ frame: [r.id + ':' + s], highlight: null });
    const started = Date.now();
    flying = true;
    clearTimeout(flyTimer);
    detailFor(d.model)
      .then((detail) => {
        flyTimer = setTimeout(
          () => {
            flying = false;
            if (viewer !== v) return;
            try {
              v.clear();
              v.load(detail.glb, detail.catalog); // the core copies the arrays, so mirroring never touches the cached file
            } catch (e) {
              this.fail('err_load', 'load ' + d.model + ': ' + message(e));
              return;
            }
            v.setMirrored(targetSide !== d.side);
            v.focus({ frame: d.frame, highlight: null, frameKinds: FRAME_KINDS, instant: true });
            KINDS.forEach((k) => {
              if (st.hidden[k]) v.setKindVisible(k, false);
            });
            st.region = r;
            st.side = targetSide;
            st.group = null;
            st.selected = null;
            st.level = 'region';
            this.render();
          },
          Math.max(0, FLY_MS - (Date.now() - started)),
        );
      })
      .catch((e: unknown) => {
        flying = false;
        this.fail('err_load', message(e));
      });
  },

  onBack(): void {
    const v = viewer;
    if (!v || !overview) return;
    clearTimeout(flyTimer);
    flying = false;
    const region = st.region;
    v.clear();
    v.load(overview.glb, overview.catalog);
    // layer switches belong to region pages; the overview always shows everything
    KINDS.forEach((k) => {
      if (st.hidden[k]) v.setKindVisible(k, true);
    });
    v.setOrbit(FRONT.theta, FRONT.phi);
    if (region) v.focus({ frame: [region.id + ':' + (region.bilateral ? st.side : 'mid')], highlight: null, instant: true });
    v.focus({ frame: null, highlight: null });
    st.level = 'overview';
    st.region = null;
    st.group = null;
    st.selected = null;
    st.listOpen = false;
    this.render();
  },

  onReset(): void {
    if (!viewer || st.status !== 'ready') return;
    st.notice = null;
    viewer.setOrbit(FRONT.theta, FRONT.phi);
    viewer.focus({ frame: null, highlight: null });
    this.render();
  },

  onSide(): void {
    const s: Side = st.side === 'right' ? 'left' : 'right';
    st.side = s;
    if (viewer && st.region && st.region.detail) viewer.setMirrored(s !== st.region.detail.side);
    this.render();
  },

  // ---------- picking ----------

  pick(meshId: string | null): void {
    if (!content || flying) return;
    if (st.level === 'overview') {
      const node = meshId && overview ? overview.nodes.filter((n) => n.id === meshId)[0] : undefined;
      const r = node && content ? content.regions.filter((x) => x.id === node.region)[0] : undefined;
      if (r && node) this.enterRegion(r, node.side);
      else {
        st.notice = null;
        this.render();
      }
    } else {
      this.selectStructure(meshId ? content.meshIndex[meshId] || null : null);
    }
  },

  /** Within a region: select a structure, nudging the camera towards its group; null clears the selection. */
  selectStructure(id: string | null): void {
    const v = viewer;
    const s: Structure | null = id && content ? content.structures[id] || null : null;
    if (!v) return;
    if (s && s.region !== st.group) {
      st.group = s.region;
      v.focus({ frame: [s.region], highlight: s.region, frameKinds: FRAME_KINDS });
    }
    st.selected = s ? s.id : null;
    v.select(s ? s.meshes.map((m) => m.id) : null);
    this.render();
  },

  onCardClose(): void {
    st.selected = null;
    st.group = null;
    if (viewer) {
      viewer.select(null);
      if (st.region && st.region.detail) viewer.focus({ frame: st.region.detail.frame, highlight: null, frameKinds: FRAME_KINDS });
    }
    this.render();
  },

  // ---------- layers and list ----------

  toggleKind(kind: string): void {
    st.hidden[kind] = !st.hidden[kind];
    if (viewer) viewer.setKindVisible(kind, !st.hidden[kind]);
  },

  onLayer(ev: WechatMiniprogram.TouchEvent): void {
    this.toggleKind(String(ev.currentTarget.dataset.kind));
    this.render();
  },

  onListOpen(): void {
    if (st.status !== 'ready') return;
    st.listOpen = true;
    this.render();
  },

  onListClose(): void {
    st.listOpen = false;
    this.render();
  },

  onRegionRow(ev: WechatMiniprogram.TouchEvent): void {
    if (!content) return;
    const id = String(ev.currentTarget.dataset.region);
    const side = String(ev.currentTarget.dataset.side) as NodeSide;
    const r = content.regions.filter((x) => x.id === id)[0];
    if (r) this.enterRegion(r, side);
  },

  onStructureRow(ev: WechatMiniprogram.TouchEvent): void {
    if (!content) return;
    const s = content.structures[String(ev.currentTarget.dataset.id)];
    if (!s) return;
    if (st.hidden[s.kind]) this.toggleKind(s.kind);
    st.listOpen = false;
    this.selectStructure(s.id);
  },

  // ---------- benchmark ----------

  runBenchmark(): void {
    const v = viewer;
    if (!v || st.status !== 'ready') {
      finishBenchmark('benchmark skipped: model not loaded');
      return;
    }
    const where = st.level === 'overview' ? 'overview' : st.side + ' ' + (st.region ? st.region.id : '');
    v.benchmark(4, (fps) => finishBenchmark('benchmark ' + fps.toFixed(1) + ' fps, ' + v.stats().drawCalls + ' draw calls, ' + where));
  },

  // ---------- touch ----------

  points(ev: WechatMiniprogram.TouchEvent): { x: number; y: number }[] {
    return ev.touches.map((p) => {
      const c = p as unknown as { x?: number; y?: number; clientX: number; clientY: number };
      return typeof c.x === 'number' && typeof c.y === 'number' ? { x: c.x, y: c.y } : { x: c.clientX - origin.left, y: c.clientY - origin.top };
    });
  },
  onTouchStart(ev: WechatMiniprogram.TouchEvent): void {
    if (viewer) viewer.touchStart(this.points(ev));
  },
  onTouchMove(ev: WechatMiniprogram.TouchEvent): void {
    if (viewer) viewer.touchMove(this.points(ev));
  },
  onTouchEnd(ev: WechatMiniprogram.TouchEvent): void {
    if (viewer) viewer.touchEnd(this.points(ev));
  },

  // ---------- view ----------

  /** Rebuilds everything the template shows from the current state and language. */
  render(): void {
    const l = lang();
    const tr = (key: TextKey) => t(key, l);
    const ready = st.status === 'ready';
    const region = st.region;
    const inRegion = st.level === 'region' && !!region;
    const title = inRegion && region ? regionLabel(region, st.side, l) : tr('body_title');

    let sheet = 'hint';
    let statusText = '';
    let noticeTitle = '';
    let card: CardView | null = null;
    const cur: Structure | null = st.selected && content ? content.structures[st.selected] || null : null;
    if (!ready) {
      sheet = 'status';
      statusText = tr(st.status === 'err_webgl2' ? 'err_webgl2' : st.status === 'err_load' ? 'err_load' : 'loading');
    } else if (st.level === 'overview') {
      if (st.notice) {
        sheet = 'notice';
        noticeTitle = regionLabel(st.notice.region, st.notice.side, l);
      } else sheet = 'ovhint';
    } else if (cur && content) {
      sheet = 'card';
      const rel = related(content, cur.id);
      const links = rel.injuries
        .map((i) => ({ key: 'i:' + i.id, k: tr('related_injuries'), v: i.name[l] }))
        .concat(rel.movements.map((m) => ({ key: 'm:' + m.id, k: tr('related_moves'), v: m.name[l] })));
      card = {
        name: cur.name[l],
        en: l === 'zh' ? cur.name.en : '',
        sep: l === 'zh' && cur.name.la ? ' · ' : '',
        la: cur.name.la || '',
        regionK: tr('region'),
        regionV: tDynamic('group', cur.region, l),
        incK: tr('incidence'),
        incV: typeof cur.incidence === 'number' ? Math.round(cur.incidence * 100) + '%' : '',
        links,
      };
    }

    const regionRows: RowView[] = [];
    const groups: GroupView[] = [];
    if (st.listOpen && content) {
      if (st.level === 'overview') {
        const ordered = content.regions.filter((r) => !!r.detail).concat(content.regions.filter((r) => !r.detail));
        ordered.forEach((r) => {
          const sides: NodeSide[] = r.bilateral ? ['left', 'right'] : ['mid'];
          sides.forEach((s) => {
            regionRows.push({
              key: r.id + ':' + s,
              title: regionLabel(r, s, l),
              sub: r.detail ? '' : tr('status_pending'),
              note: '',
              chevron: !!r.detail,
              current: false,
              id: r.id,
              region: r.id,
              side: s,
            });
          });
        });
      } else if (region && region.detail) {
        const frame = region.detail.frame;
        const all = content.structures;
        const inScope = Object.keys(all)
          .map((k) => all[k])
          .filter((s) => (st.group ? s.region === st.group : frame.indexOf(s.region) >= 0));
        KINDS.forEach((k) => {
          const items = inScope.filter((s) => s.kind === k).sort((a, b) => a.name[l].localeCompare(b.name[l], l));
          if (items.length === 0) return;
          groups.push({
            kind: k,
            color: layerColor(k),
            head: tDynamic('kind', k, l) + ' · ' + items.length,
            note: st.hidden[k] ? ' · ' + tr('list_hidden_layer') : '',
            rows: items.map((s) => ({
              key: s.id,
              title: s.name[l],
              sub: l === 'zh' ? s.name.en : s.name.la || tDynamic('group', s.region, l),
              note: '',
              chevron: true,
              current: s.id === st.selected,
              id: s.id,
              region: s.region,
              side: '',
            })),
          });
        });
      }
    }

    this.setData({
      ready,
      level: st.level,
      title,
      sideRight: st.side === 'right',
      tx: {
        back: tr('back_body'),
        backLabel: tr('back_body_label'),
        reset: tr('reset_view'),
        sideLabel: tr('side_switch'),
        sideL: tr('side_left'),
        sideR: tr('side_right'),
        list: tr('list_view'),
        credit: tr('credit_short'),
        layers: tr('layers'),
        close: tr('close'),
        ovHint: tr('ov_hint'),
        ovLegend: tr('ov_legend'),
        gestures: tr('hint_gestures'),
        pending: tr('region_pending'),
        hintTitle: tr('hint_title'),
      },
      layers: KINDS.map((k) => ({ kind: k, label: tDynamic('kind', k, l), on: !st.hidden[k], color: layerColor(k) })),
      sheet,
      statusText,
      statusError: st.status !== 'loading' && !ready,
      noticeTitle,
      card,
      listOpen: st.listOpen && !!content,
      listTitle: st.level === 'overview' ? tr('list_regions') : tr('list_title'),
      listScope: st.level === 'overview' ? tr('body_title') : title,
      regionRows,
      groups,
    });
  },
});
