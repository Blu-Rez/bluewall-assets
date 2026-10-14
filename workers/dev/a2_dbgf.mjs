import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
L.setMap('night'); buildRoads(); console.log(JSON.stringify(globalThis.__F, null, 0).replace(/,/g, ',\n'));
