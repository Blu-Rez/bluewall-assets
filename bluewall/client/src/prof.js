// Tiny per-subsystem CPU profiler (JS ms per frame). OFF by default: while off, pb()/pe() are one boolean test, i.e. free.
// Used by the dev harness (window.__bwProf) and the optional on-device overlay (settings -> graphics -> performance info).
// pb() starts a chain, pe(key) charges the time since the previous mark to `key` and re-marks.
export const PROF = { on: false, ms: Object.create(null), avg: Object.create(null), frames: 0 };
let t0 = 0;
export function pb() { if (PROF.on) t0 = performance.now(); }
export function pe(k) { if (PROF.on) { const n = performance.now(); PROF.ms[k] = (PROF.ms[k] || 0) + n - t0; t0 = n; } }
// once per drawn frame: fold this frame's numbers into a rolling average (EMA, ~30 frames)
export function pframe() {
  if (!PROF.on) return;
  const a = PROF.avg, m = PROF.ms;
  for (const k in a) if (!(k in m)) a[k] *= 0.9;
  for (const k in m) { a[k] = a[k] === undefined ? m[k] : a[k] * 0.9 + m[k] * 0.1; m[k] = 0; delete m[k]; }
  PROF.frames++;
}
if (typeof window !== 'undefined') window.__bwProf = PROF;
