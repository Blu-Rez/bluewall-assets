import asyncio, sys, os, json, time, math
from playwright.async_api import async_playwright
# tr2_s5_perf.py PAGE(s5|kit) OUTJSON  — draw calls / triangles / programs at fixed cameras (default layout; for s5 also after a house + a store were moved) and the pipeline's per-frame slices — TR2-S5: ONE game session (844x390, lv 30, software GL ~ 3-4 min a frame).  JOBS = comma list of:
#   (see tr2_s5_frames2.py)   house   one home moved through world.layout (before / after, same camera)        store   one storehouse moved (overview before / after + a close frame at the new place)
#   hud     the game's HUD with the «Arrange» button (default camera)               editor  the editor open: green ghost + dots, red ghost + the reason, swap hint
#   numbers stage ms / draw calls / targets after the moves
PAGE = sys.argv[1]; OUT = sys.argv[2]; JOBS = []

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
        await pg.goto('http://127.0.0.1:8777/dev_%s.html?q=low&w=clear&h=13&wa=0.1&lv=30' % PAGE)
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
        STAT = """() => { const r = __bw.renderer, ly = __bw.world.layout; return { calls: r.info.render.calls, tris: r.info.render.triangles, programs: r.info.programs.length, geo: r.info.memory.geometries, tex: r.info.memory.textures, layout: ly ? { count: ly.count, pending: ly.pending, last: ly.last } : null }; }"""
        await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; }")
        res = {'page': PAGE}
        async def stat(name, cam=None):
            if cam: await pg.evaluate(SET_CAM, cam); await asyncio.sleep(1)
            await settle(); await asyncio.sleep(4)
            await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
            res[name] = await pg.evaluate(STAT); print(name, json.dumps(res[name]), flush=True)
        await stat('default')
        H = (-85.62, 113.45); H2 = (-80, 81); S1 = (-77.05, -28.05); S2 = (-147, -16)
        camH = cam_for(H, H2, 62, 40); camS = cam_for(S1, S2, 55, 52)
        await pg.evaluate('() => { __bw.ctl.update = () => {}; }')
        await stat('house_cam', camH); await stat('store_cam', camS)
        ly = await pg.evaluate('() => !!__bw.world.layout')
        if ly:
            r = await pg.evaluate("() => { const L = __bw.world.layout; const a = L.commit('cottage_11', { x: -80, z: 81, ry: 2.8889 }), b = L.commit('store_wood', { x: -147, z: -16, ry: -1.5707963267948966 }); return { a, b }; }"); print('commit', json.dumps(r), flush=True)
            # let the real loop run the pipeline: one step a frame; read the slices
            for _ in range(120):
                if not await pg.evaluate('() => __bw.world.layout.pending'): break
                await asyncio.sleep(0.5)
            res['pipeline'] = await pg.evaluate("() => __bw.world.layout.last"); print('pipeline', json.dumps(res['pipeline']), flush=True)
            await stat('house_cam_moved', camH); await stat('store_cam_moved', camS)
        json.dump(res, open(OUT, 'w'), indent=1)
        print('\n'.join(logs[:20]))
        await b.close()
asyncio.run(main())
