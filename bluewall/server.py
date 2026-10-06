"""Blue Wall web server — ``python -m bluewall`` (systemd unit: bluebot-wall).

Listens on 127.0.0.1:BLUEWALL_PORT; nginx (TLS, game.bluhearts.com) proxies
to it and Cloudflare sits in front.

Routes
  GET  /             public loader (tiny): opens Telegram SDK, calls /api/auth
  GET  /tg.js        Telegram WebApp SDK, self-hosted (telegram.org is often
                     unreachable from Iran without a VPN, the WebView ignores
                     Telegram's in-app proxy)
  POST /api/auth     {init_data} -> 200 {token,name} | 403 {reason}
  GET  /api/bundle   the game (gated: Authorization: Bearer <session token>)
  GET  /api/state    castle level, gem wallet, mines (rate / storage / ready)
  POST /api/collect  {mine: ruby|emerald|turq} -> collect the mine's gems
  GET  /api/catalog  static tables: gem cost + duration of every structure level
  GET  /api/rank     leaderboard (top 20 by cups), your place + league, your invite link
  POST /api/upgrade/{start|cancel|speedup|finish}  {ent} -> upgrade queue (builders, reserved upgrades, rush with turquoise)
  POST /api/army/{train|cancel|speedup|get}  {u,n | fam} -> train soldiers / creatures (barracks, training ground, stable, lair, workshop), housing = training ground
  POST /api/scout    next attack target (bot 10 % weaker .. 50 % stronger, or an offline player) — owner-only until battles are simulated server-side
  POST /api/battle/end  {id, rep:{sent,lost,destruction,stars,loot}} -> validated result: losses, loot, stars (owner-only for now)
  POST /api/dev      owner only: {max | all:n | set:{ent:lv} | gems:n | fill | finish | reset} (preview tiers, test upgrades)
  GET  /healthz
"""
from __future__ import annotations

import asyncio
import gzip
import hashlib
import json
import logging
import os
import random
import time
from pathlib import Path
from typing import Dict, List, Optional

from aiohttp import web

from . import access
from . import auth as A
from .state import STORE, StateUnavailable
from . import progress as PR
from . import military as MI
from . import social as SO

log = logging.getLogger("bluewall")

WEB = Path(__file__).resolve().parent / "web"
BUNDLE = WEB / "app" / "wall.js"

REDIS_URL = os.getenv("BLUEBOT_REDIS_URL", "redis://127.0.0.1:6379")
REDIS_DB = int(os.getenv("BLUEBOT_QUEUE_DB", "0") or 0)
HB_CFG_KEY = "bluebot:hb:cfg"          # core.multibot.CFG_KEY (helper bots)

_RL: Dict[str, List[float]] = {}
_RL_MAX, _RL_WIN = 30, 60.0


def _main_token() -> str:
    from config import settings
    return settings.BOT_TOKEN


class _Helpers:
    """Helper-bot tokens (a game menu can be served by a helper bot, then the
    Mini App's initData is signed with THAT token). Refreshed every 30 s."""

    def __init__(self) -> None:
        self.tokens: List[str] = []
        self.at = 0.0
        self._r = None

    async def get(self) -> List[str]:
        if time.monotonic() - self.at < 30:
            return self.tokens
        self.at = time.monotonic()
        try:
            if self._r is None:
                import redis.asyncio as aioredis
                self._r = aioredis.from_url(REDIS_URL, db=REDIS_DB, decode_responses=True)
            raw = await asyncio.wait_for(self._r.get(HB_CFG_KEY), 2.0)
            cfg = json.loads(raw) if raw else {}
            self.tokens = [str(b["token"]) for b in (cfg.get("bots") or [])
                           if b.get("token") and b.get("state") in ("on", "drain")]
        except Exception as e:  # noqa: BLE001
            log.debug("helper tokens unavailable: %s", e)
        return self.tokens


HELPERS = _Helpers()


