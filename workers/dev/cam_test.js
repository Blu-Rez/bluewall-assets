// p38: the home camera at every zoom / position / rotation: it stays in the valley, above the ground, and nothing (mountain / hill) stands between it and what it looks at
import * as THREE from 'three';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { CamCtl } from '/home/claude/bot/bluebot_v2/bluewall/client/src/controls.js';
L.setMap('night');
const dom = { style: {}, addEventListener() {}, setPointerCapture() {}, clientHeight: 800 };
let fails = 0, worst = { occl: 0, r: 0 }, n = 0, badOcc = [], badR = [];
for (const portrait of [true, false]) {
  const cam = new THREE.PerspectiveCamera(portrait ? 63 : 52, portrait ? 0.46 : 2.1, 0.8, 3200);
  const c = new CamCtl(cam, dom, (x, z) => L.height(x, z)); c.setView(portrait);
  for (const dFrac of [0, 0.3, 0.6, 0.85, 1]) for (let ti = 0; ti < 14; ti++) {
    const ta = ti / 14 * Math.PI * 2, tr = (ti % 3) * (c.maxR / 2.2) + (ti === 0 ? 0 : 20);
    for (let ai = 0; ai < 12; ai++) {
      c.dist = c.minD + (c.maxD - c.minD) * dFrac; c.azim = ai / 12 * Math.PI * 2; c.target.set(Math.cos(ta) * tr, 0, Math.sin(ta) * tr); c.vel.set(0, 0); c.vAz = 0; c._los = 0;
      for (let k = 0; k < 60; k++) c.update(0.05);
      n++;
      const p = cam.position, T = c.target, cr = Math.hypot(p.x, p.z);
      worst.r = Math.max(worst.r, cr);
      if (cr > c.camR + 1) badR.push([portrait, Math.round(c.dist), Math.round(cr)]);
      // line of sight: camera -> target; the ground must stay below the line (2 m margin)
      let occl = -1e9;
      for (let s = 0.04; s < 0.96; s += 0.04) { const x = p.x + (T.x - p.x) * s, y = p.y + (T.y - p.y) * s, z = p.z + (T.z - p.z) * s; occl = Math.max(occl, L.height(x, z) - (y - 2)); }
      worst.occl = Math.max(worst.occl, occl);
      if (occl > 3.2) badOcc.push([portrait, Math.round(c.dist), Math.round(T.x), Math.round(T.z), +c.azim.toFixed(2), Math.round(occl)]);
    }
  }
}
console.log('cases', n, 'camera radius max', Math.round(worst.r), '(valley limit ' + (290 + L.PUSH) + ')', 'worst ground-above-line', Math.round(worst.occl), 'm');
if (badR.length) { console.log('FAIL outside valley', JSON.stringify(badR.slice(0, 5))); fails++; }
if (badOcc.length) { const by = {}; for (const b of badOcc) { const k = (b[0] ? 'P' : 'L') + b[1]; by[k] = (by[k] || 0) + 1; } console.log('FAIL far cases', JSON.stringify(badOcc.filter((b) => b[1] > 150)), 'FAIL view blocked by ground', badOcc.length, 'cases by zoom', JSON.stringify(by), 'worst-3', JSON.stringify(badOcc.sort((a, b) => b[5] - a[5]).slice(0, 3))); fails++; }
console.log(fails ? 'CAM FAILED' : 'CAM OK'); process.exit(fails ? 1 : 0);
