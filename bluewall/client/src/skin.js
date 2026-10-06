// Tier skins: the same castle / vault / mine geometry looks like wood, stone, iron, gold, diamond or blue crystal depending on the level of
// the structure it belongs to (levels 1-3 wood, 4-7 stone, 8-11 iron, 12-15 gold, 16-19 diamond, 20 blue crystal).
//
// How it works (zero rebuilds, zero extra draw calls, one extra vertex attribute):
//   * every batched vertex of a skinned material carries aTag = (structure id, min level): the Batcher stamps it from B.tagEnt / B.tagMin
//   * the shared uniform array uLv[id] holds each structure's current level
//   * the vertex shader derives the tier from uLv[id] (varying vTier) and clips the vertex away while the structure is below the
//     piece's min level -> decorations (extra turrets, spires, crystals ...) *appear* as the structure levels up
//   * the fragment shader repaints the albedo for the tier (planks, stone, riveted iron, gilded marble, faceted diamond, blue crystal),
//     adjusts roughness / metalness / normal flatness and the rune glow.
// Materials are patched once (applySkin) - the programs compile with everything else on the loading screen.
import * as THREE from 'three';
import { patchDepth } from './destruct.js';

export const ENT = {
  none: 0, wall: 1, keep: 2, townwall: 3, vault_ruby: 4, vault_emerald: 5, vault_turq: 6, mine_ruby: 7, mine_emerald: 8, mine_turq: 9,
  barracks: 10, stable: 11, training: 12, lair: 13, workshop: 14, forge: 15, towers: 16,
};
export const TIER_AT = [1, 6, 12, 18, 24, 30];                 // (in the player-facing 1..30 levels; inside this file the same tiers sit at 1 / 4 / 8 / 12 / 16 / 20)
export const TIER_NAME = ['wood', 'stone', 'iron', 'gold', 'diamond', 'crystal'];
export const tierOf = (lv) => (lv >= 20 ? 5 : lv >= 16 ? 4 : lv >= 12 ? 3 : lv >= 8 ? 2 : lv >= 4 ? 1 : 0);

const LVL = new Float32Array(32).fill(20);          // untagged geometry (id 0) and unknown structures always show the top look
export const uLv = { value: LVL };
export const levelOf = (id) => LVL[ENT[id] ?? id] ?? 20;
// p35 (30 levels): the player-facing level runs 1..30 but every look in this file (tier thresholds, GLSL, the min level of each decoration) was authored on 1..20, so the level is
// stretched once, here: 1 -> 1 ... 30 -> 20  (the tiers then start at 1 / 6 / 12 / 18 / 24 / 30)
const to20 = (lv) => { lv = Math.max(0, Math.min(30, Math.round(+lv) || 0)); return lv <= 1 ? lv : 1 + (lv - 1) * 19 / 29; };
export function setEntityLevel(id, lv) { const k = typeof id === 'number' ? id : ENT[id]; if (k == null || k < 1) return; LVL[k] = to20(lv); }

const VERT_PARS = `attribute vec2 aTag; uniform float uLv[32]; varying float vTier; varying float vSub; varying vec3 vSkWP; varying vec3 vSkWN; varying float vSkHide;`;
const VERT_MAIN = `float skLv = uLv[int(aTag.x + 0.5)];
vTier = skLv >= 20.0 ? 5.0 : skLv >= 16.0 ? 4.0 : skLv >= 12.0 ? 3.0 : skLv >= 8.0 ? 2.0 : skLv >= 4.0 ? 1.0 : 0.0;
vSub = clamp((skLv - (vTier < 0.5 ? 1.0 : vTier < 1.5 ? 4.0 : vTier < 2.5 ? 8.0 : vTier < 3.5 ? 12.0 : vTier < 4.5 ? 16.0 : 20.0)) / 3.0, 0.0, 1.0);
vSkHide = skLv < aTag.y ? 1.0 : 0.0;
vSkWP = (modelMatrix * vec4(transformed, 1.0)).xyz;
vSkWN = normalize(mat3(modelMatrix) * objectNormal);`;

