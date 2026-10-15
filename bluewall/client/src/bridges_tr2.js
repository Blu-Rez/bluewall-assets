// TR2_H step 3 — the procedural bridges of castle.js (13 river / stream bridges + the 2 town-gate moat bridges) made to look like bridges.  Own file; castle.js calls bridgeTr2() instead of its old three boxes.
//   Only the game's own materials (M.stone, M.stoneDark, M.wood: all of them are already in the castle batch => +0 draw calls, +0 programs) and plain boxes (no model is hand-built, no Tripo bridge is used —
//   that waits for Wingless's number).  What changes against the old bridge (a dark slab with 5 posts):
//     1. ONE palette: the pale blue-grey of the Tripo walls (a stone tint > 1 lightens the dark texture; the old deck was navy, the gate bridge sand-yellow);
//     2. the deck over the water is a thin slab (soffit 0.12 m, the old one was a 1.6 m block sunk under the waterline) on piers with cutwaters, and between the piers a stepped "fake arch" (4 courses of boxes, a
//        corbelled opening that follows a shallow segmental arch) — stone bridges only; the timber bridges stand on stone piers with stringers;
//     3. a real parapet: a wall with a coping + a post with a cap every ~4.5 m (stone bridges) / posts with two rails every ~2.3 m (timber bridges);
//     4. bridge heads: solid abutments over the banks (no hollow under the deck), end posts, two wing walls that flare out;
//     5. the footbridges and the long bridges (width <= 6) get a plank deck (M.wood) instead of stone.
//   Heights keep the game's numbers: deck surface 0.70 (nav.js DECK = 0.72), water -0.75.  Pure geometry: nothing here is a nav obstacle, a target or a light.
import * as THREE from 'three';

const C = (r, g, b) => new THREE.Color(r, g, b);
// linear multipliers on the (blue-grey) stone / wood textures (Batcher: tintLinear)
const PAL = {
  stone: [C(1.42, 1.36, 1.3), C(1.28, 1.24, 1.2)],            // two alternating courses (the castle's own procedural stone is 1.0; the first try, 1.7-2.0, blew out to white in the sun and went navy in shade)
  coping: C(1.6, 1.54, 1.46),
  dark: C(1.5, 1.46, 1.4),                                  // the road surface of a stone bridge (M.stoneDark)
  low: C(1.1, 1.06, 1.02),                                     // piers, abutments (a little darker: the part that stands in the water)
  wood: C(1.3, 1.14, 0.96), woodD: C(0.92, 0.78, 0.64),       // planks / posts, beams (the first try, 2.2 / 1.7 / 1.2, read orange)
};
export const BRIDGE_DECK = 0.70, WATER = -0.75, SOFFIT = 0.12;

