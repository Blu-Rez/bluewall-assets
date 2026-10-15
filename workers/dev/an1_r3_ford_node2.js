import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { bridgesFromLayout, makeGroundY } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
console.log('TOWN', !!L.TOWN, 'MOAT2', JSON.stringify(L.MOAT2 && { on: L.MOAT2.on, off: L.MOAT2.off, level: L.MOAT2.level, w: L.MOAT2.w }), 'TGATES', JSON.stringify((L.TGATES || []).map((g) => [+g.x.toFixed(1), +g.z.toFixed(1), +g.nx.toFixed(2), +g.nz.toFixed(2)])));
const br = bridgesFromLayout(L); console.log('bridges', br.length);
const gy = makeGroundY(br);
for (const [x, z] of [[148.4, 74.3], [-148.1, -82.4], [139, 69], [155, 78]]) console.log([x, z], 'h', +L.height(x, z).toFixed(2), 'walkY', +gy(x, z, L.height(x, z)).toFixed(2));
console.log('level api', typeof L.setLevel, typeof L.ringsAt, JSON.stringify(Object.keys(L).filter((k) => /level|ring/i.test(k))));
