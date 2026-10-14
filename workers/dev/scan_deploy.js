import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { hamletD } from '/home/claude/bot/bluebot_v2/bluewall/client/src/hamlets.js';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
const g0 = BT.meta.gates[0], tx = -g0.nz, tz = g0.nx;
const res = [];
for (let d = 44; d <= 90; d += 4) for (let lat = -70; lat <= 70; lat += 7) {
  const cx = g0.x + g0.nx * d + tx * lat, cz = g0.z + g0.nz * d + tz * lat; let cost = 0, n = 0, b = 0, w = 0, st = 0, f = 0;
  for (let l = -70; l <= 70; l += 5) for (let bk = -4; bk <= 46; bk += 5) {
    const x = cx + tx * l + g0.nx * bk, z = cz + tz * l + g0.nz * bk; n++;
    const hh = L.height(x, z), s = Math.abs(L.height(x + 4, z) - hh) + Math.abs(L.height(x, z + 4) - hh);
    const tg = BT.targets.some((t) => t.type !== 'wall' && Math.hypot(t.x - x, t.z - z) < Math.max(t.w, t.d) * 0.62 + 3);
    if (tg) b++; if (hh < 0.4) w++; if (s > 3.2) st++; if (L.fieldD(x, z) < 1.1) f++;
  }
  cost = (6 * b + 5 * w + 2 * st + 1 * f) / n; res.push({ d, lat, cost: +cost.toFixed(3), b, w, st, f, n, cx: +cx.toFixed(1), cz: +cz.toFixed(1) });
}
res.sort((a, b) => a.cost - b.cost);
console.log(JSON.stringify(res.slice(0, 8))); console.log('current', JSON.stringify(res.find((r) => r.d === 62 && r.lat === 0) || 'n/a'));
const cur = (() => { let b = 0, w = 0, st = 0, f = 0, n = 0; const d = 62, lat = 0; const cx = g0.x + g0.nx * d, cz = g0.z + g0.nz * d; for (let l = -70; l <= 70; l += 5) for (let bk = -4; bk <= 46; bk += 5) { const x = cx + tx * l + g0.nx * bk, z = cz + tz * l + g0.nz * bk; n++; const hh = L.height(x, z), s = Math.abs(L.height(x + 4, z) - hh) + Math.abs(L.height(x, z + 4) - hh); if (BT.targets.some((t) => t.type !== 'wall' && Math.hypot(t.x - x, t.z - z) < Math.max(t.w, t.d) * 0.62 + 3)) b++; if (hh < 0.4) w++; if (s > 3.2) st++; if (L.fieldD(x, z) < 1.1) f++; } return { b, w, st, f, n, cost: (6 * b + 5 * w + 2 * st + f) / n }; })();
console.log('cur62/0', JSON.stringify(cur));
