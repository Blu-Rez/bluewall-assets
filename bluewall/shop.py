"""The Blue Wall shop: boosts (sapphire) and royal items (onyx), plus the price list of gems that come from the bot.

Prices are the owner's: the bot's admin panel ("🏰 Blue Wall" under the game store admin) writes them to Redis key ``bluewall:cfg``
(JSON, any subset of DEFAULTS); Blue Wall merges that over DEFAULTS and re-reads it every CFG_TTL seconds.  Nothing here talks
to the bot: gems arrive only through the inbox (bridge.py), already converted by the bot.

  boosts   build / army / mine / royal (= all three) x 5 / 10 / 15 / 20 % x 1 / 7 / 30 days, paid in sapphire:
           price = boost[kind] (sapphire per day at 5 %) x p/5 x dmul[days]
           buying the SAME % again adds the days, a HIGHER % takes over (what was left of the old one is prorated into extra time),
           a LOWER % while a stronger one runs is refused ("stronger")
  items    tesla (up to 4 Tesla coils on the walls, onyx)
  conv     what 1 gem of the bot is worth here: {gem: [bot gems in, Blue Wall gems out at castle 1]}; ruby / emerald / turquoise grow with
           the castle level like the mines (x1.13 a level), so the help stays the same size all the way to the top castle level (bridge.level_mult)
"""
from __future__ import annotations

import json
import time
from typing import Any, Dict, Optional, Tuple

from . import boost as BO
from . import military as MI
from . import progress as PR

CFG_KEY = "bluewall:cfg"
CFG_TTL = 30.0

DEFAULTS: Dict[str, Any] = {
    # bot gem -> Blue Wall gem: [in, out] at castle 1  (blue = firoozeh, green = zomorrod, red = yaghoot)
    "conv": {"turq": [1, 10], "emerald": [1, 400], "ruby": [1, 1500], "sap": [1, 10], "onyx": [2, 1]},
    "boost": {"build": 5, "army": 4, "mine": 5, "royal": 12},             # sapphire per day at 5 %
    "dmul": {"1": 1, "7": 5, "30": 18},                                    # a week costs 5 days, a month 18
    "items": {"tesla": [10, 15, 20, 25]},             # onyx (tesla: 1st .. 4th)
}
CONV_FROM = {"turq": "blue", "emerald": "green", "ruby": "red", "sap": "red", "onyx": "red"}
BOOST_KINDS = ("build", "army", "mine", "royal")
TESLA_MAX = 4

_cache: Dict[str, Any] = {"t": 0.0, "cfg": None}


def _merge(base: Dict[str, Any], over: Any) -> Dict[str, Any]:
    out = json.loads(json.dumps(base))
    if not isinstance(over, dict):
        return out
    for k, v in over.items():
        if k in out and isinstance(out[k], dict) and isinstance(v, dict):
            for kk, vv in v.items():
                if kk in out[k]:
                    out[k][kk] = vv
    return out


def _valid(cfg: Dict[str, Any]) -> Dict[str, Any]:
    """Bad numbers from the panel fall back to the defaults, one entry at a time (a typo must never make a boost free)."""
    d = DEFAULTS
    for g, pair in list(cfg["conv"].items()):
        ok = isinstance(pair, (list, tuple)) and len(pair) == 2 and all(isinstance(x, (int, float)) and 1 <= x <= 1_000_000 for x in pair)
        cfg["conv"][g] = [int(pair[0]), int(pair[1])] if ok else list(d["conv"][g])
    for k, v in list(cfg["boost"].items()):
        cfg["boost"][k] = int(v) if isinstance(v, (int, float)) and 1 <= v <= 100_000 else d["boost"][k]
    for k, v in list(cfg["dmul"].items()):
        cfg["dmul"][k] = float(v) if isinstance(v, (int, float)) and 0.5 <= v <= 100 else d["dmul"][k]
    t = cfg["items"].get("tesla")
    if isinstance(t, (list, tuple)) and 2 <= len(t) <= TESLA_MAX and all(isinstance(x, (int, float)) and 1 <= x <= 100_000 for x in t):
        t = [int(x) for x in t]                                                        # (an older saved list of 2 prices keeps them and gets the 3rd/4th at +5 onyx each)
        while len(t) < TESLA_MAX: t.append(min(100_000, t[-1] + 5))
        cfg["items"]["tesla"] = t
    else:
        cfg["items"]["tesla"] = list(d["items"]["tesla"])
    cfg["items"].pop("egg_dragonling", None)                                          # (the egg is gone: the dragonling is a normal Lair unit; an old saved price is dropped)
    return cfg


def cfg_from(raw: Optional[str]) -> Dict[str, Any]:
    try:
        over = json.loads(raw) if raw else None
    except Exception:  # noqa: BLE001
        over = None
    return _valid(_merge(DEFAULTS, over))


async def load_cfg(r: Any) -> Dict[str, Any]:
    """The owner's price list (cached CFG_TTL s; defaults when Redis is missing / broken)."""
    now = time.monotonic()
    if _cache["cfg"] is not None and now - _cache["t"] < CFG_TTL:
        return _cache["cfg"]
    raw = None
    if r is not None:
        try:
            raw = await r.get(CFG_KEY)
        except Exception:  # noqa: BLE001
            raw = None
    _cache.update(t=now, cfg=cfg_from(raw))
    return _cache["cfg"]


