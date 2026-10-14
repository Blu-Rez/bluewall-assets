// d1_lab.js — D1 particle lab (no game assets): a proxy body + the REAL bfx.js FX pools, the same timeline / emission formulas as bunits.js (copied: the lab is only for tuning the look).
//   window.runLab(ti, H, D, ages) -> [dataURL ...]   (one 390x844 frame per age; tier ti = 0..4 -> rarity.js colour)
import * as THREE from 'three';
import { createFX } from '../bot/bluebot_v2/bluewall/client/src/bfx.js';
import { TIERS } from '../bot/bluebot_v2/bluewall/client/src/rarity.js';
const R = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true }); R.setSize(390, 844); R.setPixelRatio(1); document.body.appendChild(R.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fc4e8); scene.add(new THREE.HemisphereLight(0xffffff, 0x556644, 1.1)); const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(20, 40, 10); scene.add(dl);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0x6f8f4a, roughness: 1 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const tent = new THREE.Mesh(new THREE.ConeGeometry(9, 12, 12), new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 1 })); tent.position.set(-16, 6, -14); scene.add(tent);
const cam = new THREE.PerspectiveCamera(50, 390 / 844, 0.5, 2000); const PXs = { value: 844 / (2 * Math.tan((50 * Math.PI) / 360)) };
const fx = createFX(scene, { scale: PXs, height: () => 0 });
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 2.6, 4, 8), new THREE.MeshStandardMaterial({ color: 0x5b8fd0, roughness: 0.6 })); scene.add(body);
const hexRGB = (h) => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const DIS = { hold: 0.35, end: 1.3, n: window.__N || [14, 20, 26, 34, 44] };
window.runLab = (ti, H, D, ages, ncount = 1) => {
  fx.clear(); const out = [], rgb = hexRGB(TIERS[ti].c), TICK = 1 / 30; let age = 0, flashed = false, acc = 0; const ai = [...ages];
  cam.position.set(0, H * 1.1 + 2, D); cam.lookAt(0, H * 0.5, 0); cam.updateMatrixWorld(true);
  while (ai.length) {
    const a = ai[0];
    if (age >= a - 1e-6) {
      const k = Math.min(1, Math.max(0, (age - DIS.hold) / (DIS.end - DIS.hold))), f = Math.max(0.001, 1 - k * Math.sqrt(k)), up = H * (0.5 * (1 - f) + 0.16 * k);
      body.visible = age < 1.5; body.scale.setScalar((H / 4.8) * f); body.position.set(0, (H / 4.8) * 2.4 * f + up, 0); R.render(scene, cam); out.push(R.domElement.toDataURL('image/png')); ai.shift(); continue;
    }
    age += TICK; const k = Math.min(1, Math.max(0, (age - DIS.hold) / (DIS.end - DIS.hold)));
    if (age >= DIS.hold) {
      const cy = H * 0.5 * (1 + 0.3 * k);
      if (!flashed) { flashed = true; fx.flash(0, cy, 0, H * (0.8 + 0.14 * ti), rgb); }
      if (k < 1) { acc += DIS.n[ti] * (TICK / (DIS.end - DIS.hold)) * ncount; const m = Math.floor(acc); if (m > 0) { acc -= m; fx.dissolve(0, cy, 0, H * (0.5 + 0.5 * (1 - k)), rgb, m); } }
    }
    fx.update(TICK, cam);
  }
  return out;
};
window.__labReady = true;
