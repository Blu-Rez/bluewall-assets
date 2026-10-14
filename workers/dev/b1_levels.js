// b1_levels.js — counts per kind at levels 1/5/10/15/20/25/30 (prints a markdown table)
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { layoutFromGame } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_layout.js';
import { planTown, KINDS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_townplan.js';
L.setMap('night');
const lay = layoutFromGame(), LV = [1, 3, 6, 10, 15, 20, 25, 30];
const rows = LV.map((lv) => { const p = planTown(lay, lv), c = {}; for (const r of p) c[r.kind] = (c[r.kind] || 0) + 1; return [lv, c, p.length]; });
console.log('| kind | fa | ' + LV.map((l) => 'L' + l).join(' | ') + ' |'); console.log('|' + '---|'.repeat(LV.length + 2));
for (const k of Object.keys(KINDS)) console.log(`| ${k} | ${KINDS[k].fa} | ` + rows.map(([, c]) => c[k] || 0).join(' | ') + ' |');
console.log('| total | | ' + rows.map((r) => r[2]).join(' | ') + ' |');
