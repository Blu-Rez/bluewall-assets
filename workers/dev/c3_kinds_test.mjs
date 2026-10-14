// C3 kinds test: node (bundled with esbuild by c3_kinds_test.sh) — data checks of c3_kinds.js / c3_proc.js against the kit files
import fs from 'fs';
import { KINDS, BUILD, EXTRA, counts, FX, MINOR, SOLID_R, MINT_YARD } from '/home/claude/bot/bluebot_v2/bluewall/client/src/c3_kinds.js';
import { C3_PROC } from '/home/claude/bot/bluebot_v2/bluewall/client/src/c3_proc.js';
import { rng } from '/home/claude/bot/bluebot_v2/bluewall/client/src/noise.js';
const A = '/home/claude/bot/bluebot_v2/bluewall/web/assets/';
let bad = 0; const fail = (m) => { bad++; console.log('FAIL', m); };
// node names of a glb (JSON chunk)
function glbNodes(f) { const b = fs.readFileSync(f), n = b.readUInt32LE(12); const j = JSON.parse(b.slice(20, 20 + n).toString('utf8')); return new Set(j.nodes.map((q) => q.name)); }
const kit3 = glbNodes(A + 'kit_c3.glb'), kitW = glbNodes(A + 'kit_ws.glb');
const rep = Object.fromEntries(JSON.parse(fs.readFileSync(A + 'kit_c3.report.json', 'utf8')).map((r) => [r.name, r]));
const ids = Object.keys(KINDS);
if (ids.join() !== 'gold,oil,mint,refinery') fail('kinds ' + ids);
for (const k of ids) {
  const K = KINDS[k];
  for (const f of ['fa', 'role', 'in', 'out', 'unlock']) if (K[f] == null || (Array.isArray(K[f]) && !K[f].length)) fail(`${k}.${f} missing`);
  if (!/^[SPTHC]$/.test(K.role)) fail(`${k}.role ${K.role}`);
  if (!(K.unlock >= 1 && K.unlock <= 30)) fail(`${k}.unlock`);
}
for (const k of ['mint', 'refinery']) { if (KINDS[k].inTown !== true) fail(k + ' inTown'); if (!(KINDS[k].r <= 18)) fail(k + ' r>18'); if (KINDS[k].front !== '+z') fail(k + ' front'); }
// counts never decrease with the level, and grow overall
for (const k of ids) {
  let prev = counts(k, 1); if (!Object.keys(prev).length) fail(k + ' counts empty');
  for (let lv = 2; lv <= 30; lv++) { const c = counts(k, lv); for (const key of Object.keys(prev)) if (!(c[key] >= prev[key])) fail(`${k}.${key} drops at lv ${lv}`); prev = c; }
  const a = counts(k, 1), b = counts(k, 30); let grew = 0; for (const key of Object.keys(a)) if (b[key] > a[key]) grew++; if (grew < 3) fail(k + ' grows in only ' + grew + ' counts');
}
// every piece exists in its kit; BUILD deterministic; footprint radius <= 18 (new kinds), piece extents from the kit report
const site = (k) => ({ id: k, kind: k, x: 100, z: 100, ry: 0.5, r: KINDS[k].r || 22 });
const seen = new Set(); let maxR = { mint: 0, refinery: 0 };
for (const k of ['mint', 'refinery']) for (let lv = 1; lv <= 30; lv++) {
  const a = BUILD[k](lv, rng(12345), site(k)), b = BUILD[k](lv, rng(12345), site(k));
  if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${k} BUILD not deterministic at lv ${lv}`);
  if (!a.length) fail(`${k} lv ${lv} empty`);
  for (const p of a) {
    seen.add(p.n); if (!Number.isFinite(p.x + p.z + p.ry + p.s)) fail(`${k} NaN piece ${p.n}`);
    const nm = p.n; if (!(nm.startsWith('c3_') ? kit3.has(nm) : kitW.has(nm))) fail(`${k}: piece ${nm} not in its kit`);
    const sz = rep[nm] ? rep[nm].size : [2, 2, 2]; maxR[k] = Math.max(maxR[k], Math.hypot(p.x, p.z) + Math.max(sz[0], sz[2]) / 2 * p.s);
  }
  // pieces never decrease with the level (the sheet shows MORE with the level)
  if (lv > 1 && a.length < BUILD[k](lv - 1, rng(12345), site(k)).length) fail(`${k} piece count drops at lv ${lv}`);
}
for (const k of ['gold', 'oil']) for (let lv = 1; lv <= 30; lv++) {
  const a = EXTRA[k](lv); if (a.length > 2) fail(`${k} extra > 2 pieces`); for (const p of a) { seen.add(p.n); if (!(p.n.startsWith('c3_') ? kit3.has(p.n) : kitW.has(p.n))) fail(`${k}: ${p.n} not in kit`); }
}
// the procedural parts: record the extent of every primitive (stub of wsbuild's maker)
function probe(kind, lv) {
  let ext = 0, n = 0; const rec = (x, z, e) => { ext = Math.max(ext, Math.hypot(x, z) + e); n++; };
  const T = { tri() {}, quad(...q) { for (const v of q.slice(0, 4)) rec(v[0], v[2], 0); } };
  const M = { S: T, F: { y0: 0 }, P3: (x, y, z) => [x, y, z], box: (t, x, z, y, sx, sy, sz) => rec(x, z, Math.hypot(sx, sz) / 2), cyl: (t, x, z, y, r, h, seg, k, rt) => rec(x, z, Math.max(r, rt || r)), disc() {}, gquad() {} };
  C3_PROC[kind](M, lv, rng(777)); return { ext, n };
}
const pr = { mint: probe('mint', 30), refinery: probe('refinery', 30), gold: probe('gold', 30) };
for (const k of ['mint', 'refinery']) { maxR[k] = Math.max(maxR[k], pr[k].ext); if (!(maxR[k] <= 18)) fail(`${k} footprint ${maxR[k].toFixed(1)} m > 18`); if (!(pr[k].n > 20)) fail(k + ' proc too small'); }
// the front: the mint's gate is at +z (the planner turns +z to the street); fx exist
if (!BUILD.mint(30, rng(1), site('mint')).some((p) => p.n === 'c3_gate' && p.z > 0)) fail('mint gate not at +z');
if (!FX('mint', 30).flames.length || !FX('refinery', 30).flames.length) fail('fx flames missing');
// the credits
const cr = JSON.parse(fs.readFileSync(A + 'credits_c3.json', 'utf8')); const rec = JSON.parse(fs.readFileSync('/home/claude/dev/c3_recipe.json', 'utf8'));
for (const it of rec) { const id = it.src.split('/').slice(-2, -1)[0], base = it.src.split('/').pop(); const hit = cr.some((c) => (c.id && it.src.includes(c.id)) || (c.files && c.files.some((f) => it.src.includes(f)))); if (!hit) fail('no credit for ' + it.name + ' (' + id + '/' + base + ')'); }
for (const c of cr) for (const f of ['name', 'author', 'license']) if (!c[f]) fail('credit incomplete: ' + JSON.stringify(c).slice(0, 80));
console.log(`pieces used: ${[...seen].sort().join(' ')}`); console.log(`footprint (m): mint ${maxR.mint.toFixed(1)}  refinery ${maxR.refinery.toFixed(1)}`);
console.log(bad ? `C3 FAIL (${bad})` : 'C3 OK');
process.exit(bad ? 1 : 0);
