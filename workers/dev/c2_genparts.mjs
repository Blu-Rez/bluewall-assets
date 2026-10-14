// c2_genparts.mjs — writes the procedural props of package C2 as plain glTF sources (dev/c2_src/*.gltf), vertex-coloured, flat-shaded, metres, front = +z.
// They are packed with the real (CC0 / CC-BY) models into web/assets/kit_c2.glb by dev/c2_mkkit.mjs  (recipe: dev/c2_recipe.json).  Only props and buildings are built here — no characters.
//   node dev/c2_genparts.mjs            -> dev/c2_src/<name>.gltf   (+ prints the tris of every part)
import fs from 'fs';
const OUT = new URL('./c2_src/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- tiny geometry kit
const hex = (h) => { const v = parseInt(h.slice(1), 16), s2l = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return [s2l((v >> 16) & 255), s2l((v >> 8) & 255), s2l(v & 255)]; };
let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const vary = (c, a = 0.06) => { const k = 1 + (rnd() - 0.5) * 2 * a; return [c[0] * k, c[1] * k, c[2] * k]; };
const mul3 = (A, v) => [A[0] * v[0] + A[1] * v[1] + A[2] * v[2], A[3] * v[0] + A[4] * v[1] + A[5] * v[2], A[6] * v[0] + A[7] * v[1] + A[8] * v[2]];
// rotation matrix, three.js 'XYZ' euler order is applied as R = Rx * Ry * Rz  (v' = Rx(Ry(Rz v)))
const eul = (rx = 0, ry = 0, rz = 0) => {
  const a = Math.cos(rx), b = Math.sin(rx), c = Math.cos(ry), d = Math.sin(ry), e = Math.cos(rz), f = Math.sin(rz);
  const Rx = [1, 0, 0, 0, a, -b, 0, b, a], Ry = [c, 0, d, 0, 1, 0, -d, 0, c], Rz = [e, -f, 0, f, e, 0, 0, 0, 1];
  const mm = (P, Q) => { const o = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(P[i * 3] * Q[j] + P[i * 3 + 1] * Q[3 + j] + P[i * 3 + 2] * Q[6 + j]); return o; };
  return mm(Rx, mm(Ry, Rz));
};
class Part {
  constructor(name) { this.name = name; this.P = []; this.C = []; }
  tri(a, b, c, col) { this.P.push(a, b, c); this.C.push(col, col, col); }
  quad(a, b, c, d, col) { this.tri(a, b, c, col); this.tri(a, c, d, col); }
  // oriented box: centre, size, euler, colour (every face shaded the same: the engine's lights do the rest)
  obox(c, s, e, col) {
    const R = eul(...e), h = [s[0] / 2, s[1] / 2, s[2] / 2], V = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) { const p = mul3(R, [sx * h[0], sy * h[1], sz * h[2]]); V.push([c[0] + p[0], c[1] + p[1], c[2] + p[2]]); }
    const I = (sx, sy, sz) => V[(sx > 0 ? 4 : 0) + (sy > 0 ? 2 : 0) + (sz > 0 ? 1 : 0)];
    const F = [[[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]], [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]]];
    F.forEach((f, i) => { const k = [0.88, 0.8, 1.12, 0.62, 1.0, 0.9][i]; this.quad(I(...f[0]), I(...f[1]), I(...f[2]), I(...f[3]), [col[0] * k, col[1] * k, col[2] * k]); });
  }
  box(cx, y0, cz, sx, sy, sz, col, ry = 0) { this.obox([cx, y0 + sy / 2, cz], [sx, sy, sz], [0, ry, 0], col); }
  // truncated cone / cylinder from point a to point b (radii ra, rb), n sides, optional caps in another colour
  tube(a, b, ra, rb, n, col, capCol = null) {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d) || 1, w = d.map((v) => v / L);
    const t = Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u0 = [w[1] * t[2] - w[2] * t[1], w[2] * t[0] - w[0] * t[2], w[0] * t[1] - w[1] * t[0]], ul = Math.hypot(...u0), u = u0.map((v) => v / ul), v = [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]];
    const ring = (p, r) => Array.from({ length: n }, (_, i) => { const q = (i / n) * Math.PI * 2, cq = Math.cos(q) * r, sq = Math.sin(q) * r; return [p[0] + u[0] * cq + v[0] * sq, p[1] + u[1] * cq + v[1] * sq, p[2] + u[2] * cq + v[2] * sq]; });
    const A = ring(a, ra), B = ring(b, rb);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, k = 0.82 + 0.18 * Math.cos((i / n) * Math.PI * 2); this.quad(A[i], A[j], B[j], B[i], [col[0] * k, col[1] * k, col[2] * k]); }
    const cc = capCol || col;
    if (rb > 0.001) for (let i = 0; i < n; i++) this.tri(b, B[i], B[(i + 1) % n], cc);
    if (ra > 0.001) for (let i = 0; i < n; i++) this.tri(a, A[(i + 1) % n], A[i], cc);
  }
  // a triangle prism (gable end / wedge): three 2D points (in the x-y plane) extruded along z between z0..z1
  prism(p, z0, z1, col) {
    const f = (q, z) => [q[0], q[1], z];
    this.tri(f(p[0], z1), f(p[1], z1), f(p[2], z1), col); this.tri(f(p[0], z0), f(p[2], z0), f(p[1], z0), col);
    for (let i = 0; i < 3; i++) { const a = p[i], b = p[(i + 1) % 3]; this.quad(f(a, z0), f(b, z0), f(b, z1), f(a, z1), [col[0] * 0.85, col[1] * 0.85, col[2] * 0.85]); }
  }
  write() {
    const n = this.P.length, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 4);
    for (let i = 0; i < n; i += 3) {
      const a = this.P[i], b = this.P[i + 1], c = this.P[i + 2], ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      for (let k = 0; k < 3; k++) { pos.set(this.P[i + k], (i + k) * 3); nor.set([nx, ny, nz], (i + k) * 3); col.set([...this.C[i + k], 1], (i + k) * 4); }
    }
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], pos[i * 3 + k]); mx[k] = Math.max(mx[k], pos[i * 3 + k]); }
    const bin = Buffer.concat([pos, nor, col].map((a) => Buffer.from(a.buffer)));
    const g = {
      asset: { version: '2.0', generator: 'c2_genparts' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name: this.name, mesh: 0 }],
      meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 }, material: 0, mode: 4 }] }],
      materials: [{ name: 'c2gen', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.9 } }],
      accessors: [{ bufferView: 0, componentType: 5126, count: n, type: 'VEC3', min: mn, max: mx }, { bufferView: 1, componentType: 5126, count: n, type: 'VEC3' }, { bufferView: 2, componentType: 5126, count: n, type: 'VEC4' }],
      bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: pos.byteLength }, { buffer: 0, byteOffset: pos.byteLength, byteLength: nor.byteLength }, { buffer: 0, byteOffset: pos.byteLength + nor.byteLength, byteLength: col.byteLength }],
      buffers: [{ byteLength: bin.length, uri: 'data:application/octet-stream;base64,' + bin.toString('base64') }],
    };
    fs.writeFileSync(OUT + this.name.replace(/^c2_/, '') + '.gltf', JSON.stringify(g));
    console.log(this.name.padEnd(16), String(n / 3).padStart(5), 'tris', 'size', mx.map((v, i) => (v - mn[i]).toFixed(1)).join('×'));
  }
}

