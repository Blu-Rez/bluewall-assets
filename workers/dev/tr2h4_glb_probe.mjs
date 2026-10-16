// TR2_H_R4: read a Tripo GLB in node (meshopt + quantization decoded by hand) and measure what could make walls look torn: sliver / degenerate triangles, faces whose winding disagrees with the vertex normals (back-face culled = holes),
// UV stretch.  node tr2h4_glb_probe.mjs file.glb [more.glb]
import fs from 'fs';
import { MeshoptDecoder } from '/home/claude/bot/bluebot_v2/bluewall/client/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';
await MeshoptDecoder.ready;
const TYPES = { 5120: [Int8Array, 1], 5121: [Uint8Array, 1], 5122: [Int16Array, 2], 5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5126: [Float32Array, 4] }, NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function load(fn) {
  const d = fs.readFileSync(fn), dv = new DataView(d.buffer, d.byteOffset, d.byteLength); const jl = dv.getUint32(12, true); const j = JSON.parse(d.slice(20, 20 + jl).toString());
  const bo = 20 + jl + 8, bin = d.slice(bo, bo + dv.getUint32(20 + jl, true));
  const views = j.bufferViews.map((v) => {
    const e = v.extensions && v.extensions.EXT_meshopt_compression;
    if (e) { const out = new Uint8Array(e.count * e.byteStride); MeshoptDecoder.decodeGltfBuffer(out, e.count, e.byteStride, new Uint8Array(bin.buffer, bin.byteOffset + (e.byteOffset || 0), e.byteLength), e.mode, e.filter || 'NONE'); return { data: out, stride: e.byteStride }; }
    return { data: new Uint8Array(bin.buffer, bin.byteOffset + (v.byteOffset || 0), v.byteLength), stride: v.byteStride || 0 };
  });
  const acc = (i, norm) => { const a = j.accessors[i], v = views[a.bufferView], [T, sz] = TYPES[a.componentType], n = NC[a.type], stride = v.stride || sz * n;
    const out = new Float32Array(a.count * n), dv2 = new DataView(v.data.buffer, v.data.byteOffset, v.data.byteLength);
    for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) { const o = (a.byteOffset || 0) + k * stride + c * sz; let x;
      if (T === Float32Array) x = dv2.getFloat32(o, true); else if (T === Int16Array) x = dv2.getInt16(o, true); else if (T === Uint16Array) x = dv2.getUint16(o, true); else if (T === Int8Array) x = dv2.getInt8(o); else if (T === Uint8Array) x = dv2.getUint8(o); else x = dv2.getUint32(o, true);
      if (a.normalized) x = T === Int16Array ? Math.max(x / 32767, -1) : T === Int8Array ? Math.max(x / 127, -1) : T === Uint16Array ? x / 65535 : x / 255;
      out[k * n + c] = x; }
    return out; };
  return { j, acc };
}
for (const fn of process.argv.slice(2)) {
  const { j, acc } = load(fn); const node = j.nodes.find((n) => n.mesh != null) || {}, S = node.scale || [1, 1, 1], Tr = node.translation || [0, 0, 0];
  for (const m of j.meshes) for (const p of m.primitives) {
    const P = acc(p.attributes.POSITION), N = acc(p.attributes.NORMAL), UV = acc(p.attributes.TEXCOORD_0), I = acc(p.indices);
    for (let k = 0; k < P.length / 3; k++) for (let c = 0; c < 3; c++) P[k * 3 + c] = P[k * 3 + c] * S[c] + Tr[c];
    const ntri = I.length / 3; let sliver = 0, degen = 0, flip = 0, uvBad = 0, minA = 1e9, area = 0, wsum = 0;
    const bb = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let k = 0; k < P.length / 3; k++) for (let c = 0; c < 3; c++) { bb[c] = Math.min(bb[c], P[k * 3 + c]); bb[c + 3] = Math.max(bb[c + 3], P[k * 3 + c]); }
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], len = (a) => Math.hypot(a[0], a[1], a[2]), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const v = (i) => [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]; const nv = (i) => [N[i * 3], N[i * 3 + 1], N[i * 3 + 2]];
    const uvr = [];
    for (let t = 0; t < ntri; t++) { const [a, b, c] = [I[t * 3], I[t * 3 + 1], I[t * 3 + 2]]; const A = v(a), B = v(b), C = v(c); const fn_ = cross(sub(B, A), sub(C, A)), ar = len(fn_) / 2; area += ar;
      if (ar < 1e-7) { degen++; continue; }
      const e = [len(sub(B, A)), len(sub(C, B)), len(sub(A, C))]; const mx = Math.max(...e), h = 2 * ar / mx; if (h / mx < 0.02) sliver++;
      const fnu = [fn_[0] / (2 * ar), fn_[1] / (2 * ar), fn_[2] / (2 * ar)]; const nn = nv(a), n2 = nv(b), n3 = nv(c); const ns = [nn[0] + n2[0] + n3[0], nn[1] + n2[1] + n3[1], nn[2] + n2[2] + n3[2]]; if (dot(fnu, ns) < 0) flip++;
      const ua = [UV[a * 2], UV[a * 2 + 1]], ub = [UV[b * 2], UV[b * 2 + 1]], uc = [UV[c * 2], UV[c * 2 + 1]]; const uar = Math.abs((ub[0] - ua[0]) * (uc[1] - ua[1]) - (uc[0] - ua[0]) * (ub[1] - ua[1])) / 2; uvr.push(uar / ar); }
    uvr.sort((x, y) => x - y); const q = (f) => uvr[Math.floor(f * (uvr.length - 1))];
    console.log(fn.split('/').pop(), 'verts', P.length / 3, 'tris', ntri, 'bbox', bb.map((x) => +x.toFixed(2)).join(','), 'area', +area.toFixed(1), '| degenerate', degen, 'sliver(h/l<0.02)', sliver, 'winding-vs-normal flipped', flip, '| uv/world area ratio p5/p50/p95', [q(0.05), q(0.5), q(0.95)].map((x) => +x.toExponential(2)).join(' / '));
  }
}
