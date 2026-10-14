import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
const Q = new URLSearchParams(location.search), S = +(Q.get('s') || 512);
const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(S, S); r.setClearColor(0x000000, 0);
r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 0.95; r.outputColorSpace = THREE.SRGBColorSpace; document.body.style.margin = 0; document.body.style.background = 'transparent'; document.body.appendChild(r.domElement);
const sc = new THREE.Scene(); const pm = new THREE.PMREMGenerator(r); sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; sc.environmentIntensity = 0.85;
const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder);
const load = (u) => new Promise((res, rej) => L.load(u, res, undefined, rej));
window.__info = {};
(async () => {
  const g = await load('/assets/' + (Q.get('m') || 'claymore') + '.glb');
  const bb = new THREE.Box3().setFromObject(g.scene), sz = bb.getSize(new THREE.Vector3());
  const mats = []; g.scene.traverse((o) => { if (o.isMesh) mats.push({ n: o.name, m: o.material.name, c: o.material.color && o.material.color.getHexString(), me: o.material.metalness, ro: o.material.roughness, v: o.geometry.attributes.position.count }); });
  window.__info = { size: sz.toArray(), min: bb.min.toArray(), max: bb.max.toArray(), mats };
  window.__ready = true;
})();
window.__scene = sc; window.__cam = cam; window.__r = r; window.__THREE = THREE; window.__L = L;

// ---- the crossed blades (Quaternius CC0 claymore, re-skinned: bright steel, navy fittings, ice crystals, a cold rim light)
window.__build = async (opts = {}) => {
  const g = await load('/assets/claymore.glb');
  const rim = (m, k = 1.4, col = [0.2, 0.65, 1.0]) => { m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
    float rimK = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.4); totalEmissiveRadiance += vec3(${col.join(',')}) * rimK * ${k.toFixed(2)};`); }; return m; };
  const M = {
    DarkSteel: rim(new THREE.MeshStandardMaterial({ color: 0xaebfd8, metalness: 1, roughness: 0.26 }), 2.2),
    Black: rim(new THREE.MeshStandardMaterial({ color: 0x0c1b40, metalness: 0.9, roughness: 0.35 }), 1.0),
    DarkBrown: rim(new THREE.MeshStandardMaterial({ color: 0x14285a, metalness: 0.7, roughness: 0.5 }), 1.0),
    LightRed: new THREE.MeshStandardMaterial({ color: 0x9fe4ff, metalness: 0.2, roughness: 0.15, emissive: 0x2a9dff, emissiveIntensity: 1.4 }),
    Red: new THREE.MeshStandardMaterial({ color: 0x4fb4ff, metalness: 0.3, roughness: 0.2, emissive: 0x1c6dff, emissiveIntensity: 1.2 }),
  };
  const aura = new THREE.MeshBasicMaterial({ color: 0x2f9bff, side: THREE.BackSide, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const sword = () => { const s = g.scene.clone(true); s.traverse((o) => { if (o.isMesh) o.material = M[o.material.name] || M.DarkSteel; });
    const h = g.scene.clone(true); h.traverse((o) => { if (o.isMesh) { o.material = aura; o.scale.multiplyScalar(1.06); } });
    const w = new THREE.Group(); s.position.y = -3.0; h.position.y = -3.0; w.add(s, h); w.scale.set(1.55, 1, 2.2); return w; };
  const root = new THREE.Group(); sc.add(root);
  const a = sword(), b = sword(); a.rotation.z = -0.78; b.rotation.z = 0.78; a.rotation.y = 0.22; b.rotation.y = -0.22; a.position.z = 0.15; b.position.z = -0.15; root.add(a, b);
  const key = new THREE.DirectionalLight(0xdfeaff, 2.2); key.position.set(-3, 4, 5); sc.add(key);
  const back = new THREE.DirectionalLight(0x4aa8ff, 2.6); back.position.set(4, 1, -4); sc.add(back);
  cam.position.set(0, 0.4, 14.5); cam.lookAt(0, 0, 0); cam.fov = 26; cam.updateProjectionMatrix();
  root.rotation.x = 0.08; r.render(sc, cam); return true;
};
