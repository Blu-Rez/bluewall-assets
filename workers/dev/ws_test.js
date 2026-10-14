// ws_test.js — the worksites (layout.js WS_SITES) must stand on sane ground: off the town, the river, the lake, the roads, the hamlets, the mines and each other; flat under the pad; the haul road reaches the site.
import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS } from '../bot/bluebot_v2/bluewall/client/src/roads.js';
import { hamlets } from '../bot/bluebot_v2/bluewall/client/src/hamlets.js';
import { nomads } from '../bot/bluebot_v2/bluewall/client/src/nomads.js';
import { sites, pieces, counts, wsLevel, WS_KINDS } from '../bot/bluebot_v2/bluewall/client/src/worksites.js';
L.setMap('night'); buildRoads();
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } else console.log('ok  ', m); };
const S = sites(); ok(S.length === 12, 'twelve sites');
for (const s of S) {
  const hs = []; for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [.7, .7], [-.7, -.7]]) hs.push(L.height(s.x + dx * s.r * 0.7, s.z + dz * s.r * 0.7));
  const spread = Math.max(...hs) - Math.min(...hs);
  if (s.kind === 'fishery') {            // the shore side dips into the water by design: the inland half must be level, the middle dry
    const fx = Math.sin(s.ry), fz = Math.cos(s.ry), back = [[0, 0], [-1, 0], [0, -1]].map(([a, b]) => L.height(s.x - fx * 8 * (a + b < 0 ? 1 : 0.2) + (b ? -fz * 6 : 0), s.z - fz * 8 * (a + b < 0 ? 1 : 0.2) + (b ? fx * 6 : 0)));
    ok(Math.max(...back) - Math.min(...back) < 2.0 && L.height(s.x, s.z) > 0.4, `${s.id}: dry, level inland half (${(Math.max(...back) - Math.min(...back)).toFixed(2)} m)`);
  } else {
    ok(spread < 1.3, `${s.id}: level pad (spread ${spread.toFixed(2)} m)`);
    ok(Math.min(...hs) > -0.2, `${s.id}: dry (min ${Math.min(...hs).toFixed(2)})`);
  }
  ok(L.sdTown(s.x, s.z) > 46, `${s.id}: outside the town`);
  ok(L.distPolyline(L.RIVER, s.x, s.z) > s.r * 0.72 + 4 || s.kind === 'lumber', `${s.id}: off the river bed`);
  const rd = ROADS.filter((q) => q.name !== 'ws_' + s.id && !/^ws_/.test(q.name)).map((q) => { let d = 1e9; for (let i = 0; i < q.pts.length - 1; i++) { const a = q.pts[i], b = q.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((s.x - a[0]) * dx + (s.z - a[1]) * dz) / l2)); d = Math.min(d, Math.hypot(s.x - a[0] - dx * t, s.z - a[1] - dz * t)); } return d; });
  ok(Math.min(...rd) > (s.kind === 'fishery' ? 7 : 9), `${s.id}: off the country roads (${Math.min(...rd).toFixed(0)} m)`);
  ok(ROADS.some((q) => q.name === 'ws_' + s.id), `${s.id}: has its haul road`);
  for (const h of hamlets()) if (Math.hypot(h.x - s.x, h.z - s.z) < s.r + 18) ok(false, `${s.id}: clear of hamlet`);
  for (const M of L.MINES) if (Math.hypot(M.x - s.x, M.z - s.z) < s.r + 40) ok(false, `${s.id}: clear of the ${M.id} mine`);
  for (const t of S) if (t !== s && Math.hypot(t.x - s.x, t.z - s.z) < t.r + s.r + 6) ok(false, `${s.id} / ${t.id}: overlap`);
  for (const lv of [1, 5, 12, 30]) { const k = WS_KINDS[s.kind], l = wsLevel(s, lv); if (l > 0) { const n = pieces(s, l).length; if (n < 3) ok(false, `${s.id}: lv ${lv} has ${n} pieces`); } }
  const a = pieces(s, 1).length, b = pieces(s, 30).length; ok(b > a, `${s.id}: more pieces at 30 (${b}) than at 1 (${a})`);
}
for (const q of ROADS.filter((r) => /^ws_/.test(r.name))) { const s = S.find((t) => 'ws_' + t.id === q.name); const e = q.pts[q.pts.length - 1]; ok(Math.hypot(e[0] - s.x, e[1] - s.z) < s.r, `${q.name}: ends inside the site`); }
// unlock + counts grow with level
for (const k of Object.keys(WS_KINDS)) { const s = S.find((t) => t.kind === k); const c1 = counts(s, 1), c30 = counts(s, 30); const grows = Object.keys(c30).every((key) => c30[key] >= (c1[key] ?? 0)) && Object.keys(c30).some((key) => c30[key] > (c1[key] ?? 0)); ok(grows, `${k}: workers / animals / boats grow with the level (${JSON.stringify(c1)} -> ${JSON.stringify(c30)})`); ok(wsLevel(s, WS_KINDS[k].unlock - 1) === 0 || WS_KINDS[k].unlock === 1, `${k}: locked below level ${WS_KINDS[k].unlock}`); }
console.log(bad ? `WS FAIL (${bad})` : 'WS OK');
