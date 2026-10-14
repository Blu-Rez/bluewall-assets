import asyncio, sys, json, os
from playwright.async_api import async_playwright
# usage: multi.py OUTPREFIX QUALITY HOUR "name=px,py,pz,tx,ty,tz" ...   (dev_dbg.html, high quality by default)
async def main():
    out, q, hour = sys.argv[1], sys.argv[2], sys.argv[3]; shots = sys.argv[4:]
    W = int(os.environ.get('W', 390)); H = int(os.environ.get('H', 844))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':W,'height':H}, device_scale_factor=float(os.environ.get('DPR','1')))
        logs=[]; pg.on('pageerror', lambda e: logs.append('PAGEERR: '+str(e)[:300]))
        await pg.goto(f'http://127.0.0.1:8777/dev_dbg.html?q={q}&w={os.environ.get("WX","clear")}&h={hour}&wa=0.1')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.add_script_tag(path='/home/claude/dev/cam.js')
        for s in shots:
            name, c = s.split('=', 1)
            await pg.evaluate(f'__cam({c})')
            for i in range(120):
                if await pg.evaluate('__bw.frames >= window.__f0 + 4'): break
                await asyncio.sleep(1)
            await pg.screenshot(path=f'{out}_{name}.png', timeout=240000); print('shot', name, flush=True)
        print(json.dumps(await pg.evaluate('window.__log.slice(-3)'), ensure_ascii=False)); print('\n'.join(logs[:5]))
        await b.close()
asyncio.run(main())
