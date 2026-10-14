import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { prowlerFly } from '../../bot/bluebot_v2/bluewall/client/src/bdragon.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const pw = await ld.loadAsync('../assets/prowler.glb'); prowlerFly(pw); const out = [];
  const f = (v) => v.toArray().map((q) => q.toFixed(2)).join(',');
  const sc = SkeletonUtils.clone(pw.scene); const root = new THREE.Group(); root.add(sc); sc.updateMatrixWorld(true);
  const mx = new THREE.AnimationMixer(sc); const fly = pw.animations.find((a) => a.name === 'Fly'); out.push('Fly dur ' + fly.duration.toFixed(3) + ' tracks ' + fly.tracks.length);
  for (const n of ['Neck_66.quaternion', 'Neck_66.position', 'Head_65.quaternion', 'Jaw1_57.quaternion', 'Torso_118.quaternion', 'EyeL_58.quaternion']) { const t = fly.tracks.find((q) => q.name === n); out.push('track ' + n + (t ? ' n=' + t.times.length : ' MISSING')); }
  mx.clipAction(fly).play();
  const sm = sc.getObjectByName('Object_37'), idx = (n) => sm.skeleton.bones.findIndex((b) => b.name === n);
  for (const tt of [0, 0.5, 1.07]) {
    mx.setTime(tt); sc.updateMatrixWorld(true);
    const P = (n) => new THREE.Vector3().setFromMatrixPosition(sc.getObjectByName(n).matrixWorld);
    out.push('t=' + tt + ' Torso ' + f(P('Torso_118')) + ' Neck ' + f(P('Neck_66')) + ' Head ' + f(P('Head_65')) + ' Jaw1 ' + f(P('Jaw1_57')) + ' Tail7 ' + f(P('Tail7_25')) + ' HandL ' + f(P('HandL_86')) + ' Pelvis ' + f(P('Pelvis_140')));
    const ax = (n) => { const o = sc.getObjectByName(n), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(); o.matrixWorld.decompose(p, q, s); return n + ' scale=' + s.x.toFixed(4) + ' x=' + f(new THREE.Vector3(1, 0, 0).applyQuaternion(q)) + ' y=' + f(new THREE.Vector3(0, 1, 0).applyQuaternion(q)) + ' z=' + f(new THREE.Vector3(0, 0, 1).applyQuaternion(q)); };
    if (tt === 0) { out.push(ax('Torso_118')); out.push(ax('Neck_66')); out.push(ax('Head_65')); out.push(ax('Spine_119')); }
  }
  // vertex weight stats
  const g = sm.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, n = g.attributes.position.count;
  const bones = sm.skeleton.bones.map((b) => b.name);
  const neck = sc.getObjectByName('Neck_66'); const set = new Set(); neck.traverse((o) => { if (o.isBone) set.add(bones.indexOf(o.name)); });
  const cnt = {}; let hv = 0, mixed = 0;
  for (let i = 0; i < n; i++) { let hw = 0, dom = -1, dw = 0; for (let c = 0; c < 4; c++) { const j = si.getComponent(i, c), w = sw.getComponent(i, c); if (set.has(j)) hw += w; if (w > dw) { dw = w; dom = j; } } cnt[bones[dom]] = (cnt[bones[dom]] || 0) + 1; if (hw > 0.02) hv++; if (hw > 0.02 && hw < 0.98) mixed++; }
  out.push('verts ' + n + ' with headset weight>0.02: ' + hv + ' mixed: ' + mixed + ' headset size ' + set.size);
  out.push('dominant counts ' + JSON.stringify(Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 18)));
  // bounding box (bind pos) of vertices in the headset
  const bb = new THREE.Box3(); const pos = g.attributes.position;
  for (let i = 0; i < n; i++) { let hw = 0; for (let c = 0; c < 4; c++) if (set.has(si.getComponent(i, c))) hw += sw.getComponent(i, c); if (hw > 0.5) bb.expandByPoint(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i))); }
  out.push('headset bbox (raw geometry units) ' + f(bb.min) + ' | ' + f(bb.max) + ' norm=' + pos.normalized + ' type=' + pos.array.constructor.name);
  out.push('bindMatrix scale ' + f(new THREE.Vector3().setFromMatrixScale(sm.bindMatrix)) + ' mesh world scale ' + f(new THREE.Vector3().setFromMatrixScale(sm.matrixWorld)));
  const ibN = sm.skeleton.boneInverses[idx('Neck_66')].clone().invert(); out.push('Neck bind pos ' + f(new THREE.Vector3().setFromMatrixPosition(ibN)) + ' Head bind ' + f(new THREE.Vector3().setFromMatrixPosition(sm.skeleton.boneInverses[idx('Head_65')].clone().invert())) + ' Torso bind ' + f(new THREE.Vector3().setFromMatrixPosition(sm.skeleton.boneInverses[idx('Torso_118')].clone().invert())));
  window.__out = out.join('\n'); window.__ready = true;
})().catch((e) => { window.__out = 'ERR ' + e.stack; window.__ready = true; });
