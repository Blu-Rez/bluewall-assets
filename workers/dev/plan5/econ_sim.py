"""Blue Wall economy simulator for plan v5 (agent C).  Light CPU, pure Python, no writes outside /home/claude/dev/plan5.

    PYTHONDONTWRITEBYTECODE=1 python3 econ_sim.py            # baseline (current code) + proposed v5, prints tables, writes CSVs here

Part A  BASELINE: the rules exactly as in bluewall/progress.py + military.py today (imported read-only), with three player behaviours:
        A0 4 checks/day, no raids, no rush (= sim.py)      A1 + rush with all spare turquoise      A2 + 12 bot raids/day (3h player) + rush
Part B  PROPOSED v5 (this plan): gated rounds (castle L needs every built structure >= L-1, nothing above castle+1), 18 structures,
        t(L) power curve, cost = k x build-hours x production, scarce turquoise, concave rush price, bot plunder pool, army losses.
        Players: P3H = ~3 h/day (6 sessions, up to 12 raids/day), P30 = ~30 min/day (2 sessions, 2 raids/day); each with/without rush.
Every assumption is a named constant below; the plan file quotes them.
"""
from __future__ import annotations

import csv
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, "/home/claude/bot/bluebot_v2")
GEMS = ("ruby", "emerald", "turq")

# =====================================================================================================  PART A: baseline (current code)
def baseline(checks, raids_per_day=0, rush=False, horizon=800, loot_hours=3.0, ratio=1.2):
    from bluewall import progress as P          # read-only import (PYTHONDONTWRITEBYTECODE=1 keeps the tree clean)
    st = {"gems": {g: 0 for g in GEMS}, "level": 1}
    P.init(st)
    last = {g: 0.0 for g in GEMS}
    keep_day = {1: 0.0}
    rush_turq = 0
    loot_got = {g: 0 for g in GEMS}
    for day in range(horizon):
        for ci, hh in enumerate(checks):
            now = (day * 24 + hh) * 3600.0
            P.settle(st, now)
            for g in GEMS:
                lv = max(1, P.level(st, "mine_" + g)); rt = P.mine_rate(g, lv)
                exact = min(rt * P.CAP_HOURS, (now / 3600.0 - last[g]) * rt)
                room = max(0, P.vault_cap(g, max(1, P.level(st, "vault_" + g))) - st["gems"][g])
                n = int(min(exact, room)); st["gems"][g] += n; last[g] = now / 3600.0 - (exact - n) / rt
            # raids (current formula: loot = 3 h of the ATTACKER's own mine output x (0.7+0.5 ratio), full win; no daily limit)
            nr = raids_per_day // len(checks) + (1 if ci < raids_per_day % len(checks) else 0)
            for _ in range(nr):
                for g in GEMS:
                    lt = int(P.mine_rate(g, max(1, P.level(st, "mine_" + g))) * loot_hours * (0.7 + 0.5 * ratio))
                    room = max(0, P.vault_cap(g, max(1, P.level(st, "vault_" + g))) - st["gems"][g])
                    lt = min(lt, room); st["gems"][g] += lt; loot_got[g] += lt
            while True:                                   # spend like sim.py: castle first when it blocks, else cheapest/lowest
                keep = P.keep_level(st)
                blocked = any(P.level(st, e) >= P.max_allowed(e, keep) and P.level(st, e) < P.MAX_LEVEL for e in P.ORDER if e != "keep" and P.level(st, e) > 0)
                best = None
                for i, e in enumerate(P.ORDER):
                    why, info = P.can_start(st, e, now)
                    if why != "ok":
                        continue
                    key = (0 if (e == "keep" and blocked) else 1, P.level(st, e), i)
                    if best is None or key < best[0]:
                        best = (key, e)
                if best is None:
                    break
                if P.start(st, best[1], now)[0] != "ok":
                    break
            if rush:                                      # spend all turquoise on the rush price (5 turq / h) of running upgrades
                for it in sorted([i for i in st["q"] if i.get("end")], key=lambda i: i["end"]):
                    c = P.speedup_cost(it, now)
                    if st["gems"]["turq"] >= c:
                        P.speedup(st, it["e"], now); rush_turq += c
            k = P.keep_level(st)
            keep_day.setdefault(k, day + hh / 24.0)
        P.settle(st, (day + 1) * 86400.0)
        if all(P.level(st, e) >= 20 for e in P.ORDER) and not st["q"]:
            return {"max_day": day + 1, "keep_day": keep_day, "rush_turq": rush_turq, "loot": loot_got}
    return {"max_day": None, "keep_day": keep_day, "rush_turq": rush_turq, "loot": loot_got}


