#!/usr/bin/env python3
# tr2h_edges.py OUT — TR2_H part 3: what the hero sees at the soft edge of the walkable map (EDGE_R = 420 m, rpg.js): third person + first person looking OUT at 8 azimuths.
# env: HOUR (14), Q (low), LV (30), AZ (comma list of degrees; default 0,45,...,315 where 0 = +z), R (414), JOBS=strat,third,first, QX (extra query: '&edge=0' = before), SAZ (azimuths of the strategic shots, default 0,90,180,270)
import asyncio, sys, os, json, time, math
from playwright.async_api import async_playwright
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
HOUR = os.environ.get('HOUR', '14'); Q = os.environ.get('Q', 'low'); LV = os.environ.get('LV', '30'); R = float(os.environ.get('R', 414))
AZ = [float(a) for a in os.environ.get('AZ', '0,45,90,135,180,225,270,315').split(',')]; JOBS = os.environ.get('JOBS', 'third').split(','); QX = os.environ.get('QX', ''); SAZ = [float(a) for a in os.environ.get('SAZ', '0,90,180,270').split(',')]
W, H = 844, 390
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto(f'http://127.0.0.1:8777/rp1_dev.html?q={Q}&w=clear&h={HOUR}&wa=0.1&lv={LV}{QX}')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); if (B.ctl.intro) B.ctl.intro = null; }')
        await asyncio.sleep(3); print('ready', T(), flush=True)
        STRAT_PTS = {}
        if 'strat' in JOBS:                                  # the strategic camera first (before the hero starts): an orbit camera 70 m inside the rim looking out over the strip
            await pg.evaluate('() => { delete __bw.ctl.update; }')
            for a in SAZ:
                ar = math.radians(a); x, z = math.sin(ar) * 405, math.cos(ar) * 405
                await pg.evaluate('(c) => { const k = __bw.ctl; k.target.set(c.x, 0, c.z); k.dist = 75; k.polar = 1.15; k.azim = c.azim; window.__want = [c.x, c.z, 140]; }', {'x': x, 'z': z, 'azim': round(ar + math.pi, 3)}); await asyncio.sleep(3)
                for _ in range(60):
                    if await pg.evaluate('() => { const T = window.__tr2Town; return !T || (T.state.lazy.length === 0); }'): break
                    await asyncio.sleep(1)
                await asyncio.sleep(4); await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
                await pg.screenshot(path=f'{OUT}/edge_strat_{int(a):03d}.png', timeout=240000); print('shot strat', a, T(), flush=True)
        HJ = [j for j in JOBS if j != 'strat']
        await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,2500)); return 1; })()" % int(time.time()))
        info = {}
        REACH = "() => { const r = __rp.reachMap(4, { png: false }); const C = __rp.S._cls, best = {}; for (let j = 0; j < C.N; j++) for (let i = 0; i < C.N; i++) { if (C.cls[j * C.N + i] !== 4) continue; const x = C.x0 + (i + 0.5) * C.cell, z = C.x0 + (j + 0.5) * C.cell, rr = Math.hypot(x, z), a = Math.floor(((Math.atan2(x, z) * 180 / Math.PI + 360 + 22.5) % 360) / 45) * 45; if (!best[a] || rr > best[a].r) best[a] = { x, z, r: rr, a }; } return { reachPct: r.reachPct, reach: r.reach, unreach: r.unreach, best }; }"
        rm = await pg.evaluate(REACH); print('reach', {k: rm[k] for k in ('reachPct', 'reach', 'unreach')}, {a: (round(v['x']), round(v['z']), round(v['r'])) for a, v in rm['best'].items()}, flush=True)
        BEST = rm['best']
        for mode in HJ:
            await pg.evaluate(f"__rp.cam('{mode}')"); await asyncio.sleep(1)
            for a in AZ:
                bst = BEST.get(str(int(a)))
                if not bst: print('no reachable cell at', a); continue
                x, z = bst['x'], bst['z']; yaw = math.atan2(x, z)      # the farthest REACHABLE cell of that 45-degree sector, looking OUT
                await pg.evaluate(f"(() => {{ __rp.setPos({x:.1f},{z:.1f},{yaw:.3f}); __rp.setLook({yaw:.3f}, 0.1); }})()"); await asyncio.sleep(3)
                for _ in range(60):
                    if await pg.evaluate('() => { const T = window.__tr2Town; return !T || (T.state.lazy.length === 0); }'): break
                    await asyncio.sleep(1)
                await asyncio.sleep(4); await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
                pos = await pg.evaluate('__rp.pos()'); info[f'{mode}_{int(a)}'] = pos
                await pg.screenshot(path=f'{OUT}/edge_{mode}_{int(a):03d}.png', timeout=240000); print('shot', mode, a, pos, T(), flush=True)
        json.dump({'info': info, 'logs': logs[:10]}, open(f'{OUT}/edges_info.json', 'w'), indent=1)
        print('LOGS', logs[:6]); await b.close()
asyncio.run(main())
