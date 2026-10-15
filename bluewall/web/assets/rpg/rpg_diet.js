// RP1B — the hero mode's frame-time diet + quality governor.  A lazy ES module (fetched with rpg.js, owner-only; nothing of it is in the boot bundle).
// The strategic view draws the whole map with crowds, workers, grass and shadows out to ~460 m because the camera is high above it.  A walking player sees a few hundred metres, so in hero mode:
//   · the meadow thins out much sooner                                         (REACH.k, read by assets.js meadowLod — neutral = 1 everywhere else)
//   · an instanced prop or a skinned figure whose NEAREST copy is farther than a radius is not drawn at all (far hamlets, the attacker camp, carts, boats)
//   · the sun's shadow box is a quarter of the strategic one (it follows the hero) and is redrawn less often
//   · the render pixel ratio is capped, world.update runs every 2nd drawn frame, the bloom composer can be skipped
//   · a governor measures the REAL frame time and steps this load down (pixel ratio -> shadows -> draw radius -> crowd freeze) and back up (slowly, with hysteresis).
// Nothing is saved anywhere; leaving hero mode puts every knob back.  No new shader programs, no new lights, no new materials.
// RP1C-R2 — the ladder is made for the screen.  Job 1b (the owner's order): a PHONE starts at 1.0 render pixel per CSS pixel with the water mirror off, and may climb to at most 1.5 (Job 9: «sharper», only after 8 s at >= 50 fps per step; a drop from it locks the climb for the session) — never the retina 2.0 that melted phones;
// a big screen (a pointer that is not coarse) may still climb to min(devicePixelRatio, 2) when it has the headroom.  Order of what the governor takes away — the picture stays at 1.0 until everything else has been cut:
//   diet (the start: 1.0)  ->  mirror off  ->  shadows thin  ->  draw radius + fog in  ->  shadows OFF + crowd freeze  ->  pixel ratio 0.85  ->  0.70  ->  0.55   (the last three are COARSE, visible steps: fog in again each time)
// It climbs back up (>= 8 s of >= 50 fps per step).  `abs` = the absolute pixel ratio (main.js multiplies REACH.dpr into min(devicePixelRatio, REACH.cap)).  `q` = the step handed to the underworld / combat setQuality (0 full ... 3 lowest).
// `soff` = the sun's shadow intensity is 0 and the shadow map is not drawn at all (an uniform: no new shader program, so no hitch).  Phone defaults at the start: shadow map <= 1024 (one cascade: there is only one sun box), fog 1.25x, no bloom.
const DIET = { k: 0.25, fog: 1.25, life: 75, upd: 2, sh: 1, box: 44, hideR: 90, hideS: 70, hideH: 160, cullR: 150, lod: 50, nobloom: false, norefl: false };      // lod: the castle's full-model radius in m (RP1C-R2, REACH.lod -> castle_tr2.js lodPick; the strategic default is 80)
export function makeSteps(T) {
  T = Math.max(1, Math.min(2, +T || 1)); const out = [];
  if (T > 1.1) { out.push({ ...DIET, abs: +T.toFixed(3), q: 0, label: 'sharp ' + T.toFixed(2) }); const m = 1 + (T - 1) / 2; if (m > 1.3) out.push({ ...DIET, abs: +m.toFixed(3), q: 0, label: 'sharp ' + m.toFixed(2) }); }   // (a big screen only: a phone has T = 1)
  const cut = { k: 0.16, fog: 2.0, life: 60, sh: 5, box: 34, hideR: 55, hideS: 45, hideH: 110, cullR: 95, lod: 36, nobloom: true, norefl: true };
  const lv = [
    { ...DIET, abs: 1, q: 0, label: 'diet' },
    { ...DIET, abs: 1, q: 0, norefl: true, label: 'mirror off' },
    { ...DIET, abs: 1, q: 1, sh: 5, box: 34, cullR: 125, nobloom: true, norefl: true, label: 'shadows thin' },
    { ...DIET, ...cut, abs: 1, q: 2, label: 'draw radius' },
    { ...DIET, ...cut, abs: 1, q: 3, upd: 4, sh: 1e6, hideS: 25, soff: true, label: 'shadows off' },
    { ...DIET, ...cut, abs: 0.85, q: 3, upd: 4, sh: 1e6, hideS: 25, soff: true, label: 'px 0.85' },
    { ...DIET, ...cut, abs: 0.7, q: 3, upd: 4, sh: 1e6, hideS: 25, soff: true, fog: 2.4, cullR: 80, hideR: 48, label: 'px 0.70' },
    { ...DIET, ...cut, abs: 0.55, q: 3, upd: 4, sh: 1e6, hideS: 20, soff: true, fog: 2.8, cullR: 65, hideR: 42, lod: 30, label: 'px 0.55' },
  ];
  const first = out.length; out.push(...lv); out.first = first;                      // out.first = the level the hero STARTS at (native 1.0)
  return out;
}
export const STEPS = makeSteps(1);                                                    // T = 1 (a phone, and the tests): [diet, mirror, shadows thin, radius, shadows off, 0.85, 0.70, 0.55]
export const GOV_CFG = { down_ms: 1000 / 30, down_win: 2, up_ms: 1000 / 50, up_win: 8, up_hold_ms: 8000, down_hold_ms: 2000, relock_ms: 20000, lock_ms: 60000, max: STEPS.length - 1 };

