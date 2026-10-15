#!/usr/bin/env python3
# an1r3_carts.py — AN1_R3 part 3: where do the cart routes still touch a prop (box) or ford the river / a stream deeper than 30 cm?  Which road data would fix each place?
# Boots the debug build with the road handle (dev/app_r3.js = the debug bundle + window.__R3 = { ROADS, L }), forces the walking grids of all cart sites, then walks every cart route (the smoothed line the cart really
# drives, every 0.5 m) and reports, per route: the stretches inside a blocked grid cell (site id + the site-local x/z of the stretch) and the stretches on the river bed under > 30 cm of water that are NOT on a road bridge
# (L.RBRIDGES + 1 m); for each stretch the nearest roads.js road (name, vertex index, offset).  Output: out JSON + a short table on stdout.
import asyncio, json, os, time, subprocess, socket, math
from playwright.async_api import async_playwright
D = '/home/claude/dev/'
OUT = os.environ.get('AN1_OUT', '/home/claude/work/an1r3'); os.makedirs(OUT, exist_ok=True)
PORT = int(os.environ.get('AN1_PORT', 8795))
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
JS = r"""
async () => {
  const B = __bw, W = B.world.ctx.wsLife, R = window.__R3, L = R.L, cam = B.camera, h = B.world.fastHeight, LV = L.MOAT.level;
  cam.position.set(20, 90, 80); cam.lookAt(20, 0, 16); cam.updateMatrixWorld(true);
  let t = B.t || 0;
  const step = (n) => { for (let i = 0; i < n; i++) { t += 1 / 30; B.world.update(t, 1 / 30, cam); } };
  // one route per site; ask for every grid (the cart sites + all their neighbours: gridOf builds a grid for any site)
  const sites = []; const seen = new Set();
  for (const c of W.carts) if (!seen.has(c.S.site.id)) { seen.add(c.S.site.id); sites.push(c); }
  const allSites = new Map(); for (const c of W.carts) allSites.set(c.S.site.id, c.S.site); for (const a of W.agents) allSites.set(a.S.site.id, a.S.site);
  for (const s of allSites.values()) W.gridOf(s);
  for (let i = 0; i < 4000; i++) { step(2); let all = true; for (const g of W.grids.values()) if (g && !g.ready) { all = false; break; } if (all) break; }
  const grids = []; for (const [id, g] of W.grids) if (g && g.ready) grids.push([id, g]);
  const onBridge = (x, z, m) => (L.RBRIDGES || []).some((b) => { const rx = x - b.x, rz = z - b.z; return Math.abs(rx * b.nx + rz * b.nz) <= b.len / 2 + m && Math.abs(-rx * b.nz + rz * b.nx) <= b.wid / 2 + m + 0.5; });
  const nearestRoad = (x, z) => {
    let best = null;
    for (const r of R.ROADS) for (let i = 0; i < r.pts.length - 1; i++) {
      const a = r.pts[i], b = r.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)), d = Math.hypot(x - a[0] - dx * u, z - a[1] - dz * u);
      if (!best || d < best.d) best = { name: r.name, i, u: +u.toFixed(2), d: +d.toFixed(1), w: r.w, surf: r.surf };
    }
    return best;
  };
  const routes = [];
  for (const c of sites) {
    const rt = c.rt, Ln = rt.L, o = { x: 0, z: 0 }, site = c.S.site, boxes = [], fords = [];
    let cb = null, cf = null, n = 0, nb = 0, nf = 0, nbr = 0;
    for (let s = 0; s <= Ln.len; s += 0.5) {
      Ln.at(s, o); n++;
      let blk = null; for (const [id, g] of grids) if (!g.free(o.x, o.z)) { blk = id; break; }
      const dep = LV - h(o.x, o.z), br = onBridge(o.x, o.z, 1), deep = dep > 0.3 && !br;
      if (dep > 0.3 && br) nbr++;
      if (blk) { nb++; if (cb && cb.site === blk && s - cb.s1 < 1.1) { cb.s1 = s; cb.x1 = o.x; cb.z1 = o.z; } else { cb = { site: blk, s0: s, s1: s, x0: o.x, z0: o.z, x1: o.x, z1: o.z }; boxes.push(cb); } }
      if (deep) { nf++; if (cf && s - cf.s1 < 1.1) { cf.s1 = s; cf.x1 = o.x; cf.z1 = o.z; cf.dep = Math.max(cf.dep, dep); } else { cf = { s0: s, s1: s, x0: o.x, z0: o.z, x1: o.x, z1: o.z, dep }; fords.push(cf); } }
    }
    const loc = (sx, x, z) => { const st = allSites.get(sx); if (!st) return null; const dx = x - st.x, dz = z - st.z; return [+(dx * Math.cos(st.ry) - dz * Math.sin(st.ry)).toFixed(1), +(dx * Math.sin(st.ry) + dz * Math.cos(st.ry)).toFixed(1)]; };
    for (const b of boxes) { b.mid = [(b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2]; b.local = loc(b.site, b.mid[0], b.mid[1]); b.road = nearestRoad(b.mid[0], b.mid[1]); b.len = +(b.s1 - b.s0 + 0.5).toFixed(1); }
    for (const f of fords) { f.mid = [(f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2]; f.road = nearestRoad(f.mid[0], f.mid[1]); f.len = +(f.s1 - f.s0 + 0.5).toFixed(1); f.dep = +f.dep.toFixed(2); f.nearBridge = (L.RBRIDGES || []).map((b) => [Math.hypot(b.x - f.mid[0], b.z - f.mid[1]), b]).sort((a, b) => a[0] - b[0]).slice(0, 1).map(([d, b]) => ({ d: +d.toFixed(1), x: +b.x.toFixed(1), z: +b.z.toFixed(1), len: b.len, wid: b.wid }))[0]; }
    routes.push({ site: site.id, kind: site.kind, dest: rt.dest, len: +Ln.len.toFixed(1), n, blockedSamples: nb, fordSamples: nf, bridgeSamples: nbr, carts: W.carts.filter((q) => q.rt === rt).length, pts: rt.pts.map((p) => [+p[0].toFixed(1), +p[1].toFixed(1)]), boxes, fords });
  }
  return { routes, grids: grids.length, rbridges: (L.RBRIDGES || []).length, level: LV };
}
"""
async def main():
    srv = None
    if not up(): srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
            await ctx.add_init_script("(()=>{ const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ return; }; } })();")
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            await pg.goto('http://127.0.0.1:%d/pf1_dev_r3.html?q=high&w=clear&h=14&wa=0.1' % PORT)
            for i in range(3600):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready && !!(window.__bw && __bw.lateReady)'): break
            log('booted'); await pg.evaluate('__bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await pg.evaluate('__bw.pause(true)'); await asyncio.sleep(1)
            res = await pg.evaluate(JS)
            res['errors'] = errs
            json.dump(res, open(OUT + '/%s.json' % os.environ.get('AN1_TAG', 'carts'), 'w'), indent=1)
            await b.close()
    finally:
        if srv: srv.terminate()
    tot = sum(r['n'] for r in res['routes']); nb = sum(r['blockedSamples'] for r in res['routes']); nf = sum(r['fordSamples'] for r in res['routes'])
    log('routes', len(res['routes']), 'grids', res['grids'], 'samples', tot, 'blocked', nb, '=%.2f%%' % (100 * nb / max(1, tot)), 'ford', nf, '=%.2f%%' % (100 * nf / max(1, tot)))
    for r in res['routes']:
        if r['boxes'] or r['fords']:
            log(r['site'], r['kind'], '->', r['dest'], 'len', r['len'], 'box', [(b['site'], b['len'], b['local'], b['road'] and (b['road']['name'], b['road']['i'], b['road']['d'])) for b in r['boxes']], 'ford', [(f['len'], f['dep'], [round(f['mid'][0]), round(f['mid'][1])], f['road'] and (f['road']['name'], f['road']['i'], f['road']['d']), f['nearBridge'] and f['nearBridge']['d']) for f in r['fords']])
asyncio.run(main())
