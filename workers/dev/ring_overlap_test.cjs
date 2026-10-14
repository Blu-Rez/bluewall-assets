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
var ringMargin = (rb, u2 = 1) => 0.5 * rb + 1.2 * u2;
function compactBlock(n, sp, margin, rmin) {
  let bestR = 1, bestS = 1e9;
  for (let r = 1; r <= n; r++) {
    const c = Math.ceil(n / r), s = Math.hypot((c - 1) / 2 * sp, (r - 1) / 2 * sp * 0.92 * 1.15);
    if (s < bestS - 1e-9) {
      bestS = s;
      bestR = r;
    }
  }
  const rows2 = bestR, rel = [];
  for (let rr = 0; rr < rows2; rr++) {
    const cnt = Math.floor(n * (rr + 1) / rows2) - Math.floor(n * rr / rows2);
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
  return { pts, rows: rows2, cols: rel[0], R: Math.max(rmin, far + margin) };
}
var OBST_CLEAR = 3.5;
function planArmy(army, UR2 = 1, deployed = true, obstacles = []) {
  const types = unitdefs_default.order.filter((u3) => army[u3] > 0).sort((a, b) => tierOf(a) - tierOf(b) || rankOf(b) - rankOf(a) || unitdefs_default.order.indexOf(a) - unitdefs_default.order.indexOf(b));
  const u2 = UR2 / 2, K = deployed ? 1 : 0.5, GAPR = RING_GAP * u2, RMIN = 4.5 * u2;
  const items = types.map((type) => {
    const d = unitdefs_default.units[type], n = army[type], sp = (d.space >= 8 ? 6.5 : d.space >= 3 ? 3.3 : 2.4) * UR2 / 1.5, rb = (d.space >= 8 ? 2.4 : d.space >= 3 ? 1.1 : 0.75) * UR2, cb = compactBlock(n, sp, ringMargin(rb, u2), RMIN), tier = tierOf(type);
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

// ../../../../dev/ring_overlap_test.js
var fails = 0;
var ok = (c, m) => {
  console.log((c ? "ok   " : "FAIL ") + m);
  if (!c) fails++;
};
var UR = 2;
var u = UR / 2;
var rbOf = (t) => {
  const d = unitdefs_default.units[t];
  return (d.space >= 8 ? 2.4 : d.space >= 3 ? 1.1 : 0.75) * UR;
};
var ringsOf = (p) => {
  const R = {};
  for (const t of p.types) {
    const P = p.pos[t];
    let cx = 0, cz = 0;
    for (const q of P) {
      cx += q[0];
      cz += q[1];
    }
    cx /= P.length;
    cz /= P.length;
    let far = 0;
    for (const q of P) far = Math.max(far, Math.hypot(q[0] - cx, q[1] - cz));
    R[t] = { cx, cz, r: Math.max(4.5 * u, far + ringMargin(rbOf(t), u)) };
  }
  return R;
};
var gaps = (p) => {
  const R = ringsOf(p), ts = p.types;
  let min = 1e9, bad = 0;
  for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) {
    const A = R[ts[i]], B = R[ts[j]], g = Math.hypot(A.cx - B.cx, A.cz - B.cz) - A.r - B.r;
    min = Math.min(min, g);
    if (g < 0) bad++;
  }
  return { min, bad, R };
};
var fullMax = { spear: 61, sword: 61, guard: 21, archer: 69, cavalry: 23, pegasus: 13, baby: 5, dragon: 1, catapult: 7, giant: 3, imp: 17, mage: 14, ram: 6, cannon: 6, werewolf: 5, trebuchet: 4, hill: 2, shieldmaiden: 3, lord: 3, legionary: 43, captain: 3, ogre: 2, gryphon: 3, lich: 3, treant: 2, gryphonknight: 1, darkrider: 1, baby3: 1, dragon3: 1 };
var sets = { small: { spear: 30, sword: 20, archer: 20, cavalry: 8 }, mid: { spear: 60, sword: 40, archer: 40, cavalry: 15, giant: 3, dragon: 1, catapult: 4, mage: 8 }, giants: { giant: 4, spear: 20, ram: 4, catapult: 3 }, "his full army": fullMax, one: { spear: 7 }, "only monsters": { giant: 9, dragon: 5, ogre: 4, treant: 4, gryphon: 6 } };
for (const [name, a] of Object.entries(sets)) {
  const p = planArmy(a, UR, true), g = gaps(p);
  ok(g.bad === 0 && (g.min >= 1.2 || p.types.length < 2), `${name}: no two rings touch (${p.types.length} rings, smallest gap ${p.types.length > 1 ? g.min.toFixed(2) : "-"} m, ${p.width.toFixed(0)} x ${p.depth.toFixed(0)} m)`);
}
var seed = 12345;
var rnd = () => {
  seed = Math.imul(seed, 1664525) + 1013904223 >>> 0;
  return seed / 4294967296;
};
var worst = 1e9;
var badSets = 0;
var N = 300;
for (let k = 0; k < N; k++) {
  const a = {};
  for (const t of unitdefs_default.order) if (rnd() < 0.45) a[t] = 1 + Math.floor(Math.pow(rnd(), 2) * (unitdefs_default.units[t].space >= 8 ? 12 : 90));
  if (!Object.keys(a).length) continue;
  const p = planArmy(a, UR, true), g = gaps(p);
  if (g.bad) badSets++;
  if (p.types.length > 1) worst = Math.min(worst, g.min);
}
ok(badSets === 0, `${N} random armies: no two rings touch (smallest gap over all ${worst.toFixed(2)} m)`);
var pg = planArmy({ giant: 4 }, UR, true);
var cols = new Set(pg.pos.giant.map((q) => q[0].toFixed(1)));
var rows = new Set(pg.pos.giant.map((q) => q[1].toFixed(1)));
ok(cols.size === 2 && rows.size === 2, `4 giants stand 2 x 2 (${cols.size} files x ${rows.size} ranks)`);
var ps = planArmy({ spear: 61 }, UR, true);
var rs = new Set(ps.pos.spear.map((q) => q[1].toFixed(1)));
ok(rs.size >= 6 && rs.size <= 9, `61 spearmen: ${rs.size} ranks (about as deep as wide)`);
{
  const p = planArmy(fullMax, UR, true), R = ringsOf(p);
  let bad = [];
  const g = (t) => {
    const k = tierOf(t);
    return k <= 1 ? 0 : k <= 3 ? 1 : 2;
  };
  for (const a of p.types) for (const b of p.types) if (g(a) < g(b) && R[b].cz - R[b].r < R[a].cz - 0.5) bad.push(a + ">" + b);
  ok(bad.length === 0, `his full army: the archers / mages / siege never stand in front of the infantry, the infantry never in front of the heroes and great ones ${bad.slice(0, 3).join(" ")}`);
  const lat = (t) => R[t];
  let l0 = 1e9, l1 = -1e9, b1 = 0;
  for (const t of p.types) {
    l0 = Math.min(l0, R[t].cx - R[t].r);
    l1 = Math.max(l1, R[t].cx + R[t].r);
    b1 = Math.max(b1, R[t].cz + R[t].r);
  }
  ok(l1 - l0 > b1 * 1.5, `his full army is wide, not tall: ${(l1 - l0).toFixed(0)} m x ${b1.toFixed(0)} m`);
  ok(l0 >= -92 - 0.5 && l1 <= 84 + 0.5, `and stands inside the muster plain (${l0.toFixed(0)} .. ${l1.toFixed(0)} m)`);
}
{
  const OB = [[-70, 55, 9], [-132, 47, 11]], p = planArmy(fullMax, UR, true, OB), R = ringsOf(p), g = gaps(p);
  let near = 1e9;
  for (const t of p.types) for (const o of OB) near = Math.min(near, Math.hypot(R[t].cx - o[0], R[t].cz - o[1]) - R[t].r - o[2]);
  ok(near >= 3, `his full army with the windmill on the plain: every ring keeps ${near.toFixed(1)} m from it`);
  ok(g.bad === 0, `and still no two rings touch (smallest gap ${g.min.toFixed(2)} m, ${p.width.toFixed(0)} x ${p.depth.toFixed(0)} m)`);
  let worstO = 1e9;
  seed = 777;
  for (let k = 0; k < 150; k++) {
    const a = {};
    for (const t of unitdefs_default.order) if (rnd() < 0.5) a[t] = 1 + Math.floor(Math.pow(rnd(), 2) * (unitdefs_default.units[t].space >= 8 ? 12 : 90));
    if (!Object.keys(a).length) continue;
    const q = planArmy(a, UR, true, OB), Q = ringsOf(q), gg = gaps(q);
    if (gg.bad) fails++;
    for (const t of q.types) for (const o of OB) worstO = Math.min(worstO, Math.hypot(Q[t].cx - o[0], Q[t].cz - o[1]) - Q[t].r - o[2]);
  }
  ok(worstO >= 3, `150 random armies with buildings on the plain: the nearest ring is ${worstO.toFixed(1)} m from a building`);
}
console.log(fails ? "RINGS FAILED" : "RINGS OK");
process.exit(fails ? 1 : 0);
