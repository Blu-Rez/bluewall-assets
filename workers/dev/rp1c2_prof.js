// rp1c2_prof.js — RP1C-R2 Job 1b: JS CPU ms per drawn frame by subsystem, measured in the game's REAL loop with the game's own PROF probes (performance.now() around every part), the hero's periodic jobs on a 60 fps fake clock
//   (the rig draws one frame per 2-8 s, so the periodic jobs of a real 60 fps run would be over-counted ~100x with the rig's clock).   window.__VIEW 'gate'|'fields'|'mill', __NF frames to average (EMA of 10), __MODE 'new'|'old'
//   old = the Job 1b levers off: no matrix savings (cull.setMtx(false)), no life radius, no town cells, the castle's own LOD radius.   Output: ms per frame: render (renderer.render), update (everything else the loop does), hero (hero.frame), calls, tris, programs.
(async () => {
  const rp = __rp, S = rp.S, B = __bw, PROF = window.__bwProf, wait = (ms) => new Promise((r) => setTimeout(r, ms)), R = rp.knobs(), cull = rp.cull(), diet = rp.diet();
  const views = { gate: [40.95, 21.98, -2.17], fields: [211, 22, 1.57] }, v = window.__VIEW || 'gate', NF = window.__NF || 30, mode = window.__MODE || 'new';
  rp.pause(false); S.cool = 99; if (views[v]) rp.setPos(views[v][0], views[v][1], views[v][2]); else rp.goNear('ws:mill_wind2', 4);
  if (mode === 'old') { cull.setMtx(false); cull.setTown(false); R.life = 0; R.lod = 0; } else { cull.setMtx(true); cull.setTown(true); diet.apply(diet.st.lvl); }
  rp.fakeClock(true); rp.setInput(0, 0);
  await wait(4000); PROF.on = true; for (const k in PROF.avg) delete PROF.avg[k]; for (const k in PROF.ms) delete PROF.ms[k]; const f0 = PROF.frames, t0 = performance.now(), calls = [], tris = [];
  for (let i = 0; i < 3000 && PROF.frames - f0 < NF + 10; i++) { await wait(250); const p = rp.perf(); if (PROF.frames - f0 > 10 && p.calls) { calls.push(p.calls); tris.push(p.tris); } }
  const wall = performance.now() - t0, n = PROF.frames - f0; const a = PROF.avg; let upd = 0; for (const k in a) { if (k.charCodeAt(1) === 58 || k === 'render(submit)' || k === 'refl') continue; upd += a[k]; }
  const med = (x) => { const s = x.slice().sort((p, q) => p - q); return s.length ? s[s.length >> 1] : 0; };
  const h = {}; for (const k in a) if (k.charCodeAt(1) === 58) h[k.slice(2)] = +a[k].toFixed(2);
  const res = { view: v, mode, frames: n, wallS: +(wall / 1000).toFixed(0), render: +((a['render(submit)'] || 0) + (a.refl || 0)).toFixed(2), update: +upd.toFixed(2), hero: +(a.battle || 0).toFixed(2), total: +(upd + (a['render(submit)'] || 0) + (a.refl || 0)).toFixed(2),
    world: +['weather', 'sky', 'water', 'flames+fairies', 'forest', 'anim', 'lamps+smokers', 'particles', 'dragon', 'units+patrols', 'lateTick', 'life', 'army', 'tesla+dlings', 'extras', 'moat', 'falls+levels+vaults'].reduce((s, k) => s + (a[k] || 0), 0).toFixed(2),
    calls: med(calls), tris: med(tris), progs: B.renderer.info.programs.length, px: B.renderer.getPixelRatio(), hparts: h, sub: Object.fromEntries(Object.entries(a).filter(([k, x]) => k.charCodeAt(1) !== 58 && x > 0.05).map(([k, x]) => [k, +x.toFixed(2)])), mx: cull.info().mx, cells: cull.info().cells, lvl: diet.st.lvl };
  PROF.on = false; rp.fakeClock(false);
  return JSON.stringify(res);
})()
