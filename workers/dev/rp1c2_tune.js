// rp1c2_tune.js — RP1C-R2 Job 1b: calls / triangles at gate / mill / fields for a few phone defaults (draw radius of the packs, crowd radius, fog).  Deterministic counts (renderer.info), a few real frames per setting.
(async () => {
  const rp = __rp, S = rp.S, B = __bw, R = rp.knobs(), diet = rp.diet(), cull = rp.cull(), wait = (ms) => new Promise((x) => setTimeout(x, ms));
  const views = { gate: [40.95, 21.98, -2.17], fields: [211, 22, 1.57], mill: null }, combos = window.__COMBOS || [{ n: 'now', cullR: 150, hideR: 90, hideS: 70, fog: 1.25, life: 75 }, { n: 'c120', cullR: 120, hideR: 80, hideS: 60, fog: 1.5, life: 70 }, { n: 'c100', cullR: 100, hideR: 70, hideS: 55, fog: 1.7, life: 60 }];
  rp.pause(false); S.cool = 99; rp.setInput(0, 0); rp.fakeClock(true); const res = [], base = { ...diet.STEPS[0] };
  for (const v of Object.keys(views)) {
    if (views[v]) rp.setPos(views[v][0], views[v][1], views[v][2]); else rp.goNear('ws:mill_wind2', 4);
    for (const c of combos) {
      Object.assign(diet.STEPS[0], { cullR: c.cullR, hideR: c.hideR, hideS: c.hideS, fog: c.fog, life: c.life }); diet.apply(0);
      await wait(1500); const fr = () => B.renderer.info.render.frame, p0 = fr(); const t0 = performance.now(); while (fr() < p0 + 12 && performance.now() - t0 < 200000) await wait(500);
      await wait(500); const a = []; for (let i = 0; i < 4; i++) { const p = rp.perf(); a.push([p.calls, p.tris]); await wait(900); }
      a.sort((x, y) => x[1] - y[1]); res.push({ view: v, combo: c.n, calls: a[2][0], tris: a[2][1], fog: B.scene.fog && B.scene.fog.density });
    }
  }
  Object.assign(diet.STEPS[0], base); diet.apply(0); rp.fakeClock(false);
  return JSON.stringify(res);
})()
