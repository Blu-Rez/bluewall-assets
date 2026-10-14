import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { makeMaterials } from '../bot/bluebot_v2/bluewall/client/src/materials.js';
import { createBallistasA } from '../bot/bluebot_v2/bluewall/client/src/ballista_a.js';
import { createBallistas } from '../bot/bluebot_v2/bluewall/client/src/ballista.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const a = await ld.loadAsync('assets/ballista.glb');
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x7d96b8);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x554433, 1.6)); const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(30, 60, 20); scene.add(sun);
  const M = makeMaterials();
  const q = new URLSearchParams(location.search), mode = q.get('m') || 'front';
  const b = createBallistas({ scene, M, height: () => 0, sites: [{ x: 4, y: 0, z: 0, a: Math.PI / 2 }], onFire() {} });
  const bA = createBallistasA({ scene, models: { ballista: a }, height: () => 0, sites: [{ x: -4, y: 0, z: 0, a: Math.PI / 2 }], onFire() {} });
  const o = new THREE.Group(); o.visible = false; scene.add(o);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x6a7080 })); g.rotation.x = -Math.PI / 2; scene.add(g);
  const cam = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
  const P = { front: [0, 4, 14, 0, 1.3, 0], side: [14, 3, 0.1, 0, 1.3, 0], top: [0, 16, 0.1, 0, 0, 0], back: [0, 4, -14, 0, 1.3, 0], b3: [10, 5, 8, 4, 1.8, 0], a3: [-10, 5, 8, -4, 1.8, 0], a4: [-14, 3, 1, -4, 1.4, 0] }[mode];
  cam.position.set(P[0], P[1], P[2]); cam.lookAt(P[3], P[4], P[5]);
  // procedural ballista: points +Z at yaw = base + sweep; base = PI/2 - a = 0 -> faces +Z
  b.update(0, 0.016, cam); bA.update(0, 0.016, cam); renderer.render(scene, cam); window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e.stack); });
