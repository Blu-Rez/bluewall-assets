// Visuals of every fighter in a battle: the player's army (blue) and the base's defenders (red), driven by battlesim.js.
//   const views = await createUnitViews({ M, scene, sim, forgeLevel, enemyLevel, height, hooks });
//   views.event(e, t)   one sim event (melee / shot / breath / hurt / die)      views.update(t, dt, camera)   every frame
// Everything is GPU-instanced (crowd.js, baked animation): a battle with 300 soldiers costs a few dozen draw calls and no CPU skinning.
//   infantry  spear / sword / guard / archer      Quaternius rig, jog / attack / hit-reaction / death clips, forge-tier tinted gear
//   cavalry   Mesh2Motion horse + K3 knight (two instances, the rider follows the saddle)
//   pegasus   white horse + our own wing rig (brigs.js), lifts off when sent
//   dragons   baby dragon / dragon (brigs.js), fly, breathe (Breath clip + fx stream), fall out of the sky when killed
//   giants    troll rig, slam attacks, topple backwards when killed
//   catapults static model, instanced, recoil on every shot, collapse when killed
import * as THREE from 'three';
import { paintDragonling } from './dlcolor.js';
import { prowlerFly, dragonVariant, DRAGON_LOOK, EMBER } from './bdragon.js';
import { createLiveKind, LIVE_LOOK } from './bdragon_live.js';
import { trollStride } from './bgiant.js';
import { GIANT_SWING, hitTOf } from './battlesim.js';
import { createKind } from './crowd.js';
import { trimClips } from './creature.js';
import { loadGLB, parts as modelParts } from './assets.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { grayTex } from './util.js';
import { CLOTH, GLINT, kit, tintGear as tintTier, tierScale } from './unitlook.js';
import { shieldModel } from './gear_shield.js';
import { axeProp, AXE_GRIP } from './gear_axe.js';
import { AXE_RIDE } from './gear_sword.js';
import { dressMaiden } from './gear_maiden.js';
import { dressKnight, axeKnight, setPlumeTier } from './gear_plume.js';
import { dressPegasus } from './gear_pegasus.js';
import { setupFlyers } from './bunits_fly.js';
import { setupGround } from './bunits_ground.js';

const freeGL = (root) => root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m && m.dispose && m.dispose()); if (o.isInstancedMesh) o.dispose(); });   // (GPU buffers of a finished battle: the renderer rebuilds anything still shared)

export const SC = 1.75;                                   // soldier scale (same as the home army)
const BS = 2.55;                                          // ... in battle they are bigger: the map is huge and a phone screen small
const CAV = 2.65;                                          // horses: length ~ 4.8 m at this scale (a Mesh2Motion horse is ~2.5 m native)
const rad = (d) => (d * Math.PI) / 180;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const TIER_AT = [1, 6, 12, 18, 24, 30];             // wood, stone, iron, gold, diamond, blue crystal
export const tierOf = (L) => { let t = 0; for (let i = 0; i < TIER_AT.length; i++) if (L >= TIER_AT[i]) t = i; return t; };
let seed = 99; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const LOD2 = 300;                                          // soldiers farther than this from the camera are drawn as ~100-triangle figures
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

