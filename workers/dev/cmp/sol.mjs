import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { planArmy, toFrame } from '/home/claude/bot/bluebot_v2/bluewall/client/src/armyplan.js';
import { staticSolids } from '/home/claude/bot/bluebot_v2/bluewall/client/src/solids.js';
L.setMap('night'); buildRoads();
const S = staticSolids(); console.log('solids', S.length);
const dp = { x: 182.419, z: 75.692 }, nx = 0.8941542, nz = 0.4477591, tx = -nz, tz = nx;
const fullMax = { spear: 61, sword: 61, guard: 21, archer: 69, cavalry: 23, pegasus: 13, baby: 5, dragon: 1, catapult: 7, giant: 3, imp: 17, mage: 14, ram: 6, cannon: 6, werewolf: 5, trebuchet: 4, hill: 2, shieldmaiden: 3, lord: 3, legionary: 43, captain: 3, ogre: 2, gryphon: 3, lich: 3, treant: 2, gryphonknight: 1, darkrider: 1, baby3: 1, dragon3: 1 };
const dpf = { x: dp.x, z: dp.z, nx, nz }; const obs = toFrame(S, dpf); const p = planArmy(fullMax, 2, true, obs); console.log('obstacles', JSON.stringify(obs.filter((o) => Math.abs(o[0]) < 140 && o[1] > -20 && o[1] < 180).map((o) => o.map((v) => +v.toFixed(0)))), 'army', p.width.toFixed(0), 'x', p.depth.toFixed(0), 'back1', p.back1.toFixed(1));
for (const t of p.types) for (const [l, b] of p.pos[t]) { const x = dp.x + tx * l + nx * b, z = dp.z + tz * l + nz * b; for (const [sx, sz, sr] of S) { const d = Math.hypot(x - sx, z - sz); if (d < sr + 1.5) console.log('INSIDE', t, 'l', l.toFixed(1), 'b', b.toFixed(1), 'solid', sx.toFixed(0), sz.toFixed(0), 'r', sr.toFixed(1), 'dist', d.toFixed(1)); } }
// nearest solids to the army area
let near = []; for (const [sx, sz, sr] of S) { const dx = sx - dp.x, dz = sz - dp.z, l = dx * tx + dz * tz, b = dx * nx + dz * nz; if (Math.abs(l) < 140 && b > -20 && b < 180) near.push([+l.toFixed(0), +b.toFixed(0), +sr.toFixed(1)]); }
console.log('solids around the army [l, b, r]:', JSON.stringify(near));
