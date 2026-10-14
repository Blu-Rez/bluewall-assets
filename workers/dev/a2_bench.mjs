// height() throughput: base_snapshot layout vs current (the terrain bake, the forest and the planners call it millions of times)
import * as B from '/home/claude/base_snapshot/client/src/layout.js';
import * as C from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
B.setMap('night'); C.setMap('night');
const pts = []; let s = 12345; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
for (let i = 0; i < 400000; i++) pts.push([(r() - 0.5) * 840, (r() - 0.5) * 840]);
const run = (L) => { let a = 0; const t = performance.now(); for (const [x, z] of pts) a += L.height(x, z); return [performance.now() - t, a]; };
run(B); run(C);
let mb = 1e9, mc = 1e9; for (let k = 0; k < 9; k++) { const b = run(B), c = run(C); mb = Math.min(mb, b[0]); mc = Math.min(mc, c[0]); }
console.log('best of 9: base', mb.toFixed(0), 'ms  now', mc.toFixed(0), 'ms  (+' + ((mc / mb - 1) * 100).toFixed(1) + '%)');
