// TR2-S4c — the Tripo library for the open country: trees, rocks, bushes, meadow flowers / ground cover, lamps (posts + wall torches), props (barrels, crates,
// carts, market stalls).  ALL the glue is here; trees.js / sc_rocks.js / sc_bush.js / world.js only ask this module for geometry through a few marked
// `// TR2-S4c:` lines, and every one of those falls back to the old code when `S4C.on` is false (dev switch: `?s4c=0` in the URL = the old look, for A/B numbers).
//
//   await S4C.load()              fetch + parse the 12 packs of web/assets/tr2 (≈ 2.4 MB, textures 256 / 512 px); on any failure S4C.on becomes false (old models)
//   S4C.treeSet(season)           { VAR: {key:[h, weight, group]}, parts: {key:{ parts, width, depth, height }}, tint(key, i) }   (trees.js)
//   S4C.rocks()                   { geo: {boulder, crag, stone}, tex: {kind: Texture} }   (sc_rocks.js; unit rock ≈ 2 m across, a fifth buried)
//   S4C.bushes()                  [{ parts, half }]  height-1 shrubs for the card-atlas bake (sc_bush.js)
//   S4C.lamp(B, gy, x, y, z, o, targets)   Tripo post lamp / wall torch baked into the castle batch (destructible with its structure); returns the flame anchor {x,y,z} or null
//   S4C.props(scene, name, matrices, cast)  instanced barrels / crates / carts / stalls for the `ctx.inst` lists; true when handled
//   S4C.meadow(key)               a gltf-like { scene } for assets.js instance(): flowers / clover / fern
//
// Everything uses tr2lib's ONE shared material configuration (no new shader program per model); instanced (not destructible) for nature + props, baked (destructible) for lamps.
import * as THREE from 'three';
import tr2 from './tr2lib.js';
import { seasonWeights } from './terrain.js';

const QS = typeof location !== 'undefined' ? location.search : '';
export const S4C = { on: !/[?&]s4c=0(\b|$)/.test(QS), ready: false, count: {} };          // count: how many of what the build placed (dev numbers for the report)
const cnt = (k, n = 1, x, y, z) => { S4C.count[k] = (S4C.count[k] || 0) + n; if (x != null && S4C.count[k] <= 400) (S4C.at = S4C.at || []).push([k, +x.toFixed(1), +y.toFixed(1), +z.toFixed(1)]); };      // (dev: where the first few of each kind stand, for the close-up frames)
// per-part switches (15 Oct, owner: «the new trees / rocks look like giant coral and blobs — keep what was good before, delete what is bad»): the Tripo TREES and ROCKS are OFF by default (the EZ-Tree forest and
// the old rocks are back), lamps / torches / props / stalls / bushes / meadow stay Tripo.  URL: ?s4c_trees=1 / ?s4c_rocks=1 turn the Tripo ones on again for A/B.
const part = (k, dflt) => { const m = QS.match(new RegExp('[?&]s4c_' + k + '=(\\d)')); return m ? m[1] !== '0' : dflt; };
S4C.part = { trees: part('trees', false), rocks: part('rocks', false) };
if (typeof window !== 'undefined') window.__S4C = S4C;
const PACKS = ['trees_conifer', 'trees_broadleaf', 'trees_special', 'trees_season', 'bushes', 'rocks_boulder', 'rocks_small', 'flowers', 'ground_cover',
  'lamps_wall_street', 'lamps_torches_braziers', 'props_town', 'market_stalls'];
const hash = (a, b) => { let h = Math.imul((Math.round(a * 31) | 0) ^ 0x9e3779b9, 2654435761) ^ Math.imul((Math.round(b * 31) | 0) + 0x7f4a7c15, 2246822519); h ^= h >>> 15; h = Math.imul(h, 2246822519); return ((h ^ (h >>> 13)) >>> 0) / 4294967296; };

S4C.load = async function load() {
  if (!S4C.on || S4C.ready) return S4C.on;
  try {
    await tr2.init();
    const got = await tr2.load(PACKS);
    const miss = PACKS.filter((n) => !got[n]);
    if (miss.length) throw new Error('missing ' + miss.join(','));
    S4C.ready = true;
  } catch (e) { console.warn('TR2-S4c: Tripo packs unavailable, old models stay', e); S4C.on = false; }
  return S4C.on;
};

