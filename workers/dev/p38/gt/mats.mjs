import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(process.argv[2]);
for (const m of doc.getRoot().listMaterials()) { const t = m.getBaseColorTexture(); console.log((m.getName() || '?').padEnd(28), 'tex', t ? (t.getName() || t.getURI() || 'y').slice(0, 24) : '-', 'alpha', m.getAlphaMode(), 'met', m.getMetallicFactor().toFixed(2), 'emis', m.getEmissiveFactor().map((v) => v.toFixed(1)).join(','), 'ds', m.getDoubleSided()); }
