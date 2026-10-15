"""Blue Wall - the player's own map arrangement, server half (TR2-S5).

The client lets a player move his homes, civic buildings, production lots and the six storehouses inside the walled town.  The record is
    {"v": 1, "g": <planId>, "m": {<id>: [x, z, ry], ...}}       (only what he moved; metres in the game frame, ry radians)
This module is the ONE place that judges such a record on the server: the shape check, the twelve placement rules and the canonical load
(drop the first sorted invalid id, up to 400 times).  It is a port of the reference ``workers/docs/tr2_s5_ref_rules.py`` (which is a line-for-line port of the
client's ``layout_rules.js`` / ``layout_store.js``); ``workers/dev/layout_server_test.py`` proves the two agree (spec vectors, 2500 fuzz poses, random records).
Spec: ``workers/docs/layout_api.md``.  The map data is ``layout_geom.json`` (generated from the game code by ``workers/dev/tr2_s5_vectors.sh``: re-run it and ship the file
whenever the town data changes - plan lots, roads, terrain, stores, vaults).

Two things differ from the reference on purpose (same answers, different cost):
  * ``canonical_load`` judges the rules that do not depend on other things (everything but OVERLAP) once per id, and OVERLAP per pair with a memo: the worst record
    (every one of the 85 things moved, all invalid) costs ~0.3 s instead of ~6 s;
  * the number checks cannot raise on a huge integer (``triple <id>`` instead of an OverflowError).
"""
from __future__ import annotations

import asyncio
import base64
import json
import math
import re
import struct
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

MAX_BYTES = 8192                       # the record (compact JSON)
MAX_BODY = MAX_BYTES + 256             # the request body
GEOM_PATH = Path(__file__).resolve().parent / "layout_geom.json"
RATE_N, RATE_WIN = 5, 5.0              # at most 5 accepted POSTs in any 5 s per player
_ID = re.compile(r"[a-z0-9_]{1,32}")
hyp = math.hypot


def js_round(v: float) -> int:
    return math.floor(v + 0.5)         # (JS Math.round rounds half UP; Python's round() does not)


def r2(v: float) -> float:
    return js_round(v * 100) / 100


def r3(v: float) -> float:
    return js_round(v * 1000) / 1000


# ------------------------------------------------------------------------------------------------ geometry
def load_geom(path) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        G = json.load(f)
    h = G["heights"]
    n = h["nx"] * h["nz"]
    G["_cm"] = struct.unpack("<%dh" % n, base64.b64decode(h["cm"]))
    G["_things"] = {t["id"]: t for t in G["things"]}
    return G


_G: Optional[Dict[str, Any]] = None
_G_MTIME = -1.0


def geom() -> Optional[Dict[str, Any]]:
    """The map data (cached, reloaded when the file changes); None when the file is missing / unreadable = the feature is off."""
    global _G, _G_MTIME
    try:
        mt = GEOM_PATH.stat().st_mtime
    except OSError:
        _G, _G_MTIME = None, -1.0
        return None
    if _G is None or mt != _G_MTIME:
        try:
            _G, _G_MTIME = load_geom(GEOM_PATH), mt
        except Exception:  # noqa: BLE001
            _G, _G_MTIME = None, -1.0
    return _G


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
def _pair_overlap(G, me, mx, mz, mry, o):
    """OVERLAP of `me` (pose mx, mz, mry) against ONE other thing `o` ({id, x, z, ry, fp}): far things are skipped, the rest is a SAT test of the footprints grown by GAP."""
    R = G["rules"]
    fp = me["fp"]
    cx, cz = centre_of(mx, mz, mry, fp)
    ox, oz = centre_of(o["x"], o["z"], o["ry"], o["fp"])
    if hyp(ox - cx, oz - cz) > hyp(fp["w"], fp["d"]) / 2 + hyp(o["fp"]["w"], o["fp"]["d"]) / 2 + 3:
        return False
    return sat_overlap(corners(cx, cz, mry, fp["w"] + R["GAP"], fp["d"] + R["GAP"]),
                       corners(ox, oz, o["ry"], o["fp"]["w"] + R["GAP"], o["fp"]["d"] + R["GAP"]))


