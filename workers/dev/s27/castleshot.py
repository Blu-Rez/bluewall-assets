import asyncio, sys, json
from playwright.async_api import async_playwright
OUT = sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 520, 'height': 700}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:200]))
        await pg.goto('http://127.0.0.1:8777/dev.html?q=high&w=clear&h=14')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.add_script_tag(path='/home/claude/dev/cam.js')
        await pg.evaluate('__bw.world.tesla.set(2); __bw.world.setDragonlings && __bw.world.setDragonlings(true)')
        await asyncio.sleep(8)
        info = await pg.evaluate('(()=>{const w=__bw.world; const ws=w.ctx.weaponSites||[]; return {n:ws.length, tesla:w.tesla.count, ids:w.tesla.ids(), sites:ws.slice(0,12).map(s=>[Math.round(s.x),Math.round(s.y),Math.round(s.z)])}})()')
        print(json.dumps(info)); sys.stdout.flush()
        # a home-like high view of the castle + its towers
        await pg.evaluate('(()=>{const s=__bw.world.ctx.weaponSites[0]; __cam(s.x+90, s.y+95, s.z+110, s.x, s.y-5, s.z)})()')
        for i in range(120):
            if await pg.evaluate('__bw.frames >= window.__f0 + 4'): break
            await asyncio.sleep(1)
        await pg.screenshot(path=OUT + '_a.png', timeout=240000); print('a', flush=True)
        await pg.evaluate('(()=>{const s=__bw.world.ctx.weaponSites[0]; __cam(s.x+34, s.y+26, s.z+40, s.x, s.y+2, s.z)})()')
        for i in range(120):
            if await pg.evaluate('__bw.frames >= window.__f0 + 4'): break
            await asyncio.sleep(1)
        await pg.screenshot(path=OUT + '_b.png', timeout=240000); print('b', flush=True)
        print(json.dumps(logs[:4])); await b.close()
asyncio.run(main())
