import asyncio, sys, json, urllib.parse, os
from playwright.async_api import async_playwright
# u4_animsheet.py URL TIMES OUT.png [cols tw th yaw clip]
url, times, out = sys.argv[1], sys.argv[2], sys.argv[3]
cols, tw, th, yaw, clip = (sys.argv[4:9] + ['4', '300', '260', '0.8', '0'][len(sys.argv[4:9]):]) if len(sys.argv) < 9 else sys.argv[4:9]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': int(tw) * int(cols), 'height': 600}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto(f'http://127.0.0.1:8777/u4_animsheet.html?url={urllib.parse.quote(url)}&times={times}&cols={cols}&tw={tw}&th={th}&yaw={yaw}&clip={clip}' + (('&looks=' + os.environ['LOOKS']) if os.environ.get('LOOKS') else ''))
        for i in range(300):
            if await pg.evaluate('!!window.__done'): break
            await asyncio.sleep(1)
        el = await pg.query_selector('#out'); await el.screenshot(path=out, timeout=120000)
        print(json.dumps(await pg.evaluate('window.__info'))); print('errs', errs[:3]); await b.close()
asyncio.run(main())
