#!/usr/bin/env python3
# tr2h_count.py OUT.json — TR2_H budget, whole scene (no camera, no frustum): the number of meshes (= draw calls if all were on screen), instances, triangles per mesh name, base (?tr2h=0&br=old&edge=0) vs full.  Shows that bridges / edge strip add 0 meshes.
import asyncio, sys, os, json
from playwright.async_api import async_playwright
OUT = sys.argv[1]; VARS = [('base', '&tr2h=0&br=old&edge=0'), ('full', '')]
JS = """() => { const g = {}; let progs = __bw.renderer.info.programs.length; __bw.scene.traverse((q) => { if (!q.isMesh || !q.geometry) return; const k = (q.name || '?').replace(/[0-9]+$/, '').slice(0, 26), o = g[k] || (g[k] = { meshes: 0, inst: 0, tris: 0 });
  const geo = q.geometry, n = (geo.index ? geo.index.count : geo.attributes.position.count) / 3; o.meshes++; o.inst += q.isInstancedMesh ? q.count : 1; o.tris += n * (q.isInstancedMesh ? q.count : 1); }); return { groups: g, programs: progs }; }"""
async def main():
    res = {}
    async with async_playwright() as p:
        for name, qx in VARS:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
            pg = await b.new_page(viewport={'width': 640, 'height': 300}, device_scale_factor=1)
            await pg.goto(f'http://127.0.0.1:8777/rp1_dev.html?q=low&w=clear&h=14&wa=0.1&lv=30{qx}')
            for i in range(3000):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(600):
                if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
                await asyncio.sleep(1)
            await asyncio.sleep(25); res[name] = await pg.evaluate(JS); print(name, 'programs', res[name]['programs'], flush=True); await b.close()
    json.dump(res, open(OUT, 'w'), indent=1)
    a, c = res['base']['groups'], res['full']['groups']; tm = lambda r: sum(v['meshes'] for v in r.values()); print('TOTAL meshes', tm(a), '->', tm(c), ' tris', sum(v['tris'] for v in a.values()), '->', sum(v['tris'] for v in c.values()), ' programs', res['base']['programs'], '->', res['full']['programs'])
    for k in sorted(set(a) | set(c)):
        x = a.get(k, {'meshes': 0, 'inst': 0, 'tris': 0}); y = c.get(k, {'meshes': 0, 'inst': 0, 'tris': 0})
        if x['meshes'] != y['meshes'] or x['inst'] != y['inst'] or abs(x['tris'] - y['tris']) > 1: print('  %-26s meshes %4d -> %4d  inst %6d -> %6d  tris %9d -> %9d' % (k, x['meshes'], y['meshes'], x['inst'], y['inst'], x['tris'], y['tris']))
asyncio.run(main())
