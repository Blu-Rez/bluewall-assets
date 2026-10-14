// u3_pack.mjs IN.(glb|gltf) OUT.glb [texSize=1024] [simplifyRatio] — one source model -> a game-ready asset (webp textures <= texSize, quantized, meshopt), like mkkit.mjs does for the kits.
// optional 4th argument: a triangle ratio (0..1) for a meshopt simplify pass (props that are over the triangle budget).
// Run it from /tmp/claude-0/gt (the @gltf-transform install lives there):  cp dev/u3_pack.mjs /tmp/claude-0/gt/ && cd /tmp/claude-0/gt && node u3_pack.mjs IN OUT [tex]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, textureCompress, meshopt, quantize } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const [src, out, tex, ratio] = [process.argv[2], process.argv[3], +(process.argv[4] || 1024), +(process.argv[5] || 0)];
const doc = await io.read(src);
if (ratio) await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error: +(process.env.ERR || 0.02) }));
const tiny = doc.getRoot().listTextures().every((t) => Math.max(...(t.getSize() || [0, 0])) <= 16);   // (a 4x4 palette must stay lossless: webp would smear its colours)
if (!tiny) await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [tex, tex], quality: 82 }));
// (NOQ=1: no quantization — a palette model whose UVs sit on texel centres must keep exact UVs; the crowd shader ignores KHR_texture_transform)
await doc.transform(dedup(), prune(), ...(process.env.NOQ ? [] : [quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 })]), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(out, doc);
console.log(out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
