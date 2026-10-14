// c1_kinds_test.js — package C1 (the water family): kinds, layouts, counts, kits, procedural parts.  Prints "C1 OK" or "C1 FAIL (n)".
import * as THREE from 'three';
import fs from 'fs';
import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import * as C1 from '../bot/bluebot_v2/bluewall/client/src/c1_kinds.js';
import { WS_KINDS, pieces, counts, wsLevel, placeRule, wsSolids } from '../bot/bluebot_v2/bluewall/client/src/worksites.js';
import { buildWorksites } from '../bot/bluebot_v2/bluewall/client/src/wsbuild.js';
L.setMap('night');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } else console.log('ok  ', m); };
const ASSETS = '/home/claude/bot/bluebot_v2/bluewall/web/assets/';
const glbNames = (f) => { const b = fs.readFileSync(ASSETS + f), n = b.readUInt32LE(12), j = JSON.parse(b.slice(20, 20 + n).toString('utf8')); const sc = j.scenes[j.scene || 0]; return new Set(sc.nodes.map((i) => j.nodes[i].name)); };
const KIT = { ws_: glbNames('kit_ws.glb'), c1_: glbNames('kit_c1.glb') };
const KS = ['fishery', 'panning', 'smokehouse'];
// sites: the real fisheries + two C1 sites (the planner is not wired yet: local +z faces the water)
const fish = L.SITES.find((s) => s.id === 'fishery_lake');
const SITE = { fishery: fish, panning: { id: 'panning1', kind: 'panning', x: 22, z: -143, ry: -0.25, r: 22, link: [0, 0], water: [30, -120] }, smokehouse: { id: 'smokehouse1', kind: 'smokehouse', x: -122, z: -75, ry: 0.85, r: 22, link: [0, 0], water: [-110, -60] } };

// 1. every kind: fa / role / in / out / unlock (+ place water for the two new ones, the water facing documented)
for (const k of KS) {
  const e = C1.KINDS[k]; ok(e && typeof e.fa === 'string' && e.fa.length > 1, `${k}: fa`);
  ok(['S', 'P', 'T', 'H', 'C'].includes(e.role), `${k}: role ${e.role}`);
  ok(Array.isArray(e.in) && e.in.length && Array.isArray(e.out) && e.out.length, `${k}: in ${e.in} -> out ${e.out}`);
  ok(Number.isFinite(e.unlock) && e.unlock >= 1 && e.unlock <= 30, `${k}: unlock ${e.unlock} (ph)`);
  ok(typeof e.paint === 'string', `${k}: paint`);
  ok(WS_KINDS[k] && WS_KINDS[k].fa, `${k}: present in worksites WS_KINDS after the wiring`);
}
ok(C1.KINDS.panning.place === 'water' && C1.KINDS.smokehouse.place === 'water', "panning + smokehouse declare place: 'water'");
ok(placeRule(SITE.panning) === 'water' && placeRule(SITE.smokehouse) === 'water', 'placeRule() says water for both');
ok(typeof C1.WATER_FACING === 'string' && /site\.water/.test(C1.WATER_FACING) && C1.FOOTPRINT.panning.r > 0 && C1.FOOTPRINT.smokehouse.r > 0, 'water facing point documented (WATER_FACING) + footprints for the planner');
ok(C1.KINDS.smokehouse.inTown === true && C1.KINDS.smokehouse.role === 'P' && C1.KINDS.panning.role === 'S', 'smokehouse = processing, inTown; panning = supply');
ok(wsLevel(SITE.panning, C1.KINDS.panning.unlock - 1) === 0 && wsLevel(SITE.panning, C1.KINDS.panning.unlock) > 0, 'panning: locked below its unlock level');
ok(wsLevel(SITE.smokehouse, C1.KINDS.smokehouse.unlock - 1) === 0 && wsLevel(SITE.smokehouse, 30) === 30, 'smokehouse: locked below its unlock level');
ok(C1.STORE_OF.panning === 'gold' && C1.STORE_OF.smokehouse === 'food' && C1.CART_OF.panning && C1.CART_OF.smokehouse, 'store + cart per product declared (for wslife)');

