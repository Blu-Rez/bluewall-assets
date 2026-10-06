// The three gem mines (ruby, emerald, turquoise) at the foot of the mountains — one proper mining estate each:
//   a stone gateway cut into the rocky spur (scanned cliff rocks around it) with gem-coloured crystals growing out of its roof,
//   a floating giant cut gem + glow above it (the landmark), a keystone jewel, rails with a gem-loaded cart rolling in and out,
//   a cobbled yard, ore heaps glittering with cut gems, a loaded wagon, a miners' lodge in the gem's colour, lanterns,
//   and one big working machine per gem — ruby: headframe with a turning winch wheel; emerald: stamp mill with three
//   hammering stamps; turquoise: swinging loading crane.
// A floating gem badge shows what is ready to collect. Every static piece goes through the batcher / one baked gem mesh
// (draw calls per mine: crystals 1, giant gem 1, glow 1, cart load 1, machine ~3, cart ~3).
import * as THREE from 'three';
import * as L from './layout.js';
import { mat4, gableRoof, grayMap } from './util.js';
import { GEM_COL } from './gems.js';
import { gemGeometry, crystalGeometry, gemMaterial } from './gemgeo.js';
import { rng } from './noise.js';
import { ENT, applySkin, levelOf } from './skin.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rockGeometry, rockMaterial, rockPile, rockTint } from './sc_rocks.js';
import { seasonWeights } from './terrain.js';
import { season } from './tod.js';

// merge a group's plain mesh children (not marked keep) into one mesh per material
function freezeChildren(grp) {
  const by = new Map(), drop = [];
  for (const o of grp.children) {
    if (!o.isMesh || o.isInstancedMesh || o.userData.keep) continue;
    o.updateMatrix();
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()); g.applyMatrix4(o.matrix);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!by.has(o.material)) by.set(o.material, []); by.get(o.material).push(g); drop.push(o);
  }
  for (const o of drop) grp.remove(o);
  for (const [m, list] of by) { const geo = mergeGeometries(list, false); if (!geo) continue; const mesh = new THREE.Mesh(geo, m); mesh.castShadow = true; mesh.receiveShadow = true; grp.add(mesh); }
}

const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = (r1, r2, h, s = 10) => new THREE.CylinderGeometry(r1, r2, h, s);
const IDS = ['ruby', 'emerald', 'turq'];
const ROOFC = { ruby: 0xc2294a, emerald: 0x23a463, turq: 0x2f94d8 };
const WALLC = { ruby: 0xf1cdc4, emerald: 0xd2e8c8, turq: 0xcde4f4 };
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();

