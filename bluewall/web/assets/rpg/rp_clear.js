// CL1 (ROUND6, 17 Oct 2026) — «extras in front of the doors».  A lazy ES module (fetched with rpg.js, owner-only; nothing of it is in the boot bundle).
// WHY: the door orbs sit on the REAL facade (doors.js); in front of a few of them the worksite builders leave decor that crowds or closes the way in: the quarry's field of 3 m stone blocks (the door stands IN it), the
// saw mill's carts (a cart 1 m from the door), the greenhouse's table.  They are separate pieces of the worksites' `minor` meshes (the decor of a worksite: not the walls of the building).
// WHAT: for every door the keep-clear corridor is   t = 0.3 .. 3.2 m along the door's facing  x  |s| <= 1.5 m across it (3 m wide, 3 m deep).  A PIECE = a connected set of triangles of one `minor` mesh (vertices welded at
// 1 cm) that (a) reaches into the corridor, (b) is a real object — >= 0.45 m high AND >= 0.45 m wide, <= 6 m, so a rail, a stake or a plank stays — and (c) is in the body band (0.45 .. 1.55 m over the ground).
// A piece that TOUCHES a removed piece (bbox gap <= 10 cm, >= 8 cm high, the group stays <= 4.4 x 4.4 x 3.2 m) goes with it: a cart is cut as a whole (bed, wheels, canvas), not left as a bed on blocks.
// Such a piece is cut out of its mesh (the index is rebuilt without its triangles: nothing is drawn, the collision grid does not see it); it is removed for the rest of the session (the page's copy of the geometry).
// Not touched on purpose: the building shells (the `tr2` / `static` / homes / civic meshes: porches, awnings, steps are part of the model), instanced props (trees, rocks, barrels: the instance layer of rp_grid.js
// makes them solid and none of them stands in a door corridor — `scan` says so), the castle, the roads, the ST1 / TR2-S5 plans.
// API: createClear(H, S).run(items) -> the pieces removed (items = doors.items(); call grid.build + doors.build again when it returns something);  scan(items) = the same list without cutting (the report).
const T0 = 0.3, T1 = 3.2, HS = 1.5, MINW = 0.45, MINH = 0.45, MAXW = 6, MAXH = 5, B0 = 0.45, B1 = 1.55;
const GAP = 0.1, CAPW = 4.4, CAPH = 3.2, MINP = 0.08;                                  // closure: a piece that touches (<= 10 cm) a removed one goes with it (a cart = bed + wheels + canvas), the whole group <= 4.4 x 3.2 m

