// per-candidate fate log of the hamlet planner (copy of hamlets.js loop with logging). A2_NOSTREAMS=1 -> baseline
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { rng } from '/home/claude/bot/bluebot_v2/bluewall/client/src/noise.js';
L.setMap('night');
if (process.env.A2_NOSTREAMS) L.STREAMS.length = 0;
buildRoads();
const seg = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1; const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2)); return { d: Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t)), x: a[0] + dx * t, z: a[1] + dz * t }; };
const roads = ROADS.filter((q) => !/^hamlet|^ws_/.test(q.name));
const r = rng(77123), dirt = roads.filter((q) => q.kind === 'dirt');
const zones = [L.PASTURE, L.CAMP, L.MUSTER, L.LAIR].filter((z) => z && z.r > 0);
const flat = (x, z, rad) => { let lo = 1e9, hi = -1e9; for (const [dx, dz] of [[0, 0], [rad, 0], [-rad, 0], [0, rad], [0, -rad], [rad * 0.7, rad * 0.7], [-rad * 0.7, -rad * 0.7]]) { const h = L.height(x + dx, z + dz); lo = Math.min(lo, h); hi = Math.max(hi, h); } return { lo, hi }; };
const free = (x, z, pad) => {
  if (L.sdTown(x, z) < 40 + pad) return 'town';
  if (L.fieldD(x, z) < 1.9) return 'field';
  for (const Z of zones) if (Math.hypot(x - Z.x, z - Z.z) < (Z.fr ?? Z.r) + 24 + pad) return 'zone';
  if (Math.hypot(x - L.WINDMILL.x, z - L.WINDMILL.z) < 40) return 'mill';
  if (Math.hypot(x - L.LAKE.x, z - L.LAKE.z) < L.LAKE.r + 30) return 'lake';
  if (L.distPolyline(L.RIVER, x, z) < 28) return 'river';
  if (L.nearMine(x, z, 66)) return 'mine';
  return null;
};
const PLAN = []; let draws = 0; const R = () => { draws++; return r(); };
for (let k = 0; k < 6000 && PLAN.length < 8; k++) {
  const d00 = draws; const a = R() * Math.PI * 2, d0 = 168 + R() * 112, x = Math.cos(a) * d0, z = Math.sin(a) * d0;
  const log = (s) => { if (s === 'ok' || !/^(town|field|zone|mill|lake|mine|space)$/.test(s)) console.log(k, Math.round(x) + ',' + Math.round(z), s, 'draws', draws); };
  let f0 = free(x, z, 0); if (f0) { log(f0); continue; }
  if (PLAN.some((H) => Math.hypot(H.x - x, H.z - z) < 66)) { log('space'); continue; }
  const f = flat(x, z, 16); if (f.lo < 1.2 || f.hi > 26 || f.hi - f.lo > 3.2) { log('flat ' + f.lo.toFixed(1) + '..' + f.hi.toFixed(1)); continue; }
  let best = null; for (const Rd of dirt) for (let i = 0; i < Rd.pts.length - 1; i++) { const s = seg(x, z, Rd.pts[i], Rd.pts[i + 1]); if (!best || s.d < best.d) best = s; }
  if (!best || best.d < 22 || best.d > 125) { log('road ' + (best ? best.d.toFixed(0) : '-')); continue; }
  const link = [best.x, best.z]; let okSpur = true, why = '';
  for (let t = 0.1; t <= 1; t += 0.15) { const px = x + (link[0] - x) * t, pz = z + (link[1] - z) * t, h = L.height(px, pz); if (h < 0.8 || h > 30 || L.fieldD(px, pz) < 1.15 || zones.some((Z) => Math.hypot(px - Z.x, pz - Z.z) < Z.r + 6) || L.distPolyline(L.RIVER, px, pz) < 14) { okSpur = false; why = 'h' + h.toFixed(1) + ' rd' + L.distPolyline(L.RIVER, px, pz).toFixed(0); break; } }
  if (!okSpur) { log('spur ' + why); continue; }
  const ux = (link[0] - x) / best.d, uz = (link[1] - z) / best.d;
  const n = 3 + ((R() * 3) | 0), a0 = Math.atan2(uz, ux) + Math.PI * 0.42, span = Math.PI * 2 - Math.PI * 0.84; let nh = 0;
  for (let i = 0; i < n; i++) { const aa = a0 + (i + 0.5 + (R() - 0.5) * 0.3) * span / n, rr = 10 + n * 0.9 + R() * 2.6, hx = x + Math.cos(aa) * rr, hz = z + Math.sin(aa) * rr; const w = 6 + R() * 3, dd = 7 + R() * 2.6; R(); const g = flat(hx, hz, 5); if (g.lo < 1 || g.hi - g.lo > 2.3) continue; nh++; }
  if (nh < 3) { log('houses ' + nh + '/' + n); continue; }
  for (let i = 0; i < nh; i++) { R(); if (R() < 0.5) {} } R(); R(); R();
  PLAN.push({ x, z }); log('ok');
}
console.log('PLAN', PLAN.map((H) => Math.round(H.x) + ',' + Math.round(H.z)).join(' '));
