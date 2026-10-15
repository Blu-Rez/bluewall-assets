// rp1c2_L_readout.js — RP1C-R2 Job 1b: the one-line readout with LIVE values (landscape 844x390).  The rig draws a frame every few seconds, so the 60 fps the line would show on a phone is fed with
//   the hero's own frame function on a 60 fps fake clock (40 frames), and the draw-call / triangle / pixel-ratio numbers come from the real render just before.  The element is the real `.rp-perf` DOM line.
(async () => {
  const rp = __rp, S = rp.S, B = __bw, wait = (ms) => new Promise((r) => setTimeout(r, ms)), P = window.__bwProf;
  rp.pause(false); S.cool = 99; rp.setInput(0, 0); rp.fakeClock(true); rp.setPos(40.95, 21.98, -2.17);
  rp.setPerf(true); if (P) P.on = true; await wait(9000);
  const I = B.renderer.info; I.reset(); B.renderer.render(B.scene, B.camera); const c = I.render.calls, t = I.render.triangles;      // one real draw: its calls / triangles stand for every fed frame (the hero resets the counters after reading them)
  for (let i = 0; i < 59; i++) { I.render.calls = c; I.render.triangles = t; rp.frame(performance.now() + i * 16.7, 1 / 60); }
  await wait(300);
  return JSON.stringify({ line: rp.perfLine(), calls: c, tris: t, px: B.renderer.getPixelRatio(), lvl: rp.diet().st.lvl });
})()
