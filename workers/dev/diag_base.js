import * as SIM from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildNav, bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
const NAV = buildNav({ height: L.height, bridges: bridgesFromLayout(L) });
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const tun = arg('tune', ''); if (tun) for (const kv of tun.split(',')) { const [k, v] = kv.split('='); SIM.TUNE[k] = +v; }
for (const profile of ['balanced', 'aa', 'art', 'arrows']) {
  const spec = { seed: 1, ratio: 1, power: 4500, levels: { keep: 20, wall: 20, towers: 20 }, loot: {}, profile };
  const sim = SIM.createBattle({ spec, army: { spear: 1 }, forge: 20, spells: {}, targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta, nav: NAV });
  const by = {}; let tot = 0; for (const b of sim.buildings) if (b.def && b.dmg) { const k = b.dk; (by[k] = by[k] || { n: 0, dps: 0, hp: 0, rng: b.rng }); by[k].n++; by[k].dps += b.dmg / b.cd; by[k].hp += b.maxHp; tot += b.dmg / b.cd; }
  const gd = sim.defenders.filter((d) => d.guardian).map((d) => d.type + ':' + Math.round(d.hp) + '/' + d.dps.toFixed(0)).join(' ');
  const gar = sim.defenders.filter((d) => !d.guardian); const gdps = gar.reduce((a, d) => a + d.dps, 0), ghp = gar.reduce((a, d) => a + d.hp, 0);
  console.log(profile.padEnd(9), 'guns dps', tot.toFixed(0), Object.entries(by).map(([k, v]) => `${k}×${v.n}(${(v.dps).toFixed(0)}dps, hp ${(v.hp / v.n).toFixed(0)}, r${v.rng})`).join('  '), '| garrison', gar.length, 'dps', gdps.toFixed(0), 'hp', ghp.toFixed(0), '| guardians', gd || '-');
}
