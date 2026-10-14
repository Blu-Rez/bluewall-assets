// c2_nodes.mjs FILE  — list node names + mesh tris + bbox of a glTF (to pick `only` nodes for mkkit)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(process.argv[2]);
for (const n of doc.getRoot().listNodes()) {
  const m = n.getMesh(); if (!m) continue;
  let t = 0; for (const p of m.listPrimitives()) { const i = p.getIndices(); t += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; }
  const b = getBounds(n); console.log(n.getName().padEnd(34), String(Math.round(t)).padStart(6), 'tris', b.min.map((v) => v.toFixed(1)).join(','), '->', b.max.map((v) => v.toFixed(1)).join(','), 'mats', m.listPrimitives().map((p) => p.getMaterial() && p.getMaterial().getName()).join('|').slice(0, 60));
}
