// GR1 — the ground you actually stand on.
//  * a road / wear signed-distance map (1 CPU pass, 1 RGBA8 texture): crisp road edges with ragged verges, wheel ruts, trodden yards, paved plazas
//  * five photo layers (grass, dry grass, packed earth, mud, cobble) as two texture ARRAYS (albedo + normals) = 2 samplers; detail is added as
//    a high-pass RATIO on top of the baked ground colour, so season / theme / lighting of the bake stay in charge
//  * three looks (1 = A "Meadow", 2 = B "Painterly", 3 = C "Realistic") that are only uniform values + a few extras (tufts / contact shadows / clutter)
//  * groundH(x, z): THE one height of the walkable ground — every prop that must sit on the grass (RP1C feet, tufts, decals) asks this
// Budget: +0 shader programs (patches the terrain program), +3 samplers (map, albedo[], normal[]), 1 draw call per extra, nothing allocated per frame.
import * as THREE from 'three';
import * as L from './layout.js';
import { ROADS, YARDS } from './roads.js';
import { hamlets } from './hamlets.js';
import { nomads, stableGrounds } from './nomads.js';
const assetBase = () => ((typeof window !== 'undefined' && window.BW_ASSETS) || '/assets/').replace(/\/?$/, '/');   // same rule as assets.js BASE, evaluated lazily so headless tests can import this file

const DEFAULT_LOOK = 1;                 // GR1: the look the game starts with (1 A Meadow, 2 B Painterly, 3 C Realistic); ?look=N switches it for a test
const HALF = 384;                       // the map covers +-384 m (the farthest road is at 348 m)
const LAYERS = ['ph_rock', 'ph_grass2', 'ph_path', 'ph_mud', 'ph_cobble'];     // 0 meadow, 1 dry grass, 2 packed earth, 3 mud, 4 cobble
const SZ = 512;                         // layer resolution
const MUD_KINDS = { livestock: 1, slaughter: 1, fishery: 1 };

// ---------------------------------------------------------------- looks (uniform tables)
//   p1: grass detail, earth detail, normal strength, cavity (contact darkening in joints / pits)
//   p2: edge roughness (m), rut depth, saturation, contrast
//   p3: patchiness (painterly hue patches), moss in the joints, wet (puddles in ruts), posterise
//   p4: mid-frequency ground character, brush strokes, ink outline on road edges, exposure
//   p5: soft contact shadow under houses / halls (strength), little stones on bare earth, dust patches on bare earth
//   te: road earth tint (rgb, linear) + verge darkening ; tp: paved tint (rgb) + paved fringe
export const GLSL_SRC = () => GLSL_COMMON;
export const LOOKS = {
  1: { name: 'A Meadow',    p1: [1.0, 1.0, 0.65, 0.15], p2: [0.45, 0.85, 1.12, 1.15], p3: [0.20, 0.55, 0.00, 0.00], p4: [0.55, 0.0, 0.0, 1.06], p5: [0.40, 0.55, 0.55, 0], te: [0.40, 0.30, 0.18, 0.30], tp: [0.24, 0.235, 0.23, 0.5] },
  2: { name: 'B Painterly', p1: [0.5, 0.5, 0.25, 0.0],   p2: [0.65, 0.60, 1.08, 0.80], p3: [0.95, 0.20, 0.00, 0.80], p4: [0.35, 1.0, 1.0, 1.0], p5: [0.50, 0.05, 0.35, 0], te: [0.46, 0.33, 0.22, 0.90], tp: [0.27, 0.25, 0.245, 0.9] },
  3: { name: 'C Realistic', p1: [0.9, 1.0, 1.0, 0.55],   p2: [0.85, 1.00, 0.92, 1.30], p3: [0.12, 0.30, 0.35, 0.00], p4: [0.30, 0.0, 0.0, 0.93], p5: [0.30, 1.00, 0.50, 0], te: [0.34, 0.29, 0.22, 0.45], tp: [0.21, 0.21, 0.215, 0.3] },
};

let _fastH = null, _map = null, _res = 0;          // module singletons (one terrain per page)
export function groundH(x, z) { return _fastH ? _fastH(x, z) : L.height(x, z); }       // shared height of the ground you walk on
// kind of ground at a point: 0 grass, 1 paved, 2 earth road, 3 field track, 4 trodden earth, 5 mud
export function groundKind(x, z) {
  if (!_map) return 0;
  const i = Math.floor((x + HALF) / (2 * HALF) * _res), j = Math.floor((z + HALF) / (2 * HALF) * _res);
  if (i < 0 || j < 0 || i >= _res || j >= _res) return 0;
  const k = (j * _res + i) * 4, sd = (c) => (0.5 - _map[k + c] / 255) * 8;
  if (sd(0) < 0) return 1; if (sd(1) < 0) return 2; if (sd(2) < 0) return 3;
  const a = _map[k + 3] / 255; if (a > 0.51 + 0.49 * 0.25) return 5; if (a > 0.5) return 0; return a > 0.49 * 0.25 ? 4 : 0;
}

