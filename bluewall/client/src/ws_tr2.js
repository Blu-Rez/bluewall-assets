// TR2-S4b — the Tripo models of the worksites (production lots, mines, mills, farms, fisheries).
// worksites.js (+ c1..c4_kinds.js) say WHAT stands on a site at a level and WHERE (pieces(): kit pieces local to the site, x right, z toward the road / water, metres).
// This module decides which of those pieces are drawn by a Tripo model instead of the old kit piece, and adds the Tripo pieces that replace procedural parts
// (crop plots, pens, glass houses, oil derricks, the quarry face).  Nothing in `pieces()` changes — positions, scales, nav solids (SOLID_R), counts and workers stay exactly as they were
// (noRoute 667 stays); only the DRAWING changes.  A piece whose Tripo file is not loaded (yet) simply keeps its old kit piece, so a failed / late download never leaves a hole.
//
//   plan(site, lv, list, { has })  -> { keep, tr2, noProc, noMovers }     keep = the old pieces still drawn from the kits · tr2 = [{ spec, x, z, ry, k }] (k = metres per model unit, ry = yaw
//                                                                         in the site frame) · noProc = names of procedural parts the Tripo pieces replace · noMovers = the
//                                                                         turning sails / wheel of a mill are part of the Tripo model now
//   bake(parent, site, hf, list, { shadows, bid, name })                    one Batcher per site: every texture one mesh, destruct-patched (aB = battle target of a town lot, 0 = scenery)
//   neededFiles(castle) / preload(castle) / missing(castle)                  the GLB names the sites need at this level; tr2.load of them
// Models: web/assets/tr2/<key>.glb (512 px textures, S2 rule); `ry` of every model (front -> +Z) comes from tr2/swap.json, so a placement with ry = 0 has its door toward the site's front.
// Small props (barrels, carts, logs, racks, tools ...) stay the old kit pieces: they are 100-700 tris each, hundreds per map — a 2-3k-tri Tripo prop would blow the triangle budget.
import * as THREE from 'three';
import { MeshoptSimplifier } from 'three/addons/libs/meshopt_simplifier.module.js';
let tr2 = null;                                                     // tr2lib.js (it reads `window` when it loads): imported on first use, so node tests can import this file
const loadTr2 = () => import('./tr2lib.js').then((m) => (tr2 = m.tr2));
import { Batcher } from './util.js';
import { patchDestruct, plainDepthMaterial } from './destruct.js';
import { sites, wsLevel, counts, inClip, pieces as sitePieces } from './worksites.js';

const HP = Math.PI / 2;
const T = (spec, k, o = {}) => ({ spec, k, ...o });
const DROP = (needs) => ({ drop: true, needs });      // the old piece goes only when `needs` (its Tripo replacement) is loaded

