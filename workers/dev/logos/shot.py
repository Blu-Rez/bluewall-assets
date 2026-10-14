import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':860,'height':660}, device_scale_factor=1)
        await pg.goto('file:///home/claude/dev/logos/sheet.html'); await asyncio.sleep(0.5)
        await pg.screenshot(path=sys.argv[1], full_page=True); await b.close()
asyncio.run(main())
