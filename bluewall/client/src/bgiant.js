// The walk of the battle giants (owner 4 Oct 21:51: "the giants' walk is still not natural").
// The troll's own walk clip is a hobble: the left foot hangs in the air and drops straight down, the right one stays planted, the feet travel ~1 m per step while the giant crosses
// the field at ~7 m/s, so the feet skate on the ground.  Here the upper body keeps the artist's walk (spine, arms, head) and the LEGS are re-made as a real alternating stride:
//   - each foot lies still on the ground while the body passes over it (stance: the foot moves back at one constant speed), then swings forward (swing) with a lift;
//   - two-bone leg IK on the model's own thigh / shin / ankle bones (baked into plain quaternion tracks, so the crowd bakes it like any other clip), the hips dip a little when the
//     legs are stretched (the weight of the body), the foot is flat on the ground and rolls toe-down when it leaves it;
//   - the speed of the stance foot is returned (units per second of clip time at playback rate 1) so the view can set the playback rate = ground speed / foot speed: no sliding.
// Everything is computed once per model from the loaded rig (no per-frame cost); deterministic.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const NAME = { hub: 'cave_troll_Hub001_05', L: ['cave_troll_LLeg1_06', 'cave_troll_LLeg2_07', 'cave_troll_LLegAnkle_08'], R: ['cave_troll_RLeg1_017', 'cave_troll_RLeg2_018', 'cave_troll_RLegAnkle_019'] };
export const STRIDE = {
  A: 48,            // half a stride in model units (the model is ~186 high): the stance foot travels 2A under the body
  P: 2.0,           // one cycle (both feet) in clip seconds
  Tsw: 0.7,         // swing time of a foot
  sw: { L: -0.1, R: 0.9 },        // swing start of each foot (matches the arm swing of the artist's clip)
  lift: 23,         // how high the foot is carried (ankle)
  ground: 16,       // ankle height when the sole lies flat (the artist's idle stands at 15.7: the sole is ~18 below the ankle bone, the feet sink a hair into the ground)
  out: 9,           // the feet are placed this far outside the hips
  reach: 0.965,     // longest leg stretch (of the straight leg)
};

const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _x = new THREE.Vector3(1, 0, 0);
const smooth = (u) => u * u * (3 - 2 * u);

