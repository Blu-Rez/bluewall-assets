// The stable estate's geometry kit (p22, "pasture"): everything the estate is made of — the barn, the round pen, the yard props, the
// horse-keepers' camp and the pasture fence — goes into ONE triangle soup with per-vertex colour and a per-vertex surface id, drawn by
// ONE material whose fragment shader paints the surfaces procedurally (no textures):
//   boards (vertical board-and-batten, grain, seams, knots, grime at the foot), shingles (staggered courses, shadow under each course,
//   moss), stone footing (irregular blocks + mortar), straw / hay, felt, canvas, sand, end-grain logs, iron, still water and lantern glass
//   that glows at night.  Every pattern fades to its average where it would shimmer (fwidth), so far away it is a flat colour.
// It wears the tier-skin "hide only" role (aTag = structure, min level: pieces appear with the stable's level) and the battle collapse
// (aB = target id), exactly like the batched estates, so one draw call (+1 shadow) for the whole estate, culled as a unit.
import * as THREE from 'three';
import { applySkin, skinDepthMaterial } from './skin.js';
import { patchDestruct } from './destruct.js';

export const S = { flat: 0, board: 1, shingle: 2, stone: 3, straw: 4, felt: 5, metal: 6, water: 7, glow: 8, sand: 9, canvas: 10, leather: 11, grain: 12, log: 13 };

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3(), _c = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);
const col = (hex) => _c.set(hex);                      // sRGB hex -> linear working colour (once)

