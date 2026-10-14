import asyncio, sys, os, json, math
from playwright.async_api import async_playwright
# TR2-S3-R2 jobs 3 + 4: (a) the sites anchors('stairs') gives on the real castle (outer + town ring, terrain heights, slope check) + debug frames of a few sites (a ramp line + footprint on the ground),
#                        (b) the keep in the inner ring (frames: the keep from the outer yard, over the castle, next to the 16 m inner wall).
#   PAGE=dev_s35.html LV=30 python3 dev/tr2_s3_stairs_dump.py OUTDIR
LV = os.environ.get('LV', '30'); W = int(os.environ.get('W', 1000)); H = int(os.environ.get('H', 600))
# KEEP=0: no keep frames · SITE_RING=outer|town: pick the site frames from that ring only · SITE_N: how many site frames (4) · SITE_BACK / SITE_UP: camera 30 m inside the wall and 24 m up by default (the outer ring needs 12 / 38: the inner ring wall is in the way otherwise)
KEEP = os.environ.get('KEEP', '1') != '0'; SITE_RING = os.environ.get('SITE_RING'); SITE_N = int(os.environ.get('SITE_N', 4)); SITE_BACK = float(os.environ.get('SITE_BACK', 30)); SITE_UP = float(os.environ.get('SITE_UP', 24))
JS_SITES = """() => { const bw = __bw, T3 = bw.world.tr2c, fh = bw.world.fastHeight; if (!T3) return null;
  const res = { towers: {}, gates: [], runs: {}, keep: T3.keepGeom(), keepRec: T3.keepRec ? { x: T3.keepRec.x, z: T3.keepRec.z, rot: T3.keepRec.rot } : null };
  const A = T3.anchors();
  for (const t of A.towers) res.towers[t.ring] = (res.towers[t.ring] || 0) + 1;
  res.gates = A.gates.map((g) => ({ ring: g.ring, x: +g.x.toFixed(1), z: +g.z.toFixed(1), L: g.L, h: +(g.h || 0).toFixed(1), d: +(g.d || 0).toFixed(1) }));
  for (const w of A.walls) { const r = res.runs[w.ring] || (res.runs[w.ring] = { n: 0, len: [], H: w.y }); r.n++; r.len.push(+w.len.toFixed(1)); }
  const site = (s, spacing) => { const g0 = fh(s.foot.x, s.foot.z), gj = fh(s.join.x, s.join.z), gt = fh(s.top.x, s.top.z); const rise = gj + s.rise - g0, steps = Math.round(9.0 / 0.22); return { id: s.id, ring: s.ring, at: s.at, joint: s.joint, centre: s.centre, foot: s.foot, top: s.top, join: s.join, ry: s.ry, rise: s.rise, groundFoot: +g0.toFixed(2), groundJoin: +gj.toFixed(2), groundTop: +gt.toFixed(2), riseReal: +rise.toFixed(2), riser: +(rise / steps).toFixed(3), scaleY: +(rise / 9.0).toFixed(3) }; };
  res.all = {}; res.sp60 = {}; res.sp80 = {};
  for (const ring of ['outer', 'town']) {
    res.all[ring] = T3.anchors('stairs', { rings: [ring] }).map((s) => site(s));
    res.sp60[ring] = T3.anchors('stairs', { rings: [ring], spacing: 60 }).map((s) => site(s));
    res.sp80[ring] = T3.anchors('stairs', { rings: [ring], spacing: 80 }).map((s) => site(s));
  }
  res.inner = T3.anchors('stairs', { rings: ['inner'] }).length;
  // does a flight's footprint (rect) touch a registered battle target that is not a wall / gate piece (house clusters, vaults, ...)?  Their boxes are coarse (a house cluster box is the cluster + 9 m), so this over-reports
  const tg = (bw.world.targets || []).filter((t) => t.type !== 'wall' && t.type !== 'gate' && t.w > 0 && t.d > 0);
  res.targetTypes = {}; for (const t of tg) res.targetTypes[t.type] = (res.targetTypes[t.type] || 0) + 1;
  const sat = (r, t) => { const A = [[Math.sin(r.ry), Math.cos(r.ry)], [Math.cos(r.ry), -Math.sin(r.ry)]], c = Math.cos(t.rot || 0), s2 = Math.sin(t.rot || 0), B = [[c, -s2], [s2, c]];
    for (const a of [...A, ...B]) { const d = Math.abs((t.x - r.cx) * a[0] + (t.z - r.cz) * a[1]), pr = (R, w, h) => (w / 2) * Math.abs(a[0] * R[0][0] + a[1] * R[0][1]) + (h / 2) * Math.abs(a[0] * R[1][0] + a[1] * R[1][1]); if (d >= pr(A, r.d, r.w) + pr(B, t.w, t.d)) return false; } return true; };
  const rects = {}; for (const ring of ['outer', 'town']) rects[ring] = T3.anchors('stairs', { rings: [ring] });
  res.free = {}; for (const ring of ['outer', 'town']) res.free[ring] = rects[ring].map((st) => ({ id: st.id, at: st.at, hit: tg.filter((t) => sat(st.rect, t)).map((t) => t.type + '#' + t.id).slice(0, 4) }));
  return res; }"""
