import asyncio, sys, os, json
from playwright.async_api import async_playwright
# page.py "url-path?query" [outfile] [W H]: load a page of the 8777 server, wait for window.__ready, print window.__out (and console errors); optional screenshot
async def main():
    url = sys.argv[1]; shot = sys.argv[2] if len(sys.argv) > 2 else None
    W = int(sys.argv[3]) if len(sys.argv) > 3 else 600; H = int(sys.argv[4]) if len(sys.argv) > 4 else 600
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        try:
            pg = await b.new_page(viewport={'width': W, 'height': H}); logs = []
            pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error', 'warning') and '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
            await pg.goto('http://127.0.0.1:8777/' + url)
            for i in range(240):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            print(await pg.evaluate('window.__out || ""'))
            if shot: await pg.screenshot(path=shot, full_page=True)
            for l in logs[-10:]: print(l)
        finally:
            await b.close()
asyncio.run(main())
