// RP1C-R3 (Job 6) — the way UP to the wall-walk.  There is no stair clip and wall-climbing stays OFF (HOTFIX47), so the way up is a RAMP she WALKS or RUNS with the normal clips.
// A lazy ES module (fetched with rpg.js, hero mode only: nothing of it is in the boot bundle; the strategic map and the battle never see it — the ramps are decoration + hero collision, NOT targets, NOT solids for the troops;
// the game's noRoute is untouched because nothing here is a game object).
//   · PLAN  (planRamps — pure, node-testable): for every wall run of the outer + town ring (the inner ring is 16 m: no ramp) the candidates are laid on the INNER face of the run — a straight flight (long runs) or a U of two
//     flights with a flat turn landing (short runs) — at a constant grade <= 0.33 (0.30 first), lane 3.0 m, a flat 3 m landing at the wall-walk floor (`b.h + 0.145`, the height rpg.js walks the wall-walk at).
//     A candidate is accepted only if every sample of its footprint (and of the 3 m apron before its foot) is clear of houses / cottages / civic lots (discs + rects + margin), towers, gates, the keep, other walls and water,
//     and the terrain stays below the surface (a solid stone fill, no gap).  From each wall the best candidate (the lowest score: S before U, grade 0.30 before 0.33, nearest the tower end) is kept;
//     then they are spread round the ring (farthest first) up to `max` per ring.
//   · WALK  (createRamps): height(x, z) = the surface under (x, z) — the ONE marked line in rpg.js `homeGround`; boxes() = the parapets (the same record as a wall box, type 'ramp') appended to S.boxes;
//     topExit() / landingAt() = the hand-over between a top landing and the wall-walk layer (rpg.js reuses its own over-the-parapet blend of `climb`, 0.6 s).
//   · LOOK  (buildGeom — pure): one mesh per ramp, vertex colours only (no texture, no atlas, no new image), coloured with the AVERAGE colour of the castle's own wall stone sampled from the TR2 atlas at the wall's UVs
//     (the tier colour is never invented; a neutral stone when the castle is procedural), courses every 0.9 m, a lighter coping, a stone fill down to the terrain.  MeshStandardMaterial {vertexColors}.
// Budget: <= 1..2 calls near a ramp (each ramp is a frustum-culled mesh), ~2 k triangles per ramp, 1 material, +0 lights, no per-frame allocation (height() allocates nothing), the plan is built once per hero session.
export const RAMP = { grade: 0.30, gradeMax: 0.33, lane: 2.6, div: 0.6, land: 2.6, para: 1.15, paraT: 0.5, vis: 0.72, apron: 3.0, end: 3.7, mDisc: 0.5, mBox: 1.0 };   // end = how near the footprint may come to a run's end (a tower's face is 2.4 m inside it; fits() keeps 1.4 m off the tower box itself)

