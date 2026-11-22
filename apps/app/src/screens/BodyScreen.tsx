import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createViewer, type Viewer } from '../../../../packages/viewer-core/src';
import { Icon } from '../components/Icon';
import { SideSwitch, type Side } from '../components/SideSwitch';
import {
  KINDS,
  loadDetail,
  loadOverview,
  related,
  type CatalogEntry,
  type ContentBundle,
  type OverviewNode,
  type Region,
  type Structure,
} from '../content';
import { hostCanvas } from '../host';
import { useT, type TextKey } from '../i18n';
import { bindPointers } from '../pointer';

/** Fit the camera to bones and pulleys: long muscles would stretch a region up the arm. */
const FRAME_KINDS = ['bone', 'pulley'];
/** Front view of the whole body, seen from slightly above. */
const FRONT = { theta: 0, phi: 1.47 };
/** Time the camera takes to fly towards a region before the detailed model replaces the overview. */
const FLY_MS = 400;

type Level = 'overview' | 'region';
type Status = 'loading' | 'ready' | 'err_webgl2' | 'err_load';
type Detail = { glb: ArrayBuffer; catalog: CatalogEntry[] };

function token(name: string): number | undefined {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return /^#[0-9a-f]{6}$/i.test(v) ? parseInt(v.slice(1), 16) : undefined;
}

function cssSize(el: HTMLElement): { width: number; height: number } {
  const r = el.getBoundingClientRect();
  return { width: Math.round(r.width), height: Math.round(r.height) };
}

/** Overview nodes as the viewer sees them: regions without a page get the muted "idle" colours. */
function overviewCatalog(nodes: OverviewNode[], regions: Region[]): CatalogEntry[] {
  const active = new Set(regions.filter((r) => r.detail).map((r) => r.id));
  return nodes.map((n) => ({ id: n.id, kind: active.has(n.region) ? n.kind : `idle-${n.kind}`, group: `${n.region}:${n.side}` }));
}

interface Props {
  hidden: boolean;
  report: (line: string) => void;
  benchRequest: number;
  onBenchDone: (line: string) => void;
}