// ---------------------------------------------------------------- palette (the KayKit look of the existing sites: warm timber, grey stone, red tile, blue slate)
const K = {
  timber: hex('#8a4b2c'), timberD: hex('#6b3a22'), plank: hex('#b8794a'), plankL: hex('#d9b072'), wood: hex('#9b6a40'), bark: hex('#7a5a3c'), cut: hex('#e0bd86'), floor: hex('#8d7352'),
  roofBrown: hex('#6f5340'), roofBrownL: hex('#82634c'), slate: hex('#4f6d96'), slateL: hex('#6486b3'), tile: hex('#c5523a'),
  stone: hex('#a6acb3'), stoneL: hex('#bdc3ca'), stoneD: hex('#80868e'), dark: hex('#2a2420'), steel: hex('#c5ccd6'), iron: hex('#7d8aa0'), ironD: hex('#5d6878'),
  ore: hex('#6f5448'), oreL: hex('#8a6a58'), coal: hex('#24232a'), clay: hex('#5a4634'), hot: hex('#ff8a2a'), hotL: hex('#ffc25a'), leather: hex('#6a4a30'), rope: hex('#c9b78a'),
};

// ================================================================ SAWMILL
{ // the open timber shed: lean-to roof, plank back wall, three bays (front = +z)
  const p = new Part('c2_sawshed'); const W = 11.4, D = 7.2;
  p.box(0, 0, 0, W, 0.22, D, K.floor);
  p.box(0, 0.22, -3.4, W - 0.6, 5.0, 0.2, K.plank);
  for (let i = 0; i < 10; i++) p.box(-5 + i * 1.1, 0.22, -3.27, 0.16, 5.0, 0.1, K.timberD);
  for (const x of [-5.3, 0, 5.3]) { p.box(x, 0.22, 3.1, 0.38, 4.1, 0.38, K.timber); p.box(x, 0.22, -3.2, 0.42, 5.4, 0.42, K.timber); }
  for (const sx of [-5.5, 5.5]) { p.box(sx, 0.22, 0, 0.3, 4.1, 0.34, K.timber); p.box(sx, 1.0, 0.0, 0.14, 0.14, 6.2, K.timberD); }   // side posts + rails
  p.box(0, 4.3, 3.1, W, 0.3, 0.42, K.timberD); p.box(0, 5.45, -3.2, W, 0.3, 0.42, K.timberD);
  // lean-to roof: back high, front low; shingle bands
  const rx = Math.atan2(1.15, 6.4), L = Math.hypot(6.6, 1.15);
  p.obox([0, 5.15 - 0.2, 0], [W + 0.9, 0.2, L + 0.7], [rx, 0, 0], K.roofBrown);
  for (let k = 0; k < 6; k++) { const z = -2.8 + k * 1.1, y = 4.95 - (z + 3.2) * (1.15 / 6.4); p.obox([0, y + 0.13, z], [W + 0.92, 0.07, 0.34], [rx, 0, 0], K.roofBrownL); }
  p.obox([0, 5.75, -3.45], [W + 1.0, 0.26, 0.6], [0.2, 0, 0], K.timberD);                    // ridge cap
  p.write();
}
{ // frame saw: gantry, sash with a steel blade, log on a rail carriage
  const p = new Part('c2_sawframe');
  for (const x of [-0.62, 0.62]) p.box(x, 0, 0, 0.2, 0.2, 5.4, K.timberD);                       // rails
  p.box(0, 0.2, 0.2, 1.7, 0.14, 3.9, K.wood);                                                    // carriage
  p.tube([0, 0.78, -1.9], [0, 0.78, 2.2], 0.44, 0.44, 9, K.bark, K.cut);                         // the log
  p.tube([0, 0.78, -0.18], [0, 0.78, -0.12], 0.46, 0.46, 9, K.dark);                              // the saw kerf
  for (const z of [-0.95, 0.65]) { p.box(-1.0, 0, z, 0.26, 3.5, 0.3, K.timber); p.box(1.0, 0, z, 0.26, 3.5, 0.3, K.timber); p.box(0, 3.25, z, 2.3, 0.3, 0.34, K.timberD); }
  p.box(-1.0, 1.0, -0.15, 0.2, 0.2, 1.7, K.timberD); p.box(1.0, 1.0, -0.15, 0.2, 0.2, 1.7, K.timberD);
  for (const z of [-0.36, 0.06]) p.box(0, 0.0 + 0.9, z, 0.12, 2.35, 0.1, K.plankL);              // sash uprights
  p.box(0, 3.1, -0.15, 0.2, 0.14, 0.7, K.plankL); p.box(0, 0.85, -0.15, 0.2, 0.12, 0.7, K.plankL);
  p.box(0, 1.1, -0.15, 0.04, 1.95, 0.54, K.steel);                                               // blade
  p.tube([0, 3.15, -0.15], [-1.9, 3.9, -0.15], 0.07, 0.07, 5, K.iron);                             // pitman rod to the wheel
  for (let i = 0; i < 3; i++) p.box(1.3 + i * 0.24, 0.0, 1.2 - i * 0.2, 0.2, 0.1, 1.8, K.plankL, 0.08 * i); // sawn boards leaning out
  p.write();
}
{ // log ramp: logs rolled up a slope to the shed
  const p = new Part('c2_logramp'); const sl = Math.atan2(1.5, 7.0);
  p.obox([0, 0.78, 0], [2.7, 0.2, 7.5], [sl, 0, 0], K.wood);
  for (const x of [-1.35, 1.35]) p.obox([x, 1.0, 0], [0.16, 0.5, 7.5], [sl, 0, 0], K.timberD);
  for (const z of [-2.8, 0, 2.8]) { const y = 0.78 - z * Math.tan(sl) * 0.99; p.box(-1.1, 0, z, 0.2, Math.max(0.2, y - 0.1), 0.3, K.timberD); p.box(1.1, 0, z, 0.2, Math.max(0.2, y - 0.1), 0.3, K.timberD); }
  const Y = (z) => 0.78 - z * Math.tan(sl);
  p.tube([-0.55, Y(2.7) + 0.5, 2.7], [-0.55, Y(-2.9) + 0.5, -2.9], 0.4, 0.4, 8, K.bark, K.cut);
  p.tube([0.6, Y(1.6) + 0.5, 1.6], [0.6, Y(-2.2) + 0.5, -2.2], 0.38, 0.38, 8, vary(K.bark), K.cut);
  p.tube([0.0, Y(0.8) + 1.05, 0.8], [0.0, Y(-2.5) + 1.05, -2.5], 0.36, 0.36, 8, vary(K.bark), K.cut);
  p.write();
}
{ // seasoning stack: boards, spacer sticks (no lid: it must not read as a table)
  const p = new Part('c2_plankstack');
  p.box(0, 0, 0, 2.8, 0.18, 1.5, K.timberD);
  for (let k = 0; k < 9; k++) {
    const y = 0.18 + k * 0.19;
    for (let i = 0; i < 3; i++) p.box(0, y, -0.5 + i * 0.5, 2.7 - (k > 6 ? 0.5 : 0), 0.12, 0.46, vary(K.plankL, 0.09));
    if (k < 8) for (const x of [-1.15, 0, 1.15]) p.box(x, y + 0.12, 0, 0.12, 0.07, 1.5, K.wood);
  }
  p.write();
}
{ // pit-saw trestle: a log on two crossed-leg trestles with a two-man saw
  const p = new Part('c2_sawtrestle');
  for (const x of [-1.0, 1.0]) for (const s of [-1, 1]) p.obox([x, 0.55, s * 0.3], [0.14, 1.25, 0.14], [s * 0.3, 0, 0], K.timber);
  p.tube([-1.7, 1.2, 0], [1.7, 1.2, 0], 0.3, 0.3, 8, K.bark, K.cut);
  p.obox([0.2, 1.52, 0], [1.4, 0.16, 0.02], [0, 0, 0.1], K.steel); p.box(-0.55, 1.45, 0, 0.1, 0.4, 0.1, K.timberD); p.box(0.95, 1.5, 0, 0.1, 0.4, 0.1, K.timberD);
  p.write();
}
{ // sawdust apron (flat disc)
  const p = new Part('c2_sawdust');
  p.tube([0, 0, 0], [0, 0.05, 0], 5.2, 5.0, 14, hex('#cdae7a'));
  p.write();
}

