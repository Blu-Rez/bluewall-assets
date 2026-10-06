// The four-barrel cannon house (owner 5 Oct 01:29, "the quad cannon house of Clash of Clans / Siegefall"): a stone shed with a slate roof on a stone turntable, four short iron
// barrels in a 2 x 2 block poking out of its front.  It scans like the single cannons do; in a raid the sim fires a SALVO (four shot events, q = 0..3, 0.17 s apart) and every barrel
// kicks back, flashes and smokes on its own turn.  Instanced like cannons.js (5 meshes for every house), matrices only rewritten for houses near the camera.
//   const qh = createQuadHouses({ scene, M, sites, onFire })   qh.update(t, dt, camera)  qh.fire(tid, x, y, z, q)  qh.hide(tid)  qh.reset()  qh.replace(tids)  qh.setManual(on)  qh.has(tid)
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

// local frame: forward +Z (the muzzles), up +Y, pivot = turntable centre.  The four barrels pivot together about PIV.
const PIV = [0, 1.55, -0.1], BL = 2.1, SC = 1.4, BS = 0.66;
const OFF = [[-0.52, -0.42], [0.52, -0.42], [-0.52, 0.42], [0.52, 0.42]];          // (x, y) of the four barrels around the pivot
function buildParts() {
  const wood = [], iron = [], stone = [];
  stone.push(put(cyl(1.95, 2.1, 0.34, 20), 0, 0.17, 0, 0x70778a, { uv: 0.3 }));                       // the stone turntable
  wood.push(put(cyl(1.8, 1.8, 0.12, 20), 0, 0.4, 0, 0x8a6a48));                                        // timber deck
  const wall = (w, h, d, x, y, z) => stone.push(put(box(w, h, d), x, y, z, 0x7a8194, { uv: 0.35 }));
  wall(3.3, 2.3, 0.55, 0, 1.6, -1.55);                                                                 // back wall
  for (const sx of [-1, 1]) wall(0.55, 2.3, 2.7, sx * 1.62, 1.6, -0.3);                                // side walls
  wall(3.3, 0.5, 0.5, 0, 0.7, 0.95);                                                                   // low front sill
  wood.push(put(box(3.9, 0.22, 3.3), 0, 2.88, -0.35, 0x6b4f36, { rx: -0.07 }));                       // the roof slab, a little pitched forward
  iron.push(put(box(4.0, 0.14, 3.4), 0, 3.02, -0.35, 0x39404c, { rx: -0.07 }));                       // slate layer
  iron.push(put(box(4.1, 0.1, 0.16), 0, 3.12, -1.95, 0x2a2f37, { rx: -0.07 }));                       // ridge beam
  for (const sx of [-1, 1]) wood.push(put(box(0.18, 0.18, 3.5), sx * 1.98, 2.78, -0.35, 0x5a412c));    // eaves beams
  for (const sx of [-1, 1]) wood.push(put(cyl(0.12, 0.12, 2.2, 6), sx * 1.7, 1.7, 1.18, 0x6b4f36));      // front posts
  // the mantlet: an iron frame with four round ports the barrels come through
  iron.push(put(box(2.9, 0.16, 0.22), 0, 2.28, 1.05, 0x39404c)); iron.push(put(box(2.9, 0.16, 0.22), 0, 0.98, 1.05, 0x39404c));
  for (const sx of [-1, 0, 1]) iron.push(put(box(0.14, 1.46, 0.22), sx * 1.4 + (sx === 0 ? 0 : 0), 1.62, 1.05, 0x39404c));
  iron.push(put(box(2.8, 0.1, 0.2), 0, 1.62, 1.05, 0x2a2f37));                                           // the cross bar between the rows
  // shot pyramids and a keg beside the house
  const ball = new THREE.SphereGeometry(0.17, 10, 8);
  [[0, 0, 0], [0.34, 0, 0], [0.17, 0, 0.3], [0.17, 0.27, 0.1]].forEach(([x, y, z]) => iron.push(put(ball, 2.9 + x - 1.2, 0.5 + y, 0.2 + z, 0x24282e)));
  wood.push(put(cyl(0.26, 0.26, 0.52, 10), -1.55, 0.66, 1.5, 0x6e4e30));
  // one barrel (local: muzzle toward +Z, centred on its own axis): a lathe profile, cast iron
  const pr = [[0, -0.9], [0.13, -0.9], [0.15, -0.85], [0.34, -0.8], [0.36, -0.6], [0.34, -0.45], [0.3, -0.35], [0.28, 0.5], [0.3, 0.55], [0.3, 0.75], [0.25, 0.8], [0.25, 1.15], [0.31, 1.2], [0.32, 1.35], [0.22, 1.4], [0.15, 1.35], [0.15, 1.1]];
  const lathe = new THREE.LatheGeometry(pr.map(([r, y]) => new THREE.Vector2(r, y)), 14); lathe.rotateX(Math.PI / 2);
  const strip = (arr) => mergeGeometries(arr.map((g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'color', 'uv'].includes(k)) n.deleteAttribute(k); if (!n.attributes.uv) n.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2)); return n; }), false);
  return { wood: strip(wood), iron: strip(iron), stone: strip(stone), barrel: strip([paint(lathe, 0x2b3038)]) };
}

