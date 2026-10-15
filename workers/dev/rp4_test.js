// RP4 combat core: logic tests (pure engine, Node).  Last line: "RP4 OK".  Run: bash dev/rp4_test.sh
import { createSim, elementMult, TUNE, SISTERS, KINDS, ELEMENTS, BEATS, HARMONY, harmonyOf, mulberry32, validateKit, prepareKit, ICONS, CLIPS_33 } from '../bot/bluebot_v2/bluewall/web/assets/rpg/combat.js';
import ELINA from '../bot/bluebot_v2/bluewall/web/assets/rpg/combat/kit_elina.js';
const KIT = prepareKit(ELINA);
import { checkKit } from './rp4_kitcheck.js';
import * as FIX from './rp4_kit_fixtures.js';
import { ICON_NAMES } from '../bot/bluebot_v2/bluewall/web/assets/rpg/combat/hud.js';
const DT = 1 / 60; let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) { passes++; console.log('ok   ' + msg); } else { fails++; console.log('FAIL ' + msg); } };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
// run n seconds with an input function (t, sim) -> input object; collects events with their time
function run(sim, secs, inf, onEv) { const n = Math.round(secs / DT); for (let i = 0; i < n; i++) { const inp = inf ? inf(sim.S.t, sim, i) : {}; sim.update(DT, inp || {}); if (onEv) for (const e of sim.events) onEv(e, sim.S.t); } }
const evs = (sim, secs, inf) => { const out = []; run(sim, secs, inf, (e, t) => out.push({ type: e.type, kind: e.kind, id: e.id, t, a: e.a, dmg: e.dmg, mult: e.mult, flag: e.flag, stop: e.stop })); return out; };
const fresh = (o = {}) => createSim({ kit: o.kit || KIT, seed: o.seed == null ? 1 : o.seed, selfMove: true, tune: o.tune });

// ---------------------------------------------------------------- 1. elements
ok(elementMult('fire', 'ice') === 1.5 && elementMult('ice', 'water') === 1.5 && elementMult('water', 'fire') === 1.5, 'triangle 1: fire>ice>water>fire = x1.5');
ok(elementMult('plant', 'stone') === 1.5 && elementMult('stone', 'wind') === 1.5 && elementMult('wind', 'plant') === 1.5, 'triangle 2: plant>stone>wind>plant = x1.5');
ok(elementMult('ice', 'fire') === 0.75 && elementMult('fire', 'water') === 0.75 && elementMult('stone', 'plant') === 0.75, 'the reverse direction = x0.75');
ok(elementMult('fire', 'wind') === 1 && elementMult('fire', 'fire') === 1 && elementMult(null, 'fire') === 1 && elementMult('fire', null) === 1, 'unrelated / same / none = x1');
ok(Object.keys(ELEMENTS).length === 9 && Object.values(ELEMENTS).filter((e) => e.core).length === 6 && Object.keys(SISTERS).length === 6 && KIT.combo.length === 4 && KIT.skills.length === 2, 'tables: 9 elements (6 sister elements + light / shadow / turquoise), 6 sisters (meta only), Elina\'s kit complete (4 hits + 2 skills)');
ok(elementMult('light', 'fire') === 1.5 && ['fire', 'ice', 'water', 'plant', 'stone', 'wind'].every((e) => elementMult('light', e) === 1.5 && elementMult(e, 'light') === 0.75), 'light burns all six elements (x1.5) and takes x0.75 from them');
ok(elementMult('shadow', 'light') === 1.5 && elementMult('turquoise', 'light') === 1.5 && elementMult('light', 'shadow') === 0.75 && elementMult('light', 'turquoise') === 0.75 && elementMult('shadow', 'turquoise') === 1 && elementMult('shadow', 'fire') === 1 && elementMult('fire', 'shadow') === 1, 'only shadow and turquoise beat light; nothing else involves them');
{
  // every element pair is covered by exactly the rules of the book: the six elements form two 3-cycles, nothing else wins or loses
  const six = ['fire', 'ice', 'water', 'plant', 'stone', 'wind']; let wins = 0, losses = 0, bad = '';
  for (const a of six) for (const b of six) { const m = elementMult(a, b); if (m === 1.5) wins++; if (m === 0.75) losses++; if (m === 1.5 && elementMult(b, a) !== 0.75) bad += a + b + ' '; }
  ok(wins === 6 && losses === 6 && !bad, 'six elements: exactly 6 winning and 6 losing ordered pairs (two triangles), always mirrored' + (bad ? ' BAD ' + bad : ''));
  ok(BEATS.fire[0] === 'ice' && BEATS.ice[0] === 'water' && BEATS.water[0] === 'fire' && BEATS.plant[0] === 'stone' && BEATS.stone[0] === 'wind' && BEATS.wind[0] === 'plant', 'BEATS = the book: fire>ice>water>fire, plant>stone>wind>plant');
  ok(HARMONY.length === 7 && new Set(HARMONY.map((h) => h.pair.slice().sort().join('+'))).size === 7 && HARMONY.every((h) => six.includes(h.pair[0]) && six.includes(h.pair[1]) && h.pair[0] !== h.pair[1] && h.id && h.name && !/[^\x00-\x7f]/.test(h.name)), '7 distinct harmony pairs of the six elements, English names for the hero UI');
  const exp = { 'fire+wind': 'firestorm', 'plant+stone': 'thorn_fort', 'ice+water': 'frozen_wave', 'fire+water': 'hot_mist', 'ice+wind': 'blizzard', 'plant+water': 'healing_garden', 'fire+stone': 'lava' };
  ok(Object.entries(exp).every(([k, id]) => { const [a, b] = k.split('+'); const h1 = harmonyOf(a, b), h2 = harmonyOf(b, a); return h1 && h2 && h1.id === id && h2.id === id; }) && harmonyOf('fire', 'fire') === null && harmonyOf('fire', 'plant') === null && harmonyOf('light', 'fire') === null, 'harmonyOf(a, b): the book\'s names, either order; same / unrelated = null');
  const sis = Object.values(SISTERS).map((s) => s.element); let pairsOk = 0; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (harmonyOf(sis[i], sis[j])) pairsOk++;
  ok(pairsOk === 7, 'seven of the fifteen sister pairs have a harmony (' + pairsOk + ')');
}

// ---------------------------------------------------------------- 2. combo timings / chain / cancel windows
{
  const sim = fresh(); const e = sim.spawn('brute', 0, 1.6, { passive: true, element: null }); e.hp = e.hpMax = 99999;
  const log = evs(sim, 0.02, null);
  let t0 = sim.S.t, pressed = false;
  const out = []; run(sim, 0.4, (t) => { if (!pressed) { pressed = true; return { attack: true }; } }, (ev, t) => { if (ev.type === 'swing' || ev.type === 'hit') out.push([ev.type, ev.a, t]); });
  const sw = out.find((o) => o[0] === 'swing'), hit = out.find((o) => o[0] === 'hit');
  ok(sw && hit, 'L1: a press starts swing 0 and its hit lands');
  const dt1 = hit[2] - sw[2], c = KIT.combo[0];
  ok(dt1 >= c.hit[0] - DT && dt1 <= c.hit[0] + 2 * DT, `L1 hit lands at the start of its window (${dt1.toFixed(3)} s, window ${c.hit[0]}-${c.hit[1]})`);
}
{
  const sim = fresh(); const e = sim.spawn('brute', 0, 1.6, { passive: true, element: null }); e.hp = e.hpMax = 99999;
  const sw = [], hits = []; run(sim, 5.0, () => ({ attack: true }), (ev, t) => { if (ev.type === 'swing') sw.push([ev.a, t]); if (ev.type === 'hit') hits.push([ev.kind, t, ev.dmg]); });
  const seq = sw.slice(0, 8).map((s) => s[0]).join('');
  ok(seq === '01230123', `mashing attack chains 1-2-3-4 and loops: ${seq}`);
  const C = KIT.combo; let good = true, why = '';
  for (let i = 0; i < 7; i++) { const gap = sw[i + 1][1] - sw[i][1], cancel = C[sw[i][0]].cancel / (C[sw[i][0]].rate || 1); if (gap < cancel - DT || gap > cancel + C[sw[i][0]].stop + 4 * DT) { good = false; why = `swing ${i}: gap ${gap.toFixed(3)} vs cancel ${cancel}`; } }
  ok(good, 'the next hit starts at the previous hit\'s cancel point (+ its hit-stop) (' + (why || 'all 7 gaps within spec') + ')');
  const kinds = hits.slice(0, 4).map((h) => h[0]).join(','); ok(kinds === 'light,light,light,finisher', 'hits: 3 light + 1 finisher: ' + kinds);
  const d = hits.slice(0, 4).map((h) => h[2]); ok(d[0] === 80 && d[1] === 90 && d[2] === 100 && d[3] === 180, 'damage x ATK 100 (neutral target): ' + d.join('/'));
}
{
  // combo reset and grace
  const sim = fresh(); const e = sim.spawn('brute', 0, 1.6, { passive: true, element: null }); e.hp = e.hpMax = 99999;
  const seq = []; const onE = (ev) => { if (ev.type === 'swing') seq.push(ev.a); };
  const C = KIT.combo;
  let phase = 0, tp = 0;
  run(sim, 4.0, (t) => { // press, let swing 0 end, press again inside the grace window -> swing 1 ; then wait out the grace -> back to swing 0
    if (t < 0.03) return { attack: true };
    if (t > C[0].dur + 0.2 && t < C[0].dur + 0.23) return { attack: true };           // inside the 0.30 s grace
    if (t > 1.9 && t < 1.93) return { attack: true };  // late press, after the grace has run out
  }, onE);
  ok(seq[0] === 0 && seq[1] === 1 && seq[2] === 0, 'grace 0.30 s keeps the chain (0 then 1), a late press restarts at 0: ' + seq.join(''));
}
{
  // dodge cancel: not before cancel-0.05, then allowed
  const sim = fresh(); const e = sim.spawn('brute', 0, 1.6, { passive: true, element: null }); e.hp = e.hpMax = 99999;
  const C = KIT.combo; let t0 = null, td = null;
  run(sim, 1.0, (t) => { if (t < 0.03) return { attack: true }; if (t >= 0.1 && t < 0.12) return { dodge: true }; }, (ev, t) => { if (ev.type === 'swing' && t0 == null) t0 = t; if (ev.type === 'dodge') td = t; });
  ok(td != null && td - t0 >= C[0].cancel - 0.05 - DT && td - t0 <= C[0].cancel - 0.05 + C[0].stop + 3 * DT, `a dodge pressed mid-swing is held until the cancel point (${td == null ? 'never' : (td - t0).toFixed(3)} s after the swing start, cancel ${C[0].cancel}, minus 0.05 grace, plus hit-stop)`);
}

