// AU1 logic test (node, mocks): the REAL audio.js + tod.js run on a virtual clock.
//   A  48 game hours (= 2 real hours, 7200 s): no animal sound (cow / horse / dog / sheep / pig / rooster) while it is dark, animals DO sound by day,
//      owl only at night, castle bell once per game day, a constant-night sweep around the ANIMAL_DAY threshold
//   B  music: fade-in >= 1.8 s, the old track fades >= 2.4 s and the next one is loaded only when it is silent, never two audible tracks, no gain jumps,
//      rapid mode flips -> ONE change, end-of-track fade, hidden tab (suspended context) -> no restart storm, error skip, dwell + hysteresis, hour windows
import { CLK, MockEl, MockAC, step, flush } from './au1_mocks.js';
import { Ambience, TRACKS, MUSIC, ANIMAL_DAY, ONESHOT_MAX } from '../bot/bluebot_v2/bluewall/client/src/audio.js';
import { gameHour, sample } from '../bot/bluebot_v2/bluewall/client/src/tod.js';

let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log('FAIL ' + msg); } };
const info = (m) => console.log('  ' + m);
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ANIMALS = new Set(['sfx_neigh', 'sfx_neigh2', 'sfx_moo', 'sfx_bark', 'sfx_rooster']);      // (sheep / pig have no files in this build; same gate)
const HOUR_MS = 3600000;
const wallAtGameHour = (gh) => { let lo = 0, hi = HOUR_MS; const b = Math.floor(CLK.wall / HOUR_MS) * HOUR_MS; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; (gameHour(b + m) < gh && gameHour(b + m) > 4.5 ? lo = m : hi = m); } return b + hi; };

const world = { weather: { W: { rain: 0, wind: 0.3, cover: 0.2, kind: 'clear' } }, takeThunder: () => [] };
const camera = { position: { y: 60 } };
async function make(seed) {
  Math.random = mulberry(seed);
  const a = new Ambience(); a.on = true; MockEl.onSrc = null;
  a.gate = true; a.prepare('day'); a.unlock(); await flush();
  return a;
}
const gain = (a) => a.tg.gain.valueAt(a.ctx.currentTime);

// ================================================================== A: 48 game hours
async function sim48(seed) {
  CLK.wall = wallAtGameHour(7.3); const w0 = CLK.wall;
  const a = await make(seed); a.ctx.log.length = 0;
  const log = a.ctx.log; const rec = []; const orig = a.choose.bind(a); a.choose = () => { const n = orig(); rec.push({ n, mode: a.mode, hour: a.hourNow() }); return n; };
  const chg = []; let maxStep = 0, last = null, maxAud = 0, dLvl = 0;
  MockEl.onSrc = (el, v) => { chg.push({ at: CLK.wall, g: gain(a), v }); };
  const END = 48 * HOUR_MS / 24;                                           // 48 game hours = 2 real hours
  for (let t = 0; t < END; t += 250) {
    const P = sample(gameHour());
    a.update(0.25, { P, world, camera });
    for (let k = 0; k < 5; k++) {
      step(a, 0.05); const g = gain(a);
      if (last != null) maxStep = Math.max(maxStep, Math.abs(g - last)); last = g;
      dLvl = Math.max(dLvl, Math.abs(g - a.level()));
      maxAud = Math.max(maxAud, g > 0.01 ? 1 : 0);
    }
  }
  const byName = {}; let nightAnimal = 0, dayAnimal = 0, owlDay = 0, owls = 0, minDayAnimal = 1;
  for (const e of log) {
    byName[e.name] = (byName[e.name] || 0) + 1;
    const P = sample(gameHour(e.wall)), day = 1 - P.night;
    if (ANIMALS.has(e.name)) { if (day > ANIMAL_DAY) { dayAnimal++; minDayAnimal = Math.min(minDayAnimal, day); } else nightAnimal++; }
    if (e.name === 'sfx_owl') { owls++; if (P.night <= 0.6) owlDay++; }
  }
  return { a, byName, nightAnimal, dayAnimal, owls, owlDay, chg, maxStep, dLvl, rec, w0 };
}

