// Life on and under the water (the "water" workstream): fish schools in the moat and the lake (dark silhouettes under the surface, a few golden
// carp among them), now and then one leaps with a splash and a ring; swans and a mallard family on the lake, a pair of mallards on the moat
// (each with its V-shaped wake), a wooden jetty with a moored rowboat and a lantern, mist over the water at night and at dawn, fireflies over the
// reeds on summer nights. Everything that moves is instanced and animated in its shader (fish, rings, wakes, mist, fireflies) or is a handful
// of matrices (birds, the boat, the leaping fish); it all hides when the camera is far away or the water is off screen.
// Draw calls when visible: fish 1, rings/wakes/splashes 1, birds 1, leaping fish 1 (only while a fish is in the air), boat 1, mist 1 (night/dawn),
// fireflies 1 (summer nights). No shadow casters, no render targets.
// buildWaterLife(api) -> { update(t, dt, camera, P), lamps: [[x, z, s]] } — api: { scene, M, Q, B, torch, fh, water, ring: {rc, hw} (moat centre
// radius / half width every 4 deg), LV }
import * as THREE from 'three';
import * as L from './layout.js';
import { season } from './tod.js';
import { PX } from './fx.js';

const TAU = Math.PI * 2;
export const JETTY_ANG = 0.42;                 // where on the lake shore the jetty stands (radians round the lake, 0 = east)
function lcg(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

// ------------------------------------------------------------------ geometry helpers
// a fish seen from above: a lens-shaped body with a low dorsal ridge, a forked tail and two small pectoral fins (+Z = head), ~40 triangles
function fishGeometry() {
  const P = [], I = [], E = [];                    // position, index, edge (0 spine .. 1 rim)
  const NS = 9, z0 = -0.5, z1 = 0.5;
  for (let k = 0; k <= NS; k++) {
    const z = z0 + (z1 - z0) * k / NS, u = k / NS, w = 0.15 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), 0.75) + 0.012;
    P.push(-w, 0, z, 0, 0.07 * Math.sin(Math.PI * u), z, w, 0, z); E.push(1, 0, 1);
  }
  for (let k = 0; k < NS; k++) { const a = k * 3, b = a + 3; I.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); }
  let n = P.length / 3;                            // tail: a forked fan behind the body
  P.push(0, 0.01, -0.46, -0.17, 0, -0.82, 0, 0.01, -0.68, 0.17, 0, -0.82); E.push(0, 1, 0.6, 1);
  I.push(n, n + 1, n + 2, n, n + 2, n + 3);
  n = P.length / 3;                                // pectoral fins
  P.push(-0.1, 0, 0.18, -0.24, 0, 0.02, -0.08, 0, 0.06, 0.1, 0, 0.18, 0.24, 0, 0.02, 0.08, 0, 0.06); E.push(0.4, 1, 0.4, 0.4, 1, 0.4);
  I.push(n, n + 1, n + 2, n + 3, n + 5, n + 4);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aEdge', new THREE.Float32BufferAttribute(E, 1)); g.setIndex(I);
  return g;
}
// a solid fish for the leap: an ellipsoid body and a tail fin
function leaperGeometry() {
  const body = new THREE.SphereGeometry(1, 10, 7); body.scale(0.11, 0.16, 0.5);
  const tail = new THREE.BufferGeometry();
  tail.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.42, 0, 0.2, -0.8, 0, -0.2, -0.8, 0, 0, -0.42, 0, -0.2, -0.8, 0, 0.2, -0.8], 3));
  tail.computeVertexNormals();
  const g = merge([body.toNonIndexed(), tail]); g.computeVertexNormals(); return g;
}
// the waterfowl: a mallard (species 0, body ~1 m — drawn larger than life, to read from afar) and a mute swan (species 1, with its S-curved
// neck and black-knobbed orange bill) in ONE geometry; the shader folds away the other species' vertices. parts: 0 body, 1 neck, 2 head, 3 bill, 4 black
function birdGeometry() {
  const parts = [];
  const add = (g, sp, part, m) => { g = g.index ? g.toNonIndexed() : g; if (m) g.applyMatrix4(m); if (g.attributes.uv) g.deleteAttribute('uv'); const n = g.attributes.position.count;
    g.setAttribute('aPart', new THREE.Float32BufferAttribute(new Float32Array(n).fill(part), 1)); g.setAttribute('aSp', new THREE.Float32BufferAttribute(new Float32Array(n).fill(sp), 1)); parts.push(g); };
  const shape = (sx, sy, sz, f) => { const g = new THREE.SphereGeometry(1, 14, 9), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = f(p.getX(i) * sx, p.getY(i) * sy, p.getZ(i) * sz); p.setXYZ(i, v[0], v[1], v[2]); } g.computeVertexNormals(); return g; };
  const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
  // mallard
  add(shape(0.3, 0.2, 0.5, (x, y, z) => {
    if (y < 0) y *= 0.45;                                          // a flat keel (it sits in the water)
    if (z < -0.2) y += (-0.2 - z) * 0.34 * (y > 0 ? 1.2 : 0.4);    // the tail tips up
    if (z > 0.25 && y > 0) y += (z - 0.25) * 0.12;                 // a full breast
    return [x, y + 0.1, z];
  }), 0, 0);
  add(new THREE.CylinderGeometry(0.065, 0.09, 0.24, 8), 0, 1, T(0, 0.3, 0.33));
  add(new THREE.SphereGeometry(0.1, 10, 7), 0, 2, new THREE.Matrix4().compose(new THREE.Vector3(0, 0.45, 0.37), new THREE.Quaternion(), new THREE.Vector3(0.9, 0.95, 1.2)));
  { const b = new THREE.ConeGeometry(0.045, 0.16, 6); b.rotateX(Math.PI / 2); b.scale(1.3, 0.55, 1); add(b, 0, 3, T(0, 0.43, 0.53)); }
  // swan: a long, high-backed body with the wings a little raised, the neck an S-curve, the head carried level
  add(shape(0.25, 0.17, 0.52, (x, y, z) => {
    if (y < 0) y *= 0.4;
    if (y > 0) y += 0.07 * Math.max(0, 1 - Math.abs(z + 0.05) / 0.5) * (1 - Math.min(1, Math.abs(x) / 0.25) * 0.6);
    if (z < -0.3) y += (-0.3 - z) * 0.55;
    return [x, y + 0.08, z];
  }), 1, 0);
  { const c = new THREE.CatmullRomCurve3([[0, 0.1, 0.36], [0, 0.32, 0.42], [0, 0.55, 0.34], [0, 0.72, 0.3], [0, 0.81, 0.38], [0, 0.8, 0.46]].map((v) => new THREE.Vector3(...v)));
    add(new THREE.TubeGeometry(c, 12, 0.045, 6, false), 1, 1); add(new THREE.SphereGeometry(0.075, 8, 6), 1, 1, T(0, 0.12, 0.37)); }
  add(new THREE.SphereGeometry(1, 9, 7), 1, 2, new THREE.Matrix4().compose(new THREE.Vector3(0, 0.8, 0.48), new THREE.Quaternion(), new THREE.Vector3(0.05, 0.05, 0.08)));
  { const b = new THREE.ConeGeometry(0.028, 0.12, 6); b.rotateX(Math.PI / 2 + 0.3); add(b, 1, 3, T(0, 0.775, 0.58)); }
  add(new THREE.SphereGeometry(0.026, 6, 5), 1, 4, T(0, 0.795, 0.535));
  return merge(parts);
}
// the rowboat: a lofted clinker-ish hull (outside dark, inside light), two thwarts and a pair of oars, vertex coloured, 2.9 m long
function boatGeometry() {
  const pos = [], col = [];
  const C = (h) => new THREE.Color(h).convertSRGBToLinear();
  const out = C(0x4a3424), inn = C(0x8a6440), rim = C(0x2e2018), seat = C(0x9a7048), oar = C(0xb08a58);
  const tri = (a, b, c, cl) => { pos.push(...a, ...b, ...c); for (let k = 0; k < 3; k++) col.push(cl.r, cl.g, cl.b); };
  const quad = (a, b, c, d, cl) => { tri(a, b, c, cl); tri(a, c, d, cl); };
  const NL = 12, NA = 6, Lh = 1.45;
  const sec = (u) => {                                         // u in [-1, 1] along the hull: a U-shaped section narrowing to the stem and the transom
    const bw = 0.62 * Math.pow(1 - Math.pow(Math.abs(u), u > 0 ? 2.2 : 3.4), 0.6) + (u < 0 ? 0.18 * Math.pow(-u, 2) : 0.02);
    const dep = 0.42 - 0.05 * Math.abs(u), sheer = 0.12 * Math.pow(Math.abs(u), 2);
    const pts = []; for (let a = 0; a <= NA; a++) { const th = Math.PI * a / NA; pts.push([Math.cos(th) * bw, -Math.sin(th) * dep * (0.55 + 0.45 * Math.pow(Math.sin(th), 0.4)) + sheer, u * Lh]); }
    return pts;
  };
  const S = []; for (let k = 0; k <= NL; k++) S.push(sec(-1 + 2 * k / NL));
  for (let k = 0; k < NL; k++) for (let a = 0; a < NA; a++) {
    const A = S[k][a], Bq = S[k + 1][a], Cq = S[k + 1][a + 1], D = S[k][a + 1];
    quad(A, D, Cq, Bq, a % 2 ? out : C(0x553c29));                            // outside (strakes alternate)
    const sh = (v) => [v[0] * 0.93, v[1] + 0.03, v[2] * 0.97]; quad(sh(A), sh(Bq), sh(Cq), sh(D), inn);   // inside
  }
  for (let k = 0; k < NL; k++) for (const a of [0, NA]) { const A = S[k][a], Bq = S[k + 1][a]; quad(A, Bq, [Bq[0] * 0.92, Bq[1] + 0.04, Bq[2]], [A[0] * 0.92, A[1] + 0.04, A[2]], rim); }  // gunwale
  { const t = S[0]; for (let a = 0; a < NA; a++) tri([0, t[a][1] * 0.2 - 0.05, t[a][2]], t[a + 1], t[a], out); }   // transom
  const box = (cx, cy, cz, sx, sy, sz, cl) => { const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], cl); quad([x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0], cl); quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], cl);
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], cl); quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], cl); };
  box(0, -0.02, 0.35, 1.0, 0.05, 0.26, seat); box(0, -0.02, -0.55, 1.12, 0.05, 0.24, seat);
  for (const s of [-1, 1]) {                                    // the oars, shipped along the thwarts
    const m = new THREE.Matrix4().makeRotationY(s * 0.06);
    const o0 = pos.length; box(s * 0.32, 0.05, -0.05, 0.06, 0.05, 2.3, oar); box(s * 0.32, 0.05, -1.05, 0.16, 0.02, 0.5, oar);
    const v = new THREE.Vector3(); for (let i = o0; i < pos.length; i += 3) { v.set(pos[i], pos[i + 1], pos[i + 2]).applyMatrix4(m); pos[i] = v.x; pos[i + 1] = v.y; pos[i + 2] = v.z; }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}