// ------------------------------------------------------------------------------------------------ one piece -> one Tripo model
// key = old piece name; a function gets (site, piece, n) where n = how many pieces of this name came before in the list (0 = the first)
// k = metres per model unit (the model is ≈ 1 unit on its longest side): the old piece's footprint at s = 1 (measured from kit_ws / kit_c1..c4) decides it, see TR2_S4b_map.md
const RULES = {
  ws_lumbermill: T('lumber_mill_1', 15),                                                    // log-cabin yard (old 13 x 16 x 11 m)
  c2_sawshed: T('lumber_mill_0', 10.5),                                                       // the town sawmill: frame + saw bench (old 12.4 x 7.4)
  ws_mine: (s) => (s.kind === 'gold' ? T('gold_mine_0', 14) : T('iron_mine_0', 14.5)),         // the mine mouth in the rock (old 12.5 x 15)
  ws_barn: T('barn_1', 11.5), ws_smallbarn: T('barn_1', 9.5), c4_smallbarn: T('barn_1', 9.5),  // two-storey barn (old 11.3 x 12 / 8.7 x 9)
  ws_openbarn: T('barn_0', 11),                                                               // low mud-brick barn with a fenced pen
  ws_silo: T('silo', 7.5), c4_silo: T('silo', 7.5),
  ws_coop: T('coop_0', 4),
  ws_butcher: T('butcher', 5.5), c4_butchershop: T('butcher', 6.5), c4_slaughterhall: T('butcher', 11),
  ws_brewhouse: T('brewhouse', 9),
  ws_smithy: T('smelter_0', 10), c2_smeltery: T('smelter_0', 10.5),
  c2_masonlodge: T('masonry_0', 10.5),
  c3_hall: T('mint', 14, { at: [0, -6.4], abs: true, sn: 0.84 }), c3_vault: DROP('mint'),                 // the mint is ONE building (old: striking hall + vault, 18 x 10 m)
  c4_bakery: T('bakery', 9),
  c1_house: T('smokehouse', 9.5),
  ws_hut: (s, p, n) => (s.kind === 'panning' && n === 0 ? T('gold_panning_0', 11) : s.kind === 'fishery' ? (n === 0 ? T('fishing_hut_2', 11) : T('fishing_hut_1', 9)) : T('house_cottage_1', 8.5)),
  c4_hut: T('house_cottage_1', 8.5),
  // mills: the Tripo windmill has its sails built in (they do not turn); the water mill's wheel faces the water (local +z)
  c4_windmill_nf: (s, p) => (Math.abs(p.x) < 1 ? T('windmill_asbad_2', 12.5, { noMovers: true }) : T('windmill_asbad_1', 13, { noMovers: true })),
  c4_watermill_nw: T('watermill', 12.5, { ry: -HP, abs: true, noMovers: true }),
  // the fishery jetty runs out to the water along local +z (old 18 m long): the Tripo jetty is along x -> turn it
  ws_jetty: T('jetty', 18.5, { ry: HP, abs: false }),
};
for (const n of ['ws_rockA', 'ws_rockB', 'ws_rockC']) RULES[n] = (s) => (s.kind === 'quarry' ? DROP('stone_quarry_1') : null);       // the quarry face is ONE Tripo piece (composite below)

// ------------------------------------------------------------------------------------------------ composite: Tripo pieces that replace procedural parts
// each returns { add: [{ spec, x, z, ry, k }], drop: (pieceName) => bool, noProc: [...] } for the kind (all local to the site)
const PLOTS = [[-20, -2], [20, -2], [-20, 7], [20, 7], [-20, -11], [20, -11], [-6, -22], [8, -22]];                 // worksites wsbuild PROC.farm slots
const PENS = [[-9, 4], [9, 4], [-9, 16], [9, 16]];
const GH = [[-6.2, -9], [6.2, -9], [-6.2, -2.6], [6.2, -2.6], [-6.2, 3.8], [6.2, 3.8]];
const OIL = [[0, 0, 3.6], [-8.5, -5, 2.8], [8, -4, 2.8], [-5, 5.5, 2.4], [6.5, 6, 2.4], [-12, 1, 2.2], [12, 2, 2.2]];
const COMPOSITE = {
  quarry: () => ({ add: [{ spec: 'stone_quarry_1', x: 0, z: -16.5, ry: 0, k: 22 }], noProc: ['quarry'] }),
  farm: (site, lv) => {
    const n = counts(site, lv).plots | 0, add = [];
    for (let i = 0; i < n; i++) add.push({ spec: i & 1 ? 'farm_field_2' : 'farm_field_1', x: PLOTS[i][0], z: PLOTS[i][1], ry: 0, k: 8.5 });
    return { add, noProc: ['farmplots'] };
  },
  livestock: (site, lv) => {
    const n = counts(site, lv).pens | 0, add = [];
    for (let i = 0; i < n; i++) add.push({ spec: 'livestock_pen_0', x: PENS[i][0], z: PENS[i][1], ry: 0, k: 11.2 });
    return { add, noProc: ['pens'], drop: (name) => name === 'ws_fence' };
  },
  greenhouse: (site, lv) => {
    const n = counts(site, lv).houses | 0, add = [];
    for (let i = 0; i < n; i++) add.push({ spec: 'greenhouse_0', x: GH[i][0], z: GH[i][1], ry: GH[i][0] < 0 ? HP : -HP, k: 10.5 });       // long axis along x, the door toward the aisle
    return { add, noProc: ['greenhouse'] };
  },
  oil: (site, lv) => {
    const n = counts(site, lv).wells | 0, add = [];
    for (let i = 0; i < n; i++) { const [x, z, r] = OIL[i]; add.push(i === 0 ? { spec: 'oil_well_0', x, z, ry: 0, k: 9.5 } : i & 1 ? { spec: 'oil_well_1', x, z, ry: (x < 0 ? 1 : -1) * HP * 0.5, k: 6.5 } : { spec: 'oil_well_0', x, z, ry: x * 0.1, k: 6.2 }); void r; }
    return { add, noProc: ['oilpits'] };
  },
};

