#!/usr/bin/env python3
# ST1 — drive the real game (dev_s35.html) on the home map at the phone-landscape size: strategic views (top / ctr / town / quarter) + 1:1 close-ups of every storage, vault and the central crystal.
#   W=844 H=390 URLQ="st1=1&s=2" VIEWS=top,ctr,town,quarter CLOSE=1 python3 st1_shots.py TAG [LV]      (static server :8777 from /home/claude/dev; software GL: NOT a phone number)
#   per view: renderer.info calls / tris / programs (3 frames averaged) + a full-size PNG;  results.json next to the PNGs.
import asyncio, sys, os, json, time, math
from playwright.async_api import async_playwright
TAG = sys.argv[1]; LV = sys.argv[2] if len(sys.argv) > 2 else '30'
OUT = '/home/claude/work/st1/' + TAG; os.makedirs(OUT, exist_ok=True)
W = int(os.environ.get('W', 844)); H = int(os.environ.get('H', 390)); URLQ = os.environ.get('URLQ', ''); Q = os.environ.get('Q', 'low'); SETTLE = float(os.environ.get('SETTLE', 8))
VIEWS = {
  'top':     "c.target.set(0,0,0); c.dist=c.maxD*1.0; c.polar=0.25; c.azim=0.6;",
  'ctr':     "c.target.set(0,0,0); c.dist=c.maxD*0.7; c.polar=0.95; c.azim=0.5;",
  'town':    "c.target.set(60,0,150); c.dist=140; c.polar=0.9; c.azim=0.6;",
  'hud_hi':  "c.target.set(0,0,0); c.dist=150; c.polar=0.95; c.azim=0.5;",
}
for kv in filter(None, os.environ.get('CAMS', '').split(';')):
    k, v = kv.split('=', 1); VIEWS[k] = v
want = [v for v in os.environ.get('VIEWS', 'top,ctr,town').split(',') if v]
FREE = """(j) => { const bw = __bw, H = bw.world.ctx.height, c = bw.camera; c.fov = j.fov || 52; c.updateProjectionMatrix(); c.position.set(j.cam[0], H(j.cam[0], j.cam[1]) + j.eye, j.cam[1]);
  c.lookAt(j.look[0], H(j.look[0], j.look[1]) + (j.dy || 0), j.look[1]); c.updateMatrixWorld(true); return [c.position.x, c.position.y, c.position.z]; }"""
LISTS = """() => { const w = __bw.world; const f = (a) => (a || []).map((s) => ({ id: s.id, x: s.x, z: s.z, y: s.y, ry: s.ry })); return { stores: f(w.stores && w.stores.list), vaults: f(w.vaults && w.vaults.list) }; }"""
MEAS = """async () => { const bw = __bw, r = bw.renderer; r.info.autoReset = false; r.info.reset(); const f0 = bw.frames; await new Promise((res) => { const t0 = bw.frames; const iv = setInterval(() => { if (bw.frames - t0 >= 3) { clearInterval(iv); res(); } }, 100); }); const n = bw.frames - f0;
  const o = { calls: Math.round(r.info.render.calls / n), tris: Math.round(r.info.render.triangles / n), prog: r.info.programs ? r.info.programs.length : -1, n }; r.info.autoReset = true; return o; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        await pg.goto('http://127.0.0.1:'+os.environ.get('PORT','8777')+'/dev_s35.html?q=' + Q + '&w=clear&h=14&wa=0.1&lv=' + LV + ('&' + URLQ if URLQ else ''))
        for i in range(4000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.evaluate("() => { const c = __bw.ctl; if (c.intro) c.intro = null; const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; __bw.ctl.update = () => {}; }")
        CAMS2 = {'top': {'cam': (0, 330), 'look': (0, 0), 'eye': 330, 'dy': 0, 'fov': 52}, 'quarter': {'cam': (-20, 175), 'look': (-20, 90), 'eye': 55, 'dy': 0, 'fov': 52}, 'town': {'cam': (60, 330), 'look': (60, 150), 'eye': 120, 'dy': 0, 'fov': 52}}
        res = {}
        for nm, j in CAMS2.items():
            await pg.evaluate(FREE, j); await asyncio.sleep(5)
            a = await pg.evaluate(MEAS); res[nm] = a; print('perf', nm, a, flush=True)
        json.dump(res, open(f'{OUT}/perf.json', 'w')); await b.close()
asyncio.run(main())
