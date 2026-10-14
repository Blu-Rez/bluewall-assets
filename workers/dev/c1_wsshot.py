import asyncio, sys, os, json
from playwright.async_api import async_playwright
# wsshot.py OUTPREFIX id:lv:az:dist:polar[:ty] ...   (fast preview of single worksites on the real terrain)
async def main():
    out = sys.argv[1]; jobs = sys.argv[2:]
    W = int(os.environ.get('W', 900)); H = int(os.environ.get('H', 560))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300])); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/c1_ws_dev.html')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print('err', await pg.evaluate('window.__err||null'))
        await pg.evaluate(f"window.__aim=[{os.environ.get('AIM','0,0')}]; window.__simSecs={os.environ.get('SIM','12')}; window.__aimCart={os.environ.get('CART','null')}")
        for j in jobs:
            f = j.split(':'); id_ = f[0]; lv = int(f[1]) if len(f) > 1 else 30; az = float(f[2]) if len(f) > 2 else 0.6; d = float(f[3]) if len(f) > 3 else 60; po = float(f[4]) if len(f) > 4 else 0.9; ty = float(f[5]) if len(f) > 5 else 3
            r = await pg.evaluate(f'window.__show("{id_}",{lv},{az},{d},{po},{ty})'); print(id_, lv, r)
            await asyncio.sleep(1.2)
            await pg.screenshot(path=f'{out}_{id_}_{lv}.png', timeout=120000)
        for l in logs[-10:]: print(l)
        await b.close()
asyncio.run(main())
