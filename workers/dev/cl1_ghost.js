// cl1_ghost.js — CL1 (ROUND6): «things the hero walks THROUGH».  Evaluated INSIDE the real game page, hero started.  Synchronous (a few seconds).
// For every static mesh / instance of the home map that rp_grid.js does NOT draw into the body-band grid (instanced packs, alpha-tested, transparent, late-stage groups it skips ...) it rasterizes the instance's
// triangles that stand in the BODY BAND (0.45 .. 1.55 m over the ground, no floors / roofs: the same test as rp_grid.js) into 25 cm cells and asks the hero's colliders (the grid, the game's discs, the game's boxes)
// whether each cell is solid.  An object whose band cells are < 50 % held is a GHOST: the hero walks through it.
//   window.__cl1g = { types: { key: { ... } }, ghosts: [ { t, x, z, cells, held, hw, hd, h } ] }
//   opt: { includeHeld: false, minCells: 3 (an object smaller than 3 cells = 19 cm x 19 cm is a pebble), skipRe: RegExp of paths that are not static (crowds, water life, her own ...) }
(() => {
  const opt = window.__cl1opt || {};
  const rp = window.__rp, S = rp.S, B = window.__bw, sc = B.scene, GR = rp.grid();
  const Mat4 = sc.matrixWorld.constructor;
  const CELL = 0.25, BAND0 = 0.45, BAND1 = 1.55;
  const SKIP_PATH = opt.skipRe || /crowd|pack#rp|attackerCamp|water-life|bank-life|waterfall|rp-ramps|rp-doors|rp-goup|rp-sisters|rp_marker|wslife>crowd|army>crowd|defenses>crowd/;
  const SKIP_SELF = new Set(['sky', 'terrain', 'water', 'backdrop0', 'backdrop1', 'streets', 'rp-ramps', 'rp-doors']);
  const gh = (x, z) => rp.ground(x, z);
  const boxes = S.boxes || [], discs = S.discs || [];
  const held = (x, z) => {
    if (GR && GR.st.ready && (GR.solidAll || GR.solid)(x, z)) return 1;
    for (let i = 0; i < discs.length; i++) { const d = discs[i], dx = x - d[0], dz = z - d[1]; if (dx * dx + dz * dz < d[2] * d[2]) return 2; }
    for (let i = 0; i < boxes.length; i++) { const b = boxes[i]; if (b.soft) continue; const dx = x - b.x, dz = z - b.z; if (dx * dx + dz * dz > b.R2) continue; const lx = dx * b.ux + dz * b.uz, lz = dx * b.vx + dz * b.vz; if (Math.abs(lx) < b.hw && Math.abs(lz) < (b.type === 'wall' ? b.hd * 0.72 : b.hd)) return 3; }
    return 0;
  };
  sc.updateMatrixWorld(true);
  const pathOf = (o) => { const a = []; for (let p = o; p && p !== sc; p = p.parent) a.push(p.name || p.type); return a.reverse().join('>'); };
  const types = {}, ghosts = [], m4 = new Mat4(), m5 = new Mat4();
  const cellsOf = new Map();                                              // per object: cell key -> 1
  const OFF = 4096, ck = (ix, iz) => (ix + OFF) * 8192 + (iz + OFF), dk = (k) => { const a = Math.floor(k / 8192); return [a - OFF, k - a * 8192 - OFF]; };
  const mark = (ix, iz) => { cellsOf.set(ck(ix, iz), 1); };
  const line = (ax, az, bx, bz) => { const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) * 2)); for (let i = 0; i <= n; i++) { const t = i / n; mark(Math.floor(ax + (bx - ax) * t), Math.floor(az + (bz - az) * t)); } };
  const fill = (ax, az, bx, bz, cx, cz) => {
    const x0 = Math.floor(Math.min(ax, bx, cx)), x1 = Math.floor(Math.max(ax, bx, cx)), z0 = Math.floor(Math.min(az, bz, cz)), z1 = Math.floor(Math.max(az, bz, cz)); if ((x1 - x0 + 1) * (z1 - z0 + 1) > 20000) return;
    for (let iz = z0; iz <= z1; iz++) for (let ix = x0; ix <= x1; ix++) {
      const px = ix + 0.5, pz = iz + 0.5, s1 = (px - bx) * (az - bz) - (ax - bx) * (pz - bz), s2 = (px - cx) * (bz - cz) - (bx - cx) * (pz - cz), s3 = (px - ax) * (cz - az) - (cx - ax) * (pz - az);
      if (!((s1 < 0 || s2 < 0 || s3 < 0) && (s1 > 0 || s2 > 0 || s3 > 0))) mark(ix, iz);
    }
  };
  // band triangles of ONE object (mesh matrix mw, ground measured at (gx, gz) when `flat`, else per triangle)
  function rasterObject(g, mw, flat, gx, gz) {
    cellsOf.clear(); const P = g.attributes.position, pa = P.array, I = g.index, ia = I ? I.array : null, nTri = I ? (I.count / 3) | 0 : (P.count / 3) | 0; const g0f = flat ? gh(gx, gz) : 0; let used = 0;
    for (let t = 0; t < nTri; t++) {
      const a = ia ? ia[t * 3] : t * 3, b = ia ? ia[t * 3 + 1] : t * 3 + 1, c = ia ? ia[t * 3 + 2] : t * 3 + 2;
      let x = pa[a * 3], y = pa[a * 3 + 1], z = pa[a * 3 + 2]; const ax = mw[0] * x + mw[4] * y + mw[8] * z + mw[12], ay = mw[1] * x + mw[5] * y + mw[9] * z + mw[13], az = mw[2] * x + mw[6] * y + mw[10] * z + mw[14];
      x = pa[b * 3]; y = pa[b * 3 + 1]; z = pa[b * 3 + 2]; const bx = mw[0] * x + mw[4] * y + mw[8] * z + mw[12], by = mw[1] * x + mw[5] * y + mw[9] * z + mw[13], bz = mw[2] * x + mw[6] * y + mw[10] * z + mw[14];
      x = pa[c * 3]; y = pa[c * 3 + 1]; z = pa[c * 3 + 2]; const cx = mw[0] * x + mw[4] * y + mw[8] * z + mw[12], cy = mw[1] * x + mw[5] * y + mw[9] * z + mw[13], cz = mw[2] * x + mw[6] * y + mw[10] * z + mw[14];
      const ymin = Math.min(ay, by, cy), ymax = Math.max(ay, by, cy), g0 = flat ? g0f : gh((ax + bx + cx) / 3, (az + bz + cz) / 3);
      if (ymax < g0 + BAND0 || ymin > g0 + BAND1) continue;
      const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az, nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      if (Math.abs(ny) / nl > 0.9) continue;
      used++; const fax = ax / CELL, faz = az / CELL, fbx = bx / CELL, fbz = bz / CELL, fcx = cx / CELL, fcz = cz / CELL;
      if (Math.abs(ny) * 0.5 < 0.03) { const l1 = (fbx - fax) ** 2 + (fbz - faz) ** 2, l2 = (fcx - fbx) ** 2 + (fcz - fbz) ** 2, l3 = (fax - fcx) ** 2 + (faz - fcz) ** 2; if (l1 >= l2 && l1 >= l3) line(fax, faz, fbx, fbz); else if (l2 >= l3) line(fbx, fbz, fcx, fcz); else line(fcx, fcz, fax, faz); }
      else { fill(fax, faz, fbx, fbz, fcx, fcz); line(fax, faz, fbx, fbz); line(fbx, fbz, fcx, fcz); line(fcx, fcz, fax, faz); }
    }
    return used;
  }
  // connected components of the UNHELD cells -> the objects the hero walks through (8-neighbour)
  function components() {
    const free = new Set(), all = cellsOf.size;
    for (const k of cellsOf.keys()) { const [ix, iz] = dk(k); if (!held((ix + 0.5) * CELL, (iz + 0.5) * CELL)) free.add(k); }
    const out = []; const seen = new Set();
    for (const k0 of free) {
      if (seen.has(k0)) continue; const st = [k0]; seen.add(k0); let n = 0, sx = 0, sz = 0, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      while (st.length) { const k = st.pop(), [ix, iz] = dk(k); n++; sx += ix; sz += iz; if (ix < x0) x0 = ix; if (ix > x1) x1 = ix; if (iz < z0) z0 = iz; if (iz > z1) z1 = iz;
        for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const k2 = ck(ix + di, iz + dj); if (free.has(k2) && !seen.has(k2)) { seen.add(k2); st.push(k2); } } }
      out.push({ n, x: (sx / n + 0.5) * CELL, z: (sz / n + 0.5) * CELL, hw: (x1 - x0 + 1) * CELL / 2, hd: (z1 - z0 + 1) * CELL / 2 });
    }
    return { all, free: free.size, comps: out };
  }
  let nObj = 0, nMesh = 0, t0 = performance.now();
  const consider = (o, path) => {
    const g = o.geometry; const P = g.attributes && g.attributes.position; if (!P || P.isInterleavedBufferAttribute || P.itemSize < 3) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || m.visible === false) return;
    const alpha = m.alphaTest > 0 || m.transparent; const reason = o.isInstancedMesh ? (alpha ? 'inst-alpha' : 'instanced') : (o.isSkinnedMesh ? 'skinned' : (m.alphaTest > 0 ? 'alphaTest' : (m.transparent ? 'transparent' : (path.includes('/late-stage/late:') && !/late:(townplan|worksites|defenses|deffield|watchtower|windmill|watermill|blacksmith|barn|silo|coop|tent)/.test(path) ? 'late-other' : ''))));
    if (!reason || reason === 'skinned') return;                                         // drawn into the grid by rp_grid.js (or not static)
    if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox;
    const key = [reason, g.name || o.name || '', P.count, (bb.max.x - bb.min.x).toFixed(1), (bb.max.y - bb.min.y).toFixed(1), (bb.max.z - bb.min.z).toFixed(1), m.name || ''].join('|');
    let T = types[key]; if (!T) T = types[key] = { key, path: path.split('/').filter(Boolean).slice(-3).join('>') + '>' + (o.name || ''), why: reason, objs: 0, noBand: 0, ghost: 0, partial: 0, ok: 0, cells: 0, freeCells: 0, w: +(bb.max.x - bb.min.x).toFixed(2), h: +(bb.max.y - bb.min.y).toFixed(2), d: +(bb.max.z - bb.min.z).toFixed(2), px: [], verts: P.count, at: m.alphaTest || 0, tr: !!m.transparent, mat: m.name || '' };
    nMesh++;
    const n = o.isInstancedMesh ? Math.min(o.count, (o.instanceMatrix.array.length / 16) | 0) : 1;
    for (let i = 0; i < n; i++) {
      if (o.isInstancedMesh) { m4.fromArray(o.instanceMatrix.array, i * 16); m5.multiplyMatrices(o.matrixWorld, m4); } else m5.copy(o.matrixWorld);
      const e = m5.elements; T.objs++; nObj++;
      const used = rasterObject(g, e, !!o.isInstancedMesh, e[12], e[14]);
      if (!used) { T.noBand++; continue; }
      const R = components(); T.cells += R.all; T.freeCells += R.free;
      const real = R.comps.filter((c) => c.n >= (opt.minCells || 3));
      if (!real.length) { T.ok++; continue; }
      let big = 0; for (const c of real) { big++; if (ghosts.length < 20000) ghosts.push({ t: key, x: +c.x.toFixed(2), z: +c.z.toFixed(2), n: c.n, hw: +c.hw.toFixed(2), hd: +c.hd.toFixed(2), inst: !!o.isInstancedMesh }); if (T.px.length < 4) T.px.push([+c.x.toFixed(1), +c.z.toFixed(1), c.n]); }
      if (R.free >= 0.5 * R.all) T.ghost++; else T.partial++;
    }
  };
  const walk = (o, path) => {
    if (o.userData && (o.userData.rpHero || o.userData.rpMarker || o.userData.rpProxy)) return;
    const here = path + '/' + (o.name || '');
    if (SKIP_PATH.test(here)) return;
    if (o.isMesh && o.geometry) {
      // hidden mesh: skip, EXCEPT a pack the hero's cull module hid after making its own proxy (sibling named <name>#rp with the same material)
      let vis = o.visible !== false; let anc = true; for (let p = o.parent; p; p = p.parent) if (p.visible === false) { anc = false; break; }
      if (!vis && anc && o.isInstancedMesh && o.parent && o.parent.children.some((c) => c.userData && c.userData.rpProxy && c.material === o.material)) vis = true;
      if (vis && anc && !(o.name && SKIP_SELF.has(o.name))) consider(o, here);
    }
    if (SKIP_SELF.has(o.name) && o.name !== 'terrain') return;
    if (o.visible === false && !(o.parent && o.isInstancedMesh)) { /* children of a hidden group are not drawn */ }
    for (const c of o.children) walk(c, here);
  };
  for (const c of sc.children) walk(c, '');
  const rows = Object.values(types).sort((a, b) => b.objs - a.objs);
  window.__cl1g = { types, ghosts };
  return JSON.stringify({ ms: Math.round(performance.now() - t0), meshes: nMesh, objects: nObj, ghosts: ghosts.length, gridReady: !!(GR && GR.st.ready), nBoxes: boxes.length, nDiscs: discs.length,
    rows: rows.map((r) => ({ verts: r.verts, at: r.at, tr: r.tr, mat: r.mat, key: r.key, path: r.path.slice(-80), why: r.why, objs: r.objs, noBand: r.noBand, ok: r.ok, partial: r.partial, ghost: r.ghost, cells: r.cells, free: r.freeCells, w: r.w, h: r.h, d: r.d, px: r.px })) });
})()
