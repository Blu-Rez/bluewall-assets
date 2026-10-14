import { buildNav } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
const nav = buildNav({ height: () => 5, bridges: [], solids: [[0, 0, 8]] });
console.log('inside blocked', nav.isBlocked(0, 0), 'outside', nav.isBlocked(14, 0), 'wet', nav.isWet(0, 0), 'solid', nav.isSolid(2, 2));
console.log('clear through', nav.clear(-20, 0, 20, 0), 'clear beside', nav.clear(-20, 14, 20, 14));
const r = nav.route(-20, 0, 20, 0); console.log('route', JSON.stringify(r && r.map((p) => p.map((v) => +v.toFixed(1)))));
console.log('nearestDry from centre', JSON.stringify(nav.nearestDry(0, 0)));
const n2 = buildNav({ height: () => 5, bridges: [] }); console.log('no solids: blocked', n2.isBlocked(0, 0), 'clear', n2.clear(-20, 0, 20, 0));
