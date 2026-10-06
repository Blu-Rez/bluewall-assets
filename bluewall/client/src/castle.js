// The Blue Wall: outer & inner walls with glowing runes, towers, gatehouse,
// bridge and the keep. Everything static is batched per material.
import * as THREE from 'three';
import * as L from './layout.js';
import { mat4 } from './util.js';
import { rng } from './noise.js';
import { ENT } from './skin.js';
import { buildRoads } from './roads.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = (rt, rb, h, s = 14) => new THREE.CylinderGeometry(rt, rb, h, s, 1, false);
const CONE = (r, h, s = 14) => new THREE.ConeGeometry(r, h, s, 1, true);
const SLATE = 0x4d6fae, SLATE2 = 0x3b5891, STONE_T = 0xffffff, STONE_WARM = 0xe9e3da;

export function buildCastle(ctx) {
  const { B, M } = ctx;
  const r = rng(99);
  const put = (geo, mat, m, o) => B.add(geo, mat, m, o);
  const box = (mat, x, y, z, ry, sx, sy, sz, o = {}) => put(BOX, mat, mat4(x, y, z, ry, sx, sy, sz), o);
  const stoneUV = { worldUV: 0.085 };

  // ------------------------------------------------ wall run along a polygon
  function wallRun(poly, H, T, towerR, gateSeg, gateHalf, opts) {
    const n = poly.length;
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n];
      const dx = b[0] - a[0], dz = b[1] - a[1], Ltot = Math.hypot(dx, dz), ux = dx / Ltot, uz = dz / Ltot;
      const ry = Math.atan2(-dz, dx);
      const out = L.segNormalOut(poly, i);
      const isGate = Array.isArray(gateSeg) ? gateSeg.includes(i) : i === gateSeg;
      // p38: a river may run through the wall (water gates, opts.wgates): the wall is cut there too, and a stone arch carries the wall walk over the water
      const gaps = []; if (isGate) gaps.push([Ltot / 2 - gateHalf, Ltot / 2 + gateHalf]);
      for (const W of opts.wgates || []) if (W.seg === i) gaps.push([W.c - W.half, W.c + W.half]);
      gaps.sort((p, q) => p[0] - q[0]);
      const pieces = []; { let cur = towerR * 0.6; for (const [g0, g1] of gaps) { if (g0 - cur > 0.5) pieces.push([cur, g0]); cur = g1; } if (Ltot - towerR * 0.6 - cur > 0.5) pieces.push([cur, Ltot - towerR * 0.6]); }
      for (const [s0, s1] of pieces) {
        const len = s1 - s0, cx = a[0] + ux * (s0 + len / 2), cz = a[1] + uz * (s0 + len / 2);
        ctx.tgt({ type: 'wall', ringId: opts.ring, seg: i, x: cx, z: cz, w: len, d: T, h: H, rot: ry, a: [a[0] + ux * s0, a[1] + uz * s0], b: [a[0] + ux * s1, a[1] + uz * s1] });
        box(M.stoneDark, cx, 0.6, cz, ry, len, 1.2, T + 1.4, { ...stoneUV, tint: 0xc9ccd6 });           // plinth
        box(M.stone, cx, H / 2, cz, ry, len, H, T, { ...stoneUV, tint: STONE_T });                        // body
        box(M.stoneDark, cx, H + 0.02, cz, ry, len, 0.25, T - 0.6, { ...stoneUV, tint: 0x9aa0ad });       // walkway
        // rune bands on both faces
        for (const side of [1, -1]) {
          const ox = out[0] * side * (T / 2 + 0.06), oz = out[1] * side * (T / 2 + 0.06);
          if (opts.runeH > 0) box(M.rune, cx + ox, H * 0.62, cz + oz, ry, len - 0.4, opts.runeH, 0.1, { uvScale: [len / 11, 1] });
          // cornice under the parapet
          box(M.stoneDark, cx + out[0] * side * (T / 2 + 0.15), H - 0.35, cz + out[1] * side * (T / 2 + 0.15), ry, len, 0.5, 0.35, { ...stoneUV, tint: 0xb9bdc8 });
        }
        // merlons (both edges)
        const step = 2.3, cnt = Math.max(1, Math.floor((len - 1) / step));
        for (let k = 0; k < cnt; k++) {
          const s = s0 + (len - (cnt - 1) * step) / 2 + k * step;
          const px = a[0] + ux * s, pz = a[1] + uz * s;
          for (const side of [1, -1]) {
            const e = side * (T / 2 - 0.35);
            box(M.stone, px + out[0] * e, H + 0.85, pz + out[1] * e, ry, 1.25, 1.7, 0.7, { ...stoneUV, tint: STONE_T });
          }
        }
        // tapestries hanging down the outer face, under the cornice (her_flags.js: waving cloth with the realm's crest)
        if (opts.tapestry && len > 16) {
          const n = opts.tapestry, tw = opts.tapW || 2.6, hh = H - 0.72 - (opts.tapFoot || 2.9), h = hh / 1.12, ry2 = Math.atan2(out[0], out[1]);
          for (let k = 0; k < n; k++) {
            const s = s0 + len * (k + 1) / (n + 1), off = T / 2 + 0.2;
            ctx.banner(a[0] + ux * s + out[0] * off, H - 0.72 - h / 2, a[1] + uz * s + out[1] * off, ry2, tw, h, { tapestry: true });
          }
        }
        // a few torches along long walls (inner face)
        if (opts.torches && len > 26) {
          for (const f of [0.33, 0.66]) {
            const s = s0 + len * f, px = a[0] + ux * s - out[0] * (T / 2 + 0.3), pz = a[1] + uz * s - out[1] * (T / 2 + 0.3);
            ctx.torch(px, H * 0.55, pz, { pool: true, sconce: true, ry });
          }
        }
      }
    }
    // water gates: where the river runs through the wall
    for (const W of opts.wgates || []) waterGate(poly, W, H, T, opts);
    // towers
    for (let i = 0; i < n; i++) tower(poly[i][0], poly[i][1], towerR, H, opts, i);
    B.bid(0);
  }

  // p38 — a water gate: the river flows through a wide stone arch under the wall (the wall walk and the merlons run on over the top), two bastion piers with torches,
  // a raised iron grating hanging in the opening, stone lining of the channel through the wall.
  function waterGate(poly, W, H, T, opts) {
    const a = poly[W.seg], b = poly[(W.seg + 1) % poly.length], Lt = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / Lt, uz = (b[1] - a[1]) / Lt, ry = Math.atan2(-uz, ux), out = L.segNormalOut(poly, W.seg);
    const cx = a[0] + ux * W.c, cz = a[1] + uz * W.c, hw = W.half, yTop = 5.0;
    B.tag(ENT.wall);
    // the wall over the water: body from the arch crown up to the walk, cornice, walk, merlons
    const lintel = (y0, y1, lw, th, o = {}) => box(M.stone, cx, (y0 + y1) / 2, cz, ry, lw, y1 - y0, th, { ...stoneUV, ...o });
    lintel(yTop, H, 2 * hw + 0.4, T, { tint: STONE_T });
    box(M.stoneDark, cx, yTop - 0.15, cz, ry, 2 * hw + 0.8, 0.5, T + 0.5, { ...stoneUV, tint: 0xb9bdc8 });                              // arch soffit band
    box(M.stoneDark, cx, H + 0.02, cz, ry, 2 * hw + 0.4, 0.25, T - 0.6, { ...stoneUV, tint: 0x9aa0ad });                                // walk
    for (const side of [1, -1]) {
      const ox = out[0] * side * (T / 2 + 0.06), oz = out[1] * side * (T / 2 + 0.06);
      if (opts.runeH > 0) box(M.rune, cx + ox, H * 0.78, cz + oz, ry, 2 * hw - 0.4, opts.runeH, 0.1, { uvScale: [(2 * hw) / 11, 1] });
      box(M.stoneDark, cx + out[0] * side * (T / 2 + 0.15), H - 0.35, cz + out[1] * side * (T / 2 + 0.15), ry, 2 * hw + 0.4, 0.5, 0.35, { ...stoneUV, tint: 0xb9bdc8 });
      for (let k = 0, cnt = Math.floor(2 * hw / 2.3); k < cnt; k++) { const s = -hw + (2 * hw - (cnt - 1) * 2.3) / 2 + k * 2.3; box(M.stone, cx + ux * s + out[0] * side * (T / 2 - 0.35), H + 0.85, cz + uz * s + out[1] * side * (T / 2 - 0.35), ry, 1.25, 1.7, 0.7, { ...stoneUV, tint: STONE_T }); }
    }
    // arch: a keystone-like stepped soffit (three stepped blocks each side give the corner a rounded look), pier faces
    for (const e of [-1, 1]) {
      const px = cx + ux * e * (hw + 0.1), pz = cz + uz * e * (hw + 0.1);
      box(M.stoneDark, px, 1.3, pz, ry, 1.5, 6.6, T + 1.8, { ...stoneUV, tint: 0xc9ccd6 });                                              // bastion pier (stands in the bank)
      box(M.stone, cx + ux * e * (hw - 0.7), yTop - 0.4, cz + uz * e * (hw - 0.7), ry, 1.6, 0.8, T + 0.2, { ...stoneUV, tint: 0xd5d0c6 });   // arch corbel
      box(M.stone, cx + ux * e * (hw - 1.6), yTop - 0.15, cz + uz * e * (hw - 1.6), ry, 1.4, 0.5, T + 0.2, { ...stoneUV, tint: 0xd5d0c6 });
      // quay lining of the channel: a stone wall each side of the water, down to the river bed
      box(M.stone, cx + ux * e * (hw - 0.45), -0.9, cz + uz * e * (hw - 0.45), ry, 0.9, 3.6, T + 0.8, { ...stoneUV, tint: 0xb8bcc6 });
      ctx.torch(px + out[0] * (T / 2 + 1.2), 3.6, pz + out[1] * (T / 2 + 1.2), { pool: true, sconce: true, ry: Math.atan2(out[0], out[1]) });
      ctx.torch(px - out[0] * (T / 2 + 1.2), 3.6, pz - out[1] * (T / 2 + 1.2), { pool: true, sconce: true, ry: Math.atan2(-out[0], -out[1]) });
    }
    // the iron grating (raised: its teeth hang from the arch over the water), cross bars
    for (let k = -hw + 1.0; k <= hw - 0.9; k += 1.05) box(M.metal, cx + ux * k, yTop - 1.1, cz + uz * k, ry, 0.15, 2.6, 0.15);
    for (const yy of [yTop - 0.4, yTop - 1.5]) box(M.metal, cx, yy, cz, ry, 2 * hw - 1.4, 0.15, 0.15);
    ctx.pick({ x: cx, z: cz, y0: 0, y1: H + 2, r: hw + 2 }, 'wall');
  }

  function tower(x, z, R, H, opts, i) {
    const h = H + 5.5 + (i % 3 === 0 ? 2 : 0);
    // which war machine stands on an unroofed tower: every 2nd one of the ring is a ballista, the others cannons (the ONE place that decides it: the sim reads it from the target as `wk`,
    // the weapons on the towers are built from the same value, so what you see is what shoots: cannon = ground-only splash with a blind spot, ballista = anti-air / anti-heavy)
    // p32 X: of the unroofed (flat) towers every 2nd is a ballista, the others alternate cannon / quad (the four-barrel house); of the ROOFED towers every 3rd carries a wizard (the little mage on the top)
    let wk = null;
    // p35: of the even (ballista) ones every 2nd is a DRAGONBANE (the big anti-air ballista); of the roofed towers that are not wizards, the 2nd of every 3 carries a FROST SPIRE and the 3rd a FLAME TOWER (the 1st keeps its roof)
    if (!opts.roof(i)) { let k = 0; for (let j = 0; j < i; j++) if (!opts.roof(j)) k++; wk = k % 2 === 0 ? ((k >> 1) % 2 === 1 ? 'dragonbane' : 'ballista') : (((k - 1) >> 1) % 2 === 0 ? 'cannon' : 'quad'); }
    else { let r = 0, q = 0; for (let j = 0; j < i; j++) if (opts.roof(j)) { if (r % 3 !== 2) q++; r++; } if (r % 3 === 2) wk = 'wizard'; else if (q % 3 === 1) wk = 'frost'; else if (q % 3 === 2) wk = 'flame'; }
    ctx.tgt({ type: opts.roof(i) ? 'tower' : 'ballista', ringId: opts.ring, seg: i, x, z, w: 2 * R + 1, d: 2 * R + 1, h: h + 4, rot: 0, def: true, ...(wk ? { wk } : {}) });
    put(CYL(R + 0.9, R + 1.3, 1.6), M.stoneDark, mat4(x, 0.8, z), { ...stoneUV, tint: 0xc9ccd6 });
    put(CYL(R, R + 0.35, h), M.stone, mat4(x, h / 2, z), { ...stoneUV, tint: STONE_T });
    put(CYL(R + 0.7, R + 0.1, 1.2), M.stoneDark, mat4(x, h - 0.2, z), { ...stoneUV, tint: 0xb9bdc8 });
    put(CYL(R + 0.7, R + 0.7, 0.5), M.stoneDark, mat4(x, h + 0.55, z), { ...stoneUV, tint: 0x9aa0ad });
    // rune ring
    if (opts.runeH > 0) put(new THREE.CylinderGeometry(R + 0.4, R + 0.4, opts.runeH, 18, 1, true), M.rune, mat4(x, H * 0.62, z), { uvScale: [(R * 6.28) / 11, 1] });
    const mc = Math.round(R * 2.3);
    for (let k = 0; k < mc; k++) {
      const a = (k / mc) * Math.PI * 2;
      box(M.stone, x + Math.cos(a) * (R + 0.35), h + 1.6, z + Math.sin(a) * (R + 0.35), -a, 0.7, 1.7, 1.25, { ...stoneUV, tint: STONE_T });
    }
    // windows (warm glow slits) facing outward-ish
    const wc = 3;
    for (let k = 0; k < wc; k++) {
      const a = Math.atan2(z, x) + (k - 1) * 0.9 + r() * 0.2, wy = 4 + k * 2.6 + r() * 1.5;
      const lit = r() < 0.75;
      box(lit ? M.window : M.dark, x + Math.cos(a) * (R + 0.2), wy, z + Math.sin(a) * (R + 0.2), -a, 0.3, 1.3, 0.55);
    }
    const roofed = opts.roof(i), wiz = roofed && wk === 'wizard', cap = roofed && (wk === 'frost' || wk === 'flame');
    if (roofed) {
      // p32 X1 — the wizard tower: the roof stands on four stone pillars so the little mage can be seen under it, casting; a glowing blue orb crowns it
      const LIFT = wiz ? 3.9 : 0, hr = h + LIFT;
      if (wiz) {
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + Math.PI / 4, px = x + Math.cos(a) * (R + 0.7), pz = z + Math.sin(a) * (R + 0.7);
          put(CYL(0.3, 0.36, LIFT + 0.3, 8), M.stone, mat4(px, h + 1.7 + LIFT / 2, pz), { ...stoneUV, tint: STONE_T });
          put(CYL(0.5, 0.5, 0.35, 8), M.stoneDark, mat4(px, h + 1.9, pz), { ...stoneUV, tint: 0x9aa0ad });
        }
        put(CYL(R + 1.5, R + 1.5, 0.4, 20), M.stoneDark, mat4(x, hr + 1.75, z), { ...stoneUV, tint: 0x8d94a3 });     // the ring beam the roof sits on
      }
      if (cap) {                                                  // p35: no roof: a stone cap (the frost spire / flame tower of spires.js stands on it)
        put(CYL(R + 1.25, R + 1.25, 0.5, 18), M.stone, mat4(x, hr + 1.8, z), { ...stoneUV, tint: 0xc3c8d4 });
        put(CYL(R + 1.05, R + 0.8, 0.5, 18), M.stone, mat4(x, hr + 2.3, z), { ...stoneUV, tint: STONE_T });
        ctx.weapon(x, hr + 2.55, z, Math.atan2(z, x), wk, R);
      } else {
      const top = ctx.towerRoof ? ctx.towerRoof(x, hr + 1.7, z, R + 1.25, i) : null;
      const rh = top ? top - (hr + 1.7) : R * 1.9 + 2;
      if (!top) put(CONE(R + 1.25, rh, 16), M.roof, mat4(x, hr + 1.0 + rh / 2 + 0.6, z), { tint: i % 2 ? SLATE : SLATE2, uvScale: [5, 3] });
      put(new THREE.CylinderGeometry(R + 1.25, R + 1.25, 0.25, 16), M.stoneDark, mat4(x, hr + 1.7, z), { tint: 0x7d8594 });
      put(new THREE.SphereGeometry(wiz ? 0.7 : 0.45, 12, 9), wiz ? M.rune : M.gold, mat4(x, hr + 1.7 + rh + 0.3, z));
      put(CYL(0.06, 0.1, 4.5, 6), M.wood, mat4(x, hr + 1.7 + rh + 2.75, z), { tint: 0x4a3424 });
      ctx.flag(x, hr + 1.7 + rh + 5.0 - 0.55, z, Math.atan2(z, x) + 0.6, 1.0);
      }
      if (wiz) ctx.weapon(x, h + 1.85, z, Math.atan2(z, x), 'wizard');                                               // (the mage on the platform: wizards.js)
    } else {
      ctx.weapon(x, h + 0.8, z, Math.atan2(z, x), wk, R);
      ctx.torch(x + R * 0.5, h + 2.2, z + R * 0.2, { pool: false, post: true });
    }
    ctx.pick({ x, z, y0: 0, y1: h + 6, r: R + 1 }, 'tower');
    if (opts.onTower) opts.onTower(x, z, h, i);
  }

  // ------------------------------------------------ town gatehouse (two square towers, arch, portcullis, bridge over the outer moat)
  function townGate(G, poly) {
    const a = poly[G.seg], b = poly[(G.seg + 1) % poly.length];
    const al = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / al, dz = (b[1] - a[1]) / al, ry = Math.atan2(-dz, dx);
    const H = 13, half = 5.2, gw = half + 3.2 + 3.6;
    ctx.tgt({ type: 'gate', ringId: 'town', x: G.x, z: G.z, w: 2 * gw, d: 7.6, h: H + 4, rot: ry, a: [G.x - dx * gw, G.z - dz * gw], b: [G.x + dx * gw, G.z + dz * gw] });
    for (const e of [-1, 1]) {
      const tx = G.x + dx * e * (half + 3.2), tz = G.z + dz * e * (half + 3.2);
      box(M.stoneDark, tx, 0.8, tz, ry, 7.2, 1.6, 7.6, { ...stoneUV, tint: 0xc9ccd6 });
      box(M.stone, tx, H / 2, tz, ry, 6.2, H, 6.6, { ...stoneUV, tint: STONE_WARM });
      box(M.stoneDark, tx, H + 0.3, tz, ry, 7, 0.7, 7.4, { ...stoneUV, tint: 0x9aa0ad });
      for (let k = 0; k < 3; k++) for (const f of [-1, 1]) {
        box(M.stone, tx + dx * (-2.2 + k * 2.2) + G.nx * f * 3.3, H + 1.4, tz + dz * (-2.2 + k * 2.2) + G.nz * f * 3.3, ry, 1.1, 1.5, 0.6, { ...stoneUV });
        box(M.stone, tx + G.nx * (-2.2 + k * 2.2) + dx * f * 3.1, H + 1.4, tz + G.nz * (-2.2 + k * 2.2) + dz * f * 3.1, ry + Math.PI / 2, 1.1, 1.5, 0.6, { ...stoneUV });
      }
      put(CONE(5.2, 7, 4), M.roof, mat4(tx, H + 4.8, tz, ry + Math.PI / 4), { tint: SLATE2, uvScale: [4, 3] });
      put(new THREE.SphereGeometry(0.4, 8, 6), M.gold, mat4(tx, H + 8.5, tz));
      box(M.rune, tx + G.nx * 3.36, H * 0.55, tz + G.nz * 3.36, ry, 5.8, 0.8, 0.1, { uvScale: [0.55, 1] });
      for (const wy of [5, 9]) box(M.window, tx + G.nx * 3.36, wy, tz + G.nz * 3.36, ry, 0.8, 1.4, 0.2);
      ctx.flag(tx, H + 12.2 - 0.66, tz, Math.atan2(G.nx, G.nz) + 0.5, 1.2);
      put(CYL(0.07, 0.11, 4, 6), M.wood, mat4(tx, H + 10.2, tz), { tint: 0x4a3424 });
    }
    box(M.stone, G.x, 10.6, G.z, ry, 2 * half + 0.4, 4.6, 4.6, { ...stoneUV, tint: STONE_WARM });
    box(M.stoneDark, G.x, 8.2, G.z, ry, 2 * half + 0.4, 0.5, 5, { ...stoneUV, tint: 0x9aa0ad });
    for (let k = 0; k < 5; k++) for (const f of [-1, 1]) box(M.stone, G.x + dx * (-4.4 + k * 2.2) + G.nx * f * 2, 13.6, G.z + dz * (-4.4 + k * 2.2) + G.nz * f * 2, ry, 1.1, 1.5, 0.6, { ...stoneUV });
    ctx.banner(G.x + G.nx * 2.42, 10.4, G.z + G.nz * 2.42, Math.atan2(G.nx, G.nz), 3.4, 3.2);
    for (let k = -4.6; k <= 4.6; k += 1.15) box(M.metal, G.x + dx * k + G.nx * 0.6, 4.6, G.z + dz * k + G.nz * 0.6, ry, 0.16, 6.6, 0.16);
    for (let yy = 2.2; yy < 8; yy += 1.4) box(M.metal, G.x + G.nx * 0.65, yy, G.z + G.nz * 0.65, ry, 2 * half - 0.4, 0.14, 0.14);
    ctx.pick({ x: G.x, z: G.z, y0: 0, y1: 16, r: 7 }, 'gate');
    for (const e of [-1, 1]) ctx.torch(G.x + G.nx * 3 + dx * e * 5.6, 4.4, G.z + G.nz * 3 + dz * e * 5.6, { pool: true, sconce: true, ry: Math.atan2(G.nx, G.nz) });
    B.bid(0);                                                  // the bridge stays up
    // bridge over the outer moat
    const off = L.MOAT2.off + 0.5, bl = 17, bw = 7.6, bcx = G.x + G.nx * off, bcz = G.z + G.nz * off, bry = Math.atan2(-G.nz, G.nx);
    box(M.stone, bcx, -0.15, bcz, bry, bl, 1.6, bw, { ...stoneUV, tint: 0xd9d6d0 });
    box(M.stoneDark, bcx, 0.68, bcz, bry, bl, 0.12, bw - 1, { ...stoneUV, tint: 0x8d8a86 });
    for (const e of [-1, 1]) {
      box(M.stone, bcx + dx * e * (bw / 2 - 0.4), 1.2, bcz + dz * e * (bw / 2 - 0.4), bry, bl, 1.1, 0.6, { ...stoneUV });
      for (const f of [-0.5, 0.5]) { const px = bcx + G.nx * f * bl + dx * e * (bw / 2 - 0.4), pz = bcz + G.nz * f * bl + dz * e * (bw / 2 - 0.4); box(M.stone, px, 1.7, pz, bry, 1, 2.4, 1, { ...stoneUV }); }
    }
    for (const f of [-0.28, 0.28]) box(M.stoneDark, bcx + G.nx * f * bl, -1.6, bcz + G.nz * f * bl, bry, 2, 2.4, bw - 0.6, { ...stoneUV });
  }

  // ------------------------------------------------ stone bridges over the river (road crossings): deck, two parapets with posts, piers in the water
  function riverBridge(RB) {
    B.tag(0); B.bid(0);
    const bl = RB.len, bw = RB.wid, tx = -RB.nz, tz = RB.nx, bry = Math.atan2(-RB.nz, RB.nx), bcx = RB.x, bcz = RB.z;
    box(M.stone, bcx, -0.15, bcz, bry, bl, 1.6, bw, { ...stoneUV, tint: 0xd9d6d0 });
    box(M.stoneDark, bcx, 0.68, bcz, bry, bl, 0.12, bw - 1, { ...stoneUV, tint: 0x8d8a86 });
    for (const e of [-1, 1]) {
      box(M.stone, bcx + tx * e * (bw / 2 - 0.4), 1.2, bcz + tz * e * (bw / 2 - 0.4), bry, bl, 1.1, 0.6, { ...stoneUV });
      for (const f of [-0.5, -0.25, 0, 0.25, 0.5]) { const px = bcx + RB.nx * f * bl + tx * e * (bw / 2 - 0.4), pz = bcz + RB.nz * f * bl + tz * e * (bw / 2 - 0.4); box(M.stone, px, 1.7, pz, bry, 0.9, 2.2, 0.9, { ...stoneUV }); }
    }
    for (const f of [-0.3, 0.3]) box(M.stoneDark, bcx + RB.nx * f * bl, -1.6, bcz + RB.nz * f * bl, bry, 2, 2.4, bw - 0.6, { ...stoneUV });
  }
  buildRoads();                                                             // (the bridges over the river are found from the roads: roads.js autoBridges)
  for (const RB of L.RBRIDGES) riverBridge(RB);

  // ------------------------------------------------ p38: the river inside the town wall is a canal: a stone quay on both banks (one block every ~3 m, a coping stone on top), left out under the bridges and in the water gates
  function riverQuay() {
    const P = L.RIVER; B.tag(0); B.bid(0);
    const bridged = (x, z) => L.RBRIDGES.some((b) => { const dx = x - b.x, dz = z - b.z, u = dx * b.nx + dz * b.nz, v = -dx * b.nz + dz * b.nx; return Math.abs(u) <= b.len / 2 + 1 && Math.abs(v) <= b.wid / 2 + 1.2; });
    const gated = (x, z) => (L.WGATES || []).some((W) => { const a = L.TOWN[W.seg], b = L.TOWN[(W.seg + 1) % L.TOWN.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), cx = a[0] + (b[0] - a[0]) / l * W.c, cz = a[1] + (b[1] - a[1]) / l * W.c; return Math.hypot(x - cx, z - cz) < W.half + 6; });
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, nx = -uz, nz = ux, ry = Math.atan2(-uz, ux);
      const n = Math.max(1, Math.round(len / 3)), seg = len / n;
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n, cx = a[0] + dx * t, cz = a[1] + dz * t;
        if (L.sdTown(cx, cz) > -4 || bridged(cx, cz) || gated(cx, cz)) continue;
        for (const e of [-1, 1]) {
          const px = cx + nx * e * 5.5, pz = cz + nz * e * 5.5;
          box(M.stone, px, -0.65, pz, ry, seg + 0.5, 2.7, 0.8, { ...stoneUV, tint: k % 2 ? 0xbfc4ce : 0xb3b9c4 });
          box(M.stoneDark, cx + nx * e * 5.75, 0.74, cz + nz * e * 5.75, ry, seg + 0.5, 0.18, 1.3, { ...stoneUV, tint: 0xd5d8df });
        }
      }
    }
  }
  if (L.TOWN) riverQuay();

  // ------------------------------------------------ outer + inner walls
  const outerRoof = (i) => i % 2 === 0 || i === 8;
  B.tag(ENT.wall);
  wallRun(L.OUTER, L.WALL.outer.H, L.WALL.outer.T, L.WALL.outer.R, L.GATE_SEG, 7.5, { ring: 'outer', runeH: 1.15, torches: true, roof: outerRoof, tapestry: 2 });
  B.tag(ENT.keep);
  wallRun(L.INNER, L.WALL.inner.H, L.WALL.inner.T, L.WALL.inner.R, L.INNER_GATE_SEG, 4.5, { ring: 'inner', runeH: 0.9, torches: false, roof: () => true, tapestry: 1, tapW: 2.0, tapFoot: 2.6 });
  // third ring: the lower town's wall (a little lower, thinner rune band), two gatehouses with bridges
  if (L.TOWN) {
    B.tag(ENT.wall);
    wallRun(L.TOWN, L.WALL.town.H, L.WALL.town.T, L.WALL.town.R, L.TOWN_GATES, 5.2, { ring: 'town', wgates: L.WGATES, runeH: 0.55, torches: true, roof: (i) => i % 3 === 1, onTower: ctx.townTower, tapestry: 1, tapW: 2.4, tapFoot: 2.6 });
    for (let i = 0; i < L.TOWN.length; i++) { const m = L.segMid(L.TOWN, i); ctx.pick({ x: m[0], z: m[1], y0: 0, y1: 10, r: 5 }, 'wall'); }
    for (const TG of L.TGATES) townGate(TG, L.TOWN);
  }
  B.tag(ENT.wall);
  ctx.pick({ x: L.OUTER[0][0], z: L.OUTER[0][1], y0: 0, y1: 1, r: 0 }, 'wall'); // (wall itself picked via segments below)
  for (let i = 0; i < L.OUTER.length; i++) {
    const m = L.segMid(L.OUTER, i);
    ctx.pick({ x: m[0], z: m[1], y0: 0, y1: 11, r: 5 }, 'wall');
  }

  // ------------------------------------------------ gatehouse
  const G = L.GATE;
  {
    const ux = Math.cos(-G.rot + Math.PI / 2), uz = Math.sin(-G.rot + Math.PI / 2);
    const ax = L.OUTER[L.GATE_SEG + 1][0] - L.OUTER[L.GATE_SEG][0], az = L.OUTER[L.GATE_SEG + 1][1] - L.OUTER[L.GATE_SEG][1];
    const al = Math.hypot(ax, az), dx = ax / al, dz = az / al, ry = Math.atan2(-dz, dx);
    void ux; void uz;
    const H = 17, half = 7.5, gw = half + 1.2 + 4.3;
    ctx.tgt({ type: 'gate', ringId: 'outer', x: G.x, z: G.z, w: 2 * gw, d: 8.6, h: H + 8, rot: ry, a: [G.x - dx * gw, G.z - dz * gw], b: [G.x + dx * gw, G.z + dz * gw] });
    for (const s of [-1, 1]) {
      const tx = G.x + dx * s * (half + 1.2), tz = G.z + dz * s * (half + 1.2);
      box(M.stoneDark, tx, 0.9, tz, ry, 8.6, 1.8, 8.6, { ...stoneUV, tint: 0xc9ccd6 });
      box(M.stone, tx, H / 2, tz, ry, 7.4, H, 7.4, { ...stoneUV, tint: STONE_WARM });
      box(M.stoneDark, tx, H + 0.3, tz, ry, 8.4, 0.8, 8.4, { ...stoneUV, tint: 0x9aa0ad });
      for (let k = 0; k < 4; k++) for (const e of [-1, 1]) {
        const along = -3.3 + k * 2.2;
        box(M.stone, tx + dx * along + G.nx * e * 3.8, H + 1.5, tz + dz * along + G.nz * e * 3.8, ry, 1.2, 1.6, 0.7, { ...stoneUV });
        box(M.stone, tx + G.nx * along + dx * e * 3.8, H + 1.5, tz + G.nz * along + dz * e * 3.8, ry + Math.PI / 2, 1.2, 1.6, 0.7, { ...stoneUV });
      }
      put(CONE(6.3, 9, 4), M.roof, mat4(tx, H + 6.2, tz, ry + Math.PI / 4), { tint: SLATE2, uvScale: [4, 3] });
      put(new THREE.SphereGeometry(0.5, 10, 8), M.gold, mat4(tx, H + 11, tz));
      // rune band + windows facing out
      box(M.rune, tx + G.nx * 3.75, H * 0.6, tz + G.nz * 3.75, ry, 7.2, 1.2, 0.1, { uvScale: [0.65, 1] });
      for (const wy of [6, 11]) box(M.window, tx + G.nx * 3.75, wy, tz + G.nz * 3.75, ry, 0.9, 1.6, 0.2);
      ctx.banner(tx + G.nx * 3.85, H - 2.5, tz + G.nz * 3.85, Math.atan2(G.nx, G.nz), 3.2, 6);
      put(CYL(0.07, 0.11, 5, 6), M.wood, mat4(tx, H + 13.7, tz), { tint: 0x4a3424 });
      ctx.flag(tx, H + 16.2 - 0.72, tz, Math.atan2(G.nx, G.nz) + 0.5, 1.3);
      ctx.pick({ x: tx, z: tz, y0: 0, y1: H + 10, r: 5 }, 'gate');
    }
    // arch + lintel over the gap
    box(M.stone, G.x, 13.2, G.z, ry, 2 * half - 0.6, 5.6, 5.2, { ...stoneUV, tint: STONE_WARM });
    box(M.stoneDark, G.x, 10.2, G.z, ry, 2 * half - 0.6, 0.6, 5.8, { ...stoneUV, tint: 0x9aa0ad });
    for (let k = 0; k < 6; k++) for (const e of [-1, 1]) {
      const along = -5.4 + k * 2.15;
      box(M.stone, G.x + dx * along + G.nx * e * 2.3, 16.8, G.z + dz * along + G.nz * e * 2.3, ry, 1.2, 1.6, 0.7, { ...stoneUV });
    }
    ctx.plaque(G.x + G.nx * 2.66, 13.15, G.z + G.nz * 2.66, Math.atan2(G.nx, G.nz), 2 * half - 5.8, 3.1);
    // doors (dark wood) + portcullis
    box(M.wood, G.x - G.nx * 0.4, 5, G.z - G.nz * 0.4, ry, 2 * half - 1.2, 10, 0.8, { tint: 0x8a6a4a, worldUV: 0.25 });
    for (let k = -6; k <= 6; k += 1.1) box(M.metal, G.x + dx * k + G.nx * 0.35, 5.2, G.z + dz * k + G.nz * 0.35, ry, 0.18, 10.4, 0.18);
    for (let yy = 1; yy < 10.5; yy += 1.4) box(M.metal, G.x + G.nx * 0.45, yy, G.z + G.nz * 0.45, ry, 2 * half - 1.2, 0.16, 0.16);
    ctx.pick({ x: G.x, z: G.z, y0: 0, y1: 18, r: 7 }, 'gate');
    // braziers with real light
    for (const s of [-1, 1]) {
      const bx = G.x + G.nx * 6 + dx * s * 6.2, bz = G.z + G.nz * 6 + dz * s * 6.2;
      put(CYL(0.9, 0.5, 1.1, 10), M.metal, mat4(bx, 2.35, bz));
      put(CYL(0.25, 0.35, 2.0, 8), M.metal, mat4(bx, 1.0, bz));
      ctx.torch(bx, 3.3, bz, { pool: true, light: true, big: true });
    }
    B.bid(0);
    // stone bridge across the (inner) moat — the Blue Wall's own moat is gone now: only the town moat remains
    if (L.MOAT.on) {
    const bl = 16, bw = 8.2, bcx = G.x + G.nx * (L.MOAT.off + 0.5), bcz = G.z + G.nz * (L.MOAT.off + 0.5);
    const bry = Math.atan2(-G.nz, G.nx);
    box(M.stone, bcx, -0.2, bcz, bry, bl, 1.6, bw, { ...stoneUV, tint: 0xd9d6d0 });
    box(M.stoneDark, bcx, 0.62, bcz, bry, bl, 0.12, bw - 1, { ...stoneUV, tint: 0x8d8a86 });
    for (const e of [-1, 1]) {
      box(M.stone, bcx + dx * e * (bw / 2 - 0.4), 1.2, bcz + dz * e * (bw / 2 - 0.4), bry, bl, 1.2, 0.7, { ...stoneUV });
      for (const f of [-0.5, 0.5]) {
        const px = bcx + G.nx * f * bl + dx * e * (bw / 2 - 0.4), pz = bcz + G.nz * f * bl + dz * e * (bw / 2 - 0.4);
        box(M.stone, px, 1.8, pz, bry, 1.1, 2.6, 1.1, { ...stoneUV });
        ctx.torch(px, 3.5, pz, { pool: false, post: false });
      }
    }
    for (const f of [-0.28, 0.28]) box(M.stoneDark, bcx + G.nx * f * bl, -1.6, bcz + G.nz * f * bl, bry, 2.2, 2.4, bw - 0.6, { ...stoneUV });
    }
  }

  // ------------------------------------------------ keep (the great castle)
  B.tag(ENT.keep);
  ctx.tgt({ type: 'keep', x: L.KEEP.x, z: L.KEEP.z, w: 26, d: 18, h: 48, rot: L.KEEP.rot, def: true, keep: true });
  keep(ctx, put, box, stoneUV);
  B.bid(0); B.tag(0);
}

