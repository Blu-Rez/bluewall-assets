#!/usr/bin/env python3
"""EC1 player simulator: castle level 1 -> 50 on the REAL rules (progress.py, military.py, boost.py, shop.py), instrumented.

    python3 dev/ec1_sim.py                      # the standard grid -> /home/claude/work/ec1/*.csv   (hours per day x boost sets)
    python3 dev/ec1_sim.py --hours 1.5 --boost build20 --level 50

It is bluewall.sim made measurable.  The player model is the same (visits = sessions, collect every mine, start / reserve upgrades - castle first when
the round is complete, otherwise the lowest structure -, raid, rush with spare turquoise); what is new:

  * hours per day is a parameter (visits of 15 minutes; see profile_for), skill sets the loot share, `pay` buys missing gems (a paying player)
  * every boost the shop sells can be switched on: build / army / mine / royal (= all three) at 5 / 10 / 15 / 20 % (boost_catalog() lists them with the sapphire price)
  * per castle level it records: days spent, gems mined / looted / bought / spent, what was wasted (a full mine, a full vault), builder utilisation,
    and WHY a free builder stood idle (gems / vault / rule / nothing to do)
  * dead-end detector: no upgrade started or finished for STALL_DAYS days
  * optional training gate (gate=True): a raid is only possible when the army lost in the last one is trained again (lane times of military.py)
  * tables can be swapped in memory (set_tables) to test a candidate T_HOURS / COST_K without touching the files

Nothing here edits the game.  All numbers come from the live modules (import path BW_ROOT, default /home/claude/bot/bluebot_v2).
"""
from __future__ import annotations

import copy
import csv
import math
import os
import sys
from typing import Any, Dict, List, Optional, Tuple

ROOT = os.environ.get("BW_ROOT", "/home/claude/bot/bluebot_v2")
sys.path.insert(0, ROOT)
from bluewall import boost as BO  # noqa: E402
from bluewall import military as MI  # noqa: E402
from bluewall import progress as P  # noqa: E402
from bluewall import shop as SH  # noqa: E402

DAY = 86400.0
LOSS = 0.6                         # share of the army that dies in an average raid (sim.py)
STALL_DAYS = 30                    # no upgrade started / finished for this long = a dead end
GEMS = P.GEMS


