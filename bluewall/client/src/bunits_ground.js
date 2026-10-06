// p35: the five new ground units of the 30-level roster: legionary (Roman foot soldier), captain (hero, banner bearer), ogre, lich (skeleton caster), treant (walking tree).
// bunits.js calls setupGround() once per battle (second wave, after the maiden / mage kinds) when the army has any of them.  Context (same as bunits_fly.js):
//   M       model cache      need(name)  load + cache      step(name, () => kind)  register a crowd kind in K + the scene      TYPE  per-type recipes      count  { unitType: n }
//   TT      tier of each unit type      K  the kinds      ANIMS  the soldier clip library (anims + anims_army)      BASE  clips every soldier kind bakes      LOD1  accessories dropped at LOD1
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createKind, bwExtra } from './crowd.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { trimClips } from './creature.js';
import { tintGear, GLINT, CLOTH, HAIR, kit } from './unitlook.js';

const rad = (d) => (d * Math.PI) / 180;
const strip = (g) => { if (g.__bwg) return; g.__bwg = true; for (const c of g.animations) c.name = c.name.replace(/^.*\|/, ''); trimClips(g); };
const bbox = (g) => new THREE.Box3().setFromObject(g.scene, true).getSize(new THREE.Vector3());

// ---- procedural gear: every prop piece is a non-indexed geometry with position / normal / uv / color / aGear (metalness, roughness, class: 0 plain · 1 steel · 2 trim -> the tier metal, crest mask) like gear_shield.js
const _c = new THREE.Color();
export function paint(g, hex, { metal = 0, rough = 0.7, cls = 0, shade = 1 } = {}) {
  if (g.index) g = g.toNonIndexed();
  const n = g.attributes.position.count, col = new Float32Array(n * 3), gear = new Float32Array(n * 4);
  _c.set(hex);
  for (let i = 0; i < n; i++) { col[i * 3] = cls ? shade : _c.r * shade; col[i * 3 + 1] = cls ? shade : _c.g * shade; col[i * 3 + 2] = cls ? shade : _c.b * shade; gear[i * 4] = metal; gear[i * 4 + 1] = rough; gear[i * 4 + 2] = cls; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aGear', new THREE.BufferAttribute(gear, 4));
  if (!g.attributes.normal) g.computeVertexNormals();
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color', 'aGear'].includes(k)) g.deleteAttribute(k);
  return g;
}
export const prop = (geos) => { const m = new THREE.Mesh(mergeGeometries(geos, false), new THREE.MeshStandardMaterial({ vertexColors: true, name: 'bwgear' })); const scene = new THREE.Group(); scene.add(m); return { scene }; };
const mk = (g, f) => { f && f(g); return g; };
const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

// ---- bone frames: a prop authored in the model's bind pose (metres, T-pose, facing +z) is moved into the frame of the bone it rides on (the troll armour of bunits.js does the same)
const framesOf = (gltf) => { gltf.scene.updateMatrixWorld(true); const f = {}; gltf.scene.traverse((o) => { if (o.isBone) f[o.name] = new THREE.Matrix4().copy(o.matrixWorld).invert(); }); return f; };
const onBone = (F, bone, geos) => { const inv = F[bone]; if (inv) for (const g of geos) g.applyMatrix4(inv); return geos; };
// the placement of a bone relative to another at one moment of a clip (the rig is cloned, the clip posed): a prop that rides on the hand in the shield pose, re-expressed on the forearm
function handToArm(gltf, anims, handBone, armBone, clipName, t) {
  const root = SkeletonUtils.clone(gltf.scene), clip = anims.animations.find((c) => c.name === clipName), mx = new THREE.AnimationMixer(root);
  if (clip) { mx.clipAction(clip).play(); mx.setTime(t); }
  root.updateMatrixWorld(true);
  return new THREE.Matrix4().copy(root.getObjectByName(armBone).matrixWorld).invert().multiply(root.getObjectByName(handBone).matrixWorld);
}
const lerp = (a, b, t) => a + (b - a) * t;
const prof = (pts, y) => { for (let i = 1; i < pts.length; i++) if (y <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (y - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0] || 1)); return pts[pts.length - 1][1]; };
// recolour a painted geometry by height: root colour at the bottom, tip colour at the top (a horsehair crest)
const gradeY = (g, hexA, hexB) => {
  const p = g.attributes.position, c = g.attributes.color, a = new THREE.Color(hexA), b = new THREE.Color(hexB), t = new THREE.Color(); let lo = 1e9, hi = -1e9;
  for (let i = 0; i < p.count; i++) { lo = Math.min(lo, p.getY(i)); hi = Math.max(hi, p.getY(i)); }
  for (let i = 0; i < p.count; i++) { t.copy(a).lerp(b, Math.min(1, Math.max(0, (p.getY(i) - lo) / (hi - lo || 1))) ** 1.7); c.setXYZ(i, t.r, t.g, t.b); }
  return g;
};
// a flat silhouette given in (a, b) pairs, thickened to `th` and stood up: a -> +z (forward), b -> +y, the thickness across x; centred on x = 0
const slab = (pts, th) => { const sh = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b))), g = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false, curveSegments: 1 }); g.translate(0, 0, -th / 2); g.rotateY(Math.PI / 2); return g; };
const CREST = [null, [0x0b1230, 0x1c3068], [0x0d1a40, 0x2848a0], [0x0f2050, 0x3563c8], [0x142a66, 0x8fb8f4], [0x1a52c0, 0xa6dcff]];       // the horsehair per tier: navy, deeper blue, royal blue, ice, crystal
const STEEL = { metal: 0.5, rough: 0.36, cls: 1 }, PLATE = { metal: 0.6, rough: 0.3, cls: 1, shade: 0.74 }, TRIM = { metal: 0.7, rough: 0.36, cls: 2 }, LEATHER = { rough: 0.78 };

