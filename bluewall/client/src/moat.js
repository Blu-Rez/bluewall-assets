// The town moat, river and lake banks (owned by the "water" workstream).
//   - the wall side of the moat is a stone-lined quay (paved slope + curb) like a real canal,
//   - the country side stays natural: boulders, tall reeds with cattails, lily pads and blue lotus flowers,
//   - everything is placed on the waterline found on the very mesh the player sees (fastHeight),
//     and rides the slow tide of the water shader.
// Called by world.js during the build, BEFORE the static batch: buildMoat(ctx, api) -> { update(t, dt, camera, P) }.
// api: { scene, M, Q, A, height, fastHeight, water, flames? } (flames: the torch list, for their reflections — found in the scene if not given)
// The life on the water (fish, birds, jetty, mist ...) is water_life.js; the water surface itself is terrain.js buildWater.
import * as THREE from 'three';
import * as L from './layout.js';
import { rng } from './noise.js';
import { roadDist } from './roads.js';
import { season } from './tod.js';
import { buildWaterLife, JETTY_ANG } from './water_life.js';

const NS = 360;                       // contour samples around the town (1 deg each)
const TAU = Math.PI * 2;

// distance from the origin to a star-shaped polygon along an angle
function rayPoly(poly, ang) {
  const dx = Math.cos(ang), dz = Math.sin(ang), n = poly.length; let best = 0;
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n], ex = b[0] - a[0], ez = b[1] - a[1];
    const den = dx * ez - dz * ex; if (Math.abs(den) < 1e-9) continue;
    const t = (a[0] * ez - a[1] * ex) / den, u = (a[0] * dz - a[1] * dx) / den;
    if (t > 0 && u >= 0 && u <= 1 && t > best) best = t;
  }
  return best;
}
// bisect f(r) = height - level between a (land or water) and b (the other); returns r or null
function cross(fh, level, px, pz, dx, dz, a, b) {
  let fa = fh(px + dx * a, pz + dz * a) - level, fb = fh(px + dx * b, pz + dz * b) - level;
  if (fa * fb > 0) return null;
  for (let i = 0; i < 16; i++) {
    const m = (a + b) / 2, fm = fh(px + dx * m, pz + dz * m) - level;
    if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else { b = m; fb = fm; }
  }
  return (a + b) / 2;
}

