// tr2h_foot.mjs — footprint of the house GLBs: whole bbox vs the ground layer (lowest 6 % of the height), and where the base centre sits against the pivot
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'node:fs';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const dir = '/home/claude/bot/bluebot_v2/bluewall/web/assets/tr2/';
for (const f of fs.readdirSync(dir).filter((n) => /^house_(generic|cottage|merchant|noble|craftsman)_\w+\.glb$/.test(n))) {
  const doc = await io.read(dir + f), pts = [];
  for (const node of doc.getRoot().listNodes()) { const mesh = node.getMesh(); if (!mesh) continue; const m = node.getWorldMatrix();
    for (const pr of mesh.listPrimitives()) { const a = pr.getAttribute('POSITION'), v = [0, 0, 0]; for (let i = 0; i < a.getCount(); i++) { a.getElement(i, v); const x = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], y = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], z = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]; pts.push([x, y, z]); } } }
  let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (const p of pts) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p[k]); hi[k] = Math.max(hi[k], p[k]); }
  const h = hi[1] - lo[1], base = pts.filter((p) => p[1] < lo[1] + 0.06 * h); let bl = [1e9, 1e9], bh = [-1e9, -1e9]; for (const p of base) { bl = [Math.min(bl[0], p[0]), Math.min(bl[1], p[2])]; bh = [Math.max(bh[0], p[0]), Math.max(bh[1], p[2])]; }
  // middle layer (y in 30..60 % of the height): the walls
  const mid = pts.filter((p) => p[1] > lo[1] + 0.2 * h && p[1] < lo[1] + 0.5 * h); let ml = [1e9, 1e9], mh = [-1e9, -1e9]; for (const p of mid) { ml = [Math.min(ml[0], p[0]), Math.min(ml[1], p[2])]; mh = [Math.max(mh[0], p[0]), Math.max(mh[1], p[2])]; }
  const r = (v) => Math.round(v * 100) / 100;
  console.log(f.padEnd(26), 'bbox', [r(hi[0] - lo[0]), r(h), r(hi[2] - lo[2])].join('x'), ' centre', r((hi[0] + lo[0]) / 2), r((hi[2] + lo[2]) / 2), ' base', r(bh[0] - bl[0]), r(bh[1] - bl[1]), 'c', r((bh[0] + bl[0]) / 2), r((bh[1] + bl[1]) / 2), ' walls(20-50%)', r(mh[0] - ml[0]), r(mh[1] - ml[1]), 'c', r((mh[0] + ml[0]) / 2), r((mh[1] + ml[1]) / 2));
}
