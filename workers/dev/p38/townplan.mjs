// townplan.mjs — runs the real town planner (town.js) with a mock context and dumps the houses (for planning the worksites / storehouses)
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { buildTown } from '/home/claude/bot/bluebot_v2/bluewall/client/src/town.js';
import { planVaults } from '/home/claude/bot/bluebot_v2/bluewall/client/src/vault.js';
import { marketSpot } from '/home/claude/bot/bluebot_v2/bluewall/client/src/terrain.js';
import fs from 'fs';
L.setMap('night'); buildRoads();
const noop = () => {}; const any = new Proxy(function () {}, { get: (t, k) => (k === 'tagB' ? 0 : any), apply: () => any });
const B = { add: noop, bid: noop, tag: noop, tagB: 0 };
const ctx = new Proxy({ B, M: new Proxy({}, { get: () => ({}) }), height: L.height, houses: [], tgt: () => 1, pick: noop, hex: noop, inst: noop, smokeAt: noop, torch: noop, innerTrees: [] }, { get: (t, k) => (k in t ? t[k] : noop) });
const out = buildTown(ctx, { tex: {}, ph: {} }, { level: 'high' }, { add: noop });
fs.writeFileSync('/tmp/cmp/townplan.json', JSON.stringify({ houses: out.houses.map((h) => ({ x: h.x, z: h.z, w: h.w, d: h.d, ry: h.ry, kind: h.kind })), vaults: planVaults(), market: marketSpot(), trees: ctx.innerTrees }));
console.log('houses', out.houses.length, 'vaults', planVaults().length, JSON.stringify(planVaults().map((v) => [Math.round(v.x), Math.round(v.z)])));
