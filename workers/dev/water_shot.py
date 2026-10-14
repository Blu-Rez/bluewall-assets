# water_shot.py QUERY OUT1:cam1 [OUT2:cam2 ...]   cam = px,py,pz,tx,ty,tz  (env W,H,WAIT,JS)
import asyncio, sys, os
from playwright.async_api import async_playwright
async def main():
    qs = sys.argv[1]; views = [a.split(':') for a in sys.argv[2:]]
    W = int(os.environ.get('W', 390)); H = int(os.environ.get('H', 844))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error', 'warning') else None)
        await pg.goto('http://127.0.0.1:8777/water_dev.html?' + qs, timeout=180000)
        for i in range(400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('(window.__frames||0) > 2 || !!window.__err'): break
        err = await pg.evaluate('window.__err||""')
        if err: print('ERR', err[:800])
        if os.environ.get('JS'): print(await pg.evaluate(os.environ['JS']))
        for v in views:
            out, cam = v[0], v[1]
            c = [float(x) for x in cam.split(',')]
            hr = (f'__dev.setHour({float(v[2])});' if len(v) > 2 and v[2] else '') + (f'__dev.water.setLook("{v[3]}");' if len(v) > 3 else '')
            await pg.evaluate(f'(() => {{ {hr} const C = __dev.camera; C.position.set({c[0]},{c[1]},{c[2]}); C.lookAt({c[3]},{c[4]},{c[5]}); window.__f1 = __frames; }})()')
            await asyncio.sleep(float(os.environ.get('WAIT', 1.5)))
            for i in range(60):
                if await pg.evaluate('__frames >= window.__f1 + 3'): break
                await asyncio.sleep(0.5)
            await pg.screenshot(path=out, timeout=300000)
        for l in logs[:10]: print(l)
        await b.close()
asyncio.run(main())
