// TR2-S2 — the Tripo library in the game: loader, ONE shared material configuration, bake / instance helpers, lazy tier manager.
// (The models live in web/assets/tr2/<key>.glb for single models and tr2/<pack>.glb for packs; tr2/swap.json = { models, packs } from TR2_swap.md: yaw `ry`, pack scale `k`.)
//
//   await tr2.init({ swap })                 swap.json (fetched from tr2/swap.json when not given)
//   await tr2.load(['castle_wall_stone_b', 'trees_conifer'])   fetch + parse (meshopt + WebP) a few at a time; cached; refcount-free (release() drops one)
//   tr2.parts(spec, { h | w | k, ry })       [{ geometry, material }]  oriented + scaled, pivot as authored (base centre)
//         spec = 'castle_wall_stone_b' (a single model) or 'trees_conifer/pine_a' (pack/node: the node's own placement is reset; scale k from swap unless h / w / k given)
//         ry = degrees about +Y that bring the model FRONT to +Z (swap.json; walls/gates: the length axis ends up along X); applied BEFORE the uniform scale
//   tr2.bake(B, spec, matrix, opts)          Batcher path (util.js): destructible things (walls, towers, houses, gates).  opts = { h|w|k, ry, bid, tint, ent, min }
//   tr2.instances(parent, spec, matrices, { h|w|k, ry, cast, receive, chunk })   InstancedMesh path: trees, rocks, lamps, props (NEVER for destructible things: no per-vertex aB)
//   tr2.info(spec, opts)                     { size: [x, y, z], min, max, tris } in metres, after ry and scale
//   tr2.ensureLevel(level, kinds, { cap, nameOf })   lazy tiers: loads the tiers on screen (awaited) + the next one (idle); returns { now, soon, drop }; tr2.drop(list) frees the rest
//   tr2.stats()                              { glb, textures, texMB, tris }  (the numbers the report quotes)
//
// ONE material configuration for every Tripo model: MeshStandardMaterial { map, roughness 0.9, metalness 0, vertexColors, envMapIntensity 0.35 } (the same parameters as the game's
// plaster / wood materials, i.e. no new shader program; every geometry carries a white `color` attribute so the batched and the instanced path use the same program) — what differs
// between two models is only the texture, which is a uniform, not a program.  The destruct patch (destruct.js patchDestruct, world.js patches every static material) hooks the
// same way as for the old materials: it reads `transformed` and the per-vertex `aB`, nothing else.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { BASE, toFloatGeo } from './assets.js';
import { TIER_KEYS, tiersNeeded, LEVEL_CAP } from './tiers.js';

/* global __BUILD__ */
const V = typeof __BUILD__ !== 'undefined' ? '?v=' + __BUILD__ : '';
const DEG = Math.PI / 180;
export const TR2_DIR = 'tr2/';
export const TR2_CFG = Object.freeze({ roughness: 0.9, metalness: 0.0, vertexColors: true, envMapIntensity: 0.35 });

let SWAP = { models: {}, packs: {} };
const FILES = new Map();          // name -> { promise, gltf, mat, tex, tris, texMB }
const PARTS = new Map();          // `${name}|${spec}|${opts}` -> { parts, info }
let loader = null;
const getLoader = () => loader || (loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder));

export function setSwap(s) { SWAP = { models: (s && s.models) || {}, packs: (s && s.packs) || {} }; }
export async function init({ swap, base } = {}) {
  if (base) tr2.base = base;
  if (swap) setSwap(swap);
  else if (!Object.keys(SWAP.models).length) { const r = await fetch(tr2.base + 'swap.json' + V); if (!r.ok) throw new Error('tr2 swap.json ' + r.status); setSwap(await r.json()); }
  return tr2;
}

// ---------------------------------------------------------------- the shared material configuration
export function tr2Material(map) {
  const m = new THREE.MeshStandardMaterial({ map, ...TR2_CFG });
  m.userData.tr2 = true;
  return m;
}
const mbOf = (t) => (t && t.image && t.image.width ? t.image.width * t.image.height * 4 * (4 / 3) / 1048576 : 0);

