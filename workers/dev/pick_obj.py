#!/usr/bin/env python3
# mother: raycast a screen pixel in the real game and print the object chain (name / material / geometry). usage: PX=75 PY=300 VIEW=lake python3 pick_obj.py
import asyncio, os, time, json
from playwright.async_api import async_playwright
VIEWS = {'lake': "c.target.set(-128,0,230); c.dist=150; c.polar=0.95; c.azim=2.2;"}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 620}, device_scale_factor=1)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=30&s4c=1&s=2')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) { c.intro=null; } }')
        await pg.evaluate('() => { const c=__bw.ctl; ' + VIEWS[os.environ.get('VIEW', 'lake')] + ' }')
        await asyncio.sleep(8)
        f0 = await pg.evaluate('__bw.frames')
        for i in range(600):
            if await pg.evaluate('__bw.frames') - f0 >= 8: break
            await asyncio.sleep(1)
        print('cam', await pg.evaluate('[__bw.camera.position.x, __bw.camera.position.y, __bw.camera.position.z].map(Math.round)'), flush=True)
        px, py = float(os.environ['PX']), float(os.environ['PY'])
        r = await pg.evaluate("""([px, py]) => { const bw = __bw, TH = bw.THREE, cam = bw.camera; cam.updateMatrixWorld(); const W = innerWidth, H = innerHeight; const out = []; const v = new TH.Vector3(), m = new TH.Matrix4();
          const proj = (x, y, z) => { v.set(x, y, z).project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, v.z]; };
          bw.scene.traverse((o) => { if (!o.isMesh || !o.visible || o.name === 'terrain' || o.name === 'water' || (o.material && o.material.name === 'SkyShader')) return; o.updateWorldMatrix(true, false);
            const geo = o.geometry; if (!geo.boundingBox) geo.computeBoundingBox(); const bb = geo.boundingBox; const n = o.isInstancedMesh ? o.count : 1; const tri = (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
            for (let i = 0; i < n; i++) { if (o.isInstancedMesh) { o.getMatrixAt(i, m); m.premultiply(o.matrixWorld); } else m.copy(o.matrixWorld);
              const c = bb.getCenter(new TH.Vector3()).applyMatrix4(m); const s = proj(c.x, c.y, c.z); if (s[2] > 1 || s[2] < -1) continue; const dx = s[0] - px, dy = s[1] - py; const d = Math.hypot(dx, dy);
              if (d < 70) { const ch = []; let q = o; while (q && ch.length < 12) { ch.push(q.name || q.type); q = q.parent; } out.push({ d: Math.round(d), wp: [c.x, c.y, c.z].map((a) => Math.round(a)), name: o.name, mat: o.material && o.material.name, inst: o.isInstancedMesh ? i + '/' + o.count : 0, ch, tri, bbs: bb.getSize(new TH.Vector3()).toArray().map((a) => +a.toFixed(1)) }); } } });
          out.sort((a, b) => a.d - b.d); return out.slice(0, 14); }""", [px, py])
        [print(json.dumps(h)) for h in r]
        await b.close()
asyncio.run(main())
