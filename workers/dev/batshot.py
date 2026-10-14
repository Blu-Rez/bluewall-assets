import asyncio, sys, os
from playwright.async_api import async_playwright
# usage: batshot.py "query" OUTPREFIX "name=JS" ...   (JS runs first, then 2 rendered frames, then a screenshot)
async def main():
    query, out = sys.argv[1], sys.argv[2]; steps = sys.argv[3:]
    W = int(os.environ.get('W', 600)); H = int(os.environ.get('H', 900))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:500]) if '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:500]))
        await pg.goto('http://127.0.0.1:8777/bat_dev.html?' + query)
        for i in range(600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print(await pg.evaluate('JSON.stringify({err: window.__err, info: window.__info})'))
        for _ in range(900):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(window.__battle && !window.__battle.loading) || !!window.__err'): break
        print('battle loaded', await pg.evaluate('!!(window.__battle && !window.__battle.loading)'), await pg.evaluate('window.__err||""'))
        for s in steps:
            name, js = s.split('=', 1)
            if js: print('JS', name, await pg.evaluate(js))
            if name.startswith('_'): continue
            f0 = await pg.evaluate('window.__frames')
            for i in range(300):
                await asyncio.sleep(0.3)
                if await pg.evaluate(f'window.__frames >= {f0} + 2'): break
            await pg.screenshot(path=f'{out}_{name}.png', timeout=180000)
            print('shot', name, await pg.evaluate('JSON.stringify({calls: __renderer.info.render.calls, tris: __renderer.info.render.triangles, t: window.__battle && __battle.t, des: window.__battle && __battle.sim.destruction()})'))
        for l in logs[-40:]: print(l[:700])
        await b.close()
asyncio.run(main())
