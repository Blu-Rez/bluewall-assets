# usage: perf.py Q [label:js_on:js_off ...]  -> ms/frame (swiftshader) for each toggle
import asyncio, sys, json, os
from playwright.async_api import async_playwright
JS = r'''
async (tests) => {
  const B = __bw, r = B.renderer, gl = r.getContext();
  B.pause(true); B.ctl._skipIntro(); B.ctl.update(0.016); B.ctl.update(0.016);
  const run = (n) => { for (let i = 0; i < n; i++) { if (r.shadowMap.enabled) r.shadowMap.needsUpdate = (i % 2 == 0); r.render(B.scene, B.camera); } const px = new Uint8Array(4); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); };
  const out = [];
  const meas = (label) => { run(2); const t0 = performance.now(); run(6); const ms = (performance.now() - t0) / 6; out.push([label, +ms.toFixed(1), r.info.render.calls, Math.round(r.info.render.triangles/1000)+'k']); };
  meas('base');
  for (const [label, on, off] of tests) { try { eval(on); meas(label); eval(off); } catch (e) { out.push([label, 'ERR ' + e.message]); } }
  return out;
}
'''
async def main():
    q = sys.argv[1]; tests = [a.split('::') for a in sys.argv[2:]]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':int(os.environ.get('VW',360)),'height':int(os.environ.get('VH',780))})
        logs=[]; pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:300]))
        await pg.goto(f'http://127.0.0.1:8777/'+__import__('os').environ.get('PAGE','dev.html')+f'?q={q}&h={os.environ.get("H","12")}&w={os.environ.get("WX","clear")}')
        for i in range(6000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        await asyncio.sleep(float(os.environ.get('SLEEP','4')))
        res = await pg.evaluate(JS, tests)
        for row in res: print(row)
        for l in logs: print(l)
        await b.close()
asyncio.run(main())
