// Worksites -> meshes (p38).  worksites.js says WHAT stands on a site at a level (kit pieces + counts); this module bakes it:
//   * the kit pieces (kit_ws.glb: KayKit / Quaternius / Kenney CC0 buildings and props) -> one merged mesh per material per site (village.js bakePieces),
//   * the procedural parts that no kit has (crop plots, glass houses with plant rows, oil pits with windlass derricks, mine rails, the quarry crane, hay and troughs)
//     -> one vertex-coloured triangle soup per site (+ a small transparent one for the glass).
//   buildWorksites(scene, gltf, hf, { shadows, castle }) -> { group, rebuild(castle | { kind: lv }), levels(), flames, update(t) }
// A site is rebuilt only when its level changes; everything is placed from the site's x, z, ry so the layout editor (p40) can move a site and call rebuild().
import * as THREE from 'three';
import { bakePieces } from './village.js';
import { sites, pieces, counts, wsLevel, tierOf, countAt, WS_KINDS } from './worksites.js';
import { rng } from './noise.js';

const col = (hex) => new THREE.Color(hex);
class Soup {
  constructor() { this.p = []; this.c = []; }
  tri(a, b, c, k) { for (const v of [a, b, c]) { this.p.push(v[0], v[1], v[2]); this.c.push(k.r, k.g, k.b); } }
  quad(a, b, c, d, k) { this.tri(a, b, c, k); this.tri(a, c, d, k); }
  mesh(mat, name, shadows) {
    if (!this.p.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeVertexNormals(); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat); m.name = name; m.castShadow = !!shadows; m.receiveShadow = true; return m;
  }
}
const MAT = {
  soup: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 0.4 }),
  glass: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.4 }),
  oil: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.12, metalness: 0.35, side: THREE.DoubleSide, envMapIntensity: 1.6 }),
};
const C = {
  wood: [col('#7a5a3a'), col('#6b4e32'), col('#8a6a46')], dark: col('#3b2d20'), stone: col('#9aa1ab'), stone2: col('#7d8591'), soil: col('#5b4329'), soil2: col('#6c5030'),
  wheat: col('#cfae4f'), green: col('#5f9540'), green2: col('#4a7d34'), corn: col('#d6bd52'), bean: col('#4f8038'), tomato: col('#c0392b'), leaf: col('#3f8a3a'),
  glassC: col('#a9cdea'), glassE: col('#7fa5c8'), frame: col('#d9dde3'), rope: col('#c9b78a'), rail: col('#4b4f58'), tie: col('#5a4430'), hay: col('#d2b35e'), hay2: col('#b99a46'),
  pool: col('#0b0a0c'), pool2: col('#1a1620'), iron: col('#5d6571'), orepile: col('#6b5a52'), steel: col('#8d96a4'), goldp: col('#d9b43c'),
};

function frame(site, hf) {
  const c = Math.cos(site.ry), s = Math.sin(site.ry);
  const W = (lx, lz) => [site.x + lx * c + lz * s, site.z - lx * s + lz * c];
  const y0 = hf(site.x, site.z);
  return { c, s, W, y0, G: (lx, lz) => { const [x, z] = W(lx, lz); return hf(x, z); } };
}

