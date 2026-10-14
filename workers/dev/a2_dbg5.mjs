import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { planHamlets } from '/home/claude/dev/a2_dbg_hamlets_copy.mjs';
L.setMap('night');
if (process.env.A2_NOSTREAMS) L.STREAMS.length = 0;
buildRoads();
const roads = ROADS.filter((q) => !/^hamlet|^ws_/.test(q.name));
const P = L.withoutPads(() => planHamlets(roads));
console.log('PLAN', P.map((H) => Math.round(H.x) + ',' + Math.round(H.z)).join(' '));
