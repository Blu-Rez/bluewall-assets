// AN1_R2 (15 Oct 2026) — the walking kit shared by wslife / pas_life / life.
// Why it exists (numbers in report_AN1_R2.md): the people and animals of the game moved at a constant speed along straight lines, turned instantly (or with a frame-rate-dependent lerp),
// started and stopped in one frame, played their gait clip at a rate that did not follow the speed they really moved at (the planted foot slid at 30-190 cm/s), walked through the props and walls of
// the worksites and stood on the terrain even where the visible floor is 10-90 cm higher.  Two small tools fix that without touching a clip or a model:
//   steer(p, m, gx, gz, dt, o)  — one step of a walker with acceleration / braking / limited turn rate; moves ONLY along its facing; m.v is the speed the gait clip must be played for.
//   makeGrid({...})            — a walking grid of a site, rasterised from the site's own meshes: blocked cells (walls, fences, crates, crops: any steep face between knee and head height above the
//                                local floor), the walkable FLOOR height of every cell (terrain, soup pads, raised pen floors, jetty planks), connected components, A* + string pulling.
import * as THREE from 'three';

export const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
const sm = (u) => { u = clampN(u, 0, 1); return u * u * (3 - 2 * u); };
export { sm as smooth01 };

// ------------------------------------------------------------------------------------------------ the mover
// p = { x, z, yaw } (a crowd instance or anything with those fields), m = { v } (persistent state of this walker), goal gx,gz.
// o: vmax (m/s), acc, dec (m/s²), turn (rad/s standing, falls to 55 % at full speed), pivot (true: people stop and turn on the spot when the goal is behind them; false: animals keep a crawl and arc round),
//    stopD (arrival radius: the walker brakes to a halt there; `pass: true` = a way-point: no braking, just a corner), free(x, z) (collision guard), slow (0..1 speed factor, e.g. a foal).
// returns the distance left to the goal.  m.v = ground speed now; m.turning = |heading error| (rad); m.blocked = last step was stopped by the guard.
export function steer(p, m, gx, gz, dt, o = {}) {
  const vmax = (o.vmax ?? 1.35) * (o.slow ?? 1), acc = o.acc ?? 1.3, dec = o.dec ?? 1.8, turn = o.turn ?? 3.0, stopD = o.stopD ?? 0.03, pass = !!o.pass;
  const dx = gx - p.x, dz = gz - p.z, d = Math.hypot(dx, dz);
  if (d < stopD) { m.v = pass ? m.v : 0; return d; }
  const err = wrapA(Math.atan2(dx, dz) - p.yaw), ae = Math.abs(err);
  const rate = turn * (1 - 0.45 * clampN(m.v / Math.max(vmax, 1e-3), 0, 1));
  p.yaw += clampN(err, -rate * dt, rate * dt);
  const err2 = wrapA(Math.atan2(dx, dz) - p.yaw), ae2 = Math.abs(err2);                      // after this step's turn
  const free = o.pivot === false ? 0.3 : 0;
  let vt = vmax * clampN((1.5 - ae2) / 1.0, free, 1);                                           // full speed under 0.5 rad of error, none (people) / a crawl (animals) beyond 1.5
  if (!pass) vt = Math.min(vt, Math.sqrt(2 * dec * 0.75 * Math.max(0, d - stopD)));              // the braking curve into the goal
  if (ae2 < 1.2 && d > stopD) vt = Math.max(vt, Math.min(0.1, vmax));                            // never stall on the last centimetres
  m.v += clampN(vt - m.v, -dec * dt, acc * dt); if (m.v < 1e-3) m.v = 0;
  m.turning = ae2;
  const step = Math.min(m.v * dt, pass ? 1e9 : d);
  if (step > 0) {
    const nx = p.x + Math.sin(p.yaw) * step, nz = p.z + Math.cos(p.yaw) * step;
    if (o.free && !o.free(nx, nz)) { m.blocked = true; m.v = 0; m.stuck = (m.stuck || 0) + dt; return d; }
    p.x = nx; p.z = nz; m.blocked = false; m.stuck = 0;
  }
  return Math.hypot(gx - p.x, gz - p.z);
}
// turn on the spot towards `yaw` at `rate` rad/s; returns the remaining |error|
export function turnTo(p, yaw, rate, dt) { const e = wrapA(yaw - p.yaw); p.yaw += clampN(e, -rate * dt, rate * dt); return Math.abs(wrapA(yaw - p.yaw)); }
// ease a speed towards a target with separate acceleration / braking (for animals driven by a script: lunge, led horse, carrier)
export const approach = (v, t, up, down, dt) => v + clampN(t - v, -down * dt, up * dt);

