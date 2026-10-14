// u2_looks.js — the ogre (lv 22) as a REAL model in the instanced crowd (credits: web/assets/credits_u2.json).
//   ogre = "BATTLE OGRE BEHEMOTH ATTACKS!" by StrykerDoesAnimation (CC-BY 4.0), the owner's pick (#2 of the U2 sheet, 7 Oct 2026), packed to 6.0k triangles / 4 materials (dev/u2_pack.mjs, recipe dev/m43_r_ogre.json).
//   The model has ONE clip (an attack, 3.7 s, "Punch") and no idle / walk / death clip: standing and marching hold the first pose of that clip (a real pose of the model, no hand posing) and the unit slides;
//   the death is the game's standard tumble.  When the owner brings a model with idle / walk / death clips, replace u2_ogre.glb and the recipe below.
//   The treant is NOT part of this look: the owner rejected the U2 treant (7 Oct 2026); the old treant stays until he brings a model.
// bunits.js loads U2_NEED glbs and merges U2_TYPE into its recipe table; bunits_ground.js calls setupU2(ctx) after the other ground kinds.
import * as THREE from 'three';
import { createKind } from './crowd.js';
import { GLINT, tintGear } from './unitlook.js';

// glb files (web/assets) each unit needs
export const U2_NEED = { ogre: ['u2_ogre'] };

// battle recipe (same fields as TYPE in bunits.js).  scale 0.085 = the old ogre's height; the 3.7 s 'Punch' clip crouches (0.4 s), jumps (0.9 s), raises the club (1.5 s) and slams it down at ~1.95 s:
//   atkOff 1.55 / atkSp 1.6 start the swing with the club raised and put the slam (1.55 + 1.6 x 0.25) on the sim's damage moment (HIT_T.melee 0.25 s).
export const U2_TYPE = {
  ogre: { turn: 3, big: true, parts: [{ k: 'ogre', scale: 0.085, ref: 7.1, crAbs: 9, atkSp: 1.6, atkOff: 1.55, clip: { idle: 'Stand', run: 'Stand', atk: ['Punch'] }, die: { tumble: { key: 'pitch', to: -1.5, dur: 1.0, sink: -1.2 } } }] },
};

// a clip that holds the pose `src` has at time t (every track gets two equal keys)
function holdClip(src, name, t = 0) {
  const tracks = src.tracks.map((tr) => { const v = Array.from(tr.createInterpolant().evaluate(t)); return new tr.constructor(tr.name, [0, 0.2], [...v, ...v]); });
  return new THREE.AnimationClip(name, 0.2, tracks);
}

export async function setupU2(ctx) {
  const { M, step, count, TT, K } = ctx;
  if (count.ogre && M.u2_ogre) {
    const g = M.u2_ogre, punch = g.animations.find((c) => c.name === 'Punch');
    if (punch && !g.animations.some((c) => c.name === 'Stand')) g.animations.push(holdClip(punch, 'Stand', 0));
    await step('ogre', () => createKind({ gltf: g, anims: { animations: g.animations }, clips: ['Stand', 'Punch'], capacity: count.ogre + 3, glint: GLINT[TT.ogre | 0] }));
    K.ogre && tintGear(K.ogre, TT.ogre | 0);
  }
}