function merge(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const names = Object.keys(list[0].attributes).filter((k) => list.every((g) => g.attributes[k]));
  const out = new THREE.BufferGeometry();
  for (const k of names) {
    const sz = list[0].attributes[k].itemSize, arr = new Float32Array(n * sz); let o = 0;
    for (const g of list) { const a = g.attributes[k]; for (let i = 0; i < a.count; i++) for (let c = 0; c < sz; c++) arr[o++] = a.array[i * sz + c]; }
    out.setAttribute(k, new THREE.BufferAttribute(arr, sz));
  }
  return out;
}

// ------------------------------------------------------------------ shaders
const FISH_VS = `attribute vec4 aF; attribute vec4 aG; attribute float aEdge;
  uniform float uTime, uWY, uRc[90], uHw[90], uOnM, uOnL; uniform vec3 uLake;
  varying float vEdge; varying float vGold; varying float vFd;
  float wrapI(float i) { return mod(i, 90.0); }
  vec2 ringAt(float th, float lane) {
    float u = mod(th, 6.2831853) / 6.2831853 * 90.0, i0 = floor(u), f = u - i0;
    int a = int(wrapI(i0)), b = int(wrapI(i0 + 1.0));
    float rc = mix(uRc[a], uRc[b], f), hw = mix(uHw[a], uHw[b], f);
    return vec2(cos(th), sin(th)) * (rc + lane * hw);
  }
  vec2 fishPos(float t) {
    if (aF.x < 0.5) {                                     // the town moat: a school drifts round the ring, wanders back and forth and across
      float th = aF.y + (aF.w * t + aG.z * sin(t * 0.06 + aG.y)) / 150.0;
      return ringAt(th, clamp(aF.z + 0.16 * sin(t * 0.19 + aG.y * 3.0), -0.62, 0.62));
    }
    float a = aF.y + aF.w * t / 16.0 + 0.6 * sin(t * 0.045 + aG.y);   // the lake: loose loops round the middle
    float r = uLake.z * (0.34 + 0.16 * sin(t * 0.08 + aG.y * 2.0) + aF.z * 0.07);
    return uLake.xy + vec2(cos(a), sin(a) * 0.9) * r;
  }
  void main() {
    float on = aF.x < 0.5 ? uOnM : uOnL;
    vec2 p0 = fishPos(uTime), p1 = fishPos(uTime + 0.3), d = p1 - p0; float sp = length(d) / 0.3;
    vec2 f = sp > 1e-4 ? d / (sp * 0.3) : vec2(0.0, 1.0), r = vec2(f.y, -f.x);
    vec3 q = position * aG.x * on;
    float tail = smoothstep(0.25, -0.8, position.z);
    q.x += sin(uTime * (5.0 + sp * 5.0) + aG.y * 7.0 - position.z * 4.5) * 0.15 * tail * aG.x * on;
    vec3 w = vec3(p0.x + r.x * q.x + f.x * q.z, uWY - 0.32 - 0.14 * sin(uTime * 0.31 + aG.y * 5.0) + q.y, p0.y + r.y * q.x + f.y * q.z);
    vec4 mv = viewMatrix * vec4(w, 1.0); gl_Position = projectionMatrix * mv;
    vEdge = aEdge; vGold = aG.w; vFd = length(mv.xyz);
  }`;
