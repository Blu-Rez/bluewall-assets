import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { hamlets } from '/home/claude/bot/bluebot_v2/bluewall/client/src/hamlets.js';
L.setMap('night'); buildRoads();
const dp = { x: 182, z: 76 }, r = Math.hypot(dp.x, dp.z), nx = dp.x / r, nz = dp.z / r, tx = -nz, tz = nx;
const at = (l, b) => [dp.x + tx * l + nx * b, dp.z + tz * l + nz * b];
const H0 = L.height(dp.x, dp.z);
console.log('dp r', r.toFixed(1), 'H0', H0.toFixed(2), 'MUSTER', JSON.stringify(L.MUSTER), 'FIELDS', JSON.stringify(L.FIELDS), 'FIELDS2', JSON.stringify(L.FIELDS2), 'MOUNT', L.MOUNT);
// height map: rows b from -30 to 220 (step 10), columns l from -200 to 200 (step 10)
const sym = (h) => h < 0.5 ? '~' : h < H0 + 2 ? '.' : h < H0 + 6 ? ':' : h < H0 + 12 ? '+' : h < H0 + 25 ? '#' : '@';
let head = '      '; for (let l = -200; l <= 200; l += 10) head += (l % 50 === 0 ? String(Math.abs(l) / 10).padStart(2) : '  '); console.log(head);
for (let b = -30; b <= 230; b += 10) {
  let row = String(b).padStart(5) + ' ';
  for (let l = -200; l <= 200; l += 10) { const [x, z] = at(l, b); row += sym(L.height(x, z)) + ' '; }
  console.log(row);
}
// slopes along the centre line + heights
for (const l of [-120, -60, 0, 60, 120]) { let s = 'l=' + l + ': '; for (let b = 40; b <= 200; b += 20) { const [x, z] = at(l, b), h = L.height(x, z); s += b + ':' + h.toFixed(0) + ' '; } console.log(s); }
// hamlets / fields in the l,b frame
const lb = (x, z) => { const dx = x - dp.x, dz = z - dp.z; return [Math.round(dx * tx + dz * tz), Math.round(dx * nx + dz * nz)]; };
for (const Hm of hamlets()) { const [l, b] = lb(Hm.x, Hm.z); if (Math.abs(l) < 260 && b > -80 && b < 260) console.log('hamlet', l, b, 'houses', Hm.houses.map((h) => lb(h.x, h.z).join(',')).join(' ')); }
for (const [n, F] of [['FIELDS', L.FIELDS], ['FIELDS2', L.FIELDS2]]) if (F) console.log(n, lb(F.x, F.z), 'w', F.w, 'd', F.d, 'rot', F.rot);
console.log('LAKE', lb(L.LAKE.x, L.LAKE.z), L.LAKE.r, 'WINDMILL', lb(L.WINDMILL.x, L.WINDMILL.z), 'CAMP', lb(L.CAMP.x, L.CAMP.z), L.CAMP.r, 'PASTURE', lb(L.PASTURE.x, L.PASTURE.z), L.PASTURE.r, 'LAIR', lb(L.LAIR.x, L.LAIR.z), L.LAIR.r, 'MINES', (L.MINES || []).map((m) => lb(m.x, m.z).join(',')).join(' '));
