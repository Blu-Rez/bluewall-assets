// TR2-S3 — the castle from the Tripo library: wall pieces, towers, gatehouses and the keep, in the 9 material tiers of tiers.js.
//
// castle.js does NOT draw these pieces when ctx.tr2c exists: while it builds it REGISTERS them here (same battle targets, same weapon sites, same tap boxes, same torches / banners as
// before — so noRoute, destruct, nav and the ring rows of a1_rings.js are untouched).  Registering costs nothing; the geometry is baked when the level is known and again whenever the
// LOOK changes (a tier boundary or the half / half zone) — one Batcher (util.js), one merged mesh per texture (≈ 3 per tier, 6 in a half / half zone, + the keep), every vertex carries
// `aB` = the id of the battle target it belongs to (so a1_rings.js can hide a ring and destruct.js can crumble it exactly like the procedural pieces).
// LOD: every cell is baked twice, with the full model and with `<name>_lo` (the same vertices, ~ 40 % of the triangles, geometry only: the UVs are the full model's, so the lo pieces use the
// full model's material — no second texture).  lod(camera) shows the full cells within 80 m of the camera and the lo cells beyond 100 m (the strategic camera is always far).
// Only the rings that STAND at the level are baked (a1_rings.js tells which; in a battle all three), and the baked pieces are cut into cells, one mesh per cell and texture (the core + the 4 quadrants of the town ring): what the
// camera does not see is not drawn (a ring-wide mesh is never out of view from inside the ring) and what the level does not show costs nothing.
// Without ctx.tr2c (models missing / failed to load / the dev switch window.__tr2Off) castle.js builds the old procedural castle: nothing here is needed to start the game.
//
//   const T3 = createCastleTr2();  await T3.preload(wallLevel, keepLevel);  ctx.tr2c = T3;           (world.js, before buildCastle)
//   T3.wall / T3.tower / T3.gate / T3.keep                                                           (castle.js while it builds: register a piece)
//   T3.install({ scene, rings, onMeshes });  T3.refresh()                                            (world.js: after the ring tracker; on every level change)
//
// Fits (numbers measured in TR2_swap.md §1 + S3 probes):
//   wall   slot length = H / 0.68 (a run is cut into round(len / slot) equal pieces, ≤ 0.12 m overlap); the WALK-WAY floor of every tier is put at the old wall height H (archers and
//          the towers' relation unchanged) by one y scale per tier (`fl` = walk-way height / model height, swap.json); thickness 0.72 T clamped to ±(0.75..1.5) of the natural
//   tower  castle_tower_medium (flat crenellated top: the war machine / spire / mage stands on it): platform floor = the old weapon height h + 0.8 in every tier (`fl`), width 2R + 0.6
//          (inner ring: 9.4 m, platform capped at 18.3 m so the model is never stretched by more than 1.28); the door faces the inside of the ring
//   gate   castle_gate_<tier>: length = the old gate target width (outer 26 m, town 24 m), uniform scale (depth ≈ the target's d)
//   keep   castle_keep_stone_2 (D7: one look at every level), front (door) along the old keep's local +z, 27 m wide
import * as THREE from 'three';
import { mat4 } from './util.js';
import { REACH } from './reach.js';                                  // RP1C: the hero mode's castle LOD radius (neutral = 0)
import { tr2, TBatcher } from './tr2lib.js';
import { TIER_KEYS, pieceTier, singleTier, tiersNeeded, tierState, fromInternal20 } from './tiers.js';
import { levelOf } from './skin.js';
import { patchDestruct } from './destruct.js';

