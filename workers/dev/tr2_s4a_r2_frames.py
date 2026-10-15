import asyncio, sys, os, json, time, subprocess
from playwright.async_api import async_playwright
# frames_r2.py LV OUTDIR [JOBSET]  — ONE game session at level LV: probe of the planned town (lod state, gen houses), street-level frames (hero eye height), destroyed block, extra camera jobs.
#   JOBSET = comma list of: street, civic, destroy, gen, far, hide   (default: all)
LV = sys.argv[1]; OUT = sys.argv[2]; SETS = (sys.argv[3] if len(sys.argv) > 3 else 'street,civic,destroy,gen,far,smoke,hide').split(',')
os.makedirs(OUT, exist_ok=True)
cams = json.loads(subprocess.check_output(['node', '/home/claude/dev/tr2_s4a_r2_cams.mjs', LV], stderr=subprocess.DEVNULL))
SET_CAM = """(j) => { const bw = __bw, H = bw.world.ctx.height, c = bw.camera; const px = j.cam[0], pz = j.cam[1]; const py = j.eye != null ? H(px, pz) + j.eye : j.camY;
  c.fov = j.fov || 60; c.updateProjectionMatrix(); c.position.set(px, py, pz); const ly = j.lookY != null ? j.lookY : H(j.look[0], j.look[1]) + (j.dy || 0); c.lookAt(j.look[0], ly, j.look[1]); c.updateMatrixWorld(true); return [px, py, pz]; }"""
