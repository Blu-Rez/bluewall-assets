// The lower town between the Blue Wall and the town wall: cobbled streets
// (real geometry with photographic cobbles), ~100-180 houses of many kinds
// (stone, brick, plaster, half-timbered, jettied upper floors, gable-front or
// eave-front roofs in terracotta / brown / slate / royal blue), a market
// square with stalls, a church with a bell tower, street lamps and garden
// trees. Everything static is batched per material (a handful of draw calls).
import * as THREE from 'three';
import * as L from './layout.js';
import { ROADS, roadDist } from './roads.js';
import { marketSpot } from './terrain.js';
import { mat4, gableRoof, gableWall, grayMap } from './util.js';
import { rng } from './noise.js';
import { planHamlets } from './hamlets.js';
import { planVaults } from './vault.js';
import { planStores } from './stores.js';
import { T as THEME } from './theme.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const PLANE = new THREE.PlaneGeometry(1, 1);

function pbr(t, extra = {}) {
  if (!t || !t.map) return null;
  return new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap || null, roughnessMap: t.roughnessMap || null, roughness: 1, metalness: 0, vertexColors: true, envMapIntensity: 0.4, ...extra });
}
function phMat(A, k, extra = {}) {
  const t = A.ph && A.ph[k]; if (!t) return null;
  return new THREE.MeshStandardMaterial({ map: t, normalMap: A.ph[k + '_n'] || null, roughness: 0.95, metalness: 0, vertexColors: true, envMapIntensity: 0.35, ...extra });
}

