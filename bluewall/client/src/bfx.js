// Battle effects: GPU point-sprite particles (smoke, dust, fire, sparks, blood-free puffs), flying projectiles (arrows, ballista bolts,
// catapult rocks) and tumbling debris. Everything is pooled and drawn with a handful of draw calls:
//   particles: 2 draws (alpha-blended smoke / additive fire),  projectiles: 3 draws (instanced),  debris: 1 draw (instanced)
//   const fx = createFX(scene, { scale: PX.scale });   fx.update(dt, camera);
//   fx.puff(x,y,z,...)  fx.fire(...)  fx.spark(...)  fx.shoot({kind, from, to, t})  fx.debris(x,y,z,w,h,d,color,count)
import * as THREE from 'three';
import { gemGeometry, gemMaterial, GEM_LOOK } from './gemgeo.js';
import { createRuins } from './ruins.js';

const rnd = Math.random, lerp = (a, b, k) => a + (b - a) * k;
// dragon fire by colour (glow start, glow end, smoke start, smoke end): the big dragon and the baby dragon breathe orange (they are red), the dragonling shoots fireballs (KIND.fireball)
const STREAM = {
  blue: [[0.45, 0.78, 1.0, 0.95], [0.2, 0.4, 1.0, 0], [0.3, 0.55, 1.0, 0.25], [0.25, 0.3, 0.5, 0]],
  red: [[1.0, 0.42, 0.16, 0.95], [0.85, 0.08, 0.02, 0], [0.75, 0.22, 0.08, 0.25], [0.32, 0.18, 0.14, 0]],
  green: [[0.62, 1.0, 0.45, 0.95], [0.1, 0.75, 0.25, 0], [0.35, 0.85, 0.4, 0.25], [0.2, 0.32, 0.22, 0]],
  orange: [[1.0, 0.62, 0.15, 0.95], [0.9, 0.25, 0.03, 0], [0.5, 0.36, 0.26, 0.25], [0.28, 0.24, 0.2, 0]],      // the red dragons' breath (owner 4 Oct 21:51)
  shadow: [[0.5, 0.4, 1.0, 0.95], [0.12, 0.06, 0.5, 0], [0.1, 0.08, 0.2, 0.45], [0.05, 0.04, 0.1, 0]],      // the dark rider's shadow fire (p35): a deep violet-blue flame, dark smoke
};

function canvasTex(draw, size = 64) {
  const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function softTex() {
  return canvasTex((g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, s, s); });
}
function puffTex() {                                   // a lumpy cloud: several soft blobs
  return canvasTex((g, s) => {
    let seed = 7; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 9; i++) {
      const x = s * (0.3 + R() * 0.4), y = s * (0.3 + R() * 0.4), r = s * (0.16 + R() * 0.16), gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s);
    }
  }, 128);
}

class Pool {
  constructor(scene, { n = 900, additive = false, tex, scale }) {
    this.n = n; this.i = 0;
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 4); this.size = new Float32Array(n);
    this.age = new Float32Array(n).fill(9e9); this.life = new Float32Array(n).fill(1);
    this.vel = new Float32Array(n * 3); this.s0 = new Float32Array(n); this.s1 = new Float32Array(n);
    this.c0 = new Float32Array(n * 4); this.c1 = new Float32Array(n * 4); this.grav = new Float32Array(n); this.drag = new Float32Array(n);
    const g = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage); this.aCol = new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage); this.aSize = new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.aPos); g.setAttribute('aCol', this.aCol); g.setAttribute('aSize', this.aSize);
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false,
      uniforms: { uTex: { value: tex }, uScale: scale },
      vertexShader: `attribute vec4 aCol; attribute float aSize; uniform float uScale; varying vec4 vC;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = min(160.0, aSize * uScale / max(0.5, -mv.z)); vC = aCol; }`,
      fragmentShader: `uniform sampler2D uTex; varying vec4 vC; void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vC.rgb, vC.a * t.a); }`,
    });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = additive ? 6 : 5; scene.add(this.points);
  }
  spawn(x, y, z, vx, vy, vz, life, s0, s1, c0, c1, grav = 0, drag = 0) {
    const i = this.i; this.i = (i + 1) % this.n;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.age[i] = 0; this.life[i] = life; this.s0[i] = s0; this.s1[i] = s1; this.grav[i] = grav; this.drag[i] = drag;
    for (let k = 0; k < 4; k++) { this.c0[i * 4 + k] = c0[k]; this.c1[i * 4 + k] = c1[k]; }
  }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      const a = this.age[i];
      if (a >= this.life[i]) { this.col[i * 4 + 3] = 0; this.size[i] = 0; continue; }
      this.age[i] = a + dt; const k = (a + dt) / this.life[i], i3 = i * 3, dr = Math.max(0, 1 - this.drag[i] * dt);
      this.vel[i3] *= dr; this.vel[i3 + 1] = this.vel[i3 + 1] * dr - this.grav[i] * dt; this.vel[i3 + 2] *= dr;
      this.pos[i3] += this.vel[i3] * dt; this.pos[i3 + 1] += this.vel[i3 + 1] * dt; this.pos[i3 + 2] += this.vel[i3 + 2] * dt;
      for (let c = 0; c < 4; c++) this.col[i * 4 + c] = lerp(this.c0[i * 4 + c], this.c1[i * 4 + c], k);
      this.size[i] = lerp(this.s0[i], this.s1[i], k);
    }
    this.aPos.needsUpdate = this.aCol.needsUpdate = this.aSize.needsUpdate = true;
  }
}

