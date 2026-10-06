// Stone giants in rune armour — two guard the gate, one patrols the moat.
import * as THREE from 'three';
import { rimify } from './dragon.js';

function capsule(r, len, seg = 8) { const g = new THREE.CapsuleGeometry(r, len, 4, seg); g.translate(0, -len / 2 - r * 0.6, 0); return g; }

export function makeGiantMaterials(M, day = false) {
  const skin = rimify(new THREE.MeshStandardMaterial({ color: day ? 0x9a8f84 : 0x8f9aae, roughness: 0.85, metalness: 0.05, envMapIntensity: 0.8, emissive: 0x0c1426, emissiveIntensity: day ? 0 : 0.6 }), [0.15, 0.35, 0.8], 3.0, day ? 0.08 : 0.35);
  const armor = new THREE.MeshStandardMaterial({ color: day ? 0x6b7a92 : 0x5a6f96, roughness: 0.35, metalness: 0.8, envMapIntensity: 1.4 });
  const rune = new THREE.MeshStandardMaterial({ color: 0x0b1830, emissive: 0x59b8ff, emissiveIntensity: day ? 1.2 : 2.6, roughness: 0.5 });
  const eye = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 1.9, 3.4), toneMapped: false });
  const wood = new THREE.MeshStandardMaterial({ map: M.wood.map, color: 0x9a7a5a, roughness: 0.9 });
  return { skin, armor, rune, eye, wood };
}

