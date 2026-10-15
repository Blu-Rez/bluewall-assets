// bt1r2_static.mjs - BT1_R2 static checks (node): the swap table, the camp slot table and the pure slot maths.  Prints one JSON line {fails: [...], info: {...}}.
import { SWAP_TABLE, swapKeys, checkRow, slotReport } from '../bot/bluebot_v2/bluewall/client/src/unit_swap.js';
import { CAMP_TABLE, SLOT_KINDS, TENT_KINDS, checkCampTable, squadKinds, tentSlots, bannerSlot, palisadeSlots } from '../bot/bluebot_v2/bluewall/client/src/camp_slots.js';
import DEFS from '../bot/bluebot_v2/bluewall/client/src/unitdefs.json';
const fails = [], info = {}; const bad = (m) => fails.push(m);
// ---- 1. the swap table: one row (slot) for every unit key of the game
const need = [...DEFS.order, 'e_guard', 'e_archer', 'e_hill', 'e_baby', 'e_dragon', 'e_giant'];
const keys = swapKeys(SWAP_TABLE); info.unitKeys = need.length; info.rows = keys.length;
for (const k of need) if (!keys.includes(k)) bad('swap table has no row for unit key ' + k);
for (const k of keys) if (!need.includes(k)) bad('swap table row ' + k + ' is not a unit key of the game');
const rep = slotReport(need, SWAP_TABLE); for (const [k, r] of Object.entries(rep)) if (r.problems.length) bad('swap row ' + k + ': ' + r.problems.join('; '));
info.filled = keys.filter((k) => SWAP_TABLE.units[k].model).length;
// the row validator itself: bad rows are refused, good rows pass
const good = { model: 'x_y', anims: 'anims', h: 4.6, yaw: 0, clips: { idle: 'Idle', run: ['Run'] }, ref: 2, lod2: { cloth: 0x112233 } };
if (checkRow('t', good).length) bad('checkRow refuses a good row: ' + checkRow('t', good));
for (const [n, r] of Object.entries({ 'path in model': { ...good, model: '../x' }, 'h = 0': { ...good, h: 0 }, 'yaw text': { ...good, yaw: 'a' }, 'unknown clip slot': { ...good, clips: { fly: 'x' } }, 'h without a model': { model: null, h: 3, yaw: 0 }, 'empty clip list': { ...good, clips: { idle: [] } }, 'lod2 not a number': { ...good, lod2: { cloth: 'red' } }, 'no row': null })) {
  if (!checkRow('t', r).length) bad('checkRow accepts a bad row: ' + n);
}
// ---- 2. the camp slot table
const cb = checkCampTable(CAMP_TABLE); for (const m of cb) bad('camp table: ' + m);
for (const k of SLOT_KINDS) if (!CAMP_TABLE.kinds[k]) bad('camp table has no kind ' + k);
info.tentKinds = TENT_KINDS.length; info.slotKinds = SLOT_KINDS.length;
if (TENT_KINDS.length < 4) bad('fewer than 4 tent kinds');
for (const k of SLOT_KINDS) { const n = CAMP_TABLE.kinds[k] && CAMP_TABLE.kinds[k].note; if (!n || !/\d+(\.\d+)? ?m\b/.test(n)) bad('kind ' + k + ': the note must carry the size in metres (the needs-Tripo list)'); }
const neg = (t, f) => { const c = JSON.parse(JSON.stringify(CAMP_TABLE)); f(c); return checkCampTable(c); };
if (!neg(1, (c) => { c.kinds.command.model = 'tent_cmd'; }).length) bad('camp: a model without h / r is accepted');
if (!neg(1, (c) => { c.kinds.palisade.model = 'fence'; c.kinds.palisade.h = 2.4; c.kinds.palisade.len = 0; }).length) bad('camp: a palisade without len is accepted');
if (!neg(1, (c) => { c.byFam.barracks = 'banner'; }).length) bad('camp: byFam -> a non-tent kind is accepted');
if (neg(1, (c) => { c.kinds.command.model = 'tent_cmd'; c.kinds.command.h = 6; c.kinds.command.r = 5; }).length) bad('camp: a complete model row is refused');
// ---- 3. which tent kind each squad gets, and the pure slot maths
const squads = DEFS.order.map((t, i) => ({ t, n: 1 + ((i * 7) % 23) })), kinds = squadKinds(squads, CAMP_TABLE);
if (kinds.length !== squads.length) bad('squadKinds: wrong length');
for (const k of kinds) if (!TENT_KINDS.includes(k)) bad('squadKinds gave ' + k);
if (kinds.filter((k) => k === 'command').length !== 1) bad('exactly one command tent expected, got ' + kinds.filter((k) => k === 'command').length);
const bi = squads.reduce((m, q, i) => (q.n > squads[m].n ? i : m), 0); if (kinds[bi] !== 'command') bad('the biggest squad does not pitch the command tent');
info.kindsUsed = [...new Set(kinds)].sort();
if (squadKinds([{ t: 'spear', n: 5 }], { ...CAMP_TABLE, commandRule: null })[0] === 'command') bad('commandRule null still gives a command tent');
const at = (l, b) => [100 + l * 0.6 - b * 0.8, 50 + l * 0.8 + b * 0.6], items = squads.map((q, i) => ({ i, l: i * 9 - 130, b: 40 + (i % 3) * 8, yaw: i * 0.4, k: 1.2, r: 5 }));
const ts = tentSlots({ items, at, frameYaw: 0.7, kinds, squads });
if (ts.length !== squads.length) bad('tentSlots: not one tent per squad'); for (const t of ts) { if (![t.x, t.z, t.ry].every(Number.isFinite)) bad('tentSlots: non-finite record'); if (!SLOT_KINDS.includes(t.kind)) bad('tentSlots: kind ' + t.kind); }
const bs = bannerSlot({ pole: { l: 3, b: 30 }, at, frameYaw: 0.7 }); if (bs.kind !== 'banner' || !Number.isFinite(bs.x)) bad('bannerSlot');
const rect = { l0: -140, l1: 150, b0: 20, b1: 80 }, ps = palisadeSlots({ rect, at, frameYaw: 0.7, len: 4 });
if (!ps.length) bad('palisadeSlots: none'); for (const p of ps) { if (p.l < rect.l0 || p.l > rect.l1 || p.b < rect.b0 || p.b > rect.b1) bad('palisade slot outside the rect'); }
const blk = palisadeSlots({ rect, at, frameYaw: 0, len: 4, blocked: () => true }); if (blk.length) bad('palisadeSlots ignores blocked()');
info.palisadeSlots = ps.length;
console.log(JSON.stringify({ fails, info }));
