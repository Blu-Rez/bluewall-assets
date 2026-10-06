// Procedural rigged creatures for the battle, built in code (no model files): the kingdom's blue dragon and a pair of feathered wings for the
// winged horses. They are real THREE.SkinnedMesh rigs with keyframed clips, so crowd.js bakes them like any soldier and a whole flight of
// dragons / pegasi costs two or three draw calls and no CPU skinning.
//   makeDragonModel()  -> { gltf: { scene }, anims: { animations }, size }   clips: Fly, Glide, Breath, Idle, Walk, Death
//   makeWingModel()    -> { gltf, anims, size }                                  clips: Fly, Glide, Idle, Death     (white inner feathers, grey tips)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const C = (hex) => new THREE.Color(hex).convertSRGBToLinear();

// ---------------------------------------------------------------- geometry accumulator
class Acc {
  constructor(bones) { this.bones = bones; this.list = []; this.idx = Object.fromEntries(bones.map((b, i) => [b.name, i])); }
  // finish(geo, colorFn(x,y,z,i)->Color, boneFn(x,y,z,i)->[[name,w],..])
  add(geo, color, bone) {
    const g = geo.index ? geo.toNonIndexed() : geo; if (!g.attributes.normal) g.computeVertexNormals();
    const n = g.attributes.position.count, col = new Float32Array(n * 3), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), p = g.attributes.position;
    for (let i = 0; i < n; i++) {
      const c = typeof color === 'function' ? color(p.getX(i), p.getY(i), p.getZ(i), i) : color;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      const bw = typeof bone === 'function' ? bone(p.getX(i), p.getY(i), p.getZ(i), i) : [[bone, 1]];
      let tot = 0; bw.slice(0, 4).forEach(([nm, w], k) => { si[i * 4 + k] = this.idx[nm]; sw[i * 4 + k] = w; tot += w; });
      for (let k = 0; k < 4; k++) sw[i * 4 + k] /= tot || 1;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color', 'skinIndex', 'skinWeight'].includes(k)) g.deleteAttribute(k);
    this.list.push(g); return g;
  }
  box(cx, cy, cz, sx, sy, sz, color, bone, rot = null) { const g = new THREE.BoxGeometry(sx, sy, sz); if (rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rot))); g.translate(cx, cy, cz); return this.add(g, color, bone); }
  cone(cx, cy, cz, r, h, color, bone, rot = [0, 0, 0], seg = 6) { const g = new THREE.ConeGeometry(r, h, seg); g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rot))); g.translate(cx, cy, cz); return this.add(g, color, bone); }
  tube(a, b, r0, r1, color, bone, seg = 5) {                                   // tapered strut from a to b
    const d = V(b.x - a.x, b.y - a.y, b.z - a.z), len = d.length(), g = new THREE.CylinderGeometry(r1, r0, len, seg, 1);
    g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize())));
    g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); return this.add(g, color, bone);
  }
  tri(pts, color, bone) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap((p) => [p.x, p.y, p.z]), 3)); g.computeVertexNormals(); return this.add(g, color, bone); }
  merged() { return mergeGeometries(this.list, false); }
}

// ---------------------------------------------------------------- bones
function makeBones(def) {                                                      // def: [name, parent|null, [wx, wy, wz]]  (world positions at rest)
  const byName = {}, bones = [], world = {};
  for (const [name, parent, p] of def) {
    const b = new THREE.Bone(); b.name = name; world[name] = V(...p);
    if (parent) { const pw = world[parent]; b.position.set(p[0] - pw.x, p[1] - pw.y, p[2] - pw.z); byName[parent].add(b); } else b.position.set(...p);
    byName[name] = b; bones.push(b);
  }
  return { bones, byName, world };
}
function skinned(acc, bones, mat) {
  const mesh = new THREE.SkinnedMesh(acc.merged(), mat); mesh.frustumCulled = false;
  const root = bones[0]; mesh.add(root); mesh.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(bones));
  const scene = new THREE.Group(); scene.add(mesh); return scene;
}