// ---- the legionary's helm (a galea): a round steel bowl, a brow band, cheek plates, a flared neck guard and a front-to-back crest of navy horsehair on a steel comb.  Bind-pose metres, on the Head bone.
function galeaGeos(tier, captain) {
  const g = [], Y0 = 1.635, CZ = -0.012, SZ = 1.2;                                // the rim at the brow, the bowl's centre a little back (the hood sticks out behind)
  const stretch = (geo) => { geo.scale(1, 1, SZ); geo.translate(0, Y0, CZ); return geo; };
  const bowl = [[0, 0.245], [0.04, 0.24], [0.08, 0.222], [0.108, 0.186], [0.124, 0.135], [0.131, 0.07], [0.131, 0.015], [0.128, -0.005]];
  g.push(paint(stretch(lathe(bowl.map(([r, y]) => [r, y]), 20)), 0xffffff, STEEL));
  g.push(paint(stretch(lathe([[0.127, -0.012], [0.137, -0.006], [0.139, 0.012], [0.137, 0.028], [0.129, 0.034], [0.129, 0.0]], 20)), 0xffffff, TRIM));      // the brow band
  // neck guard (back half, flared) and the cheek plates (the sides, hinged under the band)
  g.push(paint(stretch(new THREE.LatheGeometry([[0.13, -0.006], [0.145, -0.04], [0.175, -0.088], [0.168, -0.092], [0.14, -0.045], [0.123, -0.002]].map(([r, y]) => new THREE.Vector2(r, y)), 10, Math.PI - 1.15, 2.3)), 0xffffff, STEEL));
  for (const sd of [-1, 1]) g.push(paint(stretch(new THREE.LatheGeometry([[0.13, -0.004], [0.126, -0.05], [0.108, -0.1], [0.101, -0.096], [0.118, -0.05], [0.122, 0.0]].map(([r, y]) => new THREE.Vector2(r, y)), 4, sd * Math.PI / 2 - 0.34, 0.68)), 0xffffff, STEEL));
  if (captain) {
    // the centurion's plume: a half-fan across the bowl (ear to ear), tall, on a steel holder; hair graded from navy at the root to white at the tip, a toothed top edge
    const top = [], bot = [], n = 24, H = 0.27, Wd = 0.17;
    for (let i = 0; i <= n; i++) { const u = (i / n) * 2 - 1, w = Math.sqrt(Math.max(0, 1 - u * u * 0.97)); top.push([u * Wd, Y0 + 0.215 + 0.02 + H * Math.pow(w, 0.7) + (i % 2 ? 0.02 : 0) * w]); bot.push([u * Wd, Y0 + 0.215 - 0.03 * Math.abs(u) * 2.2]); }
    const pl = slab([...top, ...bot.reverse()], 0.05); pl.rotateY(Math.PI / 2); pl.translate(0, 0, CZ);
    const hc = HAIR[Math.max(1, Math.min(5, tier))];
    g.push(gradeY(paint(pl, 0x0f1f4e, { rough: 0.92 }), hc[0], hc[1]));
    const hold = slab([[0.07, 0], [-0.09, 0], [-0.09, 0.03], [0.07, 0.03]], 0.045); hold.translate(0, Y0 + 0.2, CZ);
    g.push(paint(hold, 0xffffff, TRIM));
    return g;
  }
  if (kit('legionary', tier).crest) {
    // the comb: a steel rail along the bowl, the crest on it (a fan of horsehair with a toothed top edge)
    const L = 0.3, yb = (z) => prof(bowl.slice(0, 6), Math.min(Math.abs(z) / SZ, 0.131));
    const top = [], bot = [], n = 22, H = 0.108 + tier * 0.006;
    for (let i = 0; i <= n; i++) { const z = (0.5 - i / n) * L * 1.0, w = Math.sqrt(Math.max(0, 1 - ((2 * z) / L) ** 2)), base = Y0 + yb(z) * 1.0; top.push([z + CZ, base + 0.012 + H * Math.pow(w, 0.55) + (i % 2 ? 0.014 : 0) * w]); bot.push([z + CZ, base - 0.012]); }
    g.push(gradeY(paint(slab([...top, ...bot.reverse()], 0.036), 0x0f1f4e, { rough: 0.92 }), CREST[Math.max(1, Math.min(5, tier))][0], CREST[Math.max(1, Math.min(5, tier))][1]));
    const rail = []; for (let i = 0; i <= 10; i++) { const z = (0.5 - i / 10) * L * 0.9; rail.push([z + CZ, Y0 + yb(z) + 0.014]); } for (let i = 10; i >= 0; i--) { const z = (0.5 - i / 10) * L * 0.9; rail.push([z + CZ, Y0 + yb(z) - 0.006]); }
    g.push(paint(slab(rail, 0.05), 0xffffff, TRIM));
  }
  return g;
}
// ---- the gladius: a leaf blade, a ball guard, a ribbed grip and a round pommel, along +y from the fist like the soldiers' sword (grip about y -0.17..0.04, blade 0.06..0.66), the blade's flat in the x-y plane
function gladiusGeos() {
  const g = [], bl = [[0, 0], [0.04, 0.02], [0.056, 0.14], [0.05, 0.3], [0.036, 0.46], [0.014, 0.56], [0, 0.6]];
  const outline = [...bl.map(([x, y]) => [x, y]), ...bl.slice(0, -1).reverse().map(([x, y]) => [-x, y])];
  const sh = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y))), b = new THREE.ExtrudeGeometry(sh, { depth: 0.011, bevelEnabled: false, curveSegments: 1 }); b.translate(0, 0.06, -0.0055);
  g.push(paint(b, 0xffffff, { metal: 0.95, rough: 0.2, cls: 1, shade: 1.1 }));
  g.push(paint(mk(new THREE.BoxGeometry(0.1, 0.014, 0.03), (q) => q.translate(0, 0.052, 0)), 0xffffff, TRIM));
  g.push(paint(mk(new THREE.CylinderGeometry(0.0185, 0.0165, 0.2, 8), (q) => q.translate(0, -0.07, 0)), 0x2a1a12, LEATHER));
  g.push(paint(mk(new THREE.SphereGeometry(0.03, 8, 6), (q) => q.translate(0, -0.176, 0)), 0xffffff, TRIM));
  return g;
}
// ---- the scutum: a tall curved rectangle (a half-cylinder, hollow side to the bearer), the realm's crest high on the painted face, a steel boss and rim, held on the left forearm like the other shields (gear_shield.js: ARM, R_FIX)
const ARM = { hand: [0.05, -0.05, 0], dir: [0.97, 0.22, -0.05], len: 0.265, r: 0.034 };
const R_FIX = new THREE.Matrix4().set(0, -1, 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1);
const SC_TINT = [1.2, 1.55, 2.35];                          // the face is navy planks in the texture: a royal blue
export function scutumProp(s = 0.25) {
  const W = 0.86, H = 1.4, CR = 0.32, RC = 1.7, rim = 0.1, zF = 0.12, zB = 0.0, SZ = 512, ZS = 205, YC = 0.5, parts = [];
  const snap = (x, y, w, h, cr) => { const ax = Math.abs(x), ay = Math.abs(y), cx = w - cr, cy = h - cr; if (ax > cx && ay > cy) { const dx = ax - cx, dy = ay - cy, d = Math.hypot(dx, dy); if (d > cr) { const k = cr / d; return [Math.sign(x) * (cx + dx * k), Math.sign(y) * (cy + dy * k)]; } } return [x, y]; };
  const outline = []; { const arc = (cx, cy, a0) => { for (let i = 0; i < 6; i++) { const a = a0 - (i / 6) * (Math.PI / 2); outline.push([cx + Math.cos(a) * CR, cy + Math.sin(a) * CR]); } };
    const seg = (x0, y0, x1, y1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 0.16)); for (let i = 0; i < n; i++) outline.push([lerp(x0, x1, i / n), lerp(y0, y1, i / n)]); };
    seg(-W + CR, H, W - CR, H); arc(W - CR, H - CR, Math.PI / 2); seg(W, H - CR, W, -H + CR); arc(W - CR, -H + CR, 0); seg(W - CR, -H, -W + CR, -H); arc(-W + CR, -H + CR, -Math.PI / 2); seg(-W, -H + CR, -W, H - CR); arc(-W + CR, H - CR, Math.PI); }
  const N = outline.length, nrm = outline.map((p, i) => { const a = outline[(i + N - 1) % N], b = outline[(i + 1) % N], e = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...e) || 1; return [e[1] / l, -e[0] / l]; });      // (clockwise outline: outward = (dy, -dx))
  const tuv = (x, y) => [(SZ / 2 + x * ZS) / SZ, 1 - (SZ / 2 - (y - YC) * ZS) / SZ];
  const nx = 16, ny = 28;
  // face + back: one grid each, trimmed to the rounded outline
  const grid = (w, h, cr, z, face) => {
    const pos = [], col = [], uv = [], gear = [], idx = [], wc = new THREE.Color(0x4a3322);
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const [x, y] = snap(-w + (2 * w * i) / nx, -h + (2 * h * j) / ny, w, h, cr), sh = face ? 1 - 0.18 * Math.pow(Math.abs(y) / H, 3) : 1;
      pos.push(x, y, z); if (face) { col.push(sh * SC_TINT[0], sh * SC_TINT[1], sh * SC_TINT[2]); uv.push(...tuv(x, y)); gear.push(0, 0.62, 0, 1); } else { col.push(wc.r * 0.9, wc.g * 0.9, wc.b * 0.9); uv.push(0, 0); gear.push(0, 0.85, 0, 0); }
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; if (face) idx.push(a, b, d, a, d, c); else idx.push(a, d, b, a, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aGear', new THREE.Float32BufferAttribute(gear, 4)); g.setIndex(idx); return g;
  };
  parts.push(grid(W - rim * 0.9, H - rim * 0.9, CR - rim * 0.9, zF, true), grid(W, H, CR, zB, false));
  // the rolled steel rim over the edge, rivets along it, the boss
  { const L = [[-rim, zF - 0.006], [-rim * 0.8, zF + 0.032], [-rim * 0.15, zF + 0.044], [0.012, zF + 0.006], [0.012, zB - 0.012]], pos = [], col = [], uv = [], gear = [], idx = [];
    for (const [d, z] of L) for (let i = 0; i < N; i++) { pos.push(outline[i][0] + nrm[i][0] * d, outline[i][1] + nrm[i][1] * d, z); col.push(1, 1, 1); uv.push(0, 0); gear.push(0.9, 0.42, 2, 0); }
    for (let r = 0; r < L.length - 1; r++) for (let i = 0; i < N; i++) { const j = (i + 1) % N, a = r * N, b = (r + 1) * N; idx.push(a + i, b + j, a + j, a + i, b + i, b + j); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aGear', new THREE.Float32BufferAttribute(gear, 4)); g.setIndex(idx); g.computeVertexNormals(); parts.push(g); }
  const dome = (r, hgt, x, y, z, cls, metal) => paint(mk(new THREE.SphereGeometry(r, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), (q) => { q.rotateX(Math.PI / 2); q.scale(1, 1, hgt / r); q.translate(x, y, z); }), 0xffffff, { metal, rough: 0.34, cls });
  parts.push(dome(0.3, 0.17, 0, -0.1, zF + 0.01, 1, 0.9), paint(mk(new THREE.TorusGeometry(0.3, 0.032, 5, 14), (q) => q.translate(0, -0.1, zF + 0.02)), 0xffffff, TRIM));
  for (let i = 3; i < N; i += 6) { const [x, y] = [outline[i][0] - nrm[i][0] * rim * 0.45, outline[i][1] - nrm[i][1] * rim * 0.45]; parts.push(dome(0.04, 0.03, x, y, zF + 0.036, 2, 0.9)); }
  // bend the whole board round a vertical axis (the half-cylinder): the arc length is kept, the normals turn with it
  const flat = parts.map((g) => { if (g.index) g = g.toNonIndexed(); if (!g.attributes.normal) g.computeVertexNormals(); return g; });
  for (const g of flat) { const p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), ph = x / RC, rho = RC + z, cs = Math.cos(ph), sn = Math.sin(ph); p.setX(i, rho * sn); p.setZ(i, rho * cs - RC); const nx0 = n.getX(i), nz0 = n.getZ(i); n.setX(i, nx0 * cs + nz0 * sn); n.setZ(i, -nx0 * sn + nz0 * cs); } }
  // where it hangs: centred a little below the forearm, the arm behind the board through two leather loops
  const mid = [ARM.hand[0] + ARM.dir[0] * ARM.len * 0.5, ARM.hand[1] + ARM.dir[1] * ARM.len * 0.5, ARM.hand[2] + ARM.dir[2] * ARM.len * 0.5];
  const T = new THREE.Vector3(mid[0] / s, mid[1] / s - 0.7, (mid[2] + ARM.r + 0.012) / s - zB + 0.13);
  for (const g of flat) g.translate(T.x, T.y, T.z);
  for (const t of [0.22, 0.78]) {
    const c = [0, 1, 2].map((k) => (ARM.hand[k] + ARM.dir[k] * ARM.len * t) / s), Rr = (ARM.r + 0.008) / s, Wd = 0.022 / s, Th = 0.008 / s, bx = c[0] - T.x, back = (RC * Math.cos(bx / RC) - RC) + T.z + zB, z0 = c[2] - Rr;
    const box = (x, y, z, sx, sy, sz) => { const b = new THREE.BoxGeometry(sx, sy, sz); b.translate(x, y, z); flat.push(paint(b, 0x3a2617, LEATHER)); };
    box(c[0], c[1] + Rr, (back + z0) / 2, Wd, Th, Math.abs(back - z0)); box(c[0], c[1] - Rr, (back + z0) / 2, Wd, Th, Math.abs(back - z0)); box(c[0], c[1], z0, Wd, 2 * Rr + Th, Th);
  }
  const g = mergeGeometries(flat.map((q) => { if (q.index) q = q.toNonIndexed(); for (const k of Object.keys(q.attributes)) if (!['position', 'normal', 'uv', 'color', 'aGear'].includes(k)) q.deleteAttribute(k); return q; }), false);
  g.applyMatrix4(R_FIX);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, name: 'bwgear' })), scene = new THREE.Group(); scene.add(m); return { scene, shield: 'scutum' };
}