// ------------------------------------------------------------------------------------------------ AN1_R3 · F6: update-rate LOD of the movers
// A mover that is far from the camera is a few pixels: its brain (routes, steer, clip rates) and its crowd / mixer update run at 1/2 (60 .. 140 m) or 1/4 (> 140 m) of the FRAME rate, and the time it owes is added to
// the next step, so the speed is the same and only the number of steps drops.  (creature.js lodStep is the pattern, but it counts TIME - owed >= 0.032 s - so on a phone that already runs at 30 fps or less it skips
// nothing, exactly where the CPU is short.  Counting frames saves CPU in proportion; the cap keeps the owed time short when the frame rate is low: 0.12 s at 1/2, 0.25 s at 1/4, i.e. >= 8 / 4 steps a second at any fps.)
// Level 0 (< 60 m from the camera, the camera's own height counts) is the old code path, step for step: lodGate hands back exactly `dt` (plus whatever it owed when it came from a far level).
// Switch: ?an1lod=0 in the page address (or window.__AN1_LOD = false) = everything as before F6 (A/B measurements).  window.__an1lod = counters for the tests.
const _qs = () => { try { return typeof location !== 'undefined' ? location.search || '' : ''; } catch (e) { return ''; } };
export const LOD = { on: !/[?&]an1lod=0(&|$)/.test(_qs()) && !(typeof window !== 'undefined' && window.__AN1_LOD === false), near: 60, far: 140, f1: 2, f2: 4, c1: 0.12, c2: 0.25, n: [0, 0, 0], s: [0, 0, 0], kr: 0, ks: [0, 0, 0] };
// level for a distance d (m) from the camera: 0 = full rate, 1 = half, 2 = quarter
// ------------------------------------------------------------------------------------------------ AN1_R3 A3: the real-world sizes of everything that lives (workers/docs/SCALE.md)
// ONE table (metres) the people and animals are fitted to.  Until R3 the people were x1.7 (a 1.75 m man = 3.0 m, so they read from the strategy camera) and the horses 2.6 x (withers 3.8 m, 7.5 m long) while the
// hero is 1.96 m, a house door 2.0-2.4 m and a cart 4.8 m long.  SZ_GAIN multiplies every entry: `?an1gain=1.4` on the URL tries bigger people for the strategy camera without a code change (default 1 = real size).
// The `back` of a quadruped = the highest point of the middle of its body (withers); LEN = the bind-box length of the shipped model per metre of back (measured by dev/an1_r3/scale_models.js, SCALE.md section 3).
export const SZ_GAIN = (() => { const m = /[?&]an1gain=([0-9.]+)/.exec(_qs()); const g = m ? parseFloat(m[1]) : 1; return g > 0.3 && g < 3 ? g : 1; })();
export const SZ = { man: 1.75, woman: 1.65, youngman: 1.78, oldman: 1.68, oldwoman: 1.55, boy: 1.35, girl: 1.25, littlegirl: 1.0, rider: 1.85,
  horse: 1.45, draught: 1.55, barded: 1.6, cow: 1.3, sheep: 0.75, pig: 0.9, dog: 0.6, wolf: 0.8, hen: 0.4, rooster: 0.6 };
export const LEN = { horse: 3.194 / 1.619, barded: 5.702 / 3.86, cow: 8.067 / 4.587, sheep: 5.919 / 4.075, pig: 9.771 / 4.575, wolf: 5.272 / 2.263 };
export const sz = (k) => SZ[k] * SZ_GAIN;                           // metres, with the gain
export const lenOf = (k, model = k) => sz(k) * LEN[model];          // bind-box length of a model that must stand `k` tall at the back

