// The kingdom's shields: painted wooden shields with a steel rim and rivets, the realm's crest painted on the face.
//   crestTexture(side)          shared canvas texture of one realm's painted shield face ('own' = the player, 'foe' = the defender in a battle)
//   setShieldCrest(id, side)    repaint it (call when the crest changes; every shield in the game updates, no rebuild)
//   shieldModel(gltf, shape, s) { scene } — a prop for crowd.js ('heater' | 'round'), held on the left forearm at prop scale s (see R_FIX)
// The face is drawn by emblems.drawCrest (the same crest that flies on the walls) over navy-painted planks; the steel parts carry the
// gear classes of crowd.js (aGear: metalness, roughness, class 2 = trim -> the tier metal of unitlook.js: iron, steel, gold, silver, crystal).
// One 512 px texture per realm, all shields of every kind share it: no draw calls, no per-frame work.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { drawCrest, normEmblem } from './emblems.js';

const S = 512;                         // canvas size
const C = 0.56 * S;                    // drawCrest size (its 100-unit box) on the canvas
const CY = 52.5;                       // vertical centre of the crest's shield shape (crest units 8..97)
const FR_HEATER = 0.68, FR_ROUND = 0.56; // the crest's share of the face: heater (height), round (diameter) — the painted boards frame it
const HAS_DOM = typeof document !== 'undefined';

// ------------------------------------------------------------------ the painted face
const REALM = {};
const listeners = [];
export function onShieldCrest(fn) { listeners.push(fn); }
export function shieldCrestId(side = 'own') { return (REALM[side] && REALM[side].id) || 'swords'; }

