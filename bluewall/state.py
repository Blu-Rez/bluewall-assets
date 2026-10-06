"""Blue Wall player state: structure levels, upgrade queue, gem wallet and the three gem mines.

Stored in Redis (``bluewall:st:<uid>`` JSON). Mines produce gems per hour
(rate grows with the *mine's* level) into a small storage (cap = 8 hours);
the player collects them by tapping the mine. The vaults' levels set how many
gems fit in the wallet. Upgrades / builders / reserved upgrades are in
``progress.py`` (state v2: ``b`` = levels, ``q`` = queue; v1 states are
migrated on load). Everything is computed from timestamps, so nothing runs in
the background.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import random
import time
from typing import Any, Dict, Optional

from . import boost as BO
from . import bridge as BR
from . import progress as PR
from . import military as MI
from . import shop as SH
from . import social as SO

log = logging.getLogger("bluewall.state")

REDIS_URL = os.getenv("BLUEBOT_REDIS_URL", "redis://127.0.0.1:6379")
REDIS_DB = int(os.getenv("BLUEBOT_QUEUE_DB", "0") or 0)
KEY = "bluewall:st:{}"

MINES = PR.GEMS
INBOX_KEY = "bluewall:inbox:{}"          # gifts written by OTHER services (the bot): JSON {"id","src", "ruby"/"emerald"/"turq"/"sap"/"onyx": N} (old: "blue": N); drained inside the per-user lock
BLUE_TO_TURQ = 10                       # (old entries) 1 blue gem of the bot = 10 turquoise in Blue Wall
INBOX_MAX_ENTRY = 1000                  # sanity bound on one old entry (blue gems)
INBOX_MAX_TURQ = 5000                   # ... and on a gift that is not a conversion (invites, prizes)
INBOX_MAX_CONV = BR.CONV_MAX            # ... and on one conversion from the bot (already paid for there; the bot never sends more)
GID_KEY = "bluewall:gid:{}"             # a conversion id once applied (90 days): a late resend can never pay twice, however many gifts came in between
PREM = ("sap", "onyx")                  # the two special gems: deep-blue sapphire (bought only) and black onyx (bought or won as a prize); no mine, no vault, no cap
INBOX_MAX_PREM = 1000                   # ... and on one entry of them
LB_KEY = "bluewall:lb:tro"              # leaderboard: ZSET uid -> cups
ATTACK_PUBLIC = os.getenv("BLUEWALL_ATTACK", "public").strip().lower() not in ("owner", "closed", "off", "0", "no")   # attacks are open to every player who may enter (p22, owner); BLUEWALL_ATTACK=owner closes them again
CAP_HOURS = PR.CAP_HOURS
MAX_LEVEL = PR.MAX_LEVEL


def _owner_ids() -> set:
    out = set()
    try:
        from config import settings
        for k in ("SUPER_ADMIN_UID", "OWNER_ID", "SUPER_ADMIN_ID"):
            v = getattr(settings, k, None)
            if v:
                out.add(int(v))
    except Exception:  # noqa: BLE001
        pass
    v = os.getenv("SUPER_ADMIN_UID")
    if v and v.isdigit():
        out.add(int(v))
    return out


def _start_spells(st: Dict[str, Any], owner: bool) -> Dict[str, int]:
    """Spells to play with: the owner's maxed kingdom starts with a handful, everyone else with none."""
    if not owner:
        return {}
    cap = MI.spell_cap(PR.level(st, "forge"))
    out: Dict[str, int] = {}
    used = 0
    for k, n in (("lightning", 3), ("heal", 2), ("freeze", 2), ("rage", 1), ("quake", 1)):
        d = MI.SPELLS[k]
        if PR.level(st, "forge") >= d["lv"]:
            while n > 0 and used + d["space"] <= cap:
                out[k] = out.get(k, 0) + 1
                used += d["space"]
                n -= 1
    return out


def _start_army(st: Dict[str, Any], owner: bool) -> Dict[str, int]:
    """A new kingdom starts with a handful of spearmen; the owner's maxed kingdom with a full house to play with."""
    if not owner:
        return {"spear": 10}
    return _max_army(st)


