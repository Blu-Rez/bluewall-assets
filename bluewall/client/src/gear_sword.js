// The knights' sword arm (the UAL "K3" knight, knight_k3.glb: home riders in life.js, battle cavalry + the mounted lord in bunits.js).
// The model carries ONE riding clip ("Ride") with the sword stuck in the right hand. Three new clips are made from it once per model:
//   RideShoulder  at home: the blade rests on the right shoulder, the hand on the grip in front of the chest
//   RideDrawn     in battle (running / waiting): the sword is drawn and held up and forward
//   RideStrike    in battle (attacking): wind-up behind the shoulder, a fast diagonal cut across, follow-through, back to the ready guard
// Everything but the right arm is the original Ride animation, sample for sample, so the torso keeps rocking with the horse. The arm is
// solved per sample with a two-bone solver (shoulder -> elbow -> wrist) against targets written in the knight's own chest frame
// (metres for a 1.8 m man: x = his right, y = up, z = forward) and the hand is turned so the blade (the sword's own long axis, measured
// from its vertices) points where the pose says.  The result is plain quaternion tracks: both renderers (three.js mixers and the baked
// GPU crowds) play them like any other clip.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { trimClips } from './creature.js';

const DONE = new WeakMap();                           // gltf -> Set of the weapon kinds already done
const FPS = 30, ARM = 0.58;                           // wrist to shoulder, metres, for the scale of the targets

// poses: h = where the wrist is (from the shoulder joint), d = where the blade points, p = where the elbow points, n = which way the flat of
// the blade faces (optional: left to the solver, "up" = the flat lies on the shoulder)
export const POSES = {
  shoulder: { h: [-0.02, -0.17, 0.25], d: [0.1, 0.74, -0.62], p: [0.55, -0.8, -0.25], n: 'up' },
  drawn:    { h: [0.06, 0.02, 0.34], d: [-0.1, 0.8, 0.55], p: [0.55, -0.8, -0.2], n: 'side' },
  wind:     { h: [0.14, 0.2, -0.0], d: [0.05, 0.88, -0.4], p: [0.6, -0.5, -0.5], n: 'side' },
  cut:      { h: [-0.05, -0.02, 0.4], d: [-0.35, -0.5, 0.78], p: [0.6, -0.7, -0.1], n: 'side' },
  follow:   { h: [-0.3, -0.3, 0.26], d: [-0.6, -0.78, 0.25], p: [0.5, -0.8, -0.2], n: 'side' },
};
// the strike cycle: [fraction of the clip, pose, ease into it]
export const STRIKE = [[0, 'drawn', 'smooth'], [0.2, 'wind', 'smooth'], [0.38, 'cut', 'in'], [0.52, 'follow', 'out'], [0.66, 'follow', 'smooth'], [1, 'drawn', 'smooth']];

// the long axe of the axe riders (p32): d = from the hand up the haft to the head; n = where the BIT faces (the edge leads the swing: the haft turns over the top
// from "up and back" to "forward and down", so the bit faces forward-up in the wind-up and down at the blow), as a vector in the chest frame
export const AXE_POSES = {
  // rests on the right shoulder: the haft lies across the top of the shoulder, the head hangs up and behind, the butt sticks out in front of the fist
  shoulder: { h: [0.05, -0.1, 0.3], d: [0.12, 0.45, -0.88], p: [0.55, -0.8, -0.25], n: [0.15, 0.6, 0.78] },
  drawn:    { h: [0.08, 0.04, 0.34], d: [0.12, 0.92, 0.38], p: [0.55, -0.8, -0.2], n: [0, -0.38, 0.92] },
  wind:     { h: [0.12, 0.2, 0.0], d: [0.1, 0.78, -0.62], p: [0.6, -0.5, -0.5], n: [0, 0.86, 0.5] },
  cut:      { h: [0.02, 0.1, 0.36], d: [0.2, -0.62, 0.76], p: [0.6, -0.7, -0.1], n: [0, -0.9, -0.4] },
  follow:   { h: [0.0, -0.3, 0.3], d: [0.4, -0.84, 0.36], p: [0.5, -0.8, -0.2], n: [0.2, -0.5, -0.8] },
};
// shoulder -> lift behind -> chop down in front of the right knee -> follow-through low on the right -> back up onto the shoulder
export const AXE_STRIKE = [[0, 'shoulder', 'smooth'], [0.22, 'wind', 'smooth'], [0.4, 'cut', 'in'], [0.52, 'follow', 'out'], [0.66, 'follow', 'smooth'], [1, 'shoulder', 'smooth']];
// how the long axe sits in the hand (gear_axe.js AXE_GRIP: the haft along the hand's +z, the head up the haft, the bit towards the prop's -x)
export const AXE_RIDE = { pos: [-0.025, 0.09, 0], rotDeg: [90, -90, 0], s: 1 };
function axeAxes() {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...AXE_RIDE.rotDeg.map((d) => d * Math.PI / 180)));
  return { axis: new THREE.Vector3(0, 1, 0).applyQuaternion(q), flat: new THREE.Vector3(-1, 0, 0).applyQuaternion(q), signed: true };
}

