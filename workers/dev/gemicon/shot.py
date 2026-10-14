import asyncio, base64, sys
from playwright.async_api import async_playwright
OUT = sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':600,'height':600})
        logs=[]; pg.on('pageerror', lambda e: logs.append(str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:200]) if m.type=='error' else None)
        await pg.goto('http://127.0.0.1:8777/gemicon/gemicon.html')
        await asyncio.sleep(1)
        res = await pg.evaluate("window.__render(['ruby','emerald','turq','sap','onyx'], 512)")
        for k, v in res.items():
            open(f'{OUT}/gem_{k}.png','wb').write(base64.b64decode(v.split(',')[1])); print('wrote', k)
        print(logs); await b.close()
asyncio.run(main())
