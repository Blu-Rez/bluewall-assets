import { createBattle } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
const army = { shieldmaiden: 1, lord: 1, spear: 8 };
const spec = { seed: 5, ratio: 1, power: 4000, levels: { keep: 6, wall: 6, towers: 6 }, loot: { ruby: 1000, emerald: 1000, turq: 1000 } };
const sim = createBattle({ spec, army, forge: 1, targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta });
const g = sim.base.deploy; const gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
const hero = (t) => sim.units.find((u) => u.type === t);
const at = (x, z) => [x, z];
// send hero maiden 20 m in front of the gate, spears to the keep
sim.send('shieldmaiden', gx + g.nx * -20 * -1, gz + g.nz * -20 * -1);
sim.send('lord', gx + g.nx * 25, gz + g.nz * 25);
const m = hero('shieldmaiden'), l = hero('lord'); const m0 = m.hold;
for (const b of sim.buildings) { const d = Math.hypot(b.x - m0.x, b.z - m0.z); if (d < 45) console.log('  b', b.type, b.ring ? 'ring' : '', 'd', d.toFixed(0), 'rng', b.rng, 'def', b.def, 'w', b.w); }
console.log('hold maiden', m.hold, 'lord', l.hold, 'go', !!m.go);
let t = 0; const dt = 0.1;
const rep = (tag) => console.log(tag, 't=' + t.toFixed(0), 'maiden', m.x.toFixed(1), m.z.toFixed(1), 'hp', Math.round(m.hp), 'tgt', m.target ? (m.target.type || 'b') : null, '| lord', l.x.toFixed(1), l.z.toFixed(1), 'hp', Math.round(l.hp), 'tgt', l.target ? (l.target.type || 'b') : null);
for (; t < 40; t += dt) { sim.step(dt); if (Math.abs(t - Math.round(t / 10) * 10) < dt / 2) rep('A'); }
console.log('ability state', JSON.stringify(sim.abilityState('shieldmaiden')), JSON.stringify(sim.abilityState('lord')));
console.log('use shield', sim.ability('shieldmaiden'), 'again', sim.ability('shieldmaiden'), 'lord', sim.ability('lord'));
console.log('events', sim.events.map((e) => e.k).join(','));
for (let i = 0; i < 70; i++) { sim.step(dt); t += dt; }
rep('B'); console.log('guard until', m.guardUntil?.toFixed(1), 'time', sim.time.toFixed(1));
// now send the maiden somewhere else
sim.send('shieldmaiden', gx + g.nx * 5, gz + g.nz * 5);
for (let i = 0; i < 200; i++) { sim.step(dt); t += dt; }
rep('C');
console.log('--- near maiden hold (before):');
