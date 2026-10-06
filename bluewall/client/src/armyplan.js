// Where every soldier of the attacking army stands before the battle (p37: pulled out of battlesim.js so that the tent camp can read the SAME plan and pitch itself BEHIND the last group).
// Blocks of one type each, laid out in shelves (ranks of blocks), one tier per rank (see tierOf): heroes at the head of the army, then the dragons and giants, the cavalry, the ordinary infantry,
// the archers and mages, the siege engines last.  lat = sideways from the deploy point (+ = to the right of the facing direction), back = away from the enemy base.
//   const plan = planArmy(army, UR, true);   plan.pos[type][k] = [lat, back]   plan.back1 = the back edge of the last row   plan.lat0 / plan.lat1 = the sideways extent
import DEFS from './unitdefs.json';

// Who stands where (owner 6 Oct 13:09: «heroes and the high-level units in front, down to the last row of ordinary soldiers — like a real war»).  One ROW (shelf) per tier, front to back:
//   0 heroes (the strongest first) · 1 the great ones: dragons, giants, big beasts (castle level 15+) · 2 the cavalry, the heavy infantry, the flyers (level 6-14) · 3 the ordinary soldiers (level 1-5)
//   4 archers, mages (the lich too) behind the infantry · 5 siege engines at the very back.   Inside a row the strongest block stands in the middle, the others on both sides.
export const tierOf = (t) => { const d = DEFS.units[t]; if (!d) return 9; if (DEFS.heroes && DEFS.heroes[t]) return 0; if (d.role === 'siege') return 5; if (d.role === 'ranged') return 4; return d.lv >= 15 ? 1 : d.lv >= 6 ? 2 : 3; };
export const rankOf = (t) => { const d = DEFS.units[t]; if (!d) return -99; return DEFS.heroes && DEFS.heroes[t] ? 100 + d.lv : d.lv; };

// p37 (owner 6 Oct 15:03): «the halos — the background circles of the groups — must not run into each other;  optimise: why should 4 giants stand in a row and make the circle bigger?
// 2 by 2, two to a rank, a good density, so that the circle gets smaller».  So: every squad is one COMPACT block (as square as it can be, balanced ranks: 4 giants = 2x2, 61 spearmen = 8 ranks
// of 8-7), its ring is the circle round its soldiers (squadring.js: farthest soldier + a margin), and the circles are laid out so that NO TWO RINGS TOUCH: blocks stand side by side in a rank
// with their rings a small gap apart, ranks are a ring-diameter deep.  The army is WIDE because many compact blocks stand side by side (the width is chosen so that the whole is about twice as
// wide as it is deep), not because a block is stretched.
export const MAX_WIDTH = 200;                                       // (metres of army front)
export const RING_GAP = 1.4;                                        // the clear ground between two rings (at UR 2), in metres
const FRONTK = 0.3;                                                  // (a ring of a later group starts at least this much of the radius of an earlier ring behind that ring's middle)
const ASPECT = 2.1;                                                 // the army is about this much wider than it is deep (when the ground allows it)
// where the army may stand: the muster plain at the deploy point, measured on the real height map (lateral l = sideways from the deploy point, minus = left; b = metres behind the first rank).
// The flat ground is about 130-170 m wide; on the right it goes on as a gentle hillside, on the left the farm fences begin at about -80 and the farmhouse with its props at about -105.
// [b, left limit, right limit] in game metres — the same for every battle: the deploy point is always in front of the same gate.
const PLAIN = [[0, -92, 84], [60, -92, 78], [80, -92, 60], [100, -88, 30], [112, -76, 14], [130, -60, 0]];
const plainAt = (b) => { for (let i = 1; i < PLAIN.length; i++) if (b <= PLAIN[i][0]) { const [b0, l0, r0] = PLAIN[i - 1], [b1, l1, r1] = PLAIN[i], t = (b - b0) / (b1 - b0); return [l0 + (l1 - l0) * t, r0 + (r1 - r0) * t]; } const q = PLAIN[PLAIN.length - 1]; return [q[1], q[2]]; };
const plainOver = (b0, b1) => { let l = -1e9, r = 1e9; for (let k = 0; k <= 4; k++) { const [a, c] = plainAt(b0 + (b1 - b0) * k / 4); l = Math.max(l, a); r = Math.min(r, c); } return [l, r]; };

