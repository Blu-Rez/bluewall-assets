// U1: the legionary (lv 2 foot soldier) and the captain (lv 7 hero, banner bearer) as REAL models in the instanced crowd (crowd.js).
//   legionary  KayKit Adventurers "Knight" (CC0, Kay Lousberg) + his own sword and square shield, clips from the KayKit Character Animations pack (CC0)   -> web/assets/u1_legionary.glb
//   captain    "Viking (lowpoly)" by SlagPerch (CC-BY 4.0, sketchfab) with his own Idle / Walk / Sword_swing clips                                         -> web/assets/u1_captain.glb
// Nothing of either character is drawn or recoloured here: dev/u1_mkasset.mjs only selects, attaches (sword + shield to the hand bones) and compresses.  The one thing made in code is the
// captain's banner (a pole, a cross-bar and a cloth with the realm's crest: a prop, like the shields of gear_shield.js) because no model of a standard bearer's banner was found.
// Redirects in the shared files (<= 5 lines each):   bunits.js  Object.assign(TYPE, U1_TYPE) / Object.assign(CONTACT, U1_CONTACT)      bunits_ground.js  setupU1(ctx) first, old builders skipped.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createKind } from './crowd.js';
import { trimClips } from './creature.js';
import { tintGear, GLINT } from './unitlook.js';

// ------------------------------------------------------------------ per-type recipes (bunits.js TYPE): ref = ground speed (world u/s) at which the clip's feet stand still, measured with dev/u1_measure.py
//   legionary: Running_A stance 3.04 m/s x scale 1.8 = 5.5, Walking_A 0.72 x 1.8 = 1.3 (walkMax 1.6)       captain: Walk stance 4.0 m/s x 1.15 = 4.6 (his run clip is far faster than any infantry)
export const U1_TYPE = {
  legionary: { turn: 8, parts: [{ k: 'legionary', scale: 1.8, ref: 5.5, walkMax: 1.6, clip: { idle: 'Melee_Blocking', run: 'Running_A', walk: 'Walking_A', atk: ['Melee_1H_Attack_Slice_Horizontal', 'Melee_1H_Attack_Stab'], hit: 'Hit_A', die: 'Death_A' }, die: { clip: 'Death_A' } }] },
  captain: { turn: 6, parts: [{ k: 'captain', scale: 1.15, ref: 4.6, crAbs: 9, clip: { idle: 'Idle', run: 'Walk', atk: ['U1_Swing'] }, die: { tumble: { key: 'pitch', to: -1.5, dur: 0.9, sink: -0.4 } } }] },
};
// where the blade meets the target inside each attack clip (s at natural speed; measured on the animation data: the hand's fastest moment)
export const U1_CONTACT = { Melee_1H_Attack_Slice_Horizontal: 0.26, Melee_1H_Attack_Stab: 0.38, U1_Swing: 0.55 };

// a piece of a clip (the part around the blow): resampled at `fps`, starts at 0
function slice(clip, name, t0, t1, fps = 30) {
  const n = Math.max(2, Math.round((t1 - t0) * fps) + 1), times = new Float32Array(n); for (let i = 0; i < n; i++) times[i] = Math.min(t1 - t0, i / fps);
  const tracks = clip.tracks.map((tr) => {
    const it = tr.createInterpolant(), k = tr.getValueSize(), out = new Float32Array(n * k);
    for (let i = 0; i < n; i++) { const v = it.evaluate(t0 + times[i]); for (let c = 0; c < k; c++) out[i * k + c] = v[c]; }
    return new tr.constructor(tr.name, times, out);
  });
  return new THREE.AnimationClip(name, t1 - t0, tracks);
}

