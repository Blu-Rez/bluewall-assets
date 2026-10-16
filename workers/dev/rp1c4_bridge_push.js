// rp1c4_bridge_push.js — RP1C_R4 / QA1-051: every bridge x 3 places x a 3 s sideways push (both sides) with the real update().  Run in hero mode (evalf).
(async () => {
  const h = window.__h, d = h.dev, S = d.S, res = [], WS = -0.75; let nb = 0;
  const bs = S.nav.bridges;
  for (let bi = 0; bi < bs.length; bi++) {
    const b = bs[bi]; nb++;
    for (const f of [-0.28, 0, 0.28]) for (const side of [-1, 1]) {
      const x = b.x + b.nx * b.len * f, z = b.z + b.nz * b.len * f, yaw = Math.atan2(b.tx * side, b.tz * side);       // she faces across the deck, so a forward push goes sideways
      d.setPos(x, z, yaw); d.sim(0.3); d.setInput(0, 1); let hov = 0, fall = 0, maxY = -1e9, minY = 1e9; const n = 180;
      for (let i = 0; i < n; i++) { d.sim(1 / 60, 1 / 60); const g = d.ground(S.x, S.z), up = S.y - g; if (up > 0.35 && S.grounded && !(S.sw > 0)) hov++; if (!S.grounded) fall++; maxY = Math.max(maxY, S.y); minY = Math.min(minY, S.y); }
      d.setInput(0, 0); d.sim(1.5);
      const dx = S.x - b.x, dz = S.z - b.z, v = dx * b.tx + dz * b.tz, u = dx * b.nx + dz * b.nz, g = d.ground(S.x, S.z), onDeck = Math.abs(v) <= b.wid / 2 + 0.15 && Math.abs(u) <= b.len / 2 + 1;
      const st = onDeck ? 'deck' : (S.sw > 0 || g < WS ? 'river' : 'bank');
      res.push({ bi, f, side, st, v: +v.toFixed(2), up: +(S.y - g).toFixed(2), hov, fall, y: +S.y.toFixed(2), sw: S.sw });
    }
  }
  const bad = res.filter((r) => r.hov > 6 || (r.st !== "river" && Math.abs(r.up) > 0.4));
  const sum = {}; for (const r of res) sum[r.st] = (sum[r.st] || 0) + 1;
  return { bridges: nb, runs: res.length, sum, bad: bad.slice(0, 12), wid: bs.map((b) => +b.wid.toFixed(1)), sample: res.slice(0, 3) };
})()
