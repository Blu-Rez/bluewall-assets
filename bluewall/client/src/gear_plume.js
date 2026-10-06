// The knights' horsehair plume and crest-painted shield (the UAL "K3" knight, knight_k3.glb: home riders in life.js, battle cavalry in bunits.js).
//   dressKnight(gltf)   once per loaded model, before it is cloned: (idempotent)
//     · the flat feather card on the helm is replaced by ~34 thin locks of horsehair (alpha-cut strand cards) rising from the crest of
//       the helm and falling back over the neck, rigid on the Head bone + a sway in the vertex shader (no CPU work, no extra draw call:
//       the locks are part of the knight's own "Kit" mesh and draw with it)
//     · the knight's shield shows the realm's crest (the same one the walls fly; repainted when it changes)
//   setPlumeTier(tier)  the colours of the hair (unitlook.js HAIR: navy, royal blue, white, ice … per level tier of the stable)
// Works for both renderers: three's SkinnedMesh (life.js) and the baked crowds (crowd.js bwExtra hook).
import * as THREE from 'three';
import { bwExtra } from './crowd.js';
import { drawCrest } from './emblems.js';
import { onShieldCrest, shieldCrestId } from './gear_shield.js';
import { HAIR } from './unitlook.js';
import { helmGeo, greatHelmGeo, crestGeo } from './gear_helm.js';
import { armorGeo } from './gear_armor.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { swordClips, axeClips } from './gear_sword.js';

export const PLUME = { root: { value: new THREE.Color() }, tip: { value: new THREE.Color() }, time: { value: 0 } };
export function setPlumeTier(t = 3) {
  const h = HAIR[Math.max(0, Math.min(5, t | 0))];
  PLUME.root.value.set(h[0]); PLUME.tip.value.set(h[1]);
}
setPlumeTier(3);

