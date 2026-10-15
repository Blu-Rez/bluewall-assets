// AN1_R3 A3 — body of an async function for an1_r3_page.py RPC: natural dimensions of the source models (bind pose, precise skinned boxes) + the withers / back height of the quadrupeds.
// returns { name: { size:[x,y,z], minY, len, top, back, axis } }   len = longest horizontal side, top = highest point over the feet (head / ears), back = highest point of the middle of the body (40-70 % of the body length from the head end)
const R = window.__R3, THREE = R.THREE, SU = R.SkeletonUtils;
const names = ARGS.names;
const out = {};
for (const nm of names) {
  try {
    const g = await R.load(nm.url);
    const rig = SU.clone(g.scene); rig.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(rig, true), sz = bb.getSize(new THREE.Vector3());
    const pts = []; const v = new THREE.Vector3();
    rig.traverse((o) => { if (!(o.isMesh && o.geometry && o.geometry.attributes.position)) return; const pa = o.geometry.attributes.position, st = Math.max(1, Math.floor(pa.count / 40000)); for (let i = 0; i < pa.count; i += st) { if (o.isSkinnedMesh) o.getVertexPosition(i, v); else v.fromBufferAttribute(pa, i); v.applyMatrix4(o.matrixWorld); pts.push(v.x, v.y, v.z); } });
    const ax = sz.x > sz.z ? 0 : 2, a0 = bb.min.getComponent(ax), L = sz.getComponent(ax);
    // head end: the end of the long axis where the highest points are
    let topI = 0, topY = -1e9; for (let i = 0; i < pts.length; i += 3) if (pts[i + 1] > topY) { topY = pts[i + 1]; topI = i; }
    const headAt = (pts[topI + ax] - a0) / L, headEnd = headAt > 0.5 ? 1 : 0;
    let back = -1e9; for (let i = 0; i < pts.length; i += 3) { const u = (pts[i + ax] - a0) / L, d = headEnd ? 1 - u : u; if (d >= 0.4 && d <= 0.7 && pts[i + 1] > back) back = pts[i + 1]; }
    out[nm.id] = { size: sz.toArray().map((x) => +x.toFixed(3)), minY: +bb.min.y.toFixed(3), len: +Math.max(sz.x, sz.z).toFixed(3), top: +(sz.y).toFixed(3), back: +(back - bb.min.y).toFixed(3), axis: ax ? 'z' : 'x', headEnd, headAt: +headAt.toFixed(2), anims: (g.animations || []).map((a) => a.name).slice(0, 12), meshes: (() => { let n = 0; rig.traverse((o) => { if (o.isMesh) n++; }); return n; })() };
  } catch (e) { out[nm.id] = { err: String(e).slice(0, 120) }; }
}
return out;
