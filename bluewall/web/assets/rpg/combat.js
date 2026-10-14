// RP4 — combat core.  PURE simulation (no THREE, no DOM, no Date/Math.random): fixed-step 1/60, deterministic with a seed, testable in Node (dev/rp4_test.sh).
//   data tables  : TUNE (every number), ELEMENTS / BEATS / HARMONY, SISTERS (Elina complete, five stubs for RP5a-f), KINDS (placeholder enemy kinds)
//   createSim()  : hero + enemy state machines, hit arcs, i-frames, stagger/knock-back, element multiplier, lock-on, flame-wave projectiles, event list for FX / HUD / audio
//   attach()     : the ONLY entry the host (rpg.js hero mode) calls — lazy-loads ./combat/{fx,hud,foes}.js (nothing of this is in the boot bundle).
// Units: metres, seconds, radians.  yaw 0 = +Z, yaw = atan2(x, z).  The host keeps its own camera; the sim only exposes lockYaw().
export const VERSION = 'RP4-R1';

// ------------------------------------------------------------------ data
export const ELEMENTS = {
  fire:  { color: '#ff6a3a', trail: ['#ff8a3a', '#ffd27a'], beats: 'ice' },
  ice:   { color: '#cfeeff', trail: ['#9fd8ff', '#ffffff'], beats: 'water' },
  water: { color: '#4fb0ff', trail: ['#3a8cff', '#aee0ff'], beats: 'fire' },
  plant: { color: '#7fe06a', trail: ['#5cc84a', '#d6ff9a'], beats: 'stone' },
  stone: { color: '#f0a666', trail: ['#c98a52', '#ffd9a8'], beats: 'wind' },
  wind:  { color: '#9fe8ff', trail: ['#7fd8f0', '#eafcff'], beats: 'plant' },
};
export const BEATS = { fire: 'ice', ice: 'water', water: 'fire', plant: 'stone', stone: 'wind', wind: 'plant' };   // A beats B  (direction from the RTL chain in the book; the mother confirms)
export const HARMONY = [];                                           // the book's 7 pairs: stub, RP5 fills ([ 'fire','wind', 'name' ] ...)
export const TUNE = {
  step: 1 / 60,
  ATK: 100, comboSpeed: 1.0,
  hero: { hp: 600, stamina: 100, regen: 30, regenDelay: 0.6, run: 4.4, accel: 16, radius: 0.45, hitStun: 0.38, armor: 0.5, downAt: 0.25, down: 1.1, wakeInvul: 0.5, turnRate: 18 },
  buffer: { attack: 0.30, dodge: 0.30, skill: 0.30 }, grace: 0.30,
  dodge: { dur: 0.62, i0: 0.04, i1: 0.34, dist: 4.4, back: 3.2, cost: 25, recharge: 0.8, refund: 25, clipLen: 1.7, margin: 1.2 },
  autoTurn: 3.0,
  lock: { range: 18, cone: 65 * Math.PI / 180, drop: 24, reacquire: 8 },
  hitstop: { hurt: 0.07 },
  shake: 1.0,
  frame: { right: 0.8, shift: 0.4, up: 0.3, back: 0.6 },   // fight camera, nudged from the HOST's behind-the-hero camera (eased in 0.4 s / out 0.9 s; dropped where a pillar / the wall is in the way): up + back (m), and sideways only as far as needed to put her 40 % of the half-width left of the centre (max `right` m)
  enemy: { aggro: 14, active: 0.15, recover: 0.8, stagger: 0.7, deadT: 1.2, radius: 0.55, max: 6, attackers: 2, poiseDecay: 25, lunge: 0.6 },
};
// one sister's kit.  combo[i]: clip, dur (clip seconds), hit window [a,b], dmg (x ATK), arc (deg), reach (m), lunge (m, over lunge window), cancel (s: can chain / dodge from here), stop (hit-stop s), knock (m), poise, stagger
const D2R = Math.PI / 180;
export const SISTERS = {
  elina:  { element: 'fire', role: 'melee striker', weapon: 'sword',
    // clips are the hero GLB's own (RP0B, 14 Oct 2026): slash_a 0.43 s, slash_b 0.53 s, slash_c 0.70 s, heavy 0.93 s, block 0.84 s (loop) + hit / knockdown / death / cast / dodge.  Windows are clip seconds, measured on the real clips (sword-tip speed per frame, work/rp4/clipinfo3.py)
    clips: ['slash_a', 'slash_b', 'slash_c', 'heavy', 'block', 'hit', 'knockdown', 'death', 'cast', 'dodge'],
    combo: [
      { clip: 'slash_a', dur: 0.43, hit: [0.19, 0.29], dmg: 0.8, arc: 110 * D2R, reach: 2.1, lunge: [0.8, 0.08, 0.22], cancel: 0.30, stop: 0.055, knock: 0.3, poise: 22 },
      { clip: 'slash_b', dur: 0.53, hit: [0.20, 0.32], dmg: 0.9, arc: 110 * D2R, reach: 2.2, lunge: [0.9, 0.06, 0.24], cancel: 0.34, stop: 0.055, knock: 0.3, poise: 22 },
      { clip: 'slash_c', dur: 0.70, rate: 1.2, hit: [0.29, 0.43], dmg: 1.0, arc: 120 * D2R, reach: 2.3, lunge: [0.7, 0.24, 0.40], cancel: 0.49, stop: 0.065, knock: 0.5, poise: 28 },
      { clip: 'heavy', dur: 0.93, hit: [0.26, 0.38], dmg: 1.8, arc: 140 * D2R, reach: 2.6, lunge: [1.2, 0.20, 0.34], cancel: 0.56, stop: 0.09, knock: 1.6, poise: 100, stagger: true,
        trail: [[0.2, 0.44], [0.52, 0.78]], hit2: [0.58, 0.69], dmg2: 0.7, sec: { arc: 120 * D2R, reach: 2.3, stop: 0.055, knock: 0.3, poise: 22 } },     // (heavy: the clip's rising second sweep hits again, lighter)
    ],
    skills: [
      { id: 'wave', name: 'Flame Wave', cd: 6, clip: 'slash_b', dur: 0.53, at: 0.22, dmg: 2.2, speed: 15, range: 12, radius: 1.1, stop: 0.07, knock: 1.0, poise: 50, lunge: [0.5, 0.04, 0.2] },
      { id: 'burst', name: 'Ember Burst', cd: 14, clip: 'cast', rate: 1.2, dur: 0.9, at: 0.55, dmg: 3.0, radius: 5.0, stop: 0.11, knock: 3.0, poise: 200, stagger: true },
    ] },
  elika:  { element: 'wind',  role: 'fast scout',        weapon: 'two daggers + sling', combo: null, skills: null },
  melika: { element: 'plant', role: 'ranged healer',     weapon: 'living bow + dagger', combo: null, skills: null },
  mobina: { element: 'stone', role: 'tank',              weapon: 'hammer + stone gauntlet', combo: null, skills: null },
  aylin:  { element: 'water', role: 'support healer',    weapon: 'staff',               combo: null, skills: null },
  aylar:  { element: 'ice',   role: 'controller',        weapon: 'spear + ice beads',   combo: null, skills: null },
};
// placeholder enemy kinds (test only; the real enemies are RP6 and come from an owner-picked sheet)
export const KINDS = {
  soldier: { hp: 240, speed: 3.3, reach: 1.9, arc: 80 * D2R, tele: 0.6, dmg: 70,  poise: 60,  element: 'ice',   radius: 0.5 },
  beast:   { hp: 320, speed: 4.8, reach: 1.9, arc: 90 * D2R, tele: 0.5, dmg: 90,  poise: 60,  element: 'water', radius: 0.6 },
  brute:   { hp: 650, speed: 2.2, reach: 2.7, arc: 100 * D2R, tele: 0.9, dmg: 160, poise: 200, element: null,    radius: 0.8 },
};
export function elementMult(att, def) { if (!att || !def) return 1; if (BEATS[att] === def) return 1.5; if (BEATS[def] === att) return 0.75; return 1; }

