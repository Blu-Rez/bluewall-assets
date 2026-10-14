// p1_test.js — P1: the 10 processing kinds stand on the map (panning + 4 mills outside the walls, the nine others on B1's production lots in the town), gated by level, solid, tappable, chained.
// Static / node only (the in-game frames are the PROOF files).  Last line: "P1 OK".
import fs from 'fs';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { sites, outerSites, pieces, wsLevel, wsSolids, WS_KINDS, NEW_KINDS, unlockOf, inClip } from '/home/claude/bot/bluebot_v2/bluewall/client/src/worksites.js';
import { townPlan, townLayout, prodSites, prodLots, planLots, townTargetSpecs, BUILT_ROLES } from '/home/claude/bot/bluebot_v2/bluewall/client/src/town_plan.js';
import { staticSolids } from '/home/claude/bot/bluebot_v2/bluewall/client/src/solids.js';
L.setMap('night'); buildRoads();
let bad = 0; const ok = (c, m, x = '') => { if (!c) { bad++; console.log('FAIL', m, x); } else console.log('ok  ', m, x); return c; };
const hyp = Math.hypot, KINDS10 = ['panning', 'smokehouse', 'sawmill', 'masonry', 'smelter', 'mint', 'refinery', 'mill', 'bakery', 'butcher'];
const E = JSON.parse(fs.readFileSync('/home/claude/dev/p1_kitext.json', 'utf8'));            // kit piece extents (gltf-transform, dequantised): { name: { x: [lo, hi], y, z } }
const E1 = JSON.parse(fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/docs/economy_table.json', 'utf8')).kinds.reduce((m, k) => (m[k.id] = k, m), {});
const S = sites(), O = outerSites(), T = S.filter((s) => s.town);

// ---- 1. every kind exists, at its unlock level, not before
ok(NEW_KINDS.length === 10 && KINDS10.every((k) => NEW_KINDS.includes(k)), 'the 10 new kinds are registered');
for (const k of KINDS10) {
  const of = S.filter((s) => s.kind === k), un = of.map(unlockOf), first = Math.min(...un.filter((u, i) => !(of[i].id === 'mill_wind1')));
  const e1 = E1[k].count_steps[0][0];
  ok(of.length > 0 && Object.keys(WS_KINDS).includes(k), `${k}: ${of.length} site(s) on the map [${of.map((s) => s.id + '@' + unlockOf(s)).join(' ')}]`);
  ok(first === e1, `${k}: the first site opens at E1's level ${e1}`, `(got ${first})`);
  ok(of.some((s) => wsLevel(s, e1) > 0) && of.every((s) => wsLevel(s, unlockOf(s) - 1) === 0), `${k}: present at level ${e1}, absent below its sites' levels`);
}
// E1 count steps (the i-th lot of a kind opens at steps[i]) for the town lots
for (const k of KINDS10.filter((q) => q !== 'panning')) { const tl = T.filter((s) => s.kind === k).map(unlockOf), st = E1[k].count_steps.map((q) => q[0]); ok(tl.every((u, i) => u === st[i]), `${k}: town lots open at E1's steps ${st.join('/')}`, `(${tl.join('/')})`); }

// ---- 2. mills: 2 water + 2 wind outside, >= 1 in the town, no duplicate of the legacy windmill
const mills = S.filter((s) => s.kind === 'mill'), mo = O.filter((s) => s.kind === 'mill'), mt = T.filter((s) => s.kind === 'mill');
ok(mo.filter((s) => s.variant === 'water').length === 2 && mo.filter((s) => s.variant === 'wind').length === 2, `outside the walls: 2 water + 2 wind mills`, mo.map((s) => s.id + ':' + s.variant).join(' '));
ok(mt.length >= 1, `inside the walls: ${mt.length} mill lot(s)`, mt.map((s) => s.id + ':' + s.variant).join(' '));
ok(mt.some((s) => s.variant === 'water') , 'a town mill on the canal (water variant)');
const wm = mo.find((s) => s.id === 'mill_wind1');
ok(wm && hyp(wm.x - L.WINDMILL.x, wm.z - L.WINDMILL.z) < 1, 'the legacy windmill spot IS wind mill 1', wm ? `${hyp(wm.x - L.WINDMILL.x, wm.z - L.WINDMILL.z).toFixed(2)} m` : '');
ok(mills.every((a, i) => mills.every((b, j) => i >= j || hyp(a.x - b.x, a.z - b.z) > 14)), 'no two mills on the same spot');
const bsrc = fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/client/src/buildings.js', 'utf8'), ssrc = fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/client/src/solids.js', 'utf8');
ok(/mill_wind1/.test(bsrc) && /mill_wind1/.test(ssrc), 'buildings.js / solids.js: the legacy live windmill + its solid are skipped when wind mill 1 stands there');
for (const s of mo.filter((q) => q.variant === 'water')) {                // the wheel faces the water, which is 15 m in front (local +z), the middle is dry
  const fx = Math.sin(s.ry), fz = Math.cos(s.ry), hw = L.height(s.water[0], s.water[1]);
  ok(hyp(s.water[0] - (s.x + fx * 15), s.water[1] - (s.z + fz * 15)) < 0.2 && hw < -0.6 && L.height(s.x, s.z) > 0.8, `${s.id}: water point 15 m in front (h ${hw.toFixed(2)}), dry middle (h ${L.height(s.x, s.z).toFixed(2)})`);
}
ok(mo.filter((q) => q.variant === 'wind').every((s) => L.height(s.x, s.z) > 1 && hyp(s.x, s.z) < L.MOUNT - 60), 'wind mills stand on dry open ground, off the mountain', mo.filter((q) => q.variant === 'wind').map((s) => s.id + ' h' + L.height(s.x, s.z).toFixed(1)).join(' '));

