// RP4 — combat core.  PURE simulation (no THREE, no DOM, no Date/Math.random): fixed-step 1/60, deterministic with a seed, testable in Node (dev/rp4_test.sh).
//   data tables  : TUNE (every number), ELEMENTS / BEATS / HARMONY (the book's cycles), SISTERS (meta only), KINDS (placeholder enemy kinds)
//   kits         : ONE data file per sister, combat/kit_<sister>.js  (`export default { ... }`, plain JSON-like numbers / strings — no code).  validateKit() / prepareKit() check it and turn it into what the sim reads.
//   createSim()  : hero + enemy state machines, hit arcs, i-frames, block, stagger / knock-back, element multiplier, lock-on, projectiles, area hits, heal / shield / buff, enemy statuses, event list for FX / HUD / audio
//   attach()     : the ONLY entry the host (rpg.js hero mode) calls — lazy-loads ./combat/{fx,hud,foes}.js and the sister's kit (nothing of this is in the boot bundle).
// Units: metres, seconds, radians INSIDE the sim; kit files use DEGREES for arcs.  yaw 0 = +Z, yaw = atan2(x, z).  The host keeps its own camera; the sim only exposes lockYaw().
export const VERSION = 'RP4-R2';

// ------------------------------------------------------------------ data
export const ELEMENTS = {                                              // colour = HUD / digits / emblem tint;  trail = [outer, inner] of the weapon trail;  glow = [bright, deep] RGB of rings / crescents / sparks
  fire:      { core: true, color: '#ff6a3a', trail: ['#ff8a3a', '#ffd27a'], glow: [[1, 0.78, 0.35], [1, 0.30, 0.08]] },
  ice:       { core: true, color: '#cfeeff', trail: ['#9fd8ff', '#ffffff'], glow: [[0.80, 0.94, 1.0], [0.35, 0.65, 1.0]] },
  water:     { core: true, color: '#4fb0ff', trail: ['#3a8cff', '#aee0ff'], glow: [[0.55, 0.85, 1.0], [0.12, 0.40, 1.0]] },
  plant:     { core: true, color: '#7fe06a', trail: ['#5cc84a', '#d6ff9a'], glow: [[0.75, 1.0, 0.50], [0.20, 0.72, 0.18]] },
  stone:     { core: true, color: '#f0a666', trail: ['#c98a52', '#ffd9a8'], glow: [[1.0, 0.84, 0.58], [0.72, 0.42, 0.18]] },
  wind:      { core: true, color: '#9fe8ff', trail: ['#7fd8f0', '#eafcff'], glow: [[0.88, 1.0, 1.0], [0.40, 0.85, 0.95]] },
  light:     { color: '#fff1a8', trail: ['#ffe27a', '#ffffff'], glow: [[1.0, 0.96, 0.70], [1.0, 0.80, 0.28]] },
  shadow:    { color: '#9a6bff', trail: ['#6a3fd6', '#d9c4ff'], glow: [[0.72, 0.52, 1.0], [0.30, 0.12, 0.62]] },
  turquoise: { color: '#2fe8d8', trail: ['#17bfb0', '#c4fff8'], glow: [[0.62, 1.0, 0.96], [0.10, 0.74, 0.70]] },
};
// The book's cycles (BLUEWALL_HANDOFF «چرخه‌ی عنصرها»).  BEATS[A] = what A beats (A -> B: x1.5 to B, B takes x1.5 from A, A takes x0.75 from B):
//   water triangle : fire -> ice (melts) -> water (freezes) -> fire (douses)      earth triangle : plant -> stone (splits) -> wind (blocks) -> plant (uproots)
//   light burns all six; only shadow and turquoise eat light.   Anything else = x1.   (the book's «خاک» = our `stone`: six elements, six sisters)
export const BEATS = {
  fire: ['ice'], ice: ['water'], water: ['fire'], plant: ['stone'], stone: ['wind'], wind: ['plant'],
  light: ['fire', 'ice', 'water', 'plant', 'stone', 'wind'], shadow: ['light'], turquoise: ['light'],
};
export const HARMONY = [                                               // the 7 pairs (order of the pair does not matter; harmonyOf(a, b)).  `fa` is for the docs only, never shown in the hero UI
  { pair: ['fire', 'wind'], id: 'firestorm', name: 'Firestorm', fa: 'طوفان آتش' },
  { pair: ['plant', 'stone'], id: 'thorn_fort', name: 'Thorn Fort', fa: 'دژ خار' },
  { pair: ['water', 'ice'], id: 'frozen_wave', name: 'Frozen Wave', fa: 'موج یخ‌زده' },
  { pair: ['fire', 'water'], id: 'hot_mist', name: 'Hot Mist', fa: 'مه داغ' },
  { pair: ['wind', 'ice'], id: 'blizzard', name: 'Blizzard', fa: 'بوران' },
  { pair: ['plant', 'water'], id: 'healing_garden', name: 'Healing Garden', fa: 'باغ شفا' },
  { pair: ['stone', 'fire'], id: 'lava', name: 'Lava', fa: 'گدازه' },
];
export function harmonyOf(a, b) { if (!a || !b || a === b) return null; for (const h of HARMONY) if ((h.pair[0] === a && h.pair[1] === b) || (h.pair[0] === b && h.pair[1] === a)) return h; return null; }
const beats = (a, b) => { const l = BEATS[a]; return !!l && l.indexOf(b) >= 0; };
export function elementMult(att, def) { if (!att || !def) return 1; if (beats(att, def)) return 1.5; if (beats(def, att)) return 0.75; return 1; }

export const TUNE = {
  step: 1 / 60,
  ATK: 100, comboSpeed: 1.0,
  hero: { hp: 600, stamina: 100, regen: 30, regenDelay: 0.6, run: 4.4, accel: 16, radius: 0.45, hitStun: 0.38, armor: 0.5, downAt: 0.25, down: 1.1, wakeInvul: 0.5, turnRate: 18 },
  buffer: { attack: 0.30, dodge: 0.30, skill: 0.30 }, grace: 0.30,
  dodge: { dur: 0.62, i0: 0.04, i1: 0.34, dist: 4.4, back: 3.2, cost: 25, recharge: 0.8, refund: 25, clipLen: 1.7, margin: 1.2 },
  block: { clip: 'block', dur: 0.84, t0: 0, arc: 120, dr: 0.25, cost: 0.3, raise: 0.10, turn: 10, walk: 0, push: 1.5, stop: 0.05, breakSt: 20 },   // hold: x0.25 damage from the front 120 deg after a 0.10 s raise; every blocked hit costs 0.3 stamina per point of damage; stamina does not regenerate while the guard is up; if it runs out the guard breaks (the rest of the hit goes through + a stagger, no guard until 20 stamina are back)
  autoTurn: 3.0,
  lock: { range: 18, cone: 65 * Math.PI / 180, drop: 24, reacquire: 8 },
  hitstop: { hurt: 0.07 },
  shake: 1.0,
  status: { burnTick: 0.5 },
  frame: { right: 0.8, shift: 0.4, up: 0.3, back: 0.6 },   // fight camera, nudged from the HOST's behind-the-hero camera (eased in 0.4 s / out 0.9 s; dropped where a pillar / the wall is in the way): up + back (m), and sideways only as far as needed to put her 40 % of the half-width left of the centre (max `right` m)
  enemy: { aggro: 14, active: 0.15, recover: 0.8, stagger: 0.7, deadT: 1.2, radius: 0.55, max: 6, attackers: 2, poiseDecay: 25, lunge: 0.6 },
};
const D2R = Math.PI / 180;
export const SISTERS = {                                               // meta only — the kits live in combat/kit_<id>.js
  elina:  { element: 'fire',  role: 'melee striker',  weapon: 'sword' },
  elika:  { element: 'wind',  role: 'fast scout',     weapon: 'two daggers + sling' },
  melika: { element: 'plant', role: 'ranged healer',  weapon: 'living bow + dagger' },
  mobina: { element: 'stone', role: 'tank',           weapon: 'hammer + stone gauntlet' },
  aylin:  { element: 'water', role: 'support healer', weapon: 'staff' },
  aylar:  { element: 'ice',   role: 'controller',     weapon: 'spear + ice beads' },
};
export const kitFile = (id) => 'combat/kit_' + id + '.js';
// placeholder enemy kinds (test only; the real enemies are RP6 and come from an owner-picked sheet).  cc = how much of a freeze / slow / root time sticks (1 = all)
export const KINDS = {
  soldier: { hp: 240, speed: 3.3, reach: 1.9, arc: 80 * D2R, tele: 0.6, dmg: 70,  poise: 60,  element: 'ice',   radius: 0.5, cc: 1 },
  beast:   { hp: 320, speed: 4.8, reach: 1.9, arc: 90 * D2R, tele: 0.5, dmg: 90,  poise: 60,  element: 'water', radius: 0.6, cc: 1 },
  brute:   { hp: 650, speed: 2.2, reach: 2.7, arc: 100 * D2R, tele: 0.9, dmg: 160, poise: 200, element: null,    radius: 0.8, cc: 0.5 },
};

