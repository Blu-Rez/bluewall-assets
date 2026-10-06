// The knight's own helm and horsehair crest, built from scratch (replaces the model's plain black bucket and its wisps of hair).
// Both are returned in the knight's rest pose, metres, facing +z, y up (the same frame gear_plume.js uses), as plain arrays:
//   { pos, nor, uv, col, hair, idx }   (hair = the sway weights of the vertex shader: back, down, side, phase)
//
// helmGeo()   a rounded steel great helm: flared gold rim, riveted bands, a cross-shaped face with a deep eye slit, a row of breath slits
//             each side of a raised nasal rib, a gold-capped comb on the top that carries the crest.  Steel is the brushed-metal square of
//             the Kit atlas (u .5-.75, v .5-.75), the colour comes from the vertices (steel / gold / dark slots).
// crestGeo()  a full, groomed horsehair crest: five tapering "lobes" swept over the comb and falling down the back of the neck, each a
//             solid body (not loose cards), hair texture along its length, a frayed tip.  Atlas region u 0-.5, v >= V0 (the old locks).
const TAU = Math.PI * 2;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gauss = (x, w) => Math.exp(-(x / w) * (x / w));
const lerp = (a, b, t) => a + (b - a) * t;
const STEEL = [0.78, 0.81, 0.87], GOLD = [1.0, 0.76, 0.3], SLOT = [0.02, 0.02, 0.03];
const HEAD = ['Head', 1, 'Head', 0];
const SKIN = [0.74, 0.52, 0.4], BEARD = [0.2, 0.125, 0.08], DARK = [0.05, 0.03, 0.03], LIP = [0.55, 0.28, 0.25];

// one grid of vertices (a "patch"): fn(a, t) -> [x, y, z, [r, g, b], u, v]; wrap = closes around (a lathe)
function Mesh() {
  const m = { pos: [], nor: [], uv: [], col: [], hair: [], idx: [], bones: [] }, base = [];
  m.patch = (na, nt, fn, wrap, flip) => {
    const o = m.pos.length / 3, W = wrap ? na : na + 1;
    for (let j = 0; j <= nt; j++) for (let i = 0; i < W; i++) {
      const [x, y, z, c, u, v] = fn(i / na, j / nt);
      m.pos.push(x, y, z); m.col.push(c[0], c[1], c[2]); m.uv.push(u, v); m.hair.push(0, 0, 0, 0);
    }
    for (let j = 0; j < nt; j++) for (let i = 0; i < na; i++) {
      const a = o + j * W + i, b = o + j * W + (i + 1) % W, c = o + (j + 1) * W + i, d = o + (j + 1) * W + (i + 1) % W;
      if (flip) m.idx.push(a, b, c, b, d, c); else m.idx.push(a, c, b, b, c, d);
    }
    for (let q = o; q < m.pos.length / 3; q++) m.bones.push(HEAD);
    base.push([o, m.pos.length / 3]);
  };
  m.finish = () => {                                                                                  // smooth normals, per patch
    const N = new Float32Array(m.pos.length), P = m.pos;
    for (let t = 0; t < m.idx.length; t += 3) {
      const [a, b, c] = [m.idx[t] * 3, m.idx[t + 1] * 3, m.idx[t + 2] * 3];
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const q of [a, b, c]) { N[q] += nx; N[q + 1] += ny; N[q + 2] += nz; }
    }
    for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; m.nor.push(N[i] / l, N[i + 1] / l, N[i + 2] / l); }
    return m;
  };
  return m;
}

const CZ = -0.012, ELL = 1.1, R0 = 0.098, TOP = 1.826;
const rimY = (th) => 1.676 - 0.066 * (1 - Math.cos(th)) / 2 * (0.6 + 0.4 * (1 - Math.cos(th)) / 2);     // the rim: high at the brow, low behind
const SU = 0.24;                                                                                       // size of a square of the Kit atlas
const steelUV = (a, t) => [0.505 + SU * a, 0.505 + SU * t];                                           // brushed steel (metal 1)
const skinUV = [0.88, 0.88];                                                                           // plain matte square (metal 0)

