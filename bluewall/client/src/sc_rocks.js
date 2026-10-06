// Countryside rocks (p22 "scatter"): believable boulders instead of flat-shaded dodecahedra.
//   geometry: a subdivided icosahedron pushed by low-frequency noise (lumps) and cut by a few fracture planes (the flat cleaved faces real
//             boulders have), smooth normals, the underside flattened and buried; per-vertex AO baked in the vertex colour (crevices + the
//             foot of the rock darker); UVs projected per face (no stretching) and scaled per instance in the shader (constant texel size).
//   material: the scanned moss-rock texture + normal map the terrain cliffs already use (no new texture), moss on the upward faces,
//             snow in winter, an earthy, grassy skirt where the rock meets the ground; optional ore glints (mines) in the gem colour.
// One InstancedMesh per shape kind. No shadow casters except where the caller asks (the mine boulders, as before).
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const lcg = (seed) => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };
const h3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
function vn(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz), L = (a, b, t) => a + (b - a) * t;
  return L(L(L(h3(ix, iy, iz), h3(ix + 1, iy, iz), u), L(h3(ix, iy + 1, iz), h3(ix + 1, iy + 1, iz), u), v),
    L(L(h3(ix, iy, iz + 1), h3(ix + 1, iy, iz + 1), u), L(h3(ix, iy + 1, iz + 1), h3(ix + 1, iy + 1, iz + 1), u), v), w);
}
const fbm = (x, y, z, o = 3) => { let a = 0, w = 0.5, f = 1, t = 0; for (let i = 0; i < o; i++) { a += w * vn(x * f, y * f, z * f); t += w; f *= 2.03; w *= 0.5; } return a / t; };

// shape kinds: rounded cleaved boulder, flat tilted slab, tall angular crag, small stone (satellites, ore heaps)
const KIND = {
  boulder: { cuts: 5, d0: 0.52, d1: 0.84, sy: 0.74, sz: 0.86, lump: 0.2, block: 0.15 },
  slab: { cuts: 4, d0: 0.42, d1: 0.76, sy: 0.46, sz: 0.78, lump: 0.13, block: 0.35 },
  crag: { cuts: 6, d0: 0.5, d1: 0.8, sy: 1.0, sz: 0.74, lump: 0.18, block: 0.5 },
  stone: { cuts: 4, d0: 0.5, d1: 0.8, sy: 0.62, sz: 0.8, lump: 0.22, block: 0.2 },
};

