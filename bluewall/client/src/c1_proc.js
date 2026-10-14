// c1_proc.js — the procedural parts of package C1 (no kit has them): fishing nets between the poles, river sluice boxes (tilted, with riffles), gravel heaps, the smokehouse's kiln + brick
// stack, open drying sheds with hanging fish, fish baskets.  Same contract as wsbuild.js PROC: fn(M, lv, R, site) draws into M.S (the vertex-coloured soup, ONE shared material: +0 shader
// programs, +1 draw call per site).  Everything is in the site's local frame (x right, z toward the water, y above the pad), numbers from c1_kinds.js.
import * as THREE from 'three';
import { sluiceXs, SLUICE, SMOKE_STACK, SMOKE_STACK2, SHEDS, shedsAt, BASKETS, RACKS, RACK_KIT, counts } from './c1_kinds.js';

const col = (h) => new THREE.Color(h);
const C = {
  rope: col('#c9b78a'), rope2: col('#a99468'), wood: col('#7a5a3a'), wood2: col('#6b4e32'), wood3: col('#8a6a46'), dark: col('#2e2823'), riffle: col('#4a3826'),
  gravel: col('#8d8678'), gravel2: col('#766f63'), wet: col('#6c675d'), water: col('#6aa6cf'), gold: col('#e3b93c'), stone: col('#9aa1ab'), stone2: col('#6f7580'), brick: col('#8c4a38'), brick2: col('#6e3a2d'),
  soot: col('#26211e'), wicker: col('#a97c47'), wicker2: col('#8c6636'), silver: col('#aab9c9'), silver2: col('#8197ad'), smoked: col('#b8782f'), smoked2: col('#8f5a24'), roof: col('#5f4630'),
};
const shade = (k, f) => new THREE.Color(k.r * f, k.g * f, k.b * f);

// a box with a pitch (tilt about the local x axis, + = the +z end goes DOWN) and a yaw; centre (cx, cy, cz) with cy ABOVE THE PAD.  6 quads.
function tbox(M, T, cx, cy, cz, sx, sy, sz, pitch, yaw, k) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cy_ = Math.cos(yaw), sy_ = Math.sin(yaw);
  const V = [];
  for (const [a, b, c] of [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]]) {
    let x = a * sx / 2, y = b * sy / 2, z = c * sz / 2;
    const y1 = y * cp + z * sp, z1 = -y * sp + z * cp; y = y1; z = z1;                       // pitch: z -> down for + pitch
    const x2 = x * cy_ + z * sy_, z2 = -x * sy_ + z * cy_;
    V.push(M.P3(cx + x2, M.F.y0 + cy + y, cz + z2));
  }
  const q = (i, j, l, m, f) => T.quad(V[i], V[j], V[l], V[m], shade(k, f));
  q(0, 1, 2, 3, 0.7); q(4, 7, 6, 5, 1.12); q(0, 4, 5, 1, 0.86); q(1, 5, 6, 2, 0.94); q(2, 6, 7, 3, 0.86); q(3, 7, 4, 0, 0.94);
}
const jit = (R, k, a = 0.1) => shade(k, 1 - a + R() * 2 * a);

// ------------------------------------------------------------------------------------------------------------------ nets
// a fishing net hung between two poles (x0 .. x1 at depth z, top rope at height h0, sagging by `sag`): thin strands as quads (cols hanging, rows across).  Reads as netting from a medium distance.
function net(M, R, x0, x1, z, h0, drop, sag, cols = 16, rows = 5) {
  const T = M.S, w = 0.07, k = C.rope;
  const yAt = (u) => h0 - sag * Math.sin(u * Math.PI);                                       // the top rope sags between the poles
  const P = (u, v) => M.P3(x0 + (x1 - x0) * u, M.F.y0 + yAt(u) - drop * v, z + 0.1 * Math.sin(u * Math.PI) * (1 - v * 0.5));
  for (let i = 0; i <= cols; i++) { const u = i / cols; T.quad(P(u - 0.004, 0), P(u + 0.004, 0), P(u + 0.004, 1), P(u - 0.004, 1), jit(R, k, 0.12)); }
  for (let j = 1; j <= rows; j++) { const v = j / rows; for (let i = 0; i < cols; i++) { const u0 = i / cols, u1 = (i + 1) / cols; const a = P(u0, v), b = P(u1, v), c = P(u1, v + w / drop), d = P(u0, v + w / drop); T.quad(a, b, c, d, C.rope2); } }
  for (let i = 0; i < cols; i++) { const u0 = i / cols, u1 = (i + 1) / cols; T.quad(P(u0, -0.02), P(u1, -0.02), P(u1, 0.03), P(u0, 0.03), C.wood2); }   // the head rope
}

