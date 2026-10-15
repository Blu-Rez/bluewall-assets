// AN1_R3 part 3: cart route audit (body of an async function for an1_r3_page.py; the same code as an1_r3_carts.py)
const fn = async () => {
  const B = __bw, W = B.world.ctx.wsLife, R = window.__R3, L = R.L, cam = B.camera, h = B.world.fastHeight, LV = L.MOAT.level, deck = R.makeGroundY(R.bridgesFromLayout(L));       // the movers' deck heights (nav.js): road bridges + the town-gate moat bridges + the main gate bridge
  cam.position.set(20, 90, 80); cam.lookAt(20, 0, 16); cam.updateMatrixWorld(true);
  let t = B.t || 0;
  const step = (n) => { for (let i = 0; i < n; i++) { t += 1 / 30; B.world.update(t, 1 / 30, cam); } };
  // one route per site; ask for every grid (the cart sites + all their neighbours: gridOf builds a grid for any site)
  const sites = []; const seen = new Set();
  for (const c of W.carts) if (!seen.has(c.S.site.id)) { seen.add(c.S.site.id); sites.push(c); }
  const allSites = new Map(); for (const c of W.carts) allSites.set(c.S.site.id, c.S.site); for (const a of W.agents) allSites.set(a.S.site.id, a.S.site);
  for (const s of allSites.values()) W.gridOf(s);
  for (let i = 0; i < 4000; i++) { step(2); let all = true; for (const g of W.grids.values()) if (g && !g.ready) { all = false; break; } if (all) break; }
  const grids = []; for (const [id, g] of W.grids) if (g && g.ready) grids.push([id, g]);
  const onBridge = (x, z, m) => (L.RBRIDGES || []).some((b) => { const rx = x - b.x, rz = z - b.z; return Math.abs(rx * b.nx + rz * b.nz) <= b.len / 2 + m && Math.abs(-rx * b.nz + rz * b.nx) <= b.wid / 2 + m + 0.5; });
  const nearestRoad = (x, z) => {
    let best = null;
    for (const r of R.ROADS) for (let i = 0; i < r.pts.length - 1; i++) {
      const a = r.pts[i], b = r.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)), d = Math.hypot(x - a[0] - dx * u, z - a[1] - dz * u);
      if (!best || d < best.d) best = { name: r.name, i, u: +u.toFixed(2), d: +d.toFixed(1), w: r.w, surf: r.surf };
    }
    return best;
  };
  const routes = [];
  for (const c of sites) {
    const rt = c.rt, Ln = rt.L, o = { x: 0, z: 0 }, site = c.S.site, boxes = [], fords = [];
    let cb = null, cf = null, n = 0, nb = 0, nf = 0, nbr = 0;
    for (let s = 0; s <= Ln.len; s += 0.5) {
      Ln.at(s, o); n++;
      let blk = null; for (const [id, g] of grids) if (!g.free(o.x, o.z)) { blk = id; break; }
      const hh = h(o.x, o.z), dep = LV - hh, br = onBridge(o.x, o.z, 1) || deck(o.x, o.z, hh) - hh >= 0.3, deep = dep > 0.3 && !br;
      if (dep > 0.3 && br) nbr++;
      if (blk) { nb++; if (cb && cb.site === blk && s - cb.s1 < 1.1) { cb.s1 = s; cb.x1 = o.x; cb.z1 = o.z; } else { cb = { site: blk, s0: s, s1: s, x0: o.x, z0: o.z, x1: o.x, z1: o.z }; boxes.push(cb); } }
      if (deep) { nf++; if (cf && s - cf.s1 < 1.1) { cf.s1 = s; cf.x1 = o.x; cf.z1 = o.z; cf.dep = Math.max(cf.dep, dep); } else { cf = { s0: s, s1: s, x0: o.x, z0: o.z, x1: o.x, z1: o.z, dep }; fords.push(cf); } }
    }
    const loc = (sx, x, z) => { const st = allSites.get(sx); if (!st) return null; const dx = x - st.x, dz = z - st.z; return [+(dx * Math.cos(st.ry) - dz * Math.sin(st.ry)).toFixed(1), +(dx * Math.sin(st.ry) + dz * Math.cos(st.ry)).toFixed(1)]; };
    for (const b of boxes) { b.mid = [(b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2]; b.local = loc(b.site, b.mid[0], b.mid[1]); b.road = nearestRoad(b.mid[0], b.mid[1]); b.len = +(b.s1 - b.s0 + 0.5).toFixed(1); }
    for (const f of fords) { f.mid = [(f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2]; f.road = nearestRoad(f.mid[0], f.mid[1]); f.len = +(f.s1 - f.s0 + 0.5).toFixed(1); f.dep = +f.dep.toFixed(2); f.nearBridge = (L.RBRIDGES || []).map((b) => [Math.hypot(b.x - f.mid[0], b.z - f.mid[1]), b]).sort((a, b) => a[0] - b[0]).slice(0, 1).map(([d, b]) => ({ d: +d.toFixed(1), x: +b.x.toFixed(1), z: +b.z.toFixed(1), len: b.len, wid: b.wid }))[0]; }
    routes.push({ site: site.id, kind: site.kind, dest: rt.dest, len: +Ln.len.toFixed(1), n, blockedSamples: nb, fordSamples: nf, bridgeSamples: nbr, carts: W.carts.filter((q) => q.rt === rt).length, pts: rt.pts.map((p) => [+p[0].toFixed(1), +p[1].toFixed(1)]), boxes, fords });
  }
  return { routes, grids: grids.length, rbridges: (L.RBRIDGES || []).length, level: LV };
};
return await fn();
