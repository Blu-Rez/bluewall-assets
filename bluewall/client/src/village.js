// Real houses from the Quaternius "Medieval Village MegaKit" (CC0): walls,
// corners, windows + shutters, doors, round-tile roofs, gables, chimneys.
// Every house is composed from kit pieces on a 2 m grid, then ALL houses are
// baked into one merged mesh per material (a handful of draw calls total).
import * as THREE from 'three';
import { patchDestruct, plainDepthMaterial } from './destruct.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './noise.js';

const STORY = 3.0;          // floor-to-floor height of the kit walls
const ROOFS = { '2x2': 'Roof_RoundTiles_4x4', '2x3': 'Roof_RoundTiles_4x6', '2x4': 'Roof_RoundTiles_4x8', '3x3': 'Roof_RoundTiles_6x6',
  '3x4': 'Roof_RoundTiles_6x8', '3x5': 'Roof_RoundTiles_6x10', '4x5': 'Roof_RoundTiles_8x10' };
const GABLE = { 2: 'Roof_Front_Brick4', 3: 'Roof_Front_Brick6', 4: 'Roof_Front_Brick8' };

// piece name -> [{geometry (float, piece space), material}]
function indexKit(gltf) {
  const P = {};
  gltf.scene.updateMatrixWorld(true);
  for (const holder of gltf.scene.children) {
    const inv = new THREE.Matrix4().copy(holder.matrixWorld).invert();
    const list = [];
    holder.traverse((o) => {
      if (!o.isMesh) return;
      const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      list.push({ geometry: toFloat(o.geometry, m), material: o.material });
    });
    P[holder.name] = list;
  }
  return P;
}

function toFloat(src, m) {
  const g = new THREE.BufferGeometry();
  const n = src.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  const v = new THREE.Vector3(), nm = new THREE.Matrix3().getNormalMatrix(m);
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(src.attributes.position, i).applyMatrix4(m); pos.set([v.x, v.y, v.z], i * 3);
    if (src.attributes.normal) { v.fromBufferAttribute(src.attributes.normal, i).applyMatrix3(nm).normalize(); nor.set([v.x, v.y, v.z], i * 3); }
    if (src.attributes.uv) { uv[i * 2] = src.attributes.uv.getX(i); uv[i * 2 + 1] = src.attributes.uv.getY(i); }
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (src.attributes.color) {                       // (p38: the worksite kit has pieces painted with vertex colours — keep them)
    const c = src.attributes.color, k = c.itemSize, arr = new Float32Array(n * k);
    for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) arr[i * k + j] = j === 0 ? c.getX(i) : j === 1 ? c.getY(i) : j === 2 ? c.getZ(i) : c.getW(i);
    g.setAttribute('color', new THREE.BufferAttribute(arr, k));
  }
  if (src.index) g.setIndex(Array.from(src.index.array));
  return g;
}

// ------------------------------------------------------------------ recipes
// spec: { x, z, y, rot, nx, nz, floors, seed, lower: 'brick'|'plaster', upper: 'plaster'|'grid', chimney }
export function houseRecipe(spec) {
  const r = rng(spec.seed || 1), out = [];
  const { nx, nz } = spec, W = nx * 2, D = nz * 2, floors = spec.floors || 1;
  const add = (name, x, y, z, ry) => out.push({ name, x, y, z, ry });
  // one side: count pieces, origin + direction of the pieces' local x, outward rotation
  const sides = [
    { n: nx, ox: -W / 2 + 1, oz: D / 2, dx: 2, dz: 0, ry: 0, front: true },
    { n: nx, ox: W / 2 - 1, oz: -D / 2, dx: -2, dz: 0, ry: Math.PI },
    { n: nz, ox: W / 2, oz: D / 2 - 1, dx: 0, dz: -2, ry: Math.PI / 2 },
    { n: nz, ox: -W / 2, oz: -D / 2 + 1, dx: 0, dz: 2, ry: -Math.PI / 2 },
  ];
  for (let f = 0; f < floors; f++) {
    const y = f * STORY, brick = f === 0 && spec.lower !== 'plaster';
    const fam = brick ? 'Wall_UnevenBrick_' : 'Wall_Plaster_';
    for (const s of sides) {
      const door = s.front && f === 0 ? Math.floor((s.n - 1) / 2) : -1;
      for (let i = 0; i < s.n; i++) {
        const x = s.ox + s.dx * i, z = s.oz + s.dz * i;
        if (i === door) {
          add(fam + 'Door_Round', x, y, z, s.ry);
          add('DoorFrame_Round_Brick', x, y, z, s.ry);
          add('Door_1_Round', x, y, z, s.ry);
          continue;
        }
        const t = r();
        if (t < 0.55) {
          const wide = r() < 0.6;
          add(fam + (wide ? 'Window_Wide_Round' : 'Window_Thin_Round'), x, y, z, s.ry);
          add(wide ? 'Window_Wide_Round1' : 'Window_Thin_Round1', x, y, z, s.ry);
          if (r() < 0.75) add(wide ? 'WindowShutters_Wide_Round_Open' : (r() < 0.5 ? 'WindowShutters_Thin_Round_Open' : 'WindowShutters_Thin_Round_Closed'), x, y, z, s.ry);
        } else if (!brick && spec.upper === 'grid' && t < 0.85) add('Wall_Plaster_WoodGrid', x, y, z, s.ry);
        else add(brick ? 'Wall_UnevenBrick_Straight' : (f === 0 ? 'Wall_Plaster_Straight_Base' : 'Wall_Plaster_Straight'), x, y, z, s.ry);
      }
    }
    // corners
    const cn = brick ? 'Corner_Exterior_Brick' : 'Corner_Exterior_Wood';
    add(cn, W / 2, y, D / 2, 0); add(cn, W / 2, y, -D / 2, Math.PI / 2); add(cn, -W / 2, y, -D / 2, Math.PI); add(cn, -W / 2, y, D / 2, -Math.PI / 2);
  }
  const top = floors * STORY;
  const roof = ROOFS[`${nx}x${nz}`];
  if (roof) add(roof, 0, top, 0, 0);
  if (GABLE[nx]) { add(GABLE[nx], 0, top, D / 2, 0); add(GABLE[nx], 0, top, -D / 2, Math.PI); }
  if (spec.chimney !== false) add(r() < 0.5 ? 'Prop_Chimney' : 'Prop_Chimney2', W / 2 - 0.9, top - 0.2, -D / 2 + 1.4 + r() * (D - 2.8), 0);
  if (spec.vine) add(r() < 0.5 ? 'Prop_Vine2' : 'Prop_Vine5', -W / 2 + 1 + (r() < 0.5 ? 0 : W - 2), top - 0.45, D / 2 + 0.12, 0);
  return out;
}

