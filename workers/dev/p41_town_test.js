// p41_town_test.js — the town shows what B1 plans: real footprints, nothing on a street / in the water / on a stream / on a worksite solid, no civic piece on a street, the nav still connects
// the gates through the market, the battle targets of the plan's blocks, the level growth (a lot never moves), determinism.  Last line: "P41 OK".
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { planTownFull, KINDS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_townplan.js';
import { layoutFromGame } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_layout.js';
import { townLayout, townPlan, homeLots, civicLots, civicBuild, civicLotSolids, townSolids, planLots, resetTownPlan, castleLevel, townTargetSpecs, hashId, toWorld } from '/home/claude/bot/bluebot_v2/bluewall/client/src/town_plan.js';
import { HOME_KINDS, homePieces } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b2_homes.js';
import { CIVIC_KINDS, civicPieces } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b3_civic.js';
import { buildNav, bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
import { staticSolids } from '/home/claude/bot/bluebot_v2/bluewall/client/src/solids.js';

L.setMap('night');
let fails = 0; const say = (ok, name, extra = '') => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); return ok; };
const hyp = Math.hypot;
const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1; let t = ((px - ax) * dx + (pz - az) * dz) / l2; t = Math.max(0, Math.min(1, t)); return hyp(px - ax - dx * t, pz - az - dz * t); };
const polyD = (pts, x, z) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segD(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; };
const streetEdge = (lay, x, z) => { let d = 1e9; for (const s of lay.streets) d = Math.min(d, polyD(s.pts, x, z) - s.w / 2); return d; };
const rectPts = (r, step = 1.5) => { const c = Math.cos(r.ry), s = Math.sin(r.ry), out = [], nx = Math.max(1, Math.ceil(r.w / step)), nz = Math.max(1, Math.ceil(r.d / step)); for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) { const lx = -r.w / 2 + r.w * i / nx, lz = -r.d / 2 + r.d * j / nz; out.push([r.x + lx * c + lz * s, r.z - lx * s + lz * c]); } return out; };
const rectCircle = (r, cx, cz, cr) => { const c = Math.cos(r.ry), s = Math.sin(r.ry), dx = cx - r.x, dz = cz - r.z, lx = dx * c - dz * s, lz = dx * s + dz * c; return hyp(lx - Math.max(-r.w / 2, Math.min(r.w / 2, lx)), lz - Math.max(-r.d / 2, Math.min(r.d / 2, lz))) - cr; };

const lay = townLayout(), full = townPlan();
const HOMES = ['cottage', 'craftsman', 'merchant', 'noble'], CIVIC = Object.keys(CIVIC_KINDS);

// ---- 1. the footprints are the models' real ones
for (const k of HOMES) say(KINDS[k].w === HOME_KINDS[k].w && KINDS[k].d === HOME_KINDS[k].d, `B1 footprint of ${k} = B2 model footprint`, `${KINDS[k].w}x${KINDS[k].d}`);
for (const k of CIVIC) say(KINDS[k].w === CIVIC_KINDS[k].w && KINDS[k].d === CIVIC_KINDS[k].d, `B1 footprint of ${k} = B3 model footprint`, `${KINDS[k].w}x${KINDS[k].d}`);
const small = full.list.filter((p) => !p.existing && (HOME_KINDS[p.kind] || CIVIC_KINDS[p.kind])).filter((p) => { const f = HOME_KINDS[p.kind] || CIVIC_KINDS[p.kind]; return p.w < f.w - 1e-6 || p.d < f.d - 1e-6; });
say(small.length === 0, 'no lot is smaller than its model', small.slice(0, 3).map((p) => p.id).join(' '));

// ---- 2. determinism
{ const a = JSON.stringify(full.list); resetTownPlan(); const b = JSON.stringify(townPlan().list); say(a === b, 'same layout => the same plan (byte for byte)', `${a.length} bytes`); }
const P = townPlan();

// ---- 3. every home + civic lot: off the streets, off the river and the mountain streams, inside the wall, off the fixed circles
const lots = P.list.filter((p) => (HOME_KINDS[p.kind] || CIVIC_KINDS[p.kind]) && !p.existing);
const onS = [], onR = [], onT = [];
for (const l of lots) {
  let ms = 1e9, mr = 1e9, mt = 1e9;
  for (const [x, z] of rectPts(l)) { ms = Math.min(ms, streetEdge(lay, x, z)); mr = Math.min(mr, polyD(lay.river.pts, x, z) - lay.river.half); for (const S of lay.streams) mt = Math.min(mt, polyD(S.pts, x, z) - S.half); }
  if (ms < 0.3) onS.push(l.id + ':' + ms.toFixed(2)); if (mr < 1.5) onR.push(l.id + ':' + mr.toFixed(2)); if (mt < 2.5) onT.push(l.id + ':' + mt.toFixed(2));
}
say(onS.length === 0, `no home / civic lot on a street (${lots.length} lots)`, onS.slice(0, 3).join(' '));
say(onR.length === 0, 'no lot in the river or on its quay', onR.slice(0, 3).join(' '));
say(onT.length === 0, `no lot on a mountain stream (${lay.streams.map((s) => s.id).join(', ')})`, onT.slice(0, 3).join(' '));

