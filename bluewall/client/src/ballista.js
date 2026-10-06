// Tower ballistas: big crossbows on a swivel post, one per unroofed tower of the Blue Wall and the town wall.
// Every part is an instanced mesh shared by ALL ballistas (7 draw calls in total): static body (wood + iron), the two bow limbs, the
// winch wheel, the string, the bolt and the slider. Each ballista scans slowly over the parapet; now and then it looses a bolt (limbs snap
// forward and ring out, the bolt flies away), then the winch turns, the limbs bend back, a new bolt drops in and it scans again.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { worldUV } from './util.js';

const D = (a) => a;                                           // readability: metres
const _c = new THREE.Color();
function paint(g, hex, uv) {
  g = g.index ? g.toNonIndexed() : g;
  _c.set(hex);                                            // (ColorManagement already turns the sRGB hex into linear)
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (uv) worldUV(g, uv);
  return g;
}
const E = new THREE.Euler(), Qq = new THREE.Quaternion(), V = new THREE.Vector3(), One = new THREE.Vector3(1, 1, 1);
function put(geo, x, y, z, hex, { rx = 0, ry = 0, rz = 0, uv = 0.5 } = {}) {
  const g = geo.clone(); g.applyMatrix4(new THREE.Matrix4().compose(V.set(x, y, z), Qq.setFromEuler(E.set(rx, ry, rz)), One));
  return paint(g, hex, uv);
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s);

// ---------------------------------------------------------------- geometry (local frame: forward +Z, up +Y, pivot at the turntable centre)
// tints multiply the light-oak texture of M.woodLight / the steel of M.metal, so they are bright multipliers, not the final colours
const WOOD = 0xe6d2b4, WOOD2 = 0xc4a47c, WOOD_D = 0x9a7c5a, IRON = 0xb4bcc8, ROPE = 0xd9cfb4;
const ROOT_X = 0.62, ROOT_Y = 1.75, ROOT_Z = 1.75, SLIDER_Y = 2.06, WHEEL = [0.5, 1.75, -1.4];
const DB_SCALE = 1.55, DB_WOOD = new THREE.Color(0x6f8fd0), DB_LIMB = new THREE.Color(0x3d5696), WHITE = new THREE.Color(1, 1, 1);
const PHI = 0.3, Z_COCK = -0.45, Z_REST = 2.65;               // limb bend when loaded, slider position cocked / released

