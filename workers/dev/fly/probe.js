import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
(async () => {
  const Q = new URLSearchParams(location.search), name = Q.get('m') || 'gryphon';
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const g = await ld.loadAsync('../assets/' + name + '.glb');
  const out = [];
  const walk = (o, d) => { const extra = o.isSkinnedMesh ? ' SKINNED tris=' + (o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3) + ' mat=' + (o.material.name) : o.isMesh ? ' MESH tris=' + (o.geometry.index ? o.geometry.index.count / 3 : 0) + ' mat=' + o.material.name : o.isBone ? ' bone' : ''; out.push('  '.repeat(d) + o.name + ' [' + o.type + ']' + extra + (o.isBone || d < 3 ? ' pos=' + o.position.toArray().map((v) => v.toFixed(3)).join(',') + ' sc=' + o.scale.toArray().map((v) => v.toFixed(3)).join(',') : '')); o.children.forEach((c) => walk(c, d + 1)); };
  if (Q.get('tree') !== '0') walk(g.scene, 0);
  for (const a of g.animations) { out.push('CLIP ' + a.name + ' dur=' + a.duration.toFixed(3) + ' tracks=' + a.tracks.length); if (Q.get('tracks')) for (const t of a.tracks) out.push('   ' + t.name + ' n=' + t.times.length + ' t0=' + t.times[0].toFixed(2) + ' t1=' + t.times[t.times.length - 1].toFixed(2)); }
  const box = new THREE.Box3().setFromObject(g.scene, true); out.push('BOX ' + box.min.toArray().map((v) => v.toFixed(2)) + ' | ' + box.max.toArray().map((v) => v.toFixed(2)));
  window.__out = out.join('\n'); window.__ready = true;
})().catch((e) => { window.__out = 'ERR ' + e.stack; window.__ready = true; });
