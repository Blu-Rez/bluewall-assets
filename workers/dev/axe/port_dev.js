// portrait renders with the game's own kinds (army.js makeKinds: shields from gear_shield.js, the hero's axe + hair): ?u=spear|guard|hero&tier=2&yaw=&clip=&t=
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeKinds } from '../../bot/bluebot_v2/bluewall/client/src/army.js';
import { CLOTH, tintGear } from '../../bot/bluebot_v2/bluewall/client/src/unitlook.js';
(async () => {
  const Q = new URLSearchParams(location.search), U = Q.get('u') || 'spear', T = +(Q.get('tier') || 2), W = innerWidth, H = innerHeight;
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(W, H); r.setPixelRatio(1);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = +(Q.get('ex') || 1.15); r.outputColorSpace = THREE.SRGBColorSpace; document.body.appendChild(r.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(12 / 255, 31 / 255, 68 / 255).convertSRGBToLinear();
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.03).texture; scene.environmentIntensity = 0.85;
  const key = new THREE.DirectionalLight(0xfff2e0, 2.2); key.position.set(-3, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9cc8ff, 1.6); rim.position.set(4, 3, -5); scene.add(rim);
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder); const M = {};
  await Promise.all(['ranger_m', 'anims', 'anims_army', 'helmet2', 'helmet3', 'spear', 'claymore', 'shield_heater', 'shield_round2', 'sword', 'shieldmaiden'].map(async (n) => { M[n] = await ld.loadAsync('../assets/' + n + '.glb'); }));
  const K = makeKinds(M, T); const kind = K[U]; scene.add(kind.group); kind.setCloth(CLOTH[T].c, CLOTH[T].k); tintGear(kind, T);
  const clip = Q.get('clip') || { spear: 'Idle_Shield_Loop', guard: 'Sword_Idle', hero: 'Sword_Idle' }[U];
  const p = kind.add({ x: 0, z: 0, yaw: +(Q.get('yaw') || -0.55), scale: U === 'hero' ? 1.95 : 1.75 }); p.play(clip, { fade: false, offset: +(Q.get('t') || 0.4) });
  const cam = new THREE.PerspectiveCamera(24, W / H, 0.1, 100); cam.position.set(0, 1.9, 8.5); cam.lookAt(0, 1.55, 0);
  let n = 0, t = 0; const loop = () => { t += 1 / 30; kind.update(t, cam); r.render(scene, cam); n++; window.__frames = n; if (n < 8) requestAnimationFrame(loop); }; loop();
})();
