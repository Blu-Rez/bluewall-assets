import { homeTr2, homeTier, HOME_KINDS } from '../bot/bluebot_v2/bluewall/client/src/b2_homes.js';
import { LEGACY_TIER_AT } from '../bot/bluebot_v2/bluewall/client/src/tiers.js';
const out = { TIER_AT: LEGACY_TIER_AT, rows: [] };
for (const kind of Object.keys(HOME_KINDS)) for (const lv of [1, 6, 12, 13, 20, 24, 30, 36, 50]) { const h = homeTr2(kind, lv, 7); out.rows.push({ kind, lv, tier: homeTier(lv), body: h.variant, dress: h.pieces.slice(1).map((p) => p.n.replace('props_street/', '')), smoke: h.smoke.length }); }
console.log(JSON.stringify(out));
