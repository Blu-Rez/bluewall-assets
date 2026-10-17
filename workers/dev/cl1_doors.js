// cl1_doors.js — CL1 (ROUND6) part 2/3: «extras in front of the doors».  Evaluated INSIDE the real game page, hero started.  Synchronous.
// For every door of the hero's door list (rp.doorItems(): the ~97 enterable buildings, door on the REAL facade, facing the keep) the zone in front of it
//   FRONT = the rectangle  0 .. DEPTH (3 m) along the door's facing  x  +-HALF (2 m) across it
// is searched for things that crowd it:
//   inst   — a copy of an instanced pack (props: barrel / crate / wagon / haybale / sack ..., rocks, bushes, tree cards = trunks, crops); the instance's centre (or, for a tree card, the trunk point) is inside FRONT grown by 0.5 x its radius
//   solid  — a solid cell of the hero's collision grid (a fence, a baked prop, a garden wall; NOT the door's own building: cells within 0.9 m of the facade line are skipped) with the cells counted
//   disc   — a game disc / box inside FRONT
// Result: window.__cl1d = { doors: [ { id, fx, fz, nx, nz, inst: [...], solid, disc, ... } ] }   and the JSON summary.
//   opt (window.__cl1opt): { depth: 3, half: 2 }
(() => {
  const opt = window.__cl1opt || {};
  const DEPTH = opt.depth || 3, HALF = opt.half || 2;
  const rp = window.__rp, S = rp.S, B = window.__bw, sc = B.scene, GR = rp.grid();
  const Mat4 = sc.matrixWorld.constructor;
  const SKIP_PATH = /crowd|pack#rp|attackerCamp|water-life|bank-life|waterfall|rp-ramps|rp-doors|rp-goup|rp-sisters|rp_marker|wslife>crowd|army>crowd|defenses>crowd/;
  const m4 = new Mat4(), m5 = new Mat4();
  sc.updateMatrixWorld(true);
  const pathOf = (o) => { const a = []; for (let p = o; p && p !== sc; p = p.parent) a.push(p.name || p.type); return a.reverse().join('>'); };
  // every instance of every instanced pack (the originals the cull module hid included; its proxies and the units / animated packs not)
  const objs = [];
  const walk = (o) => {
    if (o.userData && (o.userData.rpHero || o.userData.rpMarker || o.userData.rpProxy)) return;
    if (o.isInstancedMesh && o.geometry && !o.userData.a) {
      let anc = true; for (let p = o.parent; p; p = p.parent) if (p.visible === false) { anc = false; break; }
      const path = pathOf(o);
      if (anc && !SKIP_PATH.test(path)) {
        const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox, m = Array.isArray(o.material) ? o.material[0] : o.material;
        let animated = false; for (const k in g.attributes) if (g.attributes[k].isInstancedBufferAttribute) animated = true;
        if (!animated && m) {
          const alpha = m.alphaTest > 0 || m.transparent, n = Math.min(o.count, (o.instanceMatrix.array.length / 16) | 0);
          const key = [g.name || o.name || '', g.attributes.position.count, (bb.max.x - bb.min.x).toFixed(1), (bb.max.y - bb.min.y).toFixed(1), (bb.max.z - bb.min.z).toFixed(1), m.name || ''].join('|');
          for (let i = 0; i < n; i++) {
            m4.fromArray(o.instanceMatrix.array, i * 16); m5.multiplyMatrices(o.matrixWorld, m4); const e = m5.elements;
            if (e[0] === 0 && e[5] === 0 && e[10] === 0) continue;                                   // a slot the game emptied (a tree promoted to a real one)
            const sx = Math.hypot(e[0], e[1], e[2]), sy = Math.hypot(e[4], e[5], e[6]);
            const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
            const X = e[0] * cx + e[8] * cz + e[12], Z = e[2] * cx + e[10] * cz + e[14];
            objs.push({ o, i, key, path: path.split('>').slice(-3).join('>'), alpha, vc: g.attributes.position.count, x: X, z: Z, r: Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2 * sx, h: (bb.max.y - bb.min.y) * sy, y0: bb.min.y * sy + e[13] });
          }
        }
      }
    }
    for (const c of o.children) walk(c);
  };
  for (const c of sc.children) walk(c);
  const boxes = S.boxes || [], discs = S.discs || [];
  const dm = rp.doors(); if (dm && dm.build) dm.build(); const items = (dm && dm.items() || []).filter((it) => it.fx !== undefined); const out = [];
  for (const it of items) {
    const nx = (it.x - it.fx) / 0.7, nz = (it.z - it.fz) / 0.7, l = Math.hypot(nx, nz) || 1, ux = nx / l, uz = nz / l, vx = -uz, vz = ux;      // u = the door's facing, v = across
    const fr = (x, z, grow = 0) => { const dx = x - it.fx, dz = z - it.fz, t = dx * ux + dz * uz, s = dx * vx + dz * vz; return t > -grow && t < DEPTH + grow && Math.abs(s) < HALF + grow; };
    const rec = { id: it.id, kind: it.kind, fx: +it.fx.toFixed(2), fz: +it.fz.toFixed(2), ux: +ux.toFixed(3), uz: +uz.toFixed(3), inst: [], solid: 0, solidAt: [], disc: 0, box: 0 };
    for (const ob of objs) {
      if (Math.abs(ob.x - it.fx) > DEPTH + 4 || Math.abs(ob.z - it.fz) > DEPTH + 4) continue;
      const isTree = ob.alpha && ob.vc === 12;                                                      // a crossed-card tree: only its trunk counts
      const grow = isTree ? 0.3 : Math.min(0.5, ob.r * 0.5);
      if (!fr(ob.x, ob.z, grow)) continue;
      if (ob.y0 - rp.ground(ob.x, ob.z) > 2.5) continue;                                              // hangs in the air (a banner, a hanging sign)
      const tall = ob.h;
      if (tall < 0.2) continue;                                                                       // a pebble / a tuft of grass: not clutter
      rec.inst.push({ key: ob.key, path: ob.path, x: +ob.x.toFixed(2), z: +ob.z.toFixed(2), r: +ob.r.toFixed(2), h: +ob.h.toFixed(2), alpha: ob.alpha, tree: isTree, i: ob.i });
    }
    // solid grid cells in FRONT (not the building's own wall: skip the strip within 0.9 m of the facade line)
    if (GR && GR.st.ready) { let n = 0, ni = 0; const pts = [], ipts = []; for (let t = 0.9; t <= DEPTH; t += 0.25) for (let s = -HALF; s <= HALF; s += 0.25) { const x = it.fx + ux * t + vx * s, z = it.fz + uz * t + vz * s; if (GR.solid(x, z)) { n++; if (pts.length < 6) pts.push([+x.toFixed(1), +z.toFixed(1)]); } else if (GR.solidInst && GR.solidInst(x, z)) { ni++; if (ipts.length < 6) ipts.push([+x.toFixed(1), +z.toFixed(1)]); } } rec.solid = n; rec.solidAt = pts; rec.isolid = ni; rec.isolidAt = ipts; }
    for (const d of discs) if (fr(d[0], d[1], d[2] * 0.5)) rec.disc++;
    for (const b of boxes) if (b.type !== 'wall' && fr(b.x, b.z, 0)) rec.box++;
    out.push(rec);
  }
  window.__cl1d = { doors: out, objs: objs.length };
  const agg = {}; for (const d of out) for (const q of d.inst) { const k = (q.tree ? 'TREE' : q.key.split('|')[1] || q.path) + ' ' + q.key.split('|').slice(2, 5).join('x'); agg[k] = (agg[k] || 0) + 1; }
  return JSON.stringify({ doors: out.length, instObjs: objs.length, withInst: out.filter((d) => d.inst.length).length, withSolid: out.filter((d) => d.solid > 0).length, withInstSolid: out.filter((d) => d.isolid > 0).length, withDisc: out.filter((d) => d.disc || d.box).length, agg, sample: out.slice(0, 3) });
})()
