// AN1_R3 A3 job 4 — scene audit (body of an async function; ARGS = { min: 4, pole: { maxW: 2.5, minH: 3.5 }, near: [x, z, r] | null }).
// rows  = every visible mesh / instance group / sprite taller than `min` metres: name chain, type, position of its base, size, material (+ the colour and whether it is additive / transparent / emissive).
// poles = vertical, thin things INSIDE merged meshes (a pole is not a mesh of its own when the town is one merged mesh): 0.5 m cells of the XZ plane over the vertices of every opaque mesh that is taller than `min`, connected
//         (8-neighbours) cells whose vertical extent >= pole.minH and whose footprint is <= pole.maxW across -> { mesh chain, x, z, y0, y1, w, colour }.
const B = __bw, THREE = B.THREE, minH = ARGS.min || 4, PL = ARGS.pole || { maxW: 2.5, minH: 3.5 }, near = ARGS.near || null;
const rows = [], poles = [];
const chain = (o) => { const a = []; for (let p = o; p && a.length < 5; p = p.parent) a.push(p.name || (p.isScene ? 'scene' : p.type)); return a.join(' < '); };
const visible = (o) => { for (let p = o; p; p = p.parent) if (p.visible === false) return false; return true; };
const matInfo = (o) => { const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m) return {}; return { m: m.name || m.type, col: m.color ? m.color.getHexString() : null, tr: !!m.transparent, op: m.opacity, add: m.blending === THREE.AdditiveBlending, dw: m.depthWrite, em: m.emissive ? m.emissive.getHexString() : null, emi: m.emissiveIntensity }; };
const box = new THREE.Box3(), s = new THREE.Vector3(), tmp = new THREE.Box3(), inst = new THREE.Matrix4(), cen = new THREE.Vector3(), v = new THREE.Vector3();
B.scene.updateMatrixWorld(true);
const inNear = (x, z) => !near || Math.hypot(x - near[0], z - near[1]) <= near[2];
B.scene.traverse((o) => {
  if (!(o.isMesh || o.isSprite || o.isPoints || o.isLine) || !visible(o)) return;
  const base = { chain: chain(o), type: o.isInstancedMesh ? 'instanced' : o.isSkinnedMesh ? 'skinned' : o.isSprite ? 'sprite' : o.type, ud: Object.keys(o.userData || {}).slice(0, 6).join(','), ...matInfo(o) };
  if (o.isInstancedMesh) {
    if (!o.count) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox();
    let n = 0, hmax = 0, hmin = 1e9, tot = 0, ex = null;
    for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, inst); inst.premultiply(o.matrixWorld); tmp.copy(g.boundingBox).applyMatrix4(inst); tmp.getSize(s); tot++; tmp.getCenter(cen); if (s.y > minH && inNear(cen.x, cen.z)) { n++; hmax = Math.max(hmax, s.y); hmin = Math.min(hmin, s.y); if (!ex) ex = [cen.x, tmp.min.y, cen.z, s.x, s.y, s.z]; } }
    if (n) rows.push({ ...base, n, of: tot, hmax, hmin, ex }); return;
  }
  if (o.isSprite) { o.getWorldScale(s); o.getWorldPosition(v); if (s.y > minH && inNear(v.x, v.z)) rows.push({ ...base, n: 1, of: 1, hmax: s.y, hmin: s.y, ex: [v.x, v.y - s.y / 2, v.z, s.x, s.y, s.z] }); return; }
  if (!o.geometry) return;
  try { box.setFromObject(o, !!o.isSkinnedMesh); } catch (e) { return; }
  if (box.isEmpty()) return; box.getSize(s); box.getCenter(cen);
  if (s.y > minH && (!near || (box.max.x > near[0] - near[2] && box.min.x < near[0] + near[2] && box.max.z > near[1] - near[2] && box.min.z < near[1] + near[2]))) rows.push({ ...base, n: 1, of: 1, hmax: s.y, hmin: s.y, ex: [cen.x, box.min.y, cen.z, s.x, s.y, s.z], tris: o.geometry.index ? o.geometry.index.count / 3 : (o.geometry.attributes.position ? o.geometry.attributes.position.count / 3 : 0) });
  // pole detection inside this mesh (opaque, not the sky / terrain / huge planes)
  if (o.isMesh && !o.isSkinnedMesh && s.y > PL.minH && s.x < 900 && s.z < 900 && !(base.tr && base.add)) {
    const g = o.geometry, pos = g.attributes.position, me = o.matrixWorld.elements, cells = new Map(), C = 0.5, col = g.attributes.color;
    if (!pos || pos.count > 600000) return;
    const idx = g.index; const n = idx ? idx.count : pos.count;
    for (let t = 0; t < n; t++) {
      const vi = idx ? idx.getX(t) : t, px = pos.getX(vi), py = pos.getY(vi), pz = pos.getZ(vi);
      const x = me[0] * px + me[4] * py + me[8] * pz + me[12], y = me[1] * px + me[5] * py + me[9] * pz + me[13], z = me[2] * px + me[6] * py + me[10] * pz + me[14];
      if (!inNear(x, z)) continue;
      const key = Math.floor(x / C) * 100003 + Math.floor(z / C); let c = cells.get(key); if (!c) { c = { i: Math.floor(x / C), j: Math.floor(z / C), y0: y, y1: y, x, z, r: 0, g: 0, b: 0, k: 0 }; cells.set(key, c); }
      if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y; if (col && c.k < 8) { c.r += col.getX(vi); c.g += col.getY(vi); c.b += col.getZ(vi); c.k++; }
    }
    const tall = [...cells.values()].filter((c) => c.y1 - c.y0 >= PL.minH * 0.5);
    const mapT = new Map(tall.map((c) => [c.i * 100003 + c.j, c])), seen = new Set();
    for (const c0 of tall) {
      const k0 = c0.i * 100003 + c0.j; if (seen.has(k0)) continue;
      const comp = [], st = [c0]; seen.add(k0);
      while (st.length && comp.length < 400) { const c = st.pop(); comp.push(c); for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const k = (c.i + di) * 100003 + (c.j + dj), q = mapT.get(k); if (q && !seen.has(k)) { seen.add(k); st.push(q); } } }
      let i0 = 1e9, i1 = -1e9, j0 = 1e9, j1 = -1e9, y0 = 1e9, y1 = -1e9, r = 0, gg = 0, b = 0, k = 0; for (const c of comp) { i0 = Math.min(i0, c.i); i1 = Math.max(i1, c.i); j0 = Math.min(j0, c.j); j1 = Math.max(j1, c.j); y0 = Math.min(y0, c.y0); y1 = Math.max(y1, c.y1); r += c.r; gg += c.g; b += c.b; k += c.k; }
      const w = Math.max(i1 - i0 + 1, j1 - j0 + 1) * C; if (w > PL.maxW || y1 - y0 < PL.minH) continue;
      const cx = ((i0 + i1 + 1) / 2) * C, cz = ((j0 + j1 + 1) / 2) * C;
      poles.push({ chain: base.chain, type: base.type, m: base.m, col: base.col, x: +cx.toFixed(1), z: +cz.toFixed(1), y0: +y0.toFixed(1), y1: +y1.toFixed(1), h: +(y1 - y0).toFixed(1), w: +w.toFixed(1), vcol: k ? [+(r / k).toFixed(2), +(gg / k).toFixed(2), +(b / k).toFixed(2)] : null });
    }
  }
});
return { rows, poles };
