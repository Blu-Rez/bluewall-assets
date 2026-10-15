// rp1c2_foot.mjs — RP1C-R2 Job 4: the pure parts of rpg_foot.js (the 2-bone solve, the smoothstep).   run: cd client && NODE_PATH=$PWD/node_modules node /home/claude/dev/rp1c2_foot.mjs  -> «FOOT OK»
import { createRequire } from 'module'; const require = createRequire('/home/claude/bot/bluebot_v2/bluewall/client/package.json'); const THREE = require('three');
import { solve2, smooth } from '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/rpg_foot.js';
let fails = 0; const ok = (c, m) => { if (!c) { console.log('FAIL', m); fails++; } else console.log('ok  ', m); };
const V = (x, y, z) => new THREE.Vector3(x, y, z), out = V(0, 0, 0), out2 = V(0, 0, 0), tmp = V(0, 0, 0);
const A = V(0, 1, 0), B = V(0, 0.55, 0.06), C = V(0, 0.1, 0), pole = V(0, 0, 1);       // a leg: thigh 0.45, calf 0.45 (a slightly bent knee towards +z)
const l1 = B.distanceTo(A), l2 = C.distanceTo(B);
// 1. the target is reachable: the ankle lands on it, both bone lengths stay
let rng = 12345; const rnd = () => (rng = (rng * 1664525 + 1013904223) % 4294967296) / 4294967296; let worst = 0, worstReach = 0, kneeFront = 0, n = 0;
for (let i = 0; i < 2000; i++) {
  const T = V((rnd() - 0.5) * 0.5, 0.1 + (rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.5); const d = T.distanceTo(A); if (d > (l1 + l2) * 0.99 || d < Math.abs(l1 - l2) * 1.1 + 0.02) continue; n++;
  solve2(A, B, C, T, pole, out, out2, tmp);
  worst = Math.max(worst, Math.abs(out.distanceTo(A) - l1), Math.abs(out.distanceTo(out2) - l2)); worstReach = Math.max(worstReach, out2.distanceTo(T)); if (out.z - (A.z + T.z) / 2 > -0.001) kneeFront++;
}
ok(n > 500 && worst < 1e-6, 'bone lengths kept over ' + n + ' targets (worst error ' + worst.toExponential(1) + ' m)');
ok(worstReach < 1e-6, 'the ankle reaches every reachable target (worst miss ' + worstReach.toExponential(1) + ' m)');
ok(kneeFront === n, 'the knee always bends the same way as the rest pose (towards +z): ' + kneeFront + ' / ' + n);
// 2. out of reach: the leg stretches straight to the target direction (never longer than l1 + l2), no NaN
{ const T = V(0, -2, 0); const d = solve2(A, B, C, T, pole, out, out2, tmp); ok(d <= l1 + l2 && d > (l1 + l2) * 0.99 && Number.isFinite(out.x + out.y + out.z) && Math.abs(out.distanceTo(A) - l1) < 1e-6, 'out of reach: the leg is straight, d = ' + d.toFixed(3) + ' of ' + (l1 + l2).toFixed(3)); }
{ const T = V(0, 0.99, 0); const d = solve2(A, B, C, T, pole, out, out2, tmp); ok(Number.isFinite(out.x + out.y + out.z) && d >= Math.abs(l1 - l2), 'folded to nothing: no NaN'); }
// 3. a perfectly straight leg (zero knee offset): the pole direction is used
{ const B2 = V(0, 0.55, 0), C2 = V(0, 0.1, 0); const T = V(0, 0.2, 0.1); solve2(A, B2, C2, T, pole, out, out2, tmp); ok(Number.isFinite(out.x + out.y + out.z) && out.z > 0.0, 'straight leg: the knee goes to the pole side (z = ' + out.z.toFixed(3) + ')'); }
// 4. the smoothstep
ok(smooth(0.02, 0.085, 0.0) === 0 && smooth(0.02, 0.085, 0.2) === 1 && Math.abs(smooth(0, 1, 0.5) - 0.5) < 1e-9, 'smooth(): 0 / 1 / 0.5 at the ends and the middle');
console.log(fails ? 'FOOT FAILED' : 'FOOT OK'); process.exit(fails ? 1 : 0);
