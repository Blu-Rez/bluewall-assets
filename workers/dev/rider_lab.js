import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { makeCreature } from '../bot/bluebot_v2/bluewall/client/src/creature.js';
import { dressKnight, axeKnight } from '../bot/bluebot_v2/bluewall/client/src/gear_plume.js';
import { makeAxe } from '../bot/bluebot_v2/bluewall/client/src/gear_axe.js';
import { AXE_RIDE } from '../bot/bluebot_v2/bluewall/client/src/gear_sword.js';
const HS = 1.335, SEAT = { spine_3: [-0.0023, 0.0029, -0.2059], Torso2: [0, 0.0002, 0.0083] };
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const L = async (n) => ld.loadAsync('assets/' + n + '.glb');
  const [k3, bay, black, grey, white] = await Promise.all([L('knight_k3'), L('horse_m2m_bay'), L('horse_m2m_black'), L('horse_m2m_grey'), L('horse_white')]);
  dressKnight(k3); const ax = axeKnight(k3);
  console.info('axe knight', !!ax, ax && ax.animations.map((c) => c.name).join(','));
  const renderer = new THREE.WebGLRenderer({ antialias: true }); const W = innerWidth, H = innerHeight; renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setScissorTest(true);
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x7f98b8);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x445544, 2.0)); const sun = new THREE.DirectionalLight(0xffffff, 2.5); sun.position.set(-6, 10, 8); scene.add(sun);
  { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.7; }
  const HG = { bay, black, grey, white };
  const SET = window.__set = [];
  const byName = (o, n) => o.getObjectByName(n) || o.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(n));
  const mount = (h, k, horseLen, size) => {
    const bone = h.inner.getObjectByName('spine_3') || h.inner.getObjectByName('Torso2'); if (!bone) return false;
    h.root.updateMatrixWorld(true);
    const seat = bone.localToWorld(new THREE.Vector3(...SEAT[bone.name]));
    const hips = byName(k.inner, 'pelvis'), top = byName(k.inner, 'Head'); if (!hips || !top) return false;
    k.root.updateMatrixWorld(true);
    k.root.scale.setScalar(size / Math.max(0.05, hips.getWorldPosition(new THREE.Vector3()).distanceTo(top.getWorldPosition(new THREE.Vector3())))); k.root.updateMatrixWorld(true);
    k.root.position.add(seat.sub(hips.getWorldPosition(new THREE.Vector3()))).add(new THREE.Vector3(0, 0.2 * horseLen / 5.6, 0)); k.root.updateMatrixWorld(true);
    bone.attach(k.root); return true;
  };
  // list: [coat, kind('sword'|'axe'), clip, u, gait]
  window.__build = (list) => {
    SET.forEach((c) => scene.remove(c.root)); SET.length = 0;
    list.forEach(([coat, kind, clip, u, gait], i) => {
      const h = makeCreature(HG[coat], { length: 5.6 * HS }); const g = kind === 'axe' ? ax : k3; const k = makeCreature(g, { height: 1 });
      h.root.position.set((i - (list.length - 1) / 2) * (window.__sp || 4.4), 0, 0); scene.add(h.root);
      h.play(gait || 'Walk', { fade: 0 }); h.mixer.update(0.01); h.root.updateMatrixWorld(true);
      mount(h, k, 5.6 * HS, 1.24 * (kind === 'axe' ? 1.1 : 1));
      if (kind === 'axe') {
        const hand = k.inner.getObjectByName('hand_r'); const a = makeAxe({ blued: false, shadows: false, long: true });
        a.rotation.set(...AXE_RIDE.rotDeg.map((d) => d * Math.PI / 180)); a.position.set(...AXE_RIDE.pos); a.scale.setScalar(AXE_RIDE.s); hand.add(a);
      }
      k.play(clip, { fade: 0 }); const cl = k.find(clip); k.mixer.setTime((u || 0) * cl.duration);
      const hc = h.find(gait || 'Walk'); h.mixer.setTime((u || 0) * (hc ? hc.duration : 1)); h.root.updateMatrixWorld(true);
      SET.push(h);
    });
  };
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  window.__view = { rots: [0.5, 1.5708, 2.6], dist: 20, ty: 2.4, span: 10 };
  const draw = () => {
    const V = window.__view;
    if (V.grid) {                       // one viewport per rider (columns) and per camera angle (rows); the camera orbits the rider, the riders keep their heading
      const R = V.rots, cols = SET.length || 1, rows = R.length, vw = Math.round(W / cols), vh = Math.round(H / rows);
      SET.forEach((c, i) => {
        c.root.rotation.y = 0; c.root.updateMatrixWorld(true); SET.forEach((o) => { o.root.visible = o === c; });
        R.forEach((rot, k) => {
          const vp = [i * vw, (rows - 1 - k) * vh, vw, vh]; renderer.setViewport(...vp); renderer.setScissor(...vp);
          const px = c.root.position.x, pz = c.root.position.z;
          cam.aspect = vp[2] / vp[3]; cam.fov = 2 * Math.atan(Math.max(V.span / 2 / cam.aspect, V.span / 2) / V.dist) * 180 / Math.PI; cam.updateProjectionMatrix();
          cam.position.set(px + Math.sin(rot) * V.dist, V.ty + 0.05, pz + Math.cos(rot) * V.dist); cam.lookAt(px, V.ty, pz);
          renderer.render(scene, cam);
        });
      });
      window.__frames = (window.__frames || 0) + 1; requestAnimationFrame(draw); return;
    }
    const n = SET.length || 1, span = V.span, R = V.rots, rows = R.length;
    const cols = rows >= 4 ? 2 : 1, rr = Math.ceil(rows / cols);
    R.forEach((rot, k) => {
      const cx = k % cols, cy = Math.floor(k / cols), vw = Math.round(W / cols), vh = Math.round(H / rr);
      const vp = [cx * vw, (rr - 1 - cy) * vh, vw, vh]; renderer.setViewport(...vp); renderer.setScissor(...vp);
      SET.forEach((c) => { c.root.rotation.y = rot; c.root.updateMatrixWorld(true); });
      cam.aspect = vp[2] / vp[3]; cam.fov = 2 * Math.atan(Math.max(span / 2 / cam.aspect, span / 2) / V.dist) * 180 / Math.PI; cam.updateProjectionMatrix();
      cam.position.set(0, V.ty + 0.05, V.dist); cam.lookAt(0, V.ty, 0);
      renderer.render(scene, cam);
    });
    window.__frames = (window.__frames || 0) + 1; requestAnimationFrame(draw);
  };
  window.__build([['grey', 'sword', 'RideDrawn', 0, 'Walk'], ['bay', 'axe', 'AxeDrawn', 0, 'Walk']]);
  draw(); window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
