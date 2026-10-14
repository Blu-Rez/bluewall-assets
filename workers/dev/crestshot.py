import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1290,'height':900})
        await pg.goto('http://127.0.0.1:8777/crest_dev.html')
        for i in range(40):
            await asyncio.sleep(0.3)
            if await pg.evaluate('!!window.__ready'): break
        await asyncio.sleep(0.5); await pg.screenshot(path=sys.argv[1], full_page=True); await b.close()
asyncio.run(main())
