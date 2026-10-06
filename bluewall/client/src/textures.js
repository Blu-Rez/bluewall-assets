// Procedural canvas textures — no image files needed.
import * as THREE from 'three';
import { drawCrest, normEmblem } from './emblems.js';
import { rng } from './noise.js';

function canvas(w, h = w) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function tex(c, { srgb = true, repeat = true, aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  t.needsUpdate = true;
  return t;
}
// height (Float32Array w*h, 0..1) -> tangent-space normal map
function normalFromHeight(hgt, w, h, strength = 2.5) {
  const [c, g] = canvas(w, h), img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const xl = hgt[y * w + ((x - 1 + w) % w)], xr = hgt[y * w + ((x + 1) % w)];
    const yu = hgt[((y - 1 + h) % h) * w + x], yd = hgt[((y + 1) % h) * w + x];
    let nx = (xl - xr) * strength, ny = (yd - yu) * strength, nz = 1;
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = (y * w + x) * 4;
    d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = (nz * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return tex(c, { srgb: false });
}
function speckle(g, w, h, r, n, a0, a1, light = true) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = light ? `rgba(255,255,255,${a0 + r() * (a1 - a0)})` : `rgba(0,0,0,${a0 + r() * (a1 - a0)})`;
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}

// Stone bricks (walls, towers, keep). Returns {map, normalMap}.
export function stoneTextures(seed = 3, tint = [112, 118, 132], mortar = '#2a2c33', rowH = 32) {
  const W = 512, r = rng(seed), [c, g] = canvas(W);
  const hgt = new Float32Array(W * W);
  g.fillStyle = mortar; g.fillRect(0, 0, W, W);
  for (let y = 0, row = 0; y < W; y += rowH, row++) {
    let x = -((row % 2) * 30) - r() * 20;
    while (x < W) {
      const bw = 44 + r() * 52, m = 3;
      const k = 0.78 + r() * 0.34, warm = r() * 10 - 5;
      const col = `rgb(${tint[0] * k + warm | 0},${tint[1] * k | 0},${tint[2] * k - warm | 0})`;
      const draw = (ox) => {
        const x0 = x + m + ox, y0 = y + m, w = bw - 2 * m, h = rowH - 2 * m;
        const gr = g.createLinearGradient(0, y0, 0, y0 + h);
        gr.addColorStop(0, col); gr.addColorStop(1, `rgba(0,0,0,0.25)`);
        g.fillStyle = col; roundRect(g, x0, y0, w, h, 4); g.fill();
        g.fillStyle = gr; roundRect(g, x0, y0, w, h, 4); g.fill();
        for (let yy = Math.max(0, y0 | 0); yy < Math.min(W, y0 + h); yy++)
          for (let xx = Math.max(0, x0 | 0); xx < Math.min(W, x0 + w); xx++) {
            const ex = Math.min(xx - x0, x0 + w - xx), ey = Math.min(yy - y0, y0 + h - yy);
            const e = Math.min(1, Math.min(ex, ey) / 5);
            hgt[yy * W + xx] = 0.55 + 0.45 * e;
          }
      };
      draw(0); if (x + bw > W) draw(-W); if (x < 0) draw(W);
      x += bw;
    }
  }
  speckle(g, W, W, r, 9000, 0.03, 0.10, true);
  speckle(g, W, W, r, 9000, 0.04, 0.16, false);
  // cracks
  g.strokeStyle = 'rgba(10,10,14,0.35)'; g.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    let x = r() * W, y = r() * W; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 18; y += (r() - 0.5) * 18; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < hgt.length; i++) hgt[i] += (r() - 0.5) * 0.06;
  return { map: tex(c, { aniso: 8 }), normalMap: normalFromHeight(hgt, W, W, 3.0) };
}
function roundRect(g, x, y, w, h, rr) {
  g.beginPath(); g.moveTo(x + rr, y); g.arcTo(x + w, y, x + w, y + h, rr); g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr); g.arcTo(x, y, x + w, y, rr); g.closePath();
}