// ---------------------------------------------------------------- the CPU map
function buildMap(res, extraPaved, H = L.height) {
  const N = res, px = 2 * HALF / N, data = new Uint8Array(N * N * 4);
  const sd = [new Float32Array(N * N).fill(4), new Float32Array(N * N).fill(4), new Float32Array(N * N).fill(4)];
  const wear = new Float32Array(N * N), mudW = new Float32Array(N * N);
  const LVW = L.MOAT.level + 0.05;
  const bb = (x0, z0, x1, z1, pad) => [Math.max(0, Math.floor((x0 - pad + HALF) / px)), Math.max(0, Math.floor((z0 - pad + HALF) / px)), Math.min(N - 1, Math.ceil((x1 + pad + HALF) / px)), Math.min(N - 1, Math.ceil((z1 + pad + HALF) / px))];
  const seg = (ch, ax, az, bx, bz, hw) => {
    const [i0, j0, i1, j1] = bb(Math.min(ax, bx), Math.min(az, bz), Math.max(ax, bx), Math.max(az, bz), hw + 4.2);
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, S = sd[ch];
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = -HALF + (i + 0.5) * px, z = -HALF + (j + 0.5) * px;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), d = Math.hypot(x - ax - dx * t, z - az - dz * t) - hw;
      if (d < S[j * N + i]) S[j * N + i] = d;
    }
  };
  const disc = (ch, cx, cz, r) => {
    const [i0, j0, i1, j1] = bb(cx - r, cz - r, cx + r, cz + r, 4.2), S = sd[ch];
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = -HALF + (i + 0.5) * px, z = -HALF + (j + 0.5) * px, d = Math.hypot(x - cx, z - cz) - r;
      if (d < S[j * N + i]) S[j * N + i] = d;
    }
  };
  for (const R of ROADS) {
    const ch = R.surf === 'cobble' ? 0 : R.surf === 'track' ? 2 : 1, hw = R.w / 2;
    for (let i = 0; i < R.pts.length - 1; i++) seg(ch, R.pts[i][0], R.pts[i][1], R.pts[i + 1][0], R.pts[i + 1][1], hw);
  }
  for (const E of extraPaved || []) {
    if (E.disc) disc(0, E.x, E.z, E.r);
    else for (let i = 0; i < E.pts.length - 1; i++) seg(0, E.pts[i][0], E.pts[i][1], E.pts[i + 1][0], E.pts[i + 1][1], E.w / 2);
  }
  // trodden ground: yards, worksites, greens, camps (earth) and pens (mud)
  const patch = (cx, cz, r, w, mud) => {
    const R = r + 4, [i0, j0, i1, j1] = bb(cx - R, cz - R, cx + R, cz + R, 0);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = -HALF + (i + 0.5) * px, z = -HALF + (j + 0.5) * px, d = Math.hypot(x - cx, z - cz);
      let a = w * (1 - Math.min(1, Math.max(0, (d - r * 0.5) / (r * 0.5 + 3)))); if (a <= 0) continue;
      a = a * a * (3 - 2 * a);
      const k = j * N + i; if (mud) { if (a > mudW[k]) mudW[k] = a; } else if (a > wear[k]) wear[k] = a;
    }
  };
  for (const Y of YARDS) patch(Y.x, Y.z, Y.r, 0.85, false);
  for (const S of L.SITES || []) patch(S.x, S.z, S.r * 0.8, 0.8, !!MUD_KINDS[S.kind]);
  for (const H of hamlets()) patch(H.x, H.z, 13, 0.6, false);
  for (const C of nomads()) patch(C.x, C.z, 11, 0.7, false);
  for (const G of stableGrounds()) { patch(G.x, G.z, G.r * 0.85, 0.8, false); patch(G.x, G.z, G.r * 0.4, 0.8, true); }
  if (L.CAMP) patch(L.CAMP.x, L.CAMP.z, L.CAMP.r, 0.75, false);
  if (L.MUSTER && L.MUSTER.r > 0) patch(L.MUSTER.x, L.MUSTER.z, L.MUSTER.r + 2, 0.7, false);
  if (L.PASTURE) { patch(L.PASTURE.x, L.PASTURE.z, L.PASTURE.r * 0.7, 0.35, false); patch(L.PASTURE.x, L.PASTURE.z, 6, 0.6, true); }
  // pack.  A road that lies under water is not painted (bridges are real geometry).
  for (let k = 0; k < N * N; k++) {
    const j = (k / N) | 0, i = k - j * N;
    for (let c = 0; c < 3; c++) {
      let s = sd[c][k];
      if (s < 0 && H(-HALF + (i + 0.5) * px, -HALF + (j + 0.5) * px) < LVW) s = 0.6;
      data[k * 4 + c] = Math.round(255 * Math.max(0, Math.min(1, 0.5 - s / 8)));
    }
    const m = mudW[k], w = wear[k];
    data[k * 4 + 3] = m > w ? Math.round(255 * (0.51 + 0.49 * m)) : Math.round(255 * 0.49 * w);
  }
  return { data, px };
}

// ---------------------------------------------------------------- the photo layers
function layerPixels(img, size, flipRows) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  if (flipRows) { g.translate(0, size); g.scale(1, -1); }                // rows bottom-up: the array is sampled with the usual v-up convention
  g.drawImage(img, 0, 0, size, size);
  return g.getImageData(0, 0, size, size).data;
}
const lin = (v) => Math.pow(v / 255, 2.2);