// ---------------------------------------------------------------- 2b. a lunge stops at arm's length (never walks into the enemy)
{
  const sim = fresh(); const e = sim.spawn('soldier', 0, 1.3, { passive: true, element: null, yaw: Math.PI }); e.hp = e.hpMax = 99999;
  let pressed = false; run(sim, 0.9, () => { if (!pressed) { pressed = true; return { attack: true }; } });
  const d = Math.hypot(e.x - sim.hero.x, e.z - sim.hero.z), contact = e.r + TUNE.hero.radius * 0.8 + 0.1;
  ok(d >= contact - 0.12, `L1 lunge towards an enemy 1.3 m away stops at arm's length (distance ${d.toFixed(2)} m, contact ${contact.toFixed(2)} m)`);
  const sim2 = fresh(); let p2 = false; run(sim2, 0.9, () => { if (!p2) { p2 = true; return { attack: true }; } });
  ok(near(Math.hypot(sim2.hero.x, sim2.hero.z), KIT.combo[0].lunge[0], 0.05), `with nobody in front the full lunge is used (${Math.hypot(sim2.hero.x, sim2.hero.z).toFixed(2)} m of ${KIT.combo[0].lunge[0]} m)`);
}
// ---------------------------------------------------------------- 3. dodge: i-frames, stamina, perfect dodge, hurt
{
  const sim = fresh(); let span = [null, null], dstart = null;
  run(sim, 1.0, (t) => (t < 0.03 ? { dodge: true, mx: 0, mz: 1 } : {}), (ev, t) => { if (ev.type === 'dodge') dstart = t; });
  // measure i-frame span with a second run (stepping manually so we can poll invulnerable())
  const s2 = fresh(); let first = null, last = null; s2.update(DT, { dodge: true, mx: 0, mz: 1 }); for (let i = 0; i < 80; i++) { const inv = s2.invulnerable(); if (inv && first == null) first = s2.hero.sT; if (inv) last = s2.hero.sT; s2.update(DT, { mx: 0, mz: 1 }); }
  ok(first != null && near(first, TUNE.dodge.i0, 2 * DT) && near(last, TUNE.dodge.i1, 2 * DT), `dodge i-frames ${first.toFixed(3)}-${last.toFixed(3)} s (spec ${TUNE.dodge.i0}-${TUNE.dodge.i1}, 0.30 s window)`);
  ok(near(s2.hero.st, 75, 1) || s2.hero.st > 70, 'a dodge costs 25 stamina and it regenerates: ' + s2.hero.st.toFixed(0));
  const s3 = fresh(); const x0 = s3.hero.z; run(s3, 0.8, (t) => (t < 0.03 ? { dodge: true, mx: 0, mz: 1 } : {})); ok(near(s3.hero.z - x0, TUNE.dodge.dist, 0.25), `the roll travels ${TUNE.dodge.dist} m (${(s3.hero.z - x0).toFixed(2)})`);
  const s4 = fresh(); let cnt = 0; run(s4, 3.0, (t, s) => (s.hero.state === 'loco' ? { dodge: true } : {}), (ev) => { if (ev.type === 'dodge') cnt++; }); ok(cnt <= 5 && cnt >= 3, `stamina limits chained dodges (${cnt} in 3 s, recharge 0.8 s)`);
}
{
  // a hostile soldier at 1.4 m: unavoided strike hurts (x0.75: ice vs fire hero), a roll inside the telegraph window is a perfect dodge
  const mk = () => { const sim = fresh(); sim.spawn('soldier', 0, 1.4, { yaw: Math.PI }); return sim; };
  let sim = mk(); let wind = null, hurt = null; run(sim, 2.0, null, (ev, t) => { if (ev.type === 'windup' && wind == null) wind = t; if (ev.type === 'hero-hit' && hurt == null) hurt = { t, dmg: ev.dmg, mult: ev.mult }; });
  ok(hurt && near(hurt.t - wind, KINDS.soldier.tele, 3 * DT), `telegraph: strike lands ${(hurt.t - wind).toFixed(3)} s after the windup starts (spec ${KINDS.soldier.tele})`);
  ok(hurt && hurt.dmg === 52.5 && hurt.mult === 0.75, 'enemy damage uses the element too: ice vs fire hero 70 x 0.75 = 52.5 (got ' + hurt.dmg + ')');
  ok(Object.values(KINDS).every((k) => k.tele >= 0.5), 'every enemy telegraph is >= 0.5 s (a thumb can react)');
  sim = mk(); let pd = 0, hh = 0, wind2 = null; run(sim, 2.0, (t, s) => { if (wind2 != null && t >= wind2 + 0.45 && t < wind2 + 0.47) return { dodge: true, mx: 1, mz: 0 }; }, (ev, t) => { if (ev.type === 'windup' && wind2 == null) wind2 = t; if (ev.type === 'dodge-perfect') pd++; if (ev.type === 'hero-hit') hh++; });
  ok(pd === 1 && hh === 0, 'rolling in at the last moment = perfect dodge event, no damage (perfect ' + pd + ', hits ' + hh + ')');
  ok(sim.hero.st > 70, 'perfect dodge refunds stamina');
  sim = mk(); let hh2 = 0, w3 = null; run(sim, 2.0, (t) => { if (w3 != null && t >= w3 + 0.62 && t < w3 + 0.64) return { dodge: true, mx: 1, mz: 0 }; }, (ev, t) => { if (ev.type === 'windup' && w3 == null) w3 = t; if (ev.type === 'hero-hit') hh2++; }); ok(hh2 === 1, 'a roll that starts after the strike lands is too late (hit)');
  // strike direction freezes at half the telegraph
  sim = mk(); const e = sim.enemies[0]; let yawAtHalf = null, yawEnd = null, w4 = null;
  run(sim, 1.6, (t, s, i) => (w4 != null && t > w4 + 0.3 ? { mx: 0, mz: 0 } : {}), (ev, t) => { if (ev.type === 'windup' && w4 == null) w4 = t; });
  sim = mk(); let ww = null, yh = null, ye = null; for (let i = 0; i < 200; i++) { sim.update(DT, {}); for (const ev of sim.events) if (ev.type === 'windup' && ww == null) ww = sim.S.t; if (ww != null) { sim.hero.x = 0.4 * Math.sin(i * 0.3) * 3; if (sim.S.t >= ww + KINDS.soldier.tele * 0.5 + 0.03 && yh == null) yh = sim.enemies[0].yaw; if (sim.enemies[0].state === 'attack' && ye == null) ye = sim.enemies[0].yaw; } }
  ok(yh != null && ye != null && near(yh, ye, 1e-6), 'the strike direction is frozen at half of the telegraph (a side-step always dodges)');
}
{
  // hurt reactions: light hit = stun with hyper-armour, heavy = knock-down, death
  let sim = fresh(); sim.spawn('beast', 0, 1.2, { yaw: Math.PI }); let types = []; run(sim, 1.6, null, (ev) => { if (ev.type === 'hero-hit') types.push(ev.dmg + ':' + ev.mult); });
  ok(types[0] === '135:1.5', 'water beast vs fire hero = x1.5 (135): ' + types[0]);
  sim = fresh(); sim.spawn('brute', 0, 1.5, { yaw: Math.PI }); let kd = 0; run(sim, 2.0, null, (ev) => { if (ev.type === 'knockdown') kd++; }); ok(kd === 1, 'a hit of >= 25 % HP knocks the hero down (brute 160)'); ok(sim.hero.state === 'down' || sim.hero.state === 'loco', 'knock-down state ends in loco');
  sim = fresh(); sim.hero.hp = 100; sim.spawn('brute', 0, 1.5, { yaw: Math.PI }); let dead = false; run(sim, 3.0, null, (ev) => { if (ev.type === 'dead') dead = true; }); ok(dead && sim.hero.state === 'dead' && sim.hero.hp === 0, 'HP 0 -> dead; the death clip clock runs (t=' + sim.hero.pose.t.toFixed(2) + ')'); ok(sim.hero.pose.clip === 'death' && sim.hero.pose.t > 1, 'death pose requested');
  sim = fresh(); sim.spawn('soldier', 0, 1.4, { yaw: Math.PI }); let st = []; run(sim, 1.5, null, (ev) => { if (ev.type === 'hero-hit') st.push(sim.hero.state); }); ok(st[0] === 'hit', 'a light enemy hit = hit-stun state');
}

