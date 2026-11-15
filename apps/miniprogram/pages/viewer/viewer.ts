import { t, tDynamic, Lang, TextKey } from '../../i18n';

// The 3D core is built from packages/viewer-core into one file (npm run build:core).
interface CatalogEntry { id: string; name_en: string; name_zh: string | null; kind: string; group: string; incidence?: number }
interface Core {
  createViewer(opts: { canvas: unknown; width: number; height: number; pixelRatio: number }): ViewerApi;
}
interface ViewerApi {
  onTap: (id: string | null) => void;
  load(glb: ArrayBuffer, catalog: CatalogEntry[]): void;
  touchStart(p: { x: number; y: number }[]): void;
  touchMove(p: { x: number; y: number }[]): void;
  touchEnd(p: { x: number; y: number }[]): void;
  select(id: string | null): void;
  focusGroup(group: string | null): void;
  setKindVisible(kind: string, visible: boolean): void;
  stats(): { glVersion: string; meshes: number; triangles: number; drawCalls: number };
  benchmark(seconds: number, done: (fps: number) => void): void;
  dispose(): void;
}
// eslint-disable-next-line @typescript-eslint/no-var-requires
const core: Core = require('../../libs/viewer-core.js');

const MODEL = '/models/hand_right.glb.br';
const CATALOG = '/models/hand_right.catalog.json';
const KINDS = ['bone', 'muscle', 'fascia', 'pulley'];
const TEXT_KEYS: TextKey[] = ['back', 'lang', 'diagnostics'];

let viewer: ViewerApi | null = null;
let catalog: CatalogEntry[] = [];
let origin = { left: 0, top: 0 };
let selectedId: string | null = null;
const hidden: Record<string, boolean> = {};
const facts: string[] = [];

