// p35: the flyers of the 30-level roster: gryphon, gryphon knight (hero), dark rider (hero), the three-headed baby dragon (baby3) and the three-headed dragon (dragon3).
// bunits.js calls setupFlyers() once per battle, after the ordinary dragons, when the army (or the foe) has any of them.  Context:
//   M      the model cache (name -> GLTF; `await need('gryphon')` loads one from assets/)         need(name)  load + cache
//   step   `await step('kindName', () => kind)`  registers a crowd kind (createKind) or a live kind (createLiveKind) in K and the scene
//   TYPE   the per-type recipes: set TYPE.gryphon = { turn, lift, air: true, big, fire, mouth: [fwd, up], parts: [...] } exactly like the ones in bunits.js
//   count  { unitType: n } of this battle      units: sim.units      TT: tier of each unit type      K: kinds      G: scene group      hooks: effect hooks (breath, fireball, ...)
import * as THREE from 'three';
import { prowlerFly, EMBER } from './bdragon.js';
import { createLiveKind, LIVE_LOOK } from './bdragon_live.js';
import { makeMultiHead } from './bdragon3.js';
import { createKind } from './crowd.js';
import { buildGryphon } from './bgryphon.js';
import { bakeKnight, darkRider } from './bgrider.js';
import { dressKnight, setPlumeTier } from './gear_plume.js';
import { GLINT } from './unitlook.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// ---- the looks (bdragon_live.js LIVE_LOOK: tint = the colour the grey skin is multiplied with, rim light, eye glow)
// the three-headed ones stay in the warm family of our dragons but richer: deeper oxblood hide, a hotter rim, hotter eyes
LIVE_LOOK.baby3 = { tint: 0xa0101e, rim: [1.0, 0.22, 0.06], rimK: 0.4, rimPow: 3.5, eye: 0xffd25a, gain: 1.4, glow: [0.34, 0.2, 0.03], glowPow: 6 };      // deep oxblood hide, gold glints on the scale ridges, a warm ember rim, amber eyes
// the dark rider's dragon (hero): the prowler painted near-black with a cold deep-blue sheen, a cold blue-violet rim light, pale ice-blue eyes
LIVE_LOOK.darkrider = { tint: 0x2b3042, rim: [0.3, 0.38, 1.0], rimK: 0.36, eye: 0xbfe6ff, gain: 1.15 };
LIVE_LOOK.dragon3 = { tint: 0x6e0c1a, rim: [1.0, 0.2, 0.05], rimK: 0.45, rimPow: 4, eye: 0xffd070, gain: 1.4, glow: [0.3, 0.1, 0.01], glowPow: 6 };      // crimson-black, molten orange along the edges and on the ridges

const devOpt = () => (typeof window !== 'undefined' && window.__flyOpt) || {};                                      // (dev only: the lab page sets window.__flyOpt = { heads: { dragon3: {...makeMultiHead options} }, look: { dragon3: {...LIVE_LOOK fields} } } to try values)

