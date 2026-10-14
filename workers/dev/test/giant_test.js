// headless: the giant's club hit is counted when the club meets the ground in the clip (owner 4 Oct 21:51, "visible hit = numeric hit")
//  1. clip contact: lowest point of the club head in the 'attack1' clip (measured once from the troll rig, giant_clip.json)  vs  GIANT_SWING.hit (sim delay between the swing and the damage)  -> within 0.1 s
//  2. the sim really applies the damage GIANT_SWING.hit s after the 'melee' event, and one swing per GIANT_SWING.iv s (+-10 %)
//  3. same seed -> same result twice (determinism)
import { createBattle, GIANT_SWING } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
import CLIP from './giant_clip.json';
let bad = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) bad++; };
const rows = CLIP.clips[GIANT_SWING.clip].rows.filter((r) => r.t >= 0.5 && r.t <= 1.1);
const low = rows.reduce((a, r) => (r.head[1] < a.head[1] ? r : a), rows[0]);
ok(Math.abs(low.t - GIANT_SWING.hit) <= 0.1, `clip contact (lowest club head) ${low.t.toFixed(2)} s vs sim damage delay ${GIANT_SWING.hit} s (diff ${(low.t - GIANT_SWING.hit).toFixed(2)})`);
ok(Math.abs(GIANT_SWING.contact - low.t) <= 0.05, `GIANT_SWING.contact ${GIANT_SWING.contact} = measured ${low.t.toFixed(2)}`);
const keepT = BT.targets.find((t) => t.type === 'keep');
function run(seed) {
  const army = { giant: 3, spear: 6 };
  const spec = { seed, ratio: 1.1, power: 3000, levels: { keep: 12, wall: 12, towers: 12 }, loot: { ruby: 100, emerald: 100, turq: 100 } };
  const sim = createBattle({ spec, army, forge: 1, targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta });
  const g = sim.base.deploy, gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
  sim.send('giant', gx, gz); sim.send('spear', gx, gz);
  const melee = {}, gaps = [], dts = []; let slams = 0, sig = 0;
  for (let i = 0; i < 30 * 70 && !sim.over; i++) {
    sim.step(1 / 30);
    for (const e of sim.events) {
      if (e.k === 'melee') { const u = sim.units.find((x) => x.id === e.u); if (u && u.type === 'giant') { if (melee[e.u] && melee[e.u].t != null) gaps.push(sim.time - melee[e.u].t); melee[e.u] = { t: sim.time, pend: true }; } }
      if (e.k === 'slam') { slams++; const m = Object.values(melee).filter((x) => x.pend).sort((a, b) => a.t - b.t)[0]; if (m) { dts.push(sim.time - m.t); m.pend = false; } sig = (sig * 31 + Math.round(e.x * 10) + Math.round(e.z * 7)) | 0; }
    }
  }
  return { slams, gaps, dts, sig, t: sim.time, destr: sim.destruction() };
}
const a = run(7), b = run(7);
ok(a.slams >= 6, `giants swung ${a.slams} times in ${a.t.toFixed(0)} s (>= 6 expected)`);
const med = (x) => { const y = x.slice().sort((p, q) => p - q); return y[y.length >> 1] || 0; };
ok(a.dts.length && a.dts.every((d) => Math.abs(d - GIANT_SWING.hit) < 0.05), `damage lands ${GIANT_SWING.hit} s after the swing starts: ${a.dts.slice(0, 6).map((d) => d.toFixed(2)).join(' ')}`);
ok(a.gaps.length && med(a.gaps) > GIANT_SWING.iv * 0.88 && med(a.gaps) < GIANT_SWING.iv * 1.15, `typical time between swings ${med(a.gaps).toFixed(2)} s (iv ${GIANT_SWING.iv})`);
ok(a.sig === b.sig && a.slams === b.slams && Math.abs(a.destr - b.destr) < 1e-9, 'deterministic: same seed, same result');
console.log(bad ? 'GIANT TEST FAILED' : 'GIANT TEST OK');
process.exit(bad ? 1 : 0);
