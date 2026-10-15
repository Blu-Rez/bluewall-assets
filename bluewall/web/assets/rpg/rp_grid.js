// RP1C-R3 — Job A1/1 «collision»: the hero's body against what you SEE.  A lazy ES module (fetched with rpg.js, owner-only; nothing of it is in the boot bundle).
// WHY: the colliders the hero had were the game's own TARGET boxes and house DISCS (made for battle / tapping): some far bigger than the building (an invisible wall 3 m off the church), some smaller (a corner of a
// civic hall you can walk into), and a lot of visible buildings, tents, long timber bars had NO collider at all (screens 15 Oct: the hero walks through them).
// WHAT: one pass over the opaque, static meshes of the scene (castle, planned town + its LOD variants, worksite buildings, storage, defences, props) draws the BODY BAND — every triangle that is not a floor or a roof
// and covers the heights 0.45 .. 1.55 m above the ground (the part of the world that can stop a 1.75 m body) — into ONE bit grid (25 cm cells, 860 x 860 m = 1.5 MB).  From it a SIGNED-FREE distance field is made per
// 32 m tile on demand (exact Euclidean distance transform, 144 x 144 floats, ~1 ms, 40 tiles cached).  The hero's push-out (`push`) reads the field: bilinear distance + gradient = a SMOOTH slide along every
// surface, diagonal ones too (no staircase), no tunnelling (the field is a distance, not a thickness).  `ray` finds where a facade starts (the door module puts the door on the REAL facade, not on the lot's rectangle).
// Nothing is added to the scene, no program, no draw call: pure CPU, built in slices behind the loading card (`build` is async and yields every ~10 ms), 0 per-frame allocation in `d` / `push`.
// Honest limits (printed by `info()` and said in the report): the grid is built when the hero is entered — a building that is moved / finished while she walks is not in it until the next entry; alpha-tested
// meshes (foliage cards), skinned meshes (people / animals) and instanced packs (trees, barrels as packs) are NOT in it (trees keep the game's discs); horizontal slabs (a bridge deck, a table top) are not
// obstacles by design (a bridge's rails are).
const CELL = 0.25, INV = 1 / CELL, EXT = 430, N = Math.round((2 * EXT) / CELL);           // 3440 x 3440 cells
const TB = 128, TM = 10, TW = TB + 2 * TM, NT = Math.ceil(N / TB), CACHE = 40;              // distance-field tiles: 128 cells (32 m) + a 10-cell margin on every side
const BLK = 8, NB = Math.ceil(N / BLK);                                                      // coarse occupancy: 8 x 8 cells = 2 m
const BAND0 = 0.45, BAND1 = 1.55;                                                            // metres above the ground: lower = a curb she steps over, higher = a lintel she walks under
const GS = 4, GN = Math.round((2 * EXT) / GS) + 1;                                           // the coarse ground grid (4 m) the band is measured from
const INF = 1e12;

