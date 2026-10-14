// rivertown.mjs — computes the river path INSIDE the town from the real layout (ring / ring2 midline), its crossings with
// the cobbled streets (bridges) and with the town wall (water gates).  Prints the numbers to paste into layout.js, and writes /tmp/cmp/rivertown.json
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import fs from 'fs';
L.setMap('night'); buildRoads();
const T = L.TOWN, DEG = Math.PI / 180;
const sc = (k) => T.map(([x, z]) => { const r = Math.hypot(x, z), f = (r - k) / r; return [x * f, z * f]; });
const mid = sc(49), ring = sc(31), ring2 = sc(67);
function rayR(poly, a) {
  const dx = Math.cos(a * DEG), dz = Math.sin(a * DEG); let best = 1e9;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], ex = q[0] - p[0], ez = q[1] - p[1], den = dx * ez - dz * ex; if (Math.abs(den) < 1e-9) continue;
    const t = (p[0] * ez - p[1] * ex) / den, u = (p[0] * dz - p[1] * dx) / den; if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t);
  }
  return best;
}
const pol = (a, r) => [r * Math.cos(a * DEG), r * Math.sin(a * DEG)];
const old = L.RIVER.slice(0, 7);
// the wall crossings: the river keeps its heading from the NE and meets the wall (segment 10) a few metres off the middle; it leaves through the middle of segment 4 (WSW)
const segs = { in: 10, out: 4 };
const mOut = L.segMid(T, segs.out), nOut = L.segNormalOut(T, segs.out);
const hIn = (() => { const a = old[5], b = old[6], l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; })();
function rayWall(P, d, seg) {                  // where the ray P + d t crosses wall segment `seg`
  const a = T[seg], b = T[(seg + 1) % T.length], ex = b[0] - a[0], ez = b[1] - a[1], den = d[0] * ez - d[1] * ex, t = ((a[0] - P[0]) * ez - (a[1] - P[1]) * ex) / den, u = ((a[0] - P[0]) * d[1] - (a[1] - P[1]) * d[0]) / den;
  return { t, u, p: [P[0] + d[0] * t, P[1] + d[1] * t] };
}
const W1 = rayWall(old[6], hIn, segs.in); const mIn = W1.p;
const aIn = Math.atan2(mIn[1], mIn[0]) / DEG, aOut = Math.atan2(mOut[1], mOut[0]) / DEG - 360;      // (the river runs round the north: the angle keeps falling past -180)
console.log('wall in', mIn.map((v) => +v.toFixed(1)), 'seg', segs.in, 'offset from the segment middle', +Math.hypot(mIn[0] - L.segMid(T, segs.in)[0], mIn[1] - L.segMid(T, segs.in)[1]).toFixed(1), 'angle', +aIn.toFixed(1), '| out', mOut.map((v) => +v.toFixed(1)), 'angle', +aOut.toFixed(1));
// smoothed midline radius (the polygon's corners are rounded off so the river bends gently)
const rm = (a) => { let s = 0, n = 0; for (let d = -14; d <= 14; d += 2) { s += rayR(mid, a + d); n++; } return s / n + 1.0; };
const wob = (a) => 1.5 * Math.sin(a * 0.075 + 1.1) + 0.8 * Math.sin(a * 0.19);
const along = (m, n, s) => [m[0] + n[0] * s, m[1] + n[1] * s];         // s > 0 outside the wall
const RHO = 10.5, A = [];
A.push(old[5], old[6]);
const wallDist = (m) => Math.hypot(m[0], m[1]);
function fillet(m, n, dir) {                  // n: outward direction at the wall.  dir -1: entering (angle falls), +1: leaving.
  const u = [-n[0], -n[1]];                    // inward
  const mk = (sS) => {
    const S = along(m, n, sS);
    let t = [-u[1], u[0]]; const dAng = (S[0] * t[1] - S[1] * t[0]); if ((dAng < 0 ? -1 : 1) !== dir) t = [-t[0], -t[1]];
    const fil = []; for (let f = 0.25; f <= 1.0001; f += 0.25) { const ph = f * Math.PI / 2; fil.push([S[0] + u[0] * RHO * Math.sin(ph) + t[0] * RHO * (1 - Math.cos(ph)), S[1] + u[1] * RHO * Math.sin(ph) + t[1] * RHO * (1 - Math.cos(ph))]); }
    const E = fil[fil.length - 1], aE = Math.atan2(E[1], E[0]) / DEG; return { S, fil, E, aEnd: aE, sS, err: Math.hypot(...E) - rm(aE) };
  };
  let best = null; for (let sS = -20; sS >= -60; sS -= 0.5) { const q = mk(sS); if (!best || Math.abs(q.err) < Math.abs(best.err)) best = q; }
  return best;
}
const fi = fillet(mIn, [-hIn[0], -hIn[1]], -1), fo = fillet(mOut, nOut, +1);
const unwrapIn = fi.aEnd, unwrapOut = (fo.aEnd > 0 ? fo.aEnd - 360 : fo.aEnd);
console.log('fillet in ends at', +unwrapIn.toFixed(1), 'r', +Math.hypot(...fi.E).toFixed(1), '| out ends at', +unwrapOut.toFixed(1), 'r', +Math.hypot(...fo.E).toFixed(1), '| straight run in sS', +fi.sS.toFixed(1), 'out', +fo.sS.toFixed(1));
A.push(mIn, fi.S, ...fi.fil);
const span = unwrapIn - unwrapOut, steps = Math.max(2, Math.round(span / 12));
for (let k = 1; k < steps; k++) {
  const a = unwrapIn - (span * k) / steps, fade = Math.min(1, k / 3, (steps - k) / 3), aw = ((a + 180) % 360 + 360) % 360 - 180;
  A.push(pol(aw, rm(aw) + wob(a) * fade));
}
A.push(...[...fo.fil].reverse(), fo.S);
for (const s of [-20, -10, 0, 12]) A.push(along(mOut, nOut, s));
const Lk = L.LAKE;
A.push(along(mOut, nOut, 26), [-153, 124], [-150, 152], [Lk.x - 1, Lk.z - Lk.r - 12], [Lk.x + 4, Lk.z - Lk.r + 4]);
function catmull(P, n = 16) {
  const Q = [P[0], ...P, P[P.length - 1]], out = [];
  for (let i = 1; i < Q.length - 2; i++) { const p0 = Q[i - 1], p1 = Q[i], p2 = Q[i + 1], p3 = Q[i + 2]; for (let k = 0; k < n; k++) { const t = k / n; out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t * t + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t * t * t))); } }
  out.push(Q[Q.length - 2]); return out;
}
const dense = catmull(A);
// resample every ~STEP metres
const STEP = +(process.env.STEP || 14);
const res = [dense[0]]; let acc = 0;
for (let i = 1; i < dense.length; i++) { const d = Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]); acc += d; if (acc >= STEP) { res.push(dense[i]); acc = 0; } }
res.push(dense[dense.length - 1]);
// the first 7 points of the old river stay as they are (falls.js / life.js read indices 0..3); the new path starts at the old end
const full = [...old.slice(0, 5), ...res.map((p) => p.map((v) => +v.toFixed(1)))];
// ---------- checks
const dPoly = (p, poly, closed = true) => { let b = 1e9; const n = poly.length; for (let i = 0; i < (closed ? n : n - 1); i++) { const a = poly[i], c = poly[(i + 1) % n], dx = c[0] - a[0], dz = c[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz))); b = Math.min(b, Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t)); } return b; };
let minRing = 1e9, minRing2 = 1e9, minCit = 1e9;
for (const p of dense) {
  if (L.sdTown(p[0], p[1]) > -6) continue;
  minCit = Math.min(minCit, Math.abs(L.sdPoly(L.OUTER, p[0], p[1])));
  let ua = Math.atan2(p[1], p[0]) / DEG; if (ua > 0) ua -= 360;
  if (ua > unwrapIn - 3 || ua < unwrapOut + 3) continue;                        // the arc proper (not the radial entries across the ring)
  const d2 = dPoly(p, ring2), d1 = dPoly(p, ring); if (d2 < minRing2) { minRing2 = d2; var w2 = [ua, Math.hypot(...p)]; } if (d1 < minRing) { minRing = d1; var w1 = [ua, Math.hypot(...p)]; }
}
console.log('(worst spots: ring2 at', JSON.stringify(typeof w2 !== 'undefined' ? w2.map((v) => +v.toFixed(0)) : null), ' ring at', JSON.stringify(typeof w1 !== 'undefined' ? w1.map((v) => +v.toFixed(0)) : null), ')');
console.log('min clearance (river centre) to ring2', +minRing2.toFixed(1), ' to ring (r<140 only)', +minRing.toFixed(1), ' to the citadel wall', +minCit.toFixed(1), '  need >= 10 (arc)');
// crossings with the cobbled streets and the wall
const inter = (a, b, c, d) => { const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0]; if (Math.abs(den) < 1e-9) return null; const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den, u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den; return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x: a[0] + r[0] * t, z: a[1] + r[1] * t, u, t } : null; };
const bridges = [];
for (const R of ROADS) {
  if (R.name.startsWith('hamlet')) continue;
  for (let i = 0; i < R.pts.length - 1; i++) for (let j = 0; j < dense.length - 1; j++) {
    const x = inter(R.pts[i], R.pts[i + 1], dense[j], dense[j + 1]);
    if (x) { const dx = R.pts[i + 1][0] - R.pts[i][0], dz = R.pts[i + 1][1] - R.pts[i][1], l = Math.hypot(dx, dz), rx = dense[j + 1][0] - dense[j][0], rz = dense[j + 1][1] - dense[j][1], rl = Math.hypot(rx, rz);
      const cosang = Math.abs(dx * rx + dz * rz) / (l * rl);
      bridges.push({ road: R.name, w: R.w, x: +x.x.toFixed(1), z: +x.z.toFixed(1), nx: +(dx / l).toFixed(4), nz: +(dz / l).toFixed(4), skewDeg: +(Math.acos(Math.min(1, cosang)) / DEG).toFixed(0) }); }
  }
}
// also the main streets of the town gates etc. are 'cobble' too; list everything that crosses
console.log('bridges needed:', JSON.stringify(bridges));
// wall crossings
const wall = [];
for (let i = 0; i < T.length; i++) for (let j = 0; j < dense.length - 1; j++) { const x = inter(T[i], T[(i + 1) % T.length], dense[j], dense[j + 1]); if (x) wall.push({ seg: i, x: +x.x.toFixed(1), z: +x.z.toFixed(1), offMid: +Math.hypot(x.x - L.segMid(T, i)[0], x.z - L.segMid(T, i)[1]).toFixed(1) }); }
console.log('wall crossings', JSON.stringify(wall));
let len = 0; for (let i = 0; i < dense.length - 1; i++) len += Math.hypot(dense[i + 1][0] - dense[i][0], dense[i + 1][1] - dense[i][1]);
console.log('river polyline points', full.length, ' total new length', Math.round(len));
fs.writeFileSync('/tmp/cmp/rivertown.json', JSON.stringify({ full, dense, bridges, wall, mid, ring, ring2 }));
// ---------- the code to paste into layout.js
const f1 = (v) => +v.toFixed(1);
const newRiver = full.slice(5).map((p) => '[' + p.map(f1).join(', ') + ']');
const lines = []; for (let i = 0; i < newRiver.length; i += 6) lines.push('    ' + newRiver.slice(i, i + 6).join(', ') + ',');
const skewOf = (b) => b.skewDeg;
const bl = bridges.filter((b) => b.road !== 'farm').map((b) => { const len = Math.max(22, Math.round(17.5 / Math.sin(b.skewDeg * DEG) + 3)); const wid = b.w >= 5.5 ? 7 : 5.5; return `{ x: ${f1(b.x)}, z: ${f1(b.z)}, nx: ${b.nx}, nz: ${b.nz}, len: ${len}, wid: ${wid} }`; });
const wg = wall.map((w) => { const a = T[w.seg], l = Math.hypot(T[(w.seg + 1) % T.length][0] - a[0], T[(w.seg + 1) % T.length][1] - a[1]); return `{ seg: ${w.seg}, c: ${f1(Math.hypot(w.x - a[0], w.z - a[1]))}, half: 6.6 }`; });
fs.writeFileSync('/tmp/cmp/rivertown_code.txt', '// TOWN_RIVER (absolute coordinates; the first two are the old river points 5 and 6 as pushed)\n' + lines.join('\n') + '\n// RBRIDGES (new)\n' + bl.map((s) => '    ' + s + ',').join('\n') + '\n// WGATES\n' + wg.join(',\n') + '\n');
console.log(fs.readFileSync('/tmp/cmp/rivertown_code.txt', 'utf8'));
