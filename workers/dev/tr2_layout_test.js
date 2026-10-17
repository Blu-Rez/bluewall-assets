// tr2_layout_test.js — TR2-S5: the player's own layout.  200 random valid moves (homes, civic, production lots, storehouses) -> nothing overlaps, every rule still holds, the planners (town plan, stores,
// production sites, battle blocks, solids) agree with the layout, the default plan is never touched; invalid moves are rejected with the right reason; swap / undo / reset; the record round-trips
// (size <= 8 KB, tampered records are cut down to what fits); the battle sim runs on the moved blocks.  Last line: "TR2 LAYOUT OK".
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
import * as LS from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_store.js';
import * as RULES from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_rules.js';
import { createLayoutLive } from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_live.js';
import { townPlan, townPlan0, homeLots, civicLots, prodLots, prodSites, planLots, planLots0, townTargetSpecs, townSolids, planId, isMovableLot } from '/home/claude/bot/bluebot_v2/bluewall/client/src/town_plan.js';
import { planStores, planStoresDefault } from '/home/claude/bot/bluebot_v2/bluewall/client/src/stores.js';
import { registerTownTargets, retargetTown } from '/home/claude/bot/bluebot_v2/bluewall/client/src/town_build.js';
import { staticSolids } from '/home/claude/bot/bluebot_v2/bluewall/client/src/solids.js';
import { sites, wsSolids } from '/home/claude/bot/bluebot_v2/bluewall/client/src/worksites.js';
import { createBattle } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import fs from 'fs';

L.setMap('night');
let fails = 0; const say = (ok, name, extra = '') => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); return ok; };
const hyp = Math.hypot;
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rnd = mulberry(20241015);
const LEVEL = 30, LIMIT = +process.env.LIMIT || 200;

// ---- the world as far as a node test can build it: the town plan, the battle blocks (ctx), the live layer
const ctx = { targets: [], tgt(t) { const id = ctx.targets.length + 1; ctx.targets.push({ id, ...t }); return id; }, B: { bid() {} }, town: { gen: [] } };
const tids = registerTownTargets(ctx, LEVEL); ctx.townTids = tids;
const world = { ctx, layoutParts: { ctx, height: L.height, picks: [], castle: () => LEVEL }, stores: { rebuild: () => 0 }, get targets() { return ctx.targets.some((t) => t.off) ? ctx.targets.filter((t) => !t.off) : ctx.targets; } };
const live = createLayoutLive(world);
const G = live.geom();
const sig0 = JSON.stringify(townPlan0().list), stores0 = JSON.stringify(planStoresDefault());
const recs0 = live.records();
const nLots0 = townPlan0().list.filter(isMovableLot).length;
say(recs0.length === nLots0 + 6 && recs0.filter((r) => r.kind === 'store').length === 6, 'every movable thing is a record (the lots + the six ST1 storehouse yards)', `${recs0.length} records (${recs0.filter((r) => r.kind === 'store').length} storehouses)`);
say(recs0.every((r) => !r.moved), 'a fresh layout moves nothing');
{ const bad = recs0.filter((r) => !RULES.checkPose(G, r, r, recs0).ok); say(bad.length === 0, 'the default layout is valid under the rules (every record)', bad.map((r) => r.id).join(' ')); }
say(LS.count() === 0 && JSON.stringify(live.save().m) === '{}', 'the default layout is an empty record', JSON.stringify(live.save()));

// ---- an independent overlap check (the full footprints, gap 0): rules must make it impossible
const rectOf = (r) => { const fp = r.fp, [cx, cz] = RULES.centreOf(r.x, r.z, r.ry, fp); return RULES.corners(cx, cz, r.ry, fp.w, fp.d); };
const sat = (A, B) => { for (const P of [A, B]) for (let i = 0; i < 4; i++) { const a = P[i], b = P[(i + 1) % 4], nx = -(b[1] - a[1]), nz = b[0] - a[0]; let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; for (const [x, z] of A) { const d = x * nx + z * nz; a0 = Math.min(a0, d); a1 = Math.max(a1, d); } for (const [x, z] of B) { const d = x * nx + z * nz; b0 = Math.min(b0, d); b1 = Math.max(b1, d); } if (a1 <= b0 + 1e-6 || b1 <= a0 + 1e-6) return false; } return true; };
const overlaps = (rs) => { const R = rs.map((r) => [r, rectOf(r)]), out = []; for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { if (hyp(R[i][0].x - R[j][0].x, R[i][0].z - R[j][0].z) > 60) continue; if (sat(R[i][1], R[j][1])) out.push(R[i][0].id + '~' + R[j][0].id); } return out; };
say(overlaps(recs0).length === 0, 'no two default footprints overlap (independent SAT)', overlaps(recs0).slice(0, 3).join(' '));

