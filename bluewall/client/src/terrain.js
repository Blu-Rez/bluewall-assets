// Terrain (mountain ring, hills, moat, river, lake) + painted ground + water.
import * as THREE from 'three';
import { smooth } from './noise.js';
import * as L from './layout.js';
import { buildRoads, ROADS, roadDist as roadEdge } from './roads.js';
import { hamlets, hamletD } from './hamlets.js';
import { nomads, nomadD, stableGrounds } from './nomads.js';
import { wsD, WS_KINDS } from './worksites.js';
import { season } from './tod.js';

const SPLAT = 336;       // world units covered by the detailed painted ground map (castle + town)
const FAR = 1100;        // world units covered by the coarse painted map (roads, fields, camp, mines)
const EXTENT = 960;

const C = (hex) => new THREE.Color(hex).convertSRGBToLinear();
const PAL = {
  night: { grassA: C('#3b5a2a'), grassB: C('#5a7a3a'), forest: C('#2a4023'), mud: C('#4a4130'),
    bed: C('#34342f'), rockA: C('#5d626b'), rockB: C('#7f838b'), snow: C('#dfe8f4'), dry: C('#6d6a45') },
  day: { grassA: C('#93ad3e'), grassB: C('#6c9a33'), forest: C('#4f7a2c'), mud: C('#7a6a44'),
    bed: C('#4d5a52'), rockA: C('#8f8f88'), rockB: C('#b9b6ac'), snow: C('#f2f6fb'), dry: C('#a6a24e') },
};
let COL = PAL.night;

export function buildTerrain(scene, M, quality, T = null, renderer = null, opts = {}) {
  COL = PAL[L.MAP] || PAL.night;
  computeRoad();
  const SEG0 = quality === 'low' ? 200 : quality === 'medium' ? 250 : quality === 'ultra' ? 360 : 300;
  // grid lines: ~quadratic spacing like before, but 2.2x denser in the band around the town moat (r 92..208 m: the moat is only 9 m wide and
  // used to be 2 grid cells = a faceted trench), a floor of 2.4 m in the flat middle and a coarser far field (mountains) to pay for it
  const half = [0];
  for (let x = 0; x < EXTENT;) {
    let st = Math.max(4 * Math.sqrt(Math.max(x, 1) * EXTENT) / SEG0, 2.4);
    if (x > 420) st *= 1 + 0.5 * Math.min(1, (x - 420) / 300);
    st *= 1 - 0.55 * Math.min(1, Math.max(0, (x - 92) / 20)) * Math.min(1, Math.max(0, (208 - x) / 20));
    x = Math.min(EXTENT, x + st); if (EXTENT - x < st * 0.4) x = EXTENT; half.push(x);
  }
  const n = half.length * 2 - 1, SEG = n - 1, MID = half.length - 1;
  const pos = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), wts = new Float32Array(n * n * 4);
  const hs = new Float32Array(n * n), xs = new Float32Array(n);
  for (let i = 0; i < half.length; i++) { xs[MID + i] = half[i]; xs[MID - i] = -half[i]; }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = j * n + i, x = xs[i], z = xs[j], h = L.height(x, z);
    hs[k] = h; pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
  }
  const N = L.NOISE, c = new THREE.Color();
  // how far (m) every vertex is from open water: a two-pass chamfer over the real grid spacing. It drives the lush bank meadow in the ground bake
  const LVW = L.MOAT.level, wdist = new Float32Array(n * n).fill(1e4);
  for (let k = 0; k < n * n; k++) if (hs[k] < LVW + 0.1) wdist[k] = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = j * n + i; let d = wdist[k]; if (d === 0) continue;
    if (i > 0) d = Math.min(d, wdist[k - 1] + (xs[i] - xs[i - 1]));
    if (j > 0) { const dz = xs[j] - xs[j - 1]; d = Math.min(d, wdist[k - n] + dz); if (i > 0) d = Math.min(d, wdist[k - n - 1] + Math.hypot(xs[i] - xs[i - 1], dz)); if (i < n - 1) d = Math.min(d, wdist[k - n + 1] + Math.hypot(xs[i + 1] - xs[i], dz)); }
    wdist[k] = d;
  }
  for (let j = n - 1; j >= 0; j--) for (let i = n - 1; i >= 0; i--) {
    const k = j * n + i; let d = wdist[k]; if (d === 0) continue;
    if (i < n - 1) d = Math.min(d, wdist[k + 1] + (xs[i + 1] - xs[i]));
    if (j < n - 1) { const dz = xs[j + 1] - xs[j]; d = Math.min(d, wdist[k + n] + dz); if (i < n - 1) d = Math.min(d, wdist[k + n + 1] + Math.hypot(xs[i + 1] - xs[i], dz)); if (i > 0) d = Math.min(d, wdist[k + n - 1] + Math.hypot(xs[i] - xs[i - 1], dz)); }
    wdist[k] = d;
  }
  const bank = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = j * n + i, i0 = Math.max(0, i - 1), i1 = Math.min(SEG, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(SEG, j + 1);
    const sx = (hs[j * n + i1] - hs[j * n + i0]) / (xs[i1] - xs[i0]), sz = (hs[j1 * n + i] - hs[j0 * n + i]) / (xs[j1] - xs[j0]);
    bank[k] = (1 - smooth(3, 17, wdist[k])) * (1 - smooth(0.5, 0.9, Math.hypot(sx, sz))) * (1 - smooth(8, 20, hs[k] - LVW));
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = j * n + i, x = xs[i], z = xs[j], h = hs[k];
    const i0 = Math.max(0, i - 1), i1 = Math.min(SEG, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(SEG, j + 1);
    const sx = (hs[j * n + i1] - hs[j * n + i0]) / (xs[i1] - xs[i0]), sz = (hs[j1 * n + i] - hs[j0 * n + i]) / (xs[j1] - xs[j0]);
    const slope = Math.hypot(sx, sz);
    const nv = N.fbm(x * 0.03, z * 0.03, 3) * 0.5 + 0.5, fr = forestDensity(x, z);
    c.copy(COL.grassA).lerp(COL.grassB, nv * 0.8);
    c.lerp(COL.dry, smooth(0.55, 0.85, N.fbm(x * 0.01 + 7, z * 0.01, 2) * 0.5 + 0.5) * 0.5);
    c.lerp(COL.forest, fr * 0.8);
    c.lerp(COL.mud, 1 - smooth(-1.25, -0.5, h));
    c.lerp(COL.bed, 1 - smooth(-2.2, -0.9, h));
    const rock = Math.max(smooth(0.45, 0.85, slope), smooth(70, 130, h) * 0.9);
    c.lerp(nv > 0.5 ? COL.rockB : COL.rockA, rock);
    const snow = smooth(190, 245, h + N.fbm(x * 0.04, z * 0.04, 3) * 34) * (1 - smooth(1.0, 1.9, slope) * 0.7);
    c.lerp(COL.snow, snow);
    // texture weights: rock, snow, mud, forest floor (grass = remainder)
    const mud = Math.max(1 - smooth(-1.25, -0.5, h), 1 - smooth(-2.2, -0.9, h));
    wts[k * 4] = rock; wts[k * 4 + 1] = snow; wts[k * 4 + 2] = mud * (1 - rock); wts[k * 4 + 3] = fr * (1 - rock) * (1 - mud);
    col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
  }
  const idx = new Uint32Array(SEG * SEG * 6);
  let p = 0;
  for (let j = 0; j < SEG; j++) for (let i = 0; i < SEG; i++) {
    const a = j * n + i, b = a + 1, d = a + n, e = d + 1;
    idx[p++] = a; idx[p++] = d; idx[p++] = b; idx[p++] = b; idx[p++] = d; idx[p++] = e;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aW', new THREE.BufferAttribute(wts, 4));
  g.setAttribute('aBk', new THREE.BufferAttribute(bank, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();

  // uv = grid position (used by the far bake)
  const uvs = new Float32Array(n * n * 2);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { uvs[(j * n + i) * 2] = i / SEG; uvs[(j * n + i) * 2 + 1] = j / SEG; }
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  const splat = L.MAP === 'day' ? { near: paintGroundDay(), far: blankTex() } : { near: paintGround(), far: paintFar() };
  // ---- bake the expensive photographic ground into two textures once (near: top-down 2*NEAR m square,
  // far: whole terrain in grid space). The per-frame shader then needs ~3 texture reads instead of ~26.
  const big = quality === 'ultra' || quality === 'high';
  const bake = renderer && T && T.ph_rock ? bakeGround(renderer, g, splat, M, T, {
    near: quality === 'ultra' ? 3072 : quality === 'low' ? 1536 : 2048, far: big ? 2048 : 1536, season: opts.season, theme: opts.theme,
  }) : null;
  // the paintings and the bake-only photo textures are not needed on the GPU any more
  if (bake) {
    splat.near.dispose(); splat.far.dispose();
    for (const k of ['ph_grass2', 'ph_snow', 'ph_mud', 'ph_leaves', 'ph_path']) if (T[k]) T[k].dispose();       // (ph_mossrock stays: the cliffs use it at run time)
  }
  const FLATN = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1); FLATN.needsUpdate = true; FLATN.wrapS = FLATN.wrapT = THREE.RepeatWrapping;
  const mat = new THREE.MeshStandardMaterial({ vertexColors: !bake, roughness: 0.97, metalness: 0, envMapIntensity: 0.2 });
  if (bake) {
    mat.customProgramCacheKey = () => 'bwterrain-bake';
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uBakeN: { value: bake.near }, uBakeF: { value: bake.far }, uNear: { value: NEAR }, uDetail: { value: M.detail },
        uMeadow: { value: T.ph_rock }, uMeadowL: { value: bake.meadowL }, uCliff: { value: T.ph_mossrock || T.ph_rock }, uCliffN: { value: T.ph_mossrock_n || FLATN }, uCliffL: { value: bake.cliffL } });
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying float vNy; varying vec2 vTUv; varying vec3 vNrm;')
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvNy = objectNormal.y; vNrm = objectNormal;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vTUv = uv;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform sampler2D uBakeN, uBakeF, uDetail, uMeadow, uCliff, uCliffN; uniform float uNear, uMeadowL, uCliffL; varying vec3 vWP; varying float vNy; varying vec2 vTUv; varying vec3 vNrm;
          float gStp = 0.0; vec3 gW = vec3(0.0);`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          {
            vec2 nuv = vWP.xz / (2.0 * uNear) + 0.5;
            float m = max(abs(vWP.x), abs(vWP.z));
            float wn = (1.0 - smoothstep(uNear - 40.0, uNear - 6.0, m)) * (1.0 - smoothstep(0.34, 0.5, 1.0 - vNy));
            gStp = smoothstep(0.22, 0.5, 1.0 - vNy);
            vec3 c = mix(texture2D(uBakeF, vTUv, gStp * 3.2).rgb, texture2D(uBakeN, nuv).rgb, wn);
            c = pow(c, vec3(2.2));
            if (gStp > 0.002) {
              // cliffs: the bake looks straight down, so a wall only gets a few texels (long streaks). Real rock detail is projected from three sides instead.
              vec3 Nw = normalize(vNrm); gW = pow(abs(Nw), vec3(5.0)); gW /= (gW.x + gW.y + gW.z);
              const float SC = 0.05;
              float cd = distance(vWP, cameraPosition), lod = max(0.0, log2(cd * 0.055) + 0.4);       // explicit mip (no derivative problems inside the branch)
              vec3 rc = texture2DLodEXT(uCliff, vWP.zy * SC, lod).rgb * gW.x + texture2DLodEXT(uCliff, vWP.xz * SC, lod).rgb * gW.y + texture2DLodEXT(uCliff, vWP.xy * SC, lod).rgb * gW.z;
              float mac = texture2D(uDetail, vWP.xz * 0.007 + vWP.y * 0.0045).r;
              rc = mix(vec3(dot(rc, vec3(0.3333))), rc, 0.3) * vec3(0.96, 0.98, 1.04);             // the photo is lichen-green: bare grey-blue stone for the mountains
              vec3 dm = clamp(rc / uCliffL, 0.3, 2.2) * (0.7 + 0.6 * mac);
              c *= mix(vec3(1.0), dm, gStp * (1.0 - smoothstep(500.0, 900.0, distance(vWP, cameraPosition)) * 0.5));
            }
            float nk = 1.0 - smoothstep(25.0, 110.0, distance(vWP, cameraPosition));
            if (nk > 0.001) {
              float dt = texture2D(uDetail, vWP.xz * 0.47).r;
              float ml = dot(texture2D(uMeadow, vWP.xz * 0.11).rgb, vec3(0.333)) / uMeadowL;
              c *= mix(1.0, (0.86 + 0.28 * dt) * mix(1.0, clamp(ml, 0.5, 1.6), 0.5), nk);
            }
            {   // mid-range mottling (patches of lush / dry / worn grass) that carries on to the horizon, so open meadows are never a smooth plastic sheet
              float mk = (1.0 - gStp) * (1.0 - smoothstep(140.0, 460.0, distance(vWP, cameraPosition)));
              if (mk > 0.001) {
                float m1 = texture2D(uDetail, vWP.xz * 0.019).r, m2 = texture2D(uDetail, vWP.xz * 0.063 + 0.37).r;
                c *= mix(1.0, 0.68 + 0.66 * m1, mk * 0.85) * mix(1.0, 0.84 + 0.32 * m2, mk);
                c *= mix(vec3(1.0), mix(vec3(1.08, 1.02, 0.82), vec3(0.86, 1.05, 0.92), m1), mk * 0.45);
              }
            }
            diffuseColor.rgb = c;
          }`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          if (gStp > 0.002) {
            vec3 Nw = normalize(vNrm); const float SC = 0.05;
            float lodN = max(0.0, log2(distance(vWP, cameraPosition) * 0.1) + 0.2);
            vec3 tx = texture2DLodEXT(uCliffN, vWP.zy * SC, lodN).xyz * 2.0 - 1.0, ty = texture2DLodEXT(uCliffN, vWP.xz * SC, lodN).xyz * 2.0 - 1.0, tz = texture2DLodEXT(uCliffN, vWP.xy * SC, lodN).xyz * 2.0 - 1.0;
            tx = vec3(tx.xy + Nw.zy, abs(tx.z) * Nw.x); ty = vec3(ty.xy + Nw.xz, abs(ty.z) * Nw.y); tz = vec3(tz.xy + Nw.xy, abs(tz.z) * Nw.z);
            vec3 Nb = normalize(tx.zyx * gW.x + ty.xzy * gW.y + tz.xyz * gW.z);
            float k = gStp * (1.0 - smoothstep(350.0, 800.0, distance(vWP, cameraPosition)));
            normal = normalize(mix(normal, normalize((viewMatrix * vec4(Nb, 0.0)).xyz), k * 0.9));
          }`);
    };
  } else {
    // fallback (no textures / no renderer): plain vertex colours with the splat painting on top
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uSplat = { value: splat.near };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vWXZ;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWXZ = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uSplat; varying vec2 vWXZ;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          vec2 suv = vWXZ / ${SPLAT.toFixed(1)} + 0.5;
          if (suv.x > 0.0 && suv.x < 1.0 && suv.y > 0.0 && suv.y < 1.0) { vec4 sp = texture2D(uSplat, suv); diffuseColor.rgb = mix(diffuseColor.rgb, sp.rgb, sp.a); }`);
    };
  }
  const mesh = new THREE.Mesh(g, mat);
  mesh.receiveShadow = true; mesh.name = 'terrain'; mesh.userData.bake = bake;
  mesh.matrixAutoUpdate = false;
  scene.add(mesh);
  // O(1) height lookup on the rendered grid (per-frame users: camera, herds, riders, carts)
  const lineOf = (v) => {                                    // grid cell containing coordinate v (binary search on the grid lines)
    let lo = 0, hi = SEG;
    if (v <= xs[0]) return 0; if (v >= xs[SEG]) return SEG - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= v) lo = m; else hi = m; }
    return lo;
  };
  const fastHeight = (x, z) => {
    const i = lineOf(x), j = lineOf(z);
    const x0 = xs[i], x1 = xs[i + 1], z0 = xs[j], z1 = xs[j + 1];
    const tx = Math.min(1, Math.max(0, (x - x0) / (x1 - x0))), tz = Math.min(1, Math.max(0, (z - z0) / (z1 - z0)));
    const a = hs[j * n + i], b = hs[j * n + i + 1], c = hs[(j + 1) * n + i], d = hs[(j + 1) * n + i + 1];
    // same diagonal split as the mesh triangles (a,d,b)/(b,d,e)
    return tx + tz <= 1 ? a + (b - a) * tx + (c - a) * tz : d + (c - d) * (1 - tx) + (b - d) * (1 - tz);
  };
  return { mesh, height: L.height, fastHeight, bake };
}

