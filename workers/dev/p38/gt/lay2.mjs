import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS, roadDist } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
L.setMap('night'); buildRoads();
console.log('sdTown center', L.sdTown(0,0).toFixed(1), 'at gate', L.sdTown(136.8,68.5).toFixed(1), 'out 30', L.sdTown(136.8+0.9*30,68.5+0.4*30).toFixed(1));
console.log('fieldD', L.fieldD(0,0).toFixed(1), L.fieldD(235,10).toFixed(1), 'FIELDS', JSON.stringify(L.FIELDS));
console.log('MOAT.level', L.MOAT.level, 'WALL', JSON.stringify(L.WALL.town));
for (const d of [10,20,40,60,80]) { const x=136.8+0.9*d, z=68.5+0.4*d; console.log('d', d, 'h', L.height(x,z).toFixed(1), 'road', roadDist(x,z).toFixed(1), 'sd', L.sdTown(x,z).toFixed(1)); }
console.log(ROADS.map(r=>r.name+':'+r.w).join(' '));
