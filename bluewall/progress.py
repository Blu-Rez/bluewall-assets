"""Blue Wall progression rules: structure levels 1-30 (p35), upgrade costs / times, builders and the upgrade queue.

Pure functions on the player's state dict (no I/O) so they are easy to test and to simulate (``python -m bluewall.sim``).

Concepts
  * 15 structures (STRUCTS), each with a level 0-30 (0 = not built yet).  Looks change at levels
    1 wood, 6 stone, 12 iron, 18 gold, 24 diamond, 30 blue crystal (p35: the old 20-level look ladder stretched over 30 levels) - that part lives on the client.
  * Upgrading structure E from level n-1 to n costs gems and takes time (T_HOURS: about a day at the first levels, 3 days at 5, ~5 days from level 10 on, 6.5 days at 30 for a normal
    structure; the castle takes 1.5x that; the days a player needs per castle level are in sim.py).
    The three gems have roles: emerald = construction (every upgrade), ruby = military, turquoise = magic / creatures (+ speed-ups).
    Every cost is "about one hour of the matching mine's output per hour of building", so resources grow with the time curve and never stop mattering.
  * Builders: 2 at the start, 3 from castle level 7.  Every active upgrade occupies one builder.
    Up to RESERVE_MAX more upgrades can be *reserved*: their gems are paid right away and they start by themselves,
    the moment a builder is free (to the second, computed from timestamps - nothing runs in the background).
  * Nothing may be higher than castle level + 2 (the castle itself goes to MAX_LEVEL = 30).
  * Rounds: the castle can go to level L only when every structure it has unlocked stands at level L-1 or higher (one clear flow:
    each castle level is a "round" in which the whole kingdom climbs one step).
  * Speed-up (rush): turquoise per remaining hour, but at most RUSH_DAY_H hours of building a day (saved up to RUSH_BANK_D days):
    gems can shorten the climb, never skip it (sim.py has the numbers for castle 20 and 30).
  * Boosts (boost.py): a build boost runs every active upgrade 5-20 % faster, a mine boost makes the mines 5-20 % richer.
State (stored with the player):  b = {struct: level},  q = [ {e, to, d, s, end} ]  (s/end = None while reserved),
  rsh = {h, t} (rush allowance), mb = {gem: banked mine output}, last = {gem: when it was banked}.
"""
from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple

from . import boost as BO

GEMS = ("ruby", "emerald", "turq")
MAX_LEVEL = 30                          # p35 (owner 5 Oct 2026): 30 levels
RESERVE_MAX = 2
CANCEL_REFUND = 0.5                    # of the paid gems when an *active* upgrade is cancelled (reserved ones refund fully)
SPEEDUP_FREE_S = 180.0                 # an upgrade with less than 3 minutes left finishes for free
RUSH_HOURS = 3.0                       # rush price per hour of building = this many hours of the castle-level turquoise output (concave: hours ** RUSH_EXP)
RUSH_EXP = 0.9
RUSH_DAY_H = 4.0                       # hours of building that may be rushed per day (refills continuously) ...
RUSH_BANK_D = 2                        # ... saved up for at most this many days

# ---- time (p35, owner 5 Oct 2026 22:16 / 22:21: the early game was far too fast): T_HOURS[n-1] = hours to take a structure to level n at multiplier 1; COST_K[n-1] scales every gem cost of level n.
# Fitted with ``dev/fit5.py`` on the real rules (sim.py) so that a GOOD player (plays every day, no boost, no gems bought) reaches castle level
#   2 / 3 / 4 / 5 / 6 / 7 / 8 / 9 / 10 on day 3 / 7 / 12 / 25 / 40 / 60 / 85 / 115 / 150 (his list; the fit gets 4 / 6 / 16 / 28 / 49 / 55 / 100 / 107 / 152: the round rule makes every second round
#   cheap - see dev/fit5.py - so the pairs average out to his list), ~14.5 months at 20, ~23 months at 30;
# the BEST player (every boost, gems bought, rush allowance used up) takes about 30-40 % less (castle 20 in ~8 months: his 20:53 words), a lazy one more.  ``python -m bluewall.sim`` prints the table.
# From level 4 on T never gets smaller and a level never costs less than the one below it (T x COST_K x 1.13^n never falls): upgrades only ever get longer and dearer.
T_HOURS = [
    0.167, 28.1, 10.6, 12.9, 33.2, 70.2, 87.9, 109.0, 112.0, 115.0,
    115.0, 115.0, 115.0, 119.0, 123.0, 127.0, 128.0, 129.0, 131.0, 132.0,
    132.0, 132.0, 132.0, 132.0, 132.0, 134.0, 139.0, 144.0, 150.0, 155.0,
]
COST_K = [
    0.669, 0.669, 1.568, 1.496, 0.763, 0.389, 0.520, 0.696, 0.734, 0.774,
    0.707, 0.645, 0.589, 0.537, 0.586, 0.640, 0.698, 0.762, 0.832, 0.908,
    0.916, 0.923, 0.931, 0.939, 0.947, 0.955, 0.963, 0.971, 0.979, 0.987,
]
# ---- gems: a level costs  K[gem] * (hours it takes) * (structure's weight for that gem) * (mine output per hour of the level below); never less than 12 * weight
GEM_K = {"emerald": 0.985, "ruby": 0.885, "turq": 1.97}