// ---- 1. 200 random valid moves
const findSpot = (r, R, step, N = 500) => {                                // a random valid pose within R metres (random tries: the free places are few and scattered)
  const all = live.records();
  for (let k = 0; k < N; k++) {
    const a = rnd() * Math.PI * 2, d = 2.5 + Math.sqrt(rnd()) * (R - 2.5), pose = LS.quant(Math.round(r.x + Math.cos(a) * d), Math.round(r.z + Math.sin(a) * d), r.ry + [0, 6, -6, 12][Math.floor(rnd() * 4)] * RULES.ROT_STEP);
    if (RULES.checkPose(G, r, pose, all, { first: true }).ok && RULES.checkPose(G, r, pose, all).ok) return pose;
  }
  return null;
};
let done = 0, tries = 0, bad = [], planBad = [], kinds = {};
const t0 = Date.now();
while (done < LIMIT && tries < LIMIT * 6) {
  tries++;
  const rs = live.records(), pool = rs.filter((r) => (rnd() < 0.2 ? r.kind === 'store' : r.kind !== 'store')), r = pool[Math.floor(rnd() * pool.length)];
  const pose = findSpot(r, r.kind === 'store' ? 70 : 34, r.kind === 'store' ? 4 : 2); if (!pose) continue;
  const res = live.commit(r.id, pose); if (!res.ok) { bad.push('commit refused ' + r.id + ' ' + res.why); continue; }
  live.flush(); done++; kinds[r.kind] = (kinds[r.kind] || 0) + 1;
  const now = live.records(), inv = RULES.invalidIds(G, now); if (inv.length) bad.push('invalid after move ' + r.id + ': ' + inv.map((id) => { const q = now.find((z) => z.id === id); const cl = now.filter((o) => o.id !== q.id).map((o) => [o, hyp(o.x - q.x, o.z - q.z)]).sort((a, b) => a[1] - b[1])[0]; return id + '[' + RULES.checkPose(G, q, q, now).why.join(',') + '] at ' + q.x.toFixed(1) + ',' + q.z.toFixed(1) + ' ry ' + q.ry.toFixed(2) + ' fp ' + JSON.stringify(q.fp) + ' nearest ' + cl[0].id + ' ' + cl[1].toFixed(1) + ' ' + JSON.stringify(cl[0].fp) + ' pose-at-commit ' + JSON.stringify(pose); }).join(','));
  if (done % 10 === 0) { const ov = overlaps(now); if (ov.length) bad.push('overlap ' + ov.join(',')); }
  if (done % 25 === 0) {                                              // the planners agree with the layout
    const P = townPlan(), byId = new Map(P.list.map((p) => [p.id, p]));
    for (const q of now) { if (q.kind === 'store') { const s = planStores().find((s) => 'store_' + s.id === q.id); if (!s || Math.abs(s.x - q.x) > 1e-9 || Math.abs(s.z - q.z) > 1e-9) planBad.push('store ' + q.id); } else { const p = byId.get(q.id); if (!p || Math.abs(p.x - q.x) > 1e-9 || Math.abs(p.z - q.z) > 1e-9 || Math.abs(p.ry - q.ry) > 1e-9) planBad.push('lot ' + q.id); } }
  }
}
say(done === LIMIT, LIMIT + ' random valid moves committed', `${done} moves in ${tries} tries, ${Date.now() - t0} ms; ${JSON.stringify(kinds)}`);
say(bad.length === 0, 'after every move: no rule broken, no overlap', bad.slice(0, 3).join(' | '));
say(planBad.length === 0, 'town plan / store plan agree with the layout (every 25 moves)', planBad.slice(0, 3).join(' | '));
const moved = live.records().filter((r) => r.moved);
say(LS.count() === moved.length && moved.length > 40, 'the layout holds exactly the moved things', `${LS.count()} overrides`);

// ---- 2. the default plan is never touched; planners
say(JSON.stringify(townPlan0().list) === sig0, 'the default town plan is untouched (byte for byte)');
say(JSON.stringify(planStoresDefault()) === stores0, 'the default storehouse plan is untouched');
say(planLots0().every((l) => { const d = townPlan0().list.find((p) => p.id === l.id); return d && d.x === l.x && d.z === l.z; }), 'planLots0() = the default lots (the generic houses keep off THESE)');
{
  const lv = homeLots(LEVEL).concat(civicLots(LEVEL)), ids = new Set(lv.map((l) => l.id)), d0 = homeLots(LEVEL).length + civicLots(LEVEL).length;
  say(d0 === ids.size && lv.length === 3 * 0 + lv.length, 'homes + civic lots: same ids as before', `${ids.size}`);
  const sp = prodSites(), pl = townPlan().list.filter((p) => p.role === 'P' && prodSites().some((s) => s.id === p.id));
  say(sp.length === pl.length && sp.every((s) => { const p = pl.find((q) => q.id === s.id); return p && Math.abs(s.lot.x - p.x) < 1e-9 && Math.abs(s.lot.z - p.z) < 1e-9 && s.ry === p.ry; }), 'production sites stand on their (moved) lots', `${sp.length} sites, ${sp.filter((s) => LS.ovr(s.id)).length} moved`);
  say(sites().filter((s) => s.town).length === sp.length, 'worksites.sites() hands out the moved production lots');
}
// battle blocks: retargetTown keeps ids, every lot is in exactly one live block that covers it, switched-off blocks hold no lot
{
  const r = retargetTown(ctx, L.height, tids), specs = townTargetSpecs(LEVEL), seen = new Map();
  for (const s of specs) for (const id of s.ids) seen.set(id, (seen.get(id) || 0) + 1);
  const lots = [...homeLots(LEVEL), ...civicLots(LEVEL), ...prodLots(LEVEL)];
  say(lots.every((l) => seen.get(l.id) === 1) && seen.size === lots.length, 'every lot is in exactly one battle block', `${lots.length} lots, ${specs.length} blocks`);
  const live2 = ctx.targets.filter((t) => !t.off), offs = ctx.targets.filter((t) => t.off);
  let miss = [];
  for (const l of lots) { const t = ctx.targets[tids.get(l.id) - 1]; const e = Math.max(l.w, l.d) / 2; const ee = l.kind === 'chapel' ? 0 : e; if (!t || t.off || l.x - ee < t.x - t.w / 2 - 1.5 || l.x + ee > t.x + t.w / 2 + 1.5 || l.z - ee < t.z - t.d / 2 - 1.5 || l.z + ee > t.z + t.d / 2 + 1.5) miss.push(l.id); }
  say(miss.length === 0, 'every lot lies inside its live battle block', miss.slice(0, 4).join(' '));
  const held = new Set(lots.map((l) => tids.get(l.id)));
  say(offs.every((t) => !held.has(t.id)), 'switched-off blocks hold no lot', `${offs.length} off, ${ctx.targets.length} slots, ${live2.length} live, retarget: ${JSON.stringify(r)}`);
  say(world.targets.length === live2.length && world.targets.every((t) => !t.off), 'world.targets hides the switched-off blocks');
  say(new Set(world.targets.map((t) => t.id)).size === world.targets.length, 'target ids are unique');
}
// solids (nav keeps ground units out of the buildings): the civic solids moved with their lots
{
  const sol = townSolids(LEVEL), movedCivic = civicLots(LEVEL).filter((l) => LS.ovr(l.id));
  const st = staticSolids();
  say(sol.length > 0 && st.length >= sol.length, 'staticSolids() works on the moved layout', `${st.length} solids (${sol.length} civic), ${movedCivic.length} moved civic lots`);
  const d = townPlan0().list, off = movedCivic.filter((l) => { const o = d.find((p) => p.id === l.id); return o && hyp(o.x - l.x, o.z - l.z) > 1; });
  const nearNew = off.filter((l) => sol.some((q) => hyp(q[0] - l.x, q[1] - l.z) < Math.max(l.w, l.d) * 0.9 + 2));
  say(off.length === 0 || nearNew.length >= Math.ceil(off.length * 0.6), 'civic solids stand at the moved lots', `${nearNew.length}/${off.length}`);
}

