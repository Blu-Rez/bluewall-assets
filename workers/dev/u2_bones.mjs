// u2_bones.mjs FILE... — joint names of the first skin + skinned mesh node names + bbox height (for retarget checks)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const f of process.argv.slice(2)) {
  const d = await io.read(f); const r = d.getRoot();
  const sk = r.listSkins()[0]; const names = sk ? sk.listJoints().map((j) => j.getName()) : [];
  console.log(f.split('/').slice(-2)[0], names.length, names.slice(0, 14).join(' | '));
}
