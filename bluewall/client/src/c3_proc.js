// C3 procedural parts (what no kit has): the refinery's distillation column, tanks, pipe rack, bullet tanks and flare stack; the mint's paved yard.
// Everything goes into the worksite's ONE vertex-coloured soup (wsbuild.js maker(): M.S, the existing MAT.soup material) -> +0 materials, +0 shader programs, +0 draw calls.
// PROC functions have the signature of wsbuild's PROC: (M, lv, R) with M = { S, P3, F, box, cyl, disc, gquad } in the site's local frame.
import * as THREE from 'three';
import { TANKS, TANK_R, BULLETS, MINT_YARD, CHESTS } from './c3_kinds.js';
import { LEVEL_CAP } from './tiers.js';   // TR2-S4b: the level cap (30 today, 50 when the server says so)

const col = (h) => new THREE.Color(h);
const C = { steel: col('#8fa0b8'), steelL: col('#a9b8cf'), steelD: col('#56657f'), navy: col('#25375a'), black: col('#1b1f2a'), pipe: col('#3a4b6c'), pipeL: col('#5a6d90'),
  oreRock: col('#6e6358'), oreRock2: col('#5b5249'), goldp: col('#ecbc24'), tie: col('#5a4430'), rail: col('#4b4f58'),
  wood: col('#8a5f38'), woodD: col('#6a4627'), band: col('#3a3f4c'), red: col('#b8432b'), concrete: col('#8c939f'), concrete2: col('#7a818d'), paving: col('#6f7886'), paving2: col('#7d8695') };
// wsbuild's maker() writes every face with the winding that points INSIDE (box / cyl / gquad: the soup is DoubleSide, so the lighting is right, but the shadow lookup uses the vertex normal
// and, with the game's normalBias, samples under the surface -> every soup surface is in its own shadow and renders almost black).  The C3 parts flip the winding of what they emit.
const flipped = (M) => ({ ...M, S: { quad: (a, b, c, d, k) => M.S.quad(a, d, c, b, k), tri: (a, b, c, k) => M.S.tri(a, c, b, k) } });
const NN = (lv, a, b) => Math.round(a + (b - a) * (Math.max(1, lv) - 1) / (LEVEL_CAP - 1));

// a tube between two points (local x, y above the pad, z); `cap` closes the two ends
function tube(M, a, b, r, k, seg = 8, cap = false) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(d[0], d[1], d[2]) || 1, n = d.map((v) => v / len);
  const ref = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  let u = [n[1] * ref[2] - n[2] * ref[1], n[2] * ref[0] - n[0] * ref[2], n[0] * ref[1] - n[1] * ref[0]]; const ul = Math.hypot(...u); u = u.map((v) => v / ul);
  const v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
  const ring = (c) => Array.from({ length: seg }, (_, i) => { const t = (i / seg) * 6.2832, cs = Math.cos(t) * r, sn = Math.sin(t) * r; return M.P3(c[0] + u[0] * cs + v[0] * sn, M.F.y0 + c[1] + u[1] * cs + v[1] * sn, c[2] + u[2] * cs + v[2] * sn); });
  const A = ring(a), B = ring(b);
  for (let i = 0; i < seg; i++) { const j = (i + 1) % seg, sh = 0.78 + 0.22 * Math.cos((i / seg) * 6.2832); M.S.quad(A[i], A[j], B[j], B[i], new THREE.Color(k.r * sh, k.g * sh, k.b * sh)); }
  if (cap) for (const [c, E] of [[a, A], [b, B]]) { const cc = M.P3(c[0], M.F.y0 + c[1], c[2]); for (let i = 0; i < seg; i++) M.S.tri(cc, E[i], E[(i + 1) % seg], k); }
}
// a hand wheel on a short stem (the red valves of the pipe rack)
function valve(M, x, y, z) { M.box(M.S, x, z, y, 0.12, 0.4, 0.12, 0, C.black); M.cyl(M.S, x, z, y + 0.4, 0.34, 0.09, 8, C.red, 0.34); }

function tank(M, cx, cz, r, h, k = C.steel) {
  M.cyl(M.S, cx, cz, 0, r + 0.3, 0.28, 16, C.concrete, r + 0.3);                          // the foundation ring
  M.cyl(M.S, cx, cz, 0.28, r, h, 16, k, r);                                                // the shell
  M.cyl(M.S, cx, cz, 0.28 + h, r, 0.55, 16, C.steelD, r * 0.55);                           // shoulder
  M.cyl(M.S, cx, cz, 0.83 + h, r * 0.55, 0.4, 12, C.steel, r * 0.4);                       // roof cap
  M.cyl(M.S, cx, cz, h * 0.36, r + 0.07, 0.24, 16, C.steelD, r + 0.07);                    // rolled bands
  M.cyl(M.S, cx, cz, h * 0.72, r + 0.07, 0.24, 16, C.steelD, r + 0.07);
  M.cyl(M.S, cx, cz, h * 0.5, r + 0.05, 0.8, 16, C.navy, r + 0.05);                        // the navy label stripe
  M.box(M.S, cx + r + 0.12, cz, 0.28, 0.1, h + 0.5, 0.7, 0, C.black);                       // the ladder
  for (let i = 0; i < 7; i++) M.box(M.S, cx + r + 0.16, cz, 0.7 + i * (h / 7), 0.06, 0.06, 0.62, 0, C.pipeL);
}


