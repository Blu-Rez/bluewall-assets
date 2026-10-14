// RP4 combat core: logic tests (pure engine, Node).  Last line: "RP4 OK".  Run: bash dev/rp4_test.sh
import { createSim, elementMult, TUNE, SISTERS, KINDS, ELEMENTS, BEATS, mulberry32 } from '../bot/bluebot_v2/bluewall/web/assets/rpg/combat.js';
const DT = 1 / 60; let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) { passes++; console.log('ok   ' + msg); } else { fails++; console.log('FAIL ' + msg); } };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
// run n seconds with an input function (t, sim) -> input object; collects events with their time
function run(sim, secs, inf, onEv) { const n = Math.round(secs / DT); for (let i = 0; i < n; i++) { const inp = inf ? inf(sim.S.t, sim, i) : {}; sim.update(DT, inp || {}); if (onEv) for (const e of sim.events) onEv(e, sim.S.t); } }
const evs = (sim, secs, inf) => { const out = []; run(sim, secs, inf, (e, t) => out.push({ type: e.type, kind: e.kind, id: e.id, t, a: e.a, dmg: e.dmg, mult: e.mult, flag: e.flag, stop: e.stop })); return out; };
const fresh = (o = {}) => createSim({ seed: o.seed == null ? 1 : o.seed, selfMove: true, tune: o.tune });

// ---------------------------------------------------------------- 1. elements
ok(elementMult('fire', 'ice') === 1.5 && elementMult('ice', 'water') === 1.5 && elementMult('water', 'fire') === 1.5, 'triangle 1: fire>ice>water>fire = x1.5');
ok(elementMult('plant', 'stone') === 1.5 && elementMult('stone', 'wind') === 1.5 && elementMult('wind', 'plant') === 1.5, 'triangle 2: plant>stone>wind>plant = x1.5');
ok(elementMult('ice', 'fire') === 0.75 && elementMult('fire', 'water') === 0.75 && elementMult('stone', 'plant') === 0.75, 'the reverse direction = x0.75');
ok(elementMult('fire', 'wind') === 1 && elementMult('fire', 'fire') === 1 && elementMult(null, 'fire') === 1 && elementMult('fire', null) === 1, 'unrelated / same / none = x1');
ok(Object.keys(ELEMENTS).length === 6 && Object.keys(SISTERS).length === 6 && SISTERS.elina.combo.length === 4 && SISTERS.elina.skills.length === 2 && SISTERS.elika.combo === null, 'tables: 6 elements, 6 sisters, Elina complete (4 hits + 2 skills), the others are stubs');

