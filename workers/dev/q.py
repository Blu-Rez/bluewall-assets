import asyncio, sys, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':360,'height':640})
        logs=[]; pg.on('console', lambda m: logs.append(m.type+': '+m.text[:400])); pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/'+__import__('os').environ.get('PAGE','dev.html')+'?q=low&h=12&w=clear')
        for i in range(300):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        await asyncio.sleep(float(sys.argv[2]) if len(sys.argv)>2 else 20)
        print(await pg.evaluate(sys.argv[1]))
        for l in logs[-20:]: print(l)
        await b.close()
asyncio.run(main())
