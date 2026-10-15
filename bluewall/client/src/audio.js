// Sound: music playlist (streamed <audio>, day / night / storm), ambience
// loops that follow time of day and weather (birds, countryside, crickets,
// wind, rain, storm, market, stream), thunder after each lightning strike,
// animal calls near the camera, the castle bell every game hour, dragon roar.
// Buses: master > music / ambience / characters / effects (settings sliders).
import { settings } from './settings.js';
import { gameHour } from './tod.js';
import { WarScore } from './warscore.js';

const BASE = () => (window.BW_ASSETS || '/assets/').replace(/\/?$/, '/') + 'audio/';
const LOOPS = ['amb_birds', 'amb_country', 'amb_night', 'amb_crickets', 'amb_wind', 'amb_wind_strong', 'amb_rain', 'amb_rain_light', 'amb_storm', 'amb_market', 'amb_stream'];
const SFX = ['sfx_thunder1', 'sfx_thunder2', 'sfx_thunder3', 'sfx_thunder4', 'sfx_roar', 'sfx_flap', 'sfx_neigh', 'sfx_neigh2', 'sfx_moo', 'sfx_bark',
  'sfx_rooster', 'sfx_owl', 'sfx_bell', 'sfx_anvil', 'sfx_click'];

// AU1: every music track. n = file in web/assets/audio/<n>.mp3 · modes = which music mode may play it ('day' / 'night' / 'storm') · hours = game-hour window [from, to) it may
// start in (wraps midnight; omitted = any hour) · g = loudness trim so a switch never jumps (old files measured -10 .. -17 LUFS, the new calm ones are mastered at -19 .. -24).
// AU1_SHEET.md numbers the tracks: to drop one the owner says its number and the line goes.
export const TRACKS = [
  { n: 'mus_day1', modes: ['day'], g: 0.5 },
  { n: 'mus_day2', modes: ['day'], g: 1 },
  { n: 'mus_night', modes: ['night'], g: 1 },
  { n: 'mus_epic', modes: ['storm'], g: 0.75 },
  { n: 'mus_calm_dawn', modes: ['day'], hours: [5, 11], g: 1 },
  { n: 'mus_calm_meadow', modes: ['day'], hours: [9, 17], g: 1 },
  { n: 'mus_calm_river', modes: ['day'], hours: [8, 18], g: 1 },
  { n: 'mus_calm_hearth', modes: ['day', 'night'], hours: [16, 22], g: 1 },
  { n: 'mus_calm_moon', modes: ['night'], g: 1 },
];
// AU1: the loudest `vol` the game ever plays each audio file at (the spectrum test scales the decoded file by it)
export const ONESHOT_MAX = { sfx_thunder1: 1, sfx_thunder2: 1, sfx_thunder3: 1, sfx_thunder4: 1, sfx_roar: 0.9, sfx_flap: 0.6, sfx_neigh: 0.7, sfx_neigh2: 0.7, sfx_moo: 0.7, sfx_bark: 0.56,
  sfx_rooster: 0.5, sfx_owl: 0.35, sfx_bell: 0.55, sfx_anvil: 0.3, sfx_click: 0.5 };
// AU1: animals (the calls the owner never wants in the dark) may sound only while this much of the day is bright: dusk and dawn count as night (±0.05 around 0.5)
export const ANIMAL_DAY = 0.55;
export const MUSIC = { fadeOut: 2.5, fadeIn: 2, dwell: 40, nightOn: 0.6, nightOff: 0.45, floor: 0.003 };   // floor = -50 dB: an equal-ratio fade stops there, then the gain drops to 0 (inaudible step)
const hourIn = (w, h) => !w || (w[0] <= w[1] ? h >= w[0] && h < w[1] : h >= w[0] || h < w[1]);

