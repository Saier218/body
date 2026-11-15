"""Generate finger and thumb flexor pulleys fitted to the BodyParts3D bone and tendon meshes.

Lengths, gaps and incidences come from pulley_params.json (sourced from the literature).
Each band is lofted from per-slice cross-sections of the real bone and tendon meshes, so it
follows the model's anatomy instead of being a primitive ring.

usage: pulleys.py INVENTORY_JSON OBJ_DIR PARAMS_JSON OUT_GLB
"""
import json
import os
import sys

import numpy as np
import trimesh
from shapely.geometry import LineString, MultiPoint

inv = json.load(open(sys.argv[1]))
objdir = sys.argv[2]
P = json.load(open(sys.argv[3]))
out = sys.argv[4]
SC = P["schematic_choices"]
GAP = SC["clearance_mm"]

ZH = {"index": "食指", "middle": "中指", "ring": "环指", "little": "小指", "thumb": "拇指"}


def load(name):
    ms = [trimesh.load(os.path.join(objdir, r["file"]), process=False, force="mesh")
          for r in inv if r["name"].lower() == name.lower()]
    if not ms:
        raise SystemExit(f"mesh not found: {name}")
    return trimesh.util.concatenate(ms)


def axis_of(m, toward):
    v = m.vertices
    c = v.mean(0)
    a = np.linalg.svd(v - c, full_matrices=False)[2][0]
    if np.dot(toward - c, a) < 0:
        a = -a
    t = (v - c) @ a
    return c + a * t.min(), a, float(t.max() - t.min())


def sec_pts(m, o, a, center, rad):
    seg = trimesh.intersections.mesh_plane(m, plane_normal=a, plane_origin=o)
    if len(seg) == 0:
        return np.zeros((0, 3))
    pts = seg.reshape(-1, 3)
    return pts[np.linalg.norm(pts - center, axis=1) < rad]


def fit_chain(items, start, end):
    """items: [(name, length, is_gap)]. Keep pulley lengths, scale gaps so the chain spans start..end."""
    fixed = sum(l for _, l, g in items if not g)
    gaps = sum(l for _, l, g in items if g)
    k = (end - start - fixed) / gaps if gaps > 0 else 1.0
    k_len = 1.0
    if k < 0.15:  # not enough room: keep small gaps and shrink everything proportionally
        k = 0.15
        k_len = (end - start) / (fixed + gaps * k)
    pos, s = {}, start
    for name, l, g in items:
        ll = l * (k * k_len if g else k_len)
        if not g:
            pos[name] = (s, s + ll)
        s += ll
    return pos, k, k_len


