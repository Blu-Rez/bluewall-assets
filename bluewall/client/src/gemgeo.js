// Real cut-gem geometry (procedural, flat-faceted) shared by the in-world gems (vault piles, carts, giant gem over each mine)
// and by the offline icon renderer (tools/gem_icons): ruby = round brilliant, emerald = step ("emerald") cut, turquoise = hexagonal brilliant.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const CACHE = {};

// build a closed convex solid from triangles; every triangle is wound to look away from the centre -> flat facets.
// Each facet also gets a baked stylised-lighting colour (key + fill light, facet-to-facet variation, a few white sparkle facets):
// that is what makes a low-poly cut read as a glittering gem without any texture or per-pixel work.
const KEY = new THREE.Vector3(-0.45, 0.85, 0.5).normalize(), FILL = new THREE.Vector3(0.7, 0.15, -0.4).normalize();
function solid(tris, look) {
  const pos = new Float32Array(tris.length * 9), col = new Float32Array(tris.length * 9);
  const deep = new THREE.Color(look.deep), body = new THREE.Color(look.body), c = new THREE.Color(), white = new THREE.Color(1, 1, 1), n = new THREE.Vector3();
  let o = 0;
  tris.forEach(([a, b, cc], f) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = cc[0] - a[0], vy = cc[1] - a[1], vz = cc[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const mx = (a[0] + b[0] + cc[0]) / 3, my = (a[1] + b[1] + cc[1]) / 3, mz = (a[2] + b[2] + cc[2]) / 3;
    const flip = nx * mx + ny * my + nz * mz < 0, p = flip ? [a, cc, b] : [a, b, cc];
    n.set(nx, ny, nz).multiplyScalar(flip ? -1 : 1).normalize();
    const h = Math.abs(Math.sin(f * 91.7 + 3.1) * 437.58) % 1;
    let sh = 0.26 + 0.66 * Math.pow(Math.max(0, n.dot(KEY)), 0.9) + 0.28 * Math.pow(Math.max(0, n.dot(FILL)), 1.5) + (h - 0.5) * 0.26;
    if (n.y < -0.1) sh += 0.16 * Math.abs(Math.sin(f * 2.3));            // pavilion facets catch light from inside
    c.copy(deep).lerp(body, Math.min(1, Math.max(0, sh)));
    if (sh > 1) c.lerp(white, Math.min(0.75, (sh - 1) * 1.6));
    else if (h > 0.9) c.lerp(white, 0.45);                              // sparkle facets
    for (const v of p) { pos[o] = v[0]; pos[o + 1] = v[1]; pos[o + 2] = v[2]; col[o] = c.r; col[o + 1] = c.g; col[o + 2] = c.b; o += 3; }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  g.computeBoundingSphere(); return g;
}
const ring = (n, r, y, off, sx = 1, sz = 1) => Array.from({ length: n }, (_, i) => { const a = ((i + off) / n) * TAU; return [Math.cos(a) * r * sx, y, Math.sin(a) * r * sz]; });

// round / n-gonal brilliant: table, star facets, kite facets, girdle, pavilion mains, culet
function brilliant(n, look, o = {}) {
  const { table = 0.56, crown = 0.34, star = 0.8, girdle = 0.06, pav = 0.82, lower = 0.58 } = o;
  const T = ring(n, table, crown, 0), S = ring(n, star, crown * 0.7, 0.5), G1 = ring(n, 1, girdle, 0), G2 = ring(n, 1, -girdle, 0), P = ring(n, lower, -pav * 0.5, 0.5);
  const C = [0, -pav, 0], TC = [0, crown, 0], tris = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    tris.push([TC, T[i], T[j]]);                                    // table
    tris.push([T[i], T[j], S[i]], [T[j], S[j], S[i]]);              // star facets
    tris.push([S[i], S[j], G1[j]], [G1[i], G1[j], S[i]]);           // kites to the girdle
    tris.push([G1[i], G1[j], G2[j]], [G1[i], G2[j], G2[i]]);        // girdle band
    tris.push([G2[i], G2[j], P[i]], [G2[j], P[j], P[i]]);           // lower girdle
    tris.push([P[i], P[j], C]);                                     // pavilion mains
  }
  return solid(tris, look);
}
// rectangular step cut: 8-sided rings (clipped corners) stepping up to a flat table and down to a keel
function stepCut(look, o = {}) {
  const sx = 0.92, sz = 0.7, oct = (s, y0) => { const y = y0 * 1.22; return [[1, 0.52], [0.52, 1], [-0.52, 1], [-1, 0.52], [-1, -0.52], [-0.52, -1], [0.52, -1], [1, -0.52]].map(([a, b]) => [a * s * sx, y, b * s * sz]); };
  const R = [oct(0.58, 0.36), oct(0.76, 0.27), oct(0.9, 0.15), oct(1, 0.07), oct(1, -0.07), oct(0.86, -0.26), oct(0.64, -0.5), oct(0.38, -0.74), oct(0.14, -0.9)];
  void o; const tris = [];
  for (let k = 0; k < R.length - 1; k++) for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; tris.push([R[k][i], R[k][j], R[k + 1][j]], [R[k][i], R[k + 1][j], R[k + 1][i]]); }
  const top = [0, 0.36 * 1.22, 0], bot = [0, -0.9 * 1.22, 0];
  for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; tris.push([top, R[0][i], R[0][j]]); tris.push([bot, R[R.length - 1][j], R[R.length - 1][i]]); }
  return solid(tris, look);
}

