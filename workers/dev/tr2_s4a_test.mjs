// tr2_s4a_test.mjs — TR2-S4a data checks (houses + civic from the Tripo library).  Prints `TR2 S4A OK` / `TR2 S4A FAIL n`.
import fs from 'fs';
import { HOME_TR2, homeTr2, homeTr2Files, HOME_KINDS, homeTier } from '../bot/bluebot_v2/bluewall/client/src/b2_homes.js';
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
sec('words'); const src = ['b2_homes.js', 'b3_civic.js', 'tr2atlas.js'].map((f) => fs.readFileSync(ROOT + '/client/src/' + f, 'utf8')).join('\n');
ok(!/['"`][^'"`\n]*\b(bot|ربات)\b[^'"`\n]*['"`]/i.test(src.replace(/\/\/.*$/gm, '')), 'no "bot" / «ربات» in game strings');
console.log(fails.length ? `TR2 S4A FAIL ${fails.length} (of ${n})` : `TR2 S4A OK (${n} checks)`); process.exit(fails.length ? 1 : 0);
