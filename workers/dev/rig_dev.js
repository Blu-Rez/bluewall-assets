import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { makeDragonModel, makeWingModel } from '../bot/bluebot_v2/bluewall/client/src/brigs.js';
import { createKind } from '../bot/bluebot_v2/bluewall/client/src/crowd.js';
(async () => {
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(1); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.9; } scene.background = new THREE.Color(0x9ec7ee);
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x556644, 1.2)); const sun = new THREE.DirectionalLight(0xfff0d8, 2.6); sun.position.set(30, 60, 40); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x6b8a4a, roughness: 1 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const dm = makeDragonModel(), wm = makeWingModel();
  const kd = createKind({ gltf: dm.gltf, anims: dm.anims, clips: ['Fly', 'Glide', 'Breath', 'Idle', 'Walk', 'Death'], capacity: 8 });
  const kw = createKind({ gltf: wm.gltf, anims: wm.anims, clips: ['Fly', 'Glide', 'Idle', 'Death'], capacity: 8 });
  scene.add(kd.group, kw.group);
  const clips = ['Fly', 'Glide', 'Breath', 'Idle', 'Walk', 'Death'];
  clips.forEach((c, i) => { const p = kd.add({ x: -22 + i * 9, y: (c === 'Fly' || c === 'Glide' || c === 'Breath') ? 6 : 0, z: 0, yaw: 0.6, scale: 0.8 }); p.play(c); });
  ['Fly', 'Glide', 'Idle', 'Death'].forEach((c, i) => { const p = kw.add({ x: -12 + i * 8, y: 4, z: 20, yaw: 0.6, scale: 1.2 }); p.play(c); });
  // the horse for the pegasus
  let horseInfo = null;
  try {
    const hw = await ld.loadAsync('assets/horse_white.glb'); const hk = createKind({ gltf: hw, anims: { animations: hw.animations }, clips: ['Walk', 'Gallop', 'Idle'], capacity: 8, hue: false }); scene.add(hk.group);
    const box = new THREE.Box3().setFromObject(hw.scene, true), sz = box.getSize(new THREE.Vector3()); horseInfo = { size: sz.toArray(), min: box.min.toArray(), max: box.max.toArray() };
    const HS = 0.9; const hp = hk.add({ x: 0, y: 0, z: 30, yaw: 0.6, scale: HS }); hp.play('Walk'); window.__hk = hk; window.__HS = HS;
    const hw2 = kw.add({ x: 0, y: 2.3, z: 30, yaw: 0.6, scale: 1.0 }); hw2.play('Fly'); window.__hw2 = hw2;
  } catch (e) { horseInfo = 'ERR ' + e; }
  try {
    const hb = await ld.loadAsync('assets/horse_m2m_bay.glb'), kn = await ld.loadAsync('assets/knight_k3.glb');
    const kh = createKind({ gltf: hb, anims: { animations: hb.animations }, clips: ['Walk', 'Trot', 'Gallop', 'Idle'], capacity: 8 });
    const kk = createKind({ gltf: kn, anims: { animations: kn.animations }, clips: ['Ride'], capacity: 8 });
    scene.add(kh.group, kk.group); window.__kh = kh; window.__kk = kk;
    window.__riders = []; [['Walk', 0], ['Gallop', 1]].forEach(([c, i]) => { const h = kh.add({ x: 14 + i * 9, y: 0, z: 30, yaw: 1.2, scale: 1.0 }); h.play(c); const r = kk.add({ x: 14 + i * 9, y: 2.0, z: 30, yaw: 1.2, scale: 1.45 }); r.play('Ride'); window.__riders.push([h, r]); });
    window.__seat = { y: 0.55, z: -0.1, s: 0.95 };
  } catch (e) { window.__info = (window.__info && window.__info.size ? window.__info : {}); window.__info.err2 = String(e); }
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.5, 2000);
  const cam = window.__cam = { x: 0, y: 14, z: 46, tx: 0, ty: 3, tz: 0 };
  const clock = new THREE.Clock(); let t = 0;
  function frame() { t += Math.min(0.05, clock.getDelta()); kd.update(t, camera); kw.update(t, camera); if (window.__hk) window.__hk.update(t, camera); if (window.__kh) { for (const [h, r] of window.__riders) { const S = window.__seat, c = Math.cos(h.yaw), n = Math.sin(h.yaw); r.x = h.x + n * S.z; r.z = h.z + c * S.z; r.y = h.y + S.y; r.yaw = h.yaw; r.scale = S.s; } window.__kh.update(t, camera); window.__kk.update(t, camera); } camera.position.set(cam.x, cam.y, cam.z); camera.lookAt(cam.tx, cam.ty, cam.tz); renderer.render(scene, camera); window.__frames = (window.__frames || 0) + 1; requestAnimationFrame(frame); }
  window.THREE = THREE; window.__camera = camera; window.__info = horseInfo; window.__renderer = renderer; window.__sc = { kd, kw }; frame(); window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
