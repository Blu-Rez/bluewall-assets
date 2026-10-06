// Light & life: torch flames, glow pools, waving flags, smoke, fireflies,
// dragon fire. All cheap GPU point/quad systems.
import * as THREE from 'three';
import { rng } from './noise.js';

export const PX = { scale: { value: 800 } };   // perspective point-size scale (set on resize)

// ---------------------------------------------------------------- flames
export class Flames {
  constructor() { this.p = []; this.s = []; this.c = []; this.tid = []; }
  add(x, y, z, size = 1.6, color = [1, 0.62, 0.25], tid = 0) { this.p.push(x, y, z); this.s.push(size); this.c.push(...color); this.tid.push(tid); }
  // attack mode: a structure fell, its torches go out (and come back after the battle)
  hide(id) { if (!this.points) return; const a = this.points.geometry.attributes.size; let ch = false; for (let i = 0; i < this.tid.length; i++) if (this.tid[i] === id) { a.setX(i, 0); ch = true; } if (ch) a.needsUpdate = true; }
  reset() { if (!this.points) return; const a = this.points.geometry.attributes.size; for (let i = 0; i < this.s.length; i++) a.setX(i, this.s[i]); a.needsUpdate = true; }
  build(scene, tex) {
    const g = new THREE.BufferGeometry(), n = this.s.length, r = rng(4);
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('size', new THREE.Float32BufferAttribute(this.s, 1));
    g.setAttribute('col', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('seed', new THREE.Float32BufferAttribute(Array.from({ length: n }, () => r() * 100), 1));
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uTex: { value: tex }, uScale: PX.scale, uNight: { value: 1 } },
      vertexShader: `attribute float size; attribute float seed; attribute vec3 col; uniform float uTime; uniform float uScale;
        varying vec3 vC; varying float vA;
        void main(){ vec3 p = position; float f = sin(uTime*11.0+seed)*0.5+sin(uTime*17.3+seed*2.1)*0.3;
          p.y += f*0.06*size; vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv;
          gl_PointSize = size*(1.0+f*0.18)*uScale/-mv.z; vC = col; vA = 0.85+f*0.15; }`,
      fragmentShader: `uniform sampler2D uTex; uniform float uNight; varying vec3 vC; varying float vA;
        void main(){ vec4 t = texture2D(uTex, gl_PointCoord); float core = smoothstep(0.35,0.0,length(gl_PointCoord-vec2(0.5,0.55)));
          float k = 0.3 + 0.7 * uNight; gl_FragColor = vec4((vC*t.a*1.6 + vec3(1.0,0.95,0.8)*core*1.4) * k, t.a*vA*k); }`,
    });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 5;
    scene.add(this.points);
  }
  update(t) { if (this.mat) this.mat.uniforms.uTime.value = t; }
  setNight(n) { if (this.mat) this.mat.uniforms.uNight.value = n; }
}

// ---------------------------------------------------------------- ground glow pools
export class Pools {
  constructor() { this.items = []; }
  add(x, y, z, r, color = [1, 0.55, 0.2], a = 0.55) { this.items.push({ x, y, z, r, color, a }); }
  build(scene, tex) {
    const pos = [], uv = [], col = [], seed = [], idx = []; let v = 0;
    const R = rng(8);
    for (const it of this.items) {
      const s = R() * 50;
      for (const [u, w] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        pos.push(it.x + (u - 0.5) * 2 * it.r, it.y, it.z + (w - 0.5) * 2 * it.r); uv.push(u, w);
        col.push(it.color[0] * it.a, it.color[1] * it.a, it.color[2] * it.a); seed.push(s);
      }
      idx.push(v, v + 2, v + 1, v, v + 3, v + 2); v += 4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('col', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('seed', new THREE.Float32BufferAttribute(seed, 1));
    g.setIndex(idx);
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
      uniforms: { uTime: { value: 0 }, uTex: { value: tex }, uNight: { value: 1 } },
      vertexShader: `attribute vec3 col; attribute float seed; uniform float uTime; varying vec2 vUv; varying vec3 vC;
        void main(){ vUv = uv; vC = col*(0.85+0.15*sin(uTime*9.0+seed)); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform sampler2D uTex; uniform float uNight; varying vec2 vUv; varying vec3 vC; void main(){ float a = texture2D(uTex, vUv).a * uNight; gl_FragColor = vec4(vC*a, a); }`,
    });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.renderOrder = 2;
    scene.add(this.mesh);
  }
  update(t) { if (this.mat) this.mat.uniforms.uTime.value = t; }
  setNight(n) { if (this.mat) this.mat.uniforms.uNight.value = n; }
}

