#!/usr/bin/env python3
"""EC1 report tables (csv) - every number of the summary comes from here.   python3 dev/ec1_report.py [OUT_DIR]   (default /home/claude/work/ec1)

  ec1_grid.csv        hours per day x boost set: days to castle 10 / 20 / 30 / 40 / 50 (mean of 3 visit phases -1 / 0 / +1 h), the spread, the sapphire it costs, the saving
  ec1_pay.csv         a paying player (missing gems bought) : days, bot gems spent
  ec1_boosts.csv      the boost price list (kind x % x days) in sapphire
  ec1_perlevel_*.csv  one row per castle level of one profile (days, builder use, mined / looted / spent / wasted gems, why a builder stood idle, which gem was short)
  ec1_training.csv    hours the training lanes need to rebuild the 60 % an average raid costs, per castle level, with and without an army boost
  ec1_summary.json    the five key numbers
"""
from __future__ import annotations

import copy
import json
import os
import sys
from multiprocessing import Pool

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ec1_sim as E  # noqa: E402

PH = (-1.0, 0.0, 1.0)
HOURS = (0.25, 0.5, 1.0, 1.5, 2.5, 4.0)
SETS = ("none", "build5", "build10", "build20", "mine5", "mine10", "mine20", "army20", "royal5", "royal10", "royal20")


def _shift(pr, ph):
    pr = copy.deepcopy(pr)
    pr["sessions"] = [min(23.9, max(0.0, h + ph)) for h in pr["sessions"]]
    return pr


def work(a):
    key, kw, ph, gate = a
    pr = _shift(E.profile_for(**kw), ph)
    r = E.simulate(pr, gate=gate)
    return key, ph, {"kd": r["keep_days"], "tot": r["tot"], "stall": bool(r["stall"]), "reached": r["reached"]}


def mean_days(rs, n):
    v = [r["kd"].get(n) for r in rs]
    return round(sum(v) / len(v), 1) if all(x is not None for x in v) else ""


