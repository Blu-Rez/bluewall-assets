import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { makeCam, W, H } from '/home/claude/dev/a2_cam.mjs';
L.setMap('night'); const cam = makeCam();
const vis = (x, z, y = -0.7) => { const C = cam.C; for (let k = 1; k < 200; k++) { const s = k / 200, px = x + (C[0] - x) * s, py = y + (C[1] - y) * s, pz = z + (C[2] - z) * s; const sd = L.sdTown(px, pz); if (Math.abs(sd) < 2.2 && py < 9.4) return false; if (py > 40) break; } return true; };
console.log('ang  moat-centre point            pixel        visible  (HUD: x>1690&y 235-455 | x>1810&y125-205 | x<520&y 235-420)');
for (let a = -170; a <= 20; a += 5) {
  // march outward from the town centre along angle a until sdTown = 13
  const ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180); let r = 100; while (L.sdTown(ca * r, sa * r) < 13 && r < 400) r += 0.5;
  const x = ca * r, z = sa * r, p = cam.proj(x, -0.75, z), v = vis(x, z), hud = (p[0] > 1690 && p[1] > 235 && p[1] < 455) || (p[0] > 1810 && p[1] > 125 && p[1] < 205) || (p[0] < 520 && p[1] > 235 && p[1] < 420);
  console.log(String(a).padStart(4), `(${x.toFixed(0)},${z.toFixed(0)})`.padEnd(14), `${p[0].toFixed(0)},${p[1].toFixed(0)}`.padEnd(12), v ? 'visible' : 'hidden ', hud ? ' under HUD' : '', (p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) ? ' off-screen' : '');
}