// ---------------------------------------------------------------- contact-shadow decals (fake AO)
export class Decals {
  constructor() { this.items = []; }
  add(x, y, z, r, a) { this.items.push([x, y, z, r, a]); }
  build(scene, tex) {
    if (!this.items.length) return;
    const pos = [], uv = [], al = [], idx = []; let v = 0;
    for (const [x, y, z, r, a] of this.items) {
      for (const [u, w] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { pos.push(x + (u - 0.5) * 2 * r, y, z + (w - 0.5) * 2 * r); uv.push(u, w); al.push(a); }
      idx.push(v, v + 2, v + 1, v, v + 3, v + 2); v += 4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('al', new THREE.Float32BufferAttribute(al, 1));
    g.setIndex(idx);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
      uniforms: { uTex: { value: tex } },
      vertexShader: 'attribute float al; varying vec2 vUv; varying float vA; void main(){ vUv = uv; vA = al; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform sampler2D uTex; varying vec2 vUv; varying float vA; void main(){ float a = texture2D(uTex, vUv).a*vA; gl_FragColor = vec4(0.0,0.0,0.0,a); }',
    });
    const m = new THREE.Mesh(g, mat); m.renderOrder = 1; scene.add(m);
  }
}

// ---------------------------------------------------------------- flags (instanced, waving)
const ZERO4 = new THREE.Matrix4().makeScale(0, 0, 0);
export class Flags {
  constructor() { this.m = []; this.tid = []; }
  hide(id) { if (!this.mesh) return; let ch = false; for (let i = 0; i < this.tid.length; i++) if (this.tid[i] === id) { this.mesh.setMatrixAt(i, ZERO4); ch = true; } if (ch) this.mesh.instanceMatrix.needsUpdate = true; }
  reset() { if (!this.mesh) return; this.m.forEach((m, i) => this.mesh.setMatrixAt(i, m)); this.mesh.instanceMatrix.needsUpdate = true; }
  add(x, y, z, ry, s = 1, tid = 0) {
    this.tid.push(tid);
    this.m.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, s, s)));
  }
  build(scene, material) {
    const w = 3.2, h = 2.1, g = new THREE.PlaneGeometry(w, h, 10, 2);
    g.translate(w / 2, -h / 2, 0);
    const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / w, (p.getY(i) + h) / h);        // natural orientation: pole at u=0, crest upright
    const mat = material.clone(); mat.alphaTest = 0.5; mat.side = THREE.DoubleSide;
    this.uni = { value: 0 };
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = this.uni;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float ph = 0.0;
          #ifdef USE_INSTANCING
            ph = instanceMatrix[3].x*0.37 + instanceMatrix[3].z*0.23;
          #endif
          float k = position.x/3.2;
          transformed.z += sin(position.x*1.6 - uTime*5.0 + ph)*0.35*k;
          transformed.y += sin(position.x*1.1 - uTime*3.3 + ph)*0.12*k;`);
    };
    this.mesh = new THREE.InstancedMesh(g, mat, this.m.length);
    this.m.forEach((m, i) => this.mesh.setMatrixAt(i, m));
    this.mesh.castShadow = true; this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }
  update(t) { this.uni.value = t; }
}

// ---------------------------------------------------------------- generic particles (smoke, embers, breath, fireflies)
export class Particles {
  constructor(scene, { count, tex, blending = THREE.AdditiveBlending, color = [1, 1, 1], fog = true }) {
    this.n = count; this.alive = 0;
    this.pos = new Float32Array(count * 3); this.vel = new Float32Array(count * 3);
    this.life = new Float32Array(count); this.max = new Float32Array(count); this.size = new Float32Array(count);
    this.grow = new Float32Array(count); this.alpha = new Float32Array(count);
    const g = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(this.pos, 3); this.aSize = new THREE.BufferAttribute(new Float32Array(count), 1);
    this.aA = new THREE.BufferAttribute(new Float32Array(count), 1);
    this.aPos.setUsage(THREE.DynamicDrawUsage); this.aSize.setUsage(THREE.DynamicDrawUsage); this.aA.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.aPos); g.setAttribute('size', this.aSize); g.setAttribute('alpha', this.aA);
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending, fog: false,
      uniforms: { uTex: { value: tex }, uScale: PX.scale, uCol: { value: new THREE.Color(...color) } },
      vertexShader: `attribute float size; attribute float alpha; uniform float uScale; varying float vA;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = size*uScale/-mv.z; vA = alpha; }`,
      fragmentShader: `uniform sampler2D uTex; uniform vec3 uCol; varying float vA;
        void main(){ float a = texture2D(uTex, gl_PointCoord).a*vA; if (a < 0.003) discard; gl_FragColor = vec4(uCol*a, a); }`,
    });
    if (blending === THREE.NormalBlending) this.mat.fragmentShader = this.mat.fragmentShader.replace('vec4(uCol*a, a)', 'vec4(uCol, a)');
    void fog;
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 6;
    scene.add(this.points);
    this.cursor = 0;
  }
  emit(x, y, z, vx, vy, vz, life, size, grow = 0, alpha = 1) {
    const i = this.cursor; this.cursor = (this.cursor + 1) % this.n;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = life; this.max[i] = life; this.size[i] = size; this.grow[i] = grow; this.alpha[i] = alpha;
    this.active = Math.max(this.active || 0, life + 0.1); this.points.visible = true;
  }
  update(dt, drag = 0.98, lift = 0) {
    // nothing alive (and nothing emitted since): skip the loop, the upload and the draw call
    if (!(this.active > 0)) { this.points.visible = false; return; }
    this.active -= dt;
    const S = this.aSize.array, A = this.aA.array, dd = Math.pow(drag, dt * 60);
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) { A[i] = 0; S[i] = 0; continue; }
      this.life[i] -= dt;
      const k = i * 3;
      this.vel[k] *= dd; this.vel[k + 1] = this.vel[k + 1] * dd + lift * dt; this.vel[k + 2] *= dd;
      this.pos[k] += this.vel[k] * dt; this.pos[k + 1] += this.vel[k + 1] * dt; this.pos[k + 2] += this.vel[k + 2] * dt;
      const t = 1 - this.life[i] / this.max[i];
      S[i] = this.size[i] * (1 + this.grow[i] * t);
      A[i] = this.alpha[i] * Math.min(1, t * 6) * (1 - t) * (1 - t);
    }
    this.aPos.needsUpdate = true; this.aSize.needsUpdate = true; this.aA.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- fireflies
export function fireflies(scene, tex, spots, height) {
  const R = rng(12), n = spots.length ? 260 : 0, pos = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = spots[(R() * spots.length) | 0], a = R() * 6.28, d = R() * 18;
    const x = s[0] + Math.cos(a) * d, z = s[1] + Math.sin(a) * d;
    pos[i * 3] = x; pos[i * 3 + 1] = height(x, z) + 0.8 + R() * 3; pos[i * 3 + 2] = z; ph[i] = R() * 100;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uTex: { value: tex }, uScale: PX.scale, uNight: { value: 1 } },
    vertexShader: `attribute float phase; uniform float uTime; uniform float uScale; varying float vA;
      void main(){ vec3 p = position; p.x += sin(uTime*0.6+phase)*1.6; p.y += sin(uTime*0.9+phase*1.7)*0.7; p.z += cos(uTime*0.5+phase*0.7)*1.6;
        vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv; vA = pow(max(0.0, sin(uTime*1.3+phase*3.0)), 3.0);
        gl_PointSize = 0.9*uScale/-mv.z; }`,
    fragmentShader: `uniform sampler2D uTex; uniform float uNight; varying float vA; void main(){ float a = texture2D(uTex, gl_PointCoord).a*vA*uNight; gl_FragColor = vec4(vec3(0.75,1.0,0.45)*a*1.6, a); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
  scene.add(pts);
  return { update(t) { mat.uniforms.uTime.value = t; }, setNight(n) { mat.uniforms.uNight.value = n; } };
}
