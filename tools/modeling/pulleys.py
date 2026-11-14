"""Fit annular pulley bands (A1-A5) to the actual phalanx and flexor-tendon meshes.
Each band is lofted from per-slice cross-sections: the convex envelope of the bone and
tendon sections, offset outward, limited to the palmar arc. No primitive shapes."""
import sys, json, os, numpy as np, trimesh
from shapely.geometry import MultiPoint, LineString, Point
inv = json.load(open(sys.argv[1])); objdir = sys.argv[2]; base_glb = sys.argv[3]; out = sys.argv[4]
def load(name):
    ms = [trimesh.load(os.path.join(objdir, r['file']), process=False, force='mesh') for r in inv if r['name'].lower() == name.lower()]
    assert ms, name
    return trimesh.util.concatenate(ms)
tendons = [load('Right flexor digitorum profundus'), load('Right flexor digitorum superficialis')]
FINGERS = {'index': 'second', 'middle': 'third', 'ring': 'fourth', 'little': 'fifth'}
# (name, bone whose axis is used, start, end) ; positions are fractions of bone length (f) or mm from a joint (j)
SPEC = [('A1', 'pp', ('mm0', -7.0), ('mm0', 2.5)),
        ('A2', 'pp', ('f', 0.14), ('f', 0.58)),
        ('A3', 'pp', ('mm1', -2.6), ('mm1', 0.8)),
        ('A4', 'mp', ('f', 0.28), ('f', 0.62)),
        ('A5', 'mp', ('mm1', -2.2), ('mm1', 0.6))]
GAP, THICK, NR, NT = 0.18, 0.75, 9, 28
def axis_of(m, toward):
    v = m.vertices; c = v.mean(0)
    a = np.linalg.svd(v - c, full_matrices=False)[2][0]
    if np.dot(toward - c, a) < 0: a = -a
    t = (v - c) @ a
    return c + a * t.min(), a, t.max() - t.min()
def sec_pts(m, o, a, center, rad):
    seg = trimesh.intersections.mesh_plane(m, plane_normal=a, plane_origin=o)
    if len(seg) == 0: return np.zeros((0, 3))
    pts = seg.reshape(-1, 3)
    return pts[np.linalg.norm(pts - center, axis=1) < rad]
