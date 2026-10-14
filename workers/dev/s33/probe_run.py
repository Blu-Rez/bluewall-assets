import asyncio, sys, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        pg.on('pageerror', lambda e: print('ERR', e))
        await pg.goto('http://127.0.0.1:8777/s33/' + sys.argv[1])
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print(await pg.evaluate('window.__err||""'))
        print(json.dumps(await pg.evaluate('window.__out'), indent=1))
        await b.close()
asyncio.run(main())