// Roof tiles (white-ish; tinted by material color). {map, normalMap}
export function roofTextures(seed = 5) {
  const W = 256, r = rng(seed), [c, g] = canvas(W), hgt = new Float32Array(W * W);
  g.fillStyle = '#6d6d72'; g.fillRect(0, 0, W, W);
  const th = 16, tw = 21;
  for (let y = 0, row = 0; y < W; y += th, row++) {
    for (let x = -(row % 2) * tw / 2; x < W; x += tw) {
      const k = 190 + r() * 55 | 0;
      const gr = g.createLinearGradient(0, y, 0, y + th);
      gr.addColorStop(0, `rgb(${k},${k},${k})`); gr.addColorStop(1, `rgb(${k * 0.55 | 0},${k * 0.55 | 0},${k * 0.58 | 0})`);
      g.fillStyle = gr; g.beginPath();
      g.moveTo(x + 1, y); g.lineTo(x + tw - 1, y); g.lineTo(x + tw - 1, y + th * 0.6);
      g.quadraticCurveTo(x + tw / 2, y + th + 2, x + 1, y + th * 0.6); g.closePath(); g.fill();
      for (let yy = y; yy < Math.min(W, y + th); yy++) for (let xx = Math.max(0, x | 0); xx < Math.min(W, x + tw); xx++)
        hgt[yy * W + xx] = (yy - y) / th;
    }
  }
  speckle(g, W, W, r, 2500, 0.03, 0.12, false);
  return { map: tex(c), normalMap: normalFromHeight(hgt, W, W, 1.6) };
}

export function plasterTexture(seed = 9) {
  const W = 256, r = rng(seed), [c, g] = canvas(W);
  g.fillStyle = '#d9cdb6'; g.fillRect(0, 0, W, W);
  for (let i = 0; i < 400; i++) {
    const x = r() * W, y = r() * W, rad = 6 + r() * 26;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const a = 0.05 + r() * 0.08; gr.addColorStop(0, `rgba(120,100,70,${a})`); gr.addColorStop(1, 'rgba(120,100,70,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  speckle(g, W, W, r, 5000, 0.03, 0.1, false);
  return tex(c);
}

export function woodTexture(seed = 11, base = [110, 76, 48]) {
  const W = 256, r = rng(seed), [c, g] = canvas(W);
  g.fillStyle = `rgb(${base[0] * 0.5 | 0},${base[1] * 0.5 | 0},${base[2] * 0.5 | 0})`; g.fillRect(0, 0, W, W);
  for (let x = 0; x < W; x += 32) {
    const k = 0.8 + r() * 0.35;
    g.fillStyle = `rgb(${Math.min(255, base[0] * k) | 0},${Math.min(255, base[1] * k) | 0},${Math.min(255, base[2] * k) | 0})`; g.fillRect(x + 1, 0, 30, W);
    g.strokeStyle = 'rgba(40,25,12,0.35)';
    for (let i = 0; i < 7; i++) { g.beginPath(); const xx = x + 3 + r() * 26; g.moveTo(xx, 0); g.bezierCurveTo(xx + 4, W / 3, xx - 4, W * 2 / 3, xx + r() * 4, W); g.stroke(); }
    g.fillStyle = 'rgba(20,12,6,0.6)'; g.fillRect(x, 0, 1.5, W);
  }
  return tex(c);
}

// Tileable grayscale detail for the terrain.
export function detailTexture(seed = 13) {
  const W = 256, r = rng(seed), [c, g] = canvas(W);
  g.fillStyle = '#808080'; g.fillRect(0, 0, W, W);
  const blob = (x, y, rad, a, light) => {
    for (const ox of [-W, 0, W]) for (const oy of [-W, 0, W]) {
      const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
      const col = light ? '255,255,255' : '0,0,0';
      gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gr; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
    }
  };
  for (let i = 0; i < 220; i++) blob(r() * W, r() * W, 8 + r() * 40, 0.10 + r() * 0.12, r() < 0.5);
  speckle(g, W, W, r, 7000, 0.05, 0.2, true); speckle(g, W, W, r, 7000, 0.05, 0.2, false);
  return tex(c, { srgb: false, aniso: 8 });
}

export function glowTexture(inner = 'rgba(255,255,255,1)', size = 128) {
  const [c, g] = canvas(size), h = size / 2;
  const gr = g.createRadialGradient(h, h, 0, h, h, h);
  gr.addColorStop(0, inner); gr.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.55)'));
  gr.addColorStop(0.6, inner.replace(/[\d.]+\)$/, '0.12)')); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return tex(c, { repeat: false });
}