// ------------------------------------------------------------------ ground bake
const NEAR = 260;
// season weights from tod.season(): x spring, y summer, z autumn, w winter; snow = ground cover 0..1
export function seasonWeights(S) {
  const w = [0, 0, 0, 0]; if (!S) { w[1] = 1; return { w, snow: 0 }; }
  const b = smooth(0.0, 0.42, S.p), prev = (S.s + 3) % 4;
  w[S.s] += b; w[prev] += 1 - b;
  const snow = w[3] * (S.s === 3 ? 0.55 + 0.45 * Math.sin(Math.min(1, S.p * 1.3) * Math.PI) : 0.25);
  return { w, snow };
}
function bakeGround(renderer, geo, splat, M, T, { near, far, season, theme }) {
  const SW = seasonWeights(season);
  const U = {
    uSplat: { value: splat.near }, uSplatF: { value: splat.far }, uDetail: { value: M.detail }, uNear: { value: NEAR }, uSeason: { value: new THREE.Vector4(...SW.w) }, uTheme: { value: new THREE.Vector3(...(theme || [1, 1, 1])) }, uSnow: { value: SW.snow }, uLv: { value: L.MOAT.level },
  };
  for (const k of ['ph_rock', 'ph_grass2', 'ph_mossrock', 'ph_snow', 'ph_mud', 'ph_leaves', 'ph_path']) U['u_' + k] = { value: T[k] };
  const VS = (nearMode) => `attribute vec4 aW; attribute float aBk; varying vec3 vWP; varying vec3 vWN; varying vec4 vW4; varying vec3 vCol; varying float vBk;
    uniform float uNear;
    void main(){ vWP = position; vWN = normal; vW4 = aW; vCol = color; vBk = aBk;
      gl_Position = ${nearMode ? 'vec4(position.x / uNear, position.z / uNear, 0.0, 1.0)' : 'vec4(uv * 2.0 - 1.0, 0.0, 1.0)'}; }`;
  const FS = `uniform sampler2D uSplat, uSplatF, uDetail, u_ph_rock, u_ph_grass2, u_ph_mossrock, u_ph_snow, u_ph_mud, u_ph_leaves, u_ph_path;
    uniform vec4 uSeason; uniform vec3 uTheme; uniform float uSnow, uLv;
    varying vec3 vWP; varying vec3 vWN; varying vec4 vW4; varying vec3 vCol; varying float vBk;
    float tri(vec3 p, vec3 w, float sc){ return texture2D(uDetail, p.zy*sc).r*w.x + texture2D(uDetail, p.xz*sc).r*w.y + texture2D(uDetail, p.xy*sc).r*w.z; }
    vec3 triC(sampler2D t, vec3 p, vec3 w, float sc){ return texture2D(t, p.zy*sc).rgb*w.x + texture2D(t, p.xz*sc).rgb*w.y + texture2D(t, p.xy*sc).rgb*w.z; }
    vec3 anti(sampler2D t, vec2 p, float sc){ return mix(texture2D(t, p*sc).rgb, texture2D(t, p*sc*0.231 + 0.37).rgb, 0.38); }
    void main(){
      vec3 N = normalize(vWN);
      vec3 tw = pow(abs(N), vec3(4.0)); tw /= (tw.x + tw.y + tw.z);
      vec2 xz = vWP.xz;
      float dryN = texture2D(uDetail, xz * 0.004).r;
      float dryAmt = clamp(0.55 + 0.4 * uSeason.y + 0.15 * uSeason.z - 0.35 * uSeason.x, 0.0, 1.0);
      vec3 grass = mix((anti(u_ph_rock, xz, 0.11)), (anti(u_ph_grass2, xz, 0.12)), smoothstep(0.45, 0.75, dryN) * dryAmt);
      // seasonal grading: lush spring, straw summer, browning autumn, dull winter
      grass *= mix(vec3(1.0), vec3(0.9, 1.08, 0.82), uSeason.x);
      grass *= mix(vec3(1.0), vec3(1.1, 1.0, 0.78), uSeason.y * 0.7);
      grass *= mix(vec3(1.0), vec3(1.12, 0.94, 0.7), uSeason.z * 0.75);
      grass *= mix(vec3(1.0), vec3(0.82, 0.82, 0.8), uSeason.w);
      grass *= uTheme;                                      // p35 P9: the castle level's mood (theme.js)
      vec3 forest = (anti(u_ph_leaves, xz, 0.13)) * mix(vec3(1.0), vec3(1.25, 0.95, 0.65), uSeason.z * 0.8) * uTheme;
      vec3 mud = (anti(u_ph_mud, xz, 0.12));
      vec3 rock = (triC(u_ph_mossrock, vWP, tw, 0.045));
      // bare, cooler, greyer rock higher up (moss only at the foot of the slopes)
      float hi = smoothstep(40.0, 170.0, vWP.y);
      rock = mix(rock * 0.8, vec3(dot(rock, vec3(0.33))) * vec3(0.62, 0.57, 0.53), hi);
      vec3 snow = (anti(u_ph_snow, xz, 0.06)) * 1.05;
      vec3 tex = grass;
      tex = mix(tex, forest, vW4.w);
      tex = mix(tex, mud, vW4.z);
      tex = mix(tex, rock, vW4.x);
      // the banks of every river, lake and moat: a living, deep-green meadow (it stays green in autumn), wet dark earth right at the waterline
      {
        float hw = vWP.y - uLv, lushA = vBk * (1.0 - vW4.x) * (1.0 - vW4.y) * (1.0 - vW4.z);
        float mot = texture2D(uDetail, xz * 0.045).r;
        vec3 lushC = anti(u_ph_rock, xz, 0.11) * vec3(0.78, 1.06, 0.62) * mix(vec3(1.0), vec3(0.9, 1.1, 1.18), clamp(uSeason.z * 0.8 + uSeason.y * 0.5, 0.0, 1.0)) * (0.82 + 0.34 * mot) * uTheme;
        tex = mix(tex, lushC, clamp(lushA * 0.92, 0.0, 1.0));
        float wet = (1.0 - smoothstep(0.0, 0.5 + 0.35 * mot, hw)) * (1.0 - vW4.x) * (1.0 - vW4.y);
        tex = mix(tex, mud * vec3(0.5, 0.48, 0.42), clamp(wet * 0.9, 0.0, 1.0));
      }
      vec3 tint = clamp(vCol / max(vec3(0.02), vec3(dot(vCol, vec3(0.33)))), 0.6, 1.5);
      vec3 col = tex * mix(vec3(1.0), tint, 0.25) * 1.05;
      // spring meadow flowers (tiny specks)
      if (uSeason.x > 0.01) {
        float f = texture2D(uDetail, xz * 0.9).r * texture2D(uDetail, xz * 0.37 + 0.5).r;
        float fl = smoothstep(0.5, 0.56, f) * uSeason.x * (1.0 - vW4.x) * (1.0 - vW4.z) * (1.0 - vW4.w) * step(0.3, vWP.y);
        vec3 fc = mix(vec3(0.9, 0.85, 0.2), vec3(0.85, 0.3, 0.5), step(0.5, fract(f * 37.0)));
        col = mix(col, fc, fl * 0.8);
      }
      // painted ground: country roads / fields / yards (coarse), then castle + town (fine)
      vec3 pth = anti(u_ph_path, xz, 0.15); float pl = dot(pth, vec3(0.33)) * 2.2;
      vec2 fuv = xz / ${FAR.toFixed(1)} + 0.5;
      if (fuv.x > 0.0 && fuv.x < 1.0 && fuv.y > 0.0 && fuv.y < 1.0) { vec4 sp = texture2D(uSplatF, fuv); col = mix(col, sp.rgb * mix(1.0, pl, 0.6), sp.a); }
      vec2 suv = xz / ${SPLAT.toFixed(1)} + 0.5;
      if (suv.x > 0.0 && suv.x < 1.0 && suv.y > 0.0 && suv.y < 1.0) { vec4 sp = texture2D(uSplat, suv); col = mix(col, sp.rgb * mix(1.0, pl, 0.6), sp.a); }
      float d1 = tri(vWP, tw, 0.11), d2 = tri(vWP, tw, 0.017);
      col *= (0.85 + 0.25 * d1) * (0.88 + 0.24 * d2);
      float steep = smoothstep(0.28, 0.62, 1.0 - N.y);
      float strata = texture2D(uDetail, vec2((vWP.x + vWP.z) * 0.035, vWP.y * 0.22)).r;
      float crev = tri(vWP, tw, 0.05);
      col *= mix(1.0, (0.62 + 0.55 * strata) * (0.7 + 0.5 * crev), steep * 0.3);
      // snow: peaks always, ground cover in winter (not on cliffs or water)
      float sn = vW4.y;
      if (uSnow > 0.0) {
        float nz = texture2D(uDetail, xz * 0.013).r * 0.7 + texture2D(uDetail, xz * 0.09).r * 0.3;
        float cover = smoothstep(0.25, 0.65, uSnow * 1.25 + (nz - 0.5) * 0.9) * smoothstep(0.62, 0.86, N.y) * smoothstep(-0.4, 0.2, vWP.y);
        sn = max(sn, cover);
      }
      col = mix(col, snow * (0.92 + 0.12 * d1), sn);
      gl_FragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2)), 1.0);
    }`;
  const make = (nearMode) => new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS(nearMode), fragmentShader: FS, vertexColors: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
  const rt = (size) => {
    const r = new THREE.WebGLRenderTarget(size, size, { depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
    r.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); r.texture.colorSpace = THREE.NoColorSpace;
    return r;
  };
  const rtN = rt(near), rtF = rt(far);
  const sc = new THREE.Scene(), mesh = new THREE.Mesh(geo, make(true)), cam = new THREE.Camera();
  mesh.frustumCulled = false; sc.add(mesh);
  function run(season) {
    if (season) { const s2 = seasonWeights(season); U.uSeason.value.set(...s2.w); U.uSnow.value = s2.snow; }
    const prevT = renderer.getRenderTarget(), prevTM = renderer.toneMapping, prevC = renderer.getClearColor(new THREE.Color()), prevA = renderer.getClearAlpha();
    renderer.toneMapping = THREE.NoToneMapping; renderer.setClearColor(0x556644, 1);
    mesh.material = make(true); renderer.setRenderTarget(rtN); renderer.clear(); renderer.render(sc, cam);
    mesh.material.dispose(); mesh.material = make(false); renderer.setRenderTarget(rtF); renderer.clear(); renderer.render(sc, cam);
    mesh.material.dispose();
    renderer.setRenderTarget(prevT); renderer.toneMapping = prevTM; renderer.setClearColor(prevC, prevA);
  }
  run(null);
  // mean brightness of the meadow photo (for the near-camera detail layer)
  let meadowL = 0.33;
  try {
    const img = T.ph_rock.image, c = document.createElement('canvas'); c.width = c.height = 8;
    const cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0, 8, 8); const d = cx.getImageData(0, 0, 8, 8).data; let s = 0;
    const lin = (v) => Math.pow(v / 255, 2.2);
    for (let i = 0; i < d.length; i += 4) s += (lin(d[i]) + lin(d[i + 1]) + lin(d[i + 2])) / 3; meadowL = Math.max(0.02, s / 64);
  } catch (e) { /* keep default */ }
  let cliffL = 0.2;
  try {
    const img = T.ph_mossrock.image, c = document.createElement('canvas'); c.width = c.height = 8;
    const cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0, 8, 8); const d = cx.getImageData(0, 0, 8, 8).data; let s = 0;
    const lin = (v) => Math.pow(v / 255, 2.2);
    for (let i = 0; i < d.length; i += 4) s += (lin(d[i]) + lin(d[i + 1]) + lin(d[i + 2])) / 3; cliffL = Math.max(0.02, s / 64);
  } catch (e) { /* keep default */ }
  return { near: rtN.texture, far: rtF.texture, meadowL, cliffL, redo: run, rts: [rtN, rtF], setTheme(rgb) { U.uTheme.value.set(rgb[0], rgb[1], rgb[2]); run(null); } };
}