// a soup with local-frame primitives for one site
function maker(site, hf) {
  const F = frame(site, hf), S = new Soup(), Gl = new Soup(), Oil = new Soup();
  const P3 = (lx, ly, lz) => { const [x, z] = F.W(lx, lz); return [x, ly, z]; };
  // oriented box: centre (lx, lz), bottom y (absolute above the pad), size, rotation about y (local)
  const box = (T, lx, lz, y, sx, sy, sz, ry, k) => {
    const c = Math.cos(ry), s = Math.sin(ry);
    const q = (u, v) => P3(lx + u * c + v * s, y, lz - u * s + v * c);
    const lo = [[-sx / 2, -sz / 2], [sx / 2, -sz / 2], [sx / 2, sz / 2], [-sx / 2, sz / 2]].map(([u, v]) => { const [a, , b] = q(u, v); return [a, F.y0 + y, b]; });
    const hi = lo.map(([a, , b]) => [a, F.y0 + y + sy, b]);
    const sh = (f) => new THREE.Color(k.r * f, k.g * f, k.b * f);
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; T.quad(lo[i], lo[j], hi[j], hi[i], sh(0.86 + 0.14 * (i & 1))); }
    T.quad(hi[0], hi[1], hi[2], hi[3], sh(1.1));
  };
  const cyl = (T, lx, lz, y, r, h, seg, k, rt = r) => {
    const ring = (rr, yy) => Array.from({ length: seg }, (_, i) => { const a = (i / seg) * 6.283; return P3(lx + Math.cos(a) * rr, F.y0 + yy, lz + Math.sin(a) * rr); });
    const a = ring(r, y), b = ring(rt, y + h);
    for (let i = 0; i < seg; i++) { const j = (i + 1) % seg; T.quad(a[i], a[j], b[j], b[i], new THREE.Color(k.r * (0.82 + 0.18 * Math.cos(i / seg * 6.283)), k.g * (0.82 + 0.18 * Math.cos(i / seg * 6.283)), k.b * (0.82 + 0.18 * Math.cos(i / seg * 6.283)))); }
    const cen = P3(lx, F.y0 + y + h, lz); for (let i = 0; i < seg; i++) T.tri(cen, b[i], b[(i + 1) % seg], k);
  };
  // ground-hugging disc / strip (every vertex follows the terrain)
  const disc = (T, lx, lz, r, k, lift = 0.14, seg = 18, rings = 3) => {
    const V = (rr, i) => { const a = (i / seg) * 6.283, [x, z] = F.W(lx + Math.cos(a) * rr, lz + Math.sin(a) * rr); return [x, hf(x, z) + lift, z]; };
    const [cx, cz] = F.W(lx, lz), C0 = [cx, hf(cx, cz) + lift, cz];
    for (let g = 0; g < rings; g++) for (let i = 0; i < seg; i++) {
      const r0 = (r * g) / rings, r1 = (r * (g + 1)) / rings;
      if (g === 0) T.tri(C0, V(r1, i), V(r1, i + 1), k); else T.quad(V(r0, i), V(r1, i), V(r1, i + 1), V(r0, i + 1), k);
    }
  };
  const gquad = (T, lx0, lz0, lx1, lz1, k, lift = 0.12, nx = 3, nz = 3) => {   // terrain-following rectangle (x0..x1, z0..z1), local axes
    const V = (u, v) => { const [x, z] = F.W(lx0 + (lx1 - lx0) * u, lz0 + (lz1 - lz0) * v); return [x, hf(x, z) + lift, z]; };
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) T.quad(V(i / nx, j / nz), V((i + 1) / nx, j / nz), V((i + 1) / nx, (j + 1) / nz), V(i / nx, (j + 1) / nz), k);
  };
  return { F, S, Gl, Oil, P3, box, cyl, disc, gquad };
}

