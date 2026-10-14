import asyncio, sys, os, json
from playwright.async_api import async_playwright
# fly/shot.py "query" OUTPREFIX "name=JS" ...   JS runs in the lab page (window.__lab.*), then one render + screenshot OUTPREFIX_name.png (a name starting with _ does not shoot).  env W H
async def main():
    query, out = sys.argv[1], sys.argv[2]; steps = sys.argv[3:]
    W = int(os.environ.get('W', 600)); H = int(os.environ.get('H', 700))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        try:
            pg = await b.new_page(viewport={'width': W, 'height': H})
            logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:400]) if '404' not in m.text and m.type in ('error', 'warning') else None); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:500]))
            await pg.goto('http://127.0.0.1:8777/fly/fly_lab.html?' + query)
            for i in range(240):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready || !!window.__err'): break
            print('loadMs', await pg.evaluate('window.__loadMs'), 'err', await pg.evaluate('window.__err||""'), flush=True)
            for s in steps:
                name, js = s.split('=', 1)
                if js:
                    r = await pg.evaluate('(async()=>{' + js + '})()')
                    if r is not None: print('JS', name, json.dumps(r)[:int(os.environ.get('LIM', 900))], flush=True)
                if name.startswith('_'): continue
                tr = await pg.evaluate('0' if name.startswith('sheet') else '__lab.render()')
                await pg.screenshot(path=f'{out}_{name}.png', timeout=120000)
                print('shot', name, tr, await pg.evaluate('__stats()'), flush=True)
            for l in logs[-30:]: print(l[:600])
        finally:
            await b.close()
asyncio.run(main())