const fileOf = (spec) => { const i = spec.indexOf('/'); return i < 0 ? spec : spec.slice(0, i); };
export function plan(site, lv, list, { has = (f) => !!tr2 && tr2.has(f) } = {}) {
  const keep = [], add = [], noProc = new Set(), seen = {}, gone = [];
  let noMovers = false;
  const comp = COMPOSITE[site.kind] ? COMPOSITE[site.kind](site, lv) : null;
  const compOk = !!comp && comp.add.every((a) => has(fileOf(a.spec)));
  for (const p of list) {
    if (compOk && comp.drop && comp.drop(p.n)) continue;
    let r = RULES[p.n]; if (typeof r === 'function') r = r(site, p, seen[p.n] | 0); seen[p.n] = (seen[p.n] | 0) + 1;
    if (r && r.drop) { if (!r.needs || has(r.needs)) { if (r.needs) gone.push({ x: p.x, z: p.z, r: 5 }); continue; } keep.push(p); continue; }                 // (a dropped old piece only goes when its Tripo replacement is loaded)
    if (!r || !has(fileOf(r.spec))) { keep.push(p); continue; }
    if (r.noMovers) noMovers = true;
    const x = r.at ? r.at[0] : p.x, z = r.at ? r.at[1] : p.z;
    add.push({ spec: r.spec, x, z, ry: (r.abs ? 0 : p.ry) + (r.ry || 0), k: r.k * p.s / (r.sn || 1) });
    gone.push({ x: p.x, z: p.z, r: r.k * 0.55 });                                                       // (the old piece's chimney / flame points stand inside this circle)
  }
  if (compOk) { for (const a of comp.add) if (inClip(site.clip, a.x, a.z)) add.push({ ...a, k: a.k }); for (const f of comp.noProc) noProc.add(f); }
  // (a rule whose replacement is not loaded was kept above; a composite whose files are missing leaves the procedural parts alone)
  // smoke: the chimney of a Tripo building replaces the old chimney of the piece it replaced (site-local points, the shape wsbuild's smoke() takes)
  const smoke = [];
  for (const a of add) { const c = SMOKE[fileOf(a.spec)] && chimney(a.spec); if (!c) continue; const cs = Math.cos(a.ry), sn = Math.sin(a.ry); smoke.push({ x: a.x + (c.x * cs + c.z * sn) * a.k, z: a.z + (-c.x * sn + c.z * cs) * a.k, y: c.y * a.k, heavy: SMOKE[fileOf(a.spec)] === 'heavy' }); }
  return { keep, tr2: add, noProc, noMovers, smoke, gone: (x, z) => gone.some((g) => (x - g.x) ** 2 + (z - g.z) ** 2 < g.r * g.r) };
}
// the Tripo buildings that have a chimney: the top of the model (x, y, z at k = 1, after the model's own yaw) is where the smoke starts
const SMOKE = { smelter_0: 'heavy', smokehouse: 'heavy', bakery: 'light', fishing_hut_1: 'light' };
const CHIM = new Map();
function chimney(spec) {
  if (CHIM.has(spec)) return CHIM.get(spec);
  let out = null;
  try {
    let top = -1e9; const pts = [];
    for (const { geometry } of tr2.parts(spec)) { const P = geometry.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (y > top) top = y; pts.push([P.getX(i), y, P.getZ(i)]); } }
    const hi = pts.filter((p) => p[1] > top - 0.025); if (hi.length) out = { x: hi.reduce((a, p) => a + p[0], 0) / hi.length, y: top + 0.01, z: hi.reduce((a, p) => a + p[2], 0) / hi.length };
  } catch (e) { out = null; }                       // (not loaded: no point; the caller asks again once it is)
  if (out) CHIM.set(spec, out);
  return out;
}

