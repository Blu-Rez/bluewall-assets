import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { makeKinds } from '../bot/bluebot_v2/bluewall/client/src/army.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const names = ['ranger_m', 'anims', 'anims_army', 'helmet2', 'helmet3', 'shield_heater', 'spear', 'claymore', 'shieldmaiden', 'shield_round2', 'sword_mw', 'sword', 'shield'];
  const M = {}; await Promise.all(names.map(async (n) => { M[n] = await ld.loadAsync('assets/' + n + '.glb'); }));
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x6f8fb8);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x445544, 1.6)); const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(30, 60, 20); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x6b7a55 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 2000);
  const K = makeKinds(M); for (const k of Object.values(K)) scene.add(k.group);
  console.info('clips', JSON.stringify(Object.fromEntries(Object.entries(K).map(([n, k]) => [n, Object.keys(k.info)]))));
  const row = [['spear', 'Idle_Shield_Loop', 1.75], ['spear', 'Shield_OneShot', 1.75], ['sword', 'Sword_Idle', 1.75], ['sword', 'Sword_Regular_A', 1.75], ['guard', 'Sword_Idle', 1.75], ['guard', 'Sword_Block', 1.75], ['hero', 'Sword_Idle', 1.95]];
  row.forEach(([k, c, s], i) => { const p = K[k].add({ x: (i - 3) * 3.2, z: 0, scale: s, yaw: 0.0 }); p.play(c, { offset: 0.3 }); });
  const cam = window.__cam = { x: 0, y: 3.4, z: 26, tx: 0, ty: 2.6, tz: 0 };
  let t = 0; const clock = new THREE.Clock(); window.__t = () => t;
  function frame() {
    const dt = Math.min(0.05, clock.getDelta()); t += dt;
    camera.position.set(cam.x, cam.y, cam.z); camera.lookAt(cam.tx, cam.ty, cam.tz); camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    for (const k of Object.values(K)) k.update(t, camera);
    renderer.render(scene, camera); window.__frames = (window.__frames || 0) + 1; requestAnimationFrame(frame);
  }
  window.__K = K; window.__renderer = renderer; frame(); window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