async def body(pg, OUT, logs=()):
    os.makedirs(OUT, exist_ok=True)
    res = await pg.evaluate(JS_SITES)
    if not res: raise SystemExit('no tr2c')
    json.dump(res, open(f'{OUT}/anchors.json', 'w'), indent=1)
    print('towers', res['towers'], 'gates', res['gates'], 'inner sites', res['inner'], flush=True)
    for k in ('all', 'sp60', 'sp80'):
        print(k, {r: len(v) for r, v in res[k].items()}, flush=True)
    # ---- debug overlay: ramp line (foot at the ground -> top at the wall-walk), footprint outline, join pole -------------------------------------------
    await pg.evaluate('() => { __bw.ctl.update = () => {}; window.__dbg = new __bw.THREE.Group(); window.__dbg.visible = false; __bw.scene.add(window.__dbg); }')
    await pg.evaluate("""(sites) => { const T = __bw.THREE, g = window.__dbg, fh = __bw.world.fastHeight; const mat = new T.LineBasicMaterial({ color: 0xff2bd6, depthTest: false });
      const L = (pts) => { const geo = new T.BufferGeometry().setFromPoints(pts.map((p) => new T.Vector3(p[0], p[1], p[2]))); const l = new T.Line(geo, mat); l.renderOrder = 999; l.frustumCulled = false; g.add(l); };
      for (const s of sites) { const gf = fh(s.foot.x, s.foot.z), yTop = fh(s.join.x, s.join.z) + s.rise, dx = Math.sin(s.ry), dz = Math.cos(s.ry), nx = -dz, nz = dx, hw = 1.0;
        const c = (a, l) => [s.top.x + dx * a + nx * l, 0, s.top.z + dz * a + nz * l];
        const run = Math.hypot(s.foot.x - s.top.x, s.foot.z - s.top.z), q = [c(-1, -hw), c(run, -hw), c(run, hw), c(-1, hw), c(-1, -hw)].map((p) => [p[0], fh(p[0], p[2]) + 0.2, p[2]]);
        L(q); L([[s.foot.x, gf + 0.3, s.foot.z], [s.top.x, yTop, s.top.z]]); L([[s.top.x, yTop, s.top.z], [s.join.x, yTop, s.join.z]]); L([[s.join.x, yTop, s.join.z], [s.join.x, fh(s.join.x, s.join.z), s.join.z]]); } }""",
                      [s for r in ('outer', 'town') for s in res['sp60'][r]][:12])
    def cam(a): return a
    async def view(name, a, fov=45):
        await pg.evaluate('(a) => { const c = __bw.camera; c.fov = a[6]; c.updateProjectionMatrix(); c.position.set(a[0], a[1], a[2]); c.lookAt(a[3], a[4], a[5]); c.updateMatrixWorld(true); }', list(a) + [fov] if len(a) == 6 else list(a))
        f0 = await pg.evaluate('__bw.frames')
        for i in range(240):
            if await pg.evaluate(f'__bw.frames >= {f0} + 6'): break
            await asyncio.sleep(0.4)
        await pg.screenshot(path=f'{OUT}/{name}.png', timeout=240000); print('shot', name, flush=True)
    # keep views (keep centre from the kit: castle.js K; the frames of round 1 used 'keep' = (10,26,20)->(-21,10,-20))
    if KEEP:
        await view('keep_a', (10, 26, 20, -21, 10, -20, 40))
        await view('keep_b', (-70, 22, 20, -21, 10, -20, 40))
        await view('keep_over', (60, 75, 115, 0, 6, -5, 40))
    # stair sites: one on the outer ring, a town-ring tower site, a town-ring gate site and one more, seen from the inner side of the ring, 30 m back and 24 m up
    sites = [s for r in ('outer', 'town') for s in res['sp60'][r] if not SITE_RING or r == SITE_RING]
    pick = [s for s in sites if s['ring'] == 'outer'][:1] if not SITE_RING else []
    for kind in ('tower', 'gate'):
        for s in sites:
            if s['at'] == kind and (SITE_RING or s['ring'] == 'town') and s not in pick: pick.append(s); break
    for s in sites:
        if len(pick) >= SITE_N: break
        if s not in pick: pick.append(s)
    await pg.evaluate('window.__dbg.visible = true')                      # the ramp lines only in the stair-site frames, not in the keep frames
    for k, s in enumerate(pick[:SITE_N]):
        mx, mz = (s['top']['x'] + s['foot']['x']) / 2, (s['top']['z'] + s['foot']['z']) / 2
        ix, iz = s['top']['x'] - s['join']['x'], s['top']['z'] - s['join']['z']; n = math.hypot(ix, iz) or 1; ix, iz = ix / n, iz / n     # unit vector: wall line -> inner side
        cx, cz = mx + ix * SITE_BACK, mz + iz * SITE_BACK
        await view(f'site_{k}_{s["ring"]}_{s["at"]}', (cx, SITE_UP, cz, mx, 4, mz, 50))
    print('LOGS', json.dumps(logs[:10]))

async def main():
    OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if (m.type in ('error', 'warning') and '404' not in m.text) else None)
        await pg.goto('http://127.0.0.1:8777/' + os.environ.get('PAGE', 'dev_s35.html') + '?q=' + os.environ.get('Q', 'low') + '&w=clear&h=13&wa=0.1&lv=' + LV)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); if (B.ctl.intro) B.ctl.intro = null; }')
        await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; }")
        await asyncio.sleep(3)
        await body(pg, OUT, logs)
        await b.close()

if __name__ == '__main__':
    asyncio.run(main())
