import asyncio, sys, os, json, time, math
from playwright.async_api import async_playwright
# tr2_s5_frames.py OUTDIR [JOBS] — TR2-S5: ONE game session (844x390, lv 30, software GL ~ 3-4 min a frame).  JOBS = comma list of:
#   house   one home moved through world.layout (before / after, same camera)        store   one storehouse moved (overview before / after + a close frame at the new place)
#   hud     the game's HUD with the «Arrange» button (default camera)               editor  the editor open: green ghost + dots, red ghost + the reason, swap hint
#   numbers stage ms / draw calls / targets after the moves
OUT = sys.argv[1]; JOBS = (sys.argv[2] if len(sys.argv) > 2 else 'hud,house,store,editor,numbers').split(',')
os.makedirs(OUT, exist_ok=True)
CENTRE = (-21, -20)
SET_CAM = """(j) => { const bw = __bw, H = bw.world.ctx.height, c = bw.camera; const px = j.cam[0], pz = j.cam[1], py = H(px, pz) + j.camAbove;
  c.fov = j.fov || 55; c.updateProjectionMatrix(); c.position.set(px, py, pz); c.lookAt(j.look[0], H(j.look[0], j.look[1]) + (j.dy || 3), j.look[1]); c.updateMatrixWorld(true); return [px, py, pz]; }"""
SETTLE = '() => { const T = window.__tr2Town; if (!T) return true; T.lod(__bw.camera, null, true); const s = T.state; return s.queue.length === 0 && s.lazy.length === 0 && s.cells.every((c) => c.want !== "hi" || c.shown === "hi"); }'
FIND = """(a) => { const L = __bw.world.layout, r = L.records().find((q) => q.id === a.id), out = [];
  for (let dx = -a.R; dx <= a.R; dx += a.step) for (let dz = -a.R; dz <= a.R; dz += a.step) { const d = Math.hypot(dx, dz); if (d < a.min || d > a.R) continue;
    for (const k of a.rots) { const pose = { x: Math.round(r.x + dx), z: Math.round(r.z + dz), ry: r.ry + k * Math.PI / 12 }; if (L.search(a.id, pose) && L.check(a.id, pose).ok) out.push({ pose, d }); } }
  out.sort((p, q) => q.d - p.d); return { rec: { x: r.x, z: r.z, ry: r.ry }, n: out.length, best: out[0] || null, near: out.slice(-1)[0] || null }; }"""
