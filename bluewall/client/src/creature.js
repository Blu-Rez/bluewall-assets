// Generic animated creatures from any rigged glTF (animals, giants, dragon):
// normalised size, ground offset, clip lookup by name pattern, and simple
// herd wandering (walk to a random spot, graze, repeat).
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toFloatGeo } from './assets.js';

// animation level of detail (B14): the mixer of a far creature steps at half / quarter rate with the time it owes (same speed, fewer updates)
export function lodStep(c, dt) {
  const lv = c.root.userData.bwLod | 0;
  if (!lv) { c.mixer.update(dt + (c.owe || 0)); c.owe = 0; return; }
  c.owe = (c.owe || 0) + dt;
  if (c.owe >= (lv === 1 ? 0.032 : 0.066)) { c.mixer.update(c.owe); c.owe = 0; }
}

// untextured materials are merged into one vertex-coloured material (low-poly models use many flat colours)
const flatMat = (m) => !Array.isArray(m) && !m.map && !m.emissiveMap && !m.alphaMap && !m.transparent && !m.normalMap && (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial);
function colorize(g, m, n) {
  const c = m.color || new THREE.Color(1, 1, 1), src = g.attributes.color, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const r = src ? src.getX(i) : 1, gg = src ? src.getY(i) : 1, b = src ? src.getZ(i) : 1; arr[i * 3] = c.r * r; arr[i * 3 + 1] = c.g * gg; arr[i * 3 + 2] = c.b * b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
}
function flatMaterial(list) {
  let r = 0, mt = 0; for (const m of list) { r += m.roughness ?? 0.8; mt += m.metalness ?? 0; }
  return new THREE.MeshStandardMaterial({ vertexColors: true, roughness: r / list.length, metalness: mt / list.length, envMapIntensity: 0.5, name: 'flat', side: list[0] ? list[0].side : THREE.FrontSide });
}
const floatAttr = (at, n) => { const arr = new Float32Array(n * at.itemSize); for (let i = 0; i < n; i++) for (let c = 0; c < at.itemSize; c++) arr[i * at.itemSize + c] = at.getComponent(i, c); return new THREE.BufferAttribute(arr, at.itemSize); };

// Static (non-skinned) model -> one merged mesh per textured material + one for all flat colours
export function freezeStatic(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), groups = new Map(), drop = [], flats = {};
  root.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh) return;
    const g0 = toFloatGeo(o.geometry); const g = new THREE.BufferGeometry();
    const n = g0.attributes.position.count;
    g.setAttribute('position', g0.attributes.position);
    g.setAttribute('normal', g0.attributes.normal || new THREE.BufferAttribute(new Float32Array(n * 3).fill(0), 3));
    g.setAttribute('uv', g0.attributes.uv || new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    if (g0.index) g.setIndex(g0.index); else g.setIndex([...Array(n).keys()]);
    if (!g0.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    let key = m;
    if (flatMat(m)) { if (g0.attributes.color) g.setAttribute('color', g0.attributes.color); colorize(g, m, n); key = 'flat' + m.side; (flats[key] = flats[key] || []).push(m); }
    else if (m.vertexColors && g0.attributes.color) g.setAttribute('color', g0.attributes.color);
    if (!groups.has(key)) groups.set(key, []); groups.get(key).push(g); drop.push(o);
  });
  for (const o of drop) o.parent && o.parent.remove(o);
  for (const [key, list] of groups) {
    const flat = typeof key === 'string';
    if (!flat && list.some((g) => !!g.attributes.color) !== list.every((g) => !!g.attributes.color)) for (const g of list) g.deleteAttribute('color');
    let geo = null; try { geo = list.length > 1 ? mergeGeometries(list, false) : list[0]; } catch (e) { geo = null; }
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, flat ? flatMaterial(flats[key]) : key); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh);
  }
  return root;
}

