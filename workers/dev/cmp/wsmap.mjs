import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { hamlets } from '/home/claude/bot/bluebot_v2/bluewall/client/src/hamlets.js';
import { nomads, planNomads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nomads.js';
import fs from 'fs';
L.setMap('night'); buildRoads(); try { planNomads(ROADS); } catch (e) {}
const R = 500, st = 5, n = (2 * R) / st + 1, g = [];
for (let j = 0; j < n; j++) { const row = []; for (let i = 0; i < n; i++) row.push(+L.height(-R + i * st, -R + j * st).toFixed(1)); g.push(row); }
const out = { R, st, g,
  town: L.TOWN, outer: L.OUTER, farms: L.FARMS.map((F) => ({ x: F.x, z: F.z, w: F.w, d: F.d, rot: F.rot })), lake: L.LAKE, river: L.RIVER, windmill: L.WINDMILL, pasture: L.PASTURE, camp: L.CAMP, muster: L.MUSTER, lair: L.LAIR,
  mines: L.MINES, mount: L.MOUNT, hamlets: hamlets().map((H) => ({ x: H.x, z: H.z, r: H.r })), nomads: nomads().map((C) => ({ x: C.x, z: C.z, r: C.r })),
  roads: ROADS.map((r) => ({ name: r.name, kind: r.kind, w: r.w, pts: r.pts })), stable: (L.stableAt && L.stableAt()) ? { x: L.stableAt().x, z: L.stableAt().z } : null, rbridges: L.RBRIDGES };
const G = L.GATE, ring = ROADS.find((r) => r.name === 'ring'); let mk = null, bd = 1e9; const ga = Math.atan2(G.nz, G.nx);
for (let i = 0; i < ring.pts.length - 1; i++) for (let t = 0; t <= 1; t += 0.05) { const x = ring.pts[i][0] + (ring.pts[i + 1][0] - ring.pts[i][0]) * t, z = ring.pts[i][1] + (ring.pts[i + 1][1] - ring.pts[i][1]) * t; let da = Math.atan2(z, x) - ga; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da))); if (da < bd) { bd = da; mk = { x, z, r: 15 }; } }
out.market = mk; out.gate = { x: G.x, z: G.z, nx: G.nx, nz: G.nz }; out.tgates = L.TGATES.map((g) => ({ x: g.x, z: g.z, nx: g.nx, nz: g.nz }));
out.vaults = [[-30, 30], [30, 31], [-60, 36]].map(([s, d]) => ({ x: G.x + G.nx * d + (-G.nz) * s, z: G.z + G.nz * d + G.nx * s }));
fs.writeFileSync('/tmp/cmp/wsmap.json', JSON.stringify(out));
console.log('ok', n, 'roads', out.roads.length, 'hamlets', out.hamlets.length, 'nomads', out.nomads.length, 'mines', JSON.stringify(L.MINES.map((m) => [m.id, Math.round(m.x), Math.round(m.z)])));
