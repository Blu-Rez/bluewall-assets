import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# a2_census.py LABEL : counts the visible renderable objects of the home camera by name path -> /tmp/a2_census_LABEL.json  (diff two builds to see what the change added)
LABEL = sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 620}, device_scale_factor=1)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const c=__bw.ctl; c.intro=null; c.target.set(49.5,0,51.5); c.dist=257.6; c.azim=1.191; }')
        await asyncio.sleep(10)
        res = await pg.evaluate("""() => { const bw = __bw, cam = bw.camera; cam.updateMatrixWorld(); const THREE_ = bw.THREE; const out = {};
          const vis = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
          bw.scene.traverse((o) => { if (!(o.isMesh || o.isPoints || o.isLine) || !vis(o)) return; let path = ''; for (let p = o; p && p !== bw.scene; p = p.parent) path = (p.name || p.type) + '/' + path; const k = path.replace(/[0-9]+/g, '#'); out[k] = (out[k] || 0) + 1; });
          const det = []; for (const o of bw.scene.children) { if (o.name || !o.isMesh || !o.visible) continue; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox; det.push({ inst: !!o.isInstancedMesh, n: o.isInstancedMesh ? o.count : 0, v: g.attributes.position.count, mat: o.material.type + (o.material.map ? '+map' : ''), cx: Math.round(o.position.x + (bb.min.x + bb.max.x) / 2), cz: Math.round(o.position.z + (bb.min.z + bb.max.z) / 2), sx: Math.round(bb.max.x - bb.min.x), sz: Math.round(bb.max.z - bb.min.z), cast: o.castShadow, fc: o.frustumCulled, ip: (() => { if (!o.isInstancedMesh || !o.count) return null; const a = o.instanceMatrix.array, m = Math.min(o.count, 60); let x = 0, z = 0; for (let i = 0; i < m; i++) { x += a[i * 16 + 12]; z += a[i * 16 + 14]; } return [Math.round(x / m), Math.round(z / m)]; })() }); }
          const ch = bw.scene.children, ord = []; let last = '';
          ch.forEach((o, i) => { if (o.name) { last = o.name; return; } if (o.isMesh && o.isInstancedMesh && o.visible) { const a = o.instanceMatrix.array, m = Math.min(o.count, 60); let x = 0, z = 0; for (let j = 0; j < m; j++) { x += a[j * 16 + 12]; z += a[j * 16 + 14]; } ord.push([i, last, o.count, o.geometry.attributes.position.count, Math.round(x / Math.max(m, 1)), Math.round(z / Math.max(m, 1)), o.material.color ? o.material.color.getHexString() : '', !!o.material.vertexColors, o.material.map ? (o.material.map.image && o.material.map.image.width) : 0]); } });
          return { out, det, ord, calls: bw.renderer.info.render.calls }; }""")
        json.dump(res, open('/tmp/a2_census_%s.json' % LABEL, 'w'), indent=0)
        print('objects', sum(res['out'].values()), 'last frame calls', res['calls'])
        await b.close()
asyncio.run(main())
