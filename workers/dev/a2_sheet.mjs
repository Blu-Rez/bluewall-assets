// candidate courses for the sample sheet -> work/a2/courses.json (2D polyline + ground height + pixel in the owner's camera)
import fs from 'fs';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { makeCam } from '/home/claude/dev/a2_cam.mjs';
L.setMap('night'); const cam = makeCam();
// Catmull-Rom through the via points, resampled every ~12 m
function smooth(vp, step = 12) {
  const P = [vp[0], ...vp, vp[vp.length - 1]], out = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]], n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((c) => 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); }
  }
  out.push(vp[vp.length - 1]); return out;
}
const C = {
  A: [[-158, -452], [-157, -405], [-146, -376], [-128, -356], [-112, -336], [-106, -312], [-103, -288], [-97, -262], [-90, -232], [-82, -205], [-76, -180]],
  D: [[-158, -452], [-157, -405], [-142, -372], [-118, -352], [-86, -345], [-52, -343], [-18, -338], [12, -326], [40, -298], [66, -268], [84, -236], [93, -200], [97, -168], [99, -143]],
};
const out = {};
for (const [k, vp] of Object.entries(C)) {
  const pts = smooth(vp);
  { const a = pts[pts.length - 2], b = pts[pts.length - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / l, dz = (b[1] - a[1]) / l; let q = b.slice(); for (let i = 0; i < 40 && L.sdTown(q[0], q[1]) > 13.5; i++) { q = [q[0] + dx * 2, q[1] + dz * 2]; } pts.push(q); }   // run on until the moat's centre line
  out[k] = pts.map(([x, z]) => { const h = L.height(x, z), p = cam.proj(x, Math.max(h, 0) + 1, z); return { x, z, h, px: p[0], py: p[1] }; });
  // clearances to the records
  const rec = [['CAMP', L.CAMP, (L.CAMP.fr ?? L.CAMP.r)], ['PASTURE', L.PASTURE, 40], ['LAIR', L.LAIR, 24]];
  const cl = [];
  for (const [n, o, r] of rec) cl.push([n, Math.min(...pts.map(([x, z]) => Math.hypot(x - o.x, z - o.z) - r)).toFixed(0)]);
  for (const m of L.MINES) cl.push([m.id, Math.min(...pts.map(([x, z]) => Math.hypot(x - m.x, z - m.z) - 45)).toFixed(0)]);
  for (const s of L.SITES) cl.push([s.id, Math.min(...pts.map(([x, z]) => Math.hypot(x - s.x, z - s.z) - s.r)).toFixed(0)]);
  { const H = JSON.parse(fs.readFileSync('/home/claude/work/a2/map.json')); for (const h of [...H.HAMLETS.map((q) => ['ham', q]), ...H.NOMADS.map((q) => ['nom', q])]) { const m = Math.min(...pts.map(([x, z]) => Math.hypot(x - h[1].x, z - h[1].z) - (h[1].r || 20))); cl.push([h[0] + '@' + Math.round(h[1].x) + ',' + Math.round(h[1].z) + ' centre-dist', (m + (h[1].r || 20)).toFixed(0)]); } }
  console.log(k, 'len', pts.reduce((a, p, i) => i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0).toFixed(0), 'm; clearance (m) to record edges:', cl.filter(([n, v]) => +v < (n.includes('centre') ? 45 : 80)).map(([n, v]) => n + ' ' + v).join(', '));
  console.log('   ground h along: ', out[k].filter((_, i) => i % 3 === 0).map((p) => p.h.toFixed(0)).join(' '));
  console.log('   sdTown at end:', L.sdTown(...pts[pts.length - 1]).toFixed(1), ' water at end? h=', L.height(...pts[pts.length - 1]).toFixed(2));
}
fs.writeFileSync('/home/claude/work/a2/courses.json', JSON.stringify(out));