// 2. every piece name exists in its kit; shape of a piece; deterministic; nothing off the pad
const seen = new Set();
for (const k of KS) {
  let prev = null;
  for (let lv = 1; lv <= 30; lv++) {
    const a = pieces(SITE[k], lv), b = pieces(SITE[k], lv);
    ok(JSON.stringify(a) === JSON.stringify(b), `${k} lv ${lv}: BUILD deterministic`) || 0;
    for (const p of a) { seen.add(p.n); if (!(['x', 'z', 'ry', 's'].every((f) => Number.isFinite(p[f])))) ok(false, `${k} lv ${lv}: bad piece ${JSON.stringify(p)}`); }
    if (lv === 1 || lv === 30) for (const p of (k === 'fishery' ? C1.BUILD.fishery(lv, () => 0.5, SITE[k]) : a)) if (Math.hypot(p.x, p.z) > 16.5) ok(false, `${k} lv ${lv}: ${p.n} at (${p.x.toFixed(1)}, ${p.z.toFixed(1)}) is off the pad`);
    if (prev) ok(a.length >= prev, `${k} lv ${lv}: piece count does not fall (${prev} -> ${a.length})`);
    prev = a.length;
  }
}
for (const n of seen) { const pre = n.slice(0, 3); ok(KIT[pre] && KIT[pre].has(n), `piece ${n} exists in ${pre === 'c1_' ? 'kit_c1.glb' : 'kit_ws.glb'}`); }
for (const n of ['c1_house', 'c1_pan', 'c1_table', 'c1_chest', 'c1_bench', 'c1_bucketm']) ok(KIT.c1_.has(n), `kit_c1.glb has ${n}`);
ok([...KIT.c1_].every((n) => /^c1_/.test(n)), 'every piece of kit_c1.glb is prefixed c1_');
ok(C1.BUILD.fishery(30, () => 0.5, SITE.fishery).length <= 2, 'fishery: at most 2 extra pieces');
for (const k of ['panning', 'smokehouse']) ok(pieces(SITE[k], 30).length > pieces(SITE[k], 1).length + 8, `${k}: far more pieces at 30 (${pieces(SITE[k], 30).length}) than at 1 (${pieces(SITE[k], 1).length})`);

// 3. counts never decrease with the level, and grow overall (workers / carts / boats ...)
for (const k of KS) {
  let prev = counts(SITE[k], 1);
  for (let lv = 2; lv <= 30; lv++) { const c = counts(SITE[k], lv); for (const key of Object.keys(prev)) if (!(c[key] >= prev[key])) ok(false, `${k}: counts.${key} falls at lv ${lv} (${prev[key]} -> ${c[key]})`); prev = c; }
  const c1 = counts(SITE[k], 1), c30 = counts(SITE[k], 30);
  ok(Object.keys(c30).every((key) => c30[key] >= (c1[key] ?? 0)) && Object.keys(c30).some((key) => c30[key] > (c1[key] ?? 0)), `${k}: counts grow ${JSON.stringify(c1)} -> ${JSON.stringify(c30)}`);
}
for (const k of ['panning', 'smokehouse']) { const c1 = counts(SITE[k], 1), c30 = counts(SITE[k], 30); ok(c30.workers > c1.workers && c30.carts > c1.carts, `${k}: more workers (${c1.workers} -> ${c30.workers}) and carts (${c1.carts} -> ${c30.carts})`); }
ok(counts(SITE.fishery, 30).boats === 9 && counts(SITE.fishery, 30).fishermen === 9 && counts(SITE.fishery, 1).nets === 1 && counts(SITE.fishery, 30).nets === 2, 'fishery: the old counts are untouched, nets 1 -> 2');
ok(Object.keys(counts(SITE.panning, 0)).length === 0, 'level 0: nothing');

