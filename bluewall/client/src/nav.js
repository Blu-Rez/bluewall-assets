// Where ground units may walk.  Pure functions (no three.js), shared by the battle simulation and the unit views:
//   - water (the town moat, the river, the lake) is closed to ground units; the stone bridges in front of the gates are the only crossings,
//   - on a bridge a unit stands on the deck (not on the river bed under it),
//   - route(): a shortest path around the water (A* on a 2.5 m grid, string-pulled), used when the straight line to a target crosses water.
// The terrain height function is injected (layout.height in tests, the baked terrain grid in the game), so it works headless too.
import { buildRoads } from './roads.js';

const CELL = 2.5, HALF = 440, N = Math.ceil((2 * HALF) / CELL);          // grid covers -440..440 m (the playable valley is well inside; p38: the valley grew by 33 m)
const WET = -0.3;                                                        // terrain below this is water (the surface sits at -0.75; the quay drops steeply)
const DECK = 0.72;                                                       // top of the bridge deck
const idx = (i, j) => j * N + i;
const ci = (v) => Math.max(0, Math.min(N - 1, Math.floor((v + HALF) / CELL)));
const cc = (i) => -HALF + (i + 0.5) * CELL;

// bridges the kingdom builds in front of its gates (castle.js: the box is 17 m long along the gate normal, 7.6 m wide between two parapets)
export function bridgesFromLayout(L) {
  buildRoads();                                    // (p38: the bridges over the river are added by the roads (roads.js autoBridges): the road network must exist before the bridges are listed)
  const out = [];
  const add = (G, poly, off, len, wid) => {
    if (!G || !poly) return;
    const a = poly[G.seg], b = poly[(G.seg + 1) % poly.length], al = Math.hypot(b[0] - a[0], b[1] - a[1]);
    out.push({ x: G.x + G.nx * off, z: G.z + G.nz * off, nx: G.nx, nz: G.nz, tx: (b[0] - a[0]) / al, tz: (b[1] - a[1]) / al, len, wid, y: DECK });
  };
  if (L.TOWN && L.MOAT2) for (const G of L.TGATES) add(G, L.TOWN, L.MOAT2.off + 0.5, 17, 7.6);
  for (const R of L.RBRIDGES || []) out.push({ x: R.x, z: R.z, nx: R.nx, nz: R.nz, tx: -R.nz, tz: R.nx, len: R.len, wid: R.wid, y: DECK });
  if (L.MOAT && L.MOAT.on && L.GATE) add(L.GATE, L.OUTER, L.MOAT.off + 0.5, 16, 8.2);
  return out;
}

// height to stand at: the bridge deck when on a bridge (blended into the bank over the last 2.5 m), the terrain otherwise (shared with the home map's walkers)
export function makeGroundY(bridges) {
  const local = (b, x, z) => { const dx = x - b.x, dz = z - b.z; return [dx * b.nx + dz * b.nz, dx * b.tx + dz * b.tz]; };
  return (x, z, terrain) => {
    for (const b of bridges) {
      const [u, v] = local(b, x, z), hl = b.len / 2, hw = b.wid / 2;
      if (Math.abs(v) > hw || Math.abs(u) > hl + 1) continue;
      const k = Math.max(0, Math.min(1, (hl - Math.abs(u)) / 2.5)), ky = Math.max(0, Math.min(1, (hw - Math.abs(v)) / 0.8));
      return Math.max(terrain, terrain + (b.y - terrain) * k * ky);
    }
    return terrain;
  };
}