function buildParts() {
  const wood = [
    put(cyl(1.15, 1.25, 0.28, 12), 0, 0.14, 0, WOOD_D),                                   // turntable deck
    put(cyl(0.34, 0.4, 1.05, 10), 0, 0.8, 0, 0xb08c64),                                   // post
    put(box(0.95, 0.3, 1.5), 0, 1.45, 0.1, WOOD2),                                        // yoke under the stock
    put(box(0.36, 0.42, 4.2), 0, 1.75, 0.15, WOOD),                                       // stock
    put(box(0.14, 0.07, 3.9), 0, 1.99, 0.3, 0x6e5238, { uv: 0.2 }),                       // bolt rail
    put(box(1.25, 0.46, 0.6), 0, 1.75, 1.75, WOOD2),                                      // crosshead (limb mount)
    put(box(0.1, 0.55, 0.95), -0.28, 1.75, -1.4, WOOD2), put(box(0.1, 0.55, 0.95), 0.28, 1.75, -1.4, WOOD2),   // winch cheeks
    put(box(0.12, 0.12, 1.5), -0.3, 1.2, 0.05, WOOD2, { rx: 0.5 }), put(box(0.12, 0.12, 1.5), 0.3, 1.2, 0.05, WOOD2, { rx: 0.5 }),   // braces
  ];
  const iron = [
    put(cyl(0.43, 0.43, 0.1, 10), 0, 0.45, 0, IRON), put(cyl(0.43, 0.43, 0.1, 10), 0, 1.1, 0, IRON),          // post bands
    put(box(0.4, 0.08, 0.7), 0, 1.99, 2.0, IRON), put(box(0.4, 0.08, 0.5), 0, 1.99, -1.7, IRON),                // stock caps
    put(box(1.3, 0.1, 0.12), 0, 1.78, 2.05, IRON), put(box(1.3, 0.1, 0.12), 0, 1.78, 1.45, IRON),               // crosshead straps
    put(cyl(0.07, 0.07, 1.1, 8), WHEEL[0] - 0.4, WHEEL[1], WHEEL[2], IRON, { rz: Math.PI / 2 }),                // winch axle
    put(box(0.5, 0.3, 0.05), 0, 1.6, -0.1, IRON), put(box(0.5, 0.05, 0.3), 0, 1.45, 0.1, IRON),
    put(cyl(1.28, 1.28, 0.06, 12), 0, 0.03, 0, IRON),                                                          // base ring
  ];
  // limb (right side, +X): a bow stave curving forward, iron caps at both ends. The left one is the same mesh turned 180° about Z.
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.7, 0, 0.0), new THREE.Vector3(1.45, 0, 0.18), new THREE.Vector3(2.0, 0, 0.55), new THREE.Vector3(2.3, 0, 0.98)]);
  const tube = paint(new THREE.TubeGeometry(curve, 20, 0.125, 7, false), 0xb89468, 0.6);
  const tip = curve.getPoint(1), tipT = curve.getTangent(1);
  const limb = mergeGeometries([tube, put(cyl(0.16, 0.16, 0.28, 8), 0.04, 0, 0, IRON, { rz: Math.PI / 2 }), put(cyl(0.11, 0.11, 0.2, 8), tip.x, tip.y, tip.z, IRON, { rz: Math.PI / 2, ry: -Math.atan2(tipT.z, tipT.x) })], false);
  const wheel = mergeGeometries([put(cyl(0.44, 0.44, 0.09, 12), 0, 0, 0, WOOD_D, { rz: Math.PI / 2 }),
    ...[0, 1, 2].map((i) => put(box(0.08, 1.05, 0.11), 0.07, 0, 0, WOOD2, { rx: i * Math.PI / 3 })),
    ...[0, 1, 2, 3, 4, 5].map((i) => put(cyl(0.045, 0.045, 0.28, 6), 0.17, Math.sin(i * Math.PI / 3) * 0.5, Math.cos(i * Math.PI / 3) * 0.5, IRON, { rz: Math.PI / 2 }))], false);
  // bolt: tail at the origin, pointing +Z (2.7 m)
  const bolt = mergeGeometries([put(cyl(0.07, 0.07, 2.2, 7), 0, 0, 1.1, 0xd8bc90, { rx: Math.PI / 2, uv: 0.3 }),
    put(new THREE.ConeGeometry(0.15, 0.5, 7), 0, 0, 2.45, 0x8a929e, { rx: Math.PI / 2 }),
    ...[0, 1, 2].map((i) => put(box(0.03, 0.34, 0.5), 0, 0, 0.3, 0xd8d0c0, { rz: i * Math.PI / 3 }))], false);
  const slider = paint(box(0.3, 0.16, 0.36), IRON);
  const string = (() => { const g = cyl(0.03, 0.03, 1, 5); g.translate(0, 0.5, 0); return g.toNonIndexed(); })();   // unit length along +Y from the origin
  return { wood: mergeGeometries(wood, false), iron: mergeGeometries(iron, false), limb, tip, wheel, bolt, slider, string };
}

