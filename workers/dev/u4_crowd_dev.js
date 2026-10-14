// u4_crowd_dev.js — the gryphon crowd kind alone on a plain ground (esbuild bundle -> u4_crowd_dev.bundle.js): ?glint=0..5  &clip=Fly  &n=5  &t=0.3  &yaw=0.6
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createKind } from '../bot/bluebot_v2/bluewall/client/src/crowd.js';
import { buildU4Gryphon, U4_CLIPS } from '../bot/bluebot_v2/bluewall/client/src/u4_looks.js';
import { GLINT } from '../bot/bluebot_v2/bluewall/client/src/unitlook.js';
import { buildGryphon } from '../bot/bluebot_v2/bluewall/client/src/bgryphon.js';
(async () => {
  const Q = new URLSearchParams(location.search), ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const OLD = Q.get('old') === '1', g = await ld.loadAsync(OLD ? 'assets/gryphon.glb' : 'assets/u4_gryphon.glb'), gl = OLD ? buildGryphon(g, { hero: false, id: 'gry' }) : buildU4Gryphon(g);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x6f8fb8);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x445544, 1.6)); const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(30, 60, 20); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x556655 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 2000);
  const tier = +(Q.get('glint') || 0), kind = createKind({ gltf: gl, anims: gl, clips: ['Rest', 'Fly', 'Hover', 'Atk', 'Hit', 'Die'], capacity: 8, glint: GLINT[tier] ? [GLINT[tier][0], GLINT[tier][1] * +(Q.get('gk') || 1)] : undefined });
  scene.add(kind.group);
  const n = +(Q.get('n') || 3), SC = +(Q.get('sc') || 1.8), clip = Q.get('clip') || 'Rest', ps = [];
  for (let i = 0; i < n; i++) { const p = kind.add({ x: (i - (n - 1) / 2) * 6, y: clip === 'Rest' ? 0 : 3, z: 0, scale: SC, yaw: +(Q.get('yaw') || 0.6) }); p.play(clip, { offset: i * 0.13 }); ps.push(p); }
  camera.position.set(0, 7, 26); camera.lookAt(0, 3, 0);
  const T = +(Q.get('t') || 0.3); let frames = 0;
  const loop = () => { kind.update(T, camera); renderer.render(scene, camera); frames++; window.__frames = frames; requestAnimationFrame(loop); };
  loop(); window.__kind = kind; window.__ready = true;
  window.__perf = () => { let tris = 0, inst = 0; kind.group.traverse((o) => { if (o.isInstancedMesh) { inst++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } }); renderer.info.reset(); renderer.render(scene, camera); const r = renderer.info; return { instancedMeshes: inst, trisPerInstance: Math.round(tris), calls: r.render.calls, trisDrawn: r.render.triangles, programs: r.programs.map((p) => p.name + ':' + p.cacheKey.length).length, tex: r.memory.textures, geoms: r.memory.geometries }; };
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