function lcg(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function mkTex(c, aniso = 4) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; }
// a blade: a tapered curved leaf from (x0, H) to the tip, filled with a base->tip gradient and a pale midrib
function blade(g, x0, H, lean, top, w, c0, c1, rib) {
  const gr = g.createLinearGradient(0, H, 0, top); gr.addColorStop(0, c0); gr.addColorStop(1, c1);
  g.fillStyle = gr; g.beginPath(); g.moveTo(x0 - w, H); g.quadraticCurveTo(x0 + lean * 0.18, H * 0.5 + top * 0.5, x0 + lean, top);
  g.quadraticCurveTo(x0 + lean * 0.3 + w * 0.35, H * 0.5 + top * 0.5, x0 + w, H); g.closePath(); g.fill();
  if (rib) { g.strokeStyle = rib; g.lineWidth = Math.max(0.8, w * 0.22); g.beginPath(); g.moveTo(x0, H); g.quadraticCurveTo(x0 + lean * 0.22, H * 0.5 + top * 0.5, x0 + lean * 0.96, top + (H - top) * 0.04); g.stroke(); }
}
// tall reeds + cattails
function reedTexture() {
  const W = 256, H = 384, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), rnd = lcg(7);
  for (let k = 0; k < 30; k++) {
    const x0 = 22 + rnd() * (W - 44), lean = (rnd() - 0.5) * 84 * (0.4 + 0.8 * Math.abs(x0 - W / 2) / (W / 2)), top = 10 + rnd() * 120, w = 4 + rnd() * 6, sh = 0.7 + rnd() * 0.5;
    const c0 = `rgb(${Math.round(36 * sh)},${Math.round(92 * sh)},${Math.round(34 * sh)})`, c1 = `rgb(${Math.round(150 * sh)},${Math.round(196 * sh)},${Math.round(84 * sh)})`;
    blade(g, x0, H, lean, top, w, c0, c1, 'rgba(225,245,170,0.42)');
    if (k % 5 === 1) {                                      // a cattail: slim brown stalk and a velvet-brown head
      const hx = x0 + lean * 0.9, hy = top + 54;
      g.strokeStyle = '#3d6a2c'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x0, H); g.quadraticCurveTo(x0 + lean * 0.3, H * 0.5, hx, hy + 24); g.stroke();
      const hg = g.createLinearGradient(hx - 6, 0, hx + 6, 0); hg.addColorStop(0, '#3a2412'); hg.addColorStop(0.5, '#8a5a30'); hg.addColorStop(1, '#3a2412');
      g.fillStyle = hg; g.beginPath(); g.ellipse(hx, hy, 6.2, 27, lean * 0.004, 0, TAU); g.fill();
      g.fillStyle = '#c9b27a'; g.fillRect(hx - 0.8, hy - 44, 1.6, 17);
    }
  }
  return mkTex(c);
}
// a low tuft of sedge / meadow grass: a fan of arched blades
function sedgeTexture() {
  const W = 256, H = 160, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), rnd = lcg(31);
  for (let k = 0; k < 46; k++) {
    const x0 = 40 + rnd() * (W - 80), side = x0 < W / 2 ? -1 : 1, lean = side * (8 + rnd() * 62) * (0.4 + Math.abs(x0 - W / 2) / (W / 2)), top = 6 + rnd() * 74, w = 2.6 + rnd() * 3.6, sh = 0.62 + rnd() * 0.6;
    blade(g, x0, H + 2, lean, top, w, `rgb(${Math.round(30 * sh)},${Math.round(84 * sh)},${Math.round(30 * sh)})`, `rgb(${Math.round(130 * sh)},${Math.round(190 * sh)},${Math.round(70 * sh)})`, 'rgba(210,240,150,0.30)');
  }
  for (let k = 0; k < 5; k++) {                                // a few seed stalks
    const x0 = 70 + rnd() * 116, lean = (rnd() - 0.5) * 36, top = 4 + rnd() * 34;
    g.strokeStyle = '#7da04a'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x0, H); g.quadraticCurveTo(x0 + lean * 0.2, H * 0.5, x0 + lean, top); g.stroke();
    g.fillStyle = '#d6c27a'; g.beginPath(); g.ellipse(x0 + lean, top + 8, 2.6, 10, lean * 0.01, 0, TAU); g.fill();
  }
  return mkTex(c);
}
// wild flowers on the banks: yellow flag iris | purple loosestrife | white daisies | blue bells (four 128 x 192 cells)
function flowerAtlas() {
  const CW = 128, H = 192, c = document.createElement('canvas'); c.width = CW * 4; c.height = H; const g = c.getContext('2d'), rnd = lcg(53);
  const leaves = (cx, n, hmax, wmax) => { for (let k = 0; k < n; k++) { const x0 = cx + 18 + rnd() * (CW - 36), lean = (rnd() - 0.5) * 44, top = H - hmax * (0.5 + rnd() * 0.5), w = 2 + rnd() * wmax, sh = 0.7 + rnd() * 0.5; blade(g, x0, H, lean, top, w, `rgb(${Math.round(28 * sh)},${Math.round(80 * sh)},${Math.round(30 * sh)})`, `rgb(${Math.round(110 * sh)},${Math.round(176 * sh)},${Math.round(68 * sh)})`, 'rgba(200,235,150,0.3)'); } };
  const stem = (x0, y0, x1, y1, w = 2.2, col = '#3f7a2e') => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + (rnd() - 0.5) * 8, (y0 + y1) / 2, x1, y1); g.stroke(); };
  // 0: yellow iris
  leaves(0, 8, 120, 5);
  for (let k = 0; k < 3; k++) {
    const x = 26 + k * 38 + rnd() * 10, y = 40 + rnd() * 34; stem(x - 6 + rnd() * 12, H, x, y + 10);
    g.save(); g.translate(x, y);
    for (let p = 0; p < 3; p++) { g.fillStyle = '#ffe36a'; g.beginPath(); g.ellipse(Math.cos(p * 2.1 - 1.6) * 7, Math.sin(p * 2.1 - 1.6) * 7 - 4, 5.2, 10, p * 2.1 - 1.6 + 1.57, 0, TAU); g.fill(); }
    for (let p = 0; p < 3; p++) { g.fillStyle = '#f2b81c'; g.beginPath(); g.ellipse(Math.cos(p * 2.1 + 0.5) * 8, Math.sin(p * 2.1 + 0.5) * 8 + 2, 5.6, 9, p * 2.1 + 0.5 + 1.57, 0, TAU); g.fill(); g.strokeStyle = 'rgba(110,60,10,0.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.cos(p * 2.1 + 0.5) * 3, Math.sin(p * 2.1 + 0.5) * 3 + 2); g.lineTo(Math.cos(p * 2.1 + 0.5) * 12, Math.sin(p * 2.1 + 0.5) * 12 + 2); g.stroke(); }
    g.restore();
  }
  // 1: purple loosestrife spikes
  leaves(CW, 5, 80, 3);
  for (let k = 0; k < 4; k++) {
    const x = CW + 18 + k * 27 + rnd() * 8, top = 16 + rnd() * 30; stem(x - 4 + rnd() * 8, H, x, top, 2.4);
    for (let p = 0; p < 20; p++) { const t = p / 19, yy = top + t * 62, r = 3.2 + (1 - t) * 1.2; g.fillStyle = ['#c35fe8', '#a548d6', '#e07ae8', '#8d3cc4'][p % 4]; g.beginPath(); g.arc(x + (rnd() - 0.5) * 5, yy, r, 0, TAU); g.fill(); g.beginPath(); g.arc(x + (rnd() - 0.5) * 7, yy + 1, r * 0.8, 0, TAU); g.fill(); }
  }
  // 2: white daisies
  leaves(CW * 2, 7, 70, 3);
  for (let k = 0; k < 4; k++) {
    const x = CW * 2 + 20 + k * 27 + rnd() * 8, y = 70 + rnd() * 62; stem(x - 4 + rnd() * 8, H, x, y + 4, 1.8);
    for (let p = 0; p < 11; p++) { const a = (p / 11) * TAU; g.fillStyle = '#fbfdff'; g.beginPath(); g.ellipse(x + Math.cos(a) * 8.4, y + Math.sin(a) * 8.4, 6, 2.5, a, 0, TAU); g.fill(); }
    g.fillStyle = '#ffd548'; g.beginPath(); g.arc(x, y, 4.6, 0, TAU); g.fill();
  }
  // 3: blue bells
  leaves(CW * 3, 6, 90, 3);
  for (let k = 0; k < 4; k++) {
    const x = CW * 3 + 22 + k * 26 + rnd() * 8, top = 30 + rnd() * 34; stem(x - 4 + rnd() * 8, H, x + (rnd() - 0.5) * 16, top, 2);
    for (let p = 0; p < 7; p++) { const yy = top + p * 8 + 3, xx = x + (rnd() - 0.5) * 6 + (p % 2 ? 4 : -4); g.fillStyle = ['#5d8dff', '#7aa6ff', '#4a74ee'][p % 3]; g.beginPath(); g.ellipse(xx, yy + 4, 4.2, 6.2, 0, 0, TAU); g.fill(); g.fillStyle = '#d7e6ff'; g.beginPath(); g.arc(xx, yy + 9, 1.4, 0, TAU); g.fill(); }
  }
  return mkTex(c);
}
function padTexture() {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2); gr.addColorStop(0, '#5fae4a'); gr.addColorStop(0.7, '#3f8a3a'); gr.addColorStop(1, '#2c6a30');
  g.fillStyle = gr; g.beginPath(); g.moveTo(S / 2, S / 2); g.arc(S / 2, S / 2, S / 2 - 3, 0.28, TAU - 0.28); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(190,230,140,0.45)'; g.lineWidth = 1.4;
  for (let k = 0; k < 9; k++) { const a = 0.28 + (TAU - 0.56) * (k / 8); g.beginPath(); g.moveTo(S / 2, S / 2); g.lineTo(S / 2 + Math.cos(a) * (S / 2 - 8), S / 2 + Math.sin(a) * (S / 2 - 8)); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2; return t;
}

