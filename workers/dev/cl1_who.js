// cl1_who.js — CL1: «who is standing there?»  For the points in window.__cl1pts ([[x,z],...]) lists every mesh / instance whose BODY-BAND triangles (0.45..1.55 m over the ground, not floors / roofs) come within 0.35 m of the point.
// Static and instanced meshes alike (proxies of the cull module included, marked).  Returns { points: [{ at, who: [{ path, kind, n }] }] }.
(() => {
  const rp = window.__rp, B = window.__bw, sc = B.scene, P = window.__cl1pts || []; const Mat4 = sc.matrixWorld.constructor; sc.updateMatrixWorld(true);
  const pathOf = (o) => { const a = []; for (let p = o; p && p !== sc; p = p.parent) a.push(p.name || p.type); return a.reverse().join('>'); };
  const res = P.map((p) => ({ at: p, who: {} })), R = 0.35;
  const m5 = new Mat4(), m4 = new Mat4(); const W = new Float64Array(16);
  const test = (o, mw, ia, pa, nTri, label) => {
    for (let t = 0; t < nTri; t++) {
      const a = ia ? ia[t * 3] : t * 3, b = ia ? ia[t * 3 + 1] : t * 3 + 1, c = ia ? ia[t * 3 + 2] : t * 3 + 2;
      let x = pa[a * 3], y = pa[a * 3 + 1], z = pa[a * 3 + 2]; const ax = mw[0] * x + mw[4] * y + mw[8] * z + mw[12], ay = mw[1] * x + mw[5] * y + mw[9] * z + mw[13], az = mw[2] * x + mw[6] * y + mw[10] * z + mw[14];
      x = pa[b * 3]; y = pa[b * 3 + 1]; z = pa[b * 3 + 2]; const bx = mw[0] * x + mw[4] * y + mw[8] * z + mw[12], by = mw[1] * x + mw[5] * y + mw[9] * z + mw[13], bz = mw[2] * x + mw[6] * y + mw[10] * z + mw[14];
      x = pa[c * 3]; y = pa[c * 3 + 1]; z = pa[c * 3 + 2]; const cx = mw[0] * x + mw[4] * y + mw[8] * z + mw[12], cy = mw[1] * x + mw[5] * y + mw[9] * z + mw[13], cz = mw[2] * x + mw[6] * y + mw[10] * z + mw[14];
      const mx = (ax + bx + cx) / 3, mz = (az + bz + cz) / 3;
      for (let k = 0; k < P.length; k++) {
        const px = P[k][0], pz = P[k][1]; if (Math.max(Math.abs(ax - px), Math.abs(bx - px), Math.abs(cx - px)) > 6 && Math.abs(mx - px) > 6) continue;
        const dd = Math.min(Math.hypot(ax - px, az - pz), Math.hypot(bx - px, bz - pz), Math.hypot(cx - px, cz - pz), Math.hypot(mx - px, mz - pz)); if (dd > R + 1.2) continue;
        const g0 = rp.ground(mx, mz), lo = Math.min(ay, by, cy), hi = Math.max(ay, by, cy); if (hi < g0 + 0.45 || lo > g0 + 1.55) continue;
        const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az, nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; if (Math.abs(ny) / nl > 0.9) continue;
        if (dd <= R + 0.6) { const w = res[k].who; w[label] = (w[label] || 0) + 1; }
      }
    }
  };
  const walk = (o) => {
    if (o.userData && (o.userData.rpHero || o.userData.rpMarker)) return;
    if (o.isMesh && o.geometry && !o.isSkinnedMesh && !/^(sky|terrain|water)$/.test(o.name)) {
      const g = o.geometry, Pp = g.attributes.position; const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (Pp && !Pp.isInterleavedBufferAttribute && m && m.visible !== false) {
        const I = g.index, ia = I ? I.array : null, nTri = I ? (I.count / 3) | 0 : (Pp.count / 3) | 0, path = pathOf(o).split('>').slice(-3).join('>') + (m.alphaTest > 0 || m.transparent ? ' [alpha]' : '') + (o.userData && o.userData.rpProxy ? ' [proxy]' : '') + (o.visible === false ? ' [hidden]' : '');
        if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox;
        if (o.isInstancedMesh) {
          const ar = o.instanceMatrix.array, n = Math.min(o.count, (ar.length / 16) | 0), mw = o.matrixWorld.elements;
          for (let i = 0; i < n; i++) {
            m4.fromArray(ar, i * 16); if (ar[i * 16] === 0 && ar[i * 16 + 5] === 0) continue; m5.multiplyMatrices(o.matrixWorld, m4); const e = m5.elements;
            const X = e[0] * (bb.min.x + bb.max.x) / 2 + e[8] * (bb.min.z + bb.max.z) / 2 + e[12], Z = e[2] * (bb.min.x + bb.max.x) / 2 + e[10] * (bb.min.z + bb.max.z) / 2 + e[14];
            let near = false; for (const q of P) if (Math.hypot(X - q[0], Z - q[1]) < 14) { near = true; break; } if (!near) continue;
            test(o, e, ia, Pp.array, nTri, 'INST ' + path + ' ' + Pp.count + 'v ' + (bb.max.x - bb.min.x).toFixed(1) + 'x' + (bb.max.y - bb.min.y).toFixed(1));
          }
        } else {
          const e = o.matrixWorld.elements; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
          for (let a = 0; a < 8; a++) { const x = a & 1 ? bb.max.x : bb.min.x, y = a & 2 ? bb.max.y : bb.min.y, z = a & 4 ? bb.max.z : bb.min.z; const X = e[0] * x + e[4] * y + e[8] * z + e[12], Z = e[2] * x + e[6] * y + e[10] * z + e[14]; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Z < z0) z0 = Z; if (Z > z1) z1 = Z; }
          let near = false; for (const q of P) if (q[0] > x0 - 3 && q[0] < x1 + 3 && q[1] > z0 - 3 && q[1] < z1 + 3) { near = true; break; } if (near) test(o, e, ia, Pp.array, nTri, path + ' ' + Pp.count + 'v');
        }
      }
    }
    for (const c of o.children) walk(c);
  };
  for (const c of sc.children) walk(c);
  return JSON.stringify({ points: res.map((r) => ({ at: r.at, who: Object.entries(r.who).sort((a, b) => b[1] - a[1]).slice(0, 6) })) });
})()
