import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const g = await ld.loadAsync('../assets/gryphon.glb'); const out = [];
  g.scene.updateMatrixWorld(true);
  const f = (v) => v.toArray().map((q) => q.toFixed(2)).join(',');
  const sk = g.scene.getObjectByName('Body003_1').skeleton;
  // rest (node) world pos
  const rest = {}, bind = {};
  sk.bones.forEach((b, i) => { rest[b.name] = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld); bind[b.name] = new THREE.Vector3().setFromMatrixPosition(sk.boneInverses[i].clone().invert()); });
  const par = (b) => b.parent && b.parent.isBone ? b.parent.name : null;
  sk.bones.forEach((b) => { const p = par(b); out.push(b.name.replace('_CatArmature','') + ' restLen=' + (p ? rest[b.name].distanceTo(rest[p]).toFixed(3) : '-') + ' bindLen=' + (p ? bind[b.name].distanceTo(bind[p]).toFixed(3) : '-') + ' | rest=' + f(rest[b.name]) + ' bind=' + f(bind[b.name]) + ' localPos=' + f(b.position)); });
  // bone world scale at rest and at anim time 0
  const m = new THREE.AnimationMixer(g.scene); m.clipAction(g.animations[0]).play(); m.setTime(0); g.scene.updateMatrixWorld(true);
  const b = sk.bones[3]; out.push('anim t0 Bone003 world scale ' + f(new THREE.Vector3().setFromMatrixScale(b.matrixWorld)) + ' bind scale ' + f(new THREE.Vector3().setFromMatrixScale(sk.boneInverses[3].clone().invert())));
  sk.bones.forEach((b2, i) => { if (/Neck|Head|Bone_|Bone003|Bone002/.test(b2.name)) out.push('ANIM ' + b2.name + ' world=' + f(new THREE.Vector3().setFromMatrixPosition(b2.matrixWorld))); });
  window.__out = out.join('\n'); window.__ready = true;
})().catch((e) => { window.__out = 'ERR ' + e.stack; window.__ready = true; });
