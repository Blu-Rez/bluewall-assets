import asyncio, sys, os, json
from playwright.async_api import async_playwright
# TR2-S3: castle frames at several levels in ONE game session (the level is changed live with world.setLevel).
#   PAGE=dev_s50.html python3 dev/tr2_s3_frames.py OUT "26:gate,over" "32:over" ...      (cap 50 page: dev_s50.html, cap 30 page: dev_s35.html)
VIEWS = {
  'gate': (80, 14, 42, 49, 8, 26, 40),
  'over': (60, 75, 115, 0, 6, -5, 40),
  'keep': (10, 26, 20, -21, 10, -20, 40),
  'ctr':  (0, 150, 150, 0, 0, 0, 40),
  'wall': (20, 22, -75, 20, 5, -48, 40),
}
async def main():
    out = sys.argv[1]; specs = sys.argv[2:]
    W = int(os.environ.get('W', 1000)); H = int(os.environ.get('H', 600))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if (m.type in ('error', 'warning') and '404' not in m.text) else None)
        first = specs[0].split(':')[0]
        await pg.goto('http://127.0.0.1:8777/' + os.environ.get('PAGE', 'dev_s50.html') + '?q=' + os.environ.get('Q', 'low') + '&w=clear&h=' + os.environ.get('HOUR', '13') + '&wa=0.1&lv=' + first)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); }')
        await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; }")
        await asyncio.sleep(2)
        cur = first
        for sp in specs:
            lv, _, vs = sp.partition(':')
            if lv != cur or True:
                b0 = await pg.evaluate('__bw.world.tr2c ? __bw.world.tr2c.state().builds : -1')
                await pg.evaluate(f'__bw.world.setLevel({int(lv)})'); cur = lv
                for i in range(240):
                    await asyncio.sleep(0.5)
                    st = await pg.evaluate('__bw.world.tr2c ? __bw.world.tr2c.state() : null')
                    if st is None or st['builds'] > b0 or i > 20: break
                for i in range(60):                                      # (a tier that is still loading: the castle is rebuilt when it arrives)
                    await asyncio.sleep(0.5)
                    st2 = await pg.evaluate('__bw.world.tr2c ? __bw.world.tr2c.state() : null')
                    if st2 is None or st2['builds'] == (st or {}).get('builds'): break
                    st = st2
                st = await pg.evaluate('__bw.world.tr2c ? __bw.world.tr2c.state() : null')
                print('LV', lv, json.dumps({k: st[k] for k in ('sig', 'builds', 'tris', 'meshes', 'held', 'failed')} if st else None), json.dumps((st or {}).get('last', {}).get('counts')), flush=True)
            for v in (vs.split(',') if vs else ['over']):
                a = list(VIEWS[v])
                await pg.evaluate('(a) => { const B = __bw; B.ctl.update = () => {}; const c = B.camera; c.fov = a[6] || 35; c.updateProjectionMatrix(); c.position.set(a[0], a[1], a[2]); c.lookAt(a[3], a[4], a[5]); c.updateMatrixWorld(true); }', a)
                f0 = await pg.evaluate('__bw.frames')
                for i in range(120):
                    if await pg.evaluate(f'__bw.frames >= {f0} + 4'): break
                    await asyncio.sleep(0.5)
                await pg.screenshot(path=f'{out}_{lv}_{v}.png', timeout=240000); print('shot', lv, v, flush=True)
        print('\n'.join(logs[:30]))
        await b.close()
asyncio.run(main())