// Glowing rune band — used as emissiveMap on the Blue Wall.
export function runeTexture(seed = 17) {
  const W = 1024, H = 64, [c, g] = canvas(W, H);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const passes = [[10, 'rgba(60,150,255,0.25)'], [5, 'rgba(90,180,255,0.6)'], [2, 'rgba(220,245,255,1)']];
  for (const [lw, col] of passes) {
    g.lineWidth = lw; g.strokeStyle = col;
    const r = rng(seed);                       // same glyphs on every pass
    for (let cx = 20; cx < W - 10;) {
      const x0 = cx - 11, y0 = 12, w = 22, h = 40;
      g.beginPath(); g.moveTo(x0 + w / 2, y0); g.lineTo(x0 + w / 2, y0 + h);
      const n = 1 + (r() * 3 | 0);
      for (let k = 0; k < n; k++) {
        const yy = y0 + r() * h, dir = r() < 0.5 ? -1 : 1;
        g.moveTo(x0 + w / 2, yy); g.lineTo(x0 + w / 2 + dir * w / 2, yy + (r() - 0.5) * 16);
      }
      if (r() < 0.4) { g.moveTo(x0, y0 + h * 0.3); g.lineTo(x0 + w, y0 + h * 0.7); }
      g.stroke();
      cx += 34 + (r() * 10 | 0);
    }
  }
  g.fillStyle = 'rgba(80,170,255,0.9)'; g.fillRect(0, 3, W, 2); g.fillRect(0, H - 5, W, 2);
  const t = tex(c); t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

export function cloudTexture(seed = 19) {
  const W = 256, r = rng(seed), [c, g] = canvas(W);
  for (let i = 0; i < 60; i++) {
    const a = r() * Math.PI * 2, d = r() * 70, x = W / 2 + Math.cos(a) * d * 1.3, y = W / 2 + Math.sin(a) * d * 0.55;
    const rad = 30 + r() * 45, gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  return tex(c, { repeat: false });
}

// ---- every kingdom flies its own crest (picked by the player) on the pennants and the hanging banners
let EMBLEM = 'swords', FLAGT = null, BANNERT = null;
const EMBLEM_L = new Set();
function emblemGlyph(g, cx, cy, size) { drawCrest(g, EMBLEM, cx, cy, size); }
export function setEmblem(e) {
  e = normEmblem(e);
  if (!e || e === EMBLEM) return;
  EMBLEM = e;
  if (FLAGT) { paintFlag(FLAGT.g); FLAGT.t.needsUpdate = true; }
  if (BANNERT) { paintBanner(BANNERT.g); BANNERT.t.needsUpdate = true; }
  for (const f of EMBLEM_L) { try { f(EMBLEM); } catch (err) { console.warn('emblem', err); } }
}
export const getEmblem = () => EMBLEM;
// the cloth of the castle (her_flags.js) repaints its crest atlas through this: f(id) now and on every change
export function onEmblem(f) { EMBLEM_L.add(f); f(EMBLEM); return () => EMBLEM_L.delete(f); }
// Pennant: drawn the way it hangs (pole on the left, point on the right), emblem upright.
function paintFlag(g) {
  const W = 256, H = 168;
  g.clearRect(0, 0, W, H);
  const path = () => { g.beginPath(); g.moveTo(3, 3); g.lineTo(176, 3); g.quadraticCurveTo(210, 28, W - 3, H / 2); g.quadraticCurveTo(210, H - 28, 176, H - 3); g.lineTo(3, H - 3); g.closePath(); };
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2f7fe8'); gr.addColorStop(0.55, '#16489e'); gr.addColorStop(1, '#0c2a64');
  g.fillStyle = gr; path(); g.fill();
  g.strokeStyle = '#cfe8ff'; g.lineWidth = 6; g.lineJoin = 'round'; path(); g.stroke();
  g.strokeStyle = 'rgba(143,211,255,0.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, 14); g.lineTo(172, 14); g.moveTo(14, H - 14); g.lineTo(172, H - 14); g.stroke();
  emblemGlyph(g, 92, 84, 112);
}
export function flagTexture() {
  const [c, g] = canvas(256, 168); paintFlag(g);
  const t = tex(c, { repeat: false }); FLAGT = { g, t };
  return t;
}

export function stripeTexture(a = '#c9b458', b = '#6d8f3a') {
  const [c, g] = canvas(128, 16);
  for (let x = 0; x < 128; x += 16) { g.fillStyle = (x / 16) % 2 ? a : b; g.fillRect(x, 0, 16, 16); }
  return tex(c);
}

// royal crest: shield, three-towered castle, the blue crystal star above
function crest(g, cx, cy, k, light = '#e6f4ff', dark = '#08162e', glow = '#8fd3ff') {
  g.save(); g.translate(cx, cy); g.scale(k, k);
  g.fillStyle = 'rgba(143,211,255,0.18)'; g.beginPath(); g.moveTo(-60, -70); g.lineTo(60, -70); g.lineTo(60, 10); g.quadraticCurveTo(60, 60, 0, 86); g.quadraticCurveTo(-60, 60, -60, 10); g.closePath(); g.fill();
  g.strokeStyle = glow; g.lineWidth = 5; g.stroke();
  g.fillStyle = light;
  g.fillRect(-40, -6, 80, 44);                                   // wall
  for (const x of [-40, -12, 22]) g.fillRect(x, -30, 18, 30);    // towers
  for (const x of [-40, -12, 22]) for (let i = 0; i < 3; i++) g.fillRect(x + i * 7, -38, 4, 9);
  g.fillStyle = dark; g.beginPath(); g.moveTo(-9, 38); g.lineTo(-9, 20); g.arc(0, 20, 9, Math.PI, 0); g.lineTo(9, 38); g.fill();
  g.fillStyle = glow; g.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 6 : 15; g.lineTo(Math.cos(a) * r, -52 + Math.sin(a) * r); }
  g.closePath(); g.fill();
  g.restore();
}

// Hanging banner: the owner's emblem in a steel-rimmed medallion on navy-to-black cloth (no text)
function paintBanner(g) {
  const W = 256, H = 448;
  g.clearRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1d5fc4'); gr.addColorStop(0.55, '#0b2a5c'); gr.addColorStop(1, '#03070f');
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, H - 50); g.lineTo(W / 2, H); g.lineTo(0, H - 50); g.closePath(); g.fill();
  g.strokeStyle = '#8fd3ff'; g.lineWidth = 8; g.stroke();
  g.strokeStyle = 'rgba(143,211,255,0.4)'; g.lineWidth = 2; g.strokeRect(18, 18, W - 36, H - 110);
  emblemGlyph(g, W / 2, 196, 188);
  g.fillStyle = '#8fd3ff'; g.beginPath(); g.moveTo(W / 2 - 34, 332); g.lineTo(W / 2, 360); g.lineTo(W / 2 + 34, 332); g.lineTo(W / 2 + 34, 344); g.lineTo(W / 2, 372); g.lineTo(W / 2 - 34, 344); g.closePath(); g.fill();
}
export function bannerTexture() {
  const [c, g] = canvas(256, 448); paintBanner(g);
  const t = tex(c, { repeat: false }); BANNERT = { g, t };
  return t;
}

