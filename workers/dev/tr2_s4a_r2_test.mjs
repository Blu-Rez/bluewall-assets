// tr2_s4a_test.mjs — TR2-S4a data checks (houses + civic from the Tripo library).  Prints `TR2 S4A OK` / `TR2 S4A FAIL n`.
import fs from 'fs';
import { HOME_TR2, homeTr2, homeTr2Files, HOME_KINDS, homeTier, FLAG_S, HOUSE_SMOKE, GENERIC, genericTr2, genericTr2Files, homeTr2LoFiles, loPiece, TOWN_LOD, townCellKey, townCellDist, townLodPick, isVillageHome, villageHomeLot } from '../bot/bluebot_v2/bluewall/client/src/b2_homes.js';
import { CIVIC_KINDS, civicPieces, civicSolids, civicTr2Files, setCivicTr2 } from '../bot/bluebot_v2/bluewall/client/src/b3_civic.js';
// (same two helpers as tr2atlas.js — that module needs `window`, a browser-only import chain)
const specOf = (n) => { const i = n.indexOf('|'); return i < 0 ? { spec: n, o: {} } : { spec: n.slice(0, i), o: {} }; };
const fileOfSpec = (spec) => { const i = spec.indexOf('/'); return i < 0 ? spec : spec.slice(0, i); };
const ROOT = '/home/claude/bot/bluebot_v2/bluewall', SW = JSON.parse(fs.readFileSync(ROOT + '/web/assets/tr2/swap.json', 'utf8'));
const fails = []; let n = 0; const ok = (c, m) => { n++; if (!c) { fails.push(m); console.log('  FAIL', m); } };
const sec = (t) => console.log('== ' + t);
const exists = (spec) => { const f = fileOfSpec(spec); return fs.existsSync(ROOT + '/web/assets/tr2/' + f + '.glb') || fs.existsSync(ROOT + '/web/assets/tr2/' + f); };
const inSwap = (spec) => spec.includes('/') ? !!SW.packs[spec] : !!SW.models[spec];
const LV = [1, 2, 5, 6, 11, 12, 17, 18, 23, 24, 29, 30], KINDS = Object.keys(HOME_TR2);

sec('houses: every model file + swap entry exists');
for (const f of homeTr2Files()) { const s = specOf(f).spec; ok(exists(s), 'file for ' + s); ok(inSwap(s), 'swap.json has ' + s); }
sec('houses: deterministic, inside the lot, tiers only add');
for (const k of KINDS) {
  const K = HOME_KINDS[k], W = K.w, D = K.d; let prev = 0;
  for (const lv of LV) for (const seed of [1, 7, 12345]) {
    const a = homeTr2(k, lv, seed), b = homeTr2(k, lv, seed); ok(JSON.stringify(a) === JSON.stringify(b), `${k} lv${lv} seed${seed} deterministic`);
    ok(a.pieces.length >= 1 && /^house_/.test(a.pieces[0].n), `${k}: first piece is the house body`);
    for (const p of a.pieces) { ok(Math.abs(p.x) <= W / 2 + 1.6 && Math.abs(p.z) <= D / 2 + 3.2, `${k} ${p.n} inside the lot (x ${p.x.toFixed(1)}, z ${p.z.toFixed(1)}, lot ${W}x${D})`); ok(exists(specOf(p.n).spec) && inSwap(specOf(p.n).spec), 'piece spec exists ' + p.n); }
  }
  for (const lv of LV) { const c = homeTr2(k, lv, 5).pieces.length; ok(c >= prev, `${k}: piece count never falls with the level (lv${lv}: ${c} >= ${prev})`); prev = c; }
  ok(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((s) => homeTr2(k, 30, s).variant)).size >= 2, k + ': the variants _0/_1/_2 all appear across seeds');
}
sec('civic: Tripo footprints');
setCivicTr2(true);
for (const f of civicTr2Files()) { const s = specOf(f).spec; ok(exists(s) && inSwap(s), 'civic file+swap ' + s); }
for (const k of Object.keys(CIVIC_KINDS)) { const K = CIVIC_KINDS[k];
  for (const lv of [1, 6, 12, 18, 24, 30]) { const P = civicPieces(k, lv, 3), S = civicSolids(k, lv, 3);
    ok(P.length > 0 && P.every((p) => /\|[whk][\d.]+$/.test(p.n) || /^[a-z_0-9]+\/[a-z_0-9]+$/.test(p.n)) && P.some((p) => /\|[whk][\d.]+$/.test(p.n)), `${k} lv${lv}: pieces: sized building + pack props`);
    ok(S.length >= 1 && S.every(([x, z, r]) => Number.isFinite(x + z + r) && r > 0), `${k} lv${lv}: nav solids finite`);
    ok(S.every(([x, z, r]) => Math.hypot(x, z) + r <= Math.hypot(K.w, K.d) / 2 + 2), `${k} lv${lv}: solids stay on the lot`); } }
