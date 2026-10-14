import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':800,'height':900}, device_scale_factor=2)
        await pg.goto('http://127.0.0.1:8793/sheet.html'); await asyncio.sleep(1)
        h = await pg.evaluate("document.getElementById('r').getBoundingClientRect().height")
        await pg.set_viewport_size({'width':800,'height':int(h)+10}); await asyncio.sleep(0.3)
        await pg.screenshot(path=sys.argv[1]); await b.close()
asyncio.run(main())