def check_pose(G, me, pose, others, h_tol=0.0):
    """me = {id, kind, fp}; pose = (x, z, ry) ALREADY ROUNDED; others = [{id, x, z, ry, fp}] at their CURRENT places.  Returns the sorted list of broken rule codes ([] = valid)."""
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
    for o in others:
        if o["id"] != me["id"] and _pair_overlap(G, me, x, z, ry, o):
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
def shape_ok(rec) -> Optional[str]:
    """None if the shape is fine, else the reason (the exact strings of the client's shapeOk): not an object | version | m | size | id <id> | triple <id> | range <id>."""
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
    for id_, a in m.items():
        if not _ID.fullmatch(id_):
            return "id " + id_
        if not isinstance(a, list) or len(a) != 3:
            return "triple " + id_
        for v in a:
            try:
                fin = (not isinstance(v, bool)) and isinstance(v, (int, float)) and math.isfinite(v)
            except OverflowError:                               # (an integer too big for a float)
                fin = False
            if not fin:
                return "triple " + id_
        if abs(a[0]) > 5000 or abs(a[1]) > 5000 or abs(a[2]) > 20:
            return "range " + id_
    return None


def current_records(G, ovr) -> List[Dict[str, Any]]:
    """every movable thing at its CURRENT place: ovr = {id: [x, z, ry]}."""
    out = []
    for t in G["things"]:
        o = ovr.get(t["id"])
        out.append({"id": t["id"], "kind": t["kind"], "fp": t["fp"], "x": o[0] if o else t["x"], "z": o[1] if o else t["z"], "ry": o[2] if o else t["ry"], "moved": bool(o)})
    return out


def canonical_load(G, rec) -> Dict[str, Any]:
    """shape -> round -> drop unknown ids -> repeat { drop the FIRST invalid id (sorted) } (<= 400 times).
    -> {"status": "reject", "why": reason}  or  {"status": "ok", "effective": {id: [x, z, ry]}, "dropped": [ids]}.  Same answers as the reference; see the module doc for the cost."""
    bad = shape_ok(rec)
    if bad:
        return {"status": "reject", "why": bad}
    h_tol = G["tolerance"]["hTol"]
    things = G["_things"]
    ovr: Dict[str, List[float]] = {}
    dropped: List[str] = []
    for id_, a in rec["m"].items():
        if id_ not in things:
            dropped.append(id_)
            continue
        ovr[id_] = [r2(a[0]), r2(a[1]), r3(a[2])]
    # every rule but OVERLAP looks at the thing alone: one answer per override, valid for the whole load
    static_bad = {}
    for id_, p in ovr.items():
        t = things[id_]
        static_bad[id_] = bool(check_pose(G, {"id": id_, "kind": t["kind"], "fp": t["fp"]}, (p[0], p[1], p[2]), [], h_tol))
    memo: Dict[Any, bool] = {}

    def clash(a, b) -> bool:                                    # (symmetric; a pair's answer depends only on both things' current state)
        k = (a["id"], a["moved"], b["id"], b["moved"])
        v = memo.get(k)
        if v is None:
            v = memo[k] = _pair_overlap(G, a, a["x"], a["z"], a["ry"], b)
        return v
    for _ in range(400):
        rs = current_records(G, ovr)
        inv = [r["id"] for r in rs if r["moved"] and (static_bad[r["id"]] or any(r["id"] != o["id"] and clash(r, o) for o in rs))]
        if not inv:
            break
        first = sorted(inv)[0]
        del ovr[first]
        dropped.append(first)
    return {"status": "ok", "effective": {k: ovr[k] for k in sorted(ovr)}, "dropped": sorted(dropped)}


# ------------------------------------------------------------------------------------------------ the rate limit (5 accepted POSTs in any 5 s per player)
_HITS: Dict[int, List[float]] = {}
_clock = time.monotonic


def limited(uid: int) -> bool:
    """True when this POST is over the limit (it is then NOT counted); otherwise it is counted."""
    now = _clock()
    q = [t for t in _HITS.get(uid, ()) if now - t < RATE_WIN]
    if len(q) >= RATE_N:
        _HITS[uid] = q
        return True
    q.append(now)
    _HITS[uid] = q
    if len(_HITS) > 5000:                                       # keep memory bounded: forget the players whose window has run out
        for k in [k for k, v in _HITS.items() if not v or now - v[-1] >= RATE_WIN][:2500]:
            _HITS.pop(k, None)
    return False


# ------------------------------------------------------------------------------------------------ async glue
_SEM: Optional[asyncio.Semaphore] = None


async def judge(G, rec) -> Dict[str, Any]:
    """canonical_load in a worker thread, at most 2 at a time (a tampered record must never freeze the event loop)."""
    global _SEM
    if _SEM is None:
        _SEM = asyncio.Semaphore(2)
    async with _SEM:
        return await asyncio.get_running_loop().run_in_executor(None, canonical_load, G, rec)