// ---- pure helpers (exported for the node test) -----------------------------------------------------------------------------------------------------------------------------------------------------------------
// exact squared Euclidean distance transform of a W x W field (f = 0 on a solid cell, INF elsewhere), in place; Felzenszwalb & Huttenlocher
export function edt2(f, W, v, z, g) {
  const d1 = (off, stride) => {
    let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < W; q++) {
      const fq = f[off + q * stride] + q * q; let s = (fq - (f[off + v[k] * stride] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = (fq - (f[off + v[k] * stride] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0; for (let q = 0; q < W; q++) { while (z[k + 1] < q) k++; const p = v[k]; g[q] = (q - p) * (q - p) + f[off + p * stride]; }
    for (let q = 0; q < W; q++) f[off + q * stride] = g[q];
  };
  for (let y = 0; y < W; y++) d1(y * W, 1);
  for (let x = 0; x < W; x++) d1(x, W);
}

export function createGrid(H, S, G = {}) {
  const world = H.world, sc = H.scene;
  const bits = new Uint8Array((N * N + 7) >> 3), occ = new Uint8Array(NB * NB), gnd = new Float32Array(GN * GN);
  const tiles = new Map(), order = []; const v = new Int32Array(TW + 1), zz = new Float64Array(TW + 2), gg = new Float64Array(TW);
  const st = { ready: false, building: false, meshes: 0, tris: 0, band: 0, ms: 0, cells: 0, tiles: 0, built: 0, skipped: {}, used: [] };
  const fh = (x, z) => world.fastHeight(x, z);

  const mark = (ix, iz) => { if (ix < 0 || iz < 0 || ix >= N || iz >= N) return; const i = iz * N + ix; const m = 1 << (i & 7); if (!(bits[i >> 3] & m)) { bits[i >> 3] |= m; occ[((iz / BLK) | 0) * NB + ((ix / BLK) | 0)] = 1; st.cells++; } };
  const solid = (ix, iz) => { if (ix < 0 || iz < 0 || ix >= N || iz >= N) return false; const i = iz * N + ix; return (bits[i >> 3] & (1 << (i & 7))) !== 0; };
  const line = (ax, az, bx, bz) => {                                                       // cell coordinates (floats): every cell the segment touches
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) * 2)); for (let i = 0; i <= n; i++) { const t = i / n; mark(Math.floor(ax + (bx - ax) * t), Math.floor(az + (bz - az) * t)); }
  };
  const fill = (ax, az, bx, bz, cx, cz) => {
    const x0 = Math.floor(Math.min(ax, bx, cx)), x1 = Math.floor(Math.max(ax, bx, cx)), z0 = Math.floor(Math.min(az, bz, cz)), z1 = Math.floor(Math.max(az, bz, cz)); if ((x1 - x0 + 1) * (z1 - z0 + 1) > 40000) return;
    for (let iz = Math.max(0, z0); iz <= Math.min(N - 1, z1); iz++) for (let ix = Math.max(0, x0); ix <= Math.min(N - 1, x1); ix++) {
      const px = ix + 0.5, pz = iz + 0.5, s1 = (px - bx) * (az - bz) - (ax - bx) * (pz - bz), s2 = (px - cx) * (bz - cz) - (bx - cx) * (pz - cz), s3 = (px - ax) * (cz - az) - (cx - ax) * (pz - az);
      if (!((s1 < 0 || s2 < 0 || s3 < 0) && (s1 > 0 || s2 > 0 || s3 > 0))) mark(ix, iz);
    }
  };
  const ground = (x, z) => {                                                                 // bilinear on the 4 m ground grid
    let gx = (x + EXT) / GS, gz = (z + EXT) / GS; if (gx < 0) gx = 0; else if (gx > GN - 1.001) gx = GN - 1.001; if (gz < 0) gz = 0; else if (gz > GN - 1.001) gz = GN - 1.001;
    const i = gx | 0, j = gz | 0, fx = gx - i, fz = gz - j, a = gnd[j * GN + i], b = gnd[j * GN + i + 1], c = gnd[(j + 1) * GN + i], d = gnd[(j + 1) * GN + i + 1];
    return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz;
  };

  // which meshes count: opaque, static, not hers (doors / markers / ramps), not sky / terrain / water / ribbons, not people / packs
  const SKIP_SELF = new Set(['sky', 'terrain', 'water', 'backdrop0', 'backdrop1', 'streets', 'rp-ramps', 'rp-doors']);
  const SKIP_PATH = /crowd|pack#rp|attackerCamp|water-life|bank-life|waterfall|rp-ramps|rp-doors/;
  const LATE_OK = /late:(townplan|worksites|defenses|deffield|watchtower|windmill|watermill|blacksmith|barn|silo|coop|tent)/;
  function collect() {
    const out = [], skipped = st.skipped = {}; const why = (k) => { skipped[k] = (skipped[k] || 0) + 1; };
    const walk = (o, path, heroSub) => {
      const hero = heroSub || (o.userData && (o.userData.rpHero || o.userData.rpMarker)); const nm = path + '/' + (o.name || ''); if (hero) return;
      if (o.isMesh && o.geometry) {
        if (o.isInstancedMesh) why('instanced'); else if (o.isSkinnedMesh) why('skinned'); else if (SKIP_SELF.has(o.name)) why('named');
        else {
          const m = Array.isArray(o.material) ? o.material[0] : o.material, g = o.geometry, P = g.attributes && g.attributes.position;
          if (!m || m.transparent || m.alphaTest > 0 || m.visible === false) why('transparent'); else if (!P || P.isInterleavedBufferAttribute || P.itemSize < 3) why('geometry');
          else if (path.includes('/late-stage/late:') && !LATE_OK.test(path)) why('late-other'); else if (SKIP_PATH.test(nm)) why('path'); else out.push(o);
        }
      }
      if (SKIP_SELF.has(o.name) && o.name !== 'terrain') return;
      for (const c of o.children) walk(c, path + '/' + (o.name || ''), false);
    };
    for (const c of sc.children) walk(c, '', false); return out;
  }
  const tick = () => new Promise((r) => setTimeout(r, 0));
  async function build(opt = {}) {
    if (st.building) return; st.building = true; st.ready = false; const t0 = performance.now(); bits.fill(0); occ.fill(0); tiles.clear(); order.length = 0; st.cells = 0; st.tris = 0; st.band = 0; st.used = [];
    sc.updateMatrixWorld(true);
    for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) gnd[j * GN + i] = fh(i * GS - EXT, j * GS - EXT);
    const BR = ((S.nav && S.nav.bridges) || []).map((b) => ({ x: b.x, z: b.z, r2: (Math.hypot(b.len, b.wid) / 2 + 4) ** 2 })), deck = G.deck;   // a bridge deck is the ground on the bridge (the band is measured from it, not from the moat bed)
    const nearBr = (x, z) => { for (let q = 0; q < BR.length; q++) { const dx = x - BR[q].x, dz = z - BR[q].z; if (dx * dx + dz * dz < BR[q].r2) return true; } return false; };
    const CV = (G.carve ? G.carve() : []);
    const meshes = collect(); st.meshes = meshes.length; let tc = performance.now(), done = 0;
    for (const o of meshes) {
      const g = o.geometry, P = g.attributes.position, pa = P.array, I = g.index, ia = I ? I.array : null, nTri = I ? (I.count / 3) | 0 : (P.count / 3) | 0, mw = o.matrixWorld.elements; let used = 0;
      const ident = mw[0] === 1 && mw[5] === 1 && mw[10] === 1 && mw[12] === 0 && mw[13] === 0 && mw[14] === 0 && mw[1] === 0 && mw[2] === 0 && mw[4] === 0 && mw[6] === 0 && mw[8] === 0 && mw[9] === 0;
      for (let t = 0; t < nTri; t++) {
        const a = ia ? ia[t * 3] : t * 3, b = ia ? ia[t * 3 + 1] : t * 3 + 1, c = ia ? ia[t * 3 + 2] : t * 3 + 2; let ax, ay, az, bx, by, bz, cx, cy, cz;
        if (ident) { ax = pa[a * 3]; ay = pa[a * 3 + 1]; az = pa[a * 3 + 2]; bx = pa[b * 3]; by = pa[b * 3 + 1]; bz = pa[b * 3 + 2]; cx = pa[c * 3]; cy = pa[c * 3 + 1]; cz = pa[c * 3 + 2]; }
        else {
          let x = pa[a * 3], y = pa[a * 3 + 1], z = pa[a * 3 + 2]; ax = mw[0] * x + mw[4] * y + mw[8] * z + mw[12]; ay = mw[1] * x + mw[5] * y + mw[9] * z + mw[13]; az = mw[2] * x + mw[6] * y + mw[10] * z + mw[14];
          x = pa[b * 3]; y = pa[b * 3 + 1]; z = pa[b * 3 + 2]; bx = mw[0] * x + mw[4] * y + mw[8] * z + mw[12]; by = mw[1] * x + mw[5] * y + mw[9] * z + mw[13]; bz = mw[2] * x + mw[6] * y + mw[10] * z + mw[14];
          x = pa[c * 3]; y = pa[c * 3 + 1]; z = pa[c * 3 + 2]; cx = mw[0] * x + mw[4] * y + mw[8] * z + mw[12]; cy = mw[1] * x + mw[5] * y + mw[9] * z + mw[13]; cz = mw[2] * x + mw[6] * y + mw[10] * z + mw[14];
        }
        if ((ax < -EXT && bx < -EXT && cx < -EXT) || (ax > EXT && bx > EXT && cx > EXT) || (az < -EXT && bz < -EXT && cz < -EXT) || (az > EXT && bz > EXT && cz > EXT)) continue;
        const ymin = ay < by ? (ay < cy ? ay : cy) : (by < cy ? by : cy), ymax = ay > by ? (ay > cy ? ay : cy) : (by > cy ? by : cy), g00 = ground((ax + bx + cx) / 3, (az + bz + cz) / 3); let g0 = g00;
        if (deck && BR.length && nearBr((ax + bx + cx) / 3, (az + bz + cz) / 3)) { const d0 = Math.max(deck(ax, az), deck(bx, bz), deck(cx, cz), deck((ax + bx + cx) / 3, (az + bz + cz) / 3)); if (d0 > g0) g0 = d0; }
        if (ymax < g0 + BAND0 || ymin > g0 + BAND1) continue;
        if (ymax < g0 + 1.25 || ymax < 1.25) {                                                                   // a LOW face (a quay / retaining wall, a plinth, a curb): measured from the HIGHER ground of its two sides — from the high side it is a drop (she steps off / into the water), from the low side the climb rule of tryMove stops her
          const ux0 = bx - ax, uy0 = by - ay, uz0 = bz - az, vx0 = cx - ax, vy0 = cy - ay, vz0 = cz - az, nx0 = uy0 * vz0 - uz0 * vy0, nz0 = ux0 * vy0 - uy0 * vx0, nl0 = Math.hypot(nx0, nz0);
          if (nl0 > 1e-9) { const hx = nx0 / nl0, hz = nz0 / nl0, mx = (ax + bx + cx) / 3, mz = (az + bz + cz) / 3, ga = fh(mx + hx * 0.7, mz + hz * 0.7), gb = fh(mx - hx * 0.7, mz - hz * 0.7), g1 = ga > gb ? ga : gb; if (ga < -0.6 || gb < -0.6) continue;   /* water on one side (the surface is at -0.75): a bank coping is no wall — she wades / swims in and hauls out over it */ if (g1 > g0) { g0 = g1; if (ymax < g0 + BAND0) continue; } }
        }
        const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az, nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        if (Math.abs(ny) / nl > 0.9) continue;                                                // a floor / a roof / a deck: not an obstacle
        if (CV.length) { const mx = (ax + bx + cx) / 3, mz = (az + bz + cz) / 3; let cut = false; for (let q = 0; q < CV.length; q++) { const r = CV[q], dx = mx - r.x, dz = mz - r.z, lu = dx * r.ux + dz * r.uz, lv = dx * r.vx + dz * r.vz; if (lu > -r.hu && lu < r.hu && ((lv > -r.hv && lv < r.hv) || (lv > -r.hv2 && lv < r.hv2 && ymax < g0 + 0.95))) { cut = true; break; } } if (cut) continue; }   // an arch the hero walks through (a gate: its leaf is baked into the gatehouse mesh)
        used++; const fax = (ax + EXT) * INV, faz = (az + EXT) * INV, fbx = (bx + EXT) * INV, fbz = (bz + EXT) * INV, fcx = (cx + EXT) * INV, fcz = (cz + EXT) * INV;
        if (Math.abs(ny) * 0.5 < 0.03) {                                                      // (vertical) — its projection is a line: the longest edge
          const l1 = (fbx - fax) ** 2 + (fbz - faz) ** 2, l2 = (fcx - fbx) ** 2 + (fcz - fbz) ** 2, l3 = (fax - fcx) ** 2 + (faz - fcz) ** 2;
          if (l1 >= l2 && l1 >= l3) line(fax, faz, fbx, fbz); else if (l2 >= l3) line(fbx, fbz, fcx, fcz); else line(fcx, fcz, fax, faz);
        } else { fill(fax, faz, fbx, fbz, fcx, fcz); line(fax, faz, fbx, fbz); line(fbx, fbz, fcx, fcz); line(fcx, fcz, fax, faz); }
      }
      st.tris += nTri; st.band += used; if (used) st.used.push([(o.parent ? o.parent.name : '') + '/' + o.name, nTri, used]);
      done++; if (performance.now() - tc > 10) { await tick(); tc = performance.now(); if (opt.progress) opt.progress(done / meshes.length); }
    }
    st.ms = Math.round(performance.now() - t0); st.ready = true; st.building = false; st.used.sort((p, q) => q[2] - p[2]); st.used.length = Math.min(st.used.length, 20); return st;
  }

  // ---- the distance field ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  function tile(tx, tz) {
    const key = tz * NT + tx; let e = tiles.get(key); if (e) return e;
    const f = new Float32Array(TW * TW), ox = tx * TB - TM, oz = tz * TB - TM; let any = false;
    for (let j = 0; j < TW; j++) for (let i = 0; i < TW; i++) { if (solid(ox + i, oz + j)) { f[j * TW + i] = 0; any = true; } else f[j * TW + i] = INF; }
    if (any) edt2(f, TW, v, zz, gg); for (let k = 0; k < f.length; k++) f[k] = any ? Math.sqrt(f[k]) * CELL : 99;
    e = { f, any }; tiles.set(key, e); order.push(key); st.tiles++; if (order.length > CACHE) tiles.delete(order.shift()); return e;
  }
  const near = (x, z) => { const bx = Math.floor((x + EXT) * INV / BLK), bz = Math.floor((z + EXT) * INV / BLK); for (let j = bz - 1; j <= bz + 1; j++) for (let i = bx - 1; i <= bx + 1; i++) if (i >= 0 && j >= 0 && i < NB && j < NB && occ[j * NB + i]) return true; return false; };   // any solid within ~2 m?
  // distance (m) from (x, z) to the nearest solid CELL CENTRE (99 = nothing within ~2 m); bilinear
  function d(x, z) {
    if (!st.ready || !near(x, z)) return 99;
    const fx = (x + EXT) * INV - 0.5, fz = (z + EXT) * INV - 0.5, ix = Math.floor(fx), iz = Math.floor(fz); if (ix < 0 || iz < 0 || ix >= N - 1 || iz >= N - 1) return 99;
    const tx = (ix / TB) | 0, tz = (iz / TB) | 0, e = tile(tx, tz); if (!e.any) return 99;
    const li = ix - tx * TB + TM, lj = iz - tz * TB + TM, a = fx - ix, b = fz - iz, f = e.f;
    return (f[lj * TW + li] * (1 - a) + f[lj * TW + li + 1] * a) * (1 - b) + (f[(lj + 1) * TW + li] * (1 - a) + f[(lj + 1) * TW + li + 1] * a) * b;
  }
  // the half-diagonal of a cell: a cell is a 25 cm square, so the surface is ~ 12.5 cm nearer than its centre
  const HALF = CELL * 0.5;
  // push a circle (radius r) at p out of the field; returns true when it moved.  p = { x, z }
  function push(p, r) {
    if (!st.ready) return false; let moved = false;
    for (let it = 0; it < 3; it++) {
      const dd = d(p.x, p.z) - HALF; if (dd >= r) break;
      const e = 0.12, gx = d(p.x + e, p.z) - d(p.x - e, p.z), gz = d(p.x, p.z + e) - d(p.x, p.z - e), gl = Math.hypot(gx, gz);
      if (gl < 0.05 && dd + HALF > 0.35 && dd > r - 0.12) break;                               // RP1C-R3: the ridge of a needle gap between two surfaces (the gradients cancel): she stands in it, no hop
      if (gl < 0.05) {                                                                        // inside a filled stretch: the field is flat — leave by the nearest open cell (ring search)
        let done = false; for (let rr = 0.5; rr <= 8 && !done; rr += 0.5) for (let a = 0; a < 6.2832; a += 0.4) { const x = p.x + Math.cos(a) * rr, zq = p.z + Math.sin(a) * rr; if (d(x, zq) - HALF >= r) { p.x = x; p.z = zq; done = true; break; } }
        moved = true; break;
      }
      const k = (r - dd) / gl; p.x += gx * k; p.z += gz * k; moved = true;                    // (the gradient of a distance has length ~ 2e / e... normalised by gl: unit direction, depth r - dd)
    }
    return moved;
  }
  // the first solid along a ray (metres), or -1: step 12 cm
  function ray(x, z, dx, dz, max = 12) { if (!st.ready) return -1; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; for (let t = 0; t <= max; t += 0.12) if (solid(Math.floor((x + dx * t + EXT) * INV), Math.floor((z + dz * t + EXT) * INV))) return t; return -1; }
  // how much of a disc / oriented box the grid represents: the solid cells inside it per cell of its perimeter (a hollow building is drawn by its walls only: ~ 1.0 for a closed outline, < 0.2 = nothing there)
  function coverDisc(x, z, r) { let c = 0; for (let a = -r; a <= r; a += CELL) for (let b = -r; b <= r; b += CELL) { if (a * a + b * b > r * r) continue; if (solid(Math.floor((x + a + EXT) * INV), Math.floor((z + b + EXT) * INV))) c++; } return c / Math.max(1, (2 * Math.PI * r) / CELL); }
  function coverBox(b) { let c = 0; for (let a = -b.hw; a <= b.hw; a += CELL) for (let q = -b.hd; q <= b.hd; q += CELL) { const x = b.x + a * b.ux + q * b.vx, z = b.z + a * b.uz + q * b.vz; if (solid(Math.floor((x + EXT) * INV), Math.floor((z + EXT) * INV))) c++; } return c / Math.max(1, (4 * (b.hw + b.hd)) / CELL); }
  const info = () => ({ ready: st.ready, ms: st.ms, meshes: st.meshes, tris: st.tris, bandTris: st.band, cells: st.cells, tiles: tiles.size, tilesBuilt: st.tiles, skipped: st.skipped, top: st.used.slice(0, 8), cellM: CELL, mem: +(((bits.length + occ.length + gnd.byteLength + tiles.size * TW * TW * 4) / 1048576)).toFixed(2) });
  function dispose() { st.ready = false; tiles.clear(); order.length = 0; bits.fill(0); occ.fill(0); }
  return { build, d, push, ray, solid: (x, z) => solid(Math.floor((x + EXT) * INV), Math.floor((z + EXT) * INV)), coverDisc, coverBox, info, dispose, st, CELL, HALF };
}
