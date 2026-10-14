import asyncio, sys, json
from playwright.async_api import async_playwright
# c1_perf_site.py id [id...]  — per-site draw calls / tris / programs at lv 0/1/15/30 (viewer, one browser)
async def main():
    ids = sys.argv[1:]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 640, 'height': 400})
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/c1_ws_dev.html')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print('err', await pg.evaluate('window.__err||null'))
        await pg.evaluate("window.__simSecs=1")
        for id_ in ids:
            await pg.evaluate(f'window.__show("{id_}",1,0.6,70,0.9,3)')   # builds ws + life once
            if __import__('os').environ.get('TIME'):
                print(id_, await pg.evaluate(f'window.__time("{id_}",30)')); continue
            if __import__('os').environ.get('AB'):
                print(id_, await pg.evaluate(f'window.__ab("{id_}",30)')); continue
            if __import__('os').environ.get('MATS'):
                print(id_, await pg.evaluate('window.__mats()')); break
            if __import__('os').environ.get('TRI'):
                print(id_, await pg.evaluate(f'window.__tri("{id_}",30)')); continue
            r = json.loads(await pg.evaluate(f'window.__perf("{id_}")'))
            print(id_)
            for x in r: print('  ', x)
        for l in logs: print(l)
        await b.close()
asyncio.run(main())
