import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { sites, pieces } from '/home/claude/bot/bluebot_v2/bluewall/client/src/worksites.js';
import fs from 'fs';
const rep = JSON.parse(fs.readFileSync('/tmp/claude-0/kit_ws2.report.json', 'utf8')), rec = JSON.parse(fs.readFileSync('/home/claude/dev/p38/recipe_ws2.json', 'utf8'));
const T = {}; for (const r of rep) { const cap = (rec.find((q) => q.name === r.name) || {}).tris; T[r.name] = Math.min(r.tris, cap || 1e9); }
L.setMap('night'); let tot = 0;
for (const lv of [10, 20, 30]) { tot = 0; const rows = [];
  for (const s of sites()) { const ps = pieces(s, lv); let t = 0; const by = {}; for (const p of ps) { const v = T[p.n] ?? 0; t += v; by[p.n] = (by[p.n] || 0) + v; } tot += t; rows.push([s.id, ps.length, t, Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => k.slice(3) + ':' + v).join(' ')]); }
  console.log('LV', lv, 'total kit tris', tot); if (lv === 30) for (const r of rows) console.log(' ', r.join(' | ')); }
