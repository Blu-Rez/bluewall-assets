// Dragon / baby-dragon portraits for the unit orbs: the REAL battle model path (bdragon_live.js createLiveKind = the home dragon's skin recipe + the red tint of the attack)
// rendered to transparent stills.  window.__run([{look, t, az, el, d, ty, tx, fov, s}]) -> [dataURL...]
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createLiveKind, LIVE_LOOK } from '../../bot/bluebot_v2/bluewall/client/src/bdragon_live.js';
import { prowlerFly } from '../../bot/bluebot_v2/bluewall/client/src/bdragon.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await ld.loadAsync('/assets/prowler.glb'); prowlerFly(gltf);
  const S0 = 384;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(S0, S0);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.88; renderer.setClearColor(0x000000, 0);
  document.body.style.cssText = 'margin:0;background:#2b3a55'; document.body.appendChild(renderer.domElement);
  const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const scene = new THREE.Scene(); scene.environment = env; scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x4a3a30, 0.8));
  const key = new THREE.DirectionalLight(0xfff0d8, 3.0); key.position.set(-30, 40, 40); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fb8ff, 2.2); rim.position.set(30, 12, -30); scene.add(rim);
  const kinds = {};
  const kind = (look) => {
    if (kinds[look]) return kinds[look];
    const k = createLiveKind({ gltf, look: LIVE_LOOK[look], key: 'P' + look }); const p = k.add({ x: 0, y: 0, z: 0, yaw: 0, scale: 1 }); p.play('Fly', { fade: false }); scene.add(k.group);
    return (kinds[look] = { k, p });
  };
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 2000);
  window.__run = async (list) => {
    const out = [];
    for (const c of list) {
      const { k, p } = kind(c.look || 'dragon');
      for (const o of Object.values(kinds)) o.k.group.visible = o === kinds[c.look || 'dragon'];
      const s = c.s || 384; renderer.setSize(s, s);
      const act = p._act; act.time = (c.t || 0) % act.getClip().duration; p.c.mixer.update(0);
      p.yaw = c.yaw || 0; p.pitch = c.pitch || 0; p.roll = c.roll || 0; p.scale = 1; p.x = p.y = p.z = 0; k.update(0, cam);
      p.c.root.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(p.c.root, true), ctr = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
      window.__bb = [sz.x, sz.y, sz.z, ctr.x, ctr.y, ctr.z].map((v) => +v.toFixed(2));
      // the look-at point: the head end of the body (the model's head is at +z or -z: c.hz picks), shifted by tx/ty
      const az = c.az || 0.6, el = c.el || 0.15, d = c.d || 30, fov = c.fov || 30;
      cam.fov = fov; cam.aspect = 1; cam.updateProjectionMatrix();
      const tgt = new THREE.Vector3(ctr.x + (c.tx || 0), ctr.y + (c.ty || 0), ctr.z + (c.tz || 0));
      cam.position.set(tgt.x + Math.sin(az) * Math.cos(el) * d, tgt.y + Math.sin(el) * d, tgt.z + Math.cos(az) * Math.cos(el) * d); cam.lookAt(tgt); cam.updateMatrixWorld(true);
      k.update(0.0001, cam);
      renderer.render(scene, cam); out.push(renderer.domElement.toDataURL('image/png'));
    }
    return out;
  };
  window.__clips = gltf.animations.map((a) => a.name + ':' + a.duration.toFixed(2)).join(',');
  window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
