"""Bridge: the bot -> Blue Wall (gifts, prizes and the player's own conversions from the bot's store).

Conversions (economy v6, owner 3 Oct 2026): in the bot's game store › تبدیل › «🏰 Blue Wall» a player turns his bot gems into Blue
Wall gems - each colour into its own colour (🔵 firoozeh -> turquoise, 🟢 zomorrod -> emerald, 🔴 yaghoot -> ruby) plus the two special
gems (🔴 -> deep-blue sapphire / black onyx).  One way: once sent they live in Blue Wall.  The rates are the owner's (bot admin ->
Redis ``bluewall:cfg``, see shop.py); ruby / emerald / turquoise grow with the castle level like the mines do, so a gem is worth the
same help at castle 3 and at castle 18.  The bot debits its own wallet first (its DB), then calls ``convert()`` with the SAME id until
it succeeds - Blue Wall applies each id once.

    from bluewall import bridge
    out = await bridge.quote(redis, uid, "turq", 5)                 # -> {"gem": "turq", "in": 5, "out": 170, "keep": 4, "rate": [1, 10]}
    ok  = await bridge.convert(redis, uid, {"turq": 170}, gid="cv:<transfer id>")

The bot (or any other service) drops a gift into a Redis list, Blue Wall picks it up the next time that player's kingdom is read
(state.Store._drain_inbox), once per gift id, and shows a toast.  1 blue gem = 10 turquoise.

    from bluewall.bridge import credit              # async, inside the bot
    await credit(redis, uid, 5, src="hokm:<match id>", gid="hokm:<match id>:<uid>")     # -> +50 turquoise in Blue Wall
    await credit(redis, uid, 0, src="tournament", gid="t:42:<uid>", onyx=1)             # -> +1 black onyx (a prize; also sap=N for the deep-blue sapphire)

    python3 -m bluewall.bridge --grant UID N       # by hand (server shell): N blue gems -> N*10 turquoise
    python3 -m bluewall.bridge --grant-prem UID SAP ONYX   # the special gems (deep-blue sapphire / black onyx) as a prize
    python3 -m bluewall.bridge --peek UID          # what is waiting in that player's inbox

Nothing here talks to Telegram and nothing here touches the bot's own balances: it only *adds* a gift record.
`gid` makes the call safe to repeat (same gid = credited once).
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import time
import uuid
from typing import Any, Optional

INBOX_KEY = "bluewall:inbox:{}"
STATE_KEY = "bluewall:st:{}"
KEEP = 500                                   # an inbox never grows past this (oldest dropped) — a player who never opens Blue Wall cannot bloat Redis
GEMS_OUT = ("turq", "emerald", "ruby", "sap", "onyx")
CONV_MAX = 100_000_000                       # the most one conversion may bring (Blue Wall clamps an entry to this: state.INBOX_MAX_CONV)


def entry(blue: int, src: str = "", gid: Optional[str] = None, sap: int = 0, onyx: int = 0) -> str:
    n = int(blue)
    if n < 0 or int(sap) < 0 or int(onyx) < 0 or (n <= 0 and int(sap) <= 0 and int(onyx) <= 0):
        raise ValueError("blue / sap / onyx must be > 0")
    g = str(gid) if gid else uuid.uuid4().hex
    if len(g) > 48:                                                                            # (a long game id is hashed, never cut: two different ids must stay different)
        g = hashlib.sha1(g.encode("utf-8", "replace")).hexdigest()
    e = {"id": g, "src": str(src)[:40], "t": int(time.time())}
    if n:
        e["blue"] = n
    if int(sap):
        e["sap"] = int(sap)                                                                    # deep-blue sapphire (a prize)
    if int(onyx):
        e["onyx"] = int(onyx)                                                                  # black onyx (a prize)
    return json.dumps(e, separators=(",", ":"))


async def credit(r: Any, uid: int, blue: int, src: str = "", gid: Optional[str] = None, sap: int = 0, onyx: int = 0) -> bool:
    """r: any redis.asyncio client (the bot's own is fine).  Returns True when the gift was queued."""
    try:
        k = INBOX_KEY.format(int(uid))
        await r.rpush(k, entry(blue, src, gid, sap, onyx))
        await r.ltrim(k, -KEEP, -1)
        return True
    except Exception:  # noqa: BLE001
        return False                                                                         # (a gift must never break the game that awards it)


def credit_sync(r: Any, uid: int, blue: int, src: str = "", gid: Optional[str] = None, sap: int = 0, onyx: int = 0) -> bool:
    try:
        k = INBOX_KEY.format(int(uid))
        r.rpush(k, entry(blue, src, gid, sap, onyx))
        r.ltrim(k, -KEEP, -1)
        return True
    except Exception:  # noqa: BLE001
        return False


# ------------------------------------------------------------------ conversions from the bot's store
async def castle_level(r: Any, uid: int) -> int:
    """The player's castle level in Blue Wall (1 when he never opened it / anything fails)."""
    try:
        raw = await r.get(STATE_KEY.format(int(uid)))
        if not raw:
            return 1
        st = json.loads(raw)
        from . import progress as _PR
        return max(1, min(_PR.MAX_LEVEL, int((st.get("b") or {}).get("keep") or st.get("level") or 1)))
    except Exception:  # noqa: BLE001
        return 1


async def rates(r: Any) -> dict:
    """{gem: [bot gems in, Blue Wall gems out at castle 1]} - the owner's live price list (shop.py defaults when unset)."""
    from . import shop as SH
    try:
        raw = await r.get(SH.CFG_KEY)
    except Exception:  # noqa: BLE001
        raw = None
    return SH.cfg_from(raw)["conv"]


async def quote(r: Any, uid: int, gem: str, n_in: int) -> Optional[dict]:
    """What n_in bot gems become in Blue Wall for this player right now (None for a bad gem / amount)."""
    from . import shop as SH
    if gem not in GEMS_OUT:
        return None
    try:
        n_in = int(n_in)
    except (TypeError, ValueError):
        return None
    try:
        raw = await r.get(SH.CFG_KEY)
    except Exception:  # noqa: BLE001
        raw = None
    cfg = SH.cfg_from(raw)
    i, o = cfg["conv"][gem]
    if n_in <= 0 or n_in % int(i) != 0 or n_in > 9_999_999:
        return None
    keep = await castle_level(r, uid)
    out = SH.conv_out(cfg, gem, n_in, keep)
    eff = float(o) * (SH.level_mult(keep) if gem in ("turq", "emerald", "ruby") else 1.0)
    k = int(CONV_MAX // max(1e-9, eff))
    while k > 0 and SH.conv_out(cfg, gem, k * int(i), keep) > CONV_MAX:
        k -= 1
    return {"gem": gem, "in": n_in, "out": out, "keep": keep, "rate": [int(i), int(o)], "over": out > CONV_MAX,
            "max_in": min(k * int(i), 9_999_999 // int(i) * int(i)), "mult": round(SH.level_mult(keep), 3) if gem in ("turq", "emerald", "ruby") else 1.0}


def convert_entry(gems: dict, gid: str) -> str:
    out = {g: int(n) for g, n in (gems or {}).items() if g in GEMS_OUT and int(n) > 0}
    if not out or not gid:
        raise ValueError("nothing to send")
    g = str(gid)
    if len(g) > 48:
        g = hashlib.sha1(g.encode("utf-8", "replace")).hexdigest()
    return json.dumps({"id": g, "src": "convert", "t": int(time.time()), **out}, separators=(",", ":"))


async def convert(r: Any, uid: int, gems: dict, gid: str) -> bool:
    """Deliver an already-paid conversion (idempotent by gid: call again with the same gid until it returns True)."""
    try:
        k = INBOX_KEY.format(int(uid))
        await r.rpush(k, convert_entry(gems, gid))
        await r.ltrim(k, -KEEP, -1)
        return True
    except Exception:  # noqa: BLE001
        return False


def _client():
    import redis                                                                                # sync client (CLI only)
    return redis.Redis.from_url(os.getenv("BLUEBOT_REDIS_URL", "redis://127.0.0.1:6379"),
                                db=int(os.getenv("BLUEBOT_QUEUE_DB", "0") or 0), decode_responses=True)


def main(argv: list) -> int:
    if len(argv) >= 3 and argv[0] == "--grant":
        uid, n = int(argv[1]), int(argv[2])
        n = max(1, min(n, 1000))                                                                  # (the server clamps one entry to 1000 blue gems anyway)
        ok = credit_sync(_client(), uid, n, src="manual", gid="manual:%d:%d" % (time.time_ns(), uid))
        print("queued: %d blue gem(s) = %d turquoise for %d" % (n, n * 10, uid) if ok else "failed (is Redis up?)")
        return 0 if ok else 1
    if len(argv) >= 4 and argv[0] == "--grant-prem":                                              # special gems: UID SAPPHIRE ONYX
        uid, ps, po = int(argv[1]), max(0, min(int(argv[2]), 1000)), max(0, min(int(argv[3]), 1000))      # (clamped like the server does)
        ok = credit_sync(_client(), uid, 0, src="manual", gid="manualp:%d:%d" % (time.time_ns(), uid), sap=ps, onyx=po)
        print("queued: %d sapphire + %d onyx for %d" % (ps, po, uid) if ok else "failed (is Redis up?)")
        return 0 if ok else 1
    if len(argv) >= 2 and argv[0] == "--peek":
        for x in _client().lrange(INBOX_KEY.format(int(argv[1])), 0, -1):
            print(x)
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
