// Time of day: a full game day every CYCLE_MIN real minutes (same for every
// player — derived from the wall clock), keyframed sky/light/fog/exposure,
// sun & moon directions, and the Jalali date 800 years ago for the HUD.
import * as THREE from 'three';
import { tintP } from './theme.js';

export const CYCLE_MIN = 60;

export function gameHour(now = Date.now()) {
  const m = (now / 60000) % CYCLE_MIN;
  return (m / CYCLE_MIN) * 24;
}

// ------------------------------------------------------------------ keyframes
const C = (h) => new THREE.Color(h);          // (ColorManagement already converts sRGB hex -> linear)
const K = [
  // h,  zen,       mid,       hor,       fog,       fogD,   key col,   keyI, hemiSky,  hemiGnd,  hemiI, night, exp,  bloom, stars, cloud
  [0,    '#01030a', '#06102a', '#15294f', '#1d3159', 0.0017, '#bfd0ff', 2.3, '#6f8fd0', '#2a3222', 1.50, 1.00, 1.20, 0.55, 1.0, '#6f82ab'],
  [4.6,  '#01030a', '#06102a', '#15294f', '#1d3159', 0.0017, '#bfd0ff', 2.2, '#6f8fd0', '#2a3222', 1.50, 1.00, 1.20, 0.55, 1.0, '#6f82ab'],
  [5.5,  '#0e1f46', '#4a5a8a', '#e8a07c', '#7a7896', 0.0013, '#ffc090', 1.8, '#8c9cc8', '#3c382c', 1.15, 0.50, 1.10, 0.45, 0.3, '#d0a8b0'],
  [6.5,  '#3f72bc', '#98b6dc', '#ffd0a0', '#c8c0b8', 0.0010, '#ffdcb0', 3.1, '#c0d0ee', '#5e5638', 1.30, 0.08, 1.02, 0.40, 0.0, '#ffe8d4'],
  [8.5,  '#2e6ed0', '#80b1e8', '#d0e3f5', '#b8cde0', 0.00095, '#fff2dc', 3.7, '#cfe2ff', '#6f6440', 1.30, 0.0, 1.00, 0.30, 0.0, '#ffffff'],
  [12,   '#2a68cc', '#7aaeea', '#d4e6f7', '#bdd1e4', 0.0009, '#fff6e8', 4.1, '#d6e6ff', '#72683f', 1.35, 0.0, 0.98, 0.28, 0.0, '#ffffff'],
  [16.5, '#2d62c0', '#86aee0', '#eadcc6', '#c8cad0', 0.00095, '#ffe6c0', 3.5, '#cfdcf5', '#6c5e3c', 1.30, 0.0, 1.00, 0.32, 0.0, '#fff4e4'],
  [18,   '#34508e', '#a08aa0', '#f2a878', '#a8989c', 0.0011, '#ffc08a', 2.4, '#a8acd0', '#4e4432', 1.20, 0.25, 1.04, 0.45, 0.05, '#ffd0b0'],
  [19.1, '#0a1636', '#2a2f5e', '#6a4a6a', '#3a3a5c', 0.0015, '#c8c8ff', 1.9, '#7384c4', '#2e2c26', 1.30, 0.80, 1.15, 0.55, 0.6, '#8c86ae'],
  [20.3, '#01030a', '#06102a', '#15294f', '#1d3159', 0.0017, '#bfd0ff', 2.3, '#6f8fd0', '#2a3222', 1.50, 1.00, 1.20, 0.55, 1.0, '#6f82ab'],
  [24,   '#01030a', '#06102a', '#15294f', '#1d3159', 0.0017, '#bfd0ff', 2.3, '#6f8fd0', '#2a3222', 1.50, 1.00, 1.20, 0.55, 1.0, '#6f82ab'],
].map((k) => ({ h: k[0], zen: C(k[1]), mid: C(k[2]), hor: C(k[3]), fog: C(k[4]), fogD: k[5], key: C(k[6]), keyI: k[7],
  hemiSky: C(k[8]), hemiGnd: C(k[9]), hemiI: k[10], night: k[11], exposure: k[12], bloom: k[13], stars: k[14], cloud: C(k[15]) }));

