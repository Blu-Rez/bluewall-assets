import asyncio, sys, os, json
from playwright.async_api import async_playwright
async def main():
    out = sys.argv[1]; js = sys.argv[2] if len(sys.argv) > 2 else ''; wait = float(sys.argv[3]) if len(sys.argv) > 3 else 4
    W = int(os.environ.get('W', 800)); H = int(os.environ.get('H', 500))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300])); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/army_dev.html')
        for i in range(120):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        if js: await pg.evaluate(js)
        await asyncio.sleep(wait)
        await pg.screenshot(path=out)
        print(await pg.evaluate('JSON.stringify({err: window.__err, frames: window.__frames, drawn: __K.spear.drawn, calls: __renderer.info.render.calls, tris: __renderer.info.render.triangles})'))
        for l in logs[-8:]: print(l)
        await b.close()
asyncio.run(main())