export function buildGiant(GM, opts = {}) {
  const s = opts.scale ?? 1;
  const root = new THREE.Group(), hips = new THREE.Group();
  hips.position.y = 6.7; root.add(hips);
  const mesh = (g, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };

  // legs
  const legs = [-1, 1].map((e) => {
    const thigh = new THREE.Group(); thigh.position.set(e * 1.35, 0, 0); hips.add(thigh);
    mesh(capsule(1.15, 2.2), GM.skin, thigh);
    const knee = new THREE.Group(); knee.position.set(0, -3.2, 0); thigh.add(knee);
    mesh(capsule(1.0, 1.9), GM.skin, knee);
    mesh(new THREE.BoxGeometry(1.9, 0.8, 2.6), GM.skin, knee, 0, -3.1, 0.45);
    mesh(new THREE.CylinderGeometry(1.2, 1.25, 1.1, 8), GM.armor, knee, 0, -1.2, 0.05);   // greave
    return { thigh, knee };
  });
  mesh(new THREE.CylinderGeometry(2.1, 2.3, 1.6, 10), GM.armor, hips, 0, 0.2, 0);          // belt
  mesh(new THREE.BoxGeometry(1.4, 1.6, 0.3), GM.rune, hips, 0, -0.6, 1.9);                  // belt rune

  // torso
  const torso = new THREE.Group(); torso.position.y = 0.8; hips.add(torso);
  const chest = mesh(new THREE.SphereGeometry(1, 16, 12), GM.skin, torso, 0, 2.5, 0.15); chest.scale.set(2.7, 2.6, 2.1);
  const plate = mesh(new THREE.SphereGeometry(1, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), GM.armor, torso, 0, 3.0, 0.25);
  plate.scale.set(2.8, 2.4, 2.25); plate.rotation.x = -0.25;
  mesh(new THREE.TorusGeometry(0.9, 0.12, 6, 16), GM.rune, torso, 0, 3.3, 2.25).rotation.x = -0.2;
  mesh(new THREE.OctahedronGeometry(0.45), GM.rune, torso, 0, 3.3, 2.3);

  // head
  const neck = new THREE.Group(); neck.position.set(0, 4.9, 0.9); torso.add(neck);
  const headM = mesh(new THREE.SphereGeometry(1.15, 14, 10), GM.skin, neck, 0, 0.6, 0.3); headM.scale.set(1, 1.05, 1.1);
  mesh(new THREE.BoxGeometry(1.6, 0.7, 1.1), GM.skin, neck, 0, -0.05, 0.8);                // jaw
  mesh(new THREE.BoxGeometry(1.9, 0.35, 0.6), GM.skin, neck, 0, 0.95, 1.05);               // brow
  for (const e of [-1, 1]) {
    mesh(new THREE.SphereGeometry(0.17, 8, 6), GM.eye, neck, e * 0.42, 0.72, 1.32);
    const tusk = mesh(new THREE.ConeGeometry(0.13, 0.6, 5), GM.rune, neck, e * 0.55, 0.25, 1.35); tusk.rotation.x = -0.3;
  }
  const helm = mesh(new THREE.SphereGeometry(1.25, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), GM.armor, neck, 0, 0.85, 0.2); helm.scale.set(1, 0.9, 1.1);
  for (const e of [-1, 1]) { const h = mesh(new THREE.ConeGeometry(0.22, 1.6, 6), GM.armor, neck, e * 1.05, 1.5, 0.1); h.rotation.z = -e * 0.7; }

  // arms
  const arms = [-1, 1].map((e) => {
    const shoulder = new THREE.Group(); shoulder.position.set(e * 3.1, 4.0, 0.2); torso.add(shoulder);
    mesh(new THREE.SphereGeometry(1.35, 12, 10), GM.skin, shoulder);
    const pad = mesh(new THREE.SphereGeometry(1.6, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), GM.armor, shoulder, 0, 0.35, 0); pad.rotation.z = -e * 0.35;
    mesh(new THREE.TorusGeometry(1.25, 0.1, 5, 14), GM.rune, shoulder, 0, 0.2, 0).rotation.x = Math.PI / 2;
    mesh(capsule(0.95, 2.1), GM.skin, shoulder);
    const elbow = new THREE.Group(); elbow.position.set(0, -3.0, 0); shoulder.add(elbow);
    mesh(capsule(1.05, 1.8), GM.skin, elbow);
    mesh(new THREE.CylinderGeometry(1.15, 1.05, 1.4, 8), GM.armor, elbow, 0, -1.6, 0);   // bracer
    const hand = mesh(new THREE.SphereGeometry(1.0, 10, 8), GM.skin, elbow, 0, -3.5, 0.1); hand.scale.set(1, 1.1, 1.1);
    shoulder.rotation.z = e * 0.18;
    return { shoulder, elbow, hand };
  });
  // club in the right hand
  const club = new THREE.Group(); club.position.set(0, -3.6, 0.2); arms[1].elbow.add(club);
  const cg = new THREE.CylinderGeometry(0.95, 0.35, 8.5, 8); cg.translate(0, 3.2, 0);
  const clubM = mesh(cg, GM.wood, club); void clubM;
  for (let k = 0; k < 7; k++) { const a = k * 2.2, spk = mesh(new THREE.ConeGeometry(0.16, 0.8, 4), GM.armor, club, Math.cos(a) * 0.85, 5.3 + (k % 3) * 0.9, Math.sin(a) * 0.85); spk.rotation.z = -Math.cos(a) * 1.4; spk.rotation.x = Math.sin(a) * 1.4; }
  mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.4, 8), GM.rune, club, 0, 6.8, 0);
  club.rotation.x = 1.25;

  root.scale.setScalar(s);
  const st = { t0: Math.random() * 10, slam: -1, walk: 0 };

  function pose(t, dt, walking) {
    const T = t + st.t0;
    const breathe = Math.sin(T * 1.6);
    torso.scale.set(1 + breathe * 0.012, 1 + breathe * 0.02, 1 + breathe * 0.012);
    neck.rotation.y = Math.sin(T * 0.27) * 0.55 + Math.sin(T * 0.9) * 0.08;
    neck.rotation.x = Math.sin(T * 0.4) * 0.08;
    if (walking) {
      st.walk += dt * 2.3;
      const w = st.walk;
      legs[0].thigh.rotation.x = Math.sin(w) * 0.42; legs[1].thigh.rotation.x = -Math.sin(w) * 0.42;
      legs[0].knee.rotation.x = Math.max(0, -Math.cos(w)) * 0.7; legs[1].knee.rotation.x = Math.max(0, Math.cos(w)) * 0.7;
      hips.position.y = 6.7 + Math.abs(Math.cos(w)) * 0.25 - 0.2;
      torso.rotation.z = Math.sin(w) * 0.05; torso.rotation.x = 0.1;
      arms[0].shoulder.rotation.x = -Math.sin(w) * 0.35;
      arms[1].shoulder.rotation.x = Math.sin(w) * 0.2 - 0.25;
      arms[1].elbow.rotation.x = -0.6;
      return;
    }
    legs.forEach((l, i) => { l.thigh.rotation.x = -0.05; l.knee.rotation.x = 0.12; l.thigh.rotation.z = (i ? -1 : 1) * 0.06; });
    hips.position.y = 6.6 + breathe * 0.05;
    torso.rotation.x = 0.08 + breathe * 0.015;
    arms[0].shoulder.rotation.x = Math.sin(T * 0.8) * 0.04; arms[0].elbow.rotation.x = -0.25;
    // club: rest on shoulder-ish, every ~10 s lift & slam
    if (st.slam < 0 && Math.sin(T * 0.21) > 0.995) st.slam = 0;
    if (st.slam >= 0) {
      st.slam += dt;
      const k = st.slam;
      const lift = k < 1.2 ? k / 1.2 : k < 1.45 ? 1 - (k - 1.2) / 0.25 * 1.4 : k < 2.6 ? -0.4 + (k - 1.45) / 1.15 * 0.4 : 0;
      arms[1].shoulder.rotation.x = -0.35 - lift * 1.6;
      arms[1].elbow.rotation.x = -0.9 + lift * 0.4;
      if (k >= 1.45 && !st.hit) { st.hit = true; opts.onSlam && opts.onSlam(root); }
      if (k > 2.6) { st.slam = -1; st.hit = false; }
    } else {
      arms[1].shoulder.rotation.x = -0.35 + Math.sin(T * 0.8) * 0.04;
      arms[1].elbow.rotation.x = -0.9;
    }
  }
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { root, pose };
}
