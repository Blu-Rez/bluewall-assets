// ws_dev.js — fast preview of ONE worksite on the real terrain (layout.height with the level pads), real kit, real builder.  window.__show(id, lv, azim, dist, polar)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildWorksites } from '../bot/bluebot_v2/bluewall/client/src/wsbuild.js';
import { buildRoads } from '../bot/bluebot_v2/bluewall/client/src/roads.js';
import { buildWsLife } from '../bot/bluebot_v2/bluewall/client/src/wslife.js';
import { sites, counts } from '../bot/bluebot_v2/bluewall/client/src/worksites.js';
import { Flames } from '../bot/bluebot_v2/bluewall/client/src/fx.js';
(async () => {
  L.setMap('night'); buildRoads();
  // C3 preview sites for the two town kinds (the real planner puts them in the town): level pads like the real worksites
  for (const p of [{ id: 'mint1', kind: 'mint', x: 40, z: 260, ry: 0, r: 16, link: [40, 290] }, { id: 'refinery1', kind: 'refinery', x: 240, z: 100, ry: 0, r: 17, link: [240, 130] }]) {
    L.SITES.push(p); L.PADS.push({ x: p.x, z: p.z, r: p.r * 0.9, b: 16, h: L.height(p.x, p.z) });
  }
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const kit = await ld.loadAsync('assets/kit_ws.glb'); const kit3 = await ld.loadAsync('assets/kit_c3.glb');
  const M = {}; for (const n of ['peasant_m', 'peasant_f', 'anims', 'cow', 'horse_m2m_bay', 'horse_m2m_black', 'horse_m2m_grey', 'an_sheep', 'an_pig']) { try { M[n] = await ld.loadAsync('assets/' + n + '.glb'); } catch (e) { console.warn('model', n, e); } }
  const coatMap = (g) => { let m = null; g && g.scene.traverse((o) => { if (!m && o.isMesh && o.material && o.material.name !== 'Tack' && o.material.map) m = o.material.map; }); return m; };
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fb8d8); scene.fog = new THREE.Fog(0x9fb8d8, 160, 420);
  scene.add(new THREE.HemisphereLight(0xdbe7ff, 0x55603f, 1.5));
  const sun = new THREE.DirectionalLight(0xfff1d6, 3.0); sun.position.set(60, 90, 40); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.35;      // the game's values (world.js)
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 300 }); scene.add(sun); scene.add(sun.target);
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.5, 2000);
  let ground = null, ws = null, cur = null, life = null, T = 0, fl = null;
  const glow = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const LIFE_KINDS = new Set(['lumber', 'quarry', 'iron', 'gold', 'farm', 'greenhouse', 'livestock', 'fishery', 'slaughter', 'oil']);
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
    ws = buildWorksites(scene, kit, hf, { shadows: true, castle: lv, kitC3: kit3 });
    // every OTHER site off, this one at the asked level
    const only = {}; for (const q of sites()) only[q.kind] = q.id === id || q.kind === s.kind ? lv : 0; ws.rebuild(only);
    const lifeOn = LIFE_KINDS.has(s.kind);
    if (fl) { scene.remove(fl.points); fl.points.geometry.dispose(); fl = null; }
    if (ws.flames.length) { fl = new Flames(); for (const f of ws.flames) fl.add(f.x, f.y, f.z, f.size, f.col); fl.build(scene, glow); }
    if (lifeOn) {
    if (!life) { life = buildWsLife(scene, hf, { models: { peasant_m: M.peasant_m, peasant_f: M.peasant_f, anims: M.anims, cow: M.cow, horse: M.horse_m2m_bay }, coats: [coatMap(M.horse_m2m_black), coatMap(M.horse_m2m_grey)], sheep: M.an_sheep, pig: M.an_pig, kit, shadows: true, castle: lv }); for (const st of life.steps.slice(0, 3)) st(); }
    life.refresh(only); window.__lifeStats = life.stats();
    }
    sun.target.position.set(s.x, 0, s.z); sun.position.set(s.x + 60, 90, s.z + 40);
    const aim = window.__aim || [0, 0], cxw = s.x + aim[0] * Math.cos(s.ry) + aim[1] * Math.sin(s.ry), czw = s.z - aim[0] * Math.sin(s.ry) + aim[1] * Math.cos(s.ry);
    const placeCam = (cx_, cz_) => { const a = s.ry + az; camera.position.set(cx_ + Math.sin(a) * Math.sin(polar) * dist, hf(cx_, cz_) + ty + Math.cos(polar) * dist, cz_ + Math.cos(a) * Math.sin(polar) * dist); camera.lookAt(cx_, hf(cx_, cz_) + ty, cz_); camera.updateMatrixWorld(); };
    placeCam(cxw, czw);
    // simulate a few seconds so the workers settle on their spots
    const dt = 0.1; for (let i = 0; i < (window.__simSecs ?? 12) / dt; i++) { T += dt; if (lifeOn) life.update(T, dt, camera); if (fl) fl.update(T); }
    if (lifeOn && window.__aimCart != null && life.carts[window.__aimCart]) { const c = life.carts[window.__aimCart]; placeCam(c.x, c.z); life.update(T + 0.01, 0.01, camera); }
    renderer.render(scene, camera);
    return JSON.stringify({ id, lv, life: lifeOn ? life.stats() : null, counts: counts(s, lv), calls: renderer.info.render.calls, tris: renderer.info.render.triangles });
  };

  // C3 perf: draw calls + triangles of ONE site (the whole frame with the site minus the frame with it hidden), near (all pieces) and far (worksite LOD: the small props are hidden beyond WS_NEAR)
  window.__perf = (id, lv) => {
    window.__show(id, lv, 0.5, 60, 0.8, 3);
    const s = sites().find((q) => q.id === id), node = ws.sites().get(id).g, out = {};
    const one = () => { renderer.info.autoReset = false; renderer.info.reset(); renderer.render(scene, camera); const r = { calls: renderer.info.render.calls, tris: renderer.info.render.triangles }; renderer.info.autoReset = true; return r; };
    for (const [nm, dist] of [['near', 60], ['far', 230]]) {
      camera.position.set(s.x + Math.sin(s.ry + 0.5) * Math.sin(0.8) * dist, hf(s.x, s.z) + Math.cos(0.8) * dist, s.z + Math.cos(s.ry + 0.5) * Math.sin(0.8) * dist); camera.lookAt(s.x, hf(s.x, s.z) + 3, s.z); camera.updateMatrixWorld();
      ws.update(500 + (nm === 'far' ? 10 : 0), camera); if (fl) fl.update(T);
      node.visible = true; if (nm === 'far') ws.update(600, camera); const a = one(); node.visible = false; const b = one(); node.visible = true;
      out[nm] = { calls: a.calls - b.calls, tris: a.tris - b.tris };
    }
    const kind = s.kind, lvs = {}; for (const q of sites()) lvs[q.kind] = 0;
    ws.rebuild(lvs); const t0 = performance.now(); lvs[kind] = lv; ws.rebuild(lvs); const rebuildMs = Math.round(performance.now() - t0);        // time of the (re)build of this kind at this level
    return JSON.stringify({ id, lv, ...out, rebuildMs, programs: renderer.info.programs.length });
  };
  window.__ids = sites().map((s) => s.id);
  window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