const FISH_FS = `uniform vec3 uFogCol; uniform float uFogD, uAmb; varying float vEdge; varying float vGold; varying float vFd;
  void main() {
    vec3 c = mix(vec3(0.015, 0.05, 0.07), vec3(0.62, 0.33, 0.08) * (0.25 + 0.75 * uAmb), vGold);
    float a = (0.62 + 0.15 * vGold) * (1.0 - smoothstep(0.55, 1.0, vEdge) * 0.7) * (1.0 - smoothstep(140.0, 260.0, vFd));
    float fog = 1.0 - exp(-uFogD * uFogD * vFd * vFd); c = mix(c, uFogCol, fog); a *= 1.0 - fog * 0.8;
    gl_FragColor = vec4(c, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
// rings (0), splashes (1, camera-facing) and V-wakes (2) on one instanced quad: aA = x, z, t0 | heading, size; aB = kind, speed, alpha, seed
const FX_VS = `attribute vec4 aA; attribute vec4 aB; uniform float uTime, uWY; varying vec2 vUv; varying float vAge; varying vec4 vB; varying float vFd;
  void main() {
    vUv = position.xz; vB = aB; vAge = uTime - aA.z;
    vec3 w;
    if (aB.x < 0.5) w = vec3(aA.x + position.x * aA.w, uWY + 0.04, aA.y + position.z * aA.w);
    else if (aB.x < 1.5) {
      vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
      float age = clamp(vAge / 0.9, 0.0, 1.0), h = aA.w * (0.6 + 1.1 * sqrt(age));
      w = vec3(aA.x, uWY + (position.z * -0.5 + 0.5) * h - 0.05, aA.y) + cr * position.x * aA.w * (0.55 + 0.6 * age);
    } else {
      vec2 f = vec2(sin(aA.z), cos(aA.z)), r = vec2(f.y, -f.x);
      float L = 4.6 * aA.w, W = 4.0 * aA.w; float u = (position.z * 0.5 + 0.5) * L - L * 0.9, v = position.x * W * 0.5;
      w = vec3(aA.x + f.x * u + r.x * v, uWY + 0.035, aA.y + f.y * u + r.y * v);
      vUv = vec2(v / W * 2.0, u / L);
    }
    vec4 mv = viewMatrix * vec4(w, 1.0); gl_Position = projectionMatrix * mv; vFd = length(mv.xyz);
  }`;
const FX_FS = `uniform float uTime, uAmb, uFogD; uniform vec3 uFogCol; varying vec2 vUv; varying float vAge; varying vec4 vB; varying float vFd;
  void main() {
    float a = 0.0;
    if (vB.x < 0.5) {                                     // an expanding ring with a fainter second ring inside
      float r = length(vUv), R = 0.12 + 0.88 * sqrt(clamp(vAge / 2.6, 0.0, 1.0)), w = 0.035 + 0.05 * R;
      a = smoothstep(w, 0.0, abs(r - R)) + 0.55 * smoothstep(w, 0.0, abs(r - R * 0.62));
      a *= (1.0 - smoothstep(0.0, 2.6, vAge)) * step(0.0, vAge) * step(r, 1.0);
    } else if (vB.x < 1.5) {                              // a splash: a crown of spray rising and falling back
      vec2 q = vUv * vec2(1.0, -1.0) * 0.5 + 0.5; float age = clamp(vAge / 0.9, 0.0, 1.0);
      float ax = abs(q.x - 0.5) * 2.0, col = 0.6 + 0.4 * sin(q.x * 31.0 + vB.w * 7.0);
      a = smoothstep(1.0, 0.55, ax) * smoothstep(1.0, 0.25 + 0.5 * ax * ax, q.y + 0.25 * (1.0 - col)) * smoothstep(0.0, 0.08, q.y);
      a *= col * (1.0 - age) * step(0.0, vAge) * (0.9 - 0.5 * q.y);
    } else {                                              // a Kelvin wake: two faint diverging arms of ripples, a bow wave, fading behind
      float u = -vUv.y, v = abs(vUv.x), fade = pow(clamp(1.0 - u / 0.9, 0.0, 1.0), 1.6) * smoothstep(-0.06, 0.03, u);
      float d = v - u * 0.75 - 0.04;
      float arm = (smoothstep(0.05, 0.0, abs(d)) * 0.7 + smoothstep(0.04, 0.0, abs(d + 0.07 + 0.05 * u)) * 0.35) * (0.75 + 0.25 * sin(u * 60.0 - uTime * 6.0 + vB.w));
      float bow = smoothstep(0.1, 0.0, length(vec2(v * 0.9, u + 0.01))) * 0.6;
      a = (arm * fade + bow) * vB.y;
    }
    a *= vB.z * (1.0 - smoothstep(160.0, 280.0, vFd));
    vec3 c = vec3(0.88, 0.95, 1.0) * (0.22 + 0.7 * uAmb);
    float fog = 1.0 - exp(-uFogD * uFogD * vFd * vFd); c = mix(c, uFogCol, fog);
    gl_FragColor = vec4(c, clamp(a, 0.0, 1.0) * 0.75);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const MIST_VS = `attribute float aEdge; uniform float uWY; varying vec3 vW; varying float vEdge; varying float vFd;
  void main() { vec3 w = vec3(position.x, uWY + position.y, position.z); vW = w; vEdge = aEdge; vec4 mv = viewMatrix * vec4(w, 1.0); vFd = length(mv.xyz); gl_Position = projectionMatrix * mv; }`;
const MIST_FS = `uniform sampler2D uN; uniform float uTime, uMist; uniform vec3 uCol, uFogCol; uniform float uFogD; varying vec3 vW; varying float vEdge; varying float vFd;
  void main() {
    vec2 q = vW.xz;                                       // wisps: stretched along the drift, a fine layer over a broad one
    float n = texture2D(uN, vec2(q.x * 0.008 + q.y * 0.004, q.y * 0.026 - q.x * 0.005) + vec2(uTime * 0.006, uTime * 0.0012)).a * 0.6 + texture2D(uN, q * 0.041 - vec2(uTime * 0.009, -uTime * 0.004)).a * 0.4;
    float a = smoothstep(0.25, 0.85, n) * smoothstep(0.0, 1.0, vEdge) * uMist * smoothstep(25.0, 80.0, vFd);
    float fog = 1.0 - exp(-uFogD * uFogD * vFd * vFd);
    gl_FragColor = vec4(mix(uCol, uFogCol, fog), a * 0.3);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const FLY_VS = `attribute float aPh; uniform float uTime, uScale; varying float vA;
  void main() { vec3 p = position; p.x += sin(uTime * 0.7 + aPh) * 1.3; p.y += sin(uTime * 1.1 + aPh * 1.7) * 0.45; p.z += cos(uTime * 0.6 + aPh * 0.7) * 1.3;
    vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; vA = pow(max(0.0, sin(uTime * 1.6 + aPh * 3.0)), 3.0);
    gl_PointSize = 0.85 * uScale / -mv.z; }`;
const FLY_FS = `uniform sampler2D uTex; uniform float uOn; varying float vA; void main() { float a = texture2D(uTex, gl_PointCoord).a * vA * uOn; gl_FragColor = vec4(vec3(0.85, 1.0, 0.5) * a * 1.7, a); }`;

// ------------------------------------------------------------------ the builder
export function buildWaterLife(api) {
  const { scene, M, Q, fh, water } = api, LV = api.LV ?? L.MOAT.level;
  if (!water || !water.mesh) return { update() {}, lamps: [] };
  const R = lcg(90210), Lk = L.LAKE, SE = season(), winter = SE.s === 3, q = Q && Q.level === 'low' ? 0.5 : Q && Q.level === 'medium' ? 0.8 : 1;
  const WU = water.mesh.material.uniforms, uWY = { value: water.mesh.position.y }, uTime = { value: 0 };
  const depthAt = water.depthAt || ((x, z) => LV - fh(x, z));
  const lakeIce = winter && (water.ice || 0) * 2.65 > 1.9;          // (the water shader's ice line on the still lake: frozen over)
  const root = new THREE.Group(); root.name = 'water-life'; scene.add(root);
  const lamps = [];

  // ---------------------------------------------------------------- the jetty, the rowboat and the lantern (east shore of the lake)
  let jetty = null, boat = null;
  {
    const ja = JETTY_ANG, dx = Math.cos(ja), dz = Math.sin(ja);
    let r0 = Lk.r; for (let r = Lk.r * 0.5; r < Lk.r * 1.9; r += 0.25) if (fh(Lk.x + dx * r, Lk.z + dz * r) > LV + 0.25) { r0 = r; break; }
    const sx = Lk.x + dx * r0, sz = Lk.z + dz * r0, LEN = 11, Wd = 2.3, top = LV + 0.62, ry = Math.atan2(-dx, -dz);   // the deck runs from the shore into the lake (-d)
    const at = (u, v) => [sx - dx * u + dz * v, sz - dz * u - dx * v];          // u: metres out from the shore, v: across
    if (api.B && M && M.wood) {
      const B = api.B; if (B.bid) B.bid(0);                                   // (no battle target: the jetty never collapses)
      const m4 = (x, y, z, r = ry) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r), new THREE.Vector3(1, 1, 1));
      for (let u = -2.2; u < LEN; u += 0.34) {                                  // planks, a little uneven
        const [x, z] = at(u, (R() - 0.5) * 0.05), g = new THREE.BoxGeometry(Wd + (R() - 0.5) * 0.12, 0.07, 0.3);
        B.add(g, M.wood, m4(x, Math.max(top, fh(x, z) + 0.12) + (R() - 0.5) * 0.02, z, ry + (R() - 0.5) * 0.03), { tint: [0x8a6a48, 0x7a5c3e, 0x947250][(R() * 3) | 0] });
      }
      for (const v of [-Wd / 2 + 0.12, Wd / 2 - 0.12]) {                        // stringers under the planks
        const [x, z] = at(LEN / 2 - 1.1, v); B.add(new THREE.BoxGeometry(0.16, 0.18, LEN + 2.2), M.wood, m4(x, top - 0.12, z), { tint: 0x4e3a28 });
      }
      for (let u = 0; u <= LEN; u += LEN / 4) for (const v of [-Wd / 2, Wd / 2]) {   // posts down to the bed, tops a little proud of the deck
        const [x, z] = at(u, v), gy = Math.min(fh(x, z), LV - 0.2) - 0.3, h = top + (u > LEN - 0.1 ? 0.75 : 0.32) - gy;
        B.add(new THREE.CylinderGeometry(0.13, 0.15, h, 7), M.wood, m4(x, gy + h / 2, z), { tint: 0x4a3626 });
      }
      { const [x, z] = at(LEN - 0.3, Wd / 2 + 0.05); B.add(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6), M.wood, m4(x, top + 0.3, z), { tint: 0x3a2a1e }); }   // a mooring cleat
      if (api.torch) { const [x, z] = at(LEN - 0.15, -Wd / 2); api.torch(x, top + 2.2, z, { post: true, pool: false }); lamps.push([x, z, 1]); }   // the lantern at the end
      jetty = { at, top, LEN, Wd, dx, dz };
    }
    // the rowboat, moored alongside the outer end, rides the tide and rocks a little
    if (jetty && !lakeIce) {
      const g = boatGeometry(), mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
      boat = new THREE.Mesh(g, mat); boat.name = 'rowboat';
      const [x, z] = at(LEN - 3.2, Wd / 2 + 1.05); boat.position.set(x, LV + 0.2, z); boat.rotation.y = ry + 0.08;
      boat.userData.base = { x, z, ry: ry + 0.08 }; root.add(boat);
    }
  }

  // ---------------------------------------------------------------- fish: one instanced mesh, every fish swims in its shader
  const ring = api.ring;
  let fish = null;
  {
    const nM = ring ? Math.round(130 * q) : 0, nL = lakeIce ? 0 : Math.round(36 * q), n = nM + nL;
    if (n) {
      const g = fishGeometry(), aF = new Float32Array(n * 4), aG = new Float32Array(n * 4);
      let i = 0;
      const gates = L.TGATES.map((g) => Math.atan2(g.z, g.x));
      const school = (kind, count) => {
        // a third of the moat schools keep near a gate (where the eye goes), the others roam the whole ring
        const home = kind === 0 && gates.length && R() < 0.35, s0 = home ? gates[(R() * gates.length) | 0] + (R() - 0.5) * 0.5 : R() * TAU;
        const spd = home ? (R() - 0.5) * 0.3 : (R() < 0.5 ? -1 : 1) * (0.25 + R() * 0.55), wander = home ? 10 + R() * 18 : 8 + R() * 30, ph = R() * 100, laneC = (R() - 0.5) * 0.5, gold = R() < 0.28;
        for (let k = 0; k < count && i < n; k++, i++) {
          aF.set([kind, s0 + (R() - 0.5) * (kind ? 0.18 : 0.035), laneC + (R() - 0.5) * 0.35, spd * (0.9 + R() * 0.2)], i * 4);
          aG.set([(kind ? 1.0 : 1.0) + R() * 0.6, ph + R() * 0.6, wander, gold && R() < 0.6 ? 0.7 + R() * 0.3 : 0], i * 4);
        }
      };
      while (i < nM) school(0, 4 + ((R() * 5) | 0));
      while (i < n) school(1, 3 + ((R() * 4) | 0));
      const ig = new THREE.InstancedBufferGeometry(); ig.index = g.index; ig.setAttribute('position', g.attributes.position); ig.setAttribute('aEdge', g.attributes.aEdge);
      ig.setAttribute('aF', new THREE.InstancedBufferAttribute(aF, 4)); ig.setAttribute('aG', new THREE.InstancedBufferAttribute(aG, 4)); ig.instanceCount = n;
      const rc = new Float32Array(90), hw = new Float32Array(90);
      if (ring) for (let k = 0; k < 90; k++) { rc[k] = ring.rc[k]; hw[k] = ring.hw[k]; }
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime, uWY, uRc: { value: rc }, uHw: { value: hw }, uOnM: { value: nM ? 1 : 0 }, uOnL: { value: nL ? 1 : 0 }, uLake: { value: new THREE.Vector3(Lk.x, Lk.z, Lk.r) },
          uFogCol: WU.uFogCol, uFogD: WU.uFogD, uAmb: WU.uAmb },
        vertexShader: FISH_VS, fragmentShader: FISH_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      });
      fish = new THREE.Mesh(ig, mat); fish.name = 'fish'; fish.frustumCulled = false; fish.renderOrder = 1; root.add(fish);
    }
  }
  // the leaping fish (a solid, silvery one) — shown only while it is in the air
  const leap = new THREE.Mesh(leaperGeometry(), new THREE.MeshStandardMaterial({ color: 0xb9c4c8, roughness: 0.32, metalness: 0.45, emissive: 0x0a1418 }));
  leap.name = 'leaping-fish'; leap.visible = false; root.add(leap);

  // ---------------------------------------------------------------- rings / splashes / wakes: one instanced quad
  const NFX = 24, WAKE0 = 14;                       // slots 0..13 rings & splashes (round robin), 14.. wakes (one per bird)
  const fxA = new Float32Array(NFX * 4), fxB = new Float32Array(NFX * 4);
  for (let k = 0; k < NFX; k++) fxA[k * 4 + 2] = -999;
  const fxG = new THREE.InstancedBufferGeometry(); { const pg = new THREE.PlaneGeometry(2, 2); pg.rotateX(-Math.PI / 2); fxG.index = pg.index; fxG.setAttribute('position', pg.attributes.position); }
  const fxAA = new THREE.InstancedBufferAttribute(fxA, 4), fxBA = new THREE.InstancedBufferAttribute(fxB, 4); fxAA.setUsage(THREE.DynamicDrawUsage); fxBA.setUsage(THREE.DynamicDrawUsage);
  fxG.setAttribute('aA', fxAA); fxG.setAttribute('aB', fxBA); fxG.instanceCount = NFX;
  const fx = new THREE.Mesh(fxG, new THREE.ShaderMaterial({ uniforms: { uTime, uWY, uAmb: WU.uAmb, uFogCol: WU.uFogCol, uFogD: WU.uFogD }, vertexShader: FX_VS, fragmentShader: FX_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  fx.name = 'water-rings'; fx.frustumCulled = false; fx.renderOrder = 2; fx.visible = false; root.add(fx);
  let fxNext = 0, fxLast = -99;
  const ringAt = (x, z, t0, size, kind = 0, alpha = 1) => { const k = fxNext * 4; fxNext = (fxNext + 1) % WAKE0; fxA[k] = x; fxA[k + 1] = z; fxA[k + 2] = t0; fxA[k + 3] = size; fxB[k] = kind; fxB[k + 1] = 1; fxB[k + 2] = alpha; fxB[k + 3] = R() * 10; fxLast = Math.max(fxLast, t0); };

  // ---------------------------------------------------------------- waterfowl: two swans and a mallard family on the lake, a mallard pair on the moat
  const birds = [];
  const C = (h) => new THREE.Color(h);
  if (!lakeIce) {
    const swanR = 0.6;
    for (let k = 0; k < 2; k++) birds.push({ where: 'lake', path: 'swan', lag: k * 0.075, off: k * 1.4, scale: 1.5, neck: 1, body: C(0xf2f4f6), head: C(0xf2f4f6), beak: C(0xe0641e), R: swanR, spd: 0.032 });
    const fam = [{ s: 0.9, body: C(0x8a6a48), head: C(0x7a5a3a), beak: C(0xd89a3a) }];
    for (let k = 0; k < 4; k++) fam.push({ s: 0.42, body: C(0x9a8456), head: C(0x6a5a3c), beak: C(0x6a5030) });
    fam.forEach((f, k) => birds.push({ where: 'lake', path: 'duck', lag: k * 0.03 + (k ? 0.02 : 0), off: k ? (k % 2 ? 0.7 : -0.7) * (1 + k * 0.2) : 0, scale: f.s, neck: 0, body: f.body, head: f.head, beak: f.beak, R: 0.42, spd: -0.03 }));
  }
  if (ring) {
    const ga = L.TGATES.length ? Math.atan2(L.TGATES[0].z, L.TGATES[0].x) : 0;
    birds.push({ where: 'moat', a0: ga + 0.16, scale: 0.95, neck: 0, body: C(0x9a9a92), head: C(0x1f6a3a), beak: C(0xe2c23a), lane: 0.15, ph: 0 });
    birds.push({ where: 'moat', a0: ga + 0.16, scale: 0.9, neck: 0, body: C(0x8a6a48), head: C(0x7a5a3a), beak: C(0xd89a3a), lane: -0.12, ph: 0.9 });
  }
  let birdMesh = null;
  if (birds.length) {
    const g = birdGeometry(), n = birds.length, hc = new Float32Array(n * 3), bc = new Float32Array(n * 3), nk = new Float32Array(n);
    birds.forEach((b, i) => { b.head.toArray(hc, i * 3); b.beak.toArray(bc, i * 3); nk[i] = b.neck; b.h = 0; b.x = 0; b.z = 0; b.init = false; });
    g.setAttribute('aHeadC', new THREE.InstancedBufferAttribute(hc, 3)); g.setAttribute('aBeakC', new THREE.InstancedBufferAttribute(bc, 3)); g.setAttribute('aNeck', new THREE.InstancedBufferAttribute(nk, 1));
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    mat.customProgramCacheKey = () => 'bwbird';
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aPart; attribute float aSp; attribute vec3 aHeadC; attribute vec3 aBeakC; attribute float aNeck;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          if (abs(aSp - aNeck) > 0.5) transformed = vec3(0.0);     // (aNeck = the species of this instance: fold the other bird away)`)
        .replace('#include <color_vertex>', `#include <color_vertex>
          vColor.xyz = aPart < 0.5 ? instanceColor.xyz : aPart < 1.5 ? (aSp > 0.5 ? instanceColor.xyz : mix(aHeadC, vec3(0.9), step(0.2, position.y) * step(position.y, 0.235) * step(aHeadC.r + 0.05, aHeadC.g))) : aPart < 2.5 ? aHeadC : aPart < 3.5 ? aBeakC : vec3(0.015);`);
    };
    birdMesh = new THREE.InstancedMesh(g, mat, n); birdMesh.name = 'waterfowl'; birdMesh.frustumCulled = false;
    birds.forEach((b, i) => birdMesh.setColorAt(i, b.body));
    birdMesh.instanceColor.needsUpdate = true; root.add(birdMesh);
  }
  const ringPos = (th, lane, out) => {          // a point in the moat: centre radius + lane * half width
    const u = ((th % TAU) + TAU) % TAU / TAU * 90, i0 = Math.floor(u) % 90, i1 = (i0 + 1) % 90, f = u - Math.floor(u);
    const r = ring.rc[i0] + (ring.rc[i1] - ring.rc[i0]) * f + lane * (ring.hw[i0] + (ring.hw[i1] - ring.hw[i0]) * f);
    out[0] = Math.cos(th) * r; out[1] = Math.sin(th) * r; return out;
  };
  const birdAt = (b, t, out) => {
    if (b.where === 'moat') { const th = b.a0 + 0.09 * Math.sin(t * 0.021 + b.ph * 0.3) + 0.01 * Math.sin(t * 0.07 + b.ph); return ringPos(th, b.lane + 0.2 * Math.sin(t * 0.043 + b.ph), out); }
    const a = 1.2 + b.spd * t - b.lag * Math.sign(b.spd), rr = Lk.r * b.R * (1 + 0.1 * Math.sin(2 * a + 1.0)) + b.off * 0.6;
    out[0] = Lk.x + Math.cos(a) * rr; out[1] = Lk.z + Math.sin(a) * rr * 0.92; return out;
  };
  const BP0 = [0, 0], BP1 = [0, 0];
  const I4 = new THREE.Matrix4(), Qb = new THREE.Quaternion(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), EUL = new THREE.Euler();

  // ---------------------------------------------------------------- mist: a soft layer over the moat ring and the lake (night and dawn only)
  let mist = null;
  if (q > 0.5) {                                    // (not on the low tier)
    const pos = [], edge = [], idx = [];
    if (ring) {
      const N = 180;
      for (let k = 0; k <= N; k++) {
        const th = k / N * TAU, u = (k % N) / N * 90, i0 = Math.floor(u) % 90, rc = ring.rc[i0], hw = ring.hw[i0] + 7;
        for (const s of [-1, -0.4, 0.4, 1]) { pos.push(Math.cos(th) * (rc + s * hw), 0.7 + (1 - Math.abs(s)) * 0.5, Math.sin(th) * (rc + s * hw)); edge.push(Math.abs(s) > 0.9 ? 0 : 1); }
      }
      for (let k = 0; k < N; k++) for (let s = 0; s < 3; s++) { const a = k * 4 + s, b = a + 4; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    { const base = pos.length / 3, NA = 40; pos.push(Lk.x, 1.2, Lk.z); edge.push(1);
      for (let k = 0; k < NA; k++) { const a = k / NA * TAU; for (const [rr, e, y] of [[Lk.r * 0.75, 1, 1.0], [Lk.r * 1.35, 0, 0.6]]) { pos.push(Lk.x + Math.cos(a) * rr, y, Lk.z + Math.sin(a) * rr); edge.push(e); } }
      for (let k = 0; k < NA; k++) { const a = base + 1 + k * 2, b = base + 1 + ((k + 1) % NA) * 2; idx.push(base, b, a, a, b, b + 1, a, b + 1, a + 1); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 1)); g.setIndex(idx);
    const mat = new THREE.ShaderMaterial({ uniforms: { uN: WU.uN, uTime, uWY, uMist: { value: 0 }, uCol: { value: new THREE.Color(0.6, 0.66, 0.78) }, uFogCol: WU.uFogCol, uFogD: WU.uFogD },
      vertexShader: MIST_VS, fragmentShader: MIST_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    mist = new THREE.Mesh(g, mat); mist.name = 'water-mist'; mist.frustumCulled = false; mist.renderOrder = 3; mist.visible = false; root.add(mist);
  }

  // ---------------------------------------------------------------- fireflies over the reeds (summer nights)
  let flies = null;
  if (!winter && q > 0.5 && M && M.glow && api.reedSpots && api.reedSpots.length) {
    const n = Math.round(90 * q), pos = new Float32Array(n * 3), ph = new Float32Array(n);
    for (let i = 0; i < n; i++) { const s = api.reedSpots[(R() * api.reedSpots.length) | 0]; const x = s[0] + (R() - 0.5) * 6, z = s[1] + (R() - 0.5) * 6; pos.set([x, Math.max(LV, fh(x, z)) + 0.7 + R() * 1.8, z], i * 3); ph[i] = R() * 100; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
    const mat = new THREE.ShaderMaterial({ uniforms: { uTime, uTex: { value: M.glow }, uScale: PX.scale, uOn: { value: 0 } }, vertexShader: FLY_VS, fragmentShader: FLY_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    flies = new THREE.Points(g, mat); flies.name = 'reed-fireflies'; flies.frustumCulled = false; flies.visible = false; root.add(flies);
  }

  // ---------------------------------------------------------------- per frame
  const frustum = new THREE.Frustum(), PV = new THREE.Matrix4(), sph = new THREE.Sphere(), fwd = new THREE.Vector3();
  const lakeS = new THREE.Sphere(new THREE.Vector3(Lk.x, LV, Lk.z), Lk.r * 1.4);
  const ringS = ring ? Array.from({ length: 16 }, (_, k) => { const th = (k + 0.5) / 16 * TAU, r = ring.rc[Math.floor((k + 0.5) / 16 * 90) % 90]; return new THREE.Sphere(new THREE.Vector3(Math.cos(th) * r, LV, Math.sin(th) * r), r * Math.PI / 16 + 12); }) : [];
  let frame = 0, nextLeap = 6, jump = null, lastT = 0, warm = 0;
  const MISTW = new THREE.Color(0.86, 0.9, 0.98);
  function scheduleLeap(t, camera) {
    // where the camera looks at the water: a random deep spot near the middle of the view
    camera.getWorldDirection(fwd); if (fwd.y > -0.08) return;
    const k = (LV - camera.position.y) / fwd.y, cx = camera.position.x + fwd.x * k, cz = camera.position.z + fwd.z * k, span = Math.min(90, k * 0.45);
    for (let tries = 0; tries < 10; tries++) {
      const x = cx + (R() - 0.5) * span * 2, z = cz + (R() - 0.5) * span * 2;
      if (depthAt(x, z) < 1.0) continue;
      sph.center.set(x, LV, z); sph.radius = 2; if (!frustum.intersectsSphere(sph)) continue;
      const a = R() * TAU, len = 1.5 + R() * 1.2, x1 = x + Math.sin(a) * len, z1 = z + Math.cos(a) * len; if (depthAt(x1, z1) < 0.8) continue;
      jump = { x, z, x1, z1, a, t0: t, dur: 0.7 + R() * 0.25, h: 0.7 + R() * 0.5, s: 0.8 + R() * 0.5, landed: false };
      ringAt(x, z, t, 2.2, 0, 0.9); ringAt(x, z, t, 0.55 * jump.s, 1, 0.9);
      return;
    }
  }
  return {
    lamps, stats: { fish: fish ? fish.geometry.instanceCount : 0, birds: birds.length },
    // (dev) a leap right now at x, z
    leapAt(x, z) { const a = R() * TAU; jump = { x, z, x1: x + Math.sin(a) * 2, z1: z + Math.cos(a) * 2, a, t0: uTime.value, dur: 0.85, h: 1.0, s: 1.2, landed: false }; ringAt(x, z, uTime.value, 2.2, 0, 0.9); ringAt(x, z, uTime.value, 0.66, 1, 0.9); },
    update(t, dt, camera, P) {
      frame++; uTime.value = t; uWY.value = water.mesh.position.y;
      if (!camera) return;
      PV.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frustum.setFromProjectionMatrix(PV);
      const cy = camera.position.y, night = P ? P.night : 0, hour = P ? P.hour : 12;
      const lakeD = Math.hypot(camera.position.x - Lk.x, camera.position.z - Lk.z);
      const lakeVis = lakeD < 430 && cy < 330 && frustum.intersectsSphere(lakeS);
      let moatVis = false; if (ring && cy < 260) for (let k = 0; k < ringS.length; k++) if (frustum.intersectsSphere(ringS[k])) { moatVis = true; break; }   // some stretch of the moat is on screen
      // fish
      if (fish) { fish.visible = (lakeVis || moatVis) && night < 0.75;            // (dark shapes in dark water: not worth a draw call at night)
        fish.material.uniforms.uOnM.value = moatVis ? 1 : 0; fish.material.uniforms.uOnL.value = lakeVis && !lakeIce ? 1 : 0; }
      // waterfowl: full rate near, every third frame far away
      let anyBird = false;
      if (birdMesh) {
        const near = lakeVis && lakeD < 220 || cy < 120;
        if (near || frame % 3 === 0) {
          for (let i = 0; i < birds.length; i++) {
            const b = birds[i];
            sph.center.set(b.x, LV, b.z); sph.radius = 4;
            const vis = (b.where === 'lake' ? lakeVis : moatVis) && (!b.init || frustum.intersectsSphere(sph)); if (vis) anyBird = true;
            birdAt(b, t, BP0); birdAt(b, t + 1.2, BP1);
            const x = BP0[0], z = BP0[1], dx = BP1[0] - x, dz = BP1[1] - z, sp = Math.sqrt(dx * dx + dz * dz) / 1.2;
            const want = sp > 0.02 ? Math.atan2(dx, dz) : b.h; let dh = want - b.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
            b.h = b.init ? b.h + dh * Math.min(1, dt * 1.5 * (near ? 1 : 3)) : want; b.init = true; b.x = x; b.z = z; b.sp = sp;
            const bob = Math.sin(t * 1.7 + i * 1.3) * 0.025, sc = vis ? b.scale : 0;
            EUL.set(Math.sin(t * 1.3 + i) * 0.03, b.h, Math.sin(t * 1.1 + i * 2) * 0.03, 'YXZ'); Qb.setFromEuler(EUL);
            birdMesh.setMatrixAt(i, I4.compose(V3.set(x, uWY.value - 0.06 * b.scale + bob, z), Qb, S3.set(sc, sc, sc)));
            const w = (WAKE0 + i) * 4; if (w < NFX * 4) { fxA[w] = x; fxA[w + 1] = z; fxA[w + 2] = b.h; fxA[w + 3] = b.scale; fxB[w] = 2; fxB[w + 1] = vis ? Math.min(1, 0.35 + sp * 2.2) : 0; fxB[w + 2] = 0.55; fxB[w + 3] = i; }
          }
          birdMesh.instanceMatrix.needsUpdate = true;
        } else { for (let i = 0; i < birds.length; i++) if (birds[i].where === 'lake' ? lakeVis : moatVis) { anyBird = true; break; } }
        birdMesh.visible = anyBird;
      }
      // leaps (not in winter, not when the camera is far up), rings
      if (!winter && (moatVis || lakeVis) && cy < 200) {
        if (!jump && t > nextLeap) { scheduleLeap(t, camera); nextLeap = t + 3.5 + R() * 6; }
      }
      if (jump) {
        const u = (t - jump.t0) / jump.dur;
        if (u >= 1) { if (!jump.landed) { ringAt(jump.x1, jump.z1, t, 2.8, 0, 1); ringAt(jump.x1, jump.z1, t, 0.75 * jump.s, 1, 1); } leap.visible = false; jump = null; }
        else {
          const x = jump.x + (jump.x1 - jump.x) * u, z = jump.z + (jump.z1 - jump.z) * u, y = uWY.value - 0.15 + jump.h * 4 * u * (1 - u);
          leap.visible = true; leap.position.set(x, y, z); EUL.set(-(1 - 2 * u) * 1.1, jump.a, Math.sin(u * 9) * 0.15, 'YXZ'); leap.rotation.copy(EUL); leap.scale.setScalar(jump.s);
        }
      }
      fx.visible = anyBird || !!jump || t - fxLast < 3;
      fxAA.needsUpdate = true; fxBA.needsUpdate = true;
      // the boat rocks at its mooring
      if (boat) { boat.visible = lakeVis; if (lakeVis) { const b = boat.userData.base; boat.position.y = uWY.value + 0.2 + Math.sin(t * 0.9) * 0.025; boat.rotation.set(Math.sin(t * 0.7) * 0.012, b.ry + Math.sin(t * 0.13) * 0.05, Math.sin(t * 0.83 + 1) * 0.03, 'YXZ'); } }
      // mist: at night and above all at dawn (and on winter mornings), thinning as the sun climbs
      if (mist) {
        const dawn = Math.max(0, 1 - Math.abs(hour - 6.3) / 2.2), m = Math.min(1, night * 0.55 + dawn * (winter ? 1.0 : 0.85));
        warm += ((m > 0.02 ? 1 : 0) - warm) * Math.min(1, dt);
        mist.material.uniforms.uMist.value = m;
        mist.visible = m > 0.02 && (moatVis || lakeVis) && cy < 300;
        if (P) mist.material.uniforms.uCol.value.copy(P.fog).lerp(MISTW, dawn > 0.2 ? 0.5 : 0.25).multiplyScalar(0.55 + 0.45 * (1 - night));
      }
      if (flies) { const on = Math.max(0, (night - 0.4) / 0.6); flies.visible = on > 0.02 && cy < 220 && (lakeVis || moatVis); flies.material.uniforms.uOn.value = on; }
      lastT = t;
    },
  };
}