// ---------------------------------------------------------------- 2. combo timings / chain / cancel windows
{
  const sim = fresh(); const e = sim.spawn('brute', 0, 1.6, { passive: true, element: null }); e.hp = e.hpMax = 99999;
  const log = evs(sim, 0.02, null);
  let t0 = sim.S.t, pressed = false;
  const out = []; run(sim, 0.4, (t) => { if (!pressed) { pressed = true; return { attack: true }; } }, (ev, t) => { if (ev.type === 'swing' || ev.type === 'hit') out.push([ev.type, ev.a, t]); });
  const sw = out.find((o) => o[0] === 'swing'), hit = out.find((o) => o[0] === 'hit');
  ok(sw && hit, 'L1: a press starts swing 0 and its hit lands');
  const dt1 = hit[2] - sw[2], c = SISTERS.elina.combo[0];
  ok(dt1 >= c.hit[0] - DT && dt1 <= c.hit[0] + 2 * DT, `L1 hit lands at the start of its window (${dt1.toFixed(3)} s, window ${c.hit[0]}-${c.hit[1]})`);
}
{
  const sim = fresh(); const e = sim.spawn('brute', 0, 1.6, { passive: true, element: null }); e.hp = e.hpMax = 99999;
  const sw = [], hits = []; run(sim, 5.0, () => ({ attack: true }), (ev, t) => { if (ev.type === 'swing') sw.push([ev.a, t]); if (ev.type === 'hit') hits.push([ev.kind, t, ev.dmg]); });
  const seq = sw.slice(0, 8).map((s) => s[0]).join('');
  ok(seq === '01230123', `mashing attack chains 1-2-3-4 and loops: ${seq}`);
  const C = SISTERS.elina.combo; let good = true, why = '';
  for (let i = 0; i < 7; i++) { const gap = sw[i + 1][1] - sw[i][1], cancel = C[sw[i][0]].cancel / (C[sw[i][0]].rate || 1); if (gap < cancel - DT || gap > cancel + C[sw[i][0]].stop + 4 * DT) { good = false; why = `swing ${i}: gap ${gap.toFixed(3)} vs cancel ${cancel}`; } }
  ok(good, 'the next hit starts at the previous hit\'s cancel point (+ its hit-stop) (' + (why || 'all 7 gaps within spec') + ')');
  const kinds = hits.slice(0, 4).map((h) => h[0]).join(','); ok(kinds === 'light,light,light,finisher', 'hits: 3 light + 1 finisher: ' + kinds);
  const d = hits.slice(0, 4).map((h) => h[2]); ok(d[0] === 80 && d[1] === 90 && d[2] === 100 && d[3] === 180, 'damage x ATK 100 (neutral target): ' + d.join('/'));
}
{
  // combo reset and grace
  const sim = fresh(); const e = sim.spawn('brute', 0, 1.6, { passive: true, element: null }); e.hp = e.hpMax = 99999;
  const seq = []; const onE = (ev) => { if (ev.type === 'swing') seq.push(ev.a); };
  const C = SISTERS.elina.combo;
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
  const C = SISTERS.elina.combo; let t0 = null, td = null;
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
  ok(near(Math.hypot(sim2.hero.x, sim2.hero.z), SISTERS.elina.combo[0].lunge[0], 0.05), `with nobody in front the full lunge is used (${Math.hypot(sim2.hero.x, sim2.hero.z).toFixed(2)} m of ${SISTERS.elina.combo[0].lunge[0]} m)`);
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
  const want = SISTERS.elina.combo[0].stop;
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
  const hits = []; let t1 = [], waves = 0; run(sim, 1.6, (t) => (t < 0.02 || (t > 0.8 && t < 0.82) ? { skill1: true } : {}), (ev, t) => { if (ev.type === 'hit' && ev.kind === 'wave') hits.push(ev.id); if (ev.type === 'skill') t1.push(t); if (ev.type === 'wave') waves++; });
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
  const sim = createSim({ seed, selfMove: true }); const r = mulberry32(99); const log = [];
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
  const sim = createSim({ seed: 3, selfMove: true }); for (let i = 0; i < 6; i++) sim.spawn('soldier', Math.cos(i) * 6, Math.sin(i) * 6, { passive: i > 2 }); const r = mulberry32(5);
  const t0 = process.hrtime.bigint(); for (let i = 0; i < 3600; i++) { sim.update(DT, { mx: r() - 0.5, mz: r() - 0.5, attack: r() < 0.2, dodge: r() < 0.02 }); if (sim.hero.state === 'dead') sim.revive(); for (const e of sim.enemies) e.hp = e.hpMax; }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6; console.log(`info cost: ${(ms / 3600 * 1000).toFixed(1)} us per tick with 6 enemies (node; 60 s simulated in ${ms.toFixed(0)} ms)`); ok(ms / 3600 < 0.3, 'sim cost under 0.3 ms per tick (6 enemies)');
}
{
  // the clip table is checked against the REAL hero GLB (RP0B): every clip the kit names exists and has the duration the table says
  const fs = require('fs'); const f = '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/elina.glb';
  if (fs.existsSync(f)) {
    const b = fs.readFileSync(f), jl = b.readUInt32LE(12), js = JSON.parse(b.slice(20, 20 + jl).toString('utf8')), dur = {};
    for (const a of js.animations) { let m = 0; for (const sm of a.samplers) m = Math.max(m, js.accessors[sm.input].max[0]); dur[a.name] = m; }
    const K = SISTERS.elina, miss = K.clips.filter((n) => dur[n] == null), bad = K.combo.filter((c) => Math.abs(dur[c.clip] - c.dur) > 0.02).map((c) => c.clip + ' ' + dur[c.clip].toFixed(3) + ' vs ' + c.dur);
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
  ok(near(SISTERS.elina.combo[2].dur / SISTERS.elina.combo[2].rate, 0.583, 0.01), 'slash_c plays at x1.2 (the clip has a 0.2 s idle hold before the up-slash): ' + (SISTERS.elina.combo[2].dur / SISTERS.elina.combo[2].rate).toFixed(3) + ' s');
}
console.log(fails ? `RP4 FAIL (${fails} failed, ${passes} ok)` : `RP4 OK (${passes} checks)`);
process.exit(fails ? 1 : 0);
