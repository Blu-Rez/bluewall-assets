// A1 — the wall rings by level (owner 6 Oct 2026, «تا لول ده، یک لایه / تا لول بیست دو لایه / تا لول سی، سه لایه»).
//
// castle.js builds ALL THREE rings once, into the same static batch as always (one mesh per material). This module remembers which structure ids, weapons, torch pools,
// lamps and tap boxes belong to which ring (createRingTracker, used by castle.js while it builds) and, whenever the wall's level changes, shows exactly the rings
// layout.ringsAt(level) names — WITHOUT a rebuild, a new shader, a new material or a draw call:
//   · batched stone / roofs / windows / cloth / plaque / kit tower roofs: every vertex carries `aB` = the id of the structure it belongs to (destruct.js already needs it), so the
//     vertices of an inactive ring are found once (a scan at install) and collapsed: static meshes to the point 0,0,0 (zero-area triangles are never drawn and cast no shadow),
//     the waving cloth (its shader places it from the attribute aPin, not from `position`) to 4 km under the ground.  Written back when the ring returns.  Only the changed
//     vertex ranges are uploaded (BufferAttribute.addUpdateRange).
//   · torch flames, weapons on the towers: the structure-id hide() / reset() they all have already (the same ones an attack uses)
//   · glow pools under the torches, the gate braziers' real lights (intensity only: the number of lights never changes, so no shader recompiles), tap boxes: small lists below
//   · archers + sentries: patrol.js setRings()
// Bridges over the moat are NOT part of a ring (castle.js closes the ring before it builds them): the roads and nav.js list them at every level.
import * as L from './layout.js';
import { levelOf } from './skin.js';
import { LEVEL_CAP } from './tiers.js';

export const RING_IDS = ['inner', 'outer', 'town'];
// half width of the opening in the wall at each ring's gate (castle.js builds the walls with these; the A1 test walks through them)
// the keep ring is the lowest of the three in layout.WALL (7.5 m, under the citadel wall's 9.5): from the home camera it hides behind the citadel wall and behind its own roofed towers, which is
// why the owner saw only two rows.  A concentric castle steps UP towards the keep, so castle.js / patrol.js build it from DIMS (A1; layout.WALL stays as it was, nothing else reads it).
// (a dev page may try another height before the world is built: window.__a1InnerH)
const _w = typeof window !== 'undefined' ? window : {};
export const INNER_H = +_w.__a1InnerH || 16;
export const DIMS = { outer: L.WALL.outer, inner: { ...L.WALL.inner, H: INNER_H }, town: L.WALL.town };
export const GATE_HALF = { outer: 7.5, inner: 4.5, town: 5.2 };
// the wall's level on the player-facing 1..30 scale (skin.js keeps it stretched to 1..20: to20 = 1 + (lv - 1) * 19 / (CAP - 1); CAP = tiers.js LEVEL_CAP, 30 today)
export const wallLevel = () => Math.round(1 + (levelOf('wall') - 1) * (LEVEL_CAP - 1) / 19);

