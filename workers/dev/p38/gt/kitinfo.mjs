import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(process.argv[2]);
const R = doc.getRoot();
let tb = 0; const rows = [];
for (const t of R.listTextures()) { const n = t.getImage().byteLength; tb += n; rows.push([t.getName() || t.getURI(), t.getSize().join('x'), n]); }
rows.sort((a, b) => b[2] - a[2]);
console.log('textures', R.listTextures().length, 'total KB', Math.round(tb / 1024)); for (const r of rows.slice(0, 14)) console.log(' ', r[0], r[1], Math.round(r[2] / 1024) + 'KB');
let vb = 0; for (const a of R.listAccessors()) vb += a.getArray().byteLength;
console.log('materials', R.listMaterials().length, 'meshes', R.listMeshes().length, 'accessor KB(decoded)', Math.round(vb / 1024));
