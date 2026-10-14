// b1_town_test.js — B1 town plan: determinism, geometry (no overlap / street / water / wall / fixed things), the affinity rules, kinds, level growth, speed, and the SAME checks on perturbed layouts
// (rings rotated +-5 deg, river shifted 20 m four ways, both at once).  The geometry here is written again from scratch (dense point sampling, no hash, no field) so it does not share a bug with the planner.
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { layoutFromGame, perturbLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_layout.js';
import { planTown, planTownFull, planTownSteps, KINDS, QUARTERS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_townplan.js';

L.setMap('night');
const base = layoutFromGame();
let fails = 0; const say = (ok, name, extra = '') => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); return ok; };
const clone = (o) => JSON.parse(JSON.stringify(o));
const hyp = (a, b) => Math.sqrt(a * a + b * b);
const DEG = Math.PI / 180;

// ---------------------------------------------------------------- independent geometry
const inRect = (r, x, z) => { const c = Math.cos(r.ry), s = Math.sin(r.ry), dx = x - r.x, dz = z - r.z, lx = dx * c - dz * s, lz = dx * s + dz * c; return [lx, lz]; };
const distToRect = (r, x, z) => { const [lx, lz] = inRect(r, x, z), qx = Math.max(-r.w / 2, Math.min(r.w / 2, lx)), qz = Math.max(-r.d / 2, Math.min(r.d / 2, lz)); return hyp(lx - qx, lz - qz); };   // 0 inside
const rectCircle = (r, c) => distToRect(r, c.x, c.z) - c.r;
const corners = (r) => { const c = Math.cos(r.ry), s = Math.sin(r.ry); return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [r.x + a * r.w / 2 * c + b * r.d / 2 * s, r.z - a * r.w / 2 * s + b * r.d / 2 * c]); };
function rectsOverlap(a, b) {                                    // exact: two convex quads overlap iff no separating axis
  const A = corners(a), B = corners(b);
  for (const P of [A, B]) for (let i = 0; i < 4; i++) {
    const p1 = P[i], p2 = P[(i + 1) % 4], ax = -(p2[1] - p1[1]), az = p2[0] - p1[0];
    let amin = 1e9, amax = -1e9, bmin = 1e9, bmax = -1e9;
    for (const q of A) { const v = q[0] * ax + q[1] * az; amin = Math.min(amin, v); amax = Math.max(amax, v); }
    for (const q of B) { const v = q[0] * ax + q[1] * az; bmin = Math.min(bmin, v); bmax = Math.max(bmax, v); }
    if (amax <= bmin || bmax <= amin) return false;
  }
  return true;
}
function segPt(px, pz, ax, az, bx, bz) { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1; let t = ((px - ax) * dx + (pz - az) * dz) / l2; t = Math.max(0, Math.min(1, t)); return hyp(px - ax - dx * t, pz - az - dz * t); }
function polyD(poly, x, z) { let d = 1e9, c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; d = Math.min(d, segPt(x, z, xj, zj, xi, zi)); } return c ? -d : d; }
const polylineD = (pts, x, z) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segPt(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; };
// points every 0.5 m along a polyline
const dense = (pts, step = 0.5) => { const o = []; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], l = hyp(bx - ax, bz - az), n = Math.max(1, Math.ceil(l / step)); for (let k = 0; k <= n; k++) o.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]); } return o; };

