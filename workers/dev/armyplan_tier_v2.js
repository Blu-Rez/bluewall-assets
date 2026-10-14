// Where every soldier of the attacking army stands before the battle (p37: pulled out of battlesim.js so that the tent camp can read the SAME plan and pitch itself BEHIND the last group).
// Blocks of one type each, laid out in shelves (rows of blocks), one tier per row (see tierOf): heroes at the head of the army, then the dragons and giants, the cavalry, the ordinary infantry,
// the archers and mages, the siege engines last.  lat = sideways from the deploy point (+ = to the right of the facing direction), back = away from the enemy base.
//   const plan = planArmy(army, UR, true);   plan.pos[type][k] = [lat, back]   plan.back1 = the back edge of the last row   plan.lat0 / plan.lat1 = the sideways extent
import DEFS from './unitdefs.json';

// Who stands where (owner 6 Oct 13:09: «heroes and the high-level units in front, down to the last row of ordinary soldiers — like a real war»).  One ROW (shelf) per tier, front to back:
//   0 heroes (the strongest first) · 1 the great ones: dragons, giants, big beasts (castle level 15+) · 2 the cavalry, the heavy infantry, the flyers (level 6-14) · 3 the ordinary soldiers (level 1-5)
//   4 archers, mages (the lich too) behind the infantry · 5 siege engines at the very back.   Inside a row the strongest block stands in the middle, the others on both sides.
export const tierOf = (t) => { const d = DEFS.units[t]; if (!d) return 9; if (DEFS.heroes && DEFS.heroes[t]) return 0; if (d.role === 'siege') return 5; if (d.role === 'ranged') return 4; return d.lv >= 15 ? 1 : d.lv >= 6 ? 2 : 3; };
export const rankOf = (t) => { const d = DEFS.units[t]; if (!d) return -99; return DEFS.heroes && DEFS.heroes[t] ? 100 + d.lv : d.lv; };
const centerOut = (arr) => { const out = []; arr.forEach((b, i) => { if (i % 2) out.unshift(b); else out.push(b); }); return out; };      // (the strongest block of a rank in the middle, the others on both sides)

export function planArmy(army, UR = 1, deployed = true) {
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const types = DEFS.order.filter((u) => army[u] > 0).sort((a, b) => tierOf(a) - tierOf(b) || rankOf(b) - rankOf(a) || DEFS.order.indexOf(a) - DEFS.order.indexOf(b));
  const SH_W = 150 * (deployed ? 1 : 0.5), GAP = 3.5 * UR;
  const blocks = types.map((type) => {
    const d = DEFS.units[type], n = army[type], sp = (d.space >= 8 ? 6.5 : d.space >= 3 ? 3.3 : 2.4) * UR / 1.5, cols = clamp(Math.ceil(Math.sqrt(n * 1.8)), Math.min(n, 3), d.space >= 8 ? 6 : 12);
    return { type, d, n, sp, cols, w: Math.min(n, cols) * sp, depth: Math.ceil(n / cols) * sp * 0.92 };
  });
  const shelves = []; let cur = null;
  for (const b of blocks) {
    if (!cur || cur.tier !== tierOf(b.type) || cur.w + b.w + GAP > SH_W) { cur = { blocks: [], w: -GAP, depth: 0, tier: tierOf(b.type) }; shelves.push(cur); }
    cur.blocks.push(b); cur.w += b.w + GAP; cur.depth = Math.max(cur.depth, b.depth);
  }
  for (const sh of shelves) sh.blocks = centerOut(sh.blocks);
  const pos = {}; let back0 = 0, back1 = 0, lat0m = 1e9, lat1m = -1e9;
  for (const sh of shelves) {
    let lat0 = -sh.w / 2;
    for (const b of sh.blocks) {
      const { type, n, sp, cols } = b, P = pos[type] = [];
      for (let k = 0; k < n; k++) {
        const c = k % cols, r = Math.floor(k / cols), rowN = Math.min(cols, n - r * cols), lat = lat0 + b.w / 2 + (c - (rowN - 1) / 2) * sp, back = back0 + r * sp * 0.92;
        P.push([lat, back]); lat0m = Math.min(lat0m, lat); lat1m = Math.max(lat1m, lat); back1 = Math.max(back1, back);
      }
      lat0 += b.w + GAP;
    }
    back0 += sh.depth + GAP * 1.3;
  }
  if (!types.length) { lat0m = lat1m = 0; }
  return { types, blocks, shelves, pos, back1, lat0: lat0m, lat1: lat1m };
}

// the soldiers that march out: the whole army minus the guardians that stay home (battle.js and the home camp must agree on this, or the camp would stand in a different place at home)
export function attackRoster(a) {
  const army = { ...((a && a.army) || {}) };
  for (const [u, n] of Object.entries((a && a.guard) || {})) if (army[u]) { army[u] = Math.max(0, army[u] - n); if (!army[u]) delete army[u]; }
  return army;
}
