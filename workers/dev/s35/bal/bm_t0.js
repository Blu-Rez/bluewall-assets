// Counter-Matrix harness (p32 S1): archetype armies x base profiles x levels, headless on the REAL map (basetargets.json, nav on).
//   bash dev/bsm.sh [--sim path/to/battlesim.js] [--levels 20,10] [--armies inf,arch,air,siege,cav,mixed] [--profiles default] [--seeds 3] [--style all|smart|plan]
//                   [--lv same|unknown] [--forge 20] [--out file.json] [--slice i/n]
// Same fixed base for every army of a level (power = 225 x level, 4500 at level 20), only the army differs.  Army size = SPACE x (level/20)^k so the half-size check is built in.
// Output per run: stars, destruction, lost % (by space), time, time until 50 % / 100 % of the weapon sites are dead, damage by source (when the sim reports it), headcounts.
import * as SIMMOD from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildNav, bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
import fs from 'fs';
import REF from '/home/claude/dev/ref_armies.json';
const { createBattle, TUNE, PROFILES } = SIMMOD;
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const tun = arg('tune', ''); if (tun) for (const kv of tun.split(',')) { const [k, v] = kv.split('='); TUNE[k] = +v; }
const pj = arg('prof', ''); if (pj) { const o = JSON.parse(pj); for (const k in o) PROFILES[k] = { ...(PROFILES[k] || {}), ...o[k] }; }
const NAV = buildNav({ height: L.height, bridges: bridgesFromLayout(L) });
const U = DEFS.units;
const keepT = BT.targets.find((t) => t.type === 'keep');

// archetypes at space ~200 (level 20 sized)
export const ARCH = {
  inf: { spear: 120, sword: 80 },
  arch: { archer: 105, mage: 30, spear: 5 },
  air: { dragon: 4, baby: 8, pegasus: 10 },
  siege: { catapult: 14, cannon: 6, trebuchet: 4, guard: 20 },                     // (p33: the pure artillery army; the old siege archetype with the giants in it is now `big`)
  big: { giant: 8, hill: 3, ram: 6, guard: 8 },
  cav: { cavalry: 30, werewolf: 8, imp: 23 },
  mixed: { spear: 30, sword: 10, archer: 35, guard: 6, cavalry: 6, giant: 3, catapult: 4, baby: 2, pegasus: 3, mage: 4 },
};
const space = (a) => Object.entries(a).reduce((s, [t, n]) => s + n * U[t].space, 0);
const power = (army, forge) => Object.entries(army).reduce((s, [t, n]) => s + n * Math.sqrt(U[t].hp * U[t].dps) / 3 * (1 + 0.06 * (forge - 1)), 0);
const scaled = (a, k) => { const o = {}; for (const [t, n] of Object.entries(a)) { const m = Math.max(0, Math.round(n * k)); if (m) o[t] = m; } return o; };

