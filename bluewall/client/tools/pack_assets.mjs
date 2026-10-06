// Packs the chosen CC0 models into small web-ready .glb files:
//   webp textures (<= 1024 px), meshopt geometry compression, optional
//   simplification, animation pruning. Output: bluewall/web/assets/
//
//   node tools/pack_assets.mjs <assets-repo-dir>
import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, resample, textureCompress, meshopt, simplify, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const SRC = process.argv[2];
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../web/assets');
fs.mkdirSync(OUT, { recursive: true });
const find = (name) => {
  const hits = [];
  const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name === name) hits.push(p); } };
  walk(SRC);
  if (!hits.length) throw new Error('missing ' + name);
  return hits.sort()[0];
};

// out name -> [source file, options]
const NATURE = { tex: 512 };
const TREE = { tex: 512, simplify: 0.45, err: 0.012 };
const JOBS = {
  pine1: ['Pine_1.gltf', TREE], pine2: ['Pine_2.gltf', TREE], pine3: ['Pine_3.gltf', TREE], pine4: ['Pine_4.gltf', TREE], pine5: ['Pine_5.gltf', NATURE],
  tree1: ['CommonTree_1.gltf', TREE], tree2: ['CommonTree_2.gltf', TREE], tree3: ['CommonTree_3.gltf', TREE], tree4: ['CommonTree_4.gltf', TREE], tree5: ['CommonTree_5.gltf', TREE],
  twisted1: ['TwistedTree_1.gltf', TREE],
  bush: ['Bush_Common.gltf', NATURE], bushf: ['Bush_Common_Flowers.gltf', NATURE],
  grass: ['Grass_Common_Short.gltf', NATURE], grasst: ['Grass_Common_Tall.gltf', NATURE], grassw: ['Grass_Wispy_Short.gltf', NATURE],
  flower3: ['Flower_3_Group.gltf', NATURE], flower4: ['Flower_4_Group.gltf', NATURE], fern: ['Fern_1.gltf', NATURE], clover: ['Clover_1.gltf', NATURE],
  mushroom: ['Mushroom_Common.gltf', NATURE], plant: ['Plant_1.gltf', NATURE],
  rock1: ['Rock_Medium_1.gltf', NATURE], rock2: ['Rock_Medium_2.gltf', NATURE], rock3: ['Rock_Medium_3.gltf', NATURE],
  pebble1: ['Pebble_Round_1.gltf', NATURE], pebble2: ['Pebble_Round_3.gltf', NATURE],
  // people (UAL rig) — simplified for phones
  ranger_m: ['Male_Ranger.gltf', { tex: 512, simplify: 0.3, err: 0.01 }],
  ranger_f: ['Female_Ranger.gltf', { tex: 512, simplify: 0.3, err: 0.01 }],
  peasant_m: ['Male_Peasant.gltf', { tex: 512, simplify: 0.5, err: 0.01 }],
  peasant_f: ['Female_Peasant.gltf', { tex: 512, simplify: 0.5, err: 0.01 }],
  puglin: ['Puglin.glb', { tex: 1024, simplify: 0.8 }],
  imp: ['Imp.glb', { tex: 512, simplify: 0.4 }],
  anims: ['UAL1_Standard.glb', { anims: ['Idle_Loop', 'Walk_Loop', 'Jog_Fwd_Loop', 'Sword_Idle', 'Sword_Attack', 'Idle_Torch_Loop',
    'Spell_Simple_Idle_Loop', 'Death01', 'Hit_Chest', 'Punch_Cross', 'Interact', 'Fixing_Kneeling', 'Idle_Talking_Loop', 'Sitting_Idle_Loop', 'Crouch_Idle_Loop'] }],
  // props / weapons
  sword: ['Sword_Bronze.gltf', { tex: 256 }], axe: ['Axe_Bronze.gltf', { tex: 256 }], shield: ['Shield_Wooden.gltf', { tex: 256 }],
  bow: ['bow_withString.gltf', { tex: 256 }], torch: ['Torch_Metal.gltf', { tex: 256 }],
  barrel: ['Barrel.gltf', { tex: 512 }], crate: ['Crate_Wooden.gltf', { tex: 512 }], anvil: ['Anvil.gltf', { tex: 256 }],
  weaponstand: ['WeaponStand.gltf', { tex: 512 }], dummy: ['Dummy.gltf', { tex: 512 }], cauldron: ['Cauldron.gltf', { tex: 256 }],
  stall: ['Stall_Empty.gltf', { tex: 512 }], cart: ['Stall_Cart_Empty.gltf', { tex: 512 }], banner: ['Banner_1.gltf', { tex: 512 }],
  wagon: ['Prop_Wagon.gltf', { tex: 512 }], chest: ['Chest_Wood.gltf', { tex: 256 }], coins: ['Coin_Pile.gltf', { tex: 256 }],
};

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const report = [];
for (const [name, [file, o]] of Object.entries(JOBS)) {
  const src = find(file);
  const doc = await io.read(src);
  const root = doc.getRoot();
  if (o.anims) {
    for (const a of root.listAnimations()) if (!o.anims.includes(a.getName())) a.dispose();
    for (const m of root.listMeshes()) m.dispose();
    for (const n of root.listNodes()) if (n.getSkin()) n.setSkin(null);
  }
  const steps = [dedup(), prune()];
  if (o.anims) steps.push(resample());
  if (o.simplify) steps.push(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: o.simplify, error: o.err || 0.002 }));
  steps.push(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [o.tex || 1024, o.tex || 1024], quality: 82 }));
  steps.push(prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await doc.transform(...steps);
  const out = path.join(OUT, name + '.glb');
  await io.write(out, doc);
  report.push(`${name.padEnd(12)} ${(fs.statSync(out).size / 1024).toFixed(0).padStart(6)} KB  <- ${file}`);
}

// loose PBR textures for the procedural fort (Quaternius village kit)
const TEX = path.join(OUT, 'tex'); fs.mkdirSync(TEX, { recursive: true });
const vk = path.dirname(find('T_UnevenBrick_BaseColor.png'));
const pick = (f, dir = vk) => path.join(dir, f);
const TEXJOBS = [];
for (const set of ['UnevenBrick', 'Brick', 'RockTrim', 'Plaster', 'RoundTiles', 'WoodTrim', 'RedBrick']) {
  for (const kind of ['BaseColor', 'Normal', 'Roughness', 'ORM']) {
    let f = `T_${set}_${kind}.png`;
    let src = kind === 'Normal' ? path.join(vk, 'Normals Godot-Unity', f) : pick(f);
    if (!fs.existsSync(src)) continue;
    TEXJOBS.push([src, path.join(TEX, `${set}_${kind}.webp`)]);
  }
}
for (const [s, d] of TEXJOBS) await sharp(s).resize(1024, 1024, { fit: 'inside' }).webp({ quality: 82 }).toFile(d);
let total = 0; for (const f of fs.readdirSync(OUT)) if (f.endsWith('.glb')) total += fs.statSync(path.join(OUT, f)).size;
let ttex = 0; for (const f of fs.readdirSync(TEX)) ttex += fs.statSync(path.join(TEX, f)).size;
console.log(report.join('\n'));
console.log(`models ${(total / 1e6).toFixed(2)} MB, fort textures ${(ttex / 1e6).toFixed(2)} MB (${TEXJOBS.length} files)`);