// ------------------------------------------------------------------------------------------------------------------ the sluice box
// head (hopper, high) at z0, tail (low) at z1, centred on x.  Floor + two side boards + riffle bars + a few specks of gold, A-frame legs, the gravel heap and the tailings.
function sluice(M, R, x, lv, i) {
  const T = M.S, { z0, z1, hi, lo } = SLUICE, len = z1 - z0, zc = (z0 + z1) / 2, yc = (hi + lo) / 2, pitch = Math.atan2(hi - lo, len);
  const L = len / Math.cos(pitch);
  tbox(M, T, x, yc, zc, 1.15, 0.14, L, pitch, 0, C.wood3);                                  // the floor
  for (const sd of [-1, 1]) tbox(M, T, x + sd * 0.62, yc + 0.25, zc, 0.12, 0.46, L, pitch, 0, C.wood);                  // side boards
  tbox(M, T, x, yc + 0.088, zc, 0.84, 0.03, L * 0.985, pitch, 0, C.water);                     // the sheet of water running over the floor
  const nB = 9;
  for (let b = 0; b < nB; b++) {                                                            // riffle bars: the gold settles behind them
    const t = (b + 0.7) / (nB + 0.4), z = z0 + len * t, y = hi - (hi - lo) * t + 0.13;
    tbox(M, T, x, y, z, 1.0, 0.12, 0.12, pitch, 0, C.riffle);
    if (R() < 0.7) M.box(T, x + (R() - 0.5) * 0.6, z - 0.2, y + 0.02, 0.1, 0.05, 0.1, R() * 3, C.gold);        // a glint of gold
  }
  // the hopper (a bin at the head where the gravel is shovelled in) + its legs
  tbox(M, T, x, hi + 0.5, z0 - 0.9, 1.7, 0.1, 1.5, 0.12, 0, C.wood3);
  for (const sd of [-1, 1]) { tbox(M, T, x + sd * 0.8, hi + 0.8, z0 - 0.9, 0.1, 0.62, 1.5, 0.12, 0, C.wood2); }
  tbox(M, T, x, hi + 0.78, z0 - 1.65, 1.7, 0.62, 0.1, 0, 0, C.wood2);
  const leg = (z, h) => { for (const sd of [-1, 1]) { M.box(T, x + sd * 0.7, z, 0, 0.14, h, 0.14, 0, C.wood2); } M.box(T, x, z, h * 0.55, 1.4, 0.1, 0.1, 0, C.wood); };
  leg(z0 + 0.4, hi - 0.06); leg(z0 + len * 0.55, (hi + lo) / 2 - 0.0); leg(z1 - 0.35, lo - 0.06);
  // gravel to be washed (left of the head) and the wet tailings under the outlet
  M.cyl(T, x - 2.0, z0 - 0.2, 0, 1.5, 0.75, 10, jit(R, C.gravel, 0.08), 0.7); M.cyl(T, x - 2.8, z0 + 1.0, 0, 0.8, 0.4, 8, C.gravel2, 0.4); M.cyl(T, x - 1.3, z0 + 1.3, 0, 0.55, 0.3, 7, C.gravel, 0.3);
  M.cyl(T, x + 0.05, z1 + 0.9, 0, 0.95, 0.22, 9, C.wet, 0.5);
  // the wooden troughs of the washing: a plank walkway to the tail
  M.box(T, x, z1 + 0.15, 0.04, 1.8, 0.1, 0.9, 0, C.wood2);
  void lv; void i;
}

