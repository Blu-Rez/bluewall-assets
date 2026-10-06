// The stable estate (p22, "pasture"): a timber stable block, the round pen, the yard, the horse-keepers' camp and the pasture fence.
// Built once from military.js into ONE merged mesh (pas_geo.js: one draw call, procedural boards / shingles / stone / straw / felt).
//   buildStableEstate(ctx, P, { scene, Q }) -> SPOTS (where life.js puts the horses, the trainer, the grooms, the camp people)
// Local frame of the plot: u = right (south), v = front (east, toward the pasture), y = up from the plot floor y0.
// Scale: a horse is ~5.6 m long and ~4.7 m to the ears, a person ~3.1 m (the game's heroic scale) — doors, eaves and rails follow that.
// Level: everything appears with the stable's level 1 (aTag); a richer estate grows with it (6: a tack room and more hay, 8: the gilded
// vane and pennants, 12: a third yurt and flower boxes, 16: the winged horses' aerie tower, 20: ice-blue crystal finials and banners).
// The pasture fence and its gates belong to the pasture (always there).
import * as THREE from 'three';
import * as L from './layout.js';
import { ENT } from './skin.js';
import { Soup, S, place, estateMesh } from './pas_geo.js';
import { Flames, Pools } from './fx.js';
import { rng } from './noise.js';
import { addTent } from './nomads.js';

// TASTE SWITCH — the stable's paint (one constant; the default ships, the others are on the sample sheet pasture/looks.png):
//   'navy'  dark-stained boards, navy Dutch doors with ice-white trim, weathered cedar shingles (default: the kingdom's colours)
//   'oak'   honey-oak boards, oak doors with black iron, dark slate roofs
//   'white' white-washed boards, navy doors, blue-grey slate roofs (a royal stud)
export const STABLE_LOOK = 'navy';
let LOOK = STABLE_LOOK;
export const setStableLook = (k) => { LOOK = k; };           // (dev sample sheet only)
const LOOKS = {
  navy: { wall: 0x46352a, wall2: 0x3c2e25, trim: 0x2a1f18, door: 0x22324e, door2: 0x2b3d5c, light: 0xdde6ee, shingle: 0x6d5e50, shingle2: 0x5f5247, wing: 0x695b4e },
  oak: { wall: 0x8c6a46, wall2: 0x7c5c3c, trim: 0x3a2a1c, door: 0x6b4a2c, door2: 0x5e4026, light: 0x2b2724, shingle: 0x50555b, shingle2: 0x464a50, wing: 0x4c5157 },
  white: { wall: 0xd6d2c6, wall2: 0xcbc6b8, trim: 0x2b3240, door: 0x22324e, door2: 0x2b3d5c, light: 0xf0f3f6, shingle: 0x4c535d, shingle2: 0x41464e, wing: 0x49505a },
};
// colours (sRGB)
const C = {
  wall: 0x46352a, wall2: 0x3c2e25, trim: 0x2a1f18, ice: 0xdde6ee, navy: 0x22324e, navy2: 0x2b3d5c, shingle: 0x6d5e50, shingle2: 0x5f5247,
  stone: 0x8c9098, stoneL: 0xa6a8ac, dark: 0x120e0b, straw: 0xc8a75e, hay: 0xb9a160, iron: 0x3c4048, glass: 0xffb35a, sand: 0xb39871,
  fence: 0x8a7764, fence2: 0x76695a, felt: 0xe4dac6, felt2: 0xcfc2a8, canvas: 0xd9cfb6, leather: 0x6b4026, rope: 0x8c7a5c, water: 0x2c4a52, gold: 0xd9a63a,
};
// horses use these (life.js reads SPOTS after the build)
export const SPOTS = { ready: false };
// night glow, flames and smoke of the estate (life.js drives them: update(t, night, near))
export const STABLE_FX = { flames: null, pools: null, smokers: [], group: null, update() {} };

