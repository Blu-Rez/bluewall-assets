#!/usr/bin/env python3
# tr2h_bridge_high.py OUT — TR2_H step 3: fixed-camera bridge views (the orbit camera of the strat job does not reach its target in SwiftShader): per station `high` (a strategic view: 16 m up, 14 m to the side, looking at the bridge)
# and `side` (4.5 m over the bank, 0.7 x length to the side).  UI hidden.  env: QX (A/B switches), SET, PICK, FLIP (as tr2h_pts.mjs), VIEWS (default high,side), TAG
import asyncio, sys, os, json, time, subprocess, math
from playwright.async_api import async_playwright
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
QX = os.environ.get('QX', ''); VIEWS = os.environ.get('VIEWS', 'high,side').split(','); SET = os.environ.get('SET', ''); TAG = os.environ.get('TAG', 'x')
BR = json.loads(subprocess.check_output(['node', '/tmp/tr2h_br.out.mjs'], stderr=subprocess.DEVNULL))
if SET: BR = [b for b in BR if b['name'] in SET.split(',')]
POS = """(P) => { const B = __bw, K = B.ctl, c = B.camera; K.update = () => {}; const gh = (x, z) => K.height(x, z); const nx = Math.sin(P.yaw), nz = Math.cos(P.yaw), lx = nz, lz = -nx; let px, pz, py, ty = 0.5;
  if (P.view === 'high') { px = P.x + lx * 14 - nx * 10; pz = P.z + lz * 14 - nz * 10; py = 16; }
  else { const d = Math.max(16, P.len * 0.7); px = P.x + lx * d; pz = P.z + lz * d; py = Math.max(gh(px, pz), 0) + 4.5; }
  c.position.set(px, py, pz); c.lookAt(P.x, ty, P.z); c.updateMatrixWorld(true); window.__want = [P.x, P.z, 120]; return [px, py, pz]; }"""
SETTLE = '() => { const T = window.__tr2Town; if (!T) return true; T.lod(__bw.camera, null, true); const s = T.state; return s.lazy.length === 0; }'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto(f'http://127.0.0.1:8777/rp1_dev.html?q=low&w=clear&h=14&wa=0.1&lv=30{QX}')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); if (B.ctl.intro) B.ctl.intro = null; const u = document.querySelector(".bw-ui"); if (u) u.style.display = "none"; }')
        await asyncio.sleep(4); print('ready', T(), flush=True)
        info = {}
        for v in VIEWS:
            for s in BR:
                pos = await pg.evaluate(POS, {**s, 'view': v}); await asyncio.sleep(3)
                for _ in range(60):
                    if await pg.evaluate(SETTLE): break
                    await asyncio.sleep(1)
                await asyncio.sleep(3); await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
                info[f"{v}_{s['name']}"] = await pg.evaluate('() => { const r = __bw.renderer.info; return { calls: r.render.calls, tris: r.render.triangles }; }')
                await pg.screenshot(path=f"{OUT}/{v}_{s['name']}.png", timeout=240000); print('shot', v, s['name'], [round(q) for q in pos], T(), flush=True)
        json.dump({'info': info, 'logs': logs[:6]}, open(f'{OUT}/high_info.json', 'w'), indent=1); print('LOGS', logs[:4]); await b.close()
asyncio.run(main())
