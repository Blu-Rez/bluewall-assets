// gr1r3_bridge_test.mjs (GR1_R3 / QA1-001..005) — headless: the render grid of terrain.js (same lines as buildTerrain, quality high), with and without carveBridgeEnds(), and what the hero can do on it.
//   node --no-warnings dev/gr1r3_bridge_test.mjs [--before] [--verbose]       prints GR1R3 BRIDGES OK / FAILED
// 1) slope scan: along the axis of every river-bridge end (and 1.5 m either side of it) the rise per metre of the ground she stands on (terrain grid + deck, nav.js makeGroundY), from the middle of the deck to 60 m beyond the head
// 2) walker proxy: the 26 bridge crossings of QA1 (work/qa1/diag.json legs; BFS on a 1 m grid, a step is allowed when rise <= 0.85 x run + 0.06 (rpg.js tryMove), any water (< -0.3 m) is closed except on a deck: no fording, a crossing has to use the bridge)
// 3) the carve only lowers: no grid vertex is raised, nothing under the deck level (0.72 m) is touched, and only the 13 river bridges' surroundings change
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { carveBridgeEnds, RAMPS, RAMP } from '/home/claude/bot/bluebot_v2/bluewall/client/src/terrain.js';
import { bridgesFromLayout, makeGroundY } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
const ARGV = process.argv.slice(2), BEFORE = ARGV.includes('--before'), VERBOSE = ARGV.includes('--verbose');
L.setMap('night'); buildRoads();

// ---- the render grid (a copy of the grid lines of terrain.js buildTerrain; quality 'high' = SEG0 300)
const EXTENT = 960, SEG0 = 300, half = [0];
for (let x = 0; x < EXTENT;) {
  let st = Math.max(4 * Math.sqrt(Math.max(x, 1) * EXTENT) / SEG0, 2.4);
  if (x > 420) st *= 1 + 0.5 * Math.min(1, (x - 420) / 300);
  st *= 1 - 0.55 * Math.min(1, Math.max(0, (x - 92) / 20)) * Math.min(1, Math.max(0, (208 - x) / 20));
  x = Math.min(EXTENT, x + st); if (EXTENT - x < st * 0.4) x = EXTENT; half.push(x);
}
const n = half.length * 2 - 1, SEG = n - 1, MID = half.length - 1, xs = new Float32Array(n);
for (let i = 0; i < half.length; i++) { xs[MID + i] = half[i]; xs[MID - i] = -half[i]; }
const base = new Float32Array(n * n);
for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) base[j * n + i] = L.height(xs[i], xs[j]);
const hs = Float32Array.from(base);
if (!BEFORE) { const t0 = performance.now(); carveBridgeEnds(xs, n, hs); console.log('carveBridgeEnds: ' + (performance.now() - t0).toFixed(1) + ' ms for ' + n + 'x' + n + ' vertices (' + RAMPS.length + ' ramps)'); }
const lineOf = (v) => { let lo = 0, hi = SEG; if (v <= xs[0]) return 0; if (v >= xs[SEG]) return SEG - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= v) lo = m; else hi = m; } return lo; };
const fastHeight = (x, z) => {                                              // = terrain.js fastHeight (same diagonal split)
  const i = lineOf(x), j = lineOf(z), x0 = xs[i], x1 = xs[i + 1], z0 = xs[j], z1 = xs[j + 1];
  const tx = Math.min(1, Math.max(0, (x - x0) / (x1 - x0))), tz = Math.min(1, Math.max(0, (z - z0) / (z1 - z0)));
  const a = hs[j * n + i], b = hs[j * n + i + 1], c = hs[(j + 1) * n + i], d = hs[(j + 1) * n + i + 1];
  return tx + tz <= 1 ? a + (b - a) * tx + (c - a) * tz : d + (c - d) * (1 - tx) + (b - d) * (1 - tz);
};
const bridges = bridgesFromLayout(L), deck = makeGroundY(bridges);
const ground = (x, z) => deck(x, z, fastHeight(x, z));
const fails = [], lines = [], say = (s) => { lines.push(s); if (VERBOSE) console.log(s); };

