var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/unitdefs.json
var unitdefs_default = { units: { spear: { fam: "barracks", lv: 1, space: 1, hp: 120, dps: 9, rng: 0, spd: 1, cost: { ruby: 3, emerald: 1 }, t: 20, role: "infantry", size: "light", layer: "ground", prefer: "near" }, sword: { fam: "barracks", lv: 3, space: 1, hp: 135, dps: 15, rng: 0, spd: 1.05, cost: { ruby: 5, emerald: 2 }, t: 30, role: "infantry", size: "light", layer: "ground", prefer: "near" }, guard: { fam: "barracks", lv: 4, space: 2, hp: 330, dps: 12, rng: 0, spd: 0.9, cost: { ruby: 8, emerald: 5 }, t: 50, role: "tank", size: "light", layer: "ground", prefer: "defence" }, archer: { fam: "training", lv: 1, space: 1, hp: 80, dps: 11, rng: 26, spd: 1, cost: { ruby: 4, emerald: 2 }, t: 26, role: "ranged", size: "light", layer: "ground", prefer: "near" }, cavalry: { fam: "stable", lv: 5, space: 3, hp: 300, dps: 24, rng: 0, spd: 2.1, cost: { ruby: 12, emerald: 4 }, t: 90, role: "cavalry", size: "medium", layer: "ground", prefer: "raid" }, axerider: { fam: "stable", lv: 11, space: 5, hp: 780, dps: 48, rng: 0, spd: 2, cost: { ruby: 24, emerald: 12, turq: 4 }, t: 200, role: "cavalry", size: "medium", layer: "ground", prefer: "near" }, pegasus: { fam: "stable", lv: 8, space: 4, hp: 360, dps: 30, rng: 0, spd: 2.6, cost: { ruby: 12, turq: 14 }, t: 150, role: "air", air: true, size: "medium", layer: "air", prefer: "raid" }, baby: { fam: "lair", lv: 9, space: 8, hp: 900, dps: 55, rng: 18, spd: 1.8, cost: { turq: 40, ruby: 14 }, t: 420, role: "air", air: true, size: "heavy", layer: "air", prefer: "antiair" }, dragon: { fam: "lair", lv: 18, space: 24, hp: 3400, dps: 150, rng: 22, spd: 1.9, cost: { turq: 170, ruby: 60 }, t: 1500, role: "air", air: true, size: "huge", layer: "air", prefer: "antiair" }, catapult: { fam: "workshop", lv: 6, space: 6, hp: 420, dps: 70, rng: 44, spd: 0.5, cost: { ruby: 14, emerald: 10 }, t: 180, role: "siege", size: "medium", layer: "ground", prefer: "standoff" }, giant: { fam: "workshop", lv: 13, space: 12, hp: 2300, dps: 48, rng: 0, spd: 0.8, cost: { ruby: 30, turq: 10 }, t: 360, role: "giant", size: "heavy", layer: "wade", prefer: "defence" }, imp: { fam: "lair", lv: 3, space: 2, hp: 170, dps: 24, rng: 0, spd: 1.9, cost: { turq: 6, ruby: 3 }, t: 45, role: "cavalry", size: "light", layer: "ground", prefer: "raid" }, mage: { fam: "lair", lv: 5, space: 3, hp: 150, dps: 40, rng: 30, spd: 0.95, cost: { turq: 14, ruby: 6 }, t: 75, role: "ranged", size: "medium", layer: "ground", prefer: "near" }, ram: { fam: "workshop", lv: 9, space: 5, hp: 750, dps: 62, rng: 0, spd: 0.9, cost: { ruby: 12, emerald: 12 }, t: 150, role: "giant", size: "medium", layer: "ground", prefer: "gate" }, cannon: { fam: "workshop", lv: 10, space: 7, hp: 520, dps: 84, rng: 36, spd: 0.5, cost: { ruby: 20, emerald: 12 }, t: 220, role: "siege", size: "heavy", layer: "ground", prefer: "standoff" }, werewolf: { fam: "workshop", lv: 11, space: 8, hp: 1250, dps: 58, rng: 0, spd: 2.3, cost: { ruby: 22, turq: 8 }, t: 280, role: "cavalry", size: "heavy", layer: "ground", prefer: "raid" }, trebuchet: { fam: "workshop", lv: 12, space: 10, hp: 640, dps: 118, rng: 62, spd: 0.4, cost: { ruby: 28, emerald: 18 }, t: 330, role: "siege", size: "heavy", layer: "ground", prefer: "standoff" }, hill: { fam: "workshop", lv: 16, space: 16, hp: 3300, dps: 64, rng: 0, spd: 0.85, cost: { ruby: 40, turq: 14 }, t: 520, role: "giant", size: "huge", layer: "wade", prefer: "defence" }, shieldmaiden: { fam: "barracks", lv: 12, space: 6, hp: 1150, dps: 52, rng: 0, spd: 1.15, cost: { ruby: 26, emerald: 14, turq: 4 }, t: 210, role: "tank", size: "medium", layer: "ground", prefer: "defence" }, lord: { fam: "stable", lv: 14, space: 8, hp: 1500, dps: 74, rng: 0, spd: 2.3, cost: { ruby: 34, emerald: 12, turq: 8 }, t: 270, role: "cavalry", size: "heavy", layer: "ground", prefer: "raid" }, dragonling: { fam: "lair", lv: 12, space: 6, hp: 660, dps: 44, rng: 15, spd: 1.9, cost: { turq: 24, ruby: 10 }, t: 240, role: "air", air: true, size: "medium", layer: "air", prefer: "antiair" } }, order: ["spear", "sword", "guard", "archer", "cavalry", "axerider", "pegasus", "baby", "dragon", "catapult", "giant", "imp", "mage", "ram", "cannon", "werewolf", "trebuchet", "hill", "shieldmaiden", "lord", "dragonling"], families: ["barracks", "training", "stable", "lair", "workshop"], spells: { lightning: { lv: 1, space: 1, cost: { turq: 8, ruby: 4 }, t: 40 }, heal: { lv: 2, space: 1, cost: { turq: 8, emerald: 4 }, t: 45 }, freeze: { lv: 4, space: 1, cost: { turq: 12 }, t: 60 }, rage: { lv: 6, space: 2, cost: { turq: 16, ruby: 8 }, t: 90 }, quake: { lv: 9, space: 2, cost: { turq: 20, ruby: 10 }, t: 120 } }, spell_order: ["lightning", "heal", "freeze", "rage", "quake"], emblems: ["swords", "wings", "dragon", "axes", "heart", "crown", "tower", "wolf", "eagle", "lion", "bear", "serpent", "flame", "star", "moon", "sun", "bolt", "pine", "anchor", "arrows", "stag", "frost", "helm", "gem"], spell_cap: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22], army_cap: [30, 44, 58, 72, 86, 100, 114, 128, 142, 156, 170, 184, 198, 212, 226, 240, 254, 268, 282, 296], fam_cap: { barracks: [14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 91, 98, 105, 112, 119, 126, 133, 140, 147], training: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105], stable: [8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84], lair: [12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120, 126], workshop: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105] }, speed: [1, 1.08, 1.16, 1.24, 1.32, 1.4, 1.48, 1.56, 1.64, 1.72, 1.8, 1.88, 1.96, 2.04, 2.12, 2.2, 2.28, 2.36, 2.44, 2.52], forge_mult: [1, 1.06, 1.12, 1.18, 1.24, 1.3, 1.36, 1.42, 1.48, 1.54, 1.6, 1.66, 1.72, 1.78, 1.84, 1.9, 1.96, 2.02, 2.08, 2.14], lvl_step: 0.035, tier_at: [1, 4, 8, 12, 16, 20], perks: { "2": "armor", "3": "swift", "4": "fury", "5": "laststand" }, defences: { tower: { hits: "both", w: 1, rng: 34, cd: 0.9, splash: 0, minr: 0, pick: "near", mult: { light: 1.5, medium: 1, heavy: 0.6, air: 1 }, unlock: 1, n: [3, 11, 10] }, cannon: { hits: "ground", w: 2.2, rng: 40, cd: 3, splash: 3.5, minr: 7, pick: "dense", mult: { light: 1.8, medium: 1, heavy: 0.35, air: 0 }, unlock: 3, n: [1, 3, 9] }, wizard: { hits: "both", w: 1.8, rng: 36, cd: 1.4, splash: 2, minr: 0, pick: "dense", mult: { light: 1.3, medium: 1.2, heavy: 0.7, air: 1 }, unlock: 5, n: [1, 4, 14] }, ballista: { hits: "both", w: 2.2, rng: 46, cd: 2.6, splash: 0, minr: 0, pick: "air", mult: { light: 0.35, medium: 1, heavy: 2.6, air: 2.2 }, unlock: 8, n: [2, 6, 15] }, quad: { hits: "ground", w: 2.4, rng: 34, cd: 1.3, splash: 1.1, minr: 0, pick: "near", mult: { light: 1.1, medium: 1.3, heavy: 0.8, air: 0 }, unlock: 10, n: [1, 3, 17], volley: 4 }, keep: { hits: "both", w: 1.2, rng: 40, cd: 1.6, splash: 0, minr: 0, pick: "near", mult: { light: 1, medium: 1, heavy: 1, air: 1 }, unlock: 1 }, tesla: { hits: "both", w: 2, rng: 32, cd: 1.5, splash: 0, minr: 0, pick: "near", mult: { light: 1.3, medium: 1, heavy: 0.8, air: 1 }, chain: 3 } }, garrison_at: [[1, 10], [5, 35], [10, 75], [15, 115], [20, 150]], garrison_mix: { guard: 0.55, archer: 0.25, heavy: 0.1, reserve: 0.1 }, defence_pairs: [[1, "tower", ["spear", "archer"]], [3, "cannon", ["sword", "imp"]], [5, "wizard", ["mage", "cavalry"]], [8, "ballista", ["pegasus"]], [10, "quad", ["cannon"]], [13, "giant", ["giant"]], [16, "baby", ["hill"]], [16, "hill", ["hill"]], [18, "dragon", ["dragon"]]], guardians: { giant: { unlock: 13, n: [1, 2] }, baby: { unlock: 16, n: [1, 2] }, hill: { unlock: 16, n: [1, 1] }, dragon: { unlock: 18, n: [1, 1] } }, bot_ratio: [0.9, 1.5] };

