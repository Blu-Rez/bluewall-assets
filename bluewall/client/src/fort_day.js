// Day map — a Siegefall-style square fort on open grass: light stone walls
// with wooden walkways, round towers with wooden tops, a round keep, blue
// houses, yellow workshops, wooden watchtowers and spike barricades.
import * as THREE from 'three';
import * as L from './layout.js';
import { mat4, gableRoof, gableWall } from './util.js';
import { rng } from './noise.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = (rt, rb, h, s = 18) => new THREE.CylinderGeometry(rt, rb, h, s);
const BLUE = 0x3f6fd6, BLUE2 = 0x335fc0, YELLOW = 0xe6b93c, RED = 0xb8452e;
const CREAM = 0xf6ecd6;

export function buildFortDay(ctx) {
  const { B, M, height } = ctx, r = rng(7);
  const put = (geo, mat, m, o) => B.add(geo, mat, m, o);
  const box = (mat, x, y, z, ry, sx, sy, sz, o = {}) => put(BOX, mat, mat4(x, y, z, ry, sx, sy, sz), o);
  const SUV = { worldUV: 0.11 };
  const local = (x0, z0, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x0 + lx * c + lz * s, z0 - lx * s + lz * c]; };
  const H = 7.6, T = 4.8, TR = 4.5, TH = 11;

  // ------------------------------------------------ walls
  const P = L.OUTER, n = P.length;
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n];
    const dx = b[0] - a[0], dz = b[1] - a[1], Lt = Math.hypot(dx, dz), ux = dx / Lt, uz = dz / Lt, ry = Math.atan2(-dz, dx);
    const out = L.segNormalOut(P, i);
    const gate = i === L.GATE_SEG;
    const pieces = gate ? [[TR * 0.7, Lt / 2 - 5.4], [Lt / 2 + 5.4, Lt - TR * 0.7]] : [[TR * 0.7, Lt - TR * 0.7]];
    for (const [s0, s1] of pieces) {
      const len = s1 - s0, cx = a[0] + ux * (s0 + len / 2), cz = a[1] + uz * (s0 + len / 2);
      box(M.stoneLight, cx, 0.5, cz, ry, len, 1.0, T + 1.2, { ...SUV, tint: 0xd8d8d8 });
      box(M.stoneLight, cx, H / 2, cz, ry, len, H, T, { ...SUV, tint: 0xffffff });
      // cream cornice both faces
      for (const e of [1, -1]) box(M.stoneLight, cx + out[0] * e * (T / 2 + 0.12), H - 0.3, cz + out[1] * e * (T / 2 + 0.12), ry, len, 0.6, 0.3, { ...SUV, tint: CREAM });
      // wooden walkway
      box(M.woodLight, cx, H + 0.12, cz, ry, len, 0.25, T - 1.4, { worldUV: 0.3, tint: 0xffffff });
      // outer parapet + merlons, inner low rim
      const po = T / 2 - 0.4;
      box(M.stoneLight, cx + out[0] * po, H + 0.55, cz + out[1] * po, ry, len, 1.1, 0.8, { ...SUV, tint: 0xf4f4f4 });
      box(M.stoneLight, cx - out[0] * (T / 2 - 0.3), H + 0.35, cz - out[1] * (T / 2 - 0.3), ry, len, 0.7, 0.6, { ...SUV, tint: 0xf4f4f4 });
      const step = 2.2, cnt = Math.max(1, Math.floor((len - 1) / step));
      for (let k = 0; k < cnt; k++) {
        const s = s0 + (len - (cnt - 1) * step) / 2 + k * step, px = a[0] + ux * s, pz = a[1] + uz * s;
        box(M.stoneLight, px + out[0] * po, H + 1.55, pz + out[1] * po, ry, 1.15, 1.0, 0.8, { ...SUV, tint: 0xffffff });
      }
      // buttresses on the outside every ~9 units
      const nb = Math.floor(len / 9);
      for (let k = 1; k < nb; k++) {
        const s = s0 + (k * len) / nb, px = a[0] + ux * s + out[0] * (T / 2 + 0.5), pz = a[1] + uz * s + out[1] * (T / 2 + 0.5);
        box(M.stoneLight, px, H * 0.38, pz, ry, 1.3, H * 0.76, 1.0, { ...SUV, tint: 0xe9e9e9 });
      }
    }
    ctx.pick({ x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, y0: 0, y1: H + 2, r: 5 }, 'wall');
  }
  // towers
  P.forEach(([x, z], i) => {
    const corner = i % 3 === 0, R = corner ? TR + 0.6 : TR, h = corner ? TH + 1.4 : TH;
    put(CYL(R + 0.9, R + 1.3, 1.4), M.stoneLight, mat4(x, 0.7, z), { ...SUV, tint: 0xd8d8d8 });
    put(CYL(R, R + 0.3, h), M.stoneLight, mat4(x, h / 2, z), { ...SUV, tint: 0xffffff });
    put(CYL(R + 0.32, R + 0.32, 1.0), M.stoneLight, mat4(x, h - 2.2, z), { ...SUV, tint: CREAM });
    put(CYL(R + 0.55, R + 0.1, 0.9), M.stoneLight, mat4(x, h - 0.2, z), { ...SUV, tint: CREAM });
    put(CYL(R + 0.1, R + 0.1, 0.3, 18), M.woodLight, mat4(x, h + 0.3, z), { worldUV: 0.3, tint: 0xffffff });
    // parapet ring from boxes + merlons
    const seg = 16;
    for (let k = 0; k < seg; k++) {
      const a2 = (k / seg) * Math.PI * 2, px = x + Math.cos(a2) * (R + 0.2), pz = z + Math.sin(a2) * (R + 0.2);
      box(M.stoneLight, px, h + 0.6, pz, -a2, 0.7, 1.0, (2 * Math.PI * (R + 0.2)) / seg + 0.1, { ...SUV, tint: 0xf4f4f4 });
      if (k % 2 === 0) box(M.stoneLight, x + Math.cos(a2) * (R + 0.2), h + 1.55, z + Math.sin(a2) * (R + 0.2), -a2, 0.7, 1.0, 1.1, { ...SUV, tint: 0xffffff });
    }
    // arrow slits
    for (let k = 0; k < 3; k++) {
      const a2 = Math.atan2(z, x) + (k - 1) * 0.8;
      box(M.dark, x + Math.cos(a2) * (R + 0.15), 4.2 + k * 1.3, z + Math.sin(a2) * (R + 0.15), -a2, 0.3, 1.3, 0.35);
    }
    if (corner) { ctx.flag(x, h + 7.5, z, Math.atan2(z, x) + 0.9, 1.1); put(CYL(0.1, 0.12, 7, 6), M.wood, mat4(x, h + 4, z), { tint: 0x6b4a30 }); }
    else if (i % 3 === 1) ctx.weapon(x, h + 0.45, z, Math.atan2(z, x), 'ballista');
    else ctx.weapon(x, h + 0.45, z, Math.atan2(z, x), 'cannon');
    ctx.decal(x, z, R + 4, 0.45);
    ctx.pick({ x, z, y0: 0, y1: h + 3, r: R + 1 }, 'tower');
  });

  // ------------------------------------------------ gatehouse
  {
    const G = L.GATE, a = P[L.GATE_SEG], b = P[(L.GATE_SEG + 1) % n];
    const dl = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / dl, dz = (b[1] - a[1]) / dl, ry = Math.atan2(-dz, dx);
    const GH = 12;
    for (const e of [-1, 1]) {
      const tx = G.x + dx * e * 7.6, tz = G.z + dz * e * 7.6;
      box(M.stoneLight, tx, 0.7, tz, ry, 7.6, 1.4, 7.6, { ...SUV, tint: 0xd8d8d8 });
      box(M.stoneLight, tx, GH / 2, tz, ry, 6.6, GH, 6.6, { ...SUV, tint: 0xffffff });
      box(M.stoneLight, tx, GH - 1.8, tz, ry, 6.9, 0.9, 6.9, { ...SUV, tint: CREAM });
      box(M.woodLight, tx, GH + 0.1, tz, ry, 6.2, 0.25, 6.2, { worldUV: 0.3, tint: 0xffffff });
      for (let k = 0; k < 3; k++) for (const f of [-1, 1]) {
        const al = -2.4 + k * 2.4;
        box(M.stoneLight, tx + dx * al + G.nx * f * 3.1, GH + 0.9, tz + dz * al + G.nz * f * 3.1, ry, 1.2, 1.6, 0.6, { ...SUV });
        box(M.stoneLight, tx + G.nx * al + dx * f * 3.1, GH + 0.9, tz + G.nz * al + dz * f * 3.1, ry + Math.PI / 2, 1.2, 1.6, 0.6, { ...SUV });
      }
      ctx.banner(tx + G.nx * 3.4, GH - 4.6, tz + G.nz * 3.4, ry, 2.6, 4.6);
      ctx.decal(tx, tz, 7, 0.4);
      ctx.pick({ x: tx, z: tz, y0: 0, y1: GH + 2, r: 4 }, 'gate');
    }
    box(M.stoneLight, G.x, 9.4, G.z, ry, 8.8, 3.2, 5.6, { ...SUV, tint: 0xffffff });
    box(M.stoneLight, G.x, 8.0, G.z, ry, 8.8, 0.5, 6.0, { ...SUV, tint: CREAM });
    box(M.woodLight, G.x, 11.1, G.z, ry, 8.6, 0.25, 4.4, { worldUV: 0.3, tint: 0xffffff });
    box(M.wood, G.x - G.nx * 0.2, 3.9, G.z - G.nz * 0.2, ry, 8.6, 7.8, 0.7, { worldUV: 0.3, tint: 0x9a6f45 });
    for (const f of [-2.2, 2.2]) box(M.metal, G.x + dx * f + G.nx * 0.25, 3.9, G.z + dz * f + G.nz * 0.25, ry, 0.35, 7.6, 0.12, { tint: 0x777777 });
    for (const yy of [1.8, 5.8]) box(M.metal, G.x + G.nx * 0.25, yy, G.z + G.nz * 0.25, ry, 8.4, 0.3, 0.12, { tint: 0x777777 });
    ctx.pick({ x: G.x, z: G.z, y0: 0, y1: 12, r: 5 }, 'gate');
  }

  // ------------------------------------------------ round keep (centre)
  {
    const x = L.KEEP.x, z = L.KEEP.z, R = 8.2, h = 9.5;
    put(CYL(R + 1.1, R + 1.6, 1.6, 28), M.stoneLight, mat4(x, 0.8, z), { ...SUV, tint: 0xd8d8d8 });
    put(CYL(R, R + 0.4, h, 28), M.stoneLight, mat4(x, h / 2, z), { ...SUV, tint: 0xffffff });
    put(CYL(R + 0.4, R + 0.4, 1.0, 28), M.stoneLight, mat4(x, h - 2.4, z), { ...SUV, tint: CREAM });
    put(CYL(R + 0.7, R + 0.1, 1.0, 28), M.stoneLight, mat4(x, h - 0.3, z), { ...SUV, tint: CREAM });
    put(CYL(R + 0.1, R + 0.1, 0.3, 28), M.woodLight, mat4(x, h + 0.3, z), { worldUV: 0.3, tint: 0xffffff });
    const seg = 28;
    for (let k = 0; k < seg; k++) {
      const a2 = (k / seg) * Math.PI * 2, px = x + Math.cos(a2) * (R + 0.3), pz = z + Math.sin(a2) * (R + 0.3);
      box(M.stoneLight, px, h + 0.6, pz, -a2, 0.8, 1.0, (2 * Math.PI * (R + 0.3)) / seg + 0.1, { ...SUV, tint: 0xf4f4f4 });
      if (k % 2 === 0) box(M.stoneLight, px, h + 1.55, pz, -a2, 0.8, 1.0, 1.2, { ...SUV, tint: 0xffffff });
    }
    // inner turret with wooden top + flag
    const tx = x - 2.2, tz = z - 1.8, tR = 3.4, th = 6;
    put(CYL(tR, tR + 0.2, th, 18), M.stoneLight, mat4(tx, h + th / 2, tz), { ...SUV, tint: 0xffffff });
    put(CYL(tR + 0.5, tR, 0.8, 18), M.stoneLight, mat4(tx, h + th - 0.2, tz), { ...SUV, tint: CREAM });
    put(CYL(tR, tR, 0.3, 18), M.woodLight, mat4(tx, h + th + 0.25, tz), { worldUV: 0.3, tint: 0xffffff });
    for (let k = 0; k < 12; k += 1) { const a2 = (k / 12) * Math.PI * 2; if (k % 2 === 0) box(M.stoneLight, tx + Math.cos(a2) * (tR + 0.1), h + th + 0.9, tz + Math.sin(a2) * (tR + 0.1), -a2, 0.7, 1.1, 1.1, { ...SUV }); }
    put(CYL(0.12, 0.14, 7, 6), M.wood, mat4(tx, h + th + 3.6, tz), { tint: 0x6b4a30 });
    ctx.flag(tx, h + th + 7, tz, 0.5, 1.6);
    // door + stairs + windows
    const da = Math.atan2(L.GATE.z, L.GATE.x);
    const ddx = Math.cos(da), ddz = Math.sin(da);
    box(M.wood, x + ddx * (R + 0.2), 2.4, z + ddz * (R + 0.2), -da, 0.5, 4.2, 3, { tint: 0x7a5230 });
    box(M.stoneLight, x + ddx * (R + 1.8), 0.4, z + ddz * (R + 1.8), -da, 2.6, 0.8, 4, { ...SUV, tint: 0xd8d8d8 });
    for (let k = 0; k < 8; k++) { const a2 = da + 0.4 + k * 0.72; box(M.dark, x + Math.cos(a2) * (R + 0.15), 5.6, z + Math.sin(a2) * (R + 0.15), -a2, 0.3, 1.6, 0.7); }
    ctx.banner(x + ddx * (R + 0.35), 6.4, z + ddz * (R + 0.35), -da + Math.PI / 2, 2.4, 3.6);
    ctx.decal(x, z, R + 6, 0.5);
    ctx.pick({ x, z, y0: 0, y1: h + th + 2, r: R + 1 }, 'keep');
  }

  // ------------------------------------------------ houses & workshops
  function house(x, z, ry, w, d, h, roofTint) {
    const Pp = local(x, z, ry), y0 = 0.15;
    box(M.stoneLight, x, y0 + 0.6, z, ry, w + 0.3, 1.2, d + 0.3, { ...SUV, tint: 0xd0d0d0 });
    box(M.plaster, x, y0 + 1.2 + h / 2, z, ry, w, h, d, { worldUV: 0.2, tint: 0xfff6e6 });
    for (const [lx, lz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) { const [px, pz] = Pp(lx, lz); box(M.wood, px, y0 + 1.2 + h / 2, pz, ry, 0.4, h, 0.4, { tint: 0x7a5230 }); }
    const gy = y0 + 1.2 + h, rh = Math.min(w, d) * 0.62 + 0.4;
    put(gableWall(w, d, rh * 0.95), M.plaster, mat4(x, gy, z, ry), { worldUV: 0.2, tint: 0xfff6e6 });
    put(gableRoof(w, d, rh, 0.75), M.roof, mat4(x, gy, z, ry), { tint: roofTint, uvScale: [1.3, 1.3] });
    const [dxp, dzp] = Pp(0, d / 2 + 0.05); box(M.wood, dxp, y0 + 2, dzp, ry, 1.2, 2.1, 0.15, { tint: 0x6b4a30 });
    for (const lx of [-w / 3, w / 3]) { const [wx, wz] = Pp(lx, d / 2 + 0.05); box(M.dark, wx, gy - h * 0.45, wz, ry, 0.8, 0.9, 0.12); }
    const [cx, cz] = Pp(w * 0.3, -d * 0.12);
    box(M.stoneLight, cx, gy + rh * 0.75, cz, ry, 0.9, rh * 1.4, 0.9, { ...SUV, tint: 0xcfcfcf });
    ctx.smokeAt(cx, gy + rh * 1.5, cz);
    ctx.decal(x, z, Math.max(w, d) * 0.9, 0.35);
  }
  for (const [x, z, ry] of [[-24, -8, 0.3], [20, 22, -0.4], [28, 6, -0.25]]) { house(x, z, ry, 6.5, 5.2, 3.2, x < 0 ? BLUE : BLUE2); ctx.pick({ x, z, y0: 0, y1: 9, r: 4.5 }, 'house'); }

  function workshop(x, z, ry) {
    const Pp = local(x, z, ry), y0 = 0.15, w = 8, d = 5.5;
    box(M.stoneLight, x, y0 + 0.3, z, ry, w + 0.6, 0.6, d + 0.6, { ...SUV, tint: 0xc9c9c9 });
    for (const [lx, lz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2], [0, -d / 2], [0, d / 2]]) { const [px, pz] = Pp(lx, lz); box(M.wood, px, y0 + 2.3, pz, ry, 0.5, 4.6, 0.5, { tint: 0x8a6038 }); }
    const [bx, bz] = Pp(0, -d / 2 + 0.2); box(M.wood, bx, y0 + 2.2, bz, ry, w, 4.2, 0.3, { worldUV: 0.3, tint: 0xb07a48 });
    put(gableRoof(w, d, 2.6, 0.8), M.roof, mat4(x, y0 + 4.6, z, ry), { tint: YELLOW, uvScale: [1.4, 1.4] });
    put(gableWall(w, d, 2.5), M.wood, mat4(x, y0 + 4.6, z, ry), { worldUV: 0.3, tint: 0xb07a48 });
    for (let k = 0; k < 3; k++) { const [lx, lz] = Pp(-2 + k * 1.1, 1.2); put(new THREE.CylinderGeometry(0.45, 0.45, 4, 9), M.wood, mat4(lx, y0 + 0.6, lz, ry, 1, 1, 1, 0, Math.PI / 2), { tint: 0xc08a58 }); }
    const [ax, az] = Pp(2.2, 0.6); box(M.metal, ax, y0 + 1, az, ry, 1.2, 0.4, 0.6);
    ctx.decal(x, z, 7, 0.35);
  }
  workshop(6, -26, 0.15); workshop(26, -14, -0.45);
  ctx.pick({ x: 6, z: -26, y0: 0, y1: 8, r: 5 }, 'forge'); ctx.pick({ x: 26, z: -14, y0: 0, y1: 8, r: 5 }, 'lumber');

  // ------------------------------------------------ wooden watchtowers
  function watchtower(x, z, ry) {
    const Pp = local(x, z, ry);
    for (const [lx, lz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) { const [px, pz] = Pp(lx, lz); box(M.wood, px, 3.4, pz, ry, 0.4, 6.8, 0.4, { tint: 0x8a6038 }); }
    for (const yy of [2.2, 4.6]) for (const e of [-1, 1]) { const [px, pz] = Pp(0, e * 1.3); box(M.wood, px, yy, pz, ry + e * 0.6, 3, 0.2, 0.2, { tint: 0x7a5230 }); }
    box(M.woodLight, x, 6.9, z, ry, 3.8, 0.3, 3.8, { worldUV: 0.3, tint: 0xffffff });
    for (const e of [-1, 1]) { const [px, pz] = Pp(e * 1.8, 0); box(M.wood, px, 7.5, pz, ry, 0.2, 1.0, 3.8, { tint: 0x8a6038 }); const [qx, qz] = Pp(0, e * 1.8); box(M.wood, qx, 7.5, qz, ry, 3.8, 1.0, 0.2, { tint: 0x8a6038 }); }
    for (const [lx, lz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) { const [px, pz] = Pp(lx, lz); box(M.wood, px, 8.6, pz, ry, 0.25, 2.4, 0.25, { tint: 0x7a5230 }); }
    put(new THREE.ConeGeometry(3.1, 2.4, 4, 1), M.roof, mat4(x, 11, z, ry + Math.PI / 4), { tint: RED, uvScale: [3, 2] });
    ctx.decal(x, z, 4.5, 0.4);
    ctx.pick({ x, z, y0: 0, y1: 12, r: 2.4 }, 'archer');
  }
  for (const [x, z, ry] of [[-30, 14, 0.2], [-10, 30, -0.1], [12, 32, 0.3], [-26, -28, 0.1]]) watchtower(x, z, ry);

  // ------------------------------------------------ spike barricades (cheval de frise)
  function barricade(x, z, ry) {
    const Pp = local(x, z, ry);
    put(new THREE.CylinderGeometry(0.3, 0.3, 5, 8), M.wood, mat4(x, 0.9, z, ry, 1, 1, 1, 0, Math.PI / 2), { tint: 0x9a6f45 });
    for (let k = 0; k < 5; k++) for (const e of [-1, 1]) {
      const [px, pz] = Pp(-2 + k, 0);
      put(new THREE.CylinderGeometry(0.05, 0.14, 3.2, 5), M.wood, mat4(px, 0.9, pz, ry + Math.PI / 2, 1, 1, 1, 0, e * 0.8), { tint: 0xb08050 });
    }
  }
  for (const [x, z, ry] of [[-34, 24, 0.7], [-22, 36, 0.3], [-4, 22, -0.2], [30, 34, -0.5], [-34, -14, 1.2]]) barricade(x, z, ry);

  // ------------------------------------------------ small props & inner trees
  for (const [x, z] of [[14, -30], [-16, -24], [32, 20], [-8, -36]]) {
    for (let k = 0; k < 3; k++) put(new THREE.CylinderGeometry(0.55, 0.5, 1.2, 10), M.wood, mat4(x + (k % 2) * 1.1, 0.75, z + (k >> 1) * 1.1), { tint: 0x9a6a3a });
    box(M.wood, x + 2, 0.7, z - 0.6, r() * 3, 1.3, 1.3, 1.3, { tint: 0xb08a58 });
  }
  ctx.innerTrees = [[36, -36], [-38, -38], [34, 38], [-40, 34], [-6, -12]];
  ctx.torch(L.GATE.x + L.GATE.nx * 5, 2.5, L.GATE.z + L.GATE.nz * 5, { pool: false, post: true });
  void height;
}
