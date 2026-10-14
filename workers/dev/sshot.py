import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':int(sys.argv[2]),'height':int(sys.argv[3])}, device_scale_factor=2)
        await pg.goto('http://127.0.0.1:8777/'+sys.argv[1]); await asyncio.sleep(1.5)
        await pg.screenshot(path=sys.argv[4]); await b.close()
asyncio.run(main())
