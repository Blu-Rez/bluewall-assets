// S8 pure-helper test: gunInfo / shareChips on the REAL base (basetargets.json) at several levels
import { createBattle } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import { gunKind, isGun, gunInfo, shareChips } from '/home/claude/bot/bluebot_v2/bluewall/client/src/threat.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
for (const [lv, seed] of [[3, 1], [8, 2], [14, 3], [20, 4], [20, 11]]) {
  const army = { spear: 10, sword: 10 };
  const sim = createBattle({ spec: { seed, ratio: 1, power: 3000, levels: { keep: lv, wall: lv, towers: lv }, loot: {} }, army, forge: 1, targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta });
  const B = sim.buildings, guns = B.filter(isGun), kinds = {};
  for (const g of guns) { const i = gunInfo(g); kinds[i.kind] = (kinds[i.kind] || 0) + 1; ok(i.name && i.line && i.hits, 'info ' + i.kind); ok(g.rng > 3, 'rng ' + i.kind); ok(!g.off, 'off gun listed'); if (i.kind === 'cannon') ok(i.hits === 'Ground only' && i.blind, 'cannon info'); if (i.kind === 'quad') ok(i.hits === 'Ground only', 'quad'); if (i.kind === 'ballista') ok(i.hits === 'Ground + air', 'ballista'); }
  ok(!B.some((b) => b.off && isGun(b)), 'unmanned site counted as gun');
  const chips = shareChips(B), tot = chips.reduce((a, c) => a + c.p, 0);
  ok(Math.abs(tot - 1) < 1e-9, 'chips sum ' + tot);
  console.log('L' + lv, 'guns', JSON.stringify(kinds), 'chips', chips.map((c) => c.k + ' ' + Math.round(c.p * 100) + '%').join(', '));
}
console.log(bad ? 'FAILED ' + bad : 'threat helpers OK');
