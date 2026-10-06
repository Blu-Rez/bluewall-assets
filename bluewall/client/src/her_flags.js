// Heraldry of the castle: every flag, pennant, hanging banner and wall tapestry is real cloth, and the gate carries the realm's name.
//   * ONE merged mesh + ONE material for all the cloth (one draw call, no shadow pass). Each vertex knows its pinned point, its rest frame
//     and where it sits on the cloth; the vertex shader rebuilds the cloth every frame: travelling waves that grow from the pinned edge,
//     a flutter at the free end, gusts from weather.WIND; the normal comes from the wave, so the folds catch the light. Far from the camera the
//     cloth freezes into a still, folded shape (uniforms only - no CPU work per vertex, ever).
//   * ONE texture (an atlas) holds every design: pennant, tall banner, square banner. The crest (emblems.drawCrest) is painted into it once;
//     setEmblem (textures.js) repaints it (home: the player's crest, battle: the defender's).
//   * The gate plaque: a slate tablet in a gilded frame with raised gilded letters - setGateName(text).
//   * Destruction (destruct.js) is patched into the cloth material: flags and banners fall with their tower in a battle.
// API (drop-in for fx.Flags):  new Heraldry(B, M) . add(x,y,z,ry,s,tid) . banner(x,y,z,ry,w,h,tid,o) . plaque(x,y,z,face,w,h,tid) . build(scene)
//                              . update(t) . hide(id) . reset() . mesh.visible (levels.js)        setGateName(text)
import * as THREE from 'three';
import { drawCrest } from './emblems.js';
import { onEmblem } from './textures.js';
import { WIND } from './weather.js';
import { patchDestruct } from './destruct.js';
import { mat4 } from './util.js';

// ---- taste switches (the owner picks; the default ships)
export const FLAG_YAW = 'wind';          // 'wind': every flag flies with the (flag) wind, seen broadside from the default view | 'design': each its own heading (old)
export let PLAQUE_STYLE = 'slate';       // 'slate': dark slate, gilded frame, raised gilded letters | 'bronze': cast bronze tablet | 'marble': pale stone, carved letters, inlaid blue
export let CLOTH = 'navy';               // 'navy': royal blue + silver trim (default) | 'royal': blue + gold trim | 'night': black + ice-blue trim

// the flag wind: blows toward the screen-right of the default camera (azim 0.95), a slow swing of the heading on top
const WIND_YAW = Math.atan2(0.81, 0.58);  // along (0.58, 0, -0.81): yaw = atan2(-dz, dx)
const FAR = [360, 560];                    // cloth animates up to FAR[0] m from the camera (the whole home view), frozen beyond FAR[1] (the zoomed-out intro)

// ------------------------------------------------------------------------------------------------ the atlas
const AW = 1024, AH = 1024;
// cells (px): pennant (pole on the left), tall banner, square banner
const CELL = { flag: [8, 8, 656, 392], tall: [688, 8, 328, 800], square: [8, 424, 400, 416] };
const PALS = {
  navy: { f0: '#4a95f5', f1: '#2263cc', f2: '#123a86', trim: ['#ffffff', '#d4e4f6', '#6f86a8'], line: '#e4f2ff', thread: 'rgba(224,240,255,0.95)' },     // royal blue, silver
  royal: { f0: '#3f86ee', f1: '#1a4fb4', f2: '#0a2668', trim: ['#fff4cf', '#e7bd55', '#8a6216'], line: '#f2d27a', thread: 'rgba(255,226,150,0.9)' },     // blue, gold
  night: { f0: '#2a3b5c', f1: '#121c33', f2: '#05080f', trim: ['#e8f6ff', '#8fd3ff', '#2f6aa8'], line: '#8fd3ff', thread: 'rgba(160,215,255,0.9)' },      // black, ice
};
let PAL = PALS[CLOTH] || PALS.navy;
// switch a taste at run time (dev sheets; the shipped look is the constants above)
export function setHeraldryStyle({ cloth, plaque } = {}) {
  if (cloth && PALS[cloth]) { CLOTH = cloth; PAL = PALS[cloth]; paintAtlas(); }
  if (plaque && STY[plaque]) { PLAQUE_STYLE = plaque; if (PLQ) paintPlaque(); }
}

