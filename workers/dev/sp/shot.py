import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':780,'height':400}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto('http://127.0.0.1:8793/' + (sys.argv[2] if len(sys.argv)>2 else 'lab.html')); await asyncio.sleep(1)
        await pg.screenshot(path=sys.argv[1]); print(errs[:3]); await b.close()
asyncio.run(main())