// the Roman helmet (a galea): round bowl, a raised brow band, a front-to-back comb with cross bands, two hinged cheek plates, a wide flared neck guard
export function helmGeo() {
  if (typeof window !== 'undefined' && window.__noHelm) return Mesh().finish();
  const M = Mesh();
  // ---- the head under it (the model has none): a stylised face, beard and brow, matte skin
  M.patch(36, 30, (a, t) => {
    const th = a * TAU, s = Math.sin(th), c = Math.cos(th), y = 1.495 + 0.235 * t, cy = 1.615, ry = 0.118, e = Math.max(0, 1 - ((y - cy) / ry) ** 2), r0 = Math.sqrt(e);
    const jaw = lerp(0.74, 1, sstep(1.50, 1.58, y)), fa = Math.abs(Math.atan2(s, c)), fr = Math.max(0, c);
    let rx = 0.075 * jaw * r0, rz = 0.095 * lerp(0.84, 1, sstep(1.50, 1.56, y)) * r0, col = SKIN;
    let dz = 0;
    // brow, nose, chin
    dz += 0.010 * gauss(y - 1.658, 0.01) * fr * r0;                                                   // the brow ridge
    dz += 0.034 * gauss(fa, 0.15) * gauss(y - 1.607, 0.026) * fr;                                      // the nose
    dz += 0.014 * gauss(fa, 0.28) * gauss(y - 1.515, 0.014) * fr;                                      // the chin
    // eyes (dark), mouth, a short beard along the jaw and the cheeks, a moustache
    const eyeD = Math.hypot((fa - 0.4) * 0.085, y - 1.641); if (eyeD < 0.0125 && fr > 0.3) col = DARK;
    if (y < 1.585 && fa < 1.5 && !(Math.abs(y - 1.556) < 0.004 && fa < 0.2)) col = BEARD;
    if (y > 1.563 && y < 1.583 && fa < 0.27 && fr > 0.3) col = BEARD;                                  // moustache over the beard line
    if (Math.abs(y - 1.5555) < 0.0035 && fa < 0.17 && fr > 0.3) col = LIP;
    return [rx * s, y, CZ + 0.002 + (rz * c + dz), col, skinUV[0], skinUV[1]];
  }, true);
  // ---- the bowl
  M.patch(72, 26, (a, t) => {
    const th = a * TAU, s = Math.sin(th), c = Math.cos(th), ry0 = rimY(th), hh = TOP - ry0, ang = Math.abs(Math.atan2(s, c));
    const q = t * Math.PI / 2;
    let y = ry0 + hh * Math.sin(q), r = R0 * Math.pow(Math.cos(q), 0.78), col = STEEL;
    // the raised brow band along the front rim, a gold rim line, the comb (front to back) and a cross band (ear to ear), rivets on the band
    r += 0.0075 * gauss(t - 0.045, 0.05) * (1 - sstep(1.0, 1.75, ang));
    r += 0.0035 * gauss(t - 0.012, 0.012);
    if (t < 0.03) col = GOLD;
    const x0 = r * s;
    const comb = gauss(x0, 0.0125) * sstep(0.1, 0.35, t); r += 0.011 * comb; if (comb > 0.3 && t > 0.1) col = GOLD;
    const z0 = r * c * ELL, cross = gauss(z0 + 0.012, 0.011) * sstep(0.12, 0.3, t); r += 0.0055 * cross; if (cross > 0.5 && t > 0.15 && comb < 0.3) col = [0.9, 0.93, 0.98];
    if (t > 0.965) col = GOLD;                                                                         // the knob on top
    if (t > 0.94) r += 0.012 * sstep(0.94, 0.99, t);
    for (const a0 of [0.35, 0.8, 1.25]) { const rv = gauss(ang - a0, 0.035) * gauss(t - 0.045, 0.014); r += 0.004 * rv; if (rv > 0.5) col = GOLD; }
    const rr = Math.max(0.0008, r);
    return [rr * s, y, CZ + ELL * rr * c, col, ...steelUV(a, t)];
  }, true);
  // ---- the neck guard: a wide plate that flares out behind and drops over the neck
  M.patch(40, 10, (a, t) => {
    const k = (a - 0.5) * 2, th = Math.PI + k * 1.42, s = Math.sin(th), c = Math.cos(th), cf = Math.cos(k * Math.PI / 2), H = 0.03 + 0.1 * Math.pow(cf, 0.8);
    const y = rimY(th) - H * t;
    let r = R0 + 0.006 + (0.07 * Math.pow(cf, 0.9) + 0.008) * Math.pow(t, 1.25), col = STEEL;
    r += 0.0045 * (gauss(t - 0.36, 0.05) + gauss(t - 0.7, 0.05));                                       // two rolled ribs
    if (t > 0.9) col = GOLD;
    return [r * s, y, CZ + ELL * r * c, col, ...steelUV(a, t)];
  }, false, true);
  // ---- the cheek plates, one each side: they hang from the rim in front of the ears and leave the face open
  for (const side of [1, -1]) M.patch(12, 10, (a, t) => {
    const hw = 0.5 * Math.sqrt(Math.max(0.0, 1 - Math.pow(t, 2.2))) + 0.03, th = side * (1.22 + (a - 0.5) * 2 * hw), s = Math.sin(th), c = Math.cos(th);
    const y = rimY(th) - 0.012 - 0.15 * t, r = R0 + 0.007 + 0.012 * Math.sin(t * Math.PI * 0.5);
    let col = STEEL; if (Math.abs(a - 0.5) > 0.42 || t > 0.9) col = GOLD;
    return [r * s, y, CZ + ELL * r * c, col, ...steelUV(a, t)];
  }, false, side < 0);
  return M.finish();
}