console.log('A  48 game hours');
for (const seed of [1, 2, 3]) {
  const r = await sim48(seed);
  info(`seed ${seed}: animals by day ${r.dayAnimal}, at night ${r.nightAnimal}, owls ${r.owls}, bell ${r.byName.sfx_bell || 0}, rooster ${r.byName.sfx_rooster || 0}, anvil ${r.byName.sfx_anvil || 0}, track changes ${r.chg.length}`);
  ok(r.nightAnimal === 0, `seed ${seed}: ${r.nightAnimal} animal sounds while it was dark`);
  ok(r.dayAnimal >= 20, `seed ${seed}: only ${r.dayAnimal} animal sounds by day (the daytime life must stay)`);
  ok(r.owls >= 10 && r.owlDay === 0, `seed ${seed}: owls ${r.owls}, in the day ${r.owlDay}`);
  ok((r.byName.sfx_bell || 0) === 2, `seed ${seed}: bell ${(r.byName.sfx_bell || 0)} times in 48 game hours (want exactly 2 = once per game day)`);
  ok((r.byName.sfx_rooster || 0) === 2, `seed ${seed}: rooster ${(r.byName.sfx_rooster || 0)} times (want 2: dawn of each day)`);
  const bad = r.chg.filter((c, i) => i > 0 && c.g > 0.004);
  ok(bad.length === 0, `seed ${seed}: ${bad.length} track changes while the old one was still audible`);
  ok(r.maxStep <= 0.2, `seed ${seed}: biggest level step per 50 ms = ${r.maxStep.toFixed(3)} (want <= 0.2: no jumps)`);
  ok(r.dLvl < 0.02, `seed ${seed}: level bookkeeping differs from the real automation by ${r.dLvl.toFixed(3)}`);
  const badWin = r.rec.filter((x) => { const L = TRACKS.filter((t) => t.modes.includes(x.mode)); const inWin = (t) => !t.hours || (t.hours[0] <= t.hours[1] ? x.hour >= t.hours[0] && x.hour < t.hours[1] : x.hour >= t.hours[0] || x.hour < t.hours[1]); const el = L.filter(inWin); const pool = el.length ? el : L; return !pool.some((t) => t.n === x.n); });
  ok(badWin.length === 0, `seed ${seed}: ${badWin.length} picks outside their hour window, e.g. ${JSON.stringify(badWin[0])}`);
  // night / day music mode follows the light (a few seconds of lag at most: dwell + fade)
  ok(r.chg.length >= 20 && r.chg.length <= 200, `seed ${seed}: ${r.chg.length} track changes in 2 h (expected 20..200)`);
  if (seed === 1) {
    const modes = {}; for (const x of r.rec) modes[x.mode] = (modes[x.mode] || 0) + 1; info('picks by mode ' + JSON.stringify(modes));
    const names = {}; for (const x of r.rec) names[x.n] = (names[x.n] || 0) + 1; info('picks ' + JSON.stringify(names));
    info(`max level step per 50 ms ${r.maxStep.toFixed(3)} · at track changes the old gain was <= ${Math.max(0, ...r.chg.slice(1).map((c) => c.g)).toExponential(1)}`);
    ok(TRACKS.every((t) => names[t.n] > 0 || t.modes.includes('storm')), 'every calm / day / night track gets played in 48 game hours');
  }
}

// constant light: around the threshold (animals need day > ANIMAL_DAY = 0.55 <=> night < 0.45)
console.log('A2 constant light');
for (const [night, hour, want] of [[1, 2, false], [0.7, 22, false], [0.5, 19.2, false], [0.46, 5.2, false], [0.44, 6, true], [0.2, 8, true], [0, 12, true]]) {
  CLK.wall = wallAtGameHour(10);
  const a = await make(7); a.ctx.log.length = 0; let n = 0;
  const P = { night, hour };
  for (let t = 0; t < 7200; t += 0.25) { a.update(0.25, { P, world, camera }); step(a, 0.25); }
  for (const e of a.ctx.log) if (ANIMALS.has(e.name)) n++;
  info(`night=${night}: ${n} animal sounds in 2 h`);
  ok(want ? n > 50 : n === 0, `night=${night}: animal sounds ${n} (want ${want ? '> 50' : '0'})`);
}

