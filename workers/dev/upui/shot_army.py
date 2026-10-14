import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    out=sys.argv[1]; js=sys.argv[2] if len(sys.argv)>2 else ''
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':412,'height':870}, device_scale_factor=2)
        logs=[]; pg.on('console', lambda m: logs.append(m.text)); pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto('file:///home/claude/dev/upui/page_army.html'); await asyncio.sleep(1)
        if js: await pg.evaluate(js); await asyncio.sleep(0.8)
        await pg.screenshot(path=out); print(logs[:5]); await b.close()
asyncio.run(main())
