// b2_recipe.mjs — the B2 house kit recipe: four house families composed from REAL kit modules (Quaternius Medieval Village MegaKit + Fantasy Props MegaKit, Kay Lousberg KayKit
// Medieval Hexagon, Kenney Castle Kit — all CC0), baked by dev/b2_mkkit.mjs into web/assets/kit_homes.glb (one flat vertex-colour material, no textures).
// Piece space: x right, z toward the street (the front), y up, the footprint centre at the origin, the ground at y = 0.
import { rng } from '../bot/bluebot_v2/bluewall/client/src/noise.js';
const R = '/home/claude/blu-rez/bluewall-assets/';
export const sources = {
  mv: R + 'medieval-village-megakit/Medieval Village MegaKit[Standard]/glTF/%.gltf',
  fp: R + 'fantasy-props-megakit/Exports/glTF/%.gltf',
  kk: R + 'kaykit-medieval-hexagon/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/%.gltf',
  kkp: R + 'kaykit-medieval-hexagon/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/props/%.gltf',
  kn: R + 'v2/kenney-castle-kit/Models/GLB format/%.glb',
};
// heavy source pieces are thinned one by one before they are composed (sloppy = vertex clustering: fine for roofs / ornaments, they are bumpy anyway)
const LIM = [
  // roofs and gable fronts (the tile courses are bumps: vertex clustering flattens them into one clean sheet)
  [/^Roof_RoundTiles_/, { tris: 40 }], [/^Roof_Tower_RoundTiles/, { tris: 44 }], [/^Roof_(RoundTile_2x1|2x4_RoundTile|Dormer_RoundTile)/, { tris: 60 }], [/^Roof_Front_Brick/, { tris: 0, mat: { MI_WoodTrim: 48 }, comp: true }],
  // walls: a slab with a plinth (thin plates thin down fine with the normal simplifier); the cut-out walls keep their hole + a glass pane behind it
  [/^Wall_(Plaster|UnevenBrick)_(Straight|Straight_Base|Straight_L|Straight_R)$/, { tris: 0, mat: { MI_WoodTrim: { n: 14, comp: true } } }], [/^Wall_.*(Window|Door)/, { tris: 36, sloppy: false, err: 0.08 }], [/^Wall_Plaster_WoodGrid/, { tris: 0, mat: { MI_WoodTrim: 26 }, comp: true }],
  [/^Wall_Arch/, { tris: 36 }], [/^Corner_Exterior(Wide)?_Brick/, { tris: 12 }],
  [/^DoorFrame_/, { tris: 28, err: 0.5 }], [/^Door_/, { tris: 24, err: 0.5 }], [/^Window_(Wide|Thin)_(Round|Flat)1/, { tris: 24, err: 0.6 }], [/^WindowShutters/, { tris: 16, err: 0.6 }],
  [/^Balcony_Simple/, { tris: 44 }], [/^Prop_Chimney/, { tris: 36, err: 0.15 }], [/^Overhang_/, { tris: 80 }], [/^Prop_Wagon/, { tris: 120 }], [/^Prop_MetalFence/, { tris: 80 }], [/^Prop_Vine/, { tris: 30 }],
  [/^(wall|wall-pillar|wall-half|wall-narrow)$/, { tris: 30 }], [/^tower-/, { tris: 56 }],
  // Fantasy Props / KayKit props: a few dozen triangles each (they are tiny on screen)
  [/^(Barrel|Barrel_Holder|Barrel_Apples)$/, { tris: 40 }], [/^Crate_(Wooden|Metal)$/, { tris: 28 }], [/^(Bag|Pouch_Large)$/, { tris: 36 }], [/^Bucket_/, { tris: 30 }], [/^Anvil/, { tris: 44 }], [/^Workbench$/, { tris: 60 }], [/^Banner_/, { tris: 50 }],
  [/^Lantern_Wall/, { tris: 40 }], [/^Torch_Metal/, { tris: 40 }], [/^Whetstone/, { tris: 50 }], [/^Shield_Wooden/, { tris: 40 }], [/^Stall_(Cart_)?Empty/, { tris: 90 }], [/^Chest_Wood/, { tris: 40 }], [/^Coin_Pile/, { tris: 30 }], [/^(Axe_Bronze|Pickaxe_Bronze|Sword_Bronze)/, { tris: 24 }],
  [/^(barrel)$/, { tris: 64 }], [/^sack$/, { tris: 40 }], [/^crate_(A|B)_(small|big)$/, { tris: 14 }], [/^resource_lumber$/, { tris: 70 }], [/^resource_stone$/, { tris: 50 }], [/^wheelbarrow$/, { tris: 90 }], [/^bucket_water$/, { tris: 30 }], [/^(weaponrack|flag_blue)$/, { tris: 60 }], [/^Prop_WoodenFence/, { tris: 40 }],
  [/^Rope_/, { tris: 30 }], [/^Peg_Rack/, { tris: 30 }], [/^Cauldron/, { tris: 50 }], [/^(Chain_Coil|Cage_Small|WeaponStand|Dummy|Table_Large|Bench)$/, { tris: 60 }], [/^FarmCrate_/, { tris: 40 }],
];
export function partLimit(file) { for (const [re, l] of LIM) if (re.test(file)) return l; return null; }

