# glshot.py URL OUT W H : screenshot of a small WebGL dev page (swiftshader), waits for window.__ready
import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    url, out = sys.argv[1], sys.argv[2]; w = int(sys.argv[3]) if len(sys.argv) > 3 else 390; h = int(sys.argv[4]) if len(sys.argv) > 4 else 844
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': w, 'height': h}); errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: errs.append(m.type + ' ' + m.text[:400]) if m.type in ('error', 'warning') else None)
        for u in url.split('|'):
            await pg.goto(u)
            for i in range(240):
                await asyncio.sleep(0.25)
                if await pg.evaluate('!!window.__ready'): break
            o = out if '|' not in url else out.replace('.png', '_%d.png' % url.split('|').index(u))
            await pg.screenshot(path=o)
        print('ERR', errs); await b.close()
asyncio.run(main())
