#!/usr/bin/env python3
# pf1/mskip_diag.py — which live object breaks "world == parent x local" with the matrix skip on, and why (stale world vs. an external writer)?  map view, software GL (draws swallowed).
import asyncio, json, sys, time, subprocess, socket
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; PORT = 8796
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
INIT = "(()=>{ window.__nd={on:true}; const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();"
JS = r"""(async (mode) => {
  const T = __bw.THREE, scene = __bw.scene, a = new T.Matrix4(); const out = {mode, rounds: []};
  const chain = (o) => { const c = []; for (let p = o; p; p = p.parent) c.push((p.name || p.type) + '[' + p.type + (p.matrixAutoUpdate ? '' : ',noauto') + (p.matrixWorldAutoUpdate ? '' : ',nowauto') + (p.matrixWorldNeedsUpdate ? ',NU' : '') + (p.pivot === null ? ',piv' : '') + ']'); return c.slice(0, 7); };
  const scan = () => { const bad = []; scene.traverse((o) => { if (!o.matrixAutoUpdate || !o.matrixWorldAutoUpdate) return; if (o.parent) a.multiplyMatrices(o.parent.matrixWorld, o.matrix); else a.copy(o.matrix);
      let d = 0; for (let i = 0; i < 16; i++) d = Math.max(d, Math.abs(o.matrixWorld.elements[i] - a.elements[i]) / (1 + Math.abs(a.elements[i]))); if (d > 1e-6) bad.push({o, d}); }); return bad; };
  for (let r = 0; r < 8; r++) {
    await new Promise((res) => setTimeout(res, 700 + r * 130));
    const bad = scan(); const rec = { n: bad.length, items: bad.slice(0, 3).map(({o, d}) => ({ name: o.name || o.type, d: +d.toFixed(3), chain: chain(o), kids: o.children.length, pos: o.position.toArray().map((v) => +v.toFixed(2)), wpos: [o.matrixWorld.elements[12], o.matrixWorld.elements[13], o.matrixWorld.elements[14]].map((v) => +v.toFixed(2)), ud: Object.keys(o.userData || {}).slice(0, 6), hasOBR: !!o.onBeforeRender && o.onBeforeRender.toString().length > 40 })) };
    if (bad.length) { const o = bad[0].o; const before = o.matrixWorld.clone(); o.updateWorldMatrix(true, false); let d = 0; for (let i = 0; i < 16; i++) d = Math.max(d, Math.abs(before.elements[i] - o.matrixWorld.elements[i])); rec.refreshChange = +d.toFixed(3); o.matrixWorld.copy(before); }
    out.rounds.push(rec);
  }
  return out;
})"""
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
                cdp = await ctx.new_cdp_session(pg)
                for th in (1, 4, 6):                                   # the same sequence as pf1_measure's map view: three recorded windows at CPU x1/x4/x6, pointer pokes
                    await cdp.send('Emulation.setCPUThrottlingRate', {'rate': th}); await asyncio.sleep(1.0)
                    await pg.evaluate('__pf.start()')
                    for k in range(12):
                        await pg.evaluate("window.dispatchEvent(new Event('pointermove'))"); await asyncio.sleep(0.6)
                    await pg.evaluate('__pf.stop()')
                await cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
                r = await pg.evaluate(JS + "('%s')" % (qs or 'skip-on'))
                print(json.dumps(r, indent=1), flush=True)
                await ctx.close()
            await b.close()
    finally: srv.terminate()
asyncio.run(main())