let smokeTex = null;
function smoke() {
  if (smokeTex) return smokeTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  for (let i = 0; i < 9; i++) { const x = 18 + Math.random() * 28, y = 18 + Math.random() * 28, r = 10 + Math.random() * 12, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(235,235,235,.55)'); gr.addColorStop(1, 'rgba(235,235,235,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  smokeTex = new THREE.CanvasTexture(c); smokeTex.colorSpace = THREE.SRGBColorSpace; return smokeTex;
}

export function createQuadHouses({ scene, M, sites, onFire }) {
  if (!sites || !sites.length) return { update() {}, count: 0, fire() {}, hide() {}, reset() {}, replace() {}, setManual() {}, has: () => false };
  const P = buildParts(), N = sites.length;
  const mk = (geo, mat, n, cast) => { const im = new THREE.InstancedMesh(geo, mat, n); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = cast; im.receiveShadow = true; im.count = 0; scene.add(im); return im; };
  const ironMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.42, metalness: 0.75, envMapIntensity: 0.8 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.92, metalness: 0 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.85, metalness: 0 });
  const bodyW = mk(P.wood, woodMat, N, true), bodyI = mk(P.iron, ironMat, N, true), bodyS = mk(P.stone, stoneMat, N, true), barrels = mk(P.barrel, ironMat, N * 4, true);
  const all = [bodyW, bodyI, bodyS, barrels];
  const smokeMat = new THREE.SpriteMaterial({ map: smoke(), transparent: true, depthWrite: false, opacity: 0, color: 0xdedede });
  const flashMat = new THREE.SpriteMaterial({ color: 0xffc070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const puffs = []; for (let i = 0; i < 8; i++) { const s = new THREE.Sprite(smokeMat.clone()); s.visible = false; scene.add(s); puffs.push({ s, t: 9, v: new THREE.Vector3() }); }
  const flashes = []; for (let i = 0; i < 4; i++) { const s = new THREE.Sprite(flashMat.clone()); s.visible = false; scene.add(s); flashes.push({ s, t: 9 }); }
  let pi = 0, fi = 0;

  const S = sites.map((s, i) => ({ s, base: Math.PI / 2 - s.a, base0: Math.PI / 2 - s.a, sweepT: Math.random() * 6.28, amp: 0.55 + Math.random() * 0.2, amp0: 0, rate: 0.14 + Math.random() * 0.05,
    phase: 'ready', t: 0, next: 40 + Math.random() * 90 + i * 9, rec: [0, 0, 0, 0], pitch: 0.06, yaw: 0, aimY: null, salvo: null }));
  for (const b of S) b.amp0 = b.amp;
  const SCV = new THREE.Vector3(SC, SC, SC), body = new THREE.Matrix4(), m1 = new THREE.Matrix4(), mq = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), vp = new THREE.Vector3(), vt = new THREE.Vector3(), Xax = new THREE.Vector3(1, 0, 0), vs = new THREE.Vector3(BS, BS, BS);
  let manual = false;

  function barrelShot(b, q) {                                         // one barrel: kick, flash, smoke
    b.rec[q] = 1;
    const yaw = b.yaw, cp = Math.cos(b.pitch), o = OFF[q];
    const lx = o[0] * SC, ly = (PIV[1] + o[1] * Math.cos(b.pitch)) * SC, fwd = (PIV[2] + BL * 0.62 + 0.4) * SC;
    const mx = b.s.x + Math.sin(yaw) * cp * fwd + Math.cos(yaw) * lx, my = b.s.y + ly + Math.sin(b.pitch) * fwd, mz = b.s.z + Math.cos(yaw) * cp * fwd - Math.sin(yaw) * lx;
    const f = flashes[fi++ % flashes.length]; f.s.position.set(mx, my, mz); f.s.scale.setScalar(2.2); f.s.visible = true; f.t = 0;
    const p = puffs[pi++ % puffs.length]; p.s.position.set(mx, my, mz); p.v.set(Math.sin(yaw) * 2.4, 0.7, Math.cos(yaw) * 2.4); p.t = 0; p.s.visible = true; p.s.material.rotation = Math.random() * 6.28;
    onFire && onFire(mx, my, mz, 'cannon');
  }
  function step(b, dt) {
    b.t += dt;
    for (let q = 0; q < 4; q++) b.rec[q] = Math.max(0, b.rec[q] - dt * 1.7);
    if (b.phase === 'ready') { b.sweepT += dt * b.rate; b.next -= dt; if (b.next <= 0) { b.phase = 'aim'; b.t = 0; b.salvo = 0; } }
    else if (b.phase === 'aim') { if (b.t > 0.9) { b.phase = 'fire'; b.t = 0; b.salvo = 0; } }
    else if (b.phase === 'direct') { if (b.t > 2.2) b.phase = 'ready'; }
    else if (b.phase === 'fire') { while (b.salvo < 4 && b.t >= b.salvo * 0.17) barrelShot(b, b.salvo++); if (b.salvo >= 4 && b.t > 0.9) { b.phase = 'ready'; b.next = manual ? 1e9 : 80 + Math.random() * 120; } }
  }
  function update(t, dt, camera) {
    dt = Math.min(dt, 0.05);
    let n0 = 0, n1 = 0;
    for (const b of S) {
      if (b.dead || b.repl) continue;
      step(b, dt);
      if (camera && Math.hypot(b.s.x - camera.position.x, b.s.z - camera.position.z) > 520) continue;
      b.yaw = b.base + (b.phase === 'ready' ? b.amp * Math.sin(b.sweepT) : 0) * (manual ? 0 : 1);
      const tp = b.aimY != null ? Math.max(-0.3, Math.min(0.25, b.aimY / 80)) : 0.05 + 0.03 * Math.sin(b.sweepT * 0.7);
      b.pitch += (tp - b.pitch) * Math.min(1, dt * 3);
      body.compose(vp.set(b.s.x, b.s.y, b.s.z), mq.setFromAxisAngle(up, b.yaw), SCV);
      bodyW.setMatrixAt(n0, body); bodyI.setMatrixAt(n0, body); bodyS.setMatrixAt(n0, body); n0++;
      for (let q = 0; q < 4; q++) {
        const o = OFF[q]; m1.compose(vt.set(PIV[0], PIV[1], PIV[2]), mq.setFromAxisAngle(Xax, -b.pitch), One);                // (the block pitches about the pivot ...)
        const mo = new THREE.Matrix4().compose(new THREE.Vector3(o[0], o[1], BL * 0.5 * BS - b.rec[q] * 0.55), new THREE.Quaternion(), vs);   // ... each barrel sits at its own spot of the block and kicks back on its own
        m1.multiply(mo); m1.premultiply(body); barrels.setMatrixAt(n1++, m1);
      }
    }
    bodyW.count = bodyI.count = bodyS.count = n0; barrels.count = n1;
    for (const im of all) { im.visible = im.count > 0; im.instanceMatrix.needsUpdate = true; }
    for (const f of flashes) { if (!f.s.visible) continue; f.t += dt; f.s.material.opacity = Math.max(0, 1 - f.t / 0.12); f.s.scale.setScalar(2.2 + f.t * 12); if (f.t > 0.12) f.s.visible = false; }
    for (const p of puffs) {
      if (!p.s.visible) continue; p.t += dt;
      const k = p.t / 2.4; if (k >= 1) { p.s.visible = false; continue; }
      p.s.position.addScaledVector(p.v, dt); p.v.multiplyScalar(1 - dt * 1.4); p.v.y += dt * 0.6;
      p.s.scale.setScalar(1.2 + k * 5); p.s.material.opacity = 0.7 * (1 - k) * Math.min(1, p.t * 12);
    }
  }
  const has = (tid) => S.some((b) => b.s.tid === tid);
  return {
    update, count: N, has, S,
    setManual(on) { manual = on; for (const b of S) { if (on) { b.amp = 0; b.next = 1e9; } else { b.amp = b.amp0; b.base = b.base0; b.aimY = null; b.next = 40 + Math.random() * 90; b.dead = false; } } },
    // the sim fires a salvo as four shot events (q = 0..3): the first one aims the house, every one kicks its own barrel
    fire(tid, tx, ty, tz, q) { for (const b of S) if (b.s.tid === tid && !b.dead) { b.base = b.yaw = Math.atan2(tx - b.s.x, tz - b.s.z); b.aimY = ty - b.s.y; b.phase = 'direct'; b.t = 0; b.next = manual ? 1e9 : 60 + Math.random() * 60; barrelShot(b, (q | 0) & 3); } },
    hide(tid) { for (const b of S) if (b.s.tid === tid) b.dead = true; },
    replace(tids) { const set = new Set(tids || []); for (const b of S) b.repl = set.has(b.s.tid); },
    reset() { for (const b of S) { b.dead = false; b.phase = 'ready'; b.rec = [0, 0, 0, 0]; } },
  };
}
