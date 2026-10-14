import * as THREE from '/home/claude/bot/bluebot_v2/bluewall/client/node_modules/three/build/three.module.js';
import { CamCtl } from '/home/claude/bot/bluebot_v2/bluewall/client/src/controls.js';
const dom = { style: {}, addEventListener() {} };
const flat = () => 0;
function run(portrait, d, T, az) {
  const cam = new THREE.PerspectiveCamera(); const c = new CamCtl(cam, dom, flat); c.setView(portrait);
  c.intro = null; c.target.set(T[0], 0, T[1]); c.azim = az; c.dist = d;
  for (let i = 0; i < 40; i++) c.update(0.016);
  const P = cam.position, t = c.target, dx = P.x - t.x, dy = P.y - t.y, dz = P.z - t.z, D = Math.hypot(dx, dy, dz);
  return { D, pol: Math.acos(dy / D), camR: Math.hypot(P.x, P.z) };
}
const portrait = process.argv[2] !== 'land';
const probe = new CamCtl(new THREE.PerspectiveCamera(), dom, flat); probe.setView(portrait);
console.log(`${portrait ? 'portrait' : 'landscape'}  minD=${probe.minD} maxD=${probe.maxD} pNear=${probe.pNear} pFar=${probe.pFar}  (zoomPolar @min ${probe.zoomPolar(probe.minD).toFixed(2)}, @max ${probe.zoomPolar(probe.maxD).toFixed(2)})`);
for (const [name, d] of [['min', probe.minD], ['mid', (probe.minD + probe.maxD) / 2], ['max', probe.maxD]]) {
  for (const T of [[4, 4], [150, 0], [0, -200]]) {
    const r = []; for (let k = 0; k < 24; k++) r.push(run(portrait, d, T, k * Math.PI / 12));
    const pol = r.map(x => x.pol), D = r.map(x => x.D);
    console.log(`${name.padEnd(3)} target ${String(T).padEnd(8)} dist ${Math.min(...D).toFixed(0)}..${Math.max(...D).toFixed(0)}   tilt ${(Math.min(...pol) * 57.3).toFixed(0)}..${(Math.max(...pol) * 57.3).toFixed(0)} deg   camRadius max ${Math.max(...r.map(x => x.camR)).toFixed(0)}`);
  }
}
