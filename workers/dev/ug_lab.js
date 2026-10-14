// p35 ground-unit lab: the REAL createUnitViews (bunits.js) on a lit field with a fake sim (units only) - fast iteration for the five new ground units.
//   page: ug_lab.html?army={"legionary":3,...}&tier={"legionary":1}      window.__lab = { adv(sec), render(), cam(...), look(id,...), ev(e), U: units, views }
import * as THREE from 'three';
import { createUnitViews } from '../bot/bluebot_v2/bluewall/client/src/bunits.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { trimClips } from '../bot/bluebot_v2/bluewall/client/src/creature.js';
import { loadGLB } from '../bot/bluebot_v2/bluewall/client/src/assets.js';
window.__loadGLB = loadGLB; window.__SU = SkeletonUtils;
window.__glb = async (name, bonesToo = false) => {
  const g = await loadGLB(name); if (!g) return null; g.scene.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(g.scene, true), sz = bb.getSize(new THREE.Vector3());
  const bones = []; g.scene.traverse((o) => { if (o.isBone && bonesToo) { const p = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld); bones.push(o.name + ' ' + [p.x, p.y, p.z].map((v) => +v.toFixed(2)).join(',')); } });
  const meshes = []; g.scene.traverse((o) => { if (o.isMesh) meshes.push((o.isSkinnedMesh ? 'S ' : 'M ') + o.name + ' ' + (o.material && o.material.name) + (o.material && o.material.map ? ' tex' : '') + ' tris ' + ((o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 | 0)); });
  return { size: [sz.x, sz.y, sz.z].map((v) => +v.toFixed(3)), min: bb.min.toArray().map((v) => +v.toFixed(3)), anims: (g.animations || []).map((a) => a.name + ' ' + a.duration.toFixed(3) + 's ' + a.tracks.length), meshes, bones };
};
// sample a clip: for each named bone the [min, max] of its world x / y / z over the clip (model units), plus the whole-model box (every 4th frame)
window.__probe = async (name, clip, bones, frames = 24, boxToo = false) => {
  const g = await loadGLB(name); trimClips(g); const root = SkeletonUtils.clone(g.scene); const c = g.animations.find((a) => a.name === clip || a.name.endsWith('|' + clip));
  if (!c) return { err: 'no clip', clips: g.animations.map((a) => a.name) };
  const mx = new THREE.AnimationMixer(root); mx.clipAction(c).play(); const out = { dur: c.duration, bones: {} }, v = new THREE.Vector3(), box = new THREE.Box3(), bb = [1e9, -1e9, 1e9, -1e9];
  for (const b of bones) out.bones[b] = { x: [1e9, -1e9], y: [1e9, -1e9], z: [1e9, -1e9], path: [] };
  for (let f = 0; f < frames; f++) {
    mx.setTime((f / frames) * c.duration); root.updateMatrixWorld(true);
    for (const b of bones) { const o = root.getObjectByName(b); if (!o) { out.bones[b].missing = 1; continue; } o.getWorldPosition(v); const r = out.bones[b]; r.x = [Math.min(r.x[0], v.x), Math.max(r.x[1], v.x)]; r.y = [Math.min(r.y[0], v.y), Math.max(r.y[1], v.y)]; r.z = [Math.min(r.z[0], v.z), Math.max(r.z[1], v.z)]; r.path.push(+v.z.toFixed(3)); (r.py = r.py || []).push(+v.y.toFixed(2)); }
    if (boxToo && f % 3 === 0) { box.setFromObject(root, true); bb[0] = Math.min(bb[0], box.min.y); bb[1] = Math.max(bb[1], box.max.y); bb[2] = Math.min(bb[2], box.min.z); bb[3] = Math.max(bb[3], box.max.z); }
  }
  if (boxToo) out.box = { y: [bb[0], bb[1]], z: [bb[2], bb[3]] };
  return out;
};
// world directions of a bone's local axes (and its position / world scale) at clip time t
window.__axes = async (name, clip, bone, ts) => {
  const g = await loadGLB(name); trimClips(g); const root = SkeletonUtils.clone(g.scene); const c = (g.animations || []).concat(clip && clip.startsWith('@') ? [] : []).find((a) => a.name === clip || a.name.endsWith('|' + clip));
  const mx = new THREE.AnimationMixer(root); if (c) mx.clipAction(c).play(); const o = root.getObjectByName(bone), out = [];
  for (const t of ts) { if (c) mx.setTime(t); root.updateMatrixWorld(true); const q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(); o.matrixWorld.decompose(p, q, s);
    const d = (x, y, z) => new THREE.Vector3(x, y, z).applyQuaternion(q).toArray().map((v) => +v.toFixed(2)); out.push({ t, pos: p.toArray().map((v) => +v.toFixed(2)), scale: +s.x.toFixed(3), x: d(1, 0, 0), y: d(0, 1, 0), z: d(0, 0, 1) }); }
  return out;
};
// world axes of a bone of another glb under a clip of a third glb: __axes2(model, animsGlb, clip, bone, times)
window.__axes2 = async (name, an, clip, bone, ts) => {
  const [g, a] = await Promise.all([loadGLB(name), loadGLB(an)]); const root = SkeletonUtils.clone(g.scene), c = a.animations.find((q) => q.name.replace(/^.*\|/, '') === clip), mx = new THREE.AnimationMixer(root); mx.clipAction(c).play(); const o = root.getObjectByName(bone), out = [];
  for (const t of ts) { mx.setTime(t); root.updateMatrixWorld(true); const q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(); o.matrixWorld.decompose(p, q, sc); const d = (x, y, z) => new THREE.Vector3(x, y, z).applyQuaternion(q).toArray().map((v) => +v.toFixed(2)).join(','); out.push('t' + t + ' pos ' + p.toArray().map((v) => v.toFixed(2)) + ' x[' + d(1, 0, 0) + '] y[' + d(0, 1, 0) + '] z[' + d(0, 0, 1) + ']'); }
  return out;
};
// forward lean (deg, + = toward +z) of bones (local y axis) over a UAL clip, relative to the bind pose
window.__lean = async (clipName, bones, ts) => {
  const [rg, a1, a2] = await Promise.all([loadGLB('ranger_m'), loadGLB('anims'), loadGLB('anims_army')]); const clips = [...a1.animations, ...a2.animations]; const root = SkeletonUtils.clone(rg.scene);
  const cl = (n) => clips.find((c) => c.name.replace(/^.*\|/, '') === n), q = new THREE.Quaternion(), pos = new THREE.Vector3(), sc = new THREE.Vector3(), out = {};
  const pitch = () => { const r = {}; root.updateMatrixWorld(true); for (const b of bones) { const o = root.getObjectByName(b); o.matrixWorld.decompose(pos, q, sc); const v = new THREE.Vector3(0, 1, 0).applyQuaternion(q); r[b] = Math.atan2(v.z, v.y) * 180 / Math.PI; } return r; };
  const bind = pitch(); const mx = new THREE.AnimationMixer(root); mx.clipAction(cl(clipName)).play();
  for (const t of ts) { mx.setTime(t); const r = pitch(); out[t] = bones.map((b) => b + ' ' + (r[b] - bind[b]).toFixed(0)).join('  '); }
  return out;
};
(async () => {
  const Q = new URLSearchParams(location.search);
  window.THREE = THREE;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x7d9cc8);
  { // a sky-ish environment for the metals (the game has a PMREM sky): blue zenith, pale horizon, dark ground, a warm sun patch
    const es = new THREE.Scene(), sph = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'varying vec3 p; void main(){ float h = p.y; vec3 c = mix(vec3(.5,.55,.5), vec3(.8,.87,1.), smoothstep(-.1,.12,h)); c = mix(c, vec3(.32,.5,.95), smoothstep(.1,.8,h)); float s = pow(max(dot(p, normalize(vec3(-.5,.7,.5))),0.),24.); c += vec3(2.2,2.0,1.6)*s; gl_FragColor = vec4(c,1.); }' }));
    es.add(sph); const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, 0.02, 0.1, 100, { size: 128 }).texture; }
  scene.add(new THREE.HemisphereLight(0x6f8fd0, 0x2a3222, 1.3));
  const sun = new THREE.DirectionalLight(0xdfe6ff, 3.2); sun.position.set(-30, 46, 30); sun.target.position.set(0, 0, 0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  { const c = sun.shadow.camera; c.left = c.bottom = -40; c.right = c.top = 40; c.near = 5; c.far = 200; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.25; }
  scene.add(sun, sun.target);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0x4a6a3e, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.5, 3000);
  window.__ug = JSON.parse(Q.get('ug') || '{}');
  const army = JSON.parse(Q.get('army') || '{"legionary":1}'), tiers = JSON.parse(Q.get('tier') || '{}'), gap = +(Q.get('gap') || 14);
  const units = []; let id = 1, i = 0; const n = Object.values(army).reduce((a, b) => a + b, 0);
  for (const [type, c] of Object.entries(army)) for (let k = 0; k < c; k++) { units.push({ id: id++, type, side: 'A', x: (i - (n - 1) / 2) * gap, z: 0, face: +(Q.get('face') || 0), tier: tiers[type] ?? 3, active: false, dead: false }); i++; }
  const sim = { units, defenders: [] };
  const hooks = { land: (x, z, big) => { window.__landed = (window.__landed || 0) + 1; }, crack: () => {}, breath: () => {}, fireball: () => {}, collapse: () => {} };
  const t0 = performance.now();
  const views = await createUnitViews({ M: {}, scene, sim, forgeLevel: +(Q.get('forge') || 8), enemyLevel: 12, height: () => 0, hooks });
  window.__loadMs = performance.now() - t0;
  const L = window.__lab = { views, units, sim, scene, camera, renderer, t: 0, sun };
  L.adv = (sec, dt = 1 / 30) => { const N = Math.max(1, Math.round(sec / dt)); for (let k = 0; k < N; k++) { L.t += dt; if (L.onStep) L.onStep(L.t, dt); views.update(L.t, dt, camera); } return L.t; };
  L.render = () => { camera.updateMatrixWorld(true); camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); views.update(L.t, 1 / 600, camera); renderer.render(scene, camera); window.__frames = (window.__frames || 0) + 1; return renderer.info.render.triangles; };
  L.cam = (x, y, z, tx, ty, tz, fov) => { if (fov) { camera.fov = fov; camera.updateProjectionMatrix(); } camera.position.set(x, y, z); camera.lookAt(tx, ty, tz); camera.updateMatrixWorld(true); };
  // close-up of unit `uid`: dist m away, azimuth az (rad, 0 = in front of the unit), look height ly, camera lifted by up*dist
  L.look = (uid, dist, ly, az = 0.55, up = 0.12, fov = 30) => { const u = units.find((q) => q.id === uid), v = views.views.get(uid), p = v.parts[0] ? v.parts[0].p : { x: u.x, y: 0, z: u.z }, a = v.yaw + az; if (fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.position.set(p.x + Math.sin(a) * dist, p.y + ly + up * dist, p.z + Math.cos(a) * dist); camera.lookAt(p.x, p.y + ly, p.z); camera.updateMatrixWorld(true); sun.position.set(p.x - 30, 46, p.z + 30); sun.target.position.set(p.x, 0, p.z); sun.target.updateMatrixWorld(); return [p.x, p.y, p.z]; };
  // freeze unit uid on clip `clip` at `offset` s (then L.render()); the view state machine is bypassed
  L.pose = (uid, clip, offset = 0) => { const v = views.views.get(uid); for (const pt of v.parts) pt.p.play(clip, { fade: false, speed: 1, offset }); return v.parts.map((pt) => pt.p.name); };
  L.ev = (e) => views.event(e, L.t);
  L.byType = (t, k = 0) => units.filter((u) => u.type === t)[k];
  window.__stats = () => JSON.stringify({ kinds: Object.keys(views.kinds), tris: renderer.info.render.triangles, calls: renderer.info.render.calls, drawn: views.stats() });
  window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