def t_hours(to: int) -> float:
    return T_HOURS[max(1, min(MAX_LEVEL, int(to))) - 1]


# id: (category, time multiplier, gem weights, castle level needed to build it)
STRUCTS: Dict[str, Tuple[str, float, Dict[str, float], int]] = {
    "keep":       ("town", 1.50, {"emerald": 1.0, "ruby": 0.5, "turq": 0.25}, 0),
    "wall":       ("defense", 1.00, {"emerald": 0.9, "ruby": 0.9, "turq": 0.2}, 0),
    "training":   ("army", 0.90, {"emerald": 0.6, "ruby": 0.8}, 0),
    "barracks":   ("army", 0.90, {"emerald": 0.7, "ruby": 1.0}, 0),
    "stable":     ("army", 0.90, {"emerald": 0.7, "ruby": 0.6, "turq": 0.4}, 3),
    "workshop":   ("army", 0.90, {"emerald": 0.8, "ruby": 1.0}, 7),
    "lair":       ("army", 1.00, {"emerald": 0.7, "turq": 1.0, "ruby": 0.3}, 10),
    "forge":      ("army", 1.10, {"emerald": 0.6, "ruby": 0.9, "turq": 0.2}, 5),
    "towers":     ("defense", 1.00, {"emerald": 0.8, "ruby": 0.8, "turq": 0.3}, 4),
    "mine_ruby":  ("resource", 0.60, {"emerald": 0.7, "ruby": 0.3}, 0),
    "mine_emerald": ("resource", 0.60, {"emerald": 0.5, "ruby": 0.4}, 0),
    "mine_turq":  ("resource", 0.60, {"emerald": 0.7, "turq": 0.3}, 0),
    "vault_ruby": ("resource", 0.60, {"emerald": 0.8, "ruby": 0.4}, 0),
    "vault_emerald": ("resource", 0.60, {"emerald": 0.6, "ruby": 0.4}, 0),
    "vault_turq": ("resource", 0.60, {"emerald": 0.8, "turq": 0.3}, 0),
}
ORDER = list(STRUCTS)
START_BUILT = [e for e, v in STRUCTS.items() if v[3] == 0]

BASE_RATE = {"ruby": 30.0, "emerald": 40.0, "turq": 10.0}     # gems per hour at mine level 1 (turquoise is the rarest gem)
RATE_GROWTH = 1.13                                              # per mine level: x10 at level 20, x35 at level 30, in step with the army housing
CAP_HOURS = 12.0                                                # a mine stores this many hours of production


def mine_rate(gem: str, level: int) -> float:
    return BASE_RATE[gem] * RATE_GROWTH ** (max(1, level) - 1)


_VC: Dict[Tuple[str, int], int] = {}


VAULT_MULT = 2                                                    # p35 (owner 5 Oct 2026: «ظرفیت منابع دو برابر بشه»): every vault holds twice what it did


def vault_cap(gem: str, level: int) -> int:
    """Storage of a vault: room for the dearest upgrade of the NEXT round (with 25 % spare) or 12 hours of output, never under 500 - so a vault never blocks an upgrade; x VAULT_MULT."""
    lv = max(1, min(MAX_LEVEL, int(level)))
    key = (gem, lv)
    if key not in _VC:
        nxt = min(MAX_LEVEL, lv + 1)
        big = max(max(cost(e, n).get(gem, 0) for e in ORDER) for n in range(1, nxt + 1))      # (a vault never shrinks as it levels: the dearest upgrade of any round up to the next one fits, also when a level of the tail above 20 is cheaper than the levels before it)
        _VC[key] = int(VAULT_MULT * max(500, math.ceil(1.25 * big), math.ceil(12 * mine_rate(gem, lv))))
    return _VC[key]


