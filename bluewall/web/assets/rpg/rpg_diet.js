// RP1B — the hero mode's frame-time diet + quality governor.  A lazy ES module (fetched with rpg.js, owner-only; nothing of it is in the boot bundle).
// The strategic view draws the whole map with crowds, workers, grass and shadows out to ~460 m because the camera is high above it.  A walking player sees a few hundred metres, so in hero mode:
//   · the meadow thins out much sooner                                         (REACH.k, read by assets.js meadowLod — neutral = 1 everywhere else)
//   · an instanced prop or a skinned figure whose NEAREST copy is farther than a radius is not drawn at all (far hamlets, the attacker camp, carts, boats)
//   · the sun's shadow box is a quarter of the strategic one (it follows the hero) and is redrawn less often
//   · the render pixel ratio is capped, world.update runs every 2nd drawn frame, the bloom composer can be skipped
//   · a governor measures the REAL frame time and steps this load down (pixel ratio -> shadows -> draw radius -> crowd freeze) and back up (slowly, with hysteresis).
// Nothing is saved anywhere; leaving hero mode puts every knob back.  No new shader programs, no new lights, no new materials.
export const STEPS = [
  // lvl 0 = the diet itself (always on in hero mode); 1..4 = what the governor adds, in the order the owner's brief gives
  { dpr: 0.85, k: 0.25, fog: 1.0, upd: 2, sh: 1, box: 56, hideR: 90, hideS: 70, hideH: 160, cullR: 150, nobloom: false, label: 'diet' },
  { dpr: 0.75, k: 0.25, fog: 1.0, upd: 2, sh: 1, box: 56, hideR: 90, hideS: 70, hideH: 160, cullR: 150, nobloom: false, norefl: true, label: 'pixel ratio + mirror' },
  { dpr: 0.75, k: 0.25, fog: 1.0, upd: 2, sh: 5, box: 34, hideR: 90, hideS: 70, hideH: 160, cullR: 125, nobloom: true, norefl: true, label: 'shadows' },
  { dpr: 0.75, k: 0.16, fog: 1.7, upd: 2, sh: 5, box: 34, hideR: 55, hideS: 45, hideH: 110, cullR: 95, nobloom: true, norefl: true, label: 'draw radius' },
  { dpr: 0.75, k: 0.16, fog: 1.7, upd: 4, sh: 1e6, box: 34, hideR: 55, hideS: 25, hideH: 110, cullR: 95, nobloom: true, norefl: true, label: 'crowd freeze' },
];
export const GOV_CFG = { down_ms: 1000 / 30, down_win: 2, up_ms: 1000 / 50, up_win: 8, up_hold_ms: 8000, down_hold_ms: 2000, relock_ms: 20000, lock_ms: 60000, max: STEPS.length - 1 };

// ---- the governor as a pure function of time, so a fake clock can test it (dev/rp1b_test.sh)
export function govInit() { return { lvl: 0, wStart: null, wN: 0, bad: 0, good: 0, last: null, lastChange: -1e9, lastUp: -1e9, lockUp: -1e9, fps: 0 }; }
// feed it every drawn frame's timestamp (ms); returns -1 (one step lighter), 0 (nothing) or +1 (one step heavier = the picture got cheaper); g.lvl is the new level
export function govFrame(g, t, cfg = GOV_CFG) {
  const prev = g.last; g.last = t;
  if (prev == null) { g.wStart = t; g.wN = 0; return 0; }
  if (t - prev > 1000) { g.wStart = t; g.wN = 0; g.bad = g.good = 0; return 0; }                    // a stall of a second or more (tab hidden, loading, paused): not a frame time, start over
  g.wN++;
  if (t - g.wStart < 1000) return 0;
  const fps = (g.wN * 1000) / (t - g.wStart); g.fps = fps; g.wStart = t; g.wN = 0;
  if (fps < 1000 / cfg.down_ms) { g.bad++; g.good = 0; } else if (fps >= 1000 / cfg.up_ms) { g.good++; g.bad = 0; } else { g.bad = 0; g.good = 0; }
  if (g.bad >= cfg.down_win && g.lvl < cfg.max && t - g.lastChange >= cfg.down_hold_ms) {
    g.lvl++; g.bad = 0; g.lastChange = t; if (t - g.lastUp < cfg.relock_ms) g.lockUp = t + cfg.lock_ms;   // it dropped again soon after a step up: do not try up again for a minute
    return 1;
  }
  if (g.good >= cfg.up_win && g.lvl > 0 && t - g.lastChange >= cfg.up_hold_ms && t >= g.lockUp) { g.lvl--; g.good = 0; g.lastChange = t; g.lastUp = t; return -1; }
  return 0;
}

