import { sites, pieces } from '/home/claude/bot/bluebot_v2/bluewall/client/src/worksites.js';
for (const s of sites()) {
  const ps = pieces(s, 30); let worst = 0, wn = '';
  const far = ps.filter((p) => Math.hypot(p.x, p.z) > s.r * 0.72 + 0.5);
  for (const p of ps) { const d = Math.hypot(p.x, p.z); if (d > worst) { worst = d; wn = p.n; } }
  console.log(s.id.padEnd(14), 'r', s.r, 'flat', (s.r * 0.72).toFixed(1), 'max', worst.toFixed(1), wn, 'n beyond flat', far.length, '/', ps.length, far.slice(0, 4).map((p) => p.n + '@' + Math.hypot(p.x, p.z).toFixed(0)).join(' '));
}