class Sheath:
    """Cross-sectional envelope of bone + flexor tendon along a bone axis."""

    def __init__(self, o0, a, bones, tendons):
        self.o0, self.a, self.bones, self.tendons = o0, a, bones, tendons

    def rings(self, ss):
        a, rings, last_tp, extrap = self.a, [], None, 0
        for s in ss:
            o = self.o0 + a * s
            bp = np.vstack([sec_pts(b, o, a, o, 14) for b in self.bones])
            if len(bp) < 3:
                raise SystemExit(f"no bone section at s={s:.1f}")
            bc = bp.mean(0)
            tp = np.vstack([sec_pts(t, o, a, bc, 12) for t in self.tendons])
            if len(tp) < 3:
                if last_tp is None:
                    for back in np.arange(0.5, 10, 0.5):
                        for sgn in (-1, 1):
                            q = np.vstack([sec_pts(t, o + a * back * sgn, a, bc + a * back * sgn, 12) for t in self.tendons])
                            if len(q) >= 3:
                                last_tp = (s + back * sgn, q)
                                break
                        if last_tp is not None:
                            break
                if last_tp is None:
                    raise SystemExit(f"no tendon near s={s:.1f}")
                tp = last_tp[1] + a * (s - last_tp[0])
                extrap += 1
            else:
                last_tp = (s, tp)
            p = tp.mean(0) - bc
            p -= a * np.dot(p, a)
            rings.append(dict(bc=bc, p=p / np.linalg.norm(p), bp=bp, tp=tp))
        p = np.mean([r["p"] for r in rings], 0)
        p -= a * np.dot(p, a)
        p /= np.linalg.norm(p)
        l = np.cross(a, p)
        for r in rings:
            to2 = lambda Q, r=r: np.c_[(Q - r["bc"]) @ l, (Q - r["bc"]) @ p]
            b2, t2 = to2(r["bp"]), to2(r["tp"])
            # attach to the palmar ridges of the bone rather than its widest point
            thr = b2[:, 1].max() - 0.45 * (b2[:, 1].max() - b2[:, 1].min())
            r["thr"] = thr
            r["hull"] = MultiPoint(np.vstack([b2[b2[:, 1] >= thr], t2])).convex_hull
        return rings, p, l, extrap

    def field(self, s0, s1, nr, nt):
        ss = np.linspace(s0, s1, nr)
        rings, p, l, extrap = self.rings(ss)
        C = [np.array(r["hull"].centroid.coords[0]) for r in rings]
        C = [np.mean(C[max(0, i - 2):i + 3], 0) for i in range(nr)]

        def ray(i, th):
            d = np.array([np.sin(th), np.cos(th)])
            hit = LineString([C[i], C[i] + d * 60]).intersection(rings[i]["hull"].exterior)
            if hit.is_empty:
                return 0.0, C[i]
            q = np.array(hit.coords[0]) if hit.geom_type == "Point" else np.array(hit.geoms[0].coords[0])
            return float(np.linalg.norm(q - C[i])), q

        def limit(i, sign):
            floor = rings[i]["hull"].bounds[1] + 0.35  # stop where the envelope turns onto the bone
            for deg in range(30, 150, 3):
                if ray(i, sign * np.radians(deg))[1][1] < floor:
                    return deg - 3
            return 150

        tmax = np.radians(float(np.median([min(limit(i, 1), limit(i, -1)) for i in range(nr)])))
        ths = np.linspace(-tmax, tmax, nt)
        D = np.array([[ray(i, th)[0] for th in ths] for i in range(nr)])
        Ds = D.copy()
        for _ in range(3):
            Q = np.pad(Ds, 1, mode="edge")
            Ds = (Q[:-2, 1:-1] + Q[2:, 1:-1] + Q[1:-1, :-2] + Q[1:-1, 2:] + 2 * Q[1:-1, 1:-1]) / 6
        Ds = np.maximum(Ds, D)

        def point(i, th, off):
            d = np.array([np.sin(th), np.cos(th)])
            q = C[i] + d * (np.interp(th, ths, Ds[i]) + GAP + off)
            return rings[i]["bc"] + l * q[0] + p * q[1]

        return dict(nr=nr, tmax=tmax, point=point, l=l, extrap=extrap, mean_r=float(Ds.mean()))


def loft(inner, outer):
    nr, nt = len(inner), len(inner[0])
    verts, idx, F = [], {}, []
    for i in range(nr):
        for k, grid in enumerate((inner, outer)):
            for j in range(nt):
                idx[(i, k, j)] = len(verts)
                verts.append(grid[i][j])

    def quad(a, b, c, d):
        F.extend([[a, b, c], [a, c, d]])

    for i in range(nr - 1):
        for j in range(nt - 1):
            quad(idx[(i, 1, j)], idx[(i + 1, 1, j)], idx[(i + 1, 1, j + 1)], idx[(i, 1, j + 1)])
            quad(idx[(i, 0, j)], idx[(i, 0, j + 1)], idx[(i + 1, 0, j + 1)], idx[(i + 1, 0, j)])
        for j in (0, nt - 1):
            quad(idx[(i, 0, j)], idx[(i + 1, 0, j)], idx[(i + 1, 1, j)], idx[(i, 1, j)])
    for i in (0, nr - 1):
        for j in range(nt - 1):
            quad(idx[(i, 0, j)], idx[(i, 1, j)], idx[(i, 1, j + 1)], idx[(i, 0, j + 1)])
    m = trimesh.Trimesh(np.array(verts), np.array(F), process=True)
    m.fix_normals()
    return m


def annular(sh, s0, s1, thick):
    nr, nt = 9, 28
    f = sh.field(s0, s1, nr, nt)
    ths = np.linspace(-f["tmax"], f["tmax"], nt)
    inner, outer = [], []
    for i in range(nr):
        edge = 0.55 + 0.45 * np.sin(np.pi * i / (nr - 1)) ** 0.5       # thinner free margins
        fade = 0.35 + 0.65 * np.cos(ths / f["tmax"] * np.pi / 2) ** 0.6  # tapers into the bony attachment
        inner.append([f["point"](i, th, 0) for th in ths])
        outer.append([f["point"](i, th, thick * edge * fd) for th, fd in zip(ths, fade)])
    return loft(inner, outer), f


