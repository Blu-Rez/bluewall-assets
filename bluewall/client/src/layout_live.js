// layout_live.js — TR2-S5: the glue between the player's layout (layout_store.js) and the world on screen.
//
//   const live = createLayoutLive(world, { onChange(info) })       world = what buildWorld() returned (world.layoutParts: the late-built parts are read when asked)
//   live.records()          every movable thing at its CURRENT place (+ its default place), see layout_rules.js records()
//   live.visible()          the same, only what stands at the castle level now (built homes / civic / production lots + the six storehouses)
//   live.check(id, pose)    { ok, why: [codes] }   may `id` stand at pose {x, z, ry}?  (layout_rules.js checkPose: ONE function for the editor, the tests and the server port)
//   live.commit(id, pose)   check -> store -> show.  { ok, why }.  A pose equal to the default place removes the override.
//   live.reset(id) / live.resetAll() / live.undo()                 back to the default place / the whole default layout / the layout before the last commit
//   live.load(rec)          a saved record (the player's own at start, a defender's in an attack): shape + rules checked, what does not fit is dropped.  { applied, dropped }
//   live.save()             the record that is SHOWN: { v, g, m }   ·   live.own()  the record to SEND (LY1: the player's own, also while an attack is on screen)
//   live.apply(rec)         = world.applyLayout(rec): the attack map shows the DEFENDER's record (idempotent; null = nothing happens); live.leaveBattle() puts the player's own back
//   live.tick()             one stage of the pending "show it" work per call (the main loop calls it every frame: no frame carries more than one stage); live.flush() runs them all (tests, frames)
//
// What "show it" does, in this order (each stage is cheap, idempotent and compares what is on screen with what the layout says):
//   plan      townPlan() / planStores() forget their caches (layout_store rev changed)
//   stores    a moved storehouse yard is drawn again at its new place and put away where it stood (storeyards.js; its door lamps move in place)   [only if a store moved]
//   targets   town_build.js retargetTown(): the battle blocks are made again from the lots' new places (same ids for the blocks that stay)
//   town      createPlannedTown.rebuild(): the homes + civic lots are baked again in the background (the old picture stays until the new one is complete)
//   ground    GR1's contact shadows under the houses follow the lots (terrain.ground.setFootprints)
//   worksites wsbuild.rebuild(): only the production lots that moved are built again
//   life      wslife.respawn(): the people / carts of the moved sites + of the sites that haul to a moved store or mill
//   picks     the tap boxes of the moved lots
import * as THREE from 'three';
import * as LS from './layout_store.js';
import * as RULES from './layout_rules.js';
import { townPlan, planLots, homeLots, civicLots, prodLots } from './town_plan.js';
import { planStores } from './stores.js';
import { retargetTown } from './town_build.js';

const UNDO_MAX = 30;
const key = (o) => o.x.toFixed(2) + ',' + o.z.toFixed(2) + ',' + o.ry.toFixed(3);

