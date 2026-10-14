// dump the real terrain (layout.height) + every map record that a stream must respect -> work/a2/map.bin + map.json
import fs from 'fs';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { hamlets } from '/home/claude/bot/bluebot_v2/bluewall/client/src/hamlets.js';
import { nomads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nomads.js';
L.setMap('night'); buildRoads();
const R = 640, STEP = 4, n = Math.round(2 * R / STEP) + 1, buf = new Float32Array(n * n);
for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) buf[j * n + i] = L.height(-R + i * STEP, -R + j * STEP);
fs.writeFileSync('/home/claude/work/a2/map.bin', Buffer.from(buf.buffer));
const moat2 = []; // moat ring centre line: sdTown = MOAT2.off
const json = { R, STEP, n, LV: L.MOAT.level, MOUNT: L.MOUNT, TOWN: L.TOWN, OUTER: L.OUTER, MOAT2: L.MOAT2, RIVER: L.RIVER, WGATES: L.WGATES, RBRIDGES: L.RBRIDGES, KEEP: L.KEEP,
  ROADS: ROADS.map((r) => ({ name: r.name, w: r.w, pts: r.pts, closed: !!r.closed })), MINES: L.MINES, SITES: L.SITES, CAMP: L.CAMP, PASTURE: L.PASTURE, MUSTER: L.MUSTER, LAIR: L.LAIR, LAKE: L.LAKE, FIELDS: L.FIELDS, FIELDS2: L.FIELDS2, WINDMILL: L.WINDMILL,
  HAMLETS: hamlets().map((h) => ({ x: h.x, z: h.z, r: h.r, n: h.houses ? h.houses.length : 0 })), NOMADS: (nomads() || []).map((h) => ({ x: h.x, z: h.z, r: h.r })), TGATES: L.TGATES };
fs.writeFileSync('/home/claude/work/a2/map.json', JSON.stringify(json));
console.log('dumped', n, 'x', n, 'hamlets', json.HAMLETS.length, 'nomads', json.NOMADS.length, 'roads', json.ROADS.length, 'bridges', L.RBRIDGES.length);
