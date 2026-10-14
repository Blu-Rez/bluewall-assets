import asyncio, sys, json, os, time, glob
from playwright.async_api import async_playwright
# portrait daemon: loads the battle once, then runs q/<n>.json = [{js, vp, shot, frames}] in order, writes q/<n>.out ; touch q/QUIT to stop.
D = '/home/claude/dev/s35/port'; Q = D + '/q'
steps = json.load(open('/home/claude/dev/s35/port/src/start.json'))
START = steps[0]['js'].replace('W.scene.fog=null;', "{ const f=new T3.FogExp2(0x0c1f44,0); f.color.copy=()=>f.color; f.color.lerp=()=>f.color; Object.defineProperty(f,'density',{get:()=>0,set:()=>{}}); W.scene.fog=f; }")
REDEF = json.load(open('/home/claude/dev/s35/port/src/redef.json'))[0]['js']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 512, 'height': 512}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=high&w=clear&h=12&wa=1')
        for i in range(1200):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('(()=>{const c=__bw.ctl; c._skipIntro(); c.intro=null; c.vel.set(0,0)})()')
        await pg.evaluate('(async()=>{' + START + '})()'); await pg.evaluate('(async()=>{' + REDEF + '})()')
        open(Q + '/READY', 'w').write('1'); print('ready', flush=True)
        vp = 512
        while not os.path.exists(Q + '/QUIT'):
            fs = sorted(glob.glob(Q + '/*.json'))
            if not fs: await asyncio.sleep(0.5); continue
            f = fs[0]; out = []
            try: jobs = json.load(open(f))
            except Exception as e: os.rename(f, f + '.bad'); continue
            os.rename(f, f + '.run')
            for j in jobs:
                try:
                    if j.get('vp') and j['vp'] != vp: vp = j['vp']; await pg.set_viewport_size({'width': vp, 'height': vp})
                    if j.get('js'):
                        r = await pg.evaluate('(async()=>{' + j['js'] + '})()')
                        if r is not None: out.append(json.dumps(r)[:4000])
                    if j.get('shot'):
                        await pg.evaluate("(async()=>{ await new Promise(res=>{let n=0; const f=()=>{ if(++n>=%d) res(); else requestAnimationFrame(f); }; requestAnimationFrame(f); setTimeout(res,25000);}); })()" % j.get('frames', 4))
                        await pg.screenshot(path=D + '/shots/' + j['shot'] + '.png', timeout=180000); out.append('shot ' + j['shot'])
                except Exception as e: out.append('ERR ' + str(e)[:300])
            out.append('ERRS ' + json.dumps(errs[-3:])); errs.clear()
            open(f[:-5] + '.out', 'w').write('\n'.join(out)); os.rename(f + '.run', f + '.done')
        await b.close()
asyncio.run(main())
