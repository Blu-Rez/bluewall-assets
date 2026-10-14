// TR2-S4b: the Tripo models of the worksites — plan() invariants.  Bundled by dev/tr2_s4b_test.sh (esbuild, node).  Last line: "S4B OK"
import './tr2_s4b/node_stub.js';
import fs from 'node:fs';
import * as T from '/home/claude/bot/bluebot_v2/bluewall/client/src/tiers.js';
import * as W from '/home/claude/bot/bluebot_v2/bluewall/client/src/worksites.js';
import '/home/claude/bot/bluebot_v2/bluewall/client/src/town_plan.js';
import * as WT from '/home/claude/bot/bluebot_v2/bluewall/client/src/ws_tr2.js';
const DIR = '/home/claude/bot/bluebot_v2/bluewall/web/assets/tr2/';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const shipped = new Set(fs.readdirSync(DIR).filter((f) => f.endsWith('.glb')).map((f) => f.slice(0, -4)));
const swap = JSON.parse(fs.readFileSync(DIR + 'swap.json', 'utf8'));
const S = W.sites();
const fileOf = (spec) => { const i = spec.indexOf('/'); return i < 0 ? spec : spec.slice(0, i); };
console.log('== 0. sites: ' + S.length + ' (' + S.filter((s) => s.town).length + ' town lots), shipped Tripo files: ' + shipped.size);
ok(S.length >= 30 && S.some((s) => s.town), 'the map has the outer sites and the town production lots');
ok(T.LEVEL_CAP === 30, 'default level cap is 30');

console.log('== 1. nothing loaded -> the old pieces, untouched (a failed / late download never leaves a hole)');
let bad1 = 0, n1 = 0;
for (const s of S) for (let lv = 1; lv <= 30; lv++) {
  const list = W.pieces(s, lv), p = WT.plan(s, lv, list, { has: () => false }); n1++;
  if (p.keep.length !== list.length || p.keep.some((o, i) => o !== list[i]) || p.tr2.length || p.noProc.size || p.noMovers) bad1++;
}
ok(bad1 === 0, 'plan() with no Tripo file loaded returns the list as it was, ' + n1 + ' site x level cases');

console.log('== 2. everything loaded');
let bad2 = [], rep = {}, maxPl = 0, used = new Set();
for (const s of S) for (let lv = 1; lv <= 30; lv++) {
  const list = W.pieces(s, lv), p = WT.plan(s, lv, list, { has: () => true });
  const inList = new Set(list); if (p.keep.some((o) => !inList.has(o))) bad2.push(s.id + ' lv' + lv + ': keep has a foreign piece');
  if (p.keep.length > list.length) bad2.push(s.id + ' lv' + lv + ': keep longer than the list');
  for (const a of p.tr2) {
    used.add(fileOf(a.spec));
    if (!shipped.has(fileOf(a.spec))) bad2.push(s.id + ': ' + a.spec + ' is not shipped');
    if (!(a.k > 1.5 && a.k < 40) || !isFinite(a.x) || !isFinite(a.z) || !isFinite(a.ry)) bad2.push(s.id + ' lv' + lv + ': bad placement ' + JSON.stringify(a));
    if (s.clip && W.inClip && !W.inClip(s.clip, a.x, a.z) && !a.noClip) bad2.push(s.id + ' lv' + lv + ': ' + a.spec + ' outside the lot clip');
  }
  maxPl = Math.max(maxPl, p.tr2.length); if (lv === 30) rep[s.id] = p.tr2.length + ' Tripo / ' + p.keep.length + ' old (of ' + list.length + ')';
  const p2 = WT.plan(s, lv, list, { has: () => true }); if (JSON.stringify(p2.tr2) !== JSON.stringify(p.tr2)) bad2.push(s.id + ': plan() is not deterministic');
}
ok(bad2.length === 0, 'every placement is a shipped file, finite, scale 1.5..40 m, inside the lot clip, deterministic' + (bad2.length ? '  e.g. ' + bad2.slice(0, 4).join(' | ') : ''));
ok(maxPl <= 20, 'at most 20 Tripo placements on one site (max ' + maxPl + ')');
console.log('     level 30: ' + Object.entries(rep).map(([k, v]) => k + ' ' + v).join(' | '));
console.log('     files used: ' + [...used].sort().join(' '));
ok([...used].every((f) => swap.models[f] && (swap.models[f].ry === undefined || typeof swap.models[f].ry === 'number')), 'every used model has its entry in tr2/swap.json (ry omitted = 0)');

