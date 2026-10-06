// Attack mode.  The enemy base IS the main map: the world scene is re-used (walls, towers, keep, vaults, mines, military buildings ... all registered
// as destructible targets, destruct.js), the player's own life (camp army, villagers, patrols, dragon) is hidden, the enemy's level skin is applied,
// and everything fades out → the map fades back in with an opening camera sweep.
// You pick a squad (all soldiers of one type) and tap anywhere: they march there and fight on their own (battlesim.js decides everything),
// the base shoots back, buildings crumble (shader), dragons burn, catapults hurl rocks (bfx.js), the war goes through bsfx.js.
// When it ends the report goes to the server (econ.battleEnd) and the survivors go home.
//   const battle = createBattleMode({ renderer, scene, camera, root, world, audio, econ, ui, weatherMode });
//   battle.start(target)   main loop: if (battle.active) { setTime(battle.hour); world.update; battle.frame(now, dt) }
import { FEATURES } from './features.js';
import { resultExtras } from './resultinfo.js';
import * as THREE from 'three';
import { createBattle, MAXL } from './battlesim.js';
import * as L from './layout.js';
import { buildNav, bridgesFromLayout } from './nav.js';
import { staticSolids } from './solids.js';
import { createCamBlock } from './camblock.js';
import { createSquadRings, SQUAD_COLOR } from './squadring.js';
import { createRingControl } from './ringctl.js';
import { createRingPaths } from './ringpath.js';
import { createThreat, isGun, gunInfo, shareChips } from './threat.js';
import { createFX } from './bfx.js';
import { createSpellFX } from './spellfx.js';
import { findOpponent } from './search.js';
import { createSFX } from './bsfx.js';
import { createUnitViews } from './bunits.js';
import { createHUD, createLoadView } from './bhud.js';
import { NAME } from './armyui.js';
import { SPELL_ORDER, SPELLS } from './spells.js';
import { uLv } from './skin.js';
import { DS, DU } from './destruct.js';
import { PX } from './fx.js';
import { settings } from './settings.js';
import { setEmblem } from './textures.js';
import { createCamp } from './camp.js';
import { attackRoster } from './armyplan.js';
import { createWake } from './wake.js';
import { createCracks } from './cracks.js';
import { setGateName, gateName } from './her_flags.js';
import { setShieldCrest } from './gear_shield.js';
let HOME_GATE = null;                                   // (the home realm's name, while a raid shows the defender's over the gate)
import { smooth } from './noise.js';
const BIGHP = new Set(['giant', 'dragon', 'baby', 'hill', 'shieldmaiden', 'lord', 'werewolf', 'trebuchet', 'captain', 'ogre', 'gryphon', 'lich', 'treant', 'gryphonknight', 'darkrider', 'baby3', 'dragon3']);       // units that get a floating health bar
import DEFS from './unitdefs.json';

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const TICK = 1 / 30;
const gemOrder = ['ruby', 'emerald', 'turq'];
const BATTLE_HOUR = 13.3;
// how long (s) each kind of structure takes to come down (the shader's collapse time, bfx.collapse schedules its dust and heap on it)
const COLLAPSE_T = { keep: 3.4, church: 2.6, tower: 2.0, ballista: 2.0, vault: 2.2, mine: 2.2, barracks: 2.0, training: 1.9, forge: 1.9, stable: 1.9, workshop: 1.9, lair: 2.2, gate: 1.7, house: 1.4, wall: 1.2 };

// a full-screen navy veil (the "everything fades, the map appears again" transition)
function makeVeil(root) {
  const v = document.createElement('div');
  v.style.cssText = 'position:absolute;inset:0;z-index:60;pointer-events:none;opacity:0;transition:opacity .5s ease;background:radial-gradient(circle at 50% 42%,#10294f,#02060f 78%)';
  root.appendChild(v);
  return {
    el: v,
    async show(ms = 500) { v.style.transitionDuration = ms + 'ms'; v.style.pointerEvents = 'auto'; void v.offsetWidth; v.style.opacity = '1'; await wait(ms + 40); },
    async hide(ms = 700) { v.style.transitionDuration = ms + 'ms'; v.style.opacity = '0'; await wait(ms + 40); v.style.pointerEvents = 'none'; },
    remove() { v.remove(); },
  };
}