export function createRingTracker(ctx) {
  const fx = ctx.fx || {};
  const R = {}; for (const id of RING_IDS) R[id] = { id, tids: [], sites: [], pools: [], lights: [], picks: [] };
  let open = null;
  const vis = {}, runs = [];                                  // vis[id]: true / false once applied; runs: the collapsible vertex ranges
  let weaponsOf = () => null, patrols = null, installed = false, battle = false, scene = null, coils = { up() {}, hide() {} };

  function begin(id) {
    if (open) throw new Error('a1_rings: ring ' + open.id + ' is still open');
    if (!R[id]) throw new Error('a1_rings: unknown ring ' + id);
    open = { id, t0: ctx.targets.length, w0: ctx.weaponSites.length, p0: fx.pools ? fx.pools.items.length : 0, l0: fx.lights ? fx.lights.length : 0, k0: fx.picks ? fx.picks.length : 0 };
  }
  function end() {
    const o = open; if (!o) return; open = null; const r = R[o.id];
    for (let i = o.t0; i < ctx.targets.length; i++) r.tids.push(ctx.targets[i].id);
    for (let i = o.w0; i < ctx.weaponSites.length; i++) { ctx.weaponSites[i].ring = o.id; r.sites.push(ctx.weaponSites[i]); }
    if (fx.pools && fx.pools.items.length > o.p0) r.pools.push([o.p0, fx.pools.items.length]);
    if (fx.lights) for (let i = o.l0; i < fx.lights.length; i++) r.lights.push(fx.lights[i]);
    if (fx.picks) for (let i = o.k0; i < fx.picks.length; i++) r.picks.push(fx.picks[i]);
  }

  // ---- find the vertices of every ring in every batched mesh that carries aB (once)
  function scan() {
    const ringOf = new Int8Array(ctx.targets.length + 2).fill(-1);
    RING_IDS.forEach((id, k) => { for (const t of R[id].tids) ringOf[t] = k; });
    scene.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.aB || !/^(static|troof|props|her-)/.test(o.name || '')) return;
      const g = o.geometry, ab = g.attributes.aB.array, cloth = o.name === 'her-cloth';
      const attr = cloth ? g.attributes.aPin : g.attributes.position;
      if (!attr || attr.isInterleavedBufferAttribute) { if (cloth || attr) console.warn('a1_rings: skipped', o.name); return; }
      const n = ab.length; let k0 = -1, a0 = 0;
      for (let i = 0; i <= n; i++) {
        const t = i < n ? ab[i] : 0, k = t > 0 && t < ringOf.length ? ringOf[t] : -1;
        if (k !== k0) { if (k0 >= 0) runs.push({ ring: RING_IDS[k0], attr, a: a0, b: i, drop: cloth, saved: null }); k0 = k; a0 = i; }
      }
    });
  }
  function setRun(run, show) {
    const arr = run.attr.array, S = run.attr.itemSize, o = run.a * S, len = (run.b - run.a) * S;
    if (!show) {
      if (!run.saved) run.saved = arr.slice(o, o + len);
      if (run.drop) for (let i = o + 1; i < o + len; i += S) arr[i] = -4000; else arr.fill(0, o, o + len);
    } else if (run.saved) arr.set(run.saved, o);
    else return;
    run.attr.addUpdateRange(o, len); run.attr.needsUpdate = true;
  }
  function setSmall(id, show) {
    const r = R[id];
    if (fx.pools && fx.pools.mesh) {
      const col = fx.pools.mesh.geometry.attributes.col;
      for (const [p0, p1] of r.pools) {
        const o = p0 * 12, len = (p1 - p0) * 12;                              // 4 vertices x 3 floats per pool
        if (!show) { if (!r.poolSaved) r.poolSaved = new Map(); if (!r.poolSaved.has(p0)) r.poolSaved.set(p0, col.array.slice(o, o + len)); col.array.fill(0, o, o + len); }
        else if (r.poolSaved && r.poolSaved.has(p0)) col.array.set(r.poolSaved.get(p0), o);
      }
      if (r.pools.length) col.needsUpdate = true;
    }
    for (const e of r.lights) { if (e.base0 == null) e.base0 = e.base; e.base = show ? e.base0 : 0; if (!show) e.l.intensity = 0; }
    if (fx.picks) for (const e of r.picks) { const i = fx.picks.indexOf(e); if (show && i < 0) fx.picks.push(e); else if (!show && i >= 0) fx.picks.splice(i, 1); }
  }

  // which rings stand: layout.ringsAt(the wall's level); in a battle the old picture (all three) stays until the battle base is reworked (bbase.js, a later package)
  function active() { return battle ? RING_IDS.filter((i) => ringExists(i)) : L.ringsAt(wallLevel()); }
  const ringExists = (id) => (id === 'inner' ? !!L.INNER : id === 'town' ? !!L.TOWN : true);
  function apply(force = false) {
    if (!installed) return;
    const want = new Set(active());
    let changed = !!force, revived = false;
    for (const id of RING_IDS) {
      const v = want.has(id) || !ringExists(id);
      if (vis[id] === v) continue;
      if (v && vis[id] === false) revived = true;
      vis[id] = v; changed = true;
      for (const run of runs) if (run.ring === id) setRun(run, v);
      setSmall(id, v);
    }
    if (!changed) return;
    const wp = weaponsOf(), fl = fx.flames;
    if (revived || force) { if (fl && fl.reset) fl.reset(); if (wp && wp.reset && revived) wp.reset(); coils.up(); }
    for (const id of RING_IDS) if (vis[id] === false) for (const tid of R[id].tids) { if (fl && fl.hide) fl.hide(tid); if (wp && wp.hide) wp.hide(tid); coils.hide(tid); }       // (a Tesla coil stands on a tower of the ring: it goes with it)
    if (patrols && patrols.setRings) patrols.setRings(new Set(RING_IDS.filter((i) => vis[i] !== false)));
  }

  function install(api) {                                   // world.js, once everything static is built and the level system exists
    scene = api.scene; weaponsOf = api.weapons || weaponsOf; patrols = api.patrols || null; coils = api.coils || coils; installed = true;
    scan(); apply(true);
  }
  return {
    begin, end, install, apply,
    setBattle(on) { battle = !!on; apply(true); },
    setPatrols(p) { patrols = p; apply(true); },
    setOrder(order) { L.RING_ORDER.splice(0, L.RING_ORDER.length, ...order); apply(true); },
    state: () => ({ level: wallLevel(), active: RING_IDS.filter((i) => vis[i] !== false), vis: { ...vis }, tids: Object.fromEntries(RING_IDS.map((i) => [i, R[i].tids.length])), sites: Object.fromEntries(RING_IDS.map((i) => [i, R[i].sites.length])), runs: runs.length, verts: runs.reduce((s, r) => s + r.b - r.a, 0) }),
    rings: R,
  };
}