// ---- the captain (hero): the soldier body in plate (cuirass, pauldrons, vambraces, a tasset skirt), a tall plumed helm, a long navy cloak, a banner on a pole at his back.  All authored in the bind pose (metres), each piece moved into the frame of the bone it rides on.
const NAVY = 0x14275e, LINING = 0x2c4fa8;
const sheetOf = (q, hex) => { const r = q.index ? q.toNonIndexed() : q; return paint(r, hex, { rough: 0.9 }); };
const sweep = (rows, ny, nx, fn, flip) => {                                  // a curved sheet: fn(u 0..1 across, v 0..1 down) -> [x, y, z]; both faces (the second one slightly behind), so the cloth is seen from either side
  const g = [], pos = [], idx = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) pos.push(...fn(i / nx, j / ny));
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const mkS = (rev) => { const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); q.setIndex(rev ? idx.slice().reverse() : idx); q.computeVertexNormals(); return q; };
  return [mkS(false), mkS(true)];
};
function captainParts(F, tier) {
  const out = {}, put = (bone, geos) => { (out[bone] = out[bone] || []).push(...geos); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const ell = (rx, rz, cz) => (geo) => { geo.scale(rx / 0.2, 1, rz / 0.2); geo.translate(0, 0, cz); return geo; };
  // cuirass: an elliptical shell, wide in the chest, narrow in the waist, a flared hem, a gorget and gold trims
  const body = [[0.152, 1.1], [0.16, 1.17], [0.172, 1.26], [0.2, 1.36], [0.245, 1.43], [0.24, 1.48], [0.19, 1.52], [0.125, 1.55]];
  const cu = paint(lathe(body, 22), 0xffffff, PLATE);
  { const p = cu.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), t = Math.min(1, Math.max(0, (y - 1.25) / 0.18)); p.setZ(i, p.getZ(i) * lerp(0.86, 0.6, t * t * (3 - 2 * t)) + 0.006); } cu.computeVertexNormals(); }
  const hem = paint(lathe([[0.15, 1.08], [0.163, 1.082], [0.165, 1.12], [0.153, 1.125]], 20), 0xffffff, TRIM); hem.scale(1, 1, 0.8); hem.translate(0, 0, 0.004);
  const gor = paint(lathe([[0.095, 1.545], [0.125, 1.54], [0.14, 1.5], [0.15, 1.488], [0.145, 1.484], [0.12, 1.5], [0.105, 1.532]], 16), 0xffffff, PLATE); gor.translate(0, 0, -0.005);
  const rib = paint(mk(new THREE.BoxGeometry(0.014, 0.3, 0.02), (q) => { q.translate(0, 1.29, 0.133); }), 0xffffff, TRIM);          // the raised centre ridge of the breastplate
  const clasp = paint(mk(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 10), (q) => { q.rotateX(Math.PI / 2); q.translate(0, 1.5, 0.125); }), 0xffffff, TRIM);
  put('spine_03', [cu, hem, gor, rib, clasp]);
  // the skirt on the pelvis: a steel belt band, overlapping navy leather straps (pteruges) hanging from it
  { const sk = [paint(lathe([[0.19, 1.0], [0.2, 1.0], [0.2, 0.965], [0.19, 0.962]], 20), 0xffffff, PLATE)]; sk[0].scale(1, 1, 0.82);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, c = new THREE.BoxGeometry(0.062, 0.14, 0.01); c.rotateX(0.2); c.translate(0, 0.9, 0.2); c.rotateY(a); c.scale(1, 1, 0.82); sk.push(gradeY(paint(c, 0x1b2e6e, { rough: 0.7 }), 0x0f1c48, 0x2a46a0)); sk.push(paint(mk(new THREE.BoxGeometry(0.066, 0.012, 0.014), (q) => { q.rotateX(0.2); q.translate(0, 0.835, 0.212); q.rotateY(a); q.scale(1, 1, 0.82); }), 0xffffff, TRIM)); }
    put('pelvis', sk); }
  for (const sd of [1, -1]) {
    const nm = sd > 0 ? 'upperarm_l' : 'upperarm_r', nl = sd > 0 ? 'lowerarm_l' : 'lowerarm_r';
    // pauldron: a dome over the shoulder with a rolled rim and a second lame below
    const dome = paint(mk(new THREE.SphereGeometry(0.135, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.56), (q) => { q.scale(1, 0.84, 1.1); q.rotateZ(-sd * 0.55); q.translate(sd * 0.235, 1.49, -0.04); }), 0xffffff, PLATE);
    const tilt = (q) => { q.rotateZ(-sd * 0.55); const o = new THREE.Vector3(0, -0.021, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), -sd * 0.55); q.translate(sd * 0.235 + o.x, 1.49 + o.y, -0.04 + o.z); return q; };
    const rim = paint(tilt(mk(new THREE.TorusGeometry(0.133, 0.011, 6, 18), (q) => { q.rotateX(Math.PI / 2); q.scale(1, 1, 1.1); })), 0xffffff, TRIM);
    const lames = [0.075, 0.125].map((d, i) => paint(mk(new THREE.CylinderGeometry(0.1 - i * 0.006, 0.094 - i * 0.006, 0.07, 14, 1, true), (q) => { q.rotateZ(Math.PI / 2); q.scale(1, 1.04, 1); q.translate(sd * (0.235 + d + 0.03), 1.465, -0.07); }), 0xffffff, i ? STEEL : PLATE));
    put(nm, [dome, rim, ...lames]);
    // vambrace: a steel tube round the forearm, a trim ring at each end
    const E = V(sd * 0.44, 1.46, -0.07), W = V(sd * 0.68, 1.46, -0.07), a = E.clone().lerp(W, 0.3), b = E.clone().lerp(W, 0.86), mid = a.clone().add(b).multiplyScalar(0.5), L = a.distanceTo(b);
    const tube = (r, h, y, cls) => paint(mk(new THREE.CylinderGeometry(r, r * 1.1, h, 12, 1, true), (q) => { q.rotateZ(Math.PI / 2); q.translate(mid.x + sd * y, 1.46, -0.07); }), 0xffffff, cls);
    put(nl, [tube(0.058, L, 0, STEEL), paint(mk(new THREE.TorusGeometry(0.06, 0.009, 5, 14), (q) => { q.rotateY(Math.PI / 2); q.translate(a.x, 1.46, -0.07); }), 0xffffff, TRIM), paint(mk(new THREE.TorusGeometry(0.066, 0.009, 5, 14), (q) => { q.rotateY(Math.PI / 2); q.translate(b.x, 1.46, -0.07); }), 0xffffff, TRIM)]);
  }
  // the helm: the galea bowl with a tall transverse plume (a centurion's crest) in the kingdom's colours, steel cheek plates
  { const g = galeaGeos(Math.max(1, tier), true); put('Head', g); }
  // the cloak: from the shoulders to the calves, a little wider at the hem and bent forward at the edges, navy outside and lined in royal blue, a gold hem
  { const top = 1.515, hem = 0.55, hw0 = 0.2, hw1 = 0.3, zt = -0.205, zh = -0.37, bend = 0.05;
    const f = (off) => (u, v) => { const y = lerp(top, hem, v), hw = lerp(hw0, hw1, v), x = (u * 2 - 1) * hw, z = lerp(zt, zh, v) + bend * Math.pow(u * 2 - 1, 2) + off; return [x, y, z]; };
    // (a one-sided sheet per face: the back of the cloth (seen from behind) navy, its inside royal blue)
    const a1 = sweep(0, 10, 8, f(0))[0], b1 = sweep(0, 10, 8, f(-0.012))[1];
    const sheet = (q, hex) => { const r = q.index ? q.toNonIndexed() : q; r.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(r.attributes.position.count * 2), 2)); return paint(r, hex, { rough: 0.9 }); };
    const hemS = (off, k) => sweep(0, 1, 8, (u, v) => f(off)(u, lerp(0.945, 1, v)))[k];
    put('spine_02', [sheet(b1, NAVY), sheet(a1, LINING)]);
    put('spine_02', [paint(hemS(0.003, 0).toNonIndexed(), 0xffffff, TRIM), paint(hemS(-0.015, 1).toNonIndexed(), 0xffffff, TRIM)].map((q) => { q.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2)); return q; }));
  }
  // the banner: a pole strapped behind the cloak, a steel spearhead, a crossbar, a swallow-tailed navy vexillum with a white / steel border and a medallion
  { const P0 = V(0, 0.82, -0.345), P1 = V(0, 2.82, -0.385), dir = P1.clone().sub(P0), L = dir.length(), q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()), M4 = new THREE.Matrix4().compose(P0.clone().add(P1).multiplyScalar(0.5), q, V(1, 1, 1));
    const at = (t) => P0.clone().lerp(P1, t);
    const pole = paint(mk(new THREE.CylinderGeometry(0.016, 0.019, L, 8), (c) => c.applyMatrix4(M4)), 0x3a2617, LEATHER);
    const head = paint(mk(new THREE.ConeGeometry(0.04, 0.2, 6), (c) => { c.scale(1, 1, 0.35); c.translate(0, 0.1, 0); c.applyMatrix4(new THREE.Matrix4().compose(at(1), q, V(1, 1, 1))); }), 0xffffff, STEEL);
    const cap = paint(mk(new THREE.SphereGeometry(0.03, 8, 6), (c) => c.translate(...at(1).toArray())), 0xffffff, TRIM);
    const ty = 0.915, bar = paint(mk(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6), (c) => { c.rotateZ(Math.PI / 2); c.translate(...at(ty).toArray()); }), 0x3a2617, LEATHER);
    const knob = [-1, 1].map((sd) => paint(mk(new THREE.SphereGeometry(0.022, 6, 5), (c) => c.translate(sd * 0.3, at(ty).y, at(ty).z)), 0xffffff, TRIM));
    const cl = at(ty), W2 = 0.27, Hc = 0.62, zc = cl.z - 0.012;        // cloth: hangs from the bar, 0.54 wide, 0.62 long, three swallow tails
    const outline = [[-W2, 0], [W2, 0], [W2, -Hc], [W2 * 0.33, -Hc * 0.82], [0, -Hc], [-W2 * 0.33, -Hc * 0.82], [-W2, -Hc]];
    const cloth = (zo, hex, th, cls) => { const sh = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y))); const e = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false, curveSegments: 1 }); e.translate(0, cl.y - 0.02, zo); return paint(e, hex, cls ? { cls, metal: 0.7, rough: 0.4 } : { rough: 0.9 }); };
    const border = [[-W2, -0.025], [W2, -0.025], [W2, -Hc], [W2 * 0.33, -Hc * 0.82], [0, -Hc], [-W2 * 0.33, -Hc * 0.82], [-W2, -Hc]];
    const field = cloth(zc, NAVY, 0.008);
    const stripeL = paint(mk(new THREE.BoxGeometry(0.03, Hc * 0.8, 0.012), (c) => c.translate(-W2 * 0.82, cl.y - 0.02 - Hc * 0.42, zc + 0.004)), 0xffffff, TRIM), stripeR = paint(mk(new THREE.BoxGeometry(0.03, Hc * 0.8, 0.012), (c) => c.translate(W2 * 0.82, cl.y - 0.02 - Hc * 0.42, zc + 0.004)), 0xffffff, TRIM);
    const top = paint(mk(new THREE.BoxGeometry(W2 * 2, 0.03, 0.012), (c) => c.translate(0, cl.y - 0.035, zc + 0.004)), 0xffffff, TRIM);
    const disc = paint(mk(new THREE.CylinderGeometry(0.115, 0.115, 0.014, 18), (c) => { c.rotateX(Math.PI / 2); c.translate(0, cl.y - 0.28, zc + 0.004); }), 0xffffff, TRIM);
    const disc2 = paint(mk(new THREE.CylinderGeometry(0.085, 0.085, 0.016, 18), (c) => { c.rotateX(Math.PI / 2); c.translate(0, cl.y - 0.28, zc + 0.004); }), 0x1a3a8a, { rough: 0.8 });
    const star = paint(mk(new THREE.CylinderGeometry(0.06, 0.06, 0.018, 4), (c) => { c.rotateX(Math.PI / 2); c.rotateZ(Math.PI / 4); c.translate(0, cl.y - 0.28, zc + 0.004); }), 0xffffff, STEEL);
    put('spine_02', [pole, head, cap, bar, ...knob, field, stripeL, stripeR, top, disc, disc2, star]);
  }
  const props = []; for (const [bone, geos] of Object.entries(out)) props.push({ bone, geos: onBone(F, bone, geos.map((q) => { if (q.index) q = q.toNonIndexed(); return q; })) });
  return props;
}

