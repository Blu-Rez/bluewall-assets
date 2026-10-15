new Promise((res) => {
  const s = __bw.battle.session, V = s.views.views, st = new Map(), out = { frames: 0, byType: {}, tot: { n: 0, side45: 0, side70: 0, back: 0 } };
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let t0 = performance.now(), frames = 0;
  const tick = () => {
    frames++;
    for (const v of V.values()) {
      const u = v.u; if (v.dead || u.dead || v.T.air || v.T.catapult) continue;
      const p = st.get(v); if (!p) { st.set(v, { x: u.x, z: u.z, n: 0 }); continue; }
      const dx = u.x - p.x, dz = u.z - p.z, d = Math.hypot(dx, dz); p.x = u.x; p.z = u.z;
      // displacement over this frame at game speed: count only clearly moving soldiers (> 1.2 m/s, using v.v the smoothed speed)
      if (v.v < 1.2 || d < 1e-4) continue;
      const a = Math.abs(wrap(Math.atan2(dx, dz) - v.yaw)), T = out.byType[v.key] || (out.byType[v.key] = { n: 0, s45: 0 });
      T.n++; out.tot.n++; if (a > Math.PI / 4) { T.s45++; out.tot.side45++; } if (a > 1.22) out.tot.side70++; if (a > 2.1) out.tot.back++;
    }
    if (frames < 240) requestAnimationFrame(tick); else { out.frames = frames; out.secs = (performance.now() - t0) / 1000; out.tot.frac45 = +(out.tot.side45 / Math.max(1, out.tot.n)).toFixed(3); out.tot.frac70 = +(out.tot.side70 / Math.max(1, out.tot.n)).toFixed(3); out.tot.fracBack = +(out.tot.back / Math.max(1, out.tot.n)).toFixed(3); res(out); }
  };
  requestAnimationFrame(tick);
})