class _Bundle:
    """wall.js kept in memory (raw + gzip) and reloaded when the file changes."""

    def __init__(self) -> None:
        self.mtime = -1.0
        self.raw = b""
        self.gz = b""
        self.etag = ""

    def load(self) -> bool:
        try:
            st = BUNDLE.stat()
        except FileNotFoundError:
            return False
        if st.st_mtime != self.mtime:
            raw = BUNDLE.read_bytes()
            self.raw, self.gz = raw, gzip.compress(raw, 6)
            self.etag = '"' + hashlib.sha1(raw).hexdigest()[:20] + '"'
            self.mtime = st.st_mtime
        return True


BUNDLE_CACHE = _Bundle()


def _ip(req: web.Request) -> str:
    return (req.headers.get("CF-Connecting-IP") or req.headers.get("X-Real-IP")
            or (req.remote or "?"))


def _limited(ip: str, mx: int = 0) -> bool:
    now = time.monotonic()
    q = [t for t in _RL.get(ip, ()) if now - t < _RL_WIN]
    q.append(now)
    _RL[ip] = q
    if len(_RL) > 5000:                                  # keep memory bounded
        for k in list(_RL)[:2500]:
            _RL.pop(k, None)
    return len(q) > (mx or _RL_MAX)


def _nocache(resp: web.StreamResponse) -> web.StreamResponse:
    resp.headers["Cache-Control"] = "private, no-cache"
    resp.headers["X-Content-Type-Options"] = "nosniff"
    return resp


async def h_index(req: web.Request) -> web.StreamResponse:
    return _nocache(web.FileResponse(WEB / "index.html",
                                     headers={"Content-Type": "text/html; charset=utf-8"}))


async def h_tg(req: web.Request) -> web.StreamResponse:
    resp = web.FileResponse(WEB / "tg.js", headers={"Content-Type": "application/javascript"})
    resp.headers["Cache-Control"] = "public, max-age=86400"
    return resp


_PUB_TYPES = {".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp",
              ".svg": "image/svg+xml", ".ogg": "audio/ogg", ".mp3": "audio/mpeg",
              ".json": "application/json"}


async def h_pub(req: web.Request) -> web.StreamResponse:
    """Public, cacheable assets (fonts, later sounds/images). Flat folder only."""
    name = req.match_info.get("name", "")
    if not name or "/" in name or "\\" in name or name.startswith("."):
        raise web.HTTPNotFound()
    p = WEB / "pub" / name
    ctype = _PUB_TYPES.get(p.suffix.lower())
    if ctype is None or not p.is_file():
        raise web.HTTPNotFound()
    resp = web.FileResponse(p, headers={"Content-Type": ctype})
    resp.headers["Cache-Control"] = "public, max-age=604800"
    return resp


_ASSET_TYPES = {".glb": "model/gltf-binary", ".webp": "image/webp", ".png": "image/png",
                ".jpg": "image/jpeg", ".json": "application/json", ".ogg": "audio/ogg", ".mp3": "audio/mpeg"}
ASSETS = (WEB / "assets").resolve()


async def h_asset(req: web.Request) -> web.StreamResponse:
    """3D models / textures (CC0 packs, public). Nested paths, no traversal."""
    tail = req.match_info.get("tail", "")
    try:
        p = (ASSETS / tail).resolve()
    except Exception:  # noqa: BLE001
        raise web.HTTPNotFound()
    if ASSETS not in p.parents or not p.is_file():
        raise web.HTTPNotFound()
    ctype = _ASSET_TYPES.get(p.suffix.lower())
    if ctype is None:
        raise web.HTTPNotFound()
    resp = web.FileResponse(p, headers={"Content-Type": ctype})
    resp.headers["Cache-Control"] = "public, max-age=86400"
    return resp


def _read_build() -> str:
    try:
        return (Path(__file__).resolve().parent / "BUILD").read_text(encoding="utf-8").strip()[:64] or "dev"
    except OSError:
        return "dev"


_BUILD = _read_build()                                                                   # (read ONCE at start: the id is the build this process was started from, so the installer can prove the NEW process answers)


def _build_id() -> str:
    """Name of the package this process was started from (mkpkg.sh writes it into bluewall/BUILD)."""
    return _BUILD