export function forestDensity(x, z) {
  const N = L.NOISE, r = Math.hypot(x, z), sd = L.TOWN ? L.sdTown(x, z) : L.sdPoly(L.OUTER, x, z);
  let d = N.fbm(x * 0.012 + 40, z * 0.012 - 11, 4) * 0.5 + 0.5;
  d = smooth(0.42, 0.62, d);
  d *= L.MAP === 'day' ? smooth(9, 22, sd) : smooth(26, 50, sd);   // clearing around the walls
  d *= 1 - smooth(L.MOUNT + 20, L.MOUNT + 90, r);           // tree line
  d *= smooth(1.05, 1.4, L.fieldD(x, z));                  // fields stay open
  d *= smooth(10, 20, L.distPolyline(L.RIVER, x, z));
  d *= smooth(6, 22, Math.hypot(x - L.LAKE.x, z - L.LAKE.z) - L.LAKE.r);
  d *= smooth(8, 20, roadEdge(x, z));
  for (const Z of [L.PASTURE, L.CAMP, L.MUSTER, L.LAIR]) d *= smooth((Z.fr ?? Z.r) + 4, (Z.fr ?? Z.r) + 22, Math.hypot(x - Z.x, z - Z.z));
  { const Y = L.stableYard(); if (Y) d *= smooth(Y.r, Y.r + 16, Math.hypot(x - Y.x, z - Y.z)); }   // the stable yard stays open
  d *= smooth(26, 44, hamletD(x, z));                      // the hamlets keep their greens
  d *= smooth(20, 36, nomadD(x, z));                       // ... and the nomad camps their trodden ground
  d *= smooth(3, 22, wsD(x, z));                           // p38: ... and the worksites their yards (the lumber camps stand at the edge of the forest, so it thins out toward them)
  for (const M of L.MINES) d *= smooth(44, 70, Math.hypot(x - M.x + Math.cos(M.a * Math.PI / 180) * 8, z - M.z + Math.sin(M.a * Math.PI / 180) * 8));
  return d;
}

