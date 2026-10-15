#!/usr/bin/env python3
# ST1_R2 — frames + numbers for the gem glow job, on the real game (dev_s35.html, home map, 844x390, software GL: NOT a phone).
#   HOUR=22 URLQ="st1g=2" VIEWS=map,quarter,mines CLOSE=1 python3 st1r2_shots.py TAG [LV]
#   per shot: draw calls / tris / programs (3 frames averaged) + the gem-halo overdraw estimate (see OVER) + a full-size PNG;  results.json next to the PNGs.
#   OVER = for every additive sprite that hangs high over a vault or a mine (the gem halos): its screen quad in pixels (clipped to the viewport), summed = fragments shaded per frame
#          ("pixels x layers"), the largest number of halos stacked on one pixel (1/4-resolution coverage grid), and the alpha-weighted sum (quad px x sprite opacity). An ESTIMATE from the projection, not a GPU counter.
import asyncio, sys, os, json, time, math
from playwright.async_api import async_playwright
TAG = sys.argv[1]; LV = sys.argv[2] if len(sys.argv) > 2 else '30'
OUT = '/home/claude/work/st1r2/' + TAG; os.makedirs(OUT, exist_ok=True)
W = int(os.environ.get('W', 844)); H = int(os.environ.get('H', 390)); URLQ = os.environ.get('URLQ', ''); Q = os.environ.get('Q', 'low'); SETTLE = float(os.environ.get('SETTLE', 8))
HOUR = os.environ.get('HOUR', '22'); GEMDY = float(os.environ.get('GEMDY', '-1.8'))     # gem centre = list[i].gem if the build has it, else top.y + GEMDY (the old vault.js: top = hero + 1.8)
MINEDY = float(os.environ.get('MINEDY', '-11'))                                       # giant gem of the old mines.js hangs at mine.y + 25; list.top = mine.y + 36
CTLV = {
  'map':     "c.target.set(0,0,0); c.dist=c.maxD*1.0; c.polar=0.25; c.azim=0.6;",
  'quarter': "c.target.set(-10,0,95); c.dist=150; c.polar=0.9; c.azim=0.6;",
  'quarter_near': "c.target.set(-10,0,95); c.dist=90; c.polar=1.0; c.azim=0.35;",
}
want = [v for v in os.environ.get('VIEWS', 'map,quarter').split(',') if v]
FREE = """(j) => { const bw = __bw, c = bw.camera; c.fov = j.fov || 50; c.updateProjectionMatrix(); c.position.set(j.cam[0], j.cam[1], j.cam[2]); c.lookAt(j.look[0], j.look[1], j.look[2]); c.updateMatrixWorld(true); }"""
LISTS = """(a) => { const w = __bw.world; const f = (arr) => (arr || []).map((s) => ({ id: s.id, x: s.x, y: s.y, z: s.z, ry: s.ry, top: s.top ? [s.top.x, s.top.y, s.top.z] : null, gem: s.gem ? [s.gem.x, s.gem.y, s.gem.z] : null }));
  return { vaults: f(w.vaults && w.vaults.list), mines: f((w.ctx && w.ctx.mines && w.ctx.mines.list) || (w.mines && w.mines.list)) }; }"""
MEAS = """async () => { const bw = __bw, r = bw.renderer; r.info.autoReset = false; r.info.reset(); const f0 = bw.frames; await new Promise((res) => { const t0 = bw.frames; const iv = setInterval(() => { if (bw.frames - t0 >= 3) { clearInterval(iv); res(); } }, 100); }); const n = bw.frames - f0;
  const o = { calls: Math.round(r.info.render.calls / n), tris: Math.round(r.info.render.triangles / n), prog: r.info.programs ? r.info.programs.length : -1, n }; r.info.autoReset = true; return o; }"""
