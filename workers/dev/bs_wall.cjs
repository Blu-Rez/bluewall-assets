var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/unitdefs.json
var unitdefs_default = { units: { spear: { fam: "barracks", lv: 1, space: 1, hp: 120, dps: 9, rng: 0, spd: 1, cost: { ruby: 3, emerald: 1 }, t: 20, role: "infantry", size: "light", layer: "ground", prefer: "near" }, sword: { fam: "barracks", lv: 4, space: 1, hp: 135, dps: 15, rng: 0, spd: 1.05, cost: { ruby: 6, emerald: 2 }, t: 30, role: "infantry", size: "light", layer: "ground", prefer: "near" }, guard: { fam: "barracks", lv: 6, space: 2, hp: 330, dps: 12, rng: 0, spd: 0.9, cost: { ruby: 10, emerald: 6 }, t: 50, role: "tank", size: "light", layer: "ground", prefer: "defence" }, archer: { fam: "training", lv: 1, space: 1, hp: 80, dps: 11, rng: 26, spd: 1, cost: { ruby: 4, emerald: 2 }, t: 26, role: "ranged", size: "light", layer: "ground", prefer: "near" }, cavalry: { fam: "stable", lv: 7, space: 3, hp: 300, dps: 24, rng: 0, spd: 2.1, cost: { ruby: 15, emerald: 5 }, t: 90, role: "cavalry", size: "medium", layer: "ground", prefer: "raid" }, axerider: { fam: "stable", lv: 16, space: 5, hp: 780, dps: 48, rng: 0, spd: 2, cost: { ruby: 44, emerald: 22, turq: 7 }, t: 200, role: "cavalry", size: "medium", layer: "ground", prefer: "near" }, pegasus: { fam: "stable", lv: 12, space: 4, hp: 360, dps: 30, rng: 0, spd: 2.6, cost: { ruby: 20, turq: 23 }, t: 150, role: "air", air: true, size: "medium", layer: "air", prefer: "raid" }, baby: { fam: "lair", lv: 13, space: 8, hp: 900, dps: 55, rng: 18, spd: 1.8, cost: { turq: 65, ruby: 23 }, t: 420, role: "air", air: true, size: "heavy", layer: "air", prefer: "antiair" }, dragon: { fam: "lair", lv: 27, space: 24, hp: 3400, dps: 150, rng: 22, spd: 1.9, cost: { turq: 511, ruby: 180 }, t: 1500, role: "air", air: true, size: "huge", layer: "air", prefer: "antiair" }, catapult: { fam: "workshop", lv: 9, space: 6, hp: 420, dps: 70, rng: 44, spd: 0.5, cost: { ruby: 20, emerald: 14 }, t: 180, role: "siege", size: "medium", layer: "ground", prefer: "standoff" }, giant: { fam: "workshop", lv: 19, space: 12, hp: 2300, dps: 48, rng: 0, spd: 0.8, cost: { ruby: 62, turq: 21 }, t: 360, role: "giant", size: "heavy", layer: "wade", prefer: "defence" }, imp: { fam: "lair", lv: 4, space: 2, hp: 170, dps: 24, rng: 0, spd: 1.9, cost: { turq: 7, ruby: 3 }, t: 45, role: "cavalry", size: "light", layer: "ground", prefer: "raid" }, mage: { fam: "lair", lv: 7, space: 3, hp: 150, dps: 40, rng: 30, spd: 0.95, cost: { turq: 18, ruby: 8 }, t: 75, role: "ranged", size: "medium", layer: "ground", prefer: "near" }, ram: { fam: "workshop", lv: 13, space: 5, hp: 750, dps: 62, rng: 0, spd: 0.9, cost: { ruby: 20, emerald: 20 }, t: 150, role: "giant", size: "medium", layer: "ground", prefer: "gate" }, cannon: { fam: "workshop", lv: 15, space: 7, hp: 520, dps: 84, rng: 36, spd: 0.5, cost: { ruby: 37, emerald: 22 }, t: 220, role: "siege", size: "heavy", layer: "ground", prefer: "standoff" }, werewolf: { fam: "workshop", lv: 16, space: 8, hp: 1250, dps: 58, rng: 0, spd: 2.3, cost: { ruby: 41, turq: 15 }, t: 280, role: "cavalry", size: "heavy", layer: "ground", prefer: "raid" }, trebuchet: { fam: "workshop", lv: 18, space: 10, hp: 640, dps: 118, rng: 62, spd: 0.4, cost: { ruby: 58, emerald: 37 }, t: 330, role: "siege", size: "heavy", layer: "ground", prefer: "standoff" }, hill: { fam: "workshop", lv: 24, space: 16, hp: 3300, dps: 64, rng: 0, spd: 0.85, cost: { ruby: 106, turq: 37 }, t: 520, role: "giant", size: "huge", layer: "wade", prefer: "defence" }, shieldmaiden: { fam: "barracks", lv: 15, space: 6, hp: 1150, dps: 52, rng: 0, spd: 1.15, cost: { ruby: 38, emerald: 20, turq: 6 }, t: 210, role: "tank", size: "medium", layer: "ground", prefer: "defence" }, lord: { fam: "stable", lv: 20, space: 8, hp: 1500, dps: 74, rng: 0, spd: 2.3, cost: { ruby: 71, emerald: 25, turq: 17 }, t: 270, role: "cavalry", size: "heavy", layer: "ground", prefer: "raid" }, dragonling: { fam: "lair", lv: 18, space: 6, hp: 660, dps: 44, rng: 15, spd: 1.9, cost: { turq: 50, ruby: 21 }, t: 240, role: "air", air: true, size: "medium", layer: "air", prefer: "antiair" }, legionary: { fam: "barracks", lv: 2, space: 1, hp: 150, dps: 11, rng: 0, spd: 1, cost: { ruby: 5, emerald: 2 }, t: 24, role: "infantry", size: "light", layer: "ground", prefer: "near" }, captain: { fam: "barracks", lv: 7, space: 4, hp: 700, dps: 36, rng: 0, spd: 1.1, cost: { ruby: 26, emerald: 12, turq: 4 }, t: 120, role: "tank", size: "medium", layer: "ground", prefer: "near" }, ogre: { fam: "workshop", lv: 22, space: 13, hp: 2700, dps: 62, rng: 0, spd: 0.9, cost: { ruby: 100, turq: 30 }, t: 420, role: "giant", size: "huge", layer: "ground", prefer: "defence" }, gryphon: { fam: "stable", lv: 23, space: 9, hp: 1300, dps: 60, rng: 0, spd: 2.5, cost: { ruby: 48, turq: 66 }, t: 300, role: "air", air: true, size: "heavy", layer: "air", prefer: "raid" }, lich: { fam: "lair", lv: 25, space: 9, hp: 800, dps: 110, rng: 34, spd: 0.95, cost: { turq: 72, ruby: 62 }, t: 380, role: "ranged", size: "heavy", layer: "ground", prefer: "near" }, treant: { fam: "workshop", lv: 26, space: 15, hp: 4e3, dps: 55, rng: 0, spd: 0.8, cost: { ruby: 80, emerald: 60, turq: 22 }, t: 520, role: "giant", size: "huge", layer: "ground", prefer: "defence" }, gryphonknight: { fam: "stable", lv: 25, space: 10, hp: 1900, dps: 100, rng: 0, spd: 2.4, cost: { ruby: 78, emerald: 22, turq: 32 }, t: 330, role: "air", air: true, size: "heavy", layer: "air", prefer: "raid" }, darkrider: { fam: "lair", lv: 28, space: 20, hp: 4200, dps: 190, rng: 24, spd: 1.9, cost: { turq: 300, ruby: 150 }, t: 900, role: "air", air: true, size: "huge", layer: "air", prefer: "antiair" }, baby3: { fam: "lair", lv: 29, space: 20, hp: 3e3, dps: 140, rng: 20, spd: 1.8, cost: { turq: 480, ruby: 200 }, t: 1100, role: "air", air: true, size: "huge", layer: "air", prefer: "antiair" }, dragon3: { fam: "lair", lv: 30, space: 48, hp: 8e3, dps: 360, rng: 24, spd: 1.8, cost: { turq: 1300, ruby: 450 }, t: 3200, role: "air", air: true, size: "huge", layer: "air", prefer: "antiair" } }, order: ["spear", "sword", "guard", "archer", "cavalry", "axerider", "pegasus", "baby", "dragon", "catapult", "giant", "imp", "mage", "ram", "cannon", "werewolf", "trebuchet", "hill", "shieldmaiden", "lord", "dragonling", "legionary", "captain", "ogre", "gryphon", "lich", "treant", "gryphonknight", "darkrider", "baby3", "dragon3"], families: ["barracks", "training", "stable", "lair", "workshop"], spells: { lightning: { lv: 1, space: 1, cost: { turq: 8, ruby: 4 }, t: 40 }, heal: { lv: 2, space: 1, cost: { turq: 8, emerald: 4 }, t: 45 }, freeze: { lv: 4, space: 1, cost: { turq: 12 }, t: 60 }, rage: { lv: 6, space: 2, cost: { turq: 16, ruby: 8 }, t: 90 }, quake: { lv: 9, space: 2, cost: { turq: 20, ruby: 10 }, t: 120 } }, spell_order: ["lightning", "heal", "freeze", "rage", "quake"], emblems: ["swords", "wings", "dragon", "axes", "heart", "crown", "tower", "wolf", "eagle", "lion", "bear", "serpent", "flame", "star", "moon", "sun", "bolt", "pine", "anchor", "arrows", "stag", "frost", "helm", "gem"], spell_cap: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32], max_level: 30, army_cap: [60, 88, 116, 144, 172, 200, 228, 256, 284, 312, 340, 368, 396, 424, 452, 480, 508, 536, 564, 592, 620, 648, 676, 704, 732, 760, 788, 816, 844, 872], fam_cap: { barracks: [28, 42, 56, 70, 84, 98, 112, 126, 140, 154, 168, 182, 196, 210, 224, 238, 252, 266, 280, 294, 308, 322, 336, 350, 364, 378, 392, 406, 420, 434], training: [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310], stable: [16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160, 168, 176, 184, 192, 200, 208, 216, 224, 232, 240, 248], lair: [24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180, 192, 204, 216, 228, 240, 252, 264, 276, 288, 300, 312, 324, 336, 348, 360, 372], workshop: [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310] }, speed: [1, 1.08, 1.16, 1.24, 1.32, 1.4, 1.48, 1.56, 1.64, 1.72, 1.8, 1.88, 1.96, 2.04, 2.12, 2.2, 2.28, 2.36, 2.44, 2.52, 2.6, 2.68, 2.76, 2.84, 2.92, 3, 3.08, 3.16, 3.24, 3.32], forge_mult: [1, 1.06, 1.12, 1.18, 1.24, 1.3, 1.36, 1.42, 1.48, 1.54, 1.6, 1.66, 1.72, 1.78, 1.84, 1.9, 1.96, 2.02, 2.08, 2.14, 2.2, 2.26, 2.32, 2.38, 2.44, 2.5, 2.56, 2.62, 2.68, 2.74], lvl_step: 0.035, tier_at: [1, 6, 12, 18, 24, 30], perks: { "2": "armor", "3": "swift", "4": "fury", "5": "laststand" }, heroes: { captain: [7, 26, 30], shieldmaiden: [15, 26, 30], lord: [20, 26, 30], gryphonknight: [25, 26, 30], darkrider: [28, 29, 30] }, defences: { tower: { hits: "both", w: 1, rng: 34, cd: 0.9, splash: 0, minr: 0, pick: "near", mult: { light: 1.5, medium: 1, heavy: 0.6, air: 1 }, unlock: 1, n: [3, 11, 15] }, cannon: { hits: "ground", w: 2.2, rng: 40, cd: 3, splash: 3.5, minr: 7, pick: "dense", mult: { light: 1.8, medium: 1, heavy: 0.35, air: 0 }, unlock: 4, n: [1, 3, 13] }, wizard: { hits: "both", w: 1.8, rng: 36, cd: 1.4, splash: 2, minr: 0, pick: "dense", mult: { light: 1.3, medium: 1.2, heavy: 0.7, air: 1 }, unlock: 7, n: [1, 4, 21] }, ballista: { hits: "both", w: 2.2, rng: 46, cd: 2.6, splash: 0, minr: 0, pick: "air", mult: { light: 0.35, medium: 1, heavy: 2.6, air: 2.2 }, unlock: 12, n: [2, 6, 22] }, quad: { hits: "ground", w: 2.4, rng: 34, cd: 1.3, splash: 1.1, minr: 0, pick: "near", mult: { light: 1.1, medium: 1.3, heavy: 0.8, air: 0 }, unlock: 15, n: [1, 3, 25], volley: 4 }, keep: { hits: "both", w: 1.2, rng: 40, cd: 1.6, splash: 0, minr: 0, pick: "near", mult: { light: 1, medium: 1, heavy: 1, air: 1 }, unlock: 1 }, frost: { hits: "both", w: 1.5, rng: 38, cd: 2.2, splash: 5, minr: 0, pick: "dense", mult: { light: 1, medium: 1, heavy: 1, air: 0.6 }, unlock: 18, n: [1, 3, 30], slow: 0.5, slow_t: 3.5 }, flame: { hits: "ground", w: 2.6, rng: 22, cd: 1.1, splash: 2.6, minr: 0, pick: "near", mult: { light: 2, medium: 1.4, heavy: 0.7, air: 0 }, unlock: 22, n: [1, 3, 30] }, dragonbane: { hits: "both", w: 3, rng: 58, cd: 3.4, splash: 0, minr: 0, pick: "air", mult: { light: 0.25, medium: 0.8, heavy: 1.6, air: 3.2 }, unlock: 23, n: [1, 3, 30] }, tesla: { hits: "both", w: 2, rng: 32, cd: 1.5, splash: 0, minr: 0, pick: "near", mult: { light: 1.3, medium: 1, heavy: 0.8, air: 1 }, chain: 3 } }, garrison_at: [[1, 20], [7, 70], [15, 150], [22, 230], [30, 300]], garrison_mix: { guard: 0.55, archer: 0.25, heavy: 0.1, reserve: 0.1 }, defence_pairs: [[1, "tower", ["spear", "archer"]], [4, "cannon", ["sword", "imp"]], [7, "wizard", ["mage", "cavalry"]], [12, "ballista", ["pegasus"]], [15, "quad", ["cannon"]], [18, "frost", ["dragonling", "trebuchet"]], [19, "giant", ["giant"]], [22, "flame", ["ogre"]], [23, "dragonbane", ["gryphon"]], [24, "baby", ["hill"]], [24, "hill", ["hill"]], [27, "dragon", ["dragon"]]], guardians: { giant: { unlock: 19, n: [2, 4] }, baby: { unlock: 24, n: [2, 4] }, hill: { unlock: 24, n: [2, 2] }, dragon: { unlock: 27, n: [2, 2] } }, bot_ratio: [0.9, 1.5] };

// src/armyplan.js
var tierOf = (t) => {
  const d = unitdefs_default.units[t];
  if (!d) return 9;
  if (unitdefs_default.heroes && unitdefs_default.heroes[t]) return 0;
  if (d.role === "siege") return 5;
  if (d.role === "ranged") return 4;
  return d.lv >= 15 ? 1 : d.lv >= 6 ? 2 : 3;
};
var rankOf = (t) => {
  const d = unitdefs_default.units[t];
  if (!d) return -99;
  return unitdefs_default.heroes && unitdefs_default.heroes[t] ? 100 + d.lv : d.lv;
};
var MAX_WIDTH = 200;
var RING_GAP = 1.4;
var FRONTK = 0.3;
var ASPECT = 2.1;
var PLAIN = [[0, -92, 84], [60, -92, 78], [80, -92, 60], [100, -88, 30], [112, -76, 14], [130, -60, 0]];
var plainAt = (b) => {
  for (let i = 1; i < PLAIN.length; i++) if (b <= PLAIN[i][0]) {
    const [b0, l0, r0] = PLAIN[i - 1], [b1, l1, r1] = PLAIN[i], t = (b - b0) / (b1 - b0);
    return [l0 + (l1 - l0) * t, r0 + (r1 - r0) * t];
  }
  const q = PLAIN[PLAIN.length - 1];
  return [q[1], q[2]];
};
var plainOver = (b0, b1) => {
  let l = -1e9, r = 1e9;
  for (let k = 0; k <= 4; k++) {
    const [a, c] = plainAt(b0 + (b1 - b0) * k / 4);
    l = Math.max(l, a);
    r = Math.min(r, c);
  }
  return [l, r];
};
var ringMargin = (rb, u = 1) => 0.5 * rb + 1.2 * u;
function compactBlock(n2, sp, margin, rmin) {
  let bestR = 1, bestS = 1e9;
  for (let r = 1; r <= n2; r++) {
    const c = Math.ceil(n2 / r), s = Math.hypot((c - 1) / 2 * sp, (r - 1) / 2 * sp * 0.92 * 1.15);
    if (s < bestS - 1e-9) {
      bestS = s;
      bestR = r;
    }
  }
  const rows = bestR, rel = [];
  for (let rr = 0; rr < rows; rr++) {
    const cnt = Math.floor(n2 * (rr + 1) / rows) - Math.floor(n2 * rr / rows);
    rel.push(cnt);
  }
  rel.sort((a, b) => b - a);
  const pts = [];
  rel.forEach((cnt, rr) => {
    for (let c = 0; c < cnt; c++) pts.push([(c - (cnt - 1) / 2) * sp, rr * sp * 0.92]);
  });
  let cx = 0, cb = 0;
  for (const p of pts) {
    cx += p[0];
    cb += p[1];
  }
  cx /= n2;
  cb /= n2;
  let far = 0;
  for (const p of pts) {
    p[0] -= cx;
    p[1] -= cb;
    far = Math.max(far, Math.hypot(p[0], p[1]));
  }
  return { pts, rows, cols: rel[0], R: Math.max(rmin, far + margin) };
}
var toFrame = (solids, dp) => {
  const tx = -dp.nz, tz = dp.nx;
  return (solids || []).map(([x, z, r]) => [(x - dp.x) * tx + (z - dp.z) * tz, (x - dp.x) * dp.nx + (z - dp.z) * dp.nz, r]);
};
var OBST_CLEAR = 3.5;
function planArmy(army, UR = 1, deployed = true, obstacles = []) {
  const types = unitdefs_default.order.filter((u2) => army[u2] > 0).sort((a, b) => tierOf(a) - tierOf(b) || rankOf(b) - rankOf(a) || unitdefs_default.order.indexOf(a) - unitdefs_default.order.indexOf(b));
  const u = UR / 2, K = deployed ? 1 : 0.5, GAPR = RING_GAP * u, RMIN = 4.5 * u;
  const items = types.map((type) => {
    const d = unitdefs_default.units[type], n2 = army[type], sp = (d.space >= 8 ? 6.5 : d.space >= 3 ? 3.3 : 2.4) * UR / 1.5, rb = (d.space >= 8 ? 2.4 : d.space >= 3 ? 1.1 : 0.75) * UR, cb = compactBlock(n2, sp, ringMargin(rb, u), RMIN), tier2 = tierOf(type);
    return { type, d, n: n2, sp, tier: tier2, g: tier2 <= 1 ? 0 : tier2 <= 3 ? 1 : 2, ...cb, w: 2 * cb.R, depth: 2 * cb.R };
  });
  const order = items.slice().sort((a, b) => a.g - b.g || (a.tier === 0 ? 0 : 1) - (b.tier === 0 ? 0 : 1) || b.R - a.R || items.indexOf(a) - items.indexOf(b));
  const layout = (Wc) => {
    const placed = [], side = [0, 0];
    for (const it of order) {
      let floor = 0;
      for (const p of placed) if (p.it.g < it.g) floor = Math.max(floor, p.b + FRONTK * p.it.R + it.R);
      const R = it.R;
      let best2 = null;
      const scan = (b, l02, l12, st) => {
        const [pl, pr] = deployed ? plainOver(b - R, b + R) : [-1e9, 1e9], lo = Math.max(l02, Math.max(pl, -Wc / 2) + R), hi = Math.min(l12, Math.min(pr, Wc / 2) - R);
        for (let l = lo; l <= hi + 1e-9; l += st) {
          let ok = true;
          for (let k = 0; k < placed.length; k++) {
            const p = placed[k], dx = p.l - l, dz = p.b - b, m = p.it.R + R + GAPR - 1e-6;
            if (dx * dx + dz * dz < m * m) {
              ok = false;
              break;
            }
          }
          if (ok) for (let k = 0; k < obstacles.length; k++) {
            const o = obstacles[k], dx = o[0] - l, dz = o[1] - b, m = o[2] + R + OBST_CLEAR;
            if (dx * dx + dz * dz < m * m) {
              ok = false;
              break;
            }
          }
          if (!ok) continue;
          const c = b + 0.1 * Math.abs(l) + 4e-5 * side[l < 0 ? 0 : 1];
          if (!best2 || c < best2.c - 1e-9) best2 = { l, b, c };
        }
      };
      for (let b = Math.max(R, floor); b < floor + R + 220; b += 1) {
        if (best2 && b > best2.c) break;
        scan(b, -1e9, 1e9, 2);
      }
      if (best2) {
        const c0 = best2;
        for (let b = Math.max(R, floor, c0.b - 1.5); b <= c0.b + 1.5; b += 0.5) scan(b, c0.l - 2, c0.l + 2, 0.5);
      }
      if (!best2) best2 = { l: 0, b: floor + R + 220, c: 0 };
      placed.push({ it, l: best2.l, b: best2.b });
      side[best2.l < 0 ? 0 : 1] += R * R;
    }
    let D = 0, l0 = 1e9, l1 = -1e9;
    for (const p of placed) {
      D = Math.max(D, p.b + p.it.R);
      l0 = Math.min(l0, p.l - p.it.R);
      l1 = Math.max(l1, p.l + p.it.R);
    }
    return { placed, D, Wa: l1 - l0 };
  };
  const minW = items.length ? Math.max(...items.map((it) => it.w)) : 0, maxW = Math.max(minW, K * Math.min(MAX_WIDTH, plainAt(0)[1] - plainAt(0)[0]));
  let best = null;
  if (items.length) for (let Wc = minW; ; Wc += 6) {
    const Wcc = Math.min(Wc, maxW), L = layout(Wcc), score = L.Wa / Math.max(1, L.D);
    if (!best || score > best.score + 1e-9) best = { L, score, Wc: Wcc };
    if (score >= ASPECT || Wcc >= maxW) break;
  }
  if (best && deployed) {
    let l0 = 1e9, l1 = -1e9;
    for (const p of best.L.placed) {
      l0 = Math.min(l0, p.l - p.it.R);
      l1 = Math.max(l1, p.l + p.it.R);
    }
    let sh = -(l0 + l1) / 2;
    const okAt = (d) => best.L.placed.every((p) => {
      const [pl, pr] = plainOver(p.b - p.it.R, p.b + p.it.R);
      return p.l + d - p.it.R >= pl - 1e-6 && p.l + d + p.it.R <= pr + 1e-6 && obstacles.every((o) => Math.hypot(o[0] - p.l - d, o[1] - p.b) >= o[2] + p.it.R + OBST_CLEAR - 1e-6);
    });
    for (let k = 0; k < 12 && !okAt(sh); k++) sh *= 0.8;
    if (okAt(sh)) for (const p of best.L.placed) p.l += sh;
  }
  const blocks = [], pos = {}, rings = {}, groups = [[], [], []];
  let back1 = 0, lat0m = 1e9, lat1m = -1e9;
  if (best) for (const p of best.L.placed) {
    const b = p.it;
    pos[b.type] = b.pts.map((q) => {
      const l = p.l + q[0], bk = p.b + q[1];
      lat0m = Math.min(lat0m, l);
      lat1m = Math.max(lat1m, l);
      back1 = Math.max(back1, bk);
      return [l, bk];
    });
    rings[b.type] = { l: p.l, b: p.b, r: b.R };
    blocks.push(b);
    groups[b.g].push(b);
  }
  if (!types.length) {
    lat0m = lat1m = 0;
  }
  const shelves = groups.map((bl, g) => ({ tier: g, blocks: bl, w: 0, depth: 0 })).filter((s) => s.blocks.length);
  return { types, blocks, shelves, pos, rings, back1, lat0: lat0m, lat1: lat1m, width: best ? best.L.Wa : 0, depth: best ? best.L.D : 0 };
}

// src/battlesim.js
var hyp = (x, z) => Math.sqrt(x * x + z * z);
var MAXL = unitdefs_default.max_level || 20;
function mulberry(a) {
  return () => {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var FIELD = { x0: -95, x1: 95, z0: -120, z1: 100, line: 62 };
var GIANT_SWING = { iv: 1.8, hit: 0.84, contact: 0.86, clip: "attack1", reach: 3 };
var HIT_T = { melee: 0.25, cavalry: 0.32, lord: 0.32, axerider: 0.36, arrow: 0.25, orb: 0.3 };
var hitTOf = (type) => type === "giant" ? GIANT_SWING.hit : type === "mage" || type === "lich" ? HIT_T.orb : HIT_T[type] ?? HIT_T.melee;
var TUNE = { splashK: 0.3, w_tower: 1, w_cannon: 1, w_keep: 1, w_tesla: 1, defHP: 3, brD: 4, brB: 2.5, brL: 2, nb: 0.2, gfrac: 0.12, gleash: 42, ringValue: 0.35, star3: 100, hp: 12, dps: 0.18, tower: 0.55, w_ballista: 4.2, m_ballista_air: 6.5, m_ballista_heavy: 3.2, m_ballista_light: 0.35, m_cannon_light: 1.8, m_cannon_heavy: 0.35, bm_siege: 1, bm_giant: 1, bm_air: 0.6, bm_infantry: 0.55, bm_cavalry: 0.5, bm_ranged: 0.55, bm_tank: 0.5, us: 2, ur: 2, sp: 2.9, leash: 18, prefer: 1, hunt: 40, hall: 0, gsiege: 25, cbat: 0, gsl: 1, grng: 1, cb: 0, bms: 1.2, srng: 0.85, rdps: 1, rhp: 1, rsp: 1, hpw_ballista: 2, hpw_wizard: 1.5, hpw_tesla: 1, m_wizard_air: 1.8, w_wizard: 0.65, w_frost: 1, w_flame: 1, treantRegen: 0.012, w_dragonbane: 4.2, hpw_dragonbane: 2, m_dragonbane_air: 9.5, m_dragonbane_heavy: 4.7 };
var SIEGE = { catapult: { fl: 0.9, sp: 4.2, iv: 2.6, kind: "rock", h: 4 }, cannon: { fl: 0.55, sp: 2.9, iv: 1.9, kind: "ball", h: 2.6 }, trebuchet: { fl: 1.45, sp: 6.4, iv: 3.6, kind: "rock", h: 7, big: true } };
var BM = { infantry: 0.45, tank: 0.4, ranged: 0.5, cavalry: 0.45, air: 0.8, siege: 2, giant: 1.8 };
var DEFN = unitdefs_default.defences || {};
var sizeClass = (u) => u.air ? "air" : u.size === "light" ? "light" : u.size === "medium" ? "medium" : "heavy";
var BUILD_TYPES = {
  // type: [share of the HP budget (relative), w, d, h, defence?]
  keep: [14, 13, 13, 22],
  tower: [6, 5, 5, 15],
  ballista: [7, 6, 6, 13],
  vault: [5, 8, 8, 9],
  mine: [3, 7, 7, 8],
  barracks: [5, 10, 8, 7],
  house: [0.8, 6, 5, 6],
  store: [3, 8, 6, 6],
  forge: [3, 7, 6, 6],
  wall: [1.4, 1, 2.6, 8.5],
  gate: [3.2, 9, 3.4, 11],
  // the real map (targets registered by the world builders): training ground, stable, siege workshop, dragon lair
  training: [4, 30, 28, 8],
  stable: [4, 30, 24, 10],
  workshop: [4, 30, 24, 10],
  lair: [5, 26, 26, 12],
  church: [2.4, 13, 24, 26]
};
function makeBase(spec) {
  const R = mulberry(spec.seed | 0), L = Math.max(1, Math.min(MAXL, spec.levels.keep | 0)), D = Math.max(40, spec.power || 100);
  const B = [], defenders = [];
  let id = 1;
  const add = (type, x, z, rot, extra = {}) => {
    const t = BUILD_TYPES[type];
    const b = { id: id++, type, x, z, rot, w: extra.w ?? t[1], d: extra.d ?? t[2], h: extra.h ?? t[3], share: t[0], hp: 0, maxHp: 0, dead: false, collapse: 0, ...extra };
    B.push(b);
    return b;
  };
  const n2 = 10 + Math.floor(L / 5), Rr = 30 + L * 0.55, verts = [];
  for (let i = 0; i < n2; i++) {
    const a = Math.PI / 2 + i / n2 * Math.PI * 2 + (R() - 0.5) * 0.12, r = Rr * (0.93 + R() * 0.14);
    verts.push([Math.cos(a) * r, Math.sin(a) * r * 0.86 - 4]);
  }
  const gateEdge = 0;
  verts.sort((p, q) => Math.atan2(p[1] + 4, p[0]) - Math.atan2(q[1] + 4, q[0]));
  let gi = 0, best = -1e9;
  for (let i = 0; i < n2; i++) {
    const a = verts[i], b2 = verts[(i + 1) % n2], zc = (a[1] + b2[1]) / 2;
    if (zc > best) {
      best = zc;
      gi = i;
    }
  }
  const walls = [];
  for (let i = 0; i < n2; i++) {
    const a = verts[i], b2 = verts[(i + 1) % n2], len = hyp(b2[0] - a[0], b2[1] - a[1]), rot = Math.atan2(-(b2[1] - a[1]), b2[0] - a[0]);
    const isGate = i === gi;
    const w = add(isGate ? "gate" : "wall", (a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2, rot, { w: len, a, b: b2, ring: true });
    walls.push(w);
  }
  verts.forEach(([x, z], i) => {
    if (i % 2 === 0 || L >= 10) add(L >= 6 && i % 4 === 0 ? "ballista" : "tower", x * 0.985, z * 0.985, 0, { def: true });
  });
  const keep = add("keep", 0, -14, 0.2, { def: true, keep: true });
  [[-15, -6], [15, -6], [0, -28]].forEach(([x, z], k) => add("vault", x, z, 0.1 * k, { gem: ["ruby", "emerald", "turq"][k] }));
  [[-22, -20], [22, -20], [0, -2]].forEach(([x, z], k) => add("mine", x, z, 0.3 * k, { gem: ["ruby", "emerald", "turq"][k] }));
  const spots = [];
  const free = (x, z, r) => B.every((b) => b.ring || hyp(b.x - x, b.z - z) > r + Math.max(b.w, b.d) * 0.55);
  const inside2 = (x, z) => hyp(x / (Rr * 0.82), (z + 4) / (Rr * 0.7)) < 1;
  const fill = [["barracks", 1 + (L >= 8 ? 1 : 0) + (L >= 15 ? 1 : 0)], ["forge", L >= 6 ? 1 : 0], ["store", 1 + (L >= 10 ? 1 : 0)], ["house", 4 + Math.floor(L / 3)]];
  for (const [type, cnt] of fill) for (let k = 0, tries = 0; k < cnt && tries < 300; tries++) {
    const x = (R() - 0.5) * Rr * 1.6, z = -4 + (R() - 0.5) * Rr * 1.3;
    if (inside2(x, z) && free(x, z, 6)) {
      add(type, x, z, R() * 6.28 - 3.14, {});
      k++;
    }
  }
  const sum = B.reduce((s, b) => s + b.share, 0), HP2 = TUNE.hp * D * (0.9 + 0.2 * (L / MAXL));
  for (const b of B) {
    b.maxHp = b.hp = Math.round(HP2 * b.share / sum);
    b.value = b.ring ? b.share * TUNE.ringValue : b.share;
    if (b.type === "wall") b.maxHp = b.hp = Math.round(b.maxHp * (0.8 + b.w / 30));
  }
  const dps = TUNE.dps * D, towers = B.filter((b) => b.type === "tower" || b.type === "ballista" || b.type === "keep"), tw = towers.reduce((s, b) => s + (b.type === "keep" ? 1.2 : b.type === "ballista" ? 2.2 : 1), 0);
  for (const b of towers) {
    const k = (b.type === "keep" ? 1.2 : b.type === "ballista" ? 2.2 : 1) / tw, mine = TUNE.tower * dps * k;
    if (b.type === "ballista") Object.assign(b, { rng: 46, cd: 2.6, dmg: mine * 2.6, splash: 2.4, air: true, ground: true, kind: "bolt", flight: 0.5 });
    else if (b.type === "keep") Object.assign(b, { rng: 40, cd: 1.6, dmg: mine * 1.6, splash: 0, air: true, ground: true, kind: "arrow", flight: 0.5 });
    else Object.assign(b, { rng: 34, cd: 0.9, dmg: mine * 0.9, splash: 0, air: true, ground: true, kind: "arrow", flight: 0.4 });
    b.t = R();
  }
  const nGuards = Math.max(2, Math.min(40, Math.round((1 - TUNE.tower) * dps / 12)));
  const gdps = (1 - TUNE.tower) * dps / nGuards;
  for (let i = 0; i < nGuards; i++) {
    const a = R() * 6.28, r = 4 + R() * Rr * 0.5, x = Math.cos(a) * r, z = -6 + Math.sin(a) * r * 0.8;
    defenders.push({ side: "D", type: i % 4 === 3 ? "archer" : "guard", x, z, hx: x, hz: z, hp: 160 * (1 + L / MAXL), maxHp: 160 * (1 + L / MAXL), dps: gdps, rng: i % 4 === 3 ? 24 : 0, spd: 1, r: 0.8, air: false, role: i % 4 === 3 ? "ranged" : "infantry", cd: 0 });
  }
  const total = B.reduce((s, b) => s + b.value, 0);
  return { buildings: B, defenders, ring: walls, verts, gateIndex: gi, radius: Rr, totalShare: total, level: L };
}
function teslaSpots(T, meta, n2) {
  n2 = Math.max(0, Math.min(4, n2 | 0));
  if (!n2 || !meta || !meta.gates || !meta.gates.length) return [];
  const g = meta.gates[0];
  return T.filter((t) => t.type === "ballista").map((t) => [t.id, hyp(t.x - g.x, t.z - g.z)]).sort((a, b) => a[1] - b[1]).slice(0, n2).map((a) => a[0]);
}
var UNIT_TIER_AT = unitdefs_default.tier_at || [1, 6, 12, 18, 24, 30];
var unitTier = (L) => {
  let t = 0;
  for (let i = 0; i < UNIT_TIER_AT.length; i++) if (L >= UNIT_TIER_AT[i]) t = i;
  return t;
};
var lvlMult = (L) => 1 + (unitdefs_default.lvl_step || 0.035) * (Math.max(1, Math.min(MAXL, L | 0)) - 1);
var HEROES = { captain: { name: "Banner", cd: 24, dur: 8 }, shieldmaiden: { name: "Shield Wall", cd: 24, dur: 6 }, lord: { name: "Rally Charge", cd: 28, dur: 8 }, gryphonknight: { name: "Dive Strike", cd: 22, dur: 1 }, darkrider: { name: "Shadow Breath", cd: 30, dur: 6 } };
var BIGS = /* @__PURE__ */ new Set(["giant", "hill", "ogre", "treant"]);
var PROFILES = {
  balanced: {},
  aa: { cannon: 0, quad: 0, flame: 0, w: { ballista: 1.5, dragonbane: 1.5 } },
  // anti-air heavy: ballistas + wizards + arrows, no ground guns
  art: { ballista: 0.34, wizard: 0.34, dragonbane: 0.34, w: { cannon: 1.6, quad: 1.4, flame: 1.4 } },
  // artillery heavy: cannons + the quad guns
  arrows: { ballista: 0, cannon: 0, quad: 0, wizard: 0, frost: 0, flame: 0, dragonbane: 0 }
  // only the arrow towers
};
var PROFILE_ORDER = ["balanced", "aa", "art", "arrows", "balanced"];
var profileOf = (spec) => spec.profile && PROFILES[spec.profile] ? spec.profile : PROFILE_ORDER[((spec.seed | 0) * 2654435761 >>> 0) % PROFILE_ORDER.length];
var guardianSlots = (L) => {
  const o = {};
  for (const [k, g] of Object.entries(unitdefs_default.guardians || {})) if (L >= g.unlock) o[k] = Math.floor(g.n[0] + (g.n[1] - g.n[0]) * (L - g.unlock) / Math.max(1, MAXL - g.unlock) + 1e-9);
  return o;
};
var gPow = (g) => Object.entries(g).reduce((q, [k, n2]) => q + n2 * Math.sqrt(unitdefs_default.units[k].hp * unitdefs_default.units[k].dps) / 3, 0);
var guardianFrac = (g) => {
  const full = gPow(guardianSlots(MAXL));
  return full > 0 ? Math.min(1, gPow(g) / full) * TUNE.gfrac : 0;
};
function makeBaseFromTargets(spec, T, meta) {
  const R = mulberry(spec.seed | 0), L = Math.max(1, Math.min(MAXL, spec.levels.keep | 0)), D0 = Math.max(40, spec.power || 100), US = TUNE.us, UR = TUNE.ur;
  const guard = (() => {
    const o = {}, src = spec.guard && typeof spec.guard === "object" ? spec.guard : guardianSlots(L);
    for (const [k, n2] of Object.entries(src)) if (unitdefs_default.guardians && unitdefs_default.guardians[k] && n2 > 0) o[k] = Math.min(8, n2 | 0);
    return o;
  })();
  const gFrac = guardianFrac(guard), D = D0 * (1 - gFrac);
  const B = T.map((t) => {
    const bt = BUILD_TYPES[t.type] || BUILD_TYPES.house;
    return { ...t, share: t.share ?? bt[0], hp: 0, maxHp: 0, dead: false, collapse: 0, ring: t.type === "wall" || t.type === "gate" };
  });
  const tesla = new Set(teslaSpots(B, meta, spec.tesla));
  for (const b of B) if (tesla.has(b.id)) b.tesla = true;
  {
    const cnt = {};
    for (const b of B) if (b.type === "ballista" && !b.wk) {
      const r = b.ringId || "";
      b.wk = (cnt[r] = (cnt[r] || 0) + 1) % 2 === 1 ? "ballista" : "cannon";
    }
  }
  const profName = profileOf(spec), PRO = PROFILES[profName], profW = PRO.w || {}, RP = mulberry((spec.seed | 0) ^ 1374496523), gm = meta.gates[0];
  const siteKind = (b) => b.tesla ? null : b.type === "ballista" ? b.wk === "cannon" || b.wk === "quad" || b.wk === "dragonbane" ? b.wk : "ballista" : b.type === "tower" && b.def ? b.wk === "wizard" || b.wk === "frost" || b.wk === "flame" ? b.wk : "tower" : null;
  const slotsOf = (k) => {
    const F = DEFN[k];
    if (!F || !F.n) return 1e9;
    if (L < F.unlock) return 0;
    const [lo, hi, full] = F.n;
    return Math.round(lo + (hi - lo) * Math.min(1, (L - F.unlock) / Math.max(1, full - F.unlock)));
  };
  const UPG = { frost: 1, flame: 1, dragonbane: 1 };
  for (const k of ["frost", "flame", "dragonbane", "tower", "cannon", "wizard", "ballista", "quad"]) {
    const sites = B.filter((b) => siteKind(b) === k).sort((a, c) => hyp(a.x - gm.x, a.z - gm.z) - hyp(c.x - gm.x, c.z - gm.z) || a.id - c.id);
    const manned = Math.min(sites.length, slotsOf(k)), keepN = Math.round(manned * (PRO[k] ?? 1)), ms = sites.slice(0, manned);
    for (let i = ms.length - 1; i > 0; i--) {
      const j = Math.floor(RP() * (i + 1));
      const t = ms[i];
      ms[i] = ms[j];
      ms[j] = t;
    }
    sites.forEach((b) => {
      b.sk = k;
    });
    ms.forEach((b, i) => {
      if (i >= keepN) {
        if (UPG[k]) {
          b.wk = null;
          b.off = true;
          b.why = "profile";
        } else {
          b.def = false;
          b.off = true;
          b.why = "profile";
        }
      }
    });
    sites.slice(manned).forEach((b) => {
      if (UPG[k]) {
        b.wk = null;
        b.off = true;
        b.why = "level";
      } else {
        b.def = false;
        b.off = true;
        b.why = "level";
      }
    });
  }
  const dkOf = (b) => b.tesla ? "tesla" : b.type === "keep" ? "keep" : b.sk || (b.type === "ballista" ? "ballista" : "tower");
  for (const b of B) if (b.def) b.dk = dkOf(b);
  const hs = (b) => b.share * (b.def ? TUNE.defHP * (TUNE["hpw_" + b.dk] ?? 1) : 1), sum = B.reduce((s, b) => s + hs(b), 0), HP2 = TUNE.hp * D * (0.9 + 0.2 * (L / MAXL));
  for (const b of B) {
    b.maxHp = b.hp = Math.round(HP2 * hs(b) / sum);
    b.value = b.ring ? b.share * TUNE.ringValue : b.share;
    if (b.type === "wall") b.maxHp = b.hp = Math.round(b.maxHp * (0.8 + b.w / 30));
  }
  const wOf = (b) => (DEFN[b.dk] ? DEFN[b.dk].w : b.tesla ? 2 : b.type === "keep" ? 1.2 : b.type === "ballista" ? 2.2 : 1) * (TUNE["w_" + b.dk] ?? 1) * (profW[b.dk] ?? 1);
  const dps = TUNE.dps * D, defs = B.filter((b) => b.def), tw = defs.reduce((s, b) => s + wOf(b), 0);
  for (const b of defs) {
    const k = wOf(b) / tw, mine = TUNE.tower * dps * k, F = DEFN[b.dk] || {};
    if (b.tesla) Object.assign(b, { rng: 32 * US, cd: 1.5, dmg: mine * 1.5 / 1.96, splash: 0, air: true, ground: true, kind: "zap", flight: 0, chain: 3, hop: 9 * UR });
    else if (b.dk === "cannon") Object.assign(b, { rng: (F.rng || 40) * US, cd: F.cd || 3, dmg: mine * (F.cd || 3), splash: (F.splash || 3.5) * UR, minr: (F.minr || 7) * UR, air: false, ground: true, kind: "bolt", flight: 0.8 });
    else if (b.dk === "ballista") Object.assign(b, { rng: (F.rng || 46) * US, cd: F.cd || 2.6, dmg: mine * (F.cd || 2.6), splash: 0, air: true, ground: true, kind: "bolt", flight: 0.6 });
    else if (b.dk === "wizard") Object.assign(b, { rng: (F.rng || 36) * US, cd: F.cd || 1.4, dmg: mine * (F.cd || 1.4), splash: (F.splash || 2) * UR, minr: 0, air: true, ground: true, kind: "orb", flight: 0.5 });
    else if (b.dk === "quad") Object.assign(b, { rng: (F.rng || 34) * US, cd: F.cd || 1.3, dmg: mine * (F.cd || 1.3), splash: (F.splash || 1.1) * UR, minr: 0, air: false, ground: true, kind: "bolt", flight: 0.45, volley: F.volley || 4 });
    else if (b.dk === "frost") Object.assign(b, { rng: (F.rng || 38) * US, cd: F.cd || 2.2, dmg: mine * (F.cd || 2.2), splash: (F.splash || 5) * UR, minr: 0, air: true, ground: true, kind: "frost", flight: 0.55, slow: F.slow ?? 0.5, slowT: F.slow_t ?? 3.5 });
    else if (b.dk === "flame") Object.assign(b, { rng: (F.rng || 22) * US, cd: F.cd || 1.1, dmg: mine * (F.cd || 1.1), splash: (F.splash || 2.6) * UR, minr: 0, air: false, ground: true, kind: "flame", flight: 0.3 });
    else if (b.dk === "dragonbane") Object.assign(b, { rng: (F.rng || 58) * US, cd: F.cd || 3.4, dmg: mine * (F.cd || 3.4), splash: 0, air: true, ground: true, kind: "bolt", flight: 0.7 });
    else if (b.type === "keep") Object.assign(b, { rng: 40 * US, cd: 1.6, dmg: mine * 1.6, splash: 0, air: true, ground: true, kind: "arrow", flight: 0.6 });
    else Object.assign(b, { rng: 34 * US, cd: 0.9, dmg: mine * 0.9, splash: 0, air: true, ground: true, kind: "arrow", flight: 0.5 });
    if (b.rng) b.rng *= TUNE.grng;
    b.mult = F.mult ? { ...F.mult } : null;
    if (b.mult) for (const c of ["light", "medium", "heavy", "air"]) {
      const o = TUNE["m_" + b.dk + "_" + c];
      if (o !== void 0) b.mult[c] = o;
    }
    b.pick = F.pick || "near";
    b.minr = b.minr || 0;
    b.t = R();
  }
  const posts = [], outer = [];
  const pip = (x, z) => {
    let c = false;
    const V = meta.town;
    for (let i = 0, j = V.length - 1; i < V.length; j = i++) {
      const [xi, zi] = V[i], [xj, zj] = V[j];
      if (zi > z !== zj > z && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
    }
    return c;
  };
  for (const g of meta.gates) for (let i = 0; i < 3; i++) posts.push([g.x - g.nx * 16, g.z - g.nz * 16, 14]);
  const keep = B.find((b) => b.type === "keep");
  if (keep) for (let i = 0; i < 4; i++) posts.push([keep.x, keep.z, 30]);
  for (const b of B) if (b.type === "vault" || b.type === "barracks" || b.type === "mine") posts.push([b.x, b.z, 16]);
  for (const b of B) if (!b.ring && !b.def && b.type !== "house" && !pip(b.x, b.z)) outer.push([b.x, b.z, 14]);
  const GA = unitdefs_default.garrison_at || [[1, 10], [5, 35], [10, 75], [15, 115], [20, 150]], MIX = unitdefs_default.garrison_mix || { guard: 0.55, archer: 0.25, heavy: 0.1, reserve: 0.1 };
  let nG = GA[GA.length - 1][1];
  for (let i = 1; i < GA.length; i++) if (L <= GA[i][0]) {
    nG = GA[i - 1][1] + (GA[i][1] - GA[i - 1][1]) * (L - GA[i - 1][0]) / (GA[i][0] - GA[i - 1][0]);
    break;
  }
  nG = Math.max(4, Math.round(nG));
  const kinds = [];
  {
    const nA = Math.round(nG * MIX.archer), nH = Math.round(nG * MIX.heavy), nR = Math.round(nG * MIX.reserve);
    for (let i = 0; i < nG; i++) kinds.push(i < nH ? "heavy" : i < nH + nR ? "reserve" : i < nH + nR + nA ? "archer" : "guard");
  }
  const HPW = { guard: 1, archer: 0.7, heavy: 3.5, reserve: TUNE.rhp }, DPW = { guard: 1, archer: 1.2, heavy: 2.5, reserve: TUNE.rdps };
  const sHP = kinds.reduce((q, k) => q + HPW[k], 0), sDP = kinds.reduce((q, k) => q + DPW[k], 0);
  const totHP = 45e-4 * D * 160 * (1 + L / MAXL), totDps = (1 - TUNE.tower) * dps, defenders = [];
  let ip = 0, io = 0;
  for (let i = 0; i < nG; i++) {
    const k = kinds[i], res = k === "reserve" && outer.length;
    const [px, pz, pr] = res ? outer[io++ % outer.length] : posts[ip++ % posts.length], a = R() * 6.28, r = 3 + R() * pr, x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
    const arch = k === "archer", hp = Math.max(30, totHP * HPW[k] / sHP);
    defenders.push({ side: "D", type: arch ? "archer" : "guard", kind: k, x, z, hx: x, hz: z, hp, maxHp: hp, dps: totDps * DPW[k] / sDP, rng: arch ? 24 * US : 0, spd: (k === "reserve" ? TUNE.rsp : 1) * TUNE.sp, r: 0.8 * UR, air: false, hunter: k === "reserve" || k === "heavy" || k === "guard" && TUNE.hall > 0, role: arch ? "ranged" : "infantry", size: k === "heavy" ? "heavy" : "light", leash: res ? 24 * US : arch ? 0 : TUNE.leash * US, cd: 0 });
  }
  {
    const wsel = gPow(guard), k = wsel > 0 ? Math.max(0.3, gFrac * D0 / wsel) : 0, kp = keep || { x: 0, z: 0 };
    let gi = 0;
    for (const [type, n2] of Object.entries(guard)) for (let i = 0; i < n2; i++, gi++) {
      const d = unitdefs_default.units[type], air = !!d.air, big = d.space >= 8, a = R() * 6.28;
      const gp = posts[(type === "giant" ? i : 3) % Math.max(1, posts.length)] || [kp.x, kp.z, 8], bx = type === "giant" || type === "hill" && false ? gp[0] : kp.x, bz = type === "giant" ? gp[1] : kp.z, rr = type === "giant" ? 5 + i * 3 : 8 + gi * 2;
      const x = bx + Math.cos(a) * rr, z = bz + Math.sin(a) * rr;
      defenders.push({
        side: "D",
        type,
        guardian: true,
        kind: "guardian",
        x,
        z,
        hx: x,
        hz: z,
        hp: Math.max(30, d.hp * k),
        maxHp: Math.max(30, d.hp * k),
        dps: d.dps * k,
        rng: d.rng * US,
        spd: d.spd * 3.1 * TUNE.sp,
        r: (big ? 2.4 : 1.1) * UR,
        air,
        wade: type === "giant" || type === "hill",
        role: d.role,
        size: d.size || "heavy",
        canAir: air || d.rng > 0,
        leash: TUNE.gleash * US,
        cd: 0
      });
    }
  }
  const walls = B.filter((b) => b.ring), total = B.reduce((s, b) => s + b.value, 0);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const b of B) {
    x0 = Math.min(x0, b.x);
    x1 = Math.max(x1, b.x);
    z0 = Math.min(z0, b.z);
    z1 = Math.max(z1, b.z);
  }
  const g0 = meta.gates[0], dd = meta.deploy || { d: 62, lat: 0 }, deploy = { x: g0.x + g0.nx * dd.d - g0.nz * dd.lat, z: g0.z + g0.nz * dd.d + g0.nx * dd.lat, nx: g0.nx, nz: g0.nz, d: dd.d, lat: dd.lat };
  const field = { x0: Math.min(x0, deploy.x) - 70, x1: Math.max(x1, deploy.x) + 70, z0: Math.min(z0, deploy.z) - 70, z1: Math.max(z1, deploy.z) + 70 };
  return { buildings: B, defenders, ring: walls, verts: meta.town, gateIndex: 0, radius: 150, totalShare: total, level: L, us: US, ur: UR, field, deploy, real: true, profile: profName, off: B.filter((b) => b.off).map((b) => b.id) };
}
function createBattle({ spec, army, forge = 1, lv: lv2 = {}, spells = {}, targets = null, meta = null, nav = null }) {
  const R = mulberry((spec.seed | 0) ^ 2654435769);
  const base = targets ? makeBaseFromTargets(spec, targets, meta) : makeBase(spec), B = base.buildings, DEF = base.defenders;
  const US = base.us || 1, UR = base.ur || 1, FLD = base.field || FIELD;
  const mult = 1 + 0.06 * Math.max(0, forge - 1);
  const units = [];
  let uid = 1;
  const clamp3 = (x, a, b) => Math.max(a, Math.min(b, x));
  const dp = base.deploy, tx0 = dp ? -dp.nz : 1, tz0 = dp ? dp.nx : 0;
  const plan = planArmy(army, UR, !!dp, dp && nav && nav.solids ? toFrame(nav.solids, dp) : []), types = plan.types;
  for (const type of types) {
    const d = unitdefs_default.units[type], P4 = plan.pos[type];
    for (let k = 0; k < P4.length; k++) {
      const lat = P4[k][0], back = P4[k][1];
      const x = dp ? dp.x + tx0 * lat + dp.nx * back : lat, z = dp ? dp.z + tz0 * lat + dp.nz * back : FIELD.line + 4 + back;
      const known = !!(lv2 && lv2[d.fam]), L = Math.max(1, Math.min(MAXL, (lv2 && lv2[d.fam]) | 0 || 1)), tier2 = known ? unitTier(L) : 1, km = mult * lvlMult(L);
      units.push({
        id: uid++,
        side: "A",
        type,
        x,
        z,
        hp: d.hp * km,
        maxHp: d.hp * km,
        dps: d.dps * km * (known && tier2 >= 4 ? 1.15 : 1),
        rng: d.rng * US * (d.role === "siege" ? TUNE.srng : 1),
        spd: d.spd * 3.1 * TUNE.sp * (known && tier2 >= 3 ? 1.1 : 1),
        lv: L,
        tier: tier2,
        armor: known && tier2 >= 2 ? 0.9 : 1,
        ls: known && tier2 >= 5,
        r: (d.space >= 8 ? 2.4 : d.space >= 3 ? 1.1 : 0.75) * UR,
        air: !!d.air,
        role: d.role,
        size: d.size || (d.space <= 2 ? "light" : d.space <= 6 ? "medium" : "heavy"),
        prefer: d.prefer || "near",
        wade: BIGS.has(type),
        cd: R(),
        go: null,
        hold: null,
        hero: !!HEROES[type],
        active: false,
        target: null,
        retarget: 0,
        dead: false,
        y: d.air ? 6 * UR : 0,
        face: dp ? Math.atan2(-dp.nx, -dp.nz) : Math.PI
      });
    }
  }
  const sent = {};
  for (const u of units) sent[u.type] = (sent[u.type] || 0) + 1;
  for (const d of DEF) {
    d.id = uid++;
    d.dead = false;
    d.target = null;
    d.retarget = 0;
    d.y = 0;
    d.face = 0;
  }
  const all = units.concat(DEF);
  const stats = { took: {}, kills: {}, dealt: {}, wk: {}, deadAt: {} };
  const sim = { stats, rest: 1, zones: [], spells: { ...spells }, spellsUsed: {}, base, units, defenders: DEF, buildings: B, field: FLD, deploy: dp || null, events: [], time: 0, over: false, endAt: 180, loot: {}, sent, lost: {}, stars: 0, pending: [] };
  const NAV2 = nav;
  const alive = (a) => !a.dead && a.hp > 0;
  const CELL2 = 10, GK = (i, j) => (i + 1024) * 2048 + (j + 1024), gA = /* @__PURE__ */ new Map(), gD = /* @__PURE__ */ new Map();
  const gbuild = (g, list) => {
    g.clear();
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (o.dead || o.air) continue;
      const key = GK(Math.floor(o.x / CELL2), Math.floor(o.z / CELL2)), c = g.get(key);
      if (c) c.push(o);
      else g.set(key, [o]);
    }
  };
  const ev = (o) => sim.events.push(o);
  const defAir = DEF.filter((e) => e.air);
  const foeNear = (u, Rr) => {
    let best = null;
    const i0 = Math.floor((u.x - Rr) / CELL2), i1 = Math.floor((u.x + Rr) / CELL2), j0 = Math.floor((u.z - Rr) / CELL2), j1 = Math.floor((u.z + Rr) / CELL2);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const c = gD.get(GK(i, j));
      if (!c) continue;
      for (let k = 0; k < c.length; k++) {
        const e = c[k];
        if (!alive(e) || best && e.id > best.id || dist(u, e) >= Rr) continue;
        best = e;
      }
    }
    if (u.air || u.rng > 0) for (let k = 0; k < defAir.length; k++) {
      const e = defAir[k];
      if (alive(e) && (!best || e.id < best.id) && dist(u, e) < Rr) best = e;
    }
    return best;
  };
  const PGI = Math.floor(FLD.x0 / CELL2) - 3, PGJ = Math.floor(FLD.z0 / CELL2) - 3, PNI = Math.floor(FLD.x1 / CELL2) - PGI + 4, PNJ = Math.floor(FLD.z1 / CELL2) - PGJ + 4;
  const pk = { t: -1, ground: [], siege: [], air: [], far: [], cells: new Array(PNI * PNJ).fill(null), used: [] };
  const pkBuild = () => {
    pk.t = sim.time;
    pk.ground.length = 0;
    pk.siege.length = 0;
    pk.air.length = 0;
    pk.far.length = 0;
    for (let i = 0; i < pk.used.length; i++) pk.cells[pk.used[i]].length = 0;
    pk.used.length = 0;
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (!alive(u) || !u.active) continue;
      if (u.role === "siege") pk.siege.push(u);
      if (u.air) {
        pk.air.push(u);
        continue;
      }
      if (u.role === "siege") continue;
      pk.ground.push(u);
      const ci2 = Math.floor(u.x / CELL2) - PGI, cj = Math.floor(u.z / CELL2) - PGJ;
      if (ci2 < 0 || cj < 0 || ci2 >= PNI || cj >= PNJ) {
        pk.far.push(u);
        continue;
      }
      const idx2 = ci2 * PNJ + cj;
      let c = pk.cells[idx2];
      if (!c) c = pk.cells[idx2] = [];
      if (!c.length) pk.used.push(idx2);
      c.push(u);
    }
  };
  const walls = B.filter((b) => b.ring);
  const share = base.totalShare;
  const dist = (a, b) => hyp(a.x - b.x, a.z - b.z);
  const distB = (u, b) => {
    const c = Math.cos(b.rot), s = Math.sin(b.rot), dx = u.x - b.x, dz = u.z - b.z;
    const lx = dx * c - dz * s, lz = dx * s + dz * c, qx = Math.max(0, Math.abs(lx) - b.w / 2), qz = Math.max(0, Math.abs(lz) - b.d / 2);
    return hyp(qx, qz);
  };
  const segHit = (ax, az, bx, bz, w) => {
    const [px, pz] = w.a, [qx, qz] = w.b, rx = bx - ax, rz = bz - az, sx = qx - px, sz = qz - pz, den = rx * sz - rz * sx;
    if (Math.abs(den) < 1e-6) return -1;
    const t = ((px - ax) * sz - (pz - az) * sx) / den, u = ((px - ax) * rz - (pz - az) * rx) / den;
    return t > 0.02 && t < 0.98 && u >= 0 && u <= 1 ? t : -1;
  };
  const insideRing = (x, z) => {
    let c = false;
    const V = base.verts;
    for (let i = 0, j = V.length - 1; i < V.length; j = i++) {
      const [xi, zi] = V[i], [xj, zj] = V[j];
      if (zi > z !== zj > z && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
    }
    return c;
  };
  let coverV = 1;
  const GUNS = B.filter((b) => b.def && b.rng && b.dmg);
  const covOf = (b) => {
    if (b.covV === coverV) return b.cov;
    let n2 = 0;
    for (const g of GUNS) if (!g.dead && hyp(g.x - b.x, g.z - b.z) < g.rng) n2++;
    b.covV = coverV;
    return b.cov = n2;
  };
  const bump = (o, a, b2, v) => {
    const m = o[a] || (o[a] = {});
    m[b2] = (m[b2] || 0) + v;
  };
  const hurtB = (b, dmg, by) => {
    if (b.dead) return;
    b.hp -= dmg;
    ev({ k: "hit", b: b.id, x: b.x, z: b.z, dmg, src: by });
    if (by) bump(stats.dealt, by, "b", Math.min(dmg, b.hp + dmg));
    if (b.hp <= 0) {
      b.hp = 0;
      b.dead = true;
      b.collapseT = 0;
      ev({ k: "collapse", b: b.id, x: b.x, z: b.z, w: b.w, d: b.d, h: b.h, rot: b.rot || 0, gem: b.gem, type: b.type });
      if (b.type === "keep") sim.keepDown = true;
      if (b.rng && b.dmg) {
        coverV++;
        if (!stats.deadAt[b.id]) stats.deadAt[b.id] = [b.dk, sim.time];
      }
    }
  };
  const hurtU = (u, dmg, by) => {
    if (!alive(u)) return;
    if (u.side === "A") {
      if (u.guardUntil > sim.time) dmg *= 0.3;
      else if (u.shieldUntil > sim.time) dmg *= 0.65;
      dmg *= u.armor || 1;
    }
    u.hp -= dmg;
    ev({ k: "hurt", id: u.id, x: u.x, z: u.z, dmg });
    if (by) {
      if (u.side === "A") bump(stats.took, by, u.type, dmg);
      else bump(stats.dealt, by, "u", dmg);
    }
    if (u.hp <= 0 && u.ls) {
      u.ls = false;
      u.hp = u.maxHp * 0.25;
      ev({ k: "stand", id: u.id, x: u.x, z: u.z });
      return;
    }
    if (u.hp <= 0) {
      u.dead = true;
      u.deadAt = sim.time;
      ev({ k: "die", id: u.id, side: u.side, type: u.type, x: u.x, z: u.z });
      if (u.side === "A") {
        sim.lost[u.type] = (sim.lost[u.type] || 0) + 1;
        if (by) bump(stats.kills, by, u.type, 1);
      }
    }
  };
  const splashAt = (x, z, r, dmg, from, prim, by, o) => {
    if (from === "A") {
      for (const b of B) if (!b.dead && hyp(b.x - x, b.z - z) < r + Math.max(b.w, b.d) * 0.4) hurtB(b, dmg * (b.type === "wall" ? 0.7 : 1) * (b === prim ? 1 : TUNE.nb), by);
    }
    for (const u of all) if (alive(u) && u.side !== from && hyp(u.x - x, u.z - z) < r) {
      if (o && o.ground && u.air) continue;
      hurtU(u, o && o.mult ? dmg * (o.mult[sizeClass(u)] ?? 1) : dmg, by);
      if (o && o.slow && alive(u)) {
        u.slowUntil = sim.time + o.slowT;
        u.slowK = o.slow;
      }
    }
    ev({ k: "splash", x, z, r });
  };
  const queue = (delay, fn) => sim.pending.push({ t: sim.time + delay, fn });
  const AAW = { ballista: 34, wizard: 20, tesla: 20 };
  const pickAttackerTarget = (u) => {
    const ground = !u.air;
    let best = null, bs = 1e9;
    const consider = (t, score) => {
      if (score < bs) {
        bs = score;
        best = t;
      }
    };
    const pf = TUNE.prefer ? u.prefer : "near";
    const near = (u.role === "ranged" ? 30 : u.role === "air" ? 24 : 11) * US;
    const reachable = (d) => (!d.air || u.air || u.rng > 0) && (!TUNE.prefer || !u.air || (d.guardian ? d.canAir : d.rng > 0));
    if (u.role !== "giant" && u.role !== "siege") {
      for (const d of DEF) if (alive(d) && reachable(d)) {
        const dd = dist(u, d);
        if (dd < (pf === "raid" && !d.guardian ? 4 * US : near)) consider(d, dd - (d.guardian ? 12 : 6) * US);
      }
    }
    if (BIGS.has(u.type) || u.role === "siege") {
      for (const d of DEF) if (alive(d) && d.guardian && reachable(d)) {
        const dd = dist(u, d);
        if (dd < (u.role === "siege" ? u.rng : 16 * US)) consider(d, dd - 30 * US);
      }
    }
    for (const b of B) {
      if (b.dead) continue;
      if (u.bad && u.bad[b.id] > sim.time) continue;
      const gate = pf === "gate" && b.type === "gate";
      if (b.ring && sim.rest > 3 && !gate) continue;
      let s = dist(u, b) + (b.tc || 0) * 2.2 * US;
      if (b.ring && b.type === "wall") s += 70 * US;
      const gun = b.def || b.type === "tower" || b.type === "ballista";
      if (gun) s -= (u.role === "siege" || u.role === "giant" || u.air ? 26 : pf === "defence" ? 16 : pf === "raid" ? 0 : 8) * US;
      if (b.type === "vault" && u.role === "air") s -= 6 * US;
      if (u.role === "siege" && b.type !== "tower" && b.type !== "ballista") s += 6 * US;
      if (TUNE.prefer) {
        if (gate) s -= 70 * US;
        else if (pf === "antiair" && b.def && b.air) s -= (AAW[b.dk] || 6) * US;
        else if (pf === "raid" && !b.ring) s += (covOf(b) * 4 - (b.type === "vault" || b.type === "mine" ? 8 : 0)) * US;
        else if (pf === "standoff" && b.def && b.rng) s += (b.rng >= u.rng ? 12 : -8) * US;
      }
      consider(b, s);
    }
    return best;
  };
  const LEASH = 15 * US;
  const pickHeroTarget = (u) => {
    const h = u.hold || u;
    let best = null, bs = 1e9;
    for (const d of DEF) if (alive(d) && hyp(d.x - h.x, d.z - h.z) < LEASH) {
      const s2 = dist(u, d) - 10 * US;
      if (s2 < bs) {
        bs = s2;
        best = d;
      }
    }
    for (const b of B) {
      if (b.dead || u.bad && u.bad[b.id] > sim.time) continue;
      const dd = distB(h, b);
      if (b.ring) {
        if (dd > 4.5 * US) continue;
        if (dd + 20 * US < bs) {
          bs = dd + 20 * US;
          best = b;
        }
        continue;
      }
      if (dd > (b.rng || b.def ? LEASH : 7 * US)) continue;
      const s2 = dd + (b.def || b.type === "tower" ? -4 * US : 0);
      if (s2 < bs) {
        bs = s2;
        best = b;
      }
    }
    return best;
  };
  const huntR = () => TUNE.hunt * US;
  const pickDefenderTarget = (d) => {
    let best = null, bd = 1e9;
    const hunter = d.hunter && TUNE.hunt > 0, ranged = d.rng > 0;
    if (pk.t !== sim.time) pkBuild();
    const consider = (u) => {
      let dd = dist(u, d);
      if (hunter && u.role === "siege" && hyp(u.x - d.hx, u.z - d.hz) < huntR()) dd -= 60 * US;
      if (dd < bd || dd === bd && best && u.id < best.id) {
        bd = dd;
        best = u;
      }
    };
    for (let k = 0; k < pk.siege.length; k++) if (ranged || !pk.siege[k].air) consider(pk.siege[k]);
    if (ranged) {
      for (let k = 0; k < pk.air.length; k++) if (!pk.air[k].air || pk.air[k].role !== "siege") consider(pk.air[k]);
    }
    const ci2 = Math.floor(d.x / CELL2), cj = Math.floor(d.z / CELL2);
    let done = false;
    for (let k = 0; k < pk.far.length; k++) consider(pk.far[k]);
    const cell = (i, j) => {
      i -= PGI;
      j -= PGJ;
      if (i < 0 || j < 0 || i >= PNI || j >= PNJ) return;
      const c = pk.cells[i * PNJ + j];
      if (c !== null && c.length) for (let k = 0; k < c.length; k++) consider(c[k]);
    };
    const need = Math.max(28 * US, (d.leash || 0) + hyp(d.x - d.hx, d.z - d.hz), hunter ? huntR() + hyp(d.x - d.hx, d.z - d.hz) : 0), rmax = Math.ceil(need / CELL2) + 1;
    if (rmax <= 7) {
      for (let r = 0; r <= rmax && !done; r++) {
        if (r === 0) cell(ci2, cj);
        else {
          for (let j = cj - r; j <= cj + r; j++) {
            cell(ci2 - r, j);
            cell(ci2 + r, j);
          }
          for (let i = ci2 - r + 1; i <= ci2 + r - 1; i++) {
            cell(i, cj - r);
            cell(i, cj + r);
          }
        }
        if (best && bd < r * CELL2) done = true;
      }
      if (!done && !best) return null;
    }
    if (!done) for (let k = 0; k < pk.ground.length; k++) consider(pk.ground[k]);
    return best;
  };
  const SOLID_T = { wall: 1, gate: 1, tower: 1, ballista: 1, keep: 1, vault: 1, mine: 1, barracks: 1, training: 1, forge: 1, stable: 1, workshop: 1, lair: 1, store: 1 };
  const solids = B.filter((b) => SOLID_T[b.type]);
  for (const b of solids) {
    b.cs = Math.cos(b.rot || 0);
    b.sn = Math.sin(b.rot || 0);
    b.rr = hyp(b.w, b.d) / 2 + 3;
  }
  const SGC = 10, sgrid = /* @__PURE__ */ new Map(), SGE = [];
  for (const b of solids) {
    const Rr = b.rr + 1 + 6;
    for (let i = Math.floor((b.x - Rr) / SGC); i <= Math.floor((b.x + Rr) / SGC); i++) for (let j = Math.floor((b.z - Rr) / SGC); j <= Math.floor((b.z + Rr) / SGC); j++) {
      const key = GK(i, j), c = sgrid.get(key);
      if (c) c.push(b);
      else sgrid.set(key, [b]);
    }
  }
  const inBox = (b, x, z, pad) => {
    const dx = x - b.x, dz = z - b.z;
    if (dx * dx + dz * dz > (b.rr + pad) * (b.rr + pad)) return false;
    const lx = dx * b.cs - dz * b.sn, lz = dx * b.sn + dz * b.cs;
    return Math.abs(lx) < b.w / 2 + pad && Math.abs(lz) < b.d / 2 + pad;
  };
  const collide = (u, ox, oz, nx, nz) => {
    const pad = Math.min(1, u.r * 0.4);
    let hit = null;
    const len = hyp(nx - ox, nz - oz), n2 = Math.max(1, Math.ceil(len / 0.5));
    let px = ox, pz = oz;
    for (let i = 1; i <= n2; i++) {
      let qx = px + (nx - ox) / n2, qz = pz + (nz - oz) / n2;
      const near = sgrid.get(GK(Math.floor(qx / SGC), Math.floor(qz / SGC))) || SGE;
      for (let pass = 0; pass < 2; pass++) for (const b of near) {
        if (b.dead || !inBox(b, qx, qz, pad)) continue;
        const dx = qx - b.x, dz = qz - b.z, lx = dx * b.cs - dz * b.sn, lz = dx * b.sn + dz * b.cs, hx = b.w / 2 + pad, hz = b.d / 2 + pad, ax = hx - Math.abs(lx), az = hz - Math.abs(lz);
        let l2x = lx, l2z = lz;
        if (ax < az) l2x = Math.sign(lx || 1) * (hx + 0.02);
        else l2z = Math.sign(lz || 1) * (hz + 0.02);
        qx = b.x + l2x * b.cs + l2z * b.sn;
        qz = b.z - l2x * b.sn + l2z * b.cs;
        hit = b;
      }
      px = qx;
      pz = qz;
    }
    return [px, pz, hit];
  };
  const moveTo = (u, tx, tz, dt, stopAt = 0) => {
    const dx = tx - u.x, dz = tz - u.z, d = hyp(dx, dz);
    if (d <= stopAt || d < 1e-4) return d;
    const sp = u.spd * dt * (u.rageUntil > sim.time ? 1.3 : 1) * (u.slowUntil > sim.time ? u.slowK : 1), k = Math.min(1, sp / d);
    u.face = Math.atan2(dx, dz);
    let sx = 0, sz = 0;
    if (!u.air) {
      const g = u.side === "D" ? gD : gA, ci2 = Math.floor(u.x / CELL2), cj = Math.floor(u.z / CELL2);
      for (let i = ci2 - 1; i <= ci2 + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
        const c = g.get(GK(i, j));
        if (!c) continue;
        for (let k2 = 0; k2 < c.length; k2++) {
          const o = c[k2];
          if (o === u || o.dead) continue;
          const ox = u.x - o.x, oz = u.z - o.z, dd = ox * ox + oz * oz, rr = (u.r + o.r) * 0.9;
          if (dd < rr * rr && dd > 1e-6) {
            const m = Math.sqrt(dd);
            sx += ox / m * (rr - m);
            sz += oz / m * (rr - m);
          }
        }
      }
    }
    {
      const sm = hyp(sx, sz) * 0.5, cap = Math.max(0.15, sp * 0.6);
      if (sm > cap) {
        sx *= cap / sm;
        sz *= cap / sm;
      }
    }
    let nx = u.x + dx * k + sx * 0.5, nz = u.z + dz * k + sz * 0.5;
    if (!u.air) {
      const want = hyp(dx * k, dz * k), [cx, cz, hit] = collide(u, u.x, u.z, nx, nz), got = hyp(cx - u.x, cz - u.z);
      if (hit && got < want * 0.4) {
        u.stuck = (u.stuck || 0) + dt;
        u.blocker = hit;
      } else if (u.stuck > 0) u.stuck = Math.max(0, u.stuck - dt * 2);
      nx = cx;
      nz = cz;
      const closed = NAV2 ? u.wade ? NAV2.isSolid : NAV2.isBlocked : null;
      if (closed && closed(nx, nz) && !closed(u.x, u.z)) {
        if (!closed(nx, u.z)) nz = u.z;
        else if (!closed(u.x, nz)) nx = u.x;
        else {
          nx = u.x;
          nz = u.z;
        }
        u.wst = (u.wst || 0) + dt;
      } else if (u.wst > 0) u.wst = Math.max(0, u.wst - dt * 2);
    }
    u.x = nx;
    u.z = nz;
    return d;
  };
  let navBudget = 4e3;
  const rcache = [];
  const goalFor = (u, gx, gz) => {
    if (!NAV2 || u.air || u.wade) return [gx, gz];
    let r = u.rt;
    if (r && (Math.abs(r.gx - gx) + Math.abs(r.gz - gz) > 8 || sim.time > r.exp)) r = u.rt = null;
    if (!r) {
      if (sim.time < (u.navT || 0) || navBudget <= 0) return [gx, gz];
      u.navT = sim.time + 0.35 + R() * 0.25;
      if (NAV2.clear(u.x, u.z, gx, gz)) return [gx, gz];
      let pts = null;
      for (const c of rcache) if (c.exp > sim.time && Math.abs(c.gx - gx) + Math.abs(c.gz - gz) < 6 && hyp(c.sx - u.x, c.sz - u.z) < 9 && NAV2.clear(u.x, u.z, c.pts[0][0], c.pts[0][1])) {
        pts = c.pts;
        break;
      }
      if (!pts) {
        const n0 = NAV2.nodes ? NAV2.nodes() : 0;
        pts = NAV2.route(u.x, u.z, gx, gz);
        navBudget -= Math.max(80, (NAV2.nodes ? NAV2.nodes() : 0) - n0);
        if (pts) {
          rcache.push({ gx, gz, sx: u.x, sz: u.z, pts, exp: sim.time + 8 });
          if (rcache.length > 40) rcache.shift();
        }
      }
      if (!pts) {
        u.navT = sim.time + 2;
        u.noRoute = (u.noRoute || 0) + 1;
        if (typeof process !== "undefined" && process.env && process.env.XNAV && u.noRoute < 2) console.log("NOROUTE", u.type, u.x.toFixed(0), u.z.toFixed(0), "->", gx.toFixed(0), gz.toFixed(0), "goalWet", NAV2.isWet(gx, gz), "startWet", NAV2.isWet(u.x, u.z), "t", sim.time.toFixed(0));
        return [gx, gz];
      }
      r = u.rt = { pts, i: 0, gx, gz, exp: sim.time + 10 };
    }
    while (r.i < r.pts.length - 1 && hyp(r.pts[r.i][0] - u.x, r.pts[r.i][1] - u.z) < 3.2) r.i++;
    return r.pts[r.i];
  };
  const attackerStep = (u, dt) => {
    if (!u.active) return;
    u.cd -= dt;
    if (u.type === "treant" && u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * TUNE.treantRegen * dt);
    if (u.go && !u.target) {
      const [wx, wz] = goalFor(u, u.go.x, u.go.z);
      moveTo(u, wx, wz, dt, wx === u.go.x ? 1.5 * UR : 0);
      if (hyp(u.go.x - u.x, u.go.z - u.z) <= 1.5 * UR) u.go = null;
      if (u.go && u.wst > 2.5) {
        u.go = null;
        u.wst = 0;
        u.rt = null;
      }
      if (u.go && !u.hero) {
        const e = foeNear(u, (u.role === "ranged" ? 26 : 8) * US);
        if (e) u.target = e;
      }
      if (u.go && u.stuck > 1.2 && u.blocker && !u.blocker.dead) {
        u.target = u.block = u.blocker;
        u.stuck = 0;
        u.retarget = 2.5;
      }
      if (u.go && !u.target) return;
    }
    u.retarget -= dt;
    if (u.focus) {
      const f = u.focus;
      if (f.dead || f.hp !== void 0 && f.hp <= 0) u.focus = null;
      else if (u.target !== f && u.target !== u.block) {
        u.target = f;
        u.retarget = 1.2;
      } else if (u.target === f && u.retarget <= 0) u.retarget = 1.2;
    }
    if (u.hero && u.target && u.target !== u.block && u.hold && (u.target.w !== void 0 ? distB(u.hold, u.target) > (u.target.rng || u.target.def ? LEASH + 3 * US : 8 * US) : dist(u.hold, u.target) > LEASH + 5 * US)) {
      u.target = null;
      u.retarget = 0.2;
    }
    if (!u.target || u.retarget <= 0 || u.target.dead || u.target.hp !== void 0 && u.target.hp <= 0) {
      u.target = u.hero ? pickHeroTarget(u) : pickAttackerTarget(u);
      u.retarget = 0.9 + R() * 0.5;
      u.block = null;
    }
    let t = u.target;
    if (!t) {
      if (u.hero && u.hold && hyp(u.hold.x - u.x, u.hold.z - u.z) > 2.2 * UR) {
        const [wx, wz] = goalFor(u, u.hold.x, u.hold.z);
        moveTo(u, wx, wz, dt, wx === u.hold.x ? 0.8 * UR : 0);
      }
      return;
    }
    const isB = t.w !== void 0;
    if (!u.air && !u.block) {
      const inReach = u.rng > 0 && (isB ? distB(u, t) : dist(u, t)) <= u.rng;
      if (!inReach) {
        const [wx, wz] = goalFor(u, t.x, t.z);
        let bt = 2;
        for (const w of walls) if (!w.dead && w !== t) {
          const h = segHit(u.x, u.z, wx, wz, w);
          if (h >= 0 && h < bt) {
            bt = h;
            u.block = w;
          }
        }
      }
    }
    if (!u.block && u.stuck > 1.2 && u.blocker && !u.blocker.dead && u.blocker !== t) {
      u.block = u.blocker;
      u.stuck = 0;
    }
    if (u.block && u.block.dead) u.block = null;
    if (u.block) t = u.block;
    const tb = t.w !== void 0;
    const d = tb ? distB(u, t) : dist(u, t), reach = u.rng > 0 ? u.rng : tb ? (u.type === "giant" ? GIANT_SWING.reach : 1.4) * UR : u.r + (t.r || 0.8 * UR) + 0.5 * UR;
    if (d > reach) {
      const [wx, wz] = goalFor(u, t.x, t.z);
      moveTo(u, wx, wz, dt, 0);
      if (u.wst > 2.5 && u.target) {
        (u.bad = u.bad || {})[u.target.id] = sim.time + 15;
        u.target = null;
        u.block = null;
        u.rt = null;
        u.wst = 0;
        u.retarget = 0;
      }
      return;
    }
    u.stuck = 0;
    u.face = Math.atan2(t.x - u.x, t.z - u.z);
    if (u.cd > 0) return;
    const SG = u.role === "siege" ? SIEGE[u.type] || SIEGE.catapult : null;
    const interval = SG ? SG.iv : u.type === "giant" ? GIANT_SWING.iv : u.role === "air" && u.rng ? 0.5 : u.role === "ranged" ? 1.1 : 0.9;
    u.cd = interval * (0.9 + R() * 0.2);
    const dmg = u.dps * interval * (u.rageUntil > sim.time ? 1.55 : 1) * (u.bannerUntil > sim.time ? 1.3 : 1);
    if (u.role === "siege") {
      ev({ k: "shot", kind: SG.kind, from: [u.x, SG.h, u.z], to: [t.x, t.h ? t.h * 0.5 : 1, t.z], t: SG.fl, u: u.id, big: !!SG.big });
      queue(SG.fl, () => splashAt(t.x, t.z, SG.sp * UR, dmg * (tb ? TUNE.bms : 1), "A", t, u.type));
    } else if (u.role === "air" && u.rng >= 15) {
      const T32 = u.type === "dragon3" || u.type === "baby3", big = u.type === "dragon" || u.type === "dragon3", shadow = u.shadowUntil > sim.time;
      const dd = (big ? TUNE.brD * (T32 ? 1.2 : 1) : u.type === "dragonling" ? TUNE.brL : TUNE.brB * (u.type === "baby3" ? 1.25 : u.type === "darkrider" ? 1.35 : 1)) * UR * (shadow ? 1.6 : 1);
      const heads = T32 ? 3 : 1, per = (big ? 1.2 : 1) * (shadow ? 2 : 1) * (T32 ? 0.4 : 1), side = [0, -1, 1], ang = Math.atan2(t.x - u.x, t.z - u.z), px = Math.cos(ang), pz = -Math.sin(ang);
      for (let h = 0; h < heads; h++) {
        const ox = side[h] * dd * 0.9 * px, oz = side[h] * dd * 0.9 * pz, bx = t.x + ox, bz = t.z + oz;
        ev({ k: "breath", from: [u.x, u.y, u.z], to: [bx, 1, bz], big, u: u.id, head: h });
        queue(0.25 + h * 0.08, () => splashAt(bx, bz, dd, dmg * per * (tb ? BM.air : 1) * 0.55, "A", t, u.type));
      }
    } else if (u.type === "mage" || u.type === "lich") {
      const fl = Math.max(0.25, d / (30 * US));
      ev({ k: "shot", kind: "orb", from: [u.x, 4.2, u.z], to: [t.x, tb ? Math.min(3, t.h * 0.4) : 1.6, t.z], t: fl, u: u.id, delay: HIT_T.orb });
      queue(HIT_T.orb + fl, () => splashAt(t.x, t.z, (u.type === "lich" ? 5.2 : 3.4) * UR, dmg * (tb ? BM.ranged : 1), "A", tb ? t : null, u.type));
    } else if (u.rng > 0) {
      ev({ k: "shot", kind: "arrow", from: [u.x, 2.2, u.z], to: [t.x, tb ? Math.min(3, t.h * 0.4) : 1.4, t.z], t: Math.max(0.15, d / (42 * US)), u: u.id, delay: HIT_T.arrow });
      queue(HIT_T.arrow + Math.max(0.15, d / (42 * US)), () => {
        if (tb) hurtB(t, dmg * (TUNE["bm_" + u.role] ?? BM[u.role]), u.type);
        else hurtU(t, dmg, u.type);
      });
    } else {
      const ht = hitTOf(u.type);
      ev({ k: "melee", u: u.id, x: u.x, z: u.z, tx: t.x, tz: t.z, hit: ht });
      queue(ht, () => {
        if (tb) hurtB(t, dmg * ((TUNE["bm_" + u.role] ?? BM[u.role]) || 0.5), u.type);
        else hurtU(t, dmg, u.type);
        if (u.role === "giant") ev({ k: "slam", x: t.x, z: t.z });
        if (u.type === "ogre") splashAt(t.x, t.z, 2.4 * UR, dmg * 0.4, "A", tb ? t : null, u.type, { ground: true });
      });
    }
  };
  const guardianStep = (d, dt) => {
    d.cd -= dt;
    d.retarget -= dt;
    if (!d.target || d.retarget <= 0 || !alive(d.target)) {
      let best = null, bs = 1e9;
      for (const u of units) {
        if (!alive(u) || !u.active || u.air && !d.canAir) continue;
        if (hyp(u.x - d.hx, u.z - d.hz) > d.leash * (u.role === "siege" ? TUNE.gsl : 1)) continue;
        const s = dist(u, d) - (u.size === "heavy" || u.size === "huge" ? 6 * US : 0) - (!!u.air === !!d.air ? 4 * US : 0) - (u.role === "siege" ? TUNE.gsiege * US : 0);
        if (s < bs) {
          bs = s;
          best = u;
        }
      }
      d.target = best;
      d.retarget = 0.6 + R() * 0.3;
    }
    const t = d.target;
    if (!t) {
      if (hyp(d.hx - d.x, d.hz - d.z) > 2 * UR) moveTo(d, d.hx, d.hz, dt, 0);
      return;
    }
    const dd = dist(d, t), reach = d.rng > 0 ? d.rng : d.r + (t.r || 0.8 * UR) + 1 * UR;
    if (dd > reach) {
      const [wx, wz] = goalFor(d, t.x, t.z);
      moveTo(d, wx, wz, dt, 0);
      return;
    }
    d.face = Math.atan2(t.x - d.x, t.z - d.z);
    if (d.cd > 0) return;
    const src = "g_" + d.type;
    if (d.air) {
      const interval = 0.5;
      d.cd = interval * (0.9 + R() * 0.2);
      const r = (d.type === "dragon" ? TUNE.brD : TUNE.brB) * UR, dmg = d.dps * interval * (d.type === "dragon" ? 1.2 : 1) * 0.55;
      ev({ k: "breath", from: [d.x, d.y || 12, d.z], to: [t.x, 1, t.z], big: d.type === "dragon", u: d.id });
      queue(0.25, () => splashAt(t.x, t.z, r, dmg, "D", null, src));
    } else {
      const interval = GIANT_SWING.iv;
      d.cd = interval * (0.9 + R() * 0.2);
      const dmg = d.dps * interval;
      ev({ k: "melee", u: d.id, x: d.x, z: d.z, tx: t.x, tz: t.z });
      queue(GIANT_SWING.hit, () => {
        splashAt(t.x, t.z, 2.6 * UR, dmg, "D", null, src, { ground: true });
        ev({ k: "slam", x: t.x, z: t.z });
      });
    }
  };
  const defenderStep = (d, dt) => {
    if (d.frozen > sim.time) return;
    if (d.guardian) {
      guardianStep(d, dt);
      return;
    }
    d.cd -= dt;
    d.retarget -= dt;
    if (!d.target || d.retarget <= 0 || !alive(d.target)) {
      const c = pickDefenderTarget(d);
      d.target = c && (d.leash && hyp(c.x - d.hx, c.z - d.hz) < d.leash || d.hunter && TUNE.hunt > 0 && c.role === "siege" && hyp(c.x - d.hx, c.z - d.hz) < huntR() || d.kind !== "reserve" && (insideRing(c.x, c.z) || dist(c, d) < 8 * US) && dist(c, d) < 28 * US) ? c : null;
      d.retarget = 0.7;
    }
    const t = d.target;
    if (!t) {
      const dx = d.hx - d.x, dz = d.hz - d.z;
      if (hyp(dx, dz) > 1.2 * UR) {
        moveTo(d, d.hx, d.hz, dt, 0);
      }
      return;
    }
    const dd = dist(d, t), reach = d.rng > 0 ? d.rng : d.r + t.r + 0.5 * UR;
    if (dd > reach) {
      moveTo(d, t.x, t.z, dt, 0);
      return;
    }
    d.face = Math.atan2(t.x - d.x, t.z - d.z);
    if (d.cd > 0) return;
    d.cd = 1;
    const dmg = d.dps;
    if (d.rng > 0) {
      ev({ k: "shot", kind: "arrow", from: [d.x, 2, d.z], to: [t.x, (t.y || 0) + 1.3, t.z], t: 0.3, u: d.id });
      queue(0.3, () => hurtU(t, dmg, "garch"));
    } else {
      ev({ k: "melee", u: d.id, x: d.x, z: d.z, tx: t.x, tz: t.z });
      queue(0.25, () => hurtU(t, dmg, "guard"));
    }
  };
  const PRI = { air: 0, heavy: 1, medium: 2, light: 3 };
  const cannonAim = (b) => {
    let best = null, bs = -1, bd = 1e9;
    for (const u of units) {
      if (!alive(u) || !u.active || u.air && !b.air) continue;
      const d = hyp(u.x - b.x, u.z - b.z);
      if (d >= b.rng || d < b.minr) continue;
      let w = (u.air ? b.mult[sizeClass(u)] || 0 : 0) + (u.role === "siege" ? TUNE.cbat : 0);
      const ci2 = Math.floor(u.x / CELL2), cj = Math.floor(u.z / CELL2);
      for (let i = ci2 - 1; i <= ci2 + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
        const c = gA.get(GK(i, j));
        if (!c) continue;
        for (let k = 0; k < c.length; k++) {
          const o = c[k];
          if (o.dead || (o.x - u.x) * (o.x - u.x) + (o.z - u.z) * (o.z - u.z) > b.splash * b.splash) continue;
          w += b.mult[sizeClass(o)] || 0;
        }
      }
      if (w > bs + 1e-9 || w > bs - 1e-9 && d < bd) {
        bs = w;
        bd = d;
        best = u;
      }
    }
    return best;
  };
  const towerStep = (b, dt) => {
    if (b.frozen > sim.time) return;
    b.t -= dt;
    if (b.t > 0) return;
    let best = null;
    if (b.pick === "dense") best = cannonAim(b);
    else {
      let bs = 1e18;
      for (const u of units) {
        if (!alive(u) || !u.active || (u.air ? !b.air : !b.ground)) continue;
        const d = hyp(u.x - b.x, u.z - b.z);
        if (d >= b.rng || d < b.minr) continue;
        const sc = (b.pick === "air" ? PRI[sizeClass(u)] * 1e5 : 0) + d - (u.role === "siege" && TUNE.cb ? 5e4 : 0);
        if (sc < bs) {
          bs = sc;
          best = u;
        }
      }
    }
    if (!best) {
      b.t = 0.25;
      return;
    }
    b.t = b.cd;
    const M = b.mult, mu = (u) => M ? M[sizeClass(u)] ?? 1 : 1, src = b.dk === "tesla" ? "tesla" : b.dk;
    if (b.chain) {
      const hit = [best], pts = [[b.x, b.h + 3.2, b.z], [best.x, best.y + 1.2, best.z]];
      for (let k = 1; k < b.chain; k++) {
        const p = hit[hit.length - 1];
        let nx = null, nd = b.hop;
        for (const u of units) if (alive(u) && u.active && !hit.includes(u)) {
          const d = hyp(u.x - p.x, u.z - p.z);
          if (d < nd) {
            nd = d;
            nx = u;
          }
        }
        if (!nx) break;
        hit.push(nx);
        pts.push([nx.x, nx.y + 1.2, nx.z]);
      }
      ev({ k: "zap", pts, ids: hit.map((u) => u.id), b: b.id });
      hit.forEach((u, i) => hurtU(u, b.dmg * Math.pow(0.6, i) * mu(u), src));
      return;
    }
    if (b.volley) {
      const per = b.dmg / b.volley, tx = best.x, tz = best.z;
      for (let i = 0; i < b.volley; i++) {
        const off2 = i * 0.17;
        queue(off2, () => ev({ k: "shot", kind: b.kind, from: [b.x, b.h + 1, b.z], to: [tx, 1.2, tz], t: b.flight, b: b.id, q: i }));
        queue(off2 + b.flight, () => splashAt(tx, tz, b.splash, per, "D", null, src, { ground: true, mult: M }));
      }
      return;
    }
    if (b.splash) {
      const lead = b.flight * 0.8 / dt, ix = best.x + (best.x - best.lx) * lead, iz = best.z + (best.z - best.lz) * lead;
      ev({ k: "shot", kind: b.kind, from: [b.x, b.h + 1, b.z], to: [ix, 1.2, iz], t: b.flight, b: b.id });
      queue(b.flight, () => splashAt(ix, iz, b.splash, b.dmg * (b.dk === "cannon" ? TUNE.splashK : 1), "D", null, src, { ground: !b.air, mult: M, slow: b.slow, slowT: b.slowT }));
      return;
    }
    ev({ k: "shot", kind: b.kind, from: [b.x, b.h + 1, b.z], to: [best.x, best.y + 1.2, best.z], t: b.flight, b: b.id });
    queue(b.flight, () => hurtU(best, b.dmg * mu(best), src));
  };
  const nb = B.filter((b) => !b.ring && b.type !== "house").map((b) => b.maxHp).sort((a, b) => a - b), hpU = nb.length ? nb[nb.length >> 1] : 100;
  const SPELL = { lightning: { r: 8, dur: 0 }, heal: { r: 17, dur: 7 }, rage: { r: 15, dur: 10 }, freeze: { r: 20, dur: 5.5 }, quake: { r: 28, dur: 1.4 } };
  sim.spellDefs = SPELL;
  sim.hpU = hpU;
  sim.cast = (type, x, z) => {
    const d = SPELL[type];
    if (!d || !(sim.spells[type] > 0) || sim.over) return false;
    sim.spells[type]--;
    sim.spellsUsed[type] = (sim.spellsUsed[type] || 0) + 1;
    ev({ k: "spell", type, x, z, r: d.r, dur: d.dur });
    if (type === "lightning") {
      for (let i = 0; i < 4; i++) queue(0.12 + i * 0.2, () => {
        const a = R() * 6.283, rr = Math.sqrt(R()) * d.r * 0.8, bx = x + Math.cos(a) * rr, bz = z + Math.sin(a) * rr;
        ev({ k: "bolt", x: bx, z: bz });
        for (const b of B) if (!b.dead && hyp(b.x - bx, b.z - bz) < 6 + Math.max(b.w, b.d) * 0.4) hurtB(b, hpU * 0.3 * (b.type === "wall" ? 0.6 : 1), "spell");
        for (const e of DEF) if (alive(e) && hyp(e.x - bx, e.z - bz) < 7) hurtU(e, 500, "spell");
      });
    } else if (type === "heal" || type === "rage") sim.zones.push({ type, x, z, r: d.r, until: sim.time + d.dur });
    else if (type === "freeze") {
      const until = sim.time + d.dur;
      for (const e of DEF) if (alive(e) && hyp(e.x - x, e.z - z) < d.r) e.frozen = until;
      for (const b of B) if (!b.dead && b.rng && hyp(b.x - x, b.z - z) < d.r + 4) {
        b.frozen = until;
        ev({ k: "freezeB", b: b.id, x: b.x, z: b.z, h: b.h });
      }
    } else if (type === "quake") {
      for (let i = 0; i < 4; i++) queue(0.2 + i * 0.35, () => {
        for (const b of B) if (!b.dead && hyp(b.x - x, b.z - z) < d.r + Math.max(b.w, b.d) * 0.3) hurtB(b, b.maxHp * 0.055, "spell");
      });
    }
    return true;
  };
  sim.send = (type, x, z, opt) => {
    let n2 = 0;
    let cx = Math.max(FLD.x0 + 4, Math.min(FLD.x1 - 4, x)), cz = Math.max(FLD.z0 + 4, Math.min(FLD.z1 - 4, z));
    let list = units.filter((u) => u.type === type && alive(u) && (HEROES[type] || !u.active));
    if (opt && opt.half && !HEROES[type] && list.length > 1) list = list.map((u) => [hyp(u.x - cx, u.z - cz), u]).sort((a, b) => a[0] - b[0] || a[1].id - b[1].id).slice(0, Math.ceil(list.length / 2)).map((e) => e[1]);
    const cols = Math.max(2, Math.ceil(Math.sqrt(list.length))), fly = list.length > 0 && !!list[0].air;
    if (NAV2 && !fly && NAV2.isBlocked(cx, cz)) [cx, cz] = NAV2.nearestDry(cx, cz);
    if (HEROES[type]) {
      list.forEach((u, k) => {
        u.active = true;
        u.target = null;
        u.block = null;
        u.focus = null;
        const gx = cx + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 3 * UR, gz = cz;
        const g = NAV2 && NAV2.isBlocked(gx, gz) ? NAV2.nearestDry(gx, gz) : [gx, gz];
        u.go = { x: g[0], z: g[1] };
        u.hold = { x: g[0], z: g[1] };
        u.rt = null;
        n2++;
      });
      return n2;
    }
    list.forEach((u, k) => {
      u.active = true;
      u.target = null;
      u.block = null;
      u.focus = null;
      const gx = cx + (k % cols - (cols - 1) / 2) * 1.6 * UR, gz = cz + (Math.floor(k / cols) - cols / 2) * 1.6 * UR;
      u.go = NAV2 && !fly && NAV2.isWet(gx, gz) ? (([x2, z2]) => ({ x: x2, z: z2 }))(NAV2.nearestDry(gx, gz)) : { x: gx, z: gz };
      u.rt = null;
      n2++;
    });
    return n2;
  };
  sim.isHero = (type) => !!HEROES[type];
  sim.canSend = (type) => HEROES[type] ? units.some((u) => u.type === type && alive(u)) : units.some((u) => u.type === type && alive(u) && !u.active);
  sim.targetAt = (x, z, r = 3 * UR) => {
    let best = null, bd = r;
    for (const b of B) {
      if (b.dead) continue;
      const d = distB({ x, z }, b);
      if (d < bd) {
        bd = d;
        best = b;
      }
    }
    for (const d of DEF) if (alive(d)) {
      const dd = hyp(d.x - x, d.z - z) - (d.r || 1);
      if (dd < bd) {
        bd = dd;
        best = d;
      }
    }
    return best;
  };
  sim.focus = (type, tgt, opt) => {
    if (!tgt || HEROES[type] || sim.over) return 0;
    let list = units.filter((u) => u.type === type && alive(u) && !u.active);
    if (opt && opt.half && list.length > 1) list = list.map((u) => [hyp(u.x - tgt.x, u.z - tgt.z), u]).sort((a, b) => a[0] - b[0] || a[1].id - b[1].id).slice(0, Math.ceil(list.length / 2)).map((e) => e[1]);
    let n2 = 0;
    const flyer = (u) => !!u.air;
    for (const u of list) {
      if (!flyer(u) && tgt.air && !(u.rng > 0)) continue;
      u.active = true;
      u.go = null;
      u.focus = tgt;
      u.target = tgt;
      u.block = null;
      u.rt = null;
      u.retarget = 1.2;
      n2++;
    }
    return n2;
  };
  sim.heroes = HEROES;
  sim.abilT = {};
  sim.abilUsed = {};
  sim.abilityState = (type) => {
    const H = HEROES[type];
    if (!H) return null;
    const list = units.filter((u) => u.type === type && alive(u)), sent2 = list.some((u) => u.active), left = Math.max(0, (sim.abilT[type] || 0) - sim.time);
    return { n: list.length, sent: sent2, f: left > 0 ? left / H.cd : 0, left, ready: sent2 && left <= 0 };
  };
  sim.ability = (type) => {
    const H = HEROES[type];
    if (!H || sim.over) return false;
    const list = units.filter((u) => u.type === type && alive(u) && u.active);
    if (!list.length || (sim.abilT[type] || 0) > sim.time) return false;
    const dive = {};
    if (type === "gryphonknight") {
      for (const u of list) {
        let best = null, bs = 1e9;
        for (const e of DEF) if (alive(e)) {
          const d = dist(u, e);
          if (d < 40 * US && d < bs) {
            bs = d;
            best = e;
          }
        }
        if (!best) {
          for (const b of B) if (!b.dead && !b.ring) {
            const d = distB(u, b);
            if (d < 40 * US && d < bs) {
              bs = d;
              best = b;
            }
          }
        }
        if (best) dive[u.id] = best;
      }
      if (!Object.keys(dive).length) return false;
    }
    sim.abilT[type] = sim.time + H.cd;
    sim.abilUsed[type] = (sim.abilUsed[type] || 0) + 1;
    for (const u of list) {
      const r = (type === "lord" ? 26 : type === "captain" ? 18 : type === "darkrider" ? 20 : type === "gryphonknight" ? 10 : 14) * US;
      ev({ k: "ability", type, id: u.id, x: u.x, z: u.z, r, dur: H.dur });
      if (type === "shieldmaiden") {
        u.guardUntil = sim.time + H.dur;
        for (const a of units) if (alive(a) && a !== u && dist(a, u) < r) a.shieldUntil = sim.time + H.dur;
        for (const e of DEF) if (alive(e) && dist(e, u) < 24 * US) {
          e.target = u;
          e.retarget = 4;
        }
      } else if (type === "captain") {
        for (const a of units) if (alive(a) && dist(a, u) < r) a.bannerUntil = sim.time + H.dur;
      } else if (type === "darkrider") {
        u.shadowUntil = sim.time + H.dur;
      } else if (type === "gryphonknight") {
        const tg = dive[u.id];
        if (!tg) continue;
        const isB = tg.w !== void 0, tx = tg.x, tz = tg.z;
        ev({ k: "dive", id: u.id, from: [u.x, u.y, u.z], to: [tx, 1, tz], t: 0.55 });
        queue(0.55, () => splashAt(tx, tz, 5 * UR, u.dps * 7, "A", isB ? tg : null, "gryphonknight"));
      } else {
        for (const a of units) if (alive(a) && dist(a, u) < r) a.rageUntil = sim.time + H.dur;
        queue(0.15, () => splashAt(u.x, u.z, 9 * UR, u.dps * 5, "A", null, "lord"));
      }
    }
    return true;
  };
  sim.alive = (type) => units.filter((u) => alive(u) && (!type || u.type === type)).length;
  sim.destruction = () => {
    let s = 0, left = 0;
    for (const b of B) {
      if (b.dead) s += b.value;
      else if (b.value > 0) left++;
    }
    return left ? Math.min(99.9, 100 * s / share) : 100;
  };
  sim.step = (dt) => {
    sim.events.length = 0;
    if (sim.over) return;
    sim.time += dt;
    navBudget = Math.min(4e3, navBudget + dt * 24e3);
    for (let i = sim.pending.length - 1; i >= 0; i--) if (sim.pending[i].t <= sim.time) {
      const p = sim.pending.splice(i, 1)[0];
      p.fn();
    }
    for (const b of B) b.tc = 0;
    sim.rest = 0;
    for (const b of B) if (!b.dead && !b.ring) sim.rest++;
    for (let i = sim.zones.length - 1; i >= 0; i--) {
      const z = sim.zones[i];
      if (sim.time >= z.until) {
        sim.zones.splice(i, 1);
        continue;
      }
      for (const u of units) if (alive(u) && hyp(u.x - z.x, u.z - z.z) < z.r) {
        if (z.type === "heal") u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.09 * dt);
        else u.rageUntil = sim.time + 0.35;
      }
    }
    for (const u of units) {
      u.lx = u.x;
      u.lz = u.z;
      if (alive(u) && u.target && u.target.tc !== void 0) u.target.tc++;
    }
    gbuild(gA, units);
    gbuild(gD, DEF);
    for (const u of units) if (alive(u)) attackerStep(u, dt);
    for (const d of DEF) if (alive(d)) defenderStep(d, dt);
    for (const b of B) if (!b.dead && b.rng) towerStep(b, dt);
    for (const b of B) if (b.dead && b.collapseT < 1) b.collapseT = Math.min(1, b.collapseT + dt / 1.4);
    const live = units.filter(alive).length, des = sim.destruction();
    let st = (des >= 50 ? 1 : 0) + (sim.keepDown ? 1 : 0) + (des >= TUNE.star3 ? 1 : 0);
    if (des < 50) st = 0;
    if (st >= 3 && des < 99.95) st = 2;
    sim.stars = st;
    if (live === 0 || des >= 100 || sim.time >= sim.endAt) {
      sim.over = true;
      sim.over_t = sim.time;
    }
  };
  sim.result = () => {
    const des = sim.destruction(), stars = sim.stars, k = Math.min(1, des / 100) * (0.55 + 0.15 * stars), loot = {};
    for (const g of Object.keys(spec.loot || {})) loot[g] = Math.floor((spec.loot[g] || 0) * k);
    return { sent: { ...sent }, lost: { ...sim.lost }, spells: { ...sim.spellsUsed }, destruction: des >= 100 ? 100 : Math.floor(des * 10) / 10, stars, loot, time: sim.time, over: sim.over };
  };
  sim.lootNow = () => {
    const des = sim.destruction(), out = {};
    for (const g of Object.keys(spec.loot || {})) out[g] = Math.floor((spec.loot[g] || 0) * Math.min(1, des / 100) * 0.55);
    return out;
  };
  return sim;
}

// src/basetargets.json
var basetargets_default = { targets: [{ id: 1, type: "wall", ringId: "outer", seg: 0, x: -34, z: -47, w: 29.408498393145962, d: 4.2, h: 9.5, rot: 0.4124104415973873, a: [-47.471405755669956, -41.1062599818944], b: [-20.52859424433004, -52.8937400181056] }, { id: 2, type: "wall", ringId: "outer", seg: 1, x: 2.0000000000000036, z: -53, w: 34.52996878900158, d: 4.2, h: 9.5, rot: -0.049958395721942765, a: [-15.243443544697149, -53.86217217723486], b: [19.24344354469715, -52.13782782276514] }, { id: 3, type: "wall", ringId: "outer", seg: 2, x: 37, z: -42, w: 30.535512754639896, d: 4.2, h: 9.5, rot: -0.5880026035475675, a: [24.29645881237245, -50.46902745841837], b: [49.70354118762755, -33.53097254158163] }, { id: 4, type: "wall", ringId: "outer", seg: 3, x: 55, z: -11.999999999999996, w: 34.92749683231337, d: 4.2, h: 9.5, rot: -1.4219063791853994, a: [52.40941965008747, -29.2705356660835], b: [57.59058034991253, 5.270535666083504] }, { id: 5, type: "wall", ringId: "outer", seg: 4, x: 54.5598962213349, z: 14.880207557330198, w: 9.864611797498108, d: 4.2, h: 9.5, rot: -2.0344439357957027, a: [56.76569047642012, 10.468619047159768], b: [52.35410196624969, 19.291796067500634] }, { id: 6, type: "wall", ringId: "outer", seg: 4, x: 43.4401037786651, z: 37.119792442669805, w: 9.86461179749811, d: 4.2, h: 9.5, rot: -2.0344439357957027, a: [45.64589803375031, 32.70820393249937], b: [41.23430952357988, 41.53138095284024] }, { id: 7, type: "wall", ringId: "outer", seg: 5, x: 16.999999999999996, z: 49, w: 41.55440918375928, d: 4.2, h: 9.5, rot: -2.9275319700259717, a: [37.30299323557307, 44.58630581835368], b: [-3.3029932355730693, 53.41369418164632] }, { id: 8, type: "wall", ringId: "outer", seg: 6, x: -25, z: 46, w: 35.711056256176605, d: 4.2, h: 9.5, rot: 2.743070207923373, a: [-8.54371363538106, 52.92896267983955], b: [-41.45628636461894, 39.07103732016044] }, { id: 9, type: "wall", ringId: "outer", seg: 7, x: -52, z: 20, w: 33.87543120718442, d: 4.2, h: 9.5, rot: 1.9890206563741257, a: [-45.120942166307515, 35.47788012580809], b: [-58.879057833692485, 4.522119874191908] }, { id: 10, type: "wall", ringId: "outer", seg: 8, x: -55, z: -19.000000000000004, w: 37.65406628984581, d: 4.2, h: 9.5, rot: 1.3370531459259951, a: [-59.36072734463533, -0.6849451525316126], b: [-50.63927265536467, -37.31505484746839] }, { id: 11, type: "tower", ringId: "outer", seg: 0, x: -50, z: -40, w: 10.2, d: 10.2, h: 21, rot: 0, def: true }, { id: 12, type: "ballista", ringId: "outer", seg: 1, x: -18, z: -54, w: 10.2, d: 10.2, h: 19, rot: 0, def: true, wk: "ballista" }, { id: 13, type: "tower", ringId: "outer", seg: 2, x: 22, z: -52, w: 10.2, d: 10.2, h: 19, rot: 0, def: true, wk: "frost" }, { id: 14, type: "ballista", ringId: "outer", seg: 3, x: 52, z: -32, w: 10.2, d: 10.2, h: 21, rot: 0, def: true, wk: "cannon" }, { id: 15, type: "tower", ringId: "outer", seg: 4, x: 58, z: 8, w: 10.2, d: 10.2, h: 19, rot: 0, def: true, wk: "wizard" }, { id: 16, type: "ballista", ringId: "outer", seg: 5, x: 40, z: 44, w: 10.2, d: 10.2, h: 19, rot: 0, def: true, wk: "dragonbane" }, { id: 17, type: "tower", ringId: "outer", seg: 6, x: -6, z: 54, w: 10.2, d: 10.2, h: 21, rot: 0, def: true, wk: "flame" }, { id: 18, type: "ballista", ringId: "outer", seg: 7, x: -44, z: 38, w: 10.2, d: 10.2, h: 19, rot: 0, def: true, wk: "quad" }, { id: 19, type: "tower", ringId: "outer", seg: 8, x: -60, z: 2, w: 10.2, d: 10.2, h: 19, rot: 0, def: true }, { id: 20, type: "wall", ringId: "inner", seg: 0, x: -28, z: -35.5, w: 22.20075756488817, d: 3.2, h: 7.5, rot: 0.4297622790966885, a: [-38.090963871922, -30.87497489203575], b: [-17.909036128077997, -40.12502510796425] }, { id: 21, type: "wall", ringId: "inner", seg: 1, x: -7.500000000000002, z: -34, w: 17.82271554554524, d: 3.2, h: 7.5, rot: -0.6889243882148613, a: [-14.378946505204196, -39.66501476899169], b: [-0.621053494795806, -28.33498523100831] }, { id: 22, type: "wall", ringId: "inner", seg: 2, x: -0.15518253732038545, z: -23.14939154226538, w: 3.8403065089105506, d: 3.2, h: 7.5, rot: -1.8622531212727638, a: [0.39656944031067465, -24.988564801035583], b: [-0.7069345149514457, -21.310218283495182] }, { id: 23, type: "wall", ringId: "inner", seg: 2, x: -3.8448174626796137, z: -10.85060845773462, w: 3.8403065089105493, d: 3.2, h: 7.5, rot: -1.8622531212727638, a: [-3.2930654850485537, -12.68978171650482], b: [-4.396569440310674, -9.01143519896442] }, { id: 24, type: "wall", ringId: "inner", seg: 3, x: -17, z: -4.5, w: 20.315301344262522, d: 3.2, h: 7.5, rot: -2.936197264400026, a: [-7.055858881448971, -6.571696066364797], b: [-26.94414111855103, -2.4283039336352026] }, { id: 25, type: "wall", ringId: "inner", seg: 4, x: -37, z: -8.499999999999998, w: 16.4155281280883, d: 3.2, h: 7.5, rot: 2.459276098715045, a: [-30.62983940024416, -3.324244512698378], b: [-43.37016059975584, -13.67575548730162] }, { id: 26, type: "wall", ringId: "inner", seg: 5, x: -42.5, z: -22.5, w: 11.611388300841899, d: 3.2, h: 7.5, rot: 1.2490457723982544, a: [-44.33592169136464, -16.99223492590608], b: [-40.66407830863536, -28.007765074093925] }, { id: 27, type: "tower", ringId: "inner", seg: 0, x: -40, z: -30, w: 8, d: 8, h: 19, rot: 0, def: true }, { id: 28, type: "tower", ringId: "inner", seg: 1, x: -16, z: -41, w: 8, d: 8, h: 17, rot: 0, def: true, wk: "frost" }, { id: 29, type: "tower", ringId: "inner", seg: 2, x: 1, z: -27, w: 8, d: 8, h: 17, rot: 0, def: true, wk: "wizard" }, { id: 30, type: "tower", ringId: "inner", seg: 3, x: -5, z: -7, w: 8, d: 8, h: 19, rot: 0, def: true, wk: "flame" }, { id: 31, type: "tower", ringId: "inner", seg: 4, x: -29, z: -2, w: 8, d: 8, h: 17, rot: 0, def: true }, { id: 32, type: "tower", ringId: "inner", seg: 5, x: -45, z: -15, w: 8, d: 8, h: 17, rot: 0, def: true, wk: "wizard" }, { id: 33, type: "wall", ringId: "town", seg: 0, x: 146.62663953175337, z: 48.90089449448907, w: 33.456936744239286, d: 3.8, h: 8.2, rot: -2.035053907825388, a: [154.11696327099338, 33.943063623724925], b: [139.1363157925134, 63.85872536525322] }, { id: 34, type: "wall", ringId: "town", seg: 0, x: 126.98929753975017, z: 88.11576029914681, w: 33.456936744239286, d: 3.8, h: 8.2, rot: -2.035053907825388, a: [134.47962127899018, 73.15792942838266], b: [119.49897380051019, 103.07359116991096] }, { id: 35, type: "wall", ringId: "town", seg: 1, x: 85.18303629497933, z: 132.47170341085044, w: 81.39852514990982, d: 3.8, h: 8.2, rot: -2.454309980374536, a: [116.64246107762814, 106.65049959518787], b: [53.72361151233049, 158.292907226513] }, { id: 36, type: "wall", ringId: "town", seg: 2, x: 9.98980967269167, z: 155.01048310514915, w: 79.71037457463163, d: 3.8, h: 8.2, rot: 3.028375692619769, a: [49.5898361961681, 159.51313266368513], b: [-29.61021685078476, 150.5078335466132] }, { id: 37, type: "wall", ringId: "town", seg: 3, x: -74.07387813212877, z: 137.4330711143096, w: 83.40567517038515, d: 3.8, h: 8.2, rot: 2.8464646889785943, a: [-34.17406564598438, 149.5628537268491], b: [-113.97369061827318, 125.3032885017701] }, { id: 38, type: "wall", ringId: "town", seg: 4, x: -124.67264620492013, z: 107.14231967300114, w: 34.16, d: 3.8, h: 8.2, rot: 2.0215453166742825, a: [-117.23191777512515, 122.51638746373371], b: [-132.11337463471511, 91.76825188226856] }, { id: 39, type: "wall", ringId: "town", seg: 4, x: -145.30911401609396, z: 64.50315361772299, w: 34.18095810389923, d: 3.8, h: 8.2, rot: 2.0215453166742825, a: [-137.86382049380725, 79.88665382385696], b: [-152.7544075383807, 49.119653411589] }, { id: 40, type: "wall", ringId: "town", seg: 5, x: -158.39174338661175, z: 3.1852458293359476, w: 83.46147346071373, d: 3.8, h: 8.2, rot: 1.6757737267326864, a: [-154.0190009409636, 44.686251980541286], b: [-162.7644858322599, -38.31576032186939] }, { id: 41, type: "wall", ringId: "town", seg: 6, x: -151.1695115905791, z: -56.429833693409236, w: 34.78733288087872, d: 3.8, h: 8.2, rot: 0.9272970828638024, a: [-161.60568550539185, -42.5148810790074], b: [-140.73333767576634, -70.34478630781106] }, { id: 42, type: "wall", ringId: "town", seg: 6, x: -124.05717927661786, z: -92.5797505589385, w: 34.78733288087872, d: 3.8, h: 8.2, rot: 0.9272970828638024, a: [-134.49335319143063, -78.66479794453667], b: [-113.6210053618051, -106.49470317334033] }, { id: 43, type: "wall", ringId: "town", seg: 7, x: -79.59280714202309, z: -136.08284938974657, w: 80.93596003597156, d: 3.8, h: 8.2, rot: 0.7042372628022531, a: [-110.43368172617672, -109.88174518361427], b: [-48.75193255786947, -162.28395359587887] }, { id: 44, type: "wall", ringId: "town", seg: 8, x: -4.324088584114648, z: -158.74691801500373, w: 81.20546509519345, d: 3.8, h: 8.2, rot: -0.11791988917353094, a: [-44.64485555545787, -163.52369948104413], b: [35.99667838722859, -153.9701365489633] }, { id: 45, type: "wall", ringId: "town", seg: 9, x: 76.67792720549863, z: -136.40875698909926, w: 79.46526715525053, d: 3.8, h: 8.2, rot: -0.42340038435437855, a: [40.45379952817977, -152.7334237554114], b: [112.90205488281751, -120.08409022278713] }, { id: 46, type: "wall", ringId: "town", seg: 10, x: 121.40250126153873, z: -105.24343268253509, w: 25.859999999999996, d: 3.8, h: 8.2, rot: -1.1406912831834881, a: [116.01112724595738, -116.99579356127406], b: [126.79387527712008, -93.4910718037961] }, { id: 47, type: "wall", ringId: "town", seg: 10, x: 140.63947682852438, z: -63.309803439726636, w: 40.01113287346421, d: 3.8, h: 8.2, rot: -1.1406912831834881, a: [132.29783018861843, -81.49330199719483], b: [148.98112346843033, -45.12630488225844] }, { id: 48, type: "wall", ringId: "town", seg: 11, x: 152.56077205145692, z: -5.574342398965513, w: 70.35112788389881, d: 3.8, h: 8.2, rot: -1.5013306809358689, a: [150.11924347935246, -40.665071044375104], b: [155.00230062356138, 29.516386246444064] }, { id: 49, type: "ballista", ringId: "town", seg: 0, x: 155.1647195365361, z: 31.850742709520805, w: 8.8, d: 8.8, h: 19.7, rot: 0, def: true, wk: "ballista" }, { id: 50, type: "tower", ringId: "town", seg: 1, x: 118.45121753496745, z: 105.16591208411508, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true }, { id: 51, type: "ballista", ringId: "town", seg: 2, x: 51.91485505499117, z: 159.77749473758578, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true, wk: "cannon" }, { id: 52, type: "ballista", ringId: "town", seg: 3, x: -31.935235709607834, z: 150.24347147271254, w: 8.8, d: 8.8, h: 19.7, rot: 0, def: true, wk: "dragonbane" }, { id: 53, type: "tower", ringId: "town", seg: 4, x: -116.21252055464973, z: 124.62267075590667, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true, wk: "frost" }, { id: 54, type: "ballista", ringId: "town", seg: 5, x: -153.7738047588561, z: 47.01337011941604, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true, wk: "quad" }, { id: 55, type: "ballista", ringId: "town", seg: 6, x: -163.0096820143674, z: -40.64287846074414, w: 8.8, d: 8.8, h: 19.7, rot: 0, def: true, wk: "ballista" }, { id: 56, type: "tower", ringId: "town", seg: 7, x: -112.21700885282957, z: -108.3667057916036, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true, wk: "wizard" }, { id: 57, type: "ballista", ringId: "town", seg: 8, x: -46.96860543121661, z: -163.79899298788956, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true, wk: "cannon" }, { id: 58, type: "ballista", ringId: "town", seg: 9, x: 38.32042826298733, z: -153.69484304211787, w: 8.8, d: 8.8, h: 19.7, rot: 0, def: true, wk: "dragonbane" }, { id: 59, type: "tower", ringId: "town", seg: 10, x: 115.03542614800995, z: -119.12267093608064, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true, wk: "flame" }, { id: 60, type: "ballista", ringId: "town", seg: 11, x: 149.95682456637775, z: -42.999427507451834, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true, wk: "quad" }, { id: 61, type: "gate", ringId: "town", x: 136.80796853575177, z: 68.50832739681795, w: 24, d: 7.6, h: 17, rot: -2.035053907825388, a: [142.181077589817, 57.778476554745524], b: [131.43485948168654, 79.23817823889037] }, { id: 62, type: "gate", ringId: "town", x: -137.61334543359848, z: -74.50479212617387, w: 24, d: 7.6, h: 17, rot: 0.9272970828638024, a: [-144.81332753090894, -64.9047786991828], b: [-130.41336333628803, -84.10480555316494] }, { id: 63, type: "gate", ringId: "outer", x: 49, z: 26, w: 26, d: 8.6, h: 25, rot: -2.0344439357957027, a: [54.81377674149945, 14.372446517001094], b: [43.18622325850055, 37.627553482998906] }, { id: 64, type: "keep", x: -21, z: -20, w: 26, d: 18, h: 48, rot: 0.35, def: true, keep: true }, { id: 65, type: "church", x: -31.360291253840636, z: 87.07175316760856, w: 24, d: 24, h: 28, rot: 0, n: 1, share: 2.4 }, { id: 66, type: "house", x: 129.67133634039365, z: 36.55136535255299, w: 10.457003697939228, d: 10.457003697939214, h: 13.600000000000001, rot: 0, n: 1, share: 0.66 }, { id: 67, type: "house", x: 107.68893976448364, z: 87.18053369079571, w: 11.068305344600219, d: 25.142902462183685, h: 13.600000000000001, rot: 0, n: 2, share: 0.82 }, { id: 68, type: "house", x: 93.97286882830458, z: 99.35650815828065, w: 23.50941255139776, d: 18.42008732793252, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 69, type: "house", x: 78.79984738942284, z: 110.32164575038136, w: 8.949962449725717, d: 8.949962449725717, h: 7.2, rot: 0, n: 1, share: 0.66 }, { id: 70, type: "house", x: 65.40027434971829, z: 114.11608971062513, w: 20.199870448290163, d: 28.857047426056084, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 71, type: "house", x: 55.08626623123704, z: 130.82313279877417, w: 9.763325743749746, d: 9.763325743749746, h: 10.4, rot: 0, n: 1, share: 0.66 }, { id: 72, type: "house", x: 41.593523163454186, z: 138.56913914909333, w: 22.986515270696014, d: 10.825811228621774, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 73, type: "house", x: 60.247096983883, z: 92.2139754602533, w: 23.481217525375655, d: 20.077240330025404, h: 7.2, rot: 0, n: 2, share: 0.82 }, { id: 74, type: "house", x: 41.465112398496345, z: 116.99529759561281, w: 22.004167719529292, d: 18.31528157358194, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 75, type: "house", x: 14.906721788030433, z: 135.270372723714, w: 31.656608407245432, d: 13.437500814273022, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 76, type: "house", x: -14.416445121097576, z: 134.2304426804257, w: 28.92711000202082, d: 18.142394945081918, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 77, type: "house", x: -36.620689882675606, z: 116.40084568368256, w: 29.19421599000972, d: 30.958436551146832, h: 10.4, rot: 0, n: 5, share: 1.3 }, { id: 78, type: "house", x: 13.602631678069747, z: 116.61752894249358, w: 29.726327717288132, d: 13.526066980986357, h: 13.600000000000001, rot: 0, n: 3, share: 0.98 }, { id: 79, type: "house", x: -13.691481648790262, z: 113.12712049019737, w: 20.440085911210822, d: 9.783700501919682, h: 7.2, rot: 0, n: 2, share: 0.82 }, { id: 80, type: "house", x: -66.98695286517577, z: 118.66298745790945, w: 30.457205575896396, d: 14.939344673451572, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 81, type: "house", x: -91.29314546183079, z: 111.76216721701614, w: 18.354526736190735, d: 10.753997683152562, h: 13.600000000000001, rot: 0, n: 2, share: 0.82 }, { id: 82, type: "house", x: -62.56043579942549, z: 94.35345809603672, w: 29.22341469233347, d: 27.753046984516672, h: 10.4, rot: 0, n: 5, share: 1.3 }, { id: 83, type: "house", x: -88.33186901991756, z: 89.83243942792782, w: 19.265429290124302, d: 20.43860835161088, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 84, type: "house", x: -106.83555614570251, z: 98.75885389329113, w: 10.022023649327451, d: 10.022023649327451, h: 10.4, rot: 0, n: 1, share: 0.66 }, { id: 85, type: "house", x: -123.72296921594545, z: 61.26761148908251, w: 10.069964653346688, d: 10.069964653346688, h: 7.2, rot: 0, n: 1, share: 0.66 }, { id: 86, type: "house", x: -128.1035480001183, z: 50.75042538139281, w: 9.867044161539525, d: 9.867044161539525, h: 7.2, rot: 0, n: 1, share: 0.66 }, { id: 87, type: "house", x: -133.62726605472017, z: 34.33173486841052, w: 12.378882747011204, d: 22.353201573323577, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 88, type: "house", x: -136.23789857273454, z: 12.309316249756224, w: 10.998449844960135, d: 21.44318445915989, h: 7.2, rot: 0, n: 2, share: 0.82 }, { id: 89, type: "house", x: -139.62769221998605, z: -14.42758450953259, w: 12.19156894419578, d: 31.469042986396964, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 90, type: "house", x: -137.75250532669065, z: -43.509646322909, w: 24.969027098087594, d: 23.18085363452556, h: 7.2, rot: 0, n: 3, share: 0.98 }, { id: 91, type: "house", x: -108.41459056844097, z: -77.55928199027302, w: 8.270704142004263, d: 8.270704142004263, h: 7.2, rot: 0, n: 1, share: 0.66 }, { id: 92, type: "house", x: -96.1387447936488, z: -91.31471385199993, w: 19.284844898185327, d: 20.648117242512654, h: 7.2, rot: 0, n: 2, share: 0.82 }, { id: 93, type: "house", x: 34.88113784065823, z: 92.1700184104862, w: 20.45903161864113, d: 26.56629803737978, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 94, type: "house", x: 46.321779204508054, z: 69.37765992349586, w: 9.701111826300618, d: 9.701111826300632, h: 7.2, rot: 0, n: 1, share: 0.66 }, { id: 95, type: "house", x: 10.945861873637591, z: 92.00944984100514, w: 30.805146543398276, d: 29.13045831385709, h: 7.2, rot: 0, n: 5, share: 1.3 }, { id: 96, type: "house", x: -5.991430381111417, z: 87.39321667707931, w: 15.427400623418528, d: 23.666097015243707, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 97, type: "house", x: -81.2986439983803, z: 73.32945984915197, w: 10.196716730482876, d: 10.196716730482876, h: 10.4, rot: 0, n: 1, share: 0.66 }, { id: 98, type: "house", x: -85.37487773053225, z: 6.634690535029938, w: 9.622425997676316, d: 9.622425997676327, h: 7.2, rot: 0, n: 1, share: 0.66 }, { id: 99, type: "house", x: -43.82250657079123, z: -72.0237284410061, w: 14.45098618366599, d: 14.307430639148663, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 100, type: "house", x: 92.34812171875677, z: -46.21193630013816, w: 24.64630415348259, d: 19.619155568733426, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 101, type: "house", x: 126.00447964392573, z: -41.254079497718166, w: 12.878844400544068, d: 22.94450195019546, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 102, type: "house", x: 105.5286428731935, z: -94.66873590988754, w: 7.682426322996605, d: 7.682426322996605, h: 7.2, rot: 0, n: 1, share: 0.66 }, { id: 103, type: "house", x: 138.70811833996055, z: -6.034212232822055, w: 9.075423459522426, d: 17.5645272290487, h: 7.2, rot: 0, n: 2, share: 0.82 }, { id: 104, type: "house", x: -84.94081768923384, z: -6.101804770091277, w: 6.423118339478975, d: 6.423118339478969, h: 10.4, rot: 0, n: 1, share: 0.66 }, { id: 105, type: "house", x: 84.64799329245879, z: -119.09822117873745, w: 17.180353207662023, d: 14.147722303560059, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 106, type: "house", x: 136.0357037639618, z: 11.648790601498813, w: 19.396481774328464, d: 9.845903752323997, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 107, type: "house", x: 13.44174008863923, z: -135.1293697196925, w: 19.223415202193717, d: 10.855454007334174, h: 7.2, rot: 0, n: 2, share: 0.82 }, { id: 108, type: "house", x: 63.76587178090183, z: -126.34600305774528, w: 7.280936265736813, d: 7.280936265736813, h: 10.4, rot: 0, n: 1, share: 0.66 }, { id: 109, type: "house", x: 37.935457331798474, z: -134.17022370807, w: 20.959335342995466, d: 10.118623253543433, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 110, type: "house", x: -55.65907517513428, z: -131.03513290723245, w: 8.7680520310998, d: 8.768052031099785, h: 7.2, rot: 0, n: 1, share: 0.66 }, { id: 111, type: "house", x: -71.4212888564677, z: -127.00096559120493, w: 9.149089882709092, d: 9.149089882709077, h: 10.4, rot: 0, n: 1, share: 0.66 }, { id: 112, type: "house", x: -17.92109252000406, z: -144.18511978618898, w: 21.314095766120523, d: 8.951933766849237, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 113, type: "house", x: -89.56769941560378, z: -109.95697278696618, w: 20.652302167374344, d: 14.280229369889668, h: 7.2, rot: 0, n: 2, share: 0.82 }, { id: 114, type: "house", x: -112.65528397509664, z: -89.49294389128148, w: 14.45010143913369, d: 15.245903943401316, h: 7.2, rot: 0, n: 2, share: 0.82 }, { id: 115, type: "house", x: 52.68448218653003, z: -130.33204341171142, w: 8.690888940915471, d: 8.690888940915457, h: 10.4, rot: 0, n: 1, share: 0.66 }, { id: 116, type: "house", x: 139.77128580490864, z: -34.04320931399524, w: 7.613397068388338, d: 17.62259595935576, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 117, type: "house", x: -38.71000850382706, z: 135.40933171553615, w: 7.188924922794101, d: 7.188924922794115, h: 7.2, rot: 0, n: 1, share: 0.66 }, { id: 118, type: "house", x: 128.33969621769714, z: -62.72362900979195, w: 8.388339537940908, d: 8.388339537940915, h: 10.4, rot: 0, n: 1, share: 0.66 }, { id: 119, type: "house", x: -41.53073719494023, z: -142.55968595416618, w: 8.806745801307258, d: 8.806745801307272, h: 10.4, rot: 0, n: 1, share: 0.66 }, { id: 120, type: "house", x: 104.0140046048377, z: -109.64608001264766, w: 6.8438532120548246, d: 6.8438532120548246, h: 7.2, rot: 0, n: 1, share: 0.66 }, { id: 121, type: "house", x: -261.1945871997762, z: -88.50287021031748, w: 22.85120781307262, d: 30.10436119643299, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 122, type: "house", x: 132.75431363900725, z: -161.53772604413052, w: 26.526244727926056, d: 33.93143243832961, h: 10.4, rot: 0, n: 4, share: 1.14 }, { id: 123, type: "house", x: -94.45076999579877, z: 180.5247576684368, w: 26.502000413723295, d: 35.14168540837406, h: 10.4, rot: 0, n: 4, share: 1.14 }, { id: 124, type: "house", x: -35.14819888095466, z: 233.38878656651843, w: 25.374858946175227, d: 34.88401512088885, h: 10.4, rot: 0, n: 4, share: 1.14 }, { id: 125, type: "house", x: 29.554993569807582, z: -225.0349410615244, w: 20.307144076560242, d: 34.461454300903085, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 126, type: "house", x: 180.74713042758162, z: -64.46162931574179, w: 25.529765992241522, d: 38.44801421417655, h: 10.4, rot: 0, n: 4, share: 1.14 }, { id: 127, type: "house", x: -222.81014220076958, z: -166.5229903262426, w: 19.679022914705598, d: 32.304952515288164, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 128, type: "house", x: -238.9612616211685, z: 148.3046962292276, w: 31.766303799875345, d: 22.670466356610092, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 129, type: "mine", gem: "ruby", x: 138.0246394590519, z: -259.5865923005245, w: 24, d: 28, h: 18, rot: 1.0821041362364843 }, { id: 130, type: "mine", gem: "emerald", x: -286.8914267889107, z: 87.71151141682098, w: 24, d: 28, h: 18, rot: -2.844886680750757 }, { id: 131, type: "mine", gem: "turq", x: -182.23579669639477, z: -233.25118306758975, w: 24, d: 28, h: 18, rot: 2.2340214425527414 }, { id: 132, type: "forge", x: 287.7940389375449, z: 22.883856997208426, w: 20, d: 18, h: 10, rot: -0.05597468699285324 }, { id: 133, type: "stable", x: 3.076017093147705, z: 272.55781567800926, w: 30, d: 24, h: 10, rot: 1.7126933813990606 }, { id: 134, type: "workshop", x: -69.19180046483294, z: -317.7616999676319, w: 30, d: 24, h: 10, rot: 0.504578760337973 }, { id: 135, type: "lair", x: 331.9935131628547, z: 4.8822575465125695, w: 26, d: 26, h: 12, rot: -1.5855011491727482 }, { id: 136, type: "vault", gem: "ruby", x: 101.24922359499621, z: 12.583592135001265, w: 17, d: 14, h: 14, rot: -0.4636476090008062 }, { id: 137, type: "vault", gem: "emerald", x: 74.39738944613408, z: 71.28863837887725, w: 17, d: 14, h: 14, rot: 2.677945044588987 }, { id: 138, type: "vault", gem: "turq", x: 108.03219460599445, z: -13.565942021996463, w: 17, d: 14, h: 14, rot: -0.4636476090008061 }, { id: 139, type: "house", x: 13.5, z: 33.5, w: 32, d: 20, h: 11.4, rot: 0, n: 3, share: 0.98 }, { id: 140, type: "house", x: -12, z: 37, w: 9, d: 9, h: 11.4, rot: 0, n: 1, share: 0.66 }, { id: 141, type: "house", x: -28, z: 31, w: 9, d: 9, h: 8.2, rot: 0, n: 1, share: 0.66 }, { id: 142, type: "house", x: -36.5, z: 17, w: 18, d: 19, h: 11.4, rot: 0, n: 2, share: 0.82 }, { id: 143, type: "house", x: -6, z: 17, w: 9, d: 9, h: 8.2, rot: 0, n: 1, share: 0.66 }, { id: 144, type: "house", x: 30, z: -24, w: 9, d: 9, h: 11.4, rot: 0, n: 1, share: 0.66 }, { id: 145, type: "house", x: 316.66073701751014, z: -24.371535021287492, w: 9, d: 9, h: 8.2, rot: 0, n: 1, share: 0.66 }, { id: 146, type: "house", x: -124.80733405632361, z: 227.23623027374552, w: 9, d: 9, h: 8.2, rot: 0, n: 1, share: 0.66 }], meta: { gates: [{ x: 136.80796853575177, z: 68.50832739681795, nx: 0.8941542368393682, nz: 0.44775908783876955 }, { x: -137.61334543359848, z: -74.50479212617387, nx: -0.8000011189159231, nz: -0.5999985081092046 }], town: [[155.1647195365361, 31.850742709520805], [118.45121753496745, 105.16591208411508], [51.91485505499117, 159.77749473758578], [-31.935235709607834, 150.24347147271254], [-116.21252055464973, 124.62267075590667], [-153.7738047588561, 47.01337011941604], [-163.0096820143674, -40.64287846074414], [-112.21700885282957, -108.3667057916036], [-46.96860543121661, -163.79899298788956], [38.32042826298733, -153.69484304211787], [115.03542614800995, -119.12267093608064], [149.95682456637775, -42.999427507451834]], keep: { x: -21, z: -20 }, deploy: { d: 44, lat: 0 } } };

// src/layout.js
var layout_exports = {};
__export(layout_exports, {
  CAMP: () => CAMP,
  FARMS: () => FARMS,
  FIELDS: () => FIELDS,
  FIELDS2: () => FIELDS2,
  GATE: () => GATE,
  GATE_SEG: () => GATE_SEG,
  GROW: () => GROW,
  INNER: () => INNER,
  INNER_GATE_SEG: () => INNER_GATE_SEG,
  KEEP: () => KEEP,
  LAIR: () => LAIR,
  LAKE: () => LAKE,
  MAP: () => MAP,
  MINES: () => MINES,
  MOAT: () => MOAT,
  MOAT2: () => MOAT2,
  MOUNT: () => MOUNT,
  MUSTER: () => MUSTER,
  NOISE: () => NOISE,
  OUTER: () => OUTER,
  PADS: () => PADS,
  PASTURE: () => PASTURE,
  PLAZA: () => PLAZA,
  PUSH: () => PUSH,
  RBRIDGES: () => RBRIDGES,
  RING_ORDER: () => RING_ORDER,
  RING_STEP: () => RING_STEP,
  RIVER: () => RIVER,
  SITES: () => SITES,
  STREAMS: () => STREAMS,
  TGATES: () => TGATES,
  TOWN: () => TOWN,
  TOWN_GATES: () => TOWN_GATES,
  WALL: () => WALL,
  WGATES: () => WGATES,
  WINDMILL: () => WINDMILL,
  WS_SITES: () => WS_SITES,
  addBridge: () => addBridge,
  distPolyline: () => distPolyline,
  fieldD: () => fieldD,
  height: () => height,
  inside: () => inside,
  mineLocal: () => mineLocal,
  nearMine: () => nearMine,
  ringsAt: () => ringsAt,
  sdPoly: () => sdPoly,
  sdTown: () => sdTown,
  segMid: () => segMid,
  segNormalOut: () => segNormalOut,
  setMap: () => setMap,
  stableAt: () => stableAt,
  stableYard: () => stableYard,
  streamD: () => streamD,
  withRiver: () => withRiver,
  withoutPads: () => withoutPads
});

// src/noise.js
function rng(seed = 1) {
  let s = seed >>> 0;
  return function() {
    s |= 0;
    s = s + 1831565813 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var F2 = 0.5 * (Math.sqrt(3) - 1);
var G2 = (3 - Math.sqrt(3)) / 6;
var GRAD = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
function makeNoise(seed = 7) {
  const r = rng(seed), p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = r() * (i + 1) | 0;
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  function n2(x, y) {
    const s = (x + y) * F2, i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G2, x0 = x - (i - t), y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n3 = 0, tt, g;
    tt = 0.5 - x0 * x0 - y0 * y0;
    if (tt > 0) {
      g = GRAD[perm[ii + perm[jj]] & 7];
      tt *= tt;
      n3 += tt * tt * (g[0] * x0 + g[1] * y0);
    }
    tt = 0.5 - x1 * x1 - y1 * y1;
    if (tt > 0) {
      g = GRAD[perm[ii + i1 + perm[jj + j1]] & 7];
      tt *= tt;
      n3 += tt * tt * (g[0] * x1 + g[1] * y1);
    }
    tt = 0.5 - x2 * x2 - y2 * y2;
    if (tt > 0) {
      g = GRAD[perm[ii + 1 + perm[jj + 1]] & 7];
      tt *= tt;
      n3 += tt * tt * (g[0] * x2 + g[1] * y2);
    }
    return 70 * n3;
  }
  function fbm(x, y, oct = 5, lac = 2, gain = 0.5) {
    let a = 1, f = 1, s = 0, norm = 0;
    for (let o = 0; o < oct; o++) {
      s += a * n2(x * f, y * f);
      norm += a;
      a *= gain;
      f *= lac;
    }
    return s / norm;
  }
  function ridged(x, y, oct = 5) {
    let a = 0.5, f = 1, s = 0, w = 1;
    for (let o = 0; o < oct; o++) {
      let v = 1 - Math.abs(n2(x * f, y * f));
      v *= v;
      v *= w;
      w = Math.min(1, Math.max(0, v * 2));
      s += v * a;
      a *= 0.5;
      f *= 2.05;
    }
    return s;
  }
  return { n2, fbm, ridged };
}
var clamp = (v, a, b) => v < a ? a : v > b ? b : v;
var lerp = (a, b, t) => a + (b - a) * t;
function smooth(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

// src/layout.js
var NOISE = makeNoise(20261001);
var WALL = { outer: { H: 9.5, T: 4.2, R: 4.6 }, inner: { H: 7.5, T: 3.2, R: 3.5 }, town: { H: 8.2, T: 3.8, R: 3.9 } };
var RING_ORDER = ["inner", "outer", "town"];
var RING_STEP = 10;
var ringsAt = (lv2) => {
  const n2 = Math.max(1, Math.min(3, 1 + Math.floor((Math.max(1, Math.min(30, Math.round(+lv2) || 1)) - 1) / RING_STEP)));
  const has = { inner: !!INNER, outer: true, town: !!TOWN };
  return RING_ORDER.filter((r) => has[r]).slice(0, n2);
};
var MAP = "night";
var DEG = Math.PI / 180;
var ring = (pts) => pts.map(([a, r]) => [Math.cos(a * DEG) * r, Math.sin(a * DEG) * r]);
var polar = (a, r) => [Math.cos(a * DEG) * r, Math.sin(a * DEG) * r];
var GROW = 1.2;
var PUSH = 60;
var pushXZ = ([x, z]) => {
  const r = Math.hypot(x, z) || 1, k = (r + PUSH) / r;
  return [x * k, z * k];
};
var pushO = (o) => {
  const [x, z] = pushXZ([o.x, o.z]);
  return { ...o, x, z };
};
var LAKE_N = pushO({ x: -128, z: 196, r: 40 });
var NIGHT = {
  OUTER: [[-50, -40], [-18, -54], [22, -52], [52, -32], [58, 8], [40, 44], [-6, 54], [-44, 38], [-60, 2]],
  GATE_SEG: 4,
  INNER: [[-40, -30], [-16, -41], [1, -27], [-5, -7], [-29, -2], [-45, -15]],
  INNER_GATE_SEG: 2,
  // the lower town's wall (third ring): main gate in line with the Blue Wall gate, west gate toward lake & mines
  TOWN: ring([[11.6, 132], [41.6, 132], [72, 140], [102, 128], [133, 142], [163, 134], [194, 140], [224, 130], [254, 142], [284, 132], [314, 138], [344, 130]].map(([a, r]) => [a, r * GROW])),
  TOWN_GATES: [0, 6],
  KEEP: { x: -21, z: -20, rot: 0.35 },
  PLAZA: { x: 12, z: 6, r: 9 },
  MOAT: { off: 10, half: 4.2, level: -0.75, on: false },
  MOAT2: { off: 13, half: 5 },
  WINDMILL: pushO({ x: 236, z: 34 }),
  FIELDS: pushO({ x: 206, z: -22, w: 66, d: 44, rot: 0.12 }),
  FIELDS2: pushO({ x: 150, z: 168, w: 52, d: 36, rot: -0.75 }),
  LAKE: LAKE_N,
  // p38: the river does not stop at the town moat any more: it runs on THROUGH the town (in at the NE wall, a water gate, square under the ring street, round the north between the two ring streets, out through a second water gate in the WSW wall) and on to the lake.
  // (points 0..4 are the old river, pushed with the rest of the map; from point 5 on the numbers are absolute — dev/p38/rivertown.mjs computes them from the real streets: >= 11 m between the river's centre and both ring streets, every crossing square)
  RIVER: [[492, -282], [396, -258], [304, -228], [250, -166], [186, -138]].map(pushXZ).concat([
    [168, -119.7],
    [156.5, -110.1],
    [145, -100.4],
    [134.2, -91.4],
    [123.3, -82.1],
    [112.3, -72.9],
    [101.5, -64],
    [89.1, -67.2],
    [80.1, -78.3],
    [69.8, -88.3],
    [57, -96.5],
    [43.3, -102.4],
    [29, -106.9],
    [14.5, -111.7],
    [-0.5, -114.5],
    [-14.6, -114.8],
    [-29.5, -111.2],
    [-43.6, -104.7],
    [-56.3, -96.1],
    [-67.2, -86],
    [-77.1, -75],
    [-87.8, -65],
    [-98.4, -54],
    [-107.3, -42.9],
    [-112.5, -28.5],
    [-114.1, -14.4],
    [-113.6, 1],
    [-111.3, 16],
    [-107.4, 30.6],
    [-103.1, 44.8],
    [-98.6, 58.2],
    [-103.1, 70.3],
    [-116.3, 76.8],
    [-129.3, 83.1],
    [-142.2, 89.3],
    [-155.7, 93.7],
    [-157.2, 107.4],
    [-153.3, 122.3],
    [-151.7, 136.9],
    [-150, 152]
  ]).concat([[LAKE_N.x - 4, LAKE_N.z - LAKE_N.r - 22], [LAKE_N.x - 2, LAKE_N.z - LAKE_N.r - 10], [LAKE_N.x + 3, LAKE_N.z - LAKE_N.r + 4]]),
  // (the last stretch follows the lake, wherever PUSH puts it)
  // the two water gates in the town wall: wall segment, distance of the gate's middle from the segment's first corner, half width of the opening
  WGATES: [{ seg: 10, c: 34.8, half: 6.6 }, { seg: 4, c: 43.1, half: 6.6 }],
  // stone bridges over the river (where the farm road to the ruby mine crosses it): centre, direction of travel (unit), length, width
  RBRIDGES: [],
  // (p38: roads.js adds a bridge wherever a road meets the river — see autoBridges)
  // A2-STREAMS-BEGIN
  // A2 (owner 6 Oct 2026: «ساعت ۲ ... از بالا کوه از وسط کوه پایین و بیاد تو خندق» — «هر دو! ولی رود ۱ عریض‌تر»): two streams from the mountain at the 2 o'clock of the home camera. Each one runs down its own gorge with its own waterfall
  // (falls.js draws it from pts[0..1], like RIVER[0..1]), across the north plain and into the moat. k = width scale of the bed / banks / clearance (1 = like the p38 river). Planned OFFLINE by dev/a2_plan.mjs
  // (A* over the real terrain, clear of camp / quarry / mines / hamlets and their spurs / nomads, and of each other) and frozen here; roads.js bridges every road a stream meets.
  STREAMS: [
    { id: "stream_w", kind: "stream", k: 1.8, pts: [
      [-157, -411],
      [-155.7, -402],
      [-154.3, -393],
      [-154, -382],
      [-144.2, -383.7],
      [-134.2, -383.1],
      [-124.3, -382.7],
      [-114.7, -383.3],
      [-104.5, -383.2],
      [-93.2, -379.3],
      [-83.8, -370.9],
      [-79.5, -360],
      [-80.2, -349.8],
      [-83.5, -340.3],
      [-87, -329.8],
      [-89, -318.9],
      [-89.6, -309.4],
      [-90.9, -301.6],
      [-93.3, -293.1],
      [-97, -283.4],
      [-101.9, -273.6],
      [-105.9, -265.2],
      [-107.4, -257.7],
      [-108.3, -249.5],
      [-109.3, -240.2],
      [-110.9, -229.7],
      [-111.9, -218.1],
      [-108.4, -206.6],
      [-100.1, -199.7],
      [-91.7, -194.7],
      [-83.5, -188.9],
      [-76.2, -182],
      [-69, -175.1],
      [-61.8, -168.2]
    ] },
    { id: "stream_e", kind: "stream", k: 1, pts: [
      [-92, -430],
      [-90.8, -422.5],
      [-89.5, -415],
      [-88.3, -407.5],
      [-86, -398],
      [-79.2, -405.3],
      [-71.3, -410.9],
      [-62.3, -412.8],
      [-53.4, -410],
      [-44.7, -405.1],
      [-36.3, -399.1],
      [-28.7, -391.9],
      [-22.7, -383.3],
      [-19.2, -373.6],
      [-18.7, -363.5],
      [-19.4, -353.4],
      [-18.6, -342.7],
      [-14.2, -332.9],
      [-7.3, -325.1],
      [0.4, -318.8],
      [8.5, -312.8],
      [16.4, -306.1],
      [23.1, -297.7],
      [26.5, -287.5],
      [25.6, -277.1],
      [21.9, -267.8],
      [16.8, -259.2],
      [10.9, -251],
      [5.5, -242.4],
      [1.4, -233.2],
      [-1.3, -223.6],
      [-2.2, -213.8],
      [0.2, -204.7],
      [5.3, -196.9],
      [11.6, -190.1],
      [18.8, -184],
      [27.4, -179.4],
      [37.2, -176.5],
      [47.5, -175.2],
      [57.6, -175],
      [67.2, -175],
      [76.6, -173.6],
      [85.9, -169.9],
      [94.2, -163.7],
      [101.1, -156.2],
      [107.1, -148.2],
      [113, -140.3],
      [119.5, -132.7],
      [121.5, -130.4]
    ] }
  ],
  // A2-STREAMS-END
  PASTURE: pushO({ x: 46, z: 206, r: 30, fr: 44 }),
  CAMP: pushO({ x: -34, z: -212, r: 30, fr: 46 }),
  MUSTER: pushO({ x: 215, z: 60, r: 34, fr: 66 }),
  LAIR: pushO({ x: 272, z: 4, r: 24 }),
  MINES: [
    { id: "ruby", ...xz(polar(-62, 238 + PUSH)), a: -62 },
    { id: "emerald", ...xz(polar(163, 244 + PUSH)), a: 163 },
    { id: "turq", ...xz(polar(232, 240 + PUSH)), a: 232 }
  ],
  MOUNT: 445 + PUSH
};
var WS_SITES = [
  { id: "lumber1", kind: "lumber", x: 241, z: -232.7, ry: -1.02, r: 24, link: [159.1, -182.4] },
  { id: "lumber2", kind: "lumber", x: -253.4, z: 228.2, ry: 1.938, r: 24, link: [-137.9, 183.8] },
  { id: "oil", kind: "oil", x: -310.6, z: -125.5, ry: 0.963, r: 26, link: [-213.2, -57.7] },
  { id: "quarry", kind: "quarry", x: 37.5, z: -357, ry: 0.787, r: 24, link: [137.1, -257.8] },
  { id: "iron", kind: "iron", x: 249.4, z: 258.2, ry: -2.058, r: 22, link: [160, 210.8] },
  { id: "gold", kind: "gold", x: 353.5, z: -62.3, ry: -1.65, r: 22, link: [226.7, -72.4] },
  { id: "farm", kind: "farm", x: 243.8, z: -98.5, ry: -1.02, r: 26, link: [219.7, -83.7] },
  { id: "greenhouse", kind: "greenhouse", x: 133.4, z: 183.6, ry: 1.563, r: 20, link: [160.1, 183.8] },
  { id: "livestock", kind: "livestock", x: -20.9, z: 298.3, ry: 1.925, r: 26, link: [97.1, 254.6] },
  { id: "slaughter", kind: "slaughter", x: -75.8, z: 264.3, ry: -2.417, r: 18, link: [-130.8, 202.2] },
  { id: "fishery_lake", kind: "fishery", x: -123.3, z: 280, ry: -2.304, r: 22, link: [-130.8, 202.2], water: [-160.8, 246.2] },
  { id: "fishery_river", kind: "fishery", x: 189.3, z: -169.3, ry: 0.686, r: 22, link: [173.2, -159.5], water: [205.1, -150] }
];
function xz([x, z]) {
  return { x, z };
}
var S = 46;
var T3 = S / 3;
var DAY = {
  OUTER: [[-S, -S], [-T3, -S], [T3, -S], [S, -S], [S, -T3], [S, T3], [S, S], [T3, S], [-T3, S], [-S, S], [-S, T3], [-S, -T3]],
  GATE_SEG: 7,
  INNER: null,
  INNER_GATE_SEG: -1,
  KEEP: { x: 0, z: 0, rot: 0 },
  PLAZA: { x: 0, z: 0, r: 0 },
  MOAT: { off: 10, half: 4.2, level: -0.75, on: false },
  WINDMILL: { x: 112, z: 58 },
  FIELDS: { x: 118, z: 96, w: 40, d: 28, rot: 0.6 },
  LAKE: { x: 150, z: -150, r: 34 },
  RIVER: [[-420, -40], [-300, -20], [-200, -60], [-140, -120], [-90, -190], [-60, -300], [-40, -420]]
};
function withoutPads(fn) {
  const keep = PADS, dirty = PAD_DIRTY;
  PADS = [];
  PAD_DIRTY = false;
  try {
    return fn();
  } finally {
    PADS = keep;
    PAD_DIRTY = dirty;
  }
}
var addBridge = (b) => {
  if (!RBRIDGES.some((q) => Math.hypot(q.x - b.x, q.z - b.z) < 6)) RBRIDGES.push(b);
};
var OUTER;
var GATE_SEG;
var INNER;
var INNER_GATE_SEG;
var KEEP;
var PLAZA;
var MOAT;
var WINDMILL;
var FIELDS;
var LAKE;
var RIVER;
var GATE;
var PASTURE;
var CAMP;
var MUSTER;
var LAIR;
var RBRIDGES = [];
var WGATES = [];
var TOWN = null;
var TOWN_GATES = [];
var TGATES = [];
var MOAT2 = null;
var FIELDS2 = null;
var FARMS = [];
var MINES = [];
var MOUNT = 330;
var STREAMS = [];
var PAD_DIRTY = false;
var PADS = [];
var SITES = [];
var _SA = null;
var _SY = null;
function calcStable() {
  const P4 = PASTURE;
  _SA = _SY = null;
  if (!P4 || !(P4.r > 0)) return;
  const x = P4.x - 56, z = P4.z + 8, ry = Math.atan2(P4.x - x, P4.z - z), c = Math.cos(ry), s = Math.sin(ry);
  _SA = { x, z, ry, W: (u, v) => [x + c * u + s * v, z - s * u + c * v] };
  const [yx, yz] = _SA.W(-3, 14);
  _SY = { x: yx, z: yz, r: 27 };
}
var stableAt = () => _SA;
var stableYard = () => _SY;
function setMap(m) {
  MAP = m === "day" ? "day" : "night";
  const c = MAP === "day" ? DAY : NIGHT;
  ({ OUTER, GATE_SEG, INNER, INNER_GATE_SEG, KEEP, PLAZA, MOAT, WINDMILL, FIELDS, LAKE, RIVER } = c);
  PASTURE = c.PASTURE || { x: 1e4, z: 1e4, r: 0 };
  CAMP = c.CAMP || { x: 1e4, z: 1e4, r: 0 };
  MUSTER = c.MUSTER || { x: 1e4, z: 1e4, r: 0 };
  LAIR = c.LAIR || { x: 1e4, z: 1e4, r: 0 };
  RBRIDGES = c.RBRIDGES || [];
  WGATES = c.WGATES || [];
  STREAMS = c.STREAMS || [];
  calcStable();
  TOWN = c.TOWN || null;
  TOWN_GATES = c.TOWN_GATES || [];
  MOAT2 = c.MOAT2 || null;
  FIELDS2 = c.FIELDS2 || null;
  MINES = c.MINES || [];
  MOUNT = c.MOUNT || 330;
  FARMS = [FIELDS, FIELDS2].filter(Boolean);
  PADS = [];
  SITES = MAP === "night" && TOWN ? WS_SITES : [];
  for (const w of SITES) PADS.push({ x: w.x, z: w.z, r: w.r * (w.water ? 0.72 : 0.9), b: 16, h: null });
  PAD_DIRTY = PADS.length > 0;
  const gateOf = (poly, i) => {
    const mm = segMid(poly, i), n2 = segNormalOut(poly, i), a = poly[i], b = poly[(i + 1) % poly.length];
    return { x: mm[0], z: mm[1], nx: n2[0], nz: n2[1], rot: Math.atan2(b[0] - a[0], b[1] - a[1]), seg: i };
  };
  GATE = gateOf(OUTER, GATE_SEG);
  TGATES = TOWN ? TOWN_GATES.map((i) => gateOf(TOWN, i)) : [];
}
function segMid(poly, i) {
  const a = poly[i], b = poly[(i + 1) % poly.length];
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
function segNormalOut(poly, i) {
  const a = poly[i], b = poly[(i + 1) % poly.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
  let nx = dz / l, nz = -dx / l;
  const m = segMid(poly, i);
  if (nx * m[0] + nz * m[1] < 0) {
    nx = -nx;
    nz = -nz;
  }
  return [nx, nz];
}
setMap("night");
function segDist(px, pz, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz), 0, 1);
  return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
}
function inside(poly, x, z) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
  }
  return c;
}
function sdPoly(poly, x, z) {
  let d = 1e9;
  for (let i = 0; i < poly.length; i++) d = Math.min(d, segDist(x, z, poly[i], poly[(i + 1) % poly.length]));
  return inside(poly, x, z) ? -d : d;
}
function distPolyline(pts, x, z) {
  let d = 1e9;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(x, z, pts[i], pts[i + 1]));
  if (pts === RIVER) d = streamD(x, z, d);
  return d;
}
function streamD(x, z, best = 1e9) {
  let d = best;
  for (const S2 of STREAMS) {
    const k = S2.k || 1, ch = S2._ch || (S2._ch = streamChunks(S2.pts));
    for (const c of ch) {
      let ex = c[0] - x, ez = c[1] - z;
      if (ex < 0) {
        ex = x - c[2];
        if (ex < 0) ex = 0;
      }
      if (ez < 0) {
        ez = z - c[3];
        if (ez < 0) ez = 0;
      }
      if (ex * ex + ez * ez >= d * d * k * k) continue;
      for (let i = c[4]; i < c[5]; i++) d = Math.min(d, segDist(x, z, S2.pts[i], S2.pts[i + 1]) / k);
    }
  }
  return d;
}
function streamChunks(P4) {
  const out = [];
  for (let i = 0; i < P4.length - 1; i += 6) {
    const j = Math.min(i + 6, P4.length - 1), q = P4.slice(i, j + 1);
    out.push([Math.min(...q.map((p) => p[0])), Math.min(...q.map((p) => p[1])), Math.max(...q.map((p) => p[0])), Math.max(...q.map((p) => p[1])), i, j]);
  }
  return out;
}
function withRiver(pts, fn) {
  const keep = RIVER;
  RIVER = pts;
  try {
    return fn();
  } finally {
    RIVER = keep;
  }
}
function fieldD(x, z) {
  let d = 1e9;
  for (const F of FARMS) {
    const c = Math.cos(F.rot), s2 = Math.sin(F.rot), dx = x - F.x, dz = z - F.z;
    const lx = dx * c - dz * s2, lz = dx * s2 + dz * c;
    d = Math.min(d, Math.hypot(lx / (F.w / 2 + 8), lz / (F.d / 2 + 8)));
  }
  return d;
}
function mineLocal(M, x, z) {
  const ca = Math.cos(M.a * DEG), sa = Math.sin(M.a * DEG), dx = x - M.x, dz = z - M.z;
  return [dx * ca + dz * sa, -dx * sa + dz * ca];
}
var sdTown = (x, z) => TOWN ? sdPoly(TOWN, x, z) : 1e9;
var nearMine = (x, z, r = 40) => MINES.some((M) => {
  const c = Math.cos(M.a * DEG), s = Math.sin(M.a * DEG);
  return Math.hypot(x - (M.x - c * 8), z - (M.z - s * 8)) < r;
});
var N = NOISE;
function height(x, z) {
  if (PAD_DIRTY) {
    PAD_DIRTY = false;
    for (const P4 of PADS) P4.h = height(P4.x, P4.z);
  }
  const r = Math.hypot(x, z), sd = sdPoly(OUTER, x, z), sdT = sdTown(x, z);
  let h = N.fbm(x * 0.012, z * 0.012, 4) * 2.4 + N.fbm(x * 0.05, z * 0.05, 2) * 0.35;
  h += smooth(160, 300, r) * (N.fbm(x * 7e-3 + 5, z * 7e-3 - 3, 4) * 0.5 + 0.5) * 26;
  const ang = Math.atan2(z, x);
  const ringR = MOUNT + N.fbm(Math.cos(ang) * 1.3 + 9, Math.sin(ang) * 1.3, 3) * 70;
  const m = smooth(ringR - 150, ringR + 40, r);
  if (m > 0) {
    const wx = x + N.fbm(x * 4e-3 + 3, z * 4e-3, 3) * 70, wz = z + N.fbm(x * 4e-3, z * 4e-3 + 7, 3) * 70;
    const ridge = N.ridged(wx * 42e-4 + 2, wz * 42e-4, 6);
    const peaks = Math.pow(Math.max(0, N.fbm(wx * 22e-4 - 4, wz * 22e-4 + 1, 3) * 0.5 + 0.55), 1.6);
    const gully = N.ridged(wx * 0.016 + 11, wz * 0.016, 3);
    h += m * (36 + ridge * 170 + peaks * 150 + gully * 14 * m + N.fbm(x * 0.03, z * 0.03, 3) * 6);
  }
  if (TOWN) {
    const town = 0.45 + N.fbm(x * 0.03, z * 0.03, 2) * 0.25;
    h = lerp(town, h, smooth(4, 34, sdT));
    h = lerp(0.15 + N.fbm(x * 0.2, z * 0.2, 2) * 0.05, h, smooth(3, 16, sd));
  } else if (MAP === "day") h = lerp(0.15 + N.fbm(x * 0.05, z * 0.05, 2) * 0.25, h, smooth(12, 60, sd));
  else h = lerp(0.15 + N.fbm(x * 0.2, z * 0.2, 2) * 0.05, h, smooth(3, 22, sd));
  for (const M of MINES) {
    const [u, v] = mineLocal(M, x, z);
    if (u > -40 && u < 140 && Math.abs(v) < 110) {
      const pad = 1.6 + N.fbm(M.x * 0.01, M.z * 0.01, 2);
      const w = 20 + Math.max(0, u) * 0.55;
      const spur2 = pad + 46 * smooth(2, 40, u) * Math.exp(-(v * v) / (w * w)) * (0.85 + 0.15 * N.fbm(x * 0.05, z * 0.05, 2));
      h = Math.max(h, spur2);
      const dd = Math.hypot(u + 10, v * 0.8);
      if (dd < 36) h = lerp(pad, h, smooth(20, 36, dd));
    }
  }
  for (const Z of [PASTURE, CAMP, MUSTER]) {
    const dz = Math.hypot(x - Z.x, z - Z.z);
    if (dz < Math.max(Z.r + 26, (Z.fr ?? 0) + 16)) {
      const base = 1.2 + N.fbm(x * 0.03, z * 0.03, 2) * 0.5;
      h = lerp(base, h, smooth(Z.fr ?? Z.r * 0.75, Math.max(Z.r + 26, (Z.fr ?? 0) + 16), dz));
    }
  }
  if (_SY) {
    const dy = Math.hypot(x - _SY.x, z - _SY.z);
    if (dy < 54) h = lerp(1.7 + N.fbm(x * 0.03, z * 0.03, 2) * 0.2, h, smooth(30, 54, dy));
  }
  for (let i = 0; i < PADS.length; i++) {
    const P4 = PADS[i];
    if (P4.h == null) continue;
    const dx = x - P4.x, dz = z - P4.z, R = P4.r + P4.b;
    if (dx * dx + dz * dz < R * R) h = lerp(P4.h, h, smooth(P4.r, R, Math.hypot(dx, dz)));
  }
  h = Math.max(h, -0.3);
  const md = Math.abs(sd - MOAT.off);
  if (MOAT.on && md < MOAT.half + 2.4) h = Math.min(h, lerp(-2.4, h, smooth(MOAT.half - 1.2, MOAT.half + 2.4, md)));
  if (MOAT2) {
    const m2 = Math.abs(sdT - MOAT2.off);
    if (m2 < MOAT2.half + 3) h = Math.min(h, lerp(-2.6, h, smooth(MOAT2.half - 1.2, MOAT2.half + 3, m2)));
  }
  const rd = distPolyline(RIVER, x, z);
  if (rd < 30) {
    h = lerp(h, Math.min(h, 1.2 + rd * 0.35), 1 - smooth(8, 30, rd));
    const wT = TOWN ? 1 - smooth(-8, 0, sdT) : 0;
    if (rd < 7) h = Math.min(h, lerp(-2.2, h, smooth(3.4 + 1.3 * wT, 7 - 1.3 * wT, rd)));
  }
  const ld = Math.hypot(x - LAKE.x, z - LAKE.z) - LAKE.r * (1 + 0.12 * N.fbm(x * 0.03, z * 0.03, 2));
  if (ld < 18) h = Math.min(h, lerp(-3, h, smooth(-6, 18, ld)));
  const fd = fieldD(x, z);
  if (fd < 1.5) h = lerp(1.2 + N.fbm(x * 0.02, z * 0.02, 2) * 0.4, h, smooth(0.9, 1.5, fd));
  return h;
}

// src/hamlets.js
var PLAN = null;
var seg = (px, pz, a, b) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2));
  return { d: Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t)), x: a[0] + dx * t, z: a[1] + dz * t };
};
function planHamlets(roads) {
  if (PLAN) return PLAN;
  PLAN = [];
  if (!TOWN || !roads || !PASTURE || PASTURE.r <= 0) return PLAN;
  const r = rng(77123), dirt = roads.filter((q) => q.kind === "dirt" && !/^hamlet/.test(q.name));
  const zones = [PASTURE, CAMP, MUSTER, LAIR].filter((z) => z && z.r > 0);
  const flat = (x, z, rad) => {
    let lo = 1e9, hi = -1e9;
    for (const [dx, dz] of [[0, 0], [rad, 0], [-rad, 0], [0, rad], [0, -rad], [rad * 0.7, rad * 0.7], [-rad * 0.7, -rad * 0.7]]) {
      const h = height(x + dx, z + dz);
      lo = Math.min(lo, h);
      hi = Math.max(hi, h);
    }
    return { lo, hi };
  };
  const free = (x, z, pad) => {
    if (sdTown(x, z) < 40 + pad) return false;
    if (fieldD(x, z) < 1.9) return false;
    for (const Z of zones) if (Math.hypot(x - Z.x, z - Z.z) < (Z.fr ?? Z.r) + 24 + pad) return false;
    if (Math.hypot(x - WINDMILL.x, z - WINDMILL.z) < 40) return false;
    if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 30) return false;
    if (distPolyline(RIVER, x, z) < 28) return false;
    if (nearMine(x, z, 66)) return false;
    return true;
  };
  for (let k = 0; k < 6e3 && PLAN.length < 8; k++) {
    const a = r() * Math.PI * 2, d0 = 168 + r() * 112, x = Math.cos(a) * d0, z = Math.sin(a) * d0;
    if (!free(x, z, 0)) continue;
    if (PLAN.some((H2) => Math.hypot(H2.x - x, H2.z - z) < 66)) continue;
    const f = flat(x, z, 16);
    if (f.lo < 1.2 || f.hi > 26 || f.hi - f.lo > 3.2) continue;
    let best = null;
    for (const R of dirt) for (let i = 0; i < R.pts.length - 1; i++) {
      const s = seg(x, z, R.pts[i], R.pts[i + 1]);
      if (!best || s.d < best.d) best = s;
    }
    if (!best || best.d < 22 || best.d > 125) continue;
    const link = [best.x, best.z], ux = (link[0] - x) / best.d, uz = (link[1] - z) / best.d;
    let okSpur = true;
    for (let t = 0.1; t <= 1; t += 0.15) {
      const px = x + (link[0] - x) * t, pz = z + (link[1] - z) * t, h = height(px, pz);
      if (h < 0.8 || h > 30 || fieldD(px, pz) < 1.15 || zones.some((Z) => Math.hypot(px - Z.x, pz - Z.z) < Z.r + 6) || distPolyline(RIVER, px, pz) < 14) {
        okSpur = false;
        break;
      }
    }
    if (!okSpur) continue;
    const H = { x, z, r: 30, link, spur: [link, [(link[0] + x) / 2 + uz * 5, (link[1] + z) / 2 - ux * 5], [x + ux * 5, z + uz * 5]], houses: [], props: [] };
    const n2 = 3 + (r() * 3 | 0), a0 = Math.atan2(uz, ux) + Math.PI * 0.42, span = Math.PI * 2 - Math.PI * 0.84;
    for (let i = 0; i < n2; i++) {
      const aa = a0 + (i + 0.5 + (r() - 0.5) * 0.3) * span / n2, rr = 10 + n2 * 0.9 + r() * 2.6, hx = x + Math.cos(aa) * rr, hz = z + Math.sin(aa) * rr;
      const w = 6 + r() * 3, dd = 7 + r() * 2.6, ry = Math.atan2(x - hx, z - hz);
      const g = flat(hx, hz, 5);
      if (g.lo < 1 || g.hi - g.lo > 2.3) continue;
      H.houses.push({ x: hx, z: hz, ry, w, d: dd, floors: 1 + (r() < 0.45 ? 1 : 0), kind: "house", scheme: "rustic" });
    }
    if (H.houses.length < 3) continue;
    H.props.push({ k: "well", x, z, ry: 0, s: 1 });
    for (const h of H.houses) {
      const c = Math.cos(h.ry), s = Math.sin(h.ry);
      const at = (lx, lz) => [h.x + lx * c + lz * s, h.z - lx * s + lz * c];
      const [bx, bz] = at(h.w / 2 + 1.4, h.d / 2 + 0.6);
      H.props.push({ k: r() < 0.5 ? "barrel" : "crate", x: bx, z: bz, ry: r() * 6.28, s: 1.3 });
      if (r() < 0.5) {
        const [cx, cz] = at(-h.w / 2 - 1.2, h.d / 2 + 0.2);
        H.props.push({ k: r() < 0.5 ? "crate" : "barrel", x: cx, z: cz, ry: r() * 6.28, s: 1.3 });
      }
    }
    {
      const h = H.houses[r() * H.houses.length | 0], c = Math.cos(h.ry), s = Math.sin(h.ry);
      H.props.push({ k: "cart", x: h.x + (-h.w / 2 - 3) * c + (h.d / 2 + 2.2) * s, z: h.z - (-h.w / 2 - 3) * s + (h.d / 2 + 2.2) * c, ry: h.ry + 1.2, s: 1.5 });
    }
    PLAN.push(H);
  }
  return PLAN;
}
var hamlets = () => PLAN || [];

// node_modules/three/build/three.core.js
var REVISION = "186";
var PCFShadowMap = 1;
var VSMShadowMap = 3;
var NeverDepth = 0;
var AlwaysDepth = 1;
var LessDepth = 2;
var LessEqualDepth = 3;
var EqualDepth = 4;
var GreaterEqualDepth = 5;
var GreaterDepth = 6;
var NotEqualDepth = 7;
var MultiplyOperation = 0;
var MixOperation = 1;
var AddOperation = 2;
var LinearToneMapping = 1;
var ReinhardToneMapping = 2;
var CineonToneMapping = 3;
var ACESFilmicToneMapping = 4;
var CustomToneMapping = 5;
var AgXToneMapping = 6;
var NeutralToneMapping = 7;
var UVMapping = 300;
var CubeReflectionMapping = 301;
var CubeRefractionMapping = 302;
var CubeUVReflectionMapping = 306;
var RepeatWrapping = 1e3;
var ClampToEdgeWrapping = 1001;
var MirroredRepeatWrapping = 1002;
var LinearFilter = 1006;
var LinearMipmapLinearFilter = 1008;
var UnsignedByteType = 1009;
var RGBAFormat = 1023;
var InterpolateDiscrete = 2300;
var InterpolateLinear = 2301;
var InterpolateSmooth = 2302;
var InterpolateBezier = 2303;
var ZeroCurvatureEnding = 2400;
var ZeroSlopeEnding = 2401;
var WrapAroundEnding = 2402;
var NoColorSpace = "";
var SRGBColorSpace = "srgb";
var LinearSRGBColorSpace = "srgb-linear";
var LinearTransfer = "linear";
var SRGBTransfer = "srgb";
var WebGLCoordinateSystem = 2e3;
var WebGPUCoordinateSystem = 2001;
function isTypedArray(array) {
  return ArrayBuffer.isView(array) && !(array instanceof DataView);
}
function createElementNS(name) {
  return document.createElementNS("http://www.w3.org/1999/xhtml", name);
}
var _cache = {};
var _setConsoleFunction = null;
function enhanceLogMessage(params) {
  const message = params[0];
  if (typeof message === "string" && message.startsWith("TSL:")) {
    const stackTrace = params[1];
    if (stackTrace && stackTrace.isStackTrace) {
      params[0] += " " + stackTrace.getLocation();
    } else {
      params[1] = 'Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.';
    }
  }
  return params;
}
function warn(...params) {
  params = enhanceLogMessage(params);
  const message = "THREE." + params.shift();
  if (_setConsoleFunction) {
    _setConsoleFunction("warn", message, ...params);
  } else {
    const stackTrace = params[0];
    if (stackTrace && stackTrace.isStackTrace) {
      console.warn(stackTrace.getError(message));
    } else {
      console.warn(message, ...params);
    }
  }
}
function error(...params) {
  params = enhanceLogMessage(params);
  const message = "THREE." + params.shift();
  if (_setConsoleFunction) {
    _setConsoleFunction("error", message, ...params);
  } else {
    const stackTrace = params[0];
    if (stackTrace && stackTrace.isStackTrace) {
      console.error(stackTrace.getError(message));
    } else {
      console.error(message, ...params);
    }
  }
}
function warnOnce(...params) {
  const message = params.join(" ");
  if (message in _cache) return;
  _cache[message] = true;
  warn(...params);
}
var ReversedDepthFuncs = {
  [NeverDepth]: AlwaysDepth,
  [LessDepth]: GreaterDepth,
  [EqualDepth]: NotEqualDepth,
  [LessEqualDepth]: GreaterEqualDepth,
  [AlwaysDepth]: NeverDepth,
  [GreaterDepth]: LessDepth,
  [NotEqualDepth]: EqualDepth,
  [GreaterEqualDepth]: LessEqualDepth
};
var EventDispatcher = class {
  /**
   * Adds the given event listener to the given event type.
   *
   * @param {string} type - The type of event to listen to.
   * @param {Function} listener - The function that gets called when the event is fired.
   */
  addEventListener(type, listener) {
    if (this._listeners === void 0) this._listeners = {};
    const listeners = this._listeners;
    if (listeners[type] === void 0) {
      listeners[type] = [];
    }
    if (listeners[type].indexOf(listener) === -1) {
      listeners[type].push(listener);
    }
  }
  /**
   * Returns `true` if the given event listener has been added to the given event type.
   *
   * @param {string} type - The type of event.
   * @param {Function} listener - The listener to check.
   * @return {boolean} Whether the given event listener has been added to the given event type.
   */
  hasEventListener(type, listener) {
    const listeners = this._listeners;
    if (listeners === void 0) return false;
    return listeners[type] !== void 0 && listeners[type].indexOf(listener) !== -1;
  }
  /**
   * Removes the given event listener from the given event type.
   *
   * @param {string} type - The type of event.
   * @param {Function} listener - The listener to remove.
   */
  removeEventListener(type, listener) {
    const listeners = this._listeners;
    if (listeners === void 0) return;
    const listenerArray = listeners[type];
    if (listenerArray !== void 0) {
      const index = listenerArray.indexOf(listener);
      if (index !== -1) {
        listenerArray.splice(index, 1);
      }
    }
  }
  /**
   * Dispatches an event object.
   *
   * @param {Object} event - The event that gets fired.
   */
  dispatchEvent(event) {
    const listeners = this._listeners;
    if (listeners === void 0) return;
    const listenerArray = listeners[event.type];
    if (listenerArray !== void 0) {
      event.target = this;
      const array = listenerArray.slice(0);
      for (let i = 0, l = array.length; i < l; i++) {
        array[i].call(this, event);
      }
      event.target = null;
    }
  }
};
var _lut = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "0a", "0b", "0c", "0d", "0e", "0f", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "1a", "1b", "1c", "1d", "1e", "1f", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "2a", "2b", "2c", "2d", "2e", "2f", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "3a", "3b", "3c", "3d", "3e", "3f", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "4a", "4b", "4c", "4d", "4e", "4f", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "5a", "5b", "5c", "5d", "5e", "5f", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "6a", "6b", "6c", "6d", "6e", "6f", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "7a", "7b", "7c", "7d", "7e", "7f", "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "8a", "8b", "8c", "8d", "8e", "8f", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "9a", "9b", "9c", "9d", "9e", "9f", "a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "aa", "ab", "ac", "ad", "ae", "af", "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "ba", "bb", "bc", "bd", "be", "bf", "c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "ca", "cb", "cc", "cd", "ce", "cf", "d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "da", "db", "dc", "dd", "de", "df", "e0", "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "ea", "eb", "ec", "ed", "ee", "ef", "f0", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "fa", "fb", "fc", "fd", "fe", "ff"];
var DEG2RAD = Math.PI / 180;
var RAD2DEG = 180 / Math.PI;
function generateUUID() {
  const d0 = Math.random() * 4294967295 | 0;
  const d1 = Math.random() * 4294967295 | 0;
  const d2 = Math.random() * 4294967295 | 0;
  const d3 = Math.random() * 4294967295 | 0;
  const uuid = _lut[d0 & 255] + _lut[d0 >> 8 & 255] + _lut[d0 >> 16 & 255] + _lut[d0 >> 24 & 255] + "-" + _lut[d1 & 255] + _lut[d1 >> 8 & 255] + "-" + _lut[d1 >> 16 & 15 | 64] + _lut[d1 >> 24 & 255] + "-" + _lut[d2 & 63 | 128] + _lut[d2 >> 8 & 255] + "-" + _lut[d2 >> 16 & 255] + _lut[d2 >> 24 & 255] + _lut[d3 & 255] + _lut[d3 >> 8 & 255] + _lut[d3 >> 16 & 255] + _lut[d3 >> 24 & 255];
  return uuid.toLowerCase();
}
function clamp2(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function euclideanModulo(n2, m) {
  return (n2 % m + m) % m;
}
function lerp2(x, y, t) {
  return (1 - t) * x + t * y;
}
var Vector2 = class _Vector2 {
  static {
    _Vector2.prototype.isVector2 = true;
  }
  /**
   * Constructs a new 2D vector.
   *
   * @param {number} [x=0] - The x value of this vector.
   * @param {number} [y=0] - The y value of this vector.
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  /**
   * Alias for {@link Vector2#x}.
   *
   * @type {number}
   */
  get width() {
    return this.x;
  }
  set width(value) {
    this.x = value;
  }
  /**
   * Alias for {@link Vector2#y}.
   *
   * @type {number}
   */
  get height() {
    return this.y;
  }
  set height(value) {
    this.y = value;
  }
  /**
   * Sets the vector components.
   *
   * @param {number} x - The value of the x component.
   * @param {number} y - The value of the y component.
   * @return {Vector2} A reference to this vector.
   */
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
  /**
   * Sets the vector components to the same value.
   *
   * @param {number} scalar - The value to set for all vector components.
   * @return {Vector2} A reference to this vector.
   */
  setScalar(scalar) {
    this.x = scalar;
    this.y = scalar;
    return this;
  }
  /**
   * Sets the vector's x component to the given value
   *
   * @param {number} x - The value to set.
   * @return {Vector2} A reference to this vector.
   */
  setX(x) {
    this.x = x;
    return this;
  }
  /**
   * Sets the vector's y component to the given value
   *
   * @param {number} y - The value to set.
   * @return {Vector2} A reference to this vector.
   */
  setY(y) {
    this.y = y;
    return this;
  }
  /**
   * Allows to set a vector component with an index.
   *
   * @param {number} index - The component index. `0` equals to x, `1` equals to y.
   * @param {number} value - The value to set.
   * @return {Vector2} A reference to this vector.
   */
  setComponent(index, value) {
    switch (index) {
      case 0:
        this.x = value;
        break;
      case 1:
        this.y = value;
        break;
      default:
        throw new Error("THREE.Vector2: index is out of range: " + index);
    }
    return this;
  }
  /**
   * Returns the value of the vector component which matches the given index.
   *
   * @param {number} index - The component index. `0` equals to x, `1` equals to y.
   * @return {number} A vector component value.
   */
  getComponent(index) {
    switch (index) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      default:
        throw new Error("THREE.Vector2: index is out of range: " + index);
    }
  }
  /**
   * Returns a new vector with copied values from this instance.
   *
   * @return {Vector2} A clone of this instance.
   */
  clone() {
    return new this.constructor(this.x, this.y);
  }
  /**
   * Copies the values of the given vector to this instance.
   *
   * @param {Vector2} v - The vector to copy.
   * @return {Vector2} A reference to this vector.
   */
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }
  /**
   * Adds the given vector to this instance.
   *
   * @param {Vector2} v - The vector to add.
   * @return {Vector2} A reference to this vector.
   */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  /**
   * Adds the given scalar value to all components of this instance.
   *
   * @param {number} s - The scalar to add.
   * @return {Vector2} A reference to this vector.
   */
  addScalar(s) {
    this.x += s;
    this.y += s;
    return this;
  }
  /**
   * Adds the given vectors and stores the result in this instance.
   *
   * @param {Vector2} a - The first vector.
   * @param {Vector2} b - The second vector.
   * @return {Vector2} A reference to this vector.
   */
  addVectors(a, b) {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    return this;
  }
  /**
   * Adds the given vector scaled by the given factor to this instance.
   *
   * @param {Vector2} v - The vector.
   * @param {number} s - The factor that scales `v`.
   * @return {Vector2} A reference to this vector.
   */
  addScaledVector(v, s) {
    this.x += v.x * s;
    this.y += v.y * s;
    return this;
  }
  /**
   * Subtracts the given vector from this instance.
   *
   * @param {Vector2} v - The vector to subtract.
   * @return {Vector2} A reference to this vector.
   */
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }
  /**
   * Subtracts the given scalar value from all components of this instance.
   *
   * @param {number} s - The scalar to subtract.
   * @return {Vector2} A reference to this vector.
   */
  subScalar(s) {
    this.x -= s;
    this.y -= s;
    return this;
  }
  /**
   * Subtracts the given vectors and stores the result in this instance.
   *
   * @param {Vector2} a - The first vector.
   * @param {Vector2} b - The second vector.
   * @return {Vector2} A reference to this vector.
   */
  subVectors(a, b) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    return this;
  }
  /**
   * Multiplies the given vector with this instance.
   *
   * @param {Vector2} v - The vector to multiply.
   * @return {Vector2} A reference to this vector.
   */
  multiply(v) {
    this.x *= v.x;
    this.y *= v.y;
    return this;
  }
  /**
   * Multiplies the given scalar value with all components of this instance.
   *
   * @param {number} scalar - The scalar to multiply.
   * @return {Vector2} A reference to this vector.
   */
  multiplyScalar(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
  /**
   * Divides this instance by the given vector.
   *
   * @param {Vector2} v - The vector to divide.
   * @return {Vector2} A reference to this vector.
   */
  divide(v) {
    this.x /= v.x;
    this.y /= v.y;
    return this;
  }
  /**
   * Divides this vector by the given scalar.
   *
   * @param {number} scalar - The scalar to divide.
   * @return {Vector2} A reference to this vector.
   */
  divideScalar(scalar) {
    return this.multiplyScalar(1 / scalar);
  }
  /**
   * Multiplies this vector (with an implicit 1 as the 3rd component) by
   * the given 3x3 matrix.
   *
   * @param {Matrix3} m - The matrix to apply.
   * @return {Vector2} A reference to this vector.
   */
  applyMatrix3(m) {
    const x = this.x, y = this.y;
    const e = m.elements;
    this.x = e[0] * x + e[3] * y + e[6];
    this.y = e[1] * x + e[4] * y + e[7];
    return this;
  }
  /**
   * If this vector's x or y value is greater than the given vector's x or y
   * value, replace that value with the corresponding min value.
   *
   * @param {Vector2} v - The vector.
   * @return {Vector2} A reference to this vector.
   */
  min(v) {
    this.x = Math.min(this.x, v.x);
    this.y = Math.min(this.y, v.y);
    return this;
  }
  /**
   * If this vector's x or y value is less than the given vector's x or y
   * value, replace that value with the corresponding max value.
   *
   * @param {Vector2} v - The vector.
   * @return {Vector2} A reference to this vector.
   */
  max(v) {
    this.x = Math.max(this.x, v.x);
    this.y = Math.max(this.y, v.y);
    return this;
  }
  /**
   * If this vector's x or y value is greater than the max vector's x or y
   * value, it is replaced by the corresponding value.
   * If this vector's x or y value is less than the min vector's x or y value,
   * it is replaced by the corresponding value.
   *
   * @param {Vector2} min - The minimum x and y values.
   * @param {Vector2} max - The maximum x and y values in the desired range.
   * @return {Vector2} A reference to this vector.
   */
  clamp(min, max) {
    this.x = clamp2(this.x, min.x, max.x);
    this.y = clamp2(this.y, min.y, max.y);
    return this;
  }
  /**
   * If this vector's x or y values are greater than the max value, they are
   * replaced by the max value.
   * If this vector's x or y values are less than the min value, they are
   * replaced by the min value.
   *
   * @param {number} minVal - The minimum value the components will be clamped to.
   * @param {number} maxVal - The maximum value the components will be clamped to.
   * @return {Vector2} A reference to this vector.
   */
  clampScalar(minVal, maxVal) {
    this.x = clamp2(this.x, minVal, maxVal);
    this.y = clamp2(this.y, minVal, maxVal);
    return this;
  }
  /**
   * If this vector's length is greater than the max value, it is replaced by
   * the max value.
   * If this vector's length is less than the min value, it is replaced by the
   * min value.
   *
   * @param {number} min - The minimum value the vector length will be clamped to.
   * @param {number} max - The maximum value the vector length will be clamped to.
   * @return {Vector2} A reference to this vector.
   */
  clampLength(min, max) {
    const length = this.length();
    return this.divideScalar(length || 1).multiplyScalar(clamp2(length, min, max));
  }
  /**
   * The components of this vector are rounded down to the nearest integer value.
   *
   * @return {Vector2} A reference to this vector.
   */
  floor() {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    return this;
  }
  /**
   * The components of this vector are rounded up to the nearest integer value.
   *
   * @return {Vector2} A reference to this vector.
   */
  ceil() {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);
    return this;
  }
  /**
   * The components of this vector are rounded to the nearest integer value
   *
   * @return {Vector2} A reference to this vector.
   */
  round() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    return this;
  }
  /**
   * The components of this vector are rounded towards zero (up if negative,
   * down if positive) to an integer value.
   *
   * @return {Vector2} A reference to this vector.
   */
  roundToZero() {
    this.x = Math.trunc(this.x);
    this.y = Math.trunc(this.y);
    return this;
  }
  /**
   * Inverts this vector - i.e. sets x = -x and y = -y.
   *
   * @return {Vector2} A reference to this vector.
   */
  negate() {
    this.x = -this.x;
    this.y = -this.y;
    return this;
  }
  /**
   * Calculates the dot product of the given vector with this instance.
   *
   * @param {Vector2} v - The vector to compute the dot product with.
   * @return {number} The result of the dot product.
   */
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }
  /**
   * Calculates the cross product of the given vector with this instance.
   *
   * @param {Vector2} v - The vector to compute the cross product with.
   * @return {number} The result of the cross product.
   */
  cross(v) {
    return this.x * v.y - this.y * v.x;
  }
  /**
   * Computes the square of the Euclidean length (straight-line length) from
   * (0, 0) to (x, y). If you are comparing the lengths of vectors, you should
   * compare the length squared instead as it is slightly more efficient to calculate.
   *
   * @return {number} The square length of this vector.
   */
  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }
  /**
   * Computes the  Euclidean length (straight-line length) from (0, 0) to (x, y).
   *
   * @return {number} The length of this vector.
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  /**
   * Computes the Manhattan length of this vector.
   *
   * @return {number} The length of this vector.
   */
  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y);
  }
  /**
   * Converts this vector to a unit vector - that is, sets it equal to a vector
   * with the same direction as this one, but with a vector length of `1`.
   *
   * @return {Vector2} A reference to this vector.
   */
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  /**
   * Computes the angle in radians of this vector with respect to the positive x-axis.
   *
   * @return {number} The angle in radians.
   */
  angle() {
    const angle = Math.atan2(-this.y, -this.x) + Math.PI;
    return angle;
  }
  /**
   * Returns the angle between the given vector and this instance in radians.
   *
   * @param {Vector2} v - The vector to compute the angle with.
   * @return {number} The angle in radians.
   */
  angleTo(v) {
    const denominator = Math.sqrt(this.lengthSq() * v.lengthSq());
    if (denominator === 0) return Math.PI / 2;
    const theta = this.dot(v) / denominator;
    return Math.acos(clamp2(theta, -1, 1));
  }
  /**
   * Computes the distance from the given vector to this instance.
   *
   * @param {Vector2} v - The vector to compute the distance to.
   * @return {number} The distance.
   */
  distanceTo(v) {
    return Math.sqrt(this.distanceToSquared(v));
  }
  /**
   * Computes the squared distance from the given vector to this instance.
   * If you are just comparing the distance with another distance, you should compare
   * the distance squared instead as it is slightly more efficient to calculate.
   *
   * @param {Vector2} v - The vector to compute the squared distance to.
   * @return {number} The squared distance.
   */
  distanceToSquared(v) {
    const dx = this.x - v.x, dy = this.y - v.y;
    return dx * dx + dy * dy;
  }
  /**
   * Computes the Manhattan distance from the given vector to this instance.
   *
   * @param {Vector2} v - The vector to compute the Manhattan distance to.
   * @return {number} The Manhattan distance.
   */
  manhattanDistanceTo(v) {
    return Math.abs(this.x - v.x) + Math.abs(this.y - v.y);
  }
  /**
   * Sets this vector to a vector with the same direction as this one, but
   * with the specified length.
   *
   * @param {number} length - The new length of this vector.
   * @return {Vector2} A reference to this vector.
   */
  setLength(length) {
    return this.normalize().multiplyScalar(length);
  }
  /**
   * Linearly interpolates between the given vector and this instance, where
   * alpha is the percent distance along the line - alpha = 0 will be this
   * vector, and alpha = 1 will be the given one.
   *
   * @param {Vector2} v - The vector to interpolate towards.
   * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
   * @return {Vector2} A reference to this vector.
   */
  lerp(v, alpha) {
    this.x += (v.x - this.x) * alpha;
    this.y += (v.y - this.y) * alpha;
    return this;
  }
  /**
   * Linearly interpolates between the given vectors, where alpha is the percent
   * distance along the line - alpha = 0 will be first vector, and alpha = 1 will
   * be the second one. The result is stored in this instance.
   *
   * @param {Vector2} v1 - The first vector.
   * @param {Vector2} v2 - The second vector.
   * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
   * @return {Vector2} A reference to this vector.
   */
  lerpVectors(v1, v2, alpha) {
    this.x = v1.x + (v2.x - v1.x) * alpha;
    this.y = v1.y + (v2.y - v1.y) * alpha;
    return this;
  }
  /**
   * Returns `true` if this vector is equal with the given one.
   *
   * @param {Vector2} v - The vector to test for equality.
   * @return {boolean} Whether this vector is equal with the given one.
   */
  equals(v) {
    return v.x === this.x && v.y === this.y;
  }
  /**
   * Sets this vector's x value to be `array[ offset ]` and y
   * value to be `array[ offset + 1 ]`.
   *
   * @param {Array<number>} array - An array holding the vector component values.
   * @param {number} [offset=0] - The offset into the array.
   * @return {Vector2} A reference to this vector.
   */
  fromArray(array, offset = 0) {
    this.x = array[offset];
    this.y = array[offset + 1];
    return this;
  }
  /**
   * Writes the components of this vector to the given array. If no array is provided,
   * the method returns a new instance.
   *
   * @param {Array<number>} [array=[]] - The target array holding the vector components.
   * @param {number} [offset=0] - Index of the first element in the array.
   * @return {Array<number>} The vector components.
   */
  toArray(array = [], offset = 0) {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    return array;
  }
  /**
   * Sets the components of this vector from the given buffer attribute.
   *
   * @param {BufferAttribute} attribute - The buffer attribute holding vector data.
   * @param {number} index - The index into the attribute.
   * @return {Vector2} A reference to this vector.
   */
  fromBufferAttribute(attribute, index) {
    this.x = attribute.getX(index);
    this.y = attribute.getY(index);
    return this;
  }
  /**
   * Rotates this vector around the given center by the given angle.
   *
   * @param {Vector2} center - The point around which to rotate.
   * @param {number} angle - The angle to rotate, in radians.
   * @return {Vector2} A reference to this vector.
   */
  rotateAround(center, angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const x = this.x - center.x;
    const y = this.y - center.y;
    this.x = x * c - y * s + center.x;
    this.y = x * s + y * c + center.y;
    return this;
  }
  /**
   * Sets each component of this vector to a pseudo-random value between `0` and
   * `1`, excluding `1`.
   *
   * @return {Vector2} A reference to this vector.
   */
  random() {
    this.x = Math.random();
    this.y = Math.random();
    return this;
  }
  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
  }
};
var Quaternion = class {
  /**
   * Constructs a new quaternion.
   *
   * @param {number} [x=0] - The x value of this quaternion.
   * @param {number} [y=0] - The y value of this quaternion.
   * @param {number} [z=0] - The z value of this quaternion.
   * @param {number} [w=1] - The w value of this quaternion.
   */
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.isQuaternion = true;
    this._x = x;
    this._y = y;
    this._z = z;
    this._w = w;
  }
  /**
   * Interpolates between two quaternions via SLERP. This implementation assumes the
   * quaternion data are managed in flat arrays.
   *
   * @param {Array<number>} dst - The destination array.
   * @param {number} dstOffset - An offset into the destination array.
   * @param {Array<number>} src0 - The source array of the first quaternion.
   * @param {number} srcOffset0 - An offset into the first source array.
   * @param {Array<number>} src1 -  The source array of the second quaternion.
   * @param {number} srcOffset1 - An offset into the second source array.
   * @param {number} t - The interpolation factor. A value in the range `[0,1]` will interpolate. A value outside the range `[0,1]` will extrapolate.
   * @see {@link Quaternion#slerp}
   */
  static slerpFlat(dst, dstOffset, src0, srcOffset0, src1, srcOffset1, t) {
    let x0 = src0[srcOffset0 + 0], y0 = src0[srcOffset0 + 1], z0 = src0[srcOffset0 + 2], w0 = src0[srcOffset0 + 3];
    let x1 = src1[srcOffset1 + 0], y1 = src1[srcOffset1 + 1], z1 = src1[srcOffset1 + 2], w1 = src1[srcOffset1 + 3];
    if (w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1) {
      let dot = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1;
      if (dot < 0) {
        x1 = -x1;
        y1 = -y1;
        z1 = -z1;
        w1 = -w1;
        dot = -dot;
      }
      let s = 1 - t;
      if (dot < 0.9995) {
        const theta = Math.acos(dot);
        const sin = Math.sin(theta);
        s = Math.sin(s * theta) / sin;
        t = Math.sin(t * theta) / sin;
        x0 = x0 * s + x1 * t;
        y0 = y0 * s + y1 * t;
        z0 = z0 * s + z1 * t;
        w0 = w0 * s + w1 * t;
      } else {
        x0 = x0 * s + x1 * t;
        y0 = y0 * s + y1 * t;
        z0 = z0 * s + z1 * t;
        w0 = w0 * s + w1 * t;
        const f = 1 / Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0);
        x0 *= f;
        y0 *= f;
        z0 *= f;
        w0 *= f;
      }
    }
    dst[dstOffset] = x0;
    dst[dstOffset + 1] = y0;
    dst[dstOffset + 2] = z0;
    dst[dstOffset + 3] = w0;
  }
  /**
   * Multiplies two quaternions. This implementation assumes the quaternion data are managed
   * in flat arrays.
   *
   * @param {Array<number>} dst - The destination array.
   * @param {number} dstOffset - An offset into the destination array.
   * @param {Array<number>} src0 - The source array of the first quaternion.
   * @param {number} srcOffset0 - An offset into the first source array.
   * @param {Array<number>} src1 -  The source array of the second quaternion.
   * @param {number} srcOffset1 - An offset into the second source array.
   * @return {Array<number>} The destination array.
   * @see {@link Quaternion#multiplyQuaternions}.
   */
  static multiplyQuaternionsFlat(dst, dstOffset, src0, srcOffset0, src1, srcOffset1) {
    const x0 = src0[srcOffset0];
    const y0 = src0[srcOffset0 + 1];
    const z0 = src0[srcOffset0 + 2];
    const w0 = src0[srcOffset0 + 3];
    const x1 = src1[srcOffset1];
    const y1 = src1[srcOffset1 + 1];
    const z1 = src1[srcOffset1 + 2];
    const w1 = src1[srcOffset1 + 3];
    dst[dstOffset] = x0 * w1 + w0 * x1 + y0 * z1 - z0 * y1;
    dst[dstOffset + 1] = y0 * w1 + w0 * y1 + z0 * x1 - x0 * z1;
    dst[dstOffset + 2] = z0 * w1 + w0 * z1 + x0 * y1 - y0 * x1;
    dst[dstOffset + 3] = w0 * w1 - x0 * x1 - y0 * y1 - z0 * z1;
    return dst;
  }
  /**
   * The x value of this quaternion.
   *
   * @type {number}
   * @default 0
   */
  get x() {
    return this._x;
  }
  set x(value) {
    this._x = value;
    this._onChangeCallback();
  }
  /**
   * The y value of this quaternion.
   *
   * @type {number}
   * @default 0
   */
  get y() {
    return this._y;
  }
  set y(value) {
    this._y = value;
    this._onChangeCallback();
  }
  /**
   * The z value of this quaternion.
   *
   * @type {number}
   * @default 0
   */
  get z() {
    return this._z;
  }
  set z(value) {
    this._z = value;
    this._onChangeCallback();
  }
  /**
   * The w value of this quaternion.
   *
   * @type {number}
   * @default 1
   */
  get w() {
    return this._w;
  }
  set w(value) {
    this._w = value;
    this._onChangeCallback();
  }
  /**
   * Sets the quaternion components.
   *
   * @param {number} x - The x value of this quaternion.
   * @param {number} y - The y value of this quaternion.
   * @param {number} z - The z value of this quaternion.
   * @param {number} w - The w value of this quaternion.
   * @return {Quaternion} A reference to this quaternion.
   */
  set(x, y, z, w) {
    this._x = x;
    this._y = y;
    this._z = z;
    this._w = w;
    this._onChangeCallback();
    return this;
  }
  /**
   * Returns a new quaternion with copied values from this instance.
   *
   * @return {Quaternion} A clone of this instance.
   */
  clone() {
    return new this.constructor(this._x, this._y, this._z, this._w);
  }
  /**
   * Copies the values of the given quaternion to this instance.
   *
   * @param {Quaternion} quaternion - The quaternion to copy.
   * @return {Quaternion} A reference to this quaternion.
   */
  copy(quaternion) {
    this._x = quaternion.x;
    this._y = quaternion.y;
    this._z = quaternion.z;
    this._w = quaternion.w;
    this._onChangeCallback();
    return this;
  }
  /**
   * Sets this quaternion from the rotation specified by the given
   * Euler angles.
   *
   * @param {Euler} euler - The Euler angles.
   * @param {boolean} [update=true] - Whether the internal `onChange` callback should be executed or not.
   * @return {Quaternion} A reference to this quaternion.
   */
  setFromEuler(euler, update = true) {
    const x = euler._x, y = euler._y, z = euler._z, order = euler._order;
    const cos = Math.cos;
    const sin = Math.sin;
    const c1 = cos(x / 2);
    const c2 = cos(y / 2);
    const c3 = cos(z / 2);
    const s1 = sin(x / 2);
    const s2 = sin(y / 2);
    const s3 = sin(z / 2);
    switch (order) {
      case "XYZ":
        this._x = s1 * c2 * c3 + c1 * s2 * s3;
        this._y = c1 * s2 * c3 - s1 * c2 * s3;
        this._z = c1 * c2 * s3 + s1 * s2 * c3;
        this._w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      case "YXZ":
        this._x = s1 * c2 * c3 + c1 * s2 * s3;
        this._y = c1 * s2 * c3 - s1 * c2 * s3;
        this._z = c1 * c2 * s3 - s1 * s2 * c3;
        this._w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      case "ZXY":
        this._x = s1 * c2 * c3 - c1 * s2 * s3;
        this._y = c1 * s2 * c3 + s1 * c2 * s3;
        this._z = c1 * c2 * s3 + s1 * s2 * c3;
        this._w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      case "ZYX":
        this._x = s1 * c2 * c3 - c1 * s2 * s3;
        this._y = c1 * s2 * c3 + s1 * c2 * s3;
        this._z = c1 * c2 * s3 - s1 * s2 * c3;
        this._w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      case "YZX":
        this._x = s1 * c2 * c3 + c1 * s2 * s3;
        this._y = c1 * s2 * c3 + s1 * c2 * s3;
        this._z = c1 * c2 * s3 - s1 * s2 * c3;
        this._w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      case "XZY":
        this._x = s1 * c2 * c3 - c1 * s2 * s3;
        this._y = c1 * s2 * c3 - s1 * c2 * s3;
        this._z = c1 * c2 * s3 + s1 * s2 * c3;
        this._w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      default:
        warn("Quaternion: .setFromEuler() encountered an unknown order: " + order);
    }
    if (update === true) this._onChangeCallback();
    return this;
  }
  /**
   * Sets this quaternion from the given axis and angle.
   *
   * @param {Vector3} axis - The normalized axis.
   * @param {number} angle - The angle in radians.
   * @return {Quaternion} A reference to this quaternion.
   */
  setFromAxisAngle(axis, angle) {
    const halfAngle = angle / 2, s = Math.sin(halfAngle);
    this._x = axis.x * s;
    this._y = axis.y * s;
    this._z = axis.z * s;
    this._w = Math.cos(halfAngle);
    this._onChangeCallback();
    return this;
  }
  /**
   * Sets this quaternion from the given rotation matrix.
   *
   * @param {Matrix4} m - A 4x4 matrix of which the upper 3x3 of matrix is a pure rotation matrix (i.e. unscaled).
   * @return {Quaternion} A reference to this quaternion.
   */
  setFromRotationMatrix(m) {
    const te = m.elements, m11 = te[0], m12 = te[4], m13 = te[8], m21 = te[1], m22 = te[5], m23 = te[9], m31 = te[2], m32 = te[6], m33 = te[10], trace = m11 + m22 + m33;
    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1);
      this._w = 0.25 / s;
      this._x = (m32 - m23) * s;
      this._y = (m13 - m31) * s;
      this._z = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
      const s = 2 * Math.sqrt(1 + m11 - m22 - m33);
      this._w = (m32 - m23) / s;
      this._x = 0.25 * s;
      this._y = (m12 + m21) / s;
      this._z = (m13 + m31) / s;
    } else if (m22 > m33) {
      const s = 2 * Math.sqrt(1 + m22 - m11 - m33);
      this._w = (m13 - m31) / s;
      this._x = (m12 + m21) / s;
      this._y = 0.25 * s;
      this._z = (m23 + m32) / s;
    } else {
      const s = 2 * Math.sqrt(1 + m33 - m11 - m22);
      this._w = (m21 - m12) / s;
      this._x = (m13 + m31) / s;
      this._y = (m23 + m32) / s;
      this._z = 0.25 * s;
    }
    this._onChangeCallback();
    return this;
  }
  /**
   * Sets this quaternion to the rotation required to rotate the direction vector
   * `vFrom` to the direction vector `vTo`.
   *
   * @param {Vector3} vFrom - The first (normalized) direction vector.
   * @param {Vector3} vTo - The second (normalized) direction vector.
   * @return {Quaternion} A reference to this quaternion.
   */
  setFromUnitVectors(vFrom, vTo) {
    let r = vFrom.dot(vTo) + 1;
    if (r < 1e-8) {
      r = 0;
      if (Math.abs(vFrom.x) > Math.abs(vFrom.z)) {
        this._x = -vFrom.y;
        this._y = vFrom.x;
        this._z = 0;
        this._w = r;
      } else {
        this._x = 0;
        this._y = -vFrom.z;
        this._z = vFrom.y;
        this._w = r;
      }
    } else {
      this._x = vFrom.y * vTo.z - vFrom.z * vTo.y;
      this._y = vFrom.z * vTo.x - vFrom.x * vTo.z;
      this._z = vFrom.x * vTo.y - vFrom.y * vTo.x;
      this._w = r;
    }
    return this.normalize();
  }
  /**
   * Returns the angle between this quaternion and the given one in radians.
   *
   * @param {Quaternion} q - The quaternion to compute the angle with.
   * @return {number} The angle in radians.
   */
  angleTo(q) {
    return 2 * Math.acos(Math.abs(clamp2(this.dot(q), -1, 1)));
  }
  /**
   * Rotates this quaternion by a given angular step to the given quaternion.
   * The method ensures that the final quaternion will not overshoot `q`.
   *
   * @param {Quaternion} q - The target quaternion.
   * @param {number} step - The angular step in radians.
   * @return {Quaternion} A reference to this quaternion.
   */
  rotateTowards(q, step) {
    const angle = this.angleTo(q);
    if (angle === 0) return this;
    const t = Math.min(1, step / angle);
    this.slerp(q, t);
    return this;
  }
  /**
   * Sets this quaternion to the identity quaternion; that is, to the
   * quaternion that represents "no rotation".
   *
   * @return {Quaternion} A reference to this quaternion.
   */
  identity() {
    return this.set(0, 0, 0, 1);
  }
  /**
   * Inverts this quaternion via {@link Quaternion#conjugate}. The
   * quaternion is assumed to have unit length.
   *
   * @return {Quaternion} A reference to this quaternion.
   */
  invert() {
    return this.conjugate();
  }
  /**
   * Returns the rotational conjugate of this quaternion. The conjugate of a
   * quaternion represents the same rotation in the opposite direction about
   * the rotational axis.
   *
   * @return {Quaternion} A reference to this quaternion.
   */
  conjugate() {
    this._x *= -1;
    this._y *= -1;
    this._z *= -1;
    this._onChangeCallback();
    return this;
  }
  /**
   * Calculates the dot product of this quaternion and the given one.
   *
   * @param {Quaternion} v - The quaternion to compute the dot product with.
   * @return {number} The result of the dot product.
   */
  dot(v) {
    return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w;
  }
  /**
   * Computes the squared Euclidean length (straight-line length) of this quaternion,
   * considered as a 4 dimensional vector. This can be useful if you are comparing the
   * lengths of two quaternions, as this is a slightly more efficient calculation than
   * {@link Quaternion#length}.
   *
   * @return {number} The squared Euclidean length.
   */
  lengthSq() {
    return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;
  }
  /**
   * Computes the Euclidean length (straight-line length) of this quaternion,
   * considered as a 4 dimensional vector.
   *
   * @return {number} The Euclidean length.
   */
  length() {
    return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w);
  }
  /**
   * Normalizes this quaternion - that is, calculated the quaternion that performs
   * the same rotation as this one, but has a length equal to `1`.
   *
   * @return {Quaternion} A reference to this quaternion.
   */
  normalize() {
    let l = this.length();
    if (l === 0) {
      this._x = 0;
      this._y = 0;
      this._z = 0;
      this._w = 1;
    } else {
      l = 1 / l;
      this._x = this._x * l;
      this._y = this._y * l;
      this._z = this._z * l;
      this._w = this._w * l;
    }
    this._onChangeCallback();
    return this;
  }
  /**
   * Multiplies this quaternion by the given one.
   *
   * @param {Quaternion} q - The quaternion.
   * @return {Quaternion} A reference to this quaternion.
   */
  multiply(q) {
    return this.multiplyQuaternions(this, q);
  }
  /**
   * Pre-multiplies this quaternion by the given one.
   *
   * @param {Quaternion} q - The quaternion.
   * @return {Quaternion} A reference to this quaternion.
   */
  premultiply(q) {
    return this.multiplyQuaternions(q, this);
  }
  /**
   * Multiplies the given quaternions and stores the result in this instance.
   *
   * @param {Quaternion} a - The first quaternion.
   * @param {Quaternion} b - The second quaternion.
   * @return {Quaternion} A reference to this quaternion.
   */
  multiplyQuaternions(a, b) {
    const qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
    const qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;
    this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
    this._onChangeCallback();
    return this;
  }
  /**
   * Performs a spherical linear interpolation between this quaternion and the target quaternion.
   *
   * @param {Quaternion} qb - The target quaternion.
   * @param {number} t - The interpolation factor. A value in the range `[0,1]` will interpolate. A value outside the range `[0,1]` will extrapolate.
   * @return {Quaternion} A reference to this quaternion.
   */
  slerp(qb, t) {
    let x = qb._x, y = qb._y, z = qb._z, w = qb._w;
    let dot = this.dot(qb);
    if (dot < 0) {
      x = -x;
      y = -y;
      z = -z;
      w = -w;
      dot = -dot;
    }
    let s = 1 - t;
    if (dot < 0.9995) {
      const theta = Math.acos(dot);
      const sin = Math.sin(theta);
      s = Math.sin(s * theta) / sin;
      t = Math.sin(t * theta) / sin;
      this._x = this._x * s + x * t;
      this._y = this._y * s + y * t;
      this._z = this._z * s + z * t;
      this._w = this._w * s + w * t;
      this._onChangeCallback();
    } else {
      this._x = this._x * s + x * t;
      this._y = this._y * s + y * t;
      this._z = this._z * s + z * t;
      this._w = this._w * s + w * t;
      this.normalize();
    }
    return this;
  }
  /**
   * Performs a spherical linear interpolation between the given quaternions
   * and stores the result in this quaternion.
   *
   * @param {Quaternion} qa - The source quaternion.
   * @param {Quaternion} qb - The target quaternion.
   * @param {number} t - The interpolation factor in the closed interval `[0, 1]`.
   * @return {Quaternion} A reference to this quaternion.
   */
  slerpQuaternions(qa, qb, t) {
    return this.copy(qa).slerp(qb, t);
  }
  /**
   * Sets this quaternion to a uniformly random, normalized quaternion.
   *
   * @return {Quaternion} A reference to this quaternion.
   */
  random() {
    const theta1 = 2 * Math.PI * Math.random();
    const theta2 = 2 * Math.PI * Math.random();
    const x0 = Math.random();
    const r1 = Math.sqrt(1 - x0);
    const r2 = Math.sqrt(x0);
    return this.set(
      r1 * Math.sin(theta1),
      r1 * Math.cos(theta1),
      r2 * Math.sin(theta2),
      r2 * Math.cos(theta2)
    );
  }
  /**
   * Returns `true` if this quaternion is equal with the given one.
   *
   * @param {Quaternion} quaternion - The quaternion to test for equality.
   * @return {boolean} Whether this quaternion is equal with the given one.
   */
  equals(quaternion) {
    return quaternion._x === this._x && quaternion._y === this._y && quaternion._z === this._z && quaternion._w === this._w;
  }
  /**
   * Sets this quaternion's components from the given array.
   *
   * @param {Array<number>} array - An array holding the quaternion component values.
   * @param {number} [offset=0] - The offset into the array.
   * @return {Quaternion} A reference to this quaternion.
   */
  fromArray(array, offset = 0) {
    this._x = array[offset];
    this._y = array[offset + 1];
    this._z = array[offset + 2];
    this._w = array[offset + 3];
    this._onChangeCallback();
    return this;
  }
  /**
   * Writes the components of this quaternion to the given array. If no array is provided,
   * the method returns a new instance.
   *
   * @param {Array<number>} [array=[]] - The target array holding the quaternion components.
   * @param {number} [offset=0] - Index of the first element in the array.
   * @return {Array<number>} The quaternion components.
   */
  toArray(array = [], offset = 0) {
    array[offset] = this._x;
    array[offset + 1] = this._y;
    array[offset + 2] = this._z;
    array[offset + 3] = this._w;
    return array;
  }
  /**
   * Sets the components of this quaternion from the given buffer attribute.
   *
   * @param {BufferAttribute} attribute - The buffer attribute holding quaternion data.
   * @param {number} index - The index into the attribute.
   * @return {Quaternion} A reference to this quaternion.
   */
  fromBufferAttribute(attribute, index) {
    this._x = attribute.getX(index);
    this._y = attribute.getY(index);
    this._z = attribute.getZ(index);
    this._w = attribute.getW(index);
    this._onChangeCallback();
    return this;
  }
  /**
   * This methods defines the serialization result of this class. Returns the
   * numerical elements of this quaternion in an array of format `[x, y, z, w]`.
   *
   * @return {Array<number>} The serialized quaternion.
   */
  toJSON() {
    return this.toArray();
  }
  _onChange(callback) {
    this._onChangeCallback = callback;
    return this;
  }
  _onChangeCallback() {
  }
  *[Symbol.iterator]() {
    yield this._x;
    yield this._y;
    yield this._z;
    yield this._w;
  }
};
var Vector3 = class _Vector3 {
  static {
    _Vector3.prototype.isVector3 = true;
  }
  /**
   * Constructs a new 3D vector.
   *
   * @param {number} [x=0] - The x value of this vector.
   * @param {number} [y=0] - The y value of this vector.
   * @param {number} [z=0] - The z value of this vector.
   */
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  /**
   * Sets the vector components.
   *
   * @param {number} x - The value of the x component.
   * @param {number} y - The value of the y component.
   * @param {number} z - The value of the z component.
   * @return {Vector3} A reference to this vector.
   */
  set(x, y, z) {
    if (z === void 0) z = this.z;
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  /**
   * Sets the vector components to the same value.
   *
   * @param {number} scalar - The value to set for all vector components.
   * @return {Vector3} A reference to this vector.
   */
  setScalar(scalar) {
    this.x = scalar;
    this.y = scalar;
    this.z = scalar;
    return this;
  }
  /**
   * Sets the vector's x component to the given value.
   *
   * @param {number} x - The value to set.
   * @return {Vector3} A reference to this vector.
   */
  setX(x) {
    this.x = x;
    return this;
  }
  /**
   * Sets the vector's y component to the given value.
   *
   * @param {number} y - The value to set.
   * @return {Vector3} A reference to this vector.
   */
  setY(y) {
    this.y = y;
    return this;
  }
  /**
   * Sets the vector's z component to the given value.
   *
   * @param {number} z - The value to set.
   * @return {Vector3} A reference to this vector.
   */
  setZ(z) {
    this.z = z;
    return this;
  }
  /**
   * Allows to set a vector component with an index.
   *
   * @param {number} index - The component index. `0` equals to x, `1` equals to y, `2` equals to z.
   * @param {number} value - The value to set.
   * @return {Vector3} A reference to this vector.
   */
  setComponent(index, value) {
    switch (index) {
      case 0:
        this.x = value;
        break;
      case 1:
        this.y = value;
        break;
      case 2:
        this.z = value;
        break;
      default:
        throw new Error("THREE.Vector3: index is out of range: " + index);
    }
    return this;
  }
  /**
   * Returns the value of the vector component which matches the given index.
   *
   * @param {number} index - The component index. `0` equals to x, `1` equals to y, `2` equals to z.
   * @return {number} A vector component value.
   */
  getComponent(index) {
    switch (index) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      default:
        throw new Error("THREE.Vector3: index is out of range: " + index);
    }
  }
  /**
   * Returns a new vector with copied values from this instance.
   *
   * @return {Vector3} A clone of this instance.
   */
  clone() {
    return new this.constructor(this.x, this.y, this.z);
  }
  /**
   * Copies the values of the given vector to this instance.
   *
   * @param {Vector3} v - The vector to copy.
   * @return {Vector3} A reference to this vector.
   */
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }
  /**
   * Adds the given vector to this instance.
   *
   * @param {Vector3} v - The vector to add.
   * @return {Vector3} A reference to this vector.
   */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }
  /**
   * Adds the given scalar value to all components of this instance.
   *
   * @param {number} s - The scalar to add.
   * @return {Vector3} A reference to this vector.
   */
  addScalar(s) {
    this.x += s;
    this.y += s;
    this.z += s;
    return this;
  }
  /**
   * Adds the given vectors and stores the result in this instance.
   *
   * @param {Vector3} a - The first vector.
   * @param {Vector3} b - The second vector.
   * @return {Vector3} A reference to this vector.
   */
  addVectors(a, b) {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;
    return this;
  }
  /**
   * Adds the given vector scaled by the given factor to this instance.
   *
   * @param {Vector3|Vector4} v - The vector.
   * @param {number} s - The factor that scales `v`.
   * @return {Vector3} A reference to this vector.
   */
  addScaledVector(v, s) {
    this.x += v.x * s;
    this.y += v.y * s;
    this.z += v.z * s;
    return this;
  }
  /**
   * Subtracts the given vector from this instance.
   *
   * @param {Vector3} v - The vector to subtract.
   * @return {Vector3} A reference to this vector.
   */
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }
  /**
   * Subtracts the given scalar value from all components of this instance.
   *
   * @param {number} s - The scalar to subtract.
   * @return {Vector3} A reference to this vector.
   */
  subScalar(s) {
    this.x -= s;
    this.y -= s;
    this.z -= s;
    return this;
  }
  /**
   * Subtracts the given vectors and stores the result in this instance.
   *
   * @param {Vector3} a - The first vector.
   * @param {Vector3} b - The second vector.
   * @return {Vector3} A reference to this vector.
   */
  subVectors(a, b) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    return this;
  }
  /**
   * Multiplies the given vector with this instance.
   *
   * @param {Vector3} v - The vector to multiply.
   * @return {Vector3} A reference to this vector.
   */
  multiply(v) {
    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;
    return this;
  }
  /**
   * Multiplies the given scalar value with all components of this instance.
   *
   * @param {number} scalar - The scalar to multiply.
   * @return {Vector3} A reference to this vector.
   */
  multiplyScalar(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }
  /**
   * Multiplies the given vectors and stores the result in this instance.
   *
   * @param {Vector3} a - The first vector.
   * @param {Vector3} b - The second vector.
   * @return {Vector3} A reference to this vector.
   */
  multiplyVectors(a, b) {
    this.x = a.x * b.x;
    this.y = a.y * b.y;
    this.z = a.z * b.z;
    return this;
  }
  /**
   * Applies the given Euler rotation to this vector.
   *
   * @param {Euler} euler - The Euler angles.
   * @return {Vector3} A reference to this vector.
   */
  applyEuler(euler) {
    return this.applyQuaternion(_quaternion$5.setFromEuler(euler));
  }
  /**
   * Applies a rotation specified by an axis and an angle to this vector.
   *
   * @param {Vector3} axis - A normalized vector representing the rotation axis.
   * @param {number} angle - The angle in radians.
   * @return {Vector3} A reference to this vector.
   */
  applyAxisAngle(axis, angle) {
    return this.applyQuaternion(_quaternion$5.setFromAxisAngle(axis, angle));
  }
  /**
   * Multiplies this vector with the given 3x3 matrix.
   *
   * @param {Matrix3} m - The 3x3 matrix.
   * @return {Vector3} A reference to this vector.
   */
  applyMatrix3(m) {
    const x = this.x, y = this.y, z = this.z;
    const e = m.elements;
    this.x = e[0] * x + e[3] * y + e[6] * z;
    this.y = e[1] * x + e[4] * y + e[7] * z;
    this.z = e[2] * x + e[5] * y + e[8] * z;
    return this;
  }
  /**
   * Multiplies this vector by the given normal matrix and normalizes
   * the result.
   *
   * @param {Matrix3} m - The normal matrix.
   * @return {Vector3} A reference to this vector.
   */
  applyNormalMatrix(m) {
    return this.applyMatrix3(m).normalize();
  }
  /**
   * Multiplies this vector (with an implicit 1 in the 4th dimension) by m, and
   * divides by perspective.
   *
   * @param {Matrix4} m - The matrix to apply.
   * @return {Vector3} A reference to this vector.
   */
  applyMatrix4(m) {
    const x = this.x, y = this.y, z = this.z;
    const e = m.elements;
    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
    this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
    this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
    this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
    return this;
  }
  /**
   * Applies the given Quaternion to this vector.
   *
   * @param {Quaternion} q - The Quaternion.
   * @return {Vector3} A reference to this vector.
   */
  applyQuaternion(q) {
    const vx = this.x, vy = this.y, vz = this.z;
    const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
    const tx = 2 * (qy * vz - qz * vy);
    const ty = 2 * (qz * vx - qx * vz);
    const tz = 2 * (qx * vy - qy * vx);
    this.x = vx + qw * tx + qy * tz - qz * ty;
    this.y = vy + qw * ty + qz * tx - qx * tz;
    this.z = vz + qw * tz + qx * ty - qy * tx;
    return this;
  }
  /**
   * Projects this vector from world space into the camera's normalized
   * device coordinate (NDC) space.
   *
   * @param {Camera} camera - The camera.
   * @return {Vector3} A reference to this vector.
   */
  project(camera) {
    return this.applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
  }
  /**
   * Unprojects this vector from the camera's normalized device coordinate (NDC)
   * space into world space.
   *
   * @param {Camera} camera - The camera.
   * @return {Vector3} A reference to this vector.
   */
  unproject(camera) {
    return this.applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld);
  }
  /**
   * Transforms this vector by the upper left 3x3 sub-matrix of the given 4x4 matrix,
   * and normalizes the result.
   *
   * @param {Matrix4} m - The matrix.
   * @return {Vector3} A reference to this vector.
   */
  transformDirection(m) {
    const x = this.x, y = this.y, z = this.z;
    const e = m.elements;
    this.x = e[0] * x + e[4] * y + e[8] * z;
    this.y = e[1] * x + e[5] * y + e[9] * z;
    this.z = e[2] * x + e[6] * y + e[10] * z;
    return this.normalize();
  }
  /**
   * Divides this instance by the given vector.
   *
   * @param {Vector3} v - The vector to divide.
   * @return {Vector3} A reference to this vector.
   */
  divide(v) {
    this.x /= v.x;
    this.y /= v.y;
    this.z /= v.z;
    return this;
  }
  /**
   * Divides this vector by the given scalar.
   *
   * @param {number} scalar - The scalar to divide.
   * @return {Vector3} A reference to this vector.
   */
  divideScalar(scalar) {
    return this.multiplyScalar(1 / scalar);
  }
  /**
   * If this vector's x, y or z value is greater than the given vector's x, y or z
   * value, replace that value with the corresponding min value.
   *
   * @param {Vector3} v - The vector.
   * @return {Vector3} A reference to this vector.
   */
  min(v) {
    this.x = Math.min(this.x, v.x);
    this.y = Math.min(this.y, v.y);
    this.z = Math.min(this.z, v.z);
    return this;
  }
  /**
   * If this vector's x, y or z value is less than the given vector's x, y or z
   * value, replace that value with the corresponding max value.
   *
   * @param {Vector3} v - The vector.
   * @return {Vector3} A reference to this vector.
   */
  max(v) {
    this.x = Math.max(this.x, v.x);
    this.y = Math.max(this.y, v.y);
    this.z = Math.max(this.z, v.z);
    return this;
  }
  /**
   * If this vector's x, y or z value is greater than the max vector's x, y or z
   * value, it is replaced by the corresponding value.
   * If this vector's x, y or z value is less than the min vector's x, y or z value,
   * it is replaced by the corresponding value.
   *
   * @param {Vector3} min - The minimum x, y and z values.
   * @param {Vector3} max - The maximum x, y and z values in the desired range.
   * @return {Vector3} A reference to this vector.
   */
  clamp(min, max) {
    this.x = clamp2(this.x, min.x, max.x);
    this.y = clamp2(this.y, min.y, max.y);
    this.z = clamp2(this.z, min.z, max.z);
    return this;
  }
  /**
   * If this vector's x, y or z values are greater than the max value, they are
   * replaced by the max value.
   * If this vector's x, y or z values are less than the min value, they are
   * replaced by the min value.
   *
   * @param {number} minVal - The minimum value the components will be clamped to.
   * @param {number} maxVal - The maximum value the components will be clamped to.
   * @return {Vector3} A reference to this vector.
   */
  clampScalar(minVal, maxVal) {
    this.x = clamp2(this.x, minVal, maxVal);
    this.y = clamp2(this.y, minVal, maxVal);
    this.z = clamp2(this.z, minVal, maxVal);
    return this;
  }
  /**
   * If this vector's length is greater than the max value, it is replaced by
   * the max value.
   * If this vector's length is less than the min value, it is replaced by the
   * min value.
   *
   * @param {number} min - The minimum value the vector length will be clamped to.
   * @param {number} max - The maximum value the vector length will be clamped to.
   * @return {Vector3} A reference to this vector.
   */
  clampLength(min, max) {
    const length = this.length();
    return this.divideScalar(length || 1).multiplyScalar(clamp2(length, min, max));
  }
  /**
   * The components of this vector are rounded down to the nearest integer value.
   *
   * @return {Vector3} A reference to this vector.
   */
  floor() {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    this.z = Math.floor(this.z);
    return this;
  }
  /**
   * The components of this vector are rounded up to the nearest integer value.
   *
   * @return {Vector3} A reference to this vector.
   */
  ceil() {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);
    this.z = Math.ceil(this.z);
    return this;
  }
  /**
   * The components of this vector are rounded to the nearest integer value
   *
   * @return {Vector3} A reference to this vector.
   */
  round() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.z = Math.round(this.z);
    return this;
  }
  /**
   * The components of this vector are rounded towards zero (up if negative,
   * down if positive) to an integer value.
   *
   * @return {Vector3} A reference to this vector.
   */
  roundToZero() {
    this.x = Math.trunc(this.x);
    this.y = Math.trunc(this.y);
    this.z = Math.trunc(this.z);
    return this;
  }
  /**
   * Inverts this vector - i.e. sets x = -x, y = -y and z = -z.
   *
   * @return {Vector3} A reference to this vector.
   */
  negate() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return this;
  }
  /**
   * Calculates the dot product of the given vector with this instance.
   *
   * @param {Vector3} v - The vector to compute the dot product with.
   * @return {number} The result of the dot product.
   */
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }
  /**
   * Computes the square of the Euclidean length (straight-line length) from
   * (0, 0, 0) to (x, y, z). If you are comparing the lengths of vectors, you should
   * compare the length squared instead as it is slightly more efficient to calculate.
   *
   * @return {number} The square length of this vector.
   */
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  /**
   * Computes the  Euclidean length (straight-line length) from (0, 0, 0) to (x, y, z).
   *
   * @return {number} The length of this vector.
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  /**
   * Computes the Manhattan length of this vector.
   *
   * @return {number} The length of this vector.
   */
  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
  }
  /**
   * Converts this vector to a unit vector - that is, sets it equal to a vector
   * with the same direction as this one, but with a vector length of `1`.
   *
   * @return {Vector3} A reference to this vector.
   */
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  /**
   * Sets this vector to a vector with the same direction as this one, but
   * with the specified length.
   *
   * @param {number} length - The new length of this vector.
   * @return {Vector3} A reference to this vector.
   */
  setLength(length) {
    return this.normalize().multiplyScalar(length);
  }
  /**
   * Linearly interpolates between the given vector and this instance, where
   * alpha is the percent distance along the line - alpha = 0 will be this
   * vector, and alpha = 1 will be the given one.
   *
   * @param {Vector3} v - The vector to interpolate towards.
   * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
   * @return {Vector3} A reference to this vector.
   */
  lerp(v, alpha) {
    this.x += (v.x - this.x) * alpha;
    this.y += (v.y - this.y) * alpha;
    this.z += (v.z - this.z) * alpha;
    return this;
  }
  /**
   * Linearly interpolates between the given vectors, where alpha is the percent
   * distance along the line - alpha = 0 will be first vector, and alpha = 1 will
   * be the second one. The result is stored in this instance.
   *
   * @param {Vector3} v1 - The first vector.
   * @param {Vector3} v2 - The second vector.
   * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
   * @return {Vector3} A reference to this vector.
   */
  lerpVectors(v1, v2, alpha) {
    this.x = v1.x + (v2.x - v1.x) * alpha;
    this.y = v1.y + (v2.y - v1.y) * alpha;
    this.z = v1.z + (v2.z - v1.z) * alpha;
    return this;
  }
  /**
   * Calculates the cross product of the given vector with this instance.
   *
   * @param {Vector3} v - The vector to compute the cross product with.
   * @return {Vector3} The result of the cross product.
   */
  cross(v) {
    return this.crossVectors(this, v);
  }
  /**
   * Calculates the cross product of the given vectors and stores the result
   * in this instance.
   *
   * @param {Vector3} a - The first vector.
   * @param {Vector3} b - The second vector.
   * @return {Vector3} A reference to this vector.
   */
  crossVectors(a, b) {
    const ax = a.x, ay = a.y, az = a.z;
    const bx = b.x, by = b.y, bz = b.z;
    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;
    return this;
  }
  /**
   * Projects this vector onto the given one.
   *
   * @param {Vector3} v - The vector to project to.
   * @return {Vector3} A reference to this vector.
   */
  projectOnVector(v) {
    const denominator = v.lengthSq();
    if (denominator === 0) return this.set(0, 0, 0);
    const scalar = v.dot(this) / denominator;
    return this.copy(v).multiplyScalar(scalar);
  }
  /**
   * Projects this vector onto a plane by subtracting this
   * vector projected onto the plane's normal from this vector.
   *
   * @param {Vector3} planeNormal - The plane normal.
   * @return {Vector3} A reference to this vector.
   */
  projectOnPlane(planeNormal) {
    _vector$c.copy(this).projectOnVector(planeNormal);
    return this.sub(_vector$c);
  }
  /**
   * Reflects this vector off a plane orthogonal to the given normal vector.
   *
   * @param {Vector3} normal - The (normalized) normal vector.
   * @return {Vector3} A reference to this vector.
   */
  reflect(normal) {
    return this.sub(_vector$c.copy(normal).multiplyScalar(2 * this.dot(normal)));
  }
  /**
   * Returns the angle between the given vector and this instance in radians.
   *
   * @param {Vector3} v - The vector to compute the angle with.
   * @return {number} The angle in radians.
   */
  angleTo(v) {
    const denominator = Math.sqrt(this.lengthSq() * v.lengthSq());
    if (denominator === 0) return Math.PI / 2;
    const theta = this.dot(v) / denominator;
    return Math.acos(clamp2(theta, -1, 1));
  }
  /**
   * Computes the distance from the given vector to this instance.
   *
   * @param {Vector3} v - The vector to compute the distance to.
   * @return {number} The distance.
   */
  distanceTo(v) {
    return Math.sqrt(this.distanceToSquared(v));
  }
  /**
   * Computes the squared distance from the given vector to this instance.
   * If you are just comparing the distance with another distance, you should compare
   * the distance squared instead as it is slightly more efficient to calculate.
   *
   * @param {Vector3} v - The vector to compute the squared distance to.
   * @return {number} The squared distance.
   */
  distanceToSquared(v) {
    const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
  }
  /**
   * Computes the Manhattan distance from the given vector to this instance.
   *
   * @param {Vector3} v - The vector to compute the Manhattan distance to.
   * @return {number} The Manhattan distance.
   */
  manhattanDistanceTo(v) {
    return Math.abs(this.x - v.x) + Math.abs(this.y - v.y) + Math.abs(this.z - v.z);
  }
  /**
   * Sets the vector components from the given spherical coordinates.
   *
   * @param {Spherical} s - The spherical coordinates.
   * @return {Vector3} A reference to this vector.
   */
  setFromSpherical(s) {
    return this.setFromSphericalCoords(s.radius, s.phi, s.theta);
  }
  /**
   * Sets the vector components from the given spherical coordinates.
   *
   * @param {number} radius - The radius.
   * @param {number} phi - The phi angle in radians.
   * @param {number} theta - The theta angle in radians.
   * @return {Vector3} A reference to this vector.
   */
  setFromSphericalCoords(radius, phi, theta) {
    const sinPhiRadius = Math.sin(phi) * radius;
    this.x = sinPhiRadius * Math.sin(theta);
    this.y = Math.cos(phi) * radius;
    this.z = sinPhiRadius * Math.cos(theta);
    return this;
  }
  /**
   * Sets the vector components from the given cylindrical coordinates.
   *
   * @param {Cylindrical} c - The cylindrical coordinates.
   * @return {Vector3} A reference to this vector.
   */
  setFromCylindrical(c) {
    return this.setFromCylindricalCoords(c.radius, c.theta, c.y);
  }
  /**
   * Sets the vector components from the given cylindrical coordinates.
   *
   * @param {number} radius - The radius.
   * @param {number} theta - The theta angle in radians.
   * @param {number} y - The y value.
   * @return {Vector3} A reference to this vector.
   */
  setFromCylindricalCoords(radius, theta, y) {
    this.x = radius * Math.sin(theta);
    this.y = y;
    this.z = radius * Math.cos(theta);
    return this;
  }
  /**
   * Sets the vector components to the position elements of the
   * given transformation matrix.
   *
   * @param {Matrix4} m - The 4x4 matrix.
   * @return {Vector3} A reference to this vector.
   */
  setFromMatrixPosition(m) {
    const e = m.elements;
    this.x = e[12];
    this.y = e[13];
    this.z = e[14];
    return this;
  }
  /**
   * Sets the vector components to the scale elements of the
   * given transformation matrix.
   *
   * @param {Matrix4} m - The 4x4 matrix.
   * @return {Vector3} A reference to this vector.
   */
  setFromMatrixScale(m) {
    const sx = this.setFromMatrixColumn(m, 0).length();
    const sy = this.setFromMatrixColumn(m, 1).length();
    const sz = this.setFromMatrixColumn(m, 2).length();
    this.x = sx;
    this.y = sy;
    this.z = sz;
    return this;
  }
  /**
   * Sets the vector components from the specified matrix column.
   *
   * @param {Matrix4} m - The 4x4 matrix.
   * @param {number} index - The column index.
   * @return {Vector3} A reference to this vector.
   */
  setFromMatrixColumn(m, index) {
    return this.fromArray(m.elements, index * 4);
  }
  /**
   * Sets the vector components from the specified matrix column.
   *
   * @param {Matrix3} m - The 3x3 matrix.
   * @param {number} index - The column index.
   * @return {Vector3} A reference to this vector.
   */
  setFromMatrix3Column(m, index) {
    return this.fromArray(m.elements, index * 3);
  }
  /**
   * Sets the vector components from the given Euler angles.
   *
   * @param {Euler} e - The Euler angles to set.
   * @return {Vector3} A reference to this vector.
   */
  setFromEuler(e) {
    this.x = e._x;
    this.y = e._y;
    this.z = e._z;
    return this;
  }
  /**
   * Sets the vector components from the RGB components of the
   * given color.
   *
   * @param {Color} c - The color to set.
   * @return {Vector3} A reference to this vector.
   */
  setFromColor(c) {
    this.x = c.r;
    this.y = c.g;
    this.z = c.b;
    return this;
  }
  /**
   * Returns `true` if this vector is equal with the given one.
   *
   * @param {Vector3} v - The vector to test for equality.
   * @return {boolean} Whether this vector is equal with the given one.
   */
  equals(v) {
    return v.x === this.x && v.y === this.y && v.z === this.z;
  }
  /**
   * Sets this vector's x value to be `array[ offset ]`, y value to be `array[ offset + 1 ]`
   * and z value to be `array[ offset + 2 ]`.
   *
   * @param {Array<number>} array - An array holding the vector component values.
   * @param {number} [offset=0] - The offset into the array.
   * @return {Vector3} A reference to this vector.
   */
  fromArray(array, offset = 0) {
    this.x = array[offset];
    this.y = array[offset + 1];
    this.z = array[offset + 2];
    return this;
  }
  /**
   * Writes the components of this vector to the given array. If no array is provided,
   * the method returns a new instance.
   *
   * @param {Array<number>} [array=[]] - The target array holding the vector components.
   * @param {number} [offset=0] - Index of the first element in the array.
   * @return {Array<number>} The vector components.
   */
  toArray(array = [], offset = 0) {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    array[offset + 2] = this.z;
    return array;
  }
  /**
   * Sets the components of this vector from the given buffer attribute.
   *
   * @param {BufferAttribute} attribute - The buffer attribute holding vector data.
   * @param {number} index - The index into the attribute.
   * @return {Vector3} A reference to this vector.
   */
  fromBufferAttribute(attribute, index) {
    this.x = attribute.getX(index);
    this.y = attribute.getY(index);
    this.z = attribute.getZ(index);
    return this;
  }
  /**
   * Sets each component of this vector to a pseudo-random value between `0` and
   * `1`, excluding `1`.
   *
   * @return {Vector3} A reference to this vector.
   */
  random() {
    this.x = Math.random();
    this.y = Math.random();
    this.z = Math.random();
    return this;
  }
  /**
   * Sets this vector to a uniformly random point on a unit sphere.
   *
   * @return {Vector3} A reference to this vector.
   */
  randomDirection() {
    const theta = Math.random() * Math.PI * 2;
    const u = Math.random() * 2 - 1;
    const c = Math.sqrt(1 - u * u);
    this.x = c * Math.cos(theta);
    this.y = u;
    this.z = c * Math.sin(theta);
    return this;
  }
  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
    yield this.z;
  }
};
var _vector$c = /* @__PURE__ */ new Vector3();
var _quaternion$5 = /* @__PURE__ */ new Quaternion();
var Matrix3 = class _Matrix3 {
  static {
    _Matrix3.prototype.isMatrix3 = true;
  }
  /**
   * Constructs a new 3x3 matrix. The arguments are supposed to be
   * in row-major order. If no arguments are provided, the constructor
   * initializes the matrix as an identity matrix.
   *
   * @param {number} [n11] - 1-1 matrix element.
   * @param {number} [n12] - 1-2 matrix element.
   * @param {number} [n13] - 1-3 matrix element.
   * @param {number} [n21] - 2-1 matrix element.
   * @param {number} [n22] - 2-2 matrix element.
   * @param {number} [n23] - 2-3 matrix element.
   * @param {number} [n31] - 3-1 matrix element.
   * @param {number} [n32] - 3-2 matrix element.
   * @param {number} [n33] - 3-3 matrix element.
   */
  constructor(n11, n12, n13, n21, n22, n23, n31, n32, n33) {
    this.elements = [
      1,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      1
    ];
    if (n11 !== void 0) {
      this.set(n11, n12, n13, n21, n22, n23, n31, n32, n33);
    }
  }
  /**
   * Sets the elements of the matrix.The arguments are supposed to be
   * in row-major order.
   *
   * @param {number} [n11] - 1-1 matrix element.
   * @param {number} [n12] - 1-2 matrix element.
   * @param {number} [n13] - 1-3 matrix element.
   * @param {number} [n21] - 2-1 matrix element.
   * @param {number} [n22] - 2-2 matrix element.
   * @param {number} [n23] - 2-3 matrix element.
   * @param {number} [n31] - 3-1 matrix element.
   * @param {number} [n32] - 3-2 matrix element.
   * @param {number} [n33] - 3-3 matrix element.
   * @return {Matrix3} A reference to this matrix.
   */
  set(n11, n12, n13, n21, n22, n23, n31, n32, n33) {
    const te = this.elements;
    te[0] = n11;
    te[1] = n21;
    te[2] = n31;
    te[3] = n12;
    te[4] = n22;
    te[5] = n32;
    te[6] = n13;
    te[7] = n23;
    te[8] = n33;
    return this;
  }
  /**
   * Sets this matrix to the 3x3 identity matrix.
   *
   * @return {Matrix3} A reference to this matrix.
   */
  identity() {
    this.set(
      1,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      1
    );
    return this;
  }
  /**
   * Copies the values of the given matrix to this instance.
   *
   * @param {Matrix3} m - The matrix to copy.
   * @return {Matrix3} A reference to this matrix.
   */
  copy(m) {
    const te = this.elements;
    const me = m.elements;
    te[0] = me[0];
    te[1] = me[1];
    te[2] = me[2];
    te[3] = me[3];
    te[4] = me[4];
    te[5] = me[5];
    te[6] = me[6];
    te[7] = me[7];
    te[8] = me[8];
    return this;
  }
  /**
   * Extracts the basis of this matrix into the three axis vectors provided.
   *
   * @param {Vector3} xAxis - The basis's x axis.
   * @param {Vector3} yAxis - The basis's y axis.
   * @param {Vector3} zAxis - The basis's z axis.
   * @return {Matrix3} A reference to this matrix.
   */
  extractBasis(xAxis, yAxis, zAxis) {
    xAxis.setFromMatrix3Column(this, 0);
    yAxis.setFromMatrix3Column(this, 1);
    zAxis.setFromMatrix3Column(this, 2);
    return this;
  }
  /**
   * Set this matrix to the upper 3x3 matrix of the given 4x4 matrix.
   *
   * @param {Matrix4} m - The 4x4 matrix.
   * @return {Matrix3} A reference to this matrix.
   */
  setFromMatrix4(m) {
    const me = m.elements;
    this.set(
      me[0],
      me[4],
      me[8],
      me[1],
      me[5],
      me[9],
      me[2],
      me[6],
      me[10]
    );
    return this;
  }
  /**
   * Post-multiplies this matrix by the given 3x3 matrix.
   *
   * @param {Matrix3} m - The matrix to multiply with.
   * @return {Matrix3} A reference to this matrix.
   */
  multiply(m) {
    return this.multiplyMatrices(this, m);
  }
  /**
   * Pre-multiplies this matrix by the given 3x3 matrix.
   *
   * @param {Matrix3} m - The matrix to multiply with.
   * @return {Matrix3} A reference to this matrix.
   */
  premultiply(m) {
    return this.multiplyMatrices(m, this);
  }
  /**
   * Multiples the given 3x3 matrices and stores the result
   * in this matrix.
   *
   * @param {Matrix3} a - The first matrix.
   * @param {Matrix3} b - The second matrix.
   * @return {Matrix3} A reference to this matrix.
   */
  multiplyMatrices(a, b) {
    const ae = a.elements;
    const be = b.elements;
    const te = this.elements;
    const a11 = ae[0], a12 = ae[3], a13 = ae[6];
    const a21 = ae[1], a22 = ae[4], a23 = ae[7];
    const a31 = ae[2], a32 = ae[5], a33 = ae[8];
    const b11 = be[0], b12 = be[3], b13 = be[6];
    const b21 = be[1], b22 = be[4], b23 = be[7];
    const b31 = be[2], b32 = be[5], b33 = be[8];
    te[0] = a11 * b11 + a12 * b21 + a13 * b31;
    te[3] = a11 * b12 + a12 * b22 + a13 * b32;
    te[6] = a11 * b13 + a12 * b23 + a13 * b33;
    te[1] = a21 * b11 + a22 * b21 + a23 * b31;
    te[4] = a21 * b12 + a22 * b22 + a23 * b32;
    te[7] = a21 * b13 + a22 * b23 + a23 * b33;
    te[2] = a31 * b11 + a32 * b21 + a33 * b31;
    te[5] = a31 * b12 + a32 * b22 + a33 * b32;
    te[8] = a31 * b13 + a32 * b23 + a33 * b33;
    return this;
  }
  /**
   * Multiplies every component of the matrix by the given scalar.
   *
   * @param {number} s - The scalar.
   * @return {Matrix3} A reference to this matrix.
   */
  multiplyScalar(s) {
    const te = this.elements;
    te[0] *= s;
    te[3] *= s;
    te[6] *= s;
    te[1] *= s;
    te[4] *= s;
    te[7] *= s;
    te[2] *= s;
    te[5] *= s;
    te[8] *= s;
    return this;
  }
  /**
   * Computes and returns the determinant of this matrix.
   *
   * @return {number} The determinant.
   */
  determinant() {
    const te = this.elements;
    const a = te[0], b = te[1], c = te[2], d = te[3], e = te[4], f = te[5], g = te[6], h = te[7], i = te[8];
    return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
  }
  /**
   * Inverts this matrix, using the [analytic method](https://en.wikipedia.org/wiki/Invertible_matrix#Analytic_solution).
   * You can not invert with a determinant of zero. If you attempt this, the method produces
   * a zero matrix instead.
   *
   * @return {Matrix3} A reference to this matrix.
   */
  invert() {
    const te = this.elements, n11 = te[0], n21 = te[1], n31 = te[2], n12 = te[3], n22 = te[4], n32 = te[5], n13 = te[6], n23 = te[7], n33 = te[8], t11 = n33 * n22 - n32 * n23, t12 = n32 * n13 - n33 * n12, t13 = n23 * n12 - n22 * n13, det = n11 * t11 + n21 * t12 + n31 * t13;
    if (det === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
    const detInv = 1 / det;
    te[0] = t11 * detInv;
    te[1] = (n31 * n23 - n33 * n21) * detInv;
    te[2] = (n32 * n21 - n31 * n22) * detInv;
    te[3] = t12 * detInv;
    te[4] = (n33 * n11 - n31 * n13) * detInv;
    te[5] = (n31 * n12 - n32 * n11) * detInv;
    te[6] = t13 * detInv;
    te[7] = (n21 * n13 - n23 * n11) * detInv;
    te[8] = (n22 * n11 - n21 * n12) * detInv;
    return this;
  }
  /**
   * Transposes this matrix in place.
   *
   * @return {Matrix3} A reference to this matrix.
   */
  transpose() {
    let tmp;
    const m = this.elements;
    tmp = m[1];
    m[1] = m[3];
    m[3] = tmp;
    tmp = m[2];
    m[2] = m[6];
    m[6] = tmp;
    tmp = m[5];
    m[5] = m[7];
    m[7] = tmp;
    return this;
  }
  /**
   * Computes the normal matrix which is the inverse transpose of the upper
   * left 3x3 portion of the given 4x4 matrix.
   *
   * @param {Matrix4} matrix4 - The 4x4 matrix.
   * @return {Matrix3} A reference to this matrix.
   */
  getNormalMatrix(matrix4) {
    return this.setFromMatrix4(matrix4).invert().transpose();
  }
  /**
   * Transposes this matrix into the supplied array, and returns itself unchanged.
   *
   * @param {Array<number>} r - An array to store the transposed matrix elements.
   * @return {Matrix3} A reference to this matrix.
   */
  transposeIntoArray(r) {
    const m = this.elements;
    r[0] = m[0];
    r[1] = m[3];
    r[2] = m[6];
    r[3] = m[1];
    r[4] = m[4];
    r[5] = m[7];
    r[6] = m[2];
    r[7] = m[5];
    r[8] = m[8];
    return this;
  }
  /**
   * Sets the UV transform matrix from offset, repeat, rotation, and center.
   *
   * @param {number} tx - Offset x.
   * @param {number} ty - Offset y.
   * @param {number} sx - Repeat x.
   * @param {number} sy - Repeat y.
   * @param {number} rotation - Rotation, in radians. Positive values rotate counterclockwise.
   * @param {number} cx - Center x of rotation.
   * @param {number} cy - Center y of rotation
   * @return {Matrix3} A reference to this matrix.
   */
  setUvTransform(tx, ty, sx, sy, rotation, cx, cy) {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    this.set(
      sx * c,
      sx * s,
      -sx * (c * cx + s * cy) + cx + tx,
      -sy * s,
      sy * c,
      -sy * (-s * cx + c * cy) + cy + ty,
      0,
      0,
      1
    );
    return this;
  }
  /**
   * Scales this matrix with the given scalar values.
   *
   * @deprecated
   * @param {number} sx - The amount to scale in the X axis.
   * @param {number} sy - The amount to scale in the Y axis.
   * @return {Matrix3} A reference to this matrix.
   */
  scale(sx, sy) {
    warnOnce("Matrix3: .scale() is deprecated. Use .makeScale() instead.");
    this.premultiply(_m3.makeScale(sx, sy));
    return this;
  }
  /**
   * Rotates this matrix by the given angle.
   *
   * @deprecated
   * @param {number} theta - The rotation in radians.
   * @return {Matrix3} A reference to this matrix.
   */
  rotate(theta) {
    warnOnce("Matrix3: .rotate() is deprecated. Use .makeRotation() instead.");
    this.premultiply(_m3.makeRotation(-theta));
    return this;
  }
  /**
   * Translates this matrix by the given scalar values.
   *
   * @deprecated
   * @param {number} tx - The amount to translate in the X axis.
   * @param {number} ty - The amount to translate in the Y axis.
   * @return {Matrix3} A reference to this matrix.
   */
  translate(tx, ty) {
    warnOnce("Matrix3: .translate() is deprecated. Use .makeTranslation() instead.");
    this.premultiply(_m3.makeTranslation(tx, ty));
    return this;
  }
  // for 2D Transforms
  /**
   * Sets this matrix as a 2D translation transform.
   *
   * @param {number|Vector2} x - The amount to translate in the X axis or alternatively a translation vector.
   * @param {number} y - The amount to translate in the Y axis.
   * @return {Matrix3} A reference to this matrix.
   */
  makeTranslation(x, y) {
    if (x.isVector2) {
      this.set(
        1,
        0,
        x.x,
        0,
        1,
        x.y,
        0,
        0,
        1
      );
    } else {
      this.set(
        1,
        0,
        x,
        0,
        1,
        y,
        0,
        0,
        1
      );
    }
    return this;
  }
  /**
   * Sets this matrix as a 2D rotational transformation.
   *
   * @param {number} theta - The rotation in radians.
   * @return {Matrix3} A reference to this matrix.
   */
  makeRotation(theta) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    this.set(
      c,
      -s,
      0,
      s,
      c,
      0,
      0,
      0,
      1
    );
    return this;
  }
  /**
   * Sets this matrix as a 2D scale transform.
   *
   * @param {number} x - The amount to scale in the X axis.
   * @param {number} y - The amount to scale in the Y axis.
   * @return {Matrix3} A reference to this matrix.
   */
  makeScale(x, y) {
    this.set(
      x,
      0,
      0,
      0,
      y,
      0,
      0,
      0,
      1
    );
    return this;
  }
  /**
   * Returns `true` if this matrix is equal with the given one.
   *
   * @param {Matrix3} matrix - The matrix to test for equality.
   * @return {boolean} Whether this matrix is equal with the given one.
   */
  equals(matrix) {
    const te = this.elements;
    const me = matrix.elements;
    for (let i = 0; i < 9; i++) {
      if (te[i] !== me[i]) return false;
    }
    return true;
  }
  /**
   * Sets the elements of the matrix from the given array.
   *
   * @param {Array<number>} array - The matrix elements in column-major order.
   * @param {number} [offset=0] - Index of the first element in the array.
   * @return {Matrix3} A reference to this matrix.
   */
  fromArray(array, offset = 0) {
    for (let i = 0; i < 9; i++) {
      this.elements[i] = array[i + offset];
    }
    return this;
  }
  /**
   * Writes the elements of this matrix to the given array. If no array is provided,
   * the method returns a new instance.
   *
   * @param {Array<number>} [array=[]] - The target array holding the matrix elements in column-major order.
   * @param {number} [offset=0] - Index of the first element in the array.
   * @return {Array<number>} The matrix elements in column-major order.
   */
  toArray(array = [], offset = 0) {
    const te = this.elements;
    array[offset] = te[0];
    array[offset + 1] = te[1];
    array[offset + 2] = te[2];
    array[offset + 3] = te[3];
    array[offset + 4] = te[4];
    array[offset + 5] = te[5];
    array[offset + 6] = te[6];
    array[offset + 7] = te[7];
    array[offset + 8] = te[8];
    return array;
  }
  /**
   * Returns a matrix with copied values from this instance.
   *
   * @return {Matrix3} A clone of this instance.
   */
  clone() {
    return new this.constructor().fromArray(this.elements);
  }
};
var _m3 = /* @__PURE__ */ new Matrix3();
var LINEAR_REC709_TO_XYZ = /* @__PURE__ */ new Matrix3().set(
  0.4123908,
  0.3575843,
  0.1804808,
  0.212639,
  0.7151687,
  0.0721923,
  0.0193308,
  0.1191948,
  0.9505322
);
var XYZ_TO_LINEAR_REC709 = /* @__PURE__ */ new Matrix3().set(
  3.2409699,
  -1.5373832,
  -0.4986108,
  -0.9692436,
  1.8759675,
  0.0415551,
  0.0556301,
  -0.203977,
  1.0569715
);
function createColorManagement() {
  const ColorManagement2 = {
    enabled: true,
    workingColorSpace: LinearSRGBColorSpace,
    /**
     * Implementations of supported color spaces.
     *
     * Required:
     *	- primaries: chromaticity coordinates [ rx ry gx gy bx by ]
     *	- whitePoint: reference white [ x y ]
     *	- transfer: transfer function (pre-defined)
     *	- toXYZ: Matrix3 RGB to XYZ transform
     *	- fromXYZ: Matrix3 XYZ to RGB transform
     *	- luminanceCoefficients: RGB luminance coefficients
     *
     * Optional:
     *  - outputColorSpaceConfig: { drawingBufferColorSpace: ColorSpace, toneMappingMode: 'extended' | 'standard' }
     *  - workingColorSpaceConfig: { unpackColorSpace: ColorSpace }
     *
     * Reference:
     * - https://www.russellcottrell.com/photo/matrixCalculator.htm
     */
    spaces: {},
    convert: function(color, sourceColorSpace, targetColorSpace) {
      if (this.enabled === false || sourceColorSpace === targetColorSpace || !sourceColorSpace || !targetColorSpace) {
        return color;
      }
      if (this.spaces[sourceColorSpace].transfer === SRGBTransfer) {
        color.r = SRGBToLinear(color.r);
        color.g = SRGBToLinear(color.g);
        color.b = SRGBToLinear(color.b);
      }
      if (this.spaces[sourceColorSpace].primaries !== this.spaces[targetColorSpace].primaries) {
        color.applyMatrix3(this.spaces[sourceColorSpace].toXYZ);
        color.applyMatrix3(this.spaces[targetColorSpace].fromXYZ);
      }
      if (this.spaces[targetColorSpace].transfer === SRGBTransfer) {
        color.r = LinearToSRGB(color.r);
        color.g = LinearToSRGB(color.g);
        color.b = LinearToSRGB(color.b);
      }
      return color;
    },
    workingToColorSpace: function(color, targetColorSpace) {
      return this.convert(color, this.workingColorSpace, targetColorSpace);
    },
    colorSpaceToWorking: function(color, sourceColorSpace) {
      return this.convert(color, sourceColorSpace, this.workingColorSpace);
    },
    getPrimaries: function(colorSpace) {
      return this.spaces[colorSpace].primaries;
    },
    getTransfer: function(colorSpace) {
      if (colorSpace === NoColorSpace) return LinearTransfer;
      return this.spaces[colorSpace].transfer;
    },
    getToneMappingMode: function(colorSpace) {
      return this.spaces[colorSpace].outputColorSpaceConfig.toneMappingMode || "standard";
    },
    getLuminanceCoefficients: function(target, colorSpace = this.workingColorSpace) {
      return target.fromArray(this.spaces[colorSpace].luminanceCoefficients);
    },
    define: function(colorSpaces) {
      Object.assign(this.spaces, colorSpaces);
    },
    // Internal APIs
    _getMatrix: function(targetMatrix, sourceColorSpace, targetColorSpace) {
      return targetMatrix.copy(this.spaces[sourceColorSpace].toXYZ).multiply(this.spaces[targetColorSpace].fromXYZ);
    },
    _getDrawingBufferColorSpace: function(colorSpace) {
      return this.spaces[colorSpace].outputColorSpaceConfig.drawingBufferColorSpace;
    },
    _getUnpackColorSpace: function(colorSpace = this.workingColorSpace) {
      return this.spaces[colorSpace].workingColorSpaceConfig.unpackColorSpace;
    },
    // Deprecated
    fromWorkingColorSpace: function(color, targetColorSpace) {
      warnOnce("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().");
      return ColorManagement2.workingToColorSpace(color, targetColorSpace);
    },
    toWorkingColorSpace: function(color, sourceColorSpace) {
      warnOnce("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().");
      return ColorManagement2.colorSpaceToWorking(color, sourceColorSpace);
    }
  };
  const REC709_PRIMARIES = [0.64, 0.33, 0.3, 0.6, 0.15, 0.06];
  const REC709_LUMINANCE_COEFFICIENTS = [0.2126, 0.7152, 0.0722];
  const D65 = [0.3127, 0.329];
  ColorManagement2.define({
    [LinearSRGBColorSpace]: {
      primaries: REC709_PRIMARIES,
      whitePoint: D65,
      transfer: LinearTransfer,
      toXYZ: LINEAR_REC709_TO_XYZ,
      fromXYZ: XYZ_TO_LINEAR_REC709,
      luminanceCoefficients: REC709_LUMINANCE_COEFFICIENTS,
      workingColorSpaceConfig: { unpackColorSpace: SRGBColorSpace },
      outputColorSpaceConfig: { drawingBufferColorSpace: SRGBColorSpace }
    },
    [SRGBColorSpace]: {
      primaries: REC709_PRIMARIES,
      whitePoint: D65,
      transfer: SRGBTransfer,
      toXYZ: LINEAR_REC709_TO_XYZ,
      fromXYZ: XYZ_TO_LINEAR_REC709,
      luminanceCoefficients: REC709_LUMINANCE_COEFFICIENTS,
      outputColorSpaceConfig: { drawingBufferColorSpace: SRGBColorSpace }
    }
  });
  return ColorManagement2;
}
var ColorManagement = /* @__PURE__ */ createColorManagement();
function SRGBToLinear(c) {
  return c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);
}
function LinearToSRGB(c) {
  return c < 31308e-7 ? c * 12.92 : 1.055 * Math.pow(c, 0.41666) - 0.055;
}
var _canvas;
var ImageUtils = class {
  /**
   * Returns a data URI containing a representation of the given image.
   *
   * @param {(HTMLImageElement|HTMLCanvasElement)} image - The image object.
   * @param {string} [type='image/png'] - Indicates the image format.
   * @return {string} The data URI.
   */
  static getDataURL(image, type = "image/png") {
    if (/^data:/i.test(image.src)) {
      return image.src;
    }
    if (typeof HTMLCanvasElement === "undefined") {
      return image.src;
    }
    let canvas;
    if (image instanceof HTMLCanvasElement) {
      canvas = image;
    } else {
      if (_canvas === void 0) _canvas = createElementNS("canvas");
      _canvas.width = image.width;
      _canvas.height = image.height;
      const context = _canvas.getContext("2d");
      if (image instanceof ImageData) {
        context.putImageData(image, 0, 0);
      } else {
        context.drawImage(image, 0, 0, image.width, image.height);
      }
      canvas = _canvas;
    }
    return canvas.toDataURL(type);
  }
  /**
   * Converts the given sRGB image data to linear color space.
   *
   * @param {(HTMLImageElement|HTMLCanvasElement|ImageBitmap|Object)} image - The image object.
   * @return {HTMLCanvasElement|Object} The converted image.
   */
  static sRGBToLinear(image) {
    if (typeof HTMLImageElement !== "undefined" && image instanceof HTMLImageElement || typeof HTMLCanvasElement !== "undefined" && image instanceof HTMLCanvasElement || typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) {
      const canvas = createElementNS("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, image.width, image.height);
      const imageData = context.getImageData(0, 0, image.width, image.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i++) {
        data[i] = SRGBToLinear(data[i] / 255) * 255;
      }
      context.putImageData(imageData, 0, 0);
      return canvas;
    } else if (image.data) {
      const data = image.data.slice(0);
      for (let i = 0; i < data.length; i++) {
        if (data instanceof Uint8Array || data instanceof Uint8ClampedArray) {
          data[i] = Math.floor(SRGBToLinear(data[i] / 255) * 255);
        } else {
          data[i] = SRGBToLinear(data[i]);
        }
      }
      return {
        data,
        width: image.width,
        height: image.height
      };
    } else {
      warn("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.");
      return image;
    }
  }
};
var _sourceId = 0;
var TextureSource = class {
  /**
   * Constructs a new texture source.
   *
   * @param {any} [data=null] - The data definition of a texture.
   */
  constructor(data = null) {
    this.isTextureSource = true;
    Object.defineProperty(this, "id", { value: _sourceId++ });
    this.uuid = generateUUID();
    this.data = data;
    this.dataReady = true;
    this.version = 0;
  }
  /**
   * Returns the dimensions of the source into the given target vector.
   *
   * @param {(Vector2|Vector3)} target - The target object the result is written into.
   * @return {(Vector2|Vector3)} The dimensions of the source.
   */
  getSize(target) {
    const data = this.data;
    if (typeof HTMLVideoElement !== "undefined" && data instanceof HTMLVideoElement) {
      target.set(data.videoWidth, data.videoHeight, 0);
    } else if (typeof VideoFrame !== "undefined" && data instanceof VideoFrame) {
      target.set(data.displayWidth, data.displayHeight, 0);
    } else if (data !== null) {
      target.set(data.width, data.height, data.depth || 0);
    } else {
      target.set(0, 0, 0);
    }
    return target;
  }
  /**
   * When the property is set to `true`, the engine allocates the memory
   * for the texture (if necessary) and triggers the actual texture upload
   * to the GPU next time the source is used.
   *
   * @type {boolean}
   * @default false
   * @param {boolean} value
   */
  set needsUpdate(value) {
    if (value === true) this.version++;
  }
  /**
   * Serializes the source into JSON.
   *
   * @param {?(Object|string)} meta - An optional value holding meta information about the serialization.
   * @return {Object} A JSON object representing the serialized source.
   * @see {@link ObjectLoader#parse}
   */
  toJSON(meta) {
    const isRootObject = meta === void 0 || typeof meta === "string";
    if (!isRootObject && meta.images[this.uuid] !== void 0) {
      return meta.images[this.uuid];
    }
    const output = {
      uuid: this.uuid,
      url: ""
    };
    const data = this.data;
    if (data !== null) {
      let url;
      if (Array.isArray(data)) {
        url = [];
        for (let i = 0, l = data.length; i < l; i++) {
          if (data[i].isDataTexture) {
            url.push(serializeImage(data[i].image));
          } else {
            url.push(serializeImage(data[i]));
          }
        }
      } else {
        url = serializeImage(data);
      }
      output.url = url;
    }
    if (!isRootObject) {
      meta.images[this.uuid] = output;
    }
    return output;
  }
};
function serializeImage(image) {
  if (typeof HTMLImageElement !== "undefined" && image instanceof HTMLImageElement || typeof HTMLCanvasElement !== "undefined" && image instanceof HTMLCanvasElement || typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) {
    return ImageUtils.getDataURL(image);
  } else {
    if (image.data) {
      return {
        data: Array.from(image.data),
        width: image.width,
        height: image.height,
        type: image.data.constructor.name
      };
    } else {
      warn("Texture: Unable to serialize Texture.");
      return {};
    }
  }
}
var _textureId = 0;
var _tempVec3 = /* @__PURE__ */ new Vector3();
var Texture = class _Texture extends EventDispatcher {
  /**
   * Constructs a new texture.
   *
   * @param {?Object} [image=Texture.DEFAULT_IMAGE] - The image holding the texture data.
   * @param {number} [mapping=Texture.DEFAULT_MAPPING] - The texture mapping.
   * @param {number} [wrapS=ClampToEdgeWrapping] - The wrapS value.
   * @param {number} [wrapT=ClampToEdgeWrapping] - The wrapT value.
   * @param {number} [magFilter=LinearFilter] - The mag filter value.
   * @param {number} [minFilter=LinearMipmapLinearFilter] - The min filter value.
   * @param {number} [format=RGBAFormat] - The texture format.
   * @param {number} [type=UnsignedByteType] - The texture type.
   * @param {number} [anisotropy=Texture.DEFAULT_ANISOTROPY] - The anisotropy value.
   * @param {string} [colorSpace=NoColorSpace] - The color space.
   */
  constructor(image = _Texture.DEFAULT_IMAGE, mapping = _Texture.DEFAULT_MAPPING, wrapS = ClampToEdgeWrapping, wrapT = ClampToEdgeWrapping, magFilter = LinearFilter, minFilter = LinearMipmapLinearFilter, format = RGBAFormat, type = UnsignedByteType, anisotropy = _Texture.DEFAULT_ANISOTROPY, colorSpace = NoColorSpace) {
    super();
    this.isTexture = true;
    Object.defineProperty(this, "id", { value: _textureId++ });
    this.uuid = generateUUID();
    this.name = "";
    this.source = new TextureSource(image);
    this.mipmaps = [];
    this.mapping = mapping;
    this.channel = 0;
    this.wrapS = wrapS;
    this.wrapT = wrapT;
    this.magFilter = magFilter;
    this.minFilter = minFilter;
    this.anisotropy = anisotropy;
    this.format = format;
    this.internalFormat = null;
    this.type = type;
    this.offset = new Vector2(0, 0);
    this.repeat = new Vector2(1, 1);
    this.center = new Vector2(0, 0);
    this.rotation = 0;
    this.matrixAutoUpdate = true;
    this.matrix = new Matrix3();
    this.generateMipmaps = true;
    this.premultiplyAlpha = false;
    this.flipY = true;
    this.unpackAlignment = 4;
    this.colorSpace = colorSpace;
    this.userData = {};
    this.updateRanges = [];
    this.version = 0;
    this.onUpdate = null;
    this.renderTarget = null;
    this.isRenderTargetTexture = false;
    this.isArrayTexture = image && image.depth && image.depth > 1 ? true : false;
    this.pmremVersion = 0;
    this.normalized = false;
  }
  /**
   * The width of the texture in pixels.
   */
  get width() {
    return this.source.getSize(_tempVec3).x;
  }
  /**
   * The height of the texture in pixels.
   */
  get height() {
    return this.source.getSize(_tempVec3).y;
  }
  /**
   * The depth of the texture in pixels.
   */
  get depth() {
    return this.source.getSize(_tempVec3).z;
  }
  /**
   * The image object holding the texture data.
   *
   * @type {?Object}
   */
  get image() {
    return this.source.data;
  }
  set image(value) {
    this.source.data = value;
  }
  /**
   * Updates the texture transformation matrix from the properties {@link Texture#offset},
   * {@link Texture#repeat}, {@link Texture#rotation}, and {@link Texture#center}.
   */
  updateMatrix() {
    this.matrix.setUvTransform(this.offset.x, this.offset.y, this.repeat.x, this.repeat.y, this.rotation, this.center.x, this.center.y);
  }
  /**
   * Adds a range of data in the data texture to be updated on the GPU.
   *
   * @param {number} start - Position at which to start update.
   * @param {number} count - The number of components to update.
   */
  addUpdateRange(start, count) {
    this.updateRanges.push({ start, count });
  }
  /**
   * Clears the update ranges.
   */
  clearUpdateRanges() {
    this.updateRanges.length = 0;
  }
  /**
   * Returns a new texture with copied values from this instance.
   *
   * @return {Texture} A clone of this instance.
   */
  clone() {
    return new this.constructor().copy(this);
  }
  /**
   * Copies the values of the given texture to this instance.
   *
   * @param {Texture} source - The texture to copy.
   * @return {Texture} A reference to this instance.
   */
  copy(source) {
    this.name = source.name;
    this.source = source.source;
    this.mipmaps = source.mipmaps.slice(0);
    this.mapping = source.mapping;
    this.channel = source.channel;
    this.wrapS = source.wrapS;
    this.wrapT = source.wrapT;
    this.magFilter = source.magFilter;
    this.minFilter = source.minFilter;
    this.anisotropy = source.anisotropy;
    this.format = source.format;
    this.internalFormat = source.internalFormat;
    this.type = source.type;
    this.normalized = source.normalized;
    this.offset.copy(source.offset);
    this.repeat.copy(source.repeat);
    this.center.copy(source.center);
    this.rotation = source.rotation;
    this.matrixAutoUpdate = source.matrixAutoUpdate;
    this.matrix.copy(source.matrix);
    this.generateMipmaps = source.generateMipmaps;
    this.premultiplyAlpha = source.premultiplyAlpha;
    this.flipY = source.flipY;
    this.unpackAlignment = source.unpackAlignment;
    this.colorSpace = source.colorSpace;
    this.renderTarget = source.renderTarget;
    this.isRenderTargetTexture = source.isRenderTargetTexture;
    this.isArrayTexture = source.isArrayTexture;
    this.userData = JSON.parse(JSON.stringify(source.userData));
    this.needsUpdate = true;
    return this;
  }
  /**
   * Sets this texture's properties based on `values`.
   * @param {Object} values - A container with texture parameters.
   */
  setValues(values) {
    for (const key in values) {
      const newValue = values[key];
      if (newValue === void 0) {
        warn(`Texture.setValues(): parameter '${key}' has value of undefined.`);
        continue;
      }
      const currentValue = this[key];
      if (currentValue === void 0) {
        warn(`Texture.setValues(): property '${key}' does not exist.`);
        continue;
      }
      if (currentValue && newValue && (currentValue.isVector2 && newValue.isVector2)) {
        currentValue.copy(newValue);
      } else if (currentValue && newValue && (currentValue.isVector3 && newValue.isVector3)) {
        currentValue.copy(newValue);
      } else if (currentValue && newValue && (currentValue.isMatrix3 && newValue.isMatrix3)) {
        currentValue.copy(newValue);
      } else {
        this[key] = newValue;
      }
    }
  }
  /**
   * Serializes the texture into JSON.
   *
   * @param {?(Object|string)} meta - An optional value holding meta information about the serialization.
   * @return {Object} A JSON object representing the serialized texture.
   * @see {@link ObjectLoader#parse}
   */
  toJSON(meta) {
    const isRootObject = meta === void 0 || typeof meta === "string";
    if (!isRootObject && meta.textures[this.uuid] !== void 0) {
      return meta.textures[this.uuid];
    }
    const output = {
      metadata: {
        version: 4.7,
        type: "Texture",
        generator: "Texture.toJSON"
      },
      uuid: this.uuid,
      name: this.name,
      image: this.source.toJSON(meta).uuid,
      mapping: this.mapping,
      channel: this.channel,
      repeat: [this.repeat.x, this.repeat.y],
      offset: [this.offset.x, this.offset.y],
      center: [this.center.x, this.center.y],
      rotation: this.rotation,
      wrap: [this.wrapS, this.wrapT],
      format: this.format,
      internalFormat: this.internalFormat,
      type: this.type,
      normalized: this.normalized,
      colorSpace: this.colorSpace,
      minFilter: this.minFilter,
      magFilter: this.magFilter,
      anisotropy: this.anisotropy,
      flipY: this.flipY,
      generateMipmaps: this.generateMipmaps,
      premultiplyAlpha: this.premultiplyAlpha,
      unpackAlignment: this.unpackAlignment
    };
    if (Object.keys(this.userData).length > 0) output.userData = this.userData;
    if (!isRootObject) {
      meta.textures[this.uuid] = output;
    }
    return output;
  }
  /**
   * Frees the GPU-related resources allocated by this instance. Call this
   * method whenever this instance is no longer used in your app.
   *
   * @fires Texture#dispose
   */
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
  /**
   * Transforms the given uv vector with the textures uv transformation matrix.
   *
   * @param {Vector2} uv - The uv vector.
   * @return {Vector2} The transformed uv vector.
   */
  transformUv(uv) {
    if (this.mapping !== UVMapping) return uv;
    uv.applyMatrix3(this.matrix);
    if (uv.x < 0 || uv.x > 1) {
      switch (this.wrapS) {
        case RepeatWrapping:
          uv.x = uv.x - Math.floor(uv.x);
          break;
        case ClampToEdgeWrapping:
          uv.x = uv.x < 0 ? 0 : 1;
          break;
        case MirroredRepeatWrapping:
          if (Math.abs(Math.floor(uv.x) % 2) === 1) {
            uv.x = Math.ceil(uv.x) - uv.x;
          } else {
            uv.x = uv.x - Math.floor(uv.x);
          }
          break;
      }
    }
    if (uv.y < 0 || uv.y > 1) {
      switch (this.wrapT) {
        case RepeatWrapping:
          uv.y = uv.y - Math.floor(uv.y);
          break;
        case ClampToEdgeWrapping:
          uv.y = uv.y < 0 ? 0 : 1;
          break;
        case MirroredRepeatWrapping:
          if (Math.abs(Math.floor(uv.y) % 2) === 1) {
            uv.y = Math.ceil(uv.y) - uv.y;
          } else {
            uv.y = uv.y - Math.floor(uv.y);
          }
          break;
      }
    }
    if (this.flipY) {
      uv.y = 1 - uv.y;
    }
    return uv;
  }
  /**
   * Setting this property to `true` indicates the engine the texture
   * must be updated in the next render. This triggers a texture upload
   * to the GPU and ensures correct texture parameter configuration.
   *
   * @type {boolean}
   * @default false
   * @param {boolean} value
   */
  set needsUpdate(value) {
    if (value === true) {
      this.version++;
      this.source.needsUpdate = true;
    }
  }
  /**
   * Setting this property to `true` indicates the engine the PMREM
   * must be regenerated.
   *
   * @type {boolean}
   * @default false
   * @param {boolean} value
   */
  set needsPMREMUpdate(value) {
    if (value === true) {
      this.pmremVersion++;
    }
  }
};
Texture.DEFAULT_IMAGE = null;
Texture.DEFAULT_MAPPING = UVMapping;
Texture.DEFAULT_ANISOTROPY = 1;
var Vector4 = class _Vector4 {
  static {
    _Vector4.prototype.isVector4 = true;
  }
  /**
   * Constructs a new 4D vector.
   *
   * @param {number} [x=0] - The x value of this vector.
   * @param {number} [y=0] - The y value of this vector.
   * @param {number} [z=0] - The z value of this vector.
   * @param {number} [w=1] - The w value of this vector.
   */
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
  /**
   * Alias for {@link Vector4#z}.
   *
   * @type {number}
   */
  get width() {
    return this.z;
  }
  set width(value) {
    this.z = value;
  }
  /**
   * Alias for {@link Vector4#w}.
   *
   * @type {number}
   */
  get height() {
    return this.w;
  }
  set height(value) {
    this.w = value;
  }
  /**
   * Sets the vector components.
   *
   * @param {number} x - The value of the x component.
   * @param {number} y - The value of the y component.
   * @param {number} z - The value of the z component.
   * @param {number} w - The value of the w component.
   * @return {Vector4} A reference to this vector.
   */
  set(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }
  /**
   * Sets the vector components to the same value.
   *
   * @param {number} scalar - The value to set for all vector components.
   * @return {Vector4} A reference to this vector.
   */
  setScalar(scalar) {
    this.x = scalar;
    this.y = scalar;
    this.z = scalar;
    this.w = scalar;
    return this;
  }
  /**
   * Sets the vector's x component to the given value
   *
   * @param {number} x - The value to set.
   * @return {Vector4} A reference to this vector.
   */
  setX(x) {
    this.x = x;
    return this;
  }
  /**
   * Sets the vector's y component to the given value
   *
   * @param {number} y - The value to set.
   * @return {Vector4} A reference to this vector.
   */
  setY(y) {
    this.y = y;
    return this;
  }
  /**
   * Sets the vector's z component to the given value
   *
   * @param {number} z - The value to set.
   * @return {Vector4} A reference to this vector.
   */
  setZ(z) {
    this.z = z;
    return this;
  }
  /**
   * Sets the vector's w component to the given value
   *
   * @param {number} w - The value to set.
   * @return {Vector4} A reference to this vector.
   */
  setW(w) {
    this.w = w;
    return this;
  }
  /**
   * Allows to set a vector component with an index.
   *
   * @param {number} index - The component index. `0` equals to x, `1` equals to y,
   * `2` equals to z, `3` equals to w.
   * @param {number} value - The value to set.
   * @return {Vector4} A reference to this vector.
   */
  setComponent(index, value) {
    switch (index) {
      case 0:
        this.x = value;
        break;
      case 1:
        this.y = value;
        break;
      case 2:
        this.z = value;
        break;
      case 3:
        this.w = value;
        break;
      default:
        throw new Error("THREE.Vector4: index is out of range: " + index);
    }
    return this;
  }
  /**
   * Returns the value of the vector component which matches the given index.
   *
   * @param {number} index - The component index. `0` equals to x, `1` equals to y,
   * `2` equals to z, `3` equals to w.
   * @return {number} A vector component value.
   */
  getComponent(index) {
    switch (index) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      case 3:
        return this.w;
      default:
        throw new Error("THREE.Vector4: index is out of range: " + index);
    }
  }
  /**
   * Returns a new vector with copied values from this instance.
   *
   * @return {Vector4} A clone of this instance.
   */
  clone() {
    return new this.constructor(this.x, this.y, this.z, this.w);
  }
  /**
   * Copies the values of the given vector to this instance.
   *
   * @param {Vector3|Vector4} v - The vector to copy.
   * @return {Vector4} A reference to this vector.
   */
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    this.w = v.w !== void 0 ? v.w : 1;
    return this;
  }
  /**
   * Adds the given vector to this instance.
   *
   * @param {Vector4} v - The vector to add.
   * @return {Vector4} A reference to this vector.
   */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    this.w += v.w;
    return this;
  }
  /**
   * Adds the given scalar value to all components of this instance.
   *
   * @param {number} s - The scalar to add.
   * @return {Vector4} A reference to this vector.
   */
  addScalar(s) {
    this.x += s;
    this.y += s;
    this.z += s;
    this.w += s;
    return this;
  }
  /**
   * Adds the given vectors and stores the result in this instance.
   *
   * @param {Vector4} a - The first vector.
   * @param {Vector4} b - The second vector.
   * @return {Vector4} A reference to this vector.
   */
  addVectors(a, b) {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;
    this.w = a.w + b.w;
    return this;
  }
  /**
   * Adds the given vector scaled by the given factor to this instance.
   *
   * @param {Vector4} v - The vector.
   * @param {number} s - The factor that scales `v`.
   * @return {Vector4} A reference to this vector.
   */
  addScaledVector(v, s) {
    this.x += v.x * s;
    this.y += v.y * s;
    this.z += v.z * s;
    this.w += v.w * s;
    return this;
  }
  /**
   * Subtracts the given vector from this instance.
   *
   * @param {Vector4} v - The vector to subtract.
   * @return {Vector4} A reference to this vector.
   */
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    this.w -= v.w;
    return this;
  }
  /**
   * Subtracts the given scalar value from all components of this instance.
   *
   * @param {number} s - The scalar to subtract.
   * @return {Vector4} A reference to this vector.
   */
  subScalar(s) {
    this.x -= s;
    this.y -= s;
    this.z -= s;
    this.w -= s;
    return this;
  }
  /**
   * Subtracts the given vectors and stores the result in this instance.
   *
   * @param {Vector4} a - The first vector.
   * @param {Vector4} b - The second vector.
   * @return {Vector4} A reference to this vector.
   */
  subVectors(a, b) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    this.w = a.w - b.w;
    return this;
  }
  /**
   * Multiplies the given vector with this instance.
   *
   * @param {Vector4} v - The vector to multiply.
   * @return {Vector4} A reference to this vector.
   */
  multiply(v) {
    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;
    this.w *= v.w;
    return this;
  }
  /**
   * Multiplies the given scalar value with all components of this instance.
   *
   * @param {number} scalar - The scalar to multiply.
   * @return {Vector4} A reference to this vector.
   */
  multiplyScalar(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    this.w *= scalar;
    return this;
  }
  /**
   * Multiplies this vector with the given 4x4 matrix.
   *
   * @param {Matrix4} m - The 4x4 matrix.
   * @return {Vector4} A reference to this vector.
   */
  applyMatrix4(m) {
    const x = this.x, y = this.y, z = this.z, w = this.w;
    const e = m.elements;
    this.x = e[0] * x + e[4] * y + e[8] * z + e[12] * w;
    this.y = e[1] * x + e[5] * y + e[9] * z + e[13] * w;
    this.z = e[2] * x + e[6] * y + e[10] * z + e[14] * w;
    this.w = e[3] * x + e[7] * y + e[11] * z + e[15] * w;
    return this;
  }
  /**
   * Divides this instance by the given vector.
   *
   * @param {Vector4} v - The vector to divide.
   * @return {Vector4} A reference to this vector.
   */
  divide(v) {
    this.x /= v.x;
    this.y /= v.y;
    this.z /= v.z;
    this.w /= v.w;
    return this;
  }
  /**
   * Divides this vector by the given scalar.
   *
   * @param {number} scalar - The scalar to divide.
   * @return {Vector4} A reference to this vector.
   */
  divideScalar(scalar) {
    return this.multiplyScalar(1 / scalar);
  }
  /**
   * Sets the x, y and z components of this
   * vector to the quaternion's axis and w to the angle.
   *
   * @param {Quaternion} q - The Quaternion to set.
   * @return {Vector4} A reference to this vector.
   */
  setAxisAngleFromQuaternion(q) {
    this.w = 2 * Math.acos(q.w);
    const s = Math.sqrt(1 - q.w * q.w);
    if (s < 1e-4) {
      this.x = 1;
      this.y = 0;
      this.z = 0;
    } else {
      this.x = q.x / s;
      this.y = q.y / s;
      this.z = q.z / s;
    }
    return this;
  }
  /**
   * Sets the x, y and z components of this
   * vector to the axis of rotation and w to the angle.
   *
   * @param {Matrix4} m - A 4x4 matrix of which the upper left 3x3 matrix is a pure rotation matrix.
   * @return {Vector4} A reference to this vector.
   */
  setAxisAngleFromRotationMatrix(m) {
    let angle, x, y, z;
    const epsilon = 0.01, epsilon2 = 0.1, te = m.elements, m11 = te[0], m12 = te[4], m13 = te[8], m21 = te[1], m22 = te[5], m23 = te[9], m31 = te[2], m32 = te[6], m33 = te[10];
    if (Math.abs(m12 - m21) < epsilon && Math.abs(m13 - m31) < epsilon && Math.abs(m23 - m32) < epsilon) {
      if (Math.abs(m12 + m21) < epsilon2 && Math.abs(m13 + m31) < epsilon2 && Math.abs(m23 + m32) < epsilon2 && Math.abs(m11 + m22 + m33 - 3) < epsilon2) {
        this.set(1, 0, 0, 0);
        return this;
      }
      angle = Math.PI;
      const xx = (m11 + 1) / 2;
      const yy = (m22 + 1) / 2;
      const zz = (m33 + 1) / 2;
      const xy = (m12 + m21) / 4;
      const xz2 = (m13 + m31) / 4;
      const yz = (m23 + m32) / 4;
      if (xx > yy && xx > zz) {
        if (xx < epsilon) {
          x = 0;
          y = 0.707106781;
          z = 0.707106781;
        } else {
          x = Math.sqrt(xx);
          y = xy / x;
          z = xz2 / x;
        }
      } else if (yy > zz) {
        if (yy < epsilon) {
          x = 0.707106781;
          y = 0;
          z = 0.707106781;
        } else {
          y = Math.sqrt(yy);
          x = xy / y;
          z = yz / y;
        }
      } else {
        if (zz < epsilon) {
          x = 0.707106781;
          y = 0.707106781;
          z = 0;
        } else {
          z = Math.sqrt(zz);
          x = xz2 / z;
          y = yz / z;
        }
      }
      this.set(x, y, z, angle);
      return this;
    }
    let s = Math.sqrt((m32 - m23) * (m32 - m23) + (m13 - m31) * (m13 - m31) + (m21 - m12) * (m21 - m12));
    if (Math.abs(s) < 1e-3) s = 1;
    this.x = (m32 - m23) / s;
    this.y = (m13 - m31) / s;
    this.z = (m21 - m12) / s;
    this.w = Math.acos((m11 + m22 + m33 - 1) / 2);
    return this;
  }
  /**
   * Sets the vector components to the position elements of the
   * given transformation matrix.
   *
   * @param {Matrix4} m - The 4x4 matrix.
   * @return {Vector4} A reference to this vector.
   */
  setFromMatrixPosition(m) {
    const e = m.elements;
    this.x = e[12];
    this.y = e[13];
    this.z = e[14];
    this.w = e[15];
    return this;
  }
  /**
   * If this vector's x, y, z or w value is greater than the given vector's x, y, z or w
   * value, replace that value with the corresponding min value.
   *
   * @param {Vector4} v - The vector.
   * @return {Vector4} A reference to this vector.
   */
  min(v) {
    this.x = Math.min(this.x, v.x);
    this.y = Math.min(this.y, v.y);
    this.z = Math.min(this.z, v.z);
    this.w = Math.min(this.w, v.w);
    return this;
  }
  /**
   * If this vector's x, y, z or w value is less than the given vector's x, y, z or w
   * value, replace that value with the corresponding max value.
   *
   * @param {Vector4} v - The vector.
   * @return {Vector4} A reference to this vector.
   */
  max(v) {
    this.x = Math.max(this.x, v.x);
    this.y = Math.max(this.y, v.y);
    this.z = Math.max(this.z, v.z);
    this.w = Math.max(this.w, v.w);
    return this;
  }
  /**
   * If this vector's x, y, z or w value is greater than the max vector's x, y, z or w
   * value, it is replaced by the corresponding value.
   * If this vector's x, y, z or w value is less than the min vector's x, y, z or w value,
   * it is replaced by the corresponding value.
   *
   * @param {Vector4} min - The minimum x, y and z values.
   * @param {Vector4} max - The maximum x, y and z values in the desired range.
   * @return {Vector4} A reference to this vector.
   */
  clamp(min, max) {
    this.x = clamp2(this.x, min.x, max.x);
    this.y = clamp2(this.y, min.y, max.y);
    this.z = clamp2(this.z, min.z, max.z);
    this.w = clamp2(this.w, min.w, max.w);
    return this;
  }
  /**
   * If this vector's x, y, z or w values are greater than the max value, they are
   * replaced by the max value.
   * If this vector's x, y, z or w values are less than the min value, they are
   * replaced by the min value.
   *
   * @param {number} minVal - The minimum value the components will be clamped to.
   * @param {number} maxVal - The maximum value the components will be clamped to.
   * @return {Vector4} A reference to this vector.
   */
  clampScalar(minVal, maxVal) {
    this.x = clamp2(this.x, minVal, maxVal);
    this.y = clamp2(this.y, minVal, maxVal);
    this.z = clamp2(this.z, minVal, maxVal);
    this.w = clamp2(this.w, minVal, maxVal);
    return this;
  }
  /**
   * If this vector's length is greater than the max value, it is replaced by
   * the max value.
   * If this vector's length is less than the min value, it is replaced by the
   * min value.
   *
   * @param {number} min - The minimum value the vector length will be clamped to.
   * @param {number} max - The maximum value the vector length will be clamped to.
   * @return {Vector4} A reference to this vector.
   */
  clampLength(min, max) {
    const length = this.length();
    return this.divideScalar(length || 1).multiplyScalar(clamp2(length, min, max));
  }
  /**
   * The components of this vector are rounded down to the nearest integer value.
   *
   * @return {Vector4} A reference to this vector.
   */
  floor() {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    this.z = Math.floor(this.z);
    this.w = Math.floor(this.w);
    return this;
  }
  /**
   * The components of this vector are rounded up to the nearest integer value.
   *
   * @return {Vector4} A reference to this vector.
   */
  ceil() {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);
    this.z = Math.ceil(this.z);
    this.w = Math.ceil(this.w);
    return this;
  }
  /**
   * The components of this vector are rounded to the nearest integer value
   *
   * @return {Vector4} A reference to this vector.
   */
  round() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.z = Math.round(this.z);
    this.w = Math.round(this.w);
    return this;
  }
  /**
   * The components of this vector are rounded towards zero (up if negative,
   * down if positive) to an integer value.
   *
   * @return {Vector4} A reference to this vector.
   */
  roundToZero() {
    this.x = Math.trunc(this.x);
    this.y = Math.trunc(this.y);
    this.z = Math.trunc(this.z);
    this.w = Math.trunc(this.w);
    return this;
  }
  /**
   * Inverts this vector - i.e. sets x = -x, y = -y, z = -z, w = -w.
   *
   * @return {Vector4} A reference to this vector.
   */
  negate() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    this.w = -this.w;
    return this;
  }
  /**
   * Calculates the dot product of the given vector with this instance.
   *
   * @param {Vector4} v - The vector to compute the dot product with.
   * @return {number} The result of the dot product.
   */
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
  }
  /**
   * Computes the square of the Euclidean length (straight-line length) from
   * (0, 0, 0, 0) to (x, y, z, w). If you are comparing the lengths of vectors, you should
   * compare the length squared instead as it is slightly more efficient to calculate.
   *
   * @return {number} The square length of this vector.
   */
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }
  /**
   * Computes the  Euclidean length (straight-line length) from (0, 0, 0, 0) to (x, y, z, w).
   *
   * @return {number} The length of this vector.
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }
  /**
   * Computes the Manhattan length of this vector.
   *
   * @return {number} The length of this vector.
   */
  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w);
  }
  /**
   * Converts this vector to a unit vector - that is, sets it equal to a vector
   * with the same direction as this one, but with a vector length of `1`.
   *
   * @return {Vector4} A reference to this vector.
   */
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  /**
   * Sets this vector to a vector with the same direction as this one, but
   * with the specified length.
   *
   * @param {number} length - The new length of this vector.
   * @return {Vector4} A reference to this vector.
   */
  setLength(length) {
    return this.normalize().multiplyScalar(length);
  }
  /**
   * Linearly interpolates between the given vector and this instance, where
   * alpha is the percent distance along the line - alpha = 0 will be this
   * vector, and alpha = 1 will be the given one.
   *
   * @param {Vector4} v - The vector to interpolate towards.
   * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
   * @return {Vector4} A reference to this vector.
   */
  lerp(v, alpha) {
    this.x += (v.x - this.x) * alpha;
    this.y += (v.y - this.y) * alpha;
    this.z += (v.z - this.z) * alpha;
    this.w += (v.w - this.w) * alpha;
    return this;
  }
  /**
   * Linearly interpolates between the given vectors, where alpha is the percent
   * distance along the line - alpha = 0 will be first vector, and alpha = 1 will
   * be the second one. The result is stored in this instance.
   *
   * @param {Vector4} v1 - The first vector.
   * @param {Vector4} v2 - The second vector.
   * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
   * @return {Vector4} A reference to this vector.
   */
  lerpVectors(v1, v2, alpha) {
    this.x = v1.x + (v2.x - v1.x) * alpha;
    this.y = v1.y + (v2.y - v1.y) * alpha;
    this.z = v1.z + (v2.z - v1.z) * alpha;
    this.w = v1.w + (v2.w - v1.w) * alpha;
    return this;
  }
  /**
   * Returns `true` if this vector is equal with the given one.
   *
   * @param {Vector4} v - The vector to test for equality.
   * @return {boolean} Whether this vector is equal with the given one.
   */
  equals(v) {
    return v.x === this.x && v.y === this.y && v.z === this.z && v.w === this.w;
  }
  /**
   * Sets this vector's x value to be `array[ offset ]`, y value to be `array[ offset + 1 ]`,
   * z value to be `array[ offset + 2 ]`, w value to be `array[ offset + 3 ]`.
   *
   * @param {Array<number>} array - An array holding the vector component values.
   * @param {number} [offset=0] - The offset into the array.
   * @return {Vector4} A reference to this vector.
   */
  fromArray(array, offset = 0) {
    this.x = array[offset];
    this.y = array[offset + 1];
    this.z = array[offset + 2];
    this.w = array[offset + 3];
    return this;
  }
  /**
   * Writes the components of this vector to the given array. If no array is provided,
   * the method returns a new instance.
   *
   * @param {Array<number>} [array=[]] - The target array holding the vector components.
   * @param {number} [offset=0] - Index of the first element in the array.
   * @return {Array<number>} The vector components.
   */
  toArray(array = [], offset = 0) {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    array[offset + 2] = this.z;
    array[offset + 3] = this.w;
    return array;
  }
  /**
   * Sets the components of this vector from the given buffer attribute.
   *
   * @param {BufferAttribute} attribute - The buffer attribute holding vector data.
   * @param {number} index - The index into the attribute.
   * @return {Vector4} A reference to this vector.
   */
  fromBufferAttribute(attribute, index) {
    this.x = attribute.getX(index);
    this.y = attribute.getY(index);
    this.z = attribute.getZ(index);
    this.w = attribute.getW(index);
    return this;
  }
  /**
   * Sets each component of this vector to a pseudo-random value between `0` and
   * `1`, excluding `1`.
   *
   * @return {Vector4} A reference to this vector.
   */
  random() {
    this.x = Math.random();
    this.y = Math.random();
    this.z = Math.random();
    this.w = Math.random();
    return this;
  }
  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
    yield this.z;
    yield this.w;
  }
};
var Matrix4 = class _Matrix4 {
  static {
    _Matrix4.prototype.isMatrix4 = true;
  }
  /**
   * Constructs a new 4x4 matrix. The arguments are supposed to be
   * in row-major order. If no arguments are provided, the constructor
   * initializes the matrix as an identity matrix.
   *
   * @param {number} [n11] - 1-1 matrix element.
   * @param {number} [n12] - 1-2 matrix element.
   * @param {number} [n13] - 1-3 matrix element.
   * @param {number} [n14] - 1-4 matrix element.
   * @param {number} [n21] - 2-1 matrix element.
   * @param {number} [n22] - 2-2 matrix element.
   * @param {number} [n23] - 2-3 matrix element.
   * @param {number} [n24] - 2-4 matrix element.
   * @param {number} [n31] - 3-1 matrix element.
   * @param {number} [n32] - 3-2 matrix element.
   * @param {number} [n33] - 3-3 matrix element.
   * @param {number} [n34] - 3-4 matrix element.
   * @param {number} [n41] - 4-1 matrix element.
   * @param {number} [n42] - 4-2 matrix element.
   * @param {number} [n43] - 4-3 matrix element.
   * @param {number} [n44] - 4-4 matrix element.
   */
  constructor(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {
    this.elements = [
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    ];
    if (n11 !== void 0) {
      this.set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44);
    }
  }
  /**
   * Sets the elements of the matrix.The arguments are supposed to be
   * in row-major order.
   *
   * @param {number} [n11] - 1-1 matrix element.
   * @param {number} [n12] - 1-2 matrix element.
   * @param {number} [n13] - 1-3 matrix element.
   * @param {number} [n14] - 1-4 matrix element.
   * @param {number} [n21] - 2-1 matrix element.
   * @param {number} [n22] - 2-2 matrix element.
   * @param {number} [n23] - 2-3 matrix element.
   * @param {number} [n24] - 2-4 matrix element.
   * @param {number} [n31] - 3-1 matrix element.
   * @param {number} [n32] - 3-2 matrix element.
   * @param {number} [n33] - 3-3 matrix element.
   * @param {number} [n34] - 3-4 matrix element.
   * @param {number} [n41] - 4-1 matrix element.
   * @param {number} [n42] - 4-2 matrix element.
   * @param {number} [n43] - 4-3 matrix element.
   * @param {number} [n44] - 4-4 matrix element.
   * @return {Matrix4} A reference to this matrix.
   */
  set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {
    const te = this.elements;
    te[0] = n11;
    te[4] = n12;
    te[8] = n13;
    te[12] = n14;
    te[1] = n21;
    te[5] = n22;
    te[9] = n23;
    te[13] = n24;
    te[2] = n31;
    te[6] = n32;
    te[10] = n33;
    te[14] = n34;
    te[3] = n41;
    te[7] = n42;
    te[11] = n43;
    te[15] = n44;
    return this;
  }
  /**
   * Sets this matrix to the 4x4 identity matrix.
   *
   * @return {Matrix4} A reference to this matrix.
   */
  identity() {
    this.set(
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    );
    return this;
  }
  /**
   * Returns a matrix with copied values from this instance.
   *
   * @return {Matrix4} A clone of this instance.
   */
  clone() {
    return new _Matrix4().fromArray(this.elements);
  }
  /**
   * Copies the values of the given matrix to this instance.
   *
   * @param {Matrix4} m - The matrix to copy.
   * @return {Matrix4} A reference to this matrix.
   */
  copy(m) {
    const te = this.elements;
    const me = m.elements;
    te[0] = me[0];
    te[1] = me[1];
    te[2] = me[2];
    te[3] = me[3];
    te[4] = me[4];
    te[5] = me[5];
    te[6] = me[6];
    te[7] = me[7];
    te[8] = me[8];
    te[9] = me[9];
    te[10] = me[10];
    te[11] = me[11];
    te[12] = me[12];
    te[13] = me[13];
    te[14] = me[14];
    te[15] = me[15];
    return this;
  }
  /**
   * Copies the translation component of the given matrix
   * into this matrix's translation component.
   *
   * @param {Matrix4} m - The matrix to copy the translation component.
   * @return {Matrix4} A reference to this matrix.
   */
  copyPosition(m) {
    const te = this.elements, me = m.elements;
    te[12] = me[12];
    te[13] = me[13];
    te[14] = me[14];
    return this;
  }
  /**
   * Set the upper 3x3 elements of this matrix to the values of given 3x3 matrix.
   *
   * @param {Matrix3} m - The 3x3 matrix.
   * @return {Matrix4} A reference to this matrix.
   */
  setFromMatrix3(m) {
    const me = m.elements;
    this.set(
      me[0],
      me[3],
      me[6],
      0,
      me[1],
      me[4],
      me[7],
      0,
      me[2],
      me[5],
      me[8],
      0,
      0,
      0,
      0,
      1
    );
    return this;
  }
  /**
   * Extracts the basis vectors of this matrix into the three vectors provided.
   *
   * @param {Vector3} xAxis - The basis's x axis.
   * @param {Vector3} yAxis - The basis's y axis.
   * @param {Vector3} zAxis - The basis's z axis.
   * @return {Matrix4} A reference to this matrix.
   */
  extractBasis(xAxis, yAxis, zAxis) {
    if (this.determinantAffine() === 0) {
      xAxis.set(1, 0, 0);
      yAxis.set(0, 1, 0);
      zAxis.set(0, 0, 1);
      return this;
    }
    xAxis.setFromMatrixColumn(this, 0);
    yAxis.setFromMatrixColumn(this, 1);
    zAxis.setFromMatrixColumn(this, 2);
    return this;
  }
  /**
   * Sets the given basis vectors to this matrix.
   *
   * @param {Vector3} xAxis - The basis's x axis.
   * @param {Vector3} yAxis - The basis's y axis.
   * @param {Vector3} zAxis - The basis's z axis.
   * @return {Matrix4} A reference to this matrix.
   */
  makeBasis(xAxis, yAxis, zAxis) {
    this.set(
      xAxis.x,
      yAxis.x,
      zAxis.x,
      0,
      xAxis.y,
      yAxis.y,
      zAxis.y,
      0,
      xAxis.z,
      yAxis.z,
      zAxis.z,
      0,
      0,
      0,
      0,
      1
    );
    return this;
  }
  /**
   * Extracts the rotation component of the given matrix
   * into this matrix's rotation component.
   *
   * Note: This method does not support reflection matrices.
   *
   * @param {Matrix4} m - The matrix.
   * @return {Matrix4} A reference to this matrix.
   */
  extractRotation(m) {
    if (m.determinantAffine() === 0) {
      return this.identity();
    }
    const te = this.elements;
    const me = m.elements;
    const scaleX = 1 / _v1$7.setFromMatrixColumn(m, 0).length();
    const scaleY = 1 / _v1$7.setFromMatrixColumn(m, 1).length();
    const scaleZ = 1 / _v1$7.setFromMatrixColumn(m, 2).length();
    te[0] = me[0] * scaleX;
    te[1] = me[1] * scaleX;
    te[2] = me[2] * scaleX;
    te[3] = 0;
    te[4] = me[4] * scaleY;
    te[5] = me[5] * scaleY;
    te[6] = me[6] * scaleY;
    te[7] = 0;
    te[8] = me[8] * scaleZ;
    te[9] = me[9] * scaleZ;
    te[10] = me[10] * scaleZ;
    te[11] = 0;
    te[12] = 0;
    te[13] = 0;
    te[14] = 0;
    te[15] = 1;
    return this;
  }
  /**
   * Sets the rotation component (the upper left 3x3 matrix) of this matrix to
   * the rotation specified by the given Euler angles. The rest of
   * the matrix is set to the identity. Depending on the {@link Euler#order},
   * there are six possible outcomes. See [this page](https://en.wikipedia.org/wiki/Euler_angles#Rotation_matrix)
   * for a complete list.
   *
   * @param {Euler} euler - The Euler angles.
   * @return {Matrix4} A reference to this matrix.
   */
  makeRotationFromEuler(euler) {
    const te = this.elements;
    const x = euler.x, y = euler.y, z = euler.z;
    const a = Math.cos(x), b = Math.sin(x);
    const c = Math.cos(y), d = Math.sin(y);
    const e = Math.cos(z), f = Math.sin(z);
    if (euler.order === "XYZ") {
      const ae = a * e, af = a * f, be = b * e, bf = b * f;
      te[0] = c * e;
      te[4] = -c * f;
      te[8] = d;
      te[1] = af + be * d;
      te[5] = ae - bf * d;
      te[9] = -b * c;
      te[2] = bf - ae * d;
      te[6] = be + af * d;
      te[10] = a * c;
    } else if (euler.order === "YXZ") {
      const ce = c * e, cf = c * f, de = d * e, df = d * f;
      te[0] = ce + df * b;
      te[4] = de * b - cf;
      te[8] = a * d;
      te[1] = a * f;
      te[5] = a * e;
      te[9] = -b;
      te[2] = cf * b - de;
      te[6] = df + ce * b;
      te[10] = a * c;
    } else if (euler.order === "ZXY") {
      const ce = c * e, cf = c * f, de = d * e, df = d * f;
      te[0] = ce - df * b;
      te[4] = -a * f;
      te[8] = de + cf * b;
      te[1] = cf + de * b;
      te[5] = a * e;
      te[9] = df - ce * b;
      te[2] = -a * d;
      te[6] = b;
      te[10] = a * c;
    } else if (euler.order === "ZYX") {
      const ae = a * e, af = a * f, be = b * e, bf = b * f;
      te[0] = c * e;
      te[4] = be * d - af;
      te[8] = ae * d + bf;
      te[1] = c * f;
      te[5] = bf * d + ae;
      te[9] = af * d - be;
      te[2] = -d;
      te[6] = b * c;
      te[10] = a * c;
    } else if (euler.order === "YZX") {
      const ac = a * c, ad = a * d, bc = b * c, bd = b * d;
      te[0] = c * e;
      te[4] = bd - ac * f;
      te[8] = bc * f + ad;
      te[1] = f;
      te[5] = a * e;
      te[9] = -b * e;
      te[2] = -d * e;
      te[6] = ad * f + bc;
      te[10] = ac - bd * f;
    } else if (euler.order === "XZY") {
      const ac = a * c, ad = a * d, bc = b * c, bd = b * d;
      te[0] = c * e;
      te[4] = -f;
      te[8] = d * e;
      te[1] = ac * f + bd;
      te[5] = a * e;
      te[9] = ad * f - bc;
      te[2] = bc * f - ad;
      te[6] = b * e;
      te[10] = bd * f + ac;
    }
    te[3] = 0;
    te[7] = 0;
    te[11] = 0;
    te[12] = 0;
    te[13] = 0;
    te[14] = 0;
    te[15] = 1;
    return this;
  }
  /**
   * Sets the rotation component of this matrix to the rotation specified by
   * the given Quaternion as outlined [here](https://en.wikipedia.org/wiki/Rotation_matrix#Quaternion)
   * The rest of the matrix is set to the identity.
   *
   * @param {Quaternion} q - The Quaternion.
   * @return {Matrix4} A reference to this matrix.
   */
  makeRotationFromQuaternion(q) {
    return this.compose(_zero, q, _one);
  }
  /**
   * Sets the rotation component of the transformation matrix, looking from `eye` towards
   * `target`, and oriented by the up-direction.
   *
   * @param {Vector3} eye - The eye vector.
   * @param {Vector3} target - The target vector.
   * @param {Vector3} up - The up vector.
   * @return {Matrix4} A reference to this matrix.
   */
  lookAt(eye, target, up) {
    const te = this.elements;
    _z.subVectors(eye, target);
    if (_z.lengthSq() === 0) {
      _z.z = 1;
    }
    _z.normalize();
    _x.crossVectors(up, _z);
    if (_x.lengthSq() === 0) {
      if (Math.abs(up.z) === 1) {
        _z.x += 1e-4;
      } else {
        _z.z += 1e-4;
      }
      _z.normalize();
      _x.crossVectors(up, _z);
    }
    _x.normalize();
    _y.crossVectors(_z, _x);
    te[0] = _x.x;
    te[4] = _y.x;
    te[8] = _z.x;
    te[1] = _x.y;
    te[5] = _y.y;
    te[9] = _z.y;
    te[2] = _x.z;
    te[6] = _y.z;
    te[10] = _z.z;
    return this;
  }
  /**
   * Post-multiplies this matrix by the given 4x4 matrix.
   *
   * @param {Matrix4} m - The matrix to multiply with.
   * @return {Matrix4} A reference to this matrix.
   */
  multiply(m) {
    return this.multiplyMatrices(this, m);
  }
  /**
   * Pre-multiplies this matrix by the given 4x4 matrix.
   *
   * @param {Matrix4} m - The matrix to multiply with.
   * @return {Matrix4} A reference to this matrix.
   */
  premultiply(m) {
    return this.multiplyMatrices(m, this);
  }
  /**
   * Multiples the given 4x4 matrices and stores the result
   * in this matrix.
   *
   * @param {Matrix4} a - The first matrix.
   * @param {Matrix4} b - The second matrix.
   * @return {Matrix4} A reference to this matrix.
   */
  multiplyMatrices(a, b) {
    const ae = a.elements;
    const be = b.elements;
    const te = this.elements;
    const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
    const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
    const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
    const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];
    const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
    const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
    const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
    const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];
    te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
    te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
    te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
    te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
    te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
    te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
    te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
    te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
    te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
    te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
    te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
    te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
    te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
    te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
    te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
    te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
    return this;
  }
  /**
   * Multiplies every component of the matrix by the given scalar.
   *
   * @param {number} s - The scalar.
   * @return {Matrix4} A reference to this matrix.
   */
  multiplyScalar(s) {
    const te = this.elements;
    te[0] *= s;
    te[4] *= s;
    te[8] *= s;
    te[12] *= s;
    te[1] *= s;
    te[5] *= s;
    te[9] *= s;
    te[13] *= s;
    te[2] *= s;
    te[6] *= s;
    te[10] *= s;
    te[14] *= s;
    te[3] *= s;
    te[7] *= s;
    te[11] *= s;
    te[15] *= s;
    return this;
  }
  /**
   * Computes and returns the determinant of this matrix.
   *
   * @return {number} The determinant.
   */
  determinant() {
    const te = this.elements;
    const n11 = te[0], n12 = te[4], n13 = te[8], n14 = te[12];
    const n21 = te[1], n22 = te[5], n23 = te[9], n24 = te[13];
    const n31 = te[2], n32 = te[6], n33 = te[10], n34 = te[14];
    const n41 = te[3], n42 = te[7], n43 = te[11], n44 = te[15];
    const t11 = n23 * n34 - n24 * n33;
    const t12 = n22 * n34 - n24 * n32;
    const t13 = n22 * n33 - n23 * n32;
    const t21 = n21 * n34 - n24 * n31;
    const t22 = n21 * n33 - n23 * n31;
    const t23 = n21 * n32 - n22 * n31;
    return n11 * (n42 * t11 - n43 * t12 + n44 * t13) - n12 * (n41 * t11 - n43 * t21 + n44 * t22) + n13 * (n41 * t12 - n42 * t21 + n44 * t23) - n14 * (n41 * t13 - n42 * t22 + n43 * t23);
  }
  /**
   * Computes and returns the determinant of the 4x4 matrix, but assumes the
   * matrix is affine, saving some computations.
   *
   * For affine matrices (like an object's world matrix), this value equals the
   * full 4x4 {@link Matrix4#determinant} but is cheaper to compute.
   *
   * Assumes the bottom row is [0, 0, 0, 1].
   *
   * @return {number} The determinant of the matrix.
   */
  determinantAffine() {
    const te = this.elements;
    const n11 = te[0], n12 = te[4], n13 = te[8];
    const n21 = te[1], n22 = te[5], n23 = te[9];
    const n31 = te[2], n32 = te[6], n33 = te[10];
    return n11 * (n22 * n33 - n23 * n32) - n12 * (n21 * n33 - n23 * n31) + n13 * (n21 * n32 - n22 * n31);
  }
  /**
   * Transposes this matrix in place.
   *
   * @return {Matrix4} A reference to this matrix.
   */
  transpose() {
    const te = this.elements;
    let tmp;
    tmp = te[1];
    te[1] = te[4];
    te[4] = tmp;
    tmp = te[2];
    te[2] = te[8];
    te[8] = tmp;
    tmp = te[6];
    te[6] = te[9];
    te[9] = tmp;
    tmp = te[3];
    te[3] = te[12];
    te[12] = tmp;
    tmp = te[7];
    te[7] = te[13];
    te[13] = tmp;
    tmp = te[11];
    te[11] = te[14];
    te[14] = tmp;
    return this;
  }
  /**
   * Sets the position component for this matrix from the given vector,
   * without affecting the rest of the matrix.
   *
   * @param {number|Vector3} x - The x component of the vector or alternatively the vector object.
   * @param {number} y - The y component of the vector.
   * @param {number} z - The z component of the vector.
   * @return {Matrix4} A reference to this matrix.
   */
  setPosition(x, y, z) {
    const te = this.elements;
    if (x.isVector3) {
      te[12] = x.x;
      te[13] = x.y;
      te[14] = x.z;
    } else {
      te[12] = x;
      te[13] = y;
      te[14] = z;
    }
    return this;
  }
  /**
   * Inverts this matrix, using the [analytic method](https://en.wikipedia.org/wiki/Invertible_matrix#Analytic_solution).
   * You can not invert with a determinant of zero. If you attempt this, the method produces
   * a zero matrix instead.
   *
   * @return {Matrix4} A reference to this matrix.
   */
  invert() {
    const te = this.elements, n11 = te[0], n21 = te[1], n31 = te[2], n41 = te[3], n12 = te[4], n22 = te[5], n32 = te[6], n42 = te[7], n13 = te[8], n23 = te[9], n33 = te[10], n43 = te[11], n14 = te[12], n24 = te[13], n34 = te[14], n44 = te[15], t1 = n11 * n22 - n21 * n12, t2 = n11 * n32 - n31 * n12, t3 = n11 * n42 - n41 * n12, t4 = n21 * n32 - n31 * n22, t5 = n21 * n42 - n41 * n22, t6 = n31 * n42 - n41 * n32, t7 = n13 * n24 - n23 * n14, t8 = n13 * n34 - n33 * n14, t9 = n13 * n44 - n43 * n14, t10 = n23 * n34 - n33 * n24, t11 = n23 * n44 - n43 * n24, t12 = n33 * n44 - n43 * n34;
    const det = t1 * t12 - t2 * t11 + t3 * t10 + t4 * t9 - t5 * t8 + t6 * t7;
    if (det === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    const detInv = 1 / det;
    te[0] = (n22 * t12 - n32 * t11 + n42 * t10) * detInv;
    te[1] = (n31 * t11 - n21 * t12 - n41 * t10) * detInv;
    te[2] = (n24 * t6 - n34 * t5 + n44 * t4) * detInv;
    te[3] = (n33 * t5 - n23 * t6 - n43 * t4) * detInv;
    te[4] = (n32 * t9 - n12 * t12 - n42 * t8) * detInv;
    te[5] = (n11 * t12 - n31 * t9 + n41 * t8) * detInv;
    te[6] = (n34 * t3 - n14 * t6 - n44 * t2) * detInv;
    te[7] = (n13 * t6 - n33 * t3 + n43 * t2) * detInv;
    te[8] = (n12 * t11 - n22 * t9 + n42 * t7) * detInv;
    te[9] = (n21 * t9 - n11 * t11 - n41 * t7) * detInv;
    te[10] = (n14 * t5 - n24 * t3 + n44 * t1) * detInv;
    te[11] = (n23 * t3 - n13 * t5 - n43 * t1) * detInv;
    te[12] = (n22 * t8 - n12 * t10 - n32 * t7) * detInv;
    te[13] = (n11 * t10 - n21 * t8 + n31 * t7) * detInv;
    te[14] = (n24 * t2 - n14 * t4 - n34 * t1) * detInv;
    te[15] = (n13 * t4 - n23 * t2 + n33 * t1) * detInv;
    return this;
  }
  /**
   * Scales each of the first three columns of this matrix by the corresponding component of the given vector.
   *
   * @param {Vector3} v - The scale vector.
   * @return {Matrix4} A reference to this matrix.
   */
  scale(v) {
    const te = this.elements;
    const x = v.x, y = v.y, z = v.z;
    te[0] *= x;
    te[4] *= y;
    te[8] *= z;
    te[1] *= x;
    te[5] *= y;
    te[9] *= z;
    te[2] *= x;
    te[6] *= y;
    te[10] *= z;
    te[3] *= x;
    te[7] *= y;
    te[11] *= z;
    return this;
  }
  /**
   * Gets the maximum scale value of the three axes.
   *
   * @return {number} The maximum scale.
   */
  getMaxScaleOnAxis() {
    const te = this.elements;
    const scaleXSq = te[0] * te[0] + te[1] * te[1] + te[2] * te[2];
    const scaleYSq = te[4] * te[4] + te[5] * te[5] + te[6] * te[6];
    const scaleZSq = te[8] * te[8] + te[9] * te[9] + te[10] * te[10];
    return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));
  }
  /**
   * Sets this matrix as a translation transform from the given vector.
   *
   * @param {number|Vector3} x - The amount to translate in the X axis or alternatively a translation vector.
   * @param {number} y - The amount to translate in the Y axis.
   * @param {number} z - The amount to translate in the z axis.
   * @return {Matrix4} A reference to this matrix.
   */
  makeTranslation(x, y, z) {
    if (x.isVector3) {
      this.set(
        1,
        0,
        0,
        x.x,
        0,
        1,
        0,
        x.y,
        0,
        0,
        1,
        x.z,
        0,
        0,
        0,
        1
      );
    } else {
      this.set(
        1,
        0,
        0,
        x,
        0,
        1,
        0,
        y,
        0,
        0,
        1,
        z,
        0,
        0,
        0,
        1
      );
    }
    return this;
  }
  /**
   * Sets this matrix as a rotational transformation around the X axis by
   * the given angle.
   *
   * @param {number} theta - The rotation in radians.
   * @return {Matrix4} A reference to this matrix.
   */
  makeRotationX(theta) {
    const c = Math.cos(theta), s = Math.sin(theta);
    this.set(
      1,
      0,
      0,
      0,
      0,
      c,
      -s,
      0,
      0,
      s,
      c,
      0,
      0,
      0,
      0,
      1
    );
    return this;
  }
  /**
   * Sets this matrix as a rotational transformation around the Y axis by
   * the given angle.
   *
   * @param {number} theta - The rotation in radians.
   * @return {Matrix4} A reference to this matrix.
   */
  makeRotationY(theta) {
    const c = Math.cos(theta), s = Math.sin(theta);
    this.set(
      c,
      0,
      s,
      0,
      0,
      1,
      0,
      0,
      -s,
      0,
      c,
      0,
      0,
      0,
      0,
      1
    );
    return this;
  }
  /**
   * Sets this matrix as a rotational transformation around the Z axis by
   * the given angle.
   *
   * @param {number} theta - The rotation in radians.
   * @return {Matrix4} A reference to this matrix.
   */
  makeRotationZ(theta) {
    const c = Math.cos(theta), s = Math.sin(theta);
    this.set(
      c,
      -s,
      0,
      0,
      s,
      c,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    );
    return this;
  }
  /**
   * Sets this matrix as a rotational transformation around the given axis by
   * the given angle.
   *
   * @param {Vector3} axis - The normalized rotation axis.
   * @param {number} angle - The rotation in radians.
   * @return {Matrix4} A reference to this matrix.
   */
  makeRotationAxis(axis, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const t = 1 - c;
    const x = axis.x, y = axis.y, z = axis.z;
    const tx = t * x, ty = t * y;
    this.set(
      tx * x + c,
      tx * y - s * z,
      tx * z + s * y,
      0,
      tx * y + s * z,
      ty * y + c,
      ty * z - s * x,
      0,
      tx * z - s * y,
      ty * z + s * x,
      t * z * z + c,
      0,
      0,
      0,
      0,
      1
    );
    return this;
  }
  /**
   * Sets this matrix as a scale transformation.
   *
   * @param {number} x - The amount to scale in the X axis.
   * @param {number} y - The amount to scale in the Y axis.
   * @param {number} z - The amount to scale in the Z axis.
   * @return {Matrix4} A reference to this matrix.
   */
  makeScale(x, y, z) {
    this.set(
      x,
      0,
      0,
      0,
      0,
      y,
      0,
      0,
      0,
      0,
      z,
      0,
      0,
      0,
      0,
      1
    );
    return this;
  }
  /**
   * Sets this matrix as a shear transformation.
   *
   * @param {number} xy - The amount to shear X by Y.
   * @param {number} xz - The amount to shear X by Z.
   * @param {number} yx - The amount to shear Y by X.
   * @param {number} yz - The amount to shear Y by Z.
   * @param {number} zx - The amount to shear Z by X.
   * @param {number} zy - The amount to shear Z by Y.
   * @return {Matrix4} A reference to this matrix.
   */
  makeShear(xy, xz2, yx, yz, zx, zy) {
    this.set(
      1,
      yx,
      zx,
      0,
      xy,
      1,
      zy,
      0,
      xz2,
      yz,
      1,
      0,
      0,
      0,
      0,
      1
    );
    return this;
  }
  /**
   * Sets this matrix to the transformation composed of the given position,
   * rotation (Quaternion) and scale.
   *
   * @param {Vector3} position - The position vector.
   * @param {Quaternion} quaternion - The rotation as a Quaternion.
   * @param {Vector3} scale - The scale vector.
   * @return {Matrix4} A reference to this matrix.
   */
  compose(position, quaternion, scale) {
    const te = this.elements;
    const x = quaternion._x, y = quaternion._y, z = quaternion._z, w = quaternion._w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz2 = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    const sx = scale.x, sy = scale.y, sz = scale.z;
    te[0] = (1 - (yy + zz)) * sx;
    te[1] = (xy + wz) * sx;
    te[2] = (xz2 - wy) * sx;
    te[3] = 0;
    te[4] = (xy - wz) * sy;
    te[5] = (1 - (xx + zz)) * sy;
    te[6] = (yz + wx) * sy;
    te[7] = 0;
    te[8] = (xz2 + wy) * sz;
    te[9] = (yz - wx) * sz;
    te[10] = (1 - (xx + yy)) * sz;
    te[11] = 0;
    te[12] = position.x;
    te[13] = position.y;
    te[14] = position.z;
    te[15] = 1;
    return this;
  }
  /**
   * Decomposes this matrix into its position, rotation and scale components
   * and provides the result in the given objects.
   *
   * Note: Not all matrices are decomposable in this way. For example, if an
   * object has a non-uniformly scaled parent, then the object's world matrix
   * may not be decomposable, and this method may not be appropriate.
   *
   * @param {Vector3} position - The position vector.
   * @param {Quaternion} quaternion - The rotation as a Quaternion.
   * @param {Vector3} scale - The scale vector.
   * @return {Matrix4} A reference to this matrix.
   */
  decompose(position, quaternion, scale) {
    const te = this.elements;
    position.x = te[12];
    position.y = te[13];
    position.z = te[14];
    const det = this.determinantAffine();
    if (det === 0) {
      scale.set(1, 1, 1);
      quaternion.identity();
      return this;
    }
    let sx = _v1$7.set(te[0], te[1], te[2]).length();
    const sy = _v1$7.set(te[4], te[5], te[6]).length();
    const sz = _v1$7.set(te[8], te[9], te[10]).length();
    if (det < 0) sx = -sx;
    _m1$2.copy(this);
    const invSX = 1 / sx;
    const invSY = 1 / sy;
    const invSZ = 1 / sz;
    _m1$2.elements[0] *= invSX;
    _m1$2.elements[1] *= invSX;
    _m1$2.elements[2] *= invSX;
    _m1$2.elements[4] *= invSY;
    _m1$2.elements[5] *= invSY;
    _m1$2.elements[6] *= invSY;
    _m1$2.elements[8] *= invSZ;
    _m1$2.elements[9] *= invSZ;
    _m1$2.elements[10] *= invSZ;
    quaternion.setFromRotationMatrix(_m1$2);
    scale.x = sx;
    scale.y = sy;
    scale.z = sz;
    return this;
  }
  /**
  	 * Creates a perspective projection matrix. This is used internally by
  	 * {@link PerspectiveCamera#updateProjectionMatrix}.
  
  	 * @param {number} left - Left boundary of the viewing frustum at the near plane.
  	 * @param {number} right - Right boundary of the viewing frustum at the near plane.
  	 * @param {number} top - Top boundary of the viewing frustum at the near plane.
  	 * @param {number} bottom - Bottom boundary of the viewing frustum at the near plane.
  	 * @param {number} near - The distance from the camera to the near plane.
  	 * @param {number} far - The distance from the camera to the far plane.
  	 * @param {(WebGLCoordinateSystem|WebGPUCoordinateSystem)} [coordinateSystem=WebGLCoordinateSystem] - The coordinate system.
  	 * @param {boolean} [reversedDepth=false] - Whether to use a reversed depth.
  	 * @return {Matrix4} A reference to this matrix.
  	 */
  makePerspective(left, right, top, bottom, near, far, coordinateSystem = WebGLCoordinateSystem, reversedDepth = false) {
    const te = this.elements;
    const x = 2 * near / (right - left);
    const y = 2 * near / (top - bottom);
    const a = (right + left) / (right - left);
    const b = (top + bottom) / (top - bottom);
    let c, d;
    if (reversedDepth) {
      c = near / (far - near);
      d = far * near / (far - near);
    } else {
      if (coordinateSystem === WebGLCoordinateSystem) {
        c = -(far + near) / (far - near);
        d = -2 * far * near / (far - near);
      } else if (coordinateSystem === WebGPUCoordinateSystem) {
        c = -far / (far - near);
        d = -far * near / (far - near);
      } else {
        throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: " + coordinateSystem);
      }
    }
    te[0] = x;
    te[4] = 0;
    te[8] = a;
    te[12] = 0;
    te[1] = 0;
    te[5] = y;
    te[9] = b;
    te[13] = 0;
    te[2] = 0;
    te[6] = 0;
    te[10] = c;
    te[14] = d;
    te[3] = 0;
    te[7] = 0;
    te[11] = -1;
    te[15] = 0;
    return this;
  }
  /**
  	 * Creates a orthographic projection matrix. This is used internally by
  	 * {@link OrthographicCamera#updateProjectionMatrix}.
  
  	 * @param {number} left - Left boundary of the viewing frustum at the near plane.
  	 * @param {number} right - Right boundary of the viewing frustum at the near plane.
  	 * @param {number} top - Top boundary of the viewing frustum at the near plane.
  	 * @param {number} bottom - Bottom boundary of the viewing frustum at the near plane.
  	 * @param {number} near - The distance from the camera to the near plane.
  	 * @param {number} far - The distance from the camera to the far plane.
  	 * @param {(WebGLCoordinateSystem|WebGPUCoordinateSystem)} [coordinateSystem=WebGLCoordinateSystem] - The coordinate system.
  	 * @param {boolean} [reversedDepth=false] - Whether to use a reversed depth.
  	 * @return {Matrix4} A reference to this matrix.
  	 */
  makeOrthographic(left, right, top, bottom, near, far, coordinateSystem = WebGLCoordinateSystem, reversedDepth = false) {
    const te = this.elements;
    const x = 2 / (right - left);
    const y = 2 / (top - bottom);
    const a = -(right + left) / (right - left);
    const b = -(top + bottom) / (top - bottom);
    let c, d;
    if (reversedDepth) {
      c = 1 / (far - near);
      d = far / (far - near);
    } else {
      if (coordinateSystem === WebGLCoordinateSystem) {
        c = -2 / (far - near);
        d = -(far + near) / (far - near);
      } else if (coordinateSystem === WebGPUCoordinateSystem) {
        c = -1 / (far - near);
        d = -near / (far - near);
      } else {
        throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: " + coordinateSystem);
      }
    }
    te[0] = x;
    te[4] = 0;
    te[8] = 0;
    te[12] = a;
    te[1] = 0;
    te[5] = y;
    te[9] = 0;
    te[13] = b;
    te[2] = 0;
    te[6] = 0;
    te[10] = c;
    te[14] = d;
    te[3] = 0;
    te[7] = 0;
    te[11] = 0;
    te[15] = 1;
    return this;
  }
  /**
   * Returns `true` if this matrix is equal with the given one.
   *
   * @param {Matrix4} matrix - The matrix to test for equality.
   * @return {boolean} Whether this matrix is equal with the given one.
   */
  equals(matrix) {
    const te = this.elements;
    const me = matrix.elements;
    for (let i = 0; i < 16; i++) {
      if (te[i] !== me[i]) return false;
    }
    return true;
  }
  /**
   * Sets the elements of the matrix from the given array.
   *
   * @param {Array<number>} array - The matrix elements in column-major order.
   * @param {number} [offset=0] - Index of the first element in the array.
   * @return {Matrix4} A reference to this matrix.
   */
  fromArray(array, offset = 0) {
    for (let i = 0; i < 16; i++) {
      this.elements[i] = array[i + offset];
    }
    return this;
  }
  /**
   * Writes the elements of this matrix to the given array. If no array is provided,
   * the method returns a new instance.
   *
   * @param {Array<number>} [array=[]] - The target array holding the matrix elements in column-major order.
   * @param {number} [offset=0] - Index of the first element in the array.
   * @return {Array<number>} The matrix elements in column-major order.
   */
  toArray(array = [], offset = 0) {
    const te = this.elements;
    array[offset] = te[0];
    array[offset + 1] = te[1];
    array[offset + 2] = te[2];
    array[offset + 3] = te[3];
    array[offset + 4] = te[4];
    array[offset + 5] = te[5];
    array[offset + 6] = te[6];
    array[offset + 7] = te[7];
    array[offset + 8] = te[8];
    array[offset + 9] = te[9];
    array[offset + 10] = te[10];
    array[offset + 11] = te[11];
    array[offset + 12] = te[12];
    array[offset + 13] = te[13];
    array[offset + 14] = te[14];
    array[offset + 15] = te[15];
    return array;
  }
};
var _v1$7 = /* @__PURE__ */ new Vector3();
var _m1$2 = /* @__PURE__ */ new Matrix4();
var _zero = /* @__PURE__ */ new Vector3(0, 0, 0);
var _one = /* @__PURE__ */ new Vector3(1, 1, 1);
var _x = /* @__PURE__ */ new Vector3();
var _y = /* @__PURE__ */ new Vector3();
var _z = /* @__PURE__ */ new Vector3();
var _matrix$2 = /* @__PURE__ */ new Matrix4();
var _quaternion$4 = /* @__PURE__ */ new Quaternion();
var Euler = class _Euler {
  /**
   * Constructs a new euler instance.
   *
   * @param {number} [x=0] - The angle of the x axis in radians.
   * @param {number} [y=0] - The angle of the y axis in radians.
   * @param {number} [z=0] - The angle of the z axis in radians.
   * @param {string} [order=Euler.DEFAULT_ORDER] - A string representing the order that the rotations are applied.
   */
  constructor(x = 0, y = 0, z = 0, order = _Euler.DEFAULT_ORDER) {
    this.isEuler = true;
    this._x = x;
    this._y = y;
    this._z = z;
    this._order = order;
  }
  /**
   * The angle of the x axis in radians.
   *
   * @type {number}
   * @default 0
   */
  get x() {
    return this._x;
  }
  set x(value) {
    this._x = value;
    this._onChangeCallback();
  }
  /**
   * The angle of the y axis in radians.
   *
   * @type {number}
   * @default 0
   */
  get y() {
    return this._y;
  }
  set y(value) {
    this._y = value;
    this._onChangeCallback();
  }
  /**
   * The angle of the z axis in radians.
   *
   * @type {number}
   * @default 0
   */
  get z() {
    return this._z;
  }
  set z(value) {
    this._z = value;
    this._onChangeCallback();
  }
  /**
   * A string representing the order that the rotations are applied.
   *
   * @type {string}
   * @default 'XYZ'
   */
  get order() {
    return this._order;
  }
  set order(value) {
    this._order = value;
    this._onChangeCallback();
  }
  /**
   * Sets the Euler components.
   *
   * @param {number} x - The angle of the x axis in radians.
   * @param {number} y - The angle of the y axis in radians.
   * @param {number} z - The angle of the z axis in radians.
   * @param {string} [order] - A string representing the order that the rotations are applied.
   * @return {Euler} A reference to this Euler instance.
   */
  set(x, y, z, order = this._order) {
    this._x = x;
    this._y = y;
    this._z = z;
    this._order = order;
    this._onChangeCallback();
    return this;
  }
  /**
   * Returns a new Euler instance with copied values from this instance.
   *
   * @return {Euler} A clone of this instance.
   */
  clone() {
    return new this.constructor(this._x, this._y, this._z, this._order);
  }
  /**
   * Copies the values of the given Euler instance to this instance.
   *
   * @param {Euler} euler - The Euler instance to copy.
   * @return {Euler} A reference to this Euler instance.
   */
  copy(euler) {
    this._x = euler._x;
    this._y = euler._y;
    this._z = euler._z;
    this._order = euler._order;
    this._onChangeCallback();
    return this;
  }
  /**
   * Sets the angles of this Euler instance from a pure rotation matrix.
   *
   * @param {Matrix4} m - A 4x4 matrix of which the upper 3x3 of matrix is a pure rotation matrix (i.e. unscaled).
   * @param {string} [order] - A string representing the order that the rotations are applied.
   * @param {boolean} [update=true] - Whether the internal `onChange` callback should be executed or not.
   * @return {Euler} A reference to this Euler instance.
   */
  setFromRotationMatrix(m, order = this._order, update = true) {
    const te = m.elements;
    const m11 = te[0], m12 = te[4], m13 = te[8];
    const m21 = te[1], m22 = te[5], m23 = te[9];
    const m31 = te[2], m32 = te[6], m33 = te[10];
    switch (order) {
      case "XYZ":
        this._y = Math.asin(clamp2(m13, -1, 1));
        if (Math.abs(m13) < 0.9999999) {
          this._x = Math.atan2(-m23, m33);
          this._z = Math.atan2(-m12, m11);
        } else {
          this._x = Math.atan2(m32, m22);
          this._z = 0;
        }
        break;
      case "YXZ":
        this._x = Math.asin(-clamp2(m23, -1, 1));
        if (Math.abs(m23) < 0.9999999) {
          this._y = Math.atan2(m13, m33);
          this._z = Math.atan2(m21, m22);
        } else {
          this._y = Math.atan2(-m31, m11);
          this._z = 0;
        }
        break;
      case "ZXY":
        this._x = Math.asin(clamp2(m32, -1, 1));
        if (Math.abs(m32) < 0.9999999) {
          this._y = Math.atan2(-m31, m33);
          this._z = Math.atan2(-m12, m22);
        } else {
          this._y = 0;
          this._z = Math.atan2(m21, m11);
        }
        break;
      case "ZYX":
        this._y = Math.asin(-clamp2(m31, -1, 1));
        if (Math.abs(m31) < 0.9999999) {
          this._x = Math.atan2(m32, m33);
          this._z = Math.atan2(m21, m11);
        } else {
          this._x = 0;
          this._z = Math.atan2(-m12, m22);
        }
        break;
      case "YZX":
        this._z = Math.asin(clamp2(m21, -1, 1));
        if (Math.abs(m21) < 0.9999999) {
          this._x = Math.atan2(-m23, m22);
          this._y = Math.atan2(-m31, m11);
        } else {
          this._x = 0;
          this._y = Math.atan2(m13, m33);
        }
        break;
      case "XZY":
        this._z = Math.asin(-clamp2(m12, -1, 1));
        if (Math.abs(m12) < 0.9999999) {
          this._x = Math.atan2(m32, m22);
          this._y = Math.atan2(m13, m11);
        } else {
          this._x = Math.atan2(-m23, m33);
          this._y = 0;
        }
        break;
      default:
        warn("Euler: .setFromRotationMatrix() encountered an unknown order: " + order);
    }
    this._order = order;
    if (update === true) this._onChangeCallback();
    return this;
  }
  /**
   * Sets the angles of this Euler instance from a normalized quaternion.
   *
   * @param {Quaternion} q - A normalized Quaternion.
   * @param {string} [order] - A string representing the order that the rotations are applied.
   * @param {boolean} [update=true] - Whether the internal `onChange` callback should be executed or not.
   * @return {Euler} A reference to this Euler instance.
   */
  setFromQuaternion(q, order, update) {
    _matrix$2.makeRotationFromQuaternion(q);
    return this.setFromRotationMatrix(_matrix$2, order, update);
  }
  /**
   * Sets the angles of this Euler instance from the given vector.
   *
   * @param {Vector3} v - The vector.
   * @param {string} [order] - A string representing the order that the rotations are applied.
   * @return {Euler} A reference to this Euler instance.
   */
  setFromVector3(v, order = this._order) {
    return this.set(v.x, v.y, v.z, order);
  }
  /**
   * Resets the euler angle with a new order by creating a quaternion from this
   * euler angle and then setting this euler angle with the quaternion and the
   * new order.
   *
   * Warning: This discards revolution information.
   *
   * @param {string} [newOrder] - A string representing the new order that the rotations are applied.
   * @return {Euler} A reference to this Euler instance.
   */
  reorder(newOrder) {
    _quaternion$4.setFromEuler(this);
    return this.setFromQuaternion(_quaternion$4, newOrder);
  }
  /**
   * Returns `true` if this Euler instance is equal with the given one.
   *
   * @param {Euler} euler - The Euler instance to test for equality.
   * @return {boolean} Whether this Euler instance is equal with the given one.
   */
  equals(euler) {
    return euler._x === this._x && euler._y === this._y && euler._z === this._z && euler._order === this._order;
  }
  /**
   * Sets this Euler instance's components to values from the given array. The first three
   * entries of the array are assign to the x,y and z components. An optional fourth entry
   * defines the Euler order.
   *
   * @param {Array<number,number,number,?string>} array - An array holding the Euler component values.
   * @return {Euler} A reference to this Euler instance.
   */
  fromArray(array) {
    this._x = array[0];
    this._y = array[1];
    this._z = array[2];
    if (array[3] !== void 0) this._order = array[3];
    this._onChangeCallback();
    return this;
  }
  /**
   * Writes the components of this Euler instance to the given array. If no array is provided,
   * the method returns a new instance.
   *
   * @param {Array<number,number,number,string>} [array=[]] - The target array holding the Euler components.
   * @param {number} [offset=0] - Index of the first element in the array.
   * @return {Array<number,number,number,string>} The Euler components.
   */
  toArray(array = [], offset = 0) {
    array[offset] = this._x;
    array[offset + 1] = this._y;
    array[offset + 2] = this._z;
    array[offset + 3] = this._order;
    return array;
  }
  _onChange(callback) {
    this._onChangeCallback = callback;
    return this;
  }
  _onChangeCallback() {
  }
  *[Symbol.iterator]() {
    yield this._x;
    yield this._y;
    yield this._z;
    yield this._order;
  }
};
Euler.DEFAULT_ORDER = "XYZ";
var Layers = class {
  /**
   * Constructs a new layers instance, with membership
   * initially set to layer `0`.
   */
  constructor() {
    this.mask = 1 | 0;
  }
  /**
   * Sets membership to the given layer, and remove membership all other layers.
   *
   * @param {number} layer - The layer to set.
   */
  set(layer) {
    this.mask = (1 << layer | 0) >>> 0;
  }
  /**
   * Adds membership of the given layer.
   *
   * @param {number} layer - The layer to enable.
   */
  enable(layer) {
    this.mask |= 1 << layer | 0;
  }
  /**
   * Adds membership to all layers.
   */
  enableAll() {
    this.mask = 4294967295 | 0;
  }
  /**
   * Toggles the membership of the given layer.
   *
   * @param {number} layer - The layer to toggle.
   */
  toggle(layer) {
    this.mask ^= 1 << layer | 0;
  }
  /**
   * Removes membership of the given layer.
   *
   * @param {number} layer - The layer to enable.
   */
  disable(layer) {
    this.mask &= ~(1 << layer | 0);
  }
  /**
   * Removes the membership from all layers.
   */
  disableAll() {
    this.mask = 0;
  }
  /**
   * Returns `true` if this and the given layers object have at least one
   * layer in common.
   *
   * @param {Layers} layers - The layers to test.
   * @return {boolean } Whether this and the given layers object have at least one layer in common or not.
   */
  test(layers) {
    return (this.mask & layers.mask) !== 0;
  }
  /**
   * Returns `true` if the given layer is enabled.
   *
   * @param {number} layer - The layer to test.
   * @return {boolean } Whether the given layer is enabled or not.
   */
  isEnabled(layer) {
    return (this.mask & (1 << layer | 0)) !== 0;
  }
};
var _object3DId = 0;
var _v1$6 = /* @__PURE__ */ new Vector3();
var _q1 = /* @__PURE__ */ new Quaternion();
var _m1$1 = /* @__PURE__ */ new Matrix4();
var _target = /* @__PURE__ */ new Vector3();
var _position$4 = /* @__PURE__ */ new Vector3();
var _scale$3 = /* @__PURE__ */ new Vector3();
var _quaternion$3 = /* @__PURE__ */ new Quaternion();
var _xAxis = /* @__PURE__ */ new Vector3(1, 0, 0);
var _yAxis = /* @__PURE__ */ new Vector3(0, 1, 0);
var _zAxis = /* @__PURE__ */ new Vector3(0, 0, 1);
var _addedEvent = { type: "added" };
var _removedEvent = { type: "removed" };
var _childaddedEvent = { type: "childadded", child: null };
var _childremovedEvent = { type: "childremoved", child: null };
var Object3D = class _Object3D extends EventDispatcher {
  /**
   * Constructs a new 3D object.
   */
  constructor() {
    super();
    this.isObject3D = true;
    Object.defineProperty(this, "id", { value: _object3DId++ });
    this.uuid = generateUUID();
    this.name = "";
    this.type = "Object3D";
    this.parent = null;
    this.children = [];
    this.up = _Object3D.DEFAULT_UP.clone();
    const position = new Vector3();
    const rotation = new Euler();
    const quaternion = new Quaternion();
    const scale = new Vector3(1, 1, 1);
    function onRotationChange() {
      quaternion.setFromEuler(rotation, false);
    }
    function onQuaternionChange() {
      rotation.setFromQuaternion(quaternion, void 0, false);
    }
    rotation._onChange(onRotationChange);
    quaternion._onChange(onQuaternionChange);
    Object.defineProperties(this, {
      /**
       * Represents the object's local position.
       *
       * @name Object3D#position
       * @type {Vector3}
       * @default (0,0,0)
       */
      position: {
        configurable: true,
        enumerable: true,
        value: position
      },
      /**
       * Represents the object's local rotation as Euler angles, in radians.
       *
       * @name Object3D#rotation
       * @type {Euler}
       * @default (0,0,0)
       */
      rotation: {
        configurable: true,
        enumerable: true,
        value: rotation
      },
      /**
       * Represents the object's local rotation as Quaternions.
       *
       * @name Object3D#quaternion
       * @type {Quaternion}
       */
      quaternion: {
        configurable: true,
        enumerable: true,
        value: quaternion
      },
      /**
       * Represents the object's local scale.
       *
       * @name Object3D#scale
       * @type {Vector3}
       * @default (1,1,1)
       */
      scale: {
        configurable: true,
        enumerable: true,
        value: scale
      },
      /**
       * Represents the object's model-view matrix.
       *
       * @name Object3D#modelViewMatrix
       * @type {Matrix4}
       */
      modelViewMatrix: {
        value: new Matrix4()
      },
      /**
       * Represents the object's normal matrix.
       *
       * @name Object3D#normalMatrix
       * @type {Matrix3}
       */
      normalMatrix: {
        value: new Matrix3()
      }
    });
    this.matrix = new Matrix4();
    this.matrixWorld = new Matrix4();
    this.matrixAutoUpdate = _Object3D.DEFAULT_MATRIX_AUTO_UPDATE;
    this.matrixWorldAutoUpdate = _Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE;
    this.matrixWorldNeedsUpdate = false;
    this.layers = new Layers();
    this.visible = true;
    this.castShadow = false;
    this.receiveShadow = false;
    this.frustumCulled = true;
    this.renderOrder = 0;
    this.animations = [];
    this.customDepthMaterial = void 0;
    this.customDistanceMaterial = void 0;
    this.static = false;
    this.userData = {};
    this.pivot = null;
  }
  /**
   * A callback that is executed immediately before a 3D object is rendered to a shadow map.
   *
   * @param {Renderer|WebGLRenderer} renderer - The renderer.
   * @param {Object3D} object - The 3D object.
   * @param {Camera} camera - The camera that is used to render the scene.
   * @param {Camera} shadowCamera - The shadow camera.
   * @param {BufferGeometry} geometry - The 3D object's geometry.
   * @param {Material} depthMaterial - The depth material.
   * @param {Object} group - The geometry group data.
   */
  onBeforeShadow() {
  }
  /**
   * A callback that is executed immediately after a 3D object is rendered to a shadow map.
   *
   * @param {Renderer|WebGLRenderer} renderer - The renderer.
   * @param {Object3D} object - The 3D object.
   * @param {Camera} camera - The camera that is used to render the scene.
   * @param {Camera} shadowCamera - The shadow camera.
   * @param {BufferGeometry} geometry - The 3D object's geometry.
   * @param {Material} depthMaterial - The depth material.
   * @param {Object} group - The geometry group data.
   */
  onAfterShadow() {
  }
  /**
   * A callback that is executed immediately before a 3D object is rendered.
   *
   * @param {Renderer|WebGLRenderer} renderer - The renderer.
   * @param {Object3D} object - The 3D object.
   * @param {Camera} camera - The camera that is used to render the scene.
   * @param {BufferGeometry} geometry - The 3D object's geometry.
   * @param {Material} material - The 3D object's material.
   * @param {Object} group - The geometry group data.
   */
  onBeforeRender() {
  }
  /**
   * A callback that is executed immediately after a 3D object is rendered.
   *
   * @param {Renderer|WebGLRenderer} renderer - The renderer.
   * @param {Object3D} object - The 3D object.
   * @param {Camera} camera - The camera that is used to render the scene.
   * @param {BufferGeometry} geometry - The 3D object's geometry.
   * @param {Material} material - The 3D object's material.
   * @param {Object} group - The geometry group data.
   */
  onAfterRender() {
  }
  /**
   * Applies the given transformation matrix to the object and updates the object's position,
   * rotation and scale.
   *
   * @param {Matrix4} matrix - The transformation matrix.
   */
  applyMatrix4(matrix) {
    if (this.matrixAutoUpdate) this.updateMatrix();
    this.matrix.premultiply(matrix);
    this.matrix.decompose(this.position, this.quaternion, this.scale);
  }
  /**
   * Applies a rotation represented by given the quaternion to the 3D object.
   *
   * @param {Quaternion} q - The quaternion.
   * @return {Object3D} A reference to this instance.
   */
  applyQuaternion(q) {
    this.quaternion.premultiply(q);
    return this;
  }
  /**
   * Sets the given rotation represented as an axis/angle couple to the 3D object.
   *
   * @param {Vector3} axis - The (normalized) axis vector.
   * @param {number} angle - The angle in radians.
   */
  setRotationFromAxisAngle(axis, angle) {
    this.quaternion.setFromAxisAngle(axis, angle);
  }
  /**
   * Sets the given rotation represented as Euler angles to the 3D object.
   *
   * @param {Euler} euler - The Euler angles.
   */
  setRotationFromEuler(euler) {
    this.quaternion.setFromEuler(euler, true);
  }
  /**
   * Sets the given rotation represented as rotation matrix to the 3D object.
   *
   * @param {Matrix4} m - Although a 4x4 matrix is expected, the upper 3x3 portion must be
   * a pure rotation matrix (i.e, unscaled).
   */
  setRotationFromMatrix(m) {
    this.quaternion.setFromRotationMatrix(m);
  }
  /**
   * Sets the given rotation represented as a Quaternion to the 3D object.
   *
   * @param {Quaternion} q - The Quaternion
   */
  setRotationFromQuaternion(q) {
    this.quaternion.copy(q);
  }
  /**
   * Rotates the 3D object along an axis in local space.
   *
   * @param {Vector3} axis - The (normalized) axis vector.
   * @param {number} angle - The angle in radians.
   * @return {Object3D} A reference to this instance.
   */
  rotateOnAxis(axis, angle) {
    _q1.setFromAxisAngle(axis, angle);
    this.quaternion.multiply(_q1);
    return this;
  }
  /**
   * Rotates the 3D object along an axis in world space.
   *
   * @param {Vector3} axis - The (normalized) axis vector.
   * @param {number} angle - The angle in radians.
   * @return {Object3D} A reference to this instance.
   */
  rotateOnWorldAxis(axis, angle) {
    _q1.setFromAxisAngle(axis, angle);
    this.quaternion.premultiply(_q1);
    return this;
  }
  /**
   * Rotates the 3D object around its X axis in local space.
   *
   * @param {number} angle - The angle in radians.
   * @return {Object3D} A reference to this instance.
   */
  rotateX(angle) {
    return this.rotateOnAxis(_xAxis, angle);
  }
  /**
   * Rotates the 3D object around its Y axis in local space.
   *
   * @param {number} angle - The angle in radians.
   * @return {Object3D} A reference to this instance.
   */
  rotateY(angle) {
    return this.rotateOnAxis(_yAxis, angle);
  }
  /**
   * Rotates the 3D object around its Z axis in local space.
   *
   * @param {number} angle - The angle in radians.
   * @return {Object3D} A reference to this instance.
   */
  rotateZ(angle) {
    return this.rotateOnAxis(_zAxis, angle);
  }
  /**
   * Translate the 3D object by a distance along the given axis in local space.
   *
   * @param {Vector3} axis - The (normalized) axis vector.
   * @param {number} distance - The distance in world units.
   * @return {Object3D} A reference to this instance.
   */
  translateOnAxis(axis, distance) {
    _v1$6.copy(axis).applyQuaternion(this.quaternion);
    this.position.add(_v1$6.multiplyScalar(distance));
    return this;
  }
  /**
   * Translate the 3D object by a distance along its X-axis in local space.
   *
   * @param {number} distance - The distance in world units.
   * @return {Object3D} A reference to this instance.
   */
  translateX(distance) {
    return this.translateOnAxis(_xAxis, distance);
  }
  /**
   * Translate the 3D object by a distance along its Y-axis in local space.
   *
   * @param {number} distance - The distance in world units.
   * @return {Object3D} A reference to this instance.
   */
  translateY(distance) {
    return this.translateOnAxis(_yAxis, distance);
  }
  /**
   * Translate the 3D object by a distance along its Z-axis in local space.
   *
   * @param {number} distance - The distance in world units.
   * @return {Object3D} A reference to this instance.
   */
  translateZ(distance) {
    return this.translateOnAxis(_zAxis, distance);
  }
  /**
   * Converts the given vector from this 3D object's local space to world space.
   *
   * @param {Vector3} vector - The vector to convert.
   * @return {Vector3} The converted vector.
   */
  localToWorld(vector) {
    this.updateWorldMatrix(true, false);
    return vector.applyMatrix4(this.matrixWorld);
  }
  /**
   * Converts the given vector from this 3D object's world space to local space.
   *
   * @param {Vector3} vector - The vector to convert.
   * @return {Vector3} The converted vector.
   */
  worldToLocal(vector) {
    this.updateWorldMatrix(true, false);
    return vector.applyMatrix4(_m1$1.copy(this.matrixWorld).invert());
  }
  /**
   * Rotates the object to face a point in world space.
   *
   * This method does not support objects having non-uniformly-scaled parent(s).
   *
   * @param {number|Vector3} x - The x coordinate in world space. Alternatively, a vector representing a position in world space
   * @param {number} [y] - The y coordinate in world space.
   * @param {number} [z] - The z coordinate in world space.
   */
  lookAt(x, y, z) {
    if (x.isVector3) {
      _target.copy(x);
    } else {
      _target.set(x, y, z);
    }
    const parent = this.parent;
    this.updateWorldMatrix(true, false);
    _position$4.setFromMatrixPosition(this.matrixWorld);
    if (this.isCamera || this.isLight) {
      _m1$1.lookAt(_position$4, _target, this.up);
    } else {
      _m1$1.lookAt(_target, _position$4, this.up);
    }
    this.quaternion.setFromRotationMatrix(_m1$1);
    if (parent) {
      _m1$1.extractRotation(parent.matrixWorld);
      _q1.setFromRotationMatrix(_m1$1);
      this.quaternion.premultiply(_q1.invert());
    }
  }
  /**
   * Adds the given 3D object as a child to this 3D object. An arbitrary number of
   * objects may be added. Any current parent on an object passed in here will be
   * removed, since an object can have at most one parent.
   *
   * @fires Object3D#added
   * @fires Object3D#childadded
   * @param {Object3D} object - The 3D object to add.
   * @return {Object3D} A reference to this instance.
   */
  add(object) {
    if (arguments.length > 1) {
      for (let i = 0; i < arguments.length; i++) {
        this.add(arguments[i]);
      }
      return this;
    }
    if (object === this) {
      error("Object3D.add: object can't be added as a child of itself.", object);
      return this;
    }
    if (object && object.isObject3D) {
      object.removeFromParent();
      object.parent = this;
      this.children.push(object);
      object.dispatchEvent(_addedEvent);
      _childaddedEvent.child = object;
      this.dispatchEvent(_childaddedEvent);
      _childaddedEvent.child = null;
    } else {
      error("Object3D.add: object not an instance of THREE.Object3D.", object);
    }
    return this;
  }
  /**
   * Removes the given 3D object as child from this 3D object.
   * An arbitrary number of objects may be removed.
   *
   * @fires Object3D#removed
   * @fires Object3D#childremoved
   * @param {Object3D} object - The 3D object to remove.
   * @return {Object3D} A reference to this instance.
   */
  remove(object) {
    if (arguments.length > 1) {
      for (let i = 0; i < arguments.length; i++) {
        this.remove(arguments[i]);
      }
      return this;
    }
    const index = this.children.indexOf(object);
    if (index !== -1) {
      object.parent = null;
      this.children.splice(index, 1);
      object.dispatchEvent(_removedEvent);
      _childremovedEvent.child = object;
      this.dispatchEvent(_childremovedEvent);
      _childremovedEvent.child = null;
    }
    return this;
  }
  /**
   * Removes this 3D object from its current parent.
   *
   * @fires Object3D#removed
   * @fires Object3D#childremoved
   * @return {Object3D} A reference to this instance.
   */
  removeFromParent() {
    const parent = this.parent;
    if (parent !== null) {
      parent.remove(this);
    }
    return this;
  }
  /**
   * Removes all child objects.
   *
   * @fires Object3D#removed
   * @fires Object3D#childremoved
   * @return {Object3D} A reference to this instance.
   */
  clear() {
    return this.remove(...this.children);
  }
  /**
   * Adds the given 3D object as a child of this 3D object, while maintaining the object's world
   * transform. This method does not support scene graphs having non-uniformly-scaled nodes(s).
   *
   * @fires Object3D#added
   * @fires Object3D#childadded
   * @param {Object3D} object - The 3D object to attach.
   * @return {Object3D} A reference to this instance.
   */
  attach(object) {
    this.updateWorldMatrix(true, false);
    _m1$1.copy(this.matrixWorld).invert();
    if (object.parent !== null) {
      object.parent.updateWorldMatrix(true, false);
      _m1$1.multiply(object.parent.matrixWorld);
    }
    object.applyMatrix4(_m1$1);
    object.removeFromParent();
    object.parent = this;
    this.children.push(object);
    object.updateWorldMatrix(false, true);
    object.dispatchEvent(_addedEvent);
    _childaddedEvent.child = object;
    this.dispatchEvent(_childaddedEvent);
    _childaddedEvent.child = null;
    return this;
  }
  /**
   * Searches through the 3D object and its children, starting with the 3D object
   * itself, and returns the first with a matching ID.
   *
   * @param {number} id - The id.
   * @return {Object3D|undefined} The found 3D object. Returns `undefined` if no 3D object has been found.
   */
  getObjectById(id) {
    return this.getObjectByProperty("id", id);
  }
  /**
   * Searches through the 3D object and its children, starting with the 3D object
   * itself, and returns the first with a matching name.
   *
   * @param {string} name - The name.
   * @return {Object3D|undefined} The found 3D object. Returns `undefined` if no 3D object has been found.
   */
  getObjectByName(name) {
    return this.getObjectByProperty("name", name);
  }
  /**
   * Searches through the 3D object and its children, starting with the 3D object
   * itself, and returns the first with a matching property value.
   *
   * @param {string} name - The name of the property.
   * @param {any} value - The value.
   * @return {Object3D|undefined} The found 3D object. Returns `undefined` if no 3D object has been found.
   */
  getObjectByProperty(name, value) {
    if (this[name] === value) return this;
    for (let i = 0, l = this.children.length; i < l; i++) {
      const child = this.children[i];
      const object = child.getObjectByProperty(name, value);
      if (object !== void 0) {
        return object;
      }
    }
    return void 0;
  }
  /**
   * Searches through the 3D object and its children, starting with the 3D object
   * itself, and returns all 3D objects with a matching property value.
   *
   * @param {string} name - The name of the property.
   * @param {any} value - The value.
   * @param {Array<Object3D>} result - The method stores the result in this array.
   * @return {Array<Object3D>} The found 3D objects.
   */
  getObjectsByProperty(name, value, result = []) {
    if (this[name] === value) result.push(this);
    const children = this.children;
    for (let i = 0, l = children.length; i < l; i++) {
      children[i].getObjectsByProperty(name, value, result);
    }
    return result;
  }
  /**
   * Returns a vector representing the position of the 3D object in world space.
   *
   * @param {Vector3} target - The target vector the result is stored to.
   * @return {Vector3} The 3D object's position in world space.
   */
  getWorldPosition(target) {
    this.updateWorldMatrix(true, false);
    return target.setFromMatrixPosition(this.matrixWorld);
  }
  /**
   * Returns a Quaternion representing the position of the 3D object in world space.
   *
   * @param {Quaternion} target - The target Quaternion the result is stored to.
   * @return {Quaternion} The 3D object's rotation in world space.
   */
  getWorldQuaternion(target) {
    this.updateWorldMatrix(true, false);
    this.matrixWorld.decompose(_position$4, target, _scale$3);
    return target;
  }
  /**
   * Returns a vector representing the scale of the 3D object in world space.
   *
   * @param {Vector3} target - The target vector the result is stored to.
   * @return {Vector3} The 3D object's scale in world space.
   */
  getWorldScale(target) {
    this.updateWorldMatrix(true, false);
    this.matrixWorld.decompose(_position$4, _quaternion$3, target);
    return target;
  }
  /**
   * Returns a vector representing the ("look") direction of the 3D object in world space.
   *
   * @param {Vector3} target - The target vector the result is stored to.
   * @return {Vector3} The 3D object's direction in world space.
   */
  getWorldDirection(target) {
    this.updateWorldMatrix(true, false);
    const e = this.matrixWorld.elements;
    return target.set(e[8], e[9], e[10]).normalize();
  }
  /**
   * Abstract method to get intersections between a casted ray and this
   * 3D object. Renderable 3D objects such as {@link Mesh}, {@link Line} or {@link Points}
   * implement this method in order to use raycasting.
   *
   * @abstract
   * @param {Raycaster} raycaster - The raycaster.
   * @param {Array<Object>} intersects - An array holding the result of the method.
   */
  raycast() {
  }
  /**
   * Abstract method to test whether this 3D object intersects the given frustum.
   * Renderable 3D objects such as {@link Mesh}, {@link Line} or {@link Points}
   * implement this method in order to use frustum culling.
   *
   * @abstract
   * @param {Frustum|FrustumArray} frustum - The frustum to test.
   * @return {boolean|undefined} Whether this 3D object intersects the given frustum or not.
   */
  intersectsFrustum() {
  }
  /**
   * Executes the callback on this 3D object and all descendants.
   *
   * Note: Modifying the scene graph inside the callback is discouraged.
   *
   * @param {Function} callback - A callback function that allows to process the current 3D object.
   */
  traverse(callback) {
    callback(this);
    const children = this.children;
    for (let i = 0, l = children.length; i < l; i++) {
      children[i].traverse(callback);
    }
  }
  /**
   * Like {@link Object3D#traverse}, but the callback will only be executed for visible 3D objects.
   * Descendants of invisible 3D objects are not traversed.
   *
   * Note: Modifying the scene graph inside the callback is discouraged.
   *
   * @param {Function} callback - A callback function that allows to process the current 3D object.
   */
  traverseVisible(callback) {
    if (this.visible === false) return;
    callback(this);
    const children = this.children;
    for (let i = 0, l = children.length; i < l; i++) {
      children[i].traverseVisible(callback);
    }
  }
  /**
   * Like {@link Object3D#traverse}, but the callback will only be executed for all ancestors.
   *
   * Note: Modifying the scene graph inside the callback is discouraged.
   *
   * @param {Function} callback - A callback function that allows to process the current 3D object.
   */
  traverseAncestors(callback) {
    const parent = this.parent;
    if (parent !== null) {
      callback(parent);
      parent.traverseAncestors(callback);
    }
  }
  /**
   * Updates the transformation matrix in local space by computing it from the current
   * position, rotation and scale values.
   */
  updateMatrix() {
    this.matrix.compose(this.position, this.quaternion, this.scale);
    const pivot = this.pivot;
    if (pivot !== null) {
      const px = pivot.x, py = pivot.y, pz = pivot.z;
      const te = this.matrix.elements;
      te[12] += px - te[0] * px - te[4] * py - te[8] * pz;
      te[13] += py - te[1] * px - te[5] * py - te[9] * pz;
      te[14] += pz - te[2] * px - te[6] * py - te[10] * pz;
    }
    this.matrixWorldNeedsUpdate = true;
  }
  /**
   * Updates the transformation matrix in world space of this 3D objects and its descendants.
   *
   * To ensure correct results, this method also recomputes the 3D object's transformation matrix in
   * local space. The computation of the local and world matrix can be controlled with the
   * {@link Object3D#matrixAutoUpdate} and {@link Object3D#matrixWorldAutoUpdate} flags which are both
   * `true` by default.  Set these flags to `false` if you need more control over the update matrix process.
   *
   * @param {boolean} [force=false] - When set to `true`, a recomputation of world matrices is forced even
   * when {@link Object3D#matrixWorldNeedsUpdate} is `false`.
   */
  updateMatrixWorld(force) {
    if (this.matrixAutoUpdate) this.updateMatrix();
    if (this.matrixWorldNeedsUpdate || force) {
      if (this.matrixWorldAutoUpdate === true) {
        if (this.parent === null) {
          this.matrixWorld.copy(this.matrix);
        } else {
          this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
        }
      }
      this.matrixWorldNeedsUpdate = false;
      force = true;
    }
    const children = this.children;
    for (let i = 0, l = children.length; i < l; i++) {
      const child = children[i];
      child.updateMatrixWorld(force);
    }
  }
  /**
   * An alternative version of {@link Object3D#updateMatrixWorld} with more control over the
   * update of ancestor and descendant nodes.
   *
   * @param {boolean} [updateParents=false] Whether ancestor nodes should be updated or not.
   * @param {boolean} [updateChildren=false] Whether descendant nodes should be updated or not.
   * @param {boolean} [force=false] - When set to `true`, a recomputation of world matrices is forced even
   * when {@link Object3D#matrixWorldNeedsUpdate} is `false`.
   */
  updateWorldMatrix(updateParents, updateChildren, force = false) {
    const parent = this.parent;
    if (updateParents === true && parent !== null) {
      parent.updateWorldMatrix(true, false);
    }
    if (this.matrixAutoUpdate) this.updateMatrix();
    if (this.matrixWorldNeedsUpdate || force) {
      if (this.matrixWorldAutoUpdate === true) {
        if (this.parent === null) {
          this.matrixWorld.copy(this.matrix);
        } else {
          this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
        }
      }
      this.matrixWorldNeedsUpdate = false;
      force = true;
    }
    if (updateChildren === true) {
      const children = this.children;
      for (let i = 0, l = children.length; i < l; i++) {
        const child = children[i];
        child.updateWorldMatrix(false, true, force);
      }
    }
  }
  /**
   * Serializes the 3D object into JSON.
   *
   * @param {?(Object|string)} meta - An optional value holding meta information about the serialization.
   * @return {Object} A JSON object representing the serialized 3D object.
   * @see {@link ObjectLoader#parse}
   */
  toJSON(meta) {
    const isRootObject = meta === void 0 || typeof meta === "string";
    const output = {};
    if (isRootObject) {
      meta = {
        geometries: {},
        materials: {},
        textures: {},
        images: {},
        shapes: {},
        skeletons: {},
        animations: {},
        nodes: {}
      };
      output.metadata = {
        version: 4.7,
        type: "Object",
        generator: "Object3D.toJSON"
      };
    }
    const object = {};
    object.uuid = this.uuid;
    object.type = this.type;
    object.name = this.name;
    object.castShadow = this.castShadow;
    object.receiveShadow = this.receiveShadow;
    object.visible = this.visible;
    object.frustumCulled = this.frustumCulled;
    object.renderOrder = this.renderOrder;
    object.static = this.static;
    object.matrixAutoUpdate = this.matrixAutoUpdate;
    if (Object.keys(this.userData).length > 0) object.userData = this.userData;
    object.layers = this.layers.mask;
    object.matrix = this.matrix.toArray();
    object.up = this.up.toArray();
    if (this.pivot !== null) object.pivot = this.pivot.toArray();
    if (this.morphTargetDictionary !== void 0) object.morphTargetDictionary = Object.assign({}, this.morphTargetDictionary);
    if (this.morphTargetInfluences !== void 0) object.morphTargetInfluences = this.morphTargetInfluences.slice();
    if (this.isInstancedMesh) {
      object.type = "InstancedMesh";
      object.count = this.count;
      object.instanceMatrix = this.instanceMatrix.toJSON();
      if (this.instanceColor !== null) object.instanceColor = this.instanceColor.toJSON();
    }
    if (this.isBatchedMesh) {
      object.type = "BatchedMesh";
      object.perObjectFrustumCulled = this.perObjectFrustumCulled;
      object.sortObjects = this.sortObjects;
      object.drawRanges = this._drawRanges;
      object.reservedRanges = this._reservedRanges;
      object.geometryInfo = this._geometryInfo.map((info) => ({
        ...info,
        boundingBox: info.boundingBox ? info.boundingBox.toJSON() : void 0,
        boundingSphere: info.boundingSphere ? info.boundingSphere.toJSON() : void 0
      }));
      object.instanceInfo = this._instanceInfo.map((info) => ({ ...info }));
      object.availableInstanceIds = this._availableInstanceIds.slice();
      object.availableGeometryIds = this._availableGeometryIds.slice();
      object.nextIndexStart = this._nextIndexStart;
      object.nextVertexStart = this._nextVertexStart;
      object.geometryCount = this._geometryCount;
      object.maxInstanceCount = this._maxInstanceCount;
      object.maxVertexCount = this._maxVertexCount;
      object.maxIndexCount = this._maxIndexCount;
      object.geometryInitialized = this._geometryInitialized;
      object.matricesTexture = this._matricesTexture.toJSON(meta);
      object.indirectTexture = this._indirectTexture.toJSON(meta);
      if (this._colorsTexture !== null) {
        object.colorsTexture = this._colorsTexture.toJSON(meta);
      }
      if (this.boundingSphere !== null) {
        object.boundingSphere = this.boundingSphere.toJSON();
      }
      if (this.boundingBox !== null) {
        object.boundingBox = this.boundingBox.toJSON();
      }
    }
    function serialize(library, element) {
      if (library[element.uuid] === void 0) {
        library[element.uuid] = element.toJSON(meta);
      }
      return element.uuid;
    }
    if (this.isScene) {
      if (this.background) {
        if (this.background.isColor) {
          object.background = this.background.toJSON();
        } else if (this.background.isTexture) {
          object.background = this.background.toJSON(meta).uuid;
        }
      }
      if (this.environment && this.environment.isTexture && this.environment.isRenderTargetTexture !== true) {
        object.environment = this.environment.toJSON(meta).uuid;
      }
    } else if (this.isMesh || this.isLine || this.isPoints) {
      object.geometry = serialize(meta.geometries, this.geometry);
      const parameters = this.geometry.parameters;
      if (parameters !== void 0 && parameters.shapes !== void 0) {
        const shapes = parameters.shapes;
        if (Array.isArray(shapes)) {
          for (let i = 0, l = shapes.length; i < l; i++) {
            const shape = shapes[i];
            serialize(meta.shapes, shape);
          }
        } else {
          serialize(meta.shapes, shapes);
        }
      }
    }
    if (this.isSkinnedMesh) {
      object.bindMode = this.bindMode;
      object.bindMatrix = this.bindMatrix.toArray();
      if (this.skeleton !== void 0) {
        serialize(meta.skeletons, this.skeleton);
        object.skeleton = this.skeleton.uuid;
      }
    }
    if (this.material !== void 0) {
      if (Array.isArray(this.material)) {
        const uuids = [];
        for (let i = 0, l = this.material.length; i < l; i++) {
          uuids.push(serialize(meta.materials, this.material[i]));
        }
        object.material = uuids;
      } else {
        object.material = serialize(meta.materials, this.material);
      }
    }
    if (this.children.length > 0) {
      object.children = [];
      for (let i = 0; i < this.children.length; i++) {
        object.children.push(this.children[i].toJSON(meta).object);
      }
    }
    if (this.animations.length > 0) {
      object.animations = [];
      for (let i = 0; i < this.animations.length; i++) {
        const animation = this.animations[i];
        object.animations.push(serialize(meta.animations, animation));
      }
    }
    if (isRootObject) {
      const geometries = extractFromCache(meta.geometries);
      const materials = extractFromCache(meta.materials);
      const textures = extractFromCache(meta.textures);
      const images = extractFromCache(meta.images);
      const shapes = extractFromCache(meta.shapes);
      const skeletons = extractFromCache(meta.skeletons);
      const animations = extractFromCache(meta.animations);
      const nodes = extractFromCache(meta.nodes);
      if (geometries.length > 0) output.geometries = geometries;
      if (materials.length > 0) output.materials = materials;
      if (textures.length > 0) output.textures = textures;
      if (images.length > 0) output.images = images;
      if (shapes.length > 0) output.shapes = shapes;
      if (skeletons.length > 0) output.skeletons = skeletons;
      if (animations.length > 0) output.animations = animations;
      if (nodes.length > 0) output.nodes = nodes;
    }
    output.object = object;
    return output;
    function extractFromCache(cache) {
      const values = [];
      for (const key in cache) {
        const data = cache[key];
        delete data.metadata;
        values.push(data);
      }
      return values;
    }
  }
  /**
   * Returns a new 3D object with copied values from this instance.
   *
   * @param {boolean} [recursive=true] - When set to `true`, descendants of the 3D object are also cloned.
   * @return {Object3D} A clone of this instance.
   */
  clone(recursive) {
    return new this.constructor().copy(this, recursive);
  }
  /**
   * Copies the values of the given 3D object to this instance.
   *
   * @param {Object3D} source - The 3D object to copy.
   * @param {boolean} [recursive=true] - When set to `true`, descendants of the 3D object are cloned.
   * @return {Object3D} A reference to this instance.
   */
  copy(source, recursive = true) {
    this.name = source.name;
    this.up.copy(source.up);
    this.position.copy(source.position);
    this.rotation.order = source.rotation.order;
    this.quaternion.copy(source.quaternion);
    this.scale.copy(source.scale);
    this.pivot = source.pivot !== null ? source.pivot.clone() : null;
    this.matrix.copy(source.matrix);
    this.matrixWorld.copy(source.matrixWorld);
    this.matrixAutoUpdate = source.matrixAutoUpdate;
    this.matrixWorldAutoUpdate = source.matrixWorldAutoUpdate;
    this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;
    this.layers.mask = source.layers.mask;
    this.visible = source.visible;
    this.castShadow = source.castShadow;
    this.receiveShadow = source.receiveShadow;
    this.frustumCulled = source.frustumCulled;
    this.renderOrder = source.renderOrder;
    this.static = source.static;
    this.animations = source.animations.slice();
    this.userData = JSON.parse(JSON.stringify(source.userData));
    if (recursive === true) {
      for (let i = 0; i < source.children.length; i++) {
        const child = source.children[i];
        this.add(child.clone());
      }
    }
    return this;
  }
  /**
   * Frees the GPU-related resources allocated by this instance. Call this
   * method whenever this instance is no longer used in your app.
   *
   * Geometries, materials and textures are potentially shared with other
   * 3D objects and must be disposed of separately.
   *
   * @fires Object3D#dispose
   */
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
};
Object3D.DEFAULT_UP = /* @__PURE__ */ new Vector3(0, 1, 0);
Object3D.DEFAULT_MATRIX_AUTO_UPDATE = true;
Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = true;
var _colorKeywords = {
  "aliceblue": 15792383,
  "antiquewhite": 16444375,
  "aqua": 65535,
  "aquamarine": 8388564,
  "azure": 15794175,
  "beige": 16119260,
  "bisque": 16770244,
  "black": 0,
  "blanchedalmond": 16772045,
  "blue": 255,
  "blueviolet": 9055202,
  "brown": 10824234,
  "burlywood": 14596231,
  "cadetblue": 6266528,
  "chartreuse": 8388352,
  "chocolate": 13789470,
  "coral": 16744272,
  "cornflowerblue": 6591981,
  "cornsilk": 16775388,
  "crimson": 14423100,
  "cyan": 65535,
  "darkblue": 139,
  "darkcyan": 35723,
  "darkgoldenrod": 12092939,
  "darkgray": 11119017,
  "darkgreen": 25600,
  "darkgrey": 11119017,
  "darkkhaki": 12433259,
  "darkmagenta": 9109643,
  "darkolivegreen": 5597999,
  "darkorange": 16747520,
  "darkorchid": 10040012,
  "darkred": 9109504,
  "darksalmon": 15308410,
  "darkseagreen": 9419919,
  "darkslateblue": 4734347,
  "darkslategray": 3100495,
  "darkslategrey": 3100495,
  "darkturquoise": 52945,
  "darkviolet": 9699539,
  "deeppink": 16716947,
  "deepskyblue": 49151,
  "dimgray": 6908265,
  "dimgrey": 6908265,
  "dodgerblue": 2003199,
  "firebrick": 11674146,
  "floralwhite": 16775920,
  "forestgreen": 2263842,
  "fuchsia": 16711935,
  "gainsboro": 14474460,
  "ghostwhite": 16316671,
  "gold": 16766720,
  "goldenrod": 14329120,
  "gray": 8421504,
  "green": 32768,
  "greenyellow": 11403055,
  "grey": 8421504,
  "honeydew": 15794160,
  "hotpink": 16738740,
  "indianred": 13458524,
  "indigo": 4915330,
  "ivory": 16777200,
  "khaki": 15787660,
  "lavender": 15132410,
  "lavenderblush": 16773365,
  "lawngreen": 8190976,
  "lemonchiffon": 16775885,
  "lightblue": 11393254,
  "lightcoral": 15761536,
  "lightcyan": 14745599,
  "lightgoldenrodyellow": 16448210,
  "lightgray": 13882323,
  "lightgreen": 9498256,
  "lightgrey": 13882323,
  "lightpink": 16758465,
  "lightsalmon": 16752762,
  "lightseagreen": 2142890,
  "lightskyblue": 8900346,
  "lightslategray": 7833753,
  "lightslategrey": 7833753,
  "lightsteelblue": 11584734,
  "lightyellow": 16777184,
  "lime": 65280,
  "limegreen": 3329330,
  "linen": 16445670,
  "magenta": 16711935,
  "maroon": 8388608,
  "mediumaquamarine": 6737322,
  "mediumblue": 205,
  "mediumorchid": 12211667,
  "mediumpurple": 9662683,
  "mediumseagreen": 3978097,
  "mediumslateblue": 8087790,
  "mediumspringgreen": 64154,
  "mediumturquoise": 4772300,
  "mediumvioletred": 13047173,
  "midnightblue": 1644912,
  "mintcream": 16121850,
  "mistyrose": 16770273,
  "moccasin": 16770229,
  "navajowhite": 16768685,
  "navy": 128,
  "oldlace": 16643558,
  "olive": 8421376,
  "olivedrab": 7048739,
  "orange": 16753920,
  "orangered": 16729344,
  "orchid": 14315734,
  "palegoldenrod": 15657130,
  "palegreen": 10025880,
  "paleturquoise": 11529966,
  "palevioletred": 14381203,
  "papayawhip": 16773077,
  "peachpuff": 16767673,
  "peru": 13468991,
  "pink": 16761035,
  "plum": 14524637,
  "powderblue": 11591910,
  "purple": 8388736,
  "rebeccapurple": 6697881,
  "red": 16711680,
  "rosybrown": 12357519,
  "royalblue": 4286945,
  "saddlebrown": 9127187,
  "salmon": 16416882,
  "sandybrown": 16032864,
  "seagreen": 3050327,
  "seashell": 16774638,
  "sienna": 10506797,
  "silver": 12632256,
  "skyblue": 8900331,
  "slateblue": 6970061,
  "slategray": 7372944,
  "slategrey": 7372944,
  "snow": 16775930,
  "springgreen": 65407,
  "steelblue": 4620980,
  "tan": 13808780,
  "teal": 32896,
  "thistle": 14204888,
  "tomato": 16737095,
  "turquoise": 4251856,
  "violet": 15631086,
  "wheat": 16113331,
  "white": 16777215,
  "whitesmoke": 16119285,
  "yellow": 16776960,
  "yellowgreen": 10145074
};
var _hslA = { h: 0, s: 0, l: 0 };
var _hslB = { h: 0, s: 0, l: 0 };
function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t);
  return p;
}
var Color = class {
  /**
   * Constructs a new color.
   *
   * Note that standard method of specifying color in three.js is with a hexadecimal triplet,
   * and that method is used throughout the rest of the documentation.
   *
   * @param {(number|string|Color)} [r] - The red component of the color. If `g` and `b` are
   * not provided, it can be hexadecimal triplet, a CSS-style string or another `Color` instance.
   * @param {number} [g] - The green component.
   * @param {number} [b] - The blue component.
   */
  constructor(r, g, b) {
    this.isColor = true;
    this.r = 1;
    this.g = 1;
    this.b = 1;
    return this.set(r, g, b);
  }
  /**
   * Sets the colors's components from the given values.
   *
   * @param {(number|string|Color)} [r] - The red component of the color. If `g` and `b` are
   * not provided, it can be hexadecimal triplet, a CSS-style string or another `Color` instance.
   * @param {number} [g] - The green component.
   * @param {number} [b] - The blue component.
   * @return {Color} A reference to this color.
   */
  set(r, g, b) {
    if (g === void 0 && b === void 0) {
      const value = r;
      if (value && value.isColor) {
        this.copy(value);
      } else if (typeof value === "number") {
        this.setHex(value);
      } else if (typeof value === "string") {
        this.setStyle(value);
      }
    } else {
      this.setRGB(r, g, b);
    }
    return this;
  }
  /**
   * Sets the colors's components to the given scalar value.
   *
   * @param {number} scalar - The scalar value.
   * @return {Color} A reference to this color.
   */
  setScalar(scalar) {
    this.r = scalar;
    this.g = scalar;
    this.b = scalar;
    return this;
  }
  /**
   * Sets this color from a hexadecimal value.
   *
   * @param {number} hex - The hexadecimal value.
   * @param {string} [colorSpace=SRGBColorSpace] - The color space.
   * @return {Color} A reference to this color.
   */
  setHex(hex, colorSpace = SRGBColorSpace) {
    hex = Math.floor(hex);
    this.r = (hex >> 16 & 255) / 255;
    this.g = (hex >> 8 & 255) / 255;
    this.b = (hex & 255) / 255;
    ColorManagement.colorSpaceToWorking(this, colorSpace);
    return this;
  }
  /**
   * Sets this color from RGB values.
   *
   * @param {number} r - Red channel value between `0.0` and `1.0`.
   * @param {number} g - Green channel value between `0.0` and `1.0`.
   * @param {number} b - Blue channel value between `0.0` and `1.0`.
   * @param {string} [colorSpace=ColorManagement.workingColorSpace] - The color space.
   * @return {Color} A reference to this color.
   */
  setRGB(r, g, b, colorSpace = ColorManagement.workingColorSpace) {
    this.r = r;
    this.g = g;
    this.b = b;
    ColorManagement.colorSpaceToWorking(this, colorSpace);
    return this;
  }
  /**
   * Sets this color from RGB values.
   *
   * @param {number} h - Hue value between `0.0` and `1.0`.
   * @param {number} s - Saturation value between `0.0` and `1.0`.
   * @param {number} l - Lightness value between `0.0` and `1.0`.
   * @param {string} [colorSpace=ColorManagement.workingColorSpace] - The color space.
   * @return {Color} A reference to this color.
   */
  setHSL(h, s, l, colorSpace = ColorManagement.workingColorSpace) {
    h = euclideanModulo(h, 1);
    s = clamp2(s, 0, 1);
    l = clamp2(l, 0, 1);
    if (s === 0) {
      this.r = this.g = this.b = l;
    } else {
      const p = l <= 0.5 ? l * (1 + s) : l + s - l * s;
      const q = 2 * l - p;
      this.r = hue2rgb(q, p, h + 1 / 3);
      this.g = hue2rgb(q, p, h);
      this.b = hue2rgb(q, p, h - 1 / 3);
    }
    ColorManagement.colorSpaceToWorking(this, colorSpace);
    return this;
  }
  /**
   * Sets this color from a CSS-style string. For example, `rgb(250, 0,0)`,
   * `rgb(100%, 0%, 0%)`, `hsl(0, 100%, 50%)`, `#ff0000`, `#f00`, or `red` ( or
   * any [X11 color name](https://en.wikipedia.org/wiki/X11_color_names#Color_name_chart) -
   * all 140 color names are supported).
   *
   * @param {string} style - Color as a CSS-style string.
   * @param {string} [colorSpace=SRGBColorSpace] - The color space.
   * @return {Color} A reference to this color.
   */
  setStyle(style, colorSpace = SRGBColorSpace) {
    function handleAlpha(string) {
      if (string === void 0) return;
      if (parseFloat(string) < 1) {
        warn("Color: Alpha component of " + style + " will be ignored.");
      }
    }
    let m;
    if (m = /^(\w+)\(([^\)]*)\)/.exec(style)) {
      let color;
      const name = m[1];
      const components = m[2];
      switch (name) {
        case "rgb":
        case "rgba":
          if (color = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(components)) {
            handleAlpha(color[4]);
            return this.setRGB(
              Math.min(255, parseInt(color[1], 10)) / 255,
              Math.min(255, parseInt(color[2], 10)) / 255,
              Math.min(255, parseInt(color[3], 10)) / 255,
              colorSpace
            );
          }
          if (color = /^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(components)) {
            handleAlpha(color[4]);
            return this.setRGB(
              Math.min(100, parseInt(color[1], 10)) / 100,
              Math.min(100, parseInt(color[2], 10)) / 100,
              Math.min(100, parseInt(color[3], 10)) / 100,
              colorSpace
            );
          }
          break;
        case "hsl":
        case "hsla":
          if (color = /^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(components)) {
            handleAlpha(color[4]);
            return this.setHSL(
              parseFloat(color[1]) / 360,
              parseFloat(color[2]) / 100,
              parseFloat(color[3]) / 100,
              colorSpace
            );
          }
          break;
        default:
          warn("Color: Unknown color model " + style);
      }
    } else if (m = /^\#([A-Fa-f\d]+)$/.exec(style)) {
      const hex = m[1];
      const size = hex.length;
      if (size === 3) {
        return this.setRGB(
          parseInt(hex.charAt(0), 16) / 15,
          parseInt(hex.charAt(1), 16) / 15,
          parseInt(hex.charAt(2), 16) / 15,
          colorSpace
        );
      } else if (size === 6) {
        return this.setHex(parseInt(hex, 16), colorSpace);
      } else {
        warn("Color: Invalid hex color " + style);
      }
    } else if (style && style.length > 0) {
      return this.setColorName(style, colorSpace);
    }
    return this;
  }
  /**
   * Sets this color from a color name. Faster than {@link Color#setStyle} if
   * you don't need the other CSS-style formats.
   *
   * For convenience, the list of names is exposed in `Color.NAMES` as a hash.
   * ```js
   * Color.NAMES.aliceblue // returns 0xF0F8FF
   * ```
   *
   * @param {string} style - The color name.
   * @param {string} [colorSpace=SRGBColorSpace] - The color space.
   * @return {Color} A reference to this color.
   */
  setColorName(style, colorSpace = SRGBColorSpace) {
    const hex = _colorKeywords[style.toLowerCase()];
    if (hex !== void 0) {
      this.setHex(hex, colorSpace);
    } else {
      warn("Color: Unknown color " + style);
    }
    return this;
  }
  /**
   * Returns a new color with copied values from this instance.
   *
   * @return {Color} A clone of this instance.
   */
  clone() {
    return new this.constructor(this.r, this.g, this.b);
  }
  /**
   * Copies the values of the given color to this instance.
   *
   * @param {Color} color - The color to copy.
   * @return {Color} A reference to this color.
   */
  copy(color) {
    this.r = color.r;
    this.g = color.g;
    this.b = color.b;
    return this;
  }
  /**
   * Copies the given color into this color, and then converts this color from
   * `SRGBColorSpace` to `LinearSRGBColorSpace`.
   *
   * @param {Color} color - The color to copy/convert.
   * @return {Color} A reference to this color.
   */
  copySRGBToLinear(color) {
    this.r = SRGBToLinear(color.r);
    this.g = SRGBToLinear(color.g);
    this.b = SRGBToLinear(color.b);
    return this;
  }
  /**
   * Copies the given color into this color, and then converts this color from
   * `LinearSRGBColorSpace` to `SRGBColorSpace`.
   *
   * @param {Color} color - The color to copy/convert.
   * @return {Color} A reference to this color.
   */
  copyLinearToSRGB(color) {
    this.r = LinearToSRGB(color.r);
    this.g = LinearToSRGB(color.g);
    this.b = LinearToSRGB(color.b);
    return this;
  }
  /**
   * Converts this color from `SRGBColorSpace` to `LinearSRGBColorSpace`.
   *
   * @return {Color} A reference to this color.
   */
  convertSRGBToLinear() {
    this.copySRGBToLinear(this);
    return this;
  }
  /**
   * Converts this color from `LinearSRGBColorSpace` to `SRGBColorSpace`.
   *
   * @return {Color} A reference to this color.
   */
  convertLinearToSRGB() {
    this.copyLinearToSRGB(this);
    return this;
  }
  /**
   * Returns the hexadecimal value of this color.
   *
   * @param {string} [colorSpace=SRGBColorSpace] - The color space.
   * @return {number} The hexadecimal value.
   */
  getHex(colorSpace = SRGBColorSpace) {
    ColorManagement.workingToColorSpace(_color.copy(this), colorSpace);
    return Math.round(clamp2(_color.r * 255, 0, 255)) * 65536 + Math.round(clamp2(_color.g * 255, 0, 255)) * 256 + Math.round(clamp2(_color.b * 255, 0, 255));
  }
  /**
   * Returns the hexadecimal value of this color as a string (for example, 'FFFFFF').
   *
   * @param {string} [colorSpace=SRGBColorSpace] - The color space.
   * @return {string} The hexadecimal value as a string.
   */
  getHexString(colorSpace = SRGBColorSpace) {
    return ("000000" + this.getHex(colorSpace).toString(16)).slice(-6);
  }
  /**
   * Converts the colors RGB values into the HSL format and stores them into the
   * given target object.
   *
   * @param {{h:number,s:number,l:number}} target - The target object that is used to store the method's result.
   * @param {string} [colorSpace=ColorManagement.workingColorSpace] - The color space.
   * @return {{h:number,s:number,l:number}} The HSL representation of this color.
   */
  getHSL(target, colorSpace = ColorManagement.workingColorSpace) {
    ColorManagement.workingToColorSpace(_color.copy(this), colorSpace);
    const r = _color.r, g = _color.g, b = _color.b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue, saturation;
    const lightness = (min + max) / 2;
    if (min === max) {
      hue = 0;
      saturation = 0;
    } else {
      const delta = max - min;
      saturation = lightness <= 0.5 ? delta / (max + min) : delta / (2 - max - min);
      switch (max) {
        case r:
          hue = (g - b) / delta + (g < b ? 6 : 0);
          break;
        case g:
          hue = (b - r) / delta + 2;
          break;
        case b:
          hue = (r - g) / delta + 4;
          break;
      }
      hue /= 6;
    }
    target.h = hue;
    target.s = saturation;
    target.l = lightness;
    return target;
  }
  /**
   * Returns the RGB values of this color and stores them into the given target object.
   *
   * @param {Color} target - The target color that is used to store the method's result.
   * @param {string} [colorSpace=ColorManagement.workingColorSpace] - The color space.
   * @return {Color} The RGB representation of this color.
   */
  getRGB(target, colorSpace = ColorManagement.workingColorSpace) {
    ColorManagement.workingToColorSpace(_color.copy(this), colorSpace);
    target.r = _color.r;
    target.g = _color.g;
    target.b = _color.b;
    return target;
  }
  /**
   * Returns the value of this color as a CSS style string. Example: `rgb(255,0,0)`.
   *
   * @param {string} [colorSpace=SRGBColorSpace] - The color space.
   * @return {string} The CSS representation of this color.
   */
  getStyle(colorSpace = SRGBColorSpace) {
    ColorManagement.workingToColorSpace(_color.copy(this), colorSpace);
    const r = _color.r, g = _color.g, b = _color.b;
    if (colorSpace !== SRGBColorSpace) {
      return `color(${colorSpace} ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)})`;
    }
    return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
  }
  /**
   * Adds the given HSL values to this color's values.
   * Internally, this converts the color's RGB values to HSL, adds HSL
   * and then converts the color back to RGB.
   *
   * @param {number} h - Hue value between `0.0` and `1.0`.
   * @param {number} s - Saturation value between `0.0` and `1.0`.
   * @param {number} l - Lightness value between `0.0` and `1.0`.
   * @return {Color} A reference to this color.
   */
  offsetHSL(h, s, l) {
    this.getHSL(_hslA);
    return this.setHSL(_hslA.h + h, _hslA.s + s, _hslA.l + l);
  }
  /**
   * Adds the RGB values of the given color to the RGB values of this color.
   *
   * @param {Color} color - The color to add.
   * @return {Color} A reference to this color.
   */
  add(color) {
    this.r += color.r;
    this.g += color.g;
    this.b += color.b;
    return this;
  }
  /**
   * Adds the RGB values of the given colors and stores the result in this instance.
   *
   * @param {Color} color1 - The first color.
   * @param {Color} color2 - The second color.
   * @return {Color} A reference to this color.
   */
  addColors(color1, color2) {
    this.r = color1.r + color2.r;
    this.g = color1.g + color2.g;
    this.b = color1.b + color2.b;
    return this;
  }
  /**
   * Adds the given scalar value to the RGB values of this color.
   *
   * @param {number} s - The scalar to add.
   * @return {Color} A reference to this color.
   */
  addScalar(s) {
    this.r += s;
    this.g += s;
    this.b += s;
    return this;
  }
  /**
   * Subtracts the RGB values of the given color from the RGB values of this color.
   *
   * @param {Color} color - The color to subtract.
   * @return {Color} A reference to this color.
   */
  sub(color) {
    this.r = Math.max(0, this.r - color.r);
    this.g = Math.max(0, this.g - color.g);
    this.b = Math.max(0, this.b - color.b);
    return this;
  }
  /**
   * Multiplies the RGB values of the given color with the RGB values of this color.
   *
   * @param {Color} color - The color to multiply.
   * @return {Color} A reference to this color.
   */
  multiply(color) {
    this.r *= color.r;
    this.g *= color.g;
    this.b *= color.b;
    return this;
  }
  /**
   * Multiplies the given scalar value with the RGB values of this color.
   *
   * @param {number} s - The scalar to multiply.
   * @return {Color} A reference to this color.
   */
  multiplyScalar(s) {
    this.r *= s;
    this.g *= s;
    this.b *= s;
    return this;
  }
  /**
   * Linearly interpolates this color's RGB values toward the RGB values of the
   * given color. The alpha argument can be thought of as the ratio between
   * the two colors, where `0.0` is this color and `1.0` is the first argument.
   *
   * @param {Color} color - The color to converge on.
   * @param {number} alpha - The interpolation factor in the closed interval `[0,1]`.
   * @return {Color} A reference to this color.
   */
  lerp(color, alpha) {
    this.r += (color.r - this.r) * alpha;
    this.g += (color.g - this.g) * alpha;
    this.b += (color.b - this.b) * alpha;
    return this;
  }
  /**
   * Linearly interpolates between the given colors and stores the result in this instance.
   * The alpha argument can be thought of as the ratio between the two colors, where `0.0`
   * is the first and `1.0` is the second color.
   *
   * @param {Color} color1 - The first color.
   * @param {Color} color2 - The second color.
   * @param {number} alpha - The interpolation factor in the closed interval `[0,1]`.
   * @return {Color} A reference to this color.
   */
  lerpColors(color1, color2, alpha) {
    this.r = color1.r + (color2.r - color1.r) * alpha;
    this.g = color1.g + (color2.g - color1.g) * alpha;
    this.b = color1.b + (color2.b - color1.b) * alpha;
    return this;
  }
  /**
   * Linearly interpolates this color's HSL values toward the HSL values of the
   * given color. It differs from {@link Color#lerp} by not interpolating straight
   * from one color to the other, but instead going through all the hues in between
   * those two colors. The alpha argument can be thought of as the ratio between
   * the two colors, where 0.0 is this color and 1.0 is the first argument.
   *
   * @param {Color} color - The color to converge on.
   * @param {number} alpha - The interpolation factor in the closed interval `[0,1]`.
   * @return {Color} A reference to this color.
   */
  lerpHSL(color, alpha) {
    this.getHSL(_hslA);
    color.getHSL(_hslB);
    const h = lerp2(_hslA.h, _hslB.h, alpha);
    const s = lerp2(_hslA.s, _hslB.s, alpha);
    const l = lerp2(_hslA.l, _hslB.l, alpha);
    this.setHSL(h, s, l);
    return this;
  }
  /**
   * Sets the color's RGB components from the given 3D vector.
   *
   * @param {Vector3} v - The vector to set.
   * @return {Color} A reference to this color.
   */
  setFromVector3(v) {
    this.r = v.x;
    this.g = v.y;
    this.b = v.z;
    return this;
  }
  /**
   * Transforms this color with the given 3x3 matrix.
   *
   * @param {Matrix3} m - The matrix.
   * @return {Color} A reference to this color.
   */
  applyMatrix3(m) {
    const r = this.r, g = this.g, b = this.b;
    const e = m.elements;
    this.r = e[0] * r + e[3] * g + e[6] * b;
    this.g = e[1] * r + e[4] * g + e[7] * b;
    this.b = e[2] * r + e[5] * g + e[8] * b;
    return this;
  }
  /**
   * Returns `true` if this color is equal with the given one.
   *
   * @param {Color} c - The color to test for equality.
   * @return {boolean} Whether this bounding color is equal with the given one.
   */
  equals(c) {
    return c.r === this.r && c.g === this.g && c.b === this.b;
  }
  /**
   * Sets this color's RGB components from the given array.
   *
   * @param {Array<number>} array - An array holding the RGB values.
   * @param {number} [offset=0] - The offset into the array.
   * @return {Color} A reference to this color.
   */
  fromArray(array, offset = 0) {
    this.r = array[offset];
    this.g = array[offset + 1];
    this.b = array[offset + 2];
    return this;
  }
  /**
   * Writes the RGB components of this color to the given array. If no array is provided,
   * the method returns a new instance.
   *
   * @param {Array<number>} [array=[]] - The target array holding the color components.
   * @param {number} [offset=0] - Index of the first element in the array.
   * @return {Array<number>} The color components.
   */
  toArray(array = [], offset = 0) {
    array[offset] = this.r;
    array[offset + 1] = this.g;
    array[offset + 2] = this.b;
    return array;
  }
  /**
   * Sets the components of this color from the given buffer attribute.
   *
   * @param {BufferAttribute} attribute - The buffer attribute holding color data.
   * @param {number} index - The index into the attribute.
   * @return {Color} A reference to this color.
   */
  fromBufferAttribute(attribute, index) {
    this.r = attribute.getX(index);
    this.g = attribute.getY(index);
    this.b = attribute.getZ(index);
    return this;
  }
  /**
   * This methods defines the serialization result of this class. Returns the color
   * as a hexadecimal value.
   *
   * @return {number} The hexadecimal value.
   */
  toJSON() {
    return this.getHex();
  }
  *[Symbol.iterator]() {
    yield this.r;
    yield this.g;
    yield this.b;
  }
};
var _color = /* @__PURE__ */ new Color();
Color.NAMES = _colorKeywords;
function cloneUniforms(src) {
  const dst = {};
  for (const u in src) {
    dst[u] = {};
    for (const p in src[u]) {
      const property = src[u][p];
      if (isThreeObject(property)) {
        if (property.isRenderTargetTexture) {
          warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().");
          dst[u][p] = null;
        } else {
          dst[u][p] = property.clone();
        }
      } else if (Array.isArray(property)) {
        if (isThreeObject(property[0])) {
          const clonedProperty = [];
          for (let i = 0, l = property.length; i < l; i++) {
            clonedProperty[i] = property[i].clone();
          }
          dst[u][p] = clonedProperty;
        } else {
          dst[u][p] = property.slice();
        }
      } else {
        dst[u][p] = property;
      }
    }
  }
  return dst;
}
function mergeUniforms(uniforms) {
  const merged = {};
  for (let u = 0; u < uniforms.length; u++) {
    const tmp = cloneUniforms(uniforms[u]);
    for (const p in tmp) {
      merged[p] = tmp[p];
    }
  }
  return merged;
}
function isThreeObject(property) {
  return property && (property.isColor || property.isMatrix3 || property.isMatrix4 || property.isVector2 || property.isVector3 || property.isVector4 || property.isTexture || property.isQuaternion);
}
function convertArray(array, type) {
  if (!array || array.constructor === type) return array;
  if (typeof type.BYTES_PER_ELEMENT === "number") {
    return new type(array);
  }
  return Array.prototype.slice.call(array);
}
function hasTangents(settings) {
  return settings !== void 0 && settings.inTangents !== void 0 && settings.outTangents !== void 0;
}
var Interpolant = class {
  /**
   * Constructs a new interpolant.
   *
   * @param {TypedArray} parameterPositions - The parameter positions hold the interpolation factors.
   * @param {TypedArray} sampleValues - The sample values.
   * @param {number} sampleSize - The sample size
   * @param {TypedArray} [resultBuffer] - The result buffer.
   */
  constructor(parameterPositions, sampleValues, sampleSize, resultBuffer) {
    this.parameterPositions = parameterPositions;
    this._cachedIndex = 0;
    this.resultBuffer = resultBuffer !== void 0 ? resultBuffer : new sampleValues.constructor(sampleSize);
    this.sampleValues = sampleValues;
    this.valueSize = sampleSize;
    this.settings = null;
    this.DefaultSettings_ = {};
  }
  /**
   * Evaluate the interpolant at position `t`.
   *
   * @param {number} t - The interpolation factor.
   * @return {TypedArray} The result buffer.
   */
  evaluate(t) {
    const pp = this.parameterPositions;
    let i1 = this._cachedIndex, t1 = pp[i1], t0 = pp[i1 - 1];
    validate_interval: {
      seek: {
        let right;
        linear_scan: {
          forward_scan: if (!(t < t1)) {
            for (let giveUpAt = i1 + 2; ; ) {
              if (t1 === void 0) {
                if (t < t0) break forward_scan;
                i1 = pp.length;
                this._cachedIndex = i1;
                return this.copySampleValue_(i1 - 1);
              }
              if (i1 === giveUpAt) break;
              t0 = t1;
              t1 = pp[++i1];
              if (t < t1) {
                break seek;
              }
            }
            right = pp.length;
            break linear_scan;
          }
          if (!(t >= t0)) {
            const t1global = pp[1];
            if (t < t1global) {
              i1 = 2;
              t0 = t1global;
            }
            for (let giveUpAt = i1 - 2; ; ) {
              if (t0 === void 0) {
                this._cachedIndex = 0;
                return this.copySampleValue_(0);
              }
              if (i1 === giveUpAt) break;
              t1 = t0;
              t0 = pp[--i1 - 1];
              if (t >= t0) {
                break seek;
              }
            }
            right = i1;
            i1 = 0;
            break linear_scan;
          }
          break validate_interval;
        }
        while (i1 < right) {
          const mid = i1 + right >>> 1;
          if (t < pp[mid]) {
            right = mid;
          } else {
            i1 = mid + 1;
          }
        }
        t1 = pp[i1];
        t0 = pp[i1 - 1];
        if (t0 === void 0) {
          this._cachedIndex = 0;
          return this.copySampleValue_(0);
        }
        if (t1 === void 0) {
          i1 = pp.length;
          this._cachedIndex = i1;
          return this.copySampleValue_(i1 - 1);
        }
      }
      this._cachedIndex = i1;
      this.intervalChanged_(i1, t0, t1);
    }
    return this.interpolate_(i1, t0, t, t1);
  }
  /**
   * Returns the interpolation settings.
   *
   * @return {Object} The interpolation settings.
   */
  getSettings_() {
    return this.settings || this.DefaultSettings_;
  }
  /**
   * Copies a sample value to the result buffer.
   *
   * @param {number} index - An index into the sample value buffer.
   * @return {TypedArray} The result buffer.
   */
  copySampleValue_(index) {
    const result = this.resultBuffer, values = this.sampleValues, stride = this.valueSize, offset = index * stride;
    for (let i = 0; i !== stride; ++i) {
      result[i] = values[offset + i];
    }
    return result;
  }
  /**
   * Copies a sample value to the result buffer.
   *
   * @abstract
   * @param {number} i1 - An index into the sample value buffer.
   * @param {number} t0 - The previous interpolation factor.
   * @param {number} t - The current interpolation factor.
   * @param {number} t1 - The next interpolation factor.
   * @return {TypedArray} The result buffer.
   */
  interpolate_() {
    throw new Error("THREE.Interpolant: Call to abstract method.");
  }
  /**
   * Optional method that is executed when the interval has changed.
   *
   * @param {number} i1 - An index into the sample value buffer.
   * @param {number} t0 - The previous interpolation factor.
   * @param {number} t - The current interpolation factor.
   */
  intervalChanged_() {
  }
};
var CubicInterpolant = class extends Interpolant {
  /**
   * Constructs a new cubic interpolant.
   *
   * @param {TypedArray} parameterPositions - The parameter positions hold the interpolation factors.
   * @param {TypedArray} sampleValues - The sample values.
   * @param {number} sampleSize - The sample size
   * @param {TypedArray} [resultBuffer] - The result buffer.
   */
  constructor(parameterPositions, sampleValues, sampleSize, resultBuffer) {
    super(parameterPositions, sampleValues, sampleSize, resultBuffer);
    this._weightPrev = -0;
    this._offsetPrev = -0;
    this._weightNext = -0;
    this._offsetNext = -0;
    this.DefaultSettings_ = {
      endingStart: ZeroCurvatureEnding,
      endingEnd: ZeroCurvatureEnding
    };
  }
  intervalChanged_(i1, t0, t1) {
    const pp = this.parameterPositions;
    let iPrev = i1 - 2, iNext = i1 + 1, tPrev = pp[iPrev], tNext = pp[iNext];
    if (tPrev === void 0) {
      switch (this.getSettings_().endingStart) {
        case ZeroSlopeEnding:
          iPrev = i1;
          tPrev = 2 * t0 - t1;
          break;
        case WrapAroundEnding:
          iPrev = pp.length - 2;
          tPrev = t0 + pp[iPrev] - pp[iPrev + 1];
          break;
        default:
          iPrev = i1;
          tPrev = t1;
      }
    }
    if (tNext === void 0) {
      switch (this.getSettings_().endingEnd) {
        case ZeroSlopeEnding:
          iNext = i1;
          tNext = 2 * t1 - t0;
          break;
        case WrapAroundEnding:
          iNext = 1;
          tNext = t1 + pp[1] - pp[0];
          break;
        default:
          iNext = i1 - 1;
          tNext = t0;
      }
    }
    const halfDt = (t1 - t0) * 0.5, stride = this.valueSize;
    this._weightPrev = halfDt / (t0 - tPrev);
    this._weightNext = halfDt / (tNext - t1);
    this._offsetPrev = iPrev * stride;
    this._offsetNext = iNext * stride;
  }
  interpolate_(i1, t0, t, t1) {
    const result = this.resultBuffer, values = this.sampleValues, stride = this.valueSize, o1 = i1 * stride, o0 = o1 - stride, oP = this._offsetPrev, oN = this._offsetNext, wP = this._weightPrev, wN = this._weightNext, p = (t - t0) / (t1 - t0), pp = p * p, ppp = pp * p;
    const sP = -wP * ppp + 2 * wP * pp - wP * p;
    const s0 = (1 + wP) * ppp + (-1.5 - 2 * wP) * pp + (-0.5 + wP) * p + 1;
    const s1 = (-1 - wN) * ppp + (1.5 + wN) * pp + 0.5 * p;
    const sN = wN * ppp - wN * pp;
    for (let i = 0; i !== stride; ++i) {
      result[i] = sP * values[oP + i] + s0 * values[o0 + i] + s1 * values[o1 + i] + sN * values[oN + i];
    }
    return result;
  }
};
var LinearInterpolant = class extends Interpolant {
  /**
   * Constructs a new linear interpolant.
   *
   * @param {TypedArray} parameterPositions - The parameter positions hold the interpolation factors.
   * @param {TypedArray} sampleValues - The sample values.
   * @param {number} sampleSize - The sample size
   * @param {TypedArray} [resultBuffer] - The result buffer.
   */
  constructor(parameterPositions, sampleValues, sampleSize, resultBuffer) {
    super(parameterPositions, sampleValues, sampleSize, resultBuffer);
  }
  interpolate_(i1, t0, t, t1) {
    const result = this.resultBuffer, values = this.sampleValues, stride = this.valueSize, offset1 = i1 * stride, offset0 = offset1 - stride, weight1 = (t - t0) / (t1 - t0), weight0 = 1 - weight1;
    for (let i = 0; i !== stride; ++i) {
      result[i] = values[offset0 + i] * weight0 + values[offset1 + i] * weight1;
    }
    return result;
  }
};
var DiscreteInterpolant = class extends Interpolant {
  /**
   * Constructs a new discrete interpolant.
   *
   * @param {TypedArray} parameterPositions - The parameter positions hold the interpolation factors.
   * @param {TypedArray} sampleValues - The sample values.
   * @param {number} sampleSize - The sample size
   * @param {TypedArray} [resultBuffer] - The result buffer.
   */
  constructor(parameterPositions, sampleValues, sampleSize, resultBuffer) {
    super(parameterPositions, sampleValues, sampleSize, resultBuffer);
  }
  interpolate_(i1) {
    return this.copySampleValue_(i1 - 1);
  }
};
var BezierInterpolant = class extends Interpolant {
  interpolate_(i1, t0, t, t1) {
    const result = this.resultBuffer;
    const values = this.sampleValues;
    const stride = this.valueSize;
    const offset1 = i1 * stride;
    const offset0 = offset1 - stride;
    const inTangents = this.inTangents;
    const outTangents = this.outTangents;
    if (!inTangents || !outTangents) {
      const weight1 = (t - t0) / (t1 - t0);
      const weight0 = 1 - weight1;
      for (let i = 0; i !== stride; ++i) {
        result[i] = values[offset0 + i] * weight0 + values[offset1 + i] * weight1;
      }
      return result;
    }
    const tangentStride = stride * 2;
    const i0 = i1 - 1;
    for (let i = 0; i !== stride; ++i) {
      const v0 = values[offset0 + i];
      const v1 = values[offset1 + i];
      const outTangentOffset = i0 * tangentStride + i * 2;
      const c0x = outTangents[outTangentOffset];
      const c0y = outTangents[outTangentOffset + 1];
      const inTangentOffset = i1 * tangentStride + i * 2;
      const c1x = inTangents[inTangentOffset];
      const c1y = inTangents[inTangentOffset + 1];
      const s = solveBezierParameter(t, t0, c0x, c1x, t1);
      result[i] = cubicBezier(s, v0, c0y, c1y, v1);
    }
    return result;
  }
};
function cubicBezier(s, p0, p1, p2, p3) {
  const k = 1 - s;
  return k * k * k * p0 + 3 * k * k * s * p1 + 3 * k * s * s * p2 + s * s * s * p3;
}
function cubicBezierSlope(s, p0, p1, p2, p3) {
  const k = 1 - s;
  return 3 * k * k * (p1 - p0) + 6 * k * s * (p2 - p1) + 3 * s * s * (p3 - p2);
}
function solveBezierParameter(x, x0, x1, x2, x3) {
  let s = (x - x0) / (x3 - x0);
  for (let i = 0; i < 8; i++) {
    const error2 = cubicBezier(s, x0, x1, x2, x3) - x;
    if (Math.abs(error2) < 1e-10) break;
    const slope = cubicBezierSlope(s, x0, x1, x2, x3);
    if (Math.abs(slope) < 1e-10) break;
    s = Math.max(0, Math.min(1, s - error2 / slope));
  }
  return s;
}
var KeyframeTrack = class {
  /**
   * Constructs a new keyframe track.
   *
   * @param {string} name - The keyframe track's name.
   * @param {Array<number>} times - A list of keyframe times.
   * @param {Array<number|string|boolean>} values - A list of keyframe values.
   * @param {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth|InterpolateBezier)} [interpolation] - The interpolation type.
   */
  constructor(name, times, values, interpolation) {
    if (name === void 0) throw new Error("THREE.KeyframeTrack: track name is undefined");
    if (times === void 0 || times.length === 0) throw new Error("THREE.KeyframeTrack: no keyframes in track named " + name);
    this.name = name;
    this.times = convertArray(times, this.TimeBufferType);
    this.values = convertArray(values, this.ValueBufferType);
    this.setInterpolation(interpolation || this.DefaultInterpolation);
  }
  /**
   * Converts the keyframe track to JSON.
   *
   * @static
   * @param {KeyframeTrack} track - The keyframe track to serialize.
   * @return {Object} The serialized keyframe track as JSON.
   */
  static toJSON(track) {
    const trackType = track.constructor;
    let json;
    if (trackType.toJSON !== this.toJSON) {
      json = trackType.toJSON(track);
    } else {
      json = {
        "name": track.name,
        "times": convertArray(track.times, Array),
        "values": convertArray(track.values, Array)
      };
      const interpolation = track.getInterpolation();
      if (interpolation !== track.DefaultInterpolation) {
        json.interpolation = interpolation;
      }
      if (hasTangents(track.settings)) {
        json.settings = {
          inTangents: convertArray(track.settings.inTangents, Array),
          outTangents: convertArray(track.settings.outTangents, Array)
        };
      }
    }
    json.type = track.ValueTypeName;
    return json;
  }
  /**
   * Factory method for creating a new discrete interpolant.
   *
   * @static
   * @param {TypedArray} [result] - The result buffer.
   * @return {DiscreteInterpolant} The new interpolant.
   */
  InterpolantFactoryMethodDiscrete(result) {
    return new DiscreteInterpolant(this.times, this.values, this.getValueSize(), result);
  }
  /**
   * Factory method for creating a new linear interpolant.
   *
   * @static
   * @param {TypedArray} [result] - The result buffer.
   * @return {LinearInterpolant} The new interpolant.
   */
  InterpolantFactoryMethodLinear(result) {
    return new LinearInterpolant(this.times, this.values, this.getValueSize(), result);
  }
  /**
   * Factory method for creating a new smooth interpolant.
   *
   * @static
   * @param {TypedArray} [result] - The result buffer.
   * @return {CubicInterpolant} The new interpolant.
   */
  InterpolantFactoryMethodSmooth(result) {
    return new CubicInterpolant(this.times, this.values, this.getValueSize(), result);
  }
  /**
   * Factory method for creating a new Bezier interpolant.
   *
   * The Bezier interpolant requires tangent data to be set via the `settings` property
   * on the track before creating the interpolant. The settings should contain:
   * - `inTangents`: Float32Array with [time, value] pairs per keyframe per component
   * - `outTangents`: Float32Array with [time, value] pairs per keyframe per component
   *
   * @static
   * @param {TypedArray} [result] - The result buffer.
   * @return {BezierInterpolant} The new interpolant.
   */
  InterpolantFactoryMethodBezier(result) {
    const interpolant = new BezierInterpolant(this.times, this.values, this.getValueSize(), result);
    if (this.settings) {
      interpolant.inTangents = this.settings.inTangents;
      interpolant.outTangents = this.settings.outTangents;
    }
    return interpolant;
  }
  /**
   * Defines the interpolation factor method for this keyframe track.
   *
   * @param {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth|InterpolateBezier)} interpolation - The interpolation type.
   * @return {KeyframeTrack} A reference to this keyframe track.
   */
  setInterpolation(interpolation) {
    let factoryMethod;
    switch (interpolation) {
      case InterpolateDiscrete:
        factoryMethod = this.InterpolantFactoryMethodDiscrete;
        break;
      case InterpolateLinear:
        factoryMethod = this.InterpolantFactoryMethodLinear;
        break;
      case InterpolateSmooth:
        factoryMethod = this.InterpolantFactoryMethodSmooth;
        break;
      case InterpolateBezier:
        factoryMethod = this.InterpolantFactoryMethodBezier;
        break;
    }
    if (factoryMethod === void 0) {
      const message = "unsupported interpolation for " + this.ValueTypeName + " keyframe track named " + this.name;
      if (this.createInterpolant === void 0) {
        if (interpolation !== this.DefaultInterpolation) {
          this.setInterpolation(this.DefaultInterpolation);
        } else {
          throw new Error(message);
        }
      }
      warn("KeyframeTrack:", message);
      return this;
    }
    this.createInterpolant = factoryMethod;
    return this;
  }
  /**
   * Returns the current interpolation type.
   *
   * @return {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth|InterpolateBezier)} The interpolation type.
   */
  getInterpolation() {
    switch (this.createInterpolant) {
      case this.InterpolantFactoryMethodDiscrete:
        return InterpolateDiscrete;
      case this.InterpolantFactoryMethodLinear:
        return InterpolateLinear;
      case this.InterpolantFactoryMethodSmooth:
        return InterpolateSmooth;
      case this.InterpolantFactoryMethodBezier:
        return InterpolateBezier;
    }
  }
  /**
   * Returns the value size.
   *
   * @return {number} The value size.
   */
  getValueSize() {
    return this.values.length / this.times.length;
  }
  /**
   * Moves all keyframes either forward or backward in time.
   *
   * @param {number} timeOffset - The offset to move the time values.
   * @return {KeyframeTrack} A reference to this keyframe track.
   */
  shift(timeOffset) {
    if (timeOffset !== 0) {
      const times = this.times;
      for (let i = 0, n2 = times.length; i !== n2; ++i) {
        times[i] += timeOffset;
      }
    }
    return this;
  }
  /**
   * Scale all keyframe times by a factor (useful for frame - seconds conversions).
   *
   * @param {number} timeScale - The time scale.
   * @return {KeyframeTrack} A reference to this keyframe track.
   */
  scale(timeScale) {
    if (timeScale !== 1) {
      const times = this.times;
      for (let i = 0, n2 = times.length; i !== n2; ++i) {
        times[i] *= timeScale;
      }
      if (hasTangents(this.settings)) {
        scaleTangentTimes(this.settings.inTangents, timeScale);
        scaleTangentTimes(this.settings.outTangents, timeScale);
      }
    }
    return this;
  }
  /**
   * Removes keyframes before and after animation without changing any values within the defined time range.
   *
   * Note: The method does not shift around keys to the start of the track time, because for interpolated
   * keys this will change their values
   *
   * @param {number} startTime - The start time.
   * @param {number} endTime - The end time.
   * @return {KeyframeTrack} A reference to this keyframe track.
   */
  trim(startTime, endTime) {
    const times = this.times, nKeys = times.length;
    let from = 0, to = nKeys - 1;
    while (from !== nKeys && times[from] < startTime) {
      ++from;
    }
    while (to !== -1 && times[to] > endTime) {
      --to;
    }
    ++to;
    if (from !== 0 || to !== nKeys) {
      if (from >= to) {
        to = Math.max(to, 1);
        from = to - 1;
      }
      const stride = this.getValueSize();
      this.times = times.slice(from, to);
      this.values = this.values.slice(from * stride, to * stride);
    }
    return this;
  }
  /**
   * Performs minimal validation on the keyframe track. Returns `true` if the values
   * are valid.
   *
   * @return {boolean} Whether the keyframes are valid or not.
   */
  validate() {
    let valid = true;
    const valueSize = this.getValueSize();
    if (valueSize - Math.floor(valueSize) !== 0) {
      error("KeyframeTrack: Invalid value size in track.", this);
      valid = false;
    }
    const times = this.times, values = this.values, nKeys = times.length;
    if (nKeys === 0) {
      error("KeyframeTrack: Track is empty.", this);
      valid = false;
    }
    let prevTime = null;
    for (let i = 0; i !== nKeys; i++) {
      const currTime = times[i];
      if (typeof currTime === "number" && isNaN(currTime)) {
        error("KeyframeTrack: Time is not a valid number.", this, i, currTime);
        valid = false;
        break;
      }
      if (prevTime !== null && prevTime > currTime) {
        error("KeyframeTrack: Out of order keys.", this, i, currTime, prevTime);
        valid = false;
        break;
      }
      prevTime = currTime;
    }
    if (values !== void 0) {
      if (isTypedArray(values)) {
        for (let i = 0, n2 = values.length; i !== n2; ++i) {
          const value = values[i];
          if (isNaN(value)) {
            error("KeyframeTrack: Value is not a valid number.", this, i, value);
            valid = false;
            break;
          }
        }
      }
    }
    return valid;
  }
  /**
   * Optimizes this keyframe track by removing equivalent sequential keys (which are
   * common in morph target sequences).
   *
   * @return {KeyframeTrack} A reference to this keyframe track.
   */
  optimize() {
    const times = this.times.slice(), values = this.values.slice(), stride = this.getValueSize(), smoothInterpolation = this.getInterpolation() === InterpolateSmooth, lastIndex = times.length - 1;
    let writeIndex = 1;
    for (let i = 1; i < lastIndex; ++i) {
      let keep = false;
      const time = times[i];
      const timeNext = times[i + 1];
      if (time !== timeNext && (i !== 1 || time !== times[0])) {
        if (!smoothInterpolation) {
          const offset = i * stride, offsetP = offset - stride, offsetN = offset + stride;
          for (let j = 0; j !== stride; ++j) {
            const value = values[offset + j];
            if (value !== values[offsetP + j] || value !== values[offsetN + j]) {
              keep = true;
              break;
            }
          }
        } else {
          keep = true;
        }
      }
      if (keep) {
        if (i !== writeIndex) {
          times[writeIndex] = times[i];
          const readOffset = i * stride, writeOffset = writeIndex * stride;
          for (let j = 0; j !== stride; ++j) {
            values[writeOffset + j] = values[readOffset + j];
          }
        }
        ++writeIndex;
      }
    }
    if (lastIndex > 0) {
      times[writeIndex] = times[lastIndex];
      for (let readOffset = lastIndex * stride, writeOffset = writeIndex * stride, j = 0; j !== stride; ++j) {
        values[writeOffset + j] = values[readOffset + j];
      }
      ++writeIndex;
    }
    if (writeIndex !== times.length) {
      this.times = times.slice(0, writeIndex);
      this.values = values.slice(0, writeIndex * stride);
    } else {
      this.times = times;
      this.values = values;
    }
    return this;
  }
  /**
   * Returns a new keyframe track with copied values from this instance.
   *
   * @return {KeyframeTrack} A clone of this instance.
   */
  clone() {
    const times = this.times.slice();
    const values = this.values.slice();
    const TypedKeyframeTrack = this.constructor;
    const track = new TypedKeyframeTrack(this.name, times, values);
    track.createInterpolant = this.createInterpolant;
    if (hasTangents(this.settings)) {
      track.settings = {
        inTangents: this.settings.inTangents.slice(),
        outTangents: this.settings.outTangents.slice()
      };
    }
    return track;
  }
};
function scaleTangentTimes(tangents, timeScale) {
  for (let i = 0, n2 = tangents.length; i !== n2; i += 2) {
    tangents[i] *= timeScale;
  }
}
KeyframeTrack.prototype.ValueTypeName = "";
KeyframeTrack.prototype.TimeBufferType = Float32Array;
KeyframeTrack.prototype.ValueBufferType = Float32Array;
KeyframeTrack.prototype.DefaultInterpolation = InterpolateLinear;
var BooleanKeyframeTrack = class extends KeyframeTrack {
  /**
   * Constructs a new boolean keyframe track.
   *
   * This keyframe track type has no `interpolation` parameter because the
   * interpolation is always discrete.
   *
   * @param {string} name - The keyframe track's name.
   * @param {Array<number>} times - A list of keyframe times.
   * @param {Array<boolean>} values - A list of keyframe values.
   */
  constructor(name, times, values) {
    super(name, times, values);
  }
};
BooleanKeyframeTrack.prototype.ValueTypeName = "bool";
BooleanKeyframeTrack.prototype.ValueBufferType = Array;
BooleanKeyframeTrack.prototype.DefaultInterpolation = InterpolateDiscrete;
BooleanKeyframeTrack.prototype.InterpolantFactoryMethodLinear = void 0;
BooleanKeyframeTrack.prototype.InterpolantFactoryMethodSmooth = void 0;
var ColorKeyframeTrack = class extends KeyframeTrack {
  /**
   * Constructs a new color keyframe track.
   *
   * @param {string} name - The keyframe track's name.
   * @param {Array<number>} times - A list of keyframe times.
   * @param {Array<number>} values - A list of keyframe values.
   * @param {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth)} [interpolation] - The interpolation type.
   */
  constructor(name, times, values, interpolation) {
    super(name, times, values, interpolation);
  }
};
ColorKeyframeTrack.prototype.ValueTypeName = "color";
var NumberKeyframeTrack = class extends KeyframeTrack {
  /**
   * Constructs a new number keyframe track.
   *
   * @param {string} name - The keyframe track's name.
   * @param {Array<number>} times - A list of keyframe times.
   * @param {Array<number>} values - A list of keyframe values.
   * @param {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth)} [interpolation] - The interpolation type.
   */
  constructor(name, times, values, interpolation) {
    super(name, times, values, interpolation);
  }
};
NumberKeyframeTrack.prototype.ValueTypeName = "number";
var QuaternionLinearInterpolant = class extends Interpolant {
  /**
   * Constructs a new SLERP interpolant.
   *
   * @param {TypedArray} parameterPositions - The parameter positions hold the interpolation factors.
   * @param {TypedArray} sampleValues - The sample values.
   * @param {number} sampleSize - The sample size
   * @param {TypedArray} [resultBuffer] - The result buffer.
   */
  constructor(parameterPositions, sampleValues, sampleSize, resultBuffer) {
    super(parameterPositions, sampleValues, sampleSize, resultBuffer);
  }
  interpolate_(i1, t0, t, t1) {
    const result = this.resultBuffer, values = this.sampleValues, stride = this.valueSize, alpha = (t - t0) / (t1 - t0);
    let offset = i1 * stride;
    for (let end = offset + stride; offset !== end; offset += 4) {
      Quaternion.slerpFlat(result, 0, values, offset - stride, values, offset, alpha);
    }
    return result;
  }
};
var QuaternionKeyframeTrack = class extends KeyframeTrack {
  /**
   * Constructs a new Quaternion keyframe track.
   *
   * @param {string} name - The keyframe track's name.
   * @param {Array<number>} times - A list of keyframe times.
   * @param {Array<number>} values - A list of keyframe values.
   * @param {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth)} [interpolation] - The interpolation type.
   */
  constructor(name, times, values, interpolation) {
    super(name, times, values, interpolation);
  }
  /**
   * Overwritten so the method returns Quaternion based interpolant.
   *
   * @static
   * @param {TypedArray} [result] - The result buffer.
   * @return {QuaternionLinearInterpolant} The new interpolant.
   */
  InterpolantFactoryMethodLinear(result) {
    return new QuaternionLinearInterpolant(this.times, this.values, this.getValueSize(), result);
  }
};
QuaternionKeyframeTrack.prototype.ValueTypeName = "quaternion";
QuaternionKeyframeTrack.prototype.InterpolantFactoryMethodSmooth = void 0;
var StringKeyframeTrack = class extends KeyframeTrack {
  /**
   * Constructs a new string keyframe track.
   *
   * This keyframe track type has no `interpolation` parameter because the
   * interpolation is always discrete.
   *
   * @param {string} name - The keyframe track's name.
   * @param {Array<number>} times - A list of keyframe times.
   * @param {Array<string>} values - A list of keyframe values.
   */
  constructor(name, times, values) {
    super(name, times, values);
  }
};
StringKeyframeTrack.prototype.ValueTypeName = "string";
StringKeyframeTrack.prototype.ValueBufferType = Array;
StringKeyframeTrack.prototype.DefaultInterpolation = InterpolateDiscrete;
StringKeyframeTrack.prototype.InterpolantFactoryMethodLinear = void 0;
StringKeyframeTrack.prototype.InterpolantFactoryMethodSmooth = void 0;
var VectorKeyframeTrack = class extends KeyframeTrack {
  /**
   * Constructs a new vector keyframe track.
   *
   * @param {string} name - The keyframe track's name.
   * @param {Array<number>} times - A list of keyframe times.
   * @param {Array<number>} values - A list of keyframe values.
   * @param {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth)} [interpolation] - The interpolation type.
   */
  constructor(name, times, values, interpolation) {
    super(name, times, values, interpolation);
  }
};
VectorKeyframeTrack.prototype.ValueTypeName = "vector";
var LoadingManager = class {
  /**
   * Constructs a new loading manager.
   *
   * @param {Function} [onLoad] - Executes when all items have been loaded.
   * @param {Function} [onProgress] - Executes when single items have been loaded.
   * @param {Function} [onError] - Executes when an error occurs.
   */
  constructor(onLoad, onProgress, onError) {
    const scope = this;
    let isLoading = false;
    let itemsLoaded = 0;
    let itemsTotal = 0;
    let urlModifier = void 0;
    const handlers = [];
    this.onStart = void 0;
    this.onLoad = onLoad;
    this.onProgress = onProgress;
    this.onError = onError;
    this._abortController = null;
    this.itemStart = function(url) {
      itemsTotal++;
      if (isLoading === false) {
        if (scope.onStart !== void 0) {
          scope.onStart(url, itemsLoaded, itemsTotal);
        }
      }
      isLoading = true;
    };
    this.itemEnd = function(url) {
      itemsLoaded++;
      if (scope.onProgress !== void 0) {
        scope.onProgress(url, itemsLoaded, itemsTotal);
      }
      if (itemsLoaded === itemsTotal) {
        isLoading = false;
        if (scope.onLoad !== void 0) {
          scope.onLoad();
        }
      }
    };
    this.itemError = function(url) {
      if (scope.onError !== void 0) {
        scope.onError(url);
      }
    };
    this.resolveURL = function(url) {
      url = url.normalize("NFC");
      if (urlModifier) {
        return urlModifier(url);
      }
      return url;
    };
    this.setURLModifier = function(transform) {
      urlModifier = transform;
      return this;
    };
    this.addHandler = function(regex, loader) {
      handlers.push(regex, loader);
      return this;
    };
    this.removeHandler = function(regex) {
      const index = handlers.indexOf(regex);
      if (index !== -1) {
        handlers.splice(index, 2);
      }
      return this;
    };
    this.getHandler = function(file) {
      for (let i = 0, l = handlers.length; i < l; i += 2) {
        const regex = handlers[i];
        const loader = handlers[i + 1];
        if (regex.global) regex.lastIndex = 0;
        if (regex.test(file)) {
          return loader;
        }
      }
      return null;
    };
    this.abort = function() {
      this.abortController.abort();
      this._abortController = null;
      return this;
    };
  }
  // TODO: Revert this back to a single member variable once this issue has been fixed
  // https://github.com/cloudflare/workerd/issues/3657
  /**
   * Used for aborting ongoing requests in loaders using this manager.
   *
   * @type {AbortController}
   */
  get abortController() {
    if (!this._abortController) {
      this._abortController = new AbortController();
    }
    return this._abortController;
  }
};
var DefaultLoadingManager = /* @__PURE__ */ new LoadingManager();
var Loader = class {
  /**
   * Constructs a new loader.
   *
   * @param {LoadingManager} [manager] - The loading manager.
   */
  constructor(manager) {
    this.manager = manager !== void 0 ? manager : DefaultLoadingManager;
    this.crossOrigin = "anonymous";
    this.withCredentials = false;
    this.path = "";
    this.resourcePath = "";
    this.requestHeader = {};
    if (typeof __THREE_DEVTOOLS__ !== "undefined") {
      __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe", { detail: this }));
    }
  }
  /**
   * This method needs to be implemented by all concrete loaders. It holds the
   * logic for loading assets from the backend.
   *
   * @abstract
   * @param {string} url - The path/URL of the file to be loaded.
   * @param {Function} onLoad - Executed when the loading process has been finished.
   * @param {onProgressCallback} [onProgress] - Executed while the loading is in progress.
   * @param {onErrorCallback} [onError] - Executed when errors occur.
   */
  load() {
  }
  /**
   * A async version of {@link Loader#load}.
   *
   * @param {string} url - The path/URL of the file to be loaded.
   * @param {onProgressCallback} [onProgress] - Executed while the loading is in progress.
   * @return {Promise} A Promise that resolves when the asset has been loaded.
   */
  loadAsync(url, onProgress) {
    const scope = this;
    return new Promise(function(resolve, reject) {
      scope.load(url, resolve, onProgress, reject);
    });
  }
  /**
   * This method needs to be implemented by all concrete loaders. It holds the
   * logic for parsing the asset into three.js entities.
   *
   * @abstract
   * @param {any} data - The data to parse.
   */
  parse() {
  }
  /**
   * Sets the `crossOrigin` String to implement CORS for loading the URL
   * from a different domain that allows CORS.
   *
   * @param {string} crossOrigin - The `crossOrigin` value.
   * @return {Loader} A reference to this instance.
   */
  setCrossOrigin(crossOrigin) {
    this.crossOrigin = crossOrigin;
    return this;
  }
  /**
   * Whether the XMLHttpRequest uses credentials such as cookies, authorization
   * headers or TLS client certificates, see [XMLHttpRequest.withCredentials](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials).
   *
   * Note: This setting has no effect if you are loading files locally or from the same domain.
   *
   * @param {boolean} value - The `withCredentials` value.
   * @return {Loader} A reference to this instance.
   */
  setWithCredentials(value) {
    this.withCredentials = value;
    return this;
  }
  /**
   * Sets the base path for the asset.
   *
   * @param {string} path - The base path.
   * @return {Loader} A reference to this instance.
   */
  setPath(path) {
    this.path = path;
    return this;
  }
  /**
   * Sets the base path for dependent resources like textures.
   *
   * @param {string} resourcePath - The resource path.
   * @return {Loader} A reference to this instance.
   */
  setResourcePath(resourcePath) {
    this.resourcePath = resourcePath;
    return this;
  }
  /**
   * Sets the given request header.
   *
   * @param {Object} requestHeader - A [request header](https://developer.mozilla.org/en-US/docs/Glossary/Request_header)
   * for configuring the HTTP request.
   * @return {Loader} A reference to this instance.
   */
  setRequestHeader(requestHeader) {
    this.requestHeader = requestHeader;
    return this;
  }
  /**
   * This method can be implemented in loaders for aborting ongoing requests.
   *
   * @abstract
   * @return {Loader} A reference to this instance.
   */
  abort() {
    return this;
  }
};
Loader.DEFAULT_MATERIAL_NAME = "__DEFAULT";
var _RESERVED_CHARS_RE = "\\[\\]\\.:\\/";
var _reservedRe = new RegExp("[" + _RESERVED_CHARS_RE + "]", "g");
var _wordChar = "[^" + _RESERVED_CHARS_RE + "]";
var _wordCharOrDot = "[^" + _RESERVED_CHARS_RE.replace("\\.", "") + "]";
var _directoryRe = /* @__PURE__ */ /((?:WC+[\/:])*)/.source.replace("WC", _wordChar);
var _nodeRe = /* @__PURE__ */ /(WCOD+)?/.source.replace("WCOD", _wordCharOrDot);
var _objectRe = /* @__PURE__ */ /(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC", _wordChar);
var _propertyRe = /* @__PURE__ */ /\.(WC+)(?:\[(.+)\])?/.source.replace("WC", _wordChar);
var _trackRe = new RegExp(
  "^" + _directoryRe + _nodeRe + _objectRe + _propertyRe + "$"
);
var _supportedObjectNames = ["material", "materials", "bones", "map"];
var Composite = class {
  constructor(targetGroup, path, optionalParsedPath) {
    const parsedPath = optionalParsedPath || PropertyBinding.parseTrackName(path);
    this._targetGroup = targetGroup;
    this._bindings = targetGroup.subscribe_(path, parsedPath);
  }
  getValue(array, offset) {
    this.bind();
    const firstValidIndex = this._targetGroup.nCachedObjects_, binding = this._bindings[firstValidIndex];
    if (binding !== void 0) binding.getValue(array, offset);
  }
  setValue(array, offset) {
    const bindings = this._bindings;
    for (let i = this._targetGroup.nCachedObjects_, n2 = bindings.length; i !== n2; ++i) {
      bindings[i].setValue(array, offset);
    }
  }
  bind() {
    const bindings = this._bindings;
    for (let i = this._targetGroup.nCachedObjects_, n2 = bindings.length; i !== n2; ++i) {
      bindings[i].bind();
    }
  }
  unbind() {
    const bindings = this._bindings;
    for (let i = this._targetGroup.nCachedObjects_, n2 = bindings.length; i !== n2; ++i) {
      bindings[i].unbind();
    }
  }
};
var PropertyBinding = class _PropertyBinding {
  /**
   * Constructs a new property binding.
   *
   * @param {Object} rootNode - The root node.
   * @param {string} path - The path.
   * @param {?Object} [parsedPath] - The parsed path.
   */
  constructor(rootNode, path, parsedPath) {
    this.path = path;
    this.parsedPath = parsedPath || _PropertyBinding.parseTrackName(path);
    this.node = _PropertyBinding.findNode(rootNode, this.parsedPath.nodeName);
    this.rootNode = rootNode;
    this.getValue = this._getValue_unbound;
    this.setValue = this._setValue_unbound;
  }
  /**
   * Factory method for creating a property binding from the given parameters.
   *
   * @static
   * @param {Object} root - The root node.
   * @param {string} path - The path.
   * @param {?Object} [parsedPath] - The parsed path.
   * @return {PropertyBinding|Composite} The created property binding or composite.
   */
  static create(root, path, parsedPath) {
    if (!(root && root.isAnimationObjectGroup)) {
      return new _PropertyBinding(root, path, parsedPath);
    } else {
      return new _PropertyBinding.Composite(root, path, parsedPath);
    }
  }
  /**
   * Replaces spaces with underscores and removes unsupported characters from
   * node names, to ensure compatibility with parseTrackName().
   *
   * @param {string} name - Node name to be sanitized.
   * @return {string} The sanitized node name.
   */
  static sanitizeNodeName(name) {
    return name.replace(/\s/g, "_").replace(_reservedRe, "");
  }
  /**
   * Parses the given track name (an object path to an animated property) and
   * returns an object with information about the path. Matches strings in the following forms:
   *
   * - nodeName.property
   * - nodeName.property[accessor]
   * - nodeName.material.property[accessor]
   * - uuid.property[accessor]
   * - uuid.objectName[objectIndex].propertyName[propertyIndex]
   * - parentName/nodeName.property
   * - parentName/parentName/nodeName.property[index]
   * - .bone[Armature.DEF_cog].position
   * - scene:helium_balloon_model:helium_balloon_model.position
   *
   * @static
   * @param {string} trackName - The track name to parse.
   * @return {Object} The parsed track name as an object.
   */
  static parseTrackName(trackName) {
    const matches = _trackRe.exec(trackName);
    if (matches === null) {
      throw new Error("THREE.PropertyBinding: Cannot parse trackName: " + trackName);
    }
    const results = {
      // directoryName: matches[ 1 ], // (tschw) currently unused
      nodeName: matches[2],
      objectName: matches[3],
      objectIndex: matches[4],
      propertyName: matches[5],
      // required
      propertyIndex: matches[6]
    };
    const lastDot = results.nodeName && results.nodeName.lastIndexOf(".");
    if (lastDot !== void 0 && lastDot !== -1) {
      const objectName = results.nodeName.substring(lastDot + 1);
      if (_supportedObjectNames.indexOf(objectName) !== -1) {
        results.nodeName = results.nodeName.substring(0, lastDot);
        results.objectName = objectName;
      }
    }
    if (results.propertyName === null || results.propertyName.length === 0) {
      throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: " + trackName);
    }
    return results;
  }
  /**
   * Searches for a node in the hierarchy of the given root object by the given
   * node name.
   *
   * @static
   * @param {Object} root - The root object.
   * @param {string|number} nodeName - The name of the node.
   * @return {?Object} The found node. Returns `null` if no object was found.
   */
  static findNode(root, nodeName) {
    if (nodeName === void 0 || nodeName === "" || nodeName === "." || nodeName === -1 || nodeName === root.name || nodeName === root.uuid) {
      return root;
    }
    if (root.skeleton) {
      const bone = root.skeleton.getBoneByName(nodeName);
      if (bone !== void 0) {
        return bone;
      }
    }
    if (root.children) {
      const searchNodeSubtree = function(children) {
        for (let i = 0; i < children.length; i++) {
          const childNode = children[i];
          if (childNode.name === nodeName || childNode.uuid === nodeName) {
            return childNode;
          }
          const result = searchNodeSubtree(childNode.children);
          if (result) return result;
        }
        return null;
      };
      const subTreeNode = searchNodeSubtree(root.children);
      if (subTreeNode) {
        return subTreeNode;
      }
    }
    return null;
  }
  // these are used to "bind" a nonexistent property
  _getValue_unavailable() {
  }
  _setValue_unavailable() {
  }
  // Getters
  _getValue_direct(buffer, offset) {
    buffer[offset] = this.targetObject[this.propertyName];
  }
  _getValue_array(buffer, offset) {
    const source = this.resolvedProperty;
    for (let i = 0, n2 = source.length; i !== n2; ++i) {
      buffer[offset++] = source[i];
    }
  }
  _getValue_arrayElement(buffer, offset) {
    buffer[offset] = this.resolvedProperty[this.propertyIndex];
  }
  _getValue_toArray(buffer, offset) {
    this.resolvedProperty.toArray(buffer, offset);
  }
  // Direct
  _setValue_direct(buffer, offset) {
    this.targetObject[this.propertyName] = buffer[offset];
  }
  _setValue_direct_setNeedsUpdate(buffer, offset) {
    this.targetObject[this.propertyName] = buffer[offset];
    this.targetObject.needsUpdate = true;
  }
  _setValue_direct_setMatrixWorldNeedsUpdate(buffer, offset) {
    this.targetObject[this.propertyName] = buffer[offset];
    this.targetObject.matrixWorldNeedsUpdate = true;
  }
  // EntireArray
  _setValue_array(buffer, offset) {
    const dest = this.resolvedProperty;
    for (let i = 0, n2 = dest.length; i !== n2; ++i) {
      dest[i] = buffer[offset++];
    }
  }
  _setValue_array_setNeedsUpdate(buffer, offset) {
    const dest = this.resolvedProperty;
    for (let i = 0, n2 = dest.length; i !== n2; ++i) {
      dest[i] = buffer[offset++];
    }
    this.targetObject.needsUpdate = true;
  }
  _setValue_array_setMatrixWorldNeedsUpdate(buffer, offset) {
    const dest = this.resolvedProperty;
    for (let i = 0, n2 = dest.length; i !== n2; ++i) {
      dest[i] = buffer[offset++];
    }
    this.targetObject.matrixWorldNeedsUpdate = true;
  }
  // ArrayElement
  _setValue_arrayElement(buffer, offset) {
    this.resolvedProperty[this.propertyIndex] = buffer[offset];
  }
  _setValue_arrayElement_setNeedsUpdate(buffer, offset) {
    this.resolvedProperty[this.propertyIndex] = buffer[offset];
    this.targetObject.needsUpdate = true;
  }
  _setValue_arrayElement_setMatrixWorldNeedsUpdate(buffer, offset) {
    this.resolvedProperty[this.propertyIndex] = buffer[offset];
    this.targetObject.matrixWorldNeedsUpdate = true;
  }
  // HasToFromArray
  _setValue_fromArray(buffer, offset) {
    this.resolvedProperty.fromArray(buffer, offset);
  }
  _setValue_fromArray_setNeedsUpdate(buffer, offset) {
    this.resolvedProperty.fromArray(buffer, offset);
    this.targetObject.needsUpdate = true;
  }
  _setValue_fromArray_setMatrixWorldNeedsUpdate(buffer, offset) {
    this.resolvedProperty.fromArray(buffer, offset);
    this.targetObject.matrixWorldNeedsUpdate = true;
  }
  _getValue_unbound(targetArray, offset) {
    this.bind();
    this.getValue(targetArray, offset);
  }
  _setValue_unbound(sourceArray, offset) {
    this.bind();
    this.setValue(sourceArray, offset);
  }
  /**
   * Creates a getter / setter pair for the property tracked by this binding.
   */
  bind() {
    let targetObject = this.node;
    const parsedPath = this.parsedPath;
    const objectName = parsedPath.objectName;
    const propertyName = parsedPath.propertyName;
    let propertyIndex = parsedPath.propertyIndex;
    if (!targetObject) {
      targetObject = _PropertyBinding.findNode(this.rootNode, parsedPath.nodeName);
      this.node = targetObject;
    }
    this.getValue = this._getValue_unavailable;
    this.setValue = this._setValue_unavailable;
    if (!targetObject) {
      warn("PropertyBinding: No target node found for track: " + this.path + ".");
      return;
    }
    if (objectName) {
      let objectIndex = parsedPath.objectIndex;
      switch (objectName) {
        case "materials":
          if (!targetObject.material) {
            error("PropertyBinding: Can not bind to material as node does not have a material.", this);
            return;
          }
          if (!targetObject.material.materials) {
            error("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.", this);
            return;
          }
          targetObject = targetObject.material.materials;
          break;
        case "bones":
          if (!targetObject.skeleton) {
            error("PropertyBinding: Can not bind to bones as node does not have a skeleton.", this);
            return;
          }
          targetObject = targetObject.skeleton.bones;
          for (let i = 0; i < targetObject.length; i++) {
            if (targetObject[i].name === objectIndex) {
              objectIndex = i;
              break;
            }
          }
          break;
        case "map":
          if ("map" in targetObject) {
            targetObject = targetObject.map;
            break;
          }
          if (!targetObject.material) {
            error("PropertyBinding: Can not bind to material as node does not have a material.", this);
            return;
          }
          if (!targetObject.material.map) {
            error("PropertyBinding: Can not bind to material.map as node.material does not have a map.", this);
            return;
          }
          targetObject = targetObject.material.map;
          break;
        default:
          if (targetObject[objectName] === void 0) {
            error("PropertyBinding: Can not bind to objectName of node undefined.", this);
            return;
          }
          targetObject = targetObject[objectName];
      }
      if (objectIndex !== void 0) {
        if (targetObject[objectIndex] === void 0) {
          error("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.", this, targetObject);
          return;
        }
        targetObject = targetObject[objectIndex];
      }
    }
    const nodeProperty = targetObject[propertyName];
    if (nodeProperty === void 0) {
      const nodeName = parsedPath.nodeName;
      error("PropertyBinding: Trying to update property for track: " + nodeName + "." + propertyName + " but it wasn't found.", targetObject);
      return;
    }
    let versioning = this.Versioning.None;
    this.targetObject = targetObject;
    if (targetObject.isMaterial === true) {
      versioning = this.Versioning.NeedsUpdate;
    } else if (targetObject.isObject3D === true) {
      versioning = this.Versioning.MatrixWorldNeedsUpdate;
    }
    let bindingType = this.BindingType.Direct;
    if (propertyIndex !== void 0) {
      if (propertyName === "morphTargetInfluences") {
        if (!targetObject.geometry) {
          error("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.", this);
          return;
        }
        if (!targetObject.geometry.morphAttributes) {
          error("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.", this);
          return;
        }
        if (targetObject.morphTargetDictionary[propertyIndex] !== void 0) {
          propertyIndex = targetObject.morphTargetDictionary[propertyIndex];
        }
      }
      bindingType = this.BindingType.ArrayElement;
      this.resolvedProperty = nodeProperty;
      this.propertyIndex = propertyIndex;
    } else if (nodeProperty.fromArray !== void 0 && nodeProperty.toArray !== void 0) {
      bindingType = this.BindingType.HasFromToArray;
      this.resolvedProperty = nodeProperty;
    } else if (Array.isArray(nodeProperty)) {
      bindingType = this.BindingType.EntireArray;
      this.resolvedProperty = nodeProperty;
    } else {
      this.propertyName = propertyName;
    }
    this.getValue = this.GetterByBindingType[bindingType];
    this.setValue = this.SetterByBindingTypeAndVersioning[bindingType][versioning];
  }
  /**
   * Unbinds the property.
   */
  unbind() {
    this.node = null;
    this.getValue = this._getValue_unbound;
    this.setValue = this._setValue_unbound;
  }
};
PropertyBinding.Composite = Composite;
PropertyBinding.prototype.BindingType = {
  Direct: 0,
  EntireArray: 1,
  ArrayElement: 2,
  HasFromToArray: 3
};
PropertyBinding.prototype.Versioning = {
  None: 0,
  NeedsUpdate: 1,
  MatrixWorldNeedsUpdate: 2
};
PropertyBinding.prototype.GetterByBindingType = [
  PropertyBinding.prototype._getValue_direct,
  PropertyBinding.prototype._getValue_array,
  PropertyBinding.prototype._getValue_arrayElement,
  PropertyBinding.prototype._getValue_toArray
];
PropertyBinding.prototype.SetterByBindingTypeAndVersioning = [
  [
    // Direct
    PropertyBinding.prototype._setValue_direct,
    PropertyBinding.prototype._setValue_direct_setNeedsUpdate,
    PropertyBinding.prototype._setValue_direct_setMatrixWorldNeedsUpdate
  ],
  [
    // EntireArray
    PropertyBinding.prototype._setValue_array,
    PropertyBinding.prototype._setValue_array_setNeedsUpdate,
    PropertyBinding.prototype._setValue_array_setMatrixWorldNeedsUpdate
  ],
  [
    // ArrayElement
    PropertyBinding.prototype._setValue_arrayElement,
    PropertyBinding.prototype._setValue_arrayElement_setNeedsUpdate,
    PropertyBinding.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate
  ],
  [
    // HasToFromArray
    PropertyBinding.prototype._setValue_fromArray,
    PropertyBinding.prototype._setValue_fromArray_setNeedsUpdate,
    PropertyBinding.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate
  ]
];
var _controlInterpolantsResultBuffer = new Float32Array(1);
var Matrix2 = class _Matrix2 {
  static {
    _Matrix2.prototype.isMatrix2 = true;
  }
  /**
   * Constructs a new 2x2 matrix. The arguments are supposed to be
   * in row-major order. If no arguments are provided, the constructor
   * initializes the matrix as an identity matrix.
   *
   * @param {number} [n11] - 1-1 matrix element.
   * @param {number} [n12] - 1-2 matrix element.
   * @param {number} [n21] - 2-1 matrix element.
   * @param {number} [n22] - 2-2 matrix element.
   */
  constructor(n11, n12, n21, n22) {
    this.elements = [
      1,
      0,
      0,
      1
    ];
    if (n11 !== void 0) {
      this.set(n11, n12, n21, n22);
    }
  }
  /**
   * Sets this matrix to the 2x2 identity matrix.
   *
   * @return {Matrix2} A reference to this matrix.
   */
  identity() {
    this.set(
      1,
      0,
      0,
      1
    );
    return this;
  }
  /**
   * Sets the elements of the matrix from the given array.
   *
   * @param {Array<number>} array - The matrix elements in column-major order.
   * @param {number} [offset=0] - Index of the first element in the array.
   * @return {Matrix2} A reference to this matrix.
   */
  fromArray(array, offset = 0) {
    for (let i = 0; i < 4; i++) {
      this.elements[i] = array[i + offset];
    }
    return this;
  }
  /**
   * Sets the elements of the matrix.The arguments are supposed to be
   * in row-major order.
   *
   * @param {number} n11 - 1-1 matrix element.
   * @param {number} n12 - 1-2 matrix element.
   * @param {number} n21 - 2-1 matrix element.
   * @param {number} n22 - 2-2 matrix element.
   * @return {Matrix2} A reference to this matrix.
   */
  set(n11, n12, n21, n22) {
    const te = this.elements;
    te[0] = n11;
    te[2] = n12;
    te[1] = n21;
    te[3] = n22;
    return this;
  }
};
if (typeof __THREE_DEVTOOLS__ !== "undefined") {
  __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register", { detail: {
    revision: REVISION
  } }));
}
if (typeof window !== "undefined") {
  if (window.__THREE__) {
    warn("WARNING: Multiple instances of Three.js being imported.");
  } else {
    window.__THREE__ = REVISION;
  }
}

// node_modules/three/build/three.module.js
var alphahash_fragment = "#ifdef USE_ALPHAHASH\n	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;\n#endif";
var alphahash_pars_fragment = "#ifdef USE_ALPHAHASH\n	const float ALPHA_HASH_SCALE = 0.05;\n	float hash2D( vec2 value ) {\n		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );\n	}\n	float hash3D( vec3 value ) {\n		return hash2D( vec2( hash2D( value.xy ), value.z ) );\n	}\n	float getAlphaHashThreshold( vec3 position ) {\n		float maxDeriv = max(\n			length( dFdx( position.xyz ) ),\n			length( dFdy( position.xyz ) )\n		);\n		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );\n		vec2 pixScales = vec2(\n			exp2( floor( log2( pixScale ) ) ),\n			exp2( ceil( log2( pixScale ) ) )\n		);\n		vec2 alpha = vec2(\n			hash3D( floor( pixScales.x * position.xyz ) ),\n			hash3D( floor( pixScales.y * position.xyz ) )\n		);\n		float lerpFactor = fract( log2( pixScale ) );\n		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;\n		float a = min( lerpFactor, 1.0 - lerpFactor );\n		vec3 cases = vec3(\n			x * x / ( 2.0 * a * ( 1.0 - a ) ),\n			( x - 0.5 * a ) / ( 1.0 - a ),\n			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )\n		);\n		float threshold = ( x < ( 1.0 - a ) )\n			? ( ( x < a ) ? cases.x : cases.y )\n			: cases.z;\n		return clamp( threshold , 1.0e-6, 1.0 );\n	}\n#endif";
var alphamap_fragment = "#ifdef USE_ALPHAMAP\n	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;\n#endif";
var alphamap_pars_fragment = "#ifdef USE_ALPHAMAP\n	uniform sampler2D alphaMap;\n#endif";
var alphatest_fragment = "#ifdef USE_ALPHATEST\n	#ifdef ALPHA_TO_COVERAGE\n	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );\n	if ( diffuseColor.a == 0.0 ) discard;\n	#else\n	if ( diffuseColor.a < alphaTest ) discard;\n	#endif\n#endif";
var alphatest_pars_fragment = "#ifdef USE_ALPHATEST\n	uniform float alphaTest;\n#endif";
var aomap_fragment = "#ifdef USE_AOMAP\n	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;\n	reflectedLight.indirectDiffuse *= ambientOcclusion;\n	#if defined( USE_CLEARCOAT ) \n		clearcoatSpecularIndirect *= ambientOcclusion;\n	#endif\n	#if defined( USE_SHEEN ) \n		sheenSpecularIndirect *= ambientOcclusion;\n	#endif\n	#if defined( USE_ENVMAP ) && defined( STANDARD )\n		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );\n		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );\n	#endif\n#endif";
var aomap_pars_fragment = "#ifdef USE_AOMAP\n	uniform sampler2D aoMap;\n	uniform float aoMapIntensity;\n#endif";
var batching_pars_vertex = "#ifdef USE_BATCHING\n	#if ! defined( GL_ANGLE_multi_draw )\n	#define gl_DrawID _gl_DrawID\n	uniform int _gl_DrawID;\n	#endif\n	uniform highp sampler2D batchingTexture;\n	uniform highp usampler2D batchingIdTexture;\n	mat4 getBatchingMatrix( const in float i ) {\n		int size = textureSize( batchingTexture, 0 ).x;\n		int j = int( i ) * 4;\n		int x = j % size;\n		int y = j / size;\n		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );\n		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );\n		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );\n		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );\n		return mat4( v1, v2, v3, v4 );\n	}\n	float getIndirectIndex( const in int i ) {\n		int size = textureSize( batchingIdTexture, 0 ).x;\n		int x = i % size;\n		int y = i / size;\n		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );\n	}\n#endif\n#ifdef USE_BATCHING_COLOR\n	uniform sampler2D batchingColorTexture;\n	vec4 getBatchingColor( const in float i ) {\n		int size = textureSize( batchingColorTexture, 0 ).x;\n		int j = int( i );\n		int x = j % size;\n		int y = j / size;\n		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );\n	}\n#endif";
var batching_vertex = "#ifdef USE_BATCHING\n	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );\n#endif";
var begin_vertex = "vec3 transformed = vec3( position );\n#ifdef USE_ALPHAHASH\n	vPosition = vec3( position );\n#endif";
var beginnormal_vertex = "vec3 objectNormal = vec3( normal );\n#ifdef USE_TANGENT\n	vec3 objectTangent = vec3( tangent.xyz );\n#endif";
var bsdfs = "float G_BlinnPhong_Implicit( ) {\n	return 0.25;\n}\nfloat D_BlinnPhong( const in float shininess, const in float dotNH ) {\n	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );\n}\nvec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {\n	vec3 halfDir = normalize( lightDir + viewDir );\n	float dotNH = saturate( dot( normal, halfDir ) );\n	float dotVH = saturate( dot( viewDir, halfDir ) );\n	vec3 F = F_Schlick( specularColor, 1.0, dotVH );\n	float G = G_BlinnPhong_Implicit( );\n	float D = D_BlinnPhong( shininess, dotNH );\n	return F * ( G * D );\n} // validated";
var iridescence_fragment = "#ifdef USE_IRIDESCENCE\n	const mat3 XYZ_TO_REC709 = mat3(\n		 3.2404542, -0.9692660,  0.0556434,\n		-1.5371385,  1.8760108, -0.2040259,\n		-0.4985314,  0.0415560,  1.0572252\n	);\n	vec3 Fresnel0ToIor( vec3 fresnel0 ) {\n		vec3 sqrtF0 = sqrt( fresnel0 );\n		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );\n	}\n	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {\n		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );\n	}\n	float IorToFresnel0( float transmittedIor, float incidentIor ) {\n		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));\n	}\n	vec3 evalSensitivity( float OPD, vec3 shift ) {\n		float phase = 2.0 * PI * OPD * 1.0e-9;\n		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );\n		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );\n		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );\n		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );\n		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );\n		xyz /= 1.0685e-7;\n		vec3 rgb = XYZ_TO_REC709 * xyz;\n		return rgb;\n	}\n	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {\n		vec3 I;\n		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );\n		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );\n		float cosTheta2Sq = 1.0 - sinTheta2Sq;\n		if ( cosTheta2Sq < 0.0 ) {\n			return vec3( 1.0 );\n		}\n		float cosTheta2 = sqrt( cosTheta2Sq );\n		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );\n		float R12 = F_Schlick( R0, 1.0, cosTheta1 );\n		float T121 = 1.0 - R12;\n		float phi12 = 0.0;\n		if ( iridescenceIOR < outsideIOR ) phi12 = PI;\n		float phi21 = PI - phi12;\n		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );\n		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );\n		vec3 phi23 = vec3( 0.0 );\n		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;\n		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;\n		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;\n		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;\n		vec3 phi = vec3( phi21 ) + phi23;\n		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );\n		vec3 r123 = sqrt( R123 );\n		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );\n		vec3 C0 = R12 + Rs;\n		I = C0;\n		vec3 Cm = Rs - T121;\n		for ( int m = 1; m <= 2; ++ m ) {\n			Cm *= r123;\n			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );\n			I += Cm * Sm;\n		}\n		return max( I, vec3( 0.0 ) );\n	}\n#endif";
var bumpmap_pars_fragment = "#ifdef USE_BUMPMAP\n	uniform sampler2D bumpMap;\n	uniform float bumpScale;\n	vec2 dHdxy_fwd() {\n		vec2 dSTdx = dFdx( vBumpMapUv );\n		vec2 dSTdy = dFdy( vBumpMapUv );\n		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;\n		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;\n		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;\n		return vec2( dBx, dBy );\n	}\n	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {\n		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );\n		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );\n		vec3 vN = surf_norm;\n		vec3 R1 = cross( vSigmaY, vN );\n		vec3 R2 = cross( vN, vSigmaX );\n		float fDet = dot( vSigmaX, R1 ) * faceDirection;\n		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );\n		return normalize( abs( fDet ) * surf_norm - vGrad );\n	}\n#endif";
var clipping_planes_fragment = "#if NUM_CLIPPING_PLANES > 0\n	vec4 plane;\n	#ifdef ALPHA_TO_COVERAGE\n		float distanceToPlane, distanceGradient;\n		float clipOpacity = 1.0;\n		#pragma unroll_loop_start\n		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {\n			plane = clippingPlanes[ i ];\n			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;\n			distanceGradient = fwidth( distanceToPlane ) / 2.0;\n			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );\n			if ( clipOpacity == 0.0 ) discard;\n		}\n		#pragma unroll_loop_end\n		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES\n			float unionClipOpacity = 1.0;\n			#pragma unroll_loop_start\n			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {\n				plane = clippingPlanes[ i ];\n				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;\n				distanceGradient = fwidth( distanceToPlane ) / 2.0;\n				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );\n			}\n			#pragma unroll_loop_end\n			clipOpacity *= 1.0 - unionClipOpacity;\n		#endif\n		diffuseColor.a *= clipOpacity;\n		if ( diffuseColor.a == 0.0 ) discard;\n	#else\n		#pragma unroll_loop_start\n		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {\n			plane = clippingPlanes[ i ];\n			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;\n		}\n		#pragma unroll_loop_end\n		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES\n			bool clipped = true;\n			#pragma unroll_loop_start\n			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {\n				plane = clippingPlanes[ i ];\n				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;\n			}\n			#pragma unroll_loop_end\n			if ( clipped ) discard;\n		#endif\n	#endif\n#endif";
var clipping_planes_pars_fragment = "#if NUM_CLIPPING_PLANES > 0\n	varying vec3 vClipPosition;\n	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];\n#endif";
var clipping_planes_pars_vertex = "#if NUM_CLIPPING_PLANES > 0\n	varying vec3 vClipPosition;\n#endif";
var clipping_planes_vertex = "#if NUM_CLIPPING_PLANES > 0\n	vClipPosition = - mvPosition.xyz;\n#endif";
var color_fragment = "#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )\n	diffuseColor *= vColor;\n#endif";
var color_pars_fragment = "#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )\n	varying vec4 vColor;\n#endif";
var color_pars_vertex = "#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )\n	varying vec4 vColor;\n#endif";
var color_vertex = "#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )\n	vColor = vec4( 1.0 );\n#endif\n#ifdef USE_COLOR_ALPHA\n	vColor *= color;\n#elif defined( USE_COLOR )\n	vColor.rgb *= color;\n#endif\n#ifdef USE_INSTANCING_COLOR\n	vColor.rgb *= instanceColor.rgb;\n#endif\n#ifdef USE_BATCHING_COLOR\n	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );\n#endif";
var common = "#define PI 3.141592653589793\n#define PI2 6.283185307179586\n#define PI_HALF 1.5707963267948966\n#define RECIPROCAL_PI 0.3183098861837907\n#define RECIPROCAL_PI2 0.15915494309189535\n#define EPSILON 1e-6\n#ifndef saturate\n#define saturate( a ) clamp( a, 0.0, 1.0 )\n#endif\n#define whiteComplement( a ) ( 1.0 - saturate( a ) )\nfloat pow2( const in float x ) { return x*x; }\nvec3 pow2( const in vec3 x ) { return x*x; }\nfloat pow3( const in float x ) { return x*x*x; }\nfloat pow4( const in float x ) { float x2 = x*x; return x2*x2; }\nfloat max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }\nfloat average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }\nhighp float rand( const in vec2 uv ) {\n	const highp float a = 12.9898, b = 78.233, c = 43758.5453;\n	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );\n	return fract( sin( sn ) * c );\n}\n#ifdef HIGH_PRECISION\n	float precisionSafeLength( vec3 v ) { return length( v ); }\n#else\n	float precisionSafeLength( vec3 v ) {\n		float maxComponent = max3( abs( v ) );\n		return length( v / maxComponent ) * maxComponent;\n	}\n#endif\nstruct IncidentLight {\n	vec3 color;\n	vec3 direction;\n	bool visible;\n};\nstruct ReflectedLight {\n	vec3 directDiffuse;\n	vec3 directSpecular;\n	vec3 indirectDiffuse;\n	vec3 indirectSpecular;\n};\n#ifdef USE_ALPHAHASH\n	varying vec3 vPosition;\n#endif\nvec3 transformDirection( in vec3 dir, in mat4 matrix ) {\n	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );\n}\n#define inverseTransformDirection transformDirectionByInverseViewMatrix\nvec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {\n	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );\n}\nvec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {\n	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );\n}\nbool isPerspectiveMatrix( mat4 m ) {\n	return m[ 2 ][ 3 ] == - 1.0;\n}\nvec2 equirectUv( in vec3 dir ) {\n	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;\n	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;\n	return vec2( u, v );\n}\nvec3 BRDF_Lambert( const in vec3 diffuseColor ) {\n	return RECIPROCAL_PI * diffuseColor;\n}\nvec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {\n	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );\n	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );\n}\nfloat F_Schlick( const in float f0, const in float f90, const in float dotVH ) {\n	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );\n	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );\n} // validated";
var cube_uv_reflection_fragment = "#ifdef ENVMAP_TYPE_CUBE_UV\n	#define cubeUV_minMipLevel 4.0\n	#define cubeUV_minTileSize 16.0\n	float getFace( vec3 direction ) {\n		vec3 absDirection = abs( direction );\n		float face = - 1.0;\n		if ( absDirection.x > absDirection.z ) {\n			if ( absDirection.x > absDirection.y )\n				face = direction.x > 0.0 ? 0.0 : 3.0;\n			else\n				face = direction.y > 0.0 ? 1.0 : 4.0;\n		} else {\n			if ( absDirection.z > absDirection.y )\n				face = direction.z > 0.0 ? 2.0 : 5.0;\n			else\n				face = direction.y > 0.0 ? 1.0 : 4.0;\n		}\n		return face;\n	}\n	vec2 getUV( vec3 direction, float face ) {\n		vec2 uv;\n		if ( face == 0.0 ) {\n			uv = vec2( direction.z, direction.y ) / abs( direction.x );\n		} else if ( face == 1.0 ) {\n			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );\n		} else if ( face == 2.0 ) {\n			uv = vec2( - direction.x, direction.y ) / abs( direction.z );\n		} else if ( face == 3.0 ) {\n			uv = vec2( - direction.z, direction.y ) / abs( direction.x );\n		} else if ( face == 4.0 ) {\n			uv = vec2( - direction.x, direction.z ) / abs( direction.y );\n		} else {\n			uv = vec2( direction.x, direction.y ) / abs( direction.z );\n		}\n		return 0.5 * ( uv + 1.0 );\n	}\n	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {\n		float face = getFace( direction );\n		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );\n		mipInt = max( mipInt, cubeUV_minMipLevel );\n		float faceSize = exp2( mipInt );\n		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;\n		if ( face > 2.0 ) {\n			uv.y += faceSize;\n			face -= 3.0;\n		}\n		uv.x += face * faceSize;\n		uv.x += filterInt * 3.0 * cubeUV_minTileSize;\n		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );\n		uv.x *= CUBEUV_TEXEL_WIDTH;\n		uv.y *= CUBEUV_TEXEL_HEIGHT;\n		#ifdef texture2DGradEXT\n			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;\n		#else\n			return texture2D( envMap, uv ).rgb;\n		#endif\n	}\n	#define cubeUV_r0 1.0\n	#define cubeUV_m0 - 2.0\n	#define cubeUV_r1 0.8\n	#define cubeUV_m1 - 1.0\n	#define cubeUV_r4 0.4\n	#define cubeUV_m4 2.0\n	#define cubeUV_r5 0.305\n	#define cubeUV_m5 3.0\n	#define cubeUV_r6 0.21\n	#define cubeUV_m6 4.0\n	float roughnessToMip( float roughness ) {\n		float mip = 0.0;\n		if ( roughness >= cubeUV_r1 ) {\n			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;\n		} else if ( roughness >= cubeUV_r4 ) {\n			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;\n		} else if ( roughness >= cubeUV_r5 ) {\n			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;\n		} else if ( roughness >= cubeUV_r6 ) {\n			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;\n		} else {\n			mip = - 2.0 * log2( 1.16 * roughness );		}\n		return mip;\n	}\n	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {\n		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );\n		float mipF = fract( mip );\n		float mipInt = floor( mip );\n		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );\n		if ( mipF == 0.0 ) {\n			return vec4( color0, 1.0 );\n		} else {\n			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );\n			return vec4( mix( color0, color1, mipF ), 1.0 );\n		}\n	}\n#endif";
var defaultnormal_vertex = "vec3 transformedNormal = objectNormal;\n#ifdef USE_TANGENT\n	vec3 transformedTangent = objectTangent;\n#endif\n#ifdef USE_BATCHING\n	mat3 bm = mat3( batchingMatrix );\n	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );\n	transformedNormal = bm * transformedNormal;\n	#ifdef USE_TANGENT\n		transformedTangent = bm * transformedTangent;\n	#endif\n#endif\n#ifdef USE_INSTANCING\n	mat3 im = mat3( instanceMatrix );\n	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );\n	transformedNormal = im * transformedNormal;\n	#ifdef USE_TANGENT\n		transformedTangent = im * transformedTangent;\n	#endif\n#endif\ntransformedNormal = normalMatrix * transformedNormal;\n#ifdef FLIP_SIDED\n	transformedNormal = - transformedNormal;\n#endif\n#ifdef USE_TANGENT\n	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;\n#endif";
var displacementmap_pars_vertex = "#ifdef USE_DISPLACEMENTMAP\n	uniform sampler2D displacementMap;\n	uniform float displacementScale;\n	uniform float displacementBias;\n#endif";
var displacementmap_vertex = "#ifdef USE_DISPLACEMENTMAP\n	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );\n#endif";
var emissivemap_fragment = "#ifdef USE_EMISSIVEMAP\n	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );\n	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE\n		emissiveColor = sRGBTransferEOTF( emissiveColor );\n	#endif\n	totalEmissiveRadiance *= emissiveColor.rgb;\n#endif";
var emissivemap_pars_fragment = "#ifdef USE_EMISSIVEMAP\n	uniform sampler2D emissiveMap;\n#endif";
var colorspace_fragment = "gl_FragColor = linearToOutputTexel( gl_FragColor );";
var colorspace_pars_fragment = "vec4 LinearTransferOETF( in vec4 value ) {\n	return value;\n}\nvec4 sRGBTransferEOTF( in vec4 value ) {\n	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );\n}\nvec4 sRGBTransferOETF( in vec4 value ) {\n	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );\n}";
var envmap_fragment = "#ifdef USE_ENVMAP\n	#ifdef ENV_WORLDPOS\n		vec3 cameraToFrag;\n		if ( isOrthographic ) {\n			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );\n		} else {\n			cameraToFrag = normalize( vWorldPosition - cameraPosition );\n		}\n		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );\n		#ifdef ENVMAP_MODE_REFLECTION\n			vec3 reflectVec = reflect( cameraToFrag, worldNormal );\n		#else\n			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );\n		#endif\n	#else\n		vec3 reflectVec = vReflect;\n	#endif\n	#ifdef ENVMAP_TYPE_CUBE\n		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );\n		#ifdef ENVMAP_BLENDING_MULTIPLY\n			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );\n		#elif defined( ENVMAP_BLENDING_MIX )\n			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );\n		#elif defined( ENVMAP_BLENDING_ADD )\n			outgoingLight += envColor.xyz * specularStrength * reflectivity;\n		#endif\n	#endif\n#endif";
var envmap_common_pars_fragment = "#ifdef USE_ENVMAP\n	uniform float envMapIntensity;\n	uniform mat3 envMapRotation;\n	#ifdef ENVMAP_TYPE_CUBE\n		uniform samplerCube envMap;\n	#else\n		uniform sampler2D envMap;\n	#endif\n#endif";
var envmap_pars_fragment = "#ifdef USE_ENVMAP\n	uniform float reflectivity;\n	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )\n		#define ENV_WORLDPOS\n	#endif\n	#ifdef ENV_WORLDPOS\n		varying vec3 vWorldPosition;\n		uniform float refractionRatio;\n	#else\n		varying vec3 vReflect;\n	#endif\n#endif";
var envmap_pars_vertex = "#ifdef USE_ENVMAP\n	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )\n		#define ENV_WORLDPOS\n	#endif\n	#ifdef ENV_WORLDPOS\n		\n		varying vec3 vWorldPosition;\n	#else\n		varying vec3 vReflect;\n		uniform float refractionRatio;\n	#endif\n#endif";
var envmap_vertex = "#ifdef USE_ENVMAP\n	#ifdef ENV_WORLDPOS\n		vWorldPosition = worldPosition.xyz;\n	#else\n		vec3 cameraToVertex;\n		if ( isOrthographic ) {\n			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );\n		} else {\n			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );\n		}\n		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );\n		#ifdef ENVMAP_MODE_REFLECTION\n			vReflect = reflect( cameraToVertex, worldNormal );\n		#else\n			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );\n		#endif\n	#endif\n#endif";
var fog_vertex = "#ifdef USE_FOG\n	vFogDepth = - mvPosition.z;\n#endif";
var fog_pars_vertex = "#ifdef USE_FOG\n	varying float vFogDepth;\n#endif";
var fog_fragment = "#ifdef USE_FOG\n	#ifdef FOG_EXP2\n		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );\n	#else\n		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );\n	#endif\n	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );\n#endif";
var fog_pars_fragment = "#ifdef USE_FOG\n	uniform vec3 fogColor;\n	varying float vFogDepth;\n	#ifdef FOG_EXP2\n		uniform float fogDensity;\n	#else\n		uniform float fogNear;\n		uniform float fogFar;\n	#endif\n#endif";
var gradientmap_pars_fragment = "#ifdef USE_GRADIENTMAP\n	uniform sampler2D gradientMap;\n#endif\nvec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {\n	float dotNL = dot( normal, lightDirection );\n	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );\n	#ifdef USE_GRADIENTMAP\n		return vec3( texture2D( gradientMap, coord ).r );\n	#else\n		vec2 fw = fwidth( coord ) * 0.5;\n		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );\n	#endif\n}";
var lightmap_pars_fragment = "#ifdef USE_LIGHTMAP\n	uniform sampler2D lightMap;\n	uniform float lightMapIntensity;\n#endif";
var lights_lambert_fragment = "LambertMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.specularStrength = specularStrength;";
var lights_lambert_pars_fragment = "varying vec3 vViewPosition;\nstruct LambertMaterial {\n	vec3 diffuseColor;\n	float specularStrength;\n};\nvoid RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {\n	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n	vec3 irradiance = dotNL * directLight.color;\n	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {\n	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct				RE_Direct_Lambert\n#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert";
var lights_pars_begin = "uniform bool receiveShadow;\nuniform vec3 ambientLightColor;\n#if defined( USE_LIGHT_PROBES )\n	uniform vec3 lightProbe[ 9 ];\n#endif\nvec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {\n	float x = normal.x, y = normal.y, z = normal.z;\n	vec3 result = shCoefficients[ 0 ] * 0.886227;\n	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;\n	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;\n	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;\n	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;\n	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;\n	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );\n	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;\n	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );\n	return result;\n}\nvec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {\n	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );\n	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );\n	return irradiance;\n}\nvec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {\n	vec3 irradiance = ambientLightColor;\n	return irradiance;\n}\nfloat getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {\n	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );\n	if ( cutoffDistance > 0.0 ) {\n		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );\n	}\n	return distanceFalloff;\n}\nfloat getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {\n	return smoothstep( coneCosine, penumbraCosine, angleCosine );\n}\n#if NUM_SUN_LIGHTS > 0\n	struct SunLight {\n		vec3 direction;\n		vec3 color;\n	};\n	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];\n	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {\n		light.color = sunLight.color;\n		light.direction = sunLight.direction;\n		light.visible = true;\n	}\n#endif\n#if NUM_DIR_LIGHTS > 0\n	struct DirectionalLight {\n		vec3 direction;\n		vec3 color;\n	};\n	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];\n	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {\n		light.color = directionalLight.color;\n		light.direction = directionalLight.direction;\n		light.visible = true;\n	}\n#endif\n#if NUM_POINT_LIGHTS > 0\n	struct PointLight {\n		vec3 position;\n		vec3 color;\n		float distance;\n		float decay;\n	};\n	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];\n	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {\n		vec3 lVector = pointLight.position - geometryPosition;\n		light.direction = normalize( lVector );\n		float lightDistance = length( lVector );\n		light.color = pointLight.color;\n		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );\n		light.visible = ( light.color != vec3( 0.0 ) );\n	}\n#endif\n#if NUM_SPOT_LIGHTS > 0\n	struct SpotLight {\n		vec3 position;\n		vec3 direction;\n		vec3 color;\n		float distance;\n		float decay;\n		float coneCos;\n		float penumbraCos;\n	};\n	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];\n	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {\n		vec3 lVector = spotLight.position - geometryPosition;\n		light.direction = normalize( lVector );\n		float angleCos = dot( light.direction, spotLight.direction );\n		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );\n		if ( spotAttenuation > 0.0 ) {\n			float lightDistance = length( lVector );\n			light.color = spotLight.color * spotAttenuation;\n			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );\n			light.visible = ( light.color != vec3( 0.0 ) );\n		} else {\n			light.color = vec3( 0.0 );\n			light.visible = false;\n		}\n	}\n#endif\n#if NUM_RECT_AREA_LIGHTS > 0\n	struct RectAreaLight {\n		vec3 color;\n		vec3 position;\n		vec3 halfWidth;\n		vec3 halfHeight;\n	};\n	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;\n	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];\n#endif\n#if NUM_HEMI_LIGHTS > 0\n	struct HemisphereLight {\n		vec3 direction;\n		vec3 skyColor;\n		vec3 groundColor;\n	};\n	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];\n	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {\n		float dotNL = dot( normal, hemiLight.direction );\n		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;\n		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );\n		return irradiance;\n	}\n#endif\n#include <lightprobes_pars_fragment>";
var envmap_physical_pars_fragment = "#ifdef USE_ENVMAP\n	vec3 getIBLIrradiance( const in vec3 normal ) {\n		#ifdef ENVMAP_TYPE_CUBE_UV\n			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );\n			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );\n			return PI * envMapColor.rgb * envMapIntensity;\n		#else\n			return vec3( 0.0 );\n		#endif\n	}\n	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {\n		#ifdef ENVMAP_TYPE_CUBE_UV\n			vec3 reflectVec = reflect( - viewDir, normal );\n			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );\n			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );\n			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );\n			return envMapColor.rgb * envMapIntensity;\n		#else\n			return vec3( 0.0 );\n		#endif\n	}\n	#ifdef USE_RETROREFLECTION\n		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {\n			#ifdef ENVMAP_TYPE_CUBE_UV\n				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );\n				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );\n				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );\n				return envMapColor.rgb * envMapIntensity;\n			#else\n				return vec3( 0.0 );\n			#endif\n		}\n	#endif\n	#ifdef USE_ANISOTROPY\n		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {\n			#ifdef ENVMAP_TYPE_CUBE_UV\n				vec3 bentNormal = cross( bitangent, viewDir );\n				bentNormal = normalize( cross( bentNormal, bitangent ) );\n				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );\n				return getIBLRadiance( viewDir, bentNormal, roughness );\n			#else\n				return vec3( 0.0 );\n			#endif\n		}\n		#ifdef USE_RETROREFLECTION\n			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {\n				#ifdef ENVMAP_TYPE_CUBE_UV\n					vec3 bentNormal = cross( bitangent, viewDir );\n					bentNormal = normalize( cross( bentNormal, bitangent ) );\n					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );\n					return getIBLRetroRadiance( viewDir, bentNormal, roughness );\n				#else\n					return vec3( 0.0 );\n				#endif\n			}\n		#endif\n	#endif\n#endif";
var lights_toon_fragment = "ToonMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;";
var lights_toon_pars_fragment = "varying vec3 vViewPosition;\nstruct ToonMaterial {\n	vec3 diffuseColor;\n};\nvoid RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {\n	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;\n	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {\n	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct				RE_Direct_Toon\n#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon";
var lights_phong_fragment = "BlinnPhongMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.specularColor = specular;\nmaterial.specularShininess = shininess;\nmaterial.specularStrength = specularStrength;";
var lights_phong_pars_fragment = "varying vec3 vViewPosition;\nstruct BlinnPhongMaterial {\n	vec3 diffuseColor;\n	vec3 specularColor;\n	float specularShininess;\n	float specularStrength;\n};\nvoid RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\n	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n	vec3 irradiance = dotNL * directLight.color;\n	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;\n}\nvoid RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\n	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct				RE_Direct_BlinnPhong\n#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong";
var lights_physical_fragment = "PhysicalMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );\nmaterial.metalness = metalnessFactor;\nvec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );\nfloat geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );\nmaterial.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;\nmaterial.roughness = min( material.roughness, 1.0 );\n#ifdef IOR\n	material.ior = ior;\n	#ifdef USE_SPECULAR\n		float specularIntensityFactor = specularIntensity;\n		vec3 specularColorFactor = specularColor;\n		#ifdef USE_SPECULAR_COLORMAP\n			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;\n		#endif\n		#ifdef USE_SPECULAR_INTENSITYMAP\n			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;\n		#endif\n		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );\n	#else\n		float specularIntensityFactor = 1.0;\n		vec3 specularColorFactor = vec3( 1.0 );\n		material.specularF90 = 1.0;\n	#endif\n	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;\n	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );\n#else\n	material.specularColor = vec3( 0.04 );\n	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );\n	material.specularF90 = 1.0;\n#endif\n#ifdef USE_CLEARCOAT\n	material.clearcoat = clearcoat;\n	material.clearcoatRoughness = clearcoatRoughness;\n	material.clearcoatF0 = vec3( 0.04 );\n	material.clearcoatF90 = 1.0;\n	#ifdef USE_CLEARCOATMAP\n		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;\n	#endif\n	#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;\n	#endif\n	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );\n	material.clearcoatRoughness += geometryRoughness;\n	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );\n#endif\n#ifdef USE_DISPERSION\n	material.dispersion = dispersion;\n#endif\n#ifdef USE_RETROREFLECTION\n	material.retroreflectivity = retroreflectivity;\n#endif\n#ifdef USE_IRIDESCENCE\n	material.iridescence = iridescence;\n	material.iridescenceIOR = iridescenceIOR;\n	#ifdef USE_IRIDESCENCEMAP\n		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;\n	#endif\n	#ifdef USE_IRIDESCENCE_THICKNESSMAP\n		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;\n	#else\n		material.iridescenceThickness = iridescenceThicknessMaximum;\n	#endif\n#endif\n#ifdef USE_SHEEN\n	material.sheenColor = sheenColor;\n	#ifdef USE_SHEEN_COLORMAP\n		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;\n	#endif\n	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );\n	#ifdef USE_SHEEN_ROUGHNESSMAP\n		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;\n	#endif\n#endif\n#ifdef USE_ANISOTROPY\n	#ifdef USE_ANISOTROPYMAP\n		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );\n		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;\n		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;\n	#else\n		vec2 anisotropyV = anisotropyVector;\n	#endif\n	material.anisotropy = length( anisotropyV );\n	if( material.anisotropy == 0.0 ) {\n		anisotropyV = vec2( 1.0, 0.0 );\n	} else {\n		anisotropyV /= material.anisotropy;\n		material.anisotropy = saturate( material.anisotropy );\n	}\n	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );\n	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;\n	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;\n#endif";
var lights_physical_pars_fragment = "uniform sampler2D dfgLUT;\nstruct PhysicalMaterial {\n	vec3 diffuseColor;\n	vec3 diffuseContribution;\n	vec3 specularColor;\n	vec3 specularColorBlended;\n	float roughness;\n	float metalness;\n	float specularF90;\n	float dispersion;\n	vec2 dfg;\n	vec3 multiScatteringCompensation;\n	#ifdef USE_RETROREFLECTION\n		float retroreflectivity;\n	#endif\n	#ifdef USE_CLEARCOAT\n		float clearcoat;\n		float clearcoatRoughness;\n		vec3 clearcoatF0;\n		float clearcoatF90;\n	#endif\n	#ifdef USE_IRIDESCENCE\n		float iridescence;\n		float iridescenceIOR;\n		float iridescenceThickness;\n		vec3 iridescenceFresnel;\n		vec3 iridescenceF0Dielectric;\n		vec3 iridescenceF0Metallic;\n	#endif\n	#ifdef USE_SHEEN\n		vec3 sheenColor;\n		float sheenRoughness;\n	#endif\n	#ifdef IOR\n		float ior;\n	#endif\n	#ifdef USE_TRANSMISSION\n		float transmission;\n		float transmissionAlpha;\n		float thickness;\n		float attenuationDistance;\n		vec3 attenuationColor;\n	#endif\n	#ifdef USE_ANISOTROPY\n		float anisotropy;\n		float alphaT;\n		vec3 anisotropyT;\n		vec3 anisotropyB;\n	#endif\n};\nvec3 clearcoatSpecularDirect = vec3( 0.0 );\nvec3 clearcoatSpecularIndirect = vec3( 0.0 );\nvec3 sheenSpecularDirect = vec3( 0.0 );\nvec3 sheenSpecularIndirect = vec3(0.0 );\nvec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {\n    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );\n    float x2 = x * x;\n    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );\n    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );\n}\nfloat V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {\n	float a2 = pow2( alpha );\n	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );\n	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );\n	return 0.5 / max( gv + gl, EPSILON );\n}\nfloat D_GGX( const in float alpha, const in float dotNH ) {\n	float a2 = pow2( alpha );\n	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;\n	return RECIPROCAL_PI * a2 / pow2( denom );\n}\n#ifdef USE_ANISOTROPY\n	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {\n		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );\n		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );\n		return 0.5 / max( gv + gl, EPSILON );\n	}\n	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {\n		float a2 = alphaT * alphaB;\n		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );\n		highp float v2 = dot( v, v );\n		float w2 = a2 / v2;\n		return RECIPROCAL_PI * a2 * pow2 ( w2 );\n	}\n#endif\n#ifdef USE_CLEARCOAT\n	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {\n		vec3 f0 = material.clearcoatF0;\n		float f90 = material.clearcoatF90;\n		float roughness = material.clearcoatRoughness;\n		float alpha = pow2( roughness );\n		vec3 halfDir = normalize( lightDir + viewDir );\n		float dotNL = saturate( dot( normal, lightDir ) );\n		float dotNV = saturate( dot( normal, viewDir ) );\n		float dotNH = saturate( dot( normal, halfDir ) );\n		float dotVH = saturate( dot( viewDir, halfDir ) );\n		vec3 F = F_Schlick( f0, f90, dotVH );\n		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );\n		float D = D_GGX( alpha, dotNH );\n		return F * ( V * D );\n	}\n#endif\nvec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {\n	vec3 f0 = material.specularColorBlended;\n	float f90 = material.specularF90;\n	float roughness = material.roughness;\n	float alpha = pow2( roughness );\n	vec3 halfDir = normalize( lightDir + viewDir );\n	float dotNL = saturate( dot( normal, lightDir ) );\n	float dotNV = saturate( dot( normal, viewDir ) );\n	float dotNH = saturate( dot( normal, halfDir ) );\n	float dotVH = saturate( dot( viewDir, halfDir ) );\n	vec3 F = F_Schlick( f0, f90, dotVH );\n	#ifdef USE_IRIDESCENCE\n		F = mix( F, material.iridescenceFresnel, material.iridescence );\n	#endif\n	#ifdef USE_ANISOTROPY\n		float dotTL = dot( material.anisotropyT, lightDir );\n		float dotTV = dot( material.anisotropyT, viewDir );\n		float dotTH = dot( material.anisotropyT, halfDir );\n		float dotBL = dot( material.anisotropyB, lightDir );\n		float dotBV = dot( material.anisotropyB, viewDir );\n		float dotBH = dot( material.anisotropyB, halfDir );\n		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );\n		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );\n	#else\n		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );\n		float D = D_GGX( alpha, dotNH );\n	#endif\n	return F * ( V * D );\n}\nvec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {\n	const float LUT_SIZE = 64.0;\n	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;\n	const float LUT_BIAS = 0.5 / LUT_SIZE;\n	float dotNV = saturate( dot( N, V ) );\n	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );\n	uv = uv * LUT_SCALE + LUT_BIAS;\n	return uv;\n}\nfloat LTC_ClippedSphereFormFactor( const in vec3 f ) {\n	float l = length( f );\n	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );\n}\nvec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {\n	float x = dot( v1, v2 );\n	float y = abs( x );\n	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;\n	float b = 3.4175940 + ( 4.1616724 + y ) * y;\n	float v = a / b;\n	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;\n	return cross( v1, v2 ) * theta_sintheta;\n}\nvec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {\n	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];\n	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];\n	vec3 lightNormal = cross( v1, v2 );\n	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );\n	vec3 T1, T2;\n	T1 = normalize( V - N * dot( V, N ) );\n	T2 = - cross( N, T1 );\n	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );\n	vec3 coords[ 4 ];\n	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );\n	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );\n	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );\n	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );\n	coords[ 0 ] = normalize( coords[ 0 ] );\n	coords[ 1 ] = normalize( coords[ 1 ] );\n	coords[ 2 ] = normalize( coords[ 2 ] );\n	coords[ 3 ] = normalize( coords[ 3 ] );\n	vec3 vectorFormFactor = vec3( 0.0 );\n	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );\n	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );\n	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );\n	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );\n	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );\n	return vec3( result );\n}\n#if defined( USE_SHEEN )\nfloat D_Charlie( float roughness, float dotNH ) {\n	float alpha = pow2( roughness );\n	float invAlpha = 1.0 / alpha;\n	float cos2h = dotNH * dotNH;\n	float sin2h = max( 1.0 - cos2h, 0.0078125 );\n	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );\n}\nfloat V_Neubelt( float dotNV, float dotNL ) {\n	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );\n}\nvec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {\n	vec3 halfDir = normalize( lightDir + viewDir );\n	float dotNL = saturate( dot( normal, lightDir ) );\n	float dotNV = saturate( dot( normal, viewDir ) );\n	float dotNH = saturate( dot( normal, halfDir ) );\n	float D = D_Charlie( sheenRoughness, dotNH );\n	float V = V_Neubelt( dotNV, dotNL );\n	return sheenColor * ( D * V );\n}\n#endif\nfloat IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {\n	float dotNV = saturate( dot( normal, viewDir ) );\n	float r2 = roughness * roughness;\n	float rInv = 1.0 / ( roughness + 0.1 );\n	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;\n	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;\n	float DG = exp( a * dotNV + b );\n	return saturate( DG );\n}\nvec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {\n	float dotNV = saturate( dot( normal, viewDir ) );\n	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;\n	return specularColor * fab.x + specularF90 * fab.y;\n}\n#ifdef USE_IRIDESCENCE\nvoid computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {\n#else\nvoid computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {\n#endif\n	#ifdef USE_IRIDESCENCE\n		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );\n	#else\n		vec3 Fr = specularColor;\n	#endif\n	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;\n	float Ess = fab.x + fab.y;\n	float Ems = 1.0 - Ess;\n	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );\n	singleScatter += FssEss;\n	multiScatter += Fms * Ems;\n}\n#if NUM_RECT_AREA_LIGHTS > 0\n	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n		vec3 normal = geometryNormal;\n		vec3 viewDir = geometryViewDir;\n		vec3 position = geometryPosition;\n		vec3 lightPos = rectAreaLight.position;\n		vec3 halfWidth = rectAreaLight.halfWidth;\n		vec3 halfHeight = rectAreaLight.halfHeight;\n		vec3 lightColor = rectAreaLight.color;\n		float roughness = material.roughness;\n		vec3 rectCoords[ 4 ];\n		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;\n		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;\n		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;\n		vec2 uv = LTC_Uv( normal, viewDir, roughness );\n		vec4 t1 = texture2D( ltc_1, uv );\n		vec4 t2 = texture2D( ltc_2, uv );\n		mat3 mInv = mat3(\n			vec3( t1.x, 0, t1.y ),\n			vec3(    0, 1,    0 ),\n			vec3( t1.z, 0, t1.w )\n		);\n		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );\n		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );\n		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );\n		#ifdef USE_CLEARCOAT\n			vec3 Ncc = geometryClearcoatNormal;\n			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );\n			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );\n			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );\n			mat3 mInvClearcoat = mat3(\n				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),\n				vec3(             0, 1,             0 ),\n				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )\n			);\n			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;\n			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );\n		#endif\n	}\n#endif\nvoid RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n	vec3 irradiance = dotNL * directLight.color;\n	#ifdef USE_CLEARCOAT\n		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );\n		vec3 ccIrradiance = dotNLcc * directLight.color;\n		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );\n	#endif\n	#ifdef USE_SHEEN\n \n 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );\n \n 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );\n 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );\n \n 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );\n \n 		irradiance *= sheenEnergyComp;\n \n 	#endif\n	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );\n	#ifdef USE_RETROREFLECTION\n		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );\n		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );\n		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );\n	#endif\n	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;\n	vec3 halfDir = normalize( directLight.direction + geometryViewDir );\n	float dotVH = saturate( dot( geometryViewDir, halfDir ) );\n	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );\n	#ifdef USE_RETROREFLECTION\n		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );\n		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );\n		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );\n		F = mix( F, retroF, saturate( material.retroreflectivity ) );\n	#endif\n	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );\n}\nvoid RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n	vec3 singleScattering = vec3( 0.0 );\n	vec3 multiScattering = vec3( 0.0 );\n	#ifdef USE_IRIDESCENCE\n		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );\n	#else\n		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );\n	#endif\n	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );\n	#ifdef USE_SHEEN\n		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );\n		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;\n		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;\n		diffuse *= sheenEnergyComp;\n	#endif\n	reflectedLight.indirectDiffuse += diffuse;\n}\nvoid RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {\n	#ifdef USE_CLEARCOAT\n		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );\n	#endif\n	#ifdef USE_SHEEN\n		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;\n 	#endif\n	vec3 singleScatteringDielectric = vec3( 0.0 );\n	vec3 multiScatteringDielectric = vec3( 0.0 );\n	vec3 singleScatteringMetallic = vec3( 0.0 );\n	vec3 multiScatteringMetallic = vec3( 0.0 );\n	#ifdef USE_IRIDESCENCE\n		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );\n		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );\n	#else\n		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );\n		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );\n	#endif\n	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );\n	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );\n	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;\n	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );\n	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;\n	vec3 indirectSpecular = radiance * singleScattering;\n	indirectSpecular += multiScattering * cosineWeightedIrradiance;\n	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;\n	#ifdef USE_SHEEN\n		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );\n		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;\n		indirectSpecular *= sheenEnergyComp;\n		indirectDiffuse *= sheenEnergyComp;\n	#endif\n	reflectedLight.indirectSpecular += indirectSpecular;\n	reflectedLight.indirectDiffuse += indirectDiffuse;\n}\n#define RE_Direct				RE_Direct_Physical\n#define RE_Direct_RectArea		RE_Direct_RectArea_Physical\n#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical\n#define RE_IndirectSpecular		RE_IndirectSpecular_Physical\nfloat computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {\n	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );\n}";
var lights_fragment_begin = "\nvec3 geometryPosition = - vViewPosition;\nvec3 geometryNormal = normal;\nvec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );\nvec3 geometryClearcoatNormal = vec3( 0.0 );\n#ifdef USE_CLEARCOAT\n	geometryClearcoatNormal = clearcoatNormal;\n#endif\n#ifdef USE_IRIDESCENCE\n	float dotNVi = saturate( dot( normal, geometryViewDir ) );\n	if ( material.iridescenceThickness == 0.0 ) {\n		material.iridescence = 0.0;\n	} else {\n		material.iridescence = saturate( material.iridescence );\n	}\n	if ( material.iridescence > 0.0 ) {\n		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );\n		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );\n		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );\n		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );\n		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );\n	}\n#endif\n#ifdef STANDARD\n	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );\n	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;\n	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )\n		float EssMs = material.dfg.x + material.dfg.y;\n		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );\n	#endif\n#endif\nIncidentLight directLight;\n#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )\n	PointLight pointLight;\n	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0\n	PointLightShadow pointLightShadow;\n	#endif\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n		pointLight = pointLights[ i ];\n		getPointLightInfo( pointLight, geometryPosition, directLight );\n		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )\n		pointLightShadow = pointLightShadows[ i ];\n		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;\n		#endif\n		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )\n	SpotLight spotLight;\n	vec4 spotColor;\n	vec3 spotLightCoord;\n	bool inSpotLightMap;\n	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0\n	SpotLightShadow spotLightShadow;\n	#endif\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n		spotLight = spotLights[ i ];\n		getSpotLightInfo( spotLight, geometryPosition, directLight );\n		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )\n		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX\n		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS\n		#else\n		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )\n		#endif\n		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )\n			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;\n			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );\n			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );\n			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;\n		#endif\n		#undef SPOT_LIGHT_MAP_INDEX\n		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n		spotLightShadow = spotLightShadows[ i ];\n		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;\n		#endif\n		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )\n	SunLight sunLight;\n	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0\n	SunLightShadow sunLightShadow;\n	#endif\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {\n		sunLight = sunLights[ i ];\n		getSunLightInfo( sunLight, directLight );\n		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )\n		sunLightShadow = sunLightShadows[ i ];\n		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;\n		#endif\n		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )\n	DirectionalLight directionalLight;\n	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0\n	DirectionalLightShadow directionalLightShadow;\n	#endif\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n		directionalLight = directionalLights[ i ];\n		getDirectionalLightInfo( directionalLight, directLight );\n		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )\n		directionalLightShadow = directionalLightShadows[ i ];\n		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n		#endif\n		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )\n	RectAreaLight rectAreaLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {\n		rectAreaLight = rectAreaLights[ i ];\n		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if defined( RE_IndirectDiffuse )\n	vec3 iblIrradiance = vec3( 0.0 );\n	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );\n	#if defined( USE_LIGHT_PROBES )\n		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );\n	#endif\n	#if ( NUM_HEMI_LIGHTS > 0 )\n		#pragma unroll_loop_start\n		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\n			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );\n		}\n		#pragma unroll_loop_end\n	#endif\n	#ifdef USE_LIGHT_PROBES_GRID\n		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;\n		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );\n		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );\n	#endif\n#endif\n#if defined( RE_IndirectSpecular )\n	vec3 radiance = vec3( 0.0 );\n	vec3 clearcoatRadiance = vec3( 0.0 );\n#endif";
var lights_fragment_maps = "#if defined( RE_IndirectDiffuse )\n	#ifdef USE_LIGHTMAP\n		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );\n		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;\n		irradiance += lightMapIrradiance;\n	#endif\n	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )\n		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )\n			iblIrradiance += getIBLIrradiance( geometryNormal );\n		#endif\n	#endif\n#endif\n#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )\n	#ifdef USE_ANISOTROPY\n		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );\n	#else\n		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );\n	#endif\n	#ifdef USE_RETROREFLECTION\n		#ifdef USE_ANISOTROPY\n			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );\n		#else\n			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );\n		#endif\n		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );\n	#endif\n	radiance += iblRadiance;\n	#ifdef USE_CLEARCOAT\n		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );\n	#endif\n#endif";
var lights_fragment_end = "#if defined( RE_IndirectDiffuse )\n	#if defined( LAMBERT ) || defined( PHONG )\n		irradiance += iblIrradiance;\n	#endif\n	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n#endif\n#if defined( RE_IndirectSpecular )\n	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n#endif";
var lightprobes_pars_fragment = "#ifdef USE_LIGHT_PROBES_GRID\nuniform highp sampler3D probesSH;\nuniform vec3 probesMin;\nuniform vec3 probesMax;\nuniform vec3 probesResolution;\nvec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {\n	vec3 res = probesResolution;\n	vec3 gridRange = probesMax - probesMin;\n	vec3 resMinusOne = res - 1.0;\n	vec3 probeSpacing = gridRange / resMinusOne;\n	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;\n	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );\n	uvw = uvw * resMinusOne / res + 0.5 / res;\n	float nz          = res.z;\n	float paddedSlices = nz + 2.0;\n	float atlasDepth  = 7.0 * paddedSlices;\n	float uvZBase     = uvw.z * nz + 1.0;\n	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );\n	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );\n	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );\n	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );\n	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );\n	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );\n	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );\n	vec3 c0 = s0.xyz;\n	vec3 c1 = vec3( s0.w, s1.xy );\n	vec3 c2 = vec3( s1.zw, s2.x );\n	vec3 c3 = s2.yzw;\n	vec3 c4 = s3.xyz;\n	vec3 c5 = vec3( s3.w, s4.xy );\n	vec3 c6 = vec3( s4.zw, s5.x );\n	vec3 c7 = s5.yzw;\n	vec3 c8 = s6.xyz;\n	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;\n	vec3 result = c0 * 0.886227;\n	result += c1 * 2.0 * 0.511664 * y;\n	result += c2 * 2.0 * 0.511664 * z;\n	result += c3 * 2.0 * 0.511664 * x;\n	result += c4 * 2.0 * 0.429043 * x * y;\n	result += c5 * 2.0 * 0.429043 * y * z;\n	result += c6 * ( 0.743125 * z * z - 0.247708 );\n	result += c7 * 2.0 * 0.429043 * x * z;\n	result += c8 * 0.429043 * ( x * x - y * y );\n	return max( result, vec3( 0.0 ) );\n}\n#endif";
var logdepthbuf_fragment = "#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )\n	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;\n#endif";
var logdepthbuf_pars_fragment = "#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )\n	uniform float logDepthBufFC;\n	varying float vFragDepth;\n	varying float vIsPerspective;\n#endif";
var logdepthbuf_pars_vertex = "#ifdef USE_LOGARITHMIC_DEPTH_BUFFER\n	varying float vFragDepth;\n	varying float vIsPerspective;\n#endif";
var logdepthbuf_vertex = "#ifdef USE_LOGARITHMIC_DEPTH_BUFFER\n	vFragDepth = 1.0 + gl_Position.w;\n	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );\n#endif";
var map_fragment = "#ifdef USE_MAP\n	vec4 sampledDiffuseColor = texture2D( map, vMapUv );\n	#ifdef DECODE_VIDEO_TEXTURE\n		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );\n	#endif\n	diffuseColor *= sampledDiffuseColor;\n#endif";
var map_pars_fragment = "#ifdef USE_MAP\n	uniform sampler2D map;\n#endif";
var map_particle_fragment = "#if defined( USE_MAP ) || defined( USE_ALPHAMAP )\n	#if defined( USE_POINTS_UV )\n		vec2 uv = vUv;\n	#else\n		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;\n	#endif\n#endif\n#ifdef USE_MAP\n	diffuseColor *= texture2D( map, uv );\n#endif\n#ifdef USE_ALPHAMAP\n	diffuseColor.a *= texture2D( alphaMap, uv ).g;\n#endif";
var map_particle_pars_fragment = "#if defined( USE_POINTS_UV )\n	varying vec2 vUv;\n#else\n	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )\n		uniform mat3 uvTransform;\n	#endif\n#endif\n#ifdef USE_MAP\n	uniform sampler2D map;\n#endif\n#ifdef USE_ALPHAMAP\n	uniform sampler2D alphaMap;\n#endif";
var metalnessmap_fragment = "float metalnessFactor = metalness;\n#ifdef USE_METALNESSMAP\n	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );\n	metalnessFactor *= texelMetalness.b;\n#endif";
var metalnessmap_pars_fragment = "#ifdef USE_METALNESSMAP\n	uniform sampler2D metalnessMap;\n#endif";
var morphinstance_vertex = "#ifdef USE_INSTANCING_MORPH\n	float morphTargetInfluences[ MORPHTARGETS_COUNT ];\n	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;\n	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;\n	}\n#endif";
var morphcolor_vertex = "#if defined( USE_MORPHCOLORS )\n	vColor *= morphTargetBaseInfluence;\n	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n		#if defined( USE_COLOR_ALPHA )\n			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];\n		#elif defined( USE_COLOR )\n			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];\n		#endif\n	}\n#endif";
var morphnormal_vertex = "#ifdef USE_MORPHNORMALS\n	objectNormal *= morphTargetBaseInfluence;\n	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];\n	}\n#endif";
var morphtarget_pars_vertex = "#ifdef USE_MORPHTARGETS\n	#ifndef USE_INSTANCING_MORPH\n		uniform float morphTargetBaseInfluence;\n		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];\n	#endif\n	uniform sampler2DArray morphTargetsTexture;\n	uniform ivec2 morphTargetsTextureSize;\n	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {\n		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;\n		int y = texelIndex / morphTargetsTextureSize.x;\n		int x = texelIndex - y * morphTargetsTextureSize.x;\n		ivec3 morphUV = ivec3( x, y, morphTargetIndex );\n		return texelFetch( morphTargetsTexture, morphUV, 0 );\n	}\n#endif";
var morphtarget_vertex = "#ifdef USE_MORPHTARGETS\n	transformed *= morphTargetBaseInfluence;\n	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];\n	}\n#endif";
var normal_fragment_begin = "float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;\n#ifdef FLAT_SHADED\n	vec3 fdx = dFdx( vViewPosition );\n	vec3 fdy = dFdy( vViewPosition );\n	vec3 normal = normalize( cross( fdx, fdy ) );\n#else\n	vec3 normal = normalize( vNormal );\n	#ifdef DOUBLE_SIDED\n		normal *= faceDirection;\n	#endif\n#endif\n#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )\n	#ifdef USE_TANGENT\n		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );\n	#else\n		mat3 tbn = getTangentFrame( - vViewPosition, normal,\n		#if defined( USE_NORMALMAP )\n			vNormalMapUv\n		#elif defined( USE_CLEARCOAT_NORMALMAP )\n			vClearcoatNormalMapUv\n		#else\n			vUv\n		#endif\n		);\n	#endif\n	#ifdef DOUBLE_SIDED\n		tbn[0] *= faceDirection;\n		tbn[1] *= faceDirection;\n	#endif\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	#ifdef USE_TANGENT\n		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );\n	#else\n		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );\n	#endif\n	#ifdef DOUBLE_SIDED\n		tbn2[0] *= faceDirection;\n		tbn2[1] *= faceDirection;\n	#endif\n#endif\nvec3 nonPerturbedNormal = normal;";
var normal_fragment_maps = "#ifdef USE_NORMALMAP_OBJECTSPACE\n	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;\n	#ifdef FLIP_SIDED\n		normal = - normal;\n	#endif\n	#ifdef DOUBLE_SIDED\n		normal = normal * faceDirection;\n	#endif\n	normal = normalize( normalMatrix * normal );\n#elif defined( USE_NORMALMAP_TANGENTSPACE )\n	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;\n	#if defined( USE_PACKED_NORMALMAP )\n		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );\n	#endif\n	mapN.xy *= normalScale;\n	normal = normalize( tbn * mapN );\n#elif defined( USE_BUMPMAP )\n	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );\n#endif";
var normal_pars_fragment = "#ifndef FLAT_SHADED\n	varying vec3 vNormal;\n	#ifdef USE_TANGENT\n		varying vec3 vTangent;\n		varying vec3 vBitangent;\n	#endif\n#endif";
var normal_pars_vertex = "#ifndef FLAT_SHADED\n	varying vec3 vNormal;\n	#ifdef USE_TANGENT\n		varying vec3 vTangent;\n		varying vec3 vBitangent;\n	#endif\n#endif";
var normal_vertex = "#ifndef FLAT_SHADED\n	vNormal = normalize( transformedNormal );\n	#ifdef USE_TANGENT\n		vTangent = normalize( transformedTangent );\n		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );\n		#ifdef FLIP_SIDED\n			vBitangent = - vBitangent;\n		#endif\n	#endif\n#endif";
var normalmap_pars_fragment = "#ifdef USE_NORMALMAP\n	uniform sampler2D normalMap;\n	uniform vec2 normalScale;\n#endif\n#ifdef USE_NORMALMAP_OBJECTSPACE\n	uniform mat3 normalMatrix;\n#endif\n#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )\n	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {\n		vec3 q0 = dFdx( eye_pos.xyz );\n		vec3 q1 = dFdy( eye_pos.xyz );\n		vec2 st0 = dFdx( uv.st );\n		vec2 st1 = dFdy( uv.st );\n		vec3 N = surf_norm;\n		vec3 q1perp = cross( q1, N );\n		vec3 q0perp = cross( N, q0 );\n		vec3 T = q1perp * st0.x + q0perp * st1.x;\n		vec3 B = q1perp * st0.y + q0perp * st1.y;\n		float det = max( dot( T, T ), dot( B, B ) );\n		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );\n		return mat3( T * scale, B * scale, N );\n	}\n#endif";
var clearcoat_normal_fragment_begin = "#ifdef USE_CLEARCOAT\n	vec3 clearcoatNormal = nonPerturbedNormal;\n#endif";
var clearcoat_normal_fragment_maps = "#ifdef USE_CLEARCOAT_NORMALMAP\n	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;\n	clearcoatMapN.xy *= clearcoatNormalScale;\n	clearcoatNormal = normalize( tbn2 * clearcoatMapN );\n#endif";
var clearcoat_pars_fragment = "#ifdef USE_CLEARCOATMAP\n	uniform sampler2D clearcoatMap;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	uniform sampler2D clearcoatNormalMap;\n	uniform vec2 clearcoatNormalScale;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n	uniform sampler2D clearcoatRoughnessMap;\n#endif";
var iridescence_pars_fragment = "#ifdef USE_IRIDESCENCEMAP\n	uniform sampler2D iridescenceMap;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n	uniform sampler2D iridescenceThicknessMap;\n#endif";
var opaque_fragment = "#ifdef OPAQUE\ndiffuseColor.a = 1.0;\n#endif\n#ifdef USE_TRANSMISSION\ndiffuseColor.a *= material.transmissionAlpha;\n#endif\ngl_FragColor = vec4( outgoingLight, diffuseColor.a );";
var packing = "vec3 packNormalToRGB( const in vec3 normal ) {\n	return normalize( normal ) * 0.5 + 0.5;\n}\nvec3 unpackRGBToNormal( const in vec3 rgb ) {\n	return 2.0 * rgb.xyz - 1.0;\n}\nconst float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;\nconst float Inv255 = 1. / 255.;\nconst vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );\nconst vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );\nconst vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );\nconst vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );\nvec4 packDepthToRGBA( const in float v ) {\n	if( v <= 0.0 )\n		return vec4( 0., 0., 0., 0. );\n	if( v >= 1.0 )\n		return vec4( 1., 1., 1., 1. );\n	float vuf;\n	float af = modf( v * PackFactors.a, vuf );\n	float bf = modf( vuf * ShiftRight8, vuf );\n	float gf = modf( vuf * ShiftRight8, vuf );\n	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );\n}\nvec3 packDepthToRGB( const in float v ) {\n	if( v <= 0.0 )\n		return vec3( 0., 0., 0. );\n	if( v >= 1.0 )\n		return vec3( 1., 1., 1. );\n	float vuf;\n	float bf = modf( v * PackFactors.b, vuf );\n	float gf = modf( vuf * ShiftRight8, vuf );\n	return vec3( vuf * Inv255, gf * PackUpscale, bf );\n}\nvec2 packDepthToRG( const in float v ) {\n	if( v <= 0.0 )\n		return vec2( 0., 0. );\n	if( v >= 1.0 )\n		return vec2( 1., 1. );\n	float vuf;\n	float gf = modf( v * 256., vuf );\n	return vec2( vuf * Inv255, gf );\n}\nfloat unpackRGBAToDepth( const in vec4 v ) {\n	return dot( v, UnpackFactors4 );\n}\nfloat unpackRGBToDepth( const in vec3 v ) {\n	return dot( v, UnpackFactors3 );\n}\nfloat unpackRGToDepth( const in vec2 v ) {\n	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;\n}\nvec4 pack2HalfToRGBA( const in vec2 v ) {\n	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );\n	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );\n}\nvec2 unpackRGBATo2Half( const in vec4 v ) {\n	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );\n}\nfloat viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {\n	return ( viewZ + near ) / ( near - far );\n}\nfloat orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {\n	#ifdef USE_REVERSED_DEPTH_BUFFER\n	\n		return depth * ( far - near ) - far;\n	#else\n		return depth * ( near - far ) - near;\n	#endif\n}\nfloat viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {\n	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );\n}\nfloat perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {\n	\n	#ifdef USE_REVERSED_DEPTH_BUFFER\n		return ( near * far ) / ( ( near - far ) * depth - near );\n	#else\n		return ( near * far ) / ( ( far - near ) * depth - far );\n	#endif\n}";
var premultiplied_alpha_fragment = "#ifdef PREMULTIPLIED_ALPHA\n	gl_FragColor.rgb *= gl_FragColor.a;\n#endif";
var project_vertex = "vec4 mvPosition = vec4( transformed, 1.0 );\n#ifdef USE_BATCHING\n	mvPosition = batchingMatrix * mvPosition;\n#endif\n#ifdef USE_INSTANCING\n	mvPosition = instanceMatrix * mvPosition;\n#endif\nmvPosition = modelViewMatrix * mvPosition;\ngl_Position = projectionMatrix * mvPosition;";
var dithering_fragment = "#ifdef DITHERING\n	gl_FragColor.rgb = dithering( gl_FragColor.rgb );\n#endif";
var dithering_pars_fragment = "#ifdef DITHERING\n	vec3 dithering( vec3 color ) {\n		float grid_position = rand( gl_FragCoord.xy );\n		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );\n		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );\n		return color + dither_shift_RGB;\n	}\n#endif";
var roughnessmap_fragment = "float roughnessFactor = roughness;\n#ifdef USE_ROUGHNESSMAP\n	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );\n	roughnessFactor *= texelRoughness.g;\n#endif";
var roughnessmap_pars_fragment = "#ifdef USE_ROUGHNESSMAP\n	uniform sampler2D roughnessMap;\n#endif";
var shadowmap_pars_fragment = "#if NUM_SPOT_LIGHT_COORDS > 0\n	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];\n#endif\n#if NUM_SPOT_LIGHT_MAPS > 0\n	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];\n#endif\n#ifdef USE_SHADOWMAP\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n		#define SUN_LIGHT_CASCADES 2\n		#if defined( SHADOWMAP_TYPE_PCF )\n			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];\n		#else\n			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];\n		#endif\n		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];\n		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];\n		varying vec4 vSunShadowWorldPosition;\n		varying vec3 vSunShadowWorldNormal;\n		struct SunLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_DIR_LIGHT_SHADOWS > 0\n		#if defined( SHADOWMAP_TYPE_PCF )\n			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];\n		#else\n			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];\n		#endif\n		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];\n		struct DirectionalLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_SPOT_LIGHT_SHADOWS > 0\n		#if defined( SHADOWMAP_TYPE_PCF )\n			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];\n		#else\n			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];\n		#endif\n		struct SpotLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0\n		#if defined( SHADOWMAP_TYPE_PCF )\n			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];\n		#elif defined( SHADOWMAP_TYPE_BASIC )\n			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];\n		#endif\n		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];\n		struct PointLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n			float shadowCameraNear;\n			float shadowCameraFar;\n		};\n		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];\n	#endif\n	#if defined( SHADOWMAP_TYPE_PCF )\n		float interleavedGradientNoise( vec2 position ) {\n			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );\n		}\n		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {\n			const float goldenAngle = 2.399963229728653;\n			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );\n			float theta = float( sampleIndex ) * goldenAngle + phi;\n			return vec2( cos( theta ), sin( theta ) ) * r;\n		}\n	#endif\n	#if defined( SHADOWMAP_TYPE_PCF )\n		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\n			float shadow = 1.0;\n			shadowCoord.xyz /= shadowCoord.w;\n			shadowCoord.z += shadowBias;\n			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;\n			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;\n			if ( frustumTest ) {\n				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;\n				float radius = shadowRadius * texelSize.x;\n				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;\n				shadow = (\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )\n				) * 0.2;\n			}\n			return mix( 1.0, shadow, shadowIntensity );\n		}\n	#elif defined( SHADOWMAP_TYPE_VSM )\n		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\n			float shadow = 1.0;\n			shadowCoord.xyz /= shadowCoord.w;\n			#ifdef USE_REVERSED_DEPTH_BUFFER\n				shadowCoord.z -= shadowBias;\n			#else\n				shadowCoord.z += shadowBias;\n			#endif\n			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;\n			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;\n			if ( frustumTest ) {\n				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;\n				float mean = distribution.x;\n				float variance = distribution.y * distribution.y;\n				#ifdef USE_REVERSED_DEPTH_BUFFER\n					float hard_shadow = step( mean, shadowCoord.z );\n				#else\n					float hard_shadow = step( shadowCoord.z, mean );\n				#endif\n				\n				if ( hard_shadow == 1.0 ) {\n					shadow = 1.0;\n				} else {\n					variance = max( variance, 0.0000001 );\n					float d = shadowCoord.z - mean;\n					float p_max = variance / ( variance + d * d );\n					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );\n					shadow = max( hard_shadow, p_max );\n				}\n			}\n			return mix( 1.0, shadow, shadowIntensity );\n		}\n	#else\n		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\n			float shadow = 1.0;\n			shadowCoord.xyz /= shadowCoord.w;\n			#ifdef USE_REVERSED_DEPTH_BUFFER\n				shadowCoord.z -= shadowBias;\n			#else\n				shadowCoord.z += shadowBias;\n			#endif\n			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;\n			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;\n			if ( frustumTest ) {\n				float depth = texture2D( shadowMap, shadowCoord.xy ).r;\n				#ifdef USE_REVERSED_DEPTH_BUFFER\n					shadow = step( depth, shadowCoord.z );\n				#else\n					shadow = step( shadowCoord.z, depth );\n				#endif\n			}\n			return mix( 1.0, shadow, shadowIntensity );\n		}\n	#endif\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n		float getSunShadow(\n			#if defined( SHADOWMAP_TYPE_PCF )\n				sampler2DShadow shadowMap,\n			#else\n				sampler2D shadowMap,\n			#endif\n			SunLightShadow sunLightShadow,\n			int shadowIndex\n		) {\n			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );\n			float viewDepth = vSunShadowWorldPosition.w;\n			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;\n			float shadow = 1.0;\n			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {\n				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];\n				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {\n					float cascadeShadow = getShadow(\n						shadowMap,\n						sunLightShadow.shadowMapSize,\n						sunLightShadow.shadowIntensity,\n						sunLightShadow.shadowBias,\n						sunLightShadow.shadowRadius,\n						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition\n					);\n					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );\n				}\n			}\n			return shadow;\n		}\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0\n	#if defined( SHADOWMAP_TYPE_PCF )\n	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {\n		float shadow = 1.0;\n		vec3 lightToPosition = shadowCoord.xyz;\n		vec3 bd3D = normalize( lightToPosition );\n		vec3 absVec = abs( lightToPosition );\n		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );\n		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {\n			#ifdef USE_REVERSED_DEPTH_BUFFER\n				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );\n				dp -= shadowBias;\n			#else\n				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );\n				dp += shadowBias;\n			#endif\n			float texelSize = shadowRadius / shadowMapSize.x;\n			vec3 absDir = abs( bd3D );\n			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );\n			tangent = normalize( cross( bd3D, tangent ) );\n			vec3 bitangent = cross( bd3D, tangent );\n			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;\n			vec2 sample0 = vogelDiskSample( 0, 5, phi );\n			vec2 sample1 = vogelDiskSample( 1, 5, phi );\n			vec2 sample2 = vogelDiskSample( 2, 5, phi );\n			vec2 sample3 = vogelDiskSample( 3, 5, phi );\n			vec2 sample4 = vogelDiskSample( 4, 5, phi );\n			shadow = (\n				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +\n				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +\n				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +\n				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +\n				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )\n			) * 0.2;\n		}\n		return mix( 1.0, shadow, shadowIntensity );\n	}\n	#elif defined( SHADOWMAP_TYPE_BASIC )\n	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {\n		float shadow = 1.0;\n		vec3 lightToPosition = shadowCoord.xyz;\n		vec3 absVec = abs( lightToPosition );\n		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );\n		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {\n			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );\n			dp += shadowBias;\n			vec3 bd3D = normalize( lightToPosition );\n			float depth = textureCube( shadowMap, bd3D ).r;\n			#ifdef USE_REVERSED_DEPTH_BUFFER\n				depth = 1.0 - depth;\n			#endif\n			shadow = step( dp, depth );\n		}\n		return mix( 1.0, shadow, shadowIntensity );\n	}\n	#endif\n	#endif\n#endif";
var shadowmap_pars_vertex = "#if NUM_SPOT_LIGHT_COORDS > 0\n	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];\n	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];\n#endif\n#ifdef USE_SHADOWMAP\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n		varying vec4 vSunShadowWorldPosition;\n		varying vec3 vSunShadowWorldNormal;\n	#endif\n	#if NUM_DIR_LIGHT_SHADOWS > 0\n		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];\n		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];\n		struct DirectionalLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_SPOT_LIGHT_SHADOWS > 0\n		struct SpotLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0\n		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];\n		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];\n		struct PointLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n			float shadowCameraNear;\n			float shadowCameraFar;\n		};\n		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];\n	#endif\n#endif";
var shadowmap_vertex = "#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )\n	#ifdef HAS_NORMAL\n		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );\n	#else\n		vec3 shadowWorldNormal = vec3( 0.0 );\n	#endif\n	vec4 shadowWorldPosition;\n#endif\n#if defined( USE_SHADOWMAP )\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );\n		vSunShadowWorldNormal = shadowWorldNormal;\n	#endif\n	#if NUM_DIR_LIGHT_SHADOWS > 0\n		#pragma unroll_loop_start\n		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {\n			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );\n			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;\n		}\n		#pragma unroll_loop_end\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0\n		#pragma unroll_loop_start\n		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {\n			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );\n			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;\n		}\n		#pragma unroll_loop_end\n	#endif\n#endif\n#if NUM_SPOT_LIGHT_COORDS > 0\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {\n		shadowWorldPosition = worldPosition;\n		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;\n		#endif\n		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;\n	}\n	#pragma unroll_loop_end\n#endif";
var shadowmask_pars_fragment = "float getShadowMask() {\n	float shadow = 1.0;\n	#ifdef USE_SHADOWMAP\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n	SunLightShadow sunLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {\n		sunLight = sunLightShadows[ i ];\n		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;\n	}\n	#pragma unroll_loop_end\n	#endif\n	#if NUM_DIR_LIGHT_SHADOWS > 0\n	DirectionalLightShadow directionalLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {\n		directionalLight = directionalLightShadows[ i ];\n		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n	}\n	#pragma unroll_loop_end\n	#endif\n	#if NUM_SPOT_LIGHT_SHADOWS > 0\n	SpotLightShadow spotLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {\n		spotLight = spotLightShadows[ i ];\n		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;\n	}\n	#pragma unroll_loop_end\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )\n	PointLightShadow pointLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {\n		pointLight = pointLightShadows[ i ];\n		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;\n	}\n	#pragma unroll_loop_end\n	#endif\n	#endif\n	return shadow;\n}";
var skinbase_vertex = "#ifdef USE_SKINNING\n	mat4 boneMatX = getBoneMatrix( skinIndex.x );\n	mat4 boneMatY = getBoneMatrix( skinIndex.y );\n	mat4 boneMatZ = getBoneMatrix( skinIndex.z );\n	mat4 boneMatW = getBoneMatrix( skinIndex.w );\n#endif";
var skinning_pars_vertex = "#ifdef USE_SKINNING\n	uniform mat4 bindMatrix;\n	uniform mat4 bindMatrixInverse;\n	uniform highp sampler2D boneTexture;\n	mat4 getBoneMatrix( const in float i ) {\n		int size = textureSize( boneTexture, 0 ).x;\n		int j = int( i ) * 4;\n		int x = j % size;\n		int y = j / size;\n		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );\n		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );\n		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );\n		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );\n		return mat4( v1, v2, v3, v4 );\n	}\n#endif";
var skinning_vertex = "#ifdef USE_SKINNING\n	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );\n	vec4 skinned = vec4( 0.0 );\n	skinned += boneMatX * skinVertex * skinWeight.x;\n	skinned += boneMatY * skinVertex * skinWeight.y;\n	skinned += boneMatZ * skinVertex * skinWeight.z;\n	skinned += boneMatW * skinVertex * skinWeight.w;\n	transformed = ( bindMatrixInverse * skinned ).xyz;\n#endif";
var skinnormal_vertex = "#ifdef USE_SKINNING\n	mat4 skinMatrix = mat4( 0.0 );\n	skinMatrix += skinWeight.x * boneMatX;\n	skinMatrix += skinWeight.y * boneMatY;\n	skinMatrix += skinWeight.z * boneMatZ;\n	skinMatrix += skinWeight.w * boneMatW;\n	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;\n	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;\n	#ifdef USE_TANGENT\n		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;\n	#endif\n#endif";
var specularmap_fragment = "float specularStrength;\n#ifdef USE_SPECULARMAP\n	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );\n	specularStrength = texelSpecular.r;\n#else\n	specularStrength = 1.0;\n#endif";
var specularmap_pars_fragment = "#ifdef USE_SPECULARMAP\n	uniform sampler2D specularMap;\n#endif";
var tonemapping_fragment = "#if defined( TONE_MAPPING )\n	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );\n#endif";
var tonemapping_pars_fragment = "#ifndef saturate\n#define saturate( a ) clamp( a, 0.0, 1.0 )\n#endif\nuniform float toneMappingExposure;\nvec3 LinearToneMapping( vec3 color ) {\n	return saturate( toneMappingExposure * color );\n}\nvec3 ReinhardToneMapping( vec3 color ) {\n	color *= toneMappingExposure;\n	return saturate( color / ( vec3( 1.0 ) + color ) );\n}\nvec3 CineonToneMapping( vec3 color ) {\n	color *= toneMappingExposure;\n	color = max( vec3( 0.0 ), color - 0.004 );\n	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );\n}\nvec3 RRTAndODTFit( vec3 v ) {\n	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;\n	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;\n	return a / b;\n}\nvec3 ACESFilmicToneMapping( vec3 color ) {\n	const mat3 ACESInputMat = mat3(\n		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),\n		vec3( 0.04823, 0.01566, 0.83777 )\n	);\n	const mat3 ACESOutputMat = mat3(\n		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),\n		vec3( -0.07367, -0.00605,  1.07602 )\n	);\n	color *= toneMappingExposure / 0.6;\n	color = ACESInputMat * color;\n	color = RRTAndODTFit( color );\n	color = ACESOutputMat * color;\n	return saturate( color );\n}\nconst mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(\n	vec3( 1.6605, - 0.1246, - 0.0182 ),\n	vec3( - 0.5876, 1.1329, - 0.1006 ),\n	vec3( - 0.0728, - 0.0083, 1.1187 )\n);\nconst mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(\n	vec3( 0.6274, 0.0691, 0.0164 ),\n	vec3( 0.3293, 0.9195, 0.0880 ),\n	vec3( 0.0433, 0.0113, 0.8956 )\n);\nvec3 agxDefaultContrastApprox( vec3 x ) {\n	vec3 x2 = x * x;\n	vec3 x4 = x2 * x2;\n	return + 15.5 * x4 * x2\n		- 40.14 * x4 * x\n		+ 31.96 * x4\n		- 6.868 * x2 * x\n		+ 0.4298 * x2\n		+ 0.1191 * x\n		- 0.00232;\n}\nvec3 AgXToneMapping( vec3 color ) {\n	const mat3 AgXInsetMatrix = mat3(\n		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),\n		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),\n		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )\n	);\n	const mat3 AgXOutsetMatrix = mat3(\n		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),\n		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),\n		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )\n	);\n	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;\n	color *= toneMappingExposure;\n	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;\n	color = AgXInsetMatrix * color;\n	color = max( color, 1e-10 );	color = log2( color );\n	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );\n	color = clamp( color, 0.0, 1.0 );\n	color = agxDefaultContrastApprox( color );\n	color = AgXOutsetMatrix * color;\n	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );\n	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;\n	color = clamp( color, 0.0, 1.0 );\n	return color;\n}\nvec3 NeutralToneMapping( vec3 color ) {\n	const float StartCompression = 0.8 - 0.04;\n	const float Desaturation = 0.15;\n	color *= toneMappingExposure;\n	float x = min( color.r, min( color.g, color.b ) );\n	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;\n	color -= offset;\n	float peak = max( color.r, max( color.g, color.b ) );\n	if ( peak < StartCompression ) return color;\n	float d = 1. - StartCompression;\n	float newPeak = 1. - d * d / ( peak + d - StartCompression );\n	color *= newPeak / peak;\n	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );\n	return mix( color, vec3( newPeak ), g );\n}\nvec3 CustomToneMapping( vec3 color ) { return color; }";
var transmission_fragment = "#ifdef USE_TRANSMISSION\n	material.transmission = transmission;\n	material.transmissionAlpha = 1.0;\n	material.thickness = thickness;\n	material.attenuationDistance = attenuationDistance;\n	material.attenuationColor = attenuationColor;\n	#ifdef USE_TRANSMISSIONMAP\n		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;\n	#endif\n	#ifdef USE_THICKNESSMAP\n		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;\n	#endif\n	vec3 pos = vWorldPosition;\n	vec3 v = normalize( cameraPosition - pos );\n	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );\n	vec4 transmitted = getIBLVolumeRefraction(\n		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,\n		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,\n		material.attenuationColor, material.attenuationDistance );\n	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );\n	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );\n#endif";
var transmission_pars_fragment = "#ifdef USE_TRANSMISSION\n	uniform float transmission;\n	uniform float thickness;\n	uniform float attenuationDistance;\n	uniform vec3 attenuationColor;\n	#ifdef USE_TRANSMISSIONMAP\n		uniform sampler2D transmissionMap;\n	#endif\n	#ifdef USE_THICKNESSMAP\n		uniform sampler2D thicknessMap;\n	#endif\n	uniform vec2 transmissionSamplerSize;\n	uniform sampler2D transmissionSamplerMap;\n	uniform mat4 modelMatrix;\n	uniform mat4 projectionMatrix;\n	varying vec3 vWorldPosition;\n	float w0( float a ) {\n		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );\n	}\n	float w1( float a ) {\n		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );\n	}\n	float w2( float a ){\n		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );\n	}\n	float w3( float a ) {\n		return ( 1.0 / 6.0 ) * ( a * a * a );\n	}\n	float g0( float a ) {\n		return w0( a ) + w1( a );\n	}\n	float g1( float a ) {\n		return w2( a ) + w3( a );\n	}\n	float h0( float a ) {\n		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );\n	}\n	float h1( float a ) {\n		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );\n	}\n	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {\n		uv = uv * texelSize.zw + 0.5;\n		vec2 iuv = floor( uv );\n		vec2 fuv = fract( uv );\n		float g0x = g0( fuv.x );\n		float g1x = g1( fuv.x );\n		float h0x = h0( fuv.x );\n		float h1x = h1( fuv.x );\n		float h0y = h0( fuv.y );\n		float h1y = h1( fuv.y );\n		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;\n		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;\n		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;\n		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;\n		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +\n			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );\n	}\n	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {\n		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );\n		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );\n		vec2 fLodSizeInv = 1.0 / fLodSize;\n		vec2 cLodSizeInv = 1.0 / cLodSize;\n		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );\n		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );\n		return mix( fSample, cSample, fract( lod ) );\n	}\n	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {\n		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );\n		vec3 modelScale;\n		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );\n		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );\n		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );\n		return normalize( refractionVector ) * thickness * modelScale;\n	}\n	float applyIorToRoughness( const in float roughness, const in float ior ) {\n		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );\n	}\n	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {\n		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );\n		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );\n	}\n	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {\n		if ( isinf( attenuationDistance ) ) {\n			return vec3( 1.0 );\n		} else {\n			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;\n			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;\n		}\n	}\n	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,\n		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,\n		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,\n		const in vec3 attenuationColor, const in float attenuationDistance ) {\n		vec4 transmittedLight;\n		vec3 transmittance;\n		#ifdef USE_DISPERSION\n			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;\n			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );\n			for ( int i = 0; i < 3; i ++ ) {\n				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );\n				vec3 refractedRayExit = position + transmissionRay;\n				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );\n				vec2 refractionCoords = ndcPos.xy / ndcPos.w;\n				refractionCoords += 1.0;\n				refractionCoords /= 2.0;\n				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );\n				transmittedLight[ i ] = transmissionSample[ i ];\n				transmittedLight.a += transmissionSample.a;\n				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];\n			}\n			transmittedLight.a /= 3.0;\n		#else\n			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );\n			vec3 refractedRayExit = position + transmissionRay;\n			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );\n			vec2 refractionCoords = ndcPos.xy / ndcPos.w;\n			refractionCoords += 1.0;\n			refractionCoords /= 2.0;\n			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );\n			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );\n		#endif\n		vec3 attenuatedColor = transmittance * transmittedLight.rgb;\n		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );\n		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;\n		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );\n	}\n#endif";
var uv_pars_fragment = "#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n	varying vec2 vUv;\n#endif\n#ifdef USE_MAP\n	varying vec2 vMapUv;\n#endif\n#ifdef USE_ALPHAMAP\n	varying vec2 vAlphaMapUv;\n#endif\n#ifdef USE_LIGHTMAP\n	varying vec2 vLightMapUv;\n#endif\n#ifdef USE_AOMAP\n	varying vec2 vAoMapUv;\n#endif\n#ifdef USE_BUMPMAP\n	varying vec2 vBumpMapUv;\n#endif\n#ifdef USE_NORMALMAP\n	varying vec2 vNormalMapUv;\n#endif\n#ifdef USE_EMISSIVEMAP\n	varying vec2 vEmissiveMapUv;\n#endif\n#ifdef USE_METALNESSMAP\n	varying vec2 vMetalnessMapUv;\n#endif\n#ifdef USE_ROUGHNESSMAP\n	varying vec2 vRoughnessMapUv;\n#endif\n#ifdef USE_ANISOTROPYMAP\n	varying vec2 vAnisotropyMapUv;\n#endif\n#ifdef USE_CLEARCOATMAP\n	varying vec2 vClearcoatMapUv;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	varying vec2 vClearcoatNormalMapUv;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n	varying vec2 vClearcoatRoughnessMapUv;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n	varying vec2 vIridescenceMapUv;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n	varying vec2 vIridescenceThicknessMapUv;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n	varying vec2 vSheenColorMapUv;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n	varying vec2 vSheenRoughnessMapUv;\n#endif\n#ifdef USE_SPECULARMAP\n	varying vec2 vSpecularMapUv;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n	varying vec2 vSpecularColorMapUv;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n	varying vec2 vSpecularIntensityMapUv;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n	uniform mat3 transmissionMapTransform;\n	varying vec2 vTransmissionMapUv;\n#endif\n#ifdef USE_THICKNESSMAP\n	uniform mat3 thicknessMapTransform;\n	varying vec2 vThicknessMapUv;\n#endif";
var uv_pars_vertex = "#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n	varying vec2 vUv;\n#endif\n#ifdef USE_MAP\n	uniform mat3 mapTransform;\n	varying vec2 vMapUv;\n#endif\n#ifdef USE_ALPHAMAP\n	uniform mat3 alphaMapTransform;\n	varying vec2 vAlphaMapUv;\n#endif\n#ifdef USE_LIGHTMAP\n	uniform mat3 lightMapTransform;\n	varying vec2 vLightMapUv;\n#endif\n#ifdef USE_AOMAP\n	uniform mat3 aoMapTransform;\n	varying vec2 vAoMapUv;\n#endif\n#ifdef USE_BUMPMAP\n	uniform mat3 bumpMapTransform;\n	varying vec2 vBumpMapUv;\n#endif\n#ifdef USE_NORMALMAP\n	uniform mat3 normalMapTransform;\n	varying vec2 vNormalMapUv;\n#endif\n#ifdef USE_DISPLACEMENTMAP\n	uniform mat3 displacementMapTransform;\n	varying vec2 vDisplacementMapUv;\n#endif\n#ifdef USE_EMISSIVEMAP\n	uniform mat3 emissiveMapTransform;\n	varying vec2 vEmissiveMapUv;\n#endif\n#ifdef USE_METALNESSMAP\n	uniform mat3 metalnessMapTransform;\n	varying vec2 vMetalnessMapUv;\n#endif\n#ifdef USE_ROUGHNESSMAP\n	uniform mat3 roughnessMapTransform;\n	varying vec2 vRoughnessMapUv;\n#endif\n#ifdef USE_ANISOTROPYMAP\n	uniform mat3 anisotropyMapTransform;\n	varying vec2 vAnisotropyMapUv;\n#endif\n#ifdef USE_CLEARCOATMAP\n	uniform mat3 clearcoatMapTransform;\n	varying vec2 vClearcoatMapUv;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	uniform mat3 clearcoatNormalMapTransform;\n	varying vec2 vClearcoatNormalMapUv;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n	uniform mat3 clearcoatRoughnessMapTransform;\n	varying vec2 vClearcoatRoughnessMapUv;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n	uniform mat3 sheenColorMapTransform;\n	varying vec2 vSheenColorMapUv;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n	uniform mat3 sheenRoughnessMapTransform;\n	varying vec2 vSheenRoughnessMapUv;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n	uniform mat3 iridescenceMapTransform;\n	varying vec2 vIridescenceMapUv;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n	uniform mat3 iridescenceThicknessMapTransform;\n	varying vec2 vIridescenceThicknessMapUv;\n#endif\n#ifdef USE_SPECULARMAP\n	uniform mat3 specularMapTransform;\n	varying vec2 vSpecularMapUv;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n	uniform mat3 specularColorMapTransform;\n	varying vec2 vSpecularColorMapUv;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n	uniform mat3 specularIntensityMapTransform;\n	varying vec2 vSpecularIntensityMapUv;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n	uniform mat3 transmissionMapTransform;\n	varying vec2 vTransmissionMapUv;\n#endif\n#ifdef USE_THICKNESSMAP\n	uniform mat3 thicknessMapTransform;\n	varying vec2 vThicknessMapUv;\n#endif";
var uv_vertex = "#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n	vUv = vec3( uv, 1 ).xy;\n#endif\n#ifdef USE_MAP\n	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ALPHAMAP\n	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_LIGHTMAP\n	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_AOMAP\n	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_BUMPMAP\n	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_NORMALMAP\n	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_DISPLACEMENTMAP\n	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_EMISSIVEMAP\n	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_METALNESSMAP\n	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ROUGHNESSMAP\n	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ANISOTROPYMAP\n	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOATMAP\n	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULARMAP\n	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_THICKNESSMAP\n	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;\n#endif";
var worldpos_vertex = "#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0\n	vec4 worldPosition = vec4( transformed, 1.0 );\n	#ifdef USE_BATCHING\n		worldPosition = batchingMatrix * worldPosition;\n	#endif\n	#ifdef USE_INSTANCING\n		worldPosition = instanceMatrix * worldPosition;\n	#endif\n	worldPosition = modelMatrix * worldPosition;\n#endif";
var vertex$h = "varying vec2 vUv;\nuniform mat3 uvTransform;\nvoid main() {\n	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;\n	gl_Position = vec4( position.xy, 1.0, 1.0 );\n}";
var fragment$h = "uniform sampler2D t2D;\nuniform float backgroundIntensity;\nvarying vec2 vUv;\nvoid main() {\n	vec4 texColor = texture2D( t2D, vUv );\n	#ifdef DECODE_VIDEO_TEXTURE\n		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );\n	#endif\n	texColor.rgb *= backgroundIntensity;\n	gl_FragColor = texColor;\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n}";
var vertex$g = "varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n	vWorldDirection = transformDirection( position, modelMatrix );\n	#include <begin_vertex>\n	#include <project_vertex>\n	gl_Position.z = gl_Position.w;\n}";
var fragment$g = "#ifdef ENVMAP_TYPE_CUBE\n	uniform samplerCube envMap;\n#elif defined( ENVMAP_TYPE_CUBE_UV )\n	uniform sampler2D envMap;\n#endif\nuniform float backgroundBlurriness;\nuniform float backgroundIntensity;\nuniform mat3 backgroundRotation;\nvarying vec3 vWorldDirection;\n#include <cube_uv_reflection_fragment>\nvoid main() {\n	#ifdef ENVMAP_TYPE_CUBE\n		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );\n	#elif defined( ENVMAP_TYPE_CUBE_UV )\n		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );\n	#else\n		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );\n	#endif\n	texColor.rgb *= backgroundIntensity;\n	gl_FragColor = texColor;\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n}";
var vertex$f = "varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n	vWorldDirection = transformDirection( position, modelMatrix );\n	#include <begin_vertex>\n	#include <project_vertex>\n	gl_Position.z = gl_Position.w;\n}";
var fragment$f = "uniform samplerCube tCube;\nuniform float tFlip;\nuniform float opacity;\nvarying vec3 vWorldDirection;\nvoid main() {\n	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );\n	gl_FragColor = texColor;\n	gl_FragColor.a *= opacity;\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n}";
var vertex$e = "#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvarying vec2 vHighPrecisionZW;\nvoid main() {\n	#include <uv_vertex>\n	#include <batching_vertex>\n	#include <skinbase_vertex>\n	#include <morphinstance_vertex>\n	#ifdef USE_DISPLACEMENTMAP\n		#include <beginnormal_vertex>\n		#include <morphnormal_vertex>\n		#include <skinnormal_vertex>\n	#endif\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vHighPrecisionZW = gl_Position.zw;\n}";
var fragment$e = "#if DEPTH_PACKING == 3200\n	uniform float opacity;\n#endif\n#include <common>\n#include <packing>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvarying vec2 vHighPrecisionZW;\nvoid main() {\n	vec4 diffuseColor = vec4( 1.0 );\n	#include <clipping_planes_fragment>\n	#if DEPTH_PACKING == 3200\n		diffuseColor.a = opacity;\n	#endif\n	#include <map_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <logdepthbuf_fragment>\n	#ifdef USE_REVERSED_DEPTH_BUFFER\n		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];\n	#else\n		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;\n	#endif\n	#if DEPTH_PACKING == 3200\n		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );\n	#elif DEPTH_PACKING == 3201\n		gl_FragColor = packDepthToRGBA( fragCoordZ );\n	#elif DEPTH_PACKING == 3202\n		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );\n	#elif DEPTH_PACKING == 3203\n		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );\n	#endif\n}";
var vertex$d = "#define DISTANCE\nvarying vec3 vWorldPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <batching_vertex>\n	#include <skinbase_vertex>\n	#include <morphinstance_vertex>\n	#ifdef USE_DISPLACEMENTMAP\n		#include <beginnormal_vertex>\n		#include <morphnormal_vertex>\n		#include <skinnormal_vertex>\n	#endif\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <worldpos_vertex>\n	#include <clipping_planes_vertex>\n	vWorldPosition = worldPosition.xyz;\n}";
var fragment$d = "#define DISTANCE\nuniform vec3 referencePosition;\nuniform float nearDistance;\nuniform float farDistance;\nvarying vec3 vWorldPosition;\n#include <common>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( 1.0 );\n	#include <clipping_planes_fragment>\n	#include <map_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	float dist = length( vWorldPosition - referencePosition );\n	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );\n	dist = saturate( dist );\n	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );\n}";
var vertex$c = "varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n	vWorldDirection = transformDirection( position, modelMatrix );\n	#include <begin_vertex>\n	#include <project_vertex>\n}";
var fragment$c = "uniform sampler2D tEquirect;\nvarying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n	vec3 direction = normalize( vWorldDirection );\n	vec2 sampleUV = equirectUv( direction );\n	gl_FragColor = texture2D( tEquirect, sampleUV );\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n}";
var vertex$b = "uniform float scale;\nattribute float lineDistance;\nvarying float vLineDistance;\n#include <common>\n#include <uv_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	vLineDistance = scale * lineDistance;\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <fog_vertex>\n}";
var fragment$b = "uniform vec3 diffuse;\nuniform float opacity;\nuniform float dashSize;\nuniform float totalSize;\nvarying float vLineDistance;\n#include <common>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	if ( mod( vLineDistance, totalSize ) > dashSize ) {\n		discard;\n	}\n	vec3 outgoingLight = vec3( 0.0 );\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	outgoingLight = diffuseColor.rgb;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n}";
var vertex$a = "#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )\n		#include <beginnormal_vertex>\n		#include <morphnormal_vertex>\n		#include <skinbase_vertex>\n		#include <skinnormal_vertex>\n		#include <defaultnormal_vertex>\n	#endif\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <worldpos_vertex>\n	#include <envmap_vertex>\n	#include <fog_vertex>\n}";
var fragment$a = "uniform vec3 diffuse;\nuniform float opacity;\n#ifndef FLAT_SHADED\n	varying vec3 vNormal;\n#endif\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <specularmap_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	#ifdef USE_LIGHTMAP\n		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );\n		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;\n	#else\n		reflectedLight.indirectDiffuse += vec3( 1.0 );\n	#endif\n	#include <aomap_fragment>\n	reflectedLight.indirectDiffuse *= diffuseColor.rgb;\n	vec3 outgoingLight = reflectedLight.indirectDiffuse;\n	#include <envmap_fragment>\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}";
var vertex$9 = "#define LAMBERT\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vViewPosition = - mvPosition.xyz;\n	#include <worldpos_vertex>\n	#include <envmap_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n}";
var fragment$9 = "#define LAMBERT\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float opacity;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <cube_uv_reflection_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <envmap_physical_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_lambert_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	vec3 totalEmissiveRadiance = emissive;\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <specularmap_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	#include <emissivemap_fragment>\n	#include <lights_lambert_fragment>\n	#include <lights_fragment_begin>\n	#include <lights_fragment_maps>\n	#include <lights_fragment_end>\n	#include <aomap_fragment>\n	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n	#include <envmap_fragment>\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}";
var vertex$8 = "#define MATCAP\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <color_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <fog_vertex>\n	vViewPosition = - mvPosition.xyz;\n}";
var fragment$8 = "#define MATCAP\nuniform vec3 diffuse;\nuniform float opacity;\nuniform sampler2D matcap;\nvarying vec3 vViewPosition;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <fog_pars_fragment>\n#include <normal_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	vec3 viewDir = normalize( vViewPosition );\n	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );\n	vec3 y = cross( viewDir, x );\n	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;\n	#ifdef USE_MATCAP\n		vec4 matcapColor = texture2D( matcap, uv );\n	#else\n		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );\n	#endif\n	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}";
var vertex$7 = "#define NORMAL\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )\n	varying vec3 vViewPosition;\n#endif\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphinstance_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )\n	vViewPosition = - mvPosition.xyz;\n#endif\n}";
var fragment$7 = "#define NORMAL\nuniform float opacity;\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )\n	varying vec3 vViewPosition;\n#endif\n#include <uv_pars_fragment>\n#include <normal_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );\n	#include <clipping_planes_fragment>\n	#include <logdepthbuf_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );\n	#ifdef OPAQUE\n		gl_FragColor.a = 1.0;\n	#endif\n}";
var vertex$6 = "#define PHONG\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphinstance_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vViewPosition = - mvPosition.xyz;\n	#include <worldpos_vertex>\n	#include <envmap_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n}";
var fragment$6 = "#define PHONG\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform vec3 specular;\nuniform float shininess;\nuniform float opacity;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <cube_uv_reflection_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <envmap_physical_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_phong_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	vec3 totalEmissiveRadiance = emissive;\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <specularmap_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	#include <emissivemap_fragment>\n	#include <lights_phong_fragment>\n	#include <lights_fragment_begin>\n	#include <lights_fragment_maps>\n	#include <lights_fragment_end>\n	#include <aomap_fragment>\n	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n	#include <envmap_fragment>\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}";
var vertex$5 = "#define STANDARD\nvarying vec3 vViewPosition;\n#ifdef USE_TRANSMISSION\n	varying vec3 vWorldPosition;\n#endif\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vViewPosition = - mvPosition.xyz;\n	#include <worldpos_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n#ifdef USE_TRANSMISSION\n	vWorldPosition = worldPosition.xyz;\n#endif\n}";
var fragment$5 = "#define STANDARD\n#ifdef PHYSICAL\n	#define IOR\n	#define USE_SPECULAR\n#endif\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float roughness;\nuniform float metalness;\nuniform float opacity;\n#ifdef IOR\n	uniform float ior;\n#endif\n#ifdef USE_SPECULAR\n	uniform float specularIntensity;\n	uniform vec3 specularColor;\n	#ifdef USE_SPECULAR_COLORMAP\n		uniform sampler2D specularColorMap;\n	#endif\n	#ifdef USE_SPECULAR_INTENSITYMAP\n		uniform sampler2D specularIntensityMap;\n	#endif\n#endif\n#ifdef USE_CLEARCOAT\n	uniform float clearcoat;\n	uniform float clearcoatRoughness;\n#endif\n#ifdef USE_DISPERSION\n	uniform float dispersion;\n#endif\n#ifdef USE_RETROREFLECTION\n	uniform float retroreflectivity;\n#endif\n#ifdef USE_IRIDESCENCE\n	uniform float iridescence;\n	uniform float iridescenceIOR;\n	uniform float iridescenceThicknessMinimum;\n	uniform float iridescenceThicknessMaximum;\n#endif\n#ifdef USE_SHEEN\n	uniform vec3 sheenColor;\n	uniform float sheenRoughness;\n	#ifdef USE_SHEEN_COLORMAP\n		uniform sampler2D sheenColorMap;\n	#endif\n	#ifdef USE_SHEEN_ROUGHNESSMAP\n		uniform sampler2D sheenRoughnessMap;\n	#endif\n#endif\n#ifdef USE_ANISOTROPY\n	uniform vec2 anisotropyVector;\n	#ifdef USE_ANISOTROPYMAP\n		uniform sampler2D anisotropyMap;\n	#endif\n#endif\nvarying vec3 vViewPosition;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <iridescence_fragment>\n#include <cube_uv_reflection_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_physical_pars_fragment>\n#include <fog_pars_fragment>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_physical_pars_fragment>\n#include <transmission_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <clearcoat_pars_fragment>\n#include <iridescence_pars_fragment>\n#include <roughnessmap_pars_fragment>\n#include <metalnessmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	vec3 totalEmissiveRadiance = emissive;\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <roughnessmap_fragment>\n	#include <metalnessmap_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	#include <clearcoat_normal_fragment_begin>\n	#include <clearcoat_normal_fragment_maps>\n	#include <emissivemap_fragment>\n	#include <lights_physical_fragment>\n	#include <lights_fragment_begin>\n	#include <lights_fragment_maps>\n	#include <lights_fragment_end>\n	#include <aomap_fragment>\n	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;\n	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;\n	#include <transmission_fragment>\n	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;\n	#ifdef USE_SHEEN\n \n		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;\n \n 	#endif\n	#ifdef USE_CLEARCOAT\n		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );\n		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );\n		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;\n	#endif\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}";
var vertex$4 = "#define TOON\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vViewPosition = - mvPosition.xyz;\n	#include <worldpos_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n}";
var fragment$4 = "#define TOON\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float opacity;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <gradientmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_toon_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	vec3 totalEmissiveRadiance = emissive;\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	#include <emissivemap_fragment>\n	#include <lights_toon_fragment>\n	#include <lights_fragment_begin>\n	#include <lights_fragment_maps>\n	#include <lights_fragment_end>\n	#include <aomap_fragment>\n	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}";
var vertex$3 = "uniform float size;\nuniform float scale;\n#include <common>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n#ifdef USE_POINTS_UV\n	varying vec2 vUv;\n	uniform mat3 uvTransform;\n#endif\nvoid main() {\n	#ifdef USE_POINTS_UV\n		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;\n	#endif\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <project_vertex>\n	gl_PointSize = size;\n	#ifdef USE_SIZEATTENUATION\n		bool isPerspective = isPerspectiveMatrix( projectionMatrix );\n		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );\n	#endif\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <worldpos_vertex>\n	#include <fog_vertex>\n}";
var fragment$3 = "uniform vec3 diffuse;\nuniform float opacity;\n#include <common>\n#include <color_pars_fragment>\n#include <map_particle_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	vec3 outgoingLight = vec3( 0.0 );\n	#include <logdepthbuf_fragment>\n	#include <map_particle_fragment>\n	#include <color_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	outgoingLight = diffuseColor.rgb;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n}";
var vertex$2 = "#include <common>\n#include <batching_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <shadowmap_pars_vertex>\nvoid main() {\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphinstance_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <worldpos_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n}";
var fragment$2 = "uniform vec3 color;\nuniform float opacity;\n#include <common>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <logdepthbuf_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>\nvoid main() {\n	#include <logdepthbuf_fragment>\n	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n}";
var vertex$1 = "uniform float rotation;\nuniform vec2 center;\n#include <common>\n#include <uv_pars_vertex>\n#include <fog_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	vec4 mvPosition = modelViewMatrix[ 3 ];\n	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );\n	#ifndef USE_SIZEATTENUATION\n		bool isPerspective = isPerspectiveMatrix( projectionMatrix );\n		if ( isPerspective ) scale *= - mvPosition.z;\n	#endif\n	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;\n	vec2 rotatedPosition;\n	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;\n	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;\n	mvPosition.xy += rotatedPosition;\n	gl_Position = projectionMatrix * mvPosition;\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <fog_vertex>\n}";
var fragment$1 = "uniform vec3 diffuse;\nuniform float opacity;\n#include <common>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	vec3 outgoingLight = vec3( 0.0 );\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	outgoingLight = diffuseColor.rgb;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n}";
var ShaderChunk = {
  alphahash_fragment,
  alphahash_pars_fragment,
  alphamap_fragment,
  alphamap_pars_fragment,
  alphatest_fragment,
  alphatest_pars_fragment,
  aomap_fragment,
  aomap_pars_fragment,
  batching_pars_vertex,
  batching_vertex,
  begin_vertex,
  beginnormal_vertex,
  bsdfs,
  iridescence_fragment,
  bumpmap_pars_fragment,
  clipping_planes_fragment,
  clipping_planes_pars_fragment,
  clipping_planes_pars_vertex,
  clipping_planes_vertex,
  color_fragment,
  color_pars_fragment,
  color_pars_vertex,
  color_vertex,
  common,
  cube_uv_reflection_fragment,
  defaultnormal_vertex,
  displacementmap_pars_vertex,
  displacementmap_vertex,
  emissivemap_fragment,
  emissivemap_pars_fragment,
  colorspace_fragment,
  colorspace_pars_fragment,
  envmap_fragment,
  envmap_common_pars_fragment,
  envmap_pars_fragment,
  envmap_pars_vertex,
  envmap_physical_pars_fragment,
  envmap_vertex,
  fog_vertex,
  fog_pars_vertex,
  fog_fragment,
  fog_pars_fragment,
  gradientmap_pars_fragment,
  lightmap_pars_fragment,
  lights_lambert_fragment,
  lights_lambert_pars_fragment,
  lights_pars_begin,
  lights_toon_fragment,
  lights_toon_pars_fragment,
  lights_phong_fragment,
  lights_phong_pars_fragment,
  lights_physical_fragment,
  lights_physical_pars_fragment,
  lights_fragment_begin,
  lights_fragment_maps,
  lights_fragment_end,
  lightprobes_pars_fragment,
  logdepthbuf_fragment,
  logdepthbuf_pars_fragment,
  logdepthbuf_pars_vertex,
  logdepthbuf_vertex,
  map_fragment,
  map_pars_fragment,
  map_particle_fragment,
  map_particle_pars_fragment,
  metalnessmap_fragment,
  metalnessmap_pars_fragment,
  morphinstance_vertex,
  morphcolor_vertex,
  morphnormal_vertex,
  morphtarget_pars_vertex,
  morphtarget_vertex,
  normal_fragment_begin,
  normal_fragment_maps,
  normal_pars_fragment,
  normal_pars_vertex,
  normal_vertex,
  normalmap_pars_fragment,
  clearcoat_normal_fragment_begin,
  clearcoat_normal_fragment_maps,
  clearcoat_pars_fragment,
  iridescence_pars_fragment,
  opaque_fragment,
  packing,
  premultiplied_alpha_fragment,
  project_vertex,
  dithering_fragment,
  dithering_pars_fragment,
  roughnessmap_fragment,
  roughnessmap_pars_fragment,
  shadowmap_pars_fragment,
  shadowmap_pars_vertex,
  shadowmap_vertex,
  shadowmask_pars_fragment,
  skinbase_vertex,
  skinning_pars_vertex,
  skinning_vertex,
  skinnormal_vertex,
  specularmap_fragment,
  specularmap_pars_fragment,
  tonemapping_fragment,
  tonemapping_pars_fragment,
  transmission_fragment,
  transmission_pars_fragment,
  uv_pars_fragment,
  uv_pars_vertex,
  uv_vertex,
  worldpos_vertex,
  background_vert: vertex$h,
  background_frag: fragment$h,
  backgroundCube_vert: vertex$g,
  backgroundCube_frag: fragment$g,
  cube_vert: vertex$f,
  cube_frag: fragment$f,
  depth_vert: vertex$e,
  depth_frag: fragment$e,
  distance_vert: vertex$d,
  distance_frag: fragment$d,
  equirect_vert: vertex$c,
  equirect_frag: fragment$c,
  linedashed_vert: vertex$b,
  linedashed_frag: fragment$b,
  meshbasic_vert: vertex$a,
  meshbasic_frag: fragment$a,
  meshlambert_vert: vertex$9,
  meshlambert_frag: fragment$9,
  meshmatcap_vert: vertex$8,
  meshmatcap_frag: fragment$8,
  meshnormal_vert: vertex$7,
  meshnormal_frag: fragment$7,
  meshphong_vert: vertex$6,
  meshphong_frag: fragment$6,
  meshphysical_vert: vertex$5,
  meshphysical_frag: fragment$5,
  meshtoon_vert: vertex$4,
  meshtoon_frag: fragment$4,
  points_vert: vertex$3,
  points_frag: fragment$3,
  shadow_vert: vertex$2,
  shadow_frag: fragment$2,
  sprite_vert: vertex$1,
  sprite_frag: fragment$1
};
var UniformsLib = {
  common: {
    diffuse: { value: /* @__PURE__ */ new Color(16777215) },
    opacity: { value: 1 },
    map: { value: null },
    mapTransform: { value: /* @__PURE__ */ new Matrix3() },
    alphaMap: { value: null },
    alphaMapTransform: { value: /* @__PURE__ */ new Matrix3() },
    alphaTest: { value: 0 }
  },
  specularmap: {
    specularMap: { value: null },
    specularMapTransform: { value: /* @__PURE__ */ new Matrix3() }
  },
  envmap: {
    envMap: { value: null },
    envMapRotation: { value: /* @__PURE__ */ new Matrix3() },
    reflectivity: { value: 1 },
    // basic, lambert, phong
    ior: { value: 1.5 },
    // physical
    refractionRatio: { value: 0.98 },
    // basic, lambert, phong
    dfgLUT: { value: null }
    // DFG LUT for physically-based rendering
  },
  aomap: {
    aoMap: { value: null },
    aoMapIntensity: { value: 1 },
    aoMapTransform: { value: /* @__PURE__ */ new Matrix3() }
  },
  lightmap: {
    lightMap: { value: null },
    lightMapIntensity: { value: 1 },
    lightMapTransform: { value: /* @__PURE__ */ new Matrix3() }
  },
  bumpmap: {
    bumpMap: { value: null },
    bumpMapTransform: { value: /* @__PURE__ */ new Matrix3() },
    bumpScale: { value: 1 }
  },
  normalmap: {
    normalMap: { value: null },
    normalMapTransform: { value: /* @__PURE__ */ new Matrix3() },
    normalScale: { value: /* @__PURE__ */ new Vector2(1, 1) }
  },
  displacementmap: {
    displacementMap: { value: null },
    displacementMapTransform: { value: /* @__PURE__ */ new Matrix3() },
    displacementScale: { value: 1 },
    displacementBias: { value: 0 }
  },
  emissivemap: {
    emissiveMap: { value: null },
    emissiveMapTransform: { value: /* @__PURE__ */ new Matrix3() }
  },
  metalnessmap: {
    metalnessMap: { value: null },
    metalnessMapTransform: { value: /* @__PURE__ */ new Matrix3() }
  },
  roughnessmap: {
    roughnessMap: { value: null },
    roughnessMapTransform: { value: /* @__PURE__ */ new Matrix3() }
  },
  gradientmap: {
    gradientMap: { value: null }
  },
  fog: {
    fogDensity: { value: 25e-5 },
    fogNear: { value: 1 },
    fogFar: { value: 2e3 },
    fogColor: { value: /* @__PURE__ */ new Color(16777215) }
  },
  lights: {
    ambientLightColor: { value: [] },
    lightProbe: { value: [] },
    sunLights: { value: [], properties: {
      direction: {},
      color: {}
    } },
    sunLightShadows: { value: [], properties: {
      shadowIntensity: 1,
      shadowBias: {},
      shadowNormalBias: {},
      shadowRadius: {},
      shadowMapSize: {}
    } },
    sunShadowMatrix: { value: [] },
    sunShadowCascade: { value: [] },
    directionalLights: { value: [], properties: {
      direction: {},
      color: {}
    } },
    directionalLightShadows: { value: [], properties: {
      shadowIntensity: 1,
      shadowBias: {},
      shadowNormalBias: {},
      shadowRadius: {},
      shadowMapSize: {}
    } },
    directionalShadowMatrix: { value: [] },
    spotLights: { value: [], properties: {
      color: {},
      position: {},
      direction: {},
      distance: {},
      coneCos: {},
      penumbraCos: {},
      decay: {}
    } },
    spotLightShadows: { value: [], properties: {
      shadowIntensity: 1,
      shadowBias: {},
      shadowNormalBias: {},
      shadowRadius: {},
      shadowMapSize: {}
    } },
    spotLightMap: { value: [] },
    spotLightMatrix: { value: [] },
    pointLights: { value: [], properties: {
      color: {},
      position: {},
      decay: {},
      distance: {}
    } },
    pointLightShadows: { value: [], properties: {
      shadowIntensity: 1,
      shadowBias: {},
      shadowNormalBias: {},
      shadowRadius: {},
      shadowMapSize: {},
      shadowCameraNear: {},
      shadowCameraFar: {}
    } },
    pointShadowMatrix: { value: [] },
    hemisphereLights: { value: [], properties: {
      direction: {},
      skyColor: {},
      groundColor: {}
    } },
    // TODO (abelnation): RectAreaLight BRDF data needs to be moved from example to main src
    rectAreaLights: { value: [], properties: {
      color: {},
      position: {},
      width: {},
      height: {}
    } },
    ltc_1: { value: null },
    ltc_2: { value: null },
    probesSH: { value: null },
    probesMin: { value: /* @__PURE__ */ new Vector3() },
    probesMax: { value: /* @__PURE__ */ new Vector3() },
    probesResolution: { value: /* @__PURE__ */ new Vector3() }
  },
  points: {
    diffuse: { value: /* @__PURE__ */ new Color(16777215) },
    opacity: { value: 1 },
    size: { value: 1 },
    scale: { value: 1 },
    map: { value: null },
    alphaMap: { value: null },
    alphaMapTransform: { value: /* @__PURE__ */ new Matrix3() },
    alphaTest: { value: 0 },
    uvTransform: { value: /* @__PURE__ */ new Matrix3() }
  },
  sprite: {
    diffuse: { value: /* @__PURE__ */ new Color(16777215) },
    opacity: { value: 1 },
    center: { value: /* @__PURE__ */ new Vector2(0.5, 0.5) },
    rotation: { value: 0 },
    map: { value: null },
    mapTransform: { value: /* @__PURE__ */ new Matrix3() },
    alphaMap: { value: null },
    alphaMapTransform: { value: /* @__PURE__ */ new Matrix3() },
    alphaTest: { value: 0 }
  }
};
var ShaderLib = {
  basic: {
    uniforms: /* @__PURE__ */ mergeUniforms([
      UniformsLib.common,
      UniformsLib.specularmap,
      UniformsLib.envmap,
      UniformsLib.aomap,
      UniformsLib.lightmap,
      UniformsLib.fog
    ]),
    vertexShader: ShaderChunk.meshbasic_vert,
    fragmentShader: ShaderChunk.meshbasic_frag
  },
  lambert: {
    uniforms: /* @__PURE__ */ mergeUniforms([
      UniformsLib.common,
      UniformsLib.specularmap,
      UniformsLib.envmap,
      UniformsLib.aomap,
      UniformsLib.lightmap,
      UniformsLib.emissivemap,
      UniformsLib.bumpmap,
      UniformsLib.normalmap,
      UniformsLib.displacementmap,
      UniformsLib.fog,
      UniformsLib.lights,
      {
        emissive: { value: /* @__PURE__ */ new Color(0) },
        envMapIntensity: { value: 1 }
      }
    ]),
    vertexShader: ShaderChunk.meshlambert_vert,
    fragmentShader: ShaderChunk.meshlambert_frag
  },
  phong: {
    uniforms: /* @__PURE__ */ mergeUniforms([
      UniformsLib.common,
      UniformsLib.specularmap,
      UniformsLib.envmap,
      UniformsLib.aomap,
      UniformsLib.lightmap,
      UniformsLib.emissivemap,
      UniformsLib.bumpmap,
      UniformsLib.normalmap,
      UniformsLib.displacementmap,
      UniformsLib.fog,
      UniformsLib.lights,
      {
        emissive: { value: /* @__PURE__ */ new Color(0) },
        specular: { value: /* @__PURE__ */ new Color(1118481) },
        shininess: { value: 30 },
        envMapIntensity: { value: 1 }
      }
    ]),
    vertexShader: ShaderChunk.meshphong_vert,
    fragmentShader: ShaderChunk.meshphong_frag
  },
  standard: {
    uniforms: /* @__PURE__ */ mergeUniforms([
      UniformsLib.common,
      UniformsLib.envmap,
      UniformsLib.aomap,
      UniformsLib.lightmap,
      UniformsLib.emissivemap,
      UniformsLib.bumpmap,
      UniformsLib.normalmap,
      UniformsLib.displacementmap,
      UniformsLib.roughnessmap,
      UniformsLib.metalnessmap,
      UniformsLib.fog,
      UniformsLib.lights,
      {
        emissive: { value: /* @__PURE__ */ new Color(0) },
        roughness: { value: 1 },
        metalness: { value: 0 },
        envMapIntensity: { value: 1 }
      }
    ]),
    vertexShader: ShaderChunk.meshphysical_vert,
    fragmentShader: ShaderChunk.meshphysical_frag
  },
  toon: {
    uniforms: /* @__PURE__ */ mergeUniforms([
      UniformsLib.common,
      UniformsLib.aomap,
      UniformsLib.lightmap,
      UniformsLib.emissivemap,
      UniformsLib.bumpmap,
      UniformsLib.normalmap,
      UniformsLib.displacementmap,
      UniformsLib.gradientmap,
      UniformsLib.fog,
      UniformsLib.lights,
      {
        emissive: { value: /* @__PURE__ */ new Color(0) }
      }
    ]),
    vertexShader: ShaderChunk.meshtoon_vert,
    fragmentShader: ShaderChunk.meshtoon_frag
  },
  matcap: {
    uniforms: /* @__PURE__ */ mergeUniforms([
      UniformsLib.common,
      UniformsLib.bumpmap,
      UniformsLib.normalmap,
      UniformsLib.displacementmap,
      UniformsLib.fog,
      {
        matcap: { value: null }
      }
    ]),
    vertexShader: ShaderChunk.meshmatcap_vert,
    fragmentShader: ShaderChunk.meshmatcap_frag
  },
  points: {
    uniforms: /* @__PURE__ */ mergeUniforms([
      UniformsLib.points,
      UniformsLib.fog
    ]),
    vertexShader: ShaderChunk.points_vert,
    fragmentShader: ShaderChunk.points_frag
  },
  dashed: {
    uniforms: /* @__PURE__ */ mergeUniforms([
      UniformsLib.common,
      UniformsLib.fog,
      {
        scale: { value: 1 },
        dashSize: { value: 1 },
        totalSize: { value: 2 }
      }
    ]),
    vertexShader: ShaderChunk.linedashed_vert,
    fragmentShader: ShaderChunk.linedashed_frag
  },
  depth: {
    uniforms: /* @__PURE__ */ mergeUniforms([
      UniformsLib.common,
      UniformsLib.displacementmap
    ]),
    vertexShader: ShaderChunk.depth_vert,
    fragmentShader: ShaderChunk.depth_frag
  },
  normal: {
    uniforms: /* @__PURE__ */ mergeUniforms([
      UniformsLib.common,
      UniformsLib.bumpmap,
      UniformsLib.normalmap,
      UniformsLib.displacementmap,
      {
        opacity: { value: 1 }
      }
    ]),
    vertexShader: ShaderChunk.meshnormal_vert,
    fragmentShader: ShaderChunk.meshnormal_frag
  },
  sprite: {
    uniforms: /* @__PURE__ */ mergeUniforms([
      UniformsLib.sprite,
      UniformsLib.fog
    ]),
    vertexShader: ShaderChunk.sprite_vert,
    fragmentShader: ShaderChunk.sprite_frag
  },
  background: {
    uniforms: {
      uvTransform: { value: /* @__PURE__ */ new Matrix3() },
      t2D: { value: null },
      backgroundIntensity: { value: 1 }
    },
    vertexShader: ShaderChunk.background_vert,
    fragmentShader: ShaderChunk.background_frag
  },
  backgroundCube: {
    uniforms: {
      envMap: { value: null },
      backgroundBlurriness: { value: 0 },
      backgroundIntensity: { value: 1 },
      backgroundRotation: { value: /* @__PURE__ */ new Matrix3() }
    },
    vertexShader: ShaderChunk.backgroundCube_vert,
    fragmentShader: ShaderChunk.backgroundCube_frag
  },
  cube: {
    uniforms: {
      tCube: { value: null },
      tFlip: { value: -1 },
      opacity: { value: 1 }
    },
    vertexShader: ShaderChunk.cube_vert,
    fragmentShader: ShaderChunk.cube_frag
  },
  equirect: {
    uniforms: {
      tEquirect: { value: null }
    },
    vertexShader: ShaderChunk.equirect_vert,
    fragmentShader: ShaderChunk.equirect_frag
  },
  distance: {
    uniforms: /* @__PURE__ */ mergeUniforms([
      UniformsLib.common,
      UniformsLib.displacementmap,
      {
        referencePosition: { value: /* @__PURE__ */ new Vector3() },
        nearDistance: { value: 1 },
        farDistance: { value: 1e3 }
      }
    ]),
    vertexShader: ShaderChunk.distance_vert,
    fragmentShader: ShaderChunk.distance_frag
  },
  shadow: {
    uniforms: /* @__PURE__ */ mergeUniforms([
      UniformsLib.lights,
      UniformsLib.fog,
      {
        color: { value: /* @__PURE__ */ new Color(0) },
        opacity: { value: 1 }
      }
    ]),
    vertexShader: ShaderChunk.shadow_vert,
    fragmentShader: ShaderChunk.shadow_frag
  }
};
ShaderLib.physical = {
  uniforms: /* @__PURE__ */ mergeUniforms([
    ShaderLib.standard.uniforms,
    {
      clearcoat: { value: 0 },
      clearcoatMap: { value: null },
      clearcoatMapTransform: { value: /* @__PURE__ */ new Matrix3() },
      clearcoatNormalMap: { value: null },
      clearcoatNormalMapTransform: { value: /* @__PURE__ */ new Matrix3() },
      clearcoatNormalScale: { value: /* @__PURE__ */ new Vector2(1, 1) },
      clearcoatRoughness: { value: 0 },
      clearcoatRoughnessMap: { value: null },
      clearcoatRoughnessMapTransform: { value: /* @__PURE__ */ new Matrix3() },
      dispersion: { value: 0 },
      retroreflectivity: { value: 0 },
      iridescence: { value: 0 },
      iridescenceMap: { value: null },
      iridescenceMapTransform: { value: /* @__PURE__ */ new Matrix3() },
      iridescenceIOR: { value: 1.3 },
      iridescenceThicknessMinimum: { value: 100 },
      iridescenceThicknessMaximum: { value: 400 },
      iridescenceThicknessMap: { value: null },
      iridescenceThicknessMapTransform: { value: /* @__PURE__ */ new Matrix3() },
      sheen: { value: 0 },
      sheenColor: { value: /* @__PURE__ */ new Color(0) },
      sheenColorMap: { value: null },
      sheenColorMapTransform: { value: /* @__PURE__ */ new Matrix3() },
      sheenRoughness: { value: 1 },
      sheenRoughnessMap: { value: null },
      sheenRoughnessMapTransform: { value: /* @__PURE__ */ new Matrix3() },
      transmission: { value: 0 },
      transmissionMap: { value: null },
      transmissionMapTransform: { value: /* @__PURE__ */ new Matrix3() },
      transmissionSamplerSize: { value: /* @__PURE__ */ new Vector2() },
      transmissionSamplerMap: { value: null },
      thickness: { value: 0 },
      thicknessMap: { value: null },
      thicknessMapTransform: { value: /* @__PURE__ */ new Matrix3() },
      attenuationDistance: { value: 0 },
      attenuationColor: { value: /* @__PURE__ */ new Color(0) },
      specularColor: { value: /* @__PURE__ */ new Color(1, 1, 1) },
      specularColorMap: { value: null },
      specularColorMapTransform: { value: /* @__PURE__ */ new Matrix3() },
      specularIntensity: { value: 1 },
      specularIntensityMap: { value: null },
      specularIntensityMapTransform: { value: /* @__PURE__ */ new Matrix3() },
      anisotropyVector: { value: /* @__PURE__ */ new Vector2() },
      anisotropyMap: { value: null },
      anisotropyMapTransform: { value: /* @__PURE__ */ new Matrix3() }
    }
  ]),
  vertexShader: ShaderChunk.meshphysical_vert,
  fragmentShader: ShaderChunk.meshphysical_frag
};
var _m$1 = /* @__PURE__ */ new Matrix3();
_m$1.set(-1, 0, 0, 0, 1, 0, 0, 0, 1);
var toneMappingMap = {
  [LinearToneMapping]: "LINEAR_TONE_MAPPING",
  [ReinhardToneMapping]: "REINHARD_TONE_MAPPING",
  [CineonToneMapping]: "CINEON_TONE_MAPPING",
  [ACESFilmicToneMapping]: "ACES_FILMIC_TONE_MAPPING",
  [AgXToneMapping]: "AGX_TONE_MAPPING",
  [NeutralToneMapping]: "NEUTRAL_TONE_MAPPING",
  [CustomToneMapping]: "CUSTOM_TONE_MAPPING"
};
var mat4array = new Float32Array(16);
var mat3array = new Float32Array(9);
var mat2array = new Float32Array(4);
var toneMappingFunctions = {
  [LinearToneMapping]: "Linear",
  [ReinhardToneMapping]: "Reinhard",
  [CineonToneMapping]: "Cineon",
  [ACESFilmicToneMapping]: "ACESFilmic",
  [AgXToneMapping]: "AgX",
  [NeutralToneMapping]: "Neutral",
  [CustomToneMapping]: "Custom"
};
var shadowMapTypeDefines = {
  [PCFShadowMap]: "SHADOWMAP_TYPE_PCF",
  [VSMShadowMap]: "SHADOWMAP_TYPE_VSM"
};
var envMapTypeDefines = {
  [CubeReflectionMapping]: "ENVMAP_TYPE_CUBE",
  [CubeRefractionMapping]: "ENVMAP_TYPE_CUBE",
  [CubeUVReflectionMapping]: "ENVMAP_TYPE_CUBE_UV"
};
var envMapModeDefines = {
  [CubeRefractionMapping]: "ENVMAP_MODE_REFRACTION"
};
var envMapBlendingDefines = {
  [MultiplyOperation]: "ENVMAP_BLENDING_MULTIPLY",
  [MixOperation]: "ENVMAP_BLENDING_MIX",
  [AddOperation]: "ENVMAP_BLENDING_ADD"
};
var _m = /* @__PURE__ */ new Matrix3();
_m.set(-1, 0, 0, 0, 1, 0, 0, 0, 1);
var DATA = new Uint16Array([
  12469,
  15057,
  12620,
  14925,
  13266,
  14620,
  13807,
  14376,
  14323,
  13990,
  14545,
  13625,
  14713,
  13328,
  14840,
  12882,
  14931,
  12528,
  14996,
  12233,
  15039,
  11829,
  15066,
  11525,
  15080,
  11295,
  15085,
  10976,
  15082,
  10705,
  15073,
  10495,
  13880,
  14564,
  13898,
  14542,
  13977,
  14430,
  14158,
  14124,
  14393,
  13732,
  14556,
  13410,
  14702,
  12996,
  14814,
  12596,
  14891,
  12291,
  14937,
  11834,
  14957,
  11489,
  14958,
  11194,
  14943,
  10803,
  14921,
  10506,
  14893,
  10278,
  14858,
  9960,
  14484,
  14039,
  14487,
  14025,
  14499,
  13941,
  14524,
  13740,
  14574,
  13468,
  14654,
  13106,
  14743,
  12678,
  14818,
  12344,
  14867,
  11893,
  14889,
  11509,
  14893,
  11180,
  14881,
  10751,
  14852,
  10428,
  14812,
  10128,
  14765,
  9754,
  14712,
  9466,
  14764,
  13480,
  14764,
  13475,
  14766,
  13440,
  14766,
  13347,
  14769,
  13070,
  14786,
  12713,
  14816,
  12387,
  14844,
  11957,
  14860,
  11549,
  14868,
  11215,
  14855,
  10751,
  14825,
  10403,
  14782,
  10044,
  14729,
  9651,
  14666,
  9352,
  14599,
  9029,
  14967,
  12835,
  14966,
  12831,
  14963,
  12804,
  14954,
  12723,
  14936,
  12564,
  14917,
  12347,
  14900,
  11958,
  14886,
  11569,
  14878,
  11247,
  14859,
  10765,
  14828,
  10401,
  14784,
  10011,
  14727,
  9600,
  14660,
  9289,
  14586,
  8893,
  14508,
  8533,
  15111,
  12234,
  15110,
  12234,
  15104,
  12216,
  15092,
  12156,
  15067,
  12010,
  15028,
  11776,
  14981,
  11500,
  14942,
  11205,
  14902,
  10752,
  14861,
  10393,
  14812,
  9991,
  14752,
  9570,
  14682,
  9252,
  14603,
  8808,
  14519,
  8445,
  14431,
  8145,
  15209,
  11449,
  15208,
  11451,
  15202,
  11451,
  15190,
  11438,
  15163,
  11384,
  15117,
  11274,
  15055,
  10979,
  14994,
  10648,
  14932,
  10343,
  14871,
  9936,
  14803,
  9532,
  14729,
  9218,
  14645,
  8742,
  14556,
  8381,
  14461,
  8020,
  14365,
  7603,
  15273,
  10603,
  15272,
  10607,
  15267,
  10619,
  15256,
  10631,
  15231,
  10614,
  15182,
  10535,
  15118,
  10389,
  15042,
  10167,
  14963,
  9787,
  14883,
  9447,
  14800,
  9115,
  14710,
  8665,
  14615,
  8318,
  14514,
  7911,
  14411,
  7507,
  14279,
  7198,
  15314,
  9675,
  15313,
  9683,
  15309,
  9712,
  15298,
  9759,
  15277,
  9797,
  15229,
  9773,
  15166,
  9668,
  15084,
  9487,
  14995,
  9274,
  14898,
  8910,
  14800,
  8539,
  14697,
  8234,
  14590,
  7790,
  14479,
  7409,
  14367,
  7067,
  14178,
  6621,
  15337,
  8619,
  15337,
  8631,
  15333,
  8677,
  15325,
  8769,
  15305,
  8871,
  15264,
  8940,
  15202,
  8909,
  15119,
  8775,
  15022,
  8565,
  14916,
  8328,
  14804,
  8009,
  14688,
  7614,
  14569,
  7287,
  14448,
  6888,
  14321,
  6483,
  14088,
  6171,
  15350,
  7402,
  15350,
  7419,
  15347,
  7480,
  15340,
  7613,
  15322,
  7804,
  15287,
  7973,
  15229,
  8057,
  15148,
  8012,
  15046,
  7846,
  14933,
  7611,
  14810,
  7357,
  14682,
  7069,
  14552,
  6656,
  14421,
  6316,
  14251,
  5948,
  14007,
  5528,
  15356,
  5942,
  15356,
  5977,
  15353,
  6119,
  15348,
  6294,
  15332,
  6551,
  15302,
  6824,
  15249,
  7044,
  15171,
  7122,
  15070,
  7050,
  14949,
  6861,
  14818,
  6611,
  14679,
  6349,
  14538,
  6067,
  14398,
  5651,
  14189,
  5311,
  13935,
  4958,
  15359,
  4123,
  15359,
  4153,
  15356,
  4296,
  15353,
  4646,
  15338,
  5160,
  15311,
  5508,
  15263,
  5829,
  15188,
  6042,
  15088,
  6094,
  14966,
  6001,
  14826,
  5796,
  14678,
  5543,
  14527,
  5287,
  14377,
  4985,
  14133,
  4586,
  13869,
  4257,
  15360,
  1563,
  15360,
  1642,
  15358,
  2076,
  15354,
  2636,
  15341,
  3350,
  15317,
  4019,
  15273,
  4429,
  15203,
  4732,
  15105,
  4911,
  14981,
  4932,
  14836,
  4818,
  14679,
  4621,
  14517,
  4386,
  14359,
  4156,
  14083,
  3795,
  13808,
  3437,
  15360,
  122,
  15360,
  137,
  15358,
  285,
  15355,
  636,
  15344,
  1274,
  15322,
  2177,
  15281,
  2765,
  15215,
  3223,
  15120,
  3451,
  14995,
  3569,
  14846,
  3567,
  14681,
  3466,
  14511,
  3305,
  14344,
  3121,
  14037,
  2800,
  13753,
  2467,
  15360,
  0,
  15360,
  1,
  15359,
  21,
  15355,
  89,
  15346,
  253,
  15325,
  479,
  15287,
  796,
  15225,
  1148,
  15133,
  1492,
  15008,
  1749,
  14856,
  1882,
  14685,
  1886,
  14506,
  1783,
  14324,
  1608,
  13996,
  1398,
  13702,
  1183
]);

// src/nomads.js
var PLAN2 = null;
var DBG = {};
var no = (k) => {
  DBG[k] = (DBG[k] || 0) + 1;
  return false;
};
var seg2 = (px, pz, a, b) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2));
  return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
};
function planNomads(roads) {
  if (PLAN2) return PLAN2;
  PLAN2 = [];
  if (!TOWN || !roads || !PASTURE || PASTURE.r <= 0) return PLAN2;
  const r = rng(51877);
  const zones = [PASTURE, CAMP, MUSTER, LAIR].filter((z) => z && z.r > 0);
  const flat = (x, z, rad) => {
    let lo = 1e9, hi = -1e9;
    for (const [dx, dz] of [[0, 0], [rad, 0], [-rad, 0], [0, rad], [0, -rad], [rad * 0.7, rad * 0.7], [-rad * 0.7, -rad * 0.7], [rad * 0.7, -rad * 0.7], [-rad * 0.7, rad * 0.7]]) {
      const h = height(x + dx, z + dz);
      lo = Math.min(lo, h);
      hi = Math.max(hi, h);
    }
    return { lo, hi };
  };
  const roadD = (x, z) => {
    let d = 1e9;
    for (const R of roads) for (let i = 0; i < R.pts.length - 1; i++) d = Math.min(d, seg2(x, z, R.pts[i], R.pts[i + 1]) - R.w / 2);
    return d;
  };
  const free = (x, z) => {
    if (sdTown(x, z) < 52) return no("town");
    if (fieldD(x, z) < 1.9) return no("field");
    for (const Z of zones) if (Math.hypot(x - Z.x, z - Z.z) < (Z.fr ?? Z.r) + 26) return no("zone");
    if (Math.hypot(x - WINDMILL.x, z - WINDMILL.z) < 46) return no("mill");
    if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 26) return no("lake");
    if (distPolyline(RIVER, x, z) < 24) return no("river");
    if (nearMine(x, z, 62)) return no("mine");
    for (const H of hamlets()) if (Math.hypot(x - H.x, z - H.z) < 52) return no("hamlet");
    return true;
  };
  const want = 4 + (r() * 3 | 0);
  for (let k = 0; k < 14e3 && PLAN2.length < want; k++) {
    const a = r() * Math.PI * 2, d0 = 172 + r() * 215, x = Math.cos(a) * d0, z = Math.sin(a) * d0;
    if (!free(x, z)) continue;
    if (PLAN2.some((C3) => Math.hypot(C3.x - x, C3.z - z) < 72)) {
      no("camp");
      continue;
    }
    const f = flat(x, z, 15);
    if (f.lo < 1.3 || f.hi > 30 || f.hi - f.lo > 3.2) {
      no("flat");
      continue;
    }
    const rd = roadD(x, z);
    if (rd < 20 || rd > 140) {
      no(rd < 20 ? "road<" : "road>");
      continue;
    }
    const n2 = 3 + (r() * 4 | 0), C2 = { x, z, r: 15, tents: [], rugs: [], props: [] };
    const a0 = r() * 6.28, span = n2 <= 4 ? Math.PI * 1.55 : Math.PI * 1.8;
    for (let i = 0; i < n2; i++) {
      const aa = a0 + (i + 0.5) * span / n2 + (r() - 0.5) * 0.18, rr = 8.4 + n2 * 0.5 + r() * 1.3, tx = x + Math.cos(aa) * rr, tz = z + Math.sin(aa) * rr;
      const g = flat(tx, tz, 4);
      if (g.lo < 0.9 || g.hi - g.lo > 1.9) continue;
      if (roadD(tx, tz) < 6) continue;
      C2.tents.push({ x: tx, z: tz, ry: Math.atan2(x - tx, z - tz), w: 6.2 + r() * 1.3, d: 3.7 + r() * 0.5, h: 2.55 + r() * 0.35, tone: r() });
    }
    if (C2.tents.length < 3) {
      no("tents");
      continue;
    }
    const big = C2.tents.reduce((m, t) => t.w > m.w ? t : m, C2.tents[0]), cs = Math.cos(big.ry), sn = Math.sin(big.ry);
    C2.rugs.push({ x: big.x + sn * (big.d / 2 + 1.9), z: big.z + cs * (big.d / 2 + 1.9), ry: big.ry, w: 3, d: 1.9 });
    for (const t of C2.tents) {
      if (t === big || r() < 0.4) continue;
      const c = Math.cos(t.ry), s = Math.sin(t.ry), lx = (r() < 0.5 ? -1 : 1) * (t.w / 2 + 0.9);
      C2.props.push({ k: r() < 0.5 ? "barrel" : "crate", x: t.x + c * lx + s * (t.d / 2 + 0.5), z: t.z - s * lx + c * (t.d / 2 + 0.5), ry: r() * 6.28, s: 1.2 });
    }
    PLAN2.push(C2);
  }
  return PLAN2;
}
var nomads = () => PLAN2 || [];
var col = (hex) => new Color(hex);
var PAL = {
  cloth: [col("#34496b"), col("#2c3f5e"), col("#3b5075")],
  seam: col("#a9bfd9"),
  hem: col("#7f9dc4"),
  pole: col("#6b5640"),
  reed: [col("#c7b27c"), col("#ae9a66")],
  stone: col("#8b95a3"),
  ash: col("#2a2a2e"),
  rug: [col("#8a3340"), col("#27498a"), col("#e0d2a6"), col("#9db6d4")]
};

// src/c1_kinds.js
var DEG2 = Math.PI / 180;
var KINDS = {
  fishery: { fa: "\u0645\u0627\u0647\u06CC\u06AF\u06CC\u0631\u06CC", unlock: 6, paint: "134,120,90", place: "water", role: "S", in: ["water"], out: ["fish"] },
  // exists (lake + river); C1 only adds nets + a cleaning table
  panning: { fa: "\u0637\u0644\u0627\u0634\u0648\u06CC\u06CC \u0631\u0648\u062F", unlock: 12, paint: "120,112,92", place: "water", role: "S", in: ["river"], out: ["gold_dust"] },
  // (ph) unlock 12
  smokehouse: { fa: "\u062F\u0648\u062F\u062E\u0627\u0646\u0647\u200C\u06CC \u0645\u0627\u0647\u06CC", unlock: 8, paint: "104,86,70", place: "water", role: "P", in: ["fish"], out: ["dried_fish"], inTown: true }
  // (ph) unlock 8
};
var SOLID = { c1_house: 4.4 };

// src/c2_kinds.js
var KINDS2 = {
  // the three that exist already: only the economy fields are added (their unlock / paint stay those of worksites.js)
  lumber: { fa: "\u0686\u0648\u0628\u200C\u0628\u0631\u06CC", unlock: 1, paint: "124,100,64", place: "forest", role: "S", in: "trees", out: "wood" },
  quarry: { fa: "\u0645\u0639\u062F\u0646 \u0633\u0646\u06AF", unlock: 2, paint: "132,128,120", place: "mount", role: "S", in: "rock", out: "stone" },
  iron: { fa: "\u0645\u0639\u062F\u0646 \u0622\u0647\u0646", unlock: 8, paint: "92,86,82", place: "mount", role: "S", in: "ore", out: "ironore" },
  // NEW — processing buildings inside the town (movable by the player later; front side = local +z, footprint radius r <= 18 m)
  sawmill: { fa: "\u0627\u0631\u0647\u200C\u06A9\u0634\u06CC", unlock: 4, paint: "150,112,70", place: "free", role: "P", in: "wood", out: "planks", inTown: true, r: 17 },
  masonry: { fa: "\u0633\u0646\u06AF\u200C\u062A\u0631\u0627\u0634\u06CC", unlock: 5, paint: "150,154,160", place: "free", role: "P", in: "stone", out: "cutstone", inTown: true, r: 17 },
  smelter: { fa: "\u06A9\u0648\u0631\u0647\u200C\u06CC \u0630\u0648\u0628", unlock: 9, paint: "140,76,60", place: "free", role: "P", in: "ironore", out: "ironbars", inTown: true, r: 17 }
};
var N2 = (lv2, a, b) => Math.round(a + (b - a) * (Math.max(1, lv2) - 1) / 29);
var tierOf2 = (lv2) => lv2 <= 0 ? 0 : 1 + Math.min(4, Math.floor((lv2 - 1) / 6));
var kS = (lv2, a = 0.8) => a + (1 - a) * (Math.max(1, lv2) - 1) / 29;
var P = (n2, x, z, ry = 0, s = 1) => ({ n: n2, x, z, ry, s });
function row(out, name, n2, x0, z0, x1, z1, ry = 0, s = 1, R = null, jit = 0) {
  for (let i = 0; i < n2; i++) {
    const t = n2 === 1 ? 0.5 : i / (n2 - 1);
    out.push(P(name, x0 + (x1 - x0) * t + (R ? (R() - 0.5) * jit : 0), z0 + (z1 - z0) * t + (R ? (R() - 0.5) * jit : 0), ry + (R ? (R() - 0.5) * jit * 0.2 : 0), s));
  }
}
function block(out, name, n2, x0, z0, cols, dx, dz, ry = 0, s = 1) {
  for (let i = 0; i < n2; i++) out.push(P(name, x0 + i % cols * dx, z0 + Math.floor(i / cols) * dz, ry, s));
}
function scatter(out, name, n2, R, r0, r1, a0, a1, gap = 2, s0 = 1, s1 = 1, avoid = []) {
  const got = [];
  for (let k = 0; k < n2 * 14 && got.length < n2; k++) {
    const rr = r0 + (r1 - r0) * Math.sqrt(R()), a = a0 + (a1 - a0) * R(), x = Math.sin(a) * rr, z = Math.cos(a) * rr;
    if (got.some((q) => Math.hypot(q[0] - x, q[1] - z) < gap) || avoid.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2])) continue;
    got.push([x, z]);
    out.push(P(name, x, z, R() * 6.283, s0 + (s1 - s0) * R()));
  }
}
var DEG3 = Math.PI / 180;
var HP = Math.PI / 2;
function counts(kind, lv2) {
  if (kind && kind.kind) kind = kind.kind;
  if (lv2 <= 0) return {};
  switch (kind) {
    case "sawmill":
      return { workers: N2(lv2, 2, 12), carts: N2(lv2, 1, 3), frames: N2(lv2, 1, 3), stacks: N2(lv2, 1, 8), logs: N2(lv2, 2, 8), trestles: N2(lv2, 1, 3) };
    case "masonry":
      return { workers: N2(lv2, 2, 12), carts: N2(lv2, 1, 3), tables: N2(lv2, 1, 4), stacks: N2(lv2, 1, 8), rough: N2(lv2, 2, 8), arches: lv2 >= 20 ? 2 : lv2 >= 6 ? 1 : 0 };
    case "smelter":
      return { workers: N2(lv2, 2, 10), carts: N2(lv2, 1, 3), furnaces: N2(lv2, 1, 3), moulds: N2(lv2, 1, 3), cold: N2(lv2, 0, 3), bars: N2(lv2, 1, 6), ore: N2(lv2, 1, 3) };
    default:
      return {};
  }
}
var FURN = [[9.2, -5.2], [-9.2, -5.2], [12.4, 3.4]];
var BUILD = {
  // wood → planks: the open saw shed at the back with frame saws (1 → 3), a log ramp feeding it from the left, board stacks drying on the right, trestles and a sharpening wheel
  sawmill(lv2, R, site) {
    const o = [], c = counts("sawmill", lv2), t = tierOf2(lv2), k = kS(lv2);
    o.push(P("c2_sawdust", 0, 2, 0, 1));
    o.push(P("c2_sawshed", 0, -6.2, 0, k));
    const fx = c.frames === 1 ? [0] : c.frames === 2 ? [-2.4, 2.4] : [-4.1, 0, 4.1];
    for (const x of fx) o.push(P("c2_sawframe", x * k, -4.7 * k - 0.3, 0, 0.9 * k));
    o.push(P("c2_logramp", -10.8, -5.6, -HP, 1));
    row(o, "ws_logpile", c.logs, -15.4, 3, -3.2, 3, 0.1, 1, R, 0.8);
    block(o, "c2_plankstack", c.stacks, 6.8, 1.6, 3, 3.5, 2.9, 0.05, 1);
    row(o, "c2_sawtrestle", c.trestles, -12.5, 8.8, -4.5, 9.4, 0.2, 1, R, 0.8);
    row(o, "ws_wheelbarrow", N2(lv2, 1, 3), -1.6, 5.6, 4, 6.1, 0.4, 1, R, 0.5);
    o.push(P("c2_grindwheel", -8.4, 0.6, 0.5, 1));
    if (t >= 2) o.push(P("ws_waterwheel", 6.2 * k + 2.2, -6, HP, 0.95));
    if (t >= 3) o.push(P("c2_sawshed", 11.8, -8.6, -0.9, 0.38));
    if (t >= 4) row(o, "ws_logs", 3, -9.2, -10.6, -3.8, -10.6, 0, 1, R, 0.4);
    return o;
  },
  // stone → cut stone: the lodge at the back, saw tables (1 → 4) in front of it, rough blocks left, dressed stacks right, a derrick, an arch under construction
  masonry(lv2, R, site) {
    const o = [], c = counts("masonry", lv2), t = tierOf2(lv2), k = kS(lv2);
    o.push(P("c2_masonlodge", 0, -6.6, 0, k));
    row(o, "c2_stonesaw", c.tables, -8.2, 3, 8.2, 3, 0, 1, R, 0.5);
    block(o, "ws_stoneblocks", c.rough, -12.6, -8.2, 2, 3.8, 3, 0.1, 1);
    block(o, "c2_blockstack", c.stacks, 8.4, -7.6, 2, 4.2, 2.1, 0, 0.85);
    if (lv2 >= 10) o.push(P("c2_hoist", 12.6, 3.4, -0.5, 0.8));
    if (c.arches >= 1) o.push(P("c2_arch", -10.8, 8.8, 0.35, 0.9));
    if (c.arches >= 2) o.push(P("c2_arch", 8.4, 9.6, -0.3, 0.9));
    row(o, "c2_drums", N2(lv2, 0, 3), -4.8, 7.6, 4.2, 12.8, 0.3, 1, R, 0.6);
    o.push(P("c2_grindwheel", -5.2, 0.4, -0.4, 1.1));
    row(o, "ws_wheelbarrow", N2(lv2, 1, 3), -2, 8.8, 2, 9.4, 0.4, 1, R, 0.5);
    scatter(o, "ws_boulderC", N2(lv2, 1, 4), R, 10, 13.5, -150 * DEG3, -60 * DEG3, 5, 0.7, 1);
    if (t >= 3) o.push(P("c2_masonlodge", 7, -13.2, 0.2, 0.45));
    return o;
  },
  // iron ore → iron bars: the smeltery hall, tall brick furnaces with their bellows and coal (1 → 3), ingot moulds glowing / cooling, bar stacks, ore heaps
  smelter(lv2, R, site) {
    const o = [], c = counts("smelter", lv2), t = tierOf2(lv2), k = kS(lv2, 0.85);
    o.push(P("c2_smeltery", 0, -7.6, 0, k));
    for (let i = 0; i < c.furnaces; i++) {
      const [fx, fz] = FURN[i];
      o.push(P("c2_furnace", fx, fz, 0, 1.1), P("c2_bellows", fx - 0.4, fz + 3.9, Math.PI, 1), P("c2_coalheap", fx + (fx > 0 ? 3 : -3), fz + 0.6, 0, 0.9));
    }
    row(o, "c2_mouldhot", c.moulds, 5, 8.4, 11.8, 8.4, 0.05, 1, R, 0.3);
    row(o, "c2_mouldcold", c.cold, -10, 8, -3.8, 8, -0.05, 1, R, 0.3);
    block(o, "c2_barstack", c.bars, -14.2, 1.8, 2, 3.4, 2.5, 0.05, 1);
    const ore = [[-13.6, -3], [-13.6, -7.2], [-9.8, -11.2]];
    for (let i = 0; i < c.ore; i++) o.push(P("c2_oreheap", ore[i][0], ore[i][1], i * 1.7, 1));
    row(o, "ws_minecart", N2(lv2, 1, 3), -7, 5, -4, 5, 0.1, 1, R, 0.3);
    if (t >= 3) o.push(P("c2_smeltery", 0, -15, 0, 0.4));
    return o;
  }
};
var SOLID_R = { c2_sawshed: 6.2, c2_masonlodge: 4.6, c2_smeltery: 5.4, c2_furnace: 2.2 };

// src/c3_kinds.js
var KINDS3 = {
  gold: { fa: "\u0645\u0639\u062F\u0646 \u0637\u0644\u0627", unlock: 14, paint: "124,110,72", place: "mount", role: "S", in: ["ore"], out: ["goldore"] },
  oil: { fa: "\u0645\u06CC\u062F\u0627\u0646 \u0646\u0641\u062A", unlock: 17, paint: "52,46,42", place: "free", role: "S", in: ["ground"], out: ["crude"] },
  mint: { fa: "\u0636\u0631\u0627\u0628\u062E\u0627\u0646\u0647", unlock: 15, paint: "118,122,134", place: "free", role: "P", in: ["goldore", "golddust"], out: ["coins"], inTown: true, r: 17, front: "+z", next: "treasury" },
  refinery: { fa: "\u067E\u0627\u0644\u0627\u06CC\u0634\u06AF\u0627\u0647", unlock: 18, paint: "46,52,66", place: "free", role: "P", in: ["crude"], out: ["oil"], inTown: true, r: 18, front: "+z", edge: true }
};
var NN = (lv2, a, b) => Math.round(a + (b - a) * (Math.max(1, lv2) - 1) / 29);
var tier = (lv2) => lv2 <= 0 ? 0 : 1 + Math.min(4, Math.floor((lv2 - 1) / 6));
var P2 = (n2, x, z, ry = 0, s = 1) => ({ n: (/^(ws|c3)_/.test(n2) ? "" : "c3_") + n2, x, z, ry, s });
function row2(o, name, n2, x0, z0, x1, z1, ry = 0, s = 1, R = null, jit = 0) {
  for (let i = 0; i < n2; i++) {
    const t = n2 === 1 ? 0.5 : i / (n2 - 1);
    o.push(P2(name, x0 + (x1 - x0) * t + (R ? (R() - 0.5) * jit : 0), z0 + (z1 - z0) * t + (R ? (R() - 0.5) * jit : 0), ry + (R ? (R() - 0.5) * jit * 0.25 : 0), s));
  }
}
function grid(o, name, n2, x0, z0, cols, dx, dz, ry = 0, s = 1, R = null, jit = 0) {
  for (let i = 0; i < n2; i++) o.push(P2(name, x0 + i % cols * dx + (R ? (R() - 0.5) * jit : 0), z0 + Math.floor(i / cols) * dz + (R ? (R() - 0.5) * jit : 0), ry + (R ? (R() - 0.5) * jit * 0.4 : 0), s));
}
var MINT_YARD = { X: 9.5, Z: 11.5 };
var BUILD2 = {
  // MINT: a walled compound.  Back left the striking hall (forge + chimney), back right the stone strong-room (the vault, door to the front); in the yard the coin presses (screw presses),
  // anvils, rows of coin chests, gold-bar stacks, braziers at the vault door and at the gate.  The wall, the gate and the guard towers grow with the level.
  mint(lv2, R) {
    const o = [], t = tier(lv2), k = 0.9 + 0.1 * (lv2 - 1) / 29, { X: X2, Z } = MINT_YARD;
    o.push(P2("vault", 4.9, -6.2, 0, k), P2("hall", -4.3, -6.1, 0, 0.84 * k));
    o.push(P2("brazier", 4.9, -0.9, 0, 0.75));
    row2(o, "press", NN(lv2, 1, 4), -6.6, 3, 3.6, 3, 0, 1, R, 0.3);
    row2(o, "anvil", NN(lv2, 1, 4), -7.2, 6.4, 0.6, 6.4, 0.2, 1, R, 0.4);
    row2(o, "goldbars", NN(lv2, 1, 6), 7.4, 1.2, 7.4, 1.2 + 1.3 * Math.max(0, NN(lv2, 1, 6) - 1), 0.1, 1, R, 0.3);
    row2(o, "coins", NN(lv2, 1, 4), -7.4, 8.4, -1, 8.9, 0, 1, R, 0.8);
    row2(o, "barrel", NN(lv2, 1, 5), -8, 0.2, -4.4, 0.2, 0, 1, R, 0.5);
    if (lv2 >= 10) row2(o, "crate", NN(lv2, 0, 6), -2.2, 9.6, 3.6, 9.6, 0.1, 1, R, 0.5);
    if (t >= 2) {
      o.push(P2("gate", 0, Z, 0, 1), P2("brazier", 0, Z + 1.6, 0, 0.75));
      for (const sx of [-1, 1]) for (let i = 1; i <= 2; i++) o.push(P2("wall", sx * i * 4.2, Z, 0, 1));
    }
    if (t >= 3) for (const sx of [-1, 1]) for (let i = -2; i <= 2; i++) o.push(P2("wall", sx * X2, i * 4.2, Math.PI / 2, 1));
    if (t >= 4) for (let i = -2; i <= 2; i++) o.push(P2("wall", i * 4.2, -Z, 0, 1));
    if (t >= 3) o.push(P2("gtower", -X2, Z, 0, 1), P2("gtower", X2, Z, 0, 1));
    if (t >= 5) o.push(P2("gtower", -X2, -Z, 0, 1), P2("gtower", X2, -Z, 0, 1));
    return o;
  },
  // REFINERY: an industrial yard — the distillation column and the tank farm at the back (procedural, c3_proc.js), horizontal tanks left, the pump house + the elevated crude tank
  // at the right, rows of barrels at the front, a flare stack with a flame.  More tanks, barrels, pipes and a second stack with the level.
  refinery(lv2, R) {
    const o = [], t = tier(lv2);
    o.push(P2("pump", 9.4, 8.8, -0.15, 0.95));
    if (lv2 >= 12) o.push(P2("watertower", 14.2, 0.6, 0, 1));
    grid(o, "barrel", NN(lv2, 4, 24), -6, 11.2, 8, 1.15, 1.15, 0, 1, R, 0.25);
    if (lv2 >= 8) row2(o, "crate", NN(lv2, 0, 4), 1.2, 3.4, 5.4, 3.4, 0.1, 0.9, R, 0.4);
    return o;
  }
};
var SOLID_R2 = { c3_vault: 4.4, c3_hall: 5.6, c3_gtower: 1.9, c3_pump: 3.9, c3_watertower: 1.5, c3_press: 1.4 };

// src/c4_kinds.js
var N3 = (lv2, a, b) => Math.round(a + (b - a) * (Math.max(1, lv2) - 1) / 29);
var tierOf3 = (lv2) => lv2 <= 0 ? 0 : 1 + Math.min(4, Math.floor((lv2 - 1) / 6));
var kS2 = (lv2, a = 0.84, b = 1.1) => a + (b - a) * (Math.max(1, lv2) - 1) / 29;
var KINDS4 = {
  farm: { fa: "\u0645\u0632\u0631\u0639\u0647", unlock: 3, paint: "108,86,52", role: "S", in: "field", out: "wheat" },
  greenhouse: { fa: "\u06AF\u0644\u062E\u0627\u0646\u0647", unlock: 11, paint: "106,94,66", role: "S", in: null, out: "vegetables" },
  livestock: { fa: "\u062F\u0627\u0645\u062F\u0627\u0631\u06CC", unlock: 5, paint: "116,102,62", role: "S", in: "pens", out: "livestock" },
  slaughter: { fa: "\u06A9\u0634\u062A\u0627\u0631\u06AF\u0627\u0647", unlock: 9, paint: "120,102,78", role: "S/P", in: "livestock", out: "carcasses" },
  mill: {
    fa: "\u0622\u0633\u06CC\u0627\u0628",
    unlock: 4,
    paint: "150,138,110",
    role: "P",
    in: "wheat",
    out: "flour",
    inTown: true,
    r: 16,
    variant: "wind",
    variants: { wind: { place: "free", needs: "flat open ground" }, water: { place: "water", needs: "the shore of the river / lake (the wheel touches the water)" } }
  },
  bakery: { fa: "\u0646\u0627\u0646\u0648\u0627\u06CC\u06CC", unlock: 5, paint: "142,122,96", role: "P", in: "flour", out: "bread", inTown: true, r: 14 },
  butcher: { fa: "\u0642\u0635\u0627\u0628\u06CC", unlock: 7, paint: "132,100,86", role: "P", in: "livestock", out: "meat", inTown: true, r: 14 }
};
var Q = (n2, x, z, ry = 0, s = 1) => ({ n: "c4_" + n2, x, z, ry, s });
var W = (n2, x, z, ry = 0, s = 1) => ({ n: "ws_" + n2, x, z, ry, s });
function row3(out, mk, n2, x0, z0, x1, z1, ry = 0, s = 1, R = null, jit = 0) {
  for (let i = 0; i < n2; i++) {
    const t = n2 === 1 ? 0.5 : i / (n2 - 1);
    out.push(mk(x0 + (x1 - x0) * t + (R ? (R() - 0.5) * jit : 0), z0 + (z1 - z0) * t + (R ? (R() - 0.5) * jit : 0), ry + (R ? (R() - 0.5) * jit * 0.2 : 0), s));
  }
}
var piece = (name) => (x, z, ry, s) => name.startsWith("c4_") ? Q(name.slice(3), x, z, ry, s) : W(name.replace(/^ws_/, ""), x, z, ry, s);
var PI = Math.PI;
var WIND_SPIN = -0.7;
var WHEEL_SPIN = 0.9;
function millParts(lv2, site) {
  const k = kS2(lv2), out = [];
  if (site && site.variant === "water") out.push({ body: "watermill_nw", part: "c4_wheel", x: 0, z: -3.2, ry: PI, s: k, spin: WHEEL_SPIN });
  else {
    out.push({ body: "windmill_nf", part: "c4_windmill_fan", x: 0, z: -4, ry: 0, s: k, spin: WIND_SPIN });
    if (lv2 >= 11) out.push({ body: "windmill_nf", part: "c4_windmill_fan", x: -15.5, z: -7, ry: 0.35, s: k * 0.8, spin: WIND_SPIN * 0.85 });
    if (lv2 >= 22) out.push({ body: "windmill_nf", part: "c4_windmill_fan", x: 15.5, z: -8, ry: -0.35, s: k * 0.74, spin: WIND_SPIN * 1.1 });
  }
  return out;
}
var BUILD3 = {
  // MILL (wheat -> flour).  variant 'wind': the sail tower (more towers with the level); variant 'water': the mill house with its wheel turned toward the water (local +z).
  // Around it: flour sacks stacked in rows, grain carts waiting, barrels, a grain barn / silo at the high tiers.
  mill(lv2, R, s) {
    const o = [], t = tierOf3(lv2), water = !!(s && s.variant === "water"), sacks = N3(lv2, 3, 18);
    for (const m of millParts(lv2, s)) o.push(Q(m.body, m.x, m.z, m.ry, m.s));
    if (!water) {
      row3(o, piece("c4_sack"), Math.ceil(sacks / 2), -9, 5.5, 0, 5.8, 0.2, 1, R, 0.5);
      row3(o, piece("c4_sack"), Math.floor(sacks / 2), -8, 7.2, -1, 7.6, 0.6, 1, R, 0.5);
      row3(o, piece("c4_cart1"), N3(lv2, 1, 3), 8, 6, 8, 6 + 5 * (N3(lv2, 1, 3) - 1), PI / 2 + 0.2, 1, R, 0.4);
      o.push(Q("workbench", 5, 3, -0.3), Q("barrel", 11, 2.6, 0), Q("barrel", 12.2, 3.2, 0.4), Q("crate", 3.8, 7.2, 0.3));
      if (t >= 3) o.push(Q("smallbarn", -18, 2, 0.5, 0.85));
      if (t >= 5) o.push(Q("silo", 19, 3, 0, 0.9));
    } else {
      row3(o, piece("c4_sack"), Math.ceil(sacks / 2), -14, -4, -9, 0.5, 0.2, 1, R, 0.5);
      row3(o, piece("c4_sack"), Math.floor(sacks / 2), -12.5, 0, -9.5, 3, 0.5, 1, R, 0.5);
      row3(o, piece("c4_cart1"), N3(lv2, 1, 3), 11, -3, 11, -3 + 5 * (N3(lv2, 1, 3) - 1), PI / 2, 1, R, 0.4);
      o.push(Q("workbench", -7, -2, 0.3), Q("barrel", 8, -0.5, 0), Q("barrel", 9.2, 0.1, 0.4), Q("crate", -10, -7, 0.3));
      if (t >= 3) o.push(Q("smallbarn", 17, -11, -0.4, 0.85));
      if (t >= 5) o.push(Q("silo", -18, -10, 0, 0.9));
    }
    if (t >= 2) o.push(Q("hut", water ? -16 : 0, water ? -10 : -17, water ? 0.4 : 0, 0.85));
    return o;
  },
  // BAKERY (flour -> bread): the two-storey bakehouse with its chimney, a domed brick oven with a flue (PROC), bread racks that multiply, flour sacks, a bread cart
  bakery(lv2, R, s) {
    const o = [], t = tierOf3(lv2), k = kS2(lv2, 0.86, 1.08), sacks = N3(lv2, 3, 16);
    o.push(Q("bakery", 0, -5, 0, k));
    row3(o, piece("c4_sack"), Math.ceil(sacks / 2), -11, -1, -11, 1 + 1 * Math.ceil(sacks / 2), 0.3, 1, R, 0.4);
    row3(o, piece("c4_sack"), Math.floor(sacks / 2), -9.2, 0.6, -9.2, 2.6 + 0.9 * Math.floor(sacks / 2), 0.7, 1, R, 0.4);
    o.push(Q("workbench", -5.2, 3.4, 0.1), Q("barrel", 6.5, -2.5, 0), Q("bucket", 5.4, -1.5, 0.5));
    row3(o, piece("c4_stallcart"), N3(lv2, 1, 3), 6, 8, 6 + 5 * (N3(lv2, 1, 3) - 1), 8, 0.2, 1, R, 0.4);
    row3(o, piece("c4_cart1"), N3(lv2, 1, 2), 14, 3, 14, 3 + 5 * (N3(lv2, 1, 2) - 1), PI / 2, 1, R, 0.4);
    if (t >= 3) o.push(Q("hut", 17, -13, -0.7, 0.85));
    if (t >= 4) o.push(Q("smallbarn", -15, -9, 0.4, 0.8));
    return o;
  },
  // BUTCHER (livestock -> meat): the butcher's stall-house with its awning, hook racks with hanging meat (PROC), a chopping block, more stalls and cages with the level
  butcher(lv2, R, s) {
    const o = [], t = tierOf3(lv2), k = kS2(lv2, 1.12, 1.45);
    o.push(Q("butchershop", 0, -5.5, 0, k));
    o.push(Q("workbench", -6.5, 2.5, 0.2), Q("barrel", 8.5, -1, 0), Q("crate", 7.5, 1.2, 0.3), Q("bucket", -2.6, 4.2, 0.9));
    for (let i = 0; i < N3(lv2, 2, 9); i++) o.push(Q("crate", -11 + i % 2 * 1.3, 0 + Math.floor(i / 2) * 1.3, 0.1 * i, 1));
    if (lv2 >= 10) o.push(Q("stall", 9, 6, 0.05));
    if (lv2 >= 20) o.push(Q("stall", 13.5, 6, -0.1));
    row3(o, piece("c4_cart3"), N3(lv2, 1, 2), 14, -2, 14, -2 + 5 * (N3(lv2, 1, 2) - 1), PI / 2, 1, R, 0.4);
    if (t >= 3) o.push(Q("hut", -14, -9, 0.6, 0.85));
    if (t >= 5) o.push(Q("smallbarn", 16, -10, -0.3, 0.8));
    return o;
  },
  // SLAUGHTER (improved): a big dark hall instead of the small stall, the stall as its cutting shed, hook racks (PROC) in place of the fish racks
  slaughter(lv2, R, s) {
    const o = [], t = tierOf3(lv2), k = kS2(lv2, 0.72, 0.9);
    o.push(Q("slaughterhall", 0, -8.5, 0, k));
    o.push(W("butcher", 13.5, -3.5, -0.5, 1.15 + 0.15 * (lv2 / 30)));
    row3(o, piece("ws_cage_small"), N3(lv2, 1, 4), -12, 4, 2, 4.5, 0.1, 1, R, 0.5);
    row3(o, piece("ws_workbench"), N3(lv2, 1, 3), 8, 1.5, 14, 1.5, 1.57, 1, R, 0.3);
    row3(o, piece("ws_barrel"), N3(lv2, 2, 6), -5, 9, 8, 9.5, 0.1, 1, R, 0.8);
    o.push(W("cauldron", 6, 3.5, 0), W("cart3", 12, 9, 0.9), W("crate_wooden", 10.5, 5, 0.3));
    for (let i = 0; i < 5; i++) o.push(W("fence", -10.5 + i * 4.2, 13, 0));
    if (t >= 3) o.push(W("stall_empty", -4, 12, 0.1));
    if (t >= 4) o.push(W("hut", -15, -6, 0.6, 0.9));
    return o;
  },
  // FARM (improved): the p38 farm + scarecrows standing in the crop plots (they multiply with the plots)
  farm(lv2, R, s) {
    const o = [], t = tierOf3(lv2), k = 0.76 + 0.24 * (Math.max(1, lv2) - 1) / 29;
    o.push(W("barn", 0, -9, 0, 0.82 * k + 0.1));
    row3(o, piece("ws_silo"), N3(lv2, 1, 2), 11, -9, 11, -9 + 5 * (N3(lv2, 1, 2) - 1), 0, 1, R, 0.2);
    row3(o, piece("ws_coop"), N3(lv2, 1, 3), -12, -3, -12, -3 + 4.5 * (N3(lv2, 1, 3) - 1), 1.57, 1, R, 0.2);
    if (t >= 3) o.push(W("smallbarn", -14, -14, 0.3, 0.9));
    if (t >= 5) o.push(W("openbarn", 15, 8, -0.4, 0.9));
    for (let i = 0; i < 6; i++) {
      o.push(W("fence", -12.6 + i * 4.2, 6, 0));
      if (i < 5) o.push(W("fence", 12.6 - i * 4.2, 6, 0));
    }
    o.push(W("cart1", 3, 2.5, 1), W("farmcrate_apple", 6, 3.5, 0.2), W("farmcrate_apple", 6.2, 4.4, 0.6), W("barrel_apples", 8, 3.5, 0), W("sack", -6, 3, 0.4), W("bucket_wooden_1", -7, 2.2, 0.9), W("wheelbarrow", -4, 4.5, 0.5));
    const slots = [[-20, -2], [20, -2], [-20, 7], [20, 7], [-20, -11], [20, -11], [-6, -22], [8, -22]];
    const plots = N3(lv2, 2, 8), n2 = Math.min(plots, N3(lv2, 1, 5));
    for (let i = 0; i < n2; i++) o.push(Q("scarecrow", slots[i][0] + (i & 1 ? -2.2 : 2.2), slots[i][1] + 0.3, 0.4 + i, 1.35));
    return o;
  }
};
var SOLID_R3 = { c4_windmill: 4.2, c4_watermill: 4.6, c4_bakery: 4, c4_butchershop: 4.2, c4_slaughterhall: 6.2, c4_hut: 3.6, c4_smallbarn: 3.8, c4_silo: 2.4 };
var col2 = (h) => new Color(h);
var C = {
  clay: col2("#a85a3c"),
  clay2: col2("#8f4a31"),
  brick: col2("#b8694a"),
  stoneS: col2("#8d96a4"),
  dark: col2("#2a2220"),
  glow: col2("#ff9a35"),
  glow2: col2("#ffd070"),
  wood: col2("#7a5a3a"),
  wood2: col2("#6b4e32"),
  crust: col2("#dfa04a"),
  crust2: col2("#c98536"),
  crumb: col2("#f0d9a0"),
  meat: col2("#b9605a"),
  meat2: col2("#d98f82"),
  fat: col2("#ecd3c2"),
  steel: col2("#9aa3b0"),
  flour: col2("#d9d2bd"),
  flour2: col2("#cbc3ab"),
  hook: col2("#4b4f58")
};

// src/worksites.js
var WS_KINDS = {
  lumber: { fa: "\u0686\u0648\u0628\u200C\u0628\u0631\u06CC", unlock: 1, paint: "124,100,64" },
  quarry: { fa: "\u0645\u0639\u062F\u0646 \u0633\u0646\u06AF", unlock: 2, paint: "132,128,120" },
  farm: { fa: "\u0645\u0632\u0631\u0639\u0647", unlock: 3, paint: "108,86,52" },
  livestock: { fa: "\u062F\u0627\u0645\u062F\u0627\u0631\u06CC", unlock: 5, paint: "116,102,62" },
  fishery: { fa: "\u0645\u0627\u0647\u06CC\u06AF\u06CC\u0631\u06CC", unlock: 6, paint: "134,120,90", place: "water" },
  iron: { fa: "\u0645\u0639\u062F\u0646 \u0622\u0647\u0646", unlock: 8, paint: "92,86,82" },
  slaughter: { fa: "\u06A9\u0634\u062A\u0627\u0631\u06AF\u0627\u0647", unlock: 9, paint: "120,102,78" },
  greenhouse: { fa: "\u06AF\u0644\u062E\u0627\u0646\u0647", unlock: 11, paint: "106,94,66" },
  gold: { fa: "\u0645\u0639\u062F\u0646 \u0637\u0644\u0627", unlock: 14, paint: "124,110,72" },
  oil: { fa: "\u0645\u06CC\u062F\u0627\u0646 \u0646\u0641\u062A", unlock: 17, paint: "52,46,42" }
};
var NEW_KINDS = [];
for (const K of [KINDS, KINDS2, KINDS3, KINDS4]) {
  for (const k of Object.keys(K)) {
    if (WS_KINDS[k]) WS_KINDS[k] = { ...K[k], ...WS_KINDS[k] };
    else {
      Object.defineProperty(WS_KINDS, k, { value: { ...K[k] }, enumerable: false, writable: true, configurable: true });
      NEW_KINDS.push(k);
    }
  }
}
var N4 = (lv2, a, b) => Math.round(a + (b - a) * (Math.max(1, lv2) - 1) / 29);
var tierOf4 = (lv2) => lv2 <= 0 ? 0 : 1 + Math.min(4, Math.floor((lv2 - 1) / 6));
var kScale = (lv2) => 0.76 + 0.24 * (Math.max(1, lv2) - 1) / 29;
function spur(s) {
  const fx = Math.sin(s.ry), fz = Math.cos(s.ry), a = [s.x + fx * s.r * 0.55, s.z + fz * s.r * 0.55], b = s.link;
  if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 4) return [b, a];
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * 0.05, mz = (a[1] + b[1]) / 2 + (b[0] - a[0]) * 0.05;
  return [b, [mx, mz], a];
}
var P3 = (n2, x, z, ry = 0, s = 1) => ({ n: "ws_" + n2, x, z, ry, s });
function row4(out, name, n2, x0, z0, x1, z1, ry = 0, s = 1, R = null, jit = 0) {
  for (let i = 0; i < n2; i++) {
    const t = n2 === 1 ? 0.5 : i / (n2 - 1);
    out.push(P3(name, x0 + (x1 - x0) * t + (R ? (R() - 0.5) * jit : 0), z0 + (z1 - z0) * t + (R ? (R() - 0.5) * jit : 0), ry + (R ? (R() - 0.5) * jit * 0.2 : 0), s));
  }
}
function block2(out, name, n2, x0, z0, cols, dx, dz, ry = 0, s = 1) {
  for (let i = 0; i < n2; i++) out.push(P3(name, x0 + i % cols * dx, z0 + Math.floor(i / cols) * dz, ry, s));
}
function scatter2(out, name, n2, R, r0, r1, a0, a1, gap = 2, s0 = 1, s1 = 1, avoid = []) {
  const got = [];
  for (let k = 0; k < n2 * 14 && got.length < n2; k++) {
    const rr = r0 + (r1 - r0) * Math.sqrt(R()), a = a0 + (a1 - a0) * R(), x = Math.sin(a) * rr, z = Math.cos(a) * rr;
    if (got.some((q) => Math.hypot(q[0] - x, q[1] - z) < gap) || avoid.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2])) continue;
    got.push([x, z]);
    out.push(P3(name, x, z, R() * 6.283, s0 + (s1 - s0) * R()));
  }
}
var DEG4 = Math.PI / 180;
var BUILD5 = {
  // wood: the sawmill at the back, log stacks and carts in the yard, a stump field behind, lumberjacks' huts at the sides
  lumber(lv2, R, s) {
    const o = [], k = kScale(lv2), t = tierOf4(lv2);
    o.push(P3("lumbermill", 0, -6, 0, 0.78 * k));
    row4(o, "logpile", N4(lv2, 2, 9), -15, 9, 3, 9, 0.05, 1, R, 0.6);
    if (lv2 >= 8) row4(o, "logpile", N4(lv2, 0, 6), -15, 13.5, -2, 13.5, 0.05, 1, R, 0.6);
    row4(o, "logs", N4(lv2, 1, 6), 8, 8, 16, 14, 0.5, 1, R, 1);
    o.push(P3("stumpsA", -12, -17, 0.3, 1), P3("stumpsB", 13, -18, 1.2, 1));
    scatter2(o, "stump", N4(lv2, 5, 22), R, 10, 24, 150 * DEG4, 210 * DEG4, 2.4, 0.8, 1.3);
    o.push(P3("workbench", 9.5, 3, -0.4), P3("ladder", 8.2, -6, 1.57), P3("cratelong", 11.5, 1, 0.5), P3("pallet", 12.5, 4.5, 0.1), P3("sack", 12.2, 4.4, 0));
    row4(o, "cart1", N4(lv2, 1, 2), 2, 17, 2, 17 + 5 * (N4(lv2, 1, 2) - 1), Math.PI / 2, 1, R, 0.5);
    row4(o, "wheelbarrow", N4(lv2, 1, 3), -4, 5, 3, 5.5, 0.4, 1, R, 0.5);
    if (t >= 2) o.push(P3("hut", -17, -2, 1.2, 0.95));
    if (t >= 4) o.push(P3("hut", 18, -5, -1.2, 0.95));
    if (t >= 3) o.push(P3("stall_cart_empty", 14.5, 8, -0.8));
    return o;
  },
  // stone: a cut rock face behind, block stacks, cranes and scaffolding, masons' benches
  quarry(lv2, R, s) {
    const o = [], t = tierOf4(lv2);
    o.push(P3("rockA", -8, -15, 0.4, 1), P3("rockB", 9, -17, 2.2, 1));
    if (t >= 3) o.push(P3("rockC", 0, -20, 1, 1));
    block2(o, "stoneblocks", N4(lv2, 3, 16), -14, 3, 4, 3.9, 3.7, 0.15, 1);
    scatter2(o, "boulderC", N4(lv2, 2, 7), R, 8, 22, 100 * DEG4, 260 * DEG4, 5, 0.8, 1.3);
    scatter2(o, "boulderD", N4(lv2, 2, 6), R, 8, 22, -150 * DEG4, 150 * DEG4, 4, 0.8, 1.2);
    o.push(P3("stageB", 10, 0, -0.3, 1));
    if (lv2 >= 7) o.push(P3("scaffold", 17, -2, 0, 0.95));
    if (lv2 >= 15) o.push(P3("stageC", -16, -7, 0.5, 1));
    row4(o, "ladder", N4(lv2, 1, 4), -3, -9, 6, -9, 0, 1);
    row4(o, "wheelbarrow", N4(lv2, 1, 4), -4, 8, 6, 8.5, 0.3, 1, R, 0.6);
    row4(o, "cart2", N4(lv2, 1, 2), 14, 12, 14, 12 + 5 * (N4(lv2, 1, 2) - 1), Math.PI / 2, 1, R, 0.5);
    o.push(P3("workbench", 6, 5, 0.2), P3("whetstone", 8, 6.5, 0.4), P3("pickaxe_bronze", 7.4, 5.2, 0.8), P3("hut", -3, 13, 0, 0.9));
    return o;
  },
  // iron: the mine mouth at the back, rails + ore carts, the smelter (smithy) beside it
  iron(lv2, R, s) {
    const o = [], t = tierOf4(lv2);
    o.push(P3("mine", 0, -10, 0, 0.9 + 0.1 * (lv2 / 30)));
    row4(o, "minecart", N4(lv2, 1, 4), -3, 1, -3, 14, 0, 1, R, 0.3);
    row4(o, "orecart", N4(lv2, 1, 4), 3, 1, 3, 12, 0.1, 1, R, 0.3);
    if (lv2 >= 5) o.push(P3("smithy", -15, 0, 0.5, 1));
    if (lv2 >= 12) o.push(P3("smithy", 16, -2, -0.5, 0.9));
    o.push(P3("anvil_log", -9, 6, 0.2), P3("cauldron", -10.5, 8, 0), P3("chain_coil", 6, 7, 0.4), P3("barrel_holder", 9, 9, 0.2), P3("workbench", 9, 3, -0.2));
    scatter2(o, "boulderA", N4(lv2, 2, 6), R, 12, 22, 70 * DEG4, 290 * DEG4, 5, 0.9, 1.3);
    scatter2(o, "boulderE", N4(lv2, 2, 6), R, 10, 22, -160 * DEG4, 160 * DEG4, 4, 0.9, 1.2);
    row4(o, "crate_wooden", N4(lv2, 2, 8), -7, 12, 8, 12.5, 0.1, 1, R, 0.6);
    if (t >= 3) o.push(P3("hut", 17, 8, -1.2, 0.9));
    if (t >= 4) o.push(P3("watchtower2", -18, 10, 0, 1));
    return o;
  },
  // gold: like the iron mine, but with panned nuggets, bars and a counting house under guard
  gold(lv2, R, s) {
    const o = [], t = tierOf4(lv2);
    o.push(P3("mine", 0, -10, 0, 0.9 + 0.1 * (lv2 / 30)));
    row4(o, "minecart", N4(lv2, 1, 4), -3, 1, -3, 13, 0, 1, R, 0.3);
    row4(o, "orecart", N4(lv2, 1, 3), 3, 2, 3, 11, 0.1, 1, R, 0.3);
    o.push(P3("stageC", -15, 2, 0.5, 1), P3("workbench", 9, 3, -0.2), P3("cage_small", 8, 8, 0.4), P3("barrel_holder", 11, 7, 0.3));
    row4(o, "nugget", N4(lv2, 2, 10), 4, 8, 13, 15, 0, 1, R, 1.5);
    row4(o, "nugget2", N4(lv2, 1, 7), -9, 9, -1, 15, 0, 1, R, 1.5);
    row4(o, "goldbars", N4(lv2, 1, 7), -8, 6, -14, 8, 0.2, 1, R, 0.5);
    row4(o, "coin_pile", N4(lv2, 1, 3), -6, 12, 2, 13, 0, 1, R, 0.5);
    scatter2(o, "boulderA", N4(lv2, 2, 6), R, 12, 22, 70 * DEG4, 290 * DEG4, 5, 0.9, 1.3);
    if (t >= 3) o.push(P3("watchtower2", 17, 8, 0, 1));
    if (t >= 4) o.push(P3("hut", -17, 12, 0.6, 0.9));
    if (t >= 5) o.push(P3("market", 16, -3, -0.6, 0.9));
    return o;
  },
  // farm: barn + silos + coop, a fenced yard, crop plots that multiply (drawn by wsbuild), scarecrows
  farm(lv2, R, s) {
    const o = [], t = tierOf4(lv2), k = kScale(lv2);
    o.push(P3("barn", 0, -9, 0, 0.82 * k + 0.1));
    row4(o, "silo", N4(lv2, 1, 2), 11, -9, 11, -9 + 5 * (N4(lv2, 1, 2) - 1), 0, 1, R, 0.2);
    row4(o, "coop", N4(lv2, 1, 3), -12, -3, -12, -3 + 4.5 * (N4(lv2, 1, 3) - 1), 1.57, 1, R, 0.2);
    if (t >= 3) o.push(P3("smallbarn", -14, -14, 0.3, 0.9));
    if (t >= 5) o.push(P3("openbarn", 15, 8, -0.4, 0.9));
    for (let i = 0; i < 6; i++) {
      o.push(P3("fence", -12.6 + i * 4.2, 6, 0));
      if (i < 5) o.push(P3("fence", 12.6 - i * 4.2, 6, 0));
    }
    o.push(P3("cart1", 3, 2.5, 1), P3("farmcrate_apple", 6, 3.5, 0.2), P3("farmcrate_apple", 6.2, 4.4, 0.6), P3("barrel_apples", 8, 3.5, 0), P3("sack", -6, 3, 0.4), P3("bucket_wooden_1", -7, 2.2, 0.9), P3("wheelbarrow", -4, 4.5, 0.5));
    return o;
  },
  // livestock: barns at the back, pens that multiply with the level (fenced squares with a trough), a cage + hay
  livestock(lv2, R, s) {
    const o = [], t = tierOf4(lv2), pens = N4(lv2, 1, 4);
    o.push(P3("openbarn", -10, -11, 0.15, 0.9), P3("smallbarn", 10, -12, -0.1, 0.9));
    if (t >= 4) o.push(P3("barn", 0, -19, 0, 0.8));
    const cells = [[-9, 4], [9, 4], [-9, 16], [9, 16]];
    for (let p = 0; p < pens; p++) {
      const [cx, cz] = cells[p], w = 12.6, d = 8.4;
      for (let i = 0; i < 3; i++) {
        o.push(P3("fence", cx - w / 2 + 2.1 + i * 4.2, cz - d / 2, 0), P3("fence", cx - w / 2 + 2.1 + i * 4.2, cz + d / 2, 0));
      }
      for (let i = 0; i < 2; i++) {
        o.push(P3("fence", cx - w / 2, cz - d / 2 + 2.1 + i * 4.2, Math.PI / 2), P3("fence", cx + w / 2, cz - d / 2 + 2.1 + i * 4.2, Math.PI / 2));
      }
      o.push(P3("barrel", cx - 1.4, cz + d / 2 - 1.2, 0.3), P3("sack", cx + 1.2, cz + d / 2 - 1.2, 0.6));
    }
    o.push(P3("cage_small", 0, 9, 0.3), P3("cratelong", 1.5, 2.5, 0.3), P3("sack", -1.5, 2.2, 0.3));
    return o;
  },
  // fishery (lake or river): jetty running out to the water (local +z), rowboats along it, drying racks and nets on the shore, huts + a fish stall
  fishery(lv2, R, s) {
    const o = [], t = tierOf4(lv2), boats = Math.ceil(N4(lv2, 1, 9) / 2), jet = lv2 >= 22 ? 2 : lv2 >= 11 ? 1 : 0;
    o.push(P3("jetty", 0, s.variant === "river" ? 11 : 15, 0, s.variant === "river" ? 0.62 : 0.9));
    for (let i = 0; i < boats; i++) {
      const side = i % 2 ? 1 : -1, j = Math.floor(i / 2);
      o.push(P3("rowboat", side * (5.6 + j % 2 * 3.2), (s.variant === "river" ? 13 : 18) + j * 3.4, 1.57 + side * 0.08 + (R() - 0.5) * 0.2, 1));
    }
    if (jet >= 1) o.push(P3("jetty", 14, s.variant === "river" ? 9 : 12, 0.35, 0.5));
    if (jet >= 2) o.push(P3("jetty", -14, s.variant === "river" ? 9 : 12, -0.35, 0.5));
    row4(o, "fishrack", N4(lv2, 1, 4), -14, -4, 14, -4, 0, 1, R, 0.8);
    row4(o, "fishset", N4(lv2, 2, 6), -9, 5.5, 9, 6.5, 0, 1, R, 1.5);
    o.push(P3("hut", -15, -12, 0.4, 0.95), P3("barrel", 6, -9, 0), P3("barrel", 7.2, -9.4, 0), P3("bucket_wooden_1", 4.6, -8.4, 0.5));
    if (t >= 2) o.push(P3("stall_empty", 10, -9, 0.1));
    if (t >= 3) o.push(P3("hut", 16, -12, -0.3, 0.9));
    if (t >= 4) o.push(P3("brewhouse", 0, -14, 0, 0.9));
    row4(o, "barrelold", N4(lv2, 0, 6), -6, -10, 4, -10.5, 0, 1, R, 0.5);
    return o;
  },
  // slaughterhouse (clean, no gore): the butcher's hall, holding cages, meat racks, cart + barrels, a fenced yard
  slaughter(lv2, R, s) {
    const o = [], t = tierOf4(lv2);
    o.push(P3("butcher", 0, -6, 0, 1.4 + 0.2 * (lv2 / 30)));
    o.push(P3("smallbarn", -13, -6, 0.2, 0.85));
    row4(o, "cage_small", N4(lv2, 1, 4), -12, 4, 2, 4.5, 0.1, 1, R, 0.5);
    row4(o, "fishrack", N4(lv2, 1, 3), 4, 4, 14, 4, 0, 0.95, R, 0.6);
    row4(o, "workbench", N4(lv2, 1, 3), 8, -4, 14, -4, 1.57, 1, R, 0.3);
    row4(o, "barrel", N4(lv2, 2, 6), -5, 9, 8, 9.5, 0.1, 1, R, 0.8);
    o.push(P3("cauldron", 6, 0, 0), P3("cart3", 12, 9, 0.9), P3("crate_wooden", 10.5, 1.5, 0.3));
    for (let i = 0; i < 5; i++) o.push(P3("fence", -10.5 + i * 4.2, 13, 0));
    if (t >= 3) o.push(P3("stall_empty", -4, 12, 0.1));
    if (t >= 4) o.push(P3("hut", 15, -8, -0.6, 0.9));
    return o;
  },
  // greenhouse: glass houses (wsbuild draws them: frame, panes, plant rows) — here only the sheds, tubs and crates around them
  greenhouse(lv2, R, s) {
    const o = [], t = tierOf4(lv2);
    o.push(P3("hut", -14, -10, 0.3, 0.85));
    row4(o, "barrel", N4(lv2, 2, 6), -9, 11, 10, 11.5, 0, 1, R, 0.8);
    row4(o, "farmcrate_empty", N4(lv2, 3, 12), -10, 8.5, 10, 8.8, 0.1, 1, R, 0.8);
    o.push(P3("bucket_wooden_1", 3, 9, 0.2), P3("wheelbarrow", 6, 9, 0.5), P3("sack", 12, 9.5, 0), P3("workbench", 14, -8, 1.57));
    if (t >= 3) o.push(P3("cart1", 15, 5, 1.2));
    if (t >= 4) o.push(P3("stageA", 16, -12, 0.2, 1));
    return o;
  },
  // oil (naphtha pits): pools and windlass derricks are drawn by wsbuild; here the jars, barrels, carts and the camel caravan
  oil(lv2, R, s) {
    const o = [], t = tierOf4(lv2);
    row4(o, "barrelold", N4(lv2, 4, 16), -14, 9, 14, 9.5, 0, 1, R, 1.4);
    row4(o, "barrel_holder", N4(lv2, 1, 3), -13, 13, 13, 13.5, 0.1, 1, R, 0.8);
    scatter2(o, "amphora", N4(lv2, 4, 22), R, 3, 13, 20 * DEG4, 340 * DEG4, 1.6, 0.9, 1.25, [[0, 0, 0]]);
    row4(o, "camel", N4(lv2, 1, 9), -15, 20, 15, 22, 1.57, 1, R, 1.8);
    row4(o, "cart2", N4(lv2, 1, 2), -10, 16, 10, 17, 0.2, 1, R, 1);
    o.push(P3("hut", -16, -9, 0.5, 0.9));
    if (t >= 3) o.push(P3("stageC", 16, -9, -0.4, 0.95));
    if (t >= 4) o.push(P3("watchtower2", 19, 4, 0, 1));
    if (t >= 5) o.push(P3("smithy", -3, -15, 0, 0.9));
    return o;
  }
};
Object.assign(BUILD5, BUILD, BUILD2, BUILD3);
var SOLID_R4 = { lumbermill: 6.8, mine: 6.4, smithy: 4.6, hut: 3.6, market: 4.4, brewhouse: 3.8, barn: 5.4, smallbarn: 3.8, openbarn: 3.6, silo: 2.4, coop: 2.2, watchtower2: 2.2, stageA: 0, butcher: 2.6, waterwheel: 3.2, rockA: 5.6, rockB: 4.8, rockC: 3.4, ...SOLID, ...SOLID_R, ...SOLID_R2, ...SOLID_R3 };

// src/roads.js
var ROADS = [];
var built = false;
var off = (p, nx, nz, d) => [p.x + nx * d, p.z + nz * d];
var yard = (M, d) => {
  const a = M.a * Math.PI / 180;
  return [M.x - Math.cos(a) * d, M.z - Math.sin(a) * d];
};
function buildRoads() {
  if (built) return ROADS;
  built = true;
  ROADS.length = 0;
  const G = GATE;
  if (!TOWN) {
    const sx = G.x + G.nx * 4, sz = G.z + G.nz * 4;
    ROADS.push({ name: "main", w: 6, kind: "dirt", pts: [[sx - G.nx * 8, sz - G.nz * 8], [sx, sz], [sx + G.nx * 22, sz + G.nz * 22], [sx + G.nx * 44 - 10, sz + G.nz * 44], [sx + G.nx * 70 - 4, sz + G.nz * 70 + 10], [-60, 220], [-40, 330]] });
    return ROADS;
  }
  const [T0, T1] = TGATES;
  const m0 = off(G, G.nx, G.nz, MOAT.off + 9), m1 = off(T0, T0.nx, T0.nz, -5);
  ROADS.push({ name: "mainst", w: 7, kind: "cobble", pts: [off(G, G.nx, G.nz, -2), m0, [(m0[0] + m1[0]) / 2, (m0[1] + m1[1]) / 2], m1, off(T0, T0.nx, T0.nz, 3)] });
  const ring2 = TOWN.map(([x, z]) => {
    const r = Math.hypot(x, z), k = (r - 31) / r;
    return [x * k, z * k];
  });
  ROADS.push({ name: "ring", w: 5.5, kind: "cobble", closed: true, pts: [...ring2, ring2[0]] });
  if (GROW > 1) {
    const ring22 = TOWN.map(([x, z]) => {
      const r = Math.hypot(x, z), k = (r - 67) / r;
      return [x * k, z * k];
    });
    ROADS.push({ name: "ring2", w: 5, kind: "cobble", closed: true, pts: [...ring22, ring22[0]] });
    for (const a of [20, 64, 168, 212, 250, 342]) {
      const ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180), r2 = Math.hypot(...ring22[0]) - 6, r1 = Math.hypot(...ring2[0]) + 4;
      ROADS.push({ name: "lane" + a, w: 4, kind: "cobble", pts: [[ca * (r2 - 4), sa * (r2 - 4)], [ca * (r1 + 2), sa * (r1 + 2)]] });
    }
  }
  ROADS.push({ name: "westst", w: 5, kind: "cobble", pts: [off(T1, T1.nx, T1.nz, 3), off(T1, T1.nx, T1.nz, -5), off(T1, T1.nx, T1.nz, -33)] });
  for (const a of [118, 300]) {
    const ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
    ROADS.push({ name: "lane" + a, w: 4, kind: "cobble", pts: [[ca * 76, sa * 76], [ca * (a === 300 ? 97 : 104), sa * (a === 300 ? 97 : 104)]] });
  }
  const o0 = off(T0, T0.nx, T0.nz, MOAT2.off + 9);
  ROADS.push({ name: "main", w: 6.5, kind: "dirt", pts: [off(T0, T0.nx, T0.nz, 2), o0, [o0[0] + 60, o0[1] + 34], [o0[0] + 130, o0[1] + 58], [o0[0] + 210, o0[1] + 100], [o0[0] + 300, o0[1] + 150]] });
  const F = FIELDS, R = MINES.find((m) => m.id === "ruby");
  ROADS.push({ name: "farm", w: 5, kind: "dirt", pts: [[o0[0] + 30, o0[1] + 18], [F.x - F.w / 2 - 12, F.z + 34], [F.x - F.w / 2 - 14, F.z - 10], [F.x - F.w / 2 - 6, F.z - F.d / 2 - 22], yard(R, 30), yard(R, 6)] });
  const P4 = PASTURE, F22 = FIELDS2;
  ROADS.push({ name: "north", w: 4.5, kind: "dirt", pts: [[o0[0] + 12, o0[1] + 8], [o0[0] + 4, o0[1] + 48], [F22.x - 30, F22.z - 2], [P4.x + P4.r + 8, P4.z - 10]] });
  const w0 = off(T1, T1.nx, T1.nz, MOAT2.off + 9), E = MINES.find((m) => m.id === "emerald"), Tq = MINES.find((m) => m.id === "turq"), C2 = CAMP;
  ROADS.push({ name: "west", w: 5.5, kind: "dirt", pts: [off(T1, T1.nx, T1.nz, 2), w0, [w0[0] - 30, w0[1] - 4], [w0[0] - 58, w0[1] + 30], [E.x + 36, E.z + 6], yard(E, 30), yard(E, 6)] });
  ROADS.push({ name: "lake", w: 4, kind: "dirt", pts: [[w0[0] - 58, w0[1] + 30], [w0[0] - 50, w0[1] + 96], [LAKE.x + 30, LAKE.z - 44]] });
  ROADS.push({ name: "turq", w: 5, kind: "dirt", pts: [[w0[0] - 30, w0[1] - 4], [w0[0] - 34, w0[1] - 52], yard(Tq, 30), yard(Tq, 6)] });
  ROADS.push({ name: "camp", w: 4.5, kind: "dirt", pts: [[w0[0] - 34, w0[1] - 52], [C2.x - 30, C2.z + 52], [C2.x - 6, C2.z + C2.r - 4]] });
  withoutPads(() => planHamlets(ROADS)).forEach((H, i) => ROADS.push({ name: "hamlet" + i, w: 3.6, kind: "dirt", pts: H.spur }));
  withoutPads(() => planNomads(ROADS));
  for (const s of SITES || []) ROADS.push({ name: "ws_" + s.id, w: 4.4, kind: "dirt", pts: spur(s) });
  autoBridges();
  addFords();
  return ROADS;
}
var FORD_GAP = 120;
function addFords() {
  if (!STREAMS || !STREAMS.length) return;
  const zones = [PASTURE, MUSTER, LAIR].filter((z) => z && z.r > 0).map((z) => [z.x, z.z, (z.fr ?? z.r) + 4]);
  zones.push([CAMP.x, CAMP.z, CAMP.r + 8]);
  for (const q of SITES || []) zones.push([q.x, q.z, q.r + 10]);
  for (const m of MINES) zones.push([m.x, m.z, 52]);
  for (const H of planHamlets(ROADS)) zones.push([H.x, H.z, 34]);
  for (const N6 of nomads()) zones.push([N6.x, N6.z, 28]);
  const spurs = ROADS.filter((r) => r.name.startsWith("hamlet"));
  const made = [];
  const near = (x, z, list, d) => list.some((b) => Math.hypot(b[0] - x, b[1] - z) < d);
  let n2 = 0;
  for (const S2 of STREAMS) {
    const P4 = S2.pts, k = S2.k || 1, cum = [0];
    for (let i = 1; i < P4.length; i++) cum.push(cum[i - 1] + Math.hypot(P4[i][0] - P4[i - 1][0], P4[i][1] - P4[i - 1][1]));
    const at = (s) => {
      let i = 1;
      while (i < P4.length - 1 && cum[i] < s) i++;
      const a = P4[i - 1], b = P4[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, t = Math.max(0, Math.min(1, (s - cum[i - 1]) / l));
      return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, tx: (b[0] - a[0]) / l, tz: (b[1] - a[1]) / l };
    };
    const total = cum[cum.length - 1], half = Math.max(22, Math.round(20.5 * k)) / 2 + 4;
    for (let target = 100; target < total - 55; target += FORD_GAP) {
      let best = null;
      for (let ds = 0; ds <= 75 && !best; ds += 5) for (const sg of ds ? [-1, 1] : [1]) {
        const s = target + sg * ds;
        if (s < 70 || s > total - 50) continue;
        const c = at(s), nx = -c.tz, nz = c.tx, e0 = [c.x - nx * (half + 4), c.z - nz * (half + 4)], e1 = [c.x + nx * (half + 4), c.z + nz * (half + 4)];
        if (sdTown(c.x, c.z) < 22 || fieldD(c.x, c.z) < 1.3) continue;
        if (made.some((b) => Math.hypot(b[0] - c.x, b[1] - c.z) < 45) || RBRIDGES.some((b) => Math.hypot(b.x - c.x, b.z - c.z) < 45)) continue;
        let ok = true;
        for (let u = -half - 4; u <= half + 4 && ok; u += 3) {
          const x = c.x + nx * u, z = c.z + nz * u, h = height(x, z);
          if (h > 45) ok = false;
          if (Math.abs(u) >= half && (h < 0.7 || distPolyline(RIVER, x, z) < Math.abs(u) * 0 + 5 * k * 0 + 1.5)) ok = false;
        }
        if (!ok) continue;
        if (Math.abs(height(c.x + nx * (half + 2), c.z + nz * (half + 2)) - height(c.x - nx * (half + 2), c.z - nz * (half + 2))) > 9) continue;
        if (zones.some(([zx, zz, zr]) => Math.hypot(zx - c.x, zz - c.z) < zr || Math.hypot(zx - e0[0], zz - e0[1]) < zr - 8 || Math.hypot(zx - e1[0], zz - e1[1]) < zr - 8)) continue;
        if (spurs.some((r) => r.pts.some((q, i) => i && segDist2(c.x, c.z, r.pts[i - 1], q) < 14 || segDist2(e0[0], e0[1], r.pts[i - 1] || q, q) < 8 || segDist2(e1[0], e1[1], r.pts[i - 1] || q, q) < 8))) continue;
        best = { c, e0, e1 };
      }
      if (!best) continue;
      made.push([best.c.x, best.c.z]);
      addBridge({ x: +best.c.x.toFixed(1), z: +best.c.z.toFixed(1), nx: +(-best.c.tz).toFixed(4), nz: +best.c.tx.toFixed(4), len: Math.max(22, Math.round(20.5 * k)), wid: 5.5 });
      n2++;
    }
  }
}
function autoBridges() {
  bridgesOver(RIVER, 1);
  for (const S2 of STREAMS) bridgesOver(S2.pts, S2.k || 1);
}
function bridgesOver(R, k) {
  if (!R || R.length < 2) return;
  const inter = (a, b, c, d) => {
    const rx = b[0] - a[0], rz = b[1] - a[1], sx = d[0] - c[0], sz = d[1] - c[1], den = rx * sz - rz * sx;
    if (Math.abs(den) < 1e-9) return null;
    const t = ((c[0] - a[0]) * sz - (c[1] - a[1]) * sx) / den, u = ((c[0] - a[0]) * rz - (c[1] - a[1]) * rx) / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x: a[0] + rx * t, z: a[1] + rz * t, u } : null;
  };
  for (const Rd of ROADS) {
    if (Rd.name.startsWith("hamlet")) continue;
    for (let i = 0; i < Rd.pts.length - 1; i++) for (let j = 0; j < R.length - 1; j++) {
      const x = inter(Rd.pts[i], Rd.pts[i + 1], R[j], R[j + 1]);
      if (!x) continue;
      const dx = Rd.pts[i + 1][0] - Rd.pts[i][0], dz = Rd.pts[i + 1][1] - Rd.pts[i][1], l = Math.hypot(dx, dz), rx = R[j + 1][0] - R[j][0], rz = R[j + 1][1] - R[j][1], rl = Math.hypot(rx, rz);
      const sin = Math.max(0.3, Math.sqrt(1 - Math.pow((dx * rx + dz * rz) / (l * rl), 2)));
      addBridge({ x: +x.x.toFixed(1), z: +x.z.toFixed(1), nx: +(dx / l).toFixed(4), nz: +(dz / l).toFixed(4), len: Math.max(22, Math.round((17.5 / sin + 3) * k)), wid: Rd.w >= 5.5 ? 7 : 5.5 });
    }
  }
}
function segDist2(px, pz, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2));
  return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
}

// src/nav.js
var CELL = 2.5;
var HALF = 440;
var N5 = Math.ceil(2 * HALF / CELL);
var WET = -0.3;
var DECK = 0.72;
var idx = (i, j) => j * N5 + i;
var ci = (v) => Math.max(0, Math.min(N5 - 1, Math.floor((v + HALF) / CELL)));
var cc = (i) => -HALF + (i + 0.5) * CELL;
function bridgesFromLayout(L) {
  buildRoads();
  const out = [];
  const add = (G, poly, off2, len, wid) => {
    if (!G || !poly) return;
    const a = poly[G.seg], b = poly[(G.seg + 1) % poly.length], al = Math.hypot(b[0] - a[0], b[1] - a[1]);
    out.push({ x: G.x + G.nx * off2, z: G.z + G.nz * off2, nx: G.nx, nz: G.nz, tx: (b[0] - a[0]) / al, tz: (b[1] - a[1]) / al, len, wid, y: DECK });
  };
  if (L.TOWN && L.MOAT2) for (const G of L.TGATES) add(G, L.TOWN, L.MOAT2.off + 0.5, 17, 7.6);
  for (const R of L.RBRIDGES || []) out.push({ x: R.x, z: R.z, nx: R.nx, nz: R.nz, tx: -R.nz, tz: R.nx, len: R.len, wid: R.wid, y: DECK });
  if (L.MOAT && L.MOAT.on && L.GATE) add(L.GATE, L.OUTER, L.MOAT.off + 0.5, 16, 8.2);
  return out;
}
function makeGroundY(bridges) {
  const local = (b, x, z) => {
    const dx = x - b.x, dz = z - b.z;
    return [dx * b.nx + dz * b.nz, dx * b.tx + dz * b.tz];
  };
  return (x, z, terrain) => {
    for (const b of bridges) {
      const [u, v] = local(b, x, z), hl = b.len / 2, hw = b.wid / 2;
      if (Math.abs(v) > hw || Math.abs(u) > hl + 1) continue;
      const k = Math.max(0, Math.min(1, (hl - Math.abs(u)) / 2.5)), ky = Math.max(0, Math.min(1, (hw - Math.abs(v)) / 0.8));
      return Math.max(terrain, terrain + (b.y - terrain) * k * ky);
    }
    return terrain;
  };
}
function buildNav({ height: height2, bridges = [], solids = [] }) {
  const state = new Uint8Array(N5 * N5);
  const sol = new Uint8Array(N5 * N5);
  for (const [sx, sz, sr] of solids) {
    const i0 = ci(sx - sr - 1), i1 = ci(sx + sr + 1), j0 = ci(sz - sr - 1), j1 = ci(sz + sr + 1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (Math.hypot(cc(i) - sx, cc(j) - sz) < sr + 0.9) sol[idx(i, j)] = 1;
  }
  const isSolid = (x, z) => {
    if (!solids.length || x < -HALF || x > HALF || z < -HALF || z > HALF) return false;
    return sol[idx(ci(x), ci(z))] === 1;
  };
  const WALK_W = (b) => b.wid / 2 - 1.1;
  const local = (b, x, z) => {
    const dx = x - b.x, dz = z - b.z;
    return [dx * b.nx + dz * b.nz, dx * b.tx + dz * b.tz];
  };
  const onBridge = (x, z, ext = 0) => {
    for (const b of bridges) {
      const [u, v] = local(b, x, z);
      if (Math.abs(u) <= b.len / 2 + ext && Math.abs(v) <= WALK_W(b)) return b;
    }
    return null;
  };
  const wetAt = (x, z) => height2(x, z) < WET;
  const cell = (i, j) => {
    const k = idx(i, j);
    let s = state[k];
    if (s) return s === 2;
    const x = cc(i), z = cc(j);
    const raw = wetAt(x, z) || wetAt(x + 1.1, z) || wetAt(x - 1.1, z) || wetAt(x, z + 1.1) || wetAt(x, z - 1.1);
    if (!raw) {
      state[k] = 1;
      return false;
    }
    state[k] = onBridge(x, z, 2.5) ? 3 : 2;
    return state[k] === 2;
  };
  const isWet = (x, z) => {
    if (x < -HALF || x > HALF || z < -HALF || z > HALF) return false;
    return cell(ci(x), ci(z)) && !onBridge(x, z, 2.5);
  };
  const isBlocked = (x, z) => isWet(x, z) || isSolid(x, z);
  const blk = (i, j) => cell(i, j) || sol[idx(i, j)] === 1;
  const clear = (ax, az, bx, bz) => {
    const d = Math.hypot(bx - ax, bz - az), n2 = Math.max(1, Math.ceil(d / 1.6));
    for (let i = 1; i <= n2; i++) {
      const t = i / n2;
      if (isBlocked(ax + (bx - ax) * t, az + (bz - az) * t)) return false;
    }
    return true;
  };
  const nearestDry = (x, z, maxR = 60) => {
    if (!isBlocked(x, z)) return [x, z];
    const i0 = ci(x), j0 = ci(z), R = Math.ceil(maxR / CELL);
    let best = null, bd = 1e9;
    for (let r = 1; r <= R; r++) {
      for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const i = i0 + di, j = j0 + dj;
        if (i < 0 || j < 0 || i >= N5 || j >= N5 || blk(i, j)) continue;
        const d = Math.hypot(cc(i) - x, cc(j) - z);
        if (d < bd) {
          bd = d;
          best = [cc(i), cc(j)];
        }
      }
      if (best) return best;
    }
    return [x, z];
  };
  const comp = new Int32Array(N5 * N5);
  let compN = 0, compDone = false;
  const inR = (i, j) => {
    const x = cc(i), z = cc(j);
    return x * x + z * z < 330 * 330;
  };
  const label = () => {
    if (compDone) return;
    const stack = new Int32Array(N5 * N5);
    for (let j = 0; j < N5; j++) for (let i = 0; i < N5; i++) {
      const k0 = idx(i, j);
      if (comp[k0] || !inR(i, j) || blk(i, j) || state[k0] === 3) continue;
      compN++;
      let sp = 0;
      stack[sp++] = k0;
      comp[k0] = compN;
      while (sp) {
        const k = stack[--sp], ki = k % N5, kj = k / N5 | 0;
        for (let d = 0; d < 4; d++) {
          const ni = ki + (d === 0 ? 1 : d === 1 ? -1 : 0), nj = kj + (d === 2 ? 1 : d === 3 ? -1 : 0);
          if (ni < 0 || nj < 0 || ni >= N5 || nj >= N5) continue;
          const nk = idx(ni, nj);
          if (comp[nk] || !inR(ni, nj) || blk(ni, nj) || state[nk] === 3) continue;
          comp[nk] = compN;
          stack[sp++] = nk;
        }
      }
    }
    compDone = true;
  };
  const regionOf = (x, z) => {
    label();
    const [dx, dz] = isBlocked(x, z) ? nearestDry(x, z, 40) : [x, z];
    const k = idx(ci(dx), ci(dz));
    return state[k] === 3 ? 0 : comp[k];
  };
  let nodesTotal = 0;
  const gS = new Float32Array(N5 * N5), stamp = new Int32Array(N5 * N5), from = new Int32Array(N5 * N5), closed = new Int32Array(N5 * N5);
  let gen = 0;
  const heap = [];
  const push = (f, k) => {
    heap.push(f, k);
    let i = heap.length / 2 - 1;
    while (i > 0) {
      const p = i - 1 >> 1;
      if (heap[p * 2] <= heap[i * 2]) break;
      const tf = heap[p * 2], tk = heap[p * 2 + 1];
      heap[p * 2] = heap[i * 2];
      heap[p * 2 + 1] = heap[i * 2 + 1];
      heap[i * 2] = tf;
      heap[i * 2 + 1] = tk;
      i = p;
    }
  };
  const pop = () => {
    const k = heap[1], n2 = heap.length / 2 - 1;
    heap[0] = heap[n2 * 2];
    heap[1] = heap[n2 * 2 + 1];
    heap.length -= 2;
    let i = 0;
    for (; ; ) {
      let l = i * 2 + 1, r = l + 1, m = i;
      if (l < n2 && heap[l * 2] < heap[m * 2]) m = l;
      if (r < n2 && heap[r * 2] < heap[m * 2]) m = r;
      if (m === i) break;
      const tf = heap[m * 2], tk = heap[m * 2 + 1];
      heap[m * 2] = heap[i * 2];
      heap[m * 2 + 1] = heap[i * 2 + 1];
      heap[i * 2] = tf;
      heap[i * 2 + 1] = tk;
      i = m;
    }
    return k;
  };
  const DI = [1, -1, 0, 0, 1, 1, -1, -1], DJ = [0, 0, 1, -1, 1, -1, 1, -1], DC = [1, 1, 1, 1, 1.4142, 1.4142, 1.4142, 1.4142];
  const astar = (ax, az, bx, bz, maxNodes) => {
    const [sx, sz] = isBlocked(ax, az) ? nearestDry(ax, az, 30) : [ax, az], [gx, gz] = isBlocked(bx, bz) ? nearestDry(bx, bz, 40) : [bx, bz];
    const si = ci(sx), sj = ci(sz), gi = ci(gx), gj = ci(gz), sk = idx(si, sj), gk = idx(gi, gj);
    gen++;
    heap.length = 0;
    gS[sk] = 0;
    stamp[sk] = gen;
    from[sk] = -1;
    const hh = (i2, j) => {
      const dx = Math.abs(i2 - gi), dz = Math.abs(j - gj);
      return (Math.max(dx, dz) + 0.4142 * Math.min(dx, dz)) * CELL;
    };
    push(hh(si, sj), sk);
    let nodes = 0, found = false;
    while (heap.length && nodes < maxNodes) {
      const k = pop();
      if (closed[k] === gen) continue;
      closed[k] = gen;
      nodes++;
      if (k === gk) {
        found = true;
        break;
      }
      const i2 = k % N5, j = k / N5 | 0;
      for (let d = 0; d < 8; d++) {
        const di = DI[d], dj = DJ[d], ni = i2 + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= N5 || nj >= N5) continue;
        if (blk(ni, nj)) continue;
        if (di && dj && (blk(i2 + di, j) || blk(i2, j + dj))) continue;
        const nk = idx(ni, nj), g = gS[k] + DC[d] * CELL;
        if (stamp[nk] !== gen) {
          stamp[nk] = gen;
          gS[nk] = 1e9;
        }
        if (g < gS[nk]) {
          gS[nk] = g;
          from[nk] = k;
          push(g + hh(ni, nj), nk);
        }
      }
    }
    nodesTotal += nodes;
    if (!found) return null;
    const raw = [];
    for (let k = gk; k !== -1 && k !== void 0; k = from[k]) {
      raw.push([cc(k % N5), cc(k / N5 | 0)]);
      if (k === sk) break;
    }
    raw.reverse();
    raw[raw.length - 1] = [gx, gz];
    const out = [];
    let cur = [ax, az], i = 0;
    while (i < raw.length) {
      let j = raw.length - 1;
      while (j > i && !clear(cur[0], cur[1], raw[j][0], raw[j][1])) j--;
      out.push(raw[j]);
      cur = raw[j];
      i = j + 1;
    }
    return out;
  };
  const groundY = makeGroundY(bridges);
  const route = (ax, az, bx, bz) => {
    const ra = regionOf(ax, az), rb = regionOf(bx, bz), known = ra > 0 && rb > 0;
    const direct = astar(ax, az, bx, bz, 3500);
    if (direct) return direct;
    if (known && ra === rb) return astar(ax, az, bx, bz, 9e3);
    let cand = [];
    for (const b of bridges) for (const s of [1, -1]) {
      const e1 = [b.x + b.nx * s * (b.len / 2 + 1.5), b.z + b.nz * s * (b.len / 2 + 1.5)], e2 = [b.x - b.nx * s * (b.len / 2 + 1.5), b.z - b.nz * s * (b.len / 2 + 1.5)];
      cand.push({ L: Math.hypot(e1[0] - ax, e1[1] - az) + b.len + 3 + Math.hypot(bx - e2[0], bz - e2[1]), e1, e2 });
    }
    cand.sort((p, q) => p.L - q.L);
    if (known) {
      const fit = cand.filter((c) => regionOf(c.e1[0], c.e1[1]) === ra && regionOf(c.e2[0], c.e2[1]) === rb);
      if (fit.length) cand = fit;
    }
    const leg = (x0, z0, x1, z1) => clear(x0, z0, x1, z1) ? [[x1, z1]] : astar(x0, z0, x1, z1, 6e3);
    for (const c of cand.slice(0, 4)) {
      const l1 = leg(ax, az, c.e1[0], c.e1[1]);
      if (!l1) continue;
      const l3 = leg(c.e2[0], c.e2[1], bx, bz);
      if (!l3) continue;
      return l1.concat([c.e2], l3);
    }
    return null;
  };
  const warm = (j0, j1) => {
    for (let j = Math.max(0, j0); j < Math.min(N5, j1); j++) for (let i = 0; i < N5; i++) {
      const x = cc(i), z = cc(j);
      if (x * x + z * z < 330 * 330) cell(i, j);
    }
    if (j1 >= N5) label();
  };
  return { isWet, isBlocked, isSolid, solids, clear, route, nearestDry, groundY, onBridge, bridges, warm, rows: N5, nodes: () => nodesTotal, regionOf };
}

// ../../../../dev/bs_wall.js
var NAVON = !process.env.NONAV;
var NAV = buildNav({ height, bridges: bridgesFromLayout(layout_exports) });
var WETSTEPS = 0;
var ONBRIDGE = 0;
var NOROUTE = 0;
var PINNED = 0;
var U = unitdefs_default.units;
var power = (army, forge = 1) => Object.entries(army).reduce((s, [t, n2]) => s + n2 * Math.sqrt(U[t].hp * U[t].dps) / 3 * (1 + 0.06 * (forge - 1)), 0);
var keepT = basetargets_default.targets.find((t) => t.type === "keep");
var X = (ax, az, bx, bz, cx, cz, dx, dz) => {
  const rx = bx - ax, rz = bz - az, sx = dx - cx, sz = dz - cz, den = rx * sz - rz * sx;
  if (Math.abs(den) < 1e-9) return false;
  const t = ((cx - ax) * sz - (cz - az) * sx) / den, u = ((cx - ax) * rz - (cz - az) * rx) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};
function play(army, ratio2, level, seed, forge, style) {
  const P4 = power(army, forge);
  const spec = { seed, ratio: ratio2, power: Math.round(P4 * ratio2), levels: { keep: level, wall: level, towers: level }, loot: { ruby: 1e3, emerald: 1e3, turq: 1e3 } };
  const sim = createBattle({ spec, army, forge, targets: JSON.parse(JSON.stringify(basetargets_default.targets)), meta: process.env.DEPLOY ? { ...basetargets_default.meta, deploy: { d: +process.env.DEPLOY.split(",")[0], lat: +process.env.DEPLOY.split(",")[1] } } : basetargets_default.meta, nav: NAVON ? NAV : null });
  const g = sim.base.deploy, gx = basetargets_default.meta.gates[0].x, gz = basetargets_default.meta.gates[0].z, order = unitdefs_default.order.filter((u) => army[u] > 0);
  const prio = { giant: 0, tank: 1, infantry: 2, cavalry: 3, siege: 4, ranged: 5, air: 6 }, seq = order.slice().sort((a, b) => prio[U[a].role] - prio[U[b].role]);
  const sendTo = (ty) => {
    const role = U[ty].role;
    if (role === "air") sim.send(ty, keepT.x, keepT.z);
    else if (role === "ranged" || role === "siege") sim.send(ty, gx - g.nx * 14, gz - g.nz * 14);
    else sim.send(ty, gx, gz);
  };
  const walls = sim.buildings.filter((b) => b.ring);
  let t = 0, k = 0, nextSend = 0, cross = 0, first = -1, s2 = 0;
  const dt = 0.1;
  const prev = /* @__PURE__ */ new Map();
  while (!sim.over && t < 185) {
    if (style === "all") {
      if (k === 0) {
        for (const ty of seq) sendTo(ty);
        k = 99;
      }
    } else if (t >= nextSend && k < seq.length) {
      sendTo(seq[k++]);
      nextSend = t + 2.5;
    }
    if (style === "smart" && !s2 && t > 45) {
      s2 = 1;
      for (const ty of seq) sim.send(ty, keepT.x + (k % 3 - 1) * 15, keepT.z);
    }
    const ground = sim.units.filter((u) => !u.air && !u.dead);
    for (const u of ground) prev.set(u.id, [u.x, u.z]);
    const wasAlive = walls.map((w) => !w.dead);
    sim.step(dt);
    t += dt;
    if (process.env.TRACE && Math.abs(t * 10 - Math.round(t * 10)) < 1e-6 && Math.round(t * 10) % 20 === 0 && t > 100) {
      const u = sim.units.find((q) => q.type === "spear" && !q.dead);
      if (u) console.log("  T", t.toFixed(0), "pos", u.x.toFixed(1), u.z.toFixed(1), "go", u.go && [u.go.x | 0, u.go.z | 0], "tgt", u.target && u.target.type, u.target && [u.target.x | 0, u.target.z | 0], "blk", u.block && [u.block.type, u.block.x | 0, u.block.z | 0, u.block.hp | 0], "stuck", (u.stuck || 0).toFixed(1), "bl", u.blocker && [u.blocker.type, u.blocker.x | 0, u.blocker.z | 0], "cd", u.cd.toFixed(1));
    }
    for (const u of ground) {
      if (!u.wade && NAV.isWet(u.x, u.z)) WETSTEPS++;
      if (NAV.onBridge(u.x, u.z)) ONBRIDGE++;
    }
    for (const u of ground) {
      const p = prev.get(u.id);
      if (!p) continue;
      if (process.env.JDBG) {
        const j = Math.hypot(u.x - p[0], u.z - p[1]);
        if (j > 3.2) console.log("   JUMP", u.type, "t", t.toFixed(1), j.toFixed(1), "spd", (u.spd * dt).toFixed(2), "from", p.map((q) => q.toFixed(1)).join(","), "go", u.go && [u.go.x | 0, u.go.z | 0]);
      }
      walls.forEach((w, i) => {
        if (wasAlive[i] && !w.dead && X(p[0], p[1], u.x, u.z, w.a[0], w.a[1], w.b[0], w.b[1])) {
          cross++;
          if (first < 0) first = t;
          if (process.env.XDBG) console.log("   X", u.type, "t", t.toFixed(1), "from", p.map((q) => q.toFixed(1)).join(","), "to", u.x.toFixed(1), u.z.toFixed(1), "wall", w.type, w.x | 0, w.z | 0, "rot", w.rot.toFixed(2), "w", w.w.toFixed(0), "d", w.d, "stuck", (u.stuck || 0).toFixed(1));
        }
      });
    }
  }
  const r = sim.result();
  if (process.env.DBG) {
    const al = {};
    sim.units.filter((u) => !u.dead).forEach((u) => {
      al[u.type] = (al[u.type] || 0) + 1;
    });
    const lt = {};
    sim.buildings.filter((b) => !b.dead && b.value > 0).forEach((b) => {
      lt[b.type] = (lt[b.type] || 0) + 1;
    });
    if (process.env.DBG > 1) sim.units.filter((u) => !u.dead).slice(0, 8).forEach((u) => console.log("   u", u.type, u.x.toFixed(0), u.z.toFixed(0), "go", u.go && [u.go.x | 0, u.go.z | 0], "tgt", u.target && (u.target.type || u.target.side), u.target && [u.target.x | 0, u.target.z | 0, u.target.dead], "blk", u.block && u.block.type, "stuck", (u.stuck || 0).toFixed(1), "bl", u.blocker && u.blocker.type));
    console.log("  DBG style", style, "alive", JSON.stringify(al), "left", JSON.stringify(lt), "des", r.destruction, "t", r.time.toFixed(0), "sim.rest", sim.rest);
  }
  NOROUTE += sim.units.reduce((a, u) => a + (u.noRoute || 0), 0);
  PINNED += sim.units.filter((u) => !u.dead && u.wst > 0.5).length;
  const stuck = sim.units.filter((u) => !u.dead && u.hp > 0).length;
  return { r, cross, first, stuck, left: sim.buildings.filter((b) => !b.dead && b.value > 0).length, wallsLeft: walls.filter((w) => !w.dead).length };
}
var mixes = {
  early: { spear: 12, archer: 6 },
  mid: { spear: 25, sword: 14, archer: 16, cavalry: 4, catapult: 2 },
  late: { spear: 30, sword: 30, guard: 12, archer: 30, cavalry: 8, pegasus: 6, baby: 3, catapult: 5, giant: 3 },
  roster: { spear: 12, sword: 12, guard: 6, archer: 14, cavalry: 5, pegasus: 4, baby: 2, dragon: 1, catapult: 2, giant: 1, imp: 6, mage: 5, ram: 3, cannon: 3, werewolf: 2, trebuchet: 2, hill: 1, shieldmaiden: 1, lord: 1 },
  siegefull: { spear: 20, archer: 20, ram: 4, cannon: 4, trebuchet: 3, catapult: 3, hill: 2, shieldmaiden: 2, lord: 2, mage: 6 }
};
var forges = { early: 1, mid: 4, late: 10, roster: 14, siegefull: 12 };
var lv = { early: 3, mid: 8, late: 14, roster: 16, siegefull: 15 };
var ratio = +(process.argv[2] || 1.15);
var NS = +(process.env.NS || 6);
var tc = 0;
var n = 0;
for (const [name, a] of Object.entries(mixes)) {
  if (process.env.ONLY && process.env.ONLY !== name) continue;
  const res = [];
  for (let s = +process.env.S0 || 1; s <= (+process.env.S0 || 1) + NS - 1; s++) res.push(play(a, ratio, lv[name], s, forges[name], ["smart", "all"][s % 2]));
  const c = res.reduce((s, x) => s + x.cross, 0), des = res.reduce((s, x) => s + x.r.destruction, 0) / res.length, tm = res.reduce((s, x) => s + x.r.time, 0) / res.length;
  const st = [0, 0, 0, 0];
  res.forEach((x) => st[x.r.stars]++);
  console.log(`${name.padEnd(9)} crossings/battle ${(c / NS).toFixed(1).padStart(6)}  first@${res.map((x) => x.first < 0 ? "-" : x.first.toFixed(0)).join(",")}  destr ${des.toFixed(0)}%  time ${tm.toFixed(0)}s  stars ${st.join("/")}  100%:${res.filter((x) => x.r.destruction >= 99.9).length}/${NS}  leftTargets ${res.map((x) => x.left).join(",")} wallsLeft ${res.map((x) => x.wallsLeft).join(",")}`);
  tc += c;
  n += NS;
}
console.log("TOTAL crossings per battle:", (tc / n).toFixed(2), " ground unit-steps in water:", WETSTEPS, " on a bridge:", ONBRIDGE, " noRoute events:", NOROUTE, " pinned at end:", PINNED);
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
