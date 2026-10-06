// Life at the stable and in the pasture (p22, "pasture") — every animal and every person here is an instance of a GPU crowd (crowd.js):
//   horses : ONE instanced draw for every coat (bay / black / dapple grey: the coat is a per-instance pick between three maps),
//   cows   : ONE instanced draw (five coats painted in the shader: brown, Holstein black-and-white, Hereford red with a white face,
//            cream dun, black), smooth-shaded,
//   people : the peasant man / woman crowds (2 + 1 draws) — trainer, groom, farrier, stable boy, hay carrier, the camp around the fire.
// All of them cast real (skinned) shadows through a depth twin of the crowd shader. No CPU skeletons, no mixers.
//
// WHY the old pasture horses "fell over": creature.js herd() picks its idle clip with /idle|eat|graz/i and the Mesh2Motion horse's FIRST
// clip is "Death" — d-EAT-h matches "eat" — so every resting horse played the death fall on a loop (and the black one at the trough
// dived head-first through it: "Eating" lowers the head to the ground). Here clips are chosen by exact name.
//
// Behaviour: horses graze (head down) for long spells, step on a little while grazing, stand and look around, walk to a new patch,
// now and then trot; foals keep close to their mother; cows graze in their own loose group (some mixing); everyone keeps clear of the
// others, the fence, the troughs and the resting winged horses; bodies pitch / roll with the ground. Far away nothing is computed.
//   buildPastureLife(group, height, { bay, black, grey, models, creatures, shadows }) -> { addCows(cowGltf), update(t, dt, P, camera) }
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshoptSimplifier } from 'three/addons/libs/meshopt_simplifier.module.js';
import * as L from './layout.js';
import { createKind } from './crowd.js';
import { peasantHeadProp } from './peasanthead.js';
import { mergeSkinned } from './creature.js';
import { SPOTS, STABLE_FX } from './pas_stable.js';
import { ENT, levelOf } from './skin.js';