function play(job) {
  const { army, level, seed, style, profile, forge, lvMode } = job;
  const D = job.D || Math.round(225 * level);
  const spec = { seed, ratio: 1.0, power: D, levels: { keep: level, wall: level, towers: level }, loot: { ruby: 1000, emerald: 1000, turq: 1000 }, profile };
  const lv = job.lv || (lvMode === 'same' ? { barracks: level, training: level, stable: level, lair: level, workshop: level } : {});
  const plan = style === 'plan';
  const sim = createBattle({ spec, army, forge, lv, spells: plan ? job.spells || { lightning: 3, heal: 2, freeze: 2, rage: 1 } : {}, targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta, nav: NAV });
  const g = sim.base.deploy, gx = BT.meta.gates[0].x, gz = BT.meta.gates[0].z;
  const prio = { giant: 0, tank: 1, infantry: 2, cavalry: 3, siege: 4, ranged: 5, air: 6 };
  const seq = DEFS.order.filter((u) => army[u] > 0).sort((a, b) => prio[U[a].role] - prio[U[b].role]);
  const sendTo = (ty) => { const role = U[ty].role; if (role === 'air') sim.send(ty, keepT.x, keepT.z); else if (role === 'ranged' || role === 'siege') sim.send(ty, gx - g.nx * 14, gz - g.nz * 14); else sim.send(ty, gx, gz); };

  // ---- the smart plan (p33 criterion h): what a player who has SEEN the base does: tanks / giants / rams open the gate, the infantry follows after a few seconds, archers and siege stand back, riders go
  // for the building the fewest guns cover, flyers wait until the anti-air guns are thinned out, spells where they pay (rage on the push, freeze on the guns the army walks into, heal on the main body, lightning on guns).
  const defsAll = sim.buildings.filter((b) => b.def && b.rng && b.dmg), isAA = (b) => b.dk === 'ballista' || b.dk === 'wizard' || b.dk === 'tesla';
  const coverOf = (b) => defsAll.reduce((n, g) => n + (Math.hypot(g.x - b.x, g.z - b.z) < g.rng ? 1 : 0), 0);
  const softs = sim.buildings.filter((b) => !b.ring && !b.def && b.value > 0 && b.type !== 'house').map((b) => ({ b, c: coverOf(b) })).sort((a, c) => a.c - c.c || Math.hypot(a.b.x - g.x, a.b.z - g.z) - Math.hypot(c.b.x - g.x, c.b.z - g.z));
  const P = { raid: 0, air: false, rage: false, frz: 0, lit: 0, heal: 0 };
  const planSend = (tt) => {
    const role = (ty) => U[ty].role;
    if (tt < 0.05) {
      for (const ty of seq) if (role(ty) === 'giant' || role(ty) === 'tank') sim.send(ty, gx, gz);
      for (const ty of seq) if (role(ty) === 'ranged' || role(ty) === 'siege') sim.send(ty, gx + g.nx * 34, gz + g.nz * 34);
    }
    if (tt >= 6 && !P.inf) { P.inf = 1; for (const ty of seq) if (role(ty) === 'infantry') sim.send(ty, gx, gz); }
    if (tt >= 3 && !P.cav) { P.cav = 1; }
    if (P.cav) { while (P.raid < softs.length && softs[P.raid].b.dead) P.raid++; const tg = softs[Math.min(P.raid, softs.length - 1)]; if (tg && (tt - (P.lastRaid || -9) > 4)) { P.lastRaid = tt; for (const ty of seq) if (role(ty) === 'cavalry') sim.send(ty, tg.b.x, tg.b.z); } }
    if (!P.air) { const aa = defsAll.filter(isAA), aaAlive = aa.filter((b) => !b.dead).length; if (tt >= 40 || (aa.length && aaAlive <= aa.length * 0.5) || !aa.length) { P.air = true; for (const ty of seq) if (role(ty) === 'air') sim.send(ty, keepT.x, keepT.z); } }
    if (tt > 45 && !P.all) { P.all = 1; for (const ty of seq) if (role(ty) !== 'siege' && role(ty) !== 'ranged') sim.send(ty, keepT.x, keepT.z); }
    // spells
    const live = sim.units.filter((u) => !u.dead && u.active && !u.air);
    if (live.length > 6) {
      const cx = live.reduce((a, u) => a + u.x, 0) / live.length, cz = live.reduce((a, u) => a + u.z, 0) / live.length;
      if (!P.rage && Math.hypot(cx - gx, cz - gz) < 40) { P.rage = true; sim.cast('rage', cx, cz); }
      const hpf = live.reduce((a, u) => a + u.hp / u.maxHp, 0) / live.length;
      if (hpf < 0.7 && tt - P.heal > 9 && sim.spells.heal > 0) { P.heal = tt; sim.cast('heal', cx, cz); }
      if (tt - P.frz > 22 && sim.spells.freeze > 0 && tt > 12) { const gs = defsAll.filter((b) => !b.dead && Math.hypot(b.x - cx, b.z - cz) < b.rng); if (gs.length > 2) { const m = gs.reduce((a, b) => [a[0] + b.x, a[1] + b.z], [0, 0]); P.frz = tt; sim.cast('freeze', m[0] / gs.length, m[1] / gs.length); } }
      if (tt - P.lit > 8 && sim.spells.lightning > 0 && tt > 15) { const gs = defsAll.filter((b) => !b.dead).sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz)); if (gs[0]) { P.lit = tt; sim.cast('lightning', gs[0].x, gs[0].z); } }
    }
  };
  const weapons = sim.buildings.filter((b) => b.rng && b.dmg);
  let t = 0, k = 0, nextSend = 0, s2 = 0, t50 = -1, t100 = -1, tw50 = -1, tw100 = -1, tFirst = -1; const dt = 0.1;
  let maxStep = 0, sumStep = 0, nStep = 0;
  while (!sim.over && t < 185) {
    if (plan) planSend(t); else if (style === 'all') { if (k === 0) { for (const ty of seq) sendTo(ty); k = 99; } } else if (t >= nextSend && k < seq.length) { sendTo(seq[k++]); nextSend = t + 2.5; }
    if (style === 'smart' && !s2 && t > 45) { s2 = 1; for (const ty of seq) sim.send(ty, keepT.x, keepT.z); }
    const w0 = process.hrtime.bigint();
    sim.step(dt); t += dt;
    const ms = Number(process.hrtime.bigint() - w0) / 1e6; maxStep = Math.max(maxStep, ms); sumStep += ms; nStep++;
    const dead = weapons.filter((b) => b.dead).length;
    if (process.env.TRACE && Math.abs(t / 10 - Math.round(t / 10)) < dt / 20) {
      const al = {}; sim.units.forEach((u) => { if (!u.dead) al[u.type] = (al[u.type] || 0) + 1; });
      const wk = {}; weapons.forEach((b) => { if (!b.dead) wk[b.dk] = (wk[b.dk] || 0) + 1; });
      console.log('  t' + t.toFixed(0).padStart(4), 'des', sim.destruction().toFixed(0).padStart(3) + '%', 'keep', sim.keepDown ? 'x' : '-', 'A', JSON.stringify(al), 'W', JSON.stringify(wk), 'defs', sim.defenders.filter((d) => !d.dead).length);
    }
    if (tFirst < 0 && dead > 0) tFirst = t;
    if (tw50 < 0 && dead >= weapons.length * 0.5) tw50 = t;
    if (tw100 < 0 && dead >= weapons.length) tw100 = t;
    if (t50 < 0 && sim.destruction() >= 50) t50 = t;
  }
  const r = sim.result();
  const lostSp = Object.entries(r.lost).reduce((q, [ty, n]) => q + n * U[ty].space, 0), sentSp = Object.entries(r.sent).reduce((q, [ty, n]) => q + n * U[ty].space, 0);
  const lostBy = {}; for (const [ty, n] of Object.entries(r.lost)) lostBy[ty] = n;
  return { stars: r.stars, des: r.destruction, lost: sentSp ? 100 * lostSp / sentSp : 0, time: r.time, tFirst, tw50, tw100, t50, bodiesA: Object.values(r.sent).reduce((a, b) => a + b, 0), bodiesD: sim.defenders.length, weapons: weapons.length,
    lostBy, by: sim.stats ? JSON.parse(JSON.stringify(sim.stats)) : null, avgMs: sumStep / nStep, maxMs: maxStep };
}

