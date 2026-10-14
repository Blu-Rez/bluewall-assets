import asyncio, sys, os, json
from playwright.async_api import async_playwright
# b2_shot.py OUT.png 'query string' [W H]   — screenshot of b2_dev.html (the B2 kit viewer).  e.g.  python3 dev/b2_shot.py /home/claude/work/a.png 'mode=pieces&kit=/b2_out/kit_explore.glb&dist=120'
async def main():
    out, qs = sys.argv[1], sys.argv[2]; W = int(sys.argv[3]) if len(sys.argv) > 3 else 1500; H = int(sys.argv[4]) if len(sys.argv) > 4 else 900
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}); logs = []
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300])); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/b2_dev.html?' + qs)
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print('err', await pg.evaluate('window.__err||null'), 'stats', await pg.evaluate('window.__stats||null'))
        await asyncio.sleep(0.5); await pg.screenshot(path=out, timeout=120000)
        for l in logs[-8:]: print(l)
        await b.close()
asyncio.run(main())