console.log('== 3. a composite needs ALL its files (no half a farm)');
{
  const farm = S.find((s) => s.kind === 'farm'), list = W.pieces(farm, 30);
  const half = WT.plan(farm, 30, list, { has: (f) => f === 'farm_field_1' });
  ok(half.noProc.size === 0 && !half.tr2.some((a) => a.spec.startsWith('farm_field')), 'farm with only farm_field_1 loaded: the procedural plots stay, no Tripo field');
  const all = WT.plan(farm, 30, list, { has: () => true });
  ok(all.noProc.has('farmplots') && all.tr2.filter((a) => a.spec.startsWith('farm_field')).length === W.counts(farm, 30).plots, 'farm fully loaded: one Tripo field per plot, the procedural plots off');
  const qu = S.find((s) => s.kind === 'quarry'), ql = W.pieces(qu, 30);
  const q0 = WT.plan(qu, 30, ql, { has: () => false }), q1 = WT.plan(qu, 30, ql, { has: () => true });
  ok(q0.keep.length === ql.length && q1.keep.length < ql.length && q1.noProc.has('quarry'), 'quarry: the three rocks go only when stone_quarry_1 is loaded');
  const mint = S.find((s) => s.kind === 'mint'), ml = W.pieces(mint, 30);
  ok(WT.plan(mint, 30, ml, { has: () => false }).keep.length === ml.length && WT.plan(mint, 30, ml, { has: () => true }).keep.length < ml.length, 'mint: hall + vault become ONE Tripo mint only when it is loaded');
}

console.log('== 4. the level cap: levels 1..50 at cap 50, no throw');
T.setLevelCap(50);
let thrown = 0, cases = 0;
for (const s of S) for (let lv = 1; lv <= 50; lv++) { try { const list = W.pieces(s, lv); WT.plan(s, lv, list, { has: () => true }); W.counts(s, lv); cases++; } catch (e) { thrown++; if (thrown < 4) console.log('     ' + s.id + ' lv' + lv + ' ' + e.message); } }
ok(thrown === 0, 'pieces() + plan() + counts() for every site at every level 1..50 (cap 50): ' + cases + ' cases');
ok(W.wsLevel(S[0], 50) <= 50 && Math.max(...S.map((s) => W.wsLevel(s, 50))) <= 50, 'wsLevel never above the cap');
T.setLevelCap(30);
ok(T.LEVEL_CAP === 30, 'cap back to 30');

console.log('== 5. files');
const need = WT.neededFiles(30);
ok(need.length > 20 && need.every((f) => shipped.has(f)), 'neededFiles(30): ' + need.length + ' files, all shipped');
ok(WT.missing(30).length === need.length, 'nothing loaded yet -> all of them missing (' + WT.missing(30).length + ')');
ok(WT.neededFiles(1).length < need.length && WT.neededFiles(1).length <= 8, 'level 1 needs only a handful (' + WT.neededFiles(1).length + ') -> the early game downloads little');
const MB = [...shipped].reduce((a, f) => a + fs.statSync(DIR + f + '.glb').size, 0) / 1048576;
console.log('     shipped tr2 GLBs: ' + shipped.size + ' files, ' + MB.toFixed(1) + ' MB (only the needed ones are fetched)');
console.log(fails ? 'S4B FAIL (' + fails + ')' : 'S4B OK');
process.exit(fails ? 1 : 0);
