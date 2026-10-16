import asyncio, sys, os, json
from playwright.async_api import async_playwright
# st1_lab.py MODE OUT.png cells.json   MODE = models | yards      env CW CH COLS
async def main():
    mode, out, cells = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3]))
    cw = int(os.environ.get('CW', 360)); ch = int(os.environ.get('CH', 300)); cols = int(os.environ.get('COLS', 3))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1200, 'height': 800})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300]) if m.type in ('error', 'warning') else None); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/tr2h4_lab.html')
        for i in range(120):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print('err', await pg.evaluate('window.__err||null'))
        st = await pg.evaluate(f'window.__{mode}({json.dumps(cells)}, {{cw: {cw}, ch: {ch}, cols: {cols}}})')
        for s in st: print(json.dumps(s))
        el = await pg.query_selector('#out'); await el.screenshot(path=out, timeout=120000)
        for l in logs[-10:]: print(l)
        await b.close()
asyncio.run(main())
