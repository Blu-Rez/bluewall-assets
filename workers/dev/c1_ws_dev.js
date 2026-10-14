// ws_dev.js — fast preview of ONE worksite on the real terrain (layout.height with the level pads), real kit, real builder.  window.__show(id, lv, azim, dist, polar)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildWorksites } from '../bot/bluebot_v2/bluewall/client/src/wsbuild.js';
import { buildRoads } from '../bot/bluebot_v2/bluewall/client/src/roads.js';
import { buildWsLife } from '../bot/bluebot_v2/bluewall/client/src/wslife.js';      // (p42: the C1 wiring is in the real wslife.js now)
import * as C1K from '../bot/bluebot_v2/bluewall/client/src/c1_kinds.js';
import { PROC_C1 } from '../bot/bluebot_v2/bluewall/client/src/c1_proc.js';
import { Particles, PX } from '../bot/bluebot_v2/bluewall/client/src/fx.js';
import { glowTexture } from '../bot/bluebot_v2/bluewall/client/src/textures.js';
import { sites, counts } from '../bot/bluebot_v2/bluewall/client/src/worksites.js';
(async () => {
  L.setMap('night'); buildRoads();
// C1 preview sites on the real map: the planner is not wired yet, so two sites are put on the river bank here (local +z faces the water, centre 14 m behind the shore)
const ray = (px, pz, ang) => { const dx = Math.sin(ang), dz = Math.cos(ang); for (let d = 0; d < 160; d += 0.5) if (L.height(px + dx * d, pz + dz * d) < -0.3) return d; return -1; };
function shoreSite(id, kind, px, pz, ang, r, back = 14) {
  const d = ray(px, pz, ang), dx = Math.sin(ang), dz = Math.cos(ang), sx = px + dx * (d - back), sz = pz + dz * (d - back), h = L.height(sx, sz);
  L.PADS.push({ x: sx, z: sz, r: r * 0.72, b: 16, h });
  const s = { id, kind, x: sx, z: sz, ry: ang, r, link: [sx - dx * 30, sz - dz * 30], water: [px + dx * (d + 8), pz + dz * (d + 8)] };
  L.SITES.push(s); return s;
}
shoreSite('panning1', 'panning', 22, -143, -0.25, 22); shoreSite('smokehouse1', 'smokehouse', -122, -75, 0.85, 22);
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const kit = await ld.loadAsync('assets/kit_ws.glb'), kitC1 = await ld.loadAsync('assets/kit_c1.glb?' + Date.now());
  const M = {}; for (const n of ['peasant_m', 'peasant_f', 'anims', 'cow', 'horse_m2m_bay', 'horse_m2m_black', 'horse_m2m_grey', 'an_sheep', 'an_pig']) { try { M[n] = await ld.loadAsync('assets/' + n + '.glb'); } catch (e) { console.warn('model', n, e); } }
  const coatMap = (g) => { let m = null; g && g.scene.traverse((o) => { if (!m && o.isMesh && o.material && o.material.name !== 'Tack' && o.material.map) m = o.material.map; }); return m; };
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fb8d8); scene.fog = new THREE.Fog(0x9fb8d8, 160, 420);
  scene.add(new THREE.HemisphereLight(0xdbe7ff, 0x55603f, 1.5));
  const sun = new THREE.DirectionalLight(0xfff1d6, 3.0); sun.position.set(60, 90, 40); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 300 }); scene.add(sun); scene.add(sun.target);
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.5, 2000);
  PX.scale.value = innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(48 / 2)));
  const smoke = new Particles(scene, { count: 420, tex: glowTexture('rgba(255,255,255,1)'), blending: THREE.NormalBlending, color: [0.92, 0.93, 0.95] });
  let ground = null, ws = null, cur = null, life = null, T = 0;
  const smokeStep = (dt) => { for (const q of (ws ? ws.smokers : [])) { if (q.off) continue; q.acc += dt * (q.heavy ? 5 : 2.2); while (q.acc > 1) { q.acc -= 1; smoke.emit(q.x + (Math.random() - 0.5) * 0.4, q.y, q.z + (Math.random() - 0.5) * 0.4, 0.5 + Math.random() * 0.4, 1.4 + Math.random() * 0.8, 0.2 + Math.random() * 0.3, 5 + Math.random() * 2, q.heavy ? 1.8 : 1.3, 3.2, q.heavy ? 0.5 : 0.35); } } smoke.update(dt, 0.995, 0.08); };
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
    ws = buildWorksites(scene, kit, hf, { shadows: true, castle: lv, kitC1 });
    // every OTHER site off, this one at the asked level
    const only = {}; for (const q of sites()) only[q.kind] = q.id === id || q.kind === s.kind ? lv : 0; ws.rebuild(only);
    if (!life) { life = buildWsLife(scene, hf, { models: { peasant_m: M.peasant_m, peasant_f: M.peasant_f, anims: M.anims, cow: M.cow, horse: M.horse_m2m_bay }, coats: [coatMap(M.horse_m2m_black), coatMap(M.horse_m2m_grey)], sheep: M.an_sheep, pig: M.an_pig, kit, shadows: true, castle: lv }); for (const st of life.steps.slice(0, 3)) st(); }
    life.refresh(only); window.__lifeStats = life.stats();
    sun.target.position.set(s.x, 0, s.z); sun.position.set(s.x + 60, 90, s.z + 40);
    const aim = window.__aim || [0, 0], cxw = s.x + aim[0] * Math.cos(s.ry) + aim[1] * Math.sin(s.ry), czw = s.z - aim[0] * Math.sin(s.ry) + aim[1] * Math.cos(s.ry);
    const placeCam = (cx_, cz_) => { const a = s.ry + az; camera.position.set(cx_ + Math.sin(a) * Math.sin(polar) * dist, hf(cx_, cz_) + ty + Math.cos(polar) * dist, cz_ + Math.cos(a) * Math.sin(polar) * dist); camera.lookAt(cx_, hf(cx_, cz_) + ty, cz_); camera.updateMatrixWorld(); };
    placeCam(cxw, czw);
    // simulate a few seconds so the workers settle on their spots
    const dt = 0.1; for (let i = 0; i < (window.__simSecs ?? 12) / dt; i++) { T += dt; life.update(T, dt, camera); smokeStep(dt); }
    if (window.__aimCart != null && life.carts[window.__aimCart]) { const c = life.carts[window.__aimCart]; placeCam(c.x, c.z); life.update(T + 0.01, 0.01, camera); }
    renderer.render(scene, camera);
    return JSON.stringify({ id, lv, life: life.stats(), counts: counts(s, lv), calls: renderer.info.render.calls, tris: renderer.info.render.triangles });
  };
  // per-site cost: draw calls / triangles / shader programs at lv 0 / 1 / 15 / 30 (other kinds off), from two camera distances
  window.__perf = (id, dists = [70, 150]) => {
    const s = sites().find((q) => q.id === id); terrain(s.x, s.z);
    const out = [];
    for (const lv of [0, 1, 15, 30]) {
      const only = {}; for (const q of sites()) only[q.kind] = q.kind === s.kind ? lv : 0; ws.rebuild(only); if (life) life.refresh(only);
      for (const d of dists) {
        const a = s.ry + 0.6; camera.position.set(s.x + Math.sin(a) * Math.sin(0.9) * d, hf(s.x, s.z) + 3 + Math.cos(0.9) * d, s.z + Math.cos(a) * Math.sin(0.9) * d); camera.lookAt(s.x, hf(s.x, s.z) + 3, s.z); camera.updateMatrixWorld();
        life.update(T += 0.05, 0.05, camera); smokeStep(0.05);
        const R = () => { renderer.render(scene, camera); return [renderer.info.render.calls, renderer.info.render.triangles]; };
        const all = R(); life.group.visible = false; const w = R(); life.group.visible = true; ws.group.visible = false; const l = R(); ws.group.visible = true;
        out.push({ lv, d, all, sites: w, life: l, programs: renderer.info.programs.length });
      }
    }
    return JSON.stringify(out);
  };
  window.__tri = (id, lv = 30) => {
    const s = sites().find((q) => q.id === id); const only = {}; for (const q of sites()) only[q.kind] = q.kind === s.kind ? lv : 0; ws.rebuild(only);
    const g = ws.group.getObjectByName('ws:' + id); const rows = []; let tot = 0;
    g.traverse((o) => { if (!o.isMesh) return; const gm = o.geometry, t = (gm.index ? gm.index.count : gm.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); tot += t; rows.push([o.name || o.parent?.name || '?', Math.round(t), o.isInstancedMesh ? o.count : 1, o.castShadow ? 1 : 0]); });
    rows.sort((a, b) => b[1] - a[1]); return JSON.stringify({ tot: Math.round(tot), top: rows.slice(0, 14), n: rows.length });
  };
  // +0 shader programs: every material my sites draw with must already be used by a site of an existing kind
  window.__mats = () => {
    const all = {}; for (const q of sites()) all[q.kind] = 30; ws.rebuild(all);
    const used = (pred) => { const set = new Map(); ws.group.traverse((o) => { if (!o.isMesh) return; let g = o; while (g && !(g.name || '').startsWith('ws:')) g = g.parent; if (!g || !pred(g.name)) return; const m = o.material; set.set(m.uuid, m.name || m.type); }); return set; };
    const mine = used((n) => /^ws:(panning|smokehouse)/.test(n)), base = used((n) => !/^ws:(panning|smokehouse)/.test(n));
    const extra = [...mine].filter(([u]) => !base.has(u)).map(([, n]) => n);
    return JSON.stringify({ mine: [...mine.values()], extra, nBase: base.size });
  };
  // fishery A/B: what do C1's additions (2 nets + cleaning table + bucket) cost?  Switch C1's BUILD/PROC off, rebuild, measure the SITE ONLY (life hidden), switch back on.
  window.__ab = (id, lv = 30) => {
    const s = sites().find((q) => q.id === id); const camAt = () => { const a = s.ry + 0.6, d = 150; camera.position.set(s.x + Math.sin(a) * Math.sin(0.9) * d, hf(s.x, s.z) + 3 + Math.cos(0.9) * d, s.z + Math.cos(a) * Math.sin(0.9) * d); camera.lookAt(s.x, hf(s.x, s.z) + 3, s.z); camera.updateMatrixWorld(); };
    const meas = () => { const only = {}, zero = {}; for (const q of sites()) { only[q.kind] = q.kind === s.kind ? lv : 0; zero[q.kind] = 0; } ws.rebuild(zero); ws.rebuild(only); life.group.visible = false; camAt(); renderer.render(scene, camera); life.group.visible = true; return [renderer.info.render.calls, renderer.info.render.triangles - 16200]; };
    const b0 = C1K.BUILD[s.kind], p0 = PROC_C1[s.kind]; const on = meas();
    C1K.BUILD[s.kind] = () => []; PROC_C1[s.kind] = () => {}; const off = meas(); C1K.BUILD[s.kind] = b0; PROC_C1[s.kind] = p0;
    return JSON.stringify({ id, lv, withC1: on, withoutC1: off });
  };
  window.__time = (id, lv = 30) => { const s = sites().find((q) => q.id === id); const zero = {}, only = {}; for (const q of sites()) { zero[q.kind] = 0; only[q.kind] = q.kind === s.kind ? lv : 0; } const t = []; for (let i = 0; i < 5; i++) { ws.rebuild(zero); const t0 = performance.now(); ws.rebuild(only); t.push(+(performance.now() - t0).toFixed(1)); } return JSON.stringify({ id, lv, ms: t }); };
  window.__ids = sites().map((s) => s.id); window.__ws = () => ws; window.__info = () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles });
  window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