export const lodLevelD = (d) => (!LOD.on || d < LOD.near ? 0 : d < LOD.far ? 1 : 2);
// level of a point dx, dy, dz metres from the camera
export function lodLevel(dx, dy, dz) {
  if (!LOD.on) return 0;
  const d2 = dx * dx + dy * dy + dz * dz;
  return d2 < LOD.near * LOD.near ? 0 : d2 < LOD.far * LOD.far ? 1 : 2;
}
// o keeps `lgo` (the time it owes) and `lgn` (frames since its last step).  Returns the time to simulate NOW (0 = skip this frame).  A far mover starts with a spread phase so that they do not all step on the same frame.
let _lph = 0;
export function lodGate(o, lv, dt) {
  LOD.n[lv]++;
  if (lv === 0) { const d = (o.lgo || 0) + dt; o.lgo = 0; o.lgn = 0; LOD.s[0]++; return d; }
  const need = lv === 1 ? LOD.f1 : LOD.f2;
  if (o.lgo === undefined) { _lph = (_lph + 0.61803398875) % 1; o.lgo = 0; o.lgn = Math.floor(_lph * need); }
  o.lgo += dt; o.lgn++;
  if (o.lgn < need && o.lgo < (lv === 1 ? LOD.c1 : LOD.c2)) return 0;
  const d = o.lgo; o.lgo = 0; o.lgn = 0; LOD.s[lv]++; return d;
}
if (typeof window !== 'undefined') window.__an1lod = { cfg: LOD, reset() { LOD.n = [0, 0, 0]; LOD.s = [0, 0, 0]; LOD.kr = 0; LOD.ks = [0, 0, 0]; }, snapshot() { return { on: LOD.on, calls: LOD.n.slice(), steps: LOD.s.slice(), crowdRun: LOD.kr, crowdSkip: LOD.ks.slice() }; } };      // dev peek (tests / measurements)

