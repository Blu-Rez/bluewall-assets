import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { nomads, keepClear } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nomads.js';
import { hamlets } from '/home/claude/bot/bluebot_v2/bluewall/client/src/hamlets.js';
L.setMap('night'); buildRoads();
const P = nomads(); let bad = [];
if (P.length < 4 || P.length > 6) bad.push('camps ' + P.length);
for (const C of P) {
  if (C.tents.length < 3 || C.tents.length > 6) bad.push('tents ' + C.tents.length);
  for (const Z of [L.CAMP, L.MUSTER, L.PASTURE, L.LAIR]) if (Math.hypot(C.x - Z.x, C.z - Z.z) < Z.r + 26) bad.push('zone');
  for (const H of hamlets()) if (Math.hypot(C.x - H.x, C.z - H.z) < 50) bad.push('hamlet');
  if (L.sdTown(C.x, C.z) < 50) bad.push('town');
  for (const T of C.tents) if (keepClear(T.x, T.z, 0)) bad.push('tent in keep-clear');
}
if (!keepClear(L.CAMP.x, L.CAMP.z) || !keepClear(L.MUSTER.x, L.MUSTER.z) || keepClear(0, 0)) bad.push('keepClear');
// deterministic: a second plan call returns the very same camps
const again = JSON.stringify(P.map((c) => [Math.round(c.x * 10), Math.round(c.z * 10), c.tents.length]));
console.log(JSON.stringify({ camps: P.length, tents: P.reduce((n, c) => n + c.tents.length, 0), plan: again.length }));
if (bad.length) { console.log('BAD', bad.join(',')); process.exit(1); }
console.log('NOMADS OK');
