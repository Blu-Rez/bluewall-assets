import asyncio, sys
from playwright.async_api import async_playwright
# c3_perf.py id:lv ...   -> per-site draw calls / triangles (near = every piece, far = worksite LOD), measured in the C3 viewer with the game's shadow settings
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 560})
        await pg.goto('http://127.0.0.1:8777/c3_wsdev.html')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print('err', await pg.evaluate('window.__err||null'))
        await pg.evaluate('window.__aim=[0,2]; window.__simSecs=1')
        for j in sys.argv[1:]:
            id_, lv = j.split(':'); print(await pg.evaluate(f'window.__perf("{id_}",{lv})'), flush=True)
        await b.close()
asyncio.run(main())
