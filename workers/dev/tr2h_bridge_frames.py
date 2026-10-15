#!/usr/bin/env python3
# tr2h_bridge_frames.py OUT [STATIONS] — TR2_H bridge / pier / quay audit: for each station three cameras at 844x390 (strategic orbit, hero third person, hero first person 1.62 m).
# env: HOUR (14), Q (low), LV (30), SET=comma list of station names (default all), JOBS=strat,third,first
import asyncio, sys, os, json, time, subprocess, math
from playwright.async_api import async_playwright
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
HOUR = os.environ.get('HOUR', '14'); Q = os.environ.get('Q', 'low'); LV = os.environ.get('LV', '30'); PORT = os.environ.get('PORT', '8777')
JOBS = os.environ.get('JOBS', 'strat,third,first').split(','); SET = os.environ.get('SET', '')
QX = os.environ.get('QX', '')                       # extra query string (A/B switches: '&br=old&tr2h=0&edge=0')
W, H = int(os.environ.get('W', 844)), int(os.environ.get('H', 390))
pts = json.loads(subprocess.check_output(['node', '/tmp/tr2h_pts.out.mjs'], stderr=subprocess.DEVNULL))['pts']
sn, cs = math.sin, math.cos
fish = [('fishery_lake', -123.3, 280.0, -2.304), ('fishery_river', 189.3, -169.3, 0.686)]
for name, x, z, ry in fish:    # the jetty runs from the site towards the water along local +z (dir = (sin ry, cos ry)); the hero stands on the shore side and looks along it
    pts.append({'name': name, 'kind': 'jetty', 'x': x + sn(ry) * 8, 'z': z + cs(ry) * 8, 'yaw': ry, 'startPos': [x - sn(ry) * 7, z - cs(ry) * 7], 'midPos': [x + sn(ry) * 3, z + cs(ry) * 3]})
if SET: pts = [p for p in pts if p['name'] in SET.split(',')]
TAG = f'lv{LV}_h{HOUR}'
SETTLE = '() => { const T = window.__tr2Town; if (!T) return true; const w = window.__want, c = __bw.camera.position; if (w && Math.hypot(c.x - w[0], c.z - w[1]) > w[2]) return false; T.lod(__bw.camera, null, true); const s = T.state; const hi = s.cells.some((q) => q.want === "hi"); return s.lazy.length === 0 && (!hi || s.mode === "mixed") && s.cells.every((q) => q.want !== "hi" || q.shown === "hi"); }'   # (the camera must have reached the shot first: with SwiftShader the render loop lags, and a LOD pick made for the previous shot gave lo / far frames)
INFO = '() => { const r = __bw.renderer.info; return { calls: r.render.calls, tris: r.render.triangles, programs: r.programs.length }; }'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto(f'http://127.0.0.1:{PORT}/rp1_dev.html?q={Q}&w=clear&h={HOUR}&wa=0.1&lv={LV}{QX}')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); if (B.ctl.intro) B.ctl.intro = null; }')
        await asyncio.sleep(4); print('ready', T(), [(q['name'], q['x'], q['z']) for q in pts], flush=True)
        async def settle(extra=4):
            for _ in range(150):
                if await pg.evaluate(SETTLE): break
                await asyncio.sleep(1)
            await asyncio.sleep(extra); await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
        stats = {}
        if 'strat' in JOBS:
            await pg.evaluate('() => { delete __bw.ctl.update; }')
            for s in pts:
                dist = 70 if s['name'].startswith('long') else 40
                await pg.evaluate('(c) => { const k = __bw.ctl; k.target.set(c.x, 0, c.z); k.dist = c.dist; k.polar = 1.1; k.azim = c.azim; window.__want = [c.x, c.z, c.dist * 1.6 + 20]; }', {'x': s['x'], 'z': s['z'], 'dist': dist, 'azim': round(s['yaw'] + 1.2, 2)}); await asyncio.sleep(2)
                await settle(3); stats['strat_' + s['name']] = await pg.evaluate(INFO)
                await pg.screenshot(path=f"{OUT}/{TAG}_strat_{s['name']}.png", timeout=240000); print('shot strat', s['name'], T(), flush=True)
        if 'third' in JOBS or 'first' in JOBS:
            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,2500)); return 1; })()" % int(time.time()))
            for mode in ('third', 'first'):
                if mode not in JOBS: continue
                await pg.evaluate(f"__rp.cam('{mode}')"); await asyncio.sleep(1)
                for s in pts:
                    px, pz = s['startPos'] if mode == 'third' else s['midPos']
                    await pg.evaluate(f"(() => {{ __rp.setPos({px},{pz},{s['yaw']}); __rp.setLook({s['yaw']}, {0.2 if mode == 'third' else 0.08}); }})()"); await pg.evaluate(f'window.__want = [{px}, {pz}, 9]'); await asyncio.sleep(2.5)
                    await settle(4); stats[mode + '_' + s['name']] = await pg.evaluate(INFO)
                    await pg.screenshot(path=f"{OUT}/{TAG}_{mode}_{s['name']}.png", timeout=240000); print('shot', mode, s['name'], await pg.evaluate('__rp.pos()'), T(), flush=True)
        json.dump({'stations': pts, 'stats': stats, 'logs': logs[:10]}, open(f'{OUT}/{TAG}_bridges_info.json', 'w'), indent=1)
        print('LOGS', logs[:6]); await b.close()
asyncio.run(main())
