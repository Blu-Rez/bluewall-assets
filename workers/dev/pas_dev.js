// pas_dev: the stable yard + pasture in isolation (real layout heights, real military.js stable, real life.js handlers) — fast shots.
//   ?v=clips  : every clip of the bay horse + the cow, frozen mid-clip, labelled order (root-cause check)
//   ?v=yard   : the stable estate, pasture, keepers' camp; ?h=22 night; ?lv=1..20 stable level
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '../bot/bluebot_v2/bluewall/client/src/roads.js';
import { makeMaterials } from '../bot/bluebot_v2/bluewall/client/src/materials.js';
import { Batcher } from '../bot/bluebot_v2/bluewall/client/src/util.js';
import { applySkin, setEntityLevel, ENT } from '../bot/bluebot_v2/bluewall/client/src/skin.js';
import { buildMilitary } from '../bot/bluebot_v2/bluewall/client/src/military.js';
import { buildLife } from '../bot/bluebot_v2/bluewall/client/src/life.js';
import { buildStableEstate, setStableLook, STABLE_FX } from '../bot/bluebot_v2/bluewall/client/src/pas_stable.js';
import { makeCreature } from '../bot/bluebot_v2/bluewall/client/src/creature.js';
import { cloneSkinned } from '../bot/bluebot_v2/bluewall/client/src/assets.js';
import { mergeSkinned } from '../bot/bluebot_v2/bluewall/client/src/creature.js';

