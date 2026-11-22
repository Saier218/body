/** Shapes of the generated files the app loads. The source of truth is content/schema. */
export interface Structure {
  id: string;
  name: { zh: string; en: string; la?: string };
  kind: string;
  region: string;
  meshes: { id: string; side: string }[];
  incidence?: number;
}

export interface Ref {
  id: string;
}

export interface Injury {
  id: string;
  name: { zh: string; en: string };
  structures: { id: string; involvement: string }[];
}

export interface Movement {
  id: string;
  name: { zh: string; en: string };
  structures: { id: string }[];
}

export interface Region {
  id: string;
  name: { zh: string; en: string };
  bilateral: boolean;
  detail?: { model: string; side: 'left' | 'right'; frame: string[] };
}

/** One node of the whole-body overview model. */
export interface OverviewNode {
  id: string;
  region: string;
  side: 'left' | 'right' | 'mid';
  kind: string;
}

export interface ContentBundle {
  regions: Region[];
  structures: Record<string, Structure>;
  meshIndex: Record<string, string>;
  injuries: Record<string, Injury>;
  movements: Record<string, Movement>;
}

export interface CatalogEntry {
  id: string;
  kind: string;
  group: string;
}

/** Layer order, which is also the order of the layer chips. */
export const KINDS = ['bone', 'muscle', 'fascia', 'pulley'];

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return (await r.json()) as T;
}

async function getGlb(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.arrayBuffer();
}

export async function loadOverview(): Promise<{ glb: ArrayBuffer; nodes: OverviewNode[]; content: ContentBundle }> {
  const [glb, nodes, content] = await Promise.all([
    getGlb('./models/body_overview.glb'),
    getJson<OverviewNode[]>('./models/body_overview.regions.json'),
    getJson<ContentBundle>('./content/bundle.json'),
  ]);
  return { glb, nodes, content };
}

export async function loadDetail(model: string): Promise<{ glb: ArrayBuffer; catalog: CatalogEntry[] }> {
  const [glb, catalog] = await Promise.all([getGlb(`./models/${model}.glb`), getJson<CatalogEntry[]>(`./models/${model}.catalog.json`)]);
  return { glb, catalog };
}

/** Shipped injuries and movements that mention a structure (drafts never reach the bundle). */
export function related(content: ContentBundle, structureId: string): { injuries: Injury[]; movements: Movement[] } {
  return {
    injuries: Object.values(content.injuries).filter((i) => i.structures.some((s) => s.id === structureId)),
    movements: Object.values(content.movements).filter((m) => m.structures.some((s) => s.id === structureId)),
  };
}
