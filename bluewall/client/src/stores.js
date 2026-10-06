// Resource treasuries (p38, owner 6 Oct 2026: «خزانه ها چوب و سنگ و همه خوشگل و درست تو مپ اصلی»): one storehouse per resource — wood, stone, iron, gold, oil, food — in the quiet ring
// between the citadel's moat and the second ring street, next to the three gem vaults (vault.js).  Each hall wears the emblem of what it keeps on its ridge, a heap of that
// resource stands in front of the door, and the hall itself is built from the town's own stone / plaster / timber / roof materials, so it belongs to the town.
//   planStores()                  -> footprints [{ id, x, z, ry, r }]   (town.js reserves them so no house is built there; pure, deterministic)
//   buildStores(ctx, api)         -> { list, setFill({ wood: { n, cap }, ... }) }   (into the static batch, before it is built)
// The heaps follow the fill (n / cap) — `setFill` is the economy's hook (p39); until then they show a comfortable ~60 %.
import * as THREE from 'three';
import * as L from './layout.js';
import { roadDist } from './roads.js';
import { marketSpot } from './terrain.js';
import { planVaults } from './vault.js';
import { mat4, gableRoof } from './util.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = (rt, rb, h, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s);
const SPH = (r, w = 12, h = 8) => new THREE.SphereGeometry(r, w, h);
export const STORE_IDS = ['wood', 'stone', 'iron', 'gold', 'oil', 'food'];
export const STORE_FA = { wood: 'انبار چوب', stone: 'انبار سنگ', iron: 'انبار آهن', gold: 'خزانهٔ طلا', oil: 'انبار نفت', food: 'انبار غذا' };
const LOOK = {         // wall material key + tint, roof tint, trim tint
  wood:  { wall: 'wood',    wt: 0xd2a56c, roof: 0x8a5a36, trim: 0xe0b878 },
  stone: { wall: 'stone',   wt: 0xe2e0da, roof: 0x5d6f8c, trim: 0xb9c0cc },
  iron:  { wall: 'stoneDark', wt: 0xa6acb8, roof: 0x394152, trim: 0x8d97a8 },
  gold:  { wall: 'plaster', wt: 0xf2e3b5, roof: 0xd9a93a, trim: 0xffc94a },
  oil:   { wall: 'plaster', wt: 0xc97a50, roof: 0x9a432b, trim: 0x2b1d17 },
  food:  { wall: 'plaster', wt: 0xf4ecdc, roof: 0x6f8f56, trim: 0x8a6a46 },
};

let PLAN = null;
export function planStores() {
  if (PLAN) return PLAN;
  PLAN = [];
  if (!L.TOWN) return PLAN;
  const MK = marketSpot(), V = planVaults(), gates = [...L.TGATES, { x: L.GATE.x + L.GATE.nx * 20, z: L.GATE.z + L.GATE.nz * 20 }];
  const free = (x, z) => L.sdPoly(L.OUTER, x, z) >= L.MOAT.off + L.MOAT.half + 9 && L.sdTown(x, z) <= -45 && roadDist(x, z) >= 10.5
    && L.distPolyline(L.RIVER, x, z) >= 16 && (!MK || Math.hypot(x - MK.x, z - MK.z) >= MK.r + 16) && gates.every((g) => Math.hypot(x - g.x, z - g.z) >= 30)
    && V.every((v) => Math.hypot(x - v.x, z - v.z) >= v.r + 14) && PLAN.every((s) => Math.hypot(x - s.x, z - s.z) >= 28);
  // target directions (degrees, 0 = east, 90 = south): the west and north of the citadel; the vaults hold the east
  const want = { wood: 215, stone: 245, iron: 275, gold: 305, oil: 185, food: 155 };
  for (const id of STORE_IDS) {
    const A = want[id] * Math.PI / 180; let best = null;
    for (let da = 0; da <= 60 && !best; da += 3) for (const sg of da ? [1, -1] : [1]) for (let r = 60; r <= 126; r += 2) {
      const a = A + sg * da * Math.PI / 180, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!free(x, z)) continue;
      if (!best || r < best.r - 0.1) best = { x, z, r };                                            // the innermost free spot of this direction
    }
    if (!best) continue;
    // the door faces the nearest street
    let tx = 0, tz = 0, td = 1e9;
    for (let a = 0; a < 360; a += 20) for (let d = 8; d <= 26; d += 6) { const px = best.x + Math.cos(a * Math.PI / 180) * d, pz = best.z + Math.sin(a * Math.PI / 180) * d; const rdist = roadDist(px, pz); if (rdist < 1.2 && d < td) { td = d; tx = px; tz = pz; } }
    const ry = td < 1e9 ? Math.atan2(tx - best.x, tz - best.z) : Math.atan2(-best.x, -best.z);
    PLAN.push({ id, x: best.x, z: best.z, ry, r: 15 });
  }
  return PLAN;
}

