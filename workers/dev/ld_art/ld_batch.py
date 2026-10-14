# ld_batch.py <jobs.json> : run several offline key-art renders in ONE headless chromium (one semaphore slot).
# jobs: [[page, query, outprefix], ...]  -> <out>_beauty.png / _emis.png / _img.png / _pts.json
import asyncio, sys, json, base64, time
from playwright.async_api import async_playwright
async def main():
    jobs = json.load(open(sys.argv[1]))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for page, qs, out in jobs:
            pg = await b.new_page(viewport={'width': 400, 'height': 300})
            logs = []
            pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300]))
            pg.on('pageerror', lambda e: logs.append('PAGEERR: ' + str(e)[:400]))
            t0 = time.time()
            await pg.goto(f'http://127.0.0.1:8777/ld_art/{page}?{qs}')
            st = 0
            for i in range(1200):
                await asyncio.sleep(0.5)
                st = await pg.evaluate('window.__done ? 1 : window.__err ? 2 : 0')
                if st: break
            if st != 1:
                print(out, 'FAILED', await pg.evaluate('window.__err||""'), flush=True); print('\n'.join(logs[-20:]), flush=True); await pg.close(); continue
            o = await pg.evaluate('window.__out')
            for k in ('beauty', 'emis', 'img', 'depth'):
                if k in o and o[k]:
                    open(f'{out}_{k}.png', 'wb').write(base64.b64decode(o[k].split(',', 1)[1]))
            meta = {k: v for k, v in o.items() if k not in ('beauty', 'emis', 'img', 'depth')}
            json.dump(meta, open(f'{out}_pts.json', 'w'))
            errs = [l for l in logs if 'error' in l.lower() or 'PAGEERR' in l]
            print(out.split('/')[-1], 'ok %.1fs' % (time.time() - t0), errs[:3], flush=True)
            await pg.close()
        await b.close()
    print('BATCH DONE', flush=True)
asyncio.run(main())
