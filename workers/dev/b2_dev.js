// b2_dev.js — fast viewer for the B2 house kit.  ?mode=pieces&kit=/b2_out/x.glb : every named kit piece on a grid (with its name)
//                                                ?mode=homes : the four kinds x levels (&lv=1,15,30) built by homePieces, from the game camera angle
//   window.__ready, window.__stats = { calls, tris } of the baked homes
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { bakePieces } from '../bot/bluebot_v2/bluewall/client/src/village.js';
import { rng } from '../bot/bluebot_v2/bluewall/client/src/noise.js';
import { HOME_KINDS, homePieces } from '../bot/bluebot_v2/bluewall/client/src/b2_homes.js';
(async () => {
  const q = new URLSearchParams(location.search), mode = q.get('mode') || 'homes', kitUrl = q.get('kit') || 'assets/kit_homes.glb';
  const W = innerWidth, H = innerHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fb8d8);
  scene.add(new THREE.HemisphereLight(0xdbe7ff, 0x55603f, 1.5));
  const sun = new THREE.DirectionalLight(0xfff1d6, 3.0); sun.position.set(60, 90, 40); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 300 }); scene.add(sun); scene.add(sun.target);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0x6b7a4f, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const kit = await ld.loadAsync(kitUrl);
  const labels = []; const lab = (txt, x, y, z) => labels.push([txt, new THREE.Vector3(x, y, z)]);
  const list = [];
  const names = kit.scene.children.map((c) => c.name);
  if (mode === 'pieces') {
    const cols = +(q.get('cols') || 6), gap = +(q.get('gap') || 14), only = q.get('only') ? new RegExp(q.get('only')) : null;
    const sel = names.filter((n) => !only || only.test(n)), rows = Math.ceil(sel.length / cols);
    sel.forEach((n, i) => { const x = (i % cols - (cols - 1) / 2) * gap, z = (Math.floor(i / cols) - (rows - 1) / 2) * gap; list.push({ name: n, matrix: new THREE.Matrix4().makeTranslation(x, 0, z) }); lab(n, x, 0, z + gap * 0.42); });
  } else if (mode === 'mix') {                                              // N mixed homes (55 / 25 / 14 / 6 %, levels 1..30 at random): the draw-call / triangle / bake-time check
    const n = +(q.get('n') || 120), cols = +(q.get('cols') || 12), R = rng(+(q.get('seed') || 5)), W = [['cottage', 0.55], ['craftsman', 0.8], ['merchant', 0.94], ['noble', 1]], gx = 14;
    for (let i = 0; i < n; i++) {
      const u = R(), k = W.find((w) => u <= w[1])[0], lv = 1 + Math.floor(R() * 30), x = (i % cols - (cols - 1) / 2) * gx, z = (Math.floor(i / cols) - (Math.ceil(n / cols) - 1) / 2) * gx, lot = new THREE.Matrix4().makeTranslation(x, 0, z);
      for (const p of homePieces(k, lv, 1000 + i)) list.push({ name: p.n, matrix: new THREE.Matrix4().multiplyMatrices(lot, new THREE.Matrix4().compose(new THREE.Vector3(p.x, 0, p.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.ry || 0), new THREE.Vector3(1, 1, 1))) });
    }
  } else {
    const lvs = (q.get('lv') || '1,15,30').split(',').map(Number), kinds = (q.get('kinds') || Object.keys(HOME_KINDS).join(',')).split(','), seed = +(q.get('seed') || 7), gx = +(q.get('gx') || 18), gz = +(q.get('gz') || 18);
    kinds.forEach((k, c) => lvs.forEach((lv, r) => {                        // kinds across, levels down (nothing hides anything from the game camera)
      const x = (c - (kinds.length - 1) / 2) * gx, z = (r - (lvs.length - 1) / 2) * gz, lot = new THREE.Matrix4().makeTranslation(x, 0, z);
      for (const p of homePieces(k, lv, seed)) list.push({ name: p.n, matrix: new THREE.Matrix4().multiplyMatrices(lot, new THREE.Matrix4().compose(new THREE.Vector3(p.x, p.y || 0, p.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.ry || 0), new THREE.Vector3(p.s || 1, p.s || 1, p.s || 1))) });
      lab(k + ' lv ' + lv, x, 0, z + HOME_KINDS[k].d / 2 + 2.4);
    }));
  }
  const t0 = performance.now(), res = bakePieces(scene, kit, list, { shadows: true, tag: 'homes' }), bakeMs = performance.now() - t0;
  const t1 = performance.now(), tmp = new THREE.Scene(); bakePieces(tmp, kit, list, { shadows: true, tag: 'again' }); const bakeMs2 = performance.now() - t1;       // the second bake = warm JIT
  let tris = 0; for (const m of res.meshes) { const g = m.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; }
  const camera = new THREE.PerspectiveCamera(+(q.get('fov') || 40), W / H, 0.5, 2000);
  const polar = +(q.get('polar') || 0.95), az = +(q.get('az') || 0.0), dist = +(q.get('dist') || 80), tx = +(q.get('tx') || 0), tz = +(q.get('tz') || 0), ty = +(q.get('ty') || 3);
  camera.position.set(tx + Math.sin(az) * Math.sin(polar) * dist, ty + Math.cos(polar) * dist, tz + Math.cos(az) * Math.sin(polar) * dist); camera.lookAt(tx, ty, tz);
  sun.target.position.set(tx, 0, tz); sun.position.set(tx + 60, 90, tz + 40);
  renderer.render(scene, camera);
  const div = (txt, v) => { const p = v.clone().project(camera); const d = document.createElement('div'); d.className = 'lb'; d.textContent = txt; d.style.left = ((p.x + 1) / 2 * W) + 'px'; d.style.top = ((1 - p.y) / 2 * H) + 'px'; document.body.appendChild(d); };
  if (q.get('labels') !== '0') for (const [t, v] of labels) div(t, v);
  window.__stats = { calls: res.meshes.length, tris: Math.round(tris), pieces: names.length, placed: list.length, bakeMs: Math.round(bakeMs), bakeWarmMs: Math.round(bakeMs2) };
  window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
