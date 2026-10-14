import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const L = (n) => ld.loadAsync('/assets/' + n + '.glb');
  const [rm, an, army, mage, kk, ww] = await Promise.all(['ranger_m', 'anims', 'anims_army', 'skel_mage', 'kk_anims', 'werewolf'].map((n) => L(n).catch(() => null)));
  const out = {};
  const probe = (name, model, clipsSrc, handName, extra) => {
    const clip = clipsSrc.animations.find((c) => c.name === name); if (!clip) { out[name] = 'missing'; return; }
    const root = SkeletonUtils.clone(model.scene); const mixer = new THREE.AnimationMixer(root);
    const tr = clip.tracks.filter((t) => root.getObjectByName(t.name.split('.')[0])); const c2 = new THREE.AnimationClip(name, clip.duration, tr);
    mixer.clipAction(c2).play();
    const hand = root.getObjectByName(handName), pel = root.getObjectByName('pelvis') || root.getObjectByName('Hips') || root;
    const N = Math.round(clip.duration * 60), P = [], v = new THREE.Vector3(), pv = new THREE.Vector3(), fwd0 = new THREE.Vector3();
    for (let i = 0; i <= N; i++) { mixer.setTime(i / 60); root.updateMatrixWorld(true); hand.getWorldPosition(v); pel.getWorldPosition(pv); P.push(v.clone().sub(pv)); }
    // speed of the hand (relative to the pelvis); peak = the moment of fastest motion; ext = the farthest the hand gets from the body in the horizontal plane
    let bs = 0, bt = 0, be = 0, et = 0; const sp = [];
    for (let i = 1; i <= N; i++) { const s = P[i].distanceTo(P[i - 1]) * 60; sp.push(s); if (s > bs) { bs = s; bt = i / 60; } const e = Math.hypot(P[i].x, P[i].z); if (e > be) { be = e; et = i / 60; } }
    // the moment the hand is moving fastest AND going away from the body: first local speed maximum above 60 % of the global one
    let first = bt; for (let i = 1; i < sp.length - 1; i++) if (sp[i] > bs * 0.6 && sp[i] >= sp[i - 1] && sp[i] >= sp[i + 1]) { first = (i + 1) / 60; break; }
    out[name] = { dur: +clip.duration.toFixed(3), peakT: +bt.toFixed(3), firstPeakT: +first.toFixed(3), extT: +et.toFixed(3), speed: +bs.toFixed(2) };
  };
  const army2 = { animations: [...an.animations, ...(army ? army.animations : [])] };
  for (const n of ['Punch_Cross', 'Sword_Regular_A', 'Sword_Regular_B', 'Sword_Attack', 'Shield_OneShot']) probe(n, rm, army2, 'hand_r');
  if (mage && kk) probe('Ranged_Magic_Shoot', mage, kk, 'handslotr');
  const k3 = await L('knight_k3'); out.knight = k3.animations.map((c) => c.name + ':' + c.duration.toFixed(3)).join(',');
  const hs = await L('horse_m2m_bay'); out.horse = hs.animations.filter((c) => /Kick|Head_But|Gallop|Trot/.test(c.name)).map((c) => c.name + ':' + c.duration.toFixed(3)).join(',');
  window.__out = out; window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); });
