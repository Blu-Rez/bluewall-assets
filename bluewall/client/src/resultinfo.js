// Result card extras (p33 S10): where the damage your army took came from (by source) and ONE rule-based hint.
// Pure functions (no DOM, no three.js); fed by sim.stats.took (source -> unit type -> damage) and the numbers of the finished battle.
import DEFS from './unitdefs.json';

const U = DEFS.units;
// the sim's source keys -> the words the player sees
export const SOURCE_NAME = {
  tower: 'Arrow towers', ballista: 'Ballistas', cannon: 'Cannons', wizard: 'Wizards', quad: 'Quad guns', frost: 'Frost spires', flame: 'Flame towers', dragonbane: 'Dragonbanes', keep: 'The keep', tesla: 'Tesla coils',
  guard: 'Guards', garch: 'Archers', g_giant: 'Guardian giants', g_hill: 'Guardian giants', g_baby: 'Guardian dragons', g_dragon: 'Guardian dragons', g_dragonling: 'Guardian dragons',
};
const HEAVY = (t) => { const d = U[t]; return !!d && (d.size === 'heavy' || d.size === 'huge') && !d.air; };
const LIGHT = (t) => { const d = U[t]; return !!d && d.size === 'light' && !d.air; };
const AIR = (t) => { const d = U[t]; return !!d && !!d.air; };
const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);

// -> [{ k: 'Ballistas', v: damage, p: share 0..1 }] biggest first (at most `top`; the rest is folded into 'Others')
export function damageBySource(took, top = 5) {
  const by = {}; let total = 0;
  for (const src of Object.keys(took || {})) { const v = sum(took[src]); if (v <= 0) continue; const k = SOURCE_NAME[src] || 'Others'; by[k] = (by[k] || 0) + v; total += v; }
  const rows = Object.entries(by).map(([k, v]) => ({ k, v, p: total ? v / total : 0 })).sort((a, b) => b.v - a.v || (a.k < b.k ? -1 : 1));
  if (rows.length <= top) return rows;
  const head = rows.slice(0, top - 1), rest = rows.slice(top - 1).reduce((a, r) => a + r.v, 0);
  return head.concat([{ k: 'Others', v: rest, p: total ? rest / total : 0 }]);
}

// the ONE hint.  `took`: stats.took; `sent` / `lost`: unit type -> count; `r`: { stars, destruction, time }
export function hintFor({ took, sent, lost, r }) {
  const bySrc = {}; for (const s of Object.keys(took || {})) bySrc[s] = sum(took[s]);
  const total = sum(bySrc) || 1, top = Object.entries(bySrc).sort((a, b) => b[1] - a[1])[0] || ['', 0];
  const share = (...keys) => keys.reduce((a, k) => a + (bySrc[k] || 0), 0) / total;
  const cnt = (o, f) => Object.entries(o || {}).reduce((a, [t, n]) => a + (f(t) ? n : 0), 0);
  const sentAir = cnt(sent, AIR), lostAir = cnt(lost, AIR), sentLight = cnt(sent, LIGHT), lostLight = cnt(lost, LIGHT);
  let tookHeavy = 0; for (const s of Object.keys(took || {})) for (const t of Object.keys(took[s])) if (HEAVY(t)) tookHeavy += took[s][t];
  const left = r.destruction < 100 && r.time >= 179;
  if (left) return 'Time ran out with buildings left. Send fast riders or flyers to the far corners early.';
  if (sentAir >= 3 && lostAir / sentAir >= 0.4) return 'Anti-air guns (ballistas, wizards) shot your flyers down. Keep them back until those guns are down.';
  if (share('g_giant', 'g_hill', 'g_baby', 'g_dragon', 'g_dragonling') >= 0.35) return 'The guardians took your army apart. Bring your own giants and dragons to fight them.';
  if (top[0] === 'ballista' && tookHeavy / total >= 0.4) return 'Ballistas hit your heavy units hardest. Break them first, or send riders at them.';
  if (share('cannon', 'wizard', 'quad') >= 0.4 && sentLight >= 10 && lostLight / sentLight >= 0.4) return 'Cannon and wizard blasts caught your soldiers bunched up. Send them in smaller groups.';
  if (top[0] === 'tower' && share('tower') >= 0.4) return 'Arrow towers wore you down. Freeze them, or break them before the army walks in.';
  const sentSiege = cnt(sent, (t) => U[t] && U[t].role === 'siege'), lostSiege = cnt(lost, (t) => U[t] && U[t].role === 'siege');
  if (r.stars >= 3 && sentSiege >= 3 && lostSiege === 0) return 'Your siege out-ranged the defences. Keep it behind your soldiers and it stays safe.';
  if (r.stars >= 3) return 'Clean raid. Next time try to lose fewer soldiers.';
  return 'Spread your squads over two gates. One big group is easy prey for the defence.';
}

// everything the card needs, or null when there is nothing to show
export function resultExtras({ stats, sent, lost, r }) {
  const took = stats && stats.took; if (!took) return null;
  const by = damageBySource(took); if (!by.length) return null;
  return { by, hint: hintFor({ took, sent, lost, r }) };
}
