import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, roadDist } from '../bot/bluebot_v2/bluewall/client/src/roads.js';
L.setMap('night'); buildRoads();
for (const [gi, G] of L.TGATES.entries()) {
  const tx = -G.nz, tz = G.nx, rej = {}; let tot = 0, ok = 0;
  for (let d = 16; d <= 70; d += 3) for (let l = -48; l <= 48; l += 3) {
    const x = G.x + G.nx * d + tx * l, z = G.z + G.nz * d + tz * l; tot++;
    const h = L.height(x, z); let r = null;
    if (!(h > L.MOAT.level + 1.1)) r = 'wet'; else { const e = 2.2; if (Math.max(Math.abs(L.height(x + e, z) - h), Math.abs(L.height(x - e, z) - h), Math.abs(L.height(x, z + e) - h), Math.abs(L.height(x, z - e) - h)) > 1.0) r = 'slope'; }
    if (!r && roadDist(x, z) < 3.4) r = 'road'; if (!r && L.sdTown(x, z) < 16) r = 'town';
    if (!r && L.MUSTER && Math.hypot(x - L.MUSTER.x, z - L.MUSTER.z) < L.MUSTER.fr + 8) r = 'muster';
    if (!r) for (const P of L.PADS) if (Math.hypot(x - P.x, z - P.z) < P.r + 6) { r = 'pad'; break; }
    if (!r && L.FIELDS && L.fieldD(x, z) < 6) r = 'field';
    if (!r) ok++; else rej[r] = (rej[r] || 0) + 1;
  }
  console.log('gate', gi, 'cells', tot, 'free', ok, JSON.stringify(rej));
}
