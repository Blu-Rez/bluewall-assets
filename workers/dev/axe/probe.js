import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const g = await ld.loadAsync('../assets/axe.glb');
  const out = [];
  g.scene.traverse((o) => { if (o.isMesh) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; out.push({ name: o.name, pos: o.position.toArray(), rot: o.rotation.toArray().slice(0,3), sc: o.scale.toArray(), min: b.min.toArray().map(v=>+v.toFixed(3)), max: b.max.toArray().map(v=>+v.toFixed(3)), tris: o.geometry.index ? o.geometry.index.count/3 : o.geometry.attributes.position.count/3, mat: o.material.name, map: !!o.material.map, vc: !!o.geometry.attributes.color }); } });
  const B = new THREE.Box3().setFromObject(g.scene); out.push({ world: [B.min.toArray(), B.max.toArray()] });
  // where along the haft is the densest vertex cluster of the head? sample vertex y histogram
  g.scene.traverse((o) => { if (o.isMesh) { const p = o.geometry.attributes.position, hx = {}; for (let i = 0; i < p.count; i++) { const k = Math.round(p.getY(i) * 20) / 20; hx[k] = (hx[k] || 0) + 1; } out.push({ hist: hx }); const xs={}; for (let i = 0; i < p.count; i++) { const k = Math.round(p.getX(i) * 20) / 20; xs[k] = (xs[k] || 0) + 1; } out.push({ histX: xs }); const zs={}; for (let i = 0; i < p.count; i++) { const k = Math.round(p.getZ(i) * 20) / 20; zs[k] = (zs[k] || 0) + 1; } out.push({ histZ: zs }); } });
  document.title = 'done'; window.__out = JSON.stringify(out);
})();
