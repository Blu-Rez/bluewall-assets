// b3_mkkit.mjs RECIPE.json OUT.glb  — B3's kit packer (a derivative of dev/p38/mkkit.mjs): packs real CC0 / CC-BY models into ONE game-ready kit with ONE material.
//   recipe = { vars: { NAME: "/abs/dir" }, items: [ item ... ] }   ($NAME in a src is replaced by the var)
//   item   = { name, src, w|h|s, tris, err, lift, mul, rotY, only }          a single model: bottom-centre at the origin, metres
//          | { name, parts: [ { src, w|h|s, tris, x, y, z, ry (deg), rotY, only, lift, mul } ] }   a composite of real models placed in metres (x, y, z = bottom-centre of the part)
//   Differences to mkkit.mjs: EVERY opaque material (the KayKit atlas and the Quaternius trims too) is baked into vertex colours on the single shared material `flat`
//   (no texture left in the kit: smaller file, 1 material = 1 draw call per batch, +0 programs); composites let a stack of props (table + mugs + coins) be one piece
//   so the piece list `{ n, x, z, ry, s }` needs no height field.
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { metalRough, dedup, prune, weld, simplify, meshopt, quantize, getBounds, flatten, mergeDocuments } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const R = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), out = process.argv[3], vars = R.vars || {};
const sub = (p) => p.replace(/\$(\w+)/g, (m, k) => (vars[k] != null ? vars[k] : m));
const kit = new Document(); const kbuf = kit.createBuffer('b'); const kscene = kit.createScene('kit'); kit.getRoot().setDefaultScene(kscene);

