"""Boosts: build speed, army speed (training + brewing) and mine output, bought in the shop for sapphire / onyx (shop.py).

    st["bst"] = {"build": {"p": 20, "s": start, "end": t}, "army": {...}, "mine": {...}}       p = percent (5 / 10 / 15 / 20)

Everything is computed from timestamps (nothing runs in the background), exactly like the upgrade queue:
  * build  - progress.settle() runs every active upgrade at speed s = 1 + p/100 until the boost ends, then at speed 1
  * army   - military.settle() does the same for the training / brewing lanes
  * mine   - progress.mine_ready() counts the boosted part of the time a mine has been filling
A change (a purchase) always happens AFTER the state was settled to `now`; the remaining work of every running job is then re-timed
with the new speed (rebase), so a boost bought half-way through an upgrade speeds up the rest of it at once.
"""
from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

KINDS = ("build", "army", "mine")
TIERS = (5, 10, 15, 20)
DAYS = (1, 7, 30)


def raw(st: Dict[str, Any], kind: str) -> Optional[Dict[str, Any]]:
    b = (st.get("bst") or {}).get(kind)
    return b if isinstance(b, dict) and "end" in b else None


def get(st: Dict[str, Any], kind: str, now: float) -> Optional[Dict[str, Any]]:
    b = raw(st, kind)
    return b if b and float(b["end"]) > now else None


def speed(b: Optional[Dict[str, Any]]) -> float:
    return 1.0 + max(0, min(100, int(b["p"]))) / 100.0 if b else 1.0


def window(st: Dict[str, Any], kind: str) -> Tuple[float, float]:
    """(speed, end) of the stored boost of that kind - also of one that already ran out but was not settled yet; (1, 0) when none."""
    b = raw(st, kind)
    return (speed(b), float(b["end"])) if b else (1.0, 0.0)


def work_left(end: float, t: float, s: float, e: float) -> float:
    """Seconds of work (at speed 1) still needed by a job that finishes at `end`, seen at time t, running at speed s until e."""
    r = float(end) - t
    if r <= 0:
        return 0.0
    if e <= t or s == 1.0:
        return r
    a = min(r, e - t)
    return a * s + (r - a)


def end_for(w: float, t: float, s: float, e: float) -> float:
    """When a job with w seconds of work (at speed 1), started / re-timed at t, finishes - speed s until e, 1 after."""
    if w <= 0:
        return t
    if e <= t or s == 1.0:
        return t + w
    cap = (e - t) * s
    return t + w / s if w <= cap else e + (w - cap)


def boosted_seconds(a: float, b: float, s: float, start: float, e: float) -> float:
    """Effective seconds of production between a and b when the speed is s inside [start, e]."""
    if b <= a:
        return 0.0
    ov = max(0.0, min(b, e) - max(a, start))
    return (b - a) + (s - 1.0) * ov


def view(st: Dict[str, Any], now: float) -> Dict[str, Any]:
    out = {}
    for k in KINDS:
        b = get(st, k, now)
        if b:
            out[k] = {"p": int(b["p"]), "end": float(b["end"]), "left": round(float(b["end"]) - now, 1)}
    return out