export function createClear(H, S, G = {}) {
  const sc = H.scene, st = { passes: 0, removed: [], scanned: 0, ms: 0 };
  const comps = new Map();                                                                  // mesh -> [{ tris, x0, x1, y0, y1, z0, z1, pts }]  (world space; rebuilt when the mesh changes)
  const pathOf = (o) => { const a = []; for (let p = o; p && p !== sc; p = p.parent) a.push(p.name || p.type); return a.reverse().join('>'); };
  function meshes() {
    const out = [];
    const walk = (o) => {
      if (o.userData && (o.userData.rpHero || o.userData.rpMarker || o.userData.rpProxy)) return;
      if (o.isMesh && o.geometry && !o.isInstancedMesh && !o.isSkinnedMesh && o.geometry.index && o.geometry.attributes.position && !o.geometry.attributes.position.isInterleavedBufferAttribute) {
        const p = pathOf(o), m = Array.isArray(o.material) ? o.material[0] : o.material;
        if (/minor/.test(p) && m && !m.transparent && !(m.alphaTest > 0)) out.push([o, p]);
      }
      for (const c of o.children) walk(c);
    };
    for (const c of sc.children) walk(c); return out;
  }
  function getComps(o) {
    const hit = comps.get(o); if (hit && hit.v === o.geometry.index.version && hit.n === o.geometry.index.count) return hit.L;
    const g = o.geometry, P = g.attributes.position, pa = P.array, ia = g.index.array, nT = (g.index.count / 3) | 0, mw = o.matrixWorld.elements;
    const key = new Map(), par = []; const find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
    const vid = (i) => { const x = pa[i * 3], y = pa[i * 3 + 1], z = pa[i * 3 + 2], k = Math.round(x * 100) + ',' + Math.round(y * 100) + ',' + Math.round(z * 100); let v = key.get(k); if (v === undefined) { v = par.length; par.push(v); key.set(k, v); } return v; };
    const tv = new Int32Array(nT * 3);
    for (let t = 0; t < nT; t++) { for (let j = 0; j < 3; j++) tv[t * 3 + j] = vid(ia[t * 3 + j]); const a = find(tv[t * 3]), b = find(tv[t * 3 + 1]), c = find(tv[t * 3 + 2]); par[b] = a; par[find(c)] = find(a); }
    const mp = new Map();
    for (let t = 0; t < nT; t++) {
      const r = find(tv[t * 3]); let C = mp.get(r); if (!C) { C = { tris: [], x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, z0: 1e9, z1: -1e9, pts: [] }; mp.set(r, C); } C.tris.push(t);
      for (let j = 0; j < 3; j++) {
        const i = ia[t * 3 + j], x = pa[i * 3], y = pa[i * 3 + 1], z = pa[i * 3 + 2], X = mw[0] * x + mw[4] * y + mw[8] * z + mw[12], Y = mw[1] * x + mw[5] * y + mw[9] * z + mw[13], Z = mw[2] * x + mw[6] * y + mw[10] * z + mw[14];
        if (X < C.x0) C.x0 = X; if (X > C.x1) C.x1 = X; if (Y < C.y0) C.y0 = Y; if (Y > C.y1) C.y1 = Y; if (Z < C.z0) C.z0 = Z; if (Z > C.z1) C.z1 = Z; C.pts.push(X, Z);
      }
    }
    const L = [...mp.values()]; comps.set(o, { v: g.index.version, n: g.index.count, L }); return L;
  }
  // the pieces standing in the corridor of each door: [{ id, o, C, mesh, w, h, d, t, s }]
  function piecesOf(items) {
    sc.updateMatrixWorld(true); const ms = meshes(), out = [];
    for (const it of items) {
      if (it.fx === undefined) continue;
      const nx = (it.x - it.fx) / 0.7, nz = (it.z - it.fz) / 0.7, l = Math.hypot(nx, nz) || 1, ux = nx / l, uz = nz / l, vx = -uz, vz = ux;
      for (const [o, p] of ms) {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox, e = o.matrixWorld.elements; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
        for (let a = 0; a < 8; a++) { const x = a & 1 ? bb.max.x : bb.min.x, y = a & 2 ? bb.max.y : bb.min.y, z = a & 4 ? bb.max.z : bb.min.z, X = e[0] * x + e[4] * y + e[8] * z + e[12], Z = e[2] * x + e[6] * y + e[10] * z + e[14]; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Z < z0) z0 = Z; if (Z > z1) z1 = Z; }
        if (x1 < it.fx - 5 || x0 > it.fx + 5 || z1 < it.fz - 5 || z0 > it.fz + 5) continue;
        for (const C of getComps(o)) {
          const w = Math.max(C.x1 - C.x0, C.z1 - C.z0), h = C.y1 - C.y0; if (w > MAXW || h > MAXH || h < MINH || w < MINW) continue;
          let tmin = 1e9, tmax = -1e9, smin = 1e9, smax = -1e9; for (let k = 0; k < C.pts.length; k += 2) { const dx = C.pts[k] - it.fx, dz = C.pts[k + 1] - it.fz, t = dx * ux + dz * uz, s = dx * vx + dz * vz; if (t < tmin) tmin = t; if (t > tmax) tmax = t; if (s < smin) smin = s; if (s > smax) smax = s; }
          if (tmax < T0 || tmin > T1 || smax < -HS || smin > HS) continue;
          const cx = (C.x0 + C.x1) / 2, cz = (C.z0 + C.z1) / 2, g0 = G.ground ? G.ground(cx, cz) : 0; if (C.y1 < g0 + B0 || C.y0 > g0 + B1) continue;      // not in the body band
          out.push({ id: it.id, o, C, mesh: p.split('>').slice(-2).join('>'), tris: C.tris.length, w: +w.toFixed(2), h: +h.toFixed(2), t: +((tmin + tmax) / 2).toFixed(2), s: +((smin + smax) / 2).toFixed(2) });
        }
      }
    }
    return out;
  }
  function scan(items) { const t0 = performance.now(); const r = piecesOf(items).map(({ id, mesh, tris, w, h, t, s }) => ({ id, mesh, tris, w, h, t, s })); st.scanned++; st.ms = Math.round(performance.now() - t0); return r; }
  // the pieces that touch the seed piece (and each other): the same mesh, <= 10 cm apart in x / y / z, the group <= CAPW x CAPW x CAPH; they are added to `taken`
  function closure(o, seed, taken) {
    const L = getComps(o), set = [seed]; let x0 = seed.x0, x1 = seed.x1, y0 = seed.y0, y1 = seed.y1, z0 = seed.z0, z1 = seed.z1; const out = [];
    const cand = L.filter((C) => !taken.has(C) && C.y1 - C.y0 >= MINP && Math.max(C.x1 - C.x0, C.z1 - C.z0) <= MAXW);
    for (let pass = 0; pass < 4; pass++) {
      let grew = false;
      for (const D of cand) {
        if (taken.has(D)) continue; let touch = false;
        for (const C of set) if (D.x0 <= C.x1 + GAP && D.x1 >= C.x0 - GAP && D.z0 <= C.z1 + GAP && D.z1 >= C.z0 - GAP && D.y0 <= C.y1 + GAP && D.y1 >= C.y0 - GAP) { touch = true; break; }
        if (!touch) continue;
        const a0 = Math.min(x0, D.x0), a1 = Math.max(x1, D.x1), b0 = Math.min(y0, D.y0), b1 = Math.max(y1, D.y1), c0 = Math.min(z0, D.z0), c1 = Math.max(z1, D.z1);
        if (a1 - a0 > CAPW || c1 - c0 > CAPW || b1 - b0 > CAPH) continue;
        x0 = a0; x1 = a1; y0 = b0; y1 = b1; z0 = c0; z1 = c1; set.push(D); taken.add(D); out.push(D); grew = true;
      }
      if (!grew) break;
    }
    return out;
  }
  // cut the pieces out of their meshes: the index is rebuilt without their triangles (a rebuilt buffer: the old one is released)
  function run(items) {
    const t0 = performance.now(), hits = piecesOf(items), byMesh = new Map(), seen = new Set(); const done = [];
    for (const h of hits) {
      if (seen.has(h.C)) continue; seen.add(h.C); let s = byMesh.get(h.o); if (!s) byMesh.set(h.o, s = new Set()); for (const t of h.C.tris) s.add(t); done.push({ id: h.id, mesh: h.mesh, tris: h.tris, w: h.w, h: h.h, t: h.t, s: h.s });
      for (const D of closure(h.o, h.C, seen)) { for (const t of D.tris) s.add(t); done.push({ id: h.id, mesh: h.mesh, tris: D.tris.length, w: +Math.max(D.x1 - D.x0, D.z1 - D.z0).toFixed(2), h: +(D.y1 - D.y0).toFixed(2), t: null, s: null, via: 'touch' }); }
    }
    for (const [o, set] of byMesh) {
      const g = o.geometry, ia = g.index.array, nT = (g.index.count / 3) | 0, keep = new ia.constructor(ia.length - set.size * 3); let k = 0;
      for (let t = 0; t < nT; t++) { if (set.has(t)) continue; keep[k++] = ia[t * 3]; keep[k++] = ia[t * 3 + 1]; keep[k++] = ia[t * 3 + 2]; }
      const old = g.index; g.setIndex(new old.constructor(keep, 1)); g.dispose(); comps.delete(o);
    }
    st.passes++; st.ms = Math.round(performance.now() - t0); for (const d of done) st.removed.push(d); return done;
  }
  return { run, scan, st };
}
