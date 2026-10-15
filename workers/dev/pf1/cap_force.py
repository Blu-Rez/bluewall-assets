#!/usr/bin/env python3
# pf1/cap_force.py (variant of cap_toggle.py: the cap is forced to level 0 / level 2 with its controller off) — is JS per frame higher when frames are 29 ms apart?  OLD HEADER: pf1/cap_toggle.py — interleaved A/B of the adaptive frame cap INSIDE one page session (switched live with __pf.cap.off; the matrix skip stays ON in both arms): 6 x (5 s off, 5 s on) per view and CPU throttle, medians.  Cancels the drift
# between two separate runs.  Draw calls swallowed (software GL), so JS ms/frame = the CPU side the phone also pays.   -> /home/claude/work/pf1/cap_force.json
import asyncio, json, os, sys, time, subprocess, socket, statistics as st
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; OUT = '/home/claude/work/pf1'; PORT = int(os.environ.get('PF1_PORT', 8800)); ROUNDS = int(os.environ.get('ROUNDS', 6)); WIN = float(os.environ.get('WIN', 5))
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info']
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
INIT = "(()=>{ window.__nd={on:true}; const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();"
async def poker(pg, secs):
    t0 = time.time()
    while time.time() - t0 < secs:
        try: await pg.evaluate("window.dispatchEvent(new Event('pointermove'))")
        except Exception: pass
        await asyncio.sleep(0.6)
async def win(pg, cdp, on, th):
    await pg.evaluate('__pf.cap.off = true; __pf.cap.lvl = %d; __pf.cap.reset();' % (2 if on else 0))   # 'on' here = forced level 2 (gap 29 ms), 'off' = level 0 (gap 10 ms); the controller itself is off
    await cdp.send('Emulation.setCPUThrottlingRate', {'rate': th})
    pk = asyncio.create_task(poker(pg, WIN + 8)); await asyncio.sleep(2.0)                        # (the cap needs 3 s to step down: give it a pre-roll)
    await pg.evaluate('__pf.start()'); await asyncio.sleep(WIN); s = await pg.evaluate('__pf.stop()'); s['capLvl'] = await pg.evaluate('__pf.cap.lvl'); pk.cancel()
    await cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1}); return s

async def ab(pg, cdp, name, th, R):
    rows = {'off': [], 'on': []}
    for r in range(ROUNDS):
        for on in ((False, True) if r % 2 == 0 else (True, False)):         # alternate the order too
            s = await win(pg, cdp, on, th); rows['on' if on else 'off'].append(s)
    out = {}
    for k, v in rows.items():
        g = lambda f: [x[f] for x in v if x.get(f) is not None]
        out[k] = {f: round(st.median(g(f)), 2) for f in ('js', 'render', 'allocMBs', 'avg', 'p95', 'fps', 'calls', 'shCalls', 'capLvl') if g(f)}; out[k]['n'] = len(v)
    R['%s_x%d' % (name, th)] = out; log(name, 'x%d' % th, json.dumps(out)); json.dump(R, open(OUT + '/cap_force.json', 'w'), indent=1)
CAM = "(a)=>{const B=__bw,c=B.ctl; if(c._skipIntro) c._skipIntro(); c.target.set(a.x,(B.world.fastHeight?B.world.fastHeight(a.x,a.z):0),a.z); c.dist=a.d; c.azim=a.az; return 1;}"
async def main():
    R = {}; srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
            await ctx.add_init_script(INIT)
            if False: await ctx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='#game{right:auto!important;bottom:auto!important;width:422px!important;height:195px!important}';document.head.appendChild(s)})")
            pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
            await pg.goto('http://127.0.0.1:%d/pf1_dev.html?pf=1&q=high&w=clear&h=14&wa=0.1' % PORT)
            for i in range(1200):
                await asyncio.sleep(0.5)
                s = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                if s['ready'] and s['late']: break
            await pg.evaluate('window.__bwFixDyn = true; __bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await asyncio.sleep(2)
            await pg.evaluate('(%s)({x:18,z:16,d:240,az:null})' % CAM.replace('c.azim=a.az;', '')); await asyncio.sleep(4)
            await ab(pg, cdp, 'map', 1, R)
            await pg.evaluate('(%s)({x:41,z:-2,d:75,az:0.9})' % CAM); await asyncio.sleep(3); await ab(pg, cdp, 'gate', 1, R)
            await b.close()
    finally:
        if srv: srv.terminate()
    log('DONE')
asyncio.run(main())