// ------------------------------------------------------------------ the shell generator
// A house = per storey four LONG wall slabs (one piece per side, stretched along its length: plain plaster / brick takes a stretch) + window / door pieces ON the walls (a window piece
// is a few triangles: frame + glass) + corner posts.  That is what keeps a house at a few hundred triangles; the kit modules are 2 m / 3 m (the same grid as village.js houseRecipe).
// o: { nx, nz, floors, lower: 'brick'|'plaster', upper: 'plaster'|'grid'|'brick', door: module index on the front, seed, win: window chance, shut: shutter chance (front only), posts: 'all'|'ground'|'none',
//      jet: the upper floors lean out over the street by this much (m), dx, dz: shift of the whole body, shop: [module indexes of the front ground floor with a shop window instead of a wall] }
export function shell(o) {
  const r = rng(o.seed || 1), P = [], { nx, nz } = o, W = nx * 2, D = nz * 2, floors = o.floors || 1, win = o.win ?? 0.5, shut = o.shut ?? 0.5, J = o.jet || 0, posts = o.posts || 'all';
  const sn = (a) => Math.sin(a * Math.PI / 180), cs = (a) => Math.cos(a * Math.PI / 180);
  const add = (name, x, y, z, ry = 0, sl = 1, lim) => P.push(sl === 1 && !lim ? ['mv', name, x, y, z, ry, 1] : ['mv', name, x, y, z, ry, sl, 1, 1, lim]);          // sl: stretch along the piece's own length
  const out = (ry, d) => [d * sn(ry), d * cs(ry)];                                                      // the wall's outward normal x d
  const decal = (name, x, y, z, ry, d = 0.26, lim) => { const [ox, oz] = out(ry, d); add(name, x + ox, y, z + oz, ry, 1, lim); };
  for (let f = 0; f < floors; f++) {
    const y = f * 3, kind = f === 0 ? o.lower || 'plaster' : o.upper || 'plaster', brick = kind === 'brick', up = f > 0 && J > 0;
    const jz = up ? J : 0;
    const sides = [                                                                                      // centre, length, rotation, how many modules
      { k: 'front', cx: 0, cz: D / 2 + jz, L: W, ry: 0 }, { k: 'back', cx: 0, cz: -D / 2, L: W, ry: 180 },
      { k: 'right', cx: W / 2, cz: jz / 2, L: D + jz, ry: 90 }, { k: 'left', cx: -W / 2, cz: jz / 2, L: D + jz, ry: -90 },
    ];
    for (const s of sides) {
      const m = Math.round(s.L / 2), t0 = -s.L / 2 + s.L / m / 2, st = s.L / m, ux = cs(s.ry), uz = -sn(s.ry);        // the wall's own x axis in the world
      const gridFront = s.k === 'front' && kind === 'grid' && f > 0;
      add(brick ? 'Wall_UnevenBrick_Straight' : f === 0 ? 'Wall_Plaster_Straight_Base' : 'Wall_Plaster_Straight', s.cx, y, s.cz, s.ry, s.L / 2);
      for (let i = 0; i < m; i++) {
        const t = t0 + st * i, x = s.cx + ux * t, z = s.cz + uz * t;
        if (gridFront) { decal('Wall_Plaster_WoodGrid', x, y, z, s.ry, 0.03); continue; }                    // the timber grid lies over a plain plaster slab (the biggest beams only)
        if (s.k === 'front' && f === 0 && i === (o.door ?? Math.floor((m - 1) / 2))) { decal(brick ? 'DoorFrame_Round_Brick' : 'DoorFrame_Round_WoodDark', x, y, z, s.ry, 0.2); decal('Door_1_Round', x, y, z, s.ry, 0.2); continue; }
        if (s.k === 'front' && f === 0 && o.shop && o.shop.includes(i)) { decal('Window_Wide_Flat1', x, y, z, s.ry); continue; }
        if (s.k === 'back' && r() < 0.6) { r(); continue; }
        if (r() < win) {
          const wide = r() < 0.55;
          decal(wide ? 'Window_Wide_Round1' : 'Window_Thin_Round1', x, y, z, s.ry);
          if (s.k === 'front' && r() < shut) add(wide ? 'WindowShutters_Wide_Round_Open' : 'WindowShutters_Thin_Round_Open', x, y, z, s.ry);
        }
      }
    }
    if (posts === 'all' || (posts === 'ground' && f === 0)) { const cn = brick ? 'Corner_Exterior_Brick' : 'Corner_Exterior_Wood'; add(cn, W / 2, y, D / 2 + jz, 0); add(cn, W / 2, y, -D / 2, 90); add(cn, -W / 2, y, -D / 2, 180); add(cn, -W / 2, y, D / 2 + jz, -90); }
  }
  return o.dz || o.dx ? P.map((p) => [p[0], p[1], p[2] + (o.dx || 0), p[3], p[4] + (o.dz || 0), ...p.slice(5)]) : P;
}
// the gable roof over a W x D body from the matching tiled roof piece (the street gable is a finer piece than the back one). ridge 'z' = gable ends toward the street / the back
const GF = { tris: 0, mat: { MI_WoodTrim: 48 }, comp: true }, GB = { tris: 0, mat: { MI_WoodTrim: 0 } };            // the street gable keeps a thinned timber truss, the back gable is a plain plaster triangle
export function tileRoof(nx, nz, top, o = {}) {
  const W = nx * 2, D = nz * 2, P = [], dx = o.dx || 0, dz = o.dz || 0, up = o.up || 0;
  P.push(['mv', `Roof_RoundTiles_${W}x${D}`, dx, top + up, dz, 0, 1]);
  const g = { 2: 'Roof_Front_Brick4', 3: 'Roof_Front_Brick6', 4: 'Roof_Front_Brick8' }[nx];
  if (g) { P.push(['mv', g, dx, top + up, D / 2 + dz, 0, 1, 1, 1, o.gf || GF]); P.push(['mv', g, dx, top + up, -D / 2 + dz, 180, 1, 1, 1, o.gb || GB]); }
  return P;
}
const pt = (src, name, x, y, z, ry = 0, s = 1, sy = s, sz = s, lim) => [src, name, x, y, z, ry, s, sy, sz, lim];
// ------------------------------------------------------------------ colours (the kit has no textures: a flat colour per source material, with a faint per-vertex noise)
const pal = (wall, stone, wood, roof) => ({ 'MI_Plaster': wall, 'MI_UnevenBrick': stone, 'MI_Brick': stone, 'MI_RockTrim': stone, 'MI_RoundTiles': roof, 'MI_WoodTrim': wood, 'MI_Vine': '#3f7a3a' });
export const items = [];
const add2 = (name, parts, extra = {}) => items.push({ name, parts, keep: true, ...extra });
// body = the walls (+ towers, forecourt); two roofs (the same roof geometry, two colours); the chimneys are loose pieces (b2_homes.js puts them left / right by the seed)
function family(kind, stages) {
  stages.forEach((S, st) => {
    const nm = kind + '_' + st;
    add2(nm, S.shell, { tris: S.tris, flat: S.pal(S.roofs[0]), grade: S.grade });
    S.roofs.forEach((rc, v) => add2(nm + '_r' + 'ab'[v], S.roof, { flat: S.pal(rc), grade: S.grade }));
  });
}
// ---- cottage (peasants: small, one storey, a steep straw roof -> brown -> blue slate)
family('cottage', [0, 1, 2].map((st) => {
  const nx = st === 2 ? 3 : 2, nz = 3;
  const W = [pal('#eadfc2', '#9a9488', '#6a4a2e'), pal('#efe6d2', '#8d8a82', '#5a3e2a'), pal('#f3efe6', '#7f8aa0', '#3a2a1e')][st];
  const roofs = [['#c9a65e', '#b08a4e'], ['#8a5a3c', '#a4573a'], ['#4f5f86', '#3f4f78']][st];
  return { shell: shell({ nx, nz, floors: 1, lower: st === 0 ? 'plaster' : 'brick', seed: 20 + st, win: 0.55, shut: 0, posts: 'none' }), roof: tileRoof(nx, nz, 3), roofs, pal: (rc) => ({ ...W, MI_RoundTiles: rc, MI_Plaster: W.MI_Plaster }), tris: 520 };
}));
// ---- craftsman (workshop below, family above: two storeys, the upper floor leaning out over the street, a timber grid on the front)
family('craftsman', [0, 1, 2].map((st) => {
  const W = [pal('#f1e9d6', '#9a9488', '#4a321e'), pal('#ece6da', '#8d8a82', '#3a2a1e'), pal('#f4f1ea', '#7f8aa0', '#2a3f66')][st];
  const roofs = [['#b9573b', '#9c4630'], ['#4f5f86', '#44547a'], ['#3a62ad', '#2f5598']][st];
  return { shell: shell({ nx: 3, nz: 3, floors: 2, lower: 'plaster', upper: 'grid', seed: 30 + st, jet: 0.9, shop: [0, 1], door: 2, win: 0.5, shut: 0, posts: 'ground' }), roof: tileRoof(3, 3, 6, { dz: 0.45 }), roofs, pal: (rc) => ({ ...W, MI_RoundTiles: rc }), tris: 800 };
}));
// ---- merchant (tall, narrow, the gable to the street: three storeys, a shop window below, a balcony above; light-blue plaster)
family('merchant', [0, 1, 2].map((st) => {
  const W = [pal('#a9cdee', '#6f7a90', '#e9eef7'), pal('#98c0e8', '#6f7a90', '#f2f6ff'), pal('#b9d9f4', '#7f8aa0', '#f2f6ff')][st];
  const roofs = [['#2a3f6e', '#34507f'], ['#22345f', '#2b4276'], ['#3a62ad', '#2f5598']][st];
  const sh = shell({ nx: 2, nz: 3, floors: 3, lower: 'brick', upper: 'plaster', seed: 40 + st, win: 0.62, shut: 0, shop: [1], door: 0, posts: 'ground' });
  sh.push(pt('mv', 'Balcony_Simple_Straight', 0, 3.0, 3.1));
  return { shell: sh, roof: tileRoof(2, 3, 9), roofs, pal: (rc) => ({ ...W, MI_RoundTiles: rc }), tris: 900 };
}));
// ---- noble (stone, one or two blue-spired towers, a walled forecourt)
const NZ = -2.6;
family('noble', [0, 1, 2].map((st) => {
  const nx = 3, nz = 3, W = nx * 2, D = nz * 2, dz = NZ;
  const Wp = [pal('#cfd6e4', '#8a93a8', '#2a3f66'), pal('#d5dcea', '#8a93a8', '#2a3f66'), pal('#e3e9f4', '#98a2b8', '#1f2f55')][st];
  const roofs = [['#34507f', '#2a3f6e'], ['#22345f', '#2b4276'], ['#3a62ad', '#2c4f95']][st];
  const P = shell({ nx, nz, floors: 2, lower: 'brick', upper: 'brick', seed: 50 + st, win: 0.5, shut: 0, door: 1, dz, posts: 'ground' });
  const tower = (tx, tz) => { P.push(pt('kn', 'tower-square-base', tx, 0, tz, 0, 3)); P.push(pt('kn', 'tower-square-mid-windows', tx, 3.0, tz, 0, 3)); P.push(pt('kn', 'tower-square-mid-windows', tx, 6.0, tz, 0, 3)); P.push(pt('mv', 'Roof_Tower_RoundTiles', tx, 9.0, tz, 0, 0.56)); };
  if (st >= 1) tower(-W / 2 - 0.2, D / 2 + dz + 0.3);                                                // the corner towers stand out of the front corners, taller than the roof ridge
  if (st >= 2) tower(W / 2 + 0.2, D / 2 + dz + 0.3);
  const wz = D / 2 + dz + 4.2, X = 5.4;                                                                   // the forecourt: a low stone wall with a gate gap and gate pillars
  for (const sx of [-1, 1]) { P.push(pt('mv', 'Wall_UnevenBrick_Straight', sx * (X + 1.1) / 2, 0, wz, 0, (X - 1.1) / 2, 0.38, 1.4)); P.push(pt('mv', 'Wall_UnevenBrick_Straight', sx * X, 0, (wz + D / 2 + dz) / 2, 90, (wz - D / 2 - dz) / 2, 0.38, 1.4)); P.push(pt('mv', 'Wall_UnevenBrick_Straight', sx * 1.1, 0, wz, 0, 0.28, 0.62, 2)); }
  return { shell: P, roof: tileRoof(nx, nz, 6, { dz }), roofs, pal: (rc) => ({ ...Wp, MI_RoundTiles: rc, colormap: '#8f9ab4' }), tris: 1300 };
}));
// ---- loose pieces: chimneys, props.  (bottom-centre at the origin, metres; `h` / `w` size them. Textured sources are sampled into vertex colours.)
const KG = { grade: { '': [0.55, 0.7, 0.85] } };                                             // the KayKit atlas is a saturated orange: calmed a little so the props sit with the blue town
const loose = (name, key, file, size, extra = {}) => items.push({ name, parts: [[key, file, 0, 0, 0, 0, 1]], ...size, ...extra });
// the piece API has no height: a chimney piece carries its roof height (n storeys: base at 2.8 / 5.8 / 8.8 m); b2_homes.js stacks two of them for a tall cottage stack
for (let n = 1; n <= 3; n++) {
  items.push({ name: 'chim_a_' + n, parts: [['mv', 'Prop_Chimney2', 0, 2.8 + 3 * (n - 1), 0, 0, 1]], keep: true, flat: pal('#e3e9f4', '#8d8a82', '#6a4a2e', '#3a62ad') });
  items.push({ name: 'chim_b_' + n, parts: [['mv', 'Prop_Chimney', 0, 2.8 + 3 * (n - 1), 0, 0, 1, 1, 1, { tris: 48, err: 0.25 }]], keep: true, flat: pal('#e3e9f4', '#7f8aa0', '#6a4a2e', '#3a62ad') });
}
loose('p_barrel', 'kkp', 'barrel', { h: 0.95 }, KG);
loose('p_sack', 'kkp', 'sack', { w: 0.8 }, KG);
loose('p_wood', 'kkp', 'resource_lumber', { w: 1.7 }, KG);
loose('p_stone', 'kkp', 'resource_stone', { w: 1.1 });
loose('p_barrow', 'kkp', 'wheelbarrow', { w: 1.5 }, KG);
loose('p_bucket', 'kkp', 'bucket_water', { h: 0.55 }, KG);
loose('p_flag', 'kkp', 'flag_blue', { h: 2.6 }, KG);
loose('p_rack', 'kkp', 'weaponrack', { h: 1.6 }, KG);
loose('p_anvil', 'fp', 'Anvil', { w: 1.2 }, { partLimit: () => ({ tris: 44, err: 0.3 }) });
loose('p_bench', 'fp', 'Workbench', { w: 2.2 }, { partLimit: () => ({ tris: 70, err: 0.3 }) });
loose('p_stall', 'fp', 'Stall_Empty', { w: 2.4 }, { partLimit: () => ({ tris: 0, mat: { MI_Trim_Metal: 0, MI_Trim_Furniture: { n: 90, comp: true }, MI_Banner: 56 }, err: 0.3 }) });      // counter + posts + the canopy cloth (the iron brace is dropped)
loose('p_wagon', 'mv', 'Prop_Wagon', { d: 3.6 }, { partLimit: () => ({ tris: 110, err: 0.3 }) });
loose('p_fence', 'mv', 'Prop_WoodenFence_Single', { s: 1 });
loose('p_torch', 'fp', 'Torch_Metal', { h: 1.0 }, { partLimit: () => ({ tris: 36, err: 0.3 }) });
// a hanging shop sign: the wall bracket + the blue cloth (Fantasy Props Banner_2); the origin is the wall point (the cloth faces the street, the bracket points to +x)
items.push({ name: 'p_sign', parts: [['fp', 'Banner_2', 0, 2.4, 0, 0, 0.8]], keep: true, partLimit: () => ({ tris: 0, mat: { MI_Trim_Metal: 0, MI_Trim_Furniture: { n: 36, comp: true }, MI_Banner: 60 } }) });
items.push({ name: 'p_crates', parts: [['kkp', 'crate_A_big', 0, 0, 0, 0, 4.0], ['kkp', 'crate_A_big', 0.9, 0, 0.15, 25, 4.0], ['kkp', 'crate_A_small', 0.4, 0.84, 0.05, 10, 4.2]], ...KG });
export default { sources, items, partLimit };
