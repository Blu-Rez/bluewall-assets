// Spell effects v2 — mesh and shader work, drawn on top of the particle pools in bfx.js (which stay for sparks, dust and motes).
//   const sp = createSpellFX(scene, { height, camera, fx });          // height(x, z) = ground, fx = the bfx api (spark / dust / flash / puff)
//   sp.cast('freeze', x, z, r, dur)     the spell lands: a rune on the ground (it follows the hills), a shock wave, then the spell's own show
//   sp.bolt(x, z)                       one lightning strike: a jagged ribbon with branches that strobes, a scorch mark, a flash
//   sp.frozen(x, z, w, h, dur, d, rot)  a building is frozen (owner 5 Oct): a pale-blue ice shell grows up over it, crystals around its feet, frost glitters, it shatters when the spell ends
//   sp.update(dt)   sp.clear()   sp.dispose()   sp.stats()
// What is drawn (at most):  8 rune discs, 1 bolt ribbon mesh, 2 ice domes, 1 ice crystals, 1 quake rocks, 1 heal beams, 1 flames, 1 scorch decals.  Nothing is drawn while nothing is cast.
import * as THREE from 'three';

const TAU = Math.PI * 2, rnd = Math.random, lerp = (a, b, k) => a + (b - a) * k, clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const outCubic = (k) => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
const backOut = (k) => { k = clamp(k, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };

const ADD = { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor };
const PRE = { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };   // (rgb adds light, alpha darkens: one pass does glow and scorch)

const NOISE = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
`;

// ------------------------------------------------------------------ the rune disc (ground)
const DISC_V = `varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const DISC_F = `
precision highp float;
uniform float uT, uLife, uType, uW; uniform vec3 uCol; varying vec2 vP;
${NOISE}
float ln(float d, float w){ return 1.0 - smoothstep(0.0, w, abs(d)); }
vec2 vor(vec2 p){ vec2 g = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j)); vec2 h = vec2(hash(g + o), hash(g + o + 17.3)); vec2 d = o + h - f; float dd = dot(d, d); if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd; }
  return sqrt(vec2(d1, d2)); }
float polyD(vec2 p, float n, float R){ float a = atan(p.y, p.x), s = 6.2831853 / n; return cos(floor(0.5 + a / s) * s - a) * length(p) - R; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
void main(){
  float r = length(vP); if (r > 1.0) discard;
  float a = atan(vP.y, vP.x), w = uW;
  float env = smoothstep(0.0, 0.3, uT) * (1.0 - smoothstep(uLife - 0.9, uLife, uT));
  if (uType > 4.5) env = 1.0 - smoothstep(uLife - 0.5, uLife, uT);                                   // (impact: no fade-in)
  float rim = 0.0, tick = 0.0, g = 0.0, dark = 0.0; vec3 add = vec3(0.0);
  vec2 p = rot(uT * (uType > 2.5 && uType < 3.5 ? 0.55 : 0.28)) * vP;
  if (uType < 4.5) {
    rim = ln(r - 0.965, w * 1.6) + ln(r - 0.9, w * 0.9) * 0.8;
    tick = ln(fract((a + uT * 0.12) * 7.639437) - 0.5, 0.09) * step(0.915, r) * step(r, 0.955);
  }
  if (uType < 0.5) {                                                    // lightning: a hexagram around a ring
    g = max(ln(polyD(p, 3.0, 0.4), w * 1.3), ln(polyD(-p, 3.0, 0.4), w * 1.3)) + ln(r - 0.3, w) * 0.7 + ln(r - 0.1, w) * 0.8;
  } else if (uType < 1.5) {                                             // heal: hexagon, ring and a plus
    float cr = max(ln(p.x, w * 1.5) * step(abs(p.y), 0.3), ln(p.y, w * 1.5) * step(abs(p.x), 0.3));
    g = ln(polyD(p, 6.0, 0.56), w * 1.2) + ln(r - 0.72, w) * 0.8 + ln(r - 0.34, w) * 0.7 + cr;
  } else if (uType < 2.5) {                                             // frost: a snowflake
    float sa = 6.2831853 / 6.0, aa = abs(mod(atan(p.y, p.x) + sa * 0.5, sa) - sa * 0.5); vec2 q = vec2(cos(aa), sin(aa)) * length(p);
    g = ln(q.y, w * 1.3) * step(0.0, q.x) * step(q.x, 0.78);
    g += ln(q.y - (q.x - 0.30) * 1.2, w * 1.1) * step(0.30, q.x) * step(q.x, 0.46);
    g += ln(q.y - (q.x - 0.52) * 1.2, w * 1.1) * step(0.52, q.x) * step(q.x, 0.66);
    g += ln(r - 0.16, w) * 0.9;
  } else if (uType < 3.5) {                                             // rage: a ring of spikes
    float tri = abs(fract(atan(p.y, p.x) * 1.5915494 * 1.0) - 0.5) * 2.0;
    g = ln(r - (0.4 + 0.36 * tri), w * 1.4) + ln(r - 0.2, w) * 0.8;
    dark += 0.22 * (1.0 - smoothstep(0.9, 1.0, r)); add += vec3(0.32, 0.04, 0.0) * (1.0 - smoothstep(0.0, 1.0, r)) * 0.8;
  } else if (uType < 4.5) {                                             // quake: cracks spread from the middle, glowing first, scars after
    g = ln(r - 0.55, w * 1.2) * 0.5;
    vec2 pp = vP * 3.4; pp += 0.45 * vec2(noise(pp * 1.7), noise(pp * 1.7 + 9.0));
    vec2 v = vor(pp); float e = v.y - v.x;
    float prog = 1.15 * (1.0 - pow(1.0 - clamp(uT / 0.9, 0.0, 1.0), 2.0));
    float reach = smoothstep(prog, prog - 0.18, r) * (1.0 - smoothstep(0.82, 0.98, r));
    float cr = (1.0 - smoothstep(0.0, 0.09, e)) * reach, core = (1.0 - smoothstep(0.0, 0.03, e)) * reach;
    dark += cr * 0.9 + noise(vP * 7.0) * 0.2 * (1.0 - r) * smoothstep(0.0, 0.5, uT);
    add += vec3(1.0, 0.48, 0.12) * core * (1.0 - smoothstep(0.4, 3.2, uT)) * 1.4;
  }
  if (uType > 1.5 && uType < 2.5) {                                     // frost: a crystalline sheet spreading outward
    vec2 pp = vP * 4.6; pp += vec2(noise(pp), noise(pp + 5.0)) * 0.6;
    vec2 v = vor(pp); float e = v.y - v.x;
    float prog = 1.2 * outCubicF(clamp(uT / 0.8, 0.0, 1.0));
    float reach = smoothstep(prog, prog - 0.2, r) * (1.0 - smoothstep(0.9, 1.0, r));
    float cell = 1.0 - smoothstep(0.0, 0.08, e), sp = pow(noise(vP * 46.0 + floor(uT * 3.0)), 9.0) * 3.0;
    dark += reach * 0.34;                                                // (the grass under the frost goes grey-blue: the sheet is not green)
    add += (vec3(0.28, 0.5, 0.85) * (0.25 + 0.3 * noise(vP * 9.0)) + uCol * cell * 0.55 + vec3(1.0) * sp * 0.5) * reach;
  }
  float sw = clamp(uT / 0.6, 0.0, 1.0), sr = 1.0 - pow(1.0 - sw, 3.0);
  float wave = ln(r - sr, 0.05 + 0.1 * (1.0 - sw)) * (1.0 - sw);
  float flash = (1.0 - smoothstep(0.0, 0.85, r)) * (1.0 - smoothstep(0.0, 0.4, uT));
  float pulse = 0.0; if (uType > 0.5 && uType < 1.5 || uType > 2.5 && uType < 3.5) { float rp = fract(uT * 0.65); pulse = ln(r - rp * 0.95, 0.04) * (1.0 - rp) * 0.8; }
  float breathe = 0.78 + 0.22 * sin(uT * 4.0);
  float glow = (0.11 + 0.1 * smoothstep(0.55, 1.0, r)) * (1.0 - smoothstep(0.97, 1.0, r)); if (uType > 4.5) glow = 0.0;
  float ink = (rim + tick * 0.8) * 0.9 + g; float wk = uType < 0.5 ? 1.0 : 0.42; if (uType > 3.5 && uType < 4.5) ink *= 0.4;
  add += uCol * (ink * breathe * 0.95 + glow + wave * 1.1 + pulse + flash * 0.7) + vec3(1.0) * (ink * 0.28 + flash * 0.5 + wave * 0.3) * wk;
  gl_FragColor = vec4(add * env, dark * env);
}`.replace('outCubicF(clamp(uT / 0.8, 0.0, 1.0))', '(1.0 - pow(1.0 - clamp(uT / 0.8, 0.0, 1.0), 3.0))');

// ------------------------------------------------------------------ lightning ribbons
const BOLT_V = `attribute vec2 aUV; attribute vec2 aK; uniform float uNow; varying vec2 vUV; varying float vE; varying float vK;
void main(){ vUV = aUV; vK = aK.y; float age = uNow - aK.x;
  float e = age < 0.0 ? 0.0 : (age < 0.07 ? 1.0 : (age < 0.11 ? 0.22 : (age < 0.2 ? 0.95 : exp(-(age - 0.2) * 7.0))));
  if (age > 0.9) e = 0.0; vE = e; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const BOLT_F = `precision highp float; varying vec2 vUV; varying float vE; varying float vK;
void main(){ if (vE < 0.01) discard; float x = abs(vUV.x), core = 1.0 - smoothstep(0.0, 0.3, x), halo = exp(-x * x * 3.4);
  vec3 c = mix(vec3(0.36, 0.58, 1.0), vec3(1.0), core) * (halo * 0.85 + core * 1.3) * vE * (vK > 0.5 ? 0.62 : 1.0); gl_FragColor = vec4(c, 1.0); }`;

// ------------------------------------------------------------------ shared instancing prefix for the small meshes
const INST_V = `
#ifdef USE_INSTANCING
  lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
#endif`;

const CRYSTAL_V = `varying vec3 vN, vV; varying float vA, vY, vG;
void main(){ vec4 lp = vec4(position, 1.0); vec3 n = normal; ${INST_V}
  vec4 mv = modelViewMatrix * lp; vN = normalMatrix * n; vV = -mv.xyz; vY = clamp(position.y, 0.0, 1.0);
#ifdef USE_INSTANCING_COLOR
  vA = instanceColor.r; vG = instanceColor.g;
#else
  vA = 1.0; vG = 0.0;
#endif
  gl_Position = projectionMatrix * mv; }`;
const CRYSTAL_F = `precision highp float; varying vec3 vN, vV; varying float vA, vY, vG; uniform float uNow;
void main(){ vec3 n = normalize(vN), v = normalize(vV); float fr = pow(1.0 - abs(dot(n, v)), 2.0);
  vec3 base = mix(vec3(0.2, 0.5, 0.88), vec3(0.78, 0.95, 1.0), vY);
  float glint = pow(max(0.0, sin(uNow * 2.2 + vG * 40.0 + vY * 6.0)), 14.0) * 0.8;
  vec3 c = base * (0.55 + 0.45 * fr) + vec3(0.45, 0.78, 1.0) * fr * 0.85 + vec3(1.0) * glint * (0.3 + fr);
  gl_FragColor = vec4(c, vA * (0.62 + 0.36 * fr)); }`;

const BEAM_V = `varying float vY, vAng, vCyc, vSd; varying vec3 vN, vV;
void main(){ vec4 lp = vec4(position, 1.0); vec3 n = normal; ${INST_V}
  vec4 mv = modelViewMatrix * lp; vN = normalMatrix * n; vV = -mv.xyz;
  vY = clamp(position.y, 0.0, 1.0); vAng = atan(position.z, position.x);
#ifdef USE_INSTANCING_COLOR
  vCyc = instanceColor.r; vSd = instanceColor.g;
#else
  vCyc = 0.5; vSd = 0.0;
#endif
  gl_Position = projectionMatrix * mv; }`;
const BEAM_F = (flame) => `precision highp float; varying float vY, vAng, vCyc, vSd; varying vec3 vN, vV; uniform float uNow;
${NOISE}
void main(){
  float life = smoothstep(0.0, 0.22, vCyc) * (1.0 - smoothstep(0.7, 1.0, vCyc));
  float side = pow(abs(dot(normalize(vN), normalize(vV))), 0.9);
  ${flame ? `float fl = noise(vec2(vAng * 2.0 + vSd * 9.0, vY * 3.0 - uNow * 4.5));
  float a = clamp((1.0 - vY) * 1.25 + (fl - 0.5) * 1.1 - vY * 0.35, 0.0, 1.0) * life;
  vec3 c = mix(vec3(1.0, 0.62, 0.2), vec3(0.95, 0.12, 0.02), vY) * a * side * 1.6;`
  : `float streak = 0.55 + 0.45 * noise(vec2(vAng * 3.0 + vSd * 10.0, vY * 2.5 - uNow * 1.8));
  float a = pow(1.0 - vY, 1.4) * streak * life;
  vec3 c = mix(vec3(0.2, 0.95, 0.5), vec3(0.85, 1.0, 0.9), (1.0 - vY) * 0.5) * a * side * 1.15;`}
  gl_FragColor = vec4(c, 1.0); }`;

const DOME_V = `varying vec3 vN, vV, vL; void main(){ vL = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalMatrix * normal; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;
const DOME_F = `precision highp float; varying vec3 vN, vV, vL; uniform float uT; ${NOISE}
void main(){ vec3 n = normalize(vN), v = normalize(vV); float fr = pow(1.0 - abs(dot(n, v)), 2.2);
  float k = clamp(uT / 1.5, 0.0, 1.0), fade = smoothstep(0.0, 0.12, k) * (1.0 - smoothstep(0.45, 1.0, k));
  float facet = 0.6 + 0.4 * noise(vL.xz * 7.0 + vL.y * 5.0 + uT * 0.6);
  vec3 c = mix(vec3(0.38, 0.72, 1.0), vec3(0.95, 1.0, 1.0), fr) * (fr * 1.1 + 0.12 * facet);
  gl_FragColor = vec4(c * fade, 1.0); }`;

const SCORCH_V = `varying vec2 vP; varying float vAge, vSd; void main(){ vP = position.xz * 2.0;
#ifdef USE_INSTANCING_COLOR
  vAge = instanceColor.r; vSd = instanceColor.g;
#else
  vAge = 0.0; vSd = 0.0;
#endif
  vec4 lp = vec4(position, 1.0);
#ifdef USE_INSTANCING
  lp = instanceMatrix * lp;
#endif
  gl_Position = projectionMatrix * modelViewMatrix * lp; }`;
const SCORCH_F = `precision highp float; varying vec2 vP; varying float vAge, vSd; ${NOISE}
void main(){ float r = length(vP); if (r > 1.0) discard;
  float n = noise(vP * 3.2 + vSd * 31.0), edge = 0.55 + 0.4 * (n - 0.3), m = 1.0 - smoothstep(edge - 0.3, edge, r);
  float dark = m * 0.6 * (1.0 - smoothstep(0.5, 1.0, vAge)), ember = m * exp(-r * 3.0) * (1.0 - smoothstep(0.0, 0.07, vAge));
  gl_FragColor = vec4(vec3(1.0, 0.62, 0.3) * ember * 0.7, dark); }`;

// ------------------------------------------------------------------ the module
export function createSpellFX(scene, { height = () => 0, camera, fx = null } = {}) {
  const grp = new THREE.Group(); grp.name = 'spellfx'; scene.add(grp);
  const disposables = [];
  let now = 0;
  const uNow = { value: 0 };
  const mk = (geo, mat) => { disposables.push(geo, mat); return new THREE.Mesh(geo, mat); };

  // ---- rune discs: a flat grid that follows the hills, with the shader above
  const DISC_N = 8, GRID = 36, discs = [];
  const baseGeo = new THREE.PlaneGeometry(2, 2, GRID, GRID).rotateX(-Math.PI / 2);
  for (let i = 0; i < DISC_N; i++) {
    const g = baseGeo.clone();
    const m = new THREE.ShaderMaterial({ ...PRE, transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, uniforms: { uT: { value: 0 }, uLife: { value: 1 }, uType: { value: 0 }, uW: { value: 0.03 }, uCol: { value: new THREE.Color(1, 1, 1) } }, vertexShader: DISC_V, fragmentShader: DISC_F });
    const mesh = mk(g, m); mesh.visible = false; mesh.frustumCulled = false; mesh.renderOrder = 3; grp.add(mesh);
    discs.push({ mesh, t: 0, life: 0, on: false, seq: 0 });
  }
  let seq = 0;
  const COL = { lightning: [0.5, 0.78, 1.0], heal: [0.3, 1.0, 0.55], freeze: [0.62, 0.9, 1.0], rage: [1.0, 0.26, 0.07], quake: [0.95, 0.68, 0.38], impact: [0.6, 0.82, 1.0] };
  const TYPE = { lightning: 0, heal: 1, freeze: 2, rage: 3, quake: 4, impact: 5 };
  function disc(kind, x, z, r, life) {
    let d = discs.find((q) => !q.on); if (!d) d = discs.reduce((a, b) => (a.seq < b.seq ? a : b));
    d.on = true; d.t = 0; d.life = life; d.seq = ++seq; d.mesh.visible = true;
    const pos = d.mesh.geometry.attributes.position, base = height(x, z);
    for (let i = 0; i < pos.count; i++) pos.setY(i, height(x + pos.getX(i) * r, z + pos.getZ(i) * r) - base + 0.32);
    pos.needsUpdate = true; d.mesh.position.set(x, base, z); d.mesh.scale.set(r, 1, r);
    const u = d.mesh.material.uniforms; u.uType.value = TYPE[kind]; u.uLife.value = life; u.uT.value = 0; u.uW.value = Math.min(0.06, 0.34 / r); u.uCol.value.setRGB(...COL[kind]);
    return d;
  }

  // ---- lightning: one ribbon mesh holding up to 8 bolts (each: a main bolt and a few branches, two crossed quads per segment so it reads from any side)
  const MAXB = 8, SEG = 80, VPS = 8, NV = MAXB * SEG * VPS;
  const bPos = new Float32Array(NV * 3), bUV = new Float32Array(NV * 2), bK = new Float32Array(NV * 2).fill(-9), bIdx = new Uint32Array(MAXB * SEG * 2 * 6);
  for (let q = 0; q < MAXB * SEG * 2; q++) { const v = q * 4, o = q * 6; bIdx.set([v, v + 1, v + 2, v + 2, v + 1, v + 3], o); }
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3).setUsage(THREE.DynamicDrawUsage)); bGeo.setAttribute('aUV', new THREE.BufferAttribute(bUV, 2).setUsage(THREE.DynamicDrawUsage));
  bGeo.setAttribute('aK', new THREE.BufferAttribute(bK, 2).setUsage(THREE.DynamicDrawUsage)); bGeo.setIndex(new THREE.BufferAttribute(bIdx, 1));
  const bolts = new THREE.Mesh(bGeo, new THREE.ShaderMaterial({ ...ADD, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, uniforms: { uNow }, vertexShader: BOLT_V, fragmentShader: BOLT_F }));
  disposables.push(bGeo, bolts.material); bolts.frustumCulled = false; bolts.visible = false; bolts.renderOrder = 8; grp.add(bolts);
  const boltT = new Array(MAXB).fill(-9); let boltNext = 0;
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _t = new THREE.Vector3(), _s1 = new THREE.Vector3(), _s2 = new THREE.Vector3(), _v = new THREE.Vector3();
  function writeRibbon(slot, seg0, pts, w0, w1, kind, t0, camP) {
    const n = pts.length, sides1 = [], sides2 = [], widths = [];
    for (let i = 0; i < n; i++) {
      _t.copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize();
      _v.copy(camP).sub(pts[i]).normalize(); _s1.crossVectors(_t, _v); if (_s1.lengthSq() < 1e-6) _s1.set(1, 0, 0); _s1.normalize(); _s2.crossVectors(_t, _s1).normalize();
      sides1.push(_s1.clone()); sides2.push(_s2.clone()); widths.push(lerp(w0, w1, i / (n - 1)));
    }
    for (let i = 0; i < n - 1; i++) {
      const sg = seg0 + i; if (sg >= SEG) break;
      for (let qd = 0; qd < 2; qd++) {
        const v = ((slot * SEG + sg) * 2 + qd) * 4, S = qd ? sides2 : sides1;
        for (let k = 0; k < 4; k++) {
          const e = k >> 1, side = k & 1 ? -1 : 1, P = pts[i + e], W = widths[i + e], sd = S[i + e], o = (v + k) * 3;
          bPos[o] = P.x + sd.x * W * side; bPos[o + 1] = P.y + sd.y * W * side; bPos[o + 2] = P.z + sd.z * W * side;
          bUV[(v + k) * 2] = side; bUV[(v + k) * 2 + 1] = (i + e) / (n - 1);
          bK[(v + k) * 2] = t0; bK[(v + k) * 2 + 1] = kind;
        }
      }
    }
  }
  function bolt(x, z) {
    const gy = height(x, z), slot = boltNext; boltNext = (boltNext + 1) % MAXB;
    const camP = camera ? camera.position : _c.set(x, gy + 80, z + 80), dist = clamp(camP.distanceTo(_a.set(x, gy + 40, z)) / 110, 0.8, 3.2);
    const o0 = slot * SEG * VPS;
    bPos.fill(0, o0 * 3, (o0 + SEG * VPS) * 3); bK.fill(-9, o0 * 2, (o0 + SEG * VPS) * 2);
    let pts = [new THREE.Vector3(x + (rnd() - 0.5) * 30, gy + 105, z + (rnd() - 0.5) * 30), new THREE.Vector3(x, gy + 0.4, z)], off = 10;
    for (let lv = 0; lv < 5; lv++) {
      const nx = [];
      for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], m = a.clone().add(b).multiplyScalar(0.5); m.x += (rnd() - 0.5) * off; m.z += (rnd() - 0.5) * off; m.y += (rnd() - 0.5) * off * 0.25; nx.push(a, m); }
      nx.push(pts[pts.length - 1]); pts = nx; off *= 0.5;
    }
    writeRibbon(slot, 0, pts, 0.8 * dist, 2.1 * dist, 0, now, camP);
    let sg = pts.length - 1;
    const nb = 3 + (rnd() < 0.5 ? 1 : 0);
    for (let b = 0; b < nb && sg < SEG - 8; b++) {
      const i0 = 7 + Math.floor(rnd() * 19), cur = pts[i0].clone(), d = new THREE.Vector3((rnd() - 0.5) * 1.8, -0.5 - rnd() * 0.7, (rnd() - 0.5) * 1.8).normalize(), bp = [cur.clone()];
      for (let k = 0; k < 7; k++) { cur.addScaledVector(d, 4 + rnd() * 3); cur.x += (rnd() - 0.5) * 3; cur.z += (rnd() - 0.5) * 3; d.y = Math.max(-0.95, d.y - 0.05); d.normalize(); bp.push(cur.clone()); }
      writeRibbon(slot, sg, bp, 0.35 * dist, 0.9 * dist, 1, now + 0.02 * b, camP); sg += bp.length - 1;
    }
    bGeo.attributes.position.needsUpdate = bGeo.attributes.aUV.needsUpdate = bGeo.attributes.aK.needsUpdate = true;
    boltT[slot] = now; bolts.visible = true;
    // the strike itself: shock wave, scorch, sparks, a flash in the sky
    disc('impact', x, z, 7, 1.1); scorch(x, z, 4.6 + rnd() * 1.4);
    if (fx) { fx.flash(x, gy + 2, z, 24, [0.8, 0.9, 1]); fx.spark(x, gy + 1, z, 18, 15, [0.7, 0.86, 1]); fx.dust(x, gy + 0.4, z, 4, 4.5, 5, 1.5); }
    skyFlash(0.42);
  }

  // ---- the white flash of the whole sky (a DOM layer: no GPU cost)
  let flashEl = null, flashK = 0;
  function skyFlash(k) {
    if (typeof document === 'undefined') return;
    if (!flashEl) { flashEl = document.createElement('div'); flashEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:25;opacity:0;background:radial-gradient(ellipse at 50% 30%,rgba(210,230,255,.85),rgba(120,160,255,.35) 60%,rgba(80,110,220,.15))'; document.body.appendChild(flashEl); }
    flashK = Math.max(flashK, k);
  }

  // ---- scorch marks (instanced soft black decals with a cooling ember)
  const SC_N = 24, scorches = [];
  const scMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ ...PRE, transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, vertexShader: SCORCH_V, fragmentShader: SCORCH_F }), SC_N);
  disposables.push(scMesh.geometry, scMesh.material); scMesh.frustumCulled = false; scMesh.renderOrder = 3; scMesh.visible = false; grp.add(scMesh);
  const _col = new THREE.Color(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _sc = new THREE.Vector3(), _ps = new THREE.Vector3(), _zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < SC_N; i++) { scMesh.setMatrixAt(i, _zero); scMesh.setColorAt(i, _col.setRGB(1, 0, 0)); }
  let scNext = 0;
  function scorch(x, z, size) {
    const i = scNext; scNext = (scNext + 1) % SC_N; const gy = height(x, z);
    scorches[i] = { t: 0, life: 26 };
    _q.setFromEuler(_e.set(0, rnd() * TAU, 0)); _m.compose(_ps.set(x, gy + 0.3, z), _q, _sc.set(size * 2, 1, size * 2)); scMesh.setMatrixAt(i, _m);
    scMesh.setColorAt(i, _col.setRGB(0, rnd(), 0)); scMesh.instanceMatrix.needsUpdate = true; scMesh.instanceColor.needsUpdate = true; scMesh.visible = true;
  }

  // ---- ice: crystals (instanced spikes) and a dome
  const CR_N = 150, crystals = [];
  const crGeo = new THREE.CylinderGeometry(0.0, 0.5, 1, 6, 1).translate(0, 0.5, 0).toNonIndexed(); crGeo.computeVertexNormals();
  const crMesh = new THREE.InstancedMesh(crGeo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, uniforms: { uNow }, vertexShader: CRYSTAL_V, fragmentShader: CRYSTAL_F }), CR_N);
  disposables.push(crGeo, crMesh.material); crMesh.frustumCulled = false; crMesh.renderOrder = 4; crMesh.visible = false; grp.add(crMesh);
  for (let i = 0; i < CR_N; i++) { crMesh.setMatrixAt(i, _zero); crMesh.setColorAt(i, _col.setRGB(0, 0, 0)); }
  let crTop = 0;
  function crystal(x, gy, z, w, h, lean, delay, life) {
    let i = crystals.findIndex((q) => !q); if (i < 0) i = crystals.length; if (i >= CR_N) return;
    crystals[i] = { x, y: gy - 0.1, z, w, h, yaw: rnd() * TAU, lx: Math.cos(lean[0]) * lean[1], lz: Math.sin(lean[0]) * lean[1], t: -delay, life, g: rnd(), shat: false }; crTop = Math.max(crTop, i + 1);
  }
  const DOME_N = 2, domes = [];
  const domeGeo = new THREE.SphereGeometry(1, 32, 14, 0, TAU, 0, Math.PI / 2);
  for (let i = 0; i < DOME_N; i++) {
    const m = new THREE.ShaderMaterial({ ...ADD, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, uniforms: { uT: { value: 0 } }, vertexShader: DOME_V, fragmentShader: DOME_F });
    const mesh = new THREE.Mesh(domeGeo, m); mesh.visible = false; mesh.frustumCulled = false; mesh.renderOrder = 7; grp.add(mesh); disposables.push(m); domes.push({ mesh, t: 0, on: false, r: 1 });
  }
  disposables.push(domeGeo);

  // ---- quake rocks (instanced, lit by the sun)
  const RK_N = 44, rocks = [];
  const rkGeo = new THREE.IcosahedronGeometry(0.5, 0);
  const rkMesh = new THREE.InstancedMesh(rkGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), RK_N);
  disposables.push(rkGeo, rkMesh.material); rkMesh.frustumCulled = false; rkMesh.visible = false; grp.add(rkMesh);
  for (let i = 0; i < RK_N; i++) { rkMesh.setMatrixAt(i, _zero); rkMesh.setColorAt(i, _col.setRGB(0.4, 0.34, 0.27)); }
  function rockBurst(x, z, r) {
    for (let k = 0; k < 34; k++) {
      const i = rocks.findIndex((q) => !q); if (i < 0) break;
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * r * 0.85, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, sz = 0.9 + rnd() * rnd() * 2.6;
      rocks[i] = { x: px, z: pz, y: height(px, pz) + 0.3, vx: (rnd() - 0.5) * 5 + Math.cos(a) * 2, vz: (rnd() - 0.5) * 5 + Math.sin(a) * 2, vy: 9 + rnd() * 10, sz, rx: rnd() * TAU, ry: rnd() * TAU, wx: (rnd() - 0.5) * 7, wy: (rnd() - 0.5) * 7, t: -rnd() * 0.25, bounced: 0, rest: 0 };
      const b = 0.34 + rnd() * 0.14; rkMesh.setColorAt(i, _col.setRGB(b * 1.1, b * 0.95, b * 0.75));
    }
    rkMesh.instanceColor.needsUpdate = true; rkMesh.visible = true;
  }

  // ---- beams (healing light) and flames (rage), instanced; every beam lives a cycle (grow, hold, fade) and then starts again somewhere else in the zone
  const BM_N = 60, FL_N = 60;
  const mkBeams = (geo, flame, N, order) => {
    const m = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({ ...ADD, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, uniforms: { uNow }, vertexShader: BEAM_V, fragmentShader: BEAM_F(flame) }), N);
    disposables.push(geo, m.material); m.frustumCulled = false; m.renderOrder = order; m.visible = false; grp.add(m);
    for (let i = 0; i < N; i++) { m.setMatrixAt(i, _zero); m.setColorAt(i, _col.setRGB(0, 0, 0)); }
    return m;
  };
  const beamMesh = mkBeams(new THREE.CylinderGeometry(0.5, 0.5, 1, 10, 1, true).translate(0, 0.5, 0), false, BM_N, 5);
  const flameMesh = mkBeams(new THREE.CylinderGeometry(0.12, 0.5, 1, 8, 1, true).translate(0, 0.5, 0), true, FL_N, 5);
  const beamUse = new Array(BM_N).fill(null), flameUse = new Array(FL_N).fill(null);
  const zones = [];
  function zoneStart(kind, x, z, r, dur) {
    const heal = kind === 'heal', pool = heal ? beamUse : flameUse, mesh = heal ? beamMesh : flameMesh, zn = { kind, x, z, r, t: 0, dur, beams: [] };
    const want = heal ? Math.round(clamp(r * 0.9, 9, 20)) : Math.round(clamp(r * 1.2, 12, 22));
    for (let k = 0; k < want + (heal ? 1 : 0); k++) {
      const i = pool.findIndex((q) => !q); if (i < 0) break;
      const center = heal && k === 0, a = rnd() * TAU, rr = heal ? Math.sqrt(rnd()) * r * 0.9 : (rnd() < 0.7 ? r * (0.82 + rnd() * 0.14) : Math.sqrt(rnd()) * r * 0.8);
      const b = { i, center, x: center ? x : x + Math.cos(a) * rr, z: center ? z : z + Math.sin(a) * rr, h: center ? 28 : (heal ? 7 + rnd() * 7 : 9 + rnd() * 7), w: center ? r * 0.2 : (heal ? 0.9 + rnd() * 0.7 : 2.2 + rnd() * 1.3), per: center ? dur : (heal ? 1.5 + rnd() * 1.1 : 0.45 + rnd() * 0.5), cyc: center ? 0 : rnd(), sd: rnd() };
      b.y = height(b.x, b.z); pool[i] = zn; zn.beams.push(b);
    }
    zn.mesh = mesh; zn.pool = pool; zones.push(zn);
  }
  function zoneUpdate(dt) {
    let bAny = false, fAny = false;
    for (let zi = zones.length - 1; zi >= 0; zi--) {
      const zn = zones[zi]; zn.t += dt; const ending = zn.t > zn.dur - 0.6, over = zn.t >= zn.dur;
      for (const b of zn.beams) {
        if (over) { zn.mesh.setMatrixAt(b.i, _zero); zn.pool[b.i] = null; continue; }
        let cyc;
        if (b.center) cyc = clamp(zn.t / zn.dur, 0, 1) * 0.74 + 0.13;                       // (the big pillar: grows at once, holds, goes out with the zone)
        else { b.cyc += dt / b.per; if (b.cyc >= 1) { b.cyc -= 1; if (!ending) { const a = rnd() * TAU, rr = zn.kind === 'heal' ? Math.sqrt(rnd()) * zn.r * 0.9 : (rnd() < 0.7 ? zn.r * (0.82 + rnd() * 0.14) : Math.sqrt(rnd()) * zn.r * 0.8); b.x = zn.x + Math.cos(a) * rr; b.z = zn.z + Math.sin(a) * rr; b.y = height(b.x, b.z); b.sd = rnd(); } } cyc = ending && b.cyc > 0.7 ? 1 : b.cyc; }
        const grow = zn.kind === 'heal' ? outCubic(Math.min(1, cyc * 3)) : 0.55 + 0.45 * Math.sin(cyc * 3.1416);
        _q.setFromEuler(_e.set(0, b.sd * TAU, 0)); _m.compose(_ps.set(b.x, b.y - 0.1, b.z), _q, _sc.set(b.w * (zn.kind === 'heal' ? 1 : 0.7 + 0.3 * grow), b.h * grow, b.w * (zn.kind === 'heal' ? 1 : 0.7 + 0.3 * grow)));
        zn.mesh.setMatrixAt(b.i, _m); zn.mesh.setColorAt(b.i, _col.setRGB(cyc, b.sd, 0));
      }
      if (zn.kind === 'heal') bAny = true; else fAny = true;
      zn.mesh.instanceMatrix.needsUpdate = true; zn.mesh.instanceColor.needsUpdate = true;
      if (over) zones.splice(zi, 1);
    }
    beamMesh.visible = bAny && beamUse.some(Boolean); flameMesh.visible = fAny && flameUse.some(Boolean);
  }

  // ---------------------------------------------------------------- the public calls
  function cast(kind, x, z, r, dur) {
    const gy = height(x, z);
    if (kind === 'lightning') { disc('lightning', x, z, r, 1.9); }
    else if (kind === 'heal' || kind === 'rage') { disc(kind, x, z, r, dur + 0.9); zoneStart(kind, x, z, r, dur); }
    else if (kind === 'freeze') {
      disc('freeze', x, z, r, dur + 0.9);
      const dm = domes.find((q) => !q.on) || domes[0]; dm.on = true; dm.t = 0; dm.r = r; dm.mesh.visible = true; dm.mesh.position.set(x, gy, z);
      for (let k = 0; k < 34; k++) {
        const a = rnd() * TAU, d = Math.sqrt(rnd()) * r * 0.92, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, h = (2.6 + rnd() * 5) * (1.2 - d / r * 0.55), n = 1 + (rnd() < 0.45 ? 1 : 0);
        for (let q = 0; q < n; q++) crystal(px + (rnd() - 0.5) * 1.2, height(px, pz), pz + (rnd() - 0.5) * 1.2, 1.0 + rnd() * 1.0, h * (q ? 0.6 : 1), [a + (rnd() - 0.5), 0.12 + rnd() * 0.2], d / r * 0.55 + rnd() * 0.12, dur + rnd() * 0.4);
      }
      crMesh.visible = true;
    } else if (kind === 'quake') {
      disc('quake', x, z, r, 7.5); rockBurst(x, z, r);
      if (fx) { fx.dust(x, gy + 0.5, z, 12, 11, r * 0.8, 3); fx.flash(x, gy + 2, z, r * 0.8, [1, 0.72, 0.4]); }
    }
  }
  // the ice shell: a glassy blue-white box that grows up the building, glitters while it lasts and bursts at the end
  const shells = [], shellGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const shellMat = new THREE.MeshStandardMaterial({ color: 0xd8f1ff, transparent: true, opacity: 0.5, roughness: 0.12, metalness: 0.1, emissive: 0x2f78b8, emissiveIntensity: 0.55, depthWrite: false, envMapIntensity: 1.4 });
  disposables.push(shellGeo, shellMat);
  function shell(x, z, w, d, h, rot, dur) {
    const m = new THREE.Mesh(shellGeo, shellMat.clone()); m.renderOrder = 4; m.position.set(x, height(x, z) - 0.3, z); m.rotation.y = rot; m.scale.set(w + 1.2, 0.01, d + 1.2); grp.add(m);
    shells.push({ m, t: 0, dur, w: w + 1.2, d: d + 1.2, h: h + 1.0, x, z });
  }
  function frozen(x, z, w, h, dur = 5.5, d = null, rot = 0) {
    if (d != null && w > 0) shell(x, z, Math.min(w, d * 1.0 + 2) > 0 ? w : w, d, h, rot, dur);
    const gy = height(x, z), R = Math.max(2.4, w * 0.62), n = 9;
    for (let k = 0; k < n; k++) { const a = (k / n) * TAU + rnd() * 0.5, d = R * (0.8 + rnd() * 0.5), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; crystal(px, height(px, pz), pz, 1.3 + rnd() * 1.0, Math.min(13, Math.max(4, h * (0.5 + rnd() * 0.35))), [a, 0.16 + rnd() * 0.2], rnd() * 0.35, dur + rnd() * 0.3); }
    crMesh.visible = true; void gy;
  }

  // ---------------------------------------------------------------- per frame
  function update(dt) {
    now += dt; uNow.value = now;
    for (const d of discs) if (d.on) { d.t += dt; d.mesh.material.uniforms.uT.value = d.t; if (d.t >= d.life) { d.on = false; d.mesh.visible = false; } }
    for (const dm of domes) if (dm.on) { dm.t += dt; const k = outCubic(dm.t / 0.5); dm.mesh.scale.set(dm.r * (0.2 + 0.8 * k), dm.r * 0.5 * (0.2 + 0.8 * k), dm.r * (0.2 + 0.8 * k)); dm.mesh.material.uniforms.uT.value = dm.t; if (dm.t > 1.55) { dm.on = false; dm.mesh.visible = false; } }
    if (bolts.visible) { let any = false; for (let i = 0; i < MAXB; i++) if (now - boltT[i] < 1) any = true; if (!any) bolts.visible = false; }
    if (flashK > 0.005) { flashEl.style.opacity = String(Math.min(0.55, flashK)); flashK *= Math.pow(0.0006, dt); } else if (flashEl && flashEl.style.opacity !== '0') { flashEl.style.opacity = '0'; flashK = 0; }
    // scorch decals age
    if (scMesh.visible) {
      let live = 0;
      for (let i = 0; i < SC_N; i++) { const s = scorches[i]; if (!s) continue; s.t += dt; if (s.t >= s.life) { scorches[i] = null; scMesh.setMatrixAt(i, _zero); continue; } live++; scMesh.getColorAt(i, _col); scMesh.setColorAt(i, _col.setRGB(s.t / s.life, _col.g, 0)); }
      scMesh.instanceColor.needsUpdate = true; scMesh.instanceMatrix.needsUpdate = true; if (!live) scMesh.visible = false;
    }
    // ice shells: grow up over the building, shimmer, burst
    for (let i = shells.length - 1; i >= 0; i--) {
      const q = shells[i]; q.t += dt; const left = q.dur - q.t, g = Math.min(1, q.t / 0.5), e = 1 - Math.pow(1 - g, 3);
      if (left <= 0) { grp.remove(q.m); q.m.material.dispose(); shells.splice(i, 1); continue; }
      const out = left < 0.4 ? left / 0.4 : 1;
      q.m.scale.set(q.w * (2 - out * 0.96 - 0.04 * 0 ) / 1.04 * 1.0, q.h * e, q.d * (2 - out * 0.96) / 1.04); q.m.material.opacity = 0.5 * out * (0.88 + 0.12 * Math.sin(now * 4 + q.x));
      q.m.material.emissiveIntensity = 0.45 + 0.25 * Math.sin(now * 3 + q.z);
      if (fx && rnd() < dt * 9) fx.spark(q.x + (rnd() - 0.5) * q.w, q.m.position.y + rnd() * q.h * e, q.z + (rnd() - 0.5) * q.d, 1, 3, [0.8, 0.95, 1]);
      if (left < 0.4 && !q.shat) { q.shat = true; if (fx) fx.spark(q.x, q.m.position.y + q.h * 0.5, q.z, 8, 8, [0.75, 0.93, 1]); }
    }
    // crystals: grow with a little overshoot, hold, then shatter (a few sparks) and shrink away
    if (crMesh.visible) {
      let live = 0, top = 0;
      for (let i = 0; i < crystals.length; i++) {
        const c = crystals[i]; if (!c) continue; c.t += dt;
        if (c.t >= c.life) { crystals[i] = null; crMesh.setMatrixAt(i, _zero); continue; }
        live++; top = i + 1;
        if (c.t < 0) { crMesh.setMatrixAt(i, _zero); continue; }
        const left = c.life - c.t; let g = c.t < 0.5 ? backOut(c.t / 0.5) : 1, f = 1;
        if (left < 0.45) { f = left / 0.45; g *= 0.5 + 0.5 * f; if (!c.shat) { c.shat = true; if (fx && rnd() < 0.5) fx.spark(c.x, c.y + c.h * 0.4, c.z, 3, 6, [0.7, 0.92, 1]); } }
        _q.setFromEuler(_e.set(c.lz, c.yaw, -c.lx)); _m.compose(_ps.set(c.x, c.y, c.z), _q, _sc.set(c.w * g, c.h * g, c.w * g));
        crMesh.setMatrixAt(i, _m); crMesh.setColorAt(i, _col.setRGB(f, c.g, 0));
      }
      crMesh.instanceMatrix.needsUpdate = true; crMesh.instanceColor.needsUpdate = true; crTop = top; if (!live) crMesh.visible = false;
    }
    // quake rocks: thrown up, tumble, bounce once, lie for a moment, shrink
    if (rkMesh.visible) {
      let live = 0;
      for (let i = 0; i < RK_N; i++) {
        const k = rocks[i]; if (!k) continue; k.t += dt; if (k.t < 0) { rkMesh.setMatrixAt(i, _zero); continue; }
        k.vy -= 30 * dt; k.x += k.vx * dt; k.z += k.vz * dt; k.y += k.vy * dt; k.rx += k.wx * dt; k.ry += k.wy * dt;
        const gy = height(k.x, k.z) + k.sz * 0.3;
        if (k.y < gy) { k.y = gy; if (k.bounced < 1 && k.vy < -4) { k.vy *= -0.28; k.vx *= 0.4; k.vz *= 0.4; k.bounced++; if (fx && rnd() < 0.5) fx.dust(k.x, gy, k.z, 1, 3, 1.5, 1.2); } else { k.vy = 0; k.vx *= 0.8; k.vz *= 0.8; k.wx *= 0.7; k.wy *= 0.7; k.rest += dt; } }
        const s = k.rest > 1.4 ? Math.max(0, 1 - (k.rest - 1.4) / 0.6) : 1;
        if (s <= 0) { rocks[i] = null; rkMesh.setMatrixAt(i, _zero); continue; }
        live++; _q.setFromEuler(_e.set(k.rx, k.ry, 0)); _m.compose(_ps.set(k.x, k.y, k.z), _q, _sc.set(k.sz * s, k.sz * s * 0.8, k.sz * s)); rkMesh.setMatrixAt(i, _m);
      }
      rkMesh.instanceMatrix.needsUpdate = true; if (!live) rkMesh.visible = false;
    }
    zoneUpdate(dt);
  }

  function clear() {
    for (const q of shells) { grp.remove(q.m); q.m.material.dispose(); } shells.length = 0;
    for (const d of discs) { d.on = false; d.mesh.visible = false; }
    for (const dm of domes) { dm.on = false; dm.mesh.visible = false; }
    bolts.visible = false; boltT.fill(-9); bK.fill(-9); bGeo.attributes.aK.needsUpdate = true;
    for (let i = 0; i < SC_N; i++) { scorches[i] = null; scMesh.setMatrixAt(i, _zero); } scMesh.visible = false; scMesh.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < CR_N; i++) { crystals[i] = null; crMesh.setMatrixAt(i, _zero); } crMesh.visible = false; crMesh.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < RK_N; i++) { rocks[i] = null; rkMesh.setMatrixAt(i, _zero); } rkMesh.visible = false; rkMesh.instanceMatrix.needsUpdate = true;
    for (const zn of zones) for (const b of zn.beams) { zn.mesh.setMatrixAt(b.i, _zero); zn.pool[b.i] = null; }
    zones.length = 0; beamMesh.visible = flameMesh.visible = false; beamMesh.instanceMatrix.needsUpdate = flameMesh.instanceMatrix.needsUpdate = true;
    flashK = 0; if (flashEl) flashEl.style.opacity = '0';
  }
  function dispose() {
    clear(); scene.remove(grp);
    for (const o of disposables) o.dispose && o.dispose();
    for (const m of [scMesh, crMesh, rkMesh, beamMesh, flameMesh]) m.dispose && m.dispose();
    if (flashEl && flashEl.parentNode) flashEl.parentNode.removeChild(flashEl); flashEl = null;
  }
  const stats = () => {
    let draws = 0; grp.traverse((o) => { if (o.visible && (o.isMesh)) draws++; });
    return { draws, discs: discs.filter((d) => d.on).length, crystals: crystals.filter(Boolean).length, zones: zones.length, rocks: rocks.filter(Boolean).length };
  };
  return { cast, bolt, frozen, update, clear, dispose, stats };
}