// ---------------------------------------------------------------- system
export function createBallistas({ scene, M, height, sites, onFire }) {
  if (!sites || !sites.length) return { update() {}, count: 0 };
  const P = buildParts(), N = sites.length;
  const rope = new THREE.MeshStandardMaterial({ color: ROPE, roughness: 0.95 });
  const mk = (geo, mat, n, cast) => { const im = new THREE.InstancedMesh(geo, mat, n); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = cast; im.receiveShadow = true; im.count = 0; scene.add(im); return im; };
  const bodyW = mk(P.wood, M.woodLight, N, true), bodyI = mk(P.iron, M.metal, N, true), limbs = mk(P.limb, M.woodLight, N * 2, true), wheel = mk(P.wheel, M.woodLight, N, false),
    strings = mk(P.string, rope, N * 2, false), bolts = mk(P.bolt, M.woodLight, N, true), slid = mk(P.slider, M.metal, N, false);
  const all = [bodyW, bodyI, limbs, wheel, strings, bolts, slid];

  // per ballista state
  const S = sites.map((s, i) => ({
    s, base: Math.PI / 2 - s.a, sweepT: Math.random() * 6.28, sweepAmp: 0.75 + Math.random() * 0.2, sweepRate: 0.2 + Math.random() * 0.06,
    sweep0: 0, base0: 0, phase: 'ready', t: 0, next: 6 + Math.random() * 40 + i * 1.3, phi: PHI, slider: Z_COCK, wheelA: 0, boltOn: true,
    bp: new THREE.Vector3(), bv: new THREE.Vector3(), flying: false, ft: 0, yaw: 0,
    big: s.kind === 'dragonbane', sc: new THREE.Vector3().setScalar(s.kind === 'dragonbane' ? DB_SCALE : 1),     // p35: the DRAGONBANE is the same engine, half as big again, in navy wood
  }));
  for (const b of S) { b.sweep0 = b.sweepAmp; b.base0 = b.base; }
  const body = new THREE.Matrix4(), m1 = new THREE.Matrix4(), m2 = new THREE.Matrix4(), mq = new THREE.Quaternion(), ONE = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0), Zax = new THREE.Vector3(0, 0, 1), vp = new THREE.Vector3(), vt = new THREE.Vector3(), vd = new THREE.Vector3(), vs = new THREE.Vector3();
  const tipL = P.tip, mR = new THREE.Matrix4(), mL = new THREE.Matrix4(), tips = [new THREE.Vector3(), new THREE.Vector3()];
  const rotY = (a) => mq.setFromAxisAngle(up, a);
  const out = [0, 0, 0, 0, 0, 0, 0];

  function step(b, dt) {
    b.sweepT += dt * b.sweepRate * (b.phase === 'ready' ? 1 : 0);
    b.t += dt;
    switch (b.phase) {
      case 'ready':
        b.next -= dt;
        if (b.next <= 0) { b.phase = 'aim'; b.t = 0; }
        break;
      case 'aim':                                                   // hold still for a moment
        if (b.t > 0.9) {
          b.phase = 'fire'; b.t = 0; b.boltOn = false;
          // launch the bolt from where it sits on the rail
          const yaw = b.yaw, pitch = manual && b.aimY != null ? Math.max(-0.6, Math.min(0.5, b.aimY / 90 + 0.08)) : 0.1, cp = Math.cos(pitch);
          body.compose(vp.set(b.s.x, b.s.y, b.s.z), rotY(yaw), b.sc);
          b.bp.set(0, SLIDER_Y + 0.12, Z_COCK).applyMatrix4(body);
          b.bv.set(Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp).multiplyScalar(78);
          b.flying = true; b.ft = 0; onFire && onFire(b.bp.x, b.bp.y, b.bp.z);
        }
        break;
      case 'fire': {                                                // limbs spring forward and ring out
        const k = b.t;
        b.phi = PHI * Math.exp(-k * 7) * Math.cos(k * 26);
        b.slider = Z_REST - (Z_REST - Z_COCK) * Math.exp(-k * 14);
        if (k > 0.9) { b.phi = 0; b.slider = Z_REST; b.phase = 'rest'; b.t = 0; }
        break; }
      case 'rest': if (b.t > 1.4) { b.phase = 'cock'; b.t = 0; } break;
      case 'cock': {                                                // the winch turns, limbs bend back, string comes back
        const k = Math.min(1, b.t / 2.4), e = k * k * (3 - 2 * k);
        b.phi = PHI * e; b.slider = Z_REST - (Z_REST - Z_COCK) * e; b.wheelA = -e * 7.5;
        if (b.t >= 2.4) { b.phase = 'load'; b.t = 0; }
        break; }
      case 'load': if (b.t > 0.35) { b.boltOn = true; b.phase = 'ready'; b.phi = PHI; b.slider = Z_COCK; b.next = 22 + Math.random() * 38; } break;
      default: break;
    }
    if (b.flying) {
      b.ft += dt; b.bv.y -= 14 * dt; b.bp.addScaledVector(b.bv, dt);
      if (b.ft > 2.6 || b.bp.y < height(b.bp.x, b.bp.z) - 0.2 || b.bp.distanceTo(vp.set(b.s.x, b.s.y, b.s.z)) > 380) b.flying = false;
    }
  }

  // attack mode: the sim decides who shoots at whom. fire(): turn toward the target and loose a bolt right away; hide(): the tower fell
  let manual = false;
  const setManual = (on) => { manual = on; for (const b of S) { if (on) { b.sweepAmp = 0; b.next = 1e9; } else { b.sweepAmp = b.sweep0; b.next = 6 + Math.random() * 30; b.dead = false; b.dead2 = false; b.base = b.base0; } } };
  const fire = (tid, tx, ty, tz) => {
    for (const b of S) if (b.s.tid === tid && !b.dead) {
      if (b.phase !== 'ready' && b.phase !== 'aim') return;
      b.base = b.yaw = Math.atan2(tx - b.s.x, tz - b.s.z); b.sweepAmp = 0; b.phase = 'aim'; b.t = 0.85; b.aimY = ty - b.s.y;
    }
  };
  const hide = (tid) => { for (const b of S) if (b.s.tid === tid) b.dead = true; };
  const replace = (tids) => { const set = new Set(tids || []); for (const b of S) b.repl = set.has(b.s.tid); };     // (a Tesla coil stands there instead)
  const reset = () => { for (const b of S) { b.dead = false; b.flying = false; b.phase = 'ready'; b.boltOn = true; b.phi = PHI; b.slider = Z_COCK; } };

  function update(t, dt, camera) {
    const cam = camera || null;
    out.fill(0);
    for (const b of S) {
      if (b.dead || b.repl) continue;
      const far = cam && Math.hypot(b.s.x - cam.position.x, b.s.z - cam.position.z) > 520;
      step(b, Math.min(dt, 0.05));
      if (far && !b.flying) continue;
      b.yaw = b.base + b.sweepAmp * Math.sin(b.sweepT);
      body.compose(vp.set(b.s.x, b.s.y, b.s.z), rotY(b.yaw), b.sc);
      let i = out[0]; bodyW.setMatrixAt(i, body); bodyI.setMatrixAt(i, body); bodyW.setColorAt(i, b.big ? DB_WOOD : WHITE); out[0] = out[1] = i + 1;
      // wheel
      m1.compose(vt.set(WHEEL[0] + 0.0, WHEEL[1], WHEEL[2]), mq.setFromAxisAngle(vd.set(1, 0, 0), b.wheelA), ONE); m1.premultiply(body); wheel.setMatrixAt(out[3], m1); out[3]++;
      // limbs: the right one bends about +Y at its root; the left one is the same mesh turned 180° about Z and bends the other way
      for (let k = 0; k < 2; k++) {
        const side = k ? -1 : 1, ml = k ? mL : mR;
        mq.setFromAxisAngle(up, side * b.phi); ml.compose(vt.set(side * ROOT_X, ROOT_Y, ROOT_Z), mq, ONE);
        if (side < 0) ml.multiply(m2.makeRotationZ(Math.PI));
        ml.premultiply(body); limbs.setMatrixAt(out[2], ml); limbs.setColorAt(out[2], b.big ? DB_LIMB : WHITE); out[2]++;
        tips[k].set(tipL.x, tipL.y, tipL.z).applyMatrix4(ml);                       // string end = limb tip, in world space
      }
      vs.set(0, SLIDER_Y, b.slider).applyMatrix4(body);
      for (let k = 0; k < 2; k++) {
        vd.subVectors(vs, tips[k]); const len = vd.length();
        mq.setFromUnitVectors(up, vd.normalize()); m1.compose(tips[k], mq, vt.set(1, len, 1)); strings.setMatrixAt(out[4], m1); out[4]++;
      }
      // slider block
      m1.compose(vt.set(0, SLIDER_Y - 0.06, b.slider), Qq.identity(), ONE); m1.premultiply(body); slid.setMatrixAt(out[6], m1); out[6]++;
      // bolt: on the rail, or in flight
      if (b.boltOn) { m1.compose(vt.set(0, SLIDER_Y + 0.12, b.slider), Qq.identity(), ONE); m1.premultiply(body); bolts.setMatrixAt(out[5], m1); bolts.setColorAt(out[5], b.big ? DB_LIMB : WHITE); out[5]++; }
      else if (b.flying) { vd.copy(b.bv).normalize(); mq.setFromUnitVectors(Zax, vd); m1.compose(b.bp, mq, b.sc); bolts.setMatrixAt(out[5], m1); bolts.setColorAt(out[5], b.big ? DB_LIMB : WHITE); out[5]++; }
    }
    bodyW.count = bodyI.count = out[0]; limbs.count = out[2]; wheel.count = out[3]; strings.count = out[4]; bolts.count = out[5]; slid.count = out[6];
    for (const im of all) { im.visible = im.count > 0; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
  }
  return { update, count: N, S, setManual, fire, hide, reset, replace };
}
