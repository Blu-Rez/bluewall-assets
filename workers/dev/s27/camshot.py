import asyncio, sys, json, os
from playwright.async_api import async_playwright
OUT = sys.argv[1]; CASES = json.loads(sys.argv[2])   # [[name, dist, azim, tx, tz], ...]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:200]))
        await pg.goto(os.environ.get('CAMURL','http://127.0.0.1:8777/dev.html?q=high&w=clear&h=14'))
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('(()=>{const c=__bw.ctl; c._skipIntro(); window.__lim=[c.minD,c.maxD,c.pNear,c.pFar,c.camR,c.maxR]})()')
        print('limits', await pg.evaluate('window.__lim'), flush=True)
        if os.environ.get('CAMJS'): await pg.evaluate(os.environ['CAMJS']); await asyncio.sleep(4)
        await asyncio.sleep(3)
        await pg.evaluate('(()=>{const c=__bw.ctl; c.intro=null; c.vel.set(0,0); window.__orig=[c.minD,c.maxD,c.pNear,c.pFar]})()')
        for name, d, a, ov in CASES:
            await pg.evaluate('([d,a,ov])=>{const c=__bw.ctl; c.intro=null; const o=window.__orig; c.minD=ov?ov[0]:o[0]; c.maxD=ov?ov[1]:o[1]; c.pNear=ov?ov[2]:o[2]; c.pFar=ov?ov[3]:o[3]; c._portrait=true; c.dist=d; c.azim=a; c.vel.set(0,0); c.vAz=0; c.target.x=4; c.target.z=4; window.__f0=__bw.frames;}', [d, a, ov])
            for i in range(200):
                if await pg.evaluate('__bw.frames >= window.__f0 + 5'): break
                await asyncio.sleep(1)
            st = await pg.evaluate('(()=>{const c=__bw.ctl,p=__bw.camera.position;return [c.dist|0,+c.polar.toFixed(2),p.x|0,p.y|0,p.z|0]})()')
            await pg.screenshot(path=f'{OUT}_{name}.png', timeout=240000); print(name, st, flush=True)
        print(json.dumps(logs[:4])); await b.close()
asyncio.run(main())
