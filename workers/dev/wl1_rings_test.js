// WL1: from castle-wall level 21 up (50 included) the home map stands THREE wall rings — the whole chain the phone runs, in node:
//   server b.wall  ->  levels.setMany (main.js, on every load / upgrade)  ->  skin.levelOf('wall')  ->  a1_rings.wallLevel()  ->  layout.ringsAt()
// plus the owner preview (world.setLevel -> levels.setLevel).  The in-game frames are dev/wl1_shot.py.
import '/home/claude/bot/bluebot_v2/bluewall/client/src/econ.js';                       // sets the level cap from balance.json exactly as the game does at start
import BAL from '/home/claude/bot/bluebot_v2/bluewall/client/src/balance.json';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { LEVEL_CAP, setLevelCap } from '/home/claude/bot/bluebot_v2/bluewall/client/src/tiers.js';
import { createLevels } from '/home/claude/bot/bluebot_v2/bluewall/client/src/levels.js';
import { wallLevel } from '/home/claude/bot/bluebot_v2/bluewall/client/src/a1_rings.js';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const STRUCT = ['wall', 'keep', 'townwall', 'vault_ruby', 'vault_emerald', 'vault_turq', 'mine_ruby', 'mine_emerald', 'mine_turq', 'barracks', 'stable', 'training', 'lair', 'workshop', 'forge', 'towers'];
const want = (n, cap) => Math.min(3, 1 + Math.floor((Math.min(cap, Math.max(1, n)) - 1) / 10));       // the owner's rule: 1-10 one ring, 11-20 two, 21 and up three
const rings = () => L.ringsAt(wallLevel());
const lv = createLevels({ M: {}, ctx: { levelHooks: [] }, flags: {} });
const server = (keep, wall) => { const b = {}; for (const e of STRUCT) b[e] = keep; b.wall = wall; return b; };   // the shape of st.prog.b (progress.view)

// ---- 1. the cap the phone runs with
const GAME_CAP = LEVEL_CAP;
ok(GAME_CAP === BAL.max_level && GAME_CAP === 50, 'after econ.js loads, the level cap is balance.json max_level = ' + GAME_CAP + ' (50 expected at the kit)');

// ---- 2. the server path: wall building level n (castle at the cap) -> rings, for every n, at the game cap and at the old cap 30
for (const cap of [GAME_CAP, 30]) {
  setLevelCap(cap);
  const bad = [];
  for (let n = 1; n <= cap; n++) { lv.setMany(server(cap, n)); const got = rings().length; if (got !== want(n, cap)) bad.push(n + ':' + got); }
  ok(!bad.length, 'cap ' + cap + ': setMany({wall: 1..' + cap + '}) -> 1 ring up to 10, 2 up to 20, 3 from 21 to ' + cap + (bad.length ? '   BAD ' + bad.join(' ') : ''));
  const top = []; for (let n = 21; n <= cap; n++) { lv.setMany(server(cap, n)); top.push(rings().join('+')); }
  ok(top.every((s) => s === 'inner+outer+town'), 'cap ' + cap + ': every wall level 21..' + cap + ' stands inner + outer + town');
}
setLevelCap(GAME_CAP);

// ---- 3. what the server can really hold at castle 50: the round rule needs every structure at 49 or more (progress.round_left) -> the wall is 49 or 50 -> three rings
lv.setMany(server(50, 49)); ok(rings().length === 3, 'castle 50 with the wall at 49 (the lowest the round rule allows) -> 3 rings');
lv.setMany(server(50, 50)); ok(rings().length === 3, 'castle 50 with the wall at 50 -> 3 rings');
// the dependency the owner can hit with a dev tool: the rows follow the WALL building, not the castle (progress.max_allowed lets the wall lag; /api/dev "set" can put it anywhere)
lv.setMany(server(50, 20)); ok(rings().join('+') === 'inner+outer', 'KNOWN: castle 50 but wall building 20 -> only inner + outer (the ONLY way to see two rows at castle 50)');
lv.setMany(server(50, 21)); ok(rings().length === 3, 'castle 50, wall building 21 -> 3 rings (21 is the threshold)');

// ---- 4. the owner preview (every structure at n) and the boot default
for (const [n, r] of [[50, 3], [49, 3], [30, 3], [25, 3], [21, 3], [20, 2], [15, 2], [11, 2], [10, 1], [1, 1]]) { lv.setLevel(n); ok(rings().length === r, 'preview setLevel(' + n + ') -> ' + r + ' ring(s)'); }
console.log(fails ? 'WL1 FAILED (' + fails + ')' : 'WL1 OK'); process.exit(fails ? 1 : 0);
