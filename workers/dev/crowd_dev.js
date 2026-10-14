// dev-only bundle: archers on a plain ground, instanced-baked vs. a regular SkinnedMesh reference
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { createKind } from '../bot/bluebot_v2/bluewall/client/src/crowd.js';
import { mergeSkinned } from '../bot/bluebot_v2/bluewall/client/src/creature.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const L = (n) => ld.loadAsync('assets/' + n + '.glb');
  const [rm, rf, an, bow] = await Promise.all(['ranger_m', 'ranger_f', 'anims', 'bow'].map(L));
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x6f8fb8);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x445544, 1.6)); const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(30, 60, 20); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x556655 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 2000);
  const mk = (g) => createKind({ gltf: g, anims: an, clips: ['Walk_Loop', 'Idle_Loop', 'Sword_Idle'], props: [{ gltf: bow, bone: 'hand_l', s: 0.55, rot: [Math.PI / 2, 0, Math.PI / 2] }], lod1Skip: /Boots|Belt|Bracer|Pauldron/ });
  const km = mk(rm), kf = mk(rf); scene.add(km.group, kf.group);
  console.info('walkSpeed', km.stats.walkSpeed, 'clips', JSON.stringify(km.info));
  const SC = 1.75, ps = [];
  for (let i = 0; i < 5; i++) { const p = (i % 2 ? kf : km).add({ x: -6 + i * 3, z: 0, scale: SC, yaw: 0 }); p.play(i == 4 ? 'Idle_Loop' : 'Walk_Loop', { offset: i * 0.3 }); ps.push(p); }
  // reference: a regular skinned character at z=-6
  mergeSkinned(rm.scene); const ref = SkeletonUtils.clone(rm.scene); ref.scale.setScalar(SC); ref.position.set(0, 0, -6); scene.add(ref);
  const bn = ref.getObjectByName('hand_l'); const bo = bow.scene.clone(true); bo.scale.setScalar(0.55); bo.rotation.set(Math.PI / 2, 0, Math.PI / 2); bn.add(bo);
  const mix = new THREE.AnimationMixer(ref); const wc = an.animations.find((a) => a.name === 'Walk_Loop');
  mix.clipAction(new THREE.AnimationClip('w', wc.duration, wc.tracks.filter((tr) => ref.getObjectByName(tr.name.split('.')[0])))).play();
  const cam = window.__cam = { x: 0, y: 3.5, z: 12, tx: 0, ty: 2, tz: -2 };
  let t = 0; const clock = new THREE.Clock();
  window.__t = () => t; window.__step = (dt) => {};
  window.__go = false;
  function frame() {
    const dt = Math.min(0.05, clock.getDelta()); t += dt; mix.update(dt);
    for (const p of ps) { if (p.name === 'Walk_Loop') p.x += 0 ; }
    camera.position.set(cam.x, cam.y, cam.z); camera.lookAt(cam.tx, cam.ty, cam.tz); camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    km.update(t, camera); kf.update(t, camera);
    renderer.render(scene, camera); window.__frames = (window.__frames || 0) + 1;
    requestAnimationFrame(frame);
  }
  window.__km = km; window.__ps = ps; window.__renderer = renderer;
  frame(); window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
