// The enemy base of a battle, built from the simulation's building list (battlesim.js makeBase) and drawn in a handful of draw calls.
//   * every piece is merged per material; each vertex carries its building id (aB), so a tiny data texture (one texel per building) drives
//     the whole destruction in the vertex shader: lean, crumble (every triangle drifts away on its own), sink to a rubble heap, char and flash
//   * the pieces wear the tier skin of the enemy's level (skin.js: wood -> stone -> iron -> gold -> diamond -> crystal), exactly like the home castle
//   const base = buildBase({ scene, M, base: sim.base, levels: {keep, wall, towers}, seed });  base.set(id, { collapse, dmg, flash });  base.flush();
import * as THREE from 'three';
import { worldUV } from './util.js';
import { applySkin, ENT, setEntityLevel } from './skin.js';
import { crystalGeometry, gemMaterial } from './gemgeo.js';
import { mulberry } from './battlesim.js';

const BOX = new THREE.BoxGeometry(1, 1, 1), Y = new THREE.Vector3(0, 1, 0);
const CYL = (rt, rb, h, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s);
const CONE = (r, h, s = 10) => new THREE.ConeGeometry(r, h, s);
const _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();

// ---------------------------------------------------------------- destruction shader patch
const PARS = `attribute float aB; uniform sampler2D uBS; varying float vDm; varying float vFl; varying float vCo;`;
const COLLAPSE = `{
  ivec2 bi = ivec2(int(aB + 0.5), 0);
  vec4 s0 = texelFetch(uBS, bi, 0), s1 = texelFetch(uBS, ivec2(bi.x, 1), 0);
  vDm = s0.y; vFl = s0.z; vCo = s0.x;
  float cp = s0.x;
  if (cp > 0.0) {
    float tri = floor(float(gl_VertexID) / 3.0);
    float h1 = fract(sin(tri * 12.9898 + s0.w * 78.233) * 43758.5453), h2 = fract(sin(tri * 39.346 + s0.w * 11.135) * 24634.6345);
    vec2 cen = s1.xy; float H = s1.z, ec = cp * cp * (3.0 - 2.0 * cp);
    float yr = transformed.y;
    vec2 dirL = vec2(cos(s0.w * 6.2831), sin(s0.w * 6.2831));
    transformed.xz += dirL * yr * 0.22 * min(1.0, cp * 2.5);
    vec2 away = transformed.xz - cen; float al = length(away); away = al > 1e-3 ? away / al : vec2(1.0, 0.0);
    transformed.xz += away * (h1 * 0.6 + 0.15) * ec * (2.5 + H * 0.22) * (0.2 + h2);
    transformed.y = max(0.0, yr * (1.0 - 0.9 * ec) - h2 * ec * 0.6);
  }
}`;
const FRAG = `diffuseColor.rgb *= (1.0 - 0.55 * clamp(vDm, 0.0, 1.0)) * (1.0 - 0.7 * vCo);`;
function patchDestruct(mat, U) {
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    sh.uniforms.uBS = U.bs;
    let v = sh.vertexShader.replace('#include <common>', '#include <common>\n' + PARS);
    v = v.includes('float skLv = uLv[') ? v.replace('float skLv = uLv[', COLLAPSE + '\nfloat skLv = uLv[') : v.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + COLLAPSE);
    sh.vertexShader = v;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vDm; varying float vFl; varying float vCo;')
      .replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\n' + FRAG)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.6, 0.3) * vFl * 0.26;');
  };
  mat.customProgramCacheKey = () => prevKey() + '|bwdestr';
  mat.needsUpdate = true; return mat;
}

