import asyncio, sys, json
from playwright.async_api import async_playwright
# sheet.py LIST.json(url path, served from dev root) OUT.png cols tw th
lst, out, cols, tw, th = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': int(tw) * int(cols), 'height': 600})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto(f'http://127.0.0.1:8777/tr1_sheet.html?list={lst}&cols={cols}&tw={tw}&th={th}')
        for i in range(1500):
            if await pg.evaluate('!!window.__done'): break
            await asyncio.sleep(1)
        el = await pg.query_selector('#out'); await el.screenshot(path=out, timeout=120000)
        info = await pg.evaluate('window.__info'); bad = [x for x in info if x.get('err')]
        print('cells', len(info), 'errors', bad[:6], 'pageerr', errs[:3])
        json.dump(info, open(out + '.info.json', 'w'))
        await b.close()
asyncio.run(main())
