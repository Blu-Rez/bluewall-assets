// The ruins a fallen structure leaves behind (the "swap with a wreck" technique of Clash of Clans / Boom Beach):
//   the destruction shader (destruct.js) only makes the FALL and then buries what is left of the original mesh under the ground; what the player sees afterwards
//   is this kit: a lumpy mound of broken stone with slabs, stubs of wall and splintered beams sticking out of it.  3 geometry variants, one InstancedMesh each
//   (3 draw calls for the whole battle), every instance is stretched over the footprint of the building that fell and rises out of the dust cloud in about a second.
//   const R = createRuins(scene, height);  R.add(type, x, z, w, d, h, rot);  R.update(dt);  R.clear();  R.dispose();
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const lcg = (seed) => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };
const hash3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), u), L(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), u), v), L(L(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), u), L(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), u), v), w);
}

// stone / wood palettes (the per-structure tint is the instance colour; these are dark on purpose: a fallen building is sooty, wet and in its own shade)
const STONE = [[0.2, 0.2, 0.22], [0.16, 0.165, 0.18], [0.25, 0.25, 0.265], [0.12, 0.125, 0.14], [0.22, 0.2, 0.185], [0.18, 0.17, 0.17]];
const SLAB = [[0.34, 0.33, 0.32], [0.28, 0.28, 0.29], [0.38, 0.36, 0.32]];
const WOOD = [[0.2, 0.13, 0.08], [0.27, 0.18, 0.1], [0.14, 0.1, 0.07]];
const ASH = [0.07, 0.065, 0.06];

function paint(geo, pick) {                                  // flat colour per triangle (the geometry is non-indexed)
  const n = geo.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 3) { const c = pick(i / 3, geo.attributes.position, i); for (let k = 0; k < 3; k++) { col[(i + k) * 3] = c[0]; col[(i + k) * 3 + 1] = c[1]; col[(i + k) * 3 + 2] = c[2]; } }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); return geo;
}

