// A knight of the cavalry (the UAL "K3" knight, knight_k3.glb) frozen in his riding pose as STATIC meshes, to sit on the gryphon knight and the dark rider.
//   const pieces = bakeKnight(M.knight_k3, { clip: 'RideDrawn', t: 0.25 })   ->  [{ name, material, geo, dom, boneNames }]  (dom[i] = the bone that owns vertex i most)  geo: position / normal / uv (+ color, aHair when the mesh has them), in the model's own space (feet at y = 0, faces +z)
// The pose is taken once from the animation (the mixer at time t) and written into plain geometry; the model itself is not touched.  Call gear_plume.js dressKnight(M.knight_k3) first
// to get the great helm + plate harness + plume (idempotent); the materials are the model's own, so the plume's colour and sway (crowd.js bwExtra) come along.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export function bakeKnight(gltf, { clip = 'RideDrawn', t = 0.25 } = {}) {
  const root = SkeletonUtils.clone(gltf.scene), c = (gltf.animations || []).find((a) => a.name === clip);
  if (c) { const mx = new THREE.AnimationMixer(root); mx.clipAction(c).play(); mx.setTime(t); }
  root.updateMatrixWorld(true);
  const out = [], v = new THREE.Vector3(), nv = new THREE.Vector3(), acc = new THREE.Vector3(), accN = new THREE.Vector3(), bp = new THREE.Vector3(), bn = new THREE.Vector3(), nm = new THREE.Matrix3(), m3 = new THREE.Matrix3();
  root.traverse((o) => {
    if (!o.isSkinnedMesh || !o.geometry.attributes.position) return;
    const g = o.geometry, pa = g.attributes.position, na = g.attributes.normal, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, n = pa.count, bones = o.skeleton.bones;
    const BM = bones.map((b, j) => new THREE.Matrix4().multiplyMatrices(b.matrixWorld, o.skeleton.boneInverses[j])), B3 = BM.map((m) => new THREE.Matrix3().setFromMatrix4(m));
    const bind3 = new THREE.Matrix3().setFromMatrix4(o.bindMatrix), inv3 = new THREE.Matrix3().setFromMatrix4(o.bindMatrixInverse);
    nm.getNormalMatrix(o.matrixWorld);
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), dom = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      { let bw = -1; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; dom[i] = si.getComponent(i, k); } } }       // (the bone that owns the vertex most: to cut parts away by what they are attached to)
      bp.fromBufferAttribute(pa, i).applyMatrix4(o.bindMatrix); if (na) bn.fromBufferAttribute(na, i).applyMatrix3(bind3);
      acc.set(0, 0, 0); accN.set(0, 0, 0);
      for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (!w) continue; const j = si.getComponent(i, k); acc.addScaledVector(v.copy(bp).applyMatrix4(BM[j]), w); if (na) accN.addScaledVector(nv.copy(bn).applyMatrix3(B3[j]), w); }
      acc.applyMatrix4(o.bindMatrixInverse).applyMatrix4(o.matrixWorld).toArray(P, i * 3);
      if (na) accN.applyMatrix3(inv3).applyMatrix3(nm).normalize().toArray(N, i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); if (na) geo.setAttribute('normal', new THREE.BufferAttribute(N, 3)); else geo.computeVertexNormals();
    for (const [name, k] of [['uv', 2], ['color', 3], ['aHair', 4]]) { const a = g.attributes[name]; if (!a) continue; const f = new Float32Array(n * k); for (let i = 0; i < n; i++) for (let q = 0; q < k; q++) f[i * k + q] = a.getComponent(i, q); geo.setAttribute(name, new THREE.BufferAttribute(f, k)); }
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    if (g.index) geo.setIndex(new THREE.BufferAttribute(new Uint32Array(g.index.array), 1));
    geo.computeBoundingSphere();
    out.push({ name: o.name, material: Array.isArray(o.material) ? o.material[0] : o.material, geo, dom, boneNames: bones.map((b) => b.name) });
  });
  return out;
}