// ---------------------------------------------------------------- the checks of one layout
function checkLayout(tag, lay, opt = {}) {
  const T = (s) => `${tag}: ${s}`;
  const full = planTownFull(lay), P = planTown(lay, 30), by = {};
  for (const p of P) (by[p.kind] = by[p.kind] || []).push(p);
  const planned = P.filter((p) => !p.existing);
  say(full.meta.warnings.filter((w) => !/layout has no more room/.test(w)).length === 0, T('every non-house building found a place'), full.meta.warnings.filter((w) => !/no more room/.test(w)).join('; '));
  const kinds = Object.keys(by);
  say(kinds.length >= 14, T(`${kinds.length} distinct kinds at level 30 (>= 14)`), kinds.length < 14 ? 'missing: ' + Object.keys(KINDS).filter((k) => !by[k]).join(',') : '');
  for (const k of ['smokehouse', 'mint', 'refinery', 'bakery', 'butcher', 'mill', 'townhall', 'tavern', 'chapel', 'sawmill', 'masonry', 'smelter', 'jeweler']) if (!by[k]) say(false, T('kind placed: ' + k));

  // no footprint overlaps (planned vs planned, planned vs the fixed circles + the market)
  let ov = [];
  for (let i = 0; i < planned.length; i++) for (let j = i + 1; j < planned.length; j++) { const a = planned[i], b = planned[j]; if (hyp(a.x - b.x, a.z - b.z) < a.r + b.r && rectsOverlap(a, b)) ov.push(a.id + '/' + b.id); }
  const circles = [...lay.fixed.map((f) => ({ id: f.id, x: f.x, z: f.z, r: f.r })), { id: 'market', x: lay.market.x, z: lay.market.z, r: lay.market.r }];
  for (const a of planned) for (const c of circles) if (rectCircle(a, c) < 0) ov.push(a.id + '/' + c.id);
  say(ov.length === 0, T(`no footprint overlaps (${planned.length} buildings)`), ov.slice(0, 4).join(' '));

  // nothing on a street: every point of every street centre line is >= half width + 0.3 from every footprint
  const sp = []; for (const s of lay.streets) for (const q of dense(s.pts)) sp.push([q[0], q[1], s.w / 2]);
  let onS = [];
  for (const a of planned) { let m = 1e9; for (const [x, z, hw] of sp) { if (hyp(x - a.x, z - a.z) > a.r + hw + 3) continue; m = Math.min(m, distToRect(a, x, z) - hw); } if (m < 0.3) onS.push(a.id + ':' + m.toFixed(2)); }
  say(onS.length === 0, T('nothing on a street (>= 0.3 m clear of every street edge)'), onS.slice(0, 4).join(' '));

  // nothing in the water or on the quay: the stone coping reaches 6.4 m from the river's centre line
  const rp = dense(lay.river.pts); let inW = [];
  for (const a of planned) { let m = 1e9; for (const [x, z] of rp) { if (hyp(x - a.x, z - a.z) > a.r + 12) continue; m = Math.min(m, distToRect(a, x, z)); } if (m < 6.6) inW.push(a.id + ':' + m.toFixed(2)); }
  say(inW.length === 0, T('nothing in the river or on its quay (>= 6.6 m from the centre line)'), inW.slice(0, 4).join(' '));

  // inside the town wall (>= 5 m), outside the citadel's moat band, off the gates
  let bad = [];
  for (const a of planned) {
    for (const [x, z] of corners(a)) { if (polyD(lay.town, x, z) > -5) bad.push(a.id + ':wall'); if (polyD(lay.outer, x, z) < lay.moat.off + lay.moat.half + 2) bad.push(a.id + ':moat'); }
    for (const g of lay.gates) if (distToRect(a, g.x, g.z) < 10) bad.push(a.id + ':gate');
  }
  say(bad.length === 0, T('inside the wall, off the citadel moat and the gates'), [...new Set(bad)].slice(0, 4).join(' '));

  // frontage: the door side (+z) of every planned building looks at a street within 40 m
  let lost = [];
  for (const a of planned) { const fx = Math.sin(a.ry), fz = Math.cos(a.ry); let m = 1e9; for (const s of lay.streets) m = Math.min(m, polylineD(s.pts, a.x + fx * (a.d / 2 + 1), a.z + fz * (a.d / 2 + 1)) - s.w / 2); if (m > 40 && a.kind !== 'well') lost.push(a.id + ':' + m.toFixed(0)); }
  say(lost.length === 0, T('every door looks toward a street (<= 40 m)'), lost.slice(0, 4).join(' '));

  // ---- affinity rules (centre distances; the market's distance is to the square's EDGE; water = river centre line - half width)
  const wat = (x, z) => polylineD(lay.river.pts, x, z) - lay.river.half;
  { const m = (by.smokehouse || []).map((p) => wat(p.x, p.z)); say(m.length > 0 && m.every((v) => v <= 10), T(`smokehouse <= 10 m from water (${m.map((v) => v.toFixed(1)).join(', ')})`)); }
  { const T0 = lay.fixed.find((f) => f.res === 'gold' && f.kind === 'stores'), m = (by.mint || []).map((p) => hyp(p.x - T0.x, p.z - T0.z)); say(m.length > 0 && m.every((v) => v <= 60), T(`mint <= 60 m from the treasury (${m.map((v) => v.toFixed(1)).join(', ')})`)); }
  { const H = P.filter((p) => p.role === 'H'), m = (by.refinery || []).map((r) => Math.min(...H.map((h) => hyp(h.x - r.x, h.z - r.z)))); say(m.length > 0 && m.every((v) => v >= 40), T(`refinery >= 40 m from any home (${m.map((v) => v.toFixed(1)).join(', ')} of ${H.length} homes)`)); }
  { const M = lay.market, d = (by.bakery || []).map((p) => Math.min(hyp(p.x - M.x, p.z - M.z) - M.r, ...(by.mill || []).map((q) => hyp(p.x - q.x, p.z - q.z)))); say(d.length > 0 && d.every((v) => v <= 30), T(`bakery <= 30 m from the mill or the market (${d.map((v) => v.toFixed(1)).join(', ')})`)); }
  { const M = lay.market, d = (by.butcher || []).map((p) => hyp(p.x - M.x, p.z - M.z) - M.r); say(d.length > 0 && d.every((v) => v <= 40), T(`butcher <= 40 m from the market (${d.map((v) => v.toFixed(1)).join(', ')})`)); }
  { const q = new Array(QUARTERS).fill(0), C = { x: lay.town.reduce((a, p) => a + p[0], 0) / lay.town.length, z: lay.town.reduce((a, p) => a + p[1], 0) / lay.town.length };
    for (const w of by.well || []) q[Math.floor((((Math.atan2(w.z - C.z, w.x - C.x) / DEG) % 360) + 360) % 360 / (360 / QUARTERS))]++;
    say(q.every((n) => n >= 1), T(`one well in each of the ${QUARTERS} quarters (${q.join(',')})`)); }
  // soft tendencies (gated loosely): the families sit where their rule says
  { const avg = (a) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length), M = lay.market, K = lay.keep, depth = (p) => -polyD(lay.town, p.x, p.z);
    const n = by.noble || [], m = by.merchant || [], c = by.cottage || [], cr = by.craftsman || [];
    say(avg(m.map((p) => hyp(p.x - M.x, p.z - M.z))) < avg(c.map((p) => hyp(p.x - M.x, p.z - M.z))) + 5, T('merchants sit nearer the market than cottages'), `(${avg(m.map((p) => hyp(p.x - M.x, p.z - M.z))).toFixed(0)} vs ${avg(c.map((p) => hyp(p.x - M.x, p.z - M.z))).toFixed(0)} m)`);
    say(avg(n.map((p) => hyp(p.x - K.x, p.z - K.z))) < avg([...c, ...cr, ...m].map((p) => hyp(p.x - K.x, p.z - K.z))), T('nobles sit nearer the keep than the other homes'), `(${avg(n.map((p) => hyp(p.x - K.x, p.z - K.z))).toFixed(0)} vs ${avg([...c, ...cr, ...m].map((p) => hyp(p.x - K.x, p.z - K.z))).toFixed(0)} m)`);
    say(avg(c.map(depth)) <= avg([...n, ...m, ...cr].map(depth)) + 6, T('cottages sit nearer the town wall (outer lanes) than the other homes'), `(${avg(c.map(depth)).toFixed(0)} vs ${avg([...n, ...m, ...cr].map(depth)).toFixed(0)} m deep)`); }
  // industry on the side of town that faces its supply site (smelter: iron, sawmill i: lumber camp i, masonry: quarry): the angle between 'town centre -> building' and 'town centre -> site' stays under 90 deg
  { const C = { x: lay.town.reduce((a, p) => a + p[0], 0) / lay.town.length, z: lay.town.reduce((a, p) => a + p[1], 0) / lay.town.length }, ang = (p, q) => Math.abs(((Math.atan2(p.z - C.z, p.x - C.x) - Math.atan2(q.z - C.z, q.x - C.x)) / DEG + 540) % 360 - 180);
    const sites = (k) => lay.sites.filter((x) => x.kind === k).sort((a, b) => (a.id < b.id ? -1 : 1)), rows = [];
    for (const [kind, sup] of [['smelter', 'iron'], ['sawmill', 'lumber'], ['masonry', 'quarry']]) { const S = sites(sup); (by[kind] || []).forEach((p, i) => rows.push(`${kind}${i + 1}->${sup}${(i % S.length) + 1}: ${ang(p, S[i % S.length]).toFixed(0)}`)); }
    const worst = Math.max(...rows.map((r) => +r.split(': ')[1]));
    say(rows.length > 0 && worst < 90, T(`smelter / sawmill / masonry stand on the side facing their supply site (angle <= ${worst} deg, < 90)`), rows.join(', ')); }
  return P;
}

