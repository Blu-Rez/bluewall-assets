import { planArmy } from '/home/claude/bot/bluebot_v2/bluewall/client/src/armyplan.js';
import fs from 'fs';
const d = JSON.parse(fs.readFileSync('/tmp/claude-0/-home-claude/98a5106a-bbfc-5d79-8653-860351b4443e/scratchpad/state30.json'));
const army = d.army.army; let n = 0; for (const k in army) n += army[k];
const p = planArmy(army, 2, true);
console.log('owner max army', n, 'units', p.types.length, 'types; back1', p.back1.toFixed(1), 'lat', p.lat0.toFixed(1), p.lat1.toFixed(1), 'shelves', p.shelves.map(s => [s.blocks.length, Math.round(s.w), Math.round(s.depth)]).join(' | '));
for (const [name, a] of [['small', { spear: 30, sword: 20, archer: 20, cavalry: 8 }], ['mid', { spear: 60, sword: 40, archer: 40, cavalry: 15, giant: 3, dragon: 1, catapult: 4, mage: 8 }]]) { const q = planArmy(a, 2, true); console.log(name, 'back1', q.back1.toFixed(1), 'lat', q.lat0.toFixed(1), q.lat1.toFixed(1), 'shelves', q.shelves.length); }
