// Blue Wall loader key art — OFFLINE render (headless chromium) of the Blue Wall: a long curtain wall across a mountain pass,
// the gatehouse, the citadel behind, snow peaks in layers. Output: beauty + emissive passes (PNG data URLs) + light positions.
// URL: ?d=A|B  &layer=wall|mtn  &w=&h=  &ss=2
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeNoise, rng, smooth, clamp } from '../../bot/bluebot_v2/bluewall/client/src/noise.js';

const Q = new URLSearchParams(location.search);
const OW = +(Q.get('w') || 2000), OH = +(Q.get('h') || 1000), SS = +(Q.get('ss') || 2);
const LAYER = Q.get('layer') || 'wall', DIR = Q.get('d') || 'A';
const N = makeNoise(4242), NM = makeNoise(9191), R = rng(77);
const W = OW * SS, H = OH * SS;

// ------------------------------------------------------------------ cameras / light per direction
const CAMS = {
  A: { pos: [0, 24, 330], tgt: [0, 44, 0], fov: 31 },
  B: { pos: [-95, 7, 150], tgt: [-6, 34, -10], fov: 38 },
};
const C = CAMS[DIR];
const MOON = new THREE.Vector3(-0.72, 0.52, -0.18).normalize();

// ------------------------------------------------------------------ terrain height (valley + steep flanks of the pass)
const wallZ = (x) => -0.00016 * x * x;
function ground(x, z) {
  const ax = Math.abs(x);
  let h = 0;
  const fl = smooth(118, 330, ax + N.fbm(x / 160, z / 160, 3) * 30);
  h += Math.pow(fl, 1.35) * 210 * (0.8 + 0.4 * N.fbm(x / 260 + 7, z / 260, 3));
  h += fl * N.ridged(x / 140, z / 140, 5) * 60;
  h += smooth(-130, -700, z) * 70 * (0.6 + 0.6 * N.fbm(x / 300, z / 300 + 3, 3));
  h += N.fbm(x / 60, z / 60, 4) * 3.2 * (1 - fl) + N.fbm(x / 18, z / 18, 3) * 0.7;
  // citadel mound
  const dm = Math.hypot(x / 95, (z + 85) / 60); h += Math.max(0, 1 - dm) ** 1.4 * 9;
  // flatten the wall line & gate approach
  const dw = Math.abs(z - wallZ(x)); const flat = (1 - smooth(6, 24, dw)) * (1 - fl * 0.85);
  h = h * (1 - flat) + (h * 0.2 + Math.max(0, h) * 0.4) * flat;
  return h;
}
const roadX = (z) => 14 * Math.sin(z / 85) * smooth(25, 160, z);

