// wsplan.mjs — OFFLINE search for the worksite positions (the result is frozen as a table in client/src/worksites.js; ws_test.sh re-checks it).
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { hamlets } from '/home/claude/bot/bluebot_v2/bluewall/client/src/hamlets.js';
import { nomads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nomads.js';
import { smooth } from '/home/claude/bot/bluebot_v2/bluewall/client/src/noise.js';
import fs from 'fs';
L.setMap('night'); buildRoads();
const H = L.height, D2R = Math.PI / 180;
const raw = (x, z) => smooth(0.42, 0.62, L.NOISE.fbm(x * 0.012 + 40, z * 0.012 - 11, 4) * 0.5 + 0.5) * (1 - smooth(L.MOUNT + 20, L.MOUNT + 90, Math.hypot(x, z)));
const forestAvg = (x, z, R) => { let s = raw(x, z), n = 1; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; s += raw(x + Math.cos(a) * R, z + Math.sin(a) * R); n++; s += raw(x + Math.cos(a) * R * 0.5, z + Math.sin(a) * R * 0.5); n++; } return s / n; };
const spread = (x, z, rad) => { let lo = 1e9, hi = -1e9; for (const [dx, dz] of [[0, 0], [rad, 0], [-rad, 0], [0, rad], [0, -rad], [rad * .7, rad * .7], [-rad * .7, -rad * .7], [rad * .7, -rad * .7], [-rad * .7, rad * .7]]) { const h = H(x + dx, z + dz); lo = Math.min(lo, h); hi = Math.max(hi, h); } return { lo, hi, d: hi - lo }; };
const mtn = (x, z) => { const r = Math.hypot(x, z) || 1; return H(x + x / r * 55, z + z / r * 55) - H(x, z); };
const seg = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2)); return { d: Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t)), x: a[0] + dx * t, z: a[1] + dz * t }; };
const roads = ROADS.filter((q) => q.kind === 'dirt' && !/^(hamlet|ws)/.test(q.name));
const allRoads = ROADS.filter((q) => !/^ws_/.test(q.name));
const roadAny = (x, z) => { let d = 1e9; for (const R of allRoads) for (let i = 0; i < R.pts.length - 1; i++) d = Math.min(d, seg(x, z, R.pts[i], R.pts[i + 1]).d); return d; };
const nearRoad = (x, z) => { let best = null; for (const R of roads) for (let i = 0; i < R.pts.length - 1; i++) { const s = seg(x, z, R.pts[i], R.pts[i + 1]); if (!best || s.d < best.d) best = s; } return best; };
const zones = [L.PASTURE, L.CAMP, L.MUSTER, L.LAIR].filter((z) => z && z.r > 0);
const mineD = (x, z) => Math.min(...L.MINES.map((M) => Math.hypot(x - M.x, z - M.z)));
const ham = hamlets(), nom = nomads();
const placed = [];
const base = (x, z, r, o = {}) => {
  if (L.sdTown(x, z) < 46 + r * 0.4) return false;
  if (L.fieldD(x, z) < 1.5) return false;
  for (const Z of zones) if (Math.hypot(x - Z.x, z - Z.z) < (Z.fr ?? Z.r) + r + (o.nearZone ? 0 : 12)) return false;
  if (Math.hypot(x - L.WINDMILL.x, z - L.WINDMILL.z) < 40 + r * 0.4) return false;
  const lk = Math.hypot(x - L.LAKE.x, z - L.LAKE.z) - L.LAKE.r; if (!o.lake && lk < r + 26) return false;
  if (!o.river && L.distPolyline(L.RIVER, x, z) < r + 8) return false;
  if (mineD(x, z) < 70 + r * 0.5) return false;
  for (const h of ham) if (Math.hypot(x - h.x, z - h.z) < 34 + r * 0.6) return false;
  for (const c of nom) if (Math.hypot(x - c.x, z - c.z) < (o.nomad ? 26 : 34) + r) return false;
  for (const p of placed) if (Math.hypot(x - p.x, z - p.z) < p.r + r + 14) return false;
  const nr = nearRoad(x, z); if (!nr || nr.d < 10 + r * 0.5 || nr.d > (o.maxRoad || 150)) return false;
  if (roadAny(x, z) < r * 0.72 + 8) return false;
  return true;
};
const KINDS = {
  lumber:     { r: 24 }, quarry: { r: 24 }, farm: { r: 26 }, livestock: { r: 26 }, fishery: { r: 22 }, iron: { r: 22 }, slaughter: { r: 18 }, greenhouse: { r: 20 }, gold: { r: 22 }, oil: { r: 26 },
};
// candidate scan
const cands = []; for (let a = 0; a < 360; a += 2) for (let d = 185; d < 362; d += 6) cands.push([Math.cos(a * D2R) * d, Math.sin(a * D2R) * d]);
function best(kind, o) {
  const r = KINDS[kind].r; let B = null; const C = { all: 0, base: 0, spread: 0, score: 0 };
  for (const [x, z] of cands) {
    C.all++;
    const op = o.opts || {};
    const sc = o.score(x, z, null); if (sc == null) { C.score++; continue; }
    if (!base(x, z, r, op)) { C.base++; continue; }
    const sp = spread(x, z, r * 0.5); if (sp.lo < (o.minH ?? 0.4) || sp.hi > (o.maxH ?? 30) || sp.d > (o.maxSpread ?? 7)) { C.spread++; continue; }
    if (!B || sc > B.s) B = { x, z, s: sc, sp };
  }
  if (!B) console.log('  rejects', kind, JSON.stringify(C));
  return B;
}
const out = [];
const LOW = (h) => -Math.max(0, h - 4) * 0.7;
const take = (kind, o, extra = {}) => { const B = best(kind, o); if (!B) { console.log('NO SPOT', kind); return null; } const r = KINDS[kind].r; placed.push({ x: B.x, z: B.z, r }); const nr = nearRoad(B.x, B.z); out.push({ kind, x: +B.x.toFixed(1), z: +B.z.toFixed(1), link: [+nr.x.toFixed(1), +nr.z.toFixed(1)], score: +B.s.toFixed(2), h: +H(B.x, B.z).toFixed(1), spread: +B.sp.d.toFixed(2), ...extra }); console.log(kind, out[out.length - 1]); return B; };
const rd = (x, z) => L.distPolyline(L.RIVER, x, z);
// the order matters (the scarce ones first)
take('lumber', { opts: { river: true, maxRoad: 170 }, score: (x, z) => { const f = forestAvg(x, z, 30); if (f < 0.3) return null; const r = rd(x, z); if (r < 40) return null; return f * 10 + (r < 75 ? 3 : 0) - Math.abs(r - 50) * 0.02; } }, { sawmill: false });
take('lumber', { opts: { river: true, maxRoad: 170 }, score: (x, z) => { const f = forestAvg(x, z, 30); if (f < 0.3) return null; const r = rd(x, z); if (r < 40) return null; return f * 10 + (r < 75 ? 3 : 0) - Math.abs(r - 50) * 0.02 + (x < -140 ? 6 : -20); } });
take('oil', { opts: { nomad: true, maxRoad: 200 }, maxSpread: 6, score: (x, z) => { let m = 1e9; for (const c of nom) m = Math.min(m, Math.hypot(x - c.x, z - c.z)); return m > 50 && m < 130 && x < -200 ? 10 - Math.abs(m - 80) * 0.05 + (1 - Math.min(1, forestAvg(x, z, 24) * 3)) + LOW(H(x, z)) : null; } });
take('quarry', { minH: 3, maxH: 26, maxSpread: 4.5, score: (x, z) => { const m = mtn(x, z); return m > 9 ? m - Math.abs(Math.hypot(x, z) - 330) * 0.03 : null; } });
take('iron', { minH: 3, maxH: 26, maxSpread: 4.5, score: (x, z) => { const m = mtn(x, z); const q = placed[1] ? Math.hypot(x - placed[1].x, z - placed[1].z) : 0; return m > 9 && q > 160 ? m + q * 0.02 : null; } });
take('gold', { minH: 3, maxH: 28, maxSpread: 4.5, score: (x, z) => { const m = mtn(x, z); const q = Math.min(...placed.map((p) => Math.hypot(x - p.x, z - p.z))); return m > 9 && q > 150 ? m + q * 0.02 : null; } });
// farm: next to the big field patch, outside; livestock + slaughter by the pasture; greenhouse by the second field patch
const F1 = L.FARMS[0], F2 = L.FARMS[1], PA = L.PASTURE;
take('farm', { opts: { nearZone: true }, maxSpread: 6, score: (x, z) => { const d = Math.hypot(x - F1.x, z - F1.z); return d > 56 && d < 110 ? 10 - Math.abs(d - 70) * 0.1 - Math.abs(Math.hypot(x, z) - Math.hypot(F1.x, F1.z)) * 0.02 + LOW(H(x, z)) : null; } });
take('greenhouse', { opts: { nearZone: true }, maxSpread: 6, score: (x, z) => { const d = Math.hypot(x - F2.x, z - F2.z); return d > 46 && d < 100 ? 10 - Math.abs(d - 58) * 0.1 + LOW(H(x, z)) : null; } });
take('livestock', { opts: { nearZone: true }, maxSpread: 6, score: (x, z) => { const d = Math.hypot(x - PA.x, z - PA.z); const ang = Math.atan2(z - PA.z, x - PA.x); return d > (PA.fr ?? PA.r) + 30 && d < (PA.fr ?? PA.r) + 90 ? 10 - Math.abs(d - ((PA.fr ?? PA.r) + 44)) * 0.1 + Math.cos(ang - 0.3) * 0.4 + LOW(H(x, z)) : null; } });
take('slaughter', { opts: { nearZone: true }, maxSpread: 6, score: (x, z) => { const d = Math.hypot(x - PA.x, z - PA.z); const lv = placed.find((p, i) => out[i] && out[i].kind === 'livestock'); const q = lv ? Math.hypot(x - lv.x, z - lv.z) : 0; return d > (PA.fr ?? PA.r) + 40 && d < (PA.fr ?? PA.r) + 140 && q > 55 && q < 115 && Math.hypot(x, z) < 345 ? 10 - Math.abs(q - 80) * 0.05 + LOW(H(x, z)) : null; } });
// oil: near a nomad camp (a caravan route), flat open ground
// fishery on the lake shore: the gentlest bank (smallest rise over 12 m inland) whose road is not too far
{
  const r = KINDS.fishery.r; let B = null;
  for (let a = 0; a < 360; a += 3) {
    const ux = Math.cos(a * D2R), uz = Math.sin(a * D2R);
    let sd = L.LAKE.r * 0.7; for (; sd < L.LAKE.r + 40; sd += 0.5) if (H(L.LAKE.x + ux * sd, L.LAKE.z + uz * sd) > 0.45) break;
    if (sd > L.LAKE.r + 30) continue;
    const at = (o) => [L.LAKE.x + ux * (sd + o), L.LAKE.z + uz * (sd + o)];
    const [x, z] = at(10), rise = H(...at(18)) - H(...at(2));
    if (L.sdTown(x, z) < 50 || H(x, z) < 0.5) continue;
    const nr = nearRoad(x, z); if (!nr || nr.d > 170 || nr.d < 16) continue;
    if (ham.some((h) => Math.hypot(x - h.x, z - h.z) < 30)) continue;
    if (placed.some((p) => Math.hypot(x - p.x, z - p.z) < p.r + r + 8)) continue;
    if (L.distPolyline(L.RIVER, x, z) < 20 || roadAny(x, z) < 16) continue;
    const s = 10 - rise * 0.5 - nr.d * 0.04;
    if (!B || s > B.s) B = { x, z, s, a, sd, nr, rise };
  }
  if (B) { placed.push({ x: B.x, z: B.z, r }); out.push({ kind: 'fishery', variant: 'lake', x: +B.x.toFixed(1), z: +B.z.toFixed(1), link: [+B.nr.x.toFixed(1), +B.nr.z.toFixed(1)], water: [L.LAKE.x, L.LAKE.z], shoreA: B.a, rise: +B.rise.toFixed(1), h: +H(B.x, B.z).toFixed(1) }); console.log('fishery', out[out.length - 1]); } else console.log('NO SPOT fishery');
}
// a dock on the river outside the town (east of the NE water gate)
{
  const r = 16; let B = null;
  for (let i = 0; i < 5; i++) for (let t = 0; t < 1; t += 0.04) {
    const a = L.RIVER[i], b = L.RIVER[i + 1], px = a[0] + (b[0] - a[0]) * t, pz = a[1] + (b[1] - a[1]) * t;
    const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l;
    for (const sgn of [1, -1]) { const x = px + nx * 25 * sgn, z = pz + nz * 25 * sgn; if (L.distPolyline(L.RIVER, x, z) < 22.5) continue;
      if (L.sdTown(x, z) < 50 || L.fieldD(x, z) < 1.5 || placed.some((p) => Math.hypot(x - p.x, z - p.z) < p.r + r + 10)) continue;
      if (zones.some((Z) => Math.hypot(x - Z.x, z - Z.z) < Z.r + 30)) continue;
      const sp = spread(x, z, 7); if (sp.d > 6 || sp.lo < 0.3) continue; const nr = nearRoad(x, z); if (!nr || nr.d > 110 || nr.d < 16 || roadAny(x, z) < 16) continue; if (ham.some((h) => Math.hypot(x - h.x, z - h.z) < 34)) continue;
      const s = 10 - nr.d * 0.05 - Math.abs(Math.hypot(x, z) - 270) * 0.02; if (!B || s > B.s) B = { x, z, s, nr, riv: [px, pz] }; } }
  if (B) { placed.push({ x: B.x, z: B.z, r }); out.push({ kind: 'fishery', variant: 'river', x: +B.x.toFixed(1), z: +B.z.toFixed(1), link: [+B.nr.x.toFixed(1), +B.nr.z.toFixed(1)], water: [+B.riv[0].toFixed(1), +B.riv[1].toFixed(1)], h: +H(B.x, B.z).toFixed(1) }); console.log('fishery', out[out.length - 1]); } else console.log('NO SPOT river dock');
}
fs.writeFileSync('/tmp/cmp/wsplan.json', JSON.stringify(out, null, 1));
