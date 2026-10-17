#!/usr/bin/env python3
"""E1 pacing proof: the REAL simulator (bluewall.sim) run twice - as it is, and with the resource layer of docs/economy_table.json on top.

    python3 dev/e1_sim.py [profile ...]        (default: free boost best idle; plus a stress run of `free` at 60 % production)

The layer (a simple model, nothing in the game is edited - it patches progress.can_start / progress.start in memory only):
  * the resource kinds that feed upgrade prices (lumber, quarry, iron, oil + sawmill, masonry, smelter, refinery) are placed as soon as their copy opens
    (the start kit is free; later copies cost wood / stone hours of the level), produce level_factor x base per hour x efficiency, fill stores of
    max(48 h, 1.25 x dearest price of the next round), and a processor turns the part of its input above 25 % of the store into its output;
  * every upgrade also costs resources (once the chain of that resource is open): share x weight x hours of build x output of one building, level below;
  * an upgrade that lacks a resource waits (`res`) exactly like one that lacks gems.
The army sinks (gear, food, oil re-arming, spells) are NOT gates in this run: they are checked as supply / demand in `e1_model.py --flow`.
"""
from __future__ import annotations

import functools
import json
import os
import sys
import time

sys.path.insert(0, "/home/claude/bot/bluebot_v2")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e1_model as M  # noqa: E402
from bluewall import progress as P  # noqa: E402
from bluewall import sim as S  # noqa: E402

M.store_cap = functools.lru_cache(maxsize=None)(M.store_cap)
M.dearest = functools.lru_cache(maxsize=None)(M.dearest)

DAY = 86400.0
PLACED = ("lumber", "quarry", "sawmill", "masonry", "iron", "smelter", "oil", "refinery")      # in the order they open
RAW = {"lumber": "wood", "quarry": "stone", "iron": "iron_ore", "oil": "crude"}
PROC = {"sawmill": ("wood", "planks", 0.5, 120.0), "masonry": ("stone", "cut_stone", 0.5, 90.0),
        "smelter": ("iron_ore", "iron_bars", 0.5, 90.0), "refinery": ("crude", "oil", 0.5, 36.0)}
ALL = ("wood", "stone", "iron_ore", "crude", "planks", "cut_stone", "iron_bars", "oil")
USED = ("wood", "stone", "planks", "cut_stone", "iron_bars", "oil")
CFG = {"eff": 1.0, "on": True}


def _kind(kid: str) -> dict:
    return M.BY_ID[kid]


def _cap(res: str, level: int) -> float:
    return float(M.store_cap(res, level)) if res in ("wood", "stone", "planks", "cut_stone", "iron_bars", "oil", "iron_ore", "crude") else 1e18


def tick(st: dict, now: float) -> dict:
    lay = st.get("lay")
    if lay is None:
        n = {k: M.count_at(_kind(k), 1) for k in PLACED if _kind(k)["unlock"] <= 1}
        lay = st["lay"] = {"t": now, "n": {k: n.get(k, 0) for k in PLACED}, "stock": {r: 0.0 for r in ALL}, "placed_late": 0}
        lay["stock"]["wood"] = 12.0 * 40.0 * n["lumber"]                       # 12 hours of the start kit
    dt = (now - lay["t"]) / 3600.0
    if dt <= 0:
        return lay
    lay["t"] = now
    L = P.keep_level(st)
    f, eff, stock = M.lf(L), CFG["eff"], lay["stock"]
    for kid, res in RAW.items():
        if lay["n"][kid]:
            stock[res] = min(_cap(res, L), stock[res] + lay["n"][kid] * _kind(kid)["out"][1] * f * eff * dt)
    for kid, (rin, rout, ratio, thr) in PROC.items():
        if lay["n"][kid]:
            keep_back = 0.25 * _cap(rin, L)
            conv = min(lay["n"][kid] * thr * f * eff * dt, max(0.0, stock[rin] - keep_back), max(0.0, (_cap(rout, L) - stock[rout]) / ratio))
            stock[rin] -= conv
            stock[rout] += conv * ratio
    for kid in PLACED:                                                          # open copies: pay wood / stone hours of one building at the level
        k = _kind(kid)
        while lay["n"][kid] < M.count_at(k, L):
            w, s = k["price"]
            cw, cs = w * M.rate1("wood", L), (s * M.rate1("stone", L) if s else 0.0)
            if stock["wood"] >= cw and stock["stone"] >= cs:
                stock["wood"] -= cw
                stock["stone"] -= cs
                lay["n"][kid] += 1
                lay["placed_late"] += 1
            else:
                break
    return lay


def needs(st: dict, ent: str, to: int) -> dict:
    keep = P.keep_level(st)
    out = {}
    for r in USED:
        if keep >= M.NEEDS_FROM[r]:
            n = M.price(ent, to, r)
            if n:
                out[r] = n
    return out