// returns { clip, speed } or null (when the rig is not the troll)
export function trollStride(gltf, opt = {}) {
  const S = { ...STRIDE, ...opt };
  const walk = (gltf.animations || []).find((c) => c.name === 'walk');
  if (!walk) return null;
  const sc = SkeletonUtils.clone(gltf.scene), get = (n) => sc.getObjectByName(n);
  const hub = get(NAME.hub), leg = { L: NAME.L.map(get), R: NAME.R.map(get) };
  if (!hub || [...leg.L, ...leg.R].some((b) => !b)) return null;
  const F = 30, NF = Math.round(S.P * F);
  const cyc = THREE.AnimationUtils.subclip(walk, 'stride', 0, NF, F);
  cyc.name = 'stride';
  const mx = new THREE.AnimationMixer(sc); mx.clipAction(walk).play();
  const bones = [hub, ...leg.L, ...leg.R];
  // ---- the artist's pose per frame (world): positions + rotations of hub, thigh, shin, ankle for both legs
  const pos = [], rot = [];
  for (let i = 0; i <= NF; i++) {
    mx.setTime((i % NF) / F); sc.updateMatrixWorld(true);
    pos.push(bones.map((b) => b.getWorldPosition(new THREE.Vector3())));
    rot.push(bones.map((b) => b.getWorldQuaternion(new THREE.Quaternion())));
  }
  const l1 = leg.L[1].position.length() * hubScale(leg.L[0]), l2 = leg.L[2].position.length() * hubScale(leg.L[1]);
  const Lmax = (l1 + l2) * S.reach;
  // the flat-foot orientation: the artist's planted foot (frame at 0.7 s)
  const f0 = Math.round(0.7 * F), flat = { L: rot[f0][3].clone(), R: rot[f0][6].clone() };
  // ---- foot targets (world) per frame
  const T = { L: [], R: [] }, mean = (k, ax) => pos.slice(0, NF).reduce((a, p) => a + p[k][ax], 0) / NF;
  const hx = { L: mean(1, 'x'), R: mean(4, 'x') }, hz = (mean(1, 'z') + mean(4, 'z')) / 2;      // (the pelvis wobbles a few units in the artist's clip: the feet are placed from the mean hip, so they do not wobble with it)
  for (let i = 0; i <= NF; i++) {
    const t = i / F, hubY0 = pos[i][0].y;
    for (const side of ['L', 'R']) {
      const k = side === 'L' ? 1 : 4, hip = pos[i][k];
      let tt = (((t - S.sw[side]) % S.P) + S.P) % S.P, z, lift = 0, pitch = 0;
      if (tt < S.Tsw) {                                                    // swing: forward with a lift, toe down at the start, toe up before the landing
        const u = tt / S.Tsw; z = -S.A + 2 * S.A * smooth(u); lift = S.lift * Math.pow(Math.sin(Math.PI * u), 1.15);
        pitch = u < 0.5 ? 0.42 * (1 - u * 2) * (1 - u * 2) : -0.28 * Math.pow((u - 0.5) * 2, 2.5);
      } else {                                                             // stance: constant speed backwards; heel strike -> flat -> the heel lifts at the end
        const s = (tt - S.Tsw) / (S.P - S.Tsw); z = S.A - 2 * S.A * s;
        pitch = s < 0.12 ? -0.28 * (1 - s / 0.12) : s > 0.86 ? 0.42 * Math.pow((s - 0.86) / 0.14, 1.6) : 0;
        if (s > 0.86) lift = 4.0 * Math.pow((s - 0.86) / 0.14, 1.6) * 3.2;
      }
      T[side].push({ x: hx[side] + (side === 'L' ? 1 : -1) * S.out, y: S.ground + lift, z: hz + z, pitch, hipX: hip.x, hipZ: hip.z, hipY0: hip.y, hubY0 });
    }
  }
  // ---- how far the hips have to dip so that both legs reach their feet (the hip joints sit at the hub's height in the artist's pose: the hub moves with the hips)
  const dy = [];
  for (let i = 0; i <= NF; i++) {
    let d = 0;
    for (const side of ['L', 'R']) {
      const g = T[side][i], dh = Math.hypot(g.x - g.hipX, g.z - g.hipZ), room = Math.sqrt(Math.max(1, Lmax * Lmax - dh * dh));
      d = Math.min(d, g.y + room - g.hipY0);
    }
    dy.push(d);
  }
  // smooth the dip around the loop
  { const c = dy.slice(0, NF); for (let i = 0; i < NF; i++) { let m = 0; for (let j = -3; j <= 3; j++) m = Math.min(m, c[(i + j + NF) % NF]); dy[i] = m; } dy[NF] = dy[0]; }          // (widen the dips first, then blur: the blur never makes a dip shallower than the legs need)
  for (let pass = 0; pass < 3; pass++) { const c = dy.slice(0, NF); for (let i = 0; i < NF; i++) dy[i] = (c[(i + NF - 1) % NF] + 2 * c[i] + c[(i + 1) % NF]) / 4; dy[NF] = dy[0]; }
  // ---- the IK per frame -> quaternion tracks
  const times = new Float32Array(NF + 1); for (let i = 0; i <= NF; i++) times[i] = i / F;
  const qv = { L: [new Float32Array((NF + 1) * 4), new Float32Array((NF + 1) * 4), new Float32Array((NF + 1) * 4)], R: [new Float32Array((NF + 1) * 4), new Float32Array((NF + 1) * 4), new Float32Array((NF + 1) * 4)] };
  const hubPos = new Float32Array((NF + 1) * 3), hubScaleP = hubScale(hub);
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), axis = new THREE.Vector3(), pole = new THREE.Vector3(), d0 = new THREE.Vector3(), d1 = new THREE.Vector3();
  const stats = { reachErr: 0 };
  for (let i = 0; i <= NF; i++) {
    const dyi = i === NF ? dy[0] : dy[i];
    // hub
    _v.copy(pos[i][0]); _v.y += dyi; hub.parent.worldToLocal(_v); _v.toArray(hubPos, i * 3);
    for (const side of ['L', 'R']) {
      const k = side === 'L' ? 1 : 4, g = T[side][i], sg = side === 'L' ? 1 : -1;
      A.copy(pos[i][k]); A.y += dyi;
      C.set(g.x, g.y, g.z);
      axis.subVectors(C, A); let d = axis.length(); const dm = Math.min(d, Lmax); axis.divideScalar(d); d = dm;
      C.copy(A).addScaledVector(axis, d);                                         // (clamped to the reach)
      const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
      pole.set(0.22 * sg, 0, 1); pole.addScaledVector(axis, -pole.dot(axis)).normalize();
      B.copy(A).addScaledVector(axis, a).addScaledVector(pole, h);
      // thigh: swing the artist's thigh direction onto A->B
      d0.copy(_x).applyQuaternion(rot[i][k]);                                       // (the bone points along its local +x)
      d1.subVectors(B, A).normalize();
      const q1 = _q.setFromUnitVectors(d0, d1).clone().multiply(rot[i][k]);
      const q1l = rot[i][0].clone().invert().multiply(q1);
      // shin: B->C
      d0.copy(_x).applyQuaternion(rot[i][k + 1]); d1.subVectors(C, B).normalize();
      const q2 = _q2.setFromUnitVectors(d0, d1).clone().multiply(rot[i][k + 1]);
      const q2l = q1.clone().invert().multiply(q2);
      // ankle: the flat foot with the pitch of this moment (rotation about the lateral axis; positive = toe down)
      const qa = new THREE.Quaternion().setFromAxisAngle(_x, g.pitch).multiply(flat[side]);
      const qal = q2.clone().invert().multiply(qa);
      q1l.toArray(qv[side][0], i * 4); q2l.toArray(qv[side][1], i * 4); qal.toArray(qv[side][2], i * 4);
      stats.reachErr = Math.max(stats.reachErr, Math.abs(Math.hypot(g.x - A.x, g.y - A.y, g.z - A.z) - d));
    }
  }
  const drop = new Set(); for (const side of ['L', 'R']) for (let j = 0; j < 3; j++) drop.add(NAME[side][j] + '.quaternion'); drop.add(NAME.hub + '.position');
  cyc.tracks = cyc.tracks.filter((t) => !drop.has(t.name));
  for (const side of ['L', 'R']) for (let j = 0; j < 3; j++) cyc.tracks.push(new THREE.QuaternionKeyframeTrack(NAME[side][j] + '.quaternion', times, qv[side][j]));
  cyc.tracks.push(new THREE.VectorKeyframeTrack(NAME.hub + '.position', times, hubPos));
  cyc.resetDuration();
  const speed = (2 * S.A) / (S.P - S.Tsw);                                         // stance-foot speed in model units per second of clip time
  return { clip: cyc, speed, stats, dy: Array.from(dy).map((x) => +x.toFixed(1)), l1, l2, Lmax };
}

function hubScale(o) { o.updateWorldMatrix(true, false); return _v.setFromMatrixScale(o.matrixWorld).x; }
