// cl1_wslife.js — CL1: the DYNAMIC worksite props (late-stage>late:wslife: carts, barrows, planks, crates the workers move) that stand in a door corridor (0.3 .. 3.2 m x +-1.5 m) right now.  Evaluated in the game page, hero started.
(() => {
  const rp = window.__rp, B = window.__bw, sc = B.scene, Mat4 = sc.matrixWorld.constructor, m4 = new Mat4(), m5 = new Mat4();
  sc.updateMatrixWorld(true);
  const pathOf = (o) => { const a = []; for (let p = o; p && p !== sc; p = p.parent) a.push(p.name || p.type); return a.reverse().join('>'); };
  const dm = rp.doors(); const items = (dm.items() || []).filter((it) => it.fx !== undefined);
  const fr = items.map((it) => { const nx = (it.x - it.fx) / 0.7, nz = (it.z - it.fz) / 0.7, l = Math.hypot(nx, nz) || 1; return { it, ux: nx / l, uz: nz / l }; });
  const hits = {}, packs = {}; let n = 0;
  const walk = (o) => {
    if (o.userData && (o.userData.rpHero || o.userData.rpMarker || o.userData.rpProxy)) return;
    if (o.isInstancedMesh && o.geometry) {
      const path = pathOf(o);
      if (/wslife/.test(path) && !/crowd/.test(path)) {
        const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2, nn = Math.min(o.count, (o.instanceMatrix.array.length / 16) | 0);
        const key = path.split('>').slice(-2).join('>') + '|' + ((Array.isArray(o.material) ? o.material[0] : o.material).name || '') + '|' + (bb.max.x - bb.min.x).toFixed(1) + 'x' + (bb.max.y - bb.min.y).toFixed(1) + 'x' + (bb.max.z - bb.min.z).toFixed(1);
        packs[key] = (packs[key] || 0) + nn;
        for (let i = 0; i < nn; i++) {
          m4.fromArray(o.instanceMatrix.array, i * 16); m5.multiplyMatrices(o.matrixWorld, m4); const e = m5.elements; if (e[0] === 0 && e[5] === 0 && e[10] === 0) continue;
          const X = e[0] * cx + e[8] * cz + e[12], Z = e[2] * cx + e[10] * cz + e[14], Y = e[13]; n++;
          const sy = Math.hypot(e[4], e[5], e[6]), h = (bb.max.y - bb.min.y) * sy; if (h < 0.3) continue;
          for (const q of fr) { const dx = X - q.it.fx, dz = Z - q.it.fz; if (Math.abs(dx) > 5 || Math.abs(dz) > 5) continue; const t = dx * q.ux + dz * q.uz, s = dx * -q.uz + dz * q.ux; if (t > 0.3 && t < 3.2 && Math.abs(s) < 1.5) { const k = q.it.id; (hits[k] = hits[k] || []).push([key, +t.toFixed(1), +s.toFixed(1), +h.toFixed(1)]); } }
        }
      }
    }
    for (const c of o.children) walk(c);
  };
  for (const c of sc.children) walk(c);
  return JSON.stringify({ instances: n, doorsHit: Object.keys(hits).length, hits, packs });
})()
