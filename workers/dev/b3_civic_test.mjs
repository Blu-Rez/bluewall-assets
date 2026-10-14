// b3_civic_test.mjs — logic + kit checks of package B3 (run by dev/b3_civic_test.sh, bundled by esbuild).  Prints one line per check and `B3 OK` / `B3 FAIL`.
import fs from 'fs';
import { CIVIC_KINDS, civicPieces, civicTier, civicLevel, civicSolids, civicNames, TIER_AT } from '../bot/bluebot_v2/bluewall/client/src/b3_civic.js';
const ROOT = '/home/claude/bot/bluebot_v2/bluewall', KIT = ROOT + '/web/assets/kit_civic.glb', REP = ROOT + '/web/assets/kit_civic.report.json', CR = ROOT + '/web/assets/credits_b3.json';
const fails = []; let nchk = 0;
const ok = (c, msg) => { nchk++; if (!c) { fails.push(msg); console.log('  FAIL', msg); } };
const sec = (t) => console.log('== ' + t);

sec('kinds');
const KINDS = ['market', 'tavern', 'townhall', 'chapel', 'well'];
ok(JSON.stringify(Object.keys(CIVIC_KINDS).sort()) === JSON.stringify([...KINDS].sort()), 'CIVIC_KINDS ids are exactly market tavern townhall chapel well');
for (const k of KINDS) { const K = CIVIC_KINDS[k]; ok(K && K.w > 0 && K.d > 0 && K.fa && K.role === 'C' && K.place === 'free' && K.unlock >= 1, k + ': footprint {w,d}, fa, role C, place free, unlock (ph)'); }
ok(civicLevel('tavern', 5) === 0 && civicLevel('tavern', 6) === 6 && civicLevel('well', 1) === 1 && civicLevel('market', 99) === 30, 'civicLevel locks below the unlock level');

sec('tiers follow skin.js');
const skin = fs.readFileSync(ROOT + '/client/src/skin.js', 'utf8'), m = skin.match(/export const TIER_AT = \[([^\]]*)\]/);
ok(m && JSON.stringify(m[1].split(',').map(Number)) === JSON.stringify(TIER_AT), 'TIER_AT equals skin.js TIER_AT (' + (m && m[1]) + ')');
ok([1, 5, 6, 11, 12, 17, 18, 23, 24, 29, 30].map(civicTier).join() === '0,0,1,1,2,2,3,3,4,4,5', 'civicTier steps 1 / 6 / 12 / 18 / 24 / 30');

sec('deterministic per seed');
const LV = Array.from({ length: 30 }, (_, i) => i + 1);
let det = true, seedDiff = false, same = 0;
for (const k of KINDS) for (const lv of LV) for (const seed of [1, 2, 7, 12345]) { const a = JSON.stringify(civicPieces(k, lv, seed)), b = JSON.stringify(civicPieces(k, lv, seed)); same++; if (a !== b) det = false; if (a !== JSON.stringify(civicPieces(k, lv, seed + 1))) seedDiff = true; }
ok(det, 'same (kind, lv, seed) -> identical piece list (' + same + ' cases)');
ok(seedDiff, 'different seeds give different details (rotations / jitter)');
ok(civicPieces('market', 0, 1).length === 0 && civicPieces('nope', 5, 1).length === 0, 'level 0 / unknown kind -> no pieces');

sec('pieces are well-formed, local to the lot, inside the footprint');
const rep = JSON.parse(fs.readFileSync(REP, 'utf8')), BB = Object.fromEntries(rep.map((r) => [r.name, r]));
let bad = 0, outside = [];
for (const k of KINDS) {
  const K = CIVIC_KINDS[k];
  for (const lv of [1, 6, 12, 15, 18, 24, 30]) for (const seed of [1, 7]) for (const p of civicPieces(k, lv, seed)) {
    if (!(Number.isFinite(p.x) && Number.isFinite(p.z) && Number.isFinite(p.ry) && p.s > 0 && typeof p.n === 'string')) bad++;
    const b = BB[p.n]; if (!b) continue;
    const c = Math.cos(p.ry), s = Math.sin(p.ry); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const [lx, lz] of [[b.min[0], b.min[2]], [b.max[0], b.min[2]], [b.max[0], b.max[2]], [b.min[0], b.max[2]]]) { const X = p.x + (lx * c + lz * s) * p.s, Z = p.z + (-lx * s + lz * c) * p.s; x0 = Math.min(x0, X); x1 = Math.max(x1, X); z0 = Math.min(z0, Z); z1 = Math.max(z1, Z); }
    if (x0 < -K.w / 2 - 1 || x1 > K.w / 2 + 1 || z0 < -K.d / 2 - 1 || z1 > K.d / 2 + 1) outside.push(`${k} lv${lv} ${p.n} [${x0.toFixed(1)}..${x1.toFixed(1)}, ${z0.toFixed(1)}..${z1.toFixed(1)}]`);
  }
}
ok(bad === 0, 'all piece fields finite, s > 0');
ok(outside.length === 0, 'every piece lies inside its footprint (+1 m): ' + outside.slice(0, 4).join(' | '));
for (const k of KINDS) { const s = civicSolids(k, 30, 1); ok(s.length >= 1 && s.every((q) => q.length === 3 && q.every(Number.isFinite)), k + ': civicSolids gives circles [x, z, r]'); }

