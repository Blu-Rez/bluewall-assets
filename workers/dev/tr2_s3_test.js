// TR2-S3: castle_tr2.js logic (no GL, no models): which tier every wall piece / tower shows, how many pieces, which files are needed, the fits.  Bundled by dev/tr2_s3_test.sh.  Last line: "TR2 S3 OK"
import { createCastleTr2, fileOf, loOf, lodPick, cellDist, LOD_NEAR, LOD_FAR, neededFiles, tierSig, towerWidth, towerPlatform, tvis, WALL_SLOT, KEEP_W, MAX_STRETCH, MED_NAT, INNER_TOWER_W, STAIRS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/castle_tr2.js';
import * as T from '/home/claude/bot/bluebot_v2/bluewall/client/src/tiers.js';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { DIMS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/a1_rings.js';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };

console.log('== 1. files per level');
for (const cap of [30, 50]) {
  T.setLevelCap(cap);
  let maxNow = 0, maxSoon = 0, bad = 0;
  for (let lw = 1; lw <= cap; lw++) {
    const lk = Math.max(1, lw - 3), n = neededFiles(lw, lk);
    maxNow = Math.max(maxNow, n.now.length); maxSoon = Math.max(maxSoon, n.soon.length);
    const S = T.tierState(lw);
    for (const f of ['wall', 'tower', 'gate']) if (!n.now.includes(fileOf(f, S.lo)) || !n.now.includes(loOf(fileOf(f, S.lo)))) bad++;
    if (S.half && !n.now.includes(fileOf('wall', S.hi))) bad++;
  }
  ok(bad === 0, 'cap ' + cap + ': every level asks for the lo tier of wall / tower / gate (and the hi tier of walls in a half zone)');
  ok(maxNow <= 2 * (3 * 2 + 3 * 2), 'cap ' + cap + ': at most ' + maxNow + ' files now (wall + tower + gate of two tiers for the wall level, wall + tower of two tiers for the keep level, each with its _lo file)');
}
T.setLevelCap(50);
ok(fileOf('wall', 0) === 'castle_wall_wood' && fileOf('tower', 8) === 'castle_tower_medium_diamond_blue' && fileOf('gate', 4) === 'castle_gate_diamond_ice', 'file names: castle_wall_wood, castle_tower_medium_diamond_blue, castle_gate_diamond_ice');
ok(tierSig(1) === '0.0' && tierSig(7) === '1.1' && tierSig(4) === '0.1' && tierSig(50) === '8.8', 'tierSig: pure 0.0 / 1.1 / 8.8, half zone 0.1');

console.log('== 1b. level of detail');
const mid = (LOD_NEAR + LOD_FAR) / 2;
ok(lodPick(LOD_NEAR - 30, 'hi') === 'hi' && lodPick(mid, 'hi') === 'hi' && lodPick(LOD_FAR + 1, 'hi') === 'lo' && lodPick(mid, 'lo') === 'lo' && lodPick(LOD_NEAR - 1, 'lo') === 'hi', 'lodPick: hi until ' + LOD_FAR + ' m, lo again only inside ' + LOD_NEAR + ' m (hysteresis: no flicker at the border)');
{ let flips = 0, cur = 'hi'; for (let d = LOD_NEAR - 20; d < LOD_FAR + 20; d += 0.25) { const n = lodPick(d, cur); if (n !== cur) flips++; cur = n; } for (let d = LOD_FAR + 20; d > LOD_NEAR - 20; d -= 0.25) { const n = lodPick(d, cur); if (n !== cur) flips++; cur = n; } ok(flips === 2, 'a camera going out and back in switches exactly twice (' + flips + ')'); }
ok(Math.abs(cellDist([0, 0, 100, 0], { x: 100, y: 10, z: 30 }) - 18) < 1e-9 && Math.abs(cellDist([0, 0], { x: 0, y: 110, z: 0 }) - 88) < 1e-9, 'cellDist: nearest piece, height above 10 m counts, minus the half size of a piece');
console.log('== 2. wall pieces');
const T3 = createCastleTr2();
for (const [ring, poly, dims] of [['outer', L.OUTER, DIMS.outer], ['inner', L.INNER, DIMS.inner], ['town', L.TOWN, DIMS.town]]) {
  if (!poly) continue;
  let pieces = 0, runs = 0, minSlot = 1e9, maxSlot = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = T3.wall({ ring, tid: 100 + i, ax: a[0], az: a[1], bx: b[0], bz: b[1], H: dims.H, T: dims.T });
    pieces += n; runs++; const sl = len / n; minSlot = Math.min(minSlot, sl); maxSlot = Math.max(maxSlot, sl);
  }
  const slot = dims.H / WALL_SLOT;
  ok(minSlot > slot * 0.6 && maxSlot < slot * 1.5, ring + ': ' + pieces + ' pieces over ' + runs + ' runs, piece length ' + minSlot.toFixed(1) + ' .. ' + maxSlot.toFixed(1) + ' m (slot ' + slot.toFixed(1) + ')');
}
ok(T3.walls.length >= 20 && T3.walls[0].slot0 === 0 && T3.walls[1].slot0 === T3.walls[0].n, 'slot index runs on along a ring (half / half alternates piece by piece, also over corners)');
{ const s = T.tierState(29), alt = []; for (let j = 0; j < 6; j++) alt.push(T.pieceTier(29, j)); ok(s.half && alt[0] !== alt[1] && alt[0] === alt[2], 'half zone (lv 29 @ cap 50): pieces alternate ' + alt.join('')); }
ok(Math.abs(tvis(4.2) - 3.024) < 1e-9, 'visual thickness 0.72 T');

console.log('== 3. towers');
for (const [ring, R, h] of [['outer', 4.6, 15], ['outer', 4.6, 17], ['town', 3.9, 13.7], ['town', 3.9, 15.7], ['inner', 3.5, 21.5], ['inner', 3.5, 23.5]]) {
  const W = towerWidth(ring, R), P = towerPlatform(ring, R, h), stretch = P / (MED_NAT * W);
  ok(stretch <= MAX_STRETCH + 1e-9 && P <= h + 0.8 + 1e-9, ring + ' R ' + R + ' h ' + h + ': width ' + W.toFixed(1) + ' m, platform ' + P.toFixed(1) + ' m (old weapon height ' + (h + 0.8).toFixed(1) + '), stretch x' + stretch.toFixed(2));
}
ok(towerWidth('inner', 3.5) === INNER_TOWER_W && Math.abs(towerWidth('outer', 4.6) - 9.8) < 1e-9, 'tower width: 2R + 0.6, inner ring 9.4');
const P1 = T3.tower({ ring: 'outer', tid: 5, i: 0, x: 1, z: 2, R: 4.6, h: 17, face: 0.3 }); ok(Math.abs(P1 - 17.8) < 1e-9 && T3.towers.length === 1, 'tower() returns the platform height the weapon stands on');

console.log('== 4. keep size vs the inner ring');
{
  const K = L.KEEP, c = Math.cos(K.rot), s = Math.sin(K.rot), hx = KEEP_W / 2, hz = KEEP_W * 0.829 / 2, loc = (x, z) => { const dx = x - K.x, dz = z - K.z; return [dx * c - dz * s, dx * s + dz * c]; };
  const dist = (lx, lz) => Math.hypot(Math.max(Math.abs(lx) - hx, 0), Math.max(Math.abs(lz) - hz, 0)) * (Math.abs(lx) < hx && Math.abs(lz) < hz ? -1 : 1);
  let wallGap = 1e9, towerGap = 1e9;
  for (let i = 0; i < L.INNER.length; i++) {
    const a = L.INNER[i], b = L.INNER[(i + 1) % L.INNER.length];
    for (let t = 0; t <= 1; t += 0.01) { const [lx, lz] = loc(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); wallGap = Math.min(wallGap, dist(lx, lz) - 0.72 * DIMS.inner.T / 2); }
    const [lx, lz] = loc(a[0], a[1]); towerGap = Math.min(towerGap, dist(lx, lz) - INNER_TOWER_W / 2 * 0.9);
  }
  ok(wallGap > 0, 'the keep (' + KEEP_W + ' m wide) clears the inner wall slabs by ' + wallGap.toFixed(1) + ' m');
  ok(towerGap > -1.5, 'the keep corner reaches ' + (-towerGap).toFixed(1) + ' m into the foot of an inner tower at most (< 1.5 m: it touches, the old keep did too)');
}

console.log('== 5. stairs to the wall-walk (anchors(\'stairs\'): spec only, there is no model yet)');
{
  const S3 = createCastleTr2(), ring = 'outer', poly = L.OUTER, dims = DIMS.outer, np = poly.length;
  let cx = 0, cz = 0; for (const a of poly) { cx += a[0]; cz += a[1]; } cx /= np; cz /= np;
  poly.forEach((a, i) => { const b = poly[(i + 1) % np], Lt = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / Lt, uz = (b[1] - a[1]) / Lt, s0 = dims.R * 0.6, s1 = Lt - dims.R * 0.6;   // as castle.js wallRun: a run starts 0.6 R from the tower centre
    S3.wall({ ring, tid: 300 + i, ax: a[0] + ux * s0, az: a[1] + uz * s0, bx: a[0] + ux * s1, bz: a[1] + uz * s1, H: dims.H, T: dims.T }); S3.tower({ ring, tid: 400 + i, i, x: a[0], z: a[1], R: dims.R, h: 15, face: Math.atan2(cx - a[0], cz - a[1]) }); });
  const A = S3.anchors();
  ok(A.towers.length === np && A.walls.length === np && A.keep === null, 'anchors() (no kind) is unchanged: towers / walls / gates / keep');
  const st = S3.anchors('stairs', { rings: ['outer'] });
  ok(st.length > 0 && st.every((s) => s.ring === 'outer'), 'anchors(\'stairs\'): ' + st.length + ' sites on the outer ring (' + np + ' runs, both ends)');
  let bad = [], tmin = 1e9;
  const W = towerWidth('outer', dims.R), off = tvis(dims.T) / 2 + STAIRS.gap + STAIRS.width / 2;
  for (const s of st) {
    const w = S3.walls.find((q) => q.tid === s.tid), dd = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);
    const dline = Math.abs((s.join.x - w.ax) * w.uz - (s.join.z - w.az) * w.ux);                      // join on the wall's centre line
    if (dline > 0.01) bad.push(s.id + ' join off the wall line ' + dline.toFixed(3));
    if (Math.abs(dd(s.top, s.join) - off) > 0.01) bad.push(s.id + ' top-join ' + dd(s.top, s.join).toFixed(3) + ' != ' + off.toFixed(3));
    if (Math.abs(dd(s.top, s.foot) - (STAIRS.landing / 2 + STAIRS.run)) > 0.01) bad.push(s.id + ' flight length ' + dd(s.top, s.foot).toFixed(2));
    if (Math.abs((s.foot.x - s.top.x) * s.dir.x + (s.foot.z - s.top.z) * s.dir.z - (STAIRS.landing / 2 + STAIRS.run)) > 0.01) bad.push(s.id + ' dir not top->foot');
    if (Math.abs(Math.sin(s.ry) - s.dir.x) > 1e-3 || Math.abs(Math.cos(s.ry) - s.dir.z) > 1e-3) bad.push(s.id + ' ry != dir');
    if ((cx - s.join.x) * s.inward.x + (cz - s.join.z) * s.inward.z <= 0) bad.push(s.id + ' not on the inner side');
    if (s.rise !== dims.H || Math.abs(s.scale.y - dims.H / STAIRS.rise) > 1e-3) bad.push(s.id + ' rise ' + s.rise);
    const tw = S3.towers.find((t) => t.tid === s.joint); if (!tw || s.at !== 'tower') bad.push(s.id + ' joint is not its tower (at ' + s.at + ')');
    else {                                                                                            // the flight's 4 corners vs the tower's W x W square turned by face: all corners outside, and the nearest one >= gap away (a sampled distance, not the code's own SAT)
      const c = s.rect, ux = s.dir.x, uz = s.dir.z, nx = s.inward.x, nz = s.inward.z, f = tw.face; let dmin = 1e9;
      const sq = (px, pz) => { const dx = px - tw.x, dz = pz - tw.z, u = dx * Math.sin(f) + dz * Math.cos(f), v = dx * Math.cos(f) - dz * Math.sin(f); return Math.hypot(Math.max(Math.abs(u) - W / 2, 0), Math.max(Math.abs(v) - W / 2, 0)) * (Math.abs(u) < W / 2 && Math.abs(v) < W / 2 ? -1 : 1); };
      for (let a = -1; a <= 1; a += 0.1) for (let b = -1; b <= 1; b += 0.1) dmin = Math.min(dmin, sq(c.cx + ux * a * c.d / 2 + nx * b * c.w / 2, c.cz + uz * a * c.d / 2 + nz * b * c.w / 2));
      if (dmin < STAIRS.gap - 0.05) bad.push(s.id + ' flight is ' + dmin.toFixed(2) + ' m from the tower footprint (needs ' + STAIRS.gap + ')');
      tmin = Math.min(tmin, dmin);
    }
  }
  const rectsOverlap = (r, q) => { const ax = (rr) => [[Math.sin(rr.ry), Math.cos(rr.ry)], [Math.cos(rr.ry), -Math.sin(rr.ry)]], A = ax(r), B = ax(q); for (const a of [...A, ...B]) { const d = Math.abs((q.cx - r.cx) * a[0] + (q.cz - r.cz) * a[1]), pr = (R, ex) => (ex.d / 2) * Math.abs(a[0] * R[0][0] + a[1] * R[0][1]) + (ex.w / 2) * Math.abs(a[0] * R[1][0] + a[1] * R[1][1]); if (d >= pr(A, r) + pr(B, q)) return false; } return true; };
  { let n = 0; for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) if (rectsOverlap(st[i].rect, st[j].rect)) n++; if (n) bad.push(n + ' pairs of flights overlap'); }
  ok(bad.length === 0, 'every site (' + st.length + ', walls inset 0.6 R like castle.js): join on the wall line, top ' + off.toFixed(2) + ' m inside it, flight ' + (STAIRS.landing / 2 + STAIRS.run) + ' m, yaw = direction, inner side, rise = H ' + dims.H + ' m, clear of the tower footprint (nearest ' + tmin.toFixed(2) + ' m), no two flights overlap' + (bad.length ? ' — ' + bad.slice(0, 4).join('; ') : ''));
  const sp = S3.anchors('stairs', { rings: ['outer'], spacing: 60 });
  let mind = 1e9; for (let i = 0; i < sp.length; i++) for (let j = i + 1; j < sp.length; j++) mind = Math.min(mind, Math.hypot(sp[i].centre.x - sp[j].centre.x, sp[i].centre.z - sp[j].centre.z));
  ok(sp.length > 0 && sp.length < st.length && mind >= 60, 'spacing 60: ' + sp.length + ' of ' + st.length + ' sites, nearest pair ' + mind.toFixed(0) + ' m');
  { const S4 = createCastleTr2(), pl = L.INNER, d = DIMS.inner; pl.forEach((a, i) => { const b = pl[(i + 1) % pl.length]; S4.wall({ ring: 'inner', tid: 500 + i, ax: a[0], az: a[1], bx: b[0], bz: b[1], H: d.H, T: d.T }); });
  ok(S4.anchors('stairs', { rings: ['inner'] }).length === 0 && STAIRS.riser * d.H / STAIRS.rise > 0.25, 'inner ring (H ' + d.H + ' m): the y-scaled steps would be ' + (STAIRS.riser * d.H / STAIRS.rise).toFixed(2) + ' m high => no sites (it needs its own model; the default rings are outer + town)'); }
  const run1 = S3.walls[0]; ok(STAIRS.landing + STAIRS.run + 2 * (W / 2 + STAIRS.gap) < run1.len + 20, 'the flight (' + (STAIRS.landing + STAIRS.run).toFixed(1) + ' m + tower) fits the outer ring\'s runs (first run ' + run1.len.toFixed(1) + ' m)');
  ok(Math.abs(STAIRS.rise / STAIRS.riser - Math.round(STAIRS.rise / STAIRS.riser)) < 0.4 && Math.abs(Math.round(STAIRS.rise / STAIRS.riser) * STAIRS.tread - STAIRS.run) < 0.2, 'spec numbers agree: ' + STAIRS.rise + ' m / ' + STAIRS.riser + ' m = ' + Math.round(STAIRS.rise / STAIRS.riser) + ' steps x ' + STAIRS.tread + ' m = ' + STAIRS.run + ' m run');
  for (const [r, H] of [['outer', DIMS.outer.H], ['town', DIMS.town.H]]) { const sy = H / STAIRS.rise; ok(STAIRS.riser * sy >= 0.19 && STAIRS.riser * sy <= 0.25, r + ' (H ' + H + ' m): y x' + sy.toFixed(3) + ' => riser ' + (STAIRS.riser * sy).toFixed(3) + ' m (0.19 .. 0.25)'); }
}
console.log(fails ? 'TR2 S3 FAIL (' + fails + ')' : 'TR2 S3 OK');
process.exit(fails ? 1 : 0);