// one variant of the heap (unit radius, ~0.65 high, flat bottom just below the ground): a dark core, ~56 broken blocks piled in it (bigger in the middle),
// slabs of lighter stone, stubs of wall that still stand and splintered beams sticking out
function heapGeometry(seed) {
  const R = lcg(seed), parts = [], off = R() * 50;
  const core = new THREE.IcosahedronGeometry(1, 2), cp = core.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i), n = vnoise(x * 2.1 + off, y * 2.1, z * 2.1 + off), rad = Math.hypot(x, z);
    cp.setXYZ(i, x * (0.68 + 0.16 * n), (y > 0 ? Math.pow(y, 0.85) * 0.58 * (1 - 0.3 * rad) : y * 0.3) - 0.03, z * (0.68 + 0.16 * n));
  }
  core.computeVertexNormals(); paint(core, () => { const k = 0.7 + 0.5 * R(); return [ASH[0] * k * 1.6, ASH[1] * k * 1.6, ASH[2] * k * 1.6]; }); parts.push(core);
  const chunk = (cx, cy, cz, sz, flat, pal, lit) => {
    const g = new THREE.IcosahedronGeometry(1, 0), p = g.attributes.position, jit = new Map();
    for (let i = 0; i < p.count; i++) {
      const k = p.getX(i).toFixed(3) + ',' + p.getY(i).toFixed(3) + ',' + p.getZ(i).toFixed(3); let j = jit.get(k); if (!j) { j = 0.7 + 0.55 * R(); jit.set(k, j); }
      p.setXYZ(i, p.getX(i) * j, p.getY(i) * j, p.getZ(i) * j);
    }
    g.scale(sz * (0.8 + 0.5 * R()), sz * flat, sz * (0.8 + 0.5 * R())); g.rotateX((R() - 0.5) * 2.4); g.rotateY(R() * 6.283); g.rotateZ((R() - 0.5) * 2.4); g.translate(cx, cy, cz); g.computeVertexNormals();
    return paint(g, () => { const c = pal[(R() * pal.length) | 0], k = (0.75 + 0.5 * R()) * lit; return [c[0] * k, c[1] * k, c[2] * k]; });
  };
  for (let i = 0; i < 56; i++) {
    const r = Math.sqrt(R()) * 0.92, a = R() * 6.283, prof = Math.pow(Math.max(0, 1 - r * r), 0.8), cy = 0.03 + prof * 0.6 * (0.3 + 0.7 * R());
    const sz = (0.07 + 0.2 * R() * R()) * (1.25 - 0.55 * r), pal = R() < 0.14 ? SLAB : STONE;
    parts.push(chunk(Math.cos(a) * r, cy, Math.sin(a) * r, sz, 0.42 + 0.38 * R(), pal, 1));
  }
  const box = (sx, sy, sz, x, y, z, rx, ry, rz, pal) => {
    const b = new THREE.BoxGeometry(sx, sy, sz).toNonIndexed(); b.rotateX(rx); b.rotateY(ry); b.rotateZ(rz); b.translate(x, y, z); b.computeVertexNormals();
    return paint(b, () => { const s = pal[(R() * pal.length) | 0], k = 0.88 + 0.22 * R(); return [s[0] * k, s[1] * k, s[2] * k]; });
  };
  for (let i = 0; i < 7; i++) {                                // fallen slabs, tilted, half buried
    const a = R() * 6.283, r = 0.12 + R() * 0.62;
    parts.push(box(0.2 + R() * 0.2, 0.05 + R() * 0.06, 0.14 + R() * 0.16, Math.cos(a) * r, 0.1 + (0.7 - r) * 0.3, Math.sin(a) * r, (R() - 0.5) * 0.9, R() * 3.14, (R() - 0.5) * 0.9, SLAB));
  }
  for (let i = 0; i < 4; i++) {                                // jagged stubs of the old walls that still stand
    const a = R() * 6.283, r = 0.35 + R() * 0.4, h = 0.2 + R() * 0.34;
    parts.push(box(0.14 + R() * 0.12, h, 0.06 + R() * 0.05, Math.cos(a) * r, h * 0.45, Math.sin(a) * r, (R() - 0.5) * 0.25, a + 1.57 + (R() - 0.5) * 0.5, (R() - 0.5) * 0.3, STONE));
  }
  for (let i = 0; i < 7; i++) {                                // splintered beams
    const a = R() * 6.283, r = 0.08 + R() * 0.55, L = 0.45 + R() * 0.5;
    parts.push(box(0.04 + R() * 0.025, 0.04 + R() * 0.025, L, Math.cos(a) * r, 0.16 + R() * 0.2, Math.sin(a) * r, (R() - 0.5) * 0.9, R() * 6.283, (R() - 0.5) * 0.5, WOOD));
  }
  const g = mergeGeometries(parts.map((q) => (q.index ? q.toNonIndexed() : q)), false);
  for (const q of parts) q.dispose();
  g.computeBoundingSphere(); return g;
}

// tint per kind of structure (multiplies the vertex colours)
const TINT = {
  keep: [0.95, 0.97, 1.05], tower: [0.95, 0.97, 1.05], wall: [0.98, 0.98, 1.0], gate: [0.95, 0.9, 0.85], vault: [1.1, 1.08, 1.0], church: [1.05, 1.03, 1.0],
  house: [1.15, 0.95, 0.82], mine: [0.9, 0.88, 0.85], ballista: [0.95, 0.9, 0.85], barracks: [1.05, 0.92, 0.82], training: [1.05, 0.92, 0.82], forge: [0.9, 0.86, 0.85], stable: [1.1, 0.9, 0.75], workshop: [1.1, 0.9, 0.75], lair: [0.85, 0.85, 0.9],
};
const BIG = { keep: 1, church: 1, vault: 1, lair: 1 };

