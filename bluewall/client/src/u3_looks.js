// u3_looks.js — U3 attack units: the lich and the dark rider, built from REAL finished models (no hand-built helmets, capes or crowns).
//   lich       KayKit "Skeleton Rogue" (hooded skeleton, CC0, Kay Lousberg) + the pack's own staff, the KayKit clip pack (same rig as the mage's)
//   darkrider  "Dragon" by bocdagla (CC-BY) carries the "Low Poly Dark Knight" (Mixamo rig, CC-BY, giorgi.abashidze): the knight is posed in a riding seat once and rides a dragon bone as a prop
// bunits_ground.js / bunits_fly.js call setupLichU3(ctx) / setupDarkRiderU3(ctx); both return true when they built the kind (false = the old look stays as the fallback).
// ctx = the same context the shared setup functions get: { M, need, step, TYPE, count, TT, K, ... }
import * as THREE from 'three';
import { createKind } from './crowd.js';
import { GLINT, tintGear } from './unitlook.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const rad = (d) => (d * Math.PI) / 180;
// the forge tier's sheen (unitlook.js GLINT) is an additive glow made for mid-tone bodies; on these very dark ones it would wash them out, so it is kept at a fraction of its strength
const glintOf = (t, k) => (GLINT[t] ? [GLINT[t][0], GLINT[t][1] * k] : null);
// test hooks (dev only, harmless in the game): globalThis.__U3_OFF = 1 keeps the old looks (A/B runs); globalThis.__u3t collects the build times in ms
const off = () => globalThis.__U3_OFF === 1;
const lap = (k, t0) => { (globalThis.__u3t = globalThis.__u3t || {})[k] = Math.round((performance.now() - t0) * 10) / 10; };

// ------------------------------------------------------------------------------------------------ records (the layout editor / unitdefs read these; every number marked (ph) is a placeholder the server owner decides)
export const U3_LOOKS = {
  lich: { id: 'lich', model: 'u3_skel_rogue', staff: 'u3_staff', clips: ['Idle_A', 'Idle_B', 'Walking_A', 'Running_A', 'Ranged_Magic_Shoot', 'Hit_A', 'Death_A'], hue: 'swap' },
  darkrider: { id: 'darkrider', mount: 'u3_dragon_dark', rider: 'u3_dk_knight', clips: ['Idle_loop', 'Flying_loop', 'Attack', 'AttackPose'], hue: true },
};

// ------------------------------------------------------------------------------------------------ the lich
export async function setupLichU3(ctx) {
  const { M, need, step, count, TT, K } = ctx; if (off()) return false;
  const body = await need('u3_skel_rogue'), staff = await need('u3_staff'), kk = M.kk_anims || (await need('kk_anims'));
  if (!body || !kk) return false;
  const L = U3_LOOKS.lich, t = TT.lich | 0, t0 = performance.now();
  await step('lich', () => createKind({
    gltf: body, anims: { animations: kk.animations }, clips: L.clips, capacity: count.lich + 4, hue: L.hue, glint: glintOf(t, 0.6),
    props: staff ? [{ gltf: staff, bone: 'handslotr', s: 1, pos: [0, 0, 0], rot: [0, 0, 0] }] : [],
  }));
  tintGear(K.lich, t); lap('lich', t0);
  return true;
}


// ------------------------------------------------------------------------------------------------ the dark rider
// 1) the knight: the real Mixamo-rigged model, bones turned once into a riding seat (thighs forward, knees bent, hands forward), baked into plain geometry (the model itself is not touched)
const bn = (o) => o.name.replace(/^mixamorig:?/, '').replace(/_\d+$/, '');
const _w = new THREE.Quaternion(), _d = new THREE.Quaternion();
const rotW = (b, axis, deg) => {                                     // turn a bone about a WORLD axis through its own joint
  b.parent.updateWorldMatrix(true, false); b.parent.getWorldQuaternion(_w);
  _d.setFromAxisAngle(axis, rad(deg)); b.quaternion.premultiply(_w.clone().invert().multiply(_d).multiply(_w)); b.updateMatrixWorld(true);
};
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
export const SEAT_POSE = [                                          // [bone, axis, degrees] in order (the tuning knobs of the riding seat; +X = lean / bend forward-down, see rotW)
  ['Spine', X, 6], ['Spine1', X, 6],
  ['LeftUpLeg', X, -78], ['RightUpLeg', X, -78], ['LeftUpLeg', Y, 24], ['RightUpLeg', Y, -24], ['LeftLeg', X, 70], ['RightLeg', X, 70],
  ['LeftArm', Z, -34], ['RightArm', Z, 34], ['LeftArm', X, -62], ['RightArm', X, -62], ['LeftForeArm', X, -50], ['RightForeArm', X, -50],
  ['LeftForeArm', Y, -18], ['RightForeArm', Y, 18],
];
// finish per knight material: [metal, rough, class (0 plain, 1 = the forge tier's steel, 2 = its trim), shade]  (class 1 / 2 follow tintGear: the rider's armour shows the forge tier)
const FINISH = { hoodie: [0.0, 0.85, 0, 1.0], metal: [0.55, 0.42, 1, 0.5], leather: [0.0, 0.8, 0, 1.0] };
export function bakeSeatedKnight(gltf, pose = SEAT_POSE) {
  const root = SkeletonUtils.clone(gltf.scene), B = {}; root.traverse((o) => { if (o.isBone) B[bn(o)] = o; });
  root.updateMatrixWorld(true);
  for (const [name, axis, deg] of pose) if (B[name]) rotW(B[name], axis, deg);
  root.updateMatrixWorld(true);
  const hips = new THREE.Vector3(); B.Hips.getWorldPosition(hips);
  const geos = [], v = new THREE.Vector3(), c = new THREE.Color();
  root.traverse((o) => {
    if (!o.isSkinnedMesh) return;
    const g = o.geometry, n = g.attributes.position.count, P = new Float32Array(n * 3), col = new Float32Array(n * 3), gear = new Float32Array(n * 4), uv = new Float32Array(n * 2);
    const mat = Array.isArray(o.material) ? o.material[0] : o.material, F = FINISH[mat.name] || [0, 0.8, 0, 1]; c.copy(mat.color);
    for (let i = 0; i < n; i++) {
      o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld).toArray(P, i * 3);
      const k = F[3]; col[i * 3] = F[2] ? k : c.r * k; col[i * 3 + 1] = F[2] ? k : c.g * k; col[i * 3 + 2] = F[2] ? k : c.b * k;   // forge classes carry a plain shade (the tier colour multiplies it in the shader), the rest the material colour
      gear[i * 4] = F[0]; gear[i * 4 + 1] = F[1]; gear[i * 4 + 2] = F[2];
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aGear', new THREE.BufferAttribute(gear, 4)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    if (g.index) geo.setIndex(new THREE.BufferAttribute(new Uint32Array(g.index.array), 1)); geo.computeVertexNormals(); geos.push(geo);
  });
  return { geos, hips, height: new THREE.Box3().setFromObject(root, true).getSize(new THREE.Vector3()).y };
}

