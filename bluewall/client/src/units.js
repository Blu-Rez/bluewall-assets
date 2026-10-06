// Living fort: archers patrolling the walls, sword guards at the gate,
// villagers at work, troll giants guarding outside. Quaternius UAL rig
// characters + UAL animation clips (same bone names -> clips bind directly).
import * as THREE from 'three';
import * as L from './layout.js';
import { cloneSkinned } from './assets.js';
import { mergeSkinned } from './creature.js';
import { makeAxe, AXE_GRIP } from './gear_axe.js';
import { peasantHead } from './peasanthead.js';

const SC = 1.75;                     // gameplay scale for people (readable from the strategy camera)

export function buildUnits(scene, A, height, opts = {}) {
  const clips = {};
  for (const c of A.models.anims?.animations || []) clips[c.name] = c;
  const units = [];
  const tmp = new THREE.Vector3();

  function attach(root, bone, key, { s = 1, pos = [0, 0, 0], rot = [0, 0, 0] } = {}) {
    const b = root.getObjectByName(bone), g = A.models[key];
    if (!b || !g) return null;
    const o = g.scene.clone(true);
    o.scale.setScalar(s); o.position.set(...pos); o.rotation.set(...rot);
    o.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    b.add(o);
    return o;
  }

  function make(key, scale = SC) {
    const g = A.models[key]; if (!g) return null;
    mergeSkinned(g.scene);
    const root = cloneSkinned(g);
    root.scale.setScalar(scale);
    root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
    const mixer = new THREE.AnimationMixer(root);
    const u = { root, mixer, act: null, name: '', path: null, speed: 1.25 * scale, t: Math.random() * 10, clips: {} };
    u.play = (name, fade = 0.3, time = 1) => {
      let c = clips[name]; if (!c || u.name === name) return;
      c = u.clips[name] || (u.clips[name] = new THREE.AnimationClip(c.name, c.duration, c.tracks.filter((tr) => root.getObjectByName(tr.name.split('.')[0]))));
      const a = mixer.clipAction(c); a.reset(); a.timeScale = time; a.play();
      if (u.act) u.act.crossFadeTo(a, fade, false);
      u.act = a; u.name = name;
    };
    scene.add(root); units.push(u);
    return u;
  }
  const place = (u, x, z, ry) => { u.root.position.set(x, height(x, z), z); u.root.rotation.y = ry; };

  // ------------------------------------------------ gate guards (sword + shield)
  const G = L.GATE, a0 = L.OUTER[L.GATE_SEG], a1 = L.OUTER[(L.GATE_SEG + 1) % L.OUTER.length];
  const wl = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]), ax = (a1[0] - a0[0]) / wl, az = (a1[1] - a0[1]) / wl;
  const face = Math.atan2(G.nx, G.nz);
  for (const e of [-1, 1]) {
    const u = make(e < 0 ? 'ranger_m' : 'ranger_f'); if (!u) continue;
    attach(u.root, 'hand_r', 'sword', { s: 0.9, rot: [0, 0, -Math.PI / 2] });
    attach(u.root, 'hand_l', 'shield', { s: 0.7, pos: [0, 0.05, 0.05], rot: [0, Math.PI / 2, 0] });
    place(u, G.x + G.nx * 5 + ax * e * 4.2, G.z + G.nz * 5 + az * e * 4.2, face);
    u.play('Sword_Idle');
  }

  // (archers on the walls: see patrol.js — instanced, baked animation)

  // ------------------------------------------------ villagers
  const spots = opts.workSpots || [[6, -22], [22, -12], [-20, -4], [16, 18], [-12, 24], [4, 10]];
  spots.forEach(([x, z], k) => {
    const u = make(k % 2 ? 'peasant_f' : 'peasant_m', SC * 0.95); if (!u) return;
    { const hb = u.root.getObjectByName('Head'); if (hb) hb.add(peasantHead(k % 2 === 1, k % 3)); }     // the peasant models have no head of their own
    if (k % 3 === 0) { place(u, x, z, Math.random() * 6); u.play('Fixing_Kneeling'); return; }
    if (k % 3 === 1) { place(u, x, z, Math.random() * 6); u.play('Idle_Talking_Loop'); return; }
    const x2 = x * 0.2, z2 = z * 0.2 + 8;
    u.path = { a: [x, z], b: [x2, z2], f: Math.random(), dir: 1, y: null, wait: 0 };
    u.play('Walk_Loop');
  });

  // ------------------------------------------------ troll giants outside the gate
  const giants = [];
  { const pg = A.models.puglin; if (pg && !pg.scene.userData.bwNoStick) { const st = pg.scene.getObjectByName('Puglin_Stick'); if (st && st.parent) st.parent.remove(st); pg.scene.userData.bwNoStick = true; } }   // (its own wooden club would cross the axe)
  for (const e of [-1, 1]) {
    const u = make('puglin', 4.2); if (!u) continue;
    { const hand = u.root.getObjectByName('hand_r'); if (hand) { const ax = makeAxe(); ax.rotation.set(...AXE_GRIP.rotDeg.map((d) => d * Math.PI / 180)); ax.position.set(...AXE_GRIP.pos); hand.add(ax); } }   // a forged bearded war axe, the haft in the fist (gear_axe.js)
    const x = G.x + G.nx * 25 + ax * e * 10, z = G.z + G.nz * 25 + az * e * 10;
    place(u, x, z, face + e * 0.25);
    u.play('Sword_Idle', 0.3, 0.8);
    u.nextSlam = 6 + Math.random() * 8; giants.push(u);
  }

  function walk(u, dt) {
    const p = u.path;
    if (p.wait > 0) { p.wait -= dt; if (p.wait <= 0) u.play('Walk_Loop'); return; }
    const dx = p.b[0] - p.a[0], dz = p.b[1] - p.a[1], len = Math.hypot(dx, dz) || 1;
    p.f += (p.dir * u.speed * dt) / len;
    if (p.f >= 1 || p.f <= 0) { p.f = Math.min(1, Math.max(0, p.f)); p.dir *= -1; p.wait = 2 + Math.random() * 3; u.play('Idle_Loop'); }
    const x = p.a[0] + dx * p.f, z = p.a[1] + dz * p.f;
    u.root.position.set(x, p.y ?? height(x, z), z);
    const target = Math.atan2(dx * p.dir, dz * p.dir);
    let d = target - u.root.rotation.y; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    u.root.rotation.y += d * Math.min(1, dt * 6);
  }

  function update(dt) {
    for (const u of units) {
      if (!u.root.visible) continue;
      if (u.path) walk(u, dt);
      u.mixer.update(dt);
    }
    for (const g of giants) {
      if (!g.root.visible) continue;
      g.nextSlam -= dt;
      if (g.nextSlam <= 0 && g.name !== 'Sword_Attack') {
        g.play('Sword_Attack', 0.25, 0.7); g.slamT = 0; g.nextSlam = 12 + Math.random() * 10;
      }
      if (g.name === 'Sword_Attack') {
        g.slamT += dt;
        if (!g.hit && g.slamT > 0.9) { g.hit = true; opts.onSlam && opts.onSlam(g.root); }
        if (g.slamT > 1.9) { g.hit = false; g.play('Sword_Idle', 0.4, 0.8); }
      }
    }
  }
  return { update, units, giants: giants.map((g) => g.root), tmp, make, attach };
}