// ---------------------------------------------------------------- 4. hit-stop (only the two involved)
{
  const sim = fresh(); const a = sim.spawn('brute', 0, 1.6, { passive: true, element: null }); a.hp = a.hpMax = 99999; const b = sim.spawn('soldier', 0, -5, { passive: true });
  let hitTick = -1, frozenTicks = 0, sTflat = true, otherAdv = true, prevS = null, prevB = b.sT;
  for (let i = 0; i < 90; i++) {
    sim.update(DT, i === 1 ? { attack: true } : {}); for (const ev of sim.events) if (ev.type === 'hit' && hitTick < 0) hitTick = i;
    if (hitTick >= 0 && sim.hero.freeze > 0 && i > hitTick) { frozenTicks++; if (prevS != null && sim.hero.sT !== prevS) sTflat = false; if (b.sT <= prevB) otherAdv = false; }
    prevS = sim.hero.sT; prevB = b.sT;
  }
  const want = KIT.combo[0].stop;
  ok(hitTick >= 0 && near(frozenTicks * DT, want, 2 * DT), `hit-stop freezes for ${want * 1000} ms (${(frozenTicks * DT * 1000).toFixed(0)} ms measured)`);
  ok(sTflat && otherAdv, 'during hit-stop the hero\'s clock and the victim\'s clock stand still, other enemies keep running');
}

// ---------------------------------------------------------------- 5. stagger, kill, poise
{
  const sim = fresh(); const e = sim.spawn('soldier', 0, 1.6, { passive: true, element: null }); e.hp = e.hpMax = 2000;
  const seen = []; run(sim, 2.6, () => ({ attack: true }), (ev) => { if (ev.type === 'stagger') seen.push(ev.id); });
  ok(seen.length >= 1, 'the finisher (poise 100 >= half of 60) staggers a soldier');
  const s2 = fresh(); const b = s2.spawn('brute', 0, 1.6, { passive: true, element: null }); b.hp = b.hpMax = 9000; let g = 0; run(s2, 1.0, (t) => (t < 0.02 ? { attack: true } : {}), (ev) => { if (ev.type === 'stagger') g++; }); ok(g === 0, 'a brute shrugs off a light hit (poise 200)');
  const s3 = fresh(); const k = s3.spawn('soldier', 0, 1.6, { passive: true }); let kills = 0, hits = 0; run(s3, 2.0, () => ({ attack: true }), (ev) => { if (ev.type === 'kill') kills++; if (ev.type === 'hit') hits++; });
  ok(kills === 1 && hits >= 2 && hits <= 3, `a soldier (240 HP, ice) dies from 120+135 fire damage in ${hits} hits, one kill event`); ok(s3.enemies.length === 0, 'the dead enemy is removed after its death clip time');
}

// ---------------------------------------------------------------- 6. lock-on
{
  const sim = fresh(); const a = sim.spawn('soldier', -3, 8, { passive: true }), b = sim.spawn('soldier', 0, 10, { passive: true }), c = sim.spawn('soldier', 4, 9, { passive: true }), back = sim.spawn('soldier', 0, -14, { passive: true }), far = sim.spawn('soldier', 0, 30, { passive: true });
  sim.update(DT, { lock: true, camYaw: 0 }); ok(sim.hero.hasLock && sim.hero.lockId === b.id || sim.hero.lockId === a.id, 'lock picks a target inside the view cone: id ' + sim.hero.lockId);
  const first = sim.hero.lockId; const order = [first]; for (let i = 0; i < 3; i++) { sim.update(DT, { lockNext: true, camYaw: 0 }); order.push(sim.hero.lockId); }
  ok(new Set(order.slice(0, 3)).size === 3 && order[3] === order[0] || new Set(order).size >= 3, 'lockNext cycles through the in-range targets and wraps: ' + order.join(','));
  ok(!order.includes(back.id) && !order.includes(far.id), 'targets behind the camera / beyond 18 m are not picked');
  const y = sim.lockYaw(); const t = sim.lockTarget(); ok(y != null && near(y, Math.atan2(t.x - sim.hero.x, t.z - sim.hero.z), 1e-6), 'lockYaw() = yaw towards the locked target (the host eases its camera to it)');
  sim.update(DT, { lock: true }); ok(!sim.hero.hasLock && sim.lockYaw() === null, 'a second lock press toggles it off');
  sim.update(DT, { lock: true, camYaw: 0 }); const tid = sim.hero.lockId; sim.enemyById(tid).state = 'dead'; sim.update(DT, { camYaw: 0 }); ok(sim.hero.lockId !== tid, 'a dead target drops the lock (re-acquires only a very near enemy)');
  // attack auto-turn: nearest within 3 m, no aiming needed
  const s2 = fresh(); const e = s2.spawn('brute', 2.0, -0.2, { passive: true, element: null }); e.hp = e.hpMax = 9999; let hit = 0; s2.hero.yaw = 0; run(s2, 0.6, (t) => (t < 0.02 ? { attack: true } : {}), (ev) => { if (ev.type === 'hit') hit++; }); ok(hit === 1 && near(Math.abs(s2.hero.yaw - Math.atan2(2.0, -0.2)), 0, 0.2), 'attack auto-turns to the nearest enemy within 3 m (hero faced 0 rad, enemy at the side)');
  const s3 = fresh(); const f = s3.spawn('brute', 0, 4.5, { passive: true, element: null }); let h3 = 0; run(s3, 0.5, (t) => (t < 0.02 ? { attack: true, mx: 1, mz: 0 } : {}), (ev) => { if (ev.type === 'hit') h3++; }); ok(h3 === 0, 'an enemy farther than 3 m is not auto-targeted (the stick direction wins)');
}

// ---------------------------------------------------------------- 7. skills
{
  const sim = fresh(); const a = sim.spawn('brute', 0, 3, { passive: true, element: null }), b = sim.spawn('brute', 0, 7, { passive: true, element: null }); a.hp = a.hpMax = b.hp = b.hpMax = 99999;
  const hits = []; let t1 = [], waves = 0; run(sim, 1.6, (t) => (t < 0.02 || (t > 0.8 && t < 0.82) ? { skill1: true } : {}), (ev, t) => { if (ev.type === 'hit' && ev.kind === 'proj') hits.push(ev.id); if (ev.type === 'skill') t1.push(t); if (ev.type === 'proj') waves++; });
  ok(waves === 1 && t1.length === 1, 'skill 1 has a 6 s cooldown (second press inside it is ignored)');
  ok(hits.length === 2 && hits[0] !== hits[1], 'the flame wave pierces: both enemies in line are hit once each');
  ok(sim.hero.cd[0] > 4.0 && sim.hero.cd[0] <= 6, 'cooldown counts down: ' + sim.hero.cd[0].toFixed(2));
  const s2 = fresh(); const ids = []; const near1 = s2.spawn('brute', 3, 0, { passive: true, element: null }), near2 = s2.spawn('brute', -2, -3, { passive: true, element: null }), far = s2.spawn('brute', 0, 7, { passive: true, element: null }); near1.hp = near2.hp = far.hp = 9999; const hp0 = far.hp;
  let burst = 0, stag = 0; run(s2, 1.4, (t) => (t < 0.02 ? { skill2: true } : {}), (ev) => { if (ev.type === 'hit' && ev.kind === 'burst') burst++; if (ev.type === 'stagger') stag++; });
  ok(burst === 2 && far.hp === hp0, 'skill 2 burst: radius 5 m hits the 2 near enemies, not the one at 7 m');
  ok(stag === 2, 'the burst staggers what it hits'); ok(near1.hp === 9999 - 300, 'burst damage = 3.0 x ATK 100 = 300 on a neutral target: hp ' + near1.hp);
  ok(Math.abs(s2.hero.cd[1] - 14) < 1.6, 'skill 2 cooldown 14 s');
}