export function buildStableEstate(ctx, P, { scene, Q, A }) {
  const { height, M } = ctx, R = rng(22022);
  const [ox, oz] = P.W(0, 0), y0 = P.y0, ry = P.ry;
  const SP = new Soup(ox, oz); SP.oy = y0; SP.bid = ctx.B.tagB || 0;
  const K = LOOKS[LOOK] || LOOKS.navy;
  const flames = new Flames(), pools = new Pools(), smokers = [];
  const ST = ENT.stable;
  SP.tag(ST, 1);
  // ---- local helpers (u, y, v) -> world
  const m = (u, y, v, yaw = 0, pitch = 0, roll = 0) => { const [x, z] = P.W(u, v); return place(x, y0 + y, z, ry + yaw, pitch, roll); };
  const pt = (u, y, v) => { const [x, z] = P.W(u, v); return new THREE.Vector3(x, y0 + y, z); };
  const gy = (u, v) => { const [x, z] = P.W(u, v); return height(x, z) - y0; };
  const box = (u, y, v, su, sy, sv, hex, mat, o = {}) => SP.box(m(u, y, v, o.yaw || 0, o.pitch || 0, o.roll || 0), su, sy, sv, hex, mat, o);
  const cyl = (u, y, v, r0, r1, h, seg, hex, mat, o = {}) => SP.cyl(m(u, y, v, o.yaw || 0, o.pitch || 0, o.roll || 0), r0, r1, h, seg, hex, mat, o);
  const face = (pts, hex, mat, o) => SP.face(pts.map(([u, y, v]) => pt(u, y, v)), hex, mat, o);
  // a beam between two local points (square section w x h), e.g. braces, rails, poles
  const beam = (a, b, w, h, hex, mat = S.grain, o = {}) => {
    const A = pt(...a), B = pt(...b), d = new THREE.Vector3().subVectors(B, A), len = d.length(), mid = A.clone().addScaledVector(d, 0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.clone().normalize());
    if (o.twist) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), o.twist));
    SP.box(new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)), len + (o.ext || 0), h, w, hex, mat, o);
  };
  // lantern: iron cage + glowing glass (+ a flame sprite and a warm pool on the ground at night)
  const lantern = (u, y, v, hang = false, pool = true) => {
    box(u, y, v, 0.42, 0.62, 0.42, C.glass, S.glow);
    box(u, y + 0.38, v, 0.56, 0.12, 0.56, C.iron, S.metal); box(u, y - 0.36, v, 0.5, 0.1, 0.5, C.iron, S.metal);
    cyl(u, y + 0.44, v, 0.22, 0.02, 0.3, 4, C.iron, S.metal, { yaw: Math.PI / 4 });
    for (const [du, dv] of [[-0.21, -0.21], [0.21, -0.21], [0.21, 0.21], [-0.21, 0.21]]) box(u + du, y, v + dv, 0.05, 0.64, 0.05, C.iron, S.metal);
    if (hang) box(u, y + 0.9, v, 0.05, 0.8, 0.05, C.iron, S.metal);
    const w = pt(u, y, v); flames.add(w.x, w.y + 0.05, w.z, 0.95, [1, 0.66, 0.3]);
    if (pool) { const [x, z] = P.W(u, v); pools.add(x, height(x, z) + 0.08, z, 4.6, [1, 0.6, 0.25], 0.42); }
  };
  // a 4-sided pyramid roof cap (cupola, posts)
  const pyramid = (u, y, v, w, h, hex, mat) => cyl(u, y, v, w * 0.7071, 0.02, h, 4, hex, mat, { yaw: Math.PI / 4 });

  // ================================================================ THE STABLE BLOCK
  // centre: a two-storey hay barn (gable to the front, big sliding doors, hay loft + hoist, cupola + weather vane)
  // wings: 3 stalls each with Dutch doors under a low porch; stone footing all round; shingled roofs with white barge boards
  const HB = { u: 5.2, v0: -7.5, v1: 6.0, eave: 7.6, ridge: 13.0 };         // hay barn half-width, back / front wall, eave, ridge
  const WG = { u0: 5.2, u1: 15.4, v0: -6.0, v1: 4.6, eave: 6.1, ridge: 9.7 }; // stall wings (mirrored)
  const FOOT = 0.5;
  // ---- stone footing (reaches down below the ground so it never floats)
  box(0, FOOT / 2 - 1.6, (HB.v0 + HB.v1) / 2, HB.u * 2 + 0.5, FOOT + 3.2, HB.v1 - HB.v0 + 0.5, C.stone, S.stone);
  for (const e of [-1, 1]) box(e * (WG.u0 + WG.u1) / 2, FOOT / 2 - 1.6, (WG.v0 + WG.v1) / 2, WG.u1 - WG.u0 + 0.5, FOOT + 3.2, WG.v1 - WG.v0 + 0.5, C.stone, S.stone);
  box(0, FOOT + 0.06, (HB.v0 + HB.v1) / 2, HB.u * 2 + 0.62, 0.12, HB.v1 - HB.v0 + 0.62, C.stoneL, S.stone, { skip: ['-y'] });   // capstones
  for (const e of [-1, 1]) box(e * (WG.u0 + WG.u1) / 2, FOOT + 0.06, (WG.v0 + WG.v1) / 2, WG.u1 - WG.u0 + 0.62, 0.12, WG.v1 - WG.v0 + 0.62, C.stoneL, S.stone, { skip: ['-y'] });

  // ---- hay barn walls
  const Y1 = FOOT + 0.12;
  const wall = (u0, u1, yA, yB, v, hex = K.wall) => { if (u1 - u0 > 0.01 && yB - yA > 0.01) box((u0 + u1) / 2, (yA + yB) / 2, v, u1 - u0, yB - yA, 0.3, hex, S.board, { skip: ['-z'] }); };
  // front: piers either side of the big door, lintel over it, gable above the eave with the hay-loft opening
  const DW = 2.4, DH = 6.0;
  wall(-HB.u, -DW, Y1, HB.eave, HB.v1); wall(DW, HB.u, Y1, HB.eave, HB.v1); wall(-DW, DW, DH, HB.eave, HB.v1);
  // gable (front + back) as board polygons; the front one around the loft opening (u -1.3..1.3, y 8.3..10.6)
  const gab = (v, n) => {
    const rid = HB.ridge, e = HB.eave, hu = HB.u, s2 = (rid - e) / hu;
    if (n > 0) {
      const lo = 8.3, hi = 10.6, lw = 1.3, yAt = (u) => rid - Math.abs(u) * s2;
      face([[-hu, e, v], [-lw, e, v], [-lw, yAt(lw), v], [-hu, e, v]].slice(0, 3), K.wall, S.board);
      face([[-lw, e, v], [lw, e, v], [lw, lo, v], [-lw, lo, v]], K.wall, S.board);
      face([[-lw, hi, v], [lw, hi, v], [0, rid, v], [-lw, yAt(lw), v]], K.wall, S.board);
      face([[lw, hi, v], [lw, yAt(lw), v], [0, rid, v]], K.wall, S.board);
      face([[lw, e, v], [hu, e, v], [lw, yAt(lw), v]], K.wall, S.board);
    } else face([[hu, e, v], [-hu, e, v], [0, rid, v]], K.wall, S.board);
  };
  gab(HB.v1 + 0.15, 1); gab(HB.v0 - 0.15, -1);
  box(0, (Y1 + HB.eave) / 2, HB.v0, HB.u * 2, HB.eave - Y1, 0.3, K.wall, S.board, { skip: ['+z'] });
  for (const e of [-1, 1]) box(e * HB.u, (Y1 + HB.eave) / 2, (HB.v0 + HB.v1) / 2, 0.3, HB.eave - Y1, HB.v1 - HB.v0, K.wall, S.board);
  // corner posts + a girt at the loft floor (the timber frame shows on the front)
  for (const u of [-HB.u, HB.u]) box(u, (Y1 + HB.eave) / 2, HB.v1 + 0.12, 0.42, HB.eave - Y1, 0.42, K.trim, S.grain);
  box(0, 7.55, HB.v1 + 0.14, HB.u * 2 + 0.4, 0.34, 0.3, K.trim, S.grain);
  // the big doorway: a recess (dark interior, straw floor), white-trimmed frame, two navy sliding leaves (one open), iron rail
  {
    const v = HB.v1, d = 3.2;
    face([[-DW, Y1, v - d], [DW, Y1, v - d], [DW, DH, v - d], [-DW, DH, v - d]], 0x3a2410, S.glow);           // (a lamp-lit inside at night)
    face([[-DW, Y1, v], [-DW, Y1, v - d], [-DW, DH, v - d], [-DW, DH, v]], 0x1c1612, S.board);
    face([[DW, Y1, v - d], [DW, Y1, v], [DW, DH, v], [DW, DH, v - d]], 0x1c1612, S.board);
    face([[-DW, DH, v - d], [DW, DH, v - d], [DW, DH, v], [-DW, DH, v]], 0x0e0b09, S.flat);
    face([[-DW, Y1 + 0.02, v + 0.2], [DW, Y1 + 0.02, v + 0.2], [DW, Y1 + 0.02, v - d], [-DW, Y1 + 0.02, v - d]], 0x6a5634, S.straw);
    for (const e of [-1, 1]) box(e * (DW + 0.12), (Y1 + DH) / 2, v + 0.18, 0.26, DH - Y1 + 0.1, 0.16, K.light, S.flat);
    box(0, DH + 0.1, v + 0.18, DW * 2 + 0.5, 0.22, 0.16, K.light, S.flat);
    box(0.8, DH + 0.5, v + 0.38, DW * 2 + 5.2, 0.16, 0.12, C.iron, S.metal);                       // the rail
    const leaf = (uc, open) => {
      const w = DW + 0.1, h = DH - Y1 + 0.2, vv = v + 0.42 + (open ? 0.12 : 0), yc = Y1 + h / 2 - 0.1;
      box(uc, yc, vv, w, h, 0.14, K.door, S.board);
      for (const [du, dy, sw, sh] of [[0, h / 2 - 0.12, w, 0.22], [0, -h / 2 + 0.12, w, 0.22], [-w / 2 + 0.11, 0, 0.22, h], [w / 2 - 0.11, 0, 0.22, h], [0, 0, w, 0.18]]) box(uc + du, yc + dy, vv + 0.09, sw, sh, 0.05, K.light, S.flat);
      for (const sgn of [-1, 1]) { const a = Math.atan2(h / 2 - 0.2, w - 0.3); box(uc, yc + sgn * h / 4, vv + 0.1, Math.hypot(w - 0.3, h / 2 - 0.2), 0.16, 0.05, K.light, S.flat, { roll: sgn * a }); }
      for (const du of [-w / 2 + 0.4, w / 2 - 0.4]) cyl(uc + du, DH + 0.36, vv - 0.04, 0.13, 0.13, 0.1, 8, C.iron, S.metal, { pitch: Math.PI / 2 });
    };
    leaf(-DW / 2, false); leaf(DW / 2 + DW, true);
    // a horseshoe over the door (luck), iron hinges of the loft doors, two lanterns
    for (let k = 0; k <= 9; k++) { const a = Math.PI * (k / 9) * 1.3 - Math.PI * 0.15; box(Math.cos(a) * 0.44, 7.0 - Math.sin(a) * 0.44, v + 0.34, 0.15, 0.2, 0.07, C.gold, S.metal, { roll: -a + Math.PI / 2 }); }
    for (const e of [-1, 1]) { lantern(e * (HB.u + 0.05), 5.0, v + 0.62); box(e * (HB.u + 0.05), 5.42, v + 0.4, 0.08, 0.08, 0.5, C.iron, S.metal); }
  }
  // hay loft: dark opening, hay bales inside, two navy doors swung open, the hoist beam with a pulley, a rope and a bundle of hay
  {
    const v = HB.v1 + 0.16, lw = 1.3, lo = 8.3, hi = 10.6;
    face([[-lw, lo, v - 0.9], [lw, lo, v - 0.9], [lw, hi, v - 0.9], [-lw, hi, v - 0.9]], 0x2e1d0c, S.glow);
    for (const e of [-1, 1]) face(e < 0 ? [[-lw, lo, v], [-lw, lo, v - 0.9], [-lw, hi, v - 0.9], [-lw, hi, v]] : [[lw, lo, v - 0.9], [lw, lo, v], [lw, hi, v], [lw, hi, v - 0.9]], 0x1a1410, S.board);
    for (const [u, y, w] of [[-0.55, lo + 0.32, 1.1], [0.6, lo + 0.32, 1.0], [0.05, lo + 0.92, 1.2]]) box(u, y, v - 0.3, w, 0.6, 0.9, C.hay, S.straw);
    box(0, lo - 0.08, v + 0.1, lw * 2 + 0.4, 0.18, 0.4, K.light, S.flat); box(0, hi + 0.1, v + 0.06, lw * 2 + 0.4, 0.2, 0.2, K.light, S.flat);
    for (const e of [-1, 1]) {
      box(e * (lw + 0.1), (lo + hi) / 2, v + 0.06, 0.2, hi - lo + 0.2, 0.2, K.light, S.flat);
      const uc = e * (lw + 0.06), w = lw, yc = (lo + hi) / 2;        // the leaf, swung open against the wall
      box(uc + e * w / 2 + e * 0.05, yc, v + 0.2, w, hi - lo - 0.1, 0.1, K.door, S.board); box(uc + e * w / 2 + e * 0.05, yc, v + 0.27, w - 0.1, 0.12, 0.04, K.light, S.flat, { roll: e * 0.9 });
    }
    beam([0, 11.55, HB.v1 - 0.6], [0, 11.55, HB.v1 + 1.9], 0.36, 0.36, K.trim);
    cyl(0, 11.18, HB.v1 + 1.62, 0.2, 0.2, 0.12, 10, C.iron, S.metal, { roll: Math.PI / 2 });
    beam([0, 11.2, HB.v1 + 1.66], [0, 9.0, HB.v1 + 1.66], 0.05, 0.05, C.rope, S.flat);
    box(0, 8.62, HB.v1 + 1.66, 1.0, 0.75, 0.62, C.hay, S.straw, { yaw: 0.35 });
  }
  // roof of the hay barn: shingles + white barge boards + dark soffit; a louvred cupola with a weather vane on the ridge
  const roof = (u0, u1, v0, v1, yE, yR, alongU, over, hexS = K.shingle) => {
    // alongU: ridge along u (eaves at v0 / v1) else ridge along v (eaves at u0 / u1)
    const t = 0.24;
    if (alongU) {
      const vm = (v0 + v1) / 2, run = (v1 - v0) / 2, sl = (yR - yE) / run, yO = yE - over * sl, ua = u0 - over * 0.6, ub = u1 + over * 0.6;
      for (const s2 of [-1, 1]) {
        const ve = s2 > 0 ? v1 + over : v0 - over;
        const pts = s2 > 0 ? [[ua, yO, ve], [ub, yO, ve], [ub, yR, vm], [ua, yR, vm]] : [[ub, yO, ve], [ua, yO, ve], [ua, yR, vm], [ub, yR, vm]];
        const A = new THREE.Vector3().subVectors(pt(...pts[1]), pt(...pts[0])).normalize(), Bv = new THREE.Vector3().subVectors(pt(...pts[0]), pt(...pts[3])).normalize();
        face(pts, hexS, S.shingle, { uA: A, vB: Bv });
        face([pts[0], pts[3], pts[2], pts[1]].map(([u, y, v]) => [u, y - t, v]), 0x2a2018, S.board);
        beam([ua, yO - t / 2, ve], [ub, yO - t / 2, ve], 0.1, t + 0.06, K.trim);
      }
      // ends: barge boards (ice) along both slopes
      for (const ue of [ua, ub]) for (const s2 of [-1, 1]) { const ve = s2 > 0 ? v1 + over : v0 - over; beam([ue, yO - 0.05, ve], [ue, yR + 0.08, vm], 0.16, 0.42, K.light, S.flat, { ext: 0.3 }); }
      box((ua + ub) / 2, yR + 0.08, vm, ub - ua + 0.1, 0.24, 0.4, K.shingle2, S.grain);
    } else {
      const um = (u0 + u1) / 2, run = (u1 - u0) / 2, sl = (yR - yE) / run, yO = yE - over * sl, va = v0 - over * 0.6, vb = v1 + over * 0.6;
      for (const s2 of [-1, 1]) {
        const ue = s2 > 0 ? u1 + over : u0 - over;
        const pts = s2 > 0 ? [[ue, yO, vb], [ue, yO, va], [um, yR, va], [um, yR, vb]] : [[ue, yO, va], [ue, yO, vb], [um, yR, vb], [um, yR, va]];
        const A = new THREE.Vector3().subVectors(pt(...pts[1]), pt(...pts[0])).normalize(), Bv = new THREE.Vector3().subVectors(pt(...pts[0]), pt(...pts[3])).normalize();
        face(pts, hexS, S.shingle, { uA: A, vB: Bv });
        face([pts[0], pts[3], pts[2], pts[1]].map(([u, y, v]) => [u, y - t, v]), 0x2a2018, S.board);
        beam([ue, yO - t / 2, va], [ue, yO - t / 2, vb], 0.1, t + 0.06, K.trim);
      }
      for (const ve of [va, vb]) for (const s2 of [-1, 1]) { const ue = s2 > 0 ? u1 + over : u0 - over; beam([ue, yO - 0.05, ve], [um, yR + 0.08, ve], 0.16, 0.42, K.light, S.flat, { ext: 0.3 }); }
      box(um, yR + 0.08, (va + vb) / 2, 0.4, 0.24, vb - va + 0.1, K.shingle2, S.grain);
    }
  };
  roof(-HB.u, HB.u, HB.v0, HB.v1, HB.eave, HB.ridge, false, 0.9);
  for (const e of [-1, 1]) roof(e < 0 ? -WG.u1 : WG.u0 - 0.2, e < 0 ? -WG.u0 + 0.2 : WG.u1, WG.v0, WG.v1, WG.eave, WG.ridge, true, 0.75, e < 0 ? K.shingle : K.wing);
  {   // cupola
    const v = -0.6, b = HB.ridge - 0.9;
    box(0, b + 1.0, v, 2.0, 2.0, 2.0, K.wall2, S.board);
    for (const [du, dv, yaw] of [[0, 1.02, 0], [0, -1.02, 0], [1.02, 0, Math.PI / 2], [-1.02, 0, Math.PI / 2]]) {
      box(du, b + 1.25, v + dv, 1.3, 1.1, 0.06, C.dark, S.flat, { yaw });
      for (let k = 0; k < 5; k++) box(du * 1.01, b + 0.8 + k * 0.22, v + dv * 1.01, 1.3, 0.07, 0.12, K.light, S.flat, { yaw, pitch: 0.5 });
    }
    for (const [du, dv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box(du * 0.98, b + 1.0, v + dv * 0.98, 0.18, 2.0, 0.18, K.light, S.flat);
    box(0, b + 2.08, v, 2.6, 0.16, 2.6, K.trim, S.grain);
    pyramid(0, b + 2.16, v, 2.5, 1.5, K.shingle2, S.shingle);
    cyl(0, b + 3.6, v, 0.05, 0.05, 2.2, 5, C.iron, S.metal);
    for (const [du, dv] of [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) box(du / 2, b + 4.3, v + dv / 2, du ? 1.0 : 0.05, 0.05, dv ? 1.0 : 0.05, C.iron, S.metal);
    box(0, b + 5.25, v, 0.06, 0.06, 1.9, C.iron, S.metal); cyl(0, b + 5.25, v + 0.95, 0.16, 0.0, 0.42, 4, C.iron, S.metal, { pitch: Math.PI / 2 });
    // the horse on the vane (a running silhouette in black iron)
    const hv = (du, dy, dv, sx, sy, roll = 0) => box(du, b + 5.85 + dy, v + dv, 0.06, sy, sx, C.iron, S.metal, { pitch: roll });
    hv(0, 0, 0, 1.1, 0.42); hv(0, 0.32, 0.62, 0.55, 0.22, -0.9); hv(0, 0.55, 0.85, 0.42, 0.2, -0.2); hv(0, -0.38, 0.4, 0.12, 0.6, 0.5); hv(0, -0.38, -0.4, 0.12, 0.6, -0.5); hv(0, 0.1, -0.68, 0.5, 0.12, 0.6);
    hv(0, -0.42, 0.18, 0.1, 0.55, -0.3); hv(0, -0.42, -0.2, 0.1, 0.55, 0.35);
  }

  // ---- the stall wings: front wall with 3 Dutch doors each, porch, back + end walls, windows, lanterns
  const STALLS = [];
  const DOORW = 2.1, DOORH = 5.45, LOWER = 2.55;
  for (const e of [-1, 1]) {
    const u0 = WG.u0, u1 = WG.u1, us = [6.9, 10.3, 13.7];
    // back + end walls
    box(e * (u0 + u1) / 2, (Y1 + WG.eave) / 2, WG.v0, u1 - u0, WG.eave - Y1, 0.3, K.wall, S.board, { skip: ['+z'] });
    box(e * u1, (Y1 + WG.eave) / 2, (WG.v0 + WG.v1) / 2, 0.3, WG.eave - Y1, WG.v1 - WG.v0, K.wall, S.board);
    face(e > 0 ? [[u1 + 0.15, WG.eave, WG.v1], [u1 + 0.15, WG.eave, WG.v0], [u1 + 0.15, WG.ridge, (WG.v0 + WG.v1) / 2]] : [[-u1 - 0.15, WG.eave, WG.v0], [-u1 - 0.15, WG.eave, WG.v1], [-u1 - 0.15, WG.ridge, (WG.v0 + WG.v1) / 2]], K.wall, S.board);
    // end window (dark, white frame, a cross bar) + back windows
    box(e * (u1 + 0.17), 4.0, -0.7, 0.05, 1.3, 1.5, C.dark, S.flat); box(e * (u1 + 0.2), 4.0, -0.7, 0.06, 1.5, 0.14, K.light, S.flat); box(e * (u1 + 0.2), 4.0, -0.7, 0.06, 0.12, 1.7, K.light, S.flat);
    for (const uu of us) { box(e * uu, 4.4, WG.v0 - 0.17, 1.0, 0.8, 0.05, C.dark, S.flat); box(e * uu, 4.4, WG.v0 - 0.2, 1.2, 0.12, 0.06, K.light, S.flat); box(e * uu, 4.83, WG.v0 - 0.2, 1.3, 0.14, 0.08, K.light, S.flat); }
    // the front: piers between the doors, lintels; a recess (dark stall) behind every door
    const v = WG.v1, edges = [u0, ...us.flatMap((uu) => [uu - DOORW / 2, uu + DOORW / 2]), u1];
    for (let k = 0; k < edges.length; k += 2) { const a = edges[k], b = edges[k + 1]; wall(e > 0 ? a : -b, e > 0 ? b : -a, Y1, WG.eave, v); }
    us.forEach((uu, k) => {
      const uc = e * uu, a = uc - DOORW / 2, b = uc + DOORW / 2, d = 2.6;
      wall(a, b, DOORH, WG.eave, v);
      face([[a, Y1, v - d], [b, Y1, v - d], [b, DOORH, v - d], [a, DOORH, v - d]], 0x24170b, S.glow);
      face([[a, Y1, v], [a, Y1, v - d], [a, DOORH, v - d], [a, DOORH, v]], 0x1a1410, S.board);
      face([[b, Y1, v - d], [b, Y1, v], [b, DOORH, v], [b, DOORH, v - d]], 0x1a1410, S.board);
      face([[a, DOORH, v - d], [b, DOORH, v - d], [b, DOORH, v], [a, DOORH, v]], 0x0b0907, S.flat);
      face([[a, Y1 + 0.02, v], [b, Y1 + 0.02, v], [b, Y1 + 0.02, v - d], [a, Y1 + 0.02, v - d]], 0x4a3c26, S.straw);
      // frame (ice), lower leaf (navy, Z-brace), upper leaf open against the wall or shut
      for (const s2 of [-1, 1]) box(uc + s2 * (DOORW / 2 + 0.1), (Y1 + DOORH) / 2, v + 0.17, 0.22, DOORH - Y1 + 0.1, 0.14, K.light, S.flat);
      box(uc, DOORH + 0.08, v + 0.17, DOORW + 0.44, 0.22, 0.14, K.light, S.flat);
      const lh = LOWER - Y1, ly = Y1 + lh / 2, open = !(e < 0 && k === 2) && !(e > 0 && k === 0);
      box(uc, ly, v + 0.06, DOORW, lh, 0.12, K.door, S.board);
      for (const [dy, sh] of [[lh / 2 - 0.09, 0.18], [-lh / 2 + 0.09, 0.18]]) box(uc, ly + dy, v + 0.14, DOORW, sh, 0.05, K.light, S.flat);
      box(uc, ly, v + 0.14, Math.hypot(DOORW - 0.2, lh - 0.36), 0.16, 0.05, K.light, S.flat, { roll: Math.atan2(lh - 0.36, DOORW - 0.2) * (k % 2 ? 1 : -1) });
      box(uc, LOWER + 0.05, v + 0.12, DOORW + 0.1, 0.1, 0.3, K.trim, S.grain);                     // the rail on top of the lower leaf (horses lean on it)
      const uh = DOORH - LOWER - 0.1, uy = LOWER + 0.05 + uh / 2 + 0.03;
      if (open) {                                                                                 // swung right round against the wall
        const side = (k % 2 ? 1 : -1) * e, uo = uc + side * (DOORW + 0.15);
        box(uo, uy, v + 0.28, DOORW - 0.1, uh, 0.1, K.door2, S.board);
        box(uo, uy, v + 0.35, Math.hypot(DOORW - 0.3, uh - 0.3), 0.14, 0.04, K.light, S.flat, { roll: Math.atan2(uh - 0.3, DOORW - 0.3) });
        box(uo, uy, v + 0.35, Math.hypot(DOORW - 0.3, uh - 0.3), 0.14, 0.04, K.light, S.flat, { roll: -Math.atan2(uh - 0.3, DOORW - 0.3) });
      } else {
        box(uc, uy, v + 0.06, DOORW, uh, 0.12, K.door2, S.board);
        box(uc, uy, v + 0.14, Math.hypot(DOORW - 0.3, uh - 0.3), 0.14, 0.04, K.light, S.flat, { roll: Math.atan2(uh - 0.3, DOORW - 0.3) });
      }
      box(uc, DOORH + 0.5, v + 0.2, 1.3, 0.36, 0.06, 0x3a2a1c, S.grain); box(uc, DOORH + 0.5, v + 0.24, 0.9, 0.05, 0.02, K.light, S.flat);   // name board
      STALLS.push({ uc, v, open });
    });
    // the porch: a low lean-to roof on posts with knee braces, a flagstone apron under it
    const pv = WG.v1 + 3.7, pe = 5.15, uA = e > 0 ? u0 + 0.6 : -u1 - 0.3, uB = e > 0 ? u1 + 0.3 : -u0 - 0.6;
    {
      const A = new THREE.Vector3().subVectors(pt(uB, pe, pv + 0.5), pt(uA, pe, pv + 0.5)).normalize(), Bv = new THREE.Vector3().subVectors(pt(uA, pe, pv + 0.5), pt(uA, WG.eave + 0.05, WG.v1)).normalize();
      face([[uA, pe, pv + 0.5], [uB, pe, pv + 0.5], [uB, WG.eave + 0.05, WG.v1], [uA, WG.eave + 0.05, WG.v1]], K.wing, S.shingle, { uA: A, vB: Bv });
      face([[uA, WG.eave - 0.2, WG.v1], [uB, WG.eave - 0.2, WG.v1], [uB, pe - 0.22, pv + 0.5], [uA, pe - 0.22, pv + 0.5]], 0x2a2018, S.board);
      box((uA + uB) / 2, pe - 0.15, pv + 0.5, uB - uA, 0.3, 0.08, K.light, S.flat);
    }
    box((uA + uB) / 2, pe - 0.42, pv, uB - uA, 0.34, 0.32, K.trim, S.grain);
    const posts = e > 0 ? [u0 + 0.75, 8.6, 12.0, u1] : [-u1, -12.0, -8.6, -u0 - 0.75];
    for (const pu of posts) {
      const g0 = gy(pu, pv);
      box(pu, (g0 + pe - 0.4) / 2, pv, 0.34, pe - 0.4 - g0, 0.34, K.trim, S.grain);
      box(pu, g0 + 0.12, pv, 0.6, 0.24, 0.6, C.stone, S.stone);
      for (const s2 of [-1, 1]) { if ((pu + s2 * 1.2) * e < u0 || (pu + s2 * 1.2) * e > u1) continue; beam([pu, pe - 1.6, pv], [pu + s2 * 1.2, pe - 0.5, pv], 0.18, 0.2, K.trim); }
      beam([pu, pe - 1.7, pv], [pu, pe - 0.4, WG.v1 + 0.2], 0.16, 0.18, K.trim);
    }
    box((uA + uB) / 2, 0.06, (WG.v1 + pv + 0.3) / 2, uB - uA, 0.16 + 0.2, pv + 0.3 - WG.v1, 0x857f74, S.stone, { skip: ['-y'] });
    // two lanterns hanging from the porch beam
    for (const uu of [8.6, 12.0]) lantern(e * uu, pe - 1.45, pv, true);
  }
  // water buckets, a pitchfork against the wall, a wheelbarrow of hay in front of the stalls
  for (const [u, v] of [[-8.6, 5.2], [12.0, 5.2]]) { cyl(u, 0.25, v, 0.34, 0.28, 0.62, 10, 0x5b4636, S.grain, { bottom: true }); cyl(u, 0.82, v, 0.31, 0.31, 0.02, 10, C.water, S.water, { top: true }); }
  beam([4.4, 0.25, 4.95], [4.75, 3.9, 4.85], 0.08, 0.08, 0x8a6a48); for (const k of [-1, 0, 1]) beam([4.75 + k * 0.1, 3.9, 4.85], [4.8 + k * 0.16, 4.7, 4.8], 0.04, 0.04, C.iron, S.metal);
  {
    const u = 15.6, v = 8.2, yaw = 0.6;
    const W2 = (du, dv) => [u + Math.cos(yaw) * du + Math.sin(yaw) * dv, v - Math.sin(yaw) * du + Math.cos(yaw) * dv];
    const [a, b] = W2(0, 0); box(a, 1.05, b, 1.4, 0.6, 1.9, 0x6a4f38, S.board, { yaw }); { const [c2, d2] = W2(0, 0.1); box(c2, 1.42, d2, 1.3, 0.45, 1.7, C.hay, S.straw, { yaw }); }
    { const [c2, d2] = W2(0, 1.25); cyl(c2, 0.45, d2, 0.45, 0.45, 0.14, 12, 0x3a2c22, S.grain, { yaw, roll: Math.PI / 2 }); }
    for (const s2 of [-1, 1]) { const [p, q] = W2(s2 * 0.55, -0.9), [p2, q2] = W2(s2 * 0.6, -2.0); beam([p, 0.85, q], [p2, 1.15, q2], 0.1, 0.1, 0x5a3f2a); const [p3, q3] = W2(s2 * 0.5, -0.4); beam([p3, 0.75, q3], [p3, 0.05, q3], 0.08, 0.08, 0x5a3f2a); }
  }

  // ================================================================ THE YARD
  // hitching rail (the groom's grey stands here), mounting block, a low stone water trough (a horse drinks), a hay pile (the black eats)
  const RAIL = { u: -9.5, v: 13.2 };
  for (const du of [-2.6, 2.6]) { const g0 = gy(RAIL.u + du, RAIL.v); box(RAIL.u + du, g0 + 1.2, RAIL.v, 0.32, 2.4, 0.32, K.trim, S.grain); pyramid(RAIL.u + du, g0 + 2.4, RAIL.v, 0.36, 0.2, K.trim, S.grain); }
  beam([RAIL.u - 2.9, gy(RAIL.u, RAIL.v) + 2.15, RAIL.v], [RAIL.u + 2.9, gy(RAIL.u, RAIL.v) + 2.15, RAIL.v], 0.2, 0.2, 0x7a5a3c);
  for (const du of [-1.2, 1.4]) { cyl(RAIL.u + du, gy(RAIL.u, RAIL.v) + 2.0, RAIL.v + 0.12, 0.09, 0.09, 0.04, 8, C.iron, S.metal, { pitch: Math.PI / 2 }); }
  { const u = -14.6, v = 11.4, g0 = gy(u, v); box(u, g0 + 0.32, v, 1.8, 0.64, 1.4, C.stone, S.stone); box(u + 0.5, g0 + 0.8, v, 0.8, 0.4, 1.4, C.stone, S.stone); }
  const TROUGH = { u: 8.8, v: 12.6, yaw: 0.0 };
  { const { u, v } = TROUGH, g0 = gy(u, v); box(u, g0 + 0.3, v, 3.8, 0.75, 1.3, C.stone, S.stone, { skip: ['+y'] }); for (const [du, dv, su, sv] of [[0, 0.55, 3.8, 0.2], [0, -0.55, 3.8, 0.2], [1.8, 0, 0.2, 1.3], [-1.8, 0, 0.2, 1.3]]) box(u + du, g0 + 0.7, v + dv, su, 0.06, sv, C.stoneL, S.stone); box(u, g0 + 0.58, v, 3.4, 0.04, 0.9, C.water, S.water, { skip: ['-y'] });
    // the hand pump at its end
    const pu = u + 2.3, g1 = gy(pu, v); box(pu, g1 + 1.05, v, 0.32, 2.1, 0.32, 0x4a5058, S.metal); box(pu - 0.35, g1 + 1.75, v, 0.6, 0.12, 0.12, 0x4a5058, S.metal, { roll: -0.3 }); beam([pu, g1 + 2.1, v], [pu + 0.9, g1 + 2.55, v], 0.07, 0.07, 0x4a5058, S.metal); }
  const HAYPILE = { u: 13.6, v: 16.8 };
  { const { u, v } = HAYPILE, g0 = gy(u, v); cyl(u, g0 - 0.05, v, 1.5, 0.5, 0.55, 9, C.hay, S.straw, { top: true }); cyl(u + 0.5, g0 - 0.05, v - 0.4, 0.9, 0.3, 0.42, 7, 0xc2a868, S.straw, { top: true }); }
  // a few square bales by the stable's left end and a stack at the right end (under the tack lean-to)
  const bale = (u, y, v, yaw = 0, hex = C.hay) => {
    box(u, y + 0.38, v, 1.7, 0.76, 0.86, hex, S.straw, { yaw });
    for (const s2 of [-0.42, 0.42]) box(u + Math.cos(yaw) * s2, y + 0.38, v - Math.sin(yaw) * s2, 0.06, 0.79, 0.88, 0x7a6640, S.flat, { yaw });      // the two twines
  };
  {
    const u0 = -17.3, v0 = -1.0;
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4 - r; k++) bale(u0 - 0.9 - (r % 2) * 0.1, gy(u0, v0) + r * 0.76, v0 + k * 1.0 - 1.3 + r * 0.5, Math.PI / 2, r % 2 ? 0xc0a35e : C.hay);
    for (const [du, dv, yaw] of [[-2.2, 3.4, 0.4], [-1.0, 4.6, 1.2]]) bale(u0 + du, gy(u0 + du, v0 + dv), v0 + dv, yaw);
    // a round bale
    cyl(u0 - 1.3, gy(u0 - 1.3, 6.6) + 0.95, 6.6, 0.95, 0.95, 1.5, 14, 0xb79c5a, S.straw, { roll: Math.PI / 2, top: true, bottom: true, topHex: 0xa38a4e, botHex: 0xa38a4e, yaw: 0.3 });
  }
  // the tack lean-to on the right end: a rail with four saddles + blankets, bridles on pegs, a stack of bales
  {
    const u = WG.u1 + 0.15, va = -4.6, vb = 2.6, pe = 4.2, out = 2.8;
    face([[u + out, pe, vb + 0.3], [u + out, pe, va - 0.3], [u, 5.6, va - 0.3], [u, 5.6, vb + 0.3]], K.wing, S.shingle, { uA: new THREE.Vector3().subVectors(pt(u + out, pe, va - 0.3), pt(u + out, pe, vb + 0.3)).normalize(), vB: new THREE.Vector3().subVectors(pt(u + out, pe, vb), pt(u, 5.6, vb)).normalize() });
    face([[u, 5.4, vb + 0.3], [u, 5.4, va - 0.3], [u + out, pe - 0.2, va - 0.3], [u + out, pe - 0.2, vb + 0.3]], 0x2a2018, S.board);
    for (const v of [va, vb]) { const g0 = gy(u + out - 0.2, v); box(u + out - 0.2, (g0 + pe) / 2, v, 0.3, pe - g0, 0.3, K.trim, S.grain); }
    box(u + out - 0.2, pe - 0.1, (va + vb) / 2, 0.3, 0.3, vb - va + 0.6, K.trim, S.grain);
    const ry2 = 1.0;                                        // saddle rail
    beam([u + 1.0, 2.15, va + 0.4], [u + 1.0, 2.15, vb - 0.4], 0.22, 0.22, 0x6b4a30);
    for (const v of [va + 0.4, vb - 0.4]) beam([u + 1.0, 2.15, v], [u + 0.15, 2.15, v], 0.16, 0.16, 0x6b4a30);
    const saddle = (v, tone, blanket) => {
      const uu = u + 1.0, y = 2.3;
      box(uu, y - 0.05, v, 1.5, 0.08, 1.05, blanket, S.canvas, { roll: 0 }); box(uu, y - 0.5, v, 1.5, 0.9, 0.06, blanket, S.canvas, { roll: 0, yaw: 0 });
      for (const s2 of [-1, 1]) box(uu + s2 * 0.62, y - 0.35, v, 0.07, 0.75, 1.0, blanket, S.canvas);
      box(uu, y + 0.12, v, 1.25, 0.2, 0.75, tone, S.leather);                            // seat
      box(uu, y + 0.3, v - 0.42, 0.55, 0.36, 0.2, tone, S.leather, { pitch: 0.4 });         // cantle
      box(uu, y + 0.3, v + 0.42, 0.4, 0.3, 0.2, tone, S.leather, { pitch: -0.5 });          // pommel
      for (const s2 of [-1, 1]) { box(uu + s2 * 0.66, y - 0.25, v, 0.06, 0.8, 0.62, tone, S.leather); box(uu + s2 * 0.7, y - 0.95, v + 0.05, 0.04, 0.7, 0.05, 0x3a2416, S.leather); box(uu + s2 * 0.7, y - 1.36, v + 0.05, 0.08, 0.14, 0.3, 0x9aa0a8, S.metal); }
    };
    [[va + 1.0, 0x6b3e22, 0x2b4a7a], [va + 2.6, 0x4e2e1a, 0xd8d0bc], [va + 4.2, 0x6f4426, 0x7a2a30], [va + 5.8, 0x5a3520, 0x2b4a7a]].forEach(([v, t, b]) => saddle(v, t, b));
    for (const v of [va + 0.4, va + 1.8, va + 3.4]) { box(u + 0.2, 3.2, v, 0.08, 0.08, 0.3, C.iron, S.metal); box(u + 0.25, 2.65, v, 0.05, 1.0, 0.36, 0x3a2416, S.leather); }
    bale(u + 2.0, gy(u + 2.0, va - 2.0), va - 2.0, 0.1); bale(u + 2.1, gy(u + 2.0, va - 2.0) + 0.76, va - 2.0, -0.1);
  }

  // ================================================================ THE ROUND PEN (trainer + lunging horse: life.js)
  const PEN = { u: -24.0, v: 17.5, r: 9.6 };
  {
    const { u, v, r } = PEN, g0 = gy(u, v) + 0.1, N = 30;
    cyl(u, g0 - 1.6, v, r - 0.15, r - 0.15, 1.6, 36, C.sand, S.sand, { top: true, vWorld: true });
    cyl(u, g0 - 0.2, v, 7.0, 7.0, 0.26, 36, 0x9c835e, S.sand, { top: true });   // the worn lunging track
    cyl(u, g0 - 0.2, v, 5.5, 5.5, 0.32, 36, C.sand, S.sand, { top: true });
    const gateA = Math.atan2(TROUGH.v - v, TROUGH.u - u);       // the gate faces the yard
    const posts = [];
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2; let da = Math.atan2(Math.sin(a - gateA), Math.cos(a - gateA));
      const pu = u + Math.cos(a) * r, pv = v + Math.sin(a) * r, gg = gy(pu, pv), h = 2.45 + (R() - 0.5) * 0.12;
      box(pu, gg + h / 2 - 0.3, pv, 0.3, h + 0.6, 0.3, k % 3 ? 0x6b5442 : 0x5e4a3a, S.grain, { pitch: (R() - 0.5) * 0.05, roll: (R() - 0.5) * 0.05 });
      posts.push([pu, pv, gg, Math.abs(da) < 0.13]);
    }
    for (let k = 0; k < N; k++) {
      const [a1, b1, g1, gate1] = posts[k], [a2, b2, g2, gate2] = posts[(k + 1) % N];
      if (gate1 && gate2) continue;
      for (const yy of [0.75, 1.45, 2.1]) beam([a1, g1 + yy, b1], [a2, g2 + yy, b2], 0.1, 0.24, (k + (yy > 1 ? 1 : 0)) % 2 ? 0x8a7056 : 0x7d6550, S.grain, { ext: 0.25 });
    }
    // the gate, swung open
    const gk = posts.findIndex((p) => p[3]); if (gk >= 0) { const [a1, b1, g1] = posts[gk]; const ang = gateA + 0.9; for (const yy of [0.6, 1.2, 1.8]) beam([a1, g1 + yy, b1], [a1 + Math.cos(ang) * 2.9, g1 + yy, b1 + Math.sin(ang) * 2.9], 0.08, 0.18, 0x9a8064, S.grain); beam([a1, g1 + 0.6, b1], [a1 + Math.cos(ang) * 2.9, g1 + 1.8, b1 + Math.sin(ang) * 2.9], 0.07, 0.16, 0x9a8064, S.grain); }
    // two cavaletti poles on the track
    for (const a of [2.2, 4.1]) { const pu = u + Math.cos(a) * 6.9, pv = v + Math.sin(a) * 6.9, gg = gy(pu, pv); const ta = a + Math.PI / 2; beam([pu - Math.cos(a) * 1.4, gg + 0.35, pv - Math.sin(a) * 1.4], [pu + Math.cos(a) * 1.4, gg + 0.35, pv + Math.sin(a) * 1.4], 0.18, 0.18, 0xe8e2d8, S.flat); for (const s2 of [-1.4, 1.4]) { box(pu + Math.cos(a) * s2, gg + 0.2, pv + Math.sin(a) * s2, 0.5, 0.4, 0.14, 0x6b4a30, S.grain, { yaw: -ta + ry * 0 }); } }
  }

  // ================================================================ THE HORSE-KEEPERS' CAMP (nomad style: felt yurts, a canvas tent, a fire)
  const CAMP = { u: 25.5, v: 15.0 };
  const fireU = CAMP.u, fireV = CAMP.v, fireG = gy(fireU, fireV);
  const yurt = (u, v, Rr, wallH, crown, doorTo) => {
    const g0 = Math.min(gy(u, v), gy(u + Rr, v), gy(u - Rr, v), gy(u, v + Rr), gy(u, v - Rr)), seg = 18;
    const dyaw = Math.atan2(doorTo[0] - u, doorTo[1] - v);         // local yaw of the door direction
    cyl(u, g0 - 0.4, v, Rr, Rr, wallH + 0.4, seg, C.felt, S.felt, {});
    cyl(u, g0 + wallH * 0.62, v, Rr + 0.04, Rr + 0.04, 0.34, seg, C.navy, S.canvas);                  // the woven band (navy with an ice stripe)
    cyl(u, g0 + wallH * 0.62 + 0.13, v, Rr + 0.06, Rr + 0.06, 0.08, seg, C.ice, S.flat);
    for (const yy of [0.5, wallH - 0.25]) cyl(u, g0 + yy, v, Rr + 0.05, Rr + 0.05, 0.07, seg, C.rope, S.flat);
    cyl(u, g0 + wallH, v, Rr + 0.45, 0.85, crown - wallH, seg, C.felt2, S.felt, {});                  // roof cone
    cyl(u, g0 + wallH - 0.14, v, Rr + 0.47, Rr + 0.45, 0.16, seg, C.navy2, S.canvas);                  // the valance at the eave
    cyl(u, g0 + crown - 0.05, v, 0.95, 0.95, 0.3, 12, 0x6b4a30, S.grain, { top: true, topHex: 0x2a2018 });   // the crown ring
    cyl(u + 0.25, g0 + crown + 0.2, v, 0.15, 0.15, 1.1, 8, 0x40454e, S.metal, {});                   // the stove pipe
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3; const a1 = [u + Math.cos(a) * (Rr + 0.47), g0 + wallH - 0.03, v + Math.sin(a) * (Rr + 0.47)], a2 = [u + Math.cos(a) * 0.95, g0 + crown + 0.1, v + Math.sin(a) * 0.95]; beam(a1, a2, 0.08, 0.05, C.rope, S.flat); }
    // the painted door (navy, ice ornament) with a rolled felt flap above
    const du = Math.sin(dyaw), dv = Math.cos(dyaw), uD = u + du * (Rr + 0.08), vD = v + dv * (Rr + 0.08);
    box(uD, g0 + 1.1, vD, 1.5, 2.3, 0.14, C.trim, S.grain, { yaw: dyaw });
    box(uD + du * 0.06, g0 + 1.05, vD + dv * 0.06, 1.2, 2.05, 0.06, C.navy, S.board, { yaw: dyaw });
    box(uD + du * 0.1, g0 + 1.05, vD + dv * 0.1, 0.5, 0.5, 0.03, C.ice, S.flat, { yaw: dyaw, roll: Math.PI / 4 });
    cyl(uD + du * 0.12, g0 + 2.4, vD + dv * 0.12, 0.2, 0.2, 1.7, 8, C.felt2, S.felt, { yaw: dyaw, roll: Math.PI / 2 });
    smokers.push(pt(u + 0.25, g0 + crown + 1.4, v));
  };
  const tent = (u, v, w, d, wallH, ridgeH, yaw) => {        // canvas wall tent; front (+local v) open with the flaps tied back
    const g0 = gy(u, v), c = Math.cos(yaw), s = Math.sin(yaw), L2 = (lx, lz) => [u + c * lx + s * lz, v - s * lx + c * lz];
    const P3 = (lx, ly, lz) => { const [a, b] = L2(lx, lz); return [a, g0 + ly, b]; };
    const hw = w / 2, hd = d / 2;
    // walls (back + sides), roof, back gable, open front with a dark inside
    face([P3(hw, -0.2, -hd), P3(-hw, -0.2, -hd), P3(-hw, wallH, -hd), P3(hw, wallH, -hd)], C.canvas, S.canvas);
    face([P3(-hw, -0.2, -hd), P3(-hw, -0.2, hd), P3(-hw, wallH, hd), P3(-hw, wallH, -hd)], C.canvas, S.canvas);
    face([P3(hw, -0.2, hd), P3(hw, -0.2, -hd), P3(hw, wallH, -hd), P3(hw, wallH, hd)], C.canvas, S.canvas);
    face([P3(-hw - 0.3, wallH - 0.15, -hd - 0.3), P3(-hw - 0.3, wallH - 0.15, hd + 0.3), P3(0, ridgeH, hd + 0.3), P3(0, ridgeH, -hd - 0.3)], 0xd2c8ae, S.canvas, { both: true });
    face([P3(hw + 0.3, wallH - 0.15, hd + 0.3), P3(hw + 0.3, wallH - 0.15, -hd - 0.3), P3(0, ridgeH, -hd - 0.3), P3(0, ridgeH, hd + 0.3)], 0xd2c8ae, S.canvas, { both: true });
    face([P3(hw, wallH, -hd), P3(-hw, wallH, -hd), P3(0, ridgeH, -hd)], C.canvas, S.canvas);
    face([P3(-hw, -0.05, hd - 0.05), P3(hw, -0.05, hd - 0.05), P3(hw, wallH, hd - 0.05), P3(-hw, wallH, hd - 0.05)], 0x17120e, S.flat);
    face([P3(-hw, wallH, hd - 0.05), P3(hw, wallH, hd - 0.05), P3(0, ridgeH - 0.05, hd - 0.05)], 0x17120e, S.flat);
    for (const s2 of [-1, 1]) face(s2 < 0 ? [P3(-hw, 0.0, hd), P3(-hw + 0.9, 0.2, hd + 0.5), P3(-hw + 0.7, wallH + 0.4, hd + 0.2), P3(-hw * 0.3, ridgeH - 0.4, hd)] : [P3(hw * 0.3, ridgeH - 0.4, hd), P3(hw - 0.7, wallH + 0.4, hd + 0.2), P3(hw - 0.9, 0.2, hd + 0.5), P3(hw, 0.0, hd)], 0xcbbf9f, S.canvas, { both: true });
    // ridge pole + guy ropes with pegs
    const a = P3(0, ridgeH + 0.05, -hd - 0.5), b = P3(0, ridgeH + 0.05, hd + 0.5); beam(a, b, 0.12, 0.12, 0x6b4a30);
    for (const lz of [-hd + 0.4, 0, hd - 0.4]) for (const s2 of [-1, 1]) { const p1 = P3(s2 * (hw + 0.3), wallH - 0.15, lz), p2 = P3(s2 * (hw + 2.1), 0.05, lz); p2[1] = gy(p2[0], p2[2]) + 0.05; beam(p1, p2, 0.03, 0.03, C.rope, S.flat); box(p2[0], p2[1] + 0.12, p2[2], 0.08, 0.35, 0.08, 0x6b4a30, S.grain); }
    // inside: a bedroll and a chest (seen through the open front)
    const [iu, iv] = L2(-hw * 0.4, hd * 0.2); box(iu, g0 + 0.12, iv, 1.0, 0.24, 2.4, 0x7a2a30, S.canvas, { yaw });
  };
  yurt(30.8, 9.6, 4.0, 2.9, 5.4, [fireU, fireV]);
  yurt(31.2, 21.6, 3.5, 2.7, 4.9, [fireU, fireV]);
  {   // a black tent of the steppe, the kind the nomad camps pitch (nomads.js), sized for people of this scale
    const [tx, tz] = P.W(20.4, 24.0), [fx, fz] = P.W(fireU, fireV), V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
    const ad = { tri: (a, b, c, k) => SP.face([V(a), V(b), V(c)], k, S.felt, { both: true }), quad: (a, b, c, d, k) => SP.face([V(a), V(b), V(c), V(d)], k, S.felt, { both: true }) };
    addTent(ad, { x: tx, z: tz, ry: Math.atan2(fx - tx, fz - tz), w: 6.8, d: 4.2, h: 3.4, tone: 0.1 }, height);
    const [ix, iz] = P.W(20.4 + 0.0, 24.0 + 0.0); SP.box(place(ix, height(ix, iz) + 0.18, iz, Math.atan2(fx - tx, fz - tz)), 1.2, 0.36, 0.8, 0x6b4a30, S.board);   // a chest inside
  }
  // the fire: a ring of stones, crossed logs, embers (glow), a tripod with a cauldron, log benches
  {
    const g0 = fireG;
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; box(fireU + Math.cos(a) * 1.15, g0 + 0.16, fireV + Math.sin(a) * 1.15, 0.5, 0.36, 0.42, k % 2 ? 0x7c8088 : 0x91959c, S.stone, { yaw: -a + R(), pitch: (R() - 0.5) * 0.3 }); }
    for (let k = 0; k < 4; k++) { const a = k * 0.8 + 0.3; beam([fireU - Math.cos(a) * 0.85, g0 + 0.12, fireV - Math.sin(a) * 0.85], [fireU + Math.cos(a) * 0.85, g0 + 0.3, fireV + Math.sin(a) * 0.85], 0.2, 0.2, 0x3a2a1e, S.grain); }
    cyl(fireU, g0 + 0.02, fireV, 0.75, 0.4, 0.16, 10, 0xff7a2a, S.glow, { top: true });
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + 0.5; beam([fireU + Math.cos(a) * 1.3, g0, fireV + Math.sin(a) * 1.3], [fireU, g0 + 2.6, fireV], 0.09, 0.09, 0x4a3524); }
    beam([fireU, g0 + 2.55, fireV], [fireU, g0 + 1.6, fireV], 0.03, 0.03, C.iron, S.metal);
    cyl(fireU, g0 + 0.95, fireV, 0.5, 0.42, 0.7, 12, 0x2a2c30, S.metal, { bottom: true, top: true, topHex: 0x3a2a1e });
    for (const [a, len] of [[0.6, 3.0], [2.3, 2.6], [4.0, 3.0]]) { const bu = fireU + Math.cos(a) * 2.6, bv = fireV + Math.sin(a) * 2.6, ta = a + Math.PI / 2; beam([bu - Math.cos(ta) * len / 2, gy(bu, bv) + 0.36, bv - Math.sin(ta) * len / 2], [bu + Math.cos(ta) * len / 2, gy(bu, bv) + 0.36, bv + Math.sin(ta) * len / 2], 0.56, 0.5, 0x6b5440, S.grain); }
    const w = pt(fireU, g0 + 0.5, fireV); flames.add(w.x, w.y, w.z, 2.1, [1, 0.55, 0.2]); flames.add(w.x + 0.2, w.y + 0.4, w.z - 0.1, 1.5, [1, 0.62, 0.25]);
    { const [x, z] = P.W(fireU, fireV); pools.add(x, height(x, z) + 0.08, z, 8.5, [1, 0.5, 0.18], 0.7); }
    smokers.push(pt(fireU, g0 + 1.6, fireV));
  }
  // firewood stack + chopping block, a washing line with cloths, a felt-drying frame, a cart loaded with hay, more bales, a saddle on a log
  {
    const u = 35.6, v = 12.6, g0 = gy(u, v);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6 - r; k++) cyl(u + (k - 2.5 + r * 0.5) * 0.42, g0 + 0.2 + r * 0.38, v, 0.2, 0.2, 1.6, 7, k % 2 ? 0x7a5c40 : 0x6b5038, S.grain, { pitch: Math.PI / 2, top: true, bottom: true, topHex: 0xc9a57a, botHex: 0xc9a57a });
    cyl(u - 2.2, gy(u - 2.2, v + 1.6), v + 1.6, 0.42, 0.45, 0.7, 10, 0x6b5038, S.grain, { top: true, topHex: 0xc9a57a });
    beam([u - 2.2, gy(u - 2.2, v + 1.6) + 0.72, v + 1.6], [u - 1.5, gy(u - 2.2, v + 1.6) + 1.15, v + 1.9], 0.07, 0.07, 0x8a6a48);
  }
  {
    const a = [35.0, 16.0], b = [34.6, 21.5 - 2.4];
    for (const [u, v] of [a, b]) { const g0 = gy(u, v); box(u, g0 + 1.6, v, 0.18, 3.2, 0.18, 0x6b4a30, S.grain); }
    const ga = gy(...a) + 3.0, gb = gy(...b) + 3.0; beam([a[0], ga, a[1]], [b[0], gb, b[1]], 0.03, 0.03, C.rope, S.flat);
    [[0.18, 0x2b4a7a, 0.9], [0.4, 0xe2dccd, 1.2], [0.62, 0x7a2a30, 0.8], [0.82, 0x9db6d4, 1.0]].forEach(([f, hex, h]) => {
      const u = a[0] + (b[0] - a[0]) * f, v = a[1] + (b[1] - a[1]) * f, y = ga + (gb - ga) * f - 0.05; box(u, y - h / 2, v, 0.04, h, 0.9, hex, S.canvas, { yaw: Math.atan2(b[0] - a[0], b[1] - a[1]) + Math.PI / 2, pitch: 0.06 });
    });
  }
  {   // cart (two spoked wheels, shafts resting on the ground) loaded with hay
    const u = 21.2, v = 4.2, yaw = 2.1, g0 = gy(u, v);
    const c = Math.cos(yaw), s = Math.sin(yaw), L2 = (lx, lz) => [u + c * lx + s * lz, v - s * lx + c * lz];
    const [bx, bz] = L2(0, 0); box(bx, g0 + 1.35, bz, 2.4, 0.16, 3.6, 0x7a5a3c, S.board, { yaw });
    for (const sx of [-1, 1]) { const [p, q] = L2(sx * 1.2, 0); box(p, g0 + 1.75, q, 0.12, 0.7, 3.6, 0x6b4a30, S.board, { yaw }); }
    { const [p, q] = L2(0, -1.75); box(p, g0 + 1.75, q, 2.4, 0.7, 0.12, 0x6b4a30, S.board, { yaw }); }
    { const [p, q] = L2(0, 0.1); box(p, g0 + 2.15, q, 2.2, 1.0, 3.2, C.hay, S.straw, { yaw }); }
    { const [p, q] = L2(0.1, 0.2); cyl(p, g0 + 2.55, q, 1.0, 0.6, 0.6, 9, 0xc2a868, S.straw, { top: true }); }
    for (const sx of [-1, 1]) {
      const [p, q] = L2(sx * 1.42, -0.2); cyl(p, g0 + 1.05, q, 1.05, 1.05, 0.16, 16, 0x5a4030, S.grain, { yaw: yaw + Math.PI / 2, roll: Math.PI / 2 });
      cyl(p, g0 + 1.05, q, 0.95, 0.95, 0.18, 16, 0x2a2018, S.flat, { yaw: yaw + Math.PI / 2, roll: Math.PI / 2 });
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI; const [p2, q2] = L2(sx * 1.42, -0.2); box(p2, g0 + 1.05, q2, 0.08, 1.9, 0.1, 0x6b4a30, S.grain, { yaw, pitch: a }); }
      const [h1, h2] = L2(sx * 0.7, 1.8), [h3, h4] = L2(sx * 0.6, 4.6); beam([h1, g0 + 1.25, h2], [h3, gy(h3, h4) + 0.08, h4], 0.14, 0.14, 0x6b4a30);
    }
  }
  for (const [u, v, yaw, n] of [[18.6, 12.0, 0.2, 2], [19.2, 14.0, 1.4, 1], [33.8, 26.6 - 1.2, 0.8, 2]]) for (let k = 0; k < n; k++) bale(u, gy(u, v) + k * 0.76, v, yaw + k * 0.15);
  {   // a saddle rack by the fire: a log on two crosses with a saddle and a folded blanket
    const u = 22.0, v = 9.6, g0 = gy(u, v);
    for (const dv of [-0.9, 0.9]) for (const s2 of [-1, 1]) beam([u - 0.6 * s2, g0, v + dv], [u + 0.4 * s2, g0 + 1.4, v + dv], 0.12, 0.12, 0x6b4a30);
    beam([u, g0 + 1.15, v - 1.2], [u, g0 + 1.15, v + 1.2], 0.28, 0.28, 0x7a5c40);
    box(u, g0 + 1.36, v - 0.2, 1.3, 0.08, 0.9, 0x2b4a7a, S.canvas); box(u, g0 + 1.5, v - 0.2, 1.1, 0.2, 0.7, 0x5a3520, S.leather); box(u, g0 + 1.65, v - 0.55, 0.5, 0.3, 0.18, 0x5a3520, S.leather, { pitch: 0.4 });
    for (const s2 of [-1, 1]) box(u + s2 * 0.62, g0 + 1.1, v - 0.2, 0.06, 0.7, 0.8, 0x2b4a7a, S.canvas);
  }

  // ================================================================ GROWING WITH THE LEVEL
  SP.tag(ST, 6);    // a tack room annex behind the left wing + a second hay stack
  {
    const u0 = -15.4, u1 = -9.0, v0 = -12.6, v1 = -6.0, eave = 4.6, rid = 6.8;
    box((u0 + u1) / 2, FOOT / 2 - 1.6, (v0 + v1) / 2, u1 - u0 + 0.4, FOOT + 3.2, v1 - v0 + 0.4, C.stone, S.stone);
    box((u0 + u1) / 2, (Y1 + eave) / 2, (v0 + v1) / 2, u1 - u0, eave - Y1, v1 - v0, K.wall, S.board);
    roof(u0, u1, v0, v1, eave, rid, true, 0.6);
    for (const e of [-1, 1]) face(e > 0 ? [[u1 + 0.02, eave, v1], [u1 + 0.02, eave, v0], [u1 + 0.02, rid, (v0 + v1) / 2]] : [[u0 - 0.02, eave, v0], [u0 - 0.02, eave, v1], [u0 - 0.02, rid, (v0 + v1) / 2]], K.wall, S.board);
    box(u1 + 0.05, 2.6, (v0 + v1) / 2, 0.12, 3.2, 1.5, K.door, S.board); box(u1 + 0.1, 4.4, (v0 + v1) / 2, 0.14, 0.2, 1.9, K.light, S.flat);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) bale(-18.2, gy(-18.2, -9) + r * 0.76, -10.5 + k * 1.0 + r * 0.4, Math.PI / 2, r ? 0xc0a35e : C.hay);
  }
  SP.tag(ST, 8);    // the gilded vane + pennants on the hay barn
  {
    const v = -0.6, b = HB.ridge - 0.9;
    const hv = (du, dy, dv, sx, sy, roll = 0) => box(du, b + 5.85 + dy, v + dv, 0.08, sy + 0.04, sx + 0.04, C.gold, S.metal, { pitch: roll });
    hv(0, 0, 0, 1.1, 0.42); hv(0, 0.32, 0.62, 0.55, 0.22, -0.9); hv(0, 0.55, 0.85, 0.42, 0.2, -0.2);
    for (let k = 0; k < 3; k++) { box(0, b + 6.05 + k * 0.12, v - 0.2 + k * 0.18, 0.09, 0.08, 1.2 - k * 0.3, C.gold, S.metal, { pitch: 0.5 + k * 0.2 }); }   // wings
    for (const e of [-1, 1]) { const u = e * (WG.u1 + 0.5); box(u, 9.0, -0.7, 0.14, 4.8, 0.14, 0x6b4a30, S.grain); box(u, 10.6, -0.7 + 0.8, 0.04, 1.0, 1.5, C.navy, S.canvas); box(u, 10.6, -0.7 + 0.8, 0.05, 0.16, 1.5, C.ice, S.flat); }
  }
  SP.tag(ST, 12);   // a third yurt, flower boxes under the stall windows, a stone mounting block with the crest
  tent(36.4, 26.8, 4.2, 5.2, 2.1, 3.8, Math.atan2(fireU - 36.4, fireV - 26.8));
  for (const e of [-1, 1]) for (const uu of [6.9, 10.3, 13.7]) { box(e * uu, 3.75, WG.v0 - 0.45, 1.2, 0.3, 0.4, 0x5a3f2a, S.board); for (let k = 0; k < 4; k++) box(e * uu - 0.45 + k * 0.3, 4.0, WG.v0 - 0.45, 0.24, 0.24, 0.26, [0x9db6d4, 0xe8eef6, 0x7aa0cc, 0xc8d6ee][k], S.flat); }
  SP.tag(ST, 16);   // the aerie: a stone tower for the winged horses with an open platform and a slate cap
  {
    const u = -23.0, v = -4.5, r = 3.2;
    cyl(u, -2, v, r + 0.3, r + 0.3, 3.2, 16, C.stone, S.stone, { vWorld: true });
    cyl(u, 1.2, v, r, r * 0.9, 12.5, 16, 0x9a9ea6, S.stone, { vWorld: true });
    cyl(u, 13.7, v, r + 1.6, r + 1.6, 0.6, 18, C.stoneL, S.stone, { top: true, bottom: true, vWorld: true });
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; box(u + Math.cos(a) * (r + 1.3), 15.3, v + Math.sin(a) * (r + 1.3), 0.3, 2.6, 0.3, C.trim, S.grain); }
    cyl(u, 16.6, v, r + 2.0, 0.2, 4.6, 12, 0x4f5866, S.shingle, {});
    cyl(u, 21.2, v, 0.07, 0.07, 3.0, 6, C.iron, S.metal); box(u, 23.4, v + 0.6, 0.04, 0.9, 1.3, 0xeaf2ff, S.canvas);
    for (const yy of [5.5, 9.5]) box(u + r * 0.93, yy, v, 0.12, 1.4, 0.8, C.dark, S.flat, { yaw: 0 });
  }
  SP.tag(ST, 20);   // royal: ice-crystal finials on the ridges, blue banners on the porch posts
  {
    for (const [u, y, v] of [[0, HB.ridge + 0.3, HB.v1 + 0.9], [0, HB.ridge + 0.3, HB.v0 - 0.9], [-WG.u1 - 0.5, WG.ridge + 0.3, -0.7], [WG.u1 + 0.5, WG.ridge + 0.3, -0.7]]) cyl(u, y, v, 0.32, 0.0, 1.5, 6, 0xbfe4ff, S.glow);
    for (const e of [-1, 1]) for (const uu of [8.6, 12.0]) { box(e * uu, 3.2, WG.v1 + 3.95, 1.0, 2.2, 0.05, C.navy, S.canvas); box(e * uu, 3.2, WG.v1 + 3.98, 0.3, 1.6, 0.04, 0x9db6d4, S.flat); }
  }
  SP.tag(ST, 1);

  // ================================================================ THE PASTURE FENCE (belongs to the pasture: always there)
  SP.tag(0, 0); const bidS = SP.bid; SP.bid = 0;
  const PA = L.PASTURE, FR = PA.r + 2;
  const fenceAng = (x, z) => Math.atan2(z - PA.z, x - PA.x);
  const [sx0, sz0] = P.W(0, 12), gateA = fenceAng(sx0, sz0), gateB = Math.atan2(196 - PA.z, 84 - PA.x);
  const GATES = [gateA, gateB];
  {
    const n = Math.round((Math.PI * 2 * FR) / 3.3), post = [];
    const wpt = (a, r = FR) => { const x = PA.x + Math.cos(a) * r, z = PA.z + Math.sin(a) * r; return [x, z]; };
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + 0.013 * Math.sin(k * 2.7);
      let gate = 0; for (const g of GATES) if (Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g))) < 0.07) gate = 1;
      const [x, z] = wpt(a), h = 2.35 + (R() - 0.5) * 0.18, tone = R() < 0.3 ? C.fence2 : C.fence, gg = height(x, z);
      SP.box(place(x, gg + h / 2 - 0.35, z, -a + R() * 0.6, (R() - 0.5) * 0.06, (R() - 0.5) * 0.06), 0.3, h + 0.7, 0.3, tone, S.grain);
      post.push({ a, x, z, gg, h, gate });
    }
    for (let k = 0; k < n; k++) {
      const p = post[k], q = post[(k + 1) % n];
      if (p.gate && q.gate) continue;
      for (const [yy, th] of [[0.8, 0.2], [1.5, 0.2], [2.12, 0.22]]) {
        const A = new THREE.Vector3(p.x, p.gg + yy + (R() - 0.5) * 0.06, p.z), B = new THREE.Vector3(q.x, q.gg + yy + (R() - 0.5) * 0.06, q.z);
        const d = new THREE.Vector3().subVectors(B, A), mid = A.clone().addScaledVector(d, 0.5), qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.clone().normalize());
        qq.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), (R() - 0.5) * 0.15));
        SP.box(new THREE.Matrix4().compose(mid, qq, new THREE.Vector3(1, 1, 1)), d.length() + 0.35, th, 0.11, R() < 0.5 ? 0x93806b : 0x857360, S.grain);
      }
    }
    // the gates: two stout posts and a five-bar gate with a diagonal brace, swung open into the pasture
    for (const g of GATES) {
      const ks = post.map((p, i) => [p, i]).filter(([p]) => p.gate); if (ks.length < 2) continue;
      const near = ks.filter(([p]) => Math.abs(Math.atan2(Math.sin(p.a - g), Math.cos(p.a - g))) < 0.07); if (near.length < 2) continue;
      const p0 = near[0][0], p1 = near[near.length - 1][0];
      for (const p of [p0, p1]) SP.box(place(p.x, p.gg + 1.3, p.z, -p.a), 0.46, 3.2, 0.46, C.fence2, S.grain);
      const swing = g === gateA ? 1.1 : -0.9, [hx, hz] = [p0.x, p0.z], gw = Math.hypot(p1.x - p0.x, p1.z - p0.z) - 0.4;
      const dir = Math.atan2(p1.z - p0.z, p1.x - p0.x) + swing, ex = hx + Math.cos(dir) * gw, ez = hz + Math.sin(dir) * gw;
      const gg = p0.gg;
      for (const yy of [0.6, 1.0, 1.4, 1.8, 2.2]) { const A = new THREE.Vector3(hx, gg + yy, hz), B = new THREE.Vector3(ex, gg + yy, ez), d = new THREE.Vector3().subVectors(B, A); SP.box(new THREE.Matrix4().compose(A.clone().addScaledVector(d, 0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.clone().normalize()), new THREE.Vector3(1, 1, 1)), d.length(), 0.15, 0.08, 0xb0a08a, S.grain); }
      { const A = new THREE.Vector3(hx, gg + 0.6, hz), B = new THREE.Vector3(ex, gg + 2.2, ez), d = new THREE.Vector3().subVectors(B, A); SP.box(new THREE.Matrix4().compose(A.clone().addScaledVector(d, 0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.clone().normalize()), new THREE.Vector3(1, 1, 1)), d.length(), 0.14, 0.08, 0xb0a08a, S.grain); }
      SP.box(place(ex, gg + 1.4, ez, 0), 0.14, 1.8, 0.14, 0xb0a08a, S.grain);
    }
  }
  // inside the pasture: a long wooden water trough by the fence and a hay rack for the cattle
  const PTROUGH = (() => { const a = gateA + 0.55, r = FR - 3.2; return { x: PA.x + Math.cos(a) * r, z: PA.z + Math.sin(a) * r, yaw: -a }; })();
  {
    const { x, z, yaw } = PTROUGH, g0 = height(x, z);
    SP.box(place(x, g0 + 0.32, z, yaw), 1.1, 0.64, 4.0, 0x6b5440, S.board, { skip: ['+y'] });
    SP.box(place(x, g0 + 0.52, z, yaw), 0.86, 0.04, 3.8, C.water, S.water, { skip: ['-y'] });
    for (const s2 of [-1.7, 1.7]) { const px = x + Math.sin(yaw) * s2, pz = z + Math.cos(yaw) * s2; SP.box(place(px, g0 + 0.2, pz, yaw), 1.3, 0.4, 0.2, 0x4a3a2c, S.grain); }
  }
  const PRACK = (() => { const a = gateA - 1.9, r = FR - 4.5; return { x: PA.x + Math.cos(a) * r, z: PA.z + Math.sin(a) * r, yaw: -a }; })();
  {
    const { x, z, yaw } = PRACK, g0 = height(x, z), c = Math.cos(yaw), s = Math.sin(yaw), Lw = (lx, lz) => [x + c * lx + s * lz, z - s * lx + c * lz];
    for (const lz of [-1.4, 1.4]) for (const lx of [-0.8, 0.8]) { const [px, pz] = Lw(lx, lz); SP.box(place(px, g0 + 1.2, pz, yaw, 0, lx > 0 ? -0.18 : 0.18), 0.16, 2.6, 0.16, 0x6b5440, S.grain); }
    { const [px, pz] = Lw(0, 0); SP.box(place(px, g0 + 1.45, pz, yaw), 1.5, 1.4, 2.9, C.hay, S.straw); SP.box(place(px, g0 + 2.55, pz, yaw), 0.16, 0.16, 3.2, 0x6b5440, S.grain); }
    for (let k = -3; k <= 3; k++) for (const lx of [-0.82, 0.82]) { const [px, pz] = Lw(lx, k * 0.42); SP.box(place(px, g0 + 1.6, pz, yaw, 0, lx > 0 ? -0.18 : 0.18), 0.05, 1.7, 0.05, 0x5a4636, S.grain); }
    SP.box(place(x, g0 + 0.3, z, yaw), 2.4, 0.08, 3.4, 0xb59c5c, S.straw);
  }
  SP.bid = bidS; SP.tag(ST, 1);

  // ---- the mesh, the night glow, the smoke
  const night = { get value() { const w = M && M.window; return w ? Math.max(0, Math.min(1, (w.emissiveIntensity - 0.15) / 2.1)) : 0; } };
  const mesh = estateMesh(SP, night, { shadows: !!(Q && Q.shadows) });
  scene.add(mesh);
  const fxg = new THREE.Group(); fxg.name = 'stable-fx'; scene.add(fxg);
  flames.build(fxg, M.glow); pools.build(fxg, M.glow);
  if (flames.points) { flames.points.geometry.computeBoundingSphere(); flames.points.geometry.boundingSphere.radius += 3; flames.points.frustumCulled = true; }   // (the flames of the estate only draw when it is on screen)
  if (ctx.live) ctx.live(fxg);                                  // (the battle hides the lanterns and the fire with the stable when it falls)
  const sm = smokers.map((p, i) => { const s = ctx.smokeAt(p.x, p.y, p.z, i === smokers.length - 1); s.off = true; return s; });
  Object.assign(STABLE_FX, {
    flames, pools, smokers: sm, group: fxg, mesh,
    update(t, n, show) { fxg.visible = show; for (const s of sm) s.off = !show; if (!show) return; flames.update(t); pools.update(t); flames.setNight(Math.max(0.35, n)); pools.setNight(n); },
  });
  if (typeof window !== 'undefined') window.__pasFX = STABLE_FX;     // (dev / perf probes)
  // where life.js puts everyone (world coordinates)
  const WP = (u, v) => { const [x, z] = P.W(u, v); return { x, z, y: height(x, z) }; };
  Object.assign(SPOTS, {
    ready: true, ry, W: P.W, y0, floor: y0, models: (A && A.models) || null,     // (the peasants + their clips for the yard crowd)
    stalls: STALLS.filter((s) => s.open).map((s) => ({ ...WP(s.uc, s.v), u: s.uc, v: s.v, yaw: ry })),
    rail: { ...WP(RAIL.u, RAIL.v), yaw: ry + Math.PI }, stallY: y0 + Y1 + 0.02,
    trough: { ...WP(TROUGH.u, TROUGH.v), yaw: ry }, hay: { ...WP(HAYPILE.u, HAYPILE.v) },
    pen: { ...WP(PEN.u, PEN.v), r: PEN.r, floor: gy(PEN.u, PEN.v) + y0 + 0.1 },
    fire: { ...WP(fireU, fireV) }, camp: { ...WP(CAMP.u, CAMP.v) },
    door: WP(0, HB.v1 + 2.0), gate: (() => { const x = PA.x + Math.cos(gateA) * FR, z = PA.z + Math.sin(gateA) * FR; return { x, z, y: height(x, z), a: gateA }; })(),
    gates: GATES, pTrough: PTROUGH, pRack: PRACK, fenceR: FR,
    stackL: WP(-17.3, 2.6), stackR: WP(19.4, 12.5), porch: WP(10.3, 7.4), wash: WP(34.0, 17.5), cart: WP(21.2, 4.2), rack: WP(22.0, 9.6),
    yurtA: WP(30.8, 9.6), yurtB: WP(31.2, 21.6), tent: WP(20.2, 23.4), wood: WP(35.6, 12.6),
  });
  return { mesh, tris: SP.tris };
}