export function buildMoat(ctx, api) {
  const { scene, M, Q, water } = api, fh = api.fastHeight || api.height;
  if (!L.TOWN) return { update() {} };
  const LV = L.MOAT.level, R = rng(4242), B = ctx.B;
  const q0 = Q && Q.level === 'low' ? 0.4 : Q && Q.level === 'medium' ? 0.7 : 1, SE = season(), winter = SE.s === 3;
  const gateAng = L.TGATES.map((g) => Math.atan2(g.z, g.x));
  const nearGate = (ang) => gateAng.some((a) => Math.abs(Math.atan2(Math.sin(ang - a), Math.cos(ang - a))) < 0.05);

  // ---------------------------------------------------------------- the two waterlines of the town moat
  const inner = [], outer = [];            // [x, z] or null
  const dirs = [];
  for (let k = 0; k < NS; k++) {
    const ang = (k / NS) * TAU, dx = Math.cos(ang), dz = Math.sin(ang), rp = rayPoly(L.TOWN, ang);
    dirs.push([dx, dz]);
    const ri = cross(fh, LV, 0, 0, dx, dz, rp + 1.5, rp + L.MOAT2.off + 1.5);
    const ro = ri == null ? null : cross(fh, LV, 0, 0, dx, dz, rp + L.MOAT2.off + 1, rp + L.MOAT2.off + 24);
    inner.push(ri == null ? null : [dx * ri, dz * ri]);
    outer.push(ro == null ? null : [dx * ro, dz * ro]);
  }

  // the moat's centre line and half width every 4 degrees (fish and ducks swim along it); gaps (the river mouth) bridged from the neighbours
  const ring = { rc: new Float32Array(90), hw: new Float32Array(90) };
  {
    const rc = new Float32Array(NS), hw = new Float32Array(NS), ok = [];
    for (let k = 0; k < NS; k++) if (inner[k] && outer[k]) { const ri = Math.hypot(...inner[k]), ro = Math.hypot(...outer[k]); rc[k] = (ri + ro) / 2; hw[k] = (ro - ri) / 2; ok.push(k); }
    if (ok.length) for (let k = 0; k < NS; k++) {
      if (inner[k] && outer[k]) continue;
      let a = ok[0], b = ok[0]; for (const o of ok) { if (o < k) a = o; if (o > k) { b = o; break; } }
      if (a > k) a = ok[ok.length - 1]; if (b < k) b = ok[0];
      const span = ((b - a) + NS) % NS || NS, f = (((k - a) + NS) % NS) / span;
      rc[k] = rc[a] + (rc[b] - rc[a]) * f; hw[k] = Math.min(hw[a], hw[b]);
    }
    for (let j = 0; j < 90; j++) { ring.rc[j] = rc[j * 4]; ring.hw[j] = Math.max(1.5, hw[j * 4]); }
  }

  // ---------------------------------------------------------------- stone quay on the wall side (paved slope + curb), one merged mesh
  {
    const V = []; // triangle positions
    const tri = (a, b, c) => V.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const quad = (a, b, c, d, hint) => {                 // a,b,c,d around the quad; flipped so that the face looks along `hint`
      const u = sub(b, a), v = sub(d, a), n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      if (n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] < 0) { tri(a, d, c); tri(a, c, b); } else { tri(a, b, c); tri(a, c, d); }
    };
    // cross-section rows, d = metres inland from the waterline; the paving lies 0.18 on the mesh, the curb stands 0.5 above the ground
    const ROWS = [-0.9, 0, 0.8, 1.6, 2.4];
    const CURB0 = 2.4, CURB1 = 3.15;
    const prof = (k) => {
      const P = inner[k]; if (!P) return null;
      const [dx, dz] = dirs[k], rows = ROWS.map((d) => { const x = P[0] - dx * d, z = P[1] - dz * d; return [x, Math.max(fh(x, z) + 0.2, LV - 0.55), z]; });
      for (let i = 1; i < rows.length; i++) rows[i][1] = Math.max(rows[i][1], rows[i - 1][1]);
      const cx0 = P[0] - dx * CURB0, cz0 = P[1] - dz * CURB0, cx1 = P[0] - dx * CURB1, cz1 = P[1] - dz * CURB1;
      const gy = Math.max(fh((cx0 + cx1) / 2, (cz0 + cz1) / 2), rows[rows.length - 1][1] - 0.2), top = gy + 0.5;
      return { rows, c0: [cx0, top, cz0], c1: [cx1, top, cz1], b0: [cx0, rows[rows.length - 1][1] - 0.02, cz0], b1: [cx1, gy - 0.1, cz1], dx, dz };
    };
    let prev = prof(0);
    for (let k = 0; k < NS; k++) {
      const k2 = (k + 1) % NS, cur = prof(k2), a0 = (k / NS) * TAU;
      if (prev && cur && !nearGate(a0) && !nearGate((k2 / NS) * TAU)) {
        for (let i = 0; i < ROWS.length - 1; i++) quad(prev.rows[i], cur.rows[i], cur.rows[i + 1], prev.rows[i + 1], [0, 1, 0]);
        // curb: water-side face, top, land-side face
        const w = [prev.dx, 0, prev.dz];
        quad(prev.b0, cur.b0, cur.c0, prev.c0, w);
        quad(prev.c0, cur.c0, cur.c1, prev.c1, [0, 1, 0]);
        quad(prev.c1, cur.c1, cur.b1, prev.b1, [-w[0], 0, -w[2]]);
      }
      prev = cur;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(V, 3)); g.computeVertexNormals();
    B.add(g, M.stone, null, { worldUV: 0.1, tint: 0xb8c0cc });
  }

  // ---------------------------------------------------------------- bank scatter helpers (moat outside, lake, river)
  const reeds = [], rocks = [], pads = [], lotus = [];
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const outerAt = (u) => {                    // u in [0, NS): a point on the outer waterline (null across the river mouth)
    const k = Math.floor(u) % NS, k2 = (k + 1) % NS; if (!outer[k] || !outer[k2]) return null;
    return { p: lerp2(outer[k], outer[k2], u - Math.floor(u)), d: dirs[k] };
  };
  for (let u = 0; u < NS; u += 0.55 + R() * 0.8) {
    const o = outerAt(u); if (!o || nearGate((u / NS) * TAU)) continue;
    const [dx, dz] = o.d, off = (R() - 0.55) * 1.6;                 // + inland (away from the water), - into the water
    const x = o.p[0] + dx * off, z = o.p[1] + dz * off;
    if (R() < 0.62) {                                               // reed clump
      const n = 1 + Math.floor(R() * 3);
      for (let i = 0; i < n; i++) {
        const xx = x + (R() - 0.5) * 1.8, zz = z + (R() - 0.5) * 1.8, h = fh(xx, zz);
        if (h > LV + 1.1 || h < LV - 0.8) continue;
        reeds.push([xx, h - 0.1, zz, R() * 3.14, 0.9 + R() * 0.8]);
      }
    }
    if (R() < 0.42) {                                               // boulder at the waterline
      const xx = o.p[0] + dx * (R() * 1.6 - 0.5), zz = o.p[1] + dz * (R() * 1.6 - 0.5), s = 0.35 + Math.pow(R(), 2) * 0.9;
      rocks.push([xx, fh(xx, zz) - s * 0.28, zz, R() * 6.28, s]);
    }
    if (R() < 0.3) {                                                // lily cluster just inside the water edge
      const cx = o.p[0] - dx * (1.2 + R() * 2.2), cz = o.p[1] - dz * (1.2 + R() * 2.2), n = 3 + Math.floor(R() * 4);
      for (let i = 0; i < n; i++) pads.push([cx + (R() - 0.5) * 2.4, cz + (R() - 0.5) * 2.4, R() * 6.28, 0.55 + R() * 0.7]);
      if (R() < 0.55) lotus.push([cx + (R() - 0.5) * 1.2, cz + (R() - 0.5) * 1.2, R() * 6.28, 0.8 + R() * 0.5, Math.floor(R() * 3)]);
    }
  }
  // lake rim
  {
    const Lk = L.LAKE;
    for (let a = 0; a < TAU; a += 0.045 + R() * 0.05) {
      if (Math.abs(Math.atan2(Math.sin(a - JETTY_ANG), Math.cos(a - JETTY_ANG))) < 0.13) continue;     // the jetty's landing stays clear
      const dx = Math.cos(a), dz = Math.sin(a), r = cross(fh, LV, Lk.x, Lk.z, dx, dz, Lk.r * 0.5, Lk.r * 1.9); if (r == null) continue;
      const x = Lk.x + dx * r, z = Lk.z + dz * r;
      if (R() < 0.55) for (let i = 0; i < 2; i++) { const xx = x + dx * (R() - 0.6) * 1.8 + (R() - 0.5), zz = z + dz * (R() - 0.6) * 1.8 + (R() - 0.5), h = fh(xx, zz); if (h < LV + 1.1 && h > LV - 0.8) reeds.push([xx, h - 0.1, zz, R() * 3.14, 1 + R() * 0.9]); }
      if (R() < 0.35) { const s = 0.4 + Math.pow(R(), 2) * 1.1; rocks.push([x + dx * R(), fh(x, z) - s * 0.28, z + dz * R(), R() * 6.28, s]); }
      if (R() < 0.35) { const cx = x - dx * (1.5 + R() * 3), cz = z - dz * (1.5 + R() * 3); for (let i = 0; i < 4; i++) pads.push([cx + (R() - 0.5) * 2.6, cz + (R() - 0.5) * 2.6, R() * 6.28, 0.6 + R() * 0.8]); if (R() < 0.6) lotus.push([cx, cz, R() * 6.28, 0.9, Math.floor(R() * 3)]); }
    }
  }
  // the lake's reed beds (dense stands that read from afar, rooted in the shallows) and lily-pad colonies with their flowers
  const reedSpots = [];
  {
    const Lk = L.LAKE, R2 = rng(7781), beds = 7;
    for (let b = 0; b < beds; b++) {
      const ac = JETTY_ANG + 0.55 + (b + R2() * 0.5) * (TAU - 1.1) / beds, span = 0.08 + R2() * 0.12, n = Math.round((40 + R2() * 30) * (0.6 + 0.4 * q0));
      for (let i = 0; i < n; i++) {
        const a = ac + (R2() - 0.5) * 2 * span, dx = Math.cos(a), dz = Math.sin(a), r = cross(fh, LV, Lk.x, Lk.z, dx, dz, Lk.r * 0.5, Lk.r * 1.9); if (r == null) continue;
        const off = -Math.pow(R2(), 0.7) * 3.4 + 0.9, xx = Lk.x + dx * (r + off) + (R2() - 0.5) * 0.8, zz = Lk.z + dz * (r + off) + (R2() - 0.5) * 0.8, h = fh(xx, zz);
        if (h > LV + 0.9 || h < LV - 1.3) continue;
        reeds.push([xx, h - 0.1, zz, R2() * 3.14, 1.25 + R2() * 0.85]);
        if (i === 0) reedSpots.push([xx, zz]);
      }
    }
    for (let c = 0; c < 6; c++) {
      const a = JETTY_ANG + 0.9 + c * (TAU - 1.6) / 6 + R2() * 0.3, dx = Math.cos(a), dz = Math.sin(a), r = cross(fh, LV, Lk.x, Lk.z, dx, dz, Lk.r * 0.5, Lk.r * 1.9); if (r == null) continue;
      const cx = Lk.x + dx * (r - 4 - R2() * 4), cz = Lk.z + dz * (r - 4 - R2() * 4), rad = 3 + R2() * 3, n = 26 + ((R2() * 22) | 0);
      for (let i = 0; i < n; i++) { const t = Math.sqrt(R2()) * rad, b2 = R2() * TAU; pads.push([cx + Math.cos(b2) * t * 1.3, cz + Math.sin(b2) * t, R2() * 6.28, 0.55 + R2() * 0.75]); }
      for (let i = 0; i < 3 + ((R2() * 4) | 0); i++) { const t = Math.sqrt(R2()) * rad * 0.8, b2 = R2() * TAU; lotus.push([cx + Math.cos(b2) * t, cz + Math.sin(b2) * t, R2() * 6.28, 0.8 + R2() * 0.4, R2() < 0.6 ? 0 : 1 + ((R2() * 2) | 0)]); }
    }
  }
  // river banks (only the part inside the playable valley)
  {
    const P = L.RIVER;
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len;
      for (let s = 0; s < len; s += 7 + R() * 6) {
        const cx = a[0] + tx * s, cz = a[1] + tz * s; if (Math.hypot(cx, cz) > 300 || L.sdTown(cx, cz) < 2) continue;                                   // (p38: inside the town the river is a stone-edged canal: no reeds / boulders)
        for (const side of [-1, 1]) {
          const nx = -tz * side, nz = tx * side, r = cross(fh, LV, cx, cz, nx, nz, 0, 14); if (r == null) continue;
          const x = cx + nx * r, z = cz + nz * r;
          if (R() < 0.6) { const xx = x + nx * (R() - 0.6) * 1.6, zz = z + nz * (R() - 0.6) * 1.6, h = fh(xx, zz); if (h < LV + 1.1 && h > LV - 0.8) reeds.push([xx, h - 0.1, zz, R() * 3.14, 0.9 + R() * 0.8]); }
          if (R() < 0.4) { const sc = 0.4 + Math.pow(R(), 2) * 1.1; rocks.push([x, fh(x, z) - sc * 0.28, z, R() * 6.28, sc]); }
        }
      }
    }
  }

  // ---------------------------------------------------------------- the living bank: a dense fringe of sedge, wild flowers and more reeds on every waterline
  const q = Q && Q.level === 'low' ? 0.4 : Q && Q.level === 'medium' ? 0.7 : 1, FB = L.NOISE;
  const shore = [];                                   // [x, z, dx, dz] on the waterline, (dx, dz) pointing inland
  for (let u = 0; u < NS; u += 0.45 + R() * 0.4) { const o = outerAt(u); if (!o || nearGate((u / NS) * TAU)) continue; shore.push([o.p[0], o.p[1], o.d[0], o.d[1]]); }
  {
    const Lk = L.LAKE;
    for (let a = 0; a < TAU; a += 0.035 + R() * 0.03) { const dx = Math.cos(a), dz = Math.sin(a), r = cross(fh, LV, Lk.x, Lk.z, dx, dz, Lk.r * 0.5, Lk.r * 1.9); if (r != null) shore.push([Lk.x + dx * r, Lk.z + dz * r, dx, dz]); }
    const P = L.RIVER;
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len;
      for (let sdist = 0; sdist < len; sdist += 2.2 + R() * 1.6) {
        const cx = a[0] + tx * sdist, cz = a[1] + tz * sdist; if (Math.hypot(cx, cz) > 300 || L.sdTown(cx, cz) < 2) continue;
        for (const side of [-1, 1]) { const nx = -tz * side, nz = tx * side, r = cross(fh, LV, cx, cz, nx, nz, 0, 14); if (r != null) shore.push([cx + nx * r, cz + nz * r, nx, nz]); }
      }
    }
  }
  const sedges = [], blooms = [];
  for (const [x, z, dx, dz] of shore) {
    const nS = Math.round((2.6 + R() * 3.4) * q);
    for (let i = 0; i < nS; i++) {                    // sedge / meadow tufts, thick at the water and thinning out inland
      const off = -0.25 + Math.pow(R(), 1.5) * 5.4, lat = (R() - 0.5) * 2.6, px = x + dx * off - dz * lat, pz = z + dz * off + dx * lat, h = fh(px, pz);
      if (h < LV - 0.3 || h > LV + 3.6 || roadDist(px, pz) < 1.2) continue;
      sedges.push([px, h - 0.05, pz, R() * 6.28, (0.85 + R() * 0.7) * (1 - Math.max(0, off) * 0.045), R()]);
    }
    if (R() < 0.34 * q + 0.1) {                       // more reeds on the very edge
      const off = (R() - 0.65) * 1.5, px = x + dx * off + (R() - 0.5) * 1.2, pz = z + dz * off + (R() - 0.5) * 1.2, h = fh(px, pz);
      if (h < LV + 1.1 && h > LV - 0.7) reeds.push([px, h - 0.1, pz, R() * 3.14, 0.9 + R() * 0.9]);
    }
    const pat = FB.fbm(x * 0.045 + 3, z * 0.045 - 8, 2);       // wild flowers grow in drifts of one colour
    if (pat > -0.1) {
      const kind = R() < 0.8 ? Math.min(3, Math.floor((FB.fbm(x * 0.03 + 9, z * 0.03, 1) * 0.5 + 0.5) * 4)) : Math.floor(R() * 4);
      const nF = Math.round((0.8 + R() * 2.4) * (0.5 + (pat + 0.1) * 2.6) * q);
      for (let i = 0; i < nF; i++) {
        const off = 0.5 + R() * 4.6, lat = (R() - 0.5) * 2.4, px = x + dx * off - dz * lat, pz = z + dz * off + dx * lat, h = fh(px, pz);
        if (h < LV + 0.05 || h > LV + 3.2 || roadDist(px, pz) < 1.5) continue;
        blooms.push([px, h - 0.04, pz, R() * 6.28, 0.85 + R() * 0.6, kind]);
      }
    }
  }

  // winter: no flowers, no floating leaves (the shallows are iced over); the reeds and the sedge stand straw-coloured
  if (winter) { blooms.length = 0; pads.length = 0; lotus.length = 0; }
  const tintR = [1, 1, 1], DRY = winter ? 0.85 : SE.s === 2 ? 0.25 : 0;          // reeds and sedge dry to straw in autumn / winter (in their shader)

  // ---------------------------------------------------------------- instanced meshes
  const holder = new THREE.Group(); holder.name = 'bank-life'; scene.add(holder);
  const uTime = { value: 0 };
  const I4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const place = (mesh, i, x, y, z, ry, sx, sy = sx, sz = sx) => { Q4.setFromAxisAngle(UP, ry); mesh.setMatrixAt(i, I4.compose(V3.set(x, y, z), Q4, S3.set(sx, sy, sz))); };

  // reeds: three crossed quads, wind sway in the vertex shader
  let reedMesh = null;
  if (reeds.length) {
    const quads = []; for (let k = 0; k < 3; k++) { const g = new THREE.PlaneGeometry(1.7, 2.55); g.translate(0, 1.27, 0); g.rotateY(k * Math.PI / 3); quads.push(g); }
    const geo = mergeSimple(quads);
    const mat = new THREE.MeshLambertMaterial({ map: reedTexture(), alphaTest: 0.42, side: THREE.DoubleSide });
    mat.customProgramCacheKey = () => 'bwreed' + DRY;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float swf = uv.y * uv.y; float ph = instanceMatrix[3].x * 0.23 + instanceMatrix[3].z * 0.19;
          transformed.x += (sin(uTime * 1.5 + ph) * 0.085 + sin(uTime * 3.1 + ph * 2.0) * 0.025) * swf;
          transformed.z += cos(uTime * 1.2 + ph) * 0.06 * swf;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.35, 0.55, 0.1))) * vec3(1.55, 1.22, 0.66), ${DRY.toFixed(2)});`);
    };
    reedMesh = new THREE.InstancedMesh(geo, mat, reeds.length); reedMesh.name = 'reeds';
    const rc = new THREE.Color();
    reeds.forEach((r, i) => { place(reedMesh, i, r[0], r[1], r[2], r[3], r[4], r[4] * (0.85 + (i % 5) * 0.08), r[4]); reedMesh.setColorAt(i, rc.setRGB((0.82 + (i % 7) * 0.035) * tintR[0], (0.9 + (i % 5) * 0.03) * tintR[1], (0.78 + (i % 3) * 0.05) * tintR[2])); });
    reedMesh.instanceMatrix.needsUpdate = true; reedMesh.instanceColor.needsUpdate = true; holder.add(reedMesh);
  }
  // sedge tufts: three crossed quads, gentle wind
  let sedgeMesh = null;
  if (sedges.length) {
    const quads = []; for (let k = 0; k < 3; k++) { const g = new THREE.PlaneGeometry(1.7, 1.06); g.translate(0, 0.53, 0); g.rotateY(k * Math.PI / 3); quads.push(g); }
    const mat = new THREE.MeshLambertMaterial({ map: sedgeTexture(), alphaTest: 0.4, side: THREE.DoubleSide });
    mat.customProgramCacheKey = () => 'bwsedge' + DRY;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float swf = uv.y * uv.y; float ph = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.27;
          transformed.x += (sin(uTime * 1.9 + ph) * 0.07 + sin(uTime * 4.1 + ph * 2.0) * 0.02) * swf;
          transformed.z += cos(uTime * 1.5 + ph) * 0.05 * swf;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.35, 0.55, 0.1))) * vec3(1.55, 1.22, 0.66), ${DRY.toFixed(2)});`);
    };
    sedgeMesh = new THREE.InstancedMesh(mergeSimple(quads), mat, sedges.length); sedgeMesh.name = 'sedge';
    const c = new THREE.Color();
    sedges.forEach((r, i) => { place(sedgeMesh, i, r[0], r[1], r[2], r[3], r[4], r[4] * (0.8 + r[5] * 0.5), r[4]); sedgeMesh.setColorAt(i, c.setRGB((0.78 + r[5] * 0.3) * tintR[0], (0.88 + r[5] * 0.16) * tintR[1], (0.74 + r[5] * 0.2) * tintR[2])); });
    sedgeMesh.instanceMatrix.needsUpdate = true; sedgeMesh.instanceColor.needsUpdate = true; holder.add(sedgeMesh);
  }
  // wild flowers: one atlas (iris | loosestrife | daisies | bluebells), the cell is a per-instance attribute
  let bloomMesh = null;
  if (blooms.length) {
    const quads = []; for (let k = 0; k < 2; k++) { const g = new THREE.PlaneGeometry(1.15, 1.72); g.translate(0, 0.86, 0); g.rotateY(k * Math.PI / 2); quads.push(g); }
    const geo = mergeSimple(quads);
    const cell = new Float32Array(blooms.length); blooms.forEach((b, i) => { cell[i] = b[5]; });
    geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cell, 1));
    const mat = new THREE.MeshLambertMaterial({ map: flowerAtlas(), alphaTest: 0.45, side: THREE.DoubleSide });
    mat.customProgramCacheKey = () => 'bwbloom';
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aCell; uniform float uTime;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv.x = vMapUv.x * 0.25 + aCell * 0.25;\n#endif')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float swf = uv.y * uv.y; float ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.29;
          transformed.x += (sin(uTime * 1.7 + ph) * 0.06 + sin(uTime * 3.7 + ph * 2.0) * 0.02) * swf;
          transformed.z += cos(uTime * 1.3 + ph) * 0.045 * swf;`);
    };
    bloomMesh = new THREE.InstancedMesh(geo, mat, blooms.length); bloomMesh.name = 'bank-flowers';
    blooms.forEach((r, i) => place(bloomMesh, i, r[0], r[1], r[2], r[3], r[4], r[4] * (0.85 + (i % 4) * 0.1), r[4]));
    bloomMesh.instanceMatrix.needsUpdate = true; holder.add(bloomMesh);
  }
  // boulders
  if (rocks.length) {
    const geo = new THREE.IcosahedronGeometry(1, 1), pa = geo.attributes.position;
    for (let i = 0; i < pa.count; i++) { const h = Math.sin(pa.getX(i) * 7.1 + pa.getY(i) * 3.3) * Math.cos(pa.getZ(i) * 5.7 + 1.3); pa.setXYZ(i, pa.getX(i) * (1 + 0.16 * h), pa.getY(i) * (0.72 + 0.12 * h), pa.getZ(i) * (1 + 0.16 * Math.sin(h * 9))); }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.96, metalness: 0.02, flatShading: true });
    const mesh = new THREE.InstancedMesh(geo, mat, rocks.length); mesh.name = 'bank-rocks';
    const c = new THREE.Color(); const tones = [0x5d636c, 0x4f5864, 0x625f55, 0x464e5c, 0x585e58];
    rocks.forEach((r, i) => { place(mesh, i, r[0], r[1], r[2], r[3], r[4], r[4] * (0.7 + (i % 3) * 0.1), r[4] * (0.8 + (i % 4) * 0.1)); mesh.setColorAt(i, c.set(tones[i % tones.length]).offsetHSL(0, 0, (R() - 0.5) * 0.08)); });
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; holder.add(mesh);
  }
  // floating: lily pads + blue/white/pink lotus (the group rides the tide)
  const floater = new THREE.Group(); floater.name = 'floaters'; holder.add(floater);
  if (pads.length) {
    const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshLambertMaterial({ map: padTexture(), alphaTest: 0.5, side: THREE.DoubleSide });
    const mesh = new THREE.InstancedMesh(geo, mat, pads.length); mesh.name = 'lily-pads';
    const pc = new THREE.Color(), PR = rng(99);
    pads.forEach((p, i) => { place(mesh, i, p[0], LV + 0.035 + (i % 4) * 0.004, p[1], p[2], p[3]); const r = PR(); mesh.setColorAt(i, r < 0.12 ? pc.setRGB(0.86, 0.62, 0.42) : pc.setRGB(0.6 + r * 0.28, 0.68 + r * 0.22, 0.5 + r * 0.16)); });
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; floater.add(mesh);
  }
  if (lotus.length) {
    const pts = [[0.001, 0], [0.1, 0.03], [0.24, 0.14], [0.27, 0.3], [0.17, 0.4], [0.09, 0.3], [0.04, 0.2], [0.001, 0.12]].map(([x, y]) => new THREE.Vector2(x, y));
    const geo = new THREE.LatheGeometry(pts, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide, emissive: 0x20304a, emissiveIntensity: 0.25 });
    const mesh = new THREE.InstancedMesh(geo, mat, lotus.length); mesh.name = 'lotus';
    const tones = [0xf4f9ff, 0xf5a9cb, 0x9ed2ff], c = new THREE.Color();
    lotus.forEach((p, i) => { place(mesh, i, p[0], LV + 0.04, p[1], p[2], p[3]); mesh.setColorAt(i, c.set(tones[p[4]])); });
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; floater.add(mesh);
  }

  // ---------------------------------------------------------------- the life on the water (water_life.js) and the lamps whose light the water mirrors
  for (let k = 0; k < reeds.length; k += 23) reedSpots.push([reeds[k][0], reeds[k][2]]);
  let life = { update() {}, lamps: [], stats: {} };
  try { life = buildWaterLife({ scene, M, Q, B, torch: ctx.torch ? (...a) => ctx.torch(...a) : null, fh, water, ring, reedSpots, LV }); } catch (e) { console.warn('water life', e); }
  let lampsDone = false;
  const bakeLamps = () => {
    lampsDone = true; if (!water || !water.setLamps) return;
    let pts = api.flames && api.flames.p;
    if (!pts) scene.traverse((o) => { if (!pts && o.isPoints && o.geometry.attributes.col && o.geometry.attributes.seed && o.geometry.attributes.size) pts = o.geometry.attributes.position.array; });
    const list = [...life.lamps], dep = water.depthAt;
    if (pts && dep) for (let i = 0; i < pts.length; i += 3) {
      const x = pts[i], z = pts[i + 2]; if (L.TOWN && L.sdTown(x, z) < -1) continue;            // behind the town wall: the wall hides it from the moat
      let near = false; for (let a = 0; a < 8 && !near; a++) for (const d of [3, 7, 11]) if (dep(x + Math.cos(a * 0.785) * d, z + Math.sin(a * 0.785) * d) > 0.3) { near = true; break; }
      if (near && !list.some((l) => Math.hypot(l[0] - x, l[1] - z) < 1)) list.push([x, z, 0.9]);
    }
    if (list.length) water.setLamps(list);
  };
  return {
    stats: { reeds: reeds.length, rocks: rocks.length, pads: pads.length, lotus: lotus.length, sedges: sedges.length, blooms: blooms.length, shore: shore.length, ...life.stats },
    shore, life,
    update(t, dt, camera, P) {
      uTime.value = t;
      if (water && water.mesh) floater.position.y = water.mesh.position.y - LV;
      if (!lampsDone) { try { bakeLamps(); } catch (e) { console.warn('water lamps', e); } }
      life.update(t, dt || 0.016, camera, P);
    },
  };
}

// merge a few indexed geometries (position/normal/uv) without pulling in the batcher
function mergeSimple(list) {
  const pos = [], nor = [], uv = [], idx = []; let base = 0;
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u.getX(i), u.getY(i)); }
    for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + base);
    base += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx); return out;
}
