// War axes: the gate giants' axe (units.js) and the shieldmaiden hero's axe (army.js home guard, bunits.js battle).
// A forged, bearded head — hammer-dented dark steel (the hero's is blued: the kingdom's colour) with a bright, freshly ground edge bevel —
// in a socket with riveted langets, on an oiled ash haft with a tight leather-cord grip and an iron butt cap.
// Frame of the old prop (axe.glb scene): haft along +y, head at the top, the bit towards -x, thickness in z; the grip (middle of the
// leather) sits at the origin, i.e. in the hand.  makeAxe({ blued }) -> THREE.Group.  ~5k triangles; 2 textured materials
// (head, wood: small canvases drawn once and shared) + flat iron / leather / brass parts (the crowd merges those into its gear mesh).
import * as THREE from 'three';

let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
const tx = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
function nrm(w, h, H, k) { return cv(w, h, (g) => { const im = g.createImageData(w, h); const at = (x, y) => H[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (at(x + 1, y) - at(x - 1, y)) * k, dy = (at(x, y + 1) - at(x, y - 1)) * k, o = (y * w + x) * 4; im.data[o] = 128 - dx * 127; im.data[o + 1] = 128 + dy * 127; im.data[o + 2] = 255; im.data[o + 3] = 255; }
  g.putImageData(im, 0, 0); }); }

