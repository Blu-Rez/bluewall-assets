import { createSFX } from '/home/claude/bot/bluebot_v2/bluewall/client/src/bsfx.js';
window.renderDemo = async function () {
  const st = window.setTimeout; window.setTimeout = (f) => { f(); return 0; };   // (offline rendering runs faster than real time: do not let the voice limiter wait for the wall clock)
  const SR = 44100, DUR = 16, off = new OfflineAudioContext(2, SR * DUR, SR);
  const master = off.createGain(); master.gain.value = 0.9; const comp = off.createDynamicsCompressor(); master.connect(comp); comp.connect(off.destination);
  const chars = off.createGain(); chars.connect(master);
  const audio = { ctx: off, began: true, chars, fx: chars };
  const sfx = createSFX(audio, null);
  const ev = [];
  const at = (t, f) => ev.push([t, f]);
  at(0.1, () => sfx.horn(false));
  // 1) sword fight: a duel then a melee
  for (let i = 0; i < 9; i++) at(2.6 + i * 0.33 + Math.random() * 0.1, () => sfx.at(Math.random() < 0.35 ? 'clang' : 'sword', 0, 2, 0, 0.85));
  // 2) catapults: launch, then the boulder lands 1.6 s later
  for (const t of [6.4, 9.0]) { at(t, () => sfx.at('launch', 0, 3, 0, 1)); at(t + 1.7, () => sfx.at('rock', 0, 1, 0, 1)); at(t + 2.0, () => sfx.at('stone', 0, 2, 0, 0.7)); }
  // 3) the whole fight: crowd bed + dense steel + a collapse
  at(11.2, () => sfx.bed(0.9));
  for (let i = 0; i < 40; i++) at(11.4 + i * 0.11 + Math.random() * 0.08, () => sfx.at(Math.random() < 0.35 ? 'clang' : 'sword', 0, 2, 0, 0.85));
  at(13.2, () => sfx.at('launch', 0, 3, 0, 1)); at(14.0, () => sfx.at('collapse', 0, 2, 0, 1)); at(15.0, () => sfx.bed(0));
  ev.sort((a, b) => a[0] - b[0]);
  for (const [t, f] of ev) { off.suspend(Math.max(0.001, t)).then(() => { f(); off.resume(); }); }
  const buf = await off.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1); let pk = 0, rms = 0; for (let i = 0; i < L.length; i++) { pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); rms += L[i] * L[i]; }
  const gain = pk > 0.97 ? 0.97 / pk : 1, n = L.length, bytes = new Uint8Array(44 + n * 4), dv = new DataView(bytes.buffer);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true); dv.setUint32(24, SR, true); dv.setUint32(28, SR * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) { dv.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i] * gain)) * 32767, true); dv.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i] * gain)) * 32767, true); }
  let bin = ''; const CH = 0x8000; for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return { b64: btoa(bin), peak: pk, rms: Math.sqrt(rms / n) };
};