function makeArray(data, layers, srgb) {
  const t = new THREE.DataArrayTexture(data, SZ, SZ, layers);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------- the shader
const GLSL_COMMON = `
uniform sampler2D uGrMap; uniform sampler2DArray uGrA, uGrN;
uniform vec4 uGrBox, uGrP1, uGrP2, uGrP3, uGrP4, uGrP5, uGrTE, uGrTP, uGrS, uGrAO[32]; uniform float uGrAOn;
uniform vec3 uGrMean[5];
float gGrW = 0.0, gGrR = -1.0; vec3 gGrT = vec3(0.0, 0.0, 1.0);
float grN(vec2 p, float s) { return clamp((textureLod(uDetail, p * s, 0.0).r - 0.5) * 3.0 + 0.5, 0.0, 1.0); }      // the detail noise is soft (0.35..0.65): stretch it to 0..1
float grNg(vec2 p, float s, vec2 dx, vec2 dy) { return clamp((textureGrad(uDetail, p * s, dx * s, dy * s).r - 0.5) * 3.0 + 0.5, 0.0, 1.0); }     // same, mip-faded (fine speckle)
const mat2 GR_ROT = mat2(0.8, -0.6, 0.6, 0.8);
vec3 grPhoto(int li, vec2 p, float sc, vec2 dx, vec2 dy, float bias) {
  vec2 a = p * sc, b = GR_ROT * p * (sc * 0.337) + 0.31;
  vec2 ax = dx * sc * bias, ay = dy * sc * bias, bx = GR_ROT * dx * (sc * 0.337) * bias, by = GR_ROT * dy * (sc * 0.337) * bias;
  return mix(textureGrad(uGrA, vec3(a, float(li)), ax, ay).rgb, textureGrad(uGrA, vec3(b, float(li)), bx, by).rgb, 0.4);
}
float grLum(vec3 c) { return dot(c, vec3(0.3333)); }
void gr1Apply(inout vec3 c, float cdist) {
  vec2 xz = vWP.xz, dx = dFdx(xz), dy = dFdy(xz);
  float px = max(length(dx), length(dy)) * 0.75;
  float lvl = uGrS.x;
  if (lvl < 0.5 || cdist > 130.0 || gStp > 0.3) return;
  float farK = 1.0 - smoothstep(40.0, 120.0, cdist), nearK = 1.0 - smoothstep(18.0, 64.0, cdist), nearK2 = 1.0 - smoothstep(12.0, 50.0, cdist);
  vec2 muv = clamp((xz - uGrBox.xy) * uGrBox.z, 0.0, 1.0);
  vec4 mp = textureLod(uGrMap, muv, 0.0);
  vec3 sd = (0.5 - mp.rgb) * 8.0;
  float n1 = grN(xz, 0.21), n2 = grN(xz + 17.0, 0.83), n3 = grN(xz - 5.0, 0.047);
  float en = (n1 * 0.6 + n2 * 0.4 - 0.5);
  float er = uGrP2.x;
  float eP = sd.x + en * er * 0.35, eE = sd.y + en * er, eT = sd.z + en * er * 1.5;
  float aa = max(px, 0.03);
  float mP = 1.0 - smoothstep(-aa, aa, eP), mE = 1.0 - smoothstep(-aa, aa, eE), mT = 1.0 - smoothstep(-aa * 2.0 - 0.1, aa * 2.0 + 0.15, eT);
  float wA = mp.a, isMud = step(0.5, wA), wear = clamp(isMud > 0.5 ? (wA - 0.51) / 0.49 : wA / 0.49, 0.0, 1.0);
  float wm = smoothstep(0.32, 0.58, wear + (n2 - 0.5) * 0.8 + (n1 - 0.5) * 0.3) * step(0.02, wear);
  // what the baked colour is: grass (green) / bare earth (brown) / stone-snow (grey)
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), sat = (mx - mn) / max(mx, 1e-3);
  float colW = smoothstep(0.10, 0.28, sat), grn = smoothstep(-0.01, 0.04, c.g - c.r);
  int baseL = grn > 0.5 ? 0 : 2;
  vec3 rat = vec3(1.0);
  float bias = 1.0 + (1.0 - uGrP1.x) * 0.9;                                    // painterly: a softer brush (blurrier mip)
  float baseK = (baseL == 0 ? uGrP1.x : uGrP1.y) * colW * (1.0 - max(mE, max(mP, mT))) * (lvl >= 1.5 ? 1.0 : 0.0);
  float tileK = baseL == 0 ? 0.222 : 0.42;
  vec3 pb = vec3(1.0);
  bool needP = baseK * nearK > 0.003 || wm > 0.002 || min(sd.x, min(sd.y, sd.z)) < 1.7;
  if (needP) {
    pb = grPhoto(baseL, xz, tileK, dx, dy, bias);
    rat = clamp(pb / uGrMean[baseL], 0.35, 2.4);
    float cg = uGrP2.w; rat = pow(rat, vec3(cg));
  }
  vec3 base = c;
  // --- grass / bare ground: photo detail on top of the baked colour
  base *= mix(vec3(1.0), rat, baseK * nearK);
  // painterly patches / saturation grade
  {
    float pat = uGrP3.x * colW * farK;
    float h1 = grN(xz, 0.036), h2 = grN(xz + 9.0, 0.11);
    base *= mix(vec3(1.0), mix(vec3(1.10, 1.02, 0.80), vec3(0.84, 1.05, 1.02), h1), pat * 0.55) * (1.0 + (h2 - 0.5) * pat * 0.5);
    float lg = grLum(base); base = mix(vec3(lg), base, mix(1.0, uGrP2.z, colW * farK));
    // mid-frequency ground character (patches of lusher / drier / trodden ground between 0.3 and 5 m) + painterly brush strokes + exposure
    float m3 = grN(xz, 0.55), m4 = grN(xz + 3.0, 1.9), m5 = grN(xz - 8.0, 0.18);
    float midK = uGrP4.x * colW * (1.0 - smoothstep(14.0, 90.0, cdist));
    base *= mix(vec3(1.0), (0.74 + 0.52 * m3) * (0.88 + 0.24 * m4) * mix(vec3(1.0), vec3(1.07, 1.0, 0.86), m5), midK);
    if (uGrP4.y > 0.01) {
      vec2 sq = vec2(dot(xz, vec2(0.85, 0.53)), dot(xz, vec2(-0.53, 0.85)));
      float st = grN(sq * vec2(0.11, 0.85), 1.0), st2 = grN(sq * vec2(0.27, 1.9) + 4.0, 1.0);
      base *= 1.0 + ((st - 0.5) * 0.55 + (st2 - 0.5) * 0.3) * uGrP4.y * colW * (1.0 - smoothstep(20.0, 100.0, cdist));
    }
    base *= mix(1.0, uGrP4.w, colW);
  }
  // --- verge: trampled strip and ragged earth patches next to every road
  float vE = 1.0 - smoothstep(0.0, 1.1 + en * er * 1.6, sd.y);
  float vT = 1.0 - smoothstep(0.0, 0.8 + en * er * 2.0, sd.z);
  float vP = 1.0 - smoothstep(0.0, 0.7 + en * er, sd.x);
  vec3 earthA = vec3(0.0);
  vec3 pE = baseL == 2 ? pb : grPhoto(2, xz, 0.42, dx, dy, 1.0);                // packed earth photo
  if (mE > 0.002 || mT > 0.002 || wm > 0.002 || vE > 0.01 || vT > 0.01 || vP > 0.01) earthA = pE * uGrTE.xyz;
  float spk = grN(xz, 2.1);
  float vAny = max(max(vE, vT * 0.8), vP * 0.75);
  float rag = smoothstep(0.55, 0.95, vAny + (spk - 0.5) * 0.9);                  // earth specks creeping into the grass
  base = mix(base, base * vec3(0.78, 0.72, 0.62) * (1.0 - uGrTE.w * 0.25), vAny * uGrTE.w * (1.0 - mE));
  base = mix(base, earthA * 0.92, rag * 0.75 * (1.0 - mE) * colW);
  // --- worn ground (yards, worksites): earth, mud in the pens
  if (wm > 0.002) {
    vec3 mudA = grPhoto(3, xz, 0.42, dx, dy, 1.0) * vec3(0.34, 0.30, 0.26);
    vec3 wc = isMud > 0.5 ? mudA : earthA;
    base = mix(base, wc, wm * clamp(mix(0.9, 1.0, nearK), 0.0, 1.0));
  }
  // --- field track (grass hump between two ruts) and earth road (ruts, crown, ragged edge)
  float rutE = 0.0, rutT = 0.0;
  float rwob = 0.65 + 0.7 * grN(xz, 0.13);
  {
    float oE = (sd.y + 1.0), oT = (sd.z + 0.85);
    rutE = exp(-oE * oE / (0.05 + 0.02 * en)) * mE * rwob;
    rutT = exp(-oT * oT / 0.045) * mT * rwob;
  }
  float hump = mT * (1.0 - smoothstep(-1.75, -1.35, sd.z));                              // grass in the middle of a field track
  vec3 roadC = earthA;
  vec3 mudR = grPhoto(3, xz, 0.42, dx, dy, 1.0) * vec3(0.38, 0.33, 0.28);
  roadC = mix(roadC, mudR, clamp(rutE * 0.85 * uGrP2.y + 0.0, 0.0, 0.95));
  roadC *= 1.0 - 0.18 * smoothstep(0.0, 1.0, -sd.y) * (1.0 - hump);              // the centre is a little darker than the shoulders
  base = mix(base, roadC, mE);
  vec3 trackC = mix(earthA * 1.05, base * 0.95, hump * 0.8);
  trackC = mix(trackC, mudR, clamp(rutT * 0.8 * uGrP2.y, 0.0, 0.9));
  base = mix(base, trackC, mT * (1.0 - mE) * (0.55 + 0.45 * (1.0 - smoothstep(-0.6, 0.0, sd.z))));
  // --- bare earth everywhere (roads, yards, courtyards): dust patches, pits and little stones, so it is never a flat brown sheet
  {
    float eK = clamp(max(mE, max(mT * 0.8, wm)) + (1.0 - grn) * colW * 0.85, 0.0, 1.0) * (1.0 - mP) * nearK2;
    if (eK > 0.01) {
      float d1 = grN(xz, 0.9), d2 = grN(xz + 6.0, 2.6);
      vec3 e = base * (1.0 + (d1 - 0.5) * 0.9 * uGrP5.z + (d2 - 0.5) * 0.6 * uGrP5.z);
      float st = grNg(xz, 3.3, dx, dy), st2 = grNg(xz + 2.0, 9.0, dx, dy);
      float pe = smoothstep(0.62, 0.80, st) + smoothstep(0.70, 0.86, st2) * 0.6, pit = 1.0 - smoothstep(0.18, 0.34, st);
      e = mix(e, e * 1.75 + 0.02, clamp(pe, 0.0, 1.0) * uGrP5.y);
      e *= 1.0 - pit * 0.28 * uGrP5.y;
      base = mix(base, e, eK);
    }
  }
  // --- paved ground (plazas, market, painted lanes): cobble photo with moss in the joints, ragged trodden fringe
  if (mP > 0.002 || sd.x < 1.0) {
    vec3 cb = grPhoto(4, xz, 0.45, dx, dy, 1.0);
    vec3 cr = clamp(cb / uGrMean[4], 0.3, 2.2);
    vec3 pc = uGrTP.xyz * pow(cr, vec3(uGrP2.w));
    float joint = 1.0 - smoothstep(0.30, 0.75, grLum(cr));
    pc = mix(pc, pc * vec3(0.55, 0.85, 0.40) + vec3(0.004, 0.012, 0.0), joint * uGrP3.y * 0.7);
    base = mix(base, pc, mP);
    float kerb = (1.0 - smoothstep(0.0, 0.14, abs(eP))) * 0.4;
    base *= 1.0 - kerb * uGrTP.w * 0.6;
  }
  if (uGrP4.z > 0.01) {      // painterly: a dark brush line right on every road edge
    float ink = max(max(1.0 - smoothstep(0.0, 0.11 + aa, abs(eE)), (1.0 - smoothstep(0.0, 0.09 + aa, abs(eT))) * 0.7), 1.0 - smoothstep(0.0, 0.11 + aa, abs(eP)));
    base *= 1.0 - ink * 0.34 * uGrP4.z * farK;
  }
  if (uGrP5.x > 0.01 && uGrAOn > 0.5) {      // soft contact shadow under the nearest houses (a rectangle SDF each, uploaded by JS when the camera moves)
    float ao = 0.0;
    for (int i = 0; i < 16; i++) {
      if (float(i) >= uGrAOn) break;
      vec4 a = uGrAO[i * 2], b = uGrAO[i * 2 + 1];
      vec2 d = xz - a.xy, q = vec2(d.x * b.x - d.y * b.y, d.x * b.y + d.y * b.x), e = abs(q) - a.zw;
      ao = max(ao, 1.0 - smoothstep(-0.3, 2.6, length(max(e, vec2(0.0))) + min(max(e.x, e.y), 0.0)));
    }
    base *= 1.0 - ao * uGrP5.x * (1.0 - smoothstep(30.0, 75.0, cdist));
  }
  // --- contact darkening in pits and joints (realistic look)
  float cav = 1.0;
  if (needP && uGrP1.w > 0.01) { float rl = grLum(rat); cav = mix(1.0, clamp(rl * rl, 0.55, 1.15), uGrP1.w * nearK); }
  base *= cav;
  // --- snow: roads stay trodden grey-brown under it
  if (uGrS.y > 0.01) {
    float snw = clamp(uGrS.y * 1.15, 0.0, 1.0), onRoad = max(max(mE, mT * 0.8), mP);
    base = mix(base, base * vec3(0.9, 0.9, 0.95) + vec3(0.78, 0.82, 0.88) * (0.9 + 0.2 * rat.g) * 0.2, snw * onRoad * 0.7);
  }
  if (uGrP3.w > 0.01) {      // painterly: soft value steps (a few tones, like blocked-in paint)
    float Lb = max(grLum(base), 1e-4), q = sqrt(Lb) * 5.0, f = fract(q), qq = (floor(q) + smoothstep(0.28, 0.72, f)) / 5.0;
    base *= mix(1.0, qq * qq / Lb, uGrP3.w * colW * farK * (1.0 - mP));
  }
  c = mix(c, base, farK);
  // ---- normal tilt + roughness for the lighting stage
  if (lvl >= 1.5 && uGrP1.z > 0.01 && nearK > 0.01) {
    int nl = mP > 0.5 ? 4 : (wm > 0.5 ? (isMud > 0.5 ? 3 : 2) : (mE > 0.5 || mT > 0.5) ? 2 : baseL);
    float sc = nl == 4 ? 0.45 : nl == 0 ? 0.222 : 0.42;
    vec3 nt = textureGrad(uGrN, vec3(xz * sc, float(nl)), dx * sc * 1.2, dy * sc * 1.2).xyz * 2.0 - 1.0;
    // rut grooves: slope of the groove profile times the direction towards the road edge (from the map)
    vec2 g = vec2(0.0);
    if (rutE + rutT > 0.01) {
      float t = uGrBox.w;
      float sx = (0.5 - textureLod(uGrMap, clamp(muv + vec2(uGrBox.z * t, 0.0), 0.0, 1.0), 0.0).g) * 8.0;
      float sz = (0.5 - textureLod(uGrMap, clamp(muv + vec2(0.0, uGrBox.z * t), 0.0, 1.0), 0.0).g) * 8.0;
      g = vec2(sx - sd.y, sz - sd.y) / t;
      float prof = -2.0 * (sd.y + 1.0) / 0.05 * rutE;
      nt.xy += g * prof * 0.045 * uGrP2.y;
    }
    gGrT = normalize(vec3(nt.xy * 1.0, max(nt.z, 0.2)));
    gGrW = uGrP1.z * nearK * (nl == 0 ? 0.5 : 1.0);
    float wet = uGrP3.z + uGrS.z;
    if (wet > 0.01) gGrR = mix(0.97, 0.5, clamp((rutE + rutT) * wet * 1.6, 0.0, 1.0));
  }
}
`;


// ---------------------------------------------------------------- scatter: instanced grass clumps (looks A, C) and pebbles (look C) around the hero
// One InstancedMesh per class, a toroidal window of cells that follows the camera: a cell that leaves the window is refilled with the one that enters
// (no per-frame allocation, ~150 cells per 1.2 m step).  Created only while the camera is low (hero views), disposed when it is high.
const TUFT_COL = [['#4c8a24', '#6aa032'], ['#6f8a2a', '#9a9a3a'], ['#8a6a24', '#a88a3a'], ['#6a6a4a', '#85805a']].map((r) => r.map((h) => new THREE.Color(h)));
const SG = 44, SC = 1.1, SR = 24;
const SK = { tuft: 5, pebble: 3 };                      // candidates per cell
function tuftGeometry() {
  const nb = 15, pos = new Float32Array(nb * 9), col = new Float32Array(nb * 9), nor = new Float32Array(nb * 9);
  let r = 12345; const rnd = () => ((r = (r * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let b = 0; b < nb; b++) {
    const a = rnd() * 6.283, d = 0.01 + rnd() * 0.05, h = 0.13 + rnd() * 0.2, w = 0.008 + rnd() * 0.008, lean = 0.03 + rnd() * 0.09, la = a + (rnd() - 0.5) * 0.8;
    const bx = Math.cos(a) * d, bz = Math.sin(a) * d, tx = bx + Math.cos(la) * lean * 1.4, tz = bz + Math.sin(la) * lean * 1.4, px = -Math.sin(la) * w, pz = Math.cos(la) * w;
    pos.set([bx - px, 0, bz - pz, bx + px, 0, bz + pz, tx, h, tz], b * 9); nor.set([0, 1, 0, 0, 1, 0, 0, 1, 0], b * 9);
    col.set([0.40, 0.40, 0.40, 0.40, 0.40, 0.40, 1, 1, 1], b * 9);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return g;
}
const hash2 = (a, b) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const mod = (a, n) => ((a % n) + n) % n;

function createScatter(scene, kind) {
  const isT = kind === 'tuft', K = SK[kind], N = SG * SG * K;
  const geo = isT ? tuftGeometry() : new THREE.IcosahedronGeometry(0.5, 0);
  if (!isT) { const c = new Float32Array(geo.attributes.position.count * 3).fill(1); geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: isT ? 0.95 : 0.9, metalness: 0, side: isT ? THREE.DoubleSide : THREE.FrontSide, envMapIntensity: 0.25, flatShading: !isT });
  const TU = { uTufR: { value: SR }, uTufT: { value: 0 }, uTufW: { value: isT ? 1 : 0 } };
  mat.customProgramCacheKey = () => 'gr1-' + kind;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, TU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTufR, uTufT, uTufW;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 gIp = vec3(instanceMatrix[3]);
        float gFk = 1.0 - smoothstep(uTufR * 0.55, uTufR, distance(gIp, cameraPosition));
        transformed *= gFk;
        transformed.xz += uTufW * vec2(sin(uTufT * 1.7 + gIp.x * 0.9 + gIp.z * 0.6), cos(uTufT * 1.3 + gIp.z * 0.8 - gIp.x * 0.3)) * 0.05 * position.y * position.y * 8.0 * gFk;`);
  };
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  mesh.userData.rpKeep = 1;                       // the hero diet / pack culling (rpg_diet.js, cull.js) must leave this alone: the mesh follows the camera, a bounding sphere computed once is stale after the first steps
  mesh.name = 'gr1-' + kind; mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = true; mesh.count = N;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const colA = new Float32Array(N * 3); mesh.instanceColor = new THREE.InstancedBufferAttribute(colA, 3); mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  const M = mesh.instanceMatrix.array; M.fill(0);
  const held = new Int32Array(SG * SG * 2).fill(-999999);
  let palette = [[0.35, 0.55, 0.16], [0.52, 0.56, 0.22]], dens = 1, hgt = 1;
  const fill = (slot, wx, wz) => {
    for (let k = 0; k < K; k++) {
      const i = slot * K + k, o = i * 16;
      const x = (wx + hash2(wx * 7 + k, wz * 3 + 11)) * SC, z = (wz + hash2(wx * 5 - 3, wz * 11 + k * 17)) * SC;
      let y = 0, sc = 0;
      const gk = groundKind(x, z);
      if (hash2(wx * 13 + k * 3, wz * 17 - k) < dens * (isT ? 0.25 + 0.9 * ((L.NOISE ? L.NOISE.fbm(x * 0.09 + 7, z * 0.09 - 3, 2) : 0) * 0.5 + 0.5) : 1) && (isT ? gk === 0 : (gk >= 2 && gk !== 5)) && L.sdPoly(L.OUTER, x, z) > 3) {
        y = groundH(x, z);
        if (y > L.MOAT.level + 0.25 && Math.abs(groundH(x + 0.6, z) - y) < 0.3 && Math.abs(groundH(x, z + 0.6) - y) < 0.3) sc = (isT ? 0.6 + 0.9 * hash2(wx + k * 31, wz * 2 + 5) : 0.045 + 0.07 * hash2(wx + k * 31, wz * 2 + 5)) * (isT ? hgt : 1);
      }
      const a = hash2(wx * 3 + 1, wz * 9 + k) * 6.283, cs = Math.cos(a), sn = Math.sin(a), sy = isT ? sc : sc * 0.55, sz = isT ? sc : sc * (0.7 + 0.5 * hash2(wx, wz + k));
      M[o] = cs * sc; M[o + 1] = 0; M[o + 2] = -sn * sc; M[o + 3] = 0; M[o + 4] = 0; M[o + 5] = sy; M[o + 6] = 0; M[o + 7] = 0;
      M[o + 8] = sn * sz; M[o + 9] = 0; M[o + 10] = cs * sz; M[o + 11] = 0; M[o + 12] = x; M[o + 13] = y + (isT ? 0 : sc * 0.12); M[o + 14] = z; M[o + 15] = 1;
      if (isT) {
        const t = hash2(wx - k * 5, wz + 23), p = palette[t < 0.5 ? 0 : 1], v = 0.8 + 0.4 * hash2(wx * 19 + k, wz * 7);
        colA[i * 3] = p[0] * v; colA[i * 3 + 1] = p[1] * v; colA[i * 3 + 2] = p[2] * v * (0.9 + 0.2 * t);
      } else { const v = 0.55 + 0.7 * hash2(wx * 3 + k, wz * 5); colA[i * 3] = 0.26 * v; colA[i * 3 + 1] = 0.23 * v; colA[i * 3 + 2] = 0.19 * v; }
    }
  };
  let cx = -99999, cz = -99999;
  const api = {
    mesh, instances: N, tris: N * (geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3),
    setStyle(st) { dens = st.dens; hgt = st.h; if (st.palette) palette = st.palette; held.fill(-999999); cx = cz = -99999; },
    update(cam, t) {
      TU.uTufT.value = t;
      const hx = Math.floor(cam.x / SC), hz = Math.floor(cam.z / SC);
      if (hx === cx && hz === cz) return;
      cx = hx; cz = hz;
      const h0 = hx - SG / 2, z0 = hz - SG / 2;
      for (let wz = z0; wz < z0 + SG; wz++) for (let wx = h0; wx < h0 + SG; wx++) {
        const slot = mod(wz, SG) * SG + mod(wx, SG);
        if (held[slot * 2] === wx && held[slot * 2 + 1] === wz) continue;
        held[slot * 2] = wx; held[slot * 2 + 1] = wz; fill(slot, wx, wz);
      }
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
    },
    dispose() { scene.remove(mesh); geo.dispose(); mat.dispose(); mesh.dispose(); },
  };
  scene.add(mesh);
  return api;
}

export function createGround({ renderer, T, quality, scene }) {
  const res = quality === 'low' ? 768 : 1024;
  const paved = [];
  const U = {
    uGrMap: { value: null }, uGrA: { value: null }, uGrN: { value: null },      // (1x1 placeholders until the first build: 'low' quality never pays for the real ones)
    uGrBox: { value: new THREE.Vector4(-HALF, -HALF, 1 / (2 * HALF), 2 * HALF / res) },
    uGrP1: { value: new THREE.Vector4() }, uGrP2: { value: new THREE.Vector4() }, uGrP3: { value: new THREE.Vector4() }, uGrP4: { value: new THREE.Vector4() }, uGrP5: { value: new THREE.Vector4() }, uGrAO: { value: Array.from({ length: 32 }, () => new THREE.Vector4()) }, uGrAOn: { value: 0 },
    uGrTE: { value: new THREE.Vector4() }, uGrTP: { value: new THREE.Vector4() }, uGrS: { value: new THREE.Vector4(quality === 'low' ? 0 : quality === 'medium' ? 2 : 3, 0, 0, 1) },
    uGrMean: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector3(0.3, 0.3, 0.3)) },
  };
  { const ph = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat); ph.needsUpdate = true; U.uGrMap.value = ph;
    const pa = new THREE.DataArrayTexture(new Uint8Array([128, 128, 128, 255]), 1, 1, 1); pa.needsUpdate = true; U.uGrA.value = pa; U.uGrN.value = pa; }
  let built = false, ready = false, look = (() => { try { const v = parseInt(new URLSearchParams(location.search).get('look'), 10); return v >= 1 && v <= 3 ? v : DEFAULT_LOOK; } catch (e) { return DEFAULT_LOOK; } })(), detail = quality === 'low' ? 0 : quality === 'medium' ? 2 : 3, tufts = null, pebbles = null, attached = false, farFrames = 0, sw = [0, 1, 0, 0], fp = [], aoX = 1e9, aoZ = 1e9;
  const aoI = new Int32Array(16), aoD = new Float32Array(16);
  const api = {
    U, look: () => look, detail: () => detail,
    // lane polylines / discs that are paved but painted into the splat (castle lanes, plaza): [{pts, w} | {disc, x, z, r}]
    setPaved(list) { paved.length = 0; paved.push(...list); },
    build() {
      if (built) return; built = true;
      const t0 = performance.now();
      const { data, px } = buildMap(res, paved, groundH);
      _map = data; _res = res;
      const tex = new THREE.DataTexture(data, res, res, THREE.RGBAFormat); tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = false; tex.flipY = false; tex.needsUpdate = true;
      U.uGrMap.value = tex;
      U.uGrBox.value.set(-HALF, -HALF, 1 / (2 * HALF), px);                   // .w = texel size in metres (rut-normal gradient step)
      // albedo array (sync: the images are already loaded) + flat normal array (filled when the four missing normal maps arrive)
      const A = new Uint8Array(SZ * SZ * 4 * LAYERS.length), Nn = new Uint8Array(SZ * SZ * 4 * LAYERS.length);
      const mean = [];
      LAYERS.forEach((k, li) => {
        const img = T && T[k] && T[k].image; let px4;
        if (img) { try { px4 = layerPixels(img, SZ, true); } catch (e) { px4 = null; } }
        if (!px4) { px4 = new Uint8Array(SZ * SZ * 4); for (let i = 0; i < px4.length; i += 4) { px4[i] = 90; px4[i + 1] = 100; px4[i + 2] = 60; px4[i + 3] = 255; } }
        A.set(px4, li * SZ * SZ * 4);
        let s = [0, 0, 0], n = 0;
        for (let i = 0; i < px4.length; i += 4 * 97) { s[0] += lin(px4[i]); s[1] += lin(px4[i + 1]); s[2] += lin(px4[i + 2]); n++; }
        mean.push(s.map((v) => Math.max(0.01, v / n)));
        for (let i = li * SZ * SZ * 4; i < (li + 1) * SZ * SZ * 4; i += 4) { Nn[i] = 128; Nn[i + 1] = 128; Nn[i + 2] = 255; Nn[i + 3] = 255; }
      });
      mean.forEach((m, i) => U.uGrMean.value[i].set(m[0], m[1], m[2]));
      const maxA = renderer ? Math.min(4, renderer.capabilities.getMaxAnisotropy()) : 1;
      const ta = makeArray(A, LAYERS.length, true), tn = makeArray(Nn, LAYERS.length, false); ta.anisotropy = tn.anisotropy = maxA;
      U.uGrA.value = ta; U.uGrN.value = tn; api.arrays = [ta, tn];
      const nUrl = (k) => assetBase() + 'tex/' + k + '_n.webp';
      Promise.all(LAYERS.map((k, li) => new Promise((ok) => {
        const done = (img) => { if (img) { try { Nn.set(layerPixels(img, SZ, true), li * SZ * SZ * 4); } catch (e) { /* keep flat */ } } ok(); };
        if (T && T[k + '_n'] && T[k + '_n'].image) return done(T[k + '_n'].image);
        if (typeof Image === 'undefined') return done(null);
        const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => done(im); im.onerror = () => done(null); im.src = nUrl(k);
      }))).then(() => { tn.needsUpdate = true; ready = true; api.applyLook(); });
      api.buildMs = performance.now() - t0;
    },
    // plug the terrain shader (called from terrain.js inside onBeforeCompile; 'sh' = three's shader object)
    patch(sh) {
      Object.assign(sh.uniforms, U);
      sh.fragmentShader = sh.fragmentShader
        .replace('float gStp = 0.0; vec3 gW = vec3(0.0);', 'float gStp = 0.0; vec3 gW = vec3(0.0);\n' + (api.glsl || GLSL_COMMON))
        .replace('diffuseColor.rgb = c;', 'gr1Apply(c, distance(vWP, cameraPosition));\n            diffuseColor.rgb = c;')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n          if (gGrR >= 0.0) roughnessFactor = mix(roughnessFactor, gGrR, 0.85);')
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          if (gGrW > 0.01) {
            vec3 Ng = normalize(vNrm), Tg = normalize(vec3(1.0, 0.0, 0.0) - Ng * Ng.x), Bg = cross(Tg, Ng);
            vec3 Nb = normalize(Tg * gGrT.x + Bg * gGrT.y + Ng * gGrT.z);
            normal = normalize(mix(normal, normalize((viewMatrix * vec4(Nb, 0.0)).xyz), gGrW));
          }`);
    },
    applyLook() {
      const Lk = LOOKS[look] || LOOKS[1];
      U.uGrP1.value.set(...Lk.p1); U.uGrP2.value.set(...Lk.p2); U.uGrP3.value.set(...Lk.p3); U.uGrP4.value.set(...Lk.p4); U.uGrP5.value.set(...Lk.p5); U.uGrTE.value.set(...Lk.te); U.uGrTP.value.set(...Lk.tp);
      U.uGrS.value.x = detail; U.uGrS.value.w = look;
      if (!ready) U.uGrP1.value.z = 0;                                       // no normals until the four missing normal maps are in
      if (detail < 2) U.uGrP1.value.z = 0;
    },
    setLook(n) { look = n; api.applyLook(); api.styleTufts(); },
    setDetail(n) { detail = Math.max(0, Math.min(3, n | 0)); if (detail > 0 && attached) api.build(); api.applyLook(); },
    setSeason(w, snow) { sw = w; U.uGrS.value.y = snow; api.styleTufts(); },
    setWet(v) { U.uGrS.value.z = v; },
    attach(fastHeight) { _fastH = fastHeight; attached = true; },
    // houses / halls for the contact shadows: [{ x, z, w, d, ry }] (the town plan's lots + the generic houses)
    setFootprints(list) { fp = (list || []).filter((q) => q && q.w > 0 && q.d > 0 && q.kind !== 'market'); aoX = aoZ = 1e9; },
    // per frame (world.update): tufts live only while the camera is low (hero views) and the look wants them
    refreshAO(x, z) {
      aoX = x; aoZ = z; let n = 0;
      for (let i = 0; i < fp.length; i++) {
        const q = fp[i], d = Math.hypot(q.x - x, q.z - z) - Math.hypot(q.w, q.d) * 0.5; if (d > 80) continue;
        let k; if (n < 16) k = n++; else { if (aoD[15] <= d) continue; k = 15; }
        while (k > 0 && aoD[k - 1] > d) { aoD[k] = aoD[k - 1]; aoI[k] = aoI[k - 1]; k--; }
        aoD[k] = d; aoI[k] = i;
      }
      for (let k = 0; k < n; k++) { const q = fp[aoI[k]], c = Math.cos(q.ry || 0), s = Math.sin(q.ry || 0); U.uGrAO.value[2 * k].set(q.x, q.z, q.w / 2, q.d / 2); U.uGrAO.value[2 * k + 1].set(c, s, 1, 0); }
      U.uGrAOn.value = n;
    },
    update(cam, dt, t) {
      if (fp.length && U.uGrP5.value.x > 0.01 && Math.hypot(cam.position.x - aoX, cam.position.z - aoZ) > 8) api.refreshAO(cam.position.x, cam.position.z);
      const hh = cam.position.y - groundH(cam.position.x, cam.position.z);
      const low = hh < 14 && Math.abs(cam.position.x) < HALF + 20 && Math.abs(cam.position.z) < HALF + 20;
      const ok = detail >= 3 && ready && !!scene && U.uGrS.value.y < 0.55 && low;
      const wantT = ok && look !== 2, wantP = ok && look === 3;
      if (wantT && !tufts) { tufts = createScatter(scene, 'tuft'); api.styleTufts(); }
      if (wantP && !pebbles) { pebbles = createScatter(scene, 'pebble'); api.styleTufts(); }
      if (!ok) farFrames++; else farFrames = 0;
      if (tufts && !wantT && (farFrames > 120 || ok || detail < 3)) { tufts.dispose(); tufts = null; }
      if (pebbles && !wantP && (farFrames > 120 || ok || detail < 3)) { pebbles.dispose(); pebbles = null; }
      if (tufts && wantT) tufts.update(cam.position, t);
      if (pebbles && wantP) pebbles.update(cam.position, t);
    },
    styleTufts() {
      const dry = look === 3, pal = [0, 1].map((tone) => {
        const o = [0, 0, 0];
        for (let q = 0; q < 4; q++) { const c = TUFT_COL[q][tone]; o[0] += sw[q] * c.r; o[1] += sw[q] * c.g; o[2] += sw[q] * c.b; }
        return dry ? [o[0] * 1.12 + 0.03, o[1] * 0.98 + 0.02, o[2] * 0.8] : o;
      });
      if (tufts) tufts.setStyle({ dens: dry ? 0.35 : 1.0, h: dry ? 0.75 : 1.0, palette: pal });
      if (pebbles) pebbles.setStyle({ dens: 0.5, h: 1 });
    },
    stats() { return { tufts: tufts ? tufts.instances : 0, pebbles: pebbles ? pebbles.instances : 0, tris: (tufts ? tufts.tris : 0) + (pebbles ? pebbles.tris : 0), calls: (tufts ? 1 : 0) + (pebbles ? 1 : 0) }; },
    isReady: () => ready,
    dispose() { if (tufts) { tufts.dispose(); tufts = null; } if (pebbles) { pebbles.dispose(); pebbles = null; } for (const t of [U.uGrMap.value, ...(api.arrays || [])]) t && t.dispose(); _map = null; _fastH = null; },
  };
  return api;
}

export { buildMap as __buildMap, HALF as __HALF };
