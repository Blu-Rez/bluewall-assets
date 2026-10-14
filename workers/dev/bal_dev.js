import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const a = await ld.loadAsync('assets/ballista.glb'), k = await ld.loadAsync('stage/siege_kenney_ballista.glb');
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x7d96b8);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x554433, 1.6)); const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(30, 60, 20); scene.add(sun);
  const box = (o) => new THREE.Box3().setFromObject(o);
  const put = (g, x, h) => { const o = g.scene; const b = box(o), s = h / (b.max.y - b.min.y); o.scale.setScalar(s); o.position.set(x, -b.min.y * s, 0); scene.add(o); const bb = box(o); console.info('size', JSON.stringify(bb.getSize(new THREE.Vector3()))); };
  put(a, -2.2, 2.2); put(k, 2.2, 2.2);
  const cam = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100); cam.position.set(0, 3.6, 9); cam.lookAt(0, 1.2, 0);
  renderer.render(scene, cam); window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); });
