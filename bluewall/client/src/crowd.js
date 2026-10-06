// GPU-instanced crowd of rigged characters (Quaternius UAL rig) with BAKED animation.
//
// Why: a regular SkinnedMesh costs one draw call per material per character plus a CPU skeleton update every frame
// (60 archers on the walls would be ~180 draw calls and a few ms of JS on a phone). Here every clip is sampled once into a float
// texture (final skin matrices per bone per frame); the vertex shader skins each instance from that texture, cross-fading between
// two clips. A whole crowd of one character costs 2-5 draw calls and no per-frame animation work on the CPU.
//
//   const kind = createKind({ gltf, anims, clips: ['Walk_Loop','Idle_Loop'], props: [{ gltf: bow, bone: 'hand_l', s, pos, rot }], lod1Skip: /Boots|Belt/ });
//   scene.add(kind.group);
//   const p = kind.add({ x, y, z, yaw, scale }); p.play('Walk_Loop');   // p.x/p.y/p.z/p.yaw/p.scale are plain fields: just move them
//   each frame: kind.update(t, camera);
//
// Instances are frustum-culled and split into two levels of detail on the CPU (LOD1 drops the small accessories), so only what is
// on screen is drawn.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mergeSkinned } from './creature.js';
import { gearOf, METAL } from './unitlook.js';
import { crestTexture } from './gear_shield.js';

