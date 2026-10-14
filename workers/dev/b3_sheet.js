// b3_sheet.js — the B3 sample sheet through the REAL code path: civicPieces() -> bakePieces() (village.js) on the real kit_civic.glb, lit like the game.
//   window.__sheet(cells, { cw, ch }) with cells = [{ kind, lv, seed, az, dist, polar, ty, label }]  -> draws the numbered grid into <canvas id=out>, returns the per-cell stats
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { bakePieces } from '../bot/bluebot_v2/bluewall/client/src/village.js';
import { CIVIC_KINDS, civicPieces, civicTier } from '../bot/bluebot_v2/bluewall/client/src/b3_civic.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const kit = await ld.loadAsync('assets/kit_civic.glb');
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fb8d8); scene.fog = new THREE.Fog(0x9fb8d8, 90, 260);
  scene.add(new THREE.HemisphereLight(0xdbe7ff, 0x55603f, 1.5));
  const sun = new THREE.DirectionalLight(0xfff1d6, 3.0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 200 }); scene.add(sun); scene.add(sun.target);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x5f8a45, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 1000);
  const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  window.__sheet = (cells, o = {}) => {
    const cw = o.cw || 360, ch = o.ch || 300, cols = o.cols || 3, rows = Math.ceil(cells.length / cols);
    renderer.setSize(cw, ch); const cv = document.getElementById('out'); cv.width = cw * cols; cv.height = ch * rows; const c2 = cv.getContext('2d'); c2.fillStyle = '#10151f'; c2.fillRect(0, 0, cv.width, cv.height);
    const stats = [];
    cells.forEach((c, i) => {
      const K = CIVIC_KINDS[c.kind], list = civicPieces(c.kind, c.lv, c.seed || 1);
      const items = list.map((p) => ({ name: p.n, matrix: new THREE.Matrix4().compose(new THREE.Vector3(p.x, 0, p.z), q.setFromAxisAngle(up, p.ry), new THREE.Vector3(p.s, p.s, p.s)) }));
      const baked = bakePieces(scene, kit, items, { shadows: true, tag: 'b3' });
      const rect = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => new THREE.Vector3(a * K.w / 2, 0.06, b * K.d / 2))), new THREE.LineBasicMaterial({ color: 0x1b2a55 })); scene.add(rect);
      const R = Math.hypot(K.w, K.d) / 2, dist = c.dist || 2.4 * R, az = c.az != null ? c.az : 0.55, po = c.polar != null ? c.polar : 0.95, ty = c.ty != null ? c.ty : 2;
      camera.aspect = cw / ch; camera.position.set(Math.sin(az) * Math.sin(po) * dist, Math.cos(po) * dist + ty, Math.cos(az) * Math.sin(po) * dist); camera.lookAt(0, ty, 0); camera.updateProjectionMatrix();
      sun.position.set(40, 70, 50); sun.target.position.set(0, 0, 0);
      renderer.info.reset(); renderer.render(scene, camera);
      const st = { n: i + 1, kind: c.kind, lv: c.lv, tier: civicTier(c.lv), pieces: list.length, calls: renderer.info.render.calls, tris: Math.round(triOf(baked.meshes)) };
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch; c2.drawImage(renderer.domElement, x, y);
      c2.fillStyle = 'rgba(8,12,28,0.78)'; c2.fillRect(x, y, cw, 34); c2.fillStyle = '#fff'; c2.font = 'bold 22px sans-serif'; c2.fillText(String(i + 1), x + 8, y + 25);
      c2.font = '14px sans-serif'; c2.fillStyle = '#cfe3ff'; c2.fillText((c.label || (c.kind + '  lv ' + c.lv)) + '   tier ' + st.tier, x + 44, y + 15); c2.fillStyle = '#9fd'; c2.fillText(st.pieces + ' pieces · ' + Math.round(st.tris / 100) / 10 + 'k tris · 1 draw (+1 shadow)', x + 44, y + 30);
      c2.strokeStyle = '#000'; c2.strokeRect(x, y, cw, ch); stats.push(st);
      scene.remove(rect); rect.geometry.dispose(); for (const m of baked.meshes) { scene.remove(m); m.geometry.dispose(); }
    });
    return stats;
  };
  // cost probe: programs added next to the game's own kit, bake time, tris / meshes per lot (no shadow double counting)
  window.__cost = async () => {
    const out = {}, kitWs = await ld.loadAsync('assets/kit_ws.glb');
    camera.position.set(0, 25, 50); camera.lookAt(0, 0, 0); camera.aspect = 1; camera.updateProjectionMatrix(); renderer.setSize(200, 200);
    const place = (list) => list.map((p) => ({ name: p.n, matrix: new THREE.Matrix4().compose(new THREE.Vector3(p.x, 0, p.z), q.setFromAxisAngle(up, p.ry), new THREE.Vector3(p.s, p.s, p.s)) }));
    const ws = bakePieces(scene, kitWs, ['ws_barn', 'ws_sack', 'ws_stall_empty', 'ws_barrel'].map((n, i) => ({ name: n, matrix: new THREE.Matrix4().makeTranslation(i * 4 - 6, 0, 0) })), { shadows: true, tag: 'ws' });
    renderer.render(scene, camera); out.programsBefore = renderer.info.programs.length; out.wsMaterials = ws.materials.map((m) => m.name);
    const t0 = performance.now(), all = [];
    for (const kind of Object.keys(CIVIC_KINDS)) for (const lv of [1, 15, 30]) {
      const t1 = performance.now(), list = civicPieces(kind, lv, 7), b = bakePieces(scene, kit, place(list), { shadows: true, tag: 'b3' });
      out[kind + '_' + lv] = { pieces: list.length, meshes: b.meshes.length, tris: Math.round(triOf(b.meshes)), ms: +(performance.now() - t1).toFixed(1) };
      if (lv === 30) all.push(...b.meshes); else for (const m of b.meshes) { scene.remove(m); m.geometry.dispose(); }
    }
    renderer.render(scene, camera); out.programsAfter = renderer.info.programs.length; out.civicMaterials = [...new Set(all.map((m) => m.material.name || m.material.type))]; out.bakeAllMs = +(performance.now() - t0).toFixed(1);
    // a town's worth at lv 30: 1 market + 1 townhall + 1 tavern + 1 chapel + 10 wells, as ONE bakePieces call (what the mother will do)
    const town = []; const add = (kind, x, z, n = 1) => { for (let i = 0; i < n; i++) for (const p of civicPieces(kind, 30, 100 + i)) town.push({ n: p.n, x: p.x + x + i * 9, z: p.z + z, ry: p.ry, s: p.s }); };
    add('market', 0, 0); add('townhall', 40, 0); add('tavern', -40, 0); add('chapel', 0, 50); add('well', 0, -40, 10);
    const t2 = performance.now(), tb = bakePieces(scene, kit, place(town), { shadows: true, tag: 'b3town' }); out.townAt30 = { pieces: town.length, meshes: tb.meshes.length, tris: Math.round(triOf(tb.meshes)), ms: +(performance.now() - t2).toFixed(1) };
    renderer.info.reset(); renderer.render(scene, camera); out.townCalls = renderer.info.render.calls;
    return out;
  };
  window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
function triOf(meshes) { return meshes.reduce((a, m) => a + (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3, 0); }