// ------------------------------------------------------------------------------------------------------------------ the smokehouse: kiln + brick stack
function stack(M, R, X, Z, H, r0, r1, big) {
  const T = M.S;
  if (big) {                                                                                  // the kiln: a stone block with a dark fire mouth, a flue hood
    M.box(T, X, Z, 0, 3.6, 2.4, 3.2, 0, C.stone2); M.box(T, X, Z, 2.4, 3.9, 0.35, 3.5, 0, C.stone);
    M.box(T, X, Z + 1.62, 0.2, 1.3, 1.25, 0.1, 0, C.soot); M.box(T, X, Z + 1.64, 1.5, 1.7, 0.2, 0.12, 0, C.stone);
    M.box(T, X + 1.95, Z + 1.0, 0.0, 0.3, 0.5, 1.2, 0, C.stone);
  } else { M.box(T, X, Z, 0, 2.6, 1.6, 2.4, 0, C.stone2); M.box(T, X, Z, 1.6, 2.9, 0.3, 2.7, 0, C.stone); }
  const y0 = big ? 2.75 : 1.9, h = H - y0, n = 6;
  for (let i = 0; i < n; i++) {                                                               // the shaft in courses, tapering, with dark bands
    const t0 = i / n, t1 = (i + 1) / n, ra = r0 + (r1 - r0) * t0, rb = r0 + (r1 - r0) * t1;
    M.cyl(T, X, Z, y0 + h * t0, ra, h / n + 0.02, 10, i & 1 ? C.brick : jit(R, C.brick2, 0.06), rb);
  }
  M.cyl(T, X, Z, H - 0.55, r1 + 0.18, 0.55, 10, C.stone2, r1 + 0.1); M.cyl(T, X, Z, H, r1 + 0.1, 0.28, 10, C.soot, r1 + 0.05);          // the cap + soot rim
  for (const t of [0.32, 0.64]) M.cyl(T, X, Z, y0 + h * t, r0 + (r1 - r0) * t + 0.12, 0.3, 10, C.stone2, r0 + (r1 - r0) * t + 0.1);       // iron bands
}

// an open drying shed: four posts, a pitched roof of planks, three rods with hanging fish (smoked gold-brown)
function shed(M, R, cx, cz, ry) {
  const T = M.S, W = 8.2, D = 3.6, H = 3.1, c = Math.cos(ry), s = Math.sin(ry);
  const W2 = (u, v) => [cx + u * c + v * s, cz - u * s + v * c];
  for (const [u, v] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2], [0, -D / 2], [0, D / 2]]) { const [x, z] = W2(u, v); M.box(T, x, z, 0, 0.22, H, 0.22, ry, C.wood2); }
  for (const sd of [-1, 1]) { const [x, z] = W2(0, sd * D * 0.27); tbox(M, T, x, H + 0.35, z, W + 0.9, 0.14, D * 0.62, -sd * 0.42, ry, C.roof); }             // the two roof planes
  { const [x, z] = W2(0, 0); M.box(T, x, z, H + 0.72, W + 0.9, 0.18, 0.3, ry, C.wood2); }
  for (let r = 0; r < 3; r++) {
    const v = -D * 0.3 + r * D * 0.3, [x, z] = W2(0, v); M.box(T, x, z, H - 0.55, W - 0.3, 0.1, 0.1, ry, C.wood);          // the rod
    for (let f = 0; f < 15; f++) { const u = -W / 2 + 0.6 + f * ((W - 1.2) / 14), [fx, fz] = W2(u, v + (R() - 0.5) * 0.1); M.box(T, fx, fz, H - 1.35 - R() * 0.12, 0.17, 0.78, 0.07, ry + (R() - 0.5) * 0.3, jit(R, R() < 0.35 ? C.smoked2 : C.smoked, 0.1)); }
  }
}

