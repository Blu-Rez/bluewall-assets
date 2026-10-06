// Battle sound effects, synthesized with WebAudio (no files): swords, arrows, thuds, collapsing masonry, catapults, dragon fire, horns.
// Every call is positional (distance + left/right from the camera) and rate-limited so a 300-soldier melee never clogs the mixer.
//   const sfx = createSFX(audio, camera);   sfx.at('sword', x, y, z);   sfx.horn();   sfx.fanfare(true)
import * as THREE from 'three';

export function createSFX(audio, camera) {
  const ctx = () => audio && audio.ctx && audio.began ? audio.ctx : null;
  let noise = null, voices = 0; const last = {};
  const nbuf = (c) => { if (noise) return noise; const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); let p = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; p = p * 0.7 + w * 0.3; d[i] = w * 0.6 + p * 0.8; } return (noise = b); };
  const out = (c) => audio.chars || audio.fx;
  const LIMIT = { sword: 0.055, arrow: 0.05, thud: 0.08, stone: 0.09, rock: 0.2, launch: 0.25, cannon: 0.25, zap: 0.1, collapse: 0.3, chime: 0.4, breath: 0.35, clang: 0.09, hurt: 0.1, bolt: 0.2, roar: 1.2, pop: 0.1, thunder: 0.12, heal: 0.8, rage: 0.8, freeze: 0.8, quake: 1.5 };
  const _r = { x: 0, z: 0 };
  // one shared stone hall for every battle sound: a decaying, softened noise burst (the "valley" the fight echoes in)
  const hall = (c) => {
    if (c._bsHall) return c._bsHall;
    const n = Math.floor(c.sampleRate * 2.1), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let p = 0; for (let i = 0; i < n; i++) { p = p * 0.62 + (Math.random() * 2 - 1) * 0.38; d[i] = p * Math.pow(1 - i / n, 2.6); } }
    const cv = c.createConvolver(); cv.buffer = b; const send = c.createGain(), wet = c.createGain(); wet.gain.value = 0.34; send.connect(cv); cv.connect(wet); wet.connect(out(c));
    return (c._bsHall = send);
  };
  const WET = { sword: 0.45, clang: 0.6, launch: 0.7, rock: 1, stone: 0.5, collapse: 0.9, chime: 0.7, cannon: 0.8, thunder: 0.8, quake: 0.8, breath: 0.4, thud: 0.3 };
  function gainPan(c, x, y, z, base) {                                   // distance fade + stereo pan relative to the camera
    let v = base, pan = 0;
    if (camera && x != null) {
      const dx = x - camera.position.x, dy = (y || 0) - camera.position.y, dz = z - camera.position.z, d = Math.hypot(dx, dy, dz);
      v = base * Math.max(0, 1 - d / 330) ** 1.3;
      camera.getWorldDirection(_dir); _r.x = -_dir.z; _r.z = _dir.x; const l = Math.hypot(_r.x, _r.z) || 1; pan = Math.max(-1, Math.min(1, ((dx * _r.x + dz * _r.z) / l) / Math.max(30, d * 0.8)));
    }
    return { v, pan };
  }
  const _dir = new THREE.Vector3();
  function node(c, x, y, z, base, name) {
    const now = c.currentTime; if (name && LIMIT[name] && now - (last[name] || 0) < LIMIT[name]) return null; last[name] = now;
    if (voices > 34) return null;
    const { v, pan } = gainPan(c, x, y, z, base); if (v < 0.015) return null;
    const g = c.createGain(); g.gain.value = v; let tail = g;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); tail = p; }
    tail.connect(out(c)); if (WET[name]) { const w = c.createGain(); w.gain.value = WET[name]; tail.connect(w); w.connect(hall(c)); }
    voices++; setTimeout(() => { voices = Math.max(0, voices - 1); }, 1500);
    return g;
  }
  const env = (c, g, t, a, d, peak) => { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  const noiseBurst = (c, dest, t, dur, type, f0, f1, q = 1, peak = 1) => {
    const s = c.createBufferSource(); s.buffer = nbuf(c); s.loop = true; const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q;
    const g = c.createGain(); env(c, g, t, Math.min(0.01, dur * 0.2), dur, peak); s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + dur + 0.1);
  };
  const tone = (c, dest, t, type, f0, f1, dur, peak, att = 0.005) => {
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(c, g, t, att, dur, peak); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + att + 0.05);
  };

  const R = {
    // blade on blade: the strike's edge, the knock of the weight, then a ring of inharmonic partials (ratios of a struck bar) that dies away
    sword(c, d, t) {
      const f = 520 + Math.random() * 760;
      noiseBurst(c, d, t, 0.05, 'highpass', 3200, 7500, 0.7, 0.6); noiseBurst(c, d, t, 0.045, 'bandpass', 1300, 900, 1.0, 0.5); tone(c, d, t, 'sine', 210, 105, 0.07, 0.4);
      for (const [r, a, dur] of [[1, 0.5, 0.5], [2.76, 0.32, 0.36], [5.4, 0.2, 0.26], [8.93, 0.12, 0.18]]) tone(c, d, t, 'sine', f * r, f * r * 0.995, dur, a * 0.55, 0.002);
    },
    // a heavier clash (swords against shields and armour): lower, longer, with a slightly detuned twin so the ring beats
    clang(c, d, t) {
      const f = 330 + Math.random() * 380;
      noiseBurst(c, d, t, 0.06, 'highpass', 2600, 6000, 0.8, 0.65); noiseBurst(c, d, t, 0.07, 'bandpass', 900, 500, 0.9, 0.6); tone(c, d, t, 'sine', 170, 80, 0.1, 0.5);
      for (const [r, a, dur] of [[1, 0.55, 0.95], [2.76, 0.36, 0.6], [5.4, 0.24, 0.4], [8.93, 0.14, 0.25]]) { tone(c, d, t, 'sine', f * r, f * r * 0.996, dur, a * 0.55, 0.002); if (r === 1) tone(c, d, t, 'sine', f * 1.007, f * 1.007 * 0.996, dur * 0.9, a * 0.4, 0.002); }
    },
    arrow(c, d, t) { noiseBurst(c, d, t, 0.16, 'bandpass', 1200, 3200, 0.9, 0.25); },
    bolt(c, d, t) { tone(c, d, t, 'sawtooth', 210, 60, 0.45, 0.28); noiseBurst(c, d, t, 0.3, 'bandpass', 2200, 700, 0.8, 0.35); },
    thud(c, d, t) { noiseBurst(c, d, t, 0.09, 'lowpass', 420, 160, 0.8, 0.6); tone(c, d, t, 'sine', 130, 60, 0.14, 0.4); },
    hurt(c, d, t) { noiseBurst(c, d, t, 0.06, 'lowpass', 900, 400, 0.8, 0.3); },
    stone(c, d, t) { noiseBurst(c, d, t, 0.12, 'lowpass', 700, 220, 0.8, 0.55); tone(c, d, t, 'sine', 95, 50, 0.22, 0.5); },
    // a boulder landing: the boom, a crack of stone, then the rattle of debris coming down
    rock(c, d, t) {
      tone(c, d, t, 'sine', 96, 28, 1.0, 1.0, 0.004); noiseBurst(c, d, t, 0.9, 'lowpass', 650, 70, 0.8, 1.0); noiseBurst(c, d, t, 0.12, 'bandpass', 1500, 700, 1, 0.6);
      for (let i = 0; i < 6; i++) noiseBurst(c, d, t + 0.18 + i * 0.11 + Math.random() * 0.1, 0.16, 'bandpass', 380 + Math.random() * 600, 160, 1, 0.3 - i * 0.03);
    },
    cannon(c, d, t) { tone(c, d, t, 'sine', 150, 38, 0.5, 0.9); noiseBurst(c, d, t, 0.45, 'lowpass', 1400, 200, 0.7, 0.9); noiseBurst(c, d, t, 0.12, 'highpass', 2200, 1200, 0.8, 0.5); },
    zap(c, d, t) { tone(c, d, t, 'sine', 1100, 520, 0.2, 0.18, 0.004); tone(c, d, t + 0.03, 'triangle', 1650, 700, 0.16, 0.1, 0.004); },
    // a siege arm: the thwack of the release, the wood groaning as the beam settles, the rock rushing away overhead
    launch(c, d, t) {
      noiseBurst(c, d, t, 0.11, 'lowpass', 2400, 500, 0.8, 0.95); tone(c, d, t, 'sine', 250, 52, 0.4, 0.8);
      const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), f = c.createBiquadFilter(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(96, t + 0.05); o.frequency.exponentialRampToValueAtTime(52, t + 0.75);
      lfo.frequency.value = 13; lg.gain.value = 7; lfo.connect(lg); lg.connect(o.frequency);
      f.type = 'bandpass'; f.frequency.value = 300; f.Q.value = 3.2; env(c, g, t + 0.05, 0.12, 0.7, 0.2); o.connect(f); f.connect(g); g.connect(d);
      o.start(t + 0.05); lfo.start(t + 0.05); o.stop(t + 0.95); lfo.stop(t + 0.95);
      for (let i = 0; i < 4; i++) noiseBurst(c, d, t + 0.12 + i * 0.13 + Math.random() * 0.05, 0.03, 'highpass', 3800, 5200, 1, 0.2);
      noiseBurst(c, d, t + 0.04, 0.9, 'bandpass', 420, 1900, 0.8, 0.4);
    },
    collapse(c, d, t) {
      noiseBurst(c, d, t, 2.2, 'lowpass', 380, 70, 0.7, 1.0); tone(c, d, t, 'sine', 62, 28, 1.6, 0.9, 0.04);
      for (let i = 0; i < 6; i++) noiseBurst(c, d, t + 0.15 + i * 0.22 + Math.random() * 0.12, 0.2, 'bandpass', 500 + Math.random() * 500, 200, 1, 0.4);
    },
    // a vault bursting: a glassy shatter (bright inharmonic pings on a noise crack) over a deep boom, then glitter falling
    chime(c, d, t) {
      noiseBurst(c, d, t, 0.18, 'highpass', 2600, 7000, 1, 0.6); tone(c, d, t, 'sine', 90, 34, 0.9, 0.7, 0.01);
      [1320, 1760, 2217, 2960, 3520].forEach((f, i) => tone(c, d, t + 0.02 + i * 0.045, 'sine', f * (1 + Math.random() * 0.02), f * 0.97, 1.1 - i * 0.1, 0.2, 0.004));
      for (let i = 0; i < 8; i++) tone(c, d, t + 0.25 + i * 0.09 + Math.random() * 0.05, 'sine', 2400 + Math.random() * 2600, 2200, 0.25, 0.08, 0.003);
    },
    breath(c, d, t) { noiseBurst(c, d, t, 0.9, 'bandpass', 700, 1500, 0.6, 0.5); noiseBurst(c, d, t, 0.9, 'lowpass', 400, 200, 0.5, 0.35); },
    pop(c, d, t) { tone(c, d, t, 'sine', 400, 120, 0.1, 0.25); },
    // spells
    thunder(c, d, t) { noiseBurst(c, d, t, 0.12, 'highpass', 2500, 900, 0.7, 1.0); noiseBurst(c, d, t + 0.03, 1.4, 'lowpass', 700, 70, 0.7, 1.0); tone(c, d, t + 0.02, 'sine', 70, 30, 1.1, 0.8); },
    heal(c, d, t) { [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(c, d, t + i * 0.11, 'sine', f, f, 0.7, 0.22, 0.02)); },
    rage(c, d, t) { tone(c, d, t, 'sawtooth', 90, 62, 0.9, 0.4, 0.05); noiseBurst(c, d, t, 0.9, 'lowpass', 420, 160, 0.6, 0.55); tone(c, d, t + 0.35, 'square', 140, 100, 0.5, 0.18, 0.02); },
    freeze(c, d, t) { [2400, 3100, 1900, 3600].forEach((f, i) => tone(c, d, t + i * 0.05, 'sine', f, f * 0.55, 0.5, 0.14, 0.004)); noiseBurst(c, d, t, 0.5, 'highpass', 3500, 6000, 0.9, 0.3); },
    quake(c, d, t) { noiseBurst(c, d, t, 1.9, 'lowpass', 160, 45, 0.7, 1.0); tone(c, d, t, 'sine', 48, 24, 1.8, 1.0, 0.05); for (let i = 0; i < 5; i++) noiseBurst(c, d, t + 0.2 + i * 0.28, 0.25, 'lowpass', 500, 160, 0.9, 0.5); },
  };
  // the roar of the armies: three bands of crowd noise (voices, steel, shuffling feet) that swell with the intensity of the fight (0..1)
  let bedN = null;
  const bedEnsure = (c) => {
    if (bedN) return bedN;
    const g = c.createGain(); g.gain.value = 0; g.connect(out(c)); const w = c.createGain(); w.gain.value = 0.5; g.connect(w); w.connect(hall(c));
    const srcs = [];
    for (const [f, q, a, lf] of [[420, 1.4, 0.55, 0.21], [820, 1.8, 0.4, 0.33], [1500, 1.6, 0.28, 0.47], [3600, 1.2, 0.1, 0.8]]) {
      const s = c.createBufferSource(); s.buffer = nbuf(c); s.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
      const sg = c.createGain(); sg.gain.value = a; const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = lf; lg.gain.value = a * 0.45; l.connect(lg); lg.connect(sg.gain);
      s.connect(bp); bp.connect(sg); sg.connect(g); s.start(0, Math.random()); l.start(); srcs.push(s, l);
    }
    return (bedN = { g, srcs });
  };
  const api = {
    at(name, x, y, z, vol = 1) {
      const c = ctx(); if (!c || !R[name]) return;
      const d = node(c, x, y, z, vol, name); if (d) R[name](c, d, c.currentTime + 0.005);
    },
    // the war horn: two stacked saws through a low-pass, swelling up and fading
    horn(low = false) {
      const c = ctx(); if (!c) return; const d = out(c), t = c.currentTime + 0.02, f = low ? 82 : 98;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; const g = c.createGain(); lp.connect(g); g.connect(d);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.24, t + 0.35); g.gain.setValueAtTime(0.24, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      for (const m of [1, 1.5, 2.005]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * m, t); o.frequency.linearRampToValueAtTime(f * m * 1.04, t + 0.4); o.connect(lp); o.start(t); o.stop(t + 2.4); }
    },
    // a short rising (victory) or falling (defeat) phrase
    fanfare(win) {
      const c = ctx(); if (!c) return; const d = out(c), t = c.currentTime + 0.05;
      const notes = win ? [523.3, 659.3, 784, 1046.5, 784, 1046.5, 1318.5] : [392, 349.2, 311.1, 261.6, 196];
      notes.forEach((f, i) => { const at = t + i * (win ? 0.16 : 0.34), dur = win ? 0.4 : 0.7; tone(c, d, at, 'triangle', f, f, dur, 0.3, 0.015); tone(c, d, at, 'sine', f * 2, f * 2, dur * 0.8, 0.08, 0.015); if (win) tone(c, d, at, 'sawtooth', f / 2, f / 2, dur, 0.05, 0.02); });
    },
    // crowd roar (cheer): formant-filtered noise swell
    cheer() { const c = ctx(); if (!c) return; const d = out(c), t = c.currentTime + 0.02; for (const f of [500, 900, 1600]) noiseBurst(c, d, t, 2.0, 'bandpass', f, f * 1.15, 1.8, 0.3); },
    roar(x, z, big) { if (audio && audio.roar) { const c = ctx(); if (!c) return; const now = c.currentTime; if (now - (last.roar || 0) < 1.2) return; last.roar = now; const g = gainPan(c, x, 8, z, 1).v; audio.roar(Math.max(0.15, g * (big ? 1 : 0.7))); } },
    bed(level) { const c = ctx(); if (!c) return; const b = bedEnsure(c); b.g.gain.setTargetAtTime(Math.max(0, Math.min(1, level)) * 0.2, c.currentTime, 0.8); },
    dispose() { const c = ctx(); if (!c || !bedN) return; const b = bedN; bedN = null; b.g.gain.setTargetAtTime(0, c.currentTime, 0.3); setTimeout(() => { for (const s of b.srcs) { try { s.stop(); } catch (e) { /* ignore */ } } try { b.g.disconnect(); } catch (e) { /* ignore */ } }, 1500); },
    ballista(x, y, z) { const c = ctx(); if (!c || !audio || !audio.twang) return; const g = gainPan(c, x, y, z, 1).v; audio.twang(g); },
  };
  return api;
}
