import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const names = (new URLSearchParams(location.search).get('n') || 'banner,shield_heater,shield,shield_round2,spear,torch').split(',');
  const gs = await Promise.all(names.map((n) => ld.loadAsync('/assets/' + n + '.glb')));
  const W = innerWidth, H = innerHeight, renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setScissorTest(true);
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x7f98b8);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x445544, 1.6)); const sun = new THREE.DirectionalLight(0xffffff, 2.5); sun.position.set(-4, 6, 8); scene.add(sun);
  { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.7; }
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 1000);
  const info = [];
  gs.forEach((g) => { const b = new THREE.Box3().setFromObject(g.scene), sz = b.getSize(new THREE.Vector3()); info.push(sz.toArray().map((v) => +v.toFixed(2)).join('x') + ' anims:' + (g.animations || []).map((a) => a.name).join('/')); });
  window.__info = info;
  const cols = Math.min(3, gs.length), rows = Math.ceil(gs.length / cols), vw = Math.floor(W / cols), vh = Math.floor(H / rows);
  gs.forEach((g, i) => {
    const o = g.scene.clone(true); scene.add(o); const b = new THREE.Box3().setFromObject(o), c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3()), m = Math.max(sz.x, sz.y, sz.z);
    o.position.sub(c); o.rotation.y = 0.5; const grp = o; grp.userData.i = i; grp.userData.m = m;
    grp.visible = false; (window.__objs = window.__objs || []).push(grp);
  });
  const draw = () => {
    (window.__objs || []).forEach((o, i) => {
      (window.__objs).forEach((q) => { q.visible = q === o; });
      const x = (i % cols) * vw, y = (rows - 1 - Math.floor(i / cols)) * vh; renderer.setViewport(x, y, vw, vh); renderer.setScissor(x, y, vw, vh);
      cam.aspect = vw / vh; cam.updateProjectionMatrix(); const d = o.userData.m * 2.2; cam.position.set(0, 0, d); cam.lookAt(0, 0, 0); renderer.render(scene, cam);
    });
    window.__frames = (window.__frames || 0) + 1; requestAnimationFrame(draw);
  };
  draw(); window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
