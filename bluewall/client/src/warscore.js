// The war drums: a synthesized percussion score that plays UNDER the epic music while a battle is on (no files, no extra download).
// Unpitched on purpose (taiko booms, toms, metal clanks, cymbal swells, a rising roll), so it can never clash with the key of the music bed.
// Everything follows one "intensity" number 0..1 (0 = silent / stops): a slow heartbeat at the start, a marching pattern when the
// soldiers meet the walls, fills and swells when the whole army is fighting.
//   const war = new WarScore(audioCtx, destinationNode);   war.set(0.3) ... war.set(0.9) ... war.set(0)
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function impulse(c, secs, decay) {                               // a synthetic hall: decaying noise
  const n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
  return b;
}

export class WarScore {
  constructor(ctx, dest) {
    const c = this.c = ctx;
    this.out = c.createGain(); this.out.gain.value = 0; this.out.connect(dest);
    this.dry = c.createGain(); this.dry.gain.value = 0.85; this.dry.connect(this.out);
    this.send = c.createGain(); this.send.gain.value = 0.55;
    this.verb = c.createConvolver(); this.verb.buffer = impulse(c, 2.2, 2.6);
    const vg = c.createGain(); vg.gain.value = 0.45; this.send.connect(this.verb); this.verb.connect(vg); vg.connect(this.out);
    const n = c.sampleRate * 2, nb = this.noise = c.createBuffer(1, n, c.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.level = 0; this.target = 0; this.running = false; this.step = 0; this.next = 0; this.bpm = 84; this.timer = 0; this.last = 0; this.stopT = 0;
  }
  set(level) {
    this.target = clamp(level, 0, 1);
    if (this.target > 0.01) { this.stopT = 0; if (!this.running) this.start(); }
    else if (this.running && !this.stopT) { this.stopT = performance.now() + 2200; const t = this.c.currentTime; this.out.gain.cancelScheduledValues(t); this.out.gain.setTargetAtTime(0, t, 0.6); }
  }
  start() {
    if (this.running) return; this.running = true;
    const t = this.c.currentTime; this.next = t + 0.15; this.step = 0; this.level = Math.max(0.15, this.level);
    this.out.gain.cancelScheduledValues(t); this.out.gain.setTargetAtTime(1, t, 0.9);
    this.last = performance.now();
    this.timer = setInterval(() => this.tick(), 90);
  }
  stop() { this.running = false; clearInterval(this.timer); this.timer = 0; this.level = 0; this.stopT = 0; }
  tick() {
    const now = performance.now(), dt = Math.min(0.5, (now - this.last) / 1000); this.last = now;
    if (this.stopT && now > this.stopT) { this.stop(); return; }
    this.level += (this.target - this.level) * Math.min(1, dt * 0.6);
    const c = this.c, spb = 60 / this.bpm / 4;                       // seconds per 16th note
    if (this.next < c.currentTime - 0.5) this.next = c.currentTime + 0.05;   // the tab slept: do not replay the missed hits
    while (this.next < c.currentTime + 0.4) { this.hit(this.step, this.next); this.next += spb; this.step++; }
  }
  // ---- voices
  boom(t, v, f0 = 135, f1 = 46, len = 0.9) {                      // big taiko: pitch-dropped sine + skin noise
    const c = this.c, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.22);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(g); g.connect(this.dry); g.connect(this.send); o.start(t); o.stop(t + len + 0.05);
    const s = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain();
    s.buffer = this.noise; bp.type = 'bandpass'; bp.frequency.value = f0 * 2.2; bp.Q.value = 0.9;
    ng.gain.setValueAtTime(v * 0.55, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    s.connect(bp); bp.connect(ng); ng.connect(this.dry); s.start(t, Math.random()); s.stop(t + 0.12);
  }
  clank(t, v) {                                                   // metal on metal: armour and blades
    const c = this.c, s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; bp.type = 'bandpass'; bp.frequency.value = 2600 + Math.random() * 1400; bp.Q.value = 7;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    s.connect(bp); bp.connect(g); g.connect(this.dry); g.connect(this.send); s.start(t, Math.random()); s.stop(t + 0.2);
  }
  crash(t, v) {                                                   // cymbal swell
    const c = this.c, s = c.createBufferSource(), hp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; s.loop = true; hp.type = 'highpass'; hp.frequency.value = 3800;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.9); g.gain.exponentialRampToValueAtTime(0.001, t + 3.2);
    s.connect(hp); hp.connect(g); g.connect(this.dry); g.connect(this.send); s.start(t); s.stop(t + 3.3);
  }
  riser(t, v) {                                                   // a rising roar before the big hit
    const c = this.c, s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; s.loop = true; bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(5200, t + 2.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 2.5); g.gain.linearRampToValueAtTime(0.0001, t + 2.7);
    s.connect(bp); bp.connect(g); g.connect(this.dry); g.connect(this.send); s.start(t); s.stop(t + 2.8);
  }
  // ---- the pattern: 16 sixteenth-notes per bar, 84 BPM
  hit(step, t) {
    const L = this.level; if (L < 0.03) return;
    const k = step % 16, bar = Math.floor(step / 16), v = 0.5 + 0.4 * L;
    if (k === 0) this.boom(t, v);
    if (k === 8) this.boom(t, v * 0.85);
    if (L > 0.3 && (k === 3 || k === 11)) this.boom(t, v * 0.55, 105, 52, 0.5);
    if (L > 0.45 && (k === 6 || k === 14)) this.boom(t, v * 0.5, 150, 70, 0.4);
    if (L > 0.55 && (k === 4 || k === 12)) this.boom(t, v * 0.6, 190, 90, 0.45);
    if (L > 0.35 && k % 4 === 2) this.clank(t, 0.05 + 0.1 * L);
    if (L > 0.8 && bar % 4 === 3 && k >= 12) this.boom(t, v * (0.5 + (k - 12) * 0.12), 170, 80, 0.3);       // the fill at the end of a phrase
    if (L > 0.65 && k === 0 && bar % 8 === 0) this.crash(t, 0.22);
    if (L > 0.7 && k === 0 && bar % 8 === 6) this.riser(t, 0.2);
  }
}