const FRAG_PARS = `varying float vTier; varying float vSub; varying vec3 vSkWP; varying vec3 vSkWN; varying float vSkHide;
float skH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float skW(float T, float a, float b, float c, float d, float e, float f){ return T < 0.5 ? a : T < 1.5 ? b : T < 2.5 ? c : T < 3.5 ? d : T < 4.5 ? e : f; }
vec3 skinAlbedo(float T, float sub, vec3 base, vec3 wp, vec3 n) {
  float lum = dot(base, vec3(0.299, 0.587, 0.114));
  vec3 an = abs(n);
  float hc = an.y > 0.7 ? wp.x + wp.z * 0.41 : (an.x > an.z ? wp.z : wp.x);
  float vc = an.y > 0.7 ? wp.z - wp.x * 0.27 : wp.y;
#if SK_ROLE == 0
  if (T < 0.5) {                                              // wood: vertical planks with grain and dark seams
    float pl = hc * 0.9, id = floor(pl), f = fract(pl);
    float gr = 0.5 + 0.5 * sin(vc * 2.6 + id * 7.3 + sin(vc * 9.0 + id) * 0.6);
    vec3 w = mix(vec3(0.43, 0.28, 0.16), vec3(0.66, 0.45, 0.27), skH(vec2(id, 3.0)));
    w *= 0.82 + 0.3 * gr;
    w *= 0.55 + 0.45 * smoothstep(0.0, 0.08, f) * smoothstep(1.0, 0.92, f);
    return w * (0.55 + 0.8 * lum);
  }
  if (T < 1.5) return base * vec3(1.02, 0.97, 0.9);           // stone as authored (warm)
  if (T < 2.5) {                                              // iron: riveted steel plates
    vec3 st = vec3(0.30, 0.34, 0.42) * (0.5 + 1.0 * lum);
    vec2 g = vec2(hc, vc) / 2.4, q = abs(fract(g) - 0.5);
    float seam = smoothstep(0.455, 0.5, max(q.x, q.y));
    float rv = 1.0 - smoothstep(0.045, 0.075, length(vec2(0.41) - q));
    st = mix(st, st * 0.35, seam) + rv * vec3(0.22, 0.24, 0.28) + vec3(0.04, 0.06, 0.1) * sub;
    return st;
  }
  if (T < 3.5) {                                              // gold: cream marble with golden bands
    vec3 mar = vec3(0.92, 0.85, 0.7) * (0.55 + 0.75 * lum);
    float band = smoothstep(0.38, 0.5, abs(fract(wp.y * 0.18) - 0.5));
    return mix(mar, vec3(1.0, 0.74, 0.25) * (0.8 + 0.4 * lum), band * 0.9);
  }
  if (T < 4.5) {                                              // diamond: faceted ice-white cells
    vec2 gq = vec2(hc, vc) * 0.8; float rr = skH(floor(gq));
    vec3 d = mix(vec3(0.6, 0.8, 0.95), vec3(0.95, 0.99, 1.0), rr) * (0.62 + 0.65 * lum);
    vec2 q = abs(fract(gq) - 0.5); d += smoothstep(0.42, 0.5, max(q.x, q.y)) * vec3(0.25, 0.3, 0.35);
    return d;
  }
  return base * vec3(0.5, 0.58, 0.82);                        // blue crystal (the original Blue Wall look)
#elif SK_ROLE == 1
  if (T < 0.5) {
    float pl = vc * 1.1, id = floor(pl), f = fract(pl);
    vec3 w = mix(vec3(0.3, 0.19, 0.1), vec3(0.45, 0.3, 0.17), skH(vec2(id, 7.0))) * (0.5 + 0.9 * lum);
    return w * (0.5 + 0.5 * smoothstep(0.0, 0.1, f) * smoothstep(1.0, 0.9, f));
  }
  if (T < 1.5) return base * vec3(0.92, 0.88, 0.82);
  if (T < 2.5) return vec3(0.17, 0.19, 0.24) * (0.5 + 1.0 * lum);
  if (T < 3.5) return vec3(0.9, 0.68, 0.26) * (0.6 + 0.7 * lum);
  if (T < 4.5) return vec3(0.5, 0.68, 0.9) * (0.6 + 0.8 * lum);
  return base * vec3(0.34, 0.4, 0.62);
#elif SK_ROLE == 2
  float rows = 0.65 + 0.35 * smoothstep(0.0, 0.2, fract(wp.y * 1.7 + hc * 0.15));
  if (T < 0.5) return vec3(0.52, 0.37, 0.2) * (0.6 + 0.9 * lum) * rows;
  if (T < 1.5) return vec3(0.76, 0.31, 0.21) * (0.55 + 1.0 * lum) * rows;
  if (T < 2.5) return vec3(0.2, 0.23, 0.3) * (0.5 + 1.2 * lum) * rows;
  if (T < 3.5) return vec3(1.0, 0.76, 0.28) * (0.6 + 0.8 * lum) * rows;
  if (T < 4.5) return vec3(0.72, 0.9, 1.0) * (0.55 + 1.0 * lum) * rows;
  return base;
#elif SK_ROLE == 3
  if (T < 0.5) return vec3(0.32, 0.2, 0.11) * (0.6 + 0.6 * lum);
  if (T < 1.5) return vec3(0.76, 0.48, 0.22) * (0.5 + 0.7 * lum);
  if (T < 2.5) return vec3(0.64, 0.68, 0.76) * (0.5 + 0.6 * lum);
  if (T < 3.5) return base;
  if (T < 4.5) return vec3(0.93, 0.97, 1.0) * (0.55 + 0.6 * lum);
  return base;
#else
  return base;
#endif
}
float skinRough(float T, float r) {
#if SK_ROLE == 0 || SK_ROLE == 1
  return skW(T, 0.9, r, 0.42, 0.34, 0.1, min(r, 0.24));
#elif SK_ROLE == 2
  return skW(T, 0.9, 0.7, 0.4, 0.28, 0.1, r);
#else
  return r;
#endif
}
float skinMetal(float T, float m) {
#if SK_ROLE == 0 || SK_ROLE == 1
  return skW(T, 0.0, m, 0.85, 0.3, 0.15, m);
#elif SK_ROLE == 2
  return skW(T, 0.0, 0.0, 0.7, 0.8, 0.2, m);
#elif SK_ROLE == 3
  return skW(T, 0.35, 0.6, 0.9, m, 0.8, m);
#else
  return m;
#endif
}
float skinFlat(float T) {
#if SK_ROLE <= 2
  return skW(T, 0.6, 0.0, 0.85, 0.5, 0.9, 0.2);
#else
  return 0.0;
#endif
}
vec3 skinGlow(float T) {
#if SK_ROLE == 4
  return T < 1.5 ? vec3(0.0) : T < 2.5 ? vec3(0.25) : T < 3.5 ? vec3(2.4, 0.9, 0.2) : T < 4.5 ? vec3(0.75, 1.15, 1.25) : vec3(1.0);
#elif SK_ROLE == 3
  return vec3(T < 1.5 ? 0.0 : T < 4.5 ? 1.0 : 2.4);
#else
  return vec3(1.0);
#endif
}`;

