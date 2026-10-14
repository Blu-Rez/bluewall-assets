// ============================================================================================================================================
//  RP4 KIT TEMPLATE — copy to  web/assets/rpg/combat/kit_<your sister>.js  and change the numbers.   Check it:   bash dev/rp4_kit_check.sh <sister>
//  A kit is DATA ONLY: `export default { ... }`.  No imports, no functions, no code (the loader refuses anything that is not plain JSON data).
//  Unknown fields, missing fields and out-of-range numbers are ERRORS with the field's path (kit.combo[2].hit …).  Full reference: RP4_KIT_API.md.
//  Units:  times in the combo beats / skills / block are CLIP seconds (the clip's own clock; `rate` plays it faster: real time = clip time / rate)
//          arcs are DEGREES · distances metres · dmg = multiples of ATK (100) · cd = real seconds · lunge = [metres, from s, to s] (clip time)
//  All six sister GLBs carry the same 33 clips with the same durations (RP0B).  The ones for fighting:
//     slash_a 0.43   slash_b 0.53   slash_c 0.70   heavy 0.93   block 0.84 (loop)   cast 5.38 (use dur + t0)   aim 1.50   bow 6.00 (use dur + t0)   punch_a 2.21  punch_b 2.79  kick_a 2.50  kick_b 1.38
//     dodge 1.70 · hit 1.29 · knockdown 3.00 · death 4.00 · idle / walk / run — the engine plays hit / knockdown / death / dodge itself; you only choose clips for beats, skills, block.
//  Rules that are not in the numbers:  no text but ASCII ids/names (nothing Persian, no "bot" anywhere in the hero UI) · a weapon model must be one the OWNER numbered from a sheet · ≤ 2 weapons.
// ============================================================================================================================================
export default {
  id: 'elina',                         // the file name: kit_<id>.js, one of elina elika melika mobina aylin aylar
  element: 'fire',                     // fire ice water plant stone wind  (the book's «خاک» is `stone`) — must match the sister (SISTERS table in combat.js)
  role: 'melee striker',               // free text (ASCII), for the docs / the judge page
  // weapons[]: 0..2 models parented to the hand bones.  slot 'R' = R_Hand, 'L' = L_Hand.  `url` must be a .glb under assets/rpg/combat/.  len = blade length in metres (the model is scaled to it).
  //   grip.b = direction of the blade in the hand's local space, grip.pos = offset; tip / root = where along the blade the trail's tip / root sit (0..1.3).  Numbers below fit the library sword on R_Hand.
  weapons: [{ slot: 'R', url: 'combat/sword_arming.glb', len: 0.95, grip: { b: [-0.8, 0.6, 0], pos: [0, 0.035, 0] }, tip: 0.92, root: 0.62 }],
  // trail: true = the slash ribbon follows `trailWeapon` (index into weapons) during the beats' `trail` / hit windows.  autoTurn: metres within which attack / skills turn to the nearest enemy (1..12).
  // trail: true, trailWeapon: 0, autoTurn: 3,
  hero: { hp: 600, stamina: 100, atk: 1 },        // hp 100..5000 · stamina 50..300 · regen 5..100 per s · armor 0..2 s (after she is hit, further hits inside this time + the hit stun do not interrupt her: a tank has more) · atk 0.5..3 multiplies every dmg she deals
  block: { clip: 'block', arc: 120, dr: 0.25, cost: 0.3 },   // hold the guard button: damage x dr from the front `arc` degrees; each blocked damage point costs `cost` stamina; empty = guard break.  Optional: raise 0..0.5 s, turn 1..30, walk 0..3 m/s, push 0..6, breakSt 0..100
  icons: { attack: 'sword', skill1: 'flame', skill2: 'burst', block: 'shield' },     // from: sword dagger bow hammer staff spear flame burst wave heal shield gust bolt snow leaf quake beads buff
  // ---- the basic attack chain: 1..6 beats; the player's next press inside a beat's cancel window starts the next beat; the LAST beat is the finisher (heavier, can stagger)
  combo: [
    // type 'melee' (default) | 'shot' (a projectile at hit[0], needs `shot: {speed, range, radius, pierce, vis:'bolt'|'crescent', count, spread}`; dmg / stop / knock / poise / status below apply to it)
    { clip: 'slash_a', dur: 0.43,           // clip + its length (t0 = start offset in the clip when you cut a long clip; rate = playback speed 0.5..2.5)
      hit: [0.19, 0.29],                    // the damage window (clip s): every enemy inside arc / reach is hit ONCE per window
      dmg: 0.8, arc: 110, reach: 2.1,       // x ATK · cone width in degrees (10..360) · metres from the hero's centre (0.5..8)
      lunge: [0.8, 0.08, 0.22],             // she steps forward 0.8 m between 0.08 s and 0.22 s of the clip (optional)
      cancel: 0.30,                         // from this clip time the next press chains (default ~70 % of the beat)
      stop: 0.055, knock: 0.3, poise: 22 }, // hit-stop seconds (0..0.2) · knock-back metres (0..6) · poise damage (an enemy staggers when its poise bar fills)
    { clip: 'slash_b', dur: 0.53, hit: [0.20, 0.32], dmg: 0.9, arc: 110, reach: 2.2, lunge: [0.9, 0.06, 0.24], cancel: 0.34, stop: 0.055, knock: 0.3, poise: 22 },
    { clip: 'slash_c', dur: 0.70, rate: 1.2, hit: [0.29, 0.43], dmg: 1.0, arc: 120, reach: 2.3, lunge: [0.7, 0.24, 0.40], cancel: 0.49, stop: 0.065, knock: 0.5, poise: 28 },
    { clip: 'heavy', dur: 0.93, hit: [0.26, 0.38], dmg: 1.8, arc: 140, reach: 2.6, lunge: [1.2, 0.20, 0.34], cancel: 0.56, stop: 0.09, knock: 1.6, poise: 100, stagger: true, finisher: true,
      trail: [[0.2, 0.44], [0.52, 0.78]],                                    // (optional) clip windows where the trail ribbon is drawn
      hit2: [0.58, 0.69], dmg2: 0.7, sec: { arc: 120, reach: 2.3, stop: 0.055, knock: 0.3, poise: 22 } },   // (optional) a 2nd, lighter hit window if the beat is not cancelled
    // status on a beat:  status: { id: 'burn', dur: 3, dps: 0.2 }   (see RP4_KIT_API.md §statuses)
  ],
  // ---- EXACTLY two skills (the two buttons).  at = the clip time the effects fire.  effects = 1..4 of: projectile | aoe | heal | shield | buff | stamina
  skills: [
    { id: 'wave', name: 'Flame Wave', icon: 'flame', cd: 6, clip: 'slash_b', dur: 0.53, at: 0.22, lunge: [0.5, 0.04, 0.2],
      effects: [{ type: 'projectile', vis: 'crescent', speed: 15, range: 12, radius: 1.1, dmg: 2.2, pierce: true, stop: 0.07, knock: 1.0, poise: 50 }] },
    { id: 'burst', name: 'Ember Burst', icon: 'burst', cd: 14, clip: 'cast', rate: 1.2, dur: 1.08, at: 0.66,
      effects: [{ type: 'aoe', shape: 'circle', radius: 5, dmg: 3.0, stop: 0.11, knock: 3.0, poise: 200, stagger: true }] },
    // other effects, all fields:
    //   { type: 'projectile', vis: 'bolt', speed: 18, range: 14, radius: 0.6, dmg: 1.2, count: 3, spread: 14, pierce: false, status: { id: 'slow', dur: 3, k: 0.5 } }
    //   { type: 'aoe', shape: 'cone', arc: 100, radius: 5, offset: 0, dmg: 2.4 }   (dmg 0 is allowed when there is a status or knock: a pure crowd-control ring)
    //   { type: 'heal', amount: 0.3 }  (fraction of max hp, instant)   { type: 'heal', amount: 0.2, dur: 4 }  (over time)
    //   { type: 'shield', absorb: 0.25, dur: 6 }  (absorbs this much of max hp)   { type: 'buff', stat: 'atk' | 'dr' | 'rate', mult: 1.3, dur: 8 }   { type: 'stamina', amount: 40 }
  ],
};