export function gemGeometry(kind) {
  if (CACHE[kind]) return CACHE[kind];
  const look = GEM_LOOK[kind];
  if (kind === 'sap') return (CACHE[kind] = brilliant(4, look, { table: 0.6, crown: 0.52, star: 0.88, pav: 1.25, lower: 0.5, girdle: 0.07 }));                 // a diamond-shaped (kite) cut
  if (kind === 'onyx') return (CACHE[kind] = brilliant(10, look, { table: 0.5, crown: 0.4, star: 0.84, pav: 0.95, lower: 0.6 }));                          // a many-faceted round cut
  const g = kind === 'ruby' ? brilliant(8, look, { crown: 0.5, pav: 1.12, table: 0.6, star: 0.82, lower: 0.56 }) : kind === 'emerald' ? stepCut(look) : brilliant(6, look, { table: 0.52, crown: 0.5, star: 0.8, pav: 1.25, lower: 0.5 });
  return (CACHE[kind] = g);
}

// natural crystal: hexagonal prism that tapers into a faceted point (base at y=0, ~3.5 tall, radius 1); used for the veins / clusters growing out of the mine rock
export function crystalGeometry(kind) {
  const key = kind + '_cr'; if (CACHE[key]) return CACHE[key];
  const n = 6, Bt = ring(n, 1, 0, 0), T = ring(n, 0.9, 2.3, 0), S = ring(n, 0.5, 3.0, 0.5), A = [0, 3.7, 0], tris = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    tris.push([Bt[i], Bt[j], T[j]], [Bt[i], T[j], T[i]]);              // body
    tris.push([T[i], T[j], S[i]], [T[j], S[j], S[i]]);                 // shoulder facets
    tris.push([A, S[i], S[j]]);                                        // point
  }
  return (CACHE[key] = solid(tris, GEM_LOOK[kind]));
}

// colours per gem: body, deep (back-face / inner tint), glow (emissive + light)
export const GEM_LOOK = {
  ruby: { body: 0xe0183f, deep: 0x7a0620, glow: 0xff3a5c, spark: '#ffd0d8' },
  emerald: { body: 0x12c06a, deep: 0x04582f, glow: 0x3dff94, spark: '#d4ffe8' },
  turq: { body: 0x1fb4e8, deep: 0x0a4f9a, glow: 0x4ae8ff, spark: '#dcf8ff' },
  // the two special gems (never mined, no vault): the deep-blue sapphire (bought only) and the black onyx (bought, or won as a prize)
  sap: { body: 0x1742d2, deep: 0x030a48, glow: 0x4d7dff, spark: '#d6e4ff' },
  onyx: { body: 0x1c2130, deep: 0x000102, glow: 0xc4d4ff, spark: '#f2f6ff' },
};

// facet-lit material for every in-world gem: baked facet colours + glossy env reflection (instancing friendly, one draw call per kind)
// every gem reflects ONE fixed studio environment (set by world.js: softboxes + dark room), not the moving sky: with the sky the facets turned
// milky-white or black depending on the camera angle; a fixed jewel-box environment gives the same crisp glints from every side
// the jewel-box environment: a dark blue room with a few crisp light panels (one big softbox, two cool strips, a back light, a blue floor bounce)
export function jewelEnvironment(pmrem) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x0b1d46).multiplyScalar(0.9), side: THREE.BackSide })));
  const panel = (w, h, pos, col, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(i), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m); };
  panel(34, 22, [-22, 36, 18], 0xffffff, 5.0); panel(8, 44, [42, 12, 8], 0xbfe9ff, 4.0); panel(8, 44, [-40, 6, -20], 0xa8d4ff, 3.0); panel(30, 8, [0, 10, -44], 0xdfeeff, 3.0); panel(40, 40, [0, -40, 0], 0x1f4fb0, 1.1); panel(10, 10, [20, 30, -28], 0xffffff, 6.0);
  const rt = pmrem.fromScene(s, 0.01, 0.1, 100, { size: 128 });
  s.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return rt.texture;
}
const ALL = new Set(); let GEM_ENV = null;
export function setGemEnv(tex) { GEM_ENV = tex; for (const m of ALL) { m.envMap = tex; m.needsUpdate = true; } }
export function gemMaterial(kind, { envMapIntensity = 1.5, glow = 0.22 } = {}) {
  const L = GEM_LOOK[kind];
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.1, metalness: 0.2, emissive: L.glow, emissiveIntensity: glow, envMapIntensity });
  if (GEM_ENV) m.envMap = GEM_ENV; ALL.add(m); return m;
}
export const gemPileMaterial = (kind) => gemMaterial(kind, { envMapIntensity: 1.3, glow: 0.3 });
// kept for the icon renderer (glassy two-layer variant)
export function gemMaterials(kind, o = {}) { const m = gemMaterial(kind, o); return { front: m, back: null }; }
