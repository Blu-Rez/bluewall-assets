#!/usr/bin/env python3
# tr2h_probe2.py — the geometry of the atlas parts (what bakeTr2 merges): signed volume (negative = inside-out winding), bbox, uv range in the tile, UV-stretch outliers, per model.  Generic houses vs planned houses.
import asyncio, json
from playwright.async_api import async_playwright
PROBE = """() => {
  const A = __tr2Town.state.atlas.homes, out = {};
  for (const n of ['house_generic_a|w7.5', 'house_generic_b|w7.5', 'house_generic_c|w7.5', 'house_generic_d|w7.5', 'house_cottage_0|w6.6', 'house_cottage_1|w4.8', 'house_craftsman_2|w7.8', 'house_merchant_2|w7.1', 'house_noble_1|w10.5']) {
    let parts; try { parts = A.get(n); } catch (e) { out[n] = 'ERR ' + e.message; continue; }
    out[n] = parts.map((p) => {
      const g = p.geometry, P = g.attributes.position, U = g.attributes.uv, I = g.index, tri = I.count / 3; let vol = 0; const rat = [], tn = [];
      let bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9, bz0 = 1e9, bz1 = -1e9, umin = 9, umax = -9, vmin = 9, vmax = -9;
      for (let k = 0; k < P.count; k++) { const x = P.getX(k), y = P.getY(k), z = P.getZ(k); bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); bz0 = Math.min(bz0, z); bz1 = Math.max(bz1, z); const u = U.getX(k), v = U.getY(k); umin = Math.min(umin, u); umax = Math.max(umax, u); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); }
      for (let t = 0; t < tri; t++) {
        const a = I.getX(3 * t), b = I.getX(3 * t + 1), c = I.getX(3 * t + 2);
        const ax = P.getX(a), ay = P.getY(a), az = P.getZ(a), bx = P.getX(b), by = P.getY(b), bz = P.getZ(b), cx = P.getX(c), cy = P.getY(c), cz = P.getZ(c);
        vol += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
        const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az, nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, a3 = Math.sqrt(nx * nx + ny * ny + nz * nz) / 2;
        const du = U.getX(b) - U.getX(a), dv = U.getY(b) - U.getY(a), eu = U.getX(c) - U.getX(a), ev = U.getY(c) - U.getY(a), a2 = Math.abs(du * ev - dv * eu) / 2;
        if (a3 > 1e-9) rat.push(a2 / a3);
      }
      rat.sort((x, y) => x - y); const med = rat[rat.length >> 1] || 0; let hi = 0, lo = 0; for (const r of rat) { if (r > med * 8) hi++; if (r < med / 8) lo++; }
      const nA = g.attributes.normal; let flip = 0; if (nA) { for (let t = 0; t < Math.min(tri, 4000); t++) { const a = I.getX(3 * t), b = I.getX(3 * t + 1), c = I.getX(3 * t + 2); const ux = P.getX(b) - P.getX(a), uy = P.getY(b) - P.getY(a), uz = P.getZ(b) - P.getZ(a), vx = P.getX(c) - P.getX(a), vy = P.getY(c) - P.getY(a), vz = P.getZ(c) - P.getZ(a); const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx; if (fx * nA.getX(a) + fy * nA.getY(a) + fz * nA.getZ(a) < 0) flip++; } }
      return { tri, verts: P.count, vol: +vol.toFixed(2), bbox: [bx1 - bx0, by1 - by0, bz1 - bz0].map((x) => +x.toFixed(2)), ymin: +by0.toFixed(2), uvr: [umin, umax, vmin, vmax].map((x) => +x.toFixed(3)), uvMedRatio: +med.toExponential(2), uvHiOutliers: hi, uvLoOutliers: lo, windingVsNormalFlip: flip, attrs: Object.keys(g.attributes), uvType: U.array.constructor.name, uvNorm: U.normalized, posType: P.array.constructor.name };
    });
  }
  return out; }"""
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
        await asyncio.sleep(3)
        res = await pg.evaluate(PROBE); json.dump(res, open('/home/claude/work/tr2h/probe2.json', 'w'), indent=1)
        for k, v in res.items(): print(k, json.dumps(v)[:700])
        await b.close()
asyncio.run(main())
