import asyncio, sys, os, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
# TR2-S3-R2 job 2: does the castle's hi <-> lo switch (castle_tr2.js LOD_NEAR 80 / LOD_FAR 100 m) pop on a moving camera?
#   PAGE=dev_s35.html LV=30 python3 dev/tr2_s3_lodstrip.py OUTDIR
# ONE game session, two camera paths (the same N poses are rendered in several passes):
#   Z  zoom: the home-map orbit camera (pitch 35 deg, looking at the castle) dollies from 70 m to 190 m and back (the orbit camera lives at 90..345 m: this is the zoom the player does)
#   A  arc:  a ground camera (3 m above the terrain, 55 deg fov) outside the town ring, on an arc through two quadrants of the town wall (the cells are the four quadrants of that ring):
#            while it moves along the wall, the quadrant ahead of it comes into range and flips lo -> hi (hero walking along the town wall)
# passes:  zf / zb = Z natural LOD forward / back (hysteresis) · zh / zl = Z with every cell forced full / forced lo (same pose = the pure LOD difference) · zh_noise = pose 0 again (render noise)
#          af = A natural LOD · ah / al = A forced full / lo
#   ISO=1: the frames show ONLY the castle (everything else hidden, flat background): the full scene moves between two frames (dragon, birds, water, flags), the castle alone is deterministic,
#          so every pixel difference between two frames of the same pose is the LOD (zh_noise = pose 0 again must be identical).  Then ALL poses are rendered in every pass.
#   DUMP=1: afterwards the stairs / keep session of dev/tr2_s3_stairs_dump.py in the same page (saves a second 5 min load).
# The numbers (mean |diff|, % of pixels that change, vs the diff of two consecutive camera poses) come from dev/tr2_s3_lodstrip_post.py.
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
LV = os.environ.get('LV', '30'); NZ = int(os.environ.get('NZ', 13)); NA = int(os.environ.get('NA', 9))
D0 = float(os.environ.get('D0', 70)); D1 = float(os.environ.get('D1', 190)); PITCH = float(os.environ.get('PITCH', 35)); ZAZ = float(os.environ.get('ZAZ', 200))
A0 = float(os.environ.get('A0', 225)); SPAN = float(os.environ.get('SPAN', 90)); OFF = float(os.environ.get('OFF', 45)); UP = float(os.environ.get('UP', 3))
ISO = bool(os.environ.get('ISO')); DUMP = bool(os.environ.get('DUMP'))
W = int(os.environ.get('W', 800)); H = int(os.environ.get('H', 450))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if (m.type in ('error', 'warning') and '404' not in m.text) else None)
        await pg.goto('http://127.0.0.1:8777/' + os.environ.get('PAGE', 'dev_s35.html') + '?q=' + os.environ.get('Q', 'low') + '&w=clear&h=13&wa=0.1&lv=' + LV)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); if (B.ctl.intro) B.ctl.intro = null; }')
        await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; }")
        await asyncio.sleep(3)
        geo = await pg.evaluate("""() => { const T3 = __bw.world.tr2c; if (!T3) return null;
          const mid = (w) => Math.hypot(w.ax + w.ux * w.len / 2, w.az + w.uz * w.len / 2);
          const avg = (ring) => { const a = T3.walls.filter((w) => w.ring === ring).map(mid); return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0; };
          return { rOuter: avg('outer'), rInner: avg('inner'), rTown: avg('town'), cells: T3.state().lod.length, tris: T3.state().tris, trisLo: T3.state().trisLo, sig: T3.state().sig }; }""")
        print('geo', json.dumps(geo), flush=True)
        if not geo: raise SystemExit('no tr2c (castle from Tripo not installed)')
        if ISO:                                             # everything that is not the castle is hidden for the moment of every draw (creatures / flags that switch their own visibility or appear later are caught too)
            n = await pg.evaluate("""() => { const R = __bw.renderer, T = __bw.THREE, sc = __bw.scene, keep = __bw.world.tr2c.group; window.__renderOrig = R.render;
              const inKeep = (o) => { while (o) { if (o === keep) return true; o = o.parent; } return false; };
              const orig = R.render.bind(R); let hidden = 0;
              R.render = (scene, cam) => { const hid = []; if (scene === sc) scene.traverse((o) => { if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && o.visible && !inKeep(o)) { o.visible = false; hid.push(o); } }); hidden = hid.length; try { orig(scene, cam); } finally { for (const o of hid) o.visible = true; } };
              window.__bgSaved = sc.background; sc.background = new T.Color(0x9fb4c8); window.__isoHidden = () => hidden; return 0; }""")
            print('ISO: castle only (renderer.render wrapped)', flush=True)
        await pg.evaluate('(a) => { const B = __bw; B.ctl.update = () => {}; const c = B.camera, fh = B.world.fastHeight, R = Math.PI / 180;'
                          ' c.fov = 40; c.updateProjectionMatrix();'
                          ' window.__poseZ = (i) => { const d = a.d0 + (a.d1 - a.d0) * i / (a.nz - 1), p = a.pitch * R, th = a.zaz * R; c.fov = 40; c.updateProjectionMatrix();'
                          '   c.position.set(d * Math.cos(p) * Math.cos(th), d * Math.sin(p) + 4, d * Math.cos(p) * Math.sin(th)); c.lookAt(0, 4, 0); c.updateMatrixWorld(true); };'
                          ' window.__poseA = (i) => { const th = (a.a0 + a.span * i / (a.na - 1)) * R, rc = a.rt + a.off, x = rc * Math.cos(th), z = rc * Math.sin(th), wx = a.rt * Math.cos(th), wz = a.rt * Math.sin(th); c.fov = 55; c.updateProjectionMatrix();'
                          '   c.position.set(x, fh(x, z) + a.up, z); c.lookAt(wx, fh(wx, wz) + 5, wz); c.updateMatrixWorld(true); }; }',
                          {'d0': D0, 'd1': D1, 'pitch': PITCH, 'zaz': ZAZ, 'nz': NZ, 'a0': A0, 'span': SPAN, 'na': NA, 'rt': geo['rTown'], 'off': OFF, 'up': UP})
        async def settle(k):
            f0 = await pg.evaluate('__bw.frames')
            for i in range(240):
                if await pg.evaluate(f'__bw.frames >= {f0} + {k}'): break
                await asyncio.sleep(0.4)
        async def shot(name):
            await pg.screenshot(path=f'{OUT}/{name}.png', timeout=240000)
        steps = []
        async def natural(tag, pose, order):
            prev = None
            for i in order:
                await pg.evaluate(f'{pose}({i})'); await pg.evaluate('__bw.world.tr2c.lod(__bw.camera)'); await settle(2)
                st = await pg.evaluate('__bw.world.tr2c.state()')
                lod = {s.rsplit(':', 1)[0]: s.rsplit(':', 1)[1] for s in st['lod']}
                flips = [k + '->' + lod[k] for k in lod if prev is not None and lod[k] != prev.get(k)]
                cam = await pg.evaluate('__bw.camera.position.toArray().map((v) => +v.toFixed(1))')
                steps.append({'pass': tag, 'i': i, 'cam': cam, 'hi': sum(1 for v in lod.values() if v == 'hi'), 'lo': sum(1 for v in lod.values() if v == 'lo'), 'flips': flips, 'lod': lod})
                prev = lod
                await shot(f'{tag}_{i:02d}'); print(tag, i, cam, 'hi', steps[-1]['hi'], 'lo', steps[-1]['lo'], 'flips', flips, flush=True)
        async def forced(tag, mode, pose, idx):
            await pg.evaluate(f"window.__tr2Lod = '{mode}'")
            for i in idx:
                await pg.evaluate(f'{pose}({i})'); await pg.evaluate('__bw.world.tr2c.lod(__bw.camera)'); await settle(2)
                bad = await pg.evaluate("__bw.world.tr2c.state().lod.filter((x) => !x.endsWith(':" + mode + "')).length")
                if bad: print('!! forced', mode, 'but', bad, 'cells differ at', tag, i, flush=True)
                await shot(f'{tag}_{i:02d}')
            print('forced', tag, 'done', idx, flush=True)
        def pick(tag, n, cap):                       # the poses that matter for the forced hi / lo pairs: the first, the last and the two poses around every flip of the natural pass
            fl = sorted({j for s in steps if s['pass'] == tag and s['flips'] for j in (s['i'], s['i'] - 1) if 0 <= j < n})
            keep = sorted({0, n - 1} | set(fl))
            while len(keep) > cap:                   # too many: thin out the middle
                keep.pop(len(keep) // 2)
            return keep
        await pg.evaluate('window.__tr2Lod = null')
        await pg.evaluate('__poseZ(0)'); await pg.evaluate('__bw.world.tr2c.lod(__bw.camera)'); await settle(3)
        await natural('zf', '__poseZ', list(range(NZ)))
        if ISO: await natural('zb', '__poseZ', list(range(NZ - 1, -1, -1)))
        await pg.evaluate('__poseA(0)'); await pg.evaluate('__bw.world.tr2c.lod(__bw.camera)'); await settle(3)
        await natural('af', '__poseA', list(range(NA)))
        PZ, PA = (list(range(NZ)), list(range(NA))) if ISO else (pick('zf', NZ, 9), pick('af', NA, 7))
        print('forced poses  Z', PZ, ' A', PA, flush=True)
        await forced('zh', 'hi', '__poseZ', PZ); await forced('ah', 'hi', '__poseA', PA)
        await pg.evaluate("window.__tr2Lod = 'hi'"); await pg.evaluate('__poseZ(0)'); await pg.evaluate('__bw.world.tr2c.lod(__bw.camera)'); await settle(3); await shot('zh_noise')
        await forced('zl', 'lo', '__poseZ', PZ); await forced('al', 'lo', '__poseA', PA)
        json.dump({'geo': geo, 'NZ': NZ, 'NA': NA, 'PZ': PZ, 'PA': PA, 'z': {'d0': D0, 'd1': D1, 'pitch': PITCH, 'az': ZAZ}, 'a': {'a0': A0, 'span': SPAN, 'off': OFF, 'up': UP}, 'size': [W, H], 'steps': steps, 'logs': logs[:20]}, open(f'{OUT}/lodstrip.json', 'w'), indent=1)
        if ISO:
            await pg.evaluate("() => { __bw.renderer.render = window.__renderOrig; __bw.scene.background = window.__bgSaved; window.__tr2Lod = null; }")
        if DUMP:
            from tr2_s3_stairs_dump import body as dump_body
            await dump_body(pg, OUT + '_stairs', logs)
        print('LOGS', json.dumps(logs[:10])); await b.close()
asyncio.run(main())
