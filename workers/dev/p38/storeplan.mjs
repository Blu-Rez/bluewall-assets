import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { planStores } from '/home/claude/bot/bluebot_v2/bluewall/client/src/stores.js';
import { planVaults } from '/home/claude/bot/bluebot_v2/bluewall/client/src/vault.js';
import fs from 'fs';
L.setMap('night'); buildRoads();
const S = planStores(); console.log(S.map((s) => `${s.id} (${s.x.toFixed(0)},${s.z.toFixed(0)}) ry ${s.ry.toFixed(2)} r_from_centre ${Math.hypot(s.x, s.z).toFixed(0)}`).join('\n'));
console.log('vaults', planVaults().map((v) => `${v.id} (${v.x.toFixed(0)},${v.z.toFixed(0)})`).join(' '));
fs.writeFileSync('/tmp/cmp/storeplan.json', JSON.stringify({ stores: S, vaults: planVaults() }));