// ------------------------------------------------------------------ the procedural parts of each kind
const PROC = {
  farm(M, lv, R) {
    const n = counts({ kind: 'farm' }, lv).plots, kinds = [C.wheat, C.green, C.corn, C.bean, C.wheat, C.green2, C.corn, C.bean];
    const slots = [[-20, -2], [20, -2], [-20, 7], [20, 7], [-20, -11], [20, -11], [-6, -22], [8, -22]];
    for (let i = 0; i < n; i++) {
      const [cx, cz] = slots[i], w = 9, d = 7, k = kinds[i];
      M.gquad(M.S, cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, i & 1 ? C.soil : C.soil2, 0.12, 3, 3);
      for (let r = 0; r < 5; r++) {                         // crop rows: low ridges
        const z = cz - d / 2 + 0.8 + r * 1.35, jit = (R() - 0.5) * 0.1;
        M.box(M.S, cx, z, 0.05, w - 1.2, 0.55 + R() * 0.15, 0.7, jit, new THREE.Color(k.r * (0.92 + R() * 0.16), k.g * (0.92 + R() * 0.16), k.b * (0.92 + R() * 0.16)));
      }
    }
    // scarecrow poles are kit pieces; a haystack beside the barn
    if (lv >= 4) { M.cyl(M.S, -10, -19, 0, 2.0, 2.4, 9, C.hay, 0.2); M.cyl(M.S, -10, -19, 2.4, 0.6, 0.9, 9, C.hay2, 0.05); }
    if (lv >= 12) { M.cyl(M.S, 0, -21, 0, 1.8, 2.2, 9, C.hay, 0.2); M.cyl(M.S, 0, -21, 2.2, 0.5, 0.8, 9, C.hay2, 0.05); }
  },
  greenhouse(M, lv, R) {
    const n = counts({ kind: 'greenhouse' }, lv).houses, slots = [[-6.2, -9], [6.2, -9], [-6.2, -2.6], [6.2, -2.6], [-6.2, 3.8], [6.2, 3.8]];
    for (let i = 0; i < n; i++) {
      const [cx, cz] = slots[i], L = 11, W = 5.2, H = 2.7, Rg = 4.1;
      const hl = L / 2, hw = W / 2;
      M.box(M.S, cx, cz, 0, L + 0.5, 0.35, W + 0.5, 0, C.stone2);                              // footing
      for (let p = 0; p <= 4; p++) {                                                           // frame ribs (white) every 2.75 m
        const x = cx - hl + (L * p) / 4;
        for (const sd of [-1, 1]) M.box(M.S, x, cz + sd * hw, 0.3, 0.16, H - 0.3, 0.16, 0, C.frame);
        // roof rafters: two slanted bars
        for (const sd of [-1, 1]) { const a = [x, H, cz + sd * hw], b = [x, Rg, cz], dz = b[2] - a[2], dy = b[1] - a[1], len = Math.hypot(dz, dy), ang = Math.atan2(dy, dz); M.box(M.S, x, cz + sd * hw * 0.5, H + dy / 2 - 0.08, 0.14, 0.16, len, 0, C.frame); void ang; }
      }
      M.box(M.S, cx, cz, Rg - 0.1, L + 0.2, 0.18, 0.18, 0, C.frame);                           // ridge beam
      // glass: walls + roof slopes + gables
      const q = (x, y, z) => M.P3(x, M.F.y0 + y, z), g = C.glassC, ge = C.glassE;
      for (const sd of [-1, 1]) {
        M.Gl.quad(q(cx - hl, 0.35, cz + sd * hw), q(cx + hl, 0.35, cz + sd * hw), q(cx + hl, H, cz + sd * hw), q(cx - hl, H, cz + sd * hw), g);
        M.Gl.quad(q(cx - hl, H, cz + sd * hw), q(cx + hl, H, cz + sd * hw), q(cx + hl, Rg, cz), q(cx - hl, Rg, cz), ge);
      }
      for (const sd of [-1, 1]) { M.Gl.quad(q(cx + sd * hl, 0.35, cz - hw), q(cx + sd * hl, 0.35, cz + hw), q(cx + sd * hl, H, cz + hw), q(cx + sd * hl, H, cz - hw), g); M.Gl.tri(q(cx + sd * hl, H, cz - hw), q(cx + sd * hl, H, cz + hw), q(cx + sd * hl, Rg, cz), ge); }
      // the plants inside: two long beds with rows of leafy plants + red fruit
      for (const sd of [-1, 1]) {
        M.box(M.S, cx, cz + sd * 1.25, 0.2, L - 1.6, 0.35, 1.0, 0, C.soil);
        for (let p = 0; p < 9; p++) {
          const x = cx - hl + 1.1 + p * ((L - 2.2) / 8);
          M.cyl(M.S, x, cz + sd * 1.25, 0.5, 0.42, 0.7 + R() * 0.35, 6, C.leaf, 0.15);
          if (R() < 0.5) M.box(M.S, x + 0.15, cz + sd * 1.25 + 0.2, 0.9, 0.18, 0.18, 0.18, 0.4, C.tomato);
        }
      }
    }
  },
  oil(M, lv, R) {
    const n = counts({ kind: 'oil' }, lv).wells, t = tierOf(lv);
    const spots = [[0, 0, 3.6], [-8.5, -5, 2.8], [8, -4, 2.8], [-5, 5.5, 2.4], [6.5, 6, 2.4], [-12, 1, 2.2], [12, 2, 2.2]];
    for (let i = 0; i < n; i++) {
      const [cx, cz, r] = spots[i];
      M.disc(M.Oil, cx, cz, r, C.pool, 0.1, 16, 2); M.disc(M.Oil, cx + r * 0.2, cz - r * 0.1, r * 0.55, C.pool2, 0.12, 12, 1);
      for (let k = 0; k < 12; k++) { const a = (k / 12) * 6.283 + R() * 0.3, rr = r + 0.35; M.box(M.S, cx + Math.cos(a) * rr, cz + Math.sin(a) * rr, 0, 0.9 + R() * 0.5, 0.5 + R() * 0.3, 0.8, a, k & 1 ? C.stone : C.stone2); }
      // windlass: two posts + a crossbeam + crank + hanging bucket (a Crusades-era naphtha well)
      const px = cx, pz = cz + r + 1.2;
      for (const sd of [-1, 1]) M.box(M.S, px + sd * 1.1, pz, 0, 0.22, 3.3, 0.22, 0, C.wood[0]);
      M.box(M.S, px, pz, 3.0, 2.9, 0.22, 0.26, 0, C.wood[1]);
      M.cyl(M.S, px, pz, 2.55, 0.18, 0.1, 6, C.dark, 0.18);
      M.box(M.S, px, pz - 0.3, 0.9, 0.04, 1.65, 0.04, 0, C.rope);
      M.cyl(M.S, px, pz - 0.5, 0.55, 0.28, 0.42, 7, C.dark, 0.3);
    }
    // plank walkways between the pits
    if (n >= 2) for (const [x0, z0, x1, z1] of [[-8.5, -2, -1, -2], [8, -1.5, 1, -1.5]].slice(0, Math.min(2, n - 1))) { const len = Math.hypot(x1 - x0, z1 - z0); M.box(M.S, (x0 + x1) / 2, (z0 + z1) / 2, 0.04, len, 0.12, 1.2, 0, C.tie); }
    // a tall flare stack at the high tiers (the flame itself is a light sprite, see flames)
    if (t >= 4) { M.cyl(M.S, 14, -13, 0, 0.45, 8.5, 8, C.iron, 0.3); M.cyl(M.S, 14, -13, 8.5, 0.55, 0.5, 8, C.dark, 0.35); }
  },
  iron(M, lv, R) { rails(M, lv, R, C.orepile); },
  gold(M, lv, R) { rails(M, lv, R, C.goldp); },
  quarry(M, lv, R) {
    // a timber crane (lv >= 10): A-frame, boom, rope and a hanging stone block
    if (lv >= 10) {
      const bx = 9, bz = -3;
      for (const sd of [-1, 1]) { M.box(M.S, bx + sd * 0.9, bz, 0, 0.3, 7.5, 0.3, 0, C.wood[0]); M.box(M.S, bx + sd * 0.6, bz - 2.2, 0, 0.3, 6, 0.3, 0, C.wood[1]); }
      M.box(M.S, bx, bz, 6.9, 2.1, 0.3, 0.3, 0, C.wood[2]);
      M.box(M.S, bx + 3.1, bz + 1.5, 7.2, 0.28, 0.28, 8.4, 0.35, C.wood[1]);                      // boom
      M.box(M.S, bx + 5.6, bz + 5.6, 3.2, 0.05, 4.3, 0.05, 0, C.rope);
      M.box(M.S, bx + 5.6, bz + 5.6, 2.2, 1.2, 1.0, 1.0, 0.4, C.stone);
    }
    // rubble in front of the face
    for (let i = 0; i < 9; i++) M.box(M.S, -14 + R() * 28, -14 + R() * 8, 0, 0.6 + R() * 0.9, 0.4 + R() * 0.5, 0.6 + R() * 0.8, R() * 3, R() < 0.5 ? C.stone : C.stone2);
  },
  livestock(M, lv, R) {
    const pens = counts({ kind: 'livestock' }, lv).pens, cells = [[-9, 4], [9, 4], [-9, 16], [9, 16]];
    for (let p = 0; p < pens; p++) {
      const [cx, cz] = cells[p];
      M.gquad(M.S, cx - 6, cz - 4, cx + 6, cz + 4, C.soil2, 0.12, 3, 2);                         // trampled floor
      M.box(M.S, cx - 3, cz + 2.6, 0, 3.2, 0.45, 0.8, 0, C.wood[0]);                             // trough
      M.cyl(M.S, cx + 3.4, cz - 1.6, 0, 1.1, 1.0, 8, C.hay, 0.4);                                // hay
    }
    M.cyl(M.S, -17, -4, 0, 2.2, 2.6, 9, C.hay, 0.2); M.cyl(M.S, -17, -4, 2.6, 0.6, 0.9, 9, C.hay2, 0.05);
    if (lv >= 10) { M.cyl(M.S, 17, -3, 0, 2.0, 2.4, 9, C.hay, 0.2); M.cyl(M.S, 17, -3, 2.4, 0.5, 0.8, 9, C.hay2, 0.05); }
  },
  lumber(M, lv, R) { M.disc(M.S, -2, 5, 11, col('#a98a5a'), 0.14, 18, 2); },        // the sawdust yard
  fishery(M, lv, R) { for (const x of [-15, -10, 10, 15]) M.box(M.S, x, 8.5, 0, 0.18, 1.5, 0.18, 0, C.wood[0]); },     // net poles
  slaughter(M, lv, R) { },
};
function rails(M, lv, R, ore) {
  // two tracks (x = -3, +3) from the mine mouth to the front, sleepers + rails; an ore heap at the end
  for (const x of [-3, 3]) {
    const z0 = -3, z1 = 15;
    for (let z = z0; z <= z1; z += 0.9) M.box(M.S, x, z, 0.03, 1.7, 0.08, 0.28, 0, C.tie);
    for (const sd of [-1, 1]) M.box(M.S, x + sd * 0.55, (z0 + z1) / 2, 0.11, 0.1, 0.1, z1 - z0, 0, C.rail);
  }
  const heaps = countAt(lv, 1, 4);
  for (let i = 0; i < heaps; i++) { const hx = -12 + i * 8, hz = 17 + R() * 2; M.cyl(M.S, hx, hz, 0, 2.4, 1.6, 7, ore, 0.5); M.cyl(M.S, hx + 1.6, hz + 0.6, 0, 1.3, 0.9, 6, ore, 0.3); }
}

