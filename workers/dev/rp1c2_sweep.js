// rp1c2_sweep.js — RP1C-R2 Job 5: find the stride constants that plant the feet.  window.__SW = { sw: [..], sr: [..], offs: [..] }.  For each walk stride: stance slide at the walk and at 2.5 m/s; each run stride: at run and sprint; each phase offset: L/R heel-strike error at 3.0 m/s.
(async () => {
  const B = __bw, T = B.THREE, rp = __rp, S = rp.S, DEG = 180 / Math.PI;
  const q = (a, p) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))].toFixed(2); };
  rp.pause(true); S.cool = 99; rp.setInput(0, 0); rp.sprint(false); const h = S.hero, g = (n) => h.model.getObjectByName(n), FT = [g('L_Foot'), g('R_Foot')], wp = new T.Vector3();
  const ftw = (i) => { FT[i].getWorldPosition(wp); return [wp.x, wp.y, wp.z]; };
  const cands = []; for (let x = -300; x <= 300; x += 20) for (let z = -300; z <= 200; z += 20) { let lo = 1e9, hi = -1e9, ok = true; for (let k = 0; k <= 14; k++) { const y = rp.baseGround(x, z + k * 5); if (rp.ground(x, z + k * 5) < -0.2 || rp.surfAt(x, z + k * 5) > -1e8) ok = false; lo = Math.min(lo, y); hi = Math.max(hi, y); } if (ok && hi - lo < 0.5 && lo > 0.3) cands.push({ x, z }); }
  let flat = null; rp.footOn(false); for (const c of cands) { rp.setPos(c.x, c.z, 0); rp.setInput(0, 1); rp.sprint(true); rp.sim(2.5, 1 / 60); if (S.z - c.z > 12 && Math.abs(S.x - c.x) < 1) { flat = c; break; } } rp.setInput(0, 0); rp.sprint(false); rp.footOn(true);
  const k0 = h.ik, a0 = k0 ? k0.a0 : 0.134;
  const meas = (m, spr, secs) => { const F = 1 / 60; rp.setPos(flat.x, flat.z, 0); S.phase = 0; rp.setInput(0, m); rp.sprint(spr); rp.sim(2.2, F); const sp = [[], []], n = [0, 0], pp = [null, null]; let v = 0, c = 0;
    for (let i = 0; i < Math.round(secs / F); i++) { rp.sim(F, F); v += S.speed; c++; for (let f = 0; f < 2; f++) { const p = ftw(f), sole = p[1] - a0 - rp.baseGround(p[0], p[2]), d = pp[f] ? Math.hypot(p[0] - pp[f][0], p[2] - pp[f][2]) / F : 0, vy = pp[f] ? Math.abs(p[1] - pp[f][1]) / F : 9; pp[f] = p; if (sole < 0.04 && vy < 0.8) { n[f]++; if (n[f] >= 3) sp[f].push(d * 100); } else n[f] = 0; } }
    const all = sp[0].concat(sp[1]); return { v: +(v / c).toFixed(2), n: all.length, med: q(all, 0.5), p90: q(all, 0.9), medL: q(sp[0], 0.5), medR: q(sp[1], 0.5) }; };
  const SW = window.__SW || {}, out = { flat, rows: [] };
  for (const sw of SW.sw || []) { rp.gait({ sw }); out.rows.push({ sw, walk: meas(0.55, false, 5.0), m25: meas(0.76, false, 3.0) }); }
  for (const sr of SW.sr || []) { rp.gait({ sr }); out.rows.push({ sr, run: meas(1, false, 3.0), sprint: meas(1, true, 3.0) }); }
  for (const off of SW.offs || []) { rp.gait({ off }); out.rows.push({ off, m25: meas(0.76, false, 3.0), m35: meas(0.9, false, 3.0), run: meas(1, false, 3.0) }); }
  rp.setInput(0, 0); rp.sprint(false); rp.pause(false);
  return JSON.stringify(out);
})()
