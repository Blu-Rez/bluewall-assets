// TR2_H data test: tint (H1), lantern scale (H4), footprints (H2/H3), bridges (step 3), edge strip (step 4).  Prints `TR2 H OK` or `TR2 H FAIL n`.
import * as THREE from 'three';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
import { homeTr2, genericTr2, lotTint, footOf, groundOf, GROUND_FOOT, HOME_TR2, GENERIC, LANTERN_S, FLAG_S } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b2_homes.js';
import { bridgeTr2, BRIDGE_DECK } from '/home/claude/bot/bluebot_v2/bluewall/client/src/bridges_tr2.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
// ---- H1: determinism, ranges, families
const fam = {}; let n = 0;
for (let i = 0; i < 2000; i++) {
  const lot = { x: Math.sin(i * 1.7) * 200 + i * 0.13, z: Math.cos(i * 2.3) * 200 - i * 0.07, kind: i % 5 === 0 ? 'noble' : 'cottage' };
  const a = lotTint(lot), b = lotTint(lot); ok(JSON.stringify(a) === JSON.stringify(b), 'tint deterministic');
  for (const v of [...a.wall, ...a.roof]) ok(v > 0.3 && v < 2.5 && Number.isFinite(v), 'tint range ' + v);
  for (const v of a.wall) ok(v > 0.8 && v < 1.15, 'wall tint stays near 1: ' + v);
  const k = a.roof.map((v) => Math.round(v * 5) / 5).join(','); fam[k] = (fam[k] || 0) + 1; n++;
  if (lot.kind === 'noble') ok(a.roof[0] < 1.6 && a.roof[2] > 0.7, 'noble roofs: blue / deep blue / slate only: ' + a.roof);
}
const blue = Object.entries(fam).filter(([k]) => { const [r, , b] = k.split(',').map(Number); return b >= r; }).reduce((q, [, c]) => q + c, 0);
ok(blue / n > 0.45 && blue / n < 0.8, 'blue-ish roofs are the majority of the town: ' + (blue / n).toFixed(2));
ok(Object.keys(fam).length >= 6, 'at least 6 distinct roof tints: ' + Object.keys(fam).length);
// ---- H4: the noble lanterns are LANTERN_S, the flags FLAG_S, no other piece is scaled
ok(LANTERN_S === 0.4 && FLAG_S === 0.6, 'LANTERN_S 0.4');
{ const p = homeTr2('noble', 30, 3).pieces; const lant = p.filter((q) => /lantern$/.test(q.n)); ok(lant.length === 2 && lant.every((q) => q.s === 0.4), 'noble lanterns s=0.4: ' + JSON.stringify(lant.map((q) => q.s))); ok(p[0].s === 1, 'body s=1'); }
// ---- H2/H3: footprints inside the lot
for (const kind of Object.keys(HOME_TR2)) for (const v of HOME_TR2[kind].v) { const [w, d] = footOf(v[0], 1); ok(w === v[1] && d === v[3], 'footOf ' + v[0]); }
// H3: the footing follows the ground floor: every model has an entry, never wider than the bbox (+0.3), never < 55 % of it, offset < 0.6 m
for (const kind of Object.keys(HOME_TR2)) for (const v of HOME_TR2[kind].v) { const [gw, gd, ox, oz] = groundOf(v[0], 1); ok(GROUND_FOOT[v[0]] && gw <= v[1] + 0.3 && gd <= v[3] + 0.3 && gw >= v[1] * 0.55 && gd >= v[3] * 0.55 && Math.abs(ox) < 0.6 && Math.abs(oz) < 0.6, 'groundOf ' + v[0]); }
for (const g of Object.values(GENERIC)) { const [gw, gd, ox, oz] = groundOf(g[0], 1); ok(GROUND_FOOT[g[0]] && gw <= g[1] + 0.3 && gd <= g[3] + 0.3 && gw >= g[1] * 0.55 && gd >= g[3] * 0.55 && Math.abs(ox) < 0.6 && Math.abs(oz) < 0.6, 'groundOf ' + g[0]); }
for (const g of Object.values(GENERIC)) { const [w, d] = footOf(g[0], 0.8); ok(Math.abs(w - g[1] * 0.8) < 0.01 && Math.abs(d - g[3] * 0.8) < 0.01, 'footOf generic ' + g[0]); }
// ---- step 3: the 15 bridges (13 river / stream + 2 gate), a mock box() collects the geometry
const all = bridgesFromLayout(L); ok(all.length >= 13, 'bridges: ' + all.length);
let tot = 0, maxTop = 0;
for (const [i, b] of all.entries()) {
  const boxes = []; const box = (mat, x, y, z, ry, sx, sy, sz, o = {}) => { boxes.push({ mat: mat && mat.n, x, y, z, ry, sx, sy, sz, o }); };
  const M = { stone: { n: 'stone' }, stoneDark: { n: 'dark' }, wood: { n: 'wood' } };
  bridgeTr2(box, M, L.height, { x: b.x, z: b.z, nx: b.nx, nz: b.nz, len: b.len, wid: b.wid });
  ok(boxes.length > 10 && boxes.length < 140, `bridge ${i}: ${boxes.length} boxes`);
  for (const q of boxes) { for (const k of ['x', 'y', 'z', 'ry', 'sx', 'sy', 'sz']) ok(Number.isFinite(q[k]), `bridge ${i} NaN ${k}`); ok(q.sx > 0 && q.sy > 0 && q.sz > 0, `bridge ${i}: empty box`); ok(['stone', 'dark', 'wood'].includes(q.mat), 'bridge material'); maxTop = Math.max(maxTop, q.y + q.sy / 2); }
  tot += boxes.length * 12;
  // the walking surface (the widest box whose top is at the deck height) must cover the middle of the bridge
  ok(boxes.some((q) => Math.abs(q.y + q.sy / 2 - BRIDGE_DECK) < 0.01 && q.sx >= b.len - 0.01), `bridge ${i}: a deck surface at ${BRIDGE_DECK}`);
}
console.log('bridges: total', tot, 'triangles for', all.length, 'bridges (old: ~190 each = ' + all.length * 190 + ')');
ok(tot - all.length * 190 < 12000, 'bridge triangles +' + (tot - all.length * 190) + ' within ~10k');
ok(maxTop < 3.0, 'bridge posts below 3 m: ' + maxTop);
// ---- step 4: edge strip with the layout height (counts, radii)
{
  globalThis.window = globalThis.window || {};                                         // (sc_rocks -> tr2_s4c -> assets.js reads window at load)
  const { edgeTrees, edgeRocks, EDGE } = await import('/home/claude/bot/bluebot_v2/bluewall/client/src/edge_strip.js');
  const trees = { near: [], far: [] }; const nt = edgeTrees(trees, L.height, 'low');
  ok(nt > 120 && nt <= 380, 'edge trees ' + nt);
  for (const t of trees.far) { const e = t.m.elements, r = Math.hypot(e[12], e[14]); ok(r >= 427.9 && r <= 462.1, 'tree radius ' + r.toFixed(1)); }
  const adds = []; const kit = { add: (k, m) => adds.push([k, m]), bases: [] };
  const nr = edgeRocks(kit, L.height, 'low'); ok(nr > 150, 'edge rocks ' + nr); ok(adds.length >= nr, 'kit adds ' + adds.length);
  for (const [, m] of adds) { const e = m.elements, r = Math.hypot(e[12], e[14]); ok(r > 380 && r < 440, 'rock radius ' + r.toFixed(1)); }
  console.log('edge: trees', nt, 'rocks', nr, '(+ satellites ' + (adds.length - nr) + ')');
}
// ---- step 1: the town LOD meshes are marked for rpg/cull.js (hero mode) so its `#cell` proxies cannot outlive the LOD's visible flags (frames: TR2_H step 1)
{
  const fs = await import('fs'); const tb = fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/client/src/town_build.js', 'utf8'), cull = fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/cull.js', 'utf8');
  ok(/groundOf as groundFoot/.test(tb) && /groundFoot\(v\.variant, p\.s\)/.test(tb) && !/= groundOf\(v\.variant/.test(tb), 'town_build: the footing size comes from groundFoot (b2_homes groundOf) — a local `groundOf` Map in that file shadowed the import once: "x is not a function" in the tick (frames step 2c)');
  ok((tb.match(/if \(CULL_MARK\) m\.userData\.rpProxy = 1/g) || []).length === 2, 'town_build: far + cell meshes carry the rpProxy mark (CULL_MARK)');
  ok(/o\.userData\.rpProxy \|\| !o\.geometry \|\| !sceneTown\(o\)/.test(cull), 'cull.js townCollect still skips rpProxy meshes (if this fails: the mark no longer protects the town LOD — see report TR2_S4a_R3 step 1)');
}
console.log(bad ? 'TR2 H FAIL ' + bad : 'TR2 H OK'); process.exit(bad ? 1 : 0);