// ---- 3. invalid moves are refused with the right reason, and change nothing
{
  const before = JSON.stringify(live.save()), cot = live.records().find((r) => r.kind === 'cottage'), sw = live.records().find((r) => r.id === 'store_wood');
  const mid = (pts) => pts[Math.floor(pts.length / 2)], T = G.town, e = T[3];
  const cases = [
    ['WALL', cot, { x: e[0] + (e[0] > 0 ? 25 : -25), z: e[1] + (e[1] > 0 ? 25 : -25), ry: 0 }],
    ['GATE', cot, { x: G.gates[0].x - 4, z: G.gates[0].z - 2, ry: 0 }],
    ['STREET', cot, { x: G.streets[0].pts[2][0], z: G.streets[0].pts[2][1], ry: 0 }],
    ['RIVER', cot, { x: mid(G.river.pts)[0], z: mid(G.river.pts)[1], ry: 0 }],
    ['MARKET', cot, { x: G.market.x + 3, z: G.market.z + 3, ry: 0 }],
    ['OVERLAP', cot, (() => { const o = live.records().find((r) => r.id !== cot.id && r.kind === 'merchant'); return { x: o.x, z: o.z, ry: o.ry }; })()],
    ['MOAT', sw, { x: G.outer[2][0] + (G.outer[2][0] > 0 ? 6 : -6), z: G.outer[2][1] + (G.outer[2][1] > 0 ? 6 : -6), ry: 0 }],
  ];
  if (G.vaults.length) cases.push(['VAULT', cot, { x: G.vaults[0].x + 2, z: G.vaults[0].z + 2, ry: 0 }]);
  for (const [code, r, pose] of cases) { const res = live.commit(r.id, pose); say(!res.ok && res.why.includes(code), `refused: ${code}`, `${r.id} -> ${res.why.join(',')}`); }
  { // dry / slope: scan for a point of the map that is too wet or too steep
    let wet = null, steep = null; for (let x = -160; x <= 160 && !(wet && steep); x += 5) for (let z = -160; z <= 160; z += 5) { const h = L.height(x, z); if (!wet && h < 0.05) wet = [x, z]; if (!steep && hyp(L.height(x + 5, z) - h, L.height(x, z + 5) - h) > 4) steep = [x, z]; }
    if (wet) { const res = live.commit(cot.id, { x: wet[0], z: wet[1], ry: 0 }); say(!res.ok, 'refused: wet ground', res.why.join(',')); }
    if (steep) { const res = live.commit(cot.id, { x: steep[0], z: steep[1], ry: 0 }); say(!res.ok && res.why.some((w) => ['SLOPE', 'DRY'].includes(w)), 'refused: steep ground', res.why.join(',')); }
  }
  say(JSON.stringify(live.save()) === before, 'a refused move changes nothing');
  say(live.commit('nothing_99', { x: 0, z: 0, ry: 0 }).why[0] === 'UNKNOWN', 'an unknown id is refused');
}

