import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':900,'height':560})
        pg.on('pageerror', lambda e: print('ERR', e))
        await pg.goto('http://127.0.0.1:8777/s30/tr/page.html')
        for i in range(200):
            if await pg.evaluate('!!window.__done'): break
            await asyncio.sleep(0.5)
        print(json.dumps(await pg.evaluate('window.__info||window.__err')))
        await pg.screenshot(path='/home/claude/dev/s30/tr/tr.png'); await b.close()
asyncio.run(main())