# =====================================================================================================  PART B: proposed v5
# ---- structures: id -> (time/cost multiplier m, gem weights w, castle level that unlocks it)
STRUCTS = {
    "keep":      (1.50, {"emerald": 1.0, "ruby": 0.5, "turq": 0.25}, 1),
    "wall":      (1.00, {"emerald": 0.8, "ruby": 0.6}, 1),          # the Blue Wall (citadel ring)
    "townwall":  (0.90, {"emerald": 0.8, "ruby": 0.5}, 2),          # the outer town ring (skin.js already has a separate 'townwall' entity)
    "towers":    (1.00, {"emerald": 0.6, "ruby": 0.8}, 1),          # 15 roofed archer towers
    "ballista":  (1.00, {"emerald": 0.6, "ruby": 0.8, "turq": 0.1}, 4),   # 6 of the 12 open tower tops (castle.js i%2==0)
    "cannon":    (1.00, {"emerald": 0.6, "ruby": 0.9}, 6),          # the other 6 open tops ('cannon' sites already in castle.js)
    "training":  (0.90, {"emerald": 0.6, "ruby": 0.6}, 1),          # army camp: housing + archers + healing
    "barracks":  (0.90, {"emerald": 0.6, "ruby": 0.7}, 1),
    "stable":    (0.90, {"emerald": 0.6, "ruby": 0.5, "turq": 0.2}, 3),
    "forge":     (1.10, {"emerald": 0.6, "ruby": 0.6, "turq": 0.3}, 5),
    "workshop":  (0.90, {"emerald": 0.7, "ruby": 0.8}, 7),
    "lair":      (1.00, {"emerald": 0.5, "ruby": 0.3, "turq": 0.6}, 9),
    "mine_ruby": (0.60, {"emerald": 0.6, "ruby": 0.2}, 1),
    "mine_emerald": (0.60, {"emerald": 0.5, "ruby": 0.3}, 1),
    "mine_turq": (0.60, {"emerald": 0.6, "turq": 0.15}, 1),
    "vault_ruby": (0.60, {"emerald": 0.7, "ruby": 0.2}, 1),
    "vault_emerald": (0.60, {"emerald": 0.6, "ruby": 0.3}, 1),
    "vault_turq": (0.60, {"emerald": 0.7, "turq": 0.15}, 1),
}
ORDER = list(STRUCTS)
T20 = float(os.getenv("T20", 265.0))        # hours for a x1.0 structure to go 19 -> 20 (castle x1.5 = 16.6 days); the table below is scaled by T20/250
TP = float(os.getenv("TP", 2.55))           # curve exponent:  t(L) = T20 * ((L-1)/19)^TP
T_BUILD = 1.0 / 6                           # building a newly unlocked structure (to level 1): 10 min
BASE = {"ruby": 30.0, "emerald": 40.0, "turq": 10.0}      # per hour at mine level 1
GROW = 1.13                                 # production x1.13 per mine level (L20 = x10.2, matches housing x9.9)
STORE_H = 12.0                              # a mine holds 12 h of output (offline accrual cap)
K_COST = {"emerald": 1.00, "ruby": 0.90, "turq": 2.0}     # cost = K x build-hours x hourly output (of that gem at mine level L-1) x m x w
COST_FLOOR = 12                             # per weighted gem, so level 2 never costs 1 gem
VAULT_FACTOR = 1.25                         # a vault at L holds 1.25 x the most expensive single cost of round L+1
RUSH_H_TURQ = 3.0                           # rushing 1 builder-hour costs ~3 h of turquoise output at castle level (concave, see rush_cost)
RUSH_EXP = 0.9
POOL_CAP_H, POOL_REFILL = 24.0, 1.0         # bot plunder pool: holds 24 h of output (all 3 gems), refills 1 h per hour
LOOT_FLOOR = float(os.getenv("FLOOR", 0.4))   # an empty pool still pays 40 % of the nominal bot loot (extra raids are ~break-even, never a loss)
LOOT_H = 3.0                                # a 3-star bot raid on an equal castle = 3 h of output (of every gem) at the attacker's castle level
LOSS = 0.35                                 # share of the army (space) that falls per raid (harness: owner army 23-46 % at ratio 0.54-1.15)
WOUNDED = float(os.getenv("WOUNDED", 0.5))  # of the fallen come back WOUNDED (camp heals them in time, no gems) -> gems pay for LOSS*(1-WOUNDED)
ARMY_COST = {"ruby": 3.1, "emerald": 1.1, "turq": float(os.getenv("ARMYT", 0.8))}    # per housing space: owner mix today r3.1 e1.1 t1.5 -> plan halves creature turquoise (t0.8)
ARMY_COST_EARLY = {"ruby": 3.5, "emerald": 1.5, "turq": 0.0}
SPELL_TURQ = 20                             # turquoise per raid for spells (2 cheap spells)
DAILY_TURQ_H = 4.0                          # daily tasks: 4 h of turquoise output (3h player gets all, 30-min player 2/3)
STAR_MIX = {"P3H": [(1.0, 0.70), (0.64, 0.25), (0.30, 0.05)], "P30": [(1.0, 0.6), (0.64, 0.3), (0.30, 0.1)]}   # (loot share, prob)
GAP_MOD = {2: 1.2, 1: 1.1, 0: 1.0, -1: 0.8, -2: 0.5, -3: 0.25}


