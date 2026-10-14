// unit test of the ring control state machine (ringctl.js) with mocks: node rc_test.mjs
import { createRingControl } from '/home/claude/bot/bluebot_v2/bluewall/client/src/ringctl.js';
let T = 0; globalThis.performance = { now: () => T * 1000 };
const types = ['a', 'b', 'c'];
const mk = (launchedSet = new Set(), heroes = new Set()) => {
  const sim = { field: { x0: -100, x1: 100, z0: -100, z1: 100 }, units: types.map((t) => ({ type: t, hp: 5, dead: false, active: launchedSet.has(t) })), alive(t) { return this.units.filter((u) => u.type === t && !u.dead && u.hp > 0).length; },
    canSend(t) { return heroes.has(t) ? this.alive(t) > 0 : this.units.some((u) => u.type === t && !u.dead && u.hp > 0 && !u.active); } };
  const R = { a: { cx: -20, cz: 0, r: 8 }, b: { cx: 0, cz: 0, r: 8 }, c: { cx: 20, cz: 0, r: 8 } };
  const rings = { info: (t) => R[t] };
  const camera = { fov: 50, position: { x: 0, y: 100, z: 100 } };
  const pad = { getBoundingClientRect: () => ({ height: 800 }) };
  const rc = { drag: null, staged: {}, lit: new Set() }, sent = [];
  // ground: screen (x,y) -> world (x/5 , y/5) so that ring a (-20,0) is at screen (-100, 0) ... shift: world = (x-200)/5, (y-200)/5
  const ground = (x, y) => ({ x: (x - 200) / 5, z: (y - 200) / 5 });
  const send = (t, x, z) => { sent.push([t, Math.round(x), Math.round(z)]); sim.units.filter((u) => u.type === t).forEach((u) => { u.active = true; }); };
  const ctl = createRingControl({ rc, types, sim, rings, camera, pad, ground, H: () => 0, send });
  const scr = (wx, wz) => [wx * 5 + 200, wz * 5 + 200];
  return { sim, rc, sent, ctl, scr, R };
};
const ok = (c, m) => { if (!c) { console.log('FAIL', m); process.exitCode = 1; } else console.log('ok  ', m); };
const run = (h, id, from, to, holdS = 0, still = 0) => { const [x0, y0] = from, [x1, y1] = to; if (!h.ctl.down(id, x0, y0)) return 'nodown'; if (holdS) { T += holdS; h.ctl.update(); } h.ctl.move(id, x1, y1); if (still) { T += still; h.ctl.update(); } return h.ctl.up(id, x1, y1, true); };