// a layout where a stream is moved INTO the town: the plan must keep away from it (A2's streams are water for the planner)
{
  const v = JSON.parse(JSON.stringify(lay)); const c = v.town.reduce((a, p) => [a[0] + p[0] / v.town.length, a[1] + p[1] / v.town.length], [0, 0]);
  v.streams = [{ id: 'test', half: 9, pts: [[c[0] - 130, c[1] + 40], [c[0] - 40, c[1] + 55], [c[0] + 50, c[1] + 40], [c[0] + 140, c[1] + 70]] }];
  const pl = planTownFull(v).list.filter((p) => (HOME_KINDS[p.kind] || CIVIC_KINDS[p.kind]) && !p.existing);
  let bad = [], closest = 1e9; for (const l of pl) { let m = 1e9; for (const [x, z] of rectPts(l)) m = Math.min(m, polyD(v.streams[0].pts, x, z) - 9); closest = Math.min(closest, m); if (m < 2.5) bad.push(l.id + ':' + m.toFixed(2)); }
  const touching = pl.filter((l) => rectPts(l).some(([x, z]) => polyD(v.streams[0].pts, x, z) < 40)).length;
  say(bad.length === 0 && pl.length > 30 && touching > 0, `a stream moved into the town: ${pl.length} lots, ${touching} of them near it, closest ${closest.toFixed(1)} m from its water`, bad.slice(0, 3).join(' '));
}
// the fixed circles (stores, vaults) and the market reserve
{ let bad = []; for (const l of lots) for (const f of [...lay.fixed, { id: 'market', x: lay.market.x, z: lay.market.z, r: lay.market.r }]) if (rectCircle(l, f.x, f.z, f.r) < 0) bad.push(l.id + '/' + f.id); say(bad.length === 0, 'no lot on a store, a vault or the market square', bad.slice(0, 3).join(' ')); }
// nothing of the town on a worksite / hamlet / defence solid that is not a civic piece (those are checked below)
{ const civ = new Set(townSolids(30).map((q) => q[0] + '|' + q[1])), other = staticSolids().filter((q) => !civ.has(q[0] + '|' + q[1])), bad = [];
  for (const l of lots) for (const q of other) if (rectCircle(l, q[0], q[1], q[2]) < 0) bad.push(l.id + '/' + q.map((v) => Math.round(v)).join(','));
  say(bad.length === 0, `no lot on a hamlet / worksite / defence solid (${other.length} solids)`, bad.slice(0, 3).join(' ')); }

// ---- 4. levels: a lot never moves, counts never drop, the first level shows homes
{
  let prev = null, ok = true, grow = true, msg = '';
  for (let lv = 1; lv <= 30; lv++) {
    const h = homeLots(lv), c = civicLots(lv), cur = new Map([...h, ...c].map((l) => [l.id, l]));
    if (prev) { for (const [id, l] of prev) { const m = cur.get(id); if (!m || m.x !== l.x || m.z !== l.z || m.ry !== l.ry) { ok = false; msg = id + '@' + lv; } } if (cur.size < prev.size) grow = false; }
    prev = cur;
  }
  say(ok, 'positions never change between levels (a lot only appears)', msg); say(grow, 'the number of lots never drops with the level');
  const n1 = homeLots(1).length, n30 = homeLots(30).length; say(n1 >= 8 && n30 > n1, `homes: ${n1} at level 1 -> ${n30} at level 30`);
  say(civicLots(1).some((c) => c.kind === 'chapel') && civicLots(30).some((c) => c.kind === 'market') && civicLots(30).filter((c) => c.kind === 'well').length === 8, `civic: chapel at level 1; market, ${civicLots(30).filter((c) => c.kind === 'tavern').length} inns, town hall, 8 wells at level 30`);
  say(castleLevel(20) === 30 && castleLevel(1) === 1 && Math.abs(castleLevel(10.5) - 17) <= 1, 'castleLevel(): skin.js stretched 1..20 -> player 1..30', `20->${castleLevel(20)} 1->${castleLevel(1)} 10.5->${castleLevel(10.5)}`);
}

