// c4_ws_dev.js — C4 preview (food family): ws_dev.js + kit_c4.glb + synthetic town sites (mill wind / water, bakery, butcher) + the existing smoke Particles.  ONE worksite on the real terrain (layout.height with the level pads), real kit, real builder.  window.__show(id, lv, azim, dist, polar)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildWorksites } from '../bot/bluebot_v2/bluewall/client/src/wsbuild.js';
import { buildRoads } from '../bot/bluebot_v2/bluewall/client/src/roads.js';
import { buildWsLife } from '../bot/bluebot_v2/bluewall/client/src/wslife.js';
import { sites, counts, WS_KINDS } from '../bot/bluebot_v2/bluewall/client/src/worksites.js';
import * as C4 from '../bot/bluebot_v2/bluewall/client/src/c4_kinds.js';
import { Particles, PX } from '../bot/bluebot_v2/bluewall/client/src/fx.js';
import * as T from '../bot/bluebot_v2/bluewall/client/src/textures.js';
(async () => {
  Object.assign(WS_KINDS, C4.KINDS);                                  // the town plan (mother) adds mill / bakery / butcher to WS_KINDS the same way
  L.setMap('night');
  // --- synthetic town sites for the NEW kinds (the mother's town plan will place the real ones): flat dry ground, free of the other sites; the water mill on a shore (+z = toward the water)
  const dry = (x, z) => L.height(x, z) > 0.8;
  const flat = (x, z, r) => { let lo = 1e9, hi = -1e9; for (let i = 0; i <= 12; i++) { const a = i / 12 * 6.283, rr = i ? r : 0, h = L.height(x + Math.cos(a) * rr, z + Math.sin(a) * rr); if (h < 0.8) return 1e9; lo = Math.min(lo, h); hi = Math.max(hi, h); } return hi - lo; };
  const free = (x, z, r, extra) => L.WS_SITES.every((s) => Math.hypot(s.x - x, s.z - z) > s.r + r + 14) && extra.every((e) => Math.hypot(e.x - x, e.z - z) > e.r + r + 18);
  const found = [];
  const want = [['c4_bakery', 'bakery', 14], ['c4_butcher', 'butcher', 14], ['c4_mill_a', 'mill', 16]];
  for (const [id, kind, r] of want) {
    let best = null;
    for (let x = 60; x <= 380; x += 6) for (let z = -330; z <= 330; z += 6) {
      if (Math.hypot(x, z) < 150) continue; const f = flat(x, z, r * 0.95); if (f > 1.4 || !free(x, z, r, found)) continue;
      const sc = f + Math.hypot(x - 243, z + 98) * 0.004; if (!best || sc < best.sc) best = { x, z, sc };
    }
    if (!best) { console.warn('no spot for', id); continue; }
    const ry = 0.5; found.push({ id, kind, x: best.x, z: best.z, ry, r, link: [best.x + Math.sin(ry) * 30, best.z + Math.cos(ry) * 30] });
  }
  { // water mill: a shore with the water 12-16 m in front (+z) of the body and flat dry ground behind
    let best = null;
    for (let x = -380; x <= 380; x += 5) for (let z = -380; z <= 380; z += 5) for (let k = 0; k < 24; k++) {
      const a = k / 24 * 6.283, sx = Math.sin(a), cz = Math.cos(a);
      if (!dry(x, z) || L.height(x + sx * 15, z + cz * 15) > -0.6 || L.height(x + sx * 10, z + cz * 10) < -0.2) continue;
      const f = flat(x - sx * 3, z - cz * 3, 11); if (f > 1.6 || !free(x, z, 16, found)) continue;
      if (!best || f < best.f) best = { x, z, a, f };
    }
    if (best) found.push({ id: 'c4_mill_w', kind: 'mill', variant: 'water', x: best.x, z: best.z, ry: best.a, r: 16, link: [best.x - Math.sin(best.a) * 30, best.z - Math.cos(best.a) * 30], water: [best.x + Math.sin(best.a) * 14, best.z + Math.cos(best.a) * 14] }); else console.warn('no shore spot');
  }
  window.__found = found; for (const s of found) L.WS_SITES.push(s);
  L.setMap('night'); buildRoads();
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const kit = await ld.loadAsync('assets/kit_ws.glb'); const kitC4 = await ld.loadAsync('assets/kit_c4.glb');
  const M = {}; for (const n of ['peasant_m', 'peasant_f', 'anims', 'cow', 'horse_m2m_bay', 'horse_m2m_black', 'horse_m2m_grey', 'an_sheep', 'an_pig']) { try { M[n] = await ld.loadAsync('assets/' + n + '.glb'); } catch (e) { console.warn('model', n, e); } }
  const coatMap = (g) => { let m = null; g && g.scene.traverse((o) => { if (!m && o.isMesh && o.material && o.material.name !== 'Tack' && o.material.map) m = o.material.map; }); return m; };
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fb8d8); scene.fog = new THREE.Fog(0x9fb8d8, 160, 420);
  scene.add(new THREE.HemisphereLight(0xdbe7ff, 0x55603f, 1.5));
  const sun = new THREE.DirectionalLight(0xfff1d6, 3.0); sun.position.set(60, 90, 40); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 300 }); scene.add(sun); scene.add(sun.target);
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.5, 2000);
  PX.scale.value = innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  const smoke = new Particles(scene, { count: 420, tex: T.glowTexture('rgba(255,255,255,1)'), blending: THREE.NormalBlending, color: [0.92, 0.93, 0.95] }); let smokers = [];
  let ground = null, ws = null, cur = null, life = null, T0 = 0;
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
    const tb1 = performance.now(); ws = buildWorksites(scene, kit, hf, { shadows: true, castle: lv, kitC4 }); window.__buildAllMs = Math.round((performance.now() - tb1) * 10) / 10; window.__ws = ws;
    // every OTHER site off, this one at the asked level
    const only = {}; for (const q of sites()) only[q.kind] = q.id === id || q.kind === s.kind ? lv : 0; const tb0 = performance.now(); ws.rebuild(only); window.__buildMs = Math.round((performance.now() - tb0) * 10) / 10;
    if (!life) { life = buildWsLife(scene, hf, { models: { peasant_m: M.peasant_m, peasant_f: M.peasant_f, anims: M.anims, cow: M.cow, horse: M.horse_m2m_bay }, coats: [coatMap(M.horse_m2m_black), coatMap(M.horse_m2m_grey)], sheep: M.an_sheep, pig: M.an_pig, kit, shadows: true, castle: lv }); for (const st of life.steps.slice(0, 3)) st(); }
    const lifeOnly = { ...only }; for (const k of ['mill', 'bakery', 'butcher']) lifeOnly[k] = 0; life.refresh(lifeOnly); window.__lifeStats = life.stats();
    sun.target.position.set(s.x, 0, s.z); sun.position.set(s.x + 60, 90, s.z + 40);
    const aim = window.__aim || [0, 0], cxw = s.x + aim[0] * Math.cos(s.ry) + aim[1] * Math.sin(s.ry), czw = s.z - aim[0] * Math.sin(s.ry) + aim[1] * Math.cos(s.ry);
    const placeCam = (cx_, cz_) => { const a = s.ry + az; camera.position.set(cx_ + Math.sin(a) * Math.sin(polar) * dist, hf(cx_, cz_) + ty + Math.cos(polar) * dist, cz_ + Math.cos(a) * Math.sin(polar) * dist); camera.lookAt(cx_, hf(cx_, cz_) + ty, cz_); camera.updateMatrixWorld(); };
    placeCam(cxw, czw);
    smokers = ws.smokers.map((p) => ({ x: p.x, y: p.y, z: p.z, heavy: p.heavy, acc: Math.random() })); smoke.active = 0; smoke.alive = 0; for (let i = 0; i < smoke.n; i++) smoke.life[i] = 0;
    const smokeStep = (dt) => { for (const s of smokers) { s.acc += dt * (s.heavy ? 5 : 2.2); while (s.acc > 1) { s.acc -= 1; smoke.emit(s.x + (Math.random() - 0.5) * 0.4, s.y, s.z + (Math.random() - 0.5) * 0.4, 0.5 + Math.random() * 0.4, 1.4 + Math.random() * 0.8, 0.2 + Math.random() * 0.3, 5 + Math.random() * 2, s.heavy ? 1.8 : 1.3, 3.2, s.heavy ? 0.5 : 0.35); } } smoke.update(dt, 0.995, 0.08); };
    // simulate a few seconds so the workers settle on their spots
    const dt = 0.1; for (let i = 0; i < (window.__simSecs ?? 12) / dt; i++) { T0 += dt; life.update(T0, dt, camera); smokeStep(dt); ws.update(T0, camera); }
    if (window.__noanim) for (const o of ws.group.children) if (o.name.startsWith('c4anim:')) o.visible = false;       // (program-count experiment: the same scene without the turning sails / wheel)
    if (window.__aimCart != null && life.carts[window.__aimCart]) { const c = life.carts[window.__aimCart]; placeCam(c.x, c.z); life.update(T0 + 0.01, 0.01, camera); }
    renderer.render(scene, camera);
    return JSON.stringify({ id, lv, life: life.stats(), counts: counts(s, lv), calls: renderer.info.render.calls, tris: renderer.info.render.triangles });
  };
  window.__meshes = () => { const out = []; ws.group.traverse((o) => { if (o.isMesh) { let v = true, q = o; while (q) { if (!q.visible) v = false; q = q.parent; } out.push({ name: o.name, vis: v, inst: !!o.isInstancedMesh, shadow: !!o.castShadow, tris: Math.round((o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3), mat: o.material.name || o.material.type }); } }); return JSON.stringify(out); };
  window.__progKeys = () => JSON.stringify((renderer.info.programs || []).map((p) => (p.name || '') + '|' + String(p.cacheKey).slice(0, 400)));
  window.__programs = () => (renderer.info.programs || []).length;
  window.__ids = sites().map((s) => s.id);
  window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
