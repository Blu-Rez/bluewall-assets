// The attacker's field tents (p30): a striped round pavilion (scalloped valance, gold eave trim, tied-back door, ropes and pegs, finial + swallow-tail pennant)
// and a long marquee (striped ridge roof, scalloped eaves, gable door, standards at both ends).  Pure geometry, vertex-coloured, position+normal+color only,
// so they merge and instance cheaply.  Local frame: the door faces -z, the tent stands on y = 0.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V2 = THREE.Vector2;
const ni = (g) => (g.index ? g.toNonIndexed() : g);
const bare = (g) => { g = ni(g); for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); return g; };
const hexOf = (h) => new THREE.Color(h);
// colour every triangle by fn(centroid x, y, z) -> hex
const paint = (g, fn) => {
  const p = g.attributes.position, n = p.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 3) {
    const c = hexOf(fn((p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3));
    for (let k = 0; k < 3; k++) { a[(i + k) * 3] = c.r; a[(i + k) * 3 + 1] = c.g; a[(i + k) * 3 + 2] = c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
};
const flat = (g, hex) => paint(bare(g), () => hex);
const at = (g, x, y, z, ry = 0, rz = 0) => { g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz)), new THREE.Vector3(1, 1, 1))); return g; };
const box = (w, h, d, hex, x, y, z, ry = 0, rz = 0) => at(flat(new THREE.BoxGeometry(w, h, d), hex), x, y, z, ry, rz);
const cyl = (r0, r1, h, hex, x, y, z, seg = 7) => at(flat(new THREE.CylinderGeometry(r1, r0, h, seg), hex), x, y, z);
const ball = (r, hex, x, y, z) => at(flat(new THREE.SphereGeometry(r, 10, 7), hex), x, y, z);
// a thin rod from a to b
const rod = (ax, ay, az, bx, by, bz, r, hex) => {
  const d = new THREE.Vector3(bx - ax, by - ay, bz - az), L = d.length(), g = bare(new THREE.CylinderGeometry(r, r, L, 4));
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1)));
  return paint(g, () => hex);
};
// flat triangles (double-sided material): [[x,y,z]x3] with a colour
const tri = (pts, hex) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); g.computeVertexNormals(); return paint(g, () => hex); };
const quad = (a, b, c, d, hex) => mergeGeometries([tri([a, b, c], hex), tri([a, c, d], hex)], false);

const ROPE = 0xb09c70, WOODC = 0x5a4228, GOLD = 0xcdb36a, DOOR = 0x0b1120;

// swallow-tail pennant hanging off the top of a pole (points +x): colours a / b
function pennant(x, y, z, len, hgt, a, b, ry = 0) {
  const P = [];
  P.push(tri([[0, 0, 0], [len * 0.55, 0.1 * hgt, 0], [len * 0.55, -hgt * 0.5, 0]], a));
  P.push(tri([[0, 0, 0], [len * 0.55, -hgt * 0.5, 0], [0, -hgt, 0]], a));
  P.push(tri([[len * 0.55, 0.1 * hgt, 0], [len, -0.05 * hgt, 0.05], [len * 0.82, -hgt * 0.45, 0.05]], b));
  P.push(tri([[len * 0.55, 0.1 * hgt, 0], [len * 0.82, -hgt * 0.45, 0.05], [len * 0.55, -hgt * 0.5, 0]], b));
  P.push(tri([[len * 0.55, -hgt * 0.5, 0], [len * 0.82, -hgt * 0.45, 0.05], [len * 0.45, -hgt, 0.04]], b));
  const g = mergeGeometries(P, false); return at(g, x, y, z, ry);
}

