import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { layoutFromGame } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_layout.js';
import { planTownSteps } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_townplan.js';
L.setMap('night');
const lay = layoutFromGame(), it = planTownSteps(lay), ts = []; let tot = 0;
for (;;) { const t = performance.now(); const d = it.step(); const dt = performance.now() - t; ts.push(dt); tot += dt; if (d) break; }
console.log('COLD SLICED: steps', ts.length, 'longest', Math.max(...ts).toFixed(1), 'ms, total', tot.toFixed(0), 'ms, top5', ts.slice().sort((a, b) => b - a).slice(0, 5).map((v) => v.toFixed(1)).join(' '));