// the ground speed a gait clip was made for (units/s at timeScale 1, at the rig's own scale): how fast the PLANTED feet slide back along the body.  The four lowest bones, the frames where each is near its
// lowest point (stance: y within 25 % of its own range, at least 2 cm), the mean fore-aft (z) speed of the foot over those frames, the median of the feet.  0 when there is no clear stance.
// (The old hoof z-range / duty-factor guess agreed for walks but read a trot 25 % too slow.)  `rig` = a clone of the model in a holder at identity; +z = forward.
export function stanceSpeed(rig, clip, N = 48) {
  const v = stanceSpeedVerts(rig, clip, N); return v > 0 ? v : stanceSpeedBones(rig, clip, N);
}
// the speed of what you SEE planted: the skinned vertices of the lower legs (the hoof / paw geometry), each over the frames where it is on the ground (within 1.5 % of the body height above its own lowest point,
// interior frames of the run only), the median over all of them.  (The foot BONES of the cow clip disagree by 50 % between the front and the back feet; the visible hooves agree to ±10 %.)
// Checked offline against hoof tracks of the baked clips: cow walk 2.46 / 2.35 u/s, horse walk 1.47 / 1.52, horse trot 2.88 / 3.4 (14-frame track), wolf walk 2.2 / –.
function stanceSpeedVerts(rig, clip, N) {
  rig.updateMatrixWorld(true); const meshes = []; rig.traverse((o) => { if (o.isSkinnedMesh && o.geometry && o.geometry.attributes.position) meshes.push(o); });
  if (!meshes.length || !meshes[0].getVertexPosition) return 0;
  const p = new THREE.Vector3(); let gmin = 1e9, gmax = -1e9, tot = 0;
  for (const m of meshes) { const n = m.geometry.attributes.position.count; tot += n; for (let i = 0; i < n; i += 7) { m.getVertexPosition(i, p); p.applyMatrix4(m.matrixWorld); if (p.y < gmin) gmin = p.y; if (p.y > gmax) gmax = p.y; } }
  const H = gmax - gmin; if (!(H > 0)) return 0;
  const cand = []; for (const m of meshes) { const n = m.geometry.attributes.position.count, stride = Math.max(1, Math.ceil(tot / 1500)); for (let i = 0; i < n; i += stride) { m.getVertexPosition(i, p); p.applyMatrix4(m.matrixWorld); if (p.y < gmin + 0.2 * H) cand.push([m, i]); } }
  if (cand.length < 20) return 0;
  const mixer = new THREE.AnimationMixer(rig), act = mixer.clipAction(clip); act.play();
  const Y = cand.map(() => new Float32Array(N + 1)), Z = cand.map(() => new Float32Array(N + 1)); let lowest = 1e9, high = -1e9;
  for (let f = 0; f <= N; f++) {
    mixer.setTime((clip.duration * f) / N); rig.updateMatrixWorld(true);
    for (let k = 0; k < cand.length; k++) { const [m, i] = cand[k]; m.getVertexPosition(i, p); p.applyMatrix4(m.matrixWorld); Y[k][f] = p.y; Z[k][f] = p.z; if (p.y < lowest) lowest = p.y; if (p.y > high) high = p.y; }
  }
  act.stop(); mixer.uncacheClip(clip);
  const vs = [], dt = clip.duration / N;
  for (let k = 0; k < cand.length; k++) {
    let lo = 1e9; for (let f = 0; f < N; f++) if (Y[k][f] < lo) lo = Y[k][f];
    if (lo > lowest + 0.06 * H) continue;                                                     // never reaches the ground: not a hoof
    const th = lo + 0.015 * H, st = []; for (let f = 0; f < N; f++) st.push(Y[k][f] <= th && Y[k][f + 1] <= th);
    for (let f = 0; f < N; f++) if (st[f] && st[(f + N - 1) % N] && st[(f + 1) % N]) vs.push((Z[k][f] - Z[k][f + 1]) / dt);
  }
  if (vs.length < 40) return 0; vs.sort((a, b) => a - b); return Math.max(0, vs[vs.length >> 1]);
}
function stanceSpeedBones(rig, clip, N) {

  rig.updateMatrixWorld(true); const bones = []; rig.traverse((o) => { if (o.isBone) bones.push(o); });
  const mixer = new THREE.AnimationMixer(rig), act = mixer.clipAction(clip); act.play();
  const Y = bones.map(() => new Float32Array(N + 1)), Z = bones.map(() => new Float32Array(N + 1)), p = new THREE.Vector3();
  for (let i = 0; i <= N; i++) { mixer.setTime((clip.duration * i) / N); rig.updateMatrixWorld(true); bones.forEach((b, k) => { b.getWorldPosition(p); Y[k][i] = p.y; Z[k][i] = p.z; }); }
  act.stop(); mixer.uncacheClip(clip);
  const low = bones.map((b, k) => ({ k, y: Math.min(...Y[k]) })).sort((a, b) => a.y - b.y).slice(0, 4), vs = [];
  for (const { k } of low) {
    const lo = Math.min(...Y[k]), hi = Math.max(...Y[k]), th = lo + Math.max(0.02, 0.25 * (hi - lo)); let sum = 0, cnt = 0;
    for (let i = 0; i < N; i++) if (Y[k][i] <= th && Y[k][i + 1] <= th) { sum += (Z[k][i] - Z[k][i + 1]) / (clip.duration / N); cnt++; }
    if (cnt >= 3) vs.push(sum / cnt);
  }
  vs.sort((a, b) => a - b); return vs.length ? Math.max(0, vs[vs.length >> 1]) : 0;
}