// ---------------------------------------------------------------- 1. determinism: two clones of the same layout -> byte-identical plans
{ const a = JSON.stringify(planTownFull(clone(base)).list), b = JSON.stringify(planTownFull(clone(base)).list); say(a === b && a.length > 1000, 'deterministic: two runs on the same layout are identical', `(${a.length} bytes)`); }

// ---------------------------------------------------------------- 2. speed (a fresh layout object each time = no cache)
{ const t = []; for (let i = 0; i < 3; i++) { const L2 = clone(base); const t0 = performance.now(); planTownFull(L2); t.push(performance.now() - t0); }
  console.log('INFO plan time (ms) runs 1-3 of this process: ' + t.map((v) => v.toFixed(0)).join(' / ') + '   (run 1 may be cold-JIT)');
  say(Math.min(...t) < 100, `plan time < 100 ms in node (warm best ${Math.min(...t).toFixed(0)} ms)`);
  // sliced: no single step may be a long frame job
  const L3 = clone(base), it = planTownSteps(L3); let worst = 0, steps = 0; for (;;) { const t0 = performance.now(); const d = it.step(); worst = Math.max(worst, performance.now() - t0); steps++; if (d) break; }
  say(worst < 100 && steps > 20, `sliced planning: ${steps} steps, longest ${worst.toFixed(0)} ms (< 100)`);
  say(JSON.stringify(it.result().list) === JSON.stringify(planTownFull(clone(base)).list), 'sliced plan == one-shot plan'); }

