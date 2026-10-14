import asyncio, sys, os
from playwright.async_api import async_playwright
# lookshot.py OUT "query"  (env W,H,WAIT,JS)
async def main():
    out, qs = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else ''
    W = int(os.environ.get('W', 1100)); H = int(os.environ.get('H', 520))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:200]) if m.type in ('error', 'warning') else None)
        await pg.goto('http://127.0.0.1:8777/look_dev.html?' + qs)
        for i in range(120):
            await asyncio.sleep(0.5)
            if await pg.evaluate('(window.__frames||0) > 3'): break
        if os.environ.get('JS'): await pg.evaluate(os.environ['JS'])
        await asyncio.sleep(float(os.environ.get('WAIT', 2)))
        await pg.screenshot(path=out); print(logs[:6]); await b.close()
asyncio.run(main())