// ------------------------------------------------------------------ shader chunks (masonry, shingles, terrain, foliage) injected into MeshStandardMaterial
const GLSL_COMMON = /* glsl */`
varying vec2 vMuv; varying vec3 vWPos; varying vec3 vWNrm;
uniform vec3 uStone, uMortar, uSnowCol, uFogCol; uniform float uRowH, uStoneW, uMortarW, uBump, uSnow, uFogD, uFogH, uFogBase;
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h12(i),h12(i+vec2(1,0)),f.x), mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*vn(p); p=p*2.03+vec2(17.1,9.7); a*=.5; } return s; }
vec3 ldPerturb(vec3 sp, vec3 sn, vec2 dH, float fd){ vec3 sx=dFdx(sp), sy=dFdy(sp); vec3 r1=cross(sy,sn), r2=cross(sn,sx); float det=dot(sx,r1)*fd; vec3 g=sign(det)*(dH.x*r1+dH.y*r2); return normalize(abs(det)*sn-g); }
`;
const GLSL_SURF = /* glsl */`
  vec3 ldAlb; float ldR; float ldH; float ldSnow = 0.;
  {
#if KIND == 0
    // ---- ashlar masonry, running bond, per-stone tint, chipped arrises, grime streaks
    vec2 p = vMuv;
    float row = floor(p.y / uRowH); float rr = h12(vec2(row, 7.13));
    float sw = uStoneW * (0.75 + 0.6 * rr);
    float x = p.x + rr * 3.7 + mod(row, 2.) * 0.5 * sw;
    float col = floor(x / sw); vec2 cell = vec2(col, row); float cr = h12(cell);
    vec2 f = vec2(x - col * sw, p.y - row * uRowH);
    float e = min(min(f.x, sw - f.x), min(f.y, uRowH - f.y) * 1.15);
    float n1 = vn(p * 9.0);
    float st = smoothstep(uMortarW * (0.5 + 0.9 * n1), uMortarW + 0.05, e);
    float face = fbm(p * 6.0 + cr * 7.0);
    ldH = st * (0.5 + 0.5 * smoothstep(0.0, 0.18, e)) + 0.22 * face - 0.18 * smoothstep(0.6, 0.85, vn(p * 2.7 + cr * 11.)) * (1. - smoothstep(0., .14, e));
    vec3 sc = uStone * (0.68 + 0.6 * cr) * (0.8 + 0.4 * face);
    sc *= mix(vec3(1.0), vec3(0.9, 0.97, 1.1), h12(cell + 3.3));
    sc = mix(sc, sc * vec3(1.08, 1.0, 0.9), step(0.86, h12(cell + 9.1)));
    ldAlb = mix(uMortar * (0.8 + 0.4 * n1), sc, st);
    float streak = fbm(vec2(p.x * 1.9, p.y * 0.09 + 3.0));
    ldAlb *= 0.72 + 0.45 * streak;
    ldR = mix(0.97, 0.78 - 0.12 * cr, st);
#elif KIND == 1
    // ---- slate / steel shingles (scalloped rows)
    vec2 p = vMuv; float rowH = 0.42, sw = 0.55;
    float row = floor(p.y / rowH); float x = p.x + mod(row, 2.) * sw * 0.5; float col = floor(x / sw);
    vec2 cell = vec2(col, row); float cr = h12(cell);
    vec2 f = vec2(x / sw - col, p.y / rowH - row);
    float sc = 1. - sqrt(max(0., 1. - pow(2. * f.x - 1., 2.)));
    float edge = smoothstep(0.0, 0.12, f.y - sc * 0.35);
    ldH = edge * (0.4 + 0.6 * f.y) + 0.1 * vn(p * 14.);
    ldAlb = uStone * (0.7 + 0.55 * cr) * (0.65 + 0.35 * edge);
    ldR = 0.42 + 0.3 * cr;
#elif KIND == 2
    // ---- terrain: rock strata + snow by slope/height
    vec2 p = vWPos.xz; float sc = uRowH;
    float n = fbm(p * sc), n2 = fbm(p * sc * 5.3 + 4.);
    float strata = 0.8 + 0.3 * sin(vWPos.y * 0.21 / max(sc * 30., 0.02) + n * 7.0);
    vec3 rock = uMortar * (0.55 + 0.7 * n2) * strata;
    float sl = vWNrm.y + (n - 0.5) * 0.45;
    float sn = smoothstep(uStoneW - 0.08, uStoneW + 0.07, sl) * smoothstep(uSnow - 30., uSnow + 30., vWPos.y + (n - 0.5) * 120.);
    // the road: trodden snow, darker, wheel ruts
    float rd = abs(vWPos.x - 14. * sin(vWPos.z / 85.) * smoothstep(25., 160., vWPos.z));
    float road = (1. - smoothstep(4.0, 6.5, rd + (n - .5) * 3.)) * step(4.0, vWPos.z) * step(vWPos.z, 400.);
    vec3 snowc = uSnowCol * (0.86 + 0.18 * n2);
    ldAlb = mix(rock, snowc, sn);
    ldAlb = mix(ldAlb, mix(vec3(0.33, 0.35, 0.4), uSnowCol * 0.62, 0.55 + 0.3 * n2) , road * 0.85);
    ldH = mix(n2 * 1.2, n2 * 0.35, sn) + road * 0.4 * sin(rd * 2.4);
    ldR = mix(0.9, 0.7, sn);
    ldSnow = -1.0;
#elif KIND == 3
    // ---- pine foliage (dark, snow on the up-facing tiers)
    float n = fbm(vWPos.xz * 1.7 + vWPos.y * 1.3);
    ldAlb = uStone * (0.6 + 0.6 * n);
    ldH = fbm(vec2(atan(vWNrm.x, vWNrm.z) * 6., vWPos.y * 3.)) ;
    ldR = 0.85;
#else
    ldAlb = uStone; ldH = fbm(vMuv * 3.) ; ldR = 0.85;
#endif
    if (ldSnow == 0.) {
      float sn = smoothstep(0.42, 0.78, vWNrm.y + 0.4 * (fbm(vWPos.xz * 0.9) - 0.5)) * uSnow;
      ldAlb = mix(ldAlb, uSnowCol * (0.92 + 0.12 * vn(vWPos.xz * 5.)), sn);
      ldR = mix(ldR, 0.72, sn); ldH *= 1. - 0.75 * sn;
    }
  }
`;
function surfMat(kind, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: o.metal || 0, envMapIntensity: o.env ?? 0.35, side: o.side || THREE.FrontSide });
  const U = {
    uStone: { value: new THREE.Color(o.stone ?? 0x6c7890) }, uMortar: { value: new THREE.Color(o.mortar ?? 0x2a3140) },
    uSnowCol: { value: new THREE.Color(o.snowCol ?? 0xdde9fb) }, uFogCol: { value: FOG.col },
    uRowH: { value: o.rowH ?? 0.62 }, uStoneW: { value: o.stoneW ?? 1.25 }, uMortarW: { value: o.mortarW ?? 0.035 },
    uBump: { value: o.bump ?? 1.0 }, uSnow: { value: o.snow ?? 1.0 },
    uFogD: { value: FOG.d }, uFogH: { value: FOG.h }, uFogBase: { value: FOG.base },
  };
  m.defines = { KIND: kind };
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 muv; varying vec2 vMuv; varying vec3 vWPos; varying vec3 vWNrm;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vMuv = muv;
        mat4 ldM = modelMatrix;
        #ifdef USE_INSTANCING
          ldM = modelMatrix * instanceMatrix;
        #endif
        vWPos = (ldM * vec4(transformed, 1.0)).xyz; vWNrm = normalize(mat3(ldM) * objectNormal);`);
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\n' + GLSL_COMMON)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + GLSL_SURF + '\n diffuseColor.rgb = ldAlb;')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = ldR;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = ldPerturb(-vViewPosition, normal, vec2(dFdx(ldH), dFdy(ldH)) * uBump, faceDirection);')
      .replace('#include <fog_fragment>', FOG_GLSL);
  };
  m.customProgramCacheKey = () => 'ld' + kind + (o.metal || 0);
  return m;
}
// height fog: exponential with distance, denser in the low valley; applied in output space like three's fog
const FOG = { col: new THREE.Color(0x1d3561), d: 0.0011, h: 55, base: 0 };
const FOG_GLSL = /* glsl */`
  { float dist = length(vWPos - cameraPosition);
    float hf = exp(-max(0., vWPos.y - uFogBase) / uFogH);
    float ff = 1. - exp(-dist * uFogD * (0.35 + 0.65 * hf));
    gl_FragColor.rgb = mix(gl_FragColor.rgb, uFogCol, clamp(ff, 0., 1.)); }`;
function basicFogMat(color, intensity = 1, o = {}) {      // emissive things: windows, flames, gate glow
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: o.side || THREE.FrontSide, transparent: !!o.transparent, opacity: o.opacity ?? 1, depthWrite: o.depthWrite ?? true, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: o.toneMapped ?? true });
  if (o.map) m.map = o.map;
  m.userData.emissive = true;
  return m;
}

// ------------------------------------------------------------------ geometry helpers (all world-space, 'muv' in metres)
function setMuv(geo, fn) {
  const p = geo.attributes.position, n = geo.attributes.normal, a = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const r = fn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)); a[i * 2] = r[0]; a[i * 2 + 1] = r[1]; }
  geo.setAttribute('muv', new THREE.BufferAttribute(a, 2)); geo.deleteAttribute('uv'); return geo;
}
const planarUV = (x, y, z, nx, ny, nz) => Math.abs(ny) > 0.7 ? [x, z] : Math.abs(nx) > Math.abs(nz) ? [z * Math.sign(nx || 1), y] : [x * Math.sign(-nz || 1) * -1, y];
function prep(geo, uvfn = planarUV) { geo = geo.index ? geo.toNonIndexed() : geo; if (!geo.attributes.normal) geo.computeVertexNormals(); return setMuv(geo, uvfn); }
const cylUV = (cx, cz, r) => (x, y, z) => [Math.atan2(z - cz, x - cx) * r, y];
function boxAt(w, h, d, x, y, z, ry = 0) { const g = new THREE.BoxGeometry(w, h, d); g.rotateY(ry); g.translate(x, y, z); return g; }
function cyl(r0, r1, h, x, y, z, seg = 48, open = false) { const g = new THREE.CylinderGeometry(r1, r0, h, seg, 1, open); g.translate(x, y + h / 2, z); return g; }

// buckets of geometry merged per material
const BUCK = {}; const add = (k, g, uv) => (BUCK[k] = BUCK[k] || []).push(prep(g, uv));
const LIGHTS = [];      // {p:Vector3, kind, int}
const EMIS = [];        // meshes with emissive materials
const scene = new THREE.Scene();

// window: arched glowing pane + dark reveal; n = outward normal (x,z), on a wall face
function windowAt(x, y, z, nx, nz, w = 1.1, h = 2.0, lit = 1) {
  const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h - w / 2); sh.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); sh.lineTo(-w / 2, 0);
  const g = new THREE.ShapeGeometry(sh, 8); const ry = Math.atan2(nx, nz);
  const fr = new THREE.ShapeGeometry(sh, 8); fr.scale(1.45, 1.22, 1); fr.translate(0, -0.2, 0);
  for (const [geo, off] of [[g, 0.12], [fr, 0.08]]) { geo.rotateY(ry); geo.translate(x + nx * off, y, z + nz * off); }
  (BUCK.frame = BUCK.frame || []).push(prep(fr));
  if (lit > 0) { (BUCK['win' + (lit > 0.7 ? 'H' : 'L')] = BUCK['win' + (lit > 0.7 ? 'H' : 'L')] || []).push(prep(g)); WINS.push({ p: new THREE.Vector3(x + nx * 0.3, y + h * 0.5, z + nz * 0.3), lit, w }); }
  else (BUCK.frame = BUCK.frame || []).push(prep(g));
}
const WINS = [], TORCH = [];
function torchAt(x, y, z, big = 1, light = false) {
  add('iron', cyl(0.09 * big, 0.12 * big, 1.6 * big, x, y, z, 6));
  add('iron', cyl(0.28 * big, 0.18 * big, 0.35 * big, x, y + 1.5 * big, z, 8));
  const fl = new THREE.ConeGeometry(0.3 * big, 0.95 * big, 8); fl.translate(x, y + 2.25 * big, z); (BUCK.flame = BUCK.flame || []).push(prep(fl));
  const core = new THREE.SphereGeometry(0.22 * big, 8, 6); core.translate(x, y + 1.95 * big, z); (BUCK.flame = BUCK.flame || []).push(prep(core));
  TORCH.push({ p: new THREE.Vector3(x, y + 2.1 * big, z), big });
  if (light) LIGHTS.push({ p: new THREE.Vector3(x, y + 2.6 * big, z), col: 0xff9a45, int: 260 * big, dist: 42 * big });
}

// crenellated parapet along a segment (outer edge), merlons follow the walkway height function
function parapet(x0, z0, x1, z1, yAt, o = {}) {
  const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L, nx = -uz, nz = ux;   // n points to +z side (camera) for a left→right wall
  const mw = o.mw ?? 1.5, gap = o.gap ?? 1.0, mh = o.mh ?? 1.7, t = o.t ?? 0.8, off = o.off ?? 0;
  const ry = Math.atan2(-uz, ux);
  for (let s = mw / 2 + 0.3; s < L - mw / 2; s += mw + gap) {
    const x = x0 + ux * s + nx * off, z = z0 + uz * s + nz * off, y = yAt(s / L);
    add(o.mat || 'stone', boxAt(mw, mh + 1.0, t, x, y + (mh + 1.0) / 2 - 1.0, z, ry));
  }
  // continuous breastwork under the merlons
}
// curtain wall between 2 ground points, top follows the terrain (sloped), with a crenellated parapet on the outside, torches on the walk
function curtain(x0, x1, Hw, T, o = {}) {
  const n = Math.max(2, Math.ceil(Math.abs(x1 - x0) / 4));
  const pos = [], top = [];
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = wallZ(x); const g = Math.min(ground(x, z - T / 2), ground(x, z + T / 2), ground(x, z)); pos.push([x, z, g]); }
  // smooth top line
  for (let i = 0; i <= n; i++) { let s = 0, c = 0; for (let k = -3; k <= 3; k++) { const j = clamp(i + k, 0, n); s += pos[j][2]; c++; } top.push(s / c + Hw); }
  // build a strip mesh: front face, back face, top
  const P = [], push = (a) => P.push(...a);
  for (let i = 0; i < n; i++) {
    const [xa, za, ga] = pos[i], [xb, zb, gb] = pos[i + 1], ta = top[i], tb = top[i + 1];
    const dx = xb - xa, dz = zb - za, L = Math.hypot(dx, dz), nx = -dz / L, nz = dx / L;   // outward = +z
    const fa = [xa + nx * T / 2, za + nz * T / 2], fb = [xb + nx * T / 2, zb + nz * T / 2], ba = [xa - nx * T / 2, za - nz * T / 2], bb = [xb - nx * T / 2, zb - nz * T / 2];
    const ya = ga - 6, yb = gb - 6;
    // front (camera side)
    push([fa[0], ya, fa[1], fb[0], yb, fb[1], fb[0], tb, fb[1], fa[0], ya, fa[1], fb[0], tb, fb[1], fa[0], ta, fa[1]]);
    // back
    push([bb[0], yb, bb[1], ba[0], ya, ba[1], ba[0], ta, ba[1], bb[0], yb, bb[1], ba[0], ta, ba[1], bb[0], tb, bb[1]]);
    // walkway top
    push([fa[0], ta, fa[1], fb[0], tb, fb[1], bb[0], tb, bb[1], fa[0], ta, fa[1], bb[0], tb, bb[1], ba[0], ta, ba[1]]);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals();
  // continuous u along the wall
  let acc = [0]; for (let i = 0; i < n; i++) acc.push(acc[i] + Math.hypot(pos[i + 1][0] - pos[i][0], pos[i + 1][1] - pos[i][1]));
  add('stone', g, (x, y, z, nx, ny) => { if (ny > 0.7) return [x, z]; const t = clamp((x - x0) / (x1 - x0), 0, 1) * n; const i = Math.min(n - 1, Math.floor(t)); return [acc[i] + (acc[i + 1] - acc[i]) * (t - i), y]; });
  // string course (projecting band) just under the parapet + base batter
  const yAt = (t) => { const f = t * n, i = Math.min(n - 1, Math.floor(f)); return top[i] + (top[i + 1] - top[i]) * (f - i); };
  for (let i = 0; i < n; i++) {
    const [xa, za] = pos[i], [xb, zb] = pos[i + 1]; const L = Math.hypot(xb - xa, zb - za), ry = Math.atan2(-(zb - za), xb - xa);
    const mx = (xa + xb) / 2, mz = (za + zb) / 2, my = (top[i] + top[i + 1]) / 2;
    add('stone', boxAt(L + 0.05, 0.55, T + 0.7, mx, my - 2.2, mz, ry));
    const nxs = -(zb - za) / L, nzs = (xb - xa) / L;
    add('stone', boxAt(L + 0.05, 1.15, 0.8, mx + nxs * (T / 2 - 0.4), my + 0.55, mz + nzs * (T / 2 - 0.4), ry));
    add('stone', boxAt(L + 0.05, 1.0, 0.6, mx - nxs * (T / 2 - 0.3), my + 0.5, mz - nzs * (T / 2 - 0.3), ry));
    // machicolation corbels under the walk on the outside
    if (o.corbels !== false) for (let k = 0; k < 2; k++) { const s = (k + 0.5) / 2; add('stone', boxAt(0.5, 1.2, 0.7, xa + (xb - xa) * s + (-(zb - za) / L) * (T / 2 + 0.25), my - 3.0, za + (zb - za) * s + ((xb - xa) / L) * (T / 2 + 0.25), ry)); }
  }
  parapet(x0, wallZ(x0), x1, wallZ(x1), yAt, { off: T / 2 - 0.4, mw: 1.45, gap: 0.95, mh: 1.8 });
  // torches on the walk + arrow slits
  const step = o.torchStep ?? 26;
  for (let s = step / 2; s < Math.abs(x1 - x0) - 4; s += step) {
    const x = x0 + Math.sign(x1 - x0) * s, z = wallZ(x), t = s / Math.abs(x1 - x0);
    torchAt(x, yAt(t), z + T / 2 - 1.2, 0.9, Math.abs(x) < 70);
  }
  for (let s = 6; s < Math.abs(x1 - x0) - 4; s += 9) {
    const x = x0 + Math.sign(x1 - x0) * s, z = wallZ(x), t = s / Math.abs(x1 - x0);
    windowAt(x, yAt(t) - 7.5, z + T / 2, 0, 1, 0.42, 1.6, R() < 0.35 ? 0.4 : 0);
  }
  return { top, pos, yAt };
}
// round tower with machicolations, crenellated crown and optional conical roof
function roundTower(x, z, r, h, o = {}) {
  const g0 = Math.min(ground(x, z), ground(x + r, z), ground(x - r, z), ground(x, z + r)) - 4;
  const top = (o.base ?? ground(x, z)) + h;
  add('stone', cyl(r * 1.08, r, top - g0, x, g0, z, 56), cylUV(x, z, r));
  // plinth batter
  add('stone', cyl(r * 1.22, r * 1.06, 5, x, g0, z, 56), cylUV(x, z, r));
  // corbel ring + overhanging parapet
  const nc = Math.round(r * 2.4);
  for (let i = 0; i < nc; i++) { const a = i / nc * Math.PI * 2; add('stone', boxAt(0.55, 1.4, 1.0, x + Math.cos(a) * (r + 0.35), top - 1.2, z + Math.sin(a) * (r + 0.35), -a + Math.PI / 2)); }
  add('stone', cyl(r + 0.85, r + 0.85, 1.1, x, top - 0.6, z, 56, true), cylUV(x, z, r + 0.85));
  const nm = Math.round(r * 2.1);
  for (let i = 0; i < nm; i++) { const a = (i + 0.5) / nm * Math.PI * 2, rr = r + 0.6; add('stone', boxAt(Math.PI * 2 * rr / nm * 0.55, 1.9, 0.75, x + Math.cos(a) * rr, top + 1.4, z + Math.sin(a) * rr, -a + Math.PI / 2)); }
  add('stone', cyl(r + 0.3, r + 0.3, 0.6, x, top + 0.2, z, 48));
  if (o.roof) {
    const rh = o.roof, rb = r * (o.roofOv ?? 0.95);
    const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new THREE.Vector2(Math.max(0.02, rb * (1 - t) * (1 - 0.18 * Math.sin(t * Math.PI))), top + 0.6 + (o.roofLift ?? 0) + rh * t)); }
    const rg = new THREE.LatheGeometry(pts, 56); rg.translate(x, 0, z);
    add('roof', rg, (px, py, pz) => [Math.atan2(pz - z, px - x) * rb, (py - top) * 1.15]);
    if (o.roofLift) add('stone', cyl(rb * 0.92, rb * 0.92, o.roofLift + 0.7, x, top, z, 40), cylUV(x, z, rb));
    // steel finial + orb
    const fy = top + 0.6 + (o.roofLift ?? 0) + rh;
    add('steel', cyl(0.12, 0.05, 3.2, x, fy - 0.2, z, 8)); const orb = new THREE.SphereGeometry(0.34, 16, 10); orb.translate(x, fy + 1.0, z); add('steel', orb);
    if (o.flag) FLAGS.push({ x, y: fy + 2.8, z, dir: o.flag, len: o.flagLen || 6 });
  }
  // windows
  if (o.win) for (const [a, dy, lit, w, hh] of o.win) { const ax = Math.cos(a), az = Math.sin(a); windowAt(x + ax * r * 1.0, (o.base ?? ground(x, z)) + dy, z + az * r * 1.0, ax, az, w || 1.1, hh || 2.1, lit); }
  return top;
}
function squareTower(x, z, w, d, h, o = {}) {
  const g0 = Math.min(ground(x - w / 2, z), ground(x + w / 2, z), ground(x, z + d / 2)) - 5;
  const top = (o.base ?? ground(x, z)) + h;
  add('stone', boxAt(w, top - g0, d, x, (top + g0) / 2, z));
  add('stone', boxAt(w + 0.9, 0.7, d + 0.9, x, top - 0.9, z));
  // corbels
  for (const [sx, sz, len, rot] of [[0, 1, w, 0], [0, -1, w, 0], [1, 0, d, Math.PI / 2], [-1, 0, d, Math.PI / 2]]) {
    const nb = Math.round(len / 1.6); for (let i = 0; i < nb; i++) { const s = (i + 0.5) / nb - 0.5; add('stone', boxAt(0.5, 1.3, 0.8, x + (sx ? sx * (w / 2 + 0.3) : s * len), top - 1.6, z + (sz ? sz * (d / 2 + 0.3) : s * len), rot)); }
  }
  add('stone', boxAt(w + 1.4, 1.2, d + 1.4, x, top + 0.0, z));
  const mw = 1.4, gp = 1.0;
  for (const [sx, sz, len, rot] of [[0, 1, w + 1.4, 0], [0, -1, w + 1.4, 0], [1, 0, d + 1.4, Math.PI / 2], [-1, 0, d + 1.4, Math.PI / 2]]) {
    const nb = Math.floor((len + gp) / (mw + gp)); const used = nb * mw + (nb - 1) * gp;
    for (let i = 0; i < nb; i++) { const s = -used / 2 + mw / 2 + i * (mw + gp); add('stone', boxAt(mw, 1.9, 0.7, x + (sx ? sx * (w / 2 + 0.35) : s), top + 1.5, z + (sz ? sz * (d / 2 + 0.35) : s), rot)); }
  }
  if (o.roof) {                                    // pyramid roof (4-sided lathe)
    const rh = o.roof, pts = []; const rb = (Math.max(w, d) / 2 - 0.4) * Math.SQRT2;
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(Math.max(0.02, rb * (1 - t) * (1 - 0.12 * Math.sin(t * Math.PI))), top + 0.4 + rh * t)); }
    const rg = new THREE.LatheGeometry(pts, 4, Math.PI / 4); rg.translate(x, 0, z); add('roof', rg, (px, py, pz, nx, ny, nz) => [Math.abs(nx) > Math.abs(nz) ? pz : px, (py - top) * 1.15]);
    const fy = top + 0.4 + rh; add('steel', cyl(0.14, 0.05, 4, x, fy - 0.3, z, 8)); const orb = new THREE.SphereGeometry(0.42, 16, 10); orb.translate(x, fy + 1.2, z); add('steel', orb);
    if (o.flag) FLAGS.push({ x, y: fy + 3.6, z, dir: o.flag, len: o.flagLen || 8 });
  }
  if (o.win) for (const [fx, dy, lit, side] of o.win) {
    const sd = side ?? 1; windowAt(x + fx * w / 2, (o.base ?? ground(x, z)) + dy, z + sd * d / 2, 0, sd, 1.15, 2.3, lit);
  }
  return top;
}
const FLAGS = [];

// ------------------------------------------------------------------ build: the wall layer (pass, wall, gatehouse, citadel, foreground)
function buildWall() {
  // terrain (valley + flanks + foreground)
  {
    const X0 = -720, X1 = 720, Z0 = -620, Z1 = 330, nx = 360, nz = 260;
    const g = new THREE.PlaneGeometry(X1 - X0, Z1 - Z0, nx, nz); g.rotateX(-Math.PI / 2); g.translate((X0 + X1) / 2, 0, (Z0 + Z1) / 2);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, ground(p.getX(i), p.getZ(i)));
    g.computeVertexNormals(); add('terrain', g, (x, y, z) => [x, z]);
  }
  const T = 6.5, HW = 17;
  // gatehouse: arched gate passage
  {
    const gw = 30, gh = 25, gd = 15, aw = 8.4, ah = 13.5, z = wallZ(0);
    const sh = new THREE.Shape(); sh.moveTo(-gw / 2, -6); sh.lineTo(gw / 2, -6); sh.lineTo(gw / 2, gh); sh.lineTo(-gw / 2, gh); sh.lineTo(-gw / 2, -6);
    const hole = new THREE.Path(); hole.moveTo(-aw / 2, 0); hole.lineTo(-aw / 2, ah - aw / 2); hole.absarc(0, ah - aw / 2, aw / 2, Math.PI, 0, true); hole.lineTo(aw / 2, 0); hole.lineTo(-aw / 2, 0); sh.holes.push(hole);
    const eg = new THREE.ExtrudeGeometry(sh, { depth: gd, bevelEnabled: false, curveSegments: 24 }); eg.translate(0, ground(0, z), z - gd / 2 - 1);
    add('stone', eg);
    // voussoirs: a ring of larger stones around the arch
    const vs = 15; for (let i = 0; i <= vs; i++) { const a = Math.PI * i / vs, rr = aw / 2 + 0.75; const b = new THREE.BoxGeometry(0.95, 1.6, 0.6); b.rotateZ(a - Math.PI / 2); b.translate(Math.cos(a) * rr, ground(0, z) + ah - aw / 2 + Math.sin(a) * rr, z + gd / 2 - 0.7); add('stone', b); }
    // inner glow (warm light from the gate passage) + portcullis
    const gy = ground(0, z);
    const glowG = new THREE.PlaneGeometry(aw, ah); glowG.translate(0, gy + ah / 2, z - 3); const glowM = basicFogMat(0xffa24a, 2.2); EMIS.push(new THREE.Mesh(glowG, glowM));
    const gate2 = new THREE.PlaneGeometry(aw * 0.8, ah * 0.75); gate2.translate(0, gy + ah * 0.37, z - 6); EMIS.push(new THREE.Mesh(gate2, basicFogMat(0xffd08a, 3.5)));
    for (let i = -4; i <= 4; i++) add('iron', boxAt(0.22, ah * 0.45, 0.22, i * aw / 9.5, gy + ah - aw / 2 - ah * 0.2 + 0.6, z + gd / 2 - 3.2));
    for (let j = 0; j < 4; j++) add('iron', boxAt(aw, 0.2, 0.22, 0, gy + ah - aw / 2 - 1.6 - j * 1.4, z + gd / 2 - 3.2));
    LIGHTS.push({ p: new THREE.Vector3(0, gy + 4.5, z + gd / 2 + 3), col: 0xffa24a, int: 1400, dist: 60 });
    LIGHTS.push({ p: new THREE.Vector3(0, gy + 6, z + 2), col: 0xffb060, int: 600, dist: 30 });
    WINS.push({ p: new THREE.Vector3(0, gy + ah * 0.45, z + gd / 2 - 2), lit: 2, w: aw, gate: true });
    // gatehouse crown: corbels + merlons
    const top = ground(0, z) + gh;
    for (let i = 0; i < 16; i++) add('stone', boxAt(0.55, 1.4, 0.9, -gw / 2 + 1 + i * (gw - 2) / 15, top - 1.0, z + gd / 2 - 0.6));
    add('stone', boxAt(gw + 1.2, 1.0, gd + 1.2, 0, top, z - 1));
    parapet(-gw / 2 - 0.4, z + gd / 2 - 0.2, gw / 2 + 0.4, z + gd / 2 - 0.2, () => top + 0.5, { mw: 1.5, gap: 1.0, mh: 1.9 });
    // windows above the gate + banners
    windowAt(-5.5, top - 7.5, z + gd / 2 - 0.9, 0, 1, 1.2, 2.4, 1); windowAt(5.5, top - 7.5, z + gd / 2 - 0.9, 0, 1, 1.2, 2.4, 1); windowAt(0, top - 6.8, z + gd / 2 - 0.9, 0, 1, 1.4, 2.8, 0.9);
    BANNERS.push({ x: -9.6, y: top - 0.6, z: z + gd / 2 - 0.4, w: 3.6, h: 12.5 }, { x: 9.6, y: top - 0.6, z: z + gd / 2 - 0.4, w: 3.6, h: 12.5 });
    torchAt(-6.6, gy, z + gd / 2 + 0.6, 1.25, true); torchAt(6.6, gy, z + gd / 2 + 0.6, 1.25, true);
  }
  // gate towers
  for (const s of [-1, 1]) roundTower(s * 21.5, wallZ(21.5) + 3.5, 9.2, 33, { roof: 15, roofOv: 0.82, roofLift: 2.2, flag: s, win: [[Math.PI / 2 + s * 0.25, 9, 1], [Math.PI / 2 - s * 0.35, 18, 0.9], [Math.PI / 2 + s * 0.15, 26, 1, 1.0, 2.0], [Math.PI / 2 + s * 0.85, 13, 0.6]] });
  // curtain walls + towers marching up the flanks
  const TX = [30.5, 82, 136, 184, 228, 268, 306];
  for (const s of [-1, 1]) {
    for (let i = 0; i < TX.length - 1; i++) curtain(Math.min(s * TX[i], s * TX[i + 1]), Math.max(s * TX[i], s * TX[i + 1]), HW, T, { torchStep: i < 2 ? 22 : 34 });
    for (let i = 1; i < TX.length; i++) {
      const x = s * TX[i], z = wallZ(x);
      if (i % 2 === 1) squareTower(x, z + 1, 12, 12, 25, { win: [[0, 10, 0.8], [0.45 * (R() > .5 ? 1 : -1), 17, R() > 0.4 ? 1 : 0]] });
      else roundTower(x, z + 1, 6.6, 28, { roof: 11, roofOv: 1.05, flag: s, win: [[Math.PI / 2, 14, R() > 0.3 ? 1 : 0.5], [Math.PI / 2 - s * 0.6, 21, 0.8, 0.9, 1.7]] });
    }
  }
  // the citadel behind the wall
  const cz = -82, kb = ground(0, cz - 14);
  squareTower(0, cz - 14, 22, 20, 47, { roof: 22, flag: 1, flagLen: 11, base: kb, win: [[-0.5, 30, 1], [0, 30, 1], [0.5, 30, 0.9], [-0.5, 38, 0.8], [0.5, 38, 1], [0, 21, 0.7], [-0.5, 21, 0.9], [0.5, 21, 0]] });
  for (const s of [-1, 1]) {
    roundTower(s * 11.8, cz - 3.4, 2.3, 50, { roof: 7, roofOv: 1.2, base: kb, win: [[Math.PI / 2, 43, 1, 0.7, 1.4]] });
    roundTower(s * 11.8, cz - 24.6, 2.3, 50, { roof: 7, roofOv: 1.2, base: kb });
    roundTower(s * 33, cz + 6, 7.4, 39, { roof: 19, roofOv: 1.0, flag: s, flagLen: 8, win: [[Math.PI / 2, 22, 1], [Math.PI / 2 + s * 0.5, 30, 0.9], [Math.PI / 2 - s * 0.4, 14, 0.7]] });
    roundTower(s * 62, cz - 18, 5.4, 49, { roof: 17, roofOv: 1.05, flag: s, flagLen: 7, win: [[Math.PI / 2, 38, 1], [Math.PI / 2 + s * 0.3, 27, 0.8]] });
    // inner curtain: tower -> tower
    const pts = [[s * 14, cz + 1], [s * 33, cz + 6], [s * 62, cz - 18]];
    for (let k = 0; k < 2; k++) {
      const [ax, az] = pts[k], [bx, bz] = pts[k + 1], L = Math.hypot(bx - ax, bz - az), ry = Math.atan2(-(bz - az), bx - ax), gy = Math.min(ground(ax, az), ground(bx, bz)) - 4, ty = ground((ax + bx) / 2, (az + bz) / 2) + 22;
      add('stone', boxAt(L, ty - gy, 5, (ax + bx) / 2, (ty + gy) / 2, (az + bz) / 2, ry));
      const x0 = Math.min(ax, bx) === ax ? ax : bx, z0 = x0 === ax ? az : bz, x1 = x0 === ax ? bx : ax, z1 = x0 === ax ? bz : az;
      parapet(x0, z0, x1, z1, () => ty, { off: 2.2, mw: 1.3, gap: 0.9, mh: 1.6 });
      let nx = -(bz - az) / L, nz = (bx - ax) / L; if (nz < 0) { nx = -nx; nz = -nz; }
      for (let w = 0; w < 3; w++) { const t = (w + 0.6) / 3.2; windowAt(ax + (bx - ax) * t + nx * 2.5, ty - 8, az + (bz - az) * t + nz * 2.5, nx, nz, 1.0, 2.0, R() > 0.3 ? 1 : 0.5); }
    }
    // a great hall with a steep gable roof between the keep and the side tower
    const hx = s * 21.5, hz = cz - 8, hy = ground(hx, hz), hw = 12, hd = 12, hh = 14, rh = 9;
    add('stone', boxAt(hw, hh + 5, hd, hx, hy + (hh - 5) / 2, hz));
    const tri = new THREE.Shape(); tri.moveTo(-hd / 2 - 0.7, 0); tri.lineTo(hd / 2 + 0.7, 0); tri.lineTo(0, rh); tri.lineTo(-hd / 2 - 0.7, 0);
    const rg = new THREE.ExtrudeGeometry(tri, { depth: hw + 1.0, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(hx - (hw + 1.0) / 2, hy + hh, hz);
    add('roof', rg, (px, py, pz, nx, ny, nz) => Math.abs(nx) > 0.9 ? [pz, py - hy] : [px, (py - hy - hh) * 1.25 + (nz > 0 ? 0 : 50)]);
    for (let w = 0; w < 3; w++) windowAt(hx - hw / 2 + (w + 0.5) * hw / 3, hy + 5, hz + hd / 2, 0, 1, 1.1, 3.0, 1);
  }
  // foreground: road torches, rocks, pines
  for (let z = 40; z < 330; z += 34) for (const s of [-1, 1]) { const x = roadX(z) + s * 7.5; torchAt(x, ground(x, z), z, 1.1, z < 110); }
  rocks(); pines();
}
const BANNERS = [];
function rocks() {
  const g0 = new THREE.IcosahedronGeometry(1, 3); const gs = [];
  for (let i = 0; i < 70; i++) {
    let x, z; do { x = (R() - 0.5) * 520; z = 30 + R() * 300; } while (Math.abs(x - roadX(z)) < 12);
    const s = 0.8 + R() * R() * 6; const g = g0.clone(); const p = g.attributes.position;
    const sd = R() * 100;
    for (let k = 0; k < p.count; k++) { const vx = p.getX(k), vy = p.getY(k), vz = p.getZ(k); const d = 1 + 0.35 * N.fbm(vx * 1.3 + sd, vz * 1.3 + vy, 3) + 0.15 * N.n2(vx * 4 + sd, vy * 4); p.setXYZ(k, vx * d * s * (1 + R() * 0.0), vy * d * s * 0.62, vz * d * s); }
    g.rotateY(R() * 6); g.translate(x, ground(x, z) + s * 0.15, z); g.computeVertexNormals(); gs.push(g);
  }
  for (const g of gs) add('rock', g, (x, y, z) => [x + z, y]);
}
function pines() {
  const tiers = (h) => { const gs = []; const n = 5; for (let i = 0; i < n; i++) { const t = i / n; const c = new THREE.ConeGeometry(h * 0.32 * (1 - t * 0.75), h * 0.36, 9, 1); c.translate(0, h * (0.16 + t * 0.62), 0); gs.push(c.toNonIndexed()); } const tr = new THREE.CylinderGeometry(h * 0.025, h * 0.04, h * 0.3, 6).toNonIndexed(); tr.translate(0, h * 0.12, 0); gs.push(tr); return mergeGeometries(gs.map((g) => { g.deleteAttribute('uv'); return g; })); };
  const base = [tiers(1)]; const all = [];
  for (let i = 0; i < 260; i++) {
    let x, z; const side = R() < 0.5 ? -1 : 1;
    x = side * (60 + R() * 380); z = -40 + R() * 360 - Math.abs(x) * 0.25;
    if (Math.abs(x - roadX(z)) < 16) continue;
    const gy = ground(x, z); if (gy > 150) continue;
    const h = 9 + R() * 12; const g = base[0].clone();
    const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const a = N.n2(p.getX(k) * 9 + i, p.getY(k) * 9) * 0.08; p.setXYZ(k, p.getX(k) * (1 + a), p.getY(k), p.getZ(k) * (1 + a)); }
    g.scale(h, h, h); g.rotateY(R() * 6); g.translate(x, gy - 0.5, z); all.push(g);
  }
  for (const g of all) { g.computeVertexNormals(); add('pine', g, (x, y, z) => [x, y]); }
}

// ------------------------------------------------------------------ the mountain layer (mid + far ranges)
function range(zc, depth, x0, x1, peak, env, seed, res) {
  const nx = res[0], nz = res[1]; const g = new THREE.PlaneGeometry(x1 - x0, depth, nx, nz); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0, zc);
  const p = g.attributes.position; const NN = makeNoise(seed);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const wx = x + NN.fbm(x / 900, z / 900, 3) * 260, wz = z + NN.fbm(x / 900 + 5, z / 900, 3) * 260;
    let r = 0, amp = 1, f = 1 / 700, prev = 1;
    for (let o = 0; o < 8; o++) { let n = 1 - Math.abs(NN.n2(wx * f, wz * f)); n = n * n; r += n * amp * prev; prev = clamp(n * 1.6, 0, 1); amp *= 0.48; f *= 2.07; }
    const tz = (z - (zc - depth / 2)) / depth;          // 0 back .. 1 front
    const fall = Math.sin(clamp(tz, 0, 1) * Math.PI) ** 0.6;
    p.setY(i, (r * 0.62) * peak * env(x) * fall - 30 + NN.fbm(x / 200, z / 200, 3) * 20);
  }
  g.computeVertexNormals(); return g;
}
function buildMountains() {
  const far = range(-3200, 1500, -3400, 3400, 1500, (x) => 0.55 + 0.45 * Math.exp(-((((x + 900) / 900)) ** 2)) + 0.4 * Math.exp(-((((x - 1300) / 800)) ** 2)), 31, [700, 220]);
  add('mtnFar', far, (x, y, z) => [x, z]);
  const mid = range(-1500, 900, -1900, 1900, 560, (x) => 0.45 + 0.55 * smooth(100, 1100, Math.abs(x)) + 0.35 * Math.exp(-((((x - 260) / 260)) ** 2)), 57, [760, 240]);
  add('mtnMid', mid, (x, y, z) => [x, z]);
}

// ------------------------------------------------------------------ banners & flags (cloth with folds, canvas emblem)
function emblemTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 768; const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, '#0a1838'); gr.addColorStop(0.5, '#142a5c'); gr.addColorStop(1, '#0a1838');
  x.fillStyle = gr; x.fillRect(0, 0, 256, 768);
  x.strokeStyle = '#c9d6e8'; x.lineWidth = 10; x.strokeRect(14, 0, 228, 720);
  // swallowtail end
  x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(0, 768); x.lineTo(128, 640); x.lineTo(256, 768); x.closePath(); x.fill(); x.globalCompositeOperation = 'source-over';
  x.strokeStyle = '#c9d6e8'; x.lineWidth = 8; x.beginPath(); x.moveTo(14, 720); x.lineTo(128, 615); x.lineTo(242, 720); x.stroke();
  // crown emblem
  x.fillStyle = '#d8e8ff'; x.save(); x.translate(128, 300); x.beginPath();
  x.moveTo(-70, 40); x.lineTo(-80, -40); x.lineTo(-40, 0); x.lineTo(0, -70); x.lineTo(40, 0); x.lineTo(80, -40); x.lineTo(70, 40); x.closePath(); x.fill();
  x.fillRect(-72, 50, 144, 22); for (const [cx, cy] of [[-80, -48], [0, -82], [80, -48]]) { x.beginPath(); x.arc(cx, cy, 11, 0, 7); x.fill(); }
  x.fillStyle = '#4aa8ff'; x.beginPath(); x.arc(0, 18, 12, 0, 7); x.fill();
  // tower / wall glyph below
  x.fillStyle = '#d8e8ff'; x.fillRect(-60, 150, 120, 70); for (let i = 0; i < 5; i++) x.fillRect(-60 + i * 27, 130, 14, 22);
  x.fillStyle = '#142a5c'; x.beginPath(); x.moveTo(-12, 220); x.lineTo(-12, 190); x.arc(0, 190, 12, Math.PI, 0); x.lineTo(12, 220); x.fill();
  x.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function buildCloth() {
  const tex = emblemTex();
  const bm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82, side: THREE.DoubleSide, alphaTest: 0.5, transparent: false });
  bm.onBeforeCompile = (s) => { s.fragmentShader = s.fragmentShader.replace('#include <fog_fragment>', ''); };
  for (const b of BANNERS) {
    const g = new THREE.PlaneGeometry(b.w, b.h, 12, 30); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i) / b.w, v = (p.getY(i) + b.h / 2) / b.h; p.setZ(i, 0.18 * Math.sin(u * 9 + v * 2) * (1 - v) + 0.25 * (1 - v) * (1 - v)); }
    g.translate(b.x, b.y - b.h / 2, b.z + 0.1); g.computeVertexNormals(); scene.add(new THREE.Mesh(g, bm));
    add('iron', boxAt(b.w + 0.8, 0.22, 0.22, b.x, b.y + 0.05, b.z + 0.2));
  }
  const fm = new THREE.MeshStandardMaterial({ color: 0x173a7a, roughness: 0.75, side: THREE.DoubleSide });
  const fm2 = new THREE.MeshStandardMaterial({ color: 0xbcd4f0, roughness: 0.75, side: THREE.DoubleSide });
  for (const f of FLAGS) {
    const L = f.len, Hh = L * 0.36; const g = new THREE.PlaneGeometry(L, Hh, 24, 4); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i) / L + 0.5, y = p.getY(i); p.setY(i, y * (1 - 0.82 * u) - u * u * 0.6); p.setZ(i, Math.sin(u * 7.5 + f.x) * 0.55 * u); }
    g.translate(L / 2, 0, 0); if (f.dir < 0) g.rotateY(Math.PI); g.rotateY(0.35 * f.dir); g.translate(f.x, f.y - Hh * 0.35, f.z); g.computeVertexNormals();
    scene.add(new THREE.Mesh(g, (Math.round(f.x) % 3 === 0) ? fm2 : fm));
    add('steel', cyl(0.08, 0.08, 3.2, f.x, f.y - 2.6, f.z, 6));
  }
}

// ------------------------------------------------------------------ assemble, light, render
(async () => {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = +(Q.get('exp') || 1.0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  const cam = new THREE.PerspectiveCamera(C.fov, W / H, 1, 9000); cam.position.set(...C.pos); cam.lookAt(...C.tgt);

  // env: dim night sky gradient for steel reflections
  {
    const es = new THREE.Scene(); const sg = new THREE.SphereGeometry(10, 32, 16); const cols = []; const p = sg.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 10; const c = new THREE.Color().lerpColors(new THREE.Color(0x0a1530), new THREE.Color(0x6d8fc8), clamp(y * 0.5 + 0.5, 0, 1) ** 2); cols.push(c.r, c.g, c.b); }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    es.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const moonM = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xdde8ff).multiplyScalar(8) })); moonM.position.copy(MOON).multiplyScalar(9); es.add(moonM);
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, 0.02).texture;
  }
  if (LAYER === 'mtn') { FOG.d = 0.00042; FOG.h = 420; FOG.base = 0; buildMountains(); }
  else { FOG.d = 0.0013; FOG.h = 38; FOG.base = 0; buildWall(); buildCloth(); }
  if (Q.get('fogd')) FOG.d = +Q.get('fogd');

  const MATS = {
    stone: surfMat(0, { stone: 0x7d8aa3, mortar: 0x2b3242, rowH: 0.62, stoneW: 1.3, bump: 1.2 }),
    roof: surfMat(1, { stone: 0x1f3a72, metal: 0.35, env: 0.8, bump: 0.8, snow: 0.55 }),
    terrain: surfMat(2, { mortar: 0x4a5468, rowH: 0.05, stoneW: 0.72, snow: -30, bump: 0.6 }),
    mtnMid: surfMat(2, { mortar: 0x3c475c, rowH: 0.006, stoneW: 0.6, snow: 120, bump: 0.25 }),
    mtnFar: surfMat(2, { mortar: 0x3c475c, rowH: 0.003, stoneW: 0.58, snow: 380, bump: 0.2 }),
    rock: surfMat(4, { stone: 0x4d576a, bump: 1.4, snow: 1.0 }),
    pine: surfMat(3, { stone: 0x12262a, bump: 0.8, snow: 0.85 }),
    frame: surfMat(4, { stone: 0x111722, bump: 0.2, snow: 0 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x1a1d24, metalness: 0.8, roughness: 0.45 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xc8d4e6, metalness: 1.0, roughness: 0.22, envMapIntensity: 1.6 }),
    winH: basicFogMat(0xffb35c, 3.2), winL: basicFogMat(0xff9840, 1.6), flame: basicFogMat(0xffa040, 6.0),
  };
  for (const k in BUCK) {
    const g = mergeGeometries(BUCK[k].map((x) => { for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'muv'].includes(a)) x.deleteAttribute(a); if (!x.attributes.muv) setMuv(x, () => [0, 0]); return x; }));
    const mesh = new THREE.Mesh(g, MATS[k]); mesh.castShadow = !k.startsWith('mtn') && k !== 'terrain'; mesh.receiveShadow = true; scene.add(mesh);
    if (MATS[k].userData.emissive) EMIS.push(mesh);
  }
  for (const m of EMIS) if (!m.parent) scene.add(m);

  // lights: moon (key), sky fill, warm practicals
  const moon = new THREE.DirectionalLight(0xbfd3ff, +(Q.get('moon') || 3.4)); moon.position.copy(MOON).multiplyScalar(600); moon.target.position.set(0, 0, -40);
  moon.castShadow = true; moon.shadow.mapSize.set(4096, 4096); const sc = moon.shadow.camera;
  if (LAYER === 'mtn') { moon.position.copy(MOON).multiplyScalar(5000); moon.target.position.set(0, 0, -2200); sc.left = -3600; sc.right = 3600; sc.top = 2400; sc.bottom = -2400; sc.near = 10; sc.far = 12000; moon.shadow.bias = -0.0008; moon.shadow.normalBias = 4; }
  else { sc.left = -330; sc.right = 330; sc.top = 200; sc.bottom = -200; sc.near = 10; sc.far = 1400; moon.shadow.bias = -0.0004; moon.shadow.normalBias = 0.25; }
  scene.add(moon, moon.target);
  scene.add(new THREE.HemisphereLight(0x5574b0, 0x0b1222, +(Q.get('hemi') || 0.75)));
  const fill = new THREE.DirectionalLight(0x2a4a8a, 0.55); fill.position.set(0.3, 0.4, 1).multiplyScalar(500); scene.add(fill);   // cool bounce from the camera side
  if (LAYER !== 'mtn') for (const l of LIGHTS) { const pl = new THREE.PointLight(l.col, l.int, l.dist, 2); pl.position.copy(l.p); scene.add(pl); }

  // ---------------- beauty
  renderer.render(scene, cam);
  const beauty = renderer.domElement.toDataURL('image/png');
  // ---------------- emissive pass (bloom source): everything black except emissive
  const keep = new Map(); const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  scene.traverse((o) => { if (o.isMesh) { keep.set(o, o.material); if (!o.material.userData.emissive) o.material = black; } });
  const bg = scene.environment; scene.environment = null; renderer.toneMapping = THREE.NoToneMapping;
  renderer.render(scene, cam);
  const emis = renderer.domElement.toDataURL('image/png');
  // ---------------- practical-light positions in normalised screen coords (for the runtime flicker / ignite overlays)
  const proj = (v) => { const p = v.clone().project(cam); return [+(p.x * 0.5 + 0.5).toFixed(4), +(0.5 - p.y * 0.5).toFixed(4), +p.z.toFixed(4)]; };
  const pts = {
    torch: TORCH.map((t) => [...proj(t.p), t.big]), win: WINS.map((w) => [...proj(w.p), w.lit, w.w, w.gate ? 1 : 0]),
    flag: FLAGS.map((f) => [...proj(new THREE.Vector3(f.x, f.y, f.z)), f.dir]),
  };
  window.__out = { beauty, emis, pts, cam: { pos: C.pos, tgt: C.tgt, fov: C.fov } };
  window.__done = true;
})().catch((e) => { window.__err = String(e && e.stack || e); console.error(e); });
