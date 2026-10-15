// GR1_R2 test: horizon colour table (fog = sky horizon, continuous, never black), far ranges (1 mesh, <= 8400 tris, finite colours, haze ends at the horizon colour), tod hook.
import * as THREE from 'three';
import { sample } from '/home/claude/bot/bluebot_v2/bluewall/client/src/tod.js';
import { createBackdrop } from '/home/claude/bot/bluebot_v2/bluewall/client/src/backdrop.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
// 1. horizon table
let prev = null, maxJump = 0, minLum = 9, jumpAt = 0;
for (let h = 0; h < 24; h += 0.05) {
  const P = sample(h);
  ok(P.hzn && P.hznSun, 'P.hzn / P.hznSun at ' + h);
  ok(Math.abs(P.fog.r - P.hzn.r) + Math.abs(P.fog.g - P.hzn.g) + Math.abs(P.fog.b - P.hzn.b) < 1e-6, 'fog == horizon at ' + h);
  const lum = 0.2126 * P.hzn.r + 0.7152 * P.hzn.g + 0.0722 * P.hzn.b; minLum = Math.min(minLum, lum);
  if (prev) { const j = Math.abs(P.hzn.r - prev[0]) + Math.abs(P.hzn.g - prev[1]) + Math.abs(P.hzn.b - prev[2]); if (j > maxJump) { maxJump = j; jumpAt = h; } }
  prev = [P.hzn.r, P.hzn.g, P.hzn.b];
}
ok(maxJump < 0.1, 'horizon colour continuous (max step per 0.05 h = ' + maxJump.toFixed(4) + ' at ' + jumpAt.toFixed(2) + ' h; one game hour = 150 real seconds)');
ok(minLum > 0.006, 'horizon never black (min linear luminance ' + minLum.toFixed(4) + ')');
// 2. far ranges at every hour, clear and stormy
const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0xffffff, 0.0009);
const bd = createBackdrop(scene); const st = bd.stats();
ok(bd.meshes.length === 1, 'one draw call'); ok(st.tris <= 8400, 'triangles <= 8400 (' + st.tris + ')');
ok(bd.mesh.material.type === 'MeshBasicMaterial' && bd.mesh.material.fog === false && bd.mesh.material.toneMapped === false, 'MeshBasic, no fog, no tone map');
const C = bd.mesh.geometry.getAttribute('color').array;
for (const W of [{ cover: 0.1, grey: 0, fog: 1 }, { cover: 0.9, grey: 0.8, fog: 2.2 }]) for (let h = 0; h < 24; h += 0.5) {
  const P = sample(h); scene.fog.color.copy(P.fog); scene.fog.density = P.fogD * W.fog; bd.update(P, W, scene.fog.color, true);
  let nan = 0, lo = 9, hi = -9; for (let i = 0; i < C.length; i++) { if (!Number.isFinite(C[i]) || C[i] < -1e-6 || C[i] > 1.0001) nan++; }
  ok(nan === 0, 'finite colours in 0..1 at ' + h + ' w' + W.cover);
  // the farthest band's top row must be (almost) the horizon colour: aerial perspective ends at the sky
  const far = (C.length / 3) - 1, k = (far - 5) * 3; // a vertex of the last row of the last band
  if (W.cover < 0.5) {      // the colour must lie on the segment horizon <-> sun side (the sun side is warmer): distance to that segment
    const a = scene.fog.color, b = P.hznSun, v = [C[k], C[k + 1], C[k + 2]], ab = [b.r - a.r, b.g - a.g, b.b - a.b], av = [v[0] - a.r, v[1] - a.g, v[2] - a.b];
    const t = Math.max(0, Math.min(1, (av[0] * ab[0] + av[1] * ab[1] + av[2] * ab[2]) / (ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2] + 1e-9)));
    const d = Math.hypot(av[0] - ab[0] * t, av[1] - ab[1] * t, av[2] - ab[2] * t); ok(d < 0.06, 'far band on the horizon colours at ' + h + ' (' + d.toFixed(3) + ')'); }
}
console.log(bad ? 'GR1_R2 TEST FAILED (' + bad + ')' : 'GR1_R2 TEST OK');
process.exit(bad ? 1 : 0);
