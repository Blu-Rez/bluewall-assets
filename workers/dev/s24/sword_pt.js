// PATH-TRACED loading-bar sword (three-gpu-pathtracer): the owner's pick — the rune blade on the knightly hilt.
// Sapphires (the game's dark-blue gem) set in both arms of the guard, an onyx (the black gem) in the wheel pommel.
// Real materials: brushed & scratched steel with sharpened bright edges, an engraved fuller with glowing runes, a spiral leather wrap,
// polished silver ferrules and bezels, faceted transmissive sapphires, glossy onyx. Studio light from a procedural HDR environment.
//   ?w=1400&h=300&spp=256&mask=1 (mask: the blade alone, flat white, raster — for the bar's light fill)
import * as THREE from 'three';
import { WebGLPathTracer } from 'three-gpu-pathtracer';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const Q = new URLSearchParams(location.search), W = +(Q.get('w') || 1400), H = +(Q.get('h') || 300), SPP = +(Q.get('spp') || 128), MASK = Q.get('mask') === '1';
let seed = 3; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
const tex = (c, srgb = false, rep = [1, 1]) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; };

// ---------------------------------------------------------------- textures
// blade roughness: lengthwise brushing (u = along the blade), a few cross scratches, soft smudges
const bladeRough = tex(cv(2048, 128, (g, w, h) => {
  g.fillStyle = 'rgb(52,52,52)'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const y = rnd() * h, v = 30 + rnd() * 70; g.strokeStyle = `rgba(${v},${v},${v},.35)`; g.lineWidth = 0.3 + rnd() * 0.9; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + (rnd() - 0.5) * 2); g.stroke(); }
  for (let i = 0; i < 160; i++) { const x = rnd() * w, y = rnd() * h, l = 6 + rnd() * 36, a = (rnd() - 0.5) * 1.2; g.strokeStyle = `rgba(150,150,150,${0.3 + rnd() * 0.4})`; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (let i = 0; i < 14; i++) { const x = rnd() * w, y = rnd() * h, r = 20 + rnd() * 60, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(120,120,120,.25)'); gr.addColorStop(1, 'rgba(120,120,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
}));
// rune inlay (emissive) for the fuller: glyphs along u, centred across v
const runeCanvas = cv(2048, 64, (g, w, h) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 4.5; g.lineCap = 'round'; g.lineJoin = 'round';
  const glyph = (x) => { const k = (rnd() * 7) | 0, c = h / 2, s = h * 0.32; g.beginPath(); g.moveTo(x, c - s); g.lineTo(x, c + s);
    if (k === 0) { g.moveTo(x, c - s * 0.4); g.lineTo(x + s * 0.8, c - s); } else if (k === 1) { g.moveTo(x - s * 0.7, c - s * 0.6); g.lineTo(x + s * 0.7, c + s * 0.2); }
    else if (k === 2) { g.moveTo(x, c); g.lineTo(x - s * 0.7, c + s * 0.7); g.moveTo(x, c); g.lineTo(x + s * 0.7, c + s * 0.7); } else if (k === 3) { g.moveTo(x - s * 0.6, c - s * 0.6); g.lineTo(x + s * 0.6, c - s * 0.6); }
    else if (k === 4) { g.moveTo(x, c - s * 0.2); g.lineTo(x + s * 0.7, c - s * 0.7); g.moveTo(x, c + s * 0.2); g.lineTo(x + s * 0.7, c + s * 0.7); } else if (k === 5) { g.moveTo(x - s * 0.7, c); g.lineTo(x, c - s); g.lineTo(x + s * 0.7, c); }
    else { g.moveTo(x - s * 0.6, c + s * 0.3); g.lineTo(x + s * 0.6, c - s * 0.3); } g.stroke(); };
  for (let x = 70; x < w - 60; x += 64 + rnd() * 10) glyph(x);
});
const runeMap = tex(runeCanvas, true); runeMap.wrapS = runeMap.wrapT = THREE.ClampToEdgeWrapping;
// leather: colour + grain normal
const leatherCol = tex(cv(512, 512, (g, w, h) => { g.fillStyle = '#0b1f63'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { const v = rnd(); g.fillStyle = v < 0.5 ? `rgba(0,0,0,${0.22 * rnd()})` : `rgba(70,115,220,${0.16 * rnd()})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3); }
  for (let i = 0; i < 30; i++) { g.strokeStyle = `rgba(110,150,240,${0.1 + rnd() * 0.15})`; g.lineWidth = 1 + rnd() * 2; g.beginPath(); const x = rnd() * w, y = rnd() * h; g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 80, y + (rnd() - 0.5) * 20); g.stroke(); } }), true, [3, 1]);
const leatherNrm = tex(cv(256, 256, (g, w, h) => { const im = g.createImageData(w, h), n = new Float32Array(w * h); for (let i = 0; i < n.length; i++) n[i] = rnd();
  for (let pass = 0; pass < 2; pass++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; n[i] = (n[i] * 2 + n[y * w + (x + 1) % w] + n[((y + 1) % h) * w + x]) / 4; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x, dx = n[y * w + (x + 1) % w] - n[i], dy = n[((y + 1) % h) * w + x] - n[i], o = i * 4; im.data[o] = 128 + dx * 600; im.data[o + 1] = 128 + dy * 600; im.data[o + 2] = 255; im.data[o + 3] = 255; }
  g.putImageData(im, 0, 0); }), false, [3, 1]);
// fittings: fine random scratches in the roughness
const fitRough = tex(cv(512, 512, (g, w, h) => { g.fillStyle = 'rgb(70,70,70)'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 500; i++) { const x = rnd() * w, y = rnd() * h, l = 4 + rnd() * 20, a = rnd() * 6.28; g.strokeStyle = `rgba(${rnd() < 0.5 ? 30 : 140},${rnd() < 0.5 ? 30 : 140},${rnd() < 0.5 ? 30 : 140},.5)`; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } }), false, [4, 4]);

// ---------------------------------------------------------------- materials
const M = {
  steel: new THREE.MeshPhysicalMaterial({ color: 0xe2e7ed, metalness: 1, roughness: 0.55, roughnessMap: bladeRough }),       // (roughness × map ≈ 0.11–0.3)
  edge: new THREE.MeshPhysicalMaterial({ color: 0xf4f7fa, metalness: 1, roughness: 0.06 }),
  fuller: new THREE.MeshPhysicalMaterial({ color: 0x6c7684, metalness: 1, roughness: 0.42, emissive: 0x6fd0ff, emissiveIntensity: 2.2, emissiveMap: runeMap }),
  wall: new THREE.MeshPhysicalMaterial({ color: 0xbcc5d0, metalness: 1, roughness: 0.25 }),
  fit: new THREE.MeshPhysicalMaterial({ color: 0xb4bcc6, metalness: 1, roughness: 0.75, roughnessMap: fitRough }),
  dark: new THREE.MeshPhysicalMaterial({ color: 0x5f6873, metalness: 1, roughness: 1.0, roughnessMap: fitRough }),            // satin gunmetal faces of the guard
  foil: new THREE.MeshPhysicalMaterial({ color: 0xdfe6f0, metalness: 1, roughness: 0.03 }),                                    // jeweller's foil behind the stones
  silver: new THREE.MeshPhysicalMaterial({ color: 0xeef2f6, metalness: 1, roughness: 0.08 }),
  leather: new THREE.MeshPhysicalMaterial({ map: leatherCol, normalMap: leatherNrm, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.62, sheen: 0.3, sheenColor: new THREE.Color(0x3a64c8), sheenRoughness: 0.6 }),
  sapphire: new THREE.MeshPhysicalMaterial({ color: 0x2a55ff, metalness: 0, roughness: 0, transmission: 1, ior: 1.77, thickness: 0.15, attenuationColor: new THREE.Color(0x0b26b8), attenuationDistance: 0.07, specularIntensity: 1, flatShading: true }),
  onyx: new THREE.MeshPhysicalMaterial({ color: 0x050608, metalness: 0, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.0, ior: 1.65, specularIntensity: 1 }),
  white: new THREE.MeshBasicMaterial({ color: 0xffffff }),
};

// ---------------------------------------------------------------- geometry
const S = new THREE.Group();
const splitGroups = (g) => { const n = g.index ? g.toNonIndexed() : g, out = [];          // one geometry per material group (the path tracer wants one material per mesh)
  for (const gr of g.groups) { const sub = new THREE.BufferGeometry(); for (const k in n.attributes) { const a = n.attributes[k]; sub.setAttribute(k, new THREE.BufferAttribute(a.array.slice(gr.start * a.itemSize, (gr.start + gr.count) * a.itemSize), a.itemSize)); } out[gr.materialIndex] = out[gr.materialIndex] ? mergeTwo(out[gr.materialIndex], sub) : sub; }
  return out; };
const mergeTwo = (a, b) => { const o = new THREE.BufferGeometry(); for (const k in a.attributes) { const x = a.attributes[k], y = b.attributes[k], arr = new Float32Array(x.array.length + y.array.length); arr.set(x.array); arr.set(y.array, x.array.length); o.setAttribute(k, new THREE.BufferAttribute(arr, x.itemSize)); } return o; };
const add = (g, m, f) => { if (Array.isArray(m)) { const parts = splitGroups(g); let last; parts.forEach((pg, i) => { if (pg) last = add(pg, m[i], f); }); return last; }
  const o = new THREE.Mesh(g, MASK || m === 'blade' ? M.white : m); if (f) f(o); S.add(o); return o; };
// blade (point up along +y; the hilt goes down from y = 0): leaf outline, central fuller with runes, sharpened edge bevels, distal taper
const R = [[0.22, 0], [0.25, 0.3], [0.225, 1.2], [0.235, 3.2], [0.2, 5.3], [0, 6.6]], BL = 6.6;
const wAt = (y) => { for (let i = 1; i < R.length; i++) if (R[i][1] >= y) { const a = R[i - 1], b = R[i], k = (y - a[1]) / (b[1] - a[1]); return a[0] + (b[0] - a[0]) * k; } return 0; };
{
  const segN = 280, F0 = 0.05, F1 = 0.8;
  const prof = (w, th, f) => [[-w, 0], [-w * 0.8, th * 0.5], [-w * 0.36, th * 0.94], [-w * 0.27, th * (0.94 - 0.42 * f)], [0, th * (0.94 - 0.48 * f)], [w * 0.27, th * (0.94 - 0.42 * f)], [w * 0.36, th * 0.94], [w * 0.8, th * 0.5], [w, 0]];
  const mats = [M.edge, M.steel, M.wall, M.fuller, M.fuller, M.wall, M.steel, M.edge];
  for (const side of [1, -1]) for (let k = 0; k < 8; k++) {
    const pos = [], idx = [], uv = [];
    for (let i = 0; i <= segN; i++) {
      const t = i / segN, y = t * BL, w = wAt(y), th = 0.08 * (1 - 0.55 * t) * Math.min(1, w / 0.1 + 0.2), f = t > F0 && t < F1 ? Math.min(1, (t - F0) / 0.03, (F1 - t) / 0.04) : 0, P = prof(w, th, f);
      pos.push(P[k][0], y, P[k][1] * side, P[k + 1][0], y, P[k + 1][1] * side);
      const v0 = k === 3 ? 0 : k === 4 ? 0.5 : 0, v1 = k === 3 ? 0.5 : k === 4 ? 1 : 1;                  // the rune map spans both halves of the fuller
      const u = Math.min(0.999, Math.max(0.001, (t - F0) / (F1 - F0)));                                   // (clamped: the path tracer repeats every texture)
      uv.push(u, side > 0 ? v0 : 1 - v0, u, side > 0 ? v1 : 1 - v1);
    }
    for (let i = 0; i < segN; i++) { const a = i * 2, c = a + 2; if (side > 0) idx.push(a, a + 1, c, c, a + 1, c + 1); else idx.push(a, c, a + 1, c, c + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    add(g, MASK ? 'blade' : mats[k]);
  }
}
if (!MASK) {
  // ricasso collar (the blade's seat in the guard)
  add(new RoundedBoxGeometry(0.5, 0.1, 0.16, 4, 0.03), M.fit, (o) => { o.position.y = 0.03; });
  // guard: front outline extruded — satin gunmetal faces, polished bright bevels/sides; straight arms with flared, squared ends
  const half = [[0, 0.075], [0.6, 0.06], [0.79, 0.14], [0.83, 0.1], [0.83, -0.06], [0.6, -0.045], [0, -0.065]];
  const pts = [...half, ...half.slice().reverse().map(([x, y]) => [-x, y])];
  const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) sh.lineTo(x, y); sh.closePath();
  const gg = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.022, bevelSegments: 5, curveSegments: 8 }); gg.translate(0, 0, -0.05);
  add(gg, [M.dark, M.silver], (o) => { o.position.y = -0.02; });
  add(new RoundedBoxGeometry(0.26, 0.24, 0.2, 5, 0.05), M.fit, (o) => { o.position.y = -0.02; });
  // langets: a pointed tongue of the guard lying on each face of the blade
  { const ls = new THREE.Shape(); ls.moveTo(-0.07, 0); ls.lineTo(0.07, 0); ls.lineTo(0.07, 0.11); ls.lineTo(0, 0.25); ls.lineTo(-0.07, 0.11); ls.closePath();
    for (const fz of [1, -1]) { const lg = new THREE.ExtrudeGeometry(ls, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3 }); if (fz < 0) { lg.rotateY(Math.PI); }
      add(lg, [M.dark, M.silver], (o) => { o.position.set(0, 0.08, fz * 0.07); }); } }
  // brilliant-cut gems
  const brilliant = (r) => { const g = new THREE.LatheGeometry([[0, -0.85], [0.5, -0.45], [1, 0], [0.8, 0.2], [0.56, 0.36], [0, 0.36]].map(([x, y]) => new THREE.Vector2(x * r, y * r)), 12); const n = g.toNonIndexed(); n.computeVertexNormals(); return n; };
  const cabochon = (r) => { const g = new THREE.SphereGeometry(r, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 0.55, 1); return g; };
  const set = (x, y, z, r, mat, face, cab) => {        // a stone in a raised silver bezel with a foil cup behind it, table facing ±z
    const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.x = face * Math.PI / 2;
    const gm = new THREE.Mesh(cab ? cabochon(r) : brilliant(r), mat); gm.position.y = cab ? r * 0.02 : r * 0.08; grp.add(gm);
    if (!cab) { const cup = new THREE.Mesh(new THREE.SphereGeometry(r * 0.98, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.foil); cup.scale.y = 0.9; grp.add(cup); }
    const bz = new THREE.Mesh(new THREE.TorusGeometry(r * 1.04, r * 0.14, 14, 48), M.silver); bz.rotation.x = Math.PI / 2; bz.position.y = r * 0.03; grp.add(bz);
    for (let i = 0; i < (cab ? 0 : 6); i++) { const a = i / 6 * Math.PI * 2 + 0.26, pr = new THREE.Mesh(new THREE.SphereGeometry(r * 0.13, 10, 8), M.silver); pr.position.set(Math.cos(a) * r * 0.96, r * 0.16, Math.sin(a) * r * 0.96); pr.scale.set(1, 0.7, 1); grp.add(pr); }   // claw tips
    S.add(grp);
  };
  // roundels in both arms to seat the sapphires (a lathe disc with a chamfered rim)
  const disc = (R0, T) => { const pr = [[0, -T], [R0 * 0.82, -T], [R0, -T * 0.55], [R0 * 1.02, 0], [R0, T * 0.55], [R0 * 0.82, T], [0, T]]; const g = new THREE.LatheGeometry(pr.map(([x, y]) => new THREE.Vector2(x, y)), 64); g.rotateX(Math.PI / 2); return g; };
  for (const sx of [-1, 1]) add(disc(0.115, 0.075), M.fit, (o) => { o.position.set(sx * 0.58, 0.0, 0); });
  for (const sx of [-1, 1]) for (const fz of [1, -1]) set(sx * 0.58, 0.0, fz * 0.07, 0.078, M.sapphire, fz);       // sapphires in both arms (both faces)
  // grip: core + a spiral leather strap (overlapping like shingles) + silver ferrules
  add(new THREE.CylinderGeometry(0.072, 0.074, 1.0, 32), M.leather, (o) => { o.position.y = -0.62; });
  {   // a tightly wound leather cord over the core: every turn a rounded ridge that catches its own highlight
    const turns = 29, len = 0.95, y0 = -0.145, rr = 0.074;
    class Helix extends THREE.Curve { getPoint(t, o = new THREE.Vector3()) { const a = t * turns * Math.PI * 2; return o.set(Math.cos(a) * rr, y0 - t * len, Math.sin(a) * rr); } }
    const g = new THREE.TubeGeometry(new Helix(), turns * 36, 0.0175, 10, false); g.scale(1, 1, 1);
    const cord = new THREE.MeshPhysicalMaterial({ map: leatherCol, normalMap: leatherNrm, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.5, sheen: 0.5, sheenColor: new THREE.Color(0x426fd6), sheenRoughness: 0.45 });
    leatherCol.repeat.set(40, 1); leatherNrm.repeat.set(40, 1);
    add(g, cord);
  }
  for (const y of [-0.1, -1.13]) add(new THREE.CylinderGeometry(0.092, 0.092, 0.06, 40), M.silver, (o) => { o.position.y = y; });
  for (const y of [-0.075, -0.155, -1.085, -1.175]) add(new THREE.TorusGeometry(0.09, 0.012, 10, 48), M.silver, (o) => { o.position.y = y; o.rotation.x = Math.PI / 2; });
  // wheel pommel (lathe profile: rim, chamfer, face, raised boss) with a domed onyx in a bezel on each face, and a peen block
  const prof = [[0.0, -0.08], [0.07, -0.08], [0.1, -0.068], [0.168, -0.062], [0.198, -0.038], [0.207, 0], [0.198, 0.038], [0.168, 0.062], [0.1, 0.068], [0.07, 0.08], [0, 0.08]];
  const pw = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 72); pw.rotateX(Math.PI / 2);
  add(pw, M.fit, (o) => { o.position.y = -1.39; });
  add(new THREE.TorusGeometry(0.2, 0.012, 10, 80), M.silver, (o) => { o.position.y = -1.39; });
  for (const fz of [1, -1]) set(0, -1.39, fz * 0.078, 0.092, M.onyx, fz, true);
  add(new THREE.CylinderGeometry(0.05, 0.075, 0.07, 32), M.fit, (o) => { o.position.y = -1.18; });
  add(new RoundedBoxGeometry(0.1, 0.07, 0.08, 3, 0.02), M.fit, (o) => { o.position.y = -1.625; });
}

// ---------------------------------------------------------------- studio light: a procedural HDR environment (soft boxes, strips, a cool rim)
function studioEnv() {
  const w = 1024, h = 512, d = new Float32Array(w * h * 4);
  const box = (lon0, lon1, lat0, lat1, r, g, b) => { for (let y = 0; y < h; y++) { const lat = 90 - y / h * 180; if (lat < lat0 || lat > lat1) continue;
    for (let x = 0; x < w; x++) { const lon = x / w * 360 - 180; let inside = lon0 <= lon1 ? lon >= lon0 && lon <= lon1 : lon >= lon0 || lon <= lon1; if (!inside) continue; const i = (y * w + x) * 4; d[i] += r; d[i + 1] += g; d[i + 2] += b; } } };
  for (let y = 0; y < h; y++) { const lat = 90 - y / h * 180, k = Math.max(0, Math.sin(lat * Math.PI / 180)); for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; d[i] = 0.03 + 0.10 * k; d[i + 1] = 0.035 + 0.12 * k; d[i + 2] = 0.05 + 0.16 * k; d[i + 3] = 1; } }
  box(-40, 40, 55, 85, 9, 9, 9);                 // big top soft box
  box(-170, -20, 8, 16, 14, 14, 14);             // long strip, upper front-left (the bright line along the blade)
  box(20, 170, -14, -6, 8, 8.5, 9);              // long strip, lower front-right
  box(150, -150, 5, 35, 3, 5, 9);                // cool rim behind
  box(60, 80, 0, 18, 6, 4.5, 3);                 // warm kicker
  const t = new THREE.DataTexture(d, w, h, THREE.RGBAFormat, THREE.FloatType); t.mapping = THREE.EquirectangularReflectionMapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t;
}

(async () => {
  const r = new THREE.WebGLRenderer({ antialias: !MASK, alpha: true, preserveDrawingBuffer: true }); r.setSize(W, H); r.setPixelRatio(1);
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = MASK ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping; r.toneMappingExposure = +(Q.get('ex') || 1.0); r.setClearColor(0x000000, 0); document.body.appendChild(r.domElement);
  const scene = new THREE.Scene(); scene.background = null; if (!MASK) { scene.environment = studioEnv(); scene.environmentIntensity = +(Q.get('ei') || 1); }
  // horizontal, point right; turned on its long axis so the flat catches the top box
  const Rg = new THREE.Group(); const Tl = new THREE.Group(); Tl.add(S); S.position.y = -(BL + (-1.66)) / 2; Tl.rotation.y = +(Q.get('ry') || 0.42); Tl.rotation.x = +(Q.get('rx') || -0.06); Rg.add(Tl); Rg.rotation.z = -Math.PI / 2; scene.add(Rg);
  const len = BL + 1.66, hw = len / 2 * 1.025, hh = hw * H / W;
  const cam = new THREE.OrthographicCamera(-hw, hw, hh, -hh, 0.1, 100); cam.position.set(0, 0, 20); cam.lookAt(0, 0, 0);
  if (MASK) { r.render(scene, cam); window.__done = true; return; }
  const pt = new WebGLPathTracer(r); pt.bounces = +(Q.get('b') || 5); pt.filterGlossyFactor = +(Q.get('fg') || 0.5); pt.transmissiveBounces = 10; pt.multipleImportanceSampling = true; pt.dynamicLowRes = false; pt.minSamples = 1; pt.fadeDuration = 0; pt.renderDelay = 0;
  pt.tiles.set(+(Q.get('tx') || 2), +(Q.get('ty') || 1));
  pt.setScene(scene, cam);
  const t0 = performance.now(); window.__spp = 0;
  const gl = r.getContext(), px = new Uint8Array(4);
  const step = () => { pt.renderSample(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); window.__spp = pt.samples; window.__ms = performance.now() - t0; if (pt.samples < SPP) setTimeout(step, 0); else window.__done = true; };   // (readPixels: wait for the GPU, so progress is real and the page stays responsive)
  step();
})();
