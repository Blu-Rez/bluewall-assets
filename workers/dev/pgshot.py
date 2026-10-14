import asyncio, sys, os, json
from playwright.async_api import async_playwright
# usage: pgshot.py PAGE OUTPREFIX "name=cx,cy,cz,tx,ty,tz" ...   (page = html file in dev dir)
async def main():
    page, out = sys.argv[1], sys.argv[2]; shots = sys.argv[3:]
    W = int(os.environ.get('W', 900)); H = int(os.environ.get('H', 560)); WAIT = float(os.environ.get('WAIT', 1.5)); JS = os.environ.get('JS', '')
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:400]) if '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/' + page)
        for i in range(400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print(await pg.evaluate('JSON.stringify({err: window.__err, info: window.__info, calls: window.__renderer && __renderer.info.render.calls})'))
        if JS: await pg.evaluate(JS)
        for s in shots:
            name, rest = s.split('=')
            if rest:
                c = [float(x) for x in rest.split(',')]
                await pg.evaluate('(c)=>{const k=window.__cam; k.x=c[0];k.y=c[1];k.z=c[2];k.tx=c[3];k.ty=c[4];k.tz=c[5];}', c)
            await asyncio.sleep(WAIT)
            f0 = await pg.evaluate('window.__frames')
            for i in range(200):
                await asyncio.sleep(0.3)
                if await pg.evaluate(f'window.__frames >= {f0} + 2'): break
            await pg.screenshot(path=f'{out}_{name}.png', timeout=180000); POST=os.environ.get('POST','')
            if POST: print('POST', await pg.evaluate(POST))
            print('shot', name, await pg.evaluate('window.__renderer ? __renderer.info.render.calls : -1'))
        for l in logs[-12:]: print(l)
        await b.close()
asyncio.run(main())
