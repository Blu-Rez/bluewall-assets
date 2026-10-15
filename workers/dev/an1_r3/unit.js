// AN1_R3 unit test (node): the F6 update-rate LOD helper of walk_kit.js.  Bundled by dev/an1_r3_test.sh.
import { LOD, lodLevel, lodLevelD, lodGate, steer, makeGrid, SZ, LEN, sz, lenOf, SZ_GAIN } from '/home/claude/bot/bluebot_v2/bluewall/client/src/walk_kit.js';
let bad = 0; const ck = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad = 1; };
// 1. levels: the 60 / 140 m rings, the camera's height counts
ck(lodLevel(59, 0, 0) === 0 && lodLevel(61, 0, 0) === 1, 'level 0 below 60 m, level 1 above');
ck(lodLevel(139, 0, 0) === 1 && lodLevel(141, 0, 0) === 2, 'level 1 below 140 m, level 2 above');
ck(lodLevel(30, 55, 30) === 1 && lodLevel(30, 0, 30) === 0, 'the height above the mover counts (30,55,30 = 69 m -> level 1; 30,0,30 = 42 m -> level 0)');
ck(lodLevelD(59.9) === 0 && lodLevelD(60.1) === 1 && lodLevelD(140.1) === 2, 'lodLevelD agrees');
// 2. level 0 = the old path, exactly dt, every call
{ const o = {}; let ok = true; for (let i = 0; i < 500; i++) { const d = lodGate(o, 0, 1 / 60 + (i % 7) * 1e-4); if (d !== 1 / 60 + (i % 7) * 1e-4) ok = false; } ck(ok, 'level 0 hands back exactly dt on all 500 calls (near the camera nothing changes)'); }
// 3. rates and time conservation at 60 / 30 / 12 fps
for (const fps of [60, 30, 12]) for (const lv of [1, 2]) {
  const o = {}, dt = 1 / fps, N = Math.round(fps * 60); let steps = 0, sim = 0, maxd = 0;
  for (let i = 0; i < N; i++) { const d = lodGate(o, lv, dt); if (d) { steps++; sim += d; maxd = Math.max(maxd, d); } }
  const owed = o.lgo || 0, want = lv === 1 ? LOD.f1 : LOD.f2, capSteps = Math.ceil(Math.min(want * dt, lv === 1 ? LOD.c1 : LOD.c2) / dt - 1e-9);
  ck(Math.abs(sim + owed - N * dt) < 1e-6, `level ${lv} @${fps} fps: the time simulated + the time owed = the time that passed (${(sim + owed).toFixed(3)} s of ${(N * dt).toFixed(3)} s)`);
  const rate = steps / N; const exp = 1 / Math.min(want, Math.max(1, Math.ceil((lv === 1 ? LOD.c1 : LOD.c2) / dt - 1e-9)));
  ck(Math.abs(rate - exp) < 0.02, `level ${lv} @${fps} fps: steps ${(100 * rate).toFixed(1)} % of the frames (expected ${(100 * exp).toFixed(1)} %), longest step ${maxd.toFixed(3)} s`);
}
// 4. a walker: the distance it covers is the same with the gate as without (speed unchanged)
{ const v = 1.3; let x0 = 0, x1 = 0, x2 = 0; const o1 = {}, o2 = {};
  for (let i = 0; i < 600; i++) { const dt = 1 / 60; x0 += v * dt; const a = lodGate(o1, 1, dt); if (a) x1 += v * a; const b = lodGate(o2, 2, dt); if (b) x2 += v * b; }
  ck(Math.abs(x0 - x1) <= v * (o1.lgo + 1e-9) + 1e-6 && Math.abs(x0 - x2) <= v * (o2.lgo + 1e-9) + 1e-6, `a walker covers the same ground (${x0.toFixed(2)} m / ${x1.toFixed(2)} / ${x2.toFixed(2)} m; the rest is what is still owed)`); }
// 5. phase spread: 8 far movers do not all step on the same frame
{ const os = Array.from({ length: 8 }, () => ({})); const per = new Array(8).fill(0); for (let i = 0; i < 80; i++) os.forEach((o, k) => { if (lodGate(o, 2, 1 / 60)) per[i % 4]++; }); const mx = Math.max(...per.slice(0, 4)), mn = Math.min(...per.slice(0, 4)); ck(mx - mn <= 12 && mn > 0, `the steps of 8 level-2 movers spread over the 4 frame phases (${per.slice(0, 4).join(' / ')})`); }
// 6. coming back near: the owed time is paid at once
{ const o = {}; lodGate(o, 2, 0.01); lodGate(o, 2, 0.01); const owed = o.lgo; const d = lodGate(o, 0, 0.016); ck(Math.abs(d - (owed + 0.016)) < 1e-12 && o.lgo === 0, 'a mover that comes back inside 60 m is paid what it owes in its first full step'); }
// 7. the kill switch
{ LOD.on = false; ck(lodLevel(500, 0, 0) === 0 && lodLevelD(900) === 0, '?an1lod=0 (LOD.on = false): every level is 0 = the old behaviour'); LOD.on = true; }
// 8. the grid / steer exports are still there (AN1_R2)
ck(typeof steer === 'function' && typeof makeGrid === 'function', 'steer and makeGrid are still exported');

// 9. the size table (workers/docs/SCALE.md): the real sizes, and the lengths that put the withers there
ck(SZ_GAIN === 1, 'no ?an1gain= in the test: gain 1');
ck(sz('man') === 1.75 && sz('woman') === 1.65 && sz('cow') === 1.3 && sz('pig') === 0.9 && sz('sheep') === 0.75 && sz('dog') === 0.6, 'man 1.75, woman 1.65, cow 1.3, pig 0.9, sheep 0.75, dog 0.6');
ck(sz('horse') === 1.45 && sz('draught') === 1.55 && sz('barded') === 1.6 && sz('rider') === 1.85, 'horse withers 1.45, draught 1.55, barded war horse 1.6, rider 1.85');
{ const BACK = { horse: 1.619, barded: 3.86, cow: 4.587, sheep: 4.075, pig: 4.575, wolf: 2.263 };       // the models' measured back heights (workers/docs/SCALE.md section 3)
  let ok = true; for (const [k, b] of Object.entries(BACK)) { const len = lenOf(k), want = sz(k), got = len / LEN[k] ; const withers = want; const natLen = { horse: 3.194, barded: 5.702, cow: 8.067, sheep: 5.919, pig: 9.771, wolf: 5.272 }[k]; const k2 = len / natLen; if (Math.abs(k2 * b - withers) > 1e-6) { ok = false; console.log('  ', k, k2 * b, withers); } }
  ck(ok, 'lenOf(): fitting the model to that length puts the withers (back height) at the table value for horse, barded horse, cow, sheep, pig, wolf'); }
ck(Math.abs(lenOf('draught', 'horse') * (1.619 / 3.194) - 1.55) < 1e-9, 'a draught horse is the riding horse model fitted to 1.55 m withers (lenOf(\'draught\', \'horse\'))');
ck(sz('man') < sz('rider') && sz('woman') < sz('man') && sz('horse') < 1.96, 'order: woman < man < rider; the horse\'s withers are below the hero\'s 1.96 m');
process.exit(bad);
