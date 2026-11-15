/**
 * Minimal GLB reader for the subset our model pipeline writes:
 * one primitive per node, POSITION (float32) + indices (uint16/uint32), no transforms,
 * no textures, ASCII-only JSON. Kept dependency-free on purpose: the stock glTF loader
 * relies on TextDecoder, Blob and fetch, which a mini-program runtime does not guarantee.
 */
export interface GlbMesh {
  name: string;
  positions: Float32Array;
  indices: Uint16Array | Uint32Array;
}

const MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

interface Accessor {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  type: string;
}
interface BufferView {
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
}
interface Gltf {
  accessors: Accessor[];
  bufferViews: BufferView[];
  meshes: { primitives: { attributes: { POSITION: number }; indices: number }[] }[];
  nodes: { name?: string; mesh?: number; matrix?: number[]; translation?: number[]; rotation?: number[]; scale?: number[] }[];
}

function ascii(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192) as unknown as number[]);
  }
  return s;
}

export function parseGlb(buffer: ArrayBuffer): GlbMesh[] {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== MAGIC) throw new Error('not a GLB file');
  const jsonLen = view.getUint32(12, true);
  if (view.getUint32(16, true) !== CHUNK_JSON) throw new Error('GLB: missing JSON chunk');
  const gltf = JSON.parse(ascii(new Uint8Array(buffer, 20, jsonLen))) as Gltf;
  const binHeader = 20 + jsonLen;
  if (view.getUint32(binHeader + 4, true) !== CHUNK_BIN) throw new Error('GLB: missing BIN chunk');
  const binStart = binHeader + 8;

  const read = (index: number, expectType: string): Float32Array | Uint16Array | Uint32Array => {
    const acc = gltf.accessors[index];
    const bv = gltf.bufferViews[acc.bufferView];
    if (acc.type !== expectType || bv.byteStride) throw new Error('GLB: unsupported accessor layout');
    const offset = binStart + (bv.byteOffset || 0) + (acc.byteOffset || 0);
    const n = acc.count * (expectType === 'VEC3' ? 3 : 1);
    const Ctor = acc.componentType === 5126 ? Float32Array : acc.componentType === 5123 ? Uint16Array : acc.componentType === 5125 ? Uint32Array : null;
    if (!Ctor) throw new Error('GLB: unsupported component type ' + acc.componentType);
    if (offset % Ctor.BYTES_PER_ELEMENT === 0) return new Ctor(buffer, offset, n);
    return new Ctor(buffer.slice(offset, offset + n * Ctor.BYTES_PER_ELEMENT));
  };

  const out: GlbMesh[] = [];
  for (const node of gltf.nodes) {
    if (node.mesh === undefined) continue;
    if (node.matrix || node.translation || node.rotation || node.scale) throw new Error('GLB: node transforms are not supported');
    const prim = gltf.meshes[node.mesh].primitives[0];
    const positions = read(prim.attributes.POSITION, 'VEC3');
    const indices = read(prim.indices, 'SCALAR');
    if (!(positions instanceof Float32Array) || indices instanceof Float32Array) throw new Error('GLB: unexpected attribute types');
    out.push({ name: node.name || '', positions, indices });
  }
  return out;
}
