import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
L.setMap('night');
const f = (a) => JSON.stringify(a, (k, v) => typeof v === 'number' ? +v.toFixed(1) : v);
console.log('OUTER', L.OUTER && L.OUTER.length, f(L.OUTER && L.OUTER.slice(0, 3)), 'GATE_SEG', f(L.GATE_SEG));
console.log('TOWN', L.TOWN && L.TOWN.length, 'TOWN_GATES', f(L.TOWN_GATES), 'TGATES', f(L.TGATES));
console.log('INNER', L.INNER && L.INNER.length, 'INNER_GATE_SEG', f(L.INNER_GATE_SEG), 'GATE', f(L.GATE), 'MOAT', f(L.MOAT && Object.keys(L.MOAT)));
console.log('WGATES', f(L.WGATES), 'KEEP', f(L.KEEP), 'MUSTER', f(L.MUSTER), 'CAMP', f(L.CAMP));
