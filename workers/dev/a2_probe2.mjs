import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
L.setMap('night');
const G = L.GATE, azim = Math.atan2(G.nx, G.nz) + 0.22;
const W = 1999, H = 923, fov = 52 * Math.PI / 180, f = (H / 2) / Math.tan(fov / 2);
const dist = 240, ref = 414, zf = (Math.min(dist, ref) - 90) / (ref - 90), polar = 1.30 + (1.15 - 1.30) * Math.pow(zf, 0.8);
const tx = 18, tz = 16, T = [tx, L.height(tx, tz) + 2, tz], ux = Math.sin(azim), uz = Math.cos(azim);
const C = [T[0] + dist * Math.sin(polar) * ux, T[1] + dist * Math.cos(polar), T[2] + dist * Math.sin(polar) * uz];
let fw = [T[0] - C[0], T[1] - C[1], T[2] - C[2]]; const fl = Math.hypot(...fw); fw = fw.map((v) => v / fl);
let rt = [-fw[2], 0, fw[0]]; const rl = Math.hypot(...rt); rt = rt.map((v) => v / rl);
const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
const proj = (x, y, z) => { const d = [x - C[0], y - C[1], z - C[2]]; const zc = d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2]; return [W / 2 + f * (d[0] * rt[0] + d[1] * rt[1] + d[2] * rt[2]) / zc, H / 2 - f * (d[0] * up[0] + d[1] * up[1] + d[2] * up[2]) / zc, zc]; };
console.log('azim', azim.toFixed(3), 'polar', polar.toFixed(3), 'cam', C.map((v) => v.toFixed(0)).join(','));
const P = (nm, x, z) => { const p = proj(x, L.height(x, z), z); console.log(nm.padEnd(22), `pix ${p[0].toFixed(0)},${p[1].toFixed(0)}  depth ${p[2].toFixed(0)}`); };
P('town gate T0', L.TGATES[0].x, L.TGATES[0].z); P('citadel gate G', G.x, G.z); P('keep', L.KEEP.x, L.KEEP.z); P('origin', 0, 0);
L.TOWN.forEach(([x, z], i) => P('town corner ' + i, x, z));
P('river NE gate', 129.5, -87.5); P('RIVER[0] waterfall', ...L.RIVER[0]); P('RIVER[4]', ...L.RIVER[4]);
// unproject a few pixels
const unp = (px, py) => { const a = (px - W / 2) / f, b = -(py - H / 2) / f, d = [fw[0] + rt[0] * a + up[0] * b, fw[1] + rt[1] * a + up[1] * b, fw[2] + rt[2] * a + up[2] * b]; for (let t = 1; t < 4000; t += 1) { const x = C[0] + d[0] * t, y = C[1] + d[1] * t, z = C[2] + d[2] * t; if (y < L.height(x, z)) return [x, z, y]; } return null; };
for (const [px, py] of [[1500, 200], [1750, 160], [1650, 230], [1900, 120], [1999, 60], [1800, 330], [1990, 300], [1500, 80]]) { const r = unp(px, py); console.log('pix', px, py, '->', r ? `x=${r[0].toFixed(0)} z=${r[1].toFixed(0)} r=${Math.hypot(r[0], r[1]).toFixed(0)} ang=${(Math.atan2(r[1], r[0]) * 180 / Math.PI).toFixed(0)} h=${r[2].toFixed(0)}` : 'sky'); }
