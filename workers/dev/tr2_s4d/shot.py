import asyncio, sys, os, json
from playwright.async_api import async_playwright
# python3 shot.py out.png [js to run after ready] [wait s]   (server on :8778, root /tmp/tr2_s4d_root)
async def main():
    out = sys.argv[1]; js = sys.argv[2] if len(sys.argv) > 2 else ''; wait = float(sys.argv[3]) if len(sys.argv) > 3 else 3
    W = int(os.environ.get('W', 1000)); H = int(os.environ.get('H', 560))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300])); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.goto('http://127.0.0.1:8778/index.html')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        if js: await pg.evaluate(js)
        await asyncio.sleep(wait)
        await pg.screenshot(path=out)
        print(await pg.evaluate('JSON.stringify({err: window.__err, frames: window.__frames, res: window.__res, calls: __renderer.info.render.calls, tris: __renderer.info.render.triangles, tex: __renderer.info.memory.textures})'))
        for l in logs[-8:]: print(l)
        await b.close()
asyncio.run(main())
