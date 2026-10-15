// b1_layout.js — B1 adapter: the game's module-level layout (layout.js, roads.js, stores.js, vault.js, terrain.js) -> the PLAIN `layout` object that planTown() takes.
// planTown() (b1_townplan.js) never imports the game's coordinates: the rings, the river and the streets are being changed by A1 / A2 and the player will move things later,
// so everything it needs comes through this one object (see the header of b1_townplan.js for the shape).  `perturbLayout()` makes the test variants (rings rotated, river shifted).
import * as L from './layout.js';
import { buildRoads, ROADS } from './roads.js';
import { planStoresDefault } from './stores.js';          // TR2-S5: the planner works from the DEFAULT places (a move of the player's never re-plans the town)
import { planVaults } from './vault.js';
import { marketSpot } from './terrain.js';
import { civicSolids, CIVIC_KINDS } from './b3_civic.js';

const copy = (pts) => pts.map((p) => [p[0], p[1]]);
const DEG = Math.PI / 180;

// p41: the B3 market is a SQUARE with one open front, the old market was a bare disk where two streets cross.  The lot is reserved as a circle that holds every piece (the covered hall at the
// back reaches 11.4 + 6.2 m from the middle) and TURNED so that none of its big pieces (hall, stalls) stands on a street: the turn that blocks the fewest street metres wins, the front toward
// the main street (the way out of the gate) breaks ties.  Pure function of the layout: same map => same turn.
export const MARKET_RESERVE = 17.6;
function marketTurn(MK, streets, G) {
  const sol = civicSolids('market', 30, 1), front = Math.atan2(G.nx, G.nz);
  const edge = (x, z) => { let d = 99; for (const st of streets) for (let i = 0; i < st.pts.length - 1; i++) { const [ax, az] = st.pts[i], [bx, bz] = st.pts[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1; const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)); d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t) - st.w / 2); } return d; };
  let best = 0, bp = 1e9;
  for (let k = 0; k < 72; k++) {
    const ry = k * 5 * DEG, c = Math.cos(ry), s = Math.sin(ry); let pen = 0;
    for (const [lx, lz, r] of sol) {
      if (Math.hypot(lx, lz) < 3) continue;                                  // the middle piece (well / cross) stands on the crossing by design
      if (edge(MK.x + lx * c + lz * s, MK.z - lx * s + lz * c) < r * 0.5) pen += r > 4 ? 8 : 1;
    }
    let da = ry - front; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da))); pen += 0.05 * da;
    if (pen < bp - 1e-9) { bp = pen; best = ry; }
  }
  return +best.toFixed(4);
}

export function layoutFromGame() {
  buildRoads();
  const MK = marketSpot() || { x: 0, z: 0, r: 15 };
  const G = L.GATE;
  const streets = ROADS.filter((r) => r.kind === 'cobble').map((r) => ({ name: r.name, w: r.w, pts: copy(r.pts), closed: !!r.closed }));
  const fixed = [
    ...planStoresDefault().map((s) => ({ id: 'store_' + s.id, kind: 'stores', res: s.id, x: s.x, z: s.z, ry: s.ry, r: s.r })),
    ...planVaults().map((v) => ({ id: 'vault_' + v.id, kind: 'vault', res: v.id, x: v.x, z: v.z, ry: v.ry, r: v.r })),
  ];
  return {
    town: copy(L.TOWN), outer: copy(L.OUTER),
    moat: { off: L.MOAT.off, half: L.MOAT.half },            // the Blue Wall's moat band (distance from the outer polygon)
    keep: { x: L.KEEP.x, z: L.KEEP.z }, plaza: { x: L.PLAZA.x, z: L.PLAZA.z, r: L.PLAZA.r },
    market: { x: MK.x, z: MK.z, r: Math.max(MK.r, MARKET_RESERVE), ry: marketTurn(MK, streets, G), w: CIVIC_KINDS.market.w, d: CIVIC_KINDS.market.d },
    gates: [...L.TGATES.map((g) => ({ x: g.x, z: g.z, nx: g.nx, nz: g.nz })), { x: G.x + G.nx * 20, z: G.z + G.nz * 20, nx: G.nx, nz: G.nz }],
    streets,
    river: { pts: copy(L.RIVER), half: 5 },                  // water half width; the stone quay stands on the banks at 5.5 m (castle.js riverQuay)
    streams: (L.STREAMS || []).map((S) => ({ id: S.id, pts: copy(S.pts), half: 5 * (S.k || 1) })),      // p41: A2's mountain streams (k = width scale, 1 = like the river): water the lots keep away from
    fixed,
    sites: L.SITES.map((s) => ({ id: s.id, kind: s.kind, x: s.x, z: s.z, r: s.r })),
  };
}

// ---- test variants -------------------------------------------------------------------------------------------------
const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
// rotDeg: turn the town wall + every street + the gates + the market square about the origin (the citadel, the keep, the stores / vaults and the worksites stay);  riverDx / riverDz: slide the river
export function perturbLayout(base, { rotDeg = 0, riverDx = 0, riverDz = 0 } = {}) {
  const a = rotDeg * Math.PI / 180, o = JSON.parse(JSON.stringify(base));
  if (a) {
    o.town = o.town.map((p) => rot(p, a));
    o.streets.forEach((s) => { s.pts = s.pts.map((p) => rot(p, a)); });
    o.gates = o.gates.map((g, i) => (i < o.gates.length - 1 ? { ...g, ...(() => { const [x, z] = rot([g.x, g.z], a), [nx, nz] = rot([g.nx, g.nz], a); return { x, z, nx, nz }; })() } : g));
    { const [x, z] = rot([o.market.x, o.market.z], a); o.market.x = x; o.market.z = z; o.market.ry = (o.market.ry || 0) - a; }
  }
  o.river.pts = o.river.pts.map((p) => [p[0] + riverDx, p[1] + riverDz]);
  return o;
}
