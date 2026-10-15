// GR1_R2 — the far ranges.  Replaces the two procedural rings that used to live in terrain.js (ridged noise, 380 + 620 m, one flat dark colour,
// Lambert + scene fog): in the hero camera they filled the top of the screen as a black saw-tooth ceiling.
//
// ONE mesh (one draw call, ≤ 8.4 k triangles = the old two rings), four overlapping bands, nearest -> farthest.  Every vertex colour is computed on the CPU
// whenever the hour / weather / fog changes (a few hundred µs): the rock + forest + snow albedo, lit by the same key / hemisphere light as the rest of
// the world, then blended toward the SKY'S OWN horizon colour by aerial perspective (each band lighter and bluer with distance, valleys hazier than crests).
// The material is MeshBasic, vertex colours, no scene fog and no tone map (the CPU does the ACES curve): the mountains' last haze step is EXACTLY the fog / sky-horizon
// colour (tod: P.hzn), so they melt into the sky at every hour.  Programs: this one replaces the two Lambert+fog programs of the old rings (net -2).
//
// looks (the owner picks by number from the sheet; default A):
//   A  smooth layered ridges + aerial perspective + snow caps by vertex colour (this file, always)
//   B  A + a near-field rim of library cliffs (set by `attachRim`, dev sheet only until the owner picks it)
//   C  A + a painted sky-band cylinder behind the rings (`setLook('C')` builds one canvas texture; 0 extra geometry)
import * as THREE from 'three';
import { makeNoise, clamp, smooth } from './noise.js';

const NZ = makeNoise(20261015);
const SEG = 350;
// rows across one band: [t across the band (0 = inner edge), fraction of the band's height]
const ROWS = [[0, 0], [0.34, 0.8], [0.5, 1], [1, 0.05]];
// bands, nearest first.  hmin/hmax in metres, f = angular frequency of the massif noise, snow = fraction of the band's height where snow starts,
// lo / hi / sn = albedo (sRGB hex) of the foot, the upper slopes and the snow, haze = band multiplier of the aerial-perspective density
const BANDS = [
  { r0: 940, r1: 1190, hmin: 60, hmax: 190, f: 2.1, seed: 1, snow: 2.0, lo: '#34402f', hi: '#5d6552', sn: '#e8eef5', haze: 1.0, forest: 1 },
  { r0: 1120, r1: 1480, hmin: 110, hmax: 300, f: 1.7, seed: 2, snow: 0.84, lo: '#3f4a3f', hi: '#65707b', sn: '#eef3f9', haze: 1.1, forest: 0.6 },
  { r0: 1450, r1: 1900, hmin: 180, hmax: 420, f: 1.5, seed: 3, snow: 0.66, lo: '#4a5668', hi: '#708096', sn: '#f2f6fb', haze: 1.2, forest: 0 },
  { r0: 1880, r1: 2400, hmin: 260, hmax: 560, f: 1.3, seed: 4, snow: 0.55, lo: '#586a85', hi: '#8193ad', sn: '#f6f9fd', haze: 1.3, forest: 0 },
];
const col = (h) => new THREE.Color(h);          // (sRGB hex -> linear working space)

// three's ACESFilmicToneMapping, on the CPU (the material is toneMapped:false so the haze colour can be the fog colour to the last bit)
const RRT = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);
function aces(c, ex) {
  const k = ex / 0.6, r = c.r * k, g = c.g * k, b = c.b * k;
  const a0 = RRT(0.59719 * r + 0.35458 * g + 0.04823 * b), a1 = RRT(0.076 * r + 0.90834 * g + 0.01566 * b), a2 = RRT(0.0284 * r + 0.13383 * g + 0.83777 * b);
  c.r = clamp(1.60475 * a0 - 0.53108 * a1 - 0.07367 * a2, 0, 1); c.g = clamp(-0.10208 * a0 + 1.10813 * a1 - 0.00605 * a2, 0, 1); c.b = clamp(-0.00327 * a0 - 0.07276 * a1 + 1.07602 * a2, 0, 1);
  return c;
}

function bandHeights(B) {                      // smooth 0..1 profile round the circle, no saw-tooth: low-frequency massif + a few ridged peaks, then blurred
  const h = new Float32Array(SEG);
  for (let i = 0; i < SEG; i++) {
    const a = (i / SEG) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    const big = NZ.fbm(ca * B.f + B.seed * 7.1, sa * B.f + B.seed * 3.3, 3) * 0.5 + 0.5;
    const rid = NZ.ridged(ca * B.f * 1.8 + B.seed * 11, sa * B.f * 1.8 - B.seed * 5, 3);
    h[i] = clamp(0.2 + 0.52 * big + 0.46 * big * rid, 0, 1);
  }
  const t = new Float32Array(SEG);
  for (let pass = 0; pass < 3; pass++) {       // 1-2-3-2-1 kernel x3 along the angle (wraps): the crest line becomes smooth
    for (let i = 0; i < SEG; i++) { const g = (k) => h[(i + k + SEG) % SEG]; t[i] = (g(-2) + 2 * g(-1) + 3 * g(0) + 2 * g(1) + g(2)) / 9; }
    h.set(t);
  }
  return h;
}