// ---- 3) the carve only lowers
{
  let raised = 0, lowered = 0, maxCut = 0, under = 0, far = 0, above = 0, maxFill = 0;
  const rb = L.RBRIDGES;
  for (let k = 0; k < n * n; k++) {
    const dlt = hs[k] - base[k]; if (dlt > 1e-6) { raised++; if (hs[k] > 0.72 + 1e-3) above++; maxFill = Math.max(maxFill, dlt); }
    if (dlt < -1e-6) {
      lowered++; maxCut = Math.max(maxCut, -dlt); if (hs[k] < 0.42 - 1e-3 && base[k] >= 0.42) under++;
      const x = xs[k % n], z = xs[(k / n) | 0]; if (!rb.some((b) => Math.hypot(b.x - x, b.z - z) < 140)) far++;
    }
  }
  say(`carve: ${lowered} vertices lowered (max cut ${maxCut.toFixed(2)} m), ${raised} raised (max fill ${maxFill.toFixed(2)} m; ${above} of them above the deck level), ${under} cut below 0.42 m, ${far} lowered farther than 140 m from any river bridge`);
  if (!BEFORE) { if (maxFill > RAMP.maxFill + 1e-3) fails.push(`fill ${maxFill.toFixed(2)} m > ${RAMP.maxFill}`); if (under) fails.push(`${under} vertices cut below 0.42 m`); if (far) fails.push(`${far} vertices changed far from a bridge`); }
}
// ---- the ramps the carve made
for (const R of RAMPS) say(`ramp bridge ${R.bridge} ${R.end}: ` + (R.skip ? `SKIPPED (${R.skip}) ds=${R.ds ?? '-'}` : `ds ${R.ds.toFixed(1)} -> daylight ${R.dd.toFixed(1)} m  (ramp ${(R.dd - R.ds).toFixed(1)} m long, max cut ${R.cut.toFixed(1)} m, flat half width ${R.hw.toFixed(1)} m, grid cell ${R.cell.toFixed(1)} m)`));

// ---- 1) slope scan along each bridge end
const scan = [];
L.RBRIDGES.forEach((b, bi) => {
  const tx = -b.nz, tz = b.nx, hl = b.len / 2;
  for (const s of [1, -1]) {
    const nx = b.nx * s, nz = b.nz * s; let worst = 0, at = 0, bestLat = 0, hAt = 0;
    for (const lat of [-1.5, 0, 1.5]) {
      let py = null, pd = null;
      const rec0 = RAMPS.find((q) => q.bridge === bi + 1 && q.end === (s > 0 ? '+n' : '-n')), dEnd = rec0 && !rec0.skip ? rec0.dd : hl + 60;     // only the carved part: past the daylight point it is natural hill
      for (let d = 0; d <= dEnd; d += 0.25) {
        const x = b.x + nx * d + tx * lat, z = b.z + nz * d + tz * lat, y = ground(x, z);
        if (py != null) { const sl = (y - py) / (d - pd); if (sl > worst) { worst = sl; at = d; bestLat = lat; hAt = y; } }
        py = y; pd = d;
      }
    }
    scan.push({ bridge: bi + 1, end: s > 0 ? '+n' : '-n', worst, at, lat: bestLat, y: hAt });
  }
});
for (const r of scan) say(`slope scan bridge ${String(r.bridge).padStart(2)} ${r.end}: steepest rise ${r.worst.toFixed(2)} m/m (at ${r.at.toFixed(1)} m from the middle, lateral ${r.lat}, y ${r.y.toFixed(1)})`);
const FIVE = [6, 7, 8, 12, 13];
const SLOPE_MAX = 0.6;
if (!BEFORE) for (const r of scan) {
  if (!FIVE.includes(r.bridge)) continue;
  const rec = RAMPS.find((q) => q.bridge === r.bridge && q.end === r.end);
  if (rec && !rec.skip && r.worst > SLOPE_MAX + 1e-6) fails.push(`bridge ${r.bridge} ${r.end}: steepest rise ${r.worst.toFixed(2)} m/m > ${SLOPE_MAX}`);
}

