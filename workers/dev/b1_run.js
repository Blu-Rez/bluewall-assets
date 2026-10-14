import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { layoutFromGame, perturbLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_layout.js';
import { planTownFull, planTown, KINDS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_townplan.js';
import fs from 'fs';
L.setMap('night');
const lay = layoutFromGame();
const t0 = performance.now(); const full = planTownFull(lay); const ms = performance.now() - t0;
console.log('cold ms', ms.toFixed(1), 'records', full.list.length, JSON.stringify(full.meta.counts));
console.log('lap', JSON.stringify(full.meta.lap, (k, v) => typeof v === 'number' ? +v.toFixed(1) : v));
console.log('warnings', JSON.stringify(full.meta.warnings));
for (let k = 0; k < 3; k++) { const L2 = perturbLayout(lay, { rotDeg: 1 + k }); const t1 = performance.now(); planTownFull(L2); console.log('warm run', k, (performance.now() - t1).toFixed(1), 'ms'); }
fs.writeFileSync('/home/claude/work/b1/plan30.json', JSON.stringify({ lay, list: full.list, meta: full.meta, kinds: KINDS }));
