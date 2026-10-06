// Courtyard life: houses, barracks, forge, treasury, camp, towers, the Blue
// Crystal, windmill, fences and props. Static parts are batched.
import * as THREE from 'three';
import * as L from './layout.js';
import { mat4, gableRoof, gableWall } from './util.js';
import { rng } from './noise.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s);

export function buildBuildings(ctx) {
  const { B, M, height } = ctx, r = rng(2026);
  const put = (geo, mat, m, o) => B.add(geo, mat, m, o);
  const box = (mat, x, y, z, ry, sx, sy, sz, o = {}) => put(BOX, mat, mat4(x, y, z, ry, sx, sy, sz), o);
  const local = (x0, z0, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x0 + lx * c + lz * s, z0 - lx * s + lz * c]; };

  // ------------------------------------------------ real kit houses (Village MegaKit, baked later)
  const KS = 1.4;                                  // kit scale (people are scaled up too)
  function house(x, z, ry, nx, nz, floors, opts = {}) {
    const P = local(x, z, ry), y0 = opts.y0 ?? height(x, z);
    const W = nx * 2 * KS, D = nz * 2 * KS;
    // stone plinth so slopes never show a gap under the walls
    box(M.stoneDark, x, y0 - 0.55, z, ry, W + 0.5, 1.5, D + 0.5, { worldUV: 0.12, tint: 0x9a9da5 });
    ctx.houses.push({ x, y: y0 + 0.18, z, rot: ry, nx, nz, floors, scale: KS, seed: opts.seed ?? ((x * 31 + z * 17) | 0),
      lower: opts.lower, upper: opts.upper ?? 'grid', chimney: opts.chimney, vine: opts.vine ?? r() < 0.4 });
    ctx.pick({ x, z, y0: 0, y1: y0 + floors * 3 * KS + 5, r: Math.max(W, D) / 2 + 0.5 }, opts.id || 'house');
    return { P, W, D, top: y0 + floors * 3 * KS };
  }

  // ------------------------------------------------ houses around the plaza
  // [x, z, rot, nx, nz, floors]
  const homes = [[2, 33, 0.15 + Math.PI, 2, 3, 2], [15, 39, -0.25 + Math.PI, 2, 2, 1], [-12, 37, 0.1 + Math.PI, 3, 3, 2], [25, 28, -0.6 + Math.PI, 2, 2, 2],
    [-28, 31, 0.35 + Math.PI, 2, 3, 1], [-41, 22, 0.55 + Math.PI, 2, 2, 2], [-6, 17, -0.2 + Math.PI, 2, 2, 1]];
  homes.forEach(([x, z, ry, nx, nz, fl], i) => house(x, z, ry, nx, nz, fl, { lower: i % 3 === 2 ? 'plaster' : 'brick' }));

  // barracks (long hall + banners)
  {
    const x = 30, z = -24, ry = L.GATE.rot - Math.PI / 2 + 0.05;
    const h = house(x, z, ry - Math.PI / 2, 3, 5, 2, { id: 'barracks', lower: 'brick', upper: 'plaster' });
    const P = local(x, z, ry), hw = h.W / 2;
    for (const lx of [-4.5, 4.5]) { const [px, pz] = P(lx, hw + 0.25); ctx.banner(px, 6.6, pz, ry, 1.6, 3.4); }
    for (let k = 0; k < 3; k++) { const [px, pz] = P(-5 + k * 5, hw + 2.6); rack(px, pz, ry); }
  }
  function rack(x, z, ry) {
    box(M.wood, x, 0.9, z, ry, 2.6, 0.2, 0.3, { tint: 0x7a5a3a });
    for (let k = -1; k <= 1; k++) { const c = Math.cos(ry), s = Math.sin(ry); box(M.metal, x + k * 0.8 * c, 1.3, z - k * 0.8 * s, ry, 0.08, 2.4, 0.08); }
  }

  // forge (open smithy, glowing hearth)
  {
    const x = 40, z = -6, ry = -0.9, P = local(x, z, ry), y0 = 0.15;
    box(M.stoneDark, x, y0 + 0.3, z, ry, 8.5, 0.6, 6.5, { worldUV: 0.15, tint: 0xb0b3bb });
    for (const [lx, lz] of [[-3.8, -2.8], [3.8, -2.8], [-3.8, 2.8], [3.8, 2.8]]) { const [px, pz] = P(lx, lz); box(M.wood, px, y0 + 2.4, pz, ry, 0.5, 4.8, 0.5, { tint: 0x6b4a30 }); }
    put(gableRoof(8, 6, 2.6, 0.6), M.roof, mat4(x, y0 + 4.8, z, ry), { tint: 0x5a4a3e, uvScale: [1.2, 1.2] });
    const [hx, hz] = P(-2, -1.6);
    box(M.stoneDark, hx, y0 + 1, hz, ry, 3, 2, 2.2, { worldUV: 0.3, tint: 0x8a8580 });
    box(M.stoneDark, hx, y0 + 3.4, hz, ry, 1.4, 3, 1.4, { worldUV: 0.3, tint: 0x7a7570 });
    ctx.torch(hx, y0 + 2.3, hz, { pool: true, light: true, forge: true });
    ctx.smokeAt(hx, y0 + 5.2, hz, true);
    const [ax, az] = P(1.6, 0.8);
    box(M.wood, ax, y0 + 0.6, az, ry, 1, 1.2, 1, { tint: 0x5a3a22 });
    box(M.metal, ax, y0 + 1.35, az, ry, 1.5, 0.35, 0.6);
    ctx.pick({ x, z, y0: 0, y1: 8, r: 5 }, 'forge');
  }

  // treasury (gold) — small vault with open chests
  {
    const x = -32, z = 12, ry = 0.5;
    const h = house(x, z, ry, 2, 2, 2, { chimney: false, lower: 'brick', id: 'treasury' }), P = h.P, hd = h.D / 2;
    for (const [lx, lz] of [[-2.2, hd + 1.4], [0.2, hd + 1.8], [2.5, hd + 1.2]]) {
      const [px, pz] = P(lx, lz);
      box(M.wood, px, 0.65, pz, ry, 1.5, 1, 1, { tint: 0x7a5230 });
      put(new THREE.SphereGeometry(0.75, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.gold, mat4(px, 1.12, pz, 0, 1, 0.55, 0.9));
    }
    const [gx, gz] = P(0, hd + 1.5); ctx.pool(gx, 0.2, gz, 4, [1, 0.8, 0.35], 0.35);
  }

  // lumber yard
  {
    const x = -46, z = 4, ry = 0.9;
    const P = local(x, z, ry);
    for (let k = 0; k < 3; k++) for (let j = 0; j < 4 - k; j++) {
      const [px, pz] = P(-2 + j * 1.25 + k * 0.62, 0);
      put(CYL(0.6, 0.6, 6, 9), M.wood, mat4(px, 0.75 + k * 1.05, pz, ry, 1, 1, 1, 0, Math.PI / 2), { tint: 0x9a7048 });
    }
    const [sx, sz] = P(0, 3.5); box(M.wood, sx, 0.9, sz, ry, 4, 0.25, 1.2, { tint: 0x8a6a48 });
    ctx.pick({ x, z, y0: 0, y1: 5, r: 4.5 }, 'lumber');
  }

  // army camp (tents) near the barracks
  const tents = [[10, -40, 0.3], [18, -44, -0.2], [26, -38, 0.6], [4, -46, 0.1]];
  for (const [x, z, ry] of tents) {
    ctx.hex('tent', x, height(x, z), z, ry, 11);
    ctx.flagSmall(x, 6.2, z, ry);
    ctx.pick({ x, z, y0: 0, y1: 6, r: 3 }, 'camp');
  }
  for (const [x, z, ry] of [[12, -41, 0.4], [21, -40, 1.2], [7, -37, 2.2]]) ctx.hex('resource_lumber', x, height(x, z), z, ry, 6);
  for (const [x, z] of [[14, -45], [24, -43]]) ctx.inst('weaponstand', x, z, Math.random() * 6.28, 1.6);
  // campfire
  { const x = 16, z = -36; for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28; box(M.stoneDark, x + Math.cos(a) * 1.1, 0.3, z + Math.sin(a) * 1.1, a, 0.6, 0.5, 0.5, { tint: 0x77736e }); } ctx.torch(x, 0.8, z, { pool: true, light: false, big: true }); ctx.smokeAt(x, 2.2, z); }

  // wooden archer towers
  for (const [x, z] of [[-2, 8], [46, 30], [-50, -8]]) {
    for (const [dx, dz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) box(M.wood, x + dx, 4, z + dz, 0.3, 0.35, 8, 0.35, { tint: 0x7a5a3a });
    box(M.wood, x, 8.1, z, 0.3, 3.6, 0.35, 3.6, { tint: 0x8a6a48 });
    for (const e of [-1, 1]) { box(M.wood, x + e * 1.7, 8.8, z, 0.3, 0.2, 1.1, 3.6, { tint: 0x6b4a30 }); box(M.wood, x, 8.8, z + e * 1.7, 0.3, 3.6, 1.1, 0.2, { tint: 0x6b4a30 }); }
    put(new THREE.ConeGeometry(2.9, 2.4, 4, 1, true), M.roof, mat4(x, 10.9, z, 0.3 + Math.PI / 4), { tint: 0x8e3b2e, uvScale: [3, 2] });
    ctx.torch(x + 1.3, 9.8, z + 1.3, { pool: false });
    ctx.pick({ x, z, y0: 0, y1: 12, r: 2.5 }, 'archer');
  }

  // training yard dummies
  for (const [x, z] of [[20, -12], [23, -9], [17, -8]]) {
    box(M.wood, x, 1.2, z, 0, 0.25, 2.4, 0.25, { tint: 0x7a5a3a });
    box(M.wood, x, 1.9, z, 0, 1.6, 0.22, 0.22, { tint: 0x7a5a3a });
    put(new THREE.SphereGeometry(0.42, 8, 6), M.plaster, mat4(x, 2.6, z), { tint: 0xc8b890 });
    put(CYL(0.45, 0.5, 1.1, 8), M.plaster, mat4(x, 1.6, z), { tint: 0xb8a878 });
  }
  ctx.pick({ x: 20, z: -10, y0: 0, y1: 3, r: 4 }, 'training');

  // well
  { const x = 0, z = 22; ctx.hex('building_well_blue', x, 0.15, z, 0.4, 5.2); ctx.hex('bucket_water', x + 2.2, 0.15, z + 1, 0, 6); ctx.pick({ x, z, y0: 0, y1: 5, r: 2.2 }, 'well'); }
  // a second well by the farmstead
  { const F = L.FIELDS, x = F.x + F.w / 2 + 10, z = F.z - 14; ctx.hex('building_well_blue', x, height(x, z), z, 1.2, 5.2); }

  // barrels, crates, hay
  const props = [[36, 14], [30, 20], [-18, 22], [-36, 30], [6, -30], [44, 4], [-22, 40], [8, 44]];
  for (const [x, z] of props) {
    const t = r();
    if (t < 0.4) for (let k = 0; k < 3; k++) ctx.inst('barrel', x + (k % 2) * 1.3, z + (k >> 1) * 1.3, r() * 6.28, 1.5);
    else if (t < 0.75) { ctx.inst('crate', x, z, r() * 6.28, 1.5); ctx.inst('crate', x + 1.7, z + 0.4, r() * 6.28, 1.2); }
    else { for (let k = 0; k < 4; k++) ctx.hex('sack', x + (k % 2) * 0.9, 0.15, z + (k >> 1) * 0.9, r() * 6.28, 9); }
  }

  // road-side lamp posts inside
  for (const [x, z] of [[28, 20], [20, 12], [-2, 10], [-18, 18], [4, -16], [30, -6], [-10, 26]]) ctx.torch(x, 3.4, z, { pool: true, post: true });

  // ------------------------------------------------ the Blue Crystal (heart of the wall)
  {
    const p = L.PLAZA, y0 = 0.15;
    put(CYL(3.4, 4, 0.7, 20), M.stoneDark, mat4(p.x, y0 + 0.35, p.z), { worldUV: 0.25, tint: 0xa9adb8 });
    put(CYL(2.2, 2.9, 1.3, 16), M.stone, mat4(p.x, y0 + 1.3, p.z), { worldUV: 0.25, tint: 0xffffff });
    put(new THREE.CylinderGeometry(2.25, 2.25, 0.3, 16, 1, true), M.rune, mat4(p.x, y0 + 1.5, p.z), { uvScale: [1.3, 1] });
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * 6.28, x = p.x + Math.cos(a) * 6.8, z = p.z + Math.sin(a) * 6.8;
      box(M.stone, x, 1.8, z, -a, 0.9, 3.6, 0.9, { worldUV: 0.25 });
      put(new THREE.OctahedronGeometry(0.45), M.crystal, mat4(x, 4.1, z));
    }
    ctx.crystal(p.x, y0 + 5.4, p.z);
    ctx.pick({ x: p.x, z: p.z, y0: 0, y1: 10, r: 4 }, 'crystal');
  }

  // ------------------------------------------------ windmill, grain fields, fences, hay (outside)
  {
    const { x, z } = L.WINDMILL, y0 = height(x, z) - 0.2;
    ctx.liveWindmill(x, y0, z, 0.85, 13);
    ctx.pick({ x, z, y0, y1: y0 + 20, r: 6 }, 'windmill');
    for (const F of L.FARMS) {
      const c = Math.cos(F.rot), s = Math.sin(F.rot);
      const Fp = (lx, lz) => [F.x + lx * c + lz * s, F.z - lx * s + lz * c];
      // wooden fence (kit) around the fields with a gate gap
      const hw = F.w / 2 + 2, hd = F.d / 2 + 2, seg = 2.06 * 1.4;
      const edges = [[[-hw, -hd], [hw, -hd]], [[hw, -hd], [hw, hd]], [[hw, hd], [-hw, hd]], [[-hw, hd], [-hw, -hd]]];
      edges.forEach(([[ax, az], [bx, bz]], ei) => {
        const len = Math.hypot(bx - ax, bz - az), n = Math.floor(len / seg), ang = Math.atan2(-(bz - az), bx - ax);
        for (let k = 0; k < n; k++) {
          if (ei === 3 && Math.abs(k - n / 2) < 1.5) continue;          // gate opening
          const t = (k + 0.5) / n, [px, pz] = Fp(ax + (bx - ax) * t, az + (bz - az) * t);
          ctx.kit('Prop_WoodenFence_Single', px, height(px, pz) - 0.05, pz, F.rot + ang, 1.4);
        }
      });
      // haystacks + sacks
      for (let k = 0; k < 6; k++) { const [px, pz] = Fp(-F.w / 2 + 6 + k * (F.w - 12) / 5, hd + 4 + (k % 2) * 2.5); put(new THREE.SphereGeometry(1.3, 12, 8, 0, 6.29, 0, Math.PI / 2), M.plaster, mat4(px, height(px, pz) - 0.1, pz, 0, 1, 1.15, 1), { tint: 0xc9a85a }); }
      for (let k = 0; k < 6; k++) { const [px, pz] = Fp(-hw - 4, -10 + k * 2.2); ctx.hex('sack', px, height(px, pz), pz, r() * 6.28, 9); }
    }
  }
  // (the pasture fence, its gates, the water trough and the hay rack: pas_stable.js)
  // a farm house by the fields
  { const F = L.FIELDS, x = F.x + F.w / 2 + 18, z = F.z + 4; house(x, z, F.rot - Math.PI / 2, 3, 4, 1, { lower: 'brick', id: 'house' }); ctx.torch(x - 7, height(x - 7, z) + 3, z + 4, { pool: true, post: true }); }
  // fishing hut at the lake
  { const x = L.LAKE.x + 36, z = L.LAKE.z - 19; house(x, z, 2.3, 2, 2, 1, { lower: 'plaster', id: 'house' }); }
}
