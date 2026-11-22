/** Shapes of the generated files the app loads. The source of truth is content/schema. */
export type Lang = 'zh' | 'en';

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

export interface ContentBundle {
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

/** Groups that make up "the hand" for the first screen. */
export const HAND_GROUPS = ['thumb', 'index', 'middle', 'ring', 'little', 'palm', 'wrist'];

/** Layer order, which is also the order of the layer chips. */
export const KINDS = ['bone', 'muscle', 'fascia', 'pulley'];

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return (await r.json()) as T;
}

export async function loadAll(): Promise<{ glb: ArrayBuffer; catalog: CatalogEntry[]; content: ContentBundle }> {
  const [glb, catalog, content] = await Promise.all([
    fetch('./models/hand_right.glb').then((r) => {
      if (!r.ok) throw new Error(`model: HTTP ${r.status}`);
      return r.arrayBuffer();
    }),
    getJson<CatalogEntry[]>('./models/hand_right.catalog.json'),
    getJson<ContentBundle>('./content/bundle.json'),
  ]);
  return { glb, catalog, content };
}

/** Shipped injuries and movements that mention a structure (drafts never reach the bundle). */
export function related(content: ContentBundle, structureId: string): { injuries: Injury[]; movements: Movement[] } {
  return {
    injuries: Object.values(content.injuries).filter((i) => i.structures.some((s) => s.id === structureId)),
    movements: Object.values(content.movements).filter((m) => m.structures.some((s) => s.id === structureId)),
  };
}
