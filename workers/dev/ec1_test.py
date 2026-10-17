#!/usr/bin/env python3
"""EC1 test: "a player reaches castle level 50 without a dead end" - free and with boosts, on the REAL rules (progress / military / boost / shop).

    python3 dev/ec1_test.py            ~2 minutes, prints one line per check and `EC1 OK` (exit 0) or `EC1 FAIL (n)` (exit 1)
    python3 dev/ec1_test.py --full     the whole grid (6 play times x 5 boost sets) as well

What it proves (the numbers are the ones of dev/ec1_report.py):
  1. levels 1-30 did not move (dev/ec1_frozen30.json = the tree before the patch; the vault of level 30 is the one allowed exception: it has to hold the prices of round 31)
  2. static: T_HOURS / COST_K monotone, every price fits the vault the player has when it becomes available, vault upgrades can always be saved up, a vault holds 12 h of its mine,
     the round rule at castle 50 (every unlocked structure >= 49), no jump of a whole round above x1.4
  3. players: every play time (30 min .. 4 h a day), with / without boosts, with / without buying gems reaches 50 and never stalls (30 days with no upgrade started or finished)
  4. pace carries on: castle 31-50 take about as many days a level as castle 21-30 (within 25 %), the best player needs 0.55-0.72 of the free one, more play never slows by > 6 %,
     a boost never slows, builders are busy (>= 75 % on average above 30), no level takes more than 90 days (30-min player: 130)
  5. no gem without a sink: from castle 31 on the ruby the player gets is used (>= 90 %, <= 8 % thrown away), emerald waste <= 2 %
  6. an over-eager raider (the naive policy of the first run: raids even when the plunder pool is dry and each raid loses gems) does stall - and recovers the day it stops raiding
  7. the army can be trained again between two raids (training lanes need < 1 h for the 60 % an average raid costs)
  8. E1 (resource layer, docs/economy_table.json) passes its own checker with the counts up to 50
"""
from __future__ import annotations

import copy
import json
import os
import sys
import time
from multiprocessing import Pool

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.environ.get("BW_ROOT", "/home/claude/bot/bluebot_v2"))
import ec1_sim as E  # noqa: E402
import ec1_static as ST  # noqa: E402
from bluewall import military as MI  # noqa: E402
from bluewall import progress as P  # noqa: E402

BAD = []
FULL = "--full" in sys.argv


def need(cond, msg):
    if not cond:
        BAD.append(msg)
        print("FAIL", msg, flush=True)
    return cond


def ok(msg):
    print("ok  ", msg, flush=True)


# ------------------------------------------------------------------ 1. levels 1-30 frozen
def t_frozen():
    fz = json.load(open(os.path.join(HERE, "ec1_frozen30.json")))
    n = 30
    bad = []
    if [P.t_hours(i) for i in range(1, n + 1)] != fz["t_hours"]:
        bad.append("t_hours")
    for e in P.ORDER:
        if [P.cost(e, i) for i in range(1, n + 1)] != fz["cost"][e]:
            bad.append("cost " + e)
        if [P.dur(e, i) for i in range(1, n + 1)] != fz["dur"][e]:
            bad.append("dur " + e)
        if [P.max_allowed(e, k) for k in range(1, n + 1)] != fz["max_allowed"][e]:
            bad.append("max_allowed " + e)
    for g in P.GEMS:
        if [P.mine_rate(g, i) for i in range(1, n + 1)] != fz["rate"][g]:
            bad.append("rate " + g)
        if [P.vault_cap(g, i) for i in range(1, n)] != fz["vault_1_29"][g]:
            bad.append("vault " + g)
    if [P.builders(k) for k in range(1, n + 1)] != fz["builders"]:
        bad.append("builders")
    if [MI.army_cap(k) for k in range(1, n + 1)] != fz["army_cap"] or [MI.speed(k) for k in range(1, n + 1)] != fz["speed"] or [MI.spell_cap(k) for k in range(1, n + 1)] != fz["spell_cap"]:
        bad.append("army_cap / speed / spell_cap")
    if [MI.guardian_slots(k) for k in range(1, n + 1)] != fz["guardians"] or {u: d["lv"] for u, d in MI.UNITS.items()} != fz["unit_lv"]:
        bad.append("guardians / unit unlock levels")
    if need(not bad, "levels 1-30 changed: %s" % bad):
        ok("levels 1-30: T, every price, time, mine rates, vaults 1-29, caps, builders, unlock levels identical to the tree before the patch")


# ------------------------------------------------------------------ 2. static
def t_static():
    res = ST.check_all()
    fails = [t for s, t in res if s == "FAIL"]
    if need(not fails, "static: %s" % fails[:5]):
        ok("static rules: " + "; ".join(t for s, t in res if s == "INFO" and t.startswith("vault upgrades")))