// ------------------------------------------------------------------ triangle soup
// (typed arrays that grow by doubling + scratch vectors: the whole estate is ~47k vertices and builds in a few ms of real work, no GC storm)
const BOXP = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
const BOXF = [['+z', 4, 5, 6, 7], ['-z', 1, 0, 3, 2], ['+x', 5, 1, 2, 6], ['-x', 0, 4, 7, 3], ['+y', 7, 6, 2, 3], ['-y', 0, 1, 5, 4]];
const _P8 = BOXP.map(() => new THREE.Vector3()), _Q4 = [null, null, null, null], _A = new THREE.Vector3(), _B = new THREE.Vector3();
const AX = new THREE.Vector3(1, 0, 0), AZ = new THREE.Vector3(0, 0, 1), NOOPT = {};
const _r0 = [], _r1 = [], _ra = [], _rot = new THREE.Matrix3(), _n0 = new THREE.Vector3(), _n1 = new THREE.Vector3(), _cc = new THREE.Vector3(), _nn = new THREE.Vector3(), _k = new THREE.Color();
export class Soup {
  constructor(ox = 0, oz = 0) { this.cap = 0; this.nv = 0; this.grow(4096); this.ox = ox; this.oz = oz; this.oy = 0; this.ent = 0; this.min = 0; this.bid = 0; }
  grow(n) {
    const cap = Math.max(n, this.cap * 2), cp = (o, k) => { const a = new Float32Array(cap * k); if (o) a.set(o.subarray(0, this.nv * k)); return a; };
    this.p = cp(this.p, 3); this.n = cp(this.n, 3); this.uv = cp(this.uv, 2); this.c = cp(this.c, 3); this.m = cp(this.m, 1); this.t = cp(this.t, 2); this.b = cp(this.b, 1); this.cap = cap;
  }
  tag(ent = 0, min = 0) { this.ent = ent; this.min = min; return this; }
  vert(p, n, u, v, c, m) {
    if (this.nv >= this.cap) this.grow(this.cap * 2);
    const i = this.nv++, i3 = i * 3, i2 = i * 2;
    this.p[i3] = p.x; this.p[i3 + 1] = p.y; this.p[i3 + 2] = p.z; this.n[i3] = n.x; this.n[i3 + 1] = n.y; this.n[i3 + 2] = n.z;
    this.uv[i2] = u; this.uv[i2 + 1] = v; this.c[i3] = c.r; this.c[i3 + 1] = c.g; this.c[i3 + 2] = c.b; this.m[i] = m; this.t[i2] = this.ent; this.t[i2 + 1] = this.min; this.b[i] = this.bid;
  }
  // a planar polygon (3 or 4 points, counter-clockwise seen from the front); uv in metres along axis A (horizontal) and B (vertical, or depth for flat faces)
  face(pts, hex, m, opt = NOOPT) {
    const c = col(hex), p0 = pts[0], np = pts.length;
    _a.subVectors(pts[1], p0); _b.subVectors(pts[np - 1], p0); _n.crossVectors(_a, _b).normalize();
    if (opt.n) _n.copy(opt.n);
    // pattern axes: on vertical faces u runs along the face, v is the world height; on roofs (opt.uA / vB) v runs down the slope
    let A, B;
    if (opt.uA) { A = opt.uA; B = opt.vB; }
    else if (Math.abs(_n.y) < 0.6) { A = _A.set(-_n.z, 0, _n.x).normalize(); B = UP; }
    else { A = AX; B = AZ; }
    const du = opt.du || 0, dv = opt.dv || 0, ox = this.ox, oy = this.oy, oz = this.oz;
    const V = (q) => { const x = q.x - ox, y = q.y - oy, z = q.z - oz; this.vert(q, _n, x * A.x + y * A.y + z * A.z + du, x * B.x + y * B.y + z * B.z + dv, c, m); };
    V(pts[0]); V(pts[1]); V(pts[2]); if (np === 4) { V(pts[0]); V(pts[2]); V(pts[3]); }
    if (opt.both) { _n.negate(); V(pts[0]); V(pts[2]); V(pts[1]); if (np === 4) { V(pts[0]); V(pts[3]); V(pts[2]); } }
  }
  // box: local half-size scaled by (sx, sy, sz), placed by a Matrix4 (no scale in it). opt.skip: faces to leave out ('-y' etc.)
  box(M4, sx, sy, sz, hex, m, opt = NOOPT) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    for (let i = 0; i < 8; i++) { const q = BOXP[i]; _P8[i].set(q[0] * hx, q[1] * hy, q[2] * hz).applyMatrix4(M4); }
    for (const f of BOXF) {
      const k = f[0]; if (opt.skip && opt.skip.includes(k)) continue;
      _Q4[0] = _P8[f[1]]; _Q4[1] = _P8[f[2]]; _Q4[2] = _P8[f[3]]; _Q4[3] = _P8[f[4]];
      this.face(_Q4, (opt.faces && opt.faces[k]) ?? hex, (opt.mats && opt.mats[k]) ?? m, opt.uv && opt.uv[k] ? opt.uv[k] : NOOPT);
    }
  }
  // cylinder / cone frustum along local Y (centre of the base at the origin of M4), smooth sides, optional caps
  cyl(M4, r0, r1, h, seg, hex, m, opt = NOOPT) {
    const c = _k.copy(col(hex)), a0 = opt.a0 || 0, arc = opt.arc || Math.PI * 2, full = arc >= Math.PI * 2 - 1e-6;
    while (_r0.length <= seg) { _r0.push(new THREE.Vector3()); _r1.push(new THREE.Vector3()); }
    for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * arc; _ra[i] = a; _r0[i].set(Math.cos(a) * r0, 0, Math.sin(a) * r0).applyMatrix4(M4); _r1[i].set(Math.cos(a) * r1, h, Math.sin(a) * r1).applyMatrix4(M4); }
    const slope = (r0 - r1) / h; _rot.setFromMatrix4(M4);
    const L = Math.max(r0, r1) * arc;
    for (let i = 0; i < seg; i++) {
      const p0 = _r0[i], p1 = _r0[i + 1], q0 = _r1[i], q1 = _r1[i + 1], u0 = (i / seg) * L, u1 = ((i + 1) / seg) * L;
      _n0.set(Math.cos(_ra[i]), slope, Math.sin(_ra[i])).normalize().applyMatrix3(_rot).normalize(); _n1.set(Math.cos(_ra[i + 1]), slope, Math.sin(_ra[i + 1])).normalize().applyMatrix3(_rot).normalize();
      const vy0 = opt.vWorld ? p0.y - this.oy : 0, vy1 = opt.vWorld ? q0.y - this.oy : h;
      this.vert(p0, _n0, u0, vy0, c, m); this.vert(q1, _n1, u1, vy1, c, m); this.vert(p1, _n1, u1, vy0, c, m);
      this.vert(p0, _n0, u0, vy0, c, m); this.vert(q0, _n0, u0, vy1, c, m); this.vert(q1, _n1, u1, vy1, c, m);
    }
    const cap = (pts, y, up, ch, cm) => {
      _cc.set(0, y, 0).applyMatrix4(M4); _nn.set(0, up, 0).applyMatrix3(_rot).normalize(); const k = col(ch ?? hex);
      for (let i = 0; i < seg; i++) { const a = pts[i], b = pts[i + 1], x0 = a.x - _cc.x, z0 = a.z - _cc.z, x1 = b.x - _cc.x, z1 = b.z - _cc.z;
        if (up > 0) { this.vert(_cc, _nn, 0, 0, k, cm); this.vert(b, _nn, x1, z1, k, cm); this.vert(a, _nn, x0, z0, k, cm); } else { this.vert(_cc, _nn, 0, 0, k, cm); this.vert(a, _nn, x0, z0, k, cm); this.vert(b, _nn, x1, z1, k, cm); } }
    };
    if (opt.top && full && r1 > 0) cap(_r1, h, 1, opt.topHex, opt.topM ?? m);
    if (opt.bottom && full && r0 > 0) cap(_r0, 0, -1, opt.botHex, opt.botM ?? m);
  }
  get tris() { return this.nv / 3; }
  geometry() {
    const g = new THREE.BufferGeometry(), n = this.nv, sl = (a, k) => new THREE.BufferAttribute(a.slice(0, n * k), k);
    g.setAttribute('position', sl(this.p, 3)); g.setAttribute('normal', sl(this.n, 3)); g.setAttribute('aUv', sl(this.uv, 2)); g.setAttribute('color', sl(this.c, 3));
    g.setAttribute('aMat', sl(this.m, 1)); g.setAttribute('aTag', sl(this.t, 2)); g.setAttribute('aB', sl(this.b, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}

// placement matrix: world position + yaw (+ pitch about local X, roll about local Z; Y-X-Z like util.mat4)
// (returns a shared matrix: use it at once, e.g. soup.box(place(...), ...))
const _pm = new THREE.Matrix4();
export function place(x, y, z, yaw = 0, pitch = 0, roll = 0) { _e.set(pitch, yaw, roll, 'YXZ'); _q.setFromEuler(_e); return _pm.compose(_v.set(x, y, z), _q, _s.set(1, 1, 1)); }

// ------------------------------------------------------------------ the material
const GLSL = `
varying float vPM; varying vec2 vPUv; varying float vPLod;
uniform float uPNight;
float pH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float pN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(pH(i), pH(i + vec2(1.0, 0.0)), f.x), mix(pH(i + vec2(0.0, 1.0)), pH(i + vec2(1.0, 1.0)), f.x), f.y); }
vec3 pasPat(float m, vec2 uv, vec3 c, float lod) {
  if (m < 0.5) return c;
  if (m < 1.5) {                                                   // boards: vertical board-and-batten
    float bw = 0.46, x = uv.x / bw, id = floor(x), f = fract(x);
    float tone = 0.8 + 0.3 * pH(vec2(id, 1.3));
    float grain = 0.9 + 0.1 * sin(uv.y * 6.0 + id * 5.1 + 2.0 * sin(uv.y * 1.3 + id));
    float seam = smoothstep(0.0, 0.08, f) * smoothstep(1.0, 0.9, f);
    float batten = smoothstep(0.86, 0.9, f) * 0.18;
    float grime = mix(0.7, 1.0, smoothstep(0.1, 1.5, uv.y));          // rain splash / dirt at the foot of the wall (uv.y = height above the floor)
    vec3 p = c * tone * grain * (0.45 + 0.55 * seam + batten);
    return mix(c * 0.86, p, lod) * grime;
  }
  if (m < 2.5) {                                                   // shingles: staggered courses (uv.y grows down the slope)
    float rh = 0.44, row = floor(uv.y / rh), fy = fract(uv.y / rh);
    float x = uv.x / 0.58 + 0.5 * mod(row, 2.0) + 0.21 * pH(vec2(row, 3.0)), id = floor(x), fx = fract(x);
    float tone = 0.66 + 0.46 * pH(vec2(id, row));
    float gap = smoothstep(0.0, 0.07, fx) * smoothstep(1.0, 0.93, fx);
    float sh = 0.5 + 0.5 * smoothstep(0.0, 0.4, fy);
    float moss = smoothstep(0.58, 0.9, pN(uv * 0.33 + 3.0)) * 0.55;
    vec3 p = c * tone * sh * (0.55 + 0.45 * gap);
    p = mix(p, vec3(dot(p, vec3(0.33))) * 1.08, 0.5 * pH(vec2(id + 7.0, row * 1.3)));   // some shingles weathered silver
    p = mix(p, vec3(0.13, 0.16, 0.07) * (0.7 + 0.6 * tone), moss * 0.6);
    return mix(c * 0.82, p, lod);
  }
  if (m < 3.5) {                                                   // stone footing: irregular blocks + mortar
    float rh = 0.5, row = floor(uv.y / rh), fy = fract(uv.y / rh);
    float bl = 0.9 + 0.45 * pH(vec2(row, 9.0)), x = uv.x / bl + pH(vec2(row, 2.0)), id = floor(x), fx = fract(x);
    float tone = 0.68 + 0.45 * pH(vec2(id, row + 17.0));
    float e = min(min(fx, 1.0 - fx) * bl, min(fy, 1.0 - fy) * rh);
    float mortar = smoothstep(0.015, 0.06, e);
    vec3 p = mix(c * 0.55 + vec3(0.06), c * tone * (0.82 + 0.3 * pN(uv * 3.1)), mortar);
    return mix(c * 0.85, p, lod);
  }
  if (m < 4.5) {                                                   // straw / hay
    float s = pH(vec2(floor(uv.x * 18.0), floor(uv.y * 2.5 + pH(vec2(floor(uv.x * 18.0), 1.0)))));
    return c * mix(0.92, 0.7 + 0.3 * s + 0.25 * pN(vec2(uv.x * 7.0, uv.y * 1.2)), lod);
  }
  if (m < 5.5) return c * (0.86 + 0.16 * pN(uv * 1.7) + 0.08 * pN(uv * 7.0) * lod);            // felt
  if (m < 6.5) return c;                                                                       // iron
  if (m < 7.5) return c * (0.85 + 0.15 * pN(uv * 0.9));                                         // water
  if (m < 8.5) return c;                                                                       // glow
  if (m < 9.5) return c * (0.8 + 0.2 * pN(uv * 1.5) + 0.12 * pH(floor(uv * 37.0)) * lod);       // sand
  if (m < 10.5) return c * (0.92 + 0.08 * pN(uv * 1.2));                                        // canvas
  if (m < 11.5) return c * (0.9 + 0.12 * pN(uv * 5.0));                                         // leather
  if (m < 12.5) return c * mix(0.88, 0.8 + 0.2 * sin(uv.y * 22.0 + pN(uv * vec2(0.6, 6.0)) * 6.0), lod);   // wood grain along u
  return c * (0.8 + 0.2 * pN(uv * 4.0));                                                      // log end
}
float pasRough(float m) { return m < 0.5 ? 0.85 : m < 1.5 ? 0.88 : m < 2.5 ? 0.8 : m < 3.5 ? 0.95 : m < 5.5 ? 1.0 : m < 6.5 ? 0.42 : m < 7.5 ? 0.1 : m < 8.5 ? 0.5 : m < 10.5 ? 0.97 : m < 11.5 ? 0.55 : 0.9; }
`;

// night: 0..1 (a uniform object; its value may be a getter). The material is patched for the tier "hide only" role and the battle collapse.
export function estateMaterial(night) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, envMapIntensity: 0.35, name: 'pasEstate' });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uPNight = night;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aMat; attribute vec2 aUv; varying float vPM; varying vec2 vPUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPM = aMat; vPUv = aUv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GLSL)
      .replace('#include <color_fragment>', `#include <color_fragment>
  float pLod = clamp(1.6 - max(length(fwidth(vPUv)), 0.0) * 9.0, 0.0, 1.0);
  diffuseColor.rgb = pasPat(vPM, vPUv, diffuseColor.rgb, pLod);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = pasRough(vPM);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = (vPM > 5.5 && vPM < 6.5) ? 0.7 : 0.0;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nif (vPM > 7.5 && vPM < 8.5) totalEmissiveRadiance += diffuseColor.rgb * (0.25 + 3.2 * uPNight);');
  };
  mat.customProgramCacheKey = () => 'pasEstate1';
  applySkin(mat, 5);                          // pieces appear at their min level (aTag)
  patchDestruct(mat);                         // the battle collapses the stable like every other estate (aB)
  return mat;
}

export function estateMesh(soup, night, { shadows = true } = {}) {
  const mesh = new THREE.Mesh(soup.geometry(), estateMaterial(night));
  mesh.castShadow = !!shadows; mesh.receiveShadow = true; mesh.customDepthMaterial = skinDepthMaterial();
  mesh.name = 'stable-estate'; mesh.matrixAutoUpdate = false; mesh.updateMatrix();
  return mesh;
}
