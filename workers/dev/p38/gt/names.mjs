import { sites, pieces } from '/home/claude/bot/bluebot_v2/bluewall/client/src/worksites.js';
const c = {}; for (const s of sites()) for (const p of pieces(s, 30)) (c[p.n] = c[p.n] || new Set()).add(s.kind);
console.log(Object.entries(c).map(([k, v]) => k.replace('ws_', '') + '(' + [...v].map((x) => x.slice(0, 3)).join('/') + ')').join('  '));
