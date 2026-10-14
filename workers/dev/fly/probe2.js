import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const g = await ld.loadAsync('../assets/gryphon.glb'); const out = [];
  g.scene.updateMatrixWorld(true);
  const f = (v) => v.toArray().map((q) => q.toFixed(2)).join(',');
  g.scene.traverse((o) => {
    if (o.isBone && /Head|Neck|Bone_|WingBaseL|WingTipL|Tail1_/.test(o.name)) out.push('BONE ' + o.name + ' world=' + f(o.getWorldPosition(new THREE.Vector3())));
    if (o.isMesh) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone(); const bw = b.clone().applyMatrix4(o.matrixWorld); out.push((o.isSkinnedMesh ? 'SKIN ' : 'MESH ') + o.name + ' mat=' + o.material.name + ' bboxLocal=' + f(b.min) + '|' + f(b.max) + ' world=' + f(bw.min) + '|' + f(bw.max) + ' bindMode=' + o.bindMode); }
    if (o.type === 'Object3D' || o.isGroup) out.push('NODE ' + o.name + ' q=' + o.quaternion.toArray().map((q) => q.toFixed(3)) + ' s=' + f(o.scale) + ' p=' + f(o.position));
  });
  const sk = g.scene.getObjectByName('Body003_1'); out.push('IBM head: ' + sk.skeleton.bones.map((b, i) => b.name.replace('_CatArmature', '')).join(' '));
  const i = sk.skeleton.bones.findIndex((b) => /Head_/.test(b.name)); const ib = sk.skeleton.boneInverses[i].clone().invert(); out.push('Head bind world = ' + f(new THREE.Vector3().setFromMatrixPosition(ib)) + ' bindMatrix pos scale ' + f(new THREE.Vector3().setFromMatrixScale(sk.bindMatrix)));
  window.__out = out.join('\n'); window.__ready = true;
})().catch((e) => { window.__out = 'ERR ' + e.stack; window.__ready = true; });
