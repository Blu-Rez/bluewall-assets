#!/usr/bin/env python3
# tr2h_probe.py — why is the generic fill house at (38.1, 77.0) shattered?  Lists the town lots near it + every visible mesh whose bbox contains it + all pairs of lots closer than 5 m.
import asyncio, json, time, sys
from playwright.async_api import async_playwright
PROBE = """() => {
  const S = __tr2Town.state, B = __bw, out = { cells: S.cells.length, mode: S.mode, near: [], dup: [], meshes: [] };
  const all = []; for (const c of S.cells) for (const l of c.lots) all.push({ c: c.key, l });
  for (const { c, l } of all) { const d = Math.hypot(l.x - 38.14, l.z - 76.97); if (d < 16) out.near.push({ cell: c, id: l.id, kind: l.kind, x: +l.x.toFixed(1), z: +l.z.toFixed(1), ry: +(l.ry || 0).toFixed(2), w: +(l.w || 0).toFixed(1), d: +(l.d || 0).toFixed(1), dist: +d.toFixed(1), floors: l.floors, seed: l.seed, cellField: l.cell }); }
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const a = all[i].l, b = all[j].l, d = Math.hypot(a.x - b.x, a.z - b.z); if (d < 5) out.dup.push({ a: a.id + '/' + a.kind, b: b.id + '/' + b.kind, d: +d.toFixed(1), x: +a.x.toFixed(1), z: +a.z.toFixed(1) }); }
  const v = new B.THREE.Vector3(38.14, 3, 76.97);
  B.scene.traverse((o) => { if (o.isMesh && o.visible && o.geometry && o.geometry.attributes.position) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.containsPoint(v)) { const g = o.geometry, ua = g.attributes.uv, pa = g.attributes.position, ar = (a) => a && ({ type: a.array && a.array.constructor.name, norm: a.normalized, n: a.count, size: a.itemSize, inter: !!a.isInterleavedBufferAttribute }); let umin = 9, umax = -9, vmin = 9, vmax = -9; if (ua) for (let k = 0; k < ua.count; k++) { const u = ua.getX(k), v = ua.getY(k); if (u < umin) umin = u; if (u > umax) umax = u; if (v < vmin) vmin = v; if (v > vmax) vmax = v; }
      out.meshes.push({ name: o.name, tag: o.userData.tr2lod, cell: o.userData.tr2cell, mat: o.material && (o.material.name || o.material.type), alphaTest: o.material && o.material.alphaTest, transparent: o.material && o.material.transparent, side: o.material && o.material.side, mapSize: o.material && o.material.map && o.material.map.image && [o.material.map.image.width, o.material.map.image.height], verts: pa.count, idx: g.index && { type: g.index.array.constructor.name, n: g.index.count }, uv: ar(ua), pos: ar(pa), uvRange: [umin, umax, vmin, vmax].map((x) => +x.toFixed(3)), parent: o.parent && o.parent.name, inst: !!o.isInstancedMesh }); } } });
  const A = S.atlas && S.atlas.homes; out.atlas = A && { size: A.size, loose: [...A.loose], n: A.rects.size, rects: [...A.rects.entries()].map(([t, r]) => [t.image && t.image.width, t.image && t.image.height, r.map((v) => +v.toFixed(3))]) };
  out.totalLots = all.length; return out; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 640, 'height': 300}, device_scale_factor=1)
        await pg.goto('http://127.0.0.1:8777/rp1_dev.html?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await pg.evaluate("() => { window.__tr2TownLod = 'hi'; const T = window.__tr2Town; if (T) T.lod(__bw.camera, null, true); }")
        await pg.evaluate("() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); if (B.ctl.intro) B.ctl.intro = null; delete B.ctl.update; const k = B.ctl; k.target.set(38, 0, 77); k.dist = 40; k.polar = 1.0; k.azim = 0.6; }")
        await asyncio.sleep(3)
        for _ in range(150):
            if await pg.evaluate('() => { const T = window.__tr2Town; T.lod(__bw.camera, null, true); const s = T.state; return s.lazy.length === 0 && s.cells.every((c) => c.want !== "hi" || c.shown === "hi"); }'): break
            await asyncio.sleep(1)
        await asyncio.sleep(4)
        res = await pg.evaluate(PROBE); json.dump(res, open('/home/claude/work/tr2h/probe.json', 'w'), indent=1); print(json.dumps(res)[:6000]); await b.close()
asyncio.run(main())
