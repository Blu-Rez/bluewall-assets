import asyncio, sys, os
from playwright.async_api import async_playwright
# lookmulti.py "OUT|query|W|H|JS" ...   one browser, several look_dev shots (env WAIT)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for item in sys.argv[1:]:
            parts = item.split('|'); out, qs = parts[0], parts[1]
            W = int(parts[2]) if len(parts) > 2 and parts[2] else 1100; H = int(parts[3]) if len(parts) > 3 and parts[3] else 520
            js = parts[4] if len(parts) > 4 else ''
            pg = await b.new_page(viewport={'width': W, 'height': H})
            logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type in ('error', 'warning') and 'GPU stall' not in m.text else None)
            await pg.goto('http://127.0.0.1:8777/look_dev.html?' + qs)
            for i in range(160):
                await asyncio.sleep(0.5)
                if await pg.evaluate('(window.__frames||0) > 3'): break
            if js: await pg.evaluate(js)
            await asyncio.sleep(float(os.environ.get('WAIT', 2)))
            await pg.screenshot(path=out); print(out, logs[:8], flush=True); await pg.close()
        await b.close()
asyncio.run(main())
