import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { sites, pieces, wsLevel } from '../bot/bluebot_v2/bluewall/client/src/worksites.js';
import fs from 'fs';
L.setMap('night');
const T = {}; for (const l of fs.readFileSync('/home/claude/dev/p38/kit_tris.txt', 'utf8').split('\n')) { const [n, t] = l.trim().split(/\s+/); if (n) T[n] = +t; }
const lv = +(process.argv[2] || 30);
let all = 0;
for (const s of sites()) {
  const by = {}; let tot = 0;
  for (const p of pieces(s, lv)) { const t = (T[p.n] || 0) * p.s * 0 + (T[p.n] || 0); by[p.n] = (by[p.n] || [0, 0]); by[p.n][0]++; by[p.n][1] += t; tot += t; }
  all += tot;
  const top = Object.entries(by).sort((a, b) => b[1][1] - a[1][1]).slice(0, 6).map(([n, [c, t]]) => `${n.slice(3)}×${c}=${Math.round(t / 1000)}k`).join(' ');
  console.log(s.id.padEnd(14), String(Math.round(tot / 1000)).padStart(4) + 'k', top);
}
console.log('total kit tris', Math.round(all / 1000) + 'k');