export function createBackdrop(scene, opts = {}) {
  const pos = [], nrm = [], idx = [], meta = [];       // meta per vertex: band, d (distance from the centre), hfrac, az, snow (static 0..1), forest (static 0..1)
  const bandCol = BANDS.map((B) => ({ lo: col(B.lo), hi: col(B.hi), sn: col(B.sn) }));
  let base = 0;
  BANDS.forEach((B, bi) => {
    const H = bandHeights(B), rs = ROWS.length;
    for (let j = 0; j < rs; j++) for (let i = 0; i <= SEG; i++) {
      const a = ((i % SEG) / SEG) * Math.PI * 2, [t, hf] = ROWS[j], ca = Math.cos(a), sa = Math.sin(a);
      const r = B.r0 + (B.r1 - B.r0) * t + NZ.fbm(ca * 5 + bi * 3, sa * 5, 2) * (B.r1 - B.r0) * 0.08 * Math.sin(Math.PI * t);
      const hh = B.hmin + (B.hmax - B.hmin) * H[i % SEG];
      let y = hh * hf; if (j === 0) y = bi === 0 ? -14 : 0;
      pos.push(ca * r, y, sa * r); nrm.push(0, 1, 0);
      const sn = clamp((y / B.hmax - B.snow + NZ.fbm(ca * 40 + bi, sa * 40, 2) * 0.06) / 0.1, 0, 1);
      meta.push(bi, r, y / B.hmax, a, sn, B.forest * clamp(1 - y / 120, 0, 1));
    }
    for (let j = 0; j < rs - 1; j++) for (let i = 0; i < SEG; i++) { const a2 = base + j * (SEG + 1) + i, b = a2 + 1, d = a2 + SEG + 1, e = d + 1; idx.push(a2, d, b, b, d, e); }
    base += rs * (SEG + 1);
  });
  const g = new THREE.BufferGeometry();
  const P = new Float32Array(pos), C = new Float32Array(pos.length);
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nrm), 3));
  g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const N = g.getAttribute('normal').array;
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'backdrop0'; mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.renderOrder = -5;
  scene.add(mesh);
  const nv = P.length / 3;
  // static albedo (snow only where the slope allows it; forest only on the lowest band's foot)
  const ALB = new Float32Array(nv * 3), tmp = new THREE.Color();
  for (let v = 0; v < nv; v++) {
    const bi = meta[v * 6], bc = bandCol[bi], hfr = meta[v * 6 + 2], ny = N[v * 3 + 1];
    tmp.copy(bc.lo).lerp(bc.hi, smooth(0.05, 0.75, hfr));
    const forest = meta[v * 6 + 5]; if (forest > 0) tmp.lerp(new THREE.Color('#2b3b27'), forest * 0.75);
    const sn = meta[v * 6 + 4] * smooth(0.12, 0.55, ny + 0.25);
    tmp.lerp(bc.sn, sn);
    ALB[v * 3] = tmp.r; ALB[v * 3 + 1] = tmp.g; ALB[v * 3 + 2] = tmp.b;
  }
  const hzn = new THREE.Color(), hzS = new THREE.Color(), kc = new THREE.Color(), hs = new THREE.Color(), hg = new THREE.Color(), px = new THREE.Color();
  let stamp = '';
  // Pt = tod sample; W = weather sample; fogCol = the scene's fog colour (weather-greyed) — the sky's horizon band is the same colour
  function update(Pt, W, fogCol, force) {
    if (!Pt) return;
    const fog = scene.fog, dens = fog ? fog.density : 0.0009;
    hzn.copy(fogCol || (fog ? fog.color : Pt.fog));
    hzS.copy(Pt.hznSun || hzn).lerp(hzn, W ? W.grey : 0);
    const key = ((Pt.hour * 40) | 0) + ':' + ((dens * 1e5) | 0) + ':' + (W ? ((W.cover * 8) | 0) + ((W.grey * 8) | 0) : '') + ':' + ((hzn.r + hzn.g * 3 + hzn.b * 7) * 200 | 0) + ':' + (opts.look || 'A');
    if (!force && key === stamp) return; stamp = key;
    const kd = Pt.keyDir, kI = Pt.keyI * (W ? 1 - 0.78 * Math.pow(W.cover, 1.7) : 1), night = Pt.night, ex = Pt.exposure || 1;
    kc.copy(Pt.key).multiplyScalar(kI / Math.PI);
    hs.copy(Pt.hemiSky).multiplyScalar(Pt.hemiI / Math.PI); hg.copy(Pt.hemiGnd).multiplyScalar(Pt.hemiI / Math.PI);
    const sx = kd.x, sz = kd.z, sl = Math.hypot(sx, sz) || 1;
    const cap = 1 - 0.12 * night;                                  // at night a little of the rock stays: the ridges read against the glow
    const Dh = Math.max(dens, 0.0006) * 1.25;                      // (the aerial haze follows the fog density, with a floor so a thin-fog setting still gets layers)
    for (let v = 0; v < nv; v++) {
      const bi = meta[v * 6], d = meta[v * 6 + 1], hfr = meta[v * 6 + 2], az = meta[v * 6 + 3];
      const nx = N[v * 3], ny = N[v * 3 + 1], nz = N[v * 3 + 2];
      const ndl = Math.max(0, nx * kd.x + ny * kd.y + nz * kd.z), hy = 0.5 + 0.5 * ny;
      px.setRGB(ALB[v * 3] * (kc.r * ndl + hg.r + (hs.r - hg.r) * hy), ALB[v * 3 + 1] * (kc.g * ndl + hg.g + (hs.g - hg.g) * hy), ALB[v * 3 + 2] * (kc.b * ndl + hg.b + (hs.b - hg.b) * hy));
      aces(px, ex);
      const x = Dh * BANDS[bi].haze * d;
      let hz = 1 - Math.exp(-x * x);
      hz += (1 - hz) * 0.32 * (1 - smooth(0, 0.7, hfr));          // valley mist: the foot of every band is hazier than its crest
      hz = Math.min(hz, cap);
      const wsun = Math.pow(0.5 + 0.5 * ((Math.cos(az) * sx + Math.sin(az) * sz) / sl), 3);
      const hr = hzn.r + (hzS.r - hzn.r) * wsun, hg2 = hzn.g + (hzS.g - hzn.g) * wsun, hb = hzn.b + (hzS.b - hzn.b) * wsun;
      C[v * 3] = px.r + (hr - px.r) * hz; C[v * 3 + 1] = px.g + (hg2 - px.g) * hz; C[v * 3 + 2] = px.b + (hb - px.b) * hz;
    }
    g.getAttribute('color').needsUpdate = true;
  }
  update.__stamp = () => stamp;
  // (dev, look C) the display-linear colour of each band as one flat tone: lit like a 40°-slope rock face, hazed for the band's mid distance
  function layerColors(Pt, W, fogCol, out = BANDS.map(() => new THREE.Color())) {
    const hz0 = fogCol || (scene.fog ? scene.fog.color : Pt.fog), dens = scene.fog ? scene.fog.density : 0.0009;
    const kd = Pt.keyDir, kI = Pt.keyI * (W ? 1 - 0.78 * Math.pow(W.cover, 1.7) : 1), ex = Pt.exposure || 1, ndl = Math.max(0, 0.77 * kd.y + 0.64 * 0.3);
    BANDS.forEach((B, bi) => {
      const a = bandCol[bi].lo.clone().lerp(bandCol[bi].hi, 0.55), c = out[bi];
      c.setRGB(a.r * (Pt.key.r * kI / Math.PI * ndl + Pt.hemiI / Math.PI * (Pt.hemiGnd.r + (Pt.hemiSky.r - Pt.hemiGnd.r) * 0.8)), a.g * (Pt.key.g * kI / Math.PI * ndl + Pt.hemiI / Math.PI * (Pt.hemiGnd.g + (Pt.hemiSky.g - Pt.hemiGnd.g) * 0.8)), a.b * (Pt.key.b * kI / Math.PI * ndl + Pt.hemiI / Math.PI * (Pt.hemiGnd.b + (Pt.hemiSky.b - Pt.hemiGnd.b) * 0.8)));
      aces(c, ex); const x = Math.max(dens, 0.0006) * 1.25 * B.haze * (B.r0 + B.r1) / 2, hz = Math.min(1 - Math.exp(-x * x), 1 - 0.12 * Pt.night);
      c.lerp(hz0, hz);
    });
    return out;
  }
  const api = {
    mesh, meshes: [mesh], look: 'A', update, layerColors, setLook(k) { opts.look = k; api.look = k; stamp = ''; },
    stats: () => ({ tris: idx.length / 3, verts: nv, calls: 1 }),
    dispose() { scene.remove(mesh); g.dispose(); mat.dispose(); },
  };
  return api;
}