export async function setupFlyers(ctx) {
  const { M, need, step, TYPE, count, TT } = ctx, DEV = devOpt();
  for (const [k, v] of Object.entries(DEV.look || {})) LIVE_LOOK[k] = { ...LIVE_LOOK[k], ...v };
  // ---------------------------------------------------------------- the three-headed dragons (bdragon3.js: the prowler with two more necks)
  if (count.baby3 || count.dragon3) {
    const pw = await need('prowler'); prowlerFly(pw);
    const dk = (key, lookKey, tier, opt) => () => {
      const g3 = M['prowler_3_' + key] || (M['prowler_3_' + key] = makeMultiHead(pw, { ...opt, ...((DEV.heads || {})[key] || {}) }));
      const L = LIVE_LOOK[lookKey], gl = EMBER[tier | 0];
      return createLiveKind({ gltf: g3, look: gl ? { ...L, rimK: L.rimK + gl[1] * 4 } : L, key, rim: gl ? [((gl[0] >> 16) & 255) / 255, ((gl[0] >> 8) & 255) / 255, (gl[0] & 255) / 255] : null });
    };
    const MOUTHS = [[0.55, 0.37, 0], [0.5, 0.37, -0.24], [0.5, 0.37, 0.24]];           // [forward, up, sideways (+ = the unit's left)] in model scales
    if (count.dragon3) {
      await step('dragon3', dk('dragon3', 'dragon3', TT.dragon3, { heads: 3, yaw: 0.6, spread: 4.4, neckK: 1.45, lag: 0.2 }));
      TYPE.dragon3 = { turn: 2.0, lift: 20, air: true, big: true, fire: 'orange', mouth: MOUTHS[0], mouths: MOUTHS, parts: [
        { k: 'dragon3', scale: 16.9, crK: 3, clip: { idle: 'Perch', hover: 'Fly', run: 'Fly', atk: ['Fly'], hit: 'Fly' }, die: { tumble: { key: 'roll', to: 2.4, dur: 1.2, sink: 0 } } }] };
    }
    if (count.baby3) {
      await step('baby3', dk('baby3', 'baby3', TT.baby3, { heads: 3, yaw: 0.6, spread: 4.4, neckK: 1.45, lag: 0.2 }));
      TYPE.baby3 = { turn: 3.0, lift: 12.2, air: true, big: false, fire: 'orange', mouth: MOUTHS[0], mouths: MOUTHS, parts: [
        { k: 'baby3', scale: 8.8, crK: 3, clip: { idle: 'Perch', hover: 'Fly', run: 'Fly', atk: ['Fly'], hit: 'Fly' }, die: { tumble: { key: 'roll', to: 2.4, dur: 1.0, sink: 0 } } }] };
    }
  }
  // ---------------------------------------------------------------- the gryphon (bgryphon.js: gryphon.glb's geometry on our own rig and wing-beat)
  if (count.gryphon) {
    const g = await need('gryphon'), gl = buildGryphon(g, { hero: false, id: 'gry' });
    await step('gryphon', () => createKind({ gltf: gl, anims: gl, clips: ['Rest', 'Fly', 'Hover', 'Atk', 'Hit', 'Die'], capacity: count.gryphon + 3, glint: GLINT[TT.gryphon | 0] || undefined }));
    TYPE.gryphon = { turn: 4, lift: 9.5, air: true, parts: [
      { k: 'gryphon', scale: 3.0, crAbs: 13, atkSp: 1, atkOff: 0.18, clip: { idle: 'Rest', hover: 'Hover', run: 'Fly', atk: ['Atk'], hit: 'Hit' }, die: { clip: 'Die', tumble: { key: 'roll', to: 1.45, dur: 0.9, sink: 0.4 } } }] };
  }
  // ---------------------------------------------------------------- the gryphon knight (hero): a bigger, deeper-blue gryphon in barding, the K3 knight frozen in the saddle (bgrider.js), a bright blue-white glint
  if (count.gryphonknight) {
    const g = await need('gryphon'), kn = await need('knight_k3'); dressKnight(kn);
    if (!(count.cavalry || count.axerider || count.lord)) setPlumeTier(Math.max(2, TT.gryphonknight | 0));        // (the plume colour is one shared setting: the stable's tier wins when there are riders too)
    const gl = buildGryphon(g, { hero: true, id: 'gk', rider: { pieces: bakeKnight(kn, { clip: 'RideDrawn', t: 0.25 }), k: 1.1 } });
    await step('gryphonknight', () => createKind({ gltf: gl, anims: gl, clips: ['Rest', 'Fly', 'Hover', 'Atk', 'Hit', 'Die'], capacity: count.gryphonknight + 3, glint: [0xcfefff, 0.05] }));
    TYPE.gryphonknight = { turn: 3.4, lift: 10.5, air: true, parts: [
      { k: 'gryphonknight', scale: 3.45, crAbs: 15, atkSp: 1, atkOff: 0.18, clip: { idle: 'Rest', hover: 'Hover', run: 'Fly', atk: ['Atk'], hit: 'Hit' }, die: { clip: 'Die', tumble: { key: 'roll', to: 1.45, dur: 1.0, sink: 0.4 } } }] };
  }
  // ---------------------------------------------------------------- the dark rider (hero): a near-black dragon, a knight in black plate with a spiked crown and a long cloak on its back (bgrider.js), shadow fire
  if (count.darkrider) {
    const pw = await need('prowler'), kn = await need('knight_k3'); prowlerFly(pw); dressKnight(kn);
    await step('darkrider', () => {
      const kind = createLiveKind({ gltf: pw, look: LIVE_LOOK.darkrider, key: 'darkrider' });
      const rd = darkRider(bakeKnight(kn, { clip: 'RideDrawn', t: 0.25 }), { U: kind.hand.U });
      // the rider is fixed to the dragon's torso bone: his place is measured in the bone's frame of the first frame of 'Fly' (pelvis on the back, ahead of the hips), then he moves with the bone
      const probe = SkeletonUtils.clone(pw.scene), mx = new THREE.AnimationMixer(probe); mx.clipAction(pw.animations.find((a) => a.name === 'Fly')).play(); mx.setTime(0); probe.updateMatrixWorld(true);
      const K = 0.26, L = probe.getObjectByName('Torso_118').matrixWorld.clone().invert().multiply(new THREE.Matrix4().compose(new THREE.Vector3(0, 0.4 - 0.96 * K, 0.04 + 0.04 * K), new THREE.Quaternion(), new THREE.Vector3(K, K, K)));
      const add0 = kind.add, upd0 = kind.update;
      kind.add = (o) => { const p = add0(o), torso = p.c.inner.getObjectByName('Torso_118'); if (torso) { const g = rd.group.clone(); g.matrixAutoUpdate = false; g.matrix.copy(L); torso.add(g); } return p; };
      kind.update = (t, camera) => { rd.setTime(t); upd0(t, camera); };
      return kind;
    });
    TYPE.darkrider = { turn: 2.4, lift: 14, air: true, big: true, bigFire: true, fire: 'shadow', mouth: [0.5, 0.34], parts: [
      { k: 'darkrider', scale: 11.25, crK: 3, clip: { idle: 'Perch', hover: 'Fly', run: 'Fly', atk: ['Fly'], hit: 'Fly' }, die: { tumble: { key: 'roll', to: 2.4, dur: 1.1, sink: 0 } } }] };
  }
}