// Skinned model clean-up, done once on the source scene (every clone inherits it):
//  - rigid parts hanging on bones become skinned parts of the same skeleton,
//  - parts sharing a textured material are merged, all flat-colour parts are merged into one vertex-coloured mesh.
export function mergeSkinned(root, animated = new Set()) {
  if (root.userData.bwMerged) return root; root.userData.bwMerged = true;
  root.updateMatrixWorld(true);
  let main = null; root.traverse((o) => { if (!main && o.isSkinnedMesh && o.bindMode !== 'detached') main = o; });
  if (!main) return root;
  const host = main.parent;
  const bones = main.skeleton.bones, near = (a, b) => a.elements.every((v, i) => Math.abs(v - b.elements[i]) < 0.01 * Math.max(1, Math.abs(v)));
  // 1) rigid meshes under bones -> weight-1 skinned geometry
  const rigid = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh || Array.isArray(o.material)) return;
    // only meshes whose path up to the bone has no animated node of its own (that motion would be baked away)
    let b = o.parent, moving = animated.has(o.name);
    while (b && !b.isBone) { if (animated.has(b.name)) moving = true; b = b.parent; }
    if (b && bones.includes(b) && !moving) rigid.push([o, b]);
  });
  const parts = [];   // { geo (float, base bind space), material }
  const bindInv = new THREE.Matrix4().copy(main.bindMatrix).invert();
  for (const [o, b] of rigid) {
    const k = bones.indexOf(b), n = o.geometry.attributes.position.count, g = new THREE.BufferGeometry(), src = o.geometry;
    for (const a of ['position', 'normal', 'uv', 'color']) if (src.attributes[a]) g.setAttribute(a, floatAttr(src.attributes[a], n));
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    g.setIndex(src.index ? Array.from(src.index.array) : [...Array(n).keys()]);
    const Lrel = new THREE.Matrix4().copy(b.matrixWorld).invert().multiply(o.matrixWorld);
    const T = new THREE.Matrix4().multiplyMatrices(bindInv, new THREE.Matrix4().copy(main.skeleton.boneInverses[k]).invert()).multiply(Lrel);
    g.applyMatrix4(T);
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4); for (let i = 0; i < n; i++) { si[i * 4] = k; sw[i * 4] = 1; }
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    parts.push({ geo: g, material: o.material, src: o });
  }
  // 2) skinned meshes -> float geometry in the main mesh's bind space
  root.traverse((o) => {
    if (!o.isSkinnedMesh || Array.isArray(o.material) || o.bindMode === 'detached') return;
    if (!near(o.bindMatrix, main.bindMatrix)) return;
    let C0 = null;
    for (let j = 0; j < o.skeleton.bones.length; j++) {
      const k = bones.indexOf(o.skeleton.bones[j]); if (k < 0) return;
      const C = new THREE.Matrix4().copy(main.skeleton.boneInverses[k]).invert().multiply(o.skeleton.boneInverses[j]);
      if (!C0) C0 = C; else if (!near(C, C0)) return;
    }
    const src = o.geometry, n = src.attributes.position.count, g = new THREE.BufferGeometry();
    for (const a of ['position', 'normal', 'uv', 'skinWeight', 'color']) if (src.attributes[a]) g.setAttribute(a, floatAttr(src.attributes[a], n));
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    const map = o.skeleton.bones.map((bn) => bones.indexOf(bn)), si = src.attributes.skinIndex, sia = new Uint16Array(n * 4);
    for (let i = 0; i < n; i++) for (let c = 0; c < 4; c++) sia[i * 4 + c] = Math.max(0, map[si.getComponent(i, c)] ?? 0);
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(sia, 4));
    g.setIndex(src.index ? Array.from(src.index.array) : [...Array(n).keys()]);
    const T = new THREE.Matrix4().multiplyMatrices(bindInv, C0 || new THREE.Matrix4()).multiply(main.bindMatrix);
    if (!T.equals(new THREE.Matrix4())) g.applyMatrix4(T);
    parts.push({ geo: g, material: o.material, src: o });
  });
  // 3) group: textured material -> one mesh each; flat colours -> one vertex-coloured mesh
  const groups = new Map(), flats = {};
  for (const p of parts) {
    let key = p.material;
    if (flatMat(p.material)) { colorize(p.geo, p.material, p.geo.attributes.position.count); key = 'flat' + p.material.side; (flats[key] = flats[key] || []).push(p.material); }
    else if (!p.material.vertexColors) p.geo.deleteAttribute('color');
    if (!groups.has(key)) groups.set(key, []); groups.get(key).push(p);
  }
  let changed = 0;
  for (const [key, list] of groups) {
    const flat = typeof key === 'string';
    if (list.length < 2 && !(flat && list.length === 1 && list[0].src.isSkinnedMesh === false)) continue;
    if (!flat && list.some((p) => !!p.geo.attributes.color) !== list.every((p) => !!p.geo.attributes.color)) for (const p of list) { const n = p.geo.attributes.position.count; if (!p.geo.attributes.color) p.geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3)); }
    let geo = null; try { geo = mergeGeometries(list.map((p) => p.geo), false); } catch (e) { geo = null; }
    if (!geo) continue;
    geo.computeBoundingSphere();
    const mat = flat ? flatMaterial(flats[key]) : key;
    const sm = new THREE.SkinnedMesh(geo, mat);
    sm.name = (list[0].src.name || 'part') + '_merged'; sm.castShadow = true; sm.receiveShadow = true;
    host.add(sm); sm.bind(main.skeleton, main.bindMatrix);
    for (const p of list) p.src.parent && p.src.parent.remove(p.src);
    changed++;
  }
  if (typeof window !== 'undefined' && window.__dbgMerge) console.log('merge', root.name, parts.length, 'parts ->', changed, 'meshes; groups', groups.size);
  return root;
}

const box = new THREE.Box3(), v = new THREE.Vector3();

