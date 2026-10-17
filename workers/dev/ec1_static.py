#!/usr/bin/env python3
"""EC1 static checks of the rules, castle level 1 -> 50 (no simulation): can every price be stored, are the steps sane, does every level have something to do.

    python3 dev/ec1_static.py [--csv DIR]       prints the findings; with --csv writes ec1_levels.csv (one row per castle level) and ec1_unlocks.csv

check_all() -> list of (severity, text): 'FAIL' = a real dead end / a rule broken, 'WARN' = a design gap the owner should know, 'INFO'.
"""
from __future__ import annotations

import csv
import math
import os
import sys

sys.path.insert(0, os.environ.get("BW_ROOT", "/home/claude/bot/bluebot_v2"))
from bluewall import military as MI  # noqa: E402
from bluewall import progress as P  # noqa: E402

GEMS = P.GEMS
N = P.MAX_LEVEL
BASE = P.BASE_LEVELS
RB = 12.0 * 0 + 1.0


def round_cost(n: int) -> dict:
    """Gems of ALL structures the castle round of level n asks for (unlocked ones; every structure goes to level n)."""
    tot = {g: 0 for g in GEMS}
    for e in P.ORDER:
        if P.STRUCTS[e][3] <= n:
            for g, v in P.cost(e, n).items():
                tot[g] += v
    return tot


def unlocks_at(n: int) -> list:
    """Everything that is new at castle level n (structures, units, defences, guardians, hero slots, forge/spell steps)."""
    out = []
    for e, v in P.STRUCTS.items():
        if v[3] == n and n > 1:
            out.append("struct:" + e)
    for u, d in MI.UNITS.items():
        if d["lv"] == n and n > 1:
            out.append("unit:" + u)
    for k, d in MI.DEFENCES.items():
        if d.get("unlock") == n and n > 1:
            out.append("defence:" + k)
    for k, d in MI.GUARDIANS.items():
        if d.get("unlock") == n:
            out.append("guardian:" + k)
    for u in MI.HEROES:
        for t in MI.hero_slot_levels(u):
            if t == n:
                out.append("hero:" + u)
    for lv, _ in MI.GARRISON_AT:
        if lv == n and n > 1:
            out.append("garrison")
    return out


