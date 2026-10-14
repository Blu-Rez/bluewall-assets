import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { buildModelDragon } from '../bot/bluebot_v2/bluewall/client/src/dragon_model.js';
import { createKind } from '../bot/bluebot_v2/bluewall/client/src/crowd.js';
import { prowlerFly, dragonVariant, DRAGON_LOOK } from '../bot/bluebot_v2/bluewall/client/src/bdragon.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const pw = await ld.loadAsync('assets/prowler.glb');
  window.__bbox = new THREE.Box3().setFromObject(pw.scene, true).getSize(new THREE.Vector3()).toArray(); window.__clips = pw.animations.map((c) => c.name + ':' + c.duration.toFixed(2)).join(',');
  const renderer = new THREE.WebGLRenderer({ antialias: true }); const W = innerWidth, H = innerHeight; renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2; renderer.setScissorTest(true);
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x8aa6c8);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x445544, 1.6)); const sun = new THREE.DirectionalLight(0xfff0d8, 3.0); sun.position.set(-30, 60, 40); scene.add(sun);
  { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.6; }
  const flap = { clip: 'Landing', from: 0, to: 1.05 };
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1000, 0, 0)]);
  const fx = { emit() {} };
  const items = window.__items = [];
  // live (home recipe) dragons
  const live = (tint, rim) => { const d = buildModelDragon(scene, pw, fx, curve, { length: 34, tint, rim, flap, light: false }); d.root.position.set(0, 0, 0); items.push({ root: d.root, upd: (t, dt) => d.mixer ? 0 : 0, d }); return d; };
  window.__mk = (list) => {   // list of [kind, tint|look, rim]
    items.forEach((i) => { scene.remove(i.root); }); items.length = 0;
    list.forEach(([kind, a, b], i) => {
      if (kind === 'live') { const d = buildModelDragon(scene, pw, fx, curve, { length: 34, tint: a, rim: b || [1.0, 0.4, 0.15], flap, light: false, speed: 0 }); d.root.position.set((i - (list.length - 1) / 2) * 38, 0, 0); items.push({ root: d.root, step: (dt) => { d.update(0, dt); d.root.position.set((i - (list.length - 1) / 2) * 38, 0, 0); d.root.rotation.set(0, Math.PI / 2 * 0 + 0.9, 0); } }); }
    });
  };
  window.__t0 = 0;
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 1000);
  window.__view = { dist: 150, ty: 12, az: 0.6, span: 50 };
  let last = performance.now();
  const draw = () => {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    items.forEach((i) => i.step && i.step(dt));
    const V = window.__view; renderer.setViewport(0, 0, W, H); renderer.setScissor(0, 0, W, H);
    cam.fov = 2 * Math.atan(V.span / 2 / V.dist) * 180 / Math.PI; cam.updateProjectionMatrix();
    cam.position.set(Math.sin(V.az) * V.dist, V.ty + 18, Math.cos(V.az) * V.dist); cam.lookAt(0, V.ty, 0);
    renderer.render(scene, cam); window.__frames = (window.__frames || 0) + 1; requestAnimationFrame(draw);
  };
  window.__mk([['live', 0x5f8fe8, [0.25, 0.55, 1.0]]]);
  draw(); window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
