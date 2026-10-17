import asyncio, sys, os, json, time, math
from playwright.async_api import async_playwright
# wl1_shot.py TAG SPEC : WL1 — the home map as the owner sees it on a phone (844x390), ONE page load, several wall levels.
#   SPEC = comma list of  NAME=KIND:ARGS
#       S:50            world.setLevel(50)                       (the owner preview: every structure at 50 — what a1_shot.py does)
#       M:K/W           world.levels.setMany({every structure: K, wall: W})   (what main.js does with the server's st.prog.b)
#   e.g.  L50=S:50,L25=S:25,L15=S:15,K50W20=M:50/20
#   env: W H (viewport, default 844x390), SETTLE (s after a level change), VIEW (optional extra camera js, name=js), SKIP (1 = do not wait for the intro, jump to its end pose)
#   Prints for every shot: rings.state(), the camera pose, and how many vertices of each ring polygon fall inside the screen.
TAG = sys.argv[1]; SPEC = sys.argv[2] if len(sys.argv) > 2 else 'L50=S:50'
OUT = '/home/claude/work/wl1_' + TAG
os.makedirs('/home/claude/work', exist_ok=True)
W = int(os.environ.get('W', 844)); H = int(os.environ.get('H', 390)); SETTLE = float(os.environ.get('SETTLE', 10))
EXTRA_VIEWS = {}
for kv in os.environ.get('VIEW', '').split('|'):
    if '=' in kv: k, v = kv.split('=', 1); EXTRA_VIEWS[k] = v
# the three wall polygons of the night map (layout.js NIGHT.OUTER / INNER / TOWN), only to count what the phone frame can see
POLY = {
  'outer': [[-50, -40], [-18, -54], [22, -52], [52, -32], [58, 8], [40, 44], [-6, 54], [-44, 38], [-60, 2]],
  'inner': [[-40, -30], [-16, -41], [1, -27], [-5, -7], [-29, -2], [-45, -15]],
  'town': [[math.cos(a * math.pi / 180) * r * 1.2, math.sin(a * math.pi / 180) * r * 1.2] for a, r in [[11.6, 132], [41.6, 132], [72, 140], [102, 128], [133, 142], [163, 134], [194, 140], [224, 130], [254, 142], [284, 132], [314, 138], [344, 130]]],
}
STRUCT = ['wall', 'keep', 'townwall', 'vault_ruby', 'vault_emerald', 'vault_turq', 'mine_ruby', 'mine_emerald', 'mine_turq', 'barracks', 'stable', 'training', 'lair', 'workshop', 'forge', 'towers']
want = [s.split('=') for s in SPEC.split(',')]
PROJ = '''(poly) => { const T = __bw.THREE, cam = __bw.camera; cam.updateMatrixWorld(true); const out = {};
  for (const [id, pts] of Object.entries(poly)) { let inn = 0, front = 0; for (const [x, z] of pts) { const v = new T.Vector3(x, 8, z).project(cam); if (v.z < 1) front++; if (v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1) inn++; } out[id] = inn + '/' + pts.length + ' vertices on screen'; }
  return out; }'''
