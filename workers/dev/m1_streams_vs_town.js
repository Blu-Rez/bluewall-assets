// merge-chat check: do A2's mountain streams (layout.STREAMS) touch the town band / B1's planned lots?
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { layoutFromGame } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_layout.js';
import { planTownFull } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_townplan.js';
L.setMap('night');
const lay = layoutFromGame();
const plan = planTownFull(lay); const list = (plan.list || plan.records || plan).filter ? (plan.list || plan.records || plan) : [];
const pip = (poly, x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
console.log('streams:', L.STREAMS.map((s) => s.id + ' k=' + s.k + ' pts=' + s.pts.length).join(', '));
// 1) stream points inside the TOWN polygon (town wall) and inside the citadel moat band
for (const S of L.STREAMS) {
  const inside = S.pts.filter((p) => pip(L.TOWN, p[0], p[1]));
  console.log(S.id, 'points inside the town wall polygon:', inside.length, 'of', S.pts.length, inside.length ? '  first inside: ' + JSON.stringify(inside[0]) + '  last pt ' + JSON.stringify(S.pts[S.pts.length - 1]) : '');
}
// 2) B1's lots vs the stream beds (effective distance = distance / k; water half 5, quay 5.5, B1's own river clearance 8)
let n = 0, wet = 0, quay = 0, clr = 0, worst = 1e9, worstRec = null;
for (const r of list) {
  if (r.x == null) continue; n++;
  const c = Math.cos(r.ry || 0), s = Math.sin(r.ry || 0), hw = (r.w || 0) / 2, hd = (r.d || 0) / 2; let m = 1e9;
  for (let a = -1; a <= 1; a += 0.25) for (let b = -1; b <= 1; b += 0.25) { const x = r.x + a * hw * c + b * hd * s, z = r.z - a * hw * s + b * hd * c; m = Math.min(m, L.streamD(x, z)); }
  if (m < worst) { worst = m; worstRec = r; }
  if (m < 5) wet++; else if (m < 5.5) quay++; else if (m < 8) clr++;
}
console.log('B1 records checked:', n, '| lot touches stream water (<5):', wet, '| on the quay (5-5.5):', quay, '| inside B1 river clearance 8 m (5.5-8):', clr);
console.log('closest lot to any stream (effective distance m):', worst.toFixed(1), worstRec && (worstRec.kind + ' ' + worstRec.id + ' @ ' + worstRec.x.toFixed(0) + ',' + worstRec.z.toFixed(0)));
// 3) the town-wall crossing: min distance of the streams to the town polygon edges
let md = 1e9; for (const S of L.STREAMS) for (const p of S.pts) { for (let i = 0; i < L.TOWN.length; i++) { const a = L.TOWN[i], b = L.TOWN[(i + 1) % L.TOWN.length]; const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz))); md = Math.min(md, Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t)); } }
console.log('closest stream point to the town wall line: ' + md.toFixed(1) + ' m');
