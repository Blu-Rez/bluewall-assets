import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { getBounds } from '@gltf-transform/functions';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
for (const f of process.argv.slice(2)) {
  const d = await io.read(f); console.log('==', f.split('/').slice(-2).join('/'));
  const walk = (n, depth) => { const m = n.getMesh(); let info = ''; if (m) { let t = 0; for (const p of m.listPrimitives()) { const i = p.getIndices(); t += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; } info = ` mesh tris=${t}`; } if (depth < 4 || m) console.log(' '.repeat(depth * 2) + n.getName() + info); n.listChildren().forEach((c) => walk(c, depth + 1)); };
  d.getRoot().listScenes()[0].listChildren().forEach((n) => walk(n, 0));
}