PROBE = """() => { const T = window.__tr2Town, st = T && T.state, bw = __bw, r = bw.renderer; if (!st) return { err: 'no planned town handle' };
  const tris = (ms) => (ms || []).reduce((a, m) => a + (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3, 0);
  const gen = (bw.world.ctx.town && bw.world.ctx.town.gen) || [];
  return { mode: st.mode, stats: st.stats, fail: st.fail, atlas: !!st.atlas, lazy: st.lazy.length, queue: st.queue.length, gen: gen.length, genCells: [...new Set(gen.map((g) => g.cell))].length, lo: st.atlas && st.atlas.lo,
    cells: st.cells.map((c) => ({ key: c.key, lots: c.lots.length, want: c.want, shown: c.shown, hi: tris(c.hi), lo: tris(c.lo) })), far: { meshes: (st.far || []).length, tris: tris(st.far) },
    smoke: st.smoke.length, programs: r.info.programs.length, tex: r.info.memory.textures, geo: r.info.memory.geometries, tr2town: !!bw.world.ctx.tr2town }; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 620}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type in ('error', 'warning') and '404' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=' + LV)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); const c = B.ctl; if (c.intro) c.intro = null; }')
        await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; }")
        await asyncio.sleep(4)
        print('ready', T(), json.dumps(await pg.evaluate(PROBE))[:3000], flush=True)
        await pg.evaluate('() => { __bw.ctl.update = () => {}; }')
        SETTLE = '() => { const T = window.__tr2Town; if (!T) return true; T.lod(__bw.camera, null, true); const s = T.state; return s.lazy.length === 0 && s.cells.every((c) => c.want !== "hi" || c.shown === "hi"); }'
        async def settle():                                         # force the lod now, wait until the hi cells near the camera are baked AND shown (software GL runs ~1 fps)
            for _ in range(150):
                if await pg.evaluate(SETTLE): break
                await asyncio.sleep(1)
        async def shot(j, extra_wait=7):
            pos = await pg.evaluate(SET_CAM, j); await asyncio.sleep(1)
            await settle()
            await asyncio.sleep(extra_wait)
            st = await pg.evaluate('() => { const T = window.__tr2Town; return T ? { mode: T.state.mode, lazy: T.state.lazy.length, shown: T.state.cells.map((c) => c.key + ":" + (c.shown || "-")).join(" ") } : null; }')
            await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))'); await pg.screenshot(path=f"{OUT}/{j['name']}.png", timeout=240000); print('shot', j['name'], [round(v) for v in pos], st, flush=True)
        jobs = cams['jobs']
        if 'street' in SETS:
            for j in jobs:
                if j['name'].startswith('street'): await shot(j, 5)
        if 'civic' in SETS:
            await pg.evaluate('() => { delete __bw.ctl.update; }')
            for c in cams['civic']:
                await pg.evaluate('(c) => { const k = __bw.ctl; k.target.set(c.x, 0, c.z); k.dist = c.dist; k.polar = c.polar; k.azim = c.azim; }', c); await asyncio.sleep(2)
                await settle(); await asyncio.sleep(5); await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
                await pg.screenshot(path=f"{OUT}/{c['name']}.png", timeout=240000); print('shot', c['name'], flush=True)
            await pg.evaluate('() => { __bw.ctl.update = () => {}; }')
        if 'gen' in SETS:                       # a generic fill house + a hamlet house (lots of town.js / hamlets.js), street level
            g = await pg.evaluate("""() => { const gen = (__bw.world.ctx.town && __bw.world.ctx.town.gen) || []; const ham = gen.filter((g) => g.cell != null), fill = gen.filter((g) => g.cell == null);
              const f = (l) => l && ({ x: l.x, z: l.z, ry: l.ry, w: l.w, d: l.d, cell: l.cell }); return { n: gen.length, fill: f(fill[Math.floor(fill.length / 3)]), ham: f(ham[Math.floor(ham.length / 2)]), nf: fill.length, nh: ham.length }; }""")
            print('gen', json.dumps(g), flush=True)
            for nm in ('fill', 'ham'):
                l = g.get(nm)
                if not l: continue
                c, s = __import__('math').cos(l['ry']), __import__('math').sin(l['ry']); dx, dz = -2, l['d'] / 2 + 9
                await shot({'name': 'gen_' + nm + '_lv' + LV, 'cam': [l['x'] + dx * c + dz * s, l['z'] - dx * s + dz * c], 'look': [l['x'], l['z']], 'eye': 1.7, 'dy': 3, 'fov': 62}, 9)
        if 'destroy' in SETS:                   # a collapsed block next to a standing one, street level + oblique
            lots = await pg.evaluate("""() => { const m = __bw.world.ctx.townTids, out = []; for (const [k, v] of m) out.push([k, v]); return out; }""")
            print('tids', len(lots), flush=True)
            ref = cams['lots'].get('chim') or cams['lots'].get('cot'); lot_id = ref['id']
            tid = dict(lots).get(lot_id); near = [k for k, v in lots if v == tid]
            print('collapse block', lot_id, tid, near, flush=True)
            await pg.evaluate('(tid) => { __bw.DU.battle.value = 1; __bw.DS.set(tid, { collapse: 1, dmg: 1, flash: 0 }); __bw.DS.flush(); }', tid); await asyncio.sleep(3)
            L = ref; jc = next((j for j in jobs if j['name'].startswith('street_chimney')), jobs[0]); cx, cz = jc['cam']; dx, dz = cx - L['x'], cz - L['z']; dl = max(1.0, (dx * dx + dz * dz) ** 0.5)
            base = {'look': [L['x'], L['z']], 'dy': 2, 'fov': 62}
            ob = {'cam': [L['x'] + dx / dl * 34, L['z'] + dz / dl * 34], 'eye': 14, 'dy': 1}
            await pg.evaluate('(tid) => { __bw.DS.set(tid, { collapse: 0.5, dmg: 0.6, flash: 0 }); __bw.DS.flush(); }', tid); await asyncio.sleep(3)
            await shot({**base, 'name': 'destroyed_half_street_lv' + LV, 'cam': [cx, cz], 'eye': 1.7}, 4)
            await shot({**base, **ob, 'name': 'destroyed_half_oblique_lv' + LV}, 4)
            await pg.evaluate('(tid) => { __bw.DS.set(tid, { collapse: 1, dmg: 1, flash: 0 }); __bw.DS.flush(); }', tid); await asyncio.sleep(3)
            await shot({**base, 'name': 'destroyed_street_lv' + LV, 'cam': [cx, cz], 'eye': 1.7}, 4)
            await shot({**base, **ob, 'name': 'destroyed_oblique_lv' + LV}, 4)
            await pg.evaluate('(tid) => { __bw.DS.set(tid, { collapse: 0, dmg: 0 }); __bw.DS.flush(); __bw.DU.battle.value = 0; }', tid)
        if 'smoke' in SETS:                     # free camera: 3 plumes, each seen from 16 m toward the town centre, 6 m above the ground, looking at the chimney top
            sm = await pg.evaluate('() => (window.__tr2Town ? window.__tr2Town.state.smoke : []).map((s) => [s.x, s.y, s.z])'); print('smoke plumes', len(sm), json.dumps(sm[:40]), flush=True)
            for i, P in enumerate(sorted(sm, key=lambda q: (q[0] - 55) ** 2 + (q[2] - 105) ** 2)[:2]):
                dx, dz = 55 - P[0], 105 - P[2]; dl = max(1.0, (dx * dx + dz * dz) ** 0.5)
                await shot({'name': f'smoke_{i}_lv{LV}', 'cam': [P[0] + dx / dl * 16, P[2] + dz / dl * 16], 'camY': P[1] + 3, 'look': [P[0], P[2]], 'lookY': P[1] + 4, 'fov': 55}, 12)
        if 'marks' in SETS:                     # the smoke anchors in the real scene: a small green ball on every plume position (the smoke particles barely emit at ~1 fps in software GL), 2 views
            sm = await pg.evaluate('''() => { const T = window.__tr2Town, B = __bw, out = []; for (const s of T.state.smoke) { const m = new B.THREE.Mesh(new B.THREE.SphereGeometry(0.35, 10, 8), new B.THREE.MeshBasicMaterial({ color: 0x20ff20, depthTest: false })); m.position.set(s.x, s.y, s.z); m.renderOrder = 99; m.userData.mk = 1; B.scene.add(m); out.push([s.x, s.y, s.z]); } return out; }''')
            for i, P in enumerate(sorted(sm, key=lambda q: (q[0] - 55) ** 2 + (q[2] - 105) ** 2)[:3]):
                dx, dz = 55 - P[0], 105 - P[2]; dl = max(1.0, (dx * dx + dz * dz) ** 0.5)
                await shot({'name': f'smokemark_{i}_lv{LV}', 'cam': [P[0] + dx / dl * 14, P[2] + dz / dl * 14], 'camY': P[1] + 1.5, 'look': [P[0], P[2]], 'lookY': P[1] - 1.5, 'fov': 58}, 5)
        if 'flag' in SETS:                      # a town-hall pennant, 60 %, hero eye height, 11 m away
            c = next((c for c in cams['civic'] if 'townhall' in c['name']), None)
            if c:
                import math
                ry = c['azim'] - 0.45; ca, sa = math.cos(ry), math.sin(ry); lx, lz = 8.6, 10.2
                fx, fz = c['x'] + lx * ca + lz * sa, c['z'] - lx * sa + lz * ca
                bx, bz = c['x'] + (lx + 2) * ca + (lz + 11) * sa, c['z'] - (lx + 2) * sa + (lz + 11) * ca
                await shot({'name': f'flag_townhall_lv{LV}', 'cam': [bx, bz], 'eye': 1.7, 'look': [fx, fz], 'dy': 2, 'fov': 58}, 6)
        if 'hide' in SETS:                      # which mesh draws the grey blobs beside the tavern: same camera with / without the civic mesh
            c = next((c for c in cams['civic'] if 'tavern' in c['name']), None)
            if c:
                await pg.evaluate('() => { delete __bw.ctl.update; }')
                await pg.evaluate('(c) => { const k = __bw.ctl; k.target.set(c.x, 0, c.z); k.dist = 20; k.polar = 1.25; k.azim = c.azim; }', c); await asyncio.sleep(2); await settle(); await asyncio.sleep(6)
                await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))'); await pg.screenshot(path=f"{OUT}/hide_0_all_lv{LV}.png", timeout=240000)
                names = await pg.evaluate("() => { const out = []; __bw.scene.traverse((o) => { if (o.isMesh && /^civic-tr2/.test(o.name)) { o.userData.hid = 1; o.visible = false; out.push(o.name); } }); return out; }")
                await asyncio.sleep(6); await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))'); await pg.screenshot(path=f"{OUT}/hide_1_nocivic_lv{LV}.png", timeout=240000); print('shot hide', names, flush=True)
                await pg.evaluate("() => { __bw.scene.traverse((o) => { if (o.userData && o.userData.hid) o.visible = true; }); __bw.ctl.update = () => {}; }")
        if 'far' in SETS:
            for nm, js in {'far_top': "c.target.set(0,0,0); c.dist=c.maxD*0.55; c.polar=0.7; c.azim=0.6;", 'far_town': "c.target.set(40,0,100); c.dist=110; c.polar=1.0; c.azim=0.5;"}.items():
                await pg.evaluate('() => { delete __bw.ctl.update; }'); await pg.evaluate('() => { const c = __bw.ctl; ' + js + ' }'); await asyncio.sleep(7)
                await pg.screenshot(path=f"{OUT}/{nm}_lv{LV}.png", timeout=240000); print('shot', nm, json.dumps(await pg.evaluate(PROBE))[:400], flush=True)
        print('FINAL', json.dumps(await pg.evaluate(PROBE))[:2500]); print('LOGS', json.dumps(logs[:12])); await b.close()
asyncio.run(main())
