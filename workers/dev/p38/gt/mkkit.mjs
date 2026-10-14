// mkkit.mjs RECIPE.json OUT.glb  — packs many source glTF/GLB models into ONE game-ready kit (named pieces, metres, meshopt + webp).
//   recipe item: { name, src, w|h|d|s, tris, tex, anchor: 'bottom'|'center', rotY (deg), only: [node names] }
//   w / h / d = target size in metres of the bbox width (max of x,z) / height / depth; s = plain scale.  Each piece is a child of the root with that name.
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { compactPrimitive, metalRough, dedup, prune, weld, simplify, textureCompress, meshopt, quantize, getBounds, flatten, join, mergeDocuments } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const [recipe, out] = [JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), process.argv[3]];
const kit = new Document(); const kbuf = kit.createBuffer('b'); const kscene = kit.createScene('kit'); kit.getRoot().setDefaultScene(kscene);

// p38 perf: every opaque material becomes vertex colour on ONE shared material (draw calls per site: ~124 materials -> a handful).  Textured materials of single models
// (not the shared atlases of the KayKit / Medieval-Village kits) are baked into vertex colours too: the texture is sampled at every vertex.
const SHARED = /hexagons_medieval|MI_Trim_|MI_Banner|MI_Props/i;
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
async function flatMats(doc, bakeTex, lift = 1, mul = 1) {
  const mk = new Map(); const get = (ds) => { if (!mk.has(ds)) mk.set(ds, doc.createMaterial(ds ? 'flatDS' : 'flat').setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(0.88).setMetallicFactor(0).setDoubleSided(ds)); return mk.get(ds); };
  let n = 0, baked = 0;
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) {
    const mt = p.getMaterial(); if (!mt) continue;
    const tex = mt.getBaseColorTexture();
    if (mt.getAlphaMode() !== 'OPAQUE' || mt.getEmissiveTexture() || mt.getEmissiveFactor().some((v) => v > 0.01) ) continue;
    if (tex && (!bakeTex || SHARED.test((tex.getName() || '') + (tex.getURI() || '') + (mt.getName() || '')))) continue;
    const pos = p.getAttribute('POSITION'); if (!pos) continue; const cnt = pos.getCount(), bf = mt.getBaseColorFactor(), old = p.getAttribute('COLOR_0'), arr = new Float32Array(cnt * 4);
    let img = null, uv = null; if (tex) { img = await decode(tex); uv = p.getAttribute('TEXCOORD_' + (mt.getBaseColorTextureInfo().getTexCoord() || 0)); if (!uv) continue; }
    for (let i = 0; i < cnt; i++) {
      const o = old ? old.getElement(i, []) : [1, 1, 1, 1]; let r = 1, g = 1, b = 1;
      if (img) { const t = uv.getElement(i, []); const c = sample(img, t[0], t[1]); r = s2l(c[0] / 255); g = s2l(c[1] / 255); b = s2l(c[2] / 255); baked++; }
      arr[i * 4] = mul * Math.pow(o[0] * bf[0] * r, lift); arr[i * 4 + 1] = mul * Math.pow(o[1] * bf[1] * g, lift); arr[i * 4 + 2] = mul * Math.pow(o[2] * bf[2] * b, lift); arr[i * 4 + 3] = 1;
    }
    p.setAttribute('COLOR_0', doc.createAccessor().setType('VEC4').setArray(arr).setBuffer(doc.getRoot().listBuffers()[0]));
    p.setMaterial(get(mt.getDoubleSided())); n++;
  }
  return n;
}
const report = [];
for (const it of recipe) {
  try {
    const doc = await io.read(it.src);
    for (const a of doc.getRoot().listAnimations()) a.dispose();
    for (const s of doc.getRoot().listSkins()) s.dispose();
    await doc.transform(metalRough(), flatten(), dedup(), prune());
    const sc0 = doc.getRoot().listScenes()[0];
    if (it.only) { const keep = new Set(it.only); const walk = (n) => { for (const c of n.listChildren()) { if (!keep.has(c.getName()) && !c.listChildren().some(() => true) && !c.getMesh()) { } } }; /* (selection by node name below) */
      for (const n of doc.getRoot().listNodes()) if (n.getMesh() && !keep.has(n.getName())) n.setMesh(null); await doc.transform(prune()); }
    let tris = 0; for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) { const i = p.getIndices(); tris += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; }
    if (it.sloppy && it.tris && tris > it.tris) {            // heavy scanned / sculpted pieces: the 'sloppy' simplifier (vertex clustering) ignores seams + thin parts
      const SL = Object.create(MeshoptSimplifier); SL.simplify = (ind, pos, stride, target, err) => MeshoptSimplifier.simplifySloppy(ind, pos, stride, null, target, err);
      await doc.transform(weld(), simplify({ simplifier: SL, ratio: Math.max(0.01, it.tris / tris), error: it.sloppyErr || 0.2, lockBorder: false }));
    } else if (it.tris && tris > it.tris) await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: Math.max(0.03, it.tris / tris), error: it.err || 0.02, lockBorder: false }));
    await flatMats(doc, it.vcol !== false, it.lift || 1, it.mul || 1); await doc.transform(prune());
    await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [it.tex || 512, it.tex || 512], quality: 82 }));
    const sc = doc.getRoot().listScenes()[0];
    const b = getBounds(sc), sz = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]], cx = (b.min[0] + b.max[0]) / 2, cz = (b.min[2] + b.max[2]) / 2;
    const s = it.s || (it.h ? it.h / sz[1] : it.d ? it.d / sz[2] : (it.w || 8) / Math.max(sz[0], sz[2]));
    const y0 = it.anchor === 'center' ? (b.min[1] + b.max[1]) / 2 : b.min[1];
    const map = mergeDocuments(kit, doc);                        // adds the source's scene + resources to the kit
    const src = map.get(sc); if (!src) throw new Error('merge produced no scene');
    const holder = kit.createNode(it.name), inner = kit.createNode(it.name + '_n');
    const ry = (it.rotY || 0) * Math.PI / 180, c = Math.cos(ry), sn = Math.sin(ry);
    // piece space: bottom-centre at the origin, metres; optional rotation about Y
    inner.setScale([s, s, s]).setRotation([0, Math.sin(ry / 2), 0, Math.cos(ry / 2)]);
    inner.setTranslation([-(cx * c + cz * sn) * s, -y0 * s, -(-cx * sn + cz * c) * s]);
    for (const ch of src.listChildren()) { src.removeChild(ch); inner.addChild(ch); }
    holder.addChild(inner); kscene.addChild(holder); src.dispose();
    report.push({ name: it.name, tris: Math.round(tris), size: sz.map((v) => +(v * s).toFixed(2)), s: +s.toFixed(3) });
  } catch (e) { report.push({ name: it.name, error: String(e).slice(0, 120) }); }
}
// one buffer
for (const b of kit.getRoot().listBuffers()) if (b !== kbuf) { for (const a of kit.getRoot().listAccessors()) if (a.getBuffer() === b) a.setBuffer(kbuf); b.dispose(); }
for (const a of kit.getRoot().listAccessors()) a.setBuffer(kbuf);
await kit.transform(dedup(), prune(), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(out, kit);
console.log(JSON.stringify(report.filter((r) => r.error), null, 1)); console.log('pieces', report.filter((r) => !r.error).length, 'errors', report.filter((r) => r.error).length, 'bytes', fs.statSync(out).size);
fs.writeFileSync(out.replace(/\.glb$/, '.report.json'), JSON.stringify(report, null, 1));