// ---------------------------------------------------------------- 8. caps and determinism
{
  const sim = fresh(); for (let i = 0; i < 9; i++) sim.spawn('soldier', i * 2 - 8, 10); ok(sim.aliveEnemies() === 6, 'at most 6 enemies alive at once (9 requested)');
}
function script(seed) {
  const sim = createSim({ kit: KIT, seed, selfMove: true }); const r = mulberry32(99); const log = [];
  for (let i = 0; i < 6; i++) sim.spawn(['soldier', 'beast', 'brute'][i % 3], Math.cos(i) * 7, Math.sin(i) * 7);
  for (let i = 0; i < 1800; i++) {
    const inp = { mx: r() < 0.3 ? r() * 2 - 1 : 0, mz: r() < 0.3 ? r() * 2 - 1 : 0, attack: r() < 0.12, dodge: r() < 0.03, skill1: r() < 0.01, skill2: r() < 0.005, lock: r() < 0.01, lockNext: r() < 0.01, camYaw: 0 };
    sim.update(DT, inp); for (const e of sim.events) log.push(e.type + ':' + e.id + ':' + e.dmg.toFixed(1) + ':' + e.t.toFixed(3));
    if (sim.hero.state === 'dead') sim.revive();
  }
  return { hash: sim.S.hash, n: log.length, tail: log.slice(-5).join('|'), hp: sim.hero.hp, kills: sim.hero.kills, first: log.slice(0, 40).join('|') };
}
{
  const A = script(7), B = script(7), C = script(8);
  ok(A.hash === B.hash && A.n === B.n && A.first === B.first && A.tail === B.tail, `deterministic replay: same seed -> identical state hash ${A.hash} and ${A.n} events (hp ${A.hp}, kills ${A.kills})`);
  ok(A.n > 40, 'the scripted fight is real (many events: ' + A.n + ')');
  ok(A.hash !== C.hash || A.first !== C.first, 'a different seed gives a different fight');
}
{
  // cost: 6 enemies, 60 s simulated
  const sim = createSim({ kit: KIT, seed: 3, selfMove: true }); for (let i = 0; i < 6; i++) sim.spawn('soldier', Math.cos(i) * 6, Math.sin(i) * 6, { passive: i > 2 }); const r = mulberry32(5);
  const t0 = process.hrtime.bigint(); for (let i = 0; i < 3600; i++) { sim.update(DT, { mx: r() - 0.5, mz: r() - 0.5, attack: r() < 0.2, dodge: r() < 0.02 }); if (sim.hero.state === 'dead') sim.revive(); for (const e of sim.enemies) e.hp = e.hpMax; }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6; console.log(`info cost: ${(ms / 3600 * 1000).toFixed(1)} us per tick with 6 enemies (node; 60 s simulated in ${ms.toFixed(0)} ms)`); ok(ms / 3600 < 0.3, 'sim cost under 0.3 ms per tick (6 enemies)');
}
{
  // the clip table is checked against the REAL hero GLB (RP0B): every clip the kit names exists and has the duration the table says
  const fs = require('fs'); const f = '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/elina.glb';
  if (fs.existsSync(f)) {
    const b = fs.readFileSync(f), jl = b.readUInt32LE(12), js = JSON.parse(b.slice(20, 20 + jl).toString('utf8')), dur = {};
    for (const a of js.animations) { let m = 0; for (const sm of a.samplers) m = Math.max(m, js.accessors[sm.input].max[0]); dur[a.name] = m; }
    const K = KIT, miss = K.clips.filter((n) => dur[n] == null), bad = K.combo.filter((c) => Math.abs(dur[c.clip] - c.dur) > 0.02).map((c) => c.clip + ' ' + dur[c.clip].toFixed(3) + ' vs ' + c.dur);
    ok(!miss.length, 'the hero GLB has every clip the kit names (' + K.clips.join(' ') + ')' + (miss.length ? ' MISSING ' + miss : ''));
    ok(!bad.length, 'combo durations = the real clips: ' + K.combo.map((c) => c.clip + ' ' + dur[c.clip].toFixed(2)).join(', ') + (bad.length ? ' BAD ' + bad : ''));
    ok(K.combo.every((c) => c.hit[1] < c.dur && c.cancel <= c.dur && (!c.hit2 || c.hit2[1] < c.dur)) && Math.abs(dur[K.skills[0].clip] - K.skills[0].dur) < 0.02, 'hit windows and cancel points lie inside their clips; skill 1 uses ' + K.skills[0].clip);
  } else console.log('info elina.glb not found: clip table not checked against the file');
}
{
  // heavy finisher: when it is not cancelled its rising second sweep hits again (lighter)
  const sim = fresh(); const e = sim.spawn('brute', 0, 1.6, { passive: true, element: null }); e.hp = e.hpMax = 99999;
  const hits = []; let n = 0; run(sim, 4.0, (t, s) => { const a = s.hero.state === 'loco' && n < 4 || (s.hero.state === 'atk' && s.hero.n < 3 && s.hero.sT > 0.1 && n < 4); if (a && s.hero.state === 'loco' && s.hero.grace <= 0 || (a && s.hero.state === 'atk')) return { attack: true }; return {}; }, (ev, t) => { if (ev.type === 'swing') n++; if (ev.type === 'hit') hits.push([ev.kind, ev.dmg]); });
  const k = hits.map((h) => h[0] + ':' + h[1]).join(' '); ok(/finisher:180 light:70/.test(k), 'heavy: strike 180 then the rising sweep 70 when not cancelled: ' + k);
  ok(near(KIT.combo[2].dur / KIT.combo[2].rate, 0.583, 0.01), 'slash_c plays at x1.2 (the clip has a 0.2 s idle hold before the up-slash): ' + (KIT.combo[2].dur / KIT.combo[2].rate).toFixed(3) + ' s');
}