def builders(k):
    return 3 if k >= 7 else 2


# the table that ships (balance.json): the power curve from level 8 on, hand-shortened levels 2-7 for the first hour / first week
T_TABLE = {2: 2 / 60, 3: 10 / 60, 4: 40 / 60, 5: 2.5, 6: 6.0, 7: 11.0, 8: 18.0, 9: 26.0, 10: 36.0, 11: 48.0, 12: 62.0, 13: 78.0, 14: 96.0,
           15: 115.0, 16: 137.0, 17: 161.0, 18: 188.0, 19: 218.0, 20: 250.0}
USE_TABLE = os.getenv("CURVE", "table") == "table"


def t_hours(L):
    if L <= 1:
        return T_BUILD
    if USE_TABLE:
        return T_TABLE[L] * T20 / 250.0
    return T20 * ((L - 1) / 19.0) ** TP


def rate(g, L):
    return BASE[g] * GROW ** (max(1, L) - 1)


def cost(e, L):
    m, w, _ = STRUCTS[e]
    out = {}
    for g, wg in w.items():
        out[g] = int(math.ceil(max(COST_FLOOR * wg, K_COST[g] * t_hours(L) * m * wg * rate(g, max(1, L - 1)))))
    return out


def housing(L):
    return 30 + 14 * (max(1, L) - 1) if L > 0 else 0


_VC = {}


def vault_cap(g, L):
    key = (g, L)
    if key not in _VC:
        nxt = min(20, L + 1)
        mx = max(cost(e, nxt).get(g, 0) for e in ORDER)
        _VC[key] = int(max(VAULT_FACTOR * mx, STORE_H * rate(g, L), 500))
    return _VC[key]


def rush_cost(rem_h, K):
    return int(math.ceil(RUSH_H_TURQ * rate("turq", K) * max(rem_h, 1 / 60) ** RUSH_EXP))


def max_allowed(e, keep):
    return 20 if e == "keep" else min(20, keep + 1)


def keep_ok(lv, to):
    """castle -> `to` needs every built structure (except the castle) at >= to-1"""
    return all(lv[e] >= to - 1 for e in ORDER if e != "keep" and lv[e] > 0)


