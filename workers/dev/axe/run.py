import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(); errs=[]; pg.on('console', lambda m: errs.append(m.text[:200]))
        await pg.goto('http://127.0.0.1:8777/axe/' + sys.argv[1])
        for i in range(60):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__out'): break
        print(await pg.evaluate('window.__out'), errs[:5]); await b.close()
asyncio.run(main())