// ------------------------------------------------------------------ the kit contract (validateKit / prepareKit)
//   A kit is DATA.  Every field below is checked: a typo, a missing field or an out-of-range number is an error with the field's path (and a kit with errors is never loaded).
export const CLIPS_33 = ['idle', 'walk', 'run', 'jump', 'fall', 'land', 'dodge', 'hit', 'death', 'knockdown', 'punch_a', 'punch_b', 'kick_a', 'kick_b', 'cast', 'aim', 'talk', 'bow', 'cry', 'look_around', 'cheer', 'angry', 'sit_down', 'sit_idle', 'stand_up', 'slash_a', 'slash_b', 'slash_c', 'heavy', 'block', 'swim', 'climb', 'interact'];
export const ICONS = ['sword', 'dagger', 'bow', 'hammer', 'staff', 'spear', 'flame', 'burst', 'wave', 'heal', 'shield', 'gust', 'bolt', 'snow', 'leaf', 'quake', 'beads', 'buff'];
const isNum = (v) => typeof v === 'number' && isFinite(v);
const N = (lo, hi, def) => ({ t: 'n', lo, hi, def }), E = (vals, def) => ({ t: 'e', vals, def }), B = (def) => ({ t: 'b', def }), P = (lo, hi, def) => ({ t: 'p', lo, hi, def }), S = (def) => ({ t: 's', def }), O = (def) => ({ t: 'o', def });
function fields(errs, path, o, spec) {                                  // checks `o` against `spec`, returns a fresh object with the defaults filled in (unknown keys are errors)
  const out = {}; if (!o || typeof o !== 'object' || Array.isArray(o)) { errs.push(path + ' must be an object'); o = {}; }
  for (const k in o) if (!(k in spec)) errs.push(path + '.' + k + ': unknown field (allowed: ' + Object.keys(spec).join(', ') + ')');
  for (const k in spec) {
    const s = spec[k], v = o[k], p = path + '.' + k;
    if (v === undefined) { if (s.def === undefined) errs.push(p + ' is required'); out[k] = s.def; continue; }
    out[k] = v;
    if (s.t === 'n' && (!isNum(v) || v < s.lo || v > s.hi)) errs.push(p + ' must be a number in ' + s.lo + '..' + s.hi + ' (got ' + JSON.stringify(v) + ')');
    else if (s.t === 'e' && s.vals.indexOf(v) < 0) errs.push(p + ' must be one of ' + s.vals.join(' | ') + ' (got ' + JSON.stringify(v) + ')');
    else if (s.t === 'b' && typeof v !== 'boolean') errs.push(p + ' must be true or false');
    else if (s.t === 's' && (typeof v !== 'string' || !v)) errs.push(p + ' must be a non-empty string');
    else if (s.t === 'p' && !(Array.isArray(v) && v.length === 2 && isNum(v[0]) && isNum(v[1]) && v[0] >= s.lo && v[1] <= s.hi && v[0] < v[1])) errs.push(p + ' must be [a, b] with ' + s.lo + ' <= a < b <= ' + s.hi + ' (got ' + JSON.stringify(v) + ')');
  }
  return out;
}
const HITF = { stop: N(0, 0.2, 0.055), knock: N(0, 6, 0.3), poise: N(0, 400, 22), stagger: B(false), status: O(null) };
const STATUS = { id: E(['slow', 'freeze', 'root', 'burn']), dur: N(0.2, 10), k: N(0.1, 0.9, 0.5), dps: N(0.01, 2, 0.2) };    // slow: speed x k;  freeze: stunned (cc-scaled);  root: cannot walk (can still strike);  burn: dps x ATK per second, not cc-scaled
const FX_SPEC = {
  projectile: { type: E(['projectile']), speed: N(1, 40), range: N(1, 40), radius: N(0.1, 4), dmg: N(0, 8), count: N(1, 5, 1), spread: N(0, 90, 0), pierce: B(true), vis: E(['bolt', 'crescent'], 'bolt'), ...HITF },
  aoe: { type: E(['aoe']), radius: N(0.5, 12), dmg: N(0, 8), shape: E(['circle', 'cone'], 'circle'), arc: N(20, 360, 360), offset: N(0, 8, 0), vis: E(['ring'], 'ring'), ...HITF, knock: N(0, 6, 0.3), poise: N(0, 400, 0) },
  heal: { type: E(['heal']), amount: N(0.01, 1), dur: N(0, 12, 0) },
  shield: { type: E(['shield']), absorb: N(0.01, 2), dur: N(0.5, 20) },
  buff: { type: E(['buff']), stat: E(['atk', 'dr', 'rate']), mult: N(0.2, 3), dur: N(0.5, 30) },
  stamina: { type: E(['stamina']), amount: N(1, 100) },
};
const WEAPON = { slot: E(['R', 'L']), url: S(), len: N(0.2, 2.5), grip: O(), tip: N(0, 1.3, 0.92), root: N(0, 1.3, 0.62) };
const BEAT = { type: E(['melee', 'shot'], 'melee'), clip: S(), dur: N(0.2, 3), rate: N(0.5, 2.5, 1), t0: N(0, 10, 0), hit: P(0, 3), dmg: N(0.1, 6), arc: N(10, 360, 110), reach: N(0.5, 8, 2.2), lunge: O(null), cancel: N(0.05, 3, null), stop: N(0, 0.2, 0.055), knock: N(0, 6, 0.3), poise: N(0, 400, 22), stagger: B(false), trail: O(null), hit2: O(null), dmg2: N(0.1, 6, 0.5), sec: O(null), shot: O(null), status: O(null), finisher: B(false), note: S('') };
const SKILL = { id: S(), name: S(''), cd: N(1, 90), clip: S(), rate: N(0.5, 2.5, 1), t0: N(0, 10, 0), dur: N(0.2, 4), at: N(0, 4), lunge: O(null), cost: N(0, 100, 0), icon: E(ICONS, 'burst'), effects: O(), note: S('') };
const KIT = { id: S(), element: E(Object.keys(ELEMENTS).filter((k) => ELEMENTS[k].core)), role: S(''), weapons: O([]), trail: B(true), trailWeapon: N(0, 1, 0), hero: O({}), block: O({}), autoTurn: N(1, 12, 3), icons: O({}), clips: O([]), combo: O(), skills: O(), note: S('') };
const mkLunge = (errs, path, v, dur) => { if (v == null) return [0, 0, 1]; if (!Array.isArray(v) || v.length !== 3 || !v.every(isNum) || v[0] < 0 || v[0] > 4 || v[1] < 0 || v[1] >= v[2] || v[2] > dur + 1e-9) { errs.push(path + ' must be [distance 0..4 m, start s, end s] with 0 <= start < end <= the clip time ' + dur + ' (got ' + JSON.stringify(v) + ')'); return [0, 0, 1]; } return v.slice(); };
function mkStatus(errs, path, st) { if (st == null) return null; const o = fields(errs, path, st, STATUS); return o; }

/** Check a kit. Returns { ok, errors[], warnings[], kit } — `kit` is a normalised COPY (radians, defaults filled, derived clip list) and is null when there are errors.
 *  opts.clips = the clip names of the sister's GLB: every clip the kit uses must exist there. */
