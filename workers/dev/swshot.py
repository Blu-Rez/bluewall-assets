import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    out = sys.argv[1]; S = int(sys.argv[2]) if len(sys.argv) > 2 else 512
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':S,'height':S})
        pg.on('pageerror', lambda e: print('E', str(e)[:300])); pg.on('console', lambda m: print('C', m.text[:200]) if m.type == 'error' else None)
        await pg.goto(f'http://127.0.0.1:8777/sw_dev.html?s={S}')
        for i in range(30):
            await asyncio.sleep(0.3)
            if await pg.evaluate('!!window.__ready'): break
        print(await pg.evaluate('window.__build()'))
        await asyncio.sleep(0.5)
        await pg.screenshot(path=out, omit_background=True); await b.close()
asyncio.run(main())
