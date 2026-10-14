import asyncio, sys, os
from playwright.async_api import async_playwright
# u4_crowd_shot.py OUT.png "query" [W H]
async def main():
    out, q = sys.argv[1], sys.argv[2]; W = int(sys.argv[3]) if len(sys.argv) > 3 else 900; H = int(sys.argv[4]) if len(sys.argv) > 4 else 420
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}); logs = []
        pg.on('console', lambda m: logs.append(m.text[:300]) if m.type in ('error','warning') else None); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/u4_crowd_dev.html?' + q)
        for i in range(120):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        await asyncio.sleep(2); await pg.screenshot(path=out); print('PERF', await pg.evaluate('JSON.stringify(window.__perf())')); print(logs[:5]); await b.close()
asyncio.run(main())