def builders(keep_level: int) -> int:
    return 3 if keep_level >= 7 else 2


def cost(ent: str, to: int) -> Dict[str, int]:
    """Gems for taking `ent` to level `to` (to=1 means building it)."""
    w = STRUCTS[ent][2]
    th = t_hours(to) * STRUCTS[ent][1]
    k = COST_K[max(1, min(MAX_LEVEL, int(to))) - 1]
    return {g: int(math.ceil(int(math.ceil(max(12.0 * w[g], GEM_K[g] * th * w[g] * mine_rate(g, max(1, to - 1))))) * k)) for g in GEMS if g in w}


def dur(ent: str, to: int) -> float:
    """Seconds for taking `ent` to level `to`."""
    return max(120.0, t_hours(to) * STRUCTS[ent][1] * 3600.0)


def max_allowed(ent: str, keep: int) -> int:
    return MAX_LEVEL if ent == "keep" else min(MAX_LEVEL, keep + 2)


def fresh_levels(keep: int = 1) -> Dict[str, int]:
    return {e: (keep if v[3] <= keep else 0) for e, v in STRUCTS.items()}


def all_max() -> Dict[str, int]:
    return {e: MAX_LEVEL for e in STRUCTS}


# ------------------------------------------------------------------ state helpers
def init(st: Dict[str, Any], owner: bool = False, legacy_level: Optional[int] = None) -> None:
    """Make sure st has b / q (migrates v1 states that only had a castle level)."""
    if "b" not in st or not isinstance(st["b"], dict):
        lvl = max(1, min(MAX_LEVEL, int(legacy_level or st.get("level", 1) or 1)))
        st["b"] = all_max() if (owner and lvl >= MAX_LEVEL) else fresh_levels(lvl)
    for e in STRUCTS:
        st["b"].setdefault(e, 0)
    st.setdefault("q", [])


def level(st: Dict[str, Any], ent: str) -> int:
    return int(st["b"].get(ent, 0))


def keep_level(st: Dict[str, Any]) -> int:
    return max(1, level(st, "keep"))


def planned(st: Dict[str, Any], ent: str) -> int:
    n = level(st, ent)
    for it in st["q"]:
        if it["e"] == ent:
            n = max(n, int(it["to"]))
    return n