// the atlas of the Kit texture: shield u 0..0.5 v 0..0.625, plume u 0..0.5 v 0.625..1 (glTF uv: v down)
const V0 = 0.625;
const HAS_DOM = typeof document !== 'undefined';
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ------------------------------------------------------------------ texture: 4 hair locks side by side in the plume region
function paintLocks(g, X, Y, W, H) {
  // 4 hair textures side by side (u): a SOLID body (the crest is a thick mass of hair, not a few threads), long streaks of light and dark
  // along it, and a frayed tip: the last fifth breaks up into separate strands (alpha-cut)
  g.clearRect(X, Y, W, H);
  const r = rng(77), LW = W / 4, body = H * 0.78;
  for (let k = 0; k < 4; k++) {
    const x0 = X + k * LW;
    const gr = g.createLinearGradient(x0, 0, x0 + LW, 0); gr.addColorStop(0, '#6e6e6e'); gr.addColorStop(0.5, '#a8a8a8'); gr.addColorStop(1, '#6a6a6a');
    g.fillStyle = gr; g.fillRect(x0, Y, LW, body + 2);
    // streaks: thin wavy strokes the whole length of the lock (darker and lighter than the body)
    for (let i = 0; i < 150; i++) {
      const x = x0 + r() * LW, len = H * (0.5 + r() * 0.5), wv = 1 + r() * 2.2, ph = r() * 6, l = 70 + r() * 175 | 0;
      g.strokeStyle = `rgba(${l},${l},${l},${0.55 + r() * 0.4})`; g.lineWidth = 0.9 + r() * 1.9; g.beginPath();
      for (let y = 0; y <= len; y += 6) { const xx = Math.min(x0 + LW - 1, Math.max(x0 + 1, x + Math.sin(y * 0.05 + ph) * wv)); if (y === 0) g.moveTo(xx, Y + y); else g.lineTo(xx, Y + y); }
      g.stroke();
    }
    // the fray: gaps cut into the last fifth, growing toward the tip, so the end splits into locks
    g.save(); g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 26; i++) {
      const x = x0 + r() * LW, w = 1.2 + r() * 3.2, y0 = Y + body * (0.9 + r() * 0.12);
      g.fillStyle = 'rgba(0,0,0,1)'; g.beginPath(); g.moveTo(x - w * 0.15, y0); g.lineTo(x + w * 0.15, y0); g.lineTo(x + w, Y + H + 2); g.lineTo(x - w, Y + H + 2); g.closePath(); g.fill();
    }
    g.restore();
    // dark core near the root, a soft highlight band, darker edges: the lock reads as round
    const sh = g.createLinearGradient(x0, 0, x0 + LW, 0); sh.addColorStop(0, 'rgba(0,0,0,0.3)'); sh.addColorStop(0.42, 'rgba(255,255,255,0.1)'); sh.addColorStop(0.6, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.32)');
    g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = sh; g.fillRect(x0, Y, LW, H); g.restore();
  }
}
function paintShield(g, id) {
  // over the old castle: the navy enamel again, then the realm's crest in the middle (an escutcheon on the knight's shield)
  g.save();
  const P = new Path2D('M40 46 H472 V300 C472 450 380 560 256 612 C132 560 40 450 40 300 Z');
  const gr = g.createLinearGradient(0, 40, 0, 600); gr.addColorStop(0, '#1d3270'); gr.addColorStop(1, '#13214e');
  g.fillStyle = gr; g.fill(P);
  const r = rng(5); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${(r() * 0.05).toFixed(3)})`; g.fillRect(40 + r() * 432, 46 + r() * 560, 2, 2); }
  drawCrest(g, id, 256, 300, 372);
  g.restore();
}
export const KIT = { tex: null, canvas: null, g: null, src: null, id: null };     // (exported for the dev pages)
function kitTexture(orig) {
  if (!HAS_DOM || !orig || !orig.image) return orig;
  const img = orig.image, W = img.width || 1024, H = img.height || 1024, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, W, H);
  g.save(); g.scale(W / 1024, H / 1024); paintLocks(g, 0, V0 * 1024, 512, 1024 * (1 - V0)); g.restore();
  const t = new THREE.CanvasTexture(c); t.flipY = false; t.colorSpace = orig.colorSpace; t.wrapS = orig.wrapS; t.wrapT = orig.wrapT; t.anisotropy = 4;
  Object.assign(KIT, { tex: t, canvas: c, g, W, H });
  const paint = (id) => { if (KIT.id === id) return; KIT.id = id; g.save(); g.scale(W / 1024, H / 1024); paintShield(g, id); g.restore(); t.needsUpdate = true; };
  paint(shieldCrestId('own'));
  onShieldCrest((id, side) => { if (side === 'own') paint(id); });
  return t;
}

// ------------------------------------------------------------------ geometry: the locks (rest pose of the model, metres, the knight faces +z)
function locks() {
  const r = rng(4242), pos = [], uv = [], hair = [], nor = [], idx = [], N = 34, SEG = 6;
  const C = new THREE.Vector3(0, 1.62, -0.02);                                    // centre of the head (for soft outward normals)
  const P = new THREE.Vector3(), T = new THREE.Vector3(), Wd = new THREE.Vector3(), Nn = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const a = i / (N - 1), lock = (i * 7) % 4;
    // the root runs along the crest ridge of the helm, front to back; the front locks stand higher and fall farther
    const rz = 0.07 - a * 0.19 + (r() - 0.5) * 0.02, rx = (r() - 0.5) * 0.05, ry = 1.80 - Math.max(0, -rz - 0.04) * 0.45;
    const up = 0.1 + (1 - a) * 0.09 + r() * 0.04, back = 0.36 + (1 - a) * 0.14 + r() * 0.08, drop = 0.5 + r() * 0.16, side = (r() - 0.5) * 0.24;
    const width = 0.05 + r() * 0.035, roll = r() * Math.PI;
    const at = (s, o) => o.set(rx + side * s * s, ry + up * Math.sin(Math.min(1, s * 1.6) * Math.PI * 0.5) * (1 - s * 0.25) - drop * Math.max(0, s - 0.35) ** 1.6, rz - back * s);
    const base = pos.length / 3;
    for (let k = 0; k <= SEG; k++) {
      const s = k / SEG; at(s, P); at(Math.min(1, s + 0.02), T); T.sub(P).normalize(); if (k === SEG) { at(s - 0.02, T); T.subVectors(P, T).normalize(); }
      // the card's width direction: around the strand's tangent by `roll` (some face the side, some the back: the plume reads from every angle)
      Wd.set(1, 0, 0).applyAxisAngle(T, roll); Wd.addScaledVector(T, -Wd.dot(T)).normalize();
      const w = width * (1 - 0.45 * s) * 0.5;
      Nn.subVectors(P, C).normalize();
      for (const e of [-1, 1]) {
        pos.push(P.x + Wd.x * w * e, P.y + Wd.y * w * e, P.z + Wd.z * w * e);
        nor.push(Nn.x, Nn.y, Nn.z);
        uv.push((lock + 0.5 + e * 0.48) * 0.125, V0 + (1 - V0) * (0.01 + s * 0.98));
        // sway: grows along the lock (none at the root); [back, down, side amplitude scale, phase]
        const k2 = s ** 1.5; hair.push(k2, k2, k2, r() * 0.6 + a * 2.2);
      }
    }
    for (let k = 0; k < SEG; k++) { const q = base + k * 2; idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
  }
  return { pos, nor, uv, hair, idx };
}

// sway in the vertex shader: the lock breathes back / down, flutters sideways; every rider has its own phase (from where it is)
const SWAY = (t, ph) => `{ float bwS1 = sin(${t} * 2.1 + aHair.w + ${ph}), bwS2 = sin(${t} * 3.3 + aHair.w * 1.7 + ${ph} * 1.3);
  bwP += uHairBack * aHair.x * (0.6 + 0.4 * bwS1) + uHairSide * aHair.z * bwS2; }`;
const FHEAD = 'uniform vec3 uHairRoot; uniform vec3 uHairTip; float bwHair = 0.0;';
const FRAG = [
  ['color_fragment', `#ifdef USE_MAP
