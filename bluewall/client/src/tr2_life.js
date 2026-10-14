// TR2-S4d — the animals and the people of the Tripo library in the game (everything that lives: pasture herd, stable yard, worksites, town dogs, birds, hens, villagers).
//
// What the library gives (TR2_swap.md): animals = STATIC models (no rig), birds = flying poses, hen / rooster / chick = static, villagers = rigged (Tripo Biped, 78 joints) with ONE clip: `walk`.
// So this module does two things the old Mesh2Motion / Quaternius crowds did with baked clips:
//   fauna(spec, …)   an InstancedMesh of a static model with the SAME small API as a crowd kind (add -> p, p.play(name), update(t, camera, opts), remove(p), group, instances), so the herd brains of
//                    pas_life.js / wslife.js keep working unchanged.  The clip name only chooses a procedural gait on the whole body (bob + sway when walking / trotting, a nod when grazing, a breath
//                    when standing, a hop for 'Jump'): there are NO moving legs — the report says so.  One draw per species.
//   people(key, …)   a crowd.js kind (baked skeleton animation, 2-5 draws) built from a Tripo villager: clip 'Walk_Loop' = its `walk` clip, 'Idle_Loop' = ONE frozen frame of `walk` (the frame where the
//                    feet are closest together); every other clip name the old code asks for (Interact, Fixing_Kneeling, Idle_Talking_Loop, Sitting_Idle_Loop, Sword_Attack, Idle_Torch_Loop …)
//                    is the frozen frame too (there are no work / sit clips in the library: TR2_gaps.md row 16).  The villager is calibrated to a height in metres, feet on y = 0, so callers use scale 1.
//   gltfLike(spec)   { scene, animations: [] } of a static model, for creature.js makeCreature / herd (dogs, wolves, eagles, crows) — no mixer work, no skinning.
//   dyn(spec, n, …)  n dynamic instances of a static model (hens, rooster, chicks: life.js moves them every frame).
// Everything falls back to the old models when a Tripo file is missing (`ok` / `has(key)` are false): callers keep their old code path next to the new one.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { tr2 } from './tr2lib.js';
import { createKind } from './crowd.js';

/* global __BUILD__ */
const V = typeof __BUILD__ !== 'undefined' ? '?v=' + __BUILD__ : '';

// ---------------------------------------------------------------- what is loaded
export const ANIMAL_FILES = ['animal_cow', 'animal_calf', 'animal_horse_white', 'animal_horse_brown', 'animal_horse_black', 'animal_sheep', 'animal_lamb', 'animal_pig', 'animal_dog', 'animal_wolf', 'birds', 'poultry_fish_pack'];
// villager -> height in metres (the game scales people x1.7 so they read from the strategy camera: a 1.75 m man = 3.0 m)
export const PEOPLE = { villager_man: 3.0, villager_woman: 2.8, villager_youngman: 3.0, villager_oldman: 2.9, villager_oldwoman: 2.65, villager_boy: 2.3, villager_girl: 2.2, villager_littlegirl: 1.7 };
export const PEOPLE_FILES = ['villager_man', 'villager_woman', 'villager_youngman', 'villager_oldman'];

export const state = { ok: false, animals: false, people: false, has: {}, vill: {}, err: [] };
let loader = null;
const getLoader = () => loader || (loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder));
export const has = (k) => !!state.has[k];
export const ready = () => state.ok;

// Load what this module needs (call once, before the world builds its life; safe to call twice).  Never throws: a failed file only leaves its `has` false.
export async function preload({ animals = ANIMAL_FILES, people = PEOPLE_FILES } = {}) {
  if (state.loading) return state.loading;
  state.loading = (async () => {
    try { await tr2.init(); } catch (e) { state.err.push('init ' + e); return state; }
    try { const out = await tr2.load(animals); for (const n of animals) state.has[n] = !!out[n]; state.animals = animals.every((n) => state.has[n]); } catch (e) { state.err.push('animals ' + e); }
    await Promise.all(people.map(async (k) => {
      try { const g = await getLoader().loadAsync(tr2.base + k + '.glb' + V); const walk = (g.animations || []).find((a) => /walk/i.test(a.name)) || g.animations[0]; if (!walk) throw new Error('no walk clip'); state.vill[k] = { scene: g.scene, walk }; state.has[k] = true; }
      catch (e) { state.err.push(k + ' ' + e); state.has[k] = false; }
    }));
    state.people = people.every((k) => state.has[k]);
    state.ok = state.animals || state.people;
    try { if (typeof window !== 'undefined') window.__tr2life = state; } catch (e) { /* dev peek only */ }
    return state;
  })();
  return state.loading;
}