def _active(st: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [i for i in st["q"] if i.get("end")]


def _reserved(st: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [i for i in st["q"] if not i.get("end")]


def _start_reserved(st: Dict[str, Any], t: float) -> bool:
    """Reserved upgrades take the builders that are free at time t (the build boost, if one runs at t, speeds them up)."""
    s, e = BO.window(st, "build")
    free = builders(keep_level(st)) - len(_active(st))
    started = False
    for res in _reserved(st):
        if free <= 0:
            break
        res["s"], res["end"] = t, BO.end_for(float(res["d"]), t, s, e)
        free -= 1; started = True
    return started


def settle(st: Dict[str, Any], now: float) -> bool:
    """Complete every upgrade whose time is up (in order), start reserved ones in the slots that free up (with the build boost that
    runs at that moment), drop a build boost whose time is up. True if anything changed."""
    changed = False
    while True:
        s, e = BO.window(st, "build")
        act = _active(st)
        nxt = min((float(i["end"]) for i in act), default=None)
        if 0 < e <= now and (nxt is None or e < nxt):
            st["bst"].pop("build", None)           # (every end time was computed knowing when the boost stops: nothing to re-time)
            changed = True
            continue
        if nxt is None or nxt > now:
            return _start_reserved(st, now) or changed     # (a builder that came with a castle level / a patch picks up a waiting reservation)
        it = min((i for i in act if float(i["end"]) == nxt), key=lambda i: i["end"])
        st["b"][it["e"]] = max(level(st, it["e"]), int(it["to"]))
        st["q"].remove(it)
        changed = True
        _start_reserved(st, nxt)


def rebase_build(st: Dict[str, Any], t: float, old: Tuple[float, float], new: Tuple[float, float]) -> None:
    """A build boost changed at time t (state already settled to t): re-time the running upgrades from their remaining work."""
    for it in _active(st):
        w = BO.work_left(float(it["end"]), t, old[0], old[1])
        it["end"] = BO.end_for(w, t, new[0], new[1])


def round_left(st: Dict[str, Any], to: int) -> List[str]:
    """Structures that still stand below to-1 (the castle may go to `to` only when this list is empty; finished levels only - an
    upgrade that is merely queued could be cancelled again)."""
    keep = keep_level(st)
    return [e for e in ORDER if e != "keep" and STRUCTS[e][3] <= keep and level(st, e) < to - 1]


def can_start(st: Dict[str, Any], ent: str, now: float) -> Tuple[str, Optional[Dict[str, Any]]]:
    """('ok', info) or (reason, info): locked / max / cap / round / busy / vault / gems / queue_full."""
    if ent not in STRUCTS:
        return "bad", None
    keep = keep_level(st)
    cur = level(st, ent)
    if any(i["e"] == ent for i in st["q"]):
        return "busy", None
    to = cur + 1
    if cur == 0 and STRUCTS[ent][3] > keep:
        return "locked", {"need_keep": STRUCTS[ent][3]}
    if to > MAX_LEVEL:
        return "max", None
    if to > max_allowed(ent, keep):
        return "cap", {"need_keep": to - 2}
    if ent == "keep":
        left = round_left(st, to)
        if left:
            return "round", {"need": to - 1, "left": left}
    c = cost(ent, to)
    for g, n in c.items():
        if n > vault_cap(g, max(1, level(st, "vault_" + g))):
            return "vault", {"gem": g, "need": n, "cap": vault_cap(g, max(1, level(st, "vault_" + g)))}
    for g, n in c.items():
        if int(st["gems"].get(g, 0)) < n:
            return "gems", {"gem": g, "need": n, "have": int(st["gems"].get(g, 0))}
    if len(_active(st)) >= builders(keep) and len(_reserved(st)) >= RESERVE_MAX:
        return "queue_full", None
    return "ok", {"to": to, "cost": c, "dur": dur(ent, to)}


def start(st: Dict[str, Any], ent: str, now: float) -> Tuple[str, Optional[Dict[str, Any]]]:
    settle(st, now)
    why, info = can_start(st, ent, now)
    if why != "ok" or not info:
        return why, info
    for g, n in info["cost"].items():
        st["gems"][g] = int(st["gems"].get(g, 0)) - n
    it = {"e": ent, "to": info["to"], "d": info["dur"], "s": None, "end": None, "paid": info["cost"]}
    if len(_active(st)) < builders(keep_level(st)):
        s, e = BO.window(st, "build")
        it["s"], it["end"] = now, BO.end_for(float(info["dur"]), now, s, e)
    st["q"].append(it)
    return "ok", it


def cancel(st: Dict[str, Any], ent: str, now: float) -> Tuple[str, Optional[Dict[str, Any]]]:
    settle(st, now)
    for it in st["q"]:
        if it["e"] == ent:
            k = CANCEL_REFUND if it.get("end") else 1.0
            for g, n in (it.get("paid") or {}).items():
                st["gems"][g] = int(st["gems"].get(g, 0)) + int(n * k)          # (paid gems come back even above the vault, like gifts)
            st["q"].remove(it)
            if it.get("end"):                     # a builder is free again: the next reserved upgrade starts now
                _start_reserved(st, now)
            return "ok", it
    return "none", None


# ---- rush: turquoise finishes building at once, but only RUSH_DAY_H hours of it a day (the allowance refills continuously and can be
# saved up for RUSH_BANK_D days).  Without this cap a big spender could skip the whole climb; with it the fastest castle 20 is ~8 months.
def rush_left(st: Dict[str, Any], now: float) -> float:
    """Hours of building the player may still rush right now."""
    r = st.get("rsh")
    if not isinstance(r, dict):
        return float(RUSH_DAY_H * RUSH_BANK_D)
    h = float(r.get("h", 0)) + max(0.0, now - float(r.get("t", now))) / 86400.0 * RUSH_DAY_H
    return max(0.0, min(float(RUSH_DAY_H * RUSH_BANK_D), h))


def _rush_use(st: Dict[str, Any], now: float, seconds: float) -> None:
    st["rsh"] = {"h": round(max(0.0, rush_left(st, now) - seconds / 3600.0), 4), "t": now}


def rush_price(keep: int, seconds: float) -> int:
    """Turquoise to finish `seconds` of building at once: ~3 hours of the castle-level turquoise output per hour (concave), free under 3 minutes."""
    if seconds <= SPEEDUP_FREE_S:
        return 0
    return max(1, int(math.ceil(RUSH_HOURS * mine_rate("turq", max(1, keep)) * (seconds / 3600.0) ** RUSH_EXP)))


def rush_plan(it: Dict[str, Any], now: float, keep: int, left_h: float) -> Tuple[int, float, bool]:
    """(turquoise, seconds it cuts, finishes?) of one rush of an active upgrade: the whole rest when the allowance covers it,
    otherwise as many hours as the allowance has left; (0, 0, False) when the allowance is used up."""
    rem = max(0.0, float(it["end"]) - now)
    if rem <= SPEEDUP_FREE_S:
        return 0, rem, True                                   # (the last 3 minutes are free and use no allowance)
    cut = min(rem, left_h * 3600.0)
    if cut < 60.0:
        return 0, 0.0, False
    return rush_cut_price(keep, cut), cut, cut >= rem - 1e-6


def rush_cut_price(keep: int, seconds: float) -> int:
    """Price of rushing `seconds` of a longer upgrade: never free (a partial cut must always cost turquoise and allowance)."""
    return max(1, int(math.ceil(RUSH_HOURS * mine_rate("turq", max(1, keep)) * (seconds / 3600.0) ** RUSH_EXP)))


def speedup_cost(it: Dict[str, Any], now: float, keep: int = 1) -> int:
    return rush_price(keep, max(0.0, float(it["end"]) - now))


def speedup(st: Dict[str, Any], ent: str, now: float) -> Tuple[str, Optional[Dict[str, Any]]]:
    settle(st, now)
    for it in st["q"]:
        if it["e"] == ent:
            if not it.get("end"):
                return "reserved", None
            c, cut, full = rush_plan(it, now, keep_level(st), rush_left(st, now))
            if cut <= 0:
                return "rush_limit", {"day_h": RUSH_DAY_H, "left_h": round(rush_left(st, now), 2)}
            if int(st["gems"].get("turq", 0)) < c:
                return "gems", {"gem": "turq", "need": c, "have": int(st["gems"].get("turq", 0))}
            st["gems"]["turq"] = int(st["gems"]["turq"]) - c
            if float(it["end"]) - now > SPEEDUP_FREE_S:
                _rush_use(st, now, cut)                       # (every paid cut uses the allowance - only the free last 3 minutes do not)
            it["end"] = now if full else float(it["end"]) - cut
            settle(st, now)
            return "ok", {"cost": c, "cut": round(cut), "full": full}
    return "none", None


# ---- mines: output is banked (mb) whenever something changes the speed of a mine (a mine boost starts), and counted from `last` on
def mine_ready(st: Dict[str, Any], m: str, now: float) -> float:
    rt = mine_rate(m, max(1, level(st, "mine_" + m)))
    a = float((st.get("last") or {}).get(m, now))
    b = BO.raw(st, "mine")
    sec = BO.boosted_seconds(a, now, BO.speed(b), float(b.get("s", 0)), float(b["end"])) if b else max(0.0, now - a)
    return min(rt * CAP_HOURS, float((st.get("mb") or {}).get(m, 0.0)) + rt * sec / 3600.0)


def mine_bank(st: Dict[str, Any], now: float) -> None:
    """Freeze what every mine holds right now (before its speed changes)."""
    for m in GEMS:
        st.setdefault("mb", {})[m] = round(mine_ready(st, m, now), 4)
        st.setdefault("last", {})[m] = now


def mine_take(st: Dict[str, Any], m: str, n: int, now: float) -> None:
    left = max(0.0, mine_ready(st, m, now) - n)
    st.setdefault("mb", {})[m] = round(left, 4)
    st.setdefault("last", {})[m] = now


def mine_view(st: Dict[str, Any], m: str, now: float) -> Dict[str, Any]:
    """What the client shows / extrapolates: the CURRENT rate (boost included) and a `last` such that (now-last)*rate = ready."""
    rt = mine_rate(m, max(1, level(st, "mine_" + m)))
    eff = rt * BO.speed(BO.get(st, "mine", now))
    ready = mine_ready(st, m, now)
    return {"rate": round(eff, 3), "cap": round(rt * CAP_HOURS, 1), "ready": int(ready), "last": now - ready / eff * 3600.0,
            "lv": level(st, "mine_" + m)}


def expire_mine_boost(st: Dict[str, Any], now: float) -> bool:
    b = BO.raw(st, "mine")
    if b and float(b["end"]) <= now:
        mine_bank(st, now)                                    # (the boosted part up to its end is counted before it is dropped)
        st["bst"].pop("mine", None)
        return True
    return False


# ------------------------------------------------------------------ client view
def view(st: Dict[str, Any], now: float) -> Dict[str, Any]:
    keep = keep_level(st)
    nb = builders(keep)
    rl = rush_left(st, now)
    structs = {}
    for e in ORDER:
        cur = level(st, e)
        row: Dict[str, Any] = {"lv": cur, "cat": STRUCTS[e][0]}
        qi = next((i for i in st["q"] if i["e"] == e), None)
        if qi:
            row["up"] = {"to": int(qi["to"]), "end": qi.get("end"), "start": qi.get("s"), "dur": float(qi["d"]),
                         "reserved": not qi.get("end")}
            if qi.get("end"):
                c, cut, full = rush_plan(qi, now, keep, rl)
                row["up"].update({"rush": c, "rush_cut": round(cut), "rush_full": full})
        else:
            why, info = can_start(st, e, now)
            row["next"] = {"to": cur + 1, "ok": why == "ok", "why": None if why == "ok" else why,
                           "cost": cost(e, cur + 1) if cur < MAX_LEVEL else None,
                           "dur": dur(e, cur + 1) if cur < MAX_LEVEL else None}
            if why not in ("ok", "max"):
                row["next"]["info"] = info
        if cur == 0:
            row["unlock"] = STRUCTS[e][3]
        structs[e] = row
    return {"b": {e: level(st, e) for e in ORDER}, "structs": structs, "builders": nb,
            "builders_busy": len(_active(st)), "reserve_max": RESERVE_MAX, "reserved": len(_reserved(st)),
            "next_builder": (7 if nb < 3 else None), "rush_h": round(rl, 2), "rush_day_h": RUSH_DAY_H}


def catalog() -> Dict[str, Any]:
    """Static tables (cacheable): per structure and level the gem cost and duration."""
    out = {}
    for e in ORDER:
        out[e] = {"cat": STRUCTS[e][0], "unlock": STRUCTS[e][3],
                  "cost": [cost(e, n) for n in range(1, MAX_LEVEL + 1)], "dur": [int(dur(e, n)) for n in range(1, MAX_LEVEL + 1)]}
    return {"structs": out, "max_level": MAX_LEVEL, "builders_at": {"2": 1, "3": 7}, "rush_hours": RUSH_HOURS, "rush_free_s": SPEEDUP_FREE_S, "cap_hours": CAP_HOURS,
            "rates": {g: [round(mine_rate(g, n), 2) for n in range(1, MAX_LEVEL + 1)] for g in GEMS}, "vault": {g: [vault_cap(g, n) for n in range(1, MAX_LEVEL + 1)] for g in GEMS},
            "tiers": [1, 6, 12, 18, 24, 30], "gem_roles": {"emerald": "build", "ruby": "military", "turq": "magic"}}


def balance() -> Dict[str, Any]:
    """The few numbers the client also needs for its offline preview (client/src/balance.json): regenerate with
    ``cd bluebot_v2 && python3 -m bluewall.progress > bluewall/client/src/balance.json`` - the client never keeps a copy of its own."""
    return {"max_level": MAX_LEVEL, "cap_hours": CAP_HOURS, "rates": {g: [round(mine_rate(g, n), 4) for n in range(1, MAX_LEVEL + 1)] for g in GEMS},
            "vault": {g: [vault_cap(g, n) for n in range(1, MAX_LEVEL + 1)] for g in GEMS}, "builders_at": {"2": 1, "3": 7},
            "rush": {"hours": RUSH_HOURS, "exp": RUSH_EXP, "free_s": SPEEDUP_FREE_S, "day_h": RUSH_DAY_H, "bank_d": RUSH_BANK_D}}


if __name__ == "__main__":
    import json
    print(json.dumps(balance(), separators=(",", ":")))
