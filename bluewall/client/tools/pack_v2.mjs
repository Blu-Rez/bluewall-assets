// Pack the v2/v3 models (Sketchfab, Quaternius, Poly Haven scans, EZ-Tree bakes) into web-ready GLBs.
//   node tools/pack_v2.mjs [only-name ...]
import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, resample, textureCompress, meshopt, simplify, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

const R = '/home/claude/blu-rez/bluewall-assets/v2', SF = R + '/sketchfab', PH = R + '/polyhaven/models', TB = '/home/claude/treebake';
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../web/assets');
const find = (dir, re) => { const hits = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (re.test(f.name)) hits.push(p); } }; walk(dir); return hits.sort()[0]; };
const ANIMAL = ['Walk', 'Gallop', 'Eating', 'Idle', 'Idle_2', 'Idle_Headlow', 'Idle_2_HeadLow', 'Attack', 'Attack_Kick'];
const JOBS = {
  // trees (EZ-Tree bakes)
  ez_pine_a: [TB + '/pine_a.glb', { tex: 512, simplify: 0.7, err: 0.01 }], ez_pine_b: [TB + '/pine_b.glb', { tex: 512, simplify: 0.7, err: 0.01 }], ez_pine_c: [TB + '/pine_c.glb', { tex: 512, simplify: 0.7, err: 0.01 }],
  ez_oak_a: [TB + '/oak_a.glb', { tex: 512, simplify: 0.6, err: 0.01 }], ez_oak_b: [TB + '/oak_b.glb', { tex: 512, simplify: 0.5, err: 0.01 }], ez_ash_a: [TB + '/ash_a.glb', { tex: 512, simplify: 0.6, err: 0.01 }],
  ez_aspen_a: [TB + '/aspen_a.glb', { tex: 512 }], ez_bush_a: [TB + '/bush_a.glb', { tex: 512 }], ez_bush_b: [TB + '/bush_b.glb', { tex: 512, simplify: 0.4, err: 0.01 }],
  // creatures
  dragon: [SF + '/dragon_flying/dragon_flying.glb', { tex: 512 }],
  prowler: [SF + '/dragon_prowler/dragon_prowler.glb', { tex: 1024, anims: ['Landing', 'Walk'] }],
  troll: [SF + '/troll/troll.glb', { tex: 512, anims: ['idle', 'idle_break', 'walk', 'attack1', 'attack2'] }],
  ogre: [SF + '/ogre/ogre.glb', { tex: 512, simplify: 0.55, err: 0.004, anims: ['Armature|Ideal', 'Armature|Ideal3', 'Armature|Roar2', 'Armature|Slam', 'Armature|Walk', 'Armature|Punch'] }],
  cyclops: [SF + '/cyclops/cyclops.glb', { tex: 512, simplify: 0.6, err: 0.004 }],
  treant: [SF + '/treant/treant.glb', { tex: 512, anims: ['Armature|Idle01', 'Armature|Idle02', 'Armature|Walk', 'Armature|Attack01'] }],
  werewolf: [SF + '/werewolf/werewolf.glb', { tex: 512 }],
  gryphon: [SF + '/gryphon/gryphon.glb', { tex: 512 }],
  crow: [SF + '/crow/crow.glb', { tex: 256 }],
  eagle: [SF + '/eagle/eagle.glb', { tex: 512 }],
  horse: [R + '/polypizza/horse.glb', { anims: ANIMAL }], horse_white: [R + '/polypizza/horse_white.glb', { anims: ANIMAL }],
  cow: [R + '/polypizza/cow.glb', { anims: ANIMAL }], wolf: [R + '/polypizza/wolf.glb', { anims: ANIMAL }],
  horse_saddle: [SF + '/horse_saddle/horse_saddle.glb', { tex: 512 }],
  horseman: [SF + '/horseman/horseman.glb', { tex: 512 }],
  // buildings / siege / farm
  windmill2: [SF + '/windmill_stylized/windmill_stylized.glb', { tex: 512 }],
  watermill: [SF + '/watermill/watermill.glb', { tex: 512 }],
  blacksmith: [SF + '/blacksmith/blacksmith.glb', { tex: 512, simplify: 0.6, err: 0.003 }],
  watchtower: [SF + '/watchtower_house/watchtower_house.glb', { tex: 512 }],
  haybale: [SF + '/hay_bale/hay_bale.glb', { tex: 512, simplify: 0.4, err: 0.01 }],
  tent_general: [SF + '/general_tent/general_tent.glb', { tex: 512 }],
  trebuchet: [SF + '/trebuchet_anim/trebuchet_anim.glb', { tex: 512 }],
  catapult: [SF + '/catapult_stylized/catapult_stylized.glb', { tex: 512, simplify: 0.5, err: 0.004 }],
  cannon: [SF + '/cannon_stylized/cannon_stylized.glb', { tex: 512, simplify: 0.5, err: 0.004 }],
  ballista: [SF + '/ballista/ballista.glb', { tex: 512 }], mangonel: [SF + '/mangonel/mangonel.glb', { tex: 512 }],
  ram: [SF + '/ram/ram.glb', { tex: 512 }], siege_tower: [SF + '/siege_tower/siege_tower.glb', { tex: 512 }],
  barn: [find(R + '/farm-buildings', /^BigBarn\.glb$/), {}], silo: [find(R + '/farm-buildings', /^Silo\.glb$/), {}],
  coop: [find(R + '/farm-buildings', /^ChickenCoop\.glb$/), {}], openbarn: [find(R + '/farm-buildings', /^OpenBarn\.glb$/), {}],
  pumpkin: [find(R + '/ultimate-crops', /^Pumpkin_4\.glb$/), {}], corn: [find(R + '/ultimate-crops', /^Corn_4\.glb$/), {}],
  cabbage: [find(R + '/ultimate-crops', /^Lettuce_4\.glb$/), {}], carrot: [find(R + '/ultimate-crops', /^Carrot_4\.glb$/), {}],
  // photo-scanned rocks & cliffs (Poly Haven)
  rockset1: [PH + '/rock_moss_set_01/rock_moss_set_01.gltf', { tex: 1024, simplify: 0.05, err: 0.05 }],
  rockset2: [PH + '/rock_moss_set_02/rock_moss_set_02.gltf', { tex: 1024, simplify: 0.05, err: 0.05 }],
  cliff1: [PH + '/namaqualand_cliff_01/namaqualand_cliff_01.gltf', { tex: 1024, simplify: 0.035, err: 0.05 }],
  cliff2: [PH + '/coastal_cliff_04/coastal_cliff_04.gltf', { tex: 1024, simplify: 0.004, err: 0.08 }],
};
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
await MeshoptEncoder.ready; await MeshoptSimplifier.ready; await MeshoptDecoder.ready;
const only = process.argv.slice(2);
for (const [name, [file, o]] of Object.entries(JOBS)) {
  if (only.length && !only.includes(name)) continue;
  if (!file || !fs.existsSync(file)) { console.log('MISSING', name, file); continue; }
  try {
    const doc = await io.read(file);
    const root = doc.getRoot();
    if (o.anims) for (const a of root.listAnimations()) if (!o.anims.includes(a.getName())) a.dispose();
    const steps = [dedup(), prune()];
    if (root.listAnimations().length) steps.push(resample());
    if (o.simplify) steps.push(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: o.simplify, error: o.err || 0.002 }));
    steps.push(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [o.tex || 1024, o.tex || 1024], quality: 80 }));
    steps.push(prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
    await doc.transform(...steps);
    let tris = 0; for (const m of root.listMeshes()) for (const p of m.listPrimitives()) tris += (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
    const out = path.join(OUT, name + '.glb'); await io.write(out, doc);
    console.log(name.padEnd(13), (fs.statSync(out).size / 1024).toFixed(0).padStart(6), 'KB', String(Math.round(tris)).padStart(7), 'tris', root.listAnimations().map((a) => a.getName()).join(',').slice(0, 90));
  } catch (e) { console.log('FAIL', name, e.message.slice(0, 120)); }
}
