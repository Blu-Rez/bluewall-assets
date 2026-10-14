import asyncio, sys, os, time
from playwright.async_api import async_playwright
async def main():
    out, qs = sys.argv[1], sys.argv[2]; W, H = int(os.environ.get('PX', 1400)), int(os.environ.get('PY', 300)); page = os.environ.get('PG', 'pt.html'); lim = float(os.environ.get('LIM', 3000))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append(m.text[:300]) if m.type in ('error', 'warning') else None)
        await pg.goto(f'http://127.0.0.1:8777/s24/{page}?{qs}')
        t0 = time.time(); last = 0
        while time.time() - t0 < lim:
            await asyncio.sleep(3)
            d = await pg.evaluate('[!!window.__done, window.__spp||0, Math.round(window.__ms||0)]')
            if time.time() - last > 30: print('spp', d[1], 'ms', d[2], flush=True); last = time.time()
            if d[0]: break
        import base64
        du = await pg.evaluate("document.querySelector('canvas').toDataURL('image/png')")
        open(out, 'wb').write(base64.b64decode(du.split(',', 1)[1])); print('done', out, errs[:5], flush=True); await b.close()
asyncio.run(main())