// ------------------------------------------------------------------------------------------------ files the sites need
const allLoaded = () => true;
export function neededFiles(castle) {
  const out = new Set();
  for (const s of sites()) {
    const lv = typeof castle === 'number' ? wsLevel(s, castle) : Math.max(0, Math.min(1e9, castle[s.kind] | 0));
    if (lv <= 0) continue;
    for (const a of plan(s, lv, sitePieces(s, lv), { has: allLoaded }).tr2) out.add(fileOf(a.spec));
  }
  return [...out];
}
export const missing = (castle) => neededFiles(castle).filter((f) => !tr2 || !tr2.has(f));
let initP = null;
export function preload(castle) {
  initP = initP || loadTr2().then(() => tr2.init()).catch((e) => { initP = null; throw e; });
  return initP.then(() => tr2.load(neededFiles(castle))).then((o) => Promise.resolve(simReady()).then(() => Object.keys(o).filter((k) => o[k]).length)).catch((e) => { console.warn('ws tr2 preload', e); return 0; });
}

// ------------------------------------------------------------------------------------------------ far variant
// Whole sites are small on screen from the strategic cameras: beyond LOD_NEAR (m from the camera, wsbuild's distance) a site draws its Tripo buildings as ONE flat-shaded, vertex-coloured mesh with
// ~LOD_KEEP of the triangles instead of the textured ones (one draw call for all the models of the site, the same material as the site's own procedural parts: no new texture, no new program).
// Built at load time from the model itself: weld the vertices by position, colour every vertex from the texture, simplify with the simplifier that ships with three (no extra download).
// Not ready / failed -> the textured meshes are simply always drawn.
export const LOD_NEAR = 120, LOD_KEEP = 0.2, LOD_ERR = 0.1, FAR_GAIN = 1.1;       // (FAR_GAIN: averaged texture colours read a little darker than the textured mesh)
let simOk = false, simP = null;
function simReady() { return simP || (simP = Promise.resolve(MeshoptSimplifier.ready).then(() => { simOk = true; }).catch((e) => { console.warn('ws tr2 simplifier', e); })); }
const LIN = new Float32Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; LIN[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const PIX = new WeakMap();
function pixels(map) {
  let hit = PIX.get(map); if (hit) return hit;
  const im = map && map.image; if (!im || !im.width) throw new Error('no readable texture');
  const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(im.width, im.height) : Object.assign(document.createElement('canvas'), { width: im.width, height: im.height });
  const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(im, 0, 0);
  hit = { d: cx.getImageData(0, 0, im.width, im.height).data, w: im.width, h: im.height }; PIX.set(map, hit); return hit;
}
const FAR = new Map();
// -> { p: Float32Array (3 per vertex, model space, non-indexed), c: Float32Array (linear rgb per vertex) }
function farTris(spec, keep = LOD_KEEP, err = LOD_ERR) {
  const ck = spec + '|' + keep + '|' + err; let hit = FAR.get(ck); if (hit) return hit;
  const P = [], C = [];
  for (const part of tr2.parts(spec)) {
    const g = part.geometry, px = pixels(part.material.map), pa = g.attributes.position, uv = g.attributes.uv, idx = g.index;
    if (!idx || !uv) continue;
    const n = pa.count, key = new Map(), remap = new Uint32Array(n), wp = [], wc = [], wn = [];
    for (let i = 0; i < n; i++) {
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), k = Math.round(x * 20000) + ',' + Math.round(y * 20000) + ',' + Math.round(z * 20000);
      let id = key.get(k); if (id === undefined) { id = wp.length / 3; key.set(k, id); wp.push(x, y, z); wc.push(0, 0, 0); wn.push(0); }
      remap[i] = id;
      const u = uv.getX(i), v = uv.getY(i), tx = Math.min(px.w - 1, Math.max(0, Math.floor((u - Math.floor(u)) * px.w))), ty = Math.min(px.h - 1, Math.max(0, Math.floor((v - Math.floor(v)) * px.h))), o = (ty * px.w + tx) * 4;
      wc[id * 3] += LIN[px.d[o]] * FAR_GAIN; wc[id * 3 + 1] += LIN[px.d[o + 1]] * FAR_GAIN; wc[id * 3 + 2] += LIN[px.d[o + 2]] * FAR_GAIN; wn[id]++;
    }
    const nv = wp.length / 3, pos = Float32Array.from(wp), col = new Float32Array(nv * 3);
    for (let i = 0; i < nv; i++) for (let j = 0; j < 3; j++) col[i * 3 + j] = wc[i * 3 + j] / (wn[i] || 1);
    const src = idx.array, wi = []; for (let t = 0; t < src.length; t += 3) { const a = remap[src[t]], b = remap[src[t + 1]], c = remap[src[t + 2]]; if (a !== b && b !== c && a !== c) wi.push(a, b, c); }
    if (!wi.length) continue;
    const want = Math.max(150 * 3, Math.floor(wi.length * keep / 3) * 3);
    const out = wi.length > want ? MeshoptSimplifier.simplifyWithAttributes(Uint32Array.from(wi), pos, 3, col, 3, [1, 1, 1], null, want, err, [])[0] : Uint32Array.from(wi);
    for (let t = 0; t < out.length; t++) { const v = out[t]; P.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); C.push(col[v * 3], col[v * 3 + 1], col[v * 3 + 2]); }
  }
  hit = { p: Float32Array.from(P), c: Float32Array.from(C) }; FAR.set(ck, hit); return hit;
}
// dev: triangle count of the far mesh for other settings
export const farTrisWith = (spec, keep, err) => farTris(spec, keep, err).p.length / 9;
const _v = new THREE.Vector3();
function addFar(acc, spec, m) {
  const f = farTris(spec); const e = m.elements;
  for (let i = 0; i < f.p.length; i += 3) {
    const x = f.p[i], y = f.p[i + 1], z = f.p[i + 2];
    acc.p.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
  }
  for (let i = 0; i < f.c.length; i++) acc.c.push(f.c[i]);
}
function farMesh(acc, mat, bid, name, cast) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(acc.c, 3));
  const ab = new Float32Array(acc.p.length / 3); if (bid) ab.fill(bid); g.setAttribute('aB', new THREE.BufferAttribute(ab, 1));
  g.computeVertexNormals(); g.computeBoundingSphere();
  const mesh = new THREE.Mesh(g, mat); mesh.name = name; mesh.castShadow = !!cast; mesh.receiveShadow = true; mesh.customDepthMaterial = plainDepthMaterial(); mesh.visible = false;
  return mesh;
}

