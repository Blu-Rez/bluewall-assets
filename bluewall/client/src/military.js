// The kingdom's military estates, one per structure that trains soldiers. Each wears the tier skin of its own level (wood → stone → iron →
// gold → diamond → blue crystal, skin.js) and GROWS with it: extra wings, turrets, banners, crystals appear at their minimum level.
//   barracks  — long hall behind the muster field        (infantry)
//   training  — archery range + drill yard beside it       (archers, army housing)
//   forge     — open smithy with a glowing hearth           (armour / weapons)
//   stable    — stable block, round pen, keepers' camp, fence (cavalry, winged horses) — pas_stable.js
//   workshop  — siege shed at the army camp                 (catapults, rams, giants)
//   lair      — rocky terrace with a cave and a nest        (baby dragons, dragons)
// Everything static goes through the batcher (6 role-5 "hide only" materials shared by all estates); props (glowing hearth, eggs, siege
// models) are small groups switched by the structure's level. Level 0 (not built yet) hides the whole estate.
//   buildMilitary(ctx, { scene, A, Q }) -> { list: [{ id, x, z }] }
import * as THREE from 'three';
import * as L from './layout.js';
import { mat4, gableRoof } from './util.js';
import { instance } from './assets.js';
import { ENT, applySkin, levelOf } from './skin.js';
import { rng } from './noise.js';
import { crystalGeometry, gemMaterial } from './gemgeo.js';
import { buildStableEstate } from './pas_stable.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s);
const CONE = (r, h, s = 8) => new THREE.ConeGeometry(r, h, s);
const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);          // yaw whose +v (front) points at (tx, tz)
export const stableSpot = L.stableAt;                       // (the layout owns where it stands; life.js fills the yard)

// The Training Ground's yard (archery lane, drill yard, dummies, pavilion) is not drawn any more (owner 4 Oct 20:35: «اون زمین تخمی تمرین رو پاک کن، پشت سرباز ها فقط چادر»):
// the army camp's tents stand there instead.  The building still exists in the rules (army housing, upgrades from the build panel); it just has no model and no battle target.
const SHOW_TRAINING = false;
const SHOW_BARRACKS = false;   // (owner, Oct 4: the white hall behind the tents is gone — the camp is tents only; the barracks level still drives housing / uniforms)