// src/battlesim.js
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
var TUNE = { splashK: 0.3, w_tower: 1, w_cannon: 1, w_keep: 1, w_tesla: 1, defHP: 3, brD: 4, brB: 2.5, brL: 2, nb: 0.2, gfrac: 0.12, gleash: 42, ringValue: 0.35, star3: 100, hp: 12, dps: 0.18, tower: 0.55, w_ballista: 2.2, m_ballista_air: 2.2, m_ballista_heavy: 2.6, m_ballista_light: 0.35, m_cannon_light: 1.8, m_cannon_heavy: 0.35, bm_siege: 1, bm_giant: 1, bm_air: 0.6, bm_infantry: 0.55, bm_cavalry: 0.5, bm_ranged: 0.55, bm_tank: 0.5, us: 2, ur: 2, sp: 2.9, leash: 18 };
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
  const R = mulberry(spec.seed | 0), L = Math.max(1, Math.min(20, spec.levels.keep | 0)), D = Math.max(40, spec.power || 100);
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
    const a = verts[i], b2 = verts[(i + 1) % n], len = Math.hypot(b2[0] - a[0], b2[1] - a[1]), rot = Math.atan2(-(b2[1] - a[1]), b2[0] - a[0]);
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
  const free = (x, z, r) => B.every((b) => b.ring || Math.hypot(b.x - x, b.z - z) > r + Math.max(b.w, b.d) * 0.55);
  const inside2 = (x, z) => Math.hypot(x / (Rr * 0.82), (z + 4) / (Rr * 0.7)) < 1;
  const fill = [["barracks", 1 + (L >= 8 ? 1 : 0) + (L >= 15 ? 1 : 0)], ["forge", L >= 6 ? 1 : 0], ["store", 1 + (L >= 10 ? 1 : 0)], ["house", 4 + Math.floor(L / 3)]];
  for (const [type, cnt] of fill) for (let k = 0, tries = 0; k < cnt && tries < 300; tries++) {
    const x = (R() - 0.5) * Rr * 1.6, z = -4 + (R() - 0.5) * Rr * 1.3;
    if (inside2(x, z) && free(x, z, 6)) {
      add(type, x, z, R() * 6.28 - 3.14, {});
      k++;
    }
  }
  const sum = B.reduce((s, b) => s + b.share, 0), HP = TUNE.hp * D * (0.9 + 0.2 * (L / 20));
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
    defenders.push({ side: "D", type: i % 4 === 3 ? "archer" : "guard", x, z, hx: x, hz: z, hp: 160 * (1 + L / 20), maxHp: 160 * (1 + L / 20), dps: gdps, rng: i % 4 === 3 ? 24 : 0, spd: 1, r: 0.8, air: false, role: i % 4 === 3 ? "ranged" : "infantry", cd: 0 });
  }
  const total = B.reduce((s, b) => s + b.value, 0);
  return { buildings: B, defenders, ring: walls, verts, gateIndex: gi, radius: Rr, totalShare: total, level: L };
}
function teslaSpots(T, meta, n) {
  n = Math.max(0, Math.min(4, n | 0));
  if (!n || !meta || !meta.gates || !meta.gates.length) return [];
  const g = meta.gates[0];
  return T.filter((t) => t.type === "ballista").map((t) => [t.id, Math.hypot(t.x - g.x, t.z - g.z)]).sort((a, b) => a[1] - b[1]).slice(0, n).map((a) => a[0]);
}
var UNIT_TIER_AT = unitdefs_default.tier_at || [1, 4, 8, 12, 16, 20];
var unitTier = (L) => {
  let t = 0;
  for (let i = 0; i < UNIT_TIER_AT.length; i++) if (L >= UNIT_TIER_AT[i]) t = i;
  return t;
};
var lvlMult = (L) => 1 + (unitdefs_default.lvl_step || 0.035) * (Math.max(1, Math.min(20, L | 0)) - 1);
var PROFILES = {
  balanced: {},
  aa: { cannon: 0, quad: 0, w: { ballista: 1.5 } },
  // anti-air heavy: ballistas + wizards + arrows, no ground guns
  art: { ballista: 0.34, wizard: 0.34, w: { cannon: 1.6, quad: 1.4 } },
  // artillery heavy: cannons + the quad guns
  arrows: { ballista: 0, cannon: 0, quad: 0, wizard: 0 }
  // only the arrow towers
};
var PROFILE_ORDER = ["balanced", "aa", "art", "arrows", "balanced"];
var profileOf = (spec) => spec.profile && PROFILES[spec.profile] ? spec.profile : PROFILE_ORDER[((spec.seed | 0) * 2654435761 >>> 0) % PROFILE_ORDER.length];
var guardianSlots = (L) => {
  const o = {};
  for (const [k, g] of Object.entries(unitdefs_default.guardians || {})) if (L >= g.unlock) o[k] = Math.floor(g.n[0] + (g.n[1] - g.n[0]) * (L - g.unlock) / Math.max(1, 20 - g.unlock) + 1e-9);
  return o;
};
var gPow = (g) => Object.entries(g).reduce((q, [k, n]) => q + n * Math.sqrt(unitdefs_default.units[k].hp * unitdefs_default.units[k].dps) / 3, 0);
var guardianFrac = (g) => {
  const full = gPow(guardianSlots(20));
  return full > 0 ? Math.min(1, gPow(g) / full) * TUNE.gfrac : 0;
};
function makeBaseFromTargets(spec, T, meta) {
  const R = mulberry(spec.seed | 0), L = Math.max(1, Math.min(20, spec.levels.keep | 0)), D0 = Math.max(40, spec.power || 100), US = TUNE.us, UR = TUNE.ur;
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
  const siteKind = (b) => b.tesla ? null : b.type === "ballista" ? b.wk === "cannon" || b.wk === "quad" ? b.wk : "ballista" : b.type === "tower" && b.def ? b.wk === "wizard" ? "wizard" : "tower" : null;
  const slotsOf = (k) => {
    const F = DEFN[k];
    if (!F || !F.n) return 1e9;
    if (L < F.unlock) return 0;
    const [lo, hi, full] = F.n;
    return Math.round(lo + (hi - lo) * Math.min(1, (L - F.unlock) / Math.max(1, full - F.unlock)));
  };
  for (const k of ["tower", "cannon", "wizard", "ballista", "quad"]) {
    const sites = B.filter((b) => siteKind(b) === k).sort((a, c) => Math.hypot(a.x - gm.x, a.z - gm.z) - Math.hypot(c.x - gm.x, c.z - gm.z) || a.id - c.id);
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
        b.def = false;
        b.off = true;
        b.why = "profile";
      }
    });
    sites.slice(manned).forEach((b) => {
      b.def = false;
      b.off = true;
      b.why = "level";
    });
  }
  const hs = (b) => b.share * (b.def ? TUNE.defHP : 1), sum = B.reduce((s, b) => s + hs(b), 0), HP = TUNE.hp * D * (0.9 + 0.2 * (L / 20));
  for (const b of B) {
    b.maxHp = b.hp = Math.round(HP * hs(b) / sum);
    b.value = b.ring ? b.share * TUNE.ringValue : b.share;
    if (b.type === "wall") b.maxHp = b.hp = Math.round(b.maxHp * (0.8 + b.w / 30));
  }
  const dkOf = (b) => b.tesla ? "tesla" : b.type === "keep" ? "keep" : b.sk || (b.type === "ballista" ? "ballista" : "tower");
  for (const b of B) if (b.def) b.dk = dkOf(b);
  const wOf = (b) => (DEFN[b.dk] ? DEFN[b.dk].w : b.tesla ? 2 : b.type === "keep" ? 1.2 : b.type === "ballista" ? 2.2 : 1) * (TUNE["w_" + b.dk] ?? 1) * (profW[b.dk] ?? 1);
  const dps = TUNE.dps * D, defs = B.filter((b) => b.def), tw = defs.reduce((s, b) => s + wOf(b), 0);
  for (const b of defs) {
    const k = wOf(b) / tw, mine = TUNE.tower * dps * k, F = DEFN[b.dk] || {};
    if (b.tesla) Object.assign(b, { rng: 32 * US, cd: 1.5, dmg: mine * 1.5 / 1.96, splash: 0, air: true, ground: true, kind: "zap", flight: 0, chain: 3, hop: 9 * UR });
    else if (b.dk === "cannon") Object.assign(b, { rng: (F.rng || 40) * US, cd: F.cd || 3, dmg: mine * (F.cd || 3), splash: (F.splash || 3.5) * UR, minr: (F.minr || 7) * UR, air: false, ground: true, kind: "bolt", flight: 0.8 });
    else if (b.dk === "ballista") Object.assign(b, { rng: (F.rng || 46) * US, cd: F.cd || 2.6, dmg: mine * (F.cd || 2.6), splash: 0, air: true, ground: true, kind: "bolt", flight: 0.6 });
    else if (b.dk === "wizard") Object.assign(b, { rng: (F.rng || 36) * US, cd: F.cd || 1.4, dmg: mine * (F.cd || 1.4), splash: (F.splash || 2) * UR, minr: 0, air: true, ground: true, kind: "orb", flight: 0.5 });
    else if (b.dk === "quad") Object.assign(b, { rng: (F.rng || 34) * US, cd: F.cd || 1.3, dmg: mine * (F.cd || 1.3), splash: (F.splash || 1.1) * UR, minr: 0, air: false, ground: true, kind: "bolt", flight: 0.45, volley: F.volley || 4 });
    else if (b.type === "keep") Object.assign(b, { rng: 40 * US, cd: 1.6, dmg: mine * 1.6, splash: 0, air: true, ground: true, kind: "arrow", flight: 0.6 });
    else Object.assign(b, { rng: 34 * US, cd: 0.9, dmg: mine * 0.9, splash: 0, air: true, ground: true, kind: "arrow", flight: 0.5 });
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
  const HPW = { guard: 1, archer: 0.7, heavy: 3.5, reserve: 1 }, DPW = { guard: 1, archer: 1.2, heavy: 2.5, reserve: 1 };
  const sHP = kinds.reduce((q, k) => q + HPW[k], 0), sDP = kinds.reduce((q, k) => q + DPW[k], 0);
  const totHP = 45e-4 * D * 160 * (1 + L / 20), totDps = (1 - TUNE.tower) * dps, defenders = [];
  let ip = 0, io = 0;
  for (let i = 0; i < nG; i++) {
    const k = kinds[i], res = k === "reserve" && outer.length;
    const [px, pz, pr] = res ? outer[io++ % outer.length] : posts[ip++ % posts.length], a = R() * 6.28, r = 3 + R() * pr, x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
    const arch = k === "archer", hp = Math.max(30, totHP * HPW[k] / sHP);
    defenders.push({ side: "D", type: arch ? "archer" : "guard", kind: k, x, z, hx: x, hz: z, hp, maxHp: hp, dps: totDps * DPW[k] / sDP, rng: arch ? 24 * US : 0, spd: 1 * TUNE.sp, r: 0.8 * UR, air: false, role: arch ? "ranged" : "infantry", size: k === "heavy" ? "heavy" : "light", leash: res ? 24 * US : arch ? 0 : TUNE.leash * US, cd: 0 });
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
  const order = unitdefs_default.order.filter((u) => army[u] > 0);
  const clamp2 = (x, a, b) => Math.max(a, Math.min(b, x));
  const dp = base.deploy, tx0 = dp ? -dp.nz : 1, tz0 = dp ? dp.nx : 0;
  const ORDER = ["pegasus", "dragon", "baby", "dragonling", "lord", "axerider", "cavalry", "werewolf", "imp", "hill", "giant", "ram", "shieldmaiden", "guard", "spear", "sword", "mage", "archer", "cannon", "trebuchet", "catapult"];
  const types = ORDER.filter((u) => army[u] > 0).concat(order.filter((u) => !ORDER.includes(u)));
  const SH_W = 150 * (dp ? 1 : 0.5), GAP = 3.5 * UR;
  const blocks = types.map((type) => {
    const d = unitdefs_default.units[type], n = army[type], sp = (d.space >= 8 ? 6.5 : d.space >= 3 ? 3.3 : 2.4) * UR / 1.5, cols = clamp2(Math.ceil(Math.sqrt(n * 1.8)), Math.min(n, 3), d.space >= 8 ? 6 : 12);
    return { type, d, n, sp, cols, w: Math.min(n, cols) * sp, depth: Math.ceil(n / cols) * sp * 0.92 };
  });
  const shelves = [];
  let cur = null;
  for (const b of blocks) {
    if (!cur || cur.w + b.w + GAP > SH_W) {
      cur = { blocks: [], w: -GAP, depth: 0 };
      shelves.push(cur);
    }
    cur.blocks.push(b);
    cur.w += b.w + GAP;
    cur.depth = Math.max(cur.depth, b.depth);
  }
  let back0 = 0;
  for (const sh of shelves) {
    let lat0 = -sh.w / 2;
    for (const b of sh.blocks) {
      const { type, d, n, sp, cols } = b;
      for (let k = 0; k < n; k++) {
        const c = k % cols, r = Math.floor(k / cols), rowN = Math.min(cols, n - r * cols), lat = lat0 + b.w / 2 + (c - (rowN - 1) / 2) * sp, back = back0 + r * sp * 0.92;
        const x = dp ? dp.x + tx0 * lat + dp.nx * back : lat, z = dp ? dp.z + tz0 * lat + dp.nz * back : FIELD.line + 4 + back;
        const known = !!(lv && lv[d.fam]), L = Math.max(1, Math.min(20, (lv && lv[d.fam]) | 0 || 1)), tier = known ? unitTier(L) : 1, km = mult * lvlMult(L);
        units.push({
          id: uid++,
          side: "A",
          type,
          x,
          z,
          hp: d.hp * km,
          maxHp: d.hp * km,
          dps: d.dps * km * (known && tier >= 4 ? 1.15 : 1),
          rng: d.rng * US,
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
          wade: type === "giant" || type === "hill",
          cd: R(),
          go: null,
          hold: null,
          hero: type === "shieldmaiden" || type === "lord",
          active: false,
          target: null,
          retarget: 0,
          dead: false,
          y: d.air ? 6 * UR : 0,
          face: dp ? Math.atan2(-dp.nx, -dp.nz) : Math.PI
        });
      }
      lat0 += b.w + GAP;
    }
    back0 += sh.depth + GAP * 1.3;
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
  const walls = B.filter((b) => b.ring);
  const share = base.totalShare;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const distB = (u, b) => {
    const c = Math.cos(b.rot), s = Math.sin(b.rot), dx = u.x - b.x, dz = u.z - b.z;
    const lx = dx * c - dz * s, lz = dx * s + dz * c, qx = Math.max(0, Math.abs(lx) - b.w / 2), qz = Math.max(0, Math.abs(lz) - b.d / 2);
    return Math.hypot(qx, qz);
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
      if (b.rng && b.dmg && !stats.deadAt[b.id]) stats.deadAt[b.id] = [b.dk, sim.time];
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
      for (const b of B) if (!b.dead && Math.hypot(b.x - x, b.z - z) < r + Math.max(b.w, b.d) * 0.4) hurtB(b, dmg * (b.type === "wall" ? 0.7 : 1) * (b === prim ? 1 : TUNE.nb), by);
    }
    for (const u of all) if (alive(u) && u.side !== from && Math.hypot(u.x - x, u.z - z) < r) {
      if (o && o.ground && u.air) continue;
      hurtU(u, o && o.mult ? dmg * (o.mult[sizeClass(u)] ?? 1) : dmg, by);
    }
    ev({ k: "splash", x, z, r });
  };
  const queue = (delay, fn) => sim.pending.push({ t: sim.time + delay, fn });
  const pickAttackerTarget = (u) => {
    const ground = !u.air;
    let best = null, bs = 1e9;
    const consider = (t, score) => {
      if (score < bs) {
        bs = score;
        best = t;
      }
    };
    const near = (u.role === "ranged" ? 30 : u.role === "air" ? 24 : 11) * US;
    const reachable = (d) => !d.air || u.air || u.rng > 0;
    if (u.role !== "giant" && u.role !== "siege") {
      for (const d of DEF) if (alive(d) && reachable(d)) {
        const dd = dist(u, d);
        if (dd < near) consider(d, dd - (d.guardian ? 12 : 6) * US);
      }
    }
    if (u.type === "giant" || u.type === "hill" || u.role === "siege") {
      for (const d of DEF) if (alive(d) && d.guardian && reachable(d)) {
        const dd = dist(u, d);
        if (dd < (u.role === "siege" ? u.rng : 16 * US)) consider(d, dd - 30 * US);
      }
    }
    for (const b of B) {
      if (b.dead) continue;
      if (u.bad && u.bad[b.id] > sim.time) continue;
      if (b.ring && sim.rest > 3) continue;
      let s = dist(u, b) + (b.tc || 0) * 2.2 * US;
      if (b.ring && b.type === "wall") s += 70 * US;
      if (b.def || b.type === "tower" || b.type === "ballista") s -= (u.role === "siege" || u.role === "giant" || u.air ? 26 : 8) * US;
      if (b.type === "vault" && u.role === "air") s -= 6 * US;
      if (u.role === "siege" && b.type !== "tower" && b.type !== "ballista") s += 6 * US;
      consider(b, s);
    }
    return best;
  };
  const HEROES = { shieldmaiden: { name: "Shield Wall", cd: 24, dur: 6 }, lord: { name: "Rally Charge", cd: 28, dur: 8 } };
  const LEASH = 15 * US;
  const pickHeroTarget = (u) => {
    const h = u.hold || u;
    let best = null, bs = 1e9;
    for (const d of DEF) if (alive(d) && Math.hypot(d.x - h.x, d.z - h.z) < LEASH) {
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
  const pickDefenderTarget = (d) => {
    let best = null, bd = 1e9;
    for (const u of units) if (alive(u) && u.active && (d.rng > 0 || !u.air)) {
      const dd = dist(u, d);
      if (dd < bd) {
        bd = dd;
        best = u;
      }
    }
    return best;
  };
  const SOLID_T = { wall: 1, gate: 1, tower: 1, ballista: 1, keep: 1, vault: 1, mine: 1, barracks: 1, training: 1, forge: 1, stable: 1, workshop: 1, lair: 1, store: 1 };
  const solids = B.filter((b) => SOLID_T[b.type]);
  for (const b of solids) {
    b.cs = Math.cos(b.rot || 0);
    b.sn = Math.sin(b.rot || 0);
    b.rr = Math.hypot(b.w, b.d) / 2 + 3;
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
    const len = Math.hypot(nx - ox, nz - oz), n = Math.max(1, Math.ceil(len / 0.5));
    let px = ox, pz = oz;
    for (let i = 1; i <= n; i++) {
      let qx = px + (nx - ox) / n, qz = pz + (nz - oz) / n;
      for (let pass = 0; pass < 2; pass++) for (const b of solids) {
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
    const dx = tx - u.x, dz = tz - u.z, d = Math.hypot(dx, dz);
    if (d <= stopAt || d < 1e-4) return d;
    const sp = u.spd * dt * (u.rageUntil > sim.time ? 1.3 : 1), k = Math.min(1, sp / d);
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
      const sm = Math.hypot(sx, sz) * 0.5, cap = Math.max(0.15, sp * 0.6);
      if (sm > cap) {
        sx *= cap / sm;
        sz *= cap / sm;
      }
    }
    let nx = u.x + dx * k + sx * 0.5, nz = u.z + dz * k + sz * 0.5;
    if (!u.air) {
      const want = Math.hypot(dx * k, dz * k), [cx, cz, hit] = collide(u, u.x, u.z, nx, nz), got = Math.hypot(cx - u.x, cz - u.z);
      if (hit && got < want * 0.4) {
        u.stuck = (u.stuck || 0) + dt;
        u.blocker = hit;
      } else if (u.stuck > 0) u.stuck = Math.max(0, u.stuck - dt * 2);
      nx = cx;
      nz = cz;
      if (NAV2 && !u.wade && NAV2.isWet(nx, nz) && !NAV2.isWet(u.x, u.z)) {
        if (!NAV2.isWet(nx, u.z)) nz = u.z;
        else if (!NAV2.isWet(u.x, nz)) nx = u.x;
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
  let routeLeft = 3;
  const rcache = [];
  const goalFor = (u, gx, gz) => {
    if (!NAV2 || u.air || u.wade) return [gx, gz];
    let r = u.rt;
    if (r && (Math.abs(r.gx - gx) + Math.abs(r.gz - gz) > 8 || sim.time > r.exp)) r = u.rt = null;
    if (!r) {
      if (sim.time < (u.navT || 0) || routeLeft <= 0) return [gx, gz];
      u.navT = sim.time + 0.35 + R() * 0.25;
      if (NAV2.clear(u.x, u.z, gx, gz)) return [gx, gz];
      let pts = null;
      for (const c of rcache) if (c.exp > sim.time && Math.abs(c.gx - gx) + Math.abs(c.gz - gz) < 6 && Math.hypot(c.sx - u.x, c.sz - u.z) < 9 && NAV2.clear(u.x, u.z, c.pts[0][0], c.pts[0][1])) {
        pts = c.pts;
        break;
      }
      if (!pts) {
        routeLeft--;
        pts = NAV2.route(u.x, u.z, gx, gz);
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
    while (r.i < r.pts.length - 1 && Math.hypot(r.pts[r.i][0] - u.x, r.pts[r.i][1] - u.z) < 3.2) r.i++;
    return r.pts[r.i];
  };
  const attackerStep = (u, dt) => {
    if (!u.active) return;
    u.cd -= dt;
    if (u.go && !u.target) {
      const [wx, wz] = goalFor(u, u.go.x, u.go.z);
      moveTo(u, wx, wz, dt, wx === u.go.x ? 1.5 * UR : 0);
      if (Math.hypot(u.go.x - u.x, u.go.z - u.z) <= 1.5 * UR) u.go = null;
      if (u.go && u.wst > 2.5) {
        u.go = null;
        u.wst = 0;
        u.rt = null;
      }
      if (u.go && !u.hero) {
        for (const e of DEF) if (alive(e) && (!e.air || u.air || u.rng > 0) && dist(u, e) < (u.role === "ranged" ? 26 : 8) * US) {
          u.target = e;
          break;
        }
      }
      if (u.go && u.stuck > 1.2 && u.blocker && !u.blocker.dead) {
        u.target = u.block = u.blocker;
        u.stuck = 0;
        u.retarget = 2.5;
      }
      if (u.go && !u.target) return;
    }
    u.retarget -= dt;
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
      if (u.hero && u.hold && Math.hypot(u.hold.x - u.x, u.hold.z - u.z) > 2.2 * UR) {
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
    const dmg = u.dps * interval * (u.rageUntil > sim.time ? 1.55 : 1);
    if (u.role === "siege") {
      ev({ k: "shot", kind: SG.kind, from: [u.x, SG.h, u.z], to: [t.x, t.h ? t.h * 0.5 : 1, t.z], t: SG.fl, u: u.id, big: !!SG.big });
      queue(SG.fl, () => splashAt(t.x, t.z, SG.sp * UR, dmg * (tb ? BM.siege : 1), "A", t, u.type));
    } else if (u.role === "air" && u.rng >= 15) {
      const dd = (u.type === "dragon" ? TUNE.brD : u.type === "dragonling" ? TUNE.brL : TUNE.brB) * UR;
      ev({ k: "breath", from: [u.x, u.y, u.z], to: [t.x, 1, t.z], big: u.type === "dragon", u: u.id });
      queue(0.25, () => splashAt(t.x, t.z, dd, dmg * (u.type === "dragon" ? 1.2 : 1) * (tb ? BM.air : 1) * 0.55, "A", t, u.type));
    } else if (u.type === "mage") {
      const fl = Math.max(0.25, d / (30 * US));
      ev({ k: "shot", kind: "orb", from: [u.x, 4.2, u.z], to: [t.x, tb ? Math.min(3, t.h * 0.4) : 1.6, t.z], t: fl, u: u.id });
      queue(fl, () => splashAt(t.x, t.z, 3.4 * UR, dmg * (tb ? BM.ranged : 1), "A", tb ? t : null, u.type));
    } else if (u.rng > 0) {
      ev({ k: "shot", kind: "arrow", from: [u.x, 2.2, u.z], to: [t.x, tb ? Math.min(3, t.h * 0.4) : 1.4, t.z], t: Math.max(0.15, d / (42 * US)), u: u.id });
      queue(Math.max(0.15, d / (42 * US)), () => {
        if (tb) hurtB(t, dmg * (TUNE["bm_" + u.role] ?? BM[u.role]), u.type);
        else hurtU(t, dmg, u.type);
      });
    } else {
      ev({ k: "melee", u: u.id, x: u.x, z: u.z, tx: t.x, tz: t.z });
      queue(u.type === "giant" ? GIANT_SWING.hit : 0.25, () => {
        if (tb) hurtB(t, dmg * ((TUNE["bm_" + u.role] ?? BM[u.role]) || 0.5), u.type);
        else hurtU(t, dmg, u.type);
        if (u.role === "giant") ev({ k: "slam", x: t.x, z: t.z });
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
        if (Math.hypot(u.x - d.hx, u.z - d.hz) > d.leash) continue;
        const s = dist(u, d) - (u.size === "heavy" || u.size === "huge" ? 6 * US : 0) - (!!u.air === !!d.air ? 4 * US : 0);
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
      if (Math.hypot(d.hx - d.x, d.hz - d.z) > 2 * UR) moveTo(d, d.hx, d.hz, dt, 0);
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
      d.target = c && (d.leash && Math.hypot(c.x - d.hx, c.z - d.hz) < d.leash || d.kind !== "reserve" && (insideRing(c.x, c.z) || dist(c, d) < 8 * US) && dist(c, d) < 28 * US) ? c : null;
      d.retarget = 0.7;
    }
    const t = d.target;
    if (!t) {
      const dx = d.hx - d.x, dz = d.hz - d.z;
      if (Math.hypot(dx, dz) > 1.2 * UR) {
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
      const d = Math.hypot(u.x - b.x, u.z - b.z);
      if (d >= b.rng || d < b.minr) continue;
      let w = u.air ? b.mult[sizeClass(u)] || 0 : 0;
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
        const d = Math.hypot(u.x - b.x, u.z - b.z);
        if (d >= b.rng || d < b.minr) continue;
        const sc = (b.pick === "air" ? PRI[sizeClass(u)] * 1e5 : 0) + d;
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
          const d = Math.hypot(u.x - p.x, u.z - p.z);
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
      queue(b.flight, () => splashAt(ix, iz, b.splash, b.dmg * (b.dk === "cannon" ? TUNE.splashK : 1), "D", null, src, { ground: !b.air, mult: M }));
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
        for (const b of B) if (!b.dead && Math.hypot(b.x - bx, b.z - bz) < 6 + Math.max(b.w, b.d) * 0.4) hurtB(b, hpU * 0.3 * (b.type === "wall" ? 0.6 : 1), "spell");
        for (const e of DEF) if (alive(e) && Math.hypot(e.x - bx, e.z - bz) < 7) hurtU(e, 500, "spell");
      });
    } else if (type === "heal" || type === "rage") sim.zones.push({ type, x, z, r: d.r, until: sim.time + d.dur });
    else if (type === "freeze") {
      const until = sim.time + d.dur;
      for (const e of DEF) if (alive(e) && Math.hypot(e.x - x, e.z - z) < d.r) e.frozen = until;
      for (const b of B) if (!b.dead && b.rng && Math.hypot(b.x - x, b.z - z) < d.r + 4) {
        b.frozen = until;
        ev({ k: "freezeB", b: b.id, x: b.x, z: b.z, h: b.h });
      }
    } else if (type === "quake") {
      for (let i = 0; i < 4; i++) queue(0.2 + i * 0.35, () => {
        for (const b of B) if (!b.dead && Math.hypot(b.x - x, b.z - z) < d.r + Math.max(b.w, b.d) * 0.3) hurtB(b, b.maxHp * 0.055, "spell");
      });
    }
    return true;
  };
  sim.send = (type, x, z) => {
    let n = 0;
    let cx = Math.max(FLD.x0 + 4, Math.min(FLD.x1 - 4, x)), cz = Math.max(FLD.z0 + 4, Math.min(FLD.z1 - 4, z));
    const list = units.filter((u) => u.type === type && alive(u)), cols = Math.max(2, Math.ceil(Math.sqrt(list.length))), fly = list.length > 0 && !!list[0].air;
    if (NAV2 && !fly && NAV2.isWet(cx, cz)) [cx, cz] = NAV2.nearestDry(cx, cz);
    if (HEROES[type]) {
      list.forEach((u, k) => {
        u.active = true;
        u.target = null;
        u.block = null;
        const gx = cx + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 3 * UR, gz = cz;
        const g = NAV2 && NAV2.isWet(gx, gz) ? NAV2.nearestDry(gx, gz) : [gx, gz];
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
      const gx = cx + (k % cols - (cols - 1) / 2) * 1.6 * UR, gz = cz + (Math.floor(k / cols) - cols / 2) * 1.6 * UR;
      u.go = NAV2 && !fly && NAV2.isWet(gx, gz) ? (([x2, z2]) => ({ x: x2, z: z2 }))(NAV2.nearestDry(gx, gz)) : { x: gx, z: gz };
      u.rt = null;
      n++;
    });
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
    sim.abilT[type] = sim.time + H.cd;
    sim.abilUsed[type] = (sim.abilUsed[type] || 0) + 1;
    for (const u of list) {
      const r = (type === "lord" ? 26 : 14) * US;
      ev({ k: "ability", type, id: u.id, x: u.x, z: u.z, r, dur: H.dur });
      if (type === "shieldmaiden") {
        u.guardUntil = sim.time + H.dur;
        for (const a of units) if (alive(a) && a !== u && dist(a, u) < r) a.shieldUntil = sim.time + H.dur;
        for (const e of DEF) if (alive(e) && dist(e, u) < 24 * US) {
          e.target = u;
          e.retarget = 4;
        }
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
    routeLeft = Math.min(3, routeLeft + dt * 10);
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
      for (const u of units) if (alive(u) && Math.hypot(u.x - z.x, u.z - z.z) < z.r) {
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
var basetargets_default = { targets: [{ id: 1, type: "wall", ringId: "outer", seg: 0, x: -34, z: -47, w: 29.408498393145962, d: 4.2, h: 9.5, rot: 0.4124104415973873, a: [-47.471405755669956, -41.1062599818944], b: [-20.52859424433004, -52.8937400181056] }, { id: 2, type: "wall", ringId: "outer", seg: 1, x: 2.0000000000000036, z: -53, w: 34.52996878900158, d: 4.2, h: 9.5, rot: -0.049958395721942765, a: [-15.243443544697149, -53.86217217723486], b: [19.24344354469715, -52.13782782276514] }, { id: 3, type: "wall", ringId: "outer", seg: 2, x: 37, z: -42, w: 30.535512754639896, d: 4.2, h: 9.5, rot: -0.5880026035475675, a: [24.29645881237245, -50.46902745841837], b: [49.70354118762755, -33.53097254158163] }, { id: 4, type: "wall", ringId: "outer", seg: 3, x: 55, z: -11.999999999999996, w: 34.92749683231337, d: 4.2, h: 9.5, rot: -1.4219063791853994, a: [52.40941965008747, -29.2705356660835], b: [57.59058034991253, 5.270535666083504] }, { id: 5, type: "wall", ringId: "outer", seg: 4, x: 54.5598962213349, z: 14.880207557330198, w: 9.864611797498108, d: 4.2, h: 9.5, rot: -2.0344439357957027, a: [56.76569047642012, 10.468619047159768], b: [52.35410196624969, 19.291796067500634] }, { id: 6, type: "wall", ringId: "outer", seg: 4, x: 43.4401037786651, z: 37.119792442669805, w: 9.86461179749811, d: 4.2, h: 9.5, rot: -2.0344439357957027, a: [45.64589803375031, 32.70820393249937], b: [41.23430952357988, 41.53138095284024] }, { id: 7, type: "wall", ringId: "outer", seg: 5, x: 16.999999999999996, z: 49, w: 41.55440918375928, d: 4.2, h: 9.5, rot: -2.9275319700259717, a: [37.30299323557307, 44.58630581835368], b: [-3.3029932355730693, 53.41369418164632] }, { id: 8, type: "wall", ringId: "outer", seg: 6, x: -25, z: 46, w: 35.711056256176605, d: 4.2, h: 9.5, rot: 2.743070207923373, a: [-8.54371363538106, 52.92896267983955], b: [-41.45628636461894, 39.07103732016044] }, { id: 9, type: "wall", ringId: "outer", seg: 7, x: -52, z: 20, w: 33.87543120718442, d: 4.2, h: 9.5, rot: 1.9890206563741257, a: [-45.120942166307515, 35.47788012580809], b: [-58.879057833692485, 4.522119874191908] }, { id: 10, type: "wall", ringId: "outer", seg: 8, x: -55, z: -19.000000000000004, w: 37.65406628984581, d: 4.2, h: 9.5, rot: 1.3370531459259951, a: [-59.36072734463533, -0.6849451525316126], b: [-50.63927265536467, -37.31505484746839] }, { id: 11, type: "tower", ringId: "outer", seg: 0, x: -50, z: -40, w: 10.2, d: 10.2, h: 21, rot: 0, def: true }, { id: 12, type: "ballista", ringId: "outer", seg: 1, x: -18, z: -54, w: 10.2, d: 10.2, h: 19, rot: 0, def: true, wk: "ballista" }, { id: 13, type: "tower", ringId: "outer", seg: 2, x: 22, z: -52, w: 10.2, d: 10.2, h: 19, rot: 0, def: true }, { id: 14, type: "ballista", ringId: "outer", seg: 3, x: 52, z: -32, w: 10.2, d: 10.2, h: 21, rot: 0, def: true, wk: "cannon" }, { id: 15, type: "tower", ringId: "outer", seg: 4, x: 58, z: 8, w: 10.2, d: 10.2, h: 19, rot: 0, def: true, wk: "wizard" }, { id: 16, type: "ballista", ringId: "outer", seg: 5, x: 40, z: 44, w: 10.2, d: 10.2, h: 19, rot: 0, def: true, wk: "ballista" }, { id: 17, type: "tower", ringId: "outer", seg: 6, x: -6, z: 54, w: 10.2, d: 10.2, h: 21, rot: 0, def: true }, { id: 18, type: "ballista", ringId: "outer", seg: 7, x: -44, z: 38, w: 10.2, d: 10.2, h: 19, rot: 0, def: true, wk: "quad" }, { id: 19, type: "tower", ringId: "outer", seg: 8, x: -60, z: 2, w: 10.2, d: 10.2, h: 19, rot: 0, def: true }, { id: 20, type: "wall", ringId: "inner", seg: 0, x: -28, z: -35.5, w: 22.20075756488817, d: 3.2, h: 7.5, rot: 0.4297622790966885, a: [-38.090963871922, -30.87497489203575], b: [-17.909036128077997, -40.12502510796425] }, { id: 21, type: "wall", ringId: "inner", seg: 1, x: -7.500000000000002, z: -34, w: 17.82271554554524, d: 3.2, h: 7.5, rot: -0.6889243882148613, a: [-14.378946505204196, -39.66501476899169], b: [-0.621053494795806, -28.33498523100831] }, { id: 22, type: "wall", ringId: "inner", seg: 2, x: -0.15518253732038545, z: -23.14939154226538, w: 3.8403065089105506, d: 3.2, h: 7.5, rot: -1.8622531212727638, a: [0.39656944031067465, -24.988564801035583], b: [-0.7069345149514457, -21.310218283495182] }, { id: 23, type: "wall", ringId: "inner", seg: 2, x: -3.8448174626796137, z: -10.85060845773462, w: 3.8403065089105493, d: 3.2, h: 7.5, rot: -1.8622531212727638, a: [-3.2930654850485537, -12.68978171650482], b: [-4.396569440310674, -9.01143519896442] }, { id: 24, type: "wall", ringId: "inner", seg: 3, x: -17, z: -4.5, w: 20.315301344262522, d: 3.2, h: 7.5, rot: -2.936197264400026, a: [-7.055858881448971, -6.571696066364797], b: [-26.94414111855103, -2.4283039336352026] }, { id: 25, type: "wall", ringId: "inner", seg: 4, x: -37, z: -8.499999999999998, w: 16.4155281280883, d: 3.2, h: 7.5, rot: 2.459276098715045, a: [-30.62983940024416, -3.324244512698378], b: [-43.37016059975584, -13.67575548730162] }, { id: 26, type: "wall", ringId: "inner", seg: 5, x: -42.5, z: -22.5, w: 11.611388300841899, d: 3.2, h: 7.5, rot: 1.2490457723982544, a: [-44.33592169136464, -16.99223492590608], b: [-40.66407830863536, -28.007765074093925] }, { id: 27, type: "tower", ringId: "inner", seg: 0, x: -40, z: -30, w: 8, d: 8, h: 19, rot: 0, def: true }, { id: 28, type: "tower", ringId: "inner", seg: 1, x: -16, z: -41, w: 8, d: 8, h: 17, rot: 0, def: true }, { id: 29, type: "tower", ringId: "inner", seg: 2, x: 1, z: -27, w: 8, d: 8, h: 17, rot: 0, def: true, wk: "wizard" }, { id: 30, type: "tower", ringId: "inner", seg: 3, x: -5, z: -7, w: 8, d: 8, h: 19, rot: 0, def: true }, { id: 31, type: "tower", ringId: "inner", seg: 4, x: -29, z: -2, w: 8, d: 8, h: 17, rot: 0, def: true }, { id: 32, type: "tower", ringId: "inner", seg: 5, x: -45, z: -15, w: 8, d: 8, h: 17, rot: 0, def: true, wk: "wizard" }, { id: 33, type: "wall", ringId: "town", seg: 0, x: 122.29558219239605, z: 40.53763865229418, w: 26.62411395353275, d: 3.8, h: 8.2, rot: -2.0350539078253886, a: [128.2561766815707, 28.634606505471456], b: [116.33498770322142, 52.4406707991169] }, { id: 34, type: "wall", ringId: "town", seg: 0, x: 105.71769870052357, z: 73.64290700906905, w: 26.624113953532742, d: 3.8, h: 8.2, rot: -2.0350539078253886, a: [111.67829318969821, 61.73987486224633], b: [99.75710421134892, 85.54593915589177] }, { id: 35, type: "wall", ringId: "town", seg: 1, x: 70.98586357914942, z: 110.39308617570869, w: 67.0521042915915, d: 3.8, h: 8.2, rot: -2.454309980374536, a: [96.90059148846689, 89.12284758116868], b: [45.071135669831975, 131.6633247702487] }, { id: 36, type: "wall", ringId: "town", seg: 2, x: 8.324841393909729, z: 129.17540258762432, w: 65.64531214552638, d: 3.8, h: 8.2, rot: 3.028375692619769, a: [40.937360353669575, 132.88355020742083], b: [-24.287677565850117, 125.46725496782778] }, { id: 37, type: "wall", ringId: "town", seg: 3, x: -61.72823177677399, z: 114.52755926192467, w: 68.7247293086543, d: 3.8, h: 8.2, rot: 2.8464646889785943, a: [-28.851526361049736, 124.5222751480637], b: [-94.60493719249823, 104.53284337578565] }, { id: 38, type: "wall", ringId: "town", seg: 4, x: -112.49430221396076, z: 71.51501703138446, w: 67.17079841991603, d: 3.8, h: 8.2, rot: 2.021545316674283, a: [-97.8631643493502, 101.74594233774926], b: [-127.12544007857134, 41.28409172501967] }, { id: 39, type: "wall", ringId: "town", seg: 5, x: -131.99311948884315, z: 2.6543715244466313, w: 68.7712278839281, d: 3.8, h: 8.2, rot: 1.6757737267326862, a: [-128.39003348115426, 36.85069029397195], b: [-135.596205496532, -31.541947245078674] }, { id: 40, type: "wall", ringId: "town", seg: 6, x: -126.11759263658195, z: -46.83419447783273, w: 27.732777400732274, d: 3.8, h: 8.2, rot: 0.9272970828638024, a: [-134.43740516966398, -35.74106800221671], b: [-117.79778010349993, -57.927320953448756] }, { id: 41, type: "wall", ringId: "town", seg: 6, x: -103.23798308608218, z: -77.34045906579038, w: 27.732777400732267, d: 3.8, h: 8.2, rot: 0.9272970828638024, a: [-111.55779561916421, -66.24733259017435], b: [-94.91817055300018, -88.43358554140639] }, { id: 42, type: "wall", ringId: "town", seg: 7, x: -66.32733928501925, z: -113.40237449145548, w: 66.66663336330966, d: 3.8, h: 8.2, rot: 0.7042372628022532, a: [-91.73084691737179, -91.82062755168033], b: [-40.9238316526667, -134.98412143123062] }, { id: 43, type: "wall", ringId: "town", seg: 8, x: -3.6034071534288756, z: -132.28909834583644, w: 66.89122091266121, d: 3.8, h: 8.2, rot: -0.11791988917353101, a: [-36.816754650255106, -136.22386731639588], b: [29.60994034339737, -128.354329375277] }, { id: 44, type: "wall", ringId: "town", seg: 9, x: 63.89827267124886, z: -113.6739641575827, w: 65.44105596270876, d: 3.8, h: 8.2, rot: -0.4234003843543787, a: [34.06706148434855, -127.11761658172509], b: [93.72948385814917, -100.23031173344035] }, { id: 45, type: "wall", ringId: "town", seg: 10, x: 110.41343779766153, z: -67.55087435147186, w: 65.11261072788683, d: 3.8, h: 8.2, rot: -1.1406912831834881, a: [96.83855622128905, -97.14201507192728], b: [123.98831937403402, -37.95973363101646] }, { id: 46, type: "wall", ringId: "town", seg: 11, x: 127.13397670954744, z: -4.645285332471264, w: 57.84593990324902, d: 3.8, h: 8.2, rot: -1.5013306809358686, a: [125.12643938495619, -33.498499793133135], b: [129.1415140341387, 24.207929128190607] }, { id: 47, type: "ballista", ringId: "town", seg: 0, x: 129.30393294711342, z: 26.542285591267337, w: 8.8, d: 8.8, h: 19.7, rot: 0, def: true, wk: "ballista" }, { id: 48, type: "tower", ringId: "town", seg: 1, x: 98.7093479458062, z: 87.6382600700959, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true }, { id: 49, type: "ballista", ringId: "town", seg: 2, x: 43.26237921249265, z: 133.14791228132148, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true, wk: "cannon" }, { id: 50, type: "ballista", ringId: "town", seg: 3, x: -26.612696424673196, z: 125.20289289392713, w: 8.8, d: 8.8, h: 19.7, rot: 0, def: true, wk: "ballista" }, { id: 51, type: "tower", ringId: "town", seg: 4, x: -96.84376712887477, z: 103.85222562992222, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true }, { id: 52, type: "ballista", ringId: "town", seg: 5, x: -128.14483729904677, z: 39.1778084328467, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true, wk: "quad" }, { id: 53, type: "ballista", ringId: "town", seg: 6, x: -135.8414016786395, z: -33.86906538395345, w: 8.8, d: 8.8, h: 19.7, rot: 0, def: true, wk: "ballista" }, { id: 54, type: "tower", ringId: "town", seg: 7, x: -93.51417404402464, z: -90.30558815966965, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true, wk: "wizard" }, { id: 55, type: "ballista", ringId: "town", seg: 8, x: -39.14050452601384, z: -136.4991608232413, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true, wk: "cannon" }, { id: 56, type: "ballista", ringId: "town", seg: 9, x: 31.933690219156105, z: -128.07903586843156, w: 8.8, d: 8.8, h: 19.7, rot: 0, def: true, wk: "ballista" }, { id: 57, type: "tower", ringId: "town", seg: 10, x: 95.86285512334162, z: -99.26889244673386, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true }, { id: 58, type: "ballista", ringId: "town", seg: 11, x: 124.96402047198146, z: -35.832856256209865, w: 8.8, d: 8.8, h: 17.7, rot: 0, def: true, wk: "quad" }, { id: 59, type: "gate", ringId: "town", x: 114.00664044645981, z: 57.09027283068161, w: 24, d: 7.6, h: 17, rot: -2.0350539078253886, a: [119.37974950052505, 46.3604219886092], b: [108.63353139239457, 67.82012367275402] }, { id: 60, type: "gate", ringId: "town", x: -114.67778786133206, z: -62.08732677181155, w: 24, d: 7.6, h: 17, rot: 0.9272970828638024, a: [-121.87776995864252, -52.48731334482047], b: [-107.47780576402161, -71.68734019880262] }, { id: 61, type: "gate", ringId: "outer", x: 49, z: 26, w: 26, d: 8.6, h: 25, rot: -2.0344439357957027, a: [54.81377674149945, 14.372446517001094], b: [43.18622325850055, 37.627553482998906] }, { id: 62, type: "keep", x: -21, z: -20, w: 26, d: 18, h: 48, rot: 0.35, def: true, keep: true }, { id: 63, type: "church", x: -31.360291253840636, z: 87.07175316760856, w: 24, d: 24, h: 28, rot: 0, n: 1, share: 2.4 }, { id: 64, type: "house", x: 56.80227155030704, z: 95.5683775711189, w: 18.10100542615357, d: 16.12961803576168, h: 7.2, rot: 0, n: 2, share: 0.82 }, { id: 65, type: "house", x: 37.208032894687406, z: 107.65991342657253, w: 27.58622871333447, d: 14.054574405114721, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 66, type: "house", x: 37.90716754312739, z: 87.8362908597906, w: 17.207258628241448, d: 17.083718121587907, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 67, type: "house", x: 10.302182343455522, z: 108.11295799837484, w: 21.62186004039317, d: 10.642273104557873, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 68, type: "house", x: -11.925640525700606, z: 105.09280344473993, w: 18.526896433842825, d: 10.624055821953661, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 69, type: "house", x: 10.997005499971333, z: 90.81747465577115, w: 31.31884339517373, d: 13.595115746849814, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 70, type: "house", x: -11.204518943983572, z: 87.14483450720657, w: 10.203985846182333, d: 10.20398584618232, h: 13.600000000000001, rot: 0, n: 1, share: 0.66 }, { id: 71, type: "house", x: -47.93712480807954, z: 96.26302977964382, w: 10.330826559709394, d: 10.33082655970938, h: 7.2, rot: 0, n: 1, share: 0.66 }, { id: 72, type: "house", x: -64.10093112274077, z: 93.5159991287266, w: 19.076769915142073, d: 12.16761693530809, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 73, type: "house", x: -79.70970875744896, z: 88.83585927367182, w: 8.878111176332453, d: 8.878111176332453, h: 10.4, rot: 0, n: 1, share: 0.66 }, { id: 74, type: "house", x: -64.11555974211316, z: 67.02510923220717, w: 34.38605933713264, d: 31.67323959289753, h: 10.4, rot: 0, n: 4, share: 1.14 }, { id: 75, type: "house", x: -91.07011760711134, z: 67.36683019092786, w: 18.086154239808124, d: 29.035823631440266, h: 7.2, rot: 0, n: 3, share: 0.98 }, { id: 76, type: "house", x: -91.71536260530475, z: 38.78463056658824, w: 32.3010060261191, d: 27.84121932719331, h: 10.4, rot: 0, n: 5, share: 1.3 }, { id: 77, type: "house", x: -108.9753540164917, z: 16.99519906586465, w: 11.961848469924917, d: 22.230830019717718, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 78, type: "house", x: -112.49551153835597, z: -10.840886567547265, w: 11.018142371003094, d: 28.770188535173475, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 79, type: "house", x: -91.71246351374303, z: 12.873697658390864, w: 12.692032007752971, d: 21.201480728621434, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 80, type: "house", x: -94.96853019455017, z: -10.581053990934926, w: 10.453441411345025, d: 22.126003256588895, h: 7.2, rot: 0, n: 2, share: 0.82 }, { id: 81, type: "house", x: -108.31838754418546, z: -36.70433130503937, w: 7.9830082966946065, d: 7.9830082966946065, h: 13.600000000000001, rot: 0, n: 1, share: 0.66 }, { id: 82, type: "house", x: -87.79009223608398, z: -61.779539039345806, w: 17.72064124474916, d: 20.333786305144365, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 83, type: "house", x: -84.22754776769702, z: -38.95233827408326, w: 22.346917071842668, d: 22.707403705766104, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 84, type: "house", x: -64.65025840203992, z: -61.54578528362223, w: 24.21310632132265, d: 24.560336317532247, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 85, type: "house", x: -64.29547110220528, z: -87.5306317610926, w: 24.27297949307387, d: 24.58061419043314, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 86, type: "house", x: -40.90765324216915, z: -91.41271698561803, w: 32.40104721915266, d: 28.431434303615475, h: 13.600000000000001, rot: 0, n: 4, share: 1.14 }, { id: 87, type: "house", x: -40.63260897288285, z: -108.86405622662781, w: 15.72073607224376, d: 15.451423450835605, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 88, type: "house", x: -50.34462945176085, z: -75.91650698362996, w: 10.333317753113803, d: 10.333317753113818, h: 10.4, rot: 0, n: 1, share: 0.66 }, { id: 89, type: "house", x: -14.111320735688196, z: -113.32385629399874, w: 29.370155360376536, d: 13.37513339997399, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 90, type: "house", x: 10.437367181830645, z: -108.70738619478628, w: 20.555384667687015, d: 9.54742527306081, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 91, type: "house", x: 26.352640881927833, z: -106.6533984767536, w: 8.690067485440522, d: 8.690067485440522, h: 10.4, rot: 0, n: 1, share: 0.66 }, { id: 92, type: "house", x: -9.72902832637837, z: -88.83798322025659, w: 25.018922295251457, d: 22.436024795085018, h: 10.4, rot: 0, n: 4, share: 1.14 }, { id: 93, type: "house", x: 7.873113429882816, z: -91.14792148850975, w: 18.83750393399443, d: 11.692846201522727, h: 10.4, rot: 0, n: 2, share: 0.82 }, { id: 94, type: "house", x: 36.917952334090984, z: -93.37431153866683, w: 31.035456378768977, d: 30.498738500671408, h: 10.4, rot: 0, n: 4, share: 1.14 }, { id: 95, type: "house", x: 66.22321961392745, z: -89.59109755120616, w: 19.015216822593587, d: 13.370792727727078, h: 7.2, rot: 0, n: 2, share: 0.82 }, { id: 96, type: "house", x: 63.64049283750987, z: -65.01503063319208, w: 30.698206512528294, d: 31.729692282445953, h: 10.4, rot: 0, n: 4, share: 1.14 }, { id: 97, type: "house", x: 89.32750982664894, z: -62.904958376263835, w: 18.652092053550135, d: 29.194865687005397, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 98, type: "house", x: 89.57193595937846, z: -38.95940904472064, w: 29.212212963047932, d: 19.838243307669526, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 99, type: "house", x: -36.874672497185486, z: 109.58341385298792, w: 8.977695235330614, d: 8.9776952353306, h: 7.2, rot: 0, n: 1, share: 0.66 }, { id: 100, type: "house", x: -107.9568127292858, z: 55.28231398501318, w: 7.866173047292989, d: 7.866173047292975, h: 10.4, rot: 0, n: 1, share: 0.66 }, { id: 101, type: "house", x: 78.37927905314521, z: 89.12592996782378, w: 6.94211996751838, d: 6.94211996751838, h: 10.4, rot: 0, n: 1, share: 0.66 }, { id: 102, type: "house", x: -233.72278430495612, z: -137.2964625810909, w: 24.51720862011021, d: 34.27707096969263, h: 10.4, rot: 0, n: 4, share: 1.14 }, { id: 103, type: "house", x: 193.6381589958736, z: -78.11493222051551, w: 29.203820077462893, d: 36.89128496257694, h: 10.4, rot: 0, n: 5, share: 1.3 }, { id: 104, type: "house", x: 212.9439244695405, z: 172.04704933661336, w: 35.81003678022759, d: 15.134674245098608, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 105, type: "house", x: 32.60858415478309, z: -228.50155225378126, w: 21.047367196985626, d: 32.94520474672518, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 106, type: "house", x: 205.09133088873452, z: -186.3599803606997, w: 30.511560601450753, d: 35.29462947887882, h: 7.2, rot: 0, n: 5, share: 1.3 }, { id: 107, type: "house", x: -224.26001397378332, z: -35.64401341502318, w: 20.263363721001383, d: 34.68633167088317, h: 7.2, rot: 0, n: 3, share: 0.98 }, { id: 108, type: "house", x: -234.00335588266995, z: 157.30389820380458, w: 33.962639246522826, d: 16.58909986774293, h: 10.4, rot: 0, n: 3, share: 0.98 }, { id: 109, type: "mine", gem: "ruby", x: 109.85634569189845, z: -206.6097367289889, w: 24, d: 28, h: 18, rot: 1.0821041362364843 }, { id: 110, type: "mine", gem: "emerald", x: -229.51314143112853, z: 70.16920913345679, w: 24, d: 28, h: 18, rot: -2.844886680750757 }, { id: 111, type: "mine", gem: "turq", x: -145.2961081768553, z: -185.97053785118644, w: 24, d: 28, h: 18, rot: 2.2340214425527414 }, { id: 112, type: "forge", x: 228.55017531874097, z: 6.367987648873523, w: 20, d: 18, h: 10, rot: -0.02880310629089844 }, { id: 113, type: "stable", x: -10, z: 214, w: 30, d: 24, h: 10, rot: 1.7126933813990606 }, { id: 114, type: "workshop", x: -59.69057323504745, z: -258.51875371132235, w: 30, d: 24, h: 10, rot: 0.5045787603379731 }, { id: 115, type: "lair", x: 272, z: 4, w: 26, d: 26, h: 12, rot: -1.5855011491727482 }, { id: 116, type: "vault", gem: "ruby", x: 85.55370546495107, z: 14.114325864461625, w: 17, d: 14, h: 14, rot: -0.4636476090008061 }, { id: 117, type: "vault", gem: "emerald", x: 59.6153169259535, z: 65.1657034610358, w: 17, d: 14, h: 14, rot: 2.677945044588987 }, { id: 118, type: "vault", gem: "turq", x: 108.03219460599445, z: -11.565942021996463, w: 17, d: 14, h: 14, rot: -0.4636476090008062 }, { id: 119, type: "house", x: 13.5, z: 33.5, w: 32, d: 20, h: 11.4, rot: 0, n: 3, share: 0.98 }, { id: 120, type: "house", x: -12, z: 37, w: 9, d: 9, h: 11.4, rot: 0, n: 1, share: 0.66 }, { id: 121, type: "house", x: -28, z: 31, w: 9, d: 9, h: 8.2, rot: 0, n: 1, share: 0.66 }, { id: 122, type: "house", x: -36.5, z: 17, w: 18, d: 19, h: 11.4, rot: 0, n: 2, share: 0.82 }, { id: 123, type: "house", x: -6, z: 17, w: 9, d: 9, h: 8.2, rot: 0, n: 1, share: 0.66 }, { id: 124, type: "house", x: 30, z: -24, w: 9, d: 9, h: 11.4, rot: 0, n: 1, share: 0.66 }, { id: 125, type: "house", x: 257, z: -18, w: 9, d: 9, h: 8.2, rot: 0, n: 1, share: 0.66 }, { id: 126, type: "house", x: -92, z: 177, w: 9, d: 9, h: 8.2, rot: 0, n: 1, share: 0.66 }], meta: { gates: [{ x: 114.00664044645981, z: 57.09027283068161, nx: 0.894154236839368, nz: 0.44775908783876983 }, { x: -114.67778786133206, z: -62.08732677181155, nx: -0.8000011189159231, nz: -0.5999985081092045 }], town: [[129.30393294711342, 26.542285591267337], [98.7093479458062, 87.6382600700959], [43.26237921249265, 133.14791228132148], [-26.612696424673196, 125.20289289392713], [-96.84376712887477, 103.85222562992222], [-128.14483729904677, 39.1778084328467], [-135.8414016786395, -33.86906538395345], [-93.51417404402464, -90.30558815966965], [-39.14050452601384, -136.4991608232413], [31.933690219156105, -128.07903586843156], [95.86285512334162, -99.26889244673386], [124.96402047198146, -35.832856256209865]], keep: { x: -21, z: -20 }, deploy: { d: 64, lat: -7 } } };

// src/layout.js
var layout_exports = {};
__export(layout_exports, {
  CAMP: () => CAMP,
  FARMS: () => FARMS,
  FIELDS: () => FIELDS,
  FIELDS2: () => FIELDS2,
  GATE: () => GATE,
  GATE_SEG: () => GATE_SEG,
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
  PASTURE: () => PASTURE,
  PLAZA: () => PLAZA,
  RBRIDGES: () => RBRIDGES,
  RIVER: () => RIVER,
  TGATES: () => TGATES,
  TOWN: () => TOWN,
  TOWN_GATES: () => TOWN_GATES,
  WALL: () => WALL,
  WINDMILL: () => WINDMILL,
  distPolyline: () => distPolyline,
  fieldD: () => fieldD,
  height: () => height,
  inside: () => inside,
  mineLocal: () => mineLocal,
  nearMine: () => nearMine,
  sdPoly: () => sdPoly,
  sdTown: () => sdTown,
  segMid: () => segMid,
  segNormalOut: () => segNormalOut,
  setMap: () => setMap,
  stableAt: () => stableAt,
  stableYard: () => stableYard
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
    let n = 0, tt, g;
    tt = 0.5 - x0 * x0 - y0 * y0;
    if (tt > 0) {
      g = GRAD[perm[ii + perm[jj]] & 7];
      tt *= tt;
      n += tt * tt * (g[0] * x0 + g[1] * y0);
    }
    tt = 0.5 - x1 * x1 - y1 * y1;
    if (tt > 0) {
      g = GRAD[perm[ii + i1 + perm[jj + j1]] & 7];
      tt *= tt;
      n += tt * tt * (g[0] * x1 + g[1] * y1);
    }
    tt = 0.5 - x2 * x2 - y2 * y2;
    if (tt > 0) {
      g = GRAD[perm[ii + 1 + perm[jj + 1]] & 7];
      tt *= tt;
      n += tt * tt * (g[0] * x2 + g[1] * y2);
    }
    return 70 * n;
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
var MAP = "night";
var DEG = Math.PI / 180;
var ring = (pts) => pts.map(([a, r]) => [Math.cos(a * DEG) * r, Math.sin(a * DEG) * r]);
var polar = (a, r) => [Math.cos(a * DEG) * r, Math.sin(a * DEG) * r];
var NIGHT = {
  OUTER: [[-50, -40], [-18, -54], [22, -52], [52, -32], [58, 8], [40, 44], [-6, 54], [-44, 38], [-60, 2]],
  GATE_SEG: 4,
  INNER: [[-40, -30], [-16, -41], [1, -27], [-5, -7], [-29, -2], [-45, -15]],
  INNER_GATE_SEG: 2,
  // the lower town's wall (third ring): main gate in line with the Blue Wall gate, west gate toward lake & mines
  TOWN: ring([[11.6, 132], [41.6, 132], [72, 140], [102, 128], [133, 142], [163, 134], [194, 140], [224, 130], [254, 142], [284, 132], [314, 138], [344, 130]]),
  TOWN_GATES: [0, 6],
  KEEP: { x: -21, z: -20, rot: 0.35 },
  PLAZA: { x: 12, z: 6, r: 9 },
  MOAT: { off: 10, half: 4.2, level: -0.75, on: false },
  MOAT2: { off: 13, half: 5 },
  WINDMILL: { x: 236, z: 34 },
  FIELDS: { x: 206, z: -22, w: 66, d: 44, rot: 0.12 },
  FIELDS2: { x: 150, z: 168, w: 52, d: 36, rot: -0.75 },
  LAKE: { x: -128, z: 196, r: 40 },
  RIVER: [[492, -282], [396, -258], [304, -228], [250, -166], [186, -138], [146, -104], [124, -86]],
  // stone bridges over the river (where the farm road to the ruby mine crosses it): centre, direction of travel (unit), length, width
  RBRIDGES: [{ x: 145.2, z: -103.1, nx: -0.5048, nz: -0.8632, len: 22, wid: 7 }],
  PASTURE: { x: 46, z: 206, r: 30, fr: 44 },
  CAMP: { x: -34, z: -212, r: 30, fr: 46 },
  MUSTER: { x: 215, z: 60, r: 34, fr: 66 },
  LAIR: { x: 272, z: 4, r: 24 },
  MINES: [
    { id: "ruby", ...xz(polar(-62, 238)), a: -62 },
    { id: "emerald", ...xz(polar(163, 244)), a: 163 },
    { id: "turq", ...xz(polar(232, 240)), a: 232 }
  ],
  MOUNT: 445
};
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
var TOWN = null;
var TOWN_GATES = [];
var TGATES = [];
var MOAT2 = null;
var FIELDS2 = null;
var FARMS = [];
var MINES = [];
var MOUNT = 330;
var _SA = null;
var _SY = null;
function calcStable() {
  const P = PASTURE;
  _SA = _SY = null;
  if (!P || !(P.r > 0)) return;
  const x = P.x - 56, z = P.z + 8, ry = Math.atan2(P.x - x, P.z - z), c = Math.cos(ry), s = Math.sin(ry);
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
  calcStable();
  TOWN = c.TOWN || null;
  TOWN_GATES = c.TOWN_GATES || [];
  MOAT2 = c.MOAT2 || null;
  FIELDS2 = c.FIELDS2 || null;
  MINES = c.MINES || [];
  MOUNT = c.MOUNT || 330;
  FARMS = [FIELDS, FIELDS2].filter(Boolean);
  const gateOf = (poly, i) => {
    const mm = segMid(poly, i), n = segNormalOut(poly, i), a = poly[i], b = poly[(i + 1) % poly.length];
    return { x: mm[0], z: mm[1], nx: n[0], nz: n[1], rot: Math.atan2(b[0] - a[0], b[1] - a[1]), seg: i };
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
  return d;
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
      const spur = pad + 46 * smooth(2, 40, u) * Math.exp(-(v * v) / (w * w)) * (0.85 + 0.15 * N.fbm(x * 0.05, z * 0.05, 2));
      h = Math.max(h, spur);
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
    if (rd < 7) h = Math.min(h, lerp(-2.2, h, smooth(3.4, 7, rd)));
  }
  const ld = Math.hypot(x - LAKE.x, z - LAKE.z) - LAKE.r * (1 + 0.12 * N.fbm(x * 0.03, z * 0.03, 2));
  if (ld < 18) h = Math.min(h, lerp(-3, h, smooth(-6, 18, ld)));
  const fd = fieldD(x, z);
  if (fd < 1.5) h = lerp(1.2 + N.fbm(x * 0.02, z * 0.02, 2) * 0.4, h, smooth(0.9, 1.5, fd));
  return h;
}

// src/nav.js
var CELL = 2.5;
var HALF = 380;
var N2 = Math.ceil(2 * HALF / CELL);
var WET = -0.3;
var DECK = 0.72;
var idx = (i, j) => j * N2 + i;
var ci = (v) => Math.max(0, Math.min(N2 - 1, Math.floor((v + HALF) / CELL)));
var cc = (i) => -HALF + (i + 0.5) * CELL;
function bridgesFromLayout(L) {
  const out = [];
  const add = (G, poly, off, len, wid) => {
    if (!G || !poly) return;
    const a = poly[G.seg], b = poly[(G.seg + 1) % poly.length], al = Math.hypot(b[0] - a[0], b[1] - a[1]);
    out.push({ x: G.x + G.nx * off, z: G.z + G.nz * off, nx: G.nx, nz: G.nz, tx: (b[0] - a[0]) / al, tz: (b[1] - a[1]) / al, len, wid, y: DECK });
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
function buildNav({ height: height2, bridges = [] }) {
  const state = new Uint8Array(N2 * N2);
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
    let wet = onBridge(x, z, 2.5) ? false : wetAt(x, z) || wetAt(x + 1.1, z) || wetAt(x - 1.1, z) || wetAt(x, z + 1.1) || wetAt(x, z - 1.1);
    state[k] = wet ? 2 : 1;
    return wet;
  };
  const isWet = (x, z) => {
    if (x < -HALF || x > HALF || z < -HALF || z > HALF) return false;
    return cell(ci(x), ci(z)) && !onBridge(x, z, 2.5);
  };
  const clear = (ax, az, bx, bz) => {
    const d = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(d / 1.6));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      if (isWet(ax + (bx - ax) * t, az + (bz - az) * t)) return false;
    }
    return true;
  };
  const nearestDry = (x, z, maxR = 60) => {
    if (!isWet(x, z)) return [x, z];
    const i0 = ci(x), j0 = ci(z), R = Math.ceil(maxR / CELL);
    let best = null, bd = 1e9;
    for (let r = 1; r <= R; r++) {
      for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const i = i0 + di, j = j0 + dj;
        if (i < 0 || j < 0 || i >= N2 || j >= N2 || cell(i, j)) continue;
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
  const gS = new Float32Array(N2 * N2), stamp = new Int32Array(N2 * N2), from = new Int32Array(N2 * N2), closed = new Int32Array(N2 * N2);
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
    const k = heap[1], n = heap.length / 2 - 1;
    heap[0] = heap[n * 2];
    heap[1] = heap[n * 2 + 1];
    heap.length -= 2;
    let i = 0;
    for (; ; ) {
      let l = i * 2 + 1, r = l + 1, m = i;
      if (l < n && heap[l * 2] < heap[m * 2]) m = l;
      if (r < n && heap[r * 2] < heap[m * 2]) m = r;
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
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];
  const astar = (ax, az, bx, bz, maxNodes) => {
    const [sx, sz] = isWet(ax, az) ? nearestDry(ax, az, 30) : [ax, az], [gx, gz] = isWet(bx, bz) ? nearestDry(bx, bz, 40) : [bx, bz];
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
      const i2 = k % N2, j = k / N2 | 0;
      for (const [di, dj, c] of DIRS) {
        const ni = i2 + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= N2 || nj >= N2) continue;
        if (cell(ni, nj)) continue;
        if (di && dj && (cell(i2 + di, j) || cell(i2, j + dj))) continue;
        const nk = idx(ni, nj), g = gS[k] + c * CELL;
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
    if (!found) return null;
    const raw = [];
    for (let k = gk; k !== -1 && k !== void 0; k = from[k]) {
      raw.push([cc(k % N2), cc(k / N2 | 0)]);
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
    const direct = astar(ax, az, bx, bz, 3500);
    if (direct) return direct;
    const cand = [];
    for (const b of bridges) for (const s of [1, -1]) {
      const e1 = [b.x + b.nx * s * (b.len / 2 + 1.5), b.z + b.nz * s * (b.len / 2 + 1.5)], e2 = [b.x - b.nx * s * (b.len / 2 + 1.5), b.z - b.nz * s * (b.len / 2 + 1.5)];
      cand.push({ L: Math.hypot(e1[0] - ax, e1[1] - az) + b.len + 3 + Math.hypot(bx - e2[0], bz - e2[1]), e1, e2 });
    }
    cand.sort((p, q) => p.L - q.L);
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
    for (let j = Math.max(0, j0); j < Math.min(N2, j1); j++) for (let i = 0; i < N2; i++) {
      const x = cc(i), z = cc(j);
      if (x * x + z * z < 330 * 330) cell(i, j);
    }
  };
  return { isWet, clear, route, nearestDry, groundY, onBridge, bridges, warm, rows: N2 };
}

// ../../../../dev/plan5/owner_army.json
var owner_army_default = { spear: 20, sword: 20, guard: 7, archer: 23, cavalry: 7, pegasus: 4, baby: 1, dragon: 1, catapult: 2, giant: 1, imp: 5, mage: 4, ram: 2, cannon: 2, werewolf: 1, trebuchet: 1, hill: 1, shieldmaiden: 1, lord: 1 };

// ../../../../dev/plan5/owner_army_full.json
var owner_army_full_default = { spear: 36, sword: 20, guard: 7, archer: 39, cavalry: 7, pegasus: 4, baby: 1, dragon: 1, catapult: 2, giant: 1, imp: 5, mage: 4, ram: 2, cannon: 2, werewolf: 1, trebuchet: 1, hill: 1, shieldmaiden: 1, lord: 1 };

// ../../../../dev/plan5/r7.js
if (process.env.TUNE_KV) for (const kv of process.env.TUNE_KV.split(",")) {
  const [k, v] = kv.split("=");
  TUNE[k] = +v;
}
var ARMY = process.env.FULL ? owner_army_full_default : owner_army_default;
var NAV = buildNav({ height, bridges: bridgesFromLayout(layout_exports) });
var U = unitdefs_default.units;
var FORGE = 20;
var power = (army, forge) => Object.entries(army).reduce((s, [t, n]) => s + n * Math.sqrt(U[t].hp * U[t].dps) / 3 * (1 + 0.06 * (forge - 1)), 0);
var keepT = basetargets_default.targets.find((t) => t.type === "keep");
function play(army, ratio, seed, style, spells) {
  const P = power(army, FORGE);
  const spec = { seed, ratio, power: Math.round(P * ratio), levels: { keep: 20, wall: 20, towers: 20 }, loot: { ruby: 1e3, emerald: 1e3, turq: 1e3 } };
  const sim = createBattle({ spec, army, forge: FORGE, spells, targets: JSON.parse(JSON.stringify(basetargets_default.targets)), meta: basetargets_default.meta, nav: NAV });
  const g = sim.base.deploy, gx = basetargets_default.meta.gates[0].x, gz = basetargets_default.meta.gates[0].z;
  const prio = { giant: 0, tank: 1, infantry: 2, cavalry: 3, siege: 4, ranged: 5, air: 6 };
  const seq = unitdefs_default.order.filter((u) => army[u] > 0).sort((a, b) => prio[U[a].role] - prio[U[b].role]);
  const sendTo = (ty) => {
    const role = U[ty].role;
    if (role === "air") sim.send(ty, keepT.x, keepT.z);
    else if (role === "ranged" || role === "siege") sim.send(ty, gx - g.nx * 14, gz - g.nz * 14);
    else sim.send(ty, gx, gz);
  };
  let t = 0, k = 0, nextSend = 0, s2 = 0, t50 = -1, tKeep = -1;
  const dt = 0.1;
  let cast = 0;
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
      for (const ty of seq) sim.send(ty, keepT.x, keepT.z);
    }
    if (spells && t > 20 && cast < 6 && Math.round(t * 10) % 150 === 0) {
      const s = ["rage", "heal", "lightning", "freeze", "quake", "lightning"][cast++];
      sim.cast(s, keepT.x, keepT.z);
    }
    sim.step(dt);
    t += dt;
    if (t50 < 0 && sim.destruction() >= 50) t50 = t;
    if (tKeep < 0 && sim.keepDown) tKeep = t;
  }
  const r = sim.result();
  if (process.env.DBG && r.destruction < 100) {
    console.log("   seed", seed, "left:", sim.buildings.filter((b) => !b.dead && b.value > 0).map((b) => b.type + "@" + Math.round(b.x) + "," + Math.round(b.z) + " hp" + Math.round(b.hp)).join(" | "));
    const by = {};
    for (const u of sim.units) if (!u.dead) {
      const k2 = u.type + (u.go ? ">go" : "") + (u.target ? ">" + (u.target.type || "def") : ".idle");
      by[k2] = (by[k2] || 0) + 1;
    }
    console.log("   alive:", JSON.stringify(by), "guardians", sim.defenders.filter((d) => d.guardian && !d.dead).map((d) => d.type).join(","));
  }
  return { r, t50, tKeep, left: sim.buildings.filter((b) => !b.dead && b.value > 0).map((b) => b.type) };
}
var ratios = (process.argv[2] || "0.54,1.0,1.15").split(",").map(Number);
var NS = +(process.env.NS || 4);
console.log("owner army power", power(ARMY, FORGE).toFixed(0), "space", Object.entries(ARMY).reduce((s, [t, n]) => s + n * U[t].space, 0));
for (const ratio of ratios) for (const sp of [null, { lightning: 3, heal: 2, freeze: 2, rage: 1, quake: 1 }]) {
  const res = [];
  for (let s = 1; s <= NS; s++) res.push(play(ARMY, ratio, s, ["smart", "all"][s % 2], sp));
  const st = [0, 0, 0, 0];
  res.forEach((x) => st[x.r.stars]++);
  const lostSp = res.map((x) => Object.entries(x.r.lost).reduce((q, [ty, n]) => q + n * U[ty].space, 0));
  console.log(`ratio ${ratio} spells ${sp ? "yes" : "no "}: stars0/1/2/3 ${st.join("/")}  des ${res.map((x) => x.r.destruction.toFixed(0)).join(",")}  end ${res.map((x) => x.r.time.toFixed(0)).join(",")}s  t50 ${res.map((x) => x.t50.toFixed(0)).join(",")}  keepDown ${res.map((x) => x.tKeep.toFixed(0)).join(",")}  lostSpace ${lostSp.join(",")}  left ${res.map((x) => x.left.length).join(",")}`);
}
