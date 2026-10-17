import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
const f = (P) => JSON.stringify(P.map((p) => p.map((v) => +v.toFixed(1))));
console.log('INNER', f(L.INNER)); console.log('OUTER', f(L.OUTER)); console.log('TOWN', f(L.TOWN));
console.log('keys', Object.keys(L).filter((k) => /KEEP|CIT|GATE|CENTER|CX|CZ/i.test(k)).join(' '));
for (const k of ['KEEP', 'CITADEL', 'GATE', 'INNER_GATE_SEG', 'GATE_SEG']) if (L[k] !== undefined) console.log(k, JSON.stringify(L[k]).slice(0, 200));