function keep(ctx, put, box, stoneUV) {
  const { M } = ctx, K = L.KEEP, c = Math.cos(K.rot), s = Math.sin(K.rot);
  const P = (lx, lz) => [K.x + lx * c + lz * s, K.z - lx * s + lz * c];
  const ry = K.rot;
  const B = (lx, y, lz, sx, sy, sz, mat = M.stone, o = {}) => { const [x, z] = P(lx, lz); box(mat, x, y, z, ry, sx, sy, sz, { ...stoneUV, tint: 0xffffff, ...o }); };
  // base hall
  B(0, 0.8, 0, 25, 1.6, 17, M.stoneDark, { tint: 0xc9ccd6 });
  B(0, 7, 0, 23, 14, 15, M.stone, { tint: 0xeeeae4 });
  B(0, 14.2, 0, 24, 0.6, 16, M.stoneDark, { tint: 0x9aa0ad });
  for (let k = -5; k <= 5; k++) for (const e of [-1, 1]) {
    B(k * 2.2, 15.3, e * 7.6, 1.3, 1.6, 0.7); if (Math.abs(k) <= 3) B(e * 11.6, 15.3, k * 2.2, 0.7, 1.6, 1.3);
  }
  // runes around the hall
  for (const e of [-1, 1]) { B(0, 9.5, e * 7.56, 22, 1.2, 0.1, M.rune, { worldUV: 0, uvScale: [2, 1], tint: 0xffffff }); }
  // windows
  for (let k = -4; k <= 4; k++) for (const e of [-1, 1]) {
    if (k === 0 && e === 1) continue;
    B(k * 2.4, 5, e * 7.55, 0.8, 1.8, 0.2, M.window, { worldUV: 0 });
    B(k * 2.4, 11.5, e * 7.55, 0.8, 1.6, 0.2, (k + e) % 3 ? M.window : M.dark, { worldUV: 0 });
  }
  // grand door
  B(0, 3.2, 7.6, 4, 6.4, 0.4, M.wood, { worldUV: 0.3, tint: 0x7a5a3a });
  B(0, 6.9, 7.65, 5, 0.8, 0.5, M.stoneDark, {});
  // upper tier
  B(-2, 18.5, 0, 14, 8, 10, M.stone, { tint: 0xe6e2dc });
  for (let k = -3; k <= 3; k++) for (const e of [-1, 1]) B(-2 + k * 2, 23.2, e * 5.2, 1.2, 1.4, 0.6);
  for (let k = -2; k <= 2; k++) B(-2 + k * 2.6, 19, 5.05, 0.8, 1.7, 0.2, M.window, { worldUV: 0 });
  // great tower
  B(6, 16, -1, 9, 32, 9, M.stone, { tint: 0xf2eee8 });
  B(6, 32.3, -1, 10.4, 0.8, 10.4, M.stoneDark, { tint: 0x9aa0ad });
  for (let k = -2; k <= 2; k++) for (const e of [-1, 1]) { B(6 + k * 2, 33.5, -1 + e * 5, 1.1, 1.6, 0.6); B(6 + e * 5, 33.5, -1 + k * 2, 0.6, 1.6, 1.1); }
  for (const wy of [20, 24, 28]) for (const e of [-1, 1]) { B(6, wy, -1 + e * 4.55, 1, 2, 0.2, M.window, { worldUV: 0 }); B(6 + e * 4.55, wy, -1, 0.2, 2, 1, wy === 24 ? M.dark : M.window, { worldUV: 0 }); }
  B(6, 26, 3.56, 8.6, 1.2, 0.1, M.rune, { worldUV: 0, uvScale: [0.8, 1] });
  {
    const [x, z] = P(6, -1);
    put(CONE(8.4, 13, 4), M.roof, mat4(x, 33 + 6.6 + 0.4, z, ry + Math.PI / 4), { tint: 0x35508a, uvScale: [5, 4] });
    put(new THREE.SphereGeometry(0.9, 12, 10), M.gold, mat4(x, 47.1, z));
    put(CYL(0.1, 0.17, 8.5, 8), M.wood, mat4(x, 51.85, z), { tint: 0x4a3424 });
    ctx.flag(x, 56.1 - 1.21, z, 0.4, 2.2);
    ctx.beacon(x, 47.1, z);
  }
  // corner towers
  for (const [lx, lz] of [[-11.5, -7.5], [11.5, -7.5], [-11.5, 7.5], [11.5, 7.5]]) {
    const [x, z] = P(lx, lz), R = 3.4, h = 21;
    put(CYL(R, R + 0.3, h), M.stone, mat4(x, h / 2, z), { ...stoneUV, tint: 0xf2eee8 });
    put(CYL(R + 0.6, R, 1), M.stoneDark, mat4(x, h, z), { ...stoneUV, tint: 0x9aa0ad });
    const top = ctx.towerRoof ? ctx.towerRoof(x, h + 0.5, z, R + 1.1, 1) : null;
    if (!top) put(CONE(R + 1.1, 9, 14), M.roof, mat4(x, h + 5, z), { tint: 0x4467a8, uvScale: [5, 3] });
    put(new THREE.SphereGeometry(0.4, 8, 6), M.gold, mat4(x, top ? top + 0.3 : h + 9.7, z));
    put(new THREE.CylinderGeometry(R + 0.35, R + 0.35, 1, 16, 1, true), M.rune, mat4(x, 12, z), { uvScale: [2, 1] });
    for (const wy of [8, 15]) { const a = Math.atan2(z - K.z, x - K.x); box(M.window, x + Math.cos(a) * (R + 0.2), wy, z + Math.sin(a) * (R + 0.2), -a, 0.3, 1.5, 0.6); }
  }
  // banner over the door
  { const [x, z] = P(0, 7.7); ctx.banner(x, 13.2, z, ry, 4.2, 7); }
  { const [x, z] = P(0, 9.5); ctx.torch(x - 2.6 * c, 4.6, z + 2.6 * s, { pool: true, light: true }); ctx.torch(x + 2.6 * c, 4.6, z - 2.6 * s, { pool: true }); }
  ctx.pick({ x: K.x, z: K.z, y0: 0, y1: 48, r: 13 }, 'keep');
}