const P = { zen: new THREE.Color(), mid: new THREE.Color(), hor: new THREE.Color(), fog: new THREE.Color(), key: new THREE.Color(),
  hemiSky: new THREE.Color(), hemiGnd: new THREE.Color(), cloud: new THREE.Color(),
  fogD: 0, keyI: 0, hemiI: 0, night: 0, exposure: 1, bloom: 0.5, stars: 0,
  sunDir: new THREE.Vector3(), moonDir: new THREE.Vector3(), keyDir: new THREE.Vector3(), hour: 0, sunUp: 0, moonUp: 0 };

const smooth = (t) => t * t * (3 - 2 * t);
export function sample(h) {
  h = ((h % 24) + 24) % 24;
  let i = 0; while (i < K.length - 2 && K[i + 1].h <= h) i++;
  const a = K[i], b = K[i + 1], t = smooth((h - a.h) / Math.max(1e-6, b.h - a.h));
  for (const k of ['zen', 'mid', 'hor', 'fog', 'key', 'hemiSky', 'hemiGnd', 'cloud']) P[k].copy(a[k]).lerp(b[k], t);
  for (const k of ['fogD', 'keyI', 'hemiI', 'night', 'exposure', 'bloom', 'stars']) P[k] = a[k] + (b[k] - a[k]) * t;
  // sun: rises east (+x) at 6, highest at 12, sets west at 18; moon opposite
  const th = ((h - 6) / 12) * Math.PI;
  P.sunDir.set(Math.cos(th) * 0.85, Math.sin(th) * 0.8, -0.38).normalize();
  const tm = ((h - 18) / 12) * Math.PI;
  P.moonDir.set(Math.cos(tm) * 0.7, Math.max(0.12, Math.sin(tm) * 0.62) , -0.62).normalize();
  P.sunUp = THREE.MathUtils.clamp(P.sunDir.y * 6 + 0.2, 0, 1);
  P.moonUp = THREE.MathUtils.clamp(Math.sin(tm) * 4 + 0.2, 0, 1);
  // shading light comes from whichever body is up (kept above the horizon so shadows stay sane)
  const src = h > 5.8 && h < 18.4 ? P.sunDir : P.moonDir;
  P.keyDir.copy(src); if (P.keyDir.y < 0.28) { P.keyDir.y = 0.28; P.keyDir.normalize(); }
  P.hour = h;
  return tintP(P);                      // p35 P9: the castle level's mood (theme.js) tints light / sky / fog; at level 30 nothing changes
}

// ------------------------------------------------------------------ Jalali date (kingdom era: 1405 -> 750)
export const ERA = 655;
export function toJalali(gy, gm, gd) {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979; gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + gdm[gm - 1];
  jy += 33 * Math.floor(days / 12053); days %= 12053;
  jy += 4 * Math.floor(days / 1461); days %= 1461;
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}
const p2 = (n) => String(n).padStart(2, '0');
// season from the real Jalali month: 0 spring, 1 summer, 2 autumn, 3 winter, plus a 0..1 progress
export function season(now = new Date()) {
  if (typeof window !== 'undefined' && window.__bwSeason) return window.__bwSeason;   // dev preview
  const [, jm, jd] = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const s = Math.floor((jm - 1) / 3), p = (((jm - 1) % 3) * 30 + jd) / 92;
  return { s, p, jm, jd };
}
// corner clock: { date: '750/07/09', time: '14:59', icon, weekday }
export function clockParts(now = new Date(), pin = null) {
  const [jy, jm, jd] = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const h = pin != null ? pin : gameHour(now.getTime()), hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
  const icon = h >= 5.5 && h < 7 ? '🌅' : h >= 7 && h < 17.5 ? '☀️' : h >= 17.5 && h < 19.3 ? '🌇' : '🌙';
  return { date: `${jy - ERA}/${p2(jm)}/${p2(jd)}`, time: `${p2(hh)}:${p2(mm)}`, icon, weekday: now.getDay() };
}
// time-of-day word for the welcome card / settings
export function todWord(h) {
  return h >= 5 && h < 7 ? 'dawn' : h >= 7 && h < 11 ? 'morning' : h >= 11 && h < 14 ? 'noon' : h >= 14 && h < 17 ? 'afternoon' : h >= 17 && h < 19.5 ? 'dusk' : 'night';
}
