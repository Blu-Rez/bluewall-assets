// RP4 TEST FIXTURES — five throw-away kits, one per archetype of the other sisters, written ONLY to prove the kit API can express them (ranged shots + heal, thrust + freeze, slow hammer + shield, fast daggers, staff + buffs).
// They are NOT game content (numbers are not balanced, windows are not measured on the clips) and are never shipped in web/assets.  The real kits are RP5a-f: combat/kit_<sister>.js.
const SW = { slot: 'R', url: 'combat/sword_arming.glb', len: 0.95, grip: { b: [-0.8, 0.6, 0], pos: [0, 0.035, 0] } };
export const RANGED = {            // melika — plant — ranged healer: bow shots, a heal, a root
  id: 'melika', element: 'plant', role: 'ranged healer', autoTurn: 9, hero: { hp: 500 }, icons: { attack: 'bow', skill1: 'heal', skill2: 'leaf', block: 'shield' },
  combo: [
    { type: 'shot', clip: 'aim', dur: 0.5, hit: [0.2, 0.3], dmg: 0.7, cancel: 0.35, shot: { speed: 22, range: 16, radius: 0.5 } },
    { type: 'shot', clip: 'aim', dur: 0.5, hit: [0.2, 0.3], dmg: 0.7, cancel: 0.35, shot: { speed: 22, range: 16, radius: 0.5 } },
    { type: 'shot', clip: 'aim', dur: 0.8, hit: [0.4, 0.5], dmg: 1.4, cancel: 0.6, stagger: true, shot: { speed: 26, range: 18, radius: 0.6, pierce: true, count: 3, spread: 12 } },
  ],
  skills: [
    { id: 'mend', icon: 'heal', cd: 8, clip: 'cast', dur: 1.0, at: 0.4, effects: [{ type: 'heal', amount: 0.3 }, { type: 'heal', amount: 0.2, dur: 4 }] },
    { id: 'snare', icon: 'leaf', cd: 12, clip: 'cast', dur: 1.0, at: 0.4, effects: [{ type: 'aoe', radius: 4.5, dmg: 0.5, stop: 0.05, knock: 0, poise: 10, status: { id: 'root', dur: 3 } }] },
  ],
};
export const SPEAR = {             // aylar — ice — controller: long narrow thrusts, ice beads that slow, a freezing nova
  id: 'aylar', element: 'ice', role: 'controller', weapons: [SW], icons: { attack: 'spear', skill1: 'beads', skill2: 'snow', block: 'shield' },
  combo: [
    { clip: 'slash_a', dur: 0.43, hit: [0.19, 0.29], dmg: 0.7, arc: 35, reach: 3.3, lunge: [0.4, 0.08, 0.22], cancel: 0.30, knock: 0.2 },
    { clip: 'slash_b', dur: 0.53, hit: [0.20, 0.32], dmg: 0.8, arc: 35, reach: 3.4, lunge: [0.4, 0.06, 0.24], cancel: 0.34, knock: 0.2 },
    { clip: 'heavy', dur: 0.93, hit: [0.26, 0.38], dmg: 1.5, arc: 50, reach: 3.8, lunge: [1.0, 0.2, 0.34], cancel: 0.56, stop: 0.08, knock: 1.2, poise: 80, stagger: true, status: { id: 'slow', dur: 2, k: 0.6 } },
  ],
  skills: [
    { id: 'beads', icon: 'beads', cd: 7, clip: 'slash_b', dur: 0.53, at: 0.22, effects: [{ type: 'projectile', vis: 'bolt', speed: 18, range: 14, radius: 0.6, dmg: 0.9, count: 3, spread: 14, pierce: false, stop: 0.05, knock: 0.4, poise: 20, status: { id: 'slow', dur: 3, k: 0.5 } }] },
    { id: 'nova', icon: 'snow', cd: 16, clip: 'cast', rate: 1.2, dur: 1.08, at: 0.66, effects: [{ type: 'aoe', radius: 4.5, dmg: 1.0, stop: 0.08, knock: 1.0, poise: 60, status: { id: 'freeze', dur: 2.0 } }] },
  ],
};
export const HAMMER = {            // mobina — stone — tank: slow heavy swings, a wide walking guard, a quake cone, a stone shield + damage buff
  id: 'mobina', element: 'stone', role: 'tank', weapons: [SW], hero: { hp: 900, stamina: 120, armor: 1.0, atk: 1.2 }, block: { arc: 180, dr: 0.1, cost: 0.2, walk: 1.2 }, icons: { attack: 'hammer', skill1: 'quake', skill2: 'shield', block: 'shield' },
  combo: [
    { clip: 'heavy', dur: 0.93, rate: 0.85, hit: [0.26, 0.38], dmg: 1.4, arc: 130, reach: 2.3, lunge: [0.5, 0.2, 0.34], cancel: 0.6, stop: 0.09, knock: 1.4, poise: 90 },
    { clip: 'heavy', dur: 0.93, rate: 0.85, hit: [0.26, 0.38], dmg: 1.6, arc: 130, reach: 2.4, lunge: [0.5, 0.2, 0.34], cancel: 0.6, stop: 0.09, knock: 1.6, poise: 100 },
    { clip: 'heavy', dur: 0.93, rate: 0.7, hit: [0.26, 0.38], dmg: 2.6, arc: 160, reach: 2.6, lunge: [0.8, 0.2, 0.34], cancel: 0.7, stop: 0.12, knock: 3.0, poise: 220, stagger: true },
  ],
  skills: [
    { id: 'quake', icon: 'quake', cd: 9, clip: 'heavy', dur: 0.93, at: 0.3, effects: [{ type: 'aoe', shape: 'cone', arc: 100, radius: 5, offset: 0, dmg: 2.4, stop: 0.12, knock: 4, poise: 160, stagger: true }] },
    { id: 'stoneskin', icon: 'shield', cd: 18, clip: 'cast', rate: 1.2, dur: 1.08, at: 0.5, effects: [{ type: 'shield', absorb: 0.25, dur: 6 }, { type: 'buff', stat: 'dr', mult: 0.6, dur: 6 }] },
  ],
};
export const DAGGERS = {           // elika — wind — fast scout: a five-beat flurry, a piercing sling stone that burns, a gust that quickens her
  id: 'elika', element: 'wind', role: 'fast scout', weapons: [SW, { ...SW, slot: 'L' }], trailWeapon: 0, icons: { attack: 'dagger', skill1: 'bolt', skill2: 'gust', block: 'shield' },
  combo: [
    { clip: 'slash_a', dur: 0.43, rate: 1.4, hit: [0.19, 0.29], dmg: 0.45, arc: 100, reach: 1.9, lunge: [0.6, 0.08, 0.22], cancel: 0.28, stop: 0.04, knock: 0.15, poise: 12 },
    { clip: 'slash_b', dur: 0.53, rate: 1.4, hit: [0.20, 0.32], dmg: 0.45, arc: 100, reach: 1.9, lunge: [0.6, 0.06, 0.24], cancel: 0.32, stop: 0.04, knock: 0.15, poise: 12 },
    { clip: 'slash_a', dur: 0.43, rate: 1.4, hit: [0.19, 0.29], dmg: 0.5, arc: 100, reach: 1.9, lunge: [0.6, 0.08, 0.22], cancel: 0.28, stop: 0.04, knock: 0.15, poise: 12 },
    { clip: 'slash_b', dur: 0.53, rate: 1.4, hit: [0.20, 0.32], dmg: 0.5, arc: 100, reach: 1.9, lunge: [0.6, 0.06, 0.24], cancel: 0.32, stop: 0.04, knock: 0.15, poise: 12 },
    { clip: 'slash_c', dur: 0.70, rate: 1.4, hit: [0.29, 0.43], dmg: 1.1, arc: 130, reach: 2.2, lunge: [1.0, 0.24, 0.40], cancel: 0.49, stop: 0.07, knock: 0.9, poise: 40 },
  ],
  skills: [
    { id: 'sling', icon: 'bolt', cd: 5, clip: 'aim', dur: 0.6, at: 0.3, effects: [{ type: 'projectile', vis: 'bolt', speed: 32, range: 26, radius: 0.5, dmg: 1.6, pierce: false, stop: 0.06, knock: 0.8, poise: 40, status: { id: 'burn', dur: 3, dps: 0.2 } }] },
    { id: 'gust', icon: 'gust', cd: 12, clip: 'slash_c', rate: 1.2, dur: 0.7, at: 0.3, lunge: [3.0, 0.1, 0.4], effects: [{ type: 'aoe', radius: 3.2, dmg: 1.0, knock: 2.0, poise: 50 }, { type: 'buff', stat: 'rate', mult: 1.3, dur: 5 }] },
  ],
};
export const STAFF = {             // aylin — water — support healer: water bolts, a healing rain, a spring that restores stamina and sharpens her
  id: 'aylin', element: 'water', role: 'support healer', autoTurn: 8, hero: { hp: 520 }, icons: { attack: 'staff', skill1: 'heal', skill2: 'buff', block: 'shield' },
  combo: [
    { type: 'shot', clip: 'cast', dur: 0.6, hit: [0.25, 0.35], dmg: 0.6, cancel: 0.4, shot: { speed: 18, range: 14, radius: 0.55 } },
    { type: 'shot', clip: 'cast', dur: 0.6, hit: [0.25, 0.35], dmg: 0.6, cancel: 0.4, shot: { speed: 18, range: 14, radius: 0.55 } },
    { type: 'shot', clip: 'cast', dur: 0.9, hit: [0.4, 0.5], dmg: 1.3, cancel: 0.6, finisher: true, shot: { speed: 20, range: 16, radius: 0.9, pierce: true } },
  ],
  skills: [
    { id: 'rain', icon: 'heal', cd: 10, clip: 'cast', dur: 1.0, at: 0.4, effects: [{ type: 'heal', amount: 0.45, dur: 5 }] },
    { id: 'spring', icon: 'buff', cd: 16, clip: 'cast', dur: 1.0, at: 0.4, effects: [{ type: 'stamina', amount: 40 }, { type: 'buff', stat: 'atk', mult: 1.3, dur: 8 }] },
  ],
};
// WC1: the carry classes, one fixture each (the weapon file is always the library sword: only the CLASS / mount logic is tested here; the real models are tested in dev/wc1_dev.js)
const { grip: _g, ...SWN } = SW;
export const WC1_SWORD = { ...SPEAR, weapons: [{ ...SWN, kind: 'short_sword' }] };
export const WC1_BIG = { ...SPEAR, weapons: [{ ...SWN, kind: 'big_sword', len: 1.45 }] };
export const WC1_PAIR = { ...DAGGERS, weapons: [{ ...SWN, kind: 'dagger', len: 0.4, slot: 'L' }, { ...SWN, kind: 'dagger', len: 0.4, slot: 'R', gem: false }] };
export const WC1_STAFF = { ...STAFF, weapons: [{ ...SWN, kind: 'staff', len: 1.6 }] };
export const WC1_BOW = { ...RANGED, weapons: [{ ...SWN, kind: 'bow', len: 1.2, slot: 'L' }, { ...SWN, kind: 'quiver', len: 0.6, slot: 'R' }] };
export const WC1_BARE = { ...SPEAR, weapons: [{ ...SWN, kind: 'short_sword', carry: 'back', gem: false }] };   // the same weapon with NO carry mesh (no scabbard on the back, no gem) = the pre-WC1 cost, for the budget proof
export const ALL = { RANGED, SPEAR, HAMMER, DAGGERS, STAFF, WC1_SWORD, WC1_BIG, WC1_PAIR, WC1_STAFF, WC1_BOW, WC1_BARE };