sec('every piece name exists in the kit; kit = 1 material, no texture, <= 400 KB');
const buf = fs.readFileSync(KIT), jl = buf.readUInt32LE(12), J = JSON.parse(buf.slice(20, 20 + jl).toString('utf8'));
ok(buf.slice(0, 4).toString() === 'glTF', 'kit_civic.glb is a GLB');
const have = new Set(J.scenes[J.scene || 0].nodes.map((i) => J.nodes[i].name)), want = civicNames();
const missing = want.filter((n) => !have.has(n)); ok(missing.length === 0, 'all ' + want.length + ' piece names used by civicPieces exist in the kit: missing ' + missing.join(','));
const unused = [...have].filter((n) => !want.includes(n)); console.log('  kit pieces never used:', unused.join(' ') || '(none)');
ok((J.materials || []).length === 1 && !(J.textures || []).length && !(J.images || []).length, 'kit has 1 material, 0 textures (+0 programs, 1 draw call per batch): materials ' + (J.materials || []).length + ', textures ' + (J.textures || []).length);
ok(buf.length <= 400 * 1024, 'kit size ' + buf.length + ' B <= 409600 (400 KB)');
console.log('  kit bytes', buf.length, ' pieces', have.size);

sec('no two standing things on the same spot');
{ let clash = []; const SOL = ['church', 'tavern', 'hall', 'wing', 'tower', 'markethall', 'well', 'cross', 'stall', 'tableset', 'counting', 'stairs'];
  for (const k of KINDS) for (const lv of [1, 6, 12, 15, 18, 24, 30]) { const L = civicPieces(k, lv, 3).filter((p) => SOL.some((s) => p.n.startsWith('cv_' + s)));
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (Math.hypot(L[i].x - L[j].x, L[i].z - L[j].z) < (L[i].n.startsWith('cv_stall') && L[j].n.startsWith('cv_stall') ? 3.2 : 1.2)) clash.push(`${k} lv${lv} ${L[i].n}+${L[j].n} @${L[i].x},${L[i].z}`); }
  ok(clash.length === 0, 'no two buildings / stalls / tables share a spot: ' + clash.slice(0, 3).join(' | ')); }

sec('looks differ: kinds, levels 1 / 15 / 30');
const main = (k, lv) => civicPieces(k, lv, 1).map((p) => p.n).filter((n) => /_(b|y)$|^cv_(cross|stall)/.test(n)).sort().join();
const sigs = KINDS.map((k) => main(k, 15)); ok(new Set(sigs).size === KINDS.length, 'the 5 kinds use different main pieces at lv 15');
for (const k of KINDS) {
  const a = civicPieces(k, 1, 1), b = civicPieces(k, 15, 1), c = civicPieces(k, 30, 1);
  ok(a.length < b.length && b.length < c.length, `${k}: pieces grow with the level (${a.length} -> ${b.length} -> ${c.length})`);
  ok(JSON.stringify(a) !== JSON.stringify(b) && JSON.stringify(b) !== JSON.stringify(c), k + ': lv 1 / 15 / 30 lists differ');
  let prev = 0, mono = true; for (const lv of LV) { const n = civicPieces(k, lv, 1).length; if (n < prev) mono = false; prev = n; } ok(mono, k + ': piece count never drops when the level rises');
  ok(c.some((p) => /_y$/.test(p.n)) && !a.some((p) => /_y$/.test(p.n)), k + ': gold-roofed twin only from the gold tier (lv 18+)');
}

sec('cost (kit report tris) — what a lot costs');
const tr = (k, lv) => civicPieces(k, lv, 1).reduce((a, p) => a + ((BB[p.n] && BB[p.n].tris) || 0), 0);
for (const k of KINDS) console.log('  tris', k.padEnd(9), [1, 15, 30].map((lv) => 'lv' + lv + ' ' + tr(k, lv)).join('   '));
console.log('B3COST', JSON.stringify(Object.fromEntries(KINDS.map((k) => [k, { lv1: tr(k, 1), lv15: tr(k, 15), lv30: tr(k, 30) }]))));

sec('credits');
if (fs.existsSync(CR)) {
  const C = JSON.parse(fs.readFileSync(CR, 'utf8')), txt = JSON.stringify(C);
  ok(Array.isArray(C) && C.length >= 3 && C.every((e) => e.id && e.name && e.author && e.license && e.source), 'credits_b3.json: array of { id, name, author, license, source } (same shape as credits_new.json)');
  ok(/KayKit/.test(txt) && /Fantasy Props/.test(txt) && /Medieval Village/.test(txt) && C.every((e) => /CC0|CC-BY/.test(e.license)), 'credits name KayKit Medieval Hexagon, Fantasy Props MegaKit, Medieval Village MegaKit — all CC0 / CC-BY');
} else ok(false, 'credits_b3.json missing');

console.log(`${nchk} checks`);
console.log(fails.length ? 'B3 FAIL ' + fails.length : 'B3 OK');
process.exit(fails.length ? 1 : 0);
