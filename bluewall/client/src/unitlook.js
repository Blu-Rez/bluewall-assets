import * as THREE from 'three';
// What a soldier looks like at its level. A unit's level = the level of the building that trains it (barracks, training ground, stable,
// lair, workshop); every tier (the same six steps as the buildings: 1 recruit, 6 stone, 12 iron, 18 gold, 24 diamond, 30 blue crystal)
// changes its cloth colour, the colour / glow of its gear, its size, and — for the foot soldiers — what it wears (recruits fight bare-
// headed, from stone on a helmet, from iron the spearmen carry a shield, from gold the crested helm).  Stats + perks: battlesim / military.py.
export const TIER_AT = [1, 6, 12, 18, 24, 30];
export const tierOf = (L) => { let t = 0; for (let i = 0; i < TIER_AT.length; i++) if (L >= TIER_AT[i]) t = i; return t; };
export const TIER_NAME = ['Recruit', 'Stone', 'Iron', 'Gold', 'Diamond', 'Crystal'];
export const TIER_COL = ['#b9a27f', '#c4c8d0', '#9fb6d8', '#ffd36e', '#bfeaff', '#5fc4ff'];
// the kingdom blue of the cloth per tier: [rgb target, mix]  (stone = the classic kingdom blue, unchanged)
export const CLOTH = [{ c: [0.62, 0.66, 0.74], k: 0.55 }, { c: [0, 0, 0], k: 0 }, { c: [0.13, 0.22, 0.7], k: 0.6 }, { c: [0.2, 0.32, 0.95], k: 0.5 }, { c: [0.66, 0.88, 1.0], k: 0.55 }, { c: [0.28, 0.7, 1.0], k: 0.68 }];
export const GLINT = [null, null, null, [0xffc861, 0.06], [0xcfefff, 0.1], [0x4fb4ff, 0.18]];   // creatures: a sheen on the body from gold on
export const tierScale = (t) => 1 + 0.025 * t;
export const PERK = { 2: ['Armor', '−10 % damage taken'], 3: ['Swift', '+10 % speed'], 4: ['Fury', '+15 % damage'], 5: ['Last Stand', 'survives one deadly blow'] };
// the foot soldiers' kit per tier: which pieces (helmet2 = open helm, helmet3 = crested helm)
export function kit(type, tier) {
  const helm = tier <= 0 ? null : tier >= 3 ? 'helmet3' : 'helmet2';
  if (type === 'spear') return { helm, shield: tier >= 1 };
  if (type === 'sword') return { helm: tier <= 0 ? null : tier >= 3 ? 'helmet3' : 'helmet2' };
  if (type === 'guard') return { helm };
  if (type === 'archer') return { helm: tier >= 1 ? helm : null };
  if (type === 'legionary') return { helm: 'galea', crest: tier >= 1 };      // (p35: the Roman foot soldier always wears his galea; the horsehair crest from stone on; scutum + gladius at every level)
  return { helm };
}
// ---- the metal of the gear per tier (crowd.js 'aGear' classes): steel = helmet shells, blades, spear heads; trim = shield rims, rivets,
// helmet crests, cross-guards, the plume holder. [sRGB colour, roughness]; glow: a faint crystal light in the trims (blue crystal tier)
export const METAL = [
  { steel: [0x6a6e75, 0.62], trim: [0x5c5752, 0.66], glow: 0 },        // recruit: dull dark iron
  { steel: [0x9198a1, 0.5], trim: [0x878d96, 0.5], glow: 0 },          // stone: plain iron
  { steel: [0xb4bcc7, 0.42], trim: [0xc9d1dc, 0.36], glow: 0 },        // iron: bright steel
  { steel: [0xbcc4cf, 0.38], trim: [0xe6ad4c, 0.3], glow: 0 },         // gold: steel with gilded trims
  { steel: [0xd5dde8, 0.3], trim: [0xf1f5fa, 0.22], glow: 0 },         // diamond: polished silver
  { steel: [0xc0d3ea, 0.3], trim: [0x78b2f2, 0.26], glow: 0.35 },      // blue crystal: blued steel, crystal-blue trims
];
// horsehair plume of the knights per tier: [root, tip] (navy, royal blue, white, ice … the kingdom's colours)
export const HAIR = [[0x7d7466, 0xd9d0bf], [0x101c3c, 0x2b4a86], [0x18357e, 0x4f80d6], [0x142c64, 0xf3f5f9], [0xcfdff2, 0xffffff], [0x1a52c0, 0xa6dcff]];
// material name of a flat-coloured prop part -> its gear: [class 0 plain / 1 steel / 2 trim, shade (x tier metal) or colour, roughness, metalness]
const GEAR_MAT = [
  [/^LightSteel/i, 1, 1.12], [/^DarkSteel/i, 2, 0.92], [/^(Steel|Grey|Gray|Silver|Metal|Iron)/i, 1, 1.0], [/Gold|Brass|Bronze/i, 2, 1.0],
  [/^LightRed/i, 1, 1.18], [/^Red/i, 1, 0.94],                                     // (the claymore's blade and edge are "red" in the source model)
  [/^Black/i, 0, 0x1b1d22, 0.55, 0.2], [/DarkBrown|Leather/i, 0, 0x3b2a1e, 0.7, 0], [/DarkWood/i, 0, null, 0.8, 0], [/Wood/i, 0, null, 0.72, 0],
];
export function gearOf(name) {
  for (const [re, cls, a, r, m] of GEAR_MAT) if (re.test(name || '')) return cls ? { cls, shade: a } : { cls: 0, color: a, rough: r, metal: m };
  return { cls: 0, color: null, rough: 0.7, metal: 0 };
}
// the tier look of a crowd kind's gear (flat props: the tier metal of steel + trims; no rebuild, a few uniforms)
export function tintGear(kind, tier) {
  if (!kind || !kind.gear) return;
  const T = METAL[Math.max(0, Math.min(5, tier | 0))], U = kind.gear, c = new THREE.Color();
  c.set(T.steel[0]); U.steel.value.set(c.r, c.g, c.b, T.steel[1]);
  c.set(T.trim[0]); U.trim.value.set(c.r, c.g, c.b, T.trim[1]);
  U.glow.value = T.glow;
}
