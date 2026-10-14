// TR2-S2: bit-identical-at-cap-30 proof.  Hashes what the structure modules return for every level 1..30 (and a few odd ones) — run on the kit before the change
// (GOLDEN=write SRC=<kit client/src>) and on the changed tree; dev/tr2_tiers_test.js compares with dev/tr2_golden_cap30.json.
// raw node, no bundler: needs b2_homes / b3_civic / layout / b1_townplan importable (they are: noise.js only).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const SRC = path.resolve(process.env.SRC || new URL('../bot/bluebot_v2/bluewall/client/src', import.meta.url).pathname);
const imp = (f) => import(path.join(SRC, f));
const [H, C, L, T] = await Promise.all([imp('b2_homes.js'), imp('b3_civic.js'), imp('layout.js'), imp('b1_townplan.js')]);
const sha = (o) => crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0, 16);
const out = {};
{ const a = []; for (const k of Object.keys(C.CIVIC_KINDS)) for (let lv = 0; lv <= 31; lv++) { a.push([k, lv, C.civicLevel(k, lv), C.civicTier(lv)]); if (lv >= 1 && lv <= 30) for (const s of [1, 2, 3]) a.push([C.civicPieces(k, lv, s), C.civicSolids(k, lv, s)]); } out.civic = sha(a); }
{ const a = []; for (const k of Object.keys(H.HOME_KINDS)) for (let lv = 1; lv <= 30; lv++) { a.push([k, lv, H.homeTier(lv), H.homeStage(lv)]); for (const s of [0, 1, 2, 3]) a.push([H.homePieces(k, lv, s), H.homeSmoke(k, lv, s)]); } out.homes = sha(a); }
{ const a = []; for (const lv of [0, 1, 2, 9, 10, 10.4, 10.5, 10.6, 11, 20, 21, 29, 30, 31, 40, 99, NaN, -3]) a.push([lv, L.ringsAt(lv)]); out.rings = sha(a); }
{ const a = []; for (const k of T.KIND_ORDER) for (let lv = 0; lv <= 31; lv++) a.push([k, lv, T.countAt(k, lv)]); out.counts = sha(a); }
out.civicTierAt = C.TIER_AT.join(','); out.homeTierAt = H.TIER_AT.join(',');
if (process.env.GOLDEN === 'write') { fs.writeFileSync(process.env.OUT || new URL('./tr2_golden_cap30.json', import.meta.url).pathname, JSON.stringify(out, null, 1)); }
console.log(JSON.stringify(out));