// pack nodes: tr2lib.parts() resets the node's translation AND scale, so a node comes out CENTRED (base at -h/2) and its swap `k` is off by 1/(node scale) — pass w / h explicitly and re-base here
// (found by TR2-S4d; the real fix belongs in tr2lib.parts: keep the node's y offset / re-base by the bounding box).  Single models are fine (base at y = 0).
const BASED = new Map();
function partsOf(spec, o = {}) {
  const ps = tr2.parts(spec, o);
  if (spec.indexOf('/') < 0) return ps;
  const key = spec + '|' + [o.ry, o.h, o.w, o.k].join(','); let hit = BASED.get(key); if (hit) return hit;
  const bb = new THREE.Box3(); for (const p of ps) { p.geometry.computeBoundingBox(); bb.union(p.geometry.boundingBox); }
  const dx = -(bb.min.x + bb.max.x) / 2, dy = -bb.min.y, dz = -(bb.min.z + bb.max.z) / 2;
  hit = ps.map((p) => { const g = p.geometry.clone(); g.translate(dx, dy, dz); g.computeBoundingBox(); g.computeBoundingSphere(); return { geometry: g, material: p.material }; });
  BASED.set(key, hit); return hit;
}

// ---------------------------------------------------------------- static animals as a crowd-like kind
// clip name (what pas_life / wslife already ask for) -> procedural gait
const MODE = { Idle: 'idle', Idle_2: 'idle', Idle_Headlow: 'idle', Eating: 'graze', Walk: 'walk', Trot: 'trot', Jump: 'hop' };
const TAU = Math.PI * 2;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _sph = new THREE.Sphere();

// spec = 'animal_cow' (a model file) or 'pack/node'; opts.len = the length (longest horizontal side) in metres of a scale-1 animal; capacity = most instances alive at once
export function fauna(spec, { len = 2, capacity = 32, shadows = true, name = '' } = {}) {
  if (!state.ok) return null;
  let ps; try { ps = partsOf(spec, { w: len }); } catch (e) { console.warn('tr2_life fauna', spec, e); return null; }
  const group = new THREE.Group(); group.name = 'tr2fauna:' + (name || spec);
  const meshes = ps.map((pt) => { const im = new THREE.InstancedMesh(pt.geometry, pt.material, capacity); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = !!shadows; im.receiveShadow = true; im.count = 0; im.visible = false; im.name = 'tr2:' + spec; group.add(im); return im; });
  const all = [];
  const kind = { group, instances: all, stats: {}, info: {}, fit: { k: 1, y: 0 }, len, static: true, people: false, has: (n) => n in MODE };
  kind.add = ({ x = 0, y = 0, z = 0, yaw = 0, scale = 1, clip = null, speed = 1, phase = 0 } = {}) => {
    const p = { x, y, z, yaw, scale, pitch: 0, roll: 0, r: len * scale * 0.6, cr: len * 0.6, lift: 0, mode: 'idle', sp: 1, ph: Math.random() * TAU, t0: 0, now: 0, sw: -1e9, kind };
    p.play = (n, o = {}) => { const md = MODE[n]; if (!md) return false; p.mode = md; p.sp = o.speed || 1; p.name = n; if (md === 'hop') p.t0 = kind.t; return true; };
    if (clip) p.play(clip, { speed });
    all.push(p); return p;
  };
  kind.remove = (p) => { const i = all.indexOf(p); if (i >= 0) all.splice(i, 1); };
  kind.t = 0;
  const list = [];
  kind.update = (t, camera, { maxDist = 700 } = {}) => {
    kind.t = t;
    _pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm);
    list.length = 0; const cp = camera.position;
    for (const p of all) {
      if (p.y < -500) continue;
      _sph.center.set(p.x, p.y + len * p.scale * 0.3, p.z); _sph.radius = len * p.scale * 0.75 + 1;
      if (_sph.center.distanceTo(cp) > maxDist || !_fr.intersectsSphere(_sph)) continue;
      list.push(p);
    }
    const n = Math.min(list.length, capacity);
    for (const im of meshes) { im.count = n; im.visible = n > 0; }
    if (!n) return;
    for (let i = 0; i < n; i++) {
      const p = list[i], u = t + p.ph; let bob = 0, pit = 0, rol = 0, sy = 1;
      switch (p.mode) {
        case 'walk': { const w = u * 1.15 * p.sp * TAU; bob = Math.abs(Math.sin(w)) * 0.012; rol = Math.sin(w) * 0.022; pit = Math.cos(w * 2) * 0.01; break; }
        case 'trot': { const w = u * 1.9 * p.sp * TAU; bob = Math.abs(Math.sin(w)) * 0.022; rol = Math.sin(w) * 0.03; pit = Math.cos(w * 2) * 0.02; break; }
        case 'graze': pit = 0.1 + Math.sin(u * 0.8) * 0.035; bob = -0.004; break;
        case 'hop': { const h = (t - p.t0) / 0.7; if (h >= 0 && h <= 1) bob = Math.sin(h * Math.PI) * 0.16; break; }
        default: sy = 1 + Math.sin(u * 1.6) * 0.005; rol = Math.sin(u * 0.35) * 0.004;
      }
      _e.set(p.pitch + pit, 0, p.roll + rol); _q.setFromAxisAngle(_up, p.yaw).multiply(_q2.setFromEuler(_e));
      _s.set(p.scale, p.scale * sy, p.scale); _p.set(p.x, p.y + bob * len * p.scale, p.z);
      _m.compose(_p, _q, _s);
      for (const im of meshes) im.setMatrixAt(i, _m);
    }
    for (const im of meshes) im.instanceMatrix.needsUpdate = true;
  };
  return kind;
}

