// RP4 kit contract check.  checkKit(rawKit, { clipDur, log }) -> { ok, fails[], warnings[], table[] }.
// What a kit file must pass before it goes anywhere: (1) validateKit (every field, every range, unknown fields), (2) every beat really connects with a dummy, in order, (3) every skill effect does what it says
// (hits / status / heal / shield / buff / stamina), (4) the guard works from the front and not from behind, (5) a 25-second random fight has no NaN and is deterministic.
// Used by dev/rp4_test.sh (fixtures for the five other archetypes) and by dev/rp4_kit_check.sh <sister> (the real kit file).
import { createSim, validateKit, elementMult, KINDS, TUNE } from '../bot/bluebot_v2/bluewall/web/assets/rpg/combat.js';
const DT = 1 / 60;
export function checkKit(raw, o = {}) {
  const fails = [], warnings = [], table = [], passes = [];
  const chk = (c, msg) => { if (c) passes.push(msg); else fails.push(msg); };
  const R = validateKit(raw, { clips: o.clips, clipDur: o.clipDur }); warnings.push(...R.warnings);
  if (!R.ok) return { ok: false, fails: R.errors.map((e) => 'kit: ' + e), warnings, table, passes };
  const kit = R.kit, NC = kit.combo.length;
  const run = (sim, secs, inf, onEv) => { const n = Math.round(secs / DT); for (let i = 0; i < n; i++) { sim.update(DT, (inf ? inf(sim.S.t, i) : null) || {}); if (onEv) for (const e of sim.events) onEv(e, sim.S.t); } };
  const mk = (seed) => createSim({ kit, seed: seed || 1, selfMove: true });
  const dummy = (sim, x, z, hp) => { const e = sim.spawn('brute', x, z, { passive: true, element: null, yaw: Math.PI }); e.hp = e.hpMax = hp || 1e6; e.K = { ...e.K, cc: 1 }; return e; };    // (a training dummy: neutral element, cc 1)

  // ---- A. every beat connects, in order
  for (let i = 0; i < NC; i++) {
    const b = kit.combo[i], sim = mk(); const dist = b.type === 'shot' ? Math.min(b.shot.range * 0.5, 7) : Math.min(b.reach * 0.6, 2.4) + 0.8;
    dummy(sim, 0, dist);
    const seq = [], hits = {}; let t0 = {}, hit0 = {};
    run(sim, 0.03 + (i + 1) * 1.6, () => ({ attack: true }), (ev, t) => {
      if (ev.type === 'swing') { seq.push(ev.a); t0[ev.a] = t0[ev.a] == null ? t : t0[ev.a]; }
      if (ev.type === 'hit' && (ev.kind === 'light' || ev.kind === 'finisher')) { const k = seq[seq.length - 1]; hits[k] = (hits[k] || 0) + ev.dmg; if (hit0[k] == null) hit0[k] = t - t0[k]; }
    });
    if (i === 0) {                                                       // the chain, once
      const sim2 = mk(); const d2 = dummy(sim2, 0, 2.0); const seq2 = [], dm = {}; let cur = -1, tt = {}, ht = {}, t00 = {}, lp = 0, pv = -1;       // (only the first pass of the chain counts: mashing loops it)
      run(sim2, NC * 1.2 + 1.0, () => ({ attack: true }), (ev, t) => { if (ev.type === 'swing') { if (ev.a <= pv) lp++; pv = ev.a; cur = ev.a; seq2.push(ev.a); if (t00[cur] == null) t00[cur] = t; } if (ev.type === 'hit' && (ev.kind === 'light' || ev.kind === 'finisher') && lp === 0) { dm[cur] = (dm[cur] || 0) + ev.dmg; if (ht[cur] == null) ht[cur] = t - t00[cur]; } });
      const want = []; for (let k = 0; k < NC; k++) want.push(k);
      chk(seq2.slice(0, NC).join() === want.join(), `combo: mashing attack plays the beats in order 0..${NC - 1} (${seq2.slice(0, NC + 1).join('')})`);
      kit.combo.forEach((c, k) => chk(dm[k] > 0, `combo[${k}] (${c.clip}${c.type === 'shot' ? ', shot' : ''}) connects with a dummy 2 m away (${(dm[k] || 0).toFixed(0)} damage)`));
      let real = 0; for (let k = 0; k < NC; k++) real += Math.min(kit.combo[k].cancel, kit.combo[k].dur) / kit.combo[k].rate;
      let dmgSum = 0; for (let k = 0; k < NC; k++) dmgSum += dm[k] || 0;
      table.push(`combo: ${NC} beats, chain ${real.toFixed(2)} s of real time, ${dmgSum.toFixed(0)} damage per chain on a neutral target (${(dmgSum / real).toFixed(0)} per second)`);
      kit.combo.forEach((c, k) => table.push(`  beat ${k}: ${c.type === 'shot' ? 'shot ' + c.shot.speed + ' m/s range ' + c.shot.range : 'arc ' + Math.round(c.arc * 180 / Math.PI) + ' deg reach ' + c.reach} · ${c.clip} ${c.dur}s${c.rate !== 1 ? ' x' + c.rate : ''} · hit at ${(ht[k] == null ? NaN : ht[k]).toFixed(2)} s real · ${(dm[k] || 0).toFixed(0)} dmg${c.finisher ? ' · finisher' : ''}${c.status ? ' · ' + c.status.id : ''}`));
    }
  }
  // ---- B. every skill effect does what it says
  kit.skills.forEach((s, i) => {
    const sim = mk(), a = dummy(sim, 0, 3), b = dummy(sim, 0, 6), c = dummy(sim, 3, 0), key = i ? 'skill2' : 'skill1';
    sim.hero.hp = sim.hero.hpMax * 0.3; sim.hero.st = 30; const hp0 = sim.hero.hp; let hit = 0, hk = {}, st = 0, hasStatus = {}, heal = 0, shield = 0, buff = 0, stam = 0, proj = 0, burst = 0, skills = 0, pressed = false;
    run(sim, s.dur / s.rate + 0.9, () => { if (!pressed) { pressed = true; return { [key]: true, mx: 0, mz: 1 }; } return {}; }, (ev) => { if (ev.type === 'skill') skills++; if (ev.type === 'hit') { hit++; hk[ev.kind] = (hk[ev.kind] || 0) + 1; } if (ev.type === 'status') hasStatus[ev.kind] = (hasStatus[ev.kind] || 0) + 1; if (ev.type === 'heal') heal++; if (ev.type === 'shield') shield++; if (ev.type === 'buff') buff++; if (ev.type === 'stamina') stam++; if (ev.type === 'proj') proj++; if (ev.type === 'burst') burst++; });
    chk(skills === 1, `skill ${i} (${s.id}) starts when its button is pressed`);
    s.effects.forEach((f, j) => {
      const nm = `skill ${i} (${s.id}) effect ${j} (${f.type})`;
      if (f.type === 'projectile') { chk(proj === f.count * s.effects.filter((q) => q === f).length || proj >= f.count, `${nm}: fires ${f.count} projectile(s) (${proj})`); chk(f.dmg > 0 ? (hk.proj || 0) >= 1 : Object.keys(hasStatus).length >= 1, `${nm}: reaches the dummies and does ${f.dmg > 0 ? 'damage' : 'its status'}`); if (!f.pierce && f.count === 1 && f.dmg > 0) chk((hk.proj || 0) === 1, `${nm}: a non-piercing projectile hits exactly one enemy (${hk.proj || 0})`); }
      if (f.type === 'aoe') { chk(burst >= 1, `${nm}: the area is emitted`); chk(f.dmg > 0 ? (hk.burst || 0) >= 1 : Object.keys(hasStatus).length >= 1, `${nm}: catches the dummies in range and does ${f.dmg > 0 ? 'damage' : 'its status'}`); }
      if (f.type === 'heal') { chk(heal >= 1 && (f.dur > 0 || sim.hero.hp > hp0), `${nm}: heals (${hp0.toFixed(0)} -> ${sim.hero.hp.toFixed(0)} hp)`); }
      if (f.type === 'shield') { chk(shield >= 1 && sim.hero.sh > 0, `${nm}: a shield of ${sim.hero.sh.toFixed(0)} is up`); }
      if (f.type === 'buff') { chk(buff >= 1 && sim.hero.bf[f.stat].t > 0, `${nm}: ${f.stat} x${f.mult} is active (${sim.hero.bf[f.stat].t.toFixed(1)} s left)`); }
      if (f.type === 'stamina') { chk(stam >= 1 && sim.hero.st > 30, `${nm}: stamina restored (30 -> ${sim.hero.st.toFixed(0)})`); }
      if (f.status) chk(hasStatus[f.status.id] >= 1, `${nm}: applies ${f.status.id} (${hasStatus[f.status.id] || 0} enemies)`);
    });
    // cooldown: a second press inside it is ignored
    const s2 = mk(); dummy(s2, 0, 3); let n2 = 0, p2 = 0; run(s2, s.dur / s.rate + 0.6, () => (p2++ % 5 === 0 ? { [key]: true } : {}), (ev) => { if (ev.type === 'skill') n2++; }); chk(n2 === 1, `skill ${i} (${s.id}) has a ${s.cd} s cooldown (pressing again inside it does nothing)`);
    table.push(`skill ${i}: ${s.id} · cd ${s.cd}s · ${s.clip} ${s.dur}s${s.rate !== 1 ? ' x' + s.rate : ''}, effect at ${(s.at / s.rate).toFixed(2)} s real · ${s.effects.map((f) => f.type + (f.dmg ? ' ' + f.dmg + 'xATK' : '') + (f.amount ? ' ' + f.amount : '') + (f.status ? ' +' + f.status.id : '')).join(', ')}${s.cost ? ' · costs ' + s.cost + ' stamina' : ''}`);
  });
  // ---- C. status mechanics (only those the kit uses)
  const used = new Set(); kit.combo.forEach((b) => b.status && used.add(b.status.id)); kit.skills.forEach((s) => s.effects.forEach((f) => f.status && used.add(f.status.id)));
  for (const id of used) {
    const sim = createSim({ kit: { ...kit }, seed: 2, selfMove: true }), e = sim.spawn('soldier', 0, 7, { yaw: Math.PI, element: null }); e.hp = e.hpMax = 1e6; const st = kit.combo.map((b) => b.status).concat(kit.skills.flatMap((s) => s.effects.map((f) => f.status))).find((q) => q && q.id === id);
    // apply it the way the sim does: through a skill hit is covered above; here the MECHANIC: speed / rooted / frozen / burning
    const apply = () => { const fx = { type: 'aoe', shape: 'circle', radius: 20, dmg: 0, knock: 0, status: st }; sim.hero.x = 0; sim.hero.z = 0; const k2 = { ...kit, skills: [{ ...kit.skills[0], effects: [fx], at: 0, dur: 0.3, rate: 1, cd: 1, lunge: [0, 0, 1], cost: 0 }, kit.skills[1]] }; return k2; };
    const k2 = apply(), s2 = createSim({ kit: k2, seed: 2, selfMove: true }), en = s2.spawn('soldier', 0, 8, { yaw: Math.PI, element: null }); en.hp = en.hpMax = 1e6; s2.update(DT, { skill1: true, mx: 0, mz: 1 });
    run(s2, 0.1, () => ({}), null); const d0 = Math.hypot(en.x - s2.hero.x, en.z - s2.hero.z); run(s2, 0.5, () => ({}), null); const d1 = Math.hypot(en.x - s2.hero.x, en.z - s2.hero.z), mvd = d0 - d1, hp1 = en.hp;
    const sim3 = createSim({ kit: kit, seed: 2, selfMove: true }), en3 = sim3.spawn('soldier', 0, 8, { yaw: Math.PI, element: null }); en3.hp = en3.hpMax = 1e6; run(sim3, 0.6, () => ({}), null); const base = 8 - Math.hypot(en3.x, en3.z);
    if (id === 'freeze') chk(mvd < 0.05 && en.fzT > 0, `status freeze: the enemy does not move while frozen (${mvd.toFixed(2)} m vs ${base.toFixed(2)} m free)`);
    if (id === 'root') chk(mvd < 0.05 && en.rootT > 0, `status root: the enemy cannot walk (${mvd.toFixed(2)} m vs ${base.toFixed(2)} m free)`);
    if (id === 'slow') chk(mvd < base * 0.9 && mvd > 0, `status slow: the enemy walks slower (${mvd.toFixed(2)} m vs ${base.toFixed(2)} m free)`);
    if (id === 'burn') { run(s2, 1.0, () => ({}), null); chk(en.hp < 1e6 - 5, `status burn: the enemy loses HP over time (${(1e6 - en.hp).toFixed(0)} in 1.6 s)`); }
  }
  // ---- D. the guard
  { const front = (deg) => { const sim = createSim({ kit, seed: 1, selfMove: true, tune: { block: { walk: 0 } } }), a = deg * Math.PI / 180; sim.spawn('soldier', Math.sin(a) * 1.4, Math.cos(a) * 1.4, { yaw: a + Math.PI }); let r = null; run(sim, 1.3, () => ({ block: true, mx: 0, mz: 1 }), (ev) => { if (ev.type === 'block' && !r) r = ev; if (ev.type === 'hero-hit' && !r) r = { hurt: ev.dmg }; }); return r; };
    const half = kit.block.arc * 90 / Math.PI;
    const f0 = front(0); chk(f0 && f0.dmg != null && Math.abs(f0.dmg - Math.round(KINDS.soldier.dmg * elementMult(KINDS.soldier.element, kit.element) * kit.block.dr * 10) / 10) < 0.11, `block: a front hit does x${kit.block.dr} (${f0 && f0.dmg})`);
    if (half < 170) { const fi = front(half - 12), fo = front(half + 15); chk(fi && fi.dmg != null && !fi.hurt, `block: ${Math.round(half - 12)} deg off-centre is inside the ${Math.round(half * 2)} deg guard`); chk(fo && fo.hurt != null, `block: ${Math.round(half + 15)} deg off-centre is outside it`); }
    table.push(`block: ${Math.round(kit.block.arc * 180 / Math.PI)} deg, damage x${kit.block.dr}, ${kit.block.cost} stamina per point, raise ${kit.block.raise} s${kit.block.walk ? ', walks ' + kit.block.walk + ' m/s' : ''}`); }
  // ---- E. robustness: a 25 s random fight, twice
  const fight = () => { const sim = mk(7); let r = 12345; const rn = () => { r = (Math.imul(r, 1103515245) + 12345) & 0x7fffffff; return r / 0x7fffffff; }; for (let i = 0; i < 5; i++) sim.spawn(['soldier', 'beast', 'brute'][i % 3], Math.cos(i) * 7, Math.sin(i) * 7); let bad = false, ev = 0;
    for (let i = 0; i < 1500; i++) { sim.update(DT, { mx: rn() < 0.3 ? rn() * 2 - 1 : 0, mz: rn() < 0.3 ? rn() * 2 - 1 : 0, attack: rn() < 0.12, dodge: rn() < 0.03, skill1: rn() < 0.02, skill2: rn() < 0.01, lock: rn() < 0.01, lockNext: rn() < 0.01, block: rn() < 0.5 && i % 120 < 40, camYaw: 0 }); ev += sim.events.length; const H = sim.hero; if (![H.x, H.z, H.hp, H.st, H.yaw, H.sh].every(Number.isFinite)) bad = true; for (const e of sim.enemies) if (![e.x, e.z, e.hp].every(Number.isFinite)) bad = true; if (H.state === 'dead') sim.revive(); }
    return { hash: sim.S.hash, bad, ev }; };
  const f1 = fight(), f2 = fight(); chk(!f1.bad, 'a 25 s random fight (all buttons, 5 enemies) produces no NaN'); chk(f1.hash === f2.hash && f1.ev === f2.ev && f1.ev > 30, `the same fight twice gives the same state hash (${f1.hash}, ${f1.ev} events)`);
  return { ok: fails.length === 0, fails, warnings, table, passes };
}