_orig_can, _orig_start = P.can_start, P.start


def can_start(st, ent, now):
    lay = tick(st, now)
    why, info = _orig_can(st, ent, now)
    if why != "ok":
        return why, info
    for r, n in needs(st, ent, info["to"]).items():
        if lay["stock"][r] < n:
            return "res", {"res": r, "need": n, "have": int(lay["stock"][r])}
    return why, info


def start(st, ent, now):
    why, it = _orig_start(st, ent, now)
    if why == "ok" and it:
        lay = st["lay"]
        for r, n in needs(st, ent, it["to"]).items():
            lay["stock"][r] -= n
    return why, it


OFFSETS = (-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2)          # the visit hours move by this many hours: one run of one profile jumps by +-10 % when a visit or a price moves a little (sim.py docstring), so we compare the MEAN of nine runs


def run(prof: str, layer: bool, eff: float = 1.0, shift: int = 0) -> dict:
    CFG["eff"] = eff
    p = dict(S.PROFILES[prof])
    p["sessions"] = sorted((h + shift) % 24 for h in p["sessions"])
    if layer:
        P.can_start, P.start = can_start, start
    try:
        r = S.simulate(p, 4200)
    finally:
        P.can_start, P.start = _orig_can, _orig_start
    return r["keep_days"]


def mean_run(prof: str, layer: bool, eff: float = 1.0, offsets=OFFSETS) -> dict:
    runs = [run(prof, layer, eff, o) for o in offsets]
    return {m: sum(r[m] for r in runs) / len(runs) for m in MARKS if all(m in r for r in runs)}


MARKS = (5, 10, 15, 20, 25, 30, 40, 50)
GATE = (20, 30, 40, 50)              # (EC1: 40 and 50 added) the days the owner's targets are about (sim.py docstring); the other marks are printed too but jump when a round shifts


def _pct(a: dict, b: dict, m: int) -> float:
    return 100.0 * (b[m] - a[m]) / a[m]


def main(argv) -> int:
    names = [a for a in argv if not a.startswith("-")] or ["free", "boost", "best", "idle"]
    out, worst, worst_all, noise = {}, 0.0, 0.0, 0.0
    t0 = time.time()
    shifted = tuple(o + 0.25 for o in OFFSETS)
    print("castle level -> day reached, mean of %d runs (visit hours shifted by %s h)" % (len(OFFSETS), OFFSETS))
    print("before = bluewall.sim as it is | after = + resource layer | noise = the SAME unchanged sim with every visit 15 minutes later (what jitter alone does)")
    for n in names:
        a = mean_run(n, False)
        b = mean_run(n, True, 1.0)
        c = mean_run(n, False, 1.0, shifted)
        out[n] = {"before": {str(m): round(a[m], 1) for m in a}, "after": {str(m): round(b[m], 1) for m in b}, "noise_run": {str(m): round(c[m], 1) for m in c}}
        row, nrow = [], []
        for m in MARKS:
            if m in a and m in b:
                d, dn = _pct(a, b, m), _pct(a, c, m)
                if m in GATE:
                    worst = max(worst, abs(d))
                if m >= 10:
                    worst_all = max(worst_all, abs(d))
                    noise = max(noise, abs(dn))
                row.append("%2d: %6.1f -> %6.1f (%+.1f%%)" % (m, a[m], b[m], d))
                nrow.append("%2d: %+.1f%%" % (m, dn))
        print("%-5s %s" % (n, " | ".join(row)), flush=True)
        print("      noise  %s" % " | ".join(nrow), flush=True)
    if "free" in names:
        a, b = mean_run("free", False), mean_run("free", True, 0.6)
        out["stress_free_eff60"] = {"before": {str(m): round(a[m], 1) for m in a}, "after": {str(m): round(b[m], 1) for m in b}}
        print("stress (free, every producer at 60 %% = loyalty far below the threshold): " + " | ".join("%d: %.1f -> %.1f (%+.1f%%)" % (m, a[m], b[m], _pct(a, b, m)) for m in (10, 20, 30, 40, 50) if m in a and m in b))
    print("castle %s: worst |delta| = %.2f %% (limit 5 %%) | castle 10..30 all marks: worst |delta| = %.2f %%, the jitter alone gives up to %.2f %%   [%.0f s]" % ("/".join(map(str, GATE)), worst, worst_all, noise, time.time() - t0))
    os.makedirs("/home/claude/work", exist_ok=True)
    json.dump({"worst_abs_pct_castle_20_30": round(worst, 2), "worst_abs_pct_all_10_30": round(worst_all, 2), "noise_floor_pct": round(noise, 2), "offsets": list(OFFSETS), "runs": out},
              open("/home/claude/work/e1_pacing.json", "w"), indent=1)
    print("PACING OK" if worst <= 5.0 else "PACING FAIL")
    return 0 if worst <= 5.0 else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
