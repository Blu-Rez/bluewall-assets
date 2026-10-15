#!/usr/bin/env python3
# pf1/aa_crops.py — 1:1 crops, MSAA on (before) vs off (after) on a phone-like page: 844x390 CSS px at device pixel ratio 2 (the case where main.js now drops the canvas MSAA), tier ultra (canvas ratio 2).
# 'before' = the page is told it is NOT a touch screen (matchMedia('(pointer:coarse)') -> false) so the renderer keeps antialias:true; 'after' = the real behaviour.  Real draw calls (software GL: one frame takes a while).
# usage: aa_crops.py <on|off> <view: map|hero>   -> /home/claude/work/pf1/aa_<view>_<on|off>.png (full frame) + crop png
import asyncio, json, os, sys, time, subprocess, socket
from playwright.async_api import async_playwright
sys.path.insert(0, '/home/claude/dev')
D = '/home/claude/dev/'; OUT = '/home/claude/work/pf1'; PORT = int(os.environ.get('PF1_PORT', 8792))
MODE, VIEW = sys.argv[1], sys.argv[2]
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
INIT = "(()=>{ window.__nd={on:true}; const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();"
FAKE_MOUSE = "(()=>{ const mm=window.matchMedia.bind(window); window.matchMedia=(q)=>{ const r=mm(q); if(/pointer:\\s*coarse/.test(q)) return {matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){},onchange:null}; return r; }; })();"
CAMJS = "(a)=>{const B=__bw,c=B.ctl; if(c._skipIntro) c._skipIntro(); c.target.set(a.x,(B.world.fastHeight?B.world.fastHeight(a.x,a.z):0),a.z); c.dist=a.d; c.azim=a.az; return 1;}"
async def main():
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=2, is_mobile=True, has_touch=True)
            await ctx.add_init_script(INIT)
            if MODE == 'on': await ctx.add_init_script(FAKE_MOUSE)
            pg = await ctx.new_page()
            await pg.goto('http://127.0.0.1:%d/pf1_dev.html?pf=1&q=ultra&w=clear&h=14&wa=0.1' % PORT)
            for i in range(1200):
                await asyncio.sleep(0.5)
                st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                if st['ready'] and st['late']: break
            await pg.evaluate('window.__bwFixDyn = true; __bw.ctl._skipIntro && __bw.ctl._skipIntro()')
            for i in range(40):                       # the intro fly-in must be over, or it keeps pulling the camera back to the start view (that made the first on/off pair incomparable)
                if not await pg.evaluate('!!__bw.ctl.intro'): break
                await pg.evaluate('(()=>{const c=__bw.ctl; if(c.intro){ c.intro.hold=false; c.intro.t=c.intro.dur; } return 1;})()'); await asyncio.sleep(0.5)
            if VIEW == 'hero':
                await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,3000)); __rp.setPos(40.95,-2.17,0); __rp.setLook(0.3,0.25); return 1; })()" % int(time.time()))
            else:
                await pg.evaluate('(%s)({x:41,z:-2,d:75,az:%s})' % (CAMJS, '0.9'))
            await asyncio.sleep(6)
            if VIEW != 'hero': await pg.evaluate('(%s)({x:41,z:-2,d:75,az:0.9})' % CAMJS); await asyncio.sleep(1.5)
            info = await pg.evaluate("(()=>{const r=__bw.renderer, c=__bw.ctl, cam=__bw.camera, a=r.getContext().getContextAttributes(); return {aa: a.antialias, pr: r.getPixelRatio(), dyn: __bw.DYN? __bw.DYN.s : null, size: r.getDrawingBufferSize(new __bw.THREE.Vector2()).toArray(), level: __bw.Q.level, coarse: matchMedia('(pointer:coarse)').matches, intro: !!c.intro, dist: +c.dist.toFixed(1), azim: +c.azim.toFixed(2), cam: cam ? cam.position.toArray().map(v=>+v.toFixed(1)) : null}})()")
            log(MODE, VIEW, info)
            await pg.evaluate('window.__nd.on=false'); await asyncio.sleep(1.0)
            await pg.screenshot(path='%s/aa_%s_%s.png' % (OUT, VIEW, MODE), timeout=900000)
            await pg.evaluate('window.__nd.on=true')
            json.dump(info, open('%s/aa_%s_%s.json' % (OUT, VIEW, MODE), 'w'))
            await b.close()
    finally:
        if srv: srv.terminate()
    log('DONE')
asyncio.run(main())
