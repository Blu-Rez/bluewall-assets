import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
// contact sheet of a clip: ?m=gryphon&clip=Take 01&t0=0&t1=8.83&n=24&cols=6&cam=side|front|top|3q&sz=200&an=bone1,bone2 (print the world positions of bones)
(async () => {
  const Q = new URLSearchParams(location.search), name = Q.get('m') || 'gryphon';
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const g = await ld.loadAsync('../assets/' + name + '.glb');
  const clip = g.animations.find((c) => c.name === (Q.get('clip') || g.animations[0].name)) || g.animations[0];
  const t0 = +(Q.get('t0') || 0), t1 = +(Q.get('t1') || clip.duration), n = +(Q.get('n') || 24), S = +(Q.get('sz') || 200), camsL = (Q.get('cams') || Q.get('cam') || 'side').split(','), cols = Q.get('cams') ? n : +(Q.get('cols') || 6), rows = Q.get('cams') ? camsL.length : Math.ceil(n / cols);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(S * cols, S * rows); document.body.appendChild(renderer.domElement);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setScissorTest(true); renderer.setClearColor(0x3a4660);
  const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.2)); const dl = new THREE.DirectionalLight(0xffffff, 2.5); dl.position.set(3, 6, 4); scene.add(dl);
  scene.add(g.scene); if (Q.get('bind')) { g.scene.updateMatrixWorld(true); g.scene.traverse((o) => { if (o.isSkinnedMesh) o.skeleton.pose(); }); g.scene.updateMatrixWorld(true); }
  const drop = []; g.scene.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh && /Camera|Cube|Plane|Sphere|Cylinder/i.test(o.name) && !o.parent.isBone && o.parent.parent && o.parent.parent.isBone === false && false) drop.push(o); });
  const mixer = new THREE.AnimationMixer(g.scene); const act = mixer.clipAction(clip); if (!Q.get('noanim')) act.play();
  const box = new THREE.Box3(); const bones = {}; g.scene.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  const an = (Q.get('an') || '').split(',').filter(Boolean), out = [];
  // pass 1: frame box over all samples
  const times = Q.get('ts') ? Q.get('ts').split(',').map(Number) : []; if (!times.length) for (let i = 0; i < n; i++) times.push(t0 + (t1 - t0) * (n === 1 ? 0 : i / (n - 1)));
  const tb = new THREE.Box3(); for (const t of (Q.get('fit0') ? [times[0]] : times)) { mixer.setTime(t); g.scene.updateMatrixWorld(true); tb.union(box.setFromObject(g.scene, true)); }
  const c = tb.getCenter(new THREE.Vector3()), sz = tb.getSize(new THREE.Vector3()), R = Math.max(sz.x, sz.y, sz.z) * 0.62;
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 500), D = R / Math.tan(THREE.MathUtils.degToRad(15)) * 1.0, DIRS = { side: [1, 0.15, 0], front: [0, 0.15, 1], top: [0.01, 1, 0.01], '3q': [0.8, 0.4, 0.8], back: [0, 0.15, -1], '3qb': [-0.8, 0.4, 0.8] };
  times.forEach((t, i) => {
    mixer.setTime(t); g.scene.updateMatrixWorld(true);
    for (let ci = 0; ci < (Q.get('cams') ? camsL.length : 1); ci++) { const v = camsL[ci], k = Q.get('cams') ? ci * n + i : i; cam.position.copy(c).addScaledVector(new THREE.Vector3(...DIRS[v]).normalize(), D); cam.lookAt(c); const x = (k % cols) * S, y = (rows - 1 - Math.floor(k / cols)) * S; renderer.setViewport(x, y, S, S); renderer.setScissor(x, y, S, S); renderer.render(scene, cam); }
    if (an.length) out.push('t=' + t.toFixed(2) + ' ' + an.map((b) => { const o = bones[b]; if (!o) return b + ':?'; const p = o.getWorldPosition(new THREE.Vector3()); return b.replace('_CatArmature', '') + '=' + p.toArray().map((q) => q.toFixed(2)).join(','); }).join('  '));
  });
  window.__out = out.join('\n') + '\nBOX ' + sz.toArray().map((q) => q.toFixed(2)); window.__ready = true;
})().catch((e) => { window.__out = 'ERR ' + e.stack; window.__ready = true; });
