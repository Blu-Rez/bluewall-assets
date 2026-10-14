import asyncio, sys, json, os
from playwright.async_api import async_playwright
# gearbattle.py W H "SETUPJS" "OUT|js|wait" ...   full world (dev page), start a battle, shots with a free camera
async def main():
    w, h, setup = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':w,'height':h})
        logs=[]
        pg.on('console', lambda m: logs.append(m.type+': '+m.text) if m.type in ('error','warning') and 'Failed to load resource' not in m.text else None)
        pg.on('pageerror', lambda e: logs.append('PAGEERR: '+str(e)))
        await pg.goto(f'http://127.0.0.1:8777/'+os.environ.get('PAGE','dev_gear.html')+f'?q={os.environ.get("Q","high")}&w=clear&h=12')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready') or await pg.evaluate('window.__log.some(x=>x.startsWith("ERR"))'): break
        for i in range(900):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('setup', await pg.evaluate(setup), flush=True)
        for i in range(1200):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(window.__battle && !window.__battle.loading)'): break
        print('battle', await pg.evaluate('!!(window.__battle && !window.__battle.loading)'), flush=True)
        await asyncio.sleep(3)
        for item in sys.argv[4:]:
            out, js, wait = item.split('|')
            if js: print('js', await pg.evaluate(js), flush=True)
            f0 = await pg.evaluate('__bw.frames')
            await asyncio.sleep(float(wait or 2))
            for i in range(200):
                if await pg.evaluate(f'__bw.frames >= {f0} + 3'): break
                await asyncio.sleep(0.5)
            await pg.screenshot(path=out, timeout=240000); print('shot', out, flush=True)
        for l in logs[-25:]: print(l[:500])
        await b.close()
asyncio.run(main())