export function validateKit(raw, opts = {}) {
  const errs = [], warn = [];
  if (!raw || typeof raw !== 'object') return { ok: false, errors: ['the kit must be an object (export default { ... })'], warnings: warn, kit: null };
  let src; try { src = JSON.parse(JSON.stringify(raw)); } catch (e) { return { ok: false, errors: ['the kit must be plain data (no functions, no cycles)'], warnings: warn, kit: null }; }
  const K = fields(errs, 'kit', src, KIT); const id = typeof K.id === 'string' ? K.id : '?';
  if (K.id && !SISTERS[K.id]) warn.push('kit.id "' + K.id + '" is not one of ' + Object.keys(SISTERS).join(', '));
  // weapons
  const W = []; if (!Array.isArray(K.weapons) || K.weapons.length > 2) errs.push('kit.weapons must be an array of 0..2 weapons'); else K.weapons.forEach((w, i) => { const p = 'kit.weapons[' + i + ']', o = fields(errs, p, w, WEAPON); if (o.url && !/^combat\/[\w.\-]+\.glb$/.test(o.url)) errs.push(p + '.url must look like "combat/<file>.glb"'); const g = w && w.grip; if (!g || !Array.isArray(g.b) || g.b.length !== 3 || !g.b.every(isNum) || !Array.isArray(g.pos) || g.pos.length !== 3 || !g.pos.every(isNum)) errs.push(p + '.grip must be { b: [x, y, z] (blade direction in the hand bone\'s frame), pos: [x, y, z] (metres) }'); else o.grip = { b: g.b.slice(), pos: g.pos.slice() }; W.push(o); });
  if (W.length && W[0].slot && W[1] && W[0].slot === W[1].slot) errs.push('kit.weapons: two weapons cannot share the slot ' + W[0].slot);
  if (K.trailWeapon > 0 && !W[K.trailWeapon]) errs.push('kit.trailWeapon points at a weapon that does not exist');
  // hero stats
  const Hh = fields(errs, 'kit.hero', K.hero, { hp: N(100, 5000, TUNE.hero.hp), stamina: N(50, 300, TUNE.hero.stamina), regen: N(5, 100, TUNE.hero.regen), armor: N(0, 2, TUNE.hero.armor), atk: N(0.5, 3, 1) });
  // block
  const Bk = fields(errs, 'kit.block', K.block, { clip: S(TUNE.block.clip), dur: N(0.2, 3, TUNE.block.dur), t0: N(0, 10, 0), arc: N(30, 360, TUNE.block.arc), dr: N(0, 1, TUNE.block.dr), cost: N(0, 2, TUNE.block.cost), raise: N(0, 0.5, TUNE.block.raise), turn: N(1, 30, TUNE.block.turn), walk: N(0, 3, TUNE.block.walk), push: N(0, 6, TUNE.block.push), stop: N(0, 0.2, TUNE.block.stop), breakSt: N(0, 100, TUNE.block.breakSt) });
  Bk.arc *= D2R;
  const IC = fields(errs, 'kit.icons', K.icons, { attack: E(ICONS, 'sword'), skill1: E(ICONS, 'flame'), skill2: E(ICONS, 'burst'), block: E(ICONS, 'shield') });
  // combo
  const C = [];
  if (!Array.isArray(K.combo) || K.combo.length < 1 || K.combo.length > 6) errs.push('kit.combo must be an array of 1..6 beats'); else K.combo.forEach((b0, i) => {
    const p = 'kit.combo[' + i + ']', b = fields(errs, p, b0, BEAT); if (b.cancel == null) b.cancel = Math.min(b.dur, Math.max(b.hit ? b.hit[1] : 0.2, b.dur * 0.7));
    if (b.hit && b.hit[1] > b.dur + 1e-9) errs.push(p + '.hit ends after the clip time dur (' + b.dur + ')');
    if (b.hit && b.cancel < b.hit[0] - 1e-9) errs.push(p + '.cancel (' + b.cancel + ') is before the hit window starts (' + b.hit[0] + ')');
    if (b.cancel > b.dur + 1e-9) errs.push(p + '.cancel is after the end of the beat (dur ' + b.dur + ')');
    b.lunge = mkLunge(errs, p + '.lunge', b.lunge, b.dur);
    if (b.trail != null) { if (!Array.isArray(b.trail) || !b.trail.every((w) => Array.isArray(w) && w.length === 2 && isNum(w[0]) && isNum(w[1]) && w[0] < w[1] && w[1] <= b.dur + 1e-9)) errs.push(p + '.trail must be a list of [from, to] windows inside the clip'); }
    if (b.hit2 != null) { if (!(Array.isArray(b.hit2) && b.hit2.length === 2 && isNum(b.hit2[0]) && isNum(b.hit2[1]) && b.hit2[0] < b.hit2[1] && b.hit2[1] <= b.dur + 1e-9 && (!b.hit || b.hit2[0] > b.hit[1]))) errs.push(p + '.hit2 must be [a, b] after the first window and inside the clip'); const sc = fields(errs, p + '.sec', b.sec || {}, { arc: N(10, 360, b.arc), reach: N(0.5, 8, b.reach), stop: N(0, 0.2, b.stop), knock: N(0, 6, b.knock), poise: N(0, 400, b.poise) }); b.sec = sc; sc.arc *= D2R; }
    else if (b.sec != null) errs.push(p + '.sec is only used together with hit2');
    if (b.type === 'shot') { if (!b.shot) errs.push(p + '.shot is required for type "shot"'); else { const s = fields(errs, p + '.shot', b.shot, { speed: N(1, 40), range: N(1, 40), radius: N(0.1, 4), pierce: B(false), vis: E(['bolt', 'crescent'], 'bolt'), count: N(1, 5, 1), spread: N(0, 90, 0) }); b.shot = { type: 'projectile', ...s, spread: s.spread * D2R, dmg: b.dmg, stop: b.stop, knock: b.knock, poise: b.poise, stagger: b.stagger, status: null }; } }
    else if (b.shot) errs.push(p + '.shot is only used by type "shot"');
    b.status = mkStatus(errs, p + '.status', b.status); if (b.shot) b.shot.status = b.status;
    b.arc *= D2R; b.finisher = b.finisher || i === K.combo.length - 1; C.push(b);
  });
  // skills
  const SK = [];
  if (!Array.isArray(K.skills) || K.skills.length !== 2) errs.push('kit.skills must be an array of exactly 2 skills (the two buttons)'); else K.skills.forEach((s0, i) => {
    const p = 'kit.skills[' + i + ']', s = fields(errs, p, s0, SKILL);
    if (s.at > s.dur + 1e-9) errs.push(p + '.at (' + s.at + ') is after the end of the skill (dur ' + s.dur + ')');
    s.lunge = mkLunge(errs, p + '.lunge', s.lunge, s.dur);
    const L = []; if (!Array.isArray(s.effects) || !s.effects.length || s.effects.length > 4) errs.push(p + '.effects must be an array of 1..4 effects'); else s.effects.forEach((f0, j) => {
      const q = p + '.effects[' + j + ']', ty = f0 && f0.type; if (!FX_SPEC[ty]) { errs.push(q + '.type must be one of ' + Object.keys(FX_SPEC).join(' | ') + ' (got ' + JSON.stringify(ty) + ')'); return; }
      const f = fields(errs, q, f0, FX_SPEC[ty]); if ('status' in f) f.status = mkStatus(errs, q + '.status', f.status);
      if (ty === 'projectile') f.spread *= D2R; if (ty === 'aoe') f.arc *= D2R;
      if ((ty === 'projectile' || ty === 'aoe') && f.dmg === 0 && !f.status && !f.knock) errs.push(q + ' does nothing: dmg 0, no status, no knock');
      L.push(f);
    }); s.effects = L; SK.push(s);
  });
  // clips: everything the kit plays, plus the ones every sister needs
  const used = new Set(['hit', 'knockdown', 'death', 'dodge', Bk.clip]); C.forEach((b) => used.add(b.clip)); SK.forEach((s) => used.add(s.clip)); (K.clips || []).forEach((c) => used.add(c));
  for (const c of used) { if (CLIPS_33.indexOf(c) < 0) errs.push('clip "' + c + '" is not one of the 33 clips every sister GLB carries (' + CLIPS_33.join(', ') + ')'); else if (opts.clips && opts.clips.indexOf(c) < 0) errs.push('clip "' + c + '" is missing from this hero GLB'); }
  if (opts.clipDur) { const chkd = (path, clip, t0, dur) => { const cd = opts.clipDur[clip]; if (cd != null && t0 + dur > cd + 0.02) errs.push(path + ': t0 + dur = ' + (t0 + dur).toFixed(2) + ' s runs past the end of the clip "' + clip + '" (' + cd.toFixed(2) + ' s)'); }; C.forEach((b, i) => chkd('kit.combo[' + i + ']', b.clip, b.t0, b.dur)); SK.forEach((s, i) => chkd('kit.skills[' + i + ']', s.clip, s.t0, s.dur)); chkd('kit.block', Bk.clip, Bk.t0, Bk.dur); }
  // sanity warnings (not errors): numbers that are legal but probably not meant
  C.forEach((b, i) => { const real = b.dur / b.rate; if (real > 1.4) warn.push('kit.combo[' + i + '] lasts ' + real.toFixed(2) + ' s of real time — slow for a combo beat'); if (b.dmg * (Hh.atk || 1) > 3.5) warn.push('kit.combo[' + i + '].dmg ' + b.dmg + ' is a skill-sized hit'); });
  if (errs.length) return { ok: false, errors: errs, warnings: warn, kit: null };
  const kit = { id, element: K.element, role: K.role, weapons: W, trail: K.trail, trailWeapon: K.trailWeapon, hero: Hh, block: Bk, autoTurn: K.autoTurn, icons: IC, clips: Array.from(used), combo: C, skills: SK, note: K.note, _ok: true };
  return { ok: true, errors: errs, warnings: warn, kit };
}
export function prepareKit(raw, opts) { if (raw && raw._ok) return raw; const r = validateKit(raw, opts); if (!r.ok) throw new Error('RP4 kit ' + (raw && raw.id) + ' is not valid:\n  ' + r.errors.join('\n  ')); return r.kit; }

// ------------------------------------------------------------------ small helpers (no allocation in the hot path)
const PI = Math.PI, TAU = PI * 2;
const wrap = (a) => { a = (a + PI) % TAU; if (a < 0) a += TAU; return a - PI; };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const turnTo = (cur, want, maxStep) => { const d = wrap(want - cur); return Math.abs(d) <= maxStep ? want : cur + Math.sign(d) * maxStep; };
const NOHIT = { stop: 0, knock: 0, poise: 0, stagger: false, status: null };

