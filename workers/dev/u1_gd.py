import asyncio, sys, json, os, time, glob
from playwright.async_api import async_playwright
# u1_gd.py [W H] : the REAL game (dev_s35.html) in one browser, loaded once; then it runs u1_q/<n>.json = [{js, vp:[w,h], shot:'name', frames:N, wait:ms}] in order and writes u1_q/<n>.out.  touch u1_q/QUIT to stop.
#   u1_q.py has run(jobs) for the client side.  Shots go to /home/claude/work/shots/game/<shot>.png
D = '/home/claude/dev'; Q = D + '/u1_q'; OUT = '/home/claude/work/shots/game'
W = int(sys.argv[1]) if len(sys.argv) > 1 else 390; H = int(sys.argv[2]) if len(sys.argv) > 2 else 844
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append(m.text[:300]) if m.type == 'error' and '404' not in m.text and 'Failed to load' not in m.text else None)
        t0 = time.time()
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=high&w=clear&h=12&wa=1')
        for i in range(1200):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('(()=>{const c=__bw.ctl; c._skipIntro(); c.intro=null; c.vel.set(0,0)})()')
        open(Q + '/READY', 'w').write(str(round(time.time() - t0))); print('ready', round(time.time() - t0), flush=True)
        vp = [W, H]
        while not os.path.exists(Q + '/QUIT'):
            fs = sorted(glob.glob(Q + '/*.json'))
            if not fs: await asyncio.sleep(0.5); continue
            f = fs[0]; out = []
            try: jobs = json.load(open(f))
            except Exception as e: os.rename(f, f + '.bad'); continue
            os.rename(f, f + '.run')
            for j in jobs:
                try:
                    if j.get('vp') and j['vp'] != vp: vp = j['vp']; await pg.set_viewport_size({'width': vp[0], 'height': vp[1]}); await asyncio.sleep(1.5)
                    if j.get('js'):
                        r = await pg.evaluate('(async()=>{' + j['js'] + '})()')
                        if r is not None: out.append(json.dumps(r)[:3000])
                    if j.get('wait'): await asyncio.sleep(j['wait'] / 1000)
                    if j.get('shot'):
                        await pg.evaluate("(async()=>{ await new Promise(res=>{let n=0; const f=()=>{ if(++n>=%d) res(); else requestAnimationFrame(f); }; requestAnimationFrame(f); setTimeout(res,25000);}); })()" % j.get('frames', 4))
                        await pg.screenshot(path=OUT + '/' + j['shot'] + '.png', timeout=180000); out.append('shot ' + j['shot'])
                except Exception as e: out.append('ERR ' + str(e)[:300])
            out.append('ERRS ' + json.dumps(errs[-3:])); errs.clear()
            open(f[:-5] + '.out', 'w').write('\n'.join(out)); os.rename(f + '.run', f + '.done')
        await b.close()
asyncio.run(main())
