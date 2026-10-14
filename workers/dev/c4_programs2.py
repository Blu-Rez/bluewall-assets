import asyncio, sys, json
from playwright.async_api import async_playwright
# c4_programs2.py — shader programs after showing an OLD site (farm: kit_ws materials only), then each C4 kind: the count must not grow (kit_c4 flat / flatDS and the soup material hit the same programs).
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 640, 'height': 400})
        await pg.goto('http://127.0.0.1:8777/c4_ws_dev.html')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        await pg.evaluate("window.__aim=[0,0]; window.__simSecs=2; window.__aimCart=null")
        prev = set()
        for id_ in ('farm', 'slaughter', 'c4_butcher', 'c4_mill_a', 'c4_mill_w', 'c4_bakery'):
            await pg.evaluate(f'window.__show("{id_}",30,0.6,60,0.9,3)')
            keys = set(json.loads(await pg.evaluate('window.__progKeys()')))
            print(id_.ljust(11), 'programs', len(keys), 'new vs previous:', len(keys - prev)); 
            for k in sorted(keys - prev): print('     +', k[:150])
            prev = keys
        await b.close()
asyncio.run(main())