// the great helm of the sword knight: a rounded steel pot with a flared gold rim, riveted bands, a deep eye slit, breath slits beside a raised nasal rib, a gold-capped comb
const GPROF = [[1.466, 0.116], [1.476, 0.123], [1.490, 0.119], [1.520, 0.110], [1.575, 0.106], [1.640, 0.112], [1.690, 0.116], [1.730, 0.113], [1.765, 0.101], [1.790, 0.082], [1.805, 0.056], [1.813, 0.028], [1.816, 0.0]];
function gRadius(y) {
  for (let i = 0; i < GPROF.length - 1; i++) {
    const [y0, r0] = GPROF[i], [y1, r1] = GPROF[i + 1];
    if (y >= y0 && y <= y1) { const t = (y - y0) / (y1 - y0), s = t * t * (3 - 2 * t); return r0 + (r1 - r0) * (0.5 * t + 0.5 * s); }
  }
  return GPROF[GPROF.length - 1][1];
}
export function greatHelmGeo() {
  if (typeof window !== 'undefined' && window.__noHelm) return Mesh().finish();
  const M = Mesh(), Y0 = 1.466, Y1 = 1.816, SEG = 64, NR = 48, CZg = -0.004, ELLg = 1.08;
  M.patch(SEG, NR, (a, t) => {
    const y = Y0 + (Y1 - Y0) * t, r0 = gRadius(y), th = a * TAU, s = Math.sin(th), c = Math.cos(th), ang = Math.atan2(s, c), fa = Math.abs(ang);
    let d = 0, k = null;
    d += 0.007 * gauss(y - 1.482, 0.007) + 0.0055 * gauss(y - 1.575, 0.006) + 0.008 * gauss(y - 1.694, 0.0085) + 0.0045 * gauss(y - 1.748, 0.006);
    if (y < 1.493) k = GOLD;
    if (Math.abs(y - 1.694) < 0.0052) k = GOLD;
    if (fa < 1.1) {
      const eye = sstep(0.0, 0.004, 0.0105 - Math.abs(y - 1.646)) * sstep(0.0, 0.07, 0.62 - fa); if (eye > 0) { d -= 0.020 * eye; if (eye > 0.45) k = SLOTC; }
      const rib = gauss(fa, 0.055) * sstep(1.50, 1.52, y) * (1 - sstep(1.775, 1.795, y)); d += 0.0085 * rib;
      if (y > 1.505 && y < 1.615) for (const a0 of [0.17, 0.30, 0.43]) { const sl = sstep(0, 0.018, 0.020 - Math.abs(fa - a0)) * sstep(0, 0.006, 0.052 - Math.abs(y - 1.5595)); if (sl > 0) { d -= 0.014 * sl; if (sl > 0.4) k = SLOTC; } }
      for (const a0 of [0.28, 0.58, 0.9]) { const rv = gauss(fa - a0, 0.03) * gauss(y - 1.694, 0.008); d += 0.005 * rv; if (rv > 0.6) k = GOLD; }
    }
    const comb = gauss((r0 + d) * s, 0.0125) * sstep(1.768, 1.793, y); d += 0.0115 * comb; if (comb > 0.35) k = GOLD;
    const r = Math.max(0.0005, r0 + d), sh = 0.82 + 0.28 * sstep(1.48, 1.80, y), base = k || STEEL;
    return [r * s, y, CZg + r * c * ELLg, k === SLOTC ? base : [base[0] * sh, base[1] * sh, base[2] * sh], 0.505 + SU * a, 0.505 + SU * t];
  }, true, true);
  return M.finish();
}
const SLOTC = [0.02, 0.02, 0.03];