if (vMapUv.x < 0.5 && vMapUv.y > ${V0.toFixed(3)}) { float bwT = (vMapUv.y - ${V0.toFixed(3)}) / ${(1 - V0).toFixed(3)}; bwHair = 1.0;
  diffuseColor.rgb = mix(uHairRoot, uHairTip, smoothstep(0.45, 1.0, bwT)) * (0.35 + 1.0 * diffuseColor.r); }
#endif`],
  ['roughnessmap_fragment', 'if (bwHair > 0.5) roughnessFactor = 0.72;'],
  ['metalnessmap_fragment', 'if (bwHair > 0.5) metalnessFactor = 0.0;'],
];

const DONE = new WeakSet();
// the Kit mesh of a K3 gltf (its helm, plume, shield, cape and sword are one skinned mesh with the material "Kit")
const kitMesh = (gltf) => { let mesh = null; gltf.scene.traverse((o) => { if (!mesh && o.isSkinnedMesh && o.material && o.material.name === 'Kit') mesh = o; }); return mesh; };
// the model's geometry with the new parts: variant 'knight' = great helm + plate harness + the sword; 'axe' = Roman helm + heavier plate, no sword (the axe is a separate prop)
function kitGeometry(mesh, src, variant) {
  const sk = mesh.skeleton, hi = sk.bones.findIndex((b) => b.name === 'Head');
  mesh.updateMatrixWorld(true); mesh.skeleton.bones[0] && mesh.skeleton.bones[0].updateMatrixWorld(true);
  // rest-pose transform of a vertex weighted 1 to a bone: world = meshWorld * bindInv * boneWorld * boneInv * bind * p
  const FS = {}, boneF = (name) => FS[name] || (() => {
    const bi = sk.bones.findIndex((b) => b.name === name);
    const F = new THREE.Matrix4().copy(mesh.matrixWorld).multiply(mesh.bindMatrixInverse).multiply(sk.bones[bi].matrixWorld).multiply(sk.boneInverses[bi]).multiply(mesh.bindMatrix);
    const Fi = F.clone().invert(); return (FS[name] = { bi, Fi, Fn: new THREE.Matrix3().getNormalMatrix(Fi), sc: new THREE.Vector3().setFromMatrixScale(Fi) });
  })();
  const hf = boneF('Head');
  const bonePos = (n) => { const b = sk.bones.find((q) => q.name === n); return b ? b.getWorldPosition(new THREE.Vector3()).toArray() : [0, 1, 0]; };
  const n0 = src.attributes.position.count, out = new THREE.BufferGeometry();
  const Hm = variant === 'axe' ? helmGeo() : greatHelmGeo(), Cr = crestGeo(V0), Ar = armorGeo(bonePos, variant);
  const parts = [Hm, Cr, Ar];
  const L = { pos: [], nor: [], uv: [], col: [], hair: [], idx: [], bones: [] };
  for (const pt of parts) { const o = L.pos.length / 3; for (const k of ['pos', 'nor', 'uv', 'col', 'hair', 'bones']) for (const x of pt[k]) L[k].push(x); for (const q of pt.idx) L.idx.push(q + o); }
  const n1 = L.pos.length / 3;
  const fl = (a, k) => { const arr = new Float32Array((n0 + n1) * k); for (let i = 0; i < n0; i++) for (let c = 0; c < k; c++) arr[i * k + c] = a ? a.getComponent(i, Math.min(c, a.itemSize - 1)) : 0; return arr; };
  const P = fl(src.attributes.position, 3), Nm = fl(src.attributes.normal, 3), U = fl(src.attributes.uv, 2), SI = fl(src.attributes.skinIndex, 4), SW = fl(src.attributes.skinWeight, 4), HA = new Float32Array((n0 + n1) * 4);
  const CO = src.attributes.color ? fl(src.attributes.color, 3) : null;                // (the Kit is vertex-coloured: keep it, the new parts carry their own colours)
  if (CO) for (let i = 0; i < n1 * 3; i++) CO[n0 * 3 + i] = L.col[i];
  const v = new THREE.Vector3();
  for (let i = 0; i < n1; i++) {
    const j = n0 + i, [b1, w1, b2, w2] = L.bones[i], f1 = boneF(b1), f2 = boneF(b2);
    v.fromArray(L.pos, i * 3).applyMatrix4(f1.Fi).toArray(P, j * 3);
    v.fromArray(L.nor, i * 3).applyMatrix3(f1.Fn).normalize().toArray(Nm, j * 3);
    U[j * 2] = L.uv[i * 2]; U[j * 2 + 1] = L.uv[i * 2 + 1];
    SI[j * 4] = f1.bi; SW[j * 4] = w1; if (w2 > 0) { SI[j * 4 + 1] = f2.bi; SW[j * 4 + 1] = w2; }
    for (let c = 0; c < 4; c++) HA[j * 4 + c] = L.hair[i * 4 + c];
  }
  out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(Nm, 3)); out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  if (CO) out.setAttribute('color', new THREE.BufferAttribute(CO, 3));
  out.setAttribute('skinIndex', new THREE.BufferAttribute(SI, 4)); out.setAttribute('skinWeight', new THREE.BufferAttribute(SW, 4)); out.setAttribute('aHair', new THREE.BufferAttribute(HA, 4));
  const idx = [], si = src.index ? src.index.array : null, nt = si ? si.length / 3 : n0 / 3, ua = src.attributes.uv;
  const sia = src.attributes.skinIndex, swa = src.attributes.skinWeight;
  const dom = (k) => { let bi = 0, bw = -1; for (let c = 0; c < 4; c++) { const w = swa.getComponent(k, c); if (w > bw) { bw = w; bi = c; } } return bw > 0.5 ? sia.getComponent(k, bi) : -1; };
  const inPlume = (k) => ua.getX(k) < 0.5 && ua.getY(k) > V0 - 0.003;
  const inHelm = (k) => ua.getX(k) >= 0.5 && dom(k) === hi;                                       // the model's own helm (head bone, steel square of the atlas)
  const hand = sk.bones.findIndex((b) => b.name === 'hand_r');
  const inSword = (k) => dom(k) === hand;                                                          // the sword (hand_r in the Kit mesh)
  for (let t = 0; t < nt; t++) {
    const a = si ? si[t * 3] : t * 3, b = si ? si[t * 3 + 1] : t * 3 + 1, c = si ? si[t * 3 + 2] : t * 3 + 2;
    if (inPlume(a) && inPlume(b) && inPlume(c)) continue;
    if (inHelm(a) && inHelm(b) && inHelm(c)) continue;
    if (variant === 'axe' && inSword(a) && inSword(b) && inSword(c)) continue;
    idx.push(a, b, c);
  }
  for (const q of L.idx) idx.push(n0 + q);
  out.setIndex(idx); out.computeBoundingSphere(); out.computeBoundingBox();
  return { out, sc: hf.sc };
}