// 2) the seat on the dragon: measured in the rig space of the first frame of 'Flying_loop' (the dragon faces +z, y up), then expressed in the frame of the bone 'Body002' so he rides the wing-beat
export const SEAT = { pos: [0, 2.1, 0.2], k: 0.62, pitch: 0, bone: 'Body002', clip: 'Flying_loop' };
function riderProp(dragon, knight, S = SEAT) {
  const R = bakeSeatedKnight(knight), probe = SkeletonUtils.clone(dragon.scene), mx = new THREE.AnimationMixer(probe);
  mx.clipAction(dragon.animations.find((a) => a.name === S.clip)).play(); mx.setTime(0); probe.updateMatrixWorld(true);
  const bone = probe.getObjectByName(S.bone);
  const T = new THREE.Matrix4().compose(new THREE.Vector3(...S.pos), new THREE.Quaternion().setFromAxisAngle(X, rad(S.pitch)), new THREE.Vector3(S.k, S.k, S.k)).multiply(new THREE.Matrix4().makeTranslation(-R.hips.x, -R.hips.y, -R.hips.z));
  const L = new THREE.Matrix4().copy(bone.matrixWorld).invert().multiply(T), scene = new THREE.Group();
  for (const g of R.geos) { g.applyMatrix4(L); scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true }))); }
  return { scene };
}
export function mouthOf(dragon, clip = 'Flying_loop') {             // [forward, up] of the head tip in the rig space (the sim spawns the breath there, scaled by the instance scale)
  const probe = SkeletonUtils.clone(dragon.scene), mx = new THREE.AnimationMixer(probe), v = new THREE.Vector3();
  mx.clipAction(dragon.animations.find((a) => a.name === clip)).play(); mx.setTime(0); probe.updateMatrixWorld(true);
  probe.getObjectByName('HeadTip').getWorldPosition(v); return [v.z, v.y];
}

export async function setupDarkRiderU3(ctx) {
  const { need, step, TYPE, count, TT, K } = ctx; if (off()) return false;
  const dragon = await need('u3_dragon_dark'), knight = await need('u3_dk_knight');
  if (!dragon || !knight) return false;
  const L = U3_LOOKS.darkrider, t = TT.darkrider | 0, t0 = performance.now(), prop = riderProp(dragon, knight), mouth = mouthOf(dragon); lap('rider_bake', t0);
  const t1 = performance.now();
  await step('darkrider', () => createKind({ gltf: dragon, anims: dragon, clips: L.clips, capacity: count.darkrider + 3, hue: L.hue, glint: glintOf(t, 0.3), props: [{ gltf: prop, bone: SEAT.bone, s: 1, pos: [0, 0, 0], rot: [0, 0, 0] }] }));
  tintGear(K.darkrider, t); lap('darkrider_kind', t1);
  TYPE.darkrider = { turn: 2.4, lift: 14, air: true, big: true, bigFire: true, fire: 'shadow', mouth, parts: [
    { k: 'darkrider', scale: 1.5, crK: 3, clip: { idle: 'Idle_loop', hover: 'Flying_loop', run: 'Flying_loop', atk: ['Attack'], hit: 'Flying_loop' }, die: { tumble: { key: 'roll', to: 2.4, dur: 1.1, sink: 0 } } }] };
  return true;
}
