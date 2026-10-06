// Tower cannons (p22 — the owner: "I don't see the cannons on the towers"). castle.js asks for a 'cannon' on every other unroofed tower;
// until now all of them became ballistas. A cast-iron gun on a timber garrison carriage that stands on a stone turntable:
// it scans slowly over the parapet, now and then fires a salute (recoil, muzzle flash, a puff of smoke), runs back out and scans again.
// In a raid the sim decides: fire(tid, x, y, z) turns it and shoots at once. All parts are instanced and shared by every cannon
// (4 draw calls + 1 for the smoke/flash sprites), matrices only rewritten for cannons near the camera.
//   const cn = createCannons({ scene, M, sites, onFire })  cn.update(t, dt, camera)  cn.fire(tid, x, y, z)  cn.hide(tid)  cn.reset()  cn.replace(tids)  cn.setManual(on)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { worldUV } from './util.js';

const _c = new THREE.Color(), E = new THREE.Euler(), Qq = new THREE.Quaternion(), V = new THREE.Vector3(), One = new THREE.Vector3(1, 1, 1);
function paint(g, hex, uv) {
  g = g.index ? g.toNonIndexed() : g;
  _c.set(hex); const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (uv) worldUV(g, uv);
  return g;
}
function put(geo, x, y, z, hex, { rx = 0, ry = 0, rz = 0, uv = 0.5, s = null } = {}) {
  const g = geo.clone(); g.applyMatrix4(new THREE.Matrix4().compose(V.set(x, y, z), Qq.setFromEuler(E.set(rx, ry, rz)), s || One));
  return paint(g, hex, uv);
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s);

// local frame: forward +Z (the muzzle), up +Y, pivot = turntable centre. The barrel pivots at its trunnions (TRUN).
const TRUN = [0, 1.32, 0.05], BLEN = 3.3, SC = 1.4;          // (SC: the whole gun, so it reads from the strategy camera; the ballista stock is 4.2 m)
function buildParts() {
  const wood = [], iron = [], stone = [];
  stone.push(put(cyl(1.55, 1.7, 0.32, 16), 0, 0.16, 0, 0x9da3ad, { uv: 0.3 }));                     // stone turntable
  wood.push(put(cyl(1.42, 1.42, 0.12, 16), 0, 0.38, 0, 0x8a6a48));                                  // timber deck
  for (const sx of [-1, 1]) {                                                                         // the two stepped cheeks of the carriage
    wood.push(put(box(0.24, 0.62, 2.1), sx * 0.52, 0.75, -0.2, 0xb08a60));
    wood.push(put(box(0.24, 0.42, 1.4), sx * 0.52, 1.25, -0.05, 0xb08a60));
    iron.push(put(box(0.27, 0.07, 0.5), sx * 0.52, 1.47, 0.05, 0x3a3f48));                             // capsquares over the trunnions
    for (const z of [0.55, -0.85]) {                                                                   // trucks (small iron-shod wheels)
      wood.push(put(cyl(0.3, 0.3, 0.16, 12), sx * 0.74, 0.62, z, 0x7a5a3c, { rz: Math.PI / 2 }));
      iron.push(put(cyl(0.31, 0.31, 0.06, 12), sx * 0.83, 0.62, z, 0x2e333b, { rz: Math.PI / 2 }));
    }
  }
  wood.push(put(box(0.86, 0.16, 1.9), 0, 0.5, -0.2, 0x9a7a54));                                       // bed / transom
  iron.push(put(cyl(0.05, 0.05, 1.7, 6), 0, 0.62, 0.55, 0x2e333b, { rz: Math.PI / 2 }));               // axletrees
  iron.push(put(cyl(0.05, 0.05, 1.7, 6), 0, 0.62, -0.85, 0x2e333b, { rz: Math.PI / 2 }));
  // a neat pyramid of shot and a powder keg beside the gun (static on the turntable)
  const ball = new THREE.SphereGeometry(0.17, 10, 8);
  [[0, 0, 0], [0.34, 0, 0], [0.17, 0, 0.3], [0.17, 0.27, 0.1]].forEach(([x, y, z]) => iron.push(put(ball, -1.1 + x, 0.62 + y, -0.95 + z, 0x24282e)));
  wood.push(put(cyl(0.26, 0.26, 0.52, 10), 1.12, 0.66, -0.9, 0x6e4e30));
  iron.push(put(cyl(0.27, 0.27, 0.05, 10), 1.12, 0.5, -0.9, 0x2e333b)); iron.push(put(cyl(0.27, 0.27, 0.05, 10), 1.12, 0.84, -0.9, 0x2e333b));
  // the barrel: a lathe profile (cascabel, breech, reinforce rings, chase, muzzle swell), cast iron
  const pr = [[0, -1.15], [0.13, -1.15], [0.16, -1.08], [0.1, -1.0], [0.1, -0.95], [0.34, -0.9], [0.37, -0.78], [0.36, -0.55], [0.39, -0.5], [0.39, -0.42],
    [0.33, -0.38], [0.31, 0.2], [0.34, 0.24], [0.34, 0.32], [0.28, 0.36], [0.25, 1.7], [0.3, 1.82], [0.31, 2.02], [0.22, 2.08], [0.15, 2.02], [0.15, 1.6]];
  const lathe = new THREE.LatheGeometry(pr.map(([r, y]) => new THREE.Vector2(r, y)), 16);
  lathe.rotateX(Math.PI / 2);                                                                         // the lathe axis (+Y) becomes the bore (+Z)
  const barrel = [paint(lathe, 0x2b3038)];
  barrel.push(put(cyl(0.09, 0.09, 1.0, 8), 0, 0, 0, 0x2b3038, { rz: Math.PI / 2 }));                   // trunnions (the pivot)
  const strip = (arr) => mergeGeometries(arr.map((g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'color', 'uv'].includes(k)) n.deleteAttribute(k); if (!n.attributes.uv) n.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2)); return n; }));
  return { wood: strip(wood), iron: strip(iron), stone: strip(stone), barrel: strip(barrel) };
}

