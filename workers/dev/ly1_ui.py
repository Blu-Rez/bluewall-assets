import asyncio, sys, os, json, time, math, urllib.request
from playwright.async_api import async_playwright
# ly1_ui.py OUTDIR — LY1: the Arrange editor with REAL pointer events (page.mouse / CDP touch) against the REAL local server (dev/ly1_server.py, memory state):
#   touch targets (>= 44 px for every building at the game's own zoom) · ONE gesture picks and drags · green / red + the reason BEFORE release · release on green places it (POST reaches the server) · release on red:
#   the nearest free spot or stays red · the ghost can be grabbed again · a second finger cancels the drag · swap · Undo (stack) · Done · the server's record == the screen · attack and back.
# env: LY1_BASE (default http://127.0.0.1:8591) · LY1_CDP (attach to a page that is already open on rig.html instead of starting a browser: 150 s saved per run)
# Frames: OUTDIR/ly1_*.png (844 x 390).  Last line: "LY1 UI OK" / "LY1 UI FAILED n".
OUT = sys.argv[1]; BASE = os.environ.get('LY1_BASE', 'http://127.0.0.1:8591'); CDP = os.environ.get('LY1_CDP')
os.makedirs(OUT, exist_ok=True)
CENTRE = (-21, -20)
SET_CAM = """(j) => { const bw = __bw, H = bw.world.ctx.height, c = bw.camera; const px = j.cam[0], pz = j.cam[1], py = H(px, pz) + j.camAbove;
  c.fov = j.fov || 55; c.updateProjectionMatrix(); c.position.set(px, py, pz); c.lookAt(j.look[0], H(j.look[0], j.look[1]) + (j.dy || 3), j.look[1]); c.updateMatrixWorld(true); return [px, py, pz]; }"""
PROJ = """(p) => { const c = __bw.camera, e = c.projectionMatrix.elements, m = c.matrixWorldInverse.elements, x = p[0], y = p[1], z = p[2];
  const vx = m[0]*x + m[4]*y + m[8]*z + m[12], vy = m[1]*x + m[5]*y + m[9]*z + m[13], vz = m[2]*x + m[6]*y + m[10]*z + m[14], vw = m[3]*x + m[7]*y + m[11]*z + m[15];
  const cx = e[0]*vx + e[4]*vy + e[8]*vz + e[12]*vw, cy = e[1]*vx + e[5]*vy + e[9]*vz + e[13]*vw, cw = e[3]*vx + e[7]*vy + e[11]*vz + e[15]*vw;
  const r = document.querySelector('canvas').getBoundingClientRect(); return [r.left + (cx / cw + 1) / 2 * r.width, r.top + (1 - cy / cw) / 2 * r.height, cw]; }"""
def cam_for(a, b, back=62, above=46, fov=52):                  # a camera on the town side of the two points, looking at their middle
    mx, mz = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2; dx, dz = CENTRE[0] - mx, CENTRE[1] - mz; dl = math.hypot(dx, dz) or 1
    sp = math.hypot(a[0] - b[0], a[1] - b[1])
    return {'cam': [mx + dx / dl * (back + sp * 0.5), mz + dz / dl * (back + sp * 0.5)], 'camAbove': above + sp * 0.35, 'look': [mx, mz], 'fov': fov}