const mk = (lv) => Object.keys(CIVIC_KINDS).map((k) => civicSolids(k, lv, 3).length).reduce((a, b) => a + b, 0);
ok(mk(30) <= 40, 'total civic solids per full set <= 40 (' + mk(30) + ')');
setCivicTr2(false); ok(civicPieces('well', 30, 3).every((p) => !p.n.includes('|')), 'kit mode (fallback) unchanged: no |size names'); setCivicTr2(true);
sec('R2: lo copies, generic houses, chimney smoke, pennants, LOD numbers');
for (const f of homeTr2LoFiles()) { ok(exists(f), 'lo file ' + f); ok(fs.statSync(ROOT + '/web/assets/tr2/' + f + '.glb').size < 80000, 'lo file small: ' + f); }
ok(homeTr2LoFiles().length === 16, 'lo files: 12 bodies + 4 generic (' + homeTr2LoFiles().length + ')');
ok(loPiece('house_cottage_0|w6.6') === 'house_cottage_0_lo|w6.6' && loPiece('house_generic_a|w7.5') === 'house_generic_a_lo|w7.5', 'loPiece keeps the size suffix');
for (const f of genericTr2Files()) { ok(exists(f) && inSwap(f), 'generic file+swap ' + f); }
for (const [k, [key, fx, fy, fz]] of Object.entries(GENERIC)) ok(key === 'house_generic_' + k && fx > 3 && fy > 2 && fz > 3, 'GENERIC[' + k + '] sane');
for (const [w, d, fl] of [[5, 5, 1], [7, 7, 1], [9, 9, 2], [12, 9, 1], [30, 30, 2], [6.5, 12, 3]]) for (const [x, z] of [[10, 20], [-33, 41], [120.5, -7]]) {
  const lot = { x, z, w, d, ry: 0.3, floors: fl }, a = genericTr2(lot), b = genericTr2(lot);
  ok(JSON.stringify(a) === JSON.stringify(b), `generic determinism ${w}x${d}@${x},${z}`); ok(a.fit >= 0.62 && a.fit <= 1.35, 'generic fit in 0.62..1.35: ' + a.fit);
  const p0 = a.pieces[0]; ok(/^house_generic_[a-d]\|w7\.5$/.test(p0.n) && p0.s === a.fit, 'generic piece name + scale');
  const [, fxx, , fzz] = GENERIC[p0.n[14]]; ok(Math.abs(p0.x) <= 0.01 && p0.z - fzz * a.fit / 2 >= -d / 2 - 1, `generic stays at the back of the lot (z ${p0.z})`);
  ok(fl >= 2 ? /_(b|c)\|/.test(p0.n) : /_(a|d)\|/.test(p0.n), 'generic pool by floors: ' + p0.n + ' floors ' + fl);
}
ok(new Set([...Array(60).keys()].map((i) => genericTr2({ x: i * 17, z: i * 5, w: 9, d: 9, floors: 1 }).variant)).size >= 2, 'generic: more than one single-storey variant appears');
for (const [key, c] of Object.entries(HOUSE_SMOKE)) {
  const ent = [...Object.values(HOME_TR2).flatMap((k) => k.v), ...Object.values(GENERIC).map((g) => [g[0], g[1], g[2], g[3]])].find((v) => v[0] === key);
  ok(!!ent, 'HOUSE_SMOKE key is a house model ' + key); if (!ent) continue; const [, w, h, d] = ent;
  ok(Math.abs(c[0]) <= w / 2 + 0.3 && c[1] > h * 0.5 && c[1] <= h + 0.3 && Math.abs(c[2]) <= d / 2 + 0.3, `${key}: smoke anchor inside the model box (${c.join(',')} in ${w}x${h}x${d})`);
}
ok(Object.keys(HOUSE_SMOKE).length === 6, 'smoke anchors only on the 6 models that have a chimney');
for (const k of KINDS) for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) { const a = homeTr2(k, 30, seed); ok(a.smoke.length === (HOUSE_SMOKE[a.variant] ? 1 : 0), `${k} seed${seed}: smoke exactly when the model has a chimney (${a.variant})`);
  for (const q of a.smoke) ok(Number.isFinite(q.x + q.y + q.z) && q.y > 3 && Math.abs(q.x) < 7 && Math.abs(q.z) < 9, 'smoke point finite + near the lot: ' + JSON.stringify(q)); }
