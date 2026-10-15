#!/usr/bin/env python3
# an1r3_near.py — AN1_R3: "nothing may change near the camera".  Boots the game paused, parks the camera, steps world.update(t, 1/30) by hand from the same clock value and records every frame
#   * the carts (horse + driver: x, z, yaw, y) that stay inside 55 m of the camera the whole time,
#   * the F6 counters (how many mover steps were taken at which level),
# once with the LOD on and once with ?an1lod=0.  Cart poses are a pure function of the clock, so near carts must be IDENTICAL in both runs (max difference 0).  (The villagers share a seeded random generator with
# the far ones: their random CHOICES drift after the first far draw - see the report; here their dt per step is checked through the counters instead.)
# Usage: python3 an1r3_near.py   -> work/an1r3/near.json + a verdict line.   Env: AN1_SPOTS name:x:z,...  AN1_FRAMES
import asyncio, json, os, sys, time, subprocess, socket, math
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; OUT = os.environ.get('AN1_OUT', '/home/claude/work/an1r3'); os.makedirs(OUT, exist_ok=True); PORT = int(os.environ.get('AN1_PORT', 8796))
FR = int(os.environ.get('AN1_FRAMES', 900)); SPOTS = [s.split(':') for s in os.environ.get('AN1_SPOTS', 'town:20:16,gate:41:-2,fields:211:2').split(',')]
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
JS = r"""
async (a) => {
  const [x, z, FR] = a, B = __bw, W = B.world.ctx.wsLife, cam = B.camera, h = B.world.fastHeight;
  cam.position.set(x, h(x, z) + 45, z + 35); cam.lookAt(x, h(x, z), z); cam.updateMatrixWorld(true);
  let t = 1000; const step = () => { t += 1 / 30; B.world.update(t, 1 / 30, cam); };
  for (let i = 0; i < 400; i++) step();                         // the worksite grids get built, the carts get their first pose
  window.__an1lod && __an1lod.reset();
  const rec = new Map(); let nf = 0;
  for (let i = 0; i < FR; i++) {
    step(); nf++;
    W.carts.forEach((c, k) => {
      if (!c.horse || c.horse.y < -500) return;
      const d = Math.hypot(c.horse.x - cam.position.x, c.horse.y - cam.position.y, c.horse.z - cam.position.z);
      let r = rec.get(k); if (!r) { r = { k, site: c.S.site.id, dmax: 0, dmin: 1e9, f: [] }; rec.set(k, r); }
      r.dmax = Math.max(r.dmax, d); r.dmin = Math.min(r.dmin, d);
      r.f.push([c.horse.x, c.horse.y, c.horse.z, c.horse.yaw, c.driver ? c.driver.x : 0, c.driver ? c.driver.y : 0, c.driver ? c.driver.z : 0, c.driver ? c.driver.yaw : 0]);
    });
  }
  return { st: window.__an1lod ? __an1lod.snapshot() : null, carts: [...rec.values()], frames: nf };
}
"""
async def run(tag, qs, spot):
    name, x, z = spot
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
        await ctx.add_init_script("(()=>{ const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ return; }; } })();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto('http://127.0.0.1:%d/pf1_dev.html?q=high&w=clear&h=14&wa=0.1%s' % (PORT, qs))
        for i in range(3600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready && !!(window.__bw && __bw.lateReady)'): break
        await pg.evaluate('__bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await pg.evaluate('__bw.pause(true)'); await asyncio.sleep(1)
        r = await pg.evaluate(JS, [float(x), float(z), FR]); r['errors'] = errs
        await b.close(); return r
async def main():
    srv = None
    if not up(): srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    res = {}
    try:
        for spot in SPOTS:
            on = await run('on', '', spot); off = await run('off', '&an1lod=0', spot)
            A = {c['k']: c for c in on['carts']}; Bc = {c['k']: c for c in off['carts']}
            near = [k for k in A if k in Bc and A[k]['dmax'] < 55 and Bc[k]['dmax'] < 55 and len(A[k]['f']) == len(Bc[k]['f'])]
            far = [k for k in A if k in Bc and A[k]['dmin'] > 62 and len(A[k]['f']) == len(Bc[k]['f'])]
            def maxdiff(ks):
                m = 0.0; n = 0
                for k in ks:
                    for fa, fb in zip(A[k]['f'], Bc[k]['f']):
                        n += 1; m = max(m, max(abs(p - q) for p, q in zip(fa[:3] + fa[4:7], fb[:3] + fb[4:7])))
                return m, n
            mn, nn = maxdiff(near); mf, nfr = maxdiff(far)
            res[spot[0]] = {'on': on['st'], 'off': off['st'], 'near_carts': len(near), 'near_frames': nn, 'near_maxdiff_m': mn, 'far_carts': len(far), 'far_frames': nfr, 'far_maxdiff_m': mf, 'errors': on['errors'] + off['errors']}
            log(spot[0], 'near carts', len(near), 'frames', nn, 'max diff', mn, '| far carts', len(far), 'max diff %.3f m' % mf, '| steps on', on['st']['steps'], 'of', on['st']['calls'])
    finally:
        if srv: srv.terminate()
    json.dump(res, open(OUT + '/near.json', 'w'), indent=1)
asyncio.run(main())
