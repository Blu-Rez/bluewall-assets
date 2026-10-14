// p35 rule tests of the battle sim (pure JS, deterministic).  Built and run by gate.sh:  prints "RULES OK" when every line passes.
import { createBattle } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } else console.log('ok  ', m); };
const mkSim = (army, seed = 5) => createBattle({ spec: { seed, ratio: 1, power: 4000, levels: { keep: 6, wall: 6, towers: 6 }, loot: { ruby: 1000, emerald: 1000, turq: 1000 } }, army, forge: 1, targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta });
const run = (sim, secs, dt = 0.1) => { for (let t = 0; t < secs; t += dt) sim.step(dt); };
const hash = (sim) => sim.units.map((u) => u.type[0] + Math.round(u.x * 10) + ':' + Math.round(u.z * 10) + ':' + Math.round(u.hp)).join('|');

// ---- K1: a soldier takes an order once, a hero any number of times
{ const sim = mkSim({ spear: 6, archer: 4, shieldmaiden: 1 }); const g = sim.base.deploy, gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
  ok(sim.canSend('spear') && sim.canSend('shieldmaiden') && !sim.canSend('lord'), 'before any order: spears and the maiden can be sent, no lord in the army');
  const n1 = sim.send('spear', gx, gz); ok(n1 === 6, 'first send moves all 6 spears (' + n1 + ')');
  ok(!sim.canSend('spear'), 'a sent soldier squad cannot be sent again (canSend)');
  run(sim, 2); const before = sim.units.filter((u) => u.type === 'spear').map((u) => [u.go && u.go.x, u.go && u.go.z]);
  const n2 = sim.send('spear', gx + 30, gz + 30); ok(n2 === 0, 'second send is refused (0 units)');
  const after = sim.units.filter((u) => u.type === 'spear').map((u) => [u.go && u.go.x, u.go && u.go.z]);
  ok(JSON.stringify(before) === JSON.stringify(after), 'the spears keep their first destination');
  const keep = sim.buildings.find((b) => !b.dead && b.type === 'keep') || sim.buildings.find((b) => !b.dead);
  ok(sim.focus('spear', keep) === 0, 'a focus order on a sent squad is refused too');
  ok(sim.focus('archer', keep) === 4 && !sim.canSend('archer'), 'a focus order is the first (and only) order of a fresh squad');
  const h1 = sim.send('shieldmaiden', gx, gz), h2 = sim.send('shieldmaiden', gx + 20, gz); ok(h1 === 1 && h2 === 1 && sim.canSend('shieldmaiden'), 'a hero can be sent again and again');
}
{ // half-squad (S9, OFF in the game): the rest of the squad is still unsent and can go once
  const sim = mkSim({ spear: 6 }); const g = sim.base.deploy, gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
  const a = sim.send('spear', gx, gz, { half: true }), b = sim.send('spear', gx + 10, gz, { half: true }), c = sim.send('spear', gx + 10, gz);
  ok(a === 3 && b === 2 && c === 1, 'half orders hand out each soldier its single order: 3 + 2 + 1 (' + [a, b, c] + ')');
}
{ // determinism: same seed + same commands = same battle
  const go = () => { const sim = mkSim({ spear: 8, archer: 6, cavalry: 4, shieldmaiden: 1 }, 11); const g = sim.base.deploy, gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
    sim.send('spear', gx, gz); sim.send('archer', gx - g.nx * 14, gz - g.nz * 14); run(sim, 20); sim.send('spear', gx + 25, gz); sim.send('cavalry', gx, gz); sim.send('shieldmaiden', gx + 5, gz); run(sim, 40); return hash(sim); };
  ok(go() === go(), 'two runs of the same battle (incl. a refused re-send) end identical');
}
// ---- K2: three heroes of one type are ONE squad: one send moves all three, one ability press uses all three, one shared cooldown
{ const sim = mkSim({ shieldmaiden: 3, lord: 3, spear: 4 }); const g = sim.base.deploy, gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
  const n = sim.send('shieldmaiden', gx, gz); ok(n === 3, 'one send moves all 3 maidens (' + n + ')');
  const xs = sim.units.filter((u) => u.type === 'shieldmaiden').map((u) => Math.round(u.hold.x * 10) / 10); ok(new Set(xs).size === 3, 'the three maidens stand apart (a row): ' + xs);
  ok(sim.send('lord', gx + 10, gz) === 3 && sim.send('lord', gx + 20, gz) === 3, 'three lords can be sent again and again');
  const st = sim.abilityState('shieldmaiden'); ok(st.n === 3 && st.sent && st.ready, 'ability state: 3 maidens, sent, ready');
  run(sim, 1); sim.events.length = 0;
  ok(sim.ability('shieldmaiden') === true, 'one press uses the ability'); const ev = sim.events.filter((e) => e.k === 'ability'); ok(ev.length === 3 && new Set(ev.map((e) => e.id)).size === 3, 'it fires for all 3 maidens (' + ev.length + ' events)');
  ok(sim.ability('shieldmaiden') === false, 'a second press during the cooldown does nothing (shared cooldown)');
  ok(sim.ability('lord') === true, 'the lords have their own cooldown');
  const guard = sim.units.filter((u) => u.type === 'shieldmaiden' && u.guardUntil > sim.time).length; ok(guard === 3, 'all 3 maidens guard (' + guard + ')');
}

