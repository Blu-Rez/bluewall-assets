// u2_pack.mjs RECIPE.json — one source model -> one game-ready glb (skin-safe simplify, clips picked / renamed / shifted to t=0, webp textures, meshopt)
//   recipe: { src, out, tris, err, tex, clips: {"<source clip suffix>": "<game name>"}, dropFlat, keepMeshes: [regex], dropMeshes: [regex], leavesOnly }
// run from /tmp/claude-0/gt (the @gltf-transform install lives there):  cp dev/u2_pack.mjs /tmp/claude-0/gt && cd /tmp/claude-0/gt && node u2_pack.mjs RECIPE.json
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, textureCompress, meshopt, getBounds, resample } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const R = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const doc = await io.read(R.src), root = doc.getRoot();
const trisOf = () => { let t = 0; for (const n of root.listNodes()) { const m = n.getMesh(); if (m) for (const p of m.listPrimitives()) { const ix = p.getIndices(); t += (ix ? ix.getCount() : p.getAttribute('POSITION').getCount()) / 3; } } return Math.round(t); };
const t0 = trisOf();
// ---- drop floor planes / unwanted meshes
for (const n of root.listNodes()) {
  const m = n.getMesh(); if (!m) continue;
  const nm = (m.getName() || '') + ' ' + (n.getName() || '') + ' ' + m.listPrimitives().map((p) => (p.getMaterial() ? p.getMaterial().getName() : '')).join(' ');
  let drop = (R.dropMeshes || []).some((r) => new RegExp(r, 'i').test(nm)) || ((R.keepMeshes || []).length && !R.keepMeshes.some((r) => new RegExp(r, 'i').test(nm)));
  if (R.dropFlat && !n.getSkin()) { const b = getBounds(n); const s = [0, 1, 2].map((i) => b.max[i] - b.min[i]); if (s[1] < 0.03 * Math.max(s[0], s[2])) drop = true; }
  if (drop) { n.setMesh(null); console.log('drop mesh', nm.slice(0, 60)); }
}
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) { const mt = p.getMaterial(); if (mt && (R.dropPrims || []).some((r) => new RegExp(r, 'i').test(mt.getName()))) { console.log('drop primitive', mt.getName()); m.removePrimitive(p); } }
await doc.transform(prune());
// ---- clips: keep + rename + shift to t=0
if (R.clips) {
  for (const a of root.listAnimations()) {
    const base = a.getName().replace(/^.*\|/, ''); const to = R.clips[base];
    if (!to) { a.dispose(); continue; }
    a.setName(to);
    let mn = Infinity; for (const s of a.listSamplers()) { const arr = s.getInput().getArray(); mn = Math.min(mn, arr[0]); }
    for (const s of a.listSamplers()) { const inp = s.getInput().clone(); const arr = Float32Array.from(inp.getArray()); if (mn > 0.0001) for (let i = 0; i < arr.length; i++) arr[i] -= mn; inp.setArray(arr); s.setInput(inp); }
  }
  console.log('clips', root.listAnimations().map((a) => { let mx = 0; for (const s of a.listSamplers()) { const arr = s.getInput().getArray(); mx = Math.max(mx, arr[arr.length - 1]); } return a.getName() + ':' + mx.toFixed(2) + 's'; }).join(' '));
}
// ---- simplify (vertices stay -> skin weights / uvs stay valid)
const t1 = trisOf();
if (R.posWeld) {                                   // meshes whose vertices are split per face (verts = 2 x tris): simplify on a position-welded index, keep one source vertex per welded one
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) {
    const pos = p.getAttribute('POSITION'), ix = p.getIndices(), P = pos.getArray(), n = pos.getCount(), idx = ix.getArray(), key = new Map(), rep = new Uint32Array(n);
    const q = 1e4; for (let i = 0; i < n; i++) { const k = Math.round(P[i * 3] * q) + ',' + Math.round(P[i * 3 + 1] * q) + ',' + Math.round(P[i * 3 + 2] * q); if (!key.has(k)) key.set(k, i); rep[i] = key.get(k); }
    const widx = Uint32Array.from(idx, (v) => rep[v]), uid = new Map(), upos = [], orig = []; const cidx = new Uint32Array(widx.length);
    for (let i = 0; i < widx.length; i++) { const v = widx[i]; if (!uid.has(v)) { uid.set(v, orig.length); orig.push(v); upos.push(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]); } cidx[i] = uid.get(v); }
    const tgt = Math.round((R.tris || t1) * 3);
    const [o1, err] = MeshoptSimplifier.simplify(cidx, Float32Array.from(upos), 3, tgt, R.err || 0.05, []); const out = Uint32Array.from(o1, (c) => orig[c]);
    console.log('posWeld', n, 'verts ->', key.size, 'unique; tris', idx.length / 3, '->', out.length / 3, 'err', err.toFixed(4));
    ix.setArray(idx instanceof Uint32Array ? out : Uint32Array.from(out)); ix.setType('SCALAR');
  }
} else if (R.tris && t1 > R.tris) await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: Math.max(0.03, R.tris / t1), error: R.err || 0.03, lockBorder: false }));
await doc.transform(dedup(), prune());
if (R.resample !== false) await doc.transform(resample({ tolerance: R.rtol || 0.0005 }));
if (R.tex) await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [R.tex, R.tex], quality: R.q || 80 }));
await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(R.out, doc);
const sz = fs.statSync(R.out).size;
console.log(JSON.stringify({ out: R.out, trisBefore: t0, trisAfter: trisOf(), KB: Math.round(sz / 1024), textures: root.listTextures().map((t) => t.getSize().join('x') + ' ' + Math.round(t.getImage().byteLength / 1024) + 'KB') }));
