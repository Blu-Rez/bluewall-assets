// Hamlets: small roadside villages in the open country between the town wall and the mountains, so no stretch of the map stays empty.
// Planned once, deterministically, from the layout (no randomness at run time):
//   planHamlets(roads)  -> [{ x, z, r, link:[x,z], spur:[[x,z]...], houses:[{ x, z, ry, w, d, floors }], props:[{ k, x, z, ry, s }] }]
//   hamlets()           -> the cached plan;  hamletD(x, z) -> distance to the nearest hamlet centre (for the forest / flora keep-clear rules)
// roads.js adds each spur to the dirt road list (the ground painter and the forest rules pick it up), town.js builds the houses with the same
// townHouse() as the town (one static batch), and the well + crates / barrels / carts are instanced props.
import * as L from './layout.js';
import { rng } from './noise.js';

let PLAN = null;
const seg = (px, pz, a, b) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2));
  return { d: Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t)), x: a[0] + dx * t, z: a[1] + dz * t };
};

export function planHamlets(roads) {
  if (PLAN) return PLAN;
  PLAN = [];
  if (!L.TOWN || !roads || !L.PASTURE || L.PASTURE.r <= 0) return PLAN;
  const r = rng(77123), dirt = roads.filter((q) => q.kind === 'dirt' && !/^hamlet/.test(q.name));
  const zones = [L.PASTURE, L.CAMP, L.MUSTER, L.LAIR].filter((z) => z && z.r > 0);
  const flat = (x, z, rad) => {                                    // gentle ground: height spread under the footprint
    let lo = 1e9, hi = -1e9;
    for (const [dx, dz] of [[0, 0], [rad, 0], [-rad, 0], [0, rad], [0, -rad], [rad * 0.7, rad * 0.7], [-rad * 0.7, -rad * 0.7]]) { const h = L.height(x + dx, z + dz); lo = Math.min(lo, h); hi = Math.max(hi, h); }
    return { lo, hi };
  };
  const free = (x, z, pad) => {
    if (L.sdTown(x, z) < 40 + pad) return false;
    if (L.fieldD(x, z) < 1.9) return false;
    for (const Z of zones) if (Math.hypot(x - Z.x, z - Z.z) < (Z.fr ?? Z.r) + 24 + pad) return false;
    if (Math.hypot(x - L.WINDMILL.x, z - L.WINDMILL.z) < 40) return false;
    if (Math.hypot(x - L.LAKE.x, z - L.LAKE.z) < L.LAKE.r + 30) return false;
    if (L.distPolyline(L.RIVER, x, z) < 28) return false;
    if (L.nearMine(x, z, 66)) return false;
    return true;
  };
  for (let k = 0; k < 6000 && PLAN.length < 8; k++) {
    const a = r() * Math.PI * 2, d0 = 168 + r() * 112, x = Math.cos(a) * d0, z = Math.sin(a) * d0;
    if (!free(x, z, 0)) continue;
    if (PLAN.some((H) => Math.hypot(H.x - x, H.z - z) < 66)) continue;
    const f = flat(x, z, 16); if (f.lo < 1.2 || f.hi > 26 || f.hi - f.lo > 3.2) continue;
    // the nearest dirt road: the hamlet hangs off it by a short spur
    let best = null;
    for (const R of dirt) for (let i = 0; i < R.pts.length - 1; i++) { const s = seg(x, z, R.pts[i], R.pts[i + 1]); if (!best || s.d < best.d) best = s; }
    if (!best || best.d < 22 || best.d > 125) continue;
    const link = [best.x, best.z], ux = (link[0] - x) / best.d, uz = (link[1] - z) / best.d;
    // the spur must run over reasonable ground
    let okSpur = true;
    for (let t = 0.1; t <= 1; t += 0.15) {
      const px = x + (link[0] - x) * t, pz = z + (link[1] - z) * t, h = L.height(px, pz);
      if (h < 0.8 || h > 30 || L.fieldD(px, pz) < 1.15 || zones.some((Z) => Math.hypot(px - Z.x, pz - Z.z) < Z.r + 6) || L.distPolyline(L.RIVER, px, pz) < 14) { okSpur = false; break; }
    }
    if (!okSpur) continue;
    const H = { x, z, r: 30, link, spur: [link, [(link[0] + x) / 2 + uz * 5, (link[1] + z) / 2 - ux * 5], [x + ux * 5, z + uz * 5]], houses: [], props: [] };
    // 3-5 houses on an arc around the green, facing it; the arc stays open on the road side
    const n = 3 + ((r() * 3) | 0), a0 = Math.atan2(uz, ux) + Math.PI * 0.42, span = Math.PI * 2 - Math.PI * 0.84;
    for (let i = 0; i < n; i++) {
      const aa = a0 + (i + 0.5 + (r() - 0.5) * 0.3) * span / n, rr = 10 + n * 0.9 + r() * 2.6, hx = x + Math.cos(aa) * rr, hz = z + Math.sin(aa) * rr;
      const w = 6 + r() * 3, dd = 7 + r() * 2.6, ry = Math.atan2(x - hx, z - hz);
      const g = flat(hx, hz, 5); if (g.lo < 1 || g.hi - g.lo > 2.3) continue;
      H.houses.push({ x: hx, z: hz, ry, w, d: dd, floors: 1 + (r() < 0.45 ? 1 : 0), kind: 'house', scheme: 'rustic' });   // (farmsteads: town.js picks warm walls + thatch / shingle / slate roofs)
    }
    if (H.houses.length < 3) continue;
    H.props.push({ k: 'well', x, z, ry: 0, s: 1 });
    for (const h of H.houses) {
      const c = Math.cos(h.ry), s = Math.sin(h.ry);
      const at = (lx, lz) => [h.x + lx * c + lz * s, h.z - lx * s + lz * c];
      const [bx, bz] = at(h.w / 2 + 1.4, h.d / 2 + 0.6); H.props.push({ k: r() < 0.5 ? 'barrel' : 'crate', x: bx, z: bz, ry: r() * 6.28, s: 1.3 });
      if (r() < 0.5) { const [cx, cz] = at(-h.w / 2 - 1.2, h.d / 2 + 0.2); H.props.push({ k: r() < 0.5 ? 'crate' : 'barrel', x: cx, z: cz, ry: r() * 6.28, s: 1.3 }); }
    }
    { const h = H.houses[(r() * H.houses.length) | 0], c = Math.cos(h.ry), s = Math.sin(h.ry); H.props.push({ k: 'cart', x: h.x + (-h.w / 2 - 3) * c + (h.d / 2 + 2.2) * s, z: h.z - (-h.w / 2 - 3) * s + (h.d / 2 + 2.2) * c, ry: h.ry + 1.2, s: 1.5 }); }
    PLAN.push(H);
  }
  return PLAN;
}
export const hamlets = () => PLAN || [];
export function hamletD(x, z) {
  let d = 1e9;
  for (const H of PLAN || []) d = Math.min(d, Math.hypot(x - H.x, z - H.z));
  return d;
}