// Clips cut from one long timeline keep their original start time (e.g. the troll's idle starts at 3.5 s):
// three.js would hold the first key until then, so shift every clip to start at 0.
export function trimClips(gltf) {
  if (gltf.__trim) return; gltf.__trim = true;
  for (const cl of gltf.animations || []) {
    let t0 = Infinity; for (const tr of cl.tracks) if (tr.times.length) t0 = Math.min(t0, tr.times[0]);
    if (t0 > 0.05 && t0 < Infinity) { for (const tr of cl.tracks) tr.shift(-t0); cl.resetDuration(); }
  }
}
export function animatedNodes(gltf) {
  const set = new Set();
  for (const cl of gltf.animations || []) for (const tr of cl.tracks) set.add(tr.name.split('.')[0]);
  return set;
}

// opts: { height | length, yaw, shadows }
export function makeCreature(gltf, opts = {}) {
  if (!gltf) return null;
  trimClips(gltf);
  mergeSkinned(gltf.scene, animatedNodes(gltf));
  const inner = SkeletonUtils.clone(gltf.scene);
  inner.rotation.y = opts.yaw || 0;
  const root = new THREE.Group(); root.add(inner);
  inner.updateMatrixWorld(true);
  box.setFromObject(inner, true);
  const size = box.getSize(v);
  const k = opts.height ? opts.height / size.y : opts.length ? opts.length / Math.max(size.x, size.z) : 1;
  inner.scale.setScalar(k);
  inner.updateMatrixWorld(true);
  box.setFromObject(inner, true);
  inner.position.y = -box.min.y;
  inner.traverse((o) => { if (o.isMesh) { o.castShadow = opts.shadows !== false; o.receiveShadow = true; o.frustumCulled = false; } });
  const mixer = new THREE.AnimationMixer(inner);
  const c = { root, inner, mixer, act: null, name: '', clips: gltf.animations || [], scale: k };
  c.find = (re) => (typeof re === 'string' ? c.clips.find((a) => a.name === re) : c.clips.find((a) => re.test(a.name)));
  c.play = (re, { fade = 0.35, speed = 1, once = false } = {}) => {
    const clip = c.find(re); if (!clip || c.name === clip.name) return !!clip;
    const a = mixer.clipAction(clip); a.reset(); a.timeScale = speed;
    a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity); a.clampWhenFinished = once;
    a.play(); if (c.act) c.act.crossFadeTo(a, fade, false);
    c.act = a; c.name = clip.name; return true;
  };
  return c;
}

const WALK = /walk/i, IDLE = /idle|(^|_)eat|graz/i, RUN = /run|gallop|trot/i;   // ("Death" contains "eat")

// Herd: wander inside a circle (cx, cz, r) on the terrain
export function herd(scene, gltf, n, { cx, cz, r, height, size = 2, yaw = 0, speed = 1.3, avoid = () => false, seed = 1 }) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const list = [];
  const pick = () => {
    for (let k = 0; k < 20; k++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * r, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (!avoid(x, z)) return [x, z]; }
    return [cx, cz];
  };
  for (let i = 0; i < n; i++) {
    const c = makeCreature(gltf, { length: size * (0.85 + rnd() * 0.3), yaw }); if (!c) break;
    const [x, z] = pick(); c.root.position.set(x, height(x, z), z); c.root.rotation.y = rnd() * 6.28;
    c.state = 'idle'; c.timer = rnd() * 6; c.target = null; c.speed = speed * (0.85 + rnd() * 0.3);
    c.play(IDLE) || c.play(WALK);
    if (c.act) c.act.time = rnd() * 3;
    c.root.userData.bwCull = 320; scene.add(c.root); list.push(c);
  }
  function update(dt) {
    for (const c of list) {
      c.timer -= dt;
      if (c.state === 'idle' && c.timer <= 0) { c.state = 'walk'; c.target = pick(); c.play(WALK, { speed: 1 }); }
      if (c.state === 'walk') {
        const p = c.root.position, dx = c.target[0] - p.x, dz = c.target[1] - p.z, d = Math.hypot(dx, dz);
        if (d < 0.6 || c.timer < -20) { c.state = 'idle'; c.timer = 4 + rnd() * 9; c.play(IDLE) || c.act && (c.act.timeScale = 0.2); }
        else {
          const want = Math.atan2(dx, dz); let a = want - c.root.rotation.y; while (a > Math.PI) a -= 6.283; while (a < -Math.PI) a += 6.283;
          c.root.rotation.y += a * Math.min(1, dt * 2.5);
          const st = c.speed * dt * Math.max(0, Math.cos(a));
          p.x += Math.sin(c.root.rotation.y) * st; p.z += Math.cos(c.root.rotation.y) * st; p.y = height(p.x, p.z);
        }
      }
      if (!c.root.userData.bwFar) lodStep(c, dt);
    }
  }
  return { list, update };
}