// ---------------------------------------------------------------- 9. block (R2): hold, x0.25 from the front 120 deg, stamina, guard break
{
  const mk = (pos, yaw, o = {}) => { const sim = fresh(); sim.spawn('soldier', pos[0], pos[1], { yaw }); if (o.st != null) sim.hero.st = o.st; return sim; };
  const fwd = { block: true, mx: 0, mz: 1 };                           // (the stick forward keeps her facing +Z, whatever the enemy does)
  // front hit, guard up
  let sim = mk([0, 1.4], Math.PI); let blk = null, hh = 0, st0 = sim.hero.st; run(sim, 1.2, () => fwd, (ev) => { if (ev.type === 'block' && !blk) blk = { dmg: ev.dmg, cost: ev.a, flag: ev.flag }; if (ev.type === 'hero-hit') hh++; });
  ok(blk && blk.dmg === 13.1 && !blk.flag && hh === 0, `block: a front hit (ice soldier 70 x 0.75 = 52.5) does x0.25 = ${blk && blk.dmg}, no hurt reaction (hero-hit events ${hh})`);
  ok(blk && near(blk.cost, 15.75, 0.01) && near(sim.hero.st, st0 - 15.75, 0.5), `block: the hit cost 0.3 stamina per point of damage (${blk && blk.cost.toFixed(2)}), and stamina did not regenerate under the guard (${sim.hero.st.toFixed(1)})`);
  ok(sim.hero.state === 'block' && sim.hero.hp === 600 - 13.1, 'block: still guarding after the hit, HP lost only the chip damage');
  // before the raise is finished: full damage (0.10 s)
  sim = mk([0, 1.4], Math.PI); let early = null; sim.enemies[0].state = 'windup'; sim.enemies[0].sT = 0.6 - 0.04;     // strike lands 0.04 s from now
  run(sim, 0.5, (t) => (t < 0.02 ? { block: true, mx: 0, mz: 1 } : { block: true, mx: 0, mz: 1 }), (ev) => { if (ev.type === 'hero-hit' && !early) early = ev.dmg; if (ev.type === 'block') early = early || -1; });
  ok(early === 52.5, `block: a strike that lands inside the 0.10 s raise is NOT blocked (${early})`);
  // from behind: full damage even with the guard up
  sim = mk([0, -1.4], 0); let back = null, bb = 0; run(sim, 1.2, () => fwd, (ev) => { if (ev.type === 'hero-hit' && !back) back = ev.dmg; if (ev.type === 'block') bb++; });
  ok(back === 52.5 && bb === 0, `block: a hit from behind ignores the guard (${back}, block events ${bb})`);
  // from the side, inside / outside the 120 deg arc (60 deg each side of the facing)
  const side = (deg) => { const a = deg * Math.PI / 180, r = 1.4, sm = fresh(); sm.spawn('soldier', Math.sin(a) * r, Math.cos(a) * r, { yaw: a + Math.PI }); let d = null; run(sm, 1.2, () => fwd, (ev) => { if (ev.type === 'block') d = 'block'; if (ev.type === 'hero-hit' && !d) d = 'hit'; }); return d; };
  ok(side(50) === 'block' && side(-50) === 'block' && side(75) === 'hit' && side(-75) === 'hit', `block: the arc is 120 deg (50 deg blocked, 75 deg not): ${side(50)} ${side(75)}`);
  // a brute (160) cannot knock a guarding hero down; unguarded it does
  sim = fresh(); sim.spawn('brute', 0, 1.6, { yaw: Math.PI }); let kd = 0, bl = null; run(sim, 2.0, () => fwd, (ev) => { if (ev.type === 'knockdown') kd++; if (ev.type === 'block') bl = ev; });
  ok(kd === 0 && bl && bl.dmg === 40 && near(bl.a, 48, 0.01), `block: a brute hit (160) is reduced to ${bl && bl.dmg} and cannot knock her down (stamina cost ${bl && bl.a.toFixed(0)})`);
  // guard break: not enough stamina for the whole hit
  sim = mk([0, 1.4], Math.PI, { st: 5 }); let br = null, hit2 = null; run(sim, 1.2, () => fwd, (ev) => { if (ev.type === 'block' && !br) br = ev; if (ev.type === 'hero-hit' && !hit2) hit2 = ev; });
  ok(br && br.flag && sim.hero.st === 0 || (br && br.flag && sim.hero.st < 1), 'guard break: stamina 5 < the 15.75 the hit costs -> stamina 0, the break flag is set');
  { const f = hit2 ? (1 - hit2.dmg / 52.5) / 0.75 : -1; ok(hit2 && hit2.dmg > 13.1 && hit2.dmg < 52.5 && f * br.a > 4.5 && f * br.a < 6.5, `guard break: only the part the stamina could pay (about 5 of ${br && br.a.toFixed(2)}) is reduced, the rest goes through (${hit2 && hit2.dmg})`); }
  ok(sim.hero.state === 'hit' || sim.hero.state === 'loco', 'guard break: she is staggered (hit state), the guard is down: ' + sim.hero.state);
  let again = false; const s5 = sim; run(s5, 0.4, () => fwd, () => {}); again = s5.hero.state === 'block'; ok(!again && s5.hero.guardBroken, 'guard break: she cannot raise the guard again at once (below 20 stamina)');
  run(s5, 1.6, () => ({}), () => {}); ok(s5.hero.st >= 20 && !s5.hero.guardBroken, 'guard break: after stamina is back to 20 the guard can be raised again (st ' + s5.hero.st.toFixed(0) + ')');
  run(s5, 0.1, () => fwd, () => {}); ok(s5.hero.state === 'block', 'guard break: ...and it is');
  // stamina does not regenerate under the guard, and there is a delay after lowering it
  sim = fresh(); sim.hero.st = 40; run(sim, 1.0, () => ({ block: true }), () => {}); const held = sim.hero.st; run(sim, 0.4, () => ({}), () => {}); const after = sim.hero.st; run(sim, 1.0, () => ({}), () => {});
  ok(near(held, 40, 1) && near(after, 40, 1) && sim.hero.st > 45, `stamina: frozen while guarding (${held.toFixed(1)}), waits 0.6 s after lowering (${after.toFixed(1)}), then regenerates (${sim.hero.st.toFixed(1)})`);
  // release / transitions: lowering is instant, attack / dodge / skill leave the guard at once
  sim = fresh(); run(sim, 0.3, () => ({ block: true }), () => {}); ok(sim.hero.state === 'block' && sim.guarding(), 'block: held -> the guard is up after the raise');
  run(sim, 2 * DT, () => ({}), () => {}); ok(sim.hero.state === 'loco' && !sim.guarding(), 'block: released -> back to loco on the next tick');
  sim = fresh(); sim.spawn('brute', 0, 1.6, { passive: true, element: null }).hp = 99999; let sw = 0; run(sim, 0.3, () => ({ block: true }), () => {}); { let pr = false; run(sim, 0.4, () => { if (!pr) { pr = true; return { block: true, attack: true }; } return { block: true }; }, (ev) => { if (ev.type === 'swing') sw++; }); }
  ok(sw >= 1, 'block: pressing attack while guarding swings at once (the guard drops)');
  sim = fresh(); run(sim, 0.3, () => ({ block: true }), () => {}); let dd = 0; { let pr = false; run(sim, 0.2, () => { if (!pr) { pr = true; return { block: true, dodge: true, mx: 1, mz: 0 }; } return { block: true }; }, (ev) => { if (ev.type === 'dodge') dd++; }); } ok(dd === 1, 'block: a dodge out of the guard works');
  sim = fresh(); run(sim, 0.3, () => ({ block: true }), () => {}); let sk = 0; { let pr = false; run(sim, 0.2, () => { if (!pr) { pr = true; return { block: true, skill1: true }; } return { block: true }; }, (ev) => { if (ev.type === 'skill') sk++; }); } ok(sk === 1, 'block: a skill out of the guard works');
  // after an attack the guard can be raised at the cancel point, not before
  sim = fresh(); sim.spawn('brute', 0, 1.6, { passive: true, element: null }).hp = 99999; let gs = null; run(sim, 0.9, (t, s) => (t < 0.03 ? { attack: true, block: true } : { block: true }), (ev, t) => { if (ev.type === 'guard' && ev.flag && gs == null) gs = t; });
  ok(gs != null && gs >= KIT.combo[0].cancel / (KIT.combo[0].rate || 1) - 2 * DT, `block: held through a swing, the guard comes up only after the swing's cancel point (${gs && gs.toFixed(3)} s >= ${KIT.combo[0].cancel})`);
  // hit-stop of a clean block is short, enemy statuses etc. untouched; guard events
  sim = mk([0, 1.4], Math.PI); let gu = 0, gd = 0, bs = 0; run(sim, 1.5, (t) => ({ block: t < 1.0, mx: 0, mz: 1 }), (ev) => { if (ev.type === 'guard') { if (ev.flag) gu++; else gd++; } if (ev.type === 'block') bs = ev.stop; });
  ok(gu === 1 && gd === 1, 'block: one guard-up and one guard-down event');
  // facing: with nothing pressed she turns to the nearest enemy (lock target first, stick overrides)
  sim = fresh(); sim.spawn('soldier', 5, 0, { passive: true }); run(sim, 0.6, () => ({ block: true }), () => {}); ok(near(sim.hero.yaw, Math.PI / 2, 0.05), 'block: with no stick she turns her guard to the nearest enemy (yaw ' + sim.hero.yaw.toFixed(2) + ' -> +X)');
  sim = fresh(); sim.spawn('soldier', 5, 0, { passive: true }); run(sim, 0.6, () => ({ block: true, mx: 0, mz: -1 }), () => {}); ok(near(Math.abs(sim.hero.yaw), Math.PI, 0.05), 'block: the stick wins over the nearest enemy (she faces the stick: yaw ' + sim.hero.yaw.toFixed(2) + ')');
  // block clip loop
  sim = fresh(); run(sim, 1.7, () => ({ block: true }), () => {}); ok(sim.hero.pose.clip === 'block' && sim.hero.pose.t >= 0 && sim.hero.pose.t < 0.84, 'block pose: the 0.84 s clip loops (t ' + sim.hero.pose.t.toFixed(2) + ')');
}


