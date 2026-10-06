// The defence field (p38, owner 6 Oct 2026 «تله‌ها — ده مدل تله! ساختمان‌های دفاعی واقعی»): ten kinds of traps and the real defensive buildings (watchtowers, ballista outposts, spike barricades, braziers,
// fire stones) in front of the town gates.  PURE DATA — deterministic, no three.js: defItems(level) -> [{ n, x, z, ry, s, kind, role }] in world metres; defSolids() -> [[x, z, r]] for the nav.
// Positions are planned once at the highest level and the level only takes the first `count` of each kind, so a trap never jumps when the castle grows.
// Where each kind opens (`unlock`) and how many stand per level are placeholders here; the real rule belongs to the server (p39).
import * as L from './layout.js';
import { roadDist } from './roads.js';
import { rng } from './noise.js';

export const DEF_KINDS = {
  // ---- the ten traps (+ the grenade): small things on the ground in front of the gates
  bear:       { n: 'df_bear',      role: 'trap',    unlock: 2,  max: 6, fa: 'تلهٔ خرس',          rad: 3.4 },
  bear2:      { n: 'df_bear2',     role: 'trap',    unlock: 4,  max: 6, fa: 'تلهٔ حلقه‌ای',      rad: 3.6 },
  spikeball:  { n: 'df_spikeball', role: 'trap',    unlock: 6,  max: 5, fa: 'گوی خاردار',        rad: 3.0 },
  grate:      { n: 'df_grate',     role: 'trap',    unlock: 8,  max: 5, fa: 'تلهٔ میخ‌دار',      rad: 4.0 },
  pit:        { n: 'df_pit',       role: 'trap',    unlock: 10, max: 4, fa: 'چالهٔ تیز',         rad: 4.6 },
  saw:        { n: 'df_saw',       role: 'trap',    unlock: 12, max: 4, fa: 'تیغهٔ اره‌ای',      rad: 3.8 },
  mine:       { n: 'df_mine',      role: 'trap',    unlock: 14, max: 6, fa: 'مین',               rad: 2.8 },
  keg:        { n: 'df_keg',       role: 'trap',    unlock: 16, max: 4, fa: 'بشکهٔ باروت',       rad: 3.2 },
  crossbow:   { n: 'df_crossbow',  role: 'trap',    unlock: 18, max: 3, fa: 'کمان خودکار',       rad: 4.4, face: true },
  tesla:      { n: 'df_tesla',     role: 'trap',    unlock: 22, max: 2, fa: 'سیم‌پیچ برقی',      rad: 4.6 },
  grenade:    { n: 'df_grenade',   role: 'trap',    unlock: 20, max: 5, fa: 'نارنجک خاردار',     rad: 2.2 },
  // ---- the defensive buildings
  hedgehog:   { n: 'df_hedgehog',  role: 'defense', unlock: 3,  max: 8, fa: 'مانع خاردار',       rad: 4.0, zone: 'shoulder' },
  watchtower: { n: 'df_watchtower',role: 'defense', unlock: 4,  max: 5, fa: 'برج دیدبانی',       rad: 5.0, zone: 'post',     solid: 2.8 },
  firestone:  { n: 'df_firestone', role: 'defense', unlock: 7,  max: 8, fa: 'سنگ آتش',           rad: 3.0, zone: 'shoulder', solid: 0.9 },
  brazier:    { n: 'df_brazierpair', role: 'defense', unlock: 9, max: 1, fa: 'مشعل‌دان دروازه',   rad: 4.0, zone: 'gate',     solid: 1.2 },
  ballista:   { n: 'df_ballista',  role: 'defense', unlock: 12, max: 4, fa: 'برج منجنیق',        rad: 7.5, zone: 'post',     solid: 5.2 },
};
// the buildings and the road-side things claim their places first, the traps fill the open field after them
const ZONE_RANK = { gate: 0, post: 1, shoulder: 2 };
export const DEF_ORDER = Object.keys(DEF_KINDS).sort((a, b) => (ZONE_RANK[DEF_KINDS[a].zone] ?? 3) - (ZONE_RANK[DEF_KINDS[b].zone] ?? 3));

const countAt = (lv, k) => (lv < k.unlock ? 0 : Math.max(1, Math.min(k.max, 1 + Math.floor((k.max - 1) * (lv - k.unlock) / Math.max(1, 30 - k.unlock) + 1e-9))));
let PLAN = null, PLAN_KEY = '';
const dist = (a, b, c, d) => Math.hypot(a - c, b - d);
const SCALE = (k) => (k.role === 'trap' ? 1.4 : 1);                                  // traps are drawn 40 % bigger than their model size so they read from the walls' distance