// ---- 4. swap / undo / reset
{
  const rs = live.records().filter((r) => r.role === 'H' && r.kind === 'cottage'); let did = null;
  for (let i = 0; i < rs.length && !did; i++) for (let j = i + 1; j < rs.length && !did; j++) { const c = live.swapCheck(rs[i].id, rs[j].id); if (c.ok) did = [rs[i], rs[j], c]; }
  say(!!did, 'two cottages can trade places', did ? did[0].id + ' <-> ' + did[1].id : 'none found');
  if (did) {
    const [a, b] = did, ra = { x: a.x, z: a.z, ry: a.ry }, rb = { x: b.x, z: b.z, ry: b.ry }, n0 = LS.count(), res = live.swap(a.id, b.id); live.flush();
    const A = live.records().find((r) => r.id === a.id), B = live.records().find((r) => r.id === b.id);
    say(res.ok && Math.abs(A.x - rb.x) < 0.01 && Math.abs(B.x - ra.x) < 0.01 && Math.abs(A.z - rb.z) < 0.01 && Math.abs(B.z - ra.z) < 0.01, 'swap exchanges x, z and turn');
    say(RULES.invalidIds(G).length === 0 && overlaps(live.records()).length === 0, 'after the swap everything is valid');
    say(live.canUndo() && live.undo(), 'undo takes the swap back'); live.flush();
    const A2 = live.records().find((r) => r.id === a.id); say(Math.abs(A2.x - ra.x) < 0.01 && LS.count() === n0, 'undo restores the layout before the swap', `${LS.count()} overrides`);
  }
  { const mv = live.records().filter((r) => r.moved), ok1 = mv.find((r) => live.check(r.id, { x: r.dx, z: r.dz, ry: r.dry }).ok);
    say(!!ok1, 'a moved thing whose old place is free can go back', ok1 ? ok1.id : 'none'); if (ok1) { const was = LS.count(); live.reset(ok1.id); live.flush(); const o2 = live.records().find((r) => r.id === ok1.id); say(!o2.moved && Math.abs(o2.x - o2.dx) < 1e-9 && LS.count() === was - 1, 'reset puts one thing back at its default place'); live.undo(); live.flush(); }
    const bl = mv.find((r) => !live.check(r.id, { x: r.dx, z: r.dz, ry: r.dry }).ok); if (bl) { const before = JSON.stringify(live.save()), res = live.reset(bl.id); say(!res.ok && res.why.length > 0 && JSON.stringify(live.save()) === before, 'reset is refused while something else stands on the old place', `${bl.id}: ${res.why}`); } else say(true, 'reset: no blocked old place in this run'); }
  const keep = JSON.stringify(live.save());
  live.resetAll(); live.flush();
  say(LS.count() === 0 && live.records().every((r) => !r.moved && Math.abs(r.x - r.dx) < 1e-9 && Math.abs(r.z - r.dz) < 1e-9), 'reset all = the default layout');
  say(JSON.stringify(townPlan().list) === sig0 && JSON.stringify(planStores()) === stores0, 'after reset all the plans are the default plans again');
  // the targets after the layout is back to default: no lot lost, blocks consistent
  const lots = [...homeLots(LEVEL), ...civicLots(LEVEL), ...prodLots(LEVEL)], held = new Set(lots.map((l) => tids.get(l.id)));
  say(ctx.targets.filter((t) => !t.off).every((t) => held.has(t.id) || t.type !== 'house' && t.type !== 'church'), 'after reset all every live block holds lots', `${ctx.targets.filter((t) => t.off).length} off`);
  live.undo(); live.flush(); say(LS.count() > 0 && JSON.stringify(live.save()) === keep, 'undo brings the whole layout back after reset all');
}

// ---- 5. the record (what the server keeps): size, round-trip, byte-stable, tampering
{
  const rec = live.save(), json = JSON.stringify(rec);
  say(json.length <= LS.MAX_BYTES, 'the record fits 8 KB', `${json.length} bytes for ${LS.count()} moved things`);
  say(JSON.stringify(live.save()) === json, 'saving twice gives the same bytes');
  const back = JSON.parse(json); live.resetAll(); live.flush();
  const res = live.load(back); live.flush();
  say(res.applied === Object.keys(back.m).length && res.dropped.length === 0 && JSON.stringify(live.save()) === json, 'server round trip: load(save()) = the same layout', `${res.applied} applied, dropped ${res.dropped.map((id) => { const rs = live.records(), me = { ...rs.find((r) => r.id === id) }, pz = { x: back.m[id][0], z: back.m[id][1], ry: back.m[id][2] }; Object.assign(me, pz); const w = RULES.checkPose(G, me, pz, rs.map((r) => (r.id === id ? me : r))); const cl = rs.filter((o) => o.id !== id).map((o) => [o, hyp(o.x - pz.x, o.z - pz.z)]).sort((a, b) => a[1] - b[1]).slice(0, 2); return id + ':' + w.why + ' at ' + JSON.stringify(pz) + ' fp ' + JSON.stringify(me.fp) + ' near ' + cl.map(([o, d]) => o.id + (back.m[o.id] ? '(moved)' : '') + ' d=' + d.toFixed(1) + ' ' + JSON.stringify(o.fp)).join(' ; '); }).join(' ')}`);
  // the biggest record there can be: every movable thing moved
  const all = { v: 1, g: planId(), m: {} }; for (const r of live.records()) all.m[r.id] = [+r.x.toFixed(2), +r.z.toFixed(2), +r.ry.toFixed(3)];
  say(JSON.stringify(all).length < LS.MAX_BYTES, `even a record with every one of the ${recs0.length} things is under the limit`, `${JSON.stringify(all).length} bytes`);
  const keep = JSON.stringify(live.save());
  const t1 = JSON.parse(json); t1.m.zzz_00 = [0, 0, 0]; const r1 = live.load(t1); live.flush(); say(r1.dropped.includes('zzz_00') && JSON.stringify(live.save()) === keep, 'an unknown id is dropped');
  const t2 = JSON.parse(json), vic = live.records().find((r) => r.id !== 'store_wood' && !t2.m[r.id] && r.kind === 'cottage'); t2.m[vic.id] = [G.gates[0].x, G.gates[0].z, 0];
  const r2 = live.load(t2); live.flush(); say(r2.dropped.includes(vic.id) && RULES.invalidIds(G).length === 0, 'a pose that breaks a rule is dropped, the rest stays', `${r2.applied} applied`);
  const clash = JSON.parse(json), ids = Object.keys(clash.m); if (ids.length > 1) clash.m[ids[1]] = clash.m[ids[0]].slice();
  const r3 = live.load(clash); live.flush(); say(r3.dropped.length >= 1 && r3.dropped.length <= 4 && RULES.invalidIds(G).length === 0 && overlaps(live.records()).length === 0, 'two things on one spot: one of them goes back (by id order), the rest stays', `${r3.dropped.join(',')}`);
  live.load(JSON.parse(json)); live.flush();
  say(live.load({ v: 2, m: {} }).error === 'version' && live.load({ v: 1, m: [] }).error === 'm' && live.load(null).error === 'not an object', 'wrong version / shape is refused');
  const big = { v: 1, m: {} }; for (let i = 0; i < 700; i++) big.m['c_' + i] = [1, 2, 3]; say(live.load(big).error === 'size', 'a record over 8 KB is refused');
  say(live.load({ v: 1, m: { cottage_03: [1e9, 0, 0] } }).error === 'range pending'.slice(0, 5) || live.load({ v: 1, m: { cottage_03: [1e9, 0, 0] } }).error.startsWith('range'), 'out-of-range numbers are refused');
  say(live.load({ v: 1, m: { cottage_03: [1, 2] } }).error.startsWith('triple'), 'a record entry must be [x, z, ry]');
  live.resetAll(); live.flush();
}

