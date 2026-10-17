// rp1c_r6_dyn.js — RP1C_R6: the camera in MOTION — pops and shake while she walks / runs / backs into a wall / the camera turns round her, 60 fps, the real update() + camera (no rendering).  Evaluated INSIDE the game page (hero started):
//   rp1c2_q.py evalf rp1c_r6_dyn.js   ->  JSON { routes: { name: { frames, maxPop, pop03, p99Pop, maxShake, shake10, minD3, maxEl, inside, worst: [[frame, pop, x, z]] } }, total: {...} }
//   pop   = how far the camera's offset from her feet moved in ONE frame (m): walking / running changes it by < 0.02, a pop is > 0.3;   shake = the second difference of that offset (m): a lurch back and forth, > 0.1.
//   camInfo-style numbers: minD3 = the closest the camera got to her (m), maxEl = the steepest view below the horizon (deg), inside = frames whose camera was inside a solid (camCheck).
(async () => {
  const rp = window.__rp, S = rp.S, B = __bw, cam = B.camera, T = B.THREE, v = new T.Vector3();
  const R = (name, x, z, yaw, steps, o = {}) => ({ name, x, z, yaw, steps, o });
  const HD = 1.107, routes = [];
  for (let k = 0; k < 8; k++) routes.push(R('town_walk' + k, 35.4, 82.9, k * Math.PI / 4, [[6, 0, 1, 0, false]]));
  routes.push(R('wall_into', -150.0, 2.8, -1.5708, [[5, 0, 1, 0, false]]));                                             // walks INTO the wall from 5 m away and stands pressed against it
  routes.push(R('wall_along', -153.0, 30, -1.5708, [[2, 0, 1, 0, false], [6, 0, 1, 0.7, false]]));                      // arrives at the wall, then the camera turns while she keeps pushing
  routes.push(R('wall_back', -154.9, 2.8, 1.676, [[5, 0, -1, 0, false]]));                                              // back-pedals towards the wall behind her
  routes.push(R('wall_sweep', -154.9, 2.8, 1.676, [[1, 0, 0, 0, false], [6.5, 0, 0, 1.0, false]]));                      // stands 1.6 m from the wall, the camera turns a full circle round her
  routes.push(R('house_sweep', 35.4, 82.9, 2.71, [[1, 0, 0, 0, false], [6.5, 0, 0, 1.0, false]]));                       // by a house in the town
  routes.push(R('house_circle', 35.4, 82.9, 2.71, [[9, 0, 1, 0.55, false]]));                                              // walks a circle (the camera turns with her)
  routes.push(R('bridge_cross', 145.1, 75.36, HD, [[8, 0, 1, 0, false]]));
  routes.push(R('bridge_run', 140.0, 73.0, HD, [[7, 0, 1, 0, true]]));
  routes.push(R('gate_walk', 46.3, 24.7, HD, [[6, 0, 1, 0, false]]));
  routes.push(R('square_run', 40.95, 21.98, -2.17, [[8, 0, 1, 0.25, true]]));
  routes.push(R('river_swim', 142.2, 88.0, HD, [[4, 0, 1, 0, false]], { water: true }));
  routes.push(R('under_swim', 146.78, 70.15, 2.678, [[5, 0, 1, 0, false]], { water: true }));
  const out = {}, tot = { frames: 0, pop03: 0, shake10: 0, rev: 0, inside: 0 };
  S.cool = 99; const sheet0 = S.sheetOn; S.sheetOn = false;   // (a sheet open = no input)
  for (const r of routes) {
    rp.setPos(r.x, r.z, r.yaw); if (r.o.water) { S.y = __bw.world.fastHeight(r.x, r.z); S.sw = 0; S.grounded = true; } S.sheetOn = false; rp.sprint(false); rp.setInput(0, 0); rp.sim(r.o.water ? 3 : 1.2, 1 / 60); rp.setLook(r.yaw, S.pitch);
    const x0 = S.x, z0 = S.z; let dPrev = null, rev = 0, prev = null, prev2 = null, f = 0, yawPrev = null, yawCuts = 0, skip = 0; const pops = [], shk = [], worst = []; let maxAt = null, maxPen = 0, minD3 = 99, maxEl = -99, inside = 0, maxPop = 0, maxShake = 0, pop03 = 0, shake10 = 0;
    for (const [sec, ix, iy, yawRate, spr] of r.steps) {
      rp.sprint(spr); rp.setInput(ix, iy);
      for (let i = 0; i < Math.round(sec * 60); i++) {
        if (yawRate) S.camYaw += yawRate / 60; const yb = S.camYaw; rp.sim(1 / 60, 1 / 60); f++; if (Math.abs(((S.camYaw - yb - (yawRate ? 0 : 0) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) > 0.2 && !yawRate) { yawCuts++; skip = 3; prev = prev2 = null; }
        const o = [cam.position.x - S.x, cam.position.y - S.y, cam.position.z - S.z];
        if (prev) { const pop = Math.hypot(o[0] - prev[0], o[1] - prev[1], o[2] - prev[2]); pops.push(pop); if (pop > maxPop) { maxPop = pop; maxAt = [f, +S.x.toFixed(2), +S.z.toFixed(2), +S.camYaw.toFixed(2)]; } if (pop > 0.3) pop03++; if (pop > 0.3 && worst.length < 5) worst.push([f, +pop.toFixed(2), +S.x.toFixed(1), +S.z.toFixed(1)]); }
        if (prev && prev2) { const sh = Math.hypot(o[0] - 2 * prev[0] + prev2[0], o[1] - 2 * prev[1] + prev2[1], o[2] - 2 * prev[2] + prev2[2]); shk.push(sh); if (sh > maxShake) maxShake = sh; if (sh > 0.1) shake10++; }
        if (prev) { const dd = [o[0] - prev[0], o[1] - prev[1], o[2] - prev[2]]; if (dPrev) { const a = Math.hypot(dd[0], dd[1], dd[2]), b = Math.hypot(dPrev[0], dPrev[1], dPrev[2]); if (a > 0.04 && b > 0.04 && (dd[0] * dPrev[0] + dd[1] * dPrev[1] + dd[2] * dPrev[2]) < -0.5 * a * b) rev++; } dPrev = dd; } else dPrev = null;
        prev2 = prev; prev = o;
        const d3 = cam.position.distanceTo(S.pivot); if (d3 < minD3) minD3 = d3; cam.getWorldDirection(v); const el = Math.asin(-v.y) * 57.29578; if (el > maxEl) maxEl = el;
        if (rp.camPen() > 0.05) inside++; if (rp.camPen() > maxPen) maxPen = rp.camPen();
      }
    }
    rp.setInput(0, 0); rp.sprint(false);
    pops.sort((a, b) => a - b);
    out[r.name] = { frames: f, maxPop: +maxPop.toFixed(3), pop03, p99Pop: +pops[Math.floor(pops.length * 0.99)].toFixed(3), maxShake: +maxShake.toFixed(3), shake10, minD3: +minD3.toFixed(2), maxEl: +maxEl.toFixed(0), inside, maxPen: +maxPen.toFixed(2), yawCuts, rev, maxAt, moved: +Math.hypot(S.x - x0, S.z - z0).toFixed(1), worst };
    tot.frames += f; tot.pop03 += pop03; tot.shake10 += shake10; tot.inside += inside; tot.rev += rev;
  }
  S.sheetOn = sheet0; rp.pause(false);
  return JSON.stringify({ routes: out, total: tot });
})()
