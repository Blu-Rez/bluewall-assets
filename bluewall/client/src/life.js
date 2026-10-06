// Life around the castle, streamed in after the first frame: the real blue
// dragon, troll gate-guards, ogre & siege camp, cyclops, treant, werewolf,
// eagles and crows, horses & cows in the pasture + the stable yard (pas_life.js), dogs in town,
// wolves at night, a patrolling horseman, windmill, watermill, blacksmith,
// watchtower, barn/silo/coop and vegetable rows.
import * as THREE from 'three';
import { dressKnight, axeKnight } from './gear_plume.js';
import { makeAxe } from './gear_axe.js';
import { AXE_RIDE } from './gear_sword.js';
import * as L from './layout.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeCreature, herd, freezeStatic, lodStep } from './creature.js';
import { instance } from './assets.js';
import { buildModelDragon } from './dragon_model.js';
import { roadPoints } from './terrain.js';
import { road } from './roads.js';
import { buildPastureLife } from './pas_life.js';

const v3 = new THREE.Vector3();
const HS = 1.335;                                         // Mesh2Motion horses: bind box is long (tail straight back), scale lengths by this

export function buildLife(sceneRoot, height, Q, hooks) {
  let scene = sceneRoot;                                  // while a model handler runs, `scene` is that model's own (hidden) bucket group
  const updaters = [], dayOnly = [], nightOnly = [], knights = [];
  if (typeof window !== 'undefined') window.__knights = knights;
  const picks = hooks.picks, creatures = hooks.creatures;
  const place = (o, x, z, ry = 0, dy = 0) => { o.position.set(x, height(x, z) + dy, z); o.rotation.y = ry; o.userData.bwCull = 340; o.userData.bwR = 60; scene.add(o); return o; };
  const placeS = (o, x, z, ry = 0, dy = 0) => freezeStatic(place(o, x, z, ry, dy));
  // many copies of one static model -> instanced
  const scatter = (g, hgt, pts) => {
    const box = new THREE.Box3().setFromObject(g.scene), k = hgt / Math.max(0.01, box.max.y - box.min.y);
    instance(scene, g, pts.map(([x, z, r, s = 1]) => new THREE.Matrix4().compose(new THREE.Vector3(x, height(x, z) - box.min.y * k * s, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r), new THREE.Vector3(k * s, k * s, k * s))), { cast: false });
  };
  const vis = (o) => () => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };       // a hidden creature can't be tapped
  const pick = (o, id, r, hy = 3) => creatures.push({ id, r, vis: vis(o), center: () => v3.set(o.position.x, o.position.y + hy, o.position.z) });
  let camRef = null, lastP = null;
  const F = { n: 0 };
  // animate at half rate; nothing is animated while hidden or far away (riders follow their horse's flags)
  const loop = (c, re, speed = 1) => {
    c.play(re, { speed }) || c.play(/.*/); if (c.act) c.act.time = Math.random() * 2;
    let acc = 0; const ph = Math.random() < 0.5 ? 1 : 0;
    updaters.push((t, dt) => {
      acc += dt; const ref = c.root.userData.farRef || c.root;
      if (!ref.visible || ref.userData.bwFar) { if (acc > 1) acc = 0; return; }
      if ((F.n + ph) % 2 === 0) { c.mixer.update(acc); acc = 0; }
    });
  };
  const G = L.TGATES[0] || L.GATE, POLY = L.TGATES[0] ? L.TOWN : L.OUTER, a0 = POLY[G.seg ?? L.GATE_SEG], a1 = POLY[((G.seg ?? L.GATE_SEG) + 1) % POLY.length];
  const wl = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]), ax = (a1[0] - a0[0]) / wl, az = (a1[1] - a0[1]) / wl, face = Math.atan2(G.nx, G.nz);
  const C = L.CAMP, PA = L.PASTURE, FS = { x: L.FIELDS.x + L.FIELDS.w / 2 + 22, z: L.FIELDS.z };

  const H = {
    // three dragons: the royal blue guardian over the citadel, a black one circling the town, a silver one over the peaks
    prowler(g) {
      const flap = { clip: 'Landing', from: 0, to: 1.05 };      // one level wing beat (what follows in the clip pitches the dragon upright to land), played forth and back
      const d = buildModelDragon(scene, g, hooks.breath, hooks.dragonCurve, { length: 34, tint: 0x5f8fe8, flap, light: Q.level !== 'low' });
      if (d) hooks.setDragon(d);
      const ring = (n, r0, r1, y0, y1, seed) => { const pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = Math.sin(i * 2.3 + seed) * 0.5 + 0.5; pts.push(new THREE.Vector3(Math.cos(a) * (r0 + (r1 - r0) * k), y0 + (y1 - y0) * (Math.sin(i * 1.7 + seed * 2) * 0.5 + 0.5), Math.sin(a) * (r0 + (r1 - r0) * k))); } return new THREE.CatmullRomCurve3(pts, true, 'centripetal'); };
      const extra = [
        { length: 28, tint: 0x2c3140, rim: [0.2, 0.45, 1.0], curve: ring(11, 150, 205, 62, 96, 1), speed: 16, s: 0.3 },
        { length: 24, tint: 0xe2ecff, rim: [0.55, 0.85, 1.0], curve: ring(9, 330, 430, 150, 215, 4), speed: 19, s: 0.7 },
      ];
      for (const e of extra) {
        const dd = buildModelDragon(scene, g, hooks.breath, e.curve, { length: e.length, tint: e.tint, rim: e.rim, flap, light: false, speed: e.speed, breathEvery: 22 });
        if (!dd) continue;
        dd.s = e.curve.getLength() * e.s; dd.root.visible = hooks.dragonsOn();
        updaters.push((t, dt) => { dd.root.visible = hooks.dragonsOn(); if (dd.root.visible) dd.update(t, dt); });
        creatures.push({ id: 'dragon', r: e.length * 0.35, center: () => dd.position });
      }
    },
    troll(g) {
      hooks.hideGiants();
      for (const e of [-1, 1]) {
        const c = makeCreature(g, { height: 11 }); if (!c) continue;
        place(c.root, G.x + G.nx * 30 + ax * e * 12, G.z + G.nz * 30 + az * e * 12, face + e * 0.2);
        loop(c, 'idle', 0.8); pick(c.root, 'giant', 6, 6);
        let next = 5 + Math.random() * 8 + (e > 0 ? 4 : 0), busy = 0, hitAt = 0;
        updaters.push((t, dt) => {
          next -= dt;
          if (next <= 0 && !busy) {
            const nm = Math.random() < 0.5 ? 'attack1' : 'attack2', cl = c.find(nm), d = (cl ? cl.duration : 2) / 0.8;
            c.play(nm, { speed: 0.8, once: true, fade: 0.25 }); busy = d; hitAt = d * 0.45; next = 14 + Math.random() * 10;
          }
          if (busy) { const b0 = busy; busy = Math.max(0, busy - dt); if (b0 > hitAt && busy <= hitAt && c.root.visible) hooks.slam(c.root); if (!busy) c.play('idle', { speed: 0.8, fade: 0.4 }); }
        });
      }
    },
    ogre(g) {
      const c = makeCreature(g, { height: 9 }); if (!c) return;
      place(c.root, C.x + 14, C.z + 6, -2.2); loop(c, 'Armature|Ideal', 0.9); pick(c.root, 'giant', 5, 5);
      let next = 8;
      let back = 0;
      updaters.push((t, dt) => {
        next -= dt;
        if (next <= 0) { const nm = Math.random() < 0.5 ? 'Armature|Roar2' : 'Armature|Slam', cl = c.find(nm); c.play(nm, { once: true, speed: 0.8 }); back = (cl ? cl.duration : 3) / 0.8; next = 16 + Math.random() * 10 + back; }
        if (back > 0) { back -= dt; if (back <= 0) c.play('Armature|Ideal', { speed: 0.9, fade: 0.5 }); }
      });
    },
    cyclops(g) {
      const c = makeCreature(g, { height: 16 }); if (!c) return;
      const a = 3.49, d = 292; place(c.root, Math.cos(a) * d, Math.sin(a) * d, a + Math.PI); loop(c, /.*/, 0.7); pick(c.root, 'giant', 8, 8);
    },
    treant(g) {
      const c = makeCreature(g, { height: 12 }); if (!c) return;
      const x = -52, z = 298; place(c.root, x, z, 1.9); loop(c, 'Armature|Idle01', 0.6); pick(c.root, 'giant', 6, 6);
    },
    werewolf(g) {
      for (let i = 0; i < 2; i++) {
        const c = makeCreature(g, { height: 4.6 }); if (!c) continue;
        const a = 3.6 + i * 0.5, d = 300; place(c.root, Math.cos(a) * d, Math.sin(a) * d, a + Math.PI);
        loop(c, /Stand - 1|Walk/, 0.9); nightOnly.push(c.root);
      }
    },
    eagle(g) {
      for (let i = 0; i < 2; i++) {
        const c = makeCreature(g, { length: 5 }); if (!c) continue;
        scene.add(c.root); loop(c, /.*/, 0.8); dayOnly.push(c.root);
        const ph = i * 3.1, r = 90 + i * 40, cx = i ? -40 : 60, cz = i ? 60 : -40;
        updaters.push((t) => { const a = t * (0.09 + i * 0.02) + ph; c.root.position.set(cx + Math.cos(a) * r, 75 + i * 18 + Math.sin(t * 0.4 + i) * 6, cz + Math.sin(a) * r); c.root.rotation.set(0, -a, -0.32); });
      }
    },
    // crows: the model has NO wing clip (its only motion is head / beak / legs = a bird walking and pecking), and its feather texture is a specular-glossiness
    // one that three.js no longer reads (they were white dots "circling" in the air). Now: black crows that walk and peck on the ground of the harvested fields.
    crow(g) {
      const F0 = L.FIELDS, cr = Math.cos(F0.rot), sr = Math.sin(F0.rot), flock = [];
      const spot = (px, pz) => {
        for (let k = 0; k < 8; k++) { const u = (Math.random() - 0.5) * (F0.w - 8), w = (Math.random() - 0.5) * (F0.d - 8), x = F0.x + u * cr - w * sr, z = F0.z + u * sr + w * cr; if (px === undefined || Math.hypot(x - px, z - pz) < 13) return [x, z]; }
        return [F0.x, F0.z];
      };
      for (let i = 0; i < 6; i++) {
        const c = makeCreature(g, { length: 1.5 }); if (!c) break;
        const [x, z] = spot(); c.root.position.set(x, height(x, z), z); c.root.rotation.y = Math.random() * 6.28; c.root.userData.bwCull = 320;
        scene.add(c.root); loop(c, /.*/, 0.9); dayOnly.push(c.root);
        flock.push({ c, tx: x, tz: z, walk: false, tm: Math.random() * 5, sp: 0.8 + Math.random() * 0.5 });
      }
      updaters.push((t, dt) => {
        for (const b of flock) {
          const r = b.c.root; if (!r.visible || r.userData.bwFar) continue;
          const p = r.position; b.tm -= dt;
          if (!b.walk && b.tm <= 0) { [b.tx, b.tz] = spot(p.x, p.z); b.walk = true; b.tm = 12; if (b.c.act) b.c.act.timeScale = 1.5; }
          if (b.walk) {
            const dx = b.tx - p.x, dz = b.tz - p.z, d = Math.hypot(dx, dz);
            if (d < 0.5 || b.tm <= 0) { b.walk = false; b.tm = 3 + Math.random() * 7; if (b.c.act) b.c.act.timeScale = 0.7; }
            else {
              let da = Math.atan2(dx, dz) - r.rotation.y; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
              r.rotation.y += da * Math.min(1, dt * 4);
              const st = b.sp * dt * Math.max(0, Math.cos(da)); p.x += Math.sin(r.rotation.y) * st; p.z += Math.cos(r.rotation.y) * st; p.y = height(p.x, p.z);
            }
          }
        }
      });
    },
    // hens (there is no chicken model in the assets): ONE vertex-coloured instanced mesh (1 draw + 1 shadow draw), tinted per bird, walking and pecking around the coop
    _hens(cx, cz, bx) {
      const inside = (x, z) => x > bx.min.x && x < bx.max.x && z > bx.min.z && z < bx.max.z, yx = bx.min.x - 7, yz = cz + 3, h0 = height(yx, yz), flat = (x, z) => Math.abs(height(x, z) - h0) < 1.0;     // the level grass yard WEST of the coop (east of it the valley wall rises)
      const parts = [], M = new THREE.Matrix4(), Eu = new THREE.Euler(), Qn = new THREE.Quaternion(), Sc = new THREE.Vector3();
      const add = (geo, col, px, py, pz, sx, sy, sz, rx = 0, rz = 0) => {
        geo.scale(sx, sy, sz); geo.rotateX(rx); geo.rotateZ(rz); geo.translate(px, py - 0.30, pz);         // origin = the hip, so a "peck" pitches around it
        const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = col[0]; a[i * 3 + 1] = col[1]; a[i * 3 + 2] = col[2]; }
        geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); parts.push(geo);
      };
      const sph = () => new THREE.SphereGeometry(1, 10, 8), W = [0.95, 0.94, 0.9], WG = [0.86, 0.85, 0.82], RED = [0.72, 0.05, 0.05], OR = [0.95, 0.6, 0.12];
      add(sph(), W, 0, 0.30, -0.02, 0.2, 0.19, 0.3, 0.28);                       // body (rear up)
      add(sph(), W, 0, 0.30, 0.17, 0.17, 0.17, 0.17);                             // breast
      add(sph(), WG, 0.185, 0.31, -0.03, 0.035, 0.11, 0.2, 0.25); add(sph(), WG, -0.185, 0.31, -0.03, 0.035, 0.11, 0.2, 0.25);   // folded wings
      for (const z of [-0.4, 0, 0.4]) add(sph(), WG, 0, 0.42, -0.31, 0.035, 0.15, 0.07, -0.55, z);                                     // tail fan
      add(sph(), W, 0, 0.47, 0.2, 0.07, 0.14, 0.07, 0.35);                         // neck
      add(sph(), W, 0, 0.57, 0.26, 0.065, 0.065, 0.07);                            // head
      add(new THREE.ConeGeometry(0.025, 0.07, 6), OR, 0, 0.555, 0.335, 1, 1, 1, Math.PI / 2);   // beak
      add(sph(), RED, 0, 0.64, 0.255, 0.014, 0.05, 0.045); add(sph(), RED, 0, 0.52, 0.31, 0.012, 0.03, 0.015);                    // comb + wattle
      for (const x of [-0.06, 0.06]) { add(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 5), OR, x, 0.1, 0, 1, 1, 1); add(sph(), OR, x, 0.012, 0.03, 0.03, 0.012, 0.055); }   // legs + feet
      const geo = mergeGeometries(parts, false); for (const p of parts) p.dispose();
      const tints = [[0.95, 0.95, 0.93], [0.95, 0.95, 0.93], [0.95, 0.93, 0.9], [0.5, 0.27, 0.14], [0.45, 0.24, 0.12], [0.58, 0.34, 0.18], [0.7, 0.36, 0.12], [0.1, 0.1, 0.11]];   // 3 white, 3 brown, 1 golden rooster, 1 black
      const N = tints.length, mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, envMapIntensity: 0.4 }), N);
      mesh.name = 'hens'; mesh.frustumCulled = false; mesh.castShadow = true; mesh.receiveShadow = true;
      const ring = () => { for (let k = 0; k < 20; k++) { const a = Math.random() * 6.28, d = 1.5 + Math.random() * 8, x = yx + Math.cos(a) * d, z = yz + Math.sin(a) * d; if (!inside(x, z) && flat(x, z)) return [x, z]; } return [yx, yz]; };
      const hens = tints.map((c, i) => { mesh.setColorAt(i, new THREE.Color(c[0], c[1], c[2])); const [x, z] = ring(); return { x, z, ry: Math.random() * 6.28, tx: x, tz: z, walk: false, tm: Math.random() * 4, ph: Math.random() * 6.28, size: i === 6 ? 1.35 : 1.15 + Math.random() * 0.15 }; });
      mesh.instanceColor.needsUpdate = true; scene.add(mesh); dayOnly.push(mesh);
      const pick = (h) => { for (let k = 0; k < 8; k++) { const [x, z] = ring(); if (Math.hypot(x - h.x, z - h.z) < 7) { h.tx = x; h.tz = z; return; } } const [x, z] = ring(); h.tx = x; h.tz = z; };
      updaters.push((t, dt) => {
        if (!mesh.visible || (camRef && Math.hypot(camRef.position.x - cx, camRef.position.z - cz) > 300)) return;
        for (let i = 0; i < N; i++) {
          const h = hens[i]; h.tm -= dt; let pitch = 0, bob = 0, roll = 0;
          if (!h.walk && h.tm <= 0) { pick(h); h.walk = true; h.tm = 14; }
          if (h.walk) {
            const dx = h.tx - h.x, dz = h.tz - h.z, d = Math.hypot(dx, dz);
            if (d < 0.4 || h.tm <= 0) { h.walk = false; h.tm = 2.5 + Math.random() * 6; }
            else {
              let da = Math.atan2(dx, dz) - h.ry; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
              h.ry += da * Math.min(1, dt * 5); const st = 1.1 * dt * Math.max(0, Math.cos(da)), nx = h.x + Math.sin(h.ry) * st, nz = h.z + Math.cos(h.ry) * st;
              if (inside(nx, nz) || !flat(nx, nz)) { h.walk = false; h.tm = 1 + Math.random() * 3; } else { h.x = nx; h.z = nz; }
              const w = t * 9 + h.ph; bob = Math.abs(Math.sin(w)) * 0.02; roll = Math.sin(w) * 0.07; pitch = -0.04 + Math.sin(w * 2) * 0.03;
            }
          } else { const p = Math.sin(t * 4.6 + h.ph); pitch = p > 0 ? Math.min(1, p * 1.6) * 0.95 : 0; bob = -pitch * 0.05; }
          Eu.set(pitch, h.ry, roll, 'YXZ'); Qn.setFromEuler(Eu); Sc.setScalar(h.size);
          M.compose(v3.set(h.x, height(h.x, h.z) + (0.30 + bob) * h.size, h.z), Qn, Sc); mesh.setMatrixAt(i, M);
        }
        mesh.instanceMatrix.needsUpdate = true;
      });
    },
    // horses (Mesh2Motion, coats baked: bay / black / dapple grey) in the pasture and the stable yard, and K3 knights riding them on patrol
    horse_m2m_bay(g) { this._g.bay = g; this._knights(); this._pas(); },
    horse_m2m_black(g) { this._g.black = g; this._knights(); this._pas(); },
    horse_m2m_grey(g) { this._g.grey = g; this._knights(); this._pas(); },
    horse_hq_barded(g) { this._g.barded = g; this._knights(); },
    knight_k3(g) { dressKnight(g); this._g.rider = g; this._g.axe = axeKnight(g); this._knights(); },
    cow(g) { this._g.cow = g; this._pas(); },
    _g: {},
    // the pasture herd + the stable yard + the keepers' camp: GPU crowds, one draw per kind (pas_life.js; the estate itself: pas_stable.js)
    _pas() {
      const G2 = this._g; if (!G2.bay || !G2.black || !G2.grey) return;
      if (!this._pl) {
        try { this._pl = buildPastureLife(scene, height, { bay: G2.bay, black: G2.black, grey: G2.grey, models: hooks.models, creatures, shadows: !!Q.shadows }); } catch (e) { console.warn('pasture', e); this._pl = { update() {}, addCows() {} }; }
        const pl = this._pl; updaters.push((t, dt) => pl.update(t, dt, lastP, camRef));
      }
      if (G2.cow) try { this._pl.addCows(G2.cow); } catch (e) { console.warn('cows', e); }
    },
    // Mounted knights: a UAL "K3" knight (great helm, plume, longsword, navy shield, cape; clip "Ride") seated on the saddle bone of each horse.
    _knights() {
      const G2 = this._g; if (!G2.bay || !G2.black || !G2.grey || !G2.barded || !G2.rider || this._kDone) return; this._kDone = true;
      const ring = road('ring'), main = road('main'), farm = road('farm'), west = road('west');
      const routes = [
        // the sword knights ride white (grey) or black horses, the axe riders (heavier, Roman helm, long axe) bay or black ones
        ring && { pts: ring.pts, loop: true, speed: 2.6, gait: 'Walk', dir: 1, off: 0.0, coat: 'grey' },
        ring && { pts: ring.pts, loop: true, speed: 2.6, gait: 'Walk', dir: -1, off: 0.5, coat: 'black', axe: true },
        main && { pts: main.pts, loop: false, speed: 9, gait: 'Gallop', dir: 1, off: 0.2, coat: 'grey' },
        farm && { pts: farm.pts, loop: false, speed: 2.8, gait: 'Walk', dir: 1, off: 0.6, coat: 'bay', axe: true },
        west && { pts: west.pts, loop: false, speed: 3.0, gait: 'Walk', dir: 1, off: 0.3, coat: 'black' },
        main && { pts: main.pts, loop: false, speed: 3.4, gait: 'Walk', dir: -1, off: 0.55, coat: 'barded', lord: true },    // the lord on the royal barded war-horse
      ].filter(Boolean);
      const SEAT = { spine_3: [-0.0023, 0.0029, -0.2059], Torso2: [0, 0.0002, 0.0083] };
      const byName = (o, n) => o.getObjectByName(n) || o.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(n));
      const mount = (h, k, horseLen, size) => {
        const bone = h.inner.getObjectByName('spine_3') || h.inner.getObjectByName('Torso2'); if (!bone) return false;
        h.root.updateMatrixWorld(true);
        const seat = bone.localToWorld(new THREE.Vector3(...SEAT[bone.name]));
        const hips = byName(k.inner, 'pelvis'), top = byName(k.inner, 'Head'); if (!hips || !top) return false;
        k.root.updateMatrixWorld(true);
        k.root.scale.setScalar(size / Math.max(0.05, hips.getWorldPosition(new THREE.Vector3()).distanceTo(top.getWorldPosition(new THREE.Vector3())))); k.root.updateMatrixWorld(true);
        k.root.position.add(seat.sub(hips.getWorldPosition(new THREE.Vector3()))).add(new THREE.Vector3(0, 0.2 * horseLen / 5.6, 0)); k.root.updateMatrixWorld(true);
        bone.attach(k.root); return true;
      };
      routes.forEach((R) => {
        const hg = G2[R.coat], len = R.coat === 'barded' ? 5.6 : 5.6 * HS;
        const h = makeCreature(hg, { length: len * (R.lord ? 1.1 : 1) }); if (!h) return;
        const k = makeCreature(R.axe ? G2.axe : G2.rider, { height: 1 }); if (!k) return;
        h.root.userData.bwCull = 380; scene.add(h.root);
        h.play(R.gait); h.mixer.update(0.01); h.root.updateMatrixWorld(true);
        if (!mount(h, k, len, 1.24 * (R.lord ? 1.12 : R.axe ? 1.1 : 1))) { k.root.position.y = 2.6; h.root.add(k.root); }
        k.root.userData.farRef = h.root;
        if (R.axe) {                                                    // the long axe in the right fist, resting on the shoulder (gear_axe.js, gear_sword.js AXE_RIDE)
          const hand = byName(k.inner, 'hand_r');
          if (hand) { const a = makeAxe({ blued: false, shadows: false, long: true }); a.rotation.set(...AXE_RIDE.rotDeg.map((d) => d * Math.PI / 180)); a.position.set(...AXE_RIDE.pos); a.scale.setScalar(AXE_RIDE.s); hand.add(a); }
        }
        loop(k, R.axe ? /^AxeShoulder$/ : /^RideShoulder$/, R.gait === 'Gallop' ? 1.4 : 0.8);    // (the blade / the axe rests on his right shoulder: gear_sword.js)
        pick(h.root, R.axe ? 'axerider' : 'knight', 3, 3);
        // follow the route (ping-pong on open roads, loop on the ring street)
        const pts = R.pts.map(([x, z]) => new THREE.Vector3(x, 0, z));
        const curve = new THREE.CatmullRomCurve3(pts, !!R.loop, 'centripetal'), len2 = curve.getLength();
        let s2 = R.off * len2, dir = R.dir, wait = 0; const p = new THREE.Vector3(), p2 = new THREE.Vector3();
        h.act && (h.act.timeScale = R.gait === 'Gallop' ? 1.1 : 1);
        updaters.push((t, dt) => {
          if (wait > 0) { wait -= dt; if (wait <= 0) h.play(R.gait, { speed: R.gait === 'Gallop' ? 1.1 : 1 }); }
          else {
            s2 += dir * dt * R.speed;
            if (!R.loop && (s2 > len2 - 2 || s2 < 2)) { s2 = THREE.MathUtils.clamp(s2, 2, len2 - 2); dir *= -1; wait = 5 + Math.random() * 4; h.play(/^Idle$|Idle_2/); }
          }
          const u = ((s2 % len2) + len2) % len2 / len2, u2 = ((s2 + dir * 1.5) % len2 + len2) % len2 / len2;
          curve.getPointAt(u, p); curve.getPointAt(u2, p2);
          h.root.position.set(p.x, hooks.walkY ? hooks.walkY(p.x, p.z) : height(p.x, p.z), p.z);
          const want = Math.atan2(p2.x - p.x, p2.z - p.z); let da = want - h.root.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da));
          h.root.rotation.y += da * Math.min(1, dt * 5);
          if (!h.root.userData.bwFar) lodStep(h, dt);
        });
        knights.push(h);
      });
    },
    wolf(g) {
      // dogs in town (warm tint) by day, grey wolves at the forest edge at night
      const dogs = herd(scene, g, 3, { cx: L.PLAZA.x - 6, cz: L.PLAZA.z + 14, r: 14, height, size: 2.2, speed: 2.2, seed: 7,
        avoid: (x, z) => L.sdPoly(L.OUTER, x, z) > -4 });
      for (const c of dogs.list) c.inner.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.multiply(new THREE.Color(1.25, 1.0, 0.7)); } });
      updaters.push((t, dt) => dogs.update(dt));
      const wolves = herd(scene, g, 4, { cx: 60, cz: -300, r: 30, height, size: 2.8, speed: 1.8, seed: 13 });
      for (const c of wolves.list) nightOnly.push(c.root);
      updaters.push((t, dt) => wolves.update(dt));
    },
    windmill2(g) {
      hooks.hideWindmill();
      const c = makeCreature(g, { height: 22 }); if (!c) return;
      place(c.root, L.WINDMILL.x, L.WINDMILL.z, 0.85, -0.3); loop(c, /.*/, 0.6);
    },
    watermill(g) {
      const c = makeCreature(g, { height: 13 }); if (!c) return;
      const [x0, z0] = L.RIVER[3], [x1, z1] = L.RIVER[2], ang = Math.atan2(x1 - x0, z1 - z0);
      placeS(c.root, x0 + Math.cos(ang) * 9, z0 - Math.sin(ang) * 9, ang + Math.PI / 2, -0.4); pick(c.root, 'windmill', 6, 5);
    },
    blacksmith(g) {
      const c = makeCreature(g, { height: 11 }); if (!c) return;
      placeS(c.root, C.x - 20, C.z - 16, 0.6); pick(c.root, 'forge', 7, 5);
      hooks.smoke(c.root.position.x, c.root.position.y + 11, c.root.position.z, true);
    },
    watchtower(g) {
      const c = makeCreature(g, { height: 22 }); if (!c) return;
      const R = roadPoints(), [x, z] = R[Math.min(4, R.length - 1)];
      placeS(c.root, x + 14, z - 12, -0.6, -0.2); pick(c.root, 'tower', 5, 10);
    },
    barn(g) { const c = makeCreature(g, { height: 11 }); if (c) { placeS(c.root, FS.x + 6, FS.z - 30, -1.9); pick(c.root, 'windmill', 7, 5); } },
    silo(g) { const c = makeCreature(g, { height: 15 }); if (c) placeS(c.root, FS.x + 18, FS.z - 22, 0.4); },
    coop(g) { const c = makeCreature(g, { height: 4 }); if (c) { placeS(c.root, FS.x - 4, FS.z + 24, 2.2); c.root.updateMatrixWorld(true); this._hens(FS.x - 4, FS.z + 24, new THREE.Box3().setFromObject(c.root).expandByScalar(2.5)); } },
    haybale(g) { scatter(g, 1.6, [...Array(9).keys()].map((i) => [FS.x + 14 + (i % 3) * 3.4, FS.z + 8 + Math.floor(i / 3) * 2.6, i * 0.7])); },
    pumpkin(g) { this._rows(g, 1.2, FS.x - 10, FS.z + 34, 4, 7); },
    corn(g) { this._rows(g, 3.2, FS.x + 6, FS.z + 34, 3, 7); },
    cabbage(g) { this._rows(g, 0.9, FS.x - 10, FS.z + 46, 3, 7); },
    _rows(g, hgt, x0, z0, rows, cols) {
      const pts = [];
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) pts.push([x0 + k * 1.9, z0 + r * 2.4, Math.random() * 6.28, 0.85 + Math.random() * 0.3]);
      scatter(g, hgt, pts);
    },
    tent_general(g) { const c = makeCreature(g, { height: 7 }); if (c) { placeS(c.root, C.x, C.z, 0.4); pick(c.root, 'camp', 6, 3); } },
    trebuchet(g) {
      const c = makeCreature(g, { height: 8 }); if (!c) return;
      place(c.root, C.x + 2, C.z + 22, Math.PI + 0.3); pick(c.root, 'tower', 6, 6);
      const seq = ['Shoot', 'Reload_1', 'Reload_2', 'Reload_3', 'Reload_4']; let i = 0, tm = 0;
      c.play('Reload_4');
      updaters.push((t, dt) => { tm -= dt; if (tm <= 0) { const n = seq[i++ % seq.length]; c.play(n, { once: true, fade: 0.1 }); const cl = c.find(n); tm = (cl ? cl.duration : 2) + (n === 'Reload_4' ? 6 : 0.2); } c.mixer.update(dt); });
    },
    catapult(g) { const c = makeCreature(g, { height: 6 }); if (c) { placeS(c.root, C.x - 14, C.z + 14, 2.6); pick(c.root, 'tower', 4, 3); } },
    ballista(g) { for (const [dx, dz, r] of [[18, -10, 0.8], [-16, -4, -0.9]]) { const c = makeCreature(g, { length: 6 }); if (c) placeS(c.root, C.x + dx, C.z + dz, r); } },
    ram(g) { const c = makeCreature(g, { length: 9 }); if (c) placeS(c.root, C.x + 12, C.z - 16, 1.4); },
    siege_tower(g) { const c = makeCreature(g, { height: 17 }); if (c) { placeS(c.root, C.x - 6, C.z - 20, 0.2); pick(c.root, 'tower', 5, 8); } },
  };

  // Every late model builds into its own hidden bucket; the stager (world.js) compiles shaders first, then reveals buckets one per frame.
  const cullList = [];
  function add(name, gltf) {
    const h = H[name]; if (!h) return null;
    const bucket = new THREE.Group(); bucket.name = 'late:' + name; bucket.visible = false; sceneRoot.add(bucket); scene = bucket;
    try { h.call(H, gltf); } catch (e) { console.warn('life', name, e); } finally { scene = sceneRoot; }
    for (const o of bucket.children) if (o.userData.bwCull) cullList.push(o);
    return bucket;
  }
  // far-away ground creatures are hidden (and not animated) — they would be a few pixels anyway.
  // p28: creatures are drawn with frustumCulled = false (skinned bounds are unreliable), so every one of them was drawn (and shadow-drawn, and animated) even behind the camera:
  // ~70 draw calls per frame. Now each one is tested against the camera frustum (generous margin) a few times a second and hidden while it is off screen.
  let cullAcc = 0;
  const fr = new THREE.Frustum(), pvm = new THREE.Matrix4(), sph = new THREE.Sphere();
  function update(t, dt, P, camera) {
    camRef = camera || camRef; lastP = P || lastP;
    const night = P ? P.night > 0.55 : false;
    const dv = !night && hooks.birds();
    for (const o of dayOnly) o.visible = dv && !o.userData.bwOff;
    for (const o of nightOnly) o.visible = night && !o.userData.bwOff;
    cullAcc += dt;
    if (camera && cullAcc > 0.12) {
      cullAcc = 0;
      camera.updateMatrixWorld(); pvm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); fr.setFromProjectionMatrix(pvm);
      for (const o of cullList) {
        const dd = o.position.distanceTo(camera.position), far = dd > (o.userData.bwCull || 320);
        o.userData.bwFar = far; o.userData.bwLod = dd < 90 ? 0 : dd < 200 ? 1 : 2;
        sph.center.copy(o.position); sph.radius = o.userData.bwR || 30; o.userData.bwOff = !fr.intersectsSphere(sph);
        if (!dayOnly.includes(o) && !nightOnly.includes(o)) o.visible = !far && !o.userData.bwOff;   // (bwLod: animate at full / half / quarter rate with the distance)
      }
    }
    F.n++;
    for (const f of updaters) f(t, dt);
  }
  return { add, update };
}