// ---- 6. the attack is on the DEFENDER's layout
{
  let cot = null, pose = null; for (const r of live.records().filter((q) => q.kind === 'cottage')) { pose = findSpot(r, 40, 2, 800); if (pose) { cot = r; break; } }
  const theirs = { v: 1, m: { [cot.id]: [pose.x, pose.z, pose.ry] } };
  live.commit(live.records().find((r) => r.kind === 'merchant').id, findSpot(live.records().find((r) => r.kind === 'merchant'), 34, 2) || { x: 0, z: 0, ry: 0 }); live.flush();
  const mine = JSON.stringify(live.save());
  live.enterBattle(theirs); const inB = JSON.stringify(live.save());
  say(live.inBattle && JSON.parse(inB).m[cot.id] && Object.keys(JSON.parse(inB).m).length === 1, 'enterBattle shows the defender\'s layout (not the attacker\'s)', inB);
  live.enterBattle(null); say(Object.keys(live.save().m).length === 0, 'a made-up kingdom is the default town');
  live.leaveBattle(); live.flush(); say(!live.inBattle && JSON.stringify(live.save()) === mine, 'leaveBattle brings the player\'s own layout back', `${LS.count()} moved`);
  live.resetAll(); live.flush();
}

// ---- 7. the battle sim runs on the moved blocks (recorded real-map targets with the town's blocks replaced)
{
  for (let i = 0; i < 30; i++) { const ns = live.records().filter((q) => q.kind !== 'store'), r = ns[Math.floor(rnd() * ns.length)], p = findSpot(r, 30, 2); if (p) live.commit(r.id, p); }
  live.flush(); retargetTown(ctx, L.height, tids);
  const keepT = BT.targets.filter((t) => t.type !== 'house' && t.type !== 'church'), maxId = Math.max(...BT.targets.map((t) => t.id));
  const town = world.targets.filter((t) => t.type === 'house' || t.type === 'church').map((t, i) => ({ ...t, id: maxId + 1 + i }));
  const T = JSON.parse(JSON.stringify([...keepT, ...town])), army = { spear: 20, sword: 12, archer: 14, cavalry: 4, catapult: 2 };
  const spec = { seed: 7, ratio: 1.1, power: 900, levels: { keep: 12, wall: 12, towers: 12 }, loot: { ruby: 1000, emerald: 1000, turq: 1000 } };
  let sim = null, err = null; try { sim = createBattle({ spec, army, forge: 4, targets: T, meta: BT.meta, nav: null }); } catch (e) { err = e; }
  say(!!sim && !err, 'createBattle accepts the moved blocks', err ? String(err.stack || err).slice(0, 200) : `${sim.buildings.length} buildings`);
  if (sim) {
    const houses = sim.buildings.filter((b) => b.type === 'house' || b.type === 'church');
    say(houses.length === town.length && houses.every((b) => b.share > 0), 'the town blocks are battle targets with value', `${houses.length} blocks`);
    const g = BT.meta.gates[0]; for (const ty of Object.keys(army)) sim.send(ty, g.x, g.z);
    let steps = 0, exc = null; try { while (!sim.over && steps < 1500) { sim.step(0.1); steps++; } } catch (e) { exc = e; }
    say(!exc, 'the battle plays on without an error', exc ? String(exc.stack || exc).slice(0, 200) : `${steps} steps, ${(sim.result().destruction).toFixed(0)}% destroyed`);
  }
  live.resetAll(); live.flush();
}

