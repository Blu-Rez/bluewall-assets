// p35 flyers lab: the REAL createUnitViews (bunits.js) + the real bfx.js fire on a lit field (the battle's own sun / sky / environment at 13.3 h) with a fake sim (units only).
//   page: fly_lab.html?army={"baby":1,"baby3":1,...}&tier={"dragon3":3}&act=1   window.__lab = { adv(sec), render(), cam(...), look(id,...), ev(e), breath(id,x,z,head,big), units, views, fx }
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { createUnitViews } from '../../bot/bluebot_v2/bluewall/client/src/bunits.js';
import { createFX } from '../../bot/bluebot_v2/bluewall/client/src/bfx.js';
import { PX } from '../../bot/bluebot_v2/bluewall/client/src/fx.js';
import { sample } from '../../bot/bluebot_v2/bluewall/client/src/tod.js';
import { envSky } from '../../bot/bluebot_v2/bluewall/client/src/sky.js';
import { makeMaterials } from '../../bot/bluebot_v2/bluewall/client/src/materials.js';
import * as BR from '../../bot/bluebot_v2/bluewall/client/src/bgrider.js';
import * as BGY from '../../bot/bluebot_v2/bluewall/client/src/bgryphon.js';
import * as GP from '../../bot/bluebot_v2/bluewall/client/src/gear_plume.js';
import * as LAY from '../../bot/bluebot_v2/bluewall/client/src/layout.js';
(async () => {
  const Q = new URLSearchParams(location.search); window.__flyOpt = JSON.parse(Q.get('fo') || '{}');
  window.THREE = THREE; window.__BR = BR; window.__BGY = BGY; window.__GP = GP; window.__SU = SkeletonUtils; LAY.setMap('night');
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  document.body.style.margin = 0; document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), P = sample(+(Q.get('h') || 13.3));
  renderer.toneMappingExposure = P.exposure;
  scene.fog = new THREE.FogExp2(P.fog, P.fogD); scene.background = new THREE.Color(P.fog).multiplyScalar(1.0);
  const KI = +(Q.get('ki') ?? (Q.get('wx') === 'clear' ? 0.96 : 0.443)), HI = +(Q.get('hi') ?? (Q.get('wx') === 'clear' ? 0.96 : 0.836));   // (the real battle at dev weather: key 1.76 / hemi 1.12 of the sample's 3.98 / 1.34 = cloudy; ki=1 hi=1 = clear sky)
  const WX = Q.get('wx') === 'clear' ? { cover: 0.18, grey: 0, fog: 1, rain: 0, snow: 0, wind: 0.28, flash: 0, flashSoft: 0, turbidity: 0, kind: 'clear' } : { cover: 0.82, grey: 0.45, fog: 1.9, rain: 0.22, snow: 0, wind: 0.32, flash: 0, flashSoft: 0, turbidity: 0.6, kind: 'drizzle' };
  const key = new THREE.DirectionalLight(P.key, P.keyI * KI); key.position.copy(P.keyDir).multiplyScalar(320); key.target.position.set(0, 0, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  { const c = key.shadow.camera; c.left = c.bottom = -90; c.right = c.top = 90; c.near = 20; c.far = 700; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.35; }
  const hemi = new THREE.HemisphereLight(P.hemiSky, P.hemiGnd, P.hemiI * HI); scene.add(key, key.target, hemi);
  try {                                                                                  // the battle's sky -> environment map (reflections / ambient of the metal and the rim)
    const pm = new THREE.PMREMGenerator(renderer), E = envSky(makeMaterials());
    E.sky.setTime(P, WX); E.sky.update(0, 0, 1, null);
    scene.environment = pm.fromScene(E.scene, 0.02, 0.1, 100, { size: 128 }).texture;
  } catch (e) { console.warn('env', e); }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: 0x3f5a35, roughness: 1, envMapIntensity: 0.3 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.8, 3200);
  const army = JSON.parse(Q.get('army') || '{"baby3":1}'), tiers = JSON.parse(Q.get('tier') || '{}'), gap = +(Q.get('gap') || 30), act = Q.get('act') !== '0';
  const units = []; let id = 1, i = 0; const n = Object.values(army).reduce((a, b) => a + b, 0);
  for (const [type, c] of Object.entries(army)) for (let k = 0; k < c; k++) { units.push({ id: id++, type, side: 'A', x: (i - (n - 1) / 2) * gap, z: 0, face: +(Q.get('face') || 0), tier: tiers[type] ?? +(Q.get('t') ?? 0), active: act, dead: false, hp: 100 }); i++; }
  const sim = { units, defenders: [] };
  const fx = createFX(scene, { scale: PX.scale, height: () => 0 });
  const hooks = { land: () => {}, crack: () => {}, breath: (from, to, big, col) => fx.stream(from, to, big, col), fireball: (from, to) => fx.shoot({ kind: 'fireball', from, to, t: 0.4, trail: true }), collapse: () => {} };
  const t0 = performance.now();
  const MM = window.__M = {};
  const views = await createUnitViews({ M: MM, scene, sim, forgeLevel: +(Q.get('forge') || 8), enemyLevel: 12, height: () => 0, hooks });
  window.__loadMs = performance.now() - t0;
  const L = window.__lab = { views, units, sim, scene, camera, renderer, t: 0, key, fx, P };
  L.adv = (sec, dt = 1 / 30) => { const N = Math.max(1, Math.round(sec / dt)); for (let k = 0; k < N; k++) { L.t += dt; if (L.onStep) L.onStep(L.t, dt); views.update(L.t, dt, camera); fx.update(dt, camera); } return L.t; };
  L.render = () => { camera.updateMatrixWorld(true); camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); views.update(L.t, 1 / 600, camera); renderer.render(scene, camera); window.__frames = (window.__frames || 0) + 1; return renderer.info.render.triangles; };
  L.cam = (x, y, z, tx, ty, tz, fov) => { if (fov) { camera.fov = fov; camera.updateProjectionMatrix(); } camera.position.set(x, y, z); camera.lookAt(tx, ty, tz); camera.updateMatrixWorld(true); };
  // close-up of unit `uid`: dist m away, azimuth az (rad, 0 = in front of the unit, pi = behind), look height ly (above the ground), camera lifted by up*dist
  L.look = (uid, dist, ly, az = 0.55, up = 0.12, fov = 30) => {
    const v = views.views.get(uid), p = v.parts[0].p, a = v.yaw + az; if (fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.position.set(p.x + Math.sin(a) * dist, ly + up * dist, p.z + Math.cos(a) * dist); camera.lookAt(p.x, ly, p.z); camera.updateMatrixWorld(true);
    key.position.copy(P.keyDir).multiplyScalar(320).add(new THREE.Vector3(p.x, 0, p.z)); key.target.position.set(p.x, 0, p.z); key.target.updateMatrixWorld(); return [p.x, p.y, p.z];
  };
  L.pose = (uid, clip, offset = 0) => { const v = views.views.get(uid); for (const pt of v.parts) pt.p.play(clip, { fade: false, speed: 1, offset }); return v.parts.map((pt) => pt.p.name); };

  // contact sheet: the pose of `clip` at each offset (s) of unit uid, one cell each (cols per row), camera as look(); returns the number of cells.  shot.py takes the screenshot of the whole canvas afterwards (no 'render' in between: name starts with _ ... use name 'sheet' and JS that returns)
  L.sheet = (uid, clip, offs, cols, dist, ly, az = 0.55, up = 0.12, fov = 30, parts = null) => {
    const W = innerWidth, Hh = innerHeight, rows = Math.ceil(offs.length / cols), cw = Math.floor(W / cols), ch = Math.floor(Hh / rows);
    renderer.setScissorTest(true); renderer.autoClear = false; renderer.setClearColor(0x2a3a55, 1); renderer.clear();
    const aspect = camera.aspect; camera.aspect = cw / ch; camera.updateProjectionMatrix();
    offs.forEach((o, i) => {
      for (const pt of views.views.get(uid).parts) pt.p.play(clip, { fade: false, speed: 1, offset: o });
      L.look(uid, dist, ly, az, up, fov); camera.aspect = cw / ch; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      views.update(L.t, 1 / 600, camera);
      const x = (i % cols) * cw, y = (rows - 1 - Math.floor(i / cols)) * ch;
      renderer.setViewport(x, y, cw, ch); renderer.setScissor(x, y, cw, ch); renderer.render(scene, camera);
    });
    renderer.setScissorTest(false); renderer.autoClear = true; renderer.setViewport(0, 0, W, Hh); camera.aspect = aspect; camera.updateProjectionMatrix();
    window.__frames = (window.__frames || 0) + 1; return offs.length;
  };
  L.ev = (e) => views.event(e, L.t);
  L.byType = (t, k = 0) => units.filter((u) => u.type === t)[k];
  // a breath volley of unit `uid` at the ground point (x, z) (relative to the unit, metres along its facing / sideways): one 'breath' event per head (like the sim)
  L.breath = (uid, fwd = 40, side = 0, big = true, heads = 1) => {
    const u = units.find((q) => q.id === uid), sx = Math.sin(u.face), sz = Math.cos(u.face), px = Math.cos(u.face), pz = -Math.sin(u.face), S = [0, -1, 1];
    for (let h = 0; h < heads; h++) { const o = (side + S[h] * 9); L.ev({ k: 'breath', u: uid, from: [u.x, 15, u.z], to: [u.x + sx * fwd + px * o, 1, u.z + sz * fwd + pz * o], big, head: h }); }
  };
  L.kill = (uid) => L.ev({ k: 'die', id: uid });
  L.hurt = (uid) => L.ev({ k: 'hurt', id: uid });
  L.melee = (uid) => L.ev({ k: 'melee', u: uid });
  window.__stats = () => JSON.stringify({ kinds: Object.keys(views.kinds), tris: renderer.info.render.triangles, calls: renderer.info.render.calls, drawn: views.stats() });
  window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