// a coin chest: oak body, banded lid, iron straps; `open` = lid up at the back and a heap of gold inside
function chest(M, x, z, ry, open) {
  const c = Math.cos(ry), s = Math.sin(ry), at = (dx, dz) => [x + dx * c + dz * s, z - dx * s + dz * c];
  M.box(M.S, x, z, 0, 1.3, 0.56, 0.86, ry, C.wood);
  for (const dx of [-0.46, 0.46]) { const [bx, bz] = at(dx, 0); M.box(M.S, bx, bz, 0, 0.12, 0.58, 0.9, ry, C.band); }
  if (open) {
    const [lx, lz] = at(0, -0.46); M.box(M.S, lx, lz, 0.56, 1.34, 0.5, 0.1, ry, C.woodD);
    M.cyl(M.S, x, z, 0.56, 0.5, 0.26, 7, C.goldp, 0.22);
  } else {
    M.box(M.S, x, z, 0.56, 1.34, 0.16, 0.9, ry, C.woodD); M.box(M.S, x, z, 0.72, 1.2, 0.12, 0.76, ry, C.wood);
    for (const dx of [-0.46, 0.46]) { const [bx, bz] = at(dx, 0); M.box(M.S, bx, bz, 0.56, 0.12, 0.3, 0.94, ry, C.band); }
  }
}