// ------------------------------------------------------------------------------------------------ the walking grid of a site
const CELL = 0.4, BAND_LO = -0.35, BAND_HI = 1.25, KNEE = 0.3, HEAD = 1.6;
// meshes: world-space meshes of the site (plain Mesh, no skinning).  height(x,z): terrain.  waterY: cells whose terrain is under it count the water surface as their base (jetties); a wet cell with no surface in it at all is waded on the bed (blocked when deeper than 30 cm).
// Returns a grid whose build is incremental: g.pump(ms) until g.ready.
export function makeGrid({ cx, cz, R, meshes, height, waterY = -1e9 }) {
  const c = CELL, n = Math.ceil((2 * R) / c), x0 = cx - R, z0 = cz - R, N = n * n;
  const T = new Float32Array(N), B = new Float32Array(N), lo = new Float32Array(N).fill(-9), hi = new Float32Array(N).fill(-9), F = new Float32Array(N), wall = new Uint32Array(N);
  const blk = new Uint8Array(N), comp = new Uint16Array(N), near = new Uint8Array(N);
  for (let iz = 0; iz < n; iz++) for (let ix = 0; ix < n; ix++) { const i = iz * n + ix, h = height(x0 + (ix + 0.5) * c, z0 + (iz + 0.5) * c); T[i] = h; B[i] = h < waterY ? waterY : h; }
  const g = { n, c, x0, z0, T, F, blk, comp, R, cx, cz, ready: false, main: 0, tp: new Map(), cells: N, tris: 0, ms: 0 };
  const cellOf = (x, z) => { const ix = Math.floor((x - x0) / c), iz = Math.floor((z - z0) / c); return ix < 0 || iz < 0 || ix >= n || iz >= n ? -1 : iz * n + ix; };
  g.cellOf = cellOf;
  const ax = new Float64Array(3), ay = new Float64Array(3), az = new Float64Array(3), v3 = new THREE.Vector3();
  // ---- the build as a generator (yields every ~3000 triangles)
  function* build() {
    let cnt = 0;
    for (const mesh of meshes) {
      const geo = mesh.geometry, pos = geo.attributes.position, idx = geo.index, tri = (idx ? idx.count : pos.count) / 3; mesh.updateWorldMatrix(true, false);
      const e = mesh.matrixWorld.elements, W = new Float64Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); W[i * 3] = e[0] * x + e[4] * y + e[8] * z + e[12]; W[i * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; W[i * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14]; }
      for (let t = 0; t < tri; t++) {
        for (let k = 0; k < 3; k++) { const vi = idx ? idx.getX(t * 3 + k) : t * 3 + k; ax[k] = W[vi * 3]; ay[k] = W[vi * 3 + 1]; az[k] = W[vi * 3 + 2]; }
        raster(); g.tris++;
        if (++cnt % 3000 === 0) yield;
      }
    }
    finish();
  }
  function raster() {
    const minx = Math.min(ax[0], ax[1], ax[2]), maxx = Math.max(ax[0], ax[1], ax[2]), minz = Math.min(az[0], az[1], az[2]), maxz = Math.max(az[0], az[1], az[2]);
    if (maxx < x0 || minx > x0 + n * c || maxz < z0 || minz > z0 + n * c) return;
    const ux = ax[1] - ax[0], uy = ay[1] - ay[0], uz = az[1] - az[0], vx = ax[2] - ax[0], vy = ay[2] - ay[0], vz = az[2] - az[0];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz); if (nl < 1e-9) return; ny /= nl;
    if (ny > 0.75) {                                                                           // an up-facing face: a floor candidate (barycentric over the cell centres)
      const det = ux * vz - uz * vx; if (Math.abs(det) < 1e-9) return;
      const ix0 = Math.max(0, Math.floor((minx - x0) / c)), ix1 = Math.min(n - 1, Math.floor((maxx - x0) / c)), iz0 = Math.max(0, Math.floor((minz - z0) / c)), iz1 = Math.min(n - 1, Math.floor((maxz - z0) / c));
      for (let iz = iz0; iz <= iz1; iz++) for (let ix = ix0; ix <= ix1; ix++) {
        const px = x0 + (ix + 0.5) * c - ax[0], pz = z0 + (iz + 0.5) * c - az[0], s = (px * vz - pz * vx) / det, tq = (ux * pz - uz * px) / det;
        if (s < -1e-6 || tq < -1e-6 || s + tq > 1 + 1e-6) continue;
        const y = ay[0] + uy * s + vy * tq, i = iz * n + ix, rel = y - B[i];
        if (rel < BAND_LO || rel > BAND_HI) continue;
        if (rel > hi[i]) hi[i] = rel; if (rel <= 0.35 && rel > lo[i]) lo[i] = rel;
      }
    } else {                                                                                    // a steep / down-facing face: sample its surface, set the height bin of every cell it touches
      const el = Math.max(Math.hypot(ux, uy, uz), Math.hypot(vx, vy, vz), Math.hypot(ax[2] - ax[1], ay[2] - ay[1], az[2] - az[1])), m = Math.min(90, Math.max(1, Math.ceil(el / 0.2)));
      for (let i = 0; i <= m; i++) for (let j = 0; j <= m - i; j++) {
        const s = i / m, tq = j / m, px = ax[0] + ux * s + vx * tq, pz = az[0] + uz * s + vz * tq;
        const ci = cellOf(px, pz); if (ci < 0) continue;
        const rel = ay[0] + uy * s + vy * tq - B[ci]; if (rel < -0.4 || rel >= 3.4) continue;
        wall[ci] |= 1 << Math.floor((rel + 0.4) / 0.2);
      }
    }
  }
  function finish() {
    // floors: the low surface (≤ 45 cm over the base: terrain-level pads, roads, planks) or a wide higher platform (pen floors: a surface within ±20 cm over ≥ 15 of the 25 cells around)
    for (let iz = 0; iz < n; iz++) for (let ix = 0; ix < n; ix++) {
      const i = iz * n + ix, h = hi[i], l = lo[i]; let f = l > 0 ? l : 0;                                  // (a surface buried under the terrain is not the floor)
      if (h > 0.35 && (l < -5 || h > l + 0.08)) {
        let k = 0; for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const x = ix + dx, z = iz + dz; if (x < 0 || z < 0 || x >= n || z >= n) continue; const q = hi[z * n + x]; if (q > -5 && Math.abs(q - h) < 0.2) k++; }
        if (k >= 15) f = h;
      }
      F[i] = f;
      if (T[i] < waterY && hi[i] < -5) B[i] = T[i];                                                      // shallow water with nothing in it (no plank, no stone): the walker wades on the bed, it does not stand on the water surface
    }
    // blocked: a face between knee and head height above THIS cell's floor; water without a floor
    for (let i = 0; i < N; i++) {
      const f = F[i], lb = clampN(Math.floor((f + KNEE + 0.4) / 0.2), 0, 31), hb = clampN(Math.floor((f + HEAD + 0.4) / 0.2), 0, 31);
      const mask = ((hb >= 31 ? 0xffffffff : (1 << (hb + 1)) - 1) & ~((1 << lb) - 1)) >>> 0;
      blk[i] = (wall[i] & mask) !== 0 ? 1 : (T[i] < waterY - 0.3 && f < 0.05) ? 2 : 0;
      if (!blk[i] && hi[i] > KNEE + 0.15 && hi[i] < HEAD && f < hi[i] - 0.15) blk[i] = 4;           // a solid top (crate, table, hay) whose sides do not reach the cell centre
    }
    for (let iz = 0; iz < n; iz++) for (let ix = 0; ix < n; ix++) {                                  // a cliff (> 50 cm between neighbours: a pen's raised floor, a ditch) is a wall on both sides
      const i = iz * n + ix, a0 = B[i] + F[i];
      if (ix + 1 < n && Math.abs(a0 - (B[i + 1] + F[i + 1])) > 0.5) { if (!blk[i]) blk[i] = 3; if (!blk[i + 1]) blk[i + 1] = 3; }
      if (iz + 1 < n && Math.abs(a0 - (B[i + n] + F[i + n])) > 0.5) { if (!blk[i]) blk[i] = 3; if (!blk[i + n]) blk[i + n] = 3; }
    }
    for (let iz = 0; iz < n; iz++) for (let ix = 0; ix < n; ix++) { const i = iz * n + ix; if (blk[i]) continue; let b = 0; for (let dz = -1; dz <= 1 && !b; dz++) for (let dx = -1; dx <= 1; dx++) { const x = ix + dx, z = iz + dz; if (x >= 0 && z >= 0 && x < n && z < n && blk[z * n + x]) { b = 1; break; } } near[i] = b; }
    // connected components (8-neighbour, no corner cutting); the biggest is `main`
    let id = 0; const sizes = [0], q = new Int32Array(N);
    for (let s = 0; s < N; s++) {
      if (blk[s] || comp[s]) continue; id++; let qh = 0, qt = 0; q[qt++] = s; comp[s] = id; let size = 0;
      while (qh < qt) {
        const i = q[qh++]; size++; const ix = i % n, iz = (i / n) | 0;
        for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dz) continue; const x = ix + dx, z = iz + dz; if (x < 0 || z < 0 || x >= n || z >= n) continue; const j = z * n + x; if (blk[j] || comp[j]) continue;
          if (dx && dz && (blk[iz * n + x] || blk[z * n + ix])) continue; comp[j] = id; q[qt++] = j;
        }
      }
      sizes.push(size); if (id >= 65000) break;
    }
    let best = 0; for (let k = 1; k < sizes.length; k++) if (sizes[k] > sizes[best] || best === 0) best = k; g.main = best; g.ready = true;
  }
  let gen = build();
  g.pump = (ms = 4) => { if (g.ready) return true; const t0 = performance.now(); while (performance.now() - t0 < ms) { const r = gen.next(); if (r.done) break; } g.ms += performance.now() - t0; return g.ready; };

  // ---- queries
  g.free = (x, z) => { const i = cellOf(x, z); return i < 0 || !blk[i]; };
  g.blockedAt = (x, z) => { const i = cellOf(x, z); return i >= 0 && blk[i] !== 0; };
  g.compAt = (x, z) => { const i = cellOf(x, z); return i < 0 ? -1 : comp[i]; };
  const FL = (ix, iz) => { ix = clampN(ix, 0, n - 1); iz = clampN(iz, 0, n - 1); const i = iz * n + ix; return B[i] + F[i]; };
  // the walkable floor height at x,z (bilinear over the four cell centres; outside the grid: the terrain)
  g.y = (x, z, fallback) => {
    const fx = (x - x0) / c - 0.5, fz = (z - z0) / c - 0.5; if (fx < -0.5 || fz < -0.5 || fx > n - 0.5 || fz > n - 0.5) return fallback ?? height(x, z);
    const ix = Math.floor(fx), iz = Math.floor(fz), u = fx - ix, w = fz - iz;
    return (FL(ix, iz) * (1 - u) + FL(ix + 1, iz) * u) * (1 - w) + (FL(ix, iz + 1) * (1 - u) + FL(ix + 1, iz + 1) * u) * w;
  };
  // nearest free cell centre of component `want` (default: the main one) within `maxR` metres of x,z
  g.nearest = (x, z, maxR = 2.4, want = g.main) => {
    const ci = cellOf(x, z); if (ci >= 0 && !blk[ci] && (!want || comp[ci] === want)) return [x, z];
    const ix = Math.floor((x - x0) / c), iz = Math.floor((z - z0) / c), rr = Math.ceil(maxR / c); let best = null, bd = 1e9;
    for (let dz = -rr; dz <= rr; dz++) for (let dx = -rr; dx <= rr; dx++) {
      const a = ix + dx, b = iz + dz; if (a < 0 || b < 0 || a >= n || b >= n) continue; const j = b * n + a; if (blk[j] || (want && comp[j] !== want)) continue;
      const px = x0 + (a + 0.5) * c, pz = z0 + (b + 0.5) * c, d = (px - x) ** 2 + (pz - z) ** 2 + (near[j] ? 0.25 : 0); if (d < bd) { bd = d; best = [px, pz]; }
    }
    return best && Math.sqrt(bd) <= maxR + 0.5 ? best : null;
  };
  // is the straight segment clear (with `clr` metres of lateral room)?
  g.clear = (x0_, z0_, x1_, z1_, clr = 0.2) => {
    const dx = x1_ - x0_, dz = z1_ - z0_, L = Math.hypot(dx, dz); if (L < 1e-6) return true; const st = Math.max(1, Math.ceil(L / 0.2)), px = -dz / L * clr, pz = dx / L * clr;
    for (let k = 0; k <= st; k++) { const x = x0_ + (dx * k) / st, z = z0_ + (dz * k) / st; if (g.blockedAt(x, z) || g.blockedAt(x + px, z + pz) || g.blockedAt(x - px, z - pz)) return false; }
    return true;
  };
  // A* over the free cells (8 neighbours, no corner cutting, a soft penalty next to walls) + string pulling.  Returns [[x,z]…] ending at the exact goal, or null (no route: other component / blocked).
  const gS = new Float32Array(N), pr = new Int32Array(N), seen = new Uint32Array(N), done = new Uint32Array(N); let stamp = 0;
  g.path = (xa, za, xb, zb) => {
    const sa = g.nearest(xa, za, 1.6, 0), sb = g.nearest(xb, zb, 1.6, 0); if (!sa || !sb) return null;
    const s = cellOf(sa[0], sa[1]), e = cellOf(sb[0], sb[1]); if (s < 0 || e < 0 || comp[s] !== comp[e]) return null;
    if (g.clear(xa, za, xb, zb)) return [[xb, zb]];
    stamp++; const heap = [[0, s]]; gS[s] = 0; pr[s] = -1; seen[s] = stamp; const ex = e % n, ez = (e / n) | 0;
    const push = (it) => { heap.push(it); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    let found = false, guard = 0;
    while (heap.length && guard++ < 60000) {
      const [, u] = pop(); if (done[u] === stamp) continue; done[u] = stamp; if (u === e) { found = true; break; }
      const ux = u % n, uz = (u / n) | 0;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue; const x = ux + dx, z = uz + dz; if (x < 0 || z < 0 || x >= n || z >= n) continue; const j = z * n + x; if (blk[j]) continue;
        if (dx && dz && (blk[uz * n + x] || blk[z * n + ux])) continue;
        const w = gS[u] + (dx && dz ? 1.414 : 1) + (near[j] ? 0.7 : 0); if (seen[j] === stamp && w >= gS[j]) continue; seen[j] = stamp; gS[j] = w; pr[j] = u;
        const hx = Math.abs(x - ex), hz = Math.abs(z - ez); push([w + (hx + hz) + (1.414 - 2) * Math.min(hx, hz), j]);
      }
    }
    if (!found) return null;
    const cells = []; for (let u = e; u >= 0; u = pr[u]) cells.push([x0 + ((u % n) + 0.5) * c, z0 + (((u / n) | 0) + 0.5) * c]); cells.reverse(); cells[0] = [xa, za]; cells.push([xb, zb]);
    const out = []; let a = 0;
    while (a < cells.length - 1) { let b = cells.length - 1; while (b > a + 1 && !g.clear(cells[a][0], cells[a][1], cells[b][0], cells[b][1], 0.18)) b--; out.push(cells[b]); a = b; }
    return out;
  };
  return g;
}