// the plume shader + sway for a Kit material (both renderers); `sc` = the quantization scale of the mesh (sway in its own units)
function plumeMaterial(m, sc) {
  // sway directions in the mesh's bind frame (metres -> its quantized units): back = -z, a little down; side = x
  const back = new THREE.Vector3(0, -0.035, -0.05).multiply(sc), sideV = new THREE.Vector3(0.045, 0, 0).multiply(sc);
  m.alphaTest = 0.45;
  const U2 = { uHairRoot: PLUME.root, uHairTip: PLUME.tip, uHairBack: { value: back }, uHairSide: { value: sideV } };
  // (a) three's skinning (life.js knights)
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U2, { uPlumeT: PLUME.time });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aHair; uniform float uPlumeT; uniform vec3 uHairBack; uniform vec3 uHairSide;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n{ vec3 bwP = transformed; float bwPh = dot(modelMatrix[3].xz, vec2(0.37, 0.61)); ${SWAY('uPlumeT', 'bwPh')} transformed = bwP; }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FHEAD);
    for (const [ch, code] of FRAG) sh.fragmentShader = sh.fragmentShader.replace(`#include <${ch}>`, `#include <${ch}>\n${code}`);
  };
  m.customProgramCacheKey = () => 'bwplume';
  m.onBeforeRender = () => { PLUME.time.value = performance.now() / 1000; };
  m.needsUpdate = true;
  // (b) crowd.js (battle cavalry)
  bwExtra.set(m, { key: 'plume', uniforms: U2, vHead: 'attribute vec4 aHair; uniform vec3 uHairBack; uniform vec3 uHairSide;',
    vMain: `{ float bwPh = dot(instanceMatrix[3].xz, vec2(0.37, 0.61)); ${SWAY('uTime', 'bwPh')} }`, fHead: FHEAD, frag: FRAG });
}