// ---- 3. town lots: built roles, every production lot (but the jeweler) is a site; the footprints of the drawn pieces stay in their lot, off the streets / water / other lots
const lay = townLayout(), P = townPlan().list, lots = P.filter((p) => p.role === 'P' && p.kind !== 'jeweler');
ok(BUILT_ROLES.has('P'), 'town_plan BUILT_ROLES has P');
ok(T.length === lots.length && lots.every((l) => T.some((s) => s.id === l.id)), `every production lot is a site (${T.length})`);
ok(planLots().length === P.filter((p) => BUILT_ROLES.has(p.role) && p.kind !== 'jeweler').length && !planLots().some((p) => p.kind === 'jeweler'), 'planLots keeps the generic houses off every built lot (the jeweler lot stays free)');
const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1; let t = ((px - ax) * dx + (pz - az) * dz) / l2; t = Math.max(0, Math.min(1, t)); return hyp(px - ax - dx * t, pz - az - dz * t); };
const polyD = (pts, x, z) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segD(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; };
const streetEdge = (x, z) => { let d = 1e9; for (const s of lay.streets) d = Math.min(d, polyD(s.pts, x, z) - s.w / 2); return d; };
const inRect = (r, x, z, shrink) => { const c = Math.cos(r.ry), s = Math.sin(r.ry), dx = x - r.x, dz = z - r.z, lx = dx * c - dz * s, lz = dx * s + dz * c; return Math.abs(lx) < r.w / 2 - shrink && Math.abs(lz) < r.d / 2 - shrink; };
const worst = { street: [], water: [], other: [], solid: [] };
for (const s of T) {
  const c = Math.cos(s.ry), sn = Math.sin(s.ry), own = P.find((p) => p.id === s.id);
  for (const p of pieces(s, 30)) {
    const e = E[p.n]; if (!e) continue;
    const yaw = s.ry + p.ry, cy = Math.cos(yaw), sy = Math.sin(yaw), ox = s.x + p.x * c + p.z * sn, oz = s.z - p.x * sn + p.z * c;
    for (let a = 0; a <= 4; a++) for (let b = 0; b <= 4; b++) {
      const lx = (e.x[0] + (e.x[1] - e.x[0]) * a / 4) * p.s, lz = (e.z[0] + (e.z[1] - e.z[0]) * b / 4) * p.s, wx = ox + lx * cy + lz * sy, wz = oz - lx * sy + lz * cy;
      if (streetEdge(wx, wz) < -0.2) worst.street.push(`${s.id}/${p.n}:${streetEdge(wx, wz).toFixed(1)}`);
      if (polyD(lay.river.pts, wx, wz) - lay.river.half < 0.2) worst.water.push(`${s.id}/${p.n}`);
      for (const q of P) if (q.id !== s.id && q.role !== 'S' && inRect(q, wx, wz, 1.0)) worst.other.push(`${s.id}/${p.n}->${q.id}`);
    }
  }
}
for (const k of ['street', 'water', 'other']) { const u = k === 'street' ? worst[k].slice(0, 6) : [...new Set(worst[k].map((q) => q.split(':')[0]))]; ok(u.length === 0, `no piece of a town production lot ${k === 'other' ? 'inside another lot (> 1 m)' : k === 'street' ? 'on a street' : 'in the river'}`, u.slice(0, 8).join(' ')); }
ok(T.every((s) => s.kind === 'refinery' || (pieces(s, unlockOf(s)).length >= 1 && pieces(s, 30).length >= 1)), 'every town lot draws a building from its unlock level to 30 (the refinery is procedural tanks)', T.map((s) => s.id + ':' + pieces(s, unlockOf(s)).length + '/' + pieces(s, 30).length).join(' '));
ok(T.every((s) => inClip(s.clip, 0, 0) || inClip(s.clip, TOWNA(s.kind).x, TOWNA(s.kind).z)), 'clip rectangles are around the anchor');
function TOWNA(k) { return { x: 0, z: -4 }; }

