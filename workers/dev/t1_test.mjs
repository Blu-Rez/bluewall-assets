// T1 unit test: the registry + every sheet spec with a stub state.  Run by dev/t1_test.sh (bundled for node first).
import assert from 'node:assert/strict';
// the bundle imports modules that look at the browser at load time: give them a tolerant stub
const noop = () => {}; const el = () => new Proxy(function () {}, { get: (t, k) => (k === 'style' ? {} : k === 'getContext' ? () => null : k === Symbol.toPrimitive ? () => '' : noop), apply: () => el() });
globalThis.window = globalThis; globalThis.self = globalThis;
globalThis.document = { createElement: el, createElementNS: el, head: { appendChild: noop }, body: { appendChild: noop }, documentElement: { style: {} }, addEventListener: noop, querySelector: () => null, fonts: { load: async () => [] } };
try { globalThis.navigator = globalThis.navigator || { userAgent: 'node', maxTouchPoints: 0 }; } catch (e) { /* node 22 has a read-only navigator */ }
globalThis.localStorage = { getItem: () => null, setItem: noop, removeItem: noop }; globalThis.addEventListener = noop; globalThis.matchMedia = () => ({ matches: false, addEventListener: noop, addListener: noop });
globalThis.requestAnimationFrame = (f) => setTimeout(f, 0); globalThis.devicePixelRatio = 1; globalThis.innerWidth = 390; globalThis.innerHeight = 844; globalThis.location = { search: '', hash: '', href: '' };
const M = await import(process.argv[2]);
const { resolveSheet, registerSheet } = M;
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const SM = { keep: 'keep', wall: 'wall', gate: 'wall', tower: 'wall', barracks: 'barracks', forge: 'forge', training: 'training', stable: 'stable', workshop: 'workshop', lair: 'lair', archer: 'towers', vault_ruby: 'vault_ruby', vault_emerald: 'vault_emerald', vault_turq: 'vault_turq' };
// ---- resolution: exact id -> SM -> prefix; unmapped = null (today's behaviour)
for (const id of ['keep', 'wall', 'gate', 'tower', 'archer', 'barracks', 'training', 'stable', 'workshop', 'lair', 'forge', 'vault_ruby', 'mine_ruby', 'mine_turq', 'ws:fishery', 'ws:lumber1', 'home:7', 'civic:2']) ok(resolveSheet(id, SM), 'resolves ' + id);
for (const id of ['well', 'market', 'house', 'camp']) ok(resolveSheet(id, SM).spec.label, 'label ' + id);
for (const id of ['giant', 'cow', 'dragon', 'nothing', null, '']) ok(!resolveSheet(id, SM), 'unmapped ' + id);
ok(resolveSheet('gate', SM).id === 'wall' && resolveSheet('tower', SM).id === 'wall' && resolveSheet('archer', SM).id === 'towers', 'SM aliases land on the struct id');
ok(resolveSheet('mine_ruby', SM).id === 'mine_ruby' && resolveSheet('ws:iron', SM).id === 'ws:iron', 'prefix keeps the full id');
registerSheet('zz:', { title: () => ({}) }); registerSheet('zz:long:', { title: () => ({ long: 1 }) });
ok(resolveSheet('zz:long:1').spec.title().long === 1, 'longest prefix wins');
// ---- stub state
const TIERS = [['Wood'], ['Stone'], ['Iron'], ['Gold'], ['Diamond'], ['Crystal']];
let calls = []; const have = { ruby: 900, emerald: 900, turq: 120 };
const nx = (to, ok = true, why) => ({ ok, to, cost: { ruby: 100, emerald: 50 }, dur: 3600, why, info: { need_keep: 9 } });
const structs = { keep: { lv: 12, up: null, next: nx(13) }, wall: { lv: 10, up: null, next: nx(11, false, 'cap') }, forge: { lv: 5, up: { to: 6, end: 1000 + 600, dur: 1200, rush: 80, rush_cut: 0, rush_full: true }, next: null },
  barracks: { lv: 8, up: null, next: nx(9) }, mine_ruby: { lv: 4, up: null, next: nx(5) }, vault_ruby: { lv: 3, up: null, next: nx(4) }, towers: { lv: 3, up: null, next: nx(4) }, training: { lv: 3, up: null, next: nx(4) } };
