// Loads the packed CC0 models (web/assets/*.glb, meshopt + webp) and the
// fort PBR textures, with progress. Also: instancing + skinned-clone helpers.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export const BASE = (window.BW_ASSETS || '/assets/').replace(/\/?$/, '/');
/* global __BUILD__ */
const V = typeof __BUILD__ !== 'undefined' ? '?v=' + __BUILD__ : '';
export const MODELS = ['ez_pine_a', 'ez_pine_b', 'ez_pine_c', 'ez_oak_a', 'ez_oak_b', 'ez_ash_a', 'ez_aspen_a', 'ez_bush_a', 'ez_bush_b',
  'rockset1', 'rockset2', 'cliff1', 'cliff2', 'bush', 'bushf', 'grass', 'grasst', 'grassw', 'flower3', 'flower4', 'fern', 'clover', 'mushroom', 'plant',
  'rock1', 'rock2', 'rock3', 'pebble1', 'pebble2', 'ranger_m', 'ranger_f', 'peasant_m', 'peasant_f', 'puglin', 'imp', 'anims',
  'sword', 'shield', 'bow', 'torch', 'barrel', 'crate', 'anvil', 'weaponstand', 'dummy', 'cauldron', 'stall', 'cart',
  'banner', 'wagon', 'chest', 'coins', 'kit_village', 'kit_hex'];
// streamed in after the first frame (creatures, farm, siege camp)
export const LATE = ['prowler', 'troll', 'ogre', 'cyclops', 'treant', 'werewolf', 'crow', 'eagle', 'horse_m2m_bay', 'horse_m2m_black', 'horse_m2m_grey', 'horse_hq_barded', 'knight_k3', 'cow', 'wolf',
  'windmill2', 'watermill', 'blacksmith', 'watchtower', 'haybale', 'tent_general', 'trebuchet', 'catapult', 'ballista', 'ram',
  'siege_tower', 'barn', 'silo', 'coop', 'pumpkin', 'corn', 'cabbage', 'kit_ws', 'kit_def', 'an_sheep', 'an_pig',
  'pegasus', 'anims_army', 'helmet2', 'helmet3', 'shield_heater', 'spear', 'claymore', 'shieldmaiden', 'shield_round2'];   // army.js reads these from A.models
// load any packed model by name (web/assets/<name>.glb); cached per name
const GLB = {};
export function loadGLB(name) {
  if (!GLB[name]) { const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); GLB[name] = loader.loadAsync(BASE + name + '.glb' + V).catch((e) => { console.warn('glb', name, e); return null; }); }
  return GLB[name];
}
// Late models: fetched in the background while the world is still being built (prefetch), parsed later by loadLate.
const PRE = {};
const getBuf = (n) => PRE[n] || (PRE[n] = fetch(BASE + n + '.glb' + V).then((r) => { if (!r.ok) throw new Error(n + ' ' + r.status); return r.arrayBuffer(); }));
export function prefetch(names) {
  const queue = names.slice();
  const worker = async () => { while (queue.length) { const n = queue.shift(); try { await getBuf(n); } catch (e) { delete PRE[n]; } } };
  worker(); worker(); worker();
}
export async function loadLate(A, names, each) {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  // a few at a time so the scene stays responsive
  const queue = names.slice();
  const worker = async () => {
    while (queue.length) {
      const n = queue.shift();
      try { A.models[n] = await loader.parseAsync(await getBuf(n), BASE); delete PRE[n]; each && each(n, A.models[n]); } catch (e) { console.warn('late', n, e); delete PRE[n]; }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}
export const TEXSETS = ['UnevenBrick', 'Brick', 'RockTrim', 'Plaster', 'RoundTiles', 'WoodTrim'];
const TEXKINDS = { UnevenBrick: ['BaseColor', 'Normal', 'Roughness'], Brick: ['BaseColor', 'Normal', 'Roughness'], RockTrim: ['BaseColor', 'Normal', 'ORM'],
  Plaster: ['BaseColor', 'Normal', 'ORM'], RoundTiles: ['BaseColor', 'Normal', 'Roughness'], WoodTrim: ['BaseColor', 'Normal', 'Roughness'] };

export const PHTEX = ['ph_rock', 'ph_grass2', 'ph_mossrock', 'ph_snow', 'ph_mud', 'ph_leaves', 'ph_path', 'ph_cliff', 'ph_cobble', 'ph_brick', 'ph_cobble_n', 'ph_brick_n', 'ph_cliff_n', 'ph_mossrock_n'];
export async function loadAssets(progress) {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const tl = new THREE.TextureLoader();
  const A = { models: {}, tex: {}, ph: {} };
  let done = 0; const total = MODELS.length + TEXSETS.length + PHTEX.length;
  const tick = () => { done++; progress && progress(done / total); };
  const jobs = MODELS.map((n) => loader.loadAsync(BASE + n + '.glb' + V).then((g) => { A.models[n] = g; tick(); }).catch((e) => { console.warn('model', n, e); tick(); }));
  const tjob = (set) => {
    const get = (kind, srgb) => new Promise((ok) => tl.load(BASE + `tex/${set}_${kind}.webp` + V, (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; ok(t);
    }, undefined, () => ok(null)));
    const K = TEXKINDS[set] || [];
    const want = (k, srgb) => (K.includes(k) ? get(k, srgb) : Promise.resolve(null));
    return Promise.all([want('BaseColor', true), want('Normal'), want('Roughness'), want('ORM')]).then(([map, normalMap, rough, orm]) => {
      A.tex[set] = { map, normalMap, roughnessMap: rough || orm, aoMap: orm }; tick();
    });
  };
  const pjob = (k) => new Promise((ok) => tl.load(BASE + `tex/${k}.webp` + V, (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = k.endsWith('_n') ? THREE.NoColorSpace : THREE.SRGBColorSpace; A.ph[k] = t; tick(); ok();
  }, undefined, () => { tick(); ok(); }));
  await Promise.all([...jobs, ...TEXSETS.map(tjob), ...PHTEX.map(pjob)]);
  return A;
}

// Quantized (meshopt / KHR_mesh_quantization) attributes are normalized ints:
// convert to plain floats before baking transforms or values get clamped to [-1, 1].
export function toFloatGeo(src) {
  const g = new THREE.BufferGeometry();
  for (const [name, a] of Object.entries(src.attributes)) {
    const n = a.count, k = a.itemSize, out = new Float32Array(n * k);
    for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) out[i * k + j] = a.getComponent(i, j);
    g.setAttribute(name, new THREE.BufferAttribute(out, k));
  }
  if (src.index) g.setIndex(new THREE.BufferAttribute(new Uint32Array(src.index.array), 1));
  for (const gr of src.groups) g.addGroup(gr.start, gr.count, gr.materialIndex);
  return g;
}

// Every mesh primitive of a static model, with its node transform baked in.
export function parts(gltf) {
  const out = [];
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const g = toFloatGeo(o.geometry); g.applyMatrix4(o.matrixWorld);
    out.push({ geometry: g, material: o.material });
  });
  return out;
}

