import asyncio, sys, os, json
PERF_JS = r'''
async (views) => {
  const B = __bw, r = B.renderer, gl = r.getContext();
  B.pause(true); B.ctl._skipIntro(); B.ctl.update(0.016); B.ctl.update(0.016);
  const run = (n) => { for (let i = 0; i < n; i++) { if (r.shadowMap.enabled) r.shadowMap.needsUpdate = (i % 3 == 0); r.render(B.scene, B.camera); } const px = new Uint8Array(4); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); };
  const out = [];
  const meas = (label) => { run(1); const t0 = performance.now(); run(2); const ms = (performance.now() - t0) / 2; r.info.autoReset = false; r.info.reset(); r.render(B.scene, B.camera); out.push([label, +ms.toFixed(1), r.info.render.calls, Math.round(r.info.render.triangles/1000)+'k']); r.info.autoReset = true; };
  const c = B.camera;
  for (const v of views) {
    if (v[1]) { c.position.set(v[1][0], v[1][1], v[1][2]); c.lookAt(v[1][3], v[1][4], v[1][5]); c.updateMatrixWorld(); }
    // let the world's per-frame logic (culling / LOD) settle for this view
    for (let i = 0; i < 4; i++) { try { B.world.update(B.t + i * 0.05, 0.05, c); } catch (e) {} }
    meas(v[0]);
  }
  return out;
}
'''
VIEWS = [['home', None], ['pasture', [140, 60, 222, 15, 0, 208]], ['yard', [70, 34, 240, 5, 2, 212]], ['owner', [125, 95, 214, 12, 0, 210]]]
from playwright.async_api import async_playwright
# pas_world.py OUT_PREFIX HOUR '[["name","js"],...]'  (env PAGE, W, H, Q, WAIT, WX)  — full world, one load, several views
async def main():
    pre, hour, shots = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
    W = int(os.environ.get('W', 390)); H = int(os.environ.get('H', 844))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error', 'warning') else None)
        await pg.goto('http://127.0.0.1:8777/' + os.environ.get('PAGE', 'dev_pasture.html') + '?q=' + os.environ.get('Q', 'high') + '&w=' + os.environ.get('WX', 'clear') + '&h=' + hour)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready') or await pg.evaluate('(window.__log||[]).some(x=>x.startsWith("ERR"))'): break
        for i in range(900):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        if os.environ.get('PERF'):
            await asyncio.sleep(3)
            res = await pg.evaluate(PERF_JS, VIEWS)
            for row in res: print('PERF', row, flush=True)
            await pg.evaluate('__bw.pause(false)')
        await pg.add_script_tag(path='/home/claude/dev/cam.js')
        for name, js in shots:
            await pg.evaluate(js)
            await asyncio.sleep(float(os.environ.get('WAIT', 3)))
            for i in range(120):
                if await pg.evaluate('window.__f0===undefined || __bw.frames >= window.__f0 + 4'): break
                await asyncio.sleep(1)
            await pg.screenshot(path=pre + name + '.png', timeout=240000)
            print('shot', name, flush=True)
        gl = sum(1 for l in logs if 'GL_INVALID' in l); print('GL_INVALID warnings:', gl)
        try: print(json.dumps(await pg.evaluate('(window.__log||[]).slice(-6)'), ensure_ascii=False))
        except Exception as e: print(e)
        for l in [x for x in logs if 'GL_INVALID' not in x][:20]: print(l[:300])
        await b.close()
asyncio.run(main())