// ---- the lich: the KayKit skeleton mage (own clone: the shared model keeps its hat and its blue), the wizard hat cut out of the mesh, a spiked iron crown, a violet colour grade, glowing violet eyes,
// a tall staff with a violet orb (a lit material: emissive, no real light).  Props authored in the bind pose, on the 'head' / 'handslotr' bones.
const LICH_GRADE = `{ vec3 c = diffuseColor.rgb; float l = dot(c, vec3(0.3, 0.59, 0.11));
  float red = clamp((c.r - max(c.g, c.b)) / max(c.r, 0.02), 0.0, 1.0), blu = clamp((c.b - c.r) / max(c.b, 0.02), 0.0, 1.0), pale = smoothstep(0.36, 0.55, l);
  vec3 bone = vec3(l * 0.92) * vec3(0.84, 0.8, 1.12) + vec3(0.008, 0.0, 0.03), robe = vec3(0.12, 0.035, 0.34) * (0.45 + l * 2.2), grey = vec3(0.07, 0.06, 0.14) * (0.5 + l * 3.0), blue = vec3(0.05, 0.1, 0.4) * (0.6 + l * 1.6);
  vec3 col = mix(grey, bone, pale); col = mix(col, robe, smoothstep(0.4, 0.62, red) * (1.0 - pale * 0.6)); col = mix(col, blue, smoothstep(0.2, 0.4, blu)); diffuseColor.rgb = col; }`;