// ---- head textures: u = 0 at the eye … 1 at the edge, v = beard … top
const TW = 256, TH = 128, EDGE = 0.8;
const edgeAt = (y) => EDGE + 0.022 * Math.sin(y * 0.11) + 0.01 * Math.sin(y * 0.37 + 1);     // the wavy line where the grinding starts
let HF = null;
function field() {                    // hammer dents + fire-scale blotches, forged part only
  if (HF) return HF;
  const dent = new Float32Array(TW * TH), scale = new Float32Array(TW * TH);
  for (let i = 0; i < 150; i++) { const cx = rnd() * TW * 0.85, cy = rnd() * TH, r = 5 + rnd() * 8; for (let y = Math.max(0, cy - r | 0); y < Math.min(TH, cy + r + 1); y++) for (let x = Math.max(0, cx - r | 0); x < Math.min(TW, cx + r + 1); x++) { const d = Math.hypot(x - cx, y - cy) / r; if (d < 1) dent[y * TW + x] -= (1 - d * d) * 0.16; } }
  for (let i = 0; i < 26; i++) { const cx = rnd() * TW * 0.8, cy = rnd() * TH, r = 10 + rnd() * 22; for (let y = Math.max(0, cy - r | 0); y < Math.min(TH, cy + r + 1); y++) for (let x = Math.max(0, cx - r | 0); x < Math.min(TW, cx + r + 1); x++) { const d = Math.hypot(x - cx, y - cy) / r; if (d < 1) scale[y * TW + x] = Math.max(scale[y * TW + x], (1 - d) * (0.5 + rnd() * 0.1)); } }
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) if (x / TW >= edgeAt(y) - 0.01) dent[y * TW + x] = 0;      // the ground bevel is smooth
  HF = { dent, scale }; return HF;
}
const HEAD = {};
function headMat(blued) {
  const k0 = blued ? 'b' : 's'; if (HEAD[k0]) return HEAD[k0];
  const { dent, scale } = field();
  const base = blued ? [64, 82, 122] : [96, 101, 109], sc = blued ? [34, 42, 66] : [52, 54, 58];
  const col = tx(cv(TW, TH, (g) => {
    const im = g.createImageData(TW, TH);
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { const u = x / TW, e = edgeAt(y), i = y * TW + x, o = i * 4; let r, gg, b;
      if (u < e) { const s = scale[i], n = 1 + dent[i] * 0.5 + (rnd() - 0.5) * 0.08 - Math.max(0, 0.18 - u) * 0.9;     // darker towards the eye
        r = (base[0] * (1 - s) + sc[0] * s) * n; gg = (base[1] * (1 - s) + sc[1] * s) * n; b = (base[2] * (1 - s) + sc[2] * s) * n;
        if (u > e - 0.02) { const k = (u - (e - 0.02)) / 0.02; r += (150 - r) * k * 0.5; gg += (155 - gg) * k * 0.5; b += (162 - b) * k * 0.5; } }        // a soft transition into the bevel
      else { const k = 0.9 + (rnd() - 0.5) * 0.04; r = 200 * k; gg = 205 * k; b = 212 * k; }
      im.data[o] = r; im.data[o + 1] = gg; im.data[o + 2] = b; im.data[o + 3] = 255; }
    g.putImageData(im, 0, 0);
    for (let i = 0; i < 140; i++) { const y = rnd() * TH, x = (edgeAt(y) + 0.01 + rnd() * 0.18) * TW; g.strokeStyle = `rgba(${rnd() < 0.5 ? '120,126,134' : '235,240,246'},.4)`; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 5 + rnd() * 12, y + (rnd() - 0.5) * 2); g.stroke(); }   // grinding streaks
  }), true);
  const rough = tx(cv(TW, TH, (g) => {
    const im = g.createImageData(TW, TH);
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { const u = x / TW, i = y * TW + x, o = i * 4; const v = u < edgeAt(y) ? 140 + scale[i] * 60 + dent[i] * 40 + (rnd() - 0.5) * 24 : 52 + (rnd() - 0.5) * 16; im.data[o] = im.data[o + 1] = im.data[o + 2] = v; im.data[o + 3] = 255; }
    g.putImageData(im, 0, 0); }));
  const nm = HEAD.nm || (HEAD.nm = tx(nrm(TW, TH, dent, 1.6)));
  return (HEAD[k0] = new THREE.MeshStandardMaterial({ name: 'axe_head', map: col, roughnessMap: rough, normalMap: nm, normalScale: new THREE.Vector2(0.55, 0.55), metalness: 1, roughness: 1, envMapIntensity: 1.2 }));
}
let MATS = null;
function mats() {
  if (MATS) return MATS;
  // oiled ash: long grain streaks, a few darker growth lines and knots, hand-darkened
  const woodC = tx(cv(64, 512, (g, w, h) => { g.fillStyle = '#4e3420'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) { const x = rnd() * w, a = 0.08 + rnd() * 0.25, dark = rnd() < 0.6; g.strokeStyle = dark ? `rgba(26,15,7,${a})` : `rgba(140,100,64,${a * 0.6})`; g.lineWidth = 0.5 + rnd() * 1.6; g.beginPath(); g.moveTo(x, 0);
      for (let y = 0; y <= h; y += 16) g.lineTo(x + Math.sin(y * 0.02 + i) * 1.5, y); g.stroke(); }
    for (let i = 0; i < 5; i++) { const y = rnd() * h; g.fillStyle = 'rgba(22,12,5,.4)'; g.beginPath(); g.ellipse(rnd() * w, y, 2.5, 7, 0, 0, 6.3); g.fill(); } }), true);
  MATS = {
    wood: new THREE.MeshStandardMaterial({ name: 'axe_wood', map: woodC, roughness: 0.6, metalness: 0, envMapIntensity: 0.8 }),
    iron: new THREE.MeshStandardMaterial({ name: 'Iron', color: 0x50555d, metalness: 1, roughness: 0.55, envMapIntensity: 1.1 }),
    leather: new THREE.MeshStandardMaterial({ name: 'Leather', color: 0x3a2616, metalness: 0, roughness: 0.68 }),
    brass: new THREE.MeshStandardMaterial({ name: 'Brass', color: 0xa07c3e, metalness: 1, roughness: 0.35 }),
  };
  return MATS;
}