# ------------------------------------------------------------------ what the shop sells (boosts) and what a player can pay with
def boost_catalog(cfg: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Every boost of shop.py with its sapphire price: kind x tier x days (build / army / mine / royal = all three)."""
    cfg = cfg or SH.cfg_from(None)
    out = []
    for kind in SH.BOOST_KINDS:
        for p in BO.TIERS:
            for d in BO.DAYS:
                price = SH.boost_price(cfg, kind, p, d)
                out.append({"kind": kind, "percent": p, "days": d, "sapphire": price, "per_day": round(price / d, 2),
                            "effect": {"build": "every running upgrade is %d %% faster" % p, "army": "training and brewing %d %% faster" % p,
                                       "mine": "the three gem mines make %d %% more" % p, "royal": "build + army + mine, each %d %%" % p}[kind]})
    return out


BOOST_SETS: Dict[str, Dict[str, int]] = {
    "none": {},
    "build20": {"build": 20}, "mine20": {"mine": 20}, "army20": {"army": 20}, "royal20": {"build": 20, "mine": 20, "army": 20},
    "royal10": {"build": 10, "mine": 10, "army": 10}, "royal5": {"build": 5, "mine": 5, "army": 5},
    "build10": {"build": 10}, "build5": {"build": 5}, "mine10": {"mine": 10}, "mine5": {"mine": 5},
}


def sapphire_per_week(bset: Dict[str, int], cfg: Optional[Dict[str, Any]] = None) -> int:
    """What keeping this boost set running costs per 7 days (royal is cheaper than three single boosts when the three tiers are equal)."""
    cfg = cfg or SH.cfg_from(None)
    if not bset:
        return 0
    ps = set(bset.values())
    if set(bset) == {"build", "army", "mine"} and len(ps) == 1:
        return min(SH.boost_price(cfg, "royal", ps.pop(), 7), sum(SH.boost_price(cfg, k, p, 7) for k, p in bset.items()))
    return sum(SH.boost_price(cfg, k, p, 7) for k, p in bset.items())


# ------------------------------------------------------------------ players
def profile_for(hours: float, skill: float = 0.75, pay: float = 0.0, rush: str = "spare", bset: str = "none", minutes: float = 15.0, smart: bool = True) -> Dict[str, Any]:
    """A player who plays `hours` a day in visits of `minutes` (each visit = collect, build, one raid), spread over 08:00 - 23:30."""
    n = max(1, min(12, int(round(hours * 60.0 / minutes))))
    ses = [20.0] if n == 1 else [8.0 + i * 15.5 / (n - 1) for i in range(n)]
    if n == 2:
        ses = [9.0, 21.0]
    return {"hours": hours, "sessions": ses, "attacks": n, "share": skill, "pay": pay, "rush": rush, "bset": bset, "boost": BOOST_SETS[bset], "smart": smart}


def set_tables(T: Optional[List[float]] = None, K: Optional[List[float]] = None) -> None:
    """Swap progress.T_HOURS / COST_K in memory (the vault cache is cleared); pass None to keep a table."""
    if T is not None:
        P.T_HOURS[:] = list(T)
    if K is not None:
        P.COST_K[:] = list(K)
    P._VC.clear()


def retrain_seconds(level: int, army_boost: int = 0) -> float:
    """How long the five training lanes need (in parallel) to rebuild LOSS of the reference army of castle `level`."""
    lv = {f: (level if P.STRUCTS[f][3] <= level else 0) for f in MI.FAMILIES}
    cap = MI.army_cap(level)
    open_ = [u for u in MI._PLAN if lv[MI.UNITS[u]["fam"]] >= MI.UNITS[u]["lv"]]
    tot = sum(MI._PLAN[u] for u in open_) or 1.0
    per_fam: Dict[str, float] = {}
    for u in open_:
        d = MI.UNITS[u]
        n = int(cap * MI._PLAN[u] / tot) // d["space"]
        n = min(n, MI.hero_slots(u, lv[d["fam"]]))
        t = d["t"] / MI.speed(lv[d["fam"]]) / (1.0 + army_boost / 100.0)
        per_fam[d["fam"]] = per_fam.get(d["fam"], 0.0) + n * t
    return LOSS * max(per_fam.values() or [0.0])


# ------------------------------------------------------------------ the run
def simulate(prof: Dict[str, Any], horizon_days: int = 6000, gate: bool = False, stop_level: int = 0, cfg: Optional[Dict[str, Any]] = None,
             trace: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    cfg = cfg or SH.cfg_from(None)
    st: Dict[str, Any] = {"gems": {g: 0 for g in GEMS}, "level": 1, "last": {g: 0.0 for g in GEMS}}
    P.init(st)
    st["b"] = P.fresh_levels(1)
    sessions = sorted(prof["sessions"])
    per = [prof["attacks"] // len(sessions) + (1 if i < prof["attacks"] % len(sessions) else 0) for i in range(len(sessions))]
    bset = prof.get("boost") or {}
    weeks = {k: 0 for k in bset}
    L: Dict[int, Dict[str, Any]] = {}              # per castle level
    jobs: List[Dict[str, Any]] = []
    keep_days: Dict[int, float] = {1: 0.0}
    tot = {"bot_gems": 0.0, "rushed_h": 0.0, "raids": 0, "raids_skipped_loss": 0, "raids_skipped_army": 0, "raids_skipped_pool": 0}
    ready_at = 0.0
    last_prog, last_sig = 0.0, None
    stall = None

    def lev(k: int) -> Dict[str, Any]:
        if k not in L:
            L[k] = {"t0": None, "mined": {g: 0.0 for g in GEMS}, "looted": {g: 0.0 for g in GEMS}, "bought": {g: 0.0 for g in GEMS}, "spent_up": {g: 0.0 for g in GEMS},
                    "spent_army": {g: 0.0 for g in GEMS}, "spent_rush": 0.0, "waste_mine": {g: 0.0 for g in GEMS}, "waste_loot": {g: 0.0 for g in GEMS}, "sessions": 0,
                    "idle": {"gems": 0, "vault": 0, "rule": 0, "nothing": 0, "busy": 0}, "lack": {g: 0 for g in GEMS}, "starts": 0}
        return L[k]

    day = 0
    while day < horizon_days:
        for si, hh in enumerate(sessions):
            now = day * DAY + hh * 3600.0
            for k, p in bset.items():                                   # keep every boost running (re-bought a week at a time, before it ends)
                b = BO.get(st, k, now)
                if not b or float(b["end"]) - now < 2 * 3600:
                    P.settle(st, now)
                    old = BO.window(st, k)
                    if k == "mine":
                        P.mine_bank(st, now)
                    end = (float(b["end"]) if b else now) + 7 * DAY
                    st.setdefault("bst", {})[k] = {"p": p, "s": now, "end": end}
                    weeks[k] += 1
                    if k == "build":
                        P.rebase_build(st, now, old, BO.window(st, "build"))
                    elif k == "army":
                        MI.rescale_lanes(st, now, old[0] / BO.window(st, "army")[0])
            P.settle(st, now)
            P.expire_mine_boost(st, now)
            keep = P.keep_level(st)
            A = lev(keep)
            if A["t0"] is None:
                A["t0"] = now
            A["sessions"] += 1
            # ---- collect (and measure what a full mine threw away)
            for g in GEMS:
                cap = P.vault_cap(g, max(1, P.level(st, "vault_" + g)))
                rt = P.mine_rate(g, max(1, P.level(st, "mine_" + g)))
                a_ = float((st.get("last") or {}).get(g, now))
                bo = BO.raw(st, "mine")
                sec = BO.boosted_seconds(a_, now, BO.speed(bo), float(bo.get("s", 0)), float(bo["end"])) if bo else max(0.0, now - a_)
                raw_ready = float((st.get("mb") or {}).get(g, 0.0)) + rt * sec / 3600.0
                A["waste_mine"][g] += max(0.0, raw_ready - rt * P.CAP_HOURS)
                have = P.mine_ready(st, g, now)
                n = int(min(have, max(0, cap - st["gems"][g])))
                st["gems"][g] += n
                A["mined"][g] += n
                P.mine_take(st, g, n, now)
            # ---- raids
            for _ in range(per[si]):
                if gate and now < ready_at:
                    tot["raids_skipped_army"] += 1
                    continue
                price = MI.ref_price_per_space(keep)
                space = MI.army_cap(max(1, P.level(st, "training")))
                need = {g: int(space * LOSS * price[g] + (16 if g == "turq" else 8 if g == "ruby" else 0)) for g in GEMS}
                r_loot = P.mine_rate("ruby", keep) * MI.LOOT_HOURS * prof["share"]
                if r_loot < need["ruby"] and st["gems"]["ruby"] < 0.8 * P.vault_cap("ruby", max(1, P.level(st, "vault_ruby"))):
                    tot["raids_skipped_loss"] += 1
                    continue
                if prof.get("smart", True) or day >= prof.get("smart_from_day", 10 ** 9):    # a sane player does not raid at a loss once the plunder pool is dry (value-weighted net < 0)
                    pl_ = MI.pool_levels(st, now)
                    net = 0.0
                    for g in GEMS:
                        nom_ = P.mine_rate(g, keep) * MI.LOOT_HOURS
                        f_ = 1.0 if pl_[g] >= nom_ else max(MI.POOL_FLOOR, pl_[g] / max(1.0, nom_))
                        net += price[g] * (nom_ * f_ * prof["share"] - need[g])
                    if net < 0 and st["gems"]["ruby"] < 0.8 * P.vault_cap("ruby", max(1, P.level(st, "vault_ruby"))):
                        tot["raids_skipped_pool"] = tot.get("raids_skipped_pool", 0) + 1
                        continue
                if any(st["gems"][g] < need[g] for g in GEMS):
                    if prof["pay"] <= 0:
                        continue
                    for g in GEMS:
                        if st["gems"][g] < need[g]:
                            A["bought"][g] += need[g] - st["gems"][g]
                            st["gems"][g] = need[g]
                for g in GEMS:
                    st["gems"][g] -= need[g]
                    A["spent_army"][g] += need[g]
                pool = MI.pool_levels(st, now)
                loot = {}
                for g in GEMS:
                    nominal = P.mine_rate(g, keep) * MI.LOOT_HOURS
                    f = 1.0 if pool[g] >= nominal else max(MI.POOL_FLOOR, pool[g] / max(1.0, nominal))
                    loot[g] = int(nominal * f * prof["share"])
                MI.pool_take(st, loot, now)
                for g in GEMS:
                    cap = P.vault_cap(g, max(1, P.level(st, "vault_" + g)))
                    add = min(loot[g], max(0, cap - st["gems"][g]))
                    st["gems"][g] += add
                    A["looted"][g] += add
                    A["waste_loot"][g] += loot[g] - add
                tot["raids"] += 1
                if gate:
                    ready_at = now + retrain_seconds(keep, int(bset.get("army", 0)))
            # ---- build
            for _ in range(60):
                keep = P.keep_level(st)
                order = ["keep"] + sorted((e for e in P.ORDER if e != "keep"), key=lambda e: (P.level(st, e), P.ORDER.index(e)))
                started = False
                for e in order:
                    why, info = P.can_start(st, e, now)
                    if why == "gems" and prof["pay"] > 0 and info:
                        c = P.cost(e, P.level(st, e) + 1)
                        miss = {g: max(0, c[g] - st["gems"][g]) for g in c}
                        if prof["pay"] >= 1.0 or all(miss[g] <= prof["pay"] * c[g] for g in c):
                            for g, n in miss.items():
                                st["gems"][g] += n
                                A["bought"][g] += n
                                lm = SH.level_mult(keep)
                                tot["bot_gems"] += n / (cfg["conv"][g][1] * lm) * cfg["conv"][g][0]
                            why, info = P.can_start(st, e, now)
                    if why == "ok":
                        _, it = P.start(st, e, now)
                        for g, n in info["cost"].items():
                            A["spent_up"][g] += n
                        jobs.append(it)
                        A["starts"] += 1
                        started = True
                        break
                if not started:
                    break
            # why does a builder stand idle?
            keep = P.keep_level(st)
            act = [i for i in st["q"] if i.get("end")]
            if len(act) < P.builders(keep):
                reasons = [P.can_start(st, e, now)[0] for e in P.ORDER]
                R = A["idle"]
                if "gems" in reasons:
                    R["gems"] += 1
                    cands = [e for e, r_ in zip(P.ORDER, reasons) if r_ == "gems"]
                    e0 = min(cands, key=lambda e: (e != "keep", P.level(st, e), P.ORDER.index(e)))     # the one the player would start first
                    c0 = P.cost(e0, P.level(st, e0) + 1)
                    lack = max(GEMS, key=lambda g: (c0.get(g, 0) - st["gems"][g]) / max(1.0, c0.get(g, 0)))
                    A["lack"][lack] += 1
                elif "vault" in reasons:
                    R["vault"] += 1
                elif any(r in ("round", "cap", "locked", "max") for r in reasons) and not any(r in ("queue_full",) for r in reasons):
                    R["rule"] += 1
                else:
                    R["nothing"] += 1
            # ---- rush
            act = [i for i in st["q"] if i.get("end")]
            if act and (prof["rush"] == "all" or st["gems"]["turq"] > 0.6 * P.vault_cap("turq", max(1, P.level(st, "vault_turq")))):
                it = max(act, key=lambda i: i["end"])
                c, cut, full = P.rush_plan(it, now, P.keep_level(st), P.rush_left(st, now))
                if cut > 0:
                    if st["gems"]["turq"] < c and prof["rush"] == "all":
                        lev(P.keep_level(st))["bought"]["turq"] += c - st["gems"]["turq"]
                        st["gems"]["turq"] = c
                    if st["gems"]["turq"] >= c:
                        r, _ = P.speedup(st, it["e"], now)
                        if r == "ok":
                            tot["rushed_h"] += cut / 3600.0
                            lev(P.keep_level(st))["spent_rush"] += c
            k = P.keep_level(st)
            if k not in keep_days:
                keep_days[k] = round(now / DAY, 2)
            if trace is not None:
                trace.append({"day": round(now / DAY, 2), "keep": k, "gems": dict(st["gems"]), "cap": {g: P.vault_cap(g, max(1, P.level(st, "vault_" + g))) for g in GEMS},
                              "mine_ready": {g: int(P.mine_ready(st, g, now)) for g in GEMS}, "rate": {g: P.mine_rate(g, max(1, P.level(st, "mine_" + g))) for g in GEMS},
                              "active": [(i["e"], i["to"]) for i in st["q"] if i.get("end")], "reserved": [(i["e"], i["to"]) for i in st["q"] if not i.get("end")],
                              "vault_lv": {g: P.level(st, "vault_" + g) for g in GEMS}, "mine_lv": {g: P.level(st, "mine_" + g) for g in GEMS}, "b": dict(st["b"])})
            sig =(tuple(sorted(st["b"].items())), len(st["q"]), sum(1 for i in st["q"] if i.get("end")))
            if sig != last_sig:
                last_sig, last_prog = sig, now
            elif now - last_prog > STALL_DAYS * DAY and stall is None:
                why_ = {e: P.can_start(st, e, now)[0] for e in P.ORDER}
                stall = {"day": round(now / DAY, 1), "keep": k, "reasons": why_, "gems": dict(st["gems"]), "levels": dict(st["b"])}
        day += 1
        if P.keep_level(st) >= (stop_level or P.MAX_LEVEL) or (stall and prof.get("stop_on_stall", True)):
            break
    # builder utilisation per castle level from the recorded jobs
    ks = sorted(keep_days)
    bounds = {k: (keep_days[k] * DAY, (keep_days.get(k + 1) * DAY if (k + 1) in keep_days else day * DAY)) for k in ks}
    util: Dict[int, float] = {}
    for k, (a, b) in bounds.items():
        if b <= a:
            continue
        busy = 0.0
        for it in jobs:
            s, e = it.get("s"), it.get("end")
            if s is None or e is None:
                continue
            busy += max(0.0, min(b, float(e)) - max(a, float(s)))
        util[k] = busy / ((b - a) * P.builders(k))
    sap = sum(weeks[k] * SH.boost_price(cfg, k, bset[k], 7) for k in weeks)
    if set(bset) == {"build", "army", "mine"} and len(set(bset.values())) == 1:
        sap = min(sap, weeks["build"] * SH.boost_price(cfg, "royal", next(iter(bset.values())), 7))
    return {"keep_days": keep_days, "levels": L, "util": util, "stall": stall, "tot": {**tot, "rushed_h": round(tot["rushed_h"]), "bot_gems": round(tot["bot_gems"]), "sapphire": sap},
            "days_run": day, "reached": P.keep_level(st)}


# ------------------------------------------------------------------ tables
def level_rows(res: Dict[str, Any]) -> List[Dict[str, Any]]:
    """One row per castle level of one run (the csv of the report)."""
    kd = res["keep_days"]
    rows = []
    for k in sorted(res["levels"]):
        A = res["levels"][k]
        t_end = kd.get(k + 1)
        days = (t_end - kd[k]) if t_end is not None else None
        r = {"level": k, "day_reached": kd.get(k), "days_in_level": round(days, 1) if days is not None else "",
             "builder_util": round(res["util"].get(k, 0.0), 3) if k in res["util"] else "", "sessions": A["sessions"], "starts": A["starts"]}
        for g in GEMS:
            r["mined_" + g] = int(A["mined"][g])
            r["looted_" + g] = int(A["looted"][g])
            r["bought_" + g] = int(A["bought"][g])
            r["spent_up_" + g] = int(A["spent_up"][g])
            r["spent_army_" + g] = int(A["spent_army"][g])
            r["waste_mine_" + g] = int(A["waste_mine"][g])
            r["waste_loot_" + g] = int(A["waste_loot"][g])
        r["spent_rush_turq"] = int(A["spent_rush"])
        for key, v in A["idle"].items():
            r["idle_" + key] = v
        for g in GEMS:
            r["lack_" + g] = A["lack"][g]
        rows.append(r)
    return rows


def write_csv(path: str, rows: List[Dict[str, Any]]) -> None:
    if not rows:
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    keys = list(rows[0])
    for r in rows:
        for k in r:
            if k not in keys:
                keys.append(k)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        w.writerows(rows)


HOURS_GRID = (0.25, 0.5, 1.0, 1.5, 2.5, 4.0)


def main(argv: List[str]) -> int:
    def opt(name: str, default: Any = None) -> Any:
        return argv[argv.index(name) + 1] if name in argv else default
    out = opt("--out", "/home/claude/work/ec1")
    if "--hours" in argv:
        pr = profile_for(float(opt("--hours")), skill=float(opt("--skill", 0.75)), pay=float(opt("--pay", 0.0)), bset=opt("--boost", "none"))
        r = simulate(pr, gate="--gate" in argv)
        kd = r["keep_days"]
        print("hours %.2f boost %s -> reached %d on day %s | marks %s | stall %s | tot %s" % (pr["hours"], pr["bset"], r["reached"], kd.get(r["reached"]),
              {m: kd.get(m) for m in (10, 20, 30, 40, 50)}, r["stall"], r["tot"]))
        return 0
    rows = []
    for h in HOURS_GRID:
        for bs in ("none", "build20", "mine20", "army20", "royal20"):
            pr = profile_for(h, bset=bs)
            r = simulate(pr)
            kd = r["keep_days"]
            rows.append({"hours_per_day": h, "boost": bs, "reached": r["reached"], "stall": bool(r["stall"]), **{"day_%d" % m: kd.get(m, "") for m in (5, 10, 20, 30, 40, 50)},
                         "sapphire_total": r["tot"]["sapphire"], "rushed_h": r["tot"]["rushed_h"], "raids": r["tot"]["raids"]})
            print(rows[-1], flush=True)
    write_csv(os.path.join(out, "ec1_grid.csv"), rows)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
