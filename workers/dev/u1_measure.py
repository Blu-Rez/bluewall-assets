import asyncio, sys, json
from playwright.async_api import async_playwright
# u1_measure.py URL FOOT_BONES [ROOT_BONE]
url, foot = sys.argv[1], sys.argv[2]; root = sys.argv[3] if len(sys.argv) > 3 else 'hips'; hand = sys.argv[4] if len(sys.argv) > 4 else ''; dump = sys.argv[5] if len(sys.argv) > 5 else ''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        pg = await b.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto(f'http://127.0.0.1:8777/u1_measure.html?url={url}&foot={foot}&root={root}&hand={hand}&dump={dump}')
        for i in range(120):
            if await pg.evaluate('!!window.__out'): break
            await asyncio.sleep(0.5)
        print(json.dumps(await pg.evaluate('window.__out'), indent=0)); print('errs', errs[:3]); await b.close()
asyncio.run(main())