// ---- p35 roster: new heroes, new units, new defences
const mkL = (army, L, seed = 5, extra = {}) => createBattle({ spec: { seed, ratio: 1, power: 4000, levels: { keep: L, wall: L, towers: L }, loot: { ruby: 1000, emerald: 1000, turq: 1000 }, ...extra }, army, forge: 1, targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta });
{ // the five heroes
  const sim = mkSim({ captain: 3, gryphonknight: 3, darkrider: 3, spear: 6 }); const g = sim.base.deploy, gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
  ok(['captain', 'shieldmaiden', 'lord', 'gryphonknight', 'darkrider'].every((t) => sim.isHero(t)) && !sim.isHero('ogre'), 'five hero types: captain / shieldmaiden / lord / gryphon knight / dark rider');
  ok(sim.send('captain', gx, gz) === 3 && sim.send('gryphonknight', gx + 8, gz) === 3 && sim.send('darkrider', gx + 16, gz) === 3, 'each hero squad: one send moves all 3');
  ok(sim.units.filter((u) => ['captain', 'gryphonknight', 'darkrider'].includes(u.type)).every((u) => u.hero), 'the new hero units carry the hero flag (manual: they hold the spot)');
  sim.send('spear', gx + 4, gz); run(sim, 6);
  ok(sim.ability('captain') === true && sim.units.filter((u) => u.type === 'spear' && u.bannerUntil > sim.time).length === 6, 'Banner: every spear nearby is inspired');
  ok(sim.ability('captain') === false, 'Banner: shared cooldown');
  ok(sim.ability('darkrider') === true && sim.units.filter((u) => u.type === 'darkrider' && u.shadowUntil > sim.time).length === 3, 'Shadow Breath: all three dark riders');
  const L0 = sim.units.length; sim.events.length = 0;
  const gk = sim.ability('gryphonknight'); ok(gk === false || sim.pending.length > 0, 'Dive Strike: needs a foe within 40 m — ' + (gk ? 'it dived' : 'nobody near, nothing spent'));
}
{ // Dive Strike hits when a foe is near
  const sim = mkL({ gryphonknight: 2 }, 12); const g = sim.base.deploy, d0 = sim.defenders[0]; for (const u of sim.units) { u.x = d0.x + 6; u.z = d0.z; u.active = true; u.hold = { x: u.x, z: u.z }; }
  const hp0 = d0.hp, ok1 = sim.ability('gryphonknight'); run(sim, 1.2);
  ok(ok1 === true && sim.stats.dealt.gryphonknight, 'Dive Strike lands a blast (' + JSON.stringify(sim.stats.dealt.gryphonknight || null) + ')');
}
{ // treant mends itself, ogre splashes, lich bursts, three-headed ones breathe three times
  const sim = mkL({ treant: 1 }, 25), u = sim.units[0]; u.active = true; u.hp = u.maxHp * 0.5; const h0 = u.hp; sim.step(1); sim.step(1);
  ok(u.hp > h0 + u.maxHp * 0.02, 'a treant regrows (' + Math.round(h0) + ' -> ' + Math.round(u.hp) + ')');
}
{ const sim = mkL({ dragon3: 1, baby3: 1, dragon: 1 }, 30), heads = {}; for (const u of sim.units) { u.active = true; u.go = null; u.x = sim.base.deploy.x - sim.base.deploy.nx * 20; u.z = sim.base.deploy.z - sim.base.deploy.nz * 20; }
  for (let t = 0; t < 40; t += 0.1) { sim.step(0.1); for (const e of sim.events) if (e.k === 'breath') { const ty = sim.units.find((u) => u.id === e.u); if (ty) { const k = ty.type; (heads[k] = heads[k] || new Set()).add(e.head | 0); } } }
  ok(heads.dragon3 && heads.dragon3.size === 3 && heads.baby3 && heads.baby3.size === 3 && heads.dragon && heads.dragon.size === 1, 'three-headed dragons breathe with heads 0,1,2; the normal dragon with one (' + Object.keys(heads).map((k) => k + ':' + [...heads[k]]).join(' ') + ')');
}
// defences: the three new kinds are upgrades of a roofed tower / a ballista site
const kinds = (L, profile) => { const sim = mkL({ spear: 1 }, L, 5, { profile: profile || 'balanced' }); const c = {}; for (const b of sim.buildings) if (b.def && b.dk) c[b.dk] = (c[b.dk] || 0) + 1; return { c, sim }; };
{ const a = kinds(10), b = kinds(18), c = kinds(22), d = kinds(23), e = kinds(30);
  ok(!a.c.frost && !a.c.flame && !a.c.dragonbane, 'level 10: none of the new defences (' + JSON.stringify(a.c) + ')');
  ok(b.c.frost === 1 && !b.c.flame && !b.c.dragonbane, 'level 18: the first Frost Spire (' + JSON.stringify(b.c) + ')');
  ok(c.c.flame === 1 && c.c.frost >= 1, 'level 22: the first Flame Tower (' + JSON.stringify(c.c) + ')');
  ok(d.c.dragonbane === 1, 'level 23: the first Dragonbane (' + JSON.stringify(d.c) + ')');
  ok(e.c.frost === 3 && e.c.flame === 3 && e.c.dragonbane === 3, 'level 30: 3 + 3 + 3 (' + JSON.stringify(e.c) + ')');
  const unmanned = a.sim.buildings.filter((q) => q.off && q.why === 'level' && q.type === 'tower' && q.def); ok(unmanned.length >= 3 && unmanned.every((q) => q.dk === 'tower'), 'level 10: the frost / flame sites keep shooting arrows (still defences, model hidden): ' + unmanned.length);
  const r = kinds(30, 'arrows'); ok(!r.c.frost && !r.c.flame && !r.c.dragonbane && !r.c.wizard && !r.c.cannon, 'an arrows-only castle at 30 has only arrow towers (' + JSON.stringify(r.c) + ')');
}
{ // frost slows: a unit the frost blast hits walks at half speed for a few seconds
  const sim = mkL({ spear: 2 }, 30); const fr = sim.buildings.find((b) => b.dk === 'frost' && b.def); const u = sim.units[0]; u.active = true; u.x = fr.x + 15; u.z = fr.z; u.go = null;
  let slowed = false; for (let t = 0; t < 8; t += 0.1) { sim.step(0.1); if (u.slowUntil > sim.time) { slowed = true; break; } }
  ok(slowed && u.slowK === 0.5, 'the frost spire slows what it hits (x' + u.slowK + ')');
}

console.log(bad ? 'RULES FAILED' : 'RULES OK'); process.exit(bad ? 1 : 0);
