// AN1_R3: node check of the two unbridged river crossings on the cart roads (148,74) and (-148,-82): which water, which road, which bridges exist
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { ROADS, buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
buildRoads();
const P = [[148.4, 74.3], [-148.1, -82.4], [-100.2, 70.1], [-132.3, 271.9]];
for (const [x, z] of P) {
  const out = { at: [x, z], h: +L.height(x, z).toFixed(2), river: +L.distPolyline(L.RIVER, x, z).toFixed(1), streams: (L.STREAMS || []).map((S, i) => [i, +L.distPolyline(S.pts, x, z).toFixed(1)]).filter((a) => a[1] < 40) };
  out.moat = L.MOAT && L.MOAT.on ? L.MOAT.level : null;
  out.rb = (L.RBRIDGES || []).map((b) => [b.x, b.z, b.len, b.wid, +Math.hypot(b.x - x, b.z - z).toFixed(1)]).sort((a, b) => a[4] - b[4]).slice(0, 2);
  out.roads = ROADS.map((r) => { let best = 1e9, bi = -1; for (let i = 0; i < r.pts.length - 1; i++) { const a = r.pts[i], b = r.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)), d = Math.hypot(x - a[0] - dx * u, z - a[1] - dz * u); if (d < best) { best = d; bi = i; } } return [r.name, bi, +best.toFixed(1), r.pts.length, r.pts[0].map((v) => +v.toFixed(0))]; }).filter((a) => a[2] < 25);
  console.log(JSON.stringify(out));
}
console.log('river pts', L.RIVER.length, 'first', JSON.stringify(L.RIVER.slice(0, 3)), 'last', JSON.stringify(L.RIVER.slice(-2)));
console.log('RBRIDGES', (L.RBRIDGES || []).length, (L.RBRIDGES || []).map((b) => [b.x, b.z]).join(' | '));
