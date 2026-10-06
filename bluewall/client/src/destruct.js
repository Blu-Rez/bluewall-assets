// Destruction of the home map during an attack (the enemy base IS the main map, re-skinned).
//   * every batched vertex of a destructible structure carries `aB` = its target id (Batcher.bid, castle.js / mines / vaults ...); id 0 = scenery
//   * a tiny float data texture (one column per target, three rows) holds the state: row 0 = (collapse, damage, flash, seed), row 1 = (x, z, height, footprint radius), row 2 = (ground height, 0, 0, 0)
//   * the vertex shader (patched into the already skinned materials, and into the shadow depth material) does the rest: lean, crumble (each
//     triangle drifts away on its own), sink into a rubble heap and, in the last beat, go under the ground (the ruins kit, ruins.js, takes over), char and flash
//   * everything is gated by the uniform uBattle: at home the extra work is one uniform branch per vertex
// API:  initDestruct(n)  patchDestruct(mat)  patchDepth(mat)  DS.set(id, {collapse, dmg, flash})  DS.flush()  DS.reset()  DU.battle.value = 1
import * as THREE from 'three';

export const DU = { bs: { value: null }, battle: { value: 0 } };
let data = null, tex = null, nCols = 0, dirty = false;

function alloc(n) {
  const old = tex;
  nCols = Math.max(2, n + 1);
  data = new Float32Array(nCols * 4 * 3);
  tex = new THREE.DataTexture(data, nCols, 3, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  DU.bs.value = tex;
  if (old) old.dispose();
}
alloc(1);                                                      // a valid texture exists from the very first compile

export function initDestruct(targets, height) {
  alloc(targets.length);
  for (const t of targets) {
    const o = t.id * 4, o2 = nCols * 4 + t.id * 4, o3 = nCols * 8 + t.id * 4;
    if (height) { const hw = (t.w || 8) * 0.3, hd = (t.d || 8) * 0.3, cr = Math.cos(t.rot || 0), sr = Math.sin(t.rot || 0); let g = height(t.x, t.z); for (const [a, b] of [[hw, hd], [-hw, hd], [hw, -hd], [-hw, -hd]]) g = Math.min(g, height(t.x + a * cr + b * sr, t.z - a * sr + b * cr)); data[o3] = g; }
    data[o + 3] = ((t.id * 2654435761) >>> 0) / 4294967296;      // per-structure random seed (direction of the lean)
    data[o2] = t.x; data[o2 + 1] = t.z; data[o2 + 2] = t.h || 10; data[o2 + 3] = Math.hypot(t.w || 8, t.d || 8) / 2;
  }
  tex.needsUpdate = true; dirty = false;
}

export const DS = {
  set(id, { collapse, dmg, flash }) { if (!data || id < 1 || id >= nCols) return; const o = id * 4; if (collapse != null) data[o] = collapse; if (dmg != null) data[o + 1] = dmg; if (flash != null) data[o + 2] = flash; dirty = true; },
  get(id) { const o = id * 4; return { collapse: data[o], dmg: data[o + 1], flash: data[o + 2] }; },
  flush() { if (dirty && tex) { tex.needsUpdate = true; dirty = false; } },
  reset() { if (!data) return; for (let i = 1; i < nCols; i++) { const o = i * 4; data[o] = 0; data[o + 1] = 0; data[o + 2] = 0; } tex.needsUpdate = true; dirty = false; },
};

const PARS = `attribute float aB; uniform sampler2D uBS; uniform float uBattle;
float dsH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float dsN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(dsH(i), dsH(i + vec2(1.0, 0.0)), f.x), mix(dsH(i + vec2(0.0, 1.0)), dsH(i + vec2(1.0, 1.0)), f.x), f.y); }`;
const VPARS = `varying float vDm; varying float vFl; varying float vCo; varying vec3 vDp;`;
const FN = `float fH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float fN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(fH(i), fH(i + vec2(1.0, 0.0)), f.x), mix(fH(i + vec2(0.0, 1.0)), fH(i + vec2(1.0, 1.0)), f.x), f.y); }`;
// The fall, in three beats (cp = 0..1 over the structure's collapse time):
//   1. it shakes and leans to one side,
//   2. it comes down floor by floor: the top goes first, and every part waits a different time (noise over the footprint) before it drops,
//   3. what is left is a low lumpy heap, higher in the middle, pushed out a little at the edges.
// Everything depends on the vertex POSITION only (never on the triangle), so neighbouring triangles always move together: no cracks, no flying slivers.
// The loose rubble chunks, the dust and the soot come from bfx.js.
// body: needs `transformed`; sets vDm / vFl / vCo only when `vary` (the depth material has no varyings)
const body = (vary) => `{
  ${vary ? 'vDm = 0.0; vFl = 0.0; vCo = 0.0;' : ''}
  if (uBattle > 0.5 && aB > 0.5) {
    ivec2 bi = ivec2(int(aB + 0.5), 0);
    vec4 s0 = texelFetch(uBS, bi, 0), s1 = texelFetch(uBS, ivec2(bi.x, 1), 0), s2 = texelFetch(uBS, ivec2(bi.x, 2), 0);
    ${vary ? 'vDm = s0.y; vFl = s0.z; vCo = s0.x;' : ''}
    float cp = s0.x;
    if (cp > 0.0) {
      float seed = s0.w, H = max(4.0, s1.z), R = max(4.0, s1.w), gY = s2.x, yr = transformed.y - gY;
      vec2 q = transformed.xz, away = q - s1.xy; float al = length(away); away = al > 1e-3 ? away / al : vec2(1.0, 0.0);
      float hf = clamp(yr / H, 0.0, 1.0);
      float trem = (1.0 - smoothstep(0.0, 0.42, cp)) * min(1.0, cp * 14.0);
      transformed.xz += vec2(sin(cp * 150.0 + yr * 0.9 + seed * 40.0), cos(cp * 137.0 + yr * 0.7 + seed * 31.0)) * 0.2 * trem * (0.25 + hf);
      vec2 dirL = vec2(cos(seed * 6.2831), sin(seed * 6.2831));
      transformed.xz += dirL * yr * 0.15 * smoothstep(0.0, 0.5, cp);
      float lump = dsN(q * 0.42 + seed * 7.0);
      float dly = 0.5 * dsN(q * 0.16 + seed * 13.0) + 0.5 * (1.0 - hf);
      float p = clamp((cp - 0.1 - 0.42 * dly) / 0.48, 0.0, 1.0);
      float e = p * p * (1.7 - 0.7 * p);
      float mound = (1.0 - smoothstep(0.0, R * 1.1, al)) * min(H * 0.11, 3.4);
      float rest = 0.045 + 0.1 * dsN(q * 0.3 + seed * 3.0);
      float yEnd = yr * rest + mound * (0.55 + 0.9 * lump) + (lump - 0.5) * 0.8;
      float bury = smoothstep(0.55, 1.0, cp) * (H * 0.35 + 3.8);       // the last beat: what is left of the old mesh goes under the ground, the ruins kit takes over
      transformed.y = gY + mix(yr, max(0.05, yEnd), e) - bury;
      transformed.xz += away * e * (0.5 + 1.9 * lump) * min(1.0, H * 0.05);
    }
  }
  ${vary ? 'vDp = transformed;' : ''}
}`;
// colour: damage = a little soot; collapse = the stone turns to warm dusty grey (never black), with a short hot flash at the first crack
const FRAG = `{
  float ash = smoothstep(0.04, 0.7, vCo);
  vec3 dc = diffuseColor.rgb; float lum = dot(dc, vec3(0.3, 0.59, 0.11));
  vec3 ac = vec3(lum) * vec3(0.78, 0.72, 0.66) + vec3(0.02, 0.016, 0.013);
  dc = mix(dc, ac, ash * 0.85) * (1.0 - 0.3 * clamp(vDm, 0.0, 1.0)) * (1.0 - 0.34 * ash);
  diffuseColor.rgb = dc;
}`;
// heat: the first 0.3 s of a collapse the cracks glow (thin lines of a world-space noise, never the whole building); a hit only warms the surface a little
const EMIS = `{ float hot = smoothstep(0.0, 0.02, vCo) * (1.0 - smoothstep(0.02, 0.12, vCo)); vec3 q = vec3(vDp.x, vDp.y * 0.8, vDp.z); float l1 = 1.0 - smoothstep(0.0, 0.014, abs(fN(q.xz * 0.9 + q.y * 0.5) - 0.5)); float l2 = 1.0 - smoothstep(0.0, 0.012, abs(fN(q.zx * 2.3 + q.y * 1.7 + 7.0) - 0.5)); totalEmissiveRadiance += vec3(1.0, 0.36, 0.1) * (hot * max(l1, l2 * 0.7) * 0.5 + vFl * 0.08); }`;

// skinned (or plain) world material: collapse BEFORE the skin code reads `transformed`
export function patchDestruct(mat) {
  if (!mat || mat.userData.destruct) return mat;
  mat.userData.destruct = true;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    sh.uniforms.uBS = DU.bs; sh.uniforms.uBattle = DU.battle;
    let v = sh.vertexShader.replace('#include <common>', '#include <common>\n' + PARS + '\n' + VPARS);
    v = v.includes('float skLv = uLv[') ? v.replace('float skLv = uLv[', body(true) + '\nfloat skLv = uLv[') : v.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + body(true));
    sh.vertexShader = v;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + VPARS + '\n' + FN)
      .replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\n' + FRAG)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + EMIS);
  };
  mat.customProgramCacheKey = () => prevKey() + '|bwdestr3';
  mat.needsUpdate = true; return mat;
}

// the shadow caster twin (skin.js skinDepthMaterial): destroyed pieces must not leave their shadow behind
export function patchDepth(mat) {
  if (!mat || mat.userData.destruct) return mat;
  mat.userData.destruct = true;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    sh.uniforms.uBS = DU.bs; sh.uniforms.uBattle = DU.battle;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + PARS).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + body(false));
  };
  mat.customProgramCacheKey = () => prevKey() + '|bwdestr3d';
  mat.needsUpdate = true; return mat;
}

let PLAIN = null;
export function plainDepthMaterial() { if (!PLAIN) PLAIN = patchDepth(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })); return PLAIN; }
