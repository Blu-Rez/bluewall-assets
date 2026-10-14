import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
L.setMap('night'); buildRoads();
const dp = { x: 182.419, z: 75.692 }, nx = 0.8941542, nz = 0.4477591, tx = -nz, tz = nx;
const at = (l, b) => [dp.x + tx * l + nx * b, dp.z + tz * l + nz * b];
const h = (l, b) => { const [x, z] = at(l, b); return L.height(x, z); };
const H0 = h(0, 0);
console.log('b : free interval around l=0 (flat: h<H0+3.5 and local slope<0.28)  | gentle (slope<0.5)');
for (let b = -20; b <= 150; b += 10) {
  const flat = (l, sm) => { const hh = h(l, b); if (hh < 0.6 || hh > H0 + 3.5 + (sm > 0.4 ? 8 : 0)) return false; const s = Math.hypot(h(l + 2, b) - h(l - 2, b), h(l, b + 2) - h(l, b - 2)) / 4; return s < sm; };
  const span = (sm) => { let a = 0, c = 0; while (a > -260 && flat(a - 2, sm)) a -= 2; while (c < 260 && flat(c + 2, sm)) c += 2; return [a, c]; };
  console.log(String(b).padStart(4), JSON.stringify(span(0.28)), JSON.stringify(span(0.5)));
}
const lb = (x, z) => { const dx = x - dp.x, dz = z - dp.z; return [Math.round(dx * tx + dz * tz), Math.round(dx * nx + dz * nz)]; };
console.log('WINDMILL', lb(L.WINDMILL.x, L.WINDMILL.z), 'FARMHOUSE', lb(L.FIELDS.x + L.FIELDS.w / 2 + 18, L.FIELDS.z + 4), 'WELL2', lb(L.FIELDS.x + L.FIELDS.w / 2 + 10, L.FIELDS.z - 14));
