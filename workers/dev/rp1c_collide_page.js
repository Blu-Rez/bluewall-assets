// rp1c_collide_page.js — RP1C-R3 (ROUND4 A1 item 1): the collision test.  Evaluated INSIDE the real game page (hero already started: __rp = hero.dev).  It returns at once; the job runs in chunks and
// leaves its answer in window.__ct (poll window.__ct.done / window.__ct.out).   in the page: __ctStart({ grid: true|false, max: 0, only: 'doors'|'boxes'|'discs'|'grid'|null, modes: [...], dt: 1/30 })
//
// The hero is put 4 m from a solid and pushed at it (stick forward, camera on the heading) at 8 approach angles and three speeds (walk 0.5 stick, run 1.0 stick, dodge: run + a roll 3.2 m before the solid), 3 s of approach
// + 1.5 s of pushing, physics only (dev.phys, 30 fps; the dodge also at 20 fps = the longest frame the game allows).  The targets:
//   doors  — every enterable building (the 97 door items), approached over its real facade point from the 8 angles of the half-plane in front of the door;
//   boxes  — every wall / tower / gate / ballista box of the castle (the game's own boxes), 8 angles around each, aimed at its centre;
//   discs  — every disc collider that is left (trees, posts, the fountain), 8 angles;
//   grid   — 160 points spread over the map where the VISIBLE body band has a surface (a wall of a house, a hall, a tent, a fence, a timber bar), 8 angles in the half-plane in front of the surface.
// Ground truth for «inside»: a cell of the body-band grid (the visible geometry, 25 cm) OR a game box (its real extent: a wall's stone is 0.72 of the box depth) OR a game disc that is still a collider.
//   (a) frames with the hero CENTRE inside a solid       (b) STUCK: she stands (< 0.1 m in 0.5 s) while the stick pushes AND the push is > 17° off head-on to the surface (a slide was possible)
//   (c) PASS-THROUGH: a step that crosses a solid (both end points outside)  + «unstuck» teleports (the stuck-proof had to rescue her)
//   doors: «opened» = the door opened (dev hook S.doorHook) while she walked at it;  «blocked» = she reached 1.6 m from the door's face and nothing happened.
(() => {
  const rp = window.__rp, S = rp.S, R = rp.rbody, T = { done: false, out: null, prog: 0, total: 0 };
  window.__ct = T;
  const D2R = Math.PI / 180;
  const boxSdf = (lx, lz, hw, hd) => { const qx = Math.abs(lx) - hw, qz = Math.abs(lz) - hd; return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0); };
  let SOL = [], GR = null;
  const grid = () => rp.grid();
  function solids() {                                                                                     // the game's colliders as they are NOW (the grid mode drops the ghost ones)
    const L = [];
    for (const b of S.boxes) L.push({ k: 'box:' + b.type, soft: !!b.soft, ramp: b.type === 'ramp', x: b.x, z: b.z, hw: b.hw, hd: b.type === 'wall' ? b.hd * 0.72 : b.hd, ux: b.ux, uz: b.uz, vx: b.vx, vz: b.vz, id: b.id || b.type, y0: b.y0 });   // RP1C_R5: y0 = a bridge parapet's deck
    for (const d of S.discs) L.push({ k: 'disc', disc: true, x: d[0], z: d[1], r: d[2], id: 'disc' });
    return L;
  }
  const info = (o, x, z) => {
    if (o.disc) { const dx = x - o.x, dz = z - o.z, d = Math.hypot(dx, dz) || 1e-6; return { d: d - o.r, nx: dx / d, nz: dz / d }; }
    const dx = x - o.x, dz = z - o.z, lx = dx * o.ux + dz * o.uz, lz = dx * o.vx + dz * o.vz, d = boxSdf(lx, lz, o.hw, o.hd);
    const qx = Math.abs(lx) - o.hw, qz = Math.abs(lz) - o.hd; let nx, nz;
    if (qx > 0 || qz > 0) { nx = qx > 0 ? Math.sign(lx) * qx : 0; nz = qz > 0 ? Math.sign(lz) * qz : 0; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; } else if (qx > qz) { nx = Math.sign(lx) || 1; nz = 0; } else { nx = 0; nz = Math.sign(lz) || 1; }
    return { d, nx: nx * o.ux + nz * o.vx, nz: nx * o.uz + nz * o.vz };
  };
  const gInside = (x, z) => GR && GR.st.ready && (GR.solidAll || GR.solid)(x, z)   // CL1: both layers (the instance layer = trunks, rocks, props);
  const under = (o) => o.y0 !== undefined && !!S.rIn;                          // RP1C_R5: the rule of rpg.js pushOut — a bridge parapet is not a wall for a body IN the water BELOW its deck (swimming / wading under the bridge), nor while she is still inside its strip after the water ended (S.rIn)
  const inside = (x, z) => {                                                                              // -> the name of a solid the point is inside, or null
    if (gInside(x, z)) return 'grid';
    for (const o of SOL) { if (o.soft || under(o)) continue; const dx = x - o.x, dz = z - o.z, rr = (o.disc ? o.r : Math.hypot(o.hw, o.hd)) + 0.5; if (dx * dx + dz * dz > rr * rr) continue; if (info(o, x, z).d < -0.02) return o.k; }
    return null;
  };
  const crosses = (x0, z0, x1, z1) => {                                                                   // both ends outside, something solid between
    const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.05)); for (let i = 1; i < n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; const q = inside(x, z); if (q) return q; } return null;
  };
  // the nearest surface (the game's colliders AND the grid): distance to the surface and its outward normal
  const nearest = (x, z) => {
    let best = null;
    for (const o of SOL) { if (o.soft || under(o)) continue; const dx = x - o.x, dz = z - o.z, rr = (o.disc ? o.r : Math.hypot(o.hw, o.hd)) + 3; if (dx * dx + dz * dz > rr * rr) continue; const q = info(o, x, z); if (!best || q.d < best.d) { best = q; best.k = o.k; best.id = o.id; } }
    if (GR && GR.st.ready) { const d0 = GR.d(x, z) - GR.HALF; if (d0 < 3 && (!best || d0 < best.d)) { const e = 0.12, gx = GR.d(x + e, z) - GR.d(x - e, z), gz = GR.d(x, z + e) - GR.d(x, z - e), l = Math.hypot(gx, gz) || 1; best = { d: d0, nx: gx / l, nz: gz / l, k: 'grid', id: 'grid' }; } }
    return best;
  };

  function run(x, z, hd, mode, dt, tgt, opt = {}) {
    rp.setPos(x, z, hd); rp.setLook(hd, 0.2); S.cool = 99; S.sw = 0; S.inp.x = 0; S.inp.y = mode === 'walk' ? 0.5 : 1; S.sprint = false; S.st = 'loco'; S.vx = S.vz = 0; S.reqDodge = false; S.dodgeCool = 0; S.layer = 0; S.top = S.climb = null;
    S.camYaw = hd; S.dCool = 0; S.dHold = 0; const un0 = S.unFix || 0;
    const r = { inside: {}, cross: {}, stuck: 0, jitter: 0, steps: 0, minD: 1e9, slide: 0, un: 0, layerChanged: false, opened: 0, dodged: false, reach: 1e9 };
    S.doorHook = (it) => { r.opened++; }; S.sheetOn = false;                                                       // (never the real sheet: it freezes the hero)
    const speedT = mode === 'walk' ? 1.32 : mode === 'run' ? 4.9 : 6.5, Tmax = 7 / Math.max(1.2, speedT * 0.8) + 1.6 + 1.2, N = Math.ceil(Tmax / dt);
    const hist = [], steps = []; let px = S.x, pz = S.z, lastStuckT = -9, lastJitT = -9;
    for (let i = 0; i < N; i++) {
      if (mode === 'dodge' && !r.dodged && opt.aim) { const q = Math.hypot(opt.aim[0] - S.x, opt.aim[1] - S.z); if (q < 3.2 + (opt.aimR || 0)) { rp.dodge(); r.dodged = true; } }
      S.inp.x = 0; S.inp.y = mode === 'walk' ? 0.5 : 1; S.camYaw = hd; S.cool = 99;
      rp.phys(dt, dt); r.steps++;
      if (S.layer !== 0 || S.where !== 'home') { r.layerChanged = true; break; }
      const x1 = S.x, z1 = S.z, q = inside(x1, z1);
      if (q) { r.inside[q] = (r.inside[q] || 0) + 1; r.who = r.who || {}; r.who[q] = 1; }
      else { const c = crosses(px, pz, x1, z1); if (c) { r.cross[c] = (r.cross[c] || 0) + 1; } }
      if (opt.door && opt.aim) { const dd = Math.hypot(opt.aim[0] - x1, opt.aim[1] - z1); if (dd < r.reach) r.reach = dd; }
      const nb = nearest(x1, z1); if (nb && nb.d < r.minD) r.minD = nb.d;
      if (opt.trace) opt.trace.push([+(i * dt).toFixed(2), +x1.toFixed(2), +z1.toFixed(2), +S.y.toFixed(2)]);
      hist.push([x1, z1]); steps.push(Math.hypot(x1 - px, z1 - pz)); const k = Math.round(0.5 / dt);
      if (hist.length > k) {
        const [hx, hz] = hist[hist.length - 1 - k], moved = Math.hypot(x1 - hx, z1 - hz); let path = 0; for (let q = steps.length - k; q < steps.length; q++) path += steps[q];
        if (nb && nb.d < R + 0.12 && i * dt > 0.5 && path > 0.3 && moved < 0.1 && i * dt - lastJitT > 0.5) { r.jitter++; lastJitT = i * dt; r.jitAt = [+x1.toFixed(1), +z1.toFixed(1), nb.k]; }
        if (nb && nb.d < R + 0.12 && i * dt > 0.5) {
          const hxv = Math.sin(hd), hzv = Math.cos(hd), dn = hxv * nb.nx + hzv * nb.nz, tan = Math.sqrt(Math.max(0, 1 - dn * dn));
          if (dn < 0 && tan > 0.3 && tan * (mode === 'walk' ? 0.66 : 4.9) * 0.5 > 0.22) {
            r.slide++;
            if (moved < 0.1 && i * dt - lastStuckT > 0.5) {
              lastStuckT = i * dt; const tx = -nb.nz, tz = nb.nx, sg = (hxv * tx + hzv * tz) >= 0 ? 1 : -1;                            // the slide direction: is the spot 0.25 m along it free?  if not it is a corner trap (concave), not a stuck-while-sliding
              const fx = x1 + tx * sg * 0.25, fz = z1 + tz * sg * 0.25;
              const nbs = nearest(fx, fz); if (rp.free(fx, fz) && (!nbs || nbs.d > R + 0.06) && rp.W().ground(fx, fz) - S.y <= 0.85 * 0.25 + 0.06) { r.stuck++; r.stuckAt = [+x1.toFixed(1), +z1.toFixed(1), nb.k, nb.id, Math.round(Math.atan2(nb.nx, nb.nz) / D2R)]; } else { r.trap = (r.trap || 0) + 1; r.trapAt = [+x1.toFixed(1), +z1.toFixed(1), nb.k, nb.id]; }
            }
          }
        }
        if (opt.door && r.opened) break;
      }
      px = x1; pz = z1;
    }
    r.un = (S.unFix || 0) - un0; S.doorHook = null; return r;
  }
  const add = (agg, key, r) => {
    const a = (agg[key] = agg[key] || { runs: 0, a: 0, b: 0, c: 0, un: 0, opened: 0, slideRuns: 0, runsWithA: 0, traps: 0, jit: 0 });
    a.runs++; const ia = Object.values(r.inside).reduce((s, v) => s + v, 0), ic = Object.values(r.cross).reduce((s, v) => s + v, 0);
    a.a += ia; a.b += r.stuck; a.c += ic; a.un += r.un; a.jit += r.jitter; a.opened += r.opened ? 1 : 0; a.traps += r.trap ? 1 : 0; if (r.slide) a.slideRuns++; if (ia) a.runsWithA++;
    return ia + r.stuck + ic + r.un + r.jitter;
  };

  // ---- the jobs
  const jobs = [];
  function boundarySamples(n) {                                                                           // n points where the body band has a surface: (x, z, outward normal), spread over the map, deterministic
    const out = [], g = grid(); if (!g || !g.st.ready) return out; let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    let tries = 0; while (out.length < n && tries++ < 40000) {
      const x = (rnd() * 2 - 1) * 330, z = (rnd() * 2 - 1) * 330; if (!g.solid(x, z)) continue;
      for (let a = 0; a < 6.28; a += 0.5) { const nx = Math.cos(a), nz = Math.sin(a), x1 = x + nx * 0.5, z1 = z + nz * 0.5; if (!g.solid(x1, z1) && g.d(x1 + nx, z1 + nz) > 0.8 && g.d(x1 + nx * 3, z1 + nz * 3) > 2.5) {   // an open side with room in front
        let ok = true; for (const o of out) if (Math.hypot(o[0] - x, o[1] - z) < 6) { ok = false; break; } if (ok) out.push([x, z, nx, nz]); break; } }
    }
    return out;
  }
  function plan(opt) {
    SOL = solids(); GR = grid(); const modes = opt.modes || ['walk', 'run', 'dodge'], dt = opt.dt || 1 / 30, only = opt.only || null, lim = opt.max || 0;
    const front = []; for (let k = 0; k < 8; k++) front.push((-78.75 + k * 22.5) * D2R);
    if (only === 'doors' || !only) for (const it of rp.doors().items()) for (let k = 0; k < 8; k++) for (const m of modes) jobs.push({ cat: 'door', it, ang: front[k], m, dt, type: 'door' });
    if (only === 'boxes' || !only) for (const o of SOL.filter((q) => !q.disc && !q.ramp && /wall|tower|gate|ballista/.test(q.k))) for (let k = 0; k < 8; k++) for (const m of modes) jobs.push({ cat: o.k, o, ang: k * 45 * D2R, m, dt, type: 'solid' });
    if (only === 'discs' || !only) SOL.filter((q) => q.disc).forEach((o, ix) => { for (let k = 0; k < 8; k++) for (const m of modes) { if (m !== 'run' && ix % 3) continue; jobs.push({ cat: 'disc', o, ang: (k * 45 + 11) * D2R, m, dt, type: 'solid' }); } });
    if (only === 'grid' || !only) boundarySamples(opt.nGrid || 160).forEach((p, ix) => { for (let k = 0; k < 8; k++) for (const m of modes) jobs.push({ cat: 'grid', p, ang: front[k], m, dt, type: 'grid' }); });
    if (opt.dodge20 !== false && (only === 'doors' || only === 'grid' || !only)) { const extra = []; for (const j of jobs) if (j.m === 'dodge' && (j.type === 'door' || j.type === 'grid') && (jobs.indexOf(j) % 8) === 0) extra.push({ ...j, dt: 0.05, cat: j.cat + '@20fps' }); jobs.push(...extra); }
    if (lim) { const keep = [], per = {}; for (const j of jobs) { per[j.cat] = (per[j.cat] || 0) + 1; if (per[j.cat] <= lim) keep.push(j); } jobs.length = 0; jobs.push(...keep); }
  }
  function startPoint(j) {                                                                                // a free start 4 m (then 3, 2.2) in front of the solid, aimed at it; null when none is free
    if (j.type === 'door' || j.type === 'grid') {
      let fx, fz, nx, nz;
      if (j.type === 'door') { const it = j.it; fx = it.fx; fz = it.fz; const l = Math.hypot(it.gx - it.fx, it.gz - it.fz) || 1; nx = (it.gx - it.fx) / l; nz = (it.gz - it.fz) / l; } else { [fx, fz, nx, nz] = [j.p[0], j.p[1], j.p[2], j.p[3]]; }
      const ca = Math.cos(j.ang), sa = Math.sin(j.ang), dx = nx * ca - nz * sa, dz = nx * sa + nz * ca;
      for (const d of [4, 3, 2.2]) { const x = fx + dx * d, z = fz + dz * d; if (rp.free(x, z)) return { x, z, hd: Math.atan2(fx - x, fz - z), aim: [fx, fz], aimR: 0 }; } return null;
    }
    const o = j.o, ca = Math.cos(j.ang), sa = Math.sin(j.ang); let ex, ez;
    if (o.disc) { ex = ca; ez = sa; } else { ex = ca * o.ux + sa * o.vx; ez = ca * o.uz + sa * o.vz; }
    let t = 0; for (; t < 150; t += 0.25) { if (info(o, o.x + ex * t, o.z + ez * t).d > 0) break; }
    for (const d of [4, 3, 2.2]) { const x = o.x + ex * (t + d), z = o.z + ez * (t + d); if (rp.free(x, z)) return { x, z, hd: Math.atan2(-ex, -ez), aim: [o.x, o.z], aimR: t }; }
    return null;
  }
  async function go(opt) {
    const t0 = performance.now(), agg = {}, bad = [], traps = [], skipped = {}, raf0 = window.requestAnimationFrame, held = [];
    window.requestAnimationFrame = (cb) => { held.push(cb); return held.length; };                         // (the render loop is held: the test needs the CPU)
    try {
      { const x = document.querySelector('.bsh.on .bsh-x'); if (x) x.click(); } rp.useGrid(opt.grid !== false); rp.pause(true); S.cool = 99; plan(opt); T.total = jobs.length; let tc = performance.now();
      for (let i = 0; i < jobs.length; i++) {
        const j = jobs[i], sp = startPoint(j); T.prog = i;
        if (!sp) { skipped[j.cat] = (skipped[j.cat] || 0) + 1; continue; }
        const r = run(sp.x, sp.z, sp.hd, j.m, j.dt, j.o, { door: j.type === 'door', aim: sp.aim, aimR: sp.aimR });
        const w = add(agg, j.cat + '/' + j.m, r); add(agg, j.cat + '/all', r); add(agg, 'TOTAL', r); if (j.dt > 0.04) add(agg, 'TOTAL@20fps', r);
        let nb = 0; if (j.type === 'door' && Math.abs(j.ang / D2R) < 34) { const a = agg['door/all']; a.aimed = (a.aimed || 0) + 1; { const k = j.m === 'dodge' ? 'D' : 'W'; a['aimed' + k] = (a['aimed' + k] || 0) + 1; if (r.opened) a['opened' + k] = (a['opened' + k] || 0) + 1; }   /* MOTHER (RP4_R3 merge): walk + run (W) and dodge (D) counted apart: the thrown roll is 2.9 m, so a roll into a door ends AT the wall (in the roll state, which never opens a door) and she slides off an oblique wall before the 0.2 s hold */ if (r.opened) a.aimedOpened = (a.aimedOpened || 0) + 1; else if (r.reach < 1.9) { a.blocked = (a.blocked || 0) + 1; nb = 1; } else a.farther = (a.farther || 0) + 1; }
        if (r.trap && !(w > 0 || nb)) traps.push({ cat: j.cat, id: j.it ? j.it.id : j.o ? j.o.id : j.p.map((v) => +v.toFixed(0)), ang: Math.round(j.ang / D2R), m: j.m, trap: r.trap, at: r.trapAt });
        if (w > 0 || nb) bad.push({ trap: r.trap, trapAt: r.trapAt, cat: j.cat, id: j.it ? j.it.id : j.o ? j.o.id : j.p.map((v) => +v.toFixed(0)), ang: Math.round(j.ang / D2R), m: j.m, dt: +j.dt.toFixed(3), a: r.inside, c: r.cross, b: r.stuck, jit: r.jitter, jitAt: r.jitAt, un: r.un, opened: r.opened, reach: +r.reach.toFixed(2), at: r.stuckAt, from: [+sp.x.toFixed(2), +sp.z.toFixed(2), +sp.hd.toFixed(3)] });
        if (performance.now() - tc > 1500) { await new Promise((q) => setTimeout(q, 0)); tc = performance.now(); }
      }
      T.out = { opt, jobs: jobs.length, ms: Math.round(performance.now() - t0), skipped, agg, badN: bad.length, bad: bad.slice(0, 400), trapN: traps.length, traps: traps.slice(0, 60), nb: { boxes: S.boxes.length, discs: S.discs.length } };
    } catch (e) { T.out = { err: String(e && e.stack || e).slice(0, 600) }; }
    window.requestAnimationFrame = raf0; for (const cb of held) raf0(cb); S.paused = true; T.done = true;
  }
  T.trace = (x, z, hd, m, dt) => { SOL = solids(); GR = grid(); const tr = []; const raf0 = window.requestAnimationFrame; rp.pause(true); const r = run(x, z, hd, m, dt || 1 / 30, null, { trace: tr }); return { r, tr }; };
  window.__ctStart = (opt = {}) => { jobs.length = 0; T.done = false; T.out = null; T.prog = 0; go(opt); return 'started'; };
  return 'ok';
})()
