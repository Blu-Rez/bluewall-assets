// Gem colours + floating 3D badges above the mines (gem icon + amount ready).
import * as THREE from 'three';
import { BASE } from './assets.js';

export const GEM_COL = {
  ruby: { base: 0xc8102e, glow: 0xff2a4a, css: ['#ff8a9a', '#e01e3c', '#7a0614'] },
  emerald: { base: 0x0e9e58, glow: 0x22ff8a, css: ['#8dffc2', '#14b86a', '#055c33'] },
  turq: { base: 0x1aa8d0, glow: 0x30e6ff, css: ['#e2fbff', '#4fd8f0', '#06406e'] },
};

const IMG = {};
function gemImage(id, onload) {
  let im = IMG[id]; if (!im) { im = IMG[id] = new Image(); im.decoding = 'async'; im.src = BASE + 'ui/gem_' + id + '.webp'; }
  if (!im.complete) im.addEventListener('load', onload, { once: true });
  return im.complete && im.naturalWidth ? im : null;
}
function drawGem(g, id, cx, cy, s, onload) {
  const im = gemImage(id, onload);
  if (im) { g.drawImage(im, cx - s * 1.3, cy - s * 1.3, s * 2.6, s * 2.6); return; }
  const [hi, mid, lo] = GEM_COL[id].css;
  const gr = g.createLinearGradient(cx, cy - s, cx, cy + s); gr.addColorStop(0, hi); gr.addColorStop(0.5, mid); gr.addColorStop(1, lo);
  g.fillStyle = gr; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = s * 0.08;
  g.beginPath();
  if (id === 'ruby') { g.moveTo(cx, cy - s); g.lineTo(cx + s * 0.85, cy - s * 0.35); g.lineTo(cx + s * 0.55, cy + s * 0.85); g.lineTo(cx - s * 0.55, cy + s * 0.85); g.lineTo(cx - s * 0.85, cy - s * 0.35); }
  else if (id === 'emerald') { const k = s * 0.45; g.moveTo(cx - k, cy - s); g.lineTo(cx + k, cy - s); g.lineTo(cx + s, cy - k); g.lineTo(cx + s, cy + k); g.lineTo(cx + k, cy + s); g.lineTo(cx - k, cy + s); g.lineTo(cx - s, cy + k); g.lineTo(cx - s, cy - k); }
  else { g.moveTo(cx, cy - s); g.lineTo(cx + s * 0.87, cy - s * 0.5); g.lineTo(cx + s * 0.87, cy + s * 0.5); g.lineTo(cx, cy + s); g.lineTo(cx - s * 0.87, cy + s * 0.5); g.lineTo(cx - s * 0.87, cy - s * 0.5); }
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(cx - s * 0.3, cy - s * 0.45, s * 0.18, s * 0.12, -0.5, 0, 6.29); g.fill();
}

// badge: rounded dark-blue pill with the gem and "+N"
export function gemBadge(id) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: true, sizeAttenuation: true });
  const sp = new THREE.Sprite(mat); sp.scale.set(12, 6, 1); sp.renderOrder = 20;
  let last = null;
  const cur = { n: 0, full: false };
  sp.userData.set = (n, full = false) => {
    cur.n = n; cur.full = full;
    const txt = n > 0 ? '+' + (n >= 1e4 ? Math.floor(n / 1e3) + 'K' : Math.floor(n)) : '';
    const key = txt + full; if (key === last) return; last = key;
    const g = c.getContext('2d'); g.clearRect(0, 0, 256, 128);
    const w = txt ? 236 : 118, x0 = (256 - w) / 2;
    g.fillStyle = 'rgba(3,10,26,0.82)'; g.strokeStyle = full ? '#ffd76a' : 'rgba(143,211,255,0.85)'; g.lineWidth = 5;
    g.beginPath(); if (g.roundRect) g.roundRect(x0, 14, w, 100, 50); else g.rect(x0, 14, w, 100); g.fill(); g.stroke();
    drawGem(g, id, x0 + 59, 64, 34, () => { last = null; sp.userData.set(cur.n, cur.full); });
    if (txt) { g.font = "700 50px 'Libre Baskerville', Georgia, serif"; g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(txt, x0 + 106, 68); }
    tex.needsUpdate = true;
  };
  sp.userData.set(0);
  return sp;
}