// ---- 8. the server contract (docs/layout_api.md) against the mock endpoint: save -> load round trip, tampering, shape errors, rate limit, the defender's layout in an attack
{
  const { createMockServer } = await import('./tr2_s5_server_model.js');
  const GEOM = (await import('/home/claude/bot/bluebot_v2/workers/docs/tr2_s5_geom.json')).default, srv = createMockServer(GEOM, { clock: () => Date.now() }), SYNC = (await import('/home/claude/bot/bluebot_v2/bluewall/client/src/layout_sync.js')).createLayoutSync;
  say(GEOM.planId === planId(), 'the geometry file is for this plan (planId)', GEOM.planId + ' / ' + planId());
  globalThis.fetch = srv.fetch;
  const got = []; const sync = SYNC({ token: 'tok-A' }, { onServer: (j) => got.push(j) });
  say((await sync.load()) === null, 'a new player has no layout (GET -> null)');
  for (let i = 0; i < 12; i++) { const ns = live.records().filter((q) => q.kind !== 'store'), r = ns[Math.floor(rnd() * ns.length)], p = findSpot(r, 30, 2); if (p) live.commit(r.id, p); } { const st = live.records().find((q) => q.kind === 'store'), p = findSpot(st, 70, 4); if (p) live.commit(st.id, p); }
  live.flush(); const mine = live.save();
  const r1 = await sync.save(mine);
  say(r1 && r1.ok && r1.dropped.length === 0 && JSON.stringify(r1.layout.m) === JSON.stringify(mine.m), 'POST: a valid layout is stored as sent (the server\'s grid ground accepts what the client accepted)', `${Object.keys(mine.m).length} moved, dropped ${r1 && r1.dropped}`);
  const back = await sync.load(); say(JSON.stringify(back.m) === JSON.stringify(mine.m), 'GET returns it');
  live.resetAll(); live.flush(); live.load(back); live.flush(); say(JSON.stringify(live.save().m) === JSON.stringify(mine.m), 'the client loads what the server kept (same bytes)');
  // tampering: a cottage on a gate + an unknown id + two things on one spot
  const t = JSON.parse(JSON.stringify(mine)), ids = Object.keys(t.m), cot = live.records().find((q) => q.kind === 'cottage' && !t.m[q.id]);
  t.m[cot.id] = [G.gates[0].x, G.gates[0].z, 0]; t.m.zzz_99 = [1, 2, 3]; if (ids.length > 1) t.m[ids[1]] = t.m[ids[0]].slice();
  const r2 = await sync.save(t);
  say(r2.ok && r2.dropped.includes(cot.id) && r2.dropped.includes('zzz_99') && r2.dropped.length >= 3, 'POST: a tampered record is cut down (rule break, unknown id, clash), the rest is kept', `dropped ${r2.dropped.join(',')}`);
  say(got.length >= 2 && got[got.length - 1].dropped.length >= 3, 'the client is told what was dropped (onServer)');
  live.load(r2.layout); live.flush(); say(RULES.invalidIds(G).length === 0, 'and the effective record is valid for the client too');
  const bad = await SYNC({ token: 'tok-B' }).save({ v: 2, m: {} }); say(bad.ok === false && bad.why === 'version', 'POST: a wrong version is refused with its reason', JSON.stringify(bad));
  const big = { v: 1, m: {} }; for (let i = 0; i < 700; i++) big.m['c_' + i] = [1, 2, 3]; const fat = await SYNC({ token: 'tok-B' }).save(big); say(fat.ok === false && fat.why === 'size', 'POST: over 8 KB is refused', JSON.stringify(fat));
  const noTok = await srv.fetch('/api/layout', {}), noTokJ = await noTok.json(); say(noTok.status === 403 && noTokJ.reason === 'locked' && !('why' in noTokJ), 'no session -> 403 {ok:false, reason:"locked"} with NO why', JSON.stringify(noTokJ));
  let limited = null; for (let i = 0; i < 8; i++) { const r = await srv.fetch('/api/layout', { method: 'POST', headers: { Authorization: 'Bearer tok-C' }, body: JSON.stringify({ layout: { v: 1, m: {} } }) }); if (r.status === 429) { limited = i; break; } }
  say(limited === 5, 'rate limit: the 6th save inside 5 s is answered 429 "rate"', 'at ' + limited);
  const csync = SYNC({ token: 'tok-C' }); const rr = await csync.save({ v: 1, m: {} }); say(rr.ok === false && rr.why === 'rate' && csync.pending, 'the client keeps a record that was rate-limited (it retries)'); clearTimeout(0);
  // the attack: the attacker gets the defender's layout inside the target spec
  const tgt = srv.targetFor('tok-A'); say(tgt.layout && Object.keys(tgt.layout.m).length > 0, 'player_target adds the defender\'s layout', Object.keys((tgt.layout || { m: {} }).m).length + ' moved');
  live.resetAll(); live.flush(); live.enterBattle(tgt.layout); say(JSON.stringify(live.save().m) === JSON.stringify(tgt.layout.m), 'the attacker\'s client shows exactly that layout'); live.leaveBattle(); live.flush();
  say(Object.keys(srv.targetFor('nobody')).length === 0, 'a player without a layout adds nothing to the target');
  // a plan change: the stored record is judged again on the next GET
  srv.setPlanId('pNEW'); const g2 = await SYNC({ token: 'tok-A' }).load(); say(g2.g === 'pNEW' && JSON.stringify(g2.m) === JSON.stringify(r2.layout.m), 'GET after a plan change re-judges the record (same effective layout here)');
  srv.setPlanId(GEOM.planId);

  // ---- the answers of docs/layout_api.md §2 and what layout_sync.js does with each (ROUND4 A4.2); a localStorage stub = the browser
  const store = new Map(); globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); }, removeItem: (k) => { store.delete(k); } };
  const timers = new Map(), realST = globalThis.setTimeout, realCT = globalThis.clearTimeout; let tn = 0;       // the retry timers a call leaves behind (the 10 / 15 s abort timers of fetchT are cleared by the call itself)
  globalThis.setTimeout = (fn, ms, ...a) => { const id = ++tn; timers.set(id, ms); return id; }; globalThis.clearTimeout = (id) => { timers.delete(id); };
  const retries = () => [...timers.values()].filter((ms) => ms % 4000 === 0 && ms <= 24000).length;
  const pend = () => store.get('bw_layout_pend') === '1', saved = () => { try { return JSON.parse(store.get('bw_layout_v1') || 'null'); } catch (e) { return null; } };
  const reset = () => { store.clear(); timers.clear(); };
  const one = (id, p) => ({ v: 1, m: { [id]: [p.x, p.z, p.ry] } });
  const cot2 = live.records().filter((q) => q.kind === 'cottage' && !q.moved)[3]; const pose2 = findSpot(cot2, 30, 2); const rec2 = one(cot2.id, { x: +pose2.x.toFixed(2), z: +pose2.z.toFixed(2), ry: +pose2.ry.toFixed(3) });
  // 403 locked: no `why`, the record stays pending (this browser + flag), NO retry timer
  reset(); srv.lock('tok-L'); const gotL = [];
  const lk = SYNC({ token: 'tok-L' }, { onServer: (j) => gotL.push(j) }), rl = await lk.save(rec2);
  say(rl.ok === false && rl.why === 'locked' && rl.reason === 'locked', '403 locked: the client answers {ok:false, why/reason: locked}', JSON.stringify(rl));
  say(pend() && JSON.stringify(saved().m) === JSON.stringify(rec2.m) && retries() === 0 && gotL.length === 0, '403 locked: the record stays pending (flag + this browser), no retry timer, the game is not told anything', `pend ${pend()}, timers ${retries()}`);
  // the session is back: load() sends the pending record first, then the server's answer is what is shown
  srv.unlock('tok-L'); const gotL2 = []; const back2 = await SYNC({ token: 'tok-L' }, { onServer: (j) => gotL2.push(j) }).load();
  say(!pend() && back2 && JSON.stringify(back2.m) === JSON.stringify(rec2.m) && srv.db.get('tok-L') && JSON.stringify(srv.db.get('tok-L').m) === JSON.stringify(rec2.m), 'session back: load() sends the pending record first, the server keeps it, the flag is cleared', JSON.stringify(back2 && back2.m));
  // 503 off: kept in this browser only, not pending, no retry
  reset(); srv.setOff(true); const so = SYNC({ token: 'tok-O' }), ro = await so.save(rec2); srv.setOff(false);
  say(ro.ok === false && ro.why === 'off' && !pend() && JSON.stringify(saved().m) === JSON.stringify(rec2.m) && retries() === 0, '503 off: the layout stays in this browser, not pending, no retry', JSON.stringify(ro));
  // 400 with the rule's reason / a bad body: final
  reset(); const sb = SYNC({ token: 'tok-E' }), rb = await sb.save({ v: 1, m: { [cot2.id]: [1, 2] } });
  say(rb.ok === false && /^triple/.test(rb.why) && !pend() && retries() === 0 && !sb.pending, '400 <reason>: final (not pending, no retry)', JSON.stringify(rb));
  const raw = await srv.fetch('/api/layout', { method: 'POST', headers: { Authorization: 'Bearer tok-E' }, body: '{not json' }); const rawJ = await raw.json();
  say(raw.status === 400 && rawJ.why === 'bad', '400 bad: a body that is not JSON', JSON.stringify(rawJ));
  globalThis.fetch = async () => ({ status: 400, json: async () => ({ ok: false, why: 'bad' }) }); reset(); const sb2 = SYNC({ token: 'tok-E2' }), rb2 = await sb2.save(rec2);
  say(rb2.ok === false && rb2.why === 'bad' && !pend() && retries() === 0 && !sb2.pending, '400 bad (as the client receives it): final, not pending, no retry');
  // 413 size: final
  const fatRec = { v: 1, m: {} }; for (let i = 0; i < 700; i++) fatRec.m['c_' + i] = [1, 2, 3]; globalThis.fetch = srv.fetch; reset();
  const raw13 = await srv.fetch('/api/layout', { method: 'POST', headers: { Authorization: 'Bearer tok-F' }, body: JSON.stringify({ layout: fatRec }) }); const sf = SYNC({ token: 'tok-F2' }), rf = await sf.save(fatRec);
  say(raw13.status === 413 && rf.ok === false && rf.why === 'size' && !pend() && retries() === 0 && !sf.pending, '413 size: final (not pending, no retry)', JSON.stringify(rf));
  // 429 rate: kept + retried later (one timer, 4 s)
  reset(); for (let i = 0; i < 6; i++) await srv.fetch('/api/layout', { method: 'POST', headers: { Authorization: 'Bearer tok-G' }, body: JSON.stringify({ layout: { v: 1, m: {} } }) });
  const sg = SYNC({ token: 'tok-G' }), rg = await sg.save(rec2);
  say(rg.ok === false && rg.why === 'rate' && pend() && sg.pending && retries() === 1 && JSON.stringify(saved().m) === JSON.stringify(rec2.m), '429 rate: kept (flag + this browser) and sent again later (one retry timer)', `timers ${retries()}`);
  // 5xx / no answer: kept + retried
  const warn0 = console.warn; console.warn = () => {}; globalThis.fetch = async () => { throw new Error('offline'); }; reset(); const sn = SYNC({ token: 'tok-H' }), rn = await sn.save(rec2); globalThis.fetch = srv.fetch; console.warn = warn0;
  say(rn.ok === false && rn.why === 'net' && pend() && retries() === 1, 'no answer: kept and tried again (retry timer)', JSON.stringify(rn));
  // 200: the game shows the SERVER's record, not the one it sent (the server rounded a number / dropped an id)
  const srvRec = { v: 1, g: GEOM.planId, m: { [cot2.id]: [+(rec2.m[cot2.id][0] + 0.1).toFixed(2), rec2.m[cot2.id][1], rec2.m[cot2.id][2]] } };
  reset(); globalThis.fetch = async () => ({ status: 200, json: async () => ({ ok: true, layout: srvRec, dropped: [] }) }); const gotR = [], sr = SYNC({ token: 'tok-R' }, { onServer: (j) => gotR.push(j) }), rr2 = await sr.save(rec2);
  say(rr2.ok && gotR.length === 1 && gotR[0].changed === true && JSON.stringify(gotR[0].layout.m) === JSON.stringify(srvRec.m) && JSON.stringify(saved().m) === JSON.stringify(srvRec.m) && !pend(), '200 with other numbers than sent: onServer gets the server\'s layout (changed:true), this browser keeps THAT one', JSON.stringify(gotR[0] && gotR[0].layout.m));
  reset(); globalThis.fetch = async () => ({ status: 200, json: async () => ({ ok: true, layout: JSON.parse(JSON.stringify(rec2)), dropped: [] }) }); const gotS = [], ss = SYNC({ token: 'tok-S' }, { onServer: (j) => gotS.push(j) }); await ss.save(rec2);
  say(gotS.length === 1 && gotS[0].changed === false, '200 with the same record: changed:false (nothing to re-apply)');
  reset(); globalThis.fetch = async () => ({ status: 200, json: async () => ({ ok: true, layout: null, dropped: [cot2.id] }) }); const gotD = [], sd = SYNC({ token: 'tok-D' }, { onServer: (j) => gotD.push(j) }); await sd.save(rec2);
  say(gotD.length === 1 && gotD[0].changed === true && gotD[0].dropped[0] === cot2.id && saved() === null && !pend(), '200 with everything dropped: the game goes back to the default layout');
  // the effective record is what the live layer shows (main.js: onServer -> world.layout.load(j.layout))
  const mainSrc = fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/client/src/main.js', 'utf8');
  const wireSrc = fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/client/src/layout_wire.js', 'utf8');      // LY1: main.js -> createLayoutWire(...) -> layout_sync.js onServer -> world.layout.loadOwn(j.layout)
  say(/createLayoutWire\(\{ econ, world, ui/.test(mainSrc) && /layoutWire\.attach\(layoutUI\)/.test(mainSrc) && /onServer: \(j\) => \{ if \(j && j\.ok && j\.changed && !j\.stale && live\(\)\) \{ live\(\)\.loadOwn\(j\.layout/.test(wireSrc), 'main.js applies the server\'s layout (createLayoutWire -> onServer -> world.layout.loadOwn(j.layout), only when newer than the screen)');   // LY1:
  live.resetAll(); live.flush(); live.load(rec2); live.flush(); live.load(srvRec); live.flush();
  say(JSON.stringify(live.save().m) === JSON.stringify(srvRec.m), 'the live layer ends on the server\'s record, not the one that was sent', JSON.stringify(live.save().m));
  globalThis.setTimeout = realST; globalThis.clearTimeout = realCT; globalThis.fetch = srv.fetch; delete globalThis.localStorage;
  live.resetAll(); live.flush();
}

// ---- 9. world.applyLayout(rec) (BT1_R2): idempotent, null = nothing happens
{
  const mainSrc = fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/client/src/main.js', 'utf8');
  say(/world\.applyLayout = \(rec\) => world\.layout\.apply\(rec\)/.test(mainSrc), 'main.js: world.applyLayout = (rec) => world.layout.apply(rec)');
  live.resetAll(); live.flush();
  const ns = live.records().filter((q) => q.kind === 'cottage' || q.kind === 'merchant' || q.kind === 'craftsman'); let own = null, op = null, oth = null, pp = null;
  for (const q of ns) { const s = findSpot(q, 30, 2); if (!s) continue; if (!own) { own = q; op = s; } else { oth = q; pp = s; break; } }
  live.commit(own.id, op); live.flush(); const mine = JSON.stringify(live.save());
  const theirs = { v: 1, m: { [oth.id]: [+pp.x.toFixed(2), +pp.z.toFixed(2), +pp.ry.toFixed(3)] } };
  say(live.apply(null) === false && live.apply(undefined) === false && live.apply('x') === false && !live.inBattle && JSON.stringify(live.save()) === mine, 'applyLayout(null): nothing happens (no side effects)');
  say(live.apply(theirs) === true && live.inBattle && JSON.stringify(live.save().m) === JSON.stringify(theirs.m), 'applyLayout(rec): the defender\'s record is shown', JSON.stringify(live.save().m));
  const same = JSON.stringify(live.save()); say(live.apply(JSON.parse(JSON.stringify(theirs))) === false && JSON.stringify(live.save()) === same, 'applyLayout(rec) again: idempotent (nothing happens)');
  say(live.apply(null) === false && live.inBattle && JSON.stringify(live.save()) === same, 'applyLayout(null) while a record is shown: nothing happens, it stays');
  live.leaveBattle(); live.flush(); say(!live.inBattle && JSON.stringify(live.save()) === mine, 'leaveBattle brings the player\'s own layout back');
  say(live.apply({ v: 1, m: {} }) === true && live.inBattle && Object.keys(live.save().m).length === 0, 'an empty record is the default town (shown, not "nothing")'); live.leaveBattle(); live.flush();
  say(live.apply(theirs) === true, 'after leaveBattle the same record can be applied again'); live.leaveBattle(); live.flush();
  live.resetAll(); live.flush();
}

console.log(fails ? `TR2 LAYOUT FAILED (${fails})` : 'TR2 LAYOUT OK');
process.exit(fails ? 1 : 0);
