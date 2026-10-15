#!/usr/bin/env python3
# tr2h_budget.py OUT.json — TR2_H budget: draw calls / triangles / programs of the SAME strategic cameras with the TR2_H work off (base = ?tr2h=0&br=old&edge=0) and on (full).  Two game sessions, 4 views each.
# env: Q (low), LV (30), HOUR (14), VARIANTS ('base=&tr2h=0&br=old&edge=0,full=' : name=query-extension pairs separated by ;)
import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
OUT = sys.argv[1]; Q = os.environ.get('Q', 'low'); LV = os.environ.get('LV', '30'); HOUR = os.environ.get('HOUR', '14')
VARS = [v.split('=', 1) for v in os.environ.get('VARIANTS', 'base=&tr2h=0&br=old&edge=0;full=').split(';')]
VIEWS = {                                                     # name: orbit controller settings (strategic camera)
  'castle': 'c.target.set(0,0,0); c.dist=c.maxD*0.7; c.polar=0.95; c.azim=0.5;',
  'town':   'c.target.set(60,0,150); c.dist=140; c.polar=0.9; c.azim=0.6;',
  'bridge': 'c.target.set(-108,0,73); c.dist=45; c.polar=1.0; c.azim=2.0;',
  'rim':    'c.target.set(0,0,405); c.dist=110; c.polar=1.15; c.azim=3.14;',
}
MEAS = """async () => { const bw = __bw, r = bw.renderer; r.info.autoReset = false; r.info.reset(); await new Promise((res) => { const t0 = bw.frames; const iv = setInterval(() => { if (bw.frames - t0 >= 3) { clearInterval(iv); res(); } }, 200); });
  const o = { calls: Math.round(r.info.render.calls / 3), tris: Math.round(r.info.render.triangles / 3), programs: r.info.programs.length, frames: 3 }; r.info.autoReset = true;
  const THREE = bw.THREE, cam = bw.camera; cam.updateMatrixWorld(true); const fr = new THREE.Frustum(), m = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); fr.setFromProjectionMatrix(m);
  const grp = {}; const add = (k, tr) => { const g = grp[k] || (grp[k] = { calls: 0, tris: 0 }); g.calls++; g.tris += tr; };
  bw.scene.traverse((q) => { if (!q.isMesh || !q.geometry) return; let p = q, vis = true; while (p) { if (p.visible === false) { vis = false; break; } p = p.parent; } if (!vis) return;
    const g = q.geometry; if (q.frustumCulled !== false) { if (!g.boundingSphere) g.computeBoundingSphere(); const s = g.boundingSphere.clone(); s.applyMatrix4(q.matrixWorld); if (!fr.intersectsSphere(s)) return; }
    add((q.name || '?').replace(/[0-9]+$/, '').slice(0, 24), (g.index ? g.index.count : g.attributes.position.count) / 3 * (q.isInstancedMesh ? q.count : 1)); });
  o.walk = grp; o.cam = cam.position.toArray().map((v) => Math.round(v)); return o; }"""
async def main():
    res = {}
    async with async_playwright() as p:
        for name, qx in VARS:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
            pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1)
            logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
            t0 = time.time(); T = lambda: round(time.time() - t0)
            await pg.goto(f'http://127.0.0.1:8777/rp1_dev.html?q={Q}&w=clear&h={HOUR}&wa=0.1&lv={LV}{qx}')
            for i in range(3000):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(600):
                if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
                await asyncio.sleep(1)
            await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); if (B.ctl.intro) B.ctl.intro = null; delete B.ctl.update; }')
            await pg.evaluate("() => { window.__tr2TownLod = 'lo'; }")                  # the town cells in one fixed state (lo bodies): the number does not depend on which cell the LOD happened to bake
            await asyncio.sleep(3); print(name, 'ready', T(), flush=True); res[name] = {'query': qx}
            for vn, js in VIEWS.items():
                await pg.evaluate('() => { const c = __bw.ctl; ' + js + ' }'); await asyncio.sleep(3)
                for _ in range(40):
                    if await pg.evaluate('() => { const T = window.__tr2Town; return !T || (T.state.lazy.length === 0); }'): break
                    await asyncio.sleep(1)
                await asyncio.sleep(4); await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
                res[name][vn] = await pg.evaluate(MEAS); print(name, vn, {k: res[name][vn][k] for k in ('calls', 'tris', 'programs')}, T(), flush=True)
            res[name]['logs'] = logs[:6]; await b.close()
    json.dump(res, open(OUT, 'w'), indent=1)
    for vn in VIEWS:
        if len(VARS) >= 2: a, c = res[VARS[0][0]][vn], res[VARS[-1][0]][vn]; print('DELTA', vn, 'calls', c['calls'] - a['calls'], 'tris', c['tris'] - a['tris'], 'programs', c['programs'] - a['programs'])
asyncio.run(main())
