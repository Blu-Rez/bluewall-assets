// b2_homes_test.mjs — the B2 acceptance test (run through dev/b2_homes_test.sh; it needs the @gltf-transform install of setup_lite in /tmp/claude-0/gt).
//   every homePieces name exists in the kit · deterministic per seed · seeds really differ · a house that levels up keeps its props · tris per house <= 1.5k · kit <= 400 KB · 1 material / 0 textures · credits file
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'fs';
const ROOT = process.env.BW || '/home/claude/bot/bluebot_v2/bluewall';
const H = await import(ROOT + '/client/src/b2_homes.js');
await MeshoptDecoder.ready;
const KIT = ROOT + '/web/assets/kit_homes.glb';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(KIT), fails = [], say = (...a) => console.log(...a);
const size = fs.statSync(KIT).size, tris = {};                                   // tris per kit piece (a piece = a top-level node: every instance inside counts)
for (const n of doc.getRoot().listScenes()[0].listChildren()) { let t = 0; n.traverse((c) => { const m = c.getMesh(); if (m) for (const p of m.listPrimitives()) { const i = p.getIndices(); t += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; } }); tris[n.getName()] = Math.round(t); }
const mats = doc.getRoot().listMaterials().length, texs = doc.getRoot().listTextures().length;
say(`kit: ${(size / 1024).toFixed(1)} KB, ${Object.keys(tris).length} pieces, ${mats} material(s), ${texs} texture(s)`);
if (size > 400 * 1024) fails.push('kit > 400 KB'); if (mats !== 1 || texs !== 0) fails.push('kit must be 1 material / 0 textures');
// API shape
for (const k of ['cottage', 'craftsman', 'merchant', 'noble']) { const K = H.HOME_KINDS[k]; if (!K || !K.fa || !(K.w > 0) || !(K.d > 0) || !(K.floors > 0)) fails.push('HOME_KINDS.' + k); if (/bot|ربات/i.test(K?.fa || '')) fails.push('forbidden word in ' + k); }
const housTris = (ps) => ps.reduce((a, p) => a + (tris[p.n] ?? 0), 0);
const stat = {}; let missing = new Set(), detBad = 0, lvBad = 0, shapeBad = 0, worst = { t: 0 };
const sigs = {};
for (const k of Object.keys(H.HOME_KINDS)) {
  stat[k] = { n: 0, sum: 0, max: 0, byLv: {} };
  for (let seed = 0; seed < 60; seed++) {
    let prev = null;
    for (let lv = 1; lv <= 30; lv++) {
      const a = H.homePieces(k, lv, seed), b = H.homePieces(k, lv, seed);
      if (JSON.stringify(a) !== JSON.stringify(b)) detBad++;
      for (const p of a) { if (!(p.n in tris)) missing.add(p.n); if (![p.x, p.z, p.ry, p.s].every(Number.isFinite) || p.s !== 1) shapeBad++; }
      const t = housTris(a); stat[k].n++; stat[k].sum += t; stat[k].max = Math.max(stat[k].max, t); (stat[k].byLv[lv] ||= []).push(t); if (t > worst.t) worst = { t, k, lv, seed };
      if (prev && H.homeStage(lv) === H.homeStage(lv - 1)) { const ids = new Set(a.map((p) => p.n + p.x.toFixed(3) + p.z.toFixed(3))); for (const p of prev) if (!ids.has(p.n + p.x.toFixed(3) + p.z.toFixed(3))) lvBad++; }   // levelling up never moves / removes a piece within a body stage
      prev = a;
      (sigs[k + lv] ||= new Set()).add(JSON.stringify(a));
      const sm = H.homeSmoke(k, lv, seed); if (!sm.length || !sm.every((s) => [s.x, s.y, s.z].every(Number.isFinite))) shapeBad++;
    }
  }
}
if (missing.size) fails.push('missing pieces: ' + [...missing].join(',')); if (detBad) fails.push('not deterministic x' + detBad); if (lvBad) fails.push('level-up moves pieces x' + lvBad); if (shapeBad) fails.push('bad piece fields x' + shapeBad);
for (const k of Object.keys(stat)) { const s = stat[k]; const v = new Set(); for (const lv of [1, 15, 30]) sigs[k + lv].forEach((x) => v.add(x)); say(`${k.padEnd(10)} tris avg ${Math.round(s.sum / s.n)}  max ${s.max}   lv1 ${Math.round(s.byLv[1].reduce((a, b) => a + b) / s.byLv[1].length)}  lv15 ${Math.round(s.byLv[15].reduce((a, b) => a + b) / s.byLv[15].length)}  lv30 ${Math.round(s.byLv[30].reduce((a, b) => a + b) / s.byLv[30].length)}   distinct looks per lv (60 seeds): ${[1, 15, 30].map((lv) => sigs[k + lv].size).join('/')}`); if (s.max > 1500) fails.push(`${k} house over 1.5k tris (${s.max})`); if ([1, 15, 30].some((lv) => sigs[k + lv].size < 20)) fails.push(k + ': seeds hardly differ'); }
say('worst house', JSON.stringify(worst));
// 120 mixed homes (55 / 25 / 14 / 6 %, levels 1..30 at random - the same mix as b2_dev.js mode=mix) must cost <= the generic town houses today: 715 tris per house, 8 batched draw calls (measured with dev/b2_base_houses.mjs)
{
  const { rng } = await import(ROOT + '/client/src/noise.js'); const R = rng(5), Wt = [['cottage', 0.55], ['craftsman', 0.8], ['merchant', 0.94], ['noble', 1]]; let T = 0, N = 120;
  for (let i = 0; i < N; i++) { const u = R(), k = Wt.find((w) => u <= w[1])[0], lv = 1 + Math.floor(R() * 30); T += housTris(H.homePieces(k, lv, 1000 + i)); }
  say(`120 mixed homes: ${T} tris (${Math.round(T / N)} per house) vs the current town houses ${715 * N} (715 per house)  ->  ${(100 * T / (715 * N)).toFixed(1)} %`); if (T > 715 * N) fails.push('120 mixed homes cost more triangles than the current houses');
}
const cr = ROOT + '/web/assets/credits_b2.json';
try { const j = JSON.parse(fs.readFileSync(cr, 'utf8')); if (!Array.isArray(j.items) || !j.items.length || !j.items.every((i) => i.group && i.name && i.by && i.license)) fails.push('credits_b2.json: items need group/name/by/license'); else say(`credits_b2.json: ${j.items.length} items`); } catch (e) { fails.push('credits_b2.json: ' + e.message); }
if (fails.length) { console.log('B2 FAIL: ' + fails.join(' | ')); process.exit(1); }
console.log('B2 OK');
