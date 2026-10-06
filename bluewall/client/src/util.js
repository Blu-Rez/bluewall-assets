// Geometry helpers + a batcher that merges static pieces per material
// (few draw calls = smooth on phones).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { skinDepthMaterial } from './skin.js';
import { plainDepthMaterial } from './destruct.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
const _c = new THREE.Color();

export function mat4(x = 0, y = 0, z = 0, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  _q.setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
}

function normalize(geo) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  return g;
}

// box-projected UVs in world space (consistent brick size everywhere)
export function worldUV(g, scale) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (ay >= ax && ay >= az) uv.setXY(i, x * scale, z * scale);
    else if (ax >= az) uv.setXY(i, z * scale, y * scale);
    else uv.setXY(i, x * scale, y * scale);
  }
  uv.needsUpdate = true;
}

export class Batcher {
  // tagEnt / tagMin: which structure the next pieces belong to and from which level of it they are shown (skin.js); only skinned materials carry the tag
  constructor() { this.groups = new Map(); this.tagEnt = 0; this.tagMin = 1; this.tagB = 0; }
  tag(ent = 0, min = 1) { this.tagEnt = ent; this.tagMin = min; return this; }
  // bid(n): which destructible structure (battle target id, 0 = none) the next pieces belong to; every vertex carries it as `aB` (see destruct.js)
  bid(n = 0) { this.tagB = n; return this; }
  // opts: {tint: color, worldUV: scale, uvScale: [u,v]}
  add(geo, material, matrix, opts = {}) {
    const g = normalize(geo);
    if (opts.uvScale) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * opts.uvScale[0], uv.getY(i) * opts.uvScale[1]); }
    if (matrix) g.applyMatrix4(matrix);
    if (opts.worldUV) worldUV(g, opts.worldUV);
    _c.set(opts.tint ?? 0xffffff);
    if (opts.tintLinear !== true) _c.convertSRGBToLinear();
    const col = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < col.length; i += 3) { col[i] = _c.r; col[i + 1] = _c.g; col[i + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    { const ab = new Float32Array(g.attributes.position.count), bv = opts.bid ?? this.tagB; if (bv) ab.fill(bv); g.setAttribute('aB', new THREE.BufferAttribute(ab, 1)); }
    if (material.userData.skin != null) {
      const tg = new Float32Array(g.attributes.position.count * 2), e = opts.ent ?? this.tagEnt, mn = opts.min ?? this.tagMin;
      for (let i = 0; i < tg.length; i += 2) { tg[i] = e; tg[i + 1] = mn; }
      g.setAttribute('aTag', new THREE.BufferAttribute(tg, 2));
    }
    let grp = this.groups.get(material);
    if (!grp) { grp = { geos: [], opts: {} }; this.groups.set(material, grp); }
    grp.geos.push(g);
    return g;
  }
  build(parent, { cast = true, receive = true, name = 'static' } = {}) {
    const meshes = [];
    for (const [material, grp] of this.groups) {
      if (!grp.geos.length) continue;
      const merged = mergeGeometries(grp.geos, false);
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = cast && !material.transparent; mesh.receiveShadow = receive;
      if (material.userData.skin != null) mesh.customDepthMaterial = skinDepthMaterial();
      else if (!material.transparent && !material.alphaTest) mesh.customDepthMaterial = plainDepthMaterial();      // (destroyed pieces drop their shadow too)
      mesh.name = name; mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      parent.add(mesh); meshes.push(mesh);
      grp.geos.forEach((g) => g.dispose());
    }
    this.groups.clear();
    return meshes;
  }
}

// Gable (prism) roof centred at origin, ridge along X, base at y=0.
export function gableRoof(w, d, h, over = 0.6) {
  const W = w / 2 + over, D = d / 2 + over, t = 0.35;
  const v = [], uv = [];
  const quad = (a, b, c, d2, ua, ub, uc, ud) => { v.push(...a, ...b, ...c, ...a, ...c, ...d2); uv.push(...ua, ...ub, ...uc, ...ua, ...uc, ...ud); };
  const slope = Math.hypot(D, h) / 3;
  // two slopes
  quad([-W, 0, D], [W, 0, D], [W, h, 0], [-W, h, 0], [0, 0], [W * 2 / 3, 0], [W * 2 / 3, slope], [0, slope]);
  quad([W, 0, -D], [-W, 0, -D], [-W, h, 0], [W, h, 0], [0, 0], [W * 2 / 3, 0], [W * 2 / 3, slope], [0, slope]);
  // gable ends (triangles)
  v.push(-W + t, 0, -D + 0.05, -W + t, 0, D - 0.05, -W + t, h - 0.05, 0); uv.push(0, 0, 1, 0, 0.5, 0.6);
  v.push(W - t, 0, D - 0.05, W - t, 0, -D + 0.05, W - t, h - 0.05, 0); uv.push(0, 0, 1, 0, 0.5, 0.6);
  // underside
  quad([-W, -0.01, -D], [W, -0.01, -D], [W, -0.01, D], [-W, -0.01, D], [0, 0], [1, 0], [1, 1], [0, 1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// wall-face "gable" triangles to close a house under a gable roof
export function gableWall(w, d, h) {
  const W = w / 2, D = d / 2, v = [
    -W, 0, -D, -W, 0, D, -W, h, 0,
    W, 0, D, W, 0, -D, W, h, 0,
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

export const TAU = Math.PI * 2;

// Shader-side twin of grayTex: desaturates the map sample in the shader (gamma space, same weights) so a tint can recolour it.
// Costs nothing on the CPU (grayTex reads a whole texture back through a canvas: hundreds of ms on a phone) and no extra texture memory.
const grayMapChunk = (gain) => `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  { vec3 gm = pow( max( sampledDiffuseColor.rgb, vec3( 0.0 ) ), vec3( 0.4545 ) ); float gl = min( 1.0, dot( gm, vec3( 0.3, 0.55, 0.15 ) ) * ${gain.toFixed(2)} ); sampledDiffuseColor.rgb = vec3( pow( gl, 2.2 ) ); }
  diffuseColor *= sampledDiffuseColor;
#endif`;
export function grayMap(mat, gain = 1.25) {
  const prev = mat.onBeforeCompile, chunk = grayMapChunk(gain);
  mat.customProgramCacheKey = () => 'bwgray' + gain.toFixed(2);
  mat.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', chunk); };
  return mat;
}

// desaturated copy of a texture (so a tint can recolor red tiles to blue slate)
const GRAY = new Map();
export function grayTex(t) {
  if (!t || !t.image) return t;
  if (GRAY.has(t)) return GRAY.get(t);
  const img = t.image, w = img.width, h = img.height, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);      // (p38: CPU canvas: the read-back below must not wait for the GPU)
  const d = g.getImageData(0, 0, w, h), a = d.data;
  for (let i = 0; i < a.length; i += 4) { const l = Math.min(255, (a[i] * 0.3 + a[i + 1] * 0.55 + a[i + 2] * 0.15) * 1.25); a[i] = a[i + 1] = a[i + 2] = l; }
  g.putImageData(d, 0, 0);
  const o = new THREE.CanvasTexture(c); o.colorSpace = t.colorSpace; o.flipY = t.flipY; o.wrapS = t.wrapS; o.wrapT = t.wrapT; o.anisotropy = 4;
  GRAY.set(t, o); return o;
}

