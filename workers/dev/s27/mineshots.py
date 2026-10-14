import asyncio, sys, json, os
from playwright.async_api import async_playwright
OUT = sys.argv[1]; MINE = sys.argv[2] if len(sys.argv) > 2 else 'turq'; HOUR = sys.argv[3] if len(sys.argv) > 3 else '14'
ANGS = [(0, 55, 62), (45, 28, 40)]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 520, 'height': 700}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:200]))
        await pg.goto(f'http://127.0.0.1:8777/dev.html?q=high&w=clear&h={HOUR}')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.add_script_tag(path='/home/claude/dev/cam.js')
        for k, (ang, h, d) in enumerate(ANGS):
            await pg.evaluate(f"(()=>{{const m=__bw.world.ctx.mines.list.find(o=>o.id==='{MINE}'); const a={ang}*Math.PI/180; __cam(m.x+Math.cos(a)*{d},m.y+{h},m.z+Math.sin(a)*{d},m.x,m.y+14,m.z);}})()")
            for i in range(120):
                if await pg.evaluate('__bw.frames >= window.__f0 + 4'): break
                await asyncio.sleep(1)
            await pg.screenshot(path=f'{OUT}_{k}.png', timeout=240000); print('shot', k, flush=True)
        print(json.dumps(logs[:5]))
        await b.close()
asyncio.run(main())
