#!/usr/bin/env python3
"""TR2-S5 — reference port of the layout rules (client/src/layout_rules.js + layout_store.js) for the server.   SPEC FILE, not server code: copy / adapt it into the server (the mother does this).

    python3 tr2_s5_ref_rules.py [geom.json vectors.json]       runs every test vector -> last line "PORT OK"

What it contains (pure standard library, no numpy):
    load_geom(path)                      -> the geometry object G  (docs/tr2_s5_geom.json)
    check_pose(G, me, pose, others, h_tol)   -> sorted list of broken rule codes ([] = valid)       == checkPose(..., { height: grid, hTol })
    canonical_load(G, rec)               -> {"status": "ok", "effective": {...}, "dropped": [...]}  or {"status": "reject", "why": "..."}   == shapeOk + live.load
Notes for the port:  * JS Math.round rounds half UP (not to even): use js_round.  * every comparison is the strict one written in docs/layout_api.md.  * the height ground is the 1 m grid in the geometry file (bilinear) with h_tol = 0.25 m of slack.
"""
import base64, json, math, struct, sys

MAX_BYTES = 8192
hyp = math.hypot


def js_round(v):
    return math.floor(v + 0.5)


def r2(v):
    return js_round(v * 100) / 100


def r3(v):
    return js_round(v * 1000) / 1000


# ------------------------------------------------------------------------------------------------ geometry
def load_geom(path):
    G = json.load(open(path))
    h = G["heights"]
    n = h["nx"] * h["nz"]
    G["_cm"] = struct.unpack("<%dh" % n, base64.b64decode(h["cm"]))
    G["_things"] = {t["id"]: t for t in G["things"]}
    return G


def ground(G, x, z):
    h = G["heights"]
    u, v = (x - h["x0"]) / h["step"], (z - h["z0"]) / h["step"]
    i, j = math.floor(u), math.floor(v)
    if i < 0 or j < 0 or i >= h["nx"] - 1 or j >= h["nz"] - 1:
        return -9.0                                             # outside the grid there is no ground (WALL fails there anyway)
    fu, fv, cm, nx = u - i, v - j, G["_cm"], h["nx"]

    def at(a, b):
        return cm[(j + b) * nx + i + a] / 100.0
    return (at(0, 0) * (1 - fu) + at(1, 0) * fu) * (1 - fv) + (at(0, 1) * (1 - fu) + at(1, 1) * fu) * fv


def corners(cx, cz, ry, w, d):
    c, s = math.cos(ry), math.sin(ry)
    return [(cx + lx * c + lz * s, cz - lx * s + lz * c) for lx, lz in ((-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2))]


def centre_of(x, z, ry, fp):
    c, s = math.cos(ry), math.sin(ry)
    ox, oz = fp.get("ox") or 0, fp.get("oz") or 0
    return x + ox * c + oz * s, z - ox * s + oz * c


def sat_overlap(a, b):
    for P in (a, b):
        for i in range(4):
            p1, p2 = P[i], P[(i + 1) & 3]
            ax, az = -(p2[1] - p1[1]), p2[0] - p1[0]
            amin = bmin = 1e9
            amax = bmax = -1e9
            for k in range(4):
                v = a[k][0] * ax + a[k][1] * az
                amin, amax = min(amin, v), max(amax, v)
                u = b[k][0] * ax + b[k][1] * az
                bmin, bmax = min(bmin, u), max(bmax, u)
            if amax < bmin or bmax < amin:
                return False
    return True


def seg_d(px, pz, ax, az, bx, bz):
    dx, dz = bx - ax, bz - az
    l2 = dx * dx + dz * dz or 1
    t = ((px - ax) * dx + (pz - az) * dz) / l2
    t = 0 if t < 0 else 1 if t > 1 else t
    return hyp(px - ax - dx * t, pz - az - dz * t)


def sd_poly(poly, x, z):                                        # signed distance: negative inside
    d, c, n = 1e9, False, len(poly)
    j = n - 1
    for i in range(n):
        xi, zi = poly[i]
        xj, zj = poly[j]
        if (zi > z) != (zj > z) and x < (xj - xi) * (z - zi) / (zj - zi) + xi:
            c = not c
        d = min(d, seg_d(x, z, xj, zj, xi, zi))
        j = i
    return -d if c else d


def near(pts_list, x, z):                                       # smallest (distance to the polyline - half width) over polylines [(pts, half)]
    d = 1e9
    for pts, half in pts_list:
        for i in range(len(pts) - 1):
            d = min(d, seg_d(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]) - half)
    return d


def rect_circle_gap(cx, cz, ry, w, d, px, pz, pr):
    c, s = math.cos(ry), math.sin(ry)
    dx, dz = px - cx, pz - cz
    lx, lz = dx * c - dz * s, dx * s + dz * c
    return hyp(lx - max(-w / 2, min(w / 2, lx)), lz - max(-d / 2, min(d / 2, lz))) - pr


