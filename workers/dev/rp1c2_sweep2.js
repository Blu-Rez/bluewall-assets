// rp1c2_sweep2.js — RP1C-R2 Job 5: start / stop acceleration vs. the slide of the stance foot.  window.__ACC = [..] (m/s²), window.__DEC = [..]
(async () => {
  const B = __bw, T = B.THREE, rp = __rp, S = rp.S;
  const q = (a, p) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))].toFixed(1); };
  rp.pause(true); S.cool = 99; rp.setInput(0, 0); rp.sprint(false); const h = S.hero, g = (n) => h.model.getObjectByName(n), FT = [g('L_Foot'), g('R_Foot')], wp = new T.Vector3(); const ftw = (i) => { FT[i].getWorldPosition(wp); return [wp.x, wp.y, wp.z]; };
  const flat = { x: -80, z: -40 }, a0 = h.ik ? h.ik.a0 : 0.134, F = 1 / 60;
  const track = (secs, setup) => { rp.setPos(flat.x, flat.z, 0); rp.sim(0.8, F); S.phase = 0; setup(); const sp = [], n = [0, 0], pp = [null, null], spd = []; for (let i = 0; i < Math.round(secs / F); i++) { rp.sim(F, F); spd.push(S.speed); for (let f = 0; f < 2; f++) { const p = ftw(f), sole = p[1] - a0 - rp.baseGround(p[0], p[2]), d = pp[f] ? Math.hypot(p[0] - pp[f][0], p[2] - pp[f][2]) / F : 0, vy = pp[f] ? Math.abs(p[1] - pp[f][1]) / F : 9; pp[f] = p; if (sole < 0.04 && vy < 0.8) { n[f]++; if (n[f] >= 3) sp.push(d * 100); } else n[f] = 0; } }
    const top = Math.max(...spd), t90 = (spd.findIndex((x) => x >= 0.9 * top) + 1) * F; return { n: sp.length, med: q(sp, 0.5), p75: q(sp, 0.75), p90: q(sp, 0.9), t90: +t90.toFixed(2) }; };
  const out = { rows: [] };
  for (const acc of window.__ACC || []) { rp.gait({ acc }); out.rows.push({ acc, run: track(1.6, () => rp.setInput(0, 1)), walk: track(1.6, () => rp.setInput(0, 0.55)) }); }
  rp.setInput(0, 0); rp.pause(false); return JSON.stringify(out);
})()
