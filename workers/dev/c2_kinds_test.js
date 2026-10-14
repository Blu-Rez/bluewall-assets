// c2_kinds_test.js — package C2 (timber, stone, metal): the data contract of the six kinds.  run: bash dev/c2_kinds_test.sh  -> prints "C2 OK"
import fs from 'fs';
import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { WS_KINDS, pieces, counts, wsLevel, wsSolids } from '../bot/bluebot_v2/bluewall/client/src/worksites.js';
import * as C2 from '../bot/bluebot_v2/bluewall/client/src/c2_kinds.js';
L.setMap('night');
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL', m); } else if (process.env.V) console.log('ok  ', m); };
const ASSETS = '/home/claude/bot/bluebot_v2/bluewall/web/assets/';
// piece names of a glb = the top-level nodes of its default scene (the JSON chunk is plain even when the buffers are meshopt-compressed)
function glbNames(file) {
  const b = fs.readFileSync(file), len = b.readUInt32LE(12), j = JSON.parse(b.slice(20, 20 + len).toString('utf8'));
  return new Set(j.scenes[j.scene || 0].nodes.map((i) => j.nodes[i].name));
}
const NAMES = new Set([...glbNames(ASSETS + 'kit_ws.glb'), ...glbNames(ASSETS + 'kit_c2.glb')]);
const SIZE = {}; for (const f of ['/home/claude/dev/p38/kit_ws4.report.json', '/home/claude/dev/c2_kit.report.json']) for (const r of JSON.parse(fs.readFileSync(f, 'utf8'))) if (r.size) SIZE[r.name] = r.size;
const KINDS = ['lumber', 'quarry', 'iron', 'sawmill', 'masonry', 'smelter'], NEW = ['sawmill', 'masonry', 'smelter'];
const siteOf = (kind) => ({ id: 't_' + kind, kind, x: 120.5, z: -80.25, ry: 0.4, r: (WS_KINDS[kind] && WS_KINDS[kind].r) || 24 });

// 1. every kind: fa / role / in / out / unlock
for (const k of KINDS) {
  const d = WS_KINDS[k];
  ok(d && typeof d.fa === 'string' && d.fa.length > 1, `${k}: fa`);
  ok(d && 'SPTHC'.includes(d.role) && d.role.length === 1, `${k}: role ${d && d.role}`);
  ok(d && typeof d.in === 'string' && typeof d.out === 'string' && d.in && d.out && d.in !== d.out, `${k}: in ${d && d.in} -> out ${d && d.out}`);
  ok(d && Number.isFinite(d.unlock) && d.unlock >= 1 && d.unlock <= 30, `${k}: unlock ${d && d.unlock}`);
  ok(wsLevel({ kind: k }, d.unlock - 1) === 0 && wsLevel({ kind: k }, d.unlock) > 0, `${k}: locked below ${d.unlock}, open at ${d.unlock}`);
}
// the chain of the table: S supply -> P processing
ok(WS_KINDS.lumber.out === WS_KINDS.sawmill.in && WS_KINDS.quarry.out === WS_KINDS.masonry.in && WS_KINDS.iron.out === WS_KINDS.smelter.in, 'chain: lumber -> sawmill, quarry -> masonry, iron -> smelter');
ok(['lumber', 'quarry', 'iron'].every((k) => WS_KINDS[k].role === 'S') && NEW.every((k) => WS_KINDS[k].role === 'P'), 'roles S / P');
ok(WS_KINDS.lumber.unlock === 1 && WS_KINDS.quarry.unlock === 2 && WS_KINDS.iron.unlock === 8, 'the existing unlock levels are untouched');

// 2. every piece of every level exists in the kits; 3. counts never decrease; pieces never decrease; 4. BUILD is deterministic
const used = new Set();
for (const k of KINDS) {
  const s = siteOf(k); let prevC = null, prevN = 0, anyGrow = false;
  for (let lv = 1; lv <= 30; lv++) {
    const a = pieces(s, lv), b = pieces(s, lv);
    ok(JSON.stringify(a) === JSON.stringify(b), `${k} lv${lv}: BUILD deterministic`);
    for (const p of a) { used.add(p.n); if (!NAMES.has(p.n)) ok(false, `${k} lv${lv}: piece ${p.n} is not in the kits`); if (![p.x, p.z, p.ry, p.s].every(Number.isFinite)) ok(false, `${k} lv${lv}: ${p.n} has a non-finite number`); }
    ok(a.length >= prevN, `${k} lv${lv}: pieces ${a.length} >= ${prevN}`); prevN = a.length;
    const c = counts(s, lv);
    if (prevC) for (const key of Object.keys(c)) { ok(c[key] >= (prevC[key] || 0), `${k} lv${lv}: counts.${key} ${c[key]} >= ${prevC[key]}`); if (c[key] > prevC[key]) anyGrow = true; }
    prevC = c;
  }
  const c1 = counts(s, 1), c30 = counts(s, 30);
  ok(anyGrow && c30.workers > c1.workers && c30.carts > c1.carts, `${k}: workers ${c1.workers} -> ${c30.workers}, carts ${c1.carts} -> ${c30.carts}`);
  if (NEW.includes(k)) for (const key of Object.keys(c30)) ok(c30[key] > c1[key], `${k}: counts.${key} grows ${c1[key]} -> ${c30[key]}`);
}
for (const nm of used) if (/^c2_/.test(nm)) ok(NAMES.has(nm), `kit_c2 has ${nm}`);
for (const nm of glbNames(ASSETS + 'kit_c2.glb')) ok(/^c2_/.test(nm), `kit_c2 piece ${nm} is prefixed c2_`);

