// c4_kinds_test.js — C4 (food family) contract: every kind has fa / role / in / out / unlock, every piece name exists in its kit (kit_c4.glb / kit_ws.glb), counts never decrease with the level,
// BUILD is deterministic, the mill has its wind / water variants (water needs the shore), the turning parts + chimney points + procedural parts are sane.   Prints "C4 OK".
import fs from 'fs';
import * as C4 from '../bot/bluebot_v2/bluewall/client/src/c4_kinds.js';
import { pieces, counts, placeRule, WS_KINDS } from '../bot/bluebot_v2/bluewall/client/src/worksites.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } else console.log('ok  ', m); };
const names = (f) => { const b = fs.readFileSync(f); const len = b.readUInt32LE(12); const j = JSON.parse(b.slice(20, 20 + len).toString('utf8')); return new Set(j.nodes.map((n) => n.name)); };
const A = '/home/claude/bot/bluebot_v2/bluewall/web/assets/', KC4 = names(A + 'kit_c4.glb'), KWS = names(A + 'kit_ws.glb');
const have = (n) => (n.startsWith('c4_') ? KC4.has(n) : KWS.has(n));
const KINDS = ['farm', 'greenhouse', 'livestock', 'slaughter', 'mill', 'bakery', 'butcher'], LV = [1, 2, 5, 9, 10, 11, 15, 20, 22, 25, 30];
const site = (kind, variant) => ({ id: 't_' + kind + (variant || ''), kind, x: 123.4, z: -87.6, ry: 0.7, r: C4.KINDS[kind].r || 24, ...(variant ? { variant } : {}) });
const variants = (k) => (k === 'mill' ? ['wind', 'water'] : [undefined]);
// 1. the contract of every kind
for (const k of KINDS) { const K = C4.KINDS[k]; ok(!!K && typeof K.fa === 'string' && K.fa.length > 0 && ['S', 'P', 'S/P', 'T', 'H', 'C'].includes(K.role) && 'in' in K && 'out' in K && typeof K.out === 'string' && Number.isFinite(K.unlock) && typeof K.paint === 'string', `${k}: fa / role / in / out / unlock / paint (${K && K.fa} ${K && K.role} ${K && K.in}->${K && K.out} lv ${K && K.unlock})`); }
ok(['mill', 'bakery', 'butcher'].every((k) => C4.KINDS[k].inTown === true), 'mill / bakery / butcher are inTown');
ok(C4.KINDS.mill.role === 'P' && C4.KINDS.bakery.role === 'P' && C4.KINDS.butcher.role === 'P' && C4.KINDS.slaughter.role === 'S/P', 'roles: mill / bakery / butcher = P, slaughter = S/P');
ok(C4.KINDS.mill.in === 'wheat' && C4.KINDS.mill.out === 'flour' && C4.KINDS.bakery.in === 'flour' && C4.KINDS.bakery.out === 'bread' && C4.KINDS.butcher.in === 'livestock' && C4.KINDS.butcher.out === 'meat' && C4.KINDS.slaughter.out === 'carcasses', 'chain: wheat -> flour -> bread, livestock -> carcasses / meat');
ok(C4.KINDS.farm.unlock === 3 && C4.KINDS.livestock.unlock === 5 && C4.KINDS.slaughter.unlock === 9 && C4.KINDS.greenhouse.unlock === 11 && C4.KINDS.mill.unlock === 4 && C4.KINDS.bakery.unlock === 5 && C4.KINDS.butcher.unlock === 7, 'unlock levels = the placeholders of the brief (ph)');
for (const k of ['farm', 'greenhouse', 'livestock', 'slaughter']) ok(WS_KINDS[k].role === C4.KINDS[k].role && WS_KINDS[k].fa === C4.KINDS[k].fa && WS_KINDS[k].unlock === C4.KINDS[k].unlock, `${k}: worksites.WS_KINDS carries role / in / out and the same fa / unlock`);
// 2. the mill variants
ok(C4.KINDS.mill.variants && C4.KINDS.mill.variants.wind && C4.KINDS.mill.variants.water, 'mill has the variants wind + water');
ok(C4.KINDS.mill.variants.water.place === 'water' && C4.KINDS.mill.variants.wind.place === 'free', 'water mill: place water; wind mill: place free');
ok(placeRule(site('mill', 'water')) === 'water' && placeRule(site('mill', 'wind')) === 'free' && placeRule(site('bakery')) === 'free' && placeRule({ kind: 'fishery' }) === 'water', 'worksites.placeRule: water mill -> water, wind mill / bakery -> free, fishery unchanged');
const pw = pieces(site('mill', 'wind'), 15).map((p) => p.n), pa = pieces(site('mill', 'water'), 15).map((p) => p.n);
ok(pw.includes('c4_windmill_nf') && !pw.includes('c4_watermill_nw') && pa.includes('c4_watermill_nw') && !pa.includes('c4_windmill_nf'), 'wind mill stands on windmill pieces, water mill on watermill pieces');
// 3. every piece exists in its kit, finite numbers, local footprint; MORE pieces with the level
for (const k of KINDS) for (const v of variants(k)) {
  const s = site(k, v); let prev = -1, allHave = true, finite = true, local = true;
  for (const lv of LV) {
    const ps = pieces(s, lv);
    for (const p of ps) { if (!have(p.n)) { allHave = false; console.log('  missing piece', p.n, 'in', k, lv); } if (![p.x, p.z, p.ry, p.s].every(Number.isFinite) || !(p.s > 0)) finite = false; if (Math.hypot(p.x, p.z) > 36) local = false; }
    if (ps.length < prev) allHave = false; prev = ps.length;
  }
  ok(allHave, `${k}${v ? ' ' + v : ''}: every piece name exists in kit_c4 / kit_ws at every level, never fewer pieces with the level`);
  ok(finite && local, `${k}${v ? ' ' + v : ''}: pieces are finite and local to the site (<= 36 m)`);
  ok(pieces(s, 30).length > pieces(s, 1).length, `${k}${v ? ' ' + v : ''}: more pieces at 30 (${pieces(s, 30).length}) than at 1 (${pieces(s, 1).length})`);
  // BUILD deterministic
  ok(JSON.stringify(pieces(s, 17)) === JSON.stringify(pieces(s, 17)) && JSON.stringify(pieces(s, 30)) === JSON.stringify(pieces(s, 30)), `${k}${v ? ' ' + v : ''}: BUILD deterministic`);
}
// 4. counts never decrease; the life really grows
for (const k of KINDS) for (const v of variants(k)) {
  const s = site(k, v); let good = true, prev = {};
  for (const lv of LV) { const c = counts(s, lv); for (const key of Object.keys(prev)) if (!(c[key] >= prev[key])) { good = false; console.log('  decreases', k, key, lv, prev[key], '->', c[key]); } if (Object.values(c).some((x) => !Number.isFinite(x))) good = false; prev = c; }
  const c1 = counts(s, 1), c30 = counts(s, 30); const grew = ['workers', 'carts'].every((key) => c30[key] > c1[key]) && Object.keys(c30).length >= 3;
  ok(good, `${k}${v ? ' ' + v : ''}: counts never decrease with the level`); ok(grew, `${k}${v ? ' ' + v : ''}: workers + carts grow (${JSON.stringify(c1)} -> ${JSON.stringify(c30)})`);
  ok(JSON.stringify(C4.counts(k, 15, s)) === JSON.stringify(counts(s, 15)), `${k}: worksites.counts == c4_kinds.counts`);
}
ok(Object.keys(counts(site('bakery'), 0)).length === 0, 'level 0 (locked) -> no life');
// 5. turning parts, chimney points
const mv = (k, v, lv) => C4.movers(k, lv, site(k, v));
ok(mv('mill', 'wind', 1).length === 1 && mv('mill', 'wind', 15).length === 2 && mv('mill', 'wind', 30).length === 3, 'wind mill: 1 / 2 / 3 turning sails at level 1 / 15 / 30');
ok(mv('mill', 'water', 1).length === 1 && mv('mill', 'water', 30).every((m) => m.n === 'c4_wheel'), 'water mill: one turning wheel');
ok(['mill'].every(() => [...mv('mill', 'wind', 30), ...mv('mill', 'water', 30)].every((m) => KC4.has(m.n) && Number.isFinite(m.spin) && m.spin !== 0)), 'turning parts exist in the kit and have a spin speed');
ok(C4.movers('bakery', 30, site('bakery')).length === 0, 'the other kinds have no turning parts');
const sm = (k, lv) => C4.smokers(k, lv, site(k)), cnt = (k, lv) => sm(k, lv).length;
ok(cnt('bakery', 1) === 2 && cnt('bakery', 15) === 3 && cnt('bakery', 30) === 4 && sm('bakery', 30).every((p) => [p.x, p.y, p.z].every(Number.isFinite) && p.y > 3), 'bakery smoke: house chimney + one flue per oven (2 / 3 / 4 columns)');
// 6. procedural parts run on a recording maker
for (const k of ['bakery', 'butcher', 'slaughter', 'mill']) for (const v of variants(k)) for (const lv of [1, 15, 30]) {
  let n = 0; const rec = () => { n++; }, M = { S: {}, Gl: {}, Oil: {}, box: rec, cyl: rec, disc: rec, gquad: rec, P3: () => [0, 0, 0], F: {} };
  let seed = 1; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let threw = null; try { C4.PROC[k](M, lv, R, site(k, v)); } catch (e) { threw = e; }
  if (lv === 30 || threw) ok(!threw && n > 0, `${k}${v ? ' ' + v : ''} lv ${lv}: PROC draws ${n} primitives${threw ? ' — ' + threw : ''}`);
}
console.log(bad ? `C4 FAIL (${bad})` : 'C4 OK');
