import asyncio, sys, os, json, time, math
from playwright.async_api import async_playwright
# tr2_s5_frames.py OUTDIR [JOBS] — TR2-S5: ONE game session (844x390, lv 30, software GL ~ 3-4 min a frame).  JOBS = comma list of:
#   house   one home moved through world.layout (before / after, same camera)        store   one storehouse moved (overview before / after + a close frame at the new place)
#   hud     the game's HUD with the «Arrange» button (default camera)               editor  the editor open: green ghost + dots, red ghost + the reason, swap hint
#   numbers stage ms / draw calls / targets after the moves
OUT = sys.argv[1]; JOBS = (sys.argv[2] if len(sys.argv) > 2 else 'hud,house,store,swap,editor,numbers').split(',')
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
        await pg.goto('http://127.0.0.1:8777/dev_s5.html?q=low&w=clear&h=22&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); const c = B.ctl; if (c.intro) c.intro = null; }')
        await asyncio.sleep(3)
        await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; __bw.ctl.update = () => {}; }")
        print('ready', T(), flush=True)
        STAT = """() => { const bw = __bw, r = bw.renderer, w = bw.world; return { calls: r.info.render.calls, tris: r.info.render.triangles, programs: r.info.programs.length, geo: r.info.memory.geometries, moved: w.stores.moved || '', movedMeshes: w.stores.meshes().length, flames: w.ctx.fx.flames.s.length }; }"""
        async def settle():
            for _ in range(200):
                if await pg.evaluate(SETTLE): break
                await asyncio.sleep(1)
        async def shot(name, cam, wait=4):
            await pg.evaluate(SET_CAM, cam); await asyncio.sleep(1); await settle(); await asyncio.sleep(wait)
            await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
            await pg.screenshot(path=f'{OUT}/{name}.png', timeout=240000); print('shot', name, T(), json.dumps(await pg.evaluate(STAT)), flush=True)
        async def pend():
            for _ in range(120):
                if not await pg.evaluate('() => __bw.world.layout.pending'): break
                await asyncio.sleep(1)
        def front(x, z, ry, k=24, up=14, fov=58): return {'cam': [x + math.sin(ry) * k, z + math.cos(ry) * k], 'camAbove': up, 'look': [x, z], 'fov': fov, 'dy': 2.5}
        iron0 = (-60, 93, 1.571); iron1 = (-144, -15, 1.571)
        await shot('night_iron_old_before', front(*iron0))
        r = await pg.evaluate("() => { const L = __bw.world.layout; return { ok: L.commit('store_iron', { x: -144, z: -15, ry: 1.571 }).ok, flames: __bw.world.ctx.fx.flames.s.length, pools: __bw.world.ctx.fx.pools.items.length }; }"); print('commit', json.dumps(r), flush=True)
        await pend()
        await shot('night_iron_old_after', front(*iron0)); await shot('night_iron_new_after', front(*iron1))
        # the flames / pools of the iron yard: where are they now?  (the lamps of the yard are the two flames nearest to its old / new door)
        r = await pg.evaluate("""() => { const fl = __bw.world.ctx.fx.flames, po = __bw.world.ctx.fx.pools, near = (x, z, R) => { let n = 0; for (let i = 0; i < fl.s.length; i++) if (Math.hypot(fl.p[i*3] - x, fl.p[i*3+2] - z) < R) n++; let m = 0; for (const it of po.items) if (Math.hypot(it.x - x, it.z - z) < R) m++; return [n, m]; }; return { oldFlamesPools: near(-60, 93, 9), newFlamesPools: near(-144, -15, 9) }; }"""); print('lamps', json.dumps(r), flush=True)
        print('\n'.join(logs[:30]))
        await b.close()
asyncio.run(main())