// 5. the three new kinds: inTown, footprint <= 18 m, a front (+z) the planner can face to a street
const MAIN = { sawmill: 'c2_sawshed', masonry: 'c2_masonlodge', smelter: 'c2_smeltery' };
for (const k of NEW) {
  const d = WS_KINDS[k], s = siteOf(k), P30 = pieces(s, 30);
  ok(d.inTown === true, `${k}: inTown`);
  ok(d.place === 'free' && d.r <= 18, `${k}: place free, r ${d.r} <= 18`);
  if (process.env.EXT) console.log(k, P30.map((p) => [p.n, +(Math.hypot(p.x, p.z) + 0.5 * Math.max(...(SIZE[p.n] ? [SIZE[p.n][0], SIZE[p.n][2]] : [0])) * p.s).toFixed(1), p.x, p.z]).sort((a, b) => b[1] - a[1]).slice(0, 7).map((q) => q.join(' ')).join(' | '));
  let ext = 0, worst = null; for (const p of P30) { const sz = SIZE[p.n]; if (!sz) { ok(false, `${k}: no size for ${p.n}`); continue; } const e = Math.hypot(p.x, p.z) + 0.5 * Math.max(sz[0], sz[2]) * p.s; if (e > ext) { ext = e; worst = p.n; } }
  ok(ext <= 18, `${k}: footprint radius at lv30 ${ext.toFixed(1)} m <= 18 (${worst})`);
  const m = P30.find((p) => p.n === MAIN[k]); ok(m && m.z < -4 && Math.abs(m.x) < 1, `${k}: main building ${MAIN[k]} stands at the back (z ${m && m.z})`);
  ok(P30.some((p) => p.z > 8) && P30.filter((p) => p.z > 0).length >= P30.filter((p) => p.z < -4).length * 0.5, `${k}: yard in front (+z) of the building`);
  for (const lv of [1, 15, 30]) { const mm = pieces(s, lv).find((p) => p.n === MAIN[k]); ok(mm && Math.abs(mm.ry) < 1e-9, `${k} lv${lv}: main building faces +z (ry 0)`); }
}
// 6. fx points + trades (the shapes wslife.js reads) + solids
const sm = C2.FX('smelter', 30); ok(sm.filter((f) => f.k === 'smoke').length >= 4 && sm.filter((f) => f.k === 'flame').length >= 4 && sm.every((f) => f.y > 0 && Math.hypot(f.x, f.z) < 20), 'smelter fx: chimney smoke + mouth flames');
ok(C2.FX('smelter', 1).length < sm.length, 'smelter fx grows with the level');
for (const k of NEW) for (const lv of [1, 15, 30]) {
  const T = C2.TRADES[k](lv), r = WS_KINDS[k].r + 2; let tw = 0;
  ok(Array.isArray(T) && T.length >= 2, `${k} lv${lv}: trades`);
  for (const t of T) { tw += t.w; ok(['axe', 'pick', 'man', 'woman', 'rod'].includes(t.k) && t.w > 0 && t.tasks.length > 0, `${k} lv${lv}: trade ${t.k}`);
    for (const q of t.tasks) { ok([q.x, q.z, q.fx, q.fz, q.a, q.b].every(Number.isFinite) && typeof q.clip === 'string' && q.a <= q.b, `${k} lv${lv}: task shape`); ok(Math.hypot(q.x, q.z) < r, `${k} lv${lv}: task (${q.x}, ${q.z}) inside the site`);
      for (const p of pieces(siteOf(k), lv)) if (/^c2_(masonlodge|smeltery|furnace)$/.test(p.n) && p.s > 0.7) ok(Math.hypot(q.x - p.x, q.z - p.z) > C2.SOLID_R[p.n] * p.s + 0.3, `${k} lv${lv}: worker spot (${q.x}, ${q.z}) is outside the solid ${p.n}`); } }
  ok(tw > 0, `${k} lv${lv}: trade weights`);
}
ok(Object.keys(C2.CART_OF).sort().join() === NEW.slice().sort().join() && Object.values(C2.CART_OF).every(([c, l, m]) => NAMES.has(c) && NAMES.has(l) && m > 0), 'carts carry kit_ws pieces');
ok(typeof wsSolids() === 'object', 'wsSolids runs'); const s30 = pieces(siteOf('smelter'), 30); ok(C2.SOLID_R.c2_smeltery > 0 && s30.some((p) => C2.SOLID_R[p.n] > 0), 'solid radii of the big pieces');
ok(C2.MINOR.test('c2_plankstack') && !C2.MINOR.test('c2_sawshed') && !C2.MINOR.test('c2_smeltery') && !C2.MINOR.test('c2_masonlodge') && !C2.MINOR.test('c2_furnace'), 'small props are near-only, buildings are not');
// 7. the three existing kinds: only additions (never fewer pieces than before the package)
for (const k of ['lumber', 'quarry', 'iron']) { const s = siteOf(k), ex = C2.EXTRA[k]; for (const lv of [1, 15, 30]) { const e = ex(lv, () => 0.5, s); ok(e.length <= 2 && new Set(e.map((p) => p.n)).size <= 2, `${k} lv${lv}: <= 2 extra piece kinds (${e.length})`); } }
console.log(bad ? `C2 FAIL (${bad} of ${n})` : `C2 OK (${n} checks)`);
process.exit(bad ? 1 : 0);
