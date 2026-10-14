# water_fw.py OUT1:cam1 [OUT2:cam2 ...]   full world (PAGE, env Q quality, H hour, EXTRA url extra, W/HH viewport), cam = px,py,pz,tx,ty,tz
# (water worker: several views per page load; wrap in sem.sh)
import asyncio, sys, os
from playwright.async_api import async_playwright
async def main():
    views = [a.split(':') for a in sys.argv[1:]]
    W = int(os.environ.get('W', 390)); H = int(os.environ.get('HH', 844))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error', 'warning') else None)
        url = f"http://127.0.0.1:8777/{os.environ.get('PAGE','dev_water.html')}?q={os.environ.get('Q','high')}&w={os.environ.get('WX','clear')}&h={os.environ.get('H','12')}{os.environ.get('EXTRA','')}"
        await pg.goto(url, timeout=180000)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready') or await pg.evaluate('window.__log.some(x=>x.startsWith("ERR"))'): break
        for i in range(900):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await pg.add_script_tag(path='/home/claude/dev/cam.js')
        if os.environ.get('JS'): print(await pg.evaluate(os.environ['JS']))
        for v in views:
            out, cam = v[0], v[1]
            c = [float(x) for x in cam.split(',')]
            await pg.evaluate(f'__cam({c[0]},{c[1]},{c[2]},{c[3]},{c[4]},{c[5]})')
            await asyncio.sleep(float(os.environ.get('WAIT', 2)))
            for i in range(120):
                if await pg.evaluate('__bw.frames >= window.__f0 + 4'): break
                await asyncio.sleep(1)
            await pg.screenshot(path=out, timeout=300000)
        if os.environ.get('JS2'): print(await pg.evaluate(os.environ['JS2']))
        for l in logs[:14]: print(l)
        await b.close()
asyncio.run(main())
