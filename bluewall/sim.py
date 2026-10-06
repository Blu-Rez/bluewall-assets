"""Progression simulator (economy v7, 30 levels since p35): how many days until castle level N?   ``python -m bluewall.sim [profile ...]``

Design targets (owner, 5 Oct 2026 22:16 / 22:21; fitted with dev/fit5.py into progress.T_HOURS / COST_K):
  a GOOD player (plays every day, ~6 visits, no boost, no gems bought) reaches castle level 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9 / 10 on about day 4 / 6 / 16 / 28 / 49 / 55 / 100 / 107 / 152
  (his list: 3 / 7 / 12 / 25 / 40 / 60 / 85 / 115 / 150 - the round rule makes every second castle round cheap, so the pairs average out to his list),
  castle 20 after ~14 months (428 days) and castle 30 after ~23.5 months (717 days);  the BEST player (every boost at 20 %, gems bought, rush allowance used up)
  needs 30-40 % less (castle 20 in ~8.5 months = 260 days, castle 30 in ~15 months = 453 days);  boosts alone (no gems bought) give about -19 %;  a lazy player (2 short visits a day) takes more.
  (The single run of one profile jumps by +-15 % when a visit hour or a price moves a little - the numbers above are the mean of 3 runs whose visit times differ by an hour, see dev/days_table.py.)
The player should never run out of things to do, but has to be patient.

It runs the REAL rules of progress.py (round rule, builders, reserve queue, boosts, rush allowance, mines with banked output) and
military.py (loot = hours of castle-level output x share, plunder pool, army housing), with a simple player model:
  sessions  the hours of the day the player opens the game: collect every mine, start / reserve upgrades (the castle first when a
            round is complete, otherwise the lowest structure), attack, rush with spare turquoise
  attacks   per day, spread over the sessions; each costs the lost soldiers (housing x LOSS x unit price per space) + 2 spells; skipped when it would lose ruby on balance
  share     average loot share (destruction x star factor) of those attacks
Profiles: free (no gems bought, no boosts) · boost (20 % boosts, no gems bought) · best (20 % boosts, everything bought,
rush allowance fully used) · idle (2 short visits a day, 1 attack).
"""
from __future__ import annotations

import sys
from typing import Any, Dict, List

from . import boost as BO
from . import military as MI
from . import progress as P

DAY = 86400.0
LOSS = 0.6                                     # share of the army that dies in an average attack

PROFILES: Dict[str, Dict[str, Any]] = {
    "free": {"sessions": [8, 11, 14, 17, 20, 23], "attacks": 6, "share": 0.75, "boost": 0, "buy": 0.0, "rush": "spare"},
    "boost": {"sessions": [8, 11, 14, 17, 20, 23], "attacks": 6, "share": 0.75, "boost": 20, "buy": 0.0, "rush": "spare"},
    "best": {"sessions": [8, 10, 12, 14, 16, 18, 20, 22, 23.5], "attacks": 8, "share": 0.9, "boost": 20, "buy": 1.0, "rush": "all"},
    "idle": {"sessions": [9, 21], "attacks": 1, "share": 0.6, "boost": 0, "buy": 0.0, "rush": "spare"},
}


def army_price_per_space(keep: int) -> Dict[str, float]:
    return MI.ref_price_per_space(max(1, keep))                                  # (p35: the real price of the reference army of the rules; the old fixed 3.4 / 2.9 ruby per space had drifted 30-40 % under it)