// a light drying rack, same size as kit_ws's ws_fishrack (4.2 x 4.2 x 3.7): two A-frames, a ridge pole, two side rods, three rows of hanging smoked fish (~0.5k tris instead of 2.7k)
function rack(M, R, cx, cz, ry) {
  const T = M.S, c = Math.cos(ry), s = Math.sin(ry), W = 4.1, H = 3.4, B = 1.75;
  const W2 = (u, v) => [cx + u * c + v * s, cz - u * s + v * c];
  const L = Math.hypot(B, H), ang = Math.atan2(H, B);
  for (const u of [-W / 2 + 0.1, W / 2 - 0.1]) for (const sd of [-1, 1]) { const [x, z] = W2(u, sd * B / 2); tbox(M, T, x, H / 2, z, 0.13, 0.13, L, sd * ang, ry, C.wood3); }
  { const [x, z] = W2(0, 0); M.box(T, x, z, H - 0.05, W, 0.14, 0.14, ry, C.wood2); }
  for (const sd of [-1, 1]) { const v = sd * B * (1 - 2.2 / H); const [x, z] = W2(0, v); M.box(T, x, z, 2.15, W, 0.1, 0.1, ry, C.wood); }
  for (const [v, y] of [[0, H - 0.05], [-B * (1 - 2.2 / H), 2.15], [B * (1 - 2.2 / H), 2.15]]) {
    for (let f = 0; f < 10; f++) { const u = -W / 2 + 0.45 + f * ((W - 0.9) / 9), [fx, fz] = W2(u, v + (R() - 0.5) * 0.08); M.box(T, fx, fz, y - 0.75 - R() * 0.1, 0.17, 0.72, 0.07, ry + (R() - 0.5) * 0.3, jit(R, R() < 0.35 ? C.smoked2 : C.smoked, 0.1)); }
  }
}

// a fish basket: wicker cylinder with a heap of silver fish on top
function basket(M, R, x, z, k) {
  M.cyl(M.S, x, z, 0, 0.5, 0.55, 8, jit(R, C.wicker, 0.1), 0.62); M.cyl(M.S, x, z, 0.5, 0.58, 0.1, 8, C.wicker2, 0.6);
  M.cyl(M.S, x, z, 0.55, 0.52, 0.24, 8, k < 0.5 ? C.silver : C.silver2, 0.3);
  M.box(M.S, x + 0.1, z - 0.05, 0.72, 0.3, 0.07, 0.12, R() * 3, C.smoked); M.box(M.S, x - 0.15, z + 0.1, 0.72, 0.28, 0.07, 0.1, R() * 3, C.silver);
}

// ------------------------------------------------------------------------------------------------------------------ per kind
export const PROC_C1 = {
  // the fishery's net poles (wsbuild PROC.fishery: x = -15, -10, 10, 15 at z = 8.5, 1.5 m high) get their nets
  fishery(M, lv, R) {
    const n = counts('fishery', lv).nets;
    net(M, R, -15, -10, 8.5, 1.45, 1.05, 0.22);
    if (n >= 2) net(M, R, 10, 15, 8.5, 1.45, 1.05, 0.22);
  },
  panning(M, lv, R) {
    sluiceXs(lv).forEach((x, i) => sluice(M, R, x, lv, i));
    // a heap of washed gravel at the back (the claim's overburden)
    M.cyl(M.S, 14.2, 6.2, 0, 2.0, 0.8, 10, C.gravel, 0.9); M.cyl(M.S, 15.2, 5.0, 0, 1.1, 0.5, 8, C.gravel2, 0.5); if (lv >= 10) { M.cyl(M.S, -14.0, 6.6, 0, 1.7, 0.7, 10, C.gravel2, 0.8); M.cyl(M.S, -13.2, 7.8, 0, 0.9, 0.4, 8, C.gravel, 0.4); }
  },
  smokehouse(M, lv, R) {
    stack(M, R, SMOKE_STACK.x, SMOKE_STACK.z, SMOKE_STACK.h, 1.1, 0.72, true);
    if (lv >= 15) stack(M, R, SMOKE_STACK2.x, SMOKE_STACK2.z, SMOKE_STACK2.h, 0.85, 0.58, false);
    for (let i = 0; i < shedsAt(lv); i++) shed(M, R, SHEDS[i].x, SHEDS[i].z, SHEDS[i].ry);
    RACKS.slice(RACK_KIT, counts('smokehouse', lv).racks).forEach(([x, z], i) => rack(M, R, x, z, ((i + RACK_KIT) % 3 - 1) * 0.04));
    BASKETS.slice(0, counts('smokehouse', lv).baskets).forEach(([x, z], i) => basket(M, R, x, z, (i * 0.618) % 1));
  },
};
