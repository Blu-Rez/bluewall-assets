#!/usr/bin/env python3
# pf1/door_count.py — does PF1 change the number of door items the RP1B test counts (needs >= 100)?  default build vs ?pfoff=1 vs ?nomskip=1 on the same page.
import asyncio, json, sys, time, subprocess
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; PORT = 8797
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
INIT = "(()=>{ window.__nd={on:true}; const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();"
async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            for qs in (sys.argv[1:] or ['', '&pfoff=1', '&nomskip=1']):
                ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
                await ctx.add_init_script(INIT); pg = await ctx.new_page()
                await pg.goto('http://127.0.0.1:%d/pf1_dev.html?q=high&w=clear&h=14&wa=0.1%s' % (PORT, qs))
                for i in range(1500):
                    await asyncio.sleep(0.5)
                    st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                    if st['ready'] and st['late']: break
                await pg.evaluate('__bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await asyncio.sleep(2)
                r = await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,2500)); const it = __rp.doorItems(), dt = __rp.doorTest(); return {items: it.length, tested: dt.length, bad: dt.filter(x=>!x.ok).length, picks: (__bw.world.picks||[]).length}; })()" % int(time.time()))
                print(qs or 'default', json.dumps(r), flush=True); await ctx.close()
            await b.close()
    finally: srv.terminate()
asyncio.run(main())
