// rp1c2_abl.js — RP1C-R2 Job 3: calls / triangles of the three hero views, lever by lever (main pass, and main + a shadow refresh = the shadow pass's share).  Evaluate inside the game page with the hero started.
//   variants: all levers on (town cells + castle LOD 50 m + shadow box 44) | cells off (the world's own giant chunks) | cells off + castle LOD 80 m (= the state before RP1C-R2)
(async () => {
  const rp = __rp, S = rp.S, B = __bw, R = B.renderer, sc = B.scene, cam = B.camera, cull = rp.cull(), reach = rp.reach();
  const views = { gate: [40.95, 21.98, -2.17], fields: [211, 22, 1.57], mill: null };
  const raf = () => new Promise((r) => requestAnimationFrame(r)), wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const lod0 = reach.lod, out = { lod0, rows: [] };
  const variants = [['all levers', () => { cull.setTown(true); reach.lod = lod0 || 50; }], ['cells off', () => { cull.setTown(false); reach.lod = lod0 || 50; }], ['cells off + castle LOD 80 m (before)', () => { cull.setTown(false); reach.lod = 80; }]];
  for (const [vn, set] of variants) {
    set();
    for (const view of Object.keys(views)) {
      rp.pause(true); S.cool = 99; if (views[view]) rp.setPos(views[view][0], views[view][1], views[view][2]); else rp.goNear('ws:mill_wind2', 4); rp.sim(0.3);
      for (let i = 0; i < 3; i++) await raf(); await wait(3500);
      const sm = R.shadowMap, s0 = [sm.autoUpdate, sm.needsUpdate]; sm.autoUpdate = false; R.info.autoReset = false;
      const one = (sh) => { sm.needsUpdate = !!sh; R.info.reset(); R.render(sc, cam); return { calls: R.info.render.calls, tris: R.info.render.triangles }; };
      one(false); const m = one(false), w = one(true); sm.autoUpdate = s0[0]; sm.needsUpdate = s0[1]; R.info.autoReset = true;
      out.rows.push({ variant: vn, view, main: m, shadowShare: { calls: w.calls - m.calls, tris: w.tris - m.tris }, cells: cull.info().cells, cellsOn: cull.info().cellsOn, lod: reach.lod });
    }
  }
  cull.setTown(true); reach.lod = lod0; rp.pause(false);
  return JSON.stringify(out);
})()
