// P1 dev tool (offline site finder for the outer mills / panning; modes: check|wind|water|pan|w2|c4w).  Run: cd client && NODE_PATH=$PWD/node_modules npx esbuild ../../../../dev/p1_scan.mjs --bundle --format=esm --platform=node --outfile=/tmp/p1_scan.out.mjs --loader:.json=json && node /tmp/p1_scan.out.mjs <mode>
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { hamlets } from '/home/claude/bot/bluebot_v2/bluewall/client/src/hamlets.js';
import { nomads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nomads.js';
import { smooth } from '/home/claude/bot/bluebot_v2/bluewall/client/src/noise.js';
L.setMap('night'); buildRoads();
const H = L.height, D2R = Math.PI / 180;
const raw = (x, z) => smooth(0.42, 0.62, L.NOISE.fbm(x * 0.012 + 40, z * 0.012 - 11, 4) * 0.5 + 0.5) * (1 - smooth(L.MOUNT + 20, L.MOUNT + 90, Math.hypot(x, z)));
const forestAvg = (x, z, R) => { let s = raw(x, z), n = 1; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; s += raw(x + Math.cos(a) * R, z + Math.sin(a) * R); n++; s += raw(x + Math.cos(a) * R * 0.5, z + Math.sin(a) * R * 0.5); n++; } return s / n; };
const spread = (x, z, rad) => { let lo = 1e9, hi = -1e9; for (const [dx, dz] of [[0, 0], [rad, 0], [-rad, 0], [0, rad], [0, -rad], [rad * .7, rad * .7], [-rad * .7, -rad * .7], [rad * .7, -rad * .7], [-rad * .7, rad * .7]]) { const h = H(x + dx, z + dz); lo = Math.min(lo, h); hi = Math.max(hi, h); } return { lo, hi, d: hi - lo }; };
const seg = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2)); return { d: Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t)), x: a[0] + dx * t, z: a[1] + dz * t }; };
const roads = ROADS.filter((q) => q.kind === 'dirt' && !/^(hamlet|ws)/.test(q.name));
const allRoads = ROADS.filter((q) => !/^ws_/.test(q.name));
const roadAny = (x, z) => { let d = 1e9; for (const R of allRoads) for (let i = 0; i < R.pts.length - 1; i++) d = Math.min(d, seg(x, z, R.pts[i], R.pts[i + 1]).d); return d; };
const nearRoad = (x, z) => { let best = null; for (const R of roads) for (let i = 0; i < R.pts.length - 1; i++) { const s = seg(x, z, R.pts[i], R.pts[i + 1]); if (!best || s.d < best.d) best = s; } return best; };
const zones = [L.PASTURE, L.CAMP, L.MUSTER, L.LAIR].filter((z) => z && z.r > 0);
const mineD = (x, z) => Math.min(...L.MINES.map((M) => Math.hypot(x - M.x, z - M.z)));
const ham = hamlets(), nom = nomads();
const placed = L.WS_SITES.map((s) => ({ x: s.x, z: s.z, r: s.r, id: s.id }));
const rd = (x, z) => L.distPolyline(L.RIVER, x, z);
// returns the list of reasons a site (x,z,r) is not acceptable
function why(x, z, r, o = {}) {
  const w = [];
  if (L.sdTown(x, z) < 46 + r * 0.4) w.push('town');
  if (L.fieldD(x, z) < 1.5 + (o.fieldR || 0)) w.push('field');
  for (const Z of zones) if (Math.hypot(x - Z.x, z - Z.z) < (Z.fr ?? Z.r) + r + 12) w.push('zone');
  if (!o.windmill && Math.hypot(x - L.WINDMILL.x, z - L.WINDMILL.z) < 40 + r * 0.4) w.push('windmill');
  const lk = Math.hypot(x - L.LAKE.x, z - L.LAKE.z) - L.LAKE.r; if (lk < r + 26) w.push('lake');
  if (!o.river && rd(x, z) < r + 8) w.push('river');
  if (mineD(x, z) < 70 + r * 0.5) w.push('mine');
  for (const h of ham) if (Math.hypot(x - h.x, z - h.z) < 34 + r * 0.6) w.push('hamlet');
  for (const c of nom) if (Math.hypot(x - c.x, z - c.z) < 34 + r) w.push('nomad');
  for (const p of placed) if (Math.hypot(x - p.x, z - p.z) < p.r + r + (o.gap ?? 14)) w.push('site:' + p.id);
  const nr = nearRoad(x, z); if (!nr) w.push('noroad'); else { if (nr.d < 10 + r * 0.5) w.push('roadclose'); if (nr.d > (o.maxRoad || 150)) w.push('roadfar'); }
  if (roadAny(x, z) < r * 0.72 + 8) w.push('anyroad');
  if (L.streamD(x, z) < (o.streamClr ?? (r + 6))) w.push('stream');
  return w;
}
const mode = process.argv[2];
if (mode === 'check') { // check a given list
  for (const c of JSON.parse(process.argv[3])) { const w = why(c.x, c.z, c.r, c); const sp = spread(c.x, c.z, c.r * 0.5); console.log(c.id, 'h', H(c.x, c.z).toFixed(1), 'spread', sp.d.toFixed(2), 'lo', sp.lo.toFixed(2), 'why', w.join(','), 'forest', forestAvg(c.x, c.z, 20).toFixed(2), 'road', nearRoad(c.x, c.z).d.toFixed(0)); }
}
if (mode === 'wind') {
  const F = [L.FIELDS, L.FIELDS2]; const out = []; var TW = {};
  for (let x = -400; x <= 400; x += 5) for (let z = -400; z <= 400; z += 5) {
    const fd = Math.min(...F.map((f) => Math.hypot(x - f.x, z - f.z))); if (fd < 40 || fd > 130) continue;
    const r = 22, h = H(x, z); if (h < 0.5) continue; const ww = why(x, z, r, { fieldR: 2, maxRoad: 240, gap: 8 }); if (ww.length) { for (const q of new Set(ww.map(v=>v.split(':')[0]))) TW[q]=(TW[q]||0)+1; continue; }
    const sp = spread(x, z, r * 0.6); if (sp.d > 4.2 || sp.lo < 0.3) continue; if (forestAvg(x, z, 24) > 0.3) continue;
    out.push({ x, z, h, fd, sp: sp.d, nr: nearRoad(x, z).d, s: h * 1.0 - fd * 0.06 - sp.d });
  }
  out.sort((a, b) => b.s - a.s); console.log('WIND cands', out.length, JSON.stringify(TW)); for (const o of out.slice(0, 12)) console.log(JSON.stringify({ x: +o.x.toFixed(0), z: +o.z.toFixed(0), h: +o.h.toFixed(1), fd: +o.fd.toFixed(0), sp: +o.sp.toFixed(2), nr: +o.nr.toFixed(0) }));
}
if (mode === 'water') { // water mills: dry spot with water 12-16 m in front
  const out = []; const T = {};const tc=(k)=>{T[k]=(T[k]||0)+1};
  for (let x = -420; x <= 420; x += 4) for (let z = -420; z <= 420; z += 4) {
    if (H(x, z) < 0.8 || L.sdTown(x, z) < 58) continue;
    for (let k = 0; k < 36; k++) {
      const a = k / 36 * 6.283, sx = Math.sin(a), cz = Math.cos(a);
      if (!(H(x + sx * 13, z + cz * 13) < -0.9 || H(x + sx * 15, z + cz * 15) < -0.9 || H(x + sx * 17, z + cz * 17) < -0.9) || H(x + sx * 8, z + cz * 8) < -0.1 || H(x + sx * 5, z + cz * 5) < 0.3) { tc('shore'); continue; }
      const w = why(x, z, 16, { river: true, streamClr: 0, maxRoad: 260, gap: 4 }).filter(q=>q!=='lake'||Math.hypot(x-L.LAKE.x,z-L.LAKE.z)-L.LAKE.r<20); if (w.length) { for (const q of new Set(w.map(v=>v.split(':')[0]))) tc('why_'+q); continue; }
      const sp = spread(x - sx * 3, z - cz * 3, 9); (globalThis.ALLC = globalThis.ALLC || []).push({ x, z, a, h: H(x, z), sp: sp.d, lo: sp.lo, rv: rd(x, z), sd: L.streamD(x, z), nr: nearRoad(x, z).d }); if (sp.d > 3.2 || sp.lo < -0.3 || H(x, z) > 3.5) { tc('spread'); continue; } tc('ok');
      const nr = nearRoad(x, z); const rv = rd(x, z), sd = L.streamD(x, z);
      out.push({ x, z, a, nr: nr.d, rv, sd, sp: sp.d, h: H(x, z) });
    }
  }
  console.log('WATER cands', out.length, JSON.stringify(T)); { const A = (globalThis.ALLC || []).sort((p, q) => p.h - q.h); const seen = []; for (const o of A) { if (seen.some((t) => Math.hypot(t.x - o.x, t.z - o.z) < 25)) continue; seen.push(o); console.log('ALL', JSON.stringify({ x: o.x, z: o.z, a: +o.a.toFixed(2), h: +o.h.toFixed(1), sp: +o.sp.toFixed(1), lo: +o.lo.toFixed(1), rv: +o.rv.toFixed(0), sd: +o.sd.toFixed(0), nr: +o.nr.toFixed(0) })); if (seen.length >= 22) break; } }
  const best = (f, n) => { const q = out.filter(f).sort((a, b) => a.nr - b.nr || a.sp - b.sp); const seen = []; for (const o of q) { if (seen.some((s) => Math.hypot(s.x - o.x, s.z - o.z) < 30)) continue; seen.push(o); if (seen.length >= n) break; } return seen; };
  console.log('on river (rv<28):'); for (const o of best((o) => o.rv < 28 && o.sd > 60, 8)) console.log(JSON.stringify({ x: o.x, z: o.z, a: +o.a.toFixed(2), nr: +o.nr.toFixed(0), rv: +o.rv.toFixed(0), sp: +o.sp.toFixed(2), h: +o.h.toFixed(1), dFarm: +Math.hypot(o.x - 243, o.z + 98).toFixed(0) }));
  console.log('on stream (sd<8):'); for (const o of best((o) => o.sd < 9 && o.rv > 60, 8)) console.log(JSON.stringify({ x: o.x, z: o.z, a: +o.a.toFixed(2), nr: +o.nr.toFixed(0), sd: +o.sd.toFixed(1), sp: +o.sp.toFixed(2), h: +o.h.toFixed(1) }));
}
if (mode === 'pan') {
  const out = [];
  for (let i = 0; i < L.RIVER.length - 1; i++) for (let t = 0; t < 1; t += 0.05) {
    const a = L.RIVER[i], b = L.RIVER[i + 1], px = a[0] + (b[0] - a[0]) * t, pz = a[1] + (b[1] - a[1]) * t, dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l;
    for (const sg of [1, -1]) { const x = px + nx * 25 * sg, z = pz + nz * 25 * sg; if (rd(x, z) < 22.5) continue;
      const w = why(x, z, 22, { river: true, streamClr: 0, maxRoad: 130 }); if (w.length) continue; const sp = spread(x, z, 7); if (sp.d > 5 || sp.lo < 0.3) continue;
      const nr = nearRoad(x, z); out.push({ x, z, riv: [px, pz], nr: nr.d, sp: sp.d, dGold: Math.hypot(x - 353.5, z + 62.3), h: H(x, z) }); }
  }
  out.sort((a, b) => a.dGold - b.dGold); console.log('PAN cands', out.length); const seen = []; for (const o of out) { if (seen.some((s) => Math.hypot(s.x - o.x, s.z - o.z) < 30)) continue; seen.push(o); console.log(JSON.stringify({ x: +o.x.toFixed(1), z: +o.z.toFixed(1), riv: o.riv.map((v) => +v.toFixed(1)), nr: +o.nr.toFixed(0), sp: +o.sp.toFixed(2), dGold: +o.dGold.toFixed(0), h: +o.h.toFixed(1) })); if (seen.length >= 6) break; }
}
if (mode === 'w2') {
  const dry = (x, z) => H(x, z) > 0.8;
  const flat = (x, z, r) => { let lo = 1e9, hi = -1e9; for (let i = 0; i <= 12; i++) { const a = i / 12 * 6.283, rr = i ? r : 0, h = H(x + Math.cos(a) * rr, z + Math.sin(a) * rr); if (h < 0.8) return 1e9; lo = Math.min(lo, h); hi = Math.max(hi, h); } return hi - lo; };
  const R = 15, out = [];
  for (let x = -400; x <= 400; x += 3) for (let z = -400; z <= 400; z += 3) {
    if (!dry(x, z) || L.sdTown(x, z) < 48) continue;
    for (let k = 0; k < 24; k++) {
      const a = k / 24 * 6.283, sx = Math.sin(a), cz = Math.cos(a);
      if (H(x + sx * 15, z + cz * 15) > -0.6 || H(x + sx * 10, z + cz * 10) < -0.2) continue;
      const f = flat(x - sx * 3, z - cz * 3, 11); if (f > 2.8) continue;
      const bad = [];
      for (const p of placed) if (Math.hypot(x - p.x, z - p.z) < p.r + R + 4) bad.push('site:' + p.id);
      if (Math.hypot(x - L.CAMP.x, z - L.CAMP.z) < L.CAMP.r + R + 4) bad.push('camp');
      for (const Z of [L.PASTURE, L.MUSTER, L.LAIR]) if (Math.hypot(x - Z.x, z - Z.z) < (Z.fr ?? Z.r) + R + 6) bad.push('zone');
      for (const h of ham) if (Math.hypot(x - h.x, z - h.z) < R + 18) bad.push('hamlet');
      for (const c of nom) if (Math.hypot(x - c.x, z - c.z) < R + 30) bad.push('nomad');
      if (mineD(x, z) < 60) bad.push('mine');
      if (Math.hypot(x - L.LAKE.x, z - L.LAKE.z) - L.LAKE.r < R + 4) bad.push('lake');
      if (roadAny(x, z) < 10) bad.push('anyroad');
      const nr = nearRoad(x, z); if (!nr || nr.d > 260) bad.push('roadfar');
      if (L.fieldD(x, z) < 1.5) bad.push('field');
      if (bad.length) continue;
      out.push({ x, z, a, f, h: H(x, z), rv: rd(x, z), sd: L.streamD(x, z), nr: nr.d });
    }
  }
  out.sort((p, q) => p.f - q.f); const seen = [];
  for (const o of out) { if (seen.some((t) => Math.hypot(t.x - o.x, t.z - o.z) < 25)) continue; seen.push(o); console.log(JSON.stringify({ x: o.x, z: o.z, a: +o.a.toFixed(2), f: +o.f.toFixed(2), h: +o.h.toFixed(1), rv: +o.rv.toFixed(0), sd: +o.sd.toFixed(0), nr: +o.nr.toFixed(0) })); if (seen.length >= 16) break; }
  console.log('total', out.length);
}
