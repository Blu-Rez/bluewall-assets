// TR2_H_R4: orientation analysis of a GLB: (1) triangles whose winding disagrees with their vertex normals, (2) edge-adjacency orientation consistency after welding by position, (3) non-manifold edges.
import fs from 'fs';
import { MeshoptDecoder } from '/home/claude/bot/bluebot_v2/bluewall/client/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';
await MeshoptDecoder.ready;
const TY = { 5122: [2, 'getInt16', 32767], 5123: [2, 'getUint16', 65535], 5126: [4, 'getFloat32', 0], 5125: [4, 'getUint32', 0], 5120: [1, 'getInt8', 127], 5121: [1, 'getUint8', 255] }, NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function load(fn) {
  const d = fs.readFileSync(fn), dv = new DataView(d.buffer, d.byteOffset, d.byteLength), jl = dv.getUint32(12, true), j = JSON.parse(d.slice(20, 20 + jl).toString()), bo = 20 + jl + 8, bin = d.slice(bo, bo + dv.getUint32(20 + jl, true));
  const views = j.bufferViews.map((v) => { const e = v.extensions && v.extensions.EXT_meshopt_compression; if (e) { const out = new Uint8Array(e.count * e.byteStride); MeshoptDecoder.decodeGltfBuffer(out, e.count, e.byteStride, new Uint8Array(bin.buffer, bin.byteOffset + (e.byteOffset || 0), e.byteLength), e.mode, e.filter || 'NONE'); return { data: out, stride: e.byteStride }; } return { data: new Uint8Array(bin.buffer, bin.byteOffset + (v.byteOffset || 0), v.byteLength), stride: v.byteStride || 0 }; });
  const acc = (i) => { const a = j.accessors[i], v = views[a.bufferView], [sz, g, nrm] = TY[a.componentType], n = NC[a.type], stride = v.stride || sz * n, dv2 = new DataView(v.data.buffer, v.data.byteOffset, v.data.byteLength), out = new Float32Array(a.count * n);
    for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) { let x = dv2[g]((a.byteOffset || 0) + k * stride + c * sz, true); if (a.normalized && nrm) x = Math.max(x / nrm, -1); out[k * n + c] = x; } return out; };
  return { j, acc };
}
for (const fn of process.argv.slice(2)) {
  const { j, acc } = load(fn), p = j.meshes[0].primitives[0], P = acc(p.attributes.POSITION), N = acc(p.attributes.NORMAL), I = acc(p.indices), nt = I.length / 3;
  const key = (i) => Math.round(P[i * 3] * 4000) + ',' + Math.round(P[i * 3 + 1] * 4000) + ',' + Math.round(P[i * 3 + 2] * 4000), W = new Map(), wid = new Int32Array(P.length / 3);
  for (let i = 0; i < wid.length; i++) { const k = key(i); let w = W.get(k); if (w === undefined) W.set(k, w = W.size); wid[i] = w; }
  const E = new Map(); let degenW = 0;
  for (let t = 0; t < nt; t++) { const a = wid[I[t * 3]], b = wid[I[t * 3 + 1]], c = wid[I[t * 3 + 2]]; if (a === b || b === c || a === c) { degenW++; continue; } for (const [u, v] of [[a, b], [b, c], [c, a]]) { const k = u < v ? u + '_' + v : v + '_' + u, dir = u < v ? 1 : -1; let e = E.get(k); if (!e) E.set(k, e = []); e.push([t, dir]); } }
  let open = 0, nonman = 0, incons = 0, pairs = 0; const badT = new Set();
  for (const e of E.values()) { if (e.length === 1) open++; else if (e.length > 2) nonman++; else { pairs++; if (e[0][1] === e[1][1]) { incons++; badT.add(e[0][0]); badT.add(e[1][0]); } } }
  // normal disagreement
  let flip = 0; for (let t = 0; t < nt; t++) { const [a, b, c] = [I[t * 3], I[t * 3 + 1], I[t * 3 + 2]], A = [P[a * 3], P[a * 3 + 1], P[a * 3 + 2]], B = [P[b * 3], P[b * 3 + 1], P[b * 3 + 2]], C = [P[c * 3], P[c * 3 + 1], P[c * 3 + 2]], u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]], f = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], n = [0, 1, 2].map((k) => N[a * 3 + k] + N[b * 3 + k] + N[c * 3 + k]); if (f[0] * n[0] + f[1] * n[1] + f[2] * n[2] < 0) flip++; }
  // islands: connected components over shared edges (consistent or not)
  console.log(fn.split('/').pop(), 'tris', nt, 'welded verts', W.size, '| edges: open', open, 'non-manifold', nonman, 'adjacent pairs', pairs, 'orientation-INCONSISTENT pairs', incons, '(tris involved', badT.size + ')', '| winding vs vertex-normal flipped', flip, '| degenerate after weld', degenW);
}