export function createDiet(H, S) {
  const T = H.THREE, { renderer, scene, camera, world } = H, R = H.reach;
  const dev = !!H.dev;
  const gov = govInit();
  const st = { on: false, lvl: 0, hidden: [], nHid: 0, nHidS: 0, cand: { inst: [], skin: [], heavy: [] }, mine: new Set(), candAt: -1e9, passAt: -1e9, box0: null, sh: 0, stepsDown: 0, stepsUp: 0 };
  const v = new T.Vector3(), sph = new T.Sphere();
  const key = () => (world.key && world.key.shadow && world.key.castShadow ? world.key : null);

  function apply(lvl) {
    lvl = Math.max(0, Math.min(STEPS.length - 1, lvl | 0)); st.lvl = lvl; const s = STEPS[lvl];
    R.dpr = s.dpr; R.k = s.k; R.fog = s.fog; R.upd = s.upd; R.sh = s.sh; R.nobloom = s.nobloom; R.norefl = !!s.norefl;
    const k = key();
    if (k) { const c = k.shadow.camera; if (!st.box0) st.box0 = { l: c.left, r: c.right, t: c.top, b: c.bottom }; c.left = -s.box; c.right = s.box; c.top = s.box; c.bottom = -s.box; c.updateProjectionMatrix(); if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true; }
    st.passAt = -1e9; H.resize && H.resize();
  }
  function markHero() { if (S.hero) S.hero.grp.traverse((o) => { o.userData.rpHero = true; }); }
  // what may be dropped when it is far away: LIFE only — crowds (people, workers, animals), skinned creatures and the instanced packs that move.  Buildings and war machines (windmills, trebuchets,
  // ballistas), trees, rocks, grass and every static prop stay in the game's hands: a landmark that vanishes at 80 m would look like a bug.
  const STRUCT = /mill|trebuchet|catapult|ballista|siege|ram\b|blacksmith|tower|barn|silo|coop|tent|banner|flag|defenses|deffield|worksites|townplan|castle|keep|hex|village|static|terrain/i;
  const HEAVY = 100000, trisOf = (o) => { const g = o.geometry; return ((g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : 0) / 3) * o.count; };
  const pathOf = (o) => { let s = ''; for (let p = o; p && p !== scene; p = p.parent) s += (p.name || '') + '>'; return s; };
  function collect() {
    st.cand.inst.length = 0; st.cand.skin.length = 0; st.cand.heavy.length = 0;
    scene.traverse((o) => {
      if (o.userData.rpHero || o.userData.rpKeep || o.userData.rpCull) return;                      // (RP1C: a pack cull.js has taken over is its business)
      if (o.isInstancedMesh && o.count > 0) {
        if (o.userData.a || (o.instanceMatrix.usage === T.DynamicDrawUsage && !STRUCT.test(pathOf(o)))) st.cand.inst.push(o);
        else if (o.count <= 400 && trisOf(o) >= HEAVY && !STRUCT.test(pathOf(o))) st.cand.heavy.push(o);        // a far STATIC pack that is heavy on its own (the attacker camp: 29 x 8.9k triangles, 300 m from the gate)
      }
      else if (o.isSkinnedMesh && o.skeleton && o.skeleton.bones.length && !STRUCT.test(pathOf(o))) st.cand.skin.push(o);
    });
  }
  // the nearest instance of `o` (XZ, world) — the bounding sphere settles it when it is tight, else the instances are read (cheap: a few thousand at most)
  function nearest(o, hx, hz) {
    const ib = o.boundingSphere;
    if (ib && ib.radius < 40) { sph.copy(ib).applyMatrix4(o.matrixWorld); return Math.hypot(sph.center.x - hx, sph.center.z - hz) - sph.radius; }
    const n = o.count; if (n > 3000 || n < 1) return 0;                                           // a big meadow cell: leave it to the game's own thinning
    const a = o.instanceMatrix.array, mw = o.matrixWorld; let best = 1e9;
    for (let i = 0; i < n; i++) { v.set(a[i * 16 + 12], a[i * 16 + 13], a[i * 16 + 14]).applyMatrix4(mw); const d = Math.hypot(v.x - hx, v.z - hz); if (d < best) best = d; }
    return best;
  }
  function pass(now) {
    const s = STEPS[st.lvl], hx = S.x, hz = S.z;
    if (now - st.candAt > 4000) { collect(); st.candAt = now; }
    const hid = st.hidden; hid.length = 0; let nI = 0, nS = 0;
    const seen = new Set();
    const judge = (o, far) => {                                                                       // `rpOff` = hidden by us (the game's own hide is never touched or undone)
      const mine = o.userData.rpOff === 1; seen.add(o);
      if (far) { o.userData.rpOff = 1; o.visible = false; hid.push(o); st.mine.add(o); return true; }
      if (mine) { o.visible = true; o.userData.rpOff = 0; st.mine.delete(o); }
      return false;
    };
    for (const o of st.cand.inst) {
      if (!o.parent || (!o.visible && o.userData.rpOff !== 1)) continue;
      if (judge(o, nearest(o, hx, hz) > s.hideR)) nI++;
    }
    for (const o of st.cand.heavy) {
      if (!o.parent || (!o.visible && o.userData.rpOff !== 1)) continue;
      if (judge(o, nearest(o, hx, hz) > s.hideH)) nI++;
    }
    for (const o of st.cand.skin) {
      if (!o.parent || (!o.visible && o.userData.rpOff !== 1)) continue;
      o.skeleton.bones[0].getWorldPosition(v);
      if (judge(o, Math.hypot(v.x - hx, v.z - hz) > s.hideS)) nS++;
    }
    for (const o of st.mine) if (!seen.has(o)) { o.visible = true; o.userData.rpOff = 0; st.mine.delete(o); }   // (a pack we hid that is no candidate any more — it emptied, was re-made, left the list — comes back: nothing stays hidden by a stale list)
    st.nHid = nI; st.nHidS = nS;
  }
  function enforce() { for (const o of st.hidden) o.visible = false; }       // (the crowds set `visible` again every frame: say it again just before the draw)

  function enter() {
    st.on = true; Object.assign(gov, govInit()); st.stepsDown = st.stepsUp = 0; markHero(); collect(); st.candAt = performance.now(); apply(0);
  }
  function exit() {
    if (!st.on) return; st.on = false;
    for (const o of st.hidden) { o.visible = true; o.userData.rpOff = 0; } st.hidden.length = 0;
    for (const o of st.mine) { o.visible = true; o.userData.rpOff = 0; } st.mine.clear();
    R.dpr = 1; R.k = 1; R.fog = 1; R.upd = 1; R.sh = 0; R.nobloom = false; R.norefl = false;
    const k = key(); if (k && st.box0) { const c = k.shadow.camera; c.left = st.box0.l; c.right = st.box0.r; c.top = st.box0.t; c.bottom = st.box0.b; c.updateProjectionMatrix(); if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true; }
    H.resize && H.resize();
  }
  // called from the hero's frame() (after world.update, before the draw)
  function tick(now, paused) {
    if (!st.on) return;
    if (now - st.passAt > 400) { st.passAt = now; pass(now); }
    enforce();
    if (paused || document.hidden) { gov.last = null; return; }                                   // (a dev-paused or hidden page says nothing about the phone)
    const d = govFrame(gov, now);
    if (d) { if (d > 0) st.stepsDown++; else st.stepsUp++; apply(gov.lvl); }
  }
  const info = () => ({ lvl: st.lvl, label: STEPS[st.lvl].label, fps: Math.round(gov.fps), hid: st.nHid, hidS: st.nHidS, down: st.stepsDown, up: st.stepsUp });
  return { enter, exit, tick, apply, info, gov, STEPS, STRUCT, collect, pass, st };
}
