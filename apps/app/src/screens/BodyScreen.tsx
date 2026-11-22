import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createViewer, type Viewer } from '../../../../packages/viewer-core/src';
import { Icon } from '../components/Icon';
import { SideSwitch, type Side } from '../components/SideSwitch';
import { HAND_GROUPS, KINDS, loadAll, related, type CatalogEntry, type ContentBundle, type Structure } from '../content';
import { hostCanvas } from '../host';
import { useT, type TextKey } from '../i18n';
import { bindPointers } from '../pointer';

/** The model file holds a right hand; the left hand is shown as its mirror image (decision 0010). */
const MODEL_SIDE: Side = 'right';
const DEFAULT_SIDE: Side = 'left';
/** Fit the camera to bones and pulleys: long muscles would stretch a region up the arm. */
const FRAME_KINDS = ['bone', 'pulley'];

function token(name: string): number | undefined {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return /^#[0-9a-f]{6}$/i.test(v) ? parseInt(v.slice(1), 16) : undefined;
}

function cssSize(el: HTMLElement): { width: number; height: number } {
  const r = el.getBoundingClientRect();
  return { width: Math.round(r.width), height: Math.round(r.height) };
}

interface Props {
  hidden: boolean;
  report: (line: string) => void;
  benchRequest: number;
  onBenchDone: (line: string) => void;
}

type Status = 'loading' | 'ready' | 'err_webgl2' | 'err_load';

