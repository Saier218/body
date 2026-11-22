"""Build the whole-body overview model (decision 0011): bones and muscles only, merged per body region,
side and kind, then heavily simplified. It is a map for choosing a region, not an anatomy model.

Writes:
  OUT.glb             one node per (region, side, kind), e.g. OV_HAND_R_MUSCLE
  OUT.regions.json    [{id, region, side, kind, faces}] for every node

usage: build_overview.py INVENTORY_JSON ELEMENT_PARTS_TXT OBJ_DIR OUT_PREFIX [TARGET_TRIANGLES]
"""
import csv
import json
import os
import re
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # our own helpers; -I keeps the data dir off the path

import numpy as np
import trimesh
from glb_writer import to_app, write_glb

inv_path, parts_path, objdir, out = sys.argv[1:5]
# 36k keeps the overview visually unchanged at phone size and leaves room in the 2 MB mini-program package
TARGET = int(sys.argv[5]) if len(sys.argv) > 5 else 36000
MIN_FACES = 240

inv = {r["file"][:-4]: r for r in json.load(open(inv_path))}
concepts = defaultdict(set)
for row in csv.reader(open(parts_path), delimiter="\t"):
    if len(row) >= 3:
        concepts[row[1]].add(row[2])
# muscles are split across three concept sets in BodyParts3D (whole muscles, heads, and zones such as the parts of pectoralis major)
KIND = {f: "muscle" for f in concepts["muscle organ"] | concepts["head of muscle organ"] | concepts["zone of muscle organ"]}
KIND.update({f: "bone" for f in concepts["bone organ"]})

# Muscles hidden inside the body (throat, palate, ear, eye, diaphragm, pelvic floor): invisible from outside, so they only
# cost triangles. Nothing in the bone and muscle sets is a genital structure; the skin is not used at all.
INTERNAL = re.compile(
    r"pharyn|palat|uvula|tongue|lingu|glossus|tensor tympani|stapedius|ocul|rectus (superior|inferior|medialis|lateralis) bulbi|"
    r"oblique (superior|inferior) of eyeball|levator palpebrae|diaphragm|sphincter|levator ani|coccygeus|pubococcyg|iliococcyg|"
    r"puborect|arytenoid|cricothyroid|thyroarytenoid|vocalis|transversus thoracis|subcostal|intercostal",
    re.I,
)
SHOULDER = re.compile(r"deltoid|supraspinatus|infraspinatus|teres (major|minor)|subscapularis|scapula|clavicle|coracobrachialis", re.I)
TORSO_NAMES = re.compile(r"pectoralis|serratus|latissimus|trapezius|rhomboid|levator scapulae|subclavius|sternum|rib\b|vertebra", re.I)


def region_of(name, c):
    """Region of a mesh from its name and centroid (BodyParts3D: x lateral with the body's right negative, z up, mm)."""
    ax, cz = abs(c[0]), c[2]
    if SHOULDER.search(name):
        return "shoulder"
    if cz > 1420 or (cz > 1360 and ax < 80):
        return "head-neck"
    if TORSO_NAMES.search(name):
        return "torso"
    if ax > 185 and cz < 815:
        return "hand"
    if ax > 165 and cz < 1050:
        return "forearm"
    if ax > 145 and cz < 1285:
        return "upper-arm"
    if ax > 150:
        return "shoulder"
    if cz >= 1000:
        return "torso"
    if cz >= 860:
        return "pelvis"
    if cz >= 480:
        return "thigh"
    if cz >= 90:
        return "lower-leg"
    return "foot"


MIDLINE = {"head-neck", "torso", "pelvis"}
groups = defaultdict(list)
for f, kind in KIND.items():
    r = inv.get(f)
    if not r or not r["name"] or INTERNAL.search(r["name"]):
        continue
    b = r["bounds"]
    c = [(b[i] + b[i + 3]) / 2 for i in range(3)]
    region = region_of(r["name"], c)
    side = "mid" if region in MIDLINE else ("right" if c[0] < 0 else "left")
    groups[(region, side, kind)].append(f)

total = sum(inv[f]["f"] for fs in groups.values() for f in fs)
merged, allv = [], []
for key in sorted(groups):
    ms = [trimesh.load(os.path.join(objdir, f + ".obj"), process=False, force="mesh") for f in groups[key]]
    m = trimesh.util.concatenate(ms)
    m.merge_vertices()
    faces = sum(inv[f]["f"] for f in groups[key])
    target = max(MIN_FACES, round(TARGET * faces / total))
    if len(m.faces) > target:
        m = m.simplify_quadric_decimation(face_count=target)
    merged.append((key, m))
    allv.append(m.vertices)

centre = (np.vstack(allv).min(0) + np.vstack(allv).max(0)) / 2
side_code = {"right": "R", "left": "L", "mid": "M"}
parts, catalog = [], []
for (region, side, kind), m in merged:
    nid = f"OV_{region.upper().replace('-', '_')}_{side_code[side]}_{kind.upper()}"
    parts.append((nid, to_app(m.vertices, centre), m.faces))
    catalog.append(dict(id=nid, region=region, side=side, kind=kind, faces=int(len(m.faces)), sources=len(groups[(region, side, kind)])))

glb, tri = write_glb(out + ".glb", parts, "body build_overview.py")
json.dump(catalog, open(out + ".regions.json", "w"), ensure_ascii=False, indent=1)
for c in catalog:
    print(f"{c['id']:<28} {c['sources']:>3} meshes -> {c['faces']:>6} faces")
print(f"{len(catalog)} parts, {tri} triangles (from {total}); glb {len(glb) / 1e6:.2f} MB")