_BOOT = time.time()


async def h_health(req: web.Request) -> web.Response:
    if req.query.get("deep") and (req.remote or "") in ("127.0.0.1", "::1"):               # (the installer only; never reachable from outside)
        return web.json_response({"ok": True, "build": _build_id(), "up": int(time.time() - _BOOT)})
    return web.Response(text="ok")


def _is_owner(uid: int) -> bool:
    try:
        from config import settings
        return int(getattr(settings, "SUPER_ADMIN_UID", 0) or 0) == int(uid)
    except Exception:  # noqa: BLE001
        return False


def _bearer_uid(req: web.Request) -> Optional[int]:
    h = req.headers.get("Authorization", "")
    if not h.startswith("Bearer "):
        return None
    uid = A.read_session(h[7:].strip(), _main_token())
    if uid is None or not access.can_enter(uid):
        return None
    return uid


async def h_auth(req: web.Request) -> web.Response:
    ip = _ip(req)
    if _limited(ip):
        return _nocache(web.json_response({"ok": False, "reason": "slow"}, status=429))
    try:
        body = await req.json()
        init_data = str(body.get("init_data") or "")
    except Exception:  # noqa: BLE001
        return _nocache(web.json_response({"ok": False, "reason": "bad"}, status=400))
    tokens = [_main_token()] + [t for t in await HELPERS.get() if t != _main_token()]
    user = A.check_init_data(init_data, tokens)
    if user is None:
        log.info("auth: bad initData ip=%s", ip)
        return _nocache(web.json_response({"ok": False, "reason": "bad"}, status=401))
    uid = int(user["id"])
    if not access.can_enter(uid):
        log.info("auth: locked uid=%s", uid)
        return _nocache(web.json_response({"ok": False, "reason": "locked"}, status=403))
    log.info("auth: enter uid=%s", uid)
    name = (str(user.get("first_name") or "") + " " + str(user.get("last_name") or "")).strip()
    lvl = 0
    try:
        lvl = int(await STORE.touch(uid, name) or 0)
        sp = str(user.get("_sp") or "")
        if sp.startswith("ref_") and sp[4:].isdigit() and len(sp) < 24:
            await STORE.refer(uid, int(sp[4:]))                                              # (a friend's link: remembered once, paid when this castle reaches level 3)
    except Exception as e:  # noqa: BLE001
        log.warning("touch failed uid=%s: %s", uid, e)
    return _nocache(web.json_response({
        "ok": True, "token": A.make_session(uid, _main_token()),
        "uid": uid, "name": name[:64], "owner": _is_owner(uid), "level": lvl}))


async def h_bundle(req: web.Request) -> web.StreamResponse:
    if _bearer_uid(req) is None:
        return _nocache(web.json_response({"ok": False, "reason": "locked"}, status=403))
    if not BUNDLE_CACHE.load():
        return _nocache(web.json_response({"ok": False, "reason": "missing"}, status=503))
    b = BUNDLE_CACHE
    if req.headers.get("If-None-Match") == b.etag:
        return _nocache(web.Response(status=304, headers={"ETag": b.etag}))
    use_gz = "gzip" in req.headers.get("Accept-Encoding", "")
    resp = web.Response(body=b.gz if use_gz else b.raw,
                        content_type="application/javascript", charset="utf-8")
    if use_gz:
        resp.headers["Content-Encoding"] = "gzip"
    resp.headers["ETag"] = b.etag
    resp.headers["X-Raw-Size"] = str(len(b.raw))
    resp.headers["Vary"] = "Accept-Encoding, Authorization"
    return _nocache(resp)


async def h_state(req: web.Request) -> web.Response:
    uid = _bearer_uid(req)
    if uid is None:
        return _nocache(web.json_response({"ok": False, "reason": "locked"}, status=403))
    st = await STORE.get(uid)
    return _nocache(web.json_response({"ok": True, **st}))