// the ring round a squad: the farthest soldier's centre + this margin (half the body of the biggest soldier + 1.2 m);  squadring.js draws the ring with the same formula, so the plan and the picture agree
export const ringMargin = (rb, u = 1) => 0.5 * rb + 1.2 * u;
// the most compact block of n soldiers at spacing sp: the number of ranks r that makes the circle round it smallest (a rank is 0.92 sp deep; the weight 1.15 prefers a block a little wider than deep),
// the ranks as equal as can be, the fuller ones at the front.   Returns the soldiers' offsets [lat, back] from the block's centre of mass, and the radius of the ring round them.
export function compactBlock(n, sp, margin, rmin) {
  let bestR = 1, bestS = 1e9;
  for (let r = 1; r <= n; r++) { const c = Math.ceil(n / r), s = Math.hypot((c - 1) / 2 * sp, (r - 1) / 2 * sp * 0.92 * 1.15); if (s < bestS - 1e-9) { bestS = s; bestR = r; } }
  const rows = bestR, rel = [];
  for (let rr = 0; rr < rows; rr++) {
    const cnt = Math.floor(n * (rr + 1) / rows) - Math.floor(n * rr / rows);                  // (balanced; the extras are given to the front ranks below)
    rel.push(cnt);
  }
  rel.sort((a, b) => b - a);
  const pts = []; rel.forEach((cnt, rr) => { for (let c = 0; c < cnt; c++) pts.push([(c - (cnt - 1) / 2) * sp, rr * sp * 0.92]); });
  let cx = 0, cb = 0; for (const p of pts) { cx += p[0]; cb += p[1]; } cx /= n; cb /= n;
  let far = 0; for (const p of pts) { p[0] -= cx; p[1] -= cb; far = Math.max(far, Math.hypot(p[0], p[1])); }
  return { pts, rows, cols: rel[0], R: Math.max(rmin, far + margin) };
}

// solids [[x, z, r], ...] in world metres -> [[lat, back, r], ...] in the army's own frame at the deploy point dp ({x, z, nx, nz}, n = the unit vector away from the enemy)
export const toFrame = (solids, dp) => { const tx = -dp.nz, tz = dp.nx; return (solids || []).map(([x, z, r]) => [(x - dp.x) * tx + (z - dp.z) * tz, (x - dp.x) * dp.nx + (z - dp.z) * dp.nz, r]); };