// ---------------------------------------------------------------- loading
const fileOf = (spec) => { const i = spec.indexOf('/'); return i < 0 ? spec : spec.slice(0, i); };
export function load(names, { each } = {}) {
  const list = (Array.isArray(names) ? names : [names]).map(fileOf).filter((n, i, a) => a.indexOf(n) === i);
  const out = {};
  const get = (n) => {
    let e = FILES.get(n);
    if (!e) { e = { promise: null, gltf: null, mat: null, tex: null, tris: 0, texMB: 0 }; FILES.set(n, e); }
    if (!e.promise) {
      e.promise = getLoader().loadAsync(tr2.base + n + '.glb' + V).then((g) => {
        e.gltf = g; let tris = 0, map = null, src = null;
        g.scene.traverse((o) => { if (o.isMesh) { tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; if (!src) src = o.material; } });
        if (!src || !src.map) throw new Error('tr2 ' + n + ': no textured material');
        map = src.map; map.anisotropy = 4; e.tex = map; e.mat = tr2Material(map); e.tris = tris; e.texMB = mbOf(map);
        return e;
      }).catch((err) => { FILES.delete(n); throw err; });
    }
    return e;
  };
  // a few at a time (assets.js does the same) so the scene stays responsive
  const todo = list.slice(), worker = async () => { while (todo.length) { const n = todo.shift(); try { const e = await get(n).promise; out[n] = e; each && each(n, e); } catch (err) { console.warn('tr2', n, err); out[n] = null; } } };
  return Promise.all([worker(), worker(), worker()]).then(() => out);
}
export function release(name) {
  const n = fileOf(name), e = FILES.get(n); if (!e) return false;
  for (const k of [...PARTS.keys()]) if (k.startsWith(n + '|')) { for (const p of PARTS.get(k).parts) p.geometry.dispose(); PARTS.delete(k); }
  if (e.tex) e.tex.dispose();
  if (e.mat) e.mat.dispose();
  if (e.gltf) e.gltf.scene.traverse((o) => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
  FILES.delete(n); return true;
}
export const has = (spec) => { const e = FILES.get(fileOf(spec)); return !!(e && e.gltf); };

// ---------------------------------------------------------------- parts: oriented + scaled geometry
function resolve(spec) {
  const i = spec.indexOf('/');
  if (i < 0) { const m = SWAP.models[spec] || {}; return { file: spec, node: null, ry: m.ry || 0, k: 1, rec: m }; }
  const p = SWAP.packs[spec]; if (!p) throw new Error('tr2: unknown pack node ' + spec);
  return { file: p.pack || spec.slice(0, i), node: p.node || spec.slice(i + 1), ry: p.ry || 0, k: p.k || 1, rec: p };
}
export function parts(spec, o = {}) {
  const r = resolve(spec), e = FILES.get(r.file);
  if (!e || !e.gltf) throw new Error('tr2: ' + r.file + ' is not loaded (await tr2.load first)');
  const ry = o.ry != null ? o.ry : r.ry, key = r.file + '|' + spec + '|' + [ry, o.h, o.w, o.k].join(',');
  let hit = PARTS.get(key); if (hit) return hit.parts;
  let src = e.gltf.scene; src.updateMatrixWorld(true);
  if (r.node) { const n = src.getObjectByName(r.node); if (!n) throw new Error('tr2: no node ' + r.node + ' in ' + r.file); src = n.clone(true); src.position.set(0, 0, 0); src.rotation.set(0, 0, 0); src.scale.set(1, 1, 1); src.updateMatrixWorld(true); }
  const geos = [], R = new THREE.Matrix4().makeRotationY(ry * DEG), bb = new THREE.Box3();
  src.traverse((m) => {
    if (!m.isMesh) return;
    const g = toFloatGeo(m.geometry); g.applyMatrix4(m.matrixWorld); g.applyMatrix4(R);
    g.computeBoundingBox(); bb.union(g.boundingBox); geos.push(g);
  });
  const sz = bb.getSize(new THREE.Vector3());
  let k = o.k != null ? o.k : o.h != null ? o.h / sz.y : o.w != null ? o.w / Math.max(sz.x, sz.z) : r.k;
  if (!(k > 0) || !isFinite(k)) k = 1;
  const S = new THREE.Matrix4().makeScale(k, k, k), out = [], box = new THREE.Box3();
  let tris = 0;
  for (const g of geos) {
    g.applyMatrix4(S);
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));   // (white: the Tripo material is vertexColors like the rest of the game)
    g.computeBoundingBox(); g.computeBoundingSphere(); box.union(g.boundingBox);
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    out.push({ geometry: g, material: e.mat });
  }
  const s2 = box.getSize(new THREE.Vector3());
  PARTS.set(key, { parts: out, info: { size: [s2.x, s2.y, s2.z], min: box.min.toArray(), max: box.max.toArray(), tris, k, ry } });
  return out;
}
export function info(spec, o = {}) { parts(spec, o); const r = resolve(spec), ry = o.ry != null ? o.ry : r.ry; return PARTS.get(r.file + '|' + spec + '|' + [ry, o.h, o.w, o.k].join(',')).info; }

