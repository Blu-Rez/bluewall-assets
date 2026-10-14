import asyncio, sys, json
from playwright.async_api import async_playwright
# c2_stats.py [lv ...] : draw calls / triangles ONE site adds (far + near group) for every site of the preview viewer, from the real builder
async def main():
    args = [a for a in sys.argv[1:] if a != '--noextra']; lvs = [int(a) for a in args] or [1, 15, 30]; NOX = '--noextra' in sys.argv
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 640, 'height': 400})
        await pg.goto('http://127.0.0.1:8777/c2_ws_dev.html')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print('err', await pg.evaluate('window.__err||null'))
        ids = await pg.evaluate('window.__ids')
        for id_ in ids:
            for lv in lvs:
                r = json.loads(await pg.evaluate(f'window.__stats("{id_}",{lv},{str(NOX).lower()})')); m = r.pop('mats')
                print(id_, lv, r, flush=True)
        await b.close()
asyncio.run(main())