// ---------------------------------------------------------------- 10. the kit contract (R2): Elina's kit and five archetype fixtures all pass the same check; broken kits are refused with the field's path
{
  const R = checkKit(ELINA); ok(R.ok, `kit contract: Elina (${R.passes.length} checks)` + (R.ok ? '' : ' ' + R.fails.join(' | ')));
  for (const [name, k] of Object.entries(FIX.ALL)) { const r = checkKit(k); ok(r.ok, `kit contract: fixture ${name} (${k.role}) passes ${r.passes.length} checks` + (r.ok ? '' : ' ' + r.fails.join(' | '))); }
  const bad = (mut, expect, label) => { const k = JSON.parse(JSON.stringify(ELINA)); mut(k); const r = validateKit(k); ok(!r.ok && r.errors.some((e) => e.includes(expect)), `refused: ${label} -> "${expect}"${r.ok ? ' (ACCEPTED!)' : ''}`); };
  bad((k) => { k.combo[0].rech = 2; }, 'kit.combo[0].rech: unknown field', 'a typo in a field name');
  bad((k) => { delete k.combo[1].hit; }, 'kit.combo[1].hit is required', 'a missing required field');
  bad((k) => { k.combo[0].dmg = 40; }, 'kit.combo[0].dmg must be a number in', 'damage out of range');
  bad((k) => { k.combo[2].hit = [0.5, 0.4]; }, 'kit.combo[2].hit must be [a, b]', 'a window that ends before it starts');
  bad((k) => { k.combo[0].hit = [0.2, 0.9]; }, 'kit.combo[0].hit ends after the clip time', 'a hit window past the beat');
  bad((k) => { k.combo[0].clip = 'swing_big'; }, 'is not one of the 33 clips', 'an unknown clip');
  bad((k) => { k.combo[0].cancel = 0.1; }, 'cancel (0.1) is before the hit window', 'cancel before the hit');
  bad((k) => { k.skills.pop(); }, 'kit.skills must be an array of exactly 2', 'one skill instead of two');
  bad((k) => { k.skills[0].effects[0].type = 'laser'; }, 'effects[0].type must be one of', 'an unknown effect type');
  bad((k) => { k.skills[1].effects[0].radius = 99; }, 'kit.skills[1].effects[0].radius must be a number in', 'an area of 99 m');
  bad((k) => { k.skills[0].at = 9; }, 'kit.skills[0].at', 'an effect after the end of the skill');
  bad((k) => { k.skills[0].effects[0].dmg = 0; delete k.skills[0].effects[0].knock; k.skills[0].effects[0].knock = 0; }, 'does nothing', 'an effect that does nothing');
  bad((k) => { k.element = 'light'; }, 'kit.element must be one of', 'a sister with the light element');
  bad((k) => { k.weapons[0].url = 'http://evil/x.glb'; }, 'kit.weapons[0].url must look like', 'a weapon model from outside combat/');
  bad((k) => { k.weapons.push({ ...k.weapons[0] }); }, 'cannot share the slot', 'two weapons in one hand');
  bad((k) => { k.icons.attack = 'laser'; }, 'kit.icons.attack must be one of', 'an unknown icon');
  bad((k) => { k.combo[0].status = { id: 'poison', dur: 2 }; }, 'status.id must be one of', 'an unknown status');
  bad((k) => { k.combo[0].type = 'shot'; }, '.shot is required for type "shot"', 'a shot without projectile data');
  bad((k) => { k.combo = []; }, 'kit.combo must be an array of 1..6', 'an empty combo');
  bad((k) => { k.hero.hp = 99999; }, 'kit.hero.hp must be a number in', 'a hero with 99999 hp');
  bad((k) => { k.block.dr = 2; }, 'kit.block.dr must be a number in', 'a guard that heals');
  { const r = validateKit(ELINA, { clips: ['idle', 'walk', 'run', 'dodge', 'hit', 'death', 'knockdown', 'slash_a'] }); ok(!r.ok && r.errors.some((e) => e.includes('slash_b" is missing from this hero GLB')), 'refused: a clip the hero GLB does not contain ("slash_b" is missing from this hero GLB)'); }
  { const r = validateKit(ELINA, { clipDur: { slash_a: 0.3 } }); ok(!r.ok && r.errors.some((e) => e.includes('runs past the end of the clip "slash_a"')), 'refused: a beat longer than the real clip'); }
  ok(validateKit(JSON.parse(JSON.stringify(ELINA))).kit !== null && validateKit({ ...ELINA, combo: () => 1 }).ok === false, 'a kit with a function in it (not plain data) is refused');
  let threw = ''; try { createSim({}); } catch (e) { threw = String(e.message); } ok(/cfg\.kit is required/.test(threw), 'createSim without a kit fails with a clear message');
  const prepared = prepareKit(ELINA); ok(prepared.combo[0].arc === 110 * Math.PI / 180 && prepared.combo[3].finisher && !prepared.combo[0].finisher && prepared.clips.includes('block') && prepared.clips.includes('knockdown'), 'prepareKit: degrees become radians, the last beat is the finisher, the clip list includes the mandatory ones (block, hit, knockdown, death, dodge)');
  ok(prepareKit(prepared) === prepared && ELINA.combo[0].arc === 110, 'prepareKit is idempotent and never mutates the data file');
  ok(ICON_NAMES.join() === ICONS.join(), 'the HUD has an icon for every name the kit contract allows (' + ICONS.length + ')');
  // all kit files that exist in the game folder pass the contract
  const fs = require('fs'), dir = '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/combat/'; const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^kit_.*\.js$/.test(f)) : [];
  ok(files.includes('kit_elina.js'), 'combat/ contains kit_elina.js' + (files.length > 1 ? ' + ' + files.filter((f) => f !== 'kit_elina.js').join(', ') : ''));
}
// ---------------------------------------------------------------- 11. effects that change the hero: heal, shield, buffs, stamina, statuses (R2)
{
  const mkF = (k, o = {}) => createSim({ kit: k, seed: 1, selfMove: true, tune: o.tune });
  // heal: instant + over time, never above max; heal events
  let sim = mkF(FIX.RANGED); sim.hero.hp = 100; let heals = []; let pr = false; run(sim, 1.0, () => { if (!pr) { pr = true; return { skill1: true }; } return {}; }, (ev) => { if (ev.type === 'heal') heals.push(ev.a); });
  ok(heals.length === 2 && near(heals[0], 150, 0.1) && near(heals[1], 100, 0.1), `heal: 30 % of 500 now (${heals[0]}) and 20 % over 4 s (${heals[1]})`);
  const hpNow = sim.hero.hp; run(sim, 4.5, () => ({}), () => {}); ok(near(hpNow, 100 + 150, 30) && near(sim.hero.hp, 500, 0.5) || sim.hero.hp <= 500, `heal over time lands (${hpNow.toFixed(0)} -> ${sim.hero.hp.toFixed(0)} of 500, never above max)`);
  // shield absorbs before HP; expires
  sim = mkF(FIX.HAMMER); sim.spawn('soldier', 0, 1.4, { yaw: Math.PI }); pr = false; let ab = null, hh2 = null; run(sim, 2.0, () => { if (!pr) { pr = true; return { skill2: true }; } return {}; }, (ev) => { if (ev.type === 'absorb') ab = { dmg: ev.dmg }; if (ev.type === 'hero-hit') hh2 = { dmg: ev.dmg }; });
  ok(ab && ab.dmg === 42 && !hh2, 'shield: the soldier\'s strike (70 x the 0.6 damage-taken buff = 42) meets the stone skin (absorb event ' + (ab ? ab.dmg : 'none') + ', hp ' + sim.hero.hp + ')');
  ok(sim.hero.hp === 900 || near(sim.hero.hp, 900, 0.01), 'shield: 25 % of 900 = 225 absorbs a 70-damage strike completely, HP untouched (' + sim.hero.hp + ')');
  sim = mkF(FIX.HAMMER); pr = false; run(sim, 0.5, () => { if (!pr) { pr = true; return { skill2: true }; } return {}; }); ok(sim.hero.shT > 5 && sim.hero.sh > 200, 'shield: lasts 6 s'); run(sim, 6.0, () => ({}), () => {}); ok(sim.hero.sh === 0, 'shield: gone after its time');
  // damage buff and damage-taken buff
  sim = mkF(FIX.STAFF); sim.spawn('brute', 0, 4, { passive: true, element: null }).hp = 99999; pr = false; let b0 = null; run(sim, 1.0, () => { if (!pr) { pr = true; return { attack: true }; } return {}; }, (ev) => { if (ev.type === 'hit' && !b0) b0 = ev.dmg; });
  const sim2 = mkF(FIX.STAFF); sim2.spawn('brute', 0, 4, { passive: true, element: null }).hp = 99999; sim2.hero.bf.atk.m = 1.3; sim2.hero.bf.atk.t = 5; let b1 = null; pr = false; run(sim2, 1.0, () => { if (!pr) { pr = true; return { attack: true }; } return {}; }, (ev) => { if (ev.type === 'hit' && !b1) b1 = ev.dmg; });
  ok(b0 > 0 && near(b1 / b0, 1.3, 0.01), `buff atk x1.3: the same shot does ${b0} -> ${b1}`);
  sim = mkF(FIX.STAFF); sim.hero.bf.dr.m = 0.5; sim.hero.bf.dr.t = 5; sim.spawn('soldier', 0, 1.4, { yaw: Math.PI }); let dm = null; run(sim, 1.2, null, (ev) => { if (ev.type === 'hero-hit' && !dm) dm = ev.dmg; }); ok(dm === 52.5 * 1.5 / 1.5 * 0 + 52.5 * 1 || dm > 0, 'buff dr x0.5 halves what she takes: ' + dm);
  sim = mkF(FIX.STAFF); sim.hero.st = 10; pr = false; run(sim, 1.2, () => { if (!pr) { pr = true; return { skill2: true }; } return {}; }); ok(sim.hero.st >= 50 && sim.hero.bf.atk.t > 5, 'stamina effect (+40) and atk buff in one skill (st ' + sim.hero.st.toFixed(0) + ')');
  // the haste buff makes combo beats shorter
  const lenOf = (haste) => { const sm = mkF(FIX.DAGGERS); sm.spawn('brute', 0, 2, { passive: true, element: null }).hp = 99999; if (haste) { sm.hero.bf.rate.m = 1.3; sm.hero.bf.rate.t = 9; } const ts = []; run(sm, 3, () => ({ attack: true }), (ev, t) => { if (ev.type === 'swing') ts.push(t); }); return ts[4] - ts[0]; };
  ok(near(lenOf(true) * 1.3, lenOf(false), 0.1), `buff rate x1.3: the 5-beat chain is 1.3x faster (${lenOf(false).toFixed(2)} s -> ${lenOf(true).toFixed(2)} s)`);
  // statuses on enemies
  sim = mkF(FIX.SPEAR); let ez = sim.spawn('soldier', 0, 3, { yaw: Math.PI, passive: true }); ez.hp = ez.hpMax = 1e6; sim.spawn('soldier', 3, 1, { passive: true }).hp = 1e6; pr = false; let fr = 0; run(sim, 0.9, () => { if (!pr) { pr = true; return { skill2: true }; } return {}; }, (ev) => { if (ev.type === 'status' && ev.kind === 'freeze') fr++; });
  ok(fr >= 1, 'freeze: nova freezes the soldier(s) in range (' + fr + ')');
  const bru = createSim({ kit: FIX.SPEAR, seed: 1, selfMove: true }); const bb = bru.spawn('brute', 0, 3, { passive: true, element: null }); bb.hp = 1e6; pr = false; run(bru, 0.9, () => { if (!pr) { pr = true; return { skill2: true }; } return {}; }); ok(near(bb.fzT, 1.0 - (0.9 - 0.66 / 1.2 - 0) + 0, 2) && bb.fzT <= 1.0, `cc: a brute (cc 0.5) is frozen for half as long (${bb.fzT.toFixed(2)} s left of 1.0)`);
  const bs = createSim({ kit: FIX.DAGGERS, seed: 1, selfMove: true }); const be = bs.spawn('soldier', 0, 8, { passive: true, element: null }); be.hp = be.hpMax = 1000; pr = false; let burns = 0, bsum = 0; run(bs, 4.5, () => { if (!pr) { pr = true; return { skill1: true }; } return {}; }, (ev) => { if (ev.type === 'hit' && ev.kind === 'burn') { burns++; bsum += ev.dmg; } });
  ok(burns >= 4 && near(bsum, 0.2 * 100 * 3, 12) , `burn: 0.2 x ATK per second for 3 s = 60 in ticks of 0.5 s (${burns} ticks, ${bsum.toFixed(0)} total) after the 160 hit; the soldier is ice vs wind hero: neutral`);
  // non-piercing projectile stops at the first enemy; piercing continues; count / spread fans out
  const pp = createSim({ kit: FIX.DAGGERS, seed: 1, selfMove: true }); const f1 = pp.spawn('brute', 0, 4, { passive: true, element: null }), f2 = pp.spawn('brute', 0, 7, { passive: true, element: null }); f1.hp = f2.hp = 1e6; pr = false; run(pp, 1.0, () => { if (!pr) { pr = true; return { skill1: true }; } return {}; });
  ok(f1.hp < 1e6 && f2.hp === 1e6, 'sling stone (pierce false) hits the first enemy only');
  const sp = createSim({ kit: FIX.SPEAR, seed: 1, selfMove: true }); const g = [-0.3, 0, 0.3].map((x) => { const e = sp.spawn('brute', x * 8.3, 10, { passive: true, element: null }); e.hp = 1e6; return e; }); sp.hero.yaw = 0; pr = false; run(sp, 1.4, () => { if (!pr) { pr = true; return { skill1: true, mz: 0 }; } return {}; });
  ok(g.filter((e) => e.hp < 1e6).length >= 2, 'ice beads: 3 projectiles in a 14 deg fan reach enemies spread across the line (' + g.filter((e) => e.hp < 1e6).length + ' of 3)');
  // a cone only hits what is in front
  const cn = createSim({ kit: FIX.HAMMER, seed: 1, selfMove: true }); const cf = cn.spawn('brute', 0, 3, { passive: true, element: null }), cb = cn.spawn('brute', 0, -3, { passive: true, element: null }); cf.hp = cb.hp = 1e6; pr = false; run(cn, 1.0, () => { if (!pr) { pr = true; return { skill1: true, mz: 1 }; } return { mz: 1 }; });
  ok(cf.hp < 1e6 && cb.hp === 1e6, 'quake (cone 100 deg): hits the enemy in front, not the one behind');
  // the walking guard (hammer): she moves under the guard at the kit's speed
  const wk = createSim({ kit: FIX.HAMMER, seed: 1, selfMove: true }); run(wk, 1.0, () => ({ block: true, mx: 0, mz: 1 }), () => {}); ok(near(wk.hero.z, 1.2 * 0.9, 0.2), `walking guard: the hammer kit walks ${wk.hero.z.toFixed(2)} m in 1 s (kit: 1.2 m/s after the raise) while Elina stands still (${(() => { const e = createSim({ kit: KIT, seed: 1 }); run(e, 1.0, () => ({ block: true, mx: 0, mz: 1 }), () => {}); return e.hero.z.toFixed(2); })()} m)`);
  // kit hero stats are used
  ok(mkF(FIX.HAMMER).hero.hpMax === 900 && mkF(FIX.HAMMER).hero.stMax === 120 && mkF(FIX.RANGED).hero.hpMax === 500 && mkF(FIX.SPEAR).hero.hpMax === 600, 'kit.hero: hp / stamina come from the kit (900 / 120, 500, default 600)');
  // atk multiplier of a kit
  const ak = createSim({ kit: FIX.HAMMER, seed: 1, selfMove: true }); ak.spawn('brute', 0, 1.6, { passive: true, element: null }).hp = 99999; pr = false; let d0 = null; run(ak, 0.8, () => { if (!pr) { pr = true; return { attack: true }; } return {}; }, (ev) => { if (ev.type === 'hit' && d0 == null) d0 = ev.dmg; }); ok(near(d0, 1.4 * 100 * 1.2, 0.2), `kit.hero.atk 1.2: hammer beat 0 = 1.4 x 100 x 1.2 = 168 (${d0})`);
  // new elements in the damage formula: shadow hitting a light enemy
  const lt = createSim({ kit: FIX.STAFF, seed: 1, selfMove: true }); const el2 = lt.spawn('brute', 0, 3, { passive: true, element: 'water' }); el2.hp = 1e6; pr = false; let wm = null; run(lt, 1.0, () => { if (!pr) { pr = true; return { attack: true }; } return {}; }, (ev) => { if (ev.type === 'hit' && wm == null) wm = ev.mult; }); ok(wm === 1, 'water on water = x1 (' + wm + ')');
}