const CQ = +(process.env.CQ || 0);
const s2l = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const imgCache = new Map();
async function decode(tex) {
  if (imgCache.has(tex)) return imgCache.get(tex);
  const r = await sharp(Buffer.from(tex.getImage())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = { w: r.info.width, h: r.info.height, d: r.data }; imgCache.set(tex, o); return o;
}
function sample(img, u, v) {
  u = u - Math.floor(u); v = v - Math.floor(v); const x = u * (img.w - 1), y = v * (img.h - 1), x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(img.w - 1, x0 + 1), y1 = Math.min(img.h - 1, y0 + 1), fx = x - x0, fy = y - y0;
  const o = [0, 0, 0, 0]; for (let c = 0; c < 4; c++) { const a = img.d[(y0 * img.w + x0) * 4 + c], b = img.d[(y0 * img.w + x1) * 4 + c], d = img.d[(y1 * img.w + x0) * 4 + c], e = img.d[(y1 * img.w + x1) * 4 + c]; o[c] = (a * (1 - fx) + b * fx) * (1 - fy) + (d * (1 - fx) + e * fx) * fy; }
  return o;
}
// ONE material for everything (flat, vertex colour): see the header
async function bake(doc, lift = 1, mul = 1) {
  const flat = doc.createMaterial('flat').setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(0.88).setMetallicFactor(0).setDoubleSided(false);
  let n = 0;
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) {
    const mt = p.getMaterial(); if (!mt) continue;
    const tex = mt.getBaseColorTexture();
    if (mt.getAlphaMode() !== 'OPAQUE' || mt.getEmissiveTexture() || mt.getEmissiveFactor().some((v) => v > 0.01)) continue;
    const pos = p.getAttribute('POSITION'); if (!pos) continue; const cnt = pos.getCount(), bf = mt.getBaseColorFactor(), old = p.getAttribute('COLOR_0'), arr = new Float32Array(cnt * 3);
    let img = null, uv = null; if (tex) { img = await decode(tex); uv = p.getAttribute('TEXCOORD_' + (mt.getBaseColorTextureInfo().getTexCoord() || 0)); if (!uv) continue; }
    for (let i = 0; i < cnt; i++) {
      const o = old ? old.getElement(i, []) : [1, 1, 1, 1]; let r = 1, g = 1, b = 1;
      if (img) { const t = uv.getElement(i, []); const c = sample(img, t[0], t[1]); r = s2l(c[0] / 255); g = s2l(c[1] / 255); b = s2l(c[2] / 255); }
      let cr = mul * Math.pow(o[0] * bf[0] * r, lift), cg = mul * Math.pow(o[1] * bf[1] * g, lift), cb = mul * Math.pow(o[2] * bf[2] * b, lift);
      if (CQ) { const q = (v) => Math.pow(Math.round(Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2) * CQ) / CQ, 2.2); cr = q(cr); cg = q(cg); cb = q(cb); }   // coarse colour levels: equal-looking corners weld into one vertex
      arr[i * 3] = cr; arr[i * 3 + 1] = cg; arr[i * 3 + 2] = cb;
    }
    p.setAttribute('COLOR_0', doc.createAccessor().setType('VEC3').setArray(arr).setBuffer(doc.getRoot().listBuffers()[0]));
    p.setMaterial(flat); n++;
  }
  return n;
}
// crease-aware normals for a welded, indexed primitive (POSITION + COLOR_0 only): faces closer than ~38 deg share a smooth normal, harder edges stay hard (a split vertex)
function creaseNormals(doc, p, deg = 38) {
  const pos = p.getAttribute('POSITION'), col = p.getAttribute('COLOR_0'), ind = p.getIndices(); if (!ind) return;
  const V = pos.getCount(), I = ind.getArray(), T = I.length / 3, P = new Float32Array(V * 3), C = new Float32Array(V * 3); for (let i = 0; i < V; i++) { pos.getElement(i, P.subarray(i * 3, i * 3 + 3)); col.getElement(i, C.subarray(i * 3, i * 3 + 3)); }
  const fn = new Float32Array(T * 3), adj = Array.from({ length: V }, () => []);
  for (let t = 0; t < T; t++) {
    const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    fn[t * 3] = uy * vz - uz * vy; fn[t * 3 + 1] = uz * vx - ux * vz; fn[t * 3 + 2] = ux * vy - uy * vx;           // area-weighted (not normalised yet)
    for (let k = 0; k < 3; k++) adj[I[t * 3 + k]].push(t);
  }
  const unit = new Float32Array(T * 3); for (let t = 0; t < T; t++) { const l = Math.hypot(fn[t * 3], fn[t * 3 + 1], fn[t * 3 + 2]) || 1; unit[t * 3] = fn[t * 3] / l; unit[t * 3 + 1] = fn[t * 3 + 1] / l; unit[t * 3 + 2] = fn[t * 3 + 2] / l; }
  const thr = Math.cos((deg * Math.PI) / 180), key = new Map(), oP = [], oN = [], oC = [], oI = new Uint32Array(T * 3);
  for (let t = 0; t < T; t++) for (let k = 0; k < 3; k++) {
    const v = I[t * 3 + k]; let nx = 0, ny = 0, nz = 0;
    for (const f of adj[v]) if (unit[f * 3] * unit[t * 3] + unit[f * 3 + 1] * unit[t * 3 + 1] + unit[f * 3 + 2] * unit[t * 3 + 2] >= thr) { nx += fn[f * 3]; ny += fn[f * 3 + 1]; nz += fn[f * 3 + 2]; }
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const kk = v + '|' + Math.round(nx * 24) + ',' + Math.round(ny * 24) + ',' + Math.round(nz * 24); let id = key.get(kk);
    if (id == null) { id = oP.length / 3; key.set(kk, id); oP.push(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]); oN.push(nx, ny, nz); oC.push(C[v * 3], C[v * 3 + 1], C[v * 3 + 2]); }
    oI[t * 3 + k] = id;
  }
  const buf = doc.getRoot().listBuffers()[0];
  p.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(oP)).setBuffer(buf));
  p.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(oN)).setBuffer(buf));
  p.setAttribute('COLOR_0', doc.createAccessor().setType('VEC3').setArray(new Float32Array(oC)).setBuffer(buf));
  p.setIndices(doc.createAccessor().setType('SCALAR').setArray(oI).setBuffer(buf));
}
const countTris = (doc) => { let t = 0; for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) { const i = p.getIndices(); t += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; } return Math.round(t); };
const prepCache = new Map();
async function prep(it) {
  const key = JSON.stringify([it.src, it.only || 0, it.tris || 0, it.err || 0, it.lift || 1, it.mul || 1, it.crease || 0]);
  if (prepCache.has(key)) return prepCache.get(key);
  const doc = await io.read(sub(it.src));
  for (const a of doc.getRoot().listAnimations()) a.dispose();
  for (const s of doc.getRoot().listSkins()) s.dispose();
  await doc.transform(metalRough(), flatten(), dedup(), prune());
  if (it.only) { const keep = new Set(it.only); for (const n of doc.getRoot().listNodes()) if (n.getMesh() && !keep.has(n.getName())) n.setMesh(null); await doc.transform(prune()); }
  const tris = countTris(doc);
  await bake(doc, it.lift || 1, it.mul || 1);                                     // 1. colours first (sampled at the ORIGINAL vertices + uvs)
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) { if (!p.getMaterial() || p.getMaterial().getName() !== 'flat') continue; for (const sem of p.listSemantics()) if (!['POSITION', 'COLOR_0'].includes(sem)) p.setAttribute(sem, null); }
  await doc.transform(prune(), weld());                                           // 2. positions + colour only: seams between equal faces disappear, so the simplifier can really collapse them
  if (it.tris && tris > it.tris) await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: Math.max(0.02, it.tris / tris), error: it.err || 0.05, lockBorder: false }));
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) if (p.getMaterial() && p.getMaterial().getName() === 'flat') creaseNormals(doc, p, it.crease || +(process.env.CREASE || 55));   // 3. normals back
  await doc.transform(prune());
  const sc = doc.getRoot().listScenes()[0], b = getBounds(sc);
  const o = { doc, sc, b, sz: [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]], tris, after: countTris(doc) };
  prepCache.set(key, o); return o;
}
// put one prepared model into the kit under `parent` with its bottom-centre at (x, y, z), turned by ry degrees; returns its size in metres
async function place(parent, it, x = 0, y = 0, z = 0, ry = 0, tag = 'p') {
  const P = await prep(it), b = P.b, sz = P.sz, cx = (b.min[0] + b.max[0]) / 2, cz = (b.min[2] + b.max[2]) / 2;
  const s = it.s || (it.h ? it.h / sz[1] : it.d ? it.d / sz[2] : (it.w || 8) / Math.max(sz[0], sz[2]));
  const y0 = it.anchor === 'center' ? (b.min[1] + b.max[1]) / 2 : b.min[1];
  const map = mergeDocuments(kit, P.doc); const src = map.get(P.sc); if (!src) throw new Error('merge produced no scene');
  const holder = kit.createNode(tag + '_h'), inner = kit.createNode(tag + '_n');
  const rr = ((it.rotY || 0) * Math.PI) / 180, c = Math.cos(rr), sn = Math.sin(rr), a = (ry * Math.PI) / 360;
  holder.setTranslation([x, y, z]).setRotation([0, Math.sin(a), 0, Math.cos(a)]);
  inner.setScale([s, s, s]).setRotation([0, Math.sin(rr / 2), 0, Math.cos(rr / 2)]);
  inner.setTranslation([-(cx * c + cz * sn) * s, -y0 * s, -(-cx * sn + cz * c) * s]);
  for (const ch of src.listChildren()) { src.removeChild(ch); inner.addChild(ch); }
  holder.addChild(inner); parent.addChild(holder); src.dispose();
  return { tris: P.after, size: sz.map((v) => v * s) };
}
const report = [];
for (const it of R.items) {
  try {
    const top = kit.createNode(it.name); kscene.addChild(top); let tris = 0, k = 0;
    if (it.parts) { for (const p of it.parts) { const r = await place(top, p, p.x || 0, p.y || 0, p.z || 0, p.ry || 0, it.name + '_' + k++); tris += r.tris; } }
    else { const r = await place(top, it, 0, 0, 0, 0, it.name); tris = r.tris; }
    top.setExtras({ b3: true });
    report.push({ name: it.name, tris });
  } catch (e) { report.push({ name: it.name, error: String(e).slice(0, 160) }); }
}
for (const b of kit.getRoot().listBuffers()) if (b !== kbuf) { for (const a of kit.getRoot().listAccessors()) if (a.getBuffer() === b) a.setBuffer(kbuf); b.dispose(); }
for (const a of kit.getRoot().listAccessors()) a.setBuffer(kbuf);
await kit.transform(dedup(), prune(), quantize({ quantizePosition: +(process.env.QP || 14), quantizeNormal: +(process.env.QN || 8), quantizeColor: +(process.env.QC || 8) }), meshopt({ encoder: MeshoptEncoder, level: process.env.ML || 'high' }));
await io.write(out, kit);
// measured bounds of every piece (after packing) -> the report that b3_civic.js's footprints are checked against
const chk = await io.read(out); const sizes = {};
for (const n of chk.getRoot().listScenes()[0].listChildren()) { const b = getBounds(n); sizes[n.getName()] = { min: b.min.map((v) => +v.toFixed(2)), max: b.max.map((v) => +v.toFixed(2)) }; }
for (const r of report) if (sizes[r.name]) { r.min = sizes[r.name].min; r.max = sizes[r.name].max; }
console.log(JSON.stringify(report.filter((r) => r.error), null, 1)); console.log('pieces', report.filter((r) => !r.error).length, 'errors', report.filter((r) => r.error).length, 'materials', chk.getRoot().listMaterials().length, 'textures', chk.getRoot().listTextures().length, 'bytes', fs.statSync(out).size, 'tris', report.reduce((a, r) => a + (r.tris || 0), 0));
fs.writeFileSync(out.replace(/\.glb$/, '.report.json'), JSON.stringify(report, null, 1));
