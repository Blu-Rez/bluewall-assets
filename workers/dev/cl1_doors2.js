// cl1_doors2.js — CL1 part 2: WHICH meshes make the solid cells in front of the doors (needs window.__cl1d from cl1_doors.js).  Evaluated in the game page, hero started.
// For every door with solid cells in FRONT it walks the opaque, non-instanced meshes whose bounding box meets FRONT, raster-tests their body-band triangles (0.45 .. 1.55 m, not floors / roofs) against FRONT
// and counts the triangles / cells per mesh path.  Returns { doors: [{ id, meshes: [{ path, tris, cells, w, h, d }] }] , byPath: { path: doors } }.
(() => {
  const rp = window.__rp, B = window.__bw, sc = B.scene, D = window.__cl1d; if (!D) return JSON.stringify({ err: 'run cl1_doors.js first' });
  const opt = window.__cl1opt || {}; const DEPTH = opt.depth || 3, HALF = opt.half || 2;
  const Mat4 = sc.matrixWorld.constructor;
  const pathOf = (o) => { const a = []; for (let p = o; p && p !== sc; p = p.parent) a.push(p.name || p.type); return a.reverse().join('>'); };
  const SKIP_SELF = new Set(['sky', 'terrain', 'water', 'backdrop0', 'backdrop1', 'streets', 'rp-ramps', 'rp-doors']);
  const meshes = [];
  const walk = (o) => {
    if (o.userData && (o.userData.rpHero || o.userData.rpMarker || o.userData.rpProxy)) return;
    if (SKIP_SELF.has(o.name) && o.name !== 'terrain') return;
    if (o.isMesh && o.geometry && !o.isInstancedMesh && !o.isSkinnedMesh && !SKIP_SELF.has(o.name)) {
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (m && !m.transparent && !(m.alphaTest > 0) && m.visible !== false) {
        const p = pathOf(o); if (!/crowd|pack#rp|attackerCamp|water-life|bank-life|waterfall|rp-/.test(p) && !(p.includes('late-stage>late:') && !/late:(townplan|worksites|defenses|deffield|watchtower|windmill|watermill|blacksmith|barn|silo|coop|tent)/.test(p))) {
          const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); meshes.push({ o, p, bb: g.boundingBox });
        }
      }
    }
    for (const c of o.children) walk(c);
  };
  for (const c of sc.children) walk(c);
  sc.updateMatrixWorld(true);
  const res = [], byPath = {};
  for (const d of D.doors) {
    if (!(d.solid > 0)) continue;
    const ux = d.ux, uz = d.uz, vx = -uz, vz = ux, fx = d.fx, fz = d.fz;
    const inFront = (x, z) => { const dx = x - fx, dz = z - fz, t = dx * ux + dz * uz, s = dx * vx + dz * vz; return t > 0.9 && t < DEPTH && Math.abs(s) < HALF; };
    const gy = rp.ground(fx, fz), rec = { id: d.id, meshes: [] };
    for (const M of meshes) {
      const o = M.o, mw = o.matrixWorld.elements, bb = M.bb;
      // world AABB of the local box
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let a = 0; a < 8; a++) { const x = a & 1 ? bb.max.x : bb.min.x, y = a & 2 ? bb.max.y : bb.min.y, z = a & 4 ? bb.max.z : bb.min.z; const X = mw[0] * x + mw[4] * y + mw[8] * z + mw[12], Z = mw[2] * x + mw[6] * y + mw[10] * z + mw[14]; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Z < z0) z0 = Z; if (Z > z1) z1 = Z; }
      if (x1 < fx - DEPTH - 3 || x0 > fx + DEPTH + 3 || z1 < fz - DEPTH - 3 || z0 > fz + DEPTH + 3) continue;
      const g = o.geometry, P = g.attributes.position, pa = P.array, I = g.index, ia = I ? I.array : null, nTri = I ? (I.count / 3) | 0 : (P.count / 3) | 0; let tris = 0, ymin = 1e9, ymax = -1e9; const cells = new Set();
      for (let t = 0; t < nTri; t++) {
        const a = ia ? ia[t * 3] : t * 3, b = ia ? ia[t * 3 + 1] : t * 3 + 1, c = ia ? ia[t * 3 + 2] : t * 3 + 2;
        let x = pa[a * 3], y = pa[a * 3 + 1], z = pa[a * 3 + 2]; const ax = mw[0] * x + mw[4] * y + mw[8] * z + mw[12], ay = mw[1] * x + mw[5] * y + mw[9] * z + mw[13], az = mw[2] * x + mw[6] * y + mw[10] * z + mw[14];
        x = pa[b * 3]; y = pa[b * 3 + 1]; z = pa[b * 3 + 2]; const bx = mw[0] * x + mw[4] * y + mw[8] * z + mw[12], by = mw[1] * x + mw[5] * y + mw[9] * z + mw[13], bz = mw[2] * x + mw[6] * y + mw[10] * z + mw[14];
        x = pa[c * 3]; y = pa[c * 3 + 1]; z = pa[c * 3 + 2]; const cx = mw[0] * x + mw[4] * y + mw[8] * z + mw[12], cy = mw[1] * x + mw[5] * y + mw[9] * z + mw[13], cz = mw[2] * x + mw[6] * y + mw[10] * z + mw[14];
        const mx = (ax + bx + cx) / 3, mz = (az + bz + cz) / 3; if (!inFront(mx, mz) && !inFront(ax, az) && !inFront(bx, bz) && !inFront(cx, cz)) continue;
        const lo = Math.min(ay, by, cy), hi = Math.max(ay, by, cy), g0 = rp.ground(mx, mz); if (hi < g0 + 0.45 || lo > g0 + 1.55) continue;
        const ux1 = bx - ax, uy1 = by - ay, uz1 = bz - az, vx1 = cx - ax, vy1 = cy - ay, vz1 = cz - az, nx = uy1 * vz1 - uz1 * vy1, ny = uz1 * vx1 - ux1 * vz1, nz = ux1 * vy1 - uy1 * vx1, nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        if (Math.abs(ny) / nl > 0.9) continue;
        tris++; if (lo - g0 < ymin) ymin = lo - g0; if (hi - g0 > ymax) ymax = hi - g0; cells.add(Math.floor(mx * 4) * 100000 + Math.floor(mz * 4));
      }
      if (tris) { rec.meshes.push({ path: M.p.split('>').slice(-3).join('>'), tris, cells: cells.size, y0: +ymin.toFixed(2), y1: +ymax.toFixed(2), w: +(bb.max.x - bb.min.x).toFixed(1), h: +(bb.max.y - bb.min.y).toFixed(1), d: +(bb.max.z - bb.min.z).toFixed(1), tv: P.count }); byPath[M.p.split('>').slice(-3).join('>')] = (byPath[M.p.split('>').slice(-3).join('>')] || 0) + 1; }
    }
    rec.meshes.sort((a, b) => b.cells - a.cells); res.push(rec);
  }
  return JSON.stringify({ doors: res, byPath });
})()