const FPS = 30, BLEND = 0.25;
function toFloat(src) {   // plain float copy of a geometry (see below)
  const g = new THREE.BufferGeometry();
  for (const [name, a] of Object.entries(src.attributes)) { const k = a.itemSize, out = new Float32Array(a.count * k); for (let i = 0; i < a.count; i++) for (let c = 0; c < k; c++) out[i * k + c] = a.getComponent(i, c); g.setAttribute(name, new THREE.BufferAttribute(out, k)); }
  if (src.index) g.setIndex(new THREE.BufferAttribute(new Uint32Array(src.index.array), 1));
  return g;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _sph = new THREE.Sphere();

// ------------------------------------------------------------------ shader patch
const HEAD = `
attribute vec4 skinIndex; attribute vec4 skinWeight; attribute vec4 iCur; attribute vec4 iPrv; attribute float iSw;
uniform highp sampler2D uBones; uniform float uTime; uniform float uBase;
mat4 bwM(float slot, float frame) { int x = int(slot) * 4, y = int(frame); return mat4(texelFetch(uBones, ivec2(x, y), 0), texelFetch(uBones, ivec2(x + 1, y), 0), texelFetch(uBones, ivec2(x + 2, y), 0), texelFetch(uBones, ivec2(x + 3, y), 0)); }
mat4 bwPose(vec4 c, float slot) {
  float fr = mod((uTime - c.z) * c.w, c.y), f0 = floor(fr), f1 = f0 + 1.0; if (f1 >= c.y) f1 = 0.0;
  return bwM(slot, c.x + f0) * (1.0 - (fr - f0)) + bwM(slot, c.x + f1) * (fr - f0);
}
`;
const SKIN = `
float bwBk = clamp(1.0 - (uTime - iSw) / ${BLEND.toFixed(2)}, 0.0, 1.0);
mat4 bwS = mat4(0.0);
for (int i = 0; i < 4; i++) {
  float w = skinWeight[i]; if (w <= 0.0) continue;
  float slot = uBase + skinIndex[i];
  mat4 m = bwPose(iCur, slot); if (bwBk > 0.0) m = m * (1.0 - bwBk) + bwPose(iPrv, slot) * bwBk;
  bwS += m * w;
}
`;
// green cloth -> kingdom blue (only where green dominates, so skin, leather and steel keep their colours)
const HUE = `vec3 bwHue(vec3 c) { if (c.g <= c.r * 1.05 || c.g <= c.b) return c; return clamp(vec3(c.r * 0.5, c.g * 0.55 + c.b * 0.2, c.g * 1.25 + 0.035), 0.0, 1.0); }`;
// ... with the tier colour of the soldier's level mixed in (uCloth / uClothK: unitlook.js — linen recruits, steel, navy, royal, ice, crystal)
const HUE_T = `uniform vec3 uCloth; uniform float uClothK;
vec3 bwHue(vec3 c) { if (c.g <= c.r * 1.05 || c.g <= c.b) return c; vec3 b = vec3(c.r * 0.5, c.g * 0.55 + c.b * 0.2, c.g * 1.25 + 0.035); float l = dot(b, vec3(0.3, 0.59, 0.11)); return clamp(mix(b, uCloth * (0.35 + l * 2.1), uClothK), 0.0, 1.0); }`;
// green cloth -> crimson (the enemy's colours in battles)
const HUE_RED = `vec3 bwHue(vec3 c) { if (c.g <= c.r * 1.05 || c.g <= c.b) return c; return clamp(vec3(c.g * 1.2 + 0.06, c.g * 0.26, c.g * 0.24), 0.0, 1.0); }`;
// red / orange cloth and skin -> kingdom blue (the "frost" recolour of the imp and the skeleton mage; bone and metal have no red cast and stay)
const HUE_SWAP = `vec3 bwHue(vec3 c) { if (c.r <= c.g * 1.22 || c.r <= c.b * 1.22) return c; return clamp(vec3(c.b * 0.9 + c.g * 0.25, c.g * 0.85 + c.r * 0.12, c.r * 1.12 + 0.03), 0.0, 1.0); }`;
// Extra shader code for one source material (gear_plume.js: the knights' horsehair plume, gear_pegasus.js: the pegasus coat / feathers):
//   bwExtra.set(material, { key, uniforms, vHead, vMain, fHead, frag: [[chunk, code after it], …] })
// vMain runs in the vertex shader before skinning, on `bwP` (the bind-pose position, editable) — crowd.js clones the material, so the
// hook is looked up on the original.
export const bwExtra = new WeakMap();
function patch(mat, base, uniforms, hue, extra = null) {
  if (hue === true && uniforms.cloth) hue = 'tier';
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uBones = uniforms.bones; sh.uniforms.uTime = uniforms.time; sh.uniforms.uBase = { value: base };
    if (hue === 'tier') { sh.uniforms.uCloth = uniforms.cloth; sh.uniforms.uClothK = uniforms.clothK; }
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + HEAD + (extra && extra.vHead ? extra.vHead : ''))
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n' + SKIN + 'objectNormal = normalize((bwS * vec4(objectNormal, 0.0)).xyz);')
      .replace('#include <begin_vertex>', 'vec3 bwP = position;\n' + (extra && extra.vMain ? extra.vMain : '') + '\nvec3 transformed = (bwS * vec4(bwP, 1.0)).xyz;');
    if (hue) sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + (hue === 'red' ? HUE_RED : hue === 'swap' ? HUE_SWAP : hue === 'tier' ? HUE_T : HUE)).replace('#include <map_fragment>', '#include <map_fragment>\n#ifdef USE_MAP\ndiffuseColor.rgb = bwHue(diffuseColor.rgb);\n#endif');
    if (extra) {
      Object.assign(sh.uniforms, extra.uniforms || {});
      if (extra.fHead) sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + extra.fHead);
      for (const [ch, code] of extra.frag || []) sh.fragmentShader = sh.fragmentShader.replace(`#include <${ch}>`, `#include <${ch}>\n${code}`);
    }
  };
  const k = (hue === 'red' ? 'bwcrowd-red' : hue === 'swap' ? 'bwcrowd-swap' : hue === 'tier' ? 'bwcrowd-tier' : hue ? 'bwcrowd-hue' : 'bwcrowd') + (extra ? '-' + extra.key : '');
  mat.customProgramCacheKey = () => k;
  return mat;
}