// ------------------------------------------------------------------ small helpers (no allocation in the hot path)
const PI = Math.PI, TAU = PI * 2;
const wrap = (a) => { a = (a + PI) % TAU; if (a < 0) a += TAU; return a - PI; };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const turnTo = (cur, want, maxStep) => { const d = wrap(want - cur); return Math.abs(d) <= maxStep ? want : cur + Math.sign(d) * maxStep; };

// ------------------------------------------------------------------ the simulation
export function createSim(cfg = {}) {
  const T = { ...TUNE, ...(cfg.tune || {}) }; T.hero = { ...TUNE.hero, ...(cfg.tune && cfg.tune.hero) }; T.dodge = { ...TUNE.dodge, ...(cfg.tune && cfg.tune.dodge) }; T.enemy = { ...TUNE.enemy, ...(cfg.tune && cfg.tune.enemy) };
  const rnd = mulberry32(cfg.seed == null ? 1 : cfg.seed), selfMove = cfg.selfMove !== false, collide = cfg.collide || null;
  const sis = SISTERS[cfg.sister || 'elina'], el = sis.element, kit = sis;
  const H = {                                                          // the hero
    x: 0, z: 0, yaw: 0, vx: 0, vz: 0, hp: T.hero.hp, hpMax: T.hero.hp, st: T.hero.stamina, stMax: T.hero.stamina, stDelay: 0,
    state: 'loco', sT: 0, n: -1, kind: null, swing: 0, sw2: false, grace: 0, graceN: -1, dodgeCd: 0, invul: 0, armor: 0, freeze: 0, cd: [0, 0], cdMax: [kit.skills ? kit.skills[0].cd : 1, kit.skills ? kit.skills[1].cd : 1],
    skill: -1, fired: false, dirx: 0, dirz: 0, dodgeDx: 0, dodgeDz: 0, lastDodgeFrac: 0, lungeDone: 0, pdKey: 0,
    pose: { clip: '', t: 0 }, faceOverride: false, canMove: true, lockId: 0, lockYaw: 0, hasLock: false, element: el,
    buf: { attack: 0, dodge: 0, s0: 0, s1: 0 }, mvx: 0, mvz: 0, kills: 0,
  };
  const S = { t: 0, ticks: 0, acc: 0, enemies: [], events: [], nextId: 1, swingId: 0, waveId: 0, hash: 0, shakeAmp: 0 };
  const EVP = []; for (let i = 0; i < 160; i++) EVP.push({ type: '', t: 0, id: 0, src: '', x: 0, y: 0, z: 0, dmg: 0, mult: 1, elem: '', kind: '', hp: 0, a: 0, b: 0, stop: 0, flag: false });
  let nEv = 0;
  const emit = (type) => { if (nEv >= EVP.length) return EVP[EVP.length - 1]; const e = EVP[nEv++]; e.type = type; e.t = S.t; e.id = 0; e.src = ''; e.x = e.y = e.z = 0; e.dmg = 0; e.mult = 1; e.elem = ''; e.kind = ''; e.hp = 0; e.a = e.b = 0; e.stop = 0; e.flag = false; S.events.push(e); return e; };
  const proj = []; for (let i = 0; i < 8; i++) proj.push({ on: false, uid: 0, x: 0, z: 0, dx: 0, dz: 0, t: 0, life: 0, sk: null });
  const isInvul = () => H.invul > 0 || (H.state === 'dodge' && H.sT >= T.dodge.i0 && H.sT <= T.dodge.i1);
  let pend = { attack: false, dodge: false, s0: false, s1: false, lock: false, lockNext: false };

  // ---- enemies
  function spawn(kind, x, z, o = {}) {
    const K = KINDS[kind]; if (!K) throw new Error('kind ' + kind);
    let alive = 0; for (const e of S.enemies) if (e.state !== 'dead') alive++; if (alive >= T.enemy.max) return null;
    const e = { id: S.nextId++, kind, K, x, z, yaw: o.yaw || 0, hp: K.hp, hpMax: K.hp, poise: 0, state: 'idle', sT: 0, freeze: 0, lastHit: -1, lastWave: -1, kx: 0, kz: 0, lockYaw: 0, struck: false, pdone: false, wait: 0.15 + rnd() * 0.35, element: o.element !== undefined ? o.element : K.element, r: K.radius || T.enemy.radius, pose: { clip: 'idle', t: 0 }, flash: 0, orbit: rnd() < 0.5 ? 1 : -1, passive: !!o.passive };
    S.enemies.push(e); const ev = emit('spawn'); ev.id = e.id; ev.kind = kind; ev.x = x; ev.z = z; return e;
  }
  const enemyById = (id) => { for (const e of S.enemies) if (e.id === id) return e; return null; };

  // ---- damage dealt to an enemy
  function hurtEnemy(e, base, mult0, kindName, atk, dirx, dirz, mark) {
    const mult = mult0 * elementMult(el, e.element), dmg = Math.round(base * mult * 10) / 10;
    e.hp -= dmg; e.flash = 0.12; if (mark) e.lastHit = H.swing;
    const ev = emit('hit'); ev.src = 'hero'; ev.id = e.id; ev.x = e.x; ev.y = 1.1; ev.z = e.z; ev.dmg = dmg; ev.mult = mult; ev.elem = el; ev.kind = kindName; ev.hp = Math.max(0, e.hp); ev.stop = atk.stop || 0; ev.a = dirx; ev.b = dirz; ev.flag = !!atk.stagger;
    H.freeze = Math.max(H.freeze, atk.stop || 0); e.freeze = Math.max(e.freeze, atk.stop || 0);
    const k = (atk.knock || 0) * 8; e.kx = dirx * k; e.kz = dirz * k;
    e.poise += atk.poise || 0;
    if (e.hp <= 0) { e.state = 'dead'; e.sT = 0; e.pose.clip = 'dead'; H.kills++; const k2 = emit('kill'); k2.id = e.id; k2.x = e.x; k2.z = e.z; k2.kind = e.kind; if (H.lockId === e.id) { H.lockId = 0; H.hasLock = false; } return; }
    if (e.poise >= e.K.poise || (atk.stagger && e.poise >= e.K.poise * 0.5)) { e.poise = 0; if (e.state !== 'stagger') { e.state = 'stagger'; e.sT = 0; const s = emit('stagger'); s.id = e.id; s.x = e.x; s.z = e.z; } else e.sT = 0; }
  }

  // ---- hero actions
  function faceDesired() {                                              // who should an attack turn to: lock target, else nearest within autoTurn, else the stick, else keep
    if (H.hasLock) { const e = enemyById(H.lockId); if (e && e.state !== 'dead') return Math.atan2(e.x - H.x, e.z - H.z); }
    let best = null, bd = T.autoTurn + 1e-6;
    for (const e of S.enemies) { if (e.state === 'dead') continue; const d = Math.hypot(e.x - H.x, e.z - H.z) - e.r; if (d < bd) { bd = d; best = e; } }
    if (best) return Math.atan2(best.x - H.x, best.z - H.z);
    if (Math.hypot(H.mvx, H.mvz) > 0.2) return Math.atan2(H.mvx, H.mvz);
    return H.yaw;
  }
  function startAttack(n) {
    const c = kit.combo[n]; H.state = 'atk'; H.n = n; H.sT = 0; H.swing = ++S.swingId; H.sw2 = false; H.lungeDone = 0; H.faceOverride = true; H.canMove = false; H.buf.attack = 0; H.want = faceDesired(); H.grace = 0;
    const ev = emit('swing'); ev.a = n; ev.kind = n === 3 ? 'finisher' : 'light'; ev.x = H.x; ev.z = H.z;
  }
  function startSkill(i) {
    const s = kit.skills && kit.skills[i]; if (!s || H.cd[i] > 0) return false;
    H.cd[i] = s.cd; H.state = 'skill'; H.skill = i; H.sT = 0; H.fired = false; H.swing = ++S.swingId; H.lungeDone = 0; H.faceOverride = true; H.canMove = false; H.want = faceDesired(); H.grace = 0;
    const ev = emit('skill'); ev.a = i; ev.kind = s.id; ev.x = H.x; ev.z = H.z; return true;
  }
  function startDodge() {
    if (H.dodgeCd > 0 || H.st < T.dodge.cost) return false;
    H.st -= T.dodge.cost; H.stDelay = T.hero.regenDelay; H.state = 'dodge'; H.sT = 0; H.lastDodgeFrac = 0; H.dodgeCd = T.dodge.recharge; H.faceOverride = true; H.canMove = false; H.buf.dodge = 0; H.grace = 0; H.lungeDone = 0; H.pdKey = 0;
    let dx = H.mvx, dz = H.mvz, m = Math.hypot(dx, dz), dist = T.dodge.dist;
    if (m > 0.1) { dx /= m; dz /= m; H.yaw = Math.atan2(dx, dz); } else { dx = -Math.sin(H.yaw); dz = -Math.cos(H.yaw); dist = T.dodge.back; }      // no stick: back-step, still facing the enemy
    H.dodgeDx = dx; H.dodgeDz = dz; H.dodgeDist = dist; H.dodgeFace = H.yaw; const ev = emit('dodge'); ev.x = H.x; ev.z = H.z; return true;
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
    const mult = elementMult(e.element, el), dmg = Math.round(dmg0 * mult * 10) / 10;
    H.hp -= dmg; H.freeze = Math.max(H.freeze, T.hitstop.hurt);
    const ev = emit('hero-hit'); ev.src = e.kind; ev.id = e.id; ev.dmg = dmg; ev.mult = mult; ev.x = H.x; ev.y = 1.1; ev.z = H.z; ev.hp = Math.max(0, H.hp); ev.stop = T.hitstop.hurt;
    if (H.hp <= 0) { H.hp = 0; H.state = 'dead'; H.sT = 0; H.canMove = false; H.faceOverride = true; emit('dead'); return; }
    const big = dmg >= H.hpMax * T.hero.downAt, strong = H.armor > 0;
    ev.flag = big;
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
    const hs = T.hero, cs = T.comboSpeed;
    // input memory (buffers), edges come from `pend`
    for (const k in H.buf) H.buf[k] = Math.max(0, H.buf[k] - dt);
    if (pend.attack) H.buf.attack = T.buffer.attack; if (pend.dodge) H.buf.dodge = T.buffer.dodge; if (pend.s0) H.buf.s0 = T.buffer.skill; if (pend.s1) H.buf.s1 = T.buffer.skill;
    H.mvx = inp.mx || 0; H.mvz = inp.mz || 0; const camYaw = inp.camYaw;
    if (pend.lock) { if (H.hasLock) { H.hasLock = false; H.lockId = 0; const ev = emit('lock'); ev.flag = false; } else { const c = lockCandidates(camYaw, true); if (c) { H.lockId = c.id; H.hasLock = true; const ev = emit('lock'); ev.id = c.id; ev.flag = true; } } }
    if (pend.lockNext && H.hasLock) lockNext(camYaw);
    pend.attack = pend.dodge = pend.s0 = pend.s1 = pend.lock = pend.lockNext = false;
    H.dodgeCd = Math.max(0, H.dodgeCd - dt); H.cd[0] = Math.max(0, H.cd[0] - dt); H.cd[1] = Math.max(0, H.cd[1] - dt); H.invul = Math.max(0, H.invul - dt); H.armor = Math.max(0, H.armor - dt);
    if (H.state !== 'dodge') { H.stDelay -= dt; if (H.stDelay <= 0 && H.st < H.stMax) H.st = Math.min(H.stMax, H.st + hs.regen * dt); }
    if (H.grace > 0) { H.grace -= dt; if (H.grace <= 0) H.graceN = -1; }

    // ---- hero state machine (the hero's own clock stops during hit-stop)
    const frozen = H.freeze > 0; if (frozen) H.freeze -= dt;
    H.mvOutX = H.mvOutX; // (accumulators are zeroed by takeMove)
    if (H.state !== 'dead') {
      const loco = H.state === 'loco', atk = H.state === 'atk', c = atk ? kit.combo[H.n] : null;
      const canAct = loco || (atk && H.sT >= c.cancel) || (H.state === 'skill' && H.sT >= kit.skills[H.skill].dur * 0.9);
      // priorities: dodge > skill > attack
      if (H.buf.dodge > 0 && (loco || (atk && H.sT >= c.cancel - 0.05) || (H.state === 'skill' && H.sT >= kit.skills[H.skill].at + 0.08))) { startDodge(); }                                       // (not enough stamina / still recharging: the press stays buffered until it expires)
      else if (H.buf.s0 > 0 && canAct && kit.skills && H.cd[0] <= 0) { H.buf.s0 = 0; startSkill(0); }
      else if (H.buf.s1 > 0 && canAct && kit.skills && H.cd[1] <= 0) { H.buf.s1 = 0; startSkill(1); }
      else if (H.buf.attack > 0 && kit.combo) {
        if (loco) startAttack(H.grace > 0 && H.graceN >= 0 && H.graceN < 3 ? H.graceN + 1 : 0);
        else if (atk && H.sT >= c.cancel) startAttack((H.n + 1) % 4);
        else if (H.state === 'skill' && canAct) startAttack(0);
      }
      if (!frozen) {
        const rt = H.state === 'atk' ? cs * (kit.combo[H.n].rate || 1) : H.state === 'skill' ? cs : 1; H.sT += rt * dt; const st = H.state;
        if (st === 'atk') {
          const c2 = kit.combo[H.n];
          if (H.sT < 0.14) H.yaw = turnTo(H.yaw, H.want, hs.turnRate * dt);
          // lunge: forward travel spread over the window
          const [ld, l0, l1] = c2.lunge; if (H.sT >= l0 && H.lungeDone < ld) { const step = Math.min(ld - H.lungeDone, ld * (dt * rt) / (l1 - l0)); H.lungeDone += step; lungeMove(step); }
          if (H.sT >= c2.hit[0] && H.sT <= c2.hit[1]) heroStrike(c2, c2.dmg * T.ATK, H.n === 3 ? 'finisher' : 'light');
          if (c2.hit2 && H.sT >= c2.hit2[0] && H.sT <= c2.hit2[1]) { if (!H.sw2) { H.sw2 = true; H.swing = ++S.swingId; } heroStrike(c2.sec, c2.dmg2 * T.ATK, 'light'); }
          if (H.sT >= c2.dur) { H.state = 'loco'; H.canMove = true; H.faceOverride = false; H.grace = T.grace; H.graceN = H.n === 3 ? -1 : H.n; if (H.n === 3) H.graceN = -1; }
        } else if (st === 'skill') {
          const s = kit.skills[H.skill]; if (H.sT < 0.14) H.yaw = turnTo(H.yaw, H.want, hs.turnRate * dt);
          if (s.lunge) { const [ld, l0, l1] = s.lunge; if (H.sT >= l0 && H.lungeDone < ld) { const step = Math.min(ld - H.lungeDone, ld * (dt * cs) / (l1 - l0)); H.lungeDone += step; lungeMove(step); } }
          if (!H.fired && H.sT >= s.at) { H.fired = true; fireSkill(s); }
          if (H.sT >= s.dur) { H.state = 'loco'; H.canMove = true; H.faceOverride = false; H.grace = 0; }
        } else if (st === 'dodge') {
          const D = T.dodge, f = clamp(H.sT / D.dur, 0, 1), ease = 1 - (1 - f) * (1 - f), dd = (ease - H.lastDodgeFrac) * H.dodgeDist; H.lastDodgeFrac = ease;
          moveHero(H.dodgeDx * dd, H.dodgeDz * dd); H.yaw = H.dodgeFace;
          if (H.sT >= D.dur) { H.state = 'loco'; H.canMove = true; H.faceOverride = false; H.lastDodgeFrac = 0; }
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
      for (const e of S.enemies) { if (e.state === 'dead' || e.lastWave === p.uid) continue; if (Math.hypot(e.x - p.x, e.z - p.z) <= s.radius + e.r) { e.lastWave = p.uid; hurtEnemy(e, s.dmg * T.ATK, 1, 'wave', s, p.dx, p.dz); } }
      if (p.t >= s.range / s.speed) p.on = false;
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
  function fireSkill(s) {
    if (s.id === 'wave') {
      for (const p of proj) if (!p.on) { p.on = true; p.uid = ++S.waveId; p.x = H.x + Math.sin(H.yaw) * 0.9; p.z = H.z + Math.cos(H.yaw) * 0.9; p.dx = Math.sin(H.yaw); p.dz = Math.cos(H.yaw); p.t = 0; p.sk = s; const ev = emit('wave'); ev.x = p.x; ev.z = p.z; ev.a = p.dx; ev.b = p.dz; ev.id = p.uid; break; }
    } else if (s.id === 'burst') {
      const ev = emit('burst'); ev.x = H.x; ev.z = H.z; ev.a = s.radius;
      for (const e of S.enemies) { if (e.state === 'dead') continue; const dx = e.x - H.x, dz = e.z - H.z, d = Math.hypot(dx, dz); if (d - e.r > s.radius) continue; hurtEnemy(e, s.dmg * T.ATK, 1, 'burst', s, d > 1e-4 ? dx / d : 0, d > 1e-4 ? dz / d : 1); }
    }
  }

  function enemyTick(e, dt, ep, attackers) {
    const K = e.K; e.flash = Math.max(0, e.flash - dt);
    if (e.freeze > 0) { e.freeze -= dt; return; }                            // hit-stop: the victim's own clock stands still
    e.sT += dt;
    // knock-back velocity (decays)
    if (e.kx || e.kz) { e.x += e.kx * dt; e.z += e.kz * dt; const k = Math.exp(-8 * dt); e.kx *= k; e.kz *= k; if (Math.abs(e.kx) + Math.abs(e.kz) < 0.05) e.kx = e.kz = 0; }
    if (e.state === 'dead') return;
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
        if (inRange) { const sx = -Math.cos(e.yaw) * e.orbit, sz = Math.sin(e.yaw) * e.orbit; e.x += sx * 1.3 * dt; e.z += sz * 1.3 * dt; }       // waits for an attack slot: circles slowly
        else { e.x += Math.sin(e.yaw) * K.speed * dt; e.z += Math.cos(e.yaw) * K.speed * dt; }
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
    if (S2 === 'atk') { P.clip = kit.combo[H.n].clip; P.t = H.sT; }
    else if (S2 === 'skill') { const s = kit.skills[H.skill]; P.clip = s.clip; P.t = H.sT * (s.rate || 1); }
    else if (S2 === 'dodge') { P.clip = 'dodge'; P.t = H.sT * (T.dodge.clipLen / T.dodge.dur); }
    else if (S2 === 'hit') { P.clip = 'hit'; P.t = Math.min(H.sT * 1.2, 0.45); }
    else if (S2 === 'down') { P.clip = 'knockdown'; P.t = Math.min(H.sT * 1.65, 1.8); }
    else if (S2 === 'dead') { P.clip = 'death'; P.t = Math.min(H.sT, 4.0); }
    else { P.clip = ''; P.t = 0; }
  }

  // ------------------------------------------------------------------ public
  const sim = {
    S, hero: H, tune: T, kit, element: el, enemies: S.enemies, events: S.events, projectiles: proj,
    spawn, enemyById, invulnerable: isInvul,
    /** advance by dt seconds of real time (any size); input is read once per call, edges (attack, skill1, skill2, dodge, lock, lockNext) are consumed by the first sub-step */
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
    reset() { S.enemies.length = 0; S.events.length = 0; nEv = 0; for (const p of proj) p.on = false; H.hp = H.hpMax; H.st = H.stMax; H.state = 'loco'; H.sT = 0; H.canMove = true; H.faceOverride = false; H.cd[0] = H.cd[1] = 0; H.dodgeCd = 0; H.invul = 0; H.armor = 0; H.freeze = 0; H.hasLock = false; H.lockId = 0; H.n = -1; H.grace = 0; H.graceN = -1; H.kills = 0; },
    revive() { H.hp = H.hpMax; H.state = 'loco'; H.sT = 0; H.canMove = true; H.faceOverride = false; H.invul = 1.0; },
  };
  H.kbx = 0; H.kbz = 0; H.want = 0; H.dodgeDist = 0; H.dodgeFace = 0;
  return sim;
}

// ------------------------------------------------------------------ host entry (rpg.js hero mode).  Lazy: nothing above is loaded until the first attack.
//   attach(under, hero, opts) -> controller { sim, pre(dt, S), post(dt), frame(dt, now), press(name), setQuality(step), spawnTest(n), dispose() }
//     under : the underworld/arena contract { scene, hgt(x,z), colliders, clampXZ } (or the home scene wrapper)   hero : the host's hero entry { grp, model, mixer, acts, clips }
//     opts  : { THREE, camera, root, base (asset url base), v (cache suffix), hostMove(dx,dz) -> applies one displacement with the host's collision, getPose() -> {x,y,z,body}, dev }
export async function attach(under, hero, opts) {
  const base = new URL('.', import.meta.url).href, v = (new URL(import.meta.url).search) || (opts.v || '');
  const [fx, hud, foes] = await Promise.all([import(/* @vite-ignore */ base + 'combat/fx.js' + v), import(/* @vite-ignore */ base + 'combat/hud.js' + v), import(/* @vite-ignore */ base + 'combat/foes.js' + v)]);
  return fx.build({ createSim, hud, foes, under, hero, opts, SISTERS, ELEMENTS, TUNE, KINDS, elementMult, base, v });
}
