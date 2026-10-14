import asyncio, sys
from playwright.async_api import async_playwright
STUB = open('/home/claude/dev/s27/shot.py').read().split("STUB = '")[1].split("'\nbase")[0]
url, out, mem = sys.argv[1], sys.argv[2], sys.argv[3]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=[f'--force-gpu-mem-available-mb={mem}', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--enable-zero-copy'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=3.28)
        await pg.route('**/tg.js', lambda r: r.fulfill(body=STUB, content_type='application/javascript'))
        async def hang(route): await asyncio.sleep(60)
        await pg.route('**/api/auth', hang)
        await pg.goto(url); await asyncio.sleep(6)
        await pg.evaluate("window.bwLoading(50)"); await asyncio.sleep(3)
        await pg.screenshot(path=out, scale='css'); await b.close()
asyncio.run(main())