// ------------------------------------------------ ground painting (splat)
export let ROAD = [];
export const roadPoints = () => ROAD;
function computeRoad() { buildRoads(); const m = ROADS.find((r) => r.name === 'main'); ROAD = m ? m.pts : []; }
function blankTex() { const t = new THREE.DataTexture(new Uint8Array(4), 1, 1); t.needsUpdate = true; return t; }

function paintGround() {
  const S = 2048, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), rnd = Math.random;
  const W = (x) => (x / SPLAT + 0.5) * S, PX = S / SPLAT;
  const poly = (pts) => { g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(W(x), W(z)) : g.moveTo(W(x), W(z)))); g.closePath(); };
  const line = (pts, w, style) => {
    g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = w * PX; g.strokeStyle = style;
    g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(W(x), W(z)) : g.moveTo(W(x), W(z)))); g.stroke();
  };
  const blob = (x, y, r, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  // lower town: trodden earth between houses, grass survives in patches
  if (L.TOWN) {
    g.save(); poly(L.TOWN); g.clip();
    for (let i = 0; i < 5200; i++) {
      const x = rnd() * S, y = rnd() * S, r = (3 + rnd() * 14) * PX / 6.1, t = rnd();
      blob(x, y, r, t < 0.45 ? '120,100,70' : t < 0.75 ? '98,84,58' : '86,98,56', 0.22 + rnd() * 0.25);
    }
    g.restore();
  }
  // courtyard: packed earth, a bit patchy
  g.save(); poly(L.OUTER); g.clip();
  g.fillStyle = 'rgba(118,98,68,0.92)'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * S, y = rnd() * S, r = (4 + rnd() * 22) * 2, t = rnd();
    blob(x, y, r, t < 0.4 ? '70,90,48' : t < 0.7 ? '140,118,82' : '92,76,52', 0.35);
  }
  g.strokeStyle = 'rgba(60,48,32,0.35)'; g.lineWidth = 2;
  for (let x = -60; x <= 60; x += 6) { g.beginPath(); g.moveTo(W(x), 0); g.lineTo(W(x), S); g.stroke(); }
  for (let z = -60; z <= 60; z += 6) { g.beginPath(); g.moveTo(0, W(z)); g.lineTo(S, W(z)); g.stroke(); }
  g.restore();
  // inner citadel: flagstones
  g.save(); poly(L.INNER); g.clip();
  g.fillStyle = 'rgba(96,98,104,0.95)'; g.fillRect(0, 0, S, S);
  for (let z = -60; z < 10; z += 2.2) for (let x = -60; x < 10; x += 3) {
    const k = 80 + rnd() * 40 | 0; g.fillStyle = `rgba(${k},${k + 2},${k + 8},0.9)`;
    g.fillRect(W(x + ((z / 2.2) % 2) * 1.5) + 1, W(z) + 1, 3 * PX - 2, 2.2 * PX - 2);
  }
  g.restore();
  // cobbled streets: courtyard lanes + the town's streets
  const cob = 'rgba(92,90,88,0.95)', gut = 'rgba(58,52,44,0.6)';
  const pz = L.PLAZA, ig = L.segMid(L.INNER, L.INNER_GATE_SEG);
  const inner = [[[L.GATE.x - L.GATE.nx * 2, L.GATE.z - L.GATE.nz * 2], [34, 18], [pz.x, pz.z]], [[pz.x, pz.z], [ig[0] + 6, ig[1] + 2], [ig[0], ig[1]]],
    [[pz.x, pz.z], [30, -14], [34, -26]], [[pz.x, pz.z], [-10, 22], [-30, 22]], [[pz.x, pz.z], [6, 30]]];
  const streets = ROADS.filter((r) => r.kind === 'cobble');
  for (const R of streets) line(R.pts, R.w + 1.2, gut);
  for (const R of streets) line(R.pts, R.w, cob);
  inner.forEach((pts, i) => line(pts, [5, 4.5, 3.5, 3.5, 3][i], cob));
  const MK = marketSpot();
  if (MK) {
    g.fillStyle = gut; g.beginPath(); g.arc(W(MK.x), W(MK.z), (MK.r + 0.8) * PX, 0, 6.29); g.fill();
    g.fillStyle = 'rgba(112,108,100,0.97)'; g.beginPath(); g.arc(W(MK.x), W(MK.z), MK.r * PX, 0, 6.29); g.fill();
  }
  // cobble texture over everything painted so far that is stone
  g.save(); g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 60000; i++) {
    const x = rnd() * S, y = rnd() * S, k = 70 + rnd() * 60 | 0;
    g.fillStyle = `rgba(${k},${k},${k + 6},0.28)`; g.fillRect(x, y, 4, 3);
  }
  g.restore();
  if (MK) for (let r = 2; r < MK.r; r += 2.2) { g.strokeStyle = 'rgba(70,72,78,0.5)'; g.lineWidth = 2; g.beginPath(); g.arc(W(MK.x), W(MK.z), r * PX, 0, 6.29); g.stroke(); }
  // crystal plaza
  g.fillStyle = 'rgba(120,124,132,0.97)'; g.beginPath(); g.arc(W(pz.x), W(pz.z), pz.r * PX, 0, Math.PI * 2); g.fill();
  for (let r = 2; r < pz.r; r += 1.6) { g.strokeStyle = 'rgba(70,74,84,0.55)'; g.lineWidth = 2.4; g.beginPath(); g.arc(W(pz.x), W(pz.z), r * PX, 0, Math.PI * 2); g.stroke(); }
  g.strokeStyle = 'rgba(80,170,255,0.55)'; g.lineWidth = 6; g.beginPath(); g.arc(W(pz.x), W(pz.z), (pz.r - 0.6) * PX, 0, Math.PI * 2); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.anisotropy = 8;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
export function marketSpot() {
  if (!L.TOWN) return null;
  const ring = ROADS.find((r) => r.name === 'ring'), G = L.GATE; if (!ring) return null;
  // where the main street crosses the ring street
  const a = Math.atan2(G.nz, G.nx); let best = null, bd = 1e9;
  for (let i = 0; i < ring.pts.length - 1; i++) for (let t = 0; t <= 1; t += 0.05) {
    const x = ring.pts[i][0] + (ring.pts[i + 1][0] - ring.pts[i][0]) * t, z = ring.pts[i][1] + (ring.pts[i + 1][1] - ring.pts[i][1]) * t;
    let da = Math.atan2(z, x) - a; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da)));
    if (da < bd) { bd = da; best = { x, z, r: 15 }; }
  }
  return best;
}

