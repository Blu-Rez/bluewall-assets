// rp1c2_back.js — RP1C-R2 Job 0 (sharpness of her back, and a frame from behind after a 180° camera drag).  Evaluate in the game page with the hero started, then take a screenshot.
//   window.__PX = render pixels per CSS pixel to emulate (1 = the phone default; 2 = what a retina non-phone gets);  window.__DRAG = degrees of camera drag before the shot (0 / 180).
//   The view is the kit's own default third-person camera at the gate, level 0 of the ladder (everything on), the game paused after settling so the screenshot is a stable frame.
(async () => {
  const rp = __rp, S = rp.S, R = rp.knobs(), diet = rp.diet(), wait = (ms) => new Promise((x) => setTimeout(x, ms)), PX = +(window.__PX || 1), DRAG = +(window.__DRAG || 0);
  rp.pause(false); S.cool = 99; rp.setInput(0, 0); rp.fakeClock(true); rp.setPos(40.95, 21.98, -2.17); diet.apply(0);
  const yaw0 = S.camYaw; if (DRAG) rp.setLook(yaw0 + DRAG * Math.PI / 180, 0.25);
  rp.pause(true);   // governor + moves stop; the loop keeps drawing the same frame
  R.dpr = PX / (window.devicePixelRatio || 1); window.dispatchEvent(new Event('resize'));
  for (let i = 0; i < 4; i++) { rp.sim(0.25, 1 / 60); await wait(1500); }
  const fi = rp.faceInfo();
  return JSON.stringify({ px: __bw.renderer.getPixelRatio(), dpr: window.devicePixelRatio, face: fi.deg, drag: DRAG, lvl: diet.st.lvl, map: diet.info().map, camYaw: +S.camYaw.toFixed(3), body: +S.body.toFixed(3) });
})()