// One InstancedMesh per part for a list of matrices.
// p29: far meadow cells draw a growing share of their instances (grass blades there are sub-pixel anyway): the cells' instance order is shuffled once,
// then `m.count` is lowered by distance (continuously, so there is no visible step). Look at the default view stays the same, tris go down.
const LOD = [];
export function meadowLod(cam, near = 180, far = 380, fmin = 0.4) {
  const p = cam.position, off = typeof window !== 'undefined' && window.__bwNoLod;     // (dev switch for before/after measurements)
  for (const m of LOD) {
    if (off) { if (m.count !== m.userData.lodN) m.count = m.userData.lodN; continue; }
    const s = m.boundingSphere, d = Math.max(0, Math.hypot(p.x - s.center.x, p.y - s.center.y, p.z - s.center.z) - s.radius * 0.6);
    const f = d <= near ? 1 : Math.max(fmin, 1 - (d - near) / (far - near) * (1 - fmin)), n = Math.max(1, Math.ceil(m.userData.lodN * f));
    if (m.count !== n) m.count = n;
  }
}
export function meadowLodReset() { for (const m of LOD) m.count = m.userData.lodN; }
export function instance(scene, gltf, matrices, { cast = true, receive = true, color = null, chunk = 0, lod = false } = {}) {
  if (!gltf || !matrices.length) return [];
  const meshes = [];
  // p28: a big list (the meadow: grass, ferns, flowers) used to be ONE InstancedMesh whose bounding sphere covered the whole map, so every instance was
  // processed every frame. With `chunk` (metres) it is split into square cells; each cell has its own tight bounding sphere and is frustum-culled by three.js.
  const cells = new Map();
  if (chunk && matrices.length > 80) {
    matrices.forEach((mt, i) => { const e = mt.elements, key = Math.floor(e[12] / chunk) + ',' + Math.floor(e[14] / chunk); let c = cells.get(key); if (!c) cells.set(key, c = []); c.push(i); });
  } else cells.set('all', matrices.map((_, i) => i));
  if (lod && chunk && cells.size > 1) { let sd = 12345; for (const idx of cells.values()) for (let i = idx.length - 1; i > 0; i--) { sd = (sd * 1664525 + 1013904223) >>> 0; const j = sd % (i + 1), t = idx[i]; idx[i] = idx[j]; idx[j] = t; } }
  for (const p of parts(gltf)) {
    for (const idx of cells.values()) {
      const m = new THREE.InstancedMesh(p.geometry, p.material, idx.length);
      idx.forEach((k, j) => { m.setMatrixAt(j, matrices[k]); if (color) m.setColorAt(j, color(k)); });
      m.castShadow = cast; m.receiveShadow = receive; m.computeBoundingSphere();
      if (lod && chunk && cells.size > 1) { m.userData.lodN = idx.length; LOD.push(m); }
      scene.add(m); meshes.push(m);
    }
  }
  return meshes;
}

export function cloneSkinned(gltf) { return SkeletonUtils.clone(gltf.scene); }

export function height(gltf) { const b = new THREE.Box3().setFromObject(gltf.scene); return b.max.y - b.min.y; }
