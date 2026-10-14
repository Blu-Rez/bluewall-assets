// u1_mkasset.mjs SPEC.json  — packs ONE real character model into a game-ready glb for crowd.js (run it from /tmp/claude-0/gt: `cp dev/u1_mkasset.mjs /tmp/claude-0/gt && cd /tmp/claude-0/gt && node u1_mkasset.mjs SPEC.json`).
//   spec = { out, base, props: [{ src, bone, name }], packs: [{ src, clips: { "<clip in the pack>": "<name here>" } }], keep: ["clip", ...] (own clips of the base), texture: { maps: "base"|"all", size, webp } }
//   props  : real prop models (a sword, a shield) become child nodes of the named bone — crowd.js (creature.js mergeSkinned) folds rigid meshes under bones into the skinned geometry: ONE draw call
//   packs  : animation packs of the SAME rig (KayKit Rig_Medium): the wanted clips are copied onto the base model's own nodes (by name)
//   nothing is drawn, recoloured or reshaped here: only selection, attaching and compression.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { mergeDocuments, dedup, prune, textureCompress, meshopt, resample, simplify, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const doc = await io.read(spec.base);
const root = doc.getRoot();
const nodeByName = (n) => root.listNodes().find((x) => x.getName() === n);
const log = [];
// ---- own clips of the base model: keep only the wanted ones
const killAnim = (a) => { for (const sm of a.listSamplers()) sm.dispose(); a.dispose(); };      // (samplers keep their accessors alive: dispose them with the clip)
if (spec.keep) for (const a of root.listAnimations()) if (!spec.keep.includes(a.getName())) killAnim(a);
// ---- parts of the base model that are simply left out (a choice between the model's own parts: e.g. the red cape of a unit that has to read as blue; nothing is drawn or recoloured)
for (const nm of spec.dropNodes || []) { const n = nodeByName(nm); if (n) { const par = n.getParentNode(); if (par) par.removeChild(n); n.setMesh(null); n.dispose(); log.push('left out ' + nm); } }
const baseNodes = new Set(root.listNodes());
const baseScene = root.listScenes()[0];
// ---- props
for (const p of spec.props || []) {
  const pd = await io.read(p.src);
  const before = new Set(root.listNodes());
  mergeDocuments(doc, pd);
  const added = root.listNodes().filter((n) => !before.has(n));
  const bone = nodeByName(p.bone); if (!bone) throw new Error('no bone ' + p.bone);
  const holders = added.filter((n) => n.getMesh());
  for (const h of holders) { const par = h.getParentNode(); if (par) par.removeChild(h); baseScene.removeChild(h); h.setName(p.name || h.getName()); bone.addChild(h); }
  // the merged scene of the prop file is no longer needed
  for (const s of root.listScenes()) if (s !== baseScene) s.dispose();
  log.push('prop ' + (p.name || p.src) + ' -> ' + p.bone);
}
// ---- clip packs of the same rig
for (const pk of spec.packs || []) {
  const pd = await io.read(pk.src);
  const had = new Set(root.listAnimations());
  const nbefore = new Set(root.listNodes());
  mergeDocuments(doc, pd);
  const newAnims = root.listAnimations().filter((a) => !had.has(a));
  const packNodes = root.listNodes().filter((n) => !nbefore.has(n));
  for (const a of newAnims) {
    const want = pk.clips[a.getName()];
    if (!want) { killAnim(a); continue; }
    a.setName(want);
    for (const ch of a.listChannels()) {
      const tn = ch.getTargetNode(); const tgt = tn && root.listNodes().find((x) => baseNodes.has(x) && x.getName() === tn.getName());
      if (tgt) ch.setTargetNode(tgt); else { const sm = ch.getSampler(); ch.dispose(); sm && sm.dispose(); }
    }
    log.push('clip ' + want + ' (' + a.listChannels().length + ' channels)');
  }
  // drop the pack's own rig / mannequin
  for (const n of packNodes) { if (n.getMesh()) n.setMesh(null); n.setSkin(null); }
  for (const s of root.listScenes()) if (s !== baseScene) s.dispose();
  for (const sk of root.listSkins()) if (!root.listNodes().some((n) => n.getSkin() === sk)) sk.dispose();
  for (const n of packNodes) if (!root.listAnimations().some((a) => a.listChannels().some((c) => c.getTargetNode() === n))) { const par = n.getParentNode(); if (par) par.removeChild(n); n.dispose(); }
}
// ---- animation channels that never move (every bone's scale, the translation of bones that stay in place) are dropped: same pose, a third of the bytes
{ let dropped = 0;
  for (const a of root.listAnimations()) for (const ch of a.listChannels()) {
    const arr = ch.getSampler().getOutput().getArray(), k = ch.getTargetPath() === 'rotation' ? 4 : 3;
    if (ch.getTargetPath() === 'rotation' && !spec.dropRotations) continue;
    let dev = 0; for (let i = k; i < arr.length; i++) dev = Math.max(dev, Math.abs(arr[i] - arr[i % k]));
    if (dev < 1e-3) { const sm = ch.getSampler(); ch.dispose(); sm && sm.dispose(); dropped++; }
  }
  log.push('dropped ' + dropped + ' constant channels'); }
// ---- materials: keep the base colour, drop normal / metal-rough / emissive maps (the crowd shader needs the albedo)
const T = spec.texture || {};
for (const m of root.listMaterials()) {
  if (T.maps !== 'all') { m.setNormalTexture(null); m.setMetallicRoughnessTexture(null); m.setEmissiveTexture(null); m.setOcclusionTexture(null); m.setEmissiveFactor([0, 0, 0]); m.setMetallicFactor(0); m.setRoughnessFactor(T.rough ?? 0.85); }
}
{ const bufs = root.listBuffers(), b0 = bufs[0]; for (const a of root.listAccessors()) a.setBuffer(b0); for (const b of bufs.slice(1)) b.dispose(); }   // (merged documents bring their own buffers: a GLB has one)
await doc.transform(dedup(), prune());
if (T.size || T.webp) await doc.transform(textureCompress({ encoder: sharp, targetFormat: T.webp ? 'webp' : undefined, resize: T.size ? [T.size, T.size] : undefined, quality: T.webp || 90 }));
if (spec.simplify) await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: spec.simplify, error: spec.simplifyErr ?? 0.001, lockBorder: true }), prune());   // (only to stay inside the triangle budget: vertices are kept, never moved, so the skin weights stay valid)
await doc.transform(resample({ tolerance: T.tol ?? 1e-3 }), prune());
await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(spec.out, doc);
const stat = fs.statSync(spec.out);
let tris = 0; for (const m of root.listMeshes()) for (const pr of m.listPrimitives()) { const i = pr.getIndices(); tris += (i ? i.getCount() : pr.getAttribute('POSITION').getCount()) / 3; }
console.log(JSON.stringify({ out: spec.out, kb: Math.round(stat.size / 1024), tris, clips: root.listAnimations().map((a) => a.getName()), images: root.listTextures().map((t) => (t.getName() || t.getURI()) + ' ' + (t.getSize() || []).join('x')), log }, null, 1));
