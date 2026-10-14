import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
L.setMap('night');
const G = L.GATE; console.log('GATE', JSON.stringify(G));
const azim = Math.atan2(G.nx, G.nz) + 0.22; console.log('default azim', azim.toFixed(3));
// camera like controls.js: landscape fov 52, aspect of the screenshot
const W = 1999, H = 923, fov = 52 * Math.PI / 180, f = (H / 2) / Math.tan(fov / 2);
function ray(dist, polar, tx, tz, px, py) {
  const T = [tx, L.height(tx, tz) + 2, tz], ux = Math.sin(azim), uz = Math.cos(azim);
  const C = [T[0] + dist * Math.sin(polar) * ux, T[1] + dist * Math.cos(polar), T[2] + dist * Math.sin(polar) * uz];
  let fw = [T[0] - C[0], T[1] - C[1], T[2] - C[2]]; const fl = Math.hypot(...fw); fw = fw.map((v) => v / fl);
  let rt = [fw[1] * 0 - fw[2] * 1, fw[2] * 0 - fw[0] * 0, fw[0] * 1 - fw[1] * 0]; // fw x up(0,1,0) = (-fw.z, 0, fw.x)
  rt = [-fw[2], 0, fw[0]]; const rl = Math.hypot(...rt); rt = rt.map((v) => v / rl);
  const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
  const a = (px - W / 2) / f, b = -(py - H / 2) / f;
  const d = [fw[0] + rt[0] * a + up[0] * b, fw[1] + rt[1] * a + up[1] * b, fw[2] + rt[2] * a + up[2] * b];
  let t = 1, prev = null;
  for (; t < 4000; t += 2) { const x = C[0] + d[0] * t, y = C[1] + d[1] * t, z = C[2] + d[2] * t; if (y < L.height(x, z)) return { x, z, t, y }; }
  return null;
}
for (const dist of [250, 270, 300]) {
  const pol = (() => { const ref = 414, zf = (Math.min(dist, ref) - 90) / (ref - 90); return 1.30 + (1.15 - 1.30) * Math.pow(Math.max(0, zf), 0.8); })();
  console.log('dist', dist, 'polar', pol.toFixed(3));
  for (const [nm, px, py] of [['center', 1000, 460], ['gate', 1085, 690], ['2oclock-mid (1500,200)', 1500, 200], ['top-right (1750,160)', 1750, 160], ['(1300,150)', 1300, 150], ['(1650,230)', 1650, 230], ['screen top-right corner', 1950, 30], ['(1500,100)', 1500, 100]]) {
    const r = ray(dist, pol, 0, 0, px, py); console.log('  ', nm.padEnd(26), r ? `x=${r.x.toFixed(0)} z=${r.z.toFixed(0)} r=${Math.hypot(r.x, r.z).toFixed(0)} ang=${(Math.atan2(r.z, r.x) * 180 / Math.PI).toFixed(0)}deg h=${r.y.toFixed(0)}` : 'sky');
  }
}
console.log('MOUNT', L.MOUNT, 'RIVER0', JSON.stringify(L.RIVER[0]), 'ang', (Math.atan2(L.RIVER[0][1], L.RIVER[0][0]) * 180 / Math.PI).toFixed(1));