def check_all() -> list:
    R = []
    add = lambda sev, txt: R.append((sev, txt))
    # 1. tables
    add("FAIL" if len(P.T_HOURS) != N or len(P.COST_K) != N else "INFO", "T_HOURS / COST_K have %d / %d entries (MAX_LEVEL %d)" % (len(P.T_HOURS), len(P.COST_K), N))
    for n in range(4, N + 1):
        if P.T_HOURS[n - 1] < P.T_HOURS[n - 2] - 1e-9:
            add("FAIL", "T_HOURS falls at level %d (%.1f -> %.1f)" % (n, P.T_HOURS[n - 2], P.T_HOURS[n - 1]))
    for e in P.ORDER:
        for n in range(4, N + 1):
            a, b = P.cost(e, n - 1), P.cost(e, n)
            for g in b:
                if g in a and b[g] < a[g]:
                    add("FAIL", "%s: the %s price falls at level %d (%d -> %d)" % (e, g, n, a[g], b[g]))
    # 2. recoverability: no state may exist in which the vault that would let the player save up is itself too small.
    #    Legal states: a castle k has every unlocked structure >= k-1 (round rule) and no structure above k+2 (max_allowed), so when an upgrade to `to` can start
    #    the vaults are at least to-3 (to-1 for the castle itself).  A vault upgrade must fit the partner vaults of that worst case; every other price may have to wait
    #    for a vault upgrade (always possible) - that is counted, not failed.
    worst_v, worst_k, vault_first = 0.0, 0.0, 0
    for e in P.ORDER:
        for to in range(2, N + 1):
            if P.STRUCTS[e][3] > to:
                continue
            vmin = max(1, to - 1) if e == "keep" else max(1, to - 3)
            for g, v in P.cost(e, to).items():
                cap = P.vault_cap(g, vmin)
                if e.startswith("vault_"):
                    worst_v = max(worst_v, v / cap)
                    if v > cap:
                        add("FAIL", "%s -> %d costs %d %s but the partner vault of level %d holds %d (the vaults cannot be raised: dead end)" % (e, to, v, g, vmin, cap))
                elif e == "keep":
                    worst_k = max(worst_k, v / cap)
                    if v > cap:
                        add("FAIL", "keep -> %d costs %d %s but the vault of level %d holds %d (dead end)" % (to, v, g, vmin, cap))
                elif v > cap:
                    vault_first += 1
    add("INFO", "vault upgrades: dearest price / smallest partner vault = %.2f; castle: %.2f (both must stay < 1); other upgrades that must wait for a vault upgrade: %d of %d" % (worst_v, worst_k, vault_first, (N - 1) * len(P.ORDER)))
    # 3. steps
    for n in range(BASE + 1, N + 1):
        r = P.T_HOURS[n - 1] / P.T_HOURS[n - 2]
        if r > 1.08:
            add("WARN", "T_HOURS steps %.0f%% at level %d" % ((r - 1) * 100, n))
        rc = round_cost(n)
        rp = round_cost(n - 1)
        for g in GEMS:
            q = rc[g] / max(1, rp[g])
            if q > 1.40:
                add("WARN", "the %s price of a whole round jumps x%.2f at level %d (income grows x1.13)" % (g, q, n))
    # 4. mines and vaults: 12 h of output must fit the vault of the same level (a collected mine is never lost to its own vault)
    for n in range(1, N + 1):
        for g in GEMS:
            if P.vault_cap(g, n) < P.CAP_HOURS * P.mine_rate(g, n):
                add("FAIL", "vault %s level %d (%d) is smaller than 12 h of its mine (%d)" % (g, n, P.vault_cap(g, n), 12 * P.mine_rate(g, n)))
    # 5. the round rule at the top: castle 50 needs every unlocked structure at 49
    st = {"gems": {g: 10 ** 12 for g in GEMS}, "level": 1, "last": {g: 0.0 for g in GEMS}}
    P.init(st)
    st["b"] = {e: (49 if P.STRUCTS[e][3] <= 49 else 0) for e in P.ORDER}
    st["b"]["keep"] = 49
    ok_ = P.round_left(st, 50) == []
    st["b"]["wall"] = 48
    bad_ = P.round_left(st, 50) == ["wall"]
    if not (ok_ and bad_):
        add("FAIL", "round rule at castle 50 is wrong (every unlocked structure must be >= 49)")
    # 6. content: levels where nothing opens
    empty = [n for n in range(2, N + 1) if not unlocks_at(n)]
    top = [n for n in empty if n > BASE]
    if top:
        add("WARN", "no new structure / unit / defence / guardian / hero slot opens at castle levels %s (levels 31-50 only scale: army housing x1.64, speed, forge, level multiplier)" % top)
    # 7. raid economics: what a raid costs against what it pays (the army sink) - the ratio must not fall to nothing
    pr = {k: MI.ref_price_per_space(k) for k in (10, 20, 30, 40, 50)}
    for k in (10, 20, 30, 40, 50):
        sp = MI.army_cap(k)
        cost_ = {g: sp * 0.6 * pr[k][g] for g in GEMS}
        loot_ = {g: P.mine_rate(g, k) * MI.LOOT_HOURS * 0.75 for g in GEMS}
        add("INFO", "castle %d: a raid costs %s and pays %s (cost/loot ruby %.2f emerald %.2f turq %.2f)" % (k, {g: int(v) for g, v in cost_.items()}, {g: int(v) for g, v in loot_.items()}, cost_["ruby"] / loot_["ruby"], cost_["emerald"] / loot_["emerald"], cost_["turq"] / loot_["turq"]))
    return R


def level_rows() -> list:
    rows = []
    for n in range(1, N + 1):
        rc = round_cost(n)
        kc = P.cost("keep", n) if n > 1 else {g: 0 for g in GEMS}
        r = {"level": n, "T_hours": round(P.T_HOURS[n - 1], 2), "COST_K": round(P.COST_K[n - 1], 4), "keep_days": round(P.dur("keep", n) / 86400.0, 2) if n > 1 else 0,
             "builders": P.builders(n), "army_cap": MI.army_cap(n), "speed": round(MI.speed(n), 3), "spell_cap": MI.spell_cap(n)}
        for g in GEMS:
            r["round_" + g] = rc[g]
            r["keep_" + g] = kc.get(g, 0)
            r["rate_" + g] = round(P.mine_rate(g, n), 1)
            r["vault_" + g] = P.vault_cap(g, n)
            r["round_hours_of_mine_" + g] = round(rc[g] / P.mine_rate(g, max(1, n - 1)), 1)
        r["round_days_if_only_mine_income_emerald"] = round(rc["emerald"] / (P.mine_rate("emerald", max(1, n - 1)) * 24.0), 1)
        r["unlocks"] = " ".join(unlocks_at(n))
        rows.append(r)
    return rows


def main(argv: list) -> int:
    res = check_all()
    for sev, t in res:
        print("%-4s %s" % (sev, t))
    if "--csv" in argv:
        d = argv[argv.index("--csv") + 1]
        os.makedirs(d, exist_ok=True)
        rows = level_rows()
        with open(os.path.join(d, "ec1_levels.csv"), "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0]))
            w.writeheader()
            w.writerows(rows)
        print("wrote", d)
    return 1 if any(s == "FAIL" for s, _ in res) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
