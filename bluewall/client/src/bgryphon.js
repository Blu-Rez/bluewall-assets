// The gryphon (p35: gryphon + gryphon knight), built in three.js from gryphon.glb (DreamNoms, CC-BY) with our own rig and our own wing-beat.
//   const gl = buildGryphon(M.gryphon, { hero: false })  ->  { scene, animations, bones, seat }   (a skinned model: bunits_fly.js bakes it into a crowd kind, crowd.js createKind)
// Why not the file's own skeleton: the skins of this file do not match its skeleton (a mesh bound to the wrong bind pose: the animation turns the beast inside out), so only the
// STATIC geometry is used - the rest pose of every body mesh, turned upright by a fixed transform (A below: the file stores the beast upside down, half size) - and rigged again here:
//   bones      root > body > neck > head   tail1-3   fLegL/R (the eagle legs)   hLegL/R (the lion legs)   wL1-3 / wR1-3 (shoulder, elbow, hand)
//   wings      the file's one feather sheet (16 vertices, two alpha-cut feather textures: top + underside) mirrored for both wings, laid flat and cut into 14 strips so it bends
//   colours    flat vertex colours by the file's own material names (navy / steel-blue fur, pale head, pale-gold beak + talons); the feathers keep the file's alpha-cut textures,
//              read as brightness and mapped through a navy -> steel -> pale ramp in the shader (crowd.js bwExtra)
//   clips      Fly 0.9 s (the wing-beat of a cruising flight) · Hover 1.1 s (big, slow, nose up, legs hanging) · Rest 2.0 s (standing, wings folded) · Atk 1.0 s (the strike lands at 0.43 s)
//              · Hit 0.5 s · Die 1.0 s (the wings fold up, the head drops)   - all procedural, sampled at 30 fps
// The model faces +z, y up, 1 unit = 1 m of the native beast: 4.5 m wing span, 1.9 m body + head, feet at y = 0.  Deterministic: no random numbers.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { bwExtra } from './crowd.js';

const A = (v) => v.set(0.5 * v.x, 1.5 - 0.5 * v.y, -0.52 - 0.5 * v.z);          // file -> upright model (a rotation of 180 degrees about x, half size)
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---- the skeleton: [name, parent, pivot x, y, z]  (rest pose = standing, wings spread flat)
const SEAT = [0, 0.74, -0.02];                                                      // where the rider's pelvis sits
const WY = 0.76, WZ = 0.12, CH = 1.3;                                                        // shoulder height / fore-aft of the wing root
const BONES = [
  ['root', null, 0, 0, 0], ['body', 'root', 0, 0.55, 0], ['neck', 'body', 0, 0.7, 0.42], ['head', 'neck', 0, 0.92, 0.72],
  ['tail1', 'body', 0, 0.38, -0.5], ['tail2', 'tail1', 0, 0.17, -1.15], ['tail3', 'tail2', 0, 0.2, -1.5],
  ['fLegL', 'body', 0.2, 0.42, 0.38], ['fLegR', 'body', -0.2, 0.42, 0.38], ['hLegL', 'body', 0.28, 0.5, -0.2], ['hLegR', 'body', -0.28, 0.5, -0.2],
  ['wL1', 'body', 0.15, WY, WZ], ['wL2', 'wL1', 1.0, WY, WZ], ['wL3', 'wL2', 1.65, WY, WZ],
  ['wR1', 'body', -0.15, WY, WZ], ['wR2', 'wR1', -1.0, WY, WZ], ['wR3', 'wR2', -1.65, WY, WZ],
];
const IDX = {}; BONES.forEach((b, i) => { IDX[b[0]] = i; });

