import asyncio, sys, json, urllib.parse
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        pg = await b.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto('http://127.0.0.1:8777/u4_probe.html?url=' + urllib.parse.quote(sys.argv[1]))
        for i in range(120):
            if await pg.evaluate('!!window.__done'): break
            await asyncio.sleep(1)
        print(json.dumps(await pg.evaluate('window.__out'), indent=None)); print('errs', errs[:3]); await b.close()
asyncio.run(main())
