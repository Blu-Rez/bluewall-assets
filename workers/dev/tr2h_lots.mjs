// tr2h_lots.mjs LV -> JSON: one lot per house kind (+ info) for the TR2_H review frames: cottage, craftsman, merchant, noble (those unlocked at LV), far from the civic lots.
import { homeLots, civicLots, toWorld } from '../bot/bluebot_v2/bluewall/client/src/town_plan.js';
import { homeTr2, HOUSE_SMOKE } from '../bot/bluebot_v2/bluewall/client/src/b2_homes.js';
const lv = +process.argv[2] || 30, homes = homeLots(lv), civ = civicLots(lv);
const far = (l) => civ.every((c) => Math.hypot(c.x - l.x, c.z - l.z) > 24);
const front = (l, dx, dz) => { const w = toWorld(l, { n: '', x: dx, z: l.d / 2 + dz, ry: 0, s: 1 }); return [+w.x.toFixed(2), +w.z.toFixed(2)]; };
const CAP = Object.fromEntries((process.env.CAPS || 'noble:8,merchant:10').split(',').filter(Boolean).map((x) => x.split(':')));   // the dev page builds fewer noble / merchant lots than homeLots(30) (8 / 10): lots above the cap are not drawn in the game
const out = []; const WANT = Object.fromEntries((process.env.WANT || '').split(',').filter(Boolean).map((x) => x.split(':')));   // WANT=cottage:house_cottage_0,... pick the nearest lot of that kind with that variant
for (const kind of ['cottage', 'craftsman', 'merchant', 'noble']) {
  const c = homes.filter((l) => l.kind === kind && far(l) && (CAP[kind] == null || +l.id.split('_')[1] < +CAP[kind])).sort((a, b) => Math.hypot(a.x - 40, a.z - 100) - Math.hypot(b.x - 40, b.z - 100));
  const l = (WANT[kind] ? c.find((q) => homeTr2(kind, lv, q.seed).variant === WANT[kind]) : 0) || c[0]; if (!l) continue;
  const v = homeTr2(kind, lv, l.seed);
  out.push({ kind, id: l.id, variant: v.variant, smoke: !!HOUSE_SMOKE[v.variant], x: +l.x.toFixed(1), z: +l.z.toFixed(1), ry: +l.ry.toFixed(3), w: l.w, d: l.d, front: front(l, 0, 9), front2: front(l, -2, 5), n: c.length });
}
console.log(JSON.stringify({ lv, homes: homes.length, civic: civ.length, lots: out }));
