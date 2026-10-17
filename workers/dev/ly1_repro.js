// LY1 repro of the owner's «a house I moved is removed later» (E1): the REAL layout_sync.js + layout_live.js + layout_rules.js against the REAL local server (dev/ly1_server.py, port 8591), with network latency.
// BEFORE the fix (pass the kit's src dir to ly1_repro.sh): after the slow POST the screen has lost cottage_02 and the next move deletes it on the server too, no message.  AFTER (LY1 code): client = server = {01, 02, 03}.
// NB: this file has main.js's OLD wiring (createLayoutSync + onServer) verbatim; the LY1 code needs layout_wire.js — run dev/ly1_test.sh for the new wiring.
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import * as LS from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_store.js';
import * as RULES from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_rules.js';
import { createLayoutLive } from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_live.js';
import { createLayoutSync } from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_sync.js';
import { registerTownTargets } from '/home/claude/bot/bluebot_v2/bluewall/client/src/town_build.js';
L.setMap('night');
const mem = new Map(); globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const realFetch = globalThis.fetch, BASE = process.env.LY1_BASE || 'http://127.0.0.1:8591'; let latIn = 0, latOut = 0; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
globalThis.fetch = async (url, opt = {}) => { const o = { ...opt }; delete o.signal; if (latIn) await sleep(latIn); const r = await realFetch(BASE + url, o); if (latOut) await sleep(latOut); return r; };
const UID = String(900 + Math.floor(Math.random() * 90));
const LEVEL = 50, ctx = { targets: [], tgt(t) { const id = ctx.targets.length + 1; ctx.targets.push({ id, ...t }); return id; }, B: { bid() {} }, town: { gen: [] } };
const tids = registerTownTargets(ctx, LEVEL); ctx.townTids = tids;
const world = { ctx, layoutParts: { ctx, height: L.height, picks: [], castle: () => LEVEL }, stores: { rebuild: () => 0 }, get targets() { return ctx.targets; } };
const live = createLayoutLive(world), G = live.geom(); world.layout = live;
const toasts = []; const ui = { toast: (m) => toasts.push(m) };
// === main.js lines 453 + 455, verbatim ===
const econ = { token: UID, subs: new Set(), on(f) { this.subs.add(f); }, emit(ev) { for (const f of this.subs) f({}, ev); } };
const layoutSync = createLayoutSync(econ, { onServer: (j) => { if (j && j.ok && j.changed) { world.layout.load(j.layout || { v: 1, m: {} }); if (j.dropped && j.dropped.length) ui.toast('Some buildings were put back where they fit'); } } });
const layoutUI = { active: false };
econ.on((st, ev) => { if (ev === 'load') layoutSync.load().then((rec) => { if (rec && !layoutUI.active) world.layout.load(rec); }); });
// =========================================
const findSpot = (r, R = 30) => { const all = live.records(); for (let k = 0; k < 4000; k++) { const a = Math.random() * 6.283, d = 4 + Math.random() * R, pose = LS.quant(Math.round(r.x + Math.cos(a) * d), Math.round(r.z + Math.sin(a) * d), r.ry); if (RULES.checkPose(G, r, pose, all, { first: true }).ok && RULES.checkPose(G, r, pose, all).ok) return pose; } return null; };
const move = (id) => { const r = live.records().find((q) => q.id === id), p = findSpot(r); const res = live.commit(id, p); live.flush(); return res.ok ? p : null; };
const ids = () => Object.keys(live.save().m).sort();
const srvIds = async () => { const r = await realFetch(BASE + '/api/layout', { headers: { Authorization: 'Bearer ' + UID } }); const j = await r.json(); return j.layout ? Object.keys(j.layout.m).sort() : []; };
const out = (k, v) => console.log(k.padEnd(46), typeof v === 'string' ? v : JSON.stringify(v));

// E1: the second move's POST is slow on its way in; the game asks GET /api/layout meanwhile (econ 'load': back from a break / a timed-out write re-reads the state)
move('cottage_01'); await layoutSync.save(live.save()); out('after A: client / server', [ids(), await srvIds()]);
move('cottage_02'); const slow = (latIn = 1200, layoutSync.save(live.save())); latIn = 0;                    // POST of {A,B} is on its way (1.2 s)
await sleep(100); econ.emit('load'); await sleep(300);                                                   // GET arrives first: the server still has only {A}
out('E1 during the slow POST: client / server', [ids(), await srvIds()]);
await slow; await sleep(200);
out('E1 after the POST answered: client / server', [ids(), await srvIds()]);
move('cottage_03'); await layoutSync.save(live.save());                                                  // the next ordinary move
out('E1 after the next move C: client / server', [ids(), await srvIds()]);
out('toasts', toasts);
process.exit(0);
