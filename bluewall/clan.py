"""Clans: a small group (up to 30 kingdoms) with a name, a short tag and a total of its members' cups.

    create / join / leave / kick, a member list, and a clan leaderboard.

Storage (Redis, or memory when BLUEWALL_STATE=memory):
    bluewall:clan:<id>        JSON {id, name, tag, owner, members:[uid], t}
    bluewall:clan:<id>:tro    HASH uid -> cups of that member (kept up to date by Store._lb_set)
    bluewall:clb              ZSET clan id -> total cups   (the clan leaderboard)
    bluewall:clan:names       HASH lower(name) -> id       (names are unique)
    bluewall:clan:seq         counter for ids
A player's own kingdom stores only `clan` (the id).  Every call returns plain data; failures are a short `why` code.
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
import time
from typing import Any, Dict, List, Optional

from . import military as MI
from . import progress as PR
from . import social as SO

log = logging.getLogger("bluewall.clan")

MAX_MEMBERS = 30
MIN_KEEP = 2                      # a clan needs a castle of at least this level (keeps throw-away kingdoms out)
NAME_MIN, NAME_MAX = 3, 16
K_CLAN, K_TRO, K_LB, K_NAMES, K_SEQ = "bluewall:clan:%d", "bluewall:clan:%d:tro", "bluewall:clb", "bluewall:clan:names", "bluewall:clan:seq"
TAG_RE = re.compile(r"^[A-Z0-9]{2,4}$")


def clean_name(name: str) -> str:
    import unicodedata
    t = "".join(ch for ch in str(name or "") if unicodedata.category(ch) not in ("Cc", "Cf", "Cs", "Co", "Cn", "Zl", "Zp"))
    return " ".join(t.split())[:NAME_MAX]


class Clans:
    def __init__(self, store: Any) -> None:
        self.s = store
        self._mem: Dict[int, Dict[str, Any]] = {}
        self._tro: Dict[int, Dict[int, int]] = {}
        self._names: Dict[str, int] = {}
        self._seq = 0
        self._locks: Dict[int, asyncio.Lock] = {}
        self._glock = asyncio.Lock()
        self._vc: Dict[int, tuple] = {}                                   # clan id -> (time, member rows) (30 s cache)

    def _lock(self, cid: int) -> asyncio.Lock:
        if len(self._locks) > 2000:                      # (idle locks only: a held or awaited lock must stay the one lock of its clan)
            for k in [k for k, v in self._locks.items() if not v.locked() and not getattr(v, "_waiters", None)]:
                del self._locks[k]
        return self._locks.setdefault(cid, asyncio.Lock())

    # ------------------------------------------------------------------ raw storage
    async def _get(self, cid: int) -> Optional[Dict[str, Any]]:
        r = await self.s._redis()
        if r is None:
            c = self._mem.get(cid)
            return json.loads(json.dumps(c)) if c else None
        raw = await asyncio.wait_for(r.get(K_CLAN % cid), 2.0)
        return json.loads(raw) if raw else None

    async def _put(self, c: Dict[str, Any]) -> None:
        r = await self.s._redis()
        if r is None:
            self._mem[int(c["id"])] = json.loads(json.dumps(c))
            return
        await asyncio.wait_for(r.set(K_CLAN % int(c["id"]), json.dumps(c, separators=(",", ":"))), 2.0)

    async def _del(self, c: Dict[str, Any]) -> None:
        cid = int(c["id"])
        r = await self.s._redis()
        if r is None:
            self._mem.pop(cid, None); self._tro.pop(cid, None); self._names.pop(c["name"].lower(), None)
            return
        await asyncio.wait_for(r.delete(K_CLAN % cid, K_TRO % cid), 2.0)
        await asyncio.wait_for(r.zrem(K_LB, str(cid)), 2.0)
        await asyncio.wait_for(r.hdel(K_NAMES, c["name"].lower()), 2.0)

    async def _next_id(self) -> int:
        r = await self.s._redis()
        if r is None:
            self._seq += 1
            return self._seq
        return int(await asyncio.wait_for(r.incr(K_SEQ), 2.0))

    async def _claim_name(self, name: str, cid: int) -> bool:
        r = await self.s._redis()
        if r is None:
            if name.lower() in self._names:
                return False
            self._names[name.lower()] = cid
            return True
        return bool(await asyncio.wait_for(r.hsetnx(K_NAMES, name.lower(), str(cid)), 2.0))

    async def _trophies(self, cid: int) -> Dict[int, int]:
        r = await self.s._redis()
        if r is None:
            return dict(self._tro.get(cid, {}))
        raw = await asyncio.wait_for(r.hgetall(K_TRO % cid), 2.0)
        return {int(u): int(v) for u, v in raw.items()}

    async def _set_tro(self, cid: int, uid: int, tro: Optional[int]) -> None:
        """tro None = the member left"""
        r = await self.s._redis()
        if r is None:
            d = self._tro.setdefault(cid, {})
            if tro is None:
                d.pop(uid, None)
            else:
                d[uid] = int(tro)
            return
        if tro is None:
            await asyncio.wait_for(r.hdel(K_TRO % cid, str(uid)), 2.0)
        else:
            await asyncio.wait_for(r.hset(K_TRO % cid, str(uid), int(tro)), 2.0)
        tot = sum(int(v) for v in (await asyncio.wait_for(r.hvals(K_TRO % cid), 2.0)))
        await asyncio.wait_for(r.zadd(K_LB, {str(cid): tot}), 2.0)

    async def _total(self, cid: int) -> int:
        return sum((await self._trophies(cid)).values())

    # ------------------------------------------------------------------ called by the Store
    async def member_cups(self, uid: int, st: Dict[str, Any]) -> None:
        """a member's cups changed: keep the clan total (never raises)"""
        cid = int(st.get("clan") or 0)
        if not cid or st.get("devu"):
            return
        try:
            await self._set_tro(cid, uid, int(st.get("tro", 0)))
            self._vc.pop(cid, None)
        except Exception as e:  # noqa: BLE001
            log.warning("clan cups write failed clan=%s uid=%s: %s", cid, uid, e)

    # ------------------------------------------------------------------ views
    async def _members(self, c: Dict[str, Any]) -> List[Dict[str, Any]]:
        cid = int(c["id"]); now = time.time()
        hit = self._vc.get(cid)
        if hit and now - hit[0] < 30 and hit[2] == list(c["members"]):
            return hit[1]
        tro = await self._trophies(cid)
        rows = []
        for u in c["members"]:
            try:
                st = await self.s.load(int(u))
            except Exception:  # noqa: BLE001
                st = {}
            t = int(tro.get(int(u), st.get("tro", 0)) or 0)
            rows.append({"id": int(u), "n": str(st.get("name") or "Kingdom")[:24], "e": MI.emblem_of(st, int(u)) if st else None, "tro": t,
                         "lg": SO.league_index(t), "k": PR.keep_level(st) if st else 1, "owner": int(u) == int(c["owner"])})
        rows.sort(key=lambda x: (-x["tro"], x["id"]))
        self._vc[cid] = (now, rows, list(c["members"]))
        return rows

    async def _card(self, c: Dict[str, Any], rank: Optional[int] = None) -> Dict[str, Any]:
        tot = await self._total(int(c["id"]))
        return {"id": int(c["id"]), "name": c["name"], "tag": c["tag"], "n": len(c["members"]), "max": MAX_MEMBERS, "tro": tot, "r": rank}

    async def view(self, uid: int, top_n: int = 20) -> Dict[str, Any]:
        st = await self.s.load(uid)
        cid = int(st.get("clan") or 0)
        mine = None
        if cid:
            c = await self._get(cid)
            if c and uid in [int(x) for x in c["members"]]:
                mem = [dict(m, me=(m["id"] == uid)) for m in await self._members(c)]
                card = await self._card(c)
                mine = dict(card, owner=int(c["owner"]), members=mem, me_owner=int(c["owner"]) == uid)
        top = []
        r = await self.s._redis()
        try:
            if r is None:
                ids = sorted(self._mem, key=lambda i: -sum(self._tro.get(i, {}).values()))[:top_n]
            else:
                ids = [int(i) for i in await asyncio.wait_for(r.zrevrange(K_LB, 0, top_n - 1), 2.0)]
                if len(ids) < top_n:                                                  # (a clan with no cups yet is not in the sorted set: show the newest ones too)
                    seq = int((await asyncio.wait_for(r.get(K_SEQ), 2.0)) or 0)
                    for i in range(seq, max(0, seq - 40), -1):
                        if len(ids) >= top_n:
                            break
                        if i not in ids:
                            ids.append(i)
        except Exception as e:  # noqa: BLE001
            log.warning("clan list failed: %s", e)
            ids = []
        for k, i in enumerate(ids):
            c = await self._get(i)
            if c:
                top.append(await self._card(c, k + 1))
        top.sort(key=lambda x: (-x["tro"], x["id"]))
        for k, t in enumerate(top):
            t["r"] = k + 1
        return {"mine": mine, "top": top, "max": MAX_MEMBERS, "min_keep": MIN_KEEP}

    # ------------------------------------------------------------------ commands (each: {ok, why?})
    async def create(self, uid: int, name: str, tag: str) -> Dict[str, Any]:
        nm, tg = clean_name(name), str(tag or "").strip().upper()
        if len(nm) < NAME_MIN:
            return {"ok": False, "why": "name"}
        if not TAG_RE.match(tg):
            return {"ok": False, "why": "tag"}
        async with self.s._lock(uid):
            st = await self.s._txn(uid)
            if st.get("clan"):
                return {"ok": False, "why": "in_clan"}
            if PR.keep_level(st) < MIN_KEEP:
                return {"ok": False, "why": "low", "need": MIN_KEEP}
            async with self._glock:
                cid = await self._next_id()
                if not await self._claim_name(nm, cid):
                    return {"ok": False, "why": "taken"}
                c = {"id": cid, "name": nm, "tag": tg, "owner": uid, "members": [uid], "t": time.time()}
                await self._put(c)
            st["clan"] = cid
            await self.s.save(uid, st)
        await self.member_cups(uid, st)
        return {"ok": True, "id": cid}

    async def join(self, uid: int, cid: int) -> Dict[str, Any]:
        async with self.s._lock(uid):
            st = await self.s._txn(uid)
            if st.get("clan"):
                return {"ok": False, "why": "in_clan"}
            if PR.keep_level(st) < MIN_KEEP:
                return {"ok": False, "why": "low", "need": MIN_KEEP}
            async with self._lock(cid):
                c = await self._get(cid)
                if not c:
                    return {"ok": False, "why": "gone"}
                if len(c["members"]) >= MAX_MEMBERS:
                    return {"ok": False, "why": "full"}
                if uid not in [int(x) for x in c["members"]]:
                    c["members"].append(uid)
                    await self._put(c)
            st["clan"] = cid
            await self.s.save(uid, st)
        await self.member_cups(uid, st)
        self._vc.pop(cid, None)
        return {"ok": True, "id": cid}

    async def _drop(self, c: Dict[str, Any], uid: int) -> None:
        """take `uid` out of clan `c` (clan lock held by the caller); a leaving owner hands the clan to the strongest member, an empty clan is deleted"""
        mem = [int(x) for x in c["members"] if int(x) != uid]
        await self._set_tro(int(c["id"]), uid, None)
        if not mem:
            await self._del(c)
            return
        c["members"] = mem
        if int(c["owner"]) == uid:
            tro = await self._trophies(int(c["id"]))
            c["owner"] = max(mem, key=lambda u: (tro.get(u, 0), -u))
        await self._put(c)

    async def leave(self, uid: int) -> Dict[str, Any]:
        async with self.s._lock(uid):
            st = await self.s._txn(uid)
            cid = int(st.get("clan") or 0)
            if not cid:
                return {"ok": False, "why": "none"}
            async with self._lock(cid):
                c = await self._get(cid)
                if c:
                    await self._drop(c, uid)
            st.pop("clan", None)
            await self.s.save(uid, st)
        self._vc.pop(cid, None)
        return {"ok": True}

    async def kick(self, uid: int, target: int) -> Dict[str, Any]:
        st = await self.s.load(uid)
        cid = int(st.get("clan") or 0)
        if not cid or target == uid:
            return {"ok": False, "why": "none"}
        async with self._lock(cid):
            c = await self._get(cid)
            if not c or int(c["owner"]) != uid:
                return {"ok": False, "why": "owner"}
            if target not in [int(x) for x in c["members"]]:
                return {"ok": False, "why": "gone"}
            await self._drop(c, target)
        async with self.s._lock(target):
            t = await self.s.load(target)
            if int(t.get("clan") or 0) == cid:
                t.pop("clan", None)
                await self.s.save(target, t)
        self._vc.pop(cid, None)
        return {"ok": True}
