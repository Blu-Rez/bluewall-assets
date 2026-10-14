// hd_lab: peasant heads on the 'Head' bone (regular skinned path) — front / side / game-like view, man + woman
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { peasantHead } from '../../bot/bluebot_v2/bluewall/client/src/peasanthead.js';
const Q = new URLSearchParams(location.search);
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const [m, f, an] = await Promise.all(['peasant_m', 'peasant_f', 'anims'].map((n) => ld.loadAsync('../assets/' + n + '.glb')));
  const W = 1200, H = 520, r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(W, H); r.setPixelRatio(1); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.setScissorTest(true);
  document.body.style.margin = 0; document.body.appendChild(r.domElement);
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0xc9b98f);
  { const pm = new THREE.PMREMGenerator(r); sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; sc.environmentIntensity = 0.7; }
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.4); sun.position.set(3, 6, 4); sc.add(sun);
  const mix = [];
  [[m, false, -0.6], [f, true, 0.6]].forEach(([g, fem, x], i) => {
    const root = SkeletonUtils.clone(g.scene); root.position.set(x, 0, 0); sc.add(root);
    const head = root.getObjectByName('Head'); if (head && !Q.get('nohead')) head.add(peasantHead(fem, i));
    const mx = new THREE.AnimationMixer(root); const cl = an.animations.find((a) => a.name === (Q.get('clip') || 'Idle_Talking_Loop'));
    if (cl) { const a = mx.clipAction(new THREE.AnimationClip(cl.name, cl.duration, cl.tracks.filter((t) => root.getObjectByName(t.name.split('.')[0])))); a.play(); mx.setTime(0.8); }
    root.updateMatrixWorld(true); mix.push(root);
  });
  const hp = new THREE.Vector3(); mix[0].getObjectByName('Head').getWorldPosition(hp);
  const hf = new THREE.Vector3(); mix[1].getObjectByName('Head').getWorldPosition(hf);
  const mid = hp.clone().add(hf).multiplyScalar(0.5);
  // [cam position, target, fov]
  const views = [[[hp.x, hp.y + 0.03, hp.z + 1.1], [hp.x, hp.y + 0.1, hp.z], 14], [[hp.x + 1.1, hp.y + 0.03, hp.z], [hp.x, hp.y + 0.1, hp.z], 14], [[hf.x + 0.7, hf.y + 0.5, hf.z + 0.9], [hf.x, hf.y + 0.1, hf.z], 14], [[5, 9.5, 11], [0, 0.8, 0], 20]];
  const pw = W / views.length;
  views.forEach((v, k) => { const c = new THREE.PerspectiveCamera(v[2], pw / H, 0.1, 80); c.position.set(...v[0]); c.lookAt(...v[1]); r.setViewport(k * pw, 0, pw, H); r.setScissor(k * pw, 0, pw, H); r.render(sc, c); });
  window.__ready = true;
})().catch((e) => { document.title = 'ERR'; console.error(e); window.__err = String(e.stack || e); });
