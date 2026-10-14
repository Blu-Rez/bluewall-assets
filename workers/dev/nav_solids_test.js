// p37: buildings are closed to ground units (nav.js solids), water rules unchanged
import { buildNav } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const nav = buildNav({ height: () => 5, bridges: [], solids: [[0, 0, 8]] }), plain = buildNav({ height: () => 5, bridges: [] });
ok(nav.isBlocked(0, 0) && nav.isSolid(2, 2) && !nav.isBlocked(14, 0), 'a building blocks the ground under it, not beside it');
ok(!nav.isWet(0, 0), 'a building is not water (no wake, no wading rule)');
ok(!nav.clear(-20, 0, 20, 0) && nav.clear(-20, 14, 20, 14), 'a straight walk through a building is refused, beside it is free');
const r = nav.route(-20, 0, 20, 0); ok(r && r.length >= 2 && nav.clear(-20, 0, r[0][0], r[0][1]), 'the route goes round it');
const d = nav.nearestDry(0, 0); ok(!nav.isBlocked(d[0], d[1]), 'a soldier standing inside is moved out to the nearest free ground');
ok(!plain.isBlocked(0, 0) && plain.clear(-20, 0, 20, 0), 'with no buildings nothing changes');
console.log(fails ? 'NAV FAILED' : 'NAV OK'); process.exit(fails ? 1 : 0);