const Q = new URLSearchParams(location.search), view = Q.get('v') || 'yard', HOUR = +(Q.get('h') || 12), NIGHT = HOUR >= 20 || HOUR < 5;
(async () => {
  L.setMap('night'); buildRoads();
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const names = ['horse_m2m_bay', 'horse_m2m_black', 'horse_m2m_grey', 'cow', 'peasant_m', 'peasant_f', 'ranger_m', 'anims', 'haybale', 'cart', 'barrel', 'crate', 'catapult', 'ram', 'siege_tower', 'cliff1'];
  const models = {}; await Promise.all(names.map(async (n) => { try { models[n] = await ld.loadAsync('assets/' + n + '.glb'); } catch (e) { console.warn(n, e); } }));
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = NIGHT ? 1.0 : 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.style.margin = 0; document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = NIGHT ? 0.12 : 0.6; }
  const skyC = NIGHT ? 0x0c1630 : 0x9cc0e6; scene.background = new THREE.Color(skyC); scene.fog = new THREE.Fog(skyC, 260, 900);
  scene.add(new THREE.HemisphereLight(NIGHT ? 0x2a3e70 : 0xdfeaff, NIGHT ? 0x10140c : 0x556644, NIGHT ? 0.55 : 1.4));
  const sun = new THREE.DirectionalLight(NIGHT ? 0x8fa8e0 : 0xfff0d8, NIGHT ? 0.5 : 3.0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const hemiL = scene.children[scene.children.length - 1];
  Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 10, far: 600 }); sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.5, 3000);
  const cam = { x: 0, y: 40, z: 100, tx: 0, ty: 4, tz: 0 };
  window.__cam = (x, y, z, tx, ty, tz) => Object.assign(cam, { x, y, z, tx, ty, tz });
  const updaters = [];
  const P = { night: NIGHT ? 1 : 0, hour: HOUR };

  if (view === 'clips') {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x6b8a4a, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    sun.position.set(40, 80, 60);
    const rows = [['horse_m2m_bay', { length: 4.1 * 1.335 * 1.25 }], ['cow', { length: 3.4 * 1.25 }]];
    const info = [];
    rows.forEach(([n, o], ri) => {
      const g = models[n]; g.animations.forEach((cl, i) => {
        const c = makeCreature(g, o); c.root.position.set((i - g.animations.length / 2) * 8, 0, ri * -12); c.root.rotation.y = Math.PI / 2; scene.add(c.root);
        const a = c.mixer.clipAction(cl); a.play(); c.mixer.setTime(cl.duration * (+(Q.get('f') || 0.5))); c.root.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(c.inner, true); info.push([n, i, cl.name, +cl.duration.toFixed(2), +b.min.y.toFixed(2), +b.max.y.toFixed(2), +(b.max.x - b.min.x).toFixed(2), +(b.max.z - b.min.z).toFixed(2)]);
      });
    });
    window.__info = info;
    window.__cam(0, 26, 40, 0, 1, -6);
  } else {
    // terrain patch around the stable yard + pasture (real layout heights)
    const S0 = L.stableAt(), cx = (S0.x + L.PASTURE.x) / 2, cz = (S0.z + L.PASTURE.z) / 2;
    const gg = new THREE.PlaneGeometry(420, 420, 210, 210); gg.rotateX(-Math.PI / 2); const pp = gg.attributes.position;
    const col = new Float32Array(pp.count * 3);
    for (let i = 0; i < pp.count; i++) { const x = cx + pp.getX(i), z = cz + pp.getZ(i); pp.setXYZ(i, x, L.height(x, z), z); const n = Math.sin(x * 0.21) * Math.cos(z * 0.17) * 0.04; col.set([0.21 + n, 0.3 + n, 0.12], i * 3); }
    gg.setAttribute('color', new THREE.BufferAttribute(col, 3)); gg.computeVertexNormals();
    const ground = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    sun.position.set(cx + 120, 200, cz + 90); sun.target.position.set(cx, 0, cz);
    const M = makeMaterials(); window.__M = M; M.window.emissiveIntensity = NIGHT ? 2.25 : 0.15; applySkin(M.stone, 0); applySkin(M.stoneDark, 1); applySkin(M.roof, 2); applySkin(M.gold, 3); applySkin(M.rune, 4);
    const B = new Batcher(), picks = [], smokers = [];
    const ctx = { B, M, height: L.height, levelHooks: [], pick: (b, id) => picks.push({ b, id }), tgt: () => 0, smokeAt: (x, y, z) => { const s = { x, y, z }; smokers.push(s); return s; }, torch() {} };
    const lv = +(Q.get('lv') || 20); for (const k of Object.keys(ENT)) if (ENT[k] > 0) setEntityLevel(k, lv);
    buildMilitary(ctx, { scene, A: { models }, Q: { shadows: true } });
    // dev: the stable's paint, switched in place (sample sheet)
    window.__look = (k) => {
      setStableLook(k); const old = STABLE_FX.mesh, og = STABLE_FX.group; if (old) old.parent.remove(old); if (og) og.parent.remove(og);
      buildStableEstate(ctx, { W: S0.W, y0: L.height(S0.x, S0.z), ry: S0.ry }, { scene, Q: { shadows: true }, A: { models } });
    };
    for (const m of B.build(scene)) m.castShadow = true;
    for (const h of ctx.levelHooks) h();
    window.__lv = (n) => { for (const k of Object.keys(ENT)) if (ENT[k] > 0) setEntityLevel(k, n); for (const h of ctx.levelHooks) h(); };
    // people (units.make look-alike)
    const clips = {}; for (const c of models.anims.animations) clips[c.name] = c;
    const person = (key, sc) => {
      const g = models[key]; if (!g) return null; mergeSkinned(g.scene); const root = cloneSkinned(g); root.scale.setScalar(sc);
      root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      const mixer = new THREE.AnimationMixer(root), u = { root, mixer, name: '' };
      u.play = (name) => { const c = clips[name]; if (!c) return; const a = mixer.clipAction(new THREE.AnimationClip(c.name, c.duration, c.tracks.filter((tr) => root.getObjectByName(tr.name.split('.')[0])))); a.play(); u.name = name; };
      scene.add(root); updaters.push((t, dt) => mixer.update(dt)); return u;
    };
    const life = buildLife(scene, L.height, { level: 'high' }, { picks: [], creatures: [], person, smoke: () => {}, walkY: L.height, birds: () => true, dragonsOn: () => false, setDragon() {}, hideGiants() {}, hideWindmill() {}, slam() {}, models });
    for (const n of ['horse_m2m_bay', 'horse_m2m_black', 'horse_m2m_grey', 'cow', 'haybale']) { const b = life.add(n, models[n]); if (b) b.visible = true; }
    updaters.push((t, dt) => life.update(t, dt, P, camera));
    window.__info = { stable: [S0.x, S0.z, S0.ry], pasture: L.PASTURE, picks: picks.length };
    window.__W = S0.W; window.__L = L;
    // default: the owner's view (from the pasture side, looking at the barn)
    window.__cam(140, 60, 222, 15, 0, 208);
  }
  // runtime day / night switch (one page load for several shots): __hour(12) / __hour(22)
  window.__hour = (h) => {
    const n = h >= 20 || h < 5 ? 1 : 0; P.night = n; P.hour = h;
    const sky = n ? 0x0c1630 : 0x9cc0e6; scene.background.set(sky); scene.fog.color.set(sky);
    hemiL.color.set(n ? 0x2a3e70 : 0xdfeaff); hemiL.groundColor.set(n ? 0x10140c : 0x556644); hemiL.intensity = n ? 0.55 : 1.4;
    sun.color.set(n ? 0x8fa8e0 : 0xfff0d8); sun.intensity = n ? 0.5 : 3.0; scene.environmentIntensity = n ? 0.12 : 0.6;
    if (window.__M) window.__M.window.emissiveIntensity = n ? 2.25 : 0.15;
  };
  let t = 0, last = performance.now();
  function frame() {
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
    camera.position.set(cam.x, cam.y, cam.z); camera.lookAt(cam.tx, cam.ty, cam.tz); camera.updateMatrixWorld();
    for (const f of updaters) f(t, dt);
    renderer.render(scene, camera); window.__frames = (window.__frames || 0) + 1; requestAnimationFrame(frame);
  }
  window.__renderer = renderer; window.__scene = scene; frame(); window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