def cfg_now() -> Dict[str, Any]:
    return _cache["cfg"] or cfg_from(None)


# ------------------------------------------------------------------ prices
def boost_price(cfg: Dict[str, Any], kind: str, p: int, days: int) -> Optional[int]:
    if kind not in BOOST_KINDS or p not in BO.TIERS or days not in BO.DAYS:
        return None
    return max(1, int(round(cfg["boost"][kind] * (p / 5.0) * float(cfg["dmul"][str(days)]))))


def tesla_price(cfg: Dict[str, Any], have: int) -> Optional[int]:
    return int(cfg["items"]["tesla"][have]) if 0 <= have < TESLA_MAX else None


def level_mult(keep: int) -> float:
    """How much one bot gem grows with the castle level (the mines' growth: x1.13 a level, x10.2 at castle 20, x35 at 30)."""
    return PR.RATE_GROWTH ** (max(1, min(PR.MAX_LEVEL, int(keep))) - 1)


def conv_out(cfg: Dict[str, Any], gem: str, n_in: int, keep: int) -> int:
    """Blue Wall gems for n_in bot gems (whole conversions only: n_in must be a multiple of the rate's `in`)."""
    i, o = cfg["conv"][gem]
    k = int(n_in) // int(i)
    out = k * o * (level_mult(keep) if gem in PR.GEMS else 1.0)
    return int(out)


def catalog(st: Dict[str, Any], cfg: Dict[str, Any], now: float) -> Dict[str, Any]:
    keep = PR.keep_level(st)
    own = st.get("own") or {}
    have_t = int(own.get("tesla", 0) or 0)
    return {
        "boost": {"kinds": list(BOOST_KINDS), "tiers": list(BO.TIERS), "days": list(BO.DAYS),
                  "price": {k: {str(p): {str(d): boost_price(cfg, k, p, d) for d in BO.DAYS} for p in BO.TIERS} for k in BOOST_KINDS},
                  "on": BO.view(st, now)},
        "items": {"tesla": {"have": have_t, "max": TESLA_MAX, "price": tesla_price(cfg, have_t), "cur": "onyx"}},
        "conv": {g: {"from": CONV_FROM[g], "in": int(cfg["conv"][g][0]), "out": conv_out(cfg, g, int(cfg["conv"][g][0]), keep)} for g in ("turq", "emerald", "ruby", "sap", "onyx")},
    }


# ------------------------------------------------------------------ buying (state already settled to `now` by the caller)
def _pay(st: Dict[str, Any], cur: str, n: int) -> bool:
    pm = st.setdefault("prem", {})
    if int(pm.get(cur, 0) or 0) < n:
        return False
    pm[cur] = int(pm.get(cur, 0)) - n
    return True


def _apply_boost(st: Dict[str, Any], kind: str, p: int, secs: float, now: float, cfg: Optional[Dict[str, Any]] = None) -> None:
    old = BO.get(st, kind, now)
    if old and int(old["p"]) == p:
        end = float(old["end"]) + secs
    elif old:
        # what was left of the weaker one becomes extra time at the new %: valued at the cheapest (30-day) price per day and paid back
        # at the 1-day price, so a long weak boost can never be turned into a cheap strong one
        dm = (cfg or cfg_now())["dmul"]
        k = (float(dm["30"]) / 30.0) / float(dm["1"])
        end = now + (float(old["end"]) - now) * int(old["p"]) / float(p) * min(1.0, k) + secs
    else:
        end = now + secs
    before = BO.window(st, kind)
    if kind == "mine":
        PR.mine_bank(st, now)
    elif kind == "army":
        pass
    st.setdefault("bst", {})[kind] = {"p": int(p), "s": now, "end": end}
    after = BO.window(st, kind)
    if kind == "build":
        PR.rebase_build(st, now, before, after)
    elif kind == "army":
        MI.rescale_lanes(st, now, before[0] / after[0])


def buy(st: Dict[str, Any], body: Dict[str, Any], cfg: Dict[str, Any], now: float) -> Tuple[str, Optional[Dict[str, Any]]]:
    what = str(body.get("id") or "")
    if what == "boost":
        kind = str(body.get("kind") or "")
        try:
            p, days = int(body.get("p")), int(body.get("d"))
        except (TypeError, ValueError, OverflowError):
            return "bad", None
        price = boost_price(cfg, kind, p, days)
        if price is None:
            return "bad", None
        kinds = BO.KINDS if kind == "royal" else (kind,)
        for k in kinds:
            b = BO.get(st, k, now)
            if b and int(b["p"]) > p:
                return "stronger", {"kind": k, "p": int(b["p"])}
        if not _pay(st, "sap", price):
            return "gems", {"gem": "sap", "need": price, "have": int((st.get("prem") or {}).get("sap", 0))}
        for k in kinds:
            _apply_boost(st, k, p, days * 86400.0, now, cfg)
        return "ok", {"cost": {"sap": price}, "kind": kind, "p": p, "d": days}
    if what == "tesla":
        own = st.setdefault("own", {})
        have = int(own.get("tesla", 0) or 0)
        price = tesla_price(cfg, have)
        if price is None:
            return "max", None
        if not _pay(st, "onyx", price):
            return "gems", {"gem": "onyx", "need": price, "have": int((st.get("prem") or {}).get("onyx", 0))}
        own["tesla"] = have + 1
        return "ok", {"cost": {"onyx": price}, "tesla": have + 1}
    return "bad", None
