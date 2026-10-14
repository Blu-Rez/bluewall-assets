// axe lookdev: ?v=old|new|both &close=1 &giant=1 &t=0.4 (clip time) &prop=1 (prop alone, turntable angle &a=)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeAxe, axeProp, AXE_GRIP } from '../../bot/bluebot_v2/bluewall/client/src/gear_axe.js';
import { createKind } from '../../bot/bluebot_v2/bluewall/client/src/crowd.js';
import { tintGear } from '../../bot/bluebot_v2/bluewall/client/src/unitlook.js';
import { shieldModel } from '../../bot/bluebot_v2/bluewall/client/src/gear_shield.js';
import { mergeSkinned } from '../../bot/bluebot_v2/bluewall/client/src/creature.js';
(async () => {
  const Q = new URLSearchParams(location.search), V = Q.get('v') || 'both', W = innerWidth, H = innerHeight;
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(W, H); r.setPixelRatio(1); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = +(Q.get('ex') || 1.1); r.outputColorSpace = THREE.SRGBColorSpace; document.body.appendChild(r.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x8fb3d9);
  // a sky-ish environment: room env tinted by a blue dome
  const pm = new THREE.PMREMGenerator(r); const es = new RoomEnvironment(); scene.environment = pm.fromScene(es, 0.03).texture; scene.environmentIntensity = +(Q.get('ei') || 0.9);
  const sun = new THREE.DirectionalLight(0xfff1dd, 2.6); sun.position.set(-6, 10, 7); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = sc.bottom = -6; sc.right = sc.top = 6; scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xbcd4ff, 0x4a3d2c, 0.6));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0xd8dde4, roughness: 0.9 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const [pug, anims, oldAxe] = await Promise.all(['puglin', 'anims', 'axe'].map((n) => ld.loadAsync('../assets/' + n + '.glb')));
  const clip = anims.animations.find((c) => c.name === (Q.get('clip') || 'Sword_Idle'));
  const cam = new THREE.PerspectiveCamera(+(Q.get('fov') || 30), W / H, 0.05, 200);
  const list = V === 'both' ? ['old', 'new'] : V === 'all' ? ['old', 'new', 'blued'] : V.split(',');
  if (Q.get('crowd')) {                     // the battle path: a baked crowd kind with the axe as a prop (bunits.js)
    const [sm, an2, sh] = await Promise.all(['shieldmaiden', 'anims_army', 'shield_round2'].map((n) => ld.loadAsync('../assets/' + n + '.glb')));
    const rad = (d) => d * Math.PI / 180;
    if (Q.get('hair')) sm.scene.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) if (/Hair/i.test(m.name)) m.color.set('#' + Q.get('hair')); });
    const kind = createKind({ gltf: sm, anims: { animations: [...anims.animations, ...an2.animations] }, clips: ['Idle_Shield_Loop', 'Sword_Regular_A', 'Walk_Loop'],
      props: [{ gltf: axeProp({ blued: true }), bone: 'hand_r', s: 0.75, pos: AXE_GRIP.pos, rot: AXE_GRIP.rotDeg.map(rad) }, { gltf: shieldModel(sh, 'round', 0.22), bone: 'hand_l', s: 0.22, pos: [0, 0.05, 0.05], rot: [0, 90, 0].map(rad) }], capacity: 4, hue: true });
    tintGear(kind, +(Q.get('tier') || 2)); scene.add(kind.group);
    const cl = ['Idle_Shield_Loop', 'Sword_Regular_A', 'Walk_Loop'];
    const yaws = (Q.get('yaw') || '0.35,0.9,0.2').split(',').map(Number), offs = (Q.get('off') || '0.3,0.28,0.3').split(',').map(Number);
    cl.forEach((c, i) => { if (Q.get('one') && i) return; const p = kind.add({ x: Q.get('one') ? 0 : (i - 1) * 2.7, z: 0, yaw: yaws[i], scale: 3.0 }); p.play(c, { fade: false, offset: offs[i] }); });
    cam.position.set(0, +(Q.get('cy') || 3.4), +(Q.get('cz') || 9.5)); cam.lookAt(0, +(Q.get('ly') || 2.5), 0);
    window.__info = JSON.stringify({ meshes: kind.group.children.length, info: Object.keys(kind.info) });
    let n = 0, t = 0.3; const loop = () => { t += 1 / 30; kind.update(t, cam); r.render(scene, cam); n++; window.__frames = n; if (n < 12) requestAnimationFrame(loop); }; loop(); return;
  } else if (Q.get('maiden')) {                    // the shieldmaiden hero as in battle (bunits.js): sword_mw 0.2 in hand_r, round shield in hand_l
    const [sm, an2, sw, sh] = await Promise.all(['shieldmaiden', 'anims_army', 'sword_mw', 'shield_round2'].map((n) => ld.loadAsync('../assets/' + n + '.glb')));
    const clips = [...anims.animations, ...an2.animations]; const cl = clips.find((c) => c.name === (Q.get('clip') || 'Idle_Shield_Loop'));
    mergeSkinned(sm.scene); const root = SkeletonUtils.clone(sm.scene); root.scale.setScalar(3.0); root.rotation.y = +(Q.get('ry') || 0.6); scene.add(root);
    root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    const at = (g, bone, s, rot) => { const o = g.scene.clone(true); o.scale.setScalar(s); o.rotation.set(...rot); root.getObjectByName(bone).add(o); };
    if (Q.get('axe')) { const o = makeAxe({ blued: true }); o.scale.setScalar(+(Q.get('s') || 0.75)); o.rotation.set(...(Q.get('rot') || '0,0,-90').split(',').map((d) => +d * Math.PI / 180)); o.position.set(...(Q.get('p') || '0,0,0').split(',').map(Number)); root.getObjectByName('hand_r').add(o); }
    else at(sw, 'hand_r', 0.2, [0, 0, -Math.PI / 2]);
    at(sh, 'hand_l', 0.22, [0, Math.PI / 2, 0]);
    const mx = new THREE.AnimationMixer(root); mx.clipAction(cl).play(); mx.update(+(Q.get('t') || 0.5));
    root.updateMatrixWorld(true); { const hand = root.getObjectByName('hand_r'), inv = hand.matrixWorld.clone().invert(), out = {};
      for (const n of ['index_01_r', 'index_02_r', 'middle_01_r', 'middle_02_r', 'middle_03_r', 'ring_01_r', 'ring_02_r', 'pinky_01_r', 'pinky_02_r', 'thumb_01_r', 'thumb_02_r', 'thumb_03_r']) { const b = root.getObjectByName(n); if (b) out[n] = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld).applyMatrix4(inv).toArray().map((v) => +v.toFixed(3)); }
      const hs = new THREE.Vector3(); hand.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), hs); out.scale = hs.toArray(); window.__out = JSON.stringify(out); console.warn('BONES', window.__out);
      if (Q.get('hc')) { const hp = new THREE.Vector3().setFromMatrixPosition(hand.matrixWorld); cam.position.copy(hp).add(new THREE.Vector3(+(Q.get('hx') || 0.6), +(Q.get('hy') || 0.3), +(Q.get('hz') || 1.6))); cam.lookAt(hp); } }
    if (!Q.get('hc')) { cam.position.set(0, +(Q.get('cy') || 3.4), +(Q.get('cz') || 9)); cam.lookAt(0, +(Q.get('ly') || 2.6), 0); }
  } else if (Q.get('m')) {                         // any packed models side by side, at their own scale ×k
    const names = Q.get('m').split(','), k = +(Q.get('k') || 3);
    const gs = await Promise.all(names.map((n) => ld.loadAsync('../assets/' + n + '.glb')));
    gs.forEach((g, i) => { const o = g.scene; o.scale.setScalar(k); const b = new THREE.Box3().setFromObject(o); console.log('BOX', names[i], JSON.stringify([b.min.toArray(), b.max.toArray()])); o.position.set((i - (names.length - 1) / 2) * +(Q.get('dx') || 2.5), -b.min.y + 0.01, 0); o.rotation.y = +(Q.get('a') || 0); scene.add(o); o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); });
    cam.position.set(0, +(Q.get('cy') || 2), +(Q.get('cz') || 9)); cam.lookAt(0, +(Q.get('ly') || 1.5), 0);
  } else if (Q.get('prop') === '1') {
    list.forEach((k, i) => { const o = k === 'old' ? oldAxe.scene.clone(true) : makeAxe({ blued: k === 'blued' }); o.scale.setScalar(4.2); o.position.set((i - (list.length - 1) / 2) * 2.2, k === 'old' ? 1.8 : 1.36, 0); o.rotation.y = +(Q.get('a') || 0.5); o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); scene.add(o); });
    cam.position.set(0, 2.6, 9.8); cam.lookAt(0, 2.35, 0);
  } else {
    list.forEach((k, i) => {
      if (k !== 'old') { const st = pug.scene.getObjectByName('Puglin_Stick'); if (st && st.parent && !pug.scene.userData.bwMerged) st.parent.remove(st); }
      mergeSkinned(pug.scene); const root = SkeletonUtils.clone(pug.scene); root.scale.setScalar(4.2); root.position.x = (i - (list.length - 1) / 2) * 5.5; root.rotation.y = +(Q.get('ry') || -0.5);
      root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
      const hand = root.getObjectByName('hand_r'); const o = k === 'old' ? oldAxe.scene.clone(true) : makeAxe(); o.rotation.set(...(Q.get('rot') || '0,0,-90').split(',').map((d) => +d * Math.PI / 180)); o.position.set(...(Q.get('p') || '0,0,0').split(',').map(Number)); hand.add(o);
      scene.add(root); const mx = new THREE.AnimationMixer(root); const a = mx.clipAction(clip); a.play(); mx.update(+(Q.get('t') || 0.4));
      root.updateMatrixWorld(true); { const hand = root.getObjectByName('hand_r'), inv = hand.matrixWorld.clone().invert(), out = {};
        for (const n of ['index_01_r', 'index_02_r', 'middle_01_r', 'middle_02_r', 'middle_03_r', 'ring_01_r', 'ring_02_r', 'thumb_01_r', 'thumb_02_r', 'thumb_03_r']) { const b = root.getObjectByName(n); if (b) out[n] = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld).applyMatrix4(inv).toArray().map((v) => +v.toFixed(3)); }
        window.__out = JSON.stringify(out);
        if (Q.get('hc')) { const hp = new THREE.Vector3().setFromMatrixPosition(hand.matrixWorld); cam.position.copy(hp).add(new THREE.Vector3(+(Q.get('hx') || 1.5), +(Q.get('hy') || 0.6), +(Q.get('hz') || 3.5))); cam.lookAt(hp); window.__hc = true; } }
    });
    if (Q.get('close') === '1') { scene.updateMatrixWorld(true); const b = new THREE.Box3(); scene.traverse((o) => { if (o.name === 'war_axe' || o.name === 'Axe_Bronze') b.expandByObject(o); }); const c = b.getCenter(new THREE.Vector3()); const sz = b.getSize(new THREE.Vector3()).length();
      cam.position.set(c.x + sz * 0.15, c.y + sz * 0.15, c.z + sz * 1.25); cam.lookAt(c); }
    else if (!window.__hc) { cam.position.set(0, 4.5, 17); cam.lookAt(0, 3.2, 0); }
  }
  let n = 0; const loop = () => { r.render(scene, cam); n++; window.__frames = n; if (n < 6) requestAnimationFrame(loop); }; loop();
})();