// ------------------------------------------------------------------ trees
// [spec, target height m, weight, group]  — heights follow the old EZ-Tree scale (pines 13-21 m, broadleaf 13-16 m, shrubs 2.6-3.2 m)
const TREES = {      // (fewer variants than the first cut: every variant is one more draw call for its far-forest impostor, and the budget is calls_after <= calls_before; cedar / cypress / plane / walnut / birch stay in the library for later)
  tr_spruce: ['trees_conifer/spruce', 20, 10, 'pine'], tr_pine: ['trees_conifer/pine', 23, 2.5, 'pine'],
  tr_oak: ['trees_broadleaf/oak', 9, 1.3, 'broad'], tr_willow: ['trees_special/willow', 11, 2.4, 'broad'], tr_poplar: ['trees_broadleaf/poplar', 17, 1.0, 'broad'],
  tr_maple: ['trees_season/maple_autumn', 15, 0, 'broad'], tr_dead: ['trees_season/dead_tree', 13, 0, 'broad'], tr_fir_snow: ['trees_season/fir_snow', 20, 0, 'pine'],
  tr_round: ['bushes/round', 3.2, 1.2, 'bush'], tr_box: ['bushes/boxwood', 2.6, 1.2, 'bush'],
};
S4C.treeSet = function treeSet(season) {
  const SW = seasonWeights(season), aut = SW.w[2], win = SW.w[3];
  const VAR = {}, parts = {};
  const w = (k) => {
    let x = TREES[k][2];
    if (k === 'tr_maple') x = aut > 0.2 ? 0.2 + aut * 1.0 : 0;                       // autumn: the red-gold maples (+ the other broadleaf trees below, warmer)
    else if (k === 'tr_fir_snow') x = win > 0.3 ? 2 + win * 8 : 0;                // winter: snow-laden firs
    else if (k === 'tr_dead') x = win > 0.55 ? 12 : 0;                            // winter: bare trees replace the broadleaf (their leaves cannot be stripped from a one-mesh model)
    else if (TREES[k][3] === 'broad' && win > 0.55) x = 0;
    else if (TREES[k][3] === 'pine' && win > 0.55) x *= 0.45;
    return x;
  };
  for (const [k, [spec, h, , g]] of Object.entries(TREES)) {
    const wt = w(k); if (!(wt > 0)) continue;
    const ps = tr2.parts(spec, { h }), inf = tr2.info(spec, { h });
    VAR[k] = [h, wt, g];
    parts[k] = { parts: ps.map((p) => ({ geometry: p.geometry, material: p.material, leaf: true })), width: inf.size[0], depth: inf.size[2], height: h };
  }
  const WARM = [new THREE.Color(1.7, 1.0, 0.4), new THREE.Color(1.9, 0.85, 0.35), new THREE.Color(1.5, 1.1, 0.4), new THREE.Color(1.8, 0.65, 0.4)];      // × the green leaf texture: gold, orange, yellow, red-orange
  const tint = (k, i) => {
    const e = TREES[k][3] === 'pine' ? 1.55 : 1.05, v = (0.9 + ((i * 0.618) % 1) * 0.2) * e, c = new THREE.Color(v * (TREES[k][3] === 'pine' ? 1.08 : 1), v * (0.98 + ((i * 0.37) % 1) * 0.05), v * (TREES[k][3] === 'pine' ? 0.84 : 0.96));      // (exposure match: the library textures are darker than the old leaf cards)
    if (k === 'tr_maple') c.multiply(new THREE.Color(0.8, 0.74, 0.7));           // (the maple texture is bright salmon-red: pull it toward the old muted autumn)
    if (aut > 0.05 && TREES[k][3] !== 'pine' && k !== 'tr_maple' && k !== 'tr_dead') c.multiply(new THREE.Color(1, 1, 1).lerp(WARM[(i * 7 + 3) % WARM.length], Math.min(1, aut * (0.5 + ((i * 0.53) % 1) * 0.6))));
    return c;
  };
  return { VAR, parts, tint, light: 1.7, lightOf: (g) => (g === 'pine' ? 1.7 : 1.25) };
};

// ------------------------------------------------------------------ rocks
const unitRock = (spec, w) => {
  const ps = tr2.parts(spec, { w }), inf = tr2.info(spec, { w }), H = inf.size[1], g = ps[0].geometry.clone();
  const cx = (inf.min[0] + inf.max[0]) / 2, cz = (inf.min[2] + inf.max[2]) / 2;
  g.translate(-cx, -inf.min[1] - H * 0.2, -cz);                                    // origin on the ground line, a fifth of the rock buried (sc_rocks.js convention)
  g.computeBoundingSphere();
  return { g, tex: ps[0].material.map };
};
S4C.rocks = function rocks() {
  const spec = { boulder: 'rocks_boulder/mossy', crag: 'rocks_boulder/granite', stone: 'rocks_small/angular' };      // (three meshes like the old kit: a slab is a flattened boulder — sc_rocks maps unknown kinds to 'boulder'; every kind is one draw call)
  const geo = {}, tex = {};
  for (const [k, s] of Object.entries(spec)) { const r = unitRock(s, 2); geo[k] = r.g; tex[k] = r.tex; }
  return { geo, tex };
};