// ------------------------------------------------------------------------------------------------ baking
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export function bake(parent, site, hf, placements, { shadows = false, bid = 0, name = 'ws:tr2', farMat = null } = {}) {
  if (!placements.length) return { near: [], far: [] };
  const B = new Batcher(), acc = farMat && simOk ? { p: [], c: [] } : null, c = Math.cos(site.ry), s = Math.sin(site.ry);
  for (const a of placements) {
    const wx = site.x + a.x * c + a.z * s, wz = site.z - a.x * s + a.z * c;
    _m.compose(_p.set(wx, hf(wx, wz) - 0.04, wz), _q.setFromAxisAngle(_up, site.ry + a.ry), _s.set(a.k, a.k, a.k));
    try { tr2.bake(B, a.spec, _m, { bid }); } catch (e) { console.warn('ws tr2', a.spec, e); continue; }
    if (acc) try { addFar(acc, a.spec, _m); } catch (e) { console.warn('ws tr2 far', a.spec, e); acc.p.length = 0; acc.c.length = 0; acc.bad = true; }
  }
  const near = B.build(parent, { cast: shadows, receive: true, name });
  for (const m of near) patchDestruct(m.material);
  let far = [];
  if (acc && !acc.bad && acc.p.length) { const m = farMesh(acc, farMat, bid, name + ':far', shadows); patchDestruct(m.material); parent.add(m); far = [m]; }
  return { near, far };
}
