import asyncio, sys, json, os
from playwright.async_api import async_playwright
# probe.py URL JSFILE [out.png [W H]] : load the dev page, wait for late assets, run JS (must return JSON-able), optionally screenshot
URL, JSF = sys.argv[1], sys.argv[2]; OUT = sys.argv[3] if len(sys.argv) > 3 else None
VW, VH = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (390, 844)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': VW, 'height': VH}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:200])); pg.on('console', lambda m: logs.append(m.text[:160]) if m.type == 'error' else None)
        await pg.goto(URL)
        for i in range(600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('(()=>{const c=__bw.ctl; c._skipIntro(); c.intro=null; c.vel.set(0,0)})()'); await asyncio.sleep(2)
        r = await pg.evaluate('(async()=>{' + open(JSF).read() + '})()')
        print(json.dumps(r, ensure_ascii=False)[:3000])
        if OUT: await asyncio.sleep(3); await pg.screenshot(path=OUT, timeout=240000)
        print('LOGS', logs[:5]); await b.close()
asyncio.run(main())
