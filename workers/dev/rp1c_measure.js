// rp1c_measure.js — numbers for the RP1C report, run in the REPL (dev/rp1c_repl.py + rp1c_ask.py) on the owner dev page with the hero started.  "before" = RP1B's hero mode (cull + doors switched off),
// "after" = RP1C (both on).  One renderer.render with renderer.info: main pass (shadow map not refreshed) and a shadow-refresh frame; ms = median wall time of renderer.render() on the main thread (three.js JS + command
// submission; the GPU work of the software rasteriser is in another process), at whatever CDP CPU throttle the REPL has set (#throttle N).
const reps = (typeof REPS !== 'undefined') ? REPS : 5;
const rp = __rp, S = rp.S, B = __bw, R = B.renderer, sc = B.scene, cam = B.camera, C = rp.cull(), D = rp.doors();
const raf = () => new Promise((r) => requestAnimationFrame(r)), wait = (ms) => new Promise((r) => setTimeout(r, ms));
const views = { gate: [40.95, 21.98, -2.17], fields: [211, 22, 1.57], mill: null };
const sm = R.shadowMap, sm0 = [sm.autoUpdate, sm.needsUpdate]; sm.autoUpdate = false; R.info.autoReset = false;
const one = (refresh) => { sm.needsUpdate = !!refresh; R.info.reset(); const t0 = performance.now(); R.render(sc, cam); const ms = performance.now() - t0; return { calls: R.info.render.calls, tris: R.info.render.triangles, ms }; };
const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
const out = { preset: new URLSearchParams(location.search).get('q'), throttle: window.__throttle || 1, rows: [] };
for (const [name, v] of Object.entries(views)) {
  for (const mode of ['before', 'after']) {
    if (mode === 'before') { D.exit(); C.exit(); } else { C.enter(); D.enter(); }
    rp.pause(true); S.cool = 99; if (v) rp.setPos(v[0], v[1], v[2]); else rp.goNear('ws:mill_wind2', 4); rp.sim(0.3);
    for (let i = 0; i < 3; i++) await raf(); await wait(3000);
    const main = [], ref = []; for (let i = 0; i < reps; i++) main.push(one(false)); const m = main[main.length - 1]; const r1 = one(true);
    out.rows.push({ view: name, mode, calls: m.calls, tris: m.tris, refreshCalls: r1.calls, refreshTris: r1.tris, shadowCalls: r1.calls - m.calls, shadowTris: r1.tris - m.tris, progs: R.info.programs.length,
      ms: +med(main.map((x) => x.ms)).toFixed(1), tickCull: mode === 'after' ? C.info().ms : 0, tickDoors: mode === 'after' ? D.info().ms : 0, packs: mode === 'after' ? C.info().packs : 0, orbs: mode === 'after' ? D.info().orbs : 0 });
  }
}
C.enter(); D.enter(); sm.autoUpdate = sm0[0]; sm.needsUpdate = sm0[1]; R.info.autoReset = true; rp.pause(false);
return out;
