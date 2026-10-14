import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { road } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
L.setMap('night');
const W = (x, z) => L.height(x, z) < -0.3;
const wet = (name, x, z) => { if (W(x, z)) console.log('WET', name, x.toFixed(1), z.toFixed(1), L.height(x, z).toFixed(2)); };
// gate posts (army.js)
for (const [gi, G] of L.TGATES.entries()) {
  const tx = G.nz, tz = -G.nx;
  [[-1, 'spear'], [1, 'spear'], [-1.9, 'guard'], [1.9, 'guard']].forEach(([s, kn]) => wet('gate' + gi + kn + s, G.x + G.nx * 8.5 + tx * s * 6.4, G.z + G.nz * 8.5 + tz * s * 6.4));
  console.log('gate', gi, G.x.toFixed(1), G.z.toFixed(1), 'n', G.nx.toFixed(2), G.nz.toFixed(2));
  for (let d = 0; d <= 30; d += 2) { const x = G.x + G.nx * d, z = G.z + G.nz * d; process.stdout.write(d + ':' + L.height(x, z).toFixed(1) + ' '); }
  console.log();
}
// muster blocks
const MU = L.MUSTER, T0 = L.TGATES[0]; const face = Math.atan2(T0.x - MU.x, T0.z - MU.z);
const fx = Math.sin(face), fz = Math.cos(face), rx = Math.cos(face), rz = -Math.sin(face);
const at = (u, v) => [MU.x + fx * u + rx * v, MU.z + fz * u + rz * v];
for (const [bu, bv, cols, rows] of [[2, -19, 6, 4], [2, 0, 6, 3], [2, 19, 6, 3], [11, 0, 1, 1]]) {
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const v = bv + (i - (cols - 1) / 2) * 2.9, u = bu - j * 3.2; const [x, z] = at(u, v); wet('muster', x, z); }
}
// march column
const main = road('main'); if (main) { for (let i = 0; i < main.pts.length; i++) wet('road' + i, main.pts[i][0], main.pts[i][1]); console.log('main pts', main.pts.length); }
// camp
const C = L.CAMP;
for (const [dx, dz] of [[22, 8], [30, -4], [14, -14]]) wet('spar', C.x + dx, C.z + dz);
for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) wet('campblock', C.x - 12 + (i - 2) * 2.9 , C.z + 34 - j * 3.2);
console.log('MUSTER', MU, 'T0', T0.x, T0.z);