// ------------------------------------------------------------------ bushes (baked into the card atlas: 8 triangles a bush in game)
S4C.bushes = function bushes() {
  return ['bushes/round', 'bushes/boxwood'].map((spec) => {
    const ps = tr2.parts(spec, { h: 1 }), inf = tr2.info(spec, { h: 1 });
    return { parts: ps.map((p) => ({ geometry: p.geometry, material: p.material, leaf: true })), half: Math.max(inf.size[0], inf.size[2]) / 2 };
  });
};

// ------------------------------------------------------------------ lamps
// flame anchor of a lamp model = the centre of its top fifth (where the lantern / bowl is), as fractions of the height; measured once from the geometry
const ANCH = new Map();
function anchor(spec) {
  let a = ANCH.get(spec); if (a) return a;
  const ps = tr2.parts(spec, { h: 1 });
  let sx = 0, sy = 0, sz = 0, n = 0, zmin = 1e9, ymax = 0;
  for (const p of ps) { const P = p.geometry.attributes.position; for (let i = 0; i < P.count; i++) { ymax = Math.max(ymax, P.getY(i)); zmin = Math.min(zmin, P.getZ(i)); } }
  for (const p of ps) { const P = p.geometry.attributes.position; for (let i = 0; i < P.count; i++) if (P.getY(i) > ymax * 0.78) { sx += P.getX(i); sy += P.getY(i); sz += P.getZ(i); n++; } }
  ANCH.set(spec, a = { x: sx / n, y: sy / n, z: sz / n, zmin });
  return a;
}
const POSTS = [['lamps_wall_street/lamp_post', 6], ['lamps_torches_braziers/fire_basket_pole', 3], ['lamps_torches_braziers/torch_pole', 1.5]];
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _Y = new THREE.Vector3(0, 1, 0), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const place = (x, y, z, ry) => _m.compose(_p.set(x, y, z), _q.setFromAxisAngle(_Y, ry), _s.set(1, 1, 1)).clone();
S4C.lamp = function lamp(B, gy, x, y, z, o, targets) {
  if (!S4C.ready || !B) return null;
  if (o.post) {
    if (y - gy > 5) gy = y - 2.2;                                                  // a torch on a tower top / quay: the old pole ran up from the ground inside the masonry; the Tripo one stands on the platform (2.2 m below the flame)
    const hf = y + 0.35 - gy;                                                       // where the game's flame sprite sits above the ground
    const pool = o.only ? POSTS.filter((q) => q[0] === o.only) : o.pool ? POSTS : POSTS.slice(1);      // street lamps (glass lantern) only along the lit streets; braziers elsewhere.  ST1_R3: o.only = one fixed model (the storage yards: the lantern post, never the crumpled fire basket)
    const tot = pool.reduce((a, p) => a + p[1], 0); let t = hash(x, z) * tot, spec = pool[0][0];
    for (const [s, wgt] of pool) { if ((t -= wgt) < 0) { spec = s; break; } }
    const a = anchor(spec), H = hf / a.y * (spec === 'lamps_wall_street/lamp_post' ? 0.72 : 1), ry = hash(z, x) * 6.283;       // (15 Oct, owner: the street lamp towered over the hero and glared: 0.72 x, its lantern is still bigger than a real one)
    const c = Math.cos(ry), s = Math.sin(ry), ax = (a.x * c + a.z * s) * H, az = (-a.x * s + a.z * c) * H;     // keep the flame on the pole's axis
    tr2.bake(B, spec, place(x - ax, gy - 0.04, z - az, ry), { h: H }); cnt('post:' + spec.split('/')[1], 1, x, gy, z);
    return { x, y: gy + a.y * H, z };
  }
  if (o.sconce) {
    // a wall torch: plate on the nearest face of the structure this torch belongs to (its battle target), head turned away from it; far from any face (or no rectangular target): a plain hand torch upright
    const t = B.tagB && targets && targets[B.tagB - 1];
    if (t && t.id === B.tagB && t.w > 0 && t.d > 0 && t.rot != null) {
      const co = Math.cos(t.rot), si = Math.sin(t.rot), dx = x - t.x, dz = z - t.z, lx = dx * co - dz * si, lz = dx * si + dz * co, hx = t.w / 2, hz = t.d / 2;
      const qx = Math.max(-hx, Math.min(hx, lx)), qz = Math.max(-hz, Math.min(hz, lz));
      let nx = lx - qx, nz = lz - qz, d0 = Math.hypot(nx, nz);
      if (d0 < 1e-4) { d0 = 0; if (hx - Math.abs(lx) < hz - Math.abs(lz)) { nx = Math.sign(lx) || 1; nz = 0; } else { nx = 0; nz = Math.sign(lz) || 1; } }
      if (d0 <= 1.0) {
        const wx = nx * co + nz * si, wz = -nx * si + nz * co, l = Math.hypot(wx, wz) || 1, ux = wx / l, uz = wz / l;       // outward normal at that face (world)
        const spec = 'lamps_torches_braziers/torch_wall', H = 1.1, a = anchor(spec), ry = Math.atan2(ux, uz), c = Math.cos(ry), s = Math.sin(ry);
        const dHead = (a.z - a.zmin) * H, hxw = x - ux * d0 + ux * dHead, hzw = z - uz * d0 + uz * dHead;                // head: plate on the face
        const px = hxw - (a.x * c + a.z * s) * H, pz = hzw - (-a.x * s + a.z * c) * H, base = y + 0.35 - a.y * H;
        tr2.bake(B, spec, place(px, base, pz, ry), { h: H }); cnt('sconce:torch_wall', 1, hxw, y, hzw);
        return { x: hxw, y: y + 0.35, z: hzw };
      }
    }
    tr2.bake(B, 'lamps_torches_braziers/torch_hand', place(x, y - 0.5, z, o.ry || 0), { h: 0.9 }); cnt('sconce:torch_hand', 1, x, y, z);
    return { x, y: y + 0.35, z };
  }
  return null;
};