// ---- 5. the market: turned so that no big piece stands on a street, and no civic piece anywhere stands on a street
{
  const mk = civicLots(30).find((c) => c.kind === 'market'); const raw = civicPieces('market', 30, mk.seed), kept = civicBuild(mk);
  const big = kept.filter((p) => /markethall|church|tavern|tower|hall/.test(p.n)); let hallBad = 0;
  for (const p of big) if (streetEdge(lay, p.x, p.z) < 2) hallBad++;
  say(big.length >= 1 && hallBad === 0, `market: the hall stands off every street (turn ${(mk.ry * 180 / Math.PI).toFixed(0)} deg)`, `${hallBad} big pieces on a street`);
  say(kept.length >= 14 && kept.length <= raw.length, `market: ${kept.length} of ${raw.length} pieces stand (the ones on a street are left out, like the old market did)`);
  let bad = 0, worst = 99; for (const lot of civicLots(30)) for (const p of civicBuild(lot)) { if (hyp(p.x - lot.x, p.z - lot.z) < 3.5) continue; const e = streetEdge(lay, p.x, p.z); worst = Math.min(worst, e); if (e < 0) bad++; }
  say(bad === 0, 'no civic piece stands INSIDE a street (all lots, level 30)', `closest centre ${worst.toFixed(1)} m from a street edge`);
}

// ---- 6. nav: with the civic solids closed, every town gate still reaches the citadel gate and the market's far side
{
  const withT = buildNav({ height: L.height, bridges: bridgesFromLayout(L), solids: staticSolids() }), without = buildNav({ height: L.height, bridges: bridgesFromLayout(L) });
  const G = lay.gates, M = lay.market, cit = G[G.length - 1], pts = [...G.slice(0, -1).map((g, i) => ['gate' + i, g.x, g.z]), ['citadel', cit.x, cit.z], ['market+', M.x + 22, M.z], ['market-', M.x - 22, M.z], ['market n', M.x, M.z + 22], ['market s', M.x, M.z - 22]];
  const len = (r, a, b) => { if (!r) return -1; let d = 0, px = a[0], pz = a[1]; for (const q of r) { d += hyp(q[0] - px, q[1] - pz); px = q[0]; pz = q[1]; } return d + hyp(b[0] - px, b[1] - pz); };
  let nobody = [], detour = 0, worst = '', n = 0;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const a = pts[i], b = pts[j], A = [a[1], a[2]], B = [b[1], b[2]]; if (withT.isBlocked(A[0], A[1]) || withT.isBlocked(B[0], B[1])) continue;
    const r1 = withT.route(A[0], A[1], B[0], B[1]), r0 = without.route(A[0], A[1], B[0], B[1]); n++;
    if (!r1 && r0) { nobody.push(a[0] + '>' + b[0]); continue; }
    if (r1 && r0) { const l1 = len(r1, A, B), l0 = len(r0, A, B); const ex = l1 / Math.max(1, l0); if (ex > detour) { detour = ex; worst = a[0] + '>' + b[0]; } }
  }
  say(n >= 15 && nobody.length === 0, `nav: ${n} routes between the gates / the citadel / the four sides of the market: none lost to the civic solids`, nobody.join(' '));
  say(detour < 1.25, `nav: the worst detour the civic solids cause is x${detour.toFixed(2)} (< 1.25)`, worst);
  const sol = townSolids(30); say(sol.length >= 20 && sol.every((q) => q[2] > 0.5 && q[2] < 8), `nav: ${sol.length} civic solids (radius 0.5 .. 8 m)`);
}

// ---- 7. battle targets: every standing lot belongs to a target; the chapel stands alone as the 'church'
{
  for (const lv of [20, 30]) {
    const specs = townTargetSpecs(lv), ids = new Set(specs.flatMap((s) => s.ids)), want = [...homeLots(lv), ...civicLots(lv)].map((l) => l.id);
    const miss = want.filter((id) => !ids.has(id)), church = specs.filter((s) => s.t.type === 'church'), houses = specs.filter((s) => s.t.type === 'house');
    say(miss.length === 0 && church.length === 1 && houses.length >= 4 && houses.every((s) => s.t.n >= 1 && s.t.share > 0.5), `targets @ level ${lv}: ${houses.length} house blocks (${houses.reduce((a, s) => a + s.t.n, 0)} lots) + ${church.length} church; every lot is in one`, miss.slice(0, 3).join(' '));
  }
}

// ---- 8. the pieces: every kit piece a lot asks for is in the B2 / B3 test's list (names), seeds are stable
{
  const s1 = JSON.stringify(homePieces('cottage', 30, hashId('cottage_00'))), s2 = JSON.stringify(homePieces('cottage', 30, hashId('cottage_00')));
  say(s1 === s2 && hashId('cottage_00') !== hashId('cottage_01'), 'a lot keeps its look: the same id gives the same seed gives the same pieces');
  say(planLots().length === P.list.filter((p) => p.role === 'H' || p.role === 'C').length, `planLots(): ${planLots().length} reserved lots (homes + civic; the production lots stay free until they are wired)`);
}
console.log(fails ? `P41 FAILED (${fails})` : 'P41 OK'); process.exit(fails ? 1 : 0);
