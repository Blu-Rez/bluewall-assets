import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# TR2-S3: draw calls / triangles of the castle, new (Tripo) vs old (procedural, window.__tr2Off).   ONE game session per run.
#   OFF=1 python3 dev/tr2_budget.py TAG LV     (OFF=1: the old castle)  ->  /tmp/tr2_budget_TAG.json
# Per view: renderer.info (main pass, per frame, 3 frames), and a frustum walk of the scene: how many draws / triangles the castle meshes ('static-tr2' new, 'static' old batches) put on screen.
TAG = sys.argv[1]; LV = sys.argv[2] if len(sys.argv) > 2 else '30'
OFF = bool(os.environ.get('OFF')); PAGE = os.environ.get('PAGE', 'dev_s35.html')
W = int(os.environ.get('W', 1100)); H = int(os.environ.get('H', 620))
# strategic cameras (the TR2 baseline ones) through the orbit controller; ground cameras = what the hero sees (free camera, eye height ~3 m behind her)
ORBIT = {
  'top':    "c.target.set(0,0,0); c.dist=c.maxD*1.0; c.polar=0.25; c.azim=0.6;",
  'ctr':    "c.target.set(0,0,0); c.dist=c.maxD*0.7; c.polar=0.95; c.azim=0.5;",
  'town':   "c.target.set(60,0,150); c.dist=140; c.polar=0.9; c.azim=0.6;",
  'fields': "c.target.set(235,0,10); c.dist=150; c.polar=0.9; c.azim=1.2;",
  'lake':   "c.target.set(-128,0,230); c.dist=150; c.polar=0.95; c.azim=2.2;",
}
GROUND = {                                   # name: pos(3), target(3), fov
  'gate_out':  (66, 3.2, 35, 49, 6, 26, 55),        # outside the main gate, looking at it
  'gate_in':   (28, 3.2, 14, 49, 6, 26, 55),        # inside the outer ring, looking out through the gate
  'wall_out':  (-30, 3.2, -78, -18, 6, -54, 55),    # along the outer wall, outside
  'keep_yard': (-2, 3.2, 8, -21, 8, -20, 55),       # the inner yard, looking at the keep
}
MEAS = """async () => { const bw = __bw, r = bw.renderer; r.info.autoReset = false; r.info.reset(); const f0 = bw.frames; await new Promise((res) => { const t0 = bw.frames; const iv = setInterval(() => { if (bw.frames - t0 >= 3) { clearInterval(iv); res(); } }, 100); }); const n = bw.frames - f0; const o = { calls: Math.round(r.info.render.calls / n), tris: Math.round(r.info.render.triangles / n), n, programs: r.info.programs ? r.info.programs.length : 0, textures: r.info.memory.textures, geos: r.info.memory.geometries }; r.info.autoReset = true;
  const THREE = bw.THREE, cam = bw.camera; cam.updateMatrixWorld(true); const fr = new THREE.Frustum(), m = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); fr.setFromProjectionMatrix(m);
  const grp = {}; const add = (k, tr) => { const g = grp[k] || (grp[k] = { calls: 0, tris: 0 }); g.calls++; g.tris += tr; };
  bw.scene.traverse((o) => { if (!o.isMesh || !o.geometry) return; let p = o, vis = true; while (p) { if (p.visible === false) { vis = false; break; } p = p.parent; } if (!vis) return;
    const g = o.geometry; if (o.frustumCulled !== false) { if (!g.boundingSphere) g.computeBoundingSphere(); const s = g.boundingSphere.clone(); s.applyMatrix4(o.matrixWorld); if (!fr.intersectsSphere(s)) return; }
    const tri = (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); add((o.name || '?').replace(/[0-9]+$/, '').slice(0, 24), tri); });
  o.groups = grp; o.castle = grp['static-tr'] || { calls: 0, tris: 0 }; o.cam = bw.camera.position.toArray().map((v) => Math.round(v)); o.lod = bw.world.tr2c ? bw.world.tr2c.state().lod.join(' ') : ''; o.staticOld = grp['static'] || { calls: 0, tris: 0 }; return o; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        if OFF: await pg.add_init_script('window.__tr2Off = true')
        if os.environ.get('INIT'): await pg.add_init_script(os.environ['INIT'])
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type in ('error', 'warning') and '404' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:8777/' + PAGE + '?q=low&w=clear&h=14&wa=0.1&lv=' + LV)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); const c = B.ctl; if (c.intro) c.intro = null; }')
        await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; }")
        await asyncio.sleep(3)
        info = await pg.evaluate('() => ({ tr2c: !!(__bw.world.tr2c && __bw.world.tr2c.state().installed), tr2: __bw.world.tr2c ? __bw.world.tr2c.state().tris : 0 })')
        print('ready', T(), json.dumps(info), flush=True)
        res = {'tag': TAG, 'lv': LV, 'off': OFF, 'castle': info, 'views': {}}
        STREET = bool(os.environ.get('STREET'))           # R2: hero eye height (1.7 m above terrain) INSIDE the town: the hi cells (< 80 m) are on screen = the worst case of the lo/hi switch
        for nm, js in ({} if STREET else ORBIT).items():
            await pg.evaluate('() => { const c=__bw.ctl; ' + js + ' }'); await asyncio.sleep(8)
            res['views'][nm] = await pg.evaluate(MEAS); print(nm, {k: res['views'][nm][k] for k in ('calls', 'tris', 'castle', 'staticOld', 'cam')}, flush=True)
        await pg.evaluate('() => { __bw.ctl.update = () => {}; }')
        if STREET:
            GROUND.clear()
            for nm, (x, z, lx, lz) in {'street_w': (-90, 97, -96, 111), 'street_e': (63, 103.5, 77, 114.4), 'plaza': (10, 96, 28, 113), 'street_s': (-111.7, 41, -131.9, 47.4)}.items():
                h = await pg.evaluate('(a) => __bw.world.ctx.height(a[0], a[1])', [x, z]); hl = await pg.evaluate('(a) => __bw.world.ctx.height(a[0], a[1])', [lx, lz])
                GROUND[nm] = (x, h + 1.7, z, lx, hl + 3, lz, 62)
        for nm, a in GROUND.items():
            await pg.evaluate('(a) => { const c = __bw.camera; c.fov = a[6]; c.updateProjectionMatrix(); c.position.set(a[0], a[1], a[2]); c.lookAt(a[3], a[4], a[5]); c.updateMatrixWorld(true); }', list(a)); await asyncio.sleep(6)
            if STREET:                                       # software GL runs ~1 fps: force the town's lod now and wait until the hi cells near the camera are baked AND shown (the game, at 30+ fps, does this by itself within ~1-2 s)
                for _ in range(150):
                    if await pg.evaluate('() => { const T = window.__tr2Town; if (!T) return true; T.lod(__bw.camera, null, true); const s = T.state; return s.lazy.length === 0 && s.cells.every((c) => c.want !== "hi" || c.shown === "hi"); }'): break
                    await asyncio.sleep(1)
                await asyncio.sleep(4)
            res['views'][nm] = await pg.evaluate(MEAS); print(nm, {k: res['views'][nm][k] for k in ('calls', 'tris', 'castle', 'staticOld', 'cam')}, flush=True)
        res['logs'] = logs[:10]
        json.dump(res, open('/tmp/tr2_budget_' + TAG + '.json', 'w'), indent=1)
        print('LOGS', json.dumps(logs[:10])); await b.close()
asyncio.run(main())
