#!/usr/bin/env python3
# bt1r2_probe.py <tag> <js-file> — boots dev/bt1r2_<tag>.html, starts an attack (lv LV), skips the intro and prints the JSON the JS file (an expression returning a value / promise) evaluates to.
#   env: Q=low LV=30 SEND=1 (send every squad at the keep and wait WAIT s first)  WAIT=12  NODRAW=1
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright
TAG = sys.argv[1]; JS = open(sys.argv[2]).read(); Q = os.environ.get('Q', 'low'); LV = int(os.environ.get('LV', 30))
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS); ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
        if os.environ.get('NODRAW', '1') == '1':
            await ctx.add_init_script("(()=>{ window.__nd={on:true}; const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append('console.' + m.type + ': ' + m.text[:400]) if (m.type in ('warning', 'error') and ('camp' in m.text.lower() or 'swap' in m.text.lower() or 'layout' in m.text.lower() or 'Error' in m.text)) else None)
        await pg.goto('http://127.0.0.1:8777/bt1r2_%s.html?pf=1&q=%s&w=clear&h=14&wa=0.1&lv=%d' % (TAG, Q, LV))
        for i in range(3600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        tgt = json.dumps({'id': 'bt1', 'name': 'Rival', 'emblem': 'flame', 'ratio': 1, 'levels': {'keep': LV, 'wall': LV, 'towers': LV}, 'seed': 12345, 'power': 1000, 'loot': {'ruby': 1, 'emerald': 1, 'turq': 1}})
        await pg.evaluate('__bw.battle.start(%s)' % tgt)
        for i in range(2400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        await asyncio.sleep(3); await pg.evaluate('__bw.battle.session.cam.intro = 0'); await asyncio.sleep(1)
        if os.environ.get('SEND'):
            await pg.evaluate("(() => { const s = __bw.battle.session, k = __bw.world.baseMeta.keep; for (const t of s.types) s.sim.send(t, k.x, k.z); s.started = true; })()"); await asyncio.sleep(float(os.environ.get('WAIT', 12)))
        r = await pg.evaluate(JS); print(json.dumps(r, indent=1)[:int(os.environ.get('MAXC', 12000))]); print('ERRORS', errs[:int(os.environ.get('NERR', 6))]); await b.close()
asyncio.run(main())
