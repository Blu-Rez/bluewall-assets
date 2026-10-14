import asyncio, sys, os, json
from playwright.async_api import async_playwright
# usage: ug_eval.py "query" "JS (async ok, returns value)" ...   evaluates in the lab page, prints the JSON result
async def main():
    query = sys.argv[1]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        try:
            pg = await b.new_page(viewport={'width': 300, 'height': 300}); logs = []
            pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:500])); pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300]) if m.type in ('error',) else None)
            await pg.goto('http://127.0.0.1:8777/ug_lab.html?' + query)
            for i in range(240):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready || !!window.__err'): break
            for js in sys.argv[2:]:
                r = await pg.evaluate(js); print(json.dumps(r, indent=1)[:int(os.environ.get('MAXC', 6000))])
            for l in logs[-10:]: print(l)
        finally:
            await b.close()
asyncio.run(main())