function stripHat(root) {                                         // cut the hat (the welded surface component that reaches highest) out of the merged head mesh
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isSkinnedMesh || !/hat/i.test(o.name) || !o.geometry.index) return;
    const geo = o.geometry.clone(), idx = geo.index, n = geo.attributes.position.count, v = new THREE.Vector3(), par = [...Array(n).keys()], top = new Float32Array(n).fill(-9);
    const f = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }, seen = new Map();
    for (let i = 0; i < n; i++) { o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld); top[i] = v.y; const k = Math.round(v.x * 500) + ',' + Math.round(v.y * 500) + ',' + Math.round(v.z * 500); if (seen.has(k)) par[f(i)] = f(seen.get(k)); else seen.set(k, i); }
    for (let t = 0; t < idx.count; t += 3) { const a = f(idx.getX(t)); par[f(idx.getX(t + 1))] = a; par[f(idx.getX(t + 2))] = a; }
    const ymax = new Map(); for (let i = 0; i < n; i++) { const r = f(i); ymax.set(r, Math.max(ymax.get(r) ?? -9, top[i])); }
    let hat = -1, hy = -9; for (const [r, y] of ymax) if (y > hy) { hy = y; hat = r; }
    const keep = []; for (let t = 0; t < idx.count; t += 3) if (f(idx.getX(t)) !== hat) keep.push(idx.getX(t), idx.getX(t + 1), idx.getX(t + 2));
    geo.setIndex(keep); o.geometry = geo;
  });
}
const violet = (hex, ei, base = 0x1a0b40) => { const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, color: base, emissive: hex, emissiveIntensity: ei, roughness: 0.35, metalness: 0, name: 'bwglow' }); };
const lichCrown = (F, tier) => {
  const g = [], Y = 1.945, R = 0.44, DK = { metal: 0.65, rough: 0.38, cls: 0 };
  g.push(paint(lathe([[R - 0.02, Y - 0.07], [R + 0.01, Y - 0.07], [R + 0.025, Y], [R + 0.01, Y + 0.07], [R - 0.02, Y + 0.07]], 20), 0xffffff, TRIM));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, tall = i % 3 === 0, h = tall ? 0.42 : 0.26, c = new THREE.ConeGeometry(tall ? 0.062 : 0.05, h, 5);
    c.translate(0, h / 2 + 0.05, 0); c.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.16)); c.applyMatrix4(new THREE.Matrix4().makeRotationY(a)); c.translate(Math.sin(a) * (R + 0.01), Y, Math.cos(a) * (R + 0.01));
    g.push(paint(c, 0x2a2238, DK));
  }
  return onBone(F, 'head', g);
};
const lichCape = (F) => {                                          // a tattered cape from the shoulders to the shins: deep violet outside, a brighter violet lining, a ragged hem
  const top = 1.1, hem = 0.2, hw0 = 0.4, hw1 = 0.56, zt = -0.4, zh = -0.56;
  const f = (off) => (u, v) => { const rag = 0.15 * Math.abs(((u * 7) % 1) * 2 - 1), y = lerp(top, hem + rag, v), hw = lerp(hw0, hw1, v), x = (u * 2 - 1) * hw, z = lerp(zt, zh, v) + 0.07 * Math.pow(u * 2 - 1, 2) + off; return [x, y, z]; };
  return onBone(F, 'spine', [sheetOf(sweep(0, 10, 14, f(-0.014))[1], 0x1b0e48), sheetOf(sweep(0, 10, 14, f(0))[0], 0x4a2a9c)]);
};
const lichGems = (F) => onBone(F, 'head', [[0, 1.94, 0.425, 0.055], [-0.3, 1.94, 0.29, 0.04], [0.3, 1.94, 0.29, 0.04]].map(([x, y, z, r]) => { const q = new THREE.OctahedronGeometry(r, 0); q.scale(1, 1.35, 1); q.translate(x, y, z); return q; }));
// the staff in the frame of the right-hand slot (shaft along +y, the grip at the origin): iron shaft with bone rings, a cage of curved claws round the orb, the orb and a spun ring of runes
const lichStaff = () => {
  const iron = { metal: 0.6, rough: 0.42, cls: 0 }, g = [], glow = [], Y = 1.92;
  g.push(paint(lathe([[0.0, -0.55], [0.035, -0.5], [0.06, -0.3], [0.052, 0.0], [0.05, Y], [0.075, Y + 0.06], [0.06, Y + 0.12]], 8), 0x2a2238, iron));
  for (const y of [-0.3, 0.55, 1.2]) g.push(paint(lathe([[0.058, y - 0.035], [0.082, y - 0.02], [0.082, y + 0.02], [0.058, y + 0.035]], 8), 0xb9a9d8, { metal: 0.2, rough: 0.6 }));
  for (let i = 0; i < 4; i++) {                                    // claws: a curve that opens from the shaft head and closes over the orb
    const a = (i / 4) * Math.PI * 2 + 0.4, pts = [[0.06, 0.0], [0.17, 0.11], [0.25, 0.27], [0.23, 0.47], [0.12, 0.61], [0.02, 0.65]].map(([r, y]) => new THREE.Vector3(Math.sin(a) * r, Y + y, Math.cos(a) * r));
    g.push(paint(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.026, 5, false), 0x2a2238, iron));
  }
  const orb = new THREE.SphereGeometry(0.19, 14, 10); orb.translate(0, Y + 0.33, 0); glow.push(orb);
  const ring = new THREE.TorusGeometry(0.3, 0.012, 4, 24); ring.rotateX(1.2); ring.rotateZ(0.5); ring.translate(0, Y + 0.33, 0); glow.push(ring);
  return { gear: prop(g), glow: glow.map((q) => { for (const k of Object.keys(q.attributes)) if (!['position', 'normal', 'uv'].includes(k)) q.deleteAttribute(k); return q; }) };
};
// a spiked brute's club, along +y from the fist: a tapering handle, a fat wooden head ringed with iron bands and spikes (unit: metres of the OGRE model; the bone carries a x2.665 scale, so the prop scale is 1 / 2.665)
export function ogreClub() {
  const g = [];
  g.push(paint(lathe([[0.0, -0.3], [0.09, -0.3], [0.09, -0.22], [0.062, -0.18], [0.058, 0.2], [0.07, 0.7], [0.13, 0.95], [0.25, 1.15], [0.32, 1.4], [0.33, 1.62], [0.27, 1.88], [0.14, 2.0], [0.0, 2.02]], 12), 0x5b4634, { rough: 0.85 }));
  for (const y of [1.12, 1.82]) g.push(paint(lathe([[0.2, y - 0.05], [0.31, y - 0.05], [0.325, y], [0.31, y + 0.05], [0.2, y + 0.05]], 12), 0xffffff, { metal: 0.4, rough: 0.45, cls: 2 }));
  // spikes: three rings of cones leaning outward
  for (const [y, n, off] of [[1.3, 7, 0], [1.52, 8, 0.5], [1.72, 7, 0.25]]) for (let i = 0; i < n; i++) {
    const a = ((i + off) / n) * Math.PI * 2, r = y > 1.6 ? 0.31 : y > 1.4 ? 0.335 : 0.3, c = new THREE.ConeGeometry(0.075, 0.26, 6); c.translate(0, 0.13, 0);
    c.applyMatrix4(new THREE.Matrix4().makeRotationZ(-1.2)); c.applyMatrix4(new THREE.Matrix4().makeRotationY(a)); c.translate(Math.sin(a) * r, y, Math.cos(a) * r);
    g.push(paint(c, 0xffffff, { metal: 0.45, rough: 0.4, cls: 1 }));
  }
  const tip = new THREE.ConeGeometry(0.08, 0.3, 6); tip.translate(0, 2.16, 0); g.push(paint(tip, 0xffffff, { metal: 0.45, rough: 0.4, cls: 1 }));
  return prop(g);
}

