// rp1c2_cpu.js — RP1C-R2 Job 1b: JS CPU per drawn frame, measured with performance.now() around "update" (hero.frame + world.update, the same order/cadence as main.js's loop) and "render" (renderer.render),
//   on a 60 fps FAKE clock (the periodic jobs of the hero — diet pass, cull refill, matrix scan — run at their real per-frame rate whatever the speed of the test rig), N frames, she walks.
//   The GPU is drained OUTSIDE the timed parts (gl.finish) so a slow software GL never stalls the timed submission.   window.__VIEW 'gate'|'fields'|'mill', __N, __MODE 'new'|'old' (old = the Job 1b levers off: matrix savings, life radius, town cells, castle LOD hook)
(async () => {
  const rp = __rp, S = rp.S, B = __bw, W = B.world, sc = B.scene, cam = B.camera, r = B.renderer, gl = r.getContext(), R = rp.knobs(), cull = rp.cull(), diet = rp.diet();
  const N = window.__N || 120, mode = window.__MODE || 'new', v = window.__VIEW || 'gate', wait = (ms) => new Promise((x) => setTimeout(x, ms));
  const views = { gate: [40.95, 21.98, -2.17], fields: [211, 22, 1.57] };
  rp.pause(false); S.cool = 99; if (views[v]) rp.setPos(views[v][0], views[v][1], views[v][2]); else rp.goNear('ws:mill_wind2', 4);
  await wait(1500);
  const apply = (m) => { if (m === 'old') { cull.setMtx(false); cull.setTown(false); R.life = 0; R.lod = 0; } else { cull.setMtx(true); cull.setTown(true); diet.apply(diet.st.lvl); } };
  apply(mode); await wait(1500); rp.fakeClock(true);
  const rec = { u: [], r: [], h: [], w: [] }; let t = 0, hdt = 0, calls = 0, tris = 0, frames = 0;
  rp.setLook(S.camYaw, S.pitch); rp.setInput(0, 0.6);
  const warm = 20;
  for (let f = 0; f < N + warm; f++) {
    const dt = 1 / 60; t += dt; hdt += dt;
    const t0 = performance.now();
    sc.matrixWorldAutoUpdate = mode === 'old' ? true : !(R.upd > 1 && f % R.upd !== 0);
    let tw = 0; if (R.upd < 2 || f % R.upd === 0) { const a = performance.now(); W.update(t, Math.min(hdt, 0.1), cam); hdt = 0; tw = performance.now() - a; }
    const b = performance.now(); rp.frame(performance.now(), dt); const th = performance.now() - b;
    if (r.shadowMap.enabled) { r.shadowMap.autoUpdate = false; if (f % (3 + R.sh) === 0) r.shadowMap.needsUpdate = true; }
    const t1 = performance.now(); r.info.reset(); r.render(sc, cam); const t2 = performance.now();
    if (f >= warm) { rec.u.push(t1 - t0); rec.r.push(t2 - t1); rec.h.push(th); rec.w.push(tw); calls += r.info.render.calls; tris += r.info.render.triangles; frames++; }
    gl.finish();
  }
  rp.fakeClock(false); rp.setInput(0, 0);
  const st = (a) => { const s = a.slice().sort((x, y) => x - y); const m = a.reduce((x, y) => x + y, 0) / a.length; return { mean: +m.toFixed(2), med: +s[s.length >> 1].toFixed(2), p95: +s[Math.floor(s.length * 0.95)].toFixed(2) }; };
  const tot = rec.u.map((x, i) => x + rec.r[i]);
  return JSON.stringify({ view: v, mode, frames, update: st(rec.u), hero: st(rec.h), world: st(rec.w), render: st(rec.r), total: st(tot), calls: Math.round(calls / frames), tris: Math.round(tris / frames), progs: r.info.programs.length, px: r.getPixelRatio(), shadows: r.shadowMap.enabled, mx: cull.info().mx, cells: cull.info().cells, lvl: diet.st.lvl, pos: [+S.x.toFixed(1), +S.z.toFixed(1)] });
})()