// ---- skin weights of a body vertex: [[bone, weight], ...]
function skinOf(x, y, z, mat) {
  const L = x >= 0 ? 'L' : 'R', ax = Math.abs(x), w = {};
  const add = (n, k) => { if (k > 1e-3) w[n] = (w[n] || 0) + k; };
  if (mat === 'Talons') { add('fLeg' + L, 1); return w; }
  let rest = 1;
  if (mat === 'White' || mat === 'Beak' || mat === 'EyeRim') {                       // head + neck + chest
    const nk = ss(0.3, 0.55, z), hd = ss(0.6, 0.85, z);
    add('neck', nk * (1 - hd)); add('head', nk * hd); rest = 1 - nk;
  }
  const tail = ss(-0.34, -0.62, z);                                                  // tail
  if (tail > 0) {
    const t2 = ss(-0.95, -1.3, z), t3 = ss(-1.4, -1.7, z);
    add('tail1', tail * (1 - t2)); add('tail2', tail * t2 * (1 - t3)); add('tail3', tail * t2 * t3); rest *= 1 - tail;
  }
  const hl = ss(0.07, 0.17, ax) * ss(0.52, 0.32, y) * ss(0.2, 0.05, z) * ss(-0.6, -0.4, z);      // hind legs
  const fl = ss(0.08, 0.18, ax) * ss(0.45, 0.3, y) * ss(0.1, 0.2, z) * (mat === 'White' ? 0 : 1);     // the top of the fore legs inside the Brown mesh
  add('hLeg' + L, hl * rest); add('fLeg' + L, fl * rest); rest *= 1 - hl - fl * (1 - hl);
  add('body', Math.max(0, rest));
  return w;
}

const PAL = {
  gryphon: { White: 0xc4d6ee, Brown: 0x3a5a8e, Talons: 0xe6c673, Beak: 0xf0d27c, EyeRim: 0x0b101c, LayeringBack: 0x172b5c, wing: [[0.008, 0.02, 0.07], [0.04, 0.11, 0.27], [0.55, 0.68, 0.88]], under: [[0.05, 0.09, 0.2], [0.16, 0.27, 0.5], [0.7, 0.8, 0.95]] },
  hero: { White: 0xe2edfb, Brown: 0x22407c, Talons: 0xf4d787, Beak: 0xffe39a, EyeRim: 0x0b101c, LayeringBack: 0x10224f, wing: [[0.004, 0.012, 0.05], [0.02, 0.07, 0.2], [0.7, 0.82, 1.0]], under: [[0.04, 0.08, 0.2], [0.14, 0.25, 0.5], [0.8, 0.88, 1.0]] },
};

// feather ramp: the texture's brightness -> dark navy / steel blue / pale (uniforms differ per look, the code is shared)
const wingExtra = (look, key) => ({
  key: 'gryw', uniforms: { uWc0: { value: new THREE.Color().fromArray(look[0]) }, uWc1: { value: new THREE.Color().fromArray(look[1]) }, uWc2: { value: new THREE.Color().fromArray(look[2]) } },
  fHead: 'uniform vec3 uWc0; uniform vec3 uWc1; uniform vec3 uWc2;',
  frag: [['color_fragment', `{ float bwL = sqrt(max(dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)), 0.0)); vec3 bwC = mix(uWc0, uWc1, smoothstep(0.2, 0.5, bwL)); diffuseColor.rgb = mix(bwC, uWc2, smoothstep(0.62, 0.92, bwL)); }`]],
});

// ---- the static rest geometry of the file's skinned meshes, upright: { name: { pos, idx, uv, mat } }
function restGeometry(g) {
  const root = SkeletonUtils.clone(g.scene); root.updateMatrixWorld(true);
  const out = {}, v = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isSkinnedMesh) return;
    o.skeleton.update();
    const ps = o.geometry.attributes.position, uv = o.geometry.attributes.uv, n = ps.count, pos = new Float32Array(n * 3), UV = uv ? new Float32Array(n * 2) : null;
    for (let i = 0; i < n; i++) { v.fromBufferAttribute(ps, i); o.applyBoneTransform(i, v); v.applyMatrix4(o.matrixWorld); A(v).toArray(pos, i * 3); if (uv) { UV[i * 2] = uv.getX(i); UV[i * 2 + 1] = uv.getY(i); } }
    out[o.name] = { pos, idx: Array.from(o.geometry.index.array), uv: UV, mat: o.material };
  });
  return out;
}

