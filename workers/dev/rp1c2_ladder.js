// rp1c2_ladder.js — RP1C-R2 Job 1b (c): what each governor step buys.  At the gate, every level 0..max is applied by hand; after 6 settling frames the game's own PROF numbers (JS ms per drawn frame) and renderer.info (calls, triangles) of 10 frames are read.
(async () => {
  const rp = __rp, S = rp.S, B = __bw, PROF = window.__bwProf, diet = rp.diet(), R = rp.knobs(), wait = (ms) => new Promise((x) => setTimeout(x, ms)), fr = () => B.renderer.info.render.frame;
  rp.pause(false); S.cool = 99; rp.setInput(0, 0); rp.setPos(40.95, 21.98, -2.17); rp.fakeClock(true); PROF.on = true; const res = [];
  for (let l = 0; l < diet.STEPS.length; l++) {
    diet.apply(l); await wait(1500); const f0 = fr(); while (fr() < f0 + 6) await wait(400);
    for (const k in PROF.avg) delete PROF.avg[k]; for (const k in PROF.ms) delete PROF.ms[k]; const g0 = fr(), calls = [], tris = [];
    while (fr() < g0 + 10) { await wait(400); const p = rp.perf(); if (p.calls) { calls.push(p.calls); tris.push(p.tris); } }
    const a = PROF.avg; let upd = 0; for (const k in a) { if (k.charCodeAt(1) === 58 || k === 'render(submit)' || k === 'refl') continue; upd += a[k]; }
    const med = (x) => { const s = x.slice().sort((p, q) => p - q); return s.length ? s[s.length >> 1] : 0; }; const st = diet.STEPS[l];
    res.push({ lvl: l, label: st.label, px: B.renderer.getPixelRatio(), shadows: st.soff ? 'off' : 'on', render: +((a['render(submit)'] || 0) + (a.refl || 0)).toFixed(1), update: +upd.toFixed(1), total: +(upd + (a['render(submit)'] || 0) + (a.refl || 0)).toFixed(1), calls: med(calls), tris: med(tris), progs: B.renderer.info.programs.length, fog: R.fog, upd: R.upd, cullR: st.cullR });
  }
  PROF.on = false; diet.apply(diet.START); rp.fakeClock(false);
  return JSON.stringify(res);
})()
