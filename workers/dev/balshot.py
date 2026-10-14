import asyncio, sys, os
from playwright.async_api import async_playwright
async def main():
    out = sys.argv[1]; mode = sys.argv[2]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': int(os.environ.get('W',800)), 'height': int(os.environ.get('H',500))})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300])); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/bal2_dev.html?m=' + mode)
        for i in range(120):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        await asyncio.sleep(1.5)
        await pg.screenshot(path=out)
        print(await pg.evaluate('String(window.__err)'))
        for l in logs[-8:]: print(l)
        await b.close()
asyncio.run(main())
