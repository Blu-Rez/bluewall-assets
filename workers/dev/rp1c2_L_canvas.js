// rp1c2_L_canvas.js — RP1C-R2 Jobs 0 / 9: a crop of the game canvas at a chosen render resolution (landscape 844x390), read straight from the WebGL canvas (the screenshot of the page cannot show a
//   device-pixel-ratio the rig does not have).  window.__PX = render pixels per CSS pixel (1 = phone default, 2 = a retina screen at native), window.__CROP = [x, y, w, h] in CSS px, window.__DRAG = degrees of camera drag, window.__LOOK = marker look 1..3, window.__LIGHT = marker light 0..2.
//   Works with the kit's OLD hero too (only setPos / setLook / sim / knobs are used).   Returns { png: dataURL of the crop at the render resolution, w, h, info }.
(async () => {
  const rp = __rp, S = rp.S, B = __bw, R = rp.knobs ? rp.knobs() : {}, wait = (ms) => new Promise((x) => setTimeout(x, ms)), PX = +(window.__PX || 1), DRAG = +(window.__DRAG || 0), C = window.__CROP || [0, 0, 844, 390];
  const dprDev = window.devicePixelRatio || 1; if (B.pause) B.pause(true);      // (the game's own loop stops while the direct draws are made: one render at a time on the software GL)
  if (rp.pause) { rp.pause(false); } S.cool = 99; rp.setInput(0, 0); if (rp.fakeClock) rp.fakeClock(true);
  rp.setPos(40.95, 21.98, -2.17); if (rp.diet && rp.diet()) rp.diet().apply(0);
  if (DRAG) rp.setLook(S.camYaw + DRAG * Math.PI / 180, 0.25);
  if (rp.pause) rp.pause(true);
  if (window.__LOOK && rp.marker && rp.marker()) rp.marker().setLook(+window.__LOOK);
  if (window.__LIGHT != null && window.__LIGHT !== '' && rp.marker && rp.marker()) rp.marker().setLight(+window.__LIGHT);
  for (let i = 0; i < (window.__SIMS || 20); i++) rp.sim(0.25, 1 / 60);
  R.dpr = PX / dprDev; window.dispatchEvent(new Event('resize')); await wait(2500);
  const rnd = B.renderer, cv = rnd.domElement; rnd.setPixelRatio(PX); rnd.setSize(844, 390, false);
  B.camera.aspect = 844 / 390; B.camera.updateProjectionMatrix();
  B.scene.matrixWorldAutoUpdate = true; B.scene.updateMatrixWorld(true);      // (the game's loop switches the automatic matrix update off between two world updates: a direct draw must see current matrices)
  if (rp.marker && rp.marker()) rp.marker().tick(B.camera, performance.now(), B.scene);
  rnd.render(B.scene, B.camera);
  const k = cv.width / 844, o = document.createElement('canvas'); o.width = Math.round(C[2] * k); o.height = Math.round(C[3] * k);
  o.getContext('2d').drawImage(cv, Math.round(C[0] * k), Math.round(C[1] * k), o.width, o.height, 0, 0, o.width, o.height);
  let hpx = null; try { const T = B.THREE, bb = new T.Box3().setFromObject(S.hero.model), a = new T.Vector3((bb.min.x + bb.max.x) / 2, bb.max.y, (bb.min.z + bb.max.z) / 2).project(B.camera), b = new T.Vector3((bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2).project(B.camera); hpx = +(Math.abs(a.y - b.y) / 2 * 390).toFixed(1); } catch (e) { hpx = null; }
  if (B.pause) B.pause(false);
  return JSON.stringify({ hpx, png: o.toDataURL('image/png'), w: o.width, h: o.height, k, px: rnd.getPixelRatio(), canvas: [cv.width, cv.height], yaw: +S.camYaw.toFixed(3) });
})()
