# pageshot.py URL OUT [W H] : full-page screenshot of a 2D dev page (waits for window.__ready)
import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    url, out = sys.argv[1], sys.argv[2]; w = int(sys.argv[3]) if len(sys.argv) > 3 else 1640; h = int(sys.argv[4]) if len(sys.argv) > 4 else 900
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': w, 'height': h})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append(m.text[:300]) if m.type == 'error' else None)
        await pg.goto(url)
        for i in range(120):
            await asyncio.sleep(0.25)
            if await pg.evaluate('!!window.__ready'): break
        await pg.screenshot(path=out, full_page=True); print('ERR', errs); await b.close()
asyncio.run(main())