// ------------------------------------------------------------------ props (ctx.inst lists)
const STALLS = ['market_stalls/stall_produce', 'market_stalls/stall_cloth', 'market_stalls/stall_spice', 'market_stalls/stall_pottery'];
const SIZE = { 'props_town/barrels': { w: 2.2 }, 'props_town/crates': { w: 2.4 }, 'props_town/sacks': { w: 1.6 }, 'props_town/wagon': { w: 4.2 }, 'props_town/handcart': { w: 2.0 },
  'market_stalls/stall_produce': { h: 3.6 }, 'market_stalls/stall_cloth': { h: 3.6 }, 'market_stalls/stall_spice': { h: 3.6 }, 'market_stalls/stall_pottery': { h: 3.6 } };      // (TR2_swap.md §8 target sizes; always explicit: the packs are meshopt-quantised, so the raw `k` of swap.json is not a metre scale)
S4C.props = function props(scene, name, list, cast) {
  if (!S4C.ready || !list.length) return false;
  const f = { barrel: 0.72, crate: 0.62, cart: 0.8, stall: 1.0 }[name]; if (!f) return false;
  const by = {}; const P = new THREE.Vector3(), Qt = new THREE.Quaternion(), S = new THREE.Vector3();
  list.forEach((m, i) => {
    m.decompose(P, Qt, S);
    const spec = name === 'barrel' ? 'props_town/barrels' : name === 'crate' ? (hash(P.x, P.z) < 0.18 ? 'props_town/sacks' : 'props_town/crates') : name === 'cart' ? (hash(P.z, P.x) < 0.35 ? 'props_town/handcart' : 'props_town/wagon') : STALLS[(i + ((hash(P.x, P.z) * 3) | 0)) % STALLS.length];
    const k = name === 'stall' ? 1 : S.x / ({ barrel: 1.4, crate: 1.3, cart: 1.5 }[name] || 1);                 // the old lists scale a unit prop; the Tripo ones are sized in metres already
    (by[spec] = by[spec] || []).push(new THREE.Matrix4().compose(P, Qt, S.set(f * k, f * k, f * k)));
  });
  for (const [spec, mats] of Object.entries(by)) { tr2.instances(scene, spec, mats, { ...SIZE[spec], cast, receive: true }); cnt('prop:' + spec.split('/')[1], mats.length); }
  return true;
};

// ------------------------------------------------------------------ meadow: flowers, clover, fern  (1 old model -> 1 Tripo node: same draw calls; counts are lowered in world.js because the Tripo clumps have more triangles)
const MEADOW = { flower3: ['flowers/tulip', { h: 0.55 }], flower4: ['flowers/daisy', { h: 0.5 }], clover: ['ground_cover/clover', { h: 0.28 }], fern: ['ground_cover/fern', { h: 0.7 }] };
S4C.meadow = function meadow(key) {
  const m = S4C.ready && MEADOW[key]; if (!m) return null;
  cnt('meadow:' + key);
  const g = new THREE.Group();
  for (const p of tr2.parts(m[0], m[1])) g.add(new THREE.Mesh(p.geometry, p.material));
  return { scene: g };
};
S4C.meadowScale = { flower3: 0.65, flower4: 0.6, clover: 0.15, fern: 0.24 };       // × the old counts (tris budget, see report_TR2_S4c.md)

export default S4C;