export function BodyScreen({ hidden, report, benchRequest, onBenchDone }: Props) {
  const { t, td, lang } = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const overviewRef = useRef<{ glb: ArrayBuffer; catalog: CatalogEntry[]; nodes: OverviewNode[] } | null>(null);
  const detailsRef = useRef(new Map<string, Promise<Detail>>());
  const flyTimer = useRef(0);

  const [status, setStatus] = useState<Status>('loading');
  const [content, setContent] = useState<ContentBundle | null>(null);
  const [level, setLevel] = useState<Level>('overview');
  const [region, setRegion] = useState<Region | null>(null);
  const [side, setSide] = useState<Side>('left');
  const [notice, setNotice] = useState<{ region: Region; side: OverviewNode['side'] } | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hiddenKinds, setHiddenKinds] = useState<ReadonlySet<string>>(new Set());
  const [listOpen, setListOpen] = useState(false);

  const regions = content?.regions ?? [];
  const current: Structure | null = (selected && content?.structures[selected]) || null;

  const regionLabel = useCallback(
    (r: Region, s: OverviewNode['side']) =>
      !r.bilateral || s === 'mid'
        ? r.name[lang]
        : lang === 'zh'
          ? t(s === 'left' ? 'side_word_left' : 'side_word_right') + r.name.zh
          : `${t(s === 'left' ? 'side_word_left' : 'side_word_right')} ${r.name.en}`,
    [lang, t],
  );

  const detailFor = useCallback((model: string) => {
    let p = detailsRef.current.get(model);
    if (!p) {
      p = loadDetail(model);
      detailsRef.current.set(model, p);
    }
    return p;
  }, []);

  /** Fly into a region; regions without a page only show a notice. */
  const enterRegion = useCallback(
    (r: Region, s: OverviewNode['side']) => {
      const viewer = viewerRef.current;
      if (!viewer) return;
      if (!r.detail) {
        setNotice({ region: r, side: s });
        return;
      }
      const d = r.detail;
      const targetSide: Side = s === 'mid' ? d.side : s;
      setNotice(null);
      setListOpen(false);
      viewer.focus({ frame: [`${r.id}:${s}`], highlight: null });
      const started = Date.now();
      window.clearTimeout(flyTimer.current);
      detailFor(d.model)
        .then((detail) => {
          flyTimer.current = window.setTimeout(
            () => {
              viewer.clear();
              viewer.load(detail.glb, detail.catalog);
              viewer.setMirrored(targetSide !== d.side);
              viewer.focus({ frame: d.frame, highlight: null, frameKinds: FRAME_KINDS, instant: true });
              hiddenKinds.forEach((k) => viewer.setKindVisible(k, false));
              setRegion(r);
              setSide(targetSide);
              setGroup(null);
              setSelected(null);
              setLevel('region');
            },
            Math.max(0, FLY_MS - (Date.now() - started)),
          );
        })
        .catch((e: unknown) => {
          setStatus('err_load');
          report('ERROR ' + String((e as Error)?.message ?? e));
        });
    },
    [detailFor, hiddenKinds, report],
  );

  const backToOverview = () => {
    const viewer = viewerRef.current;
    const ov = overviewRef.current;
    if (!viewer || !ov) return;
    window.clearTimeout(flyTimer.current);
    viewer.clear();
    viewer.load(ov.glb, ov.catalog);
    viewer.setOrbit(FRONT.theta, FRONT.phi);
    if (region) viewer.focus({ frame: [`${region.id}:${region.bilateral ? side : 'mid'}`], highlight: null, instant: true });
    viewer.focus({ frame: null, highlight: null });
    setLevel('overview');
    setRegion(null);
    setGroup(null);
    setSelected(null);
    setListOpen(false);
  };

  const resetOverview = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    setNotice(null);
    viewer.setOrbit(FRONT.theta, FRONT.phi);
    viewer.focus({ frame: null, highlight: null });
  };

  /** Within a region: select a structure, nudging the camera towards its group; null clears the selection. */
  const selectStructure = useCallback(
    (id: string | null) => {
      const viewer = viewerRef.current;
      const s = id && content ? content.structures[id] : null;
      if (!viewer) return;
      if (s && s.region !== group) {
        setGroup(s.region);
        viewer.focus({ frame: [s.region], highlight: s.region, frameKinds: FRAME_KINDS });
      }
      setSelected(s ? s.id : null);
      viewer.select(s ? s.meshes.map((m) => m.id) : null);
    },
    [content, group],
  );

  const closeCard = () => {
    setSelected(null);
    setGroup(null);
    viewerRef.current?.select(null);
    if (region?.detail) viewerRef.current?.focus({ frame: region.detail.frame, highlight: null, frameKinds: FRAME_KINDS });
  };

  const changeSide = (s: Side) => {
    setSide(s);
    if (region?.detail) viewerRef.current?.setMirrored(s !== region.detail.side);
  };

  // The viewer's tap callback is set once; it always calls the latest handler through this ref.
  const pickRef = useRef<(meshId: string | null) => void>(() => {});
  useEffect(() => {
    pickRef.current = (meshId) => {
      if (!content) return;
      if (level === 'overview') {
        const node = meshId ? overviewRef.current?.nodes.find((n) => n.id === meshId) : undefined;
        const r = node && content.regions.find((x) => x.id === node.region);
        if (r && node) enterRegion(r, node.side);
        else setNotice(null);
      } else {
        selectStructure(meshId ? (content.meshIndex[meshId] ?? null) : null);
      }
    };
  }, [content, level, enterRegion, selectStructure]);

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    let cancelled = false;
    const size = cssSize(canvas);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const colors: Record<string, number> = {};
    for (const k of KINDS) {
      const c = token(`--c-layer-${k}`);
      if (c !== undefined) colors[k] = c;
    }
    for (const k of ['bone', 'muscle']) {
      const c = token(`--c-idle-${k}`);
      if (c !== undefined) colors[`idle-${k}`] = c;
    }
    let viewer: Viewer;
    try {
      viewer = createViewer({
        canvas: hostCanvas(canvas),
        width: Math.max(1, size.width),
        height: Math.max(1, size.height),
        pixelRatio: dpr,
        background: null,
        colors,
        selectColor: token('--c-accent'),
      });
    } catch (e) {
      setStatus((e as Error).message === 'WEBGL2_UNAVAILABLE' ? 'err_webgl2' : 'err_load');
      report('ERROR ' + String((e as Error).message ?? e));
      return;
    }
    viewerRef.current = viewer;
    viewer.onTap = (id) => pickRef.current(id);
    const unbind = bindPointers(canvas, viewer);
    const ro = new ResizeObserver(() => {
      const s = cssSize(canvas);
      if (s.width > 1 && s.height > 1) viewer.resize(s.width, s.height); // a hidden tab reports 0x0
    });
    ro.observe(canvas);
    const started = performance.now();
    loadOverview()
      .then(({ glb, nodes, content: bundle }) => {
        if (cancelled) return;
        const fetched = performance.now();
        const catalog = overviewCatalog(nodes, bundle.regions);
        overviewRef.current = { glb, catalog, nodes };
        viewer.load(glb, catalog);
        viewer.setOrbit(FRONT.theta, FRONT.phi);
        const s = viewer.stats();
        report(`canvas ${size.width}x${size.height} @${dpr}x`);
        report(`GL ${s.glVersion}`);
        report(`overview: ${s.meshes} parts, ${s.triangles} triangles`);
        report(`fetch ${Math.round(fetched - started)} ms, build ${Math.round(performance.now() - fetched)} ms`);
        setContent(bundle);
        setStatus('ready');
        // fetch region models in the background so entering a region does not wait for the network
        for (const r of bundle.regions) if (r.detail) void detailFor(r.detail.model).catch(() => {});
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setStatus('err_load');
        report('ERROR ' + String((e as Error)?.message ?? e));
      });
    return () => {
      cancelled = true;
      window.clearTimeout(flyTimer.current);
      ro.disconnect();
      unbind();
      viewer.dispose();
      viewerRef.current = null;
    };
  }, [report, detailFor]);

  useEffect(() => {
    if (benchRequest === 0) return;
    // wait two frames so the tab is visible and the canvas has its real size again
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => {
        const viewer = viewerRef.current;
        if (!viewer || status !== 'ready') {
          onBenchDone('benchmark skipped: model not loaded');
          return;
        }
        const where = level === 'overview' ? 'overview' : `${side} ${region?.id}`;
        viewer.benchmark(4, (fps) => onBenchDone(`benchmark ${fps.toFixed(1)} fps, ${viewer.stats().drawCalls} draw calls, ${where}`));
      });
    });
    return () => cancelAnimationFrame(id);
    // Deliberately keyed on the request counter only: a new request starts a run, nothing else does.
  }, [benchRequest]);

  const toggleKind = (kind: string) => {
    const next = new Set(hiddenKinds);
    if (next.has(kind)) next.delete(kind);
    else next.add(kind);
    setHiddenKinds(next);
    viewerRef.current?.setKindVisible(kind, !next.has(kind));
  };

  const inScope = useMemo(() => {
    if (!content || !region?.detail) return [];
    const frame = region.detail.frame;
    return Object.values(content.structures).filter((s) => (group ? s.region === group : frame.includes(s.region)));
  }, [content, region, group]);

  const pickFromList = (s: Structure) => {
    if (hiddenKinds.has(s.kind)) toggleKind(s.kind);
    setListOpen(false);
    selectStructure(s.id);
  };

  const rel = current && content ? related(content, current.id) : null;
  const statusText: TextKey | null = status === 'loading' ? 'loading' : status === 'ready' ? null : status;
  const title = level === 'region' && region ? regionLabel(region, side) : t('body_title');

  return (
    <section className="screen screen--body" hidden={hidden} aria-hidden={hidden}>
      <header className="topbar">
        {level === 'region' ? (
          <button type="button" className="back" id="back" aria-label={t('back_body_label')} onClick={backToOverview}>
            <Icon name="back" />
            {t('back_body')}
          </button>
        ) : null}
        <h1 className="topbar__title" id="body-title">
          {title}
        </h1>
        {level === 'region' ? (
          <SideSwitch side={side} onChange={changeSide} />
        ) : (
          <button
            type="button"
            className="icon-btn"
            id="reset"
            aria-label={t('reset_view')}
            onClick={resetOverview}
            disabled={status !== 'ready'}
          >
            <Icon name="reset" />
          </button>
        )}
      </header>

      <div className="body-main">
        <div className="stage">
          <canvas ref={canvasRef} id="gl" />
          <div className="stage__top">
            <button
              type="button"
              className="chip chip--quiet"
              id="list-open"
              onClick={() => setListOpen(true)}
              disabled={status !== 'ready'}
            >
              <Icon name="list" small />
              {t('list_view')}
            </button>
          </div>
          <div className="stage__bottom">
            <p className="credit">{t('credit_short')}</p>
            {level === 'region' && (
              <div className="layers" role="group" aria-label={t('layers')}>
                {KINDS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="chip"
                    data-kind={k}
                    aria-pressed={!hiddenKinds.has(k)}
                    onClick={() => toggleKind(k)}
                  >
                    <i className="swatch" style={{ background: `var(--c-layer-${k})` }} />
                    {td('kind', k)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="sheet" aria-live="polite" id="sheet">
          {statusText ? (
            <p className={status === 'loading' ? 'sheet__hint-title' : 'sheet__error'} id="sheet-title">
              {t(statusText)}
            </p>
          ) : level === 'overview' ? (
            notice ? (
              <>
                <p className="sheet__hint-title" id="sheet-title">
                  {regionLabel(notice.region, notice.side)}
                </p>
                <p className="sheet__hint">{t('region_pending')}</p>
              </>
            ) : (
              <>
                <p className="sheet__hint-title" id="sheet-title">
                  {t('ov_hint')}
                </p>
                <p className="sheet__hint">{t('ov_legend')}</p>
                <p className="sheet__hint">{t('hint_gestures')}</p>
              </>
            )
          ) : current ? (
            <>
              <div className="sheet__head">
                <div>
                  <h2 className="sheet__title" id="sheet-title">
                    {current.name[lang]}
                  </h2>
                  <p className="sheet__latin">
                    {lang === 'zh' && <span lang="en">{current.name.en}</span>}
                    {lang === 'zh' && current.name.la && ' · '}
                    {current.name.la && <i lang="la">{current.name.la}</i>}
                  </p>
                </div>
                <button type="button" className="sheet__close" id="card-close" aria-label={t('close')} onClick={closeCard}>
                  <Icon name="close" />
                </button>
              </div>
              <div className="facts">
                <span className="fact">
                  <span className="fact__k">{t('region')}</span>
                  <b className="fact__v">{td('group', current.region)}</b>
                </span>
                {typeof current.incidence === 'number' && (
                  <span className="fact">
                    <span className="fact__k">{t('incidence')}</span>
                    <b className="fact__v">{Math.round(current.incidence * 100)}%</b>
                  </span>
                )}
              </div>
              {rel && rel.injuries.length + rel.movements.length > 0 && (
                <ul className="links">
                  {rel.injuries.map((i) => (
                    <li key={i.id} className="link">
                      <span className="link__k">{t('related_injuries')}</span>
                      <span className="link__v">{i.name[lang]}</span>
                    </li>
                  ))}
                  {rel.movements.map((m) => (
                    <li key={m.id} className="link">
                      <span className="link__k">{t('related_moves')}</span>
                      <span className="link__v">{m.name[lang]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <p className="sheet__hint-title" id="sheet-title">
                {t('hint_title')}
              </p>
              <p className="sheet__hint">{t('hint_gestures')}</p>
            </>
          )}
        </section>

        {listOpen && content && (
          <section className="listview" id="listview" aria-label={level === 'overview' ? t('list_regions') : t('list_title')}>
            <header className="listview__head">
              <div>
                <h2 className="listview__title">{level === 'overview' ? t('list_regions') : t('list_title')}</h2>
                <p className="listview__scope">{level === 'overview' ? t('body_title') : title}</p>
              </div>
              <button type="button" className="sheet__close" aria-label={t('close')} onClick={() => setListOpen(false)}>
                <Icon name="close" />
              </button>
            </header>
            <div className="listview__body">
              {level === 'overview' ? (
                <ul>
                  {[...regions]
                    .sort((a, b) => Number(!!b.detail) - Number(!!a.detail))
                    .flatMap((r): [Region, OverviewNode['side']][] =>
                      r.bilateral
                        ? [
                            [r, 'left'],
                            [r, 'right'],
                          ]
                        : [[r, 'mid']],
                    )
                    .map(([r, s]) => (
                      <li key={`${r.id}:${s}`}>
                        <button type="button" className="row" data-region={`${r.id}:${s}`} onClick={() => enterRegion(r, s)}>
                          <span className="row__main">
                            <span className="row__title">{regionLabel(r, s)}</span>
                            {!r.detail && <span className="row__sub">{t('status_pending')}</span>}
                          </span>
                          {r.detail && <Icon name="chevron" small />}
                        </button>
                      </li>
                    ))}
                </ul>
              ) : (
                KINDS.map((k) => {
                  const items = inScope.filter((s) => s.kind === k).sort((a, b) => a.name[lang].localeCompare(b.name[lang], lang));
                  if (items.length === 0) return null;
                  return (
                    <section key={k}>
                      <h3 className="listgroup__title">
                        <i className="swatch" style={{ background: `var(--c-layer-${k})` }} />
                        {td('kind', k)} · {items.length}
                        {hiddenKinds.has(k) && <span className="row__note"> · {t('list_hidden_layer')}</span>}
                      </h3>
                      <ul>
                        {items.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              className="row"
                              data-structure={s.id}
                              aria-current={s.id === selected ? 'true' : undefined}
                              onClick={() => pickFromList(s)}
                            >
                              <span className="row__main">
                                <span className="row__title">{s.name[lang]}</span>
                                <span className="row__sub">{lang === 'zh' ? s.name.en : (s.name.la ?? td('group', s.region))}</span>
                              </span>
                              <Icon name="chevron" small />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })
              )}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