ok(FLAG_S === 0.6, 'pennant scale 0.6');
for (const k of KINDS) for (const lv of LV) for (const p of homeTr2(k, lv, 9).pieces) ok(/\/flag$/.test(p.n) ? p.s === FLAG_S : p.s === 1, `${k} lv${lv} ${p.n}: scale ${p.s}`);
for (const k of Object.keys(CIVIC_KINDS)) for (const lv of [1, 6, 12, 18, 24, 30]) for (const p of civicPieces(k, lv, 3)) ok(/\/flag$/.test(p.n) ? p.s === FLAG_S : p.s === 1, `civic ${k} lv${lv} ${p.n}: scale ${p.s}`);
ok(townLodPick(50, 'lo') === 'hi' && townLodPick(50, 'hi') === 'hi' && townLodPick(120, 'hi') === 'lo' && townLodPick(120, 'lo') === 'lo', 'lod: near hi, far lo');
ok(townLodPick(90, 'hi') === 'hi' && townLodPick(90, 'lo') === 'lo' && townLodPick(TOWN_LOD.NEAR, 'lo') === 'lo' && townLodPick(TOWN_LOD.FAR, 'hi') === 'hi', 'lod: hysteresis between NEAR and FAR');
ok(TOWN_LOD.NEAR < TOWN_LOD.FAR, 'NEAR < FAR');
const CL = TOWN_LOD.CELL; ok(townCellKey({ x: 10, z: 10 }) === townCellKey({ x: CL - 10, z: CL - 10 }) && townCellKey({ x: 10, z: 10 }) !== townCellKey({ x: CL + 10, z: 10 }) && townCellKey({ x: -1, z: 5 }) !== townCellKey({ x: 1, z: 5 }) && townCellKey({ x: 5, z: 5, cell: 2 }) === 'h2', 'cell keys: CELL-metre grid, a hamlet is its own cell');
ok(townCellDist([100, 0], { x: 0, y: 100, z: 0 }) > townCellDist([100, 0], { x: 0, y: 20, z: 0 }) && townCellDist([0, 0], { x: 0, y: 3, z: 0 }) === 0 && townCellDist([0, 0, 500, 500], { x: 480, y: 20, z: 480 }) < 40, 'cell distance: nearest house, height counts, never negative');
ok(isVillageHome({}) && isVillageHome({ id: 'house' }) && !isVillageHome({ id: 'barracks' }) && !isVillageHome({ id: 'treasury' }), 'village homes: plain houses only (barracks + treasury stay kit)');
{ const l = villageHomeLot({ x: 2, z: 33, rot: 3.3, nx: 2, nz: 3, floors: 2, scale: 1.4, tid: 7, y: 0.5 }), g = genericTr2({ ...l, kind: 'generic' });
  ok(Math.abs(l.w - 5.6) < 1e-9 && Math.abs(l.d - 8.4) < 1e-9 && l.tid === 7 && l.y === 0.5 && l.ry === 3.3, 'villageHomeLot: footprint = 2*n*scale, tid + plinth height kept'); ok(g.fit >= 0.62 && /_(b|c)\|/.test(g.pieces[0].n), 'villageHomeLot -> generic 2-storey house'); }
sec('words'); const src = ['b2_homes.js', 'b3_civic.js', 'tr2atlas.js', 'town_build.js'].map((f) => fs.readFileSync(ROOT + '/client/src/' + f, 'utf8')).join('\n');
ok(!/['"`][^'"`\n]*\b(bot|ربات)\b[^'"`\n]*['"`]/i.test(src.replace(/\/\/.*$/gm, '')), 'no "bot" / «ربات» in game strings');
console.log(fails.length ? `TR2 S4A FAIL ${fails.length} (of ${n})` : `TR2 S4A OK (${n} checks)`); process.exit(fails.length ? 1 : 0);