def _invite_link(uid: int) -> str:
    base = os.getenv("BLUEWALL_APP_LINK", "")
    if not base:
        try:
            from config import settings
            base = str(getattr(settings, "BLUEWALL_APP_LINK", "") or "")
            if not base:
                un = str(getattr(settings, "BOT_USERNAME", "") or "").lstrip("@")
                base = "https://t.me/" + (un or "Blue_Hearts_Bot")
        except Exception:  # noqa: BLE001
            base = "https://t.me/Blue_Hearts_Bot"
    return "%s?startapp=ref_%d" % (base.rstrip("/"), uid)


async def h_rank(req: web.Request) -> web.Response:
    uid = _bearer_uid(req)
    if uid is None:
        return _nocache(web.json_response({"ok": False, "reason": "locked"}, status=403))
    if _limited("r:" + str(uid), 20):
        return _nocache(web.json_response({"ok": False, "reason": "slow"}, status=429))
    out = await STORE.leaderboard(uid, 20)
    out["invite"] = {"link": _invite_link(uid), "pay": SO.INVITE_PAY, "keep": SO.INVITE_AT_KEEP, "done": out["me"].pop("invited", 0), "max": out["me"].pop("invite_max", SO.INVITE_MAX)}
    return _nocache(web.json_response({"ok": True, **out}))


async def _social_guard(req: web.Request, key: str, per: int = 20):
    uid = _bearer_uid(req)
    if uid is None:
        return None, _nocache(web.json_response({"ok": False, "reason": "locked"}, status=403))
    if _limited(key + ":" + str(uid), per):
        return None, _nocache(web.json_response({"ok": False, "reason": "slow"}, status=429))
    return uid, None


async def h_log(req: web.Request) -> web.Response:
    uid, bad = await _social_guard(req, "lg")
    if bad is not None:
        return bad
    return _nocache(web.json_response({"ok": True, **(await STORE.history(uid))}))


async def h_friends(req: web.Request) -> web.Response:
    uid, bad = await _social_guard(req, "fr")
    if bad is not None:
        return bad
    out = await STORE.friends(uid)
    out["link"] = _invite_link(uid)
    return _nocache(web.json_response({"ok": True, **out}))


async def h_clan(req: web.Request) -> web.Response:
    uid, bad = await _social_guard(req, "cl", 30)
    if bad is not None:
        return bad
    try:
        if req.method == "POST":
            body = await req.json()
            op = str(body.get("op") or "")
            cl = STORE.clans
            if op == "create":
                r = await cl.create(uid, str(body.get("name") or ""), str(body.get("tag") or ""))
            elif op == "join":
                r = await cl.join(uid, int(body.get("id")))
            elif op == "leave":
                r = await cl.leave(uid)
            elif op == "kick":
                r = await cl.kick(uid, int(body.get("id")))
            else:
                return _nocache(web.json_response({"ok": False, "reason": "bad"}, status=400))
            if not r.get("ok"):
                return _nocache(web.json_response({"ok": False, "reason": "no", "why": r.get("why"), "need": r.get("need")}))
        return _nocache(web.json_response({"ok": True, **(await STORE.clans.view(uid))}))
    except (ValueError, TypeError):
        return _nocache(web.json_response({"ok": False, "reason": "bad"}, status=400))


async def h_collect(req: web.Request) -> web.Response:
    uid = _bearer_uid(req)
    if uid is None:
        return _nocache(web.json_response({"ok": False, "reason": "locked"}, status=403))
    if _limited("c:" + str(uid)):
        return _nocache(web.json_response({"ok": False, "reason": "slow"}, status=429))
    try:
        body = await req.json()
        mine = str(body.get("mine") or "")
    except Exception:  # noqa: BLE001
        return _nocache(web.json_response({"ok": False, "reason": "bad"}, status=400))
    st = await STORE.collect(uid, mine)
    if st is None:
        return _nocache(web.json_response({"ok": False, "reason": "bad"}, status=400))
    log.info("collect uid=%s mine=%s got=%s", uid, mine, st["got"]["n"])
    return _nocache(web.json_response({"ok": True, **st}))


