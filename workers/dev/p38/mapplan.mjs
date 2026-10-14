// mapplan.mjs — dumps the whole valley (height, forest density, roads, features) for planning the worksites
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { forestDensity } from '/home/claude/bot/bluebot_v2/bluewall/client/src/terrain.js';
import { hamlets } from '/home/claude/bot/bluebot_v2/bluewall/client/src/hamlets.js';
import { nomads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nomads.js';
import fs from 'fs';
L.setMap('night'); buildRoads();
const N = 130, S = 560, step = (2 * S) / N, H = [], F = [];
for (let j = 0; j < N; j++) { const rh = [], rf = []; for (let i = 0; i < N; i++) { const x = -S + i * step, z = -S + j * step; rh.push(+L.height(x, z).toFixed(1)); rf.push(+forestDensity(x, z).toFixed(2)); } H.push(rh); F.push(rf); }
fs.writeFileSync('/tmp/cmp/mapplan.json', JSON.stringify({ S, N, H, F, town: L.TOWN, outer: L.OUTER, river: L.RIVER, lake: L.LAKE, mines: L.MINES, mount: L.MOUNT, windmill: L.WINDMILL, farms: L.FARMS, pasture: L.PASTURE, camp: L.CAMP, muster: L.MUSTER, lair: L.LAIR, roads: ROADS.map((r) => ({ n: r.name, k: r.kind, w: r.w, p: r.pts })), ham: hamlets().map((h) => ({ x: h.x, z: h.z })), nom: nomads().map((c) => ({ x: c.x, z: c.z })) }));
console.log('ok', ROADS.length, 'roads', hamlets().length, 'ham', nomads().length, 'nomad');