const hyp = Math.hypot;
const isWall = (b) => b.type === 'wall' && b.h >= 2.4 && b.h <= 12;

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// the plan.  D = { boxes: [{x,z,hw,hd,rot,h,type,ringId?,id}], discs: [[x,z,r]], rects: [{x,z,w,d,ry}], ground(x,z), wsurf, topY(b), max: {ringId: n} }
// A wall frame: `a` along the run (the box's u axis), `l` measured from the centre line towards the INSIDE of the ring.
function frameOf(b, cx, cz) {
  const ux = Math.cos(b.rot), uz = -Math.sin(b.rot), vx = Math.sin(b.rot), vz = Math.cos(b.rot), sg = (cx - b.x) * vx + (cz - b.z) * vz >= 0 ? 1 : -1, nx = vx * sg, nz = vz * sg;
  return { sg, W: (a, l) => [b.x + ux * a + nx * l, b.z + uz * a + nz * l] };
}
// the layout of one candidate in the wall frame: segments (flight / land) and parapet prisms
function layout(b, design, dir, off, g, D) {
  const LN = RAMP.lane, DV = RAMP.div, LD = RAMP.land, hw = b.hw, hd = b.hd, topY = D.topY(b), W = b.W;
  const aEnd = dir > 0 ? -hw + RAMP.end : hw - RAMP.end, aF = aEnd + dir * off;                        // the foot: the first step on the ground
  const l0 = hd, l1 = hd + LN, l2 = l1 + DV, l3 = l2 + LN, pt = RAMP.paraT;
  const yF = D.ground(...W(aF, design === 'S' ? l0 + LN / 2 : l2 + LN / 2)), rise = topY - yF; if (rise < 2) return null;
  const segs = [], para = [], lim = hw - RAMP.end;
  if (design === 'S') {
    const L = rise / g, aT = aF + dir * L, aL = aT + dir * LD; if (Math.abs(aL) > lim || Math.abs(aF) > hw) return null;
    segs.push({ k: 'flight', a0: aF, a1: aT, l0, l1, y0: yF, y1: topY });
    segs.push({ k: 'land', a0: aT, a1: aL, l0, l1, y0: topY, y1: topY, top: true });
    para.push({ a0: aF, a1: aL, l0: l1, l1: l1 + pt });                                                // the outer parapet along the whole thing
    para.push({ a0: aL, a1: aL + dir * pt, l0, l1: l1 + pt });                                         // the end of the landing
  } else {
    const LA = rise / (2 * g), aT1 = aF + dir * LA, aTurn = aT1 + dir * LD, aTop = aF - dir * LD, ym = yF + rise / 2;      // far flight out, turn landing, near flight back, top landing beyond the foot
    if (Math.abs(aTurn) > lim || Math.abs(aTop) > lim || Math.abs(aF) > hw) return null;
    segs.push({ k: 'flight', a0: aF, a1: aT1, l0: l2, l1: l3, y0: yF, y1: ym });
    segs.push({ k: 'land', a0: aT1, a1: aTurn, l0, l1: l3, y0: ym, y1: ym });
    segs.push({ k: 'flight', a0: aT1, a1: aF, l0, l1, y0: ym, y1: topY });
    segs.push({ k: 'land', a0: aF, a1: aTop, l0, l1, y0: topY, y1: topY, top: true });
    para.push({ a0: aF, a1: aTurn, l0: l3, l1: l3 + pt });                                              // the outer parapet of the far lane + the turn landing
    para.push({ a0: aF, a1: aT1, l0: l1, l1: l2, div: true });                                         // the divider between the two flights
    para.push({ a0: aTurn, a1: aTurn + dir * pt, l0, l1: l3 + pt });                                   // the end of the turn landing
    para.push({ a0: aF, a1: aTop, l0: l1, l1: l1 + pt });                                              // the far side of the top landing
    para.push({ a0: aTop, a1: aTop - dir * pt, l0, l1: l1 + pt });                                     // the end of the top landing
  }
  return { segs, para, aF, rise, g, hd, dir, design, yF, apron: { a0: aF - dir * RAMP.apron, a1: aF, l0: design === 'S' ? l0 : l2, l1: design === 'S' ? l1 : l3, y: yF } };
}
function fits(p, b, ctx, D) {
  const W = b.W, margin = RAMP.mBox, mD = RAMP.mDisc;
  const clear = (x, z) => {
    for (const d of ctx.ds) if ((x - d[0]) * (x - d[0]) + (z - d[1]) * (z - d[1]) < (d[2] + mD) * (d[2] + mD)) return false;
    for (const r of ctx.rs) { const c = Math.cos(r.ry), sn = Math.sin(r.ry), u = (x - r.x) * c - (z - r.z) * sn, v = (x - r.x) * sn + (z - r.z) * c; if (Math.abs(u) < r.w / 2 + mD && Math.abs(v) < r.d / 2 + mD) return false; }
    for (const o of ctx.os) { const c = Math.cos(o.rot || 0), sn = Math.sin(o.rot || 0), u = (x - o.x) * c - (z - o.z) * sn, v = (x - o.x) * sn + (z - o.z) * c; if (Math.abs(u) < o.hw + margin && Math.abs(v) < o.hd + margin) return false; }
    for (const o of ctx.ow) { const c = Math.cos(o.rot || 0), sn = Math.sin(o.rot || 0), u = (x - o.x) * c - (z - o.z) * sn, v = (x - o.x) * sn + (z - o.z) * c; if (Math.abs(u) < o.hw + 2 && Math.abs(v) < o.hd + 2) return false; }
    return true;
  };
  const scan = (s, apron) => {
    const a0 = Math.min(s.a0, s.a1), a1 = Math.max(s.a0, s.a1), sl = s.a1 === s.a0 ? 0 : (s.y1 - s.y0) / (s.a1 - s.a0);
    for (let a = a0; a <= a1 + 0.999; a += 1.0) for (let l = s.l0; l <= s.l1 + 0.999; l += 1.0) {
      const aa = Math.min(a, a1), ll = Math.min(l, s.l1), [x, z] = W(aa, ll), th = D.ground(x, z), sy = apron ? s.y : s.y0 + sl * (aa - s.a0);
      if (th < D.wsurf + 0.4) return false;                                                            // water
      if (!apron && th > sy + 0.3) return false;                                                       // a hill that would bury the surface
      if (apron && Math.abs(th - sy) > 1.0) return false;                                              // the way to the foot must be level ground
      if (!clear(x, z)) return false;
    }
    return true;
  };
  for (const s of p.segs) if (!scan(s, false)) return false;
  return scan({ a0: p.apron.a0, a1: p.apron.a1, l0: p.apron.l0, l1: p.apron.l1, y: p.apron.y }, true);
}
export const _t = { layout, fits, frameOf };   // (the node / dev tests call the planner's parts)
export function planRamps(D) {
  const walls = D.boxes.filter(isWall), others = D.boxes.filter((b) => !isWall(b) && b.type !== 'ramp'), rings = {}, chosen = [];
  for (const b of walls) (rings[b.ringId || '?'] = rings[b.ringId || '?'] || []).push(b);
  for (const k in rings) {
    const rw = rings[k]; let cx = 0, cz = 0; for (const b of rw) { cx += b.x; cz += b.z; } cx /= rw.length; cz /= rw.length;
    const cand = [];
    for (const b of rw) {
      const fr = frameOf(b, cx, cz); b.W = fr.W; b.sg = fr.sg;
      const R = b.hw + 45, near = (x, z) => (x - b.x) * (x - b.x) + (z - b.z) * (z - b.z) < R * R;
      const ctx = { ds: D.discs.filter((d) => near(d[0], d[1])), rs: (D.rects || []).filter((r) => near(r.x, r.z)), os: others.filter((o) => near(o.x, o.z)), ow: walls.filter((o) => o !== b && near(o.x, o.z)) };
      let bestC = null;
      for (const design of ['S', 'U']) for (const dir of [1, -1]) {
        let found = null;
        for (let off = 0; off <= 24 && !found; off += 3) for (const g of [RAMP.grade, RAMP.gradeMax]) {
          const p = layout(b, design, dir, off, g, D); if (!p) continue;
          if (fits(p, b, ctx, D)) { found = { b, plan: p, design, dir, g, off, ring: k, score: off + (design === 'U' ? 6 : 0) + (g > RAMP.grade ? 2 : 0) }; break; }
        }
        if (found && (!bestC || found.score < bestC.score)) bestC = found;
      }
      if (bestC) cand.push(bestC);
    }
    // spread round the ring (farthest first), at most `max` per ring; a candidate whose footprint (lanes, parapets, apron) comes within 3.2 m of one already taken is dropped
    const cap = (D.max && D.max[k]) || 6, mine = [], pt = (c) => c.b.W(c.plan.aF, c.plan.hd + 3);
    const sample = (c) => { const o = [], W = c.b.W; for (const s of c.plan.segs) { const a0 = Math.min(s.a0, s.a1), a1 = Math.max(s.a0, s.a1); for (let a = a0; a <= a1 + 0.01; a += 2) for (const l of [s.l0, (s.l0 + s.l1) / 2, s.l1 + RAMP.paraT]) o.push(W(a, l)); } const ap = c.plan.apron; for (let a = Math.min(ap.a0, ap.a1); a <= Math.max(ap.a0, ap.a1); a += 1.5) for (const l of [ap.l0, ap.l1]) o.push(W(a, l)); return o; };
    const clash = (A, B) => { for (const p of A) for (const q of B) if (hyp(p[0] - q[0], p[1] - q[1]) < 3.2) return true; return false; };
    const pool = cand.slice().sort((p, q) => p.score - q.score); for (const c of pool) c.smp = sample(c);
    while (pool.length && mine.length < cap) {
      let bi = -1, bd = -1;
      for (let i = 0; i < pool.length; i++) { const p = pt(pool[i]); let m = 1e9; for (const c of mine) { const q = pt(c); m = Math.min(m, hyp(p[0] - q[0], p[1] - q[1])); } if (!mine.length) m = 1e6 - pool[i].score; if (m > bd && !mine.some((c) => clash(c.smp, pool[i].smp))) { bd = m; bi = i; } }
      if (bi < 0) break; mine.push(pool.splice(bi, 1)[0]);
    }
    chosen.push(...mine);
  }
  return chosen.map((c, i) => finish(c, i, D));
}