export function createFX(scene, { scale, height = () => 0 }) {
  const soft = new Pool(scene, { n: 1600, additive: false, tex: puffTex(), scale }), glow = new Pool(scene, { n: 900, additive: true, tex: softTex(), scale });
  const G = new THREE.Group(); scene.add(G);

  // ------------------------------------------------------------------ particle recipes
  const api = {
    // dust / smoke cloud (grey-brown), rises and expands
    puff(x, y, z, n = 6, size = 5, spread = 3, color = [0.62, 0.56, 0.48], life = 2.2, up = 2.2) {
      for (let i = 0; i < n; i++) soft.spawn(x + (rnd() - 0.5) * spread, y + rnd() * 0.5, z + (rnd() - 0.5) * spread, (rnd() - 0.5) * spread * 0.9, up * (0.5 + rnd()), (rnd() - 0.5) * spread * 0.9, life * (0.7 + rnd() * 0.6), size * 0.4, size * (1.3 + rnd() * 0.8), [color[0], color[1], color[2], 0.0], [color[0] * 0.8, color[1] * 0.8, color[2] * 0.8, 0], -0.1, 0.6);
      // fade in then out by using c0 alpha 0.55 via second spawn trick: set start alpha now
    },
    dust(x, y, z, n = 8, size = 5, spread = 4, life = 2.6) {
      for (let i = 0; i < n; i++) soft.spawn(x + (rnd() - 0.5) * spread, y + rnd() * 1.2, z + (rnd() - 0.5) * spread, (rnd() - 0.5) * spread * 1.2, 1.2 + rnd() * 2.4, (rnd() - 0.5) * spread * 1.2, life * (0.7 + rnd() * 0.6), size * 0.45, size * (1.2 + rnd()), [0.66, 0.6, 0.52, 0.55], [0.55, 0.5, 0.44, 0], -0.2, 0.7);
    },
    smoke(x, y, z, n = 1, size = 4, life = 4.5, dark = 0.2) {
      for (let i = 0; i < n; i++) soft.spawn(x + (rnd() - 0.5) * 1.4, y, z + (rnd() - 0.5) * 1.4, (rnd() - 0.5) * 1.4 + 1.2, 3 + rnd() * 2, (rnd() - 0.5) * 1.4, life * (0.7 + rnd() * 0.6), size * 0.4, size * 1.9, [dark, dark, dark * 1.05, 0.5], [dark * 1.5, dark * 1.5, dark * 1.6, 0], -0.2, 0.25);
    },
    fire(x, y, z, n = 1, size = 2.6, life = 0.9) {
      for (let i = 0; i < n; i++) glow.spawn(x + (rnd() - 0.5) * size * 0.6, y, z + (rnd() - 0.5) * size * 0.6, (rnd() - 0.5) * 0.8, 3 + rnd() * 3, (rnd() - 0.5) * 0.8, life * (0.6 + rnd() * 0.6), size * 0.8, size * 0.25, [1.0, 0.62, 0.2, 0.9], [0.9, 0.12, 0.02, 0], -1.0, 0.5);
    },
    spark(x, y, z, n = 6, speed = 8, color = [1, 0.8, 0.4]) {
      for (let i = 0; i < n; i++) { const a = rnd() * 6.28, up = 0.3 + rnd(), sp = speed * (0.4 + rnd() * 0.8); glow.spawn(x, y, z, Math.cos(a) * sp, up * sp, Math.sin(a) * sp, 0.35 + rnd() * 0.4, 0.5, 0.1, [color[0], color[1], color[2], 1], [color[0], color[1] * 0.5, 0, 0], 22, 0.5); }
    },
    flash(x, y, z, size = 6, color = [1, 0.8, 0.5]) { glow.spawn(x, y, z, 0, 0, 0, 0.18, size, size * 0.4, [color[0], color[1], color[2], 0.9], [color[0], color[1], color[2], 0]); },
    // ---- spells
    // lightning: a jagged bolt from the sky to (x, gy, z)
    bolt(x, gy, z) {
      const N = 14, top = [x + (rnd() - 0.5) * 22, gy + 100, z + (rnd() - 0.5) * 22], pts = [];
      for (let i = 0; i <= N; i++) { const t = i / N, j = (1 - t) * 6 * (i === N ? 0 : 1); pts.push([lerp(top[0], x, t) + (rnd() - 0.5) * j, lerp(top[1], gy, t), lerp(top[2], z, t) + (rnd() - 0.5) * j]); }
      for (let i = 0; i < N; i++) for (let k = 0; k < 7; k++) { const u = k / 7, a = pts[i], b = pts[i + 1]; glow.spawn(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), 0, 0, 0, 0.22 + rnd() * 0.14, 2.6, 0.5, [0.88, 0.94, 1, 1], [0.45, 0.62, 1, 0]); }
      glow.spawn(x, gy + 1.5, z, 0, 0, 0, 0.3, 26, 8, [0.85, 0.92, 1, 0.95], [0.5, 0.65, 1, 0]);
      api.spark(x, gy + 1.5, z, 16, 14, [0.7, 0.85, 1]); api.dust(x, gy + 0.4, z, 5, 5, 5, 1.6);
    },
    // Tesla chain lightning: a jagged electric arc through every point (orb -> first foe -> next ...), white core + blue halo, sparks where it lands
    zap(pts) {
      for (let s = 0; s + 1 < pts.length; s++) {
        const a = pts[s], b = pts[s + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), N = Math.max(6, Math.min(16, Math.round(d / 2.2))), P = [];
        for (let i = 0; i <= N; i++) { const t = i / N, j = (i === 0 || i === N) ? 0 : 1.6; P.push([lerp(a[0], b[0], t) + (rnd() - 0.5) * j, lerp(a[1], b[1], t) + (rnd() - 0.5) * j, lerp(a[2], b[2], t) + (rnd() - 0.5) * j]); }
        for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) { const u = k / 4, p = P[i], q = P[i + 1]; glow.spawn(lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u), 0, 0, 0, 0.16 + rnd() * 0.1, s ? 1.5 : 1.9, 0.4, [0.92, 0.97, 1, 1], [0.35, 0.6, 1, 0]); }
        api.spark(b[0], b[1], b[2], 6, 9, [0.65, 0.85, 1]);
      }
      if (pts[0]) glow.spawn(pts[0][0], pts[0][1], pts[0][2], 0, 0, 0, 0.22, 7, 3, [0.8, 0.95, 1, 0.95], [0.35, 0.6, 1, 0]);
    },
    // a ring of glowing motes on the ground
    ring(x, y, z, r, color = [1, 1, 1], n = 40, life = 0.8, up = 0, size = 1.8) {
      for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + rnd() * 0.1; glow.spawn(x + Math.cos(a) * r, y + 0.4, z + Math.sin(a) * r, 0, up, 0, life, size, size * 0.5, [color[0], color[1], color[2], 0.9], [color[0], color[1], color[2], 0]); }
    },
    // a zone that lasts (heal / rage): call every frame, z = {type, x, y, z, r, acc}
    zone(zn, dt) {
      const heal = zn.type === 'heal', c0 = heal ? [0.35, 1, 0.55, 0.9] : [1, 0.38, 0.14, 0.9], c1 = heal ? [0.15, 0.85, 0.35, 0] : [0.9, 0.1, 0.02, 0];
      zn.acc = (zn.acc || 0) + dt * (zn.r * 3.2);
      while (zn.acc > 1) { zn.acc -= 1; const a = rnd() * 6.283, rr = Math.sqrt(rnd()) * zn.r; glow.spawn(zn.x + Math.cos(a) * rr, zn.y + 0.5, zn.z + Math.sin(a) * rr, 0, (heal ? 3 : 5) + rnd() * 3, 0, 0.9 + rnd() * 0.6, heal ? 1.7 : 2.2, 0.3, c0, c1, 0, 0.1); }
    },
    frost(x, y, z, r) {
      for (let i = 0; i < 110; i++) { const a = rnd() * 6.283, sp = r * (0.5 + rnd() * 1.1); glow.spawn(x, y + 1, z, Math.cos(a) * sp, 2 + rnd() * 6, Math.sin(a) * sp, 0.7 + rnd() * 0.6, 1.8, 0.4, [0.7, 0.93, 1, 1], [0.4, 0.75, 1, 0], 4, 1.2); }
      api.ring(x, y, z, r, [0.65, 0.9, 1], 56, 1.2, 0.4, 2.4); api.flash(x, y + 2, z, r * 1.2, [0.6, 0.85, 1]);
    },
    ice(x, y, z, h) { for (let i = 0; i < 26; i++) glow.spawn(x + (rnd() - 0.5) * 5, y + rnd() * h, z + (rnd() - 0.5) * 5, 0, 0.6, 0, 1.6 + rnd(), 1.6, 0.5, [0.7, 0.93, 1, 0.9], [0.5, 0.8, 1, 0]); },
    quake(x, y, z, r) {
      for (let i = 0; i < 30; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * r; soft.spawn(x + Math.cos(a) * d, y + 0.5, z + Math.sin(a) * d, (rnd() - 0.5) * 3, 2 + rnd() * 3, (rnd() - 0.5) * 3, 2.2 + rnd(), 3, 9, [0.62, 0.55, 0.46, 0.5], [0.55, 0.5, 0.42, 0], 0, 0.5); }
      api.ring(x, y, z, r * 0.45, [0.9, 0.7, 0.45], 44, 0.9, 0.2, 2.4); api.ring(x, y, z, r * 0.85, [0.9, 0.7, 0.45], 70, 1.1, 0.2, 2.4);
    },
    // dragon fire: a stream from `from` toward `to` (call every frame while breathing)
    stream(from, to, big = false, col = 'blue') {
      const C = STREAM[col] || STREAM.blue;
      const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2], d = Math.hypot(dx, dy, dz) || 1, sp = (big ? 46 : 36), n = big ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const k = rnd() * 0.12;
        glow.spawn(from[0] + dx * k, from[1] + dy * k, from[2] + dz * k, dx / d * sp + (rnd() - 0.5) * 5, dy / d * sp + (rnd() - 0.5) * 5 - 2, dz / d * sp + (rnd() - 0.5) * 5, d / sp * (0.8 + rnd() * 0.3), (big ? 2.4 : 1.6), (big ? 5.5 : 3.6), C[0], C[1], 0, 0.2);
        if (rnd() < 0.5) soft.spawn(from[0] + dx * k, from[1] + dy * k, from[2] + dz * k, dx / d * sp * 0.7 + (rnd() - 0.5) * 4, dy / d * sp * 0.7, dz / d * sp * 0.7 + (rnd() - 0.5) * 4, d / sp * 1.2, 1.5, 4.2, C[2], C[3], 0, 0.3);
      }
    },
  };
  // the soft pool needs an initial alpha: wrap spawn so puff() starts visible
  const spawn0 = soft.spawn.bind(soft);
  soft.spawn = (x, y, z, vx, vy, vz, life, s0, s1, c0, c1, grav, drag) => spawn0(x, y, z, vx, vy, vz, life, s0, s1, c0[3] === 0 && c1[3] === 0 ? [c0[0], c0[1], c0[2], 0.5] : c0, c1, grav, drag);

  // ------------------------------------------------------------------ projectiles (instanced)
  const KIND = {
    arrow: { geo: (() => { const g = new THREE.CylinderGeometry(0.05, 0.05, 1.7, 4); g.rotateX(Math.PI / 2); const h = new THREE.ConeGeometry(0.14, 0.4, 4); h.rotateX(Math.PI / 2); h.translate(0, 0, 0.95); const f = new THREE.BoxGeometry(0.02, 0.4, 0.5); f.translate(0, 0, -0.75); return mergeG([g, h, f]); })(), mat: new THREE.MeshStandardMaterial({ color: 0xcdb48a, roughness: 0.7 }), cap: 140, arc: 0.08 },
    bolt: { geo: (() => { const g = new THREE.CylinderGeometry(0.12, 0.12, 4.2, 5); g.rotateX(Math.PI / 2); const h = new THREE.ConeGeometry(0.4, 1.0, 5); h.rotateX(Math.PI / 2); h.translate(0, 0, 2.5); return mergeG([g, h]); })(), mat: new THREE.MeshStandardMaterial({ color: 0x6a5238, roughness: 0.6, metalness: 0.3 }), cap: 40, arc: 0.02 },
    rock: { geo: new THREE.DodecahedronGeometry(0.9, 0), mat: new THREE.MeshStandardMaterial({ color: 0x777670, roughness: 0.95 }), cap: 30, arc: 0.45 },
    ball: { geo: new THREE.SphereGeometry(0.62, 8, 6), mat: new THREE.MeshStandardMaterial({ color: 0x23272e, roughness: 0.4, metalness: 0.7 }), cap: 30, arc: 0.1, trail: [0.5, 0.5, 0.52] },
    orb: { geo: new THREE.IcosahedronGeometry(0.55, 1), mat: new THREE.MeshBasicMaterial({ color: 0xc9a8ff }), cap: 60, arc: 0.06, trail: [0.62, 0.45, 1], glow: true },
    // the dragonling's yellow fireball: a hot yellow core with a bright halo and an orange tail; it ends in an orange puff with embers
    // p35 the frost spire's shard: a long ice crystal, bright white-blue with a cold glowing trail; it bursts into a ring of frost motes
    frost: { geo: (() => { const g = new THREE.ConeGeometry(0.34, 2.6, 6); g.rotateX(Math.PI / 2); g.translate(0, 0, 0.6); const t = new THREE.ConeGeometry(0.34, 1.6, 6); t.rotateX(-Math.PI / 2); t.translate(0, 0, -1.4); return mergeG([g, t]); })(), mat: new THREE.MeshBasicMaterial({ color: 0xcdf1ff, toneMapped: false }), cap: 36, arc: 0.08, trail: [0.5, 0.82, 1], glow: true, ice: true },
    fireball: { geo: new THREE.IcosahedronGeometry(0.95, 1), mat: new THREE.MeshBasicMaterial({ color: 0xffe45a, toneMapped: false }), cap: 48, arc: 0.05, trail: [1.0, 0.58, 0.1], glow: true, fire: true },
  };
  function mergeG(list) { // tiny merge without BufferGeometryUtils (all non-indexed)
    const ps = [], ns = []; for (let g of list) { g = g.index ? g.toNonIndexed() : g; ps.push(g.attributes.position.array); ns.push(g.attributes.normal.array); }
    const cat = (a) => { const n = a.reduce((s, x) => s + x.length, 0), o = new Float32Array(n); let k = 0; for (const x of a) { o.set(x, k); k += x.length; } return o; };
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(cat(ps), 3)); out.setAttribute('normal', new THREE.BufferAttribute(cat(ns), 3)); return out;
  }
  const proj = {};
  for (const [k, d] of Object.entries(KIND)) { const im = new THREE.InstancedMesh(d.geo, d.mat, d.cap); im.count = 0; im.frustumCulled = false; im.castShadow = false; G.add(im); proj[k] = { im, list: [], d }; }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _a = new THREE.Vector3(), _b = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1), Z_Y = new THREE.Vector3(0, 1, 0);
  api.shoot = ({ kind = 'arrow', from, to, t = 0.6, trail = false }) => {
    const P = proj[kind]; if (!P) return; if (P.list.length >= P.d.cap) P.list.shift();
    P.list.push({ from: [...from], to: [...to], t: Math.max(0.12, t), age: 0, trail });
  };
  function updateProj(dt) {
    for (const P of Object.values(proj)) {
      const L = P.list; let n = 0;
      for (let i = L.length - 1; i >= 0; i--) {
        const s = L[i]; s.age += dt;
        if (s.age >= s.t) {
          if (P.d.fire) { api.flash(s.to[0], s.to[1] + 0.6, s.to[2], 6, [1, 0.74, 0.22]); api.spark(s.to[0], s.to[1] + 0.6, s.to[2], 9, 10, [1, 0.62, 0.16]); api.puff(s.to[0], s.to[1] + 0.8, s.to[2], 3, 2.6, 1.6, [0.5, 0.36, 0.26], 1.1, 2.4); api.fire(s.to[0], s.to[1] + 0.4, s.to[2], 3, 2.4, 0.7); }
          else if (P.d.ice) { api.flash(s.to[0], s.to[1] + 0.6, s.to[2], 6, [0.6, 0.85, 1]); api.spark(s.to[0], s.to[1] + 0.6, s.to[2], 12, 8, [0.7, 0.9, 1]); api.ring(s.to[0], s.to[1] + 0.3, s.to[2], 3.2, [0.65, 0.9, 1], 30, 0.7, 0.6, 1.6); }
          else if (P.d.glow) { api.flash(s.to[0], s.to[1], s.to[2], 7, [0.72, 0.5, 1]); api.ring(s.to[0], s.to[1] + 0.3, s.to[2], 2.6, [0.7, 0.5, 1], 22, 0.45, 0.4, 1.3); }
          else if (P.d.trail && s.trail) { api.flash(s.to[0], s.to[1], s.to[2], 5, [1, 0.75, 0.4]); api.puff(s.to[0], s.to[1] + 0.5, s.to[2], 5, 3.2, 3); }
          L.splice(i, 1);
        }
      }
      for (const s of L) {
        const k = s.age / s.t, arc = P.d.arc * Math.hypot(s.to[0] - s.from[0], s.to[2] - s.from[2]);
        const x = lerp(s.from[0], s.to[0], k), z = lerp(s.from[2], s.to[2], k), y = lerp(s.from[1], s.to[1], k) + 4 * arc * k * (1 - k);
        const k2 = Math.min(1, k + 0.03), x2 = lerp(s.from[0], s.to[0], k2), z2 = lerp(s.from[2], s.to[2], k2), y2 = lerp(s.from[1], s.to[1], k2) + 4 * arc * k2 * (1 - k2);
        _a.set(x, y, z); _b.set(x2 - x, y2 - y, z2 - z); if (_b.lengthSq() < 1e-8) _b.set(0, -1, 0); _b.normalize();
        _q.setFromUnitVectors(Z, _b); _m.compose(_a, _q, _s); P.im.setMatrixAt(n++, _m);
        if (P.d.fire) { glow.spawn(x, y, z, 0, 0, 0, 0.1, 5.2, 2.6, [1, 0.62, 0.14, 0.8], [1, 0.4, 0.08, 0]); glow.spawn(x, y, z, 0, 0, 0, 0.08, 2.6, 1.4, [1, 0.92, 0.5, 0.9], [1, 0.7, 0.2, 0]); }       // (the bright halo of the head, every frame)
        if (s.trail && Math.random() < 0.7) {
          if (P.d.glow) { const c = P.d.trail; glow.spawn(x, y, z, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, P.d.fire ? 0.5 : 0.35, P.d.fire ? 2.4 : 1.1, 0.2, [c[0], c[1], c[2], 0.8], [c[0] * 0.6, c[1] * 0.5, c[2], 0]); }
          else { const c = P.d.trail || [0.7, 0.7, 0.7]; soft.spawn(x, y, z, 0, 0.5, 0, 0.8, 0.8, 1.6, [c[0], c[1], c[2], 0.35], [c[0], c[1], c[2], 0], 0, 0.5); }
        }
      }
      P.im.count = n; P.im.instanceMatrix.needsUpdate = true; P.im.visible = n > 0;
    }
  }

  // ------------------------------------------------------------------ debris, rubble, soot, gems
  // Flying chunks (icosahedra, a bit of physics) come to rest and are then handed over to the rubble heap: permanent instanced stones / beams that stay where the
  // building fell until the battle ends (one draw call each, the matrices are written once).  A soot decal darkens the ground under the heap.
  const PAL = {
    stone: [0x8a91a2, 0x6e7586, 0xa3a8b5, 0x5c6272, 0x7d8494],
    roof: [0x7e4638, 0x93573f, 0x6a3a30],
    wood: [0x5a4030, 0x6b4a30, 0x3d2b20, 0x7a5a3a],
    plaster: [0xcfc3a8, 0xb8ab90, 0xa89c84],
    cream: [0xd9d4c6, 0xbfb9aa, 0xa7a294],
  };
  const MIX = {
    keep: [['stone', 6], ['wood', 2], ['roof', 1]], tower: [['stone', 6], ['roof', 1], ['wood', 1]], ballista: [['stone', 5], ['wood', 3]], wall: [['stone', 8], ['cream', 1]], gate: [['stone', 5], ['wood', 4]],
    house: [['plaster', 4], ['roof', 4], ['wood', 3], ['stone', 2]], church: [['stone', 5], ['roof', 3], ['cream', 2]], vault: [['cream', 5], ['stone', 3]],
    mine: [['stone', 5], ['wood', 4]], barracks: [['wood', 4], ['stone', 4], ['roof', 2]], training: [['wood', 5], ['stone', 3]], forge: [['stone', 5], ['wood', 3]], stable: [['wood', 6], ['roof', 2]], workshop: [['wood', 6], ['stone', 3]], lair: [['stone', 7], ['wood', 2]],
  };
  const pickCol = (type) => {
    const mix = MIX[type] || MIX.house; let tot = 0; for (const m of mix) tot += m[1]; let r = rnd() * tot, key = mix[0][0];
    for (const m of mix) { r -= m[1]; if (r <= 0) { key = m[0]; break; } }
    const pal = PAL[key]; return { c: pal[(rnd() * pal.length) | 0], wood: key === 'wood' };
  };
  const DN = 300, dgeo = new THREE.IcosahedronGeometry(0.5, 0), dmat = new THREE.MeshStandardMaterial({ roughness: 0.92, flatShading: true, color: 0xffffff, envMapIntensity: 0.3 });
  const dim = new THREE.InstancedMesh(dgeo, dmat, DN); dim.count = 0; dim.frustumCulled = false; dim.castShadow = false; G.add(dim);
  dim.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(DN * 3), 3);
  const RN = 5200, PN = 900;                                       // permanent stones / beams
  const rim = new THREE.InstancedMesh(dgeo, dmat, RN), pim = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), dmat, PN);
  for (const m of [rim, pim]) { m.count = 0; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false; m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array((m === rim ? RN : PN) * 3), 3); G.add(m); }
  const rub = { r: 0, p: 0, rn: 0, pn: 0, dirty: false };
  const ruins = createRuins(G, height);                          // the swap-in wreck of every fallen structure (ruins.js): 3 draw calls for the whole battle
  const chunks = []; const _c = new THREE.Color(), _e = new THREE.Euler();
  function addRubble(x, y, z, sx, sy, sz, rx, ry, rz, color, beam) {
    const im = beam ? pim : rim, cap = beam ? PN : RN, i = beam ? rub.p++ % PN : rub.r++ % RN;
    _q.setFromEuler(_e.set(rx, ry, rz)); _p.set(x, y, z); _s.set(sx, sy, sz); _m.compose(_p, _q, _s); im.setMatrixAt(i, _m); _c.setHex(color); im.setColorAt(i, _c);
    if (beam) rub.pn = Math.min(PN, rub.pn + 1); else rub.rn = Math.min(RN, rub.rn + 1);
    rub.dirty = true; void cap;
  }
  function flushRubble() {
    if (!rub.dirty) return; rub.dirty = false;
    rim.count = rub.rn; pim.count = rub.pn; rim.visible = rub.rn > 0; pim.visible = rub.pn > 0;
    for (const im of [rim, pim]) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
  }
  // soot / scorch decals: one soft dark disc per fallen building
  const sootTex = canvasTex((g, sz) => { const r = g.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2); r.addColorStop(0, 'rgba(18,14,12,0.78)'); r.addColorStop(0.55, 'rgba(26,20,16,0.5)'); r.addColorStop(1, 'rgba(30,24,20,0)'); g.fillStyle = r; g.fillRect(0, 0, sz, sz); }, 128);
  const SN = 160, soot = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: sootTex, transparent: true, depthWrite: false, fog: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), SN);
  soot.count = 0; soot.frustumCulled = false; soot.renderOrder = 2; G.add(soot); let sootN = 0;
  function addSoot(x, y, z, r, rot) { const i = sootN++ % SN; _q.setFromAxisAngle(Z_Y, rot); _p.set(x, y + 0.12, z); _s.set(r * 2, 1, r * 2); _m.compose(_p, _q, _s); soot.setMatrixAt(i, _m); soot.count = Math.min(SN, sootN); soot.instanceMatrix.needsUpdate = true; }

  api.debris = (x, y, z, w, h, d, color = 0x8a8a90, n = 14, power = 1, type = null) => {
    for (let i = 0; i < n; i++) {
      let col, wood = false; if (type) { const k = pickCol(type); col = k.c; wood = k.wood; } else col = _c.set(color).multiplyScalar(0.55 + rnd() * 0.6).getHex();
      const c = { x: x + (rnd() - 0.5) * w, y: y + rnd() * h, z: z + (rnd() - 0.5) * d, vx: (rnd() - 0.5) * 10 * power, vy: (2 + rnd() * 10) * power, vz: (rnd() - 0.5) * 10 * power, s: 0.45 + rnd() * rnd() * 2.0 * Math.min(1.6, power), rx: rnd() * 6, ry: rnd() * 6, rz: rnd() * 6, wx: (rnd() - 0.5) * 9, wy: (rnd() - 0.5) * 9, wz: (rnd() - 0.5) * 9, rest: 0, beam: wood && rnd() < 0.6, color: col };
      if (chunks.length >= DN) { const o = chunks.shift(); settle(o); } chunks.push(c);
    }
  };
  function settle(c) { const gy = height(c.x, c.z); if (c.beam) addRubble(c.x, gy + c.s * 0.14, c.z, c.s * 0.28, c.s * 0.28, c.s * 2.4, 0, c.ry, (rnd() - 0.5) * 0.3, c.color, true); else addRubble(c.x, gy + c.s * 0.3, c.z, c.s * (0.9 + rnd() * 0.5), c.s * (0.55 + rnd() * 0.4), c.s * (0.8 + rnd() * 0.5), c.rx, c.ry, c.rz, c.color, false); }
  // the heap a fallen building leaves: stones and beams piled in the footprint, higher in the middle
  api.heap = (type, x, z, w, d, h, rot) => {
    ruins.add(type, x, z, w, d, h, rot || 0);
    const gy = height(x, z), cr = Math.cos(rot || 0), sr = Math.sin(rot || 0), n = Math.max(6, Math.min(44, Math.round(w * d * 0.035 + h * 0.4))), top = Math.max(1.3, Math.min(5, h * 0.15));
    for (let i = 0; i < n; i++) {
      const u = (rnd() + rnd() - 1) * w * 0.6, v = (rnd() + rnd() - 1) * d * 0.6, edge = Math.max(Math.abs(u) / (w * 0.5), Math.abs(v) / (d * 0.5)), hh = top * Math.max(0, 1 - edge * 0.8);
      const px = x + u * cr + v * sr, pz = z - u * sr + v * cr, sz = (0.5 + rnd() * rnd() * 2.2) * (1 + h / 70), k = pickCol(type), y = height(px, pz) + rnd() * hh + sz * 0.25;
      if (k.wood && rnd() < 0.55) addRubble(px, y, pz, sz * 0.26, sz * 0.26, sz * (1.6 + rnd() * 1.8), (rnd() - 0.5) * 0.5, rnd() * 6.28, (rnd() - 0.5) * 0.5, k.c, true);
      else addRubble(px, y, pz, sz * (0.8 + rnd() * 0.6), sz * (0.5 + rnd() * 0.45), sz * (0.75 + rnd() * 0.6), rnd() * 6, rnd() * 6, rnd() * 6, k.c, false);
    }
    addSoot(x, gy, z, Math.max(w, d) * 0.85, rnd() * 6.28);
  };
  function updateDebris(dt) {
    let n = 0;
    for (let i = chunks.length - 1; i >= 0; i--) {
      const c = chunks[i], gy = height(c.x, c.z) + c.s * 0.32;
      if (c.y > gy || c.vy > 0) {
        c.vy -= 26 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; c.rx += c.wx * dt; c.ry += c.wy * dt; c.rz += c.wz * dt;
        if (c.y < gy) { c.y = gy; c.vy *= -0.28; c.vx *= 0.55; c.vz *= 0.55; c.wx *= 0.4; c.wy *= 0.4; c.wz *= 0.4; if (Math.abs(c.vy) < 1.2) c.vy = 0; }
      } else { c.rest += dt; c.vx *= 0.8; c.vz *= 0.8; if (c.rest > 0.5) { settle(c); chunks.splice(i, 1); continue; } }
    }
    for (const c of chunks) {
      _q.setFromEuler(_e.set(c.rx, c.ry, c.rz)); _p.set(c.x, c.y, c.z); if (c.beam) _s.set(c.s * 0.28, c.s * 0.28, c.s * 2.2); else _s.set(c.s, c.s * 0.7, c.s * 0.9); _m.compose(_p, _q, _s); dim.setMatrixAt(n, _m); _c.setHex(c.color); dim.setColorAt(n, _c); n++;
    }
    _s.set(1, 1, 1); dim.count = n; dim.instanceMatrix.needsUpdate = true; if (dim.instanceColor) dim.instanceColor.needsUpdate = true; dim.visible = n > 0;
    flushRubble();
  }

  // ---- gems (a vault bursting): one instanced mesh per kind, pre-warmed with a zero-size instance so the shader compiles while the loading screen is up
  const GM = {}; let warm = 3;
  for (const k of ['ruby', 'emerald', 'turq']) {
    const im = new THREE.InstancedMesh(gemGeometry(k), gemMaterial(k, { envMapIntensity: 1.2, glow: 0.5 }), 72); im.frustumCulled = false; im.castShadow = false; im.count = 1;
    im.setMatrixAt(0, new THREE.Matrix4().makeScale(1e-4, 1e-4, 1e-4)); im.instanceMatrix.needsUpdate = true; G.add(im); GM[k] = { im, list: [] };
  }
  const GCOL = { ruby: [1, 0.25, 0.38], emerald: [0.3, 1, 0.55], turq: [0.35, 0.82, 1] };
  api.gemBurst = (kind, x, y, z, n = 16, power = 1, size = 1) => {
    const P = GM[kind]; if (!P) return;
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.283, sp = (3 + rnd() * 9) * power;
      if (P.list.length >= 72) P.list.shift();
      P.list.push({ x: x + (rnd() - 0.5) * 3, y: y + rnd() * 2, z: z + (rnd() - 0.5) * 3, vx: Math.cos(a) * sp, vy: (7 + rnd() * 12) * power, vz: Math.sin(a) * sp, s: (0.5 + rnd() * 0.7) * size, rx: rnd() * 6, ry: rnd() * 6, rz: rnd() * 6, wx: (rnd() - 0.5) * 12, wy: (rnd() - 0.5) * 12, wz: (rnd() - 0.5) * 12, age: 0, life: 7 + rnd() * 4, trail: rnd() < 0.5 });
    }
  };
  function updateGems(dt) {
    if (warm > 0 && --warm === 0) for (const k in GM) { GM[k].im.count = 0; GM[k].im.visible = false; }
    if (warm > 0) return;
    for (const k in GM) {
      const P = GM[k], L = P.list, col = GCOL[k]; let n = 0;
      for (let i = L.length - 1; i >= 0; i--) {
        const g = L[i]; g.age += dt; if (g.age > g.life) { L.splice(i, 1); continue; }
        const gy = height(g.x, g.z) + g.s * 0.6;
        if (g.y > gy || g.vy > 0) { g.vy -= 24 * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.z += g.vz * dt; g.rx += g.wx * dt; g.ry += g.wy * dt; g.rz += g.wz * dt; if (g.y < gy) { g.y = gy; g.vy *= -0.4; g.vx *= 0.6; g.vz *= 0.6; g.wx *= 0.4; g.wy *= 0.4; g.wz *= 0.4; if (Math.abs(g.vy) < 1.5) g.vy = 0; } }
        if (g.trail && g.age < 1.4 && rnd() < 0.5) glow.spawn(g.x, g.y, g.z, 0, 0.5, 0, 0.45, 1.4 * g.s, 0.2, [col[0], col[1], col[2], 0.7], [col[0], col[1], col[2], 0]);
        if (g.vy === 0 && rnd() < dt * 1.4) glow.spawn(g.x, g.y + 0.5, g.z, 0, 0.8, 0, 0.5, 1.5, 0.2, [1, 1, 1, 0.9], [col[0], col[1], col[2], 0]);       // a glint now and then
        const fade = g.age > g.life - 1 ? Math.max(0.01, g.life - g.age) : 1;
        _q.setFromEuler(_e.set(g.rx, g.ry, g.rz)); _p.set(g.x, g.y, g.z); _s.set(g.s * fade, g.s * fade, g.s * fade); _m.compose(_p, _q, _s); P.im.setMatrixAt(n++, _m);
      }
      _s.set(1, 1, 1); P.im.count = n; P.im.visible = n > 0; P.im.instanceMatrix.needsUpdate = true;
    }
  }

  // ---- a building falling: tremble (dust shakes loose), the main crash, the dust wave rolling out, then the heap and soot.  `dur` = the shader's collapse time.
  const later = [];
  api.later = (t, fn) => later.push({ t, fn });
  api.collapse = (e, dur = 1.6) => {
    const gy = height(e.x, e.z), R = Math.max(e.w, e.d) * 0.5, big = e.type === 'keep' || e.type === 'church', wall = e.type === 'wall' || e.type === 'gate', hh = e.h;
    const k = big ? 1.6 : wall ? 0.7 : 1;
    // 0: the first crack - dust shakes loose all over the roof line, sparks, a flash
    api.flash(e.x, gy + hh * 0.45, e.z, Math.min(R * 1.6, 11), [0.95, 0.72, 0.5]);       // (capped: a keep's flash used to fill the whole screen with cream)
    api.debris(e.x, gy + hh * 0.5, e.z, e.w, hh * 0.6, e.d, 0, Math.round((wall ? 8 : 16) * k), 0.9, e.type);
    api.dust(e.x, gy + hh * 0.55, e.z, wall ? 5 : 9, Math.max(5, R * 0.7), R * 1.1, 2.4);
    // the crash, as the walls come down
    later.push({ t: dur * 0.3, fn: () => { api.debris(e.x, gy + hh * 0.3, e.z, e.w, hh * 0.5, e.d, 0, Math.round((wall ? 6 : 20) * k), 1.15, e.type); api.dustCloud(e.x, gy, e.z, R * (big ? 1.5 : 1.15), big ? 22 : wall ? 7 : 14); api.spark(e.x, gy + hh * 0.3, e.z, wall ? 4 : 12, 12, [1, 0.7, 0.35]); } });
    // the settle: a second, wider wave of dust and the heap appears under it
    later.push({ t: dur * 0.6, fn: () => { api.dustCloud(e.x, gy, e.z, R * (big ? 2.0 : 1.5), big ? 18 : wall ? 5 : 10); api.heap(e.type, e.x, e.z, e.w, e.d, hh, e.rot || 0); if (!wall) { api.fire(e.x, gy + 1.5, e.z, 3, Math.min(5, R * 0.45), 1.1); } } });
  };
  // a low billow that rolls outward along the ground plus a column that climbs
  api.dustCloud = (x, gy, z, R, n = 14) => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.283, sp = R * (0.5 + rnd() * 0.9), r0 = R * rnd() * 0.35;
      soft.spawn(x + Math.cos(a) * r0, gy + 0.6 + rnd() * 1.2, z + Math.sin(a) * r0, Math.cos(a) * sp, 0.9 + rnd() * 2.2, Math.sin(a) * sp, 3.2 + rnd() * 2.2, R * 0.28, R * (0.75 + rnd() * 0.6), [0.7, 0.64, 0.56, 0.62], [0.56, 0.51, 0.45, 0], -0.12, 1.5);
    }
    for (let i = 0; i < Math.ceil(n * 0.4); i++) soft.spawn(x + (rnd() - 0.5) * R * 0.6, gy + 1 + rnd() * 3, z + (rnd() - 0.5) * R * 0.6, (rnd() - 0.5) * 2, 3.5 + rnd() * 5, (rnd() - 0.5) * 2, 3.8 + rnd() * 1.8, R * 0.3, R * (0.7 + rnd() * 0.5), [0.64, 0.59, 0.52, 0.55], [0.5, 0.46, 0.42, 0], -0.2, 0.5);
  };
  // a vault falls: its gems burst out of it (the colour of the vault), a coloured shockwave and a rain of glitter
  api.vaultBurst = (kind, x, y, z, crown, pile) => {
    const col = GCOL[kind] || [1, 1, 1];
    api.flash(x, y + 6, z, 30, col); api.flash(x, y + 9, z, 16, [1, 1, 1]);
    api.ring(x, y + 0.3, z, 7, col, 56, 1.0, 0.3, 2.8); api.ring(x, y + 0.3, z, 13, col, 80, 1.5, 0.2, 2.6);
    api.gemBurst(kind, crown[0], crown[1], crown[2], 10, 1.25, 1.9);          // the great crown gem breaks into big pieces
    api.gemBurst(kind, pile[0], pile[1] + 1, pile[2], 26, 0.9, 1.0);          // the heap in front of the door spills
    for (let i = 0; i < 70; i++) { const a = rnd() * 6.283, sp = 4 + rnd() * 16; glow.spawn(x, y + 6 + rnd() * 5, z, Math.cos(a) * sp, 6 + rnd() * 14, Math.sin(a) * sp, 0.9 + rnd() * 0.9, 1.7, 0.25, [col[0], col[1], col[2], 1], [col[0], col[1], col[2], 0], 22, 0.5); }
  };

  api.update = (dt) => {
    soft.update(dt); glow.update(dt); updateProj(dt); updateDebris(dt); updateGems(dt); ruins.update(dt);
    for (let i = later.length - 1; i >= 0; i--) { const l = later[i]; l.t -= dt; if (l.t <= 0) { later.splice(i, 1); l.fn(); } }
  };
  api.clear = () => { ruins.clear(); soft.age.fill(9e9); glow.age.fill(9e9); for (const P of Object.values(proj)) P.list.length = 0; chunks.length = 0; later.length = 0; rub.r = rub.p = rub.rn = rub.pn = 0; rub.dirty = true; flushRubble(); sootN = 0; soot.count = 0; for (const k in GM) GM[k].list.length = 0; };
  api.dispose = () => { ruins.dispose(); scene.remove(G); G.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m && m.dispose && m.dispose()); if (o.isInstancedMesh) o.dispose(); }); sootTex.dispose(); for (const P of [soft, glow]) { P.points.removeFromParent(); if (P.points.geometry) P.points.geometry.dispose(); const u = P.points.material && P.points.material.uniforms; if (u && u.uTex && u.uTex.value) u.uTex.value.dispose(); if (P.points.material && P.points.material.dispose) P.points.material.dispose(); } };
  api.stats = () => ({ ruins: ruins.stats(), chunks: chunks.length, rubble: rub.rn, beams: rub.pn, arrows: proj.arrow.list.length });
  return api;
}