// ------------------------------------------------------------------------------------------------------------------ the crest
// the spine of the main lobe (z, y): out of the front of the comb, over the crown, then down the back of the neck
const SPINE = [[0.088, 1.812], [0.07, 1.855], [0.03, 1.905], [-0.03, 1.925], [-0.10, 1.905], [-0.165, 1.845], [-0.205, 1.76], [-0.222, 1.66], [-0.228, 1.56], [-0.226, 1.47]];
function spineAt(s, out) {
  const n = SPINE.length - 1, f = Math.min(0.9999, Math.max(0, s)) * n, i = Math.floor(f), t = f - i;
  const p = (k) => SPINE[Math.max(0, Math.min(n, k))];
  const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
  for (let c = 0; c < 2; c++) {                                                                       // Catmull-Rom
    const a = p0[c], b = p1[c], cc = p2[c], d = p3[c];
    out[c] = 0.5 * ((2 * b) + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t * t + (-a + 3 * b - 3 * cc + d) * t * t * t);
  }
  return out;
}
export function crestGeo(V0) {
  const pos = [], nor = [], uv = [], col = [], hair = [], idx = [], bones = [];
  const SEGS = 26, RING = 9;
  // [x offset, length, peak height scale, half thickness, splay, lock]
  const LOBES = [[0, 1.0, 1.0, 0.04, 0, 0], [-0.03, 0.92, 0.94, 0.032, -0.03, 1], [0.03, 0.92, 0.94, 0.032, 0.03, 2], [-0.056, 0.76, 0.84, 0.026, -0.05, 3], [0.056, 0.76, 0.84, 0.026, 0.05, 1]];
  const a = [0, 0], b = [0, 0];
  for (const [xo, len, pk, th, splay, lock] of LOBES) {
    const base = pos.length / 3, S = 1 - (1 - len) * 0.0;
    for (let k = 0; k <= SEGS; k++) {
      const s = k / SEGS, ss = s * len;
      spineAt(ss, a); spineAt(Math.min(1, ss + 0.02), b);
      // the peak is scaled about the crown line (y = 1.81)
      const yy = 1.81 + (a[1] - 1.81) * (a[1] > 1.81 ? pk : 1), zz = a[0];
      const tz = b[0] - a[0], ty = (1.81 + (b[1] - 1.81) * (b[1] > 1.81 ? pk : 1)) - yy, tl = Math.hypot(tz, ty) || 1;
      const Tz = tz / tl, Ty = ty / tl;                                                               // the tangent, in the sagittal plane
      const Nz = -Ty, Ny = Tz;                                                                        // its normal (out of the helm / back)
      // thickness: full at the root, thin at the tip; height (along the normal): full in the middle
      const wx = th * (1 - 0.5 * s ** 1.4), wn = (0.04 + 0.03 * Math.sin(Math.min(1, s * 1.3) * Math.PI * 0.5)) * (1 - 0.6 * s ** 1.7);
      const sx = xo + splay * s * s;
      for (let r = 0; r < RING; r++) {
        const ph = (r / RING) * TAU, cx = Math.cos(ph), cn = Math.sin(ph);
        const px = sx + cx * wx, pn = cn * wn;
        pos.push(px, yy + Ny * pn, zz + Nz * pn);
        // normal of the ellipse
        let nx = cx / Math.max(wx, 1e-4), nn = cn / Math.max(wn, 1e-4); const l = Math.hypot(nx, nn) || 1; nx /= l; nn /= l;
        nor.push(nx, Ny * nn, Nz * nn);
        uv.push((lock + 0.5 + 0.46 * cx) * 0.125, V0 + (1 - V0) * (0.01 + s * 0.98));
        col.push(1, 1, 1); bones.push(HEAD);
        const k2 = s ** 1.5; hair.push(k2, k2, k2, lock * 0.9 + xo * 40);
      }
    }
    for (let k = 0; k < SEGS; k++) for (let r = 0; r < RING; r++) {
      const q0 = base + k * RING + r, q1 = base + k * RING + (r + 1) % RING, q2 = q0 + RING, q3 = q1 + RING;
      idx.push(q0, q1, q2, q1, q3, q2);
    }
  }
  return { pos, nor, uv, col, hair, idx, bones };
}