// ---------------------------------------------------------------- clip helper
// track(bone, [axis x,y,z], fn(t01) -> angle)  sampled at n keys over the clip duration
function track(bone, axis, fn, dur, n = 16) {
  const times = [], vals = [], q = new THREE.Quaternion(), ax = V(...axis).normalize();
  for (let i = 0; i <= n; i++) { const t = i / n; times.push(t * dur); q.setFromAxisAngle(ax, fn(t)); vals.push(q.x, q.y, q.z, q.w); }
  return new THREE.QuaternionKeyframeTrack(bone + '.quaternion', times, vals);
}
// compose several axis tracks on one bone into one quaternion track
function pose(bone, fns, dur, n = 16) {                                        // fns: [{axis, f}]
  const times = [], vals = [], q = new THREE.Quaternion(), q2 = new THREE.Quaternion();
  for (let i = 0; i <= n; i++) {
    const t = i / n; q.identity();
    for (const { axis, f } of fns) { q2.setFromAxisAngle(V(...axis), f(t)); q.multiply(q2); }
    times.push(t * dur); vals.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(bone + '.quaternion', times, vals);
}

// ================================================================= DRAGON
export function makeDragonModel() {
  const W = {}, def = [
    ['root', null, [0, 0, 0]], ['hips', 'root', [0, 2.3, -0.8]], ['spine1', 'hips', [0, 2.4, 0.3]], ['chest', 'spine1', [0, 2.6, 1.4]],
    ['neck1', 'chest', [0, 2.9, 2.4]], ['neck2', 'neck1', [0, 3.4, 3.1]], ['head', 'neck2', [0, 3.8, 3.8]], ['jaw', 'head', [0, 3.55, 4.1]],
    ['tail1', 'hips', [0, 2.2, -1.8]], ['tail2', 'tail1', [0, 2.0, -3.2]], ['tail3', 'tail2', [0, 1.7, -4.6]], ['tail4', 'tail3', [0, 1.4, -5.8]], ['tail5', 'tail4', [0, 1.2, -6.8]],
  ];
  const wing = (s, n) => [[`w0${n}`, 'chest', [s * 0.8, 3.2, 1.3]], [`w1${n}`, `w0${n}`, [s * 3.4, 4.5, 1.0]], [`w2${n}`, `w1${n}`, [s * 6.4, 4.3, -0.2]], [`w3${n}`, `w2${n}`, [s * 9.6, 3.2, -1.8]]];
  def.push(...wing(1, 'R'), ...wing(-1, 'L'));
  const { bones } = makeBones(def); const A = new Acc(bones);
  const cTop = C(0x1c56c4), cMid = C(0x2a72e0), cBelly = C(0x9fe0ff), cDark = C(0x0c2a6e), cHorn = C(0xeaf2ff), cWing = C(0x2a62d0), cWingEdge = C(0x0c2a78), cEye = C(0xaaffff), cClaw = C(0xdfe9f5);

  // -------- body: lofted tube through stations (position, radius, bone)
  const ST = [
    [[0, 1.0, -7.5], 0.04, 'tail5'], [[0, 1.1, -6.8], 0.14, 'tail5'], [[0, 1.3, -5.8], 0.24, 'tail4'], [[0, 1.6, -4.6], 0.38, 'tail3'], [[0, 1.9, -3.2], 0.55, 'tail2'], [[0, 2.15, -1.8], 0.8, 'tail1'],
    [[0, 2.3, -0.8], 1.05, 'hips'], [[0, 2.4, 0.3], 1.2, 'spine1'], [[0, 2.6, 1.4], 1.25, 'chest'], [[0, 2.9, 2.3], 0.8, 'neck1'], [[0, 3.25, 2.9], 0.6, 'neck1'], [[0, 3.55, 3.4], 0.5, 'neck2'], [[0, 3.75, 3.9], 0.5, 'head'],
  ];
  { const RING = 9, pos = [], col = [], si = [], sw = [], idx = [];
    ST.forEach(([p, r, b], i) => {
      for (let k = 0; k < RING; k++) {
        const a = (k / RING) * Math.PI * 2, belly = Math.max(0, -Math.cos(a)), c = cTop.clone().lerp(cBelly, Math.pow(belly, 1.4) * 0.85); if (k === 0) c.copy(cDark);
        pos.push(p[0] + Math.sin(a) * r * 1.05, p[1] + Math.cos(a) * r * (k === 0 ? 1.12 : 0.92), p[2]); col.push(c.r, c.g, c.b); si.push(A.idx[b], 0, 0, 0); sw.push(1, 0, 0, 0);
      }
    });
    for (let i = 0; i < ST.length - 1; i++) for (let k = 0; k < RING; k++) { const a = i * RING + k, b = i * RING + (k + 1) % RING, c = (i + 1) * RING + k, d = (i + 1) * RING + (k + 1) % RING; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    A.list.push(g.toNonIndexed());
  }
  // -------- head: skull, snout, jaw, horns, brow, eyes
  A.box(0, 3.85, 4.15, 0.95, 0.8, 1.2, cTop, 'head'); A.box(0, 3.68, 4.95, 0.62, 0.5, 1.0, cMid, 'head'); A.box(0, 3.62, 5.55, 0.42, 0.34, 0.5, cMid, 'head');
  A.box(0, 3.4, 4.9, 0.5, 0.2, 1.3, cBelly, 'jaw'); A.box(0, 3.4, 5.5, 0.34, 0.16, 0.5, cBelly, 'jaw');
  for (const e of [-1, 1]) {
    A.cone(e * 0.5, 4.5, 3.55, 0.17, 1.9, cHorn, 'head', [-1.15, 0, e * 0.35]); A.cone(e * 0.62, 4.1, 3.85, 0.1, 1.0, cHorn, 'head', [-0.7, 0, e * 0.9]);
    A.box(e * 0.5, 4.08, 4.55, 0.22, 0.22, 0.3, cEye, 'head'); A.box(e * 0.38, 4.28, 4.4, 0.32, 0.12, 0.6, cDark, 'head', [0.2, 0, 0]);
  }
  // -------- back spikes + hind / fore legs (folded)
  ST.slice(4, 12).forEach(([p, r, b], i) => A.cone(0, p[1] + r * 1.1, p[2], 0.11 + r * 0.06, 0.4 + r * 0.45, cDark, b, [0.2, 0, 0], 4));
  const leg = (x, z, bone, front) => { const t = x > 0 ? 1 : -1; A.tube(V(x, 2.1, z), V(x * 1.12, 1.0, z + (front ? 0.35 : -0.5)), 0.34, 0.16, cMid, bone, 6); for (const q of [-0.18, 0, 0.18]) A.cone(x * 1.12 + q, 0.8, z + (front ? 0.6 : -0.2), 0.05, 0.34, cClaw, bone, [1.5, 0, 0], 4); };
  leg(0.95, 1.1, 'chest', true); leg(-0.95, 1.1, 'chest', true); leg(0.95, -0.8, 'hips', false); leg(-0.95, -0.8, 'hips', false);
  // -------- wings: leading-edge struts + membrane
  for (const [s, n] of [[1, 'R'], [-1, 'L']]) {
    const L = [[s * 0.8, 3.2, 1.3], [s * 3.4, 4.5, 1.0], [s * 6.4, 4.3, -0.2], [s * 9.6, 3.2, -1.8]].map((p) => V(...p));
    const T = [[s * 0.7, 2.7, -1.6], [s * 3.5, 2.5, -4.0], [s * 6.5, 2.3, -5.2], [s * 9.0, 1.9, -5.0]].map((p) => V(...p));
    const wb = (i) => `w${i}${n}`;
    for (let i = 0; i < 3; i++) A.tube(L[i], L[i + 1], 0.28 - i * 0.05, 0.2 - i * 0.04, cMid, wb(i), 5);
    // membrane (two sided via the material): leading edge to trailing edge, weighted by the strut it hangs on
    const mem = (a, b, c, wa, wbn, wc) => A.tri([a, b, c], (x, y, z) => cWing.clone().lerp(cWingEdge, THREE.MathUtils.clamp((Math.abs(x) - 1) / 9, 0, 1) * 0.8), (x, y, z) => {
      const d = [a, b, c].map((q) => q.distanceTo(V(x, y, z))); const idx = d.indexOf(Math.min(...d)); return [[[wa, wbn, wc][idx], 1]];
    });
    mem(L[0], L[1], T[1], wb(0), wb(1), wb(1)); mem(L[0], T[1], T[0], wb(0), wb(1), 'hips'); mem(L[1], L[2], T[2], wb(1), wb(2), wb(2)); mem(L[1], T[2], T[1], wb(1), wb(2), wb(1)); mem(L[2], L[3], T[3], wb(2), wb(3), wb(3)); mem(L[2], T[3], T[2], wb(2), wb(3), wb(2));
    // finger spokes
    A.tube(L[1], T[1], 0.1, 0.06, cDark, wb(1), 4); A.tube(L[2], T[2], 0.09, 0.05, cDark, wb(2), 4); A.tube(L[2], T[3], 0.08, 0.04, cDark, wb(2), 4);
    A.cone(L[3].x, L[3].y + 0.1, L[3].z, 0.14, 0.7, cHorn, wb(3), [0, 0, -s * 1.3], 4);                 // wing claw
  }
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.3, side: THREE.DoubleSide, envMapIntensity: 1.1 });
  const scene = skinned(A, bones, mat);

  // -------- clips
  const T = 0.9, tails = ['tail1', 'tail2', 'tail3', 'tail4', 'tail5'], necks = ['neck1', 'neck2', 'head'];
  const wingTracks = (amp, lag, openBase, dur, cycles = 1) => {
    const out = [];
    for (const [s, n] of [[1, 'R'], [-1, 'L']]) {
      [['w0', 1.0, 0], ['w1', 0.8, lag], ['w2', 0.7, lag * 2], ['w3', 0.6, lag * 3]].forEach(([b, k, ph], i) => out.push(pose(b + n, [{ axis: [0, 0, 1], f: (t) => s * (amp * k * Math.sin((t * cycles - ph) * Math.PI * 2) + (i === 0 ? openBase : openBase * 0.3)) }], dur)));
    }
    return out;
  };
  const body = (dur, pitch, cycles = 1) => [
    pose('hips', [{ axis: [1, 0, 0], f: (t) => 0.07 * Math.sin((t * cycles + 0.2) * Math.PI * 2) }], dur), pose('spine1', [{ axis: [1, 0, 0], f: (t) => 0.05 * Math.sin((t * cycles + 0.3) * Math.PI * 2) }], dur),
    pose('neck1', [{ axis: [1, 0, 0], f: (t) => pitch * 0.5 + 0.06 * Math.sin((t * cycles + 0.5) * Math.PI * 2) }], dur), pose('neck2', [{ axis: [1, 0, 0], f: (t) => pitch * 0.5 - 0.05 * Math.sin((t * cycles + 0.6) * Math.PI * 2) }], dur),
    ...tails.map((b, i) => pose(b, [{ axis: [0, 1, 0], f: (t) => 0.2 * Math.sin((t * cycles - i * 0.12) * Math.PI * 2) }, { axis: [1, 0, 0], f: (t) => 0.05 * Math.sin((t * cycles - i * 0.15 + 0.3) * Math.PI * 2) }], dur)),
  ];
  const fold = (dur, extra = []) => {                                              // wings tucked: shrunk onto the shoulders and hanging back
    const out = [];
    for (const [s, n] of [[1, 'R'], [-1, 'L']]) {
      out.push(pose('w0' + n, [{ axis: [0, 0, 1], f: () => s * -1.15 }, { axis: [0, 1, 0], f: () => s * 0.5 }], dur, 2)); out.push(new THREE.VectorKeyframeTrack('w0' + n + '.scale', [0, dur], [0.42, 0.42, 0.42, 0.42, 0.42, 0.42]));
    }
    return out.concat(extra);
  };
  const clips = [
    new THREE.AnimationClip('Fly', T, [...wingTracks(0.75, 0.07, 0.05, T), ...body(T, 0)]),
    new THREE.AnimationClip('Glide', 2.4, [...wingTracks(0.06, 0.05, 0.1, 2.4), ...body(2.4, 0.05)]),
    new THREE.AnimationClip('Breath', 1.1, [...wingTracks(0.55, 0.07, 0.15, 1.1), ...body(1.1, -0.35), pose('jaw', [{ axis: [1, 0, 0], f: () => 0.7 }], 1.1, 2), pose('head', [{ axis: [1, 0, 0], f: () => -0.25 }], 1.1, 2)]),
    new THREE.AnimationClip('Idle', 3.2, [...fold(3.2), ...body(3.2, 0.02), pose('chest', [{ axis: [1, 0, 0], f: (t) => 0.025 * Math.sin(t * Math.PI * 2) }], 3.2)]),
    new THREE.AnimationClip('Walk', 1.2, [...fold(1.2), ...body(1.2, 0.02, 1), pose('hips', [{ axis: [0, 1, 0], f: (t) => 0.1 * Math.sin(t * Math.PI * 2) }, { axis: [0, 0, 1], f: (t) => 0.06 * Math.sin(t * Math.PI * 2) }], 1.2)]),
    new THREE.AnimationClip('Death', 1.6, [...fold(1.6), pose('root', [{ axis: [0, 0, 1], f: (t) => Math.min(1, t * 1.6) * 2.9 }, { axis: [1, 0, 0], f: (t) => Math.min(1, t * 1.6) * 0.5 }], 1.6, 8), pose('neck2', [{ axis: [1, 0, 0], f: (t) => 0.5 * Math.min(1, t * 2) }], 1.6, 4), pose('jaw', [{ axis: [1, 0, 0], f: () => 0.4 }], 1.6, 2)]),
  ];
  return { gltf: { scene }, anims: { animations: clips }, size: { len: 15, wing: 20 } };
}

