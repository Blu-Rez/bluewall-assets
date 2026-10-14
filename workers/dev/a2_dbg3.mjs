import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import fs from 'fs';
L.setMap('night'); buildRoads();
const base = JSON.parse(fs.readFileSync('/home/claude/dev/a2_records_base.json', 'utf8'));
// hamlet spurs need links: recompute from the roads like hamlets.js does, using the frozen base hamlets (links from a2_dbg run printed earlier)
const links = { '-258,-86': [-213, -58], '139,-162': [162, -177], '-100,182': [-134, 195], '-42,233': [-131, 202], '39,-226': [126, -237], '188,-63': [223, -55], '-216,-165': [-184, -156], '-241,142': [-255, 95] };
for (const S of L.STREAMS) {
  const dist = (x, z) => { let d = 1e9; for (let i = 0; i < S.pts.length - 1; i++) { const a = S.pts[i], b = S.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); d = Math.min(d, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); } return d / (S.k || 1); };
  for (const h of base.HAMLETS) { const k = Math.round(h.x) + ',' + Math.round(h.z), lk = links[k]; let ds = 1e9; if (lk) for (let t = 0.1; t <= 1; t += 0.15) ds = Math.min(ds, dist(h.x + (lk[0] - h.x) * t, h.z + (lk[1] - h.z) * t)); console.log(S.id, 'hamlet', k, 'centre', dist(h.x, h.z).toFixed(0), '(>=28)', 'spur', ds.toFixed(0), '(>=14)'); }
  for (const n of base.NOMADS) console.log(S.id, 'nomad', Math.round(n.x) + ',' + Math.round(n.z), 'scaled dist', dist(n.x, n.z).toFixed(0), '(>=24)');
}
