import asyncio, sys, json, time
from playwright.async_api import async_playwright
# modelsheet.py LIST.json OUT.png [cols] [tw th]  — LIST = [{"url": "/v4/...", "label": "..."}]  (urls relative to dev server :8777)
lst, out = sys.argv[1], sys.argv[2]; cols = sys.argv[3] if len(sys.argv) > 3 else '5'; tw = sys.argv[4] if len(sys.argv) > 4 else '320'; th = sys.argv[5] if len(sys.argv) > 5 else '240'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': int(tw) * int(cols), 'height': 600})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto(f'http://127.0.0.1:8777/modelsheet.html?list={lst}&cols={cols}&tw={tw}&th={th}')
        for i in range(1800):
            if await pg.evaluate('!!window.__done'): break
            await asyncio.sleep(1)
        el = await pg.query_selector('#out'); await el.screenshot(path=out, timeout=120000)
        info = await pg.evaluate('window.__info'); print(json.dumps(info)[:2500]); print('errs', errs[:3])
        await b.close()
asyncio.run(main())