// coarse painting of the countryside: dirt roads, field plots, pasture, camp, mine yards
function paintFar() {
  const S = 2048, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), rnd = Math.random;
  const W = (x) => (x / FAR + 0.5) * S, PX = S / FAR;
  const line = (pts, w, style) => {
    g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = Math.max(1, w * PX); g.strokeStyle = style;
    g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(W(x), W(z)) : g.moveTo(W(x), W(z)))); g.stroke();
  };
  const blob = (x, z, r, col, a) => { const X = W(x), Y = W(z), R = r * PX; const gr = g.createRadialGradient(X, Y, 0, X, Y, R); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(0.6, `rgba(${col},${a * 0.6})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(X - R, Y - R, R * 2, R * 2); };
  // fields: patchwork of plots (ripe wheat, green crops, fresh ploughed earth, fallow)
  const crops = [[176, 150, 70], [92, 112, 48], [96, 76, 52], [140, 128, 72], [110, 120, 56], [84, 66, 46]];
  L.FARMS.forEach((F, fi) => {
    g.save(); g.translate(W(F.x), W(F.z)); g.rotate(-F.rot);
    const fw = F.w * PX, fd = F.d * PX, cols = 3, rows = 2;
    for (let k = 0; k < cols * rows; k++) {
      const cx = k % cols, cy = Math.floor(k / cols);
      const x0 = -fw / 2 + cx * fw / cols + 1.5 * PX, y0 = -fd / 2 + cy * fd / rows + 1.5 * PX, w = fw / cols - 3 * PX, h = fd / rows - 3 * PX;
      const col = crops[(k + fi * 2) % crops.length];
      g.fillStyle = `rgba(${col.join(',')},0.96)`; g.fillRect(x0, y0, w, h);
      g.fillStyle = 'rgba(40,32,20,0.4)';
      const vertical = (k + fi) % 2 === 0;
      for (let q = 1.2 * PX; q < (vertical ? w : h); q += 2.4 * PX) vertical ? g.fillRect(x0 + q, y0, Math.max(1, 0.7 * PX), h) : g.fillRect(x0, y0 + q, w, Math.max(1, 0.7 * PX));
    }
    g.restore();
  });
  // pasture: trampled grass; camp: trodden earth; mines: rocky yards with gem dust
  const P = L.PASTURE; for (let i = 0; i < 70; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * P.r; blob(P.x + Math.cos(a) * d, P.z + Math.sin(a) * d, 2 + rnd() * 5, '120,110,70', 0.25 + rnd() * 0.25); }
  // muster field (parade ground in front of the town gate): worn earth with a darker beaten centre
  const MU = L.MUSTER; if (MU.r > 0) { blob(MU.x, MU.z, MU.r + 4, '118,104,76', 0.78); blob(MU.x, MU.z, MU.r * 0.62, '104,90,64', 0.55); for (let i = 0; i < 60; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * MU.r; blob(MU.x + Math.cos(a) * d, MU.z + Math.sin(a) * d, 1.5 + rnd() * 4, rnd() < 0.5 ? '92,78,56' : '136,118,86', 0.35); } }
  const C = L.CAMP; blob(C.x, C.z, C.r + 6, '120,100,72', 0.85); for (let i = 0; i < 80; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * C.r; blob(C.x + Math.cos(a) * d, C.z + Math.sin(a) * d, 2 + rnd() * 5, rnd() < 0.5 ? '96,80,56' : '140,120,84', 0.4); }
  for (const C of nomads()) { blob(C.x, C.z, 15, '112,96,68', 0.72); for (let i = 0; i < 16; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * 12; blob(C.x + Math.cos(a) * d, C.z + Math.sin(a) * d, 1.4 + rnd() * 3, rnd() < 0.5 ? '92,78,54' : '132,112,80', 0.45); } }
  for (const G of stableGrounds()) { blob(G.x, G.z, G.r, '114,98,70', G.a); for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * G.r * 0.85; blob(G.x + Math.cos(a) * d, G.z + Math.sin(a) * d, 1.4 + rnd() * 3, rnd() < 0.5 ? '92,78,54' : '132,112,80', 0.4); } }   // the stable yard + the horse-keepers' camp
  for (const W of L.SITES || []) { const pc = WS_KINDS[W.kind].paint; blob(W.x, W.z, W.r + 4, pc, 0.62); blob(W.x, W.z, W.r * 0.7, pc, 0.55); for (let i = 0; i < 18; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * W.r * 0.9; blob(W.x + Math.cos(a) * d, W.z + Math.sin(a) * d, 1.5 + rnd() * 3.2, pc, 0.35); } }   // p38: worksite yards
  for (const H of hamlets()) { blob(H.x, H.z, 17, '116,100,70', 0.7); for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * 14; blob(H.x + Math.cos(a) * d, H.z + Math.sin(a) * d, 1.5 + rnd() * 3, rnd() < 0.5 ? '94,80,56' : '134,114,82', 0.4); } }   // trodden village greens
  const GEM = { ruby: '190,76,92', emerald: '72,170,104', turq: '72,170,204' };
  for (const M of L.MINES) {
    const a = M.a * Math.PI / 180, yx = M.x - Math.cos(a) * 10, yz = M.z - Math.sin(a) * 10;
    blob(yx, yz, 32, '126,120,112', 0.9);
    for (let i = 0; i < 80; i++) { const b = rnd() * 6.28, d = Math.sqrt(rnd()) * 28; blob(yx + Math.cos(b) * d, yz + Math.sin(b) * d, 1 + rnd() * 3, rnd() < 0.3 ? GEM[M.id] : '98,94,90', 0.5); }
  }
  // dirt roads with wheel ruts
  for (const R of ROADS.filter((r) => r.kind === 'dirt')) {
    line(R.pts, R.w + 2, 'rgba(96,82,58,0.45)');
    line(R.pts, R.w, 'rgba(112,94,66,0.9)');
    line(R.pts, R.w * 0.45, 'rgba(132,112,80,0.5)');
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.anisotropy = 8;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

function paintGroundDay() {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), R = Math.random;
  const W = (x) => (x / SPLAT + 0.5) * S, PX = S / SPLAT;
  const blob = (x, z, r, col, a) => {
    const gr = g.createRadialGradient(W(x), W(z), 0, W(x), W(z), r * PX);
    gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(0.6, `rgba(${col},${a * 0.6})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(W(x) - r * PX, W(z) - r * PX, r * PX * 2, r * PX * 2);
  };
  const line = (pts, w, style) => {
    g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = w * PX; g.strokeStyle = style;
    g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(W(x), W(z)) : g.moveTo(W(x), W(z)))); g.stroke();
  };
  // sun-bleached grass patches + dirt spots everywhere
  for (let i = 0; i < 520; i++) blob((R() - 0.5) * SPLAT, (R() - 0.5) * SPLAT, 3 + R() * 10, R() < 0.5 ? '160,160,70' : '96,130,48', 0.22 + R() * 0.2);
  for (let i = 0; i < 160; i++) blob((R() - 0.5) * SPLAT, (R() - 0.5) * SPLAT, 1.5 + R() * 4, '150,120,78', 0.35 + R() * 0.3);
  // inside the walls: trodden, drier
  for (let i = 0; i < 200; i++) { const x = (R() - 0.5) * 84, z = (R() - 0.5) * 84; blob(x, z, 2 + R() * 7, R() < 0.55 ? '170,150,90' : '140,112,70', 0.3 + R() * 0.3); }
  // dirt rings at tower feet and along the inner wall foot
  for (const [x, z] of L.OUTER) blob(x, z, 9, '150,122,80', 0.55);
  blob(0, 0, 14, '156,128,84', 0.55);
  // road from the gate to the keep and out into the country
  const G = L.GATE;
  line([[G.x - G.nx * 4, G.z - G.nz * 4], [G.x * 0.5, G.z * 0.5], [0, 0]], 4.2, 'rgba(150,120,80,0.75)');
  line(ROAD, 5.5, 'rgba(146,118,78,0.8)');
  line(ROAD, 2.6, 'rgba(176,148,100,0.45)');
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.anisotropy = 8;
  return t;
}

// ------------------------------------------------------------------ distant ranges
// Two rings of far mountains beyond the playable terrain: jagged ridgelines with
// snow caps that fade into the haze (aerial perspective comes from the fog).
export function buildBackdrop(scene) {
  const N = L.NOISE, SEG = 300, rings = [[EXTENT * 0.98, 1250, 0], [1350, 2200, 1]];
  const meshes = [];
  for (const [r0, r1, layer] of rings) {
    const RS = 7, pos = [], col = [], idx = [], c = new THREE.Color();
    const rockA = new THREE.Color(layer ? '#46505f' : '#3d424a'), rockB = new THREE.Color(layer ? '#5f6b7e' : '#5c5f66'), snow = new THREE.Color('#eef3f8'), forest = new THREE.Color('#33452f');
    for (let j = 0; j <= RS; j++) for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2, t = j / RS, r = r0 + (r1 - r0) * t;
      const ax = Math.cos(a), az = Math.sin(a);
      const ridge = N.ridged(ax * 3.2 + layer * 7, az * 3.2 + 11, 6), big = N.fbm(ax * 1.4 + layer * 3, az * 1.4 - 5, 3) * 0.5 + 0.5;
      const prof = Math.sin(Math.min(1, t * 1.25) * Math.PI) ** 0.7;                 // rises from the inner edge, falls behind the crest
      let h = prof * (layer ? 380 + 620 * big * (0.55 + ridge) : 160 + 360 * big * (0.5 + ridge));
      h += N.fbm(ax * 18 + t * 3, az * 18, 3) * 26 * prof;
      if (j === 0) h = layer ? 120 : -10;
      const x = ax * r, z = az * r;
      pos.push(x, h, z);
      const sn = Math.max(0, Math.min(1, (h - (layer ? 520 : 330) + N.fbm(ax * 30, az * 30, 2) * 60) / 60));
      c.copy(rockA).lerp(rockB, ridge);
      if (!layer) c.lerp(forest, Math.max(0, 1 - h / 120) * 0.8);
      c.lerp(snow, sn);
      col.push(c.r, c.g, c.b);
    }
    for (let j = 0; j < RS; j++) for (let i = 0; i < SEG; i++) { const a2 = j * (SEG + 1) + i, b = a2 + 1, d = a2 + SEG + 1, e = d + 1; idx.push(a2, d, b, b, d, e); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
    m.name = 'backdrop' + layer; m.frustumCulled = false; m.matrixAutoUpdate = false; scene.add(m); meshes.push(m);
  }
  return meshes;
}

