import asyncio, sys, json
from playwright.async_api import async_playwright
# views.py LIST.json(url path) OUT.png [tw th views]
lst, out = sys.argv[1], sys.argv[2]
tw = sys.argv[3] if len(sys.argv) > 3 else '220'; th = sys.argv[4] if len(sys.argv) > 4 else '190'; views = sys.argv[5] if len(sys.argv) > 5 else '0,90,180,270'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1200, 'height': 600})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto(f'http://127.0.0.1:8777/tr2_views.html?list={lst}&tw={tw}&th={th}&views={views}')
        for i in range(900):
            if await pg.evaluate('!!window.__done'): break
            await asyncio.sleep(1)
        el = await pg.query_selector('#out'); await el.screenshot(path=out, timeout=120000)
        info = await pg.evaluate('window.__info'); bad = [x for x in info if x.get('err')]
        print('cells', len(info), 'errors', bad[:6], 'pageerr', errs[:3])
        json.dump(info, open(out + '.info.json', 'w'))
        await b.close()
asyncio.run(main())