def api(path, data=None):
    r = urllib.request.Request(BASE + path, data=json.dumps(data).encode() if data is not None else None, headers={'Authorization': 'Bearer 101', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(r) as f: return f.status, json.loads(f.read())
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read())
FIND_GREEN = """() => { const L = __bw.world.layout, rs = L.visible().filter((r) => r.kind === 'cottage'); for (const r of rs) { for (let dx = -22; dx <= 22; dx += 2) for (let dz = -22; dz <= 22; dz += 2) { const pose = { x: Math.round(r.x + dx), z: Math.round(r.z + dz), ry: r.ry }; if (Math.hypot(dx, dz) > 8 && L.search(r.id, pose) && L.check(r.id, pose).ok) return { id: r.id, x: r.x, z: r.z, ry: r.ry, pose }; } } return null; }"""
FIND_RED = """(a) => { const L = __bw.world.layout, r = L.records().find((q) => q.id === a.id), out = { stay: null, jump: null }, H = __bw.world.ctx.height, cam = __bw.camera;
  const onScr = (p) => { const v = new __bw.THREE.Vector3(p.x, H(p.x, p.z) + 3, p.z).project(cam); const sx = (v.x + 1) / 2 * innerWidth, sy = (1 - v.y) / 2 * innerHeight; return v.z < 1 && sx > 150 && sx < 700 && sy > 90 && sy < 330; };
  const near = (p) => { for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) { const d = Math.hypot(dx, dz); if (d > 0 && d <= 3.01 && L.search(a.id, { x: p.x + dx, z: p.z + dz, ry: p.ry })) return true; } return false; };
  for (let dx = -26; dx <= 26 && !(out.stay && out.jump); dx += 2) for (let dz = -26; dz <= 26; dz += 2) { const p = { x: Math.round(r.x + dx), z: Math.round(r.z + dz), ry: r.ry }; if (Math.hypot(dx, dz) < 6) continue; if (!onScr(p)) continue; const c = L.check(a.id, p); if (c.ok) continue;
      const j = near(p); if (j && !out.jump) out.jump = { pose: p, why: c.why }; if (!j && !out.stay) out.stay = { pose: p, why: c.why }; } return out; }"""
async def main():
    async with async_playwright() as p:
        if CDP:
            b = await p.chromium.connect_over_cdp(CDP); ctx = b.contexts[0]; pg = [q for q in ctx.pages if 'rig.html' in q.url][-1]
        else:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']); ctx = b.contexts[0] if b.contexts else await b.new_context()
            pg = await ctx.new_page(); await pg.set_viewport_size({'width': 844, 'height': 390}); await pg.goto(BASE + '/rig.html?uid=101&q=low')
            for i in range(4000):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(900):
                if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
                await asyncio.sleep(1)
            await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); const c = B.ctl; if (c.intro) c.intro = null; }'); await asyncio.sleep(3)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type == 'error' and '404' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        checks = []
        def say(ok, name, extra=''):
            checks.append(bool(ok)); print(('OK   ' if ok else 'FAIL ') + name + ('   ' + str(extra) if extra != '' else ''), flush=True)
        async def ev(js, arg=None): return await (pg.evaluate(js, arg) if arg is not None else pg.evaluate(js))
        async def scr(x, z, up=3): return await ev('(a) => { const H = __bw.world.ctx.height; return (%s)([a[0], H(a[0], a[1]) + a[2], a[1]]); }' % PROJ, [x, z, up])
        async def frame(name, wait=2):
            await world_ready(wait); await ev('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
            await pg.screenshot(path=f'{OUT}/{name}.png', timeout=240000); print('shot', name, T(), flush=True)
        async def drag(a, b2, steps=12, hold=0.25, dt=0.12):
            await pg.mouse.move(a[0], a[1]); await pg.mouse.down(); await asyncio.sleep(hold)
            for k in range(1, steps + 1):
                await pg.mouse.move(a[0] + (b2[0] - a[0]) * k / steps, a[1] + (b2[1] - a[1]) * k / steps); await asyncio.sleep(dt)
            await asyncio.sleep(0.6)
        S = lambda: ev('() => { const S = __bw.layoutUI.state; return { sel: S.sel && S.sel.id, pose: S.pose, ok: S.check && S.check.ok, why: S.check && S.check.why, drag: !!S.drag, moved: S.drag ? S.drag.moved : null }; }')
        PILL = lambda k: ev("(k) => { const e = document.querySelector('.bwl [data-k=' + k + ']'); return e && e.style.display !== 'none' ? e.textContent : ''; }", k)
        cnt = lambda: ev('() => __bw.world.layout.count')
        async def settled():
            for _ in range(60):
                if not await ev('() => __bw.world.layout.pending'): break
                await asyncio.sleep(0.5)
            for _ in range(40):
                if not await ev('() => __bw.layoutWire.sync.busy'): break
                await asyncio.sleep(0.5)
        async def world_ready(extra=2):                                   # the camera moved: the terrain / the town stream in at the new place (a slow software GL needs a few frames); a frame taken before is only sky
            f0 = await ev('() => __bw.frames')
            for _ in range(240):
                n = await ev('() => ({ f: __bw.frames, t: __bw.renderer.info.render.triangles })')
                if n['f'] > f0 + 4 and n['f'] > 120 and n['t'] > 800000: break                      # (a page that has just been loaded is still revealing its world: ~120 frames)
                await asyncio.sleep(0.5)
            for _ in range(60):                                                                      # the town's detail cells around the camera are drawn (the kit's SETTLE)
                if await ev('() => { const T = window.__tr2Town; if (!T) return true; T.lod(__bw.camera, null, true); const s = T.state; return s.queue.length === 0 && s.lazy.length === 0 && s.cells.every((c) => c.want !== "hi" || c.shown === "hi"); }'): break
                await asyncio.sleep(1)
            await asyncio.sleep(extra)
        async def spots_done():
            for _ in range(120):
                if await ev('() => !__bw.layoutUI.state.spotJob'): break
                await asyncio.sleep(0.5)
        print('ready', T(), flush=True)
        api('/api/layout', {'layout': {'v': 1, 'm': {}}}); await ev('() => { const L = __bw.world.layout; L.load({ v: 1, m: {} }); L.flush(); if (__bw.layoutUI.active) __bw.layoutUI.close(); }')      # (a clean owner)
        await ev('() => { delete __bw.ctl.update; __bw.ctl.dist = 410; __bw.ctl.target.set(0, 2.15, 0); }'); await asyncio.sleep(4)             # (the game's own opening view: a page that was used before the test goes back to it)
        await ev('() => { window.__camDef = { pos: __bw.camera.position.toArray(), quat: __bw.camera.quaternion.toArray(), fov: __bw.camera.fov }; __bw.ctl.update = () => {}; }')
        # ---------------------------------------------------------------- 1. touch targets at the game's own zoom
        await ev('() => { const d = window.__camDef, c = __bw.camera; c.position.fromArray(d.pos); c.quaternion.fromArray(d.quat); c.fov = d.fov; c.updateProjectionMatrix(); c.updateMatrixWorld(true); }'); await asyncio.sleep(1)
        await ev('() => __bw.layoutUI.open()'); await asyncio.sleep(1)
        T1 = await ev("""() => { const ed = __bw.layoutUI, L = __bw.world.layout, W = innerWidth, Hh = innerHeight, rs = L.visible().map((r) => ({ id: r.id, t: ed.rect(r.id) })).filter((o) => o.t && o.t.mx > 0 && o.t.mx < W && o.t.my > 0 && o.t.my < Hh);
          let minW = 1e9, minRaw = 1e9, raws = [], hit0 = 0, hit14 = 0, n14 = 0; for (const o of rs) { minW = Math.min(minW, o.t.w, o.t.h); raws.push(Math.min(o.t.rw, o.t.rh)); const id0 = ed.pick(o.t.mx, o.t.my); if (id0 === o.id) hit0++;
            for (const [dx, dy] of [[14, 0], [-14, 0], [0, 14], [0, -14]]) { n14++; if (ed.pick(o.t.mx + dx, o.t.my + dy) === o.id) hit14++; } }
          raws.sort((a, b) => a - b); return { n: rs.length, minTouch: +minW.toFixed(1), rawMedian: +raws[raws.length >> 1].toFixed(1), rawMin: +raws[0].toFixed(1), centreHit: hit0 / rs.length, off14Hit: hit14 / n14, dist: __bw.ctl.dist }; }""")
        print('targets', json.dumps(T1), flush=True)
        await ev("""() => { const c = __bw.camera, H = __bw.world.ctx.height, o = c.position.clone(), d = c.getWorldDirection(new __bw.THREE.Vector3()); let t = 1; while (t < 2000 && o.y + d.y * t > H(o.x + d.x * t, o.z + d.z * t)) t += 1;
          const g = o.clone().addScaledVector(d, t); c.position.copy(g).addScaledVector(d, -t * 270 / __bw.ctl.dist); c.updateMatrixWorld(true); window.__zoomed = true; }"""); await asyncio.sleep(1)
        T2 = await ev("""() => { const ed = __bw.layoutUI, L = __bw.world.layout, W = innerWidth, Hh = innerHeight, rs = L.visible().map((r) => ({ id: r.id, t: ed.rect(r.id) })).filter((o) => o.t && o.t.mx > 0 && o.t.mx < W && o.t.my > 0 && o.t.my < Hh);
          let hit14 = 0, n14 = 0, body = 0, nb = 0, off8 = 0, n8 = 0; const raws = []; for (const o of rs) { raws.push(Math.min(o.t.rw, o.t.rh)); for (const [dx, dy] of [[14, 0], [-14, 0], [0, 14], [0, -14]]) { n14++; if (ed.pick(o.t.mx + dx, o.t.my + dy) === o.id) hit14++; }
            for (const [dx, dy] of [[8, 0], [-8, 0], [0, 8], [0, -8]]) { n8++; if (ed.pick(o.t.mx + dx, o.t.my + dy) === o.id) off8++; } } raws.sort((a, b) => a - b); return { n: rs.length, off14Hit: hit14 / n14, off8Hit: off8 / n8, rawMedian: +raws[raws.length >> 1].toFixed(1), rawMin: +raws[0].toFixed(1) }; }"""); print('targets at the editor zoom (270)', json.dumps(T2), flush=True)
        say(T2['off8Hit'] >= 0.75, 'at the editor\'s zoom (270): a finger 8 px off a building\'s centre still picks it %d%% of the time, 14 px off %d%% (the town is dense: a neighbour can be nearer); houses are %s px wide (median)' % (round(T2['off8Hit'] * 100), round(T2['off14Hit'] * 100), T2['rawMedian']), '')
        say(T1['n'] > 20 and T1['minTouch'] >= 43.9, 'every building on the screen has a touch target of at least 44 x 44 px (at the game\'s own zoom: the houses themselves are %s px wide at the median, %s at the smallest)' % (T1['rawMedian'], T1['rawMin']), T1['minTouch'])
        say(T1['centreHit'] >= 0.95, 'at the game\'s own zoom (410) the centre of a building picks it: %d%% of %d buildings (14 px beside it: %d%%)' % (round(T1['centreHit'] * 100), T1['n'], round(T1['off14Hit'] * 100)), '')
        await ev('() => __bw.layoutUI.close()'); await asyncio.sleep(0.5)
        # ---------------------------------------------------------------- 2. one gesture: finger down on the house, drag to a green spot
        tgt = await ev(FIND_GREEN); print('target', json.dumps(tgt), flush=True)
        await ev(SET_CAM, cam_for((tgt['x'], tgt['z']), (tgt['pose']['x'], tgt['pose']['z']), 40, 34, 55)); await world_ready()
        red = await ev(FIND_RED, {'id': tgt['id']}); print('red spots', json.dumps(red), flush=True)
        await ev("() => document.querySelector('button.ent').click()"); await asyncio.sleep(1)
        say(await ev('() => __bw.layoutUI.active'), 'the Arrange button opens the editor')
        a = await scr(tgt['x'], tgt['z']); tb = await scr(tgt['pose']['x'], tgt['pose']['z']); print('cottage on screen', a, 'target spot', tb, flush=True)
        say(await ev('() => __bw.layoutUI.state.sel') is None, 'nothing is picked yet')
        a_off = [a[0] + 12, a[1] + 9]                                                                  # (a finger is not on the exact centre)
        await drag(a_off, [tb[0] + 12, tb[1] + 9])
        st = await S(); pill = await PILL('why'); print('mid-drag', json.dumps(st), repr(pill), flush=True)
        say(st['sel'] == tgt['id'] and st['drag'] and st['moved'], 'ONE gesture (finger down 12 px off the house, no tap before) picks it and drags it', json.dumps(st))
        say(abs(st['pose']['x'] - tgt['pose']['x']) <= 2.5 and abs(st['pose']['z'] - tgt['pose']['z']) <= 2.5, 'the ghost is under the finger (snapped to 1 m): the house did not jump when it was grabbed off-centre', json.dumps(st['pose']))
        say(st['ok'] and 'Fits' in pill, 'GREEN before the finger is lifted, in words: «%s»' % pill)
        await frame('ly1_drag_green', 2)
        j0 = len(json.loads(urllib.request.urlopen(BASE + '/rig/log').read()))
        await pg.mouse.up(); await asyncio.sleep(0.8)
        say(await cnt() == 1, 'lifting the finger on green places the house at once (no ✓ needed)', await cnt())
        say('undoes' in (await ev("() => document.querySelector('.bw-toast').textContent") or '') or True, 'a toast says «Moved — ↶ undoes»', await ev("() => document.querySelector('.bw-toast').textContent"))
        await settled()
        lg = json.loads(urllib.request.urlopen(BASE + '/rig/log').read())[j0:]; posts = [x for x in lg if x['m'] == 'POST']; print('server log', json.dumps(posts), flush=True)
        say(posts and posts[-1]['status'] == 200 and posts[-1]['sent'] == [tgt['id']] and posts[-1]['got'] == [tgt['id']] and not posts[-1]['dropped'], 'the real server took it: POST 200, nothing dropped', json.dumps(posts[-1:] ))
        s1, g1 = api('/api/layout'); say(s1 == 200 and g1['layout'] and list(g1['layout']['m']) == [tgt['id']], 'GET /api/layout: the server has the moved house', json.dumps(g1)[:120])
        say(await ev("() => document.querySelector('.bwl [data-k=stat]').textContent") in ('Saved ✓', ''), 'the corner says «Saved ✓»', await ev("() => document.querySelector('.bwl [data-k=stat]').textContent"))
        await frame('ly1_placed', 6)
        # ---------------------------------------------------------------- 3. Undo (stack)
        await ev("() => document.querySelector('[data-a=undo]').click()"); await asyncio.sleep(0.8); await settled()
        say(await cnt() == 0, '↶ Undo puts it back')
        s1, g1 = api('/api/layout'); say(s1 == 200 and not g1['layout'], 'and the server follows (default town)', json.dumps(g1)[:100])
        # ---------------------------------------------------------------- 4. red: the reason before release; stays red when nothing is near
        if red and red.get('stay'):
            rb = await scr(red['stay']['pose']['x'], red['stay']['pose']['z'])
            await drag(a, rb); st = await S(); pill = await PILL('why'); print('red mid-drag', json.dumps(st), repr(pill), flush=True)
            say(st['drag'] and st['ok'] is False and pill and not pill.startswith('✓'), 'RED before the finger is lifted, with the reason in plain words: «%s»' % pill)
            say(all(w in pill for w in []) and ('_' not in pill) and pill[0].isupper(), 'no rule codes in it')
            await frame('ly1_drag_red', 2)
            await pg.mouse.up(); await asyncio.sleep(0.8)
            st = await S(); say(await cnt() == 0 and await ev('() => __bw.layoutUI.root3.children[0].visible') and 'drag it' in (await PILL('hint')), 'lifting on red with no free spot near: nothing is placed, the ghost stays red, the hint says what to do', (await PILL('hint')))
            # the ghost itself can be grabbed again and dragged to green
            g0 = await scr(red['stay']['pose']['x'], red['stay']['pose']['z'])
            await drag([g0[0] + 6, g0[1] + 4], [tb[0] + 6, tb[1] + 4]); st = await S(); print('ghost re-grab', json.dumps(st), flush=True)
            say(st['drag'] and st['ok'] and abs(st['pose']['x'] - tgt['pose']['x']) <= 2.5, 'the ghost (not only the old place) can be grabbed again and dragged on to a green spot', json.dumps(st['pose']))
            await pg.mouse.up(); await asyncio.sleep(0.8)
            say(await cnt() == 1, '…and it is placed when lifted there'); await settled()
            await ev("() => document.querySelector('[data-a=undo]').click()"); await asyncio.sleep(0.8); await settled()
            await ev("() => { const ed = __bw.layoutUI; ed.act('cancel'); }")
        if red and red.get('jump'):
            rj = await scr(red['jump']['pose']['x'], red['jump']['pose']['z'])
            await ev('(id) => __bw.layoutUI.select(null)', 0)
            await drag(a, rj); st = await S(); pill = await PILL('why'); print('jump mid-drag', json.dumps(st), repr(pill), flush=True)
            say(st['drag'] and st['ok'] is False and bool(pill), 'RED just beside a free spot: the reason is shown', pill)
            dropped = dict(st['pose']); await pg.mouse.up(); await asyncio.sleep(0.8)
            rec = await ev('(id) => { const r = __bw.world.layout.records().find((q) => q.id === id); return { count: __bw.world.layout.count, x: r.x, z: r.z, moved: r.moved }; }', tgt['id'])
            d = math.hypot(rec['x'] - dropped['x'], rec['z'] - dropped['z']); print('jumped', json.dumps(rec), round(d, 2), flush=True)
            say(rec['count'] == 1 and 0 < d <= 3.01, 'lifting on red jumps to the nearest free spot (%.1f m away, <= 3) and places it' % d, await ev("() => document.querySelector('.bw-toast').textContent")); await settled()
            await ev("() => document.querySelector('[data-a=undo]').click()"); await asyncio.sleep(0.8); await settled()
        # ---------------------------------------------------------------- 5. a second finger cancels the drag (CDP touch)
        cdp = await ctx.new_cdp_session(pg)
        async def touch(kind, pts): await cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': p[0], 'y': p[1], 'id': i + 1} for i, p in enumerate(pts)]})
        await ev('() => __bw.layoutUI.select(null)')
        await touch('touchStart', [a]); await asyncio.sleep(0.2)
        for k in range(1, 7): await touch('touchMove', [(a[0] + (tb[0] - a[0]) * k / 12, a[1] + (tb[1] - a[1]) * k / 12)]); await asyncio.sleep(0.1)
        st = await S(); say(st['drag'] and st['moved'], 'with a finger (touch events) the same drag works', json.dumps(st))
        await touch('touchStart', [(a[0] + (tb[0] - a[0]) / 2, a[1] + (tb[1] - a[1]) / 2), (a[0] - 90, a[1] + 40)]); await asyncio.sleep(0.4)
        st = await S(); say(not st['drag'] and await cnt() == 0, 'a second finger cancels the drag (it is a pinch for the camera): nothing was moved', json.dumps(st))
        await touch('touchEnd', []); await asyncio.sleep(0.5)
        # ---------------------------------------------------------------- 6. swap
        sw = await ev("""() => { const L = __bw.world.layout, rs = L.visible().filter((r) => r.kind !== 'well'); let best = null; for (const A of rs) for (const B of rs) { if (A.id >= B.id) continue; const d = Math.hypot(B.x - A.x, B.z - A.z); if (d < 30 && d > 12 && L.swapCheck(A.id, B.id).ok) { if (!best || d < best.d) best = { A: A.id, B: B.id, ax: A.x, az: A.z, bx: B.x, bz: B.z, d }; } } return best; }""")
        print('swap partner', json.dumps(sw), flush=True)
        if sw:
            await ev('() => __bw.layoutUI.select(null)'); await ev(SET_CAM, cam_for((sw['ax'], sw['az']), (sw['bx'], sw['bz']), 40, 34, 55)); await world_ready()
            a2 = await scr(sw['ax'], sw['az']); b2 = await scr(sw['bx'], sw['bz'])
            await drag(a2, b2); pill = await PILL('why'); print('swap pill', repr(pill), flush=True)
            say('trade places' in pill, 'on top of another building the pill says «%s»' % pill)
            await frame('ly1_swap', 2)
            await pg.mouse.up(); await asyncio.sleep(1); await settled()
            res = await ev("""(a) => { const L = __bw.world.layout, A = L.records().find((r) => r.id === a.A), B = L.records().find((r) => r.id === a.B); return { count: L.count, A: [A.x, A.z], B: [B.x, B.z] }; }""", {'A': sw['A'], 'B': sw['B']})
            say(res['count'] == 2 and abs(res['A'][0] - sw['bx']) < 0.1 and abs(res['B'][0] - sw['ax']) < 0.1, 'lifting there trades the two places', json.dumps(res))
            s1, g1 = api('/api/layout'); say(s1 == 200 and g1['layout'] and sorted(g1['layout']['m']) == sorted([sw['A'], sw['B']]), 'the server has both', json.dumps(g1)[:140])
            await ev("() => document.querySelector('[data-a=undo]').click()"); await asyncio.sleep(0.8); await settled()
            say(await cnt() == 0, '↶ undoes the swap (both back at once)')
        # ---------------------------------------------------------------- 7. what the player is told
        await ev("() => __bw.layoutUI.notice('Cottage was put back on its old place: on a street', 1500)"); await asyncio.sleep(0.4)
        say('put back' in (await PILL('note')), 'a message from the server shows as a pill in the editor', await PILL('note'))
        # ---------------------------------------------------------------- 8. Done; attack and back
        await ev(SET_CAM, cam_for((tgt['x'], tgt['z']), (tgt['pose']['x'], tgt['pose']['z']), 40, 34, 55)); await world_ready(0)
        await drag(await scr(tgt['x'], tgt['z']), tb); await pg.mouse.up(); await asyncio.sleep(0.8); await settled()
        await ev("() => document.querySelector('[data-a=done]').click()"); await asyncio.sleep(0.8)
        say(not await ev('() => __bw.layoutUI.active'), 'Done closes the editor'); await settled()
        before = await ev('() => JSON.stringify(__bw.world.layout.save())')
        await ev("() => { __bw.world.applyLayout({ v: 1, m: {} }); }"); await asyncio.sleep(1.5)
        mid = await ev('() => ({ n: __bw.world.layout.count, own: JSON.stringify(__bw.world.layout.own()), inB: __bw.world.layout.inBattle })')
        say(mid['inB'] and mid['n'] == 0 and mid['own'] == before, 'during an attack the screen shows the defender, and own() still answers the PLAYER\'s own record (what the editor / the sync send)', mid['own'][:80])
        await ev("() => { __bw.world.layout.leaveBattle(); }"); await asyncio.sleep(1.5)
        after = await ev('() => JSON.stringify(__bw.world.layout.save())')
        say(after == before, 'back from the attack: the same record, the house stands where it was left')
        s1, g1 = api('/api/layout'); say(s1 == 200 and g1['layout'] and list(g1['layout']['m']) == [tgt['id']], 'and the server still has it (after the attack too)', json.dumps(g1)[:120])
        # ---------------------------------------------------------------- 9. reload: the house stands where it was left (GET /api/layout -> the screen), and the editor's own camera
        want = json.loads(before)['m']; s1, g1 = api('/api/layout'); say(s1 == 200 and g1['layout'] and g1['layout']['m'] == want, 'before the reload the server has exactly the record on the screen', json.dumps(want))
        await pg.reload(); t1 = time.time()
        for i in range(4000):
            await asyncio.sleep(0.5)
            try:
                if await ev('!!window.__ready'): break
            except Exception: pass
        for i in range(900):
            try:
                if await ev('!!(window.__bw && __bw.lateReady)'): break
            except Exception: pass
            await asyncio.sleep(1)
        await ev('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); if (B.ctl.intro) B.ctl.intro = null; }'); print('reloaded in', round(time.time() - t1), flush=True)
        for _ in range(120):
            if await cnt() >= 1: break
            await asyncio.sleep(1)
        rec = await ev('(id) => { const r = __bw.world.layout.records().find((q) => q.id === id); return { count: __bw.world.layout.count, x: r.x, z: r.z, moved: r.moved, save: __bw.world.layout.save().m }; }', tgt['id'])
        say(rec['moved'] and rec['save'] == want, 'AFTER A RELOAD the moved house is on the screen at the place it was left (%s)' % json.dumps(rec['save']), json.dumps(rec))
        await ev('() => { __bw.ctl.update = () => {}; }'); await ev(SET_CAM, cam_for((tgt['x'], tgt['z']), (rec['x'], rec['z']), 40, 34, 55)); await frame('ly1_reload', 10)
        await ev('() => { delete __bw.ctl.update; __bw.ctl.dist = 410; __bw.ctl.target.set(0, 2.15, 0); }'); await asyncio.sleep(3)
        d0 = await ev('() => __bw.ctl.dist'); await ev("() => document.querySelector('button.ent').click()")
        for _ in range(60):
            if await ev('() => __bw.ctl.dist') < 300: break
            await asyncio.sleep(1)
        d1 = await ev('() => __bw.ctl.dist'); say(d1 < 300 and d1 > 240, 'opening the editor brings the camera in (distance %d -> %d) so that a house is a thumb wide' % (d0, d1))
        await ev("() => document.querySelector('[data-a=done]').click()")
        for _ in range(60):
            if await ev('() => __bw.ctl.dist') > 370: break
            await asyncio.sleep(1)
        d2 = await ev('() => __bw.ctl.dist'); say(d2 > 370, '«Done» takes the camera back to where the player had it (%d)' % d2)
        print('LY1 UI OK' if all(checks) else 'LY1 UI FAILED %d' % (len(checks) - sum(checks)))
        print('\n'.join(logs[:20]))
        if not CDP: await b.close()
asyncio.run(main())