def main(out):
    os.makedirs(out, exist_ok=True)
    pool = Pool(2)
    jobs = []
    for h in HOURS:
        for b in SETS:
            for ph in PH:
                jobs.append(((h, b), dict(hours=h, bset=b), ph, False))
    pay_cases = [("pay0_spare", dict(hours=1.5, pay=0.0, rush="spare", bset="none")), ("pay0_spare_royal20", dict(hours=1.5, pay=0.0, rush="spare", bset="royal20")),
                 ("pay30_spare_royal20", dict(hours=1.5, pay=0.3, rush="spare", bset="royal20")), ("pay100_spare_none", dict(hours=1.5, pay=1.0, rush="spare", bset="none")),
                 ("pay100_all_none", dict(hours=1.5, pay=1.0, rush="all", bset="none")), ("pay100_all_royal20", dict(hours=1.5, pay=1.0, rush="all", bset="royal20")),
                 ("pay100_all_royal20_4h", dict(hours=4.0, pay=1.0, rush="all", bset="royal20"))]
    for k, kw in pay_cases:
        for ph in PH:
            jobs.append((("pay", k), kw, ph, False))
    for h, b in ((1.5, "none"), (1.5, "royal20"), (4.0, "none"), (0.5, "none")):
        jobs.append((("gate", h, b), dict(hours=h, bset=b), 0.0, True))
    res = pool.map(work, jobs)
    by = {}
    for key, ph, r in res:
        by.setdefault(key, []).append(r)
    cfg = E.SH.cfg_from(None)
    rows = []
    for h in HOURS:
        base = None
        for b in SETS:
            rs = by[(h, b)]
            d50 = [r["kd"].get(50) for r in rs]
            row = {"hours_per_day": h, "boost": b, "days_10": mean_days(rs, 10), "days_20": mean_days(rs, 20), "days_30": mean_days(rs, 30), "days_40": mean_days(rs, 40), "days_50": mean_days(rs, 50),
                   "days_50_min": min(d50) if all(d50) else "", "days_50_max": max(d50) if all(d50) else "", "stall_any": any(r["stall"] for r in rs),
                   "sapphire_per_week": E.sapphire_per_week(E.BOOST_SETS[b], cfg), "sapphire_total_to_50": round(sum(r["tot"]["sapphire"] for r in rs) / len(rs))}
            if b == "none":
                base = row["days_50"]
            if base and row["days_50"]:
                row["saving_pct_vs_none"] = round(100.0 * (base - row["days_50"]) / base, 1)
                saved = base - row["days_50"]
                row["sapphire_per_day_saved"] = round(row["sapphire_total_to_50"] / saved, 1) if saved > 1 else ""
            rows.append(row)
    E.write_csv(os.path.join(out, "ec1_grid.csv"), rows)
    prow = []
    for k, kw in pay_cases:
        rs = by[("pay", k)]
        prow.append({"case": k, **{x: kw[x] for x in ("hours", "pay", "rush", "bset")}, "days_30": mean_days(rs, 30), "days_40": mean_days(rs, 40), "days_50": mean_days(rs, 50),
                     "bot_gems_total": round(sum(r["tot"]["bot_gems"] for r in rs) / len(rs)), "rushed_hours": round(sum(r["tot"]["rushed_h"] for r in rs) / len(rs)),
                     "sapphire_total": round(sum(r["tot"]["sapphire"] for r in rs) / len(rs)), "stall_any": any(r["stall"] for r in rs)})
    E.write_csv(os.path.join(out, "ec1_pay.csv"), prow)
    E.write_csv(os.path.join(out, "ec1_boosts.csv"), E.boost_catalog(cfg))
    trows = [{"castle": L, "hours_to_retrain_no_boost": round(E.retrain_seconds(L) / 3600.0, 2), "hours_army_boost_20": round(E.retrain_seconds(L, 20) / 3600.0, 2), "army_cap": E.MI.army_cap(L)} for L in (1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50)]
    E.write_csv(os.path.join(out, "ec1_training.csv"), trows)
    grows = []
    for k in [k for k in by if k[0] == "gate"]:
        r = by[k][0]
        grows.append({"hours": k[1], "boost": k[2], "gate_reached": r["reached"], "gate_day_50": r["kd"].get(50), "stall": r["stall"], "raids_skipped_by_training": r["tot"]["raids_skipped_army"]})
    E.write_csv(os.path.join(out, "ec1_gate.csv"), grows)
    # per-level tables of the key profiles (middle phase)
    keyp = {"free_1.5h": dict(hours=1.5), "royal20_1.5h": dict(hours=1.5, bset="royal20"), "best_pay_4h": dict(hours=4.0, pay=1.0, rush="all", bset="royal20"), "lazy_0.5h": dict(hours=0.5), "idle_0.25h": dict(hours=0.25)}
    per = {}
    for name, kw in keyp.items():
        r = E.simulate(E.profile_for(**kw))
        per[name] = r
        E.write_csv(os.path.join(out, "ec1_perlevel_%s.csv" % name), E.level_rows(r))
    # key numbers
    g = {(r["hours_per_day"], r["boost"]): r for r in rows}
    summ = {"free_1.5h": {k: g[(1.5, "none")]["days_%d" % k] for k in (10, 20, 30, 40, 50)}, "royal20_1.5h": {k: g[(1.5, "royal20")]["days_%d" % k] for k in (10, 20, 30, 40, 50)},
            "best_pay": {k: [x for x in prow if x["case"] == "pay100_all_royal20_4h"][0]["days_%d" % k] for k in (30, 40, 50)},
            "hours_effect_none": {h: g[(h, "none")]["days_50"] for h in HOURS}, "boost_saving_pct_1.5h": {b: g[(1.5, b)].get("saving_pct_vs_none") for b in SETS},
            "stall_any_in_grid": any(r["stall_any"] for r in rows)}
    json.dump(summ, open(os.path.join(out, "ec1_summary.json"), "w"), indent=1)
    print(json.dumps(summ, indent=1))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "/home/claude/work/ec1")
