// Elina — fire — melee striker (RP4).  The reference kit: DATA ONLY (no code, no imports).  Checked by validateKit() in combat.js; every field is explained in RP4_KIT_API.md.
// Times of a combo beat are CLIP seconds (the clip's own clock; `rate` plays it faster, real time = clip time / rate).  Arcs are DEGREES.  Distances are metres.  Damage = dmg x 100 (ATK) x element multiplier.
// All clips are the ones inside elina.glb (RP0B, 14 Oct 2026): slash_a 0.43 s, slash_b 0.53 s, slash_c 0.70 s, heavy 0.93 s, block 0.84 s (loop), cast, dodge, hit, knockdown, death.  Windows were measured from the sword tip's speed on the real clips (dev/rp4_clips.py).
export default {
  id: 'elina',
  element: 'fire',
  role: 'melee striker',
  weapons: [{ slot: 'R', url: 'combat/sword_arming.glb', len: 0.95, grip: { b: [-0.8, 0.6, 0], pos: [0, 0.035, 0] }, tip: 0.92, root: 0.62 }],    // the library sword on R_Hand (owner's default pick #1 sword_med_arming)
  hero: { hp: 600, stamina: 100, atk: 1 },
  block: { clip: 'block', arc: 120, dr: 0.25, cost: 0.3 },
  icons: { attack: 'sword', skill1: 'flame', skill2: 'burst', block: 'shield' },
  combo: [
    { clip: 'slash_a', dur: 0.43, hit: [0.19, 0.29], dmg: 0.8, arc: 110, reach: 2.1, lunge: [0.8, 0.08, 0.22], cancel: 0.30, stop: 0.055, knock: 0.3, poise: 22 },
    { clip: 'slash_b', dur: 0.53, hit: [0.20, 0.32], dmg: 0.9, arc: 110, reach: 2.2, lunge: [0.9, 0.06, 0.24], cancel: 0.34, stop: 0.055, knock: 0.3, poise: 22 },
    { clip: 'slash_c', dur: 0.70, rate: 1.2, hit: [0.29, 0.43], dmg: 1.0, arc: 120, reach: 2.3, lunge: [0.7, 0.24, 0.40], cancel: 0.49, stop: 0.065, knock: 0.5, poise: 28 },
    { clip: 'heavy', dur: 0.93, hit: [0.26, 0.38], dmg: 1.8, arc: 140, reach: 2.6, lunge: [1.2, 0.20, 0.34], cancel: 0.56, stop: 0.09, knock: 1.6, poise: 100, stagger: true, finisher: true,
      trail: [[0.2, 0.44], [0.52, 0.78]], hit2: [0.58, 0.69], dmg2: 0.7, sec: { arc: 120, reach: 2.3, stop: 0.055, knock: 0.3, poise: 22 } },       // (the clip's rising second sweep hits again, lighter, when the finisher is not cancelled)
  ],
  skills: [
    { id: 'wave', name: 'Flame Wave', icon: 'flame', cd: 6, clip: 'slash_b', dur: 0.53, at: 0.22, lunge: [0.5, 0.04, 0.2],
      effects: [{ type: 'projectile', vis: 'crescent', speed: 15, range: 12, radius: 1.1, dmg: 2.2, pierce: true, stop: 0.07, knock: 1.0, poise: 50 }] },
    { id: 'burst', name: 'Ember Burst', icon: 'burst', cd: 14, clip: 'cast', rate: 1.2, dur: 1.08, at: 0.66,
      effects: [{ type: 'aoe', shape: 'circle', radius: 5, dmg: 3.0, stop: 0.11, knock: 3.0, poise: 200, stagger: true }] },
  ],
};
