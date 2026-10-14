// tr2_inv.mjs LIBROOT OUT.json — inventory of every Tripo GLB: tris, textures, skins, and for packs every top-level node (name, tris, bbox).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import fs from 'fs'; import path from 'path';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const root = process.argv[2], out = process.argv[3];
const files = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.glb')) files.push(p); } };
walk(root); files.sort();
const triOf = (mesh) => { let t = 0; for (const p of mesh.listPrimitives()) { const ix = p.getIndices(), pos = p.getAttribute('POSITION'); t += (ix ? ix.getCount() : (pos ? pos.getCount() : 0)) / 3; } return t; };
const trisNode = (n) => { let t = 0; const m = n.getMesh(); if (m) t += triOf(m); for (const c of n.listChildren()) t += trisNode(c); return t; };
const r2 = (v) => +v.toFixed(3);
const res = [];
for (const fp of files) {
  const key = path.basename(fp, '.glb'), cat = path.basename(path.dirname(path.dirname(fp)));
  const r = { cat, key, kb: Math.round(fs.statSync(fp).size / 1024) };
  try {
    const doc = await io.read(fp), R = doc.getRoot(), scene = R.getDefaultScene() || R.listScenes()[0];
    const tops = scene.listChildren();
    r.tris = Math.round(tops.reduce((a, n) => a + trisNode(n), 0));
    r.mats = R.listMaterials().length;
    const tx = R.listTextures();
    r.tex = tx.map((t) => ({ mime: t.getMimeType(), size: t.getSize(), kb: Math.round(t.getImage().byteLength / 1024) }));
    r.skins = R.listSkins().length; r.joints = R.listSkins().reduce((a, s) => a + s.listJoints().length, 0);
    r.anims = R.listAnimations().map((a) => a.getName());
    const bb = getBounds(scene); r.size = [0, 1, 2].map((i) => r2(bb.max[i] - bb.min[i])); r.min = bb.min.map(r2); r.max = bb.max.map(r2);
    r.top = tops.length;
    if (tops.length > 1 || (tops.length === 1 && tops[0].listChildren().length > 1)) {
      const nodes = tops.length > 1 ? tops : tops[0].listChildren();
      r.nodes = nodes.map((n) => { let b = null; try { b = getBounds(n); } catch (e) {} return { name: n.getName(), tris: Math.round(trisNode(n)), size: b ? [0, 1, 2].map((i) => r2(b.max[i] - b.min[i])) : null, t: n.getTranslation().map(r2) }; });
    }
  } catch (e) { r.err = String(e).slice(0, 160); }
  res.push(r); process.stderr.write('.');
}
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log('\nwrote', out, res.length, 'errors', res.filter((x) => x.err).length);
