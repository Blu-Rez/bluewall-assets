#!/usr/bin/env python3
"""LY1 rig (dev/ly1_server.py): the REAL bluewall server (make_app, memory state) + the dev page + the debug bundle on ONE origin, so the real client can POST /api/layout.
   python3 ly1_server.py PORT [BUNDLE]   -> uid 101 = owner (level 50), any other uid = a fresh level-1 player.  Token = the uid (Bearer 101)."""
import os, sys, types, json, time
os.environ["BLUEWALL_STATE"] = "memory"
sys.path.insert(0, "/home/claude/bot/bluebot_v2")
cfg = types.ModuleType("config"); cfg.settings = types.SimpleNamespace(SUPER_ADMIN_UID=101, OWNER_ID=101, SUPER_ADMIN_ID=101, BOT_TOKEN="123456:TESTTOKENabcdefghijk")
sys.modules["config"] = cfg
from aiohttp import web
from bluewall import server as srv
from bluewall import layout as LY
PORT = int(sys.argv[1]); BUNDLE = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "app_dbg.js")
HERE = os.path.dirname(os.path.abspath(__file__))
def _uid(req):
    h = req.headers.get("Authorization", "")
    return int(h[7:]) if h.startswith("Bearer ") and h[7:].isdigit() else None
srv._bearer_uid = _uid
LOG = []                                                          # every /api/layout call: (t, method, status, summary) -> GET /rig/log
@web.middleware
async def spy(req, handler):
    t0 = time.time(); body = None
    if req.path == "/api/layout" and req.method == "POST":
        try: body = json.loads((await req.read()).decode())
        except Exception: body = None
    resp = await handler(req)
    if req.path == "/api/layout":
        try: j = json.loads(resp.body.decode())
        except Exception: j = None
        sent = sorted(((body or {}).get("layout") or {}).get("m", {}).keys()) if body else None
        got = sorted((j or {}).get("layout", {}).get("m", {}).keys()) if j and j.get("layout") else (None if not j else [])
        LOG.append({"t": round(t0, 3), "m": req.method, "status": resp.status, "sent": sent, "got": got, "dropped": (j or {}).get("dropped"), "why": (j or {}).get("why"), "uid": _uid(req)})
    return resp
async def h_log(req): return web.json_response(LOG)
async def h_page(req): return web.FileResponse(os.path.join(HERE, "ly1_rig.html"))
async def h_js(req): return web.FileResponse(BUNDLE)
def make():
    app = srv.make_app(); app.middlewares.append(spy)
    app.router.add_get("/rig.html", h_page); app.router.add_get("/rig/wall.js", h_js); app.router.add_get("/rig/log", h_log)
    return app
if __name__ == "__main__":
    web.run_app(make(), host="127.0.0.1", port=PORT, print=lambda *a: print("rig up", PORT, flush=True))
