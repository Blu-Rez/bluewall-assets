import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildNav, bridgesFromLayout } from '../bot/bluebot_v2/bluewall/client/src/nav.js';
import { staticSolids } from '../bot/bluebot_v2/bluewall/client/src/solids.js';
L.setMap('night');
const nav = buildNav({ height: L.height, bridges: bridgesFromLayout(L), solids: staticSolids() });
console.log('bridges', nav.bridges.length);
const goals = [[-94, 181], [-125, 107], [141, -63], [115, -119], [-74, 137], [30, -225], [138, -260], [10, 155], [-145, 65], [37, -42]];
for (const g of goals) { const a = nav.route(272, 76, g[0], g[1]), b = nav.route(-21, -20, g[0], g[1]); console.log(g.join(','), 'region', nav.regionOf(g[0], g[1]), 'wet', nav.isWet(g[0], g[1]), 'blocked', nav.isBlocked(g[0], g[1]), 'solid', nav.isSolid && nav.isSolid(g[0], g[1]), 'muster->', a ? a.length : 'NONE', 'keep->', b ? b.length : 'NONE'); }
