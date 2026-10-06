// Player settings: defaults, persistence (localStorage, best-effort, debounced), change events.
const KEY = 'bw_settings_v1';

export const DEFAULTS = {
  // sound
  master: 0.9, music: 0.6, ambience: 0.8, characters: 0.8, effects: 0.8, voice: true, bgMute: true,
  // graphics (grass / trees / viewDist have no UI row; main.js and world.js read them)
  quality: 'auto', shadows: true, bloom: true, grass: 'high', trees: 'high', resScale: 1, fps: 60, idleEco: true, viewDist: 1,
  // display
  fpsMeter: false, shake: true,
  // p28: cool mode (30 fps, render scale <= 1, shadows 1/6, no mirror, no bloom) and the on-device performance overlay
  coolMode: false, perfInfo: false,
  // controls
  rotSpeed: 1, zoomSpeed: 1, invertRotate: false, haptics: true,
  // owner-only: preview the castle at any level (0 = real level)
  previewLevel: 0,
};

// keep stored values sane (old builds, hand-edited storage): wrong type -> default, numbers clamped
const RANGE = { master: [0, 1], music: [0, 1], ambience: [0, 1], characters: [0, 1], effects: [0, 1], resScale: [0.5, 1], viewDist: [0.5, 2],
  rotSpeed: [0.5, 2], zoomSpeed: [0.5, 2], previewLevel: [0, 30] };
const clean = (k, v) => {
  const d = DEFAULTS[k];
  if (typeof v !== typeof d || (typeof v === 'number' && !Number.isFinite(v))) return d;
  if (k === 'fps') return v === 30 ? 30 : 60;
  if (k === 'previewLevel') v = Math.round(v);
  const r = RANGE[k]; return r ? Math.min(r[1], Math.max(r[0], v)) : v;
};

const subs = new Set();
const S = { ...DEFAULTS };
try {
  const raw = localStorage.getItem(KEY);
  if (raw) { const j = JSON.parse(raw); for (const k of Object.keys(DEFAULTS)) if (j && k in j) S[k] = clean(k, j[k]); }
} catch (e) { /* storage unavailable: defaults */ }

// sliders fire many changes per second: write storage at most every 300 ms (and when the page hides)
let saveT = 0;
const save = () => { saveT = 0; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
const saveSoon = () => { if (!saveT) saveT = setTimeout(save, 300); };
try { addEventListener('pagehide', () => { if (saveT) { clearTimeout(saveT); save(); } }); document.addEventListener('visibilitychange', () => { if (document.hidden && saveT) { clearTimeout(saveT); save(); } }); } catch (e) { /* no DOM */ }

export const settings = new Proxy(S, {
  set(o, k, v) {
    if (k in DEFAULTS) v = clean(k, v);
    if (o[k] === v) return true;
    o[k] = v;
    saveSoon();
    for (const f of subs) { try { f(k, v); } catch (e) { console.warn(e); } }
    return true;
  },
});
export const onSetting = (f) => { subs.add(f); return () => subs.delete(f); };
export function resetSettings({ keep = ['previewLevel'] } = {}) { for (const k of Object.keys(DEFAULTS)) if (!keep.includes(k)) settings[k] = DEFAULTS[k]; }
