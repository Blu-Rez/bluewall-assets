// AN1_R3 sunk audit: a fast replacement for the per-sample Raycaster (offline, dev only - never in the game).  Buckets the triangles of the static candidates by 2 m cells that contain a sample, then for each sample takes the highest
// up-facing surface between (foot - 3 m) and (foot + 1 m).  Same output rows as __sk.cast: [kind, x, z, footY, surfaceY|null, terrainY, name].
(() => {
  const S = window.__sk, THREE = __bw.THREE, world = __bw.world, CS = 2;
  const nameOf = (o) => { const a = []; for (let p = o; p && a.length < 4; p = p.parent) if (p.name) a.push(p.name); return a.join('<'); };
  S.cast2 = () => {
    const seen = new Map(), uniq = [], rowsKey = [];
    for (const [k, x, fy, z] of S.samples) { const key = k + ':' + Math.round(x * 4) + ':' + Math.round(z * 4) + ':' + Math.round(fy * 20); let i = seen.get(key); if (i == null) { i = uniq.length; seen.set(key, i); uniq.push([x, fy, z]); } rowsKey.push(i); }
    const ck = (cx, cz) => (cx + 8192) * 16384 + (cz + 8192);
    const need = new Set(); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, ylo = 1e9, yhi = -1e9;
    for (const [x, fy, z] of uniq) { need.add(ck(Math.floor(x / CS), Math.floor(z / CS))); x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); ylo = Math.min(ylo, fy - 3); yhi = Math.max(yhi, fy + 1); }
    const buckets = new Map(), names = [], big = []; const bb = new THREE.Box3(), v = new THREE.Vector3();
    const P = new Float64Array(9); let tested = 0, kept = 0;
    for (const o of S.cands) {
      const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); bb.copy(g.boundingBox).applyMatrix4(o.matrixWorld);
      if (bb.max.x < x0 - CS || bb.min.x > x1 + CS || bb.max.z < z0 - CS || bb.min.z > z1 + CS || bb.max.y < ylo || bb.min.y > yhi) continue;
      const m = Array.isArray(o.material) ? o.material[0] : o.material, front = !m || m.side === THREE.FrontSide || m.side === undefined, flip = o.matrixWorld.determinant() < 0 ? -1 : 1;
      const ni = names.push(nameOf(o)) - 1, pos = g.attributes.position, idx = g.index, n = idx ? idx.count : pos.count, e = o.matrixWorld.elements;
      for (let t = 0; t + 2 < n; t += 3) {
        for (let j = 0; j < 3; j++) { const vi = idx ? idx.getX(t + j) : t + j, px = pos.getX(vi), py = pos.getY(vi), pz = pos.getZ(vi); P[j * 3] = e[0] * px + e[4] * py + e[8] * pz + e[12]; P[j * 3 + 1] = e[1] * px + e[5] * py + e[9] * pz + e[13]; P[j * 3 + 2] = e[2] * px + e[6] * py + e[10] * pz + e[14]; }
        tested++;
        const mn = Math.min(P[1], P[4], P[7]), mx = Math.max(P[1], P[4], P[7]); if (mx < ylo || mn > yhi) continue;
        const ux = P[3] - P[0], uz = P[5] - P[2], wx = P[6] - P[0], wz = P[8] - P[2], ny = (P[5] - P[2]) * (P[6] - P[0]) - (P[3] - P[0]) * (P[8] - P[2]);       // y component of (b-a)x(c-a) up to a sign: ny = uz*wx - ux*wz
        const area2 = Math.abs(ux * wz - uz * wx); if (area2 < 1e-9) continue;                                   // vertical triangle: a vertical ray cannot hit it
        const up = (uz * wx - ux * wz) * flip > 0;                                                              // facing up in world (counter-clockwise seen from above)
        if (front && !up) continue;
        const ax = Math.min(P[0], P[3], P[6]), bx = Math.max(P[0], P[3], P[6]), az = Math.min(P[2], P[5], P[8]), bz = Math.max(P[2], P[5], P[8]);
        const i0 = Math.floor(ax / CS), i1 = Math.floor(bx / CS), j0 = Math.floor(az / CS), j1 = Math.floor(bz / CS), cnt = (i1 - i0 + 1) * (j1 - j0 + 1);
        const rec = [P[0], P[1], P[2], P[3], P[4], P[5], P[6], P[7], P[8], ni];
        if (cnt > 400) { big.push(rec); kept++; continue; }
        for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const key = ck(i, j); if (!need.has(key)) continue; let b = buckets.get(key); if (!b) buckets.set(key, b = []); b.push(rec); kept++; }
      }
    }
    const hit = (x, z, y0, rec) => {
      const ax = rec[0], az = rec[2], d = (rec[3] - ax) * (rec[8] - az) - (rec[5] - az) * (rec[6] - ax); if (Math.abs(d) < 1e-12) return null;
      const u = ((x - ax) * (rec[8] - az) - (z - az) * (rec[6] - ax)) / d, w = ((rec[3] - ax) * (z - az) - (rec[5] - az) * (x - ax)) / d;
      if (u < -1e-6 || w < -1e-6 || u + w > 1 + 1e-6) return null;
      const y = rec[1] + u * (rec[4] - rec[1]) + w * (rec[7] - rec[1]); return y <= y0 + 1e-4 && y >= y0 - 3 ? y : null;
    };
    const res = uniq.map(([x, fy, z]) => {
      const y0 = fy + 1.0; let best = null, bn = -1; const b = buckets.get(ck(Math.floor(x / CS), Math.floor(z / CS))) || [];
      for (const rec of b) { const y = hit(x, z, y0, rec); if (y != null && (best == null || y > best)) { best = y; bn = rec[9]; } }
      for (const rec of big) { const y = hit(x, z, y0, rec); if (y != null && (best == null || y > best)) { best = y; bn = rec[9]; } }
      return [best, bn >= 0 ? names[bn] : null, world.fastHeight ? world.fastHeight(x, z) : 0];
    });
    const out = []; let i = 0;
    for (const [k, x, fy, z] of S.samples) { const r = res[rowsKey[i++]]; out.push([k, x, z, fy, r[0], r[2], r[1]]); }
    S.samples = []; S.castInfo = { uniq: uniq.length, tested, kept, big: big.length, meshes: names.length };
    return out;
  };
  return 1;
})()