// unit rock: ~2 m across (x), origin on the ground line with about a fifth of it buried; colour = baked AO
export function rockGeometry(seed, detail = 2, kind = 'boulder') {
  const K = KIND[kind] || KIND.boulder, R = lcg(seed * 7919 + 13), off = R() * 97;
  let g = new THREE.IcosahedronGeometry(1, detail); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g);
  const P = g.attributes.position, n = P.count, v = new THREE.Vector3(), cuts = [];
  for (let i = 0; i < K.cuts; i++) {
    const a = R() * 6.283, y = i === 0 ? 0.75 + R() * 0.25 : -0.2 + R() * 1.0, r = Math.sqrt(Math.max(0, 1 - y * y));
    cuts.push([Math.cos(a) * r, y, Math.sin(a) * r, K.d0 + R() * (K.d1 - K.d0)]);
  }
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(P, i);
    v.multiplyScalar(1 + K.block * (1 / Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)) - 1) * 0.6);      // towards a rounded block
    v.multiplyScalar(1 + K.lump * (fbm(v.x * 1.3 + off, v.y * 1.3, v.z * 1.3 - off, 3) - 0.5) * 2);
    for (const c of cuts) { const s = v.x * c[0] + v.y * c[1] + v.z * c[2] - c[3]; if (s > 0) { const k = s * 0.9; v.x -= c[0] * k; v.y -= c[1] * k; v.z -= c[2] * k; } }
    v.multiplyScalar(1 + 0.05 * (vn(v.x * 4.7 + off, v.y * 4.7, v.z * 4.7) - 0.5) * 2);
    v.y *= K.sy; v.z *= K.sz;
    if (v.y < 0) v.y *= 0.4;
    P.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeBoundingBox();
  const bb = g.boundingBox, H = bb.max.y - bb.min.y, k = 2 / Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z);
  g.translate(-(bb.max.x + bb.min.x) / 2, -(bb.min.y + H * 0.2), -(bb.max.z + bb.min.z) / 2); g.scale(k, k, k);
  g.computeVertexNormals();
  // AO: crevices (the vertex sits below the mean of its neighbours) + the foot of the rock
  const idx = g.index.array, sum = new Float32Array(n * 3), cnt = new Float32Array(n), N = g.attributes.normal;
  for (let t = 0; t < idx.length; t += 3) for (let e = 0; e < 3; e++) { const a = idx[t + e], b = idx[t + (e + 1) % 3]; for (let j = 0; j < 3; j++) { sum[a * 3 + j] += P.array[b * 3 + j]; sum[b * 3 + j] += P.array[a * 3 + j]; } cnt[a]++; cnt[b]++; }
  const col = new Float32Array(n * 3), top = (bb.max.y - bb.min.y - H * 0.2) * k;
  for (let i = 0; i < n; i++) {
    const px = P.getX(i), py = P.getY(i), pz = P.getZ(i), c = cnt[i] || 1;
    const dx = sum[i * 3] / c - px, dy = sum[i * 3 + 1] / c - py, dz = sum[i * 3 + 2] / c - pz, el = Math.hypot(dx, dy, dz) + 1e-4;
    const cav = (N.getX(i) * dx + N.getY(i) * dy + N.getZ(i) * dz) / el;                       // > 0: concave
    const hk = Math.min(1, Math.max(0, py / Math.max(0.2, top * 0.55)));
    const ao = Math.min(1.1, Math.max(0.45, 1 - cav * 1.1)) * (0.55 + 0.45 * Math.pow(hk, 0.7));
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = ao;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  // flat per-face projections (dominant axis of the face): no smeared texels across a seam
  const ng = g.toNonIndexed(), p2 = ng.attributes.position, uv = new Float32Array(p2.count * 2), S = 0.32;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c3 = new THREE.Vector3();
  for (let i = 0; i < p2.count; i += 3) {
    a.fromBufferAttribute(p2, i); b.fromBufferAttribute(p2, i + 1); c3.fromBufferAttribute(p2, i + 2);
    const fn = b.clone().sub(a).cross(c3.clone().sub(a)), ax = Math.abs(fn.x), ay = Math.abs(fn.y), az = Math.abs(fn.z);
    for (let j = 0; j < 3; j++) {
      const x = p2.getX(i + j), y = p2.getY(i + j), z = p2.getZ(i + j);
      const [u, w] = ay >= ax && ay >= az ? [x, z] : ax >= az ? [z, y] : [x, y];
      uv[(i + j) * 2] = u * S; uv[(i + j) * 2 + 1] = w * S;
    }
  }
  ng.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  ng.computeBoundingSphere();
  g.dispose();
  return ng;
}