// ------------------------------------------------------------------ build / rebuild
const MINOR = /^ws_(logpile|logs|stump|workbench|ladder|cratelong|crate_wooden|pallet|sack|wheelbarrow|minecart|orecart|barrel|barrelold|barrel_holder|barrel_apples|bucket_wooden_1|fishset|nugget|nugget2|goldbars|coin_pile|amphora|chain_coil|cauldron|anvil_log|whetstone|pickaxe_bronze|axe_bronze|rope_1|cage_small|boulder[A-E]|stoneblocks|farmcrate_apple|farmcrate_empty|cart1|cart2|cart3|stall_cart_empty|stall_empty|fishrack)$/;
export const WS_NEAR = 170, WS_FAR = 620;     // m from the camera: small props appear inside WS_NEAR, whole sites vanish beyond WS_FAR
export function buildWorksites(scene, gltf, hf, { shadows = false, castle = 30 } = {}) {
  const group = new THREE.Group(); group.name = 'worksites'; scene.add(group);
  const state = new Map();                         // site id -> { lv, g }
  const flames = [];
  const dispose = (g) => { g.traverse((o) => { if (o.isMesh && o.geometry) o.geometry.dispose(); }); group.remove(g); };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), sc = new THREE.Vector3();
  function buildSite(site, lv) {
    const g = new THREE.Group(); g.name = 'ws:' + site.id;
    if (lv > 0) {
      const c = Math.cos(site.ry), s = Math.sin(site.ry), list = [];
      for (const p of pieces(site, lv)) {
        const wx = site.x + p.x * c + p.z * s, wz = site.z - p.x * s + p.z * c;
        m4.compose(v.set(wx, hf(wx, wz) - 0.04, wz), q.setFromAxisAngle(up, site.ry + p.ry), sc.set(p.s, p.s, p.s));
        list.push({ name: p.n, matrix: m4.clone() });
      }
      if (gltf && list.length) {
        // two bakes: the BIG things (buildings, fences, boats, camels, rock faces) are seen from far; the small props (barrels, carts, tools, racks) only from near by (update())
        const minor = new THREE.Group(); minor.name = 'minor'; g.add(minor); g.userData.minor = minor;
        bakePieces(g, gltf, list.filter((o) => !MINOR.test(o.name)), { shadows, tag: 'ws:' + site.id });
        bakePieces(minor, gltf, list.filter((o) => MINOR.test(o.name)), { shadows: false, tag: 'ws:' + site.id + ':minor' });
      }
      const M = maker(site, hf), R = rng(((site.x * 31) ^ (site.z * 17)) >>> 0 || 5);
      (PROC[site.kind] || (() => {}))(M, lv, R);
      for (const [S, mat, nm] of [[M.S, MAT.soup, 'soup'], [M.Gl, MAT.glass, 'glass'], [M.Oil, MAT.oil, 'oil']]) { const mesh = S.mesh(mat, 'ws:' + site.id + ':' + nm, shadows && nm !== 'glass'); if (mesh) { if (nm === 'glass') mesh.renderOrder = 2; g.add(mesh); } }
    }
    group.add(g); return g;
  }
  function levels(arg) {                           // arg: a castle level, or { kind: level }
    const out = {};
    for (const s of sites()) out[s.id] = typeof arg === 'number' ? wsLevel(s, arg) : Math.max(0, Math.min(30, arg[s.kind] | 0));
    return out;
  }
  function rebuild(arg = castle) {
    const L = levels(arg); let changed = 0;
    for (const s of sites()) {
      const old = state.get(s.id);
      if (old && old.lv === L[s.id] && old.x === s.x && old.z === s.z && old.ry === s.ry) continue;
      if (old) dispose(old.g);
      state.set(s.id, { lv: L[s.id], g: buildSite(s, L[s.id]), x: s.x, z: s.z, ry: s.ry }); changed++;
    }
    return changed;
  }
  rebuild(castle);
  const cp = new THREE.Vector3(); let lastT = -9;
  function update(t, camera) {                        // distance LOD, four times a second
    if (!camera || t - lastT < 0.25) return; lastT = t; camera.getWorldPosition(cp);
    for (const o of state.values()) {
      const d = Math.hypot(cp.x - o.x, cp.z - o.z, cp.y * 0.5);
      o.g.visible = d < WS_FAR; const mn = o.g.userData.minor; if (mn) mn.visible = d < WS_NEAR;
    }
  }
  return { group, rebuild, levels: () => Object.fromEntries([...state].map(([k, o]) => [k, o.lv])), flames, update, sites: () => state };
}
