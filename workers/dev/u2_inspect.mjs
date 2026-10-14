// u2_inspect.mjs FILE... — prints one JSON line per model: tris, skins/joints, clips, bbox, textures
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf'; 
let dec = null; try { dec = { 'draco3d.decoder': await draco3d.createDecoderModule() }; } catch (e) {}
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS); if (dec) io.registerDependencies(dec);
for (const f of process.argv.slice(2)) {
  try {
    const d = await io.read(f); const root = d.getRoot();
    let tris = 0, mats = new Set(), verts = 0;
    for (const m of root.listMeshes()) for (const p of m.listPrimitives()) { const ix = p.getIndices(); const pos = p.getAttribute('POSITION'); if (!pos) continue; verts += pos.getCount(); tris += (ix ? ix.getCount() : pos.getCount()) / 3; }
    // count instances through scene graph
    let inst = 0, instTris = 0;
    const walk = (n) => { const m = n.getMesh(); if (m) { inst++; for (const p of m.listPrimitives()) { const ix = p.getIndices(); const pos = p.getAttribute('POSITION'); instTris += (ix ? ix.getCount() : pos.getCount()) / 3; } } n.listChildren().forEach(walk); };
    root.listScenes().forEach((s) => s.listChildren().forEach(walk));
    const skins = root.listSkins().map((s) => s.listJoints().length);
    const clips = root.listAnimations().map((a) => { let mx = 0; a.listSamplers().forEach((s) => { const t = s.getInput(); if (t) mx = Math.max(mx, t.getMax([])[0] || 0); }); return `${a.getName()}(${mx.toFixed(2)}s)`; });
    const tex = root.listTextures().map((t) => { const s = t.getSize(); return s ? s.join('x') : '?'; });
    console.log(JSON.stringify({ f: f.split('/').slice(-3).join('/'), tris: Math.round(instTris || tris), verts, skins, nClips: clips.length, clips: clips.slice(0, 40), tex, nodes: root.listNodes().length }));
  } catch (e) { console.log(JSON.stringify({ f, err: String(e).slice(0, 150) })); }
}
