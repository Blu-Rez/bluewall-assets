import asyncio, os
from playwright.async_api import async_playwright
# the path gate (useComposer) at the high tier, nolate (fast): pathReady decides when the bloom path may be used
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=high&w=clear&h=14&wa=0.1&lv=30&nolate=1')
        for i in range(4000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        ev = lambda js: pg.evaluate(js)
        r = {}
        r['day, nothing ready'] = await ev("() => { __bw.P().night = 0; return __bw.useComposer(); }")
        r['night, nothing ready'] = await ev("() => { __bw.P().night = 0.9; return __bw.useComposer(); }")
        r['night, screen ready only'] = await ev("() => { __bw.pathReady.screen = true; return __bw.useComposer(); }")
        r['night, both ready'] = await ev("() => { __bw.pathReady.rt = true; return __bw.useComposer(); }")
        r['day, both ready'] = await ev("() => { __bw.P().night = 0; return __bw.useComposer(); }")
        r['day, rt ready only (started at night)'] = await ev("() => { __bw.pathReady.screen = false; return __bw.useComposer(); }")
        exp = {'day, nothing ready': False, 'night, nothing ready': True, 'night, screen ready only': False, 'night, both ready': True, 'day, both ready': False, 'day, rt ready only (started at night)': True}
        ok = all(r[k] == v for k, v in exp.items())
        for k, v in r.items(): print(('OK  ' if v == exp[k] else 'FAIL'), k, v)
        print('errors', errs[:3]); print('GATE OK' if ok and not errs else 'GATE FAIL')
        await b.close()
asyncio.run(main())
