// scatter lookdev: candidate rocks / bushes side by side (assets vs procedural sc_ rocks) — fast screenshots
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { parts } from '../bot/bluebot_v2/bluewall/client/src/assets.js';
import { rockGeometry, rockMaterial, rockMeshes, rockTint, rockKit, rockGroup } from '../bot/bluebot_v2/bluewall/client/src/sc_rocks.js';
import { buildBushes } from '../bot/bluebot_v2/bluewall/client/src/sc_bush.js';
(async () => {
  const Q = new URLSearchParams(location.search), view = Q.get('v') || 'assets';
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const names = (Q.get('m') || 'rockset1,rockset2,rock1,rock2,rock3,pebble1,pebble2,cliff1,cliff2,ez_bush_a,ez_bush_b,bush,bushf').split(',');
  const M = {}; await Promise.all(names.map(async (n) => { try { M[n] = await ld.loadAsync('assets/' + n + '.glb'); } catch (e) { console.warn(n, e); } }));
  const tl = new THREE.TextureLoader(), T = {};
  await Promise.all(['ph_mossrock', 'ph_mossrock_n', 'ph_cliff', 'ph_cliff_n', 'ph_rock', 'ph_grass2', 'RockTrim_BaseColor'].map((k) => new Promise((ok) => tl.load('assets/tex/' + k + '.webp', (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = k.endsWith('_n') ? THREE.NoColorSpace : THREE.SRGBColorSpace; T[k] = t; ok(); }, undefined, ok))));
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2; document.body.appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9cc0e0);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.35;
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x3a4a2a, 1.3)); const sun = new THREE.DirectionalLight(0xfff0d8, 3.2); sun.position.set(-40, 60, 30); sun.castShadow = true;
  sun.shadow.camera.left = -40; sun.shadow.camera.right = 40; sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40; sun.shadow.mapSize.set(2048, 2048); scene.add(sun);
  const gt = T.ph_grass2 || T.ph_rock; if (gt) gt.repeat.set(20, 20);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: T.ph_rock || null, color: 0xb0c090, roughness: 1 })); if (T.ph_rock) T.ph_rock.repeat.set(24, 24); ground.receiveShadow = true; scene.add(ground);
  const cam = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.3, 2000);
  window.__T = T; window.__scene = scene; window.__THREE = THREE; window.__M = M;
  const label = (txt, x, z) => { const c = document.createElement('canvas'); c.width = 256; c.height = 48; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.fillText(txt, 4, 34); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); s.scale.set(4, 0.75, 1); s.position.set(x, 0.3, z); scene.add(s); };
  if (view === 'assets') {
    let x = -26, z = -8;
    for (const n of names) {
      const g = M[n]; if (!g) continue;
      const ps = parts(g); const box = new THREE.Box3(); for (const p of ps) { p.geometry.computeBoundingBox(); box.union(p.geometry.boundingBox); }
      const sz = box.getSize(new THREE.Vector3()), k = (/bush/.test(n) ? 2.6 : /pebble/.test(n) ? 1.2 : 3.5) / Math.max(sz.x, sz.z, sz.y);
      const grp = new THREE.Group(); for (const p of ps) { const m = new THREE.Mesh(p.geometry, p.material); m.castShadow = m.receiveShadow = true; grp.add(m); }
      grp.scale.setScalar(k); grp.position.set(x - (box.min.x + sz.x / 2) * k, -box.min.y * k, z - (box.min.z + sz.z / 2) * k); scene.add(grp);
      label(n + ' ' + ps.length, x - 2, z + 3);
      x += 8; if (x > 26) { x = -26; z += 9; }
    }
    cam.position.set(0, 26, 30); cam.lookAt(0, 0, 2);
  } else if (view === 'parts') {      // every part of one multi-rock set
    const n = names[0], ps = parts(M[n]); let x = -20;
    ps.forEach((p, i) => { p.geometry.computeBoundingBox(); const b = p.geometry.boundingBox, sz = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()); const k = 4 / Math.max(sz.x, sz.z);
      const m = new THREE.Mesh(p.geometry, p.material); m.scale.setScalar(k); m.position.set(x - c.x * k, -b.min.y * k, -c.z * k); m.castShadow = m.receiveShadow = true; scene.add(m);
      label(i + ': ' + (p.geometry.index ? p.geometry.index.count / 3 : p.geometry.attributes.position.count / 3) + ' ' + sz.toArray().map((v) => v.toFixed(1)).join('x'), x - 2, 4); x += 6.5; });
    cam.position.set(0, 14, 26); cam.lookAt(0, 0, 0);
  } else if (view === 'rocks') {
    const det = +(Q.get('d') || 2), mat = rockMaterial(T, { snow: +(Q.get('snow') || 0), look: Q.get('look') || undefined }), kinds = ['boulder', 'slab', 'crag', 'stone'];
    const R = ((s) => () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296))(5);
    const ks = kinds.map((k, ki) => ({ geo: rockGeometry(11 + ki, det, k), list: [], colors: [] }));
    for (let row = 0; row < 4; row++) for (let i = 0; i < 4; i++) {
      const kd = ks[row], s = row === 3 ? 0.8 : 1.6 + R() * 0.6;
      kd.list.push(new THREE.Matrix4().compose(new THREE.Vector3(-15 + i * 9 + (row === 3 ? 0 : 0), 0, -12 + row * 8), new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - 0.5) * 0.3, R() * 6.28, (R() - 0.5) * 0.3)), new THREE.Vector3(s, s * (0.8 + R() * 0.4), s)));
      kd.colors.push(rockTint(R));
    }
    if (Q.get('glint')) { const gm = rockMaterial(T, { glint: true }); ks.forEach((k) => { k.glint = k.list.map(() => new THREE.Color(0x40e0ff).multiplyScalar(1.5)); }); rockMeshes(scene, gm, ks, { cast: true }); }
    else rockMeshes(scene, mat, ks, { cast: true });
    const tris = ks.reduce((a, k) => a + k.geo.attributes.position.count / 3, 0); label('tris/4 kinds ' + tris, -16, 16);
    cam.position.set(0, 14, 30); cam.lookAt(0, 0, -2);
  } else if (view === 'bushes') {
    // card bushes (front row) next to the real EZ shrub (left), rock groups behind
    const R = ((s) => () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296))(9), list = [];
    for (let i = 0; i < 7; i++) list.push({ x: -12 + i * 4, y: 0, z: 4 + (i % 2) * 2, s: 1.0 + R() * 1.0, ry: R() * 6.28, w: 1 + R() * 0.35 });
    for (let i = 0; i < 6; i++) list.push({ x: -10 + i * 4.5, y: 0, z: -3, s: 0.8 + R() * 0.8, ry: R() * 6.28, w: 1.1 });
    const sea = Q.get('season') ? { s: +Q.get('season'), p: 0.5 } : null;
    buildBushes(renderer, scene, { models: M }, list, { season: sea });
    if (M.ez_bush_a) { const ps = parts(M.ez_bush_a), b = new THREE.Box3(); ps.forEach((p) => { p.geometry.computeBoundingBox(); b.union(p.geometry.boundingBox); }); const k = 1.8 / (b.max.y - b.min.y), g = new THREE.Group(); ps.forEach((p) => { const m = new THREE.Mesh(p.geometry, p.material); m.castShadow = true; g.add(m); }); g.scale.setScalar(k); g.position.set(-17, -b.min.y * k, 4); scene.add(g); label('real', -18, 6.5); }
    const kit = rockKit(T, { level: 'high' }, { snow: sea && sea.s === 3 ? 0.8 : 0 });
    for (let i = 0; i < 5; i++) rockGroup(kit, R, -14 + i * 7, -10 - (i % 2) * 3, 0.8 + R() * 1.4, () => 0, () => true, {});
    kit.build(scene);
    cam.position.set(0, 6, 20); cam.lookAt(0, 1, -2);
  } else if (view === 'sc') {
    const mod = window.__sc; if (mod) mod({ THREE, scene, T, M, cam, renderer, label });
  }
  const camQ = Q.get('cam'); if (camQ) { const c = camQ.split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); }
  window.__frames = 0;
  const loop = () => { renderer.render(scene, cam); window.__frames++; requestAnimationFrame(loop); }; loop();
})();
