import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '../bot/bluebot_v2/bluewall/client/src/roads.js';
L.setMap('night'); buildRoads();
console.log('RIVER', JSON.stringify(L.RIVER), 'LAKE', JSON.stringify(L.LAKE));
// walk a ray from (px,pz) in direction ang until the ground is wet; report distance
const ray = (px, pz, ang) => { const dx = Math.sin(ang), dz = Math.cos(ang); for (let d = 0; d < 160; d += 1) if (L.height(px + dx * d, pz + dz * d) < -0.3) return d; return -1; };
for (let i = 0; i < L.RIVER.length; i++) { const [x, z] = L.RIVER[i]; console.log('river pt', i, x, z, 'h', L.height(x, z).toFixed(2)); }
// candidate: points 30 m beside each river vertex, on both banks; print distance to water facing the river
for (let i = 1; i < L.RIVER.length - 1; i++) {
  const a = L.RIVER[i - 1], b = L.RIVER[i + 1], tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz), nx = -tz / tl, nz = tx / tl, [x, z] = L.RIVER[i];
  for (const sd of [-1, 1]) { const px = x + nx * sd * 32, pz = z + nz * sd * 32, ang = Math.atan2(-nx * sd, -nz * sd); console.log('cand', i, sd, px.toFixed(0), pz.toFixed(0), 'town', L.sdTown(px, pz).toFixed(0), 'ang', ang.toFixed(2), 'dWater', ray(px, pz, ang), 'h', L.height(px, pz).toFixed(2)); }
}
for (const [id, x, z, ang] of [['lake', -123.3, 280, -2.304], ['river', 189.3, -169.3, 0.686]]) console.log(id, 'dWater from site', ray(x, z, ang));