// ------------------------------------------------------------------------------------------------ a smoothed road line (for the carts): Chaikin corner cutting, resampled every 0.5 m, with a tangent-extended tail at both ends
export function smoothLine(pts, { iter = 2, step = 0.5, tail = 8 } = {}) {
  let P = pts.map((p) => [p[0], p[1]]);
  for (let it = 0; it < iter; it++) { const Q = [P[0]]; for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1]; Q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } Q.push(P[P.length - 1]); P = Q; }
  const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const len = cum[cum.length - 1], n = Math.max(2, Math.round(len / step)), xs = new Float32Array(n + 1), zs = new Float32Array(n + 1); let j = 1;
  for (let k = 0; k <= n; k++) { const s = (len * k) / n; while (j < cum.length - 1 && cum[j] < s) j++; const a = P[j - 1], b = P[j], u = (s - cum[j - 1]) / (cum[j] - cum[j - 1] || 1); xs[k] = a[0] + (b[0] - a[0]) * u; zs[k] = a[1] + (b[1] - a[1]) * u; }
  const d0x = xs[3] - xs[0], d0z = zs[3] - zs[0], l0 = Math.hypot(d0x, d0z) || 1, d1x = xs[n] - xs[n - 3], d1z = zs[n] - zs[n - 3], l1 = Math.hypot(d1x, d1z) || 1;
  const L = { xs, zs, n, len, step: len / n, tail, t0: [d0x / l0, d0z / l0], t1: [d1x / l1, d1z / l1] };
  // position at distance s along the line (s < 0 and s > len continue along the end tangents)
  L.at = (s, out) => {
    if (s <= 0) { out.x = xs[0] + L.t0[0] * s; out.z = zs[0] + L.t0[1] * s; out.i = 0; return out; }
    if (s >= len) { out.x = xs[n] + L.t1[0] * (s - len); out.z = zs[n] + L.t1[1] * (s - len); out.i = n; return out; }
    const f = s / L.step, i = Math.floor(f), u = f - i; out.x = xs[i] + (xs[i + 1] - xs[i]) * u; out.z = zs[i] + (zs[i + 1] - zs[i]) * u; out.i = f; return out;
  };
  return L;
}