// the colour grade of the single-atlas creatures (crowd.js bwExtra: GLSL after the map is sampled): the pelt, loincloth and belts of the ogre go navy, its beige skin goes slate blue
const OGRE_GRADE = `{ vec3 c = diffuseColor.rgb; float l = dot(c, vec3(0.3, 0.59, 0.11));
  float red = clamp((c.r - c.g) / max(c.r, 0.02), 0.0, 1.0), k = smoothstep(0.38, 0.55, red);
  vec3 skin = vec3(l) * vec3(0.4, 0.6, 0.98) * 1.1 + vec3(0.004, 0.01, 0.03), navy = vec3(0.025, 0.07, 0.24) * (0.55 + l * 4.0);
  diffuseColor.rgb = mix(skin, navy, k); }`;
// the treant: darker, cooler bark; the carved eye sockets (pale texels of the head, bind-pose y above eyeY, below the brow) glow blue-green (emissive, no light)
const treantGrade = (y0, y1) => ({
  key: 'treant', vHead: 'varying vec3 vBP;', vMain: 'vBP = bwP;', fHead: 'varying vec3 vBP; float bwGlow = 0.0;',
  frag: [['map_fragment', `{ vec3 c = diffuseColor.rgb; float l = dot(c, vec3(0.3, 0.59, 0.11));
  bwGlow = smoothstep(0.24, 0.36, l) * (1.0 - smoothstep(0.17, 0.23, abs(vBP.x))) * smoothstep(0.04, 0.1, vBP.z) * smoothstep(${y0.toFixed(3)}, ${(y0 + 0.015).toFixed(3)}, vBP.y) * (1.0 - smoothstep(${(y1 - 0.015).toFixed(3)}, ${y1.toFixed(3)}, vBP.y));
  diffuseColor.rgb = mix(c, vec3(l) * vec3(0.36, 0.55, 1.0) * 1.1, 1.0) * 0.6 * (1.0 - 0.7 * bwGlow); }`],
    ['emissivemap_fragment', 'totalEmissiveRadiance += vec3(0.02, 0.62, 0.52) * bwGlow;']],
});