// role: 0 stone body, 1 dark stone (plinth / cornice / walkway), 2 roof, 3 gold ornaments, 4 rune bands
export function applySkin(mat, role, fixedEnt = null) {
  if (!mat || mat.userData.skin != null) return mat;
  mat.userData.skin = role; mat.userData.skinFixed = fixedEnt;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    sh.uniforms.uLv = uLv;
    const vm = fixedEnt == null ? VERT_MAIN : VERT_MAIN.replace('uLv[int(aTag.x + 0.5)]', 'uLv[' + fixedEnt + ']').replace('skLv < aTag.y', 'false');
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + (fixedEnt == null ? VERT_PARS : VERT_PARS.replace('attribute vec2 aTag; ', '')))
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + vm)
      .replace('#include <project_vertex>', '#include <project_vertex>\nif (vSkHide > 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);');
    let f = sh.fragmentShader.replace('#include <common>', '#include <common>\n#define SK_ROLE ' + role + '\n' + FRAG_PARS)
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = skinAlbedo(vTier, vSub, diffuseColor.rgb, vSkWP, normalize(vSkWN));')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = skinRough(vTier, roughnessFactor);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = skinMetal(vTier, metalnessFactor);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nonPerturbedNormal, skinFlat(vTier)));')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= skinGlow(vTier);');
    if (role === 4) f = f.replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\nif (vTier < 1.5) discard;');
    sh.fragmentShader = f;
  };
  mat.customProgramCacheKey = () => prevKey() + '|skin' + role + (fixedEnt == null ? '' : 'f' + fixedEnt);
  mat.needsUpdate = true;
  return mat;
}

// shadow caster twin: pieces that are not unlocked yet must not cast shadows either
let DEPTH = null;
export function skinDepthMaterial() {
  if (DEPTH) return DEPTH;
  DEPTH = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  DEPTH.onBeforeCompile = (sh) => {
    sh.uniforms.uLv = uLv;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aTag; uniform float uLv[32];')
      .replace('#include <project_vertex>', '#include <project_vertex>\nif (uLv[int(aTag.x + 0.5)] < aTag.y) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);');
  };
  DEPTH.customProgramCacheKey = () => 'bwskindepth';
  patchDepth(DEPTH);
  return DEPTH;
}
