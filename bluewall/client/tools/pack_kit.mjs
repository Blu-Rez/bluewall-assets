// Merge many small kit pieces into ONE web-ready .glb (shared materials and
// textures, webp, meshopt). Each piece stays a named root node.
//   node tools/pack_kit.mjs <assets-repo-dir> <kit-name>
import fs from 'node:fs';
import path from 'node:path';
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, textureCompress, meshopt, mergeDocuments, weld, simplify, flatten } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const SRC = process.argv[2], KIT = process.argv[3];
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../web/assets');
const find = (name) => {
  const hits = [];
  const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name === name) hits.push(p); } };
  walk(SRC); if (!hits.length) throw new Error('missing ' + name); return hits.sort()[0];
};
const KITS = {
  village: { tex: 1024, pieces: [
    'Wall_UnevenBrick_Straight', 'Wall_UnevenBrick_Window_Wide_Round', 'Wall_UnevenBrick_Window_Thin_Round', 'Wall_UnevenBrick_Door_Round',
    'Wall_Plaster_Straight', 'Wall_Plaster_Window_Wide_Round', 'Wall_Plaster_Window_Thin_Round', 'Wall_Plaster_WoodGrid', 'Wall_Plaster_Door_Round',
    'Wall_Plaster_Straight_Base', 'Wall_Plaster_Window_Wide_Flat', 'Corner_Exterior_Brick', 'Corner_Exterior_Wood',
    'Roof_RoundTiles_4x4', 'Roof_RoundTiles_4x6', 'Roof_RoundTiles_4x8', 'Roof_RoundTiles_6x6', 'Roof_RoundTiles_6x8', 'Roof_RoundTiles_6x10', 'Roof_RoundTiles_8x10',
    'Roof_Front_Brick4', 'Roof_Front_Brick6', 'Roof_Front_Brick8', 'Roof_Tower_RoundTiles', 'Roof_Dormer_RoundTile',
    'Window_Wide_Round1', 'Window_Thin_Round1', 'WindowShutters_Wide_Round_Open', 'WindowShutters_Thin_Round_Open', 'WindowShutters_Thin_Round_Closed',
    'Door_1_Round', 'DoorFrame_Round_Brick', 'Prop_Chimney', 'Prop_Chimney2', 'Prop_Vine2', 'Prop_Vine5', 'Prop_WoodenFence_Single', 'Prop_WoodenFence_Extension1',
    'Balcony_Simple_Straight', 'Overhang_Plaster_Long', 'Floor_WoodDark', 'Prop_Crate', 'Prop_Support', 'Stairs_Exterior_Straight'],
    simp: { Corner_Exterior_Brick: 0.22, DoorFrame_Round_Brick: 0.3, Roof_: 0.45, Balcony_Simple_Straight: 0.4, Prop_Chimney: 0.5, Window_: 0.45, Door_1: 0.45, WindowShutters_: 0.6 } },
  hex: { tex: 512, scale: 1, pieces: [
    'building_windmill_blue', 'building_well_blue', 'building_grain', 'building_watermill_blue', 'building_market_blue', 'building_blacksmith_blue',
    'fence_wood_straight', 'fence_wood_straight_gate', 'tent', 'sack', 'resource_lumber', 'resource_stone', 'barrel', 'bucket_water', 'target', 'ladder',
    'waterlily_A', 'waterlily_B', 'waterplant_A', 'flag_blue', 'projectile_catapult'] },
};
const K = KITS[KIT];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const doc = new Document(); doc.createBuffer();
const scene = doc.createScene('kit');
for (const p of K.pieces) {
  const src = await io.read(find(p + '.gltf'));
  const sk = Object.keys(K.simp || {}).find((k) => p.startsWith(k));
  if (sk) await src.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: K.simp[sk], error: 0.01 }));
  const before = new Set(doc.getRoot().listScenes());
  mergeDocuments(doc, src);
  for (const s of doc.getRoot().listScenes()) {
    if (s === scene || before.has(s)) continue;
    const kids = s.listChildren();
    const holder = doc.createNode(p);
    for (const n of kids) { s.removeChild(n); holder.addChild(n); }
    scene.addChild(holder); s.dispose();
  }
}
// keep a single buffer
const bufs = doc.getRoot().listBuffers(); for (const b of bufs.slice(1)) { for (const a of doc.getRoot().listAccessors()) if (a.getBuffer() === b) a.setBuffer(bufs[0]); b.dispose(); }
await doc.transform(dedup(), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [K.tex, K.tex], quality: 82 }), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
const out = path.join(OUT, 'kit_' + KIT + '.glb'); await io.write(out, doc);
let tris = 0; for (const m of doc.getRoot().listMeshes()) for (const pr of m.listPrimitives()) tris += (pr.getIndices() ? pr.getIndices().getCount() : pr.getAttribute('POSITION').getCount()) / 3;
console.log(KIT, (fs.statSync(out).size / 1024).toFixed(0) + ' KB', 'tris', tris, 'materials', doc.getRoot().listMaterials().map((m) => m.getName()).join(','), 'textures', doc.getRoot().listTextures().length);