export const C3_PROC = {
  // the gold mine's rails + ore heaps (replaces wsbuild's PROC.gold): the heaps were canary-yellow cones that read as haystacks — now grey-brown rock heaps with gold nuggets in them
  gold(M0, lv, R) {
    const M = flipped(M0);
    for (const x of [-3, 3]) {
      const z0 = -3, z1 = 15;
      for (let z = z0; z <= z1; z += 0.9) M.box(M.S, x, z, 0.03, 1.7, 0.08, 0.28, 0, C.tie);
      for (const sd of [-1, 1]) M.box(M.S, x + sd * 0.55, (z0 + z1) / 2, 0.11, 0.1, 0.1, z1 - z0, 0, C.rail);
    }
    const heaps = NN(lv, 1, 4);
    for (let i = 0; i < heaps; i++) {
      const hx = -12 + i * 8, hz = 17 + R() * 2;
      M.cyl(M.S, hx, hz, 0, 2.3, 1.3, 9, C.oreRock, 0.7); M.cyl(M.S, hx + 1.6, hz + 0.6, 0, 1.2, 0.8, 7, C.oreRock2, 0.4);
      for (let k = 0; k < 7; k++) { const a = R() * 6.283, rr = R() * 1.55, h = Math.max(0.1, 1.3 * (2.3 - rr) / 1.6 - 0.12); M.box(M.S, hx + Math.cos(a) * rr, hz + Math.sin(a) * rr, h, 0.42 + R() * 0.2, 0.3, 0.36, R() * 3, C.goldp); }
    }
    if (lv >= 5) chest(M, 12.6, 12.4, -0.5, lv >= 15);                                    // the locked chest of the day's gold
  },
  refinery(M0, lv, R) {
    const M = flipped(M0); void R;
    const t = lv >= 25 ? 3 : lv >= 12 ? 2 : 1, nT = NN(lv, 1, 6);
    // the concrete apron of the tank farm
    M.gquad(M.S, 3.0, -12.4, 14.9, -1.0, C.concrete2, 0.07, 4, 4);
    M.gquad(M.S, -5.2, -11.6, 0.8, -4.8, C.concrete2, 0.07, 3, 3);
    // the distillation column (back left): shell, narrower top, bands, a catwalk with rails and a ladder
    const cx = -2.2, cz = -8.2;
    M.cyl(M.S, cx, cz, 0, 1.9, 0.35, 14, C.concrete, 1.9);
    M.cyl(M.S, cx, cz, 0.35, 1.5, 8.2, 14, C.steel, 1.5);
    M.cyl(M.S, cx, cz, 8.55, 1.5, 0.7, 14, C.steelD, 1.0);
    M.cyl(M.S, cx, cz, 9.25, 1.0, 3.6, 12, C.steel, 0.9);
    M.cyl(M.S, cx, cz, 12.85, 0.9, 0.5, 12, C.steelD, 0.35);
    for (const y of [2.4, 5.0, 7.4]) M.cyl(M.S, cx, cz, y, 1.58, 0.22, 14, C.steelD, 1.58);
    M.cyl(M.S, cx, cz, 10.6, 1.04, 0.2, 12, C.steelD, 1.04);
    M.box(M.S, cx, cz, 5.9, 4.0, 0.14, 4.0, 0, C.pipeL);                                    // the catwalk
    for (const [sx, sz, w, d] of [[0, 2, 4, 0.08], [0, -2, 4, 0.08], [2, 0, 0.08, 4], [-2, 0, 0.08, 4]]) M.box(M.S, cx + sx, cz + sz, 6.05, w, 1.0, d, 0, C.black);
    M.box(M.S, cx + 1.4, cz + 1.6, 0.35, 0.1, 5.6, 0.6, 0, C.black);                         // ladder
    for (let i = 0; i < 9; i++) M.box(M.S, cx + 1.4, cz + 1.66, 0.7 + i * 0.6, 0.06, 0.06, 0.55, 0, C.pipeL);
    // the tank farm (fills up with the level)
    for (let i = 0; i < nT; i++) tank(M, TANKS[i][0], TANKS[i][1], TANK_R, 5.0, i % 2 ? C.steelL : C.steel);
    // the pipe rack in front of the tanks: two pipes on stands, tees down to every tank, red valves
    const y = 0.95, zr = -0.2;
    tube(M, [-4.2, y, zr], [13.6, y, zr], 0.3, C.pipe, 8); tube(M, [-4.2, y + 0.7, zr], [13.6, y + 0.7, zr], 0.2, C.pipeL, 8);
    for (let x = -3.6; x <= 13; x += 3.2) M.box(M.S, x, zr, 0, 0.22, y + 0.35, 0.9, 0, C.black);
    for (let i = 0; i < nT; i++) {
      const [tx, tz] = TANKS[i];
      if (tz < -2) { tube(M, [tx, y, zr], [tx, y, tz + TANK_R + 0.3], 0.22, C.pipe, 7); valve(M, tx, y + 0.2, (zr + tz + TANK_R) / 2); }
    }
    valve(M, 1.2, y + 0.9, zr); valve(M, 9.2, y + 0.9, zr);
    // overhead line from the column to the tank farm (a dog-leg)
    tube(M, [cx + 1.0, 7.1, cz], [TANKS[0][0] - 1.0, 7.1, cz], 0.26, C.pipe, 8); tube(M, [TANKS[0][0] - 1.0, 7.1, cz], [TANKS[0][0] - 1.0, 5.6, cz], 0.26, C.pipe, 8);
    // horizontal bullet tanks on saddles (left front)
    const nB = NN(lv, 0, 3);
    for (let i = 0; i < nB; i++) {
      const [bx, bz] = BULLETS[i];
      tube(M, [bx - 3.4, 1.75, bz], [bx + 3.4, 1.75, bz], 1.35, C.steel, 12, true);
      for (const sx of [-1.9, 1.9]) M.box(M.S, bx + sx, bz, 0, 0.5, 1.2, 2.3, 0, C.concrete);
      M.cyl(M.S, bx, bz, 3.0, 0.3, 0.3, 8, C.steelD, 0.3);                                   // the dome
    }
    // the flare stack(s): a tall thin stack on a base; the flame is the world's flame sprite (c3_kinds FX)
    const stack = (sx, sz, h) => { M.box(M.S, sx, sz, 0, 1.5, 0.45, 1.5, 0, C.concrete); M.cyl(M.S, sx, sz, 0.45, 0.4, h, 8, C.black, 0.34); M.cyl(M.S, sx, sz, 0.45 + h, 0.55, 0.45, 8, C.steelD, 0.2); for (const q of [3, 6, 9]) if (q < h) M.cyl(M.S, sx, sz, q, 0.46, 0.15, 8, C.steelD, 0.46); };
    stack(-13.4, -9.2, 11.0);
    if (lv >= 20) stack(-13.4, -4.6, 8.0);
    void t;
  },
  mint(M0, lv, R) {
    const M = flipped(M0);
    const { X, Z } = MINT_YARD, big = lv >= 8;
    // the paved yard: dark cut stone, a lighter strip along the way from the gate to the vault door
    M.gquad(M.S, big ? -X + 0.8 : -9, big ? -Z + 0.8 : -11.2, big ? X - 0.8 : 9.5, big ? Z - 0.5 : 10.5, C.paving, 0.07, 5, 6);
    M.gquad(M.S, -1.4, -1.2, 1.4, big ? Z : 10.5, C.paving2, 0.09, 1, 5);
    M.gquad(M.S, 1.4, -1.2, 8.8, 0.8, C.paving2, 0.09, 3, 1);
    for (const q of CHESTS(lv, R)) chest(M, q.x, q.z, q.ry, q.open);
  },
};
