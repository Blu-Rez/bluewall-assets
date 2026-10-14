import asyncio, sys, json
from playwright.async_api import async_playwright
# s2.py STAGES OUT.png   (stages: destruct,progs,tiers)
stages, out = sys.argv[1], sys.argv[2]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1400, 'height': 800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append('console:' + m.text[:200]) if m.type in ('error', 'warning') else None)
        await pg.goto(f'http://127.0.0.1:8777/tr2_s2.html?stage={stages}')
        for i in range(1500):
            if await pg.evaluate('!!window.__done'): break
            await asyncio.sleep(1)
        el = await pg.query_selector('#out'); await el.screenshot(path=out, timeout=180000)
        res = await pg.evaluate('window.__res'); print(json.dumps(res, indent=1)[:6000]); print('pageerr', errs[:5])
        json.dump(res, open(out + '.json', 'w'), indent=1)
        await b.close()
asyncio.run(main())
