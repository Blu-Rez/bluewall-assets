// TR2_H_R4: lo copy WITHOUT cross-seam UV smear.  Same pipeline and the same simplifier settings as workers/tools/lod_geo.mjs (so the SHAPE of the shipped lo is kept), then every corner of every lo triangle takes, among the
// full model's vertices that sit at the same position (the vertex copies of a UV seam), the UV copy that keeps the triangle's three UVs in ONE texture island (smallest UV perimeter).  New vertex = (position, chosen copy).
//   node tr2h4_lod2.mjs src.glb out.glb [ratio=0.40] [flags=Permissive] [uvw=1]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, prune, dedup, textureCompress, quantize, meshopt, dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
await MeshoptDecoder.ready; await MeshoptSimplifier.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const [src, outf, ratio = '0.40', fl = 'Permissive', uvw = '1'] = process.argv.slice(2);
const flags = fl.split(',').filter(Boolean);
const d = await io.read(src); await d.transform(dequantize()); await d.transform(weld());
const p = d.getRoot().listMeshes()[0].listPrimitives()[0];
const ia = Uint32Array.from(p.getIndices().getArray()), pa = Float32Array.from(p.getAttribute('POSITION').getArray()), uv = Float32Array.from(p.getAttribute('TEXCOORD_0').getArray());
const tgt = Math.floor(ia.length / 3 * +ratio);
const [ni, e] = MeshoptSimplifier.simplifyWithAttributes(ia, pa, 3, uv, 2, [+uvw, +uvw], null, tgt * 3, 1.0, flags);
console.log('tris', ia.length / 3, '->', ni.length / 3, 'err', e.toFixed(4), flags.join('+') || '-');
// copies of one position
const key = (i) => Math.round(pa[i * 3] * 1e5) + ',' + Math.round(pa[i * 3 + 1] * 1e5) + ',' + Math.round(pa[i * 3 + 2] * 1e5), byPos = new Map();
for (let i = 0; i < pa.length / 3; i++) { const k = key(i); let l = byPos.get(k); if (!l) byPos.set(k, l = []); l.push(i); }
const cand = (i) => byPos.get(key(i)), U = (i) => [uv[i * 2], uv[i * 2 + 1]], dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const outIdx = new Uint32Array(ni.length); let fixed = 0;
for (let t = 0; t < ni.length / 3; t++) {
  const c = [cand(ni[t * 3]), cand(ni[t * 3 + 1]), cand(ni[t * 3 + 2])]; let best = null, bc = 1e9, cur = 0;
  { const u0 = U(ni[t * 3]), u1 = U(ni[t * 3 + 1]), u2 = U(ni[t * 3 + 2]); cur = dist(u0, u1) + dist(u1, u2) + dist(u2, u0); }
  for (const a of c[0]) for (const b of c[1]) for (const g of c[2]) { const ua = U(a), ub = U(b), ug = U(g), per = dist(ua, ub) + dist(ub, ug) + dist(ug, ua); if (per < bc - 1e-9) { bc = per; best = [a, b, g]; } }
  if (bc < cur - 1e-6) fixed++;
  outIdx[t * 3] = best[0]; outIdx[t * 3 + 1] = best[1]; outIdx[t * 3 + 2] = best[2];
}
console.log('triangles whose UV corners were re-picked:', fixed, 'of', ni.length / 3);
const used = new Map(), out = new Uint32Array(outIdx.length);
for (let k = 0; k < outIdx.length; k++) { const v = outIdx[k]; let m = used.get(v); if (m === undefined) { m = used.size; used.set(v, m); } out[k] = m; }
for (const sem of p.listSemantics()) { const acc = p.getAttribute(sem), es = acc.getElementSize(), s = acc.getArray(), arr = new Float32Array(used.size * es); for (const [v, m] of used) for (let k = 0; k < es; k++) arr[m * es + k] = s[v * es + k]; acc.setArray(arr); }
p.getIndices().setArray(out);
await d.transform(prune(), dedup());
await d.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [8, 8], quality: 80 }));
await d.transform(quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(outf, d); console.log('written', Math.round(fs.statSync(outf).size / 1024) + 'KB');