def cam_for(a, b, back=62, above=46, fov=52):                  # a camera on the town side of the two points, looking at their middle
    mx, mz = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2; dx, dz = CENTRE[0] - mx, CENTRE[1] - mz; dl = math.hypot(dx, dz) or 1
    sp = math.hypot(a[0] - b[0], a[1] - b[1])
    return {'cam': [mx + dx / dl * (back + sp * 0.5), mz + dz / dl * (back + sp * 0.5)], 'camAbove': above + sp * 0.35, 'look': [mx, mz], 'fov': fov}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type in ('error', 'warning') and '404' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:8777/dev_s5.html?q=low&w=clear&h=13&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); const c = B.ctl; if (c.intro) c.intro = null; }')
        await asyncio.sleep(3)
        print('ready', T(), flush=True)
        async def settle():
            for _ in range(200):
                if await pg.evaluate(SETTLE): break
                await asyncio.sleep(1)
        async def frame(name, wait=5):
            await settle(); await asyncio.sleep(wait)
            await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
            await pg.screenshot(path=f'{OUT}/{name}.png', timeout=240000); print('shot', name, T(), flush=True)
        async def shot(name, cam, wait=5):
            await pg.evaluate(SET_CAM, cam); await asyncio.sleep(1); await frame(name, wait)
        STAT = """() => { const bw = __bw, r = bw.renderer, w = bw.world, ly = w.layout; return { calls: r.info.render.calls, tris: r.info.render.triangles, programs: r.info.programs.length, geo: r.info.memory.geometries, tex: r.info.memory.textures,
          targets: w.targets.length, off: w.ctx.targets.filter((t) => t.off).length, layout: ly && { rev: ly.rev, count: ly.count, pending: ly.pending, last: ly.last } }; }"""
        async def drain():
            for _ in range(80):
                if not await pg.evaluate('() => __bw.world.layout.pending'): break
                await asyncio.sleep(1)
            await settle()
        await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; }")
        await pg.evaluate('() => { __bw.ctl.update = () => {}; }')
        if 'store' in JOBS:
            f = await pg.evaluate(FIND, {'id': 'store_wood', 'R': 110, 'min': 12, 'step': 2, 'rots': [0, 6, 12, 18]}); print('find store', json.dumps(f), flush=True)
            if f['best']:
                a, c = (f['rec']['x'], f['rec']['z']), (f['best']['pose']['x'], f['best']['pose']['z']); mode = 'free'
                cam = cam_for(a, c, 55, 52)
                cam2 = {'cam': [c[0] + (CENTRE[0] - c[0]) * 0.18, c[1] + (CENTRE[1] - c[1]) * 0.18], 'camAbove': 17, 'look': [c[0], c[1]], 'fov': 58}
                act = "() => __bw.world.layout.commit('store_wood', %s)" % json.dumps(f['best']['pose'])
            else:
                sw = await pg.evaluate("() => { const L = __bw.world.layout, R = L.records(), w = R.find((r) => r.id === 'store_wood'); for (const o of ['store_stone', 'store_oil', 'store_food', 'store_iron', 'store_gold']) { const c = L.swapCheck('store_wood', o), b = R.find((r) => r.id === o); if (c.ok) return { other: o, a: [w.x, w.z], b: [b.x, b.z] }; } return null; }")
                print('store swap fallback', json.dumps(sw), flush=True); mode = 'swap'
                a, c = tuple(sw['a']), tuple(sw['b']); cam = cam_for(a, c, 55, 52); cam2 = {'cam': [c[0] + (CENTRE[0] - c[0]) * 0.18, c[1] + (CENTRE[1] - c[1]) * 0.18], 'camAbove': 17, 'look': [c[0], c[1]], 'fov': 58}
                act = "() => __bw.world.layout.swap('store_wood', '%s')" % sw['other']
            await shot('store_before', cam); await shot('store_new_before', cam2)
            print('stat0', json.dumps(await pg.evaluate(STAT)), flush=True)
            r = await pg.evaluate("(code) => { const t0 = performance.now(); const o = eval(code)(); return { o, commitMs: +(performance.now() - t0).toFixed(2) }; }", act); print('commit store', mode, json.dumps(r), flush=True)
            await drain(); print('stat1', json.dumps(await pg.evaluate(STAT)), flush=True)
            await shot('store_after', cam); await shot('store_new_after', cam2)
            print('stores now', json.dumps(await pg.evaluate("() => __bw.world.stores.list.map((s) => [s.id, +s.x.toFixed(1), +s.z.toFixed(1)])")), flush=True)
            await pg.evaluate("() => { __bw.world.layout.resetAll(); }"); await drain()
        if 'editor' in JOBS:
            await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = ''; }")
            ok = await pg.evaluate('() => { const e = __bw.layoutUI; e.open(); return e.active; }'); print('editor open', ok, flush=True)
            tgt = await pg.evaluate("""() => { const L = __bw.world.layout, rs = L.visible().filter((r) => r.kind === 'cottage'); for (const r of rs) { for (let dx = -22; dx <= 22; dx += 2) for (let dz = -22; dz <= 22; dz += 2) { const pose = { x: Math.round(r.x + dx), z: Math.round(r.z + dz), ry: r.ry }; if (Math.hypot(dx, dz) > 8 && L.search(r.id, pose) && L.check(r.id, pose).ok) return { id: r.id, x: r.x, z: r.z, ry: r.ry, pose }; } } return null; }""")
            print('editor target', json.dumps(tgt), flush=True)
            if tgt:
                cam = cam_for((tgt['x'], tgt['z']), (tgt['pose']['x'], tgt['pose']['z']), 40, 34, 55)
                await pg.evaluate(SET_CAM, cam); await asyncio.sleep(1)
                await pg.evaluate('(t) => { const e = __bw.layoutUI; e.select(t.id); }', tgt)
                for _ in range(200):
                    if await pg.evaluate('() => !__bw.layoutUI.state.spotJob'): break
                    await asyncio.sleep(1)
                print('dots', await pg.evaluate('() => __bw.layoutUI.dotCount'), flush=True)
                await frame('editor_selected_dots', 6)
                await pg.evaluate('(t) => { __bw.layoutUI.setPose(t.pose); }', tgt); await frame('editor_ghost_ok', 4)
                bad = await pg.evaluate("""(t) => { const L = __bw.world.layout, o = L.visible().find((r) => r.id !== t.id && Math.hypot(r.x - t.x, r.z - t.z) < 22 && r.kind !== 'store'); return o ? { x: o.x + 1, z: o.z, ry: t.ry } : null; }""", tgt)
                print('bad pose', json.dumps(bad), flush=True)
                if bad:
                    await pg.evaluate('(p) => { __bw.layoutUI.setPose(p); }', bad); await frame('editor_ghost_red', 4)
            # a storehouse in the editor: its footprint is the big one
            sp = await pg.evaluate("""() => { const L = __bw.world.layout, w = L.records().find((r) => r.id === 'store_wood'); return { x: w.x, z: w.z, ry: w.ry }; }""")
            await pg.evaluate('() => { __bw.layoutUI.select(null); }')
            cam3 = {'cam': [sp['x'] + (CENTRE[0] - sp['x']) * 0.22, sp['z'] + (CENTRE[1] - sp['z']) * 0.22], 'camAbove': 36, 'look': [sp['x'], sp['z']], 'fov': 55}
            await pg.evaluate(SET_CAM, cam3); await asyncio.sleep(1)
            await pg.evaluate("() => { __bw.layoutUI.select('store_wood'); }")
            for _ in range(200):
                if await pg.evaluate('() => !__bw.layoutUI.state.spotJob'): break
                await asyncio.sleep(1)
            print('store dots', await pg.evaluate('() => __bw.layoutUI.dotCount'), flush=True)
            await frame('editor_store_selected', 5)
            await pg.evaluate("() => { const e = __bw.layoutUI; e.setPose({ ry: e.state.pose.ry + 0.5236 }); }"); await frame('editor_store_turn', 4)
        if 'viewports' in JOBS:                                  # the editor at the other phone sizes (800x360, 932x430): the buttons must not collide with anything
            await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = ''; const e = __bw.layoutUI; if (!e.active) e.open(); e.select(null); }")
            tgt = await pg.evaluate("""() => { const L = __bw.world.layout, rs = L.visible().filter((r) => r.kind === 'cottage'); for (const r of rs) { for (let dx = -22; dx <= 22; dx += 2) for (let dz = -22; dz <= 22; dz += 2) { const pose = { x: Math.round(r.x + dx), z: Math.round(r.z + dz), ry: r.ry }; if (Math.hypot(dx, dz) > 8 && L.search(r.id, pose) && L.check(r.id, pose).ok) return { id: r.id, x: r.x, z: r.z, ry: r.ry, pose }; } } return null; }""")
            for (w, h) in ((800, 360), (932, 430)):
                await pg.set_viewport_size({'width': w, 'height': h}); await asyncio.sleep(4)
                await pg.evaluate(SET_CAM, cam_for((tgt['x'], tgt['z']), (tgt['pose']['x'], tgt['pose']['z']), 40, 34, 55)); await asyncio.sleep(1)
                await pg.evaluate('(t) => { const e = __bw.layoutUI; e.select(t.id); e.setPose(t.pose); }', tgt)
                for _ in range(200):
                    if await pg.evaluate('() => !__bw.layoutUI.state.spotJob'): break
                    await asyncio.sleep(1)
                await frame('editor_%dx%d' % (w, h), 5)
                await pg.evaluate("() => { __bw.layoutUI.select(null); }")
            await pg.set_viewport_size({'width': 844, 'height': 390}); await asyncio.sleep(3)
        if 'tg' in JOBS:                                         # Telegram fullscreen: the header (Close / ⌄ ⋮) sits above the page: --tg-* insets (simulated: 52 px top, 6 px bottom) — the editor's buttons must stay below / above them
            await pg.evaluate("() => { const r = document.documentElement.style; r.setProperty('--tg-safe-area-inset-top', '0px'); r.setProperty('--tg-content-safe-area-inset-top', '52px'); r.setProperty('--tg-safe-area-inset-bottom', '6px'); const u = document.querySelector('.bw-ui'); if (u) u.style.display = ''; const e = __bw.layoutUI; if (e.active) e.close(); }")
            tgt = await pg.evaluate("""() => { const L = __bw.world.layout, rs = L.visible().filter((r) => r.kind === 'cottage'); for (const r of rs) { for (let dx = -22; dx <= 22; dx += 2) for (let dz = -22; dz <= 22; dz += 2) { const pose = { x: Math.round(r.x + dx), z: Math.round(r.z + dz), ry: r.ry }; if (Math.hypot(dx, dz) > 8 && L.search(r.id, pose) && L.check(r.id, pose).ok) return { id: r.id, x: r.x, z: r.z, ry: r.ry, pose }; } } return null; }""")
            await pg.evaluate(SET_CAM, cam_for((tgt['x'], tgt['z']), (tgt['pose']['x'], tgt['pose']['z']), 40, 34, 55)); await asyncio.sleep(1)
            await frame('hud_tg', 3)
            await pg.evaluate("() => { __bw.layoutUI.open(); }"); await pg.evaluate('(t) => { const e = __bw.layoutUI; e.select(t.id); e.setPose(t.pose); }', tgt)
            for _ in range(200):
                if await pg.evaluate('() => !__bw.layoutUI.state.spotJob'): break
                await asyncio.sleep(1)
            await frame('editor_tg', 4)
        if 'numbers' in JOBS:
            print('stat2', json.dumps(await pg.evaluate(STAT)), flush=True)
        print('\n'.join(logs[:30]))
        await b.close()
asyncio.run(main())
