// pf1/unit.mjs — node unit tests for perf.js: (1) createCap (the adaptive frame cap) on synthetic frame sequences, (2) installMatrixSkip fuzz: bit-for-bit equal world matrices, with and without the skip
import * as THREE from '/home/claude/bot/bluebot_v2/bluewall/client/node_modules/three/build/three.module.js';
import { createCap, installMatrixSkip } from '/home/claude/dev/pf1/perf_bundle.mjs';
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };

// ---- (1) the cap.  Drive frames: each call = one drawn frame with a real interval `real` and `work` ms of JS; the controller sees 60 Hz (rf 16.7) or 90 Hz (rf 11.1).
function drive(cap, secs, real, work, rf, t0) { let t = t0; const end = t0 + secs * 1000; while (t < end) { t += real; cap.frame(real, work, rf, t, false); } return t; }
{
  const c = createCap(); let t = 1000;
  ok(c.lvl === 0 && c.gap() === 10, 'starts at 60 (gap 10)');
  t = drive(c, 6, 14.5, 9, 16.7, t); ok(c.lvl === 0, 'frames 14.5 ms (on time): stays at 60');
  t = drive(c, 3.4, 24, 20, 16.7, t); ok(c.lvl === 1 && c.gap() === 20, 'frames 24 ms for 3 s: steps down to level 1 (gap 20)');
  t = drive(c, 3.4, 33.4, 12, 16.7, t); ok(c.lvl === 1, 'on a 60 Hz screen 30 fps frames on time (33.4 ms): stays, no further step');
  t = drive(c, 6.2, 45, 40, 16.7, t); ok(c.lvl === 2 && c.gap() === 29 && c.cpuBound, 'still missing 30 (45 ms, JS 40): level 2, and flagged CPU bound');
  t = drive(c, 9, 33.4, 6, 16.7, t); ok(c.lvl === 2, 'headroom for 9 s: still down (hysteresis wants 10 s)');
  t = drive(c, 6, 33.4, 6, 16.7, t); ok(c.lvl === 1, 'headroom > 10 s (15 s in all): one step up');
  // flapping: step down again within 40 s of the step up -> the wait doubles
  const w0 = c.wait; t = drive(c, 6.5, 50, 45, 16.7, t); ok(c.lvl === 2 && c.wait === w0 * 2, 'a step up that has to be undone inside 40 s doubles the wait (' + c.wait / 1000 + ' s)');
  // a stall resets the window: one 400 ms hitch must not count as a trend
  const d = createCap(); let u = 0; u = drive(d, 2.5, 14, 8, 16.7, u); d.frame(400, 8, 16.7, u += 400, false); u = drive(d, 2.0, 14, 8, 16.7, u); ok(d.lvl === 0, 'a 400 ms stall is not a trend');
  // skip flag (panel / intro / loading) resets too
  const e = createCap(); let v = 0; for (let i = 0; i < 400; i++) { v += 40; e.frame(40, 30, 16.7, v, true); } ok(e.lvl === 0, 'frames flagged skip (panel, intro, hidden) never move the cap');
  // 90 Hz: level 1 means ~45 fps (22.2 ms)
  const f = createCap(); let w = 0; w = drive(f, 3.4, 22, 18, 11.1, w); ok(f.lvl === 1, '90 Hz screen: 22 ms frames step down once (to the 45 fps level)'); w = drive(f, 3.4, 22.2, 8, 11.1, w); ok(f.lvl === 1, '90 Hz: 45 fps on time stays at 45');
}