export function dressKnight(gltf) {
  if (!gltf || DONE.has(gltf)) return gltf; DONE.add(gltf);
  const mesh = kitMesh(gltf); if (!mesh) return gltf;
  const sk = mesh.skeleton; if (sk.bones.findIndex((b) => b.name === 'Head') < 0) return gltf;
  gltf.scene.updateMatrixWorld(true);
  const src = mesh.geometry; Object.defineProperty(mesh.userData, 'srcGeo', { value: src, enumerable: false, configurable: true });   // (not enumerable: three's clone() JSON-copies userData)
  const { out, sc } = kitGeometry(mesh, src, 'knight');
  mesh.geometry = out;
  const m = mesh.material;
  if (m.map) m.map = kitTexture(m.map);                                // the new texture (locks + crest)
  plumeMaterial(m, sc);
  swordClips(gltf);                                                  // + the sword arm clips (RideShoulder / RideDrawn / RideStrike)
  return gltf;
}

// The AXE RIDER: its own copy of the dressed knight (the same body, cape and shield, the Roman helm and the heavier plate, no sword) with the long axe's own arm clips
// (AxeShoulder / AxeDrawn / AxeStrike).  The axe itself is a prop (gear_axe.js makeAxe({ long: true }), mounted by the caller on hand_r with AXE_RIDE).
const AXED = new WeakMap();
export function axeKnight(base) {
  if (!base) return null; if (AXED.has(base)) return AXED.get(base);
  dressKnight(base);
  const bm = kitMesh(base); if (!bm || !bm.userData.srcGeo) return null;
  const scene = SkeletonUtils.clone(base.scene), g = { ...base, scene, animations: (base.animations || []).slice() }; AXED.set(base, g);
  const mesh = kitMesh(g); if (!mesh) return null;
  scene.updateMatrixWorld(true);
  const { out, sc } = kitGeometry(mesh, bm.userData.srcGeo, 'axe');
  mesh.geometry = out; Object.defineProperty(mesh.userData, 'srcGeo', { value: bm.userData.srcGeo, enumerable: false, configurable: true });
  mesh.material = bm.material.clone(); mesh.material.name = 'Kit';
  plumeMaterial(mesh.material, sc);
  axeClips(g);
  return g;
}