OVER = """(a) => { const bw = __bw, cam = bw.camera, sc = bw.scene || (bw.world && bw.world.scene); if (!sc) return { err: 'no scene' };
  const Wp = innerWidth, Hp = innerHeight, gw = Math.ceil(Wp / 4), gh = Math.ceil(Hp / 4), grid = new Uint8Array(gw * gh);
  const near = (p) => a.vaults.some((v) => Math.hypot(p.x - v[0], p.z - v[2]) < 4 && p.y > v[3] + 6) || a.mines.some((m) => Math.hypot(p.x - m[0], p.z - m[2]) < 16 && p.y > m[3] + 8);
  cam.updateMatrixWorld(true); const inv = cam.matrixWorldInverse, tanH = Math.tan(cam.fov * Math.PI / 360), ppu = (zd) => Hp / (2 * zd * tanH);
  let n = 0, quad = 0, alphaPx = 0; const list = [];
  sc.traverse((o) => { if (!o.isSprite || !o.visible || !o.material || o.material.blending !== 2) return; let v = o.parent; let vis = true; while (v) { if (!v.visible) { vis = false; break; } v = v.parent; } if (!vis) return;
    const p = o.getWorldPosition(new o.position.constructor()); if (!near(p)) return;
    const q = p.clone().applyMatrix4(inv), zd = -q.z; if (zd <= 0.1) return; const d = Math.abs(o.scale.x) * ppu(zd);
    const cx = (q.x / (zd * tanH * (Wp / Hp)) * 0.5 + 0.5) * Wp, cy = (0.5 - q.y / (zd * tanH) * 0.5) * Hp, x0 = cx - d / 2, x1 = cx + d / 2, y0 = cy - d / 2, y1 = cy + d / 2;
    const cw = Math.max(0, Math.min(Wp, x1) - Math.max(0, x0)), ch = Math.max(0, Math.min(Hp, y1) - Math.max(0, y0)), area = cw * ch; if (area <= 0) return;
    n++; quad += area; alphaPx += area * o.material.opacity; list.push({ s: +o.scale.x.toFixed(1), px: Math.round(d), op: +o.material.opacity.toFixed(2), area: Math.round(area) });
    for (let gy = Math.floor(Math.max(0, y0) / 4); gy < Math.min(gh, Math.ceil(Math.min(Hp, y1) / 4)); gy++) for (let gx = Math.floor(Math.max(0, x0) / 4); gx < Math.min(gw, Math.ceil(Math.min(Wp, x1) / 4)); gx++) grid[gy * gw + gx]++; });
  let mx = 0; for (let i = 0; i < grid.length; i++) if (grid[i] > mx) mx = grid[i];
  return { sprites: n, quadPx: Math.round(quad), alphaPx: Math.round(alphaPx), maxLayers: mx, pctScreen: +(100 * quad / (Wp * Hp)).toFixed(1), list }; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error', 'warning') and '404' not in m.text and 'GPU stall' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:' + os.environ.get('PORT', '8777') + '/' + os.environ.get('PAGE', 'dev_s35.html') + '?q=' + Q + '&w=clear&h=' + HOUR + '&wa=0.1&lv=' + LV + ('&' + URLQ if URLQ else ''))
        for i in range(4000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('home ready', T(), flush=True); await asyncio.sleep(3)
        await pg.evaluate("() => { const c = __bw.ctl; if (c.intro) c.intro = null; const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; }")
        lists = await pg.evaluate(LISTS, None) if False else await pg.evaluate("() => (" + LISTS + ")()"); res = {'lv': LV, 'hour': HOUR, 'urlq': URLQ, 'lists': lists, 'views': {}}
        def gem(v): return v['gem'] if v.get('gem') else [v['top'][0], v['top'][1] + GEMDY, v['top'][2]]
        def mgem(m): return m['gem'] if m.get('gem') else [m['top'][0], m['y'] + 25 + (MINEDY + 11), m['top'][2]]
        ov = {'vaults': [[*gem(v)[:3], v['y']] for v in lists['vaults']], 'mines': [[*mgem(m)[:3], m['y']] for m in lists['mines']]}
        async def measure(nm):
            a = await pg.evaluate(MEAS); o = await pg.evaluate("(a) => (" + OVER + ")(a)", ov); a['over'] = o; res['views'][nm] = a
            print('perf', nm, {k: a[k] for k in ('calls', 'tris', 'prog')}, 'over', {k: o.get(k) for k in ('sprites', 'quadPx', 'alphaPx', 'maxLayers', 'pctScreen')}, flush=True)
            await pg.screenshot(path=f'{OUT}/{nm}.png', timeout=240000)
        for nm in want:
            if nm in CTLV:
                await pg.evaluate('() => { const c = __bw.ctl; ' + CTLV[nm] + ' }'); await asyncio.sleep(SETTLE); await measure(nm)
        if os.environ.get('CLOSE', '0') == '1':
            await pg.evaluate('() => { __bw.ctl.update = () => {}; }')
            jobs = []
            for v in lists['vaults']:
                g = gem(v); c, s = math.cos(v['ry']), math.sin(v['ry']); P = lambda lx, lz: (v['x'] + lx * c + lz * s, v['z'] - lx * s + lz * c)
                cx, cz = P(11, 34); jobs.append({'name': 'vault_' + v['id'], 'cam': [cx, g[1] - 3, cz], 'look': [v['x'], g[1] - 3.5, v['z']], 'fov': 50})
            for m in lists['mines']:
                g = mgem(m); dx, dz = -g[0], -g[2]; dl = math.hypot(dx, dz) or 1
                jobs.append({'name': 'mine_' + m['id'], 'cam': [g[0] + dx / dl * 46, g[1] - 4, g[2] + dz / dl * 46], 'look': [g[0], g[1] - 6, g[2]], 'fov': 50})
            only = os.environ.get('ONLY')
            if only: jobs = [j for j in jobs if j['name'] in only.split(',')]
            for j in jobs:
                await pg.evaluate(FREE, j); await asyncio.sleep(SETTLE * 0.8); await measure(j['name'])
        json.dump(res, open(f'{OUT}/results.json', 'w'), indent=1)
        print('LOGS', json.dumps(logs[:12])); await b.close()
asyncio.run(main())
