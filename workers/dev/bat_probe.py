import asyncio, sys, os
from playwright.async_api import async_playwright
async def main():
    q = sys.argv[1]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 600, 'height': 900})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:600]) if '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:600]))
        await pg.goto('http://127.0.0.1:8777/bat_dev.html?' + q)
        for i in range(400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print(await pg.evaluate('JSON.stringify({err: window.__err, info: window.__info})'))
        print('\n'.join(logs[-30:]))
        await b.close()
asyncio.run(main())