// ---------------------------------------------------------------- merge by material, with per-vertex building id + tier tag
class Merge {
  constructor() { this.groups = new Map(); this.bid = 0; this.ent = 0; this.min = 1; }
  add(geo, mat, matrix, { tint = 0xffffff, uv = 0, uvScale = null, keepColor = false } = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k) && !(keepColor && k === 'color')) g.deleteAttribute(k);
    const src = keepColor && g.attributes.color ? g.attributes.color.array : null;
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (uvScale) { const t = g.attributes.uv; for (let i = 0; i < t.count; i++) t.setXY(i, t.getX(i) * uvScale[0], t.getY(i) * uvScale[1]); }
    g.applyMatrix4(matrix); if (uv) worldUV(g, uv);
    const n = g.attributes.position.count, col = new Float32Array(n * 3), tg = new Float32Array(n * 2), ab = new Float32Array(n);
    _c.set(tint).convertSRGBToLinear();
    for (let i = 0; i < n; i++) { col[i * 3] = _c.r * (src ? src[i * 3] : 1); col[i * 3 + 1] = _c.g * (src ? src[i * 3 + 1] : 1); col[i * 3 + 2] = _c.b * (src ? src[i * 3 + 2] : 1); tg[i * 2] = this.ent; tg[i * 2 + 1] = this.min; ab[i] = this.bid; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aTag', new THREE.BufferAttribute(tg, 2)); g.setAttribute('aB', new THREE.BufferAttribute(ab, 1));
    let list = this.groups.get(mat); if (!list) this.groups.set(mat, (list = [])); list.push(g);
  }
  build(parent, { receive = true } = {}) {
    const out = [];
    for (const [mat, list] of this.groups) {
      const merged = mergeGeoms(list); merged.computeBoundingSphere();
      const m = new THREE.Mesh(merged, mat); m.frustumCulled = false; m.receiveShadow = receive; m.castShadow = false; m.name = 'bbase'; parent.add(m); out.push(m);
      list.forEach((g) => g.dispose());
    }
    this.groups.clear(); return out;
  }
}
function mergeGeoms(list) {                                                    // all non-indexed with identical attributes
  const names = ['position', 'normal', 'uv', 'color', 'aTag', 'aB'], out = new THREE.BufferGeometry();
  for (const nm of names) {
    const k = list[0].attributes[nm].itemSize; let total = 0; for (const g of list) total += g.attributes[nm].count;
    const arr = new Float32Array(total * k); let o = 0; for (const g of list) { arr.set(g.attributes[nm].array, o); o += g.attributes[nm].array.length; }
    out.setAttribute(nm, new THREE.BufferAttribute(arr, k));
  }
  return out;
}