const HS = 1.335, H_LEN = 5.6 * HS;                          // Mesh2Motion horse: bind box (tail straight back) -> a 5.6 m horse
const COW_LEN = 4.9;
// the lunge line (p34 P2: it was a 1 px line): a real rope — 6-sided cord with a twisted-strand texture, a slack belly (owner: «شل کن که شکم بندازه»), a brass snap at the horse's end and a loop at the trainer's hand.  One mesh + one snap, updated in place (no allocations).
function makeLungeLine() {
  const RS = 16, RR = 6, RAD = 0.04, group = new THREE.Group(); group.name = 'lungeLine';
  const pos = new Float32Array((RS + 1) * RR * 3), uv = new Float32Array((RS + 1) * RR * 2), idx = [];
  for (let i = 0; i <= RS; i++) for (let j = 0; j < RR; j++) { uv[(i * RR + j) * 2] = (i / RS) * 24; uv[(i * RR + j) * 2 + 1] = j / RR; }
  for (let i = 0; i < RS; i++) for (let j = 0; j < RR; j++) { const a = i * RR + j, b = i * RR + ((j + 1) % RR), c = (i + 1) * RR + j, d = (i + 1) * RR + ((j + 1) % RR); idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 32; const g = cv.getContext('2d'); g.fillStyle = '#d9c9a0'; g.fillRect(0, 0, 64, 32);
  g.strokeStyle = '#a08a5a'; g.lineWidth = 5; for (let k = -2; k < 6; k++) { g.beginPath(); g.moveTo(k * 16, 32); g.lineTo(k * 16 + 24, 0); g.stroke(); }
  g.strokeStyle = 'rgba(255,248,222,0.75)'; g.lineWidth = 2; for (let k = -2; k < 6; k++) { g.beginPath(); g.moveTo(k * 16 + 9, 32); g.lineTo(k * 16 + 33, 0); g.stroke(); }
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 })); mesh.frustumCulled = false; mesh.castShadow = false; group.add(mesh);
  const snap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd9a63a, roughness: 0.35, metalness: 0.8 })); snap.scale.set(1, 1.35, 0.8); snap.frustumCulled = false; group.add(snap);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.028, 6, 14), new THREE.MeshStandardMaterial({ color: 0xc9b98f, roughness: 1 })); loop.frustumCulled = false; group.add(loop);
  const A = new THREE.Vector3(), B = new THREE.Vector3(), M = new THREE.Vector3(), P = new THREE.Vector3(), T = new THREE.Vector3(), U = new THREE.Vector3(), V = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  return {
    group,
    set(ax, ay, az, bx, by, bz, floor) {                           // from the trainer's hand (a) to the horse's head (b); floor: the line never sags below it
      A.set(ax, ay, az); B.set(bx, by, bz); M.copy(A).add(B).multiplyScalar(0.5); const len = A.distanceTo(B); M.y = Math.max(floor + RAD, M.y - (0.4 + 0.24 * len));
      for (let i = 0; i <= RS; i++) {
        const t = i / RS, u = 1 - t; P.set(u * u * A.x + 2 * u * t * M.x + t * t * B.x, u * u * A.y + 2 * u * t * M.y + t * t * B.y, u * u * A.z + 2 * u * t * M.z + t * t * B.z);
        T.set(2 * u * (M.x - A.x) + 2 * t * (B.x - M.x), 2 * u * (M.y - A.y) + 2 * t * (B.y - M.y), 2 * u * (M.z - A.z) + 2 * t * (B.z - M.z)).normalize();
        U.crossVectors(T, UP); if (U.lengthSq() < 1e-4) U.set(1, 0, 0); U.normalize(); V.crossVectors(T, U);
        const r = RAD * (i === 0 || i === RS ? 0.8 : 1);
        for (let j = 0; j < RR; j++) { const a = (j / RR) * Math.PI * 2, c = Math.cos(a) * r, s2 = Math.sin(a) * r, o = (i * RR + j) * 3; pos[o] = P.x + U.x * c + V.x * s2; pos[o + 1] = P.y + U.y * c + V.y * s2; pos[o + 2] = P.z + U.z * c + V.z * s2; }
      }
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
      snap.position.copy(B); loop.position.copy(A); loop.lookAt(B);
    },
  };
}
const PEG_REST = [];   // p34 P1: no winged horses in the stable pasture any more (they were [[-16, -6], [-9, 12], [10, 15], [17, -3]]; army.js)
const _v = new THREE.Vector3(), _b = new THREE.Box3();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// ------------------------------------------------------------------ crowd helpers
// the crowd's own skinning code, lifted from its patched material, for a depth twin (real shadows of the animated pose)
export function crowdShadows(kind, on) {
  for (const im of kind.group.children) {
    if (!im.isInstancedMesh || !im.material.onBeforeCompile) continue;
    const sh = { uniforms: {}, vertexShader: '#include <common>\n@@\n#include <beginnormal_vertex>\n@@\n#include <begin_vertex>\n', fragmentShader: '#include <common>\n#include <map_fragment>\n' };
    (im.userData.pasOrig || im.material.onBeforeCompile)(sh);
    const v = sh.vertexShader, HEAD = v.slice(v.indexOf('#include <common>\n') + 18, v.indexOf('\n@@')), s0 = v.indexOf('#include <beginnormal_vertex>\n') + 30, SKIN = v.slice(s0, v.indexOf('objectNormal =', s0));
    if (!HEAD || !SKIN || !sh.uniforms.uBones) continue;
    const U = sh.uniforms;
    const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    dm.onBeforeCompile = (s2) => {
      s2.uniforms.uBones = U.uBones; s2.uniforms.uTime = U.uTime; s2.uniforms.uBase = U.uBase;
      s2.vertexShader = s2.vertexShader.replace('#include <common>', '#include <common>\n' + HEAD).replace('#include <begin_vertex>', SKIN + '\nvec3 transformed = (bwS * vec4(position, 1.0)).xyz;');
    };
    dm.customProgramCacheKey = () => 'pascrowddepth';
    im.customDepthMaterial = dm; im.castShadow = !!on;
  }
}
// a per-instance variant (coat) rides in the 3rd decimal of the instance scale: scale = round(s, 2) + k / 1000
export const scaleK = (s, k) => Math.round(s * 100) / 100 + k / 1000;
const VARIANT = 'flat varying float vPasK;';
const VARIANT_V = 'vPasK = floor(mod(length(instanceMatrix[0].xyz) * 1000.0 + 0.5, 10.0));';
function chain(im, key, fn) {
  const prev = im.material.onBeforeCompile; im.userData.pasOrig = im.userData.pasOrig || prev;
  im.material.onBeforeCompile = (sh, r) => { prev(sh, r); fn(sh); };
  im.material.customProgramCacheKey = () => key; im.material.needsUpdate = true;
}
// horse coats: three maps, one draw
export function coatPatch(kind, maps) {
  for (const im of kind.group.children) {
    if (!im.isInstancedMesh || !im.material.map) continue;
    const u1 = { value: maps[1] || im.material.map }, u2 = { value: maps[2] || im.material.map };
    chain(im, 'pascoat1', (sh) => {
      sh.uniforms.uCoat1 = u1; sh.uniforms.uCoat2 = u2;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VARIANT).replace('#include <project_vertex>', VARIANT_V + '\n#include <project_vertex>');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + VARIANT + '\nuniform sampler2D uCoat1; uniform sampler2D uCoat2;')
        .replace('#include <map_fragment>', `#ifdef USE_MAP
  vec4 sampledDiffuseColor = vPasK < 0.5 ? texture2D(map, vMapUv) : vPasK < 1.5 ? texture2D(uCoat1, vMapUv) : texture2D(uCoat2, vMapUv);
  diffuseColor *= sampledDiffuseColor;
#endif`);
    });
  }
}
// cow coats: the flat vertex colours of the low-poly cow are repainted per instance; patches from a noise over the bind-pose body
export function cowPatch(kind) {
  for (const im of kind.group.children) {
    if (!im.isInstancedMesh) continue;
    im.material.roughness = 0.88; im.material.metalness = 0; im.material.envMapIntensity = 0.4;     // a hide, not plastic
    chain(im, 'pascow1', (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VARIANT + '\nvarying vec3 vPasP;').replace('#include <project_vertex>', VARIANT_V + '\nvPasP = position;\n#include <project_vertex>');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
${VARIANT} varying vec3 vPasP;
float cH(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float cN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(cH(i), cH(i + vec3(1,0,0)), f.x), mix(cH(i + vec3(0,1,0)), cH(i + vec3(1,1,0)), f.x), f.y), mix(mix(cH(i + vec3(0,0,1)), cH(i + vec3(1,0,1)), f.x), mix(cH(i + vec3(0,1,1)), cH(i + vec3(1,1,1)), f.x), f.y), f.z); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
{
  // the cow's flat colours (cow.glb): hide (0.192, 0.087, 0.022), light belly / face (0.382, 0.319, 0.233); muzzle, hooves, horns, eyes stay
  vec3 c = diffuseColor.rgb;
  float isHide = 1.0 - smoothstep(0.02, 0.07, distance(c, vec3(0.192, 0.087, 0.022)));
  float isLight = 1.0 - smoothstep(0.02, 0.07, distance(c, vec3(0.382, 0.319, 0.233)));
  vec3 P = vPasP * 2.2;
  float n = cN(P) * 0.65 + cN(P * 2.3) * 0.35, k = vPasK;
  vec3 hide = c, light = c;
  if (k < 0.5) { hide = c * vec3(1.15, 1.0, 0.9); }                                                         // brown (as bred)
  else if (k < 1.5) { hide = mix(vec3(0.018, 0.016, 0.015), vec3(0.8, 0.79, 0.76), smoothstep(0.47, 0.53, n)); light = vec3(0.8, 0.79, 0.76); }   // Holstein
  else if (k < 2.5) { hide = vec3(0.27, 0.075, 0.028); light = vec3(0.78, 0.76, 0.71); }                    // Hereford: red, white face
  else if (k < 3.5) { hide = vec3(0.5, 0.38, 0.22); light = vec3(0.7, 0.62, 0.48); }                         // cream dun
  else { hide = vec3(0.022, 0.02, 0.018); light = vec3(0.05, 0.045, 0.04); }                                  // black
  hide *= 0.86 + 0.24 * cN(P * 0.7 + 3.0);                                                                   // a little dirt and sheen
  diffuseColor.rgb = mix(mix(c, hide, isHide), light, isLight);
}`);
    });
  }
}
// smooth the low-poly cow (one welded, vertex-coloured skinned mesh)
export function smoothSkinned(root) {
  root.traverse((o) => {
    if (!o.isSkinnedMesh) return;
    const g = o.geometry.clone(); g.deleteAttribute('normal'); if (g.attributes.uv) g.deleteAttribute('uv');
    let w = null; try { w = mergeVertices(g, 1e-3); } catch (e) { w = null; }
    if (!w) return; w.computeVertexNormals(); if (!w.attributes.uv) w.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(w.attributes.position.count * 2), 2));
    o.geometry = w;
  });
}
// bind-pose size and where the nose is in a clip (posed, skinned vertices)
export function measure(src, clips, gaits = []) {
  const rig = SkeletonUtils.clone(src); rig.updateMatrixWorld(true);
  _b.setFromObject(rig, true); const size = _b.getSize(new THREE.Vector3()), minY = _b.min.y;
  const mixer = new THREE.AnimationMixer(rig), out = { size, minY, v: {} };
  // natural ground speed of a gait: a hoof's fore-aft travel happens while it stands on the ground (duty factor of the gait)
  let hoof = null, hy = 1e9; rig.traverse((o) => { if (o.isBone && /foot|hoof|toe|^FF\.|LowerLeg/i.test(o.name)) { o.getWorldPosition(_v); if (_v.y < hy) { hy = _v.y; hoof = o; } } });
  for (const [name, duty] of gaits) {
    const c = (src.userData.pasClips || []).find((a) => a.name === name); if (!c || !hoof) continue;
    const act = mixer.clipAction(c); act.play(); let lo = 1e9, hi = -1e9;
    for (let f = 0; f < 24; f++) { mixer.setTime((c.duration * f) / 24); rig.updateMatrixWorld(true); hoof.getWorldPosition(_v); lo = Math.min(lo, _v.z); hi = Math.max(hi, _v.z); }
    act.stop(); out.v[name] = (hi - lo) / (duty * c.duration);
  }
  for (const [name, f] of clips) {
    const c = (src.userData.pasClips || []).find((a) => a.name === name); if (!c) continue;
    const act = mixer.clipAction(c); act.play(); mixer.setTime(c.duration * f); rig.updateMatrixWorld(true);
    let best = -1e9, ny = 0; rig.traverse((o) => { if (!o.isSkinnedMesh) return; const pa = o.geometry.attributes.position; for (let i = 0; i < pa.count; i += 3) { o.getVertexPosition(i, _v); _v.applyMatrix4(o.matrixWorld); if (_v.z > best) { best = _v.z; ny = _v.y; } } });
    out[name] = { z: best, y: ny - minY }; act.stop();
  }
  return out;
}
export function prepHorse(gltf) {
  const src = SkeletonUtils.clone(gltf.scene);
  const drop = []; src.traverse((o) => { if (o.isMesh && o.material && o.material.name === 'Tack') drop.push(o); }); for (const o of drop) o.parent && o.parent.remove(o);
  src.traverse((o) => {
    if (!o.isMesh) return; const m = o.material;
    o.material = new THREE.MeshStandardMaterial({ map: m.map, normalMap: m.normalMap || null, roughness: 0.62, metalness: 0, envMapIntensity: 0.55, name: m.name });
  });
  src.userData.pasClips = gltf.animations;
  return src;
}

// ------------------------------------------------------------------ the life
export function buildPastureLife(group, height, opt) {
  const { bay, black, grey, creatures } = opt, models = opt.models || SPOTS.models;
  const shadows = opt.shadows !== false;
  const PA = L.PASTURE, R = { s: 4711 }, rnd = () => { R.s = (R.s * 16807) % 2147483647; return R.s / 2147483647; };
  const kinds = [], animals = [], people = [], yard = [], acts = [];
  // ---- horses: one kind for the three coats
  const hsrc = prepHorse(bay);
  const HCLIPS = ['Idle', 'Eating', 'Walk', 'Trot'].filter((n) => bay.animations.some((a) => a.name === n));
  const hk = createKind({ gltf: { scene: hsrc, animations: bay.animations }, anims: bay, clips: HCLIPS, capacity: 28, fps: 20 });
  const coatMap = (g) => { let m = null; g.scene.traverse((o) => { if (!m && o.isMesh && o.material && o.material.name !== 'Tack' && o.material.map) m = o.material.map; }); return m; };
  coatPatch(hk, [null, coatMap(black), coatMap(grey)]); crowdShadows(hk, shadows);
  // half the triangles (the index only: every vertex and its skin weights stay, so the baked animation is untouched) — 18 horses on screen
  // cost ~55k triangles instead of ~110k, and the heavy crowd vertex shader runs on half the vertices that are actually referenced
  try {
    MeshoptSimplifier.ready.then(() => {
      for (const im of hk.group.children) {
        const g = im.geometry; if (!im.isInstancedMesh || !g.index || g.userData.pasLod) continue;
        const pos = g.attributes.position, P = new Float32Array(pos.count * 3); for (let i = 0; i < pos.count; i++) { P[i * 3] = pos.getX(i); P[i * 3 + 1] = pos.getY(i); P[i * 3 + 2] = pos.getZ(i); }
        const src = new Uint32Array(g.index.array), [dst] = MeshoptSimplifier.simplify(src, P, 3, Math.floor(src.length * 0.5 / 3) * 3, 0.012);
        if (dst && dst.length > src.length * 0.25) { g.setIndex(new THREE.BufferAttribute(pos.count < 65536 ? new Uint16Array(dst) : dst, 1)); g.userData.pasLod = dst.length / 3; }
      }
    }).catch(() => {});
  } catch (e) { /* no simplifier: full detail */ }
  group.add(hk.group); kinds.push(hk);
  const HM = measure(hsrc, [['Idle', 0.3], ['Eating', 0.55]], [['Walk', 0.6], ['Trot', 0.45]]);
  const HK = H_LEN / Math.max(HM.size.x, HM.size.z), HY = -HM.minY * HK;          // scale for a 5.6 m horse, lift so the hooves stand on y
  const noseI = HM.Idle ? HM.Idle.z * HK : 3.2, noseE = HM.Eating ? HM.Eating.z * HK : 3.5;
  // the ground speed each gait clip was made for (no sliding hooves): measured, with sane fallbacks
  const gaitV = { Walk: HM.v.Walk ? THREE.MathUtils.clamp(HM.v.Walk * HK, 1.6, 6) : 3.1, Trot: HM.v.Trot ? THREE.MathUtils.clamp(HM.v.Trot * HK, 3, 12) : 6.4 };
  const COATS = { bay: 0, black: 1, grey: 2 };
  const horse = (coat, s = 1, blob = true) => { const p = hk.add({ x: 0, y: -999, z: 0, yaw: 0, scale: scaleK(HK * s, COATS[coat] || 0) }); p.cr = 5 * s; p.s = s; p.lift = HY * s; if (blob) blobList.push([p, 6.2 * s, 2.5 * s]); return p; };

  // ---- people (peasant crowds); without the models the yard keeps its animals only
  let pm = null, pf = null;
  const anims = models && models.anims;
  const PCLIPS = ['Idle_Loop', 'Walk_Loop', 'Interact', 'Fixing_Kneeling', 'Sitting_Idle_Loop', 'Idle_Talking_Loop'];
  try {
    if (anims && models.peasant_m) { pm = createKind({ gltf: models.peasant_m, anims, clips: PCLIPS, capacity: 12, fps: 15, props: [peasantHeadProp(false, 0)], lod2: { cloth: 0x6e5a42, legs: 0x3b3129, h: 1.8 } }); pm.people = true; crowdShadows(pm, shadows); group.add(pm.group); kinds.push(pm); }
    if (anims && models.peasant_f) { pf = createKind({ gltf: models.peasant_f, anims, clips: PCLIPS, capacity: 8, fps: 15, props: [peasantHeadProp(true, 1)], lod2: { cloth: 0x7d5b4a, legs: 0x4a3a30, h: 1.75 } }); pf.people = true; crowdShadows(pf, shadows); group.add(pf.group); kinds.push(pf); }
  } catch (e) { console.warn('pasture people', e); }
  const PS = 1.75 * 0.95;
  const manRate = (v) => { const ws = (pm && pm.stats.walkSpeed) || 1.25; return THREE.MathUtils.clamp(v / (ws * PS), 0.6, 1.5); };   // Walk_Loop playback for a ground speed (no sliding feet)
  const person = (k, x, z, yaw, clip, phase = rnd() * 3) => { const kk = k === 'f' ? pf || pm : pm || pf; if (!kk) return null; const p = kk.add({ x, y: height(x, z), z, yaw, scale: PS, clip, phase }); p.cr = 2.6; yard.push(p); p.homeY = p.y; p.lift = 0; blobList.push([p, 1.7, 1.5]); return p; };

  // ---- soft contact shadows under every animal and person (one instanced draw; real shadows only exist where the sun's shadow map reaches)
  let blobs = null;
  try {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g2 = cv.getContext('2d'), gr = g2.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, '#fff'); gr.addColorStop(0.45, '#bbb'); gr.addColorStop(1, '#000'); g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
    const bg = new THREE.PlaneGeometry(1, 1); bg.rotateX(-Math.PI / 2);
    blobs = new THREE.InstancedMesh(bg, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, alphaMap: new THREE.CanvasTexture(cv), depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 64);
    blobs.count = 0; blobs.renderOrder = 1; blobs.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(blobs);
  } catch (e) { blobs = null; }
  const _bm = new THREE.Matrix4(), _bq = new THREE.Quaternion(), _bp = new THREE.Vector3(), _bs = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  const blobList = [];            // [instance, length, width]
  if (blobs) {                     // culled as one: a sphere round the pasture and the stable yard
    const cx = SPOTS.ready ? (PA.x + SPOTS.camp.x) / 2 : PA.x, cz = SPOTS.ready ? (PA.z + SPOTS.camp.z) / 2 : PA.z;
    blobs.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, height(cx, cz), cz), (SPOTS.ready ? Math.hypot(PA.x - SPOTS.camp.x, PA.z - SPOTS.camp.z) / 2 : 0) + PA.r + 34);
  }
  // ---- the hay bundle the carrier shoulders (one tiny mesh)
  const bundle = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.62, 0.7), new THREE.MeshStandardMaterial({ color: 0xc8a75e, roughness: 1 }));
  bundle.castShadow = shadows; bundle.visible = false; group.add(bundle);

  // ================================================================ the pasture herd
  const fenceR = (SPOTS.fenceR || PA.r + 2) - 3.6;
  const obst = PEG_REST.map(([dx, dz]) => ({ x: PA.x + dx, z: PA.z + dz, r: 4.4 }));
  if (SPOTS.pTrough) obst.push({ x: SPOTS.pTrough.x, z: SPOTS.pTrough.z, r: 3.4, drink: SPOTS.pTrough });
  if (SPOTS.pRack) obst.push({ x: SPOTS.pRack.x, z: SPOTS.pRack.z, r: 3.6, rack: SPOTS.pRack });
  const freeAt = (x, z, rad, self) => {
    if (Math.hypot(x - PA.x, z - PA.z) > fenceR - rad * 0.4) return false;
    for (const o of obst) if (Math.hypot(x - o.x, z - o.z) < o.r + rad) return false;
    for (const a of animals) if (a !== self && Math.hypot(x - (a.tx ?? a.p.x), z - (a.tz ?? a.p.z)) < a.rad + rad + 1) return false;
    return true;
  };
  // horses keep to the half away from the cows (north-east), cows to the south-west half; both spill over a little
  const homeA = Math.atan2(SPOTS.gate ? SPOTS.gate.z - PA.z : 0, SPOTS.gate ? SPOTS.gate.x - PA.x : -1);
  const spot = (a, kind) => {
    const bias = kind === 'cow' ? homeA + Math.PI * 0.62 : homeA - Math.PI * 0.55;
    for (let k = 0; k < 30; k++) {
      const ang = bias + (rnd() - 0.5) * (kind === 'cow' ? 2.2 : 3.0), d = Math.sqrt(rnd()) * (fenceR - 3);
      const x = PA.x + Math.cos(ang) * d, z = PA.z + Math.sin(ang) * d;
      if (freeAt(x, z, a.rad, a)) return [x, z];
    }
    return null;
  };
  const addAnimal = (p, kind, o = {}) => {
    const a = { p, kind, rad: kind === 'cow' ? 2.1 : 2.4 * (p.s || 1), state: 'graze', timer: 2 + rnd() * 10, tx: null, tz: null, speed: 0, gait: '', mom: o.mom || null, pitch: 0, roll: 0, sAcc: rnd(), id: animals.length };
    animals.push(a); return a;
  };
  const playA = (a, clip, sp = 1) => { if (a.clip === clip && Math.abs((a.cs || 1) - sp) < 0.01) return; a.clip = clip; a.cs = sp; a.p.play(clip, { speed: sp, offset: rnd() * 2 }); };
  const GRAZE = { horse: 'Eating', cow: 'Eating' };
  let cowV = 1.6;
  const setGround = (a) => {
    const p = a.p, x = p.x, z = p.z, f = a.kind === 'cow' ? 1.8 : 2.4 * (p.s || 1), sw = 0.9;
    const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), h0 = height(x, z);
    const hF = height(x + fx * f, z + fz * f), hB = height(x - fx * f, z - fz * f), hL = height(x - fz * sw, z + fx * sw), hR = height(x + fz * sw, z - fx * sw);
    p.y = Math.min(h0, (hF + hB) / 2) + (p.lift || 0); p.pitch = -Math.atan2(hF - hB, 2 * f) * 0.9; p.roll = Math.atan2(hL - hR, 2 * sw) * 0.6;
  };
  // horses: 3 bay, 2 black, 3 grey, two foals at heel
  const hplan = [['bay', 1.0], ['grey', 1.04], ['black', 0.98], ['bay', 0.95], ['grey', 0.97], ['black', 1.03], ['bay', 1.0], ['grey', 0.92]];
  const mares = [];
  for (const [coat, s] of hplan) {
    const p = horse(coat, s); const a = addAnimal(p, 'horse'); const xz = spot(a, 'horse') || [PA.x, PA.z];
    p.x = xz[0]; p.z = xz[1]; p.yaw = rnd() * 6.28; setGround(a); a.state = rnd() < 0.7 ? 'graze' : 'stand'; playA(a, a.state === 'graze' ? 'Eating' : 'Idle', 0.9 + rnd() * 0.2);
    mares.push(a);
    creatures && creatures.push({ id: 'horse', r: 2.8, vis: () => group.visible && p.y > -500, center: () => _v.set(p.x, p.y + 2.4, p.z) });
  }
  for (const [mi, coat] of [[0, 'bay'], [4, 'grey']]) {
    const m = mares[mi], p = horse(coat, 0.6); const a = addAnimal(p, 'horse', { mom: m });
    p.x = m.p.x + 4; p.z = m.p.z + 2; p.yaw = m.p.yaw; setGround(a); playA(a, 'Idle');
  }
  // ---- the herd's brain
  function think(a, dt) {
    const p = a.p;
    a.timer -= dt;
    if (a.mom) {                                                          // a foal: stays at its mother's flank, dozes or nibbles when she grazes
      const m = a.mom.p, ox = m.x + Math.cos(m.yaw) * 3.4 - Math.sin(m.yaw) * 1.4, oz = m.z - Math.sin(m.yaw) * 3.4 - Math.cos(m.yaw) * 1.4, d = Math.hypot(ox - p.x, oz - p.z);
      const moving = a.state === 'walk' || a.state === 'trot';
      if (moving) { a.tx = ox; a.tz = oz; a.timer = 40; if (d < 1.0) { a.state = rnd() < 0.5 ? 'graze' : 'stand'; a.tx = a.tz = null; a.timer = 3 + rnd() * 6; } else if (d > 9) a.state = 'trot'; }
      else if (d > 3.2) { a.tx = ox; a.tz = oz; a.state = d > 9 ? 'trot' : 'walk'; a.timer = 40; }
    } else if (a.timer <= 0) {
      const r = rnd();
      if (a.state === 'graze' && r < 0.45) { a.state = 'step'; a.timer = 1.2 + rnd() * 1.5; }
      else if (a.state === 'step') { a.state = 'graze'; a.timer = 5 + rnd() * 12; }
      else if (r < 0.62) { const xz = spot(a, a.kind); if (xz) { a.tx = xz[0]; a.tz = xz[1]; a.state = a.kind === 'horse' && rnd() < 0.12 ? 'trot' : 'walk'; a.timer = 40; } else { a.state = 'stand'; a.timer = 3; } }
      else if (r < 0.7 && a.kind === 'horse') {                           // a drink at the trough / a mouthful at the hay rack
        const o = obst.find((q) => (q.drink && rnd() < 0.6) || q.rack) || null;
        if (o) { const ang = Math.atan2(p.z - o.z, p.x - o.x), rr = noseE + 0.6; a.tx = o.x + Math.cos(ang) * rr; a.tz = o.z + Math.sin(ang) * rr; a.face = o; a.state = 'walk'; a.timer = 30; }
      }
      else if (r < 0.86) { a.state = 'graze'; a.timer = 6 + rnd() * 14; }
      else { a.state = 'stand'; a.timer = 3 + rnd() * 7; }
    }
    // clips + motion
    let want = 0, gait = null;
    if (a.state === 'walk') { gait = 'Walk'; want = a.kind === 'cow' ? cowV * 0.8 : gaitV.Walk * 0.72 * (p.s < 0.8 ? 0.85 : 1); }
    else if (a.state === 'trot') { gait = 'Trot'; want = gaitV.Trot * 0.8 * (p.s < 0.8 ? 0.75 : 1); }
    else if (a.state === 'step') { gait = 'Walk'; want = a.kind === 'cow' ? cowV * 0.35 : gaitV.Walk * 0.3; }
    if (gait) {
      const clip = a.kind === 'cow' ? 'Walk' : gait, rate = a.kind === 'cow' ? want / cowV / (p.s || 1) : want / (gait === 'Walk' ? gaitV.Walk : gaitV.Trot) / (p.s || 1);
      playA(a, clip, Math.max(0.35, rate));
      let dx, dz;
      if (a.state === 'step') { dx = Math.sin(p.yaw); dz = Math.cos(p.yaw); }
      else { dx = a.tx - p.x; dz = a.tz - p.z; const d = Math.hypot(dx, dz); if (d < 0.8 || a.timer < 0) { a.state = a.face ? 'graze' : rnd() < 0.7 ? 'graze' : 'stand'; a.timer = a.face ? 6 + rnd() * 5 : 6 + rnd() * 12; if (a.face) { p.yawT = Math.atan2(a.face.x - p.x, a.face.z - p.z); a.face = null; } a.tx = a.tz = null; return; } dx /= d; dz /= d; }
      // keep clear of the others and of the fence / obstacles
      let sx = 0, sz = 0;
      for (const b of animals) { if (b === a) continue; const ex = p.x - b.p.x, ez = p.z - b.p.z, dd = Math.hypot(ex, ez), lim = a.rad + b.rad + 0.8; if (dd < lim && dd > 1e-3) { const k = (lim - dd) / lim; sx += ex / dd * k * 2.2; sz += ez / dd * k * 2.2; } }
      for (const o of obst) { if (o === a.face) continue; const ex = p.x - o.x, ez = p.z - o.z, dd = Math.hypot(ex, ez), lim = o.r + a.rad; if (dd < lim + 1 && dd > 1e-3) { const k = (lim + 1 - dd) / (lim + 1); sx += ex / dd * k * 3; sz += ez / dd * k * 3; } }
      { const ex = p.x - PA.x, ez = p.z - PA.z, dd = Math.hypot(ex, ez); if (dd > fenceR - 1) { sx -= ex / dd * 2.5; sz -= ez / dd * 2.5; } }
      const yawT = Math.atan2(dx + sx, dz + sz); let da = wrap(yawT - p.yaw); p.yaw += da * Math.min(1, dt * (a.state === 'trot' ? 2.2 : 1.6));
      const st = want * dt * Math.max(0.15, Math.cos(da));
      p.x += Math.sin(p.yaw) * st; p.z += Math.cos(p.yaw) * st;
      a.sAcc += st; if (a.sAcc > 0.6) { a.sAcc = 0; setGround(a); }
    } else {
      if (p.yawT != null) { const da = wrap(p.yawT - p.yaw); p.yaw += da * Math.min(1, dt * 1.2); if (Math.abs(da) < 0.02) p.yawT = null; }
      if (a.state === 'graze') playA(a, GRAZE[a.kind], a.kind === 'cow' ? 1 : 0.85);
      else playA(a, a.kind === 'cow' ? (a.id % 3 === 0 ? 'Idle_2' : a.id % 3 === 1 ? 'Idle_Headlow' : 'Idle') : 'Idle', 0.9);
    }
  }

  // ================================================================ the stable yard
  const yardHorses = [];
  let lunge = null, led = null, carrier = null;
  const fwd = (yaw, d) => [Math.sin(yaw) * d, Math.cos(yaw) * d];
  if (SPOTS.ready) {
    const ry = SPOTS.ry, back = ry + Math.PI;
    const yh = (coat, x, z, yaw, clip, y = null, s = 1) => { const p = horse(coat, s, y == null || y < height(x, z) + 0.3); p.x = x; p.z = z; p.yaw = yaw; p.y = (y ?? height(x, z)) + p.lift; p.homeY = p.y; p.play(clip, { fade: false, offset: rnd() * 3 }); yardHorses.push(p); yard.push(p); return p; };
    // heads over the stall doors: the nose ~1.2 m out of the doorway, standing on the stall floor (stone footing height)
    const sts = SPOTS.stalls || [];
    [['bay', 0], ['grey', 1], ['black', 3]].forEach(([coat, i]) => { const s = sts[i]; if (!s) return; const [dx, dz] = fwd(ry, 1.15 - noseI * 0.95); yh(coat, s.x + dx, s.z + dz, ry, 'Idle', SPOTS.stallY, 0.95); });
    // the grey tied at the rail, the groom brushing her
    if (SPOTS.rail) {
      const r = SPOTS.rail, [dx, dz] = fwd(ry, noseI - 0.5), p = yh('grey', r.x + dx, r.z + dz, back, 'Idle');
      const lx = Math.cos(back) * 1.75, lz = -Math.sin(back) * 1.75, [fx, fz] = fwd(back, 0.4), gx = p.x - lx + fx, gz = p.z - lz + fz;
      person('f', gx, gz, Math.atan2(p.x + fx * 0.5 - gx, p.z + fz * 0.5 - gz), 'Interact');
    }
    // the black eats from the hay pile, the farrier checks a front hoof
    if (SPOTS.hay) { const h = SPOTS.hay, yaw = ry - 2.3, [dx, dz] = fwd(yaw, noseE - 0.4); const p = yh('black', h.x - dx, h.z - dz, yaw, 'Eating'); const [sx, sz] = fwd(yaw + 1.2, 1.9), [fx, fz] = fwd(yaw, 1.6); person('m', p.x + sx + fx, p.z + sz + fz, yaw - 2.0, 'Fixing_Kneeling'); }
    // a bay drinks at the stone trough
    if (SPOTS.trough) { const t = SPOTS.trough, yaw = back + 0.15, [dx, dz] = fwd(yaw, noseE - 0.1); yh('bay', t.x - dx + 0.4, t.z - dz, yaw, 'Eating', null, 0.97); }
    // the round pen: the trainer in the middle lunges a bay on a circle
    if (SPOTS.pen) {
      const pn = SPOTS.pen, p = yh('bay', pn.x + 6.3, pn.z, 0, 'Trot', pn.floor);
      const tr = person('m', pn.x, pn.z, 0, 'Idle_Talking_Loop'); if (tr) { tr.y = pn.floor; tr.homeY = tr.y; }
      const rope = makeLungeLine(); group.add(rope.group);
      lunge = { p, tr, rope: rope.group, line: rope, pn, ang: rnd() * 6.28, vel: 0, mi: 0, mt: 0, M: [['Trot', 4.6, 24, 1], ['Walk', 2.0, 10, 1], ['Trot', 4.6, 24, -1], ['Walk', 2.0, 10, -1]] };
    }
    // the stable boy leads a horse from the big door to the pasture gate and back (a rest at both ends)
    if (SPOTS.door && SPOTS.gate) {
      const d = SPOTS.door, gt = SPOTS.gate, ix = PA.x + (gt.x - PA.x) * 0.78, iz = PA.z + (gt.z - PA.z) * 0.78;
      const path = [[d.x, d.z], [(d.x + gt.x) / 2 + 2, (d.z + gt.z) / 2], [gt.x, gt.z], [ix, iz]];
      const curve = new THREE.CatmullRomCurve3(path.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'), len = curve.getLength();
      const p = yh('grey', d.x, d.z, ry, 'Idle', null, 0.98); const b = person('m', d.x + 1.6, d.z, ry, 'Idle_Loop');
      led = { p, b, curve, len, s: 0, dir: 1, wait: 4, pt: new THREE.Vector3(), pt2: new THREE.Vector3() };
    }
    // the camp: two by the fire on the log benches, one telling a story, a woman at the washing line, a man mending the cart wheel
    if (SPOTS.fire) {
      const f = SPOTS.fire, S0 = SPOTS;
      // benches are at angles 0.6 / 2.3 / 4.0 (local frame) 2.6 m from the fire: convert local angle -> world
      const cs = Math.cos(S0.ry), sn = Math.sin(S0.ry);
      const local = (du, dv) => [f.x + cs * du + sn * dv, f.z - sn * du + cs * dv];
      [[0.6, 'm', 'Sitting_Idle_Loop'], [2.3, 'f', 'Sitting_Idle_Loop'], [4.0, 'm', 'Idle_Talking_Loop']].forEach(([a, k, clip]) => {
        const r0 = clip === 'Sitting_Idle_Loop' ? 2.55 : 3.0, [x, z] = local(Math.cos(a) * r0, Math.sin(a) * r0);
        const q = person(k, x, z, Math.atan2(f.x - x, f.z - z), clip);
        if (q && clip === 'Sitting_Idle_Loop') { q.y = height(x, z) + 0.05; q.homeY = q.y; }
      });
      if (S0.wash) person('f', S0.wash.x, S0.wash.z, S0.ry + Math.PI / 2 + 0.2, 'Interact');
      if (S0.cart) { const c = S0.cart, [ox, oz] = [c.x + Math.cos(S0.ry) * 2.6, c.z - Math.sin(S0.ry) * 2.6]; person('m', ox, oz, Math.atan2(c.x - ox, c.z - oz), 'Fixing_Kneeling'); }
      // the hay carrier: from the camp's bale stack to the stall porch and back
      if (S0.stackR && S0.porch) { const q = person('m', S0.stackR.x, S0.stackR.z, 0, 'Walk_Loop'); if (q) carrier = { q, a: S0.stackR, b: S0.porch, f: 0, dir: 1, wait: 0, load: true }; }
    }
  }

  // ================================================================ per frame
  let far = true, yardOn = false, acc = 0;
  const camP = new THREE.Vector3();
  const setYard = (on) => { if (on === yardOn) return; yardOn = on; for (const p of yard) p.y = on ? p.homeY ?? p.y : -999; if (!on) bundle.visible = false; if (lunge) lunge.rope.visible = on; };
  function update(t, dt, P, camera) {
    if (!camera) return;
    camP.copy(camera.position);
    const dP = Math.hypot(camP.x - PA.x, camP.z - PA.z), dY = SPOTS.ready ? Math.hypot(camP.x - SPOTS.camp.x, camP.z - SPOTS.camp.z) : 1e9;
    far = dP > 520 && dY > 520;
    const lv = levelOf(ENT.stable), yOn = SPOTS.ready && lv >= 1 && Math.min(dP, dY) < 380;
    STABLE_FX.update && STABLE_FX.update(t, P ? P.night : 0, SPOTS.ready && lv >= 1 && dY < 420);
    if (far) { for (const k of kinds) k.group.visible = false; bundle.visible = false; if (blobs) blobs.visible = false; return; }
    for (const k of kinds) k.group.visible = true;
    // the herd (a slower brain when the camera is not close)
    acc += dt; const step = dP > 260 ? 0.2 : 0;
    if (acc >= step) { const d2 = Math.min(0.25, acc); acc = 0; for (const a of animals) think(a, d2); }
    // the yard
    setYard(yOn);
    if (yOn) {
      if (lunge) {
        const L2 = lunge; L2.mt += dt; if (L2.mt > L2.M[L2.mi][2]) { L2.mt = 0; L2.mi = (L2.mi + 1) % L2.M.length; const g = L2.M[L2.mi][0]; L2.p.play(g, { speed: L2.M[L2.mi][1] / gaitV[g] }); }
        const M = L2.M[L2.mi]; L2.vel += (M[1] - L2.vel) * Math.min(1, dt * 0.8); L2.ang += M[3] * L2.vel / 6.3 * dt;
        const x = L2.pn.x + Math.cos(L2.ang) * 6.3, z = L2.pn.z + Math.sin(L2.ang) * 6.3, dx = -Math.sin(L2.ang) * M[3], dz = Math.cos(L2.ang) * M[3];
        L2.p.x = x; L2.p.z = z; let da = wrap(Math.atan2(dx, dz) - L2.p.yaw); L2.p.yaw += da * Math.min(1, dt * 6);
        if (L2.tr) { const want = Math.atan2(x - L2.pn.x, z - L2.pn.z) - 0.25 * M[3]; L2.tr.yaw += wrap(want - L2.tr.yaw) * Math.min(1, dt * 3); }
        // the line: the trainer's hand -> a little sag -> the horse's head
        const hx = L2.pn.x + Math.sin(L2.tr ? L2.tr.yaw : 0) * 0.7, hz = L2.pn.z + Math.cos(L2.tr ? L2.tr.yaw : 0) * 0.7, hy = L2.pn.floor + 2.2;
        const [nx, nz] = fwd(L2.p.yaw, noseI - 0.8), ny = L2.p.y - L2.p.lift + 3.4;
        L2.line.set(hx, hy, hz, x + nx, ny, z + nz, L2.pn.floor + 0.35);
        if (!L2.started) { L2.started = true; L2.p.play('Trot', { speed: 4.6 / gaitV.Trot }); }
      }
      if (led) {
        const D = led, p = D.p, b = D.b;
        if (D.wait > 0) { D.wait -= dt; if (D.wait <= 0) { p.play('Walk', { speed: 2.0 / gaitV.Walk }); b && b.play('Walk_Loop', { speed: manRate(2.0) }); } }
        else {
          D.s += D.dir * dt * 2.0;
          if (D.s >= D.len || D.s <= 0) { D.s = Math.max(0, Math.min(D.len, D.s)); D.dir *= -1; D.wait = 6 + rnd() * 6; p.play(D.dir < 0 ? 'Eating' : 'Idle', { speed: 0.85 }); b && b.play('Idle_Loop'); }
        }
        const u = D.s / D.len, u2 = Math.max(0, Math.min(1, u + D.dir * 0.02));
        D.curve.getPointAt(Math.min(1, u), D.pt); D.curve.getPointAt(u2, D.pt2);
        const want = D.wait > 0 ? p.yaw : Math.atan2(D.pt2.x - D.pt.x, D.pt2.z - D.pt.z);
        p.yaw += wrap(want - p.yaw) * Math.min(1, dt * 2.5);
        p.x = D.pt.x; p.z = D.pt.z; p.y = height(p.x, p.z) + p.lift;
        if (b) { const sx = Math.cos(p.yaw) * 1.7, sz = -Math.sin(p.yaw) * 1.7, [fx, fz] = fwd(p.yaw, 1.6); b.x = p.x - sx + fx; b.z = p.z - sz + fz; b.y = height(b.x, b.z); b.yaw = p.yaw; }
      }
      if (carrier) {
        const C2 = carrier, q = C2.q;
        if (C2.wait > 0) { C2.wait -= dt; if (C2.wait <= 0) q.play('Walk_Loop', { speed: manRate(2.1) }); }
        else {
          const len = Math.hypot(C2.b.x - C2.a.x, C2.b.z - C2.a.z) || 1; C2.f += C2.dir * dt * 2.1 / len;
          if (C2.f >= 1 || C2.f <= 0) { C2.f = Math.max(0, Math.min(1, C2.f)); C2.dir *= -1; C2.wait = 2.2; C2.load = C2.dir > 0; q.play('Interact'); }
        }
        q.x = C2.a.x + (C2.b.x - C2.a.x) * C2.f; q.z = C2.a.z + (C2.b.z - C2.a.z) * C2.f; q.y = height(q.x, q.z);
        const want = Math.atan2((C2.b.x - C2.a.x) * C2.dir, (C2.b.z - C2.a.z) * C2.dir); q.yaw += wrap(want - q.yaw) * Math.min(1, dt * 5);
        bundle.visible = C2.load && C2.wait <= 0;
        if (bundle.visible) { const sx = Math.cos(q.yaw) * 0.45, sz = -Math.sin(q.yaw) * 0.45; bundle.position.set(q.x + sx, q.y + 3.05, q.z + sz); bundle.rotation.set(0, q.yaw + Math.PI / 2, 0.1); }
      }
    }
    for (const k of kinds) k.update(t, camera, { lodDist: 1e9, maxDist: 460, lod2Dist: k.people ? 150 : 1e9 });      // (far people: the crowd's 100-triangle figures)
    if (blobs) {
      let n = 0;
      for (const [p, l, w] of blobList) {
        if (p.y < -500 || n >= 64) continue;
        const dx = p.x - camP.x, dz = p.z - camP.z; if (dx * dx + dz * dz > 330 * 330) continue;
        _bq.setFromAxisAngle(_up, p.yaw); _bp.set(p.x, p.y - (p.lift || 0) + 0.07, p.z); _bs.set(w, 1, l);
        blobs.setMatrixAt(n++, _bm.compose(_bp, _bq, _bs));
      }
      blobs.count = n; blobs.visible = n > 0; blobs.instanceMatrix.needsUpdate = true;
    }
  }

  // ---- cows: their own kind (arrives with its model)
  function addCows(cow) {
    if (!cow || addCows.done) return; addCows.done = true;
    const src = SkeletonUtils.clone(cow.scene); mergeSkinned(src); smoothSkinned(src);
    const CCL = ['Idle', 'Idle_2', 'Idle_Headlow', 'Eating', 'Walk'].filter((n) => cow.animations.some((a) => a.name === n));
    const ck = createKind({ gltf: { scene: src, animations: cow.animations }, anims: cow, clips: CCL, capacity: 10, fps: 20 });
    src.userData.pasClips = cow.animations; const CM = measure(src, [], [['Walk', 0.6]]);
    cowPatch(ck); crowdShadows(ck, shadows); group.add(ck.group); kinds.push(ck);
    const K = COW_LEN / Math.max(CM.size.x, CM.size.z), Y = -CM.minY * K; cowV = CM.v.Walk ? THREE.MathUtils.clamp(CM.v.Walk * K, 0.8, 4) : 1.6;
    [[0, 1.0], [1, 1.04], [2, 0.97], [4, 0.95], [3, 1.02], [1, 0.6]].forEach(([coat, s], i) => {
      const p = ck.add({ x: 0, y: -999, z: 0, yaw: 0, scale: scaleK(K * s, coat) }); p.cr = 3.5; p.s = s; p.lift = Y * s; blobList.push([p, 5.0 * s, 2.4 * s]);
      const a = addAnimal(p, 'cow'); a.rad = 2.0 * s;
      const xz = i === 5 && animals.length > 1 ? [animals[animals.length - 2].p.x + 3, animals[animals.length - 2].p.z + 2] : spot(a, 'cow') || [PA.x - 6, PA.z + 6];
      p.x = xz[0]; p.z = xz[1]; p.yaw = rnd() * 6.28; setGround(a); a.state = rnd() < 0.75 ? 'graze' : 'stand'; playA(a, a.state === 'graze' ? 'Eating' : 'Idle');
      creatures && creatures.push({ id: 'cow', r: 2.4, vis: () => group.visible && p.y > -500, center: () => _v.set(p.x, p.y + 1.6, p.z) });
    });
  }
  if (typeof window !== 'undefined') window.__pas = { animals, yard, kinds, HM, HK, noseI, noseE, gaitV, get cowV() { return cowV; }, hide(k) { for (const q of kinds) q.group.visible = !k; if (blobs) blobs.visible = !k; bundle.visible = false; if (lunge) lunge.rope.visible = !k; }, get far() { return far; } };
  return { update, addCows };
}
