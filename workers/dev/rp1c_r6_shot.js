// rp1c_r6_shot.js — RP1C_R6: ONE frame of the game at 844x390 from the hero camera at a chosen spot + the numbers of that frame.  Evaluated INSIDE the game page (hero started):
//   window.__R6 = { x, z, yaw, under?: true (put her in the water under a bridge: she starts on the river bed), sims?: n x 0.25 s, pitch?: radians (default = the look's own pitch) , back?: true }  ->  rp1c2_q.py evalf this file
//   Returns JSON { png (dataURL, 844x390), n: { dist3, distH, elev (deg, the camera's view direction below the horizon), camY, hh (her height above the feet, px), headY, feetY, a5, a10 (screen y of the ground 5 m / 10 m AHEAD of her), face (deg), inside (camCheck), st, sw } }
(async () => {
  const rp = __rp, S = rp.S, B = __bw, T = B.THREE, P = window.__R6 || {}, wait = (ms) => new Promise((x) => setTimeout(x, ms));
  const dprDev = window.devicePixelRatio || 1; if (B.pause) B.pause(true);
  if (rp.pause) rp.pause(false); S.cool = 99; rp.setInput(0, 0); if (rp.fakeClock) rp.fakeClock(true);
  rp.setPos(P.x, P.z, P.yaw); if (rp.diet && rp.diet()) rp.diet().apply(0);
  if (P.under) { S.y = B.world.fastHeight(P.x, P.z); S.sw = 0; S.grounded = true; }   // (the river bed under the deck: she floats up to the swim state in the first sims)
  if (P.pitch != null) rp.setLook(P.yaw, P.pitch);
  if (rp.pause) rp.pause(true);
  for (let i = 0; i < (P.sims || 8); i++) rp.sim(0.25, 1 / 60);
  window.dispatchEvent(new Event('resize')); await wait(1200);
  const rnd = B.renderer, cv = rnd.domElement; rnd.setPixelRatio(1); rnd.setSize(844, 390, false);
  B.camera.aspect = 844 / 390; B.camera.updateProjectionMatrix();
  if (P.cam) { B.camera.position.set(P.cam[0], P.cam[1], P.cam[2]); B.camera.lookAt(P.cam[3], P.cam[4], P.cam[5]); B.camera.updateMatrixWorld(); }   // (dev: a free camera, to look at her from the side)
  B.scene.matrixWorldAutoUpdate = true; B.scene.updateMatrixWorld(true);
  if (rp.marker && rp.marker()) rp.marker().tick(B.camera, performance.now(), B.scene);
  rnd.render(B.scene, B.camera);
  const o = document.createElement('canvas'); o.width = 844; o.height = 390; o.getContext('2d').drawImage(cv, 0, 0, 844, 390, 0, 0, 844, 390);
  const cam = B.camera, dir = new T.Vector3(); cam.getWorldDirection(dir);
  const pr = (x, y, z) => { const v = new T.Vector3(x, y, z).project(cam); return +((1 - v.y) * 0.5 * 390).toFixed(0); };
  const fx = Math.sin(S.body), fz = Math.cos(S.body), g = (x, z) => rp.ground(x, z);
  const bb = new T.Box3().setFromObject(S.hero.model), hx = (bb.min.x + bb.max.x) / 2, hz = (bb.min.z + bb.max.z) / 2;
  const headY = pr(hx, bb.max.y, hz), feetY = pr(hx, bb.min.y, hz);
  const info = rp.camInfo(), fi = rp.faceInfo();
  const n = { dist3: +info.d3.toFixed(2), distH: +Math.hypot(cam.position.x - S.pivot.x, cam.position.z - S.pivot.z).toFixed(2), elev: +(Math.asin(-dir.y) * 57.29578).toFixed(1), camY: +(cam.position.y - S.y).toFixed(2), camR: +info.camR.toFixed(2), hh: Math.abs(feetY - headY), headY, feetY,
    a5: pr(S.x + fx * 5, g(S.x + fx * 5, S.z + fz * 5), S.z + fz * 5), a10: pr(S.x + fx * 10, g(S.x + fx * 10, S.z + fz * 10), S.z + fz * 10), face: fi.deg, inside: rp.camCheck().join('+'), st: S.st, sw: S.sw, pitch: +S.pitch.toFixed(3), look: S.camLook || 2 };
  if (B.pause) B.pause(false);
  return JSON.stringify({ png: o.toDataURL('image/png'), w: 844, h: 390, n });
})()
