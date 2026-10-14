// the owner's camera (fitted to his level-30 screenshot, dev/a2_fitcam.py): project / unproject through the REAL terrain height()
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
export const W = 1999, H = 923, FOV = 52 * Math.PI / 180, F = (H / 2) / Math.tan(FOV / 2);
export const CAMP = { az: 1.191, tx: 49.5, tz: 51.5, dist: 257.6, polar: 1.179 };
export function makeCam(p = CAMP) {
  const T = [p.tx, 2.5, p.tz], C = [T[0] + p.dist * Math.sin(p.polar) * Math.sin(p.az), T[1] + p.dist * Math.cos(p.polar), T[2] + p.dist * Math.sin(p.polar) * Math.cos(p.az)];
  let fw = [T[0] - C[0], T[1] - C[1], T[2] - C[2]]; const fl = Math.hypot(...fw); fw = fw.map((v) => v / fl);
  let rt = [-fw[2], 0, fw[0]]; const rl = Math.hypot(...rt); rt = rt.map((v) => v / rl);
  const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
  const proj = (x, y, z) => { const d = [x - C[0], y - C[1], z - C[2]], zc = d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2]; return [W / 2 + F * (d[0] * rt[0] + d[1] * rt[1] + d[2] * rt[2]) / zc, H / 2 - F * (d[0] * up[0] + d[1] * up[1] + d[2] * up[2]) / zc, zc]; };
  const unproj = (px, py, hf = L.height) => { const a = (px - W / 2) / F, b = -(py - H / 2) / F, d = [fw[0] + rt[0] * a + up[0] * b, fw[1] + rt[1] * a + up[1] * b, fw[2] + rt[2] * a + up[2] * b]; for (let t = 1; t < 4000; t += 1) { const x = C[0] + d[0] * t, y = C[1] + d[1] * t, z = C[2] + d[2] * t; if (y < hf(x, z)) return [x, z, y]; } return null; };
  return { C, fw, rt, up, proj, unproj };
}
