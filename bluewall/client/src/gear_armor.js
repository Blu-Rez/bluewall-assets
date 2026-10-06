// Full plate harness for the knights (the UAL "K3" knight is a ranger in a tunic with ONE shoulder plate): a polished-steel cuirass with a raised
// breast ridge and a gold-trimmed gorget, domed pauldrons, plates on the upper arms and forearms with elbow cops, gauntlet cuffs, thigh plates with knee cops and shin greaves.
// Everything is rigid on the bone it covers (the cuirass blends over the three spine bones), built in the knight's rest pose (T-pose, metres, facing +z).
// armorGeo(variant) -> { pos, nor, uv, col, hair, idx, bones:[[bone, w, bone2, w2] per vertex] }   (variant 'axe' = broader pauldrons and a heavier collar)
// Steel is the brushed-metal square of the Kit atlas (u .5-.75, v .5-.75), gold trim is a vertex colour.
const TAU = Math.PI * 2;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gauss = (x, w) => Math.exp(-(x / w) * (x / w));
const lerp = (a, b, t) => a + (b - a) * t;
const STEEL = [0.74, 0.77, 0.83], GOLD = [1.0, 0.76, 0.3], DARKSTEEL = [0.5, 0.53, 0.6];
const SU = 0.24;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// rest-pose joints (the model's own, so nothing here depends on guessing): name -> [x, y, z]
export function armorGeo(P, variant = 'knight') {
  const pos = [], nor = [], uv = [], col = [], hair = [], idx = [], bones = [];
  const wide = variant === 'axe' ? 1.16 : 1.0;
  // a closed-around loft: rings = [{ c, u, v, col, bone }]  (u, v = the two half-axes of the ring, already scaled)
  const loft = (rings, nSeg = 20, closedEnds = false) => {
    const o = pos.length / 3;
    rings.forEach((rg, k) => {
      for (let i = 0; i < nSeg; i++) {
        const ph = (i / nSeg) * TAU, cs = Math.cos(ph), sn = Math.sin(ph);
        let { u, v } = rg; let k2 = 1;
        if (rg.shape) k2 = rg.shape(ph, k);                                                           // radial scale by angle (ridges, bulges)
        pos.push(rg.c[0] + (u[0] * cs + v[0] * sn) * k2, rg.c[1] + (u[1] * cs + v[1] * sn) * k2, rg.c[2] + (u[2] * cs + v[2] * sn) * k2);
        const c = rg.col(ph, k); col.push(c[0], c[1], c[2]);
        uv.push(0.505 + SU * (i / nSeg), 0.505 + SU * (k / Math.max(1, rings.length - 1))); hair.push(0, 0, 0, 0);
        bones.push(rg.bone);
      }
    });
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < nSeg; i++) {
      const a = o + k * nSeg + i, b = o + k * nSeg + (i + 1) % nSeg, c = o + (k + 1) * nSeg + i, d = o + (k + 1) * nSeg + (i + 1) % nSeg;
      idx.push(a, b, c, b, d, c);
    }
    void closedEnds;
  };
  const solid = (c) => () => c;
  // a tapered limb plate from joint A to joint B, gold at both ends, one bone
  const limb = (A, B, rA, rB, bone, o = {}) => {
    const d = norm(sub(B, A)), f0 = o.fwd || [0, 0, 1];
    let s = cross(d, f0); if (Math.hypot(...s) < 0.2) s = cross(d, [0, 1, 0]); s = norm(s);
    const f = norm(cross(s, d)), N = o.n || 9, rings = [];
    const squash = o.squash || 0.92;
    for (let k = 0; k <= N; k++) {
      const t = k / N, r = lerp(rA, rB, t) * (1 + (o.bulge ?? 0.07) * Math.sin(t * Math.PI)) * (k === 0 || k === N ? 1.07 : 1);
      rings.push({ c: add(A, mul(sub(B, A), t)), u: mul(s, r), v: mul(f, r * squash), bone, col: (ph) => (k === 0 || k === N || k === 1 && o.trim2 ? GOLD : (o.ridge && Math.cos(ph - o.ridgeAt) > 0.97 ? [0.95, 0.97, 1.0] : STEEL)) });
    }
    loft(rings, o.seg || 14);
  };
  // an ellipsoid cap (knee cop, elbow cop): centre, radii along its own axes
  const cop = (C, rx, ry, rz, bone, ax = 'x') => {
    const rings = [], N = 8;
    for (let k = 1; k < N; k++) {
      const t = k / N, a = (t - 0.5) * Math.PI, r = Math.cos(a);
      const c = add(C, ax === 'x' ? [Math.sin(a) * rx, 0, 0] : ax === 'y' ? [0, Math.sin(a) * ry, 0] : [0, 0, Math.sin(a) * rz]);
      const u = ax === 'x' ? [0, ry * r, 0] : ax === 'y' ? [rx * r, 0, 0] : [rx * r, 0, 0], v = ax === 'x' ? [0, 0, rz * r] : ax === 'y' ? [0, 0, rz * r] : [0, ry * r, 0];
      rings.push({ c, u, v, bone, col: (ph, kk) => (kk === 1 || kk === N - 1 ? GOLD : STEEL) });
    }
    loft(rings, 14);
  };
  const B1 = (n) => [n, 1, n, 0];

  // ---------------------------------------------------------------- the cuirass (breast + back plate), blended over the three spine bones
  const chain = [['spine_01', 1.072], ['spine_02', 1.178], ['spine_03', 1.311]];
  const spineW = (y) => {
    if (y <= chain[0][1]) return ['spine_01', 1, 'spine_02', 0];
    for (let i = 0; i < 2; i++) if (y <= chain[i + 1][1]) { const t = sstep(chain[i][1], chain[i + 1][1], y); return [chain[i][0], 1 - t, chain[i + 1][0], t]; }
    return ['spine_03', 1, 'spine_02', 0];
  };
  const CU = [[1.0, 0.150, 0.105, -0.02], [1.065, 0.146, 0.100, -0.016], [1.13, 0.150, 0.104, -0.012], [1.21, 0.160, 0.113, -0.008], [1.29, 0.172, 0.121, -0.004], [1.37, 0.178, 0.122, 0.0], [1.43, 0.176, 0.112, -0.004], [1.475, 0.158, 0.098, -0.014], [1.515, 0.112, 0.076, -0.03], [1.545, 0.074, 0.062, -0.04]];
  const cu = CU.map(([y, rx, rz, zc], k) => {
    const bw = spineW(y), top = k >= CU.length - 2, bot = k === 0;
    return {
      c: [0, y, zc], u: [rx * wide ** 0.4, 0, 0], v: [0, 0, rz], bone: bw,
      shape: (ph) => { const c = Math.cos(ph); return 1 + (c > 0 ? 0.075 * gauss(y - 1.31, 0.12) * (0.4 + 0.6 * c) + 0.05 * gauss(Math.sin(ph), 0.12) * c * sstep(1.1, 1.3, y) : -0.03 * -c) + 0.012 * gauss(Math.sin(ph), 0.08) * Math.abs(c); },
      col: (ph) => (top || bot ? GOLD : Math.abs(Math.sin(ph)) < 0.06 && Math.cos(ph) > 0 && y > 1.15 ? [0.95, 0.97, 1.0] : STEEL),
    };
  });
  loft(cu, 30);
  // the lames at the waist: two raised rings on the belly plate
  for (const y of [1.075, 1.135]) loft([{ c: [0, y - 0.012, -0.016], u: [0.152 * wide ** 0.4, 0, 0], v: [0, 0, 0.1], bone: spineW(y), col: solid(DARKSTEEL) }, { c: [0, y + 0.012, -0.012], u: [0.157 * wide ** 0.4, 0, 0], v: [0, 0, 0.104], bone: spineW(y), col: solid(GOLD) }, { c: [0, y + 0.03, -0.012], u: [0.15 * wide ** 0.4, 0, 0], v: [0, 0, 0.102], bone: spineW(y), col: solid(STEEL) }], 30);
  // ---------------------------------------------------------------- gorget (collar), on the neck
  loft([[1.495, 0.1, 0.078], [1.512, 0.09, 0.072], [1.535, 0.078, 0.066], [1.56, 0.075, 0.064]].map(([y, rx, rz], k) => ({ c: [0, y, -0.036], u: [rx * (variant === 'axe' ? 1.08 : 1), 0, 0], v: [0, 0, rz], bone: B1('neck_01'), col: solid(k === 3 || k === 0 ? GOLD : STEEL) })), 24);

  // ---------------------------------------------------------------- the two sides
  for (const sd of ['l', 'r']) {
    const sg = sd === 'l' ? 1 : -1, J = (n) => P(n + '_' + sd), sh = J('upperarm'), el = J('lowerarm'), wr = J('hand'), th = J('thigh'), kn = J('calf'), an = J('foot');
    const ua = 'upperarm_' + sd, la = 'lowerarm_' + sd, ha = 'hand_' + sd, ta = 'thigh_' + sd, ca = 'calf_' + sd;
    // pauldron: a steel dome over the shoulder (half an ellipsoid around the arm axis), three gold ridges
    {
      const rings = [], N = 12, c0 = add(sh, [sg * 0.01, 0.02, 0.0]);
      for (let k = 0; k <= N; k++) {
        const x = lerp(-0.105 * wide, 0.12 * wide, k / N), R = 0.118 * wide * Math.sqrt(Math.max(0.02, 1 - ((x - 0.01) / (0.128 * wide)) ** 2));
        rings.push({
          c: add(c0, [sg * x, 0, 0]), u: [0, R * 0.92, 0], v: [0, 0, R], bone: B1(ua),
          shape: (ph) => (Math.sin(ph) < -0.2 ? 0.62 + 0.38 * sstep(-0.9, -0.2, Math.sin(ph)) : 1),                        // open underneath
          col: (ph, kk) => (kk === 0 || kk === N || (kk === 4 || kk === 8) ? GOLD : STEEL),
        });
      }
      loft(rings, 20);
    }
    // arm plates: upper arm, elbow cop, forearm, gauntlet cuff
    limb(sh, el, 0.054, 0.048, B1(ua), { fwd: [0, 0, 1], squash: 0.94 });
    cop(el, 0.034, 0.062, 0.066, B1(la), 'x');
    limb(el, wr, 0.05, 0.036, B1(la), { fwd: [0, 0, 1], bulge: 0.04 });
    { const ext = add(wr, mul(norm(sub(wr, el)), 0.075)); limb(wr, ext, 0.043, 0.036, B1(ha), { n: 4, bulge: 0.02 }); }
    // legs: thigh plate, knee cop, shin greave
    limb(th, kn, 0.086, 0.064, B1(ta), { fwd: [0, 0, 1], n: 10, ridge: true, ridgeAt: Math.PI / 2 });
    cop([kn[0], kn[1], kn[2] + 0.012], 0.066, 0.05, 0.05, B1(ca), 'z');
    limb(kn, an, 0.064, 0.047, B1(ca), { fwd: [0, 0, 1], n: 9, bulge: 0.05 });
  }
  // ---------------------------------------------------------------- smooth normals
  const N = new Float32Array(pos.length);
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t] * 3, idx[t + 1] * 3, idx[t + 2] * 3];
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const q of [a, b, c]) { N[q] += nx; N[q + 1] += ny; N[q + 2] += nz; }
  }
  for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; nor.push(N[i] / l, N[i + 1] / l, N[i + 2] / l); }
  return { pos, nor, uv, col, hair, idx, bones };
}