// ---------------------------------------------------------------- per-type recipes
// clip: idle (standing / grounded) · hover (airborne, not moving) · run · walk · atk · hit · die      (string or array = random pick)
const INF = (k, idle, atk) => ({ parts: [{ k, scale: BS, ref: 'jog', walkMax: 0.5, clip: { idle, run: 'Jog_Fwd_Loop', walk: 'Walk_Loop', atk, hit: 'Hit_Chest', die: 'Death01' }, die: { clip: 'Death01' } }], turn: 8 });
const TYPE = {
  spear: INF('spear', 'Idle_Shield_Loop', ['Punch_Cross']),
  sword: INF('sword', 'Sword_Idle', ['Sword_Regular_A', 'Sword_Regular_B']),
  guard: INF('guard', 'Sword_Idle', ['Sword_Attack']),
  archer: INF('archer', 'Idle_Loop', ['Punch_Cross']),
  e_guard: INF('e_guard', 'Sword_Idle', ['Sword_Attack']),
  e_archer: INF('e_archer', 'Idle_Loop', ['Punch_Cross']),
  cavalry: { turn: 5, parts: [
    { k: 'horse', scale: CAV, ref: 8, clip: { idle: 'Idle', run: 'Gallop', walk: 'Trot', atk: ['Kick', 'Head_But'], die: 'Death' }, walkMax: 3.2, die: { clip: 'Death' } },
    { k: 'rider', scale: 0.95 * CAV, off: [0.55 * CAV, -0.1 * CAV], clip: { idle: 'RideDrawn', run: 'RideDrawn', atk: 'RideStrike' }, die: { tumble: { key: 'roll', to: -1.5, dur: 0.5, sink: 0.7 }, hide: 0.7 } }] },
  // the axe rider (p32): the heavier knight - bigger bay horse, Roman helm + plate, long axe; its own copy of the knight model (gear_plume.js axeKnight) with the Axe* arm clips
  axerider: { turn: 4.6, parts: [
    { k: 'horse3', scale: 1.1 * CAV, ref: 8, clip: { idle: 'Idle', run: 'Gallop', walk: 'Trot', atk: ['Kick', 'Head_But'], die: 'Death' }, walkMax: 3.2, die: { clip: 'Death' } },
    { k: 'rider3', scale: 1.08 * 0.95 * CAV, off: [0.61 * CAV, -0.11 * CAV], clip: { idle: 'AxeShoulder', run: 'AxeShoulder', atk: 'AxeStrike' }, die: { tumble: { key: 'roll', to: -1.5, dur: 0.5, sink: 0.75 }, hide: 0.7 } }] },
  pegasus: { turn: 4, lift: 9, air: true, parts: [
    { k: 'pegasus', scale: 1.7, crK: 4, clip: { idle: 'Rest', hover: 'Glide', run: 'Fly', atk: ['Fly'], hit: 'Glide' }, die: { tumble: { key: 'roll', to: 1.45, dur: 0.8, sink: 0.4 } } }] },
  catapult: { turn: 1.2, catapult: true, parts: [] },
  cannon: { turn: 1.4, catapult: true, parts: [] },
  ram: { turn: 1.6, catapult: true, parts: [] },
  trebuchet: { turn: 1.0, catapult: true, parts: [] },
  imp: { turn: 9, parts: [{ k: 'imp', scale: 2.35, ref: 'jog', walkMax: 0.5, clip: { idle: 'Idle_Loop', run: 'Jog_Fwd_Loop', walk: 'Walk_Loop', atk: ['Punch_Cross'], hit: 'Hit_Chest', die: 'Death01' }, die: { clip: 'Death01' } }] },
  mage: { turn: 6, parts: [{ k: 'mage', scale: 1.75, ref: 8, clip: { idle: ['Idle_A', 'Idle_B'], run: 'Running_A', walk: 'Walking_A', atk: ['Ranged_Magic_Shoot'], hit: 'Hit_A', die: 'Death_A' }, walkMax: 3, die: { clip: 'Death_A' } }] },
  hill: { turn: 3, big: true, parts: [{ k: 'hill', scale: 5.6, ref: 'jog', walkMax: 0.5, crAbs: 9, clip: { idle: 'Sword_Idle', run: 'Jog_Fwd_Loop', walk: 'Walk_Loop', atk: ['Sword_Attack'], hit: 'Hit_Chest', die: 'Death01' }, die: { clip: 'Death01' } }] },
  shieldmaiden: { turn: 7, parts: [{ k: 'maiden', scale: 3.0, ref: 'jog', walkMax: 0.5, clip: { idle: 'Idle_Shield_Loop', run: 'Jog_Fwd_Loop', walk: 'Walk_Loop', atk: ['Sword_Regular_A', 'Sword_Regular_B', 'Shield_OneShot'], hit: 'Hit_Chest', die: 'Death01' }, die: { clip: 'Death01' } }] },
  werewolf: { turn: 6, big: true, parts: [{ k: 'werewolf', scale: 1, ref: 11, clip: { idle: ['Stand - 1', 'Stand - 2'], run: 'Walk', atk: ['Attack - 1', 'Attack - 2'], die: 'Death' }, crAbs: 6, die: { clip: 'Death' } }] },
  lord: { turn: 4.5, parts: [
    { k: 'horse2', scale: 1.22 * CAV, ref: 8, clip: { idle: 'Idle', run: 'Gallop', walk: 'Trot', atk: ['Kick', 'Head_But'], die: 'Death' }, walkMax: 3.2, die: { clip: 'Death' } },
    { k: 'rider2', scale: 1.15 * 0.95 * CAV, off: [0.68 * CAV, -0.12 * CAV], clip: { idle: 'RideDrawn', run: 'RideDrawn', atk: 'RideStrike' }, die: { tumble: { key: 'roll', to: -1.5, dur: 0.5, sink: 0.8 }, hide: 0.7 } }] },
  baby: { turn: 3.2, lift: 9, air: true, big: false, fire: 'orange', mouth: [0.5, 0.34], parts: [
    { k: 'baby', scale: 6.5, crK: 3, clip: { idle: 'Perch', hover: 'Fly', run: 'Fly', atk: ['Fly'], hit: 'Fly' }, die: { tumble: { key: 'roll', to: 2.4, dur: 0.9, sink: 0 } } }] },
  // the dragonling (Quaternius "Dragon Evolved", CC0): small and quick, spits yellow fireballs one after another (ball: true -> hooks.fireball)
  dragonling: { turn: 3.6, lift: 8, air: true, big: false, ball: true, mouth: [0.75, 2.1], parts: [
    { k: 'dragonling', scale: 0.95, crK: 2, clip: { idle: 'Flying_Idle', hover: 'Flying_Idle', run: 'Fast_Flying', atk: ['Headbutt', 'Punch'], hit: 'HitReact' }, die: { tumble: { key: 'roll', to: 2.4, dur: 0.9, sink: 0 } } }] },
  dragon: { turn: 2.2, lift: 15, air: true, big: true, fire: 'orange', mouth: [0.5, 0.34], parts: [
    { k: 'dragon', scale: 12.5, crK: 3, clip: { idle: 'Perch', hover: 'Fly', run: 'Fly', atk: ['Fly'], hit: 'Fly' }, die: { tumble: { key: 'roll', to: 2.4, dur: 1.1, sink: 0 } } }] },
  e_hill: { turn: 3, big: true, parts: [{ k: 'e_hill', scale: 5.6, ref: 'jog', walkMax: 0.5, crAbs: 9, clip: { idle: 'Sword_Idle', run: 'Jog_Fwd_Loop', walk: 'Walk_Loop', atk: ['Sword_Attack'], hit: 'Hit_Chest', die: 'Death01' }, die: { clip: 'Death01' } }] },
  // p35 ground units (bunits_ground.js builds the kinds): the Roman legionary, the banner captain (hero), the ogre, the lich, the treant
  // (ogre: 'Punch' = a club sweep, contact 0.28 s (CONTACT) ; ref = its stance-foot speed 2.85 m/s x 2.5;  treant: 'Attack01' contact 0.40 s, started at 0.15 s so it lands at the sim's 0.25 s)
  legionary: INF('legionary', 'Idle_Shield_Loop', ['Sword_Regular_A', 'Sword_Regular_B', 'Shield_OneShot']),
  // (lich: the mage's clips on a bigger body (ref scales with it); 'Walking_A' swings the staff slot round, so it always runs, slowly when slow)
  lich: { turn: 6, parts: [{ k: 'lich', scale: 3.3, ref: 15.1, clip: { idle: ['Idle_A', 'Idle_B'], run: 'Running_A', atk: ['Ranged_Magic_Shoot'], hit: 'Hit_A', die: 'Death_A' }, die: { clip: 'Death_A' } }] },
  captain: { turn: 7, parts: [{ k: 'captain', scale: 3.0, ref: 'jog', walkMax: 0.5, clip: { idle: 'Idle_Shield_Loop', run: 'Jog_Fwd_Loop', walk: 'Walk_Loop', atk: ['Sword_Regular_A', 'Sword_Regular_B'], hit: 'Hit_Chest', die: 'Death01' }, die: { clip: 'Death01' } }] },
  ogre: { turn: 3, big: true, parts: [{ k: 'ogre', scale: 2.5, ref: 7.1, crAbs: 9, clip: { idle: 'Ideal', run: 'Walk', atk: ['Punch'] }, die: { tumble: { key: 'pitch', to: -1.5, dur: 1.0, sink: -1.2 } } }] },
  treant: { turn: 2.4, big: true, parts: [{ k: 'treant', scale: 0.0376, ref: 2.1, crAbs: 8.4, atkSp: 1, atkOff: 0.15, clip: { idle: 'Idle01', run: 'WalkX', atk: ['Attack01'] }, die: { tumble: { key: 'roll', to: 0.5, dur: 3.0, sink: 15 }, hide: 3.2 } }] },
  // the giant: 'stride' = the troll's own upper body on a real alternating leg stride (bgiant.js, ref = the speed of its stance foot, set when the model is loaded: no sliding);
  // one club smash per swing ('attack1' at natural speed from the start of the swing: the head meets the ground at GIANT_SWING.contact s = when the sim counts the hit)
  giant: { turn: 2.6, big: true, crackStep: 3.6, atkDur: 1.6, parts: [
    { k: 'troll', scale: 1, ref: 2.4, live: true, atkSp: 1, atkOff: 0, clip: { idle: 'idle', run: 'stride', atk: [GIANT_SWING.clip] }, die: { tumble: { key: 'pitch', to: -1.5, dur: 1.15, sink: 1.2 } } }] },
};

// the foe's guardians (owner 5 Oct 01:35): the same beasts, their own kinds (dark charcoal hide, bdragon.js)
TYPE.e_baby = { ...TYPE.baby, parts: [{ ...TYPE.baby.parts[0], k: 'baby_e' }] };
TYPE.e_dragon = { ...TYPE.dragon, parts: [{ ...TYPE.dragon.parts[0], k: 'dragon_e' }] };

