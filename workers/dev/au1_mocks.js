// AU1: just enough browser for audio.js to run in Node: a virtual clock with virtual timers, an AudioContext whose AudioParams evaluate their automation
// (set / linear / exponential ramps), a media element that plays through virtual time and emits playing / timeupdate / ended, fetch + decodeAudioData by name.
// IMPORT THIS FIRST in a test (module evaluation order): audio.js / settings.js read localStorage, document, window at load time.
export const CLK = { wall: Date.UTC(2026, 9, 15, 12, 0, 0), timers: [], seq: 0 };     // wall clock in ms (gameHour() reads Date.now), virtual timers
const RealDate = Date; globalThis.Date = class extends RealDate { static now() { return CLK.wall; } constructor(...a) { if (a.length) super(...a); else super(CLK.wall); } };

globalThis.window = globalThis; window.BW_ASSETS = '/assets/';
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} }; globalThis.addEventListener = () => {};
const store = new Map(); globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) };
const nameOf = (u) => String(u).replace(/^blob:/, '').split('/').pop().replace(/\.mp3$/, '');
globalThis.fetch = async (url) => ({ ok: true, arrayBuffer: async () => ({ __name: nameOf(url) }), blob: async () => ({ __name: nameOf(url) }) });
URL.createObjectURL = (b) => 'blob:' + b.__name;

// ---- virtual timers (the code under test uses setTimeout / setInterval for the fade wait and the retry after an error)
globalThis.setTimeout = (fn, ms = 0) => { const id = ++CLK.seq; CLK.timers.push({ id, at: CLK.wall + ms, fn, every: 0 }); return id; };
globalThis.setInterval = (fn, ms = 0) => { const id = ++CLK.seq; CLK.timers.push({ id, at: CLK.wall + ms, fn, every: Math.max(1, ms) }); return id; };
globalThis.clearTimeout = globalThis.clearInterval = (id) => { CLK.timers = CLK.timers.filter((t) => t.id !== id); };
export function runTimers() {
  for (let guard = 0; guard < 1000; guard++) {
    let best = null; for (const t of CLK.timers) if (t.at <= CLK.wall && (!best || t.at < best.at)) best = t;
    if (!best) return;
    if (best.every) best.at += best.every; else CLK.timers = CLK.timers.filter((t) => t !== best);
    best.fn();
  }
}

// ---- AudioParam that really evaluates its automation
export class Param {
  constructor(v = 1) { this.v0 = v; this.ev = []; }
  get value() { return this.v0; } set value(x) { this.v0 = x; this.ev = []; }
  setValueAtTime(v, t) { this.ev.push({ k: 's', v, t }); return this; }
  linearRampToValueAtTime(v, t) { this.ev.push({ k: 'l', v, t }); return this; }
  exponentialRampToValueAtTime(v, t) { this.ev.push({ k: 'e', v, t }); return this; }
  setTargetAtTime(v) { this.tv = v; return this; }                                     // (only the per-track gain's automation is evaluated in the tests)
  cancelScheduledValues(t) { this.ev = this.ev.filter((e) => e.t < t); return this; }
  valueAt(t) {
    let cur = { t: -Infinity, v: this.v0 };
    for (const e of this.ev) {
      if (e.t > t) {
        if (e.k === 'l') return cur.t === -Infinity ? e.v : cur.v + (e.v - cur.v) * ((t - cur.t) / (e.t - cur.t));
        if (e.k === 'e') return cur.t === -Infinity ? e.v : cur.v * Math.pow(e.v / cur.v, (t - cur.t) / (e.t - cur.t));
        return cur.v;
      }
      cur = { t: e.t, v: e.v };
    }
    return cur.v;
  }
}
class Node {
  constructor(c) { this.c = c; }
  connect(x) { this.__out = x; return x; } disconnect() {}
  start() {} stop() {}
}
const generic = (c) => new Proxy(new Node(c), { get(t, k) { if (k in t) return t[k]; if (typeof k !== 'string') return undefined; return (t[k] = new Param(0)); }, set(t, k, v) { t[k] = v; return true; } });
class GainNode extends Node { constructor(c) { super(c); this.gain = new Param(1); } }

const DUR = { mus_day1: 65, mus_day2: 159, mus_night: 170, mus_epic: 96, mus_calm_dawn: 48, mus_calm_meadow: 49, mus_calm_river: 50.6, mus_calm_hearth: 47.4, mus_calm_moon: 50.5 };
export class MockEl {
  static onSrc = null;
  constructor() { this._src = ''; this.paused = true; this.currentTime = 0; this.volume = 1; this.L = {}; this.plays = 0; }
  get src() { return this._src; }
  set src(v) { this._src = v; this.paused = true; this.currentTime = 0; this._tu = 0; if (MockEl.onSrc) MockEl.onSrc(this, v); }
  get duration() { return this._src ? DUR[nameOf(this._src)] || 50 : NaN; }
  addEventListener(t, f) { (this.L[t] = this.L[t] || []).push(f); }
  dispatch(t) { for (const f of this.L[t] || []) f(); }
  play() { if (!this._src) return Promise.reject(new Error('no src')); this.paused = false; this.plays++; this.dispatch('playing'); return Promise.resolve(); }      // (a real element fires 'playing' a moment later; the order does not matter to audio.js)
  pause() { this.paused = true; }
  // advance media time by dt seconds (only while playing)
  tick(dt) {
    if (this.paused) return;
    this.currentTime += dt; this._tu += dt; if (this._tu >= 0.25) { this._tu = 0; this.dispatch('timeupdate'); }
    if (this.currentTime >= this.duration) { this.currentTime = this.duration; this.paused = true; this.dispatch('ended'); }
  }
}
globalThis.Audio = MockEl;

export class MockAC {
  static last = null;
  constructor() { this.currentTime = 0; this.state = 'suspended'; this.sampleRate = 44100; this.destination = new Node(this); this.log = []; this.oscillators = 0; MockAC.last = this; }
  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  addEventListener() {}
  createGain() { return new GainNode(this); }
  createBiquadFilter() { return generic(this); }
  createStereoPanner() { return generic(this); }
  createConvolver() { return generic(this); }
  createDynamicsCompressor() { return generic(this); }
  createWaveShaper() { return generic(this); }
  createDelay() { return generic(this); }
  createOscillator() { const n = generic(this), c = this; n.start = () => { c.oscillators++; }; n.stop = () => {}; return n; }
  createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len), length: len }; }
  createMediaElementSource() { return new Node(this); }
  createBufferSource() {
    const n = new Node(this), c = this; n.playbackRate = { value: 1 }; n.loop = false; n.buffer = null;
    n.start = (when) => { if (!n.loop) c.log.push({ name: n.buffer && n.buffer.__name, when, wall: CLK.wall, vol: n.__out && n.__out.gain ? n.__out.gain.value : null, now: c.currentTime }); }; n.stop = () => {};
    return n;
  }
  decodeAudioData(buf, ok) { const r = { duration: 20, length: 882000, __name: buf.__name }; if (ok) ok(r); return Promise.resolve(r); }
}
globalThis.AudioContext = MockAC;

export const flush = async (n = 40) => { for (let i = 0; i < n; i++) await new Promise((r) => setImmediate(r)); };
// advance the whole virtual world by dt seconds: wall clock, audio clock (only while the context runs), media element, timers
export function step(a, dt) {
  CLK.wall += dt * 1000;
  if (a.ctx && a.ctx.state === 'running') a.ctx.currentTime += dt;
  if (a.el && a.ctx && a.ctx.state === 'running') a.el.tick(dt);
  runTimers();
}