// a candidate -> the world-space record: segments (surface lookup), parapet boxes (collision), frame
function finish(c, i, D) {
  const P = c.plan, W = c.b.W, segs = [], boxes = [];
  for (const s of P.segs) {
    const lm = (s.l0 + s.l1) / 2, am = (s.a0 + s.a1) / 2, da = Math.sign(s.a1 - s.a0) || 1, [x, z] = W(am, lm), [ax, az] = W(s.a0, lm), [bx, bz] = W(s.a0 + da, lm);
    segs.push({ k: s.k, x, z, hl: Math.abs(s.a1 - s.a0) / 2, hwid: (s.l1 - s.l0) / 2, dx: bx - ax, dz: bz - az, y0: s.y0, y1: s.y1, top: !!s.top, a0: s.a0, a1: s.a1, l0: s.l0, l1: s.l1, da });
  }
  let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const s of P.segs) for (const a of [s.a0, s.a1]) for (const l of [s.l0, s.l1 + RAMP.paraT]) { const [x, z] = W(a, l); x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  // the parapets as collision boxes, in chunks of <= 2.5 m so that `h` (above the ground) follows the slope
  for (const p of P.para) {
    const L = Math.abs(p.a1 - p.a0); if (L < 0.01) continue; const n = Math.max(1, Math.ceil(L / 2.5)), da = Math.sign(p.a1 - p.a0) || 1;
    for (let k = 0; k < n; k++) {
      const a0 = p.a0 + da * (L * k) / n, a1 = p.a0 + da * (L * (k + 1)) / n, am = (a0 + a1) / 2, lm = (p.l0 + p.l1) / 2, [x, z] = W(am, lm), [ex, ez] = W(am + da, lm);
      const ys = Math.max(surfaceAt(segs, ...W(am, p.l0 - 0.05)), surfaceAt(segs, ...W(am, p.l1 + 0.05))), th = D.ground(x, z);
      boxes.push({ x, z, hw: Math.abs(a1 - a0) / 2 + 0.01, hd: (p.l1 - p.l0) / 2, rot: Math.atan2(-(ez - z), ex - x), h: Math.max(RAMP.para, (isFinite(ys) ? ys : th) + RAMP.para - th), type: 'ramp', id: 'ramp' + i });
    }
  }
  return { id: 'ramp' + i, ring: c.ring, wall: c.b, wallId: c.b.id, design: c.design, dir: c.dir, grade: c.g, rise: P.rise, sg: c.b.sg, W, segs, boxes, para: P.para, hd: P.hd, topSeg: segs.find((s) => s.top), bb: [x0 - 1, z0 - 1, x1 + 1, z1 + 1], len: P.segs.filter((s) => s.k === 'flight').reduce((a, s) => a + Math.abs(s.a1 - s.a0), 0) };
}
// the surface height of one segment record at (x, z), -Infinity when outside (allocation-free)
export function segHeight(s, x, z) {
  const rx = x - s.x, rz = z - s.z, u = rx * s.dx + rz * s.dz, v = -rx * s.dz + rz * s.dx;
  if (Math.abs(u) > s.hl + 1e-6 || Math.abs(v) > s.hwid + 1e-6) return -Infinity;
  const t = s.hl > 0 ? (u + s.hl) / (2 * s.hl) : 0;                                                    // 0 at the a0 end, 1 at the a1 end (dx,dz point from a0 towards a1)
  return s.y0 + (s.y1 - s.y0) * (t < 0 ? 0 : t > 1 ? 1 : t);
}
export function surfaceAt(segs, x, z) { let y = -Infinity; for (let i = 0; i < segs.length; i++) { const h = segHeight(segs[i], x, z); if (h > y) y = h; } return y; }

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// the geometry (pure) -> { pos: Float32Array, col: Float32Array, tris }.  Every quad is wound so that its normal points to the side given by `hint` (a world vector), whatever the order of its corners.
export function buildGeom(r, D, base, tex) {
  const pos = [], col = [], uvs = [], c0 = base, W = r.W, P = RAMP, vis = D.vis != null ? D.vis : P.vis, np = tex && tex.patches ? tex.patches.length : 0;
  const rnd = (i) => { const s = Math.sin(i * 12.9898 + 4.1414) * 43758.5453; return s - Math.floor(s); };
  let qi = 0;
  const ST = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const push = (p, m, st, pa) => {
    pos.push(p[0], p[1], p[2]); col.push(Math.min(1, c0[0] * m), Math.min(1, c0[1] * m), Math.min(1, c0[2] * m));
    if (np) { const hs = pa.hf ? 1 - st[0] : st[0], up = pa.fup ? 1 - st[1] : st[1], U = pa.swap ? up : hs, V = pa.swap ? hs : up; uvs.push(pa.u0 + (pa.u1 - pa.u0) * U, pa.v0 + (pa.v1 - pa.v0) * V); }
  };
  const quad = (a, b, c, d, m, h) => {                                                                // a b c d = a convex quad (texture corners (0,0) (1,0) (1,1) (0,1): s along a->b, t = up); h = [hx, hy, hz] the side that must face the viewer
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, flip = nx * h[0] + ny * h[1] + nz * h[2] < 0;
    const mm = m * (1 + (rnd(qi++) - 0.5) * 0.08); let pa = null;
    if (np) { const q0 = tex.patches[Math.floor(rnd(qi * 3.7) * np) % np]; pa = { u0: q0.u0, u1: q0.u1, v0: q0.v0, v1: q0.v1, swap: q0.swap, fup: q0.fup, hf: rnd(qi * 1.3) < 0.5 }; }
    if (flip) { push(a, mm, ST[0], pa); push(c, mm, ST[2], pa); push(b, mm, ST[1], pa); push(a, mm, ST[0], pa); push(d, mm, ST[3], pa); push(c, mm, ST[2], pa); }
    else { push(a, mm, ST[0], pa); push(b, mm, ST[1], pa); push(c, mm, ST[2], pa); push(a, mm, ST[0], pa); push(c, mm, ST[2], pa); push(d, mm, ST[3], pa); }
  };
  const UP = [0, 1, 0], vec = (a, l, a2, l2) => { const p = W(a, l), q = W(a2, l2); return [q[0] - p[0], 0, q[1] - p[1]]; };
  const lg = (l) => (Math.abs(l - r.hd) < 1e-6 ? r.hd * vis : l);                                      // the lane's wall-side edge is the VISIBLE face of the wall (the collision box is wider than the stone)
  // the lane surface: strips of ~0.9 m across the segment ("courses", alternating tone)
  for (const s of r.segs) {
    const L = 2 * s.hl, n = Math.max(1, Math.round(L / 0.9)), da = s.da, la = lg(s.l0), lb = s.l1;
    for (let k = 0; k < n; k++) {
      const a0 = s.a0 + da * (L * k) / n, a1 = s.a0 + da * (L * (k + 1)) / n, y0 = s.y0 + (s.y1 - s.y0) * k / n, y1 = s.y0 + (s.y1 - s.y0) * (k + 1) / n, m = k % 2 ? 0.91 : 1.0;
      const A = W(a0, la), B = W(a1, la), C = W(a1, lb), E = W(a0, lb);
      quad([A[0], y0, A[1]], [B[0], y1, B[1]], [C[0], y1, C[1]], [E[0], y0, E[1]], m, UP);
    }
  }
  // the parapet prisms: stone from the terrain up to (surface + para), cut in 1.5 m chunks; the two long faces are laid in ~1.2 m courses
  const surfY = (p, a) => { const s = Math.max(surfaceAt(r.segs, ...W(a, p.l0 - 0.05)), surfaceAt(r.segs, ...W(a, p.l1 + 0.05))); return isFinite(s) ? s : D.ground(...W(a, (p.l0 + p.l1) / 2)); };
  for (const p of r.para) {
    const L = Math.abs(p.a1 - p.a0); if (L < 0.01) continue; const n = Math.max(1, Math.round(L / 1.5)), da = Math.sign(p.a1 - p.a0) || 1;
    const lo = p.l0, hi = p.l1, hI = vec(0, hi, 0, lo), hO = vec(0, lo, 0, hi), hA = [da * (W(1, 0)[0] - W(0, 0)[0]), 0, da * (W(1, 0)[1] - W(0, 0)[1])];
    for (let k = 0; k < n; k++) {
      const a0 = p.a0 + da * (L * k) / n, a1 = p.a0 + da * (L * (k + 1)) / n, t0 = surfY(p, a0) + P.para, t1 = surfY(p, a1) + P.para;
      const I0 = W(a0, lo), I1 = W(a1, lo), O0 = W(a0, hi), O1 = W(a1, hi);
      const g = (q) => D.ground(q[0], q[1]) - 0.3, bI0 = Math.min(g(I0), t0 - 0.3), bI1 = Math.min(g(I1), t1 - 0.3), bO0 = Math.min(g(O0), t0 - 0.3), bO1 = Math.min(g(O1), t1 - 0.3);
      const v3 = (q, y) => [q[0], y, q[1]], course = (A0, A1, ya0, ya1, yb0, yb1, hint, m0) => {          // a face between two bottoms and two tops, cut in courses
        const hgt = Math.max(yb0 - ya0, yb1 - ya1, 0.1), nc = Math.max(1, Math.round(hgt / 1.2));
        for (let c = 0; c < nc; c++) { const f0 = c / nc, f1 = (c + 1) / nc, L0 = (f) => ya0 + (yb0 - ya0) * f, L1 = (f) => ya1 + (yb1 - ya1) * f; quad(v3(A0, L0(f0)), v3(A1, L1(f0)), v3(A1, L1(f1)), v3(A0, L0(f1)), m0 * (c % 2 ? 0.93 : 1), hint); }
      };
      course(I0, I1, bI0, bI1, t0, t1, hI, 0.86);                                                      // the face towards the lane
      course(O0, O1, bO0, bO1, t0, t1, hO, p.div ? 0.86 : 0.78);                                       // the face away from the lane (down to the terrain)
      quad(v3(I0, t0), v3(I1, t1), v3(O1, t1), v3(O0, t0), 1.14, UP);                                  // the coping
      if (k === 0) quad(v3(I0, bI0), v3(O0, bO0), v3(O0, t0), v3(I0, t0), 0.82, [-hA[0], 0, -hA[2]]);
      if (k === n - 1) quad(v3(I1, bI1), v3(O1, bO1), v3(O1, t1), v3(I1, t1), 0.82, hA);
    }
  }
  // the foot of each flight that starts on the ground: a wedge from the terrain to the surface (so the lane does not hang in the air on a rough terrain)
  for (const s of r.segs) {
    if (s.k !== 'flight') continue; const A = W(s.a0, lg(s.l0)), B = W(s.a0, s.l1), tA = D.ground(A[0], A[1]), tB = D.ground(B[0], B[1]);
    if (Math.abs(s.y0 - D.ground(...W(s.a0, (s.l0 + s.l1) / 2))) < 0.6) quad([A[0], Math.min(tA, s.y0) - 0.2, A[1]], [B[0], Math.min(tB, s.y0) - 0.2, B[1]], [B[0], s.y0, B[1]], [A[0], s.y0, A[1]], 0.8, [-s.da * (W(1, 0)[0] - W(0, 0)[0]), 0, -s.da * (W(1, 0)[1] - W(0, 0)[1])]);
  }
  return { pos: new Float32Array(pos), col: new Float32Array(col), uv: np ? new Float32Array(uvs) : null, tris: pos.length / 9 };
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export function createRamps(H, S, G) {
  const T = H.THREE, { scene } = H;
  const st = { on: false, ramps: [], built: false, ms: 0, tris: 0, colour: null, planMs: 0 };
  const grp = new T.Group(); grp.name = 'rp-ramps'; grp.userData.rpHero = true;
  let mat = null; const meshes = [];
  // the average colour of the castle's own wall stone: the TR2 atlas at the UVs of the wall's vertical faces (linear), else null (a neutral stone)
  function stoneColour(b) {
    try {
      const tr = G.world && G.world.tr2c; if (!tr || !tr.group) return null;
      let r = 0, g = 0, bl = 0, n = 0; const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true }), seen = new Map(), lin = (c) => Math.pow(c / 255, 2.2);
      tr.group.traverse((o) => {
        if (n > 600 || !o.isMesh || !o.geometry) return; const m = Array.isArray(o.material) ? o.material[0] : o.material, A = o.geometry.attributes; if (!m || !m.map || !m.map.image || !A.uv || !A.position || !A.normal) return;
        let px = seen.get(m.map); if (!px) { const im = m.map.image; if (!im.width) return; cv.width = im.width; cv.height = im.height; cx.drawImage(im, 0, 0); px = { d: cx.getImageData(0, 0, im.width, im.height).data, w: im.width, h: im.height }; seen.set(m.map, px); }
        o.updateWorldMatrix(true, false); const e = o.matrixWorld.elements, p = A.position, nr = A.normal, uv = A.uv, cc = A.color, flip = m.map.flipY;
        for (let i = 0; i < p.count && n <= 600; i++) {
          const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i), x = e[0] * X + e[4] * Y + e[8] * Z + e[12], y = e[1] * X + e[5] * Y + e[9] * Z + e[13], z = e[2] * X + e[6] * Y + e[10] * Z + e[14];
          const dx = x - b.x, dz = z - b.z, u = dx * b.ux + dz * b.uz, v = dx * b.vx + dz * b.vz; if (Math.abs(u) > b.hw || Math.abs(v) > b.hd + 0.3 || y < 1.5 || y > b.h - 1.5 || Math.abs(nr.getY(i)) > 0.4) continue;
          const tx = Math.min(px.w - 1, Math.max(0, Math.floor(uv.getX(i) * px.w))), ty = Math.min(px.h - 1, Math.max(0, Math.floor((flip ? 1 - uv.getY(i) : uv.getY(i)) * px.h))), q = (ty * px.w + tx) * 4, k = cc ? [cc.getX(i), cc.getY(i), cc.getZ(i)] : [1, 1, 1];
          r += lin(px.d[q]) * k[0]; g += lin(px.d[q + 1]) * k[1]; bl += lin(px.d[q + 2]) * k[2]; n++;
        }
      });
      return n < 12 ? null : [Math.min(1, r / n), Math.min(1, g / n), Math.min(1, bl / n)];
    } catch (e) { return null; }
  }
  // the castle's OWN stone for the ramps: patches (a UV rectangle inside a big vertical wall triangle, its orientation: which UV axis is "up") of the wall near `b`, and the material they belong to (the very object the castle uses: +0 programs)
  const hv = new Map();
  function harvest(b) {
    const key = b.ringId || '?'; if (hv.has(key)) return hv.get(key);
    let out = null;
    try {
      const tr = G.world && G.world.tr2c; if (tr && tr.group) {
        const byMat = new Map();
        tr.group.traverse((o) => {
          if (!o.isMesh || !o.geometry || !o.geometry.attributes.uv) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || !m.map) return;
          o.updateWorldMatrix(true, false); const e = o.matrixWorld.elements, A = o.geometry.attributes, idx = o.geometry.index, n = idx ? idx.count / 3 : A.position.count / 3, X = [0, 0, 0], Y = [0, 0, 0], Z = [0, 0, 0], U = [0, 0, 0], V = [0, 0, 0];
          for (let t = 0; t < n; t++) {
            let cx = 0, cy = 0, cz = 0;
            for (let k = 0; k < 3; k++) { const i = idx ? idx.getX(t * 3 + k) : t * 3 + k, px = A.position.getX(i), py = A.position.getY(i), pz = A.position.getZ(i); X[k] = e[0] * px + e[4] * py + e[8] * pz + e[12]; Y[k] = e[1] * px + e[5] * py + e[9] * pz + e[13]; Z[k] = e[2] * px + e[6] * py + e[10] * pz + e[14]; U[k] = A.uv.getX(i); V[k] = A.uv.getY(i); cx += X[k] / 3; cy += Y[k] / 3; cz += Z[k] / 3; }
            const dx = cx - b.x, dz = cz - b.z, u = dx * b.ux + dz * b.uz, v = dx * b.vx + dz * b.vz; if (Math.abs(u) > b.hw - 2 || Math.abs(v) > b.hd + 0.6 || cy < 1.5 || cy > b.h - 1.5) continue;
            const e1x = X[1] - X[0], e1y = Y[1] - Y[0], e1z = Z[1] - Z[0], e2x = X[2] - X[0], e2y = Y[2] - Y[0], e2z = Z[2] - Z[0], nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x, ar = Math.hypot(nx, ny, nz) / 2;
            if (ar < 1.2 || Math.abs(ny) / (2 * ar) > 0.3) continue;
            const w1x = e1x * b.ux + e1z * b.uz, w1y = e1y, w2x = e2x * b.ux + e2z * b.uz, w2y = e2y, det = w1x * w2y - w1y * w2x; if (Math.abs(det) < 1e-4) continue;
            const d1u = U[1] - U[0], d1v = V[1] - V[0], d2u = U[2] - U[0], d2v = V[2] - V[0];
            const J00 = (d1u * w2y - d2u * w1y) / det, J01 = (-d1u * w2x + d2u * w1x) / det, J10 = (d1v * w2y - d2v * w1y) / det, J11 = (-d1v * w2x + d2v * w1x) / det;     // d(U,V)/d(along, up)
            let swap, fup; if (Math.abs(J01) < 0.2 * Math.abs(J11) && Math.abs(J10) < 0.2 * Math.abs(J00)) { swap = false; fup = J11 < 0; } else if (Math.abs(J11) < 0.2 * Math.abs(J01) && Math.abs(J00) < 0.2 * Math.abs(J10)) { swap = true; fup = J01 < 0; } else continue;
            const u0 = Math.min(U[0], U[1], U[2]), u1 = Math.max(U[0], U[1], U[2]), v0 = Math.min(V[0], V[1], V[2]), v1 = Math.max(V[0], V[1], V[2]), mu = (U[0] + U[1] + U[2]) / 3, mv = (V[0] + V[1] + V[2]) / 3, hu = 0.17 * (u1 - u0), hv2 = 0.17 * (v1 - v0);
            if (hu < 0.004 || hv2 < 0.004) continue;
            let cr = 1, cg = 1, cb = 1; const C = A.color; if (C) { cr = cg = cb = 0; for (let k = 0; k < 3; k++) { const i = idx ? idx.getX(t * 3 + k) : t * 3 + k; cr += C.getX(i) / 3; cg += C.getY(i) / 3; cb += C.getZ(i) / 3; } }       // the wall's own TINT (vertex colour: the tier / theme colour is multiplied onto the atlas texel)
            let L = byMat.get(m); if (!L) byMat.set(m, L = []); L.push({ u0: mu - hu, u1: mu + hu, v0: mv - hv2, v1: mv + hv2, swap, fup, c: [cr, cg, cb] });
          }
        });
        st.hv = [...byMat].map(([m, L]) => ({ id: m.uuid.slice(0, 4), n: L.length, size: m.map.image && m.map.image.width })); let best = null; for (const [m, L] of byMat) if (!best || L.length > best.L.length) best = { m, L };
        if (best && best.L.length >= 8) { best.L.sort((p, q) => (q.u1 - q.u0) * (q.v1 - q.v0) - (p.u1 - p.u0) * (p.v1 - p.v0)); const P = best.L.slice(0, 40), tint = [0, 1, 2].map((k) => P.reduce((a, q) => a + q.c[k], 0) / P.length); out = { mat: best.m, patches: P, tint }; }
      }
    } catch (e) { out = null; }
    hv.set(key, out); return out;
  }
  st.harvest = harvest;
  function build() {
    if (st.built) return; st.built = true; const t0 = performance.now();
    const boxes = S.boxes.filter((b) => b.type !== 'ramp');
    const lots = (H.sheets && H.sheets.lots) ? H.sheets.lots().map((l) => ({ x: l.x, z: l.z, w: l.w, d: l.d, ry: l.ry })) : [];
    const D = { boxes, discs: S.discs, rects: lots, ground: G.terrain, wsurf: G.wsurf, topY: G.topY, max: G.max || {}, vis: RAMP.vis };
    const plan = planRamps(D); st.planMs = performance.now() - t0; st.D = D;   // (dev: the tests re-ask the planner with the same data)
    const stone = []; for (const b of boxes) if (b.type === 'wall' && stone.length < 2) { const c = stoneColour(b); if (c) stone.push(c); }
    const base = stone.length ? [0, 1, 2].map((i) => stone.reduce((s, c) => s + c[i], 0) / stone.length) : [0.30, 0.29, 0.27]; st.colour = stone.length ? base : null;
    mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 });
    for (const r of plan) {
      const tx = harvest(r.wall), g = buildGeom(r, D, tx ? tx.tint : base, tx), geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(g.pos, 3)); geo.setAttribute('color', new T.BufferAttribute(g.col, 3)); if (g.uv) geo.setAttribute('uv', new T.BufferAttribute(g.uv, 2)); geo.computeVertexNormals(); geo.computeBoundingSphere();
      const m = new T.Mesh(geo, tx ? tx.mat : mat); m.castShadow = true; m.receiveShadow = true; m.name = r.id; m.userData.rpHero = true; grp.add(m); meshes.push(m); st.tris += g.tris; r.textured = !!tx;
    }
    st.ramps = plan; st.ms = performance.now() - t0;
  }
  function enter() { if (st.on) return; if (!st.built) build(); st.on = true; scene.add(grp); }
  function exit() { if (!st.on) return; st.on = false; grp.removeFromParent(); }
  // dispose everything (the plan depends on the layout + castle level: it is rebuilt at the next hero session)
  function dispose() { exit(); for (const m of meshes) m.geometry.dispose(); meshes.length = 0; if (mat) { mat.dispose(); mat = null; } for (const c of [...grp.children]) grp.remove(c); st.ramps = []; st.built = false; st.tris = 0; }
  // the surface under (x, z): -Infinity when not on a ramp (allocation-free)
  function height(x, z) {
    if (!st.on) return -Infinity; let y = -Infinity;
    for (let i = 0; i < st.ramps.length; i++) { const R = st.ramps[i]; if (x < R.bb[0] || x > R.bb[2] || z < R.bb[1] || z > R.bb[3]) continue; for (let j = 0; j < R.segs.length; j++) { const h = segHeight(R.segs[j], x, z); if (h > y) y = h; } }
    return y;
  }
  const boxes = () => { if (!st.on) return []; const o = []; for (const r of st.ramps) for (const b of r.boxes) o.push(b); return o; };
  // she stands on a top landing (flush with the wall-walk floor) at the wall and pushes into it: { b, s, u } = the wall box, the side (+1 / -1 along b's v), the position along the wall
  function topExit(px, pz, py, dx, dz, R) {
    if (!st.on) return null;
    for (const r of st.ramps) {
      const s = r.topSeg; if (!s) continue; const h = segHeight(s, px, pz); if (h === -Infinity || Math.abs(py - h) > 0.25) continue;
      const b = r.wall, ex = px - b.x, ez = pz - b.z, v = ex * b.vx + ez * b.vz, u = ex * b.ux + ez * b.uz, d = Math.abs(v) - b.hd, into = -(dx * b.vx + dz * b.vz) * (v < 0 ? -1 : 1);
      if (d < R + 0.4 && into > 0.5 && Math.abs(u) < b.hw - 1.0) return { b, s: v < 0 ? -1 : 1, u };
    }
    return null;
  }
  // from the wall-walk: is there a top landing on wall `b`, on side `s`, at the position `u` along it?  -> { y, x, z, u } a spot on the landing to put her on
  function landingAt(b, u, s) {
    if (!st.on) return null;
    for (const r of st.ramps) {
      if (r.wall !== b || s !== r.sg) continue; const t = r.topSeg; if (!t) continue; const lo = Math.min(t.a0, t.a1) - 0.3, hi = Math.max(t.a0, t.a1) + 0.3;
      if (u < lo || u > hi) continue; const [x, z] = r.W(u, b.hd + 0.28); return { y: t.y1, x, z, u };
    }
    return null;
  }
  // the line a walker follows from the foot to the wall (the tests steer along it): [x, z] points, the last one is inside the wall (pushing into it)
  function route(i) {
    const r = st.ramps[i]; if (!r) return null; const W = r.W, pts = [], S0 = r.segs;
    const ap = r.segs[0], da = ap.da; pts.push(W(ap.a0 - da * 2.2, (ap.l0 + ap.l1) / 2));
    for (const s of S0) { const lm = (s.l0 + s.l1) / 2; if (s.k === 'flight') { pts.push(W(s.a0 + s.da * 0.3, lm)); pts.push(W(s.a1 - s.da * 0.3, lm)); } else if (!s.top) pts.push(W((s.a0 + s.a1) / 2, (s.l0 + s.l1) / 2)); else pts.push(W((s.a0 + s.a1) / 2, lm)); }
    const t = r.topSeg; pts.push(W((t.a0 + t.a1) / 2, r.wall.hd - 0.6)); return pts;
  }
  const info = () => ({ on: st.on, n: st.ramps.length, ramps: st.ramps.map((r) => ({ id: r.id, ring: r.ring, wall: r.wallId, design: r.design, grade: +r.grade.toFixed(3), rise: +r.rise.toFixed(2), len: +r.len.toFixed(1), top: r.topSeg && +r.topSeg.y1.toFixed(2) })), tris: st.tris, ms: +st.ms.toFixed(1), planMs: +st.planMs.toFixed(1), colour: st.colour, meshes: meshes.length, textured: st.ramps.filter((r) => r.textured).length });
  return { enter, exit, dispose, build, height, boxes, topExit, landingAt, route, info, st, group: grp, meshes };
}