async def h_catalog(req: web.Request) -> web.Response:
    if _bearer_uid(req) is None:
        return _nocache(web.json_response({"ok": False, "reason": "locked"}, status=403))
    return _nocache(web.json_response({"ok": True, **PR.catalog(), "army": MI.catalog()}))


async def h_upgrade(req: web.Request) -> web.Response:
    uid = _bearer_uid(req)
    if uid is None:
        return _nocache(web.json_response({"ok": False, "reason": "locked"}, status=403))
    if _limited("u:" + str(uid)):
        return _nocache(web.json_response({"ok": False, "reason": "slow"}, status=429))
    op = req.match_info.get("op", "")
    if op not in ("start", "cancel", "speedup", "finish"):
        return _nocache(web.json_response({"ok": False, "reason": "bad"}, status=400))
    try:
        body = await req.json()
        ent = str(body.get("ent") or "")
    except Exception:  # noqa: BLE001
        body, ent = {}, ""
    out = await STORE.upgrade(uid, op, ent)
    if op != "finish":
        log.info("upgrade uid=%s %s %r -> %s", uid, op, ent[:32], "ok" if out.get("ok") else out.get("why"))      # (%r: a made-up name can never break a log line)
    return _nocache(web.json_response(out))


async def _json_body(req: web.Request) -> dict:
    try:
        b = await req.json()
        return b if isinstance(b, dict) else {}
    except Exception:  # noqa: BLE001
        return {}


async def h_army(req: web.Request) -> web.Response:
    uid = _bearer_uid(req)
    if uid is None:
        return _nocache(web.json_response({"ok": False, "reason": "locked"}, status=403))
    if _limited("a:" + str(uid), 120):
        return _nocache(web.json_response({"ok": False, "reason": "slow"}, status=429))
    op = req.match_info.get("op", "")
    if op not in ("train", "cancel", "speedup", "get", "brew", "brewcancel", "brewspeed", "emblem", "guard"):
        return _nocache(web.json_response({"ok": False, "reason": "bad"}, status=400))
    out = await STORE.army(uid, op, await _json_body(req))
    if op != "get":
        log.info("army uid=%s %s -> %s", uid, op, "ok" if out.get("ok") else out.get("why"))
    return _nocache(web.json_response(out))


async def h_shop(req: web.Request) -> web.Response:
    uid = _bearer_uid(req)
    if uid is None:
        return _nocache(web.json_response({"ok": False, "reason": "locked"}, status=403))
    if _limited("u:" + str(uid)):
        return _nocache(web.json_response({"ok": False, "reason": "slow"}, status=429))
    body = await _json_body(req)
    out = await STORE.shop(uid, body)
    log.info("shop uid=%s %r -> %s", uid, {k: body.get(k) for k in ("id", "kind", "p", "d")}, "ok" if out.get("ok") else out.get("why"))
    return _nocache(web.json_response(out))


async def h_scout(req: web.Request) -> web.Response:
    uid = _bearer_uid(req)
    if uid is None:
        return _nocache(web.json_response({"ok": False, "reason": "locked"}, status=403))
    if _limited("s:" + str(uid)):
        return _nocache(web.json_response({"ok": False, "reason": "slow"}, status=429))
    out = await STORE.scout(uid, bool((await _json_body(req)).get("bots_only")))
    log.info("scout uid=%s -> %s", uid, "ok" if out.get("ok") else out.get("why"))
    return _nocache(web.json_response(out))


async def h_battle_end(req: web.Request) -> web.Response:
    uid = _bearer_uid(req)
    if uid is None:
        return _nocache(web.json_response({"ok": False, "reason": "locked"}, status=403))
    if _limited("b:" + str(uid)):
        return _nocache(web.json_response({"ok": False, "reason": "slow"}, status=429))
    b = await _json_body(req)
    rep = b.get("rep") if isinstance(b.get("rep"), dict) else {}
    out = await STORE.battle_end(uid, str(b.get("id") or ""), rep)
    log.info("battle uid=%s -> %s", uid, "ok" if out.get("ok") else out.get("why"))
    return _nocache(web.json_response(out))


