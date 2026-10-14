import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# T1: in-game proof frames of the building context sheet, ONE page load.  The server is not available: econ.upgrade / econ.army are stubbed IN THE PAGE (they change the state the way the server would),
# econ.collect is the real offline path.  Frames (390x844): barracks, forge, mine, site (fake ws: pick on a real fishery spot), house (fake home: pick on a real house), wall, rush dialog + a landscape one.
OUT = '/home/claude/work/t1'; os.makedirs(OUT, exist_ok=True)
PORTRAIT_ONLY = os.environ.get('NOLAND')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300]) if m.type in ('error', 'warning') and '404' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:8777/t1_dev.html?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('home ready', T(), flush=True); await asyncio.sleep(3)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; }')
        print('picks', json.dumps(await pg.evaluate("() => { const h={}; for (const p of __bw.world.picks) h[p.id]=(h[p.id]||0)+1; return h; }")), flush=True)
        # ---- the stubs + a castle at level 12 with something to upgrade
        print('prep', json.dumps(await pg.evaluate("""() => {
          const e = __bw.econ, P = e.st.prog, now = () => e.now();
          for (const [k, r] of Object.entries(P.structs)) { r.lv = k === 'keep' ? 13 : 12; r.up = null; r.next = { to: r.lv + 1, ok: true, cost: { ruby: 1200, emerald: 640 }, dur: 14400, info: {} }; }
          P.b.keep = 13; P.builders = 3; P.builders_busy = 0; e.st.gems.turq = 3400; e.st.army.space = Math.floor(e.st.army.cap * 0.35); e.st.army.queued = 0; for (const f of Object.values(e.st.army.fam)) f.used = Math.floor(f.cap * 0.3);
          window.__calls = [];
          e.upgrade = async (op, ent) => { window.__calls.push(['upgrade', op, ent]); const r = P.structs[ent]; if (!r) return { ok: false, why: 'bad' };
            if (op === 'start') { r.up = { to: r.lv + 1, end: now() + 14400, dur: 14400, rush: 60, rush_cut: 0, rush_full: true }; r.next = null; P.builders_busy++; }
            else if (op === 'speedup') { r.lv = r.up.to; r.up = null; r.next = { to: r.lv + 1, ok: true, cost: { ruby: 1300, emerald: 700 }, dur: 15000, info: {} }; P.builders_busy--; e.st.gems.turq -= 60; }
            else if (op === 'cancel') { r.up = null; r.next = { to: r.lv + 1, ok: true, cost: { ruby: 1200, emerald: 640 }, dur: 14400, info: {} }; P.builders_busy--; }
            e._emit({ upgrade: op, ent, ok: true }); return { ok: true, info: {} }; };
          e.army = async (op, body) => { window.__calls.push(['army', op, body && body.u]); if (op === 'train') { const u = e.st.army.units[body.u], f = e.st.army.fam[u.fam]; f.q.push({ u: body.u, n: body.n, t: 12, fin: now() + 12 * body.n }); e._emit({ army: op, ok: true }); return { ok: true }; } return { ok: false, why: 'bad' }; };
          return { mines: Object.keys(e.st.mines), ruby: e.st.gems.ruby, famq: Object.keys(e.st.army.fam), units: Object.keys(e.st.army.units).length };
        }""")), flush=True)
        await asyncio.sleep(1)
        AUDIT = """() => { const s = document.querySelector('.bsh.on'); if (!s) return { open: false }; const V = [], R = s.getBoundingClientRect();
          const btns = [...s.querySelectorAll('button')].filter((x) => x.offsetParent !== null || getComputedStyle(x).position === 'fixed');
          const rects = btns.map((x) => ({ t: (x.textContent || '').trim().slice(0, 18), r: x.getBoundingClientRect() }));
          for (const q of rects) { if (q.r.width < 44 - 0.5 || q.r.height < 44 - 0.5) V.push('target<44 ' + q.t + ' ' + Math.round(q.r.width) + 'x' + Math.round(q.r.height)); }
          for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const a = rects[i].r, c = rects[j].r; if (a.left < c.right - 0.5 && c.left < a.right - 0.5 && a.top < c.bottom - 0.5 && c.top < a.bottom - 0.5) V.push('overlap ' + rects[i].t + ' / ' + rects[j].t); }
          for (const x of btns) { const r = x.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; if (cx < 0 || cx > innerWidth || cy < 0 || cy > innerHeight || (x.closest('[data-keep]') && (cx > s.getBoundingClientRect().right - 14))) continue; const el = document.elementFromPoint(cx, cy); if (!(el && (el === x || x.contains(el)))) V.push('covered ' + (x.textContent || '').trim().slice(0, 18) + ' by ' + (el ? el.tagName + '.' + String(el.className).slice(0, 30) : 'null')); }
          for (const x of s.querySelectorAll('*')) { const cs = getComputedStyle(x); if (x.childNodes.length && [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(cs.fontSize) < 11) V.push('font<11 ' + x.className); if ((cs.animationName !== 'none' && cs.animationIterationCount === 'infinite')) V.push('infinite animation ' + x.className); if (cs.backdropFilter && cs.backdropFilter !== 'none') V.push('backdrop-filter ' + x.className); }
          if (R.left < -0.5 || R.right > innerWidth + 0.5) V.push('sheet outside the viewport'); if (document.documentElement.scrollWidth > innerWidth) V.push('horizontal scroll');
          const old = document.querySelector('.bwa-btn'); const z = (q) => { const e = document.querySelector(q); return e ? getComputedStyle(e).zIndex : null; };
          return { open: true, rect: [Math.round(R.left), Math.round(R.top), Math.round(R.width), Math.round(R.height)], title: (s.querySelector('.bsh-t b') || {}).textContent, state: (s.querySelector('.bsh-st .tx') || {}).textContent, primary: (s.querySelector('.bsh-go .bsh-b') || {}).textContent, buttons: rects.map((q) => q.t + ' ' + Math.round(q.r.width) + 'x' + Math.round(q.r.height)), violations: V, oldBtnOpacity: old ? getComputedStyle(old).opacity : null, z: { sheet: z('.bsh'), dlg: z('.bsh-dlg'), toast: z('.bw-toast') }, programs: __bw.renderer.info.programs ? __bw.renderer.info.programs.length : null, calls: __bw.renderer.info.render.calls }; }"""
        POSE = """([id, fake, dist, az, k]) => { const w = __bw.world, THREE = __bw.THREE, c = __bw.ctl, cam = __bw.camera; const all = w.picks.filter((q) => q.id === id); const pk = all[Math.min(k || 0, all.length - 1)];
          if (!pk) return null; const ctr = pk.box.getCenter(new THREE.Vector3()); c.target.set(ctr.x, 0, ctr.z); c.dist = dist; c.polar = 1.0; c.azim = az; c.intro = null;
          if (fake && !w.picks.find((q) => q.id === fake)) { const bx = pk.box.clone().expandByScalar(1.5); w.picks.push({ id: fake, box: bx }); }
          const W = innerWidth, H = innerHeight; cam.setViewOffset(W, H, 0, Math.round(H * (W < H ? 0.2 : 0.0)), W, H); return [ctr.x, ctr.y, ctr.z]; }"""
        FIND = """([want, k]) => { const w = __bw.world, THREE = __bw.THREE, cam = __bw.camera, ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hit = new THREE.Vector3();
          const all = w.picks.filter((q) => q.id === want), pk = all[Math.min(k || 0, all.length - 1)]; const bx = pk.box, ctr = bx.getCenter(new THREE.Vector3());
          const pts = [ctr, new THREE.Vector3(ctr.x, bx.max.y - 0.5, ctr.z), new THREE.Vector3(ctr.x, bx.min.y + 1.2, ctr.z), new THREE.Vector3(bx.min.x + 1, ctr.y, ctr.z), new THREE.Vector3(bx.max.x - 1, ctr.y, ctr.z), new THREE.Vector3(ctr.x, ctr.y, bx.min.z + 1), new THREE.Vector3(ctr.x, ctr.y, bx.max.z - 1)];
          cam.updateMatrixWorld(); let first = null;
          for (const p of pts) { const v = p.clone().project(cam); if (Math.abs(v.x) > 0.9 || v.y > 0.55 || v.y < -0.9) continue; const x = (v.x + 1) / 2 * innerWidth, y = (1 - v.y) / 2 * innerHeight;
            ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam); let best = null, bd = 1e9;
            for (const q of w.picks) if (ray.ray.intersectBox(q.box, hit)) { const d = hit.distanceTo(cam.position); if (d < bd) { bd = d; best = q.id; } }
            if (!first) first = { x, y, hit: best }; if (best === want) return { x, y, hit: best, ok: true }; }
          return first ? { ...first, ok: false } : { ok: false }; }"""
        TAPXY = "([x, y]) => { __bw.ctl.onTap(x, y); return [Math.round(x), Math.round(y)]; }"
        async def go(name, id, fake=None, dist=110, shot=True, settle=2.5, k=0):
            want = fake or id; found = None
            for kk in ([k] if k else [0, 1]):
                for az in (0.9, 2.4, 3.9, 5.4, 1.6, 3.1, 4.6):
                    r = await pg.evaluate(POSE, [id, fake, dist, az, kk]); await asyncio.sleep(settle)
                    found = await pg.evaluate(FIND, [want, kk])
                    if found.get('ok'): break
                if found.get('ok'): break
            print('pose', name, r, 'az', az, 'tap', json.dumps(found), flush=True)
            cb = await pg.evaluate("() => __bw.renderer.info.render.calls")
            await pg.evaluate(TAPXY, [found['x'], found['y']]); await asyncio.sleep(1.0)
            for _ in range(60):
                ok = await pg.evaluate("() => { const s = document.querySelector('.bsh.on'); if (!s) return true; const r = s.getBoundingClientRect(); return getComputedStyle(s).transform === 'none' && r.top < innerHeight - 40; }")
                if ok: break
                await asyncio.sleep(0.5)
            await asyncio.sleep(0.8)
            a = await pg.evaluate(AUDIT); a['callsBefore'] = cb; print('AUDIT', name, json.dumps(a), flush=True)
            if shot: await pg.screenshot(path=f'{OUT}/t1_{name}.png', timeout=300000); print('shot', name, T(), flush=True)
            return a
        if os.environ.get('CLOSE'):
            # short run: how the sheet closes + how the old behaviour survives (empty ground, the X, a decoration label, an id without a sheet)
            await go('barracks', 'barracks', shot=False)
            print('open:', await pg.evaluate("() => !!document.querySelector('.bsh.on')"), flush=True)
            EMPTY = """() => { const w = __bw.world, THREE = __bw.THREE, cam = __bw.camera, ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hit = new THREE.Vector3(); for (let y = 40; y < 420; y += 20) for (let x = 20; x < innerWidth - 20; x += 20) { ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam); let any = false; for (const q of w.picks) if (ray.ray.intersectBox(q.box, hit)) { any = true; break; } if (!any) for (const c of w.creatures || []) { if (c.vis && !c.vis()) continue; const sp = new THREE.Sphere(c.center(), c.r); if (ray.ray.intersectSphere(sp, hit)) { any = true; break; } } if (!any) return [x, y]; } return null; }"""
            e = await pg.evaluate(EMPTY); print('empty spot', e, flush=True)
            await pg.evaluate(TAPXY, e); await asyncio.sleep(1.5)
            print('empty tap closes:', await pg.evaluate("() => !document.querySelector('.bsh.on') && !document.querySelector('.bw-sheet.on') && !document.querySelector('.bw-ui').classList.contains('bsh-on')"), flush=True)
            await go('barracks', 'barracks', shot=False)
            xb = await pg.evaluate("() => { const r = document.querySelector('.bsh-x').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }")
            await pg.mouse.click(xb[0], xb[1]); await asyncio.sleep(1.5)
            print('X (real click) closes:', await pg.evaluate("() => !document.querySelector('.bsh.on') && !document.querySelector('.bw-ui').classList.contains('bsh-on')"), 'corner buttons back:', await pg.evaluate("() => getComputedStyle(document.querySelector('.bwa-btn')).opacity"), flush=True)
            await pg.evaluate(POSE, ['market', None, 110, 0.9, 0]); await asyncio.sleep(2.5); f = await pg.evaluate(FIND, ['market', 0]); print('market tap', json.dumps(f), flush=True)
            await pg.evaluate(TAPXY, [f['x'], f['y']]); await asyncio.sleep(0.3)
            print('LABEL on:', await pg.evaluate("() => [document.querySelector('.bsh-lbl').classList.contains('on'), document.querySelector('.bsh-lbl').textContent, !!document.querySelector('.bsh.on')]"), flush=True)
            await asyncio.sleep(2.2); print('LABEL after 2.5 s:', await pg.evaluate("() => document.querySelector('.bsh-lbl').classList.contains('on')"), flush=True)
            for oid in ('church', 'treasury', 'crystal'):
                await pg.evaluate(POSE, [oid, None, 110, 0.9, 0]); await asyncio.sleep(2.5); f = await pg.evaluate(FIND, [oid, 0])
                await pg.evaluate(TAPXY, [f['x'], f['y']]); await asyncio.sleep(1.0)
                print('OLD', oid, 'hit', f.get('hit'), json.dumps(await pg.evaluate("() => ({ old: document.querySelector('.bw-sheet').classList.contains('on'), t: document.querySelector('.bw-sheet .t').textContent, bsh: !!document.querySelector('.bsh.on'), cls: document.querySelector('.bw-ui').className })")), flush=True)
            print('LOGS', json.dumps(logs[:10]), flush=True); await b.close(); return
        clickp = "() => { const b = document.querySelector('.bsh-go .bsh-b'); b.click(); return b.textContent; }"
        state = "() => { const s = document.querySelector('.bsh.on'); return s ? { state: (s.querySelector('.bsh-st .tx')||{}).textContent, primary: (s.querySelector('.bsh-go .bsh-b')||{}).textContent, title: (s.querySelector('.bsh-t b')||{}).textContent } : null; }"
        # ---- barracks: Train queues
        await go('barracks', 'barracks')
        await pg.evaluate("() => { document.querySelectorAll('.bsh-chip')[0].click(); }"); await asyncio.sleep(0.3)
        bb0 = await pg.evaluate("() => { const r = document.querySelector('.bsh-go .bsh-b').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }")
        await pg.mouse.click(bb0[0], bb0[1]); print('train (real mouse click) at', [round(v) for v in bb0], flush=True); await asyncio.sleep(1.6)
        print('after train', json.dumps(await pg.evaluate(state)), json.dumps(await pg.evaluate("() => ({ calls: window.__calls, q: Object.values(__bw.econ.st.army.fam).map((f) => f.q.length) })")), flush=True)
        await pg.evaluate("() => document.querySelector('[data-b=info]').click()"); await asyncio.sleep(0.4)
        print('info open:', await pg.evaluate("() => { const i = document.querySelector('.bsh-info'); return [i.classList.contains('on'), i.textContent.length]; }"), flush=True)
        # ---- forge: Upgrade armour starts, then Rush (hold) + the dialog
        await go('forge', 'forge')
        print('upgrade ->', await pg.evaluate(clickp), flush=True); await asyncio.sleep(1.4)
        print('after upgrade', json.dumps(await pg.evaluate(state)), flush=True)
        bb = await pg.evaluate("() => { const r = document.querySelector('.bsh-go .bsh-b').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }")
        await pg.mouse.move(bb[0], bb[1]); await pg.mouse.down(); await asyncio.sleep(0.25)
        print('holding class', await pg.evaluate("() => !!document.querySelector('.bsh-b.holding')"), flush=True)
        await pg.mouse.up(); await asyncio.sleep(0.5)
        print('early release: dialog open =', await pg.evaluate("() => document.querySelector('.bsh-dlg').classList.contains('on')"), flush=True)
        await pg.mouse.move(bb[0], bb[1]); await pg.mouse.down(); await asyncio.sleep(0.9); await pg.mouse.up(); await asyncio.sleep(0.6)
        print('full hold: dialog open =', await pg.evaluate("() => document.querySelector('.bsh-dlg').classList.contains('on')"), flush=True)
        for _ in range(40):
            if await pg.evaluate("() => getComputedStyle(document.querySelector('.bsh-dlg')).opacity === '1'"): break
            await asyncio.sleep(0.5)
        print('DLG audit', json.dumps(await pg.evaluate("() => [...document.querySelectorAll('.bsh-dlg button')].map((b) => { const r = b.getBoundingClientRect(); return [b.textContent, Math.round(r.width), Math.round(r.height)]; })")), json.dumps(await pg.evaluate("() => document.querySelector('.bsh-dlg').textContent")), flush=True)
        await pg.screenshot(path=f'{OUT}/t1_rush.png', timeout=300000); print('shot rush', T(), flush=True)
        await pg.evaluate("() => document.querySelector('.bsh-dlg [data-d=\"1\"]').click()"); await asyncio.sleep(1.6)
        print('after rush', json.dumps(await pg.evaluate(state)), json.dumps(await pg.evaluate("() => ({ calls: window.__calls, turq: __bw.econ.st.gems.turq })")), flush=True)
        # ---- mine: Collect pays (the real offline path)
        await go('mine', 'mine_ruby', dist=140)
        g0 = await pg.evaluate("() => __bw.econ.st.gems.ruby")
        bb1 = await pg.evaluate("() => { const r = document.querySelector('.bsh-go .bsh-b').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }")
        await pg.mouse.click(bb1[0], bb1[1]); print('collect (real mouse click)', flush=True); await asyncio.sleep(1.6)
        print('after collect', g0, '->', await pg.evaluate("() => __bw.econ.st.gems.ruby"), json.dumps(await pg.evaluate(state)), flush=True)
        # ---- a production site (fake ws: pick on the real river fishery), a house (fake home: pick on a real house), the wall
        await pg.evaluate("() => { const T = __bw.THREE; __bw.world.picks.push({ id: '__fishery', box: new T.Box3(new T.Vector3(180, 0, -178), new T.Vector3(198, 9, -160)) }); }")
        await go('site', '__fishery', fake='ws:fishery_river', dist=120)
        await go('house', 'house', fake='home:1', dist=100)
        await go('wall', 'wall', dist=150)
        print('wall Upgrade ->', await pg.evaluate(clickp), flush=True); await asyncio.sleep(1.2)
        await pg.evaluate("() => document.querySelector('.bsh-row .bsh-b').click()"); await asyncio.sleep(0.8)
        print('cancel dialog:', json.dumps(await pg.evaluate("() => [document.querySelector('.bsh-dlg').classList.contains('on'), document.querySelector('.bsh-dlg').textContent]")), flush=True)
        await pg.evaluate("() => document.querySelector('.bsh-dlg [data-d=\"1\"]').click()"); await asyncio.sleep(1.2)
        print('after cancel', json.dumps(await pg.evaluate(state)), json.dumps(await pg.evaluate("() => window.__calls.filter((c) => c[0] === 'upgrade').map((c) => c[1] + ':' + c[2]).join(' ')")), flush=True)
        await pg.evaluate("() => document.querySelector('[data-b=mv]').click()"); await asyncio.sleep(0.5)
        print('Move toast:', await pg.evaluate("() => { const t = document.querySelector('.bw-toast'); return [t.textContent, getComputedStyle(t).opacity, getComputedStyle(t).zIndex]; }"), flush=True)
        await pg.evaluate("() => { __bw.econ.st.prog.structs.wall.next = { to: 14, ok: false, why: 'cap', cost: { ruby: 1200, emerald: 640 }, dur: 14400, info: { need_keep: 14 } }; __bw.econ._emit({}); }"); await asyncio.sleep(1.2)
        print('disabled primary:', json.dumps(await pg.evaluate("() => { const b = document.querySelector('.bsh-go .bsh-b'); return [b.className, b.textContent]; }")), flush=True)
        await pg.evaluate("() => document.querySelector('.bsh-go .bsh-b').click()"); await asyncio.sleep(0.4)
        print('disabled tap toast:', await pg.evaluate("() => document.querySelector('.bw-toast').textContent"), flush=True)
        await pg.evaluate("() => { __bw.econ.st.prog.structs.wall.next = { to: 14, ok: true, cost: { ruby: 1200, emerald: 640 }, dur: 14400, info: {} }; __bw.econ._emit({}); }"); await asyncio.sleep(0.8)
        await pg.evaluate("() => document.querySelector('[data-b=mng]').click()"); await asyncio.sleep(1.5)
        print('Manage ->', json.dumps(await pg.evaluate("() => ({ sheetOpen: !!document.querySelector('.bsh.on'), page: !!document.querySelector('.bwu.on'), hl: !!document.querySelector('.bwu-r.hl'), hlName: (document.querySelector('.bwu-r.hl .n span') || {}).textContent, x: (() => { const r = document.querySelector('.bwu-x').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })() })")), flush=True)
        await pg.evaluate("() => document.querySelector('.bwu-x').click()"); await asyncio.sleep(0.8)
        # ---- DOM-only taps: keep, a vault, the gate / tower aliases, a civic fake, a decoration label, an empty tap closes
        for nm, id in (('keep', 'keep'), ('vault', 'vault_ruby'), ('gate', 'gate'), ('tower', 'tower'), ('archer', 'archer')):
            ok = await pg.evaluate("(id) => { const pk = __bw.world.picks.find((q) => q.id === id); return !!pk; }", id)
            if not ok: print('skip', nm, '(no pick)'); continue
            a = await go(nm, id, shot=False, settle=2); print('TAPPED', nm, a.get('title'), '|', a.get('primary'), '| viol', a.get('violations'), flush=True)
        for id in ('well', 'market'):
            await pg.evaluate(POSE, [id, None, 110, 0.9, 0]); await asyncio.sleep(2.5); f = await pg.evaluate(FIND, [id, 0])
            await pg.evaluate(TAPXY, [f['x'], f['y']]); await asyncio.sleep(0.4)
            print('LABEL', id, f.get('hit'), await pg.evaluate("() => ({ txt: document.querySelector('.bsh-lbl').textContent, on: getComputedStyle(document.querySelector('.bsh-lbl')).opacity, sheet: !!document.querySelector('.bsh.on') })"), flush=True)
            await asyncio.sleep(2.2); print('  label gone after 1.5 s:', await pg.evaluate("() => getComputedStyle(document.querySelector('.bsh-lbl')).opacity"), flush=True)
        await pg.evaluate("() => __bw.ctl.onTap(5, 5)"); await asyncio.sleep(0.6)
        print('empty tap closes:', await pg.evaluate("() => !document.querySelector('.bsh.on') && !document.querySelector('.bw-sheet.on')"), flush=True)
        # ---- landscape
        if not PORTRAIT_ONLY:
            await pg.set_viewport_size({'width': 844, 'height': 390}); await asyncio.sleep(6)
            await go('land', 'barracks', dist=110, settle=4)
        print('LOGS', json.dumps(logs[:10]), flush=True)
        await b.close()
asyncio.run(main())
