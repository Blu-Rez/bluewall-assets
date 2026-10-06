// Touch-first camera: 1 finger pan, pinch zoom, two-finger twist rotate,
// inertia, tap detection, cinematic intro, camera shake.
import * as THREE from 'three';
import * as L from './layout.js';

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class CamCtl {
  constructor(camera, dom, height, opts = {}) {
    this.cam = camera; this.dom = dom; this.height = height;
    this.target = new THREE.Vector3(4, 2, 4);
    this.dist = opts.dist ?? 190; this.azim = opts.azim ?? 0.95; this.polar = opts.polarFar ?? 1.08;
    this.minD = opts.minD ?? 90; this.maxD = opts.maxD ?? 515; this.refD = opts.refD ?? 462; this.pFarMax = opts.polarFarMax ?? 0.97; this.maxR = 238 + L.PUSH; this.camR = opts.camR ?? (290 + L.PUSH);     // (p38: the valley is 33 m wider (PUSH 60) and the owner wants the view wider and farther back: far limits 415 -> 515, 372 -> 462; the camera still never leaves the valley, so it never goes behind a mountain)
         // (p36: the map grew — town x1.2, everything outside pushed 27 m out — so the far limits grew with it: 345 -> 415, 310 -> 372, valley 290 -> 317, pan limit 238 -> 265)
        // (p26: 45..440 let the camera sink into roofs and, far out, get squeezed by the valley ring -> the tilt/distance changed with the rotation)
    this.pNear = opts.polarNear ?? 1.30; this.pFar = opts.polarFar ?? 1.15;
    this.vel = new THREE.Vector2(); this.vAz = 0;
    this.ptrs = new Map(); this.onTap = null; this.onFirstTouch = null;
    this.intro = null; this.shake = 0; this.touched = false;
    this.rotSpeed = 1; this.zoomSpeed = 1; this.invert = false;
    this.map = (x, y) => [x, y];          // screen -> view coords (identity unless the view is CSS-rotated)
    this._bind();
  }
  _bind() {
    const d = this.dom;
    d.style.touchAction = 'none';
    d.addEventListener('pointerdown', (e) => this._down(e));
    d.addEventListener('pointermove', (e) => this._move(e));
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) d.addEventListener(ev, (e) => this._up(e));
    d.addEventListener('wheel', (e) => { e.preventDefault(); this._skipIntro(); this.dist = THREE.MathUtils.clamp(this.dist * (1 + e.deltaY * 0.0012 * this.zoomSpeed), this.minD, this.maxD); }, { passive: false });
    d.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  _skipIntro() { if (this.intro && !this.intro.hold) { this.intro.t = this.intro.dur; } }
  _down(e) {
    this.dom.setPointerCapture?.(e.pointerId);
    const [x, y] = this.map(e.clientX, e.clientY);
    this.ptrs.set(e.pointerId, { x, y, x0: x, y0: y, t0: performance.now(), btn: e.button });
    this.vel.set(0, 0); this.vAz = 0;
    if (!this.touched) { this.touched = true; this.onFirstTouch && this.onFirstTouch(); }
    if (this.ptrs.size === 2) this._pinch = this._pair();
  }
  _pair() {
    const [a, b] = [...this.ptrs.values()];
    return { d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  }
  _move(e) {
    const p = this.ptrs.get(e.pointerId); if (!p) return;
    const [ex, ey] = this.map(e.clientX, e.clientY);
    const dx = ex - p.x, dy = ey - p.y; p.x = ex; p.y = ey;
    if (this.intro && Math.hypot(p.x - p.x0, p.y - p.y0) > 6) this._skipIntro();
    if (this.intro) return;
    if (this.ptrs.size === 1) {
      if (p.btn === 2 || e.shiftKey) { this.azim -= dx * 0.006; this.vAz = -dx * 0.006; }
      else this._pan(dx, dy, true);
    } else if (this.ptrs.size === 2 && this._pinch) {
      const n = this._pair();
      if (n.d > 10 && this._pinch.d > 10) this.dist = THREE.MathUtils.clamp(this.dist * Math.pow(this._pinch.d / n.d, this.zoomSpeed), this.minD, this.maxD);
      let da = n.ang - this._pinch.ang; if (da > Math.PI) da -= Math.PI * 2; if (da < -Math.PI) da += Math.PI * 2;
      da *= this.rotSpeed * (this.invert ? -1 : 1);
      this.azim += da; this.vAz = da;
      this._pan(n.mx - this._pinch.mx, n.my - this._pinch.my, false);
      this._pinch = n;
    }
  }
  _pan(dx, dy, keepVel) {
    const h = this.dom.clientHeight || 800;
    const k = (this.dist * 2 * Math.tan(THREE.MathUtils.degToRad(this.cam.fov / 2))) / h;
    const s = Math.sin(this.azim), c = Math.cos(this.azim);
    // screen right = (c, -s) in xz, screen up (forward) = (-s, -c)
    const mx = (-dx * c + dy * -s * 1.25) * k, mz = (dx * s + dy * -c * 1.25) * k;
    this.target.x += mx; this.target.z += mz;
    if (keepVel) this.vel.set(mx, mz);
  }
  _up(e) {
    const p = this.ptrs.get(e.pointerId); if (!p) return;
    this.ptrs.delete(e.pointerId);
    if (this.ptrs.size < 2) this._pinch = null;
    const moved = Math.hypot(p.x - p.x0, p.y - p.y0), dt = performance.now() - p.t0;
    if (moved < 9 && dt < 400 && this.ptrs.size === 0) {
      if (this.intro) this._skipIntro();
      else if (this.onTap) this.onTap(p.x, p.y);
    }
  }
  // portrait <-> landscape: keep the same framing (the base distances are the ones the game opens with)
  setView(portrait) {
    if (this._portrait === portrait) return;
    const k = this._portrait === undefined ? 1 : (portrait ? 300 / 240 : 240 / 300);
    this._portrait = portrait; this.maxD = portrait ? 515 : 445; this.refD = portrait ? 462 : 414;
    this.dist = THREE.MathUtils.clamp(this.dist * k, this.minD, this.maxD);
    if (this.intro) this.intro.to.dist = THREE.MathUtils.clamp(this.intro.to.dist * k, this.minD, this.maxD);
  }
  zoomPolar(d = this.dist) {       // tilt follows the zoom; beyond refD (the old zoom-out limit) it eases on toward pFarMax, so the far end stays inside the valley ring (no squeeze)
    const ref = this.refD, zf = (Math.min(d, ref) - this.minD) / (ref - this.minD);
    let p = THREE.MathUtils.lerp(this.pNear, this.pFar, Math.pow(Math.max(0, zf), 0.8));
    if (d > ref) { const k = THREE.MathUtils.clamp((d - ref) / (this.maxD - ref), 0, 1); p -= (this.pFar - this.pFarMax) * k * k * (3 - 2 * k); }
    return p;
  }
  startIntro(dur = 7.5) {
    const to = { dist: this.dist, azim: this.azim, polar: this.zoomPolar(), tx: this.target.x, tz: this.target.z };
    const from = { dist: Math.max(860, this.dist * 2.6), azim: this.azim - 0.9, polar: 0.32, tx: 0, tz: 0 };
    this.intro = { t: 0, dur, from, to };
  }
  update(dt) {
    if (this.intro) {
      const I = this.intro; if (!I.hold) I.t += dt;
      const k = ease(Math.min(1, I.t / I.dur));
      this.dist = THREE.MathUtils.lerp(I.from.dist, I.to.dist, k);
      this.azim = THREE.MathUtils.lerp(I.from.azim, I.to.azim, k);
      this.polar = THREE.MathUtils.lerp(I.from.polar, I.to.polar, k);
      this.target.x = THREE.MathUtils.lerp(I.from.tx, I.to.tx, k); this.target.z = THREE.MathUtils.lerp(I.from.tz, I.to.tz, k);
      if (I.t >= I.dur) { this.intro = null; this.onIntroEnd && this.onIntroEnd(); }
    } else {
      if (this.ptrs.size === 0) {
        this.target.x += this.vel.x; this.target.z += this.vel.y;
        this.vel.multiplyScalar(Math.pow(0.9, dt * 60));
        this.azim += this.vAz; this.vAz *= Math.pow(0.88, dt * 60);
      }
      this.dist = THREE.MathUtils.clamp(this.dist, this.minD, this.maxD);
      this.polar = this.zoomPolar();
    }
    // keep target inside the kingdom
    const r = Math.hypot(this.target.x, this.target.z);
    if (r > this.maxR) { this.target.x *= this.maxR / r; this.target.z *= this.maxR / r; }
    this.target.y = Math.max(0, this.height(this.target.x, this.target.z)) + 2;
    // keep the camera inside the valley (radius camR): look more top-down first, then pull in —
    // otherwise it ends up behind / inside the mountain ring
    const ux = Math.sin(this.azim), uz = Math.cos(this.azim), T = this.target;
    // panning toward the rim pushes the target back instead of tilting the camera: the view angle stays the one the zoom asks for
    if (!this.intro) {
      const hd = this.dist * Math.sin(this.zoomPolar()), cx = T.x + hd * ux, cz = T.z + hd * uz, cr = Math.hypot(cx, cz), lim = this.camR - 4;
      if (cr > lim && cr > 1e-3 && hd < lim) { const o = cr - lim; T.x -= (cx / cr) * o; T.z -= (cz / cr) * o; this.vel.multiplyScalar(0.5); }
    }
    const tu = T.x * ux + T.z * uz, Hh = Math.sqrt(Math.max(0, tu * tu - (T.x * T.x + T.z * T.z) + this.camR * this.camR)) - tu;
    let pol = this.polar, d = this.dist;
    if (d * Math.sin(pol) > Hh) { pol = Math.max(0.5, Math.asin(Math.min(1, Hh / d))); if (d * Math.sin(pol) > Hh) d = Hh / Math.sin(pol); }
    const sp = Math.sin(pol), cp = Math.cos(pol);
    const cam = this.cam;
    cam.position.set(T.x + d * sp * ux, T.y + d * cp, T.z + d * sp * uz);
    const gy = this.height(cam.position.x, cam.position.z) + 6;
    if (cam.position.y < gy) cam.position.y = gy;
    // p38: line of sight — a hill or a ridge may never stand between the camera and what it looks at: the camera rises just enough (smoothed, so it never jerks)
    {
      let need = 0; const px = cam.position.x, py = cam.position.y, pz = cam.position.z;
      for (let k = 1; k <= 15; k++) { const s = k / 16, yy = py + (T.y - py) * s, g = this.height(px + (T.x - px) * s, pz + (T.z - pz) * s) + 4; if (g > yy) need = Math.max(need, (g - yy) / (1 - s)); }
      const cur = this._los || 0; this._los = need > cur ? cur + (need - cur) * Math.min(1, dt * 14) : cur + (need - cur) * Math.min(1, dt * 3);
      if (this._los > 0.05) cam.position.y += this._los;
    }
    if (this.block) cam.position.y = this.block.lift(cam.position.x, cam.position.y, cam.position.z, dt);      // (never inside a house, a tower, the keep or a giant)
    cam.lookAt(this.target);
    if (this.shake > 0.001) {
      cam.position.x += (Math.random() - 0.5) * this.shake; cam.position.y += (Math.random() - 0.5) * this.shake;
    }
  }
}