# IDS=1: render the scene once more with a flat shader that paints every pixel with the battle-target id (`aB`) of what is in front, then count the pixels of every wall ring
# (inner / outer / town = the tids a1_rings.js keeps per ring) at the SAME camera and size as the shot.  Also returns a colour map (inner red, outer green, town blue).
IDPASS = '''() => { try {
  const T = __bw.THREE, r = __bw.renderer, scene = __bw.scene, cam = __bw.camera, R = __bw.world.rings.rings;
  const sz = r.getDrawingBufferSize(new T.Vector2()), W = sz.x, H = sz.y;
  const mat = new T.ShaderMaterial({ vertexShader: 'attribute float aB; varying float vB; void main(){ vB = aB; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying float vB; void main(){ float v = floor(vB + 0.5) + 1.0; gl_FragColor = vec4(mod(v, 256.0) / 255.0, floor(v / 256.0) / 255.0, 0.0, 1.0); }' });
  const rt = new T.WebGLRenderTarget(W, H, { type: T.UnsignedByteType, depthBuffer: true });
  const keep = { rt: r.getRenderTarget(), bg: scene.background, fog: scene.fog, om: scene.overrideMaterial, cc: r.getClearColor(new T.Color()), ca: r.getClearAlpha(), auto: r.autoClear, sh: r.shadowMap.autoUpdate };
  const buf = new Uint8Array(W * H * 4);
  try {
    scene.background = null; scene.fog = null; scene.overrideMaterial = mat; r.shadowMap.autoUpdate = false; r.autoClear = true;
    r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear(); r.render(scene, cam); r.readRenderTargetPixels(rt, 0, 0, W, H, buf);
  } finally { scene.background = keep.bg; scene.fog = keep.fog; scene.overrideMaterial = keep.om; r.setRenderTarget(keep.rt); r.setClearColor(keep.cc, keep.ca); r.autoClear = keep.auto; r.shadowMap.autoUpdate = keep.sh; rt.dispose(); mat.dispose(); }
  const ringOf = new Map(); ['inner', 'outer', 'town'].forEach((k, i) => { for (const t of R[k].tids) ringOf.set(t, i); });
  const px = { inner: 0, outer: 0, town: 0 }, names = ['inner', 'outer', 'town'], col = [[255, 60, 60], [60, 255, 60], [80, 120, 255]];
  let other = 0, empty = 0; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cx = cv.getContext('2d'), im = cx.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = ((H - 1 - y) * W + x) * 4, v = buf[s] + 256 * buf[s + 1], d = (y * W + x) * 4; im.data[d + 3] = 255;
    if (v === 0) { empty++; continue; }
    const k = ringOf.get(v - 1);
    if (k == null) { other++; im.data[d] = im.data[d + 1] = im.data[d + 2] = 40; } else { px[names[k]]++; const c = col[k]; im.data[d] = c[0]; im.data[d + 1] = c[1]; im.data[d + 2] = c[2]; }
  }
  cx.putImageData(im, 0, 0);
  return { W, H, px, other, empty, png: cv.toDataURL('image/png') };
} catch (e) { return { err: String(e && e.stack || e).slice(0, 400) }; } }'''
# OCC=ring: what hides that ring?  Two flat-id renders from the shot's camera: A = everything, B = only the ring's own ids (everything else discarded).  Where B has the ring but A shows
# something else, that something is the occluder: grouped by battle-target type / ring (or "no target" = ground, trees, props, plain buildings).  PNG: ring visible = red, hidden behind
# the outer ring = green, behind the town ring = blue, behind another target = yellow, behind ground / scenery = white.
OCCPASS = '''(RING) => { try {
  const T = __bw.THREE, r = __bw.renderer, scene = __bw.scene, cam = __bw.camera, C = __bw.world.ctx, R = __bw.world.rings.rings;
  const mine = new Set(R[RING].tids), lo = Math.min(...mine), hi = Math.max(...mine); let contiguous = (hi - lo + 1) === mine.size;
  const sz = r.getDrawingBufferSize(new T.Vector2()), W = sz.x, H = sz.y;
  const mat = new T.ShaderMaterial({ uniforms: { uOnly: { value: 0 }, uRange: { value: new T.Vector2(lo, hi) } }, vertexShader: 'attribute float aB; varying float vB; void main(){ vB = aB; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uOnly; uniform vec2 uRange; varying float vB; void main(){ float id = floor(vB + 0.5); if (uOnly > 0.5 && (id < uRange.x || id > uRange.y)) discard; float v = id + 1.0; gl_FragColor = vec4(mod(v, 256.0) / 255.0, floor(v / 256.0) / 255.0, 0.0, 1.0); }' });
  const rt = new T.WebGLRenderTarget(W, H, { type: T.UnsignedByteType, depthBuffer: true });
  const keep = { rt: r.getRenderTarget(), bg: scene.background, fog: scene.fog, om: scene.overrideMaterial, cc: r.getClearColor(new T.Color()), ca: r.getClearAlpha(), auto: r.autoClear, sh: r.shadowMap.autoUpdate };
  const A = new Uint8Array(W * H * 4), B = new Uint8Array(W * H * 4);
  try {
    scene.background = null; scene.fog = null; scene.overrideMaterial = mat; r.shadowMap.autoUpdate = false; r.autoClear = true; r.setRenderTarget(rt); r.setClearColor(0x000000, 0);
    mat.uniforms.uOnly.value = 0; r.clear(); r.render(scene, cam); r.readRenderTargetPixels(rt, 0, 0, W, H, A);
    mat.uniforms.uOnly.value = 1; r.clear(); r.render(scene, cam); r.readRenderTargetPixels(rt, 0, 0, W, H, B);
  } finally { scene.background = keep.bg; scene.fog = keep.fog; scene.overrideMaterial = keep.om; r.setRenderTarget(keep.rt); r.setClearColor(keep.cc, keep.ca); r.autoClear = keep.auto; r.shadowMap.autoUpdate = keep.sh; rt.dispose(); mat.dispose(); }
  const tg = new Map(); for (const t of C.targets) tg.set(t.id, t);
  const ringOf = new Map(); ['inner', 'outer', 'town'].forEach((k) => { for (const t of R[k].tids) ringOf.set(t, k); });
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cx = cv.getContext('2d'), im = cx.createImageData(W, H);
  let potential = 0, visible = 0; const by = {}, ids = {};
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = ((H - 1 - y) * W + x) * 4, d = (y * W + x) * 4, a = A[s] + 256 * A[s + 1], b = B[s] + 256 * B[s + 1]; im.data[d + 3] = 255;
    const g = 50 + ((x + y) & 1) * 0; im.data[d] = im.data[d + 1] = im.data[d + 2] = g;
    if (!b) continue; potential++;
    if (mine.has(a - 1)) { visible++; im.data[d] = 255; im.data[d + 1] = 40; im.data[d + 2] = 40; continue; }
    const t = tg.get(a - 1), rk = ringOf.get(a - 1); let key, col;
    if (rk === 'outer') { key = 'ring outer'; col = [60, 255, 60]; } else if (rk === 'town') { key = 'ring town'; col = [80, 120, 255]; }
    else if (t) { key = 'target ' + (t.type || '?') + (t.ringId ? '/' + t.ringId : ''); col = [255, 220, 40]; } else { key = 'no target (ground / scenery / plain buildings)'; col = [235, 235, 235]; }
    by[key] = (by[key] || 0) + 1; ids[a - 1] = (ids[a - 1] || 0) + 1; im.data[d] = col[0]; im.data[d + 1] = col[1]; im.data[d + 2] = col[2];
  }
  cx.putImageData(im, 0, 0);
  const top = Object.entries(ids).sort((p, q) => q[1] - p[1]).slice(0, 8).map(([id, n]) => { const t = tg.get(+id - 0); return { id: +id, px: n, type: t ? (t.type || '?') + (t.ringId ? '/' + t.ringId : '') : 'none' }; });
  return { W, H, ring: RING, contiguous, tids: [...mine].length, potential, visible, hiddenBy: by, top, png: cv.toDataURL('image/png') };
} catch (e) { return { err: String(e && e.stack || e).slice(0, 400) }; } }'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if (m.type in ('error', 'warning') and '404' not in m.text) or m.text.startswith('[late]') or m.text.startswith('A1') or m.text.startswith('a1_rings') else None)
        if os.environ.get('INNERH'): await pg.add_init_script('window.__a1InnerH = ' + os.environ['INNERH'])      # try another keep-ring height (a1_rings.js INNER_H reads it at load)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:8777/dev.html?q=low&w=clear&h=14&wa=0.1')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        print('home ready', T(), 'viewport', W, H, flush=True)
        # finish the intro the way a player's first touch does (it flies to the controller's own home pose)
        to = await pg.evaluate('() => { const c = __bw.ctl; return c.intro ? { dist: c.intro.to.dist, azim: c.intro.to.azim, polar: c.intro.to.polar, tx: c.intro.to.tx, tz: c.intro.to.tz } : null; }')
        print('intro end pose (the controller\'s own home camera)', json.dumps(to), flush=True)
        await pg.evaluate('() => { const c = __bw.ctl; if (c.intro) { c.intro.hold = false; c._skipIntro(); } }')
        for i in range(120):                                   # software GL draws a frame every few seconds while the late assets stream in: wait for the controller to end the intro by itself
            if not await pg.evaluate('() => !!__bw.ctl.intro'): break
            await asyncio.sleep(1)
        if await pg.evaluate('() => !!__bw.ctl.intro') and to:  # still flying: land it by hand on the same pose
            await pg.evaluate('(t) => { const c = __bw.ctl; c.intro = null; c.dist = t.dist; c.azim = t.azim; c.polar = t.polar; c.target.set(t.tx, 0, t.tz); }', to)
        await asyncio.sleep(6)
        cam = await pg.evaluate('() => { const c = __bw.ctl; return { intro: !!c.intro, dist: +c.dist.toFixed(1), maxD: c.maxD, minD: c.minD, polar: +c.polar.toFixed(3), azim: +c.azim.toFixed(3), target: [+c.target.x.toFixed(1), +c.target.z.toFixed(1)] }; }')
        print('home camera after the intro', json.dumps(cam), flush=True)
        for nm, spec in want:
            kind, arg = spec.split(':', 1)
            if kind == 'S':
                await pg.evaluate('(n) => { __bw.world.setLevel(n); }', int(arg))
            else:
                k, w = [int(x) for x in arg.split('/')]
                o = {e: k for e in STRUCT}; o['wall'] = w
                await pg.evaluate('(o) => { __bw.world.levels.setMany(o); }', o)
            st = await pg.evaluate('() => __bw.world.rings ? __bw.world.rings.state() : null')
            lvl = await pg.evaluate("() => ({ wallLevelInternal: +__bw.world.levels.get('wall').toFixed(3), keepLevelInternal: +__bw.world.levels.get('keep').toFixed(3) })")
            print('SHOT', nm, spec, 'rings', json.dumps(st), json.dumps(lvl), flush=True)
            await asyncio.sleep(SETTLE)
            await pg.evaluate('() => { if (__bw.dynTo) __bw.dynTo(1); }')                  # the dynamic-resolution scaler drops the buffer in slow software GL: hold the full 1:1 size for the frame and the id passes
            await asyncio.sleep(4)
            st2 = await pg.evaluate('() => __bw.world.rings ? __bw.world.rings.state() : null')
            print('   after settle: active', json.dumps(st2 and st2['active']), 'runs', st2 and st2['runs'], flush=True)
            print('   on screen', json.dumps(await pg.evaluate(PROJ, POLY)), flush=True)
            f = f'{OUT}_{nm}_home.png'
            await pg.screenshot(path=f, timeout=240000)
            print('   frame', f, T(), flush=True)
            if os.environ.get('IDS'):
                res = await pg.evaluate(IDPASS)
                if res.get('err'): print('   ids FAILED', res['err'], flush=True)
                else:
                    import base64
                    open(f'{OUT}_{nm}_ringmap.png', 'wb').write(base64.b64decode(res.pop('png').split(',', 1)[1]))
                    print('   ring pixels at', res['W'], 'x', res['H'], json.dumps(res['px']), 'other-geometry', res['other'], 'empty', res['empty'], flush=True)
            if os.environ.get('OCC'):
                import base64
                oc = await pg.evaluate(OCCPASS, os.environ['OCC'])
                if oc.get('err'): print('   occ FAILED', oc['err'], flush=True)
                else:
                    open(f'{OUT}_{nm}_occ_{oc["ring"]}.png', 'wb').write(base64.b64decode(oc.pop('png').split(',', 1)[1]))
                    print('   occ', json.dumps(oc), flush=True)
            for vn, js in EXTRA_VIEWS.items():
                await pg.evaluate('() => { const c = __bw.ctl; ' + js + ' }')
                await asyncio.sleep(SETTLE)
                f = f'{OUT}_{nm}_{vn}.png'
                await pg.screenshot(path=f, timeout=240000)
                print('   frame', f, T(), flush=True)
                await pg.evaluate('(c0) => { const c = __bw.ctl; c.target.set(c0.target[0], 0, c0.target[1]); c.dist = c0.dist; c.polar = c0.polar; c.azim = c0.azim; }', cam)
                await asyncio.sleep(2)
        print('LOGS', json.dumps(logs[:40]))
        await b.close()
asyncio.run(main())
