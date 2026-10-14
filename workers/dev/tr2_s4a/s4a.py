import asyncio, sys, json, os
from playwright.async_api import async_playwright
# s4a.py STAGE OUT.png [SET]  — stage: models | lots ; needs the static root of make_root.sh served on :8778
stage, out = sys.argv[1], sys.argv[2]; st = sys.argv[3] if len(sys.argv) > 3 else 'houses'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1400, 'height': 800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append('console:' + m.text[:200]) if m.type in ('error', 'warning') else None)
        await pg.goto(f'http://127.0.0.1:8778/s4a.html?stage={stage}&set={st}')
        for i in range(1500):
            if await pg.evaluate('!!window.__done'): break
            await asyncio.sleep(1)
        el = await pg.query_selector('#out'); await el.screenshot(path=out, timeout=180000)
        res = await pg.evaluate('window.__res'); print(json.dumps(res)[:4000]); print('pageerr', errs[:5])
        json.dump(res, open(out + '.json', 'w'), indent=1)
        await b.close()
asyncio.run(main())
