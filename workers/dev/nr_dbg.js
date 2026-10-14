import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildNav, bridgesFromLayout } from '../bot/bluebot_v2/bluewall/client/src/nav.js';
import { staticSolids } from '../bot/bluebot_v2/bluewall/client/src/solids.js';
L.setMap('night');
const nav = buildNav({ height: L.height, bridges: bridgesFromLayout(L), solids: staticSolids() });
const cx = +process.argv[2], cz = +process.argv[3], R = +(process.argv[4] || 40);
for (let z = cz - R; z <= cz + R; z += 3) { let row = ''; for (let x = cx - R * 1.6; x <= cx + R * 1.6; x += 2.4) row += Math.hypot(x - cx, z - cz) < 1.8 ? 'X' : nav.onBridge(x, z) ? 'B' : nav.isWet(x, z) ? '~' : nav.isBlocked && nav.isBlocked(x, z) ? '#' : '.'; console.log(row); }
for (const s of [[272, 76], [136, 68], [200, -60], [120, -60]]) { const r = nav.route(s[0], s[1], cx, cz); console.log('route from', s.join(','), r ? r.length + ' pts' : 'NONE'); }
