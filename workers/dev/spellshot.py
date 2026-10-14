import asyncio, sys, os, json
from playwright.async_api import async_playwright
# usage: spellshot.py OUTPREFIX 'name|js|advance_sec;name|js|adv...'
async def main():
    out = sys.argv[1]; steps = sys.argv[2].split(';;') if len(sys.argv) > 2 else []
    W = os.environ.get('W', '900'); H = os.environ.get('H', '560')
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': int(W), 'height': int(H)})
        errs = []; pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: errs.append(m.text[:400]) if m.type in ('error', 'warning') else None)
        await pg.goto(f'http://127.0.0.1:8777/spell_dev.html?w={W}&h={H}')
        for i in range(60):
            await asyncio.sleep(0.3)
            if await pg.evaluate('!!window.__ready'): break
        for st in steps:
            name, js, adv = (st.split('|') + ['', '0'])[:3]
            if js: print(name, await pg.evaluate(js))
            if float(adv or 0) > 0: await pg.evaluate(f'__adv({adv})')
            else: await pg.evaluate('__adv(0.0001)')
            await asyncio.sleep(0.3)
            if name and name != '-': await pg.screenshot(path=f'{out}_{name}.png')
        print('ERR', errs[:8]); await b.close()
asyncio.run(main())