export function buildMilitary(ctx, { scene, A, Q }) {
  const { B, M, height } = ctx, R = rng(7707);
  const out = [];
  const clone5 = (src, color) => { const m = src.clone(); if (color != null) m.color.set(color); applySkin(m, 5); return m; };
  const WOOD = clone5(M.woodLight), METAL = clone5(M.metal), CLOTH = clone5(M.cloth), DARK = clone5(M.dark), PLAST = clone5(M.plaster);
  const SK = { wall: M.stone, base: M.stoneDark, roof: M.roof, gold: M.gold, rune: M.rune };
  const props = {};                                                       // ent -> [THREE objects switched by level]
  const sheet = (ent, min, obj) => { (props[ent] = props[ent] || []).push({ min, obj }); obj.visible = false; scene.add(obj); return obj; };

  // A plot: local u (right) / v (front, the door side), floor level y0. Tagged pieces appear at their min level.
  function plot(id, cx, cz, ry, o = {}) {
    const ent = ENT[id], c = Math.cos(ry), s = Math.sin(ry);
    B.tag(ent, 1);
    { const D = { barracks: [38, 16, 10], training: [30, 28, 8], forge: [20, 18, 10], stable: [30, 24, 10], workshop: [30, 24, 10], lair: [26, 26, 12] }[id] || [24, 20, 10]; ctx.tgt({ type: id, x: cx, z: cz, w: D[0], d: D[1], h: D[2], rot: ry }); }
    const W = (u, v) => [cx + c * u + s * v, cz - s * u + c * v];
    const y0 = o.y0 ?? height(cx, cz);
    const P = {
      id, ent, W, y0, ry, cx, cz,
      at(min, fn) { B.tag(ent, min); fn(); B.tag(ent, 1); },
      box(u, y, v, su, sy, sv, mat, op = {}) { const [x, z] = W(u, v); B.add(BOX, mat, mat4(x, y0 + y, z, ry, su, sy, sv), op); },
      cyl(u, y, v, rt, rb, h, mat, op = {}, seg = 10) { const [x, z] = W(u, v); B.add(CYL(rt, rb, h, seg), mat, mat4(x, y0 + y, z, ry), op); },
      cone(u, y, v, r, h, mat, op = {}, seg = 8, rot = 0) { const [x, z] = W(u, v); B.add(CONE(r, h, seg), mat, mat4(x, y0 + y, z, ry + rot), mat === SK.roof ? { tint: 0x4d6fae, ...op } : op); },
      roof(u, y, v, w, d, h, op = {}, over = 0.7, along = 0) { const [x, z] = W(u, v); B.add(gableRoof(w, d, h, over), SK.roof, mat4(x, y0 + y, z, ry + along), { uvScale: [1.4, 1.2], tint: 0x4d6fae, ...op }); },
      // a plinth that reaches far below the slope so a building never floats on a hillside
      skirt(u, v, w, d, tint = 0xa8a8b0, depth = 9, top = 1.6) { P.box(u, top - depth / 2, v, w, depth, d, SK.base, { worldUV: 0.1, tint }); },
      // wall box with tier look on a deep plinth
      hall(u, v, w, d, h, op = {}) {
        P.skirt(u, v, w + 0.8, d + 0.8, 0xb9bcc6);
        P.box(u, 0.8 + h / 2, v, w, h, d, SK.wall, { worldUV: 0.1, tint: op.tint ?? 0xe4e6ee });
        P.box(u, 0.8 + h + 0.18, v, w + 0.5, 0.36, d + 0.5, SK.base, { worldUV: 0.1, tint: 0xe6e8f0 });
      },
      post(u, v, h, w = 0.36, mat = WOOD, tint = 0x9a7048) { P.box(u, h / 2 + 0.2, v, w, h, w, mat, { tint }); },
      fence(u0, v0, u1, v1, step = 3, h = 1.1) {
        const n = Math.max(1, Math.round(Math.hypot(u1 - u0, v1 - v0) / step)), ang = Math.atan2(v1 - v0, u1 - u0);
        for (let k = 0; k <= n; k++) P.post(u0 + (u1 - u0) * k / n, v0 + (v1 - v0) * k / n, h, 0.22);
        for (const yy of [0.5, 0.95]) {
          const [x, z] = W((u0 + u1) / 2, (v0 + v1) / 2);
          B.add(BOX, WOOD, mat4(x, y0 + yy, z, ry - ang, Math.hypot(u1 - u0, v1 - v0), 0.12, 0.1), { tint: 0x8a6a48 });
        }
      },
      banner(u, v, h, w, hh, tint = 0x2a62d8) { P.box(u, h, v - 0.06, w, hh, 0.06, CLOTH, { tint }); P.box(u, h + hh / 2 + 0.1, v - 0.06, w + 0.3, 0.18, 0.18, WOOD, { tint: 0x6b4a30 }); },
      pick(r, h) { const [x, z] = W(0, 0); ctx.pick({ x, z, y0: 0, y1: y0 + h, r }, id); out.push({ id, x, z, ry }); },
    };
    return P;
  }

  const MU = L.MUSTER, T0 = L.TGATES && L.TGATES[0], PA = L.PASTURE, CA = L.CAMP, LA = L.LAIR;

  // =============================================================== BARRACKS (behind the muster field, door toward the troops)
  if (MU && MU.r > 0 && T0) {
    const face = Math.atan2(T0.x - MU.x, T0.z - MU.z), fx = Math.sin(face), fz = Math.cos(face), rx = fz, rz = -fx;
    const at = (u, v) => [MU.x + fx * u + rx * v, MU.z + fz * u + rz * v];
    if (SHOW_BARRACKS) {
      const [x, z] = at(-30, 0), P = plot('barracks', x, z, face);
      P.hall(0, 0, 30, 11, 5.6);
      P.roof(0, 6.4, 0, 30, 11, 4.4);
      // door with timber frame, windows, buttresses
      P.box(0, 3.0, 5.7, 3.8, 4.6, 0.5, DARK); P.box(-2.1, 3.0, 5.8, 0.5, 5.0, 0.6, WOOD, { tint: 0x8a6a48 }); P.box(2.1, 3.0, 5.8, 0.5, 5.0, 0.6, WOOD, { tint: 0x8a6a48 }); P.box(0, 5.5, 5.8, 4.8, 0.6, 0.6, WOOD, { tint: 0x8a6a48 });
      for (const u of [-11, -7, 7, 11]) P.box(u, 4.2, 5.62, 1.3, 1.7, 0.4, DARK);
      for (const u of [-14.8, -7.4, 7.4, 14.8]) P.box(u, 3.4, 5.85, 1.0, 6.4, 1.0, SK.base, { worldUV: 0.1, tint: 0xdcdee6 });
      // weapon racks in front
      for (const u of [-10, -6, 6, 10]) { P.box(u, 1.0, 8.4, 3.0, 0.16, 0.34, WOOD, { tint: 0x7a5a3a }); for (let k = -1; k <= 1; k++) P.box(u + k * 0.9, 1.5, 8.4, 0.09, 2.6, 0.09, METAL, { tint: 0xb8c0cc }); }
      // L4: annex wing + a courtyard well-trodden step
      P.at(4, () => { P.hall(21, -0.5, 12, 9, 4.2); P.roof(21, 5.2, -0.5, 12, 9, 3.4, {}, 0.6); P.box(21, 2.4, 4.1, 2.6, 3.4, 0.4, DARK); P.box(0, 0.35, 8.2, 8.0, 0.5, 3.2, SK.base, { worldUV: 0.15, tint: 0xd0d2da }); });
      // L8: round turret + flag
      P.at(8, () => {
        P.cyl(-16.4, 6.4, 3.4, 2.6, 2.8, 12.4, SK.wall, { worldUV: 0.1, tint: 0xe4e6ee }, 14); P.cyl(-16.4, 12.9, 3.4, 3.3, 3.3, 0.7, SK.base, { tint: 0xe6e8f0 }, 14);
        P.cone(-16.4, 15.5, 3.4, 3.7, 4.6, SK.roof, { uvScale: [3, 2] }, 14); P.cyl(-16.4, 19.6, 3.4, 0.08, 0.1, 3.4, WOOD, { tint: 0x6b4a30 }, 6); P.box(-15.6, 20.2, 3.4, 1.6, 0.9, 0.05, CLOTH, { tint: 0x2a62d8 });
      });
      // L12: second turret on the annex, golden eaves, banners on the front
      P.at(12, () => {
        P.cyl(27.4, 5.2, 3.0, 2.3, 2.5, 10.4, SK.wall, { worldUV: 0.1, tint: 0xe4e6ee }, 14); P.cone(27.4, 12.6, 3.0, 3.3, 4.2, SK.roof, { uvScale: [3, 2] }, 14);
        P.box(0, 6.5, 5.9, 31, 0.3, 0.3, SK.gold); for (const u of [-12, -4.2, 4.2, 12]) P.banner(u, 6.4, 3.4, 1.5, 3.2);
      });
      // L16: grand steps + gate pillars, gold finials on the ridge
      P.at(16, () => { P.box(0, 0.6, 9.3, 9, 0.9, 2.2, SK.base, { worldUV: 0.15, tint: 0xe6e8f0 }); for (const e of [-1, 1]) { P.box(e * 3.6, 2.8, 8.3, 0.9, 4.8, 0.9, SK.wall, { worldUV: 0.1, tint: 0xeef0f6 }); P.box(e * 3.6, 5.5, 8.3, 1.3, 0.6, 1.3, SK.gold); } for (const u of [-14, 0, 14]) P.cone(u, 11.2, 0, 0.5, 1.6, SK.gold, {}, 6); });
      // L20: crystal spires
      P.at(20, () => { for (const [u, h] of [[-9, 6], [9, 6], [0, 8]]) P.cone(u, 10.8, -0.5, 0.9, h, SK.wall, { worldUV: 0.2 }, 5); });
      P.pick(15, 14);
    }

    // =============================================================== TRAINING GROUND (right of the field: archery lane + drill yard)
    if (SHOW_TRAINING) {
      const [x, z] = at(-6, 54), P = plot('training', x, z, face);
      P.skirt(0, 0, 42, 27, 0x7a6e58, 8, 0.5); P.box(0, 0.1, 0, 42, 1.0, 27, PLAST, { worldUV: 0.08, tint: 0x9a8a68 });                    // trodden-earth / stone yard
      // shooting line (fence + bench) at u=-18, targets at u=+16
      P.fence(-16, -8, -16, 8, 2.4);
      for (let k = 0; k < 4; k++) { const v = -7.5 + k * 5; P.box(-14.6, 0.9, v, 0.5, 0.18, 1.6, WOOD, { tint: 0x7a5a3a }); }
      for (const v of [-8, -2.6, 2.8, 8.2]) {                                                       // straw targets on tripods
        P.box(12.2, 1.9, v + 0.9, 0.2, 3.6, 0.2, WOOD, { tint: 0x7a5a3a }); P.box(12.2, 1.9, v - 0.9, 0.2, 3.6, 0.2, WOOD, { tint: 0x7a5a3a });
        P.cyl(11.6, 3.1, v, 1.5, 1.5, 0.5, PLAST, { tint: 0xd8c48a }, 16); P.cyl(11.3, 3.1, v, 0.9, 0.9, 0.4, PLAST, { tint: 0xc23a3a }, 16); P.cyl(11.2, 3.1, v, 0.4, 0.4, 0.4, PLAST, { tint: 0xf2d24a }, 16);
      }
      P.box(17.5, 1.1, 0, 3.4, 2.2, 22, SK.base, { worldUV: 0.15, tint: 0x8a7a60 });                // arrow bank behind the targets
      // dummies on the left
      for (const [u, v] of [[-4, -10], [0, -10.5], [4, -10]]) { P.post(u, v, 2.4, 0.28); P.box(u, 2.1, v, 1.7, 0.2, 0.2, WOOD, { tint: 0x7a5a3a }); P.cyl(u, 3.0, v, 0.4, 0.4, 0.8, PLAST, { tint: 0xc8b890 }, 8); P.cyl(u, 1.9, v, 0.42, 0.5, 1.1, PLAST, { tint: 0xb8a878 }, 8); }
      // L4: spectators' pavilion
      P.at(4, () => { for (const [u, v] of [[-8, 12.4], [-8, 9.2], [0, 12.4], [0, 9.2]]) P.post(u, v, 4.6, 0.4); P.cone(-4, 5.1, 10.8, 5.6, 3.0, CLOTH, { tint: 0x33486a, uvScale: [3, 2] }, 4, Math.PI / 4); P.box(-4, 0.7, 12.4, 7.6, 0.2, 1.2, WOOD, { tint: 0x7a5a3a }); P.box(-4, 1.3, 12.9, 7.6, 0.8, 0.2, WOOD, { tint: 0x7a5a3a }); });
      // L12: obstacle course: log wall, balance beams
      P.at(12, () => { P.box(2, 1.6, -11, 8, 3.2, 0.7, WOOD, { tint: 0x8a6a48 }); P.box(2, 0.6, -9.8, 8, 1.2, 1.0, WOOD, { tint: 0x7a5a3a }); for (let k = 0; k < 3; k++) P.box(-10 + k * 3.2, 0.5, -9, 5, 1, 0.4, WOOD, { tint: 0x7a5a3a }); });
      // L16: gold-ringed targets + pennants
      P.at(16, () => { for (const v of [-8, -2.6, 2.8, 8.2]) P.cyl(11.45, 3.1, v, 1.65, 1.65, 0.28, SK.gold, {}, 16); for (const v of [-11, 11]) { P.post(-16, v, 7, 0.22); P.banner(-16, v, 6.2, 1.4, 1.6); } });
      // L20: crystal obelisks
      P.at(20, () => { for (const v of [-12.5, 12.5]) P.cone(16, 4.6, v, 1.0, 8, SK.wall, { worldUV: 0.2 }, 5); });
      P.pick(14, 8);
    }

    // =============================================================== FORGE (left of the field)
    {
      const [x, z] = at(-12, -54), P = plot('forge', x, z, face + Math.PI / 2);
      P.skirt(0, 0, 15, 12, 0x8e8e96, 8, 0.3); P.box(0, 0.1, 0, 15, 0.6, 12, SK.base, { worldUV: 0.12, tint: 0xa8a8b0 });
      for (const [u, v] of [[-6.6, -5], [6.6, -5], [-6.6, 5], [6.6, 5], [0, 5]]) P.post(u, v, 5.4, 0.55);
      P.box(0, 3.0, -5.6, 15, 5.4, 0.8, SK.wall, { worldUV: 0.1, tint: 0xd4d6de });                       // back wall
      P.roof(0, 5.7, 0, 15, 12, 3.2, {}, 0.8);
      P.box(-4.2, 1.7, -3.6, 4.6, 2.8, 2.8, SK.base, { worldUV: 0.25, tint: 0x8a8580 }); P.box(-4.2, 6.3, -4.4, 1.7, 8, 1.7, SK.base, { worldUV: 0.25, tint: 0x7a7570 }); // hearth + chimney
      P.box(-4.2, 3.35, -3.6, 5.0, 0.5, 3.2, SK.base, { tint: 0x6a6560 });
      P.box(3, 0.8, -2.2, 1.6, 1.2, 1.1, WOOD, { tint: 0x5a3a22 }); P.box(3, 1.55, -2.2, 2.1, 0.34, 0.8, METAL, { tint: 0x9aa2b0 }); P.cone(3.5, 1.8, -2.0, 0.4, 0.5, METAL, { tint: 0x9aa2b0 }, 6, 0);  // anvil
      P.box(1.2, 0.85, 2.6, 3.0, 0.8, 1.1, WOOD, { tint: 0x6b4a30 });                                         // quench trough
      for (const u of [4.6, 6.4]) { P.box(u, 1.3, -5.0, 0.12, 2.6, 0.12, METAL, { tint: 0xb8c0cc }); P.box(u, 2.2, -5.0, 1.2, 0.12, 0.12, WOOD); }
      P.cone(-8.6, 0.7, 1.4, 1.5, 1.2, DARK, {}, 7);                                                           // coal heap
      P.at(5, () => { P.box(-9.4, 2.6, 0.5, 2.4, 3.8, 2.4, SK.base, { worldUV: 0.25, tint: 0x8a8580 }); P.box(-9.4, 6.2, 0.5, 1.2, 4, 1.2, SK.base, { worldUV: 0.25, tint: 0x7a7570 }); });
      P.at(10, () => { P.box(9.4, 3.2, -1.4, 2.4, 5.0, 2.4, SK.base, { worldUV: 0.25, tint: 0x8a8580 }); P.box(9.4, 8.0, -1.4, 1.5, 5, 1.5, SK.base, { worldUV: 0.25, tint: 0x7a7570 }); P.box(0, 6.2, 6.1, 16, 0.3, 0.3, SK.gold); });
      P.at(15, () => { P.hall(-13, 0, 7, 9, 4.6); P.roof(-13, 5.6, 0, 7, 9, 2.8, {}, 0.6); P.box(-13, 2.4, 4.6, 2.4, 3.2, 0.4, DARK); for (const [u, v] of [[-6.8, 5.6], [6.8, 5.6]]) P.banner(u, v, 5.0, 1.3, 2.8); });
      P.at(20, () => { P.cone(0, 5.2, -5.0, 1.1, 7, SK.wall, { worldUV: 0.2 }, 5); });
      const fire = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 1.4), M.fire); { const [fx2, fz2] = P.W(-4.2, -2.6); fire.position.set(fx2, y0f(P) + 2.0, fz2); fire.rotation.y = P.ry; }
      sheet(ENT.forge, 1, fire);
      const [sx, sz] = P.W(-4.2, -4.4); const sm = ctx.smokeAt(sx, y0f(P) + 10.6, sz, true); (props[ENT.forge].smokers = props[ENT.forge].smokers || []).push(sm); sm.off = true;
      P.pick(9, 11);
    }
  }
  function y0f(P) { return P.y0; }

  // =============================================================== STABLE (west of the pasture, doors toward it) — pas_stable.js
  // A timber stable block (stone footing, dark boards, navy Dutch doors with horses looking out, shingled roofs, cupola + vane), the round
  // pen, the yard, the horse-keepers' camp and the pasture fence: ONE merged mesh with its own procedural material (one draw call),
  // pieces shown by the stable's level (aTag) and collapsed by the battle like every estate (aB). life.js fills it with horses and people.
  if (PA && PA.r > 0 && L.stableAt()) {
    const S0 = L.stableAt(), P = plot('stable', S0.x, S0.z, S0.ry);
    try { buildStableEstate(ctx, P, { scene, Q, A }); } catch (e) { console.warn('stable estate', e); }
    P.pick(16, 12);
  }

  // =============================================================== SIEGE WORKSHOP (outer side of the army camp)
  if (CA && CA.r > 0) {
    const out0 = Math.hypot(CA.x, CA.z) || 1, ux = CA.x / out0, uz = CA.z / out0;
    const wx = CA.x + ux * 50 + uz * 18, wz = CA.z + uz * 50 - ux * 18, ry = faceTo(wx, wz, CA.x, CA.z), P = plot('workshop', wx, wz, ry);
    P.skirt(0, 0, 30, 24, 0x8a8478, 9, -0.1); P.box(0, -0.3, 0, 30, 0.7, 24, SK.base, { worldUV: 0.1, tint: 0xa8a090 });
    // back wall + two side walls + open front with timber posts; big roof
    P.box(0, 3.4, -7, 24, 6.4, 0.8, SK.wall, { worldUV: 0.1, tint: 0xdcdee6 });
    for (const e of [-1, 1]) P.box(e * 11.6, 3.4, -1.4, 0.8, 6.4, 11.4, SK.wall, { worldUV: 0.1, tint: 0xdcdee6 });
    for (const u of [-11.6, -4, 4, 11.6]) P.post(u, 4.6, 6.6, 0.6);
    P.box(0, 6.7, 4.6, 24, 0.5, 0.6, WOOD, { tint: 0x7a5a3a });
    P.roof(0, 6.6, -1.2, 24, 12.4, 4.4, {}, 0.8);
    for (const u of [-6, 0, 6]) P.box(u, 6.0, -1.2, 0.35, 0.45, 11.6, WOOD, { tint: 0x6b4a30 });               // tie beams
    // yard clutter: log piles, wheels, planks, workbench
    for (let k = 0; k < 3; k++) for (let j = 0; j < 3 - k; j++) P.cyl(-9 + j * 1.1 + k * 0.55, 0.8 + k * 0.95, 9, 0.5, 0.5, 5, WOOD, { tint: 0x9a7048 }, 8);
    P.box(8, 0.6, 9.6, 5, 0.3, 1.4, WOOD, { tint: 0x8a6a48 }); P.box(8, 1.3, 9.6, 5, 0.12, 1.4, WOOD, { tint: 0x7a5a3a });
    for (const [u, v] of [[-3, 10], [-1.4, 10.6]]) { const [x, z] = P.W(u, v); B.add(CYL(1.1, 1.1, 0.35, 12), WOOD, mat4(x, P.y0 + 1.1, z, ry, 1, 1, 1, 0, Math.PI / 2), { tint: 0x6b4a30 }); }
    P.at(8, () => { // gantry crane over the bay
      for (const u of [-7, 7]) { P.post(u, 8, 11, 0.6); P.box(u, 5.5, 9.4, 0.4, 0.4, 3.4, WOOD, { tint: 0x6b4a30 }); }
      P.box(0, 11.2, 8, 15, 0.7, 0.8, WOOD, { tint: 0x7a5a3a }); P.box(2, 8.6, 8, 0.08, 5, 0.08, METAL, { tint: 0xb8c0cc }); P.box(2, 6.0, 8, 0.7, 0.5, 0.4, METAL);
    });
    P.at(14, () => { P.hall(-21.5, 1, 14, 10, 5.4); P.roof(-21.5, 6.2, 1, 14, 10, 3.8, {}, 0.7); P.box(-21.5, 3.0, 6.1, 4.4, 4.6, 0.5, DARK); P.box(0, 7.3, 4.6, 24.6, 0.28, 0.28, SK.gold); });
    P.at(18, () => { for (let k = 0; k < 34; k++) { const a = k / 34 * Math.PI * 2; if (a > 4.4 && a < 5.0) continue; P.box(Math.cos(a) * 9 + 24, 2.6, 5 + Math.sin(a) * 9, 0.7, 5.2, 0.7, WOOD, { tint: 0x8a6a48 }); } });   // giant's palisade
    // siege models under construction (props switched by level)
    const g1 = new THREE.Group(), g2 = new THREE.Group(), g3 = new THREE.Group();
    const place = (grp, key, u, v, s, yaw = 0) => { const gl = A.models && A.models[key]; if (!gl) return; const [x, z] = P.W(u, v); const m = new THREE.Matrix4().compose(new THREE.Vector3(x, P.y0 + 0.5, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry + yaw), new THREE.Vector3(s, s, s)); for (const mm of instance(scene, gl, [m], { cast: !!Q.shadows })) { grp.add(mm); } };
    place(g1, 'catapult', 0, 1.5, 1.7, 0.4); place(g2, 'ram', -21.5, 12, 1.6, -0.3); place(g3, 'siege_tower', 22, 15, 1.2, 0.2);
    [[g1, 1], [g2, 14], [g3, 18]].forEach(([g, mn]) => { scene.add(g); sheet(ENT.workshop, mn, g); });
    P.pick(15, 11);
  }

  // =============================================================== DRAGON LAIR (rocky terrace on the eastern hill, cave toward the town)
  if (LA && LA.r > 0) {
    const ry = faceTo(LA.x, LA.z, 0, 0), P = plot('lair', LA.x, LA.z, ry), gm = crystalGeometry('turq');
    const rockMat = SK.base;
    // terrace (stepped drum reaching well below the slope) + back wall of rock
    for (const [r, h, yc, t] of [[19, 20, -8.9, 0x8e8a84], [16.5, 0.9, 1.3, 0xb8b4ac]]) { const [x, z] = P.W(0, 0); B.add(CYL(r, r + 2.4, h, 24), rockMat, mat4(x, P.y0 + yc, z, ry), { worldUV: 0.08, tint: t }); }
    {   // the hill behind the cave: scanned cliff rocks in a horseshoe (one instanced draw), a dark core behind them
      P.box(0, 9, -14, 22, 18, 6, DARK);
      const rm = [], Y = new THREE.Vector3(0, 1, 0);
      [[-14, -12, 7.5, 0.4], [-8, -15, 8.5, 1.9], [0, -18, 10.5, 3.1], [8, -15, 8.5, 4.4], [14, -12, 7.5, 5.5], [-20, -6, 6.5, 2.2], [20, -6, 6.5, 0.9], [-3, -14, 6.5, 5.9], [4, -14, 6.5, 2.7]].forEach(([u, v, sc, r]) => {
        const [x, z] = P.W(u, v); rm.push(new THREE.Matrix4().compose(new THREE.Vector3(x, P.y0 + 0.8, z), new THREE.Quaternion().setFromAxisAngle(Y, ry + r), new THREE.Vector3(sc * 0.46, sc * 0.6, sc * 0.46)));
      });
      const gl = A.models && A.models.cliff1;
      if (gl) { const g = new THREE.Group(); for (const m of instance(scene, gl, rm, { cast: !!Q.shadows })) g.add(m); sheet(ENT.lair, 1, g); }
    }
    // the cave mouth: stone arch (piers + lintel) around a dark opening
    P.box(0, 4.6, -9.2, 8.4, 8.6, 1.4, DARK);
    for (const e of [-1, 1]) { P.box(e * 5.2, 5.0, -8.6, 2.6, 10, 2.6, SK.wall, { worldUV: 0.1, tint: 0xe4e6ee }); P.box(e * 5.2, 10.3, -8.6, 3.2, 0.7, 3.2, SK.base, { tint: 0xe6e8f0 }); }
    P.box(0, 10.9, -8.6, 13.4, 2.4, 3.0, SK.wall, { worldUV: 0.1, tint: 0xe4e6ee }); P.box(0, 12.3, -8.6, 14.2, 0.5, 3.4, SK.base, { tint: 0xe6e8f0 });
    P.box(0, 10.9, -7.0, 8.0, 0.9, 0.2, SK.rune, { uvScale: [0.9, 1] });
    // the nest: a ring of boulders, eggs inside (props)
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; P.box(Math.cos(a) * 5.4, 2.4, 3 + Math.sin(a) * 4.2, 2.0, 1.6, 2.0, rockMat, { worldUV: 0.2, tint: 0x8a867e }); }
    P.at(5, () => { for (const e of [-1, 1]) { P.box(e * 12, 5.6, 6, 2.3, 9.6, 2.3, SK.wall, { worldUV: 0.1, tint: 0xe4e6ee }); P.box(e * 12, 10.7, 6, 3.0, 0.6, 3.0, SK.gold); } });
    P.at(10, () => { for (const [u, v, h] of [[-8.8, 11.5, 5], [8.8, 11.5, 5], [0, 14, 6.4]]) P.cone(u, 2.0 + h / 2, v, 1.2, h, SK.wall, { worldUV: 0.2 }, 5); });
    P.at(14, () => { for (const e of [-1, 1]) { P.cone(e * 6.2, 14.0, -8.6, 0.9, 4.2, SK.gold, {}, 6); } P.box(0, 13.0, -8.6, 15, 0.4, 3.8, SK.gold); });
    P.at(18, () => { for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2 + 0.2; if (Math.sin(a) < -0.3) continue; P.box(Math.cos(a) * 17.5, 4.0, 4 + Math.sin(a) * 15.5, 2.4, 5.4, 2.4, SK.wall, { worldUV: 0.1, tint: 0xe4e6ee }); } });
    // turquoise crystals around the nest (the creatures' gem); eggs as glowing props
    const crys = new THREE.Group(), eggs = new THREE.Group(); const eggM = new THREE.MeshStandardMaterial({ color: 0x1c6f86, emissive: 0x2ad0e8, emissiveIntensity: 0.9, roughness: 0.35, metalness: 0.2 });
    const eg = new THREE.SphereGeometry(1, 14, 10), crysM = gemMaterial('turq', { envMapIntensity: 1.2, glow: 0.3 });
    [[-2.2, 3.4, 0], [1.4, 2.4, 1], [0.2, 5.6, 5], [3.6, 4.6, 8], [-3.8, 5.2, 11], [-0.8, 0.9, 14], [3.0, 0.6, 16], [-2.8, 1.8, 18]].forEach(([u, v, mn], i) => {
      const e = new THREE.Mesh(eg, eggM), [x, z] = P.W(u, v); e.position.set(x, P.y0 + 2.35, z); e.scale.set(0.8, 1.1, 0.8); e.rotation.set((i % 3 - 1) * 0.12, i, 0); e.castShadow = !!Q.shadows; sheet(ENT.lair, Math.max(1, mn), e);
    });
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + 0.3, [x, z] = P.W(Math.cos(a) * 7.4, 3 + Math.sin(a) * 6); const c = new THREE.Mesh(gm, crysM); c.position.set(x, P.y0 + 1.8, z); c.scale.set(0.9, 1.1 + (k % 3) * 0.5, 0.9); c.rotation.set(0.1 * (k % 4 - 1.5), k, 0.1 * (k % 3 - 1)); sheet(ENT.lair, k < 3 ? 1 : k < 5 ? 8 : 14, c);
    }
    P.pick(16, 16);
  }

  // level hooks: props (eggs, hearth glow, siege models) follow the structure's level; smoke only while the forge is built
  const hook = () => {
    for (const [ent, arr] of Object.entries(props)) {
      const lv = levelOf(+ent);
      for (const p of arr) p.obj.visible = lv >= p.min;
      if (arr.smokers) for (const s of arr.smokers) s.off = lv < 1;
    }
  };
  ctx.levelHooks.push(hook); hook(); B.tag(0); B.bid(0);
  return { list: out };
}