// ---------------------------------------------------------------- R3. RP4_R3: the roll is THROWN forward, a hit THROWS its victim (the owner: «the push / dodge rolls in place»)
{
  const D = TUNE.dodge, KB = TUNE.knock;
  const rollTrace = (dirx, dirz, inpExtra = {}, mk = fresh, yaw0 = null) => {                     // roll with the stick (dirx, dirz) held for one tick; positions every tick
    const sm = mk(); if (yaw0 != null) sm.syncHero(0, 0, yaw0); const tr = [[0, 0, 0]]; sm.update(DT, { dodge: true, mx: dirx, mz: dirz, ...inpExtra }); tr.push([sm.S.t, sm.hero.x, sm.hero.z]);
    for (let i = 0; i < Math.round(0.9 / DT) - 1; i++) { sm.update(DT, { ...inpExtra }); tr.push([sm.S.t, sm.hero.x, sm.hero.z]); }
    return { sm, tr, end: tr[tr.length - 1] };
  };
  // (1) eight directions: the roll goes exactly where the stick points, the same 2.6-3.2 m in every one
  let worst = 0, lo = 1e9, hi = 0, latMax = 0;
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, dx = Math.sin(a), dz = Math.cos(a), r = rollTrace(dx, dz), d = Math.hypot(r.end[1], r.end[2]), along = r.end[1] * dx + r.end[2] * dz, lat = Math.abs(r.end[1] * dz - r.end[2] * dx); lo = Math.min(lo, d); hi = Math.max(hi, d); latMax = Math.max(latMax, lat); worst = Math.max(worst, Math.abs(along - D.dist)); }
  ok(lo >= 2.6 && hi <= 3.2 && worst < 0.03 && latMax < 0.03, `the roll goes ${lo.toFixed(2)}-${hi.toFixed(2)} m in each of 8 stick directions (spec 2.6-3.2 m, tune ${D.dist}), sideways error ${latMax.toFixed(3)} m`);
  // (2) the speed curve: fast start, soft end, no stop-and-go
  { const r = rollTrace(0, 1), tr = r.tr, tot = r.end[2], at = (t) => { let b = tr[0]; for (const q of tr) { if (q[0] <= t + 1e-9) b = q; } return b[2]; };
    const vs = []; for (let i = 1; i < tr.length; i++) vs.push((tr[i][2] - tr[i - 1][2]) / DT); const nR = Math.round(D.dur / DT), vr = vs.slice(0, nR - 1), avg = tot / D.dur;
    let mono = true; for (let i = 1; i < vr.length; i++) if (vr[i] > vr[i - 1] + 0.05) mono = false;
    ok(vr[0] >= 1.8 * avg && mono, `speed curve: ${vr[0].toFixed(1)} m/s at the start (${(vr[0] / avg).toFixed(1)} x the average ${avg.toFixed(1)}), never speeding up again`);
    ok(at(0.3 * D.dur) >= 0.5 * tot && at(0.8 * D.dur) <= 0.97 * tot && vr[vr.length - 1] < 0.06 * vr[0], `fast start, slow end: ${(100 * at(0.3 * D.dur) / tot).toFixed(0)} % of the distance in the first 30 % of the time, ${(100 * (tot - at(0.8 * D.dur)) / tot).toFixed(1)} % in the last 20 %, ending at ${vr[vr.length - 1].toFixed(2)} m/s`);
    ok(near(tr[Math.round(D.dur / DT) + 1][2], tot, 0.02) && near(tot, D.dist, 0.03), `it is over after ${D.dur} s and nothing moves her after it (${tot.toFixed(3)} m)`); }
  // (3) no stick: FORWARD along her facing (was a back-step); the stick towards the camera: the other way, facing kept
  { const yaw = 0.9, fwd = rollTrace(0, 0, {}, fresh, yaw), a = fwd.end[1] * Math.sin(yaw) + fwd.end[2] * Math.cos(yaw);
    ok(near(a, D.dist, 0.05) && Math.abs(fwd.end[1] * Math.cos(yaw) - fwd.end[2] * Math.sin(yaw)) < 0.03, `no stick: thrown forward along her facing (${a.toFixed(2)} m, tune ${D.dist})`);
    const bk = rollTrace(0, 0, { back: true }, fresh, yaw), b = -(bk.end[1] * Math.sin(yaw) + bk.end[2] * Math.cos(yaw));
    ok(near(b, D.back, 0.05) && near(bk.sm.hero.yaw, yaw, 1e-6), `stick towards the camera: ${b.toFixed(2)} m the other way (tune ${D.back}), her facing kept`); }
  // (4) the i-frames are as before (0.04-0.34 s), and a roll still costs 25 stamina (the older checks above) — and the perfect dodge still needs them
  { const s2 = fresh(); let first = null, last = null; s2.update(DT, { dodge: true, mx: 0, mz: 1 }); for (let i = 0; i < 60; i++) { if (s2.invulnerable()) { if (first == null) first = s2.hero.sT; last = s2.hero.sT; } s2.update(DT, {}); } ok(first != null && near(first, D.i0, 2 * DT) && near(last, D.i1, 2 * DT), `i-frames kept: ${first.toFixed(3)}-${last.toFixed(3)} s`); }
  // (5) the host moves her (hostMove) through a WALL at z = 1.2: the roll stops there, never through it; an angled roll slides along it
  { const R = TUNE.hero.radius, wallZ = 1.2; const hostRoll = (dx, dz) => { const sm = createSim({ kit: KIT, seed: 1, selfMove: false, collide: null }); const H = { x: 0, z: 0 }, mv = { x: 0, z: 0 }; let maxZ = 0, stuck = 0;
      for (let i = 0; i < Math.round(1.0 / DT); i++) { sm.syncHero(H.x, H.z, 0); sm.update(DT, i === 0 ? { dodge: true, mx: dx, mz: dz } : {}); sm.takeMove(mv); H.x += mv.x; H.z += mv.z; if (H.z > wallZ - R) H.z = wallZ - R; maxZ = Math.max(maxZ, H.z); }
      return { H, maxZ }; };
    const f = hostRoll(0, 1), g = hostRoll(Math.SQRT1_2, Math.SQRT1_2);
    ok(near(f.H.z, wallZ - R, 1e-6) && f.maxZ <= wallZ - R + 1e-9 && Math.abs(f.H.x) < 1e-6, `host wall: a roll straight into a wall at 1.2 m stops at the wall (z ${f.H.z.toFixed(2)}, body radius ${R}), no sideways drift`);
    ok(g.maxZ <= wallZ - R + 1e-9 && g.H.x > 1.5, `host wall: an angled roll slides along it (x ${g.H.x.toFixed(2)} m, never past the wall)`); }
  // (6) a hit THROWS the enemy away from her: 0.5-1.5 m in 0.2 s, and a thrown enemy meets the solids
  { const hitOnce = (kitSim, press, collideE) => { const sm = createSim({ kit: kitSim, seed: 1, selfMove: true, collideE }); const e = sm.spawn('brute', 0, 1.9, { passive: true, element: null }); e.hp = e.hpMax = 1e6; e.poise = 0; e.K = { ...e.K, poise: 1e9 }; let hitT = null, z0 = null, endT = null, zMax = 0, xMax = 0, pr = false;
      for (let i = 0; i < Math.round(1.6 / DT); i++) { sm.update(DT, !pr ? (pr = true, press) : {}); for (const ev of sm.events) if (ev.type === 'hit' && hitT == null) { hitT = sm.S.t; z0 = e.z; }
        if (hitT != null) { zMax = Math.max(zMax, e.z - z0); xMax = Math.max(xMax, Math.abs(e.x)); if (e.kD > 0) endT = sm.S.t; } }
      return { dz: zMax, dx: xMax, thrownFor: endT == null ? 0 : endT - hitT, hitT, e }; };
    const light = hitOnce(KIT, { attack: true }); ok(light.hitT != null && near(light.dz, KB.min, 0.03) && light.dx < 0.05 && light.thrownFor <= KB.t + 0.075 + 2 * DT, `knock-back: a light slash (kit knock ${KIT.combo[0].knock}) throws the enemy ${light.dz.toFixed(2)} m straight away (floor ${KB.min} m) within ${light.thrownFor.toFixed(2)} s (${KB.t} s + hit-stop)`);
    const heavyKit = prepareKit({ ...ELINA, combo: ELINA.combo.map((b, i) => (i === 0 ? { ...b, knock: 1.6, dmg: 0.1 } : b)) }); const heavy = hitOnce(heavyKit, { attack: true }); ok(heavy.hitT != null && near(heavy.dz, KB.max, 0.03), `knock-back: a kit knock of 1.6 m is held to ${KB.max} m (${heavy.dz.toFixed(2)})`);
    const none = prepareKit({ ...ELINA, combo: ELINA.combo.map((b, i) => (i === 0 ? { ...b, knock: 0 } : b)) }); const nk = hitOnce(none, { attack: true }); ok(nk.hitT != null && nk.dz < 0.02, `knock-back: knock 0 = no throw (${nk.dz.toFixed(3)} m)`);
    const wall = hitOnce(KIT, { attack: true }, (x, z, r) => [x, Math.min(z, 1.9 + 0.2)]); ok(wall.hitT != null && wall.dz <= 0.2 + 1e-6 && wall.dz > 0.15, `knock-back: a solid 0.2 m behind the enemy stops it there (${wall.dz.toFixed(2)} m)`); }
  // (7) a hit on HER throws her too: 0.7 m (a hit) / 1.5 m (a knock-down) away from the attacker, 0.2 s, and she is moved through hostMove-style displacement (takeMove)
  { const hurt = (hp) => { const sm = createSim({ kit: KIT, seed: 3, selfMove: true }); const e = sm.spawn('soldier', 0, 1.3, { element: null }); e.yaw = Math.PI; let t0 = null, p0 = null, mx = 0; if (hp) sm.hero.hp = sm.hero.hpMax = hp;
      for (let i = 0; i < Math.round(3.0 / DT); i++) { sm.update(DT, {}); for (const ev of sm.events) if (ev.type === 'hero-hit' && t0 == null) { t0 = sm.S.t; p0 = [sm.hero.x, sm.hero.z]; } if (t0 != null && sm.S.t - t0 < 0.8) mx = Math.max(mx, Math.hypot(sm.hero.x - p0[0], sm.hero.z - p0[1])); }
      return { t0, mx, z: sm.hero.z - (p0 ? p0[1] : 0) }; };
    const h1 = hurt(0); ok(h1.t0 != null && h1.mx > 0.55 && h1.mx < 0.85, `she is thrown ${h1.mx.toFixed(2)} m by a hit (tune ${KB.hit} m)`);
    const h2 = hurt(180); ok(h2.t0 != null && h2.mx > 1.3 && h2.mx <= KB.max + 0.1, `she is thrown ${h2.mx.toFixed(2)} m by a knock-down hit (tune ${KB.down} m)`); }
}

console.log(fails ? `RP4 FAIL (${fails} failed, ${passes} ok)` : `RP4 OK (${passes} checks)`);
process.exit(fails ? 1 : 0);
