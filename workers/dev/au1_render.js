// AU1: browser entry for the offline spectrum test. Renders ONE synthesized one-shot (audio.js SYNTH.* or bsfx.js R.*) dry, at full level,
// into an OfflineAudioContext and hands the samples back (base64 float32). Bundled by au1_test.sh, driven by au1_spectrum_test.py.
import { SYNTH } from '../bot/bluebot_v2/bluewall/client/src/audio.js';
import { createSFX } from '../bot/bluebot_v2/bluewall/client/src/bsfx.js';

const sfx = createSFX({}, null);
const NAMES = Object.keys(SYNTH).concat(sfx.names());
const b64 = (f32) => { const u = new Uint8Array(f32.buffer, f32.byteOffset, f32.byteLength); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };

window.AU1R = {
  names: () => NAMES,
  async render(name, secs = 6, seed = 1, sr = 44100) {
    const c = new OfflineAudioContext(1, Math.round(sr * secs), sr), d = c.createGain(); d.gain.value = 1; d.connect(c.destination);
    const t = 0.05, rnd = Math.random; let a = (seed * 2654435761) >>> 0;
    Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let x = a; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };   // seeded: the random pitches are the worst case of N seeds
    try { if (SYNTH[name]) SYNTH[name](c, d, t); else sfx.render(name, c, d, t); } finally { Math.random = rnd; }
    const buf = await c.startRendering();
    return b64(buf.getChannelData(0));
  },
};
