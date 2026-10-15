// st1_test.js — ST1 (the Treasury Quarter): the nine storage yards of the home map.  Last line: "ST1 OK"
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, roadDist } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { marketSpot } from '/home/claude/bot/bluebot_v2/bluewall/client/src/terrain.js';
import { planQuarter, fitsYard, YARD, STORE_IDS, RES, TIER_ENT, HEAP_ENT, LOOKS, yardPieceNames, DEFAULT_LOOK, STORAGE, VAULT_IDS, storageSpec, setStorageHave } from '/home/claude/bot/bluebot_v2/bluewall/client/src/storeyards.js';
import { planStores } from '/home/claude/bot/bluebot_v2/bluewall/client/src/stores.js';
import { planVaults } from '/home/claude/bot/bluebot_v2/bluewall/client/src/vault.js';
import { layoutFromGame } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_layout.js';
import { planTownFull } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_townplan.js';
import { ENT } from '/home/claude/bot/bluebot_v2/bluewall/client/src/skin.js';
import fs from 'fs';

L.setMap('night'); buildRoads();
let fails = 0; const say = (ok, name, extra = '') => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); return ok; };
const Q = planQuarter();
say(!!Q, 'planQuarter() gives the plan (not the old planners)');
if (!Q) { console.log('ST1 FAILED (1)'); process.exit(1); }
const all = [...Q.stores, ...Q.vaults];
say(Q.stores.length === 6 && Q.vaults.length === 3 && new Set(all.map((q) => q.id)).size === 9, 'six storehouses + three gem vaults, nine different ids', all.map((q) => q.id).join(' '));
say(STORE_IDS.every((id) => Q.stores.some((q) => q.id === id)) && ['ruby', 'emerald', 'turq'].every((id) => Q.vaults.some((q) => q.id === id)), 'wood stone iron gold oil food + ruby emerald turq all have a place');
say(all.every((q) => ['id', 'kind', 'x', 'z', 'ry', 'r'].every((k) => q[k] != null) && Number.isFinite(q.x + q.z + q.ry + q.r)) && Q.stores.every((q) => q.kind === 'store') && Q.vaults.every((q) => q.kind === 'vault'), 'every record is { id, kind, x, z, ry, r }');
say(planStores() === Q.stores && planVaults() === Q.vaults, 'stores.js and vault.js plan = the quarter (the town, B1 and the haul destination read these)');
const bad = all.filter((q) => !fitsYard(q.x, q.z, q.ry)).map((q) => q.id);
say(bad.length === 0, 'every yard fits the ground: >= 1 m clear of every road edge, out of the river (6 m), outside the wall + moat (2.5 m), inside the town wall (20 m), clear of the market and the gates', bad.join(' '));
let minD = 1e9; for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) minD = Math.min(minD, Math.hypot(all[i].x - all[j].x, all[i].z - all[j].z));
say(minD >= 19, `no two yards closer than 19 m (closest ${minD.toFixed(1)} m)`);
// the door of every yard faces a street: the point 10 m in front of the yard's middle is near a road
const doorD = all.map((q) => { const c = Math.cos(q.ry), s = Math.sin(q.ry); let m = 1e9; for (const lz of [9, 11, 13, 15, 17]) m = Math.min(m, roadDist(q.x + lz * s, q.z + lz * c)); return [q.id, m]; });
say(doorD.every(([, d]) => d < 14), 'the door side of every yard looks at a street (road within 14 m in front)', doorD.map(([id, d]) => id + ' ' + d.toFixed(1)).join(', '));
// distinct identity: colour + emblem
const cols = all.map((q) => RES[q.id].col);
say(new Set(cols).size === 9, 'nine different resource colours (banners, signs, trim)', cols.map((c) => c.toString(16)).join(' '));
say(STORE_IDS.every((id) => RES[id] && HEAP_ENT[id] != null), 'every storehouse has an identity (colour, tier looks) and its own heap skin id');
// skin ids: ST1 uses 17..28 of the 32 uLv slots; skin.js ENT stays below
const mx = Math.max(...Object.values(ENT));
say(mx < 17 && TIER_ENT.every((e) => e >= 17 && e < 32) && Object.values(HEAP_ENT).every((e) => e >= 17 && e < 32) && new Set([...TIER_ENT, ...Object.values(HEAP_ENT)]).size === 12, `skin ids 17..28 do not collide with skin.js ENT (max ${mx})`);
say([1, 2, 3].every((k) => LOOKS[k] && typeof LOOKS[k].hall === 'function') && DEFAULT_LOOK >= 1 && DEFAULT_LOOK <= 3, `three looks exist; the default is look ${DEFAULT_LOOK}`);
say(yardPieceNames(0).length > 0 && new Set(yardPieceNames(0)).size === yardPieceNames(0).length, `${yardPieceNames(0).length} Tripo pieces in the quarter's one atlas`);
// the storage_* family (the owner's Tripo models): swap.json entry + file for every one, ry -90 (the door faces +x in the file), the piece names follow the models that really loaded
const TR2D = '/home/claude/bot/bluebot_v2/bluewall/web/assets/tr2/', SW = JSON.parse(fs.readFileSync(TR2D + 'swap.json', 'utf8')).models;
const stFiles = Object.values(STORAGE);
say(stFiles.length === 8 && stFiles.every((f) => SW[f] && SW[f].ry === -90 && fs.existsSync(TR2D + f + '.glb')), 'storage_* family: swap.json entry (ry -90) + file for wood stone iron gold black ice red green', stFiles.filter((f) => !SW[f] || !fs.existsSync(TR2D + f + '.glb')).join(' '));
say(fs.statSync(TR2D + 'storage_blue.glb').size > 0 && SW.storage_blue, 'storage_blue (deep blue) shipped too, no store uses it yet');
{ const sizes = stFiles.map((f) => fs.statSync(TR2D + f + '.glb').size); say(Math.max(...sizes) < 200 * 1024, 'each storage_* GLB < 200 KB (6.5k triangles, 512 px WebP)', sizes.map((v) => Math.round(v / 1024)).join(' ')); }
setStorageHave({}); const n0 = yardPieceNames(3);
setStorageHave(Object.fromEntries(Object.keys(STORAGE).map((id) => [id, storageSpec(id)]))); const n3 = yardPieceNames(3);
say(Object.keys(STORAGE).every((id) => n3.includes(storageSpec(id))) && !n3.includes('treasury_1|w11') && !n3.includes('lumber_mill_2|w13') && n3.includes('granary_0|w11.8') && n0.includes('treasury_1|w11'), 'look 3 uses the storage_* halls where they are (and keeps granary_0 for the food store); without them the older library halls');
say(VAULT_IDS.every((id) => /\|w9\.5$/.test(storageSpec(id))) && STORE_IDS.filter((id) => STORAGE[id]).every((id) => /\|w12$/.test(storageSpec(id))), 'storage halls: 12 m deep for a storehouse, 9.5 m for a vault');
setStorageHave({});
// the plan engine still finds a place for every civic building with the nine yards where they are
const lay = layoutFromGame(); const r = planTownFull(lay), w = r.meta.warnings.filter((x) => !/no more room/.test(x));
say(w.length === 0, 'B1 plan engine: every civic / production building still has a place', w.join(' | '));
say(lay.fixed.length === 9 && lay.fixed.every((f) => f.r === YARD.r), 'B1 gets nine fixed circles (r ' + YARD.r + ')');
// the files: nothing forbidden in the texts of the quarter
const src = fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/client/src/storeyards.js', 'utf8');
say(!/\b(bot|ربات)\b/i.test(src.replace(/\/\/.*$/gm, '').replace(/bluebot/gi, '')), "no 'bot' / 'ربات' word in storeyards.js");
console.log(fails ? `ST1 FAILED (${fails})` : 'ST1 OK');
process.exit(fails ? 1 : 0);