// obstacles: [[lat, back, r], ...] — standing buildings in the way (the windmill is on the plain): no ring comes nearer to one than its radius + OBST_CLEAR
const OBST_CLEAR = 3.5;
export function planArmy(army, UR = 1, deployed = true, obstacles = []) {
  const types = DEFS.order.filter((u) => army[u] > 0).sort((a, b) => tierOf(a) - tierOf(b) || rankOf(b) - rankOf(a) || DEFS.order.indexOf(a) - DEFS.order.indexOf(b));
  const u = UR / 2, K = deployed ? 1 : 0.5, GAPR = RING_GAP * u, RMIN = 4.5 * u;
  const items = types.map((type) => {
    const d = DEFS.units[type], n = army[type], sp = (d.space >= 8 ? 6.5 : d.space >= 3 ? 3.3 : 2.4) * UR / 1.5, rb = (d.space >= 8 ? 2.4 : d.space >= 3 ? 1.1 : 0.75) * UR, cb = compactBlock(n, sp, ringMargin(rb, u), RMIN), tier = tierOf(type);
    return { type, d, n, sp, tier, g: tier <= 1 ? 0 : tier <= 3 ? 1 : 2, ...cb, w: 2 * cb.R, depth: 2 * cb.R };
  });
  // THE LAYOUT.  Every block is a circle (its ring); they are put down one after the other, the strongest first, each at the free spot nearest the front and the middle (cost = depth + 0.1 x the
  // sideways distance from the middle), no nearer than RING_GAP to a ring that is already there, inside the width Wc and the muster plain.  Three groups keep the order of a real battle: the
  // heroes and the great ones (dragons, giants, big beasts, the cavalry) in front, the ordinary infantry behind them, the archers, mages and siege engines last — a block of a later group never
  // stands further forward than the middle of any block of an earlier group (so a small ring may still tuck in beside / behind a smaller one, but no archer ever stands in front of a spearman).
  const order = items.slice().sort((a, b) => a.g - b.g || (a.tier === 0 ? 0 : 1) - (b.tier === 0 ? 0 : 1) || b.R - a.R || items.indexOf(a) - items.indexOf(b));      // (the heroes first: they take the middle of the front; then the biggest rings, which the small ones tuck in beside)
  const layout = (Wc) => {
    const placed = [], side = [0, 0];
    for (const it of order) {
      let floor = 0; for (const p of placed) if (p.it.g < it.g) floor = Math.max(floor, p.b + FRONTK * p.it.R + it.R);                // (the front edge of this ring is never ahead of the middle of a ring of an earlier group)
      const R = it.R; let best = null;
      const scan = (b, l0, l1, st) => {
        const [pl, pr] = deployed ? plainOver(b - R, b + R) : [-1e9, 1e9], lo = Math.max(l0, Math.max(pl, -Wc / 2) + R), hi = Math.min(l1, Math.min(pr, Wc / 2) - R);
        for (let l = lo; l <= hi + 1e-9; l += st) {
          let ok = true; for (let k = 0; k < placed.length; k++) { const p = placed[k], dx = p.l - l, dz = p.b - b, m = p.it.R + R + GAPR - 1e-6; if (dx * dx + dz * dz < m * m) { ok = false; break; } }
          if (ok) for (let k = 0; k < obstacles.length; k++) { const o = obstacles[k], dx = o[0] - l, dz = o[1] - b, m = o[2] + R + OBST_CLEAR; if (dx * dx + dz * dz < m * m) { ok = false; break; } }
          if (!ok) continue;
          const c = b + 0.1 * Math.abs(l) + 0.00004 * side[l < 0 ? 0 : 1];
          if (!best || c < best.c - 1e-9) best = { l, b, c };
        }
      };
      for (let b = Math.max(R, floor); b < floor + R + 220; b += 1) { if (best && b > best.c) break; scan(b, -1e9, 1e9, 2); }
      if (best) { const c0 = best; for (let b = Math.max(R, floor, c0.b - 1.5); b <= c0.b + 1.5; b += 0.5) scan(b, c0.l - 2, c0.l + 2, 0.5); }
      if (!best) best = { l: 0, b: floor + R + 220, c: 0 };                                // (no room at all: cannot happen on the plain; it goes to the very back)
      placed.push({ it, l: best.l, b: best.b }); side[best.l < 0 ? 0 : 1] += R * R;
    }
    let D = 0, l0 = 1e9, l1 = -1e9; for (const p of placed) { D = Math.max(D, p.b + p.it.R); l0 = Math.min(l0, p.l - p.it.R); l1 = Math.max(l1, p.l + p.it.R); }
    return { placed, D, Wa: l1 - l0 };
  };
  // the width: the smallest one at which the army is ASPECT times wider than it is deep (or the widest the ground allows)
  const minW = items.length ? Math.max(...items.map((it) => it.w)) : 0, maxW = Math.max(minW, K * Math.min(MAX_WIDTH, plainAt(0)[1] - plainAt(0)[0]));
  let best = null;
  if (items.length) for (let Wc = minW; ; Wc += 6) {
    const Wcc = Math.min(Wc, maxW), L = layout(Wcc), score = L.Wa / Math.max(1, L.D);
    if (!best || score > best.score + 1e-9) best = { L, score, Wc: Wcc };
    if (score >= ASPECT || Wcc >= maxW) break;
  }
  // the whole army stands in the middle of the deploy point: shift it sideways as far towards the middle as every ring still keeps inside the plain
  if (best && deployed) {
    let l0 = 1e9, l1 = -1e9; for (const p of best.L.placed) { l0 = Math.min(l0, p.l - p.it.R); l1 = Math.max(l1, p.l + p.it.R); }
    let sh = -(l0 + l1) / 2; const okAt = (d) => best.L.placed.every((p) => { const [pl, pr] = plainOver(p.b - p.it.R, p.b + p.it.R); return p.l + d - p.it.R >= pl - 1e-6 && p.l + d + p.it.R <= pr + 1e-6 && obstacles.every((o) => Math.hypot(o[0] - p.l - d, o[1] - p.b) >= o[2] + p.it.R + OBST_CLEAR - 1e-6); });
    for (let k = 0; k < 12 && !okAt(sh); k++) sh *= 0.8; if (okAt(sh)) for (const p of best.L.placed) p.l += sh;
  }
  const blocks = [], pos = {}, rings = {}, groups = [[], [], []]; let back1 = 0, lat0m = 1e9, lat1m = -1e9;
  if (best) for (const p of best.L.placed) {
    const b = p.it;
    pos[b.type] = b.pts.map((q) => { const l = p.l + q[0], bk = p.b + q[1]; lat0m = Math.min(lat0m, l); lat1m = Math.max(lat1m, l); back1 = Math.max(back1, bk); return [l, bk]; });
    rings[b.type] = { l: p.l, b: p.b, r: b.R }; blocks.push(b); groups[b.g].push(b);
  }
  if (!types.length) { lat0m = lat1m = 0; }
  const shelves = groups.map((bl, g) => ({ tier: g, blocks: bl, w: 0, depth: 0 })).filter((s) => s.blocks.length);
  return { types, blocks, shelves, pos, rings, back1, lat0: lat0m, lat1: lat1m, width: best ? best.L.Wa : 0, depth: best ? best.L.D : 0 };
}

// the soldiers that march out: the whole army minus the guardians that stay home (battle.js and the home camp must agree on this, or the camp would stand in a different place at home)
export function attackRoster(a) {
  const army = { ...((a && a.army) || {}) };
  for (const [u, n] of Object.entries((a && a.guard) || {})) if (army[u]) { army[u] = Math.max(0, army[u] - n); if (!army[u]) delete army[u]; }
  return army;
}