function rngOf(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
let WEAVE = null;
function weave(g) {                                         // a fine cross weave + slubs, used as a pattern over the dyed cloth
  if (!WEAVE) {
    const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d');
    for (let i = 0; i < 16; i += 2) { x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(0, i, 16, 1); x.fillStyle = 'rgba(0,0,0,0.065)'; x.fillRect(i, 0, 1, 16); }
    x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(3, 5, 4, 1); x.fillRect(10, 12, 5, 1); x.fillStyle = 'rgba(0,0,0,0.07)'; x.fillRect(7, 1, 1, 5); x.fillRect(13, 8, 1, 4);
    WEAVE = c;
  }
  return g.createPattern(WEAVE, 'repeat');
}
// the dyed field: vertical light falloff + a soft sheen band + mottling (uneven dye, sun bleach, grime toward the free edge)
function dye(g, path, x, y, w, h, r, grimeY = 1) {
  g.save(); g.clip(path);
  const gr = g.createLinearGradient(x, y, x + w * 0.3, y + h); gr.addColorStop(0, PAL.f0); gr.addColorStop(0.55, PAL.f1); gr.addColorStop(1, PAL.f2);
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  for (let i = 0; i < 26; i++) {
    const cx = x + r() * w, cy = y + r() * h, rad = (0.08 + r() * 0.22) * Math.max(w, h), a = 0.035 + r() * 0.05, light = r() < 0.45;
    const rg = g.createRadialGradient(cx, cy, 0, cx, cy, rad); rg.addColorStop(0, light ? `rgba(160,200,255,${a})` : `rgba(0,4,16,${a * 1.4})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
  const gy = g.createLinearGradient(0, y + h * grimeY * 0.6, 0, y + h); gy.addColorStop(0, 'rgba(10,8,6,0)'); gy.addColorStop(1, 'rgba(10,8,6,0.28)');
  if (grimeY > 0) { g.fillStyle = gy; g.fillRect(x, y, w, h); }
  g.fillStyle = weave(g); g.fillRect(x, y, w, h);
  g.restore();
}
// a metallic braid / trim stroke along a path (three passes: dark core, metal body, a thin highlight)
function trim(g, path, lw, dash) {
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = 'rgba(0,4,14,0.7)'; g.lineWidth = lw + 3; g.stroke(path);
  const [a, b, c] = PAL.trim; g.strokeStyle = b; g.lineWidth = lw; g.stroke(path);
  g.strokeStyle = a; g.lineWidth = Math.max(1, lw * 0.3); g.setLineDash(dash || [lw * 0.9, lw * 0.7]); g.stroke(path); g.setLineDash([]);
  g.strokeStyle = c; g.globalAlpha = 0.5; g.lineWidth = 1; g.stroke(path);
  g.restore();
}
function stitch(g, path) { g.save(); g.setLineDash([5, 5]); g.strokeStyle = 'rgba(200,225,255,0.4)'; g.lineWidth = 1.4; g.stroke(path); g.restore(); }
function crestOn(g, cx, cy, size) {
  g.save(); g.shadowColor = 'rgba(0,4,16,0.55)'; g.shadowBlur = size * 0.04; g.shadowOffsetY = size * 0.025;
  drawCrest(g, EMB, cx, cy, size); g.restore();
}
// fringe of threads below y (tassels): alpha-cut, so they read as a frayed, heavy hem
function fringe(g, x0, x1, y, len, r) {
  g.save(); g.lineCap = 'round';
  for (let x = x0 + 2; x < x1 - 1; x += 3.2) {
    const l = len * (0.75 + r() * 0.3);
    g.strokeStyle = r() < 0.5 ? PAL.thread : PAL.trim[1]; g.lineWidth = 2.1;
    g.beginPath(); g.moveTo(x, y - 2); g.quadraticCurveTo(x + (r() - 0.5) * 3, y + l * 0.5, x + (r() - 0.5) * 4, y + l); g.stroke();
  }
  g.restore();
}

let EMB = 'swords', ATLAS = null;
function paintFlag(g) {
  const [x, y, w, h] = CELL.flag, r = rngOf(17);
  g.clearRect(x - 8, y - 8, w + 16, h + 16);
  const notch = w * 0.2, sleeve = 34, path = new Path2D();             // swallow-tailed: a V cut into the fly
  path.moveTo(x, y + 3); path.lineTo(x + w - 2, y + 3); path.lineTo(x + w - notch, y + h / 2); path.lineTo(x + w - 2, y + h - 3); path.lineTo(x, y + h - 3); path.closePath();
  dye(g, path, x, y, w, h, r, 0);
  g.save(); g.clip(path);
  // the sleeve round the pole: a darker folded band with stitching; two pale bars along the edges (a bordure)
  const sl = g.createLinearGradient(x, 0, x + sleeve, 0); sl.addColorStop(0, 'rgba(0,3,12,0.75)'); sl.addColorStop(0.7, 'rgba(0,3,12,0.25)'); sl.addColorStop(1, 'rgba(255,255,255,0.08)');
  g.fillStyle = sl; g.fillRect(x, y, sleeve, h);
  const bar = new Path2D(); bar.moveTo(x + sleeve + 8, y + 22); bar.lineTo(x + w - 22, y + 22); bar.moveTo(x + sleeve + 8, y + h - 22); bar.lineTo(x + w - 22, y + h - 22);
  trim(g, bar, 7);
  // an ice-blue fess from behind the crest into the notch, edged in silver (reads at any distance)
  const fy0 = y + h / 2 - 24, fx0 = x + sleeve + (w - sleeve - notch) * 0.42, fess = new Path2D(); fess.rect(fx0, fy0, x + w - fx0, 48);
  g.fillStyle = 'rgba(120,190,255,0.42)'; g.fill(fess);
  const fl = new Path2D(); fl.moveTo(fx0, fy0); fl.lineTo(x + w, fy0); fl.moveTo(fx0, fy0 + 48); fl.lineTo(x + w, fy0 + 48); trim(g, fl, 4);
  const st = new Path2D(); st.moveTo(x + sleeve, y); st.lineTo(x + sleeve, y + h); stitch(g, st);
  g.restore();
  trim(g, path, 6, [10, 6]);
  crestOn(g, x + sleeve + (w - sleeve - notch) * 0.42, y + h / 2, h * 0.76);
  // frayed tips of the tails
  g.save(); g.globalCompositeOperation = 'destination-out';
  for (const ty of [y + 6, y + h - 6]) for (let i = 0; i < 7; i++) { g.fillRect(x + w - 4 - r() * 26, ty - 3 + (r() - 0.5) * 8, 2 + r() * 10, 2); }
  g.restore();
}
function paintTall(g) {
  const [x, y, w, h] = CELL.tall, r = rngOf(29);
  g.clearRect(x - 8, y - 8, w + 16, h + 16);
  const fr = 44, dip = 64, yb = y + h - fr - dip, path = new Path2D();       // the hem at the top folds round the rod; the foot is a shallow chevron over a fringe
  path.moveTo(x + 2, y); path.lineTo(x + w - 2, y); path.lineTo(x + w - 2, yb); path.lineTo(x + w / 2, yb + dip); path.lineTo(x + 2, yb); path.closePath();
  dye(g, path, x, y, w, h - fr, r);
  g.save(); g.clip(path);
  const hem = g.createLinearGradient(0, y, 0, y + 30); hem.addColorStop(0, 'rgba(0,3,12,0.8)'); hem.addColorStop(1, 'rgba(0,3,12,0.1)');
  g.fillStyle = hem; g.fillRect(x, y, w, 30);
  // the bordure: a silver braid inset, following the chevron, with small lozenges along the sides
  const m = 22, bd = new Path2D(); bd.moveTo(x + m, y + 44); bd.lineTo(x + w - m, y + 44); bd.lineTo(x + w - m, yb - 10); bd.lineTo(x + w / 2, yb + dip - 28); bd.lineTo(x + m, yb - 10); bd.closePath();
  trim(g, bd, 6);
  g.fillStyle = 'rgba(190,225,255,0.22)';
  for (let yy = y + 64; yy < yb - 24; yy += 22) for (const xx of [x + m, x + w - m]) { g.beginPath(); g.moveTo(xx, yy - 5); g.lineTo(xx + 4, yy); g.lineTo(xx, yy + 5); g.lineTo(xx - 4, yy); g.closePath(); g.fill(); }
  // a pale pale (stripe) descending from the crest to the point
  g.globalAlpha = 0.16; g.fillStyle = '#bfe0ff'; g.fillRect(x + w / 2 - 14, y + (yb - y) * 0.6, 28, dip + (yb - y) * 0.4); g.globalAlpha = 1;
  // three stars of the realm under the crest
  for (const [sx, sy, sr] of [[x + w / 2, y + (yb - y) * 0.8, 16], [x + w * 0.29, y + (yb - y) * 0.74, 9], [x + w * 0.71, y + (yb - y) * 0.74, 9]]) {
    g.fillStyle = PAL.line; g.beginPath(); for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 4, rr = i % 2 ? sr * 0.38 : sr; g.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } g.closePath(); g.fill();
  }
  const st = new Path2D(); st.moveTo(x, y + 30); st.lineTo(x + w, y + 30); stitch(g, st);
  g.restore();
  trim(g, path, 7, [12, 6]);
  crestOn(g, x + w / 2, y + 44 + ((yb - y) * 0.6 - 44) * 0.5 + 8, w * 0.84);
  fringeAlong(g, [[x + 4, yb], [x + w / 2, yb + dip], [x + w - 4, yb]], fr, r);
}
// a fringe hanging straight down from a polyline edge
function fringeAlong(g, pts, len, r) {
  g.save(); g.lineCap = 'round';
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, ay] = pts[k], [bx, by] = pts[k + 1], d = Math.hypot(bx - ax, by - ay), n = Math.floor(d / 3.2);
    for (let i = 0; i <= n; i++) {
      const f = i / n, px = ax + (bx - ax) * f, py = ay + (by - ay) * f - 3, l = len * (0.78 + r() * 0.3);
      g.strokeStyle = r() < 0.5 ? PAL.thread : PAL.trim[1]; g.lineWidth = 2.1;
      g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + (r() - 0.5) * 3, py + l * 0.5, px + (r() - 0.5) * 4, py + l); g.stroke();
    }
  }
  // a knotted heading over the fringe
  g.strokeStyle = PAL.trim[2]; g.lineWidth = 4; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py + 2) : g.moveTo(px, py + 2))); g.stroke();
  g.restore();
}
function paintSquare(g) {
  const [x, y, w, h] = CELL.square, r = rngOf(41);
  g.clearRect(x - 8, y - 8, w + 16, h + 16);
  const dag = 46, fr = 26, path = new Path2D(), n = 5, yb = y + h - fr - dag;       // dagged foot: five points
  path.moveTo(x + 2, y); path.lineTo(x + w - 2, y); path.lineTo(x + w - 2, yb);
  for (let i = n; i >= 0; i--) { const xx = x + 2 + ((w - 4) * i) / n; if (i < n) path.lineTo(xx + (w - 4) / n / 2, yb + dag); path.lineTo(xx, yb); }
  path.closePath();
  dye(g, path, x, y, w, h - fr, r);
  g.save(); g.clip(path);
  const hem = g.createLinearGradient(0, y, 0, y + 28); hem.addColorStop(0, 'rgba(0,3,12,0.8)'); hem.addColorStop(1, 'rgba(0,3,12,0.1)');
  g.fillStyle = hem; g.fillRect(x, y, w, 28);
  const bd = new Path2D(); bd.rect(x + 18, y + 40, w - 36, yb - y - 52); trim(g, bd, 5);
  const st = new Path2D(); st.moveTo(x, y + 28); st.lineTo(x + w, y + 28); stitch(g, st);
  g.restore();
  trim(g, path, 6, [12, 6]);
  crestOn(g, x + w / 2, y + 40 + (yb - y - 52) / 2, Math.min(w - 70, yb - y - 70));
  for (let i = 0; i < n; i++) { const cx = x + 2 + ((w - 4) * (i + 0.5)) / n; fringe(g, cx - 9, cx + 9, yb + dag - 4, fr, r); }
}
function paintAtlas() {
  if (!ATLAS) return;
  const g = ATLAS.g;
  paintFlag(g); paintTall(g); paintSquare(g);
  ATLAS.t.needsUpdate = true;
}
function atlasTexture() {
  if (ATLAS) return ATLAS.t;
  const c = document.createElement('canvas'); c.width = AW; c.height = AH;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.flipY = true;
  ATLAS = { c, g: c.getContext('2d'), t };
  onEmblem((id) => { const ch = id !== EMB; EMB = id; paintAtlas(); if (ch && PLQ) paintPlaque(); });   // paints now and on every crest change (the plaque carries it too)
  return t;
}
// atlas uv of a cell point (u: 0..1 left to right, v: 0..1 top to bottom)
function cellUV(cell, u, v) { const [x, y, w, h] = CELL[cell]; return [(x + u * w) / AW, 1 - (y + v * h) / AH]; }

// ------------------------------------------------------------------------------------------------ the cloth shader
const U = { uTime: { value: 0 }, uWind: { value: 0.35 }, uFlagOn: { value: 1 }, uYaw: { value: WIND_YAW }, uYawMix: { value: FLAG_YAW === 'wind' ? 1 : 0 }, uFar: { value: new THREE.Vector2(FAR[0], FAR[1]) } };
const VPARS = `
uniform float uTime; uniform float uWind; uniform float uFlagOn; uniform float uYaw; uniform float uYawMix; uniform vec2 uFar;
attribute vec4 aCl;      // s (0 at the pinned edge .. 1 the free end), t (0..1 across), phase, kind (0 flag on a pole, 1 hanging banner, 2 wall tapestry)
attribute vec4 aPin;     // pinned point (world) + rest heading
attribute vec3 aDim;     // length along s, length along t, wave amplitude (m)
varying float vFold;
vec3 clDelta;
// the wave height at (s, t): travelling waves from the pinned edge, amplitude growing toward the free end
float clW(float s, float t, float tt, float ph, float kind) {
  if (kind < 0.5) {
    float e = pow(s, 1.25);
    float w = 0.62 * sin(6.2832 * (1.35 * s - 0.95 * tt) + ph + 0.35 * t)
            + 0.27 * sin(6.2832 * (2.6 * s - 1.7 * tt) + 1.7 * ph - 1.1 * t)
            + 0.11 * s * sin(6.2832 * (5.2 * s - 3.4 * tt) + 2.3 * ph + 2.4 * t);
    return e * w;
  }
  float e = pow(s, 1.5);
  float w = 0.65 * sin(6.2832 * (0.8 * s - 0.22 * tt) + ph + 1.1 * t) + 0.35 * sin(6.2832 * (1.6 * s - 0.37 * tt) + 2.1 * ph - 1.7 * t);
  float pleat = sin(6.2832 * 2.5 * t + ph) * (0.35 + 0.65 * s) * smoothstep(0.0, 0.08, s);   // the folds gathered on the rod
  w = e * w + 1.35 * pleat;
  if (kind > 1.5) w = 0.5 + 0.5 * w;                                    // against a wall: it only billows outward
  return w;
}
`;
const VBODY = `{
  float s = aCl.x, t = aCl.y, ph = aCl.z, kind = aCl.w;
  float an = 1.0 - smoothstep(uFar.x, uFar.y, distance(cameraPosition, aPin.xyz));   // far away: still cloth
  float tt = uTime * (0.85 + 0.3 * fract(ph * 7.31));
  float wind = clamp(uWind, 0.0, 1.4);
  float A = aDim.z * (kind < 0.5 ? (0.55 + 0.75 * wind) : (0.6 + 0.6 * wind));
  float e = 0.025;
  float w0 = mix(clW(s, t, 0.0, ph, kind), clW(s, t, tt, ph, kind), an);
  float ws = mix(clW(s + e, t, 0.0, ph, kind), clW(s + e, t, tt, ph, kind), an);
  float wt = mix(clW(s, t + e, 0.0, ph, kind), clW(s, t + e, tt, ph, kind), an);
  vec3 up = vec3(0.0, 1.0, 0.0), S, T, N; float Ls = aDim.x, Lt = aDim.y; vec3 P;
  if (kind < 0.5) {
    float yaw = aPin.w;
    if (uYawMix > 0.5) yaw = uYaw + 0.22 * sin(uTime * 0.13 + ph) * an + 0.18 * (fract(ph * 3.7) - 0.5);
    S = vec3(cos(yaw), 0.0, -sin(yaw)); T = -up; N = cross(S, up);
    float droop = (0.16 - 0.1 * min(wind, 1.0)) * s * s * Ls;            // a slack flag sags at the fly
    P = aPin.xyz + S * (s * Ls * (1.0 - 0.04 * s)) + T * (t * Lt) - up * droop;
  } else {
    float yaw = aPin.w; S = -up; T = vec3(cos(yaw), 0.0, -sin(yaw)); N = vec3(sin(yaw), 0.0, cos(yaw));
    P = aPin.xyz + S * (s * Ls) + T * ((t - 0.5) * Lt);
  }
  P += N * (w0 * A);
  vec3 dS = S * Ls + N * ((ws - w0) * A / e), dT = T * Lt + N * ((wt - w0) * A / e);
  vec3 n = normalize(cross(dS, dT)); if (dot(n, N) < 0.0) n = -n;
  objectNormal = n;
  if (kind < 0.5 && uFlagOn < 0.5) P = aPin.xyz;                        // (no flags below wall level 4)
  clDelta = P - position;
  vFold = clamp(0.5 + 0.55 * (kind > 1.5 ? 2.0 * w0 - 1.0 : w0), 0.0, 1.0);
}`;
function clothMaterial(map) {
  const m = new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0x2a4a78, emissiveIntensity: 0.32, roughness: 0.74, metalness: 0.0, side: THREE.DoubleSide, alphaTest: 0.5, envMapIntensity: 0.35 });
  m.name = 'her-cloth';
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VPARS)
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n' + VBODY)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += clDelta;');
    // the folds: the side of each wave that turns away darkens a little (cheap cavity), the cloth is never mirror-shiny
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFold;')
      .replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\ndiffuseColor.rgb *= 0.56 + 0.52 * vFold;');
  };
  m.customProgramCacheKey = () => 'her-cloth1';
  return m;
}

// ------------------------------------------------------------------------------------------------ the gate plaque
let PLQ = null, GATE_NAME = 'Blue Wall';
let PW = 1536, PH = 434;                       // (PH follows the first plaque's aspect)
const RTL = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
function plaqueFont(text, px) {
  if (RTL.test(text)) return `900 ${px}px Vazirmatn, 'Libre Baskerville', serif`;
  return `900 ${px}px Cinzel, 'Libre Baskerville', 'Noto Sans Tai Viet', Vazirmatn, Georgia, serif`;
}
// height field -> tangent-space normal map (rgb)
function normalsOf(hgt, w, h, k) {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, xl = hgt[i - (x > 0 ? 1 : 0)], xr = hgt[i + (x < w - 1 ? 1 : 0)], yu = hgt[i - (y > 0 ? w : 0)], yd = hgt[i + (y < h - 1 ? w : 0)];
    let nx = (xl - xr) * k, ny = (yd - yu) * k; const l = Math.hypot(nx, ny, 1); nx /= l; ny /= l;
    out[i * 4] = (nx * 0.5 + 0.5) * 255; out[i * 4 + 1] = (ny * 0.5 + 0.5) * 255; out[i * 4 + 2] = (1 / l * 0.5 + 0.5) * 255; out[i * 4 + 3] = 255;
  }
  return out;
}
function plaqueCanvases() {
  if (PLQ) return PLQ;
  const mk = () => { const c = document.createElement('canvas'); c.width = PW; c.height = PH; return c; };
  PLQ = { col: mk(), hgt: mk(), rm: mk(), em: mk(), nrm: mk() };
  const T = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  PLQ.t = { map: T(PLQ.col, true), normal: T(PLQ.nrm), rm: T(PLQ.rm), em: T(PLQ.em) };
  return PLQ;
}
const STY = {
  slate: { face: ['#2b3442', '#161c26', '#0b0f16'], grain: 'rgba(160,180,210,', metal: ['#fff6d6', '#f0c869', '#b3801f', '#6e4a10'], engr: false, glow: '#ffd38a', faceR: 0.82 },
  bronze: { face: ['#6a4a2a', '#4a321b', '#2a1b0e'], grain: 'rgba(255,210,150,', metal: ['#fff2cf', '#e9b860', '#a5741e', '#5a3c0c'], engr: false, glow: '#ffcf86', faceR: 0.55, faceM: 0.85 },
  marble: { face: ['#e9edf2', '#c9d0da', '#9aa3b0'], grain: 'rgba(90,100,120,', metal: ['#eaf6ff', '#7cc4ff', '#2a74c8', '#0c2c5c'], engr: true, glow: '#8fd3ff', faceR: 0.6 },
};
function paintPlaque() {
  const P = plaqueCanvases(), S = STY[PLAQUE_STYLE] || STY.slate, W = PW, H = PH;
  const c = P.col.getContext('2d'), hg = P.hgt.getContext('2d', { willReadFrequently: true }), rm = P.rm.getContext('2d'), em = P.em.getContext('2d');
  const r = rngOf(7);
  // --- the face: stone (or cast bronze) with grain and pitting
  const fg = c.createLinearGradient(0, 0, W * 0.2, H); fg.addColorStop(0, S.face[0]); fg.addColorStop(0.6, S.face[1]); fg.addColorStop(1, S.face[2]);
  c.fillStyle = fg; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) { c.fillStyle = S.grain + (0.02 + r() * 0.06) + ')'; c.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 2); }
  for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H, rad = 20 + r() * 90, a = 0.04 + r() * 0.05, g2 = c.createRadialGradient(x, y, 0, x, y, rad); g2.addColorStop(0, S.grain + a + ')'); g2.addColorStop(1, S.grain + '0)'); c.fillStyle = g2; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  hg.fillStyle = '#5a5a5a'; hg.fillRect(0, 0, W, H);                          // height: face at mid grey
  for (let i = 0; i < 2600; i++) { hg.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.05 + r() * 0.08})`; hg.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  rm.fillStyle = `rgb(0,${Math.round(S.faceR * 255)},${Math.round((S.faceM || 0) * 255)})`; rm.fillRect(0, 0, W, H);      // (g = roughness, b = metalness)
  em.fillStyle = '#000'; em.fillRect(0, 0, W, H);
  // --- the gilded frame: a raised moulding with corner bosses
  const metal = (ctx, x0, y0, x1, y1) => { const g2 = ctx.createLinearGradient(x0, y0, x1, y1); g2.addColorStop(0, S.metal[0]); g2.addColorStop(0.3, S.metal[1]); g2.addColorStop(0.62, S.metal[2]); g2.addColorStop(0.8, S.metal[1]); g2.addColorStop(1, S.metal[3]); return g2; };
  const frame = (ctx, kind) => {
    const o = 10, wd = 26;
    const rr = new Path2D(); rr.rect(o, o, W - 2 * o, H - 2 * o); rr.rect(o + wd, o + wd, W - 2 * (o + wd), H - 2 * (o + wd));
    if (kind === 'col') { ctx.fillStyle = metal(ctx, 0, 0, 0, H); ctx.fill(rr, 'evenodd'); ctx.strokeStyle = 'rgba(30,18,4,0.8)'; ctx.lineWidth = 2; ctx.stroke(rr); }
    else if (kind === 'hgt') { ctx.fillStyle = '#d8d8d8'; ctx.fill(rr, 'evenodd'); ctx.strokeStyle = '#9a9a9a'; ctx.lineWidth = 6; ctx.stroke(rr); }
    else if (kind === 'rm') { ctx.fillStyle = 'rgb(0,90,255)'; ctx.fill(rr, 'evenodd'); }
    // inner bead line
    const bead = new Path2D(); bead.rect(o + wd + 12, o + wd + 12, W - 2 * (o + wd + 12), H - 2 * (o + wd + 12));
    if (kind === 'col') { ctx.strokeStyle = S.metal[1]; ctx.lineWidth = 3; ctx.stroke(bead); }
    else if (kind === 'hgt') { ctx.strokeStyle = '#b0b0b0'; ctx.lineWidth = 4; ctx.stroke(bead); }
    else if (kind === 'rm') { ctx.strokeStyle = 'rgb(0,90,255)'; ctx.lineWidth = 3; ctx.stroke(bead); }
    for (const [bx, by] of [[o + wd / 2, o + wd / 2], [W - o - wd / 2, o + wd / 2], [o + wd / 2, H - o - wd / 2], [W - o - wd / 2, H - o - wd / 2], [W / 2, o + wd / 2], [W / 2, H - o - wd / 2]]) {
      if (kind === 'col') { const rg = ctx.createRadialGradient(bx - 5, by - 6, 1, bx, by, 17); rg.addColorStop(0, S.metal[0]); rg.addColorStop(0.5, S.metal[2]); rg.addColorStop(1, S.metal[3]); ctx.fillStyle = rg; }
      else ctx.fillStyle = kind === 'hgt' ? '#ffffff' : 'rgb(0,70,255)';
      ctx.beginPath(); ctx.arc(bx, by, 16, 0, Math.PI * 2); ctx.fill();
    }
  };
  frame(c, 'col'); frame(hg, 'hgt'); frame(rm, 'rm');
  // --- the crest of the realm at both ends, set into the stone
  const cs = H * 0.62, cy = H / 2 + 4;
  for (const cx of [86 + cs * 0.3, W - 86 - cs * 0.3]) {
    c.save(); c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 10; c.shadowOffsetY = 5; drawCrest(c, EMB, cx, cy, cs); c.restore();
    hg.fillStyle = '#c8c8c8'; hg.beginPath(); hg.ellipse(cx, cy, cs * 0.36, cs * 0.44, 0, 0, Math.PI * 2); hg.fill();
    rm.fillStyle = 'rgb(0,80,230)'; rm.beginPath(); rm.ellipse(cx, cy, cs * 0.36, cs * 0.44, 0, 0, Math.PI * 2); rm.fill();
  }
  // --- the name: raised gilded letters (marble: carved and inlaid), fitted to the space
  const text = String(GATE_NAME || '').trim(), x0 = 86 + cs * 0.7 + 24, x1 = W - x0, mid = (x0 + x1) / 2;
  const fill = (ctx, mode) => {
    if (!text) {                                                              // no name: an ornament (a long rule with a lozenge and two scrolls)
      ctx.save(); ctx.translate(mid, cy);
      const p = new Path2D(); p.moveTo(-320, 0); p.bezierCurveTo(-200, -34, -120, 34, -40, 0); p.moveTo(40, 0); p.bezierCurveTo(120, -34, 200, 34, 320, 0);
      ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.strokeStyle = mode; ctx.stroke(p);
      ctx.fillStyle = mode; ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(30, 0); ctx.lineTo(0, 38); ctx.lineTo(-30, 0); ctx.closePath(); ctx.fill();
      ctx.restore(); return;
    }
    const rtl = RTL.test(text); let px = Math.round(H * (rtl ? 0.5 : 0.52));
    const t2 = rtl ? text : text.toUpperCase();
    ctx.font = plaqueFont(text, px); if ('letterSpacing' in ctx) ctx.letterSpacing = rtl ? '0px' : Math.round(px * 0.08) + 'px';
    let tw = ctx.measureText(t2).width; const maxW = x1 - x0;
    if (tw > maxW) { px = Math.max(18, Math.floor(px * maxW / tw)); ctx.font = plaqueFont(text, px); if ('letterSpacing' in ctx) ctx.letterSpacing = rtl ? '0px' : Math.round(px * 0.08) + 'px'; tw = ctx.measureText(t2).width; }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = rtl ? 'rtl' : 'ltr';
    const sx = tw > maxW ? maxW / tw : 1;
    ctx.save(); ctx.translate(mid, cy + (rtl ? -px * 0.06 : px * 0.04)); ctx.scale(sx, 1);
    if (typeof mode === 'function') mode(ctx, t2, px); else { ctx.fillStyle = mode; ctx.fillText(t2, 0, 0); }
    ctx.restore();
  };
  if (S.engr) {
    // carved: a dark cut with a lit lower lip, then a blue inlay
    fill(c, (ctx, t2) => { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillText(t2, 1.5, 3); ctx.fillStyle = '#1a2230'; ctx.fillText(t2, 0, 0); });
    fill(c, (ctx, t2, px) => { const g2 = ctx.createLinearGradient(0, -px / 2, 0, px / 2); g2.addColorStop(0, S.metal[1]); g2.addColorStop(1, S.metal[3]); ctx.fillStyle = g2; ctx.globalAlpha = 0.9; ctx.fillText(t2, 0, 1.5); });
    fill(hg, (ctx, t2) => { ctx.fillStyle = '#202020'; ctx.fillText(t2, 0, 0); });
  } else {
    // raised: a soft cast shadow on the face, the gilded letter, a lit upper edge
    fill(c, (ctx, t2) => { ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 6; ctx.fillStyle = '#000'; ctx.fillText(t2, 0, 0); });
    fill(c, (ctx, t2, px) => { const g2 = ctx.createLinearGradient(0, -px * 0.5, 0, px * 0.5); g2.addColorStop(0, S.metal[0]); g2.addColorStop(0.35, S.metal[1]); g2.addColorStop(0.55, S.metal[2]); g2.addColorStop(0.7, S.metal[1]); g2.addColorStop(1, S.metal[3]); ctx.fillStyle = g2; ctx.fillText(t2, 0, 0); });
    fill(c, (ctx, t2, px) => { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillText(t2, -1, -Math.max(1.5, px * 0.025)); ctx.restore(); });
    for (const [b, col] of [[9, '#8a8a8a'], [5, '#c0c0c0'], [0, '#ffffff']]) fill(hg, (ctx, t2) => { ctx.shadowColor = col; ctx.shadowBlur = b; ctx.fillStyle = col; ctx.fillText(t2, 0, 0); });
    fill(rm, (ctx, t2) => { ctx.fillStyle = 'rgb(0,70,255)'; ctx.fillText(t2, 0, 0); });
  }
  fill(em, (ctx, t2) => { ctx.fillStyle = S.glow; ctx.fillText(t2, 0, 0); });
  if (!text) fill(em, S.glow);
  // --- normal map from the height field
  const hd = hg.getImageData(0, 0, W, H).data, hf = new Float32Array(W * H);
  for (let i = 0; i < hf.length; i++) hf[i] = hd[i * 4] / 255;
  const nc = P.nrm.getContext('2d'), img = nc.createImageData(W, H); img.data.set(normalsOf(hf, W, H, 3.2)); nc.putImageData(img, 0, 0);
  for (const k of ['map', 'normal', 'rm', 'em']) P.t[k].needsUpdate = true;
}
let plaqueFontsAsked = false;
function plaqueFonts() {                                                       // canvas text needs the web font loaded: repaint once it is
  if (plaqueFontsAsked || !document.fonts || !document.fonts.load) return; plaqueFontsAsked = true;
  Promise.all(['900 64px Cinzel', '700 64px "Libre Baskerville"', '900 64px Vazirmatn'].map((f) => document.fonts.load(f).catch(() => null)))
    .then(() => { if (PLQ) paintPlaque(); }).catch(() => {});
}
// The realm's name over the main gate ('' = an ornament only). Safe to call before or after the world is built.
export function setGateName(text) {
  const t = String(text == null ? '' : text).replace(/[\u0000-\u001f]/g, '').slice(0, 40);
  if (t === GATE_NAME && PLQ) return;
  GATE_NAME = t;
  if (PLQ) { paintPlaque(); plaqueFonts(); }
}
export const gateName = () => GATE_NAME;
function plaqueMaterial(aspect) {
  if (!PLQ && aspect > 1) PH = Math.round(PW / aspect);
  const P = plaqueCanvases();
  const S = STY[PLAQUE_STYLE] || STY.slate;
  const m = new THREE.MeshStandardMaterial({ map: P.t.map, normalMap: P.t.normal, normalScale: new THREE.Vector2(1.6, 1.6), roughnessMap: P.t.rm, metalnessMap: P.t.rm,
    roughness: 1, metalness: 1, emissive: new THREE.Color(S.glow).multiplyScalar(0.55), emissiveMap: P.t.em, emissiveIntensity: 0.4, envMapIntensity: 1.1 });
  m.name = 'her-plaque';
  paintPlaque(); plaqueFonts();
  return m;
}

// ------------------------------------------------------------------------------------------------ the system
const ZERO = new THREE.Vector3();
export class Heraldry {
  constructor(B, M) {
    this.B = B; this.M = M; this.items = []; this.plaques = []; this.hidden = false;
    const self = this;
    this.mesh = { get visible() { return U.uFlagOn.value > 0.5; }, set visible(v) { U.uFlagOn.value = v ? 1 : 0; void self; } };   // levels.js: no flags below wall level 4
  }
  // a flag flying from the top of a pole (x, y, z = the top of the hoist); s = scale (1 = 3.4 x 2.0 m)
  add(x, y, z, ry, s = 1, tid = 0) {
    const L = 3.4 * s, H = 2.04 * s;
    this.items.push({ kind: 0, cell: 'flag', x, y, z, ry, L, H, amp: 0.5 * s, tid, nu: s > 1.5 ? 16 : 12, nv: s > 1.5 ? 4 : 3 });
    // a gilded finial on the pole top (batched with the castle's gold)
    if (this.B && this.M && this.M.gold) {
      const k = Math.max(0.6, s);
      this.B.add(new THREE.OctahedronGeometry(0.17 * k, 0), this.M.gold, mat4(x, y + 0.32 * k, z, ry, 1, 1.9, 1), { bid: tid });
      this.B.add(new THREE.IcosahedronGeometry(0.13 * k, 0), this.M.gold, mat4(x, y + 0.04 * k, z), { bid: tid });
      // the halyard: a thin rope from the truck down past the hoist, on the side the flag flies
      const hy = FLAG_YAW === 'wind' ? WIND_YAW : ry, ox = Math.cos(hy) * 0.07 * k, oz = -Math.sin(hy) * 0.07 * k, top = y + 0.02 * k, bot = y - H - 1.1 * s;
      this.B.add(new THREE.BoxGeometry(0.03, top - bot, 0.03), this.M.wood, mat4(x + ox, (top + bot) / 2, z + oz, hy), { tint: 0x2a2018, bid: tid });
    }
  }
  // a banner hanging from a rod (x, y, z = its centre, ry = the way it faces); o.tapestry: it hangs against a wall
  banner(x, y, z, ry, w, h, tid = 0, o = {}) {
    const hh = h * 1.12, top = y + h / 2, asp = hh / w, cell = asp > 1.45 ? 'tall' : 'square';
    const nx = Math.sin(ry), nz = Math.cos(ry), off = o.tapestry ? 0.05 : 0.12;
    this.items.push({ kind: o.tapestry ? 2 : 1, cell, x: x + nx * off, y: top, z: z + nz * off, ry, L: hh, H: w, amp: (o.tapestry ? 0.11 : 0.18) * Math.min(w, 3.5), tid, nu: Math.max(5, Math.round(hh * 1.1)), nv: 8 });   // (8 across: 3+ vertices a pleat)
    if (this.B && this.M) {
      // the rod (dark wood) with gilded knobs; on a wall, two iron brackets hold it
      const B = this.B, M = this.M, rx = Math.cos(ry), rz = -Math.sin(ry), rl = w + 0.5;
      B.add(new THREE.CylinderGeometry(0.075, 0.075, rl, 6, 1, true), M.wood, mat4(x + nx * (off + 0.02), top + 0.05, z + nz * (off + 0.02), ry, 1, 1, 1, 0, Math.PI / 2), { tint: 0x4a3020, bid: tid });
      for (const e of [-1, 1]) {
        B.add(new THREE.OctahedronGeometry(o.tapestry ? 0.11 : 0.14, 0), M.gold, mat4(x + nx * (off + 0.02) + rx * e * rl / 2, top + 0.05, z + nz * (off + 0.02) + rz * e * rl / 2, ry), { bid: tid });
        if (M.metal && !o.tapestry) B.add(new THREE.BoxGeometry(0.07, 0.07, off + 0.12), M.metal, mat4(x + nx * (off / 2) + rx * e * (w / 2 - 0.1), top + 0.05, z + nz * (off / 2) + rz * e * (w / 2 - 0.1), ry), { bid: tid });
      }
    }
  }
  // the name plaque over a gate (x, y, z = the centre of its face, face = the way it looks); returns its material (world.js dims it by day)
  plaque(x, y, z, face, w, h, tid = 0) {
    if (!this.plaqueMat) this.plaqueMat = plaqueMaterial(w / h);
    const nx = Math.sin(face), nz = Math.cos(face);
    this.plaques.push({ x: x + nx * 0.1, y, z: z + nz * 0.1, face, w, h, tid });
    if (this.B && this.M) {
      // the stone it is set into: a moulded surround, a cornice above and a corbel under each end
      const B = this.B, M = this.M, rx = Math.cos(face), rz = -Math.sin(face);
      B.add(new THREE.BoxGeometry(w + 0.7, h + 0.7, 0.34), M.stoneDark, mat4(x - nx * 0.12, y, z - nz * 0.12, face), { tint: 0x8f8a82, bid: tid });
      B.add(new THREE.BoxGeometry(w + 1.3, 0.32, 0.62), M.stoneDark, mat4(x + nx * 0.05, y + h / 2 + 0.5, z + nz * 0.05, face), { tint: 0xa29c92, bid: tid });
      for (const e of [-1, 1]) B.add(new THREE.BoxGeometry(0.5, 0.55, 0.5), M.stoneDark, mat4(x + rx * e * (w / 2 + 0.05) + nx * 0.02, y - h / 2 - 0.42, z + rz * e * (w / 2 + 0.05) + nz * 0.02, face), { tint: 0x9a948a, bid: tid });
    }
    return this.plaqueMat;
  }
  build(scene) {
    this.scene = scene;
    // ---- the cloth: one merged geometry
    let nVert = 0, nIdx = 0;
    for (const it of this.items) { nVert += (it.nu + 1) * (it.nv + 1); nIdx += it.nu * it.nv * 6; }
    if (nVert) {
      const pos = new Float32Array(nVert * 3), nrm = new Float32Array(nVert * 3), uv = new Float32Array(nVert * 2), cl = new Float32Array(nVert * 4), pin = new Float32Array(nVert * 4), dim = new Float32Array(nVert * 3), ab = new Float32Array(nVert);
      const idx = nVert > 65535 ? new Uint32Array(nIdx) : new Uint16Array(nIdx);
      let v = 0, q = 0;
      for (const it of this.items) {
        const ph = ((it.x * 12.9898 + it.z * 78.233) % 6.2832 + 6.2832) % 6.2832, base = v;
        const flag = it.kind === 0, ry = it.ry;
        const S = flag ? [Math.cos(ry), 0, -Math.sin(ry)] : [0, -1, 0], T = flag ? [0, -1, 0] : [Math.cos(ry), 0, -Math.sin(ry)], N = [Math.sin(ry), 0, Math.cos(ry)];
        for (let j = 0; j <= it.nv; j++) for (let i = 0; i <= it.nu; i++) {
          const s = i / it.nu, t = j / it.nv, ts = flag ? t : t - 0.5;
          pos[v * 3] = it.x + S[0] * s * it.L + T[0] * ts * it.H; pos[v * 3 + 1] = it.y + S[1] * s * it.L + T[1] * ts * it.H; pos[v * 3 + 2] = it.z + S[2] * s * it.L + T[2] * ts * it.H;
          nrm[v * 3] = N[0]; nrm[v * 3 + 1] = N[1]; nrm[v * 3 + 2] = N[2];
          const [u, vv] = flag ? cellUV(it.cell, s, t) : cellUV(it.cell, t, s);
          uv[v * 2] = u; uv[v * 2 + 1] = vv;
          cl[v * 4] = s; cl[v * 4 + 1] = t; cl[v * 4 + 2] = ph; cl[v * 4 + 3] = it.kind;
          pin[v * 4] = it.x; pin[v * 4 + 1] = it.y; pin[v * 4 + 2] = it.z; pin[v * 4 + 3] = ry;
          dim[v * 3] = it.L; dim[v * 3 + 1] = it.H; dim[v * 3 + 2] = it.amp; ab[v] = it.tid || 0;
          v++;
        }
        for (let j = 0; j < it.nv; j++) for (let i = 0; i < it.nu; i++) {
          const a = base + j * (it.nu + 1) + i, b = a + 1, c = a + it.nu + 1, d = c + 1;
          if (flag) { idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }      // (front faces look along +N: the lit side)
          else { idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c; }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setAttribute('aCl', new THREE.BufferAttribute(cl, 4)); g.setAttribute('aPin', new THREE.BufferAttribute(pin, 4)); g.setAttribute('aDim', new THREE.BufferAttribute(dim, 3)); g.setAttribute('aB', new THREE.BufferAttribute(ab, 1));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.computeBoundingSphere(); g.boundingSphere.radius += 6;                  // (the waves reach a little beyond the rest shape)
      this.mat = patchDestruct(clothMaterial(atlasTexture()));
      this.cloth = new THREE.Mesh(g, this.mat); this.cloth.name = 'her-cloth';
      this.cloth.castShadow = false; this.cloth.receiveShadow = true; this.cloth.matrixAutoUpdate = false; this.cloth.updateMatrix();
      scene.add(this.cloth);
    }
    // ---- the plaques (one mesh: usually one plaque)
    if (this.plaques.length) {
      const gs = this.plaques.map((p) => { const g = new THREE.PlaneGeometry(p.w, p.h); g.applyMatrix4(mat4(p.x, p.y, p.z, p.face)); const a = new Float32Array(g.attributes.position.count).fill(p.tid || 0); g.setAttribute('aB', new THREE.BufferAttribute(a, 1)); return g; });
      const g = gs.length === 1 ? gs[0] : mergeSimple(gs);
      this.plaqueMesh = new THREE.Mesh(g, patchDestruct(this.plaqueMat)); this.plaqueMesh.name = 'her-plaque';
      this.plaqueMesh.receiveShadow = true; this.plaqueMesh.matrixAutoUpdate = false; this.plaqueMesh.updateMatrix();
      scene.add(this.plaqueMesh);
    }
    void ZERO;
  }
  update(t) { U.uTime.value = t; U.uWind.value = (WIND.value || 0.3) + (WIND.gust ? WIND.gust.value * 0.6 : 0); }
  // battle: a structure that falls takes its cloth with it (destruct.js does it in the shader); nothing to do here
  hide() {}
  reset() {}
  get count() { return this.items.length; }
}
function mergeSimple(gs) {
  let n = 0, m = 0; for (const g of gs) { n += g.attributes.position.count; m += g.index ? g.index.count : g.attributes.position.count; }
  const out = new THREE.BufferGeometry(), names = Object.keys(gs[0].attributes), idx = new Uint32Array(m); let vo = 0, io = 0;
  for (const k of names) { const s = gs[0].attributes[k].itemSize; out.setAttribute(k, new THREE.BufferAttribute(new Float32Array(n * s), s)); }
  for (const g of gs) {
    for (const k of names) out.attributes[k].array.set(g.attributes[k].array, vo * g.attributes[k].itemSize);
    const ix = g.index ? g.index.array : [...Array(g.attributes.position.count).keys()]; for (const i of ix) idx[io++] = i + vo;
    vo += g.attributes.position.count;
  }
  out.setIndex(new THREE.BufferAttribute(idx, 1)); return out;
}
// (dev sheets: the painted atlas and the plaque canvases)
export function heraldryDebug() { atlasTexture(); if (!PLQ) plaqueMaterial(9.2 / 2.6); return { atlas: ATLAS.c, plaque: PLQ, repaint: () => { paintAtlas(); paintPlaque(); } }; }