// ---- round pavilion (p30b: billowing canvas panels, drooping scalloped valance, piping, tassels, arched door with tied-back flaps, catenary guy ropes) -------------------
// o = { A: stripe colour (the squad colour), B: cream, wall, hem, trim, r0 (wall radius), wallH, roofH, stripes (even number of panels) }.  Returns position+normal+color+uv
// (uv = a cylindrical mapping, so one tileable canvas texture covers every panel).  Door at -z, the tent stands on y = 0.
const TAU = Math.PI * 2;
// a smooth-shaded panel from P(s, t) -> [x, y, z]
const panel = (P, nx, ny, hex) => {
  const pos = [], idx = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) pos.push(...P(i / nx, j / ny));
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const nor = [], e = 0.002;                                                                // analytic normals (finite differences of the surface): a grid's own vertex normals zig-zag along the diagonals
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const s = i / nx, t = j / ny, cl = (v) => Math.max(0, Math.min(1, v)), a = P(cl(s + e), t), b = P(cl(s - e), t), c = P(s, cl(t + e)), d = P(s, cl(t - e));
    const ps = new THREE.Vector3(a[0] - b[0], a[1] - b[1], a[2] - b[2]), pt = new THREE.Vector3(c[0] - d[0], c[1] - d[1], c[2] - d[2]), n = pt.cross(ps);
    if (n.lengthSq() < 1e-12) n.set(0, 1, 0); n.normalize(); nor.push(n.x, n.y, n.z);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return paint(bare(g), () => hex);
};
// UVs: the whole tent (roof, valance, wall) is mapped with ONE conic development around its apex, so the weave is never squeezed towards the tip; the seam runs along a rib
const withUV = (g, o, tile = 2.2) => {
  const p = g.attributes.position, n = p.count, uv = new Float32Array(n * 2), slant = Math.hypot(o.Re, o.roofH), k = o.Re / slant, seam = o.seam;
  const wrap = (a) => { while (a > Math.PI) a -= TAU; while (a <= -Math.PI) a += TAU; return a; };
  for (let i = 0; i < n; i += 3) {
    let a0 = 0;
    for (let c = 0; c < 3; c++) {
      const x = p.getX(i + c), y = p.getY(i + c), z = p.getZ(i + c); let a = wrap(Math.atan2(x, z) - seam);
      if (c === 0) a0 = a; else { while (a - a0 > Math.PI) a -= TAU; while (a - a0 < -Math.PI) a += TAU; }
      const rho = Math.hypot(Math.hypot(x, z), o.tipY - y), psi = a * k;
      uv[(i + c) * 2] = rho * Math.cos(psi) / tile; uv[(i + c) * 2 + 1] = rho * Math.sin(psi) / tile;
    }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
};
export function pavilionGeo(o = {}) {
  const { A = 0x23406f, B = 0xf1ead6, wall = 0xe9e1cb, hem = 0x9a8f72, trim = 0xd8c98f, r0 = 3.6, wallH = 2.1, roofH = 4.3, stripes = 12 } = o;
  const Re = r0 + 0.6, eaveY = wallH, WA = TAU / stripes, parts = [];
  const sinP = (s) => Math.sin(Math.PI * s);
  // ---- roof panels: concave cone, each panel billows between its ribs and droops at the eave
  const roofP = (w) => (s, t) => {
    const th = (w + s + 0.5) * WA, rr = Math.max(0.05, Re * (1 - t)), y0 = eaveY + roofH * Math.pow(t, 1.5);
    const b = 0.10 * sinP(s) * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.04)), droop = 0.2 * Math.pow(sinP(s), 0.8) * Math.pow(1 - t, 3);
    const r = rr + b * 0.45; return [Math.sin(th) * r, y0 + b * 0.85 - droop, Math.cos(th) * r];
  };
  for (let w = 0; w < stripes; w++) parts.push(panel(roofP(w), 10, 12, (w & 1) ? B : A));
  // ---- wall panels (a muddy hem band, then canvas), sagging a little between the poles
  for (let w = 0; w < stripes; w++) {
    const wallPt = (y0, y1) => (s, t) => { const th = (w + s + 0.5) * WA, r = r0 + 0.07 * sinP(s) + 0.03 * Math.sin(Math.PI * (y0 + (y1 - y0) * t) / wallH); const y = y0 + (y1 - y0) * t; return [Math.sin(th) * r, y, Math.cos(th) * r]; };
    parts.push(panel(wallPt(0, 0.42), 4, 1, hem)); parts.push(panel(wallPt(0.42, wallH + 0.03), 4, 3, wall));
  }
  // ---- piping along every rib (pale gold) + a tassel at the foot of each rib
  for (let k = 0; k < stripes; k++) {
    const th = (k + 0.5) * WA, N = 8;
    for (let j = 0; j < N; j++) {
      const t0 = j / N, t1 = (j + 1) / N, pa = roofP(k)(0, t0), pb = roofP(k)(0, t1);
      const up = (p) => [p[0] * 1.004, p[1] + 0.02, p[2] * 1.004];
      const a = up(pa), b = up(pb); parts.push(rod(a[0], a[1], a[2], b[0], b[1], b[2], 0.034, trim));
    }
    const tr = Re - 0.02; parts.push(ball(0.075, trim, Math.sin(th) * tr, eaveY - 0.42, Math.cos(th) * tr));
    parts.push(rod(Math.sin(th) * tr, eaveY - 0.05, Math.cos(th) * tr, Math.sin(th) * tr, eaveY - 0.4, Math.cos(th) * tr, 0.018, trim));
  }
  // ---- scalloped valance under each panel (same colour as the panel above)
  for (let w = 0; w < stripes; w++) {
    if (w === (stripes >> 1) - 1) continue;                                           // (no valance over the door)
    const col = (w & 1) ? B : A;
    parts.push(panel((s, t) => {
      const th = (w + s + 0.5) * WA, top = eaveY - 0.2 * Math.pow(sinP(s), 0.8) - 0.02, bot = top - 0.3 - 0.5 * Math.pow(sinP(s), 0.7), y = top + (bot - top) * t, r = Re - 0.02 + 0.1 * t + 0.03 * sinP(s);
      return [Math.sin(th) * r, y, Math.cos(th) * r];
    }, 10, 2, col));
  }
  // ---- door at -z: arched dark opening, timber frame, two tied-back flaps
  {
    const rw = r0 + 0.16, zAt = (x) => -Math.sqrt(Math.max(0.5, rw * rw - x * x)), hw = 0.85, spring = 1.3, topY = 2.0;
    const pts = [[-hw, 0]]; for (let k = 0; k <= 8; k++) { const a = Math.PI - (k / 8) * Math.PI; pts.push([Math.cos(a) * hw, spring + Math.sin(a) * (topY - spring)]); } pts.push([hw, 0]);
    const cx = 0, cy = 0.9, P3 = (q) => [q[0], q[1], zAt(q[0])];
    for (let k = 0; k < pts.length; k++) parts.push(tri([P3([cx, cy]), P3(pts[k]), P3(pts[(k + 1) % pts.length])], DOOR));
    for (let k = 0; k < pts.length - 1; k++) { const a = P3(pts[k]), b = P3(pts[k + 1]); parts.push(rod(a[0], a[1], a[2] - 0.03, b[0], b[1], b[2] - 0.03, 0.055, WOODC)); }
    for (const e of [-1, 1]) {
      parts.push(panel((s, t) => {
        const xL = e * (0.9 + 0.8 * t), xR = e * (1.38 + 0.7 * t), x = xL + (xR - xL) * s, y = 2.0 - 1.9 * t;
        return [x, y, zAt(x) - 0.1 - 0.12 * sinP(s) * (1 - t * 0.5)];
      }, 4, 8, wall));
      const tx0 = e * (0.9 + 0.8 * 0.42), tx1 = e * (1.38 + 0.7 * 0.42), ty = 2.0 - 1.9 * 0.42;
      parts.push(rod(tx0, ty, zAt(tx0) - 0.2, tx1, ty, zAt(tx1) - 0.2, 0.04, trim)); parts.push(ball(0.07, trim, (tx0 + tx1) / 2, ty - 0.12, zAt((tx0 + tx1) / 2) - 0.24));
    }
  }
  // ---- apex: gold cap, timber pole, gold balls, swallow-tail pennant
  const tipY = eaveY + roofH;
  parts.push(at(flat(new THREE.ConeGeometry(0.34, 0.42, 12), trim), 0, tipY - 0.06, 0)); parts.push(cyl(0.05, 0.1, 1.9, WOODC, 0, tipY + 0.75, 0)); parts.push(ball(0.2, trim, 0, tipY + 0.2, 0)); parts.push(ball(0.13, trim, 0, tipY + 1.75, 0));
  parts.push(pennant(0.05, tipY + 1.62, 0, 1.7, 0.7, A, B, 0.4));
  // ---- guy ropes: one per rib, sagging a little, to a peg in the ground
  for (let k = 0; k < stripes; k++) {
    const th = (k + 0.5) * WA, Rp = Re + 2.6, sx = Math.sin(th), cz = Math.cos(th), N = 5;
    const pt = (u) => [sx * (Re + (Rp - Re) * u), (eaveY - 0.3) * (1 - u) + 0.14 * u - 0.12 * Math.sin(Math.PI * u), cz * (Re + (Rp - Re) * u)];
    for (let j = 0; j < N; j++) { const a = pt(j / N), b = pt((j + 1) / N); parts.push(rod(a[0], a[1], a[2], b[0], b[1], b[2], 0.03, ROPE)); }
    parts.push(rod(sx * Rp, 0.0, cz * Rp, sx * (Rp + 0.14), 0.42, cz * (Rp + 0.14), 0.06, WOODC));
  }
  return withUV(mergeGeometries(parts, false), { Re, roofH, tipY, seam: 0.5 * WA });
}

