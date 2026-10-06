import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
const q = new URLSearchParams(location.search);
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(innerWidth, innerHeight); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
r.setScissorTest(true); document.body.appendChild(r.domElement);
const s = new THREE.Scene(); s.background = new THREE.Color(0x8fb0d0);
s.add(new THREE.HemisphereLight(0xffffff, 0x556644, 1.6)); const d = new THREE.DirectionalLight(0xffffff, 2.5); d.position.set(3, 6, 4); s.add(d);
const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder);
L.load('assets/' + q.get('f'), (g) => {
  const o = g.scene; s.add(o); o.updateMatrixWorld(true);
  const clips = g.animations; const clip = clips.find((c) => c.name === q.get('c')) || clips[+q.get('ci') || 0];
  const mixer = new THREE.AnimationMixer(o); const act = clip && mixer.clipAction(clip); act && act.play();
  const n = 4, W = innerWidth / n, cam = new THREE.PerspectiveCamera(35, W / innerHeight, 0.01, 1e6);
  const box = new THREE.Box3();
  const dir = JSON.parse(q.get('v') || '[1,0.6,1]');
  for (let i = 0; i < n; i++) {
    if (act) { mixer.setTime((clip.duration * i) / n); }
    o.updateMatrixWorld(true); box.setFromObject(o, true);
    const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()).length();
    cam.position.copy(c).add(new THREE.Vector3(...dir).normalize().multiplyScalar(sz * 1.3)); cam.lookAt(c); cam.near = sz / 100; cam.far = sz * 10; cam.updateProjectionMatrix();
    r.setViewport(i * W, 0, W, innerHeight); r.setScissor(i * W, 0, W, innerHeight); r.render(s, cam);
  }
  window.__info = clips.map((c) => c.name + ' ' + c.duration.toFixed(2) + 's tracks:' + c.tracks.length + ' ' + c.tracks.slice(0, 3).map((t) => t.name).join(' '));
  window.__done = true;
}, undefined, (e) => { window.__info = ['ERR ' + e.message]; window.__done = true; });
