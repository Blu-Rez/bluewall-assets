import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    out = sys.argv[1]
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1008, 'height': 760})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append(m.text[:300]) if m.type == 'error' else None)
        await pg.goto('http://127.0.0.1:8777/emb_dev.html')
        await asyncio.sleep(1.5)
        await pg.screenshot(path=out)
        print('ERR', errs)
        await b.close()
asyncio.run(main())
