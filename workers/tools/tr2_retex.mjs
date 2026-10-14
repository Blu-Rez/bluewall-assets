// TR2 ship tool: re-size the texture of a library GLB (geometry untouched: no re-simplify) and write it back meshopt-compressed.
//   node tr2_retex.mjs IN.glb OUT.glb SIZE [quality]      SIZE = max edge in px (square textures): 1024 -> 512 / 256
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { textureCompress, meshopt } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const [src, out, size, q] = [process.argv[2], process.argv[3], +process.argv[4], +(process.argv[5] || 82)];
const d = await io.read(src);
const before = d.getRoot().listTextures().map((t) => t.getSize().join('x')).join(',');
await d.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [size, size], quality: q }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(out, d);
console.log(src.split('/').pop(), before, '->', d.getRoot().listTextures().map((t) => t.getSize().join('x')).join(','), Math.round(fs.statSync(src).size / 1024) + 'KB ->', Math.round(fs.statSync(out).size / 1024) + 'KB');