// ------------------------------------------------------------------ the dark rider (p35 hero): the same frozen knight in black plate, a tall spiked crown on the helm, a long dark cloak that streams and flutters
//   const dr = darkRider(pieces, { U })   U = { uRim: { value: Vector3 } }: the cold rim light of the dragon he rides (bdragon_live.js createLiveKind().hand.U), so both are lit alike
//   dr.group   plain meshes in the knight's metres (feet y = 0, pelvis at (0, 0.96, -0.04), faces +z): clone it per dragon;   dr.setTime(t)   the cloak's flutter (call every frame, no allocation)
const DARK = { plate: 0x4a5266, crown: 0x2a2f3c, cloak: 0x12162a };
export function darkRider(pieces, { U }) {
  const group = new THREE.Group(), T = { value: 0 };
  const rimHook = (extraV = '') => (sh) => {
    sh.uniforms.uRim = U.uRim; sh.uniforms.uCT = T;
    if (extraV) sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uCT;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' + extraV);
    sh.fragmentShader = 'uniform vec3 uRim;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { float fr = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 2.4); totalEmissiveRadiance += uRim * fr * 0.5; }`);
  };
  const dark = (src, hex) => { const m = src.clone(); m.color.set(hex); m.name = 'dk_' + src.name; m.onBeforeCompile = rimHook(); m.customProgramCacheKey = () => 'bwdkrider'; return m; };
  // 1) the knight: plate + clothes darkened, plume and shield cut away (the plume's triangles by their place in the atlas, the shield's by the bone they hang on)
  for (const p of pieces) {
    let geo = p.geo;
    if (p.material.name === 'Kit') {
      const uv = geo.attributes.uv, ix = geo.index.array, keep = [], sh = p.boneNames.indexOf('lowerarm_l');
      const plume = (k) => uv.getX(k) < 0.5 && uv.getY(k) > 0.622, shield = (k) => p.dom[k] === sh;
      for (let t = 0; t < ix.length; t += 3) { const a = ix[t], b = ix[t + 1], c = ix[t + 2]; if ((plume(a) && plume(b) && plume(c)) || (shield(a) && shield(b) && shield(c))) continue; keep.push(a, b, c); }
      geo = geo.clone(); geo.setIndex(keep);
    }
    const m = new THREE.Mesh(geo, dark(p.material, DARK.plate)); m.castShadow = true; m.frustumCulled = false; group.add(m);
  }
  // 2) the crown: spikes round the helm's top (head bone in this pose: (0, 1.61, 0.08), the helm's crest line at ~1.80), the back ones taller and swept back, one tall spike in the middle
  const cols = [], pos = [], nor = [], idx = [];
  const spike = (x, y, z, h, r, tx, tz) => {                                     // a cone from (x,y,z), height h, leaning (tx, tz)
    const g = new THREE.ConeGeometry(r, h, 6, 1).translate(0, h / 2, 0); const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tz, 0, -tx)); g.applyQuaternion(q); g.translate(x, y, z);
    const o = pos.length / 3, pa = g.attributes.position, na = g.attributes.normal; for (let i = 0; i < pa.count; i++) { pos.push(pa.getX(i), pa.getY(i), pa.getZ(i)); nor.push(na.getX(i), na.getY(i), na.getZ(i)); }
    for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + o);
  };
  const N = 8; for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), back = -s;                   // (a = 0: the right of the helm; s > 0: the front)
    spike(c * 0.1, 1.76, 0.07 + s * 0.095, 0.2 + 0.16 * Math.max(0, back), 0.026, c * 0.35, -s * 0.2 - 0.25 * Math.max(0, back)); }
  spike(0, 1.79, 0.06, 0.34, 0.035, 0, -0.08);
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); cg.setIndex(idx);
  const crown = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: DARK.crown, roughness: 0.32, metalness: 0.85, name: 'dk_crown' })); crown.material.onBeforeCompile = rimHook(); crown.material.customProgramCacheKey = () => 'bwdkrider'; crown.castShadow = true; crown.frustumCulled = false; group.add(crown);
  // 3) the cloak: a broad strip from the shoulders streaming back over the dragon (notched end) and two narrow streamers beside it; the flutter is in the vertex shader (uv.x = distance along, uv.y = phase)
  const strip = (x0, w0, w1, len, y0, drop, ph, rows = 12) => {
    const P = [], U2 = [], I = [];
    for (let r = 0; r <= rows; r++) {
      const s = r / rows, z = -0.14 - len * s, y = y0 - drop * s - 0.06 * s * s, w = w0 + (w1 - w0) * s, notch = r === rows ? 0.22 : 0;
      for (const f of [-1, 0, 1]) { P.push(x0 + f * w, y - (f === 0 ? 0.04 * s : 0), z + (f === 0 ? notch : 0)); U2.push(s, ph); }
    }
    for (let r = 0; r < rows; r++) for (let k = 0; k < 2; k++) { const a = r * 3 + k, b = a + 1, c = a + 3, d = a + 4; I.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U2, 2)); g.setIndex(I); g.computeVertexNormals(); return g;
  };
  const cm = new THREE.MeshStandardMaterial({ color: DARK.cloak, roughness: 0.88, metalness: 0, side: THREE.DoubleSide, name: 'dk_cloak' });
  cm.onBeforeCompile = rimHook('{ float bwS = uv.x; transformed.y += sin(uCT * 6.0 + bwS * 8.0 + uv.y) * 0.13 * bwS; transformed.x += sin(uCT * 3.7 + bwS * 6.0 + uv.y * 1.7) * 0.16 * bwS * bwS; }');
  cm.customProgramCacheKey = () => 'bwdkcloak';
  for (const [x0, w0, w1, len, y0, drop, ph] of [[0, 0.2, 0.42, 2.1, 1.5, 0.35, 0], [-0.3, 0.06, 0.11, 1.7, 1.46, 0.4, 2.1], [0.3, 0.06, 0.11, 1.8, 1.46, 0.4, 4.2]]) { const m = new THREE.Mesh(strip(x0, w0, w1, len, y0, drop, ph), cm); m.frustumCulled = false; group.add(m); }
  return { group, setTime(t) { T.value = t; } };
}
