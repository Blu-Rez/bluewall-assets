// hi -> lo geometric deviation of the shipped castle LOD pairs (web/assets/tr2/<name>.glb vs <name>_lo.glb): for every vertex of the full model the distance to the nearest lo triangle,
// as a fraction of the model's longest side; then in metres at the game's real size.  (lo vertices are a subset of the hi ones, so this one-sided number is the deviation.)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'fs';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const dir = process.argv[2];
async function geo(f) {
  const d = await io.read(f); await d.transform(dequantize());
  const V = [], I = [];
  for (const n of d.getRoot().listNodes()) { const m = n.getMesh(); if (!m) continue; const W = n.getWorldMatrix();
    for (const p of m.listPrimitives()) { const pa = p.getAttribute('POSITION'), ia = p.getIndices(), base = V.length / 3;
      for (let i = 0; i < pa.getCount(); i++) { const [x, y, z] = pa.getElement(i, [0, 0, 0]); V.push(W[0] * x + W[4] * y + W[8] * z + W[12], W[1] * x + W[5] * y + W[9] * z + W[13], W[2] * x + W[6] * y + W[10] * z + W[14]); }
      for (let i = 0; i < ia.getCount(); i++) I.push(base + ia.getScalar(i)); } }
  return { V: Float64Array.from(V), I: Uint32Array.from(I) };
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function ptTri(p, a, b, c) {                                  // Ericson, closest point on a triangle
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a), d1 = dot(ab, ap), d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return Math.sqrt(dot(ap, ap));
  const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp); if (d3 >= 0 && d4 <= d3) return Math.sqrt(dot(bp, bp));
  const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3), q = [ap[0] - v * ab[0], ap[1] - v * ab[1], ap[2] - v * ab[2]]; return Math.sqrt(dot(q, q)); }
  const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp); if (d6 >= 0 && d5 <= d6) return Math.sqrt(dot(cp, cp));
  const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6), q = [ap[0] - w * ac[0], ap[1] - w * ac[1], ap[2] - w * ac[2]]; return Math.sqrt(dot(q, q)); }
  const va = d3 * d6 - d5 * d4; if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)), bc = sub(c, b), q = [bp[0] - w * bc[0], bp[1] - w * bc[1], bp[2] - w * bc[2]]; return Math.sqrt(dot(q, q)); }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den, q = [ap[0] - ab[0] * v - ac[0] * w, ap[1] - ab[1] * v - ac[1] * w, ap[2] - ab[2] * v - ac[2] * w]; return Math.sqrt(dot(q, q));
}
const names = fs.readdirSync(dir).filter((f) => f.endsWith('_lo.glb')).map((f) => f.replace('_lo.glb', '')).sort();
const out = [];
for (const n of names) {
  if (!fs.existsSync(`${dir}/${n}.glb`)) continue;
  const H = await geo(`${dir}/${n}.glb`), L = await geo(`${dir}/${n}_lo.glb`);
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < H.V.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], H.V[i + k]); mx[k] = Math.max(mx[k], H.V[i + k]); }
  const side = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]); let dmax = 0, dsum = 0, cnt = 0;
  const nt = L.I.length / 3, tri = new Array(nt); for (let t = 0; t < nt; t++) { const a = L.I[t * 3], b = L.I[t * 3 + 1], c = L.I[t * 3 + 2]; tri[t] = [[L.V[a * 3], L.V[a * 3 + 1], L.V[a * 3 + 2]], [L.V[b * 3], L.V[b * 3 + 1], L.V[b * 3 + 2]], [L.V[c * 3], L.V[c * 3 + 1], L.V[c * 3 + 2]]]; }
  for (let i = 0; i < H.V.length; i += 3) { const p = [H.V[i], H.V[i + 1], H.V[i + 2]]; let m = 1e9; for (let t = 0; t < nt; t++) { const q = ptTri(p, tri[t][0], tri[t][1], tri[t][2]); if (q < m) m = q; if (m < 1e-6) break; } dmax = Math.max(dmax, m); dsum += m; cnt++; }
  out.push({ name: n, trisHi: H.I.length / 3, trisLo: nt, side: +side.toFixed(4), maxRel: +(dmax / side).toFixed(5), meanRel: +(dsum / cnt / side).toFixed(6) });
  console.log(n.padEnd(40), 'tris', String(H.I.length / 3).padStart(6), '->', String(nt).padStart(6), ' max dev', (100 * dmax / side).toFixed(2) + ' % of the longest side, mean', (100 * dsum / cnt / side).toFixed(3) + ' %');
}
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
