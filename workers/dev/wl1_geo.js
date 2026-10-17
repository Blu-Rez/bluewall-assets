// WL1: pure geometry — from the home camera at 844x390, which part of the keep ring's top edge clears the citadel (outer) wall and the town wall, for several heights of the keep ring
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
const cam = [236.6, 84.9, 70.4];
const poly = (P) => P.map((p) => [p[0], p[1]]);
const segs = (P) => P.map((p, i) => [p, P[(i + 1) % P.length]]);
// ray (cam -> point) vs a vertical wall slab (segment a-b, thickness T, height H): sample the ray, inside the slab footprint and below H => blocked
const distSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t)); };
const blocked = (pt, rings) => { for (let s = 0.02; s < 0.995; s += 0.004) { const x = cam[0] + (pt[0] - cam[0]) * s, y = cam[1] + (pt[1] - cam[1]) * s, z = cam[2] + (pt[2] - cam[2]) * s;
  for (const R of rings) if (y < R.H && R.S.some(([a, b]) => distSeg(x, z, a, b) < R.T / 2)) return true; } return false; };
console.log('INNER pts', L.INNER.length, 'OUTER', L.OUTER.length, 'TOWN', L.TOWN && L.TOWN.length, 'WALL', JSON.stringify(L.WALL));
const occ = [{ H: L.WALL.outer.H + 3, T: L.WALL.outer.T, S: segs(L.OUTER) }, { H: L.WALL.town.H + 3, T: L.WALL.town.T, S: segs(L.TOWN) }];   // (+3: the crenels / roofs on top)
for (const H of [7.5, 16, 20, 24, 28, 32]) {
  let tot = 0, vis = 0, near = 0, nearVis = 0;
  for (const [a, b] of segs(L.INNER)) { const n = 12; for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; tot++; if (!blocked([x, H, z], occ)) vis++; } }
  console.log('H', H, 'top edge of the keep ring clear of the outer + town walls:', vis, '/', tot);
}
