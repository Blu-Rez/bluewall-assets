import asyncio, sys, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 400, 'height': 300})
        await pg.goto('http://127.0.0.1:8777/tr2_s4b/ws_dev.html')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        r = json.loads(await pg.evaluate('window.__info(%s)' % json.dumps(sys.argv[1:])))
        for k, v in r.items(): print(f"{k:22s} size {v['size']}  tris {v['tris']}")
        await b.close()
asyncio.run(main())