async def h_perf(req: web.Request) -> web.Response:
    # the client's flight recorder (client/src/perf.js): slow frames + a device snapshot, one JSON line per report in the service log
    uid = _bearer_uid(req)
    if uid is None:
        return _nocache(web.json_response({"ok": False, "reason": "locked"}, status=403))
    if _limited("p:" + str(uid), 30):
        return _nocache(web.json_response({"ok": False, "reason": "slow"}, status=429))
    try:
        raw = await req.content.read(8192)
        body = json.loads(raw.decode("utf-8", "replace"))
    except Exception:  # noqa: BLE001
        return _nocache(web.json_response({"ok": False, "reason": "bad"}, status=400))
    if isinstance(body, dict):
        log.warning("perf uid=%s %s", uid, json.dumps(body, separators=(",", ":"), ensure_ascii=True)[:1800])
    return _nocache(web.json_response({"ok": True}))


async def h_dev(req: web.Request) -> web.Response:
    uid = _bearer_uid(req)
    if uid is None or not _is_owner(uid):
        return _nocache(web.json_response({"ok": False, "reason": "locked"}, status=403))
    try:
        body = await req.json()
    except Exception:  # noqa: BLE001
        body = {}
    out = await STORE.dev(uid, body if isinstance(body, dict) else {})
    log.info("dev uid=%s %s", uid, sorted(body)[:6] if isinstance(body, dict) else "?")
    return _nocache(web.json_response({"ok": True, **out}))


@web.middleware
async def _store_guard(req: web.Request, handler):
    """A kingdom that cannot be read right now is a short 'busy' (the client retries), never an empty kingdom."""
    try:
        return await handler(req)
    except web.HTTPException:
        raise
    except StateUnavailable:
        return _nocache(web.json_response({"ok": False, "reason": "busy"}, status=503))
    except Exception:  # noqa: BLE001
        ref = "%08x" % random.getrandbits(32)                                                                           # (the player can quote this; the log line carries the traceback)
        log.exception("unhandled error ref=%s %s %s", ref, req.method, req.path)
        return _nocache(web.json_response({"ok": False, "reason": "server", "ref": ref}, status=500))


def make_app() -> web.Application:
    app = web.Application(client_max_size=64 * 1024, middlewares=[_store_guard])
    app.router.add_get("/", h_index)
    app.router.add_get("/tg.js", h_tg)
    app.router.add_get("/pub/{name}", h_pub)
    app.router.add_get("/assets/{tail:.+}", h_asset)
    app.router.add_get("/healthz", h_health)
    app.router.add_post("/api/auth", h_auth)
    app.router.add_get("/api/bundle", h_bundle)
    app.router.add_get("/api/state", h_state)
    app.router.add_post("/api/collect", h_collect)
    app.router.add_get("/api/catalog", h_catalog)
    app.router.add_get("/api/rank", h_rank)
    app.router.add_get("/api/log", h_log)
    app.router.add_get("/api/friends", h_friends)
    app.router.add_get("/api/clan", h_clan)
    app.router.add_post("/api/clan", h_clan)
    app.router.add_post("/api/upgrade/{op}", h_upgrade)
    app.router.add_post("/api/army/{op}", h_army)
    app.router.add_post("/api/scout", h_scout)
    app.router.add_post("/api/shop/buy", h_shop)
    app.router.add_post("/api/battle/end", h_battle_end)
    app.router.add_post("/api/dev", h_dev)
    app.router.add_post("/api/perf", h_perf)
    return app


def main() -> None:
    logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    from config import settings
    port = int(getattr(settings, "BLUEWALL_PORT", 8590) or 8590)
    BUNDLE_CACHE.load()
    log.info("Blue Wall on 127.0.0.1:%s (public=%s, allow=%s)", port,
             access.is_public(), sorted(access.allowed_uids()))
    web.run_app(make_app(), host="127.0.0.1", port=port, access_log=None,
                print=None, handle_signals=True)


if __name__ == "__main__":
    main()
