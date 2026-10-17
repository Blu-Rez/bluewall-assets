// cl1_comp.js — CL1 part 2: the separable decor pieces (the 'minor' meshes of the worksites: stone blocks, benches, timber, barrels ...) that stand in the KEEP-CLEAR rectangle of a door.
// K = 0.9 .. 3.0 m along the door's facing (beyond the facade strip) x +-1.6 m across it.  A piece = a connected set of triangles of ONE mesh (vertices welded at 1 cm); its centre must lie in K; it must reach the body band (0.45 .. 1.55 m).
// Evaluated in the game page, hero started.  Returns { doors: [{ id, fx, fz, pieces: [{ mesh, tris, w, h, d, t, s }] }] } and keeps window.__cl1c.
(() => {
  const rp = window.__rp, B = window.__bw, sc = B.scene, opt = window.__cl1copt || {}; const T0 = opt.t0 || 0.9, T1 = opt.t1 || 3.0, HS = opt.hs || 1.6;
  sc.updateMatrixWorld(true);
  const pathOf = (o) => { const a = []; for (let p = o; p && p !== sc; p = p.parent) a.push(p.name || p.type); return a.reverse().join('>'); };
  const dm = rp.doors(); if (dm && dm.build) dm.build(); const items = (dm.items() || []).filter((it) => it.fx !== undefined);
  const meshes = []; const walk = (o) => {
    if (o.userData && (o.userData.rpHero || o.userData.rpMarker || o.userData.rpProxy)) return;
    if (o.isMesh && o.geometry && !o.isInstancedMesh && !o.isSkinnedMesh && !/^(sky|terrain|water)$/.test(o.name)) { const p = pathOf(o); const m = Array.isArray(o.material) ? o.material[0] : o.material; if (/minor/.test(p) && m && !m.transparent && !(m.alphaTest > 0) && o.geometry.attributes.position && !o.geometry.attributes.position.isInterleavedBufferAttribute) meshes.push([o, p]); }
    for (const c of o.children) walk(c);
  }; for (const c of sc.children) walk(c);
  const out = [], comps = new Map();
  const getComps = (o) => {                                                                     // components of one mesh, in WORLD space: [{ tris: [..], x0,x1,y0,y1,z0,z1 }]
    if (comps.has(o)) return comps.get(o); const g = o.geometry, P = g.attributes.position, pa = P.array, I = g.index, ia = I ? I.array : null, nT = I ? (I.count / 3) | 0 : (P.count / 3) | 0, mw = o.matrixWorld.elements;
    const key = new Map(), par = []; const find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
    const vid = (i) => { const x = pa[i * 3], y = pa[i * 3 + 1], z = pa[i * 3 + 2], k = Math.round(x * 100) + ',' + Math.round(y * 100) + ',' + Math.round(z * 100); let v = key.get(k); if (v === undefined) { v = par.length; par.push(v); key.set(k, v); } return v; };
    const tv = new Int32Array(nT * 3); for (let t = 0; t < nT; t++) { for (let j = 0; j < 3; j++) tv[t * 3 + j] = vid(ia ? ia[t * 3 + j] : t * 3 + j); const a = find(tv[t * 3]), b = find(tv[t * 3 + 1]), c = find(tv[t * 3 + 2]); par[b] = a; par[find(c)] = find(a); }
    const mp = new Map(); for (let t = 0; t < nT; t++) { const r = find(tv[t * 3]); let C = mp.get(r); if (!C) { C = { tris: [], x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, z0: 1e9, z1: -1e9 }; mp.set(r, C); } C.tris.push(t);
      for (let j = 0; j < 3; j++) { const i = ia ? ia[t * 3 + j] : t * 3 + j, x = pa[i * 3], y = pa[i * 3 + 1], z = pa[i * 3 + 2], X = mw[0] * x + mw[4] * y + mw[8] * z + mw[12], Y = mw[1] * x + mw[5] * y + mw[9] * z + mw[13], Z = mw[2] * x + mw[6] * y + mw[10] * z + mw[14]; if (X < C.x0) C.x0 = X; if (X > C.x1) C.x1 = X; if (Y < C.y0) C.y0 = Y; if (Y > C.y1) C.y1 = Y; if (Z < C.z0) C.z0 = Z; if (Z > C.z1) C.z1 = Z; } }
    const L = [...mp.values()]; comps.set(o, L); return L;
  };
  for (const it of items) {
    const nx = (it.x - it.fx) / 0.7, nz = (it.z - it.fz) / 0.7, l = Math.hypot(nx, nz) || 1, ux = nx / l, uz = nz / l, vx = -uz, vz = ux; const rec = { id: it.id, fx: +it.fx.toFixed(2), fz: +it.fz.toFixed(2), ux: +ux.toFixed(3), uz: +uz.toFixed(3), pieces: [] };
    for (const [o, p] of meshes) {
      const bb = (o.geometry.boundingBox || o.geometry.computeBoundingBox() || o.geometry.boundingBox), e = o.matrixWorld.elements; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let a = 0; a < 8; a++) { const x = a & 1 ? bb.max.x : bb.min.x, y = a & 2 ? bb.max.y : bb.min.y, z = a & 4 ? bb.max.z : bb.min.z; const X = e[0] * x + e[4] * y + e[8] * z + e[12], Z = e[2] * x + e[6] * y + e[10] * z + e[14]; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Z < z0) z0 = Z; if (Z > z1) z1 = Z; }
      if (x1 < it.fx - 6 || x0 > it.fx + 6 || z1 < it.fz - 6 || z0 > it.fz + 6) continue;
      for (const C of getComps(o)) {
        const cx = (C.x0 + C.x1) / 2, cz = (C.z0 + C.z1) / 2, dx = cx - it.fx, dz = cz - it.fz, t = dx * ux + dz * uz, s = dx * vx + dz * vz; if (t < T0 || t > T1 || Math.abs(s) > HS) continue;
        const g0 = rp.ground(cx, cz); if (C.y1 < g0 + 0.45 || C.y0 > g0 + 1.55) continue;                  // not in the body band
        if (Math.max(C.x1 - C.x0, C.z1 - C.z0) > 6 || (C.y1 - C.y0) > 5) continue;                       // a whole structure (a shed, a wall), not a piece of decor
        rec.pieces.push({ mesh: p.split('>').slice(-2).join('>'), tris: C.tris.length, w: +(C.x1 - C.x0).toFixed(2), h: +(C.y1 - C.y0).toFixed(2), d: +(C.z1 - C.z0).toFixed(2), t: +t.toFixed(2), s: +s.toFixed(2) });
      }
    }
    out.push(rec);
  }
  window.__cl1c = { comps, doors: out };
  return JSON.stringify({ meshes: meshes.length, doors: out.filter((r) => r.pieces.length) });
})()
