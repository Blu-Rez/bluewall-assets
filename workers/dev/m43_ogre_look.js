// m43_ogre_look.js — the Behemoth ogre through the REAL crowd path (u2_looks.js setupU2 -> crowd.js createKind): the held stance + the attack clip at several times; prints the skinned bounding box of the model and of the old ogre.glb
//   ?tier=0..5  &sc=<scale override>  &yaw=0.5  &cam=1  &ts=0,0.15,0.3,...  (attack clip times, fraction of the clip)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { setupU2, U2_TYPE } from '../bot/bluebot_v2/bluewall/client/src/u2_looks.js';
(async () => {
  const Q = new URLSearchParams(location.search), tier = +(Q.get('tier') || 0);
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder); const M = {};
  M.u2_ogre = await ld.loadAsync('assets/u2_ogre.glb'); const old = await ld.loadAsync('assets/ogre.glb');
  const bb = (g) => { g.scene.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(g.scene, true), s = b.getSize(new THREE.Vector3()); return [+s.x.toFixed(3), +s.y.toFixed(3), +s.z.toFixed(3)]; };
  window.__bbox = { behemoth: bb(M.u2_ogre), old_ogre_glb: bb(old) };
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1; document.body.appendChild(renderer.domElement); document.body.style.margin = 0;
  const scene = new THREE.Scene(); const PORT = Q.get('port'); scene.background = new THREE.Color(PORT ? parseInt(Q.get('bg') || '000000', 16) : 0x8fb6dc);
  scene.add(new THREE.HemisphereLight(0xdfefff, 0x4a5a3a, 1.6)); const sun = new THREE.DirectionalLight(0xfff2dd, 2.6); sun.position.set(30, 50, 40); scene.add(sun);
  if (!PORT) scene.add(new THREE.Mesh(new THREE.CircleGeometry(300, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6f8f4a, roughness: 1 })));
  const K = {}, G = new THREE.Group(); scene.add(G); const step = async (name, f) => { K[name] = f(); G.add(K[name].group); };
  await setupU2({ M, step, count: { ogre: 12 }, TT: { ogre: tier }, K });
  const P = U2_TYPE.ogre.parts[0], sc = +(Q.get('sc') || P.scale), GAP = +(Q.get('gap') || 14);
  const ts = (Q.get('ts') || '0,0.12,0.25,0.4,0.55,0.7,0.85').split(',').map(Number), cols = PORT ? [[Q.get('st') || 'Stand', +(Q.get('pt') || 0)]] : [['Stand', 0], ...ts.map((t) => ['Punch', t])];
  cols.forEach(([nm, f], c) => {
    const p = K.ogre.add({ x: (c - (cols.length - 1) / 2) * GAP, y: 0, z: 0, yaw: +(Q.get('yaw') || 0.5), scale: sc }); const dur = K.ogre.info[nm].dur;
    p.play(nm, { fade: false, speed: 0.001, offset: (f * dur) / 0.001 });
  });
  const cam = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 1, 2000), D = +(Q.get('cam') || 1) * GAP * cols.length * 2.0;
  if (PORT) { const pd = +Q.get('pd'), py = +Q.get('py'), up = +(Q.get('up') || 0.2); cam.position.set(0, py + pd * up, pd); cam.lookAt(0, py, 0); } else { cam.position.set(0, D * 0.3, D * 0.95); cam.lookAt(0, 5, 0); } cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  window.__frames = 0; const t0 = performance.now();
  const loop = () => { const t = (performance.now() - t0) / 1000; for (const k of Object.values(K)) { k.group.userData.now = t; k.update(t, cam); } renderer.render(scene, cam); window.__frames++;
    window.__stats = { calls: renderer.info.render.calls, tris: renderer.info.render.triangles, programs: renderer.info.programs.length, bbox: window.__bbox, scale: sc, dur: K.ogre.info.Punch.dur }; requestAnimationFrame(loop); };
  requestAnimationFrame(loop); window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
