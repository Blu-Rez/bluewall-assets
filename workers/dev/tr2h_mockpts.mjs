// tr2h_mockpts.mjs — a free spot on the river (outside the town wall, no bridge within 35 m) for the in-page Tripo-bridge MOCK (preview only, nothing is written into the game)
import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { bridgesFromLayout } from '../bot/bluebot_v2/bluewall/client/src/nav.js';
const br = bridgesFromLayout(L), P = L.RIVER, out = [];
for (let i = 1; i < P.length - 2; i++) { const a = P[i], b = P[i + 1], cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2;
  if (L.sdTown(cx, cz) > 25 && !br.some((B) => Math.hypot(B.x - cx, B.z - cz) < 35) && !(L.WGATES || []).some((W) => false)) { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); out.push({ i, x: +cx.toFixed(1), z: +cz.toFixed(1), ux: +(dx / l).toFixed(3), uz: +(dz / l).toFixed(3), seg: +l.toFixed(1), p: a.length }); } }
console.log(JSON.stringify({ n: P.length, sample: P.slice(0, 3), cands: out.slice(0, 40), sd: L.sdTown(0, 100) }));