// AU1: the synthesized one-shots as pure functions (context, destination, start time) so the offline spectrum test can render each of them.
export const SYNTH = {
  // a short regal swell + bell, synthesized (no file to wait for): the first thing the player hears
  sting(c, out, t) {
    const note = (f, type, at, att, dur, peak) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t + at);
      g.gain.setValueAtTime(0.0001, t + at); g.gain.linearRampToValueAtTime(peak, t + at + att); g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      o.connect(g); g.connect(out); o.start(t + at); o.stop(t + at + dur + 0.05);
    };
    note(73.4, 'sine', 0, 0.35, 2.4, 0.30); note(110, 'triangle', 0, 0.4, 2.2, 0.12); note(146.8, 'sine', 0.05, 0.4, 2.0, 0.10);
    note(587.3, 'sine', 0.30, 0.01, 1.9, 0.10); note(880, 'sine', 0.38, 0.01, 1.6, 0.06); note(1174.7, 'sine', 0.46, 0.01, 1.2, 0.035);
  },
  thump(c, out, t, vol = 1) {
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(32, t + 0.5);
    g.gain.setValueAtTime(0.9 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.8);
  },
  // a ballista letting go: sharp string slap + a short falling pluck + a breath of air (vol 0..1 already includes distance)
  twang(c, out, t, vol = 1, noiseBuf = null) {
    const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(230, t); o.frequency.exponentialRampToValueAtTime(64, t + 0.5);
    f.type = 'lowpass'; f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(260, t + 0.45);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + 0.6);
    if (!noiseBuf) { const n = c.sampleRate * 0.4, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); noiseBuf = b; }
    const s = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain(); s.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.8;
    ng.gain.setValueAtTime(0.28 * vol, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    s.connect(bp); bp.connect(ng); ng.connect(out); s.start(t);
    return noiseBuf;
  },
  // AU1: collected gems / upgrades. The old one was four triangle notes at 1.3 / 1.6 / 2.0 / 2.6 kHz (the "mosquito ding", 12 dB louder than this).
  // Now: a soft three-note rising arpeggio (wooden-marimba feel) between 520 and 790 Hz, a faint 2nd harmonic, a 12 ms attack, a 1.5 kHz low-pass,
  // about 7 dB quieter. `k` (0 / 1) alternates the key on quick repeats so a run of collects does not machine-gun one pitch.
  coins(c, out, t0, k = 0) {
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = 0.5; lp.connect(out);
    const notes = k ? [587.3, 740, 880] : [523.3, 659.3, 784];
    notes.forEach((f, i) => {
      const t = t0 + i * 0.075;
      for (const [m, a, dur] of [[1, 0.07, 0.32], [2, 0.012, 0.16]]) {
        const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * m, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(a, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(lp); o.start(t); o.stop(t + dur + 0.03);
      }
    });
  },
};