def simulate(prof: Dict[str, Any], horizon_days: int = 1500, verbose: bool = False, stop_level: int = 0) -> Dict[str, Any]:
    st: Dict[str, Any] = {"gems": {g: 0 for g in P.GEMS}, "level": 1, "last": {g: 0.0 for g in P.GEMS}}
    P.init(st)
    st["b"] = P.fresh_levels(1)
    bought = {g: 0 for g in P.GEMS}
    looted = {g: 0 for g in P.GEMS}
    mined = {g: 0 for g in P.GEMS}
    rushed_h = 0.0
    keep_days: Dict[int, float] = {}
    sessions = sorted(prof["sessions"])
    per = [prof["attacks"] // len(sessions) + (1 if i < prof["attacks"] % len(sessions) else 0) for i in range(len(sessions))]
    day = 0
    while day < horizon_days:
        for si, hh in enumerate(sessions):
            now = day * DAY + hh * 3600.0
            if prof["boost"]:
                for k in BO.KINDS:                                   # (keeps every boost running: re-bought before it ends)
                    b = BO.get(st, k, now)
                    if not b or float(b["end"]) - now < 2 * 3600:
                        P.settle(st, now)
                        old = BO.window(st, k)
                        if k == "mine":
                            P.mine_bank(st, now)
                        end = (float(b["end"]) if b else now) + 7 * DAY
                        st.setdefault("bst", {})[k] = {"p": prof["boost"], "s": now, "end": end}
                        if k == "build":
                            P.rebase_build(st, now, old, BO.window(st, "build"))
            P.settle(st, now)
            P.expire_mine_boost(st, now)
            keep = P.keep_level(st)
            # collect
            for g in P.GEMS:
                cap = P.vault_cap(g, max(1, P.level(st, "vault_" + g)))
                have = P.mine_ready(st, g, now)
                n = int(min(have, max(0, cap - st["gems"][g])))
                st["gems"][g] += n
                mined[g] += n
                P.mine_take(st, g, n, now)
            # attacks
            for _ in range(per[si]):
                price = army_price_per_space(keep)
                space = MI.army_cap(max(1, P.level(st, "training")))
                need = {g: int(space * LOSS * price[g] + (16 if g == "turq" else 8 if g == "ruby" else 0)) for g in P.GEMS}
                # (a sensible player does not raid at a loss: the ruby that the dead soldiers cost must come back as loot, unless the ruby vault is overflowing anyway)
                r_loot = P.mine_rate("ruby", keep) * MI.LOOT_HOURS * prof["share"]
                if r_loot < need["ruby"] and st["gems"]["ruby"] < 0.8 * P.vault_cap("ruby", max(1, P.level(st, "vault_ruby"))):
                    continue
                if any(st["gems"][g] < need[g] for g in P.GEMS):
                    if prof["buy"] <= 0:
                        continue
                    for g in P.GEMS:
                        if st["gems"][g] < need[g]:
                            bought[g] += need[g] - st["gems"][g]
                            st["gems"][g] = need[g]
                for g in P.GEMS:
                    st["gems"][g] -= need[g]
                pool = MI.pool_levels(st, now)
                loot = {}
                for g in P.GEMS:
                    nominal = P.mine_rate(g, keep) * MI.LOOT_HOURS
                    f = 1.0 if pool[g] >= nominal else max(MI.POOL_FLOOR, pool[g] / max(1.0, nominal))
                    loot[g] = int(nominal * f * prof["share"])
                MI.pool_take(st, loot, now)
                for g in P.GEMS:
                    cap = P.vault_cap(g, max(1, P.level(st, "vault_" + g)))
                    add = min(loot[g], max(0, cap - st["gems"][g]))
                    st["gems"][g] += add
                    looted[g] += add
            # build
            for _ in range(40):
                keep = P.keep_level(st)
                order = ["keep"] + sorted((e for e in P.ORDER if e != "keep"), key=lambda e: (P.level(st, e), P.ORDER.index(e)))
                started = False
                for e in order:
                    why, info = P.can_start(st, e, now)
                    if why == "gems" and prof["buy"] > 0 and info:
                        c = P.cost(e, P.level(st, e) + 1)
                        miss = {g: max(0, c[g] - st["gems"][g]) for g in c}
                        if prof["buy"] >= 1.0 or all(miss[g] <= prof["buy"] * c[g] for g in c):
                            for g, n in miss.items():
                                st["gems"][g] += n
                                bought[g] += n
                            why, info = P.can_start(st, e, now)
                    if why == "ok":
                        P.start(st, e, now)
                        started = True
                        break
                if not started:
                    break
            # rush
            act = [i for i in st["q"] if i.get("end")]
            if act and (prof["rush"] == "all" or st["gems"]["turq"] > 0.6 * P.vault_cap("turq", max(1, P.level(st, "vault_turq")))):
                it = max(act, key=lambda i: i["end"])
                c, cut, full = P.rush_plan(it, now, P.keep_level(st), P.rush_left(st, now))
                if cut > 0:
                    if st["gems"]["turq"] < c and prof["rush"] == "all":
                        bought["turq"] += c - st["gems"]["turq"]
                        st["gems"]["turq"] = c
                    if st["gems"]["turq"] >= c:
                        r, _ = P.speedup(st, it["e"], now)
                        if r == "ok":
                            rushed_h += cut / 3600.0
            k = P.keep_level(st)
            if k not in keep_days:
                keep_days[k] = round(now / DAY, 1)
        day += 1
        if verbose and day % 60 == 0:
            print("  day %4d keep %2d  %s" % (day, P.keep_level(st), " ".join("%s:%d" % (e[:5], P.level(st, e)) for e in P.ORDER)))
        if P.keep_level(st) >= (stop_level or P.MAX_LEVEL):
            break
    return {"keep20": keep_days.get(20), "keepmax": keep_days.get(P.MAX_LEVEL), "keep_days": keep_days, "bought": bought, "looted": looted, "mined": mined, "rushed_h": round(rushed_h)}


def main(argv: List[str]) -> None:
    names = [a for a in argv if not a.startswith("-")] or ["free", "boost", "best", "idle"]
    for top in (20, P.MAX_LEVEL):
        tot_h = sum(P.dur(e, lv) for e in P.ORDER for lv in range(1, top + 1)) / 3600.0
        print("builder-hours to max everything at level %d: %d (3 builders: %.0f days)" % (top, tot_h, tot_h / 72))
    for n in names:
        r = simulate(PROFILES[n], verbose="-v" in argv)
        kd = r["keep_days"]
        print("%-5s castle 20 on day %s | castle %d on day %s (%.1f months) | castle 5/10/15/25: day %s/%s/%s/%s | rushed %sh | bought %s" % (
            n, r["keep20"], P.MAX_LEVEL, r["keepmax"], (r["keepmax"] or 0) / 30.44, kd.get(5), kd.get(10), kd.get(15), kd.get(25), r["rushed_h"], r["bought"]))


if __name__ == "__main__":
    main(sys.argv[1:])
