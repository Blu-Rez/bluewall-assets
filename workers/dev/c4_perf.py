import asyncio, sys, os, json
from playwright.async_api import async_playwright
# c4_perf.py — what the C4 kinds cost in the overview camera (far: the near-only props are hidden) and close up.  draws / triangles of the whole viewer scene with the site at level 0 vs level L (same camera); the difference = the site.
IDS = os.environ.get('C4IDS', 'c4_mill_a,c4_mill_w,c4_bakery,c4_butcher,slaughter,farm').split(',')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 640, 'height': 400}); logs = []
        pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/c4_ws_dev.html')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print('err', await pg.evaluate('window.__err||null'))
        await pg.evaluate("window.__aim=[0,0]; window.__simSecs=1; window.__aimCart=null")
        # programs: how many shader programs the renderer has compiled after each step
        print('id'.ljust(11), 'lv', 'cam', ' draws(site)', ' tris(site)', ' programs')
        for id_ in IDS:
            for dist, lab in [(260, 'overview'), (46, 'close')]:
                base = json.loads(await pg.evaluate(f'window.__show("{id_}",0,0.6,{dist},0.9,3)'))
                prog0 = await pg.evaluate('window.__programs()')
                for lv in (1, 15, 30):
                    r = json.loads(await pg.evaluate(f'window.__show("{id_}",{lv},0.6,{dist},0.9,3)'))
                    print(id_.ljust(11), str(lv).rjust(2), lab.ljust(8), str(r['calls'] - base['calls']).rjust(6), str(r['tris'] - base['tris']).rjust(10), await pg.evaluate('window.__programs()'), '(was', prog0, ')')
        for l in logs: print(l)
        await b.close()
asyncio.run(main())