export function BodyScreen({ hidden, report, benchRequest, onBenchDone }: Props) {
  const { t, td, lang } = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<{ catalog: CatalogEntry[]; content: ContentBundle } | null>(null);
  const [side, setSide] = useState<Side>(DEFAULT_SIDE);
  const [group, setGroup] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hiddenKinds, setHiddenKinds] = useState<ReadonlySet<string>>(new Set());
  const [listOpen, setListOpen] = useState(false);

  const structures = data?.content.structures;
  const current: Structure | null = (selected && structures?.[selected]) || null;

  /** Select a structure (zooming into its region first if needed); null clears the selection. */
  const selectStructure = useCallback(
    (id: string | null) => {
      const viewer = viewerRef.current;
      const s = id && data ? data.content.structures[id] : null;
      if (!viewer) return;
      if (s && s.region !== group) {
        setGroup(s.region);
        viewer.focus({ frame: [s.region], highlight: s.region, frameKinds: FRAME_KINDS });
      }
      setSelected(s ? s.id : null);
      viewer.select(s ? s.meshes.map((m) => m.id) : null);
    },
    [data, group],
  );

  const goHand = () => {
    setGroup(null);
    setSelected(null);
    viewerRef.current?.select(null);
    viewerRef.current?.focus({ frame: HAND_GROUPS, highlight: null, frameKinds: FRAME_KINDS });
  };
  const goGroup = () => {
    setSelected(null);
    viewerRef.current?.select(null);
  };

  // The viewer's tap callback is set once; it always calls the latest handler through this ref.
  const pickRef = useRef<(meshId: string | null) => void>(() => {});
  useEffect(() => {
    pickRef.current = (meshId) => selectStructure(meshId && data ? (data.content.meshIndex[meshId] ?? null) : null);
  }, [selectStructure, data]);

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    let cancelled = false;
    const size = cssSize(canvas);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let viewer: Viewer;
    try {
      viewer = createViewer({
        canvas: hostCanvas(canvas),
        width: Math.max(1, size.width),
        height: Math.max(1, size.height),
        pixelRatio: dpr,
        background: null,
        colors: Object.fromEntries(KINDS.flatMap((k) => (token(`--c-layer-${k}`) ? [[k, token(`--c-layer-${k}`) as number]] : []))),
        selectColor: token('--c-accent'),
      });
    } catch (e) {
      const webgl = (e as Error).message === 'WEBGL2_UNAVAILABLE';
      setStatus(webgl ? 'err_webgl2' : 'err_load');
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
    loadAll()
      .then(({ glb, catalog, content }) => {
        if (cancelled) return;
        const fetched = performance.now();
        viewer.load(glb, catalog);
        viewer.focus({ frame: HAND_GROUPS, highlight: null, frameKinds: FRAME_KINDS, instant: true });
        const s = viewer.stats();
        report(`canvas ${size.width}x${size.height} @${dpr}x`);
        report(`GL ${s.glVersion}`);
        report(`${s.meshes} meshes, ${s.triangles} triangles`);
        report(`fetch ${Math.round(fetched - started)} ms, build ${Math.round(performance.now() - fetched)} ms`);
        setData({ catalog, content });
        setStatus('ready');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setStatus('err_load');
        report('ERROR ' + String((e as Error)?.message ?? e));
      });
    return () => {
      cancelled = true;
      ro.disconnect();
      unbind();
      viewer.dispose();
      viewerRef.current = null;
    };
  }, [report]);

  // Mirroring is applied only once the geometry exists, and whenever the switch changes.
  useEffect(() => {
    if (status === 'ready') viewerRef.current?.setMirrored(side !== MODEL_SIDE);
  }, [side, status]);

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
        viewer.benchmark(4, (fps) => onBenchDone(`benchmark ${fps.toFixed(1)} fps, ${viewer.stats().drawCalls} draw calls, ${side} hand`));
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
    if (!structures) return [];
    return Object.values(structures).filter((s) => (group ? s.region === group : HAND_GROUPS.includes(s.region)));
  }, [structures, group]);

  const pickFromList = (s: Structure) => {
    if (hiddenKinds.has(s.kind)) toggleKind(s.kind);
    setListOpen(false);
    selectStructure(s.id);
  };

  const rel = current && data ? related(data.content, current.id) : null;
  const statusText: TextKey | null = status === 'loading' ? 'loading' : status === 'ready' ? null : status;

  return (
    <section className="screen screen--body" hidden={hidden} aria-hidden={hidden}>
      <header className="topbar">
        <nav className="crumbs" aria-label={t('crumbs')}>
          {group === null && !current ? (
            <span className="crumb" aria-current="page">
              {t(side === 'left' ? 'hand_left' : 'hand_right')}
            </span>
          ) : (
            <button type="button" className="crumb" id="crumb-root" onClick={goHand}>
              {t(side === 'left' ? 'hand_left' : 'hand_right')}
            </button>
          )}
          {group !== null && (
            <>
              <Icon name="chevron" small />
              {current ? (
                <button type="button" className="crumb" id="crumb-group" onClick={goGroup}>
                  {td('group', group)}
                </button>
              ) : (
                <span className="crumb" aria-current="page">
                  {td('group', group)}
                </span>
              )}
            </>
          )}
          {current && (
            <>
              <Icon name="chevron" small />
              <span className="crumb crumb--leaf" aria-current="page">
                {current.name[lang]}
              </span>
            </>
          )}
        </nav>
        <SideSwitch side={side} onChange={setSide} />
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
          </div>
        </div>

        <section className="sheet" aria-live="polite" id="sheet">
          {statusText ? (
            <p className={status === 'loading' ? 'sheet__hint-title' : 'sheet__error'} id="sheet-title">
              {t(statusText)}
            </p>
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
                <button type="button" className="sheet__close" aria-label={t('close')} onClick={goGroup}>
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

        {listOpen && structures && (
          <section className="listview" id="listview" aria-label={t('list_title')}>
            <header className="listview__head">
              <div>
                <h2 className="listview__title">{t('list_title')}</h2>
                <p className="listview__scope">{group ? td('group', group) : t(side === 'left' ? 'hand_left' : 'hand_right')}</p>
              </div>
              <button type="button" className="sheet__close" aria-label={t('close')} onClick={() => setListOpen(false)}>
                <Icon name="close" />
              </button>
            </header>
            <div className="listview__body">
              {KINDS.map((k) => {
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
              })}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
