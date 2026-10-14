// ws_dev.js — fast preview of ONE worksite on the real terrain (layout.height with the level pads), real kit, real builder.  window.__show(id, lv, azim, dist, polar)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildWorksites } from '../bot/bluebot_v2/bluewall/client/src/wsbuild.js';
import { buildRoads } from '../bot/bluebot_v2/bluewall/client/src/roads.js';
import { buildWsLife } from '../bot/bluebot_v2/bluewall/client/src/wslife.js';
import { sites, counts } from '../bot/bluebot_v2/bluewall/client/src/worksites.js';
(async () => {
  L.setMap('night'); buildRoads();
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const kit = await ld.loadAsync('assets/kit_ws.glb');
  const M = {}; for (const n of ['peasant_m', 'peasant_f', 'anims', 'cow', 'horse_m2m_bay', 'horse_m2m_black', 'horse_m2m_grey', 'an_sheep', 'an_pig']) { try { M[n] = await ld.loadAsync('assets/' + n + '.glb'); } catch (e) { console.warn('model', n, e); } }
  const coatMap = (g) => { let m = null; g && g.scene.traverse((o) => { if (!m && o.isMesh && o.material && o.material.name !== 'Tack' && o.material.map) m = o.material.map; }); return m; };
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fb8d8); scene.fog = new THREE.Fog(0x9fb8d8, 160, 420);
  scene.add(new THREE.HemisphereLight(0xdbe7ff, 0x55603f, 1.5));
  const sun = new THREE.DirectionalLight(0xfff1d6, 3.0); sun.position.set(60, 90, 40); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 300 }); scene.add(sun); scene.add(sun.target);
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.5, 2000);
  let ground = null, ws = null, cur = null, life = null, T = 0;
  const hf = (x, z) => L.height(x, z);
  function terrain(cx, cz) {
    if (ground) { scene.remove(ground); ground.geometry.dispose(); }
    const N = 90, S = 150, g = new THREE.PlaneGeometry(S * 2, S * 2, N, N); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + cx, z = p.getZ(i) + cz, h = hf(x, z); p.setY(i, h); const k = Math.min(1, Math.max(0, h / 22));
      const water = h < -0.5; const c = water ? [0.15, 0.3, 0.55] : [0.32 + 0.35 * k, 0.5 - 0.1 * k, 0.24 + 0.2 * k]; col.set(c, i * 3); }
    p.needsUpdate = true; g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); ground.position.set(cx, 0, cz); ground.receiveShadow = true; scene.add(ground);
  }
  window.__show = (id, lv = 30, az = 0.6, dist = 60, polar = 0.9, ty = 3) => {
    const s = sites().find((q) => q.id === id); cur = s;
    terrain(s.x, s.z);
    if (ws) { scene.remove(ws.group); }
    ws = buildWorksites(scene, kit, hf, { shadows: true, castle: lv });
    // every OTHER site off, this one at the asked level
    const only = {}; for (const q of sites()) only[q.kind] = q.id === id || q.kind === s.kind ? lv : 0; ws.rebuild(only);
    if (!life) { life = buildWsLife(scene, hf, { models: { peasant_m: M.peasant_m, peasant_f: M.peasant_f, anims: M.anims, cow: M.cow, horse: M.horse_m2m_bay }, coats: [coatMap(M.horse_m2m_black), coatMap(M.horse_m2m_grey)], sheep: M.an_sheep, pig: M.an_pig, kit, shadows: true, castle: lv }); for (const st of life.steps.slice(0, 3)) st(); }
    life.refresh(only); window.__lifeStats = life.stats();
    sun.target.position.set(s.x, 0, s.z); sun.position.set(s.x + 60, 90, s.z + 40);
    const aim = window.__aim || [0, 0], cxw = s.x + aim[0] * Math.cos(s.ry) + aim[1] * Math.sin(s.ry), czw = s.z - aim[0] * Math.sin(s.ry) + aim[1] * Math.cos(s.ry);
    const placeCam = (cx_, cz_) => { const a = s.ry + az; camera.position.set(cx_ + Math.sin(a) * Math.sin(polar) * dist, hf(cx_, cz_) + ty + Math.cos(polar) * dist, cz_ + Math.cos(a) * Math.sin(polar) * dist); camera.lookAt(cx_, hf(cx_, cz_) + ty, cz_); camera.updateMatrixWorld(); };
    placeCam(cxw, czw);
    // simulate a few seconds so the workers settle on their spots
    const dt = 0.1; for (let i = 0; i < (window.__simSecs ?? 12) / dt; i++) { T += dt; life.update(T, dt, camera); }
    if (window.__aimCart != null && life.carts[window.__aimCart]) { const c = life.carts[window.__aimCart]; placeCam(c.x, c.z); life.update(T + 0.01, 0.01, camera); }
    renderer.render(scene, camera);
    return JSON.stringify({ id, lv, life: life.stats(), counts: counts(s, lv), calls: renderer.info.render.calls, tris: renderer.info.render.triangles });
  };
  window.__ids = sites().map((s) => s.id);
  window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
