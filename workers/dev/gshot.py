import asyncio, sys, os
from playwright.async_api import async_playwright
# gshot.py OUT1 "query1" [OUT2 "query2" ...]   (env W,H,WAIT,JS,PAGE=look_dev.html) — several lookdev shots in ONE browser (gear worker)
async def main():
    a = sys.argv[1:]; jobs = list(zip(a[0::2], a[1::2]))
    W = int(os.environ.get('W', 1100)); H = int(os.environ.get('H', 520)); page = os.environ.get('PAGE', 'look_dev.html')
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for out, qs in jobs:
            pg = await b.new_page(viewport={'width': W, 'height': H})
            logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type in ('error', 'warning') else None)
            await pg.goto('http://127.0.0.1:8777/' + page + '?' + qs)
            for i in range(240):
                await asyncio.sleep(0.5)
                if await pg.evaluate('(window.__frames||0) > 3'): break
            if os.environ.get('JS'): await pg.evaluate(os.environ['JS'])
            await asyncio.sleep(float(os.environ.get('WAIT', 2)))
            await pg.screenshot(path=out); print(out, logs[:12], flush=True); await pg.close()
        await b.close()
asyncio.run(main())
