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
const PLAY = { day: ['mus_day1', 'mus_day2'], night: ['mus_night'], storm: ['mus_epic'] };

export class Ambience {
  constructor() {
    this.ctx = null; this.on = true; this.buf = {}; this.loops = {}; this.started = false; this.gate = false; this.began = false; this.musicOK = false; this.armed = false;
    try { this.on = localStorage.getItem('bw_sound') !== '0'; } catch (e) { /* storage blocked */ }
    this.timers = { animal: 8, owl: 20, anvil: 6 }; this.lastHour = -1; this.thunderQ = []; this.mode = ''; this.idx = {}; this.blobs = {}; this.blobWait = {}; this.war = null;
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
    try { this.elSrc = c.createMediaElementSource(this.el); this.elSrc.connect(this.music); } catch (e) { this.elSrc = null; }
    this.el.addEventListener('ended', () => this.next());
    // a track that could not play (missing / broken file) must not leave the game silent: skip to the next one
    this.el.addEventListener('error', () => { this.bad = (this.bad || 0) + 1; if (this.bad < 6) setTimeout(() => this.next(), 800); });
    // the music may be buffered only after the first tap on a slow link: start it the moment it can play
    this.el.addEventListener('canplay', () => { if (this.gate && this.on && this.el.paused && !this.manualPause) this.el.play().then(() => { this.musicOK = true; }, () => {}); });
    this.mode = mode; this.pickTrack(); this.preload(this.trackList()[this.idx[this.mode] || 0]);
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
  // a short regal swell + bell, synthesized (no file to wait for): the first thing the player hears
  sting() {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + 0.03, out = this.fx;
    const note = (f, type, at, att, dur, peak) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t + at);
      g.gain.setValueAtTime(0.0001, t + at); g.gain.linearRampToValueAtTime(peak, t + at + att); g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      o.connect(g); g.connect(out); o.start(t + at); o.stop(t + at + dur + 0.05);
    };
    note(73.4, 'sine', 0, 0.35, 2.4, 0.30); note(110, 'triangle', 0, 0.4, 2.2, 0.12); note(146.8, 'sine', 0.05, 0.4, 2.0, 0.10);
    note(587.3, 'sine', 0.30, 0.01, 1.9, 0.10); note(880, 'sine', 0.38, 0.01, 1.6, 0.06); note(1174.7, 'sine', 0.46, 0.01, 1.2, 0.035);
  }
  decode(a) { return new Promise((res, rej) => { try { const p = this.ctx.decodeAudioData(a, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); } }); }
  async fetchBuf(n) {
    try { const r = await fetch(BASE() + n + '.mp3'); if (!r.ok) return; const a = await r.arrayBuffer(); if (this.ctx) this.buf[n] = await this.decode(a); } catch (e) { /* missing file */ }
  }
  async load() {
    // ambience first (what the player hears immediately); every loop starts the moment its own buffer is decoded, then the one-shots
    await Promise.all(LOOPS.map((n) => this.fetchBuf(n).then(() => this.makeLoop(n))));
    await Promise.all(SFX.map((n) => this.fetchBuf(n)));
    for (const list of Object.values(PLAY)) for (const n of list) this.preload(n);      // the rest of the playlist, once the game sounds are in
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
    if (!this.elSrc && this.el) this.el.volume = k(S.master) * k(S.music) * 0.55;
  }
  // ------------------------------------------------ music
  playMode(mode) {
    if (!this.el || mode === this.mode) return;
    this.mode = mode; this.next(true);
  }
  trackList() { return PLAY[this.mode] || PLAY.day; }
  pickTrack(step = 0) {
    const list = this.trackList(), i = (this.idx[this.mode] = ((this.idx[this.mode] ?? Math.floor(Math.random() * list.length)) + step) % list.length);
    if (this.el) { const n = list[i]; this.el.src = this.blobs[n] || BASE() + n + '.mp3'; this.preload(list[(i + 1) % list.length]); }
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
  next(fade = false) {
    const go = () => { this.pickTrack(1); this.el.play().catch(() => {}); if (this.elSrc) { this.music.gain.cancelScheduledValues(this.ctx.currentTime); this.setVolumes(settings); } };
    if (fade && this.elSrc && !this.el.paused) { this.music.gain.setTargetAtTime(0, this.ctx.currentTime, 0.6); setTimeout(go, 2200); } else go();
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
  thump(vol = 1) {
    const c = this.ctx; if (!c || vol < 0.03) return;
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(32, t + 0.5);
    g.gain.setValueAtTime(0.9 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o.connect(g); g.connect(this.chars); o.start(t); o.stop(t + 0.8);
  }
  click() { this.play('sfx_click', 0.5, 'fx'); }
  // a ballista letting go: sharp string slap + a short falling pluck + a breath of air (synthesized; vol 0..1 already includes distance)
  twang(vol = 1) {
    const c = this.ctx; if (!c || !this.began || vol < 0.03) return;
    const t = c.currentTime + 0.01;
    const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(230, t); o.frequency.exponentialRampToValueAtTime(64, t + 0.5);
    f.type = 'lowpass'; f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(260, t + 0.45);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(f); f.connect(g); g.connect(this.chars); o.start(t); o.stop(t + 0.6);
    if (!this.noiseBuf) { const n = c.sampleRate * 0.4, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); this.noiseBuf = b; }
    const s = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain(); s.buffer = this.noiseBuf; bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.8;
    ng.gain.setValueAtTime(0.28 * vol, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    s.connect(bp); bp.connect(ng); ng.connect(this.chars); s.start(t);
  }
  // bright little chime for collected gems
  coins() {
    const c = this.ctx; if (!c) return;
    [0, 0.07, 0.14, 0.24].forEach((d, i) => {
      const t = c.currentTime + d, o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime([1318, 1568, 1976, 2637][i], t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g); g.connect(this.fx); o.start(t); o.stop(t + 0.4);
    });
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
    const t = c.currentTime;
    for (const [n, v] of Object.entries(T)) {
      const g = this.loops[n]; if (!g) continue; const tv = Math.max(0, Math.min(1, v));
      if (!g.bwInit) { g.bwInit = true; g.gain.setValueAtTime(tv, t); } else g.gain.setTargetAtTime(tv, t, 1.5);   // a fresh loop is audible at once, then follows the slow mix
    }
    // music follows the hour and the weather
    this.playMode(W.kind === 'storm' || W.kind === 'lightning' || rain > 0.4 ? 'storm' : P.night > 0.55 ? 'night' : 'day');   // epic music in the rain
    // thunder (delayed by distance)
    if (world && world.takeThunder) for (const e of world.takeThunder()) {
      const n = 'sfx_thunder' + (1 + ((Math.random() * 4) | 0));
      this.play(n, Math.min(1, e.power * 1.1), 'amb', e.close ? 1 : 0.85 + Math.random() * 0.1, e.delay);
    }
    // castle bell every game hour, rooster at dawn, owls at night, animals & anvil nearby
    const h = Math.floor(gameHour());
    if (this.lastHour >= 0 && h !== this.lastHour) {
      if (h % 3 === 0) this.play('sfx_bell', 0.35 + 0.3 * near, 'amb');
      if (h === 6) this.play('sfx_rooster', 0.5, 'chars');
    }
    this.lastHour = h;
    const tm = this.timers;
    tm.animal -= dt; tm.owl -= dt; tm.anvil -= dt;
    if (tm.animal <= 0) {
      tm.animal = 14 + Math.random() * 22;
      const r = Math.random(), v = 0.2 + 0.5 * near;
      if (r < 0.35) this.play(Math.random() < 0.5 ? 'sfx_neigh' : 'sfx_neigh2', v, 'chars', 0.95 + Math.random() * 0.1);
      else if (r < 0.65) this.play('sfx_moo', v, 'chars', 0.9 + Math.random() * 0.15);
      else if (day > 0.5) this.play('sfx_bark', v * 0.8, 'chars', 0.95 + Math.random() * 0.15);
    }
    if (P.night > 0.6 && tm.owl <= 0) { tm.owl = 25 + Math.random() * 30; this.play('sfx_owl', 0.35, 'amb'); }
    if (day > 0.5 && near > 0.5 && tm.anvil <= 0) { tm.anvil = 9 + Math.random() * 10; this.play('sfx_anvil', 0.18 * near, 'amb'); }
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
