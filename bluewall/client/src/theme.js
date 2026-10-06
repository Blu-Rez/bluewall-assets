// p35 P9: the colour mood of the whole realm follows the castle level (1..30).  Level 30 is the look the game had at level 20 (every tint = 1, the house mix = the old one);
// the lower levels wander through five moods on the way there:   1 warm thatch  ->  6 fresh green  ->  12 cool steel  ->  18 golden hour  ->  24 icy teal  ->  30 royal blue (today)
// Everything here is plain numbers (no three.js): tod.js tints the light / sky / fog it samples, terrain.js multiplies the meadow it bakes, the water multiplies its palette and
// town.js picks the house colour schemes with these weights when it builds.  Nothing is added to the frame: no light, no post-process, no extra draw call.
//   T            the live theme (arrays are re-filled in place on every change, so a holder of T always sees the current mood)
//   setThemeLevel(n)  /  onTheme(cb)  /  tintP(P) (called by tod.sample)  /  levelHint() + saveLevelHint(n)
export const BANDS = [1, 6, 12, 18, 24, 30];
// grass = meadow / forest / bank colour multiplier;  key = sun + moon;  sky = sky + clouds;  fog;  water;  houses = weights of the 9 colour schemes of town.js
// (cream+terracotta, light blue, blue+white roof, navy, black+steel, sand+brown, dark wood, liver red, green)  +  rustic = share of the plain thatch-and-timber look, blueCut = share of the houses that never get a blue roof
const MOOD = [
  { grass: [1.0, 1.1, 0.82], key: [1.06, 1.0, 0.88], sky: [1.06, 1.0, 0.92], fog: [1.07, 1.02, 0.9], water: [0.95, 1.1, 0.82], houses: [3.2, 0.25, 0.1, 0.03, 0.02, 2.8, 1.7, 0.8, 1.2], rustic: 0.7, blueCut: 0.95 },
  { grass: [0.86, 1.14, 0.84], key: [1.02, 1.02, 0.96], sky: [0.97, 1.03, 1.0], fog: [0.97, 1.03, 1.0], water: [0.88, 1.06, 1.0], houses: [1.6, 1.2, 0.8, 0.3, 0.15, 1.6, 1.0, 0.5, 1.3], rustic: 0.25, blueCut: 0.8 },
  { grass: [0.9, 1.0, 1.04], key: [0.95, 1.0, 1.1], sky: [0.92, 1.0, 1.12], fog: [0.93, 1.0, 1.12], water: [0.9, 1.0, 1.12], houses: [0.6, 1.6, 1.4, 1.0, 0.7, 0.5, 0.5, 0.3, 0.4], rustic: 0.1, blueCut: 0.25 },
  { grass: [1.0, 1.05, 0.9], key: [1.14, 1.0, 0.8], sky: [1.1, 0.98, 0.88], fog: [1.12, 1.0, 0.84], water: [1.04, 1.0, 0.88], houses: [0.4, 1.0, 1.3, 1.4, 1.0, 0.6, 0.4, 0.2, 0.3], rustic: 0.03, blueCut: 0 },
  { grass: [0.82, 1.04, 1.06], key: [0.9, 1.04, 1.12], sky: [0.86, 1.04, 1.14], fog: [0.88, 1.04, 1.14], water: [0.78, 1.04, 1.14], houses: [0.2, 1.2, 1.3, 1.3, 1.1, 0.25, 0.25, 0.1, 0.2], rustic: 0, blueCut: 0 },
  { grass: [1, 1, 1], key: [1, 1, 1], sky: [1, 1, 1], fog: [1, 1, 1], water: [1, 1, 1], houses: [0, 0.3, 0.28, 0.24, 0.18, 0, 0, 0, 0], rustic: -1, blueCut: 0 },   // p36 (owner 6 Oct 2026 «لول مکس همه چیز آبی»): the top level's town is ONLY the blue family (light blue, blue + white roof, navy, black + steel); the light / sky / water stay as they were
];
const lerp = (a, b, t) => a + (b - a) * t, sm = (t) => t * t * (3 - 2 * t);
const KEYS3 = ['grass', 'key', 'sky', 'fog', 'water'], GAMMA = 2.0;

export const T = { level: 30, ver: 0, blueCut: 0, grass: [1, 1, 1], key: [1, 1, 1], sky: [1, 1, 1], fog: [1, 1, 1], water: [1, 1, 1], houseW: MOOD[5].houses.slice(), rustic: -1 };
const subs = [];

export function themeAt(level, out = T) {
  const L = Math.max(1, Math.min(30, +level || 30));
  let i = 0; while (i < BANDS.length - 2 && BANDS[i + 1] <= L) i++;
  const a = MOOD[i], b = MOOD[i + 1], t = sm(Math.max(0, Math.min(1, (L - BANDS[i]) / (BANDS[i + 1] - BANDS[i]))));
  // the numbers above are tints as the eye sees them (sRGB-ish): the engine multiplies linear colours, so they are raised to GAMMA first (a 1.12 shows as ~+12 %, not +5 %)
  for (const k of KEYS3) for (let c = 0; c < 3; c++) out[k][c] = Math.pow(lerp(a[k][c], b[k][c], t), GAMMA);
  for (let c = 0; c < a.houses.length; c++) out.houseW[c] = lerp(a.houses[c], b.houses[c], t);
  out.rustic = lerp(a.rustic, b.rustic, t); out.blueCut = lerp(a.blueCut, b.blueCut, t); out.level = L;
  return out;
}
export function setThemeLevel(n) {
  const L = Math.max(1, Math.min(30, Math.round(+n || 30)));
  if (L === T.level && T.ver > 0) return T;
  themeAt(L); T.ver++;
  for (const f of subs) { try { f(T); } catch (e) { console.warn('theme', e); } }
  return T;
}
export function onTheme(cb) { subs.push(cb); }

// the sky / light colours of one sample of tod.js: tinted in place (a night keeps most of its blue: the tint fades to 35 % with the night)
export function tintP(P) {
  if (T.level >= 30) return P;
  const k = 1 - 0.65 * (P.night || 0), g = (t, c) => 1 + (t[c] - 1) * k;
  P.key.r *= g(T.key, 0); P.key.g *= g(T.key, 1); P.key.b *= g(T.key, 2);
  P.hemiSky.r *= g(T.sky, 0); P.hemiSky.g *= g(T.sky, 1); P.hemiSky.b *= g(T.sky, 2);
  for (const c of ['zen', 'mid', 'hor', 'cloud']) { P[c].r *= g(T.sky, 0); P[c].g *= g(T.sky, 1); P[c].b *= g(T.sky, 2); }
  P.fog.r *= g(T.fog, 0); P.fog.g *= g(T.fog, 1); P.fog.b *= g(T.fog, 2);
  return P;
}

// the last level this device showed (the world is built before the server answers): ?lv=N wins (dev / owner previews), else the saved hint, else 30
export function levelHint(fromServer = 0) {
  try { const q = new URLSearchParams(location.search).get('lv'); if (q && +q >= 1) return Math.min(30, Math.round(+q)); } catch (e) { /* no url */ }
  if (+fromServer >= 1) return Math.min(30, Math.round(+fromServer));                       // the sign-in answer carries the castle level
  try { const v = +localStorage.getItem('bw_lv_v1'); if (v >= 1) return Math.min(30, Math.round(v)); } catch (e) { /* storage blocked */ }
  return 30;
}
export function saveLevelHint(n) { try { localStorage.setItem('bw_lv_v1', String(Math.max(1, Math.min(30, Math.round(+n || 30))))); } catch (e) { /* storage blocked */ } }