// ------------------------------------------------------------------ bake
const KCACHE = new WeakMap();
const kitIndex = (gltf) => { if (!KCACHE.has(gltf)) KCACHE.set(gltf, indexKit(gltf)); return KCACHE.get(gltf); };

// list: [{ name, matrix }] -> one merged mesh per material
export function bakePieces(scene, gltf, list, { shadows = true, tag = 'kit' } = {}) {
  const K = kitIndex(gltf), byMat = new Map(), missing = new Set();
  for (const { name, matrix, bid = 0 } of list) {
    const parts = K[name]; if (!parts) { missing.add(name); continue; }
    for (const { geometry, material } of parts) {
      if (!byMat.has(material)) byMat.set(material, []);
      const g = geometry.clone().applyMatrix4(matrix);
      const ab = new Float32Array(g.attributes.position.count); if (bid) ab.fill(bid); g.setAttribute('aB', new THREE.BufferAttribute(ab, 1));      // destruct.js: which target this piece belongs to (0 = scenery)
      byMat.get(material).push(g);
    }
  }
  if (missing.size) console.warn(tag + ': missing pieces', [...missing]);
  const meshes = [];
  for (const [mat, geos] of byMat) {
    const geo = mergeGeometries(geos, false); if (!geo) continue;
    geo.computeBoundingSphere();
    // the kit exports everything double-sided; closed pieces don't need it (halves the shading work)
    if (!/Glass|Vine|Leaf|Leaves|Fence|Banner|Cloth/i.test(mat.name)) mat.side = THREE.FrontSide;
    patchDestruct(mat);
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = shadows; mesh.receiveShadow = true; if (shadows) mesh.customDepthMaterial = plainDepthMaterial();
    mesh.name = tag + ':' + mat.name; scene.add(mesh); meshes.push(mesh);
  }
  return { meshes, materials: [...byMat.keys()] };
}

export function bakeVillage(scene, gltf, houses, { shadows = true } = {}) {
  const H = new THREE.Matrix4(), Lm = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const list = [], chimneys = [];
  for (const h of houses) {
    const sc = h.scale || 1;
    H.compose(new THREE.Vector3(h.x, h.y, h.z), q.setFromAxisAngle(up, h.rot || 0), new THREE.Vector3(sc, sc, sc));
    for (const p of houseRecipe(h)) {
      Lm.compose(new THREE.Vector3(p.x, p.y, p.z), new THREE.Quaternion().setFromAxisAngle(up, p.ry), new THREE.Vector3(1, 1, 1));
      list.push({ name: p.name, matrix: new THREE.Matrix4().multiplyMatrices(H, Lm), bid: h.tid || 0 });
      if (p.name.startsWith('Prop_Chimney')) chimneys.push(new THREE.Vector3(p.x, p.y + 3.1, p.z).applyMatrix4(H));
    }
  }
  const res = bakePieces(scene, gltf, list, { shadows, tag: 'village' });
  res.glass = res.materials.find((m) => /Glass/i.test(m.name));
  res.chimneys = chimneys;
  return res;
}

// live (animated) copy of one kit piece, e.g. the windmill with its fan
export function livePiece(gltf, name) {
  const src = gltf.scene.getObjectByName(name); if (!src) return null;
  const o = src.clone(true); o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
  o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  return o;
}