// Taste switch (one constant): 'moss' (default: grey stone with lichen and moss on top), 'granite' (cool clean grey, little moss),
// 'sand' (warm weathered stone). All use the scanned moss-rock texture the terrain cliffs already load (no new texture).
export const ROCK_LOOK = 'moss';
const LOOKS = {
  moss: { map: 'ph_mossrock', n: 'ph_mossrock_n', color: 0xe4e4df, moss: 1 },
  granite: { map: 'ph_mossrock', n: 'ph_mossrock_n', color: 0xc9cfd9, moss: 0.15 },
  sand: { map: 'ph_mossrock', n: 'ph_mossrock_n', color: 0xf6d8b4, moss: 0.25 },
};
// opts: { snow: 0..1, moss: 0..1, glint: bool (aGlint colour: ore sparkles), merged: bool (a baked pile: height above ground from aHg), mossCol, skirt, look }
export function rockMaterial(T, opts = {}) {
  const LK = LOOKS[opts.look || ROCK_LOOK] || LOOKS.moss;
  const map = T && (T[LK.map] || T.ph_mossrock || T.ph_rock), nmap = T && (T[LK.n] || T.ph_mossrock_n);
  const mat = new THREE.MeshStandardMaterial({ map: map || null, normalMap: nmap || null, normalScale: new THREE.Vector2(1.4, 1.4), vertexColors: true, roughness: 0.92, metalness: 0, envMapIntensity: 0.5, color: opts.color ?? LK.color });
  mat.name = 'sc_rock';
  const U = { uSnow: { value: opts.snow || 0 }, uMoss: { value: (opts.moss ?? 1) * LK.moss }, uMossCol: { value: new THREE.Color(opts.mossCol ?? 0x4a5f2a) },          // (ColorManagement: the sRGB hex becomes linear by itself)
    uSkirt: { value: new THREE.Color(opts.skirt ?? 0x4d5a2c) }, uGlintT: { value: 0 } };
  mat.userData.U = U;
  const glint = !!opts.glint, merged = !!opts.merged;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nvarying float vUp; varying float vHg; varying vec3 vRp;${glint ? '\nattribute vec3 aGlint; varying vec3 vGlint;' : ''}${merged ? '\nattribute float aHg;' : ''}`)
      .replace('#include <uv_vertex>', `#include <uv_vertex>
#ifdef USE_INSTANCING
  { float iS = length(instanceMatrix[0].xyz); vec2 iO = fract(instanceMatrix[3].xz * 0.0173) * 9.0;
  #ifdef USE_MAP
    vMapUv = vMapUv * iS + iO;
  #endif
  #ifdef USE_NORMALMAP
    vNormalMapUv = vNormalMapUv * iS + iO;
  #endif
  }
#endif`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
#ifdef USE_INSTANCING
  vUp = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal).y;
#else
  vUp = normalize(mat3(modelMatrix) * objectNormal).y;
#endif`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
  { vec4 sw = instanceMatrix * vec4(transformed, 1.0); vHg = sw.y - instanceMatrix[3][1]; vRp = sw.xyz; }
#else
  vHg = ${merged ? 'aHg' : 'transformed.y'}; vRp = (modelMatrix * vec4(transformed, 1.0)).xyz;
