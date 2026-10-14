import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildNav, bridgesFromLayout } from '../bot/bluebot_v2/bluewall/client/src/nav.js';
import { staticSolids } from '../bot/bluebot_v2/bluewall/client/src/solids.js';
L.setMap('night');
const nav = buildNav({ height: L.height, bridges: bridgesFromLayout(L), solids: staticSolids() });
const pts = { muster: [272, 76], keep: [-21, -20], goal1: [106, -95], goal2: [-124, 61], goal3: [115, -119], goal4: [64, -126], gate0: [136, 68], tower57: [96, -99] };
for (const [k, p] of Object.entries(pts)) console.log(k, p.join(','), 'region', nav.regionOf(p[0], p[1]), 'wet', nav.isWet(p[0], p[1]), 'blocked', nav.isBlocked(p[0], p[1]));
const cnt = {}, ex = {};
for (let x = -330; x <= 330; x += 6) for (let z = -330; z <= 330; z += 6) { if (nav.isWet(x, z) || nav.isBlocked(x, z)) continue; const r = nav.regionOf(x, z); cnt[r] = (cnt[r] || 0) + 1; (ex[r] = ex[r] || []).push([x, z]); }
for (const [r, n] of Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 8)) { const e = ex[r]; const xs = e.map((p) => p[0]), zs = e.map((p) => p[1]); console.log('region', r, 'cells', n, 'x', Math.min(...xs), Math.max(...xs), 'z', Math.min(...zs), Math.max(...zs)); }
for (const [a, b] of [['muster', 'keep'], ['muster', 'gate0'], ['gate0', 'keep'], ['muster', 'goal1'], ['keep', 'goal1']]) { const r = nav.route(pts[a][0], pts[a][1], pts[b][0], pts[b][1]); console.log('route', a, '->', b, r ? r.length + ' pts' : 'NONE'); }
const G = L.TGATES[0]; for (let d = -12; d <= 40; d += 4) { const x = G.x + G.nx * d, z = G.z + G.nz * d; console.log('gate0 d', d, 'region', nav.regionOf(x, z), 'wet', nav.isWet(x, z), 'bridge', nav.onBridge(x, z), 'blocked', nav.isBlocked(x, z)); }
console.log('RBRIDGES', JSON.stringify((L.RBRIDGES || []).map((b) => [Math.round(b.x), Math.round(b.z)])));
console.log('--- map (8 m cells; ~ water, 4 = town interior, 3 = pocket, 2 = east, 1/0 other)');
for (let z = -200; z <= 200; z += 8) { let row = ''; for (let x = -200; x <= 200; x += 5) row += nav.isWet(x, z) ? '~' : nav.isBlocked(x, z) ? '#' : String(nav.regionOf(x, z)); console.log(String(z).padStart(5) + ' ' + row); }
console.log('--- routes');
const T = { 'r3-west(-125,-30)': [-125, -30], 'r3-north(0,-140)': [0, -140], 'r3-nw(-100,-90)': [-100, -90], 'goal1': [106, -95], 'r3-ne(100,-125)': [100, -125], 'r3 near bridge(-94,-59)->(−115,-59)': [-115, -59] };
for (const [k, p] of Object.entries(T)) { const r = nav.route(-21, -20, p[0], p[1]); const r2 = nav.route(272, 76, p[0], p[1]); console.log(k, 'region', nav.regionOf(p[0], p[1]), 'wet', nav.isWet(p[0], p[1]), 'keep->', r ? r.length : 'NONE', 'muster->', r2 ? r2.length : 'NONE'); }
for (const b of L.RBRIDGES) console.log('bridge', Math.round(b.x), Math.round(b.z), 'n', b.nx.toFixed(2), b.nz.toFixed(2), 'len', b.len, 'ends regions', nav.regionOf(b.x + b.nx * (b.len / 2 + 3), b.z + b.nz * (b.len / 2 + 3)), nav.regionOf(b.x - b.nx * (b.len / 2 + 3), b.z - b.nz * (b.len / 2 + 3)));
console.log('--- bridge axis');
for (const b of L.RBRIDGES.slice(0, 5)) { let row = ''; for (let u = -20; u <= 20; u += 2) { const x = b.x + b.nx * u, z = b.z + b.nz * u; row += nav.onBridge(x, z) ? 'B' : nav.isWet(x, z) ? '~' : nav.isBlocked(x, z) ? '#' : '.'; } console.log(Math.round(b.x), Math.round(b.z), 'wid', b.wid, row, 'h', L.height(b.x, b.z).toFixed(2), JSON.stringify([b.tx, b.tz].map((v) => +(+v).toFixed(2)))); }
console.log('--- nav bridges', nav.bridges.length, JSON.stringify(nav.bridges.slice(0, 4).map((b) => [Math.round(b.x), Math.round(b.z), b.len, b.wid, +b.nx.toFixed(2), +b.nz.toFixed(2), +(b.tx).toFixed(2), +(b.tz).toFixed(2)])));
const b0 = L.RBRIDGES[3]; console.log('b0', JSON.stringify(b0)); console.log('onBridge at center', nav.onBridge(b0.x, b0.z), 'wet at center', nav.isWet(b0.x, b0.z));