const NAMES = ['upperarm_r', 'lowerarm_r', 'hand_r'];
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Vector3();

// ---------------------------------------------------------------- the sword's own axes, in the hand bone's frame
function measureSword(mesh, hand) {
  const g = mesh.userData.srcGeo || mesh.geometry, pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const hi = mesh.skeleton.bones.findIndex((b) => b.name === hand.name); if (hi < 0) return null;
  const M = new THREE.Matrix4().multiplyMatrices(mesh.skeleton.boneInverses[hi], mesh.bindMatrix);
  const pts = [];
  for (let i = 0; i < pos.count; i++) {
    let bi = 0, bw = -1; for (let c = 0; c < 4; c++) { const w = sw.getComponent(i, c); if (w > bw) { bw = w; bi = c; } }
    if (bw < 0.5 || si.getComponent(i, bi) !== hi) continue;
    pts.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(M));
  }
  if (pts.length < 20) return null;
  const mean = new THREE.Vector3(); pts.forEach((p) => mean.add(p)); mean.divideScalar(pts.length);
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const p of pts) { const d = [p.x - mean.x, p.y - mean.y, p.z - mean.z]; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) C[a][b] += d[a] * d[b]; }
  const mul = (m, x) => new THREE.Vector3(m[0][0] * x.x + m[0][1] * x.y + m[0][2] * x.z, m[1][0] * x.x + m[1][1] * x.y + m[1][2] * x.z, m[2][0] * x.x + m[2][1] * x.y + m[2][2] * x.z);
  const power = (m, seed) => { let x = seed.clone().normalize(); for (let i = 0; i < 80; i++) x = mul(m, x).normalize(); return x; };
  const a1 = power(C, new THREE.Vector3(0.3, 0.5, 0.8)), l1 = mul(C, a1).dot(a1);
  const A1 = [a1.x, a1.y, a1.z], C2 = C.map((r, i) => r.map((c, j) => c - l1 * A1[i] * A1[j]));
  const seed = new THREE.Vector3(0.7, -0.2, 0.1); seed.sub(a1.clone().multiplyScalar(a1.dot(seed)));
  const a2 = power(C2, seed), l2 = mul(C2, a2).dot(a2);
  const a3 = new THREE.Vector3().crossVectors(a1, a2).normalize();               // the thinnest direction = the face of the blade
  let lo = Infinity, hi2 = -Infinity; for (const p of pts) { const t = p.dot(a1); lo = Math.min(lo, t); hi2 = Math.max(hi2, t); }
  if (Math.abs(hi2) < Math.abs(lo)) a1.negate();                                   // the tip is the end that is farther from the hand
  let tMin = Infinity, tMax = -Infinity; for (const p of pts) { const t = p.dot(a1); tMin = Math.min(tMin, t); tMax = Math.max(tMax, t); }
  return { axis: a1, flat: a3, tMin, tMax, len: tMax - tMin, n: pts.length, spread: [l1, l2] };
}