export function buildNav({ height, bridges = [], solids = [] }) {
  const state = new Uint8Array(N * N);                                   // 0 = not looked at yet, 1 = dry, 2 = wet
  // standing buildings (the farmhouse, the cottages, the mill): [[x, z, r], ...] — the cells under them are closed to ground units, like water (but they are not water: no wake, no wading through)
  const sol = new Uint8Array(N * N);
  for (const [sx, sz, sr] of solids) {
    const i0 = ci(sx - sr - 1), i1 = ci(sx + sr + 1), j0 = ci(sz - sr - 1), j1 = ci(sz + sr + 1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (Math.hypot(cc(i) - sx, cc(j) - sz) < sr + 0.9) sol[idx(i, j)] = 1;
  }
  const isSolid = (x, z) => { if (!solids.length || x < -HALF || x > HALF || z < -HALF || z > HALF) return false; return sol[idx(ci(x), ci(z))] === 1; };
  const WALK_W = (b) => b.wid / 2 - 1.1;                                 // clear width between the parapets (minus a unit's half width)
  const local = (b, x, z) => { const dx = x - b.x, dz = z - b.z; return [dx * b.nx + dz * b.nz, dx * b.tx + dz * b.tz]; };      // [along the bridge, across it]
  const onBridge = (x, z, ext = 0) => {
    for (const b of bridges) { const [u, v] = local(b, x, z); if (Math.abs(u) <= b.len / 2 + ext && Math.abs(v) <= WALK_W(b)) return b; }
    return null;
  };
  const wetAt = (x, z) => height(x, z) < WET;
  const cell = (i, j) => {
    const k = idx(i, j); let s = state[k];
    if (s) return s === 2;
    const x = cc(i), z = cc(j);
    // a cell is wet when its middle or any of four points ~1 m off the middle is under water (keeps units a body's width off the shore)
    const raw = wetAt(x, z) || wetAt(x + 1.1, z) || wetAt(x - 1.1, z) || wetAt(x, z + 1.1) || wetAt(x, z - 1.1);
    if (!raw) { state[k] = 1; return false; }
    state[k] = onBridge(x, z, 2.5) ? 3 : 2; return state[k] === 2;              // 3 = water that a bridge deck spans (walkable, but not without the bridge)
  };
  const isWet = (x, z) => {
    if (x < -HALF || x > HALF || z < -HALF || z > HALF) return false;
    return cell(ci(x), ci(z)) && !onBridge(x, z, 2.5);                  // (same answer as bridge-first, but dry ground never builds the bridge arrays)
  };
  const isBlocked = (x, z) => isWet(x, z) || isSolid(x, z);              // closed to a walking soldier: water, or a building
  const blk = (i, j) => cell(i, j) || sol[idx(i, j)] === 1;
  // straight line free of water?
  const clear = (ax, az, bx, bz) => {
    const d = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(d / 1.6));
    for (let i = 1; i <= n; i++) { const t = i / n; if (isBlocked(ax + (bx - ax) * t, az + (bz - az) * t)) return false; }
    return true;
  };
  // closest dry spot to (x,z) (spiral by rings of cells)
  const nearestDry = (x, z, maxR = 60) => {
    if (!isBlocked(x, z)) return [x, z];
    const i0 = ci(x), j0 = ci(z), R = Math.ceil(maxR / CELL);
    let best = null, bd = 1e9;
    for (let r = 1; r <= R; r++) {
      for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= N || j >= N || blk(i, j)) continue;
        const d = Math.hypot(cc(i) - x, cc(j) - z); if (d < bd) { bd = d; best = [cc(i), cc(j)]; }
      }
      if (best) return best;
    }
    return [x, z];
  };
  // ---- which dry region a cell belongs to when the bridges are NOT counted (a ring of moat cuts the map into regions; the bridges are the only links).
  // Knowing that up front lets route() skip every A* that cannot succeed (the 15 000-node dead ends that made the 30-100 ms steps).
  const comp = new Int32Array(N * N); let compN = 0, compDone = false;
  const inR = (i, j) => { const x = cc(i), z = cc(j); return x * x + z * z < 330 * 330; };           // (the same disc the loading screen warms up)
  const label = () => {
    if (compDone) return;
    const stack = new Int32Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k0 = idx(i, j); if (comp[k0] || !inR(i, j) || blk(i, j) || state[k0] === 3) continue;
      compN++; let sp = 0; stack[sp++] = k0; comp[k0] = compN;
      while (sp) {
        const k = stack[--sp], ki = k % N, kj = (k / N) | 0;
        for (let d = 0; d < 4; d++) {
          const ni = ki + (d === 0 ? 1 : d === 1 ? -1 : 0), nj = kj + (d === 2 ? 1 : d === 3 ? -1 : 0); if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
          const nk = idx(ni, nj); if (comp[nk] || !inR(ni, nj) || blk(ni, nj) || state[nk] === 3) continue;
          comp[nk] = compN; stack[sp++] = nk;
        }
      }
    }
    compDone = true;
  };
  const regionOf = (x, z) => { label(); const [dx, dz] = isBlocked(x, z) ? nearestDry(x, z, 40) : [x, z]; const k = idx(ci(dx), ci(dz)); return state[k] === 3 ? 0 : comp[k]; };       // 0 = unknown (outside the disc / on a deck)
  // ---- A*
  let nodesTotal = 0;                                                      // A* nodes expanded so far (the battle uses it to spread the planning over the frames)
  const gS = new Float32Array(N * N), stamp = new Int32Array(N * N), from = new Int32Array(N * N), closed = new Int32Array(N * N); let gen = 0;
  const heap = []; // [f, idx] pairs flattened
  const push = (f, k) => { heap.push(f, k); let i = heap.length / 2 - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p * 2] <= heap[i * 2]) break; const tf = heap[p * 2], tk = heap[p * 2 + 1]; heap[p * 2] = heap[i * 2]; heap[p * 2 + 1] = heap[i * 2 + 1]; heap[i * 2] = tf; heap[i * 2 + 1] = tk; i = p; } };
  const pop = () => {
    const k = heap[1], n = heap.length / 2 - 1; heap[0] = heap[n * 2]; heap[1] = heap[n * 2 + 1]; heap.length -= 2;
    let i = 0; for (;;) { let l = i * 2 + 1, r = l + 1, m = i; if (l < n && heap[l * 2] < heap[m * 2]) m = l; if (r < n && heap[r * 2] < heap[m * 2]) m = r; if (m === i) break; const tf = heap[m * 2], tk = heap[m * 2 + 1]; heap[m * 2] = heap[i * 2]; heap[m * 2 + 1] = heap[i * 2 + 1]; heap[i * 2] = tf; heap[i * 2 + 1] = tk; i = m; }
    return k;
  };
  const DI = [1, -1, 0, 0, 1, 1, -1, -1], DJ = [0, 0, 1, -1, 1, -1, 1, -1], DC = [1, 1, 1, 1, 1.4142, 1.4142, 1.4142, 1.4142];
  // -> [[x,z], ...] (the last one is the goal) or null when the goal cannot be reached on dry ground
  const astar = (ax, az, bx, bz, maxNodes) => {
    const [sx, sz] = isBlocked(ax, az) ? nearestDry(ax, az, 30) : [ax, az], [gx, gz] = isBlocked(bx, bz) ? nearestDry(bx, bz, 40) : [bx, bz];
    const si = ci(sx), sj = ci(sz), gi = ci(gx), gj = ci(gz), sk = idx(si, sj), gk = idx(gi, gj);
    gen++; heap.length = 0; gS[sk] = 0; stamp[sk] = gen; from[sk] = -1;
    const hh = (i, j) => { const dx = Math.abs(i - gi), dz = Math.abs(j - gj); return (Math.max(dx, dz) + 0.4142 * Math.min(dx, dz)) * CELL; };
    push(hh(si, sj), sk); let nodes = 0, found = false;
    while (heap.length && nodes < maxNodes) {
      const k = pop(); if (closed[k] === gen) continue; closed[k] = gen; nodes++;
      if (k === gk) { found = true; break; }
      const i = k % N, j = (k / N) | 0;
      for (let d = 0; d < 8; d++) {
        const di = DI[d], dj = DJ[d], ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
        if (blk(ni, nj)) continue;
        if (di && dj && (blk(i + di, j) || blk(i, j + dj))) continue;                 // no cutting corners across the water
        const nk = idx(ni, nj), g = gS[k] + DC[d] * CELL;
        if (stamp[nk] !== gen) { stamp[nk] = gen; gS[nk] = 1e9; }
        if (g < gS[nk]) { gS[nk] = g; from[nk] = k; push(g + hh(ni, nj), nk); }
      }
    }
    nodesTotal += nodes;
    if (!found) return null;
    const raw = []; for (let k = gk; k !== -1 && k !== undefined; k = from[k]) { raw.push([cc(k % N), cc((k / N) | 0)]); if (k === sk) break; }
    raw.reverse(); raw[raw.length - 1] = [gx, gz];
    // string-pulling: skip every waypoint that the unit can reach in a straight line
    const out = []; let cur = [ax, az], i = 0;
    while (i < raw.length) {
      let j = raw.length - 1; while (j > i && !clear(cur[0], cur[1], raw[j][0], raw[j][1])) j--;
      out.push(raw[j]); cur = raw[j]; i = j + 1;
    }
    return out;
  };
  // height to stand at: the bridge deck when on a bridge (blended into the bank over the last 2 m), the terrain otherwise
  const groundY = makeGroundY(bridges);
  // Route a -> b.  A* first (cheap when the water is a small obstacle); when that gives up (the goal is behind a whole ring of moat, so the search would have to
  // sweep half the map) go via a bridge: start -> one end of the deck -> the other end -> goal, whichever bridge makes the shortest walk.
  const route = (ax, az, bx, bz) => {
    const ra = regionOf(ax, az), rb = regionOf(bx, bz), known = ra > 0 && rb > 0;
    const direct = astar(ax, az, bx, bz, 3500); if (direct) return direct;
    if (known && ra === rb) return astar(ax, az, bx, bz, 9000);                      // one dry region but a long way round: search longer instead of wandering over a bridge
    let cand = [];
    for (const b of bridges) for (const s of [1, -1]) {
      const e1 = [b.x + b.nx * s * (b.len / 2 + 1.5), b.z + b.nz * s * (b.len / 2 + 1.5)], e2 = [b.x - b.nx * s * (b.len / 2 + 1.5), b.z - b.nz * s * (b.len / 2 + 1.5)];
      cand.push({ L: Math.hypot(e1[0] - ax, e1[1] - az) + b.len + 3 + Math.hypot(bx - e2[0], bz - e2[1]), e1, e2 });
    }
    cand.sort((p, q) => p.L - q.L);
    if (known) { const fit = cand.filter((c) => regionOf(c.e1[0], c.e1[1]) === ra && regionOf(c.e2[0], c.e2[1]) === rb); if (fit.length) cand = fit; }      // only the bridges that really link the two regions
    const leg = (x0, z0, x1, z1) => (clear(x0, z0, x1, z1) ? [[x1, z1]] : astar(x0, z0, x1, z1, 6000));
    for (const c of cand.slice(0, 4)) {
      const l1 = leg(ax, az, c.e1[0], c.e1[1]); if (!l1) continue;
      const l3 = leg(c.e2[0], c.e2[1], bx, bz); if (!l3) continue;
      return l1.concat([c.e2], l3);
    }
    return null;
  };
  // look at every dry/wet cell of the valley ahead of time (rows j0..j1-1), a slice at a time while the loading screen is up:
  // the routes planned in the middle of a battle then never pay for terrain lookups (that was the main cost of a plan on a phone)
  const warm = (j0, j1) => {
    for (let j = Math.max(0, j0); j < Math.min(N, j1); j++) for (let i = 0; i < N; i++) { const x = cc(i), z = cc(j); if (x * x + z * z < 330 * 330) cell(i, j); }
    if (j1 >= N) label();                                                            // the last slice of the loading screen also draws the region map
  };
  return { isWet, isBlocked, isSolid, solids, clear, route, nearestDry, groundY, onBridge, bridges, warm, rows: N, nodes: () => nodesTotal, regionOf };
}
