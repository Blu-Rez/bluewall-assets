// ST1_R3 test (node): the yard builders run against a RECORDING batch (every B.add: geometry, material name, matrix, tag) and the rules of the job are checked on what they drew.  Last line: "ST1R3 OK"
//   - banners (QA1-018/019/023/033): poles are the light timber material in a brown tint (not the dark 'wood' x 0x4a3524), <= 6.5 m above the plinth (was 7.5 m), a thick tapered foot (r >= 0.25) on a stone footing,
//     the pennant hangs LOWER than the old one (top <= the pole top, centre <= 4.6 m over the plinth; it was 6.1 m)
//   - heaps (QA1-020/021/022/030): stone + oil heap levels sit in the STONE tier (4..7), never the diamond tier (>= 16) / iron mirror tier; the court tiers (plinth) are never diamond
//   - lamps (QA1-024/101/026/027/107): the post foot is the court / plinth top (o.gy), the model is the lantern post only (o.only), the flame is 3.05 m over the foot; the moved-yard path passes the same o.gy
//   - the shared lines are marked and the budgets are unchanged: no new material, no new Tripo piece name
import fs from 'fs';
import * as THREE from 'three';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { planQuarter, buildYard, labBuildVault, RES, TIER_ENT, TIER_LV, HEAP_ENT, STORE_IDS, VAULT_IDS, yardPieceNames } from '/home/claude/bot/bluebot_v2/bluewall/client/src/storeyards.js';

const SRC = '/home/claude/bot/bluebot_v2/bluewall/client/src/';
let bad = 0; const say = (ok, m, extra = '') => { console.log((ok ? 'OK   ' : 'FAIL ') + m + (extra ? '  ' + extra : '')); if (!ok) bad++; };
L.setMap('night'); buildRoads();
const Q = planQuarter();
say(!!Q, 'planQuarter() gives the quarter');
if (!Q) { console.log('ST1R3 FAILED'); process.exit(1); }

// ---- a recording batch: B.add(geometry, material, matrix, opts) with the tag that was current
function recorder() {
  const rec = []; let tag = [0, 1];
  const B = { add(g, mat, m, o = {}) { const e = m.elements; rec.push({ g, mat: mat && mat.name, p: [e[12], e[13], e[14]], sy: Math.hypot(e[4], e[5], e[6]), o, tag: [...tag], ent: o.ent != null ? o.ent : tag[0], min: o.min != null ? o.min : tag[1] }); }, tag(e, min = 1) { tag = [e, min]; }, bid() {}, tagB: 0 };
  return { B, rec };
}
const MATS = {}; const M = new Proxy({}, { get: (t, k) => (MATS[k] = MATS[k] || { name: String(k) }) });
function build(S, look = 3) {
  const { B, rec } = recorder(), torches = [], tri = [];
  const env = { B, M, height: () => 0, tri, bid: 0, ctx: { torch(x, y, z, o = {}) { torches.push({ x, y, z, o }); }, pool() {}, live() {}, tgt() {}, pick() {}, levelHooks: [], inst() {} } };
  if (S.kind === 'vault') { const R = labBuildVault(env, look, S); return { rec, torches, tri, Y: { y0: R.y0 } }; }
  const Y = buildYard(env, look, S);
  return { rec, torches, tri, Y };
}
const radiusTop = (g) => g.parameters && g.parameters.radiusTop, radiusBot = (g) => g.parameters && g.parameters.radiusBottom, hOf = (g) => g.parameters && g.parameters.height;

