// GR1_R2 — the horizon, in one place.  ONE colour table (what the player SEES, sRGB, per game hour) that three things share:
//   · the fog (so everything far away fades into it),
//   · the sky's own horizon band (sky.js paints exactly this colour at 0..~11° above the horizon),
//   · the far mountains (backdrop.js blends toward it).
// Before this the fog colour and the sky near the horizon were two unrelated colours (the dusk sky was brown-black, the fog pale mauve; at night the
// sky navy-black, the fog pale blue), so far hills never melted into the sky: they stood in front of it as dark saw-tooth silhouettes.
// Each row: [game hour, colour seen on the far ground / on the horizon (the mean of "toward the sun" and "away from it"), colour on the sun / moon side].
import * as THREE from 'three';

const T = [
  [0,    '#1d3159', '#2d4878'],
  [4.6,  '#1d3159', '#2d4878'],
  [5.5,  '#c98f84', '#eba070'],
  [6.5,  '#c3b8a6', '#efd5ad'],
  [7.5,  '#c2cdd0', '#e6eaea'],
  [8.5,  '#c6d7e3', '#dde6e8'],
  [12,   '#c8d9e6', '#dfe9ee'],
  [16.5, '#bccacf', '#e6e8e2'],
  [17.3, '#b5a698', '#e0c8a0'],
  [18,   '#cf9a7c', '#f0a860'],
  [18.6, '#9a6c70', '#d08060'],
  [19.1, '#5e4a72', '#7a5a80'],
  [19.7, '#34426e', '#41507f'],
  [20.3, '#1d3159', '#2d4878'],
  [24,   '#1d3159', '#2d4878'],
].map((k) => ({ h: k[0], a: new THREE.Color(k[1]), s: new THREE.Color(k[2]) }));

const sm = (t) => t * t * (3 - 2 * t);
// fills P.hzn / P.hznSun (THREE.Color, linear working space like every colour in P) and sets P.fog = P.hzn
export function horizonAt(h, P) {
  if (!P.hzn) { P.hzn = new THREE.Color(); P.hznSun = new THREE.Color(); }
  h = ((h % 24) + 24) % 24;
  let i = 0; while (i < T.length - 2 && T[i + 1].h <= h) i++;
  const a = T[i], b = T[i + 1], t = sm((h - a.h) / Math.max(1e-6, b.h - a.h));
  P.hzn.copy(a.a).lerp(b.a, t); P.hznSun.copy(a.s).lerp(b.s, t);
  P.fog.copy(P.hzn);
}
// the castle level's mood (theme.js tintP) has tinted P.fog: the horizon follows it, the sun side by the same per-channel ratio
export function horizonTinted(P) {
  const k = (c, o) => (o > 1e-4 ? c / o : 1);
  P.hznSun.r *= k(P.fog.r, P.hzn.r); P.hznSun.g *= k(P.fog.g, P.hzn.g); P.hznSun.b *= k(P.fog.b, P.hzn.b);
  P.hzn.copy(P.fog);
  return P;
}
