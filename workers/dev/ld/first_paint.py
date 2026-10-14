import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        logs=[]; pg.on('console', lambda m: logs.append(m.text[:150])); pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:200]))
        await pg.route('**/tg.js', lambda r: r.fulfill(body='window.Telegram={WebApp:{initData:"x",ready(){},expand(){},isVersionAtLeast(){return false}}}', content_type='application/javascript'))
        async def slow(route):
            await asyncio.sleep(3.0); await route.continue_()
        await pg.route('**/*.woff2', slow)       # simulate slow fonts
        await pg.route('**/*.webp', slow)        # and slow pictures
        await pg.route('**/api/auth', lambda r: None)   # keep the loader on screen
        await pg.goto('http://127.0.0.1:8794/index.html?p=37', wait_until='commit')
        await pg.wait_for_selector('#bw-stage svg', timeout=5000)
        await asyncio.sleep(0.4);  await pg.screenshot(path='/home/claude/dev/ld/fp_0.png')
        await asyncio.sleep(4.0);  await pg.screenshot(path='/home/claude/dev/ld/fp_1.png')
        print(logs[-6:]); await b.close()
asyncio.run(main())
