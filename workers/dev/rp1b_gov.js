// rp1b_gov.js — RP1B: the hero mode's quality governor + frame-time diet as LOGIC (fake clock, fake scene; no browser).  Prints "GOV OK" or the failures.
//  · the governor steps one level down after 2 s under 30 fps, 2 s apart at the fastest, never past the last level, in the owner's order (pixel ratio -> shadows -> draw radius -> crowd freeze)
//  · it steps back up only after >= 8 s of >= 50 fps, one step per 8 s, never inside the 30..50 fps band, and not for a minute if it dropped again soon after a step up
//  · a stall of a second or more (hidden tab / loading) is not a frame time
//  · gate off = nothing changes: every knob of REACH is back to its neutral value after exit(), the shadow box too, what the game hid stays hidden, what we hid shows again
import * as THREE from 'three';
import { STEPS, GOV_CFG, govInit, govFrame, createDiet } from '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/rpg_diet.js';
import { REACH } from '/home/claude/bot/bluebot_v2/bluewall/client/src/reach.js';
let fails = 0; const ok = (c, m) => { if (!c) { console.log('FAIL', m); fails++; } else console.log('ok  ', m); };
function run(g, t0, sec, ms) { const ev = []; let t = t0; const end = t0 + sec * 1000; while (t < end) { t += ms; const d = govFrame(g, t); if (d) ev.push({ t, d, lvl: g.lvl }); } return { t, ev }; }
const gaps = (ev) => ev.slice(1).map((e, i) => e.t - ev[i].t);

// ---- the steps themselves: the owner's order
ok(STEPS.length === 5 && GOV_CFG.max === 4, '5 levels (0 = the diet, 1..4 = what the governor adds)');
ok(STEPS[1].dpr < STEPS[0].dpr, 'level 1 lowers the pixel ratio first');
ok(STEPS[2].sh > STEPS[1].sh && STEPS[2].box < STEPS[1].box, 'level 2: shadows (refresh slower, box smaller)');
ok(STEPS[3].hideR < STEPS[2].hideR && STEPS[3].hideS < STEPS[2].hideS && STEPS[3].hideH < STEPS[2].hideH, 'level 3: far-cull radius shorter');
ok(STEPS[4].upd > STEPS[3].upd && STEPS[4].hideS < STEPS[3].hideS, 'level 4: crowd freeze (world.update every 4th frame, crowds thinner)');
ok(GOV_CFG.down_ms === 1000 / 30 && GOV_CFG.down_win === 2 && GOV_CFG.up_hold_ms >= 8000, 'thresholds: < 30 fps for 2 s steps down; >= 8 s before stepping up');

// ---- 60 fps: nothing happens
{ const g = govInit(); const r = run(g, 0, 40, 1000 / 60); ok(r.ev.length === 0 && g.lvl === 0, '60 fps for 40 s: no step'); }

// ---- 20 fps: down, level by level, 2 s apart, to the last level and no further
const g = govInit(); let r = run(g, 0, 40, 50);
ok(r.ev.length === 4 && r.ev.every((e) => e.d === 1) && r.ev.map((e) => e.lvl).join() === '1,2,3,4', '20 fps: steps 1,2,3,4 (' + r.ev.map((e) => (e.t / 1000).toFixed(1) + 's').join(' ') + ')');
ok(r.ev[0].t >= 2000 && r.ev[0].t <= 3200, 'first step after ~2 s of slow frames');
ok(gaps(r.ev).every((x) => x >= GOV_CFG.down_hold_ms), 'two steps are at least ' + GOV_CFG.down_hold_ms + ' ms apart');
ok(g.lvl === 4, 'never past the last level');

