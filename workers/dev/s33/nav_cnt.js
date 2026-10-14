import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import * as B from './nav2_cnt.js';
import Q from './navcalls.json';
const n = B.buildNav({ height: L.height, bridges: B.bridgesFromLayout(L) }); for (let j = 0; j < n.rows; j += 40) n.warm(j, j + 40);
const rows = [];
for (const c of Q) { globalThis.__nc = { nodes: 0, clears: 0 }; const t0 = process.hrtime.bigint(); const r = n.route(...c.q); const ms = Number(process.hrtime.bigint() - t0) / 1e6; rows.push({ ms, nodes: globalThis.__nc.nodes, clears: globalThis.__nc.clears, pts: r ? r.length : 0, d: Math.hypot(c.q[2] - c.q[0], c.q[3] - c.q[1]) }); }
rows.sort((a, b) => b.ms - a.ms);
for (const r of rows.slice(0, 12)) console.log(r.ms.toFixed(1) + 'ms', 'nodes', r.nodes, 'clears', r.clears, 'pts', r.pts, 'd', r.d.toFixed(0));
const big = rows.filter((r) => r.ms > 8), sm = rows.filter((r) => r.ms <= 8);
console.log('>8ms:', big.length, 'avg nodes', (big.reduce((a, r) => a + r.nodes, 0) / big.length).toFixed(0), 'avg clears', (big.reduce((a, r) => a + r.clears, 0) / big.length).toFixed(0), '| <=8ms avg nodes', (sm.reduce((a, r) => a + r.nodes, 0) / sm.length).toFixed(0), 'avg clears', (sm.reduce((a, r) => a + r.clears, 0) / sm.length).toFixed(0));
