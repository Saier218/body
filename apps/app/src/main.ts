import { createViewer, type CatalogEntry, type Viewer } from '../../../packages/viewer-core/src';
import { hostCanvas } from './host';
import { t, tDynamic, type Lang } from './i18n';

interface Structure {
  id: string;
  name: { zh: string; en: string; la?: string };
  incidence?: number;
}
interface ContentBundle {
  structures: Record<string, Structure>;
  meshIndex: Record<string, string>;
}

const KINDS = ['bone', 'muscle', 'fascia', 'pulley'];
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('gl');
const el = {
  title: $('title'), subtitle: $('subtitle'), layers: $('layers'), back: $<HTMLButtonElement>('back'),
  bench: $<HTMLButtonElement>('bench'), lang: $<HTMLButtonElement>('lang'), diagTitle: $('diag-title'), diag: $('diag'), credit: $('credit'),
};

let lang: Lang = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
let viewer: Viewer | null = null;
let catalog: CatalogEntry[] = [];
let content: ContentBundle = { structures: {}, meshIndex: {} };
let selectedId: string | null = null;
let focused: string | null = null;
let status: 'loading' | 'ready' | 'error' = 'loading';
let errorText = '';
let benchmarking = false;
const hidden = new Set<string>();
const facts: string[] = [];

function render(): void {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  const e = catalog.find((c) => c.id === selectedId);
  if (status === 'error') {
    el.title.textContent = errorText;
    el.subtitle.textContent = '';
  } else if (status === 'loading') {
    el.title.textContent = t('loading', lang);
    el.subtitle.textContent = '';
  } else if (!e) {
    el.title.textContent = t('ready', lang);
    el.subtitle.textContent = '';
  } else {
    // Names come from the content data, never from the model file: the mesh id is the only link.
    const st = content.structures[content.meshIndex[e.id]];
    el.title.textContent = st ? st.name[lang] : e.id;
    let sub = [lang === 'zh' ? st?.name.en : undefined, st?.name.la].filter(Boolean).join(' · ');
    sub += `${sub ? '\n' : ''}${t('group', lang)}: ${tDynamic('group', e.group, lang)}`;
    if (typeof st?.incidence === 'number') sub += `  ·  ${t('incidence', lang)} ${Math.round(st.incidence * 100)}%`;
    el.subtitle.textContent = sub;
  }
  el.layers.replaceChildren(...KINDS.map((kind) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.dataset.kind = kind;
    b.setAttribute('aria-pressed', String(!hidden.has(kind)));
    b.textContent = tDynamic('kind', kind, lang);
    return b;
  }));
  el.back.textContent = t('back', lang);
  el.back.hidden = focused === null;
  el.bench.textContent = t(benchmarking ? 'benchmarking' : 'benchmark', lang);
  el.lang.textContent = t('lang', lang);
  el.diagTitle.textContent = t('diagnostics', lang);
  el.diag.textContent = facts.join('\n');
  el.credit.textContent = t('credit', lang);
}

function fail(message: string, detail?: unknown): void {
  status = 'error';
  errorText = message;
  if (detail !== undefined) facts.push('ERROR ' + String((detail as Error)?.message ?? detail));
  render();
}

// First tap on a structure zooms into its region; taps inside the region select structures.
function onPick(id: string | null): void {
  if (!viewer) return;
  const e = id ? catalog.find((c) => c.id === id) : undefined;
  if (e && focused !== e.group) {
    focused = e.group;
    viewer.focusGroup(e.group);
  }
  selectedId = e ? e.id : null;
  viewer.select(selectedId);
  render();
}

function canvasSize(): { width: number; height: number } {
  const r = canvas.getBoundingClientRect();
  return { width: Math.max(1, Math.round(r.width)), height: Math.max(1, Math.round(r.height)) };
}

function bindPointers(v: Viewer): void {
  const active = new Map<number, { x: number; y: number }>();
  const points = () => Array.from(active.values());
  const local = (ev: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };
  canvas.addEventListener('pointerdown', (ev) => {
    canvas.setPointerCapture(ev.pointerId);
    active.set(ev.pointerId, local(ev));
    v.touchStart(points());
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!active.has(ev.pointerId)) return;
    active.set(ev.pointerId, local(ev));
    v.touchMove(points());
  });
  const end = (ev: PointerEvent) => {
    if (!active.delete(ev.pointerId)) return;
    v.touchEnd(points());
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}

async function start(): Promise<void> {
  render();
  const started = performance.now();
  const size = canvasSize();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  facts.push(`canvas ${size.width}x${size.height} @${dpr}x`);
  try {
    viewer = createViewer({ canvas: hostCanvas(canvas), width: size.width, height: size.height, pixelRatio: dpr });
  } catch (e) {
    fail((e as Error).message === 'WEBGL2_UNAVAILABLE' ? t('err_webgl2', lang) : t('err_load', lang), e);
    return;
  }
  viewer.onTap = onPick;
  bindPointers(viewer);
  new ResizeObserver(() => { const s = canvasSize(); viewer?.resize(s.width, s.height); }).observe(canvas);
  try {
    const [glb, cat, bundle] = await Promise.all([
      fetch('./models/hand_right.glb').then((r) => { if (!r.ok) throw new Error('model HTTP ' + r.status); return r.arrayBuffer(); }),
      fetch('./models/hand_right.catalog.json').then((r) => { if (!r.ok) throw new Error('catalog HTTP ' + r.status); return r.json() as Promise<CatalogEntry[]>; }),
      fetch('./content/bundle.json').then((r) => { if (!r.ok) throw new Error('content HTTP ' + r.status); return r.json() as Promise<ContentBundle>; }),
    ]);
    content = bundle;
    const fetched = performance.now();
    catalog = cat;
    viewer.load(glb, catalog);
    const s = viewer.stats();
    facts.push(`GL ${s.glVersion}`, `${s.meshes} meshes, ${s.triangles} triangles`,
      `fetch ${Math.round(fetched - started)} ms, build ${Math.round(performance.now() - fetched)} ms`);
    status = 'ready';
    render();
  } catch (e) {
    fail(t('err_load', lang), e);
  }
}

el.layers.addEventListener('click', (ev) => {
  const kind = (ev.target as HTMLElement).closest<HTMLElement>('[data-kind]')?.dataset.kind;
  if (!kind) return;
  if (hidden.has(kind)) hidden.delete(kind); else hidden.add(kind);
  viewer?.setKindVisible(kind, !hidden.has(kind));
  render();
});
el.back.addEventListener('click', () => {
  selectedId = null;
  focused = null;
  viewer?.select(null);
  viewer?.focusGroup(null);
  render();
});
el.lang.addEventListener('click', () => { lang = lang === 'zh' ? 'en' : 'zh'; render(); });
el.bench.addEventListener('click', () => {
  if (!viewer || benchmarking) return;
  benchmarking = true;
  render();
  viewer.benchmark(4, (fps) => {
    facts.push(`benchmark ${fps.toFixed(1)} fps, ${viewer!.stats().drawCalls} draw calls`);
    benchmarking = false;
    render();
  });
});

void start();
