// TR2-S4b preview: ONE worksite (real town lots included: town_plan.js registers the provider) on the real terrain, real kits, real builder + the Tripo models.  window.__show(id, lv, azim, dist, polar, ty)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as L from '../../bot/bluebot_v2/bluewall/client/src/layout.js';
import '../../bot/bluebot_v2/bluewall/client/src/town_plan.js';
import { buildWorksites } from '../../bot/bluebot_v2/bluewall/client/src/wsbuild.js';
import * as WT from '../../bot/bluebot_v2/bluewall/client/src/ws_tr2.js';
import { buildRoads } from '../../bot/bluebot_v2/bluewall/client/src/roads.js';
import { sites, counts } from '../../bot/bluebot_v2/bluewall/client/src/worksites.js';
import { setLevelCap } from '../../bot/bluebot_v2/bluewall/client/src/tiers.js';
import { tr2 } from '../../bot/bluebot_v2/bluewall/client/src/tr2lib.js';
(async () => {
  { const cp = new URLSearchParams(location.search).get('cap'); if (cp) setLevelCap(+cp); }
  L.setMap('night'); buildRoads();
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const [kit, kitC1, kitC2, kitC3, kitC4] = await Promise.all(['kit_ws', 'kit_c1', 'kit_c2', 'kit_c3', 'kit_c4'].map((n) => ld.loadAsync('/assets/' + n + '.glb')));
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fb8d8); scene.fog = new THREE.Fog(0x9fb8d8, 160, 420);
  scene.add(new THREE.HemisphereLight(0xdbe7ff, 0x55603f, 1.5));
  const sun = new THREE.DirectionalLight(0xfff1d6, 3.0); sun.position.set(60, 90, 40); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 300 }); scene.add(sun); scene.add(sun.target);
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.5, 2000);
  let ground = null, ws = null;
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
  window.__show = async (id, lv = 30, az = 0.6, dist = 60, polar = 0.9, ty = 3) => {
    const s = sites().find((q) => q.id === id); if (!s) return 'no site ' + id;
    terrain(s.x, s.z);
    if (ws) { scene.remove(ws.group); ws = null; }
    const only = {}; for (const q of sites()) only[q.kind] = q.kind === s.kind ? lv : 0;
    if (!window.__tr2off) await WT.preload(only); else window.__tr2miss = 'off';
    const t0 = performance.now();
    ws = buildWorksites(scene, kit, hf, { shadows: true, castle: lv, kitC1, kitC2, kitC3, kitC4 }); ws.rebuild(only);
    window.__buildMs = Math.round((performance.now() - t0) * 10) / 10; window.__ws = ws;
    sun.target.position.set(s.x, 0, s.z); sun.position.set(s.x + 60, 90, s.z + 40);
    const aim = window.__aim || [0, 0], cxw = s.x + aim[0] * Math.cos(s.ry) + aim[1] * Math.sin(s.ry), czw = s.z - aim[0] * Math.sin(s.ry) + aim[1] * Math.cos(s.ry);
    const a = s.ry + az; camera.position.set(cxw + Math.sin(a) * Math.sin(polar) * dist, hf(cxw, czw) + ty + Math.cos(polar) * dist, czw + Math.cos(a) * Math.sin(polar) * dist); camera.lookAt(cxw, hf(cxw, czw) + ty, czw); camera.updateMatrixWorld();
    const lodSt = ws.sites().get(s.id); const Lg = lodSt && lodSt.g.userData.lod; const triOf = (ms) => ms.reduce((a, m) => a + (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3, 0);
    if (Lg && window.__far) { for (const m of Lg.near) m.visible = false; for (const m of Lg.far) m.visible = true; }
    renderer.render(scene, camera);
    return JSON.stringify({ id, kind: s.kind, lv, counts: counts(s, lv), calls: renderer.info.render.calls, tris: renderer.info.render.triangles, buildMs: window.__buildMs, tr2: tr2.stats(), lod: Lg ? { near: [Lg.near.length, Math.round(triOf(Lg.near))], far: [Lg.far.length, Math.round(triOf(Lg.far))] } : null });
  };
  window.__meshes = () => { const out = []; ws.group.traverse((o) => { if (o.isMesh) out.push({ name: o.name, tris: Math.round((o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3) }); }); return JSON.stringify(out); };
  window.__info = async (names) => { await tr2.init(); await tr2.load(names); const o = {}; for (const n of names) { const i = tr2.info(n, { k: 1 }); o[n] = { size: i.size.map((v) => +v.toFixed(3)), tris: i.tris }; } return JSON.stringify(o); };
  window.__lodStats = async (names, keep, err, flags) => { await tr2.init(); await tr2.load(names); await WT.preload({}); const o = {}; for (const n of names) { const full = tr2.info(n).tris; const q = WT.farTrisWith(n, keep, err); o[n] = [Math.round(full), Math.round(q)]; } return JSON.stringify(o); };
  window.__ids = sites().map((s) => ({ id: s.id, kind: s.kind, town: !!s.town, unlock: s.unlock }));
  window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
