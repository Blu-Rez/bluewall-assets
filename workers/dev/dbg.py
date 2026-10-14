import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    page=sys.argv[1]; js=sys.argv[2]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 600, 'height': 400})
        pg.on('console', lambda m: print('LOG', m.type, m.text[:300]) if '404' not in m.text else None); pg.on('pageerror', lambda e: print('PAGEERR', str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/'+page)
        for i in range(300):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        await asyncio.sleep(1.5)
        print(await pg.evaluate(js))
        await b.close()
asyncio.run(main())