// ---------------------------------------------------------------- the base
export function buildBase({ scene, M, base, levels, seed = 1, onSmoke }) {
  const R = mulberry(seed ^ 0x51ed), B = base.buildings, nB = B.length + 1, U = { bs: { value: null } };
  const data = new Float32Array(nB * 4 * 2), tex = new THREE.DataTexture(data, nB, 2, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true; U.bs.value = tex;
  // tier of every structure: the keep sets the pace, walls / towers have their own level, the rest trail by one
  const lv = { keep: levels.keep, wall: levels.wall, towers: levels.towers }, rest = Math.max(1, levels.keep - 1);
  const saved = {}; for (const k of Object.keys(ENT)) if (ENT[k] > 0) saved[k] = null;
  const setLv = (id, v) => setEntityLevel(id, v);
  setLv('keep', lv.keep); setLv('wall', lv.wall); setLv('townwall', lv.wall); setLv('towers', lv.towers);
  for (const k of ['vault_ruby', 'vault_emerald', 'vault_turq', 'mine_ruby', 'mine_emerald', 'mine_turq', 'barracks', 'forge', 'stable', 'training', 'lair', 'workshop']) setLv(k, rest);

  const mk = (src, role, tintMul) => { const m = src.clone(); m.userData = {}; if (role != null) applySkin(m, role); return patchDestruct(m, U); };
  const MT = { stone: mk(M.stone, 0), base: mk(M.stoneDark, 1), roof: mk(M.roof, 2), gold: mk(M.gold, 3), rune: mk(M.rune, 4), wood: mk(M.woodLight, null), dark: mk(M.dark, null), cloth: mk(M.cloth, null), metal: mk(M.metal, null), plast: mk(M.plaster, null) };
  const GM = {}; for (const g of ['ruby', 'emerald', 'turq']) { const m = gemMaterial(g, { envMapIntensity: 1.3, glow: 0.35 }).clone(); GM[g] = patchDestruct(m, U); }
  const ctx = new Merge(), group = new THREE.Group(); group.name = 'enemyBase'; scene.add(group);
  const mt = (b, x, y, z, sx = 1, sy = 1, sz = 1, ry = 0, rx = 0) => {
    const c = Math.cos(b.rot), s = Math.sin(b.rot);
    _p.set(b.x + x * c + z * s, y, b.z - x * s + z * c); _q.setFromEuler(new THREE.Euler(rx, b.rot + ry, 0, 'YXZ')); _s.set(sx, sy, sz); return new THREE.Matrix4().compose(_p, _q, _s);
  };
  const SU = { uv: 0.1 };
  const wall = (b, x, y, z, sx, sy, sz, tint = 0xe4e6ee) => ctx.add(BOX, MT.stone, mt(b, x, y, z, sx, sy, sz), { ...SU, tint });
  const basec = (b, x, y, z, sx, sy, sz, tint = 0xcfd2da) => ctx.add(BOX, MT.base, mt(b, x, y, z, sx, sy, sz), { ...SU, tint });
  const wood = (b, x, y, z, sx, sy, sz, tint = 0x9a7048, ry = 0) => ctx.add(BOX, MT.wood, mt(b, x, y, z, sx, sy, sz, ry), { uv: 0.25, tint });
  const dark = (b, x, y, z, sx, sy, sz) => ctx.add(BOX, MT.dark, mt(b, x, y, z, sx, sy, sz), { tint: 0x2a2018 });
  const goldb = (b, x, y, z, sx, sy, sz) => ctx.add(BOX, MT.gold, mt(b, x, y, z, sx, sy, sz), {});
  const cyl = (mat, b, x, y, z, rt, rb, h, seg = 14, tint = 0xe4e6ee, o = {}) => ctx.add(CYL(rt, rb, h, seg), mat, mt(b, x, y, z), { uv: 0.1, tint, ...o });
  const cone = (mat, b, x, y, z, r, h, seg = 12, tint = 0x4d6fae, o = {}) => ctx.add(CONE(r, h, seg), mat, mt(b, x, y, z), { tint, uvScale: [3, 2], ...o });
  const roof = (b, x, y, z, w, d, h, over = 0.7, ry = 0) => ctx.add(gableGeo(w, d, h, over), MT.roof, mt(b, x, y, z, 1, 1, 1, ry), { uvScale: [1.4, 1.2], tint: 0x4d6fae });
  const cloth = (b, x, y, z, w, h, tint = 0xc02a2a) => ctx.add(BOX, MT.cloth, mt(b, x, y, z, w, h, 0.06), { tint });

  const rec = {
    wall(b) {
      const L = b.w, h = b.h, d = b.d; ctx.ent = ENT.wall;
      basec(b, 0, 0.55, 0, L + 0.3, 1.1, d + 0.7); wall(b, 0, h / 2, 0, L, h, d); basec(b, 0, h + 0.2, 0, L + 0.4, 0.45, d + 1.0, 0xe6e8f0);
      const n = Math.max(2, Math.round(L / 2.3)); for (let i = 0; i < n; i++) for (const sd of [-1, 1]) wall(b, -L / 2 + (i + 0.5) * (L / n), h + 1.3, sd * (d / 2 + 0.3), (L / n) * 0.58, 1.4, 0.7);
    },
    gate(b) {
      rec.wall(b);                                                              // wing walls over the whole edge, gatehouse in the middle
      const h = b.h + 2.6, d = b.d + 1.2; ctx.ent = ENT.wall;
      for (const e of [-1, 1]) { wall(b, e * 3.7, h / 2, 0, 2.6, h, d, 0xdcdee6); basec(b, e * 3.7, h + 0.3, 0, 3.4, 0.6, d + 0.8); for (const k of [-1, 0, 1]) wall(b, e * 3.7 + k * 1.1, h + 1.2, d / 2 + 0.1, 0.8, 1.3, 0.6); }
      wall(b, 0, h - 1.4, 0, 5.2, 2.6, d, 0xdcdee6); goldb(b, 0, h - 0.05, d / 2 + 0.1, 5.4, 0.3, 0.3);
      ctx.ent = 0; wood(b, 0, 3.4, d / 2 - 0.3, 4.6, 6.4, 0.5, 0x5a3c22); dark(b, 0, 3.4, d / 2 - 0.45, 4.2, 6.0, 0.3);
      for (const k of [-1.6, 0, 1.6]) wood(b, k, 3.4, d / 2 - 0.02, 0.18, 6.2, 0.2, 0x2a2018);
      ctx.ent = ENT.wall; for (const e of [-1, 1]) { cyl(MT.wood, b, e * 3.7, h + 3.2, 0, 0.07, 0.09, 4, 5, 0x6b4a30, { uv: 0 }); cloth(b, e * 3.7 + e * 0.5, h + 4.3, 0, 1.0, 1.6); }
    },
    tower(b, ballista = false) {
      const h = b.h, r = 2.5; ctx.ent = ENT.towers;
      cyl(MT.base, b, 0, 0.7, 0, r + 0.6, r + 0.9, 1.4, 16, 0xcfd2da); cyl(MT.stone, b, 0, h / 2, 0, r, r + 0.15, h, 16);
      cyl(MT.base, b, 0, h + 0.2, 0, r + 0.9, r + 0.5, 0.6, 16, 0xe6e8f0);
      for (let k = 0; k < 9; k++) { const a = (k / 9) * 6.283, x = Math.cos(a) * (r + 0.55), z = Math.sin(a) * (r + 0.55); ctx.add(BOX, MT.stone, mt(b, x, h + 1.4, z, 1.3, 1.5, 0.8, -a + Math.PI / 2), { ...SU, tint: 0xe4e6ee }); }
      for (const a of [0.8, 2.4, 4.0, 5.5]) dark(b, Math.cos(a) * r * 0.98, h * 0.62, Math.sin(a) * r * 0.98, 0.5, 1.5, 0.5);
      if (!ballista) { cone(MT.roof, b, 0, h + 3.6, 0, r + 1.2, 4.6, 14); goldb(b, 0, h + 6.4, 0, 0.18, 1.6, 0.18); ctx.ent = 0; cloth(b, 0.7, h + 6.7, 0, 1.4, 0.8); }
      else {                                                                     // open platform with the ballista
        ctx.ent = 0; wood(b, 0, h + 1.2, 0, 3.4, 0.4, 1.3, 0x6b4a30); wood(b, 0, h + 1.9, 0.9, 0.5, 1.5, 0.5, 0x6b4a30);
        for (const e of [-1, 1]) ctx.add(BOX, MT.metal, mt(b, e * 1.6, h + 2.5, 0.6, 0.35, 0.3, 2.6, 0.5 * e), { tint: 0x9aa2b0 });
        ctx.add(BOX, MT.metal, mt(b, 0, h + 2.45, 1.4, 0.18, 0.18, 3.6), { tint: 0xc0c8d4 });
      }
    },
    keep(b) {
      const w = b.w, d = b.d, h = b.h; ctx.ent = ENT.keep;
      basec(b, 0, 1.0, 0, w + 1.6, 2.0, d + 1.6); wall(b, 0, 2 + h * 0.3, 0, w, h * 0.6, d, 0xe0e2ea); basec(b, 0, 2 + h * 0.6 + 0.2, 0, w + 0.8, 0.5, d + 0.8);
      wall(b, 0, 2.5 + h * 0.6 + h * 0.18, 0, w * 0.72, h * 0.36, d * 0.72, 0xe6e8f0); basec(b, 0, 2.6 + h * 0.96, 0, w * 0.72 + 0.8, 0.5, d * 0.72 + 0.8);
      cone(MT.roof, b, 0, 3.4 + h * 0.96 + 3.4, 0, w * 0.5, 6.8, 4, 0x4d6fae, { uvScale: [3, 2] });
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { cyl(MT.stone, b, sx * w * 0.5, h * 0.5 + 1.5, sz * d * 0.5, 1.5, 1.7, h * 0.95, 14); cone(MT.roof, b, sx * w * 0.5, h * 0.95 + 4.2, sz * d * 0.5, 2.1, 3.6, 12); }
      goldb(b, 0, 2 + h * 0.6 + 0.65, d / 2 + 0.45, w + 0.2, 0.3, 0.3); ctx.add(BOX, MT.rune, mt(b, 0, 2 + h * 0.3, d / 2 + 0.05, w * 0.6, 0.7, 0.2), { uvScale: [3, 1] });
      for (const e of [-1, 1]) for (const k of [0.25, 0.5]) dark(b, e * w * 0.28, 2 + h * k, d / 2 + 0.05, 1.1, 2.0, 0.3);
      ctx.ent = 0; dark(b, 0, 3.4, d / 2 + 0.05, 3.2, 5.4, 0.35); wood(b, 0, 3.4, d / 2 + 0.2, 3.0, 5.0, 0.2, 0x4a3220);
      cloth(b, -w * 0.28, h * 0.62, d / 2 + 0.6, 1.4, 4.2); cloth(b, w * 0.28, h * 0.62, d / 2 + 0.6, 1.4, 4.2);
      cyl(MT.wood, b, 0, 3.4 + h * 0.96 + 7.2, 0, 0.1, 0.12, 3.6, 5, 0x6b4a30, { uv: 0 }); cloth(b, 0.9, 3.4 + h * 0.96 + 8.6, 0, 1.8, 1.0);
    },
    vault(b) {
      const w = b.w, d = b.d, h = b.h; ctx.ent = ENT['vault_' + b.gem];
      basec(b, 0, 0.7, 0, w + 0.8, 1.4, d + 0.8); wall(b, 0, 1.4 + h * 0.4, 0, w, h * 0.8, d, 0xdcdee6); basec(b, 0, 1.4 + h * 0.8 + 0.25, 0, w + 0.9, 0.5, d + 0.9); roof(b, 0, 1.4 + h * 0.8 + 0.5, 0, w + 0.4, d, 2.6, 0.5);
      goldb(b, 0, 1.4 + h * 0.5, d / 2 + 0.05, w * 0.9, 0.25, 0.25); ctx.ent = 0; dark(b, 0, 2.8, d / 2 + 0.05, 2.6, 3.8, 0.3); wood(b, 0, 2.8, d / 2 + 0.15, 2.4, 3.6, 0.15, 0x3a2a1c);
      const g = crystalGeometry(b.gem); ctx.add(g, GM[b.gem], mt(b, 0, h + 4.2, 0, 1.5, 1.7, 1.5), { keepColor: true });
    },
    mine(b) {
      const w = b.w, h = b.h; ctx.ent = ENT['mine_' + b.gem];
      basec(b, 0, 0.5, 0, w + 0.6, 1.0, b.d + 0.6, 0x9a9690);
      wall(b, 0, h * 0.4 + 0.5, -1.0, w, h * 0.8, b.d - 2, 0xb0aca4); ctx.add(CONE(w * 0.62, h * 0.9, 7), MT.base, mt(b, 0, h * 0.45 + 1.4, -1.6), { uv: 0.12, tint: 0x8a867e });
      ctx.ent = 0; dark(b, 0, 2.2, b.d / 2 - 0.9, 2.6, 3.6, 1.2); for (const e of [-1, 1]) wood(b, e * 1.6, 2.4, b.d / 2 - 0.9, 0.4, 4.2, 0.4, 0x7a5a3a); wood(b, 0, 4.4, b.d / 2 - 0.9, 3.8, 0.4, 0.5, 0x7a5a3a);
      for (const [x, z, s] of [[-2.2, 2.2, 0.9], [2.4, 1.4, 1.2], [0.8, 3.2, 0.7]]) ctx.add(crystalGeometry(b.gem), GM[b.gem], mt(b, x, 1.2 + s * 0.6, z, s, s * 1.2, s), { keepColor: true });
    },
    barracks(b) {
      const w = b.w, d = b.d, h = b.h; ctx.ent = ENT.barracks;
      basec(b, 0, 0.5, 0, w + 0.8, 1.0, d + 0.8); wall(b, 0, h * 0.5 + 0.8, 0, w, h * 0.8, d, 0xd8dae2); roof(b, 0, h * 0.8 + 0.8, 0, w, d, 3.2, 0.7);
      ctx.ent = 0; dark(b, 0, 2.2, d / 2 + 0.05, 2.2, 3.4, 0.3); for (const e of [-3.2, 3.2]) dark(b, e, 3.3, d / 2 + 0.05, 1.0, 1.2, 0.3); cloth(b, w / 2 + 0.2, h * 0.7, 0.2, 0.06, 2.2);
    },
    forge(b) {
      const w = b.w, d = b.d, h = b.h; ctx.ent = ENT.forge;
      basec(b, 0, 0.3, 0, w + 0.6, 0.6, d + 0.6); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) wood(b, x * (w / 2 - 0.3), h * 0.45, z * (d / 2 - 0.3), 0.45, h * 0.9, 0.45, 0x7a5a3a);
      wall(b, 0, h * 0.4, -d / 2 + 0.3, w, h * 0.8, 0.6, 0xd4d6de); roof(b, 0, h * 0.9, 0, w, d, 2.2, 0.6);
      basec(b, -1.4, 1.7, -d / 2 + 1.2, 2.0, 2.8, 1.6, 0x8a8580); basec(b, -1.4, h + 1.4, -d / 2 + 0.9, 1.0, 3.6, 1.0, 0x7a7570);
      ctx.ent = 0; ctx.add(BOX, MT.metal, mt(b, 1.4, 0.95, 0.3, 1.4, 0.35, 0.8), { tint: 0x9aa2b0 }); wood(b, 1.4, 0.45, 0.3, 0.9, 0.9, 0.6, 0x5a3a22);
    },
    store(b) {
      const w = b.w, d = b.d, h = b.h; ctx.ent = ENT.townwall;
      basec(b, 0, 0.4, 0, w + 0.6, 0.8, d + 0.6); wall(b, 0, h * 0.5 + 0.4, 0, w, h * 0.8, d, 0xdcd6c8); roof(b, 0, h * 0.8 + 0.4, 0, w, d, 2.8, 0.6);
      ctx.ent = 0; dark(b, 0, 1.9, d / 2 + 0.05, 2.4, 2.8, 0.3); for (const [x, z] of [[-w / 2 - 0.9, 0.5], [-w / 2 - 0.9, -0.9], [w / 2 + 0.9, 0.3]]) wood(b, x, 0.7, z, 1.2, 1.2, 1.2, 0xb08a58);
    },
    house(b) {
      const w = b.w, d = b.d, h = b.h; ctx.ent = ENT.townwall; const tints = [0xe8dcc4, 0xd8e0e8, 0xe6d2c0, 0xd6d8c8], t = tints[b.id % 4];
      basec(b, 0, 0.35, 0, w + 0.4, 0.7, d + 0.4); wall(b, 0, h * 0.45 + 0.4, 0, w, h * 0.8, d, t); roof(b, 0, h * 0.8 + 0.4, 0, w, d, 2.4, 0.5, b.id % 2 ? 0 : Math.PI / 2);
      ctx.ent = 0; dark(b, 0, 1.4, d / 2 + 0.05, 1.1, 2.0, 0.3); dark(b, -w * 0.28, 3.0, d / 2 + 0.05, 0.9, 0.9, 0.3); dark(b, w * 0.28, 3.0, d / 2 + 0.05, 0.9, 0.9, 0.3);
    },
  };

  const smokers = [];
  B.forEach((b, i) => {
    ctx.bid = b.id; ctx.ent = 0; ctx.min = 1;
    const f = b.type === 'ballista' ? () => rec.tower(b, true) : rec[b.type];
    if (f) f(b); if (b.type === 'forge') smokers.push(b);
    const o = (b.id * 4); data[o] = 0; data[o + 1] = 0; data[o + 2] = 0; data[o + 3] = R();
    const o2 = nB * 4 + b.id * 4; data[o2] = b.x; data[o2 + 1] = b.z; data[o2 + 2] = b.h; data[o2 + 3] = 0;
  });
  const meshes = ctx.build(group);
  tex.needsUpdate = true;

  // courtyard ground (dust-coloured polygon inside the ring) + a cobbled road from the gate toward the army
  const R2 = base.radius;
  {
    const sh = new THREE.Shape(base.verts.map(([x, z]) => new THREE.Vector2(x, -z))), g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x9c8e70, roughness: 1 })); m.position.y = 0.06; m.receiveShadow = true; group.add(m);
  }
  let dirty = false;
  const api = {
    group, meshes, uniforms: U, texture: tex, smokers, radius: R2,
    set(id, { collapse, dmg, flash }) { const o = id * 4; if (collapse != null) data[o] = collapse; if (dmg != null) data[o + 1] = dmg; if (flash != null) data[o + 2] = flash; dirty = true; },
    get(id) { const o = id * 4; return { collapse: data[o], dmg: data[o + 1], flash: data[o + 2] }; },
    flush() { if (dirty) { tex.needsUpdate = true; dirty = false; } },
    dispose() { group.removeFromParent(); for (const m of meshes) m.geometry.dispose(); for (const k of Object.values(MT)) k.dispose(); tex.dispose(); },
  };
  return api;
}

