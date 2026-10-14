import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# p1_shots.py : ONE browser run for P1 — perf numbers (1100x620, same cameras as p38_perf), then phone frames (390x844) at lv30 and lv10 of the real game (dev_s35.html).
# OUT dir: work/p1_shots (raw frames + marks.json).  p1_sites.json = every site (node dump of worksites.sites() on the night map).
OUT = '/home/claude/work/p1_shots'; os.makedirs(OUT, exist_ok=True)
SITES = {s['id']: s for s in json.load(open('/home/claude/dev/p1_sites.json'))}
ONLY = os.environ.get('ONLY')  # comma list of shot names (debug)
PERF = {
  'top':    "c.target.set(0,0,0); c.dist=c.maxD*1.0; c.polar=0.25; c.azim=0.6;",
  'ctr':    "c.target.set(0,0,0); c.dist=c.maxD*0.7; c.polar=0.95; c.azim=0.5;",
  'town':   "c.target.set(60,0,150); c.dist=140; c.polar=0.9; c.azim=0.6;",
  'fields': "c.target.set(235,0,10); c.dist=150; c.polar=0.9; c.azim=1.2;",
  'lake':   "c.target.set(-128,0,230); c.dist=150; c.polar=0.95; c.azim=2.2;",
}
OLD12 = {'lumber1','lumber2','oil','quarry','iron','gold','farm','greenhouse','livestock','slaughter','fishery_lake','fishery_river'}
NEWIDS = [i for i in SITES if i not in OLD12]
CLOSE = [('m_water1', 'mill_water1'), ('m_water2', 'mill_water2'), ('m_wind1', 'mill_wind1'), ('m_wind2', 'mill_wind2'),
         ('t_mill00', 'mill_00'), ('t_mill01', 'mill_01'),
         ('k_panning', 'panning'), ('k_sawmill', 'sawmill_00'), ('k_masonry', 'masonry_00'), ('k_smelter', 'smelter_00'), ('k_mint', 'mint_00'),
         ('k_refinery', 'refinery_00'), ('k_bakery', 'bakery_00'), ('k_butcher', 'butcher_00'), ('k_smoke', 'smokehouse_00')]