// ---------------------------------------------------------------- Batcher path (destructible, tier-tagged): the same call the procedural pieces use
export function bake(B, spec, matrix, o = {}) {
  const ps = parts(spec, o);
  for (const p of ps) B.add(p.geometry, p.material, matrix, { bid: o.bid, tint: o.tint, ent: o.ent, min: o.min });
  return ps.length;
}

// ---------------------------------------------------------------- InstancedMesh path (not destructible)
export function instances(parent, spec, matrices, o = {}) {
  if (!matrices.length) return [];
  const { cast = true, receive = true, chunk = 0 } = o, ps = parts(spec, o), meshes = [], cells = new Map();
  if (chunk && matrices.length > 80) matrices.forEach((mt, i) => { const el = mt.elements, key = Math.floor(el[12] / chunk) + ',' + Math.floor(el[14] / chunk); let c = cells.get(key); if (!c) cells.set(key, c = []); c.push(i); });
  else cells.set('all', matrices.map((_, i) => i));
  for (const p of ps) for (const idx of cells.values()) {
    const m = new THREE.InstancedMesh(p.geometry, p.material, idx.length);
    idx.forEach((k, j) => m.setMatrixAt(j, matrices[k]));
    m.castShadow = cast; m.receiveShadow = receive; m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.name = 'tr2:' + spec;
    parent.add(m); meshes.push(m);
  }
  return meshes;
}

// ---------------------------------------------------------------- lazy tiers (castle walls / towers / gates, later 9-tier houses)
// `kinds` = the model families that have 9 tiers ('castle_wall', 'castle_gate', 'castle_tower_short' ...); nameOf(kind, tierIndex) -> the file name (default `${kind}_${tierKey}`).
// Loads the tiers of tiers.js tiersNeeded(level): the ones on screen now are awaited, the upper one (one level before its half zone starts) loads when the browser is idle.
// Order at a level change:  const r = await tr2.ensureLevel(level, kinds);  rebuild the pieces (bake);  tr2.drop(r.drop)  — the old tier's meshes are gone by then, so its textures
// leave the GPU without a re-upload.  Returns { now, soon, drop } (names).
const HELD = new Set();
const idle = (f) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(f, { timeout: 4000 }) : setTimeout(f, 50));
export async function ensureLevel(level, kinds, { cap = LEVEL_CAP, nameOf = (k, t) => k + '_' + TIER_KEYS[t], each } = {}) {
  const need = tiersNeeded(level, cap), now = [], soon = [];
  for (const t of need.now) for (const k of kinds) now.push(nameOf(k, t));
  for (const t of need.soon) for (const k of kinds) soon.push(nameOf(k, t));
  const keep = new Set([...now, ...soon]);
  await load(now, { each });
  for (const n of now) HELD.add(n);
  if (soon.length) { for (const n of soon) HELD.add(n); idle(() => { load(soon, { each }).catch(() => {}); }); }
  const drop = [...HELD].filter((n) => !keep.has(n) && kinds.some((k) => n.startsWith(k + '_')));
  return { now, soon, drop };
}
export function drop(names) { let n = 0; for (const x of names || []) { HELD.delete(x); if (release(x)) n++; } return n; }

export function stats() {
  let textures = 0, texMB = 0, tris = 0, glb = 0;
  for (const e of FILES.values()) if (e.gltf) { glb++; textures++; texMB += e.texMB; tris += e.tris; }
  return { glb, textures, texMB: +texMB.toFixed(1), tris: Math.round(tris) };
}

export const tr2 = { base: BASE + TR2_DIR, init, load, release, drop, has, parts, info, bake, instances, ensureLevel, stats, setSwap, material: tr2Material, cfg: TR2_CFG };
export default tr2;
