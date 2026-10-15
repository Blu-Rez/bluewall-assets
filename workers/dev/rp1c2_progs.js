// rp1c2_progs.js — RP1C-R2 Job 1b (b): renderer.info.programs must not grow while she walks.  60 s of game time on a 60 fps fake clock (walk, in a slow circle through the town), then 15 s of sprint along the
//   street, then every governor step 0..max (one drawn frame each): the program count is printed before / after each part.   window.__WALK (s, default 60), __SPR (s, default 15)
(async () => {
  const rp = __rp, S = rp.S, B = __bw, W = B.world, sc = B.scene, cam = B.camera, r = B.renderer, gl = r.getContext(), R = rp.knobs(), diet = rp.diet(), cull = rp.cull();
  const WALK = window.__WALK || 60, SPR = window.__SPR || 15, wait = (ms) => new Promise((x) => setTimeout(x, ms)), out = { parts: [] };
  rp.pause(false); S.cool = 99; rp.setPos(40.95, 21.98, -2.17); await wait(1000); rp.fakeClock(true);
  let t = 0, hdt = 0, f = 0;
  const progs = () => r.info.programs.length, names = () => r.info.programs.map((p) => p.name + ':' + p.cacheKey.length).join('|');
  const one = (drawEvery) => {   // one 1/60 s tick; draws when asked
    const dt = 1 / 60; t += dt; hdt += dt; f++;
    sc.matrixWorldAutoUpdate = !(R.upd > 1 && f % R.upd !== 0);
    if (R.upd < 2 || f % R.upd === 0) { W.update(t, Math.min(hdt, 0.1), cam); hdt = 0; }
    rp.frame(performance.now(), dt);
    if (r.shadowMap.enabled) { r.shadowMap.autoUpdate = false; if (f % (3 + R.sh) === 0) r.shadowMap.needsUpdate = true; }
    if (drawEvery) { r.render(sc, cam); gl.finish(); }
  };
  const part = async (name, sec, sprint, every) => {
    const p0 = progs(), x0 = S.x, z0 = S.z; rp.sprint(sprint); rp.setInput(0, 1); let yaw = S.camYaw; let dist = 0, lx = S.x, lz = S.z;
    for (let i = 0, n = Math.round(sec * 60); i < n; i++) { if (i % 30 === 0) { yaw += (sprint ? 0.02 : 0.08); rp.setLook(yaw, 0.25); } one(i % every === 0); dist += Math.hypot(S.x - lx, S.z - lz); lx = S.x; lz = S.z; }
    rp.setInput(0, 0); rp.sprint(false);
    out.parts.push({ part: name, sec, metres: +dist.toFixed(0), programsBefore: p0, programsAfter: progs(), grew: progs() - p0, draws: Math.ceil(sec * 60 / every), at: [+S.x.toFixed(0), +S.z.toFixed(0)] });
  };
  one(true); out.start = { programs: progs(), level: diet.st.lvl, label: diet.info().label, shadows: r.shadowMap.enabled, px: r.getPixelRatio() };
  await part('walk', WALK, false, 30);
  await part('sprint', SPR, true, 15);
  const steps = []; for (let l = 0; l < diet.STEPS.length; l++) { const p0 = progs(); diet.apply(l); { const f0 = r.info.render.frame, t0 = performance.now(); while (r.info.render.frame < f0 + 2 && performance.now() - t0 < 90000) await wait(300); } one(true); one(true); steps.push({ lvl: l, label: diet.STEPS[l].label, px: r.getPixelRatio(), programs: progs(), grew: progs() - p0 }); }
  out.steps = steps; diet.apply(diet.START); rp.fakeClock(false);
  out.end = { programs: progs() };
  return JSON.stringify(out);
})()
