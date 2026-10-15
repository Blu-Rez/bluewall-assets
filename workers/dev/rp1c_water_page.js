// rp1c_water_page.js — RP1C-R3 (ROUND4 A1 item 1 water edge + item 6 swim): evaluated INSIDE the game page (hero started).   window.__wtStart({n: 48, grid: true}) -> window.__wt.out when window.__wt.done
// ENTRY: start 5 m inland of a shore point (deep water 4+ m beyond it), heading at the water, walk and run, 8 s.  Counts: reached the swim state / stuck windows (stands < 0.1 m in 0.5 s while pushing) / unstick teleports / the
//        deepest she got / the speed in water / «walked on the bed» = frames with the water over her chest (> 1.0 m) and sw != 2.
// EXIT : start in deep water 6 m from a shore (heading at the land), 10 s.  Counts: she is out (sw 0, grounded, dry) / un teleports / a single-frame height jump > 0.5 m (a teleport onto the bank).
(() => {
  const rp = window.__rp, S = rp.S, T = { done: false, out: null, prog: 0, total: 0 }; window.__wt = T;
  const WS = -0.75, W = () => rp.W(), gnd = (x, z) => W().ground(x, z), depth = (x, z) => Math.max(0, WS - gnd(x, z));
  const R = rp.rbody;
  function shorePoints(n) {
    const out = []; let seed = 777; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296; let tries = 0;
    while (out.length < n && tries++ < 60000) {
      const x = (rnd() * 2 - 1) * 330, z = (rnd() * 2 - 1) * 330; if (!W().wet(x, z)) continue;                        // a deep spot
      const a = rnd() * 6.2832, dx = Math.cos(a), dz = Math.sin(a); let t = 0; for (; t < 30; t += 0.25) if (gnd(x + dx * t, z + dz * t) > -0.05) break; if (t >= 30) continue;     // the dry side
      let t0 = t; while (t0 > 0 && depth(x + dx * t0, z + dz * t0) > 0.05) t0 -= 0.25;                                   // the water line
      const sx = x + dx * t0, sz = z + dz * t0; let deep = true; for (let q = 1; q <= 4; q += 1) if (!W().wet(sx - dx * (q + 1.5), sz - dz * (q + 1.5))) deep = false; if (!deep) continue;      // deep water 2.5–5.5 m beyond the line
      const ix = sx + dx * 5, iz = sz + dz * 5; if (!rp.free(ix, iz)) continue; let ok = true; for (const o of out) if (Math.hypot(o.sx - sx, o.sz - sz) < 12) { ok = false; break; } if (!ok) continue;
      out.push({ sx, sz, dx, dz, ix, iz });
    }
    return out;
  }
  function reset(x, z, hd) { rp.setPos(x, z, hd); rp.setLook(hd, 0.2); S.cool = 99; S.sw = 0; S.inp.x = 0; S.inp.y = 1; S.sprint = false; S.st = 'loco'; S.vx = S.vz = 0; S.reqDodge = false; S.layer = 0; S.top = S.climb = null; S.camYaw = hd; S.grounded = true; S.dCool = 0; S.dHold = 0; S.doorHook = () => {}; S.sheetOn = false; }
  function run(x, z, hd, mode, dt, secs) {
    reset(x, z, hd); const un0 = S.unFix || 0, r = { stuck: 0, swam: 0, bed: 0, vmaxSwim: 0, depthMax: 0, jump: 0, yMin: 9, outAt: -1, steps: 0, t1: -1, vWade: 0, nWade: 0 }; const hist = [], steps = []; let px = S.x, pz = S.z, py = S.y, lastStuck = -9; const N = Math.ceil(secs / dt);
    for (let i = 0; i < N; i++) {
      S.inp.x = 0; S.inp.y = mode === 'walk' ? 0.5 : 1; S.camYaw = hd; S.cool = 99; rp.phys(dt, dt); r.steps++;
      const d = depth(S.x, S.z), sp = Math.hypot(S.vx, S.vz); if (d > r.depthMax) r.depthMax = d; if (S.y < r.yMin) r.yMin = S.y;
      if (S.sw === 2) { r.swam++; if (sp > r.vmaxSwim) r.vmaxSwim = sp; if (r.t1 < 0) r.t1 = i * dt; } if (S.sw === 1) { r.vWade += sp; r.nWade++; }
      if (d > 1.0 && S.sw !== 2 && S.grounded) r.bed++;                                                       // (walking on the bed: grounded with the water over her chest; a run-in over a steep bank is airborne for a few frames first)
      if (Math.abs(S.y - py) > 0.5) r.jump++;
      hist.push([S.x, S.z]); steps.push(Math.hypot(S.x - px, S.z - pz)); const k = Math.round(0.5 / dt);
      if (hist.length > k && i * dt > 0.8) { const [hx, hz] = hist[hist.length - 1 - k]; let path = 0; for (let q = steps.length - k; q < steps.length; q++) path += steps[q]; if (Math.hypot(S.x - hx, S.z - hz) < 0.1 && i * dt - lastStuck > 0.5) { r.stuck++; lastStuck = i * dt; r.stuckAt = [+S.x.toFixed(1), +S.z.toFixed(1), +S.y.toFixed(2), S.sw, +d.toFixed(2)];
        // what is in front of her?  solid = a visible surface within 1.5 m (head-on push: not a bug), steep = the ground rises > 1.0 per metre (a terrain cliff: needs another way out), free = nothing: a real stuck
        { const fx = Math.sin(hd), fz = Math.cos(hd), g = rp.grid(), sd = g && g.ray ? g.ray(S.x, S.z, fx, fz, 1.5) : -1, sl = gnd(S.x + fx, S.z + fz) - gnd(S.x, S.z); const cls = sd >= 0 || !rp.free(S.x + fx * 0.8, S.z + fz * 0.8) ? 'solid' : sl > 1.0 ? 'steep' : 'free'; r.stuckCls = r.stuckCls || {}; r.stuckCls[cls] = (r.stuckCls[cls] || 0) + 1; } } }
      px = S.x; pz = S.z; py = S.y; if (S.sw === 0 && S.grounded && d < 0.05 && r.swam && r.outAt < 0) r.outAt = i * dt;
    }
    r.un = (S.unFix || 0) - un0; r.end = [+S.x.toFixed(1), +S.z.toFixed(1), +S.y.toFixed(2), S.sw, +depth(S.x, S.z).toFixed(2)]; return r;
  }
  async function go(opt) {
    const t0 = performance.now(), raf0 = window.requestAnimationFrame, held = []; window.requestAnimationFrame = (cb) => { held.push(cb); return held.length; };
    const agg = { enter: { runs: 0, reached: 0, stuck: 0, un: 0, bed: 0, jump: 0 }, exit: { runs: 0, out: 0, stuck: 0, un: 0, jump: 0 } }, bad = []; let vWadeSum = 0, vWadeN = 0, vSwimMax = 0;
    try {
      rp.useGrid(opt.grid !== false); rp.pause(true); const pts = shorePoints(opt.n || 48); T.pts = pts; T.total = pts.length * 4; let i = 0;
      for (const p of pts) for (const m of ['walk', 'run']) {
        T.prog = i++; const hd = Math.atan2(-p.dx, -p.dz);                                                              // from inland towards the water: heading = -(dir to the land)
        const a = run(p.ix, p.iz, hd, m, 1 / 30, 8); agg.enter.runs++; if (a.swam) agg.enter.reached++; agg.enter.stuck += a.stuck; for (const k in (a.stuckCls || {})) agg.enter['stuck_' + k] = (agg.enter['stuck_' + k] || 0) + a.stuckCls[k]; agg.enter.un += a.un; agg.enter.bed += a.bed; agg.enter.jump += a.jump; if (a.nWade) { vWadeSum += a.vWade; vWadeN += a.nWade; } if (a.vmaxSwim > vSwimMax) vSwimMax = a.vmaxSwim;
        if (!a.swam || a.stuck || a.un || a.bed || a.jump) bad.push({ k: 'enter', m, p: [+p.sx.toFixed(1), +p.sz.toFixed(1)], a });
        const bx = p.sx - p.dx * 6, bz = p.sz - p.dz * 6; if (!W().wet(bx, bz)) { T.prog = i++; continue; }
        const e = run(bx, bz, Math.atan2(p.dx, p.dz), m, 1 / 30, 12); agg.exit.runs++; if (e.outAt >= 0 || (e.end[3] === 0 && e.end[4] < 0.05)) agg.exit.out++; agg.exit.stuck += e.stuck; for (const k in (e.stuckCls || {})) agg.exit['stuck_' + k] = (agg.exit['stuck_' + k] || 0) + e.stuckCls[k]; agg.exit.un += e.un; agg.exit.jump += e.jump;
        if (!(e.end[3] === 0 && e.end[4] < 0.05) || e.stuck || e.un || e.jump) bad.push({ k: 'exit', m, p: [+p.sx.toFixed(1), +p.sz.toFixed(1)], a: e });
        T.prog = i++; if (i % 6 === 0) await new Promise((q) => setTimeout(q, 0));
      }
      T.out = { n: pts.length, ms: Math.round(performance.now() - t0), agg, vWade: vWadeN ? +(vWadeSum / vWadeN).toFixed(2) : 0, vSwimMax: +vSwimMax.toFixed(2), bad: bad.slice(0, 60), badN: bad.length };
    } catch (e) { T.out = { err: String(e && e.stack || e).slice(0, 600) }; }
    window.requestAnimationFrame = raf0; for (const cb of held) raf0(cb); S.paused = true; T.done = true;
  }
  window.__wtStart = (opt = {}) => { T.done = false; T.out = null; T.prog = 0; go(opt); return 'started'; };
  return 'ok';
})()