// ------------------------------------------------------------------ the captain's banner (bind pose of the Viking, metres of the glb; he faces +z, so "behind" is -z): a staff on his back (on the pelvis bone: the chest bends far in his swing) with a cross-bar, a spear-head and a cloth that carries the realm's crest
const _c = new THREE.Color();
function part(geo, hex, { cls = 0, metal = 0, rough = 0.7, shade = 1, crest = 0, uv = null } = {}) {
  let g = geo.index ? geo.toNonIndexed() : geo; const n = g.attributes.position.count, col = new Float32Array(n * 3), gear = new Float32Array(n * 4); _c.set(hex);
  for (let i = 0; i < n; i++) {
    const k = shade;
    col[i * 3] = cls || crest ? k : _c.r * k; col[i * 3 + 1] = cls || crest ? k : _c.g * k; col[i * 3 + 2] = cls || crest ? k : _c.b * k;
    gear[i * 4] = cls ? 0.85 : metal; gear[i * 4 + 1] = cls ? 0.45 : rough; gear[i * 4 + 2] = cls; gear[i * 4 + 3] = crest;
  }
  if (!g.attributes.normal) g.computeVertexNormals();
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aGear', new THREE.BufferAttribute(gear, 4));
  if (uv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); else g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color', 'aGear'].includes(a)) g.deleteAttribute(a);
  return g;
}
// the draped cloth: a W x H grid, swallow-tailed at the foot, one soft wave; `x`,`y` = model coordinates of the top-centre, double sided
function clothGeos(x0, yTop, z0, W, H, notch, hexTop, hexBot) {
  const NX = 8, NY = 10, wave = (x, y) => z0 + 0.06 * Math.sin((x / W) * 5.2 + (yTop - y) * 0.9) * (0.4 + 0.6 * ((yTop - y) / H));
  const pos = [], idx = [], top = new THREE.Color(hexTop), bot = new THREE.Color(hexBot), col = [], ctr = [];
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
    const u = (i / NX) * 2 - 1, hh = H - notch * (1 - Math.abs(u)), y = yTop - (j / NY) * hh, x = x0 + u * (W / 2), t = j / NY;
    pos.push(x, y, wave(x, y)); const k = 1 - 0.28 * t; col.push((top.r + (bot.r - top.r) * t) * k, (top.g + (bot.g - top.g) * t) * k, (top.b + (bot.b - top.b) * t) * k);
  }
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const mk = (flip) => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(flip ? idx.slice().reverse() : idx.slice());
    const ng = g.toNonIndexed(); ng.computeVertexNormals(); const n = ng.attributes.position.count, cc = new Float32Array(n * 3), gear = new Float32Array(n * 4);
    // vertex colours of the cloth: read back through the (non-indexed) index order
    const ii = flip ? idx.slice().reverse() : idx;
    for (let v = 0; v < n; v++) { const s = ii[v]; cc[v * 3] = col[s * 3]; cc[v * 3 + 1] = col[s * 3 + 1]; cc[v * 3 + 2] = col[s * 3 + 2]; gear[v * 4] = 0; gear[v * 4 + 1] = 0.9; }
    ng.setAttribute('color', new THREE.BufferAttribute(cc, 3)); ng.setAttribute('aGear', new THREE.BufferAttribute(gear, 4)); ng.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    return ng;
  };
  // the crest roundel on both faces: a disc on the cloth showing the middle of the realm's shield texture (gear_shield.js crestTexture: crest mask = aGear.w)
  const R = 0.44, cy = yTop - H * 0.46, mkDisc = (flip) => {
    const SEG = 24, p = [], uv = [], id = [];
    p.push(x0, cy, wave(x0, cy) + (flip ? -0.012 : 0.012)); uv.push(0.5, 0.5);
    for (let s = 0; s <= SEG; s++) { const a = (s / SEG) * Math.PI * 2, x = x0 + Math.cos(a) * R, y = cy + Math.sin(a) * R; p.push(x, y, wave(x, y) + (flip ? -0.012 : 0.012)); uv.push(0.5 + (flip ? -1 : 1) * Math.cos(a) * 0.3, 0.5 + Math.sin(a) * 0.3); }
    for (let s = 1; s <= SEG; s++) id.push(0, flip ? s + 1 : s, flip ? s : s + 1);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(id); const ng = g.toNonIndexed(); ng.computeVertexNormals();
    const n = ng.attributes.position.count, uu = new Float32Array(n * 2), ii = id; for (let v = 0; v < n; v++) { uu[v * 2] = uv[ii[v] * 2]; uu[v * 2 + 1] = uv[ii[v] * 2 + 1]; }
    return part(ng, 0xffffff, { crest: 1, rough: 0.8, uv: uu });
  };
  return [mk(false), mk(true), mkDisc(false), mkDisc(true)];
}
function bannerProp(root, boneRe = /Hips/) {
  root.updateMatrixWorld(true);
  let bone = null; root.traverse((o) => { if (!bone && o.isBone && boneRe.test(o.name)) bone = o; });
  if (!bone) return null;
  const Z = -0.72, TOP = 7.15, BAR = 6.6, geos = [];
  const cyl = (r, y0, y1, x = 0, z = Z, seg = 8) => { const g = new THREE.CylinderGeometry(r, r, y1 - y0, seg); g.translate(x, (y0 + y1) / 2, z); return g; };
  const bar = new THREE.CylinderGeometry(0.045, 0.045, 1.9, 8); bar.rotateZ(Math.PI / 2); bar.translate(0, BAR, Z);
  const knob = (x) => { const g = new THREE.SphereGeometry(0.075, 8, 6); g.translate(x, BAR, Z); return g; };
  const tip = new THREE.ConeGeometry(0.11, 0.46, 6); tip.translate(0, TOP + 0.3, Z);
  const collar = new THREE.SphereGeometry(0.095, 8, 6); collar.translate(0, TOP + 0.02, Z);
  geos.push(part(cyl(0.055, 1.7, TOP), 0x4a3524, { rough: 0.8 }), part(bar, 0xffffff, { cls: 2, shade: 1.05 }), part(knob(-0.95), 0xffffff, { cls: 2, shade: 1.1 }), part(knob(0.95), 0xffffff, { cls: 2, shade: 1.1 }),
    part(tip, 0xffffff, { cls: 1, shade: 1 }), part(collar, 0xffffff, { cls: 2, shade: 1.1 }));
  for (const g of clothGeos(0, BAR - 0.04, Z - 0.07, 1.8, 2.05, 0.6, 0x2656b8, 0x0d2250)) geos.push(g);
  const g = mergeGeometries(geos, false), inv = new THREE.Matrix4().copy(bone.matrixWorld).invert();
  g.applyMatrix4(inv);                                                      // bind-pose model space -> the bone's own space (crowd.js multiplies the bone's animated matrix back in)
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, name: 'bwgear' })), scene = new THREE.Group(); scene.add(m);
  return { gltf: { scene }, bone: bone.name, s: 1, pos: [0, 0, 0], rot: [0, 0, 0] };
}