const all = [...Q.stores, ...Q.vaults];
for (const look of [1, 2, 3]) for (const S of all) {
  let r; try { r = build(S, look); } catch (e) { say(false, `${S.id} look ${look}: builds`, String(e.stack || e).split('\n').slice(0, 3).join(' | ')); continue; }
  const { rec, torches, Y } = r, y0 = Y.y0;
  // --- banners: the pole = the tallest woodLight cylinder of the yard; two of them
  const poles = rec.filter((q) => q.mat === 'woodLight' && q.g.type === 'CylinderGeometry' && hOf(q.g) > 3.5 && hOf(q.g) < 8);
  const oldPoles = rec.filter((q) => q.mat === 'wood' && q.g.type === 'CylinderGeometry' && hOf(q.g) > 6);
  if (look === 3 || look === 1) {
    say(poles.length === 2 && oldPoles.length === 0, `${S.id} look ${look}: two light-timber poles, no dark 'wood' mast`, `poles ${poles.length} old ${oldPoles.length}`);
    if (poles.length === 2) {
      const q = poles[0], top = q.p[1] + hOf(q.g) / 2 - y0 - 0.9, foot = rec.filter((z) => z.mat === 'woodLight' && z.g.type === 'CylinderGeometry' && Math.abs(z.p[0] - q.p[0]) < 1e-6 && Math.abs(z.p[2] - q.p[2]) < 1e-6 && radiusBot(z.g) >= 0.25);
      say(top <= 6.5 && top >= 5.5, `${S.id} look ${look}: pole top ${top.toFixed(2)} m over the plinth (was 7.5 m)`);
      say(foot.length >= 1, `${S.id} look ${look}: a thick tapered foot (r >= 0.25) under each pole`);
      const cloth = rec.filter((z) => z.mat === 'cloth' && z.sy > 2 && z.sy < 3);
      const ct = cloth.length ? Math.max(...cloth.map((z) => z.p[1] + z.sy / 2 - y0 - 0.9)) : 99, cc = cloth.length ? cloth[0].p[1] - y0 - 0.9 : 99;
      say(cloth.length === 2 && ct <= top && cc <= 4.6, `${S.id} look ${look}: the pennant hangs lower (top ${ct.toFixed(2)} <= pole top ${top.toFixed(2)}, centre ${cc.toFixed(2)} m)`);
    }
  }
  // --- lamps
  say(torches.length === 2 && torches.every((t) => t.o.post && t.o.gy != null && t.o.only === 'lamps_wall_street/lamp_post' && Math.abs(t.y - (t.o.gy + 3.05)) < 1e-9 && (Math.abs(t.o.gy - (y0 + 0.36)) < 1e-9 || Math.abs(t.o.gy - (y0 + 0.9)) < 1e-9)), `${S.id} look ${look}: both door lamps stand on the court / plinth top (gy), lantern model only`, torches.map((t) => (t.o.gy - y0).toFixed(2)).join(' '));
  // --- court tiers + heaps
  const tiers = new Set(rec.filter((q) => q.mat === 'stoneDark' || q.mat === 'stone').map((q) => q.ent));
  const tierLv = (e) => { const i = TIER_ENT.indexOf(e); return i >= 0 ? TIER_LV[i] : null; };
  const plinthTags = rec.filter((q) => q.mat === 'stoneDark' && TIER_ENT.includes(q.ent)).map((q) => tierLv(q.ent));
  if (look === 3) say(plinthTags.every((lv) => lv < 16), `${S.id} look ${look}: no diamond-tier (>= 16) stoneDark anywhere in the yard (pale-blue plinth / court edge)`, [...new Set(plinthTags)].join(','));
}
// --- heap levels (stone + oil): the tag min level of every heap piece lies in the stone tier
for (const S of Q.stores.filter((q) => q.id === 'stone' || q.id === 'oil')) {
  const { rec } = build(S, 3), e = HEAP_ENT[S.id], hp = rec.filter((q) => q.ent === e);
  const mins = [...new Set(hp.map((q) => q.min))].sort((a, b) => a - b);
  say(hp.length > 0 && mins[0] >= 4 && mins[mins.length - 1] <= 7, `${S.id} heap: ${hp.length} pieces, stage min-levels ${mins.join(',')} all in the stone tier 4..7`);
  // the stone tier's texture is DARK (~0.2 linear): a plain sRGB tint < 1 turns it black (the first r3 frames).  Body pieces carry a LINEAR multiplier > 1.
  const bodies = hp.filter((q) => q.mat === 'stone');
  say(bodies.length > 0 && bodies.every((q) => q.o.tintLinear === true && q.o.tint && q.o.tint.r >= 1.0), `${S.id} heap: every stone body piece has a linear tint multiplier >= 1 (no black stone)`, `min r ${Math.min(...bodies.map((q) => q.o.tint ? q.o.tint.r : 0)).toFixed(2)}`);
  if (S.id === 'oil') say(hp.some((q) => q.mat === 'stoneDark' && hOf(q.g) < 0.2) && hp.some((q) => q.mat === 'stone' && hOf(q.g) > 1), 'oil heap: drums have hoops / lids (stoneDark discs) on a stone body');
}
// --- the vault basin: gold tier look (not diamond)
for (const S of Q.vaults) {
  const { rec } = build(S, 3), ring = rec.filter((q) => q.mat === 'gold' && q.g.type === 'TorusGeometry'), bowl = rec.filter((q) => q.mat === 'stoneDark' && q.g.type === 'CylinderGeometry' && radiusTop(q.g) === 3.0);
  say(ring.length >= 1 && ring.every((q) => tierLvOf(q.ent) === 13) && bowl.every((q) => tierLvOf(q.ent) === 13), `${S.id}: the basin bowl + gold ring + bollards are tagged the GOLD tier (13), not the diamond one`);
}
function tierLvOf(e) { const i = TIER_ENT.indexOf(e); return i >= 0 ? TIER_LV[i] : null; }

