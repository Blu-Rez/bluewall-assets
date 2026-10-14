// TR2-S3: castle_tr2.js logic (no GL, no models): which tier every wall piece / tower shows, how many pieces, which files are needed, the fits.  Bundled by dev/tr2_s3_test.sh.  Last line: "TR2 S3 OK"
import { createCastleTr2, fileOf, loOf, lodPick, cellDist, LOD_NEAR, LOD_FAR, neededFiles, tierSig, towerWidth, towerPlatform, tvis, WALL_SLOT, KEEP_W, MAX_STRETCH, MED_NAT, INNER_TOWER_W } from '/home/claude/bot/bluebot_v2/bluewall/client/src/castle_tr2.js';
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
console.log(fails ? 'TR2 S3 FAIL (' + fails + ')' : 'TR2 S3 OK');
process.exit(fails ? 1 : 0);
