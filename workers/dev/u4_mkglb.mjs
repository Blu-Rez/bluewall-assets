// u4_mkglb.mjs SRC.gltf OUT.glb [maxTex=512]  — game-ready copy of ONE skinned model: webp textures (<= maxTex), meshopt-compressed, no re-rigging, no recolouring.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, textureCompress, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
await MeshoptEncoder.ready;
const [src, out, mt] = process.argv.slice(2), max = +(mt || 512);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(src);
await doc.transform(dedup(), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [max, max], quality: 88 }), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
await io.write(out, doc);
const r = doc.getRoot(); console.log('wrote', out, 'skins', r.listSkins().length, 'anims', r.listAnimations().map((a) => a.getName()), 'tex', r.listTextures().map((t) => t.getMimeType() + ' ' + (t.getImage() || []).length));