// ---------------------------------------------------------------- 3. the real layout
const P30 = checkLayout('base', base);

// ---------------------------------------------------------------- 4. level growth: counts never decrease, a building never moves or vanishes when the level rises
{ let prev = null, ok = true, why = '', bad = 0;
  const key = (p) => p.id + '@' + p.x + ',' + p.z;
  for (let lv = 1; lv <= 30; lv++) {
    const P = planTown(base, lv), cnt = {}; for (const p of P) cnt[p.kind] = (cnt[p.kind] || 0) + 1;
    if (prev) { for (const k of Object.keys(prev.cnt)) if ((cnt[k] || 0) < prev.cnt[k]) { ok = false; why += ` ${k}@${lv}`; } const now = new Set(P.map(key)); for (const p of prev.P) if (!now.has(key(p))) bad++; }
    prev = { cnt, P };
  }
  say(ok && bad === 0, 'counts per level never decrease and nothing moves between levels', why + (bad ? ` (${bad} moved/vanished)` : ''));
  const c1 = planTown(base, 1).length, c10 = planTown(base, 10).length, c20 = planTown(base, 20).length, c30 = planTown(base, 30).length;
  say(c1 < c10 && c10 < c20 && c20 < c30, `the town grows: ${c1} / ${c10} / ${c20} / ${c30} buildings at level 1 / 10 / 20 / 30`);
  const lv = (n) => new Set(planTown(base, n).map((p) => p.kind)).size; console.log(`INFO distinct kinds: lv1 ${lv(1)}, lv10 ${lv(10)}, lv20 ${lv(20)}, lv30 ${lv(30)}`);
  // an affinity rule must hold at EVERY level, not only at 30 (the plan of a level is a prefix of the level-30 plan, but check it anyway)
  let lvOk = true; const gold = base.fixed.find((f) => f.res === 'gold');
  for (let n = 1; n <= 30; n++) { const P = planTown(base, n), H = P.filter((p) => p.role === 'H'); for (const r of P.filter((p) => p.kind === 'refinery')) for (const h of H) if (hyp(h.x - r.x, h.z - r.z) < 40) lvOk = false; for (const m of P.filter((p) => p.kind === 'mint')) if (hyp(m.x - gold.x, m.z - gold.z) > 60) lvOk = false; }
  say(lvOk, 'refinery-vs-homes and mint-vs-treasury hold at every level'); }

// ---------------------------------------------------------------- 5. perturbed layouts: the rings turned 5 deg, the river slid 20 m, everything still valid
for (const [name, o] of [['rings +5 deg', { rotDeg: 5 }], ['rings -5 deg', { rotDeg: -5 }], ['river +20 m east', { riverDx: 20 }], ['river -20 m west', { riverDx: -20 }], ['river +20 m south', { riverDz: 20 }], ['river -20 m north', { riverDz: -20 }], ['rings +5 deg AND river +20 m east', { rotDeg: 5, riverDx: 20 }], ['rings -5 deg AND river -20 m north', { rotDeg: -5, riverDz: -20 }]]) {
  const lay = perturbLayout(base, o), a = planTown(lay, 30); const same = JSON.stringify(a) === JSON.stringify(P30);
  say(!same, `perturbed (${name}) really gives a different plan`);
  checkLayout(name, lay);
}

console.log(fails === 0 ? 'B1 OK' : `B1 FAILED (${fails})`);
process.exit(fails ? 1 : 0);
