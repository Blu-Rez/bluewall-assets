// dev-only bundle (TR2-S4d): the Tripo animals + villagers of tr2_life.js on a plain ground — frames and numbers for the report
import * as THREE from 'three';
import TL, { preload, fauna, horses, people, gltfLike, dyn, state } from '../../bot/bluebot_v2/bluewall/client/src/tr2_life.js';
import { tr2 } from '../../bot/bluebot_v2/bluewall/client/src/tr2lib.js';
(async () => {
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x8fb0d8);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x556644, 1.5)); const sun = new THREE.DirectionalLight(0xfff2dd, 2.6); sun.position.set(40, 80, 30); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x6d8a55, roughness: 1 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 3000);
  await tr2.init({ base: 'assets/tr2/' });
  await preload();
  const res = { ok: state.ok, has: state.has, err: state.err };
  window.__res = res;
  const kinds = [];
  const place = (k, specs) => { scene.add(k.group); kinds.push(k); return specs.map((s) => k.add(s)); };
  // ---- animals (row z = 0): species, scale-1 length from the game's slots
  const SP = [['animal_cow', 4.9], ['animal_calf', 3.0], ['animal_sheep', 1.6], ['animal_lamb', 1.0], ['animal_pig', 1.8], ['animal_dog', 2.2], ['animal_wolf', 2.8]];
  let x = -26; const animals = {};
  const hs = horses({ len: 5.6 }); scene.add(hs.group); kinds.push(hs);
  const modes = ['Idle', 'Eating', 'Walk', 'Trot']; res.horses = [];
  [0, 1, 2].forEach((c) => { const p = hs.add({ x: x + c * 7, z: 0, yaw: 0.5, coat: c }); p.play(modes[c]); res.horses.push([c, modes[c]]); });
  const p4 = hs.add({ x: x + 21, z: 0, yaw: 0.5, coat: 2 }); p4.play('Trot'); x += 30;
  for (const [sp, len] of SP) { const k = fauna(sp, { len, capacity: 8 }); animals[sp] = k; scene.add(k.group); kinds.push(k); const p = k.add({ x, z: 0, yaw: 0.5 }); p.play('Idle'); x += len + 4; }
  // ---- villagers (row z = 14): 4 kinds, each: idle, walk, walk
  res.people = {}; let vx = -12;
  for (const key of ['villager_man', 'villager_woman', 'villager_youngman', 'villager_oldman']) {
    const k = people(key, { capacity: 12, lod2: { cloth: 0x6e5a42, legs: 0x3b3129, h: 1.8 } }); if (!k) { res.people[key] = 'missing'; continue; }
    scene.add(k.group); kinds.push(k);
    const a = k.add({ x: vx, z: 14, yaw: 0, clip: 'Idle_Loop' }), b = k.add({ x: vx + 3, z: 14, yaw: 0, clip: 'Walk_Loop', phase: 0.4 }), c = k.add({ x: vx + 6, z: 14, yaw: Math.PI / 2, clip: 'Fixing_Kneeling' });
    res.people[key] = { height: k.height, k: +k.study.k.toFixed(3), minY: +k.study.minY.toFixed(3), rawH: +k.study.height.toFixed(3), tf: +k.study.tf.toFixed(3), feetSep: +k.study.feetSep.toFixed(3), walkSpeed: +k.stats.walkSpeed.toFixed(3), clips: Object.keys(k.info), drawn0: 0 };
    vx += 10;
  }
  // ---- birds (static flying poses through creature-style gltfLike), poultry (dyn)
  res.birds = {};
  for (const sp of ['birds/eagle', 'birds/crow', 'birds/dove']) { const g = gltfLike(sp, { w: 4 }); if (!g) { res.birds[sp] = 'missing'; continue; } const m = g.scene; m.position.set(-20 + Object.keys(res.birds).length * 8, 6, -12); scene.add(m); const b = new THREE.Box3().setFromObject(m); res.birds[sp] = b.getSize(new THREE.Vector3()).toArray().map((v) => +v.toFixed(2)); }
  const hens = {};
  for (const [sp, w, h] of [['poultry_fish_pack/hen', 0, 0.8], ['poultry_fish_pack/rooster', 0, 0.95], ['poultry_fish_pack/chick', 0, 0.35], ['poultry_fish_pack/carp', 1.1, 0], ['poultry_fish_pack/trout', 0.9, 0]]) {
    const d = dyn(sp, 4, { parent: scene, w: w || undefined, h: h || undefined }); if (!d) { hens[sp] = 'missing'; continue; }
    const mt = new THREE.Matrix4().makeTranslation(14 + Object.keys(hens).length * 1.6, 0.0, -12); d.set(0, mt); d.flush(1); hens[sp] = d.meshes.length;
  }
  res.dyn = hens;
  const cam = window.__cam = { x: 0, y: 14, z: 46, tx: 0, ty: 1.5, tz: 4 };
  let t = 0; const clock = new THREE.Clock(); window.__frames = 0;
  function frame() {
    const dt = Math.min(0.05, clock.getDelta()); t += dt;
    camera.position.set(cam.x, cam.y, cam.z); camera.lookAt(cam.tx, cam.ty, cam.tz); camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    for (const k of kinds) k.update(t, camera, { lodDist: 70, lod2Dist: k.people ? (window.__lod2 || 1e9) : 1e9, maxDist: 900 });
    renderer.render(scene, camera); window.__frames++; requestAnimationFrame(frame);
  }
  window.__tr2 = tr2; window.__renderer = renderer; window.__kinds = kinds; window.__scene = scene; window.__res = res; window.__camera = camera;
  frame(); window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
