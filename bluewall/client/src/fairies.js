// Fairies: tiny glowing sprites with fluttering wings and sparkle trails,
// drifting around the Blue Crystal and the gardens. Brighter at night.
import * as THREE from 'three';
import { Particles } from './fx.js';
import { rng } from './noise.js';

function wingTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(40, 70, 4, 60, 60, 64);
  gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(64, 56, 60, 40, -0.5, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2;
  for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(8, 100); g.quadraticCurveTo(50, 60 - k * 10, 110, 30 + k * 18); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildFairies(scene, M, spots) {
  const r = rng(515), wt = wingTexture(), group = new THREE.Group(); scene.add(group);
  const COLS = [0xff8ad8, 0x8ae8ff, 0xffe28a, 0xb8ff9a, 0xc8a8ff];
  const sparks = new Particles(scene, { count: 360, tex: M.glowWhite, color: [1.2, 1.1, 1.4] });
  const F = [];
  spots.forEach(([cx, cy, cz, n, rad]) => {
    for (let i = 0; i < n; i++) {
      const col = new THREE.Color(COLS[(r() * COLS.length) | 0]);
      const f = new THREE.Group();
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowWhite, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
      glow.scale.setScalar(2.4);
      const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowWhite, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      core.scale.setScalar(0.55);
      const wm = new THREE.MeshBasicMaterial({ map: wt, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const wg = new THREE.PlaneGeometry(0.9, 0.75); wg.translate(0.42, 0.12, 0);
      const wl = new THREE.Mesh(wg, wm), wr = new THREE.Mesh(wg, wm); wr.scale.x = -1;
      f.add(glow, core, wl, wr); group.add(f);
      F.push({ f, glow, wl, wr, col, cx, cy, cz, rad: rad * (0.5 + r() * 0.6), sp: 0.25 + r() * 0.35, ph: r() * 6.28, hh: 1 + r() * 3, acc: 0, last: new THREE.Vector3() });
    }
  });
  let night = 1;
  return {
    setNight(n) { night = n; group.visible = n > 0.3; },   // fairies come out at dusk (and cost nothing by day)
    update(t, dt) {
      if (!group.visible) { sparks.update(dt, 0.98, -0.05); return; }
      const k = 0.35 + 0.65 * night;
      for (const q of F) {
        const a = t * q.sp + q.ph;
        const x = q.cx + Math.cos(a) * q.rad + Math.sin(a * 2.3) * 1.5;
        const z = q.cz + Math.sin(a * 1.3) * q.rad * 0.8;
        const y = q.cy + q.hh + Math.sin(t * 1.9 + q.ph) * 0.9;
        q.last.copy(q.f.position); q.f.position.set(x, y, z);
        q.f.rotation.y = Math.atan2(x - q.last.x, z - q.last.z);
        const flap = 0.35 + 0.9 * Math.abs(Math.sin(t * 26 + q.ph));
        q.wl.rotation.y = flap; q.wr.rotation.y = -flap;
        q.glow.material.opacity = 0.75 * k; q.glow.scale.setScalar(2.2 + 0.4 * Math.sin(t * 6 + q.ph));
        q.acc += dt * 14;
        while (q.acc > 1) { q.acc -= 1; sparks.emit(x, y, z, (Math.random() - 0.5) * 0.3, -0.25 - Math.random() * 0.3, (Math.random() - 0.5) * 0.3, 1.2 + Math.random(), 0.28, 0, 0.8 * k); }
      }
      sparks.update(dt, 0.98, -0.05);
    },
  };
}