gen = []; report = []
for fname, ordn in FINGERS.items():
    mc = load(f'Right {ordn} metacarpal bone'); pp = load(f'Proximal phalanx of right {fname} finger')
    mp = load(f'Middle phalanx of right {fname} finger'); dp = load(f'Distal phalanx of right {fname} finger')
    bones = [mc, pp, mp, dp]
    ax = {'pp': axis_of(pp, mp.vertices.mean(0)), 'mp': axis_of(mp, dp.vertices.mean(0))}
    for pname, bk, s0, s1 in SPEC:
        o0, a, L = ax[bk]
        def pos(s): return {'f': s[1] * L, 'mm0': s[1], 'mm1': L + s[1]}[s[0]]
        ss = np.linspace(pos(s0), pos(s1), NR)
        rings = []; last_tp = None; notes = []
        for s in ss:
            o = o0 + a * s
            bp = np.vstack([sec_pts(b, o, a, o, 14) for b in bones])
            if len(bp) < 3: raise SystemExit(f'no bone section {fname} {pname}')
            bc = bp.mean(0)
            tp = np.vstack([sec_pts(t, o, a, bc, 12) for t in tendons])
            if len(tp) < 3:
                # tendon mesh ends before this slice: carry the nearest tendon profile along the axis
                if last_tp is None:
                    for back in np.arange(0.5, 8, 0.5):
                        q = np.vstack([sec_pts(t, o - a * back, a, bc - a * back, 12) for t in tendons])
                        if len(q) >= 3: last_tp = (s - back, q); break
                if last_tp is None: raise SystemExit(f'no tendon near {fname} {pname}')
                tp = last_tp[1] + a * (s - last_tp[0]); notes.append(round(float(s), 1))
            else: last_tp = (s, tp)
            p = tp.mean(0) - bc; p -= a * np.dot(p, a); p /= np.linalg.norm(p); l = np.cross(a, p)
            to2 = lambda P: np.c_[(P - bc) @ l, (P - bc) @ p]
            rings.append(dict(bc=bc, p=p, bp=bp, tp=tp))
        # keep palmar/lateral frame continuous along the band
        p = np.mean([r['p'] for r in rings], 0); p -= a * np.dot(p, a); p /= np.linalg.norm(p); l = np.cross(a, p)
        for r in rings:
            to2 = lambda P, r=r: np.c_[(P - r['bc']) @ l, (P - r['bc']) @ p]
            r['bp2'] = to2(r['bp']); r['tp2'] = to2(r['tp']); r['l'] = l; r['p'] = p
            r['hull'] = MultiPoint(np.vstack([r['bp2'], r['tp2']])).convex_hull
        def ray(r, th):
            c = np.array(r['hull'].centroid.coords[0]); d = np.array([np.sin(th), np.cos(th)])
            hit = LineString([c, c + d * 60]).intersection(r['hull'].exterior)
            q = np.array(hit.coords[0]) if hit.geom_type == 'Point' else np.array(hit.geoms[0].coords[0])
            return c, d, np.linalg.norm(q - c), q
        # arc limit: stop where the envelope reaches the dorsal half of the bone
        def limit(r, sign):
            mid = np.median(r['bp2'][:, 1])
            for deg in range(40, 175, 3):
                if ray(r, sign * np.radians(deg))[3][1] < mid: return deg - 3
            return 170
        tmax = np.radians(min(min(limit(r, 1), limit(r, -1)) for r in rings))
        ths = np.linspace(-tmax, tmax, NT)
        # distance field over (slice, angle); smooth it so margins are even, never dipping below the envelope
        C = [np.array(r['hull'].centroid.coords[0]) for r in rings]
        C = [np.mean(C[max(0, i - 2):i + 3], 0) for i in range(NR)]
        def rayc(r, c, th):
            d = np.array([np.sin(th), np.cos(th)])
            hit = LineString([c, c + d * 60]).intersection(r['hull'].exterior)
            if hit.is_empty: return 0.0
            q = np.array(hit.coords[0]) if hit.geom_type == 'Point' else np.array(hit.geoms[0].coords[0])
            return float(np.linalg.norm(q - c))
        D = np.array([[rayc(rings[i], C[i], th) for th in ths] for i in range(NR)])
        Ds = D.copy()
        for _ in range(3):
            P = np.pad(Ds, 1, mode='edge')
            Ds = (P[:-2, 1:-1] + P[2:, 1:-1] + P[1:-1, :-2] + P[1:-1, 2:] + 2 * P[1:-1, 1:-1]) / 6
        Ds = np.maximum(Ds, D)
        V = []
        for i, r in enumerate(rings):
            edge = 0.55 + 0.45 * np.sin(np.pi * i / (NR - 1)) ** 0.5
            inner, outer = [], []
            for j, th in enumerate(ths):
                d = np.array([np.sin(th), np.cos(th)])
                fade = 0.35 + 0.65 * np.cos(th / tmax * np.pi / 2) ** 0.6
                pi_ = C[i] + d * (Ds[i, j] + GAP); po = C[i] + d * (Ds[i, j] + GAP + THICK * edge * fade)
                inner.append(r['bc'] + r['l'] * pi_[0] + r['p'] * pi_[1]); outer.append(r['bc'] + r['l'] * po[0] + r['p'] * po[1])
            V.append((inner, outer))
        verts = []; idx = {}
        for i in range(NR):
            for k in (0, 1):
                for j in range(NT): idx[(i, k, j)] = len(verts); verts.append(V[i][k][j])
        F = []
        def quad(a_, b_, c_, d_): F.extend([[a_, b_, c_], [a_, c_, d_]])
        for i in range(NR - 1):
            for j in range(NT - 1):
                quad(idx[(i, 1, j)], idx[(i + 1, 1, j)], idx[(i + 1, 1, j + 1)], idx[(i, 1, j + 1)])
                quad(idx[(i, 0, j)], idx[(i, 0, j + 1)], idx[(i + 1, 0, j + 1)], idx[(i + 1, 0, j)])
            for j in (0, NT - 1): quad(idx[(i, 0, j)], idx[(i + 1, 0, j)], idx[(i + 1, 1, j)], idx[(i, 1, j)])
        for i in (0, NR - 1):
            for j in range(NT - 1): quad(idx[(i, 0, j)], idx[(i, 1, j)], idx[(i, 1, j + 1)], idx[(i, 0, j + 1)])
        m = trimesh.Trimesh(np.array(verts), np.array(F), process=True); m.fix_normals()
        nm = f'{pname} pulley of right {fname} finger'
        gen.append((nm, m))
        report.append(f'{nm}: length {ss[-1]-ss[0]:.1f} mm, arc ±{np.degrees(tmax):.0f}°, {len(m.faces)} faces, watertight={m.is_watertight}' + (f' [tendon profile extrapolated at {len(notes)} of {NR} slices]' if notes else ''))
sc = trimesh.load(base_glb); meta = json.load(open(base_glb + '.json'))
for i, (nm, m) in enumerate(gen):
    key = f'GEN_PULLEY_{i:02d}'; sc.add_geometry(m, geom_name=key, node_name=key)
    meta.append(dict(id=key, name=nm, kind='pulley', f=len(m.faces), bounds=m.bounds.flatten().tolist()))
sc.export(out); json.dump(meta, open(out + '.json', 'w'))
print('\n'.join(report))
