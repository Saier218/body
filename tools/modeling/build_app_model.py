"""Package a region of the base model plus generated structures for the app.

Writes three files next to OUT_PREFIX:
  .glb         geometry only (float32 positions, uint16/uint32 indices, one node per structure)
  .glb.br      the same file brotli-compressed (".br" is on the mini-program upload whitelist; ".glb" is not)
  .catalog.json  id, names, kind and group for every structure

Coordinates are converted from BodyParts3D (millimetres, Z up) to Y up and centred on the region.

usage: build_app_model.py INVENTORY_JSON OBJ_DIR PULLEYS_GLB OUT_PREFIX APP_PREFIX
(OUT_PREFIX gets the plain .glb for inspection; APP_PREFIX gets the files the app ships.)
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # our own helpers; -I keeps the data dir off the path

import brotli
import numpy as np
import trimesh
from glb_writer import to_app, write_glb

inv = json.load(open(sys.argv[1]))
objdir, pulleys_glb, out, app = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]

# right hand, wrist and forearm
# x upper bound keeps hip muscles (the hand hangs beside the thigh) out of the region
LO, HI = (-340, -270, 600), (-165, -20, 1060)
SKIP = ("artery", "arteri", "vein", "nerve", "venous", "arterial", "lymph", "skin", "branch", "arch", "plexus", "trunk")
BONE = ("phalanx", "metacarpal", "capitate", "hamate", "lunate", "pisiform", "scaphoid", "trapez", "triquetral", "radius", "ulna", "humerus")
CARPAL = ("capitate", "hamate", "lunate", "pisiform", "scaphoid", "trapez", "triquetral", "retinaculum")
DIGIT = [
    ("thumb", ("thumb", "pollicis", "first metacarpal")),
    ("index", ("index finger", "second metacarpal", "indicis")),
    ("middle", ("middle finger", "third metacarpal")),
    ("ring", ("ring finger", "fourth metacarpal")),
    ("little", ("little finger", "fifth metacarpal", "digiti minimi")),
]


def kind_of(n):
    if "retinac" in n or "membrane" in n:
        return "fascia"
    if any(k in n for k in BONE) and not any(k in n for k in ("flexor", "extensor", "pronator", "supinator")):
        return "bone"
    return "muscle"


WRIST_TOP_Z = 820  # just above the proximal carpal row in this model (carpal bones span z 781-812 mm)


def group_of(n, centre_z, top_z):
    # A muscle that reaches above the wrist originates in the forearm, even if it is named after a digit
    # (extensor indicis, abductor pollicis longus): file it under the forearm.
    if top_z > WRIST_TOP_Z and not any(k in n for k in CARPAL):
        return "forearm"
    for g, keys in DIGIT:
        if any(k in n for k in keys) and centre_z < 800:
            return g
    if any(k in n for k in CARPAL):
        return "wrist"
    return "palm" if centre_z < 800 else "forearm"


parts = []  # (id, vertices, faces, catalog entry)
for r in inv:
    b = r["bounds"]
    c = [(b[i] + b[i + 3]) / 2 for i in range(3)]
    n = r["name"].lower()
    if not all(LO[i] <= c[i] <= HI[i] for i in range(3)) or any(s in n for s in SKIP):
        continue
    m = trimesh.load(os.path.join(objdir, r["file"]), process=False, force="mesh")
    pid = "BP3D_" + r["file"][:-4]
    label = r["name"]
    if n.startswith("left "):
        # the dataset labels this right-hand mesh "Left ..."; do not show a wrong side to users
        label = label[5:].capitalize() + " (source label under review)"
    parts.append((pid, m.vertices, m.faces, dict(id=pid, name_en=label, name_zh=None, kind=kind_of(n), group=group_of(n, c[2], b[5]),
                                                 source="BodyParts3D 4.0", fma=r["fma"])))

pm = json.load(open(pulleys_glb[:-4] + ".meta.json"))
ps = trimesh.load(pulleys_glb)
for meta in pm:
    g = ps.geometry[meta["id"]]
    parts.append((meta["id"], g.vertices, g.faces, dict(id=meta["id"], name_en=meta["name_en"], name_zh=meta["name_zh"], kind="pulley",
                                                        group=meta["digit"], source="generated", incidence=meta["incidence"])))

allv = np.vstack([v for _, v, _, _ in parts])
centre = (allv.min(0) + allv.max(0)) / 2
glb, tri = write_glb(out + ".glb", [(pid, to_app(v, centre), f) for pid, v, f, _ in parts], "body build_app_model.py")

br = brotli.compress(glb, quality=11)
open(app + ".glb.br", "wb").write(br)
for prefix in (out, app):
    json.dump([p[3] for p in parts], open(prefix + ".catalog.json", "w"), ensure_ascii=False, separators=(",", ":"))
kinds = {}
for p in parts:
    kinds[p[3]["kind"]] = kinds.get(p[3]["kind"], 0) + 1
print(f"{len(parts)} structures {kinds}, {tri} triangles; glb {len(glb)/1e6:.2f} MB, brotli {len(br)/1e6:.2f} MB")
