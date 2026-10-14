import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const B = '/home/claude/blu-rez/bluewall-assets/v4/sketchfab/heroes/';
for (const d of process.argv.slice(2)) {
  const doc = await io.read(B + d + '/scene.gltf'); const R = doc.getRoot();
  let tris = 0; for (const m of R.listMeshes()) for (const p of m.listPrimitives()) tris += (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
  console.log(d, 'tris', tris, 'skins', R.listSkins().length, 'joints', R.listSkins().map((s) => s.listJoints().length).join(','), 'anims:', R.listAnimations().map((a) => a.getName() + '(' + Math.max(...a.listSamplers().map((s) => s.getInput().getMax([])[0])).toFixed(1) + 's)').join(' '));
}