// the treant's canopy: a ring of dark-teal leaf clumps on the stump's crown with a few paler ones on top, and short crooked branches reaching out (model units of the Treant glb, bind pose, y up)
const treantCrown = (F) => {
  const g = [], rnd = ((s) => () => (s = (s * 16807) % 2147483647) / 2147483647)(7), TOP = 286;
  const blob = (x, y, z, r, hex, sq = 0.8) => { const q = new THREE.IcosahedronGeometry(r, 1), p = q.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.82 + 0.3 * Math.sin(p.getX(i) * 0.13 + p.getY(i) * 0.09) * Math.cos(p.getZ(i) * 0.11); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * sq, p.getZ(i) * k); } q.computeVertexNormals(); q.translate(x, y, z); return paint(q, hex, { rough: 0.9 }); };
  const cols = [0x0c3444, 0x0f4a58, 0x16626a, 0x0a2640];
  for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2 + 0.3, r = 62 + 16 * rnd(); g.push(blob(Math.sin(a) * r, TOP - 4 + 20 * rnd(), Math.cos(a) * r, 46 + 14 * rnd(), cols[i % 4], 0.85)); }   // the skirt of the canopy, overlapping the stump's rim
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.9; g.push(blob(Math.sin(a) * 40, TOP + 38 + 14 * rnd(), Math.cos(a) * 40, 44 + 8 * rnd(), cols[(i + 1) % 4], 0.85)); }
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.2; g.push(blob(Math.sin(a) * 18, TOP + 72 + 8 * rnd(), Math.cos(a) * 18, 36, i % 2 ? 0x2c8f90 : 0x1b6f72, 0.8)); }
  g.push(blob(0, TOP + 96, 0, 30, 0x3aa6a6, 0.75));
  for (let i = 0; i < 7; i++) { const a = Math.PI * (0.55 + 0.9 * (i / 6)); g.push(blob(Math.sin(a) * 100, TOP - 22 - 14 * rnd(), -Math.abs(Math.cos(a)) * 100 + 10, 26 + 6 * rnd(), cols[(i + 2) % 4], 1.1)); }
  return onBone(F, 'Head_012', g);
};
const gradeOf = (root, matName, extra) => { let done = false; root.traverse((o) => { if (done || !o.isSkinnedMesh) return; for (const m of [].concat(o.material)) if (m && m.name === matName) { bwExtra.set(m, extra); done = true; } }); return done; };

