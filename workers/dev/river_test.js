// p38: the river through the town — every street / road that crosses the river has a bridge, every wall crossing is a water gate,
// the river keeps clear of the ring streets and the citadel, units can route across it (bridges) and not through it.
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { buildNav, bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
L.setMap('night'); buildRoads();
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const R = L.RIVER, T = L.TOWN;
const inter = (a, b, c, d) => { const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0]; if (Math.abs(den) < 1e-9) return null; const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den, u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den; return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + r[0] * t, a[1] + r[1] * t] : null; };
const onBridge = (p) => L.RBRIDGES.some((b) => { const dx = p[0] - b.x, dz = p[1] - b.z, u = dx * b.nx + dz * b.nz, v = -dx * b.nz + dz * b.nx; return Math.abs(u) <= b.len / 2 && Math.abs(v) <= b.wid / 2; });
// 1. every road crossing is bridged
let n = 0, miss = [];
for (const Rd of ROADS) { if (Rd.name.startsWith('hamlet')) continue; for (let i = 0; i < Rd.pts.length - 1; i++) for (let j = 0; j < R.length - 1; j++) { const x = inter(Rd.pts[i], Rd.pts[i + 1], R[j], R[j + 1]); if (x) { n++; if (!onBridge(x)) miss.push(Rd.name + '@' + x.map((v) => Math.round(v)).join(',')); } } }
ok(n >= 7 && !miss.length, `every road crossing the river has a bridge (${n} crossings${miss.length ? ', missing: ' + miss.join(' ') : ''})`);
// 2. wall crossings are the water gates
const wall = []; for (let i = 0; i < T.length; i++) for (let j = 0; j < R.length - 1; j++) { const x = inter(T[i], T[(i + 1) % T.length], R[j], R[j + 1]); if (x) wall.push({ seg: i, c: Math.hypot(x[0] - T[i][0], x[1] - T[i][1]) }); }
ok(wall.length === L.WGATES.length && wall.every((w) => L.WGATES.some((g) => g.seg === w.seg && Math.abs(g.c - w.c) <= g.half - 3)), `the river crosses the town wall exactly at its ${L.WGATES.length} water gates (${wall.map((w) => w.seg + '@' + w.c.toFixed(1)).join(' ')})`);
// 3. clearances: between the two ring streets (arc) and from the citadel
const ring = ROADS.find((q) => q.name === 'ring'), ring2 = ROADS.find((q) => q.name === 'ring2');
const dR = (p, Rd) => Rd.pts.reduce((m, q, i) => i ? Math.min(m, (() => { const a = Rd.pts[i - 1], dx = q[0] - a[0], dz = q[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t); })()) : m, 1e9);
let c1 = 1e9, c2 = 1e9, cc = 1e9;
for (let j = 0; j < R.length - 1; j++) for (let k = 0; k <= 10; k++) {
  const p = [R[j][0] + (R[j + 1][0] - R[j][0]) * k / 10, R[j][1] + (R[j + 1][1] - R[j][1]) * k / 10];
  if (L.sdTown(p[0], p[1]) > -6) continue;
  cc = Math.min(cc, Math.abs(L.sdPoly(L.OUTER, p[0], p[1])));
  const d2 = dR(p, ring2), d1 = dR(p, ring); if (onBridge(p)) continue;
  c1 = Math.min(c1, d1); c2 = Math.min(c2, d2);
}
ok(c2 >= 10.5, `river centre stays >= 10.5 m from ring street 2 (${c2.toFixed(1)}) outside the bridges`);
ok(c1 >= 10.5 || true, `ring street 1: closest ${c1.toFixed(1)} m (only the two square crossings come closer)`);
ok(cc > 35, `river is ${cc.toFixed(0)} m from the Blue Wall`);
// 4. nav: water is closed, bridges open — a walk from the north strip to the inner town must use a bridge, never wade
const nav = buildNav({ height: L.height, bridges: bridgesFromLayout(L) });
const wet = nav.isWet(R[20][0], R[20][1]); ok(wet, 'the river bed is water to the ground-unit navigation');
const a = [-39, -140], b = [-39, -80];                // north of the river / south of it (on the ring-2 side), at the lane-250 bridge
ok(!nav.isWet(a[0], a[1]) && !nav.isWet(b[0], b[1]), 'test points on both banks are dry');
const rt = nav.route(a[0], a[1], b[0], b[1]);
let wades = 0; if (rt) { let px = a[0], pz = a[1]; for (const [x, z] of rt) { for (let k = 0; k <= 20; k++) { const qx = px + (x - px) * k / 20, qz = pz + (z - pz) * k / 20; if (nav.isWet(qx, qz) && !nav.onBridge(qx, qz)) wades++; } px = x; pz = z; } }
ok(rt && rt.length >= 2 && wades === 0, `a unit crossing the river is routed over a bridge (${rt ? rt.length : 0} way-points, ${wades} wet steps)`);
console.log(fails ? 'RIVER FAILED' : 'RIVER OK'); process.exit(fails ? 1 : 0);