// the three horse coats as ONE object with the crowd-kind API (coat = 0 bay / 1 black / 2 grey: spec.coat), three draws
const COAT_FILE = ['animal_horse_brown', 'animal_horse_black', 'animal_horse_white'];
export function horses({ len = 5.6, capacity = 28, shadows = true } = {}) {
  if (!COAT_FILE.every((f) => state.has[f])) return null;
  const ks = COAT_FILE.map((f) => fauna(f, { len, capacity, shadows })); if (ks.some((k) => !k)) return null;
  const group = new THREE.Group(); group.name = 'tr2horses'; ks.forEach((k) => group.add(k.group));
  const o = { group, kinds: ks, fit: { k: 1, y: 0 }, len, static: true, people: false, stats: {}, info: {}, has: ks[0].has };
  o.add = (spec = {}) => { const c = ((spec.coat | 0) % 3 + 3) % 3, p = ks[c].add(spec); p.coat = c; return p; };
  o.remove = (p) => p.kind && p.kind.remove(p);
  o.update = (t, camera, opts) => { for (const k of ks) k.update(t, camera, opts); };
  Object.defineProperty(o, 'instances', { get: () => ks.flatMap((k) => k.instances) });
  return o;
}

// ---------------------------------------------------------------- static model as a creature.js "gltf" (makeCreature / herd: dogs, wolves, eagles, crows)
export function gltfLike(spec, o = {}) {
  if (!state.ok) return null;
  let ps; try { ps = partsOf(spec, o); } catch (e) { return null; }
  const scene = new THREE.Group(); scene.name = 'tr2:' + spec;
  for (const p of ps) scene.add(new THREE.Mesh(p.geometry, p.material));
  return { scene, animations: [] };
}

// n dynamic instances (the caller sets matrices every frame): { meshes, set(i, matrix), flush(n) } — hens, rooster, chicks
export function dyn(spec, capacity, { w, h, k, ry, shadows = true, parent = null } = {}) {
  if (!state.ok) return null;
  let ps; try { ps = partsOf(spec, { w, h, k, ry }); } catch (e) { return null; }
  const meshes = ps.map((pt) => { const im = new THREE.InstancedMesh(pt.geometry, pt.material, capacity); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = !!shadows; im.receiveShadow = true; im.count = 0; im.name = 'tr2dyn:' + spec; parent && parent.add(im); return im; });
  return { meshes, set(i, m) { for (const im of meshes) im.setMatrixAt(i, m); }, flush(n) { for (const im of meshes) { im.count = n; im.visible = n > 0; im.instanceMatrix.needsUpdate = true; } } };
}

