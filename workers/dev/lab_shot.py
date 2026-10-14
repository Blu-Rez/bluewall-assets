import asyncio, sys, os, json
from playwright.async_api import async_playwright
# usage: lab_shot.py PAGE OUTPREFIX "name=JS" ...   (JS runs, 3 frames, screenshot)
async def main():
    page, out = sys.argv[1], sys.argv[2]; steps = sys.argv[3:]
    W = int(os.environ.get('W', 1400)); H = int(os.environ.get('H', 800))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:900]) if '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:500]))
        await pg.goto('http://127.0.0.1:8777/' + page)
        for i in range(600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print('err', await pg.evaluate('window.__err||""'))
        for s in steps:
            name, js = s.split('=', 1)
            if js: print('JS', name, await pg.evaluate(js))
            f0 = await pg.evaluate('window.__frames')
            for i in range(200):
                await asyncio.sleep(0.2)
                if await pg.evaluate(f'window.__frames >= {f0} + 3'): break
            await pg.screenshot(path=f'{out}_{name}.png', timeout=120000)
            print('shot', name)
        for l in logs[-20:]: print(l[:900])
        await b.close()
asyncio.run(main())
