import asyncio, sys, os
from playwright.async_api import async_playwright
async def main():
    out = sys.argv[1]; t = os.environ.get('T', '640')
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:200]) if m.type == 'error' else None)
        await pg.goto('http://127.0.0.1:8777/rank_dev.html?t=' + t)
        for i in range(60):
            await asyncio.sleep(0.3)
            if await pg.evaluate('!!window.__ready'): break
        await asyncio.sleep(0.8); await pg.screenshot(path=out + '_chip.png')
        await pg.evaluate('__r.open()'); await asyncio.sleep(1.0); await pg.screenshot(path=out + '_lb.png')
        await pg.click('.bwk-tabs button[data-t=lg]'); await asyncio.sleep(0.6); await pg.screenshot(path=out + '_lg.png')
        await pg.click('.bwk-tabs button[data-t=inv]'); await asyncio.sleep(0.6); await pg.screenshot(path=out + '_inv.png')
        await pg.click('.bwk-sh'); await asyncio.sleep(0.3); print('shared', await pg.evaluate('window.__shared'))
        print(logs[:5]); await b.close()
asyncio.run(main())