// the wing sheet of one layer: stations from the root to the tip (lead / trail edge: x, y, u, v), from the file's 16-vertex strip
function stations(m) {
  const by = new Map();
  for (let i = 0; i < m.pos.length / 3; i++) { const x = Math.round(m.pos[i * 3] * 1000); if (!by.has(x)) by.set(x, []); by.get(x).push([m.pos[i * 3 + 1], m.uv[i * 2], m.uv[i * 2 + 1]]); }
  return [...by.keys()].sort((a, b) => b - a).map((k) => { const p = by.get(k).sort((a, b) => a[0] - b[0]); return { s: Math.abs(k / 1000), lead: p[0], trail: p[p.length - 1] }; });
}

export function buildGryphon(g, { hero = false, id = 'gry', rider = null } = {}) {
  const look = hero ? PAL.hero : PAL.gryphon, rest = restGeometry(g), col = new THREE.Color();
  // ---- the bones
  const bones = BONES.map((b) => { const o = new THREE.Bone(); o.name = b[0]; return o; });
  BONES.forEach((b, i) => { const p = b[1] ? BONES[IDX[b[1]]] : null; bones[i].position.set(b[2] - (p ? p[2] : 0), b[3] - (p ? p[3] : 0), b[4] - (p ? p[4] : 0)); if (p) bones[IDX[b[1]]].add(bones[i]); });
  const scene = new THREE.Group(); scene.name = id; scene.add(bones[0]); scene.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);

  // ---- body: Body003_0..5 merged, one vertex colour per material, skinned
  const parts = Object.entries(rest).filter(([n]) => /^Body003_/.test(n)).sort((a, b) => (a[0] < b[0] ? -1 : 1)), P = [], C = [], SI = [], SW = [], IX = [];
  let n0 = 0, sgn = 0;
  for (const [, m] of parts) {                                                           // winding: the sum of (face normal . face position - centre) tells whether the faces look outwards
    const c = new THREE.Vector3(); for (let i = 0; i < m.pos.length; i += 3) c.x += m.pos[i], c.y += m.pos[i + 1], c.z += m.pos[i + 2]; c.multiplyScalar(3 / m.pos.length);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
    for (let t = 0; t < m.idx.length; t += 3) { a.fromArray(m.pos, m.idx[t] * 3); b.fromArray(m.pos, m.idx[t + 1] * 3); d.fromArray(m.pos, m.idx[t + 2] * 3); e1.subVectors(b, a); e2.subVectors(d, a); e1.cross(e2); a.add(b).add(d).multiplyScalar(1 / 3).sub(c); sgn += e1.dot(a); }
  }
  for (const [, m] of parts) {
    const mn = m.mat.name, base = new THREE.Color(look[mn] ?? 0x888888), n = m.pos.length / 3;
    for (let i = 0; i < n; i++) {
      const x = m.pos[i * 3], y = m.pos[i * 3 + 1], z = m.pos[i * 3 + 2];
      const sh = mn === 'Brown' ? 0.62 + 0.55 * ss(0.05, 0.9, y) : mn === 'White' ? 0.82 + 0.22 * ss(0.3, 1.2, y) : 1;       // darker belly, lighter back
      col.copy(base).multiplyScalar(sh); P.push(x, y, z); C.push(col.r, col.g, col.b);
      const w = skinOf(x, y, z, mn), ks = Object.keys(w).sort((a, b) => w[b] - w[a]).slice(0, 4), tot = ks.reduce((s, k) => s + w[k], 0) || 1;
      for (let k = 0; k < 4; k++) { SI.push(k < ks.length ? IDX[ks[k]] : 0); SW.push(k < ks.length ? w[ks[k]] / tot : 0); }
    }
    for (let t = 0; t < m.idx.length; t += 3) { if (sgn >= 0) IX.push(m.idx[t] + n0, m.idx[t + 1] + n0, m.idx[t + 2] + n0); else IX.push(m.idx[t] + n0, m.idx[t + 2] + n0, m.idx[t + 1] + n0); }
    n0 += n;
  }
  // ---- extra parts built here: the hooked beak (the file's is a tiny wedge), the hero's barding (breast plate, saddle cloth)
  const piece = (geo, hex, bone, shade = 1) => {
    if (!geo.index) geo = geo.toNonIndexed(), geo.setIndex([...Array(geo.attributes.position.count).keys()]);
    const pp = geo.attributes.position, c = new THREE.Color(hex).multiplyScalar(shade), n = pp.count;
    for (let i = 0; i < n; i++) { P.push(pp.getX(i), pp.getY(i), pp.getZ(i)); C.push(c.r, c.g, c.b); SI.push(IDX[bone], 0, 0, 0); SW.push(1, 0, 0, 0); }
    const ix = geo.index; for (let t = 0; t < ix.count; t++) IX.push(ix.getX(t) + n0); n0 += n;
  };
  const beak = (len, r, y, z, hex) => {
    const up = new THREE.ConeGeometry(r, len, 7, 2).rotateX(Math.PI / 2).scale(0.85, 0.9, 1), pa = up.attributes.position;
    for (let i = 0; i < pa.count; i++) { const zz = pa.getZ(i) + len / 2; pa.setY(i, pa.getY(i) - 0.55 * zz * zz / len); pa.setZ(i, pa.getZ(i) + len / 2 + z); pa.setY(i, pa.getY(i) + y); }
    piece(up, hex, 'head');
    const lo = new THREE.ConeGeometry(r * 0.7, len * 0.78, 6, 1).rotateX(Math.PI / 2).scale(0.8, 0.7, 1); lo.translate(0, y - r * 0.9, z + len * 0.39); piece(lo, hex, 'head', 0.9);
  };
  beak(0.3, 0.1, 1.02, 1.07, look.Beak);
  if (hero) {
    piece(new THREE.SphereGeometry(1, 14, 9).scale(0.31, 0.3, 0.2).translate(0, 0.5, 0.44), 0xb4c4dc, 'body', 1);                  // breast plate
    piece(new THREE.BoxGeometry(0.74, 0.05, 0.62).translate(0, 0.835, 0.04), 0x14295c, 'body');                                      // saddle cloth + the flaps hanging down both sides
    for (const sx of [-1, 1]) piece(new THREE.BoxGeometry(0.05, 0.3, 0.6).rotateZ(sx * 0.35).translate(sx * 0.4, 0.68, 0.04), 0x14295c, 'body', 0.9);
    piece(new THREE.BoxGeometry(0.78, 0.03, 0.05).translate(0, 0.86, 0.34), 0xc9d6ea, 'body'); piece(new THREE.BoxGeometry(0.78, 0.03, 0.05).translate(0, 0.86, -0.26), 0xc9d6ea, 'body');   // silver edging
  }
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  bg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n0 * 2), 2));
  bg.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4)); bg.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW, 4)); bg.setIndex(IX);
  bg.computeVertexNormals(); bg.computeBoundingSphere();
  const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.02, name: id + '_body', envMapIntensity: 0.7 });
  const body = new THREE.SkinnedMesh(bg, bodyMat); body.name = id + '_body'; scene.add(body);

  // ---- wings: two layers (top / underside), each one sheet per wing
  const wings = (layer, mesh) => {
    const st = stations(rest[mesh]), N = st.length, P2 = [], U2 = [], SI2 = [], SW2 = [], I2 = [], zc = 0.55;
    const sub = []; for (let k = 0; k < N - 1; k++) for (const f of [0, 0.5]) { const a = st[k], b = st[k + 1], L = (i) => lerp(a.lead[i], b.lead[i], f), T = (i) => lerp(a.trail[i], b.trail[i], f); sub.push({ s: lerp(a.s, b.s, f), lead: [L(0), L(1), L(2)], trail: [T(0), T(1), T(2)] }); }
    sub.push(st[N - 1]);
    const s0 = sub[0].s, dy = layer === 'top' ? 0.012 : -0.012;
    for (const side of [1, -1]) {
      const base = P2.length / 3, nm = side > 0 ? 'L' : 'R';
      sub.forEach((q) => {
        const s = q.s - s0, x = side * (0.153 + s), a1 = ss(0.55, 1.15, s), a2 = ss(1.2, 1.8, s), wb = [IDX['w' + nm + '1'], IDX['w' + nm + '2'], IDX['w' + nm + '3']], ww = [1 - a1, a1 * (1 - a2), a1 * a2];
        for (const e of [q.lead, q.trail]) {
          P2.push(x, WY + dy, WZ + (zc - e[0]) * CH); U2.push(e[1], e[2]);
          for (let k = 0; k < 4; k++) { SI2.push(k < 3 ? wb[k] : 0); SW2.push(k < 3 ? ww[k] : 0); }
        }
      });
      for (let k = 0; k < sub.length - 1; k++) { const a = base + k * 2, b = a + 1, c = a + 2, d = a + 3; if (side > 0) I2.push(a, b, c, c, b, d); else I2.push(a, c, b, c, d, b); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(U2, 2));
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI2, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW2, 4));
    geo.setIndex(I2); geo.computeVertexNormals();
    if ((layer === 'top') !== (geo.attributes.normal.getY(0) > 0)) { for (let i = 0; i < I2.length; i += 3) { const t = I2[i + 1]; I2[i + 1] = I2[i + 2]; I2[i + 2] = t; } geo.setIndex(I2); geo.computeVertexNormals(); }
    geo.computeBoundingSphere();
    return geo;
  };
  for (const [layer, mesh] of [['top', 'Feathers003_0'], ['under', 'Feathers003_1']]) {
    if (!rest[mesh]) continue;
    const src = rest[mesh].mat, mat = new THREE.MeshStandardMaterial({ map: src.map, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.74, metalness: 0, name: id + '_' + layer, envMapIntensity: 0.6 });
    bwExtra.set(mat, wingExtra(layer === 'top' ? look.wing : look.under));
    const m = new THREE.SkinnedMesh(wings(layer === 'top' ? 'top' : 'under', mesh), mat); m.name = id + '_wing_' + layer; scene.add(m);
  }
  // ---- the rider (bgrider.js bakeKnight pieces in the knight's metres): frozen in the saddle, every vertex on the body bone (so he rides the wing-beat); k = his size in this model's units
  if (rider) {
    const k = rider.k || 0.9, T = new THREE.Matrix4().compose(new THREE.Vector3(0, SEAT[1] - 0.96 * k, SEAT[2] + 0.04 * k), new THREE.Quaternion(), new THREE.Vector3(k, k, k));
    for (const p of rider.pieces) {
      const geo = p.geo.clone().applyMatrix4(T), n = geo.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { si[i * 4] = IDX.body; sw[i * 4] = 1; }
      geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); geo.computeBoundingSphere();
      let mat = p.material; const ex = bwExtra.get(mat);
      if (ex && ex.key === 'plume') {                                                  // the plume sways in the units of its vertices: its own uniforms for this scale (the colours stay the shared ones)
        mat = mat.clone(); bwExtra.set(mat, { ...ex, uniforms: { ...ex.uniforms, uHairBack: { value: new THREE.Vector3(0, -0.035, -0.05).multiplyScalar(k) }, uHairSide: { value: new THREE.Vector3(0.045, 0, 0).multiplyScalar(k) } } });
      }
      const m = new THREE.SkinnedMesh(geo, mat); m.name = id + '_rider_' + p.name; scene.add(m);
    }
  }
  scene.traverse((o) => { if (o.isSkinnedMesh) { o.frustumCulled = false; o.castShadow = true; o.receiveShadow = true; } });
  scene.updateMatrixWorld(true);
  for (const o of scene.children) if (o.isSkinnedMesh) o.bind(skeleton, o.matrixWorld);
  scene.userData.bwMerged = true;                                                      // (crowd.js: already one mesh per material)
  return { scene, animations: makeClips(), bones: IDX, seat: SEAT };
}

