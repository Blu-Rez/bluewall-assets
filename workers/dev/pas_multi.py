import asyncio, sys, os, json
from playwright.async_api import async_playwright
# pas_multi.py OUT_PREFIX "query" '[["name","js"],...]'   (env W,H,WAIT, PAGE=pas_dev.html)  — one page load, many shots
async def main():
    pre, qs, shots = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
    W = int(os.environ.get('W', 390)); H = int(os.environ.get('H', 844))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error', 'warning') else None)
        await pg.goto('http://127.0.0.1:8777/' + os.environ.get('PAGE', 'pas_dev.html') + '?' + qs)
        for i in range(600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('(window.__frames||0) > 2 || !!window.__err'): break
        for name, js in shots:
            if js: await pg.evaluate(js)
            f0 = await pg.evaluate('window.__frames||0')
            await asyncio.sleep(float(os.environ.get('WAIT', 1.5)))
            for i in range(200):
                if await pg.evaluate(f'(window.__frames||0) >= {f0} + 3'): break
                await asyncio.sleep(0.3)
            await pg.screenshot(path=pre + name + '.png', timeout=300000)
        print(json.dumps(await pg.evaluate('window.__err || window.__info')))
        for l in logs[:14]: print(l)
        await b.close()
asyncio.run(main())
