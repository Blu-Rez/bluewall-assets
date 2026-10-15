// town_build.js — p41 (THREE side): the lots of B1's town plan become houses and civic buildings.
//   registerTownTargets(ctx, level)   one destructible battle target per ~26 m block of lots (the same rule the old town used) and one per chapel; returns Map(lot id -> target id).
//                                     Must run in the loading phase, before initDestruct() reads ctx.targets (world.js).
//   createPlannedTown({...})          { rebuild(), tick(), lod(camera, t), idle } — homes (B2, kit_homes.glb) baked in chunks of <= 40 per call, civic lots (B3, kit_civic.glb) in ONE bake call.
//                                     rebuild() is cheap to call: it only does work when the castle level changed what stands (a lot unlocked, a house tier 1 / 6 / 12 / 18 / 24 / 30).
//                                     New meshes are made next to the old ones (hidden) and swapped in when the last chunk is done, so the town never shows half a rebuild.
import * as THREE from 'three';
import { bakePieces, bakeTr2 } from './village.js';
import { isVillageHome, villageHomeLot, HOME_KINDS, homePieces, homeSmoke, homeTier, homeTr2, homeTr2Files, homeTr2LoFiles, genericTr2, genericTr2Files, lotTint, footOf, groundOf as groundFoot, loPiece, townCellKey, townCellDist, townLodPick } from './b2_homes.js';
import { setCivicTr2, civicTr2Files } from './b3_civic.js';
import { tr2 } from './tr2lib.js';
import { buildAtlas, specOf, fileOfSpec } from './tr2atlas.js';
import { homeLots, civicLots, civicBuild, toWorld, townTargetSpecs, prodLots } from './town_plan.js';
import { townGround } from './town_ground.js';
import { genKeep, centreOf, STORE_FP } from './layout_rules.js';           // TR2-S5
import { planStores } from './stores.js';                               // TR2-S5: a moved storehouse also clears the generic fill houses under it
import * as LS from './layout_store.js';                                // TR2-S5: the player's moved lots
import { initDestruct } from './destruct.js';

// TR2-S4a: the town is built from the Tripo models (web/assets/tr2/).  Their pieces are packed into two texture atlases (houses + yard props / civic buildings + props) => ONE material each, so a chunk of 40 houses is ONE
// draw call.  The kit path (kit_homes / kit_civic) stays as the fallback: when the models cannot be loaded the old town is built unchanged.
//
// TR2-S4a-R2 — level of detail.  Every house body has a `_lo` copy (~ 40 % of the triangles, the same atlas tile).  The houses (the planned homes, the generic fill houses of town.js and the hamlets) are cut into cells
// (b2_homes.js townCellKey: 100 m grid, a hamlet = a cell).  What the player sees:
//   far mode   (every cell is farther than ~ 100 m from the camera — the strategic view)  ONE mesh with the lo bodies of the whole town: one draw call, ~ 40 % of the triangles, no yard props.
//   mixed mode (the camera is within ~ 80 m of a cell — the hero view, the closest zoom)  a cell near the camera shows its full bodies + yard props, the other cells their lo bodies (one call per visible cell).
// The far mesh is baked with the town; the cell meshes are baked ON DEMAND (one cell per tick, the far mesh stays on screen until everything the mixed mode needs is there), so a session that never gets close pays for
// the far mesh only.  Every vertex carries `aB` (its block's battle target) in all three meshes — the battle collapses them the same way.
setCivicTr2(true);                                                // civicPieces / civicSolids return the Tripo footprints (b3_civic.js) — nav and the visuals agree
let WARM = null;
export function warmTown() {                                      // fetch + parse the models and build the atlases once (world.js calls this during the loading screen, createPlannedTown awaits it)
  return WARM || (WARM = (async () => {
    if (typeof window !== 'undefined' && window.__tr2TownOff) throw new Error('town models off (dev switch window.__tr2TownOff: the old kit town is built)');   // dev only (budget comparison with the pre-S4a town)
    await tr2.init();
    const homeNames = [...homeTr2Files(), ...genericTr2Files().map((k) => k + '|w7.5')], civicNames = civicTr2Files();
    const files = [...new Set([...homeNames, ...civicNames].map((n) => fileOfSpec(specOf(n).spec)))];
    await tr2.load(files);
    const bad = files.filter((f) => !tr2.has(f)); if (bad.length) throw new Error('tr2 town: not loaded: ' + bad.join(','));
    const loNames = homeTr2LoFiles(); try { await tr2.load(loNames); } catch (e) { console.warn('tr2 town: lo copies not loaded (full detail everywhere)', e); }                       // (the lo copies are optional: without them the houses are drawn at full detail everywhere, as before R2)
    const lo = loNames.every((f) => tr2.has(f));
    return { homes: buildAtlas(tr2, homeNames, { name: 'homes', width: 2112 }), civic: buildAtlas(tr2, civicNames, { name: 'civic', width: 2112 }), files, lo };
  })().catch((e) => { WARM = null; throw e; }));
}

