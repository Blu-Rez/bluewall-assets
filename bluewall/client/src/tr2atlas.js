// TR2-S4a — texture atlas for Tripo models: the textures of a family of models (all houses, all civic buildings + their props) are packed into ONE canvas texture and the UVs of the
// geometry are re-mapped, so every house / civic building of the town is ONE material = one draw call per chunk (instead of one per model texture: 16 + 10).  The atlas pixels are the
// models' own textures (no recolour, no repaint); each tile gets a few pixels of its own edge as padding so mip levels do not bleed a neighbour in.  Same material configuration as
// tr2lib.js (MeshStandardMaterial + map, vertexColors) => +0 programs.  A model whose UVs leave 0..1 cannot be tiled: it keeps its own material (own draw call) and is reported.
import * as THREE from 'three';
import { tr2Material } from './tr2lib.js';

// 'house_cottage_0|w6.6' -> { spec: 'house_cottage_0', o: { w: 6.6 } }   (the piece names of b2_homes / b3_civic: `spec` or `spec|<w|h|k><number>`)
export function specOf(n) {
  const i = n.indexOf('|'); if (i < 0) return { spec: n, o: {} };
  const t = n.slice(i + 1); return { spec: n.slice(0, i), o: { [t[0]]: +t.slice(1) } };
}
export const fileOfSpec = (spec) => { const i = spec.indexOf('/'); return i < 0 ? spec : spec.slice(0, i); };
// TR2-S4a-R2: `<model>_lo` = the lo copy of a model (lod_geo.mjs: the same vertices simplified to ~ 40 % of the triangles, the FULL model's UVs; the lo file's own texture is an 8 x 8 dummy).  A lo piece takes the full
// model's atlas tile, its scale (`w` / `h` of the piece name are the full model's) and its yaw — so hi and lo cells use the SAME material (one atlas, no second texture).
export const isLo = (spec) => /_lo$/.test(spec);
export const hiOf = (spec) => spec.slice(0, -3);

// tr2 = the tr2lib object (models of `specs` already loaded);  specs = [piece names]
export function buildAtlas(tr2, names, { pad = 6, width = 2048, name = 'atlas' } = {}) {
  const imgs = new Map();
  for (const n of names) { const { spec, o } = specOf(n); if (isLo(spec)) continue; for (const p of tr2.parts(spec, o)) { const t = p.material.map; if (t && t.image && !imgs.has(t)) imgs.set(t, { t, w: t.image.width, h: t.image.height }); } }
  const list = [...imgs.values()].sort((a, b) => b.h - a.h || b.w - a.w);
  let x = 0, y = 0, rowH = 0;
  for (const it of list) {
    const bw = it.w + pad * 2, bh = it.h + pad * 2;
    if (x + bw > width) { x = 0; y += rowH; rowH = 0; }
    it.x = x + pad; it.y = y + pad; x += bw; rowH = Math.max(rowH, bh);
  }
  const H = y + rowH, cv = document.createElement('canvas'); cv.width = width; cv.height = H;
  const c = cv.getContext('2d'), rects = new Map();
  for (const it of list) {
    const im = it.t.image, { x: X, y: Y, w, h } = it;
    c.drawImage(im, 0, 0, w, h, X, Y, w, h);
    c.drawImage(im, 0, 0, 1, h, X - pad, Y, pad, h); c.drawImage(im, w - 1, 0, 1, h, X + w, Y, pad, h);                 // edge padding: the outermost pixel row / column repeated
    c.drawImage(im, 0, 0, w, 1, X, Y - pad, w, pad); c.drawImage(im, 0, h - 1, w, 1, X, Y + h, w, pad);
    c.drawImage(im, 0, 0, 1, 1, X - pad, Y - pad, pad, pad); c.drawImage(im, w - 1, 0, 1, 1, X + w, Y - pad, pad, pad);
    c.drawImage(im, 0, h - 1, 1, 1, X - pad, Y + h, pad, pad); c.drawImage(im, w - 1, h - 1, 1, 1, X + w, Y + h, pad, pad);
    rects.set(it.t, [X / width, Y / H, w / width, h / H]);
  }
  const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  const material = tr2Material(tex); material.name = 'tr2-' + name; material.userData.atlas = name;
  const CACHE = new Map(), loose = new Set();
  // parts(piece name) -> [{ geometry (own copy, atlas UVs, attributes position / normal / uv / color, indexed), material }]  (never mutated afterwards: callers clone + transform)
  function get(n) {
    let hit = CACHE.get(n); if (hit) return hit;
    const { spec, o } = specOf(n), lo = isLo(spec), hs = lo ? hiOf(spec) : spec, out = [];
    const full = tr2.parts(hs, o);                                                       // (the full model: its texture tile, its scale and yaw)
    const src = lo ? tr2.parts(spec, { ry: tr2.rec(hs).ry || 0, k: tr2.info(hs, o).k }) : full;
    src.forEach((p, i) => {
      const ref = full[Math.min(i, full.length - 1)], r = rects.get(ref.material.map), g = new THREE.BufferGeometry();
      for (const a of ['position', 'normal', 'uv', 'color']) if (p.geometry.attributes[a]) g.setAttribute(a, p.geometry.attributes[a].clone());
      if (p.geometry.index) g.setIndex(p.geometry.index.clone()); else g.setIndex(Array.from({ length: g.attributes.position.count }, (_, k) => k));
      let ok = !!r; const uv = g.attributes.uv;
      if (ok) for (let k = 0; k < uv.count; k++) { const u = uv.getX(k), v = uv.getY(k); if (u < -0.02 || u > 1.02 || v < -0.02 || v > 1.02) { ok = false; break; } }
      if (ok) { for (let k = 0; k < uv.count; k++) uv.setXY(k, r[0] + Math.min(1, Math.max(0, uv.getX(k))) * r[2], r[1] + Math.min(1, Math.max(0, uv.getY(k))) * r[3]); out.push({ geometry: g, material }); }
      else { loose.add(n); out.push({ geometry: p.geometry.index ? p.geometry : g, material: ref.material }); }
    });
    CACHE.set(n, out); return out;
  }
  return { material, texture: tex, get, loose, size: [width, H], texMB: +(width * H * 4 * (4 / 3) / 1048576).toFixed(1), rects, dispose() { tex.dispose(); material.dispose(); for (const v of CACHE.values()) for (const p of v) p.geometry.dispose(); CACHE.clear(); } };
}