// ================================================================= PEGASUS WINGS (separate small rig, rides on the horse's back)
export function makeWingModel() {
  const def = [['root', null, [0, 0, 0]], ['back', 'root', [0, 0, 0]]];
  const W = (s, n) => [[`a${n}`, 'back', [s * 0.35, 0, 0]], [`b${n}`, `a${n}`, [s * 1.5, 0.3, -0.15]], [`c${n}`, `b${n}`, [s * 2.9, 0.4, -0.5]]];
  def.push(...W(1, 'R'), ...W(-1, 'L'));
  const { bones } = makeBones(def); const A = new Acc(bones);
  const cWhite = C(0xffffff), cCream = C(0xe9eef7), cGrey = C(0x8f9bb0), cDark = C(0x5c6880);
  for (const [s, n] of [[1, 'R'], [-1, 'L']]) {
    const bn = (i) => ['a', 'b', 'c'][i] + n;
    // feathers: quads fanning out from the wing's arm (leading edge) toward the back; two layers (coverts + primaries)
    const arm = [V(s * 0.35, 0, 0), V(s * 1.5, 0.3, -0.15), V(s * 2.9, 0.4, -0.5), V(s * 3.8, 0.35, -0.9)];
    for (let layer = 0; layer < 2; layer++) {
      const m = layer === 0 ? 16 : 12;
      for (let k = 0; k < m; k++) {
        const u = k / (m - 1), seg = Math.min(2, Math.floor(u * 3)), t3 = u * 3 - seg, p0 = arm[seg].clone().lerp(arm[seg + 1], Math.min(1, t3));
        const len = (layer === 0 ? 1.2 : 2.3) * (1.0 + 0.45 * Math.sin(u * 2.4)) * (1 - 0.2 * u), w = layer === 0 ? 0.62 : 0.74;
        const dir = V(s * 0.28 * (0.2 + u), -0.04 - (layer ? 0.0 : 0.02), -1).normalize(), side = V(s, 0, 0).multiplyScalar(w * 0.5), y = (layer ? -0.05 : 0.05) + k * 0.004;
        const a = p0.clone().add(V(0, y, 0)).sub(side), b = p0.clone().add(V(0, y, 0)).add(side), c = b.clone().addScaledVector(dir, len * 0.92), d = a.clone().addScaledVector(dir, len), tip = p0.clone().add(V(0, y, 0)).addScaledVector(dir, len * 1.12);
        const col = (x, yy, z) => { const dd = new THREE.Vector3(x, yy, z).sub(p0).length() / (len * 1.1); return cWhite.clone().lerp(layer ? cGrey : cCream, Math.min(1, dd * (layer ? 1.2 : 0.8))); };
        const wf = () => [[bn(Math.min(2, seg)), 1]];
        A.tri([a, b, c], col, wf); A.tri([a, c, d], col, wf); A.tri([d, c, tip], () => cGrey.clone().lerp(cDark, 0.35), wf);
      }
    }
    for (let i = 0; i < 3; i++) A.tube(arm[i], arm[i + 1], 0.13 - i * 0.025, 0.1 - i * 0.02, cWhite, bn(i), 5);
  }
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.0, side: THREE.DoubleSide, envMapIntensity: 0.9 });
  const scene = skinned(A, bones, mat);
  const wingTracks = (amp, lag, openBase, dur) => {
    const out = [];
    for (const [s, n] of [[1, 'R'], [-1, 'L']]) ['a', 'b', 'c'].forEach((b, i) => out.push(pose(b + n, [{ axis: [0, 0, 1], f: (t) => s * (amp * (1 - i * 0.15) * Math.sin((t - i * lag) * Math.PI * 2) + openBase) }], dur)));
    return out;
  };
  const foldT = (dur) => { const out = []; for (const [s, n] of [[1, 'R'], [-1, 'L']]) { out.push(pose('a' + n, [{ axis: [0, 0, 1], f: () => s * -1.0 }], dur, 2)); out.push(new THREE.VectorKeyframeTrack('a' + n + '.scale', [0, dur], [0.45, 0.45, 0.45, 0.45, 0.45, 0.45])); } return out; };
  const clips = [new THREE.AnimationClip('Fly', 0.8, wingTracks(0.7, 0.08, 0.1, 0.8)), new THREE.AnimationClip('Glide', 2, wingTracks(0.05, 0.04, 0.18, 2)),
    new THREE.AnimationClip('Idle', 2.4, foldT(2.4)), new THREE.AnimationClip('Death', 1.2, foldT(1.2))];
  return { gltf: { scene }, anims: { animations: clips }, size: { span: 7.6 } };
}