// ------------------------------------------------------------------ water
// The one water surface of the kingdom (town moat, river, lake): a single plane shaded from a baked map
//   R = water depth, G = town-wall height (the mirrored wall), B = bank + tree-canopy height (the mirrored banks and treeline),
//   A = warm lamp light (setLamps: torches by the water, the jetty lantern),
// wind waves (three scrolling normal layers + two analytic wave trains), drifting gusts ("cat's paws"), a surge rolling round the moat now and
// then, depth colour (green-teal shallows -> navy-teal deep; the lake and the river a little greener than the moat), caustics in the shallows,
// lapping shore foam, sun glitter and a moon path at night, lamp reflections shimmering on the ripples, winter ice on the still water.
// Cost per water pixel: ~14 texture reads incl. one 7-step march; no render targets of its own (reflect.js adds the planar mirror on high).
// WATER_LOOK picks the palette ('natural' default | 'jewel': the brighter blue of before | 'deep': darker, moodier)
export const WATER_LOOK = 'natural';
export const WATER_PAL = {
  //          moat: shallow, mid, deep                 lake & river: shallow, mid, deep
  natural: [0x58c2b4, 0x1f86c6, 0x0a3d86, 0x72bba2, 0x2a90a2, 0x0e4d66],
  jewel: [0x46b4ea, 0x2a7fd0, 0x0b4aa0, 0x52b7d6, 0x2a86c0, 0x0d4f96],
  deep: [0x3f9fa0, 0x15628f, 0x072d63, 0x4f9580, 0x1d6880, 0x07344c],
};
export function buildWater(scene, hf = L.height) {
  const SPAN = 420, RES = 768, LV = L.MOAT.level;
  // R = water depth packed in 8 bits (-0.5..4 m, so the tide can lift the surface over the bank) — float textures can't be linearly
  // filtered on many phones, which made the whole moat read as "shallow foam"; G = wall height (0..20 m) for the mirrored wall
  const hm = new Uint8Array(RES * RES * 4), bank = new Float32Array(RES * RES);
  for (let j = 0; j < RES; j++) {
    const z = (j / (RES - 1) * 2 - 1) * SPAN;
    for (let i = 0; i < RES; i++) {
      const x = (i / (RES - 1) * 2 - 1) * SPAN, o = j * RES + i, h = hf(x, z), d = (LV + 0.5 - h) / 4.5;
      hm[o * 4] = d <= 0 ? 0 : d >= 1 ? 255 : Math.round(d * 255); bank[o] = h > LV ? h - LV : 0;
    }
  }
  // G: the town wall and its towers, rasterized segment by segment (was a polygon distance per texel: ~10x slower)
  if (L.TOWN) {
    const TW = L.WALL.town, P = L.TOWN, n = P.length, rw = TW.T / 2 + 0.9, rt = TW.R + 0.9, gW = Math.round((TW.H + 1.7) / 20 * 255), gT = Math.round((TW.H + 4.5) / 20 * 255);
    const ti = (v) => (v / SPAN + 1) / 2 * (RES - 1), tw = (k) => (k / (RES - 1) * 2 - 1) * SPAN;
    const stamp = (x0, z0, x1, z1, test, val) => {
      for (let j = Math.max(0, Math.floor(ti(z0))); j <= Math.min(RES - 1, Math.ceil(ti(z1))); j++) for (let i = Math.max(0, Math.floor(ti(x0))); i <= Math.min(RES - 1, Math.ceil(ti(x1))); i++) {
        if (!test(tw(i), tw(j))) continue; const o = (j * RES + i) * 4 + 1; if (hm[o] < val) hm[o] = val;
      }
    };
    for (let k = 0; k < n; k++) {
      const [ax, az] = P[k], [bx, bz] = P[(k + 1) % n], ex = bx - ax, ez = bz - az, l2 = ex * ex + ez * ez;
      stamp(Math.min(ax, bx) - rw, Math.min(az, bz) - rw, Math.max(ax, bx) + rw, Math.max(az, bz) + rw, (x, z) => {
        const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / l2)), dx = x - ax - ex * t, dz = z - az - ez * t; return dx * dx + dz * dz < rw * rw;
      }, gW);
    }
    for (const [px, pz] of P) stamp(px - rt, pz - rt, px + rt, pz + rt, (x, z) => (x - px) * (x - px) + (z - pz) * (z - pz) < rt * rt, gT);
  }
  // B = what stands around the water (0..24 m): the bank (from the same height samples) + the tree canopy (forestDensity on a coarse
  // 8.75 m grid, only within ~45 m of the water, ~1.5k samples), ragged per texel so the mirrored treeline is not a smooth hump
  {
    const CR = 97, cs = 2 * SPAN / (CR - 1), wd = new Float32Array(CR * CR).fill(1e4), cn = new Float32Array(CR * CR);
    for (let j = 0; j < CR; j++) for (let i = 0; i < CR; i++) if (hf(-SPAN + i * cs, -SPAN + j * cs) < LV + 0.15) wd[j * CR + i] = 0;
    for (let pass = 0; pass < 2; pass++) {
      const s = pass ? -1 : 1;
      for (let jj = 0; jj < CR; jj++) for (let ii = 0; ii < CR; ii++) {
        const j = pass ? CR - 1 - jj : jj, i = pass ? CR - 1 - ii : ii, k = j * CR + i; let d = wd[k]; if (d === 0) continue;
        if (i - s >= 0 && i - s < CR) d = Math.min(d, wd[k - s] + 1);
        if (j - s >= 0 && j - s < CR) { d = Math.min(d, wd[k - s * CR] + 1); if (i - 1 >= 0) d = Math.min(d, wd[k - s * CR - 1] + 1.414); if (i + 1 < CR) d = Math.min(d, wd[k - s * CR + 1] + 1.414); }
        wd[k] = d;
      }
    }
    for (let k = 0; k < CR * CR; k++) if (wd[k] <= 5.2) cn[k] = smooth(0.05, 0.42, forestDensity(-SPAN + (k % CR) * cs, -SPAN + Math.floor(k / CR) * cs)) * 15;
    for (let j = 0; j < RES; j++) for (let i = 0; i < RES; i++) {
      const o = j * RES + i, u = i / (RES - 1) * (CR - 1), v = j / (RES - 1) * (CR - 1), i0 = Math.min(CR - 2, Math.floor(u)), j0 = Math.min(CR - 2, Math.floor(v)), fu = u - i0, fv = v - j0;
      if (wd[j0 * CR + i0] > 6 && wd[(j0 + 1) * CR + i0 + 1] > 6) continue;           // far from any water: never looked at
      let c = (cn[j0 * CR + i0] * (1 - fu) + cn[j0 * CR + i0 + 1] * fu) * (1 - fv) + (cn[(j0 + 1) * CR + i0] * (1 - fu) + cn[(j0 + 1) * CR + i0 + 1] * fu) * fv;
      if (c > 0.05) { const x = (i / (RES - 1) * 2 - 1) * SPAN, z = (j / (RES - 1) * 2 - 1) * SPAN; c *= 0.62 + 0.38 * Math.sin(x * 0.37 + Math.sin(z * 0.23) * 2) * Math.sin(z * 0.41 + x * 0.13); }
      hm[o * 4 + 2] = Math.round(Math.min(1, (bank[o] + c) / 24) * 255);
    }
  }
  const hTex = new THREE.DataTexture(hm, RES, RES, THREE.RGBAFormat, THREE.UnsignedByteType);
  hTex.minFilter = hTex.magFilter = THREE.LinearFilter; hTex.needsUpdate = true;
  // tileable wave normals (RGB) + the height they come from (A: a smooth fractal noise for gusts, foam and ice) — periodic value noise
  // (a sum of sines repeats visibly as a tile / diamond pattern); a DataTexture, so the alpha channel is not premultiplied away
  const S = 256, nd = new Uint8Array(S * S * 4), hgt = new Float32Array(S * S);
  {
    let seed = 1337; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const octave = (f, amp) => {
      const grid = new Float32Array(f * f); for (let i = 0; i < grid.length; i++) grid[i] = rnd();
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const u = x / S * f, v = y / S * f, xi = Math.floor(u), yi = Math.floor(v); let tx = u - xi, ty = v - yi; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
        const a = grid[(yi % f) * f + xi % f], b = grid[(yi % f) * f + (xi + 1) % f], cc = grid[((yi + 1) % f) * f + xi % f], dd = grid[((yi + 1) % f) * f + (xi + 1) % f];
        hgt[y * S + x] += amp * ((a * (1 - tx) + b * tx) * (1 - ty) + (cc * (1 - tx) + dd * tx) * ty);
      }
    };
    octave(4, 1.0); octave(8, 0.55); octave(16, 0.3); octave(32, 0.16); octave(64, 0.08);
  }
  let hmin = 1e9, hmax = -1e9; for (const v of hgt) { hmin = Math.min(hmin, v); hmax = Math.max(hmax, v); }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const l = hgt[y * S + ((x + S - 1) % S)], r = hgt[y * S + ((x + 1) % S)], u = hgt[((y + S - 1) % S) * S + x], w = hgt[((y + 1) % S) * S + x];
    const nx = (l - r) * 3.2, ny = (w - u) * 3.2, nz = 1, len = Math.sqrt(nx * nx + ny * ny + 1), i = (y * S + x) * 4;
    nd[i] = (nx / len * 0.5 + 0.5) * 255; nd[i + 1] = (ny / len * 0.5 + 0.5) * 255; nd[i + 2] = (nz / len * 0.5 + 0.5) * 255; nd[i + 3] = (hgt[y * S + x] - hmin) / (hmax - hmin) * 255;
  }
  const nrm = new THREE.DataTexture(nd, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);
  nrm.wrapS = nrm.wrapT = THREE.RepeatWrapping; nrm.magFilter = THREE.LinearFilter; nrm.minFilter = THREE.LinearMipmapLinearFilter; nrm.generateMipmaps = true; nrm.anisotropy = 4; nrm.needsUpdate = true;
  const pal = (WATER_PAL[WATER_LOOK] || WATER_PAL.natural).map((h) => new THREE.Color(h));
  // winter: ice creeps over the shallows (the still lake freezes further out than the moat)
  const SE = season(), ICE = SE.s === 3 ? 0.55 + 0.45 * Math.sin(Math.PI * SE.p) : SE.s === 2 && SE.p > 0.85 ? 0.22 : 0;
  const U = {
    uTime: { value: 0 }, uH: { value: hTex }, uSpan: { value: SPAN }, uLevel: { value: LV }, uN: { value: nrm },
    uShallow: { value: pal[0] }, uMid: { value: pal[1] }, uDeep: { value: pal[2] }, uShallowN: { value: pal[3] }, uMidN: { value: pal[4] }, uDeepN: { value: pal[5] }, uTide: { value: 0 },
    uSkyH: { value: new THREE.Color() }, uSkyZ: { value: new THREE.Color() }, uL: { value: new THREE.Vector3(0, 1, 0) }, uLCol: { value: new THREE.Color(1, 1, 1) },
    uNight: { value: 1 }, uFogCol: { value: new THREE.Color() }, uFogD: { value: 0.0017 }, uAmb: { value: 0.5 }, uDay: { value: 0 },
    uWindDir: { value: new THREE.Vector2(0.8, 0.6) }, uWind: { value: 0.3 }, uRain: { value: 0 }, uSurge: { value: 0 }, uIce: { value: ICE },
    uLamp: { value: new THREE.Color(1.0, 0.56, 0.24) },
    uRef: { value: null }, uRM: { value: new THREE.Matrix4() }, uRY: { value: 0 }, uRA: { value: 0 },   // planar reflection (reflect.js, high tier only)
    uBg: { value: new THREE.Color(-1, -1, -1) },     // the scene's background colour: where the mirror only cleared to it, it shows nothing
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vW; varying vec3 vV; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix*w; vV = mv.xyz; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uTime, uSpan, uLevel, uNight, uFogD, uAmb, uTide, uRY, uRA, uDay, uWind, uRain, uSurge, uIce; uniform sampler2D uH, uN, uRef; uniform mat4 uRM;
      uniform vec3 uShallow, uMid, uDeep, uShallowN, uMidN, uDeepN, uSkyH, uSkyZ, uL, uLCol, uFogCol, uLamp, uBg; uniform vec2 uWindDir; varying vec3 vW; varying vec3 vV;
      void main(){
        vec2 hu = vW.xz / (2.0*uSpan) + 0.5;
        vec4 hs = texture2D(uH, hu); bool inMap = hu.x > 0.0 && hu.x < 1.0 && hu.y > 0.0 && hu.y < 1.0;
        float depth = inMap ? hs.r * 4.5 - 0.5 + uTide : 4.0;
        if (depth < -0.03) discard;                                           // dry ground (under the bank)
        float fd = length(vV);
        float lod = 1.0 - smoothstep(70.0, 300.0, fd);                        // fine ripples fade with distance (no shimmer)
        vec2 p = vW.xz; float rr = length(p);
        float nat = smoothstep(172.0, 196.0, rr);                             // 0 = the town moat, 1 = the lake and the river (greener, wilder)
        // wind: slow gust patches drift downwind and roughen the surface ("cat's paws")
        float gust = smoothstep(0.36, 0.7, texture2D(uN, p*0.0043 - uWindDir*uTime*0.0055).a);
        float calm = 1.0 - 0.55*uIce;
        vec4 t1 = texture2D(uN, p*0.031 + vec2(uTime*0.010, uTime*0.006)); vec3 n1 = t1.xyz*2.0-1.0;
        vec3 n2 = texture2D(uN, vec2(p.x*0.8 - p.y*0.6, p.x*0.6 + p.y*0.8)*0.083 - vec2(uTime*0.017, -uTime*0.011)).xyz*2.0-1.0;
        vec4 t3 = texture2D(uN, p*0.23 + uWindDir*uTime*0.045 + vec2(-uTime*0.01, uTime*0.016)); vec3 n3 = t3.xyz*2.0-1.0;
        // two wind-driven wave trains (crests bent by a slow meander) ...
        vec2 wd = uWindDir, wn = vec2(-wd.y, wd.x);
        float a1 = dot(p, wd)*0.85 - uTime*1.7 + sin(dot(p, wn)*0.11 + uTime*0.21)*1.4;
        float a2 = dot(p, vec2(0.6, -0.8))*0.55 - uTime*1.15 + sin(dot(p, vec2(0.8, 0.6))*0.07)*1.1;
        float patchy = smoothstep(0.25, 0.75, t1.a);                         // the wave trains come and go in patches, never a regular corrugation
        vec2 wav = (wd*cos(a1)*0.04 + vec2(0.6, -0.8)*cos(a2)*0.022) * (0.35 + 0.65*patchy);
        // ... and the surge: a train of long, low crests rolling round the town moat now and then (two opposite bands)
        float ang = atan(p.y, p.x);
        float env = uSurge * (1.0 - nat) * pow(max(0.0, cos(2.0*(ang - uTime*0.05))), 10.0);
        vec2 tng = vec2(-p.y, p.x) / max(rr, 1.0);
        float sph = ang*65.0 - uTime*3.2;
        wav += tng * cos(sph) * 0.16 * env;
        float rough = (0.6 + 0.7*gust) * (0.75 + 0.5*uWind) + uRain*0.9;
        vec2 sl = ((n1.xy*0.55 + n2.xy*0.4)*(0.8 + 0.3*gust) + n3.xy*0.26*lod*rough) * 0.42 * calm + wav*(0.12 + 0.88*lod)*(0.65 + 0.5*gust)*calm;
        vec3 N = normalize(vec3(sl.x, 1.0, sl.y));
        vec3 V = normalize(cameraPosition - vW);
        float ndv = max(dot(N, V), 0.0);
        float fres = 0.02 + 0.98*pow(1.0 - ndv, 5.0);
        vec3 R = reflect(-V, N);
        vec3 sky = mix(uSkyH * 0.8, uSkyZ * 0.9, clamp(R.y*1.3, 0.0, 1.0));
        sky = mix(sky, mix(sky, vec3(0.16, 0.42, 0.86) * (0.25 + 0.75*uAmb), 0.5) * vec3(0.8, 0.92, 1.12), 0.75 - 0.25*nat);   // the sky in the water is bluer than the sky
        sky *= 1.0 - 0.35*uNight;
        // the mirror without a mirror: march the reflected ray over the baked heights — the town wall (stone + the glowing rune band at night),
        // the banks and the treeline (a dark ragged band along the far shore). 7 steps of growing length: 1.4 .. 28 m
        // (the march follows the long waves only, so the mirrored edges wave instead of breaking into speckles; soft edges, first hit wins)
        float wallHit = 0.0, bankHit = 0.0, rune = 0.0, slope = 0.0; vec2 rd = vec2(0.0);
        if (depth > 0.1 && inMap && fd < 460.0) {
          vec3 Rm = reflect(-V, normalize(vec3((n1.xy*0.55 + n2.xy*0.4) * 0.16 * calm + wav*0.5, 1.0).xzy));
          float rl = length(Rm.xz);
          if (rl > 1e-3 && Rm.y > 0.0) {
            rd = Rm.xz / rl; slope = Rm.y / rl;
            for (int i = 1; i <= 7; i++) {
              float fi = float(i), t = fi * (1.0 + 0.42*fi);
              vec4 h2 = texture2D(uH, (p + rd * t) / (2.0*uSpan) + 0.5);
              float yy = t * slope, oh = h2.g * 20.0;
              float cw = oh > 0.5 ? clamp((oh + 1.2 - yy) / (0.8 + 0.25*fi), 0.0, 1.0) : 0.0;
              if (cw > 0.0) { wallHit = cw * (1.0 - fi*0.05); rune = smoothstep(0.9, 0.4, abs(yy - 6.5)); break; }
              float cb = clamp((h2.b * 24.0 - yy) / (1.2 + 0.4*fi), 0.0, 1.0);
              if (cb > 0.0) { bankHit = cb * (1.0 - fi*0.05); break; }
            }
          }
        }
        // body colour: lighter, greener shallows over the bed, deep navy-teal in the middle, lit by the light of the hour
        float dk = smoothstep(0.05, 2.0, depth);
        vec3 body = mix(mix(uShallow, uShallowN, nat), mix(uMid, uMidN, nat), smoothstep(0.0, 0.6, dk));
        body = mix(body, mix(uDeep, uDeepN, nat), smoothstep(0.45, 1.0, dk));
        body *= (0.1 + 0.9*uAmb) * (0.9 + 0.2 * (n1.x*0.5 + 0.5));
        // caustics: a bright web dancing on the bed of the shallows (daylight only)
        float cw = 1.0 - smoothstep(0.0, 0.22, abs(n2.x*0.6 + n3.y*0.8));
        body += vec3(0.42, 0.62, 0.55) * cw * (1.0 - smoothstep(0.15, 1.2, depth)) * uDay * 0.16 * lod * calm;
        vec3 bankC = vec3(0.035, 0.07, 0.045) * (0.12 + 0.88*uAmb) + sky * 0.06;
        vec3 wallC = vec3(0.15, 0.19, 0.29) * (0.1 + 0.9*uAmb) + vec3(0.25, 0.62, 1.15) * rune * uNight * 0.9;
        float wk = wallHit * (1.0 - 0.6*uRA) * (1.0 - smoothstep(170.0, 300.0, fd));
        vec3 mir = mix(mix(sky, bankC, bankHit), wallC, wk);
        float rk = mix(clamp(0.05 + fres*0.9, 0.0, 0.52), clamp(0.3 + fres*1.1, 0.0, 0.78), max(bankHit, wk));
        vec3 col = mix(body, mir, rk);
        if (uRA > 0.01 && fd < 400.0) {      // the real mirror image (castle, walls, towers), rippled by the same waves, about 35 %
          vec4 rc = uRM * vec4(vW, 1.0);
          if (rc.w > 0.0) {
            vec2 ru = clamp(rc.xy / rc.w + sl * 0.08, 0.003, 0.997);
            float rk2 = uRA * 0.6 * (0.6 + 0.4 * fres) * smoothstep(0.05, 0.6, depth) * (1.0 - smoothstep(220.0, 400.0, fd));
            vec4 rt = texture2D(uRef, ru);                  // alpha = where the mirror drew something (the sky stays the water's own blue sky)
            rt.a *= step(0.012, distance(rt.rgb, uBg));     // (a Color scene.background clears the mirror opaque: ignore those pixels)
            col = mix(col, rt.rgb, rk2 * rt.a);
          }
        }
        // sun glitter by day; at night a moon path: narrow across, long toward the viewer, broken into glints by the ripples — the moon is
        // set in front of the camera (mirroring the view), so the path is always in view
        vec3 cf = -vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
        vec3 Ls = normalize(uL);
        float sp = max(dot(R, Ls), 0.0);
        vec3 lc = mix(uLCol, vec3(0.74, 0.84, 1.0) * (0.5 + 0.35*length(uLCol)), uNight * 0.8);
        col += uLCol * (pow(sp, 520.0) * 2.4 + pow(sp, 36.0) * 0.12) * calm * (1.0 - uNight);
        if (uNight > 0.02) {
          vec3 Lm = normalize(vec3(cf.x, max(0.2, -cf.y * 0.8), cf.z));
          float az = 1.0 - dot(normalize(R.xz + 1e-5), normalize(Lm.xz + 1e-5)), el = R.y - Lm.y;
          float path = exp(-az * 700.0) * exp(-el * el * 16.0);
          float gl = smoothstep(0.62, 0.95, t3.a * 0.55 + n3.x * 0.45 + 0.25);
          col += lc * path * (0.05 + 1.1 * gl) * uNight * calm;
        }
        // warm lamps: their mirror image broken by the ripples into shimmering streaks, and the light they throw on the water close by
        if (uNight > 0.02) {
          float la = 0.0;
          if (slope > 0.0) la = texture2D(uH, (p + rd * min(4.2 / slope, 36.0)) / (2.0*uSpan) + 0.5).a;
          float glint = pow(max(0.0, 1.0 - abs(n3.x + n2.y)*1.8), 12.0);
          col += uLamp * uNight * 0.75 * (la * la * la * (1.0 + 1.5*fres) * (0.3 + 1.4*glint) + hs.a * hs.a * (0.02 + 0.5*glint));
        }
        // shoreline foam: broken, drifting streaks hugging the bank and the wall footing, lapping in toward the shore; the surge washes it higher
        float sd2 = depth + n2.x*0.1*lod;
        float band = smoothstep(0.6, 0.0, sd2);
        float lap = smoothstep(0.35, 1.0, sin(depth*15.0 + uTime*1.5 + n1.x*3.0 + t1.a*4.0)*0.5 + 0.5);
        float fn = texture2D(uN, p*0.14 + vec2(uTime*0.011, -uTime*0.008)).a;
        float streak = smoothstep(0.45, 0.85, fn*0.75 + n3.y*0.3 + 0.25*lap);
        float foam = band * (0.07 + 0.5*streak) * (1.0 + 1.8*env) + smoothstep(0.1, 0.0, sd2) * 0.22;
        foam *= 1.0 - 0.6*uIce;
        vec3 foamC = vec3(0.84, 0.93, 0.98) * (0.16 + 0.64*uAmb) + vec3(0.1, 0.13, 0.2) * uNight;
        col = mix(col, foamC, clamp(foam, 0.0, 0.6));
        float alpha = mix(0.2, 0.97, smoothstep(0.0, 1.1, depth)) * smoothstep(-0.03, 0.05, depth);
        alpha = max(alpha, clamp(foam, 0.0, 0.6) * 0.85 * smoothstep(-0.03, 0.05, depth));
        // winter: the open water turns a cold steel-blue; ice shelves grow out from the banks (the still lake freezes over), floes drift in the
        // open channel of the moat; the ice is snow-dusted, with patches of dark clear ice showing their cracks
        if (uIce > 0.0) {
          col = mix(col, vec3(dot(col, vec3(0.3, 0.45, 0.25))) * vec3(0.78, 0.9, 1.05), 0.45 * uIce);
          float edge = uIce * (1.05 + 1.6*nat) + (t1.a - 0.5) * 0.5;
          float floe = smoothstep(0.665, 0.715, fn) * uIce * (1.0 - nat);
          float ice = max(smoothstep(edge + 0.04, edge - 0.04, depth), floe) * smoothstep(-0.03, 0.03, depth);
          float crack = 1.0 - smoothstep(0.0, 0.03, abs(n1.x*0.7 + n2.y*0.7));
          float snow = smoothstep(0.35, 0.65, gust * 0.6 + t1.a * 0.7 - 0.1);                     // drifted snow vs swept, clear ice
          vec3 clear = mix(vec3(0.2, 0.3, 0.38), sky * 0.9, 0.25 + 0.5*fres) * (1.0 - crack*0.5) + vec3(0.6, 0.75, 0.85) * crack * 0.12;
          vec3 iceC = mix(clear, mix(vec3(0.78, 0.86, 0.94), vec3(0.95, 0.97, 1.0), t3.a), snow) * (0.14 + 0.86*uAmb);
          iceC += lc * pow(max(dot(reflect(-V, vec3(0.0, 1.0, 0.0)), Ls), 0.0), 60.0) * 0.5 * (1.0 - snow) * (1.0 - uNight * 0.5);
          float rim = smoothstep(0.1, 0.0, abs(depth - edge)) * (1.0 - smoothstep(0.0, 0.03, depth - edge - 0.06));
          col = mix(col, iceC, ice); col = mix(col, foamC * 1.1, rim * 0.45);
          alpha = max(alpha, ice * 0.98);
        }
        float fog = 1.0 - exp(-uFogD*uFogD*fd*fd);
        col = mix(col, uFogCol, clamp(fog, 0.0, 1.0));
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const geo = new THREE.PlaneGeometry(EXTENT * 2, EXTENT * 2, 1, 1); geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat); mesh.position.y = LV; mesh.name = 'water'; const LV0 = LV; mesh.renderOrder = -1;
  scene.add(mesh);
  // depth (m) at a point from the bake (the tide not included): for the water life (where fish may swim, where a duck may glide)
  const depthAt = (x, z) => {
    const i = Math.round((x / SPAN + 1) / 2 * (RES - 1)), j = Math.round((z / SPAN + 1) / 2 * (RES - 1));
    if (i < 0 || j < 0 || i >= RES || j >= RES) return -1;
    return hm[(j * RES + i) * 4] / 255 * 4.5 - 0.5;
  };
  const WK = ['uShallow', 'uMid', 'uDeep', 'uShallowN', 'uMidN', 'uDeepN'], wBase = WK.map((k) => U[k].value.clone()), wMul = new THREE.Color(1, 1, 1), wPaint = () => WK.forEach((k, i) => U[k].value.copy(wBase[i]).multiply(wMul));
  return {
    mesh, depthAt, ice: ICE,
    setLook(name) { const pl = WATER_PAL[name]; if (!pl) return; WK.forEach((k, i) => { wBase[i].set(pl[i]); }); wPaint(); },
    setTheme(rgb) { wMul.setRGB(rgb[0], rgb[1], rgb[2]); wPaint(); },                    // p35 P9: the castle level's water tint (theme.js)
    // a slow tide: the surface breathes ±0.2 m, the shoreline (and the foam line) creeps up and down the stone bank; now and then a surge rolls round the moat
    update(t) {
      U.uTime.value = t; const td = Math.sin(t * 0.11) * 0.2 + Math.sin(t * 0.047 + 1.3) * 0.08; U.uTide.value = td; mesh.position.y = LV0 + td;
      const sg = Math.max(0, Math.sin(t * 0.045 + 0.6)); U.uSurge.value = sg * sg;
      if (scene.background && scene.background.isColor) U.uBg.value.copy(scene.background); else U.uBg.value.setRGB(-1, -1, -1);
    },
    setTime(P, W = null) {
      U.uSkyH.value.copy(P.hor); U.uSkyZ.value.copy(P.mid); U.uNight.value = P.night; U.uDay.value = Math.max(0, 1 - P.night * 1.6) * (W ? 1 - W.cover * 0.7 : 1);
      if (W && W.grey > 0.01) { const f = W.grey * 0.85; U.uSkyH.value.lerp(P.fog, f).multiplyScalar(1 - 0.4 * f); U.uSkyZ.value.lerp(P.fog, f).multiplyScalar(1 - 0.5 * f); }
      U.uL.value.copy(P.night > 0.5 ? P.moonDir : P.sunDir); U.uLCol.value.copy(P.key);
      U.uFogCol.value.copy(P.fog); U.uFogD.value = P.fogD; U.uAmb.value = (1 - P.night * 0.86) * (W ? 1 - W.cover * 0.45 : 1);
      if (W) { U.uWind.value = THREE.MathUtils.clamp(W.wind ?? 0.3, 0, 1.5); U.uRain.value = W.rain || 0; }
    },
    // warm lights by the water: [[x, z, strength 0..1], ...] — baked into the map once (a soft 5 m blob each)
    setLamps(list) {
      const R0 = 5, rt = Math.ceil(R0 / (2 * SPAN / (RES - 1)));
      for (const [x, z, s = 1] of list) {
        const ci = Math.round((x / SPAN + 1) / 2 * (RES - 1)), cj = Math.round((z / SPAN + 1) / 2 * (RES - 1));
        for (let j = cj - rt; j <= cj + rt; j++) for (let i = ci - rt; i <= ci + rt; i++) {
          if (i < 0 || j < 0 || i >= RES || j >= RES) continue;
          const wx = (i / (RES - 1) * 2 - 1) * SPAN, wz = (j / (RES - 1) * 2 - 1) * SPAN, d = Math.hypot(wx - x, wz - z) / R0; if (d >= 1) continue;
          const o = (j * RES + i) * 4 + 3, v = Math.exp(-d * d * 4.5) * s * 255;
          hm[o] = Math.min(255, hm[o] + v);
        }
      }
      hTex.needsUpdate = true;
    },
  };
}
