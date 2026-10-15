#!/usr/bin/env python3
# rp4r3_arena_smoke.py — RP4_R3: the REAL fx.js + combat.js in the RP4 arena (dev/rp4_dev.html, real browser, software GL):
#   the roll (stick forward / sideways / none), the arena edge, and a hit that throws an enemy.   Needs the server on 8777 (wc1_test.sh starts it).
import asyncio, json, sys
from playwright.async_api import async_playwright
URL = 'http://127.0.0.1:8777/rp4_dev.html'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 844, 'height': 390}); logs = []
        pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:200]) if m.type == 'error' else None)
        await pg.goto(URL + '?manual=1&w=844&h=390&kinds=soldier'); await pg.wait_for_function('window.__ready===true || window.__err', timeout=120000)
        err = await pg.evaluate('window.__err||null')
        if err: print('ERR', err); sys.exit(1)
        res = await pg.evaluate("""() => {
          const r = window.__rp4, S = r.S, out = {}; const sim = r.sim;
          sim.enemies.length = 0;
          const roll = (name, ix, iy, x0, z0, body) => { r.setPos(x0, z0, body); r.input(0, 0); r.step(0.8); const sx = S.x, sz = S.z; r.input(ix, iy); r.press('dodge'); const tr = []; for (let i = 0; i < 70; i++) { r.step(1 / 60); if (i === 1) r.input(0, 0); if (i % 3 === 2) tr.push([+(S.x - sx).toFixed(3), +(S.z - sz).toFixed(3)]); } r.step(0.3); out[name] = { d: +Math.hypot(S.x - sx, S.z - sz).toFixed(3), dx: +(S.x - sx).toFixed(3), dz: +(S.z - sz).toFixed(3), body: +S.body.toFixed(2), st: S.st }; };
          roll('fwd', 0, 1, 0, -4, 0); roll('right', 1, 0, 0, -4, 0); roll('back', 0, -1, 0, 0, 0); roll('diag', 0.7071, 0.7071, 0, -4, 0); roll('noStick', 0, 0, 0, -4, 0);
          roll('edge', 0, 1, 0, 18.5, 0);   // 1.9 m from the arena rim (R 20.4): the roll is cut by the host's rim clamp
          // a hit that throws its victim
          r.setPos(0, 0, 0); r.input(0, 0); r.step(0.5); const e = sim.spawn('soldier', 0, 1.4, { passive: true, element: null }); e.hp = e.hpMax = 99999; r.step(0.2);
          const z0 = e.z, x0 = e.x, tz = []; r.press('attack'); let maxD = 0, dt0 = null, tEnd = null;
          for (let i = 0; i < 90; i++) { r.step(1 / 60); const d = Math.hypot(e.x - x0, e.z - z0); if (d > 0.02 && dt0 == null) dt0 = i / 60; maxD = Math.max(maxD, d); if (i % 6 === 0) tz.push(+d.toFixed(3)); }
          out.knock = { maxD: +maxD.toFixed(3), firstMoveAt: dt0, d: tz, hp: e.hp < e.hpMax };
          return out; }""")
        print(json.dumps(res, indent=1)); print('LOGS', logs[:5])
        await b.close()
asyncio.run(main())
