// ly1_test.js — LY1: the REAL client modules (layout_rules / layout_store / layout_live / layout_sync / layout_wire / layout_text) against the REAL local server (dev/ly1_server.py, memory state), with network latency.
// Last line: "LY1 OK".  (bash dev/ly1_test.sh starts the server on its own port.)
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import * as LS from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_store.js';
import * as RULES from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_rules.js';
import { createLayoutLive } from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_live.js';
import { createLayoutSync } from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_sync.js';
import { createLayoutWire } from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_wire.js';
import { nameOfId, whyText, droppedText, rejectedText } from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_text.js';
import { registerTownTargets } from '/home/claude/bot/bluebot_v2/bluewall/client/src/town_build.js';
L.setMap('night');
const mem = new Map(); globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const realFetch = globalThis.fetch, BASE = process.env.LY1_BASE || 'http://127.0.0.1:8597'; let latIn = 0, latOut = 0; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fetchLog = []; let failNext = 0;
globalThis.fetch = async (url, opt = {}) => { const o = { ...opt }; delete o.signal; if (failNext > 0) { failNext--; throw new Error('net down'); } if (latIn) await sleep(latIn); const r = await realFetch(BASE + url, o); if (latOut) await sleep(latOut); fetchLog.push([o.method || 'GET', r.status]); return r; };
let nBad = 0, nOk = 0; const say = (ok, name, extra = '') => { if (ok) nOk++; else nBad++; console.log((ok ? 'OK   ' : 'FAIL ') + name + (extra !== '' ? '   ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 220) : '')); };
const LEVEL = 50, ctx = { targets: [], tgt(t) { const id = ctx.targets.length + 1; ctx.targets.push({ id, ...t }); return id; }, B: { bid() {} }, town: { gen: [] } };
const tids = registerTownTargets(ctx, LEVEL); ctx.townTids = tids;
const world = { ctx, layoutParts: { ctx, height: L.height, picks: [], castle: () => LEVEL }, stores: { rebuild: () => 0 }, get targets() { return ctx.targets; } };
const live = createLayoutLive(world), G = live.geom(); world.layout = live;
const reset = () => { LS.clearAll(); mem.clear(); live.load({ v: 1, m: {} }); live.flush(); };
const raw = async (uid, method, body) => { const r = await realFetch(BASE + '/api/layout', { method, headers: { Authorization: 'Bearer ' + uid, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); return [r.status, await r.json().catch(() => null)]; };
const srvRec = async (uid) => { const [, j] = await raw(uid, 'GET'); return j && j.layout ? j.layout : null; };
const srvIds = async (uid) => { const l = await srvRec(uid); return l ? Object.keys(l.m).sort() : []; };
const ids = () => Object.keys(live.save().m).sort();
const rnd = (() => { let s = 20261017; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
const findSpot = (r, R = 30, rot = 0) => { const all = live.records(); for (let k = 0; k < 4000; k++) { const a = rnd() * 6.283, d = 4 + rnd() * R, pose = LS.quant(Math.round(r.x + Math.cos(a) * d), Math.round(r.z + Math.sin(a) * d), r.ry + rot * Math.PI / 12); if (RULES.checkPose(G, r, pose, all, { first: true }).ok && RULES.checkPose(G, r, pose, all).ok) return pose; } return null; };
const move = (id, R = 30, rot = 0) => { const r = live.records().find((q) => q.id === id), p = findSpot(r, R, rot); if (!p) return null; const res = live.commit(id, p); live.flush(); return res.ok ? p : null; };
const env = (uid, { gap, battle = () => false } = {}) => {                           // main.js lines 453-455, through layout_wire.js
  const econ = { token: String(uid), subs: new Set(), on(f) { this.subs.add(f); }, emit(ev) { for (const f of this.subs) f({}, ev); } }, toasts = [], notes = [], stats = [];
  const ui = { toast: (m) => toasts.push(m) }, layoutUI = { active: false, notice: (m) => notes.push(m), setStatus: (s) => stats.push(s) };
  const wire = createLayoutWire({ econ, world, ui, battleOn: battle, gap }); wire.attach(layoutUI);
  return { econ, wire, sync: wire.sync, ui, toasts, notes, stats, layoutUI };
};
const THINGS = live.records().map((r) => r.id), HOMES = live.records().filter((r) => r.kind === 'cottage' || r.kind === 'craftsman' || r.kind === 'merchant' || r.kind === 'noble').map((r) => r.id);
console.log('things', THINGS.length, 'homes', HOMES.length);

// ================================================================ 1. no rule, no rate limit, no size limit rejects an honest move
{
  reset(); let sent = 0, kept = 0, dropped = 0, maxBytes = 0, bad = [], t0 = Date.now();
  for (let round = 0; round < 40; round++) {
    reset(); const k = [1, 2, 3, 5, 8, 12, 20, 30][round % 8]; const pick = new Set();
    while (pick.size < k) pick.add(THINGS[Math.floor(rnd() * THINGS.length)]);
    for (const id of pick) move(id, 10 + rnd() * 50, Math.floor(rnd() * 24));
    const rec = live.save(); maxBytes = Math.max(maxBytes, LS.sizeOf(rec)); const [s, j] = await raw(3000 + round, 'POST', { layout: rec }); sent += Object.keys(rec.m).length;
    if (s !== 200 || (j.dropped || []).length || Object.keys(j.layout.m).length !== Object.keys(rec.m).length) { dropped += (j && j.dropped || []).length; bad.push([round, s, j && j.dropped, j && j.reasons]); } else kept += Object.keys(j.layout.m).length;
  }
  say(bad.length === 0 && sent > 150, `an honest move (checked by the client's 12 rules) is never refused: 40 records, ${sent} moved things, ${kept} kept, ${dropped} dropped by the real server (${Date.now() - t0} ms)`, bad.slice(0, 2));
  // the worst case: ALL 88 things moved by one tiny step each
  reset(); let n = 0; for (const id of THINGS) { if (move(id, 6)) n++; }
  const rec = live.save(), bytes = LS.sizeOf(rec); const [s, j] = await raw(3500, 'POST', { layout: rec });
  say(s === 200 && !(j.dropped || []).length && bytes < 8192, `all ${n} things moved at once: ${bytes} bytes (limit 8192), 200, nothing dropped`, { s, dropped: j && j.dropped, reasons: j && j.reasons });
  say(bytes * 2 < 8192, `…and the limit is far away (a record with every one of the 88 things moved is ${Math.round((bytes / 8192) * 100)}% of 8 KB)`);
}

// ================================================================ 2. the owner's «moved house is removed later»: a GET that was answered before the newest POST must not wipe it (E1)
{
  reset(); const uid = 4001, E = env(uid);
  const A = HOMES[1], B = HOMES[2], C = HOMES[3];
  move(A); await E.sync.save(live.save()); say(JSON.stringify(ids()) === JSON.stringify([A].sort()) && (await srvIds(uid)).join() === [A].join(), 'A moved and saved: client = server');
  move(B); latIn = 1200; const slow = E.sync.save(live.save()); latIn = 0;                    // POST {A,B} is on its way (1.2 s)
  await sleep(100); E.econ.emit('load'); await sleep(300);                                    // the game re-reads the state (back from a break / a timed-out write): GET arrives first, the server still has only {A}
  say(ids().join() === [A, B].sort().join(), 'E1: during the slow POST the screen keeps A and B (the older GET answer is ignored)', ids());
  await slow; await sleep(300);
  say(ids().join() === [A, B].sort().join() && (await srvIds(uid)).join() === [A, B].sort().join(), 'E1: after the answer: client = server = {A, B}', { client: ids(), server: await srvIds(uid) });
  move(C); await E.sync.save(live.save());
  say(ids().join() === [A, B, C].sort().join() && (await srvIds(uid)).join() === [A, B, C].sort().join(), 'E1: the next ordinary move keeps all three (it used to lose B)', { client: ids(), server: await srvIds(uid) });
  // a GET answer that arrives AFTER the player edited again
  move(HOMES[4]); latIn = 800; const g = E.sync.load(); latIn = 0; await sleep(150); move(HOMES[5]); const got = await g;
  say(got === null, 'a GET that was on its way while the player moved another house answers «keep what is on screen» (null)', got && Object.keys(got.m || {}));
  await E.sync.save(live.save()); say((await srvIds(uid)).length === 5 && ids().length === 5, 'and everything is saved: 5 houses on both sides', { client: ids().length, server: (await srvIds(uid)).length });
}

// ================================================================ 3. two quick moves: one POST at a time, in order, under the rate limit
{
  reset(); const uid = 4002, E = env(uid); fetchLog.length = 0; const t0 = Date.now(); let last = null;
  for (let i = 0; i < 9; i++) { move(HOMES[10 + i], 30); last = E.sync.save(live.save()); await sleep(250); }                // 9 moves in ~2.3 s: the server allows 5 in 5 s
  await last; for (let k = 0; k < 30 && E.sync.busy; k++) await sleep(300);
  const n429 = fetchLog.filter((x) => x[1] === 429).length, posts = fetchLog.filter((x) => x[0] === 'POST').length;
  say(n429 === 0, `9 moves in 2.3 s: the client keeps itself under the server's limit (${posts} POSTs, ${n429} answers 429)`);
  say((await srvIds(uid)).join() === ids().join() && ids().length >= 5, `the server ends with all ${ids().length} moves`, { client: ids().length, server: (await srvIds(uid)).length });
  // the limit is hit anyway (another tab / device of the same player used the budget): the 429 is not a lost move, it is sent again later
  reset(); const uid2 = 4003, E2 = env(uid2); for (let i = 0; i < 5; i++) await raw(uid2, 'POST', { layout: { v: 1, m: {} } });
  for (let i = 20; i < 40 && !ids().length; i++) move(HOMES[i], 30); fetchLog.length = 0; await E2.sync.save(live.save());
  say(fetchLog.some((x) => x[1] === 429) && E2.stats.includes('offline') && (await srvIds(uid2)).length === 0, '429 «too many saves»: the move is kept, the corner says «Not saved yet — will try again»', { log: fetchLog.slice(0, 3), stats: E2.stats });
  for (let k = 0; k < 40 && (await srvIds(uid2)).length < 1; k++) await sleep(500);
  say((await srvIds(uid2)).join() === ids().join() && ids().length === 1, 'and 4 s later it went through by itself: the server has it', { server: await srvIds(uid2), client: ids() });
}

// ================================================================ 4. what the server put back is told, by name and with the reason
{
  reset(); const uid = 4005, E = env(uid); const a = HOMES[30], b = HOMES[31];
  const ra = live.records().find((r) => r.id === a), rb = live.records().find((r) => r.id === b);
  const rec = { v: 1, m: { [a]: [rb.x, rb.z, rb.ry], [b]: [rb.x + 0.5, rb.z, rb.ry] } };                // two houses on top of each other (a tampered / out-of-date record)
  const [s, j] = await raw(uid, 'POST', { layout: rec });
  say(s === 200 && j.dropped.length >= 1 && j.reasons && j.dropped.every((d) => (j.reasons[d] || []).length), 'the real server names WHY (reasons: {id: [rule codes]})', j);
  LS.setLayout({ v: 1, m: { [a]: [rb.x, rb.z, rb.ry] } }); mem.clear();
  E.sync.save({ v: 1, g: 'x', m: rec.m }); for (let k = 0; k < 30 && E.sync.busy; k++) await sleep(200);
  const said = E.notes.concat(E.toasts); console.log('   told:', JSON.stringify(said));
  say(said.some((m) => /put back on (its|their) old place/.test(m) && (m.includes(nameOfId(a)) || m.includes(nameOfId(b)))), 'the player is told which building went back (named, plain words)', said);
  say(said.some((m) => /another building|street|too close|wall|moat|river|gate|market|vault|steep|wet|stream|water/i.test(m)), 'and why', said);
  say(whyText(['STREET', 'OVERLAP']) === 'On a street · Another building is in the way' && !/_|[A-Z]{4}/.test(whyText(['SLOPE', 'DRY'])), 'the reasons are words, not codes', whyText(['SLOPE', 'DRY']));
}

// ================================================================ 5. 400 / 413 are no longer silent
{
  reset(); const uid = 4006, E = env(uid);
  const big = { v: 1, m: {} }; for (let i = 0; i < 400; i++) big.m['cottage_' + String(i).padStart(3, '0')] = [100.123456, 100.123456, 1.123];       // > 8192 bytes
  E.sync.save(big); for (let k = 0; k < 20 && E.sync.busy; k++) await sleep(200);
  say(E.notes.some((m) => /not saved/i.test(m)) && E.stats.includes('rejected'), 'a record the server refuses (too big) is answered with a message and a «Not saved» status', { notes: E.notes, stats: E.stats.slice(-3) });
  E.notes.length = 0; E.sync.save({ v: 2, m: {} }); for (let k = 0; k < 20 && E.sync.busy; k++) await sleep(200);
  say(E.notes.some((m) => /different versions/i.test(m)), 'a version the server does not know: «the game and the server are on different versions»', E.notes);
  say(/^Your arrangement was not saved — /.test(rejectedText('triple cottage_00')) && /outside the map/.test(rejectedText('range cottage_00')), 'every server reason has words', [rejectedText('id Bad'), rejectedText('weird thing')]);
}

// ================================================================ 6. offline / locked: kept here, said, sent later
{
  reset(); const uid = 4007, E = env(uid); move(HOMES[40]); failNext = 99; const p = E.sync.save(live.save()); await p; failNext = 0;
  say((await srvIds(uid)).length === 0 && E.stats.includes('offline'), 'no connection: the move waits (status «Not saved yet — will try again»)', { server: await srvIds(uid), stats: E.stats });
  for (let k = 0; k < 20 && (await srvIds(uid)).length === 0; k++) await sleep(500);
  say((await srvIds(uid)).length === 1, 'the connection comes back: it is sent again by itself and the server has it', await srvIds(uid));
}

// ================================================================ 7. reload / a new session: the server's record is what is shown, nothing is lost
{
  reset(); const uid = 4008, E = env(uid); for (const id of [HOMES[50], HOMES[51], 'store_wood']) move(id, 14); await E.sync.save(live.save()); const want = JSON.stringify(live.save().m);
  LS.clearAll(); mem.clear(); live.load({ v: 1, m: {} }); live.flush();                                      // «reload»: nothing in memory, nothing in this browser
  const E2 = env(uid); E2.econ.emit('load'); for (let k = 0; k < 40 && ids().length < 3; k++) await sleep(150); live.flush();
  say(JSON.stringify(live.save().m) === want, 'after a reload the three moved buildings stand where they were left (GET -> loadOwn)', { want: Object.keys(JSON.parse(want)), got: ids() });
}

// ================================================================ 8. attack and back: the enemy's town never becomes the player's, the player's comes back
{
  reset(); const uid = 4009; let inB = false; const E = env(uid, { battle: () => inB }); const A = HOMES[5], B = HOMES[6]; move(A); move(B); await E.sync.save(live.save());
  const own = JSON.stringify(live.save()), srv0 = JSON.stringify(await srvRec(uid));
  const defender = { v: 1, m: {} }; const dh = HOMES[7]; { const r = live.records().find((q) => q.id === dh); const p = findSpot(r, 20); defender.m[dh] = [p.x, p.z, p.ry]; }
  inB = true; live.enterBattle(defender); live.flush();
  say(Object.keys(live.own().m).join() === [A, B].sort().join() && Object.keys(live.save().m).join() === dh && live.records().find((q) => q.id === dh).moved === true, 'in the battle own() still answers the PLAYER\'s own record, while the enemy\'s town is what is shown (save())', { own: Object.keys(live.own().m), shown: Object.keys(live.save().m) });
  await E.sync.save(live.own());                                                                              // (the editor\'s pending 500 ms save fires now)
  say(JSON.stringify(await srvRec(uid)) === srv0, 'a save that fires in the battle stores the player\'s own record, not the enemy\'s', Object.keys((await srvRec(uid)).m));
  E.econ.emit('load'); await sleep(500); live.flush();
  say(live.inBattle && live.records().find((q) => q.id === dh).moved === true, 'a state reload during the battle does not touch the screen');
  inB = false; live.leaveBattle(); live.flush();
  say(JSON.stringify(live.own()) === own && JSON.stringify(live.save()) === own, 'back from the attack: the same record, the houses where they were left');
  say((await srvIds(uid)).join() === [A, B].sort().join(), 'and the server has them (attack-and-return)');
  // the server answered while the battle was on: it waits and is shown afterwards
  const C = HOMES[8]; inB = true; live.enterBattle(defender); live.flush(); const later = JSON.parse(own); const rc = live.records().find((q) => q.id === C); const pc = findSpot(rc, 20); later.m[C] = [pc.x, pc.z, pc.ry];
  live.loadOwn(later); say(live.records().find((q) => q.id === C).moved === false, 'an own record that arrives during a battle waits'); inB = false; live.leaveBattle(); live.flush();
  say(ids().join() === [A, B, C].sort().join(), '…and is shown when the battle is over', ids());
}

// ================================================================ 9. a place that is not valid any more (the town changed between two versions) is nudged, or named — never silent
{
  reset(); const uid = 4010, E = env(uid); const a = HOMES[12], b = HOMES[13]; const ra = live.records().find((r) => r.id === a), rb = live.records().find((r) => r.id === b);
  const rec = { v: 1, m: { [a]: [rb.x, rb.z, rb.ry], [HOMES[14]]: (() => { const r = live.records().find((q) => q.id === HOMES[14]); const p = findSpot(r, 15); return [p.x, p.z, p.ry]; })() } };   // a is ON b: not valid in this version
  const out = live.load(rec, { nudge: true, own: true }); live.flush();
  console.log('   load:', JSON.stringify({ dropped: out.dropped, nudged: out.nudged, reasons: out.reasons }), '| told:', JSON.stringify(E.notes.concat(E.toasts)));
  say(Object.keys(out.nudged).length + out.dropped.length >= 1 && (E.notes.length + E.toasts.length) >= 1, 'a saved building whose place is no longer valid is moved to the nearest valid spot or put back — and the player is told', E.notes.concat(E.toasts));
  say(ids().includes(HOMES[14]), 'the other, valid, building stays');
  const nid = Object.keys(out.nudged)[0]; if (nid) { const d = Math.hypot(out.nudged[nid].to[0] - out.nudged[nid].from[0], out.nudged[nid].to[1] - out.nudged[nid].from[1]); say(d <= 8.01 && live.check(nid, { x: out.nudged[nid].to[0], z: out.nudged[nid].to[1], ry: live.records().find((r) => r.id === nid).ry }).ok, `the nudge is short (${d.toFixed(1)} m ≤ 8) and valid`); }
  await sleep(1500); for (let k = 0; k < 20 && E.sync.busy; k++) await sleep(200);
  say(JSON.stringify(Object.keys((await srvRec(uid) || { m: {} }).m).sort()) === JSON.stringify(ids()), 'and the corrected record was sent, so that the server and the screen agree', { server: await srvIds(uid), client: ids() });
}

// ================================================================ 10. Undo is a stack
{
  reset(); let n = 0; for (const id of HOMES.slice(20, 40)) { if (n < 6 && move(id, 25)) n++; }
  let u = 0; while (live.canUndo()) { live.undo(); u++; if (u > 40) break; } say(n === 6 && u === 6 && live.count === 0, `six moves -> six undo steps -> back to the default town (${n}/${u})`);
  reset(); let c = 0; for (let i = 0; i < 400 && c < 34; i++) { const id = HOMES[i % 40]; if (move(id, 25)) c++; } let u2 = 0; while (live.canUndo()) { live.undo(); u2++; if (u2 > 60) break; }
  say(c === 34 && u2 === 30, `the undo stack holds 30 steps (${c} moves made, ${u2} undone)`);
}

console.log(nBad ? `LY1 FAILED ${nBad}` : `LY1 OK (${nOk} checks)`);
process.exit(nBad ? 1 : 0);