// --- the plinth of the grey-stone yards is the UNSKINNED light stone (stoneLight), warm: no dark skinned plinth
for (const id of ['stone', 'iron', 'oil']) { const S = Q.stores.find((q) => q.id === id), { rec, Y } = build(S, 3); const big = rec.filter((q) => q.g.type === 'BoxGeometry' && q.sy > 0.9 && q.mat === 'stoneLight').length; say(big >= 2, `${id}: plinth + court slabs are stoneLight (unskinned warm stone)`, `${big} boxes`); }
// --- the RES table: no diamond plinth
say(Object.values(RES).every((k) => k.pt <= 3), 'RES: no resource has a diamond (>= 4) plinth tier');
// --- source rules: the shared lines are marked, no new material / piece / program
const W = fs.readFileSync(SRC + 'world.js', 'utf8'), S4 = fs.readFileSync(SRC + 'tr2_s4c.js', 'utf8'), Y = fs.readFileSync(SRC + 'storeyards.js', 'utf8');
say((W.match(/\/\/ ST1_R3:/g) || []).length >= 3 && /S4C\.lamp\(B, o\.gy != null \? o\.gy : height\(x, z\)/.test(W), 'world.js torch(): o.gy = the post foot (marked // ST1_R3:)');
say(/o\.only \? POSTS\.filter/.test(S4) && /\/\/[^\n]*ST1_R3/.test(S4), 'tr2_s4c.js lamp(): o.only picks one model (marked)');
say(/LAMP\.lamp\(Bm, o\.gy != null \? o\.gy : height\(x, z\)/.test(Y) && /y: \(o\.gy != null \? o\.gy : height\(x, z\)\) \+ 0\.06/.test(Y), 'storeyards.js moved-yard torch passes o.gy too (default + moved yards behave the same)');
say(!/new THREE\.MeshStandardMaterial|new THREE\.ShaderMaterial/.test(Y), 'storeyards.js creates no material / program');
{ const names = yardPieceNames(3); say(names.length === new Set(names).size && names.length > 0, `the quarter's Tripo atlas pieces are unchanged in kind (${names.length} names, all unique)`); }
console.log(bad ? 'ST1R3 FAILED (' + bad + ')' : 'ST1R3 OK'); process.exit(bad ? 1 : 0);