const up = { info: (e) => { const r = structs[e]; if (!r) return null; return { name: e, desc: 'desc ' + e, r, p: {}, tier: TIERS[2], btn: !r.up && r.next ? { label: r.next.ok ? 'Upgrade to Lv ' + r.next.to : 'Castle Lv 9', dis: !r.next.ok, cls: '' } : null, have, now: 1000 }; }, act: async (op, e) => { calls.push(['act', op, e]); }, focus: (e) => calls.push(['focus', e]) };
const army = { trainOne: (u) => { calls.push(['train', u]); return true; }, why: (u) => (u === 'sword' ? 'Not enough gems' : null) };
const spear = Object.keys((await import('node:fs')).readFileSync ? {} : {});
const unitdefs = JSON.parse((await import('node:fs')).readFileSync(process.argv[3], 'utf8'));
const famOf = (f) => unitdefs.order.filter((u) => unitdefs.units[u].fam === f);
const econ = { st: { level: 30, prog: { b: { keep: 12 } }, gems: have, vault: { ruby: 1000, emerald: 1000, turq: 1000 }, mines: { ruby: { rate: 120, cap: 400, last: 0 } },
  army: { fam: Object.fromEntries(['barracks', 'training', 'stable', 'workshop', 'lair'].map((f) => [f, { lv: 8, cap: 40, used: 12, q: f === 'barracks' ? [{ u: famOf('barracks')[0], n: 3, t: 10, fin: 1030 }] : [] }])), units: Object.fromEntries(unitdefs.order.map((u, i) => [u, { open: i % 2 === 0, n: 1 }])) } },
  now: () => 1000, ready: () => 150, room: () => 400, collect: async (g) => { calls.push(['collect', g]); return 150; } };
const c = { econ, ui: { toast() {}, haptic() {} }, up, army, afterCollect: () => calls.push(['after']), now: () => 1000, toast: (m) => calls.push(['toast', m]), sel: {}, close: () => calls.push(['close']), rush: (e, u) => calls.push(['rush', e]), cancel: (e) => calls.push(['cancel', e]) };
const spec = (id) => resolveSheet(id, SM);
const full = (id) => { const r = spec(id), s = r.spec; ok(!s.ok || s.ok(r.id, c), 'ok ' + id); return { T: s.title(r.id, c), St: s.state(r.id, c), P: s.primary ? s.primary(r.id, c) : null, B: s.secondary ? s.secondary(r.id, c) : null, body: s.body ? s.body(r.id, c) : '', info: s.info ? s.info(r.id, c) : '', mng: s.manage ? s.manage(r.id, c) : null, id: r.id }; };
// keep: Upgrade primary, starts the upgrade through upgradeui
let F = full('keep'); ok(F.P.kind === 'pri' && /Upgrade to Lv 13/.test(F.P.label) && !F.P.dis, 'keep primary = Upgrade'); await F.P.run(); ok(calls.some((x) => x[0] === 'act' && x[1] === 'start' && x[2] === 'keep'), 'keep upgrade calls upgradeui.act'); F.mng(); ok(calls.some((x) => x[0] === 'focus' && x[1] === 'keep'), 'Manage = the full page');
// wall (via the gate): disabled with the reason
F = full('gate'); ok(F.id === 'wall' && F.P.dis && F.P.why === 'Castle Lv 9' && F.P.sub, 'wall disabled with a reason');
// forge while upgrading: Rush (premium, hold) + Cancel
F = full('forge'); ok(F.P.kind === 'prem' && F.P.hold && !F.P.dis && F.B.label === 'Cancel' && F.St.code === 'building', 'forge upgrading -> Rush + Cancel'); await F.P.run(); ok(calls.some((x) => x[0] === 'rush'), 'rush goes through the confirm path'); await F.B.run(); ok(calls.some((x) => x[0] === 'cancel'), 'cancel goes through the confirm path');
// barracks: Train queues through armyui, secondary = Upgrade
F = full('barracks'); ok(/^Train /.test(F.P.label) && !F.P.dis && F.St.code === 'working' && F.B.label === 'Upgrade' && /data-u=/.test(F.body), 'barracks: Train + chips + Upgrade'); await F.P.run(); ok(calls.some((x) => x[0] === 'train'), 'Train calls armyui.trainOne');
c.sel.barracks = famOf('barracks').find((u) => u === 'sword' || false) || c.sel.barracks;
// mine: Collect pays through econ.collect
F = full('mine_ruby'); ok(F.P.label === 'Collect' && !F.P.dis && F.B.label === 'Upgrade', 'mine: Collect + Upgrade'); await F.P.run(); ok(calls.some((x) => x[0] === 'collect' && x[1] === 'ruby') && calls.some((x) => x[0] === 'after'), 'Collect calls econ.collect + badge refresh');
const e0 = econ.ready; econ.ready = () => 0; F = full('mine_ruby'); ok(F.P.dis && F.P.why === 'Nothing to collect yet', 'mine empty -> reason'); econ.ready = e0; econ.room = () => 0; F = full('mine_ruby'); ok(F.P.dis && /Vault full/.test(F.P.why), 'vault full -> reason'); econ.room = () => 400;
F = full('vault_ruby'); ok(F.P.label === 'Collect' && /Stored/.test(F.St.text), 'vault: Collect + capacity');
// town: ws / home / civic
F = full('ws:fishery'); ok(/Fishery/.test(F.T.name) && /Output/.test(F.body) && F.P.label === 'Upgrade Castle', 'site sheet'); F = full('home:3'); ok(/Family/.test(F.body) && F.P.label === 'Upgrade Castle', 'house sheet'); F = full('civic:1'); ok(F.T.name && F.P.label === 'Upgrade Castle', 'civic sheet');
await F.P.run(); ok(calls.some((x) => x[0] === 'focus' && x[1] === 'keep'), 'Upgrade Castle opens the keep row');
console.log('T1 unit: ' + n + ' checks');