function gableGeo(w, d, h, over = 0.6) {                                       // same prism as util.gableRoof, ridge along X, base at y = 0
  const W = w / 2 + over, D = d / 2 + over, v = [], uv = [], quad = (a, b, c, d2, ua, ub, uc, ud) => { v.push(...a, ...b, ...c, ...a, ...c, ...d2); uv.push(...ua, ...ub, ...uc, ...ua, ...uc, ...ud); }, slope = Math.hypot(D, h) / 3;
  quad([-W, 0, D], [W, 0, D], [W, h, 0], [-W, h, 0], [0, 0], [W * 2 / 3, 0], [W * 2 / 3, slope], [0, slope]); quad([W, 0, -D], [-W, 0, -D], [-W, h, 0], [W, h, 0], [0, 0], [W * 2 / 3, 0], [W * 2 / 3, slope], [0, slope]);
  v.push(-W + 0.35, 0, -D + 0.05, -W + 0.35, 0, D - 0.05, -W + 0.35, h - 0.05, 0); uv.push(0, 0, 1, 0, 0.5, 0.6); v.push(W - 0.35, 0, D - 0.05, W - 0.35, 0, -D + 0.05, W - 0.35, h - 0.05, 0); uv.push(0, 0, 1, 0, 0.5, 0.6);
  quad([-W, -0.01, -D], [W, -0.01, -D], [W, -0.01, D], [-W, -0.01, D], [0, 0], [1, 0], [1, 1], [0, 1]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
}