def _max_army(st: Dict[str, Any]) -> Dict[str, int]:
    """The fullest LEGAL army of this kingdom (p36, owner 6 Oct 2026: «لول ۳۰ و همه چیز در فول‌ترین حالت»): every hero at its cap (3), every other unlocked unit at least once,
    the rest of the house split by the reference plan, topped up with the cheap soldiers; never above the training ground's housing nor any family's building
    (the old owner fill ignored both: 1061 of 872 space at level 30, the workshop 318 of 310)."""
    def lv(f: str) -> int:
        return PR.level(st, f)
    cap = MI.army_cap(lv("training"))
    fcap = {f: MI.fam_cap(f, lv(f)) for f in MI.FAMILIES}
    open_ = [u for u in MI._PLAN if lv(MI.UNITS[u]["fam"]) >= MI.UNITS[u]["lv"]]
    a: Dict[str, int] = {}
    used = 0
    fu: Dict[str, int] = {}

    def add(u: str, n: int) -> None:
        nonlocal used
        f, sp = MI.UNITS[u]["fam"], MI.UNITS[u]["space"]
        n = min(int(n), (cap - used) // sp, (fcap[f] - fu.get(f, 0)) // sp, MI.hero_slots(u, lv(f)) - a.get(u, 0))
        if n > 0:
            a[u] = a.get(u, 0) + n
            used += n * sp
            fu[f] = fu.get(f, 0) + n * sp
    for u in open_:
        if u in MI.HEROES:
            add(u, MI.hero_slots(u, lv(MI.UNITS[u]["fam"])))
    for u in open_:
        if u not in MI.HEROES:
            add(u, 1)
    rest = [u for u in open_ if u not in MI.HEROES]
    while True:                                                    # (one unit at a time to whichever kind is furthest below its share of the plan, until nothing fits any more: big units get their turn too)
        fits = [u for u in rest if min(cap - used, fcap[MI.UNITS[u]["fam"]] - fu.get(MI.UNITS[u]["fam"], 0)) >= MI.UNITS[u]["space"]]
        if not fits:
            break
        add(min(fits, key=lambda u: a.get(u, 0) * MI.UNITS[u]["space"] / MI._PLAN[u]), 1)
    return a


def _max_spells(st: Dict[str, Any]) -> Dict[str, int]:
    """Every spell the forge knows, round-robin until the forge's housing is full."""
    fl = PR.level(st, "forge")
    cap = MI.spell_cap(fl)
    open_ = [k for k in MI.SPELL_ORDER if fl >= MI.SPELLS[k]["lv"]]
    out: Dict[str, int] = {}
    used = 0
    while open_:
        grew = False
        for k in open_:
            d = MI.SPELLS[k]
            if used + d["space"] <= cap and out.get(k, 0) < MI.spell_max(st, k):
                out[k] = out.get(k, 0) + 1
                used += d["space"]
                grew = True
        if not grew:
            break
    return out


def rate(st: Dict[str, Any], mine: str) -> float:
    return PR.mine_rate(mine, max(1, PR.level(st, "mine_" + mine)))


def vault(st: Dict[str, Any], mine: str) -> int:
    return PR.vault_cap(mine, max(1, PR.level(st, "vault_" + mine)))


def _opt_int(v):
    try:
        return None if v is None else int(v)
    except Exception:  # noqa: BLE001
        return -1


def _clean_name(name: str) -> str:
    """A display name other players will read: no control / invisible / bidi-override characters, single spaces, 24 chars."""
    import unicodedata
    t = "".join(ch for ch in str(name or "") if unicodedata.category(ch) not in ("Cc", "Cf", "Cs", "Co", "Cn", "Zl", "Zp"))
    return " ".join(t.split())[:24]


class StateUnavailable(Exception):
    """The stored kingdom could not be read right now (Redis hiccup). Never answer with a fresh kingdom then: the next save would wipe the real one."""


class Store:
    def __init__(self) -> None:
        self._r = None
        self._mem: Dict[int, Dict[str, Any]] = {}
        self._locks: Dict[int, asyncio.Lock] = {}
        self._inbox: Dict[int, list] = {}                         # (memory mode only: stands in for the Redis list)
        from .clan import Clans
        self.clans = Clans(self)

    async def _redis(self):
        if self._r is None:
            if os.getenv("BLUEWALL_STATE") == "memory":          # (dev / tests without a Redis)
                self._r = False
                return None
            try:
                import redis.asyncio as aioredis
                self._r = aioredis.from_url(REDIS_URL, db=REDIS_DB, decode_responses=True)
            except Exception as e:  # noqa: BLE001
                log.warning("redis unavailable (%s): state kept in memory", e)
                self._r = False
        return self._r or None

    def _lock(self, uid: int) -> asyncio.Lock:
        lk = self._locks.get(uid)
        if lk is None:
            if len(self._locks) > 5000:                      # (drop only the idle ones: a held lock must stay the one lock of its player)
                for k in [k for k, v in self._locks.items() if not v.locked() and not getattr(v, "_waiters", None)]:
                    del self._locks[k]
            lk = self._locks[uid] = asyncio.Lock()
        return lk

    def _fresh(self, uid: int) -> Dict[str, Any]:
        now = time.time()
        owner = uid in _owner_ids()
        # a fresh kingdom starts with the mines half full so the first tap pays out (the owner's kingdom starts maxed, to look around)
        st = {"level": MAX_LEVEL if owner else 1, "gems": {m: 0 for m in MINES},
              "last": {m: now - CAP_HOURS * 3600 * 0.5 for m in MINES}, "mb": {m: 0.0 for m in MINES}, "created": now,
              "prem": {k: 0 for k in PREM}}
        PR.init(st, owner=owner)
        MI.init(st)
        st["army"] = _start_army(st, owner)
        st["spells"] = _start_spells(st, owner)
        return st

    async def load(self, uid: int) -> Dict[str, Any]:
        r = await self._redis()
        raw = None
        if r is not None:
            try:
                raw = await asyncio.wait_for(r.get(KEY.format(uid)), 2.0)
            except Exception as e:  # noqa: BLE001
                log.warning("state read failed uid=%s: %s", uid, e)
                st = self._mem.get(uid)
                if st:
                    return json.loads(json.dumps(st))
                raise StateUnavailable(str(e)) from e      # (not `_fresh`: the next save would overwrite the real kingdom with an empty one)
        else:
            st = self._mem.get(uid)
            if st:
                return json.loads(json.dumps(st))
        if raw:
            try:
                st = json.loads(raw)
                for m in MINES:
                    st.setdefault("gems", {}).setdefault(m, 0)
                    st.setdefault("last", {}).setdefault(m, time.time())
                st.setdefault("level", 1)
                pm = st.setdefault("prem", {})
                for k in PREM:
                    pm[k] = max(0, int(pm.get(k, 0) or 0))
                PR.init(st, owner=uid in _owner_ids())
                if "army" not in st:
                    MI.init(st)
                    st["army"] = _start_army(st, uid in _owner_ids())
                if "spells" not in st:                  # (kingdoms from before spells existed)
                    st["spells"] = _start_spells(st, uid in _owner_ids())
                MI.init(st)
                return st
            except Exception as e:  # noqa: BLE001
                # a record that will not load: keep a copy of the raw text (30 days) before anything can overwrite it, then fail loudly
                log.error("state of uid=%s could not be loaded: %r", uid, e)
                try:
                    if r is not None:
                        await asyncio.wait_for(r.set("bluewall:bad:%s:%d" % (uid, int(time.time())), raw, ex=30 * 86400), 2.0)
                except Exception:  # noqa: BLE001
                    log.error("could not back up the unreadable state of uid=%s", uid)
                if self._mem.get(uid):
                    return json.loads(json.dumps(self._mem[uid]))
                raise StateUnavailable("unreadable state") from e
        return self._fresh(uid)

    async def save(self, uid: int, st: Dict[str, Any]) -> None:
        r = await self._redis()
        nin = int(st.pop("_inb", 0) or 0)                                                    # (gifts applied in this transaction: trimmed from the inbox once the save went through)
        cvids = st.pop("_cvids", None) or []
        if r is None:
            self._mem[uid] = json.loads(json.dumps(st))
            await self._trim_inbox(uid, nin)
            return
        try:
            await asyncio.wait_for(r.set(KEY.format(uid), json.dumps(st, separators=(",", ":"))), 2.0)
        except Exception as e:  # noqa: BLE001
            log.warning("state write failed uid=%s: %s", uid, e)
            self._mem[uid] = json.loads(json.dumps(st))
            return
        self._mem.pop(uid, None)                                                             # (Redis has the newest copy now: an older memory copy must never be served again)
        for g in cvids:
            try:
                await asyncio.wait_for(r.set(GID_KEY.format(g), 1, ex=90 * 86400), 1.5)
            except Exception as e:  # noqa: BLE001
                log.warning("gid mark failed %s: %s (the recent-ids list still guards it)", g, e)
        await self._trim_inbox(uid, nin)

    @staticmethod
    def view(st: Dict[str, Any], now: Optional[float] = None, uid: Optional[int] = None) -> Dict[str, Any]:
        now = time.time() if now is None else now
        st["level"] = PR.keep_level(st)
        mines = {m: PR.mine_view(st, m, now) for m in MINES}
        return {"level": st["level"], "max_level": MAX_LEVEL, "gems": {m: int(st["gems"][m]) for m in MINES},
                "vault": {m: vault(st, m) for m in MINES}, "mines": mines, "now": now, "prog": PR.view(st, now),
                "army": MI.view(st, now, uid is not None and MI.attack_allowed(uid, _owner_ids(), ATTACK_PUBLIC)),
                "emblem": MI.emblem_of(st, uid), "name": str(st.get("name") or "")[:24],
                "prem": {k: max(0, int((st.get("prem") or {}).get(k, 0) or 0)) for k in PREM},
                "gift": ({**{g: int(st["gnew"].get(g, 0)) for g in ("ruby", "emerald", "turq", "sap", "onyx")}, "t": float(st["gnew"].get("t", 0)), "inv": int(st["gnew"].get("inv", 0)),
                          "conv": int(st["gnew"].get("conv", 0))} if st.get("gnew") else None),
                "tro": int(st.get("tro", 0)), "lg": SO.league_index(int(st.get("tro", 0))),
                "bst": BO.view(st, now), "own": {"tesla": int((st.get("own") or {}).get("tesla", 0) or 0), "dragonling": PR.level(st, "lair") >= MI.UNITS["dragonling"]["lv"]},   # (home dragonlings live at the Lair once it can train them)
                "vis": ({"tesla": SH.TESLA_MAX, "dragonling": True} if (uid is not None and uid in _owner_ids()) else None),   # (what the owner's OWN home map shows: the royal showcase is always on for him; `own` stays the truth for the shop and the raids)
                "shop": SH.catalog(st, SH.cfg_now(), now)}

    async def _drain_inbox(self, uid: int, st: Dict[str, Any]) -> int:
        """Gifts from the bot (blue gems won in its games): each entry is applied once (`st.gids` remembers the last ids), then trimmed.
        Returns how many entries were consumed.  Never raises: a Redis hiccup just leaves the gifts for the next call."""
        r = await self._redis()
        items = None
        if r is not None:
            try:
                items = await asyncio.wait_for(r.lrange(INBOX_KEY.format(uid), 0, 49), 1.5)
            except Exception as e:  # noqa: BLE001
                log.warning("inbox read failed uid=%s: %s", uid, e)
                return 0
        else:
            items = list(self._inbox.get(uid, []))[:50]
        if not items:
            return 0
        gids = st.setdefault("gids", [])
        add = {g: 0 for g in ("ruby", "emerald", "turq", "sap", "onyx")}
        inv = conv = 0
        parsed = []
        for raw in items:
            try:
                e = json.loads(raw) if isinstance(raw, (str, bytes)) else dict(raw)
                gid = str(e.get("id") or "")[:48]
                src = str(e.get("src") or "")[:24]
                cv = src == "convert"                                                      # (a conversion the player paid for in the bot: big amounts are fine)
                got = {g: max(0, min(INBOX_MAX_CONV if cv else (INBOX_MAX_TURQ if g in MINES else INBOX_MAX_PREM), int(e.get(g) or 0))) for g in add}
                got["turq"] += max(0, min(INBOX_MAX_ENTRY, int(e.get("blue") or 0))) * BLUE_TO_TURQ
            except Exception:  # noqa: BLE001
                continue                                                                   # (a malformed gift is dropped, never retried forever)
            parsed.append((gid, src, cv, got))
        done_cv = set()                                                                    # conversion ids already applied long ago (Redis, 90 days) - checked BEFORE anything changes
        cvq = [gid for gid, _s, cv, _g in parsed if cv and gid and gid not in gids]
        if cvq and r is not None:
            try:
                for gid in cvq:
                    if await asyncio.wait_for(r.exists(GID_KEY.format(gid)), 1.5):
                        done_cv.add(gid)
            except Exception as e:  # noqa: BLE001
                log.warning("gid check failed uid=%s: %s (the inbox stays for the next read)", uid, e)
                return 0
        for gid, src, cv, got in parsed:
            if not gid or gid in gids or not any(got.values()):
                continue
            if gid in done_cv:
                gids.append(gid)
                continue
            if cv:
                st.setdefault("_cvids", []).append(gid)
            if src == "invite":
                if int(st.get("rfn", 0)) >= SO.INVITE_MAX:
                    gids.append(gid)
                    continue
                st["rfn"] = int(st.get("rfn", 0)) + 1
                inv += 1
            gids.append(gid)
            conv += 1 if cv else 0
            for g, n in got.items():
                add[g] += n
        del gids[:-300]
        if any(add.values()):
            pm = st.setdefault("prem", {})
            for g, n in add.items():
                if not n:
                    continue
                if g in MINES:
                    st["gems"][g] = int(st["gems"].get(g, 0)) + n                          # (a gift may sit above the vault; spending brings it back under)
                else:
                    pm[g] = int(pm.get(g, 0)) + n
            gn = st.get("gnew") or {}
            for g, n in add.items():
                gn[g] = int(gn.get(g, 0)) + n
            gn["inv"] = int(gn.get("inv", 0)) + inv
            gn["conv"] = int(gn.get("conv", 0)) + conv
            gn["t"] = time.time()
            st["gnew"] = gn
            log.info("gift uid=%s %s (conversions %s, invites %s)", uid, {g: n for g, n in add.items() if n}, conv, inv)
        st["_inb"] = len(items)                                                             # (trimmed from the inbox after the save, see save())
        return len(items)

    async def _trim_inbox(self, uid: int, n: int) -> None:
        if n <= 0:
            return
        r = await self._redis()
        try:
            if r is not None:
                await asyncio.wait_for(r.ltrim(INBOX_KEY.format(uid), n, -1), 1.5)
            else:
                self._inbox[uid] = list(self._inbox.get(uid, []))[n:]
        except Exception as e:  # noqa: BLE001
            log.warning("inbox trim failed uid=%s: %s (the ids make a repeat harmless)", uid, e)

    async def push_inbox(self, uid: int, e: Dict[str, Any]) -> bool:
        """Queue a gift for another kingdom (the same list the bot writes to; see bridge.py)."""
        raw = json.dumps(e, separators=(",", ":"))
        r = await self._redis()
        try:
            if r is not None:
                k = INBOX_KEY.format(int(uid))
                await asyncio.wait_for(r.rpush(k, raw), 1.5)
                await asyncio.wait_for(r.ltrim(k, -500, -1), 1.5)
            else:
                self._inbox.setdefault(int(uid), []).append(raw)
            return True
        except Exception as ex:  # noqa: BLE001
            log.warning("inbox push failed uid=%s: %s", uid, ex)
            return False

    async def _check_ref(self, uid: int, st: Dict[str, Any]) -> None:
        """The friend who invited this kingdom is paid once, when its castle reaches level 3."""
        ref = st.get("ref")
        if not isinstance(ref, dict) or ref.get("paid") or PR.keep_level(st) < SO.INVITE_AT_KEEP:
            return
        by = int(ref.get("by") or 0)
        if by <= 0 or by == uid:
            ref["paid"] = True
            return
        if await self.push_inbox(by, {"id": "ref:%d" % uid, "src": "invite", "turq": SO.INVITE_PAY, "t": int(time.time())}):
            ref["paid"] = True                                                              # (the gift id makes a repeat after a failed save harmless)
            log.info("invite: uid=%s reached castle %s -> %s gets %s turquoise", uid, SO.INVITE_AT_KEEP, by, SO.INVITE_PAY)

    async def _txn(self, uid: int):
        """load + settle finished upgrades; caller saves. (use inside the per-user lock)"""
        st = await self.load(uid)
        now = time.time()
        PR.settle(st, now)
        MI.settle(st, now)
        PR.expire_mine_boost(st, now)
        await SH.load_cfg(await self._redis())
        await self._drain_inbox(uid, st)
        await self._check_ref(uid, st)
        st["seen"] = now
        return st

    async def refer(self, uid: int, inviter: int) -> bool:
        """The first time a brand-new kingdom is opened from a friend's link, remember who invited it."""
        if inviter <= 0 or inviter == uid:
            return False
        async with self._lock(uid):
            st = await self._txn(uid)
            now = time.time()
            if st.get("ref") or now - float(st.get("created", now)) > 3600 or PR.keep_level(st) > 1 or st.get("rep"):
                return False
            st["ref"] = {"by": int(inviter), "t": now}
            await self.save(uid, st)
            log.info("invite: uid=%s came from %s", uid, inviter)
        try:
            async with self._lock(inviter):                                                  # (the inviter's friends list; never blocks the newcomer)
                v = await self.load(inviter)
                frs = [int(x) for x in v.get("frs", [])]
                if uid not in frs:
                    frs.append(uid)
                    v["frs"] = frs[-SO.INVITE_MAX:]
                    await self.save(inviter, v)
        except StateUnavailable:
            log.warning("invite: could not record friend %s for %s", uid, inviter)
        return True

    # ---- cups + leaderboard
    async def _lb_set(self, uid: int, st: Dict[str, Any]) -> None:
        if st.get("devu"):
            return                                                                          # (the owner's test kingdom is not on the board)
        tro = int(st.get("tro", 0))
        r = await self._redis()
        try:
            if r is not None:
                if tro > 0:
                    await asyncio.wait_for(r.zadd(LB_KEY, {str(uid): tro}), 1.5)
                else:
                    await asyncio.wait_for(r.zrem(LB_KEY, str(uid)), 1.5)
        except Exception as e:  # noqa: BLE001
            log.warning("leaderboard write failed uid=%s: %s", uid, e)
        await self.clans.member_cups(uid, st)

    async def leaderboard(self, uid: int, n: int = 20) -> Dict[str, Any]:
        """top `n` kingdoms by cups + the caller's own place.  Names / crests come from the kingdoms themselves (cached 20 s)."""
        now = time.time()
        c = getattr(self, "_lbc", None)
        if c and now - c[0] < 20 and c[2] == n:
            top = c[1]
        else:
            rows = []
            r = await self._redis()
            if r is not None:
                try:
                    rows = [(int(u), int(sc)) for u, sc in await asyncio.wait_for(r.zrevrange(LB_KEY, 0, n - 1, withscores=True), 2.0)]
                except Exception as e:  # noqa: BLE001
                    log.warning("leaderboard read failed: %s", e)
            else:
                rows = sorted(((u, int(st.get("tro", 0))) for u, st in self._mem.items() if int(st.get("tro", 0)) > 0 and not st.get("devu")), key=lambda x: -x[1])[:n]
            top = []
            for k, (u, sc) in enumerate(rows):
                st = None
                try:
                    if r is not None:
                        raw = await asyncio.wait_for(r.get(KEY.format(u)), 1.5)
                        st = json.loads(raw) if raw else None
                    else:
                        st = self._mem.get(u)
                except Exception:  # noqa: BLE001
                    st = None
                st = st or {}
                top.append({"r": k + 1, "id": u, "n": str(st.get("name") or "Kingdom")[:24], "e": MI.emblem_of(st, u) if st else None,
                            "tro": sc, "lg": SO.league_index(sc), "k": PR.keep_level(st) if st else 1})
            self._lbc = (now, top, n)
        out = {"top": [dict(t, me=(t["id"] == uid)) for t in top]}
        async with self._lock(uid):
            st = await self._txn(uid)
            mine = int(st.get("tro", 0))
            rank = None
            r = await self._redis()
            try:
                if st.get("devu"):
                    rank = None                                                                     # (test kingdoms are not on the board)
                elif r is not None and mine > 0:
                    rk = await asyncio.wait_for(r.zrevrank(LB_KEY, str(uid)), 1.5)
                    rank = None if rk is None else int(rk) + 1
                elif r is None and mine > 0:
                    rank = 1 + sum(1 for u, s2 in self._mem.items() if int(s2.get("tro", 0)) > mine and not s2.get("devu"))
            except Exception:  # noqa: BLE001
                rank = None
            await self.save(uid, st)                                                        # (the drain of the inbox above is part of every transaction)
            out["me"] = {"rank": rank, "tro": mine, "best": int(st.get("trb", mine)), "lg": SO.league_index(mine), "n": str(st.get("name") or "")[:24],
                         "e": MI.emblem_of(st, uid), "invited": int(st.get("rfn", 0)), "invite_max": SO.INVITE_MAX}
        out["leagues"] = [{"id": a, "name": b, "from": c2, "color": d} for a, b, c2, d in SO.LEAGUES]
        return out

    async def history(self, uid: int) -> Dict[str, Any]:
        """the last attacks this kingdom made and the last attacks made on it (newest first, at most 24 together)"""
        async with self._lock(uid):
            st = await self._txn(uid)
            await self.save(uid, st)
        rows = []
        for x in st.get("rep", [])[-20:]:
            rows.append({"t": float(x.get("t", 0)), "k": "a", "who": str(x.get("target") or "?")[:24], "stars": int(x.get("stars", 0)), "pct": int(round(float(x.get("destruction", 0) or 0))),
                         "loot": {g: int(n) for g, n in (x.get("loot") or {}).items() if int(n) > 0}, "tro": int(x.get("tro", 0) or 0), "bot": x.get("kind") != "player"})
        for x in st.get("hits", [])[-20:]:
            rows.append({"t": float(x.get("t", 0)), "k": "d", "who": str(x.get("by") or "?")[:24], "stars": int(x.get("stars", 0)), "pct": int(x.get("pct", 0)),
                         "loot": {g: int(n) for g, n in (x.get("lost") or {}).items() if int(n) > 0}, "tro": int(x.get("tro", 0) or 0), "bot": False})
        rows.sort(key=lambda r: -r["t"])
        return {"log": rows[:24], "tro": int(st.get("tro", 0))}

    async def friends(self, uid: int) -> Dict[str, Any]:
        """kingdoms that opened the game from this player's link"""
        async with self._lock(uid):
            st = await self._txn(uid)
            await self.save(uid, st)
        out = []
        for u in [int(x) for x in st.get("frs", [])][-SO.INVITE_MAX:]:
            try:
                f = await self.load(u)
            except Exception:  # noqa: BLE001
                continue
            t = int(f.get("tro", 0))
            lv = PR.keep_level(f)
            out.append({"id": u, "n": str(f.get("name") or "Kingdom")[:24], "e": MI.emblem_of(f, u), "tro": t, "lg": SO.league_index(t), "k": lv, "paid": lv >= SO.INVITE_AT_KEEP,
                        "clan": int(f.get("clan") or 0)})
        out.sort(key=lambda x: (-x["tro"], x["id"]))
        return {"friends": out, "pay": SO.INVITE_PAY, "keep": SO.INVITE_AT_KEEP, "max": SO.INVITE_MAX}

    async def touch(self, uid: int, name: str = "") -> int:
        """Remember the display name (shown to attackers) and that the player is online.  Returns the castle level (the map's colour mood follows it, p35)."""
        async with self._lock(uid):
            st = await self._txn(uid)
            nm = _clean_name(name)
            if nm:
                st["name"] = nm
            await self.save(uid, st)
            return int(PR.keep_level(st))

    async def get(self, uid: int) -> Dict[str, Any]:
        async with self._lock(uid):
            st = await self._txn(uid)
            if "created" not in st:
                st["created"] = time.time()
            out = self.view(st, None, uid)
            st.pop("gnew", None)                                                              # (the toast is delivered with this answer; the turquoise is already in the wallet)
            await self.save(uid, st)
            return out

    async def collect(self, uid: int, mine: str) -> Optional[Dict[str, Any]]:
        if mine not in MINES:
            return None
        async with self._lock(uid):
            st = await self._txn(uid)
            now = time.time()
            exact = PR.mine_ready(st, mine, now)
            room = max(0, vault(st, mine) - int(st["gems"].get(mine, 0)))
            got = min(int(exact), room)
            if got > 0:
                st["gems"][mine] = int(st["gems"].get(mine, 0)) + got
                PR.mine_take(st, mine, got, now)                                             # (what did not fit stays in the mine, up to its storage)
            await self.save(uid, st)
            out = self.view(st, None, uid)
            out["got"] = {"mine": mine, "n": got}
            return out

    # ---- upgrades (progress.py rules)
    async def upgrade(self, uid: int, op: str, ent: str) -> Dict[str, Any]:
        """op: start | cancel | speedup | finish. Returns {ok, why?, info?, ...view}."""
        if ent not in PR.STRUCTS and op != "finish":
            return {"ok": False, "why": "bad"}
        async with self._lock(uid):
            st = await self._txn(uid)
            now = time.time()
            why, info = "ok", None
            if op == "start":
                why, info = PR.start(st, ent, now)
                if why == "ok":
                    info = {"to": info["to"], "end": info.get("end"), "reserved": not info.get("end")}
            elif op == "cancel":
                why, info = PR.cancel(st, ent, now)
                info = None
            elif op == "speedup":
                why, info = PR.speedup(st, ent, now)
            elif op != "finish":
                return {"ok": False, "why": "bad"}
            await self.save(uid, st)
            out = self.view(st, None, uid)
            out.update({"ok": why == "ok", "why": None if why == "ok" else why, "info": info})
            return out

    # ---- army: train / cancel / speed up a batch   op: train {u,n} | cancel {fam} | speedup {fam}
    async def army(self, uid: int, op: str, body: Dict[str, Any]) -> Dict[str, Any]:
        async with self._lock(uid):
            st = await self._txn(uid)
            now = time.time()
            why, info = "ok", None
            if op == "train":
                try:
                    n = int(body.get("n"))
                except Exception:  # noqa: BLE001
                    n = 0
                why, info = MI.train(st, str(body.get("u") or ""), n, now)
            elif op == "cancel":
                why, info = MI.cancel(st, str(body.get("fam") or ""), now, _opt_int(body.get("i")), _opt_int(body.get("n")))
            elif op == "speedup":
                why, info = MI.speedup(st, str(body.get("fam") or ""), now)
            elif op == "brew":
                try:
                    n = int(body.get("n"))
                except Exception:  # noqa: BLE001
                    n = 0
                why, info = MI.brew(st, str(body.get("u") or ""), n, now)
            elif op == "brewcancel":
                why, info = MI.brew_cancel(st, _opt_int(body.get("i")), _opt_int(body.get("n")))
            elif op == "brewspeed":
                why, info = MI.brew_speedup(st, now)
            elif op == "emblem":
                why, info = MI.set_emblem(st, body.get("e"))
            elif op == "guard":
                why, info = MI.set_guard(st, body.get("u"), body.get("n"))
            elif op != "get":
                return {"ok": False, "why": "bad"}
            await self.save(uid, st)
            out = self.view(st, None, uid)
            out.update({"ok": why == "ok", "why": None if why == "ok" else why, "info": info})
            return out

    # ---- shop: boosts (sapphire) and royal items (onyx) - shop.py
    async def shop(self, uid: int, body: Dict[str, Any]) -> Dict[str, Any]:
        async with self._lock(uid):
            st = await self._txn(uid)
            now = time.time()
            cfg = await SH.load_cfg(await self._redis())
            why, info = SH.buy(st, body if isinstance(body, dict) else {}, cfg, now)
            await self.save(uid, st)                                                       # (always: the transaction may also have settled upgrades / applied gifts)
            out = self.view(st, None, uid)
            out.update({"ok": why == "ok", "why": None if why == "ok" else why, "info": info})
            return out

    async def _candidates(self, uid: int, limit: int = 60) -> list:
        """(uid, state) of other kingdoms that look attackable (offline > 10 min, no shield).  Redis SCAN, bounded."""
        out = []
        now = time.time()
        ids = []
        r = await self._redis()
        if r is not None:
            try:
                async for k in r.scan_iter(match=KEY.format("*"), count=300):
                    try:
                        ids.append(int(str(k).rsplit(":", 1)[1]))
                    except Exception:  # noqa: BLE001
                        pass
                    if len(ids) >= limit * 3:
                        break
            except Exception as e:  # noqa: BLE001
                log.warning("scan failed: %s", e)
        ids += [u for u in self._mem if u not in ids]
        random.shuffle(ids)
        for u in ids:
            if u == uid or len(out) >= limit:
                continue
            try:
                async with self._lock(u):
                    v = await self.load(u)
            except StateUnavailable:
                continue                                   # (that player cannot be read right now: pick someone else)
            if now - float(v.get("seen", 0) or 0) < 600 or float(v.get("shield", 0) or 0) > now:
                continue
            out.append((u, v))
        return out

    async def scout(self, uid: int, skip_players: bool = False) -> Dict[str, Any]:
        """Pick the next target for `uid` (a bot, or an offline player)."""
        if not MI.attack_allowed(uid, _owner_ids(), ATTACK_PUBLIC):
            return {"ok": False, "why": "closed"}
        pick = None
        rng = random.Random()
        if not skip_players:
            async with self._lock(uid):
                me = await self._txn(uid)
            for vuid, v in await self._candidates(uid):
                pick = MI.player_target(me, v, vuid, rng)
                if pick:
                    break
        async with self._lock(uid):
            st = await self._txn(uid)
            cd = 2.0 if uid in _owner_ids() else None                                                                   # (the owner tests a lot: 2 s instead of 20 s)
            why, tgt = MI.scout(st, uid, time.time(), pick, rng, cooldown=cd)
            if why == "ok":
                await self.save(uid, st)
            out = self.view(st, None, uid)
            out.update({"ok": why == "ok", "why": None if why == "ok" else why, "target": tgt})
            if why == "slow":
                out["wait"] = round(MI.scout_wait(st, time.time(), cd), 1)                                              # (the client turns the wait into a search percentage)
            return out

    async def battle_end(self, uid: int, tid: str, rep: Dict[str, Any]) -> Dict[str, Any]:
        if not MI.attack_allowed(uid, _owner_ids(), ATTACK_PUBLIC):
            return {"ok": False, "why": "closed"}
        async with self._lock(uid):
            st = await self._txn(uid)
            now = time.time()
            victim = (st.get("atk") or {}).get("spec", {}).get("_victim")
            before = dict(st["gems"])
            spec0 = dict((st.get("atk") or {}).get("spec") or {})
            why, info = MI.settle_battle(st, tid, rep, now)
            adelta = 0
            if why == "ok":
                adelta = SO.attacker_delta(int(st.get("tro", 0)), int(info["stars"]), float(spec0.get("ratio") or 1.0))
                st["tro"] = SO.apply(st.get("tro", 0), adelta)
                st["trb"] = max(int(st.get("trb", 0)), int(st["tro"]))
                info["tro"] = adelta
                info["report"]["tro"] = adelta
                await self.save(uid, st)
                await self._lb_set(uid, st)
            out = self.view(st, None, uid)
            out.update({"ok": why == "ok", "why": None if why == "ok" else why, "info": info})
        if why == "ok" and victim and victim != uid:
            took = {g: max(0, int(st["gems"][g]) - int(before[g])) for g in MINES}
            try:
                async with self._lock(victim):
                    v = await self.load(victim)
                    for g in MINES:
                        v["gems"][g] = max(0, int(v["gems"].get(g, 0)) - took[g])
                    v["shield"] = now + MI.SHIELD_SECONDS
                    vd = SO.defender_delta(adelta, int(info["stars"]))
                    v["tro"] = SO.apply(v.get("tro", 0), vd)
                    v["trb"] = max(int(v.get("trb", 0)), int(v["tro"]))
                    v.setdefault("hits", []).append({"t": now, "by": (st.get("name") or "?")[:24], "lost": took, "tro": vd, "stars": int(info["stars"]), "pct": int(round(float(info["report"].get("destruction") or 0)))})
                    v["hits"] = v["hits"][-20:]
                    await self.save(victim, v)
                    await self._lb_set(victim, v)
            except StateUnavailable:
                log.error("battle result of uid=%s: victim %s could not be read, loot not deducted", uid, victim)
        return out

    # ---- owner-only dev tools (preview tiers, test upgrades)
    async def dev(self, uid: int, body: Dict[str, Any]) -> Dict[str, Any]:
        async with self._lock(uid):
            st = await self._txn(uid)
            now = time.time()
            if body.get("reset"):
                st = self._fresh(uid)
                st["b"] = PR.fresh_levels(1)
                st["q"] = []
                st["level"] = 1
            if body.get("max"):                                                             # (p36, owner 6 Oct 2026 «لول منو بکن ۳۰ و همه چیز در فول‌ترین حالت»: level 30 everywhere, vaults full, the fullest LEGAL army + spells, test gems, the royal showcase)
                st["b"] = PR.all_max()
                st["q"] = []
                st["tq"] = {}
                st["sq"] = []
                for g in MINES:
                    st["gems"][g] = vault(st, g)
                st["army"] = _max_army(st)
                st["spells"] = _max_spells(st)
                pm = st.setdefault("prem", {})
                for k in PREM:
                    pm[k] = max(int(pm.get(k, 0) or 0), 10000)
                own = st.setdefault("own", {})
                own["tesla"] = SH.TESLA_MAX
                own["dragonling"] = True
            if isinstance(body.get("all"), int):
                n = max(0, min(PR.MAX_LEVEL, int(body["all"])))
                st["b"] = {e: n for e in PR.STRUCTS}
                st["q"] = []
            if isinstance(body.get("set"), dict):
                for e, n in body["set"].items():
                    if e in PR.STRUCTS:
                        st["b"][e] = max(0, min(PR.MAX_LEVEL, int(n)))
            if isinstance(body.get("gems"), int):
                for g in MINES:
                    st["gems"][g] = min(vault(st, g), int(body["gems"]))
            if body.get("fill"):
                for g in MINES:
                    st["gems"][g] = vault(st, g)
            if isinstance(body.get("prem"), dict):                                          # (owner test tool: set the sapphire / onyx balance)
                for k in PREM:
                    if k in body["prem"]:
                        try:
                            st.setdefault("prem", {})[k] = max(0, min(10 ** 6, int(body["prem"][k])))
                        except (TypeError, ValueError, OverflowError):
                            pass
            if isinstance(body.get("own"), dict):                                           # (owner test tool: Tesla coils / the dragonling egg)
                own = st.setdefault("own", {})
                try:
                    if "tesla" in body["own"]:
                        own["tesla"] = max(0, min(SH.TESLA_MAX, int(body["own"]["tesla"])))
                    if "dragonling" in body["own"]:
                        own["dragonling"] = bool(body["own"]["dragonling"])
                except (TypeError, ValueError):
                    pass
            if body.get("noboost"):
                PR.mine_bank(st, now)
                st.pop("bst", None)
            if body.get("army") == "fill":
                st["army"] = _start_army(st, True)
                st["spells"] = _start_spells(st, True)
            if isinstance(body.get("army"), dict):
                st["army"] = {u: int(n) for u, n in body["army"].items() if u in MI.UNITS and int(n) > 0}
            for h in (body.get("hits") if isinstance(body.get("hits"), list) else [])[:5]:            # (owner test tool: pretend raids on this kingdom, to see the welcome report)
                if isinstance(h, dict):
                    st.setdefault("hits", []).append({"t": now - float(h.get("ago", 600)), "by": str(h.get("by", "Raider"))[:24], "lost": {g: max(0, int(n)) for g, n in (h.get("lost") or {}).items() if g in MINES},
                                                     "tro": int(h.get("tro", -12)), "stars": int(h.get("stars", 1)), "pct": int(h.get("pct", 50))})
                    st["hits"] = st["hits"][-20:]
            if any(k in body for k in ("reset", "all", "set", "gems", "fill", "prem", "noboost", "army", "hits", "finish", "max")):
                st["devu"] = 1                                                              # (this kingdom was touched by the owner's test tools: off the leaderboard; the royal showcase alone does not count)
            if body.get("finish"):
                for it in st["q"]:
                    if it.get("end"):
                        it["end"] = now
                PR.settle(st, now)
            await self.save(uid, st)
            return self.view(st, None, uid)


STORE = Store()
