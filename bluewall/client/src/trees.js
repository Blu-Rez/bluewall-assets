// Realistic trees: EZ-Tree bakes (bark + leaf-card canopies) as instanced
// meshes near the castle, and camera-facing-ish crossed-quad impostors (baked
// at load time from the same trees) for the far forest. Leaves sway with WIND.
import * as THREE from 'three';
import { WIND } from './weather.js';
import { toFloatGeo } from './assets.js';
import { seasonWeights } from './terrain.js';
import { bakeAtlas, cardGeometry, cardFadeShader } from './sc_cards.js';

// variant -> [target height (m), weight, group]
const VARIANTS = {
  ez_pine_a: [17, 5, 'pine'], ez_pine_b: [21, 4, 'pine'], ez_pine_c: [13, 4, 'pine'],
  ez_oak_a: [13, 2, 'broad'], ez_oak_b: [16, 1.5, 'broad'], ez_ash_a: [15, 1.5, 'broad'], ez_aspen_a: [14, 1, 'broad'],
  ez_bush_a: [3.2, 1.2, 'bush'], ez_bush_b: [3.6, 1.2, 'bush'],
};
const U = { uTime: { value: 0 } };
export const TREE_TIME = U.uTime;     // (the countryside bushes sway on the same clock)

function windify(mat, strength = 1) {
  mat.customProgramCacheKey = () => 'bwwind' + strength;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime; sh.uniforms.uWind = WIND; sh.uniforms.uGust = WIND.gust;
    sh.vertexShader = 'uniform float uTime; uniform float uWind; uniform float uGust;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      {
        vec3 ip = vec3(0.0);
        #ifdef USE_INSTANCING
          ip = vec3(instanceMatrix[3][0], 0.0, instanceMatrix[3][2]);
        #endif
        float h = max(0.0, position.y);
        float w = (0.25 + uWind * 1.1 + uGust * 1.4) * ${strength.toFixed(2)};
        float ph = ip.x * 0.07 + ip.z * 0.05;
        transformed.x += sin(uTime * (1.3 + uWind) + ph + position.z * 0.3) * 0.035 * h * w;
        transformed.z += cos(uTime * (1.1 + uWind) + ph * 1.3 + position.x * 0.3) * 0.025 * h * w;
      }`);
  };
  return mat;
}

function variantParts(gltf, targetH) {
  gltf.scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const k = targetH / Math.max(0.01, box.max.y - box.min.y);
  const norm = new THREE.Matrix4().makeScale(k, k, k).premultiply(new THREE.Matrix4().makeTranslation(0, -box.min.y * k, 0));
  const parts = [];
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const g = toFloatGeo(o.geometry); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(norm, o.matrixWorld));
    const leaf = !!(o.material.map && (o.material.alphaTest > 0 || o.material.transparent || /leav/i.test(o.material.name + o.name)));
    const m = o.material.clone();
    if (leaf) { m.alphaTest = 0.5; m.transparent = false; m.side = THREE.DoubleSide; m.roughness = 0.85; windify(m, 1); }
    else { m.roughness = 0.95; windify(m, 0.35); }
    parts.push({ geometry: g, material: m, leaf });
  });
  return { parts, width: (box.max.x - box.min.x) * k, depth: (box.max.z - box.min.z) * k, height: targetH };
}

// Far-forest impostor (p22): the tree baked once into a small atlas — a side view (256 x 512) and a top view (128 x 128) — drawn on two
// crossed vertical quads plus a horizontal crown card at mid-crown height. Cards fade as they turn edge-on to the camera (sc_cards.js), so
// from the top-down camera a far tree is its round crown instead of a flat star / cross, and from the ground the crown card vanishes.
// Mipmapped (no sparkle in the distance) with the alpha cut-out held up at the small mips; both faces of a card are lit alike.
function bakeImpostor(renderer, v, group) {
  const W = 384, H = 512, half = Math.max(v.width, v.depth) / 2 * 1.05, top = v.height * 1.02;
  const tex = bakeAtlas(renderer, [{ parts: v.parts, half, top, views: [{ yaw: 0, rect: [2, 2, 252, 508] }, { top: true, rect: [258, 386, 124, 124] }] }], W, H);
  const side = [2 / W, 2 / H, 254 / W, 510 / H], crown = [258 / W, 386 / H, 382 / W, 510 / H];
  const g = cardGeometry([{ yaw: 0, rect: side, half, top }, { yaw: Math.PI / 2, rect: side, half, top }, { h: true, y: top * (group === 'pine' ? 0.42 : 0.6), half, rect: crown }], 'up');
  const mat = windify(new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 1 }), 0.6);
  const wind = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    wind(sh, r);
    cardFadeShader(sh, 0.1, 0.4);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\n  normal *= faceDirection;\n#endif')
      .replace('#include <alphatest_fragment>', `{ vec2 tz = vMapUv * vec2(${W}.0, ${H}.0); float lod = log2(max(1.0, max(length(dFdx(tz)), length(dFdy(tz))))); diffuseColor.a *= 1.0 + lod * 0.32; }\n#include <alphatest_fragment>`);
  };
  mat.customProgramCacheKey = () => 'bwimp2';
  return { geometry: g, material: mat };
}

