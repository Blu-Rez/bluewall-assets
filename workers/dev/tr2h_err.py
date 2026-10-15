import asyncio, sys, time
from playwright.async_api import async_playwright
QX = sys.argv[1] if len(sys.argv) > 1 else '&br=old&edge=0'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 640, 'height': 300}, device_scale_factor=1)
        pg.on('pageerror', lambda e: print('PAGEERR', e.message, '\n', (e.stack or '')[:900], flush=True))
        pg.on('console', lambda m: print('CONSOLE', m.type, m.text[:300], flush=True) if m.type == 'error' else None)
        await pg.goto(f'http://127.0.0.1:8777/rp1_dev.html?q=low&w=clear&h=14&wa=0.1&lv=30{QX}')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(400):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await asyncio.sleep(30); print('done'); await b.close()
asyncio.run(main())