// ------------------------------------------------------------------ the simulation
//   createSim({ kit, seed, selfMove, collide, tune })  — `kit` = a kit object (raw or prepared; raw is validated here)
export function createSim(cfg = {}) {
  if (!cfg.kit) throw new Error('RP4 createSim: cfg.kit is required (import the sister\'s combat/kit_<id>.js and pass its default export)');
  const kit = prepareKit(cfg.kit), el = kit.element, NC = kit.combo.length, ct = cfg.tune || {};
  const T = { ...TUNE, ...ct }; T.hero = { ...TUNE.hero, hp: kit.hero.hp, stamina: kit.hero.stamina, regen: kit.hero.regen, armor: kit.hero.armor, ...(ct.hero || {}) }; T.dodge = { ...TUNE.dodge, ...(ct.dodge || {}) }; T.enemy = { ...TUNE.enemy, ...(ct.enemy || {}) }; T.status = { ...TUNE.status, ...(ct.status || {}) };
  const Bk = { ...kit.block, ...(ct.block || {}) }; if (ct.block && ct.block.arc) Bk.arc = ct.block.arc * D2R;
  const rnd = mulberry32(cfg.seed == null ? 1 : cfg.seed), selfMove = cfg.selfMove !== false, collide = cfg.collide || null, autoTurn = ct.autoTurn || kit.autoTurn;
  const H = {                                                          // the hero
    x: 0, z: 0, yaw: 0, vx: 0, vz: 0, hp: T.hero.hp, hpMax: T.hero.hp, st: T.hero.stamina, stMax: T.hero.stamina, stDelay: 0,
    state: 'loco', sT: 0, n: -1, kind: null, swing: 0, sw2: false, grace: 0, graceN: -1, dodgeCd: 0, invul: 0, armor: 0, freeze: 0, cd: [0, 0], cdMax: [kit.skills[0].cd, kit.skills[1].cd],
    skill: -1, fired: false, dirx: 0, dirz: 0, dodgeDx: 0, dodgeDz: 0, lastDodgeFrac: 0, lungeDone: 0, pdKey: 0,
    pose: { clip: '', t: 0 }, faceOverride: false, canMove: true, lockId: 0, lockYaw: 0, hasLock: false, element: el,
    buf: { attack: 0, dodge: 0, s0: 0, s1: 0 }, mvx: 0, mvz: 0, kills: 0,
    blockIn: false, guardBroken: false, sh: 0, shMax: 1, shT: 0, hotR: 0, hotT: 0, bf: { atk: { m: 1, t: 0 }, dr: { m: 1, t: 0 }, rate: { m: 1, t: 0 } },
  };
  const S = { t: 0, ticks: 0, acc: 0, enemies: [], events: [], nextId: 1, swingId: 0, waveId: 0, hash: 0, shakeAmp: 0 };
  const EVP = []; for (let i = 0; i < 160; i++) EVP.push({ type: '', t: 0, id: 0, src: '', x: 0, y: 0, z: 0, dmg: 0, mult: 1, elem: '', kind: '', hp: 0, a: 0, b: 0, c: 0, stop: 0, flag: false });
  let nEv = 0;
  const emit = (type) => { if (nEv >= EVP.length) return EVP[EVP.length - 1]; const e = EVP[nEv++]; e.type = type; e.t = S.t; e.id = 0; e.src = ''; e.x = e.y = e.z = 0; e.dmg = 0; e.mult = 1; e.elem = ''; e.kind = ''; e.hp = 0; e.a = e.b = e.c = 0; e.stop = 0; e.flag = false; S.events.push(e); return e; };
  const proj = []; for (let i = 0; i < 12; i++) proj.push({ on: false, uid: 0, x: 0, z: 0, dx: 0, dz: 0, t: 0, life: 0, sk: null, kn: '' });
  const isInvul = () => H.invul > 0 || (H.state === 'dodge' && H.sT >= T.dodge.i0 && H.sT <= T.dodge.i1);
  const guarding = () => H.state === 'block' && H.sT >= Bk.raise;
  const atkMul = () => kit.hero.atk * (H.bf.atk.t > 0 ? H.bf.atk.m : 1);
  let pend = { attack: false, dodge: false, s0: false, s1: false, lock: false, lockNext: false };

  // ---- enemies
  function spawn(kind, x, z, o = {}) {
    const K = KINDS[kind]; if (!K) throw new Error('kind ' + kind);
    let alive = 0; for (const e of S.enemies) if (e.state !== 'dead') alive++; if (alive >= T.enemy.max) return null;
    const e = { id: S.nextId++, kind, K, x, z, yaw: o.yaw || 0, hp: K.hp, hpMax: K.hp, poise: 0, state: 'idle', sT: 0, freeze: 0, lastHit: -1, lastWave: -1, kx: 0, kz: 0, lockYaw: 0, struck: false, pdone: false, wait: 0.15 + rnd() * 0.35, element: o.element !== undefined ? o.element : K.element, r: K.radius || T.enemy.radius, pose: { clip: 'idle', t: 0 }, flash: 0, orbit: rnd() < 0.5 ? 1 : -1, passive: !!o.passive,
      slowT: 0, slowK: 1, rootT: 0, fzT: 0, burnT: 0, burnDps: 0, burnAcc: 0, burnTk: 0 };
    S.enemies.push(e); const ev = emit('spawn'); ev.id = e.id; ev.kind = kind; ev.x = x; ev.z = z; return e;
  }
  const enemyById = (id) => { for (const e of S.enemies) if (e.id === id) return e; return null; };

  // ---- statuses on enemies
  function applyStatus(e, st) {
    if (!st || e.state === 'dead') return; const cc = e.K.cc == null ? 1 : e.K.cc, dur = st.id === 'burn' ? st.dur : st.dur * cc; if (dur < 0.1) return;
    if (st.id === 'slow') { e.slowT = Math.max(e.slowT, dur); e.slowK = e.slowT > 0 && e.slowK < 1 ? Math.min(e.slowK, st.k) : st.k; }
    else if (st.id === 'root') e.rootT = Math.max(e.rootT, dur);
    else if (st.id === 'freeze') { e.fzT = Math.max(e.fzT, dur); e.state = 'stagger'; e.sT = 0; e.poise = 0; }
    else if (st.id === 'burn') { e.burnT = Math.max(e.burnT, dur); e.burnDps = Math.max(e.burnDps, st.dps); }
    const ev = emit('status'); ev.id = e.id; ev.kind = st.id; ev.a = dur; ev.x = e.x; ev.z = e.z;
  }
  // ---- damage dealt to an enemy
  function hurtEnemy(e, base, mult0, kindName, atk, dirx, dirz, mark) {
    const mult = mult0 * elementMult(el, e.element), dmg = Math.round(base * atkMul() * mult * 10) / 10;
    e.hp -= dmg; e.flash = 0.12; if (mark) e.lastHit = H.swing;
    const ev = emit('hit'); ev.src = 'hero'; ev.id = e.id; ev.x = e.x; ev.y = 1.1; ev.z = e.z; ev.dmg = dmg; ev.mult = mult; ev.elem = el; ev.kind = kindName; ev.hp = Math.max(0, e.hp); ev.stop = atk.stop || 0; ev.a = dirx; ev.b = dirz; ev.flag = !!atk.stagger;
    H.freeze = Math.max(H.freeze, atk.stop || 0); e.freeze = Math.max(e.freeze, atk.stop || 0);
    const k = (atk.knock || 0) * 8; e.kx = dirx * k; e.kz = dirz * k;
    e.poise += atk.poise || 0;
    if (e.hp <= 0) { e.state = 'dead'; e.sT = 0; e.pose.clip = 'dead'; H.kills++; const k2 = emit('kill'); k2.id = e.id; k2.x = e.x; k2.z = e.z; k2.kind = e.kind; if (H.lockId === e.id) { H.lockId = 0; H.hasLock = false; } return; }
    if (atk.status) applyStatus(e, atk.status);
    if (e.fzT > 0) return;                                                 // (a frozen enemy is already staggered)
    if (e.poise >= e.K.poise || (atk.stagger && e.poise >= e.K.poise * 0.5)) { e.poise = 0; if (e.state !== 'stagger') { e.state = 'stagger'; e.sT = 0; const s = emit('stagger'); s.id = e.id; s.x = e.x; s.z = e.z; } else e.sT = 0; }
  }
  function softHit(e, fx, dirx, dirz) {                                   // an effect with dmg 0: knock-back + status only
    const k = (fx.knock || 0) * 8; e.kx = dirx * k; e.kz = dirz * k; if (fx.status) applyStatus(e, fx.status);
  }

  // ---- hero actions
  function faceDesired() {                                              // who should an attack turn to: lock target, else nearest within autoTurn, else the stick, else keep
    if (H.hasLock) { const e = enemyById(H.lockId); if (e && e.state !== 'dead') return Math.atan2(e.x - H.x, e.z - H.z); }
    let best = null, bd = autoTurn + 1e-6;
    for (const e of S.enemies) { if (e.state === 'dead') continue; const d = Math.hypot(e.x - H.x, e.z - H.z) - e.r; if (d < bd) { bd = d; best = e; } }
    if (best) return Math.atan2(best.x - H.x, best.z - H.z);
    if (Math.hypot(H.mvx, H.mvz) > 0.2) return Math.atan2(H.mvx, H.mvz);
    return H.yaw;
  }
  function startAttack(n) {
    const c = kit.combo[n]; H.state = 'atk'; H.n = n; H.sT = 0; H.swing = ++S.swingId; H.sw2 = false; H.fired = false; H.lungeDone = 0; H.faceOverride = true; H.canMove = false; H.buf.attack = 0; H.want = faceDesired(); H.grace = 0;
    const ev = emit('swing'); ev.a = n; ev.kind = c.finisher ? 'finisher' : 'light'; ev.x = H.x; ev.z = H.z;
  }
  function startSkill(i) {
    const s = kit.skills[i]; if (H.cd[i] > 0 || H.st < s.cost) return false;
    H.st -= s.cost; H.cd[i] = s.cd; H.state = 'skill'; H.skill = i; H.sT = 0; H.fired = false; H.swing = ++S.swingId; H.lungeDone = 0; H.faceOverride = true; H.canMove = false; H.want = faceDesired(); H.grace = 0;
    const ev = emit('skill'); ev.a = i; ev.kind = s.id; ev.x = H.x; ev.z = H.z; return true;
  }
  function startDodge() {
    if (H.dodgeCd > 0 || H.st < T.dodge.cost) return false;
    H.st -= T.dodge.cost; H.stDelay = T.hero.regenDelay; H.state = 'dodge'; H.sT = 0; H.lastDodgeFrac = 0; H.dodgeCd = T.dodge.recharge; H.faceOverride = true; H.canMove = false; H.buf.dodge = 0; H.grace = 0; H.lungeDone = 0; H.pdKey = 0;
    let dx = H.mvx, dz = H.mvz, m = Math.hypot(dx, dz), dist = T.dodge.dist;
    if (m > 0.1) { dx /= m; dz /= m; H.yaw = Math.atan2(dx, dz); } else { dx = -Math.sin(H.yaw); dz = -Math.cos(H.yaw); dist = T.dodge.back; }      // no stick: back-step, still facing the enemy
    H.dodgeDx = dx; H.dodgeDz = dz; H.dodgeDist = dist; H.dodgeFace = H.yaw; const ev = emit('dodge'); ev.x = H.x; ev.z = H.z; return true;
  }
  function startBlock() {
    H.state = 'block'; H.sT = 0; H.canMove = false; H.faceOverride = true; H.grace = 0; H.stDelay = Math.max(H.stDelay, T.hero.regenDelay); H.buf.attack = 0;
    const ev = emit('guard'); ev.flag = true; ev.x = H.x; ev.z = H.z;
  }
  function moveHero(dx, dz) {
    if (collide) { const r = collide(H.x + dx, H.z + dz, T.hero.radius); H.x = r[0]; H.z = r[1]; } else { H.x += dx; H.z += dz; }
    H.mvOutX += dx; H.mvOutZ += dz;
  }
  H.mvOutX = 0; H.mvOutZ = 0;
  function lungeMove(step) {                                            // a lunge never walks INTO an enemy: it stops at arm's length (contact = enemy radius + 0.8 x hero radius + 0.1 m)
    const sy = Math.sin(H.yaw), cy = Math.cos(H.yaw);
    for (const e of S.enemies) { if (e.state === 'dead') continue; const dx = e.x - H.x, dz = e.z - H.z, f = dx * sy + dz * cy; if (f <= 0) continue; const lat = Math.abs(dx * cy - dz * sy); if (lat > e.r + T.hero.radius) continue; step = Math.min(step, Math.max(0, f - (e.r + T.hero.radius * 0.8 + 0.1))); }
    if (step > 0) moveHero(sy * step, cy * step);
  }
  function heroHurt(e, dmg0, K) {
    const mult = elementMult(e.element, el);
    let dmg = Math.round(dmg0 * mult * (H.bf.dr.t > 0 ? H.bf.dr.m : 1) * 10) / 10, blocked = 0, cost = 0;
    if (guarding()) {                                                    // the guard: only inside its front arc
      const dx = e.x - H.x, dz = e.z - H.z, d = Math.hypot(dx, dz);
      if (d < 0.05 || Math.acos(clamp((dx * Math.sin(H.yaw) + dz * Math.cos(H.yaw)) / d, -1, 1)) <= Bk.arc / 2) {
        cost = dmg * Bk.cost;
        if (H.st >= cost) { H.st -= cost; dmg = Math.round(dmg * Bk.dr * 10) / 10; blocked = 1; }
        else { const f = cost > 0 ? H.st / cost : 0; dmg = Math.round(dmg * (Bk.dr * f + 1 - f) * 10) / 10; H.st = 0; blocked = 2; H.guardBroken = true; }
        H.stDelay = Math.max(H.stDelay, T.hero.regenDelay + 0.3);
      }
    }
    let absorbed = 0; if (H.sh > 0 && dmg > 0) { absorbed = Math.min(H.sh, dmg); H.sh -= absorbed; dmg = Math.round((dmg - absorbed) * 10) / 10; if (H.sh <= 0) { H.sh = 0; H.shT = 0; } }
    H.hp -= dmg;
    if (blocked) { const b = emit('block'); b.id = e.id; b.dmg = dmg; b.a = cost; b.flag = blocked === 2; b.x = H.x; b.y = 1.1; b.z = H.z; b.hp = Math.max(0, H.hp); b.mult = mult; b.b = absorbed; H.freeze = Math.max(H.freeze, blocked === 1 ? Bk.stop : T.hitstop.hurt); }
    if (blocked !== 1) {
      if (dmg > 0 || !absorbed) { const ev = emit('hero-hit'); ev.src = e.kind; ev.id = e.id; ev.dmg = dmg; ev.mult = mult; ev.x = H.x; ev.y = 1.1; ev.z = H.z; ev.hp = Math.max(0, H.hp); ev.stop = T.hitstop.hurt; ev.flag = dmg >= H.hpMax * T.hero.downAt; H.freeze = Math.max(H.freeze, T.hitstop.hurt); }
      else { const ev = emit('absorb'); ev.id = e.id; ev.dmg = absorbed; ev.x = H.x; ev.y = 1.1; ev.z = H.z; H.freeze = Math.max(H.freeze, 0.04); }
    }
    if (H.hp <= 0) { H.hp = 0; H.state = 'dead'; H.sT = 0; H.canMove = false; H.faceOverride = true; emit('dead'); return; }
    if (blocked === 1) { H.kbx = Math.sin(e.yaw) * Bk.push; H.kbz = Math.cos(e.yaw) * Bk.push; return; }           // a clean block: no stun, a small push
    if (dmg <= 0) return;                                                // the shield took all of it
    const big = dmg >= H.hpMax * T.hero.downAt, strong = H.armor > 0 && blocked !== 2;
    if (big) { H.state = 'down'; H.sT = 0; H.canMove = false; H.faceOverride = true; emit('knockdown'); const k = 6; H.kbx = Math.sin(e.yaw) * k; H.kbz = Math.cos(e.yaw) * k; }
    else if (!strong) { H.state = 'hit'; H.sT = 0; H.canMove = false; H.faceOverride = true; H.armor = T.hero.armor + T.hero.hitStun; H.kbx = Math.sin(e.yaw) * 3; H.kbz = Math.cos(e.yaw) * 3; }
    H.buf.attack = 0; H.buf.dodge = 0;
  }

  // ---- lock-on
  function lockCandidates(camYaw, any) {
    let best = null, bs = 1e9; const cy = camYaw == null ? H.yaw : camYaw;
    for (const e of S.enemies) {
      if (e.state === 'dead') continue; const dx = e.x - H.x, dz = e.z - H.z, d = Math.hypot(dx, dz); if (d > T.lock.range) continue;
      const a = Math.abs(wrap(Math.atan2(dx, dz) - cy)); if (a > T.lock.cone && !(any && d <= T.lock.reacquire)) continue;
      const sc = d * (1 + a * 0.6); if (sc < bs) { bs = sc; best = e; }
    }
    return best;
  }
  function lockNext(camYaw) {
    const cur = enemyById(H.lockId); if (!cur) return; const cy = camYaw == null ? H.yaw : camYaw;
    const a0 = Math.atan2(cur.x - H.x, cur.z - H.z); let best = null, bd = 1e9;
    for (const e of S.enemies) { if (e === cur || e.state === 'dead') continue; const dx = e.x - H.x, dz = e.z - H.z; const dd = Math.hypot(dx, dz); if (dd > T.lock.range || (Math.abs(wrap(Math.atan2(dx, dz) - cy)) > T.lock.cone && dd > T.lock.reacquire)) continue; let da = wrap(Math.atan2(dx, dz) - a0); if (da <= 1e-4) da += TAU; if (da < bd) { bd = da; best = e; } }
    if (best) { H.lockId = best.id; const ev = emit('lock'); ev.id = best.id; ev.flag = true; }
  }

  // ------------------------------------------------------------------ one fixed tick
  function tick(dt, inp) {
    S.t += dt; S.ticks++;
    const hs = T.hero, cs = T.comboSpeed * (H.bf.rate.t > 0 ? H.bf.rate.m : 1);
    // input memory (buffers), edges come from `pend`
    for (const k in H.buf) H.buf[k] = Math.max(0, H.buf[k] - dt);
    if (pend.attack) H.buf.attack = T.buffer.attack; if (pend.dodge) H.buf.dodge = T.buffer.dodge; if (pend.s0) H.buf.s0 = T.buffer.skill; if (pend.s1) H.buf.s1 = T.buffer.skill;
    H.mvx = inp.mx || 0; H.mvz = inp.mz || 0; const camYaw = inp.camYaw; H.blockIn = !!inp.block;
    if (pend.lock) { if (H.hasLock) { H.hasLock = false; H.lockId = 0; const ev = emit('lock'); ev.flag = false; } else { const c = lockCandidates(camYaw, true); if (c) { H.lockId = c.id; H.hasLock = true; const ev = emit('lock'); ev.id = c.id; ev.flag = true; } } }
    if (pend.lockNext && H.hasLock) lockNext(camYaw);
    pend.attack = pend.dodge = pend.s0 = pend.s1 = pend.lock = pend.lockNext = false;
    H.dodgeCd = Math.max(0, H.dodgeCd - dt); H.cd[0] = Math.max(0, H.cd[0] - dt); H.cd[1] = Math.max(0, H.cd[1] - dt); H.invul = Math.max(0, H.invul - dt); H.armor = Math.max(0, H.armor - dt);
    if (H.state !== 'dodge' && H.state !== 'block') { H.stDelay -= dt; if (H.stDelay <= 0 && H.st < H.stMax) H.st = Math.min(H.stMax, H.st + hs.regen * dt); }
    if (H.guardBroken && H.st >= Bk.breakSt) H.guardBroken = false;
    if (H.grace > 0) { H.grace -= dt; if (H.grace <= 0) H.graceN = -1; }
    for (const k in H.bf) if (H.bf[k].t > 0) H.bf[k].t -= dt;
    if (H.shT > 0) { H.shT -= dt; if (H.shT <= 0) H.sh = 0; }
    if (H.hotT > 0 && H.state !== 'dead') { H.hotT -= dt; H.hp = Math.min(H.hpMax, H.hp + H.hotR * dt); }

    // ---- hero state machine (the hero's own clock stops during hit-stop)
    const frozen = H.freeze > 0; if (frozen) H.freeze -= dt;
    if (H.state !== 'dead') {
      if (H.state === 'block' && !H.blockIn) { H.state = 'loco'; H.canMove = true; H.faceOverride = false; const ev = emit('guard'); ev.flag = false; }      // (released: first of all, whatever else is buffered)
      const st0 = H.state, loco = st0 === 'loco' || st0 === 'block', atk = st0 === 'atk', c = atk ? kit.combo[H.n] : null;
      const canAct = loco || (atk && H.sT >= c.cancel) || (st0 === 'skill' && H.sT >= kit.skills[H.skill].dur * 0.9);
      // priorities: dodge > skill > attack > block
      if (H.buf.dodge > 0 && (loco || (atk && H.sT >= c.cancel - 0.05) || (st0 === 'skill' && H.sT >= kit.skills[H.skill].at + 0.08))) { startDodge(); }                                       // (not enough stamina / still recharging: the press stays buffered until it expires)
      else if (H.buf.s0 > 0 && canAct && H.cd[0] <= 0) { H.buf.s0 = 0; startSkill(0); }
      else if (H.buf.s1 > 0 && canAct && H.cd[1] <= 0) { H.buf.s1 = 0; startSkill(1); }
      else if (H.buf.attack > 0) {
        if (loco) startAttack(H.grace > 0 && H.graceN >= 0 && H.graceN < NC - 1 ? H.graceN + 1 : 0);
        else if (atk && H.sT >= c.cancel) startAttack((H.n + 1) % NC);
        else if (st0 === 'skill' && canAct) startAttack(0);
      }
      else if (H.blockIn && st0 !== 'block' && canAct && !H.guardBroken && H.st > 0) startBlock();
      if (!frozen) {
        const rt = H.state === 'atk' ? cs * (kit.combo[H.n].rate || 1) : H.state === 'skill' ? cs * (kit.skills[H.skill].rate || 1) : 1; H.sT += rt * dt; const st = H.state;
        if (st === 'atk') {
          const c2 = kit.combo[H.n];
          if (H.sT < 0.14) H.yaw = turnTo(H.yaw, H.want, hs.turnRate * dt);
          // lunge: forward travel spread over the window
          const [ld, l0, l1] = c2.lunge; if (ld > 0 && H.sT >= l0 && H.lungeDone < ld) { const step = Math.min(ld - H.lungeDone, ld * (dt * rt) / (l1 - l0)); H.lungeDone += step; lungeMove(step); }
          if (c2.type === 'shot') { if (!H.fired && H.sT >= c2.hit[0]) { H.fired = true; fireProj(c2.shot, 'light'); } }
          else {
            if (H.sT >= c2.hit[0] && H.sT <= c2.hit[1]) heroStrike(c2, c2.dmg * T.ATK, c2.finisher ? 'finisher' : 'light');
            if (c2.hit2 && H.sT >= c2.hit2[0] && H.sT <= c2.hit2[1]) { if (!H.sw2) { H.sw2 = true; H.swing = ++S.swingId; } heroStrike(c2.sec, c2.dmg2 * T.ATK, 'light'); }
          }
          if (H.sT >= c2.dur) { H.state = 'loco'; H.canMove = true; H.faceOverride = false; H.grace = T.grace; H.graceN = H.n === NC - 1 ? -1 : H.n; }
        } else if (st === 'skill') {
          const s = kit.skills[H.skill]; if (H.sT < 0.14) H.yaw = turnTo(H.yaw, H.want, hs.turnRate * dt);
          { const [ld, l0, l1] = s.lunge; if (ld > 0 && H.sT >= l0 && H.lungeDone < ld) { const step = Math.min(ld - H.lungeDone, ld * (dt * rt) / (l1 - l0)); H.lungeDone += step; lungeMove(step); } }
          if (!H.fired && H.sT >= s.at) { H.fired = true; fireSkill(s); }
          if (H.sT >= s.dur) { H.state = 'loco'; H.canMove = true; H.faceOverride = false; H.grace = 0; }
        } else if (st === 'dodge') {
          const D = T.dodge, f = clamp(H.sT / D.dur, 0, 1), ease = 1 - (1 - f) * (1 - f), dd = (ease - H.lastDodgeFrac) * H.dodgeDist; H.lastDodgeFrac = ease;
          moveHero(H.dodgeDx * dd, H.dodgeDz * dd); H.yaw = H.dodgeFace;
          if (H.sT >= D.dur) { H.state = 'loco'; H.canMove = true; H.faceOverride = false; H.lastDodgeFrac = 0; }
        } else if (st === 'block') {
          const le = H.hasLock ? enemyById(H.lockId) : null, sm = Math.hypot(H.mvx, H.mvz); let want = H.yaw;
          if (le && le.state !== 'dead') want = Math.atan2(le.x - H.x, le.z - H.z);
          else if (sm > 0.2) want = Math.atan2(H.mvx, H.mvz);
          else { let best = null, bd = autoTurn + 3; for (const e of S.enemies) { if (e.state === 'dead') continue; const d = Math.hypot(e.x - H.x, e.z - H.z) - e.r; if (d < bd) { bd = d; best = e; } } if (best) want = Math.atan2(best.x - H.x, best.z - H.z); }
          H.yaw = turnTo(H.yaw, want, Bk.turn * dt);
          if (Bk.walk > 0 && sm > 0.2) { const m = Math.min(1, sm); moveHero((H.mvx / sm) * Bk.walk * m * dt, (H.mvz / sm) * Bk.walk * m * dt); }
          const k = Math.exp(-10 * dt); H.kbx *= k; H.kbz *= k; if (Math.abs(H.kbx) + Math.abs(H.kbz) > 0.02) moveHero(H.kbx * dt, H.kbz * dt);
        } else if (st === 'hit') {
          const k = Math.exp(-10 * dt); H.kbx *= k; H.kbz *= k; moveHero(H.kbx * dt, H.kbz * dt);
          if (H.sT >= hs.hitStun) { H.state = 'loco'; H.canMove = true; H.faceOverride = false; }
        } else if (st === 'down') {
          const k = Math.exp(-6 * dt); H.kbx *= k; H.kbz *= k; moveHero(H.kbx * dt, H.kbz * dt);
          if (H.sT >= hs.down) { H.state = 'loco'; H.canMove = true; H.faceOverride = false; H.invul = hs.wakeInvul; }
        } else if (st === 'loco') {
          if (selfMove) {
            const m = Math.min(1, Math.hypot(H.mvx, H.mvz)), tvx = m > 0.1 ? (H.mvx / Math.hypot(H.mvx, H.mvz)) * hs.run * m : 0, tvz = m > 0.1 ? (H.mvz / Math.hypot(H.mvx, H.mvz)) * hs.run * m : 0, a = hs.accel * dt;
            H.vx += clamp(tvx - H.vx, -a, a); H.vz += clamp(tvz - H.vz, -a, a); moveHero(H.vx * dt, H.vz * dt);
            const le = H.hasLock ? enemyById(H.lockId) : null;
            if (le) H.yaw = turnTo(H.yaw, Math.atan2(le.x - H.x, le.z - H.z), 12 * dt); else if (Math.hypot(H.vx, H.vz) > 0.3) H.yaw = turnTo(H.yaw, Math.atan2(H.vx, H.vz), 13 * dt);
          } else H.vx = H.vz = 0;
        }
      }
    }
    else H.sT += dt;
    // ---- enemies
    const ep = T.enemy; let attackers = 0; for (const e of S.enemies) if (e.state === 'windup' || e.state === 'attack') attackers++;
    for (const e of S.enemies) enemyTick(e, dt, ep, attackers);
    // separation (hero vs enemies, enemies vs enemies) — simple circle push, no allocation
    for (let i = 0; i < S.enemies.length; i++) {
      const a = S.enemies[i]; if (a.state === 'dead') continue;
      const dx = a.x - H.x, dz = a.z - H.z, d = Math.hypot(dx, dz) || 1e-4, min = a.r + hs.radius * 0.8; if (d < min) { const p = (min - d); a.x += (dx / d) * p; a.z += (dz / d) * p; }
      for (let j = i + 1; j < S.enemies.length; j++) { const b = S.enemies[j]; if (b.state === 'dead') continue; const ex = b.x - a.x, ez = b.z - a.z, dd = Math.hypot(ex, ez) || 1e-4, m2 = a.r + b.r; if (dd < m2) { const p = (m2 - dd) * 0.5; a.x -= (ex / dd) * p; a.z -= (ez / dd) * p; b.x += (ex / dd) * p; b.z += (ez / dd) * p; } }
    }
    // ---- projectiles
    for (const p of proj) {
      if (!p.on) continue; const s = p.sk; p.t += dt; p.x += p.dx * s.speed * dt; p.z += p.dz * s.speed * dt;
      for (const e of S.enemies) {
        if (e.state === 'dead' || e.lastWave === p.uid) continue;
        if (Math.hypot(e.x - p.x, e.z - p.z) <= s.radius + e.r) { e.lastWave = p.uid; if (s.dmg > 0) hurtEnemy(e, s.dmg * T.ATK, 1, p.kn, s, p.dx, p.dz); else softHit(e, s, p.dx, p.dz); if (!s.pierce) { p.on = false; break; } }
      }
      if (p.on && p.t >= s.range / s.speed) p.on = false;
    }
    // ---- lock maintenance, pose, cleanup
    if (H.hasLock) { const e = enemyById(H.lockId); if (!e || e.state === 'dead' || Math.hypot(e.x - H.x, e.z - H.z) > T.lock.drop) { H.hasLock = false; H.lockId = 0; const c = lockCandidates(camYaw, true); if (c && Math.hypot(c.x - H.x, c.z - H.z) <= T.lock.reacquire) { H.lockId = c.id; H.hasLock = true; const ev = emit('lock'); ev.id = c.id; ev.flag = true; } else { const ev = emit('lock'); ev.flag = false; } } else H.lockYaw = Math.atan2(e.x - H.x, e.z - H.z); }
    setPose();
    for (let i = S.enemies.length - 1; i >= 0; i--) { const e = S.enemies[i]; if (e.state === 'dead' && e.sT > ep.deadT) S.enemies.splice(i, 1); }
    // determinism hash (cheap, integer-ish)
    S.hash = (Math.imul(S.hash ^ Math.round(H.x * 1000) ^ (Math.round(H.z * 1000) << 3) ^ (Math.round(H.hp * 10) << 5), 16777619) ^ S.enemies.length) | 0;
    for (const e of S.enemies) S.hash = (Math.imul(S.hash ^ Math.round(e.x * 1000) ^ (Math.round(e.hp * 10) << 7), 16777619)) | 0;
  }

  function heroStrike(c, base, kindName) {                              // arc test of the current swing against every enemy (each enemy once per swing)
    const sy = Math.sin(H.yaw), cy = Math.cos(H.yaw);
    for (const e of S.enemies) {
      if (e.state === 'dead' || e.lastHit === H.swing) continue; const dx = e.x - H.x, dz = e.z - H.z, d = Math.hypot(dx, dz); if (d - e.r > c.reach) continue;
      if (d > 0.5) { const dot = (dx * sy + dz * cy) / d; if (Math.acos(clamp(dot, -1, 1)) > c.arc / 2 + Math.atan2(e.r, d)) continue; }
      hurtEnemy(e, base, 1, kindName, c, d > 1e-4 ? dx / d : sy, d > 1e-4 ? dz / d : cy, true);
    }
  }
  // ---- skill effects (data driven: kit.skills[i].effects)
  function fireProj(fx, kn) {
    for (let k = 0; k < fx.count; k++) {
      const a = H.yaw + (k - (fx.count - 1) / 2) * fx.spread;
      for (const p of proj) if (!p.on) { p.on = true; p.uid = ++S.waveId; p.sk = fx; p.kn = kn; p.dx = Math.sin(a); p.dz = Math.cos(a); p.x = H.x + p.dx * 0.9; p.z = H.z + p.dz * 0.9; p.t = 0; const ev = emit('proj'); ev.x = p.x; ev.z = p.z; ev.a = p.dx; ev.b = p.dz; ev.id = p.uid; ev.kind = fx.vis; break; }
    }
  }
  function fireAoe(fx) {
    const dirx = Math.sin(H.yaw), dirz = Math.cos(H.yaw), cx = H.x + dirx * fx.offset, cz = H.z + dirz * fx.offset, cone = fx.shape === 'cone';
    const ev = emit('burst'); ev.x = cx; ev.z = cz; ev.a = fx.radius; ev.b = cone ? fx.arc : TAU; ev.c = H.yaw;
    for (const e of S.enemies) {
      if (e.state === 'dead') continue; const dx = e.x - cx, dz = e.z - cz, d = Math.hypot(dx, dz); if (d - e.r > fx.radius) continue;
      if (cone && d > 0.4 && Math.acos(clamp((dx * dirx + dz * dirz) / d, -1, 1)) > fx.arc / 2 + Math.atan2(e.r, d)) continue;
      const ux = d > 1e-4 ? dx / d : 0, uz = d > 1e-4 ? dz / d : 1;
      if (fx.dmg > 0) hurtEnemy(e, fx.dmg * T.ATK, 1, 'burst', fx, ux, uz); else softHit(e, fx, ux, uz);
    }
  }
  function fireSkill(s) {
    for (const f of s.effects) {
      switch (f.type) {
        case 'projectile': fireProj(f, 'proj'); break;
        case 'aoe': fireAoe(f); break;
        case 'heal': { const amt = f.amount * H.hpMax; if (f.dur > 0) { H.hotR = amt / f.dur; H.hotT = f.dur; } else H.hp = Math.min(H.hpMax, H.hp + amt); const ev = emit('heal'); ev.a = amt; ev.b = f.dur; ev.x = H.x; ev.z = H.z; break; }
        case 'shield': { H.sh = f.absorb * H.hpMax; H.shMax = H.sh; H.shT = f.dur; const ev = emit('shield'); ev.a = H.sh; ev.b = f.dur; ev.x = H.x; ev.z = H.z; break; }
        case 'buff': { const b = H.bf[f.stat]; b.m = f.mult; b.t = f.dur; const ev = emit('buff'); ev.kind = f.stat; ev.a = f.mult; ev.b = f.dur; ev.x = H.x; ev.z = H.z; break; }
        case 'stamina': { H.st = Math.min(H.stMax, H.st + f.amount); const ev = emit('stamina'); ev.a = f.amount; ev.x = H.x; ev.z = H.z; break; }
        default: break;
      }
    }
  }

  function enemyTick(e, dt, ep, attackers) {
    const K = e.K; e.flash = Math.max(0, e.flash - dt);
    if (e.freeze > 0) { e.freeze -= dt; return; }                            // hit-stop: the victim's own clock stands still
    e.sT += dt;
    // knock-back velocity (decays)
    if (e.kx || e.kz) { e.x += e.kx * dt; e.z += e.kz * dt; const k = Math.exp(-8 * dt); e.kx *= k; e.kz *= k; if (Math.abs(e.kx) + Math.abs(e.kz) < 0.05) e.kx = e.kz = 0; }
    if (e.state === 'dead') return;
    // statuses
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowK = 1; }
    if (e.rootT > 0) e.rootT -= dt;
    if (e.burnT > 0) {
      e.burnT -= dt; e.burnAcc += e.burnDps * T.ATK * dt; e.burnTk += dt;
      if (e.burnTk >= T.status.burnTick || e.burnT <= 0) { const d = e.burnAcc; e.burnAcc = 0; e.burnTk = 0; if (d > 0.5) { hurtEnemy(e, d, 1, 'burn', NOHIT, 0, 0); if (e.state === 'dead') return; } }
      if (e.burnT <= 0) e.burnDps = 0;
    }
    if (e.fzT > 0) { e.fzT -= dt; e.pose.clip = 'stagger'; e.pose.t = Math.min(e.sT, 0.25); if (e.fzT <= 0) { e.state = 'chase'; e.sT = 0; } return; }                 // frozen: no AI, the stagger pose held
    e.poise = Math.max(0, e.poise - ep.poiseDecay * dt);
    const dx = H.x - e.x, dz = H.z - e.z, d = Math.hypot(dx, dz) || 1e-4, face = Math.atan2(dx, dz);
    switch (e.state) {
      case 'idle': e.pose.clip = 'idle'; e.pose.t = e.sT; if (!e.passive && H.state !== 'dead' && d <= ep.aggro) { e.wait -= dt; if (e.wait <= 0) { e.state = 'chase'; e.sT = 0; } } break;
      case 'chase': {
        e.pose.clip = 'move'; e.pose.t = e.sT; e.yaw = turnTo(e.yaw, face, 9 * dt);
        if (H.state === 'dead') { e.state = 'idle'; e.sT = 0; break; }
        if (d > ep.aggro * 1.6) { e.state = 'idle'; e.sT = 0; break; }
        const inRange = d - e.r - T.hero.radius <= K.reach * 0.85;
        if (inRange && attackers < ep.attackers) { e.state = 'windup'; e.sT = 0; e.pdone = false; e.struck = false; e.lockYaw = e.yaw; const ev = emit('windup'); ev.id = e.id; ev.a = K.tele; ev.x = e.x; ev.z = e.z; ev.b = K.reach; ev.kind = e.kind; break; }
        if (e.rootT > 0) break;
        if (inRange) { const sx = -Math.cos(e.yaw) * e.orbit, sz = Math.sin(e.yaw) * e.orbit; e.x += sx * 1.3 * e.slowK * dt; e.z += sz * 1.3 * e.slowK * dt; }       // waits for an attack slot: circles slowly
        else { e.x += Math.sin(e.yaw) * K.speed * e.slowK * dt; e.z += Math.cos(e.yaw) * K.speed * e.slowK * dt; }
        break;
      }
      case 'windup':
        e.pose.clip = 'windup'; e.pose.t = e.sT;
        if (e.sT < K.tele * 0.5) e.yaw = turnTo(e.yaw, face, 10 * dt); else e.lockYaw = e.yaw;            // the strike direction freezes at half the telegraph
        if (e.sT >= K.tele) { e.state = 'attack'; e.sT = 0; }
        break;
      case 'attack': {
        e.pose.clip = 'attack'; e.pose.t = e.sT; if (e.sT < dt * 1.5) { e.x += Math.sin(e.yaw) * ep.lunge * 0.5; e.z += Math.cos(e.yaw) * ep.lunge * 0.5; }
        if (!e.struck && H.state !== 'dead') {
          const sy = Math.sin(e.yaw), cy = Math.cos(e.yaw), cd = Math.hypot(H.x - e.x, H.z - e.z);
          const inArc = cd - T.hero.radius <= K.reach && (cd < 0.4 || Math.acos(clamp(((H.x - e.x) * sy + (H.z - e.z) * cy) / cd, -1, 1)) <= K.arc / 2 + 0.2);
          if (inArc && !isInvul()) { e.struck = true; heroHurt(e, K.dmg, K); }
          else if (isInvul() && H.state === 'dodge' && !e.pdone && cd - T.hero.radius <= K.reach + T.dodge.margin && (cd < 0.4 || Math.acos(clamp(((H.x - e.x) * sy + (H.z - e.z) * cy) / cd, -1, 1)) <= K.arc / 2 + 0.6)) {
            e.pdone = true; H.st = Math.min(H.stMax, H.st + T.dodge.refund); const ev = emit('dodge-perfect'); ev.id = e.id; ev.x = H.x; ev.z = H.z;           // the strike landed inside the i-frames and would have connected (near miss)
          }
        }
        if (e.sT >= ep.active) { e.state = 'recover'; e.sT = 0; }
        break;
      }
      case 'recover': e.pose.clip = 'recover'; e.pose.t = e.sT; if (e.sT >= ep.recover) { e.state = 'chase'; e.sT = 0; } break;
      case 'stagger': e.pose.clip = 'stagger'; e.pose.t = e.sT; if (e.sT >= ep.stagger) { e.state = 'chase'; e.sT = 0; } break;
    }
  }

  function setPose() {
    const P = H.pose, S2 = H.state;
    if (S2 === 'atk') { const c = kit.combo[H.n]; P.clip = c.clip; P.t = c.t0 + H.sT; }
    else if (S2 === 'skill') { const s = kit.skills[H.skill]; P.clip = s.clip; P.t = s.t0 + H.sT; }
    else if (S2 === 'dodge') { P.clip = 'dodge'; P.t = H.sT * (T.dodge.clipLen / T.dodge.dur); }
    else if (S2 === 'block') { P.clip = Bk.clip; P.t = Bk.t0 + (H.sT % Bk.dur); }
    else if (S2 === 'hit') { P.clip = 'hit'; P.t = Math.min(H.sT * 1.2, 0.45); }
    else if (S2 === 'down') { P.clip = 'knockdown'; P.t = Math.min(H.sT * 1.65, 1.8); }
    else if (S2 === 'dead') { P.clip = 'death'; P.t = Math.min(H.sT, 4.0); }
    else { P.clip = ''; P.t = 0; }
  }

  // ------------------------------------------------------------------ public
  const sim = {
    S, hero: H, tune: T, kit, element: el, enemies: S.enemies, events: S.events, projectiles: proj, block: Bk,
    spawn, enemyById, invulnerable: isInvul, guarding,
    /** advance by dt seconds of real time (any size); input is read once per call, edges (attack, skill1, skill2, dodge, lock, lockNext) are consumed by the first sub-step; `block` is a held level */
    update(dt, inp) {
      S.events.length = 0; nEv = 0; inp = inp || {};
      if (inp.attack) pend.attack = true; if (inp.dodge) pend.dodge = true; if (inp.skill1) pend.s0 = true; if (inp.skill2) pend.s1 = true; if (inp.lock) pend.lock = true; if (inp.lockNext) pend.lockNext = true;
      S.acc += Math.min(dt, 0.25); let n = 0;
      while (S.acc >= T.step - 1e-9 && n < 15) { tick(T.step, inp); S.acc -= T.step; n++; }
      return n;
    },
    /** host-driven mode: the host moved the hero (its own physics / collision) — tell the sim where she is now */
    syncHero(x, z, yaw) { H.x = x; H.z = z; if (yaw != null && !H.faceOverride) H.yaw = yaw; },
    /** displacement the sim wants the host to apply since the last call (lunge / dodge / knock-back); resets */
    takeMove(out) { out = out || { x: 0, z: 0 }; out.x = H.mvOutX; out.z = H.mvOutZ; H.mvOutX = 0; H.mvOutZ = 0; return out; },
    lockYaw() { return H.hasLock ? H.lockYaw : null; },
    lockTarget() { return H.hasLock ? enemyById(H.lockId) : null; },
    aliveEnemies() { let n = 0; for (const e of S.enemies) if (e.state !== 'dead') n++; return n; },
    reset() { S.enemies.length = 0; S.events.length = 0; nEv = 0; for (const p of proj) p.on = false; H.hp = H.hpMax; H.st = H.stMax; H.state = 'loco'; H.sT = 0; H.canMove = true; H.faceOverride = false; H.cd[0] = H.cd[1] = 0; H.dodgeCd = 0; H.invul = 0; H.armor = 0; H.freeze = 0; H.hasLock = false; H.lockId = 0; H.n = -1; H.grace = 0; H.graceN = -1; H.kills = 0; H.guardBroken = false; H.sh = 0; H.shT = 0; H.hotT = 0; for (const k in H.bf) { H.bf[k].t = 0; H.bf[k].m = 1; } },
    revive() { H.hp = H.hpMax; H.state = 'loco'; H.sT = 0; H.canMove = true; H.faceOverride = false; H.invul = 1.0; H.guardBroken = false; H.sh = 0; H.shT = 0; H.hotT = 0; },
  };
  H.kbx = 0; H.kbz = 0; H.want = 0; H.dodgeDist = 0; H.dodgeFace = 0;
  return sim;
}