const CHUNK = 40, UP = new THREE.Vector3(0, 1, 0);
// TR2_H step 1 (the "broken generic house"): in the hero mode rpg/cull.js (townCollect / townTick) cuts every big mesh under `planned-town` into `…#cell` proxies and shows each by DISTANCE only; the town LOD
// (far / lo / hi, below) hides its meshes by `visible`, which the proxies ignore => the far (lo) bodies stayed drawn over the hi bodies (z-fighting = shards).  `userData.rpProxy` is cull.js's own "already a proxy, leave it"
// mark (townCollect skips such a mesh), so the LOD meshes keep a single owner.  ?tr2cull=0 = the old behaviour (before frames).  (cull.js itself is not ours: the report suggests the 2-line fix there.)
const CULL_MARK = !(typeof location !== 'undefined' && /[?&]tr2cull=0\b/.test(location.search));
const H_OFF = typeof location !== 'undefined' && /[?&]tr2h=0\b/.test(location.search);                     // TR2_H dev: ?tr2h=0 = the town without H1 (tint), H2/H3 (ground line), H6 (smoke range) — before / after frames
const FWD = new THREE.Vector3(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), M4 = () => new THREE.Matrix4();
const place = (x, y, z, ry, s = 1) => M4().compose(P.set(x, y, z), Q.setFromAxisAngle(UP, ry), S.set(s, s, s));

export function registerTownTargets(ctx, level) {
  const tids = new Map(), slots = new Map();
  for (const { ids, key, t } of townTargetSpecs(level)) { const id = ctx.tgt(t); slots.set(key, id); for (const k of ids) tids.set(k, id); }
  ctx.B.bid(0);
  ctx.townSlots = slots; ctx.townTargetLevel = level;                          // TR2-S5: block key -> target id (retargetTown keeps the ids of the blocks that stay)
  return tids;
}
// TR2-S5: the player moved lots: the destructible blocks are made again from the lots' NEW places.  A block keeps its target id (its key = the 40 m cell / the chapel), so everything already baked
// into it (the worksites' pieces, the far mesh until it is rebaked) stays valid; a block whose last lot left is switched off (`off`: world.targets hides it from the battle), a new block takes
// a switched-off slot or appends one.  `tids` (lot id -> target id) is updated IN PLACE: createPlannedTown / wsbuild read it when they bake.  Returns { changed, added, off }.
export function retargetTown(ctx, height, tids) {
  if (!ctx.townSlots) return { changed: 0, added: 0, off: 0 };
  const specs = townTargetSpecs(ctx.townTargetLevel), seen = new Set(); let changed = 0, added = 0, off = 0;
  const free = () => ctx.targets.find((q) => q.off && q.type === 'house' && !seen.has(q.id));
  for (const { ids, key, t } of specs) {
    let id = ctx.townSlots.get(key), slot = id ? ctx.targets[id - 1] : null;
    if (!slot) { slot = t.type === 'house' ? free() : null; if (slot) { id = slot.id; } else { id = ctx.tgt(t); ctx.B.bid(0); slot = ctx.targets[id - 1]; added++; } ctx.townSlots.set(key, id); }
    const o = { x: slot.x, z: slot.z, w: slot.w, d: slot.d, h: slot.h, n: slot.n, share: slot.share };
    Object.assign(slot, t, { id }); delete slot.off; seen.add(id);
    if (['x', 'z', 'w', 'd', 'h', 'n', 'share'].some((k) => o[k] !== slot[k])) changed++;
    for (const k of ids) tids.set(k, id);
  }
  for (const [key, id] of [...ctx.townSlots]) if (!seen.has(id)) { const q = ctx.targets[id - 1]; if (q && !q.off) { q.off = true; off++; } ctx.townSlots.delete(key); }
  if (changed || added || off) initDestruct(ctx.targets, height);
  return { changed, added, off };
}