export function createRuins(scene, height) {
  const G = new THREE.Group(); G.name = 'ruins'; scene.add(G);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0, flatShading: true, envMapIntensity: 0.35 });
  mat.onBeforeCompile = (sh) => {                                // a fine grain over the flat colours so the stones do not look like plastic
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRw;').replace('#include <project_vertex>', '#include <project_vertex>\n#ifdef USE_INSTANCING\n vRw = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#else\n vRw = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#endif');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vRw;\nfloat rg(vec3 p){return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);}\nfloat rn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(rg(i),rg(i+vec3(1,0,0)),f.x),mix(rg(i+vec3(0,1,0)),rg(i+vec3(1,1,0)),f.x),f.y),mix(mix(rg(i+vec3(0,0,1)),rg(i+vec3(1,0,1)),f.x),mix(rg(i+vec3(0,1,1)),rg(i+vec3(1,1,1)),f.x),f.y),f.z);}')
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= 0.72 + 0.5 * rn(vRw * 2.6) * (0.6 + 0.8 * rn(vRw * 9.0));');
  };
  mat.customProgramCacheKey = () => 'bwruins1';
  const CAP = 200, V = [];
  for (let k = 0; k < 3; k++) {
    const im = new THREE.InstancedMesh(heapGeometry(1000 + k * 77), mat, CAP); im.count = 0; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.name = 'ruins' + k;
    im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 3), 3); G.add(im); V.push({ im, n: 0 });
  }
  const live = [];                                               // instances still rising: { v, i, t, dur, base:{x,y,z, qx..}, sx, sy, sz }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _Y = new THREE.Vector3(0, 1, 0), _e = new THREE.Euler();
  let seq = 0;

  function place(v, i, o, k) {
    const e = k >= 1 ? 1 : k * k * (3 - 2 * k), over = k >= 1 ? 1 : 1 + 0.06 * Math.sin(k * 3.1416);
    _q.setFromAxisAngle(_Y, o.rot); _p.set(o.x, o.y - (1 - e) * o.sy * 0.5, o.z); _s.set(o.sx * (0.82 + 0.18 * e), Math.max(0.02, o.sy * e * over), o.sz * (0.82 + 0.18 * e));
    _m.compose(_p, _q, _s); v.im.setMatrixAt(i, _m); v.im.instanceMatrix.needsUpdate = true;
  }
  function addOne(type, x, z, w, d, h, rot, k0 = 1, delay = 0) {
    const v = V[(seq++) % 3]; if (v.n >= CAP) return;
    const wall = type === 'wall' || type === 'gate', big = !!BIG[type];
    // sit on the lowest ground of the footprint so no side floats on a slope
    const hw = w * 0.35, hd = d * 0.35, cr = Math.cos(rot), sr = Math.sin(rot);
    let gy = height(x, z); for (const [a, b] of [[hw, hd], [-hw, hd], [hw, -hd], [-hw, -hd]]) gy = Math.min(gy, height(x + a * cr + b * sr, z - a * sr + b * cr));
    const sx = (wall ? w * 0.53 : Math.max(w, 4) * 0.58) * k0, sz = (wall ? Math.max(d * 0.95, 3.2) : Math.max(d, 4) * 0.58) * k0;
    const target = Math.max(1.8, Math.min(big ? 6.6 : wall ? 3.0 : 4.6, h * (big ? 0.2 : wall ? 0.26 : 0.3) + Math.min(w, d) * 0.04)) * (0.85 + 0.3 * Math.random());
    const o = { x, y: gy - 0.12, z, rot: rot + (Math.random() - 0.5) * 0.5 * (wall ? 0.1 : 1), sx, sz, sy: target / 0.62 * k0 };
    const i = v.n++; v.im.count = v.n;
    const tn = TINT[type] || TINT.house, f = 0.85 + Math.random() * 0.3; _c.setRGB(tn[0] * f, tn[1] * f, tn[2] * f); v.im.setColorAt(i, _c); v.im.instanceColor.needsUpdate = true;
    place(v, i, o, 0); live.push({ v, i, o, t: -delay, dur: 1.0 + 0.8 * Math.random() });
  }
  return {
    add(type, x, z, w, d, h, rot) {
      addOne(type, x, z, w, d, h, rot || 0);
      if (BIG[type]) {                                          // the great buildings leave bigger piles with satellites where their corner towers stood
        const hw = w * 0.32, hd = d * 0.32, cr = Math.cos(rot || 0), sr = Math.sin(rot || 0);
        for (const [a, b] of [[hw, hd], [-hw, hd], [hw, -hd], [-hw, -hd]]) if (Math.random() < (type === 'keep' ? 0.9 : 0.5)) addOne(type, x + a * cr + b * sr, z - a * sr + b * cr, w * 0.4, d * 0.4, h * 0.7, Math.random() * 6.28, 1, 0.1 + Math.random() * 0.4);
      }
    },
    update(dt) {
      for (let j = live.length - 1; j >= 0; j--) {
        const L = live[j]; L.t += dt; if (L.t < 0) continue; const k = Math.min(1, L.t / L.dur); place(L.v, L.i, L.o, k); if (k >= 1) live.splice(j, 1);
      }
    },
    clear() { for (const v of V) { v.n = 0; v.im.count = 0; } live.length = 0; seq = 0; },
    stats: () => V.reduce((a, v) => a + v.n, 0),
    dispose() { scene.remove(G); for (const v of V) v.im.geometry.dispose(); mat.dispose(); },
  };
}