// 4. smoke + workers
ok(C1.smokers('smokehouse', 1).length === 1 && C1.smokers('smokehouse', 30).length === 2 && C1.smokers('panning', 30).length === 0, 'smoke: 1 stack at lv 1, 2 at lv 30, none elsewhere');
for (const q of C1.smokers('smokehouse', 30)) ok(Number.isFinite(q.x) && q.y > 5 && Math.hypot(q.x, q.z) < 17, `smoke point (${q.x}, ${q.y}, ${q.z}) is above a stack, on the pad`);
for (const k of ['panning', 'smokehouse']) for (const lv of [1, 15, 30]) {
  const tr = C1.TRADES[k](lv); let n = 0;
  for (const r of tr) { ok(['man', 'woman', 'axe', 'pick', 'rod'].includes(r.k) && r.w > 0 && r.tasks.length > 0, `${k} lv ${lv}: trade ${r.k} has tasks`); for (const t of r.tasks) { n++; if (!['x', 'z', 'fx', 'fz', 'a', 'b'].every((f) => Number.isFinite(t[f])) || !['Interact', 'Fixing_Kneeling', 'Idle_Talking_Loop', 'Idle_Torch_Loop'].includes(t.clip) || Math.hypot(t.x, t.z) > (t.z >= 12 ? 23 : 17)) ok(false, `${k} lv ${lv}: bad task ${JSON.stringify(t)}`); } }
  if (lv === 30) ok(n >= counts(SITE[k], 30).workers, `${k}: ${n} work spots for ${counts(SITE[k], 30).workers} workers`);
}
// no worker stands inside a building
const SOL = { ...C1.SOLID, ws_hut: 3.6, ws_watchtower2: 2.2, ws_stall_empty: 1.6 };
for (const k of ['panning', 'smokehouse']) {
  const P = pieces(SITE[k], 30).filter((p) => SOL[p.n]);
  for (const r of C1.TRADES[k](30)) for (const t of r.tasks) for (const p of P) if (Math.hypot(t.x - p.x, t.z - p.z) < SOL[p.n] * p.s * 0.8) ok(false, `${k}: work spot (${t.x}, ${t.z}) inside ${p.n}`);
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) if (Math.hypot(P[i].x - P[j].x, P[i].z - P[j].z) < (SOL[P[i].n] * P[i].s + SOL[P[j].n] * P[j].s) * 0.7) ok(false, `${k}: ${P[i].n} overlaps ${P[j].n}`);
}
ok(wsSolids().every((s) => s.every(Number.isFinite)), 'wsSolids() still sane');

// 5. the procedural parts (nets, sluices, stacks, sheds, baskets): triangles per level, finite, growing
L.SITES.push(SITE.panning, SITE.smokehouse);
const tris = (kind, lv) => { const sc = new THREE.Scene(), ws = buildWorksites(sc, null, (x, z) => 0, { castle: 0 }); const o = {}; for (const s of L.SITES) o[s.kind] = 0; o[kind] = lv; ws.rebuild(o); let t = 0, fin = true; sc.traverse((m) => { if (m.isMesh && m.name.startsWith('ws:' + (kind === 'fishery' ? 'fishery_lake' : kind + '1'))) { const p = m.geometry.attributes.position; t += p.count / 3; for (let i = 0; i < p.array.length; i++) if (!Number.isFinite(p.array[i])) fin = false; } }); return { t, fin, smokers: ws.smokers.length }; };
for (const k of ['panning', 'smokehouse']) { let prev = 0; for (const lv of [1, 5, 10, 15, 20, 30]) { const r = tris(k, lv); ok(r.fin, `${k} lv ${lv}: procedural geometry is finite (${r.t} tris)`); ok(r.t >= prev, `${k} lv ${lv}: procedural tris do not fall`); prev = r.t; if (lv === 30) ok(r.t < 9000, `${k} lv 30: procedural part ${r.t} tris (< 9000)`); } }
{ const a = tris('fishery', 1), b = tris('fishery', 30); ok(b.t > 0 && b.t < 3000, `fishery: nets + net poles ${a.t} -> ${b.t} tris`); }
{ const a = tris('smokehouse', 1), b = tris('smokehouse', 30); ok(a.smokers === 1 && b.smokers === 2, `wsbuild exports the smoke points (${a.smokers} -> ${b.smokers})`); }
console.log(bad ? `C1 FAIL (${bad})` : 'C1 OK');