// ---- long marquee (ridge tent) --------------------------------------------------------------------------------------------------------------------------
// ridge along x, door on the gable at -x (so a yaw of 0 faces -x; the camp turns it toward the army)
export function marqueeGeo(o = {}) {
  const { A = 0x23406f, B = 0xeee6d0, wall = 0xdcd2b8, trim = GOLD, hw = 3.3, L = 12, wallH = 1.8, ridgeH = 3.1, bands = 12 } = o;
  const parts = [], S = (i) => -L / 2 + (L * i) / bands;
  const roofY = (v, s) => wallH + ridgeH * Math.pow(v, 1.1) + 0.14 * Math.sin(Math.PI * v) * (1 - Math.pow((2 * s) / L, 2));
  const NV = 4;
  for (const sg of [-1, 1]) for (let i = 0; i < bands; i++) for (let j = 0; j < NV; j++) {
    const v0 = j / NV, v1 = (j + 1) / NV, s0 = S(i), s1 = S(i + 1);
    const p = (s, v) => [s, roofY(v, s), sg * hw * (1 - v) * 1.06];
    const col = (i & 1) ? B : A;
    parts.push(sg > 0 ? quad(p(s0, v0), p(s1, v0), p(s1, v1), p(s0, v1), col) : quad(p(s0, v0), p(s0, v1), p(s1, v1), p(s1, v0), col));
  }
  // walls (low, cream) and gable ends
  for (const sg of [-1, 1]) parts.push(sg > 0 ? quad([-L / 2, 0, hw], [L / 2, 0, hw], [L / 2, wallH + 0.03, hw], [-L / 2, wallH + 0.03, hw], wall) : quad([-L / 2, 0, -hw], [-L / 2, wallH + 0.03, -hw], [L / 2, wallH + 0.03, -hw], [L / 2, 0, -hw], wall));
  for (const sx of [-1, 1]) {
    const x = sx * L / 2 * 0.995;
    parts.push(quad([x, 0, -hw], [x, 0, hw], [x, wallH + 0.03, hw], [x, wallH + 0.03, -hw], wall));
    parts.push(sx > 0 ? tri([[x, wallH, -hw], [x, wallH, hw], [x, wallH + ridgeH * 0.995, 0]], wall) : tri([[x, wallH, hw], [x, wallH, -hw], [x, wallH + ridgeH * 0.995, 0]], wall));
  }
  // scalloped eaves + gold ridge
  for (const sg of [-1, 1]) for (let i = 0; i < bands; i++) {
    const s0 = S(i) + 0.04, s1 = S(i + 1) - 0.04, sm = (s0 + s1) / 2, z = sg * hw * 1.06, col = (i & 1) ? B : A;
    parts.push(tri([[s0, wallH - 0.03, z], [s1, wallH - 0.03, z], [sm, wallH - 0.85, z * 0.97]], col));
  }
  parts.push(box(L + 0.3, 0.16, 0.22, trim, 0, wallH + ridgeH + 0.02, 0));
  // door at -x: dark opening + flaps
  const dx = -L / 2 - 0.04;
  parts.push(box(0.12, 1.9, 1.9, DOOR, dx, 0.96, 0));
  for (const e of [-1, 1]) parts.push(box(0.1, 2.0, 0.8, wall, dx - 0.2, 1.0, e * 1.25, 0, 0));
  // standards at both ends: pole + gold ball + pennant
  for (const sx of [-1, 1]) {
    const x = sx * (L / 2 + 0.2), top = wallH + ridgeH + 1.9;
    parts.push(cyl(0.05, 0.09, top, WOODC, x, top / 2, 0)); parts.push(ball(0.15, trim, x, top, 0));
    parts.push(pennant(x, top - 0.25, 0, 1.6, 0.7, A, B, sx > 0 ? 0 : Math.PI));
  }
  // ropes + pegs at the four corners and mid-length
  for (const sg of [-1, 1]) for (const sx of [-1, -0.5, 0, 0.5, 1]) {
    const s = sx * L / 2 * 0.96, z = sg * hw * 1.07;
    parts.push(rod(s, wallH - 0.1, z, s, 0.1, sg * (hw + 2.4), 0.03, ROPE)); parts.push(cyl(0.05, 0.07, 0.42, WOODC, s, 0.16, sg * (hw + 2.4)));
  }
  return mergeGeometries(parts, false);
}
