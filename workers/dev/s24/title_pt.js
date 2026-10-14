// PATH-TRACED loading title: "Blue Wall" as real 3D letters (Cormorant Garamond 700) — deep sapphire lacquer faces over a metallic flake,
// black-chrome bevels and sides; lit by a real HDRI (pedestrian_overpass, CC0 Poly Haven) plus a key and a cool rim. Transparent background.
//   ?w=2000&h=420&spp=200
import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { WebGLPathTracer } from 'three-gpu-pathtracer';
import * as opentype from '/tmp/fnt/node_modules/opentype.js/dist/opentype.mjs';
const Q = new URLSearchParams(location.search), W = +(Q.get('w') || 2000), H = +(Q.get('h') || 420), SPP = +(Q.get('spp') || 128), TEXT = Q.get('t') || 'Blue Wall';
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function flakeTex(n = 512) {          // metallic flake under the lacquer: a fine random normal map
  const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), im = g.createImageData(n, n);
  for (let i = 0; i < n * n; i++) { const a = rnd() * 6.283, k = rnd() * 0.35; im.data[i * 4] = 128 + Math.cos(a) * k * 127; im.data[i * 4 + 1] = 128 + Math.sin(a) * k * 127; im.data[i * 4 + 2] = 255; im.data[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.08, 0.08); return t;
}
(async () => {
  const font = opentype.parse(await (await fetch('/s23/fonts/corm700.woff')).arrayBuffer());
  const path = font.getPath(TEXT, 0, 0, 100, { kerning: true });
  const sp = new THREE.ShapePath();
  for (const c of path.commands) {
    if (c.type === 'M') sp.moveTo(c.x, -c.y); else if (c.type === 'L') sp.lineTo(c.x, -c.y);
    else if (c.type === 'Q') sp.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y); else if (c.type === 'C') sp.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
  }
  const shapes = sp.toShapes(false);
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: 11, bevelEnabled: true, bevelThickness: 3.6, bevelSize: 2.7, bevelOffset: 0, bevelSegments: 8, curveSegments: 16 });
  geo.computeBoundingBox(); const bb = geo.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2; geo.translate(-cx, -cy, 0);
  // one geometry per material group (faces / bevels+sides)
  const n = geo.toNonIndexed(), parts = [];
  for (const gr of geo.groups) { const sub = new THREE.BufferGeometry(); for (const k in n.attributes) { const a = n.attributes[k]; sub.setAttribute(k, new THREE.BufferAttribute(a.array.slice(gr.start * a.itemSize, (gr.start + gr.count) * a.itemSize), a.itemSize)); } (parts[gr.materialIndex] = parts[gr.materialIndex] || []).push(sub); }
  const merge = (list) => { if (list.length === 1) return list[0]; const o = new THREE.BufferGeometry(); for (const k in list[0].attributes) { const tot = list.reduce((s, g) => s + g.attributes[k].array.length, 0), arr = new Float32Array(tot); let off = 0; for (const g of list) { arr.set(g.attributes[k].array, off); off += g.attributes[k].array.length; } o.setAttribute(k, new THREE.BufferAttribute(arr, list[0].attributes[k].itemSize)); } return o; };
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(W, H); r.setPixelRatio(1);
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = +(Q.get('ex') || 0.95); r.setClearColor(0, 0); document.body.appendChild(r.domElement);
  const scene = new THREE.Scene(); scene.background = null;
  // HDRI, turned by hr (radians) by shifting its columns (the raster version turned an env sphere the same way)
  const hdr = await new HDRLoader().loadAsync('/s23/hdr/' + (Q.get('hdr') || 'pedestrian_overpass_1k') + '.hdr');
  { const { width: w, height: h, data } = hdr.image, ch = data.length / (w * h), sh = Math.round(((+(Q.get('hr') || 0.5)) / (Math.PI * 2)) * w) * (Q.get('flip') === '1' ? -1 : 1), copy = data.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = (y * w + ((x - sh) % w + w) % w) * ch, d = (y * w + x) * ch; for (let c = 0; c < ch; c++) data[d + c] = copy[s + c]; } hdr.needsUpdate = true; }
  hdr.mapping = THREE.EquirectangularReflectionMapping; scene.environment = hdr; scene.environmentIntensity = +(Q.get('hi') || 1);
  const key = new THREE.DirectionalLight(0xffffff, +(Q.get('kl') || 1.2)); key.position.set(-4, 6, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9cc8ff, 1.6); rim.position.set(6, 3, -6); scene.add(rim);
  if (+(Q.get('al') || 0) > 0) {                 // a soft studio strip above and in front: clean highlight bands on the lacquer and the chrome
    const a = new THREE.RectAreaLight(0xffffff, +Q.get('al'), +(Q.get('aw') || 900), +(Q.get('ah') || 80)); a.position.set(+(Q.get('ax') || -150), +(Q.get('ay') || 420), +(Q.get('az') || 520)); a.lookAt(0, 0, 0); scene.add(a); }
  const flake = flakeTex();
  const lacquer = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(Q.get('lc') || '#0a2a8a'), metalness: +(Q.get('mt') || 0.55), roughness: +(Q.get('ro') || 0.28), clearcoat: 1, clearcoatRoughness: 0.015, normalMap: flake, normalScale: new THREE.Vector2(+(Q.get('fl') || 0.45), +(Q.get('fl') || 0.45)) });
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0x1a1d24, metalness: 1, roughness: +(Q.get('rr') || 0.14), clearcoat: 1, clearcoatRoughness: 0.03 });
  const grp = new THREE.Group(); grp.add(new THREE.Mesh(merge(parts[0]), lacquer)); grp.add(new THREE.Mesh(merge(parts[1]), chrome)); grp.rotation.x = -0.22; scene.add(grp);
  const hw = (bb.max.x - bb.min.x) / 2 * 1.1, hh = hw * H / W;
  const fov = 9, dist = hh / Math.tan(fov / 2 * Math.PI / 180); const cam = new THREE.PerspectiveCamera(fov, W / H, 1, 5000); cam.position.set(0, -dist * 0.1, dist); cam.lookAt(0, 0, 0);
  if (Q.get('raster') === '1') { r.render(scene, cam); window.__done = true; return; }
  const pt = new WebGLPathTracer(r); pt.bounces = +(Q.get('b') || 6); pt.filterGlossyFactor = +(Q.get('fg') || 0.3); pt.multipleImportanceSampling = true; pt.dynamicLowRes = false; pt.minSamples = 1; pt.fadeDuration = 0; pt.renderDelay = 0;
  pt.tiles.set(+(Q.get('tx') || 2), +(Q.get('ty') || 1));
  pt.setScene(scene, cam);
  const t0 = performance.now(); window.__spp = 0; const gl = r.getContext(), px = new Uint8Array(4);
  const step = () => { pt.renderSample(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); window.__spp = pt.samples; window.__ms = performance.now() - t0; if (pt.samples < SPP) setTimeout(step, 0); else window.__done = true; };
  step();
})();
