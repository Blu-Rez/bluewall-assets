#!/usr/bin/env python3
# pf1_bench_check.py — boots the game (draw commands swallowed after boot only for the CPU-side run), turns the on-device readout on, runs BW_bench.run({secs}) and takes full-size frames:
# HUD in map mode, HUD in hero mode, bench result card.  Output: <PF1_OUT>/bench_*.png + bench_check.json
import asyncio, json, os, time, subprocess, socket
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; OUT = os.environ.get('PF1_OUT', '/home/claude/work/pf1'); os.makedirs(OUT, exist_ok=True)
PORT = int(os.environ.get('PF1_PORT', 8791)); SECS = float(os.environ.get('PF1_BENCH_SECS', 4)); Q = os.environ.get('PF1_Q', 'high'); REAL = os.environ.get('PF1_REAL', '1')
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info']
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
INIT = "(()=>{ window.__nd={on:true}; const P=[[WebGL2RenderingContext,'drawElements'],[WebGL2RenderingContext,'drawArrays'],[WebGL2RenderingContext,'drawElementsInstanced'],[WebGL2RenderingContext,'drawArraysInstanced'],[WebGL2RenderingContext,'drawRangeElements']]; for(const [C,k] of P){ const o=C.prototype[k]; C.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();"
HUD_JS = "(()=>{ const c=[...document.querySelectorAll('#game > div')].filter(d=>/ fps · .* ms · .* calls · .* tris · .* px · q /.test(d.textContent||'')); if(!c.length) return null; const d=c[0], r=d.getBoundingClientRect(), cs=getComputedStyle(d); return {t:d.textContent.split('\\n')[0], vis:cs.visibility, r:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)]}; })()"
async def wait_hud(pg, prefix='', secs=240):
    t0 = time.time()                                    # (real draws: one frame takes seconds here; the readout is written inside the frame loop)
    while time.time() - t0 < secs:
        await pg.evaluate("window.dispatchEvent(new Event('pointermove'))")
        r = await pg.evaluate(HUD_JS)
        if r and r.get('vis') == 'visible' and r['t'].startswith(prefix): return r
        await asyncio.sleep(2)
    return None
async def main():
    R = {'errors': []}; srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
            await ctx.add_init_script(INIT)
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: R['errors'].append('page: ' + str(e)[:200]))
            await pg.goto('http://127.0.0.1:%d/pf1_dev.html?pf=1&q=%s&w=clear&h=14&wa=0.1' % (PORT, Q))
            for i in range(1200):
                await asyncio.sleep(0.5)
                st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                if st['ready'] and st['late']: break
            log('booted', i * 0.5, 's'); await pg.evaluate('__bw.ctl._skipIntro && __bw.ctl._skipIntro()')
            await pg.evaluate("__bw.settings.perfInfo = true; window.dispatchEvent(new Event('pointermove'))"); await asyncio.sleep(3)
            R['hud_map'] = await pg.evaluate("(document.querySelector('.bwph')||{}).innerText || [...document.querySelectorAll('div')].filter(d=>/fps/.test(d.innerText||'')&&d.children.length<4&&getComputedStyle(d).position=='fixed').map(d=>d.innerText).join('|')")
            log('hud map', R['hud_map'])
            async def shot(name):
                await pg.evaluate('window.__nd.on=false'); await asyncio.sleep(0.2)
                try: await pg.screenshot(path='%s/bench_%s.png' % (OUT, name), timeout=240000)
                except Exception as e: R['errors'].append('shot %s %s' % (name, str(e)[:100]))
                await pg.evaluate('window.__nd.on=true')
            R['hud_map'] = await wait_hud(pg, 'map', 60); log('hud map (before the run)', R['hud_map'])
            R['bench'] = await pg.evaluate('BW_bench.run({secs:%s})' % SECS)
            log('bench', json.dumps(R['bench'])[:400]); R['recdbg'] = await pg.evaluate('({n: __pf.rec.F.n, on: __pf.rec.on, t0: __pf.rec.F.t[0], t1: __pf.rec.F.t[5]})'); log('rec', R['recdbg'])
            R['card'] = await pg.evaluate("[...document.querySelectorAll('div')].filter(d=>/^BENCH/.test(d.textContent||'')&&d.children.length==0).map(d=>d.textContent)")
            if REAL == '1': await shot('card'); R['hud_map2'] = await wait_hud(pg, 'map', 120); await shot('map_hud')
            # hero mode readout
            try:
                await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,3000)); __rp.setPos(40.95,-2.17,0); __rp.setLook(0.3,0.25); return 1; })()" % int(time.time()))
                await pg.evaluate("window.dispatchEvent(new Event('pointermove'))"); await asyncio.sleep(3)
                R['hud_hero'] = await pg.evaluate("[...document.querySelectorAll('div')].filter(d=>/ fps /.test(d.textContent||'')&&d.children.length<5).map(d=>d.textContent.slice(0,200)).slice(0,3)")
                log('hud hero', R['hud_hero'])
                R['hud_hero'] = await wait_hud(pg, 'hero', 300); log('hud hero', R['hud_hero'])
                if REAL == '1': await shot('hero_hud')
                await pg.evaluate('__rp.exit && __rp.exit(); 1')
            except Exception as e: R['errors'].append('hero ' + str(e)[:150])
            json.dump(R, open(OUT + '/bench_check.json', 'w'), indent=1); await b.close()
    finally:
        if srv: srv.terminate()
    log('DONE', R['errors'])
asyncio.run(main())
