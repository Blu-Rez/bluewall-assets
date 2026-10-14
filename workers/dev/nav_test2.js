import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { ROADS, buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
buildRoads();
const farm = ROADS.find((r) => r.name === 'farm'); console.log('farm', JSON.stringify(farm.pts.map((p) => p.map((v) => +v.toFixed(0)))));
// walk along the road and print terrain height + distance to river
for (let i = 0; i < farm.pts.length - 1; i++) {
  const a = farm.pts[i], b = farm.pts[i + 1], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3);
  for (let k = 0; k <= n; k++) { const t = k / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, h = L.height(x, z); if (h < 0.4) console.log('seg', i, 'x', x.toFixed(1), 'z', z.toFixed(1), 'h', h.toFixed(2), 'rd', L.distPolyline(L.RIVER, x, z).toFixed(1)); }
}
for (const R of ROADS) { let wet = 0, tot = 0; for (let i = 0; i < R.pts.length - 1; i++) { const a = R.pts[i], b = R.pts[i + 1], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3); for (let k = 0; k <= n; k++) { const t = k / n; if (L.height(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t) < -0.42) wet++; tot++; } } if (wet) console.log('road', R.name, 'wet samples', wet, '/', tot); }
