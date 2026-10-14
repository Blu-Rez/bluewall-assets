# ld_render.py <page> <query> <outprefix> [vw vh]  : offline render via headless chromium (swiftshader); saves <out>_beauty.png, <out>_emis.png, <out>_pts.json
import asyncio, sys, json, base64, time
from playwright.async_api import async_playwright
async def main():
    page, qs, out = sys.argv[1], sys.argv[2], sys.argv[3]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 400, 'height': 300})
        logs = []
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300]))
        pg.on('pageerror', lambda e: logs.append('PAGEERR: ' + str(e)[:400]))
        t0 = time.time()
        await pg.goto(f'http://127.0.0.1:8777/ld_art/{page}?{qs}')
        for i in range(1200):
            await asyncio.sleep(1)
            st = await pg.evaluate('window.__done ? 1 : window.__err ? 2 : 0')
            if st: break
        if st != 1:
            print('FAILED', await pg.evaluate('window.__err||""')); print('\n'.join(logs[-20:])); await b.close(); return
        o = await pg.evaluate('window.__out')
        for k in ('beauty', 'emis', 'img'):
            if k in o and o[k]:
                open(f'{out}_{k}.png', 'wb').write(base64.b64decode(o[k].split(',', 1)[1]))
        meta = {k: v for k, v in o.items() if k not in ('beauty', 'emis', 'img')}
        json.dump(meta, open(f'{out}_pts.json', 'w'))
        print('ok %.1fs' % (time.time() - t0)); print('\n'.join(l for l in logs if 'error' in l.lower() or 'PAGEERR' in l)[:2000])
        await b.close()
asyncio.run(main())
