import asyncio, sys, os
from playwright.async_api import async_playwright
# u3_shot.py OUT.png "query" [W H] [wait s]   — one screenshot of u3_lab.html (the browser job: run it alone)
async def main():
    out, qs = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else ''
    W = int(sys.argv[3]) if len(sys.argv) > 3 else 1100; H = int(sys.argv[4]) if len(sys.argv) > 4 else 520; wait = float(sys.argv[5]) if len(sys.argv) > 5 else 2
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}); logs = []
        pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type in ('error', 'warning', 'log') and 'GPU stall' not in m.text else None)
        await pg.goto('http://127.0.0.1:8777/' + os.environ.get('PAGE', 'u3_lab.html') + '?' + qs)
        for i in range(240):
            await asyncio.sleep(0.5)
            if os.environ.get('PAGE') or await pg.evaluate('(window.__frames||0) > 3 || !!window.__err'): break
        await asyncio.sleep(wait)
        err = await pg.evaluate('window.__err||null'); await pg.screenshot(path=out); print(out, 'ERR' if err else 'ok', err or '', logs[:8]); await b.close()
asyncio.run(main())