// ================================================================ MASONRY
// a gable hall facing +z: plinth, walls with course lines, corner quoins, a front opening, a gable roof (ridge along z) with lighter shingle bands
function hall(p, o) {
  const { W, D, H, rise, wall, wallD, quoin, roof, roofL, door, glow } = o, zf = D / 2;
  p.box(0, 0, 0, W + 0.3, 0.6, D + 0.3, wallD);
  p.box(0, 0.6, 0, W, H - 0.6, D, wall);
  for (let r = 0; r < 4; r++) p.box(0, 0.9 + r * 0.62, 0, W + 0.04, 0.05, D + 0.04, wallD);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 5; k++) p.box(sx * (W / 2 - 0.1) + (k & 1 ? sx * 0.05 : 0), 0.6 + k * 0.52, sz * (D / 2 - 0.1), 0.55, 0.5, 0.55, vary(quoin));
  p.box(0, 0, zf - 0.02, door[0], door[1], 0.2, K.dark); p.box(0, door[1], zf - 0.02, door[0] + 0.4, 0.3, 0.34, quoin);
  for (const x of [-1, 1]) p.box(x * (door[0] / 2 + 0.15), 0, zf - 0.02, 0.3, door[1], 0.3, quoin);
  if (glow) { p.box(0, 0.05, zf - 0.1, door[0] - 0.5, 0.5, 0.1, K.hot); p.box(0, 0.12, zf - 0.08, door[0] - 1.3, 0.3, 0.1, K.hotL); }
  const rz = Math.atan2(rise, W / 2), Ls = Math.hypot(W / 2, rise) + 0.55;
  for (const s of [-1, 1]) {
    p.obox([s * (W / 4 + 0.1), H + rise / 2 + 0.12, 0], [Ls, 0.22, D + 1.1], [0, 0, -s * rz], roof);
    for (let k = 0; k < 4; k++) { const f = 0.22 + k * 0.2, u = (W / 2) * f, y = H + rise * (1 - f); p.obox([s * (u + 0.1), y + 0.2, 0], [0.34, 0.08, D + 1.14], [0, 0, -s * rz], roofL); }
  }
  p.obox([0, H + rise + 0.2, 0], [0.5, 0.2, D + 1.2], [0, 0, 0], K.timberD);
  p.prism([[-W / 2, H], [W / 2, H], [0, H + rise]], zf - 0.06, zf + 0.04, wall); p.prism([[-W / 2, H], [W / 2, H], [0, H + rise]], -zf - 0.04, -zf + 0.06, wall);
}
{ // mason's lodge: grey ashlar walls, slate roof, arched workshop door, two small windows
  const p = new Part('c2_masonlodge'); const W = 7.6, D = 8.6, H = 3.2;
  hall(p, { W, D, H, rise: 2.5, wall: K.stone, wallD: K.stoneD, quoin: K.stoneL, roof: K.slate, roofL: K.slateL, door: [2.5, 2.4], glow: false });
  for (const x of [-2.8, 2.8]) { p.box(x, 1.4, D / 2 - 0.02, 0.8, 0.9, 0.14, K.dark); p.box(x, 2.3, D / 2 - 0.02, 1.0, 0.14, 0.24, K.stoneL); p.box(x, 1.26, D / 2 - 0.02, 1.0, 0.14, 0.26, K.stoneL); }
  p.box(2.2, 3.2 + 0.6, -2.2, 0.9, 3.0, 0.9, K.stoneD);                                                    // chimney
  p.write();
}
{ // smeltery hall: dark brick, red tile roof, a wide hearth door with the glow of the fire inside
  const p = new Part('c2_smeltery'); const W = 9.4, D = 7.4, H = 3.6;
  hall(p, { W, D, H, rise: 2.2, wall: hex('#8c4a3c'), wallD: hex('#5e3a32'), quoin: K.stone, roof: K.tile, roofL: hex('#d8694a'), door: [3.6, 2.8], glow: true });
  for (const x of [-3.4, 3.4]) { p.box(x, 1.5, D / 2 - 0.02, 0.7, 1.1, 0.14, K.dark); p.box(x, 2.6, D / 2 - 0.02, 0.9, 0.14, 0.24, K.stone); }
  p.box(-2.8, 3.6 + 0.4, -1.5, 1.1, 3.4, 1.1, K.stoneD); p.box(-2.8, 7.0, -1.5, 1.4, 0.3, 1.4, K.stone);    // side chimney
  p.write();
}
{ // stone-cutting table: trestle bench, a block with a saw kerf, a hand saw, a sand pail
  const p = new Part('c2_stonesaw');
  for (const x of [-1.5, 1.5]) for (const z of [-0.5, 0.5]) p.box(x, 0, z, 0.2, 1.0, 0.2, K.timber);
  p.box(0, 1.0, 0, 3.6, 0.18, 1.5, K.wood);
  p.box(0, 1.18, 0, 2.4, 0.78, 1.1, K.stoneL); p.box(0, 1.5, 0, 0.05, 0.46, 1.12, K.dark);       // block + kerf
  p.obox([0.3, 2.05, 0.0], [1.9, 0.2, 0.03], [0, 0, 0.08], K.steel); p.box(1.2, 1.95, 0, 0.1, 0.42, 0.1, K.timberD); p.box(-0.7, 2.0, 0, 0.1, 0.34, 0.1, K.timberD);
  p.tube([-1.6, 1.18, 0.95], [-1.6, 1.58, 0.95], 0.22, 0.2, 7, K.timberD);                         // pail
  p.box(1.55, 1.18, 0.9, 0.5, 0.12, 0.34, K.stone); p.box(1.0, 1.18, 0.95, 0.16, 0.12, 0.5, K.iron);   // chisels
  p.write();
}
{ // arch under construction: two piers, wooden centering, voussoirs (the mason's trade in one picture)
  const p = new Part('c2_arch'); const R = 2.2, cy = 2.3;
  for (const s of [-1, 1]) { p.box(s * 2.65, 0, 0, 1.0, cy, 1.1, K.stone); p.box(s * 2.65, 0, 0, 1.12, 0.35, 1.22, K.stoneD); }
  const N = 9;
  for (let i = 0; i < N; i++) {                                                                       // centering planks
    const a = Math.PI * (i + 0.5) / N, c = [-Math.cos(a) * (R - 0.6), cy + Math.sin(a) * (R - 0.6)];
    p.obox([c[0], c[1], 0], [0.42, 0.16, 1.0], [0, 0, Math.PI / 2 - a], K.plankL);
  }
  p.box(-1.6, 0, 0, 0.14, cy - 0.3, 0.14, K.timber); p.box(1.6, 0, 0, 0.14, cy - 0.3, 0.14, K.timber); p.box(0, 0, 0, 0.14, cy - 0.6 + 0.0, 0.14, K.timber);
  const M = 7;
  for (let i = 0; i < M; i++) {                                                                       // voussoirs, keystone in the middle
    const a = Math.PI * (i + 0.5) / M, key = i === (M - 1) / 2, c = [-Math.cos(a) * R, cy + Math.sin(a) * R];
    p.obox([c[0], c[1], 0], [0.78 + (key ? 0.1 : 0), key ? 0.95 : 0.8, 1.05], [0, 0, Math.PI / 2 - a], key ? K.stoneL : vary(K.stone, 0.07));
  }
  p.write();
}
{ // cut-stone stack: dressed ashlar blocks in a staggered pyramid
  const p = new Part('c2_blockstack');
  const row = [4, 3, 2, 1];
  row.forEach((n, k) => { for (let i = 0; i < n; i++) p.box(-(n - 1) * 0.63 + i * 1.26, k * 0.66, 0, 1.2, 0.62, 1.3, vary(K.stoneL, 0.05)); });
  p.write();
}
{ // derrick crane with a hanging block (dressed stone leaving the yard)
  const p = new Part('c2_hoist');
  p.tube([0, 0, 0], [0, 6.2, 0], 0.2, 0.15, 6, K.timber); p.tube([0, 6.0, 0], [0, 4.4, 4.3], 0.13, 0.12, 6, K.wood);
  p.tube([0, 6.2, 0], [0.9, 0, -3.1], 0.08, 0.08, 4, K.rope); p.tube([0, 6.2, 0], [-0.9, 0, -3.1], 0.08, 0.08, 4, K.rope);
  p.box(0, 0, 0, 1.3, 0.2, 1.3, K.timberD); p.box(-1.0, 0, -3.1, 0.5, 0.5, 0.5, K.stoneD); p.box(0.9, 0, -3.1, 0.5, 0.5, 0.5, K.stoneD);
  p.tube([0, 4.4, 4.3], [0, 2.3, 4.3], 0.04, 0.04, 4, K.rope); p.box(0, 1.2, 4.3, 1.1, 1.0, 1.0, K.stoneL);
  p.write();
}
{ // dressed pillar / column drums on a pallet (a finished product that is not a box)
  const p = new Part('c2_drums');
  p.box(0, 0, 0, 3.2, 0.16, 1.6, K.timberD);
  p.tube([-0.8, 0.16, 0], [-0.8, 1.06, 0], 0.55, 0.55, 10, K.stoneL, K.stone); p.tube([0.8, 0.16, 0], [0.8, 1.06, 0], 0.55, 0.55, 10, K.stoneL, K.stone);
  p.tube([0, 1.06, 0], [0, 1.9, 0], 0.5, 0.5, 10, vary(K.stoneL), K.stone);
  p.write();
}