CLUSTER = {'east': "c.target.set(108,0,-75); c.dist=190; c.polar=0.8; c.azim=0.3;", 'se': "c.target.set(112,0,58); c.dist=200; c.polar=0.8; c.azim=0.3;"}
TOP = "c.target.set(0,0,0); c.dist=c.maxD*1.0; c.polar=0.25; c.azim=0.6;"
KIND10 = ['panning', 'smokehouse', 'sawmill', 'masonry', 'smelter', 'mint', 'refinery', 'mill', 'bakery', 'butcher']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 620}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error', 'warning') else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('home ready', T(), flush=True)
        await asyncio.sleep(3)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) { c.intro=null; } const cv = __bw.renderer.domElement; for (const el of document.querySelectorAll("#game *")) { if (el === cv || el.contains(cv)) continue; el.style.visibility = "hidden"; } }')
        await asyncio.sleep(10)
        print('cam', await pg.evaluate('() => ({ fov: __bw.camera.fov, aspect: __bw.camera.aspect, maxD: __bw.ctl.maxD })'), flush=True)
        async def view(js):
            await pg.evaluate('() => { const c=__bw.ctl; ' + js + ' }')
        async def meas():
            return await pg.evaluate("""async () => { const bw = __bw, r = bw.renderer; r.info.autoReset = false; r.info.reset(); const f0 = bw.frames; await new Promise((res) => { const t0 = bw.frames; const iv = setInterval(() => { if (bw.frames - t0 >= 3) { clearInterval(iv); res(); } }, 100); }); const n = bw.frames - f0; const o = { calls: Math.round(r.info.render.calls / n), tris: Math.round(r.info.render.triangles / n), n }; r.info.autoReset = true; return o; }""")
        # ---- 1) perf, lv30, q=low, 1100x620 (same as p38_perf.py perf 30)
        perf = {}
        for nm, js in PERF.items():
            if ONLY: break
            await view(js); await asyncio.sleep(8)
            a1 = await meas()
            await pg.evaluate("() => { for (const c of __bw.scene.getObjectByName('late-stage').children) if (c.name === 'late:worksites' || c.name === 'late:wslife') c.visible = false; }")
            await asyncio.sleep(3); a0 = await meas()
            await pg.evaluate("() => { for (const c of __bw.scene.getObjectByName('late-stage').children) if (c.name === 'late:worksites' || c.name === 'late:wslife') c.visible = true; }")
            perf[nm] = {'with': a1, 'without': a0}; print('perf', nm, 'with', a1, 'without', a0, T(), flush=True)
            if nm in ('top', 'fields'):   # who pays: hide the new sites only / the life (carts, people) only
                await pg.evaluate("(ids) => { window.__nw = ids.map((i) => __bw.scene.getObjectByName('ws:' + i)).filter(Boolean); for (const o of window.__nw) o.visible = false; }", NEWIDS)
                await asyncio.sleep(2); an = await meas()
                await pg.evaluate("() => { for (const o of window.__nw) o.visible = true; for (const c of __bw.scene.getObjectByName('late-stage').children) if (c.name === 'late:wslife') c.visible = false; }")
                await asyncio.sleep(2); al = await meas()
                await pg.evaluate("() => { for (const c of __bw.scene.getObjectByName('late-stage').children) if (c.name === 'late:wslife') c.visible = true; }")
                perf[nm]['no_new_sites'] = an; perf[nm]['no_life'] = al; print('perf', nm, 'without NEW sites', an, 'without wslife', al, 'n_new_groups', await pg.evaluate('() => window.__nw.length'), flush=True)
        print('programs', await pg.evaluate('() => __bw.renderer.info.programs.length'), flush=True)
        json.dump(perf, open(OUT + '/perf.json', 'w'))
        # ---- 2) phone frames (390x844).  The dev camera is relaxed (minD / maxR / camR) only so that a close frame is possible; aspect, fov and tilt are the game's own.
        await pg.set_viewport_size({'width': 390, 'height': 844}); await asyncio.sleep(12)
        print('cam phone', await pg.evaluate('() => ({ aspect: __bw.camera.aspect, fov: __bw.camera.fov, w: innerWidth, h: innerHeight, cw: __bw.renderer.domElement.width, maxD: __bw.ctl.maxD, pNear: __bw.ctl.pNear })'), flush=True)
        await pg.evaluate('() => { const c = __bw.ctl; c.minD = 15; c.maxR = 5000; c.camR = 5000; window.__v = (tx, tz, need, azim, dmin) => { const k = Math.tan(__bw.camera.fov * Math.PI / 360) * __bw.camera.aspect; c.target.set(tx, 0, tz); c.dist = Math.max(dmin, Math.min(c.maxD, need / k)); c.azim = azim; }; }')
        import math
        def close_js(sid):
            s = SITES[sid]
            if s['town'] and s['lot']:
                L = s['lot']; return f"__v({L['x']:.1f},{L['z']:.1f},{max(L['w'], L['d']) / 2 + 5:.1f},{math.atan2(-L['x'], -L['z']):.3f},22)"
            need = {'panning': 17, 'wind': 20, 'water': 12}.get(s.get('variant') or s['kind'], 17)
            return f"__v({s['x'] - 5 * math.sin(s['ry']):.1f},{s['z'] - 5 * math.cos(s['ry']):.1f},{need},{s['ry'] + 0.55:.3f},22)"
        marks = {}
        async def shot(name, js, mark=False):
            if ONLY and name not in ONLY.split(','): return
            ts = time.time()
            try:
                await view(js); await asyncio.sleep(6)
                if mark:
                    pts = [[s['x'], s['z']] for s in SITES.values() if s['kind'] in KIND10]; ids = [s['id'] for s in SITES.values() if s['kind'] in KIND10]
                    pr = await pg.evaluate("(pts) => { const bw=__bw, cam=bw.camera, T=bw.THREE; cam.updateMatrixWorld(); const v=new T.Vector3(); return pts.map(p => { v.set(p[0], 0, p[1]).project(cam); return [(v.x*0.5+0.5)*innerWidth, (-v.y*0.5+0.5)*innerHeight]; }); }", pts)
                    marks[name] = {i: pr[k] for k, i in enumerate(ids)}
                await pg.screenshot(path=OUT + '/' + name + '.png', timeout=180000)
                print('shot', name, round(time.time() - ts), 's  T', T(), flush=True)
            except Exception as e:
                print('SHOTFAIL', name, str(e)[:200], flush=True)
        async def chain(tag):
            info = await pg.evaluate("() => { const L = __bw.world.ctx.wsLife; if (!L) return null; const g = {}; for (const c of L.carts) { const k = c.S.site.id + '>' + c.rt.dest + ' ' + Math.round(c.rt.len); g[k] = (g[k] || 0) + 1; } return { n: L.carts.length, g }; }")
            print('CHAIN', tag, json.dumps(info), flush=True)
        async def cart(name, pickjs):
            if ONLY and name not in ONLY.split(','): return
            pick = await pg.evaluate("() => { const L = __bw.world.ctx.wsLife; if (!L) return null; const ok = (c) => c.mode === 'w' && c.rt.dest && c.rt.len > 40; const c = (" + pickjs + "); if (!c) return null; window.__cart = c; if (!window.__fol) window.__fol = setInterval(() => { const c = window.__cart; if (c) __bw.ctl.target.set(c.x, 0, c.z); }, 40); const cc = __bw.ctl; cc.dist = 75; cc.azim = c.yaw + 0.6; return { from: c.S.site.id, to: c.rt.dest, len: Math.round(c.rt.len), x: c.x, z: c.z, mode: c.mode }; }")
            print('CART', name, pick, flush=True)
            if pick:
                await asyncio.sleep(8); await pg.screenshot(path=OUT + '/' + name + '.png', timeout=180000)
                print('CART2', name, await pg.evaluate('() => ({ x: window.__cart.x, z: window.__cart.z, mode: window.__cart.mode })'), 'T', T(), flush=True)
                await pg.evaluate('() => { window.__cart = null; }')
        # lv30
        await shot('top30', "c.target.set(0,0,0); c.dist=c.maxD; c.azim=0.6;", mark=True)
        await shot('topNE', "c.target.set(150,0,-110); c.dist=c.maxD; c.azim=0.0;", mark=True)
        for nm, sid in CLOSE: await shot(nm, close_js(sid))
        await chain('lv30')
        await cart('chain1', "L.carts.find((c) => ok(c) && c.S.site.kind === 'farm') || L.carts.find(ok)")
        await cart('chain2', "L.carts.find((c) => c.S.site.id === 'mill_00' && c.mode === 'w') || L.carts.find((c) => c.S.site.id === 'mill_00') || L.carts.find((c) => /mill/.test(c.S.site.kind) && c.rt.dest)")
        # lv10: same cameras as the lv30 frames of the same name
        await pg.evaluate('() => __bw.world.setLevel(10)'); await asyncio.sleep(30)
        await chain('lv10')
        for nm, sid in CLOSE:
            if nm in ('k_mint', 'k_refinery', 'k_sawmill', 'm_wind1', 'k_smelter', 'k_bakery'): await shot(nm + '_10', close_js(sid))
        json.dump(marks, open(OUT + '/marks2.json', 'w'))
        print('LOGS', json.dumps(logs[:20]), json.dumps(await pg.evaluate('() => window.__log.filter(x => !x.startsWith("p ")).slice(0, 10)')))
        await b.close()
asyncio.run(main())