function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function paintFace(g, id) {
  const r = rng(9137);
  // planks: kingdom navy paint over seven vertical boards, each a slightly different tone
  g.fillStyle = '#122650'; g.fillRect(0, 0, S, S);
  const PW = S / 7;
  for (let i = 0; i < 7; i++) {
    const k = 0.9 + r() * 0.2, gr = g.createLinearGradient(0, 0, 0, S);
    gr.addColorStop(0, `rgb(${24 * k | 0},${50 * k | 0},${104 * k | 0})`); gr.addColorStop(0.55, `rgb(${19 * k | 0},${40 * k | 0},${86 * k | 0})`); gr.addColorStop(1, `rgb(${14 * k | 0},${30 * k | 0},${66 * k | 0})`);
    g.fillStyle = gr; g.fillRect(i * PW, 0, PW, S);
    // grain: long faint wavy streaks along the board
    for (let j = 0; j < 26; j++) {
      const x0 = i * PW + r() * PW, a = r() < 0.5 ? 'rgba(255,255,255,' : 'rgba(0,4,16,';
      g.strokeStyle = a + (0.025 + r() * 0.05).toFixed(3) + ')'; g.lineWidth = 0.6 + r() * 1.4; g.beginPath(); g.moveTo(x0, 0);
      for (let y = 0; y <= S; y += 32) g.lineTo(x0 + Math.sin(y * 0.013 + j) * 2.2 + (r() - 0.5) * 1.2, y);
      g.stroke();
    }
    // the seam between two boards
    g.fillStyle = 'rgba(2,6,18,0.55)'; g.fillRect(i * PW - 1, 0, 2.2, S); g.fillStyle = 'rgba(160,190,235,0.07)'; g.fillRect(i * PW + 1.2, 0, 1.2, S);
  }
  // the crest, painted on the boards
  g.save(); g.globalAlpha = 0.97; drawCrest(g, id, S / 2, S / 2 - ((CY - 50) * C) / 100, C); g.restore();
  // wear over everything: chipped paint (bare wood shows), scratches, a little grime
  for (let i = 0; i < 70; i++) {
    const x = r() * S, y = r() * S, w = 2 + r() * 7, h = 1 + r() * 3.5;
    g.fillStyle = r() < 0.6 ? `rgba(118,84,52,${(0.25 + r() * 0.35).toFixed(2)})` : `rgba(0,0,0,${(0.1 + r() * 0.15).toFixed(2)})`;
    g.beginPath(); g.ellipse(x, y, w, h, r() * Math.PI, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 46; i++) {
    const x = r() * S, y = r() * S, a = r() * Math.PI, l = 8 + r() * 40;
    g.strokeStyle = `rgba(214,226,242,${(0.06 + r() * 0.12).toFixed(2)})`; g.lineWidth = 0.6 + r() * 0.8;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${(r() * 0.07).toFixed(3)})`; g.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2); }
}
function realm(side) {
  if (REALM[side]) return REALM[side];
  let c = null, g = null;
  if (HAS_DOM) { c = document.createElement('canvas'); c.width = c.height = S; g = c.getContext('2d'); }
  const tex = c ? new THREE.CanvasTexture(c) : new THREE.DataTexture(new Uint8Array([24, 44, 96, 255]), 1, 1);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const R = REALM[side] = { c, g, tex, id: null };
  setShieldCrest(side === 'foe' ? 'swords' : 'swords', side);
  return R;
}
export function crestTexture(side = 'own') { return realm(side === 'foe' ? 'foe' : 'own').tex; }
export function setShieldCrest(id, side = 'own') {
  side = side === 'foe' ? 'foe' : 'own';
  const R = REALM[side] || realm(side); id = normEmblem(id);
  if (R.id === id) return; R.id = id;
  if (R.g) { paintFace(R.g, id); R.tex.needsUpdate = true; }
  for (const f of listeners) { try { f(id, side); } catch (e) { /* ignore */ } }
}

// ------------------------------------------------------------------ geometry
// every vertex: position, normal, color, uv (crest canvas), aGear (metalness, roughness, class: 0 plain / 1 steel / 2 trim, crest mask)
const K = 2.0 / 74;                                       // model units per crest unit (the shield is 2 units wide, like the original)
const Y0 = 0.02;
const toXY = (u, v) => [(u - 50) * K, (CY - v) * K + Y0];
function bez(p0, p1, p2, p3, t) { const s = 1 - t; return [s * s * s * p0[0] + 3 * s * s * t * p1[0] + 3 * s * t * t * p2[0] + t * t * t * p3[0], s * s * s * p0[1] + 3 * s * s * t * p1[1] + 3 * s * t * t * p2[1] + t * t * t * p3[1]]; }
function heaterOutline() {                                 // the crest's own shield path (emblems.js SHIELD), clockwise from the top-left corner
  const P = [], line = (a, b, n) => { for (let i = 0; i < n; i++) P.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]); };
  const curve = (a, b, c, d, n) => { for (let i = 0; i < n; i++) P.push(bez(a, b, c, d, i / n)); };
  line([13, 8], [87, 8], 6); line([87, 8], [87, 50], 5); curve([87, 50], [87, 74], [68, 90], [50, 97], 9); curve([50, 97], [32, 90], [13, 74], [13, 50], 9); line([13, 50], [13, 8], 5);
  return P.map(([u, v]) => toXY(u, v));
}
const roundOutline = (n = 36) => [...Array(n).keys()].map((i) => { const a = Math.PI / 2 - (i / n) * Math.PI * 2; return [Math.cos(a), Math.sin(a)]; });

function geo(pos, nor, col, uv, gear, idx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (nor) g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aGear', new THREE.Float32BufferAttribute(gear, 4));
  if (idx) g.setIndex(idx);
  if (!nor) g.computeVertexNormals();
  return g;
}
const lin = (hex) => new THREE.Color(hex);       // (Color.set: sRGB -> linear working space)

function buildShield(outline, { zFace, zBack, rim, crestUV, rivets }) {
  const N = outline.length, parts = [];
  // outward normals (miter) of the outline
  const nrm = outline.map((p, i) => {
    const a = outline[(i + N - 1) % N], b = outline[(i + 1) % N];
    const e1 = [p[0] - a[0], p[1] - a[1]], e2 = [b[0] - p[0], b[1] - p[1]], l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
    const n1 = [-e1[1] / l1, e1[0] / l1], n2 = [-e2[1] / l2, e2[0] / l2];       // clockwise outline: (-dy, dx) points outward
    let m = [n1[0] + n2[0], n1[1] + n2[1]]; const ml = Math.hypot(...m) || 1; m = [m[0] / ml, m[1] / ml];
    const k = 1 / Math.max(0.45, m[0] * n2[0] + m[1] * n2[1]); return [m[0] * k, m[1] * k];
  });
  const off = (i, d) => [outline[i][0] + nrm[i][0] * d, outline[i][1] + nrm[i][1] * d];
  let cx = 0, cy = 0; for (const p of outline) { cx += p[0]; cy += p[1]; } cx /= N; cy /= N;
  // ---- face: rings from the centre to the inner edge of the rim; darker (grime / occlusion) toward the rim
  {
    const RINGS = [0, 0.4, 0.75, 1], pos = [], col = [], uv = [], gear = [], idx = [];
    for (const t of RINGS) {
      const n = t === 0 ? 1 : N;
      for (let i = 0; i < n; i++) {
        const e = off(i, -rim * 0.92), x = cx + (e[0] - cx) * t, y = cy + (e[1] - cy) * t, z = zFace(x, y);
        pos.push(x, y, z); const sh = 1 - 0.2 * t * t; col.push(sh, sh, sh); uv.push(...crestUV(x, y)); gear.push(0, 0.6, 0, 1);
      }
    }
    for (let i = 0; i < N; i++) idx.push(0, 1 + ((i + 1) % N), 1 + i);
    for (let r = 1; r < RINGS.length - 1; r++) { const a0 = 1 + (r - 1) * N, b0 = 1 + r * N; for (let i = 0; i < N; i++) { const j = (i + 1) % N; idx.push(a0 + i, b0 + j, b0 + i, a0 + i, a0 + j, b0 + j); } }
    parts.push(geo(pos, null, col, uv, gear, idx));
  }
  // ---- rim: a rolled steel band over the edge, from under the face round to the back
  {
    const prof = [[-rim * 1.0, -0.006], [-rim * 0.8, 0.032], [-rim * 0.15, 0.042], [0.012, 0.004], [0.012, null]];   // [offset along the outward normal, height over the face] (null = the back)
    const pos = [], col = [], uv = [], gear = [], idx = [];
    for (const [d, h] of prof) for (let i = 0; i < N; i++) { const e = off(i, d), z = h === null ? zBack - 0.012 : zFace(e[0], e[1]) + h; pos.push(e[0], e[1], z); col.push(1, 1, 1); uv.push(0, 0); gear.push(0.9, 0.42, 2, 0); }
    for (let r = 0; r < prof.length - 1; r++) for (let i = 0; i < N; i++) { const j = (i + 1) % N, a = r * N, b = (r + 1) * N; idx.push(a + i, a + j, b + j, a + i, b + j, b + i); }
    parts.push(geo(pos, null, col, uv, gear, idx));
  }
  // ---- back: bare dark wood
  {
    const pos = [cx, cy, zBack], col = [], uv = [0, 0], gear = [0, 0.85, 0, 0], idx = [], wc = lin(0x4a3322);
    col.push(wc.r, wc.g, wc.b);
    for (let i = 0; i < N; i++) { const e = off(i, 0.004); pos.push(e[0], e[1], zBack); col.push(wc.r * 0.8, wc.g * 0.8, wc.b * 0.8); uv.push(0, 0); gear.push(0, 0.85, 0, 0); }
    for (let i = 0; i < N; i++) idx.push(0, 1 + i, 1 + ((i + 1) % N));
    parts.push(geo(pos, null, col, uv, gear, idx));
  }
  // ---- rivets: small domes along the rim
  {
    const pos = [], col = [], uv = [], gear = [], R = 0.034, H = 0.022, SEG = 6;
    let len = 0; const L = [0]; for (let i = 0; i < N; i++) { const a = outline[i], b = outline[(i + 1) % N]; len += Math.hypot(b[0] - a[0], b[1] - a[1]); L.push(len); }
    for (let k = 0; k < rivets; k++) {
      const s = ((k + 0.5) / rivets) * len; let i = 0; while (L[i + 1] < s) i++;
      const t = (s - L[i]) / (L[i + 1] - L[i] || 1), j = (i + 1) % N, a = off(i, -rim * 0.5), b = off(j, -rim * 0.5), x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, z = zFace(x, y) + 0.036;
      for (let q = 0; q < SEG; q++) {
        const a0 = (q / SEG) * Math.PI * 2, a1 = ((q + 1) / SEG) * Math.PI * 2;
        pos.push(x, y, z + H, x + Math.cos(a0) * R, y + Math.sin(a0) * R, z, x + Math.cos(a1) * R, y + Math.sin(a1) * R, z);
        for (let v = 0; v < 3; v++) { col.push(1.15, 1.15, 1.15); uv.push(0, 0); gear.push(0.9, 0.36, 2, 0); }
      }
    }
    parts.push(geo(pos, null, col, uv, gear, null));
  }
  const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)), false);
  return merged;
}
// ------------------------------------------------------------------ how it is held
// The props hang on the soldier's left hand bone with rot [0, 90°, 0] (army.js / bunits.js). Measured on the UAL rig (Idle_Shield_Loop,
// Walk_Loop, Sword_Idle): in that frame the forearm runs along -y, the model's +z faces the soldier's back and +y points sideways — the
// old prop showed its back (straps) to the enemy, sideways. So the shield is built upright, face +z (shield space), and turned by
// R_FIX (180° about (1, -1, 0)): shield x -> model -y, y -> -x, z -> -z: face forward, top up, the forearm across its back, through
// two leather loops (enarmes). Rig units (prop scale s): the hand at (0.05, -0.05, 0), the forearm along (0.97, 0.22, -0.05), 0.265 long.
const R_FIX = new THREE.Matrix4().set(0, -1, 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1);
const ARM = { hand: [0.05, -0.05, 0], dir: [0.97, 0.22, -0.05], len: 0.265, r: 0.034 };
function leather(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo, n = g.attributes.position.count, lc = lin(0x3a2617), col = [], uv = [], gear = [];
  for (let i = 0; i < n; i++) { const k = 0.85 + 0.15 * ((i * 7) % 5) / 4; col.push(lc.r * k, lc.g * k, lc.b * k); uv.push(0, 0); gear.push(0, 0.74, 0, 0); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aGear', new THREE.Float32BufferAttribute(gear, 4));
  return g;
}
// two loops around the forearm (shield space, model units = rig units / s); zBack: the board's back plane
function enarmes(s, zBack) {
  const parts = [], A = ARM, ax = (t) => [A.hand[0] + A.dir[0] * A.len * t, A.hand[1] + A.dir[1] * A.len * t, A.hand[2] + A.dir[2] * A.len * t];
  for (const t of [0.22, 0.78]) {
    const [cx, cy, cz] = ax(t).map((v) => v / s), R = (A.r + 0.008) / s, W = 0.022 / s, T = 0.008 / s, zb = zBack, z0 = cz - R;
    const box = (x, y, z, sx, sy, sz) => { const b = new THREE.BoxGeometry(sx, sy, sz); b.translate(x, y, z); parts.push(leather(b)); };
    box(cx, cy + R, (zb + z0) / 2, W, T, Math.abs(zb - z0));          // upper leg, board -> behind the arm
    box(cx, cy - R, (zb + z0) / 2, W, T, Math.abs(zb - z0));          // lower leg
    box(cx, cy, z0, W, 2 * R + T, T);                                  // across, behind the arm
  }
  return mergeGeometries(parts, false);
}

// canvas pixel -> texture uv (CanvasTexture: flipY)
const tuv = (X, Y) => [X / S, 1 - Y / S];
const MODELS = new Map();
export function shieldModel(gltf, shape = 'heater', s = shape === 'round' ? 0.22 : 0.27) {
  const key = shape + ':' + s;
  if (MODELS.has(key)) return MODELS.get(key);
  // where the board sits: centred on the middle of the forearm (a little below it), its back just clear of the arm
  const mid = [ARM.hand[0] + ARM.dir[0] * ARM.len * 0.5, ARM.hand[1] + ARM.dir[1] * ARM.len * 0.5, ARM.hand[2] + ARM.dir[2] * ARM.len * 0.5];
  let g, zBack;
  if (shape === 'round') {
    const RO = 1.0, rim = 0.12, Z = (C / 100) * (89 / FR_ROUND) / 2 / (RO - rim);     // px per model unit on the face
    zBack = 0.0;
    g = buildShield(roundOutline(36), { zFace: (x, y) => 0.17 - 0.07 * (x * x + y * y), zBack, rim, rivets: 12,
      crestUV: (x, y) => tuv(S / 2 + x * Z, S / 2 - y * Z) });
  } else {
    const Z = C / 100 / FR_HEATER;                                                     // px per crest unit on the face
    zBack = 0.02;
    g = buildShield(heaterOutline(), { zFace: (x) => 0.17 - 0.08 * x * x, zBack, rim: 0.085, rivets: 14,
      crestUV: (x, y) => { const u = 50 + x / K, v = CY - (y - Y0) / K; return tuv(S / 2 + (u - 50) * Z, S / 2 + (v - CY) * Z); } });
  }
  const T = new THREE.Vector3(mid[0] / s, (mid[1] - (shape === 'round' ? 0.0 : 0.035)) / s, (mid[2] + ARM.r + 0.012) / s - zBack);
  g.translate(T.x, T.y, T.z);                                                          // (the board moves to the arm; the loops are built where the arm is)
  g = mergeGeometries([g, enarmes(s, zBack + T.z)], false);
  g.applyMatrix4(R_FIX);
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, name: 'bwgear' }));
  const scene = new THREE.Group(); scene.add(mesh);
  const out = { scene, shield: shape };
  MODELS.set(key, out); return out;
}
