#!/usr/bin/env python3
# ST1_R3 probe (read-only): what is the flat lilac slab the S15 hero stands on?  Raycasts DOWN over a grid round (-12, 132) on the live scene (dev build, software GL) and prints, per hit, the mesh, its material, the vertex colour
# at the hit triangle, the height, and the terrain height.  Also: the oil emblem (QA1-125 black cap?) - the highest hit over the oil yard.     python3 st1r3_probe.py > /tmp/st1r3_probe.txt
import asyncio, json, sys, time
from playwright.async_api import async_playwright
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage']
JS = r'''
(() => { const bw = window.__bw, T = bw.THREE, sc = bw.scene; const meshes = []; sc.traverse((o) => { if (o.isMesh && o.visible) meshes.push(o); });
  const rc = new T.Raycaster(); const out = [];
  const colAt = (h) => { const g = h.object.geometry, c = g.attributes.color; if (!c || !h.face) return null; const a = h.face.a; return [c.getX(a), c.getY(a), c.getZ(a)].map((v) => +v.toFixed(3)); };
  const down = (x, z) => { rc.set(new T.Vector3(x, 80, z), new T.Vector3(0, -1, 0)); const hs = rc.intersectObjects(meshes, false); return hs.slice(0, 3).map((h) => ({ y: +h.point.y.toFixed(2), mesh: h.object.name || h.object.type, mat: (h.object.material && (h.object.material.name || h.object.material.type)) || '?', col: colAt(h), tris: h.object.geometry.index ? h.object.geometry.index.count / 3 : h.object.geometry.attributes.position.count / 3 })); };
  for (const z of [112, 118, 124, 128, 132, 136]) for (const x of [-30, -22, -16, -12, -8, -2, 6]) out.push({ x, z, hits: down(x, z) });
  // the oil yard (-84, 90, ry 0): the court + both heaps (QA1-030 / the grey-olive pots left of the door at S10)
  for (const z of [92, 95, 98, 101, 104, 107]) for (const x of [-96, -92, -89, -86, -84, -82, -79, -76, -72]) out.push({ x, z, hits: down(x, z), oil: 1 });
  return out; })()
'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1, has_touch=True, is_mobile=True)
        await pg.goto('http://127.0.0.1:8777/rp1_dev_r3.html?q=low&w=clear&h=12.5&wa=0.1', timeout=900000)
        for i in range(4000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
        await asyncio.sleep(3)
        r = await pg.evaluate(JS)
        for e in r: print('OIL' if e.get('oil') else 'S15', e['x'], e['z'], json.dumps(e['hits']))
        await b.close()
asyncio.run(main())