// box(mat, x, y, z, ry, sx, sy, sz, opts) = castle.js's helper; ground(x, z) = the terrain height; b = { x, z, nx, nz, len, wid }; opts.wood: force the timber type
export function bridgeTr2(box, M, ground, b, opts = {}) {
  const { x: cx, z: cz, nx, nz, len, wid } = b, tx = -nz, tz = nx, bry = Math.atan2(-nz, nx);
  const wood = opts.wood != null ? opts.wood : wid < 6.5;
  const T = (c) => ({ tint: c, tintLinear: true, worldUV: 0.3 });
  const P = (u, y, v, su, sy, sv, mat, o, dry = 0) => box(mat, cx + nx * u + tx * v, y, cz + nz * u + tz * v, bry + dry, su, sy, sv, o);
  const gh = (u, v = 0) => ground(cx + nx * u + tx * v, cz + nz * u + tz * v);
  const hl = len / 2;

  // ---- where the water is (the middle line, every 0.5 m): [a, b] = the water + 0.6 m of bank each side
  let w0 = null, w1 = null;
  for (let u = -hl; u <= hl + 1e-6; u += 0.5) if (gh(u) < -0.45) { if (w0 === null) w0 = u; w1 = u; }
  const wet = w0 !== null && w1 - w0 > 1.5;
  const a = wet ? Math.max(-hl + 1.5, w0 - 0.6) : 0, e = wet ? Math.min(hl - 1.5, w1 + 0.6) : 0;

  // ---- deck: over the banks a solid block (nothing hollow under it), over the water a thin slab on piers
  const top = BRIDGE_DECK, slabTop = 0.62;
  if (wet) {
    P((-hl + a) / 2, (-1.0 + slabTop) / 2, 0, a + hl, slabTop + 1.0, wid, M.stone, T(PAL.low));                  // bank block (head) on the near side
    P((hl + e) / 2, (-1.0 + slabTop) / 2, 0, hl - e, slabTop + 1.0, wid, M.stone, T(PAL.low));                   // ... and on the far side
    P((a + e) / 2, (SOFFIT + slabTop) / 2, 0, e - a, slabTop - SOFFIT, wid, M.stone, T(PAL.stone[0]));            // the slab over the water
  } else P(0, (-1.0 + slabTop) / 2, 0, len, slabTop + 1.0, wid, M.stone, T(PAL.low));
  // the surface: stone = a darker road strip between the parapets; timber = planks across the whole deck (the grain of the wood texture runs along u)
  if (wood) P(0, (slabTop + top) / 2, 0, len, top - slabTop, wid - 0.2, M.wood, { tint: PAL.wood, tintLinear: true, uvScale: [len / 3.5, wid / 3.5] });
  else {
    P(0, (slabTop + top) / 2, 0, len, top - slabTop, wid - 1.8, M.stoneDark, { tint: PAL.dark, tintLinear: true, worldUV: 0.25 });
    for (const s of [-1, 1]) P(0, (slabTop + top) / 2 - 0.005, s * (wid / 2 - 0.4), len, top - slabTop + 0.02, 0.9, M.stone, T(PAL.coping));       // the kerbs
  }

  // ---- piers + stepped arches between them (the span count follows the water: <= ~6.5 m a span)
  if (wet) {
    const n = Math.max(1, Math.round((e - a) / 6.5)), pw = 1.0, xs = []; for (let i = 1; i < n; i++) xs.push(a + (e - a) * i / n);
    const sup = [a, ...xs, e];
    for (const x of xs) {
      P(x, (-1.7 + SOFFIT) / 2, 0, pw, SOFFIT + 1.7, wid - 0.1, M.stone, T(PAL.low));
      for (const s of [-1, 1]) P(x, -0.55, s * (wid / 2 - 0.05), 0.62, 1.3, 0.62, M.stone, T(PAL.low), Math.PI / 4);              // cutwaters (a 45-degree block each end of the pier)
    }
    for (let i = 0; i < n; i++) {
      const s0 = sup[i] + (i === 0 ? 0 : pw / 2), s1 = sup[i + 1] - (i === n - 1 ? 0 : pw / 2), c = s1 - s0;
      if (c < 1.5) continue;
      if (wood) {                                                                                                   // timber: two stringers under the planks, a cross beam at each pier
        for (const s of [-1, 1]) P((s0 + s1) / 2, SOFFIT + 0.14, s * (wid / 2 - 0.9), c, 0.28, 0.34, M.wood, { tint: PAL.woodD, tintLinear: true, uvScale: [c / 2, 0.3] });
        continue;
      }
      const N = 4, rho = SOFFIT - WATER, hc = rho / N, R = (c * c / 4 + rho * rho) / (2 * rho);
      for (let k = 0; k < N; k++) {
        const y = WATER + (k + 0.5) * hc, yy = y - WATER, xh = Math.sqrt(Math.max(0, R * R - (yy + R - rho) ** 2)), bw = c / 2 - xh;
        if (bw < 0.04) continue;
        for (const s of [0, 1]) P(s ? s1 - bw / 2 : s0 + bw / 2, y, 0, bw + 0.02, hc + 0.01, wid - 0.1, M.stone, T(PAL.stone[(k + s) % 2]));
      }
    }
  }

  // ---- parapets
  if (!wood) {
    const off = wid / 2 - 0.3, np = Math.max(2, Math.round(len / 4.5) + 1);
    for (const s of [-1, 1]) {
      P(0, top + 0.475, s * off, len, 0.95, 0.42, M.stone, T(PAL.stone[1]));                                      // the wall
      P(0, top + 1.02, s * off, len + 0.1, 0.14, 0.62, M.stone, T(PAL.coping));                                   // the coping
      for (let i = 0; i < np; i++) {
        const u = -hl + 0.4 + (len - 0.8) * i / (np - 1);
        P(u, top + 0.78, s * off, 0.78, 1.56, 0.78, M.stone, T(PAL.stone[0]));                                    // post
        P(u, top + 1.62, s * off, 1.0, 0.16, 1.0, M.stone, T(PAL.coping));                                        // its cap
      }
    }
  } else {
    const off = wid / 2 - 0.2, np = Math.max(2, Math.round(len / 2.3) + 1), WD = { tint: PAL.woodD, tintLinear: true, uvScale: [1, 1] };
    for (const s of [-1, 1]) {
      for (let i = 0; i < np; i++) { const u = -hl + 0.2 + (len - 0.4) * i / (np - 1), big = i === 0 || i === np - 1; P(u, top + (big ? 0.78 : 0.55), s * off, big ? 0.3 : 0.18, big ? 1.56 : 1.1, big ? 0.3 : 0.18, M.wood, WD); }
      P(0, top + 1.05, s * off, len, 0.1, 0.16, M.wood, { tint: PAL.wood, tintLinear: true, uvScale: [len / 3, 0.2] });
      P(0, top + 0.55, s * off, len, 0.07, 0.12, M.wood, { tint: PAL.wood, tintLinear: true, uvScale: [len / 3, 0.2] });
    }
  }

  // ---- heads: two wing walls flaring out at each end (the parapets end in the big posts above), a stone threshold across the road
  for (const end of [-1, 1]) for (const s of [-1, 1]) {
    const u = end * (hl + 0.9), v = s * (wid / 2 + 0.55);
    P(u, 0.42, v, 3.2, 1.9, 0.5, M.stone, T(PAL.low), -end * s * 0.42);
  }
}
