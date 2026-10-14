import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS } from '../bot/bluebot_v2/bluewall/client/src/roads.js';
import { planStores } from '../bot/bluebot_v2/bluewall/client/src/stores.js';
import { haulRoute } from '../bot/bluebot_v2/bluewall/client/src/wslife.js';
import { sites } from '../bot/bluebot_v2/bluewall/client/src/worksites.js';
L.setMap('night'); buildRoads();
console.log('roads', ROADS.length, 'stores', planStores().map((s) => s.id + '@' + s.x.toFixed(0) + ',' + s.z.toFixed(0)).join(' '));
let bad = 0;
for (const s of sites()) { const r = haulRoute(s); if (!r) { bad++; console.log('FAIL no route', s.id); continue; } console.log(s.id.padEnd(14), 'len', r.len.toFixed(0), 'pts', r.pts.length); }
console.log(bad ? 'ROUTE FAIL' : 'ROUTE OK');
import { graph, shortest } from '../bot/bluebot_v2/bluewall/client/src/wslife.js';
{
  const G = graph(), N = G.N; const comp = new Int32Array(N.length).fill(-1); let nc = 0;
  for (let i = 0; i < N.length; i++) { if (comp[i] >= 0) continue; const st = [i]; comp[i] = nc; while (st.length) { const u = st.pop(); for (const [v] of N[u].e) if (comp[v] < 0) { comp[v] = nc; st.push(v); } } nc++; }
  console.log('nodes', N.length, 'components', nc);
  const names = {}; for (let i = 0; i < N.length; i++) { (names[comp[i]] = names[comp[i]] || new Set()).add(N[i].road); }
  for (const [c, s] of Object.entries(names)) console.log('comp', c, [...s].join(','));
  const st = planStores()[0], s0 = sites()[0]; const a = G.near(st.x, st.z); console.log('store0 node', a, N[a].road, comp[a], 'dist', Math.hypot(N[a].x - st.x, N[a].z - st.z).toFixed(1));
}
{
  const G = graph(), s = sites()[0], st = planStores().find((q) => q.id === 'wood');
  const f = [s.x, s.z]; const a = G.near(f[0], f[1]), b = G.near(st.x, st.z);
  console.log('a', a, G.N[a].road, 'b', b, G.N[b].road, 'edges a', G.N[a].e.length, 'edges b', G.N[b].e.length);
  const p = shortest(a, b); console.log('path', p && p.length);
}
