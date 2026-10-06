// Footprints in the water (p30): a wading giant leaves soft expanding rings and a little spray at every step it takes through the moat or the river.
// Pooled (14 rings, hidden when idle = no draw cost).  wake.update(units, dt, t)
import * as THREE from 'three';

function ringTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 18, 64, 64, 63);
  r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.5, 'rgba(235,248,255,0)'); r.addColorStop(0.72, 'rgba(235,248,255,.9)'); r.addColorStop(0.86, 'rgba(210,235,255,.35)'); r.addColorStop(1, 'rgba(210,235,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createWake({ scene, fx, isWet, waterY = -0.72 }) {
  const tex = ringTex(), geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
  const pool = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, fog: true })); m.visible = false; m.renderOrder = 4; m.frustumCulled = false; scene.add(m);
    pool.push({ m, age: 9, life: 1, r0: 1, r1: 4, delay: 0, on: false });
  }
  const spawn = (x, z, r0, r1, life, delay) => {
    const p = pool.find((q) => !q.on) || pool.reduce((a, b) => (a.age > b.age ? a : b));
    Object.assign(p, { age: 0, life, r0, r1, delay, on: true }); p.m.position.set(x, waterY + 0.03, z); p.m.visible = false;
  };
  const last = new Map();                                                         // unit id -> [x, z, distance walked since the last step]
  return {
    update(units, dt) {
      for (const u of units) {
        if (!u.wade || u.dead) continue;
        const L = last.get(u.id);
        if (!L) { last.set(u.id, [u.x, u.z, 0, 1]); continue; }
        const d = Math.hypot(u.x - L[0], u.z - L[1]); if (d > 1e-4) { L[4] = (u.x - L[0]) / d; L[5] = (u.z - L[1]) / d; } L[0] = u.x; L[1] = u.z;
        if (!isWet(u.x, u.z)) { L[2] = 0; continue; }
        L[2] += d;
        const stride = 3.4;
        if (L[2] >= stride) {
          L[2] -= stride; L[3] = -L[3];
          const hx = L[4] == null ? 1 : L[4], hz = L[5] == null ? 0 : L[5], fx0 = u.x - hz * 0.9 * L[3], fz0 = u.z + hx * 0.9 * L[3];
          spawn(fx0, fz0, 1.3, 6.4, 1.5, 0); spawn(fx0, fz0, 0.9, 4.4, 1.2, 0.16);
          fx.puff(fx0, waterY + 0.5, fz0, 5, 1.7, 2.0, [0.86, 0.94, 1.0], 0.9, 3.6);
        }
      }
      for (const p of pool) {
        if (!p.on) continue;
        p.age += dt; const a = p.age - p.delay;
        if (a < 0) continue;
        if (a >= p.life) { p.on = false; p.m.visible = false; continue; }
        const k = a / p.life; p.m.visible = true; p.m.scale.setScalar((p.r0 + (p.r1 - p.r0) * Math.sqrt(k)) * 2); p.m.material.opacity = 0.85 * (1 - k) * (1 - k * 0.3);
      }
    },
    dispose() { for (const p of pool) { scene.remove(p.m); p.m.material.dispose(); } geo.dispose(); tex.dispose(); },
  };
}
