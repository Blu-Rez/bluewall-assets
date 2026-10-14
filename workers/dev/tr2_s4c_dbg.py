#!/usr/bin/env python3
# TR2-S4c dev: hunt a giant stray quad in a view: lists every visible mesh / instance whose world radius is huge or whose box is close to the camera, then hides groups one by one.
#   URLQ="s4c=1" VIEW="c.target.set(0,0,-40); c.dist=95; c.polar=0.95; c.azim=3.5;" python3 tr2_s4c_dbg.py TAG [LV]
import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
TAG = sys.argv[1]; LV = sys.argv[2] if len(sys.argv) > 2 else '30'
OUT = '/home/claude/work/s4c/' + TAG; os.makedirs(OUT, exist_ok=True)
URLQ = os.environ.get('URLQ', 's4c=1'); VIEW = os.environ.get('VIEW', "c.target.set(0,0,-40); c.dist=95; c.polar=0.95; c.azim=3.5;")
SCAN = """() => { const bw = __bw, T = bw.THREE || null; const cam = bw.camera || bw.cam || (bw.ctl && bw.ctl.cam); const out = [];
  const m4 = new bw.THREE.Matrix4(), s = new bw.THREE.Vector3(), p = new bw.THREE.Vector3(), q = new bw.THREE.Quaternion(), w = new bw.THREE.Matrix4();
  const cp = cam.position;
  bw.scene.traverse((o) => { if (!o.isMesh || !o.visible || !o.geometry) return; const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); const r0 = g.boundingSphere.radius;
    const nm = (o.name || '') + '|' + (o.material && o.material.name || '') + (o.isInstancedMesh ? '|I' + o.count : '');
    if (o.isInstancedMesh) { for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); w.multiplyMatrices(o.matrixWorld, m4); w.decompose(p, q, s); const sc = Math.max(s.x, s.y, s.z); const r = r0 * sc; const d = p.distanceTo(cp);
        if (!(r === r) || r > 60 || (d < 40 && r > 12)) out.push([nm, i, +r.toFixed(1), +d.toFixed(1), +p.x.toFixed(1), +p.y.toFixed(1), +p.z.toFixed(1)]); } }
    else { o.matrixWorld.decompose(p, q, s); const r = r0 * Math.max(s.x, s.y, s.z); if (r > 150 && !/terrain|water|sky/i.test(nm)) out.push([nm, -1, +r.toFixed(1), 0]); } });
  return out.slice(0, 60); }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 620}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=' + LV + '&' + URLQ)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; }')
        await pg.evaluate('() => { const c=__bw.ctl; ' + VIEW + ' }')
        await asyncio.sleep(6)
        await pg.screenshot(path=f'{OUT}/view.png', timeout=240000)
        GROUPS = {
          'cards': "o.isInstancedMesh && o.material && o.material.map && o.material.map.isRenderTargetTexture",
          'realtrees': "o.isInstancedMesh && o.material && o.material.name === 'tr2_tree'",
          'rocks': "o.name === 'sc_rocks'",
          'props': "o.name && o.name.startsWith('tr2:')",
          'static': "o.name === 'static'",
          'otherinst': "o.isInstancedMesh && !(o.material && o.material.map && o.material.map.isRenderTargetTexture) && !(o.material && o.material.name === 'tr2_tree') && o.name !== 'sc_rocks' && !(o.name && o.name.startsWith('tr2:'))",
        }
        for gname, pred in GROUPS.items():
            n = await pg.evaluate("() => { let n = 0; __bw.scene.traverse((o) => { if (o.isMesh && (" + pred + ")) { o.userData.__hid = o.visible; o.visible = false; n++; } }); return n; }")
            await asyncio.sleep(2.5)
            await pg.screenshot(path=f'{OUT}/hide_{gname}.png', timeout=240000)
            await pg.evaluate("() => { __bw.scene.traverse((o) => { if (o.isMesh && o.userData.__hid !== undefined) { o.visible = o.userData.__hid; delete o.userData.__hid; } }); }")
            print('hid', gname, n, flush=True)
        try: print('SCAN', json.dumps(await pg.evaluate(SCAN)))
        except Exception as e: print('SCANERR', str(e)[:300])
        print('LOGS', json.dumps(logs[:8]))
        await b.close()
asyncio.run(main())