// ---- 4. solid (nav) + battle targets
const sol = wsSolids(), nearSolid = (s) => sol.filter(([x, z, r]) => hyp(x - s.x, z - s.z) < 40).length;
for (const k of KINDS10) ok(S.filter((s) => s.kind === k).every((s) => nearSolid(s) >= 1), `${k}: every site has standing solids for nav`, S.filter((s) => s.kind === k).map((s) => s.id + ':' + nearSolid(s)).join(' '));
ok(staticSolids().length >= sol.length, 'staticSolids() carries the worksite solids');
const spec = townTargetSpecs(30), ids = new Set(spec.flatMap((q) => q.ids));
ok(prodLots(30).length === T.length && prodLots(30).every((l) => ids.has(l.id)), 'every production lot is inside a battle target block', `${prodLots(30).length} lots, ${spec.length} blocks`);
ok(prodLots(10).every((l) => unlockOf(S.find((s) => s.id === l.id)) <= 10) && prodLots(10).length < prodLots(30).length, 'targets / lots follow the level (10 < 30)');

// ---- 5. level gating (castle 1 / 10 / 20 / 30)
const at = (lv) => KINDS10.map((k) => k + ':' + S.filter((s) => s.kind === k && wsLevel(s, lv) > 0).length).join(' ');
for (const lv of [1, 4, 10, 20, 30]) console.log('     level', lv, at(lv));
ok(S.filter((s) => s.kind === 'mint' && wsLevel(s, 10) > 0).length === 0 && S.filter((s) => s.kind === 'sawmill' && wsLevel(s, 10) > 0).length >= 1, 'level 10: the sawmill stands, the mint (15) does not');
ok(KINDS10.every((k) => S.some((s) => s.kind === k && wsLevel(s, 30) > 0)), 'level 30: all 10 kinds stand');

// ---- 6. tap boxes + tests wiring (static)
const wsrc = fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/client/src/world.js', 'utf8');
ok(/'ws:' \+ q\.id/.test(wsrc) && /tids: ctx\.townTids/.test(wsrc), 'world.js registers ctx.pick(..., "ws:<site id>") for every site and passes the town target ids to the worksites');
ok(new Set(S.map((s) => s.id)).size === S.length, 'site ids are unique', `${S.length} sites`);
const bt = JSON.parse(fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json', 'utf8')).targets, boxes = bt.filter((t) => t.type === 'house');
const inBox = (l) => boxes.some((t) => Math.abs(l.x - t.x) <= t.w / 2 + 0.6 && Math.abs(l.z - t.z) <= t.d / 2 + 0.6), lots30 = prodLots(30), miss = lots30.filter((l) => !inBox(l));
ok(lots30.length >= 15 && miss.length === 0, `basetargets.json was regenerated with the production lots (every one of the ${lots30.length} production lots lies inside a house block target of the file; ${bt.length} targets)`, miss.map((l) => l.id).join(','));
ok(/castle: castleLevel\(levelOf\('keep'\)\)/.test(wsrc) && /worksites\.rebuild\(castleLevel\(levelOf\('keep'\)\)\)/.test(wsrc) && /wsLife\.refresh\(castleLevel\(levelOf\('keep'\)\)\)/.test(wsrc), 'worksites + wslife read the 1..30 castle level (castleLevel(levelOf)), not the stretched 1..20 one (E1 unlock levels are on 1..30)');
console.log(bad ? `P1 FAIL (${bad})` : 'P1 OK');
