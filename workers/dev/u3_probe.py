import asyncio, sys, os, json
from playwright.async_api import async_playwright
# u3_probe.py "query" JSFILE   — loads u3_lab.html and prints the JSON a page function (async, gets window.__lab) returns
async def main():
    qs, js = sys.argv[1], open(sys.argv[2]).read()
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 400, 'height': 300}); logs = []
        pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type in ('error', 'warning') and 'GPU stall' not in m.text else None)
        await pg.goto('http://127.0.0.1:8777/u3_lab.html?' + qs)
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__lab'): break
        r = await pg.evaluate('(async () => {' + js + '})()'); print(json.dumps(r, indent=1)[:6000]); print(logs[:6]); await b.close()
asyncio.run(main())
