#!/usr/bin/env python3
# pf1/mem_list.py — the full texture list (>= 512x512) and the biggest geometry, in the map and in hero mode, with who uses them.  -> /home/claude/work/pf1/mem_full.json
import asyncio, json, os, time, subprocess, socket
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; OUT = '/home/claude/work/pf1'; PORT = int(os.environ.get('PF1_PORT', 8797))
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
INIT = "(()=>{ window.__nd={on:true}; const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();"
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
async def main():
    R = {}; srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
            await ctx.add_init_script(INIT); pg = await ctx.new_page()
            await pg.goto('http://127.0.0.1:%d/pf1_dev.html?pf=1&q=high&w=clear&h=14&wa=0.1' % PORT)
            for i in range(1500):
                await asyncio.sleep(0.5)
                st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                if st['ready'] and st['late']: break
            await pg.evaluate('__bw.world.setLevel(30)'); await asyncio.sleep(8)
            R['map'] = await pg.evaluate('__pf.mem(120)')
            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,3000)); return 1; })()" % int(time.time())); await asyncio.sleep(2)
            R['hero'] = await pg.evaluate('__pf.mem(120)')
            json.dump(R, open(OUT + '/mem_full.json', 'w'), indent=1); await b.close()
    finally:
        if srv: srv.terminate()
    print('DONE')
asyncio.run(main())
