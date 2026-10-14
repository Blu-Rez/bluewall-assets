// A2 planner: routes the mountain streams over the REAL terrain and the real map records (A* on a 4 m grid) and writes the frozen points for layout.js STREAMS.
//   node dev/a2_plan.mjs   ->  work/a2/streams.json   (then: python3 dev/a2_freeze.py)
import fs from 'fs';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, roadDist } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { hamlets } from '/home/claude/bot/bluebot_v2/bluewall/client/src/hamlets.js';
import { nomads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nomads.js';
import { fallsMetrics } from '/home/claude/dev/a2_fallsm.mjs';
L.setMap('night'); L.STREAMS.length = 0; buildRoads();
const OPTS = [
  // gorge: P0 (uphill end of the slot = the foot of the waterfall) and the mouth of the gorge; goal: where on the moat the stream ends (world angle range, degrees); k = width scale (1 = like the p38 river)
  { id: 'stream_w', k: 1.8, P0: [-157, -411], mouth: [-153, -384], goalAng: [-112, -104], amp: 7 },
  { id: 'stream_e', k: 1.0, P0: [-92, -430], mouth: [-87, -400], goalAng: [-47, -41], amp: 3, tight: true },     // (stream_e threads the gap between the camp and the hamlet east of it: one changed hamlet candidate would re-plan every later hamlet and nomad camp)
];
const ST = 4, x0 = -230, x1 = 200, z0 = -430, z1 = -110, nx = Math.round((x1 - x0) / ST) + 1, nz = Math.round((z1 - z0) / ST) + 1;
const out = [];
for (const OPT of OPTS) {
  const ex = 9 * (OPT.k - 1) + OPT.amp;                                 // a wider stream keeps a wider berth; the meander (amplitude amp) must not eat the clearance
  const rec = [];                                                      // [x, z, hardRadius, softRadius]
  rec.push([L.CAMP.x, L.CAMP.z, (L.CAMP.fr ?? L.CAMP.r) + (OPT.tight ? 7 : 10) + ex, (L.CAMP.fr ?? L.CAMP.r) + (OPT.tight ? 16 : 28) + ex]);
  for (const s of L.SITES) rec.push([s.x, s.z, s.r + 16 + ex, s.r + 30 + ex]);
  for (const m of L.MINES) rec.push([m.x, m.z, 52 + ex, 70 + ex]);
  for (const h of hamlets()) {
    rec.push([h.x, h.z, 28 * OPT.k + (OPT.tight ? 3 : 10) + OPT.amp, 28 * OPT.k + (OPT.tight ? 18 : 24) + OPT.amp]);          // hamlets.js keeps its centres >= 28 m from the river (distPolyline is divided by k for a wide stream), the greens are ~24 m wide
    const n = Math.ceil(Math.hypot(h.link[0] - h.x, h.link[1] - h.z) / 8); for (let k = 0; k <= n; k++) rec.push([h.x + (h.link[0] - h.x) * k / n, h.z + (h.link[1] - h.z) * k / n, 14 * OPT.k + (OPT.tight ? 6 : 12) + OPT.amp, 14 * OPT.k + (OPT.tight ? 14 : 20) + OPT.amp]);   // ... and rejects a hamlet whose spur comes within 14 m of the river
  }
  for (const h of nomads() || []) rec.push([h.x, h.z, 24 * OPT.k + 8 + OPT.amp, 24 * OPT.k + 20 + OPT.amp]);   // nomads.js: centres >= 24 m
  for (const o of [L.PASTURE, L.MUSTER, L.LAIR]) rec.push([o.x, o.z, (o.fr ?? o.r) + 10, (o.fr ?? o.r) + 24]);
  for (const prev of out) for (const p of prev.pts) rec.push([p[0], p[1], 34 + 9 * (prev.k - 1) + ex, 50 + 9 * (prev.k - 1) + ex]);    // the streams keep apart
  const pen = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + i * ST, z = z0 + j * ST, h = L.height(x, z);
    let p = 1 + 0.22 * Math.max(0, h - 4) ** 1.2;                      // cut as little hill as possible
    for (const [rx, rz, hr, sr] of rec) { const d = Math.hypot(x - rx, z - rz); if (d < hr) p += 400; else if (d < sr) p += 6 * (1 - (d - hr) / (sr - hr)); }
    const sd = L.sdTown(x, z); if (sd < 22) p += 60; if (sd < 70) p += 5 * (1 - Math.max(0, sd - 22) / 48);   // keep off the wall / moat (no hugging it) except at the goal
    if (roadDist(x, z) < 3) p += 5;                                    // do not run along a road
    pen[j * nx + i] = p;
  }
  const idx = (x, z) => [Math.round((x - x0) / ST), Math.round((z - z0) / ST)];
  const [si, sj] = idx(...OPT.mouth);
  const goal = (i, j) => { const x = x0 + i * ST, z = z0 + j * ST, sd = L.sdTown(x, z), a = Math.atan2(z, x) * 180 / Math.PI; return sd > 12.5 && sd < 15 && a >= OPT.goalAng[0] && a <= OPT.goalAng[1]; };
  const key = (i, j) => j * nx + i, g = new Float32Array(nx * nz).fill(1e9), from = new Int32Array(nx * nz).fill(-1), open = [[0, si, sj]]; g[key(si, sj)] = 0;
  const goals = []; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (goal(i, j)) goals.push([i, j]);
  const hh = (i, j) => Math.min(...goals.map(([gi, gj]) => Math.hypot(gi - i, gj - j))) * ST * 0.9;
  let end = null; const closed = new Uint8Array(nx * nz);
  const nb = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  while (open.length) {
    let bi = 0; for (let q = 1; q < open.length; q++) if (open[q][0] < open[bi][0]) bi = q; const [, i, j] = open.splice(bi, 1)[0]; const k = key(i, j); if (closed[k]) continue; closed[k] = 1;
    if (goal(i, j)) { end = [i, j]; break; }
    for (const [di, dj] of nb) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; const kk = key(ii, jj); if (closed[kk]) continue;
      const step = Math.hypot(di, dj) * ST * (pen[kk] + pen[k]) / 2, ng = g[k] + step; if (ng < g[kk]) { g[kk] = ng; from[kk] = k; open.push([ng + hh(ii, jj), ii, jj]); } }
  }
  if (!end) { console.log(OPT.id, 'NO ROUTE'); process.exit(1); }
  let path = []; for (let k = key(...end); k >= 0; k = from[k]) path.push([x0 + (k % nx) * ST, z0 + Math.floor(k / nx) * ST]); path.reverse();
  for (let it = 0; it < 14; it++) path = path.map((p, i) => (i === 0 || i === path.length - 1) ? p : [0, 1].map((c) => p[c] * 0.5 + 0.25 * (path[i - 1][c] + path[i + 1][c])));
  const res = [path[0]]; let acc = 0;
  for (let i = 1; i < path.length; i++) { let a = path[i - 1], b = path[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); while (acc + l >= 10) { const t = (10 - acc) / l; a = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; res.push(a); l = Math.hypot(b[0] - a[0], b[1] - a[1]); acc = 0; } acc += l; }
  // a river is never a ruler: a gentle meander (wavelength ~110 m), fading out over the first / last 50 m of the plain stretch
  { let sAcc = 0; const tot = res.reduce((a, p, i) => i ? a + Math.hypot(p[0] - res[i - 1][0], p[1] - res[i - 1][1]) : 0, 0);
    for (let i = 1; i < res.length - 1; i++) { sAcc += Math.hypot(res[i][0] - res[i - 1][0], res[i][1] - res[i - 1][1]); const a = res[i - 1], b = res[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), nx_ = -(b[1] - a[1]) / l, nz_ = (b[0] - a[0]) / l;
      const fade = Math.min(1, sAcc / 50, (tot - sAcc) / 50), off = OPT.amp * fade * Math.sin(sAcc / 110 * 2 * Math.PI + 0.6); res[i] = [res[i][0] + nx_ * off, res[i][1] + nz_ * off]; } }
  { const a = res[res.length - 2], b = res[res.length - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / l, dz = (b[1] - a[1]) / l; let q = b.slice(); for (let i = 0; i < 20 && L.sdTown(q[0], q[1]) > 13.2; i++) q = [q[0] + dx, q[1] + dz]; res.push(q); }   // run on into the moat's centre line
  const gorge = []; { const [px, pz] = OPT.P0, [mx, mz] = OPT.mouth, n = Math.ceil(Math.hypot(px - mx, pz - mz) / 10); for (let k = 0; k <= n; k++) gorge.push([px + (mx - px) * k / n, pz + (mz - pz) * k / n]); }
  const pts = [...gorge.slice(0, -1), ...res].map(([x, z]) => [+x.toFixed(1), +z.toFixed(1)]);
  const S = { id: OPT.id, kind: 'stream', k: OPT.k, pts }; out.push(S);
  L.STREAMS.push(S);                                                   // (the next stream sees this one carved)
  const len = pts.reduce((a, p, i) => i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);
  console.log(OPT.id, 'k', OPT.k, 'points', pts.length, 'length', len.toFixed(0), 'm; falls', JSON.stringify(fallsMetrics(pts)));
  { const cl = []; for (const [n, o, r] of [['CAMP', L.CAMP, L.CAMP.fr ?? L.CAMP.r], ...L.SITES.map((q) => [q.id, q, q.r]), ...L.MINES.map((q) => [q.id, q, 45])]) cl.push([n, Math.min(...pts.map(([x, z]) => Math.hypot(x - o.x, z - o.z) - r))]); cl.sort((a, b) => a[1] - b[1]); console.log('  closest records (m beyond their radius):', cl.slice(0, 4).map(([n, v]) => n + ' ' + v.toFixed(0)).join(', ')); }
}
L.STREAMS.length = 0;
fs.writeFileSync('/home/claude/work/a2/streams.json', JSON.stringify(out));
console.log('written work/a2/streams.json');