export function buildStores(ctx, api) {
  const { M, height } = api, B = ctx.B, plan = planStores(), list = [];
  if (!plan.length) return { list, setFill() {} };
  const stoneUV = { worldUV: 0.1 }, fill = {};
  for (const S of plan) {
    const K = LOOK[S.id], c = Math.cos(S.ry), s = Math.sin(S.ry), y0 = Math.max(0.3, height(S.x, S.z));
    const P = (lx, lz) => [S.x + lx * c + lz * s, S.z - lx * s + lz * c];
    const put = (geo, mat, m, o) => B.add(geo, mat, m, o);
    const box = (mat, lx, y, lz, sx, sy, sz, o = {}) => { const [x, z] = P(lx, lz); put(BOX, mat, mat4(x, y, z, S.ry, sx, sy, sz), o); };
    const cyl = (mat, lx, y, lz, rt, rb, h, o = {}, n = 10) => { const [x, z] = P(lx, lz); put(CYL(rt, rb, h, n), mat, mat4(x, y, z), o); };
    const wallMat = M[K.wall];
    // ---- plinth, steps, hall, cornice
    box(M.stoneDark, 0, y0 + 0.4, 0, 15.2, 0.8, 11.6, { ...stoneUV, tint: 0xb4bac8 });
    for (let k = 0; k < 3; k++) box(M.stone, 0, y0 + 0.14 + k * 0.26, 6.9 - k * 0.6, 5.4 - k * 0.5, 0.28, 1.1, { ...stoneUV, tint: 0xd8dae2 });
    box(wallMat, 0, y0 + 0.8 + 2.4, 0, 12.6, 4.8, 9.4, K.wall === 'plaster' || K.wall === 'wood' ? { tint: K.wt, uvScale: [3, 1.6] } : { ...stoneUV, tint: K.wt });
    box(M.stoneDark, 0, y0 + 0.8 + 4.95, 0, 13.2, 0.35, 10.0, { ...stoneUV, tint: 0x9aa0ad });                    // cornice
    if (K.wall === 'plaster') for (let k = -2; k <= 2; k++) { box(M.wood, k * 3.1, y0 + 3.2, 4.74, 0.34, 4.8, 0.14, { tint: S.id === 'food' ? K.trim : 0x6b4a2f }); }   // half-timber posts on the front
    // roof: gable along x (the ridge runs across the front, the emblem stands on it)
    { const [rx, rz] = P(0, 0); const g = gableRoof(12.6, 9.4, 3.8, 0.8); put(g, M.roof, mat4(rx, y0 + 0.8 + 4.95 + 0.17, rz, S.ry), { tint: K.roof, uvScale: [1, 1] }); }
    // door: dark arch + studded leaves + two flanking posts with torches
    box(M.stoneDark, 0, y0 + 0.8 + 1.9, 4.74, 4.0, 3.8, 0.6, { ...stoneUV, tint: 0xa9adb8 });
    box(M.dark, 0, y0 + 0.8 + 1.7, 5.0, 2.9, 3.3, 0.18);
    for (let k = -1.2; k <= 1.21; k += 0.8) box(S.id === 'gold' ? M.gold : M.metal, k, y0 + 0.8 + 1.7, 5.12, 0.09, 3.3, 0.08);
    for (const e of [-1, 1]) { box(M.stone, e * 2.5, y0 + 0.8 + 1.5, 5.3, 0.7, 3.0, 0.7, { ...stoneUV, tint: 0xe6e2da }); const [tx, tz] = P(e * 2.5, 5.3); ctx.torch(tx, y0 + 0.8 + 3.4, tz, { pool: true }); }
    // resource-coloured pennants on the two front corners
    for (const e of [-1, 1]) { cyl(M.wood, e * 6.3, y0 + 0.8 + 6.4, 4.5, 0.06, 0.07, 3.2, { tint: 0x4a3524 }, 6); box(M.cloth, e * 6.3 + e * -0.55, y0 + 0.8 + 7.4, 4.5, 1.0, 0.7, 0.04, { tint: K.trim }); }

    // ---- the emblem on the ridge (front gable)
    const ey = y0 + 0.8 + 4.95 + 0.17 + 3.8;                                    // ridge height
    const E = {
      wood() { for (let i = 0; i < 3; i++) { const [x, z] = P(-0.8 + i * 0.8, 0); put(CYL(0.4, 0.4, 1.9, 10), M.woodLight, mat4(x, ey + 0.4, z, S.ry, 1, 1, 1, Math.PI / 2, 0), { tint: 0xd9a868 }); } for (let i = 0; i < 2; i++) { const [x, z] = P(-0.4 + i * 0.8, 0); put(CYL(0.4, 0.4, 1.9, 10), M.woodLight, mat4(x, ey + 1.1, z, S.ry, 1, 1, 1, Math.PI / 2, 0), { tint: 0xc99658 }); } const [x, z] = P(0, 0); put(CYL(0.4, 0.4, 1.9, 10), M.woodLight, mat4(x, ey + 1.8, z, S.ry, 1, 1, 1, Math.PI / 2, 0), { tint: 0xd9a868 }); },
      stone() { box(M.stoneLight, 0, ey + 0.55, 0, 2.6, 1.1, 1.8, { ...stoneUV, tint: 0xe8e6e0 }); box(M.stoneLight, 0, ey + 1.5, 0, 1.8, 0.9, 1.4, { ...stoneUV, tint: 0xd8d6d0 }); box(M.stoneLight, 0, ey + 2.25, 0, 1.0, 0.6, 1.0, { ...stoneUV, tint: 0xf0eee8 }); },
      iron() { box(M.metal, 0, ey + 0.35, 0, 1.6, 0.7, 1.0, { tint: 0x88929f }); box(M.metal, 0, ey + 1.05, 0, 2.6, 0.7, 1.2, { tint: 0xa0aab8 }); const [hx, hz] = P(1.9, 0); put(new THREE.ConeGeometry(0.5, 1.5, 8).rotateZ(-Math.PI / 2), M.metal, mat4(hx, ey + 1.05, hz, S.ry), { tint: 0xa0aab8 }); },
      gold() { for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) box(M.gold, (i - (2 - r) / 2) * 1.35, ey + 0.3 + r * 0.55, 0, 1.25, 0.5, 0.8); },
      oil() { const [x, z] = P(0, 0); put(SPH(1.0, 14, 10), M.plaster, mat4(x, ey + 1.2, z, S.ry, 1, 1.25, 1), { tint: 0xbd6a44 }); cyl(M.plaster, 0, ey + 2.6, 0, 0.38, 0.55, 0.9, { tint: 0xbd6a44 }, 10); cyl(M.dark, 0, ey + 3.1, 0, 0.5, 0.42, 0.18, {}, 10); for (const e of [-1, 1]) { const [hx, hz] = P(e * 0.85, 0); put(new THREE.TorusGeometry(0.34, 0.07, 6, 10), M.plaster, mat4(hx, ey + 2.5, hz, S.ry, 1, 1, 1, 0, 0), { tint: 0xbd6a44 }); } },
      food() { for (let i = -2; i <= 2; i++) { const [x, z] = P(i * 0.42, 0); put(new THREE.ConeGeometry(0.17, 1.9, 6), M.woodLight, mat4(x, ey + 1.1, z, S.ry, 1, 1, 1, 0, i * 0.2), { tint: 0xe2bf62 }); } cyl(M.cloth, 0, ey + 0.35, 0, 0.5, 0.58, 0.55, { tint: 0x9c3b3b }, 8); },
    };
    E[S.id]();

    // ---- the heap in front of the door (fixed ~60 % here; setFill scales it later: the batched pieces are static, so the heap is drawn at the typical amount)
    const Hh = {
      wood() { for (const sx of [-1, 1]) { const bx = sx * 4.1; for (let r = 0; r < 4; r++) for (let i = 0; i < 4 - r; i++) { const [x, z] = P(bx + (i - (3 - r) / 2) * 0.82, 10.6); put(CYL(0.38, 0.38, 3.2, 8), M.woodLight, mat4(x, y0 + 0.45 + r * 0.7, z, S.ry, 1, 1, 1, 0, Math.PI / 2), { tint: r % 2 ? 0xc99658 : 0xd9a868 }); } } },
      stone() { for (const sx of [-1, 1]) for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) box(M.stone, sx * 4.2 + (i - (2 - r) / 2) * 1.7, y0 + 0.45 + r * 0.9, 10.4, 1.55, 0.85, 1.2, { ...stoneUV, tint: r % 2 ? 0xd0d2d8 : 0xe2e0da }); },
      iron() { for (const sx of [-1, 1]) for (let r = 0; r < 4; r++) for (let i = 0; i < 5 - r; i++) box(M.metal, sx * 4.2 + (i - (4 - r) / 2) * 1.0, y0 + 0.3 + r * 0.42, 10.4, 0.92, 0.38, 0.5, { tint: r % 2 ? 0x9aa4b2 : 0x808a98 }); box(M.metal, 0, y0 + 0.45, 11.5, 1.1, 0.9, 0.7, { tint: 0x6f7886 }); },
      gold() { for (const sx of [-1, 1]) for (let r = 0; r < 4; r++) for (let i = 0; i < 5 - r; i++) box(M.gold, sx * 4.2 + (i - (4 - r) / 2) * 1.0, y0 + 0.3 + r * 0.42, 10.4, 0.92, 0.38, 0.5); for (let i = 0; i < 18; i++) { const a = i * 2.4, rr = 0.2 + (i % 5) * 0.34, [x, z] = P(Math.cos(a) * rr * 1.6, 11.8 + Math.sin(a) * rr); put(CYL(0.28, 0.28, 0.08, 8), M.gold, mat4(x, y0 + 0.08 + (i % 3) * 0.08, z)); } },
      oil() { for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const [x, z] = P(-4.6 + i * 1.2 + (j ? 7.6 : 0), 10 + j * 0.2); put(SPH(0.55, 10, 8), M.plaster, mat4(x, y0 + 0.62, z, S.ry, 1, 1.2, 1), { tint: 0xbd6a44 }); put(CYL(0.2, 0.27, 0.45, 8), M.plaster, mat4(x, y0 + 1.4, z), { tint: 0xbd6a44 }); } for (let i = 0; i < 4; i++) { const [x, z] = P(-1.6 + i * 1.1, 11.2); put(CYL(0.42, 0.42, 0.95, 10), M.wood, mat4(x, y0 + 0.5, z), { tint: 0x4a3524 }); } },
      food() { for (const sx of [-1, 1]) for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) { const [x, z] = P(sx * 4.2 + (i - (2 - r) / 2) * 1.05, 10.4); put(SPH(0.55, 8, 6), M.cloth, mat4(x, y0 + 0.4 + r * 0.55, z, S.ry, 1, 0.8, 0.75), { tint: r % 2 ? 0xd8c9a0 : 0xe6d9b4 }); } for (let i = 0; i < 3; i++) box(M.woodLight, -1.6 + i * 1.6, y0 + 0.4, 11.8, 1.2, 0.8, 0.9, { tint: 0xc99658 }); },
    };
    Hh[S.id]();
    // low stone kerb round the display
    for (const sx of [-1, 1]) box(M.stoneDark, sx * 4.1, y0 + 0.15, 10.6, 7.6, 0.3, 4.2, { ...stoneUV, tint: 0xb4bac8 });
    // (tapping a store opens its own panel in p40 — no pick target yet)
    list.push({ id: S.id, x: S.x, y: y0, z: S.z, ry: S.ry });
  }
  return { list, setFill(w) { Object.assign(fill, w || {}); } };
}
