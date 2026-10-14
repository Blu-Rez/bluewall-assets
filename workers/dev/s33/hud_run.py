import asyncio, sys
from playwright.async_api import async_playwright
# hud_run.py OUT_PREFIX W H "query1" "query2" ... : screenshots of the DOM-only HUD lab
async def main():
    out, W, H = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); qs = sys.argv[4:]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        for i, q in enumerate(qs):
            pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=2)
            logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type == 'error' and '404' not in m.text else None)
            await pg.goto('http://127.0.0.1:8777/s33/hud.html?' + q)
            for k in range(120):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            await asyncio.sleep(1.5); await pg.screenshot(path=f'{out}_{i}.png'); print(i, q, logs[-3:]); await pg.close()
        await b.close()
asyncio.run(main())
