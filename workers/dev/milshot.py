import asyncio, sys, os, json
from playwright.async_api import async_playwright
# usage: milshot.py OUTPREFIX "site:level,site:level" ...   shots defined by SHOTS env? -> args: name=cx,cy,cz,tx,ty,tz[@level]
async def main():
    out = sys.argv[1]; shots = sys.argv[2:]
    W = int(os.environ.get('W', 900)); H = int(os.environ.get('H', 560))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300]) if '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/mil_dev.html')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print(await pg.evaluate('JSON.stringify({err: window.__err, sites: window.__sites, calls: __renderer.info.render.calls})'))
        for s in shots:
            name, rest = s.split('=')
            lv = None
            if '@' in rest: rest, lv = rest.split('@')
            if lv is not None: await pg.evaluate(f'__lvAll({int(lv)})')
            if rest[0].isalpha():   # site,dist,elev,az[,ty]
                a = rest.split(','); await pg.evaluate('(a)=>__orbit(a[0],+a[1],+a[2],+a[3],a[4]?+a[4]:4)', a)
            else:
                c = [float(x) for x in rest.split(',')]
                await pg.evaluate('(c)=>{const k=window.__cam; k.x=c[0];k.y=c[1];k.z=c[2];k.tx=c[3];k.ty=c[4];k.tz=c[5];}', c)
            f0 = await pg.evaluate('window.__frames')
            for i in range(120):
                await asyncio.sleep(0.4)
                if await pg.evaluate(f'window.__frames >= {f0} + 3'): break
            await pg.screenshot(path=f'{out}_{name}.png', timeout=180000); print('shot', name, await pg.evaluate('__renderer.info.render.calls'))
        for l in logs[-8:]: print(l)
        await b.close()
asyncio.run(main())
