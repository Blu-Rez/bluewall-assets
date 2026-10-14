import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { hamlets } from '/home/claude/bot/bluebot_v2/bluewall/client/src/hamlets.js';
import { planArmy } from '/home/claude/bot/bluebot_v2/bluewall/client/src/armyplan.js';
import { planCamp } from '/home/claude/bot/bluebot_v2/bluewall/client/src/campplan.js';
L.setMap('night'); buildRoads();
const dp = { x: 182.419, z: 75.692 }, nx = 0.8941542, nz = 0.4477591, tx = -nz, tz = nx;
const at = (l, b) => [dp.x + tx * l + nx * b, dp.z + tz * l + nz * b];
const height = (l, b) => { const [x, z] = at(l, b); return L.height(x, z); };
const H0 = height(0, 0);
const farmBlock = (x, z, r) => { for (const F of L.FARMS) { const dx = x - F.x, dz = z - F.z, c = Math.cos(F.rot), s = Math.sin(F.rot), ox = dx * c - dz * s, oz = dx * s + dz * c; if (Math.abs(ox) < F.w / 2 + r + 2 && Math.abs(oz) < F.d / 2 + r + 2) return true; } for (const H of hamlets()) for (const h of H.houses) if (Math.hypot(h.x - x, h.z - z) < 8 + r) return true; return false; };
const blocked = (l, b, r) => { const [x, z] = at(l, b); return farmBlock(x, z, r); };
const sets = {
 small: {spear: 30, sword: 20, archer: 20, cavalry: 8},
 mid: {spear: 60, sword: 40, archer: 40, cavalry: 15, giant: 3, dragon: 1, catapult: 4, mage: 8},
 ownerMax: {"spear": 61, "sword": 61, "guard": 21, "archer": 69, "cavalry": 23, "pegasus": 13, "baby": 5, "dragon": 1, "catapult": 7, "giant": 3, "imp": 17, "mage": 14, "ram": 6, "cannon": 6, "werewolf": 5, "trebuchet": 4, "hill": 2, "shieldmaiden": 3, "lord": 3, "legionary": 43, "captain": 3, "ogre": 2, "gryphon": 3, "lich": 3, "treant": 2, "gryphonknight": 1, "darkrider": 1, "baby3": 1, "dragon3": 1},
};
const which = process.argv[2] || 'all';
for (const [name, army] of Object.entries(sets)) {
  if (which !== 'all' && which !== name) continue;
  const plan = planArmy(army, 2, true);
  const types = Object.keys(army).filter((t) => army[t] > 0), nMax = Math.max(...types.map((t) => army[t]));
  const squads = types.map((t) => ({ k: 1.1 + 0.45 * Math.sqrt(army[t] / nMax) }));
  const t0 = Date.now();
  const cp = planCamp({ plan, squads, height, blocked, seed: 12345 });
  const gaps = cp.items.map((a, i) => Math.min(...cp.items.map((b, j) => i === j ? 1e9 : Math.hypot(a.l - b.l, a.b - b.b) - a.r - b.r)));
  console.log('==', name, 'units', Object.values(army).reduce((a, b) => a + b, 0), 'army width', (plan.lat1 - plan.lat0).toFixed(0), 'back1', plan.back1.toFixed(1), 'Bs', cp.Bs.toFixed(0), 'tents', cp.items.length, 'ms', Date.now() - t0, 'pole', cp.poleFound, cp.pole.l.toFixed(0), cp.pole.b.toFixed(0), 'fallback', cp.fallback);
  console.log('   gap min', Math.min(...gaps).toFixed(2), 'max', Math.max(...gaps).toFixed(2), 'mean', (gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(2), 'tent b range', Math.min(...cp.items.map((t) => t.b)).toFixed(0), Math.max(...cp.items.map((t) => t.b)).toFixed(0), 'l range', Math.min(...cp.items.map((t) => t.l)).toFixed(0), Math.max(...cp.items.map((t) => t.l)).toFixed(0), 'max slope', Math.max(...cp.items.map((t) => t.slope)).toFixed(2));
  // ascii
  const sym = (h) => h < 0.6 ? '~' : h < H0 + 2 ? '.' : h < H0 + 6 ? ':' : h < H0 + 12 ? '+' : h < H0 + 25 ? '#' : '@';
  const grid = {}; const st = 4;
  for (const [type, P] of Object.entries(plan.pos)) for (const [l, b] of P) grid[Math.round(l / st) + ',' + Math.round(b / st)] = 'o';
  for (const t of cp.items) for (let dl = -t.r; dl <= t.r; dl += st / 2) for (let db = -t.r; db <= t.r; db += st / 2) if (Math.hypot(dl, db) <= t.r) grid[Math.round((t.l + dl) / st) + ',' + Math.round((t.b + db) / st)] = 'T';
  grid[Math.round(cp.pole.l / st) + ',' + Math.round(cp.pole.b / st)] = 'P';
  const bmax = Math.max(160, Math.ceil(Math.max(...cp.items.map((t) => t.b)) / 10) * 10 + 20);
  for (let b = -8; b <= bmax; b += st) { let row = String(b).padStart(4) + ' '; for (let l = -160; l <= 160; l += st) { const k = Math.round(l / st) + ',' + Math.round(b / st); row += grid[k] || (blocked(l, b, 0) ? 'x' : sym(height(l, b))); } console.log(row); }
}