// ---------------------------------------------------------------- one frame of the arm solver
function worldQ(o, out) { o.matrixWorld.decompose(_p, out, _s); return out; }
function setWorldQ(bone, qw) {
  const pq = worldQ(bone.parent, new THREE.Quaternion());
  bone.quaternion.copy(pq.invert().multiply(qw)); bone.updateMatrixWorld(true);
}
function solve(B, sw, T, D, P, N) {                  // (sw.signed: the flat has a front (an axe's bit), it is not turned over)
  // B: bones {up, low, hand}; T: wrist target (world), D: blade direction, P: elbow pole, N: flat-face target or null
  const S = B.up.getWorldPosition(new THREE.Vector3()), E0 = B.low.getWorldPosition(new THREE.Vector3()), W0 = B.hand.getWorldPosition(new THREE.Vector3());
  const l1 = E0.distanceTo(S), l2 = W0.distanceTo(E0);
  const to = T.clone().sub(S); let d = to.length(); const a = to.clone().divideScalar(d || 1);
  d = Math.min(Math.max(d, Math.abs(l1 - l2) * 1.02 + 1e-4), (l1 + l2) * 0.995);
  const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const pol = P.clone().sub(a.clone().multiplyScalar(P.dot(a))).normalize();
  const E = S.clone().add(a.clone().multiplyScalar(x)).add(pol.multiplyScalar(h));
  const Tw = S.clone().add(a.clone().multiplyScalar(d));
  // upper arm: aim at the elbow
  let q = worldQ(B.up, new THREE.Quaternion());
  setWorldQ(B.up, new THREE.Quaternion().setFromUnitVectors(E0.clone().sub(S).normalize(), E.clone().sub(S).normalize()).multiply(q));
  // forearm: aim at the wrist
  const E1 = B.low.getWorldPosition(new THREE.Vector3()), W1 = B.hand.getWorldPosition(new THREE.Vector3());
  q = worldQ(B.low, new THREE.Quaternion());
  setWorldQ(B.low, new THREE.Quaternion().setFromUnitVectors(W1.sub(E1).normalize(), Tw.clone().sub(E1).normalize()).multiply(q));
  // hand: the blade along D, the flat of the blade facing N
  q = worldQ(B.hand, new THREE.Quaternion());
  const cw = sw.axis.clone().applyQuaternion(q).normalize();
  const q2 = new THREE.Quaternion().setFromUnitVectors(cw, D).multiply(q);
  if (N) {
    const nw = sw.flat.clone().applyQuaternion(q2), nt = N.clone().sub(D.clone().multiplyScalar(N.dot(D)));
    if (nt.lengthSq() > 1e-6) {
      nt.normalize(); if (!sw.signed && nw.dot(nt) < 0) nt.negate();
      const ang = Math.atan2(_c.crossVectors(nw, nt).dot(D), nw.dot(nt));
      q2.premultiply(new THREE.Quaternion().setFromAxisAngle(D, ang));
    }
  }
  setWorldQ(B.hand, q2);
}

const ease = { smooth: (t) => t * t * (3 - 2 * t), in: (t) => t * t, out: (t) => 1 - (1 - t) * (1 - t) };
function mixPose(a, b, t) {
  const m = (x, y) => x.map((c, i) => c + (y[i] - c) * t);
  return { h: m(a.h, b.h), d: m(a.d, b.d), p: m(a.p, b.p), n: Array.isArray(a.n) && Array.isArray(b.n) ? m(a.n, b.n) : t < 0.5 ? a.n : b.n };
}
function poseAt(keys, u, POS = POSES) {
  for (let i = 0; i < keys.length - 1; i++) {
    const [u0, n0] = keys[i], [u1, n1, e] = keys[i + 1];
    if (u >= u0 && u <= u1) return mixPose(POS[n0], POS[n1], (ease[e] || ease.smooth)((u - u0) / Math.max(1e-6, u1 - u0)));
  }
  return POS[keys[keys.length - 1][1]];
}

