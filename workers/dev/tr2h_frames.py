#!/usr/bin/env python3
# tr2h_frames.py LV OUT — TR2_H review frames: for one house of each kind unlocked at LV (+ a generic fill house) three cameras at 844x390:
#   strat  = the strategic orbit camera (ctl) close over the lot, plus one town overview
#   third  = the hero's real third-person camera (rpg.js, 3.6 m behind her, __rp.setPos / setLook)
#   first  = the hero's first-person camera (eye 1.62 m)
# env: HOUR (default 14), Q (low|med|high, default low), KINDS (comma list, default all), JOBS (strat,hero default both), PORT (8777), SKIP_OVERVIEW=1
import asyncio, sys, os, json, time, subprocess, math
from playwright.async_api import async_playwright
LV = sys.argv[1]; OUT = sys.argv[2]; os.makedirs(OUT, exist_ok=True)
HOUR = os.environ.get('HOUR', '14'); Q = os.environ.get('Q', 'low'); PORT = os.environ.get('PORT', '8777')
KINDS = os.environ.get('KINDS', 'cottage,craftsman,merchant,noble,generic').split(','); JOBS = os.environ.get('JOBS', 'strat,hero').split(',')
QX = os.environ.get('QX', '')                       # extra query string for the A/B switches, e.g. '&tr2h=0&br=old&edge=0&tr2cull=0'
W, H = int(os.environ.get('W', 844)), int(os.environ.get('H', 390))
TAG = f'lv{LV}_h{HOUR}' + os.environ.get('TAGX', '')
lots = json.loads(subprocess.check_output(['node', '/home/claude/dev/tr2h_lots.mjs', LV], stderr=subprocess.DEVNULL))['lots']
SETTLE = '() => { const T = window.__tr2Town; if (!T) return true; const w = window.__want, c = __bw.camera.position; if (w && Math.hypot(c.x - w[0], c.z - w[1]) > w[2]) return false; T.lod(__bw.camera, null, true); const s = T.state; const hi = s.cells.some((q) => q.want === "hi"); return s.lazy.length === 0 && (!hi || s.mode === "mixed") && s.cells.every((q) => q.want !== "hi" || q.shown === "hi"); }'   # (the camera must have reached the shot first: with SwiftShader the render loop lags, and a LOD pick made for the previous shot gave lo / far frames)
INFO = '() => { const r = __bw.renderer.info; return { calls: r.render.calls, tris: r.render.triangles, programs: r.programs.length, tex: r.memory.textures, geo: r.memory.geometries }; }'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        pg.on('console', lambda m: logs.append(m.text[:240]) if m.type in ('error', 'warning') and '404' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto(f'http://127.0.0.1:{PORT}/rp1_dev.html?q={Q}&w=clear&h={HOUR}&wa=0.1&lv={LV}{QX}')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); if (B.ctl.intro) B.ctl.intro = null; }')
        await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; }")
        await asyncio.sleep(4); print('ready', T(), flush=True)
        # the generic fill house nearest to the middle of the lower town + a hamlet house
        gen = await pg.evaluate("""() => { const g = (__bw.world.ctx.town && __bw.world.ctx.town.gen) || []; const f = (l) => l && ({ x: l.x, z: l.z, ry: l.ry, w: l.w, d: l.d, floors: l.floors || 1, cell: l.cell }); const fill = g.filter((q) => q.cell == null);
          fill.sort((a, b) => Math.hypot(a.x - 40, a.z - 100) - Math.hypot(b.x - 40, b.z - 100)); return { fill: f(fill[0]), n: g.length }; }""")
        jobs = list(lots)
        if 'generic' in KINDS and gen.get('fill'):
            l = gen['fill']; c, s = math.cos(l['ry']), math.sin(l['ry'])
            fr = lambda dz: [round(l['x'] + dz * s, 2) if False else round(l['x'] + (l['d'] / 2 + dz) * s, 2), round(l['z'] + (l['d'] / 2 + dz) * c, 2)]
            jobs.append({'kind': 'generic', 'id': 'fill', 'variant': 'house_generic_?', 'x': l['x'], 'z': l['z'], 'ry': l['ry'], 'w': l['w'], 'd': l['d'], 'front': fr(9), 'front2': fr(5)})
        jobs = [j for j in jobs if j['kind'] in KINDS]
        print('jobs', [(j['kind'], j['variant'], j['x'], j['z']) for j in jobs], 'gen', gen.get('n'), flush=True)
        stats = {}
        if os.environ.get('FORCE_HI'): await pg.evaluate("() => { window.__tr2TownLod = 'hi'; }")
        async def settle(extra=5):
            for _ in range(150):
                if await pg.evaluate(SETTLE): break
                await asyncio.sleep(1)
            await asyncio.sleep(extra)
            await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
        if 'strat' in JOBS:
            await pg.evaluate('() => { delete __bw.ctl.update; }')
            ov = [] if os.environ.get('SKIP_OVERVIEW') else [{'name': 'overview', 'x': 40, 'z': 100, 'dist': 150, 'polar': 1.0, 'azim': 0.6}, {'name': 'streetdown', 'x': 20, 'z': 95, 'dist': 55, 'polar': 1.15, 'azim': 0.2}]
            for c in ov + [{'name': f"{j['kind']}", 'x': j['x'], 'z': j['z'], 'dist': 46, 'polar': 1.05, 'azim': round(j['ry'] + 0.5, 2)} for j in jobs]:
                await pg.evaluate('(c) => { const k = __bw.ctl; k.target.set(c.x, 0, c.z); k.dist = c.dist; k.polar = c.polar; k.azim = c.azim; window.__want = [c.x, c.z, c.dist * 1.6 + 20]; }', c); await asyncio.sleep(2)
                await settle(4)
                stats[c['name']] = await pg.evaluate(INFO)
                await pg.screenshot(path=f"{OUT}/{TAG}_strat_{c['name']}.png", timeout=240000); print('shot strat', c['name'], stats[c['name']], T(), flush=True)
        if 'hero' in JOBS:
            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,2500)); return 1; })()" % int(time.time()))
            for mode in ('third', 'first'):
                await pg.evaluate(f"__rp.cam('{mode}')"); await asyncio.sleep(1)
                for j in jobs:
                    px, pz = (j['front2'] if mode == 'third' else j['front'])
                    yaw = math.atan2(j['x'] - px, j['z'] - pz)
                    await pg.evaluate(f"(() => {{ __rp.setPos({px},{pz},{yaw}); __rp.setLook({yaw}, {0.16 if mode == 'third' else 0.1}); }})()"); await pg.evaluate(f'window.__want = [{px}, {pz}, 9]'); await asyncio.sleep(2.5)
                    await settle(4)
                    stats[f"{mode}_{j['kind']}"] = await pg.evaluate(INFO); stats[f"{mode}_{j['kind']}"]['cells'] = await pg.evaluate('() => { const T = window.__tr2Town; return T ? T.state.mode + " " + T.state.cells.map((c) => c.key + ":" + (c.shown || "-")).join(" ") : null; }')
                    await pg.screenshot(path=f"{OUT}/{TAG}_{mode}_{j['kind']}.png", timeout=240000); print('shot', mode, j['kind'], j['variant'], stats[f"{mode}_{j['kind']}"], T(), flush=True)
        json.dump({'lv': LV, 'hour': HOUR, 'q': Q, 'jobs': jobs, 'stats': stats, 'logs': logs[:20]}, open(f'{OUT}/{TAG}_info.json', 'w'), indent=1)
        print('LOGS', logs[:6]); await b.close()
asyncio.run(main())