def strip(f, direction, half_ang, thick, span=0.92, nt=7):
    """One oblique band crossing the sheath from one side to the other along the slice range."""
    nr, inner, outer = f["nr"], [], []
    for i in range(nr):
        u = i / (nr - 1)
        thc = direction * f["tmax"] * span * (2 * u - 1)
        ths = np.clip(np.linspace(thc - half_ang, thc + half_ang, nt), -f["tmax"], f["tmax"])
        prof = 0.4 + 0.6 * np.sin(np.linspace(0, np.pi, nt)) ** 0.5
        inner.append([f["point"](i, th, 0) for th in ths])
        outer.append([f["point"](i, th, thick * pf) for th, pf in zip(ths, prof)])
    return loft(inner, outer)


def cruciform(sh, s0, s1, thick, width):
    f = sh.field(s0, s1, 13, 28)
    half = (width / 2) / max(f["mean_r"], 1.0)
    return trimesh.util.concatenate([strip(f, 1, half, thick), strip(f, -1, half, thick)]), f


def oblique(sh, s0, s1, axial_len, thick, ulnar_sign):
    """Single oblique band; axial_len is its proximal-distal extent on the midline."""
    f = sh.field(s0, s1, 13, 28)
    span = 0.9
    half = f["tmax"] * span * axial_len / (s1 - s0)
    # proximal end on the ulnar side, distal end on the radial side
    return strip(f, -ulnar_sign, half, thick, span=span, nt=11), f


gen, report = [], []


def add(mesh, f, key, en, zh, kind, digit, s0, s1, length, incidence, source, extra=None):
    meta = dict(id=key, name_en=en, name_zh=zh, kind="pulley", pulley_type=kind, digit=digit,
                length_mm=round(length, 2), incidence=incidence, source=source,
                status="sourced", position_status="derived", faces=int(len(mesh.faces)),
                bounds=[round(float(x), 3) for x in mesh.bounds.flatten()])
    if extra:
        meta.update(extra)
    gen.append((key, mesh, meta))
    note = f" [tendon profile extrapolated at {f['extrap']} slices]" if f["extrap"] else ""
    report.append(f"{en}: s {s0:6.1f}..{s1:6.1f} mm, length {s1 - s0:4.1f}, arc ±{np.degrees(f['tmax']):.0f}°, watertight={mesh.is_watertight}{note}")


# ---------------- fingers ----------------
FP, FG = P["fingers"]["pulleys"], P["fingers"]["gaps"]
ORD = {"index": "second", "middle": "third", "ring": "fourth", "little": "fifth"}
fdp, fds = load("Right flexor digitorum profundus"), load("Right flexor digitorum superficialis")
for fi, finger in enumerate(P["fingers"]["order"]):
    mc = load(f"Right {ORD[finger]} metacarpal bone")
    pp = load(f"Proximal phalanx of right {finger} finger")
    mp = load(f"Middle phalanx of right {finger} finger")
    dp = load(f"Distal phalanx of right {finger} finger")
    bones = [mc, pp, mp, dp]
    L = lambda n: FP[n]["length"][fi]
    G = lambda n: FG[n]["length"][fi] if FG[n]["incidence"] >= 0.5 else 0.0  # a gap seen in under half of fingers is modelled as contiguous
    o_pp, a_pp, len_pp = axis_of(pp, mp.vertices.mean(0))
    o_mp, a_mp, len_mp = axis_of(mp, dp.vertices.mean(0))
    # proximal phalanx: A3 is centred on the PIP joint line; chain A1..C1 proximally from it
    a3 = (len_pp - L("A3") / 2, len_pp + L("A3") / 2)
    chain = [("A1", L("A1"), False), ("g", G("A1-A2"), True), ("A2", L("A2"), False), ("g", G("A2-C1"), True),
             ("C1", L("C1"), False), ("g", G("C1-A3"), True)]
    total = sum(l for _, l, _ in chain)
    start = min(a3[0] - total, -0.25 * L("A1"))  # keep at least a quarter of A1 over the MCP palmar plate
    pos_pp, k1, kl1 = fit_chain(chain, start, a3[0])
    pos_pp["A3"] = a3
    # middle phalanx: A5 begins at the DIP joint line; C2, A4, C3 are fitted between A3 and A5
    a5 = (len_mp - 0.3, len_mp - 0.3 + L("A5"))
    chain = [("g", max(G("A3-C2"), 1.0), True), ("C2", L("C2"), False), ("g", max(G("C2-A4"), 1.0), True),
             ("A4", L("A4"), False), ("g", G("A4-C3"), True), ("C3", L("C3"), False), ("g", max(G("C3-A5"), 1.0), True)]
    pos_mp, k2, kl2 = fit_chain(chain, L("A3") / 2, a5[0])
    pos_mp["A5"] = a5
    report.append(f"-- {finger}: PP {len_pp:.1f} mm (gap scale {k1:.2f}, length scale {kl1:.2f}); MP {len_mp:.1f} mm (gap scale {k2:.2f}, length scale {kl2:.2f})")
    sh_pp, sh_mp = Sheath(o_pp, a_pp, bones, [fdp, fds]), Sheath(o_mp, a_mp, bones, [fdp, fds])
    for name in ["A1", "A2", "C1", "A3", "C2", "A4", "C3", "A5"]:
        sh, (s0, s1) = (sh_pp, pos_pp[name]) if name in pos_pp else (sh_mp, pos_mp[name])
        if name.startswith("A"):
            m, f = annular(sh, s0, s1, SC["annular_thickness_mm"])
            kind = "annular"
        else:
            m, f = cruciform(sh, s0, s1, SC["cruciform_thickness_mm"], SC["cruciform_strip_width_mm"])
            kind = "cruciform"
        add(m, f, f"PULLEY_R_{finger.upper()}_{name}", f"{name} pulley of right {finger} finger",
            f"右手{ZH[finger]} {name} 滑车", kind, finger, s0, s1, s1 - s0, FP[name]["incidence"], P["fingers"]["source"],
            dict(literature_length_mm=L(name)))

