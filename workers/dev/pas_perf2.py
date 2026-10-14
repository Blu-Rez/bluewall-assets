import asyncio, sys, os, json
from playwright.async_api import async_playwright
# pas_perf2.py : base page and my page, one browser, same views; plus a breakdown of my parts on my page
JS = r'''
async ([views, mine]) => {
  const B = __bw, r = B.renderer, gl = r.getContext();
  B.pause(true); B.ctl._skipIntro(); B.ctl.update(0.016); B.ctl.update(0.016);
  const run = (n) => { for (let i = 0; i < n; i++) { if (r.shadowMap.enabled) r.shadowMap.needsUpdate = false; r.render(B.scene, B.camera); } const px = new Uint8Array(4); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); };
  const count = () => { r.info.autoReset = false; r.info.reset(); r.render(B.scene, B.camera); const o = [r.info.render.calls, Math.round(r.info.render.triangles / 1000)]; r.info.autoReset = true; return o; };
  const shadowCount = () => { r.info.autoReset = false; r.info.reset(); r.shadowMap.needsUpdate = true; r.render(B.scene, B.camera); const o = [r.info.render.calls, Math.round(r.info.render.triangles / 1000)]; r.info.autoReset = true; return o; };
  const out = [];
  const c = B.camera;
  for (const v of views) {
    if (v[1]) { c.position.set(v[1][0], v[1][1], v[1][2]); c.lookAt(v[1][3], v[1][4], v[1][5]); c.updateMatrixWorld(); }
    for (let i = 0; i < 4; i++) { try { B.world.update(B.t + i * 0.05, 0.05, c); } catch (e) {} }
    run(1); const t0 = performance.now(); run(2); const ms = (performance.now() - t0) / 2;
    const row = { view: v[0], ms: +ms.toFixed(0), main: count(), withShadow: shadowCount() };
    if (mine && window.__pas && window.__pasFX) {
      window.__pas.hide(true); const e = window.__pasFX.mesh, g = window.__pasFX.group, ev = e.visible, gv = g.visible; e.visible = false; g.visible = false;
      row.mineOff = count(); row.mineOffShadow = shadowCount();
      window.__pas.hide(false); e.visible = ev; g.visible = gv;
    }
    out.push(row);
  }
  return out;
};
'''
VIEWS = [['home', None], ['pasture', [140, 60, 222, 15, 0, 208]], ['yard', [70, 34, 240, 5, 2, 212]], ['owner', [125, 95, 214, 12, 0, 210]]]
async def one(p, page, mine):
    b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg = await b.new_page(viewport={'width': 390, 'height': 844})
    logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
    await pg.goto(f'http://127.0.0.1:8777/{page}?q=high&h=12&w=clear')
    for i in range(3000):
        await asyncio.sleep(0.5)
        if await pg.evaluate('!!window.__ready'): break
    for i in range(900):
        if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
        await asyncio.sleep(1)
    await asyncio.sleep(3)
    res = await pg.evaluate(JS, [VIEWS, mine])
    for row in res: print(page, json.dumps(row), flush=True)
    for l in logs: print(l)
    await b.close()
async def main():
    async with async_playwright() as p:
        await one(p, 'dev_pasture_base.html', False)
        await one(p, 'dev_pasture.html', True)
asyncio.run(main())
