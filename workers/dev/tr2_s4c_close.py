#!/usr/bin/env python3
# TR2-S4c — close-up frames of the new models inside the real game (full-size PNGs): trees, rocks, bushes, lamps, wall torches, props.
#   URLQ="s4c=1&s=2" TARGETS=tree,rock,bush,post,sconce,barrels,stall python3 tr2_s4c_close.py TAG [LV]
import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
TAG = sys.argv[1]; LV = sys.argv[2] if len(sys.argv) > 2 else '30'
OUT = '/home/claude/work/s4c/' + TAG; os.makedirs(OUT, exist_ok=True)
W = int(os.environ.get('W', 1400)); H = int(os.environ.get('H', 800)); URLQ = os.environ.get('URLQ', 's4c=1'); Q = os.environ.get('Q', 'low')
FIND = """(spec) => { const [kind, arg] = spec.split(':'); const bw = __bw; let best = null;
  const inst = (pred, pick) => { let r = null; bw.scene.traverse((o) => { if (!o.isInstancedMesh || !o.count || !pred(o)) return; const m = new bw.THREE.Matrix4(), p = new bw.THREE.Vector3(), q = new bw.THREE.Quaternion(), s = new bw.THREE.Vector3();
      for (let i = 0; i < Math.min(o.count, 400); i++) { o.getMatrixAt(i, m); m.decompose(p, q, s); const d = Math.hypot(p.x, p.z); const sc = pick(p, s, d); if (sc != null && (!r || sc > r.sc)) r = { sc, x: p.x, y: p.y, z: p.z, s: s.x }; } }); return r; };
  const near = (r) => r && [r.x, r.y, r.z];
  const at = (k) => { const a = (window.__S4C.at || []).find((e) => e[0].startsWith(k)); return a ? [a[1], a[2], a[3]] : null; };
  if (kind === 'tree') return near(inst((o) => o.material && o.material.name === 'tr2_tree', (p, s, d) => -d));
  if (kind === 'rock') return near(inst((o) => o.name === 'sc_rocks', (p, s, d) => (d < 330 && s.x > 1.3 ? s.x - d * 0.001 : null)));
  if (kind === 'bush') return near(inst((o) => o.name === 'sc_bushes', (p, s, d) => (d > 60 && d < 300 ? -d : null)));
  if (kind === 'prop') return near(inst((o) => o.name === 'tr2:' + arg, (p, s, d) => -d));
  if (kind === 'at') return at(arg);
  return null; }"""
SPEC = {  # name: (finder, dist, polar, azim)
  'tree': ('tree', 24, 1.28, 0.6), 'tree2': ('tree', 55, 1.2, 2.4), 'rock': ('rock', 14, 1.25, 0.5), 'bush': ('bush', 10, 1.25, 0.5),
  'post': ('at:post', 11, 1.3, 0.5), 'post2': ('at:post', 11, 1.3, 2.6), 'sconce': ('at:sconce', 8, 1.3, 0.3), 'sconce2': ('at:sconce', 8, 1.3, 3.45),
  'barrels': ('prop:props_town/barrels', 9, 1.25, 0.5), 'crates': ('prop:props_town/crates', 9, 1.25, 0.5),
  'stall': ('prop:market_stalls/stall_produce', 14, 1.15, 0.5), 'cart': ('prop:props_town/wagon', 10, 1.25, 0.5),
}
for kv in filter(None, os.environ.get('XYZ', '').split(';')):
    k, v = kv.split('=', 1); x, y, z, d, p_, a_ = v.split(','); SPEC[k] = ('xyz:' + x + ',' + y + ',' + z, float(d), float(p_), float(a_))
want = os.environ.get('TARGETS', 'tree,rock,bush,post,sconce,barrels,stall').split(',')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=' + Q + '&w=clear&h=14&wa=0.1&lv=' + LV + '&' + URLQ)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('home ready', T(), flush=True)
        await asyncio.sleep(3)
        has = await pg.evaluate('() => !!(__bw.THREE)')
        if not has: await pg.evaluate('() => { window.__bw.THREE = window.__bw.THREE || null; }')
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; c.minD = 3; }')
        at = await pg.evaluate('() => window.__S4C ? (window.__S4C.at || []) : []')
        json.dump(at, open(f'{OUT}/at.json', 'w'))
        for nm in want:
            fd, dist, pol, az = SPEC[nm]
            pos = [float(v) for v in fd[4:].split(',')] if fd.startswith('xyz:') else await pg.evaluate(FIND, fd)
            print(nm, fd, pos, flush=True)
            if not pos: continue
            await pg.evaluate('([x,y,z,d,p,a]) => { const c=__bw.ctl; c.minD = 3; c.maxR = 9999; c.pNear = p; c.pFar = p; c.pFarMax = p; c.target.set(x,y,z); c.dist=d; c.polar=p; c.azim=a; }', [pos[0], pos[1], pos[2], dist, pol, az])
            await asyncio.sleep(float(os.environ.get('SETTLE', 7)))
            await pg.screenshot(path=f'{OUT}/{nm}.png', timeout=240000)
        print('LOGS', json.dumps(logs[:10]))
        await b.close()
asyncio.run(main())