export function buildTrees(renderer, scene, A, near, far, Q, rnd, season = null) {
  const names = Object.keys(VARIANTS).filter((k) => A.models[k]);
  if (!names.length) return null;
  const V = {};
  for (const k of names) V[k] = variantParts(A.models[k], VARIANTS[k][0]);
  // seasons: deciduous leaves turn gold/orange/red in autumn and fall in winter; pines get frosty
  const SW = seasonWeights(season), autumn = SW.w[2], winter = SW.w[3], spring = SW.w[0];
  const bare = winter > 0.55;
  const AUT = ['#e3b23c', '#d9822b', '#c4512e', '#b5402a', '#e8c547', '#8f9a3e'].map((c) => new THREE.Color(c));
  for (const k of names) {
    const broad = VARIANTS[k][2] !== 'pine';
    for (const p of V[k].parts) {
      if (!p.leaf) continue;
      if (broad) {
        p.material.color.lerp(new THREE.Color('#d98a35'), autumn * 0.55).lerp(new THREE.Color('#b8e07a'), spring * 0.25);
        if (bare && VARIANTS[k][2] === 'broad') p.skip = true;
      } else if (winter > 0.2) p.material.color.lerp(new THREE.Color('#dfe8ef'), winter * SW.snow * 0.5);
    }
  }
  const leafTint = (i, broad) => {
    const base = new THREE.Color(1, 1, 1).lerp(new THREE.Color().setHSL(0.27 + ((i * 0.618) % 1) * 0.05, 0.25 + ((i * 0.37) % 1) * 0.2, 0.42 + ((i * 0.71) % 1) * 0.16), 0.12);
    if (broad && autumn > 0.05) base.lerp(AUT[(i * 7 + 3) % AUT.length].clone().multiplyScalar(1.5), Math.min(1, autumn * (0.6 + ((i * 0.53) % 1) * 0.6)));
    return base;
  };
  const pick = (group) => {
    const pool = names.filter((k) => !group || VARIANTS[k][2] === group);
    const tot = pool.reduce((a, k) => a + VARIANTS[k][1], 0); let x = rnd() * tot;
    for (const k of pool) { if ((x -= VARIANTS[k][1]) < 0) return k; }
    return pool[0];
  };
  const S = new THREE.Vector3(), P = new THREE.Vector3(), Qt = new THREE.Quaternion();
  const buckets = {}, imp = {};
  const lowTrees = Q.trees === 'low';
  const cap = Math.round((Q.level === 'low' ? 18 : Q.level === 'medium' ? 34 : Q.level === 'ultra' ? 110 : 55) * (lowTrees ? 0.5 : 1));
  near.sort((a, b) => a.d - b.d);
  const real = near.slice(0, cap), rest = near.slice(cap).concat(far);
  const tint = (i) => new THREE.Color().setHSL(0.27 + ((i * 0.618) % 1) * 0.05, 0.25 + ((i * 0.37) % 1) * 0.2, 0.42 + ((i * 0.71) % 1) * 0.16);
  for (const t of real) {
    t.m.decompose(P, Qt, S);
    const group = t.group || (rnd() < 0.62 ? 'pine' : rnd() < 0.7 ? 'broad' : 'bush');
    const k = pick(group);
    const sc = 0.8 + (S.x - 0.75) * 0.35;
    (buckets[k] = buckets[k] || []).push(new THREE.Matrix4().compose(P, Qt, new THREE.Vector3(sc, sc * (0.9 + rnd() * 0.2), sc)));
  }
  // ---- LOD pool (B14): besides the fixed real trees around the castle, a pool of real trees follows the camera focus; everything else stays a
  // baked impostor (the impostor of a promoted tree is hidden, and comes back when the tree is demoted). Pools only draw from the meshes that
  // already exist, so the draw calls do not grow. Tree ids / counts of the battle targets do not depend on any of this.
  const dynCap = lowTrees ? 0 : Q.level === 'low' ? 0 : Q.level === 'medium' ? 24 : Q.level === 'ultra' ? 56 : 40;
  const impNames = names.filter((k) => VARIANTS[k][2] !== 'bush');
  for (const k of impNames) imp[k] = bakeImpostor(renderer, V[k], VARIANTS[k][2]);
  const ib = {}, rest2 = [];
  for (const t of rest) {
    t.m.decompose(P, Qt, S);
    const k = pick(t.group === 'broad' ? 'broad' : t.d > 200 || rnd() < 0.7 ? 'pine' : 'broad');     // (broadleaf groups — town edge, hamlets — stay broadleaf as impostors)
    if (!imp[k]) continue;
    const sc = 0.8 + (S.x - 0.75) * 0.35, mm = new THREE.Matrix4().compose(P, Qt, new THREE.Vector3(sc, sc * (0.9 + rnd() * 0.2), sc));
    const list = (ib[k] = ib[k] || []); rest2.push({ x: P.x, z: P.z, ki: k, ii: list.length, m: mm, slot: -1, kr: null, rot: Qt.clone(), sc, d: t.d }); list.push(mm);
  }
  // which real variants exist already (the fixed trees decide: no new meshes), and which tree of the far forest may be promoted into which
  const have = { pine: [], broad: [] }; for (const k of Object.keys(buckets)) { const g = VARIANTS[k][2]; if (have[g]) have[g].push(k); }
  const cand = [];
  if (dynCap > 0) rest2.forEach((t, i) => { const g = VARIANTS[t.ki][2], h = have[g]; if (h && h.length && t.d > 1.5) { t.kr = h[(i * 2654435761 >>> 0) % h.length]; cand.push(t); } });
  const need = {}; for (const t of cand) need[t.kr] = (need[t.kr] || 0) + 1;
  const meshes = [], R = {};   // R[k] = { n: fixed count, act: [tree...], parts: [{ im, leaf }] }
  for (const [k, list] of Object.entries(buckets)) {
    const room = Math.min(dynCap, need[k] || 0), capN = list.length + room;
    R[k] = { n: list.length, act: [], parts: [] };
    for (const p of V[k].parts) {
      if (p.skip) continue;
      const im = new THREE.InstancedMesh(p.geometry, p.material, capN);
      list.forEach((m, i) => { im.setMatrixAt(i, m); if (p.leaf) im.setColorAt(i, leafTint(i, VARIANTS[k][2] !== 'pine')); });
      if (p.leaf && room) for (let i = list.length; i < capN; i++) im.setColorAt(i, leafTint(i, VARIANTS[k][2] !== 'pine'));
      im.count = list.length;
      im.castShadow = !!Q.shadows && (Q.level === 'high' || Q.level === 'ultra'); im.receiveShadow = true;
      if (room) im.frustumCulled = false; else im.computeBoundingSphere();
      scene.add(im); meshes.push(im); R[k].parts.push({ im, leaf: p.leaf });
    }
  }
  const impM = {}, impO = {};
  for (const [k, list] of Object.entries(ib)) {
    const im = new THREE.InstancedMesh(imp[k].geometry, imp[k].material, list.length);
    list.forEach((m, i) => { im.setMatrixAt(i, m); im.setColorAt(i, leafTint(i + 11, VARIANTS[k][2] !== 'pine')); });
    im.receiveShadow = true; im.castShadow = false; im.computeBoundingSphere(); scene.add(im); meshes.push(im);
    impM[k] = im; impO[k] = im.instanceMatrix.array.slice();
  }
  const promote = (t) => {
    const r = R[t.kr], j = r.n + r.act.length; r.act.push(t); t.slot = j;
    for (const pt of r.parts) { pt.im.setMatrixAt(j, t.m); pt.im.count = r.n + r.act.length; pt.im.instanceMatrix.needsUpdate = true; if (pt.leaf && pt.im.instanceColor) pt.im.instanceColor.needsUpdate = true; }
    const a = impM[t.ki].instanceMatrix.array; a.fill(0, t.ii * 16, t.ii * 16 + 16); impM[t.ki].instanceMatrix.needsUpdate = true;
  };
  const demote = (t) => {
    const r = R[t.kr], j = t.slot, last = r.act.length - 1, mv = r.act[last];
    if (mv !== t) { r.act[j - r.n] = mv; mv.slot = j; for (const pt of r.parts) { pt.im.setMatrixAt(j, mv.m); pt.im.instanceMatrix.needsUpdate = true; } }
    r.act.pop(); t.slot = -1;
    for (const pt of r.parts) pt.im.count = r.n + r.act.length;
    const a = impM[t.ki].instanceMatrix.array; a.set(impO[t.ki].subarray(t.ii * 16, t.ii * 16 + 16), t.ii * 16); impM[t.ki].instanceMatrix.needsUpdate = true;
  };
  const lod = { cap: dynCap, active: () => cand.reduce((n, t) => n + (t.slot >= 0 ? 1 : 0), 0), pool: cand.length, last: 0, ticks: 0, swaps: 0 };
  const scored = [];
  // focus: the ground point the camera looks at; budget: at most `maxSwap` changes per tick (no hitch, no flurry of pops)
  lod.tick = (fx, fz, maxSwap = 6) => {
    if (!dynCap || !cand.length) return 0;
    lod.ticks++; scored.length = 0;
    const RIN = 150, RIN2 = RIN * RIN;
    for (const t of cand) { const dx = t.x - fx, dz = t.z - fz, d2 = dx * dx + dz * dz; if (d2 < RIN2 * 1.5) scored.push({ t, s: t.slot >= 0 ? d2 * 0.6 : d2, d2 }); }
    scored.sort((a, b) => a.s - b.s);
    const want = new Set(); for (let i = 0; i < scored.length && want.size < dynCap; i++) if (scored[i].d2 < RIN2) want.add(scored[i].t);
    let sw = 0;
    for (const t of cand) if (t.slot >= 0 && !want.has(t) && sw < maxSwap) { demote(t); sw++; }
    for (const t of want) if (t.slot < 0 && sw < maxSwap) {
      const r = R[t.kr]; if (r.act.length >= r.parts[0].im.instanceMatrix.count - r.n) continue;       // this variant's slots are full
      promote(t); sw++;
    }
    lod.swaps += sw; lod.last = sw; return sw;
  };
  lod.reset = () => { for (const t of cand) if (t.slot >= 0) demote(t); };
  // ground that must stay open for good (the deploy zone, the army camp, the muster field): those trees never come back as real ones
  lod.exclude = (inside) => { for (let i = cand.length - 1; i >= 0; i--) { const t = cand[i]; if (!inside(t.x, t.z)) continue; if (t.slot >= 0) demote(t); impO[t.ki].fill(0, t.ii * 16, t.ii * 16 + 16); cand.splice(i, 1); } lod.pool = cand.length; };
  return { meshes, lod, update(t) { U.uTime.value = t; }, count: { real: real.length, imp: rest.length } };
}
