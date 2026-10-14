import asyncio, sys, json
from playwright.async_api import async_playwright
async def main():
    out = sys.argv[1]; camp = sys.argv[2] if len(sys.argv) > 2 else '1'
    views = {'wide': dict(dx=-34, dz=-30, h=22, ty=1), 'close': dict(dx=-14, dz=-12, h=5.5, ty=1.6), 'low': dict(dx=-22, dz=6, h=2.2, ty=1.8)}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':720,'height':720})
        pg.on('pageerror', lambda e: print('E', str(e)[:300])); pg.on('console', lambda m: print('C', m.text[:200]) if m.type == 'error' else None)
        await pg.goto(f'http://127.0.0.1:8777/nomad_dev.html?c={camp}')
        for i in range(60):
            await asyncio.sleep(0.3)
            if await pg.evaluate('!!window.__ready'): break
        print(await pg.evaluate('JSON.stringify(window.__info)'))
        for k, v in views.items():
            await pg.evaluate(f'window.__shot({json.dumps(v)})'); await asyncio.sleep(0.4)
            await pg.screenshot(path=f'{out}_{k}.png')
        await b.close()
asyncio.run(main())