// ---------------------------------------------------------------- build the clips
export const swordClips = (gltf, again) => weaponClips(gltf, 'sword', again);
export const axeClips = (gltf, again) => weaponClips(gltf, 'axe', again);            // Axe{Shoulder,Drawn,Strike}: for the axe riders' own copy of the knight (gear_plume.js axeKnight)
function weaponClips(gltf, kind, again) {
  if (!gltf) return gltf;
  const done = DONE.get(gltf) || new Set(); DONE.set(gltf, done);
  if (done.has(kind) && !again) return gltf; done.add(kind);
  const AX = kind === 'axe', PRE = AX ? 'Axe' : 'Ride', POS = AX ? AXE_POSES : POSES, STK = AX ? AXE_STRIKE : STRIKE;
  trimClips(gltf);
  const ride = (gltf.animations || []).find((c) => c.name === 'Ride'); if (!ride) return gltf;
  let kit = null; gltf.scene.traverse((o) => { if (!kit && o.isSkinnedMesh && o.material && o.material.name === 'Kit') kit = o; });
  if (!kit) return gltf;
  const root = SkeletonUtils.clone(gltf.scene); root.updateMatrixWorld(true);
  const get = (n) => root.getObjectByName(n);
  const B = { up: get('upperarm_r'), low: get('lowerarm_r'), hand: get('hand_r') }, chest = get('spine_03'), foot = get('foot_r'), ball = get('ball_r'), handL = get('hand_l');
  if (!B.up || !B.low || !B.hand || !chest) return gltf;
  const sw = AX ? axeAxes() : measureSword(kit, B.hand); if (!sw) return gltf;
  gltf['__' + kind] = sw;
  const mixer = new THREE.AnimationMixer(root), act = mixer.clipAction(ride); act.play();
  // the frame at the start: his right / up / forward in the clone's world, and the chest's orientation then
  mixer.setTime(0); root.updateMatrixWorld(true);
  const fwd0 = new THREE.Vector3(0, 0, 1), up0 = new THREE.Vector3(0, 1, 0);
  if (foot && ball) { const f = ball.getWorldPosition(new THREE.Vector3()).sub(foot.getWorldPosition(new THREE.Vector3())); f.y = 0; if (f.lengthSq() > 1e-8) fwd0.copy(f.normalize()); }
  const right0 = new THREE.Vector3().crossVectors(fwd0, up0).normalize();
  if (handL) { const r = B.hand.getWorldPosition(new THREE.Vector3()).sub(handL.getWorldPosition(new THREE.Vector3())); if (right0.dot(r) < 0) right0.negate(); }
  const chest0 = worldQ(chest, new THREE.Quaternion());
  const dur = ride.duration, n = Math.max(2, Math.round(dur * FPS));
  const make = (name, pose) => {
    const times = [], qs = { upperarm_r: [], lowerarm_r: [], hand_r: [] };
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      mixer.setTime(Math.min(dur * u, dur - 1e-4)); root.updateMatrixWorld(true);
      const dq = worldQ(chest, new THREE.Quaternion()).multiply(chest0.clone().invert());
      const R = right0.clone().applyQuaternion(dq), U = up0.clone().applyQuaternion(dq), F = fwd0.clone().applyQuaternion(dq);
      const S = B.up.getWorldPosition(new THREE.Vector3()), E = B.low.getWorldPosition(new THREE.Vector3()), W = B.hand.getWorldPosition(new THREE.Vector3());
      const m = (S.distanceTo(E) + E.distanceTo(W)) / ARM;                       // world units per metre
      const o = (a) => R.clone().multiplyScalar(a[0] * m).add(U.clone().multiplyScalar(a[1] * m)).add(F.clone().multiplyScalar(a[2] * m));
      const dir = (a) => R.clone().multiplyScalar(a[0]).add(U.clone().multiplyScalar(a[1])).add(F.clone().multiplyScalar(a[2])).normalize();
      const ps = pose(u);
      solve(B, sw, S.clone().add(o(ps.h)), dir(ps.d), dir(ps.p), ps.n === 'up' ? U : ps.n === 'side' ? R : Array.isArray(ps.n) ? dir(ps.n) : null);
      times.push(dur * u);
      for (const k of NAMES) { const bq = get(k).quaternion; qs[k].push(bq.x, bq.y, bq.z, bq.w); }
    }
    for (const k of NAMES) { const a = qs[k]; a.splice(a.length - 4, 4, a[0], a[1], a[2], a[3]); }      // the last key = the first: a seamless loop
    const keep = ride.tracks.filter((tr) => !NAMES.some((nm) => tr.name.split('.')[0] === nm));
    const arm = NAMES.map((k) => new THREE.QuaternionKeyframeTrack(k + '.quaternion', times, qs[k]));
    return new THREE.AnimationClip(name, dur, [...keep.map((t) => t.clone()), ...arm]);
  };
  const clips = [
    make(PRE + 'Shoulder', () => POS.shoulder),
    make(PRE + 'Drawn', () => POS.drawn),
    make(PRE + 'Strike', (u) => poseAt(STK, u, POS)),
  ];
  gltf.animations = (gltf.animations || []).filter((c) => !new RegExp('^' + PRE + '(Shoulder|Drawn|Strike)$').test(c.name)).concat(clips);
  return gltf;
}