const ratios = arg('ratios', '1.0').split(',').map(Number), refMode = arg('ref', '') === '1';
const levels = arg('levels', '20').split(',').map(Number), armies = arg('armies', Object.keys(ARCH).join(',')).split(','), profiles = arg('profiles', 'default').split(',');
const NS = +arg('seeds', 3), style = arg('style', 'all'), forge = +arg('forge', 20), lvMode = arg('lv', 'unknown'), outF = arg('out', ''), [si, sn] = arg('slice', '0/1').split('/').map(Number);
const jobs = [];
const SPL = (L) => { const o = {}; for (const [k, n] of Object.entries({ lightning: 3, heal: 2, freeze: 2, rage: 1, quake: 1 })) if (DEFS.spells[k].lv <= L) o[k] = n; return o; };
if (refMode) { for (const level of levels) for (const ratio of ratios) for (let seed = 1; seed <= NS; seed++) { const R = REF[level]; jobs.push({ army: R.army, aname: 'ref', level, ratio, seed, style, profile: arg('profile1', undefined), forge: R.forge, lvMode: 'same', lv: R.lv, D: Math.round(R.power * ratio), spells: SPL(level) }); } }
else
for (const level of levels) for (const profile of profiles) for (const a of armies) for (let seed = 1; seed <= NS; seed++) jobs.push({ army: scaled(ARCH[a], Math.pow(level / 20, +arg('sizeK', 1))), aname: a, level, seed, style, profile, forge, lvMode });
const res = [];
jobs.forEach((j, i) => { if (i % sn !== si) return; const r = play(j); res.push({ aname: j.aname, level: j.level, ratio: j.ratio, profile: j.profile, seed: j.seed, ...r }); if (!outF) console.log(j.aname, j.level, j.profile, j.seed, JSON.stringify({ ...r, by: undefined })); });
if (outF) fs.writeFileSync(outF, JSON.stringify({ args: process.argv.slice(2), res }));
