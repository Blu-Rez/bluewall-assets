import * as THREE from '/home/claude/bot/bluebot_v2/bluewall/client/node_modules/three/build/three.module.js';
import { CamCtl } from '/home/claude/bot/bluebot_v2/bluewall/client/src/controls.js';
const dom = { style: {}, addEventListener() {} };
const cam = new THREE.PerspectiveCamera(); const c = new CamCtl(cam, dom, () => 0); c.setView(true);
c.intro = null; c.target.set(150, 0, 0); c.azim = Math.PI / 2; c.dist = 200;
console.log('camR', c.camR, 'maxR', c.maxR);
for (let i = 0; i < 4; i++) { c.update(0.016); console.log(i, 'T', c.target.x.toFixed(1), c.target.z.toFixed(1), 'cam', cam.position.x.toFixed(1), cam.position.y.toFixed(1), cam.position.z.toFixed(1), 'r', Math.hypot(cam.position.x, cam.position.z).toFixed(1)); }