// ================================================================ SMELTER
{ // ingot moulds in a sand bed — hot (glowing) and cold (steel)
  for (const [nm, hot] of [['c2_mouldhot', true], ['c2_mouldcold', false]]) {
    const p = new Part(nm);
    p.box(0, 0, 0, 3.0, 0.2, 1.7, K.clay); p.box(0, 0.2, 0, 2.7, 0.04, 1.45, hex('#3a2e24'));
    for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) { const c = hot ? (rnd() < 0.5 ? K.hot : K.hotL) : vary(K.iron, 0.08); p.box(-1.12 + i * 0.56, 0.22, -0.4 + r * 0.8, 0.46, 0.14, 0.3, c); }
    p.write();
  }
}
{ // iron bar stack on a pallet
  const p = new Part('c2_barstack');
  p.box(0, 0, 0, 2.5, 0.15, 1.3, K.timberD);
  [6, 5, 4, 3].forEach((n, k) => { for (let i = 0; i < n; i++) p.box(0, 0.15 + k * 0.17, -(n - 1) * 0.11 + i * 0.22, 2.3, 0.15, 0.2, vary(K.iron, 0.07)); });
  p.write();
}
{ // hand bellows on a frame, nozzle pointing at the hearth (+z)
  const p = new Part('c2_bellows');
  p.box(-0.5, 0, -0.5, 0.14, 0.8, 0.14, K.timber); p.box(0.5, 0, -0.5, 0.14, 0.8, 0.14, K.timber);
  p.box(0, 0.8, -0.3, 1.5, 0.12, 1.5, K.wood);
  p.obox([0, 1.2, -0.3], [1.35, 0.1, 1.35], [-0.32, 0, 0], K.wood);
  p.obox([-0.62, 1.0, -0.3], [0.08, 0.5, 1.3], [-0.16, 0, 0], K.leather); p.obox([0.62, 1.0, -0.3], [0.08, 0.5, 1.3], [-0.16, 0, 0], K.leather);
  p.tube([0, 0.95, 0.35], [0, 0.8, 1.5], 0.1, 0.06, 6, K.ironD); p.tube([0, 1.5, -0.95], [0, 2.1, -1.2], 0.05, 0.05, 4, K.timberD);
  p.write();
}
{ // ore heap + coal heap: a mound of angular lumps (not a cone: it must not read as a tent)
  const heap = (name, base, glint, n, R0, H0, lump) => {
    const p = new Part(name);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, rr = R0 * Math.sqrt(rnd()) * (1 - 0.0), h = H0 * Math.max(0, 1 - rr / (R0 * 1.15)), sz = lump * (0.7 + rnd() * 0.7);
      const col = rnd() < 0.16 ? vary(glint, 0.1) : vary(base, 0.16);
      p.obox([Math.cos(a) * rr, h + sz * 0.3, Math.sin(a) * rr], [sz * (0.8 + rnd() * 0.5), sz * (0.6 + rnd() * 0.5), sz * (0.8 + rnd() * 0.5)], [rnd() * 0.9 - 0.45, rnd() * 6.28, rnd() * 0.9 - 0.45], col);
    }
    p.box(0, 0, 0, R0 * 1.5, 0.12, R0 * 1.5, hex('#4a3d33'));                      // trampled base
    p.write();
  };
  heap('c2_oreheap', hex('#6f5448'), hex('#7a8494'), 34, 1.9, 1.4, 0.8);
  heap('c2_coalheap', hex('#26252c'), hex('#4a4b57'), 24, 1.3, 0.9, 0.55);
}
{ // the glow of the furnace mouth (merged into c2_furnace by dev/c2_mkkit.mjs `extra`; coordinates = the furnace source, see c2_recipe.json)
  const p = new Part('c2_glowmouth');
  p.box(0, 0, 0, 1.3, 1.0, 0.12, K.hot); p.box(0, 0.1, 0.02, 0.8, 0.6, 0.12, K.hotL);
  p.write();
}