// ---- 60 fps again: up, slowly
let t = r.t; const lastDown = r.ev[r.ev.length - 1].t; r = run(g, t, 70, 1000 / 60);
ok(r.ev.length === 4 && r.ev.every((e) => e.d === -1) && g.lvl === 0, 'recovery: four steps up, one at a time (' + r.ev.map((e) => (e.t / 1000).toFixed(0) + 's').join(' ') + ')');
ok(r.ev[0].t - lastDown >= 8000, 'no step up before 8 s after the last change');
ok(gaps(r.ev).every((x) => x >= GOV_CFG.up_hold_ms), 'two steps up are at least ' + GOV_CFG.up_hold_ms + ' ms apart');

// ---- the 30..50 fps band: no change either way
{ const h = govInit(); let q = run(h, 0, 5, 50); const l0 = h.lvl; q = run(h, q.t, 90, 25);                 // 40 fps
  ok(l0 >= 1 && q.ev.length === 0 && h.lvl === l0, 'inside the 30..50 fps band nothing moves (level ' + l0 + ' held for 90 s at 40 fps)'); }

// ---- it dropped again right after a step up: no new step up for a minute
{ const h = govInit(); let q = run(h, 0, 6, 50);                                   // down to level 2-3
  q = run(h, q.t, 12, 1000 / 60); const up = q.ev.find((e) => e.d === -1); ok(!!up, 'one step up happened (relock setup)');
  const tUp = up.t; q = run(h, q.t, 8, 50); const again = q.ev.find((e) => e.d === 1); ok(!!again && again.t - tUp < GOV_CFG.relock_ms, 'dropped again inside ' + GOV_CFG.relock_ms / 1000 + ' s of the step up');
  const tAgain = again.t; const q2 = run(h, q.t, 80, 1000 / 60); const up2 = q2.ev.find((e) => e.d === -1);
  ok(!up2 || up2.t - tAgain >= GOV_CFG.lock_ms - 1000, 'no step up for ' + GOV_CFG.lock_ms / 1000 + ' s after that (first one at +' + (up2 ? ((up2.t - tAgain) / 1000).toFixed(0) + ' s' : 'never in 80 s') + ')'); }

// ---- a stall is not a frame time
{ const h = govInit(); let q = run(h, 0, 5, 1000 / 60); q = { t: q.t + 1500 }; const e1 = govFrame(h, q.t); const q3 = run(h, q.t, 20, 1000 / 60);
  ok(e1 === 0 && q3.ev.length === 0 && h.lvl === 0, 'a 1.5 s stall at 60 fps is ignored (no step)'); }

// ---- through createDiet: fake scene; gate off = nothing changes
global.document = { hidden: false };
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera();
const key = new THREE.DirectionalLight(); key.castShadow = true; Object.assign(key.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120 });
const renderer = { shadowMap: { enabled: true, needsUpdate: false } }; let resized = 0;
const H = { THREE, renderer, scene, camera: cam, world: { key }, reach: REACH, resize: () => resized++, dev: false };
const S = { x: 0, z: 0, hero: null };
const mk = (name, x, o = {}) => { const geo = o.tris ? (() => { const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(o.tris * 9), 3)); return gg; })() : new THREE.BoxGeometry(1, 1, 1);
  const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial(), o.count || 2); m.name = name; m.instanceMatrix.setUsage(o.dyn === false ? THREE.StaticDrawUsage : THREE.DynamicDrawUsage);
  for (let i = 0; i < m.count; i++) m.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x + i, 0, 0)); scene.add(m); m.updateMatrixWorld(true); return m; };