// ================================================================== B: music
console.log('B  music');
const settle = (a, secs) => { for (let t = 0; t < secs; t += 0.05) step(a, 0.05); };
async function fresh() { CLK.wall = wallAtGameHour(10); const a = await make(11); a.hour = 10; settle(a, 6); return a; }
function watch(a) {
  const w = { ch: [], samples: [] }; MockEl.onSrc = (el, v) => w.ch.push({ t: a.ctx.currentTime, g: gain(a), v });
  w.run = (secs, dt = 0.05) => { for (let t = 0; t < secs; t += dt) { step(a, dt); w.samples.push({ t: a.ctx.currentTime, g: gain(a) }); } };
  return w;
}
const timeToReach = (w, from, thr) => { const s = w.samples.find((x) => x.t > from && x.g >= thr); return s ? s.t - from : Infinity; };

{ // B1: a mode change -> fade out, then the next, then fade in
  const a = await fresh(); const w = watch(a); const tr = a.trim(a.cur);
  info(`start: playing ${a.cur} at level ${gain(a).toFixed(3)} (trim ${tr})`);
  ok(Math.abs(gain(a) - tr) < 0.02 * Math.max(1, tr), `B1: the first track reaches its level (${gain(a).toFixed(3)} vs ${tr})`);
  const t0 = a.ctx.currentTime; a.playMode('night'); w.run(8);
  ok(w.ch.length === 1, `B1: ${w.ch.length} source changes for one mode change (want 1)`);
  const c = w.ch[0] || { t: 0, g: 1 };
  ok(c.g <= 0.004, `B1: the next track was loaded while the old one was still at ${c.g.toFixed(4)}`);
  ok(c.t - t0 >= 2.4 && c.t - t0 <= 2.8, `B1: the old track faded for ${(c.t - t0).toFixed(2)} s before the switch (want 2.4 - 2.8)`);
  const tn = a.trim(a.cur), fi = timeToReach(w, c.t, 0.95 * tn);
  ok(fi >= 1.8 && fi <= 2.4, `B1: fade-in took ${fi.toFixed(2)} s to 95 % (want 1.8 - 2.4)`);
  ok(TRACKS.find((x) => x.n === a.cur).modes.includes('night'), `B1: ${a.cur} is not a night track`);
  const before = w.samples.filter((s) => s.t > t0 && s.t < c.t); ok(before.every((s, i) => i === 0 || s.g <= before[i - 1].g + 1e-9), 'B1: the level only falls during the fade-out');
  info(`B1: fade-out ${(c.t - t0).toFixed(2)} s, then ${a.cur}, fade-in ${fi.toFixed(2)} s to 95 %`);
}
{ // B2: rapid flips -> one change, the last wish
  const a = await fresh(); const w = watch(a); a.playMode('night'); w.run(1); a.playMode('storm'); w.run(0.7); a.playMode('day'); w.run(0.5); a.playMode('night'); w.run(8);
  ok(w.ch.length === 1, `B2: ${w.ch.length} source changes for four quick mode flips (want 1)`);
  ok(w.ch[0] && w.ch[0].g <= 0.004, 'B2: the switch happened at a silent moment');
  ok(a.mode === 'night' && TRACKS.find((x) => x.n === a.cur).modes.includes('night'), `B2: ended on ${a.cur} (mode ${a.mode}), want a night track`);
  let mx = 0; for (let i = 1; i < w.samples.length; i++) mx = Math.max(mx, Math.abs(w.samples[i].g - w.samples[i - 1].g)); ok(mx <= 0.2, `B2: level step ${mx.toFixed(3)} per 50 ms`);
}
{ // B3: a flip in the middle of a fade-IN: start fading out from the current level, never a jump up
  const a = await fresh(); a.playMode('night'); const w = watch(a); w.run(2.6 + 0.9);          // the new track is 0.9 s into its fade-in
  const lvl = gain(a); a.playMode('day'); const t0 = a.ctx.currentTime; w.run(0.05);
  ok(Math.abs(gain(a) - lvl) < 0.05, `B3: the level jumped from ${lvl.toFixed(3)} to ${gain(a).toFixed(3)} when the mode flipped mid fade-in`);
  w.run(8); ok(w.ch.length === 2 && w.ch[1].g <= 0.004, `B3: ${w.ch.length} changes (want 2), second at level ${w.ch[1] ? w.ch[1].g.toFixed(4) : '-'}`);
}
{ // B4: the track ends by itself
  const a = await fresh(); const w = watch(a); const d = a.el.duration; a.el.currentTime = d - 6; const t0 = a.ctx.currentTime; w.run(8);
  ok(w.ch.length >= 1, 'B4: no next track after the end'); const c = w.ch[0] || { g: 1, t: 0 };
  ok(c.g <= 0.004, `B4: the next track started while the level was ${c.g.toFixed(4)}`);
  const at = (x) => (w.samples.find((q) => q.t >= x) || { g: 9 }).g; ok(at(t0 + 4.5) < 0.3 * a.trim(w.ch[0] ? a.cur : a.cur) + 0.3 && at(t0 + 4.5) < 0.35 && at(t0 + 5.9) < 0.02, `B4: the tail is fading: ${at(t0 + 4.5).toFixed(3)} 1.5 s before the end, ${at(t0 + 5.9).toFixed(4)} 0.1 s before`);
  let mx = 0; for (let i = 1; i < w.samples.length; i++) mx = Math.max(mx, Math.abs(w.samples[i].g - w.samples[i - 1].g)); ok(mx <= 0.2, `B4: level step ${mx.toFixed(3)} per 50 ms across the end of a track`);
  const fi = c.t ? timeToReach(w, c.t, 0.95 * a.trim(a.cur)) : 99; ok(fi >= 1.8 && fi <= 2.4, `B4: the next track faded in over ${fi.toFixed(2)} s`);
}
{ // B5: hidden tab: context suspended in the middle of a fade-out
  const a = await fresh(); const w = watch(a); a.playMode('night'); w.run(1); const src = a.el.src;
  a.pause(true); const t1 = a.ctx.currentTime; for (let i = 0; i < 12000; i++) step(a, 0.05);                       // 10 virtual minutes hidden
  ok(a.ctx.currentTime === t1, 'B5: the audio clock ran while hidden'); ok(a.el.src === src && w.ch.length === 0, `B5: ${w.ch.length} source changes while hidden (want 0)`);
  a.pause(false); w.run(6);
  ok(w.ch.length === 1 && w.ch[0].g <= 0.004, `B5: after the tab returned: ${w.ch.length} changes (want exactly 1, silent)`);
  w.run(120); ok(w.ch.length <= 3, `B5: ${w.ch.length} changes in the next 2 min (no restart storm)`);
}
{ // B6: a file that fails: skip to the next after 0.8 s, never more than 5
  const a = await fresh(); const w = watch(a); a.setLevelNow(0); a.el.dispatch('error'); w.run(1.5);
  ok(w.ch.length === 1, `B6: ${w.ch.length} changes after one error (want 1)`);
  for (let i = 0; i < 12; i++) { a.el.dispatch('error'); w.run(1); } ok(w.ch.length <= 6, `B6: ${w.ch.length} skips for 13 errors (want <= 6)`);
}
{ // B7: flickering inputs (rain at the storm threshold, night inside the hysteresis band, slow day/night square wave) through the real update()
  const W = world.weather.W;
  const run = async (seed, secs, inputs) => {
    CLK.wall = wallAtGameHour(10); const a = await make(seed); const w = watch(a), modes = [];
    const am = a.autoMode.bind(a); a.autoMode = (m, now) => { const b = a.mode; am(m, now); if (a.mode !== b) modes.push({ now, m: a.mode }); };
    for (let t = 0; t < secs; t += 0.25) { const i = (t / 0.25) | 0, P = inputs(t, i); a.update(0.25, { P, world, camera }); w.run(0.25, 0.05); }
    W.rain = 0; return { a, w, modes };
  };
  const gapsOk = (modes) => modes.slice(1).every((x, i) => x.now - modes[i].now >= MUSIC.dwell - 0.3);
  let r = await run(5, 600, (t, i) => { W.rain = 0.39 + 0.02 * (i % 2); return { night: 0, hour: 10 }; });
  info(`B7: rain flicker 0.39/0.41 for 10 min: ${r.modes.length} mode changes`); ok(r.modes.length <= 16 && gapsOk(r.modes), `B7: ${r.modes.length} mode changes for rain flicker (dwell ${MUSIC.dwell} s allows <= 16)`);
  r = await run(6, 600, (t, i) => ({ night: 0.5 + 0.2 * (i % 2), hour: 20 }));
  info(`B7: night flicker 0.5/0.7 for 10 min: ${r.modes.length} mode change(s)`); ok(r.modes.length === 1 && r.a.mode === 'night', `B7: night flicker gave ${r.modes.length} mode changes, mode ${r.a.mode} (want 1, night)`);
  r = await run(8, 1200, (t) => ({ night: ((t / 60) | 0) % 2 ? 0.9 : 0.1, hour: 10 }));
  info(`B7: day/night square wave (60 s) for 20 min: ${r.modes.length} mode changes`); ok(r.modes.length >= 18 && gapsOk(r.modes), `B7: square wave: ${r.modes.length} changes, spacing ok ${gapsOk(r.modes)}`);
  ok(r.w.ch.every((c, i) => i === 0 || c.g <= 0.004), 'B7: every switch of the long mixed run was silent');
}
{ // B8: choose(): hour windows, no repeat inside the last two
  const a = await fresh(); let bad = 0, rep = 0, draws = 0;
  const inWin = (t, h) => !t.hours || (t.hours[0] <= t.hours[1] ? h >= t.hours[0] && h < t.hours[1] : h >= t.hours[0] || h < t.hours[1]);
  for (const mode of ['day', 'night', 'storm']) for (let h = 0; h < 24; h += 0.5) {
    a.mode = mode; a.hour = h; a.recent = []; a.cur = null; const all = TRACKS.filter((t) => t.modes.includes(mode)), el = all.filter((t) => inWin(t, h)), pool = el.length ? el : all;
    for (let i = 0; i < 40; i++) { const n = a.choose(); draws++; if (!pool.some((t) => t.n === n)) bad++; if (pool.length > 2 && a.recent.includes(n)) rep++; a.recent.push(n); if (a.recent.length > 2) a.recent.shift(); a.cur = n; }
  }
  ok(bad === 0, `B8: ${bad} of ${draws} picks outside the allowed set`); ok(rep === 0, `B8: ${rep} repeats within the last two tracks`);
  a.mode = 'day'; a.hour = 10; const day10 = new Set(); for (let i = 0; i < 400; i++) { a.recent = []; day10.add(a.choose()); }
  info('B8: day, 10:00 may play ' + [...day10].sort().join(', ')); ok(!day10.has('mus_calm_hearth') && !day10.has('mus_calm_moon') && day10.has('mus_calm_dawn') && day10.has('mus_calm_meadow'), 'B8: windows of the calm tracks hold at 10:00');
  a.hour = 2; a.mode = 'night'; const n2 = new Set(); for (let i = 0; i < 400; i++) { a.recent = []; n2.add(a.choose()); } ok(!n2.has('mus_calm_hearth') && n2.has('mus_calm_moon') && n2.has('mus_night'), `B8: night 02:00 may play ${[...n2].sort()}`);
}
{ // B9: every one-shot has a documented loudest level; the track table points to real files with a real trim
  ok(TRACKS.every((t) => t.g > 0 && t.g <= 1 && t.modes.length), 'B9: TRACKS entries valid');
  const calls = new Set(); const src = ['sfx_thunder1', 'sfx_roar', 'sfx_flap', 'sfx_neigh', 'sfx_neigh2', 'sfx_moo', 'sfx_bark', 'sfx_rooster', 'sfx_owl', 'sfx_bell', 'sfx_anvil', 'sfx_click'];
  ok(src.every((n) => ONESHOT_MAX[n] > 0), 'B9: ONESHOT_MAX covers every sfx');
}

console.log(`${checks - fails}/${checks} checks passed`);
if (fails) { console.log('AU1 LOGIC FAIL'); process.exit(1); }
console.log('AU1 LOGIC OK');
