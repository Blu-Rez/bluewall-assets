import asyncio, sys
from playwright.async_api import async_playwright
# cshot.py page.html out.png [dpr] [W H]   (page relative to /s33/)
async def main():
    page, out = sys.argv[1], sys.argv[2]; dpr = float(sys.argv[3]) if len(sys.argv) > 3 else 2
    W = int(sys.argv[4]) if len(sys.argv) > 4 else 390; H = int(sys.argv[5]) if len(sys.argv) > 5 else 844
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=dpr)
        pg.on('pageerror', lambda e: print('ERR', e)); pg.on('console', lambda m: print('LOG', m.text[:200]) if m.type == 'error' and '404' not in m.text else None)
        await pg.goto('http://127.0.0.1:8777/s33/' + page)
        for i in range(60):
            if await pg.evaluate('!!window.__done'): break
            await asyncio.sleep(0.2)
        await asyncio.sleep(0.8)
        await pg.screenshot(path=out); await b.close()
asyncio.run(main())