export function buildTown(ctx, A, Q, scene) {
  if (!L.TOWN) return { houses: [] };
  const { B, M, height } = ctx, r = rng(4242);
  const T = A.tex || {};
  const Mt = {
    plaster: (() => { const p = pbr(T.Plaster); return p ? grayMap(p, 1.7) : M.plaster; })(),          // desaturated in the shader: the tint alone decides the colour
    brick: phMat(A, 'ph_brick') || pbr(T.UnevenBrick) || M.stone,
    stone: phMat(A, 'ph_cliff') || pbr(T.UnevenBrick) || M.stoneDark,
    roof: (() => { const p = pbr(T.RoundTiles, { envMapIntensity: 0.55 }); return p ? grayMap(p, 1.9) : M.roof; })(),
    wood: M.wood, window: M.window, dark: M.dark,
  };
  const MK = marketSpot();
  const lots = [];

  // ------------------------------------------------ cobbled streets as draped ribbons
  const cob = phMat(A, 'ph_cobble', { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  if (cob) {
    const pos = [], uv = [], idx = [];
    const ribbon = (pts, w) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1], len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(len / 2));
        const ux = (bx - ax) / len, uz = (bz - az) / len, nx = -uz, nz = ux;
        const base = pos.length / 3;
        for (let k = 0; k <= n; k++) {
          const t = k / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
          for (const e of [-1, 1]) {
            const px = x + nx * e * w / 2, pz = z + nz * e * w / 2;
            pos.push(px, Math.max(height(px, pz), 0.2) + 0.07, pz); uv.push(px * 0.45, pz * 0.45);
          }
          if (k < n) { const a = base + k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        }
      }
    };
    for (const R of ROADS.filter((q) => q.kind === 'cobble')) ribbon(R.pts, R.w);
    if (MK) { // market disk
      const base = pos.length / 3, seg = 28;
      pos.push(MK.x, height(MK.x, MK.z) + 0.08, MK.z); uv.push(MK.x * 0.45, MK.z * 0.45);
      for (let k = 0; k <= seg; k++) { const a = (k / seg) * 6.283, x = MK.x + Math.cos(a) * MK.r, z = MK.z + Math.sin(a) * MK.r; pos.push(x, height(x, z) + 0.08, z); uv.push(x * 0.45, z * 0.45); }
      for (let k = 0; k < seg; k++) idx.push(base, base + 2 + k, base + 1 + k);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(0.82), 3));
    g.setIndex(idx); g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, cob); mesh.receiveShadow = true; mesh.name = 'streets'; scene.add(mesh);
  }

  // ------------------------------------------------ lots: street fronts first, then back rows
  const placed = [];
  const corners = (x, z, ry, w, d) => { const c = Math.cos(ry), s = Math.sin(ry); return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([lx, lz]) => [x + lx * c + lz * s, z - lx * s + lz * c]); };
  const overlap = (a, b) => { // SAT on two rectangles (corner lists)
    for (const P of [a, b]) for (let i = 0; i < 4; i++) {
      const p1 = P[i], p2 = P[(i + 1) % 4], ax = -(p2[1] - p1[1]), az = p2[0] - p1[0];
      let amin = 1e9, amax = -1e9, bmin = 1e9, bmax = -1e9;
      for (const q of a) { const v = q[0] * ax + q[1] * az; amin = Math.min(amin, v); amax = Math.max(amax, v); }
      for (const q of b) { const v = q[0] * ax + q[1] * az; bmin = Math.min(bmin, v); bmax = Math.max(bmax, v); }
      if (amax < bmin || bmax < amin) return false;
    }
    return true;
  };
  const gates = [...L.TGATES, { x: L.GATE.x + L.GATE.nx * 20, z: L.GATE.z + L.GATE.nz * 20 }];
  function ok(x, z, ry, w, d, pad = 0.9) {
    const C = corners(x, z, ry, w + pad * 2, d + pad * 2), hd = Math.hypot(w, d) / 2;
    if (L.sdTown(x, z) > -(hd + 5.5)) return false;                             // keep off the town wall walk
    if (L.sdPoly(L.OUTER, x, z) < L.MOAT.off + L.MOAT.half + 5 + hd) return false; // and off the inner moat
    if (MK && Math.hypot(x - MK.x, z - MK.z) < MK.r + 2 + hd) return false;
    for (const g of gates) if (Math.hypot(x - g.x, z - g.z) < 17 + hd) return false;
    if (L.distPolyline(L.RIVER, x, z) < 10 + hd) return false;                 // p38: the river runs through the town: no house in the water, on its slope or on the quay
    for (const v of planVaults()) if (Math.hypot(x - v.x, z - v.z) < v.r + 4 + hd) return false;      // the gem vaults' grounds
    for (const v of planStores()) if (Math.hypot(x - v.x, z - v.z) < v.r + 4 + hd) return false;      // p38: the resource storehouses' grounds
    for (const [cx, cz] of [...corners(x, z, ry, w + 0.6, d + 0.6), [x, z]]) if (roadDist(cx, cz) < 0.4) return false;
    for (const p of placed) if (Math.hypot(p.x - x, p.z - z) < p.hd + hd + 1 && overlap(p.C, C)) return false;
    return true;
  }
  const add = (h) => { h.C = corners(h.x, h.z, h.ry, h.w + 1.2, h.d + 1.2); h.hd = Math.hypot(h.w, h.d) / 2; placed.push(h); lots.push(h); return h; };
  const want = ({ low: 90, medium: 125, high: 160, ultra: 190 }[Q.level] || 140) * (L.GROW > 1 ? 1.5 : 1);                 // p35 P4: the bigger town, +50 % houses (more streets to stand on)

  // special buildings first: church (north quarter), tavern + guild hall at the market
  const churchAt = (() => { const R = ROADS.find((q) => q.name === 'lane118'); if (!R) return null; const [x, z] = R.pts[1]; return { x: x * 0.97 + 16, z: z * 0.97 - 2 }; })();
  if (churchAt && ok(churchAt.x, churchAt.z, -0.3, 13, 24)) add({ x: churchAt.x, z: churchAt.z, ry: -0.3, w: 13, d: 24, kind: 'church' });

  const streets = ROADS.filter((q) => q.kind === 'cobble');
  // p35 P4: every street gets its own share of the quota, so the second ring street is lined with houses too (not only the first ring that comes first)
  const share = (R) => (L.GROW > 1 ? (R.name === 'ring' ? 0.4 : R.name === 'ring2' ? 0.36 : 0.24 / Math.max(1, streets.length - 2)) : 1), taken = new Map();
  for (const R of streets) {
    const pts = R.pts, cap = want * share(R);
    for (let i = 0; i < pts.length - 1 && lots.length < want && (taken.get(R.name) || 0) < cap; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len, nx = -uz, nz = ux;
      for (const side of [-1, 1]) {
        let s = 1.5 + r() * 2;
        while (s < len - 2 && lots.length < want && (taken.get(R.name) || 0) < cap) {
          const big = R.name === 'mainst' || (MK && Math.hypot(ax + ux * s - MK.x, az + uz * s - MK.z) < 40);
          const w = 6.2 + r() * 4.2 + (big ? 1.2 : 0), d = 7.4 + r() * 3.6, set = R.w / 2 + 1.1 + r() * 0.7;
          const x = ax + ux * (s + w / 2) + nx * side * (set + d / 2), z = az + uz * (s + w / 2) + nz * side * (set + d / 2);
          const ry = Math.atan2(-nx * side, -nz * side);
          if (ok(x, z, ry, w, d)) {
            add({ x, z, ry, w, d, floors: big ? 2 + (r() < 0.45 ? 1 : 0) : 1 + (r() < 0.55 ? 1 : 0) + (r() < 0.08 ? 1 : 0), kind: 'house' }); taken.set(R.name, (taken.get(R.name) || 0) + 1);
            s += w + 0.5 + r() * 1.4;
          } else s += 1.6;
        }
      }
    }
  }
  // back rows / courtyard houses: fill the remaining space, facing the nearest street
  for (let k = 0; k < 4000 && lots.length < want; k++) {
    const a = r() * 6.283, d0 = 70 + r() * (L.GROW > 1 ? 100 : 70), x = Math.cos(a) * d0, z = Math.sin(a) * d0;
    if (L.sdTown(x, z) > -8) continue;
    // face the nearest road
    let best = 1e9, fx = 0, fz = 1;
    for (const R of streets) for (let i = 0; i < R.pts.length - 1; i++) {
      const [ax, az] = R.pts[i], [bx, bz] = R.pts[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), px = ax + dx * t, pz = az + dz * t, dd = Math.hypot(x - px, z - pz);
      if (dd < best) { best = dd; fx = px - x; fz = pz - z; }
    }
    if (best > 34) continue;
    const ry = Math.atan2(fx, fz), w = 5.6 + r() * 3.6, d = 6.4 + r() * 3;
    if (ok(x, z, ry, w, d, 1.1)) add({ x, z, ry, w, d, floors: 1 + (r() < 0.4 ? 1 : 0), kind: 'house' });
  }

  // ------------------------------------------------ build
  // colour schemes of the houses: light blue, blue, navy, black, light wood, dark wood, liver red, green, cream — wall / roof / shutters / timber trim
  const SCHEMES = [
    { w: 0.12, wall: ['#efe6d2', '#e8dcc0', '#f3efe6', '#e2cfae'], roof: ['#b8583c', '#a8664a', '#c98a62'], shut: ['#3f5a3a', '#2f4f6f', '#6b3a2a'], trim: ['#5a3e2a', '#3a2a1e'] },
    { w: 0.13, wall: ['#a9cdee', '#b9d9f4', '#98c0e8'], roof: ['#3560a8', '#3f6bb5', '#2f5598'], shut: ['#f2f6ff', '#1f3d7a'], trim: ['#2a3f66', '#f2f6ff'] },
    { w: 0.12, wall: ['#4f80c0', '#5c8bcc', '#4677b5'], roof: ['#e9eef7', '#cdd9ec', '#b9c9e6'], shut: ['#f4f7ff', '#0f1f45'], trim: ['#eaf0fa'] },
    { w: 0.10, wall: ['#35569c', '#3d62ab', '#2f4f93'], roof: ['#6f86b8', '#8fa8d6', '#d0daef'], shut: ['#9cc3ff', '#e8eef8'], trim: ['#cfd9ee'] },
    { w: 0.08, wall: ['#3b404c', '#454b59', '#343843'], roof: ['#66718e', '#4c5b7e', '#7d8aa8'], shut: ['#7fb0ff', '#c9d3e6'], trim: ['#aeb8cc'] },
    { w: 0.14, wall: ['#dabc8e', '#e1c698', '#d0b080'], roof: ['#8a5238', '#9a5c40', '#3f5a8a'], shut: ['#5a3a22', '#3f5a3a', '#2a3f66'], trim: ['#6a4a2e', '#4a321e'] },
    { w: 0.08, wall: ['#7d583c', '#6f4a33', '#8a6244'], roof: ['#4a5568', '#6b4a38', '#8a6a58'], shut: ['#d9c7a0', '#8fa8d6'], trim: ['#2a1c12'] },
    { w: 0.12, wall: ['#9a363a', '#862d31', '#a8403f'], roof: ['#4a5068', '#cabfa8', '#6a738c'], shut: ['#e9e0cc', '#2c3a5a'], trim: ['#e2d8c2'] },
    { w: 0.11, wall: ['#5e8f5b', '#6b9b64', '#507f51'], roof: ['#d8cdb0', '#8a6a50', '#2f4a38'], shut: ['#f1ead6', '#3a2a1e'], trim: ['#f1ead6', '#3a2a1e'] },
  ];
  const RUSTIC = [
    { wall: ['#efe6d2', '#e8dcc0', '#f3efe6'], roof: ['#c0603e', '#b45a3c', '#c97a52'], shut: ['#3f5a3a', '#2f4f6f'], trim: ['#5a3e2a', '#4a321e'] },
    { wall: ['#e8dcc0', '#dabc8e', '#efe6d2'], roof: ['#c9a560', '#bf9a55', '#d4b06a'], shut: ['#2a3f66', '#5a3a22'], trim: ['#4a321e', '#5a3e2a'] },
    { wall: ['#f3efe6', '#e2dccd', '#efe6d2'], roof: ['#5d7fb8', '#6b8cc4', '#5577b0'], shut: ['#2f4f6f', '#f2f6ff'], trim: ['#3a2a1e', '#2a3f66'] },
  ];
  // p35 P9: the mix of colour schemes follows the castle level (theme.js; at level 30 it is exactly the old mix), the same lots just get other colours
  const SW = SCHEMES.map((q, i) => (THEME.houseW[i] != null ? THEME.houseW[i] : q.w)), SCH_W = SW.reduce((a, q) => a + q, 0), pick = (arr) => arr[(r() * arr.length) | 0];
  const scheme = () => { let t = r() * SCH_W, last = 0; for (let i = 0; i < SCHEMES.length; i++) { if (SW[i] <= 0) continue; last = i; t -= SW[i]; if (t <= 0) return SCHEMES[i]; } return SCHEMES[last]; };      // (a scheme with weight 0 is never picked)
  const hash01 = (x, z, k) => ((Math.sin(x * 12.9898 * k + z * 78.233) * 43758.5453) % 1 + 1) % 1;
  const bluish = (hex) => { const n = parseInt(hex.slice(1), 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255; return B > R + 24 && B >= G; };
  // (the warm schemes keep their blue roof option at level 30; below it a share of the houses never get a blue roof - one pick either way, so nothing else shifts)
  const pickRoof = (h, arr) => { if (THEME.blueCut > 0 && hash01(h.x, h.z, 1.7) < THEME.blueCut) { const f = arr.filter((c) => !bluish(c)); if (f.length) return pick(f); } return pick(arr); };
  const rusticAt = (h) => THEME.rustic > 0 && ((Math.sin(h.x * 12.9898 + h.z * 78.233) * 43758.5453) % 1 + 1) % 1 < THEME.rustic;
  const FLOWER = ['#d83a4a', '#f0d24a', '#f2f2f2', '#e87aa8', '#8fb8ff'];
  const put = (geo, mat, m, o) => B.add(geo, mat, m, o);
  let smokeN = 0;
  // every ~26 m block of houses is one destructible battle target (the whole block crumbles together, see destruct.js); the church stands alone
  { const cell = 26, map = new Map();
    for (const h of lots) { const k = h.kind === 'church' ? 'church' : Math.floor(h.x / cell) + ',' + Math.floor(h.z / cell); if (!map.has(k)) map.set(k, []); map.get(k).push(h); }
    for (const arr of map.values()) { blockTarget(arr); for (const h of arr) { if (h.kind === 'church') church(h); else townHouse(h); } }
    B.bid(0); }
  function blockTarget(arr, type) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, hy = 0;
    for (const h of arr) { const e = Math.max(h.w, h.d) / 2; x0 = Math.min(x0, h.x - e); x1 = Math.max(x1, h.x + e); z0 = Math.min(z0, h.z - e); z1 = Math.max(z1, h.z + e); hy = Math.max(hy, h.floors || 1); }
    const church = arr.length === 1 && arr[0].kind === 'church';
    return ctx.tgt({ type: type || (church ? 'church' : 'house'), x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, h: church ? 28 : 4 + hy * 3.2, rot: 0, n: arr.length, share: church ? 2.4 : +(0.5 + 0.16 * arr.length).toFixed(2) });
  }

  function townHouse(h) {
    const { x, z, ry, w, d } = h, floors = Math.max(1, h.floors || 1), c = Math.cos(ry), s = Math.sin(ry);
    const P = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
    let y0 = 1e9; for (const [cx, cz] of corners(x, z, ry, w, d)) y0 = Math.min(y0, height(cx, cz)); y0 = Math.max(y0, 0.2);
    const sc = (h.scheme === 'rustic' && THEME.rustic >= 0) || rusticAt(h) ? pick(RUSTIC) : scheme(), style = r() < 0.34 ? 'timber' : r() < 0.42 ? 'stone' : r() < 0.2 ? 'brick' : 'plaster';
    const fh = 3.0 + r() * 0.3, jet = style === 'timber' && floors > 1 ? 0.35 : 0;
    const wall = pick(sc.wall), trimC = pick(sc.trim);
    const lowMat = style === 'stone' ? Mt.stone : style === 'brick' ? Mt.brick : Mt.plaster;
    const lowTint = style === 'stone' ? '#c8c2b8' : style === 'brick' ? '#e0d6cc' : wall;
    const B0 = (lx, y, lz, sx, sy, sz, mat, o = {}) => { const [px, pz] = P(lx, lz); put(BOX, mat, mat4(px, y, pz, ry, sx, sy, sz), o); };
    const Q0 = (lx, y, lz, face, sx, sy, mat, o = {}) => { const [px, pz] = P(lx, lz); put(PLANE, mat, mat4(px, y, pz, ry + face, sx, sy, 1), o); };
    // plinth + floors
    B0(0, y0 - 0.3, 0, w + 0.35, 1.1, d + 0.35, Mt.stone, { worldUV: 0.35, tint: '#9a968e' });
    B0(0, y0 + 0.25 + fh / 2, 0, w, fh, d, lowMat, { worldUV: style === 'plaster' ? 0.33 : 0.42, tint: lowTint });
    const upH = (floors - 1) * fh;
    if (floors > 1) B0(0, y0 + 0.25 + fh + upH / 2, 0, w + jet * 2, upH, d + jet * 2, Mt.plaster, { worldUV: 0.33, tint: wall });
    const top = y0 + 0.25 + fh * floors;
    // roof: eave-front (ridge along the street) or gable-front
    const gableFront = r() < 0.45, W2 = w + jet * 2, D2 = d + jet * 2;
    const span = gableFront ? W2 : D2, along = gableFront ? D2 : W2, pitch = 0.5 + r() * 0.35, rh = span * pitch;
    const roofTint = pickRoof(h, sc.roof);
    { const [px, pz] = P(0, 0); const rot = ry + (gableFront ? Math.PI / 2 : 0);
      put(gableRoof(along, span, rh, 0.55), Mt.roof, mat4(px, top, pz, rot), { tint: roofTint });
      put(gableWall(along, span, rh), floors > 1 || style === 'plaster' || style === 'timber' ? Mt.plaster : lowMat, mat4(px, top, pz, rot), { worldUV: 0.33, tint: floors > 1 ? wall : lowTint }); }
    // chimney
    if (r() < 0.8) { const lx = (r() - 0.5) * (w - 2.5), lz = (r() < 0.5 ? -1 : 1) * (d / 2 - 1.2); B0(lx, top + rh * 0.55, lz, 0.8, rh + 1.6, 0.8, Mt.stone, { worldUV: 0.5, tint: '#b0aaa0' }); if (r() < 0.22 && smokeN++ < 26) { const [cx, cz] = P(lx, lz); ctx.smokeAt(cx, top + rh + 1.5, cz); } }
    // timber framing on the upper floors
    if (style === 'timber' && floors > 1) {
      const y1 = y0 + 0.25 + fh, tint = trimC;
      for (const e of [-1, 1]) {
        const fz = e * (D2 / 2 + 0.03), fx = e * (W2 / 2 + 0.03);
        for (let lx = -W2 / 2 + 0.15; lx <= W2 / 2 - 0.1; lx += W2 / Math.max(2, Math.round(W2 / 1.6))) B0(lx, y1 + upH / 2, fz, 0.2, upH, 0.08, Mt.wood, { tint });
        for (let lz = -D2 / 2 + 0.15; lz <= D2 / 2 - 0.1; lz += D2 / Math.max(2, Math.round(D2 / 1.6))) B0(fx, y1 + upH / 2, lz, 0.08, upH, 0.2, Mt.wood, { tint });
        for (let f = 0; f < floors - 1; f++) { const yy = y1 + f * fh + 0.12; B0(0, yy, fz, W2 + 0.1, 0.22, 0.1, Mt.wood, { tint }); B0(fx, yy, 0, 0.1, 0.22, D2 + 0.1, Mt.wood, { tint }); }
        B0(0, top - 0.1, fz, W2 + 0.1, 0.22, 0.1, Mt.wood, { tint });
      }
    }
    // windows (+ shutters) on every floor and facade, door on the street side
    const shut = r() < 0.7 ? pick(sc.shut) : null, boxes = r() < 0.4;
    const doorAt = (r() - 0.5) * Math.max(0, w - 3.4);
    for (let f = 0; f < floors; f++) {
      const yy = y0 + 0.25 + f * fh + fh * 0.55, o = f > 0 ? jet : 0;
      const facades = [[0, (d / 2 + o + 0.04), w + o * 2, 0], [0, -(d / 2 + o + 0.04), w + o * 2, Math.PI], [(w / 2 + o + 0.04), 0, d + o * 2, Math.PI / 2], [-(w / 2 + o + 0.04), 0, d + o * 2, -Math.PI / 2]];
      for (const [fx, fz, len, face] of facades) {
        const n = Math.max(1, Math.floor((len - 0.8) / 2.3));
        for (let k = 0; k < n; k++) {
          const t = -len / 2 + (k + 0.5) * (len / n);
          const isFront = face === 0;
          if (f === 0 && isFront && Math.abs(t - doorAt) < 1.4) continue;
          if (f === 0 && !isFront && r() < 0.35) continue;
          const lx = fx !== 0 ? fx : t, lz = fx !== 0 ? t : fz;
          const lit = r() < 0.5;
          Q0(lx, yy, lz, face, 0.8, 1.1, lit ? Mt.window : Mt.dark);
          if (shut) for (const e of [-1, 1]) {
            const sx = fx !== 0 ? fx * 1.003 : t + e * 0.62, sz = fx !== 0 ? t + e * 0.62 * (face > 0 ? -1 : 1) : fz * 1.003;
            Q0(sx, yy, sz, face, 0.42, 1.12, Mt.wood, { tint: shut });
          }
          B0(fx !== 0 ? fx : t, yy - 0.62, fx !== 0 ? t : fz, fx !== 0 ? 0.16 : 1.0, 0.1, fx !== 0 ? 1.0 : 0.16, Mt.stone, { worldUV: 0.6, tint: '#bdb6aa' });
          B0(fx !== 0 ? fx : t, yy + 0.64, fx !== 0 ? t : fz, fx !== 0 ? 0.14 : 1.05, 0.12, fx !== 0 ? 1.05 : 0.14, Mt.stone, { worldUV: 0.6, tint: '#aaa398' });      // lintel
          if (boxes && isFront && k % 2 === 0) {                                                                                                                              // flower box
            B0(t, yy - 0.78, fz + 0.14, 0.95, 0.2, 0.26, Mt.wood, { tint: '#5a3a22' });
            for (const e of [-0.3, 0, 0.3]) B0(t + e, yy - 0.62, fz + 0.14, 0.26, 0.22, 0.24, Mt.plaster, { tint: r() < 0.5 ? '#3f7a3a' : pick(FLOWER) });
          }
        }
      }
    }
    Q0(doorAt, y0 + 0.25 + 1.05, d / 2 + 0.05, 0, 1.15, 2.1, Mt.wood, { tint: '#4a3020' });
    B0(doorAt, y0 + 0.25 + 2.2, d / 2 + 0.08, 1.5, 0.22, 0.14, Mt.stone, { worldUV: 0.6, tint: '#a8a196' });
    // facade detail: eave band, ridge cap, door canopy, corner quoins, shop sign, ivy
    for (const e of [-1, 1]) { B0(0, top - 0.14, e * (D2 / 2 + 0.07), W2 + 0.3, 0.3, 0.16, Mt.wood, { tint: trimC }); B0(e * (W2 / 2 + 0.07), top - 0.14, 0, 0.16, 0.3, D2 + 0.3, Mt.wood, { tint: trimC }); }
    { const [px, pz] = P(0, 0); put(BOX, Mt.roof, mat4(px, top + rh + 0.06, pz, ry + (gableFront ? Math.PI / 2 : 0), along + 1.1, 0.2, 0.42), { tint: '#2a2c34' }); }
    if (r() < 0.4) {
      B0(doorAt, y0 + 0.25 + 2.62, d / 2 + 0.5, 2.0, 0.14, 1.2, Mt.roof, { tint: roofTint });
      for (const e of [-0.85, 0.85]) B0(doorAt + e, y0 + 0.25 + 1.3, d / 2 + 0.95, 0.14, 2.6, 0.14, Mt.wood, { tint: '#4a3020' });
    }
    if (style !== 'timber' && r() < 0.45) for (const [cx, cz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) for (let q = 0; q < 4; q++) B0(cx * (w / 2 + 0.01), y0 + 0.5 + q * 0.62, cz * (d / 2 + 0.01), 0.5 + (q % 2) * 0.16, 0.34, 0.5 + (q % 2) * 0.16, Mt.stone, { worldUV: 0.6, tint: '#d4cdc0' });
    if (floors > 1 && r() < 0.35) { B0(doorAt + 1.9, y0 + 0.25 + 3.1, d / 2 + 0.5, 0.08, 0.08, 1.0, Mt.wood, { tint: '#2a2a2e' }); B0(doorAt + 1.9, y0 + 0.25 + 2.7, d / 2 + 0.95, 0.9, 0.55, 0.06, Mt.wood, { tint: pick(['#c9a24a', '#8fb8ff', '#d8d2c0', '#c0524a']) }); }
    if (r() < 0.3) { const sx = (r() < 0.5 ? -1 : 1) * (w / 2 + 0.04), vz = (r() - 0.5) * (d - 3); for (let q = 0; q < 2; q++) B0(sx, y0 + 0.25 + 1.5 + q * 1.1, vz + (q ? 0.7 : 0), 0.08, 2.3 - q * 0.5, 1.7 - q * 0.4, Mt.plaster, { tint: q ? '#3f7a3a' : '#2f6234' }); }
    ctx.pick({ x, z, y0: 0, y1: top + rh, r: Math.max(w, d) / 2 }, 'house');
  }

  function church(h) {
    const { x, z, ry, w, d } = h, c = Math.cos(ry), s = Math.sin(ry);
    const P = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
    const y0 = Math.max(0.2, Math.min(...corners(x, z, ry, w, d).map(([a, b]) => height(a, b))));
    const B0 = (lx, y, lz, sx, sy, sz, mat, o = {}) => { const [px, pz] = P(lx, lz); put(BOX, mat, mat4(px, y, pz, ry, sx, sy, sz), o); };
    const nave = 11, tw = 6.4, th = 26;
    B0(0, y0 - 0.2, 0, w + 0.8, 1.2, d + 0.8, Mt.stone, { worldUV: 0.3, tint: '#9a968e' });
    B0(0, y0 + nave / 2, -2, w, nave, d - 6, Mt.stone, { worldUV: 0.3, tint: '#d8d2c8' });
    { const [px, pz] = P(0, -2); put(gableRoof(d - 6, w, 6.5, 0.6), Mt.roof, mat4(px, y0 + nave, pz, ry + Math.PI / 2), { tint: '#7c8fc0' }); put(gableWall(d - 6, w, 6.5), Mt.stone, mat4(px, y0 + nave, pz, ry + Math.PI / 2), { worldUV: 0.3, tint: '#d8d2c8' }); }
    // bell tower at the street end with a tall spire
    B0(0, y0 + th / 2, d / 2 - 3.4, tw, th, tw, Mt.stone, { worldUV: 0.3, tint: '#e2dcd2' });
    B0(0, y0 + th + 0.3, d / 2 - 3.4, tw + 0.8, 0.6, tw + 0.8, Mt.stone, { worldUV: 0.4, tint: '#a8a196' });
    { const [px, pz] = P(0, d / 2 - 3.4); put(new THREE.ConeGeometry(tw * 0.74, 13, 4, 1, true), Mt.roof, mat4(px, y0 + th + 6.8, pz, ry + Math.PI / 4), { tint: '#6f86c8' });
      put(new THREE.SphereGeometry(0.45, 8, 6), M.gold, mat4(px, y0 + th + 13.6, pz)); }
    for (const e of [-1, 1]) for (const yy of [th - 4, th - 10]) { B0(e * (tw / 2 + 0.03), y0 + yy, d / 2 - 3.4, 0.05, 2.6, 1.1, Mt.dark); B0(0, y0 + yy, d / 2 - 3.4 + e * (tw / 2 + 0.03), 1.1, 2.6, 0.05, yy === th - 10 ? Mt.window : Mt.dark); }
    for (let k = -3; k <= 2; k++) for (const e of [-1, 1]) B0(e * (w / 2 + 0.04), y0 + 6, k * 2.8 - 2, 0.06, 4.2, 1.1, k % 2 ? Mt.window : Mt.dark);
    B0(0, y0 + 2, d / 2 + 0.05, 2.2, 4, 0.1, Mt.wood, { tint: '#4a3020' });
    ctx.pick({ x, z, y0: 0, y1: y0 + th + 14, r: Math.max(w, d) / 2 }, 'church');
    h.bell = P(0, d / 2 - 3.4);
  }

  // ------------------------------------------------ market: stalls, carts, crates around a well
  if (MK) {
    ctx.hex('building_well_blue', MK.x, height(MK.x, MK.z) + 0.08, MK.z, 0.3, 5.2);
    ctx.pick({ x: MK.x, z: MK.z, y0: 0, y1: 6, r: MK.r }, 'market');
    const ring = 9.5, n = 9;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * 6.283 + 0.2, x = MK.x + Math.cos(a) * ring, z = MK.z + Math.sin(a) * ring, face = Math.atan2(MK.x - x, MK.z - z);
      if (roadDist(x, z, 'cobble') < -1.5 && Math.abs(Math.sin(a - Math.atan2(L.GATE.nz, L.GATE.nx))) < 0.35) continue;   // keep the main street clear
      ctx.inst(k % 3 === 2 ? 'cart' : 'stall', x, z, face, k % 3 === 2 ? 1.5 : 1.35);
      if (k % 2 === 0) ctx.inst('crate', x + Math.cos(a + 1.6) * 2, z + Math.sin(a + 1.6) * 2, r() * 6, 1.3);
      else ctx.inst('barrel', x + Math.cos(a - 1.6) * 2, z + Math.sin(a - 1.6) * 2, r() * 6, 1.4);
    }
  }
  // ------------------------------------------------ street lamps along the ring street, garden trees between houses
  const ringR = ROADS.find((q) => q.name === 'ring');
  if (ringR) {
    let acc = 0;
    for (let i = 0; i < ringR.pts.length - 1; i++) {
      const [ax, az] = ringR.pts[i], [bx, bz] = ringR.pts[i + 1], len = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / len, nz = (bx - ax) / len;
      for (let s2 = 6; s2 < len; s2 += 24) { const t = s2 / len, x = ax + (bx - ax) * t + nx * (ringR.w / 2 + 0.6) * (acc++ % 2 ? 1 : -1), z = az + (bz - az) * t + nz * (ringR.w / 2 + 0.6) * (acc % 2 ? -1 : 1); if (L.distPolyline(L.RIVER, x, z) < 9) continue; ctx.torch(x, height(x, z) + 3.6, z, { pool: true, post: true }); }
    }
  }
  ctx.innerTrees = ctx.innerTrees || [];
  for (let k = 0; k < 900 && ctx.innerTrees.length < 26; k++) {
    const a = r() * 6.283, d0 = 74 + r() * 60, x = Math.cos(a) * d0, z = Math.sin(a) * d0;
    if (!ok(x, z, 0, 3.2, 3.2, 0.6)) continue;
    ctx.innerTrees.push([x, z]); placed.push({ x, z, hd: 2.4, C: corners(x, z, 0, 4.4, 4.4) });
  }
  // ------------------------------------------------ hamlets in the open country (hamlets.js): same houses as the town, one static batch
  for (const H of planHamlets(ROADS)) {
    blockTarget(H.houses);                                           // one battle target per hamlet
    for (const h of H.houses) townHouse(h);
    for (const q of H.props) {
      if (q.k === 'well') ctx.hex('building_well_blue', q.x, height(q.x, q.z) + 0.08, q.z, 0.3, 4.4);
      else ctx.inst(q.k, q.x, q.z, q.ry, q.s);
    }
  }
  B.bid(0);
  return { houses: lots, church: lots.find((h) => h.kind === 'church'), mats: Mt };
}
