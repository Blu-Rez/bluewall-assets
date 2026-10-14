// lookdev: soldier tiers 0..5 (v=tiers&u=spear|sword|archer), v=shields (&close=1&t=0..5&e=crest&night=1), v=plume (&t=tier&raw=1&kit=1), v=pegasus (&look=pearl|storm|snow&rest=1),
// the green dragonling next to the red baby dragon / blue dragon, a Tesla coil on a tower — fast screenshots
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { createKind } from '../bot/bluebot_v2/bluewall/client/src/crowd.js';
import { CLOTH, GLINT, kit, tintGear, tierScale } from '../bot/bluebot_v2/bluewall/client/src/unitlook.js';
import { createTesla } from '../bot/bluebot_v2/bluewall/client/src/tesla.js';
import { grayTex } from '../bot/bluebot_v2/bluewall/client/src/util.js';
import { shieldModel, setShieldCrest } from '../bot/bluebot_v2/bluewall/client/src/gear_shield.js';
import { dressKnight, setPlumeTier, KIT } from '../bot/bluebot_v2/bluewall/client/src/gear_plume.js';
import { dressPegasus } from '../bot/bluebot_v2/bluewall/client/src/gear_pegasus.js';
import { makeCreature } from '../bot/bluebot_v2/bluewall/client/src/creature.js';
(async () => {
  const Q = new URLSearchParams(location.search), view = Q.get('v') || 'tiers';
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const names = ['ranger_m', 'anims', 'anims_army', 'helmet2', 'helmet3', 'spear', 'shield_heater', 'shield_round2', 'shield', 'sword', 'claymore', 'bow', 'shieldmaiden', 'sword_mw',
    ...(/plume|pegasus/.test(view) ? ['knight_k3', 'horse_m2m_bay', 'horse_m2m_grey', 'pegasus'] : []), ...(/dragons|port/.test(view) ? ['dragonling', 'prowler'] : [])];
  const M = {}; await Promise.all(names.map(async (n) => { try { M[n] = await ld.loadAsync('assets/' + n + '.glb'); } catch (e) { console.warn(n, e); } }));
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1; document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x8fb6dc);
  scene.add(new THREE.HemisphereLight(0xdfefff, 0x4a5a3a, 1.6)); const sun = new THREE.DirectionalLight(0xfff2dd, 2.6); sun.position.set(30, 50, 40); scene.add(sun);
  { // a sky-ish environment (the world builds one from its sky): bright zenith, hazy horizon, green-brown ground
    const es = new THREE.Scene(), sg = new THREE.SphereGeometry(50, 32, 16), cl = [];
    const night = !!Q.get('night'), top = new THREE.Color(night ? 0x0a1430 : 0x5d8fd0), hor = new THREE.Color(night ? 0x22305a : 0xcfe2f5), gnd = new THREE.Color(night ? 0x0c120c : 0x4d5a36);
    for (let i = 0; i < sg.attributes.position.count; i++) { const y = sg.attributes.position.getY(i) / 50, c = y > 0 ? hor.clone().lerp(top, Math.pow(y, 0.6)) : hor.clone().lerp(gnd, Math.min(1, -y * 4)); cl.push(c.r, c.g, c.b); }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
    es.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const sunb = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 6), new THREE.MeshBasicMaterial({ color: night ? 0x8090c0 : 0xfff4dd })); sunb.position.set(25, 35, 28); es.add(sunb);
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(es, 0.02).texture;
    if (night) { scene.background = new THREE.Color(0x0b1430); }
  }
  const ground = new THREE.Mesh(new THREE.CircleGeometry(200, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6f8f4a, roughness: 1 })); scene.add(ground);
  const cam = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.5, 2000);
  const kinds = []; const t0 = performance.now();
  const ANIMS = { animations: [...M.anims.animations, ...(M.anims_army ? M.anims_army.animations : [])] };
  const rad = (d) => (d * Math.PI) / 180, pr = (g, bone, s, pos, rot) => (g ? { gltf: g, bone, s, pos, rot: rot.map(rad) } : null);
  if (Q.get('night')) setTimeout(() => scene.children.forEach((o) => { if (o.isLight) o.intensity *= o.isHemisphereLight ? 0.22 : 0.18; }), 0);
  if (Q.get('e')) setShieldCrest(Q.get('e'));
  if (view === 'shields') {                                          // spearmen of every tier, a guard and the shieldmaiden: the kit + shields (?close=1 one shield up close)
    const SH = (sh, s) => sh === 'round' ? pr(shieldModel(M.shield_round2, 'round', s || 0.25), 'hand_l', s || 0.25, [0, 0.05, 0.05], [0, 90, 0]) : pr(shieldModel(M.shield_heater, 'heater', 0.27), 'hand_l', 0.27, [0, 0.05, 0.05], [0, 90, 0]);
    const close = Q.get('close'), N = close ? 1 : 6, t0 = +(Q.get('t') || 0);
    for (let i = 0; i < N; i++) {
      const t = close ? t0 : i, k = kit('spear', Math.max(1, t)), helm = k.helm ? pr(M[k.helm], 'Head', 0.17, [0, 0.03, 0], [0, 0, 0]) : null;
      const kd = createKind({ gltf: M.ranger_m, anims: ANIMS, clips: ['Idle_Shield_Loop', 'Walk_Loop'], props: [helm, pr(M.spear, 'hand_r', 0.23, [0.00819, -0.15451, 0.16751], [-34.632, -34.359, -171.054]), SH('heater')].filter(Boolean), capacity: 4, hue: true, cloth: CLOTH[t], tier: t });
      tintGear(kd, t); scene.add(kd.group); kinds.push(kd);
      const p = kd.add({ x: (i - (N - 1) / 2) * 3.4, y: 0, z: 0, yaw: rad(+(Q.get('yaw') || 25)), scale: 2.55 * tierScale(t) }); p.play(Q.get('clip') || 'Idle_Shield_Loop', { fade: false, offset: i * 0.3 });
    }
    if (!close) {
      const gd = createKind({ gltf: M.ranger_m, anims: ANIMS, clips: ['Sword_Idle'], props: [pr(M.helmet2, 'Head', 0.17, [0, 0.03, 0], [0, 0, 0]), pr(M.sword, 'hand_r', 0.9, [0, 0, 0], [0, 0, -90]), SH('round')], capacity: 4, hue: true, cloth: CLOTH[2], tier: 2 });
      scene.add(gd.group); kinds.push(gd); gd.add({ x: -4, y: 0, z: 7, yaw: rad(10), scale: 2.55 }).play('Sword_Idle', { fade: false });
      const eg = createKind({ gltf: M.ranger_m, anims: ANIMS, clips: ['Sword_Idle'], props: [pr(M.sword, 'hand_r', 0.9, [0, 0, 0], [0, 0, -90]), SH('round')], capacity: 4, hue: 'red', crest: 'foe', tier: 1 });
      scene.add(eg.group); kinds.push(eg); eg.add({ x: 0, y: 0, z: 7, yaw: rad(-10), scale: 2.55 }).play('Sword_Idle', { fade: false });
      if (M.shieldmaiden) { const hm = createKind({ gltf: M.shieldmaiden, anims: ANIMS, clips: ['Sword_Idle'], props: [pr(M.sword_mw, 'hand_r', 0.17, [0, 0, 0], [0, 0, -90]), SH('round', 0.22)], capacity: 2, hue: true, cloth: CLOTH[3], tier: 3 });
        scene.add(hm.group); kinds.push(hm); hm.add({ x: 4, y: 0, z: 7, yaw: rad(-20), scale: 2.8 }).play('Sword_Idle', { fade: false }); }
      if (Q.get('foe')) setShieldCrest(Q.get('foe'), 'foe');
    }
    const cp = (Q.get('cam') || (close ? '1.2,4.6,6.5' : '0,6,26')).split(',').map(Number), at = (Q.get('at') || (close ? '0,3.4,0' : '0,3.2,3')).split(',').map(Number);
    cam.position.set(...cp); cam.lookAt(...at);
  } else if (view === 'plume') {                                    // the K3 knight: battle crowd rider (left, on a bay) + the home SkinnedMesh version (right)
    let km = null; M.knight_k3.scene.traverse((o) => { if (o.isMesh && o.material.name === 'Kit') km = o.material; });
    if (!Q.get('raw')) dressKnight(M.knight_k3); setPlumeTier(+(Q.get('t') || 3));
    if (KIT.canvas && Q.get('kit')) { const c = KIT.canvas; c.style.cssText = 'position:fixed;right:0;top:0;width:300px;height:300px;z-index:9;background:#f0f'; document.body.appendChild(c); }

    const hk = createKind({ gltf: M.horse_m2m_bay, anims: { animations: M.horse_m2m_bay.animations }, clips: ['Idle', 'Gallop', 'Walk'], capacity: 2 });
    const rk = createKind({ gltf: M.knight_k3, anims: { animations: M.knight_k3.animations }, clips: ['Ride'], capacity: 2 });
    scene.add(hk.group, rk.group); kinds.push(hk, rk);
    const CAV = 2.65, yaw = rad(+(Q.get('yaw') || 70)), gait = Q.get('gait') || 'Walk';
    hk.add({ x: -3, y: 0, z: 0, yaw, scale: CAV }).play(gait, { fade: false });
    rk.add({ x: -3 + Math.sin(yaw) * -0.1 * CAV, y: 0.55 * CAV, z: Math.cos(yaw) * -0.1 * CAV, yaw, scale: 0.95 * CAV }).play('Ride', { fade: false });
    const k = makeCreature(M.knight_k3, { height: 1.8 * 1.24 }); scene.add(k.root); k.root.position.set(4, 0, 0); k.root.rotation.y = yaw; k.play(/Ride/);
    kinds.push({ update: (t) => k.mixer.setTime(t) });
    const cp = (Q.get('cam') || '0,4.5,11').split(',').map(Number), at = (Q.get('at') || '0,3.4,0').split(',').map(Number);
    cam.position.set(...cp); cam.lookAt(...at);
  } else if (view === 'pegasus') {                                  // the three looks side by side (?look=pearl for one), resting + flying
    const looks = Q.get('look') ? [Q.get('look')] : ['pearl', 'storm', 'snow'], N = looks.length;
    for (let i = 0; i < N; i++) {
      const g = i === 0 ? M.pegasus : await ld.loadAsync('assets/pegasus.glb');
      dressPegasus(g, looks[i]);
      const kd = createKind({ gltf: g, anims: g, clips: ['Rest', 'Fly', 'Glide'], capacity: 3 }); scene.add(kd.group); kinds.push(kd);
      const x = (i - (N - 1) / 2) * 7.5;
      kd.add({ x, y: 0, z: 0, yaw: rad(+(Q.get('yaw') || 60)), scale: 1.8 }).play('Rest', { fade: false, offset: i });
      if (!Q.get('rest')) { const f = kd.add({ x, y: 7.5, z: -2, yaw: rad(+(Q.get('fyaw') || 200)), scale: 1.8 }); f.roll = 0.15; f.play(Q.get('clip') || 'Glide', { fade: false, offset: +(Q.get('ct') || 0.4) + i * 0.1 }); }
    }
    const cp = (Q.get('cam') || (N > 1 ? '0,7,26' : '0,6,12')).split(',').map(Number), at = (Q.get('at') || (N > 1 ? '0,4.6,0' : '0,4,0')).split(',').map(Number);
    cam.position.set(...cp); cam.lookAt(...at);
  } else if (view === 'tiers') {
    const type = Q.get('u') || 'spear';
    for (let t = 0; t < 6; t++) {
      const k = kit(type, t), helm = k.helm ? pr(M[k.helm], 'Head', 0.17, [0, 0.03, 0], [0, 0, 0]) : null;
      const props = type === 'spear' ? [helm, pr(M.spear, 'hand_r', 0.23, [0.00819, -0.15451, 0.16751], [-34.632, -34.359, -171.054]), k.shield ? pr(shieldModel(M.shield_heater, 'heater'), 'hand_l', 0.27, [0, 0.05, 0.05], [0, 90, 0]) : null]
        : type === 'sword' ? [helm, pr(M.claymore, 'hand_r', 0.2, [0, 0, 0], [0, 0, -90])] : [helm, pr(M.bow, 'hand_l', 0.55, [0, 0, 0], [90, 0, 90])];
      const kd = createKind({ gltf: M.ranger_m, anims: ANIMS, clips: ['Idle_Shield_Loop', 'Sword_Idle', 'Idle_Loop'], props: props.filter(Boolean), capacity: 4, hue: true, cloth: CLOTH[t], tier: t });
      tintGear(kd, t); scene.add(kd.group); kinds.push(kd);
      const p = kd.add({ x: (t - 2.5) * 5.2, y: 0, z: 0, yaw: 0, scale: 2.55 * tierScale(t) }); p.play(type === 'spear' ? 'Idle_Shield_Loop' : type === 'sword' ? 'Sword_Idle' : 'Idle_Loop', { fade: false });
    }
    cam.position.set(0, 7, 34); cam.lookAt(0, 3.6, 0);
  } else if (view === 'dragons') {
    const dl = M.dragonling; for (const c of dl.animations) c.name = c.name.replace(/^.*\|/, '');
    dl.scene.traverse((o) => { if (!o.isMesh) return; const m = o.material; if (/Main/.test(m.name)) m.color.set(0x2f9a4c); else if (/Secondary/.test(m.name)) m.color.set(0xb7e07a); m.roughness = 0.62; });
    const kd = createKind({ gltf: dl, anims: dl, clips: ['Flying_Idle', 'Fast_Flying', 'Headbutt'], capacity: 4, glint: GLINT[+(Q.get('t') || 0)] }); scene.add(kd.group); kinds.push(kd);
    const p = kd.add({ x: 0, y: 3, z: 0, yaw: rad(-30), scale: +(Q.get('s') || 0.95) }); p.play(Q.get('clip') || 'Flying_Idle', { fade: false });
    // reference: a soldier and the red baby dragon (prowler x6.5)
    const sk = createKind({ gltf: M.ranger_m, anims: ANIMS, clips: ['Idle_Shield_Loop'], capacity: 2, hue: true, cloth: CLOTH[1] }); scene.add(sk.group); kinds.push(sk);
    sk.add({ x: -7, y: 0, z: 0, yaw: 0, scale: 2.55 }).play('Idle_Shield_Loop', { fade: false });
    if (M.prowler) {
      const sc = SkeletonUtils.clone(M.prowler.scene); sc.traverse((o) => { if (!o.isMesh) return; const m = o.material.clone(); if (m.map) m.map = grayTex(m.map); m.color.set(0xe2532f).multiplyScalar(1.9); m.emissive = new THREE.Color(0xe2532f).multiplyScalar(0.07); o.material = m; });
      sc.scale.setScalar(6.5); sc.position.set(8, 3, 0); sc.rotation.y = rad(-30); scene.add(sc);
    }
    cam.position.set(0, 8, 26); cam.lookAt(0, 3.5, 0);
  } else if (view === 'port') {                                      // the army-panel portrait of the dragonling (192 px, navy like the others)
    const dl = M.dragonling; for (const c of dl.animations) c.name = c.name.replace(/^.*\|/, '');
    dl.scene.traverse((o) => { if (!o.isMesh) return; const m = o.material; if (/Main/.test(m.name)) m.color.set(0x2f9a4c); else if (/Secondary/.test(m.name)) m.color.set(0xb7e07a); m.roughness = 0.62; });
    const kd = createKind({ gltf: dl, anims: dl, clips: ['Flying_Idle'], capacity: 2 }); scene.add(kd.group); kinds.push(kd);
    kd.add({ x: 0, y: 0, z: 0, yaw: rad(-28), scale: 1 }).play('Flying_Idle', { fade: false, offset: 0.4 });
    scene.background = new THREE.Color(0x0b1838); ground.visible = false;
    cam.fov = 30; cam.updateProjectionMatrix(); cam.position.set(0.6, 2.4, 10.5); cam.lookAt(0, 1.75, 0);
  } else if (view === 'raw') {                                       // inspect one GLB: ?v=raw&m=shield_heater&cam=x,y,z&at=x,y,z&mat=1 (materials false-coloured)
    const g = await ld.loadAsync('assets/' + (Q.get('m') || 'shield_heater') + '.glb'); const o = g.scene;
    const box = new THREE.Box3().setFromObject(o, true), size = box.getSize(new THREE.Vector3()), k = 4 / Math.max(size.x, size.y, size.z), ctr = box.getCenter(new THREE.Vector3());
    o.scale.setScalar(k); o.position.copy(ctr).multiplyScalar(-k); const grp = new THREE.Group(); grp.add(o); grp.position.y = 3; scene.add(grp); ground.visible = false;
    console.warn('size', size.toArray().map((v) => v.toFixed(3)).join(','), 'ctr', ctr.toArray().map((v) => v.toFixed(3)).join(','));
    if (Q.get('mat')) { const pal = [0xff3030, 0x30ff30, 0x3070ff, 0xffff30, 0xff30ff, 0x30ffff]; let i = 0; o.traverse((m) => { if (m.isMesh) { console.warn('mesh', m.name, m.material.name, m.geometry.attributes.position.count); m.material = new THREE.MeshStandardMaterial({ color: pal[i++ % 6], side: THREE.DoubleSide }); } }); }
    if (g.animations && g.animations.length && Q.get('clip')) { const mx = new THREE.AnimationMixer(o); mx.clipAction(g.animations.find((c) => c.name === Q.get('clip')) || g.animations[0]).play(); mx.setTime(+(Q.get('ct') || 0.3)); }
    const cp = (Q.get('cam') || '0,3,9').split(',').map(Number), at = (Q.get('at') || '0,3,0').split(',').map(Number);
    cam.position.set(...cp); cam.lookAt(...at);
  } else if (view === 'tesla') {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.4, 20, 12).translate(0, 10, 0), new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.9 })); scene.add(tower);
    const tz = createTesla({ scene, targets: [{ id: 1, type: 'tower', x: 0, z: 0, h: 20 }], meta: { gates: [{ x: 10, z: 0 }] }, height: () => 0 });
    tz.set(1); window.__tz = tz; kinds.push({ update: (t) => tz.update(t, 0.016) });
    if (Q.get('night')) { scene.background = new THREE.Color(0x0b1430); scene.children.forEach((o) => { if (o.isLight) o.intensity *= 0.25; }); }
    cam.position.set(0, 27, 30); cam.lookAt(0, 24, 0);
  }
  let frames = 0;
  const loop = () => { const t = Q.get('T') ? +Q.get('T') : (performance.now() - t0) / 1000; for (const k of kinds) k.update(t, cam); renderer.render(scene, cam); frames++; window.__frames = frames; requestAnimationFrame(loop); };
  loop(); window.__ready = true;
})();
