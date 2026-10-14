import { sites, pieces } from '/home/claude/bot/bluebot_v2/bluewall/client/src/worksites.js';
const s = sites().find((q) => q.id === 'livestock'); console.log(s);
for (const p of pieces(s, 30)) if (/pen|pasture|fence_big|ws_pen|floor|deck/i.test(p.n)) console.log(p.n, p.x.toFixed(1), p.z.toFixed(1), p.ry.toFixed(2), p.s);