export class Ambience {
  constructor() {
    this.ctx = null; this.on = true; this.buf = {}; this.loops = {}; this.started = false; this.gate = false; this.began = false; this.musicOK = false; this.armed = false;
    try { this.on = localStorage.getItem('bw_sound') !== '0'; } catch (e) { /* storage blocked */ }
    this.timers = { animal: 8, owl: 20, anvil: 6 }; this.lastHour = -1; this.thunderQ = []; this.mode = ''; this.blobs = {}; this.blobWait = {}; this.war = null;
    this.cur = null; this.recent = []; this.want = null; this.phase = ''; this.lv = null; this.modeSince = -1e9; this.hour = null; this.trTimer = 0;   // AU1: music state
  }
  // ---------------------------------------------------------------- start-up
  // prepare(): called while the world is still loading, no gesture needed. Builds the (suspended) context, prefetches and decodes every loop and
  // starts each one silently as soon as ITS OWN buffer is ready. The first tap (arm() listens for it) only has to resume the context, play the
  // music element and fade in, so the sound is there instantly instead of after a long fetch + decode.
  prepare(mode = 'day') {
    if (this.ctx || !this.on) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    let c; try { c = this.ctx = new AC(); } catch (e) { this.ctx = null; return; }
    const g = () => c.createGain();
    this.master = g(); this.music = g(); this.amb = g(); this.chars = g(); this.fx = g(); this.fade = g();
    this.master.connect(this.fade); this.fade.connect(c.destination);
    for (const b of [this.music, this.amb, this.chars, this.fx]) b.connect(this.master);
    this.fade.gain.value = 0;                                       // opened by begin(), after the first tap
    this.setVolumes(settings);
    // music element (streams, no big decode). Its source is set now so it is buffered when the tap lets it play.
    this.el = new Audio(); this.el.crossOrigin = 'anonymous'; this.el.preload = 'auto';
    // AU1: element > per-track gain (the fades live here, the sliders own the music bus) > music bus. Without a media-element source the fades step el.volume instead.
    try { this.elSrc = c.createMediaElementSource(this.el); this.tg = g(); this.tg.gain.value = 0; this.elSrc.connect(this.tg); this.tg.connect(this.music); } catch (e) { this.elSrc = null; this.tg = null; }
    this.el.addEventListener('ended', () => this.advance());
    // a track that could not play (missing / broken file) must not leave the game silent: skip to the next one
    this.el.addEventListener('error', () => { this.bad = (this.bad || 0) + 1; if (this.bad < 6) setTimeout(() => this.advance(), 800); });
    // the music may be buffered only after the first tap on a slow link: start it the moment it can play
    this.el.addEventListener('canplay', () => { if (this.gate && this.on && this.el.paused && !this.manualPause) this.el.play().then(() => { this.musicOK = true; }, () => {}); });
    // the track is really sounding: fade it in (2 s) - the gain sat at 0 until now, so a slow start never plays a silent fade
    this.el.addEventListener('playing', () => { if (this.fadeInPending) { this.fadeInPending = false; this.fadeTo(this.trim(this.cur), MUSIC.fadeIn); } });
    // the last 2.5 s of a track fade out on their own, so the next one never starts on top of a tail at full level
    this.el.addEventListener('timeupdate', () => {
      const e = this.el, d = e.duration; if (this.endFading || this.phase || !isFinite(d) || d < 8 || d - e.currentTime > MUSIC.fadeOut || e.paused) return;
      this.endFading = true; this.fadeTo(0, Math.max(0.5, d - e.currentTime - 0.05));
    });
    this.mode = mode; this.startTrack(this.choose(), false); this.preload(this.cur);
    c.addEventListener && c.addEventListener('statechange', () => this.tryBegin());
    this.arm(); this.load();
  }
  start() { this.arm(); this.gate = true; this.unlock(); }          // kept for callers: "the player interacted"
  // listen for the gestures browsers accept as "user activation" (touch counts at pointerup/touchend, mouse at pointerdown, iOS at touchend/click)
  arm() {
    if (this.armed) return; this.armed = true;
    const evs = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'], opt = { capture: true, passive: true };
    const h = () => { this.gate = true; this.unlock(); if (this.began && this.musicOK) for (const e of evs) document.removeEventListener(e, h, opt); };
    for (const e of evs) document.addEventListener(e, h, opt);
  }
  // runs INSIDE the gesture handler: resume the context and start the music element synchronously (iOS/Telegram only allow it there)
  unlock() {
    if (!this.on) return;
    if (!this.ctx) this.prepare(this.mode || 'day');
    const c = this.ctx; if (!c) return;
    try { if (c.state !== 'running') c.resume(); } catch (e) { /* ignore */ }
    if (this.el && !this.musicOK) {
      try { const p = this.el.play(); if (p && p.then) p.then(() => { this.musicOK = true; }, () => { /* blocked: retried on the next gesture */ }); else this.musicOK = true; } catch (e) { /* ignore */ }
    }
    this.tryBegin();
  }
  tryBegin() {
    const c = this.ctx; if (this.began || !c || !this.gate || c.state !== 'running') return;
    this.began = true; this.started = true;
    const t = c.currentTime;
    this.fade.gain.cancelScheduledValues(t); this.fade.gain.setValueAtTime(0, t); this.fade.gain.linearRampToValueAtTime(1, t + 0.8);
    this.sting();
  }
  sting() { const c = this.ctx; if (!c) return; SYNTH.sting(c, this.fx, c.currentTime + 0.03); }
  decode(a) { return new Promise((res, rej) => { try { const p = this.ctx.decodeAudioData(a, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); } }); }
  async fetchBuf(n) {
    try { const r = await fetch(BASE() + n + '.mp3'); if (!r.ok) return; const a = await r.arrayBuffer(); if (this.ctx) this.buf[n] = await this.decode(a); } catch (e) { /* missing file */ }
  }
  async load() {
    // ambience first (what the player hears immediately); every loop starts the moment its own buffer is decoded, then the one-shots
    await Promise.all(LOOPS.map((n) => this.fetchBuf(n).then(() => this.makeLoop(n))));
    await Promise.all(SFX.map((n) => this.fetchBuf(n)));
    for (const t of TRACKS.slice().sort((a, b) => (b.modes.includes(this.mode) ? 1 : 0) - (a.modes.includes(this.mode) ? 1 : 0))) this.preload(t.n);   // the rest of the playlist, once the game sounds are in (this mode's tracks first)
  }
  makeLoop(n) {
    const b = this.buf[n]; if (!b || this.loops[n]) return;
    const s = this.ctx.createBufferSource(); s.buffer = b; s.loop = true; s.loopStart = 0.06; s.loopEnd = b.duration - 0.06;
    const g = this.ctx.createGain(); g.gain.value = 0; s.connect(g); g.connect(this.amb); s.start(0, Math.random() * b.duration * 0.5);
    this.loops[n] = g;
  }
  setVolumes(S) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, k = (v) => Math.max(0, Math.min(1, +v || 0));
    this.master.gain.setTargetAtTime(this.on ? k(S.master) : 0, t, 0.1);
    this.music.gain.setTargetAtTime(k(S.music) * 0.55, t, 0.1);
    this.amb.gain.setTargetAtTime(k(S.ambience) * 0.9, t, 0.1);
    this.chars.gain.setTargetAtTime(k(S.characters), t, 0.1);
    this.fx.gain.setTargetAtTime(k(S.effects), t, 0.1);
    if (!this.elSrc && this.el) this.applyLevel();
  }
  // ------------------------------------------------ music (AU1)
  // ONE <audio> element (iOS / Telegram only let a gesture-unlocked element play) -> per-track gain `tg` -> music bus. A change of track is always
  //   fade the old one to silence (2.5 s, equal-ratio ramp, starting from wherever its level is now)  ->  only then load the next  ->  fade it in (2 s).
  // So two tracks are never audible together, and a track never gets cut at full level. The wait for the fade runs on the AUDIO clock (a hidden tab,
  // where the context is suspended, simply pauses it - no restart storm when the tab returns).
  clock() { return this.tg ? this.ctx.currentTime : performance.now() / 1000; }
  trim(n) { const t = TRACKS.find((x) => x.n === n); return t ? t.g : 1; }
  level(now = this.clock()) {                          // the current level of the per-track gain, from our own bookkeeping (AudioParam.value is not reliable mid-ramp)
    const L = this.lv; if (!L) return 0;
    const x = now >= L.t1 ? (L.zero ? 0 : L.v1) : now <= L.t0 ? L.v0 : L.v0 * Math.pow(L.v1 / L.v0, (now - L.t0) / (L.t1 - L.t0));
    return x <= MUSIC.floor * 1.05 ? 0 : x;
  }
  // equal-ratio ("exponential", linear in dB) fade from the CURRENT level to v over `secs`; v = 0 ends at the -50 dB floor and then drops to exactly 0
  fadeTo(v, secs) {
    const now = this.clock(), F = MUSIC.floor, v0 = Math.max(F, this.level(now)), v1 = Math.max(F, v), end = now + Math.max(0.05, secs);
    this.lv = { v0, v1, t0: now, t1: end, zero: v <= F };
    if (this.tg) { const g = this.tg.gain; g.cancelScheduledValues(now); g.setValueAtTime(v0, now); g.exponentialRampToValueAtTime(v1, end); if (v <= F) g.setValueAtTime(0, end + 0.001); }
    else { this.applyLevel(); if (!this.fbTimer) this.fbTimer = setInterval(() => { this.applyLevel(); if (this.clock() >= this.lv.t1) { clearInterval(this.fbTimer); this.fbTimer = 0; this.applyLevel(); } }, 60); }
  }
  setLevelNow(v) {
    const now = this.clock(); this.lv = { v0: v, v1: v, t0: now, t1: now, zero: v <= MUSIC.floor };
    if (this.tg) { const g = this.tg.gain; g.cancelScheduledValues(now); g.setValueAtTime(v, now); } else this.applyLevel();
  }
  applyLevel() { const S = settings, k = (v) => Math.max(0, Math.min(1, +v || 0)); if (this.el) this.el.volume = Math.min(1, k(S.master) * k(S.music) * 0.55 * this.level()); }
  hourNow() { return this.hour != null ? this.hour : gameHour(); }
  // the tracks the current mode may play at this game hour (a mode whose window excludes everything falls back to the whole mode)
  trackList(mode = this.mode) {
    const all = TRACKS.filter((t) => t.modes.includes(mode)), h = this.hourNow(), now = all.filter((t) => hourIn(t.hours, h));
    return now.length ? now : all;
  }
  // a random eligible track that is not one of the last two played
  choose() {
    const L = this.trackList(); if (!L.length) return null;
    let pool = L.filter((t) => !this.recent.includes(t.n)); if (!pool.length) pool = L.filter((t) => t.n !== this.cur); if (!pool.length) pool = L;
    return pool[Math.floor(Math.random() * pool.length)].n;
  }
  // load + (when allowed) play track n now; its gain is 0 and rises in the 'playing' handler
  startTrack(n, play = true) {
    const el = this.el; if (!el || !n) return;
    this.cur = n; this.recent.push(n); if (this.recent.length > 2) this.recent.shift();
    this.fadeInPending = true; this.endFading = false; this.phase = ''; this.setLevelNow(0);
    el.src = this.blobs[n] || BASE() + n + '.mp3';
    this.preload(n);
    if (play && this.on && !this.manualPause) el.play().then(() => { this.musicOK = true; }, () => { /* blocked: the next gesture retries */ });
  }
  // the one entry point for a track change. fade = false skips the fade-out (used when the old track has already ended)
  playTrack(n, fade = true) {
    if (!this.el || !n) return;
    this.want = n;
    if (this.phase === 'out') return;                                     // already fading the old one: the latest wish is played when it is silent
    const now = this.clock(), audible = this.began && this.musicOK && !this.el.paused && this.level(now) > 0.03;
    if (!fade || !audible) { this.startTrack(n); return; }
    this.phase = 'out'; this.fadeTo(0, MUSIC.fadeOut); this.until = now + MUSIC.fadeOut + 0.05;
    if (!this.trTimer) this.trTimer = setInterval(() => this.tick(), 150);
  }
  tick() {
    if (this.phase === 'out' && this.ctx && this.clock() >= this.until) { this.phase = ''; this.startTrack(this.want); }
    if (!this.phase && this.trTimer) { clearInterval(this.trTimer); this.trTimer = 0; }
  }
  // a track ended by itself (or could not play): the next one, no fade-out needed
  advance() { this.playTrack(this.choose(), false); }
  next(fade = false) { this.playTrack(this.choose(), fade); }
  // the mode of the music: 'day' / 'night' / 'storm'. Called by the battle (explicit) and by update() (through autoMode)
  playMode(mode) {
    if (!this.el || mode === this.mode) return;
    this.mode = mode; this.playTrack(this.choose());
  }
  // update() asks for a mode every frame: night has a hysteresis (in at 0.6, out at 0.45) and a mode lives at least MUSIC.dwell seconds, so a flickering
  // rain value or the evening light never makes the music hop between tracks
  autoMode(want, now) {
    if (want === this.mode) return;
    if (this.mode && now - this.modeSince < MUSIC.dwell) return;
    this.modeSince = now; this.playMode(want);
  }
  // fetch a track completely into a blob URL: it then starts instantly and never stutters on a weak connection (the first tap does not wait for the network)
  preload(n) {
    if (!n || this.blobs[n] || this.blobWait[n]) return;
    this.blobWait[n] = fetch(BASE() + n + '.mp3').then((r) => (r.ok ? r.blob() : null)).then((b) => {
      if (!b) return; this.blobs[n] = URL.createObjectURL(b);
      // the element is still on the network URL of this very track and has not started yet: swap to the local copy
      if (this.el && this.el.paused && !this.musicOK && this.el.src.indexOf('/' + n + '.mp3') >= 0) { this.el.src = this.blobs[n]; if (this.gate && this.on) this.el.play().then(() => { this.musicOK = true; }, () => {}); }
    }).catch(() => {});
  }
  // war drums under the epic music during a battle: level 0..1 (0 = off)
  setWar(level) {
    if (!this.ctx || !this.on) return;
    if (!this.war) { if (level <= 0) return; try { this.war = new WarScore(this.ctx, this.music); } catch (e) { this.war = null; return; } }
    this.war.set(level);
  }
  // a battle: the countryside falls silent (birds, village, crickets, stream, owls, animals) - only the wind, the weather and the war music stay.
  // update() is not called during a battle, so nothing brings the loops back until the battle is over (then its slow mix fades them in again)
  setBattle(on) {
    this.inBattle = !!on; const c = this.ctx; if (!c || !on) return; const t = c.currentTime;
    for (const n of ['amb_birds', 'amb_country', 'amb_night', 'amb_crickets', 'amb_market', 'amb_stream']) { const g = this.loops[n]; if (g) { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.3); } }
    const w = this.loops.amb_wind; if (w) { w.gain.cancelScheduledValues(t); w.gain.setTargetAtTime(0.1, t, 0.6); }
  }
  // ------------------------------------------------ one-shots
  play(n, vol = 1, bus = 'fx', rate = 1, delay = 0) {
    const c = this.ctx, b = this.buf[n]; if (!c || !b || vol < 0.02) return;
    const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = rate;
    const g = c.createGain(); g.gain.value = vol; s.connect(g); g.connect(bus === 'chars' ? this.chars : bus === 'amb' ? this.amb : this.fx);
    s.start(c.currentTime + delay);
  }
  roar(vol = 1) { this.play('sfx_roar', vol * 0.9, 'chars', 0.9 + Math.random() * 0.15); setTimeout(() => this.play('sfx_flap', vol * 0.6, 'chars'), 900); }
  thump(vol = 1) { const c = this.ctx; if (!c || vol < 0.03) return; SYNTH.thump(c, this.chars, c.currentTime, vol); }
  click() { this.play('sfx_click', 0.5, 'fx'); }
  twang(vol = 1) { const c = this.ctx; if (!c || !this.began || vol < 0.03) return; this.noiseBuf = SYNTH.twang(c, this.chars, c.currentTime + 0.01, vol, this.noiseBuf); }
  // soft arpeggio for collected gems / finished upgrades (AU1: warm, ~7 dB quieter than the old bright chime; at most one every 0.18 s)
  coins() {
    const c = this.ctx; if (!c) return;
    const now = c.currentTime; if (now - (this.lastCoin || -9) < 0.18) return; this.lastCoin = now;
    this.coinK = 1 - (this.coinK || 0); SYNTH.coins(c, this.fx, now, this.coinK);
  }
  // ------------------------------------------------ per-frame mix
  update(dt, { P, world, camera }) {
    const c = this.ctx; if (!c || !this.started || !P) return;
    // the mix only changes slowly: 4 updates a second are plenty
    this.mixAcc = (this.mixAcc || 0) + dt; if (this.mixAcc < 0.25) return; dt = this.mixAcc; this.mixAcc = 0;
    const W = (world && world.weather && world.weather.W) || { rain: 0, wind: 0.3, cover: 0.2, kind: 'clear' };
    const day = 1 - P.night, rain = W.rain, dry = 1 - Math.min(1, rain * 1.4);
    const camY = camera ? camera.position.y : 100, near = Math.max(0, Math.min(1, 1 - (camY - 40) / 260));
    const T = {
      amb_birds: day * dry * (0.35 + 0.4 * near) * (P.hour < 10 ? 1.2 : 0.8), amb_country: day * dry * 0.35,
      amb_night: P.night * dry * 0.4, amb_crickets: P.night * dry * 0.3 * (0.4 + near),
      amb_wind: 0.12 + W.wind * 0.35, amb_wind_strong: Math.max(0, W.wind - 0.55) * 1.2 + (W.gust || 0) * 0.5,
      amb_rain_light: rain > 0.05 && rain < 0.5 ? rain * 1.3 : 0, amb_rain: Math.max(0, rain - 0.35) * 1.1, amb_storm: W.kind === 'storm' ? rain * 0.8 : 0,
      amb_market: day * dry * near * 0.2 * (P.hour > 8 && P.hour < 18 ? 1 : 0.2), amb_stream: 0.12 * near,
    };
    const t = c.currentTime; this.hour = P.hour;
    for (const [n, v] of Object.entries(T)) {
      const g = this.loops[n]; if (!g) continue; const tv = Math.max(0, Math.min(1, v));
      if (!g.bwInit) { g.bwInit = true; g.gain.setValueAtTime(tv, t); } else g.gain.setTargetAtTime(tv, t, 1.5);   // a fresh loop is audible at once, then follows the slow mix
    }
    // music follows the hour and the weather (epic music in the rain); night = a hysteresis, every mode change waits out MUSIC.dwell
    const stormy = W.kind === 'storm' || W.kind === 'lightning' || rain > 0.4, dark = this.mode === 'night' ? P.night > MUSIC.nightOff : P.night > MUSIC.nightOn;
    this.autoMode(stormy ? 'storm' : dark ? 'night' : 'day', t);
    // thunder (delayed by distance)
    if (world && world.takeThunder) for (const e of world.takeThunder()) {
      const n = 'sfx_thunder' + (1 + ((Math.random() * 4) | 0));
      this.play(n, Math.min(1, e.power * 1.1), 'amb', e.close ? 1 : 0.85 + Math.random() * 0.1, e.delay);
    }
    // AU1: the castle bell tolls ONCE per game day (noon, soft and warm), the rooster at dawn, owls at night, animals & anvil nearby.
    // Animals (rooster, horse, cow, dog) never sound in the dark: only while the day is brighter than ANIMAL_DAY (dusk and dawn count as night).
    const h = Math.floor(P.hour), calm = day > ANIMAL_DAY;
    if (this.lastHour >= 0 && h !== this.lastHour) {
      if (h === 12) this.play('sfx_bell', 0.3 + 0.25 * near, 'amb');
      if (h === 6 && calm) this.play('sfx_rooster', 0.5, 'chars');
    }
    this.lastHour = h;
    const tm = this.timers;
    tm.animal -= dt; tm.owl -= dt; tm.anvil -= dt;
    if (tm.animal <= 0) {
      tm.animal = 14 + Math.random() * 22;                                 // the timer runs on at night too, it just stays silent
      const r = Math.random(), v = 0.2 + 0.5 * near;
      if (calm) {
        if (r < 0.35) this.play(Math.random() < 0.5 ? 'sfx_neigh' : 'sfx_neigh2', v, 'chars', 0.95 + Math.random() * 0.1);
        else if (r < 0.65) this.play('sfx_moo', v, 'chars', 0.9 + Math.random() * 0.15);
        else this.play('sfx_bark', v * 0.8, 'chars', 0.95 + Math.random() * 0.15);
      }
    }
    if (P.night > 0.6 && tm.owl <= 0) { tm.owl = 25 + Math.random() * 30; this.play('sfx_owl', 0.35, 'amb'); }
    if (day > 0.5 && near > 0.5 && tm.anvil <= 0) { tm.anvil = 9 + Math.random() * 10; this.play('sfx_anvil', 0.3 * near, 'amb'); }
  }
  pause(hidden) { this.manualPause = !!hidden; if (!this.ctx) return; if (hidden) { this.ctx.suspend(); this.el && this.el.pause(); } else if (this.on) { this.ctx.resume(); this.el && this.el.play().catch(() => {}); } }
  toggle() {
    this.on = !this.on;
    try { localStorage.setItem('bw_sound', this.on ? '1' : '0'); } catch (e) { /* storage blocked */ }
    if (this.on) { if (this.ctx) { this.ctx.resume(); this.el && this.el.play().catch(() => {}); this.setVolumes(settings); } else { this.gate = true; this.prepare(this.mode || 'day'); this.unlock(); } }
    else if (this.ctx) { this.ctx.suspend(); this.el && this.el.pause(); }
    return this.on;
  }
}
