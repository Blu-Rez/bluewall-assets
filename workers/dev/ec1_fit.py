#!/usr/bin/env python3
"""EC1 fit of the castle levels 31-50: T_HOURS / COST_K continued with the SAME method that fitted 1-30 (dev/fit5.py), levels 1-30 frozen.

    python3 dev/ec1_fit.py [sweeps]            state in /home/claude/work/ec1/fit_state.json, report at the end
    TAIL=29 RB=0.62 python3 dev/ec1_fit.py     (env: TAIL = days per level of the good player above 30, RB = best / good ratio)

Targets: good player ("free" profile of bluewall.sim, mean of 3 visit phases -1 / 0 / +1 h like dev/days_table.py) G[n] = G30 + TAIL * (n - 30), G30 = what the
live tables give at castle 30 (the fit of p35: 717 d); best player ("best") B[n] = B30 + RB * TAIL * (n - 30).  Free parameters: log T and log COST_K at the knots
KN (log-linear in between), anchored at level 30.  MONO = T never falls and the gem price of a round never falls with the level (as fit5.py).
"""
from __future__ import annotations

import copy
import json
import math
import os
import sys
import time
from multiprocessing import Pool

sys.path.insert(0, os.environ.get("BW_ROOT", "/home/claude/bot/bluebot_v2"))
from bluewall import progress as P  # noqa: E402
from bluewall import sim as SIM  # noqa: E402

STATE = os.environ.get("STATE", "/home/claude/work/ec1/fit_state.json")
TAIL = float(os.environ.get("TAIL", 29.0))
RB = float(os.environ.get("RB", 0.62))
KN = [int(x) for x in os.environ.get("KN", "34,38,42,46,50").split(",")]
PH = (-1.0, 0.0, 1.0)
HF, HB = 2600, 1700
T0 = list(P.T_HOURS)
K0 = list(P.COST_K)
BASE_T30, BASE_K30 = T0[29], K0[29]


def interp(knots, vals, n):
    xs = [30] + knots
    ys = [vals[0]] + vals[1:]
    for i in range(len(xs) - 1):
        if xs[i] <= n <= xs[i + 1]:
            f = (n - xs[i]) / (xs[i + 1] - xs[i])
            return ys[i] * (1 - f) + ys[i + 1] * f
    return ys[-1]


def tables(S):
    """S = {'lt': [...], 'lc': [...]} with one value per knot (index 0 = level 30 anchor)."""
    T, K = list(T0), list(K0)
    for n in range(31, 51):
        T[n - 1] = math.exp(interp(KN, S["lt"], n))
        K[n - 1] = math.exp(interp(KN, S["lc"], n))
    for n in range(31, 51):                                        # MONO
        T[n - 1] = max(T[n - 1], T[n - 2])
        c0 = T[n - 2] * K[n - 2] * 1.13 ** (n - 2)
        c1 = T[n - 1] * K[n - 1] * 1.13 ** (n - 1)
        if c1 < c0:
            K[n - 1] = c0 / (T[n - 1] * 1.13 ** (n - 1))
    return T, K


def install(T, K):
    P.T_HOURS[:] = T
    P.COST_K[:] = K
    P._VC.clear()


def work(a):
    name, ph, T, K = a
    install(T, K)
    pr = copy.deepcopy(SIM.PROFILES[name])
    pr["sessions"] = [min(23.9, max(0.0, h + ph)) for h in pr["sessions"]]
    return SIM.simulate(pr, HF if name == "free" else HB)["keep_days"]


POOL = None


def measure(T, K):
    jobs = [(n, ph, T, K) for n in ("free", "best") for ph in PH]
    res = POOL.map(work, jobs) if POOL else [work(j) for j in jobs]
    out = {}
    for i, n in enumerate(("free", "best")):
        rs = res[i * 3:(i + 1) * 3]
        out[n] = {L: (sum(r[L] for r in rs) / 3.0 if all(L in r for r in rs) else None) for L in range(2, 51)}
    return out


