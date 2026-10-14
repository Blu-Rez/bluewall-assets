// TR2 S4c tool: UV-aware simplify of EVERY mesh (node) of a pack GLB (slim_uv.mjs does the first mesh only), then re-size the texture and write meshopt-compressed.
//   node tr2_slim_pack.mjs IN.glb OUT.glb TEXSIZE TARGET [node=target,...]      TARGET = default triangles per node; node=target overrides one
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, prune, dedup, textureCompress, quantize, meshopt, dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
await MeshoptDecoder.ready; await MeshoptSimplifier.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const [src, outf, tex, def] = [process.argv[2], process.argv[3], +process.argv[4], +process.argv[5]];
const over = Object.fromEntries((process.argv[6] || '').split(',').filter(Boolean).map((s) => s.split('=')).map(([k, v]) => [k, +v]));
const d = await io.read(src); await d.transform(dequantize()); await d.transform(weld());
const flags = ['Permissive'];
const nodeOf = new Map(); for (const n of d.getRoot().listNodes()) if (n.getMesh()) nodeOf.set(n.getMesh(), n.getName());
let tb = 0, ta = 0; const rows = [];
for (const m of d.getRoot().listMeshes()) {
  const name = nodeOf.get(m) || m.getName(), target = over[name] ?? def;
  for (const p of m.listPrimitives()) {
    const ia = Uint32Array.from(p.getIndices().getArray()), pa = Float32Array.from(p.getAttribute('POSITION').getArray()), uv = Float32Array.from(p.getAttribute('TEXCOORD_0').getArray());
    const before = ia.length / 3, tgt = Math.min(target, before); tb += before;
    let ni = ia, err = 0;
    if (tgt < before) [ni, err] = MeshoptSimplifier.simplifyWithAttributes(ia, pa, 3, uv, 2, [1, 1], null, tgt * 3, 1.0, flags);
    const used = new Map(), out = new Uint32Array(ni.length);
    for (let k = 0; k < ni.length; k++) { const v = ni[k]; let q = used.get(v); if (q === undefined) { q = used.size; used.set(v, q); } out[k] = q; }
    for (const sem of p.listSemantics()) { const acc = p.getAttribute(sem), es = acc.getElementSize(), sa = acc.getArray(), arr = new Float32Array(used.size * es); for (const [v, q] of used) for (let k = 0; k < es; k++) arr[q * es + k] = sa[v * es + k]; acc.setArray(arr); }
    p.getIndices().setArray(out); ta += out.length / 3; rows.push(`${name} ${before}->${out.length / 3} err ${err.toFixed(4)}`);
  }
}
await d.transform(prune(), dedup());
if (tex) await d.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [tex, tex], quality: 82 }));
await d.transform(quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(outf, d);
console.log(rows.join(' | ')); console.log(src.split('/').pop(), tb, '->', ta, 'tris', Math.round(fs.statSync(src).size / 1024) + 'KB ->', Math.round(fs.statSync(outf).size / 1024) + 'KB');
