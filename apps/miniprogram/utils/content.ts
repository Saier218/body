/** Shapes of the generated files in the package (source of truth: content/schema) and how to read them. */
export interface Structure {
  id: string;
  name: { zh: string; en: string; la?: string };
  kind: string;
  region: string;
  meshes: { id: string; side: string }[];
  incidence?: number;
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

export interface Detail {
  glb: ArrayBuffer;
  catalog: CatalogEntry[];
}

/** Layer order, which is also the order of the layer chips. */
export const KINDS = ['bone', 'muscle', 'fascia', 'pulley'];

function readJson<T>(filePath: string): Promise<T> {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      encoding: 'utf8',
      success: (res) => {
        try {
          resolve(JSON.parse(res.data as string) as T);
        } catch (e) {
          reject(new Error(filePath + ': ' + String((e as Error).message || e)));
        }
      },
      fail: (err) => reject(new Error(filePath + ': ' + err.errMsg)),
    });
  });
}

/** .glb is not on the upload whitelist, so models ship brotli-compressed and are unpacked on the device. */
function readBr(filePath: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readCompressedFile({
      filePath,
      compressionAlgorithm: 'br',
      success: (res) => resolve(res.data),
      fail: (err) => reject(new Error(filePath + ': ' + err.errMsg)),
    });
  });
}

export function loadOverview(): Promise<{ glb: ArrayBuffer; nodes: OverviewNode[]; content: ContentBundle }> {
  return Promise.all([
    readBr('/models/body_overview.glb.br'),
    readJson<OverviewNode[]>('/models/body_overview.regions.json'),
    readJson<ContentBundle>('/content/bundle.json'),
  ]).then(([glb, nodes, content]) => ({ glb, nodes, content }));
}

export function loadDetail(model: string): Promise<Detail> {
  return Promise.all([readBr('/models/' + model + '.glb.br'), readJson<CatalogEntry[]>('/models/' + model + '.catalog.json')]).then(
    ([glb, catalog]) => ({ glb, catalog }),
  );
}

/** Overview nodes as the viewer sees them: regions without a page get the muted "idle" colours. */
export function overviewCatalog(nodes: OverviewNode[], regions: Region[]): CatalogEntry[] {
  const active: Record<string, boolean> = {};
  regions.forEach((r) => {
    if (r.detail) active[r.id] = true;
  });
  return nodes.map((n) => ({ id: n.id, kind: active[n.region] ? n.kind : 'idle-' + n.kind, group: n.region + ':' + n.side }));
}

/** Shipped injuries and movements that mention a structure (drafts never reach the bundle). */
export function related(content: ContentBundle, structureId: string): { injuries: Injury[]; movements: Movement[] } {
  const values = <T>(o: Record<string, T>): T[] => Object.keys(o).map((k) => o[k]);
  return {
    injuries: values(content.injuries).filter((i) => i.structures.some((s) => s.id === structureId)),
    movements: values(content.movements).filter((m) => m.structures.some((s) => s.id === structureId)),
  };
}