// ---- the head: a loft from the eye (s = 0) to the edge (s = 1); each station a lens-shaped ring in y–z, x following the crescent of the bit
const Y0 = 0.27, Y1 = 0.47, XE = -0.035, XB = -0.245;
const yTop = (s) => Y1 - 0.012 + 0.06 * Math.pow(s, 2.2);                     // the upper horn rises a little towards the edge
const yBot = (s) => Y0 + 0.03 - 0.17 * Math.pow(s, 2.4);                      // the beard: a long, concave drop
const xEdge = (k) => XB - 0.032 * Math.sin(Math.PI * k);                       // crescent bit (k = 0 bottom … 1 top)
const thick = (s) => (s < 0.12 ? 0.028 : s < 0.8 ? 0.028 - 0.017 * (s - 0.12) / 0.68 : 0.011 * Math.pow((1 - s) / 0.2, 1.3)) + 0.0006;
function headGeo() {
  const NS = 40, NR = 12, pos = [], uv = [], idx = [];
  const ring = []; for (let i = 0; i <= NR; i++) ring.push([i / NR, 1]); ring.push([1.02, 0]); for (let i = NR; i >= 0; i--) ring.push([i / NR, -1]); ring.push([-0.02, 0]);
  const RL = ring.length;
  for (let i = 0; i <= NS; i++) {
    const s = i / NS, t = thick(s), ya = yBot(s), yb = yTop(s);
    for (let j = 0; j < RL; j++) {
      const [kk, side] = ring[j], k = Math.min(1, Math.max(0, kk)), y = ya + (yb - ya) * k;
      const rim = Math.min(k, 1 - k), soft = Math.min(1, rim * (yb - ya) / Math.max(0.004, t * 1.4));       // thickness rolls off at the rims
      const z = side === 0 ? 0 : side * t * (0.35 + 0.65 * Math.sqrt(soft));
      pos.push(XE + (xEdge(k) - XE) * s, kk > 1 ? y + 0.002 : kk < 0 ? y - 0.002 : y, z); uv.push(s, k);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < RL; j++) { const a = i * RL + j, b = i * RL + (j + 1) % RL, c = a + RL, d = b + RL; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals(); return g;
}
class Helix extends THREE.Curve {
  constructor(r, y0, y1, turns) { super(); this.r = r; this.y0 = y0; this.y1 = y1; this.n = turns; }
  getPoint(t, o = new THREE.Vector3()) { const a = t * this.n * Math.PI * 2; return o.set(Math.cos(a) * this.r, this.y0 + (this.y1 - this.y0) * t, Math.sin(a) * this.r * 0.82); }
}
const lathe = (prof, seg) => new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg);
// the LONG axe (the axe riders, p32): the haft 0.55 m longer (1.5 m in all, the butt only 0.27 m below the hand), the head a third bigger and a steel spike on the top
const LONG = { ext: 0.55, k: 1.32, ym: 0.37 };
const GEO = {};
function geos(long) {
  const key = long ? 'L' : 'S'; if (GEO[key]) return GEO[key];
  const E = long ? LONG.ext : 0, G = {};
  G.head = headGeo();
  if (long) { const { ext, k, ym } = LONG; G.head.translate(-XE, -ym, 0); G.head.scale(k, k, k * 1.1); G.head.translate(XE, ym + ext, 0); }
  { const g = lathe([[0.0, -0.44], [0.026, -0.44], [0.03, -0.425], [0.027, -0.405], [0.024, -0.36], [0.022, -0.1], [0.021, 0.3 + E], [0.02, 0.5 + E], [0.017, 0.515 + E], [0.0, 0.517 + E]], 14); g.scale(long ? 1.12 : 1, 1, long ? 0.92 : 0.8);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, (g.attributes.position.getY(i) + 0.44) * 1.1); G.haft = g; }
  { const g = lathe([[0.0, Y0 - 0.004], [0.029, Y0 - 0.004], [0.032, Y0 + 0.005], [0.029, Y0 + 0.012], [0.029, Y1 - 0.012], [0.032, Y1 - 0.005], [0.029, Y1 + 0.004], [0.0, Y1 + 0.004]], 16); g.scale(1.12, 1, 1.0);
    if (long) { const { ext, k, ym } = LONG; g.translate(0, -ym, 0); g.scale(1, k, 1); g.translate(0, ym + ext, 0); } G.socket = g; }
  { const g = new THREE.BoxGeometry(0.016, 0.2, 0.006); g.translate(0, Y0 - 0.1, 0); if (long) g.translate(0, E - (LONG.ym - Y0) * (LONG.k - 1), 0); G.langet = g; }
  if (long) { const g = lathe([[0.0, 0.517 + E], [0.019, 0.517 + E], [0.021, 0.532 + E], [0.015, 0.575 + E], [0.007, 0.64 + E], [0.0, 0.7 + E]], 10); g.scale(1, 1, 0.8); G.spike = g; }
  G.rivet = new THREE.SphereGeometry(0.0055, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  { const g = lathe([[0.0, -0.452], [0.022, -0.452], [0.031, -0.444], [0.032, -0.425], [0.029, -0.41], [0.027, -0.41]], 14); g.scale(1, 1, 0.82); G.cap = g; }
  { const g = new THREE.CylinderGeometry(0.0238, 0.0238, 0.32, 14, 1, true); g.scale(1, 1, 0.82); g.translate(0, -0.175, 0); G.sleeve = g; }
  G.wrap = new THREE.TubeGeometry(new Helix(0.0246, -0.333, -0.017, 22), 22 * 10, 0.0042, 5, false);
  G.ring = new THREE.TorusGeometry(0.0255, 0.0038, 6, 18); G.ring.rotateX(Math.PI / 2); G.ring.scale(1, 1, 0.82);
  G.wedge = new THREE.BoxGeometry(0.03, 0.012, 0.005); G.wedge.translate(0, 0.518 + E, 0);
  GEO[key] = G; return G;
}

const GRIP = -0.175;                  // middle of the leather: goes into the hand
export function makeAxe({ blued = false, shadows = true, long = false } = {}) {
  const M = mats(), G = geos(long), g = new THREE.Group(), inner = new THREE.Group(), E = long ? LONG.ext : 0; g.name = long ? 'long_axe' : 'war_axe'; inner.position.y = -GRIP; g.add(inner);
  const add = (geo, mat, f) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadows; m.receiveShadow = shadows; if (f) f(m); inner.add(m); return m; };
  add(G.haft, M.wood); add(G.head, headMat(blued)); add(G.socket, M.iron); add(G.cap, M.iron); add(G.sleeve, M.leather); add(G.wrap, M.leather); add(G.wedge, M.iron); if (long) add(G.spike, M.iron);
  for (const y of [-0.337, -0.013]) add(G.ring, M.iron, (m) => { m.position.y = y; });
  for (const sz of [1, -1]) {
    add(G.langet, M.iron, (m) => { m.position.z = sz * (long ? 0.0245 : 0.0215); });
    for (const y of [Y0 - 0.04, Y0 - 0.14]) add(G.rivet, M.brass, (m) => { m.position.set(0, y + (long ? E - (LONG.ym - Y0) * (LONG.k - 1) : 0), sz * (long ? 0.029 : 0.025)); m.rotation.x = sz * Math.PI / 2; });
  }
  return g;
}
// How it is held (measured on the UAL hand rig — the shieldmaiden and the puglin giants share it): in hand_r space the knuckles sit at
// y ≈ 0.12, the fingers curl towards -x and the knuckle line runs along z (index +z, little finger -z). So the haft runs along +z through
// the closed fist at (-0.025, 0.09, 0), the head on the thumb side, the bit facing the knuckles' way (+y): rotation XYZ (90°, -90°, 0).
export const AXE_GRIP = { pos: [-0.025, 0.09, 0], rotDeg: [90, -90, 0] };
// as a crowd prop (crowd.js createKind props take a glTF-like { scene })
export function axeProp(opts) { return { scene: makeAxe({ ...opts, shadows: false }) }; }
