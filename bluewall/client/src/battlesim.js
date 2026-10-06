// Battle simulation (pure JS, no three.js: runs in the game, in node for balancing, and one day on the server).
// Siegefall / Clash style: your army stands lined up in front of an enemy base; you send each squad (all units of one type) anywhere,
// the units then fight on their own: they pick targets, walk around / chew through the wall, shoot, breathe fire, and the base fights back
// with towers, ballistae and guards.  Buildings have HP and collapse.  Everything is deterministic for a given seed.
//
//   const sim = createBattle({ spec, army, forge })      spec: {levels:{keep,wall,towers}, seed, ratio, power, loot}  army: {unit: count}
//   sim.send(type, x, z)      sends every unit of that type to (x, z) (attack-move)
//   sim.step(dt)              advance; sim.events is refilled each step (shot / hit / die / collapse / breath / splash)
//   sim.result()              {sent, lost, destruction, stars, loot, time, over}
import DEFS from './unitdefs.json';
import { planArmy, toFrame } from './armyplan.js';
const hyp = (x, z) => Math.sqrt(x * x + z * z);               // (p35: Math.hypot is several times slower than this and is not even the same in every JS engine; sqrt of a sum of squares is IEEE-exact everywhere)
export const MAXL = DEFS.max_level || 20;                         // the top castle level (military.py / progress.MAX_LEVEL: 30 since p35)

// ------------------------------------------------------------------ rng
export function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export const FIELD = { x0: -95, x1: 95, z0: -120, z1: 100, line: 62 };          // base at the origin-ish, our army lines up at z = line
// the giant's club smash (owner 4 Oct: the club must hit where the hit is counted): one smash per GIANT_SWING.iv s, the damage lands GIANT_SWING.hit s after the swing starts = the moment the head of the club
// meets the ground in the 'attack1' clip of the troll (bunits.js plays it from the start of the swing at natural speed; contact measured at 0.86 s; test: dev/s32/giant_test)
export const GIANT_SWING = { iv: 1.8, hit: 0.84, contact: 0.86, clip: 'attack1', reach: 3.0 };
// when the damage of a swing lands, in seconds after the swing starts = the moment the weapon meets the target in the clip (bunits.js plays the clip so that its contact frame falls on exactly this time).
// melee: foot soldiers 0.25, riders a little later (the strike is a long arm swing), arrow / orb: the moment of release (the flight time comes after it)
export const HIT_T = { melee: 0.25, cavalry: 0.32, lord: 0.32, axerider: 0.36, arrow: 0.25, orb: 0.3 };
export const hitTOf = (type) => (type === 'giant' ? GIANT_SWING.hit : type === 'mage' || type === 'lich' ? HIT_T.orb : HIT_T[type] ?? HIT_T.melee);
export const TUNE = { splashK: 0.3, w_tower: 1, w_cannon: 1, w_keep: 1, w_tesla: 1, defHP: 3, brD: 4, brB: 2.5, brL: 2, nb: 0.2, gfrac: 0.12, gleash: 42, ringValue: 0.35, star3: 100, hp: 12, dps: 0.18, tower: 0.55, w_ballista: 4.2, m_ballista_air: 6.5, m_ballista_heavy: 3.2, m_ballista_light: 0.35, m_cannon_light: 1.8, m_cannon_heavy: 0.35, bm_siege: 1.0, bm_giant: 1.0, bm_air: 0.6, bm_infantry: 0.55, bm_cavalry: 0.5, bm_ranged: 0.55, bm_tank: 0.5, us: 2.0, ur: 2.0, sp: 2.9, leash: 18, prefer: 1, hunt: 40, hall: 0, gsiege: 25, cbat: 0, gsl: 1, grng: 1, cb: 0, bms: 1.2, srng: 0.85, rdps: 1, rhp: 1, rsp: 1, hpw_ballista: 2, hpw_wizard: 1.5, hpw_tesla: 1, m_wizard_air: 1.8, w_wizard: 0.65, w_frost: 1, w_flame: 1, treantRegen: 0.012, w_dragonbane: 4.2, hpw_dragonbane: 2, m_dragonbane_air: 9.5, m_dragonbane_heavy: 4.7 };      // us / ur: the real map is ~3.5x bigger than the old made-up base, so speeds / ranges grow by us and radii by ur                     // balance knobs (see /home/claude/dev/bs_cal.js)
const SIEGE = { catapult: { fl: 0.9, sp: 4.2, iv: 2.6, kind: 'rock', h: 4 }, cannon: { fl: 0.55, sp: 2.9, iv: 1.9, kind: 'ball', h: 2.6 }, trebuchet: { fl: 1.45, sp: 6.4, iv: 3.6, kind: 'rock', h: 7, big: true } };       // flight time, blast radius, reload
const BM = { infantry: 0.45, tank: 0.4, ranged: 0.5, cavalry: 0.45, air: 0.8, siege: 2.0, giant: 1.8 };     // damage multiplier against buildings
// the strategy layer (p32): the defences' rules come from the table that military.py DEFENCES exports (hits / class multipliers / pick / blind spot / splash), the units carry layer + size + prefer
const DEFN = DEFS.defences || {};
export const sizeClass = (u) => (u.air ? 'air' : u.size === 'light' ? 'light' : u.size === 'medium' ? 'medium' : 'heavy');          // the class a gun's multiplier is read by ('huge' counts as heavy)
const BUILD_TYPES = {
  // type: [share of the HP budget (relative), w, d, h, defence?]
  keep: [14, 13, 13, 22], tower: [6, 5, 5, 15], ballista: [7, 6, 6, 13], vault: [5, 8, 8, 9], mine: [3, 7, 7, 8], barracks: [5, 10, 8, 7],
  house: [0.8, 6, 5, 6], store: [3, 8, 6, 6], forge: [3, 7, 6, 6], wall: [1.4, 1, 2.6, 8.5], gate: [3.2, 9, 3.4, 11],
  // the real map (targets registered by the world builders): training ground, stable, siege workshop, dragon lair
  training: [4, 30, 28, 8], stable: [4, 30, 24, 10], workshop: [4, 30, 24, 10], lair: [5, 26, 26, 12], church: [2.4, 13, 24, 26],
};