def proposed(kind="P3H", rush=True, horizon=1200, verbose=False):
    sessions = {"P3H": [7.5, 10.5, 13.5, 17.0, 20.0, 23.0], "P30": [8.0, 21.0]}[kind]
    raids_day = {"P3H": int(os.getenv("RAIDS3H", 12)), "P30": int(os.getenv("RAIDS30", 2))}[kind]
    daily_share = {"P3H": 1.0, "P30": 0.67}[kind]
    lv = {e: (1 if STRUCTS[e][2] <= 1 else 0) for e in ORDER}
    gems = {"ruby": 120, "emerald": 200, "turq": 50}
    last = {g: -STORE_H * 0.5 for g in GEMS}          # mines start half full (as today)
    pool = {g: POOL_CAP_H for g in GEMS}              # in hours of output
    q = []                                            # [ent, to, end_h | None (reserved), dur_h]
    army_space = 10
    keep_day = {1: 0.0}
    stat = {"rush_turq": 0, "loot": {g: 0 for g in GEMS}, "mine": {g: 0 for g in GEMS}, "spent": {g: 0 for g in GEMS},
            "army": {g: 0 for g in GEMS}, "waste": {g: 0 for g in GEMS}, "idle_bh": 0.0, "rush_h": 0.0}
    t_prev = 0.0
    seed = [12345]

    def rnd():
        seed[0] = (seed[0] * 1103515245 + 12345) & 0x7FFFFFFF
        return seed[0] / 0x7FFFFFFF

    def settle(now):
        changed = True
        while changed:
            changed = False
            act = [x for x in q if x[2] is not None and x[2] <= now]
            if act:
                x = min(act, key=lambda x: x[2]); lv[x[0]] = max(lv[x[0]], x[1]); q.remove(x); changed = True
                tt = x[2]
                for r in q:
                    if r[2] is None and sum(1 for y in q if y[2] is not None) < builders(lv["keep"]):
                        r[2] = tt + r[3]
                if lv["keep"] not in keep_day:
                    keep_day[lv["keep"]] = (tt - sessions[0]) / 24.0          # (counted from the first session)

    def room(g):
        return max(0, vault_cap(g, max(1, lv["vault_" + g])) - gems[g])

    def add(g, n, src):
        n = int(n); r = room(g); got = min(n, r); gems[g] += got; stat[src][g] += got; stat["waste"][g] += n - got
        return got

    def can_start(e):
        if any(x[0] == e for x in q):
            return None
        keep = lv["keep"]
        if lv[e] == 0 and STRUCTS[e][2] > keep:
            return None
        to = lv[e] + 1
        if to > max_allowed(e, keep):
            return None
        if e == "keep" and not keep_ok(lv, to):
            return None
        c = cost(e, to)
        if any(gems[g] < n for g, n in c.items()):
            return None
        act = sum(1 for x in q if x[2] is not None); res = sum(1 for x in q if x[2] is None)
        if act >= builders(keep) and res >= 2:
            return None
        return to, c

    day = 0
    while day < horizon:
        day_sessions = ([sessions[0] + i / 12.0 for i in range(13)] + [h for h in sessions if h > sessions[0] + 1.0]) if day == 0 else sessions
        for si, hh in enumerate(day_sessions):
            now = day * 24 + hh
            # builder idle accounting (between sessions, from the previous state)
            act = sum(1 for x in q if x[2] is not None)
            settle(now)
            K = lv["keep"]
            # pool refill
            for g in GEMS:
                pool[g] = min(POOL_CAP_H, pool[g] + (now - t_prev) * POOL_REFILL)
            # collect mines
            for g in GEMS:
                rt = rate(g, lv["mine_" + g])
                exact = min(STORE_H, now - last[g]) * rt
                stat["waste"][g] += max(0, (now - last[g]) - STORE_H) * rt
                got = add(g, exact, "mine"); last[g] = now - (exact - got) / rt
            # daily tasks (first session of the day)
            if si == 0:
                add("turq", DAILY_TURQ_H * daily_share * rate("turq", K), "loot")
            # army: fill housing (new space costs), then raids
            cap = housing(lv["training"])
            ac = ARMY_COST if K >= 9 else ARMY_COST_EARLY
            if army_space < cap:
                need = cap - army_space
                pay = {g: int(need * ac[g]) for g in GEMS}
                if all(gems[g] >= pay[g] for g in GEMS):
                    for g in GEMS:
                        gems[g] -= pay[g]; stat["army"][g] += pay[g]
                    army_space = cap
            nr = (raids_day // len(sessions) + (1 if si < raids_day % len(sessions) else 0)) if (day > 0 or si == 0 or si >= 13) else 0
            for _ in range(nr):
                if army_space < cap * 0.8:
                    break
                x = rnd(); share = 0.3; acc = 0.0
                for sh, p in STAR_MIX[kind]:
                    acc += p
                    if x <= acc:
                        share = sh; break
                gap = [-1, 0, 0, 1][int(rnd() * 4)]
                for g in GEMS:
                    want_h = LOOT_H * share * GAP_MOD[gap]
                    take_h = max(min(want_h, pool[g]), want_h * LOOT_FLOOR); pool[g] -= min(want_h, pool[g])
                    add(g, take_h * rate(g, K), "loot")
                lost = int(army_space * LOSS * (1 - WOUNDED))
                pay = {g: int(lost * ac[g]) for g in GEMS}
                pay["turq"] += SPELL_TURQ if lv["forge"] > 0 else 0
                for g in GEMS:
                    p = min(gems[g], pay[g]); gems[g] -= p; stat["army"][g] += p
                # (the lost space is retrained from the same payment)
            # spend on upgrades: castle first, then the lowest structure (it is what gates the next castle level)
            while True:
                best = None
                for i, e in enumerate(ORDER):
                    r = can_start(e)
                    if not r:
                        continue
                    key = (0 if e == "keep" else 1, lv[e], STRUCTS[e][0], i)
                    if best is None or key < best[0]:
                        best = (key, e, r)
                if not best:
                    break
                _, e, (to, c) = best
                for g, n in c.items():
                    gems[g] -= n; stat["spent"][g] += n
                d = t_hours(to) * STRUCTS[e][0]
                act = sum(1 for x in q if x[2] is not None)
                q.append([e, to, now + d if act < builders(K) else None, d])
            # rush: spend turquoise above a reserve (one day of spells + 30 % of the vault) on the running upgrade with most time left
            if rush:
                reserve = 0.3 * vault_cap("turq", max(1, lv["vault_turq"])) + SPELL_TURQ * raids_day + cost("keep", min(20, K + 1)).get("turq", 0)
                for x in sorted([x for x in q if x[2] is not None], key=lambda x: -(x[2] - now)):
                    rem = x[2] - now
                    c = rush_cost(rem, K)
                    if gems["turq"] - c >= reserve:
                        gems["turq"] -= c; stat["rush_turq"] += c; stat["rush_h"] += rem; x[2] = now
                settle(now)
            t_prev = now
        day += 1
        settle(day * 24.0)
        if all(lv[e] >= 20 for e in ORDER) and not q:
            return {"max_day": day, "keep_day": keep_day, "stat": stat}
        if verbose and day % 30 == 0:
            print(kind, day, "keep", lv["keep"], {g: gems[g] for g in GEMS})
    return {"max_day": None, "keep_day": keep_day, "stat": stat}


def fmt_h(h):
    if h < 1:
        return "%dm" % round(h * 60)
    if h < 48:
        return ("%.1fh" % h).replace(".0h", "h")
    return "%.1fd" % (h / 24)


def main():
    out = []
    P = lambda *a: (print(*a), out.append(" ".join(str(x) for x in a)))
    # ---------------- Part A
    P("== A. BASELINE (current code) ==")
    a0 = baseline([7.0, 12.0, 18.0, 22.5])
    a1 = baseline([7.0, 12.0, 18.0, 22.5], rush=True)
    a2 = baseline([7.5, 10.5, 13.5, 17.0, 20.0, 23.0], raids_per_day=12, rush=True)
    a3 = baseline([8.0, 21.0], raids_per_day=2, rush=True)
    for name, r in (("A0 4 checks/day, no raids, no rush", a0), ("A1 + rush (5 turq/h)", a1), ("A2 3h/day: 12 raids/day + rush", a2), ("A3 30min/day: 2 raids/day + rush", a3)):
        kd = r["keep_day"]
        P("%-40s max-all day %s | castle 10 day %.1f | castle 20 day %.1f | turq spent on rush %s" % (name, r["max_day"], kd.get(10, -1), kd.get(20, -1), r["rush_turq"]))
    # ---------------- Part B
    P("")
    P("== B. PROPOSED v5 (T20=%.0f h, TP=%.2f) ==" % (T20, TP))
    res = {}
    for kind in ("P3H", "P30"):
        for rush in (False, True):
            res[(kind, rush)] = proposed(kind, rush)
    for (kind, rush), r in res.items():
        s = r["stat"]; kd = r["keep_day"]
        P("%s rush=%-5s max-all day %s | castle 20 day %.0f | builder-h rushed %.0f | waste %s" % (kind, rush, r["max_day"], kd.get(20, -1), s["rush_h"], {g: int(v) for g, v in s["waste"].items()}))
        P("    income: mines %s  loot+daily %s  | spent: upgrades %s  army+spells %s  rush-turq %s" % (s["mine"], s["loot"], s["spent"], s["army"], s["rush_turq"]))
    # level table
    rows = []
    P("")
    P("L | t(L) x1.0 | castle t | wall cost (e/r) | castle cost (e/r/t) | vault cap e/r/t at L | output/h e/r/t at L | housing | 3h:castle reached (day) | 3h+rush | 30m | 30m+rush")
    for L in range(1, 21):
        cw, ck = cost("wall", L), cost("keep", L)
        row = {"L": L, "t_h": round(t_hours(L), 3), "keep_t_h": round(t_hours(L) * 1.5, 3),
               "wall_e": cw.get("emerald", 0), "wall_r": cw.get("ruby", 0), "keep_e": ck.get("emerald", 0), "keep_r": ck.get("ruby", 0), "keep_t": ck.get("turq", 0),
               "vault_e": vault_cap("emerald", L), "vault_r": vault_cap("ruby", L), "vault_t": vault_cap("turq", L),
               "rate_e": round(rate("emerald", L)), "rate_r": round(rate("ruby", L)), "rate_t": round(rate("turq", L)), "housing": housing(L),
               "rush_1h_turq": rush_cost(1, L), "rush_1d_turq": rush_cost(24, L), "bot_loot_3star_e": round(LOOT_H * rate("emerald", L)),
               "bot_loot_3star_r": round(LOOT_H * rate("ruby", L)), "bot_loot_3star_t": round(LOOT_H * rate("turq", L)), "next_cost_ruby": int(math.ceil(0.15 * rate("ruby", L))),
               "day_3h": round(res[("P3H", False)]["keep_day"].get(L, -1), 2), "day_3h_rush": round(res[("P3H", True)]["keep_day"].get(L, -1), 2),
               "day_30m": round(res[("P30", False)]["keep_day"].get(L, -1), 2), "day_30m_rush": round(res[("P30", True)]["keep_day"].get(L, -1), 2)}
        rows.append(row)
        P("%2d | %6s | %6s | %7d/%-7d | %7d/%-7d/%-6d | %7d/%-7d/%-6d | %4d/%-4d/%-3d | %3d | %6.2f | %6.2f | %6.2f | %6.2f" % (
            L, fmt_h(row["t_h"]), fmt_h(row["keep_t_h"]), row["wall_e"], row["wall_r"], row["keep_e"], row["keep_r"], row["keep_t"], row["vault_e"], row["vault_r"], row["vault_t"],
            row["rate_e"], row["rate_r"], row["rate_t"], row["housing"], row["day_3h"], row["day_3h_rush"], row["day_30m"], row["day_30m_rush"]))
    with open(os.path.join(HERE, "econ_levels.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
    # total builder hours
    bh = sum(t_hours(L) * STRUCTS[e][0] for e in ORDER for L in range(1, 21))
    P("total builder-hours to max everything: %d  (= %.0f days with 3 builders at 100 %%)" % (bh, bh / 3 / 24))
    with open(os.path.join(HERE, "econ_sim_out.txt"), "w") as f:
        f.write("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