export function buildMines(ctx, A, Q, scene, anim) {
  const { B, M, height } = ctx, out = [];
  const gm = {}, glowMats = {}, bigGm = {};
  for (const id of IDS) {
    const c = GEM_COL[id];
    gm[id] = gemMaterial(id, { envMapIntensity: 1.2, glow: 0.3 });
    bigGm[id] = gemMaterial(id, { envMapIntensity: 1.4, glow: 0.45 });
    glowMats[id] = new THREE.SpriteMaterial({ map: M.glowWhite, color: c.glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 });
  }
  const wood = M.woodLight.clone(); wood.vertexColors = false; wood.color.set(0xe6c9a0);
  const metal = M.metal.clone(); metal.vertexColors = false; metal.color.set(0xaab6c8);
  // warm light stone + plaster for the mining estates (desaturated in the shader: the tint alone decides the colour; keeps them bright against the navy Blue Wall)
  const cob = grayMap(M.stoneLight.clone(), 2.3), plast = grayMap(M.plaster.clone(), 1.9);
  applySkin(cob, 5); applySkin(plast, 5); for (const id of IDS) applySkin(gm[id], 5);
  const bigs = [];
  // the rocky spur, the debris at its foot and the ore heaps: sc_rocks boulders (scanned moss-rock texture, crevice AO, ore veins glinting
  // in the gem's colour), baked into one static mesh per mine — replaces the stretched cliff scans that read as brown cardboard from above
  const RG = { crag: [rockGeometry(21, 3, 'crag'), rockGeometry(27, 3, 'crag')], boulder: [rockGeometry(23, 2, 'boulder'), rockGeometry(29, 2, 'slab')], stone: [rockGeometry(25, 1, 'stone'), rockGeometry(26, 1, 'boulder')] };
  const pileMat = rockMaterial(A.ph, { glint: true, merged: true, moss: 0.35, color: 0xf2f0ea, snow: Math.min(1, seasonWeights(season()).snow * 1.3) });
  anim.push((t) => { pileMat.userData.U.uGlintT.value = t; });

  for (const MN of L.MINES) {
    const id = MN.id, R = rng(Math.round(Math.abs(MN.a) * 7) + 99);
    const a = MN.a * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const W = (u, v) => [MN.x + u * ca - v * sa, MN.z + u * sa + v * ca];   // u: into the hill, v: sideways
    const face = Math.atan2(-ca, -sa);                                         // looking out of the tunnel toward the town
    const ry = Math.atan2(-sa, ca);                                            // box x axis along u
    const H = (u, v) => { const [x, z] = W(u, v); return height(x, z); };
    const y0 = H(-10, 0), py = y0;
    const box = (u, y, v, su, sy, sv, mat, o = {}) => { const [x, z] = W(u, v); B.add(BOX, mat, mat4(x, y, z, ry, su, sy, sv), o); };
    const stone = { worldUV: 0.1 };
    const ent = ENT['mine_' + id]; let gmin = 1;
    B.tag(ent, 1);
    { const [tx, tz] = W(-4, 0); ctx.tgt({ type: 'mine', gem: id, x: tx, z: tz, w: 24, d: 28, h: 18, rot: ry }); }

    // ---- the rocky spur around the gateway (big crags + boulders between them), debris at its foot
    const pile = [], gcol = new THREE.Color(GEM_COL[id].glow).multiplyScalar(1.3);
    const rock = (kind, u, v, sc, sy, ore, sink = 0.14) => {
      const [x, z] = W(u, v), base = H(u, v), list = RG[kind], geo = list[(R() * list.length) | 0];
      const m = new THREE.Matrix4().compose(new THREE.Vector3(x, base - sc * sink, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - 0.5) * 0.3, face + R() * 6.283, (R() - 0.5) * 0.3, 'XZY')),
        new THREE.Vector3(sc * (0.88 + R() * 0.24), sc * sy, sc * (0.88 + R() * 0.24)));
      pile.push({ geo, m, tint: rockTint(R, new THREE.Color()), glint: ore ? gcol : null, base });
    };
    for (const [u, v, sc, sy] of [[9, -13, 5.0, 1.0], [9, 13, 4.8, 0.95], [14, -7, 5.2, 1.15], [14, 8, 5.0, 1.1], [19, 0, 6.2, 1.2], [18, -15, 5.0, 0.95], [18, 15, 4.8, 1.0], [23, 7, 5.8, 1.1], [23, -8, 5.6, 1.15], [27, 0, 6.0, 1.0]]) rock('crag', u, v, sc, sy, R() < 0.7);
    for (const [u, v, sc] of [[11, -9.5, 3.0], [11, 9.5, 3.0], [16, -11, 3.2], [16, 11.5, 3.0], [21, -3.5, 3.6], [21, 3.5, 3.4], [7.5, -17, 2.6], [7.5, 17, 2.5], [13, -18, 2.8], [13, 18, 2.6]]) rock('boulder', u, v, sc, 0.9 + R() * 0.3, R() < 0.5, 0.2);
    for (let k = 0; k < 16; k++) { const e = k % 2 ? 1 : -1, u = 2.5 + R() * 6, v = e * (7.2 + R() * 7); rock('stone', u, v, 0.35 + R() * 0.75, 0.8 + R() * 0.4, R() < 0.4, 0.25); }   // fallen debris
    // timber shoring against the rock on both sides of the gateway, and a stack of pit props by the yard (batched with the rest of the mine)
    for (const e of [-1, 1]) {
      for (const [du, dv, len, lean] of [[0, 0, 6.2, 0.38], [1.4, 1.6, 5.2, 0.5]]) {
        const u = 5.6 + du, v = e * (7.4 + dv), [x, z] = W(u, v), y = H(u, v);
        B.add(BOX, M.woodLight, mat4(x, y + len * 0.45, z, ry, 0.42, len, 0.42, 0, -lean), { tint: 0xa98058 });
      }
      const [cx, cz] = W(6.4, e * 8.4); B.add(BOX, M.woodLight, mat4(cx, H(6.4, e * 8.4) + 4.6, cz, ry, 3.0, 0.38, 0.38), { tint: 0x9a7448 });
    }
    { const u0 = -27.5, v0 = -14.5, y = H(u0, v0);
      for (let row = 0; row < 3; row++) for (let k = 0; k < 4 - row; k++) { const [px, pz] = W(u0, v0 + (k - (3 - row) / 2) * 0.62); B.add(CYL(0.3, 0.3, 4.2, 7), M.woodLight, mat4(px, y + 0.3 + row * 0.53, pz, ry, 1, 1, 1, 0, Math.PI / 2), { tint: row % 2 ? 0xb08654 : 0xa07850 }); }
    }

    // ---- baked gems of this mine (crystal clusters + cut gems): one mesh
    const bake = [], CR = crystalGeometry(id), GC = gemGeometry(id);
    const put = (geo, x, y, z, rx, rry, rz, sx, sy = sx, sz = sx) => { const g = geo.clone(); g.applyMatrix4(_m4.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, rry, rz, 'YXZ')), _s.set(sx, sy, sz))); const n = g.attributes.position.count, tg = new Float32Array(n * 2); for (let i = 0; i < n; i++) { tg[i * 2] = ent; tg[i * 2 + 1] = gmin; } g.setAttribute('aTag', new THREE.BufferAttribute(tg, 2)); bake.push(g); };
    // n crystals of base radius w and height h around (u,v); yAbs lifts them onto a roof
    const cluster = (u, v, n, w, h, spread, yAbs) => {
      for (let k = 0; k < n; k++) {
        const ang = R() * 6.283, d = R() * spread, uu = u + Math.cos(ang) * d, vv = v + Math.sin(ang) * d, [x, z] = W(uu, vv);
        const tilt = 0.08 + R() * (k === 0 ? 0.12 : 0.5), dir = R() * 6.283, big = k === 0 ? 1.25 : 0.65 + R() * 0.55;
        put(CR, x, (yAbs ?? H(uu, vv)) - 0.5, z, Math.sin(dir) * tilt, R() * 6.283, Math.cos(dir) * tilt, w * (0.8 + R() * 0.4) * big, (h / 3.7) * big * (0.75 + R() * 0.5), w * (0.8 + R() * 0.4) * big);
      }
    };
    const cut = (u, v, yAbs, s) => { const [x, z] = W(u, v); put(GC, x, yAbs, z, (R() - 0.5) * 0.9, R() * 6.283, (R() - 0.5) * 0.9, s); };

    // ---- gateway: stone piers + deep lintel slab with crystals growing out of its roof, dark mouth, timber props
    // (pieces wear the mine's tier skin; `at(min, fn)` makes a group appear only once the mine reaches that level)
    const at = (min, fn) => { B.tag(ent, min); gmin = min; fn(); B.tag(ent, 1); gmin = 1; };
    box(7.6, py + 4.4, 0, 5.2, 8.8, 7.2, M.dark);
    for (const e of [-1, 1]) {
      box(5.0, py + 5.2, e * 4.9, 2.8, 10.4, 2.4, M.stone, { ...stone, tint: 0xe4e6ee });
      box(4.4, py + 0.6, e * 4.9, 3.6, 1.2, 3.2, M.stoneDark, { ...stone, tint: 0xe0e2ea });             // plinth
      box(4.6, py + 10.7, e * 4.9, 3.2, 0.6, 2.8, M.stoneDark, { ...stone, tint: 0xf0f0f6 });
    }
    box(8.2, py + 11.9, 0, 11.0, 2.6, 13.0, M.stone, { ...stone, tint: 0xeceef4 });                        // lintel slab (deep)
    box(8.2, py + 13.4, 0, 11.6, 0.5, 13.6, M.stoneDark, { ...stone, tint: 0xf4f4fa });
    box(2.6, py + 9.9, 0, 0.4, 0.4, 9.8, M.gold);
    box(2.55, py + 11.9, 0, 0.12, 1.1, 9.0, M.rune, { uvScale: [0.9, 1] });                                // glowing rune band (tiers 8+)
    for (const e of [-1, 1]) {
      box(5.4, py + 4.2, e * 3.0, 0.7, 8.4, 0.7, M.woodLight, { tint: 0xc9a070 });
      const [x, z] = W(4.4, e * 2.0); B.add(BOX, M.woodLight, mat4(x, py + 7.2, z, ry, 0.45, 0.45, 3.4, e * 0.75, 0), { tint: 0xb98a56 });
    }
    box(5.4, py + 8.6, 0, 0.9, 0.9, 7.2, M.woodLight, { tint: 0xc9a070 });
    for (const e of [-1, 1]) {                                                                              // flags on the pier tops
      const [x, z] = W(3.9, e * 4.9); B.add(CYL(0.12, 0.16, 6, 6), M.wood, mat4(x, py + 14, z), { tint: 0x6b4a30 }); ctx.flag(x, py + 16.4, z, face, 1.1);
      ctx.banner(...(() => { const [bx, bz] = W(3.6, e * 4.9); return [bx, py + 8.4, bz]; })(), face, 1.7, 4.2);
    }
    // crystals on the roof + the flanks of the spur (more of them as the mine levels up), keystone jewel on the lintel front
    at(1, () => cluster(9.2, 0, 6, 1.35, 8.5, 2.6, py + 14.2));
    at(4, () => { cluster(8.0, -3.6, 4, 1.0, 5.5, 2.2, py + 14.2); cluster(8.6, 3.8, 4, 1.0, 5.2, 2.2, py + 14.2); });
    at(6, () => { cluster(11, -10, 5, 1.1, 6, 3.4); cluster(11.5, 10.5, 5, 1.1, 6.5, 3.4); });
    at(9, () => { cluster(17, -5, 6, 1.3, 7.5, 3.8); cluster(17.5, 6, 5, 1.25, 7, 3.6); });
    at(12, () => { cluster(-12, 18.5, 3, 0.8, 3.6, 2.2); cluster(-26, -17, 3, 0.8, 3.4, 2.2); });
    at(3, () => cut(3.1, 0, py + 11.9, 1.5));
    // ---- cobbled yard, steps, rails + sleepers
    box(-9.5, y0 + 0.12, 0, 26, 0.28, 24, cob, { ...stone, tint: 0xcfd5df });
    box(-9.5, y0 + 0.3, 0, 26.6, 0.1, 24.6, cob, { ...stone, tint: 0xa8afbc });                    // rim course
    box(-9.5, y0 + 0.17, 0, 25.5, 0.34, 23.5, cob, { ...stone, tint: 0xd8dde6 });
    for (let k = 0; k < 3; k++) box(2.2 - k * 0.9, y0 + 0.2 + k * 0.22, 0, 1.4, 0.4, 8.2 - k * 0.8, cob, { ...stone, tint: 0xdcdce2 });
    for (let u = 4; u > -31; u -= 1.0) box(u, y0 + 0.42, 0, 0.3, 0.16, 2.8, M.woodLight, { tint: 0x9a7448 });
    for (const v of [-0.85, 0.85]) for (let u = 4; u > -31; u -= 3) box(u - 1.5, y0 + 0.62, v, 3.05, 0.14, 0.12, M.metal);
    // ---- ore heaps glittering with cut gems: a mound of broken ore (stones heaped higher in the middle, veins in the gem's colour)
    for (const [hu, hv, mn] of [[-18, 10, 1], [-24, -6, 5]]) {
      B.tag(ent, mn); gmin = mn;
      const hb = H(hu, hv);
      for (let k = 0; k < 22; k++) {
        const ang = R() * 6.283, d = Math.sqrt(R()) * 3.3, [x, z] = W(hu + Math.cos(ang) * d, hv + Math.sin(ang) * d), sc = 0.45 + R() * 0.55 + (1 - d / 3.3) * 0.5;
        const m = new THREE.Matrix4().compose(new THREE.Vector3(x, hb + Math.max(0, 1 - d / 3.4) * 1.5 - sc * 0.3, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - 0.5) * 1.2, R() * 6.283, (R() - 0.5) * 1.2)), new THREE.Vector3(sc, sc * (0.7 + R() * 0.4), sc));
        pile.push({ geo: RG.stone[k % 2], m, tint: rockTint(R, new THREE.Color()).multiplyScalar(0.85), glint: R() < 0.75 ? gcol : null, base: hb });
      }
      for (let k = 0; k < 7; k++) { const ang = R() * 6.283, d = R() * 2.2; cut(hu + Math.cos(ang) * d, hv + Math.sin(ang) * d, hb + 0.9 + (1 - d / 2.6) * 1.1, 0.55 + R() * 0.45); }
    }
    B.tag(ent, 1); gmin = 1;
    // ---- loaded wagon parked in the yard (level 3+)
    B.tag(ent, 3); gmin = 3;
    {
      const u = -17, v = -9, [x, z] = W(u, v), y = y0 + 0.4;
      B.add(BOX, M.woodLight, mat4(x, y + 1.15, z, ry + 0.25, 3.8, 1.5, 2.4), { tint: 0xc09060 });
      for (const ex of [-1.2, 1.2]) for (const ez of [-1.25, 1.25]) { const wx = x + Math.cos(ry + 0.25) * ex + Math.sin(ry + 0.25) * ez, wz = z - Math.sin(ry + 0.25) * ex + Math.cos(ry + 0.25) * ez; B.add(CYL(0.55, 0.55, 0.2, 12), M.wood, mat4(wx, y + 0.55, wz, ry + 0.25, 1, 1, 1, Math.PI / 2, 0), { tint: 0x7a5434 }); }
      for (let k = 0; k < 6; k++) { const [gx, gz] = [x + Math.cos(ry + 0.25) * (k - 2.5) * 0.55 + (R() - 0.5) * 0.3, z - Math.sin(ry + 0.25) * (k - 2.5) * 0.55 + (R() - 0.5) * 0.3]; put(GC, gx, y + 2.1 + R() * 0.3, gz, (R() - 0.5) * 0.9, R() * 6.283, (R() - 0.5) * 0.9, 0.55 + R() * 0.25); }
    }
    B.tag(ent, 1); gmin = 1;
    // ---- the miners' lodge in the gem's colour (stone base, plaster walls, timber frame, coloured roof, chimney)
    {
      const u = -14, v = -17.5, [x, z] = W(u, v), yy = H(u, v);
      box(u, yy + 0.7, v, 8.2, 1.4, 6.2, cob, { ...stone, tint: 0xc4c8d0 });
      box(u, yy + 3.4, v, 7.6, 4.0, 5.6, plast, { tint: WALLC[id] });
      for (const su of [-1, 1]) for (const sv of [-1, 1]) box(u + su * 3.75, yy + 3.4, v + sv * 2.75, 0.5, 4.1, 0.5, M.woodLight, { tint: 0xa87a4a });
      box(u, yy + 2.0, v, 7.8, 0.35, 5.8, M.woodLight, { tint: 0xa87a4a }); box(u, yy + 5.35, v, 7.8, 0.4, 5.8, M.woodLight, { tint: 0xa87a4a });
      B.add(gableRoof(8.2, 6.2, 3.0, 0.7), M.roof, mat4(x, yy + 5.5, z, ry), { tint: ROOFC[id], worldUV: 0.0 });
      box(u + 0.0, yy + 2.1, v + 3.0, 1.6, 2.7, 0.25, M.woodLight, { tint: 0x7a5434 });                      // door toward the yard
      box(u + 2.6, yy + 3.5, v + 2.84, 1.3, 1.1, 0.12, M.gold, { tint: 0xffe08a }); box(u - 2.6, yy + 3.5, v + 2.84, 1.3, 1.1, 0.12, M.gold, { tint: 0xffe08a });   // lit windows
      box(u - 2.6, yy + 7.6, v - 0.8, 1.1, 3.4, 1.1, cob, { ...stone, tint: 0xb4bac6 });
      const [sx, sz] = W(u - 2.6, v - 0.8); ctx.smokeAt(sx, yy + 9.4, sz);
      ctx.inst('barrel', ...W(u + 4.8, v + 3.2), R() * 6, 1.3); ctx.inst('crate', ...W(u + 5.0, v + 1.6), R() * 6, 1.2); ctx.inst('barrel', ...W(u + 4.6, v + 4.4), R() * 6, 1.3);
    }
    // ---- grows with the mine: a storehouse (level 8) and a watchtower (level 14)
    at(8, () => {
      const u = -27, v = 9, [x, z] = W(u, v), yy = H(u, v);
      box(u, yy + 0.6, v, 6.4, 1.2, 5.2, cob, { ...stone, tint: 0xc4c8d0 });
      box(u, yy + 2.9, v, 5.8, 3.4, 4.6, plast, { tint: WALLC[id] });
      for (const su of [-1, 1]) for (const sv of [-1, 1]) box(u + su * 2.85, yy + 2.9, v + sv * 2.25, 0.4, 3.5, 0.4, M.woodLight, { tint: 0xa87a4a });
      B.add(gableRoof(6.4, 5.2, 2.6, 0.6), M.roof, mat4(x, yy + 4.6, z, ry + Math.PI / 2), { tint: ROOFC[id] });
      box(u + 0.0, yy + 1.9, v - 2.35, 1.5, 2.4, 0.22, M.woodLight, { tint: 0x7a5434 });
    });
    at(14, () => {
      const u = -6, v = -22, [x, z] = W(u, v), yy = H(u, v);
      box(u, yy + 0.7, v, 5.6, 1.4, 5.6, cob, { ...stone, tint: 0xc4c8d0 });
      box(u, yy + 6.8, v, 4.4, 11.0, 4.4, cob, { ...stone, tint: 0xe8e4dc });
      box(u, yy + 12.5, v, 5.6, 0.7, 5.6, cob, { ...stone, tint: 0xb4bac6 });
      for (const [su, sv] of [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]]) box(u + su, yy + 13.4, v + sv, 1.0, 1.2, 1.0, cob, { ...stone, tint: 0xe8e4dc });
      B.add(new THREE.ConeGeometry(3.6, 4.4, 4, 1, true), M.roof, mat4(x, yy + 15.0, z, ry + Math.PI / 4), { tint: ROOFC[id], uvScale: [3, 2] });
      B.add(new THREE.SphereGeometry(0.35, 8, 6), M.gold, mat4(x, yy + 17.4, z));
      ctx.torch(...(() => { const [tx, tz] = W(u + 2.3, v + 2.3); return [tx, yy + 12.2, tz]; })(), { pool: false });
    });
    for (const [u, v] of [[3.8, -6.8], [3.8, 6.8], [-6, 13.5], [-6, -13.5], [-26, 4], [-26, -10]]) { const [x, z] = W(u, v); ctx.torch(x, H(u, v) + 3.4, z, { pool: true, post: true }); }
    { const pm = rockPile(pile, pileMat); pm.castShadow = false; pm.receiveShadow = true; scene.add(pm); }
    let crystalMesh = null;
    {
      const [x, z] = W(7, 0), mesh = new THREE.Mesh(mergeGeometries(bake, false), gm[id]); mesh.castShadow = false; mesh.receiveShadow = false; mesh.frustumCulled = false; scene.add(mesh); crystalMesh = mesh;
      void x; void z;
    }

    // ---- the giant floating gem + glow: the mine's landmark
    const gx = W(8, 0), gy = py + 25;
    const giant = new THREE.Mesh(gemGeometry(id), bigGm[id]); giant.scale.setScalar(5.6); giant.position.set(gx[0], gy, gx[1]); scene.add(giant);
    const glow = new THREE.Sprite(glowMats[id]); glow.position.set(gx[0], gy, gx[1]); glow.scale.setScalar(26); scene.add(glow);
    const big = { giant, glow, gy, mat: bigGm[id], ph: R() * 6, k: 1 }; bigs.push(big);
    out.push({ id, glow });

    // ---- the gem's machine (big, light wood + steel)
    const machine = new THREE.Group(); machine.position.set(...(() => { const [x, z] = W(-5, 15); return [x, H(-5, 15), z]; })()); machine.rotation.y = ry; machine.scale.setScalar(1.35); scene.add(machine);
    const mk = (geo, mat, x, y, z, rx = 0, ryy = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ryy, rz); m.castShadow = !!Q.shadows; m.receiveShadow = true; return m; };
    if (id === 'ruby') {
      // headframe: two A-frames, a big winch wheel on top that turns
      for (const e of [-1, 1]) { machine.add(mk(BOX.clone().scale(0.5, 11, 0.5), wood, -1.6, 5.2, e * 1.6, 0, 0, 0.18)); machine.add(mk(BOX.clone().scale(0.5, 11, 0.5), wood, 1.6, 5.2, e * 1.6, 0, 0, -0.18)); }
      machine.add(mk(BOX.clone().scale(4.4, 0.5, 4), wood, 0, 10.4, 0));
      const wheel = new THREE.Group(); wheel.position.set(0, 11.8, 0); machine.add(wheel);
      wheel.add(mk(new THREE.TorusGeometry(2.2, 0.16, 6, 20), metal, 0, 0, 0));
      for (let k = 0; k < 6; k++) wheel.add(mk(BOX.clone().scale(0.14, 4.4, 0.14), metal, 0, 0, 0, 0, 0, (k / 6) * Math.PI));
      freezeChildren(wheel);
      anim.push((t, dt) => { wheel.rotation.z -= dt * 1.1; });
      machine.add(mk(CYL(0.03, 0.03, 9, 4), metal, 2.2, 7.3, 0));
    } else if (id === 'emerald') {
      // stamp mill: frame + three stamps hammering in turn
      machine.add(mk(BOX.clone().scale(5.4, 0.6, 2.6), wood, 0, 0.3, 0));
      for (const x of [-2.5, 2.5]) for (const z of [-1, 1]) machine.add(mk(BOX.clone().scale(0.45, 7, 0.45), wood, x, 3.5, z));
      machine.add(mk(BOX.clone().scale(5.6, 0.5, 2.6), wood, 0, 7, 0));
      machine.add(mk(CYL(0.25, 0.25, 5.4, 8), metal, 0, 5.6, 0, 0, 0, Math.PI / 2));
      const stamps = [];
      for (let k = 0; k < 3; k++) { const st = mk(BOX.clone().scale(0.5, 4.2, 0.5), metal, -1.4 + k * 1.4, 2.8, 0); st.userData.keep = true; machine.add(st); stamps.push(st); }
      anim.push((t) => { stamps.forEach((st, k) => { const ph = (t * 1.6 + k / 3) % 1; st.position.y = 2.8 + (ph < 0.7 ? ph / 0.7 * 1.1 : (1 - (ph - 0.7) / 0.3) * 1.1); }); });
      machine.add(mk(new THREE.BoxGeometry(5, 1.2, 2), wood, 0, 0.9, 2.6));
    } else {
      // loading crane with a swinging arm and a hanging bucket
      machine.add(mk(CYL(0.45, 0.6, 8, 8), wood, 0, 4, 0));
      const arm = new THREE.Group(); arm.position.set(0, 8, 0); machine.add(arm);
      arm.add(mk(BOX.clone().scale(9, 0.45, 0.45), wood, 3, 0, 0, 0, 0, 0.12));
      arm.add(mk(BOX.clone().scale(0.35, 0.35, 0.35), wood, -1.2, -0.3, 0));
      const rope = mk(CYL(0.03, 0.03, 4, 4), metal, 7.2, -1.4, 0); rope.userData.keep = true; arm.add(rope);
      const bucket = mk(CYL(0.7, 0.5, 0.9, 10), metal, 7.2, -3.6, 0); bucket.userData.keep = true; arm.add(bucket);
      freezeChildren(arm);
      anim.push((t) => { arm.rotation.y = Math.sin(t * 0.35) * 1.1; bucket.position.y = -3.6 + Math.sin(t * 0.7) * 0.8; rope.scale.y = 1 - Math.sin(t * 0.7) * 0.2; });
    }
    freezeChildren(machine);
    // size grows with the mine's level
    ctx.levelHooks.push(() => { const k = (levelOf('mine_' + id) - 1) / 19; big.k = 0.5 + 0.5 * k; giant.scale.setScalar(5.8 * big.k); machine.scale.setScalar(0.9 + 0.45 * k); cart.scale.setScalar(1.0 + 0.3 * k); });

    // ---- mine cart rolling out of the tunnel and back, heaped with gems
    const cart = new THREE.Group(); cart.scale.setScalar(1.3); scene.add(cart);
    cart.add(mk(BOX.clone().scale(2.4, 1.1, 1.7), wood, 0, 0.85, 0));
    for (const ex of [-0.8, 0.8]) for (const ez of [-0.75, 0.75]) cart.add(mk(CYL(0.32, 0.32, 0.18, 10), metal, ex, 0.32, ez, Math.PI / 2, 0, 0));
    freezeChildren(cart);
    {
      const lg = [];
      for (let k = 0; k < 9; k++) { const g = GC.clone(); g.applyMatrix4(_m4.compose(_p.set((k % 3 - 1) * 0.62 + (R() - 0.5) * 0.15, 1.45 + (k > 5 ? 0.25 : 0), ((k / 3 | 0) - 1) * 0.5), _q.setFromEuler(_e.set((R() - 0.5) * 0.8, R() * 6.28, (R() - 0.5) * 0.8)), _s.setScalar(0.4 + R() * 0.1))); lg.push(g); }
      const load = new THREE.Mesh(mergeGeometries(lg, false), gm[id]); load.userData.keep = true; cart.add(load);
    }
    let cu = -4, dir = -1, wait = 0;
    // rail heights precomputed every 0.5 m (no terrain queries per frame)
    const RH = []; for (let u = -29; u <= 7.01; u += 0.5) RH.push(y0 + 0.7);
    cart.rotation.y = ry;
    anim.push((t, dt) => {
      if (cart.userData.down) { cart.visible = false; return; }
      if (wait > 0) { wait -= dt; return; }
      cu += dir * dt * 2.4; if (cu < -29) { cu = -29; dir = 1; wait = 4; } if (cu > 7) { cu = 7; dir = -1; wait = 6; }
      const f = (cu + 29) * 2, i = Math.min(RH.length - 2, Math.floor(f)), y = RH[i] + (RH[i + 1] - RH[i]) * (f - i);
      cart.position.set(MN.x + cu * ca, y, MN.z + cu * sa); cart.visible = cu < 5.5;
    });
    ctx.live(giant, glow, machine, cart, crystalMesh);
    B.tag(0); B.bid(0);
    const [px, pz] = W(-4, 0);
    ctx.pick({ x: px, z: pz, y0: y0 - 2, y1: y0 + 34, r: 20 }, 'mine_' + id);
    out.push({ id, x: px, y: y0, z: pz, top: (() => { const [x, z] = W(6, 0); return new THREE.Vector3(x, y0 + 36, z); })() });
  }
  // emissive pulse (stronger at night) + the giant gems turn and bob
  let night = 0;
  const GMs = Object.entries(gm), GL = Object.values(glowMats);
  anim.push((t) => {
    for (const [k, m] of GMs) m.emissiveIntensity = (0.28 + 0.8 * night) * (0.85 + 0.15 * Math.sin(t * 1.7 + k.length));
    for (const b of bigs) { b.giant.position.y = b.gy + Math.sin(t * 1.1 + b.ph) * 0.8; b.giant.rotation.y = t * 0.6 + b.ph; b.glow.position.y = b.giant.position.y; b.glow.scale.setScalar((22 + 4 * Math.sin(t * 2.0 + b.ph)) * b.k); b.mat.emissiveIntensity = 0.45 + 0.9 * night + 0.1 * Math.sin(t * 2.3 + b.ph); }
    for (const g of GL) g.opacity = 0.07 + 0.58 * night;      // (by day the additive halo only washed the crystal out from above; it glows at night)
  });
  return { list: out.filter((o) => o.top), setNight(n) { night = n; } };
}