export async function setupGround(ctx) {
  const { M, step, TYPE, count, TT, K, ANIMS, BASE, LOD1 } = ctx;
  // the soldier body (the Quaternius ranger, hood and all) as a crowd kind: the kingdom's cloth, props on the bones of the hands and head
  const body = (clips, props, cap, tier) => createKind({ gltf: M.ranger_m, anims: ANIMS, clips: [...BASE, ...clips], props, capacity: cap + 6, lod1Skip: LOD1, hue: true, cloth: CLOTH[tier], tier, crest: 'own',
    lod2: { cloth: 0x2a5fc4, legs: 0x1c2a4a, skin: 0xd9a77f, h: 1.8 } });
  const F = M.ranger_m ? framesOf(M.ranger_m) : null;
  const pp = (g, bone, s, pos, rot) => ({ gltf: g, bone, s, pos, rot: rot.map(rad) });
  // ---- the legionary: the soldier body with a galea, a scutum (left forearm) and a gladius (right fist)
  if (count.legionary && F) {
    const t = TT.legionary | 0;
    // the wrist turns in every clip, the forearm does not: the shield is strapped to the forearm bone, placed where the hand-held prop sits in the shield pose (idle)
    const sh = scutumProp(0.25), A = new THREE.Matrix4().compose(new THREE.Vector3(0, 0.05, 0.05), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rad(90), 0)), new THREE.Vector3(0.25, 0.25, 0.25));
    const Q = handToArm(M.ranger_m, ANIMS, 'hand_l', 'lowerarm_l', 'Idle_Shield_Loop', 0.3); sh.scene.children[0].geometry.applyMatrix4(Q.multiply(A));
    await step('legionary', () => body(['Sword_Idle', 'Sword_Regular_A', 'Sword_Regular_B', 'Idle_Shield_Loop', 'Shield_OneShot', 'Sword_Attack', 'Punch_Cross', 'Sword_Block'], [pp(prop(onBone(F, 'Head', galeaGeos(t))), 'Head', 1, [0, 0, 0], [0, 0, 0]), pp(prop(gladiusGeos()), 'hand_r', 1, [0, 0, 0], [0, 0, -90]),
      pp(sh, 'lowerarm_l', 1, [0, 0, 0], [0, 0, 0])], count.legionary, t));
    tintGear(K.legionary, t);
  }
  // ---- the ogre (Mountain Ogre by SamThePie, CC-BY): one skinned mesh sheet, 14 parts -> one draw call
  // ---- the captain (hero): the soldier body in plate, plumed helm, cloak and banner, a sword (the soldiers' own model, a little larger) in the right fist
  if (count.captain && F) {
    const t = TT.captain | 0, parts = captainParts(F, t);
    await step('captain', () => body(['Sword_Idle', 'Idle_Loop', 'Idle_Shield_Loop', 'Sword_Block', 'Sword_Attack', 'Sword_Regular_A', 'Sword_Regular_B'], parts.map((q) => pp(prop(q.geos), q.bone, 1, [0, 0, 0], [0, 0, 0])).concat(M.sword ? [pp(M.sword, 'hand_r', 0.95, [0, 0, 0], [0, 0, -90])] : []), count.captain, t));
    tintGear(K.captain, t);
  }
  // ---- the lich
  if (count.lich && M.skel_mage && M.kk_anims) {
    const root = SkeletonUtils.clone(M.skel_mage.scene); stripHat(root);
    root.traverse((o) => { if (o.isSkinnedMesh) o.material = o.material.clone(); });
    const mats = []; root.traverse((o) => { if (o.isSkinnedMesh) mats.push(o.material); });
    for (const m of mats) { if (m.name === 'Glow') { m.color.set(0x14082e); m.emissive.set(0x9a55ff); m.emissiveIntensity = 1.5; m.metalness = 0; m.roughness = 0.6; } else if (m.name === 'skeleton') bwExtra.set(m, { key: 'lich', frag: [['map_fragment', LICH_GRADE]] }); }
    const F2 = framesOf({ scene: root }), st = lichStaff(), t = TT.lich | 0, glowM = violet(0x8a4dff, 1.1);
    const gem = new THREE.Mesh(mergeGeometries(lichGems(F2).map((q) => { for (const k of Object.keys(q.attributes)) if (!['position', 'normal', 'uv'].includes(k)) q.deleteAttribute(k); if (!q.attributes.uv) q.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2)); return q; }), false), glowM), gs = new THREE.Group(); gs.add(gem);
    const orbM = new THREE.Mesh(mergeGeometries(st.glow.map((q) => { if (!q.attributes.uv) q.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2)); return q; }), false), glowM), os = new THREE.Group(); os.add(orbM);
    await step('lich', () => createKind({ gltf: { scene: root, animations: [] }, anims: { animations: M.kk_anims.animations }, clips: ['Idle_A', 'Idle_B', 'Walking_A', 'Running_A', 'Ranged_Magic_Shoot', 'Hit_A', 'Death_A'], capacity: count.lich + 4,
      props: [pp(prop(lichCrown(F2, t)), 'head', 1, [0, 0, 0], [0, 0, 0]), pp(prop(lichCape(F2)), 'spine', 1, [0, 0, 0], [0, 0, 0]), pp({ scene: gs }, 'head', 1, [0, 0, 0], [0, 0, 0]), pp(st.gear, 'handslotr', 1, [0, 0, 0], [0, 0, 90]), pp({ scene: os }, 'handslotr', 1, [0, 0, 0], [0, 0, 90])] }));
    tintGear(K.lich, t);
  }
  if (count.ogre && M.ogre) {
    strip(M.ogre); gradeOf(M.ogre.scene, 'Orge_LP', { key: 'ogre', frag: [['map_fragment', OGRE_GRADE]] });
    await step('ogre', () => createKind({ gltf: M.ogre, anims: { animations: M.ogre.animations }, clips: ['Ideal', 'Walk', 'Punch'], capacity: count.ogre + 3, glint: GLINT[TT.ogre | 0],
      props: [{ gltf: ogreClub(), bone: 'mixamorigRightHand_014', s: 1 / 2.665, pos: [0, 0.05, 0], rot: [0, 0, -25].map(rad) }] }));
    tintGear(K.ogre, TT.ogre | 0);
  }
  if (count.treant && M.treant) {
    strip(M.treant); gradeOf(M.treant.scene, 'Material.001', treantGrade(0.2, 0.4));
    // (its sim speed is 7.2 m/s, the 'Walk' clip covers 2.15 m/s: a 1.4x faster copy of the stride keeps the feet from sliding as much as the playback clamp (1.9) allows)
    const w = M.treant.animations.find((c) => c.name === 'Walk');
    if (w && !M.treant.animations.some((c) => c.name === 'WalkX')) { const c = w.clone(); c.name = 'WalkX'; c.tracks.forEach((t) => t.scale(1 / 1.4)); c.resetDuration(); M.treant.animations.push(c); }
    await step('treant', () => createKind({ gltf: M.treant, anims: { animations: M.treant.animations }, clips: ['Idle01', 'WalkX', 'Attack01'], capacity: count.treant + 3, glint: GLINT[TT.treant | 0],
      props: [pp(prop(treantCrown(framesOf(M.treant))), 'Head_012', 1, [0, 0, 0], [0, 0, 0])] }));
    tintGear(K.treant, TT.treant | 0);
  }
}
