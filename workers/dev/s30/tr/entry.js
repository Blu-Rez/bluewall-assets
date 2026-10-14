import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
const W = 900, H = 560;
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(W, H); r.setPixelRatio(1); r.outputColorSpace = THREE.SRGBColorSpace;
document.body.style.margin = 0; document.body.appendChild(r.domElement);
const sc = new THREE.Scene(); sc.background = new THREE.Color(0x8aa0b8); sc.add(new THREE.HemisphereLight(0xffffff, 0x445533, 1.6)); const d = new THREE.DirectionalLight(0xffffff, 2); d.position.set(3, 6, 5); sc.add(d);
const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder);
L.load('troll.glb', (g) => {
  const root = g.scene; root.updateMatrixWorld(true); let bone = null, m = null; const info = {};
  root.traverse((o) => { if (o.name === 'cave_troll_RArmPalm_052') bone = o; if (!m && o.isMesh && !o.isSkinnedMesh && /mace/i.test(o.name)) m = o; });
  info.bone = !!bone; info.mace = !!m;
  if (bone && m) {
    const bw = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld), mw = new THREE.Vector3().setFromMatrixPosition(m.matrixWorld);
    info.boneW = bw.toArray().map((v) => +v.toFixed(2)); info.maceW = mw.toArray().map((v) => +v.toFixed(2));
    const gg = m.geometry.clone(); gg.applyMatrix4(new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().copy(bone.matrixWorld).invert(), m.matrixWorld)); gg.computeBoundingBox();
    info.bb = [gg.boundingBox.min.toArray().map((v) => +v.toFixed(2)), gg.boundingBox.max.toArray().map((v) => +v.toFixed(2))];
    info.maceParent = m.parent && m.parent.name; info.maceVisible = m.visible; info.scaleW = new THREE.Vector3().setFromMatrixScale(m.matrixWorld).toArray();
    const bb0 = new THREE.Box3().setFromObject(root); info.rootBox = [bb0.min.toArray().map((v) => +v.toFixed(2)), bb0.max.toArray().map((v) => +v.toFixed(2))];
    // anim names
    info.anims = g.animations.map((a) => a.name + ':' + a.duration.toFixed(2));
    // does any clip animate the mace node?
    info.maceAnimated = g.animations.map((a) => a.tracks.filter((t) => /mace|second_handle/i.test(t.name)).length);
  }
  const rel = [];
  for (const clip of g.animations) for (const f of [0.02, 0.35, 0.7]) {
    const mx2 = new THREE.AnimationMixer(root); mx2.clipAction(clip).play(); mx2.setTime(clip.duration * f); root.updateMatrixWorld(true);
    const Mr = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().copy(bone.matrixWorld).invert(), m.matrixWorld), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc2 = new THREE.Vector3(); Mr.decompose(p, q, sc2);
    rel.push(clip.name + '@' + f + ' p=' + p.toArray().map((v) => v.toFixed(5)) + ' q=' + q.toArray().map((v) => v.toFixed(6)) + ' s=' + sc2.toArray().map((v) => v.toFixed(5)));
  }
  info.rel = rel;
  { const mx3 = new THREE.AnimationMixer(root); const cl = g.animations.find((a) => /idle/i.test(a.name)); mx3.clipAction(cl).play(); mx3.setTime(0.05); root.updateMatrixWorld(true);
    const bl = []; root.traverse((o) => { if (o.isBone && /Arm|Spine|Pelvis|Hip|Clav|Should|Head|Neck|Chest|Belly|Root|Waist/i.test(o.name)) { const p = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld), sc3 = new THREE.Vector3().setFromMatrixScale(o.matrixWorld); bl.push(o.name + ' ' + p.toArray().map((v) => v.toFixed(1)) + ' s=' + sc3.x.toFixed(3) + ' par=' + (o.parent && o.parent.name)); } });
    info.bones = bl; const sk = []; root.traverse((o) => { if (o.isSkinnedMesh) { const bb = new THREE.Box3().setFromObject(o); sk.push(o.name + ' ' + o.material.name + ' ' + bb.min.toArray().map((v) => v.toFixed(0)) + ' / ' + bb.max.toArray().map((v) => v.toFixed(0))); } }); info.skins = sk; }
  window.__info = info;
  const mx = new THREE.AnimationMixer(root); const clip = g.animations.find((a) => /attack1/i.test(a.name)) || g.animations[0]; mx.clipAction(clip).play(); mx.update(clip.duration * 0.35);
  root.updateMatrixWorld(true); sc.add(root);
  const bb = new THREE.Box3().setFromObject(root), c = bb.getCenter(new THREE.Vector3()), s = bb.getSize(new THREE.Vector3());
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 500); const R = Math.max(s.x, s.y, s.z) * 2.4; cam.position.set(c.x + R * 0.5, c.y + R * 0.2, c.z + R); cam.lookAt(c);
  r.render(sc, cam); window.__done = 1;
}, undefined, (e) => { window.__err = String(e); window.__done = 1; });
