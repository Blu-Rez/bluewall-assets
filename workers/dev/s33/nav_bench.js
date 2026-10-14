// replay the real route queries of 4 battles against nav_orig.js and nav2.js: time, path length, how often the path differs
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import * as A from './nav_orig.js';
import * as B from './nav2.js';
import Q from './navcalls.json';
const mk = (M) => { const n = M.buildNav({ height: L.height, bridges: M.bridgesFromLayout(L) }); for (let j = 0; j < n.rows; j += 40) n.warm(j, j + 40); return n; };
const NA = mk(A), NB = mk(B);
const len = (a, p) => { let s = 0, x = a[0], z = a[1]; for (const q of p) { s += Math.hypot(q[0] - x, q[1] - z); x = q[0]; z = q[1]; } return s; };
const run = (nav) => { const ms = [], out = []; for (const c of Q) { const t0 = process.hrtime.bigint(); const r = nav.route(...c.q); ms.push(Number(process.hrtime.bigint() - t0) / 1e6); out.push(r); } return { ms, out }; };
run(NA); run(NB);                                                       // warm
const ra = run(NA), rb = run(NB);
const stat = (m) => { const s = m.slice().sort((a, b) => b - a); return `total ${m.reduce((a, b) => a + b, 0).toFixed(0)}ms  max ${s[0].toFixed(1)}  p99 ${s[Math.floor(s.length * 0.01)].toFixed(1)}  p90 ${s[Math.floor(s.length * 0.1)].toFixed(2)}  top5 ${s.slice(0, 5).map((v) => v.toFixed(1)).join(',')}`; };
console.log('orig', stat(ra.ms)); console.log('new ', stat(rb.ms));
let diff = 0, worse = 0, nullA = 0, nullB = 0, ratioMax = 1, sumA = 0, sumB = 0;
Q.forEach((c, i) => { const a = ra.out[i], b = rb.out[i]; if (!a) nullA++; if (!b) nullB++; if (!a || !b) return; const la = len(c.q, a), lb = len(c.q, b); sumA += la; sumB += lb; if (Math.abs(la - lb) > 0.01) diff++; if (lb > la * 1.03) worse++; ratioMax = Math.max(ratioMax, lb / la); });
console.log('queries', Q.length, 'null', nullA, nullB, 'paths differing', diff, 'longer by >3%', worse, 'max ratio', ratioMax.toFixed(3), 'total length ratio', (sumB / sumA).toFixed(4));