export const FAM = { wall: 'castle_wall', tower: 'castle_tower_medium', gate: 'castle_gate' };
export const KEEP_KEY = 'castle_keep_stone_2';
export const WALL_SLOT = 0.68;           // slot length = H / WALL_SLOT   (TR2_swap.md §1: outer 14.0 m, inner 23.5 m, town 12.1 m)
export const T_VIS = 0.72;               // visual wall thickness = T_VIS * T (the target keeps T)
export const SINK = 0.4;                 // pieces stand 0.4 m in the ground (no gap on a slope), every height below is measured from the ground
export const KEEP_W = 27;                // keep width (m), the model's longest side: the widest that clears the inner WALL (0.4 m); its north-west corner touches the foot of inner tower 4 by ~1.3 m (the old keep did too)
export const GATE_PLAQUE = { y: 0.62, w: 0.24, h: 0.15 };      // plaque over the gate door (fractions of the model's height / length)
export const GATE_SCONCE = { dx: 0.19, y: 0.30 };            // wall torches either side of the door (fraction of length / height)
export const KEEP_DOME = 0.93;                                // the keep's dome apex (fraction of its height): the beacon
export const INNER_TOWER_W = 9.4, MAX_STRETCH = 1.28, MED_NAT = 1.518;   // the medium tower's natural platform height = 1.518 * its width
// TR2-S3-R2: the stairs up to the wall-walk.  There is NO stairs model in lib-tripo yet: this is the spec the model will be made to (TR2_gaps_S3.md) and what anchors('stairs') hands the wiring.
// One straight flight, 'castle_stairs_<tier>' (stone first): the front (the foot, where one steps on) is +Z, the flight climbs towards -Z and ends in a flat landing at the wall-walk floor.
// The model's base centre (bbox) is the pivot like every library model; its real size in the game is rise x run x width below; the game scales it in y only (rise = the ring's wall height H).
export const STAIRS = { key: 'castle_stairs', rise: 9.0, riser: 0.22, tread: 0.30, run: 12.3, width: 2.0, landing: 2.0, gap: 0.3, rings: ['outer', 'town'] };   // 41 steps x 0.30 m = 12.3 m; the inner ring (H 16 m) has no room for a flight (the keep clears its wall by 0.4 m)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const _v = new THREE.Vector3();
export const tvis = (T) => T_VIS * T;
export const fileOf = (fam, t) => FAM[fam] + '_' + TIER_KEYS[t];
export const loOf = (name) => name + '_lo';
export const LOD_NEAR = 80, LOD_FAR = 100;               // metres from the camera to the nearest piece of the cell: full model inside NEAR, lo model beyond FAR (hysteresis between)
// metres from the camera to the nearest piece of a cell (pts = x, z, x, z ...; a piece is ~ 10 m high and ~ 12 m wide)
export function cellDist(pts, cam) {
  let m = 1e18; const cy = Math.max(0, cam.y - 10) ** 2;
  for (let i = 0; i < pts.length; i += 2) { const dx = pts[i] - cam.x, dz = pts[i + 1] - cam.z, d = dx * dx + dz * dz; if (d < m) m = d; }
  return Math.max(0, Math.sqrt(m + cy) - 12);
}
export const lodPick = (d, cur, n = REACH.lod || LOD_NEAR) => (cur === 'lo' ? (d < n ? 'hi' : 'lo') : (d > n + LOD_FAR - LOD_NEAR ? 'lo' : 'hi'));   // RP1C: hero mode (REACH.lod = 50) shows the full model within 50 m, not 80; REACH.lod 0 = unchanged
export const towerWidth = (ring, R) => (ring === 'inner' ? INNER_TOWER_W : 2 * R + 0.6);
// platform floor of a tower: the old weapon height, capped so the model is not stretched by more than MAX_STRETCH
export const towerPlatform = (ring, R, h) => Math.min(h + 0.8, MAX_STRETCH * MED_NAT * towerWidth(ring, R));
export const tierSig = (level) => { const s = tierState(level); return s.lo + '.' + s.hi; };    // what the castle looks like at this level (lo / hi tier of the half zone): a rebuild is needed only when it changes

// which tier files a pair of levels needs (wall level: outer + town rings + gates, keep level: the inner ring)
export function neededFiles(lw, lk) {
  const now = new Set(), soon = new Set();
  const add = (set, tiers, fams) => { for (const t of tiers) for (const f of fams) set.add(fileOf(f, t)); };
  const w = tiersNeeded(lw), k = tiersNeeded(lk);
  add(now, w.now, ['wall', 'tower', 'gate']); add(soon, w.soon, ['wall', 'tower', 'gate']);
  add(now, k.now, ['wall', 'tower']); add(soon, k.soon, ['wall', 'tower']);
  for (const set of [now, soon]) for (const n of [...set]) set.add(loOf(n));
  return { now: [...now], soon: [...soon].filter((n) => !now.has(n)) };
}