function free(x, z, kind, placed, roadMin, roadMax) {
  const h = L.height(x, z); if (!(h > L.MOAT.level + 1.1)) return false;                    // dry land only (not the moat, the river, the lake)
  const e = 2.2; if (Math.max(Math.abs(L.height(x + e, z) - h), Math.abs(L.height(x - e, z) - h), Math.abs(L.height(x, z + e) - h), Math.abs(L.height(x, z - e) - h)) > 1.0) return false;       // not on a slope
  const rd = roadDist(x, z); if (rd < roadMin || rd > roadMax) return false;
  if (L.sdTown(x, z) < 16) return false;                                                    // outside the town wall + moat
  if (L.MUSTER && dist(x, z, L.MUSTER.x, L.MUSTER.z) < L.MUSTER.fr + 8) return false;      // the muster plain is the attacker's
  if (L.CAMP && dist(x, z, L.CAMP.x, L.CAMP.z) < L.CAMP.fr + 8) return false;
  for (const P of L.PADS) if (dist(x, z, P.x, P.z) < P.r + 6) return false;                 // the worksites
  if (L.fieldD(x, z) < 1.2) return false;                                                 // the farm fields (fieldD is normalised: < 1 inside)
  for (const q of placed) if (dist(x, z, q.x, q.z) < kind.rad * 1.1 + q.rad) return false;
  return true;
}

export function planDefs() {
  const key = L.MAP + ':' + (L.TGATES || []).map((g) => g.x.toFixed(0) + ',' + g.z.toFixed(0)).join(';') + ':' + L.PADS.length;
  if (PLAN && PLAN_KEY === key) return PLAN;
  const out = []; const gates = L.TGATES || [];
  gates.forEach((G, gi) => {
    const R = rng((gi * 7919 + 20261006) >>> 0), nx = G.nx, nz = G.nz, tx = -nz, tz = nx, placed = [], share = gi === 0 ? 1 : 0.5;     // the gate the army comes to is the strongest
    const at = (d, l) => [G.x + nx * d + tx * l, G.z + nz * d + tz * l];
    for (const id of DEF_ORDER) {
      const k = DEF_KINDS[id], want = Math.max(1, Math.ceil(k.max * share)); let got = 0;
      for (let t = 0; t < 900 && got < want; t++) {
        let d, l, rmin = 2.6, rmax = 1e9;
        if (k.zone === 'gate') { d = 20 + R() * 22; l = 0; rmin = -99; }
        else if (k.zone === 'shoulder') { d = 14 + R() * 62; l = (R() < 0.5 ? -1 : 1) * (4.5 + R() * 5); rmin = 1.2; rmax = 5.5; }
        else if (k.zone === 'post') { d = 40 + R() * 60; l = (R() < 0.5 ? -1 : 1) * (28 + R() * 42); rmin = 6; }
        else { d = 16 + R() * 52; l = (R() * 2 - 1) * 44; rmin = 3.4; }
        const [x, z] = at(d, l);
        if (!free(x, z, k, placed, rmin, rmax)) continue;
        const toward = Math.atan2(nx, nz);                                              // outward = the way the army comes
        const ry = k.zone === 'gate' ? Math.atan2(-tz, tx) : k.face || k.zone === 'post' ? toward + (R() - 0.5) * 0.5 : R() * 6.283;
        placed.push({ x, z, rad: k.rad * 1.1 }); out.push({ id, n: k.n, x, z, ry, s: SCALE(k), role: k.role, gate: gi, i: got }); got++;
      }
    }
  });
  PLAN = out; PLAN_KEY = key; return out;
}

// what stands at a castle level: the first `count` of every kind (the order of planning is the order of growth)
export function defItems(level) {
  const lv = Math.max(0, Math.min(30, Math.round(level))), per = {}, out = [];
  for (const it of planDefs()) {
    const k = DEF_KINDS[it.id], c = countAt(lv, k), n = (per[it.id + it.gate] = (per[it.id + it.gate] || 0) + 1);
    if (n <= (it.gate === 0 ? c : Math.max(c ? 1 : 0, Math.ceil(c * 0.5)))) out.push(it);
  }
  return out;
}
export const defCounts = (level) => { const o = {}; for (const it of defItems(level)) o[it.id] = (o[it.id] || 0) + 1; return o; };
export function defSolids(level = 30) {
  const out = [];
  for (const it of defItems(level)) { const k = DEF_KINDS[it.id]; if (k.solid) out.push([it.x, it.z, k.solid]); }
  return out;
}
