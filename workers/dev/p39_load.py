import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# p39_load.py : the load sequence of the real game, old loader (OLD=1) vs new, measured.  Q=high (the phone's tier), 390x844.
Q = os.environ.get('Q', 'high'); OLD = os.environ.get('OLD'); H = os.environ.get('H', '14'); TAG = os.environ.get('TAG', 'new' if not OLD else 'old')
INIT = open('/home/claude/dev/p39_init.js').read()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        await pg.add_init_script(INIT)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:160]) if ('[late]' in m.text or m.type in ('error',)) else None)
        t0 = time.time()
        await pg.goto(f'http://127.0.0.1:8777/dev_s35.html?q={Q}&w=clear&h={H}&wa=0.1&lv=30' + ('&oldload=1' if OLD else ''))
        for i in range(4000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        tr = round(time.time() - t0); print(TAG, 'ready (wall s)', tr, flush=True)
        tl = []
        if os.environ.get('SHOT'):
            await pg.evaluate("() => { const c=__bw.ctl; c.intro=null; c.target.set(0,0,0); c.dist=c.maxD*0.7; c.polar=0.95; c.azim=0.5; }")
            await asyncio.sleep(6); await pg.screenshot(path=f'/home/claude/work/p39_{TAG}_ctr.png', timeout=240000)
            await pg.evaluate("() => { const c=__bw.ctl; c.target.set(0,0,0); c.dist=c.maxD*1.0; c.polar=0.25; c.azim=0.6; }")
            await asyncio.sleep(6); await pg.screenshot(path=f'/home/claude/work/p39_{TAG}_top.png', timeout=240000)
        for i in range(int(os.environ.get('TL', 24))):
            await asyncio.sleep(5)
            tl.append(await pg.evaluate("() => ({ prog: __bw.renderer.info.programs.length, pr: __bw.pathReady, lr: __bw.lateReady, calls: __bw.renderer.info.render.calls })"))
        res = await pg.evaluate("() => ({ gls: window.__gls, lateT: __bw.lateT, sw: __bw.sw ? __bw.sw.stats : null, progs: __bw.renderer.info.programs.length, tex: __bw.renderer.info.memory.textures, geo: __bw.renderer.info.memory.geometries })")
        g = res['gls']; long = sorted(g['long'], key=lambda x: -x[1])
        print('programs', res['progs'], 'textures', res['tex'], 'geometries', res['geo'])
        print('lateT', {k: round(v) for k, v in res['lateT'].items() if isinstance(v, (int, float))})
        print('sw', res['sw'])
        print('GL ms: link %.0f (%d)  status %.0f (%d)  compileShader %.0f (%d)' % (g['link'], g['linkN'], g['stat'], g['statN'], g['comp'], g['compN']))
        print('timeline (every 5 s after ready):', [(t['prog'], t['pr']['screen'], t['pr']['rt']) for t in tl][:24])
        print('long tasks top 10 (start ms, dur ms):', long[:10]); print('n long tasks', len(long), ' sum of >1s:', sum(d for s, d in long if d > 1000))
        print('LoAF (>1.5 s):', json.dumps(g.get('loaf', []))[:3500], g.get('loafErr')); print('slowest units:', json.dumps(res['sw'].get('top') if res['sw'] else None)[:1500]); print('big GL calls', g['big'][:10]); print('LOGS', [l for l in logs][:40])
        json.dump({'res': res, 'tl': tl, 'logs': logs}, open(f'/home/claude/work/load_{TAG}_{Q}.json', 'w'))
        await b.close()
asyncio.run(main())
