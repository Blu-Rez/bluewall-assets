// Kitchen gardens of the hamlets (p22 "scatter"): from the top-down camera the farmhouses stood alone on the grass like boxes; now each
// hamlet has one or two fenced plots behind its houses — dark tilled soil, rows of greens (season-coloured), a split-rail fence on posts.
// All hamlets in ONE static mesh (vertex colours, no texture): one draw call, ~350 triangles a plot.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './noise.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function piece(geo, color, x, y, z, ry, sx, sy, sz, rx = 0, rz = 0) {
  const g = (geo.index ? geo.toNonIndexed() : geo.clone());
  g.applyMatrix4(_m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s.set(sx, sy, sz)));
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  const c = new THREE.Color(color), n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
const BOX = new THREE.BoxGeometry(1, 1, 1);
const ROW = (() => { const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 4, 1); g.rotateZ(Math.PI / 2); g.rotateX(Math.PI / 4); g.scale(1, 0.7, 1); return g; })();   // a low ridge of leaves along x

// plots: [{ x, z, ry, w, d }] — ok(x, z): may a plot corner stand here
export function planGardens(hamlets, ok) {
  const r = rng(6161), out = [];
  for (const H of hamlets) {
    let n = 0;
    for (const h of H.houses) {
      if (n >= 2 || r() < 0.35) continue;
      // behind the house (away from the green), turned like it
      const ux = h.x - H.x, uz = h.z - H.z, l = Math.hypot(ux, uz) || 1, back = Math.max(h.w, h.d) * 0.5 + 4.2;
      const w = 6 + r() * 2.5, d = 4.5 + r() * 1.5, x = h.x + ux / l * (back + d * 0.5), z = h.z + uz / l * (back + d * 0.5), ry = Math.atan2(ux, uz);
      const c = Math.cos(ry), s = Math.sin(ry), corners = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([a, b]) => [x + a * c + b * s, z - a * s + b * c]);
      if (!corners.every(([cx, cz]) => ok(cx, cz)) || !ok(x, z)) continue;
      if (H.houses.some((o) => o !== h && Math.hypot(o.x - x, o.z - z) < Math.max(o.w, o.d) * 0.5 + Math.max(w, d) * 0.5 + 1.5)) continue;
      if (out.some((g) => Math.hypot(g.x - x, g.z - z) < 10)) continue;
      out.push({ x, z, ry, w, d }); n++;
    }
  }
  return out;
}

export function buildGardens(scene, plots, height, { season = null, autumn = 0, winter = 0 } = {}) {
  if (!plots.length) return null;
  const r = rng(7171), parts = [];
  const crops = ['#4f8a34', '#5f9a3a', '#3f7a3a', '#7aa04a'].map((c) => new THREE.Color(c).lerp(new THREE.Color('#9a8a3a'), autumn * 0.5).lerp(new THREE.Color('#dfe5ec'), winter * 0.85).getHex());
  const soil = new THREE.Color('#5c4330').lerp(new THREE.Color('#e4e8ee'), winter * 0.9).getHex();          // (in winter the beds lie under the snow)
  for (const P of plots) {
    const c = Math.cos(P.ry), s = Math.sin(P.ry), W = (a, b) => [P.x + a * c + b * s, P.z - a * s + b * c];
    let y0 = 1e9, y1 = -1e9; for (const [a, b] of [[0, 0], [-P.w / 2, -P.d / 2], [P.w / 2, -P.d / 2], [P.w / 2, P.d / 2], [-P.w / 2, P.d / 2]]) { const h = height(...W(a, b)); y0 = Math.min(y0, h); y1 = Math.max(y1, h); }
    // tilled soil (a low raised bed, sunk on the low side), furrows across it
    const [cx, cz] = W(0, 0), top = y1 + 0.08;                                     // (the bed's top sits just above the highest corner)
    parts.push(piece(BOX, soil, cx, (y0 + top) / 2 - 0.15, cz, P.ry, P.w, top - y0 + 0.3, P.d));
    const rows = Math.max(3, Math.floor((P.d - 0.8) / 0.75));
    for (let k = 0; k < rows; k++) {
      const b = -P.d / 2 + 0.55 + k * (P.d - 1.1) / Math.max(1, rows - 1), [rx, rz] = W(0, b), len = P.w - 1.0 - r() * 0.4;
      if (r() < 0.12) continue;                                                      // a row already harvested
      parts.push(piece(ROW, crops[(r() * crops.length) | 0], rx, top + 0.06, rz, P.ry, len, 0.34 + r() * 0.14, 0.55 + r() * 0.12));
    }
    // split-rail fence: posts every ~1.6 m, two rails, a gap for the gate on the house side
    const fence = (a0, b0, a1, b1, gate) => {
      const L0 = Math.hypot(a1 - a0, b1 - b0), n = Math.max(2, Math.round(L0 / 1.6));
      for (let i = 0; i <= n; i++) {
        const t = i / n, a = a0 + (a1 - a0) * t, b = b0 + (b1 - b0) * t; if (gate && Math.abs(t - 0.5) < 0.12) continue;
        const [px, pz] = W(a, b); parts.push(piece(BOX, '#6b4a30', px, height(px, pz) + 0.45, pz, P.ry + r() * 0.3, 0.16, 1.0 + r() * 0.15, 0.16));
      }
      const ang = Math.atan2(a1 - a0, b1 - b0) - Math.PI / 2;
      for (const [y, seg] of [[0.42, gate], [0.78, gate]]) {
        const pieces = seg ? [[0, 0.38], [0.62, 1]] : [[0, 1]];
        for (const [t0, t1] of pieces) {
          const am = a0 + (a1 - a0) * (t0 + t1) / 2, bm = b0 + (b1 - b0) * (t0 + t1) / 2, [px, pz] = W(am, bm);
          parts.push(piece(BOX, '#8a6a48', px, height(px, pz) + y, pz, P.ry + ang, L0 * (t1 - t0), 0.09, 0.09));
        }
      }
    };
    const hw = P.w / 2 + 0.25, hd = P.d / 2 + 0.25;
    fence(-hw, -hd, hw, -hd, true); fence(hw, -hd, hw, hd, false); fence(hw, hd, -hw, hd, false); fence(-hw, hd, -hw, -hd, false);
  }
  const geo = mergeGeometries(parts, false); parts.forEach((g) => g.dispose());
  geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, envMapIntensity: 0.3 }));
  mesh.name = 'sc_gardens'; mesh.castShadow = false; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false;
  scene.add(mesh);
  return mesh;
}