export function createPlannedTown({ scene, kitHomes, kitCivic, height, shadows, ctx, tids = new Map(), level, civicCap = 30, tr2: useTr2 = true, gen = [] }) {
  const st = { sig: null, group: null, staging: null, queue: [], lazy: [], smoke: [], pend: [], picked: new Set(), atlas: null, loading: null, fail: false,
    cells: [], far: null, mode: 'far', cam: null, lodT: -9, gen: 0, stats: { builds: 0, cellBakes: 0, farBakes: 0 } };
  // the ground a lot stands on: the lowest of its corners and middle (like the old houses: a plinth never floats), never below the water line
  const ground = (l) => { const c = Math.cos(l.ry), s = Math.sin(l.ry), hw = l.w / 2, hd = l.d / 2; let y = height(l.x, l.z); for (const [a, b] of [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]]) y = Math.min(y, height(l.x + a * c + b * s, l.z - a * s + b * c)); return Math.max(0.2, y); };
  const dispose = (g) => { if (!g) return; g.parent && g.parent.remove(g); g.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); };   // (the kit's materials are shared: never disposed)
  function pick(l) {                                                    // the tap boxes (main.js: house / church / market open their card)
    if (st.picked.has(l.id) || l.kind === 'well') return; st.picked.add(l.id);
    const top = l.kind === 'chapel' ? 40 : l.kind === 'market' ? 7 : HOME_KINDS[l.kind] ? 4 + HOME_KINDS[l.kind].floors * 3.2 : 12;
    ctx.pick({ x: l.x, z: l.z, y0: 0, y1: top, r: l.kind === 'market' ? 15 : Math.max(l.w, l.d) / 2 }, l.kind === 'chapel' ? 'church' : l.kind === 'market' ? 'market' : 'house', l.id);      // TR2-S5: + the lot id (the tap box moves with the lot)
  }
  function swap(group, smoke, cells, far) {
    const old = st.group; st.group = group; group.visible = true; dispose(old);
    for (const s of st.smoke) s.off = true; st.smoke = smoke; st.pend = [];
    st.cells = cells; st.far = far; st.mode = 'far'; st.gen++; st.lazy.length = 0;
    if (far) { for (const c of cells) c.want = 'lo'; lod(null, null, true); }
  }

  // ---------------------------------------------------------------- the houses: piece lists, cells, lod
  const groundOf = new Map(), gy = (l) => { let y = groundOf.get(l); if (y == null) groundOf.set(l, y = ground(l)); return y; };
  // lo: the body only (piece 0), as its `_lo` copy; hi: the body + the yard props.  `lv` = the level the town is built at.
  function pieceList(lot, lo, lv) {
    const y = gy(lot), bid = lot.tid != null ? lot.tid : (tids.get(lot.id) || 0), out = [];
    const pcs = lot.kind === 'generic' ? genericTr2(lot).pieces : homeTr2(lot.kind, lv, lot.seed).pieces;
    const tint = H_OFF ? null : lotTint(lot);                                           // TR2_H H1: the body only (the yard props keep their own colours)
    for (let i = 0; i < (lo ? 1 : pcs.length); i++) { const w = toWorld(lot, pcs[i]); out.push({ n: lo ? loPiece(w.n) : w.n, matrix: place(w.x, y, w.z, w.ry, w.s), bid, ...(i === 0 ? { tint } : null) }); }
    return out;
  }
  const bakeCell = (cell, which) => {                                    // one mesh (per material) of a cell, hidden until lod() shows it
    const list = []; for (const lot of cell.lots) for (const e of pieceList(lot, which === 'lo', cell.lv)) list.push(e);
    const r = bakeTr2(cell.group, st.atlas.homes, list, { shadows, tag: which === 'hi' ? 'homes-tr2' : 'homes-lo' });
    for (const m of r.meshes) { m.visible = false; m.userData.tr2lod = which; m.userData.tr2cell = cell.key; if (CULL_MARK) m.userData.rpProxy = 1; }     // TR2_H: see CULL_MARK
    cell[which] = r.meshes; st.stats.cellBakes++;
  };
  const queued = (cell, which) => st.lazy.some((j) => j.cell === cell && j.which === which);
  function need(cell, which) {                                           // ask for the meshes of a cell (baked later, one per tick)
    if (cell[which] || queued(cell, which)) return;
    const gen = st.gen; st.lazy.push({ cell, which, run: () => { if (gen === st.gen && !cell[which] && cell.group === st.group) bakeCell(cell, which); } });
  }
  const setVis = (ms, v) => { if (ms) for (const m of ms) if (m.visible !== v) m.visible = v; };
  // TR2_H H6: a chimney smokes only while it is within SMOKE_R of the camera (or of the ground point it looks at: the strategic view looks from far, at a street), at most SMOKE_MAX plumes at a time (the nearest).
  // The old rule was a global cap of 18 + 20 plumes spread over the whole town — most of them far from any eye.  `off` is the plume flag world.js reads (no emission, no cost).
  const SMOKE_R = 60, SMOKE_MAX = 16;
  function smokeRange() {
    const c = st.cam, sm = st.smoke; if (H_OFF || !c || !sm || !sm.length) return;
    const on = [];
    for (const s of sm) {
      const d = Math.min(Math.hypot(s.x - c.x, s.z - c.z, (s.y - c.y) * 0.35), c.fx == null ? 1e9 : Math.hypot(s.x - c.fx, s.z - c.fz));
      if (d < SMOKE_R) on.push([d, s]); else if (!s.off) s.off = true;
    }
    on.sort((a, b) => a[0] - b[0]);
    on.forEach(([, s], i) => { const off = i >= SMOKE_MAX; if (s.off !== off) s.off = off; });
  }
  // camera = THREE camera (or null: reuse the last), t = clock seconds (the call is throttled to 4 Hz), force = apply now
  function lod(camera, t, force) {
    if (camera) { if (t != null && !force && t - st.lodT < 0.25) return 0; if (t != null) st.lodT = t; const p = camera.position; st.cam = { x: p.x, y: p.y, z: p.z };
      const fy = camera.getWorldDirection ? camera.getWorldDirection(FWD).y : 0; if (fy < -0.05) { const k = Math.min(500, p.y / -fy); st.cam.fx = p.x + FWD.x * k; st.cam.fz = p.z + FWD.z * k; } }
    smokeRange();
    const cells = st.cells; if (!st.far || !cells.length) return 0;
    const dev = typeof window !== 'undefined' ? window.__tr2TownLod : null;        // dev switch: 'hi' | 'lo' forces every cell
    let sw = 0, allLo = true;
    for (const c of cells) {
      const want = dev === 'hi' || dev === 'lo' ? dev : st.cam ? townLodPick(townCellDist(c.pts, st.cam), c.want) : 'lo';
      if (want !== c.want) { c.want = want; sw++; }
      if (c.want === 'hi') allLo = false;
    }
    if (!allLo) for (const c of cells) need(c, c.want);                       // (a mixed view needs the other cells' lo meshes too, so no cell flips to the far mesh and back)
    if (!allLo && st.mode === 'far' && cells.every((c) => c[c.want])) st.mode = 'mixed';       // everything the mixed mode shows is baked: switch (until then the far mesh stays)
    if (allLo) st.mode = 'far';
    setVis(st.far, st.mode === 'far');
    for (const c of cells) {
      if (st.mode === 'far') { setVis(c.hi, false); setVis(c.lo, false); c.shown = null; continue; }
      if (c[c.want]) c.shown = c.want;                                         // (a cell whose new mesh is not baked yet keeps what it shows)
      setVis(c.hi, c.shown === 'hi'); setVis(c.lo, c.shown === 'lo');
    }
    return sw;
  }

  function rebuild() {
    if (useTr2 && !st.atlas && !st.fail) {                              // the Tripo models are still on their way: nothing is built (and nothing is queued) until they are here
      if (!st.loading) st.loading = warmTown().then((a) => { st.atlas = a; st.sig = null; rebuild(); }).catch((e) => { console.warn('tr2 town (fallback: the kit town)', e); st.fail = true; st.sig = null; rebuild(); });
      return false;
    }
    const T2 = !!st.atlas;
    const lv = level(), homes = homeLots(lv), civic = civicLots(lv).map((c) => ({ ...c, lv: Math.min(c.lv, civicCap) }));
    const sig = [homes.map((h) => h.id).join(','), homeTier(lv), civic.map((c) => c.id + ':' + c.lv).join(','), shadows ? 1 : 0, [...homes, ...civic, ...prodLots(lv)].map((l) => LS.ovr(l.id)).filter(Boolean).map((o) => o.join(',')).join(';'), planStores().filter((s) => s.moved).map((s) => s.id + ':' + s.x + ',' + s.z + ',' + s.ry).join(';')].join('|');      // TR2-S5: + the moved lots' and storehouses' places (a moved lot / store rebakes the town — the generic houses under it go)
    if (sig === st.sig) return false;
    st.sig = sig; st.queue.length = 0; st.lazy.length = 0; if (st.staging) { dispose(st.staging); st.staging = null; } for (const q of st.pend) q.off = true;          // (a rebuild still under way is dropped, with its smoke)
    const group = st.staging = new THREE.Group(); group.name = 'planned-town'; group.visible = !st.group; scene.add(group);       // the very first build stays under the hidden bucket until it is revealed
    const smoke = st.pend = [];
    let cells = [], far = null;
    if (T2 && civic.length) st.queue.push(() => {
      const list = [];
      for (const lot of civic) { const y = ground(lot), bid = tids.get(lot.id) || 0; for (const p of civicBuild(lot)) list.push({ n: p.n, matrix: place(p.x, y, p.z, p.ry, p.s), bid }); }
      bakeTr2(group, st.atlas.civic, list, { shadows, tag: 'civic-tr2' });
    });
    if (T2) {
      const G0 = gen.concat(ctx.tr2town ? (ctx.houses || []).filter(isVillageHome).map(villageHomeLot) : []);        // (+ the plain homes of buildings.js: plaza, farm, lake — bakeVillage skipped them)
      const sLots = planStores().filter((s) => s.moved).map((s) => { const [cx, cz] = centreOf(s.x, s.z, s.ry, STORE_FP); return { x: cx, z: cz, ry: s.ry, w: STORE_FP.w, d: STORE_FP.d }; }), movedLots = [...homes, ...civic, ...prodLots(lv)].filter((l) => LS.ovr(l.id)).concat(sLots), kp = genKeep(G0, movedLots), G = G0.filter((_, i) => kp[i]);      // TR2-S5: a generic fill house under a lot the player moved there is not drawn
      const lots = homes.concat(G.map((g, i) => ({ ...g, kind: 'generic', id: 'gen' + i, i })));                // the planned homes + the generic fill houses + the hamlet houses
      const byCell = new Map();
      for (const lot of lots) { const k = townCellKey(lot); let c = byCell.get(k); if (!c) byCell.set(k, c = { key: k, lots: [], pts: [], hi: null, lo: null, want: 'lo', shown: null, lv, group }); c.lots.push(lot); c.pts.push(lot.x, lot.z); }
      cells = [...byCell.values()];
      if (st.atlas.lo) {
        st.queue.push(() => {                                          // the far mesh: the lo bodies of every house, ONE call
          const list = []; for (const lot of lots) for (const e of pieceList(lot, true, lv)) list.push(e);
          const r = bakeTr2(group, st.atlas.homes, list, { shadows, tag: 'homes-far' });
          for (const m of r.meshes) { m.userData.tr2lod = 'far'; m.visible = true; if (CULL_MARK) m.userData.rpProxy = 1; }     // TR2_H: see CULL_MARK
          far = r.meshes; st.stats.farBakes++;
        });
      } else {                                                         // no lo copies: every cell at full detail, baked now (the S4a way: chunks of <= 40 houses)
        for (const c of cells) for (let i = 0; i < c.lots.length; i += CHUNK) {
          const part = { ...c, lots: c.lots.slice(i, i + CHUNK) }; st.queue.push(() => { const l = []; for (const lot of part.lots) for (const e of pieceList(lot, false, lv)) l.push(e); bakeTr2(group, st.atlas.homes, l, { shadows, tag: 'homes-tr2' }); });
        }
        cells = [];
      }
      st.queue.push(() => {                                            // TR2_H H2 + H3: contact shadow + stone footing under every house (town_ground.js: +2 draw calls)
        if (H_OFF) return;
        const feet = lots.map((lot) => { const v = lot.kind === 'generic' ? genericTr2(lot) : homeTr2(lot.kind, lv, lot.seed), p = v.pieces[0], w = toWorld(lot, p), [fw, fd] = footOf(v.variant, p.s), [gw, gd, ox, oz] = groundFoot(v.variant, p.s), cr = Math.cos(w.ry), sr = Math.sin(w.ry); return { x: w.x, z: w.z, ry: w.ry, w: fw, d: fd, y: gy(lot), gw, gd, gx: w.x + ox * cr + oz * sr, gz: w.z - ox * sr + oz * cr }; });
        townGround(group, feet, { height, M: ctx.M });
      });
      // chimney smoke from the model data (b2_homes.js HOUSE_SMOKE): every chimney of the planned homes and of the generic / hamlet houses gets a plume object (switched on only near the camera: smokeRange(), TR2_H H6)
      st.queue.push(() => {
        // every house whose MODEL has a chimney can smoke; when more than the cap qualify, an even stride over the list (not the first N) keeps the plumes spread over the town
        const spread = (list, cap) => (list.length <= cap ? list : list.filter((_, i) => Math.floor(i * cap / list.length) !== Math.floor((i - 1) * cap / list.length)).slice(0, cap));
        const plume = (lot, c) => { const w = toWorld(lot, { n: '', x: c.x, z: c.z, ry: 0, s: 1 }), s = ctx.smokeAt(w.x, gy(lot) + c.y, w.z); s.off = !H_OFF; smoke.push(s); };     // (switched on by smokeRange() when the camera is near)
        spread(homes.map((lot) => [lot, homeTr2(lot.kind, lv, lot.seed).smoke[0]]).filter((e) => e[1]), H_OFF ? 18 : 90).forEach(([lot, c]) => plume(lot, c));
        spread(G.map((g) => { const lot = { ...g, kind: 'generic' }; return [lot, genericTr2(lot).smoke[0]]; }).filter((e) => e[1]), H_OFF ? 20 : 90).forEach(([lot, c]) => plume(lot, c));
      });
    }
    if (!T2 && kitCivic && civic.length) st.queue.push(() => {
      const list = []; setCivicTr2(false);
      try { for (const lot of civic) { const y = ground(lot), bid = tids.get(lot.id) || 0; for (const p of civicBuild(lot)) list.push({ name: p.n, matrix: place(p.x, y, p.z, p.ry, p.s), bid }); } } finally { setCivicTr2(true); }
      bakePieces(group, kitCivic, list, { shadows, tag: 'civic' });
    });
    if (!T2 && kitHomes) for (let i = 0; i < homes.length; i += CHUNK) {
      const chunk = homes.slice(i, i + CHUNK);
      st.queue.push(() => {
        const list = [];
        for (const lot of chunk) {
          const y = ground(lot), bid = tids.get(lot.id) || 0;
          for (const p of homePieces(lot.kind, lv, lot.seed)) { const w = toWorld(lot, p); list.push({ name: p.n, matrix: place(w.x, y, w.z, w.ry, p.s), bid }); }
          if (lot.seed % 3 === 0 && smoke.length < 18) for (const c of homeSmoke(lot.kind, lv, lot.seed).slice(0, 1)) { const w = toWorld(lot, { n: '', x: c.x, z: c.z, ry: 0, s: 1 }); smoke.push(ctx.smokeAt(w.x, y + c.y, w.z)); }
        }
        bakePieces(group, kitHomes, list, { shadows, tag: 'homes' });
      });
    }
    st.queue.push(() => { st.staging = null; for (const l of [...homes, ...civic]) pick(l); st.stats.builds++; swap(group, smoke, cells, far); });
    return true;
  }
  const api = { rebuild, lod, tick() { const f = st.queue.shift(); if (f) { f(); return st.queue.length + st.lazy.length; } const j = st.lazy.shift(); if (j) { j.run(); lod(null, null, true); } return st.queue.length + st.lazy.length; }, get idle() { return st.queue.length === 0 && st.lazy.length === 0; }, get state() { return st; } };
  if (typeof window !== 'undefined') window.__tr2Town = api;                       // dev handle (QA frames / probes): state, lod
  return api;
}
