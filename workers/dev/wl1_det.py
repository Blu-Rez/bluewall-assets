import asyncio, sys, os, json, time, re
from playwright.async_api import async_playwright
# wl1_det.py : is the per-ring pixel count of the SAME camera stable from one render to the next?  (the first runs gave inner = 270 / 0 / 880 px for the same frame)
# loads the home map once, sets LEVEL, then samples N times: (a) several id renders inside ONE evaluate (no game frame in between), (b) one per second.  Also prints which Tripo cell meshes are visible (hi / lo).
LEVEL = int(os.environ.get('LEVEL', 50)); N = int(os.environ.get('N', 8)); W = int(os.environ.get('W', 844)); H = int(os.environ.get('H', 390))
src = open('/home/claude/dev/wl1_shot.py').read()
IDPASS = re.search(r"IDPASS = '''(.*?)'''\n", src, re.S).group(1)
SAMPLE = '''() => { const o = (%s)(); const vis = []; __bw.scene.traverse((m) => { if (m.isMesh && m.name === 'static-tr2') vis.push((m.userData.tr2lod || '?') + (m.visible ? '+' : '-')); });
  const st = __bw.world.tr2c && __bw.world.tr2c.state ? 1 : 0; return { px: o.px, W: o.W, H: o.H, frame: __bw.frames, tr2: vis.sort().join(' '), cam: __bw.camera.position.toArray().map((v) => +v.toFixed(1)) }; }''' % IDPASS
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        if os.environ.get('INNERH'): await pg.add_init_script('window.__a1InnerH = ' + os.environ['INNERH'])
        await pg.goto('http://127.0.0.1:8777/dev.html?q=low&w=clear&h=14&wa=0.1')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        to = await pg.evaluate('() => { const c = __bw.ctl; return c.intro ? { dist: c.intro.to.dist, azim: c.intro.to.azim, polar: c.intro.to.polar, tx: c.intro.to.tx, tz: c.intro.to.tz } : null; }')
        await pg.evaluate('() => { const c = __bw.ctl; if (c.intro) { c.intro.hold = false; c._skipIntro(); } }')
        for i in range(120):
            if not await pg.evaluate('() => !!__bw.ctl.intro'): break
            await asyncio.sleep(1)
        if await pg.evaluate('() => !!__bw.ctl.intro') and to:
            await pg.evaluate('(t) => { const c = __bw.ctl; c.intro = null; c.dist = t.dist; c.azim = t.azim; c.polar = t.polar; c.target.set(t.tx, 0, t.tz); }', to)
        await asyncio.sleep(6)
        await pg.evaluate('(n) => { __bw.world.setLevel(n); if (__bw.dynTo) __bw.dynTo(1); }', LEVEL)
        await asyncio.sleep(20)
        print('level', LEVEL, 'rings', json.dumps(await pg.evaluate('() => __bw.world.rings.state().active')), flush=True)
        for i in range(N):
            a = await pg.evaluate(SAMPLE); a2 = await pg.evaluate(SAMPLE)       # two evaluates back to back (almost no game frame between)
            print(i, 'frame', a['frame'], json.dumps(a['px']), '| next', a2['frame'], json.dumps(a2['px']), '| size', a['W'], a['H'], '| tr2', a['tr2'], '| cam', a['cam'], flush=True)
            await asyncio.sleep(3)
        await b.close()
asyncio.run(main())
