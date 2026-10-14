import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import fs from 'fs'; import path from 'path';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const dir = process.argv[2], out = process.argv[3];
const files = fs.readdirSync(dir).filter(f => f.endsWith('.glb')).sort();
const triOf = (mesh) => { let t = 0; for (const p of mesh.listPrimitives()) { const ix = p.getIndices(); const pos = p.getAttribute('POSITION'); t += (ix ? ix.getCount() : (pos ? pos.getCount() : 0)) / 3; } return t; };
const res = [];
for (const f of files) {
  const fp = path.join(dir, f); const r = { file: f, kb: Math.round(fs.statSync(fp).size / 1024) };
  try {
    const doc = await io.read(fp); const R = doc.getRoot();
    const scene = R.getDefaultScene() || R.listScenes()[0];
    // tris through the scene graph (instances counted)
    let tris = 0, meshNodes = 0; const perTop = [];
    const walk = (n, acc) => { const m = n.getMesh(); if (m) { acc.t += triOf(m); acc.n++; } for (const c of n.listChildren()) walk(c, acc); };
    for (const top of scene.listChildren()) { const acc = { t: 0, n: 0 }; walk(top, acc); tris += acc.t; meshNodes += acc.n; perTop.push({ name: top.getName(), tris: Math.round(acc.t), meshes: acc.n, skin: !!top.getSkin() }); }
    r.tris = Math.round(tris); r.meshNodes = meshNodes; r.top = perTop.length; 
    r.materials = R.listMaterials().length; r.matNames = R.listMaterials().map(m => m.getName()).slice(0, 8);
    const tx = R.listTextures(); r.textures = tx.length; r.texKB = Math.round(tx.reduce((a, t) => a + t.getImage().byteLength, 0) / 1024); r.texMax = tx.reduce((a, t) => Math.max(a, ...(t.getSize() || [0])), 0);
    r.skins = R.listSkins().length; r.joints = R.listSkins().reduce((a, s) => a + s.listJoints().length, 0);
    r.anims = R.listAnimations().map(a => a.getName()); 
    r.ext = R.listExtensionsUsed().map(e => e.extensionName);
    let bb; try { bb = getBounds(scene); r.bbox = [bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]].map(v => +v.toFixed(3)); r.ymin = +bb.min[1].toFixed(3); } catch (e) { r.bbox = null; }
    if (perTop.length > 1 || (perTop.length === 1 && perTop[0].meshes > 1 && !r.skins)) r.parts = perTop.slice(0, 400);
  } catch (e) { r.err = String(e).slice(0, 120); }
  res.push(r); process.stderr.write('.');
}
fs.writeFileSync(out, JSON.stringify(res, null, 1)); console.log('\nwrote', out, res.length);