// ------------------------------------------------------------------ gear (flat-coloured props: helmets, blades, spear heads, shields)
// One vertex-coloured material for every flat prop of a kind. Per vertex `aGear` = (metalness, roughness, class, crest mask):
// class 1 = steel, 2 = trim -> the tier metal of unitlook.js (colour x shade, roughness from the uniform; a faint crystal glow on the
// trims of the top tier); the shield faces (crest mask 1) sample the realm's painted crest texture (gear_shield.js).
// A subtle per-soldier variation (from the world position: stable while the crowd is re-sorted) keeps a block from looking cloned.
function gearExtra(G) {
  return {
    key: 'gear', uniforms: { uSteel: G.steel, uTrim: G.trim, uGlow: G.glow, uCrest: G.crest },
    vHead: 'attribute vec4 aGear; varying vec4 vGear; varying vec2 vGUv; varying float vGVar;',
    vMain: 'vGear = aGear; vGUv = uv; vGVar = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);',
    fHead: 'uniform vec4 uSteel; uniform vec4 uTrim; uniform float uGlow; uniform sampler2D uCrest; varying vec4 vGear; varying vec2 vGUv; varying float vGVar;',
    frag: [
      ['color_fragment', `float bwC = vGear.z;
diffuseColor.rgb *= (bwC > 1.5 ? uTrim.rgb : bwC > 0.5 ? uSteel.rgb : vec3(1.0)) * (0.95 + 0.1 * vGVar);
diffuseColor.rgb *= mix(vec3(1.0), texture2D(uCrest, vGUv).rgb, vGear.w);`],
      ['roughnessmap_fragment', 'roughnessFactor = clamp((bwC > 1.5 ? uTrim.a : bwC > 0.5 ? uSteel.a : vGear.y) + (vGVar - 0.5) * 0.08, 0.05, 1.0);'],
      ['metalnessmap_fragment', 'metalnessFactor = vGear.x;'],
      ['emissivemap_fragment', 'if (bwC > 1.5) totalEmissiveRadiance += uTrim.rgb * uGlow * 0.4;'],
    ],
  };
}
const _gc = new THREE.Color();
// a flat prop part without its own gear data: from its material name (unitlook.js gearOf) -> colour + aGear
function gearize(geo, mat) {
  const n = geo.attributes.position.count, src = geo.attributes.color, gi = gearOf(mat.name), col = new Float32Array(n * 3), gear = new Float32Array(n * 4);
  if (gi.cls) _gc.setScalar(gi.shade); else if (gi.color != null) _gc.set(gi.color); else _gc.copy(mat.color || _gc.setScalar(1));
  for (let i = 0; i < n; i++) {
    col[i * 3] = _gc.r * (src ? src.getX(i) : 1); col[i * 3 + 1] = _gc.g * (src ? src.getY(i) : 1); col[i * 3 + 2] = _gc.b * (src ? src.getZ(i) : 1);
    gear[i * 4] = gi.cls ? 0.85 : gi.metal ?? 0; gear[i * 4 + 1] = gi.cls ? 0.45 : gi.rough ?? 0.7; gear[i * 4 + 2] = gi.cls || 0; gear[i * 4 + 3] = 0;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aGear', new THREE.BufferAttribute(gear, 4));
}

// ------------------------------------------------------------------ kind
export function createKind(cfg) {
  const fps = cfg.fps || FPS;
  // ---- skeleton rigs: LOD0 = whole character, LOD1 = without the small accessories (boots, belts, bracers …)
  const mkRig = (skip) => {
    const src = cfg.gltf.scene; mergeSkinned(src);
    const root = SkeletonUtils.clone(src);
    if (skip) { const drop = []; root.traverse((o) => { if (o.isMesh && skip.test(o.name || '')) drop.push(o); }); for (const o of drop) o.parent && o.parent.remove(o); }
    root.updateMatrixWorld(true);
    const meshes = []; root.traverse((o) => { if (o.isSkinnedMesh && o.geometry.attributes.position) meshes.push(o); });
    return { root, meshes };
  };
  const rigs = [mkRig(null)];
  if (cfg.lod1Skip) { const r1 = mkRig(cfg.lod1Skip); if (r1.meshes.length) rigs.push(r1); }

  // ---- clips (same filter the regular units use: only tracks whose bone exists)
  const all = {}; for (const c of cfg.anims.animations || []) all[c.name] = c;
  const clipNames = (cfg.clips || Object.keys(all)).filter((n) => all[n]);
  const info = {}; let frames = 0;
  for (const n of clipNames) { const c = all[n], count = Math.max(2, Math.round(c.duration * fps)); info[n] = { base: frames, count, dur: c.duration }; frames += count; }

  // ---- slots: one 4-texel matrix per (mesh, bone) and per prop
  let slots = 0;
  const parts = [];                                   // { rig, mesh, base }
  rigs.forEach((rg, ri) => rg.meshes.forEach((m) => { parts.push({ ri, mesh: m, base: slots }); slots += m.skeleton.bones.length; }));
  const props = (cfg.props || []).map((pr) => { const o = { ...pr, slot: slots }; slots += 1; return o; });
  const W = slots * 4, data = new Float32Array(W * frames * 4);
  const tex = new THREE.DataTexture(data, W, frames, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const uniforms = { bones: { value: tex }, time: { value: 0 } };
  if (cfg.cloth) { uniforms.cloth = { value: new THREE.Color().fromArray(cfg.cloth.c) }; uniforms.clothK = { value: cfg.cloth.k }; }
  // the metal of the gear (unitlook.js tintGear changes it later: no rebuild) + whose crest the shields carry ('own' | 'foe')
  const gear = { steel: { value: new THREE.Vector4() }, trim: { value: new THREE.Vector4() }, glow: { value: 0 }, crest: { value: crestTexture(cfg.crest || 'own') } };
  { const T = METAL[Math.max(0, Math.min(5, cfg.tier ?? 1))]; _gc.set(T.steel[0]); gear.steel.value.set(_gc.r, _gc.g, _gc.b, T.steel[1]); _gc.set(T.trim[0]); gear.trim.value.set(_gc.r, _gc.g, _gc.b, T.trim[1]); gear.glow.value = T.glow; }

  // ---- bake: pose every rig on every frame of every clip, write final skin matrices
  const propBone = props.map((p) => rigs[0].root.getObjectByName(p.bone));
  const stats = {};
  for (const ri of rigs.keys()) {
    const rg = rigs[ri], mixer = new THREE.AnimationMixer(rg.root);
    for (const n of clipNames) {
      const c = all[n], clip = new THREE.AnimationClip(n, c.duration, c.tracks.filter((tr) => rg.root.getObjectByName(tr.name.split('.')[0])));
      const act = mixer.clipAction(clip); act.play();
      const { base, count } = info[n];
      for (let f = 0; f < count; f++) {
        mixer.setTime((f / count) * c.duration);        // frames are spread over the whole loop (count/duration may differ slightly from fps)
        rg.root.updateMatrixWorld(true);
        for (const pt of parts) {
          if (pt.ri !== ri) continue;
          const bn = pt.mesh.skeleton.bones, inv = pt.mesh.skeleton.boneInverses;
          for (let b = 0; b < bn.length; b++) {
            _m.multiplyMatrices(bn[b].matrixWorld, inv[b]).multiply(pt.mesh.bindMatrix);
            _m.toArray(data, ((base + f) * W + (pt.base + b) * 4) * 4);
          }
        }
        if (ri === 0) props.forEach((p, k) => { if (propBone[k]) propBone[k].matrixWorld.toArray(data, ((base + f) * W + p.slot * 4) * 4); });
      }
      act.stop(); mixer.uncacheClip(clip);
      if (ri === 0 && /walk/i.test(n)) {                // walking speed the clip was made for: how far the stance foot travels per stride
        const ft = rg.root.getObjectByName('foot_l') || rg.root.getObjectByName('foot_r');
        if (ft) { let lo = 1e9, hi = -1e9; const pl = new THREE.Vector3(); const rt = rg.root; mixer.clipAction(clip).play();
          for (let f = 0; f < count; f++) { mixer.setTime((f / count) * c.duration); rt.updateMatrixWorld(true); ft.getWorldPosition(pl); lo = Math.min(lo, pl.z); hi = Math.max(hi, pl.z); }
          mixer.stopAllAction(); stats.walkSpeed = (hi - lo) / (0.6 * c.duration); }
      }
    }
    mixer.stopAllAction();
  }
  tex.needsUpdate = true;

  // ---- instanced meshes
  const group = new THREE.Group(); group.name = 'crowd';
  const lods = rigs.map(() => ({ meshes: [], list: [] }));
  const CAP = cfg.capacity || 64;
  const mkInst = (geo, material, base, shadow, hue, body = false, extra = null) => {
    const ig = new THREE.InstancedBufferGeometry(); ig.copy(geo); ig.instanceCount = Infinity;
    const attr = (n, k) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(CAP * k), k); a.setUsage(THREE.DynamicDrawUsage); ig.setAttribute(n, a); return a; };
    extra = extra || bwExtra.get(material) || null;
    if (material.isMeshBasicMaterial) material = new THREE.MeshStandardMaterial({ map: material.map, color: material.color, name: material.name, side: material.side, transparent: material.transparent, alphaTest: material.alphaTest, roughness: 0.82, metalness: 0 });   // unlit (KHR_materials_unlit) -> lit
    const mc = material.clone();
    if (cfg.glint && body && mc.emissive) { mc.emissive.set(cfg.glint[0]); mc.emissiveIntensity = cfg.glint[1]; }      // (higher tiers: a faint gold / ice / crystal sheen on the body)
    const im = new THREE.InstancedMesh(ig, patch(mc, base, uniforms, hue, extra), CAP);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    im.frustumCulled = false; im.castShadow = !!shadow; im.receiveShadow = true; im.count = 0; im.visible = false;
    im.userData.a = { cur: attr('iCur', 4), prv: attr('iPrv', 4), sw: attr('iSw', 1) };
    group.add(im); return im;
  };
  parts.forEach((pt) => {
    const g = pt.mesh.geometry;
    if (!g.attributes.skinIndex || !g.attributes.skinWeight) return;
    const n = g.attributes.position.count, geo = new THREE.BufferGeometry();
    // plain float copies of everything (meshopt-quantized files store normalized ints; the shader only needs what three would have fed it)
    const fl = (a) => { const k = a.itemSize, out = new Float32Array(a.count * k); for (let i = 0; i < a.count; i++) for (let c = 0; c < k; c++) out[i * k + c] = a.getComponent(i, c); return new THREE.BufferAttribute(out, k); };
    for (const k of Object.keys(g.attributes)) if (['position', 'normal', 'uv', 'color', 'skinIndex', 'skinWeight'].includes(k) || /^a[A-Z]/.test(k)) geo.setAttribute(k, fl(g.attributes[k]));   // (+ custom ones: aPeg …)
    if (g.index) geo.setIndex(g.index);
    if (!geo.attributes.normal) geo.computeVertexNormals();                         // unlit models carry no normals: smooth ones from the bind pose
    const mat = Array.isArray(pt.mesh.material) ? pt.mesh.material[0] : pt.mesh.material;
    lods[pt.ri].meshes.push(mkInst(geo, mat, pt.base, false, cfg.hue && mat.map ? cfg.hue : false, true));
  });
  // props (a bow, a spear, a shield …): rigid meshes that follow one bone, baked as an extra "bone" slot (world matrix, no inverse bind).
  // Every prop vertex carries its own slot in `skinIndex`, so all props of one material (all flat-coloured ones share a vertex-coloured material)
  // are merged into ONE instanced mesh per LOD level: a soldier with helmet, spear and shield costs 1 prop draw call instead of 9.
  {
    const groups = new Map();
    props.forEach((pr) => {
      if (!pr.gltf) return;
      const o = pr.gltf.scene; o.updateMatrixWorld(true);
      const P = new THREE.Matrix4().compose(new THREE.Vector3(...(pr.pos || [0, 0, 0])), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(pr.rot || [0, 0, 0]))), new THREE.Vector3().setScalar(pr.s || 1));
      o.traverse((mm) => {
        if (!mm.isMesh) return;
        const geo = toFloat(mm.geometry); geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(P, mm.matrixWorld));
        const n = geo.attributes.position.count, mat = Array.isArray(mm.material) ? mm.material[0] : mm.material, own = !!geo.attributes.aGear, flat = own || (!mat.map && !mat.normalMap);
        const si = new Float32Array(n * 4), sw = new Float32Array(n * 4); for (let i = 0; i < n; i++) { si[i * 4] = pr.slot; sw[i * 4] = 1; }
        geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
        if (!geo.attributes.normal) geo.computeVertexNormals();
        if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
        if (!geo.index) geo.setIndex([...Array(n).keys()]);
        if (flat && !own) gearize(geo, mat);                                // (gear_shield.js shields bring their own colours + aGear)
        else if (!flat) geo.deleteAttribute('color');
        const key = flat ? 'gear' : mat.uuid;
        if (!groups.has(key)) groups.set(key, { mat: flat ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.8, name: 'bwgear' }) : mat, geos: [], flat });
        const clean = new THREE.BufferGeometry();                           // only the attributes every prop shares, so mergeGeometries cannot fail
        for (const k of ['position', 'normal', 'uv', 'color', 'skinIndex', 'skinWeight', flat ? 'aGear' : '']) if (geo.attributes[k]) clean.setAttribute(k, geo.attributes[k]);
        clean.setIndex(geo.index); groups.get(key).geos.push(clean);
      });
    });
    for (const { mat, geos, flat } of groups.values()) {
      const geo = geos.length > 1 ? mergeGeometries(geos, false) : geos[0];
      if (geo) lods.forEach((lv) => lv.meshes.push(mkInst(geo, mat, 0, false, false, false, flat ? gearExtra(gear) : null)));      // drawn with LOD0 or LOD1 bodies depending on the instance
    }
  }

  // ---- LOD2: far soldiers become a ~100-triangle figure (capsule body + head), no animation; only for kinds that ask for it (cfg.lod2 = { cloth: 0x..., h: 1.8 })
  let lod2 = null; const list2 = [];
  if (cfg.lod2) {
    const c = cfg.lod2, H = c.h || 1.8, parts2 = [], col = (hex) => new THREE.Color(hex);
    const body = new THREE.CapsuleGeometry(0.3, H * 0.5, 2, 6).toNonIndexed(); body.translate(0, H * 0.5, 0);
    const head = new THREE.SphereGeometry(0.2, 6, 4).toNonIndexed(); head.translate(0, H * 0.93, 0);
    for (const [g, fn] of [[body, (y) => (y < H * 0.3 ? col(c.legs || 0x1c2433) : col(c.cloth))], [head, () => col(c.skin || 0xd9a77f)]]) {
      const n = g.attributes.position.count, cl = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const k = fn(g.attributes.position.getY(i)); cl[i * 3] = k.r; cl[i * 3 + 1] = k.g; cl[i * 3 + 2] = k.b; }
      g.setAttribute('color', new THREE.BufferAttribute(cl, 3)); g.deleteAttribute('uv'); parts2.push(g);
    }
    const geo = mergeGeometries(parts2, false);
    lod2 = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.15 }), CAP);
    lod2.instanceMatrix.setUsage(THREE.DynamicDrawUsage); lod2.frustumCulled = false; lod2.count = 0; lod2.visible = false; lod2.receiveShadow = true; group.add(lod2);
  }

  // ---- instances
  const all_ = [];
  const T0 = { base: 0, count: 2, start: 0, rate: 1 };
  function add({ x = 0, y = 0, z = 0, yaw = 0, scale = 1, clip = null, speed = 1, phase = 0 } = {}) {
    const p = { x, y, z, yaw, scale, r: 3 * scale, cur: T0, prv: T0, sw: -1e9, now: 0 };
    p.play = (name, { fade = true, speed: sp = 1, offset = 0 } = {}) => {
      const c = info[name]; if (!c) return false;
      const t = uniforms.time.value;
      p.prv = fade ? p.cur : null; p.cur = { base: c.base, count: c.count, start: t - offset, rate: (c.count / c.dur) * sp, k: c.count / c.dur };
      if (!p.prv) { p.prv = p.cur; p.sw = -1e9; } else p.sw = t;
      p.name = name; return true;
    };
    // change the playback speed of the running clip without a jump in its phase (a walk that follows the ground speed frame by frame)
    p.setSpeed = (sp) => { const cu = p.cur, nr = cu.k * sp; if (!cu.k || Math.abs(nr - cu.rate) < 1e-3) return; const t = uniforms.time.value; cu.start = t - ((t - cu.start) * cu.rate) / nr; cu.rate = nr; };
    if (clip) p.play(clip, { fade: false, speed, offset: phase });
    all_.push(p); return p;
  }

  function remove(p) { const i = all_.indexOf(p); if (i >= 0) all_.splice(i, 1); }

  // ---- per frame: cull, pick the LOD, write the instance buffers
  let acc = 0;
  function update(t, camera, { lodDist = 90, maxDist = 700, lod2Dist = 1e9 } = {}) {
    uniforms.time.value = t;
    _pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm);
    for (const lv of lods) lv.list.length = 0; list2.length = 0;
    const cp = camera.position;
    for (const p of all_) {
      _sph.center.set(p.x, p.y + p.scale * 0.95, p.z); _sph.radius = p.cr || p.scale * 1.5;
      const d = _sph.center.distanceTo(cp);
      if (d > maxDist || !_fr.intersectsSphere(_sph)) continue;
      if (lod2 && d > lod2Dist) { list2.push(p); continue; }
      lods[d > lodDist && lods.length > 1 ? 1 : 0].list.push(p);
    }
    for (const lv of lods) {
      const list = lv.list;
      for (const im of lv.meshes) {
        const n = Math.min(list.length, CAP); im.count = n; im.visible = n > 0; if (!n) continue;
        const { cur, prv, sw } = im.userData.a, ma = im.instanceMatrix.array;
        for (let i = 0; i < n; i++) {
          const p = list[i];
          _q.setFromAxisAngle(_up, p.yaw); _p.set(p.x, p.y, p.z); _s.setScalar(p.scale);
          if (p.pitch || p.roll) _q.multiply(_q2.setFromEuler(_e.set(p.pitch || 0, 0, p.roll || 0)));      // falling over (battle deaths)
          _m.compose(_p, _q, _s).toArray(ma, i * 16);
          const c = p.cur, v = p.prv, j = i * 4;
          cur.array[j] = c.base; cur.array[j + 1] = c.count; cur.array[j + 2] = c.start; cur.array[j + 3] = c.rate;
          prv.array[j] = v.base; prv.array[j + 1] = v.count; prv.array[j + 2] = v.start; prv.array[j + 3] = v.rate;
          sw.array[i] = p.sw;
        }
        im.instanceMatrix.needsUpdate = true; cur.needsUpdate = true; prv.needsUpdate = true; sw.needsUpdate = true;
      }
    }
    if (lod2) {
      const n = Math.min(list2.length, CAP); lod2.count = n; lod2.visible = n > 0;
      if (n) { const ma = lod2.instanceMatrix.array; for (let i = 0; i < n; i++) { const p = list2[i]; _q.setFromAxisAngle(_up, p.yaw); if (p.l2pitch) _q.multiply(_q2.setFromEuler(_e.set(p.l2pitch, 0, 0))); _p.set(p.x, p.y + (p.l2pitch ? 0.3 * p.scale : 0), p.z); _s.setScalar(p.scale); _m.compose(_p, _q, _s).toArray(ma, i * 16); } lod2.instanceMatrix.needsUpdate = true; }
    }
  }
  // the tier colour of the cloth can change later (home army camp: the barracks levelled up) — no rebuild, two uniforms
  const setCloth = (c, k) => { if (uniforms.cloth) { uniforms.cloth.value.fromArray(c); uniforms.clothK.value = k; } };
  return { group, add, remove, update, info, stats, setCloth, gear, instances: all_, texture: tex, get drawn() { return lods.map((l) => l.list.length).concat(lod2 ? [list2.length] : []); } };
}
