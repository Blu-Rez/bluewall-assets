// Where the tents of the attacker's camp stand (pure maths, no three.js — camp.js builds the meshes, dev/camp_plan_test.js checks it in node).
// Owner 6 Oct 14:16: «the tents must be BEHIND the army — a horizontal band right behind it, on the mountain side, real and pretty;  the army is wide, not a tall rectangle».
//   planCamp({ plan, squads, height, blocked, seed }) -> { pole: {l, b, r}, items: [{ i, l, b, r, k, yaw, slope, rel }], Bs, latC, halfW }
//   plan    = planArmy(...)  (the same one the battle lines the soldiers up by: plan.back1 = the back edge of the last rank, plan.lat0 / plan.lat1 = its width)
//   squads  = [{ k }]  one tent per squad, k = its size factor (tent radius = 4.15 k)
//   height(l, b) = ground height at lateral l / back b (metres, b = away from the enemy base);  blocked(l, b, r) = something solid (a house, a field, a building of the base) is in the way
// The tents stand in a band as wide as the army (wider where the ground allows), as close behind its last rank as the ground permits: every tent takes the free spot with the lowest
// cost = distance behind the army + a little for the sideways distance from the middle + a lot for a steep spot;  exactly GAP away from the tents already there (the cost also
// prefers a spot that touches its neighbours, so the gaps are all the same), on ground a tent can be pitched on (mountain slope up to SMAX, never water).

export const FRONT = 15;                    // the clear ground between the last rank of soldiers and the first tent
export const GAP = 3.4;                     // the same gap between any two tents
const SMAX = 0.62, SMAX2 = 0.95;            // the steepest ground a tent is pitched on (rise / run): ordinary / only if nothing else is left

export function planCamp({ plan, squads, height, blocked, seed = 1 }) {
  const TAU = Math.PI * 2, n = squads.length;
  let sd = (seed >>> 0) || 1; const rnd = () => { sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0; return sd / 4294967296; };
  const latC = plan.types && plan.types.length ? (plan.lat0 + plan.lat1) / 2 : 0, aw = plan.types && plan.types.length ? (plan.lat1 - plan.lat0) / 2 : 12;
  const Bs = Math.max(34, plan.back1 + FRONT + 4);
  const halfW = Math.max(46, Math.min(150, aw + 34));
  const hz = (l, b) => height(l, b);
  // ground test of a tent of radius r: no water (shore), the rise across its footprint, nothing solid
  const probe = new Map();
  const ground = (l, b, r) => {
    const key = Math.round(l * 2) + ',' + Math.round(b * 2) + ',' + Math.round(r * 2); let v = probe.get(key); if (v) return v;
    let lo = 1e9, hi = -1e9; const R = r * 0.85;
    for (let k = 0; k < 9; k++) { const a = k * TAU / 8, h = hz(l + (k ? Math.cos(a) * R : 0), b + (k ? Math.sin(a) * R : 0)); lo = Math.min(lo, h); hi = Math.max(hi, h); }
    v = { lo, slope: (hi - lo) / (1.7 * R), free: !blocked(l, b, r) }; probe.set(key, v); return v;
  };
  const items = [];
  const GAPK = (A, B) => A.r + B.r + GAP;
  const fits = (l, b, r) => { for (const t of items) if (Math.hypot(t.l - l, t.b - b) < t.r + r + GAP - 1e-6) return false; return true; };
  const slack = (l, b, r) => { let m = 1e9; for (const t of items) m = Math.min(m, Math.hypot(t.l - l, t.b - b) - t.r - r - GAP); return m === 1e9 ? 0 : Math.max(0, m); };
  const wl = 0.13;
  const cost = (l, b, r, g, hash) => (b - Bs) + wl * Math.abs(l - latC) + 26 * Math.max(0, g.slope - 0.12) + 1.6 * slack(l, b, r) + hash * 2.2;
  const hash = (l, b) => { let h = Math.imul(Math.round(l * 4) * 73856093 ^ Math.round(b * 4) * 19349663 ^ seed, 2654435761) >>> 0; return (h & 1023) / 1023; };
  const search = (r, smax, region) => {
    let best = null;
    const l0 = latC - halfW - region * 0.8, l1 = latC + halfW + region * 0.8, b0 = Bs - 2, b1 = Bs + 40 + region * 1.2;
    const scan = (la, lb, ba, bb, st) => {
      for (let b = ba; b <= bb; b += st) for (let l = la; l <= lb; l += st) {
        if (!fits(l, b, r)) continue;
        const g = ground(l, b, r); if (!g.free || g.lo < 0.6 || g.slope > smax) continue;
        const c = cost(l, b, r, g, hash(l, b)); if (!best || c < best.c) best = { l, b, c, g };
      }
    };
    scan(l0, l1, b0, b1, 2.5);
    if (best) { const c0 = best; scan(c0.l - 2.5, c0.l + 2.5, Math.max(Bs - 2, c0.b - 2.5), c0.b + 2.5, 0.5); }
    return best;
  };
  // the standard: in the middle of the band, as near the army as the ground allows
  let pole = null;
  for (const [sm, reg] of [[0.5, 0], [SMAX, 30], [SMAX2, 70]]) {
    for (let rho = 0; rho < 140 && !pole; rho += 2) for (let s = 0; s < Math.max(1, Math.round(rho * 0.7)) && !pole; s++) {
      const a = s / Math.max(1, Math.round(rho * 0.7)) * TAU, l = latC + Math.cos(a) * rho * 1.4, b = Bs + 3 + Math.abs(Math.sin(a)) * rho * (Math.sin(a) < 0 ? 0.3 : 1);
      const g = ground(l, b, 6); if (g.free && g.lo > 0.6 && g.slope <= sm) pole = { l, b, r: 3.2, slope: g.slope };
    }
    if (pole) break;
  }
  const poleFound = !!pole; if (!pole) pole = { l: latC, b: Bs + 3, r: 3.2, slope: 0 };
  items.push({ i: -1, l: pole.l, b: pole.b, r: pole.r + 4.5, pole: true });             // (a tent keeps a little further away from the standard)
  const order = squads.map((q, i) => ({ q, i, k: q.k })).sort((A, C) => C.k - A.k || A.i - C.i);
  let fallback = 0;
  const placed = [];
  for (const o of order) {
    const r = 4.15 * o.k; let put = null;
    for (const [sm, reg] of [[0.5, 0], [SMAX, 0], [SMAX, 20], [0.8, 20], [0.8, 45], [SMAX2, 45], [SMAX2, 90]]) { const b = search(r, sm, reg); if (b) { put = b; if (sm > SMAX || reg > 20) fallback++; break; } }
    if (!put) { fallback += 100; put = { l: pole.l + 40 + placed.length * 9, b: Bs + 30, g: { slope: 0 } }; }
    const t = { i: o.i, l: put.l, b: put.b, r, k: o.k, yaw: rnd() * TAU, slope: put.g.slope };
    items.push(t); placed.push(t);
  }
  items.shift();
  return { pole, items: placed.sort((A, C) => A.i - C.i), Bs, latC, halfW, poleFound, fallback };
}
