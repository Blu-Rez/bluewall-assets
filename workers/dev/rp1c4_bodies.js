// rp1c4_bodies.js — RP1C_R4 item 3: the six new bodies in game numbers (one hero per call:  window.__bodyK = 'elina'; evalf).  Returns height, sole clearance idle / walk / run, ramp up+down, F9, load ms.
(async () => {
  const k = window.__bodyK, h = window.__h, d = h.dev, S = d.S, T0 = performance.now(), sl = (ms) => new Promise((r) => setTimeout(r, ms));
  try { h.exit(); } catch (e) { /* not in hero mode */ }
  await h.start(k); const ms = Math.round(performance.now() - T0), g = S.hero, o = { k, ms, warm: h.warmed };
  const THREE_Box = (window.__bw && 0); // (no THREE here: read the heights off the bones instead)
  const sole = () => { let lo = 9, hi = -9; for (const b of (g.toes || [])) { const p = b.getWorldPosition(new b.position.constructor()); const c = p.y - d.ground(p.x, p.z); lo = Math.min(lo, c); hi = Math.max(hi, c); } return [+lo.toFixed(3), +hi.toFixed(3)]; };
  d.setPos(S.x, S.z, S.camYaw); d.sim(1); o.idle = sole();
  d.setInput(0, 1); d.sim(1.2); o.walk = sole(); d.sprint(true); d.sim(1.2); o.run = sole(); d.sprint(false); d.setInput(0, 0); d.sim(0.5);
  const r = d.rampTest(0); o.ramp = { ok: r.ok, grade: r.maxGrade != null ? +r.maxGrade.toFixed(3) : null, camBad: r.camBad, fall: r.fall };
  const r2 = d.rampTest(7); o.ramp2 = { ok: r2.ok, camBad: r2.camBad, fall: r2.fall };
  o.head = g.head ? +(g.head.getWorldPosition(new g.head.position.constructor()).y - S.y).toFixed(2) : null; o.hs = { HERO_H: 1.75 * 1.2544 };
  o.progs = (d.stats && d.stats.progs) || null;
  return o;
})()