// ---------------------------------------------------------------- villagers: a baked-animation crowd kind (crowd.js) from a Tripo biped
const FOOT_L = 'L_Foot', FOOT_R = 'R_Foot';
function frozenClip(walk, tf, name) {                                                  // every track of `walk` held at time tf
  const tracks = walk.tracks.map((tr) => { const v = tr.createInterpolant().evaluate(tf); const T = tr.constructor; return new T(tr.name, [0, 1], [...v, ...v]); });
  return new THREE.AnimationClip(name, 1, tracks);
}
// The library's walk is a brisk stride (≈ 3.2–3.4 m/s for a 3 m figure); the game's people have always walked at ≈ 1.35–2.1 m/s with the clip played at ≈ 0.65×.  The clip is stretched ONCE here
// (WALK_SLOW), so `stats.walkSpeed` is the ground speed this slower stride matches and the callers' own rate maths (wslife setSpeed, pas_life manRate, units speed) keep the feet on the ground.
export const WALK_SLOW = 0.6;
function slowWalk(walk, f = WALK_SLOW) { return new THREE.AnimationClip('Walk_Loop', walk.duration / f, walk.tracks.map((tr) => tr.clone().scale(1 / f))); }
// look for the idle frame: the walk frame with the feet closest together (and level) — a standing-like pose.  Returns { tf, ws (walking speed m/s of the clip), minY, height } in the rig's own units.
function study(scene, walk) {
  const rig = SkeletonUtils.clone(scene); rig.updateMatrixWorld(true);
  const fl = rig.getObjectByName(FOOT_L), fr = rig.getObjectByName(FOOT_R);
  const mixer = new THREE.AnimationMixer(rig), act = mixer.clipAction(walk); act.play();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), N = 48; let best = 1e9, tf = 0, lo = 1e9, hi = -1e9;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * walk.duration; mixer.setTime(t); rig.updateMatrixWorld(true);
    if (fl && fr) { fl.getWorldPosition(a); fr.getWorldPosition(b); const d = Math.abs(a.z - b.z) + 3 * Math.abs(a.y - b.y) + Math.abs(a.x - b.x) * 0.2; if (d < best) { best = d; tf = t; } lo = Math.min(lo, a.z); hi = Math.max(hi, a.z); }
  }
  mixer.setTime(tf); rig.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(rig, true), sz = box.getSize(new THREE.Vector3());
  return { tf, ws: (hi - lo) / (0.6 * walk.duration), minY: box.min.y, height: sz.y, feetSep: best };
}
export function people(key, { capacity = 40, fps = 15, lod2 = null, height = PEOPLE[key] || 3.0 } = {}) {
  const v = state.vill[key]; if (!v) return null;
  const scene = SkeletonUtils.clone(v.scene);
  scene.traverse((o) => { if (o.isMesh && o.material) { const m = o.material; m.metalness = 0; m.roughness = 0.9; m.metalnessMap = null; m.roughnessMap = null; m.envMapIntensity = 0.35; if (m.map) m.map.anisotropy = 4; } });
  scene.updateMatrixWorld(true);
  const S = study(scene, v.walk), k = height / S.height;
  scene.scale.setScalar(k); scene.position.set(0, -S.minY * k, 0); scene.updateMatrixWorld(true);       // metres, feet on y = 0, so callers use scale 1
  const walk = slowWalk(v.walk), idle = frozenClip(v.walk, S.tf, 'Idle_Loop');
  const kind = createKind({ gltf: { scene, animations: [walk] }, anims: { animations: [walk, idle] }, clips: ['Idle_Loop', 'Walk_Loop'], capacity, fps, lod2 });
  kind.stats.walkSpeed = S.ws * k * WALK_SLOW; kind.people = true; kind.height = height; kind.key = key; kind.study = { ...S, k };
  const baseAdd = kind.add;
  kind.add = (spec = {}) => {                                                           // the old clip names map onto the two clips we have
    const { clip, speed = 1, phase = 0, ...rest } = spec, p = baseAdd({ ...rest, speed, phase, clip: null }), play = p.play;
    p.play = (name, o) => play(name === 'Walk_Loop' ? 'Walk_Loop' : 'Idle_Loop', o);
    if (clip) p.play(clip, { fade: false, speed, offset: phase });
    return p;
  };
  return kind;
}

// a plain skinned character (units.js: the few villagers that walk the fort): { root, scene, mixer, S, k, walk, idle } — metres, feet on y = 0, own mixer
export function skinned(key, { height = PEOPLE[key] || 3.0 } = {}) {
  const v = state.vill[key]; if (!v) return null;
  const scene = SkeletonUtils.clone(v.scene);
  scene.traverse((o) => { if (o.isMesh && o.material) { const m = o.material; m.metalness = 0; m.roughness = 0.9; m.metalnessMap = null; m.roughnessMap = null; m.envMapIntensity = 0.35; } });
  scene.updateMatrixWorld(true);
  const S = v.study || (v.study = study(scene, v.walk)), k = height / S.height;
  scene.scale.setScalar(k); scene.position.set(0, -S.minY * k, 0);
  const root = new THREE.Group(); root.add(scene);
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
  return { root, scene, mixer: new THREE.AnimationMixer(scene), S, k, walk: slowWalk(v.walk), idle: frozenClip(v.walk, S.tf, 'Idle_Loop'), speed: S.ws * k * WALK_SLOW };
}

export default { state, preload, has, ready, fauna, horses, people, skinned, gltfLike, dyn, PEOPLE };