# ---------------- thumb ----------------
TP, TG = P["thumb"]["pulleys"], P["thumb"]["gaps"]
mc1, pp1, dp1 = load("Right first metacarpal bone"), load("Proximal phalanx of right thumb"), load("Distal phalanx of right thumb")
fpl = load("Right flexor pollicis longus")
o_t, a_t, len_t = axis_of(pp1, dp1.vertices.mean(0))
sh_t = Sheath(o_t, a_t, [mc1, pp1, dp1], [fpl])
a2 = (len_t - TP["A2"]["length"] / 2, len_t + TP["A2"]["length"] / 2)  # anterior to the IP joint
chain = [("A1", TP["A1"]["length"], False), ("g", TG["A1-Av"], True), ("Av", TP["Av"]["length"], False),
         ("g", TG["Av-oblique"], True), ("oblique", TP["oblique"]["length"], False), ("g", TG["oblique-A2"], True)]
start = min(a2[0] - sum(l for _, l, _ in chain), -0.4 * TP["A1"]["length"])
pos_t, k3, kl3 = fit_chain(chain, start, a2[0])
pos_t["A2"] = a2
report.append(f"-- thumb: PP {len_t:.1f} mm (gap scale {k3:.2f}, length scale {kl3:.2f})")
probe = sh_t.field(pos_t["A1"][0], pos_t["A1"][1], 5, 8)
ulnar_sign = 1.0 if np.dot(probe["l"], load("Right second metacarpal bone").vertices.mean(0) - pp1.vertices.mean(0)) > 0 else -1.0
for name in ["A1", "Av", "oblique", "A2"]:
    s0, s1 = pos_t[name]
    if name in ("A1", "A2"):
        m, f = annular(sh_t, s0, s1, SC["annular_thickness_mm"])
        kind = "annular"
    else:
        pad = 1.6 if name == "oblique" else 0.9  # obliquity: band ends extend past its midline extent
        m, f = oblique(sh_t, s0 - pad, s1 + pad, s1 - s0, SC["annular_thickness_mm"] * 0.8, ulnar_sign)
        kind = "oblique"
    label = "Oblique" if name == "oblique" else name
    zh = "斜行" if name == "oblique" else name + " "
    add(m, f, f"PULLEY_R_THUMB_{name.upper()}", f"{label} pulley of right thumb", f"右手拇指{zh}滑车", kind, "thumb",
        s0, s1, s1 - s0, TP[name].get("incidence", 1.0), P["thumb"]["source"], dict(literature_length_mm=TP[name]["length"]))

sc = trimesh.Scene()
for key, m, _ in gen:
    sc.add_geometry(m, geom_name=key, node_name=key)
sc.export(out)
json.dump([meta for _, _, meta in gen], open(out[:-4] + ".meta.json", "w"), ensure_ascii=False, indent=1)
print("\n".join(report))
print(f"{len(gen)} pulleys, {sum(len(m.faces) for _, m, _ in gen)} faces -> {out}")
