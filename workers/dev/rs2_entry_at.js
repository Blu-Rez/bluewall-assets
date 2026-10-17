// rs2_entry_at.js — RS2: freeze the entrance at t seconds (the fall + land clips AND the light) for a screenshot.   set window.__rs2T = t first (default 0.3); then  python3 rp1c2_q.py -t rs2 evalf rs2_entry_at.js ; sleep 3 ; shot NAME ; eval "__rs2Free()"
(async () => {
  const sl = (ms) => new Promise((r) => setTimeout(r, ms)), h = window.__h, S = h.dev.S, sis = h.sisters, rp = h.dev, t = window.__rs2T == null ? 0.3 : window.__rs2T;
  window.__rs2Free = () => { S.paused = false; return 1; };
  S.paused = false; await sl(300); rp.setPos(S.x, S.z); S.st = 'loco'; S.stT = 0; rp.sim(0.05);                           // (grounded, standing, camera settled)
  sis.entry(); rp.sim(t, 1 / 60); sis.fxSet(t); S.paused = true;
  const a = { t, y: +(S.y - rp.ground(S.x, S.z)).toFixed(3), st: S.st, grounded: S.grounded, fx: sis.st.fx, rig: !!sis.rig, ring: sis.rig && sis.rig.ring.material.opacity, col: sis.rig && sis.rig.col.material.opacity };
  return JSON.stringify(a);
})()