// ------------------------------------------------------------------ base generation
export function makeBase(spec) {
  const R = mulberry(spec.seed | 0), L = Math.max(1, Math.min(MAXL, spec.levels.keep | 0)), D = Math.max(40, spec.power || 100);
  const B = [], defenders = [];
  let id = 1;
  const add = (type, x, z, rot, extra = {}) => { const t = BUILD_TYPES[type]; const b = { id: id++, type, x, z, rot, w: extra.w ?? t[1], d: extra.d ?? t[2], h: extra.h ?? t[3], share: t[0], hp: 0, maxHp: 0, dead: false, collapse: 0, ...extra }; B.push(b); return b; };
  // outer ring (irregular octagon+), the gate faces the army (+z)
  const n = 10 + Math.floor(L / 5), Rr = 30 + L * 0.55, verts = [];
  for (let i = 0; i < n; i++) { const a = Math.PI / 2 + (i / n) * Math.PI * 2 + (R() - 0.5) * 0.12, r = Rr * (0.93 + R() * 0.14); verts.push([Math.cos(a) * r, Math.sin(a) * r * 0.86 - 4]); }
  const gateEdge = 0;                                                       // edge 0 goes from the vertex at +z toward the next one
  verts.sort((p, q) => Math.atan2(p[1] + 4, p[0]) - Math.atan2(q[1] + 4, q[0]));
  let gi = 0, best = -1e9; for (let i = 0; i < n; i++) { const a = verts[i], b2 = verts[(i + 1) % n], zc = (a[1] + b2[1]) / 2; if (zc > best) { best = zc; gi = i; } }
  const walls = [];
  for (let i = 0; i < n; i++) {
    const a = verts[i], b2 = verts[(i + 1) % n], len = hyp(b2[0] - a[0], b2[1] - a[1]), rot = Math.atan2(-(b2[1] - a[1]), b2[0] - a[0]);
    const isGate = i === gi;
    const w = add(isGate ? 'gate' : 'wall', (a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2, rot, { w: len, a, b: b2, ring: true });
    walls.push(w);
  }
  // towers at the corners (arrow towers, ballistae from level 6 on every other corner)
  verts.forEach(([x, z], i) => { if (i % 2 === 0 || L >= 10) add(L >= 6 && i % 4 === 0 ? 'ballista' : 'tower', x * 0.985, z * 0.985, 0, { def: true }); });
  // keep behind the middle, vaults and mines around it, then barracks / houses / stores filling the yard
  const keep = add('keep', 0, -14, 0.2, { def: true, keep: true });
  [[-15, -6], [15, -6], [0, -28]].forEach(([x, z], k) => add('vault', x, z, 0.1 * k, { gem: ['ruby', 'emerald', 'turq'][k] }));
  [[-22, -20], [22, -20], [0, -2]].forEach(([x, z], k) => add('mine', x, z, 0.3 * k, { gem: ['ruby', 'emerald', 'turq'][k] }));
  const spots = [];
  const free = (x, z, r) => B.every((b) => b.ring || hyp(b.x - x, b.z - z) > r + Math.max(b.w, b.d) * 0.55);
  const inside = (x, z) => hyp(x / (Rr * 0.82), (z + 4) / (Rr * 0.7)) < 1;
  const fill = [['barracks', 1 + (L >= 8 ? 1 : 0) + (L >= 15 ? 1 : 0)], ['forge', L >= 6 ? 1 : 0], ['store', 1 + (L >= 10 ? 1 : 0)], ['house', 4 + Math.floor(L / 3)]];
  for (const [type, cnt] of fill) for (let k = 0, tries = 0; k < cnt && tries < 300; tries++) {
    const x = (R() - 0.5) * Rr * 1.6, z = -4 + (R() - 0.5) * Rr * 1.3;
    if (inside(x, z) && free(x, z, 6)) { add(type, x, z, R() * 6.28 - 3.14, {}); k++; }
  }
  // HP budget: the whole base can take about 40 x D (D = defence power budget, ratio x the attacker's power) of damage
  const sum = B.reduce((s, b) => s + b.share, 0), HP = TUNE.hp * D * (0.9 + 0.2 * (L / MAXL));
  for (const b of B) { b.maxHp = b.hp = Math.round((HP * b.share) / sum); b.value = b.ring ? b.share * TUNE.ringValue : b.share; if (b.type === 'wall') b.maxHp = b.hp = Math.round(b.maxHp * (0.8 + b.w / 30)); }
  // defence: 0.12 x D damage per second in total, 70 % towers 30 % guards
  const dps = TUNE.dps * D, towers = B.filter((b) => b.type === 'tower' || b.type === 'ballista' || b.type === 'keep'), tw = towers.reduce((s, b) => s + (b.type === 'keep' ? 1.2 : b.type === 'ballista' ? 2.2 : 1), 0);
  for (const b of towers) {
    const k = (b.type === 'keep' ? 1.2 : b.type === 'ballista' ? 2.2 : 1) / tw, mine = TUNE.tower * dps * k;
    if (b.type === 'ballista') Object.assign(b, { rng: 46, cd: 2.6, dmg: mine * 2.6, splash: 2.4, air: true, ground: true, kind: 'bolt', flight: 0.5 });
    else if (b.type === 'keep') Object.assign(b, { rng: 40, cd: 1.6, dmg: mine * 1.6, splash: 0, air: true, ground: true, kind: 'arrow', flight: 0.5 });
    else Object.assign(b, { rng: 34, cd: 0.9, dmg: mine * 0.9, splash: 0, air: true, ground: true, kind: 'arrow', flight: 0.4 });
    b.t = R();
  }
  const nGuards = Math.max(2, Math.min(40, Math.round(((1 - TUNE.tower) * dps) / 12)));
  const gdps = ((1 - TUNE.tower) * dps) / nGuards;
  for (let i = 0; i < nGuards; i++) {
    const a = R() * 6.28, r = 4 + R() * Rr * 0.5, x = Math.cos(a) * r, z = -6 + Math.sin(a) * r * 0.8;
    defenders.push({ side: 'D', type: i % 4 === 3 ? 'archer' : 'guard', x, z, hx: x, hz: z, hp: 160 * (1 + L / MAXL), maxHp: 160 * (1 + L / MAXL), dps: gdps, rng: i % 4 === 3 ? 24 : 0, spd: 1.0, r: 0.8, air: false, role: i % 4 === 3 ? 'ranged' : 'infantry', cd: 0 });
  }
  const total = B.reduce((s, b) => s + b.value, 0);
  return { buildings: B, defenders, ring: walls, verts, gateIndex: gi, radius: Rr, totalShare: total, level: L };
}

// The enemy base IS the main map: targets = the structures the world builders registered (castle.js, vault.js, mines.js, military.js ...),
// meta = { gates: [{x, z, nx, nz}], town: polygon, keep: {x, z} }.  Same HP budget / defence model as makeBase, laid out on the real footprints.
// the Tesla coils stand on the flat-topped wall towers (the ones that carry a ballista / cannon) closest to the main gate — the same
// towers at home and in a raid; the coil takes the place of that tower's war machine: ids of the first n
export function teslaSpots(T, meta, n) {
  n = Math.max(0, Math.min(4, n | 0)); if (!n || !meta || !meta.gates || !meta.gates.length) return [];
  const g = meta.gates[0];
  return T.filter((t) => t.type === 'ballista').map((t) => [t.id, hyp(t.x - g.x, t.z - g.z)]).sort((a, b) => a[1] - b[1]).slice(0, n).map((a) => a[0]);
}
// unit levels (= the level of the building that trains it): +LVL_STEP hp / damage a level, and a perk from every tier on (iron armor, gold swift,
// diamond fury, crystal last stand) — the same rules as the server's military.unit_power
export const UNIT_TIER_AT = DEFS.tier_at || [1, 6, 12, 18, 24, 30];
export const unitTier = (L) => { let t = 0; for (let i = 0; i < UNIT_TIER_AT.length; i++) if (L >= UNIT_TIER_AT[i]) t = i; return t; };
export const lvlMult = (L) => 1 + (DEFS.lvl_step || 0.035) * (Math.max(1, Math.min(MAXL, L | 0)) - 1);

// the heroes (p35: five of them) take orders one by one: they walk to the spot the player taps, HOLD it, and only fight what comes within their leash around it; each has a power with a cooldown (a button in the battle HUD)
//   Banner (captain): the soldiers within 18 m hit 30 % harder for 8 s     Shield Wall (shieldmaiden)     Rally Charge (mounted lord)
//   Dive Strike (gryphon knight): drops on the nearest foe group within 40 m — a hard blast     Shadow Breath (dark rider): for 6 s the breath is twice as strong and twice as wide
export const HEROES = { captain: { name: 'Banner', cd: 24, dur: 8 }, shieldmaiden: { name: 'Shield Wall', cd: 24, dur: 6 }, lord: { name: 'Rally Charge', cd: 28, dur: 8 }, gryphonknight: { name: 'Dive Strike', cd: 22, dur: 1 }, darkrider: { name: 'Shadow Breath', cd: 30, dur: 6 } };
const BIGS = new Set(['giant', 'hill', 'ogre', 'treant']);                      // (the big walkers: they wade, they fight the guardians)
// base profiles (p32 S6): the share of the manned sites of each war-machine kind that stay manned (the others become plain towers; their model is hidden in the battle) and a weight multiplier
export const PROFILES = {
  balanced: {},
  aa: { cannon: 0, quad: 0, flame: 0, w: { ballista: 1.5, dragonbane: 1.5 } },                                       // anti-air heavy: ballistas + wizards + arrows, no ground guns
  art: { ballista: 0.34, wizard: 0.34, dragonbane: 0.34, w: { cannon: 1.6, quad: 1.4, flame: 1.4 } },                  // artillery heavy: cannons + the quad guns
  arrows: { ballista: 0, cannon: 0, quad: 0, wizard: 0, frost: 0, flame: 0, dragonbane: 0 },                                // only the arrow towers
};
export const PROFILE_ORDER = ['balanced', 'aa', 'art', 'arrows', 'balanced'];                  // (a kingdom's profile = its seed; balanced is the most common)
export const profileOf = (spec) => (spec.profile && PROFILES[spec.profile] ? spec.profile : PROFILE_ORDER[(((spec.seed | 0) * 2654435761) >>> 0) % PROFILE_ORDER.length]);
// the guardians a castle of level L can hold (military.py GUARDIANS: unlock level, count at the unlock level, count at level 20) and the share of the defence budget they carry
export const guardianSlots = (L) => { const o = {}; for (const [k, g] of Object.entries(DEFS.guardians || {})) if (L >= g.unlock) o[k] = Math.floor(g.n[0] + ((g.n[1] - g.n[0]) * (L - g.unlock)) / Math.max(1, MAXL - g.unlock) + 1e-9); return o; };
const gPow = (g) => Object.entries(g).reduce((q, [k, n]) => q + n * Math.sqrt(DEFS.units[k].hp * DEFS.units[k].dps) / 3, 0);
export const guardianFrac = (g) => { const full = gPow(guardianSlots(MAXL)); return full > 0 ? Math.min(1, gPow(g) / full) * TUNE.gfrac : 0; };
export function makeBaseFromTargets(spec, T, meta) {
  const R = mulberry(spec.seed | 0), L = Math.max(1, Math.min(MAXL, spec.levels.keep | 0)), D0 = Math.max(40, spec.power || 100), US = TUNE.us, UR = TUNE.ur;
  // the guardians (owner 5 Oct): giants / hill giants / baby dragons / dragons stand in the castle as defenders.  A made-up kingdom has what its level holds, a player's kingdom what he assigned (spec.guard).
  const guard = (() => { const o = {}, src = spec.guard && typeof spec.guard === 'object' ? spec.guard : guardianSlots(L); for (const [k, n] of Object.entries(src)) if (DEFS.guardians && DEFS.guardians[k] && n > 0) o[k] = Math.min(8, n | 0); return o; })();
  const gFrac = guardianFrac(guard), D = D0 * (1 - gFrac);                                   // (budget-neutral: the guardians carry their share of the base's power, the structures and the garrison the rest)
  const B = T.map((t) => { const bt = BUILD_TYPES[t.type] || BUILD_TYPES.house; return { ...t, share: t.share ?? bt[0], hp: 0, maxHp: 0, dead: false, collapse: 0, ring: t.type === 'wall' || t.type === 'gate' }; });
  const tesla = new Set(teslaSpots(B, meta, spec.tesla)); for (const b of B) if (tesla.has(b.id)) b.tesla = true;
  // which gun is it: the target says (castle.js decides `wk` once for the model and the sim); older target files without it: every 2nd weapon site of a ring
  { const cnt = {}; for (const b of B) if (b.type === 'ballista' && !b.wk) { const r = b.ringId || ''; b.wk = (cnt[r] = (cnt[r] || 0) + 1) % 2 === 1 ? 'ballista' : 'cannon'; } }          // (older target files: every 2nd weapon site of a ring)
  // which sites are manned (p32 X3 + S6): every defence kind opens at its level (military.py DEFENCES unlock / n) and the number of manned sites of a kind grows with the level, the ones nearest the
  // main gate first; on top of that the base profile keeps only a share of each kind (an AA-heavy castle has no ground guns, an arrow castle only its arrow towers).  The unmanned sites stay plain
  // towers (their war machine / wizard is hidden in the battle).  Same map, same budget: fewer guns = each one stronger.  Seeded: the same kingdom is always the same castle.
  const profName = profileOf(spec), PRO = PROFILES[profName], profW = PRO.w || {}, RP = mulberry((spec.seed | 0) ^ 0x51ed270b), gm = meta.gates[0];
  const siteKind = (b) => (b.tesla ? null : b.type === 'ballista' ? (b.wk === 'cannon' || b.wk === 'quad' || b.wk === 'dragonbane' ? b.wk : 'ballista') : b.type === 'tower' && b.def ? (b.wk === 'wizard' || b.wk === 'frost' || b.wk === 'flame' ? b.wk : 'tower') : null);
  const slotsOf = (k) => { const F = DEFN[k]; if (!F || !F.n) return 1e9; if (L < F.unlock) return 0; const [lo, hi, full] = F.n; return Math.round(lo + ((hi - lo) * Math.min(1, (L - F.unlock) / Math.max(1, full - F.unlock)))); };
  const UPG = { frost: 1, flame: 1, dragonbane: 1 };            // (p35: the three new defences are UPGRADES of a roofed tower / a ballista site: where the castle does not man one (level, profile) the site keeps its old gun, arrows or ballista)
  for (const k of ['frost', 'flame', 'dragonbane', 'tower', 'cannon', 'wizard', 'ballista', 'quad']) {
    const sites = B.filter((b) => siteKind(b) === k).sort((a, c) => hyp(a.x - gm.x, a.z - gm.z) - hyp(c.x - gm.x, c.z - gm.z) || a.id - c.id);
    const manned = Math.min(sites.length, slotsOf(k)), keepN = Math.round(manned * (PRO[k] ?? 1)), ms = sites.slice(0, manned);
    for (let i = ms.length - 1; i > 0; i--) { const j = Math.floor(RP() * (i + 1)); const t = ms[i]; ms[i] = ms[j]; ms[j] = t; }
    sites.forEach((b) => { b.sk = k; });
    ms.forEach((b, i) => { if (i >= keepN) { if (UPG[k]) { b.wk = null; b.off = true; b.why = 'profile'; } else { b.def = false; b.off = true; b.why = 'profile'; } } });
    sites.slice(manned).forEach((b) => { if (UPG[k]) { b.wk = null; b.off = true; b.why = 'level'; } else { b.def = false; b.off = true; b.why = 'level'; } });
  }
  // the hit-point budget is split by share, the guns' (and the keep's) share counted TUNE.defHP times: they are the tough ones, the houses and stores fall fast (the total stays; the destruction % still counts the plain share)
  const dkOf = (b) => (b.tesla ? 'tesla' : b.type === 'keep' ? 'keep' : b.sk || (b.type === 'ballista' ? 'ballista' : 'tower'));
  for (const b of B) if (b.def) b.dk = dkOf(b);
  const hs = (b) => b.share * (b.def ? TUNE.defHP * (TUNE['hpw_' + b.dk] ?? 1) : 1), sum = B.reduce((s, b) => s + hs(b), 0), HP = TUNE.hp * D * (0.9 + 0.2 * (L / MAXL));
  for (const b of B) { b.maxHp = b.hp = Math.round((HP * hs(b)) / sum); b.value = b.ring ? b.share * TUNE.ringValue : b.share; if (b.type === 'wall') b.maxHp = b.hp = Math.round(b.maxHp * (0.8 + b.w / 30)); }
  const wOf = (b) => (DEFN[b.dk] ? DEFN[b.dk].w : b.tesla ? 2.0 : b.type === 'keep' ? 1.2 : b.type === 'ballista' ? 2.2 : 1) * (TUNE['w_' + b.dk] ?? 1) * (profW[b.dk] ?? 1);
  const dps = TUNE.dps * D, defs = B.filter((b) => b.def), tw = defs.reduce((s, b) => s + wOf(b), 0);
  for (const b of defs) {
    const k = wOf(b) / tw, mine = TUNE.tower * dps * k, F = DEFN[b.dk] || {};
    if (b.tesla) Object.assign(b, { rng: 32 * US, cd: 1.5, dmg: mine * 1.5 / 1.96, splash: 0, air: true, ground: true, kind: 'zap', flight: 0, chain: 3, hop: 9 * UR });     // (1.96 = 1 + .6 + .36: the three strikes of a chain share its damage)
    else if (b.dk === 'cannon') Object.assign(b, { rng: (F.rng || 40) * US, cd: F.cd || 3.0, dmg: mine * (F.cd || 3.0), splash: (F.splash || 3.5) * UR, minr: (F.minr || 7) * UR, air: false, ground: true, kind: 'bolt', flight: 0.8 });
    else if (b.dk === 'ballista') Object.assign(b, { rng: (F.rng || 46) * US, cd: F.cd || 2.6, dmg: mine * (F.cd || 2.6), splash: 0, air: true, ground: true, kind: 'bolt', flight: 0.6 });
    else if (b.dk === 'wizard') Object.assign(b, { rng: (F.rng || 36) * US, cd: F.cd || 1.4, dmg: mine * (F.cd || 1.4), splash: (F.splash || 2) * UR, minr: 0, air: true, ground: true, kind: 'orb', flight: 0.5 });
    else if (b.dk === 'quad') Object.assign(b, { rng: (F.rng || 34) * US, cd: F.cd || 1.3, dmg: mine * (F.cd || 1.3), splash: (F.splash || 1.1) * UR, minr: 0, air: false, ground: true, kind: 'bolt', flight: 0.45, volley: F.volley || 4 });
    else if (b.dk === 'frost') Object.assign(b, { rng: (F.rng || 38) * US, cd: F.cd || 2.2, dmg: mine * (F.cd || 2.2), splash: (F.splash || 5) * UR, minr: 0, air: true, ground: true, kind: 'frost', flight: 0.55, slow: F.slow ?? 0.5, slowT: F.slow_t ?? 3.5 });
    else if (b.dk === 'flame') Object.assign(b, { rng: (F.rng || 22) * US, cd: F.cd || 1.1, dmg: mine * (F.cd || 1.1), splash: (F.splash || 2.6) * UR, minr: 0, air: false, ground: true, kind: 'flame', flight: 0.3 });
    else if (b.dk === 'dragonbane') Object.assign(b, { rng: (F.rng || 58) * US, cd: F.cd || 3.4, dmg: mine * (F.cd || 3.4), splash: 0, air: true, ground: true, kind: 'bolt', flight: 0.7 });
    else if (b.type === 'keep') Object.assign(b, { rng: 40 * US, cd: 1.6, dmg: mine * 1.6, splash: 0, air: true, ground: true, kind: 'arrow', flight: 0.6 });
    else Object.assign(b, { rng: 34 * US, cd: 0.9, dmg: mine * 0.9, splash: 0, air: true, ground: true, kind: 'arrow', flight: 0.5 });
    if (b.rng) b.rng *= TUNE.grng;                                          // (the guns' reach: the one knob that decides whether siege can shell from outside it)
    b.mult = F.mult ? { ...F.mult } : null; if (b.mult) for (const c of ['light', 'medium', 'heavy', 'air']) { const o = TUNE['m_' + b.dk + '_' + c]; if (o !== undefined) b.mult[c] = o; } b.pick = F.pick || 'near'; b.minr = b.minr || 0;
    b.t = R();
  }
  // the garrison (p32 S13): a realistic number of ordinary soldiers for the castle level (military.py GARRISON_AT: level 20 = 150), 55 % guards / 25 % archers / 10 % heavy guards / 10 % reserve that
  // sallies at raiders in the outskirts.  Budget-neutral: together they keep the firepower share (1 - TUNE.tower) and the hit points the old thin garrison had, so more bodies = each one thinner.
  const posts = [], outer = [];
  const pip = (x, z) => { let c = false; const V = meta.town; for (let i = 0, j = V.length - 1; i < V.length; j = i++) { const [xi, zi] = V[i], [xj, zj] = V[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
  for (const g of meta.gates) for (let i = 0; i < 3; i++) posts.push([g.x - g.nx * 16, g.z - g.nz * 16, 14]);
  const keep = B.find((b) => b.type === 'keep'); if (keep) for (let i = 0; i < 4; i++) posts.push([keep.x, keep.z, 30]);
  for (const b of B) if (b.type === 'vault' || b.type === 'barracks' || b.type === 'mine') posts.push([b.x, b.z, 16]);
  for (const b of B) if (!b.ring && !b.def && b.type !== 'house' && !pip(b.x, b.z)) outer.push([b.x, b.z, 14]);                     // (forge, lair, stable, workshop, the far mines: outside the walls)
  const GA = DEFS.garrison_at || [[1, 10], [5, 35], [10, 75], [15, 115], [20, 150]], MIX = DEFS.garrison_mix || { guard: 0.55, archer: 0.25, heavy: 0.1, reserve: 0.1 };
  let nG = GA[GA.length - 1][1]; for (let i = 1; i < GA.length; i++) if (L <= GA[i][0]) { nG = GA[i - 1][1] + ((GA[i][1] - GA[i - 1][1]) * (L - GA[i - 1][0])) / (GA[i][0] - GA[i - 1][0]); break; }
  nG = Math.max(4, Math.round(nG));
  const kinds = []; { const nA = Math.round(nG * MIX.archer), nH = Math.round(nG * MIX.heavy), nR = Math.round(nG * MIX.reserve); for (let i = 0; i < nG; i++) kinds.push(i < nH ? 'heavy' : i < nH + nR ? 'reserve' : i < nH + nR + nA ? 'archer' : 'guard'); }
  const HPW = { guard: 1, archer: 0.7, heavy: 3.5, reserve: TUNE.rhp }, DPW = { guard: 1, archer: 1.2, heavy: 2.5, reserve: TUNE.rdps };          // (the reserve = the sortie riders: fewer, harder, faster; the budget stays the same, the others get thinner)
  const sHP = kinds.reduce((q, k) => q + HPW[k], 0), sDP = kinds.reduce((q, k) => q + DPW[k], 0);
  const totHP = 0.0045 * D * 160 * (1 + L / MAXL), totDps = (1 - TUNE.tower) * dps, defenders = [];
  let ip = 0, io = 0;
  for (let i = 0; i < nG; i++) {
    const k = kinds[i], res = k === 'reserve' && outer.length;
    const [px, pz, pr] = res ? outer[io++ % outer.length] : posts[ip++ % posts.length], a = R() * 6.28, r = 3 + R() * pr, x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
    const arch = k === 'archer', hp = Math.max(30, (totHP * HPW[k]) / sHP);
    defenders.push({ side: 'D', type: arch ? 'archer' : 'guard', kind: k, x, z, hx: x, hz: z, hp, maxHp: hp, dps: (totDps * DPW[k]) / sDP, rng: arch ? 24 * US : 0, spd: (k === 'reserve' ? TUNE.rsp : 1.0) * TUNE.sp, r: 0.8 * UR, air: false, hunter: k === 'reserve' || k === 'heavy' || (k === 'guard' && TUNE.hall > 0), role: arch ? 'ranged' : 'infantry', size: k === 'heavy' ? 'heavy' : 'light', leash: res ? 24 * US : arch ? 0 : TUNE.leash * US, cd: 0 });
  }
  // the guardians: big defenders; each carries the share of the budget its base power earns (all of them the same scale k), they stand at the gate / the keep and go out against whatever comes
  { const wsel = gPow(guard), k = wsel > 0 ? Math.max(0.3, (gFrac * D0) / wsel) : 0, kp = keep || { x: 0, z: 0 }; let gi = 0;
    for (const [type, n] of Object.entries(guard)) for (let i = 0; i < n; i++, gi++) {
      const d = DEFS.units[type], air = !!d.air, big = d.space >= 8, a = R() * 6.28;
      const gp = posts[(type === 'giant' ? i : 3) % Math.max(1, posts.length)] || [kp.x, kp.z, 8], bx = type === 'giant' || type === 'hill' && false ? gp[0] : kp.x, bz = type === 'giant' ? gp[1] : kp.z, rr = type === 'giant' ? 5 + i * 3 : 8 + gi * 2;
      const x = bx + Math.cos(a) * rr, z = bz + Math.sin(a) * rr;
      defenders.push({ side: 'D', type, guardian: true, kind: 'guardian', x, z, hx: x, hz: z, hp: Math.max(30, d.hp * k), maxHp: Math.max(30, d.hp * k), dps: d.dps * k, rng: d.rng * US, spd: d.spd * 3.1 * TUNE.sp, r: (big ? 2.4 : 1.1) * UR,
        air, wade: type === 'giant' || type === 'hill', role: d.role, size: d.size || 'heavy', canAir: air || d.rng > 0, leash: TUNE.gleash * US, cd: 0 });
    } }
  const walls = B.filter((b) => b.ring), total = B.reduce((s, b) => s + b.value, 0);
  // the field: everything within reach of the structures + the muster area in front of the main gate
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const b of B) { x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x); z0 = Math.min(z0, b.z); z1 = Math.max(z1, b.z); }
  const g0 = meta.gates[0], dd = meta.deploy || { d: 62, lat: 0 }, deploy = { x: g0.x + g0.nx * dd.d - g0.nz * dd.lat, z: g0.z + g0.nz * dd.d + g0.nx * dd.lat, nx: g0.nx, nz: g0.nz, d: dd.d, lat: dd.lat };
  const field = { x0: Math.min(x0, deploy.x) - 70, x1: Math.max(x1, deploy.x) + 70, z0: Math.min(z0, deploy.z) - 70, z1: Math.max(z1, deploy.z) + 70 };
  return { buildings: B, defenders, ring: walls, verts: meta.town, gateIndex: 0, radius: 150, totalShare: total, level: L, us: US, ur: UR, field, deploy, real: true, profile: profName, off: B.filter((b) => b.off).map((b) => b.id) };
}

// ------------------------------------------------------------------ simulation
export function createBattle({ spec, army, forge = 1, lv = {}, spells = {}, targets = null, meta = null, nav = null }) {
  const R = mulberry((spec.seed | 0) ^ 0x9e3779b9);
  const base = targets ? makeBaseFromTargets(spec, targets, meta) : makeBase(spec), B = base.buildings, DEF = base.defenders;
  const US = base.us || 1, UR = base.ur || 1, FLD = base.field || FIELD;
  const mult = 1 + 0.06 * Math.max(0, forge - 1);
  const units = []; let uid = 1;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // line the army up in front of the base (armyplan.js: blocks of one type each, laid out in shelves; the camp reads the same plan)
  const dp = base.deploy, tx0 = dp ? -dp.nz : 1, tz0 = dp ? dp.nx : 0;
  const plan = planArmy(army, UR, !!dp, dp && nav && nav.solids ? toFrame(nav.solids, dp) : []), types = plan.types;      // (the army stands clear of the buildings on the plain: the windmill)
  for (const type of types) {
    const d = DEFS.units[type], P = plan.pos[type];
    for (let k = 0; k < P.length; k++) {
      const lat = P[k][0], back = P[k][1];
      const x = dp ? dp.x + tx0 * lat + dp.nx * back : lat, z = dp ? dp.z + tz0 * lat + dp.nz * back : FIELD.line + 4 + back;
      const known = !!(lv && lv[d.fam]), L = Math.max(1, Math.min(MAXL, (lv && lv[d.fam]) | 0 || 1)), tier = known ? unitTier(L) : 1, km = mult * lvlMult(L);      // (no level from the server: the classic stone look, level-1 stats)
      units.push({ id: uid++, side: 'A', type, x, z, hp: d.hp * km, maxHp: d.hp * km, dps: d.dps * km * (known && tier >= 4 ? 1.15 : 1), rng: d.rng * US * (d.role === 'siege' ? TUNE.srng : 1), spd: d.spd * 3.1 * TUNE.sp * (known && tier >= 3 ? 1.1 : 1),
        lv: L, tier, armor: known && tier >= 2 ? 0.9 : 1, ls: known && tier >= 5,
        r: (d.space >= 8 ? 2.4 : d.space >= 3 ? 1.1 : 0.75) * UR, air: !!d.air, role: d.role, size: d.size || (d.space <= 2 ? 'light' : d.space <= 6 ? 'medium' : 'heavy'), prefer: d.prefer || 'near', wade: BIGS.has(type), cd: R(), go: null, hold: null, hero: !!HEROES[type], active: false, target: null, retarget: 0, dead: false, y: d.air ? 6 * UR : 0, face: dp ? Math.atan2(-dp.nx, -dp.nz) : Math.PI });
    }
  }
  const sent = {}; for (const u of units) sent[u.type] = (sent[u.type] || 0) + 1;
  for (const d of DEF) { d.id = uid++; d.dead = false; d.target = null; d.retarget = 0; d.y = 0; d.face = 0; }
  const all = units.concat(DEF);
  // what hurt whom (p32 S2): damage the attackers took by source (arrow / cannon / ballista / keep / tesla / guard / garch / spell) x unit type, the kills, and what every unit type dealt
  const stats = { took: {}, kills: {}, dealt: {}, wk: {}, deadAt: {} };
  const sim = { stats, rest: 1, zones: [], spells: { ...spells }, spellsUsed: {}, base, units, defenders: DEF, buildings: B, field: FLD, deploy: dp || null, events: [], time: 0, over: false, endAt: 180, loot: {}, sent, lost: {}, stars: 0, pending: [] };
  const NAV = nav;
  const alive = (a) => !a.dead && a.hp > 0;
  // ---- spatial grid (p32 S13): the ground bodies of each side bucketed once per step, so the push-apart (and anything else that looks at the neighbours) costs O(neighbours) instead of O(everybody)
  // with 150 + 150 bodies on the field.  Cells are CELL m; no body's push-apart reach (r + r') x 0.9 is bigger than that.  Deterministic: cells are read in a fixed order, bodies in id order.
  const CELL = 10, GK = (i, j) => (i + 1024) * 2048 + (j + 1024), gA = new Map(), gD = new Map();
  const gbuild = (g, list) => { g.clear(); for (let i = 0; i < list.length; i++) { const o = list[i]; if (o.dead || o.air) continue; const key = GK(Math.floor(o.x / CELL), Math.floor(o.z / CELL)), c = g.get(key); if (c) c.push(o); else g.set(key, [o]); } };
  const ev = (o) => sim.events.push(o);
  // ---- nearest-foe queries on the grids (p35 M2: armies and garrisons are twice as big, "every body looks at every body" would triple the step cost).  The answers are EXACTLY what the plain scans gave
  // (ties go to the lower id, which is the order of the lists), only found through the cells.
  const defAir = DEF.filter((e) => e.air);
  const foeNear = (u, Rr) => {                                                    // the lowest-id live defender within Rr of u that u can reach (a flyer only for flyers and ranged units)
    let best = null;
    const i0 = Math.floor((u.x - Rr) / CELL), i1 = Math.floor((u.x + Rr) / CELL), j0 = Math.floor((u.z - Rr) / CELL), j1 = Math.floor((u.z + Rr) / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const c = gD.get(GK(i, j)); if (!c) continue; for (let k = 0; k < c.length; k++) { const e = c[k]; if (!alive(e) || (best && e.id > best.id) || dist(u, e) >= Rr) continue; best = e; } }
    if (u.air || u.rng > 0) for (let k = 0; k < defAir.length; k++) { const e = defAir[k]; if (alive(e) && (!best || e.id < best.id) && dist(u, e) < Rr) best = e; }
    return best;
  };
  const PGI = Math.floor(FLD.x0 / CELL) - 3, PGJ = Math.floor(FLD.z0 / CELL) - 3, PNI = Math.floor(FLD.x1 / CELL) - PGI + 4, PNJ = Math.floor(FLD.z1 / CELL) - PGJ + 4;
  const pk = { t: -1, ground: [], siege: [], air: [], far: [], cells: new Array(PNI * PNJ).fill(null), used: [] };   // the live, launched attackers by kind, at their positions of THIS step (built on the first question of a step); a dense grid of the ground bodies (`far`: the few outside it)
  const pkBuild = () => {
    pk.t = sim.time; pk.ground.length = 0; pk.siege.length = 0; pk.air.length = 0; pk.far.length = 0;
    for (let i = 0; i < pk.used.length; i++) pk.cells[pk.used[i]].length = 0; pk.used.length = 0;
    for (let i = 0; i < units.length; i++) {
      const u = units[i]; if (!alive(u) || !u.active) continue;
      if (u.role === 'siege') pk.siege.push(u);
      if (u.air) { pk.air.push(u); continue; }
      if (u.role === 'siege') continue;
      pk.ground.push(u);
      const ci = Math.floor(u.x / CELL) - PGI, cj = Math.floor(u.z / CELL) - PGJ;
      if (ci < 0 || cj < 0 || ci >= PNI || cj >= PNJ) { pk.far.push(u); continue; }
      const idx = ci * PNJ + cj; let c = pk.cells[idx]; if (!c) c = pk.cells[idx] = []; if (!c.length) pk.used.push(idx); c.push(u);
    }
  };

  const walls = B.filter((b) => b.ring);
  const share = base.totalShare;

  // geometry helpers
  const dist = (a, b) => hyp(a.x - b.x, a.z - b.z);
  const distB = (u, b) => {                            // distance from a point to a building's footprint (box rotated by rot)
    const c = Math.cos(b.rot), s = Math.sin(b.rot), dx = u.x - b.x, dz = u.z - b.z;
    const lx = dx * c - dz * s, lz = dx * s + dz * c, qx = Math.max(0, Math.abs(lx) - b.w / 2), qz = Math.max(0, Math.abs(lz) - b.d / 2);
    return hyp(qx, qz);
  };
  const segHit = (ax, az, bx, bz, w) => {              // does the segment a->b cross wall w (a thin wall segment)?
    const [px, pz] = w.a, [qx, qz] = w.b, rx = bx - ax, rz = bz - az, sx = qx - px, sz = qz - pz, den = rx * sz - rz * sx;
    if (Math.abs(den) < 1e-6) return -1;
    const t = ((px - ax) * sz - (pz - az) * sx) / den, u = ((px - ax) * rz - (pz - az) * rx) / den;
    return t > 0.02 && t < 0.98 && u >= 0 && u <= 1 ? t : -1;
  };
  const insideRing = (x, z) => { let c = false; const V = base.verts; for (let i = 0, j = V.length - 1; i < V.length; j = i++) { const [xi, zi] = V[i], [xj, zj] = V[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };

  // ---- damage  (`by`: who did it — the attacker's unit type or 'spell' for buildings / defenders, the defence kind (arrow / cannon / ballista / keep / tesla / guard / garch) for attackers; counted in sim.stats)
  // how many manned guns reach a building (the raiders go where few do); recomputed (lazily) after a gun has fallen
  let coverV = 1; const GUNS = B.filter((b) => b.def && b.rng && b.dmg);
  const covOf = (b) => { if (b.covV === coverV) return b.cov; let n = 0; for (const g of GUNS) if (!g.dead && hyp(g.x - b.x, g.z - b.z) < g.rng) n++; b.covV = coverV; return (b.cov = n); };
  const bump = (o, a, b2, v) => { const m = o[a] || (o[a] = {}); m[b2] = (m[b2] || 0) + v; };
  const hurtB = (b, dmg, by) => {
    if (b.dead) return; b.hp -= dmg; ev({ k: 'hit', b: b.id, x: b.x, z: b.z, dmg, src: by });
    if (by) bump(stats.dealt, by, 'b', Math.min(dmg, b.hp + dmg));
    if (b.hp <= 0) { b.hp = 0; b.dead = true; b.collapseT = 0; ev({ k: 'collapse', b: b.id, x: b.x, z: b.z, w: b.w, d: b.d, h: b.h, rot: b.rot || 0, gem: b.gem, type: b.type });
      if (b.type === 'keep') sim.keepDown = true;
      if (b.rng && b.dmg) { coverV++; if (!stats.deadAt[b.id]) stats.deadAt[b.id] = [b.dk, sim.time]; } }
  };
  const hurtU = (u, dmg, by) => {
    if (!alive(u)) return;
    if (u.side === 'A') { if (u.guardUntil > sim.time) dmg *= 0.3; else if (u.shieldUntil > sim.time) dmg *= 0.65; dmg *= u.armor || 1; }       // (the shieldmaiden's Shield Wall: she takes 70 % less, her mates nearby 35 % less; iron-tier soldiers 10 % less)
    u.hp -= dmg; ev({ k: 'hurt', id: u.id, x: u.x, z: u.z, dmg });
    if (by) { if (u.side === 'A') bump(stats.took, by, u.type, dmg); else bump(stats.dealt, by, 'u', dmg); }
    if (u.hp <= 0 && u.ls) { u.ls = false; u.hp = u.maxHp * 0.25; ev({ k: 'stand', id: u.id, x: u.x, z: u.z }); return; }        // (crystal tier: survives one deadly blow)
    if (u.hp <= 0) { u.dead = true; u.deadAt = sim.time; ev({ k: 'die', id: u.id, side: u.side, type: u.type, x: u.x, z: u.z }); if (u.side === 'A') { sim.lost[u.type] = (sim.lost[u.type] || 0) + 1; if (by) bump(stats.kills, by, u.type, 1); } }
  };
  // a blast: `from` = who fired it.  Attackers' blasts also hurt the buildings in reach (the neighbours of the one that was hit take TUNE.nb of it); a defence's blast only hurts attackers, and only
  // the layers / size classes its table row says (o.ground: air units are out of reach, o.mult: damage x by the size class of the victim)
  const splashAt = (x, z, r, dmg, from, prim, by, o) => {
    if (from === 'A') for (const b of B) if (!b.dead && hyp(b.x - x, b.z - z) < r + Math.max(b.w, b.d) * 0.4) hurtB(b, dmg * (b.type === 'wall' ? 0.7 : 1) * (b === prim ? 1 : TUNE.nb), by);
    for (const u of all) if (alive(u) && u.side !== from && hyp(u.x - x, u.z - z) < r) { if (o && o.ground && u.air) continue; hurtU(u, o && o.mult ? dmg * (o.mult[sizeClass(u)] ?? 1) : dmg, by); if (o && o.slow && alive(u)) { u.slowUntil = sim.time + o.slowT; u.slowK = o.slow; } }
    ev({ k: 'splash', x, z, r });
  };
  const queue = (delay, fn) => sim.pending.push({ t: sim.time + delay, fn });

  // ---- targeting
  // what each kind of unit goes for (unitdefs `prefer`): near = whatever is closest, defence = the guns first (tanks, giants), raid = the buildings few guns cover (riders),
  // antiair = the guns that hurt flyers (ballistas first, then wizards and tesla), standoff = what it can shell without being shelled back (siege), gate = the gate (rams)
  const AAW = { ballista: 34, wizard: 20, tesla: 20 };
  const pickAttackerTarget = (u) => {
    const ground = !u.air; let best = null, bs = 1e9;
    const consider = (t, score) => { if (score < bs) { bs = score; best = t; } };
    const pf = TUNE.prefer ? u.prefer : 'near';
    const near = (u.role === 'ranged' ? 30 : u.role === 'air' ? 24 : 11) * US;
    const reachable = (d) => (!d.air || u.air || u.rng > 0) && (!TUNE.prefer || !u.air || (d.guardian ? d.canAir : d.rng > 0));        // (a melee soldier on the ground cannot hit a flyer, and a flyer has no business with a soldier who cannot hit it)
    if (u.role !== 'giant' && u.role !== 'siege') for (const d of DEF) if (alive(d) && reachable(d)) { const dd = dist(u, d); if (dd < (pf === 'raid' && !d.guardian ? 4 * US : near)) consider(d, dd - (d.guardian ? 12 : 6) * US); }
    if (BIGS.has(u.type) || u.role === 'siege') for (const d of DEF) if (alive(d) && d.guardian && reachable(d)) { const dd = dist(u, d); if (dd < (u.role === 'siege' ? u.rng : 16 * US)) consider(d, dd - 30 * US); }       // (giants fight the guardians, siege shells them)
    for (const b of B) {
      if (b.dead) continue;
      if (u.bad && u.bad[b.id] > sim.time) continue;                                 // (it could not get there: wait before trying again)
      const gate = pf === 'gate' && b.type === 'gate';
      if (b.ring && sim.rest > 3 && !gate) continue;                                 // walls / gates are only picked on purpose once (almost) everything else is down; before that only when they are in the way (u.block)
      let s = dist(u, b) + (b.tc || 0) * 2.2 * US;                                    // spread the army over the base instead of one pile
      if (b.ring && b.type === 'wall') s += 70 * US;
      const gun = b.def || b.type === 'tower' || b.type === 'ballista';
      if (gun) s -= (u.role === 'siege' || u.role === 'giant' || u.air ? 26 : pf === 'defence' ? 16 : pf === 'raid' ? 0 : 8) * US;
      if (b.type === 'vault' && u.role === 'air') s -= 6 * US;
      if (u.role === 'siege' && b.type !== 'tower' && b.type !== 'ballista') s += 6 * US;
      if (TUNE.prefer) {
        if (gate) s -= 70 * US;
        else if (pf === 'antiair' && b.def && b.air) s -= (AAW[b.dk] || 6) * US;
        else if (pf === 'raid' && !b.ring) s += (covOf(b) * 4 - (b.type === 'vault' || b.type === 'mine' ? 8 : 0)) * US;
        else if (pf === 'standoff' && b.def && b.rng) s += (b.rng >= u.rng ? 12 : -8) * US;                   // (a gun that out-ranges it shoots back: take the ones that cannot first)
      }
      consider(b, s);
    }
    return best;
  };
  // ---- heroes (the shieldmaiden and the mounted lord) take orders one by one: they walk to the spot the player taps, HOLD it, and only fight what comes within their leash around it.
  // They never wander off after the rest of the army (the player moves them by hand; each has a special power, see sim.ability).
  const LEASH = 15 * US;
  const pickHeroTarget = (u) => {
    const h = u.hold || u; let best = null, bs = 1e9;
    for (const d of DEF) if (alive(d) && hyp(d.x - h.x, d.z - h.z) < LEASH) { const s2 = dist(u, d) - 10 * US; if (s2 < bs) { bs = s2; best = d; } }
    for (const b of B) {
      if (b.dead || (u.bad && u.bad[b.id] > sim.time)) continue;
      const dd = distB(h, b);
      if (b.ring) { if (dd > 4.5 * US) continue; if (dd + 20 * US < bs) { bs = dd + 20 * US; best = b; } continue; }                  // (a wall or gate right at its spot: the last thing it hits)
      if (dd > ((b.rng || b.def) ? LEASH : 7 * US)) continue;                                                  // (a tower within the leash is worth the walk; anything else only when it stands right at its spot)
      const s2 = dd + (b.def || b.type === 'tower' ? -4 * US : 0); if (s2 < bs) { bs = s2; best = b; }
    }
    return best;
  };
  const huntR = () => TUNE.hunt * US;
  const pickDefenderTarget = (d) => {                                              // the nearest launched attacker (melee guards cannot reach a flyer); a siege engine the hunters can catch counts 60 m nearer
    let best = null, bd = 1e9; const hunter = d.hunter && TUNE.hunt > 0, ranged = d.rng > 0;
    if (pk.t !== sim.time) pkBuild();
    const consider = (u) => { let dd = dist(u, d); if (hunter && u.role === 'siege' && hyp(u.x - d.hx, u.z - d.hz) < huntR()) dd -= 60 * US; if (dd < bd || (dd === bd && best && u.id < best.id)) { bd = dd; best = u; } };
    for (let k = 0; k < pk.siege.length; k++) if (ranged || !pk.siege[k].air) consider(pk.siege[k]);
    if (ranged) for (let k = 0; k < pk.air.length; k++) if (!pk.air[k].air || pk.air[k].role !== 'siege') consider(pk.air[k]);
    const ci = Math.floor(d.x / CELL), cj = Math.floor(d.z / CELL); let done = false;
    for (let k = 0; k < pk.far.length; k++) consider(pk.far[k]);                    // (bodies outside the grid are always read)
    const cell = (i, j) => { i -= PGI; j -= PGJ; if (i < 0 || j < 0 || i >= PNI || j >= PNJ) return; const c = pk.cells[i * PNJ + j]; if (c !== null && c.length) for (let k = 0; k < c.length; k++) consider(c[k]); };
    // a target further away than `need` is never taken (the three rules of defenderStep: its leash round its post, the hunt, 28 m inside the walls), so the rings only have to reach that far
    const need = Math.max(28 * US, (d.leash || 0) + hyp(d.x - d.hx, d.z - d.hz), hunter ? huntR() + hyp(d.x - d.hx, d.z - d.hz) : 0), rmax = Math.ceil(need / CELL) + 1;
    if (rmax <= 7) {
      for (let r = 0; r <= rmax && !done; r++) {
        if (r === 0) cell(ci, cj);
        else { for (let j = cj - r; j <= cj + r; j++) { cell(ci - r, j); cell(ci + r, j); } for (let i = ci - r + 1; i <= ci + r - 1; i++) { cell(i, cj - r); cell(i, cj + r); } }
        if (best && bd < r * CELL) done = true;                                    // (nothing outside the rings read so far can be nearer)
      }
      if (!done && !best) return null;                                             // (nobody within reach: the plain scan would have found someone too far away to be taken)
    }
    if (!done) for (let k = 0; k < pk.ground.length; k++) consider(pk.ground[k]);      // (a far siege engine is the best so far, or the reach is long: the plain scan, as before)
    return best;
  };       // (melee guards cannot reach a flyer)

  // ---- solid structures: ground units (both sides) cannot walk through intact walls, gates, towers, the keep or the big military buildings.
  // Oriented boxes; a step that would enter one is pushed back out along the shallowest face (so units slide along it), in sub-steps of 0.5 m so nothing tunnels.
  const SOLID_T = { wall: 1, gate: 1, tower: 1, ballista: 1, keep: 1, vault: 1, mine: 1, barracks: 1, training: 1, forge: 1, stable: 1, workshop: 1, lair: 1, store: 1 };
  const solids = B.filter((b) => SOLID_T[b.type]);
  for (const b of solids) { b.cs = Math.cos(b.rot || 0); b.sn = Math.sin(b.rot || 0); b.rr = hyp(b.w, b.d) / 2 + 3; }
  // p35 M2: the solids by cell (10 m), each in every cell its reach (+ 6 m for the slides) touches, in the original order, so that a mover only reads the few boxes near it (same answers, same order of pushes)
  const SGC = 10, sgrid = new Map(), SGE = [];
  for (const b of solids) { const Rr = b.rr + 1.0 + 6.0; for (let i = Math.floor((b.x - Rr) / SGC); i <= Math.floor((b.x + Rr) / SGC); i++) for (let j = Math.floor((b.z - Rr) / SGC); j <= Math.floor((b.z + Rr) / SGC); j++) { const key = GK(i, j), c = sgrid.get(key); if (c) c.push(b); else sgrid.set(key, [b]); } }
  const inBox = (b, x, z, pad) => { const dx = x - b.x, dz = z - b.z; if (dx * dx + dz * dz > (b.rr + pad) * (b.rr + pad)) return false; const lx = dx * b.cs - dz * b.sn, lz = dx * b.sn + dz * b.cs; return Math.abs(lx) < b.w / 2 + pad && Math.abs(lz) < b.d / 2 + pad; };
  const collide = (u, ox, oz, nx, nz) => {                    // -> [x, z, blocker|null]
    const pad = Math.min(1.0, u.r * 0.4); let hit = null;
    const len = hyp(nx - ox, nz - oz), n = Math.max(1, Math.ceil(len / 0.5));
    let px = ox, pz = oz;
    for (let i = 1; i <= n; i++) {
      let qx = px + (nx - ox) / n, qz = pz + (nz - oz) / n;                              // (each sub-step continues from where the last one ended, so a slide stays a slide)
      const near = sgrid.get(GK(Math.floor(qx / SGC), Math.floor(qz / SGC))) || SGE;
      for (let pass = 0; pass < 2; pass++) for (const b of near) {
        if (b.dead || !inBox(b, qx, qz, pad)) continue;
        const dx = qx - b.x, dz = qz - b.z, lx = dx * b.cs - dz * b.sn, lz = dx * b.sn + dz * b.cs, hx = b.w / 2 + pad, hz = b.d / 2 + pad, ax = hx - Math.abs(lx), az = hz - Math.abs(lz);
        let l2x = lx, l2z = lz; if (ax < az) l2x = Math.sign(lx || 1) * (hx + 0.02); else l2z = Math.sign(lz || 1) * (hz + 0.02);
        qx = b.x + l2x * b.cs + l2z * b.sn; qz = b.z - l2x * b.sn + l2z * b.cs; hit = b;
      }
      px = qx; pz = qz;
    }
    return [px, pz, hit];
  };
  const moveTo = (u, tx, tz, dt, stopAt = 0) => {
    const dx = tx - u.x, dz = tz - u.z, d = hyp(dx, dz);
    if (d <= stopAt || d < 1e-4) return d;
    const sp = u.spd * dt * (u.rageUntil > sim.time ? 1.3 : 1) * (u.slowUntil > sim.time ? u.slowK : 1), k = Math.min(1, sp / d);
    u.face = Math.atan2(dx, dz);
    // separation from close friends of the same side (the neighbour cells of the grid)
    let sx = 0, sz = 0;
    if (!u.air) {
      const g = u.side === 'D' ? gD : gA, ci = Math.floor(u.x / CELL), cj = Math.floor(u.z / CELL);
      for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) { const c = g.get(GK(i, j)); if (!c) continue; for (let k = 0; k < c.length; k++) { const o = c[k]; if (o === u || o.dead) continue; const ox = u.x - o.x, oz = u.z - o.z, dd = ox * ox + oz * oz, rr = (u.r + o.r) * 0.9; if (dd < rr * rr && dd > 1e-6) { const m = Math.sqrt(dd); sx += ox / m * (rr - m); sz += oz / m * (rr - m); } } }
    }
    { const sm = hyp(sx, sz) * 0.5, cap = Math.max(0.15, sp * 0.6); if (sm > cap) { sx *= cap / sm; sz *= cap / sm; } }     // (the push-apart never throws a unit across the map)
    let nx = u.x + dx * k + sx * 0.5, nz = u.z + dz * k + sz * 0.5;
    if (!u.air) {
      const want = hyp(dx * k, dz * k), [cx, cz, hit] = collide(u, u.x, u.z, nx, nz), got = hyp(cx - u.x, cz - u.z);
      if (hit && got < want * 0.4) { u.stuck = (u.stuck || 0) + dt; u.blocker = hit; } else if (u.stuck > 0) u.stuck = Math.max(0, u.stuck - dt * 2);
      nx = cx; nz = cz;
      const closed = NAV ? (u.wade ? NAV.isSolid : NAV.isBlocked) : null;                      // (a wader only keeps out of the buildings; every other ground unit also keeps out of the water)
      if (closed && closed(nx, nz) && !closed(u.x, u.z)) {                                  // the shore / the wall of a house: ground units never go in (slide along it, or stay put)
        if (!closed(nx, u.z)) nz = u.z; else if (!closed(u.x, nz)) nx = u.x; else { nx = u.x; nz = u.z; }
        u.wst = (u.wst || 0) + dt;
      } else if (u.wst > 0) u.wst = Math.max(0, u.wst - dt * 2);
    }
    u.x = nx; u.z = nz;
    return d;
  };
  // ---- water: ground units walk around the moat / river / lake and cross only on the bridges (planned with A*, a few plans per step)
  let navBudget = 4000; const rcache = [];                                      // planning budget in A* nodes (deterministic): one plan may overdraw it, the next ones wait until it is paid back
  const goalFor = (u, gx, gz) => {
    if (!NAV || u.air || u.wade) return [gx, gz];                               // (giants are taller than the moat is deep: they wade straight through it)
    let r = u.rt;
    if (r && (Math.abs(r.gx - gx) + Math.abs(r.gz - gz) > 8 || sim.time > r.exp)) r = u.rt = null;
    if (!r) {
      if (sim.time < (u.navT || 0) || navBudget <= 0) return [gx, gz];
      u.navT = sim.time + 0.35 + R() * 0.25;
      if (NAV.clear(u.x, u.z, gx, gz)) return [gx, gz];
      let pts = null;
      for (const c of rcache) if (c.exp > sim.time && Math.abs(c.gx - gx) + Math.abs(c.gz - gz) < 6 && hyp(c.sx - u.x, c.sz - u.z) < 9 && NAV.clear(u.x, u.z, c.pts[0][0], c.pts[0][1])) { pts = c.pts; break; }    // a mate nearby just planned the same walk
      if (!pts) {
        const n0 = NAV.nodes ? NAV.nodes() : 0; pts = NAV.route(u.x, u.z, gx, gz); navBudget -= Math.max(80, (NAV.nodes ? NAV.nodes() : 0) - n0);
        if (pts) { rcache.push({ gx, gz, sx: u.x, sz: u.z, pts, exp: sim.time + 8 }); if (rcache.length > 40) rcache.shift(); }
      }
      if (!pts) { u.navT = sim.time + 2; u.noRoute = (u.noRoute || 0) + 1; if (typeof process !== 'undefined' && process.env && process.env.XNAV && u.noRoute < 2) console.log('NOROUTE', u.type, u.x.toFixed(0), u.z.toFixed(0), '->', gx.toFixed(0), gz.toFixed(0), 'goalWet', NAV.isWet(gx, gz), 'startWet', NAV.isWet(u.x, u.z), 't', sim.time.toFixed(0)); return [gx, gz]; }
      r = u.rt = { pts, i: 0, gx, gz, exp: sim.time + 10 };
    }
    while (r.i < r.pts.length - 1 && hyp(r.pts[r.i][0] - u.x, r.pts[r.i][1] - u.z) < 3.2) r.i++;
    return r.pts[r.i];
  };

  const attackerStep = (u, dt) => {
    if (!u.active) return;
    u.cd -= dt;
    if (u.type === 'treant' && u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * TUNE.treantRegen * dt);          // (the treant mends itself: 1.2 % of its hit points a second)
    if (u.go && !u.target) {                                                    // walking to the point the player chose
      const [wx, wz] = goalFor(u, u.go.x, u.go.z);
      moveTo(u, wx, wz, dt, wx === u.go.x ? 1.5 * UR : 0);
      if (hyp(u.go.x - u.x, u.go.z - u.z) <= 1.5 * UR) u.go = null;
      if (u.go && u.wst > 2.5) { u.go = null; u.wst = 0; u.rt = null; }              // (pinned at the shore on the way: arrived as far as it can)
      // enemies close by interrupt the march (a hero keeps walking: it only fights once it has arrived)
      if (u.go && !u.hero) { const e = foeNear(u, (u.role === 'ranged' ? 26 : 8) * US); if (e) u.target = e; }
      if (u.go && u.stuck > 1.2 && u.blocker && !u.blocker.dead) { u.target = u.block = u.blocker; u.stuck = 0; u.retarget = 2.5; }      // something solid is in the way of the march: break through it
      if (u.go && !u.target) return;
    }
    u.retarget -= dt;
    if (u.focus) { const f = u.focus; if (f.dead || (f.hp !== undefined && f.hp <= 0)) u.focus = null; else if (u.target !== f && u.target !== u.block) { u.target = f; u.retarget = 1.2; } else if (u.target === f && u.retarget <= 0) u.retarget = 1.2; }          // (S9: a focused squad keeps its target until it falls)
    if (u.hero && u.target && u.target !== u.block && u.hold && (u.target.w !== undefined ? distB(u.hold, u.target) > ((u.target.rng || u.target.def) ? LEASH + 3 * US : 8 * US) : dist(u.hold, u.target) > LEASH + 5 * US)) { u.target = null; u.retarget = 0.2; }        // (it left the leash: let it go)
    if (!u.target || u.retarget <= 0 || u.target.dead || (u.target.hp !== undefined && u.target.hp <= 0)) { u.target = u.hero ? pickHeroTarget(u) : pickAttackerTarget(u); u.retarget = 0.9 + R() * 0.5; u.block = null; }
    let t = u.target;
    if (!t) {                                                                       // (a hero with nothing in reach waits at its spot and steps back onto it after a fight)
      if (u.hero && u.hold && hyp(u.hold.x - u.x, u.hold.z - u.z) > 2.2 * UR) { const [wx, wz] = goalFor(u, u.hold.x, u.hold.z); moveTo(u, wx, wz, dt, wx === u.hold.x ? 0.8 * UR : 0); }
      return;
    }
    const isB = t.w !== undefined;
    // solid things in the way (ground units): the wall / gate on the straight line to the target, or whatever they keep bumping into.
    // Ranged units shoot over a wall when the target is in range; they only break through when it is not.
    if (!u.air && !u.block) {
      const inReach = u.rng > 0 && (isB ? distB(u, t) : dist(u, t)) <= u.rng;
      if (!inReach) {
        const [wx, wz] = goalFor(u, t.x, t.z);
        let bt = 2; for (const w of walls) if (!w.dead && w !== t) { const h = segHit(u.x, u.z, wx, wz, w); if (h >= 0 && h < bt) { bt = h; u.block = w; } }       // the nearest wall on the way
      }
    }
    if (!u.block && u.stuck > 1.2 && u.blocker && !u.blocker.dead && u.blocker !== t) { u.block = u.blocker; u.stuck = 0; }
    if (u.block && u.block.dead) u.block = null;
    if (u.block) t = u.block;
    const tb = t.w !== undefined;
    const d = tb ? distB(u, t) : dist(u, t), reach = u.rng > 0 ? u.rng : tb ? (u.type === 'giant' ? GIANT_SWING.reach : 1.4) * UR : u.r + (t.r || 0.8 * UR) + 0.5 * UR;       // (a giant stands a club's length from a building: the head of the club lands on its face, not inside it)
    if (d > reach) {
      const [wx, wz] = goalFor(u, t.x, t.z); moveTo(u, wx, wz, dt, 0);
      if (u.wst > 2.5 && u.target) { (u.bad = u.bad || {})[u.target.id] = sim.time + 15; u.target = null; u.block = null; u.rt = null; u.wst = 0; u.retarget = 0; }       // pinned at the shore for good: give that target up for a while
      return;
    }
    u.stuck = 0;
    u.face = Math.atan2(t.x - u.x, t.z - u.z);
    if (u.cd > 0) return;
    const SG = u.role === 'siege' ? (SIEGE[u.type] || SIEGE.catapult) : null;
    const interval = SG ? SG.iv : u.type === 'giant' ? GIANT_SWING.iv : u.role === 'air' && u.rng ? 0.5 : u.role === 'ranged' ? 1.1 : 0.9;
    u.cd = interval * (0.9 + R() * 0.2);
    const dmg = u.dps * interval * (u.rageUntil > sim.time ? 1.55 : 1) * (u.bannerUntil > sim.time ? 1.3 : 1);
    if (u.role === 'siege') {
      ev({ k: 'shot', kind: SG.kind, from: [u.x, SG.h, u.z], to: [t.x, t.h ? t.h * 0.5 : 1, t.z], t: SG.fl, u: u.id, big: !!SG.big });
      queue(SG.fl, () => splashAt(t.x, t.z, SG.sp * UR, dmg * (tb ? TUNE.bms : 1), 'A', t, u.type));
    } else if (u.role === 'air' && u.rng >= 15) {                                // baby dragon / dragon / dark rider: fire breath, cone of damage; the three-headed ones breathe with every head (centre + one either side)
      const T3 = u.type === 'dragon3' || u.type === 'baby3', big = u.type === 'dragon' || u.type === 'dragon3', shadow = u.shadowUntil > sim.time;
      const dd = (big ? TUNE.brD * (T3 ? 1.2 : 1) : u.type === 'dragonling' ? TUNE.brL : TUNE.brB * (u.type === 'baby3' ? 1.25 : u.type === 'darkrider' ? 1.35 : 1)) * UR * (shadow ? 1.6 : 1);
      const heads = T3 ? 3 : 1, per = (big ? 1.2 : 1) * (shadow ? 2 : 1) * (T3 ? 0.4 : 1), side = [0, -1, 1], ang = Math.atan2(t.x - u.x, t.z - u.z), px = Math.cos(ang), pz = -Math.sin(ang);
      for (let h = 0; h < heads; h++) {
        const ox = side[h] * dd * 0.9 * px, oz = side[h] * dd * 0.9 * pz, bx = t.x + ox, bz = t.z + oz;
        ev({ k: 'breath', from: [u.x, u.y, u.z], to: [bx, 1, bz], big, u: u.id, head: h });
        queue(0.25 + h * 0.08, () => splashAt(bx, bz, dd, dmg * per * (tb ? BM.air : 1) * 0.55, 'A', t, u.type));
      }
    } else if (u.type === 'mage' || u.type === 'lich') {                          // the skeleton mage / the lich: a glowing orb that bursts on impact (small area, hurts every foe in it; the lich's is half as wide again)
      const fl = Math.max(0.25, d / (30 * US));
      ev({ k: 'shot', kind: 'orb', from: [u.x, 4.2, u.z], to: [t.x, tb ? Math.min(3, t.h * 0.4) : 1.6, t.z], t: fl, u: u.id, delay: HIT_T.orb });
      queue(HIT_T.orb + fl, () => splashAt(t.x, t.z, (u.type === 'lich' ? 5.2 : 3.4) * UR, dmg * (tb ? BM.ranged : 1), 'A', tb ? t : null, u.type));
    } else if (u.rng > 0) {
      ev({ k: 'shot', kind: 'arrow', from: [u.x, 2.2, u.z], to: [t.x, tb ? Math.min(3, t.h * 0.4) : 1.4, t.z], t: Math.max(0.15, d / (42 * US)), u: u.id, delay: HIT_T.arrow });
      queue(HIT_T.arrow + Math.max(0.15, d / (42 * US)), () => { if (tb) hurtB(t, dmg * (TUNE['bm_' + u.role] ?? BM[u.role]), u.type); else hurtU(t, dmg, u.type); });
    } else {
      const ht = hitTOf(u.type);
      ev({ k: 'melee', u: u.id, x: u.x, z: u.z, tx: t.x, tz: t.z, hit: ht });
      queue(ht, () => { if (tb) hurtB(t, dmg * ((TUNE['bm_' + u.role] ?? BM[u.role]) || 0.5), u.type); else hurtU(t, dmg, u.type); if (u.role === 'giant') ev({ k: 'slam', x: t.x, z: t.z }); if (u.type === 'ogre') splashAt(t.x, t.z, 2.4 * UR, dmg * 0.4, 'A', tb ? t : null, u.type, { ground: true }); });
    }
  };

  // a guardian (giant / hill giant: club smash, a blast on the ground around the target; baby dragon / dragon: flies, fire breath on a group) goes out against whatever comes within its leash of its post
  const guardianStep = (d, dt) => {
    d.cd -= dt; d.retarget -= dt;
    if (!d.target || d.retarget <= 0 || !alive(d.target)) {
      let best = null, bs = 1e9;
      for (const u of units) {
        if (!alive(u) || !u.active || (u.air && !d.canAir)) continue;
        if (hyp(u.x - d.hx, u.z - d.hz) > d.leash * (u.role === 'siege' ? TUNE.gsl : 1)) continue;                 // (a guardian chases a siege engine further than anything else: the engine shells from beyond its post's reach)
        const s = dist(u, d) - (u.size === 'heavy' || u.size === 'huge' ? 6 * US : 0) - (!!u.air === !!d.air ? 4 * US : 0) - (u.role === 'siege' ? TUNE.gsiege * US : 0);
        if (s < bs) { bs = s; best = u; }
      }
      d.target = best; d.retarget = 0.6 + R() * 0.3;
    }
    const t = d.target;
    if (!t) { if (hyp(d.hx - d.x, d.hz - d.z) > 2 * UR) moveTo(d, d.hx, d.hz, dt, 0); return; }
    const dd = dist(d, t), reach = d.rng > 0 ? d.rng : d.r + (t.r || 0.8 * UR) + 1.0 * UR;
    if (dd > reach) { const [wx, wz] = goalFor(d, t.x, t.z); moveTo(d, wx, wz, dt, 0); return; }
    d.face = Math.atan2(t.x - d.x, t.z - d.z);
    if (d.cd > 0) return;
    const src = 'g_' + d.type;
    if (d.air) {                                                                   // baby dragon / dragon: the breath (the same blast the attackers' dragons have)
      const interval = 0.5; d.cd = interval * (0.9 + R() * 0.2);
      const r = (d.type === 'dragon' ? TUNE.brD : TUNE.brB) * UR, dmg = d.dps * interval * (d.type === 'dragon' ? 1.2 : 1) * 0.55;
      ev({ k: 'breath', from: [d.x, d.y || 12, d.z], to: [t.x, 1, t.z], big: d.type === 'dragon', u: d.id });
      queue(0.25, () => splashAt(t.x, t.z, r, dmg, 'D', null, src));
    } else {                                                                       // giant: one smash per swing, a blast on the ground around the victim
      const interval = GIANT_SWING.iv; d.cd = interval * (0.9 + R() * 0.2);
      const dmg = d.dps * interval;
      ev({ k: 'melee', u: d.id, x: d.x, z: d.z, tx: t.x, tz: t.z });
      queue(GIANT_SWING.hit, () => { splashAt(t.x, t.z, 2.6 * UR, dmg, 'D', null, src, { ground: true }); ev({ k: 'slam', x: t.x, z: t.z }); });
    }
  };
  const defenderStep = (d, dt) => {
    if (d.frozen > sim.time) return;
    if (d.guardian) { guardianStep(d, dt); return; }
    d.cd -= dt; d.retarget -= dt;
    if (!d.target || d.retarget <= 0 || !alive(d.target)) {
      const c = pickDefenderTarget(d);
      d.target = c && ((d.leash && hyp(c.x - d.hx, c.z - d.hz) < d.leash) || (d.hunter && TUNE.hunt > 0 && c.role === 'siege' && hyp(c.x - d.hx, c.z - d.hz) < huntR()) || (d.kind !== 'reserve' && (insideRing(c.x, c.z) || dist(c, d) < 8 * US) && dist(c, d) < 28 * US)) ? c : null;       // (the reserve sallies at whatever comes within its leash of its post, inside the walls or out)
      d.retarget = 0.7;
    }
    const t = d.target;
    if (!t) { const dx = d.hx - d.x, dz = d.hz - d.z; if (hyp(dx, dz) > 1.2 * UR) { moveTo(d, d.hx, d.hz, dt, 0); } return; }
    const dd = dist(d, t), reach = d.rng > 0 ? d.rng : d.r + t.r + 0.5 * UR;
    if (dd > reach) { moveTo(d, t.x, t.z, dt, 0); return; }
    d.face = Math.atan2(t.x - d.x, t.z - d.z);
    if (d.cd > 0) return; d.cd = 1.0; const dmg = d.dps;
    if (d.rng > 0) { ev({ k: 'shot', kind: 'arrow', from: [d.x, 2, d.z], to: [t.x, (t.y || 0) + 1.3, t.z], t: 0.3, u: d.id }); queue(0.3, () => hurtU(t, dmg, 'garch')); }
    else { ev({ k: 'melee', u: d.id, x: d.x, z: d.z, tx: t.x, tz: t.z }); queue(0.25, () => hurtU(t, dmg, 'guard')); }
  };

  // ---- the guns.  Every defence follows its row of the DEFENCES table (military.py): which layers it can hit (`ground` / `air`), how it picks (`near`; `air` = flyers first, then the heavy, then the rest;
  // `dense` = the packed ground group with the most bodies under the blast), its blind spot (`minr`), its blast (`splash`) and the damage multiplier by the size class of the victim (`mult`).
  const PRI = { air: 0, heavy: 1, medium: 2, light: 3 };
  const cannonAim = (b) => {                                                      // the densest ground group in reach (outside the blind spot): the body whose neighbourhood costs the most
    let best = null, bs = -1, bd = 1e9;
    for (const u of units) {
      if (!alive(u) || !u.active || (u.air && !b.air)) continue;
      const d = hyp(u.x - b.x, u.z - b.z); if (d >= b.rng || d < b.minr) continue;
      let w = (u.air ? b.mult[sizeClass(u)] || 0 : 0) + (u.role === 'siege' ? TUNE.cbat : 0); const ci = Math.floor(u.x / CELL), cj = Math.floor(u.z / CELL);
      for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) { const c = gA.get(GK(i, j)); if (!c) continue; for (let k = 0; k < c.length; k++) { const o = c[k]; if (o.dead || (o.x - u.x) * (o.x - u.x) + (o.z - u.z) * (o.z - u.z) > b.splash * b.splash) continue; w += b.mult[sizeClass(o)] || 0; } }
      if (w > bs + 1e-9 || (w > bs - 1e-9 && d < bd)) { bs = w; bd = d; best = u; }
    }
    return best;
  };
  const towerStep = (b, dt) => {
    if (b.frozen > sim.time) return;
    b.t -= dt; if (b.t > 0) return;
    let best = null;
    if (b.pick === 'dense') best = cannonAim(b);
    else {
      let bs = 1e18;
      for (const u of units) {
        if (!alive(u) || !u.active || (u.air ? !b.air : !b.ground)) continue;
        const d = hyp(u.x - b.x, u.z - b.z); if (d >= b.rng || d < b.minr) continue;
        const sc = (b.pick === 'air' ? PRI[sizeClass(u)] * 1e5 : 0) + d - (u.role === 'siege' && TUNE.cb ? 5e4 : 0); if (sc < bs) { bs = sc; best = u; }
      }
    }
    if (!best) { b.t = 0.25; return; }
    b.t = b.cd;
    const M = b.mult, mu = (u) => (M ? (M[sizeClass(u)] ?? 1) : 1), src = b.dk === 'tesla' ? 'tesla' : b.dk;
    if (b.chain) {                                                                // Tesla: strikes the nearest foe, then jumps to the next two (60 %, 36 %)
      const hit = [best], pts = [[b.x, b.h + 3.2, b.z], [best.x, best.y + 1.2, best.z]];
      for (let k = 1; k < b.chain; k++) {
        const p = hit[hit.length - 1]; let nx = null, nd = b.hop;
        for (const u of units) if (alive(u) && u.active && !hit.includes(u)) { const d = hyp(u.x - p.x, u.z - p.z); if (d < nd) { nd = d; nx = u; } }
        if (!nx) break; hit.push(nx); pts.push([nx.x, nx.y + 1.2, nx.z]);
      }
      ev({ k: 'zap', pts, ids: hit.map((u) => u.id), b: b.id });
      hit.forEach((u, i) => hurtU(u, b.dmg * Math.pow(0.6, i) * mu(u), src));
      return;
    }
    if (b.volley) {                                                               // the four-barrel house: a salvo of shells, one barrel after the other, each with a tiny blast
      const per = b.dmg / b.volley, tx = best.x, tz = best.z;
      for (let i = 0; i < b.volley; i++) {
        const off = i * 0.17;
        queue(off, () => ev({ k: 'shot', kind: b.kind, from: [b.x, b.h + 1, b.z], to: [tx, 1.2, tz], t: b.flight, b: b.id, q: i }));
        queue(off + b.flight, () => splashAt(tx, tz, b.splash, per, 'D', null, src, { ground: true, mult: M }));
      }
      return;
    }
    if (b.splash) {                                                               // the cannon: the ball lands where the group is going to be (the aim leads by what the body walked this step), air is out of its reach
      const lead = b.flight * 0.8 / dt, ix = best.x + (best.x - best.lx) * lead, iz = best.z + (best.z - best.lz) * lead;
      ev({ k: 'shot', kind: b.kind, from: [b.x, b.h + 1, b.z], to: [ix, 1.2, iz], t: b.flight, b: b.id });
      queue(b.flight, () => splashAt(ix, iz, b.splash, b.dmg * (b.dk === 'cannon' ? TUNE.splashK : 1), 'D', null, src, { ground: !b.air, mult: M, slow: b.slow, slowT: b.slowT }));
      return;
    }
    ev({ k: 'shot', kind: b.kind, from: [b.x, b.h + 1, b.z], to: [best.x, best.y + 1.2, best.z], t: b.flight, b: b.id });
    queue(b.flight, () => hurtU(best, b.dmg * mu(best), src));
  };

  // ---- spells (brewed in the forge; Clash of Clans / Siegefall style).  Damage scales with the base (hpU = a typical building's hit points).
  const nb = B.filter((b) => !b.ring && b.type !== 'house').map((b) => b.maxHp).sort((a, b) => a - b), hpU = nb.length ? nb[nb.length >> 1] : 100;
  const SPELL = { lightning: { r: 8, dur: 0 }, heal: { r: 17, dur: 7 }, rage: { r: 15, dur: 10 }, freeze: { r: 20, dur: 5.5 }, quake: { r: 28, dur: 1.4 } };
  sim.spellDefs = SPELL; sim.hpU = hpU;
  sim.cast = (type, x, z) => {
    const d = SPELL[type]; if (!d || !(sim.spells[type] > 0) || sim.over) return false;
    sim.spells[type]--; sim.spellsUsed[type] = (sim.spellsUsed[type] || 0) + 1;
    ev({ k: 'spell', type, x, z, r: d.r, dur: d.dur });
    if (type === 'lightning') {
      for (let i = 0; i < 4; i++) queue(0.12 + i * 0.2, () => {
        const a = R() * 6.283, rr = Math.sqrt(R()) * d.r * 0.8, bx = x + Math.cos(a) * rr, bz = z + Math.sin(a) * rr;
        ev({ k: 'bolt', x: bx, z: bz });
        for (const b of B) if (!b.dead && hyp(b.x - bx, b.z - bz) < 6 + Math.max(b.w, b.d) * 0.4) hurtB(b, hpU * 0.3 * (b.type === 'wall' ? 0.6 : 1), 'spell');
        for (const e of DEF) if (alive(e) && hyp(e.x - bx, e.z - bz) < 7) hurtU(e, 500, 'spell');
      });
    } else if (type === 'heal' || type === 'rage') sim.zones.push({ type, x, z, r: d.r, until: sim.time + d.dur });
    else if (type === 'freeze') {
      const until = sim.time + d.dur;
      for (const e of DEF) if (alive(e) && hyp(e.x - x, e.z - z) < d.r) e.frozen = until;
      for (const b of B) if (!b.dead && b.rng && hyp(b.x - x, b.z - z) < d.r + 4) { b.frozen = until; ev({ k: 'freezeB', b: b.id, x: b.x, z: b.z, h: b.h }); }
    } else if (type === 'quake') {
      for (let i = 0; i < 4; i++) queue(0.2 + i * 0.35, () => { for (const b of B) if (!b.dead && hyp(b.x - x, b.z - z) < d.r + Math.max(b.w, b.d) * 0.3) hurtB(b, b.maxHp * 0.055, 'spell'); });
    }
    return true;
  };

  // ---- player commands
  sim.send = (type, x, z, opt) => {
    let n = 0;
    let cx = Math.max(FLD.x0 + 4, Math.min(FLD.x1 - 4, x)), cz = Math.max(FLD.z0 + 4, Math.min(FLD.z1 - 4, z));
    let list = units.filter((u) => u.type === type && alive(u) && (HEROES[type] || !u.active));      // (p35 K1 «one send»: a soldier goes where the player says only the FIRST time; after that it fights by its own AI.  Only the heroes can be sent again and again)
    if (opt && opt.half && !HEROES[type] && list.length > 1) list = list.map((u) => [hyp(u.x - cx, u.z - cz), u]).sort((a, b) => a[0] - b[0] || a[1].id - b[1].id).slice(0, Math.ceil(list.length / 2)).map((e) => e[1]);       // (S9: only the half of the squad nearest to the tap goes; the rest stays where it is and can be sent somewhere else)
    const cols = Math.max(2, Math.ceil(Math.sqrt(list.length))), fly = list.length > 0 && !!list[0].air;       // (flyers cross walls, moat and water: they may be sent to ANY point, the middle of the town included)
    if (NAV && !fly && NAV.isBlocked(cx, cz)) [cx, cz] = NAV.nearestDry(cx, cz);
    if (HEROES[type]) {                                                           // heroes: one spot each (no formation), kept until the player taps another
      list.forEach((u, k) => { u.active = true; u.target = null; u.block = null; u.focus = null; const gx = cx + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 3 * UR, gz = cz;
        const g = NAV && NAV.isBlocked(gx, gz) ? NAV.nearestDry(gx, gz) : [gx, gz]; u.go = { x: g[0], z: g[1] }; u.hold = { x: g[0], z: g[1] }; u.rt = null; n++; });
      return n;
    }
    list.forEach((u, k) => { u.active = true; u.target = null; u.block = null; u.focus = null; const gx = cx + ((k % cols) - (cols - 1) / 2) * 1.6 * UR, gz = cz + (Math.floor(k / cols) - cols / 2) * 1.6 * UR; u.go = NAV && !fly && NAV.isWet(gx, gz) ? (([x2, z2]) => ({ x: x2, z: z2 }))(NAV.nearestDry(gx, gz)) : { x: gx, z: gz }; u.rt = null; n++; });
    return n;
  };
  // S9: focus a squad on ONE target (a building, or a defender): every unit of the type goes for it and keeps hitting it until it falls, then picks its own targets again.  The heroes are manual and ignore it.
  sim.isHero = (type) => !!HEROES[type];
  sim.canSend = (type) => HEROES[type] ? units.some((u) => u.type === type && alive(u)) : units.some((u) => u.type === type && alive(u) && !u.active);      // (the ring of a squad is a handle only while this is true)
  sim.targetAt = (x, z, r = 3 * UR) => {                                                  // the thing the player tapped: the nearest standing building footprint (or defender) within r
    let best = null, bd = r;
    for (const b of B) { if (b.dead) continue; const d = distB({ x, z }, b); if (d < bd) { bd = d; best = b; } }
    for (const d of DEF) if (alive(d)) { const dd = hyp(d.x - x, d.z - z) - (d.r || 1); if (dd < bd) { bd = dd; best = d; } }
    return best;
  };
  sim.focus = (type, tgt, opt) => {
    if (!tgt || HEROES[type] || sim.over) return 0;
    let list = units.filter((u) => u.type === type && alive(u) && !u.active);                 // (K1: a soldier takes an order once, so a focus is also its first and only one)
    if (opt && opt.half && list.length > 1) list = list.map((u) => [hyp(u.x - tgt.x, u.z - tgt.z), u]).sort((a, b) => a[0] - b[0] || a[1].id - b[1].id).slice(0, Math.ceil(list.length / 2)).map((e) => e[1]);
    let n = 0; const flyer = (u) => !!u.air;
    for (const u of list) { if (!flyer(u) && tgt.air && !(u.rng > 0)) continue; u.active = true; u.go = null; u.focus = tgt; u.target = tgt; u.block = null; u.rt = null; u.retarget = 1.2; n++; }
    return n;
  };
  // ---- hero powers (a button in the battle HUD; each has a cooldown)
  //   Shield Wall  (shieldmaiden): 6 s of 70 % less damage for her, 35 % less for everyone within 14 m, and the defenders near her turn on her
  //   Rally Charge (mounted lord): a battle cry — a shock wave around him and 8 s of rage (faster, harder) for every soldier within 26 m
  sim.heroes = HEROES; sim.abilT = {}; sim.abilUsed = {};
  sim.abilityState = (type) => {
    const H = HEROES[type]; if (!H) return null;
    const list = units.filter((u) => u.type === type && alive(u)), sent2 = list.some((u) => u.active), left = Math.max(0, (sim.abilT[type] || 0) - sim.time);
    return { n: list.length, sent: sent2, f: left > 0 ? left / H.cd : 0, left, ready: sent2 && left <= 0 };
  };
  sim.ability = (type) => {
    const H = HEROES[type]; if (!H || sim.over) return false;
    const list = units.filter((u) => u.type === type && alive(u) && u.active); if (!list.length || (sim.abilT[type] || 0) > sim.time) return false;
    const dive = {};                                                                // Dive Strike: each knight picks its victim first; with nobody within 40 m the button does nothing (and costs nothing)
    if (type === 'gryphonknight') {
      for (const u of list) {
        let best = null, bs = 1e9;
        for (const e of DEF) if (alive(e)) { const d = dist(u, e); if (d < 40 * US && d < bs) { bs = d; best = e; } }
        if (!best) for (const b of B) if (!b.dead && !b.ring) { const d = distB(u, b); if (d < 40 * US && d < bs) { bs = d; best = b; } }
        if (best) dive[u.id] = best;
      }
      if (!Object.keys(dive).length) return false;
    }
    sim.abilT[type] = sim.time + H.cd; sim.abilUsed[type] = (sim.abilUsed[type] || 0) + 1;
    for (const u of list) {
      const r = (type === 'lord' ? 26 : type === 'captain' ? 18 : type === 'darkrider' ? 20 : type === 'gryphonknight' ? 10 : 14) * US;
      ev({ k: 'ability', type, id: u.id, x: u.x, z: u.z, r, dur: H.dur });
      if (type === 'shieldmaiden') {
        u.guardUntil = sim.time + H.dur;
        for (const a of units) if (alive(a) && a !== u && dist(a, u) < r) a.shieldUntil = sim.time + H.dur;
        for (const e of DEF) if (alive(e) && dist(e, u) < 24 * US) { e.target = u; e.retarget = 4; }
      } else if (type === 'captain') {                                              // Banner: everybody within 18 m (the captain too) hits 30 % harder for 8 s
        for (const a of units) if (alive(a) && dist(a, u) < r) a.bannerUntil = sim.time + H.dur;
      } else if (type === 'darkrider') {                                            // Shadow Breath: 6 s of a breath twice as strong and 60 % wider
        u.shadowUntil = sim.time + H.dur;
      } else if (type === 'gryphonknight') {                                        // Dive Strike: it drops on the nearest foe and the blast lands 0.55 s later
        const tg = dive[u.id]; if (!tg) continue;
        const isB = tg.w !== undefined, tx = tg.x, tz = tg.z;
        ev({ k: 'dive', id: u.id, from: [u.x, u.y, u.z], to: [tx, 1, tz], t: 0.55 });
        queue(0.55, () => splashAt(tx, tz, 5 * UR, u.dps * 7, 'A', isB ? tg : null, 'gryphonknight'));
      } else {
        for (const a of units) if (alive(a) && dist(a, u) < r) a.rageUntil = sim.time + H.dur;
        queue(0.15, () => splashAt(u.x, u.z, 9 * UR, u.dps * 5, 'A', null, 'lord'));
      }
    }
    return true;
  };
  sim.alive = (type) => units.filter((u) => alive(u) && (!type || u.type === type)).length;
  sim.destruction = () => { let s = 0, left = 0; for (const b of B) { if (b.dead) s += b.value; else if (b.value > 0) left++; } return left ? Math.min(99.9, (100 * s) / share) : 100; };      // 100 % only when every last structure (walls and gates too) is down

  sim.step = (dt) => {
    sim.events.length = 0;
    if (sim.over) return;
    sim.time += dt; navBudget = Math.min(4000, navBudget + dt * 24000);
    for (let i = sim.pending.length - 1; i >= 0; i--) if (sim.pending[i].t <= sim.time) { const p = sim.pending.splice(i, 1)[0]; p.fn(); }
    for (const b of B) b.tc = 0; sim.rest = 0; for (const b of B) if (!b.dead && !b.ring) sim.rest++;
    for (let i = sim.zones.length - 1; i >= 0; i--) {
      const z = sim.zones[i]; if (sim.time >= z.until) { sim.zones.splice(i, 1); continue; }
      for (const u of units) if (alive(u) && hyp(u.x - z.x, u.z - z.z) < z.r) { if (z.type === 'heal') u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.09 * dt); else u.rageUntil = sim.time + 0.35; }
    }
    for (const u of units) { u.lx = u.x; u.lz = u.z; if (alive(u) && u.target && u.target.tc !== undefined) u.target.tc++; }
    gbuild(gA, units); gbuild(gD, DEF);
    for (const u of units) if (alive(u)) attackerStep(u, dt);
    for (const d of DEF) if (alive(d)) defenderStep(d, dt);
    for (const b of B) if (!b.dead && b.rng) towerStep(b, dt);
    for (const b of B) if (b.dead && b.collapseT < 1) b.collapseT = Math.min(1, b.collapseT + dt / 1.4);
    // end of battle: nothing left to send, keep fallen, everything destroyed or time over
    const live = units.filter(alive).length, des = sim.destruction();
    let st = (des >= 50 ? 1 : 0) + (sim.keepDown ? 1 : 0) + (des >= TUNE.star3 ? 1 : 0);
    if (des < 50) st = 0; if (st >= 3 && des < 99.95) st = 2;                      // (the server's rule: a star needs half the map, the third star the whole map)
    sim.stars = st;
    if (live === 0 || des >= 100 || sim.time >= sim.endAt) { sim.over = true; sim.over_t = sim.time; }
  };

  sim.result = () => {
    const des = sim.destruction(), stars = sim.stars, k = Math.min(1, des / 100) * (0.55 + 0.15 * stars), loot = {};
    for (const g of Object.keys(spec.loot || {})) loot[g] = Math.floor((spec.loot[g] || 0) * k);
    return { sent: { ...sent }, lost: { ...sim.lost }, spells: { ...sim.spellsUsed }, destruction: des >= 100 ? 100 : Math.floor(des * 10) / 10, stars, loot, time: sim.time, over: sim.over };
  };
  sim.lootNow = () => { const des = sim.destruction(), out = {}; for (const g of Object.keys(spec.loot || {})) out[g] = Math.floor((spec.loot[g] || 0) * Math.min(1, des / 100) * 0.55); return out; };
  return sim;
}