def targets(m30):
    G = {n: m30["free"][30] + TAIL * (n - 30) for n in range(30, 51)}
    B = {n: m30["best"][30] + RB * TAIL * (n - 30) for n in range(30, 51)}
    return G, B


def loss(m, G, B, S):
    e = 0.0
    for n in range(31, 51):
        w = 3.0 if n in (35, 40, 45, 50) else 1.0
        f, b = m["free"].get(n), m["best"].get(n)
        e += w * (math.log(f / G[n]) ** 2 if f else (math.log(HF / G[n]) + 2) ** 2)
        e += 2.0 * w * (math.log(b / B[n]) ** 2 if b else (math.log(HB / B[n]) + 2) ** 2)
    for n in range(32, 51):                                        # the sawtooth: compare pairs of levels, not single ones
        f0, f1, b0, b1 = m["free"].get(n - 2), m["free"].get(n), m["best"].get(n - 2), m["best"].get(n)
        if f0 and f1:
            e += 0.25 * math.log(max(1.0, f1 - f0) / (2 * TAIL)) ** 2
        if b0 and b1:
            e += 0.1 * math.log(max(1.0, b1 - b0) / (2 * RB * TAIL)) ** 2
    lt, lc = S["lt"], S["lc"]
    e += 0.02 * sum((lt[i - 1] - 2 * lt[i] + lt[i + 1]) ** 2 for i in range(1, len(lt) - 1))
    e += 0.02 * sum((lc[i - 1] - 2 * lc[i] + lc[i + 1]) ** 2 for i in range(1, len(lc) - 1))
    return e


def load():
    if os.path.exists(STATE) and "--reset" not in sys.argv:
        return json.load(open(STATE))
    return {"lt": [math.log(BASE_T30)] * (len(KN) + 1), "lc": [math.log(BASE_K30)] * (len(KN) + 1), "sweep": 0, "step": 0.2, "best": 9e9}


def save(S):
    json.dump(S, open(STATE, "w"))


def report(S, G, B):
    T, K = tables(S)
    install(T, K)
    m = measure(T, K)
    print(" lvl   good(target)    best(target) |   T_h     CK   keep-cost-e")
    for n in range(28, 51):
        f, b = m["free"].get(n), m["best"].get(n)
        ce = P.cost("keep", n)["emerald"] if n > 1 else 0
        print(" %2d  %7s(%5s)  %7s(%5s) | %6.1f %6.3f %10d" % (n, "%.0f" % f if f else "-", "%.0f" % G[n] if n in G else "", "%.0f" % b if b else "-", "%.0f" % B[n] if n in B else "", T[n - 1], K[n - 1], ce))
    return m


if __name__ == "__main__":
    POOL = Pool(2)
    sweeps = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 3
    T, K = list(T0), list(K0)
    install(T, K)
    base = measure(T, K)
    G, B = targets(base)
    print("anchor: good %.1f best %.1f at castle 30 | tail %.1f d/level, best ratio %.2f | start (placeholder) good50 %.0f best50 %s" % (G[30], B[30], TAIL, RB, base["free"].get(50) or -1, base["best"].get(50)), flush=True)
    S = load()

    def f_eval():
        T, K = tables(S)
        install(T, K)
        return loss(measure(T, K), G, B, S)

    cur = f_eval()
    print("start loss %.3f" % cur, flush=True)
    step = float(S.get("step", 0.2))
    for sw in range(sweeps):
        t0 = time.time()
        improved = False
        for key in ("lt", "lc"):
            for i in range(1, len(S[key])):
                for d in (+step, -step):
                    old = S[key][i]
                    S[key][i] = old + d
                    v = f_eval()
                    if v < cur - 1e-9:
                        cur = v
                        improved = True
                        break
                    S[key][i] = old
        if not improved:
            step *= 0.6
        S["sweep"] += 1
        S["step"] = step
        S["best"] = cur
        save(S)
        print("sweep %d loss %.3f step %.3f (%.0f s)" % (S["sweep"], cur, step, time.time() - t0), flush=True)
    report(S, G, B)
