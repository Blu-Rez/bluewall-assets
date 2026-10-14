import asyncio, sys, os
from playwright.async_api import async_playwright
async def main():
    out = sys.argv[1]; W = int(os.environ.get('W', 390)); H = int(os.environ.get('H', 844)); js = sys.argv[2] if len(sys.argv) > 2 else ''
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=2)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:200]) if m.type == 'error' else None)
        await pg.goto('http://127.0.0.1:8777/hud_dev.html' + (os.environ.get('Q') or ''))
        for i in range(60):
            await asyncio.sleep(0.3)
            if await pg.evaluate('!!window.__ready'): break
        if js: await pg.evaluate(js)
        await asyncio.sleep(1.2)
        await pg.screenshot(path=out); print(logs[:5]); await b.close()
asyncio.run(main())
