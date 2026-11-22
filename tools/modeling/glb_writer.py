"""Writes the minimal GLB subset the app's reader understands (packages/viewer-core/src/glb.ts):
one node per part, float32 POSITION, uint16/uint32 indices, no transforms, ASCII-only JSON."""
import json
import struct

import numpy as np

COPYRIGHT = "Base anatomy: BodyParts3D, (c) The Database Center for Life Science licensed under CC Attribution 4.0 International"


def write_glb(path, parts, generator):
    """parts: iterable of (node_name, vertices float32 (n,3), faces int (m,3)) already in app coordinates."""
    blob, views, accessors, meshes, nodes = bytearray(), [], [], [], []

    def push(data, target):
        while len(blob) % 4:
            blob.append(0)
        views.append(dict(buffer=0, byteOffset=len(blob), byteLength=len(data), target=target))
        blob.extend(data)
        return len(views) - 1

    tri = 0
    for name, v, f in parts:
        v = np.asarray(v, dtype=np.float32)
        f = np.asarray(f)
        assert name.isascii()
        idx = f.astype(np.uint16 if len(v) < 65536 else np.uint32).ravel()
        pv = push(v.tobytes(), 34962)
        accessors.append(dict(bufferView=pv, componentType=5126, count=len(v), type="VEC3", min=v.min(0).tolist(), max=v.max(0).tolist()))
        iv = push(idx.tobytes(), 34963)
        accessors.append(dict(bufferView=iv, componentType=5123 if idx.dtype == np.uint16 else 5125, count=len(idx), type="SCALAR"))
        meshes.append(dict(primitives=[dict(attributes=dict(POSITION=len(accessors) - 2), indices=len(accessors) - 1)]))
        nodes.append(dict(name=name, mesh=len(meshes) - 1))
        tri += len(f)

    while len(blob) % 4:
        blob.append(0)
    gltf = dict(asset=dict(version="2.0", generator=generator, copyright=COPYRIGHT), scene=0, scenes=[dict(nodes=list(range(len(nodes))))],
                nodes=nodes, meshes=meshes, accessors=accessors, bufferViews=views, buffers=[dict(byteLength=len(blob))])
    js = json.dumps(gltf, separators=(",", ":"), ensure_ascii=True).encode()
    js += b" " * (-len(js) % 4)
    glb = (struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)) + struct.pack("<II", len(js), 0x4E4F534A) + js
           + struct.pack("<II", len(blob), 0x004E4942) + bytes(blob))
    open(path, "wb").write(glb)
    return glb, tri


def to_app(v, centre):
    """BodyParts3D millimetres, Z up -> app coordinates, Y up, centred."""
    v = np.asarray(v, dtype=np.float64) - centre
    return np.c_[v[:, 0], v[:, 2], -v[:, 1]].astype(np.float32)
