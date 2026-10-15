// tr2h_bridges.mjs — every crossing / quay / jetty the game builds, with position, length, width, yaw, kind (from the layout + roads, the same lists castle.js / nav.js / worksites.js use)
import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { bridgesFromLayout } from '../bot/bluebot_v2/bluewall/client/src/nav.js';
const all = bridgesFromLayout(L);
const gateBr = (L.TOWN && L.MOAT2) ? L.TGATES.length : 0;
const out = all.map((b, i) => {
  const kind = i < gateBr ? 'town-gate moat bridge' : (i >= all.length - (L.MOAT && L.MOAT.on && L.GATE ? 1 : 0) ? 'outer-gate moat bridge' : (b.len > 22 || b.wid >= 7 ? 'road stone bridge (river/stream)' : 'footbridge (stream/ford)'));
  return { i, kind, x: +b.x.toFixed(1), z: +b.z.toFixed(1), len: b.len, wid: b.wid, ry: +Math.atan2(-b.nz, b.nx).toFixed(3), nx: +b.nx.toFixed(3), nz: +b.nz.toFixed(3) };
});
console.log(JSON.stringify({ count: out.length, rbridges: (L.RBRIDGES || []).length, tgates: (L.TGATES || []).length, wgates: L.WGATES, riverPts: (L.RIVER || []).length, moat: !!(L.MOAT && L.MOAT.on), bridges: out }));