// Engraved plaque over the main gate: the realm's name (map and emissive mask). (No bot/handle text: players never see that word.)
export function plaqueTextures() {
  const W = 1024, H = 224;
  const [c, g] = canvas(W, H), [m, gm] = canvas(W, H);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0b2a5c'); gr.addColorStop(1, '#03070f');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#5fb6ff'; g.lineWidth = 10; g.strokeRect(8, 8, W - 16, H - 16);
  g.strokeStyle = 'rgba(143,211,255,0.45)'; g.lineWidth = 3; g.strokeRect(26, 26, W - 52, H - 52);
  gm.fillStyle = '#000'; gm.fillRect(0, 0, W, H);
  const art = (ctx, light, glow) => {
    crest(ctx, 150, 118, 1.0, light, '#000', glow); crest(ctx, W - 150, 118, 1.0, light, '#000', glow);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = light;
    ctx.font = "bold 78px 'Libre Baskerville', Georgia, 'Times New Roman', serif"; if ('letterSpacing' in ctx) ctx.letterSpacing = '10px'; ctx.fillText('BLUE WALL', W / 2 + 5, H / 2 + 6);
  };
  art(g, '#d9f2ff', '#8fd3ff'); art(gm, '#ffffff', '#ffffff');
  return { map: tex(c, { repeat: false }), mask: tex(m, { repeat: false, srgb: false }) };
}