def samples(cx, cz, ry, w, d):                                  # the centre + the 4 corners + a sample every <= 3.2 m along the perimeter
    c, s = math.cos(ry), math.sin(ry)
    hw, hd = w / 2, d / 2
    nx, nz = max(1, math.ceil(w / 3.2)), max(1, math.ceil(d / 3.2))
    out = [(cx, cz)]
    for i in range(nx + 1):
        lx = -hw + w * i / nx
        out.append((cx + lx * c - hd * s, cz - lx * s - hd * c))
        out.append((cx + lx * c + hd * s, cz - lx * s + hd * c))
    for j in range(1, nz):
        lz = -hd + d * j / nz
        out.append((cx - hw * c + lz * s, cz + hw * s + lz * c))
        out.append((cx + hw * c + lz * s, cz - hw * s + lz * c))
    return out


# ------------------------------------------------------------------------------------------------ the rules
def check_pose(G, me, pose, others, h_tol=0.0):
    """me = {id, kind, fp}; pose = (x, z, ry) ALREADY ROUNDED; others = [{id, x, z, ry, fp}] at their CURRENT places.  Returns the sorted list of broken rule codes."""
    R = G["rules"]
    fp = me["fp"]
    core = fp.get("core") or fp
    x, z, ry = pose
    cx, cz = centre_of(x, z, ry, fp)
    kx, kz = centre_of(x, z, ry, core)
    why = set()
    hd = hyp(fp["w"], fp["d"]) / 2
    K = corners(kx, kz, ry, core["w"], core["d"])
    rc = fp.get("rc") or (7.4 if me["kind"] in ("mill", "smokehouse") else R["RC"])
    moat_pad = fp["moatPad"] if fp.get("moatPad") is not None else R["MOAT_PAD"]
    s_clear = fp["streetClear"] if fp.get("streetClear") is not None else R["STREET_CLEAR"]
    moat_out = G["moat"]["off"] + G["moat"]["half"] + moat_pad
    for px, pz in [(kx, kz)] + K:
        if sd_poly(G["town"], px, pz) > -R["WALL_M"]:
            why.add("WALL")
        if sd_poly(G["outer"], px, pz) < moat_out:
            why.add("MOAT")
    for g in G["gates"]:
        if hyp(cx - g["x"], cz - g["z"]) < R["GATE_R"] + hd:
            why.add("GATE")
    m = G["market"]
    if m and rect_circle_gap(cx, cz, ry, fp["w"], fp["d"], m["x"], m["z"], m["r"]) < R["MARKET_GAP"]:
        why.add("MARKET")
    for v in G.get("vaults") or []:
        if rect_circle_gap(cx, cz, ry, fp["w"], fp["d"], v["x"], v["z"], v["r"]) < R["VAULT_GAP"]:
            why.add("VAULT")
    mine = corners(cx, cz, ry, fp["w"] + R["GAP"], fp["d"] + R["GAP"])
    for o in others:
        if o["id"] == me["id"]:
            continue
        ox, oz = centre_of(o["x"], o["z"], o["ry"], o["fp"])
        if hyp(ox - cx, oz - cz) > hd + hyp(o["fp"]["w"], o["fp"]["d"]) / 2 + 3:
            continue
        if sat_overlap(mine, corners(ox, oz, o["ry"], o["fp"]["w"] + R["GAP"], o["fp"]["d"] + R["GAP"])):
            why.add("OVERLAP")
            break
    streets = [(s["pts"], s["w"] / 2) for s in G["streets"]]
    river = [(G["river"]["pts"], 0)]
    streams = [(s["pts"], s["half"]) for s in G["streams"]]
    for px, pz in samples(kx, kz, ry, core["w"], core["d"]):
        if near(streets, px, pz) < s_clear:
            why.add("STREET")
        if near(river, px, pz) < rc:
            why.add("RIVER")
        if streams and near(streams, px, pz) < R["STREAM_CLEAR"]:
            why.add("STREAM")
    if me["kind"] == "smokehouse" and not near(river, kx, kz) <= G["river"]["half"] + R["WATER_NEAR"]:
        why.add("WATER")
    hs = []
    for i in range(4):
        a, b = K[i], K[(i + 1) & 3]
        hs.append(ground(G, a[0], a[1]))
        hs.append(ground(G, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2))
    hs.append(ground(G, kx, kz))
    if min(hs) < R["MIN_H"] - h_tol:
        why.add("DRY")
    if max(hs) - min(hs) > R["MAX_SPREAD"] + h_tol:
        why.add("SLOPE")
    return sorted(why)


