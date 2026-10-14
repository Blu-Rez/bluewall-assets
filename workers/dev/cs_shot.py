import asyncio, sys, os, json
from playwright.async_api import async_playwright
# cs_shot.py OUT "js-setup" "name=cx,cy,cz,tx,ty,tz" ...   : the real game (dev_s35.html), free camera, one screenshot per view
async def main():
    out = sys.argv[1]; views = sys.argv[2:]
    W = int(os.environ.get('W', 1000)); H = int(os.environ.get('H', 600))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type in ('error',) and '404' not in m.text else None)
        await pg.goto('http://127.0.0.1:8777/' + os.environ.get('PAGE', 'dev_s35.html') + '?q=' + os.environ.get('Q', 'low') + '&w=clear&h=' + os.environ.get('HOUR', '13') + '&wa=0.1' + ('&lv=' + os.environ['LV'] if os.environ.get('LV') else ''))
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); }')
        if os.environ.get('HIDEUI'): await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; }")
        await asyncio.sleep(2)
        for v in views:
            name, _, c = v.partition('=')
            if c.startswith('js:'): print('js', name, json.dumps(await pg.evaluate(c[3:]))[:500]); continue
            a = [float(x) for x in c.split(',')]
            await pg.evaluate('(a) => { const B = __bw; B.ctl.update = () => {}; const c = B.camera; c.fov = a[6] || 35; c.updateProjectionMatrix(); c.position.set(a[0], a[1], a[2]); c.lookAt(a[3], a[4], a[5]); c.updateMatrixWorld(true); }', a)
            f0 = await pg.evaluate('__bw.frames')
            for i in range(120):
                if await pg.evaluate(f'__bw.frames >= {f0} + 4'): break
                await asyncio.sleep(0.5)
            await pg.screenshot(path=f'{out}_{name}.png', timeout=240000); print('shot', name, flush=True)
        print('\n'.join(logs[:20]))
        await b.close()
asyncio.run(main())