// ================================================================= the mode
export function createBattleMode({ renderer, scene, camera, root, world, audio, econ, ui, weatherMode = 'auto' }) {
  let S = null, busy = false;
  const dev = () => (typeof window !== 'undefined' && window.__bw ? window.__bw : null);

  async function start(target, preVeil = null, loader = null) {
    if (S || busy) return false;
    busy = true;
    let veil = preVeil;
    try {
      if (!veil && loader) { veil = makeVeil(root); if (ui && ui.root) ui.root.style.opacity = '0'; }                  // (the loading screen already covers everything: no veil to fade in)
      else if (!veil) { veil = makeVeil(root); if (ui && ui.root) { ui.root.style.transition = 'opacity .35s'; ui.root.style.opacity = '0'; } await veil.show(520); }
      else if (ui && ui.root) ui.root.style.opacity = '0';
      S = await build(target, veil, loader);
      veil.remove();                                            // it faded out in build(); a leftover full-screen layer would swallow every tap
    } catch (e) {
      console.error('battle', e);
      try { if (S) exit(S, true); else restoreWorld(null); } catch (e2) { /* ignore */ }
      S = null; if (veil) veil.remove(); if (loader) loader.hide(); if (ui && ui.root) { ui.root.style.opacity = ''; ui.root.style.transition = ''; ui.root.style.display = ''; }
      ui && ui.toast && ui.toast('Battle could not start'); busy = false; return false;
    }
    busy = false; return true;
  }

  function restoreLevels() {
    try { if (settings.previewLevel) world.setLevel(settings.previewLevel); else if (econ.st.prog && econ.st.prog.b) world.levels.setMany(econ.st.prog.b); } catch (e) { /* ignore */ }
  }
  // put the home map back (also used when a start fails half way)
  function restoreWorld(s) {
    world.setBattle(false); DU.battle.value = 0; DS.reset(); restoreLevels(); if (econ.st.emblem) setEmblem(econ.st.emblem); if (HOME_GATE != null) { setGateName(HOME_GATE); HOME_GATE = null; } world.tesla && world.tesla.set((econ.st.own && econ.st.own.tesla) || 0);
    try { world.setWeather && world.setWeather(weatherMode, true); } catch (e) { /* ignore */ }
    if (s) { uLv.value.set(s.savedLv); if (world.key && world.key.shadow) { const c = world.key.shadow.camera; c.left = c.bottom = -s.shadowHalf0; c.right = c.top = s.shadowHalf0; c.updateProjectionMatrix(); world.key.target.position.set(0, 0, 0); } }
  }

  async function build(target, veil, loader = null) {
    const A = world.assets, models = A.models;
    const army = attackRoster(econ.st.army), forge = (econ.st.army && econ.st.army.forge) || 1;          // (his guardians stay home: they are not in the attack roster)
    const sv = (econ.st.army && econ.st.army.spell && econ.st.army.spell.spells) || {}, spells = {}; for (const k of SPELL_ORDER) if (sv[k] && sv[k].n > 0) spells[k] = sv[k].n;
    const nav = buildNav({ height: world.fastHeight, bridges: bridgesFromLayout(L), solids: staticSolids() });        // where ground units may walk: no water except over the bridges, and no going into the farmhouse, the cottages or the mill
    const lv = (econ.st.army && econ.st.army.lv) || {};
    const sim = createBattle({ spec: { levels: target.levels, seed: target.seed, ratio: target.ratio, power: target.power, loot: target.loot, tesla: target.tesla | 0, guard: target.guard }, army, forge, lv, spells,
      targets: JSON.parse(JSON.stringify(world.targets)), meta: world.baseMeta, nav });
    if (world.ballistas && world.ballistas.hide) for (const q of sim.buildings) if (q.off) world.ballistas.hide(q.id);          // (a war machine / wizard the castle does not man at this level or profile is not on its tower)
    const types = DEFS.order.filter((t) => (sim.sent[t] || 0) > 0);
    const kc = world.key && world.key.shadow ? world.key.shadow.camera : null;
    const s = { target, sim, types, spellTypes: SPELL_ORDER.filter((k) => spells[k] > 0), selSpell: null, zones: [], t: 0, acc: 0, started: false, over: false, shake: 0, rc: { drag: null, staged: {}, lit: new Set() }, loading: true, savedLv: Float32Array.from(uLv.value), ann: {}, flash: {}, burners: [], markers: [], barT: 0, lastHud: 0, askT: 0,
      shadowHalf0: kc ? kc.right : 110, hour: BATTLE_HOUR, camera };
    s.block = createCamBlock({ height: world.fastHeight }).set(sim.buildings).spheres(() => world.creatures || []);
    S = s;                                                      // (active from now on: the main loop drives the world, the frame() below waits for `loading`)
    const hud = s.hud = createHUD(root, { target, types, spells: s.spellTypes, onSpell: (k) => selectSpell(s, k), onAbility: (t) => useAbility(s, t), onTool: FEATURES.squad || FEATURES.scout ? (k) => tool(s, k) : null, toolSet: { squad: !!FEATURES.squad, scout: !!FEATURES.scout }, onEnd: () => retreat(s), onNext: () => scoutNext(s), loader });
    hud.el.style.zIndex = '30'; const stage = (f, txt) => hud.progress(f, txt);
    if (ui && ui.root) ui.root.style.display = 'none';
    hud.el.querySelector('.bwb-load').classList.remove('pre');   // (the HUD's own loading screen - or the one the search already showed - takes over from the veil)
    veil.el.style.opacity = '0'; veil.el.style.pointerEvents = 'none'; await nextFrame();

    // ---- turn the map into the enemy's base
    stage(0.05, 'Scouting the land…');
    world.setBattle(true); DU.battle.value = 1; DS.reset(); if (target.emblem) setEmblem(target.emblem); setShieldCrest(target.emblem || 'swords', 'foe'); if (HOME_GATE == null) HOME_GATE = gateName(); setGateName(target.name || ''); world.tesla && world.tesla.set(target.tesla | 0);
    world.setLevel(Math.max(1, Math.min(MAXL, (target.levels && target.levels.keep) | 0 || 1)));
    try { world.setWeather && world.setWeather('clear', true); } catch (e) { /* ignore */ }
    if (kc) { kc.left = kc.bottom = -140; kc.right = kc.top = 140; kc.updateProjectionMatrix(); }
    await nextFrame();

    // ---- effects, sound
    s.fx = createFX(scene, { scale: PX.scale, height: world.fastHeight }); s.sfx = createSFX(audio, camera);
    s.wake = createWake({ scene, fx: s.fx, isWet: (x, z) => nav.isWet(x, z) });
    s.spfx = createSpellFX(scene, { height: world.fastHeight, camera, fx: s.fx });
    s.cracks = createCracks({ scene, height: world.fastHeight, wet: (x, z) => nav.isWet(x, z) });                      // (a walking giant splits the ground; it heals after he has passed)
    stage(0.2, 'Raising the banners…');
    await nextFrame();
    // ---- fighters
    let mustered = 0;
    const H = (x, z) => nav.groundY(x, z, world.fastHeight(x, z));                 // (on a bridge a unit stands on the deck, not on the river bed under it)
    s.H = H;
    const hooks = {
      land: (x, z, big) => { s.fx.dust(x, H(x, z) + 0.4, z, big ? 12 : 5, big ? 9 : 4, big ? 9 : 3, 2.4); if (big) { s.shake = Math.max(s.shake, 0.8); s.fx.debris(x, H(x, z) + 0.5, z, 3, 1, 3, 0x6a5a48, 6, 0.6); } s.sfx.at(big ? 'rock' : 'thud', x, 0, z, big ? 1 : 0.5); },
      crack: (x, z, size, yaw, life) => { s.cracks.add(x, z, size, yaw, life); if (Math.random() < 0.6) s.fx.dust(x, H(x, z) + 0.3, z, 2, 2.4, 2, 1.2); },
      breath: (from, to, big, col) => s.fx.stream(from, to, big, col),
      fireball: (from, to) => { const d = Math.hypot(to[0] - from[0], to[2] - from[2]); s.fx.shoot({ kind: 'fireball', from, to, t: Math.max(0.28, Math.min(0.5, d / 38)), trail: true }); },
      collapse: (x, z, w, h) => { s.fx.debris(x, H(x, z) + 1, z, w, h, w, 0x7a5a38, 14, 0.8); s.fx.puff(x, H(x, z) + 1, z, 6, 6, 5); s.sfx.at('collapse', x, 2, z, 0.7); s.shake = Math.max(s.shake, 0.4); },
    };
    s.views = await createUnitViews({ M: models, scene, sim, forgeLevel: forge, enemyLevel: (target.levels && target.levels.keep) || 1, height: H, hooks, progress: (n) => stage(Math.min(0.82, 0.3 + 0.07 * (++mustered)), 'Mustering ' + n + '…') });
    // the ground where the army stands (and the lane from there to the gate) is cleared of trees, bushes, rocks and grass until the battle is over
    if (sim.deploy) {
      const dp = sim.deploy, tx = -dp.nz, tz = dp.nx; let l0 = 1e9, l1 = -1e9, b0 = 1e9, b1 = -1e9;
      for (const u of sim.units) { const dx = u.x - dp.x, dz = u.z - dp.z, l = dx * tx + dz * tz, b = dx * dp.nx + dz * dp.nz; l0 = Math.min(l0, l); l1 = Math.max(l1, l); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
      const M0 = 11, base = { x: dp.x, z: dp.z, tx, tz, nx: dp.nx, nz: dp.nz };
      stage(0.83, 'Pitching camp…');
      try { s.camp = await createCamp({ scene, height: H, dp: { x: dp.x, z: dp.z, nx: dp.nx, nz: dp.nz }, emblem: econ.st.emblem, army, targets: world.targets }); } catch (e) { console.warn('camp', e); s.camp = null; }      // (the attacker's own camp + crest behind the army)
      s.cleared = world.clearZones([{ ...base, l0: l0 - M0, l1: l1 + M0, b0: b0 - 14, b1: b1 + M0 }, { ...base, l0: -16, l1: 16, b0: -70, b1: 0 }, ...(s.camp ? [{ ...base, ...s.camp.rect }] : [])]);
    }
    s.rings = createSquadRings(scene, { height: world.fastHeight, types }); s.paths = createRingPaths(scene, { height: world.fastHeight });
    s.threat = FEATURES.scout ? createThreat(scene, { height: world.fastHeight }) : null; if (s.threat) s.threat.build(sim.buildings);          // (S8: the reach of every gun, shown while the player looks the base over)
    stage(0.85, 'Charting the roads…');
    for (let j = 0; j < nav.rows; j += 20) { nav.warm(j, j + 20); stage(0.85 + 0.1 * Math.min(1, (j + 20) / nav.rows), 'Charting the roads…'); await nextFrame(); }
    stage(0.96, 'Warming up…');
    // ---- camera + input
    const dp = sim.deploy, k0 = world.baseMeta.keep;
    const az0 = Math.atan2(dp.nx, dp.nz);
    const cam = s.cam = { tx: dp.x, tz: dp.z, dist: 170, az: az0, az0, pitch: 0.9, min: 60, max: 300, intro: 4.2, from: { x: k0.x, z: k0.z } };
    resizeS(s);
    s.nav = nav; setupInput(s);
    // ---- compile everything before the curtain opens
    world.setTime && 0;
    placeCamera(s, 0);
    try { await renderer.compileAsync(scene, camera); } catch (e) { /* the first draw compiles instead */ }
    for (let i = 0; i < 3; i++) { s.views.update(0, 0.016, camera); placeCamera(s, 0); if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera); await nextFrame(); }   // (the home loop leaves shadow autoUpdate off: without the explicit update the new sun has no shadow map and every draw is rejected)
    audio && audio.playMode && audio.playMode('storm');
    audio && audio.setBattle && audio.setBattle(true);
    audio && audio.setWar && audio.setWar(0.25);
    s.loading = false; hud.ready(); s.sfx.horn();
    if (dev()) window.__battle = s;
    return s;
  }

  // ---------------------------------------------------------------- input: one finger pans, two fingers pinch / twist, tap sends the selected squad
  function setupInput(s) {
    const pad = s.hud.pad, pts = new Map(); let down = null, pinch = null;
    const cam = s.cam;
    // p34: the rings are the controls (ringctl.js); a press that lands on a ring is theirs, everything else is the camera's
    const rcg = s.ctl = createRingControl({
      rc: s.rc, types: s.types, sim: s.sim, rings: s.rings, camera: s.camera, pad, H: world.fastHeight,
      ground: (x, y) => groundHit(s, x, y), send: (t, x, z) => sendSquad(s, t, x, z), nav: s.nav,
      vibrate: (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* ignore */ } }, tone: () => audio && audio.click && audio.click(),
    });
    const pan = (dx, dy) => {
      const wpp = (2 * cam.dist * Math.tan((s.camera.fov * Math.PI) / 360)) / Math.max(1, pad.clientHeight), k = wpp / Math.max(0.4, Math.sin(cam.pitch));
      const rx = Math.cos(cam.az), rz = -Math.sin(cam.az), fx = -Math.sin(cam.az), fz = -Math.cos(cam.az);
      cam.tx += -dx * wpp * rx + dy * k * fx; cam.tz += -dx * wpp * rz + dy * k * fz; clampCam(s);
    };
    pad.addEventListener('pointerdown', (e) => {
      if (s.loading || cam.intro > 0.4 || rcg.active) return; try { pad.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
      if (!s.over && !s.confirming && rcg.down(e.pointerId, e.clientX, e.clientY)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
      else { if (down) down.moved = true; const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, a: Math.atan2(b.y - a.y, b.x - a.x) }; }
    });
    pad.addEventListener('pointermove', (e) => {
      if (rcg.owns(e.pointerId)) { rcg.move(e.pointerId, e.clientX, e.clientY); return; }
      const p = pts.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (pts.size === 1 && down) { if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 9) down.moved = true; if (down.moved) pan(dx, dy); }
      else if (pts.size === 2 && pinch) {
        const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, ang = Math.atan2(b.y - a.y, b.x - a.x);
        cam.dist = clamp(cam.dist * (pinch.d / d), cam.min, cam.max);
        let da = ang - pinch.a; da = Math.atan2(Math.sin(da), Math.cos(da)); cam.az = clamp(cam.az - da, cam.az0 - 1.3, cam.az0 + 1.3);
        pinch = { d, a: ang };
      }
    });
    const up = (e) => {
      if (rcg.owns(e.pointerId)) { const r = rcg.up(e.pointerId, e.clientX, e.clientY, e.type === 'pointerup'); if (r === 'tap') tap(s, e.clientX, e.clientY); return; }
      if (pts.size === 1 && down && !down.moved && performance.now() - down.t < 450 && e.type === 'pointerup') tap(s, e.clientX, e.clientY);
      pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) down = null;
    };
    pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
    pad.addEventListener('wheel', (e) => { e.preventDefault(); cam.dist = clamp(cam.dist * (1 + e.deltaY * 0.0012), cam.min, cam.max); }, { passive: false });
    pad.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  const clampCam = (s) => { const c = s.cam, f = s.sim.field; c.tx = clamp(c.tx, f.x0 + 20, f.x1 - 20); c.tz = clamp(c.tz, f.z0 + 20, f.z1 - 20); };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hitP = new THREE.Vector3();
  // where does the finger's ray meet the terrain?
  function groundHit(s, x, y) {
    const r = s.hud.pad.getBoundingClientRect(); ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, s.camera);
    const o = ray.ray.origin, d = ray.ray.direction, H = world.fastHeight;
    let a = 0, t = 2;
    for (let i = 0; i < 600 && t < 3500; i++) {
      const px = o.x + d.x * t, py = o.y + d.y * t, pz = o.z + d.z * t;
      if (py <= H(px, pz)) { let lo = a, hi = t; for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (o.y + d.y * m <= H(o.x + d.x * m, o.z + d.z * m)) hi = m; else lo = m; } return hitP.set(o.x + d.x * hi, 0, o.z + d.z * hi); }
      a = t; t += Math.max(2, t * 0.025);
    }
    return null;
  }
  function tap(s, x, y) {
    if (s.over || s.confirming) return;
    const p = groundHit(s, x, y); if (!p) return;
    if (s.scout && !s.started) {                                                 // S8: while scouting a tap on a gun opens its card; a tap anywhere else sends as usual
      let g = null, bd = 7; for (const b of s.sim.buildings) if (!b.dead && isGun(b)) { const d = Math.hypot(b.x - p.x, b.z - p.z); if (d < bd) { bd = d; g = b; } }
      s.hud.scoutPanel(shareChips(s.sim.buildings), g ? gunInfo(g) : null); if (s.threat) s.threat.focus(g ? g.id : null); return;      // (a tap on empty ground only closes the card: scouting never sends anyone)
    }
    if (s.selSpell) { castSpell(s, s.selSpell, p.x, p.z); return; }
    if (!s.sel) return;                                                           // (p34: squads are sent by dragging their rings: a tap on empty ground does nothing)
    if (s.focusMode && !s.sim.isHero(s.sel)) {                                  // S9: the next tap names ONE building (or defender) for the selected squad
      const tg = s.sim.targetAt(p.x, p.z, 7), n = tg ? s.sim.focus(s.sel, tg, { half: s.half }) : 0;
      if (!tg) { s.hud.toast('Tap a building'); return; }
      if (!n) { s.hud.toast('They cannot reach that'); return; }
      s.focusMode = s.half = false; if (!s.started) { s.started = true; s.hud.announce('CHARGE!'); s.sfx.horn(true); }
      s.markers.push({ x: tg.x, z: tg.z, t: 0 }); return;
    }
    sendSquad(s, s.sel, p.x, p.z);
  }
  function scoutOff(s) { if (!s.scout) return; s.scout = false; if (s.threat) s.threat.show(false); s.hud.scoutPanel(null, null); }
  function tool(s, k) { if (s.over || s.confirming) return; if (k === 'scout') { if (!FEATURES.scout || s.started) return; s.scout = !s.scout; if (s.threat) s.threat.show(s.scout); if (s.scout) { s.hud.scoutPanel(shareChips(s.sim.buildings), null); s.hud.toast('Tap a gun to see what it does'); } else s.hud.scoutPanel(null, null); } else if (!FEATURES.squad) return; else if (k === 'half') { s.half = !s.half; if (s.half) s.hud.toast('The next tap sends half of the squad'); } else if (k === 'focus') { s.focusMode = !s.focusMode; if (s.focusMode) s.hud.toast('Tap a building to attack it'); } audio && audio.click && audio.click(); }
  function select(s, t) { if (s.over) return; s.sel = s.sel === t && !s.selSpell ? null : t; s.selSpell = null; audio && audio.click && audio.click(); }      // (dev only: the HUD has no squad bar any more)
  function selectSpell(s, k) {
    if (s.over) return;
    if (!(s.sim.spells[k] > 0)) { s.hud.toast('No ' + SPELLS[k].name + ' left'); return; }
    if (s.selSpell === k) s.selSpell = null; else s.selSpell = k;
    audio && audio.click && audio.click();
  }
  function castSpell(s, k, x, z) {
    if (s.over || s.confirming) return;
    const f = s.sim.field, cx = clamp(x, f.x0 + 4, f.x1 - 4), cz = clamp(z, f.z0 + 4, f.z1 - 4);
    if (!s.sim.cast(k, cx, cz)) { s.hud.toast('No ' + SPELLS[k].name + ' left'); s.selSpell = null; return; }
    handleEvents(s); s.sim.events.length = 0;                                   // (the cast's own events are pushed outside a sim step, which clears them: show them now or the spell is invisible)
    s.started = true;
    if (!(s.sim.spells[k] > 0)) s.selSpell = null;
  }
  function useAbility(s, type) {
    if (s.over || s.confirming) return;
    const st = s.sim.abilityState(type); if (!st || st.n <= 0) return;
    if (!st.sent) { s.hud.toast('Send ' + NAME[type] + ' first'); return; }
    if (!s.sim.ability(type)) { s.hud.toast(NAME[type] + ': ' + Math.ceil(st.left) + ' s'); return; }
    handleEvents(s); s.sim.events.length = 0;                                  // (shown at once, like a spell)
  }
  function sendSquad(s, type, x, z) {
    if (s.over || s.confirming) return;
    const n = s.sim.send(type, x, z, s.half ? { half: true } : undefined); s.half = false; if (!n) { s.hud.toast(s.sim.alive(type) ? NAME[type] + ' already has its order' : 'No ' + type + ' left'); return; }
    if (!s.started) { s.started = true; s.hud.announce('CHARGE!'); s.sfx.horn(true); }
    const f = s.sim.field; s.markers.push({ x: clamp(x, f.x0 + 4, f.x1 - 4), z: clamp(z, f.z0 + 4, f.z1 - 4), t: 0 });
  }
  function retreat(s) {
    if (s.over) return;
    if (!s.started) { s.done = true; exit(s); return; }                 // scouting only (nothing was sent): HOME leaves at once, no confirmation, no result card
    if (s.confirming) return;
    s.confirming = true;                                                // the fight is frozen while the question is open
    s.hud.confirm({ title: 'Cancel the battle?', text: 'The fight ends right now and you get the result as it stands.', yes: 'Yes', no: 'No' },
      () => { s.confirming = false; if (!s.over) { s.quick = true; s.sim.over = true; s.sim.over_t = s.sim.time; } },
      () => { s.confirming = false; });
  }

  // ---------------------------------------------------------------- camera
  const _look = new THREE.Vector3(), CAM_R = 290 + L.PUSH;                 // (the valley the camera may fly in: the home camera's camR)
  function placeCamera(s, dt) {
    const c = s.cam;
    if (c.free) return;                                                // (dev: a script has taken the camera)
    let tx = c.tx, tz = c.tz, dist = c.dist, az = c.az, pitch = c.pitch;
    if (c.intro > 0) {                                                 // opening sweep: from over the keep, out to the army
      const k = 1 - c.intro / 4.2, e = k * k * (3 - 2 * k);
      tx = c.from.x + (c.tx - c.from.x) * e; tz = c.from.z + (c.tz - c.from.z) * e; dist = 120 + (c.dist - 120) * e; az = c.az0 + 0.9 * (1 - e) + (az - c.az0) * e; pitch = 0.52 + (c.pitch - 0.52) * e;
      c.intro = Math.max(0, c.intro - dt);
    } else pitch = THREE.MathUtils.lerp(0.6, 1.0, smooth(60, 300, dist));
    if (camera.aspect > 1.2) dist *= 1.5;                              // landscape: less height to work with (HUD on top, squad cards at the bottom)
    // p36 (owner 6 Oct 12:06 «تو اتک این دفعه خیلی عقب می‌ره»): the camera stays inside the valley ring like the home camera does — look more top-down first, then pull in.  The map grew (town x1.2, the
    // rim 27 m further out) and the army's ground sits near the rim: the old back-offset ended inside the mountains and the hill-clearing below then lifted the camera far up and away.
    {
      const ux = Math.sin(az), uz = Math.cos(az), tu = tx * ux + tz * uz, room = Math.sqrt(Math.max(0, tu * tu - (tx * tx + tz * tz) + CAM_R * CAM_R)) - tu;
      if (dist * Math.cos(pitch) > room) { pitch = Math.min(1.38, Math.acos(Math.max(0, Math.min(1, room / dist)))); if (dist * Math.cos(pitch) > room) dist = Math.max(45, room / Math.cos(pitch)); }
    }
    s.shake = Math.max(0, s.shake - dt * 1.6);
    const gy = world.fastHeight(tx, tz), cp = Math.cos(pitch), sp = Math.sin(pitch), sh = s.shake * s.shake;
    camera.position.set(tx + Math.sin(az) * cp * dist + (Math.random() - 0.5) * sh * 1.6, gy + sp * dist + (Math.random() - 0.5) * sh, tz + Math.cos(az) * cp * dist + (Math.random() - 0.5) * sh * 1.6);
    const gc = world.fastHeight(camera.position.x, camera.position.z) + 3; if (camera.position.y < gc) camera.position.y = gc;     // never under the ground
    // the view must clear the hills and cliffs: the sight line to the target (and a ring around the camera) stays above the ground, else the camera glides up (never inside a mountain)
    {
      const H = world.fastHeight, cx = camera.position.x, cz = camera.position.z; let need = 0;
      for (let i = 1; i <= 12; i++) { const t = i / 13, r = (H(cx + (tx - cx) * t, cz + (tz - cz) * t) + 4 - gy * t) / (1 - t); if (r > need) need = r; }
      for (let a = 0; a < 6.2; a += 1.0472) { const r = H(cx + Math.cos(a) * 6, cz + Math.sin(a) * 6) + 3.2; if (r > need) need = r; }
      const want = Math.max(0, need - camera.position.y), off = s.terOff || 0, k = want > off ? 1 - Math.exp(-dt / 0.12) : 1 - Math.exp(-dt / 0.5);
      s.terOff = off + (want - off) * k; if (s.terOff < 0.01) s.terOff = 0;
      camera.position.y += s.terOff;
    }
    if (s.block) camera.position.y = s.block.lift(camera.position.x, camera.position.y, camera.position.z, dt);                    // ...nor inside a building, a tower, the keep or a creature
    camera.lookAt(_look.set(tx, gy, tz)); camera.updateMatrixWorld(true);
    // the sun's shadow box follows what we look at (snapped to its texel grid so the shadows do not swim)
    const key = world.key;
    if (key && key.shadow && key.shadow.camera) { const g = 280 / (key.shadow.mapSize.x || 1024), sx = Math.round(tx / g) * g, sz = Math.round(tz / g) * g; key.target.position.set(sx, gy, sz); key.target.updateMatrixWorld(); }
  }
  function resizeS(s) { /* the main loop owns the camera aspect / fov and PX.scale */ void s; }

  // ---------------------------------------------------------------- sim events -> pictures and sounds
  // p35: look + sound of each hero power: ring / flash colour, spark colour, sound, shake, the word that flashes on the screen
  const ABIL_FX = { shieldmaiden: { c: [0.6, 0.85, 1], s: [0.7, 0.9, 1], snd: 'clang', chime: 1, shake: 0.35, say: 'SHIELD WALL' }, lord: { c: [1, 0.93, 0.7], s: [1, 0.9, 0.6], snd: 'rage', shake: 0.7, say: 'RALLY CHARGE' },
    captain: { c: [0.55, 0.88, 1], s: [0.75, 0.95, 1], snd: 'chime', shake: 0.2, say: 'BANNER' }, gryphonknight: { c: [1, 0.82, 0.45], s: [1, 0.9, 0.6], snd: 'launch', shake: 0.15, say: 'DIVE STRIKE' },
    darkrider: { c: [0.62, 0.48, 1], s: [0.75, 0.6, 1], snd: 'rage', shake: 0.45, say: 'SHADOW BREATH' } };
  const FIRE_SRC = { dragon: 1, baby: 1, dragonling: 1, g_dragon: 1, g_baby: 1, dragon3: 1, baby3: 1, darkrider: 1 };
  function shotFx(s, e) {                                     // (a unit's arrow / orb leaves at the moment of release, e.delay s after the swing starts; towers and engines at once)
    const fx = s.fx, sfx = s.sfx, H = world.fastHeight;
    {
      let ev = e;
          // (p22) a heavy tower whose weapon at home is a cannon fires a cannonball, not a bolt
          if (ev.kind === 'bolt' && e.b && world.ballistas && world.ballistas.kindOf && world.ballistas.kindOf(e.b) === 'cannon') { world.ballistas.fire(ev.b, ev.to[0], ev.to[1], ev.to[2], e.q); ev = { ...e, kind: 'ball', b: null }; }
          fx.shoot({ kind: ev.kind, from: ev.from, to: ev.to, t: ev.t, trail: ev.kind === 'rock' || ev.kind === 'ball' || ev.kind === 'orb' || ev.kind === 'frost' });
          if (ev.kind === 'rock') { sfx.at('launch', ev.from[0], 3, ev.from[2], ev.big ? 1.1 : 0.9); fx.puff(ev.from[0], H(ev.from[0], ev.from[2]) + 1.5, ev.from[2], ev.big ? 4 : 2, 3, 2); }
          else if (ev.kind === 'ball') { sfx.at('cannon', ev.from[0], 2, ev.from[2], 1); fx.flash(ev.from[0], ev.from[1] + 0.6, ev.from[2], 4.5, [1, 0.75, 0.35]); fx.puff(ev.from[0], Math.max(H(ev.from[0], ev.from[2]) + 2, ev.from[1]), ev.from[2], 6, 4, 3); }
          else if (ev.kind === 'orb') { sfx.at('zap', ev.from[0], ev.from[1], ev.from[2], 0.6); if (ev.b && world.ballistas) world.ballistas.fire(ev.b, ev.to[0], ev.to[1], ev.to[2]); }
          else if (ev.kind === 'bolt') { sfx.at('bolt', ev.from[0], ev.from[1], ev.from[2], 0.9); if (ev.b && world.ballistas) world.ballistas.fire(ev.b, ev.to[0], ev.to[1], ev.to[2]); }
          else if (ev.kind === 'frost') { sfx.at('freeze', ev.from[0], ev.from[1], ev.from[2], 0.55); fx.flash(ev.from[0], ev.from[1] + 1, ev.from[2], 5, [0.55, 0.82, 1]); if (ev.b && world.ballistas) world.ballistas.fire(ev.b, ev.to[0], ev.to[1], ev.to[2]); }
          else if (ev.kind === 'flame') {                                       // p35 flame tower: a short roaring jet from the brazier to the target, a burst where it lands
            sfx.at('launch', ev.from[0], ev.from[1], ev.from[2], 0.8); fx.flash(ev.from[0], ev.from[1] + 2, ev.from[2], 7, [1, 0.55, 0.18]);
            for (let n = 0; n < 7; n++) fx.later(n * 0.06, () => fx.stream(ev.from, ev.to, true, 'orange'));
            fx.later(Math.max(0.1, ev.t), () => { fx.flash(ev.to[0], ev.to[1] + 0.8, ev.to[2], 7, [1, 0.6, 0.2]); fx.spark(ev.to[0], ev.to[1] + 0.8, ev.to[2], 10, 9, [1, 0.62, 0.16]); });
            if (ev.b && world.ballistas) world.ballistas.fire(ev.b, ev.to[0], ev.to[1], ev.to[2]);
          }
          else sfx.at('arrow', ev.from[0], ev.from[1], ev.from[2], 0.55);
    }
  }
  function handleEvents(s) {
    const sim = s.sim, fx = s.fx, sfx = s.sfx, H = world.fastHeight;
    for (const e of sim.events) {
      s.views.event(e, s.t);
      switch (e.k) {
        case 'shot': { if (e.delay > 0 && !e.late) { const e2 = { ...e, late: 1 }; fx.later(e.delay, () => shotFx(s, e2)); break; } shotFx(s, e); break; }
        case 'hit': {
          const b = sim.buildings.find((q) => q.id === e.b); if (!b) break;
          s.flash[b.id] = 1; if (Math.random() < 0.5) fx.dust(e.x + (Math.random() - 0.5) * b.w * 0.5, H(e.x, e.z) + 1 + Math.random() * 3, e.z + (Math.random() - 0.5) * b.d * 0.5, 2, 2.4, 1.5, 1.4);
          sfx.at('stone', e.x, 2, e.z, 0.7);
          // fire sets a structure alight (owner 5 Oct 01:05): dragon breath, baby dragons, the dragonling's fireballs and the foe's guardian dragons ignite whatever they hit (stone walls only scorch);
          // a building that has lost more than half its strength burns on its own
          const lit = !b.dead && b.type !== 'wall' && (FIRE_SRC[e.src] || (!b.burn && b.hp < b.maxHp * 0.45));
          if (lit) { if (!b.burn) { b.burn = true; s.burners.push({ x: b.x, y: H(b.x, b.z) + 1, z: b.z, t: 0, life: FIRE_SRC[e.src] ? 26 : 40, big: Math.max(b.w, b.d) > 9, b, w: b.w, d: b.d, hh: Math.min(b.h || 6, 14) }); } else { const q = s.burners.find((r) => r.b === b); if (q && FIRE_SRC[e.src]) q.t = Math.min(q.t, q.life * 0.3); } }      // (more fire on a burning building keeps it burning)
          break;
        }
        case 'collapse': {
          const gy = H(e.x, e.z), dur = COLLAPSE_T[e.type] || 1.6, big = e.type === 'keep' || e.type === 'church';
          fx.collapse(e, dur);
          sfx.at('collapse', e.x, 2, e.z, 1); s.shake = Math.max(s.shake, e.type === 'keep' ? 1.5 : e.type === 'wall' ? 0.45 : 0.85);
          if (e.type !== 'wall' && e.type !== 'gate') s.burners.push({ x: e.x, y: gy + 1, z: e.z, t: 0, life: 70, big: true, delay: dur * 0.7 });
          if (e.type === 'vault') {                                                    // the crown gem and the heap in front of the door were loose meshes: they burst out of the vault
            const v = world.vaults && world.vaults.list.find((q) => q.id === e.gem);
            if (v) fx.later(dur * 0.22, () => { fx.vaultBurst(e.gem, v.x, v.y, v.z, [v.top.x, v.y + 9, v.top.z], [v.pileCenter.x, v.pileCenter.y + 1, v.pileCenter.z]); sfx.at('chime', v.x, 6, v.z, 0.9); });
          }
          world.targetDown(e.b);
          if (e.type === 'keep') s.hud.announce('KEEP DESTROYED');
          void big;
          break;
        }
        case 'splash': { const gy = H(e.x, e.z); fx.flash(e.x, gy + 1.5, e.z, e.r * 1.4, [1, 0.8, 0.5]); fx.puff(e.x, gy + 0.6, e.z, 3, e.r * 1.1, e.r * 0.5, [0.55, 0.5, 0.44], 1.8, 1.8); fx.spark(e.x, gy + 1.5, e.z, 5, 9); sfx.at(e.r >= 4 ? 'rock' : 'thud', e.x, 1, e.z, e.r >= 4 ? 1 : 0.6); break; }
        case 'melee': if (Math.random() < 0.7) { const cl = Math.random() < 0.35 ? 'clang' : 'sword', mx = (e.x + e.tx) / 2, mz = (e.z + e.tz) / 2; fx.later(e.hit || 0.25, () => { fx.spark(mx, H(e.x, e.z) + 2.2, mz, 3, 5); sfx.at(cl, e.x, 2, e.z, 0.85); }); } break;       // (sparks and clang at the moment of contact, like the damage)
        case 'slam': s.cracks && s.cracks.add(e.x, e.z, 7.5, Math.random() * 6.28, 9); s.shake = Math.max(s.shake, 0.45); fx.dust(e.x, H(e.x, e.z) + 0.5, e.z, 7, 6, 6, 2.2); sfx.at('rock', e.x, 1, e.z, 0.8); break;
        case 'breath': sfx.at('breath', e.from[0], e.from[1], e.from[2], 0.9); sfx.roar(e.from[0], e.from[2], e.big); break;
        case 'ability': {                                                           // a hero power: a ring sweeps out, a flash, and the shield wall keeps pulsing around her
          const gy = H(e.x, e.z), AB = ABIL_FX[e.type] || ABIL_FX.shieldmaiden;
          fx.ring(e.x, gy + 0.7, e.z, e.r, AB.c, 56, 0.9, 0.5, 2.4); fx.flash(e.x, gy + 2.6, e.z, e.r * 1.2, AB.c);
          fx.spark(e.x, gy + 2, e.z, 14, 11, AB.s);
          sfx.at(AB.snd, e.x, 3, e.z, 1); if (AB.chime) sfx.at('chime', e.x, 3, e.z, 0.7); s.shake = Math.max(s.shake, AB.shake);
          s.hud.announce(AB.say);
          if (e.type === 'shieldmaiden') (s.auras = s.auras || []).push({ id: e.id, until: s.t + e.dur, next: 0, r: e.r });
          break;
        }
        case 'spell': {
          const gy = H(e.x, e.z), d = e.type;
          s.spfx.cast(d, e.x, e.z, e.r, e.dur);
          if (d === 'lightning') sfx.at('thunder', e.x, 3, e.z, 0.6);
          else if (d === 'heal' || d === 'rage') { s.zones.push({ type: d, x: e.x, y: gy, z: e.z, r: e.r, until: sim.time + e.dur }); sfx.at(d, e.x, 2, e.z, 0.9); }
          else if (d === 'freeze') { fx.frost(e.x, gy, e.z, e.r); sfx.at('freeze', e.x, 2, e.z, 0.9); }
          else if (d === 'quake') { sfx.at('quake', e.x, 2, e.z, 1); s.shake = Math.max(s.shake, 1.1); }
          break;
        }
        case 'bolt': s.spfx.bolt(e.x, e.z); sfx.at('thunder', e.x, 3, e.z, 0.9); s.shake = Math.max(s.shake, 0.3); break;
        case 'zap': {                                                              // Tesla chain: orb -> every unit it hit, at the height the unit is DRAWN (fliers, bridge decks)
          const GY = s.H || H, p = e.pts.map(([x, y, z], i) => { const v = i > 0 && e.ids && s.views.views.get(e.ids[i - 1]), pt = v && v.parts && v.parts[0] && v.parts[0].p; return pt ? [pt.x, pt.y + 2.2, pt.z] : [x, y + GY(x, z), z]; });
          const o = world.tesla && world.tesla.orb(e.b); if (o) p[0] = o;
          fx.zap(p); sfx.at('zap', p[0][0], p[0][1], p[0][2], 0.9); world.tesla && world.tesla.fire(e.b); break;
        }
        case 'stand': { const gy = H(e.x, e.z); fx.ring(e.x, gy, e.z, 3.2, [0.6, 0.9, 1], 28, 0.7, 2.5, 2.2); fx.flash(e.x, gy + 2, e.z, 5, [0.7, 0.9, 1]); break; }
        case 'freezeB': { const b = sim.buildings.find((q) => q.id === e.b); s.spfx.frozen(e.x, e.z, b ? Math.max(b.w, b.d) : 6, e.h || 6, sim.spellDefs.freeze.dur, b ? Math.min(b.w, b.d) : 6, b ? b.rot || 0 : 0); break; }
        case 'hurt': if (Math.random() < 0.4) sfx.at('hurt', e.x, 1.5, e.z, 0.5); break;
        case 'die': { if (Math.random() < 0.6) fx.puff(e.x, H(e.x, e.z) + 0.8, e.z, 2, 2.4, 1.2, [0.62, 0.56, 0.48], 1.4, 1.2); break; }
        default: break;
      }
    }
  }

  // ---------------------------------------------------------------- per frame (the main loop has already set the time of day and updated the world)
  const _p = new THREE.Vector3();
  function frame(now, dt) {
    const s = S; if (!s || s.loading) return;
    dt = Math.min(0.05, Math.max(0.001, dt));
    s.t += dt;
    const sim = s.sim;
    // simulation (fixed 30 Hz steps, started by the first deployment)
    if (s.started && !sim.over && !s.confirming) {
      s.acc += dt; let n = 0; const t0 = performance.now();
      while (s.acc >= TICK && n++ < 4) { s.acc -= TICK; sim.step(TICK); handleEvents(s); if (sim.over) break; if (performance.now() - t0 > 9) { s.acc = Math.min(s.acc, TICK); break; } }   // (a slow phone lets the fight run a little slower instead of freezing the app)
    }
    if (sim.over && !s.over) { s.over = true; s.overAt = s.t; handleEvents(s); }
    // base: damage / collapse / flash → the destruction texture
    for (const b of sim.buildings) {
      const f = s.flash[b.id] || 0; if (f > 0) s.flash[b.id] = Math.max(0, f - dt * 3.5);
      if (b.dead) b.cTv = Math.min(1, (b.cTv || 0) + dt / (COLLAPSE_T[b.type] || 1.6));                  // (shown time: runs on even after the battle is over, so nothing stays half fallen)
      const dm = 1 - b.hp / b.maxHp, cp = b.dead ? Math.max(0.0001, b.cTv || 0) : 0;
      DS.set(b.id, { collapse: cp, dmg: b.dead ? 1 : dm, flash: f });
    }
    DS.flush();
    // the shield wall pulses around her while it lasts
    if (s.auras && s.auras.length) for (let i = s.auras.length - 1; i >= 0; i--) {
      const a = s.auras[i], u = sim.units.find((q) => q.id === a.id);
      if (!u || u.dead || s.t >= a.until) { s.auras.splice(i, 1); continue; }
      if (s.t >= a.next) { a.next = s.t + 0.55; const gy = world.fastHeight(u.x, u.z); s.fx.ring(u.x, gy + 0.6, u.z, a.r * 0.5, [0.6, 0.85, 1], 28, 0.7, 0.4, 1.4); }
    }
    // burning wrecks
    for (let i = s.burners.length - 1; i >= 0; i--) {
      const q = s.burners[i]; q.t += dt; q.acc = (q.acc || 0) + dt;
      if (q.t > q.life || (q.b && q.b.dead)) { s.burners.splice(i, 1); continue; }
      if (q.t < (q.delay || 0)) { q.acc = 0; continue; }
      if (q.acc > (q.big ? 0.1 : 0.16)) {
        q.acc = 0; const k = 1 - q.t / q.life, fw = q.w ? q.w * 0.8 : 3, fd = q.d ? q.d * 0.8 : 3, fh = q.hh || 0;
        s.fx.smoke(q.x + (Math.random() - 0.5) * fw, q.y + fh * 0.6, q.z + (Math.random() - 0.5) * fd, 1, q.big ? 6 : 4, 5, 0.18);
        for (let n = 0; n < (q.b ? 2 : 1); n++) if (Math.random() < Math.min(1, k * 1.3)) s.fx.fire(q.x + (Math.random() - 0.5) * fw, q.y + Math.random() * fh * 0.85, q.z + (Math.random() - 0.5) * fd, 1, q.big ? 3.4 : 2.4);       // (flames lick all over the footprint and up the walls)
      }
    }
    // lasting spells (healing / rage): glowing motes while they last
    for (let i = s.zones.length - 1; i >= 0; i--) { const zn = s.zones[i]; if (sim.time >= zn.until) { s.zones.splice(i, 1); continue; } s.fx.zone(zn, dt); }
    // marker rings (where a squad was sent / a spell fell)
    for (let i = s.markers.length - 1; i >= 0; i--) {
      const m = s.markers[i]; m.t += dt;
      if (m.t > 0.9) { if (m.mesh) { scene.remove(m.mesh); m.mesh.material.dispose(); } s.markers.splice(i, 1); continue; }
      const k = m.t / 0.9; if (!m.mesh) { m.mesh = ringMesh(); scene.add(m.mesh); m.mesh.position.set(m.x, world.fastHeight(m.x, m.z) + 0.4, m.z); if (m.r) m.mesh.material.color.set(m.color && m.color.startsWith('rgba') ? 'rgb(' + m.color.slice(5, -1).split(',').slice(0, 3).join(',') + ')' : 0xffffff); }
      m.mesh.scale.setScalar(m.r ? m.r * (0.35 + 0.65 * Math.sqrt(k)) : 2 + k * 9); m.mesh.material.opacity = (1 - k) * 0.9;
    }
    // camera, units, effects
    placeCamera(s, dt);
    s.views.update(s.t, dt, camera);
    if (s.ctl) s.ctl.update();
    if (s.rings) { s.rings.update(sim, s.rc.lit, dt, s.t, ringGhosts(s), s.camera.position); ringView(s); }
    if (s.scout && s.started) scoutOff(s);                                       // (the first squad on its way: the defence overlay goes away)
    if (s.camp) s.camp.update(s.t);
    if (s.wake) s.wake.update(sim.units, dt);
    s.fx.update(dt, camera); s.spfx.update(dt); s.cracks && s.cracks.update(dt);
    // war drums follow the fight: a heartbeat before the army moves, a march when it engages, fills when everything is burning
    s.warT = (s.warT || 0) - dt;
    if (s.warT <= 0 && audio && audio.setWar) {
      s.warT = 0.6; let act = 0, tot = 0; for (const u of sim.units) { tot++; if (u.active && !u.dead) act++; }
      const L = s.over ? 0 : Math.min(1, (s.started ? 0.3 : 0.2) + 0.45 * (tot ? act / tot : 0) + 0.3 * Math.min(1, (sim.destruction ? sim.destruction() : 0) / 80));
      audio.setWar(L); s.sfx.bed(s.over ? 0 : Math.min(1, 0.15 + (tot ? act / tot : 0) * 0.85));
    }
    // HUD (every frame is cheap: only changed values touch the DOM)
    hudUpdate(s, dt);
    if (s.over && !s.done && s.t - s.overAt > (s.quick ? 0.2 : 2.2)) finish(s);
  }
  // ---------------------------------------------------------------- the ring controls: what is drawn (the ghosts, the dotted arrows, the count / health tags under each ring)
  // s.rc = { drag: {types, x, z, off:{type:[dx, dz]}} | null, staged: {type:{x, z}}, lit: Set(types) }  (the gestures write it; the picture only reads it)
  function ringGhosts(s) {
    const rc = s.rc, out = [];
    for (const t in rc.staged) if (!(rc.drag && rc.drag.types.includes(t))) out.push({ t, x: rc.staged[t].x, z: rc.staged[t].z, mode: 'staged' });
    if (rc.drag) for (const t of rc.drag.types) { const o = rc.drag.off && rc.drag.off[t] || [0, 0]; { const [px, pz] = s.ctl ? s.ctl.place(t, rc.drag.x + o[0], rc.drag.z + o[1]) : [rc.drag.x + o[0], rc.drag.z + o[1]]; out.push({ t, x: px, z: pz, mode: 'drag', prog: rc.drag.prog || 0 }); } }
    return out;
  }
  // the roads: from each ring's edge to its ghost ring (drag or waiting), drawn on the terrain in the rings' own language (ringpath.js)
  const _col = {};
  function ringView(s) {
    const list = [];
    for (const g of ringGhosts(s)) {
      const inf = s.rings.info(g.t); if (!inf) continue;
      const dx = g.x - inf.cx, dz = g.z - inf.cz, L = Math.hypot(dx, dz); if (L < inf.r * 2 + 4) continue;                          // (the ghost still overlaps its ring: no road yet)
      const ux = dx / L, uz = dz / L, c = _col[g.t] || (_col[g.t] = new THREE.Color(SQUAD_COLOR[g.t] || '#9fe6ff'));
      list.push({ x0: inf.cx + ux * inf.r * 0.96, z0: inf.cz + uz * inf.r * 0.96, x1: g.x - ux * inf.r * 0.96, z1: g.z - uz * inf.r * 0.96, color: c, k: g.mode === 'staged' ? 1 : g.prog || 0, a: g.mode === 'staged' ? 0.85 : 1 });
    }
    s.paths.update(list, s.t, s.cam.dist);
  }
  const _ringG = new THREE.RingGeometry(0.82, 1, 40).rotateX(-Math.PI / 2);
  const ringMesh = () => new THREE.Mesh(_ringG, new THREE.MeshBasicMaterial({ color: 0x9fe6ff, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));

  function hudUpdate(s, dt) {
    const sim = s.sim;
    s.lastHud += dt;
    if (s.lastHud > 0.1 || s.over) {
      s.lastHud = 0;
      const abil = {}; for (const t of Object.keys(sim.heroes || {})) if (s.types.includes(t)) abil[t] = sim.abilityState(t);
      s.hud.update({ left: sim.endAt - sim.time, des: sim.destruction(), starsN: sim.stars, loot: sim.lootNow(), started: s.started, spellN: sim.spells, selSpell: s.selSpell, abil, tools: FEATURES.squad || FEATURES.scout ? { show: s.started ? !!FEATURES.squad && !!s.sel && !s.selSpell && !s.sim.isHero(s.sel) : !!FEATURES.scout, half: s.half, focus: s.focusMode, scout: s.scout } : null });
      if (!s.ann.half && sim.destruction() >= 50) { s.ann.half = 1; s.hud.announce('★  50 %'); }
    }
    // HP bars over damaged buildings and big monsters (every frame: they follow the camera; one stable element per entity)
    {
      const list = [], w = s.hud.pad.clientWidth, h = s.hud.pad.clientHeight, H = world.fastHeight, sc = clamp(150 / Math.max(40, s.cam.dist), 0.8, 1.35);
      const top = h < 560 ? 62 : 138, bot = h < 560 ? 84 : 118;                                             // (the bars live in the open field: never over the timer / loot row, the squad cards or the screen edge)
      const add = (id, x, y, z, k, u) => { _p.set(x, y, z).project(camera); if (_p.z > 1) return; const px = (_p.x * 0.5 + 0.5) * w, py = (-_p.y * 0.5 + 0.5) * h; if (px < 26 || px > w - 26 || py < top || py > h - bot || (px > w - 72 && py > h * 0.42)) return; if (list.length < 24) list.push({ id, x: px, y: py, k, u, sc }); };
      for (const b of sim.buildings) if (!b.dead && b.hp < b.maxHp * 0.999 && b.type !== 'wall') add('b' + b.id, b.x, H(b.x, b.z) + b.h + 3, b.z, b.hp / b.maxHp, false);
      for (const u of sim.units) if (!u.dead && u.active && BIGHP.has(u.type) && u.hp < u.maxHp) add('u' + u.id, u.x, H(u.x, u.z) + (u.air ? 14 : 12) + (u.y || 0), u.z, u.hp / u.maxHp, true);
      s.hud.bars(list);
    }
  }

  // dev / test: run `sec` seconds of battle without drawing
  function advance(sec) {
    const s = S; if (!s) return 0; let n = 0;
    for (let t = 0; t < sec && !s.sim.over; t += TICK) { s.t += TICK; s.sim.step(TICK); handleEvents(s); s.views.update(s.t, TICK, camera); s.fx.update(TICK, camera); n++; }
    if (s.sim.over && !s.over) { s.over = true; s.overAt = s.t; handleEvents(s); }
    return n;
  }

  async function finish(s) {
    if (s.done) return; s.done = true;
    const sim = s.sim, r = sim.result();
    const sent = {}, lost = {}; for (const u of sim.units) if (u.active) sent[u.type] = (sent[u.type] || 0) + 1;
    for (const k of Object.keys(r.lost)) lost[k] = Math.min(r.lost[k], sent[k] || 0);
    const rep = { sent, lost, destruction: r.destruction, stars: r.stars, loot: r.loot, spells: { ...sim.spellsUsed } };
    s.sfx.fanfare(r.stars > 0); if (r.stars > 0) s.sfx.cheer();
    let note = '', ok = true, cups = null, stars = r.stars;
    try {
      if (econ.token) s.hud.toast('Saving the result…');
      const j = await econ.battleEnd(s.target.id, rep);
      if (!j || !j.ok) { ok = false; if (econ.token) econ.load();      // (it may have been applied before the connection dropped: re-read the truth)
        const why = (j && (j.why || j.reason)) || 'offline'; note = why === 'closed' ? 'Attacks are not open yet.' : why === 'locked' ? 'Your session ended. Reopen the app to record battles.' : 'The result could not be recorded (' + why + ').'; }
      else if (j.info) { if (j.info.report && j.info.report.lost && typeof lost === 'object') Object.assign(lost, j.info.report.lost); if (j.info.loot) rep.loot = j.info.loot; if (j.info.tro != null) cups = j.info.tro; if (j.info.stars != null) stars = j.info.stars; }      // (the server's count is the one that counts)
    }
    catch (e) { ok = false; note = 'The result could not be recorded.'; }
    const left = Math.max(0, ((econ.st.army && econ.st.army.space) || 0) - Object.entries((econ.st.army && econ.st.army.guard) || {}).reduce((s, [u, n]) => s + n * ((DEFS.units[u] && DEFS.units[u].space) || 0), 0));
    const xr = FEATURES.resultInfo ? resultExtras({ stats: sim.stats, sent, lost, r: { stars, destruction: r.destruction, time: r.time } }) : null;      // (S10, off until the owner says OK)
    s.hud.showResults({
      by: xr && xr.by, hint: xr && xr.hint,
      stars, destruction: r.destruction, time: r.time, spells: rep.spells, loot: ok ? rep.loot : Object.fromEntries(gemOrder.map((g) => [g, 0])), sent, lost,
      cups, razed: sim.buildings.reduce((a, b) => a + (b.dead && !b.ring ? b.n || 1 : 0), 0), buildings: sim.buildings.reduce((a, b) => a + (b.ring ? 0 : b.n || 1), 0), note, canNext: ok && left > 0,
    }, { onHome: () => exit(s), onNext: () => next(s) });
  }
  async function next(s) {
    if (s.searching) return; s.searching = true;
    // ONE loading screen for the whole way (owner's rule: no extra page): it opens now, follows the search to 35 %, then the next battle's HUD adopts it and carries it to 100 %
    const L = createLoadView(root, { title: '', sub: 'Scouting the land…' }).show();
    const ctl = { cancelled: false }; L.onCancel(() => { ctl.cancelled = true; });
    let r; try { r = await findOpponent(econ, { ctl, onProgress: (f, t) => L.progress(f * 0.35, t) }); } catch (e) { r = { ok: false, why: 'bad' }; }
    s.searching = false;
    if (r.ok) {
      L.noCancel(); await exit(s, true, true); await start(r.target, null, L);
    } else {
      L.hide();
      if (S === s && s.hud) { s.hud.resultsIdle && s.hud.resultsIdle(); if (r.why !== 'cancel') s.hud.toast(r.why === 'no_army' ? 'No army left' : 'No target found'); }   // (the results card must never be left with a dead button)
    }
  }
  const scoutNext = (s) => { if (s.started || s.loading || s.done) return; next(s); };   // (NEXT while scouting: before the first soldier is sent only)
  // fade out → put the home map back → fade in (keepVeil: the next battle follows at once, no flash of the home screen)
  async function exit(s, quick = false, chain = false) {
    if (S !== s || s.exiting) return;
    s.exiting = true;
    const veil = quick ? null : makeVeil(root);
    if (veil) await veil.show(450);
    try { s.hud.dispose(); } catch (e) { /* ignore */ }
    try {
      for (const m of s.markers) if (m.mesh) { scene.remove(m.mesh); m.mesh.material.dispose(); }
      if (s.rings) { s.rings.dispose(); s.rings = null; }
      if (s.paths) { s.paths.dispose(); s.paths = null; }
      if (s.threat) { s.threat.dispose(); s.threat = null; }
      if (s.camp) { s.camp.dispose(); s.camp = null; }
      if (s.wake) { s.wake.dispose(); s.wake = null; }
      if (s.sfx && s.sfx.dispose) s.sfx.dispose();
      for (const k of Object.values(s.views.kinds)) k.texture && k.texture.dispose();
      s.views.dispose();
      s.spfx && s.spfx.dispose(); s.cracks && s.cracks.dispose(); s.fx && s.fx.dispose && s.fx.dispose();                        // (its particle textures are shader uniforms)
    } catch (e) { /* ignore */ }
    restoreWorld(s);
    S = null; if (dev()) window.__battle = null;
    if (!chain && ui && ui.root) { ui.root.style.display = ''; ui.root.style.opacity = '0'; void ui.root.offsetWidth; ui.root.style.transition = 'opacity .5s'; ui.root.style.opacity = ''; }
    audio && audio.playMode && audio.playMode('day');
    audio && audio.setBattle && audio.setBattle(false);
    audio && audio.setWar && audio.setWar(0);
    if (veil) { if (chain) return veil; await veil.hide(650); veil.remove(); }
    return null;
  }

  return { start, frame, resize() {}, get hour() { return S ? S.hour : BATTLE_HOUR; }, get active() { return !!S; }, get loading() { return !!(S && S.loading); }, get session() { return S; }, exit: () => S && exit(S), advance, _kill: (id) => { if (!S) return 0; const b = S.sim.buildings.find((q) => q.id === id || q.type === id); if (!b || b.dead) return 0; b.hp = 0; b.dead = true; b.collapseT = 0; S.sim.events.length = 0; S.sim.events.push({ k: 'collapse', b: b.id, x: b.x, z: b.z, w: b.w, d: b.d, h: b.h, rot: b.rot || 0, gem: b.gem, type: b.type }); handleEvents(S); S.sim.events.length = 0; return b.id; }, send: (t, x, z) => S && sendSquad(S, t, x, z), select: (t) => S && select(S, t), cast: (k, x, z) => S && castSpell(S, k, x, z), selectSpell: (k) => S && selectSpell(S, k) };
}