#endif${glint ? '\n  vGlint = aGlint;' : ''}`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uSnow, uMoss, uGlintT; uniform vec3 uMossCol, uSkirt; varying float vUp; varying float vHg; varying vec3 vRp;${glint ? '\nvarying vec3 vGlint;' : ''}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  {
    float lum = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15));
    float mk = smoothstep(0.38, 0.86, vUp) * uMoss * smoothstep(0.02, 0.1, lum);
    diffuseColor.rgb = mix(diffuseColor.rgb, uMossCol * (0.35 + 1.5 * lum), mk * 0.5);
    float sk = 1.0 - smoothstep(0.0, 0.42, vHg);
    diffuseColor.rgb = mix(diffuseColor.rgb, uSkirt * (0.55 + 1.2 * lum), sk * 0.6);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.84, 0.88, 0.93), uSnow * smoothstep(0.5, 0.82, vUp + (lum - 0.2) * 0.8));     // (snow lies on the flatter tops, broken up by the stone's grain)
  }`);
    if (glint) {
      // ore: a few veins (sparse bands of low-frequency noise) in the gem's colour, studded with crystals that twinkle and glow at night
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
float scH(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float scN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(scH(i), scH(i + vec3(1, 0, 0)), f.x), mix(scH(i + vec3(0, 1, 0)), scH(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(scH(i + vec3(0, 0, 1)), scH(i + vec3(1, 0, 1)), f.x), mix(scH(i + vec3(0, 1, 1)), scH(i + vec3(1, 1, 1)), f.x), f.y), f.z); }`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  {
    // ore-rich patches (a quarter of the surface), darker and tinted; inside them small crystals that catch the light and twinkle
    float orePatch = smoothstep(0.56, 0.7, scN(vRp * 0.42 + 7.3)) * step(0.01, dot(vGlint, vec3(1.0)));
    vec3 q = vRp * 1.8; vec3 cq = floor(q); vec3 fq = fract(q) - 0.5;
    float hsh = scH(cq);
    float d = length(fq + (vec3(fract(hsh * 7.1), fract(hsh * 13.3), fract(hsh * 3.7)) - 0.5) * 0.45);
    float spark = orePatch * step(0.55, hsh) * (1.0 - smoothstep(0.1, 0.22, d));
    float tw = 0.55 + 0.45 * sin(uGlintT * 2.1 + hsh * 40.0);
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * (0.4 + 0.8 * normalize(vGlint + 0.001)), orePatch * 0.55);
    diffuseColor.rgb = mix(diffuseColor.rgb, vGlint, spark * 0.85);
    totalEmissiveRadiance += vGlint * spark * tw * 1.2;
  }`);
    }
  };
  mat.customProgramCacheKey = () => 'sc_rock' + (glint ? 'g' : '') + (merged ? 'm' : '');
  return mat;
}

// kinds: [{ geo, list: [Matrix4], colors?: [Color], glint?: [Color] }] -> one InstancedMesh each
export function rockMeshes(scene, mat, kinds, { cast = false, receive = true, name = 'sc_rocks' } = {}) {
  const out = [];
  for (const k of kinds) {
    if (!k.list.length) continue;
    const im = new THREE.InstancedMesh(k.geo, mat, k.list.length); im.name = name;
    k.list.forEach((m, i) => im.setMatrixAt(i, m));
    if (k.colors) k.colors.forEach((c, i) => im.setColorAt(i, c));
    if (k.glint) { const a = new Float32Array(k.list.length * 3); k.glint.forEach((c, i) => { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }); im.geometry = k.geo.clone(); im.geometry.setAttribute('aGlint', new THREE.InstancedBufferAttribute(a, 3)); }
    im.castShadow = cast; im.receiveShadow = receive; im.computeBoundingSphere();
    scene.add(im); out.push(im);
  }
  return out;
}

// a natural tint for one rock: cool / warm greys, some darker
export function rockTint(r, c = new THREE.Color()) {
  const t = r();
  return t < 0.45 ? c.setRGB(0.92 + r() * 0.1, 0.93 + r() * 0.1, 0.95 + r() * 0.08) : t < 0.8 ? c.setRGB(1.0 + r() * 0.06, 0.95 + r() * 0.05, 0.86 + r() * 0.06) : c.setRGB(0.72 + r() * 0.1, 0.74 + r() * 0.1, 0.74 + r() * 0.1);
}

// ---------------------------------------------------------------- the countryside kit
// One kit per world: buildForest() fills it with the rock groups of the open country, scatterFlora() adds the meadow rocks near the
// castle and finally builds it (one InstancedMesh per kind; every instance is in the `scatter` list the battle clears zones from).
export const ROCKS = { kit: null };
const KINDS = ['boulder', 'crag', 'stone'];                    // (a slab is a flattened boulder: one draw call less)
export function rockKit(T, Q, { snow = 0 } = {}) {
  const low = Q.level === 'low', det = low ? 1 : 2;
  const geo = { boulder: rockGeometry(3, det, 'boulder'), crag: rockGeometry(12, det, 'crag'), stone: rockGeometry(5, 1, 'stone') };
  const mat = rockMaterial(T, { snow });
  const L0 = Object.fromEntries(KINDS.map((k) => [k, { list: [], colors: [] }]));
  const bases = [];                                             // { x, z, r } of the bigger rocks (the meadow grows a tuft at their foot)
  const kit = {
    mat, geo, bases,
    add(kind, m, c) { const k = L0[kind] ? kind : 'boulder'; L0[k].list.push(m); L0[k].colors.push(c.clone()); },
    build(scene) {
      if (kit.meshes) return kit.meshes;
      kit.meshes = rockMeshes(scene, mat, KINDS.map((k) => ({ geo: geo[k], list: L0[k].list, colors: L0[k].colors })), { cast: false, receive: true });
      return kit.meshes;
    },
  };
  ROCKS.kit = kit;
  return kit;
}

// a rock group: one main rock (kind by the ground: slabs and crags on slopes and up the mountains), 0-3 smaller stones half-buried around it.
// ok(x, z) -> may a rock stand here; height(x, z). s = main rock radius (m).
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
export function rockGroup(kit, r, x, z, s, height, ok, { kind = null, sats = -1, mountain = 0 } = {}) {
  const h = height(x, z), gx = height(x + 2, z) - height(x - 2, z), gz = height(x, z + 2) - height(x, z - 2), slope = Math.hypot(gx, gz) / 4;
  const k = kind || (slope > 0.45 || mountain > 0.5 ? (r() < 0.55 ? 'crag' : 'slab') : r() < 0.62 ? 'boulder' : r() < 0.6 ? 'slab' : 'crag');
  const sy = k === 'crag' ? 0.8 + r() * 0.5 : k === 'slab' ? 0.45 + r() * 0.2 : 0.75 + r() * 0.45;
  // lean with the slope (a rock settles into the hill), a little random tilt
  const rx = -Math.atan(gz / 4) * 0.7 + (r() - 0.5) * 0.18, rz = Math.atan(gx / 4) * 0.7 + (r() - 0.5) * 0.18;
  const sink = s * (0.08 + r() * 0.22) + slope * s * 0.35;
  _q.setFromEuler(_e.set(rx, r() * 6.283, rz, 'XZY'));             // (yaw first, then the world-frame lean)
  kit.add(k, new THREE.Matrix4().compose(_p.set(x, h - sink, z), _q, _s.set(s * (0.85 + r() * 0.3), s * sy, s * (0.85 + r() * 0.3))), rockTint(r, _c));
  kit.bases.push({ x, z, r: s });
  const n = sats >= 0 ? sats : (r() * (s > 1.6 ? 4 : 2.6)) | 0;
  for (let i = 0; i < n; i++) {
    const a = r() * 6.283, d = s * (1.0 + r() * 0.9), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
    if (!ok(px, pz)) continue;
    const ss = s * (0.16 + r() * 0.3), hh = height(px, pz);
    _q.setFromEuler(_e.set((r() - 0.5) * 0.6, r() * 6.283, (r() - 0.5) * 0.6, 'YXZ'));
    kit.add('stone', new THREE.Matrix4().compose(_p.set(px, hh - ss * (0.1 + r() * 0.25), pz), _q, _s.set(ss * (0.8 + r() * 0.4), ss * (0.7 + r() * 0.5), ss * (0.8 + r() * 0.4))), rockTint(r, _c));
  }
  return k;
}

// A baked pile (mines): pieces [{ geo, m: Matrix4, tint: Color, glint: Color|null, base: ground y }] merged into one static mesh — one draw call,
// culled on its own; UVs re-projected per face in world space (constant texel size), aHg = height above the piece's ground.
export function rockPile(pieces, mat) {
  let n = 0; for (const p of pieces) n += p.geo.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2), gl = new Float32Array(n * 3), hg = new Float32Array(n);
  const v = new THREE.Vector3(), nm = new THREE.Matrix3(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), S = 0.32;
  let o = 0;
  for (const p of pieces) {
    const P = p.geo.attributes.position, N = p.geo.attributes.normal, C = p.geo.attributes.color, cnt = P.count; nm.getNormalMatrix(p.m);
    for (let i = 0; i < cnt; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(p.m); pos.set([v.x, v.y, v.z], (o + i) * 3); hg[o + i] = v.y - p.base;
      v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.set([v.x, v.y, v.z], (o + i) * 3);
      const ao = C ? C.getX(i) : 1; col.set([ao * p.tint.r, ao * p.tint.g, ao * p.tint.b], (o + i) * 3);
      if (p.glint) gl.set([p.glint.r, p.glint.g, p.glint.b], (o + i) * 3);
    }
    for (let i = 0; i < cnt; i += 3) {
      a.fromArray(pos, (o + i) * 3); b.fromArray(pos, (o + i + 1) * 3); c.fromArray(pos, (o + i + 2) * 3);
      const fn = b.clone().sub(a).cross(c.clone().sub(a)), ax = Math.abs(fn.x), ay = Math.abs(fn.y), az = Math.abs(fn.z);
      for (let j = 0; j < 3; j++) { const k = (o + i + j) * 3, x = pos[k], y = pos[k + 1], z = pos[k + 2]; const [u, w] = ay >= ax && ay >= az ? [x, z] : ax >= az ? [z, y] : [x, y]; uv[(o + i + j) * 2] = u * S * 0.8; uv[(o + i + j) * 2 + 1] = w * S * 0.8; }
    }
    o += cnt;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aGlint', new THREE.BufferAttribute(gl, 3)); g.setAttribute('aHg', new THREE.BufferAttribute(hg, 1));
  g.computeBoundingSphere();
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'sc_pile'; mesh.matrixAutoUpdate = false;
  return mesh;
}
