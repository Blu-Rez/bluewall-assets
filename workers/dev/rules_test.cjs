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
function compactBlock(n, sp, margin, rmin) {
  let bestR = 1, bestS = 1e9;
  for (let r = 1; r <= n; r++) {
    const c = Math.ceil(n / r), s = Math.hypot((c - 1) / 2 * sp, (r - 1) / 2 * sp * 0.92 * 1.15);
    if (s < bestS - 1e-9) {
      bestS = s;
      bestR = r;
    }
  }
  const rows = bestR, rel = [];
  for (let rr = 0; rr < rows; rr++) {
    const cnt = Math.floor(n * (rr + 1) / rows) - Math.floor(n * rr / rows);
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
  cx /= n;
  cb /= n;
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
    const d = unitdefs_default.units[type], n = army[type], sp = (d.space >= 8 ? 6.5 : d.space >= 3 ? 3.3 : 2.4) * UR / 1.5, rb = (d.space >= 8 ? 2.4 : d.space >= 3 ? 1.1 : 0.75) * UR, cb = compactBlock(n, sp, ringMargin(rb, u), RMIN), tier = tierOf(type);
    return { type, d, n, sp, tier, g: tier <= 1 ? 0 : tier <= 3 ? 1 : 2, ...cb, w: 2 * cb.R, depth: 2 * cb.R };
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
          let ok2 = true;
          for (let k = 0; k < placed.length; k++) {
            const p = placed[k], dx = p.l - l, dz = p.b - b, m = p.it.R + R + GAPR - 1e-6;
            if (dx * dx + dz * dz < m * m) {
              ok2 = false;
              break;
            }
          }
          if (ok2) for (let k = 0; k < obstacles.length; k++) {
            const o = obstacles[k], dx = o[0] - l, dz = o[1] - b, m = o[2] + R + OBST_CLEAR;
            if (dx * dx + dz * dz < m * m) {
              ok2 = false;
              break;
            }
          }
          if (!ok2) continue;
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
  const n = 10 + Math.floor(L / 5), Rr = 30 + L * 0.55, verts = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI / 2 + i / n * Math.PI * 2 + (R() - 0.5) * 0.12, r = Rr * (0.93 + R() * 0.14);
    verts.push([Math.cos(a) * r, Math.sin(a) * r * 0.86 - 4]);
  }
  const gateEdge = 0;
  verts.sort((p, q) => Math.atan2(p[1] + 4, p[0]) - Math.atan2(q[1] + 4, q[0]));
  let gi = 0, best = -1e9;
  for (let i = 0; i < n; i++) {
    const a = verts[i], b2 = verts[(i + 1) % n], zc = (a[1] + b2[1]) / 2;
    if (zc > best) {
      best = zc;
      gi = i;
    }
  }
  const walls = [];
  for (let i = 0; i < n; i++) {
    const a = verts[i], b2 = verts[(i + 1) % n], len = hyp(b2[0] - a[0], b2[1] - a[1]), rot = Math.atan2(-(b2[1] - a[1]), b2[0] - a[0]);
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
  const inside = (x, z) => hyp(x / (Rr * 0.82), (z + 4) / (Rr * 0.7)) < 1;
  const fill = [["barracks", 1 + (L >= 8 ? 1 : 0) + (L >= 15 ? 1 : 0)], ["forge", L >= 6 ? 1 : 0], ["store", 1 + (L >= 10 ? 1 : 0)], ["house", 4 + Math.floor(L / 3)]];
  for (const [type, cnt] of fill) for (let k = 0, tries = 0; k < cnt && tries < 300; tries++) {
    const x = (R() - 0.5) * Rr * 1.6, z = -4 + (R() - 0.5) * Rr * 1.3;
    if (inside(x, z) && free(x, z, 6)) {
      add(type, x, z, R() * 6.28 - 3.14, {});
      k++;
    }
  }
  const sum = B.reduce((s, b) => s + b.share, 0), HP = TUNE.hp * D * (0.9 + 0.2 * (L / MAXL));
  for (const b of B) {
    b.maxHp = b.hp = Math.round(HP * b.share / sum);
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
function teslaSpots(T, meta, n) {
  n = Math.max(0, Math.min(4, n | 0));
  if (!n || !meta || !meta.gates || !meta.gates.length) return [];
  const g = meta.gates[0];
  return T.filter((t) => t.type === "ballista").map((t) => [t.id, hyp(t.x - g.x, t.z - g.z)]).sort((a, b) => a[1] - b[1]).slice(0, n).map((a) => a[0]);
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
var gPow = (g) => Object.entries(g).reduce((q, [k, n]) => q + n * Math.sqrt(unitdefs_default.units[k].hp * unitdefs_default.units[k].dps) / 3, 0);
var guardianFrac = (g) => {
  const full = gPow(guardianSlots(MAXL));
  return full > 0 ? Math.min(1, gPow(g) / full) * TUNE.gfrac : 0;
};
function makeBaseFromTargets(spec, T, meta) {
  const R = mulberry(spec.seed | 0), L = Math.max(1, Math.min(MAXL, spec.levels.keep | 0)), D0 = Math.max(40, spec.power || 100), US = TUNE.us, UR = TUNE.ur;
  const guard = (() => {
    const o = {}, src = spec.guard && typeof spec.guard === "object" ? spec.guard : guardianSlots(L);
    for (const [k, n] of Object.entries(src)) if (unitdefs_default.guardians && unitdefs_default.guardians[k] && n > 0) o[k] = Math.min(8, n | 0);
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
  const hs = (b) => b.share * (b.def ? TUNE.defHP * (TUNE["hpw_" + b.dk] ?? 1) : 1), sum = B.reduce((s, b) => s + hs(b), 0), HP = TUNE.hp * D * (0.9 + 0.2 * (L / MAXL));
  for (const b of B) {
    b.maxHp = b.hp = Math.round(HP * hs(b) / sum);
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
  const kinds2 = [];
  {
    const nA = Math.round(nG * MIX.archer), nH = Math.round(nG * MIX.heavy), nR = Math.round(nG * MIX.reserve);
    for (let i = 0; i < nG; i++) kinds2.push(i < nH ? "heavy" : i < nH + nR ? "reserve" : i < nH + nR + nA ? "archer" : "guard");
  }
  const HPW = { guard: 1, archer: 0.7, heavy: 3.5, reserve: TUNE.rhp }, DPW = { guard: 1, archer: 1.2, heavy: 2.5, reserve: TUNE.rdps };
  const sHP = kinds2.reduce((q, k) => q + HPW[k], 0), sDP = kinds2.reduce((q, k) => q + DPW[k], 0);
  const totHP = 45e-4 * D * 160 * (1 + L / MAXL), totDps = (1 - TUNE.tower) * dps, defenders = [];
  let ip = 0, io = 0;
  for (let i = 0; i < nG; i++) {
    const k = kinds2[i], res = k === "reserve" && outer.length;
    const [px, pz, pr] = res ? outer[io++ % outer.length] : posts[ip++ % posts.length], a = R() * 6.28, r = 3 + R() * pr, x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
    const arch = k === "archer", hp = Math.max(30, totHP * HPW[k] / sHP);
    defenders.push({ side: "D", type: arch ? "archer" : "guard", kind: k, x, z, hx: x, hz: z, hp, maxHp: hp, dps: totDps * DPW[k] / sDP, rng: arch ? 24 * US : 0, spd: (k === "reserve" ? TUNE.rsp : 1) * TUNE.sp, r: 0.8 * UR, air: false, hunter: k === "reserve" || k === "heavy" || k === "guard" && TUNE.hall > 0, role: arch ? "ranged" : "infantry", size: k === "heavy" ? "heavy" : "light", leash: res ? 24 * US : arch ? 0 : TUNE.leash * US, cd: 0 });
  }
  {
    const wsel = gPow(guard), k = wsel > 0 ? Math.max(0.3, gFrac * D0 / wsel) : 0, kp = keep || { x: 0, z: 0 };
    let gi = 0;
    for (const [type, n] of Object.entries(guard)) for (let i = 0; i < n; i++, gi++) {
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
function createBattle({ spec, army, forge = 1, lv = {}, spells = {}, targets = null, meta = null, nav = null }) {
  const R = mulberry((spec.seed | 0) ^ 2654435769);
  const base = targets ? makeBaseFromTargets(spec, targets, meta) : makeBase(spec), B = base.buildings, DEF = base.defenders;
  const US = base.us || 1, UR = base.ur || 1, FLD = base.field || FIELD;
  const mult = 1 + 0.06 * Math.max(0, forge - 1);
  const units = [];
  let uid = 1;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const dp = base.deploy, tx0 = dp ? -dp.nz : 1, tz0 = dp ? dp.nx : 0;
  const plan = planArmy(army, UR, !!dp, dp && nav && nav.solids ? toFrame(nav.solids, dp) : []), types = plan.types;
  for (const type of types) {
    const d = unitdefs_default.units[type], P = plan.pos[type];
    for (let k = 0; k < P.length; k++) {
      const lat = P[k][0], back = P[k][1];
      const x = dp ? dp.x + tx0 * lat + dp.nx * back : lat, z = dp ? dp.z + tz0 * lat + dp.nz * back : FIELD.line + 4 + back;
      const known = !!(lv && lv[d.fam]), L = Math.max(1, Math.min(MAXL, (lv && lv[d.fam]) | 0 || 1)), tier = known ? unitTier(L) : 1, km = mult * lvlMult(L);
      units.push({
        id: uid++,
        side: "A",
        type,
        x,
        z,
        hp: d.hp * km,
        maxHp: d.hp * km,
        dps: d.dps * km * (known && tier >= 4 ? 1.15 : 1),
        rng: d.rng * US * (d.role === "siege" ? TUNE.srng : 1),
        spd: d.spd * 3.1 * TUNE.sp * (known && tier >= 3 ? 1.1 : 1),
        lv: L,
        tier,
        armor: known && tier >= 2 ? 0.9 : 1,
        ls: known && tier >= 5,
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
  const NAV = nav;
  const alive = (a) => !a.dead && a.hp > 0;
  const CELL = 10, GK = (i, j) => (i + 1024) * 2048 + (j + 1024), gA = /* @__PURE__ */ new Map(), gD = /* @__PURE__ */ new Map();
  const gbuild = (g, list) => {
    g.clear();
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (o.dead || o.air) continue;
      const key = GK(Math.floor(o.x / CELL), Math.floor(o.z / CELL)), c = g.get(key);
      if (c) c.push(o);
      else g.set(key, [o]);
    }
  };
  const ev = (o) => sim.events.push(o);
  const defAir = DEF.filter((e) => e.air);
  const foeNear = (u, Rr) => {
    let best = null;
    const i0 = Math.floor((u.x - Rr) / CELL), i1 = Math.floor((u.x + Rr) / CELL), j0 = Math.floor((u.z - Rr) / CELL), j1 = Math.floor((u.z + Rr) / CELL);
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
  const PGI = Math.floor(FLD.x0 / CELL) - 3, PGJ = Math.floor(FLD.z0 / CELL) - 3, PNI = Math.floor(FLD.x1 / CELL) - PGI + 4, PNJ = Math.floor(FLD.z1 / CELL) - PGJ + 4;
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
      const ci = Math.floor(u.x / CELL) - PGI, cj = Math.floor(u.z / CELL) - PGJ;
      if (ci < 0 || cj < 0 || ci >= PNI || cj >= PNJ) {
        pk.far.push(u);
        continue;
      }
      const idx = ci * PNJ + cj;
      let c = pk.cells[idx];
      if (!c) c = pk.cells[idx] = [];
      if (!c.length) pk.used.push(idx);
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
    let n = 0;
    for (const g of GUNS) if (!g.dead && hyp(g.x - b.x, g.z - b.z) < g.rng) n++;
    b.covV = coverV;
    return b.cov = n;
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
    const ci = Math.floor(d.x / CELL), cj = Math.floor(d.z / CELL);
    let done = false;
    for (let k = 0; k < pk.far.length; k++) consider(pk.far[k]);
    const cell = (i, j) => {
      i -= PGI;
      j -= PGJ;
      if (i < 0 || j < 0 || i >= PNI || j >= PNJ) return;
      const c = pk.cells[i * PNJ + j];
      if (c !== null && c.length) for (let k = 0; k < c.length; k++) consider(c[k]);
    };
    const need = Math.max(28 * US, (d.leash || 0) + hyp(d.x - d.hx, d.z - d.hz), hunter ? huntR() + hyp(d.x - d.hx, d.z - d.hz) : 0), rmax = Math.ceil(need / CELL) + 1;
    if (rmax <= 7) {
      for (let r = 0; r <= rmax && !done; r++) {
        if (r === 0) cell(ci, cj);
        else {
          for (let j = cj - r; j <= cj + r; j++) {
            cell(ci - r, j);
            cell(ci + r, j);
          }
          for (let i = ci - r + 1; i <= ci + r - 1; i++) {
            cell(i, cj - r);
            cell(i, cj + r);
          }
        }
        if (best && bd < r * CELL) done = true;
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
    const len = hyp(nx - ox, nz - oz), n = Math.max(1, Math.ceil(len / 0.5));
    let px = ox, pz = oz;
    for (let i = 1; i <= n; i++) {
      let qx = px + (nx - ox) / n, qz = pz + (nz - oz) / n;
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
      const g = u.side === "D" ? gD : gA, ci = Math.floor(u.x / CELL), cj = Math.floor(u.z / CELL);
      for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
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
      const closed = NAV ? u.wade ? NAV.isSolid : NAV.isBlocked : null;
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
    if (!NAV || u.air || u.wade) return [gx, gz];
    let r = u.rt;
    if (r && (Math.abs(r.gx - gx) + Math.abs(r.gz - gz) > 8 || sim.time > r.exp)) r = u.rt = null;
    if (!r) {
      if (sim.time < (u.navT || 0) || navBudget <= 0) return [gx, gz];
      u.navT = sim.time + 0.35 + R() * 0.25;
      if (NAV.clear(u.x, u.z, gx, gz)) return [gx, gz];
      let pts = null;
      for (const c of rcache) if (c.exp > sim.time && Math.abs(c.gx - gx) + Math.abs(c.gz - gz) < 6 && hyp(c.sx - u.x, c.sz - u.z) < 9 && NAV.clear(u.x, u.z, c.pts[0][0], c.pts[0][1])) {
        pts = c.pts;
        break;
      }
      if (!pts) {
        const n0 = NAV.nodes ? NAV.nodes() : 0;
        pts = NAV.route(u.x, u.z, gx, gz);
        navBudget -= Math.max(80, (NAV.nodes ? NAV.nodes() : 0) - n0);
        if (pts) {
          rcache.push({ gx, gz, sx: u.x, sz: u.z, pts, exp: sim.time + 8 });
          if (rcache.length > 40) rcache.shift();
        }
      }
      if (!pts) {
        u.navT = sim.time + 2;
        u.noRoute = (u.noRoute || 0) + 1;
        if (typeof process !== "undefined" && process.env && process.env.XNAV && u.noRoute < 2) console.log("NOROUTE", u.type, u.x.toFixed(0), u.z.toFixed(0), "->", gx.toFixed(0), gz.toFixed(0), "goalWet", NAV.isWet(gx, gz), "startWet", NAV.isWet(u.x, u.z), "t", sim.time.toFixed(0));
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
      const T3 = u.type === "dragon3" || u.type === "baby3", big = u.type === "dragon" || u.type === "dragon3", shadow = u.shadowUntil > sim.time;
      const dd = (big ? TUNE.brD * (T3 ? 1.2 : 1) : u.type === "dragonling" ? TUNE.brL : TUNE.brB * (u.type === "baby3" ? 1.25 : u.type === "darkrider" ? 1.35 : 1)) * UR * (shadow ? 1.6 : 1);
      const heads = T3 ? 3 : 1, per = (big ? 1.2 : 1) * (shadow ? 2 : 1) * (T3 ? 0.4 : 1), side = [0, -1, 1], ang = Math.atan2(t.x - u.x, t.z - u.z), px = Math.cos(ang), pz = -Math.sin(ang);
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
      const ci = Math.floor(u.x / CELL), cj = Math.floor(u.z / CELL);
      for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
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
        const off = i * 0.17;
        queue(off, () => ev({ k: "shot", kind: b.kind, from: [b.x, b.h + 1, b.z], to: [tx, 1.2, tz], t: b.flight, b: b.id, q: i }));
        queue(off + b.flight, () => splashAt(tx, tz, b.splash, per, "D", null, src, { ground: true, mult: M }));
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
    let n = 0;
    let cx = Math.max(FLD.x0 + 4, Math.min(FLD.x1 - 4, x)), cz = Math.max(FLD.z0 + 4, Math.min(FLD.z1 - 4, z));
    let list = units.filter((u) => u.type === type && alive(u) && (HEROES[type] || !u.active));
    if (opt && opt.half && !HEROES[type] && list.length > 1) list = list.map((u) => [hyp(u.x - cx, u.z - cz), u]).sort((a, b) => a[0] - b[0] || a[1].id - b[1].id).slice(0, Math.ceil(list.length / 2)).map((e) => e[1]);
    const cols = Math.max(2, Math.ceil(Math.sqrt(list.length))), fly = list.length > 0 && !!list[0].air;
    if (NAV && !fly && NAV.isBlocked(cx, cz)) [cx, cz] = NAV.nearestDry(cx, cz);
    if (HEROES[type]) {
      list.forEach((u, k) => {
        u.active = true;
        u.target = null;
        u.block = null;
        u.focus = null;
        const gx = cx + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 3 * UR, gz = cz;
        const g = NAV && NAV.isBlocked(gx, gz) ? NAV.nearestDry(gx, gz) : [gx, gz];
        u.go = { x: g[0], z: g[1] };
        u.hold = { x: g[0], z: g[1] };
        u.rt = null;
        n++;
      });
      return n;
    }
    list.forEach((u, k) => {
      u.active = true;
      u.target = null;
      u.block = null;
      u.focus = null;
      const gx = cx + (k % cols - (cols - 1) / 2) * 1.6 * UR, gz = cz + (Math.floor(k / cols) - cols / 2) * 1.6 * UR;
      u.go = NAV && !fly && NAV.isWet(gx, gz) ? (([x2, z2]) => ({ x: x2, z: z2 }))(NAV.nearestDry(gx, gz)) : { x: gx, z: gz };
      u.rt = null;
      n++;
    });
    return n;
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
    let n = 0;
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
      n++;
    }
    return n;
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

// ../../../../dev/rules_test.js
var bad = 0;
var ok = (c, m) => {
  if (!c) {
    bad++;
    console.log("FAIL", m);
  } else console.log("ok  ", m);
};
var mkSim = (army, seed = 5) => createBattle({ spec: { seed, ratio: 1, power: 4e3, levels: { keep: 6, wall: 6, towers: 6 }, loot: { ruby: 1e3, emerald: 1e3, turq: 1e3 } }, army, forge: 1, targets: JSON.parse(JSON.stringify(basetargets_default.targets)), meta: basetargets_default.meta });
var run = (sim, secs, dt = 0.1) => {
  for (let t = 0; t < secs; t += dt) sim.step(dt);
};
var hash = (sim) => sim.units.map((u) => u.type[0] + Math.round(u.x * 10) + ":" + Math.round(u.z * 10) + ":" + Math.round(u.hp)).join("|");
{
  const sim = mkSim({ spear: 6, archer: 4, shieldmaiden: 1 });
  const g = sim.base.deploy, gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
  ok(sim.canSend("spear") && sim.canSend("shieldmaiden") && !sim.canSend("lord"), "before any order: spears and the maiden can be sent, no lord in the army");
  const n1 = sim.send("spear", gx, gz);
  ok(n1 === 6, "first send moves all 6 spears (" + n1 + ")");
  ok(!sim.canSend("spear"), "a sent soldier squad cannot be sent again (canSend)");
  run(sim, 2);
  const before = sim.units.filter((u) => u.type === "spear").map((u) => [u.go && u.go.x, u.go && u.go.z]);
  const n2 = sim.send("spear", gx + 30, gz + 30);
  ok(n2 === 0, "second send is refused (0 units)");
  const after = sim.units.filter((u) => u.type === "spear").map((u) => [u.go && u.go.x, u.go && u.go.z]);
  ok(JSON.stringify(before) === JSON.stringify(after), "the spears keep their first destination");
  const keep = sim.buildings.find((b) => !b.dead && b.type === "keep") || sim.buildings.find((b) => !b.dead);
  ok(sim.focus("spear", keep) === 0, "a focus order on a sent squad is refused too");
  ok(sim.focus("archer", keep) === 4 && !sim.canSend("archer"), "a focus order is the first (and only) order of a fresh squad");
  const h1 = sim.send("shieldmaiden", gx, gz), h2 = sim.send("shieldmaiden", gx + 20, gz);
  ok(h1 === 1 && h2 === 1 && sim.canSend("shieldmaiden"), "a hero can be sent again and again");
}
{
  const sim = mkSim({ spear: 6 });
  const g = sim.base.deploy, gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
  const a = sim.send("spear", gx, gz, { half: true }), b = sim.send("spear", gx + 10, gz, { half: true }), c = sim.send("spear", gx + 10, gz);
  ok(a === 3 && b === 2 && c === 1, "half orders hand out each soldier its single order: 3 + 2 + 1 (" + [a, b, c] + ")");
}
{
  const go = () => {
    const sim = mkSim({ spear: 8, archer: 6, cavalry: 4, shieldmaiden: 1 }, 11);
    const g = sim.base.deploy, gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
    sim.send("spear", gx, gz);
    sim.send("archer", gx - g.nx * 14, gz - g.nz * 14);
    run(sim, 20);
    sim.send("spear", gx + 25, gz);
    sim.send("cavalry", gx, gz);
    sim.send("shieldmaiden", gx + 5, gz);
    run(sim, 40);
    return hash(sim);
  };
  ok(go() === go(), "two runs of the same battle (incl. a refused re-send) end identical");
}
{
  const sim = mkSim({ shieldmaiden: 3, lord: 3, spear: 4 });
  const g = sim.base.deploy, gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
  const n = sim.send("shieldmaiden", gx, gz);
  ok(n === 3, "one send moves all 3 maidens (" + n + ")");
  const xs = sim.units.filter((u) => u.type === "shieldmaiden").map((u) => Math.round(u.hold.x * 10) / 10);
  ok(new Set(xs).size === 3, "the three maidens stand apart (a row): " + xs);
  ok(sim.send("lord", gx + 10, gz) === 3 && sim.send("lord", gx + 20, gz) === 3, "three lords can be sent again and again");
  const st = sim.abilityState("shieldmaiden");
  ok(st.n === 3 && st.sent && st.ready, "ability state: 3 maidens, sent, ready");
  run(sim, 1);
  sim.events.length = 0;
  ok(sim.ability("shieldmaiden") === true, "one press uses the ability");
  const ev = sim.events.filter((e) => e.k === "ability");
  ok(ev.length === 3 && new Set(ev.map((e) => e.id)).size === 3, "it fires for all 3 maidens (" + ev.length + " events)");
  ok(sim.ability("shieldmaiden") === false, "a second press during the cooldown does nothing (shared cooldown)");
  ok(sim.ability("lord") === true, "the lords have their own cooldown");
  const guard = sim.units.filter((u) => u.type === "shieldmaiden" && u.guardUntil > sim.time).length;
  ok(guard === 3, "all 3 maidens guard (" + guard + ")");
}
var mkL = (army, L, seed = 5, extra = {}) => createBattle({ spec: { seed, ratio: 1, power: 4e3, levels: { keep: L, wall: L, towers: L }, loot: { ruby: 1e3, emerald: 1e3, turq: 1e3 }, ...extra }, army, forge: 1, targets: JSON.parse(JSON.stringify(basetargets_default.targets)), meta: basetargets_default.meta });
{
  const sim = mkSim({ captain: 3, gryphonknight: 3, darkrider: 3, spear: 6 });
  const g = sim.base.deploy, gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
  ok(["captain", "shieldmaiden", "lord", "gryphonknight", "darkrider"].every((t) => sim.isHero(t)) && !sim.isHero("ogre"), "five hero types: captain / shieldmaiden / lord / gryphon knight / dark rider");
  ok(sim.send("captain", gx, gz) === 3 && sim.send("gryphonknight", gx + 8, gz) === 3 && sim.send("darkrider", gx + 16, gz) === 3, "each hero squad: one send moves all 3");
  ok(sim.units.filter((u) => ["captain", "gryphonknight", "darkrider"].includes(u.type)).every((u) => u.hero), "the new hero units carry the hero flag (manual: they hold the spot)");
  sim.send("spear", gx + 4, gz);
  run(sim, 6);
  ok(sim.ability("captain") === true && sim.units.filter((u) => u.type === "spear" && u.bannerUntil > sim.time).length === 6, "Banner: every spear nearby is inspired");
  ok(sim.ability("captain") === false, "Banner: shared cooldown");
  ok(sim.ability("darkrider") === true && sim.units.filter((u) => u.type === "darkrider" && u.shadowUntil > sim.time).length === 3, "Shadow Breath: all three dark riders");
  const L0 = sim.units.length;
  sim.events.length = 0;
  const gk = sim.ability("gryphonknight");
  ok(gk === false || sim.pending.length > 0, "Dive Strike: needs a foe within 40 m \u2014 " + (gk ? "it dived" : "nobody near, nothing spent"));
}
{
  const sim = mkL({ gryphonknight: 2 }, 12);
  const g = sim.base.deploy, d0 = sim.defenders[0];
  for (const u of sim.units) {
    u.x = d0.x + 6;
    u.z = d0.z;
    u.active = true;
    u.hold = { x: u.x, z: u.z };
  }
  const hp0 = d0.hp, ok1 = sim.ability("gryphonknight");
  run(sim, 1.2);
  ok(ok1 === true && sim.stats.dealt.gryphonknight, "Dive Strike lands a blast (" + JSON.stringify(sim.stats.dealt.gryphonknight || null) + ")");
}
{
  const sim = mkL({ treant: 1 }, 25), u = sim.units[0];
  u.active = true;
  u.hp = u.maxHp * 0.5;
  const h0 = u.hp;
  sim.step(1);
  sim.step(1);
  ok(u.hp > h0 + u.maxHp * 0.02, "a treant regrows (" + Math.round(h0) + " -> " + Math.round(u.hp) + ")");
}
{
  const sim = mkL({ dragon3: 1, baby3: 1, dragon: 1 }, 30), heads = {};
  for (const u of sim.units) {
    u.active = true;
    u.go = null;
    u.x = sim.base.deploy.x - sim.base.deploy.nx * 20;
    u.z = sim.base.deploy.z - sim.base.deploy.nz * 20;
  }
  for (let t = 0; t < 40; t += 0.1) {
    sim.step(0.1);
    for (const e of sim.events) if (e.k === "breath") {
      const ty = sim.units.find((u) => u.id === e.u);
      if (ty) {
        const k = ty.type;
        (heads[k] = heads[k] || /* @__PURE__ */ new Set()).add(e.head | 0);
      }
    }
  }
  ok(heads.dragon3 && heads.dragon3.size === 3 && heads.baby3 && heads.baby3.size === 3 && heads.dragon && heads.dragon.size === 1, "three-headed dragons breathe with heads 0,1,2; the normal dragon with one (" + Object.keys(heads).map((k) => k + ":" + [...heads[k]]).join(" ") + ")");
}
var kinds = (L, profile) => {
  const sim = mkL({ spear: 1 }, L, 5, { profile: profile || "balanced" });
  const c = {};
  for (const b of sim.buildings) if (b.def && b.dk) c[b.dk] = (c[b.dk] || 0) + 1;
  return { c, sim };
};
{
  const a = kinds(10), b = kinds(18), c = kinds(22), d = kinds(23), e = kinds(30);
  ok(!a.c.frost && !a.c.flame && !a.c.dragonbane, "level 10: none of the new defences (" + JSON.stringify(a.c) + ")");
  ok(b.c.frost === 1 && !b.c.flame && !b.c.dragonbane, "level 18: the first Frost Spire (" + JSON.stringify(b.c) + ")");
  ok(c.c.flame === 1 && c.c.frost >= 1, "level 22: the first Flame Tower (" + JSON.stringify(c.c) + ")");
  ok(d.c.dragonbane === 1, "level 23: the first Dragonbane (" + JSON.stringify(d.c) + ")");
  ok(e.c.frost === 3 && e.c.flame === 3 && e.c.dragonbane === 3, "level 30: 3 + 3 + 3 (" + JSON.stringify(e.c) + ")");
  const unmanned = a.sim.buildings.filter((q) => q.off && q.why === "level" && q.type === "tower" && q.def);
  ok(unmanned.length >= 3 && unmanned.every((q) => q.dk === "tower"), "level 10: the frost / flame sites keep shooting arrows (still defences, model hidden): " + unmanned.length);
  const r = kinds(30, "arrows");
  ok(!r.c.frost && !r.c.flame && !r.c.dragonbane && !r.c.wizard && !r.c.cannon, "an arrows-only castle at 30 has only arrow towers (" + JSON.stringify(r.c) + ")");
}
{
  const sim = mkL({ spear: 2 }, 30);
  const fr = sim.buildings.find((b) => b.dk === "frost" && b.def);
  const u = sim.units[0];
  u.active = true;
  u.x = fr.x + 15;
  u.z = fr.z;
  u.go = null;
  let slowed = false;
  for (let t = 0; t < 8; t += 0.1) {
    sim.step(0.1);
    if (u.slowUntil > sim.time) {
      slowed = true;
      break;
    }
  }
  ok(slowed && u.slowK === 0.5, "the frost spire slows what it hits (x" + u.slowK + ")");
}
console.log(bad ? "RULES FAILED" : "RULES OK");
process.exit(bad ? 1 : 0);