Page({
  data: {
    lang: 'zh' as Lang,
    // The docs list webgl2 for getContext but not for the component's type attribute, so try both.
    canvasType: 'webgl2',
    showCanvas: true,
    text: {} as Record<string, string>,
    title: '',
    subtitle: '',
    focused: '',
    benchLabel: '',
    layers: [] as { kind: string; label: string; on: boolean }[],
    diag: [] as string[],
  },

  onReady() {
    this.relabel();
    this.setData({ title: t('loading', this.data.lang) });
    this.init();
  },

  init() {
    const started = Date.now();
    wx.createSelectorQuery().select('#gl').fields({ node: true, size: true, rect: true }).exec((res) => {
      const info = res && res[0];
      if (!info || !info.node) { this.fail('canvas node not found'); return; }
      origin = { left: info.left || 0, top: info.top || 0 };
      const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const dpr = Math.min(2, win.pixelRatio || 1);
      const base = wx.getAppBaseInfo ? wx.getAppBaseInfo().SDKVersion : '';
      const device = wx.getDeviceInfo ? wx.getDeviceInfo() : null;
      facts.push('lib ' + base + ' | ' + (device ? device.platform + ' ' + device.model : ''));
      facts.push('canvas type=' + this.data.canvasType + ' ' + info.width + 'x' + info.height + ' @' + dpr + 'x');
      try {
        viewer = core.createViewer({ canvas: info.node, width: info.width, height: info.height, pixelRatio: dpr });
      } catch (e) {
        const msg = String((e as Error).message || e);
        if (msg === 'WEBGL2_UNAVAILABLE' && this.data.canvasType === 'webgl2') {
          facts.push('type=webgl2 gave no WebGL2 context, retrying with type=webgl');
          this.setData({ showCanvas: false }, () => this.setData({ showCanvas: true, canvasType: 'webgl' }, () => this.init()));
          return;
        }
        this.fail(msg === 'WEBGL2_UNAVAILABLE' ? t('err_webgl2', this.data.lang) : 'createViewer: ' + msg);
        return;
      }
      viewer.onTap = (id) => this.onPick(id);
      const fs = wx.getFileSystemManager();
      fs.readFile({
        filePath: CATALOG,
        encoding: 'utf8',
        success: (c) => {
          catalog = JSON.parse(c.data as string) as CatalogEntry[];
          fs.readCompressedFile({
            filePath: MODEL,
            compressionAlgorithm: 'br',
            success: (m) => {
              const read = Date.now();
              try {
                viewer!.load(m.data, catalog);
              } catch (e) {
                this.fail('load: ' + String((e as Error).message || e));
                return;
              }
              const s = viewer!.stats();
              facts.push('GL ' + s.glVersion);
              facts.push(s.meshes + ' meshes, ' + s.triangles + ' triangles');
              facts.push('read+unpack ' + (read - started) + ' ms, build ' + (Date.now() - read) + ' ms');
              this.setData({ title: t('ready', this.data.lang), diag: facts.slice() });
            },
            fail: (err) => this.fail('readCompressedFile: ' + err.errMsg),
          });
        },
        fail: (err) => this.fail('readFile: ' + err.errMsg),
      });
    });
  },

  onUnload() {
    if (viewer) viewer.dispose();
    viewer = null;
  },

  relabel() {
    const lang = this.data.lang;
    const text: Record<string, string> = {};
    TEXT_KEYS.forEach((k) => { text[k] = t(k, lang); });
    this.setData({
      text,
      benchLabel: t('benchmark', lang),
      layers: KINDS.map((kind) => ({ kind, label: tDynamic('kind', kind, lang), on: !hidden[kind] })),
    });
    this.describe();
  },

  describe() {
    const lang = this.data.lang;
    const e = catalog.find((c) => c.id === selectedId);
    if (!e) {
      if (viewer && catalog.length) this.setData({ title: t('ready', lang), subtitle: '' });
      return;
    }
    const name = lang === 'zh' ? (e.name_zh || e.name_en + ' ' + t('noZh', lang)) : e.name_en;
    let sub = t('group', lang) + ': ' + tDynamic('group', e.group, lang);
    if (typeof e.incidence === 'number') sub += '  ·  ' + t('incidence', lang) + ' ' + Math.round(e.incidence * 100) + '%';
    this.setData({ title: name, subtitle: sub });
  },

  // First tap on a structure zooms into its region; taps inside the region select structures.
  onPick(id: string | null) {
    if (!viewer) return;
    const e = id ? catalog.find((c) => c.id === id) : null;
    if (e && this.data.focused !== e.group) {
      viewer.focusGroup(e.group);
      this.setData({ focused: e.group });
    }
    selectedId = e ? e.id : null;
    viewer.select(selectedId);
    this.describe();
  },

  onBack() {
    if (!viewer) return;
    selectedId = null;
    viewer.select(null);
    viewer.focusGroup(null);
    this.setData({ focused: '' });
    this.describe();
  },

  onToggleLayer(ev: WechatMiniprogram.TouchEvent) {
    const kind = ev.currentTarget.dataset.kind as string;
    hidden[kind] = !hidden[kind];
    if (viewer) viewer.setKindVisible(kind, !hidden[kind]);
    this.relabel();
  },

  onToggleLang() {
    this.setData({ lang: this.data.lang === 'zh' ? 'en' : 'zh' });
    this.relabel();
  },

  onBenchmark() {
    if (!viewer) return;
    this.setData({ benchLabel: t('benchmarking', this.data.lang) });
    viewer.benchmark(4, (fps) => {
      facts.push('benchmark ' + fps.toFixed(1) + ' fps, ' + viewer!.stats().drawCalls + ' draw calls');
      this.setData({ benchLabel: t('benchmark', this.data.lang), diag: facts.slice() });
    });
  },

  points(ev: WechatMiniprogram.TouchEvent) {
    return ev.touches.map((p) => {
      const c = p as unknown as { x?: number; y?: number; clientX: number; clientY: number };
      return typeof c.x === 'number' && typeof c.y === 'number' ? { x: c.x, y: c.y } : { x: c.clientX - origin.left, y: c.clientY - origin.top };
    });
  },
  onTouchStart(ev: WechatMiniprogram.TouchEvent) { if (viewer) viewer.touchStart(this.points(ev)); },
  onTouchMove(ev: WechatMiniprogram.TouchEvent) { if (viewer) viewer.touchMove(this.points(ev)); },
  onTouchEnd(ev: WechatMiniprogram.TouchEvent) { if (viewer) viewer.touchEnd(this.points(ev)); },

  fail(message: string) {
    facts.push('ERROR ' + message);
    this.setData({ title: message, subtitle: '', diag: facts.slice() });
  },
});
