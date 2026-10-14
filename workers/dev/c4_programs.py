import asyncio, sys, json
from playwright.async_api import async_playwright
# c4_programs.py — shader programs: the same C4 scene with / without the instanced sails + wheel (fresh page each) -> do the turning parts compile a new program?
async def run(b, noanim, id_, lv):
    pg = await b.new_page(viewport={'width': 640, 'height': 400})
    await pg.goto('http://127.0.0.1:8777/c4_ws_dev.html')
    for i in range(240):
        await asyncio.sleep(0.5)
        if await pg.evaluate('!!window.__ready || !!window.__err'): break
    await pg.evaluate(f"window.__aim=[0,0]; window.__simSecs=2; window.__aimCart=null; window.__noanim={'true' if noanim else 'false'}")
    await pg.evaluate(f'window.__show("{id_}",{lv},0.6,60,0.9,3)')
    keys = json.loads(await pg.evaluate('window.__progKeys()')); await pg.close(); return keys
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for id_ in ('c4_mill_a', 'c4_mill_w'):
            with_ = await run(b, False, id_, 30); without = await run(b, True, id_, 30)
            print(id_, 'programs with anim', len(with_), 'without', len(without), 'extra', len(set(with_) - set(without)))
            for k in sorted(set(with_) - set(without)): print('   extra program:', k[:200])
        await b.close()
asyncio.run(main())
