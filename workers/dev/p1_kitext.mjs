// p1_kitext.mjs — writes /home/claude/dev/p1_kitext.json = { pieceName: { x:[lo,hi], y:[lo,hi], z:[lo,hi] } } (metres, dequantised, node bounds in kit space)
// for every named piece of the game kits.  Input of dev/p1_test.js.  Run from /tmp/claude-0/gt:  node /home/claude/dev/p1_kitext.mjs
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize, getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'fs';
await MeshoptDecoder.ready;
const A = '/home/claude/bot/bluebot_v2/bluewall/web/assets/';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const out = {};
for (const f of fs.readdirSync(A).filter((n) => /^kit_.*\.glb$/.test(n))) {
  const doc = await io.read(A + f); await doc.transform(dequantize());
  for (const n of doc.getRoot().listScenes().flatMap((sc) => sc.listChildren())) {
    if (!n.getName()) continue;
    const b = getBounds(n); if (!isFinite(b.min[0])) continue;
    out[n.getName()] = { x: [b.min[0], b.max[0]], y: [b.min[1], b.max[1]], z: [b.min[2], b.max[2]] };
  }
}
fs.writeFileSync('/home/claude/dev/p1_kitext.json', JSON.stringify(out));
console.log('pieces', Object.keys(out).length);
