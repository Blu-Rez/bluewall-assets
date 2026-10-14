import asyncio, sys, os, json
from playwright.async_api import async_playwright
# shot.py OUTPREFIX id:lv:az:dist:polar[:ty] ...   (TR2-S4b: worksites with the Tripo models)  env: W H AIM=x,z  TR2OFF=1  LIST=1
async def main():
    out = sys.argv[1]; jobs = sys.argv[2:]
    W = int(os.environ.get('W', 1100)); H = int(os.environ.get('H', 700))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300])); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/tr2_s4b/ws_dev.html' + ('?cap=' + os.environ['CAP'] if os.environ.get('CAP') else ''))
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print('err', await pg.evaluate('window.__err||null'))
        if os.environ.get('LIST'): print(await pg.evaluate('JSON.stringify(window.__ids)'))
        await pg.evaluate(f"window.__aim=[{os.environ.get('AIM','0,0')}]; window.__tr2off={1 if os.environ.get('TR2OFF') else 0}; window.__far={1 if os.environ.get('FAR') else 0}")
        for j in jobs:
            f = j.split(':'); id_ = f[0]; lv = int(f[1]) if len(f) > 1 else 30; az = float(f[2]) if len(f) > 2 else 0.6; d = float(f[3]) if len(f) > 3 else 60; po = float(f[4]) if len(f) > 4 else 0.9; ty = float(f[5]) if len(f) > 5 else 3
            r = await pg.evaluate(f'window.__show("{id_}",{lv},{az},{d},{po},{ty})'); print(id_, lv, r)
            await asyncio.sleep(0.8)
            await pg.screenshot(path=f'{out}_{id_}_{lv}.png', timeout=120000)
        for l in logs[-12:]: print(l)
        await b.close()
asyncio.run(main())