const farLife = mk('life-far', 500), nearLife = mk('life-near', 10), mill = mk('windmill-far', 500), gameHid = mk('game-hidden', 500), camp = mk('camp', 304, { tris: 8892, count: 29, dyn: false }), camp2 = mk('camp-mid', 130, { tris: 8892, count: 29, dyn: false });
gameHid.visible = false;
const bone = new THREE.Bone(); bone.position.set(300, 0, 0); const sk = new THREE.SkinnedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()); sk.name = 'far-person'; sk.add(bone); sk.bind(new THREE.Skeleton([bone])); scene.add(sk); scene.updateMatrixWorld(true);
const NEUTRAL = { k: 1, dpr: 1, fog: 1, upd: 1, sh: 0, norefl: false, nobloom: false };
ok(JSON.stringify(REACH) === JSON.stringify(NEUTRAL), 'REACH is neutral until the hero module changes it');
const D = createDiet(H, S);
D.enter();
ok(REACH.dpr === STEPS[0].dpr && REACH.k === STEPS[0].k && REACH.upd === STEPS[0].upd && key.shadow.camera.right === STEPS[0].box && resized > 0, 'enter(): the diet is on (pixel ratio ' + REACH.dpr + ', shadow box ' + key.shadow.camera.right + ')');
D.pass(performance.now() + 10);
ok(!farLife.visible && nearLife.visible && sk.visible === false, 'far life (500 m) and a far skinned figure (300 m) are not drawn; the near pack is');
ok(mill.visible, 'a landmark (windmill) is never hidden by the diet');
ok(!camp.visible && camp2.visible, 'a heavy static pack 304 m away (the attacker camp) is hidden at level 0; the same pack at 130 m is not');
ok(!gameHid.visible && gameHid.userData.rpOff !== 1, 'what the game hid is not touched');
D.apply(3); D.pass(performance.now() + 20); ok(!camp2.visible && REACH.sh === STEPS[3].sh && REACH.nobloom === true, 'level 3: the 130 m pack is out too (radius ' + STEPS[3].hideH + ' m), bloom off');
D.apply(0); D.pass(performance.now() + 30); ok(camp2.visible && !camp.visible, 'back to level 0: it comes back');
// a pack we hid that stops being a candidate (it emptied / was remade): the next pass brings it back; one still hidden at exit() comes back too
{ const st1 = mk('stale-life-1', 500), st2 = mk('stale-life-2', 500); D.st.candAt = -1e9; D.pass(performance.now() + 40); ok(!st1.visible && !st2.visible, 'two far packs hidden');
  st1.count = 0; D.st.candAt = -1e9; D.pass(performance.now() + 50); ok(st1.visible && st1.userData.rpOff === 0 && !st2.visible, 'a hidden pack that is no candidate any more is shown again by the next pass (nothing stays hidden by a stale list)');
  st2.count = 0; globalThis.__st2 = st2; }
// the governor wired in tick(): 20 fps on a fake clock walks the levels; paused / hidden says nothing
let now = 1e6; for (let i = 0; i < 400; i++) { now += 50; D.tick(now, false); }
ok(D.info().lvl === 4 && REACH.upd === STEPS[4].upd && REACH.sh === STEPS[4].sh, 'tick() at 20 fps: level 4 (' + D.info().label + '), world.update every ' + REACH.upd + 'th frame');
const lv = D.info().lvl; for (let i = 0; i < 400; i++) { now += 50; D.tick(now, true); } ok(D.info().lvl === lv, 'a paused page does not move the governor');
D.exit();
ok(JSON.stringify(REACH) === JSON.stringify(NEUTRAL), 'exit(): every REACH knob is neutral again (' + JSON.stringify(REACH) + ')');
ok(key.shadow.camera.right === 120 && key.shadow.camera.left === -120 && key.shadow.camera.top === 120, 'exit(): the shadow box is the original');
ok(farLife.visible && camp.visible && sk.visible && !gameHid.visible && D.st.hidden.length === 0, 'exit(): what we hid is drawn again, what the game hid stays hidden');
ok(globalThis.__st2.visible && globalThis.__st2.userData.rpOff === 0 && D.st.mine.size === 0, 'exit(): a pack that left the lists while hidden is drawn again too');
let leftHidden = 0; scene.traverse((o) => { if (o.userData && o.userData.rpOff === 1) leftHidden++; }); ok(leftHidden === 0, 'exit(): no object in the scene is still flagged as hidden by the diet');
console.log(fails ? 'GOV FAILED' : 'GOV OK'); process.exit(fails ? 1 : 0);