// ---- 2) walker proxy: BFS on a 1 m grid
function walk(from, to) {
  const pad = 30, x0 = Math.floor(Math.min(from[0], to[0]) - pad), x1 = Math.ceil(Math.max(from[0], to[0]) + pad), z0 = Math.floor(Math.min(from[1], to[1]) - pad), z1 = Math.ceil(Math.max(from[1], to[1]) + pad);
  const W = x1 - x0 + 1, Hh = z1 - z0 + 1, gy = new Float32Array(W * Hh);
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) gy[j * W + i] = ground(x0 + i, z0 + j);
  // no fording: any water (nav.js WET -0.3) is closed except on a deck, so a crossing has to use the bridge
  const wet = (i, j) => { const x = x0 + i, z = z0 + j; if (fastHeight(x, z) >= -0.3) return false; return !bridges.some((b) => { const dx = x - b.x, dz = z - b.z, u = dx * b.nx + dz * b.nz, v = dx * b.tx + dz * b.tz; return Math.abs(u) <= b.len / 2 + 1 && Math.abs(v) <= b.wid / 2 - 0.35; }); };
  const si = Math.round(from[0] - x0), sj = Math.round(from[1] - z0), ti = Math.round(to[0] - x0), tj = Math.round(to[1] - z0);
  const seen = new Uint8Array(W * Hh), par = new Int32Array(W * Hh).fill(-1), q = [sj * W + si]; seen[q[0]] = 1; let best = Infinity, bestAt = q[0];
  for (let h = 0; h < q.length; h++) {
    const k = q[h], i = k % W, j = (k / W) | 0, dd = Math.hypot(i - ti, j - tj); if (dd < best) { best = dd; bestAt = k; } if (dd <= 1.5) { const path = []; for (let t = k; t >= 0; t = par[t]) path.push([x0 + (t % W), z0 + ((t / W) | 0), gy[t]]); return { ok: true, near: dd, path: path.reverse() }; }
    for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) {
      if (!a && !c) continue; const ni = i + a, nj = j + c; if (ni < 0 || nj < 0 || ni >= W || nj >= Hh) continue; const nk = nj * W + ni; if (seen[nk]) continue;
      const run = Math.hypot(a, c), rise = gy[nk] - gy[k]; if (rise > 0.75 * run || -rise > 1.6 * run) continue;      // rpg.js dev.walkTo: uphill 0.75 m/m, downhill 1.6 m/m if (wet(ni, nj)) continue;
      seen[nk] = 1; par[nk] = k; q.push(nk);
    }
  }
  return { ok: false, near: best, x: x0 + (bestAt % W), z: z0 + ((bestAt / W) | 0), y: gy[bestAt] };
}
const diag = [];                                                              // the 26 crossings of QA1 (work/qa1/diag.json): station A / B = the middle of the bridge -/+ n * (len / 2 + 9)
L.RBRIDGES.forEach((b, bi) => { const k = b.len / 2 + 9, A = [b.x - b.nx * k, b.z - b.nz * k], B = [b.x + b.nx * k, b.z + b.nz * k], id = String(bi + 1).padStart(2, '0'); diag.push({ name: `bridge${id}_AtoB`, from: A, to: B }, { name: `bridge${id}_BtoA`, from: B, to: A }); });
let pass = 0; const bad = [];
for (const q of diag) {
  // start on the deck itself (the hero 'drops onto' it from her station), end at the far station
  const r = walk(q.from, q.to); if (process.env.TRACE === q.name) { const P = r.path || []; console.log('TRACE', q.name, 'cells', P.length, P.filter((_, i) => i % 4 === 0).map((p) => `(${p[0]},${p[1]}) y${p[2].toFixed(1)}`).join(' ')); } if (r.ok) pass++; else bad.push(q.name + ` (stops ${r.near.toFixed(1)} m short at (${r.x.toFixed(1)}, ${r.z.toFixed(1)}) y ${r.y.toFixed(2)})`);
}
say(`walker proxy: ${pass} of ${diag.length} bridge crossings pass` + (bad.length ? '; FAIL: ' + bad.join('; ') : ''));
if (!BEFORE && bad.length) fails.push(...bad.map((b) => 'walk ' + b));


// ---- 2b) the straight shortcut she steers along (rpg.js walkTo aims at the farthest waypoint she can see and ignores slope): from the middle of the deck out along the axis to the station, frame by frame, tryMove rule rise <= 0.85 x run + 0.06 (run 0.27 m = 8 m/s at 30 Hz)
const ends = [];
L.RBRIDGES.forEach((b, bi) => {
  const hl = b.len / 2;
  for (const s of [1, -1]) {
    const nx = b.nx * s, nz = b.nz * s, goal = hl + 9; let d = 0, y = ground(b.x, b.z), blocked = null;
    while (d < goal) { const nd = Math.min(goal, d + 0.27), ny = ground(b.x + nx * nd, b.z + nz * nd); if (ny - y > 0.85 * (nd - d) + 0.06) { blocked = { d, y, ny }; break; } d = nd; y = ny; }
    ends.push({ bridge: bi + 1, end: s > 0 ? '+n' : '-n', ok: !blocked, blocked });
  }
});
const endsBad = ends.filter((e) => !e.ok);
say(`axis walker (8 m/s, limit 1.07 m/m): ${ends.length - endsBad.length} of ${ends.length} bridge ends reach the station 9 m beyond the head from the middle of the deck` + (endsBad.length ? '; blocked: ' + endsBad.map((e) => `${e.bridge}${e.end} at ${e.blocked.d.toFixed(1)} m (y ${e.blocked.y.toFixed(2)} -> ${e.blocked.ny.toFixed(2)})`).join(', ') : ''));
if (!BEFORE) for (const e of endsBad) { const rec = RAMPS.find((q) => q.bridge === e.bridge && q.end === e.end); if (rec && !rec.skip) fails.push(`axis walker blocked on the ramp of bridge ${e.bridge} ${e.end} at ${e.blocked.d.toFixed(1)} m`); }

if (!VERBOSE) for (const l of lines) console.log(l);
console.log(BEFORE ? 'GR1R3 BRIDGES BEFORE (no carve): ' + pass + '/' + diag.length : fails.length ? 'GR1R3 BRIDGES FAILED: ' + fails.join(' | ') : 'GR1R3 BRIDGES OK');
process.exit(!BEFORE && fails.length ? 1 : 0);