# ------------------------------------------------------------------------------------------------ the record
def shape_ok(rec):
    """-> None if the shape is fine, else the reason (the same strings as layout_store.js shapeOk)."""
    if isinstance(rec, list):                                   # (JS: an array is an object without a `v`)
        return "version"
    if not isinstance(rec, dict):
        return "not an object"
    if rec.get("v") != 1 or isinstance(rec.get("v"), bool):
        return "version"
    m = rec.get("m")
    if not isinstance(m, dict):
        return "m"
    if len(json.dumps(rec, separators=(",", ":"), ensure_ascii=False)) > MAX_BYTES:
        return "size"
    import re
    for id_, a in m.items():
        if not re.fullmatch(r"[a-z0-9_]{1,32}", id_):
            return "id " + id_
        if not isinstance(a, list) or len(a) != 3 or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in a):
            return "triple " + id_
        if abs(a[0]) > 5000 or abs(a[1]) > 5000 or abs(a[2]) > 20:
            return "range " + id_
    return None


def current_records(G, ovr):
    """every movable thing at its CURRENT place: ovr = {id: [x, z, ry]}."""
    out = []
    for t in G["things"]:
        o = ovr.get(t["id"])
        out.append({"id": t["id"], "kind": t["kind"], "fp": t["fp"], "x": o[0] if o else t["x"], "z": o[1] if o else t["z"], "ry": o[2] if o else t["ry"], "moved": bool(o)})
    return out


def invalid_ids(G, ovr, h_tol):
    rs = current_records(G, ovr)
    return [r["id"] for r in rs if r["moved"] and check_pose(G, r, (r["x"], r["z"], r["ry"]), rs, h_tol)]


def canonical_load(G, rec):
    """shape -> round -> drop unknown ids -> repeat { drop the FIRST invalid id (sorted) }.  The effective record is what the server stores and answers."""
    bad = shape_ok(rec)
    if bad:
        return {"status": "reject", "why": bad}
    h_tol = G["tolerance"]["hTol"]
    ovr, dropped = {}, []
    for id_, a in rec["m"].items():
        if id_ not in G["_things"]:
            dropped.append(id_)
            continue
        ovr[id_] = [r2(a[0]), r2(a[1]), r3(a[2])]
    for _ in range(400):
        inv = invalid_ids(G, ovr, h_tol)
        if not inv:
            break
        first = sorted(inv)[0]
        del ovr[first]
        dropped.append(first)
    return {"status": "ok", "effective": {k: ovr[k] for k in sorted(ovr)}, "dropped": sorted(dropped)}


# ------------------------------------------------------------------------------------------------ the vectors
def run_vectors(geom_path, vec_path):
    G = load_geom(geom_path)
    V = json.load(open(vec_path))
    bad = 0

    def say(ok, name, extra=""):
        nonlocal bad
        bad += 0 if ok else 1
        print(("OK   " if ok else "FAIL ") + name + (("   " + extra) if extra and not ok else ""))
    h_tol = G["tolerance"]["hTol"]
    for v in V["single"]:
        base = v.get("layout") or {}
        eff = {}
        if base:
            r = canonical_load(G, base)
            eff = r.get("effective", {})
        rs = current_records(G, eff)
        me = next(r for r in rs if r["id"] == v["id"])
        why = check_pose(G, me, tuple(v["pose"]), rs, h_tol)
        say(why == v["expect"]["why"], "pose: " + v["name"], "got %s expected %s" % (why, v["expect"]["why"]))
    for v in V["load"] + V["reject"]:
        r = canonical_load(G, v["record"])
        e = v["expect"]
        if e["status"] == "reject":
            say(r["status"] == "reject" and r["why"] == e["why"], "record: " + v["name"], "got %s" % r)
        else:
            say(r["status"] == "ok" and r["effective"] == e["effective"] and r["dropped"] == e["dropped"], "record: " + v["name"], "got %s" % json.dumps(r)[:200])
    print("PORT OK" if not bad else "PORT FAILED (%d)" % bad)
    return bad


def run_fuzz(geom_path, fuzz_path):
    G = load_geom(geom_path)
    F = json.load(open(fuzz_path))
    h_tol = G["tolerance"]["hTol"]
    rs = current_records(G, {})
    by = {r["id"]: r for r in rs}
    bad = 0
    for id_, x, z, ry, want in F["cases"]:
        got = ",".join(check_pose(G, by[id_], (x, z, ry), rs, h_tol))
        if got != want:
            bad += 1
            if bad <= 10:
                print("FAIL fuzz", id_, x, z, ry, "got", got, "want", want)
    print("FUZZ OK (%d poses)" % len(F["cases"]) if not bad else "FUZZ FAILED (%d of %d)" % (bad, len(F["cases"])))
    return bad


if __name__ == "__main__":
    import os
    here = os.path.dirname(os.path.abspath(__file__))
    g = sys.argv[1] if len(sys.argv) > 2 else os.path.join(here, "tr2_s5_geom.json")
    v = sys.argv[2] if len(sys.argv) > 2 else os.path.join(here, "tr2_s5_vectors.json")
    rc = run_vectors(g, v)
    fz = os.path.join(here, "tr2_s5_fuzz.json")
    if os.path.exists(fz):
        rc += run_fuzz(g, fz)
    sys.exit(1 if rc else 0)
