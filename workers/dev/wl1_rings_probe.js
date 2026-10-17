// WL1: the real chain  setMany({wall: n}) -> skin.levelOf('wall') -> a1_rings.wallLevel() -> layout.ringsAt()  at level cap 30 and 50 (node only, no game).
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { setLevelCap, LEVEL_CAP } from '/home/claude/bot/bluebot_v2/bluewall/client/src/tiers.js';
import { setEntityLevel, levelOf } from '/home/claude/bot/bluebot_v2/bluewall/client/src/skin.js';
import { wallLevel } from '/home/claude/bot/bluebot_v2/bluewall/client/src/a1_rings.js';

const rings = (n) => L.ringsAt(wallLevel()).length;
const rows = [];
for (const cap of [30, 50]) {
  setLevelCap(cap);
  const bad = [];
  for (let n = 1; n <= 60; n++) {
    setEntityLevel('wall', n);                                   // exactly what levels.setMany does for the wall
    const want = Math.min(3, 1 + Math.floor((Math.min(n, cap) - 1) / 10)), got = rings(n);
    if (got !== want) bad.push(n + ':' + got + '!=' + want);
  }
  rows.push(['cap ' + cap + ' (LEVEL_CAP=' + LEVEL_CAP + ')', bad.length ? 'BAD ' + bad.join(' ') : 'wall 1..60 -> rings as the owner rule (1-10:1, 11-20:2, 21+:3)']);
}
// the owner's rule: from level 21 up (50 included) the wall must have 3 rings
setLevelCap(50);
const owner = [15, 20, 21, 25, 30, 35, 49, 50].map((n) => { setEntityLevel('wall', n); return n + ' -> wallLevel ' + wallLevel() + ', rings ' + rings(n); });
rows.push(['cap 50 table', owner.join(' | ')]);
// the cap changes AFTER the level was written (econ.js calls setLevelCap when balance.json loads; the world may have written levels before)
const race = [];
for (const [c1, c2] of [[30, 50], [50, 30]]) for (const n of [20, 21, 30, 50]) { setLevelCap(c1); setEntityLevel('wall', n); setLevelCap(c2); race.push('set@' + c1 + ' read@' + c2 + ' wall ' + n + ' -> ' + wallLevel() + ' / ' + rings(n) + ' rings'); }
rows.push(['cap race', race.join(' | ')]);
// untouched default (nothing written yet): the world boots with 20 = the top look
setLevelCap(50); rows.push(['default levelOf(wall)', String(levelOf('wall'))]);
for (const r of rows) console.log(r[0] + ': ' + r[1]);
