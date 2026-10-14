# rp1_server_test.py — mother's test: /assets/rpg/*.js is served as JavaScript, a .glb stays model/gltf-binary, traversal + unknown suffix stay 404.   prints "RP1 SERVER OK"
import sys, asyncio, importlib
sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer
srv = importlib.import_module('bluewall.server')
async def main():
    app = web.Application(); app.router.add_get('/assets/{tail:.+}', srv.h_asset)
    async with TestClient(TestServer(app)) as c:
        r = await c.get('/assets/rpg/rpg.js'); assert r.status == 200 and 'javascript' in r.headers['Content-Type'], (r.status, r.headers.get('Content-Type'))
        r = await c.get('/assets/rpg/rpg_under.js'); assert r.status == 200 and 'javascript' in r.headers['Content-Type']
        r = await c.get('/assets/rpg/elina.glb'); assert r.status == 200 and r.headers['Content-Type'] == 'model/gltf-binary'
        r = await c.get('/assets/rpg/c_elina.webp'); assert r.status == 200 and r.headers['Content-Type'] == 'image/webp'
        r = await c.get('/assets/../server.py'); assert r.status == 404
        r = await c.get('/assets/rpg/nope.js'); assert r.status == 404
        r = await c.get('/assets/rpg/'); assert r.status in (404, 405)
    print('RP1 SERVER OK')
asyncio.run(main())
