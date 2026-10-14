import asyncio, sys, os, json
from playwright.async_api import async_playwright
# b3_sheet.py OUT.png [cells.json]   — renders the numbered civic sample sheet (default: 5 kinds x levels 1 / 15 / 30).  env: CW CH COLS
CAM = {"market": dict(dist=64, ty=1.5, polar=1.0), "tavern": dict(dist=46, ty=3, polar=1.0), "townhall": dict(dist=54, ty=3, polar=1.0), "well": dict(dist=17, ty=1.5, polar=1.0), "chapel": dict(dist=56, ty=6, polar=1.0)}
DEFAULT = [dict(kind=k, lv=lv, seed=7, **CAM[k]) for k in ("market", "tavern", "townhall", "well", "chapel") for lv in (1, 15, 30)]
async def main():
    out = sys.argv[1]; cells = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else DEFAULT
    cw = int(os.environ.get('CW', 400)); ch = int(os.environ.get('CH', 330)); cols = int(os.environ.get('COLS', 3))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1200, 'height': 800})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300])); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/b3_sheet.html')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print('err', await pg.evaluate('window.__err||null'))
        st = await pg.evaluate(f'window.__sheet({json.dumps(cells)}, {{cw: {cw}, ch: {ch}, cols: {cols}}})')
        for s in st: print(json.dumps(s))
        if os.environ.get('COST'): print('COST', json.dumps(await pg.evaluate('window.__cost()')))
        el = await pg.query_selector('#out'); await el.screenshot(path=out, timeout=120000)
        for l in logs[-8:]: print(l)
        await b.close()
asyncio.run(main())