// ---- (2) the matrix skip: two identical random scene graphs, one updated through the skip, one through the original code; same mutation script; every world matrix must be BIT-identical after every frame
function build(seed) {
  let s = seed; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const root = new THREE.Scene(), all = [root];
  for (let i = 0; i < 1200; i++) { const o = i % 7 === 0 ? new THREE.Group() : new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)); o.position.set(rnd() * 50, rnd() * 5, rnd() * 50); o.rotation.set(rnd(), rnd(), rnd()); o.scale.setScalar(0.5 + rnd()); all[Math.floor(rnd() * all.length)].add(o); all.push(o); }
  for (let i = 0; i < 40; i++) { const o = all[1 + Math.floor(rnd() * (all.length - 1))]; o.matrixAutoUpdate = false; o.updateMatrix(); }    // frozen ones, as the game has
  for (let i = 0; i < 20; i++) { const o = all[1 + Math.floor(rnd() * (all.length - 1))]; o.pivot = new THREE.Vector3(rnd(), rnd(), rnd()); }          // pivots (r186): never skipped
  return { root, all, rnd };
}
function mutate(w, frame) {                                                   // the same script for both: ~10 % move, some are re-parented, some are added / removed, one moves an ancestor
  const { all, rnd } = w;
  for (let i = 0; i < 120; i++) { const o = all[1 + Math.floor(rnd() * (all.length - 1))]; if (!o.matrixAutoUpdate) continue; const k = rnd(); if (k < 0.5) o.position.x += rnd() - 0.5; else if (k < 0.8) o.rotation.y += rnd() * 0.1; else if (k < 0.9) o.scale.multiplyScalar(0.99 + rnd() * 0.02); else o.quaternion.setFromEuler(new THREE.Euler(rnd(), rnd(), rnd())); }
  if (frame % 5 === 0) { const a = all[1 + Math.floor(rnd() * (all.length - 1))], b = all[Math.floor(rnd() * all.length)]; let p = b, bad = false; while (p) { if (p === a) bad = true; p = p.parent; } if (!bad && a !== b) b.add(a); }   // re-parent (not under itself)
  if (frame % 7 === 0) { const n = new THREE.Group(); n.position.set(rnd(), rnd(), rnd()); all[Math.floor(rnd() * all.length)].add(n); all.push(n); }
  if (frame % 11 === 0) { const a = all[1 + Math.floor(rnd() * (all.length - 1))]; if (a.matrixAutoUpdate) { a.position.y += 3; a.updateMatrixWorld(); } }
  // r186 updateWorldMatrix() refreshes the ANCESTORS of a node and clears their needs-update flag without touching their other children (getWorldPosition, lookAt, attach do this): the skip must not leave those children stale (found live: the dragon's Sketchfab_Scene)
  const v = new THREE.Vector3(); for (let i = 0; i < 30; i++) { const o = all[Math.floor(rnd() * all.length)]; const k = rnd(); if (k < 0.5) o.getWorldPosition(v); else if (k < 0.8) o.updateWorldMatrix(true, false); else o.updateWorldMatrix(false, true); }
  // a node taken out and put back under the SAME parent while that parent (or an ancestor) moved in between: its world must follow the parent
  if (frame % 3 === 0) { const a = all[1 + Math.floor(rnd() * (all.length - 1))], par = a.parent; if (par && par !== w.root) { par.remove(a); const up = all[1 + Math.floor(rnd() * (all.length - 1))]; if (up.matrixAutoUpdate) { up.position.x += 0.5; up.updateMatrixWorld(); } par.add(a); } }
}
let SKIP;                                                                       // (installed once: a second install would wrap the first one)
{
  const S = SKIP = installMatrixSkip(THREE, true); const A = build(7), B = build(7); let bad = 0, frames = 80, cmp = 0;
  for (let f = 0; f < frames; f++) {
    S.on = true; mutate(A, f); A.root.updateMatrixWorld();
    S.on = false; mutate(B, f); B.root.updateMatrixWorld();
    for (let i = 0; i < A.all.length; i++) { const x = A.all[i].matrixWorld.elements, y = B.all[i].matrixWorld.elements, l = A.all[i].matrix.elements, m = B.all[i].matrix.elements; for (let k = 0; k < 16; k++) { cmp++; if (x[k] !== y[k] || l[k] !== m[k]) bad++; } }
  }
  { const T = new THREE.Matrix4(), W = new THREE.Matrix4(), chain = []; let gb = 0, gn = 0;
    for (const o of A.all) { if (!o.matrixAutoUpdate || !o.matrixWorldAutoUpdate || o.pivot !== null) continue; chain.length = 0; let ok2 = true; for (let p = o; p; p = p.parent) { if (!p.matrixAutoUpdate || !p.matrixWorldAutoUpdate || p.pivot !== null) { ok2 = false; break; } chain.push(p); } if (!ok2) continue;
      W.identity(); for (let i = chain.length - 1; i >= 0; i--) { T.compose(chain[i].position, chain[i].quaternion, chain[i].scale); W.multiply(T); } gn++; for (let k = 0; k < 16; k++) if (Math.abs(W.elements[k] - o.matrixWorld.elements[k]) > 1e-9 * (1 + Math.abs(W.elements[k]))) { gb++; break; } }
    ok(gb === 0, 'ground truth after the last frame: world == product of the composed TRS matrices from the root for ' + gn + ' nodes, ' + gb + ' wrong'); }
  ok(bad === 0, 'matrix skip == original code, bit for bit: ' + cmp + ' numbers over ' + frames + ' frames, ' + bad + ' differ');
  ok(S.skip > 5 * S.run * 0 && S.skip > 20000, 'and it really skipped work: ' + S.skip + ' skipped, ' + S.run + ' computed');
}
// ---- (3) RP1C-R2 cull.js freezes the children of a hidden node (own-property NOOP updateMatrixWorld) and thaws them when the world shows the node again.  A frozen subtree misses the "parent moved" force; the original updateMatrix()
//          raised matrixWorldNeedsUpdate on the first update after the thaw, the skip does not: cull.js mxThaw must raise it (mother line).  Same script on both worlds, the skip world with / without that line.
function freezeRun(withFix) {
  const NOOP = function () {}, S2 = SKIP; S2.on = true;
  const A = build(23), B = build(23); const fa = [], fb = [];
  const pick = (w, k) => { const c = w.all[1 + (k * 37 + 11) % (w.all.length - 1)]; return c; };
  const freeze = (w, list, k) => { const a = pick(w, k); if (!a.children.length) return; const kids = a.children.slice(); for (const c of kids) if (!Object.prototype.hasOwnProperty.call(c, 'updateMatrixWorld')) c.updateMatrixWorld = NOOP; list.push({ kids, at: 0 }); };
  const thaw = (f, fix) => { for (const c of f.kids) { if (c.updateMatrixWorld === NOOP) delete c.updateMatrixWorld; if (fix) c.matrixWorldNeedsUpdate = true; } };
  let bad = 0, cmp = 0;
  for (let f = 0; f < 90; f++) {
    S2.on = true; mutate(A, f); if (f % 4 === 1) freeze(A, fa, f); if (f % 6 === 5 && fa.length) { thaw(fa.shift(), withFix); } A.root.updateMatrixWorld();
    S2.on = false; mutate(B, f); if (f % 4 === 1) freeze(B, fb, f); if (f % 6 === 5 && fb.length) { thaw(fb.shift(), true); } B.root.updateMatrixWorld();
    S2.on = true;
  }
  while (fa.length) thaw(fa.shift(), withFix); while (fb.length) thaw(fb.shift(), true);
  S2.on = true; A.root.updateMatrixWorld(); S2.on = false; B.root.updateMatrixWorld(); S2.on = true;
  for (let i = 0; i < A.all.length; i++) { const x = A.all[i].matrixWorld.elements, y = B.all[i].matrixWorld.elements; for (let k = 0; k < 16; k++) { cmp++; if (x[k] !== y[k]) bad++; } }
  return { bad, cmp };
}
{
  const a = freezeRun(true); ok(a.bad === 0, 'hidden subtrees frozen by cull.js and thawed WITH the needs-update line: world == original code, bit for bit (' + a.cmp + ' numbers, ' + a.bad + ' differ)');
  // the exact case, by hand: P -> H -> K; K frozen; P moves while K is frozen and then rests; K is thawed.  The original code redoes K's world (updateMatrix raises the flag); the skip needs the line.
  const det = (fix, skipOn) => { const S3 = SKIP; S3.on = skipOn; const NOOP = function () {}; const root = new THREE.Scene(), P = new THREE.Group(), H = new THREE.Group(), K = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    root.add(P); P.add(H); H.add(K); K.position.set(2, 0, 0); root.updateMatrixWorld(); H.visible = false; K.updateMatrixWorld = NOOP;
    P.position.x += 5; root.updateMatrixWorld(); root.updateMatrixWorld();
    delete K.updateMatrixWorld; if (fix) K.matrixWorldNeedsUpdate = true; root.updateMatrixWorld(); H.visible = true; S3.on = true; return K.matrixWorld.elements[12]; };
  ok(det(false, false) === 7, 'by hand, original code: a thawed child lands at x = 7 (parent moved 5, offset 2)');
  ok(det(true, true) === 7, 'by hand, skip + the mxThaw line: x = 7');
  ok(det(false, true) !== 7, 'negative control: skip WITHOUT the line leaves the thawed child at x = ' + det(false, true) + ' (stale) — that is why cull.js mxThaw has the line');
}
console.log(fails ? 'UNIT FAIL ' + fails : 'UNIT OK'); process.exit(fails ? 1 : 0);