// ---- the governor as a pure function of time, so a fake clock can test it (dev/rp1b_test.sh)
export function govInit(lvl0 = 0) { return { lvl: lvl0, wStart: null, wN: 0, bad: 0, good: 0, last: null, lastChange: -1e9, lastUp: -1e9, lockUp: -1e9, fps: 0 }; }
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
  const DEVDPR = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const PHONE = H.phone != null ? !!H.phone : (typeof window !== 'undefined' && window.__rpPhone != null) ? !!window.__rpPhone : (typeof window !== 'undefined' && !!window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches) && Math.min(window.innerWidth, window.innerHeight) < 900);   // (RP1C-R2 Job 1b)
  const MAPMAX = 1024;                                                                                                        // the sun's shadow map on a phone: <= 1024 (there is one sun box: one cascade)
  const SHARP = H.sharp != null ? H.sharp : PHONE ? Math.min(DEVDPR, 1.5) : Math.min(DEVDPR, 2), BASE = Math.max(1, Math.min(H.devdpr != null ? H.devdpr : DEVDPR, 2));      // RP1C-R2
  const STEPS = makeSteps(SHARP), CFG = { ...GOV_CFG, max: STEPS.length - 1 }, START = PHONE ? STEPS.first + 1 : STEPS.first;   // (local: this device's ladder; the module-level STEPS is the T = 1 one.  A PHONE starts with the water mirror OFF (level 1): the mirror is a second scene pass = +100 calls / +0.6 M triangles at the gate, measured; the governor puts it back only after 8 s at >= 50 fps)
  const gov = govInit(START);
  let dev_noMap = false;                                                                                                      // (A/B proof: the shadow map stays as the preset made it)
  const st = { on: false, lvl: 0, hidden: [], nHid: 0, nHidS: 0, cand: { inst: [], skin: [], heavy: [] }, mine: new Set(), candAt: -1e9, passAt: -1e9, box0: null, sh: 0, stepsDown: 0, stepsUp: 0, q: 0, ms0: 0, soff: false };
  const v = new T.Vector3(), sph = new T.Sphere();
  const key = () => (world.key && world.key.shadow && world.key.castShadow ? world.key : null);

  function apply(lvl) {
    lvl = Math.max(0, Math.min(STEPS.length - 1, lvl | 0)); st.lvl = lvl; const s = STEPS[lvl];
    R.dpr = s.abs / BASE; R.cap = 2; R.own = true; R.k = s.k; R.lod = s.lod; R.fog = s.fog; R.upd = s.upd; R.sh = s.sh; R.nobloom = s.nobloom || PHONE; R.norefl = !!s.norefl; R.life = s.life | 0;
    const k = key();
    if (k && !!s.soff !== st.soff) { st.soff = !!s.soff; k.shadow.intensity = st.soff ? 0 : 1; if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true; }          // (an uniform: no new program)
    if (k) { const c = k.shadow.camera; if (!st.box0) st.box0 = { l: c.left, r: c.right, t: c.top, b: c.bottom }; c.left = -s.box; c.right = s.box; c.top = s.box; c.bottom = -s.box; c.updateProjectionMatrix(); if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true; }
    st.passAt = -1e9; H.resize && H.resize(); syncQ();
  }
  // RP1C-R2: the underworld and the combat layer have their own quality step (0 full ... 3 lowest): the governor drives them with the same level counter as the home map
  function syncQ() { const q = STEPS[st.lvl].q | 0; st.q = q; if (S.under && S.under.setQuality) S.under.setQuality(q); if (S.cmb && S.cmb.setQuality) S.cmb.setQuality(q); }
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
    st.on = true; Object.assign(gov, govInit(START)); st.stepsDown = st.stepsUp = 0; markHero(); collect(); st.candAt = performance.now();
    { const k = key(); if (k && k.shadow.mapSize.x > MAPMAX && !dev_noMap) { st.ms0 = k.shadow.mapSize.x; k.shadow.mapSize.set(MAPMAX, MAPMAX); if (k.shadow.map) { k.shadow.map.dispose(); k.shadow.map = null; } } }   // (Job 1b: <= 1024 on the hero's small shadow box)
    apply(START);
  }
  function exit() {
    if (!st.on) return; st.on = false;
    for (const o of st.hidden) { o.visible = true; o.userData.rpOff = 0; } st.hidden.length = 0;
    for (const o of st.mine) { o.visible = true; o.userData.rpOff = 0; } st.mine.clear();
    R.dpr = 1; R.cap = 0; R.own = false; R.lod = 0; R.k = 1; R.fog = 1; R.upd = 1; R.sh = 0; R.nobloom = false; R.norefl = false; R.life = 0;
    const k = key(); if (k && st.soff) { st.soff = false; k.shadow.intensity = 1; }
    if (k && st.ms0) { k.shadow.mapSize.set(st.ms0, st.ms0); st.ms0 = 0; if (k.shadow.map) { k.shadow.map.dispose(); k.shadow.map = null; } }
     if (k && st.box0) { const c = k.shadow.camera; c.left = st.box0.l; c.right = st.box0.r; c.top = st.box0.t; c.bottom = st.box0.b; c.updateProjectionMatrix(); if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true; }
    H.resize && H.resize();
  }
  // called from the hero's frame() (after world.update, before the draw)
  function tick(now, paused) {
    if (!st.on) return;
    if (S.where === 'home') { if (now - st.passAt > 400) { st.passAt = now; pass(now); } enforce(); }              // (RP1C-R2: the hiding is the HOME scene's business; the governor itself runs in the underworld too)
    if (paused || document.hidden) { gov.last = null; return; }                                   // (a dev-paused or hidden page says nothing about the phone)
    const d = govFrame(gov, now, CFG);
    if (d) {
      if (d > 0) { st.stepsDown++; if (STEPS[gov.lvl - 1].abs > 1.001 && STEPS[gov.lvl].abs <= 1.001) gov.lockUp = Infinity; } else st.stepsUp++;       // (Job 9: a PHONE may climb to a sharper picture (<= 1.5) only after 8 s at >= 50 fps; if it ever falls back from it, it never tries again this session: a resize is a hitch)
      apply(gov.lvl);
    }
  }
  const info = () => ({ lvl: st.lvl, label: STEPS[st.lvl].label, px: STEPS[st.lvl].abs, phone: PHONE, soff: st.soff, map: (key() || { shadow: { mapSize: { x: 0 } } }).shadow.mapSize.x, fps: Math.round(gov.fps), hid: st.nHid, hidS: st.nHidS, down: st.stepsDown, up: st.stepsUp });
  return { enter, exit, tick, apply, syncQ, info, gov, STEPS, CFG, START, STRUCT, collect, pass, st, PHONE, noMap: (b) => { dev_noMap = !!b; } };
}