// ---- the clips
// R = { body:[rx, ry, rz, dx, dy, dz], neck, head, tail1..3 : [rx, ry, rz], fLeg: rx, hLeg: rx, wing: { sh: [rx, ry, rz], el, hd } }   (the left wing; the right one is mirrored)
// rx: nose down (+) / up (-)   rz: wing tip up (+, left wing)   ry: wing swept back (+, left wing)   rx of a wing: leading edge down (+)
const keys = (u, K) => { if (u <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (u <= K[i][0]) { const t = (u - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return lerp(K[i - 1][1], K[i][1], t * t * (3 - 2 * t)); } return K[K.length - 1][1]; };
const TAU = Math.PI * 2;
const POSES = {
  Fly: { dur: 0.9, loop: true, f: (u) => {
    const p = u * TAU, s = Math.sin(p);
    return { body: [0.06, 0, 0, 0, -0.04 * Math.cos(p), 0], neck: [-0.1 + 0.03 * Math.sin(p - 0.6), 0, 0], head: [0.06 - 0.03 * Math.sin(p - 0.6), 0, 0],
      tail1: [-0.05 + 0.06 * Math.sin(p - 1.0), 0.12 * Math.sin(p + 0.5), 0], tail2: [0.08 * Math.sin(p - 1.7), 0.15 * Math.sin(p - 0.3), 0], tail3: [0.12 * Math.sin(p - 2.4), 0.2 * Math.sin(p - 1.0), 0],
      fLeg: 1.1 + 0.05 * s, hLeg: 0.7 + 0.08 * Math.sin(p - 0.5),
      wing: { sh: [-0.1 * Math.cos(p), -0.12 * s, 0.15 + 0.6 * s], el: [0, 0, 0.05 + 0.45 * Math.sin(p - 0.9)], hd: [0.2 * Math.cos(p - 1.8), 0, 0.55 * Math.sin(p - 1.8)] } };
  } },
  Hover: { dur: 1.1, loop: true, f: (u) => {
    const p = u * TAU, s = Math.sin(p);
    return { body: [-0.32, 0, 0, 0, -0.06 * Math.cos(p), 0], neck: [0.25, 0, 0], head: [0.1, 0, 0],
      tail1: [0.3, 0.1 * Math.sin(p), 0], tail2: [0.25, 0.14 * Math.sin(p - 1), 0], tail3: [0.2, 0.2 * Math.sin(p - 2), 0],
      fLeg: 0.55 + 0.05 * s, hLeg: 0.3 + 0.06 * Math.sin(p - 0.6),
      wing: { sh: [-0.15 * Math.cos(p), 0.25 * Math.cos(p), 0.35 + 0.8 * s], el: [0, 0, 0.1 + 0.5 * Math.sin(p - 1.0)], hd: [0.3 * Math.cos(p - 2.0), 0, 0.6 * Math.sin(p - 2.0)] } };
  } },
  Rest: { dur: 2.0, loop: true, f: (u) => {
    const p = u * TAU;
    return { body: [0, 0, 0, 0, 0.012 * Math.sin(p), 0], neck: [0.03 * Math.sin(p), 0, 0], head: [0, 0, 0], tail1: [0, 0.04 * Math.sin(p), 0], tail2: [0, 0.06 * Math.sin(p - 0.7), 0], tail3: [0, 0.08 * Math.sin(p - 1.4), 0],
      fLeg: 0, hLeg: 0, wing: { sh: [-1.3, 1.35, 0.2], el: [0, 0.8, 0.1], hd: [0, 0.6, 0] } };
  } },
  Atk: { dur: 1.0, loop: false, f: (u) => {
    const s = Math.sin(u * TAU + 0.44);
    return { body: [keys(u, [[0, -0.2], [0.25, -0.4], [0.43, 0.4], [0.7, 0.05], [1, -0.2]]), 0, 0, 0, 0, keys(u, [[0, 0], [0.25, -0.15], [0.43, 0.28], [0.7, 0.04], [1, 0]])],
      neck: [keys(u, [[0, 0.2], [0.28, -0.3], [0.43, 0.75], [0.7, 0.25], [1, 0.2]]), 0, 0], head: [keys(u, [[0, 0.1], [0.28, -0.2], [0.43, 0.4], [1, 0.1]]), 0, 0],
      tail1: [keys(u, [[0, 0.3], [0.43, -0.1], [1, 0.3]]), 0, 0], tail2: [0.2, 0.1 * s, 0], tail3: [0.15, 0.15 * s, 0],
      fLeg: keys(u, [[0, 0.55], [0.25, -0.2], [0.43, -1.0], [0.7, 0.1], [1, 0.55]]), hLeg: keys(u, [[0, 0.3], [0.43, -0.25], [1, 0.3]]),
      wing: { sh: [0, 0, 0.35 + 0.8 * s], el: [0, 0, 0.1 + 0.5 * Math.sin(u * TAU - 0.5)], hd: [0, 0, 0.6 * Math.sin(u * TAU - 1.5)] } };
  } },
  Hit: { dur: 0.5, loop: false, f: (u) => ({
    body: [keys(u, [[0, -0.2], [0.24, -0.55], [1, -0.2]]), 0, 0, 0, 0, keys(u, [[0, 0], [0.24, -0.14], [1, 0]])], neck: [keys(u, [[0, 0.25], [0.24, -0.4], [1, 0.25]]), 0, 0], head: [0.1, 0, 0],
    tail1: [0.3, 0, 0], tail2: [0.25, 0, 0], tail3: [0.2, 0, 0], fLeg: 0.55, hLeg: 0.3,
    wing: { sh: [0, 0, keys(u, [[0, 0.35], [0.3, 1.1], [1, 0.35]])], el: [0, 0, keys(u, [[0, 0.1], [0.3, 0.5], [1, 0.1]])], hd: [0, 0, keys(u, [[0, 0], [0.3, 0.5], [1, 0]])] } }) },
  Die: { dur: 1.0, loop: false, f: (u) => ({
    body: [keys(u, [[0, -0.2], [1, 0.35]]), 0, 0, 0, 0, 0], neck: [keys(u, [[0, 0.2], [1, 0.9]]), 0, 0], head: [keys(u, [[0, 0.1], [1, 0.6]]), 0, 0],
    tail1: [keys(u, [[0, 0.3], [1, 0.8]]), 0, 0], tail2: [keys(u, [[0, 0.25], [1, 0.5]]), 0, 0], tail3: [keys(u, [[0, 0.2], [1, 0.4]]), 0, 0],
    fLeg: keys(u, [[0, 0.55], [1, 0.2]]), hLeg: keys(u, [[0, 0.3], [1, -0.2]]),
    wing: { sh: [0, 0, keys(u, [[0, 0.3], [0.3, 1.3], [1, 1.0]])], el: [0, 0, keys(u, [[0, 0.1], [0.3, 0.6], [1, 1.2]])], hd: [0, 0, keys(u, [[0, 0], [0.4, 0.5], [1, 1.3]])] } }) },
};

function makeClips() {
  const out = [], q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YZX'), restPos = {}; BONES.forEach((b, i) => { restPos[b[0]] = [b[2] - (b[1] ? BONES[IDX[b[1]]][2] : 0), b[3] - (b[1] ? BONES[IDX[b[1]]][3] : 0), b[4] - (b[1] ? BONES[IDX[b[1]]][4] : 0)]; });
  for (const [name, P] of Object.entries(POSES)) {
    const N = Math.max(2, Math.round(P.dur * 30)), times = [], rot = {}, pos = [];
    const names = BONES.slice(1).map((b) => b[0]); for (const n of names) rot[n] = [];
    for (let i = 0; i <= N; i++) {
      const u = P.loop && i === N ? 0 : i / N, R = P.f(u); times.push((i / N) * P.dur);
      const put = (bn, a, mir) => { e.set(a[0], mir ? -a[1] : a[1], mir ? -a[2] : a[2]); q.setFromEuler(e); rot[bn].push(q.x, q.y, q.z, q.w); };
      put('body', R.body, false); put('neck', R.neck, false); put('head', R.head, false); put('tail1', R.tail1, false); put('tail2', R.tail2, false); put('tail3', R.tail3, false);
      for (const s of ['L', 'R']) {
        const m = s === 'R';
        put('fLeg' + s, [R.fLeg, 0, 0], false); put('hLeg' + s, [R.hLeg, 0, 0], false);
        put('w' + s + '1', R.wing.sh, m); put('w' + s + '2', R.wing.el, m); put('w' + s + '3', R.wing.hd, m);
      }
      const b = restPos.body; pos.push(b[0] + R.body[3], b[1] + R.body[4], b[2] + R.body[5]);
    }
    const tracks = [new THREE.VectorKeyframeTrack('body.position', times, pos)];
    for (const n of names) tracks.push(new THREE.QuaternionKeyframeTrack(n + '.quaternion', times, rot[n]));
    out.push(new THREE.AnimationClip(name, P.dur, tracks));
  }
  return out;
}
