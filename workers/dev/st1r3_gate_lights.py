#!/usr/bin/env python3
# ST1_R3 evidence for QA1-012 (S01 gate_out, night: the gate towers blown to white round the two braziers).  Read-only experiment on the live game (dev build, software GL, hour 23): the same S01 third-person frame with
# the gate torches' point lights (world.js ctx.torch: PointLight 80 cd, distance 22, decay 1.8) scaled x1 / x0.5 / x0.3 / x0.15 -> work/qa1/out/r3_gatelights/S01_x<k>.png + the pixel numbers of the tower faces.
import asyncio, base64, json, os, sys, time
from playwright.async_api import async_playwright
OUT = '/home/claude/work/qa1/out/r3_gatelights/'; os.makedirs(OUT, exist_ok=True)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
S = {'x': 63.2, 'z': 33.2, 'lx': 49, 'lz': 26}
def save_png(url, path): open(path, 'wb').write(base64.b64decode(url.split(',', 1)[1]))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1, has_touch=True, is_mobile=True)
        await pg.goto('http://127.0.0.1:8777/rp1_dev_r3.html?q=high&w=clear&h=23&wa=0.1', timeout=900000)
        for i in range(4000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(1500):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await pg.evaluate(open('/home/claude/dev/qa1_page.js').read()); await pg.evaluate('QA1.init()')
        G = json.load(open('/home/claude/work/qa1/layout_dump.json'))['gate']; await pg.evaluate('window.__qa1.gate=%s' % json.dumps({'nx': G['nx'], 'nz': G['nz']}))
        print(await pg.evaluate("JSON.stringify({h:__bw.P().hour, night:__bw.P().night})"))
        print('hero', await pg.evaluate("QA1.startHero('elina')"))
        print('place', await pg.evaluate('QA1.place(%s,"third")' % json.dumps(S)))
        info = await pg.evaluate("""(() => { const w = __bw.world; const f = (w && (w.fx || (w.ctx && w.ctx.fx))) || null; const ls = f && f.lights ? f.lights : null;
          if (!ls) return {err: 'no fx.lights', keys: Object.keys(w || {}).slice(0, 40)};
          window.__L0 = ls.map((q) => q.base); return { n: ls.length, bases: window.__L0.slice(0, 12), pos: ls.slice(0, 12).map((q) => [q.l.position.x, q.l.position.y, q.l.position.z].map((v) => +v.toFixed(1))) }; })()""")
        print('lights', json.dumps(info))
        # do the storage yards' lanterns burn at night?  (QA1-027)  flames / glow pools near the oil yard (-84, 90) and the stone yard (-51, 66)
        diag = await pg.evaluate("""(() => { const w = __bw.world, f = w.fx || w.ctx.fx, fl = f.flames, po = f.pools, out = {};
          out.flames = fl.s.length; out.flamesVisible = !!(fl.points && fl.points.visible); out.uNight = fl.mat ? fl.mat.uniforms.uNight.value : null;
          out.pools = po.items.length; out.poolsVisible = !!(po.mesh && po.mesh.visible);
          const near = (cx, cz) => { const r = []; for (let i = 0; i < fl.s.length; i++) { const x = fl.p[i * 3], y = fl.p[i * 3 + 1], z = fl.p[i * 3 + 2]; if (Math.hypot(x - cx, z - cz) < 14) r.push({ x: +x.toFixed(1), y: +y.toFixed(2), z: +z.toFixed(1), size: fl.s[i], tid: fl.tid[i] }); } return r; };
          out.flOil = near(-84, 90); out.flStone = near(-51, 66);
          out.poolOil = po.items.filter((q) => Math.hypot(q.x + 84, q.z - 90) < 14).map((q) => ({ x: +q.x.toFixed(1), y: +q.y.toFixed(2), z: +q.z.toFixed(1), r: q.r, a: q.a })); 
          const sizeAttr = fl.points ? fl.points.geometry.attributes.size : null; out.sizeZero = sizeAttr ? Array.from({ length: fl.s.length }, (_, i) => sizeAttr.getX(i)).filter((v) => v === 0).length : null;
          return out; })()""")
        print('diag', json.dumps(diag))
        if 'err' in info: await b.close(); return
        for k in (1.0, 0.5, 0.3, 0.15):
            await pg.evaluate('(() => { const w = __bw.world; const f = w.fx || w.ctx.fx; f.lights.forEach((q, i) => { q.base = window.__L0[i] * %s; }); })()' % k)
            await asyncio.sleep(2.5)
            save_png(await pg.evaluate('QA1.shot()'), OUT + 'S01_x%s.png' % k); print('shot', k)
        await b.close()
asyncio.run(main())