let smokeTex = null;
function smoke() {
  if (smokeTex) return smokeTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  for (let i = 0; i < 9; i++) { const x = 18 + Math.random() * 28, y = 18 + Math.random() * 28, r = 10 + Math.random() * 12, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(235,235,235,.55)'); gr.addColorStop(1, 'rgba(235,235,235,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  smokeTex = new THREE.CanvasTexture(c); smokeTex.colorSpace = THREE.SRGBColorSpace; return smokeTex;
}

export function createCannons({ scene, M, sites, onFire }) {
  if (!sites || !sites.length) return { update() {}, count: 0, fire() {}, hide() {}, reset() {}, replace() {}, setManual() {}, has: () => false };
  const P = buildParts(), N = sites.length;
  const mk = (geo, mat, n, cast) => { const im = new THREE.InstancedMesh(geo, mat, n); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = cast; im.receiveShadow = true; im.count = 0; scene.add(im); return im; };
  const ironMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.42, metalness: 0.75, envMapIntensity: 0.8 });
  const bodyW = mk(P.wood, M.woodLight, N, true), bodyI = mk(P.iron, ironMat, N, true), bodyS = mk(P.stone, new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.92, metalness: 0 }), N, false), barrels = mk(P.barrel, ironMat, N, true);
  const all = [bodyW, bodyI, bodyS, barrels];
  // smoke & flash: a small pool of sprites (one material each, shared)
  const smokeMat = new THREE.SpriteMaterial({ map: smoke(), transparent: true, depthWrite: false, opacity: 0, color: 0xdedede });
  const flashMat = new THREE.SpriteMaterial({ color: 0xffc070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const puffs = []; for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(smokeMat.clone()); s.visible = false; scene.add(s); puffs.push({ s, t: 9, v: new THREE.Vector3() }); }
  const flash = new THREE.Sprite(flashMat); flash.visible = false; scene.add(flash); let flashT = 9;
  let pi = 0;

  const S = sites.map((s, i) => ({ s, base: Math.PI / 2 - s.a, base0: Math.PI / 2 - s.a, sweepT: Math.random() * 6.28, amp: 0.6 + Math.random() * 0.2, amp0: 0, rate: 0.16 + Math.random() * 0.05,
    phase: 'ready', t: 0, next: 30 + Math.random() * 90 + i * 7, recoil: 0, pitch: 0.06, yaw: 0, aimY: null }));
  for (const b of S) b.amp0 = b.amp;
  const SCV = new THREE.Vector3(SC, SC, SC), body = new THREE.Matrix4(), m1 = new THREE.Matrix4(), mq = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), vp = new THREE.Vector3(), vt = new THREE.Vector3(), Xax = new THREE.Vector3(1, 0, 0);
  let manual = false;

  function shoot(b) {
    b.phase = 'fire'; b.t = 0;
    const yaw = b.yaw, cp = Math.cos(b.pitch);
    const mx = b.s.x + Math.sin(yaw) * cp * 2.3 * SC, my = b.s.y + (TRUN[1] + Math.sin(b.pitch) * 2.2) * SC, mz = b.s.z + Math.cos(yaw) * cp * 2.3 * SC;
    flash.position.set(mx, my, mz); flash.scale.setScalar(3.2); flash.visible = true; flashT = 0;
    for (let k = 0; k < 2; k++) { const p = puffs[pi++ % puffs.length]; p.s.position.set(mx, my, mz); p.v.set(Math.sin(yaw) * (2.2 + k), 0.6 + k * 0.4, Math.cos(yaw) * (2.2 + k)); p.t = 0; p.s.visible = true; p.s.material.rotation = Math.random() * 6.28; }
    onFire && onFire(mx, my, mz, 'cannon');
  }
  function step(b, dt) {
    b.t += dt;
    if (b.phase === 'ready') { b.sweepT += dt * b.rate; b.next -= dt; if (b.next <= 0) { b.phase = 'aim'; b.t = 0; } }
    else if (b.phase === 'aim') { if (b.t > 1.1) shoot(b); }
    else if (b.phase === 'fire') { b.recoil = Math.min(0.75, b.recoil + dt * 9); if (b.t > 0.12) { b.phase = 'back'; b.t = 0; } }
    else if (b.phase === 'back') { b.recoil = 0.75 * Math.max(0, 1 - b.t / 2.6); if (b.t > 2.6) { b.recoil = 0; b.phase = 'ready'; b.next = manual ? 1e9 : 70 + Math.random() * 110; } }
  }
  function update(t, dt, camera) {
    dt = Math.min(dt, 0.05);
    const cnt = [0, 0];
    for (const b of S) {
      if (b.dead || b.repl) continue;
      step(b, dt);
      if (camera && Math.hypot(b.s.x - camera.position.x, b.s.z - camera.position.z) > 520) continue;
      b.yaw = b.base + (b.phase === 'ready' ? b.amp * Math.sin(b.sweepT) : 0) * (manual ? 0 : 1);
      const tp = b.aimY != null ? Math.max(-0.35, Math.min(0.3, b.aimY / 80)) : 0.06 + 0.04 * Math.sin(b.sweepT * 0.7);
      b.pitch += (tp - b.pitch) * Math.min(1, dt * 3);
      body.compose(vp.set(b.s.x, b.s.y, b.s.z), mq.setFromAxisAngle(up, b.yaw), SCV);
      const i = cnt[0]++; bodyW.setMatrixAt(i, body); bodyI.setMatrixAt(i, body); bodyS.setMatrixAt(i, body);
      m1.compose(vt.set(TRUN[0], TRUN[1], TRUN[2] - b.recoil * 0.5), mq.setFromAxisAngle(Xax, -b.pitch), One); m1.premultiply(body); barrels.setMatrixAt(cnt[1]++, m1);
    }
    bodyW.count = bodyI.count = bodyS.count = cnt[0]; barrels.count = cnt[1];
    for (const im of all) { im.visible = im.count > 0; im.instanceMatrix.needsUpdate = true; }
    // smoke & flash
    if (flash.visible) { flashT += dt; flash.material.opacity = Math.max(0, 1 - flashT / 0.12); flash.scale.setScalar(3.2 + flashT * 14); if (flashT > 0.12) flash.visible = false; }
    for (const p of puffs) {
      if (!p.s.visible) continue; p.t += dt;
      const k = p.t / 2.8; if (k >= 1) { p.s.visible = false; continue; }
      p.s.position.addScaledVector(p.v, dt); p.v.multiplyScalar(1 - dt * 1.4); p.v.y += dt * 0.6;
      p.s.scale.setScalar(1.6 + k * 6.5); p.s.material.opacity = 0.75 * (1 - k) * Math.min(1, p.t * 12);
    }
  }
  const has = (tid) => S.some((b) => b.s.tid === tid);
  return {
    update, count: N, has, S,
    setManual(on) { manual = on; for (const b of S) { if (on) { b.amp = 0; b.next = 1e9; } else { b.amp = b.amp0; b.base = b.base0; b.aimY = null; b.next = 30 + Math.random() * 90; b.dead = false; } } },
    fire(tid, tx, ty, tz) { for (const b of S) if (b.s.tid === tid && !b.dead) { if (b.phase === 'fire') return; b.recoil = Math.min(b.recoil, 0.2); b.base = b.yaw = Math.atan2(tx - b.s.x, tz - b.s.z); b.aimY = ty - b.s.y; b.phase = 'aim'; b.t = 0.95; } },
    hide(tid) { for (const b of S) if (b.s.tid === tid) b.dead = true; },
    replace(tids) { const set = new Set(tids || []); for (const b of S) b.repl = set.has(b.s.tid); },
    reset() { for (const b of S) { b.dead = false; b.phase = 'ready'; b.recoil = 0; } },
  };
}
