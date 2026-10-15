// ST1 ship tool: a raw Tripo storehouse GLB -> library format (like TR2): welded, simplified to the triangle budget (attribute-aware: the UVs are kept), texture 2K -> 512 WebP, quantised + meshopt.
// No recolour, no repaint, pivot untouched (the raw files already stand on y = 0 with the base centre at the origin).
//   node st1_ship.mjs IN.glb OUT.glb TARGET_TRIS [TEX_PX]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, prune, dedup, textureCompress, quantize, meshopt, dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
await MeshoptDecoder.ready; await MeshoptSimplifier.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const tris = (d) => { let t = 0; for (const m of d.getRoot().listMeshes()) for (const p of m.listPrimitives()) { const i = p.getIndices(); t += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; } return t; };
const [src, outf, target, px] = [process.argv[2], process.argv[3], +process.argv[4], +(process.argv[5] || 512)];
const d = await io.read(src); await d.transform(dequantize()); await d.transform(weld());
const before = tris(d), p = d.getRoot().listMeshes()[0].listPrimitives()[0];
const ia = Uint32Array.from(p.getIndices().getArray()), pa = Float32Array.from(p.getAttribute('POSITION').getArray()), uv = Float32Array.from(p.getAttribute('TEXCOORD_0').getArray());
const tgt = Math.min(target, Math.floor(ia.length / 3));
const [ni, err] = tgt >= ia.length / 3 ? [ia, 0] : MeshoptSimplifier.simplifyWithAttributes(ia, pa, 3, uv, 2, [1, 1], null, tgt * 3, 1.0, ['Permissive']);
const used = new Map(), out = new Uint32Array(ni.length);
for (let k = 0; k < ni.length; k++) { const v = ni[k]; let m = used.get(v); if (m === undefined) { m = used.size; used.set(v, m); } out[k] = m; }
for (const sem of p.listSemantics()) { const acc = p.getAttribute(sem), es = acc.getElementSize(), a = acc.getArray(), arr = new Float32Array(used.size * es); for (const [v, m] of used) for (let k = 0; k < es; k++) arr[m * es + k] = a[v * es + k]; acc.setArray(arr); }
p.getIndices().setArray(out);
await d.transform(prune(), dedup());
await d.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [px, px], quality: 84 }));
await d.transform(quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(outf, d);
console.log(src.split('/').pop().slice(0, 30), before, '->', tris(d), 'tris, err', err.toFixed(4), ',', Math.round(fs.statSync(src).size / 1024) + 'KB ->', Math.round(fs.statSync(outf).size / 1024) + 'KB');
