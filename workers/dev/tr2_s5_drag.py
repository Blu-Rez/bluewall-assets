import asyncio, sys, os, json, time, math
from playwright.async_api import async_playwright
# tr2_s5_drag.py OUTDIR — the editor driven by REAL pointer events (page.mouse): tap to pick, drag to a green spot, ✓ Place; drag onto another building = swap; ↶ Undo.  Frames: drag (ghost), placed, swapped.
# (older header follows) tr2_s5_frames.py OUTDIR [JOBS] — TR2-S5: ONE game session (844x390, lv 30, software GL ~ 3-4 min a frame).  JOBS = comma list of:
#   house   one home moved through world.layout (before / after, same camera)        store   one storehouse moved (overview before / after + a close frame at the new place)
#   hud     the game's HUD with the «Arrange» button (default camera)               editor  the editor open: green ghost + dots, red ghost + the reason, swap hint
#   numbers stage ms / draw calls / targets after the moves
OUT = sys.argv[1]; JOBS = []
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
        PROJ = """(p) => { const c = __bw.camera, e = c.projectionMatrix.elements, m = c.matrixWorldInverse.elements, x = p[0], y = p[1], z = p[2];
          const vx = m[0]*x + m[4]*y + m[8]*z + m[12], vy = m[1]*x + m[5]*y + m[9]*z + m[13], vz = m[2]*x + m[6]*y + m[10]*z + m[14], vw = m[3]*x + m[7]*y + m[11]*z + m[15];
          const cx = e[0]*vx + e[4]*vy + e[8]*vz + e[12]*vw, cy = e[1]*vx + e[5]*vy + e[9]*vz + e[13]*vw, cw = e[3]*vx + e[7]*vy + e[11]*vz + e[15]*vw;
          const r = document.querySelector('canvas').getBoundingClientRect(); return [r.left + (cx / cw + 1) / 2 * r.width, r.top + (1 - cy / cw) / 2 * r.height, cw]; }"""
        async def scr(x, z, up=3):
            return await pg.evaluate('(a) => { const H = __bw.world.ctx.height; return (%s)([a[0], H(a[0], a[1]) + a[2], a[1]]); }' % PROJ, [x, z, up])
        checks = []
        def say(ok, name, extra=''):
            checks.append(ok); print(('OK   ' if ok else 'FAIL ') + name + ('   ' + str(extra) if extra != '' else ''), flush=True)
        await pg.evaluate('() => { __bw.ctl.update = () => {}; }')
        tgt = await pg.evaluate("""() => { const L = __bw.world.layout, rs = L.visible().filter((r) => r.kind === 'cottage'); for (const r of rs) { for (let dx = -22; dx <= 22; dx += 2) for (let dz = -22; dz <= 22; dz += 2) { const pose = { x: Math.round(r.x + dx), z: Math.round(r.z + dz), ry: r.ry }; if (Math.hypot(dx, dz) > 8 && L.search(r.id, pose) && L.check(r.id, pose).ok) return { id: r.id, x: r.x, z: r.z, ry: r.ry, pose }; } } return null; }""")
        print('target', json.dumps(tgt), flush=True)
        await pg.evaluate(SET_CAM, cam_for((tgt['x'], tgt['z']), (tgt['pose']['x'], tgt['pose']['z']), 40, 34, 55)); await asyncio.sleep(2)
        await settle()
        await pg.click('button.ent'); await asyncio.sleep(1)
        say(await pg.evaluate('() => __bw.layoutUI.active'), 'the Arrange button opens the editor (real click)')
        say(await pg.evaluate("() => getComputedStyle(document.querySelector('.bw-ui')).visibility") == 'hidden', 'the game HUD is out of the way while editing')
        a = await scr(tgt['x'], tgt['z']); print('cottage on screen', a, flush=True)
        await pg.mouse.click(a[0], a[1]); await asyncio.sleep(1.5)
        sel = await pg.evaluate('() => __bw.layoutUI.state.sel && __bw.layoutUI.state.sel.id')
        say(sel == tgt['id'], 'a tap on a building picks it', sel)
        for _ in range(200):
            if await pg.evaluate('() => !__bw.layoutUI.state.spotJob'): break
            await asyncio.sleep(1)
        # drag the picked building to the free spot
        tb = await scr(tgt['pose']['x'], tgt['pose']['z']); print('target spot on screen', tb, flush=True)
        await pg.mouse.move(a[0], a[1]); await pg.mouse.down(); await asyncio.sleep(0.3)
        for k in range(1, 13):
            await pg.mouse.move(a[0] + (tb[0] - a[0]) * k / 12, a[1] + (tb[1] - a[1]) * k / 12); await asyncio.sleep(0.15)
        await asyncio.sleep(1.5)
        st = await pg.evaluate('() => { const S = __bw.layoutUI.state; return { pose: S.pose, ok: S.check && S.check.ok, why: S.check && S.check.why, drag: !!S.drag }; }'); print('mid-drag', json.dumps(st), flush=True)
        say(st['drag'] and abs(st['pose']['x'] - tgt['pose']['x']) <= 2.5 and abs(st['pose']['z'] - tgt['pose']['z']) <= 2.5, 'dragging moves the ghost to the finger (snapped to 1 m)', json.dumps(st['pose']))
        await frame('drag_ghost', 3)
        await pg.mouse.up(); await asyncio.sleep(1)
        say(await pg.evaluate("() => getComputedStyle(document.querySelector('[data-a=ok]')).display") != 'none', 'after the drop the ✓ Place / ✕ Cancel buttons are there')
        await pg.click('[data-a=ok]'); await asyncio.sleep(1)
        for _ in range(80):
            if not await pg.evaluate('() => __bw.world.layout.pending'): break
            await asyncio.sleep(1)
        rec = await pg.evaluate('(id) => { const L = __bw.world.layout, r = L.records().find((q) => q.id === id); return { count: L.count, x: r.x, z: r.z, moved: r.moved }; }', tgt['id'])
        say(rec['count'] == 1 and rec['moved'] and abs(rec['x'] - tgt['pose']['x']) < 3, '✓ Place commits it (layout count 1, the house stands at the new place)', json.dumps(rec))
        await frame('drag_placed', 3)
        # undo
        await pg.click('[data-a=undo]'); await asyncio.sleep(1)
        say(await pg.evaluate('() => __bw.world.layout.count') == 0, '↶ Undo puts it back')
        # swap: drag A onto B (a neighbouring cottage)
        sw = await pg.evaluate("""() => { const L = __bw.world.layout, rs = L.visible().filter((r) => r.kind !== 'well'); let best = null; for (const A of rs) for (const B of rs) { if (A.id >= B.id) continue; const d = Math.hypot(B.x - A.x, B.z - A.z); if (d < 10 || d > 40 || (best && best.d <= d)) continue; if (L.swapCheck(A.id, B.id).ok) best = { A: A.id, ax: A.x, az: A.z, B: B.id, bx: B.x, bz: B.z, d }; } return best; }""")
        print('swap partner', json.dumps(sw), flush=True)
        if sw:
            await pg.evaluate('(t) => { __bw.layoutUI.select(null); }', tgt)
            await pg.evaluate(SET_CAM, cam_for((sw['ax'], sw['az']), (sw['bx'], sw['bz']), 40, 34, 55)); await asyncio.sleep(2); await settle()
            a = await scr(sw['ax'], sw['az']); b2 = await scr(sw['bx'], sw['bz'])
            await pg.mouse.click(a[0], a[1]); await asyncio.sleep(1)
            for _ in range(200):
                if await pg.evaluate('() => !__bw.layoutUI.state.spotJob'): break
                await asyncio.sleep(1)
            await pg.mouse.move(a[0], a[1]); await pg.mouse.down(); await asyncio.sleep(0.3)
            for k in range(1, 13):
                await pg.mouse.move(a[0] + (b2[0] - a[0]) * k / 12, a[1] + (b2[1] - a[1]) * k / 12); await asyncio.sleep(0.15)
            await asyncio.sleep(1)
            hint = await pg.evaluate("() => document.querySelector('.bwl [data-k=why]').textContent"); print('swap hint', hint, flush=True)
            await frame('drag_swap_hover', 3)
            await pg.mouse.up(); await asyncio.sleep(1.5)
            for _ in range(80):
                if not await pg.evaluate('() => __bw.world.layout.pending'): break
                await asyncio.sleep(1)
            res = await pg.evaluate("""(a) => { const L = __bw.world.layout, A = L.records().find((r) => r.id === a.A), B = L.records().find((r) => r.id === a.B); return { count: L.count, A: [A.x, A.z], B: [B.x, B.z] }; }""", {'A': sw['A'], 'B': sw['B']})
            say(res['count'] == 2 and abs(res['A'][0] - sw['bx']) < 0.1 and abs(res['B'][0] - sw['ax']) < 0.1, 'dropping a building on another one trades their places', json.dumps(res))
            await frame('drag_swapped', 3)
        # a STORAGE yard with the real pointer (ST1 yards: hidden where they stood, drawn again in a group of their own at the new place)
        pick = None
        for sid in ['store_oil', 'store_iron', 'store_food', 'store_gold', 'store_wood']:
            f = await pg.evaluate(FIND, {'id': sid, 'R': 14, 'min': 4, 'step': 1, 'rots': [0]})
            if f['best']: pick = (sid, f); break
        print('store target', json.dumps(pick), flush=True)
        if pick:
            sid, f = pick; sx, sz = f['rec']['x'], f['rec']['z']; tx, tz = f['best']['pose']['x'], f['best']['pose']['z']
            await pg.evaluate('() => { __bw.layoutUI.select(null); }')
            await pg.evaluate(SET_CAM, cam_for((sx, sz), (tx, tz), 30, 24, 55)); await asyncio.sleep(2); await settle()
            a = await scr(sx, sz); await pg.mouse.click(a[0], a[1]); await asyncio.sleep(1.5)
            sel = await pg.evaluate('() => __bw.layoutUI.state.sel && __bw.layoutUI.state.sel.id'); say(sel == sid, 'a tap on a storehouse yard picks it', sel)
            for _ in range(200):
                if await pg.evaluate('() => !__bw.layoutUI.state.spotJob'): break
                await asyncio.sleep(1)
            tb = await scr(tx, tz); await pg.mouse.move(a[0], a[1]); await pg.mouse.down(); await asyncio.sleep(0.3)
            for k in range(1, 13):
                await pg.mouse.move(a[0] + (tb[0] - a[0]) * k / 12, a[1] + (tb[1] - a[1]) * k / 12); await asyncio.sleep(0.15)
            await asyncio.sleep(1.5)
            st = await pg.evaluate('() => { const S = __bw.layoutUI.state; return { pose: S.pose, ok: S.check && S.check.ok, why: S.check && S.check.why, drag: !!S.drag }; }'); print('store mid-drag', json.dumps(st), flush=True)
            say(st['drag'] and st['pose'] is not None and abs(st['pose']['x'] - tx) <= 3.5 and abs(st['pose']['z'] - tz) <= 3.5, 'dragging a storehouse moves the ghost to the finger', json.dumps(st['pose']))
            await frame('drag_store_ghost', 3)
            await pg.mouse.up(); await asyncio.sleep(1)
            await pg.click('[data-a=ok]'); await asyncio.sleep(1)
            for _ in range(120):
                if not await pg.evaluate('() => __bw.world.layout.pending'): break
                await asyncio.sleep(1)
            rec = await pg.evaluate('(id) => { const L = __bw.world.layout, r = L.records().find((q) => q.id === id), w = __bw.world.stores; const e = w.list.find((q) => q.id === id.slice(6)); return { count: L.count, x: r.x, z: r.z, moved: r.moved, listX: e.x, listZ: e.z, group: w.moved, meshes: w.meshes().length }; }', sid)
            say(rec['moved'] and abs(rec['x'] - tx) < 3.5 and rec['listX'] == rec['x'] and rec['listZ'] == rec['z'] and rec['group'] != '' and rec['meshes'] > 0, 'the storehouse yard stands at the new place (record, the stores list and the moved group agree)', json.dumps(rec))
            await frame('drag_store_placed', 3)
            await pg.click('[data-a=undo]'); await asyncio.sleep(1)
            for _ in range(120):
                if not await pg.evaluate('() => __bw.world.layout.pending'): break
                await asyncio.sleep(1)
            back = await pg.evaluate("() => ({ count: __bw.world.layout.count, group: __bw.world.stores.moved, meshes: __bw.world.stores.meshes().length })")
            say(back['group'] == '' and back['meshes'] == 0, '↶ Undo: the yard is back, the moved group is gone (0 extra meshes)', json.dumps(back))
        await pg.click('[data-a=done]'); await asyncio.sleep(1)
        say(not await pg.evaluate('() => __bw.layoutUI.active'), 'Done closes the editor and brings the HUD back')
        say(await pg.evaluate("() => getComputedStyle(document.querySelector('.bw-ui')).visibility") != 'hidden', 'HUD visible again')
        print('POINTER OK' if all(checks) else 'POINTER FAILED %d' % (len(checks) - sum(checks)))
        print('\n'.join(logs[:20]))
        await b.close()
asyncio.run(main())