// ------------------------------------------------------------------ the kinds (called first thing by setupGround; returns which kinds it built, the old builders skip those)
export async function setupU1(ctx) {
  const { M, need, step, count, TT, K } = ctx, built = {};
  if (count.legionary) {
    try {
      await need('u1_legionary'); const g = M.u1_legionary; trimClips(g); const t = TT.legionary | 0;
      await step('legionary', () => createKind({ gltf: g, anims: { animations: g.animations }, clips: Object.values(U1_TYPE.legionary.parts[0].clip).flat(), capacity: count.legionary + 6, glint: GLINT[t], tier: t, crest: 'own',
        lod2: { cloth: 0x8e98a8, legs: 0x4f5766, skin: 0xd9a77f, h: 2.3 } }));
      tintGear(K.legionary, t); built.legionary = !!K.legionary;
    } catch (e) { console.warn('u1 legionary', e); }
  }
  if (count.captain) {
    try {
      await need('u1_captain'); const g = M.u1_captain; trimClips(g); const t = TT.captain | 0;
      const sw = g.animations.find((c) => c.name === 'Sword_swing');
      const anims = g.animations.filter((c) => c.name !== 'U1_Swing').concat(sw ? [slice(sw, 'U1_Swing', 0.5, sw.duration)] : []);
      const banner = bannerProp(g.scene);
      await step('captain', () => createKind({ gltf: g, anims: { animations: anims }, clips: ['Idle', 'Walk', 'U1_Swing'], capacity: count.captain + 3, glint: GLINT[t], tier: t, crest: 'own', props: banner ? [banner] : [] }));
      tintGear(K.captain, t); built.captain = !!K.captain;
    } catch (e) { console.warn('u1 captain', e); }
  }
  return built;
}
