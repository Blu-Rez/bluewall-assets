import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildNav, bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
const br = bridgesFromLayout(L);
console.log('bridges', br.map((b) => [b.x.toFixed(1), b.z.toFixed(1), b.nx.toFixed(2), b.nz.toFixed(2)].join(',')));
let t0 = Date.now(); const nav = buildNav({ height: L.height, bridges: br });
// ascii map around gate 0
const G = L.TGATES[0]; console.log('gate0', G.x.toFixed(1), G.z.toFixed(1), 'n', G.nx.toFixed(2), G.nz.toFixed(2));
for (let z = G.z - 40; z <= G.z + 40; z += 4) { let row = ''; for (let x = G.x - 50; x <= G.x + 50; x += 2.5) row += nav.onBridge(x, z) ? 'B' : nav.isWet(x, z) ? '~' : '.'; console.log(row); }
const g = BT.meta && BT.meta.deploy; console.log('meta keys', Object.keys(BT.meta || {}));
const keep = BT.targets.find((t) => t.type === 'keep');
const starts = [[G.x + G.nx * 60, G.z + G.nz * 60], [G.x + G.nz * 90 + G.nx * 40, G.z - G.nx * 90 + G.nz * 40], [-200, 100], [200, -150]];
for (const s of starts) { t0 = Date.now(); const r = nav.route(s[0], s[1], keep.x, keep.z); console.log('route', s.map((v) => v.toFixed(0)).join(','), '->', r ? r.length + ' pts ' + r.map((p) => p.map((v) => v.toFixed(0)).join(',')).join(' ') : 'NONE', (Date.now() - t0) + 'ms', 'wetStart', nav.isWet(s[0], s[1])); }
console.log('groundY on bridge', nav.groundY(br[0].x, br[0].z, -2.6).toFixed(2), 'off', nav.groundY(br[0].x + 30, br[0].z, 0.4));
console.log('init ms', Date.now() - t0);
for (let k = 0; k < 3; k++) for (const s of starts) { t0 = performance.now(); const r = nav.route(s[0], s[1], keep.x, keep.z); console.log('warm', (performance.now() - t0).toFixed(1) + 'ms', r ? r.length : 'NONE'); }
let c = 0; t0 = performance.now(); for (let i = 0; i < 20000; i++) { c += L.height(Math.random() * 600 - 300, Math.random() * 600 - 300) > 0 ? 1 : 0; } console.log('height x20000 ms', (performance.now() - t0).toFixed(0));
