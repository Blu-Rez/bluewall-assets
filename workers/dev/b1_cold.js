import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { layoutFromGame } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_layout.js';
import { planTownFull } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_townplan.js';
L.setMap('night');
const lay = layoutFromGame();
const t0 = performance.now(); const full = planTownFull(lay); console.log('cold', (performance.now() - t0).toFixed(1), JSON.stringify(full.meta.lap, (k, v) => typeof v === 'number' ? +v.toFixed(1) : v));