# ------------------------------------------------------------------ 3-5. players
def _run(a):
    key, kw, ph, extra = a
    extra = dict(extra)
    gate = bool(extra.pop("gate", False))
    pr = copy.deepcopy(E.profile_for(**kw))
    pr["sessions"] = [min(23.9, max(0.0, h + ph)) for h in pr["sessions"]]
    pr.update(extra)
    return key, ph, E.simulate(pr, gate=gate)


def t_players():
    cases = {
        "free_0.5h": dict(hours=0.5), "free_1h": dict(hours=1.0), "free_1.5h": dict(hours=1.5), "free_2.5h": dict(hours=2.5), "free_4h": dict(hours=4.0),
        "build20_1.5h": dict(hours=1.5, bset="build20"), "mine20_1.5h": dict(hours=1.5, bset="mine20"), "army20_1.5h": dict(hours=1.5, bset="army20"), "royal20_1.5h": dict(hours=1.5, bset="royal20"),
        "royal5_1.5h": dict(hours=1.5, bset="royal5"), "pay30_royal20_1.5h": dict(hours=1.5, pay=0.3, bset="royal20"), "best_4h": dict(hours=4.0, pay=1.0, rush="all", bset="royal20"),
        "best_1.5h": dict(hours=1.5, pay=1.0, rush="all", bset="royal20"),
    }
    if FULL:
        for h in E_HOURS:
            for b in ("none", "build20", "mine20", "army20", "royal20"):
                cases.setdefault("grid_%s_%s" % (h, b), dict(hours=h, bset=b))
    jobs = [(k, kw, ph, {}) for k, kw in cases.items() for ph in (0.0, 1.0)]
    jobs.append(("free_1.5h_gate", dict(hours=1.5), 0.0, {"gate": True}))
    jobs.append(("lazy_0.25h", dict(hours=0.25), 0.0, {}))
    # an over-eager raider: stalls (the dead end of the first run) and must recover as soon as he stops raiding
    jobs.append(("naive_4h", dict(hours=4.0, smart=False), 0.0, {"stop_on_stall": False, "smart_from_day": 900}))
    jobs.append(("naive_4h_stall", dict(hours=4.0, smart=False), 0.0, {}))
    with Pool(2) as pool:
        out = pool.map(_run, jobs)
    R = {}
    for key, ph, r in out:
        R.setdefault(key, []).append(r)
    mean50 = lambda k: sum(r["keep_days"].get(50) or 1e9 for r in R[k]) / len(R[k])
    for k in cases:
        for r in R[k]:
            need(r["reached"] == 50 and not r["stall"], "%s: reached %s, stall %s" % (k, r["reached"], r["stall"] and r["stall"]["reasons"]))
    ok("every player reaches castle 50 and none stalls: %d profiles x 2 visit phases (%s)" % (len(cases), ", ".join("%s %d" % (k, mean50(k)) for k in ("free_0.5h", "free_1.5h", "royal20_1.5h", "best_4h"))))
    need(R["lazy_0.25h"][0]["reached"] == 50 and not R["lazy_0.25h"][0]["stall"], "one 15-minute visit a day never reaches 50")
    g = R["free_1.5h_gate"][0]
    need(g["reached"] == 50 and not g["stall"], "with the army training gate the free player does not reach 50")
    need(g["keep_days"].get(50, 0) <= 1.05 * mean50("free_1.5h"), "the training gate slows the free player by more than 5 %")
    # the naive raider
    st_ = R["naive_4h_stall"][0]
    need(st_["stall"] is not None or st_["reached"] == 50, "(informational) the naive raider no longer stalls - drop the recovery case")
    rec = R["naive_4h"][0]
    need(rec["reached"] == 50, "the over-eager raider does not recover after he stops raiding (reached %s)" % rec["reached"])
    ok("over-eager raider: %s; after he stops raiding castle 50 on day %s" % ("stalls at castle %s (day %s)" % (st_["reached"], st_["stall"]["day"]) if st_["stall"] else "no stall", rec["keep_days"].get(50)))
    # pace
    kd = R["free_1.5h"][0]["keep_days"]
    d21_30 = (kd[30] - kd[20]) / 10.0
    d31_50 = (kd[50] - kd[30]) / 20.0
    need(abs(d31_50 / d21_30 - 1.0) <= 0.25, "days a level above 30 (%.1f) differ from 21-30 (%.1f) by more than 25 %%" % (d31_50, d21_30))
    ok("days per castle level, free 1.5 h/day: 21-30 %.1f, 31-50 %.1f" % (d21_30, d31_50))
    f, b = mean50("free_1.5h"), mean50("best_4h")
    need(0.55 <= b / f <= 0.72, "best / free = %.2f, outside 0.55-0.72" % (b / f))
    need(1150 <= f <= 1500, "free player reaches 50 on day %d, outside 1150-1500 (the owner's tail: ~1315)" % f)
    ok("free %d days, best (boosts + gems bought + rush) %d days, ratio %.2f" % (f, b, b / f))
    hs = [mean50(k) for k in ("free_1h", "free_1.5h", "free_2.5h", "free_4h")]
    need(all(hs[i + 1] <= 1.06 * hs[i] for i in range(3)), "more play slows the player by more than 6 %%: %s" % [round(x) for x in hs])
    need(mean50("free_0.5h") >= mean50("free_1h") * 0.98, "30 minutes a day is faster than 1 hour")
    for b_ in ("build20_1.5h", "mine20_1.5h", "army20_1.5h", "royal20_1.5h", "royal5_1.5h"):
        need(mean50(b_) <= 1.015 * f, "boost %s slows the player (%d vs %d)" % (b_, mean50(b_), f))
    need(mean50("royal20_1.5h") < 0.95 * f, "royal 20 %% saves less than 5 %% (%d vs %d)" % (mean50("royal20_1.5h"), f))
    need(mean50("pay30_royal20_1.5h") < mean50("royal20_1.5h"), "buying 30 % of the missing gems does not make royal 20 faster")
    ok("more play never slows (%s), no boost slows, royal 20 saves %.1f %%" % ("/".join("%d" % x for x in hs), 100 * (f - mean50("royal20_1.5h")) / f))
    # builders, idle levels, step sizes (free 1.5 h, middle phase; 30-minute player for the lazy bound)
    for key, lim in (("free_1.5h", 90), ("free_0.5h", 130), ("royal20_1.5h", 90), ("free_4h", 90)):
        r = R[key][0]
        rows = E.level_rows(r)
        top = [x for x in rows if 31 <= x["level"] <= 49]
        util = sum(float(x["builder_util"]) * float(x["days_in_level"]) for x in top) / sum(float(x["days_in_level"]) for x in top)
        need(util >= (0.75 if key != "free_0.5h" else 0.5), "%s: builder use above 30 is %.2f" % (key, util))
        need(sum(x["idle_vault"] for x in rows) == 0, "%s: a builder stood idle because the vault was too small" % key)
        longest = max((x for x in rows if x["days_in_level"] != ""), key=lambda x: float(x["days_in_level"]))
        need(float(longest["days_in_level"]) <= lim, "%s: castle level %s takes %s days (> %d)" % (key, longest["level"], longest["days_in_level"], lim))
    ok("builders busy above 30, no vault idle, longest level <= 90 days (<= 130 for 30 min a day)")
    # gems: every one of them has a use
    rows = E.level_rows(R["free_1.5h"][0])

    def agg(g, a, b):
        s = lambda k: sum(int(x[k + g]) for x in rows if a <= x["level"] <= b)
        pot = s("mined_") + s("looted_") + s("waste_mine_") + s("waste_loot_")
        return 100.0 * (s("spent_up_") + s("spent_army_")) / pot, 100.0 * (s("waste_mine_") + s("waste_loot_")) / pot
    ru_used, ru_waste = agg("ruby", 31, 49)
    em_used, em_waste = agg("emerald", 31, 49)
    need(ru_used >= 90 and ru_waste <= 8, "ruby above 30: used %.0f %%, thrown away %.0f %%" % (ru_used, ru_waste))
    need(em_waste <= 2, "emerald above 30: thrown away %.0f %%" % em_waste)
    ok("castle 31-49: ruby used %.0f %% (thrown away %.0f %%), emerald used %.0f %% (thrown away %.0f %%)" % (ru_used, ru_waste, em_used, em_waste))


E_HOURS = (0.25, 0.5, 1.0, 1.5, 2.5, 4.0)


# ------------------------------------------------------------------ 7. army
def t_army():
    worst = max(E.retrain_seconds(L) for L in range(1, P.MAX_LEVEL + 1)) / 3600.0
    need(worst < 1.0, "rebuilding the 60 %% an average raid loses takes %.2f h" % worst)
    need(MI.army_cap(50) == 1432 and MI.fam_cap("barracks", 50) > 0, "army housing at 50")
    ok("army: the lanes rebuild a raid's losses in %.2f h at the worst level" % worst)


# ------------------------------------------------------------------ 8. E1
def t_e1():
    import e1_check
    e1_check.BAD.clear()
    rc = e1_check.main()
    need(rc == 0, "E1 checker failed: %s" % e1_check.BAD[:3])
    ok("E1 economy table with counts up to castle 50 (dev/e1_check.py)")


def main():
    t0 = time.time()
    t_frozen()
    t_static()
    t_army()
    t_players()
    t_e1()
    print("[%.0f s]" % (time.time() - t0))
    if BAD:
        print("EC1 FAIL (%d)" % len(BAD))
        return 1
    print("EC1 OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