// ------------------------------------------------------------------ host entry (rpg.js hero mode).  Lazy: nothing above is loaded until the first attack.
//   attach(under, hero, opts) -> controller { sim, pre(dt, S, wantX, wantZ, m), post(dt), frame(dt, now), press(name), key(code), setQuality(step), spawnTest(n), setEnabled(b), stats(), dispose() }
//     under : the underworld/arena contract { scene, hgt(x,z), colliders, clampXZ, BOUND } (or the home scene wrapper)   hero : the host's hero entry { grp, model, mixer, acts, clips }
//     opts  : { THREE, camera, root, base (asset url base), v (cache suffix), parseGLB, hostMove(dx,dz), hgt, pixelRatio, btns, spawn, sister ('elina' - the host passes S.key), kit (a kit object instead of combat/kit_<sister>.js), dev }.  A missing kit_<sister>.js (404) falls back to Elina's kit (ctl.kitFallback = true); an invalid kit throws with the field paths
export async function attach(under, hero, opts) {
  const base = new URL('.', import.meta.url).href, v = (new URL(import.meta.url).search) || (opts.v || ''), id = opts.sister || 'elina';
  let fallback = false;
  const loadKit = async () => {                                                      // the sister's own kit file; only if that file does not exist yet (404) the interim is Elina's kit (a syntax / contract error is never hidden)
    if (opts.kit) return { default: opts.kit };
    try { return await import(/* @vite-ignore */ base + kitFile(id) + v); } catch (e) {
      if (id !== 'elina') { let st = 0; try { st = (await fetch(base + kitFile(id) + v, { method: 'HEAD' })).status; } catch (e2) { st = 0; } if (st === 404) { fallback = true; console.warn('RP4: ' + kitFile(id) + ' is not there yet: using the elina kit'); return import(/* @vite-ignore */ base + kitFile('elina') + v); } }
      throw e;
    }
  };
  const [fx, hud, foes, km] = await Promise.all([import(/* @vite-ignore */ base + 'combat/fx.js' + v), import(/* @vite-ignore */ base + 'combat/hud.js' + v), import(/* @vite-ignore */ base + 'combat/foes.js' + v), loadKit()]);
  const kit = prepareKit(km.default, { clips: hero && hero.clips ? hero.clips.map((c) => c.name) : null });
  const ctl = await fx.build({ createSim, kit, hud, foes, under, hero, opts, ELEMENTS, TUNE, KINDS, VERSION, elementMult, base, v });
  ctl.kitId = kit.id; ctl.kitFallback = fallback; return ctl;
}
