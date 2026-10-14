import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { makeCam } from '/home/claude/dev/a2_cam.mjs';
L.setMap('night'); const cam = makeCam();
const o = cam.proj(0, L.height(0, 0), 0); console.log('origin px', o.map((v) => v.toFixed(0)).join(','));
for (const [px, py] of [[1000, 460], [1100, 330], [1250, 260], [1400, 200], [1500, 150], [1600, 110], [1700, 60], [1797, 5], [1300, 120], [1450, 80], [1550, 250], [1600, 330], [1450, 330], [1999, 100], [1990, 30]]) {
  const r = cam.unproj(px, py); console.log('pix', px, py, '->', r ? `x=${r[0].toFixed(0)} z=${r[1].toFixed(0)} r=${Math.hypot(r[0], r[1]).toFixed(0)} ang=${(Math.atan2(r[1], r[0]) * 180 / Math.PI).toFixed(0)} h=${r[2].toFixed(0)}` : 'sky');
}