export function createCastleTr2() {
  const walls = [], towers = [], gates = [], slot = {};
  let keep = null;
  const S = { cells: [], cam: null, force: null, trisLo: 0, scene: null, group: null, rings: null, onMeshes: null, installed: false, sig: '', loading: null, failed: new Set(), held: new Set(), patched: new WeakSet(), builds: 0, tris: 0, meshes: 0, last: null };
  const lvOf = (ent) => fromInternal20(levelOf(ent));
  S.lv0 = null;                                           // the level the world is built at (preload): the level system is not set yet while castle.js registers pieces

  // ---------------------------------------------------------------- registering (castle.js)
  function wall({ ring, tid, ax, az, bx, bz, H, T }) {
    const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / (H / WALL_SLOT)));
    const s0 = slot[ring] || 0; slot[ring] = s0 + n;
    walls.push({ ring, tid, ax, az, ux: (bx - ax) / len, uz: (bz - az) / len, len, n, H, T, slot0: s0, ry: Math.atan2(-(bz - az), bx - ax) });
    return n;
  }
  // returns the platform height (the weapon / torch / pole stand there)
  function tower({ ring, tid, i, x, z, R, h, face }) {
    const P = towerPlatform(ring, R, h);
    towers.push({ ring, tid, i, x, z, R, P, W: towerWidth(ring, R), face });
    return P;
  }
  // a gatehouse: length L along the wall, front (+Z of the model, both faces alike) along the outward normal (nx, nz); returns where the plaque / sconces go (see gateGeom)
  function gate({ ring, tid, x, z, nx, nz, L }) { gates.push({ ring, tid, x, z, L, ry: Math.atan2(nx, nz) }); return gateGeom(ring, L); }
  function keepPiece({ tid, x, z, rot }) { keep = { tid, x, z, rot }; return keepGeom(); }
  // numbers the castle code needs to hang things on the new facades (fractions measured on the stone models, TR2_swap.md; the tiers differ by < 3 %)
  function gateGeom(ring, L) {
    const spec = fileOf('gate', singleTier(S.lv0 ? S.lv0.lw : lvOf('wall'))), inf = tr2.info(spec), s = L / inf.size[0];
    return { s, h: inf.size[1] * s, d: inf.size[2] * s, front: inf.size[2] * s / 2, plaqueY: GATE_PLAQUE.y * inf.size[1] * s, plaqueW: GATE_PLAQUE.w * L, plaqueH: GATE_PLAQUE.h * inf.size[1] * s, sconceDx: GATE_SCONCE.dx * L, sconceY: GATE_SCONCE.y * inf.size[1] * s };
  }
  function keepGeom() {
    const inf = tr2.info(KEEP_KEY), s = KEEP_W / inf.size[0];
    return { s, w: inf.size[0] * s, h: inf.size[1] * s, d: inf.size[2] * s, front: inf.size[2] * s / 2, domeY: KEEP_DOME * inf.size[1] * s };
  }

  // ---------------------------------------------------------------- fitting
  const rec = (spec) => tr2.rec(spec) || {};
  function fitWall(spec, H, T, len) {
    const inf = tr2.info(spec), fl = rec(spec).fl || 0.85;
    const sy = (H + SINK) / (fl * inf.size[1]);
    return [len / inf.size[0], sy, clamp(tvis(T) / inf.size[2], 0.75 * sy, 1.5 * sy)];
  }
  function fitTower(spec, P, W) {
    const inf = tr2.info(spec), fl = rec(spec).fl || 0.88;
    return [W / ((inf.size[0] + inf.size[2]) / 2), (P + SINK) / (fl * inf.size[1])];
  }

  // ---------------------------------------------------------------- baking
  // cells: the castle core (keep, inner + outer ring, main gate) is one, the town ring is cut into its four quadrants (a ring-wide mesh is never out of view from inside the ring; more cells = more draw calls)
  const cellKey = (ring, x, z) => (ring === 'town' ? 't' + (x < 0 ? 'W' : 'E') + (z < 0 ? 'N' : 'S') : 'core');
  // the lo piece: the same placement, the lo geometry, the material of the full model (same texture)
  function bakeLo(B, specLo, specHi, matrix, bid) {
    const mat = tr2.parts(specHi)[0].material;
    for (const p of tr2.parts(specLo)) B.add(p.geometry, mat, matrix, { bid });
  }
  function bakeAll(lw, lk, rings) {
    const cells = new Map(), used = new Set(), cnt = { wall: 0, tower: 0, gate: 0, keep: 0 };
    const at = (ring, x, z) => {
      const k = cellKey(ring, x, z); let c = cells.get(k);
      if (!c) cells.set(k, c = { hi: new TBatcher(), lo: new TBatcher(), pts: [] });
      c.pts.push(x, z);                                         // the pieces' positions: the LOD distance is to the nearest piece, not to a box around a ring arc
      return c;
    };
    const put = (c, spec, matrix, bid) => { tr2.bake(c.hi, spec, matrix, { bid }); bakeLo(c.lo, loOf(spec), spec, matrix, bid); used.add(spec); used.add(loOf(spec)); };
    const lvl = (ring) => (ring === 'inner' ? lk : lw), on = (ring) => !rings || rings.includes(ring);
    for (const w of walls) {
      if (!on(w.ring)) continue;
      const pl = w.len / w.n;
      for (let j = 0; j < w.n; j++) {
        const spec = fileOf('wall', pieceTier(lvl(w.ring), w.slot0 + j)), [sx, sy, sz] = fitWall(spec, w.H, w.T, pl + 0.12), u = (j + 0.5) * pl, x = w.ax + w.ux * u, z = w.az + w.uz * u;
        put(at(w.ring, x, z), spec, mat4(x, -SINK, z, w.ry, sx, sy, sz), w.tid); cnt.wall++;
      }
    }
    for (const t of towers) {
      if (!on(t.ring)) continue;
      const spec = fileOf('tower', pieceTier(lvl(t.ring), t.i)), [sxz, sy] = fitTower(spec, t.P, t.W);
      put(at(t.ring, t.x, t.z), spec, mat4(t.x, -SINK, t.z, t.face || 0, sxz, sy, sxz), t.tid); cnt.tower++;
    }
    for (const g of gates) {
      if (!on(g.ring)) continue;
      const spec = fileOf('gate', singleTier(lvl(g.ring))), inf = tr2.info(spec), s = g.L / inf.size[0];
      put(at(g.ring, g.x, g.z), spec, mat4(g.x, -0.1, g.z, g.ry, s, s, s), g.tid); cnt.gate++;
    }
    if (keep) {
      const inf = tr2.info(KEEP_KEY), s = KEEP_W / inf.size[0];
      put(at('inner', keep.x, keep.z), KEEP_KEY, mat4(keep.x, -0.2, keep.z, keep.rot, s, s, s), keep.tid); cnt.keep++;
    }
    return { cells, used, cnt };
  }

  // ---------------------------------------------------------------- the level hook
  function refresh(force = false) {
    if (!S.installed) return false;
    const lw = lvOf('wall'), lk = lvOf('keep'), need = neededFiles(lw, lk);
    const miss = need.now.filter((n) => !tr2.has(n) && !S.failed.has(n));
    if (miss.length) { startLoad(miss); return false; }
    if (need.now.some((n) => S.failed.has(n))) return false;                       // a tier that cannot load: leave the castle as it is
    const rings = ringsNow(), sig = tierSig(lw) + '|' + tierSig(lk) + '|' + (rings ? rings.join('') : '*');
    if (!force && sig === S.sig) { loadSoon(need.soon); return false; }
    rebuild(lw, lk, need, sig, rings); loadSoon(need.soon);
    return true;
  }
  function startLoad(names) {
    if (S.loading) return;
    S.loading = tr2.load(names).then((out) => { for (const n of names) if (!out[n]) S.failed.add(n); }).catch((e) => { console.warn('castle_tr2 load', e); for (const n of names) S.failed.add(n); }).then(() => { S.loading = null; refresh(); });
  }
  function loadSoon(names) {
    const todo = names.filter((n) => !tr2.has(n) && !S.failed.has(n));
    if (!todo.length || S.soonBusy) return;
    S.soonBusy = true;
    const go = () => tr2.load(todo).catch(() => {}).then(() => { S.soonBusy = false; });
    if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 4000 }); else setTimeout(go, 100);
  }
  const ringsNow = () => (S.rings && S.rings.visible ? S.rings.visible() : null);          // the rings that stand now (a1_rings.js: by the wall's level, all of them in a battle)
  function rebuild(lw, lk, need, sig, rings) {
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    const { cells, used, cnt } = bakeAll(lw, lk, rings);
    const old = S.group.children.slice();
    const meshes = [], recs = [];
    for (const [key, c] of cells) {
      const r = { key, pts: c.pts, state: S.cam ? lodPick(cellDist(c.pts, S.cam), 'hi') : 'hi', hi: c.hi.build(S.group, { name: 'static-tr2' }), lo: c.lo.build(S.group, { name: 'static-tr2' }) };
      for (const m of r.hi) m.userData.tr2lod = 'hi'; for (const m of r.lo) m.userData.tr2lod = 'lo';
      for (const m of r.hi) m.visible = r.state === 'hi'; for (const m of r.lo) m.visible = r.state === 'lo';
      meshes.push(...r.hi, ...r.lo); recs.push(r);
    }
    S.cells = recs;
    for (const m of meshes) if (!S.patched.has(m.material)) { patchDestruct(m.material); S.patched.add(m.material); }
    for (const m of old) { S.group.remove(m); if (m.geometry) m.geometry.dispose(); }
    if (S.rings && S.rings.rescan) S.rings.rescan(meshes, old);
    if (S.onMeshes) S.onMeshes(meshes);
    // free what is no longer needed: the tiers outside (now + soon)
    const keepSet = new Set([...need.now, ...need.soon, KEEP_KEY, loOf(KEEP_KEY)]);
    const gone = [...S.held].filter((n) => !keepSet.has(n) && !used.has(n));
    for (const n of used) S.held.add(n);
    if (gone.length) { tr2.drop(gone); for (const n of gone) S.held.delete(n); }
    let tris = 0, trisLo = 0; for (const m of meshes) { const n = (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; if (m.userData.tr2lod === 'lo') trisLo += n; else tris += n; }
    S.sig = sig; S.builds++; S.tris = Math.round(tris); S.trisLo = Math.round(trisLo); S.meshes = meshes.length;
    S.last = { lw, lk, sig, rings, cells: cells.size, files: [...used].sort(), counts: cnt, tris: S.tris, trisLo: S.trisLo, meshes: meshes.length, ms: typeof performance !== 'undefined' ? +(performance.now() - t0).toFixed(1) : 0, dropped: gone };
  }

  // ---------------------------------------------------------------- level of detail (world.js update, every 0.25 s)
  function lod(camera) {
    if (camera) S.cam = camera.position.clone();
    if (!S.cam || !S.cells.length) return 0;
    const force = S.force || (typeof window !== 'undefined' && window.__tr2Lod) || null;
    let sw = 0;
    for (const c of S.cells) {
      const want = force === 'hi' || force === 'lo' ? force : lodPick(cellDist(c.pts, S.cam), c.state);
      if (want === c.state) continue;
      c.state = want; sw++;
      for (const m of c.hi) m.visible = want === 'hi';
      for (const m of c.lo) m.visible = want === 'lo';
    }
    return sw;
  }

  // ---------------------------------------------------------------- lifecycle
  async function preload(lw, lk = lw) {
    S.lv0 = { lw, lk };
    await tr2.init();
    const need = neededFiles(lw, lk), names = [...need.now, KEEP_KEY, loOf(KEEP_KEY)];
    const out = await tr2.load(names);
    const bad = names.filter((n) => !out[n]);
    if (bad.length) throw new Error('castle_tr2: cannot load ' + bad.join(', '));
    for (const n of names) S.held.add(n);
    return names;
  }
  function install({ scene, rings = null, onMeshes = null }) {
    S.scene = scene; S.rings = rings; S.onMeshes = onMeshes;
    if (rings && rings.onChange) rings.onChange(() => refresh());
    S.group = new THREE.Group(); S.group.name = 'castle-tr2'; scene.add(S.group);
    S.installed = true;
    return refresh(true);
  }
  const state = () => ({ installed: S.installed, sig: S.sig, builds: S.builds, tris: S.tris, trisLo: S.trisLo, meshes: S.meshes, lod: S.cells.map((c) => c.key + ':' + c.state), held: [...S.held].sort(), failed: [...S.failed], last: S.last, pieces: { walls: walls.reduce((a, w) => a + w.n, 0), towers: towers.length, gates: gates.length, keep: keep ? 1 : 0 } });
  // ---------------------------------------------------------------- stairs to the wall-walk (spec: STAIRS above; the model does not exist yet, so nothing is drawn here)
  // One flight at an END of a wall run (= beside a tower or a gate), on the INNER face of the wall, running along the wall away from the joint; its top landing meets the wall-walk through
  // the inner parapet.  opts: rings (default STAIRS.rings), ends 'both' | 'a' | 'b', spacing (m, greedy: keep a site only if no kept site of its ring is nearer than that; 0 = all).
  // Returns [{ id, ring, at: 'tower' | 'gate' | 'wall', tid (wall run), joint: tower / gate tid, model, key, centre: {x, z} (where the model's base centre goes), ry (yaw of the model's +Z = the foot end, radians),
  //   foot: {x, z} (front edge of the lowest step), top: {x, z} (centre of the top landing), join: {x, z} (the wall-walk point the landing meets: on the wall's centre line), dir: {x, z} (unit, top -> foot),
  //   inward: {x, z} (unit, towards the ring centre), rise (= the ring's wall height H above the ground at the wall), scale: {x: 1, y, z: 1}, width, run, rect: {cx, cz, w, d, ry} (keep-out footprint) }]
  function stairsAt({ rings = STAIRS.rings, ends = 'both', spacing = 0 } = {}) {
    const out = [], P = STAIRS, runs = walls.filter((w) => rings.includes(w.ring));
    for (const ring of rings) {
      const rw = runs.filter((w) => w.ring === ring); if (!rw.length) continue;
      let cx = 0, cz = 0; for (const w of rw) { cx += w.ax + w.ux * w.len / 2; cz += w.az + w.uz * w.len / 2; } cx /= rw.length; cz /= rw.length;
      const sites = [];
      for (const w of rw) {
        let used = 0;                                                                              // along-wall length already taken by the flight from the other end of this run
        for (const e of ends === 'a' ? ['a'] : ends === 'b' ? ['b'] : ['a', 'b']) {
          const sg = e === 'a' ? 1 : -1, ex = e === 'a' ? w.ax : w.ax + w.ux * w.len, ez = e === 'a' ? w.az : w.az + w.uz * w.len, dx = w.ux * sg, dz = w.uz * sg;
          let at = 'wall', jt = null, jc = 0.5;                                                  // jc = how far along the wall the landing starts (clear of the tower / gate body)
          // castle.js starts a run 0.6 R from the tower CENTRE (the polygon corner), so the run end is not at the tower centre: look for a tower whose body (W x W) reaches the end
          const tw = towers.find((t) => t.ring === ring && Math.hypot(t.x - ex, t.z - ez) < t.W / 2 + 1.5);
          const gt = gates.find((g) => g.ring === ring && Math.hypot(g.x - ex, g.z - ez) < g.L / 2 + 1.5);
          let nx = -dz, nz = dx; if (nx * (cx - ex) + nz * (cz - ez) < 0) { nx = -nx; nz = -nz; }  // inward = the perpendicular that points to the ring centre
          const off = tvis(w.T) / 2 + P.gap + P.width / 2, half = (P.landing + P.run) / 2;
          if (tw) {                                                                                  // jc = the first start (m along the wall from the run end) where the flight rectangle is >= gap clear of the tower's W x W footprint
            at = 'tower'; jt = tw.tid; jc = 0.5;
            const tax = [[Math.sin(tw.face), Math.cos(tw.face)], [Math.cos(tw.face), -Math.sin(tw.face)]], fax = [[dx, dz], [nx, nz]];
            const sep = (j) => {                                                                     // separating-axis gap between the flight rectangle (starting j m along) and the tower square (>0 = clear by that much)
              const c1 = [ex + dx * (j + half) + nx * off, ez + dz * (j + half) + nz * off], h1 = [half, P.width / 2], h2 = [tw.W / 2, tw.W / 2]; let best = -1e9;
              for (const a of [...fax, ...tax]) { const d = Math.abs((tw.x - c1[0]) * a[0] + (tw.z - c1[1]) * a[1]), r = (ax, h) => h[0] * Math.abs(a[0] * ax[0][0] + a[1] * ax[0][1]) + h[1] * Math.abs(a[0] * ax[1][0] + a[1] * ax[1][1]); best = Math.max(best, d - r(fax, h1) - r(tax, h2)); }
              return best;
            };
            while (jc < tw.W + 6 && sep(jc) < P.gap) jc += 0.1;
            jc = +jc.toFixed(1);
          } else if (gt) { at = 'gate'; jt = gt.tid; jc = Math.max(0.5, gt.L / 2 - Math.hypot(gt.x - ex, gt.z - ez)) + P.gap; }
          const need = jc + P.landing + P.run; if (need + used > w.len - 0.5) continue;           // the run is too short for a flight (or for two)
          if (P.riser * w.H / P.rise > 0.25 || P.riser * w.H / P.rise < 0.19) continue;           // the y-scaled steps would be too steep / too flat (the inner ring, H 16 m, needs its own model)
          used = need;
          const alongC = jc + half, alongTop = jc + P.landing / 2, alongFoot = jc + P.landing + P.run;
          const pt = (a, l) => ({ x: +(ex + dx * a + nx * l).toFixed(3), z: +(ez + dz * a + nz * l).toFixed(3) });
          sites.push({ id: ring + ':' + w.tid + e, ring, at, tid: w.tid, joint: jt, model: P.key, key: P.key + '_<tier>', centre: pt(alongC, off), ry: +Math.atan2(dx, dz).toFixed(5), foot: pt(alongFoot, off), top: pt(alongTop, off), join: pt(alongTop, 0),
            dir: { x: +dx.toFixed(5), z: +dz.toFixed(5) }, inward: { x: +nx.toFixed(5), z: +nz.toFixed(5) }, rise: w.H, scale: { x: 1, y: +(w.H / P.rise).toFixed(4), z: 1 }, width: P.width, run: P.run, rect: { cx: pt(alongC, off).x, cz: pt(alongC, off).z, w: P.width, d: P.landing + P.run, ry: +Math.atan2(dx, dz).toFixed(5) }, ang: Math.atan2(ez - cz, ex - cx) });
        }
      }
      sites.sort((a, b) => a.ang - b.ang);
      const kept = [];
      for (const s of sites) if (!spacing || kept.every((k) => Math.hypot(k.centre.x - s.centre.x, k.centre.z - s.centre.z) >= spacing)) kept.push(s);
      for (const s of kept) { delete s.ang; out.push(s); }
    }
    return out;
  }
  // where things can be hung on the castle (S4c lamps / banners, later work): the registered pieces with the heights the weapons / torches use.  y = platform floor of a tower, wall walk of a wall piece.
  // anchors('stairs', opts) = the stair sites (stairsAt above).
  const anchors = (kind, opts) => kind === 'stairs' ? stairsAt(opts) : ({
    towers: towers.map((t) => ({ ring: t.ring, tid: t.tid, i: t.i, x: t.x, z: t.z, y: t.P, face: t.face, w: t.W })),
    walls: walls.map((w) => ({ ring: w.ring, tid: w.tid, x: w.ax + w.ux * w.len / 2, z: w.az + w.uz * w.len / 2, y: w.H, ry: w.ry, len: w.len, thick: tvis(w.T) })),
    gates: gates.map((g) => ({ ring: g.ring, tid: g.tid, x: g.x, z: g.z, ry: g.ry, L: g.L, ...gateGeom(g.ring, g.L) })),
    keep: keep ? { ...keep, ...keepGeom() } : null,
  });
  return { wall, tower, gate, keep: keepPiece, anchors, lod, preload, install, refresh, state, tvis, towers, walls, gates, gateGeom, keepGeom, get keepRec() { return keep; }, get group() { return S.group; } };
}
