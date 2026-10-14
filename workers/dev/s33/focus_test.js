import { createBattle } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildNav, bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
const NAV = buildNav({ height: L.height, bridges: bridgesFromLayout(L) });
const run = (mode) => {
  const spec = { seed: 3, ratio: 1, power: 3000, levels: { keep: 20, wall: 20, towers: 20 }, loot: {} };
  const sim = createBattle({ spec, army: { archer: 24, cavalry: 8 }, forge: 10, spells: {}, targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta, nav: NAV });
  const g = sim.base.deploy; const vault = sim.buildings.filter((b) => b.type === 'vault' && !b.dead)[0];
  const gx = BT.meta.gates[0].x, gz = BT.meta.gates[0].z;
  if (mode === 'half') { const n1 = sim.send('archer', gx, gz, { half: true }); const act = sim.units.filter((u) => u.type === 'archer' && u.active).length; return { sent: n1, active: act }; }
  sim.send('cavalry', gx, gz);
  const tgt = sim.targetAt(vault.x + 0.5, vault.z + 0.5);
  const n = sim.focus('archer', tgt);
  let t = 0, hit = false; while (!sim.over && t < 90 && !tgt.dead) { sim.step(0.1); t += 0.1; }
  const onIt = sim.units.filter((u) => u.type === 'archer' && !u.dead && u.target === tgt).length;
  return { focused: n, tgt: tgt.type, dead: tgt.dead, t: +t.toFixed(1), stillOn: onIt, hp: Math.round(tgt.hp) + '/' + Math.round(tgt.maxHp) };
};
console.log('half', JSON.stringify(run('half')));
console.log('focus', JSON.stringify(run('focus')));