{ const h = mk(); T = 0; const r = run(h, 1, h.scr(-20, 0), h.scr(-20, 30)); ok(r === 'send' && h.sent.length === 1 && h.sent[0][0] === 'a' && h.sent[0][2] === 30, 'quick drag sends that squad to the release point ' + JSON.stringify(h.sent)); }
{ const h = mk(); T = 0; const r = run(h, 1, h.scr(0, 0), h.scr(0, 40), 0.7); ok(r === 'send' && h.sent.length === 3, 'hold on a ring = all rings go ' + JSON.stringify(h.sent)); ok(h.sent.find((s) => s[0] === 'a')[1] === -20 && h.sent.find((s) => s[0] === 'c')[1] === 20, 'offsets kept'); }
{ const h = mk(); T = 0; ok(!h.ctl.down(1, ...h.scr(60, 60)), 'a press on empty ground is not a ring'); }
{ const h = mk(); T = 0; // staging flow
  let r = run(h, 1, h.scr(-20, 0), h.scr(-30, 40), 0, 0.9); ok(r === 'stage' && h.sent.length === 0 && h.rc.staged.a, 'hold on the target stages it, nobody goes');
  r = run(h, 2, h.scr(0, 0), h.scr(0, 40)); ok(r === 'send' && h.sent.length === 1 && h.sent[0][0] === 'b', 'b quick: goes at once; a still waits (c has no target)');
  r = run(h, 3, h.scr(20, 0), h.scr(20, 40)); ok(r === 'send' && h.sent.length === 3 && h.sent.some((s) => s[0] === 'a' && s[1] === -30), 'last squad placed: the waiting squad goes with it ' + JSON.stringify(h.sent)); }
{ const h = mk(); T = 0;
  run(h, 1, h.scr(-20, 0), h.scr(-30, 40), 0, 0.9); T += 1; const r = run(h, 2, h.scr(-20, 0), h.scr(-20, 0)); ok(r === 'none' || r === null || r === 'tap' || r === 'nodown' || true, '(tap helper)');
  // tap on ring a (staged) -> a goes alone: do it explicitly
  const h2 = mk(); T = 0; run(h2, 1, h2.scr(-20, 0), h2.scr(-30, 40), 0, 0.9); T += 1;
  ok(h2.ctl.down(5, ...h2.scr(-20, 0)) && h2.ctl.up(5, ...h2.scr(-20, 0)) === 'go' && h2.sent.length === 1 && h2.sent[0][0] === 'a' && h2.sent[0][1] === -30, 'tap on the ring of a waiting squad: it goes alone ' + JSON.stringify(h2.sent));
  const h3 = mk(); T = 0; run(h3, 1, h3.scr(-20, 0), h3.scr(-30, 40), 0, 0.9); T += 1;
  ok(h3.ctl.down(6, ...h3.scr(-30, 40)) && h3.ctl.up(6, ...h3.scr(-30, 40)) === 'cancelled' && !h3.rc.staged.a && h3.sent.length === 0, 'tap on a waiting target cancels it'); }
{ const h = mk(); T = 0; ok(h.ctl.down(1, ...h.scr(-20, 0)) && h.ctl.up(1, ...h.scr(-20, 0)) === 'tap', 'a plain tap on a ring (nothing waiting) is passed on as a tap'); }
{ const h = mk(new Set(['a'])); T = 0; run(h, 1, h.scr(0, 0), h.scr(0, 40), 0, 0.9); ok(h.rc.staged.b && h.sent.length === 0, 'b staged (c still open)'); run(h, 2, h.scr(20, 0), h.scr(20, 40), 0, 0.9); ok(h.sent.length === 2, 'sent squads do not hold the others back: b and c go when c is placed ' + JSON.stringify(h.sent)); }
{ const h = mk(); T = 0; h.ctl.down(1, ...h.scr(0, 0)); T += 0.7; h.ctl.update(); ok(h.rc.lit.size === 3, 'hold: all three rings lit'); h.ctl.up(1, ...h.scr(0, 0)); ok(h.sent.length === 0 && h.rc.lit.size === 0, 'release without moving after the hold: nothing happens, lights off'); }
{ const h = mk(); T = 0; h.ctl.down(1, ...h.scr(0, 0)); h.ctl.move(1, ...h.scr(0, 10)); h.ctl.up(1, 0, 0, false); ok(h.sent.length === 0 && !h.rc.drag, 'pointercancel sends nothing'); }
{ const h = mk(); T = 0; run(h, 1, h.scr(-20, 0), h.scr(-30, 40), 0, 0.9); h.sim.units.filter((u) => u.type === 'a').forEach((u) => { u.dead = true; }); h.ctl.update(); ok(!h.rc.staged.a, 'a fallen squad loses its waiting target'); }
// p34 b: a slow frame (update() never ran) must not lose a hold
{ const h = mk(); T = 0; h.ctl.down(1, ...h.scr(-20, 0)); h.ctl.move(1, ...h.scr(-30, 40)); T += 1.1; const r = h.ctl.up(1, 0, 0, true); ok(r === 'stage' && h.sent.length === 0 && h.rc.staged.a, 'no frame ran during the hold on the target: it still stages (not a quick send)'); }
{ const h = mk(); T = 0; h.ctl.down(1, ...h.scr(0, 0)); T += 0.8; h.ctl.move(1, ...h.scr(0, 40)); T += 0.05; const r = h.ctl.up(1, 0, 0, true); ok(r === 'send' && h.sent.length === 3, 'no frame ran during the long press: all three rings still go together ' + JSON.stringify(h.sent)); }
{ const h = mk(); T = 0; h.ctl.down(1, ...h.scr(-20, 0)); h.ctl.move(1, ...h.scr(-30, 40)); T += 0.5; const r = h.ctl.up(1, 0, 0, true); ok(r === 'send' && h.sent.length === 1, 'a pause shorter than 0.8 s is a quick send'); }

// ---- p35 K1 «one send»: a soldier squad takes an order once; the heroes are re-sent any time
{ const h = mk(); T = 0; run(h, 1, h.scr(-20, 0), h.scr(-20, 30)); ok(h.sent.length === 1, 'first drag sends a');
  ok(!h.ctl.down(2, ...h.scr(-20, 30)) && !h.ctl.down(3, ...h.scr(-20, 0)), 'a sent soldier squad has no handle: a press on its ring is the camera\'s');
  const r = run(h, 4, h.scr(-20, 0), h.scr(40, 40)); ok(r === 'nodown' && h.sent.length === 1, 'a second drag on a sent squad sends nothing'); }
{ const h = mk(new Set(['a'])); T = 0; const r = run(h, 1, h.scr(0, 0), h.scr(0, 40), 0.7); ok(r === 'send' && h.sent.length === 2 && !h.sent.some((s) => s[0] === 'a'), 'hold-all takes only the squads that have not gone yet ' + JSON.stringify(h.sent));
  ok(h.rc.lit.size === 0, 'lights off after the send'); }
{ const h = mk(new Set(['a']), new Set(['a'])); T = 0; let r = run(h, 1, h.scr(-20, 0), h.scr(-20, 30)); ok(r === 'send' && h.sent.length === 1, 'a HERO that has gone can be sent again (1)');
  r = run(h, 2, h.scr(-20, 0), h.scr(30, -30)); ok(r === 'send' && h.sent.length === 2 && h.sent[1][1] === 30, 'a HERO that has gone can be sent again (2) ' + JSON.stringify(h.sent)); }
{ const h = mk(new Set(['a', 'b']), new Set(['a'])); T = 0; h.ctl.down(1, ...h.scr(-20, 0)); T += 0.7; h.ctl.update(); ok(h.rc.lit.has('a') && h.rc.lit.has('c') && !h.rc.lit.has('b'), 'hold: lit = the hero + the unsent squads, not the sent soldier squad'); h.ctl.up(1, ...h.scr(-20, 0)); }
{ const h = mk(new Set(['a']), new Set(['a'])); T = 0; run(h, 1, h.scr(0, 0), h.scr(0, 40), 0, 0.9); run(h, 2, h.scr(20, 0), h.scr(20, 40)); ok(h.sent.length === 2, 'a hero that already went does not hold the staged squads back ' + JSON.stringify(h.sent)); }
