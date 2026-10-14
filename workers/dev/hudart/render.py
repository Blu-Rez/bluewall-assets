import asyncio, sys
from playwright.async_api import async_playwright
# render.py art.html id [id...] -> out/<id>.png at 3x, transparent
async def main():
    page = sys.argv[1]; ids = sys.argv[2:]
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 900, 'height': 700}, device_scale_factor=3)
        errs = []; pg.on('console', lambda m: errs.append(m.text[:200]) if m.type == 'error' else None)
        await pg.goto('http://127.0.0.1:8777/hudart/' + page); await asyncio.sleep(0.8)
        for i in ids:
            await pg.locator('#' + i).screenshot(path=f'/home/claude/dev/hudart/out/{i}.png', omit_background=True)
        print('ok', errs[:3]); await b.close()
asyncio.run(main())
