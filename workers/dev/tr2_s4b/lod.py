import asyncio, sys, json
from playwright.async_api import async_playwright
NAMES = ['lumber_mill_1','iron_mine_0','stone_quarry_1','farm_field_1','livestock_pen_0','greenhouse_0','oil_well_0','smelter_0','bakery','mint','butcher','barn_1','house_cottage_1','watermill','jetty','windmill_asbad_2']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 400, 'height': 300})
        await pg.goto('http://127.0.0.1:8777/tr2_s4b/ws_dev.html')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        for label, keep, err, flags in [('welded k.2 e.1', 0.2, 0.1, []), ('welded k.2 e.3', 0.2, 0.3, []), ('welded k.1 e.3', 0.1, 0.3, [])]:
            r = json.loads(await pg.evaluate('window.__lodStats(%s,%s,%s,%s)' % (json.dumps(NAMES), keep, err, json.dumps(flags))))
            full = sum(v[0] for v in r.values()); q = sum(v[1] for v in r.values())
            print(f"{label:22s} total {full} -> {q} ({100*q/full:.0f}%)  " + ' '.join(f"{k.split('_')[0]}:{100*v[1]//v[0]}%" for k, v in r.items()))
        await b.close()
asyncio.run(main())
