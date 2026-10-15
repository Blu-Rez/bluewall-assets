#!/usr/bin/env python3
# pf1/mskip_watch.py [qs ...] — sample "world == parent x local" right after EVERY 3rd frame for ~40 s (map view, slow orbit), skip on vs off: how often / which object / what kind of mismatch.
import asyncio, json, os, sys, time, subprocess, socket
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; PORT = 8796
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
INIT = "(()=>{ window.__nd={on:true}; const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();"
JS = r"""(async (secs) => {
  const T = __bw.THREE, a = new T.Matrix4(), c = new T.Matrix4(); const res = { samples: 0, badSamples: 0, hits: {}, objs: 0, first: [] };
  const dd = (x, y) => { let d = 0; for (let i = 0; i < 16; i++) d = Math.max(d, Math.abs(x[i] - y[i]) / (1 + Math.abs(y[i]))); return d; };
  const roots = () => { const r = [__bw.scene]; const h = window.__rp && __rp.hero && __rp.hero.scene; if (h && h !== __bw.scene) r.push(h); return r; };
  const scan = () => { const bad = []; let n = 0; for (const root of roots()) root.traverse((o) => { if (!o.matrixAutoUpdate) return; n++;
      if (o.pivot === null) { c.compose(o.position, o.quaternion, o.scale); const d = dd(o.matrix.elements, c.elements); if (d > 1e-9) bad.push([o, 'L', d]); }
      if (o.matrixWorldAutoUpdate) { if (o.parent) a.multiplyMatrices(o.parent.matrixWorld, o.matrix); else a.copy(o.matrix); const d = dd(o.matrixWorld.elements, a.elements); if (d > 1e-6) bad.push([o, 'W', d]); } }); res.objs = n; return bad; };
  const t0 = performance.now(); let f0 = __bw.frames;
  await new Promise((done) => { const tick = () => { if (performance.now() - t0 > secs * 1000) return done(); __bw.ctl.azim += 0.004;
      if (__bw.frames - f0 >= 3) { f0 = __bw.frames; const bad = scan(); res.samples++; if (bad.length) { res.badSamples++; for (const [o, k, d] of bad) { const nm = (o.name || o.type) + ':' + k + (o.parent ? '<' + (o.parent.name || o.parent.type) : ''); res.hits[nm] = (res.hits[nm] || 0) + 1; } } }
      requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  return res; })"""
async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            for qs in (sys.argv[1:] or ['', '&nomskip=1']):
                ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
                await ctx.add_init_script(INIT); pg = await ctx.new_page()
                await pg.goto('http://127.0.0.1:%d/pf1_dev.html?pf=1&q=high&w=clear&h=14&wa=0.1%s' % (PORT, qs))
                for i in range(1500):
                    await asyncio.sleep(0.5)
                    st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                    if st['ready'] and st['late']: break
                await pg.evaluate('window.__bwFixDyn = true; __bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await asyncio.sleep(2)
                if os.environ.get('HERO'):
                    await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,3000)); __rp.setPos(40.95,-2.17,0); __rp.setLook(0.3,0.25); return 1; })()" % int(time.time())); await asyncio.sleep(3)
                r = await pg.evaluate(JS + "(%s)" % os.environ.get('SECS', '40'))
                print(qs or 'skip-on', json.dumps(r), flush=True)
                await ctx.close()
            await b.close()
    finally: srv.terminate()
asyncio.run(main())
