// cl1_census.js — CL1 (ROUND6, 17 Oct 2026): the census of every STATIC object of the home map the hero could walk into, and whether the hero's colliders (game boxes, discs, the body-band grid) hold it.
// Evaluated INSIDE the real game page with the hero already started (window.__rp = hero.dev, window.__bw = the game).  Returns a JSON string; the full item list stays in window.__cl1.items for cl1_page.js.
//   usage:  evaluate  "(()=>{ <this file> })()"   (it is an IIFE below; returns at once, the job is synchronous and takes ~1-3 s)
// For every mesh / instance of the scene (hero things, sky, terrain, water, people, animals, packs are not listed):
//   type    = a stable key (the model's geometry: vertex count + size) — cl1_types.json maps it to the human name (building / tree / fence / rock / statue / flag / tent / cart / crate / well / lamp ...)
//   band    = the instance can stop a body: it reaches above 0.45 m over the ground AND starts below 1.55 m (the same band as rp_grid.js)
//   held    = the instance's centre (or a point of its footprint) is inside a game box, a game disc or a solid body-band-grid cell → the hero cannot stand there
//   gridWhy = why rp_grid.js did not draw it (instanced / skinned / transparent / alphaTest / late-other / path / named)  or '' when it is in the grid
(() => {
  const rp = window.__rp, S = rp.S, B = window.__bw, sc = B.scene, GR = rp.grid();
  const Mat4 = sc.matrixWorld.constructor, Vec3 = sc.position.constructor;
  const SKIP_SELF = new Set(['sky', 'terrain', 'water', 'backdrop0', 'backdrop1', 'streets', 'rp-ramps', 'rp-doors']);
  const SKIP_PATH = /crowd|pack#rp|attackerCamp|water-life|bank-life|waterfall|rp-ramps|rp-doors|rp-goup|rp-sisters|rp_marker/;
  const LATE_OK = /late:(townplan|worksites|defenses|deffield|watchtower|windmill|watermill|blacksmith|barn|silo|coop|tent)/;
  const BAND0 = 0.45, BAND1 = 1.55;
  const items = [], groups = new Map();
  sc.updateMatrixWorld(true);
  const m4 = new Mat4(), m5 = new Mat4(), v = new Vec3();
  const gh = (x, z) => rp.ground(x, z);
  const pathOf = (o) => { const a = []; for (let p = o; p && p !== sc; p = p.parent) a.push(p.name || p.type); return a.reverse().join('>'); };
  const why = (o, path) => {
    if (o.isInstancedMesh) return 'instanced'; if (o.isSkinnedMesh) return 'skinned'; if (SKIP_SELF.has(o.name)) return 'named';
    const m = Array.isArray(o.material) ? o.material[0] : o.material, g = o.geometry, P = g.attributes && g.attributes.position;
    if (!m || m.transparent || m.alphaTest > 0 || m.visible === false) return (m && m.alphaTest > 0) ? 'alphaTest' : 'transparent';
    if (!P || P.isInterleavedBufferAttribute || P.itemSize < 3) return 'geometry';
    if (path.includes('/late-stage/late:') && !LATE_OK.test(path)) return 'late-other';
    if (SKIP_PATH.test(path)) return 'path';
    return '';
  };
  // the colliders as the hero has them NOW
  const boxes = S.boxes || [], discs = S.discs || [];
  const heldBy = (x, z) => {
    if (GR && GR.st.ready && GR.solid(x, z)) return 'grid';
    for (const d of discs) { const dx = x - d[0], dz = z - d[1]; if (dx * dx + dz * dz < d[2] * d[2]) return 'disc'; }
    for (const b of boxes) { if (b.soft) continue; const dx = x - b.x, dz = z - b.z; if (dx * dx + dz * dz > b.R2) continue; const lx = dx * b.ux + dz * b.uz, lz = dx * b.vx + dz * b.vz; if (Math.abs(lx) < b.hw && Math.abs(lz) < (b.type === 'wall' ? b.hd * 0.72 : b.hd)) return 'box:' + b.type; }
    return '';
  };
  const typeKey = (o) => {
    const g = o.geometry, P = g.attributes.position; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    return [g.name || o.name || '', P ? P.count : 0, (bb.max.x - bb.min.x).toFixed(2), (bb.max.y - bb.min.y).toFixed(2), (bb.max.z - bb.min.z).toFixed(2), m && m.name || ''].join('|');
  };
  const walk = (o, path) => {
    if (o.userData && (o.userData.rpHero || o.userData.rpMarker)) return;
    if (o.isMesh && o.geometry && o.visible !== false) {
      const w = why(o, path + '/' + (o.name || ''));
      if (w === 'skinned') { /* people / animals: not static */ }
      else if (o.name && SKIP_SELF.has(o.name)) { /* sky, terrain, water ... */ }
      else if (SKIP_PATH.test(path + '/' + (o.name || ''))) { /* crowds, packs of the hero, water life */ }
      else {
        const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox, key = typeKey(o);
        const n = o.isInstancedMesh ? o.count : 1; let G = groups.get(key);
        if (!G) { G = { key, path: path.split('/').filter(Boolean).slice(-3).join('>') + '>' + (o.name || ''), n: 0, band: 0, held: 0, gridWhy: w, inst: !!o.isInstancedMesh, sx: 0, sy: 0, sz: 0, heldBy: {} }; groups.set(key, G); }
        for (let i = 0; i < n; i++) {
          if (o.isInstancedMesh) { m4.fromArray(o.instanceMatrix.array, i * 16); m5.multiplyMatrices(o.matrixWorld, m4); } else m5.copy(o.matrixWorld);
          const e = m5.elements; v.set(0, 0, 0).applyMatrix4(m5); const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
          const ctr = v.set(cx, 0, cz).applyMatrix4(m5); const X = ctr.x, Z = ctr.z, gy = gh(X, Z);
          // world y-extent of the box corners
          let ymin = 1e9, ymax = -1e9, xmin = 1e9, xmax = -1e9, zmin = 1e9, zmax = -1e9;
          for (let a = 0; a < 8; a++) { v.set(a & 1 ? bb.max.x : bb.min.x, a & 2 ? bb.max.y : bb.min.y, a & 4 ? bb.max.z : bb.min.z).applyMatrix4(m5); if (v.y < ymin) ymin = v.y; if (v.y > ymax) ymax = v.y; if (v.x < xmin) xmin = v.x; if (v.x > xmax) xmax = v.x; if (v.z < zmin) zmin = v.z; if (v.z > zmax) zmax = v.z; }
          const hw = (xmax - xmin) / 2, hd = (zmax - zmin) / 2;
          const band = ymax - gy >= BAND0 && ymin - gy <= BAND1 && Math.max(hw, hd) >= 0.2;
          G.n++; if (band) {
            G.band++; const h = heldBy(X, Z) || heldBy(xmin + hw * 0.5, zmin + hd * 0.5) || heldBy(xmax - hw * 0.5, zmax - hd * 0.5);
            if (h) { G.held++; G.heldBy[h.split(':')[0]] = (G.heldBy[h.split(':')[0]] || 0) + 1; }
            if (items.length < 60000) items.push({ key, x: +X.toFixed(2), z: +Z.toFixed(2), hw: +hw.toFixed(2), hd: +hd.toFixed(2), h: +(ymax - gy).toFixed(2), y0: +(ymin - gy).toFixed(2), held: h || '', m: Array.from(e).map((q) => +q.toFixed(4)), inst: !!o.isInstancedMesh });
          }
          G.sx = Math.max(G.sx, hw * 2); G.sy = Math.max(G.sy, ymax - ymin); G.sz = Math.max(G.sz, hd * 2);
        }
      }
    }
    if (SKIP_SELF.has(o.name) && o.name !== 'terrain') return;
    for (const c of o.children) walk(c, path + '/' + (o.name || ''));
  };
  for (const c of sc.children) walk(c, '');
  window.__cl1 = { items, groups: [...groups.values()] };
  const rows = [...groups.values()].filter((g) => g.band > 0).sort((a, b) => b.band - a.band);
  return JSON.stringify({ groups: groups.size, bandGroups: rows.length, items: items.length, gridReady: !!(GR && GR.st.ready), nBoxes: boxes.length, nDiscs: discs.length,
    rows: rows.map((g) => ({ key: g.key, path: g.path.slice(-90), inst: g.inst, n: g.n, band: g.band, held: g.held, free: g.band - g.held, why: g.gridWhy, by: g.heldBy, w: +g.sx.toFixed(1), h: +g.sy.toFixed(1), d: +g.sz.toFixed(1) })) });
})()