// ---------------------------------------------------------------- the factory
export async function createUnitViews({ M, scene, sim, forgeLevel = 1, enemyLevel = 1, height = () => 0, hooks = {}, progress }) {
  const need = async (n) => (M[n] || (M[n] = await loadGLB(n)));
  const units = sim.units, defs = sim.defenders;
  const count = {}; for (const u of units) count[u.type] = (count[u.type] || 0) + 1; for (const d of defs) count['e_' + d.type] = (count['e_' + d.type] || 0) + 1;
  const types = Object.keys(count);
  const anyInf = types.some((t) => ['spear', 'sword', 'guard', 'archer', 'e_guard', 'e_archer', 'hill', 'shieldmaiden', 'legionary', 'captain'].includes(t)), anyRound = count.guard || count.e_guard || count.shieldmaiden;
  await Promise.all([need('ranger_m'), need('anims'), anyInf && need('anims_army'), need('helmet2'), need('helmet3'), need('spear'), need('claymore'), need('shield_heater'), need('sword'), need('bow'),
    count.cavalry && need('horse_m2m_grey'), count.axerider && need('horse_m2m_bay'), (count.cavalry || count.axerider) && need('knight_k3'), count.pegasus && need('pegasus'), (count.baby || count.dragon || count.e_baby || count.e_dragon) && need('prowler'), (count.giant || count.e_giant) && need('troll'), count.catapult && need('catapult'),
    count.ogre && need('ogre'), count.treant && need('treant'), count.imp && need('imp'), (count.hill || count.e_hill) && need('hill_giant'), (count.hill || count.e_hill) && need('hammer_double'), count.shieldmaiden && need('shieldmaiden'), anyRound && need('shield_round2'),
    (count.mage || count.lich) && need('skel_mage'), count.mage && need('skel_staff'), (count.mage || count.lich) && need('kk_anims'), count.werewolf && need('werewolf'), count.lord && need('horse_m2m_black'), count.lord && need('knight_k3'),
    count.cannon && need('cannon'), count.ram && need('ram'), count.trebuchet && need('trebuchet2'), count.dragonling && need('dragonling')].filter(Boolean));
  const TT = {}; for (const u of units) TT[u.type] = u.tier | 0;                       // the tier of each unit type (= the level tier of its building, from the sim)

  const K = {}, G = new THREE.Group(); G.name = 'battleUnits'; scene.add(G);
  const T = { catapults: [] };
  const step = async (name, f) => { try { K[name] = f(); G.add(K[name].group); } catch (e) { console.warn('kind', name, e); } progress && progress(name); await nextFrame(); };

  // ---- infantry (one kind per weapon set; the enemy gets crimson cloth)
  const ANIMS = { animations: [...M.anims.animations, ...(M.anims_army ? M.anims_army.animations : [])] };
  const pr = (g, bone, s, pos, rot) => (g ? { gltf: g, bone, s, pos, rot: rot.map(rad) } : null);
  const BASE = ['Walk_Loop', 'Jog_Fwd_Loop', 'Hit_Chest', 'Death01'], LOD1 = /Boots|Belt|Bracer|Pauldron/;
  const sold = (clips, props, cap, hue, tier = 1) => () => createKind({ gltf: M.ranger_m, anims: ANIMS, clips: [...BASE, ...clips], props: props.filter(Boolean), capacity: cap + 6, lod1Skip: LOD1, hue,
    cloth: hue === true ? CLOTH[tier] : null, tier, crest: hue === 'red' ? 'foe' : 'own',
    lod2: { cloth: hue === 'red' ? 0xa8222e : 0x2a5fc4, legs: hue === 'red' ? 0x3a1418 : 0x1c2a4a, skin: 0xd9a77f, h: 1.8 } });
  const helm = (h) => (h ? pr(M[h], 'Head', 0.17, [0, 0.03, 0], [0, 0, 0]) : null);       // (kit per level tier: unitlook.js)
  // shields: painted wood with the crest of the realm that carries them (the attacker's / the defender's: gear_shield.js), steel rim in the tier metal
  const heater = () => pr(shieldModel(M.shield_heater, 'heater'), 'hand_l', 0.27, [0, 0.05, 0.05], [0, 90, 0]), round = () => pr(shieldModel(M.shield_round2, 'round', 0.25), 'hand_l', 0.25, [0, 0.05, 0.05], [0, 90, 0]);
  const ET = tierOf(enemyLevel);
  const R = {
    spear: () => { const k = kit('spear', TT.spear); return sold(['Idle_Shield_Loop', 'Punch_Cross'], [helm(k.helm), pr(M.spear, 'hand_r', 0.23, [0.00819, -0.15451, 0.16751], [-34.632, -34.359, -171.054]), k.shield ? heater() : null], count.spear, true, TT.spear); },
    sword: () => sold(['Sword_Idle', 'Sword_Regular_A', 'Sword_Regular_B'], [helm(kit('sword', TT.sword).helm), pr(M.claymore, 'hand_r', 0.2, [0, 0, 0], [0, 0, -90])], count.sword, true, TT.sword),
    guard: () => sold(['Sword_Idle', 'Sword_Attack'], [helm(kit('guard', TT.guard).helm), pr(M.sword, 'hand_r', 0.9, [0, 0, 0], [0, 0, -90]), round()], count.guard, true, TT.guard),
    archer: () => sold(['Idle_Loop', 'Punch_Cross'], [helm(kit('archer', TT.archer).helm), pr(M.bow, 'hand_l', 0.55, [0, 0, 0], [90, 0, 90])], count.archer, true, TT.archer),
    e_guard: () => sold(['Sword_Idle', 'Sword_Attack'], [pr(M.sword, 'hand_r', 0.9, [0, 0, 0], [0, 0, -90]), round()], count.e_guard, 'red', ET),
    e_archer: () => sold(['Idle_Loop', 'Punch_Cross'], [pr(M.bow, 'hand_l', 0.55, [0, 0, 0], [90, 0, 90])], count.e_archer, 'red', ET),
  };
  for (const name of Object.keys(R)) if (count[name]) await step(name, R[name]());
  for (const n of ['spear', 'sword', 'guard', 'archer']) if (K[n]) tintTier(K[n], TT[n] | 0);
  const lateTint = () => { if (K.e_hill) tintTier(K.e_hill, ET); if (K.hill) tintTier(K.hill, TT.hill | 0); if (K.maiden) tintTier(K.maiden, TT.shieldmaiden | 0); };
  for (const n of ['e_guard', 'e_archer']) if (K[n]) tintTier(K[n], ET);

  // ---- mounts
  if ((count.cavalry || count.lord || count.axerider) && M.knight_k3) { dressKnight(M.knight_k3); setPlumeTier((count.cavalry ? TT.cavalry : count.axerider ? TT.axerider : TT.lord) | 0); }     // horsehair plume + crest shield (gear_plume.js)
  if (count.cavalry && M.horse_m2m_grey && M.knight_k3) {             // the sword knights ride white (dapple-grey) horses
    await step('horse', () => createKind({ gltf: M.horse_m2m_grey, anims: { animations: M.horse_m2m_grey.animations }, clips: ['Idle', 'Walk', 'Trot', 'Gallop', 'Death', 'Kick', 'Head_But'], capacity: count.cavalry + 4 }));
    await step('rider', () => createKind({ gltf: M.knight_k3, anims: { animations: M.knight_k3.animations }, clips: ['RideDrawn', 'RideStrike', 'Ride'], capacity: count.cavalry + 4 }));
  }
  if (count.axerider && M.horse_m2m_bay && M.knight_k3) {             // the axe riders: bay horses, the knight's own axe copy (Roman helm, heavier plate) with the long axe in the right fist
    const ak = axeKnight(M.knight_k3);
    if (ak) {
      await step('horse3', () => createKind({ gltf: M.horse_m2m_bay, anims: { animations: M.horse_m2m_bay.animations }, clips: ['Idle', 'Walk', 'Trot', 'Gallop', 'Death', 'Kick', 'Head_But'], capacity: count.axerider + 4 }));
      await step('rider3', () => createKind({ gltf: ak, anims: { animations: ak.animations }, clips: ['AxeShoulder', 'AxeStrike', 'Ride'], capacity: count.axerider + 4,
        props: [pr(axeProp({ blued: false, long: true }), 'hand_r', AXE_RIDE.s, AXE_RIDE.pos, AXE_RIDE.rotDeg)].filter(Boolean) }));
    }
  }
  if (count.pegasus && M.pegasus) {       // the Opus pegasus (wings of ~70 layered feathers, 84-joint rig, 7.6k tris); 'Rest' = standing with the wings folded (camp / before take-off)
    const pg = dressPegasus(M.pegasus);
    await step('pegasus', () => createKind({ gltf: pg, anims: { animations: pg.animations }, clips: ['Rest', 'Fly', 'Glide'], capacity: count.pegasus + 4 }));
  }
  if ((count.baby || count.dragon || count.e_baby || count.e_dragon) && M.prowler) {   // the very dragon the home sky circles (bdragon_live.js: the same model, skin and rim light, one skinned mesh each, a real wing beat); ours aged red, the foe's charcoal
    const pw = M.prowler; prowlerFly(pw);                       // (bdragon.js: the 'Fly' + 'Perch' clips)
    // (if the live path ever fails - no WebGL feature, no clip - the baked crowd copy of the old paint is the fallback, so the dragons never vanish)
    const dk = (key, lookKey, cap, tier) => () => {
      try {
        const L = LIVE_LOOK[lookKey], gl = tier != null ? EMBER[tier | 0] : null;       // (the tier sheen of a red dragon stays in the warm family: unitlook.js GLINT is gold / ice-white / blue, blue on a red hide turns it purple)
        return createLiveKind({ gltf: pw, look: gl ? { ...L, rimK: L.rimK + gl[1] * 4 } : L, key, rim: gl ? [((gl[0] >> 16) & 255) / 255, ((gl[0] >> 8) & 255) / 255, (gl[0] & 255) / 255] : null });
      } catch (e) { console.warn('live dragon -> baked', e); const g = dragonVariant(pw, DRAGON_LOOK[lookKey], lookKey); return createKind({ gltf: g, anims: g, clips: ['Fly', 'Perch'], capacity: cap, glint: tier != null ? EMBER[tier | 0] : undefined }); }
    };
    if (count.dragon) await step('dragon', dk('dragon', 'dragon', count.dragon + 3, TT.dragon));
    if (count.baby) await step('baby', dk('baby', 'baby', count.baby + 3, TT.baby));
    // the foe's guardians (owner 5 Oct): dark charcoal beasts with ember rims and orange fire, so the two sides read apart at a glance (ours stay the aged red)
    if (count.e_dragon) await step('dragon_e', dk('edragon', 'edragon', count.e_dragon + 2));
    if (count.e_baby) await step('baby_e', dk('ebaby', 'ebaby', count.e_baby + 2));
  }
  if (count.dragonling && M.dragonling) {           // green at Lair Lv 12, then emerald, teal and deep sea-blue with orange wings (dlcolor.js)
    const dl = M.dragonling;
    if (!dl.__bw) { dl.__bw = true; for (const c of dl.animations) c.name = c.name.replace(/^.*\|/, ''); }
    paintDragonling(dl.scene, (units.find((u) => u.type === 'dragonling') || {}).lv || 12);       // (the colour follows the Lair level: dlcolor.js)
    await step('dragonling', () => createKind({ gltf: dl, anims: dl, clips: ['Flying_Idle', 'Fast_Flying', 'Headbutt', 'Punch', 'HitReact', 'Death'], capacity: count.dragonling + 3, glint: GLINT[TT.dragonling | 0] }));
  }
  // ---- p35: the new flyers (gryphon, gryphon knight, dark rider, the three-headed baby dragon and dragon) are built in bunits_fly.js
  if (count.gryphon || count.gryphonknight || count.darkrider || count.baby3 || count.dragon3) await setupFlyers({ M, need, step, TYPE, count, units, TT, K, G, hooks });
  if ((count.giant || count.e_giant) && M.troll) {
    trimClips(M.troll);
    const hb = new THREE.Box3().setFromObject(M.troll.scene, true).getSize(new THREE.Vector3()).y || 4;
    const st = M.troll.__stride || (M.troll.__stride = trollStride(M.troll)); if (st && !M.troll.animations.includes(st.clip)) M.troll.animations.push(st.clip);       // (bgiant.js: the real leg stride)
    TYPE.giant = { ...TYPE.giant, parts: [{ ...TYPE.giant.parts[0], scale: 14 / hb, crAbs: 11, ref: st ? st.speed * (14 / hb) : 2.4, clip: st ? TYPE.giant.parts[0].clip : { ...TYPE.giant.parts[0].clip, run: 'walk' } }] };
    // the mace is a rigid mesh hung under the palm bone (not skinned, so the crowd baker would drop it): carry it as a prop on that bone instead
    const mace = (() => {
      let m = null; M.troll.scene.traverse((o) => { if (!m && o.isMesh && !o.isSkinnedMesh && /mace/i.test(o.name)) m = o; });
      if (!m) return null;
      // raw buffers -> float (the model is quantised), then into the right palm bone's frame in the animated pose.  The relation was measured once on the untouched model
      // (the animation rescales the whole rig, the bind pose lies elsewhere) and is rigid: position, rotation, scale of the club relative to cave_troll_RArmPalm_052.
      const src = m.geometry, pos = src.attributes.position, n = pos.count, g = new THREE.BufferGeometry();
      const f3 = (a) => { const o = new Float32Array(n * 3); for (let i = 0; i < n; i++) { o[i * 3] = a.getX(i); o[i * 3 + 1] = a.getY(i); o[i * 3 + 2] = a.getZ(i); } return new THREE.BufferAttribute(o, 3); };
      g.setAttribute('position', f3(pos)); if (src.attributes.normal) g.setAttribute('normal', f3(src.attributes.normal));
      if (src.attributes.uv) { const u = src.attributes.uv, o = new Float32Array(n * 2); for (let i = 0; i < n; i++) { o[i * 2] = u.getX(i); o[i * 2 + 1] = u.getY(i); } g.setAttribute('uv', new THREE.BufferAttribute(o, 2)); }
      if (src.index) g.setIndex(src.index.clone());
      g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(86.78373, -9.69816, -95.74677), new THREE.Quaternion(-0.328686, 0.492043, 0.726222, -0.349944).normalize(), new THREE.Vector3(159.8394, 159.8424, 159.842)));
      const grp = new THREE.Group(); grp.add(new THREE.Mesh(g, m.material)); return { scene: grp };
    })();
    // the giant wears the kingdom's colours (owner 19:45): a navy loincloth, royal-blue pauldrons and bracers with steel rims.  Authored in model space on the animated idle pose
    // (measured bone positions, see docs/p30-progress.md), then moved into the frame of the bone each piece rides on (props follow one bone, like the club).
    const sceneE = count.e_giant ? SkeletonUtils.clone(M.troll.scene) : null;                // (the foe's giant: its own copy of the body, a red loincloth)
    const dye = (root, col) => root.traverse((o) => { if (o.isSkinnedMesh && o.material && o.material.name === 'tanga_mat') { o.material = o.material.clone(); o.material.map = null; o.material.color.set(col); o.material.roughness = 0.85; } });
    dye(M.troll.scene, 0x1b2f63); if (sceneE) dye(sceneE, 0x6a1208);
    const armourOf = (clothCol) => (() => {
      const root = M.troll.scene, bones = {}; const clip0 = M.troll.animations.find((c) => /idle/i.test(c.name)) || M.troll.animations[0];
      if (clip0) { const mx0 = new THREE.AnimationMixer(root); mx0.clipAction(clip0).play(); mx0.setTime(0.05); }
      root.updateMatrixWorld(true); root.traverse((o) => { if (o.isBone) bones[o.name] = o; });
      const V = (x, y, z) => new THREE.Vector3(x, y, z), Y = V(0, 1, 0);
      const navy = new THREE.MeshStandardMaterial({ name: 'NavyCloth', color: clothCol, roughness: 0.6 }), steel = new THREE.MeshStandardMaterial({ name: 'Steel', color: 0xffffff, roughness: 0.4 });
      const piece = (boneName, build) => {
        const b = bones[boneName]; if (!b) return null; const inv = new THREE.Matrix4().copy(b.matrixWorld).invert(), grp = new THREE.Group();
        build((geo, mat) => { geo.applyMatrix4(inv); grp.add(new THREE.Mesh(geo, mat)); });
        return { scene: grp, bone: boneName };
      };
      const along = (a, b, t) => a.clone().lerp(b, t);
      const bracer = (E, W, t0, t1, r) => (add) => {
        const a = along(E, W, t0), b = along(E, W, t1), d = b.clone().sub(a), L = d.length(), m = a.clone().add(b).multiplyScalar(0.5), q = new THREE.Quaternion().setFromUnitVectors(Y, d.normalize());
        const M4 = new THREE.Matrix4().compose(m, q, V(1, 1, 1));
        add(new THREE.CylinderGeometry(r, r * 1.1, L, 16, 1, true).applyMatrix4(M4), navy);
        for (const e of [-1, 1]) add(new THREE.TorusGeometry(r * (e > 0 ? 1.1 : 1.0) + 0.3, 0.9, 6, 20).rotateX(Math.PI / 2).translate(0, e * L / 2, 0).applyMatrix4(M4), steel);
      };
      const pauld = (c, side) => (add) => {
        add(new THREE.SphereGeometry(15, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.62).scale(1.0, 0.8, 1.1).rotateZ(side * 0.35).translate(c.x + side * 4, c.y + 3, c.z), navy);
        add(new THREE.TorusGeometry(14.2, 1.1, 6, 24).rotateX(Math.PI / 2).scale(1.0, 1, 1.1).translate(c.x + side * 4.6, c.y + 1.2, c.z), steel);
      };
      const P = (n) => { const b = bones[n]; return b ? new THREE.Vector3().setFromMatrixPosition(b.matrixWorld) : null; };
      const sR = P('cave_troll_RArm1_049'), sL = P('cave_troll_LArm1_032'), eR = P('cave_troll_RArm21_050'), wR = P('cave_troll_RArmPalm_052'), wL = P('cave_troll_LArmPalm_035'), eL = P('cave_troll_LArm22_034');
      if (!sR || !sL || !eR || !wR || !wL || !eL) return [];
      const eL2 = V(eL.x - 2, eL.y + 14, eL.z);
      return [piece('cave_troll_RArm1_049', pauld(sR, -1)), piece('cave_troll_LArm1_032', pauld(sL, 1)), piece('cave_troll_RArm22_051', bracer(eR, wR, 0.42, 0.86, 9.6)), piece('cave_troll_LArm22_034', bracer(eL2, wL, 0.4, 0.84, 9.6))].filter(Boolean);
    })();
    const gclips = ['idle', st ? 'stride' : 'walk', GIANT_SWING.clip];
    const gprops = (arm) => [pr(mace, 'cave_troll_RArmPalm_052', 1, [0, 0, 0], [0, 0, 0]), ...arm.map((a) => pr(a, a.bone, 1, [0, 0, 0], [0, 0, 0]))].filter(Boolean);
    if (count.giant) await step('troll', () => createKind({ gltf: M.troll, anims: { animations: M.troll.animations }, clips: gclips, props: gprops(armourOf(0x23468f)), capacity: count.giant + 2 }));
    if (count.e_giant) {
      await step('troll_e', () => createKind({ gltf: { ...M.troll, scene: sceneE }, anims: { animations: M.troll.animations }, clips: gclips, props: gprops(armourOf(0xd4561b)), capacity: count.e_giant + 2 }));
      TYPE.e_giant = { ...TYPE.giant, parts: [{ ...TYPE.giant.parts[0], k: 'troll_e' }] };
    }
  }

  // ---- the second wave: elite infantry, creatures, beasts, the hero lord (every one a baked-animation crowd, like the first ten)
  if (count.imp && M.imp) await step('imp', () => createKind({ gltf: M.imp, anims: ANIMS, clips: [...BASE, 'Idle_Loop', 'Punch_Cross'], capacity: count.imp + 6, hue: 'swap' }));
  if (count.e_hill && M.hill_giant) await step('e_hill', () => createKind({ gltf: M.hill_giant, anims: ANIMS, clips: [...BASE, 'Sword_Idle', 'Sword_Attack'], props: [pr(M.hammer_double, 'hand_r', 0.24, [0, 0, 0], [0, 0, -90])].filter(Boolean), capacity: count.e_hill + 2, hue: 'red', tier: ET, crest: 'foe' }));
  if (count.hill && M.hill_giant) await step('hill', () => createKind({ gltf: M.hill_giant, anims: ANIMS, clips: [...BASE, 'Sword_Idle', 'Sword_Attack'], props: [pr(M.hammer_double, 'hand_r', 0.24, [0, 0, 0], [0, 0, -90])].filter(Boolean), capacity: count.hill + 3, hue: true, tier: TT.hill | 0 }));
  if (count.shieldmaiden && M.shieldmaiden) dressMaiden(M.shieldmaiden);
  if (count.shieldmaiden && M.shieldmaiden) await step('maiden', () => createKind({ gltf: M.shieldmaiden, anims: ANIMS, clips: [...BASE, 'Idle_Shield_Loop', 'Sword_Regular_A', 'Sword_Regular_B', 'Shield_OneShot'],
    props: [pr(axeProp({ blued: true }), 'hand_r', 0.75, AXE_GRIP.pos, AXE_GRIP.rotDeg), pr(shieldModel(M.shield_round2, 'round', 0.22), 'hand_l', 0.22, [0, 0.05, 0.05], [0, 90, 0])].filter(Boolean), capacity: count.shieldmaiden + 3, hue: true, tier: TT.shieldmaiden | 0 }));
  if (count.mage && M.skel_mage && M.kk_anims) await step('mage', () => createKind({ gltf: M.skel_mage, anims: { animations: M.kk_anims.animations }, clips: ['Idle_A', 'Idle_B', 'Walking_A', 'Running_A', 'Ranged_Magic_Shoot', 'Hit_A', 'Death_A'],
    props: [pr(M.skel_staff, 'handslotr', 1, [0, 0, 0], [0, 0, 0])].filter(Boolean), capacity: count.mage + 4, hue: 'swap' }));
  if (count.werewolf && M.werewolf) {
    trimClips(M.werewolf);
    const hb = new THREE.Box3().setFromObject(M.werewolf.scene, true).getSize(new THREE.Vector3()).y || 4;
    TYPE.werewolf = { ...TYPE.werewolf, parts: [{ ...TYPE.werewolf.parts[0], scale: 7.2 / hb }] };
    await step('werewolf', () => createKind({ gltf: M.werewolf, anims: { animations: M.werewolf.animations }, clips: ['Stand - 1', 'Stand - 2', 'Walk', 'Attack - 1', 'Attack - 2', 'Death'], capacity: count.werewolf + 3 }));
    if (K.werewolf) K.werewolf.group.children.forEach((im) => { const m = im.material; if (m && m.color) { m.color.setScalar(2.6); m.emissive && m.emissive.set(0x1c2e4e); m.emissiveIntensity = 0.5; } });       // its fur is almost black: lift it so it reads on the battlefield
  }
  if (count.lord && M.horse_m2m_black && M.knight_k3) {
    await step('horse2', () => createKind({ gltf: M.horse_m2m_black, anims: { animations: M.horse_m2m_black.animations }, clips: ['Idle', 'Walk', 'Trot', 'Gallop', 'Death', 'Kick', 'Head_But'], capacity: count.lord + 3 }));
    await step('rider2', () => createKind({ gltf: M.knight_k3, anims: { animations: M.knight_k3.animations }, clips: ['RideDrawn', 'RideStrike', 'Ride'], capacity: count.lord + 3 }));
  }

  if (count.legionary || count.captain || count.ogre || count.lich || count.treant) await setupGround({ M, need, step, TYPE, count, TT, K, ANIMS, BASE, LOD1, ET });
  lateTint();

  // ---- siege engines: the static model, one InstancedMesh per material (catapult, cannon, ram, trebuchet)
  // type -> [model, length in metres, kick]: kick = how far (m) the engine jerks back on a shot (negative = it lunges forward, the ram)
  const STAT = { catapult: ['catapult', 9.5, 0.9], cannon: ['cannon', 6.4, 1.4, /Surface2/], ram: ['ram', 9.5, -2.4], trebuchet: ['trebuchet2', 9.5, 0.5] };       // [model, length, kick, material to drop (the cannon's plank sled)]
  const S = {};
  for (const [type, [model, len, kick, drop]] of Object.entries(STAT)) {
    if (!count[type] || !M[model]) continue;
    const ps = modelParts(M[model]).filter((p) => !(drop && drop.test((p.material && p.material.name) || ''))), box = new THREE.Box3();
    for (const p of ps) { p.geometry.computeBoundingBox(); box.union(p.geometry.boundingBox); }
    const size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3()), k = len / Math.max(size.x, size.z);
    const cap = count[type] + 3, meshes = [];
    for (const p of ps) {
      const g = p.geometry; g.translate(-ctr.x, -box.min.y, -ctr.z); g.scale(k, k, k);
      for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n);
      const im = new THREE.InstancedMesh(g, p.material, cap); im.count = 0; im.frustumCulled = false; im.castShadow = true; im.receiveShadow = true; G.add(im); meshes.push(im);
    }
    S[type] = { meshes, list: [], cap, kick, size: size.multiplyScalar(k), yawOff: size.x > size.z ? Math.PI / 2 : 0 };
  }
  // gear of every material the engines use is left as the artist made it (wood + iron)

  // ---------------------------------------------------------------- views
  const views = new Map(), list = [];
  const ref = (kind, sc = BS) => ({ jog: (kind.stats.walkSpeed || 0.8) * sc * 2.0, walk: (kind.stats.walkSpeed || 0.8) * sc });

  // the run / walk clip of a part for the unit's ground speed right now (with a little hysteresis, so a unit at the threshold does not flicker between the two) and the playback
  // speed that keeps the feet on the ground: re-evaluated every frame while the unit runs (it used to be fixed at the moment the run began, when the unit was still almost standing)
  function runPlay(pt, v) {
    const c = pt.P.clip, rf = pt.rf, wm = pt.P.walkMax;
    const thr = c.walk ? (wm < 1 ? rf.walk * 1.6 : wm) * (pt.walk ? 1.12 : 0.9) : 0;
    if (c.walk && v.v < thr) return { walk: true, sp: clamp(v.v / (wm < 1 ? rf.walk : wm * 0.8), 0.4, 1.6) };
    return { walk: false, sp: pt.P.ref ? clamp(v.v / (pt.P.ref === 'jog' ? rf.jog : pt.P.ref), 0.4, 1.9) : 1 };
  }
  // where the weapon meets the target inside each attack clip, in seconds at natural speed (measured on the animation data: the hand's fastest moment / farthest reach - dev/s33/probe.js;
  // the riders' strike clips are authored in gear_sword.js: the cut passes the target at ~0.42 / 0.46 of their 1 s).  An attack is played at the speed that puts this frame on
  // hitTOf(type) = the moment the sim counts the damage, so the blow and the damage are the same instant.
  const CONTACT = { Punch_Cross: 0.25, Sword_Regular_A: 0.24, Sword_Regular_B: 0.26, Sword_Attack: 0.42, Shield_OneShot: 0.15, Ranged_Magic_Shoot: 0.3, RideStrike: 0.43, AxeStrike: 0.46, Punch: 0.28 };
  function setState(v, s, t, init) {
    for (const pt of v.parts) {
      const c = pt.P.clip; let name = s === 'hit' ? c.hit : s === 'hover' ? (c.hover || c.idle) : s === 'atk' ? c.atk : c[s];
      let sp = 1, off = 0;
      if (s === 'run') { const r = runPlay(pt, v); pt.walk = r.walk; if (r.walk) name = c.walk; sp = r.sp; }
      if (Array.isArray(name)) name = name[(rnd() * name.length) | 0];
      if (!name) continue;
      if (s === 'atk') {
        const inf = pt.k.info[name], ct = CONTACT[name];
        if (pt.P.atkSp != null) { sp = pt.P.atkSp; off = pt.P.atkOff != null ? pt.P.atkOff : 0.04; }                    // (the giant: its own swing, bgiant.js / GIANT_SWING)
        else if (ct) { sp = clamp(ct / hitTOf(v.u.type), 0.5, 2.2); off = 0; pt.atkEnd = inf ? t + inf.dur / sp + 0.03 : 0; }       // contact frame = the sim's damage moment; afterwards the part goes back to its idle (no second, damage-less swing)
        else { sp = inf ? clamp(inf.dur / 0.85, 0.7, 1.9) : 1; off = 0.04; }
      }
      else if (s === 'idle' || s === 'hover') { sp = 0.92 + v.rnd * 0.16; off = init ? v.rnd * 2 : 0; }
      if (pt.p.name === name && s !== 'atk' && s !== 'run') continue;
      pt.sp = sp; pt.p.play(name, { fade: !init, speed: sp, offset: off });
    }
    v.state = s;
  }

  function addView(u) {
    const key = u.side === 'D' ? 'e_' + u.type : u.type, Tp = TYPE[key];
    if (!Tp) return null;
    const v = { u, T: Tp, key, parts: [], yaw: u.face, lx: u.x, lz: u.z, v: 0, state: '', atkUntil: 0, hitUntil: 0, hitCd: 0, ly: 0, vy: 0, dead: false, rnd: rnd(), recoil: 0, bt: 0 };
    const sc = (0.97 + rnd() * 0.06) * (u.side === 'A' ? tierScale(u.tier | 0) : 1);
    if (Tp.catapult) {
      const sk = S[key]; if (!sk) return null;
      v.cat = { x: u.x, y: height(u.x, u.z), z: u.z, yaw: u.face, rec: 0, sy: 1 }; v.sk = sk; sk.list.push(v.cat);
    } else {
      for (const P of Tp.parts) {
        const k = K[P.k]; if (!k) continue;
        const p = k.add({ x: u.x, y: height(u.x, u.z), z: u.z, yaw: u.face, scale: P.scale * sc }); p.cr = P.crAbs || (P.crK ? P.scale * 1.5 * P.crK : 0);
        v.parts.push({ P, k, p, rf: ref(K[INFK[key]] || k, P.scale) });
      }
      if (!v.parts.length) return null;
      setState(v, 'idle', 0, true);
    }
    views.set(u.id, v); list.push(v); return v;
  }
  const INFK = { spear: 'spear', sword: 'sword', guard: 'guard', archer: 'archer', e_guard: 'e_guard', e_archer: 'e_archer' };
  for (const u of units) addView(u);
  for (const d of defs) addView(d);

  // ---------------------------------------------------------------- death
  const freeze = (p, k, name) => { const c = k.info[name]; if (!c) return; const now = k.group.userData.now || 0; p.cur = { base: c.base, count: c.count, start: now - (c.count - 1.5) / 0.001, rate: 0.001 }; p.prv = p.cur; p.sw = -1e9; };
  function kill(v, t) {
    if (!v || v.dead) return; v.dead = true; v.dieAt = t; v.state = 'die'; v.removeAt = t + 10 + rnd() * 3;
    if (v.cat) { v.cat.dead = true; hooks.collapse && hooks.collapse(v.u.x, v.u.z, 4, 7); return; }
    v.fall = !!v.T.air;
    for (const pt of v.parts) {
      const D = pt.P.die || {};
      if (D.clip === 'Death01') pt.p.l2pitch = -1.5;
      if (D.clip && pt.k.info[D.clip]) { pt.p.play(D.clip, { speed: 1 }); pt.freezeAt = t + pt.k.info[D.clip].dur / 1; pt.dead = D.clip; }
      if (D.tumble) pt.tumble = { ...D.tumble, t0: t, y0: pt.p.y };
      if (D.hide) pt.hideAt = t + D.hide;
    }
    if (!v.fall && v.T.big && hooks.land) v.landAt = t + 1.0;
  }

  // ---------------------------------------------------------------- events
  const faceTo = (v, x, z) => { v.u.face = Math.atan2(x - v.u.x, z - v.u.z); };
  function event(e, t) {
    switch (e.k) {
      case 'melee': { const v = views.get(e.u); if (v && !v.dead) { v.atkUntil = t + (v.T.atkDur || 0.8); v.nextAtk = true; if (v.cat) v.cat.rec = 1; } break; }
      case 'shot': { if (e.u == null) break; const v = views.get(e.u); if (v && !v.dead) { v.atkUntil = t + 0.7; v.nextAtk = true; if (v.cat) v.cat.rec = 1; } break; }
      case 'breath': { const v = views.get(e.u); if (v && !v.dead) { v.atkUntil = t + 1.1; v.nextAtk = true; v.breathTo = e.to; v.breathUntil = t + 0.62; v.bigBreath = !!e.big || !!v.T.bigFire; if (e.head != null && v.T.mouths) (v.hb || (v.hb = []))[e.head] = e.to; } break; }       // (three-headed beasts: one event per head, each head spits at its own spot)
      case 'dive': { const v = views.get(e.id); if (v && !v.dead && e.to) v.dive = { t0: t, dur: (e.t || 0.55) + 0.34, tx: e.to[0], tz: e.to[2] }; break; }       // (gryphon knight's Dive Strike: it stoops toward the target for e.t s, then climbs back)
      case 'hurt': { const v = views.get(e.id); if (v && !v.dead && t > v.hitCd) { v.hitUntil = t + 0.4; v.hitCd = t + 1.5; } break; }
      case 'die': kill(views.get(e.id), t); break;
      default: break;
    }
  }

  // ---------------------------------------------------------------- per frame
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _e = new THREE.Euler();
  const diveK = (v, t) => { const d = v.dive, f = (t - d.t0) / d.dur; if (f >= 1) { v.dive = null; for (const pt of v.parts) pt.p.pitch = 0; return 0; } return f < 0.62 ? Math.sin((f / 0.62) * Math.PI / 2) : Math.cos(((f - 0.62) / 0.38) * Math.PI / 2); };      // 0 -> 1 on the way down (the blow lands at 62 %), back to 0 on the climb
  function update(t, dt, camera) {
    dt = Math.max(1e-3, Math.min(0.1, dt));
    for (const k of Object.values(K)) k.group.userData.now = t;
    for (let i = list.length - 1; i >= 0; i--) {
      const v = list[i], u = v.u;
      if (v.dead) {
        if (v.cat) { v.cat.sy += (0.28 - v.cat.sy) * Math.min(1, dt * 3); if (t > v.removeAt) { v.sk.list.splice(v.sk.list.indexOf(v.cat), 1); list.splice(i, 1); } continue; }
        const gy = height(u.x, u.z);
        if (v.fall) { v.vy -= 36 * dt; v.ly = Math.max(0, v.ly + v.vy * dt); if (v.ly <= 0 && !v.landed) { v.landed = true; hooks.land && hooks.land(u.x, u.z, !!v.T.big); } }
        if (v.landAt && t >= v.landAt) { v.landAt = 0; hooks.land && hooks.land(u.x, u.z, true); }
        const sinkK = t > v.removeAt - 3 ? (t - (v.removeAt - 3)) * 0.55 : 0;
        for (let j = v.parts.length - 1; j >= 0; j--) {
          const pt = v.parts[j], p = pt.p;
          if (pt.freezeAt && t >= pt.freezeAt) { freeze(p, pt.k, pt.dead); pt.freezeAt = 0; }
          let ty = 0;
          if (pt.tumble) { const k = clamp((t - pt.tumble.t0) / pt.tumble.dur, 0, 1), e = k * k; p[pt.tumble.key] = pt.tumble.to * e; ty = -(pt.tumble.sink || 0) * e; if (k >= 1 && !pt.tumble.done && pt.tumble.key === 'pitch') { pt.tumble.done = true; hooks.land && hooks.land(u.x - Math.sin(v.yaw) * 4, u.z - Math.cos(v.yaw) * 4, true); } }
          const o = pt.P.off || [0, 0]; p.x = u.x + Math.sin(v.yaw) * o[1]; p.z = u.z + Math.cos(v.yaw) * o[1]; p.y = gy + v.ly + o[0] + ty - sinkK; p.yaw = v.yaw;
          if (pt.hideAt && t >= pt.hideAt) { pt.k.remove(p); v.parts.splice(j, 1); hooks.land && hooks.land(u.x, u.z, false); }
        }
        if (t > v.removeAt) { for (const pt of v.parts) pt.k.remove(pt.p); v.parts.length = 0; list.splice(i, 1); }
        continue;
      }
      // speed (smoothed), heading, lift
      const dx = u.x - v.lx, dz = u.z - v.lz; v.lx = u.x; v.lz = u.z;
      v.v += (Math.hypot(dx, dz) / dt - v.v) * Math.min(1, dt * 7);
      v.yaw += clamp(wrap(u.face - v.yaw), -v.T.turn * dt, v.T.turn * dt);
      if (v.T.air) { const want = u.active || u.side === 'D' ? v.T.lift : 0; v.ly += clamp(want - v.ly, -dt * 7, dt * 7); }
      if (v.cat) { v.cat.x = u.x; v.cat.z = u.z; v.cat.y = height(u.x, u.z); v.cat.yaw = v.yaw; v.cat.rec = Math.max(0, v.cat.rec - dt * 2.2); continue; }
      const desired = t < v.atkUntil ? 'atk' : t < v.hitUntil ? 'hit' : !u.active && u.side === 'A' ? 'idle' : v.v > 0.55 ? 'run' : v.T.air && (u.active || u.side === 'D') ? 'hover' : 'idle';
      const again = desired === 'atk' && v.nextAtk; v.nextAtk = false;
      if (desired !== v.state || again) setState(v, desired, t, false);
      if (v.state === 'atk') for (const pt of v.parts) if (pt.atkEnd && t >= pt.atkEnd) {          // the swing is over (soldier / rider): back to the idle pose until the next swing
        pt.atkEnd = 0; const ic = pt.P.clip.idle, nm = Array.isArray(ic) ? ic[0] : ic; if (nm && pt.k.info[nm]) { pt.sp = 1; pt.p.play(nm, { fade: true, speed: 1, offset: 0 }); }
      }
      if (v.T.crackStep && v.v > 0.8 && hooks.crack) {                       // (giants: the ground splits under every step and heals after he has passed — cracks.js)
        v.stepD = (v.stepD || 0) + Math.hypot(dx, dz);
        if (v.stepD >= v.T.crackStep) { v.stepD = 0; v.stepSide = -(v.stepSide || 1); const side = v.stepSide * 1.6, sy = Math.sin(v.yaw), cy = Math.cos(v.yaw); hooks.crack(u.x + cy * side, u.z - sy * side, 6.2 + rnd() * 2.4, rnd() * 6.28, 6 + rnd() * 2); }
      }
      if (v.state === 'run') {
        let swap = false;
        for (const pt of v.parts) {
          if (pt.P.live) { pt.p.setSpeed(clamp(v.v / pt.P.ref, 0.3, 2.2)); continue; }          // (giants: the stride follows the ground speed every frame, so the feet stay on the ground while it speeds up / slows down)
          if (!pt.P.clip.run || !pt.rf) continue;
          const r = runPlay(pt, v);
          if (r.walk !== !!pt.walk) swap = true; else if (Math.abs(r.sp - (pt.sp || 1)) > 0.05) { pt.sp = r.sp; pt.p.setSpeed(r.sp); }     // everybody else: the same, soldiers, riders, horses
        }
        if (swap) setState(v, 'run', t, false);
      }
      // dragon fire
      if (v.breathUntil > t && (hooks.breath || hooks.fireball)) {
        const sc = v.parts[0].p.scale, mo = v.T.mouth || [5.6, 3.7], from = [u.x + Math.sin(v.yaw) * mo[0] * sc, height(u.x, u.z) + v.ly + mo[1] * sc, u.z + Math.cos(v.yaw) * mo[0] * sc];
        if (v.T.ball) { if (hooks.fireball && t >= (v.nextBall || 0)) { v.nextBall = t + 0.2; hooks.fireball(from, v.breathTo); } }       // the dragonling: a fireball every 0.2 s of the burst, ball after ball
        else if (v.hb && v.T.mouths) { const sy = Math.sin(v.yaw), cy = Math.cos(v.yaw), hy = height(u.x, u.z) + v.ly; for (let h = 0; h < v.hb.length; h++) { const m = v.T.mouths[h], to = v.hb[h]; if (to && m) hooks.breath([u.x + (sy * m[0] + cy * m[2]) * sc, hy + m[1] * sc, u.z + (cy * m[0] - sy * m[2]) * sc], to, v.bigBreath, v.T.fire || 'orange'); } }      // (one stream per head, from that head's mouth: bunits_fly.js TYPE.*.mouths = [forward, up, sideways (+ = left)] x scale)
        else if (hooks.breath) hooks.breath(from, v.breathTo, v.bigBreath, v.T.fire || 'orange');
      }
      const gy = height(u.x, u.z);
      let dvx = 0, dvz = 0, dvy = 0, dvp = 0;
      if (v.dive) { const dk = diveK(v, t); if (dk > 0) { const D = v.dive, ex = D.tx - u.x, ez = D.tz - u.z, el = Math.hypot(ex, ez) || 1, run = Math.min(el, 14) * dk; dvx = ex / el * run; dvz = ez / el * run; dvy = -Math.max(0, v.ly - 2) * 0.85 * dk; dvp = 0.75 * dk; } }
      for (const pt of v.parts) { const p = pt.p, o = pt.P.off || [0, 0]; p.x = u.x + Math.sin(v.yaw) * o[1] + dvx; p.z = u.z + Math.cos(v.yaw) * o[1] + dvz; p.y = gy + v.ly + o[0] + dvy; p.yaw = v.yaw; if (v.dive) p.pitch = dvp; }
    }
    for (const k of Object.values(K)) k.update(t, camera, { lodDist: 110, lod2Dist: LOD2 });
    // siege engines
    for (const sk of Object.values(S)) {
      const n = Math.min(sk.cap, sk.list.length);
      for (const im of sk.meshes) {
        im.count = n; im.visible = n > 0;
        for (let i = 0; i < n; i++) {
          const c = sk.list[i], back = c.rec * sk.kick, yaw = c.yaw + sk.yawOff;
          _q.setFromAxisAngle(_up, yaw); _q.multiply(new THREE.Quaternion().setFromEuler(_e.set(-c.rec * 0.05 * Math.sign(sk.kick), 0, 0)));
          _p.set(c.x - Math.sin(c.yaw) * back, c.y + (c.dead ? -0.2 * (1 - c.sy) : 0), c.z - Math.cos(c.yaw) * back); _s.set(1, c.sy, 1);
          _m.compose(_p, _q, _s); im.setMatrixAt(i, _m);
        }
        im.instanceMatrix.needsUpdate = true;
      }
    }
  }

  return {
    views, event, update, kinds: K, group: G, statics: S,
    stats: () => { let d = 0; for (const k of Object.values(K)) d += k.drawn.reduce((a, b) => a + b, 0); return { views: list.length, drawn: d }; },
    dispose() { scene.remove(G); freeGL(G); },
  };
}
