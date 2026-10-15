import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'node:fs';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const dir = '/home/claude/bot/bluebot_v2/bluewall/web/assets/tr2/';
const H = await import('/home/claude/bot/bluebot_v2/bluewall/client/src/b2_homes.js');
const swap = JSON.parse(fs.readFileSync(dir + 'swap.json', 'utf8')).models;
const tab = {}; for (const k of Object.values(H.HOME_TR2)) for (const v of k.v) tab[v[0]] = [v[1], v[3]]; for (const g of Object.values(H.GENERIC)) tab[g[0]] = [g[1], g[3]];
const r = (v) => Math.round(v * 20) / 20, out = {};
for (const key of Object.keys(tab)) {
  const doc = await io.read(dir + key + '.glb'), pts = [];
  for (const node of doc.getRoot().listNodes()) { const mesh = node.getMesh(); if (!mesh) continue; const m = node.getWorldMatrix();
    for (const pr of mesh.listPrimitives()) { const a = pr.getAttribute('POSITION'), v = [0, 0, 0]; for (let i = 0; i < a.getCount(); i++) { a.getElement(i, v); pts.push([m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]]); } } }
  const ry = (swap[key] && swap[key].ry) || 0, th = ry * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
  const T = pts.map((p) => [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]);                      // three.js rotation about Y (the model's own yaw)
  const ext = (a) => { const lo = [1e9, 1e9], hi = [-1e9, -1e9]; for (const p of a) { lo[0] = Math.min(lo[0], p[0]); hi[0] = Math.max(hi[0], p[0]); lo[1] = Math.min(lo[1], p[2]); hi[1] = Math.max(hi[1], p[2]); } return { w: hi[0] - lo[0], d: hi[1] - lo[1], cx: (hi[0] + lo[0]) / 2, cz: (hi[1] + lo[1]) / 2 }; };
  let ylo = 1e9, yhi = -1e9; for (const p of T) { ylo = Math.min(ylo, p[1]); yhi = Math.max(yhi, p[1]); } const h = yhi - ylo;
  const all = ext(T), base = ext(T.filter((p) => p[1] < ylo + 0.07 * h)), k = tab[key][0] / all.w, kz = tab[key][1] / all.d;
  out[key] = { table: tab[key], ratioX: +k.toFixed(3), ratioZ: +kz.toFixed(3), bbox: [r(all.w * k), r(all.d * k)], base: [r(base.w * k), r(base.d * k)], off: [r((base.cx - all.cx) * k), r((base.cz - all.cz) * k)], all_off: [r(all.cx * k), r(all.cz * k)] };
  console.log(key.padEnd(20), JSON.stringify(out[key]));
}
