import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    out = sys.argv[1]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1000, 'height': 640})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append(m.text[:300]) if m.type == 'error' else None)
        await pg.goto('http://127.0.0.1:8777/ruins_dev.html')
        for i in range(60):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__done'): break
        await asyncio.sleep(1.5)
        await pg.screenshot(path=out + '_a.png')
        await pg.evaluate('__view(-30, 14, 40, -30, 2, 2)'); await asyncio.sleep(1.2); await pg.screenshot(path=out + '_b.png')
        await pg.evaluate('__view(30, 30, -6, 4, 4, -34)'); await asyncio.sleep(1.2); await pg.screenshot(path=out + '_c.png')
        print('ERR', errs)
        await b.close()
asyncio.run(main())
