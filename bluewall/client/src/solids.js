// The standing buildings of the valley that no soldier may walk into (owner 6 Oct 14:16: «the map must be such that the soldiers do not go into the buildings»): the farmhouse with its props,
// the cottages of the hamlets and the windmill.  [[x, z, radius], ...] in world metres — nav.js (buildNav({ solids })) makes the cells under them closed to ground units, the same as water.
import * as L from './layout.js';
import { hamlets } from './hamlets.js';
import { wsSolids } from './worksites.js';
import { defSolids } from './defplan.js';

export function staticSolids() {
  const out = [];
  if (L.FIELDS) { out.push([L.FIELDS.x + L.FIELDS.w / 2 + 18, L.FIELDS.z + 4, 11], [L.FIELDS.x + L.FIELDS.w / 2 + 10, L.FIELDS.z - 14, 6]); }
  try { for (const H of hamlets()) for (const h of H.houses) out.push([h.x, h.z, Math.max(h.w, h.d) * 0.62 + 1.4]); } catch (e) { /* no hamlets on this map */ }
  if (L.WINDMILL) out.push([L.WINDMILL.x, L.WINDMILL.z, 9]);
  try { for (const w of wsSolids()) out.push(w); } catch (e) { /* no worksites on this map */ }          // p38: the lumber mill, the mines, the barns, the huts… of the worksites
  try { for (const w of defSolids(30)) out.push(w); } catch (e) { /* no defence field on this map */ }     // p38: the watchtowers, the ballista outposts, the braziers, the fire stones
  return out;
}
