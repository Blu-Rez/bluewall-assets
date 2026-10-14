// WORKER U5: the two three-headed attack units, baby3 (lv 29, "Triple Whelp") and dragon3 (lv 30, "Triple Dragon"), on a REAL rigged model.
//   model   "King ghidorah" by TECHGUY, CC-BY 4.0 (https://sketchfab.com/3d-models/king-ghidorah-27d1b426f029403898d1a8f74866c383) - three heads, wings, 75-bone rig, its own clips.
//           web/assets/u5_dragon3.glb is that file reduced + packed by dev/u5_mkdragon.mjs (weld + simplify to 16k tris, 1024 webp, 3 clips kept: Fly / Beam / Idle, meshopt) - nothing was modelled or painted by hand.
//   how     the ordinary instanced crowd (crowd.js createKind: baked clips, 2 draw calls per kind, no per-dragon CPU skinning) with the game's own 'swap' recolour (the golden hide -> kingdom blue,
//           the same shader variant the frost imp / skeleton mage use: no new shader program) and the forge-tier sheen (unitlook.js GLINT) on the body.
//   hook    bunits_fly.js calls `const u5 = await u5Flyers(ctx)` first; whatever it returns as true is skipped by the old look (bdragon3.js), so a missing asset leaves the old three-head prowler in place.
//   dev     window.__u5Opt = { yaw, scale: { dragon3, baby3 }, mouths } (lab pages only) to try values.
import * as THREE from 'three';
import { createKind } from './crowd.js';
import { GLINT } from './unitlook.js';

export const U5_ASSET = 'u5_dragon3';
// p43: the model is NOT shipped yet (owner decision pending: King Ghidorah is a Toho character).  false = never ask for the file (no 404 per battle), the old three-head prowler stays; true = use u5_dragon3.glb (see docs/MERGE5_prompt.md).
export const U5_ON = false;
// ---- the model's own frame, measured on the packed file (dev/u5_mouths.js / the lab sheets): it already faces +z (the crowd's forward) with its feet at y = 0, so no turn; 1 unit = ~1 wingspan after the scale
const FIT = { yaw: 0, k: 0.48 };
const MOUTHS = [[0.18, 0.29, -0.02], [0.205, 0.25, -0.08], [0.225, 0.175, 0.035]];   // [forward, up, sideways (+ = the unit's left)] in model scales: the middle / right / left jaw tips in the middle of the attack clip (dev/u5_mouths.js reads them off the rig)
// the forge-tier sheen (unitlook.js GLINT: gold / ice-white / crystal-blue from tier 3): gold on a blue hide turns grey-mauve (the red dragons have their own warm EMBER for the same reason), so tier 3 is a steel-blue sheen here; ice and crystal are the realm's own
const GLINT_U5 = [null, null, null, [0xa9c8f0, 0.07], GLINT[4], GLINT[5]];
const dev = () => (typeof window !== 'undefined' && window.__u5Opt) || {};

// the packed file wrapped so the crowd's +z is the dragon's nose (the wrapper's turn and scale are baked with the rest of the pose)
function fit(g, D) {
  const w = new THREE.Group(); w.name = 'u5_fit'; w.add(g.scene);
  w.rotation.y = D.yaw != null ? D.yaw : FIT.yaw; w.scale.setScalar(FIT.k); w.updateMatrixWorld(true);
  return { scene: w, animations: g.animations };
}

export async function u5Flyers(ctx) {
  const { need, step, TYPE, count, TT, K } = ctx, got = {}, D = dev();
  if (!U5_ON || !(count.baby3 || count.dragon3)) return got;
  const g = await need(U5_ASSET);
  if (!g || !g.scene || !(g.animations || []).length) return got;                    // asset not installed: the old look stays
  const gl = fit(g, D), mouths = D.mouths || MOUTHS;
  const tier = Math.max(TT.baby3 | 0, TT.dragon3 | 0), cap = (count.baby3 | 0) + (count.dragon3 | 0) + 3;       // (both units are made in the lair: one forge tier)
  // ONE kind for both: the Beam / Fly / Idle clips baked once at 20 fps, the swap recolour, the tier sheen; the two units differ in size
  await step('u5_dragon', () => { const t0 = performance.now(), k = createKind({ gltf: gl, anims: gl, clips: ['Idle', 'Fly', 'Beam'], capacity: cap, fps: 20, hue: 'swap', glint: (D.glint || GLINT_U5)[tier] || undefined }); (typeof window !== 'undefined') && ((window.__u5Bake = window.__u5Bake || []).push(+(performance.now() - t0).toFixed(1))); return k; });
  if (!(K && K.u5_dragon)) return got;                                      // (the kind could not be built: step() only warns - then the old look must take over, not an empty field)
  // the attack: the Beam clip from its rear-up (the wings throw back, the three necks lift) to the moment the heads come forward, played at natural speed once per attack
  const clip = { idle: 'Idle', hover: 'Fly', run: 'Fly', atk: ['Beam'], hit: 'Fly' }, atk = { atkSp: 1, atkOff: 0.9 };
  if (count.dragon3) {
    TYPE.dragon3 = { turn: 2.0, lift: 20, air: true, big: true, fire: 'orange', mouth: mouths[0], mouths, parts: [
      { k: 'u5_dragon', scale: (D.scale || {}).dragon3 || 24, crK: 1.3, ...atk, clip, die: { tumble: { key: 'roll', to: 2.4, dur: 1.2, sink: 0 } } }] };
    got.dragon3 = true;
  }
  if (count.baby3) {
    TYPE.baby3 = { turn: 3.0, lift: 12.2, air: true, big: false, fire: 'orange', mouth: mouths[0], mouths, parts: [
      { k: 'u5_dragon', scale: (D.scale || {}).baby3 || 11, crK: 1.3, ...atk, clip, die: { tumble: { key: 'roll', to: 2.4, dur: 1.0, sink: 0 } } }] };
    got.baby3 = true;
  }
  return got;
}
