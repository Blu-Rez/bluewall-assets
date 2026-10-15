// cams_r2.mjs LV  -> JSON list of camera jobs for frames_r2.py (street level = eye 1.7 m above the terrain, in front of a lot; chapel / tavern / town hall close-ups)
import { homeLots, civicLots, toWorld } from '../../bot/bluebot_v2/bluewall/client/src/town_plan.js';
import { homeTr2, HOUSE_SMOKE } from '../../bot/bluebot_v2/bluewall/client/src/b2_homes.js';
const lv = +process.argv[2] || 20, homes = homeLots(lv), civ = civicLots(lv), out = [];
const front = (lot, dx, dz) => { const w = toWorld(lot, { n: '', x: dx, z: lot.d / 2 + dz, ry: 0, s: 1 }); return [+w.x.toFixed(2), +w.z.toFixed(2)]; };
const job = (name, lot, o = {}) => ({ name, lv, cam: front(lot, o.dx ?? -2.5, o.dz ?? 10), look: [lot.x, lot.z], eye: o.eye ?? 1.7, dy: o.dy ?? 3, fov: o.fov ?? 62, ...(o.extra || {}) });
const info = (l) => ({ id: l.id, kind: l.kind, variant: homeTr2(l.kind, lv, l.seed).variant, x: +l.x.toFixed(0), z: +l.z.toFixed(0) });
const farCiv = (l) => civ.every((c) => Math.hypot(c.x - l.x, c.z - l.z) > 38);          // (a camera 10 m in front of a house must not end up inside the dressing of a civic lot)
const pickOf = (pred) => homes.filter((l) => farCiv(l) && pred(info(l))).sort((a, b) => Math.hypot(a.x - 40, a.z - 100) - Math.hypot(b.x - 40, b.z - 100));
const cot = pickOf((i) => i.kind === 'cottage')[0], chim = pickOf((i) => HOUSE_SMOKE[i.variant] && i.kind !== 'generic')[0], nob = pickOf((i) => i.kind === 'noble')[0], any = pickOf(() => true);
const seen = new Set(); const add = (n, l, o) => { if (l && !seen.has(n)) { seen.add(n); out.push(job(n, l, o)); } };
add(`street_cottage_lv${lv}`, cot); add(`street_chimney_lv${lv}`, chim, { dx: 3, dz: 11 }); add(`street_noble_lv${lv}`, nob, { dz: 14, dy: 4 }); if (!cot) add(`street_any_lv${lv}`, any[0]);
const civic = []; const seenK = new Set();
for (const c of civ) if (['chapel', 'tavern', 'townhall', 'market'].includes(c.kind) && !seenK.has(c.kind) && !(c.kind === 'tavern' && c.x < -10)) { seenK.add(c.kind); civic.push({ name: `civic_${c.kind}_lv${lv}`, x: +c.x.toFixed(1), z: +c.z.toFixed(1), dist: c.kind === 'market' ? 46 : 30, polar: 1.18, azim: +(c.ry + 0.45).toFixed(2) }); }
console.log(JSON.stringify({ civic, lots: { cot: cot && info(cot), chim: chim && info(chim), nob: nob && info(nob) }, jobs: out }));
