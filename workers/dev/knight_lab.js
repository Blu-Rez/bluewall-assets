import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { makeCreature } from '../bot/bluebot_v2/bluewall/client/src/creature.js';
import { dressKnight } from '../bot/bluebot_v2/bluewall/client/src/gear_plume.js';
import { swordClips, POSES, STRIKE } from '../bot/bluebot_v2/bluewall/client/src/gear_sword.js';
window.__noHelm = /nohelm/.test(location.search);
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const g = await ld.loadAsync('assets/knight_k3.glb');
  dressKnight(g);
  const t0 = performance.now(); swordClips(g); const ms = performance.now() - t0;
  console.info('sword', JSON.stringify({ ms: ms | 0, sw: g.__sword && { axis: g.__sword.axis.toArray().map((x) => +x.toFixed(2)), flat: g.__sword.flat.toArray().map((x) => +x.toFixed(2)), tMin: +g.__sword.tMin.toFixed(3), tMax: +g.__sword.tMax.toFixed(3), n: g.__sword.n }, clips: g.animations.map((c) => c.name + ':' + c.duration.toFixed(2)) }));
  const renderer = new THREE.WebGLRenderer({ antialias: true }); const W = innerWidth, H = innerHeight; renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setScissorTest(true);
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x7f98b8);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x445544, 2.0)); const sun = new THREE.DirectionalLight(0xffffff, 2.5); sun.position.set(-6, 10, 8); scene.add(sun);
  { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.7; }
  const SET = window.__set = [];
  window.__build = (list) => {
    SET.forEach((c) => scene.remove(c.root)); SET.length = 0;
    list.forEach(([clip, u], i) => {
      const c = makeCreature(g, { height: 1.8 }); c.root.position.set((i - (list.length - 1) / 2) * 1.6, 0, 0); scene.add(c.root);
      c.play(clip, { fade: 0 }); const cl = c.find(clip); c.mixer.setTime((u || 0) * cl.duration); c.root.updateMatrixWorld(true); SET.push(c);
    });
  };
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  window.__view = { rots: [0.6, 1.5708, 2.4], dist: 9, ty: 1.1 };
  const draw = () => {
    const n = SET.length || 1, span = window.__view.span || n * 1.6 + 1, R = window.__view.rots, rows = R.length;
    const cols = rows >= 4 ? 2 : 1, rr = Math.ceil(rows / cols);
    R.forEach((rot, k) => {
      const cx = k % cols, cy = Math.floor(k / cols), vw = Math.round(W / cols), vh = Math.round(H / rr);
      const vp = [cx * vw, (rr - 1 - cy) * vh, vw, vh]; renderer.setViewport(...vp); renderer.setScissor(...vp);
      SET.forEach((c) => { c.root.rotation.y = rot; c.root.updateMatrixWorld(true); });
      cam.aspect = vp[2] / vp[3]; cam.fov = 2 * Math.atan(Math.max(span / 2 / cam.aspect, window.__view.span ? span / 2 : 1.3) / window.__view.dist) * 180 / Math.PI; cam.updateProjectionMatrix();
      cam.position.set(0, window.__view.ty + 0.05, window.__view.dist); cam.lookAt(0, window.__view.ty, 0);
      renderer.render(scene, cam);
    });
    window.__frames = (window.__frames || 0) + 1; requestAnimationFrame(draw);
  };
  window.__g = g; window.__THREE = THREE; window.__swordClips = swordClips; window.__POSES = POSES; window.__STRIKE = STRIKE; window.__makeCreature = makeCreature;
  window.__build([['Ride', 0], ['RideShoulder', 0], ['RideDrawn', 0], ['RideStrike', 0.2], ['RideStrike', 0.38], ['RideStrike', 0.52], ['RideStrike', 0.8]]);
  draw(); window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