export function createLayoutLive(world, hooks = {}) {
  const P = () => world.layoutParts || {};
  let G = null, undoStack = [], queue = [], shown = null, last = { ms: 0, stages: {} }, inBattle = false, saved = null, appliedKey = null, ownLater = null;       // (LY1: undoStack = up to UNDO_MAX levels, was one; ownLater = the player's own record that arrived while an attack was on screen)
  const castle = () => { try { return P().castle ? P().castle() : 30; } catch (e) { return 30; } };
  const geom = () => G || (G = RULES.geomFromGame((world.ctx && world.ctx.town && world.ctx.town.gen) || [], !!(world.ctx && world.ctx.tr2town)));
  const poseKey = () => { const m = new Map(); for (const r of RULES.records()) m.set(r.id, key(r)); return m; };
  shown = poseKey();                                                     // what is on screen now (the layout the world was built with)

  const stages = {
    plan() { townPlan(); planStores(); },
    stores(ch) { if (![...ch].some((id) => id.startsWith('store_')) || !world.stores) return; if (world.stores.rebuildSteps) return world.stores.rebuildSteps(); if (world.stores.rebuild) world.stores.rebuild(); },      // (steps: one per moved store + the merge: the live layer runs one per frame)
    targets(ch) { const c = P().ctx; if (!c || !c.townSlots || ![...ch].some((id) => !id.startsWith('store_'))) return; return retargetTown(c, P().height, c.townTids || new Map()); },
    town(ch) { const p = P().planned; if (p) return p.rebuild(); },                   // (sig-driven: a moved store also clears the generic houses under it)
    ground(ch) { const g = P().ground, c = P().ctx; if (!g || !g.setFootprints || ![...ch].some((id) => !id.startsWith('store_'))) return; g.setFootprints([...((c && c.town && c.town.houses) || []), ...planLots()]); },      // (GR1: the same list world.js gave at the start, with the lots at their places now)
    worksites(ch) { const w = P().worksites; if (w && [...ch].some((id) => !id.startsWith('store_'))) return w.rebuild(castle()); },
    life(ch) {
      const l = P().wsLife; if (!l || !l.respawn) return;
      const sites = new Set([...ch].filter((id) => !id.startsWith('store_'))), stores = new Set([...ch].filter((id) => id.startsWith('store_')).map((id) => id.slice(6)));
      return l.respawn(sites, stores);
    },
    picks(ch) {
      const picks = P().picks || [], byId = new Map(RULES.records().map((r) => [r.id, r]));
      for (const p of picks) {
        if (!p.lot || !ch.has(p.lot)) continue; const r = byId.get(p.lot); if (!r) continue;
        const b = p.box, hx = (b.max.x - b.min.x) / 2, hz = (b.max.z - b.min.z) / 2; b.min.x = r.x - hx; b.max.x = r.x + hx; b.min.z = r.z - hz; b.max.z = r.z + hz;
      }
    },
    notify(ch) { if (hooks.onChange) hooks.onChange({ changed: [...ch], rev: LS.rev(), count: LS.count() }); },
  };
  const ORDER = ['plan', 'stores', 'targets', 'town', 'ground', 'worksites', 'life', 'picks', 'notify'];

  function schedule() {                                                  // (a new change while stages are pending starts over: the stages compare, they never accumulate)
    const now = poseKey(), ch = new Set();
    for (const [id, k] of now) if (shown.get(id) !== k) ch.add(id);
    if (!ch.size) { queue = []; return 0; }
    last.maxMs = 0; queue = ORDER.map((n) => () => { const t0 = performance.now(), r = stages[n](ch); last.stages[n] = +(performance.now() - t0).toFixed(1); return r; });
    queue.push(() => { shown = now; });
    return ch.size;
  }
  function tick() {
    if (!queue.length) return false; const t0 = performance.now(), f = queue.shift(); try { const r = f(); if (Array.isArray(r) && r.length) queue.unshift(...r); } catch (e) { console.warn('layout stage', e); } last.ms = performance.now() - t0; last.maxMs = Math.max(last.maxMs || 0, last.ms); return queue.length > 0;       // (a stage may answer a list of smaller steps: they run next, one per frame)
  }
  function flush() { schedule2(); let n = 0; while (queue.length && n++ < 80) tick(); }
  const schedule2 = () => { if (!queue.length) schedule(); };

  const pushUndo = () => { undoStack.push(LS.snapshot()); if (undoStack.length > UNDO_MAX) undoStack.shift(); };
  function after() { queue = []; schedule(); }                           // (a store of the layout has changed: plan the work)

  // the nearest spot that fits within NUDGE_R m of `pose` (same turn; a 1 m grid, nearest first; the cheap rules first, the exact ones to confirm) — null when there is none
  const NUDGE_R = 8;
  function nearestSpot(id, pose, GG = geom()) {
    const c = []; for (let dx = -NUDGE_R; dx <= NUDGE_R; dx++) for (let dz = -NUDGE_R; dz <= NUDGE_R; dz++) { const d = Math.hypot(dx, dz); if (d > 0 && d <= NUDGE_R) c.push([d, dx, dz]); }
    c.sort((a, b) => a[0] - b[0]); const recs = RULES.records();
    for (const [, dx, dz] of c) { const q = LS.quant(Math.round(pose.x + dx), Math.round(pose.z + dz), pose.ry); if (RULES.checkMove(GG, id, q, recs, { first: true, height: world.fastHeight }).ok && RULES.checkMove(GG, id, q).ok) return q; }
    return null;
  }
  const api = {
    onLoaded: null,                                                    // (LY1: set by the game: called with what load(rec, { own: true }) put back / moved / dropped)
    get rev() { return LS.rev(); }, get count() { return LS.count(); }, get pending() { return queue.length; }, get last() { return last; },
    geom, records: () => RULES.records(),
    visible() {
      const lv = castle(), ok = new Set([...homeLots(lv), ...civicLots(lv), ...prodLots(lv)].map((l) => l.id));
      return RULES.records().filter((r) => r.kind === 'store' || ok.has(r.id));
    },
    // check(): for hover feedback (the baked ground, every broken rule);  search(): for the green dots (first broken rule only);  commit() asks again with the exact ground
    check(id, pose) { return RULES.checkMove(geom(), id, LS.quant(pose.x, pose.z, pose.ry), null, { height: world.fastHeight }); },
    search(id, pose, recs = null) { return RULES.checkMove(geom(), id, pose, recs, { first: true, height: world.fastHeight }).ok; },
    commit(id, pose, { force = false } = {}) {
      const r = RULES.recordById(id); if (!r) return { ok: false, why: ['UNKNOWN'] };
      pose = LS.quant(pose.x, pose.z, pose.ry);                          // (the stored numbers are rounded: check what will be stored)
      const c = force ? { ok: true, why: [] } : RULES.checkMove(geom(), id, pose); if (!c.ok) return c;
      pushUndo();
      if (Math.hypot(pose.x - r.dx, pose.z - r.dz) < 0.01 && Math.abs(pose.ry - r.dry) < 0.001) LS.clearOne(id); else LS.setOne(id, pose.x, pose.z, pose.ry);
      after(); return { ok: true, why: [] };
    },
    swapCheck(idA, idB) { return RULES.checkSwap(geom(), idA, idB); },
    swap(idA, idB) {                                                   // two things trade places: all or nothing
      const c = RULES.checkSwap(geom(), idA, idB); if (!c.ok) return c;
      const A = RULES.recordById(idA), B = RULES.recordById(idB); pushUndo();
      for (const [r, p] of [[A, c.a], [B, c.b]]) { if (Math.hypot(p.x - r.dx, p.z - r.dz) < 0.01 && Math.abs(p.ry - r.dry) < 0.001) LS.clearOne(r.id); else LS.setOne(r.id, p.x, p.z, p.ry); }
      after(); return { ok: true, why: [] };
    },
    reset(id) {                                                        // back to the default place — unless something else stands there now: { ok, why }
      const r = RULES.recordById(id); if (!r) return { ok: false, why: ['UNKNOWN'] }; if (!r.moved) return { ok: true, why: [] };
      const c = RULES.checkMove(geom(), id, { x: r.dx, z: r.dz, ry: r.dry }); if (!c.ok) return c;
      pushUndo(); LS.clearOne(id); after(); return { ok: true, why: [] };
    },
    resetAll() { pushUndo(); LS.clearAll(); after(); },
    canUndo: () => undoStack.length > 0,
    undo() { if (!undoStack.length) return false; LS.restore(undoStack.pop()); after(); return true; },      // (LY1: every step back, not just the last one)
    save: () => LS.getLayout(RULES.planId()),                          // the record that is SHOWN (in a battle: the defender's)
    // LY1: the record to SEND to the server is ALWAYS the player's own — while an attack is on screen the layout in LS is the DEFENDER's (enterBattle), and a save that fires then (the editor's 500 ms timer, close() at the start of
    // a battle) would have stored the enemy's town as the player's.  In a battle it is built from the snapshot enterBattle() took of the player's own.  layout_ui.js and layout_wire.js save through this one.
    own: () => {
      if (!inBattle || !saved) return LS.getLayout(RULES.planId());
      const m = {}; for (const [id, v] of saved.slice().sort((a, b) => (a[0] < b[0] ? -1 : 1))) m[id] = v.slice(); const g = RULES.planId(), o = { v: LS.LAYOUT_V }; if (g) o.g = g; o.m = m; return o;
    },
    // a record to show: unknown ids and poses that break a rule are dropped (the rest stays); the rules see the whole record, so a pile of moves that only fit together is judged together.
    // LY1: -> { applied, dropped: [ids], reasons: { id: [codes] }, nudged: { id: { from: [x, z], to: [x, z] } } }.  Nothing is dropped without being named: `reasons` says which rule each one broke (UNKNOWN = the id does not
    // exist any more).  opt.nudge (the player's OWN record, not a defender's): a building whose place is no longer valid (the town changed between two versions of the game: new roads, other footprints) is first tried on the
    // nearest valid spot within NUDGE_R metres of where it stood, and only goes back to its default place when there is none.  opt.own: tell api.onLoaded (the game shows what was put back).
    load(rec, opt = {}) {
      const GG = opt.own ? { ...geom(), genYield: true } : geom();                  // (GEN = no Tripo houses loaded: a client-only rule for NEW places; it never makes the player's saved building go back)
      const known = new Set(RULES.records().map((r) => r.id)), dropped = [], reasons = {}, nudged = {}, want = {};
      const res = LS.setLayout(rec, (id, t) => known.has(id) || (dropped.push(id), (reasons[id] = ['UNKNOWN']), false)); if (res.error) return { applied: 0, dropped: [], reasons, nudged, error: res.error };
      for (const id of LS.ids()) want[id] = LS.ovr(id).slice();
      for (let i = 0; i < 400; i++) {                                    // the first invalid one (by id) goes back to its default place, then the rest is judged again: a clash costs ONE of the two
        const bad = RULES.invalidIds(GG); if (!bad.length) break;
        const id = bad.sort()[0], r = RULES.recordById(id); reasons[id] = RULES.checkPose(GG, r, r, RULES.records()).why; LS.clearOne(id); dropped.push(id);
      }
      if (opt.nudge) for (const id of dropped.slice()) {
        const w = want[id]; if (!w || reasons[id][0] === 'UNKNOWN') continue; const p = nearestSpot(id, { x: w[0], z: w[1], ry: w[2] }, GG); if (!p) continue;
        LS.setOne(id, p.x, p.z, p.ry); nudged[id] = { from: [w[0], w[1]], to: [p.x, p.z] }; dropped.splice(dropped.indexOf(id), 1);
      }
      undoStack.length = 0; after();
      const out = { applied: LS.count(), dropped, reasons, nudged }; if (opt.own && api.onLoaded) { try { api.onLoaded(out); } catch (e) { console.warn('layout onLoaded', e); } } return out;
    },
    // the player's own record (the server's, or this browser's copy): shown at once; while an attack is on screen it waits and is shown when leaveBattle() has put the old town back
    loadOwn(rec) { if (inBattle) { ownLater = rec; return null; } return api.load(rec, { nudge: true, own: true }); },
    // an attack happens on the DEFENDER's layout (target.layout, from the server) — a made-up kingdom has none = the default town; the attacker's own arrangement never leaks into it.
    // enterBattle() shows it (synchronously: every stage runs now; the town's background bake finishes within a few frames: settled() waits for it), leaveBattle() puts the player's own back.
    enterBattle(rec) {
      if (!inBattle) { saved = LS.snapshot(); inBattle = true; }
      api.load(rec && typeof rec === 'object' ? rec : { v: 1, m: {} }); flush(); return LS.count();
    },
    // apply(rec) = world.applyLayout(rec) (main.js): the attack map shows the DEFENDER's record (player_target.layout).  null / undefined / not an object: nothing happens (false).  The record that is already
    // shown: nothing happens (false, idempotent: the same call twice costs nothing).  Else it is shown like enterBattle() does (the player's own layout is saved first, leaveBattle() brings it back): true.
    apply(rec) {
      if (!rec || typeof rec !== 'object') return false;
      const k = JSON.stringify(rec); if (inBattle && k === appliedKey) return false;
      api.enterBattle(rec); appliedKey = k; return true;
    },
    leaveBattle() { if (!inBattle) return false; appliedKey = null; inBattle = false; LS.restore(saved); saved = null; undoStack.length = 0; after(); flush(); if (ownLater) { const r = ownLater; ownLater = null; api.load(r, { nudge: true, own: true }); flush(); } return true; },
    get inBattle() { return inBattle; },
    settled(ms = 4000) {
      const t0 = performance.now();
      return new Promise((ok) => { const f = () => { const p = P().planned; if ((!queue.length && (!p || p.idle)) || performance.now() - t0 > ms) ok(true); else setTimeout(f, 30); }; f(); });
    },
    tick, flush,
  };
  return api;
}
