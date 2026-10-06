// The kingdom's army (streamed in with the late content, built into one hidden bucket and revealed after the shaders are warm).
//   · shield-wall spearmen, claymore swordsmen and sword & shield guards drilling in blocks on the muster field outside the town gate
//   · a shieldmaiden hero and standard bearers (waving pennants)
//   · a marching column that walks the main road and turns around at both ends
//   · guard posts at both town gates, sparring pairs and a drill block at the siege camp
// Every soldier is drawn by crowd.js: GPU-instanced with baked animation, so the whole army costs ~15 draw calls and no CPU skinning.
// Cavalry (K3 knights on the new horses) lives in life.js next to the pasture horses.
//
// buildArmy(api) -> { update(t, dt, camera, P) }     api: { scene, height, A, M, ... } (world.js lateApi)
import * as THREE from 'three';
import * as L from './layout.js';
import { createKind } from './crowd.js';
import { CLOTH, kit, tierOf as tierOfL, tintGear } from './unitlook.js';
import { shieldModel } from './gear_shield.js';
import { axeProp, AXE_GRIP } from './gear_axe.js';
import { dressMaiden } from './gear_maiden.js';
import { dressPegasus } from './gear_pegasus.js';
import { setPlumeTier } from './gear_plume.js';
import { Flags } from './fx.js';
import { road } from './roads.js';

export const ARMY_MODELS = ['pegasus', 'anims_army', 'helmet2', 'helmet3', 'shield_heater', 'spear', 'claymore', 'shieldmaiden', 'shield_round2'];

const SC = 1.75, HERO = 1.95, PI2 = Math.PI * 2, TURN = 3.4;
const rad = (d) => (d * Math.PI) / 180;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
let seed = 4242; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

export function makeKinds(M, tier = 1) {
  if (!M.ranger_m || !M.anims) return null;
  const anims = { animations: [...M.anims.animations, ...(M.anims_army ? M.anims_army.animations : [])] };
  const pr = (g, bone, s, pos, rot) => (g ? { gltf: g, bone, s, pos, rot: rot.map(rad) } : null);
  const lod1Skip = /Boots|Belt|Bracer|Pauldron/;
  const mk = (gltf, clips, props, capacity) => createKind({ gltf, anims, clips, props: props.filter(Boolean), capacity, lod1Skip, hue: true, cloth: { c: [0, 0, 0], k: 0 }, tier });      // (cloth: the tier colour, set later by setTiers)
  const K = {};
  // the kit follows the barracks tier (unitlook.js) — the same pieces the soldiers wear in battle. Shields: painted wood with the realm's
  // crest and a steel rim in the tier's metal (gear_shield.js), all in the kind's one gear draw call
  const helm = (h) => (h ? pr(M[h], 'Head', 0.17, [0, 0.03, 0], [0, 0, 0]) : null), ks = kit('spear', tier);
  const heater = shieldModel(M.shield_heater, 'heater', 0.27), round = shieldModel(M.shield_round2, 'round', 0.25), buckler = shieldModel(M.shield_round2, 'round', 0.22);
  K.spear = mk(M.ranger_m, ['Walk_Loop', 'Idle_Shield_Loop', 'Shield_OneShot'], [
    helm(ks.helm),
    pr(M.spear, 'hand_r', 0.23, [0.00819, -0.15451, 0.16751], [-34.632, -34.359, -171.054]),
    ks.shield ? pr(heater, 'hand_l', 0.27, [0, 0.05, 0.05], [0, 90, 0]) : null], 72);
  K.sword = mk(M.ranger_m, ['Walk_Loop', 'Sword_Idle', 'Sword_Regular_A', 'Sword_Regular_B'], [
    helm(kit('sword', tier).helm),
    pr(M.claymore, 'hand_r', 0.2, [0, 0, 0], [0, 0, -90])], 56);
  K.guard = mk(M.ranger_m, ['Walk_Loop', 'Sword_Idle', 'Sword_Block'], [
    helm(kit('guard', tier).helm),
    pr(M.sword, 'hand_r', 0.9, [0, 0, 0], [0, 0, -90]),
    pr(round, 'hand_l', 0.25, [0, 0.05, 0.05], [0, 90, 0])], 56);
  if (M.shieldmaiden) dressMaiden(M.shieldmaiden);
  if (M.shieldmaiden) K.hero = mk(M.shieldmaiden, ['Walk_Loop', 'Sword_Idle', 'Sword_Block'], [
    pr(axeProp({ blued: true }), 'hand_r', 0.64, AXE_GRIP.pos, AXE_GRIP.rotDeg),                 // the hero's blued war axe (gear_axe.js)
    pr(buckler, 'hand_l', 0.22, [0, 0.05, 0.05], [0, 90, 0])], 4);
  return K;
}

export function buildArmy(api) {
  const { scene, height, A, M } = api, walkY = api.walkY || height;
  const models = (A && A.models) || {};
  const kinds = makeKinds(models, api.armyLv ? tierOfL(api.armyLv.barracks || 1) : 1);
  if (!kinds) return { update() {} };
  for (const k of Object.values(kinds)) scene.add(k.group);
  // winged horses (the Opus pegasus): baked-animation crowd like the soldiers; 'Rest' = standing with the wings folded
  const pgm = models.pegasus; let peg = null;
  if (pgm) {
    try { dressPegasus(pgm); peg = createKind({ gltf: pgm, anims: pgm, clips: ['Rest', 'Fly', 'Glide'], capacity: 12 }); scene.add(peg.group); } catch (e) { console.warn('pegasus', e); }
  }
  const base = kinds.spear.stats.walkSpeed || 0.8;                  // rig units / s the walk clip was made for
  const clipDur = (k, n) => (k.info[n] ? k.info[n].dur : 1);

  const soldiers = [];                                              // everything with a script
  const drills = [];                                                // synchronized block commands
  const poles = [];                                                 // [x, z, yaw] standard bearers
  const flags = new Flags();

  // ------------------------------------------------------------------ formations
  // A block of soldiers in ranks: `u` runs along the facing direction, `v` sideways. Row 0 is the front.
  function block(kind, { cx, cz, yaw, cols, rows, dx = 2.9, dz = 3.2, idle, cmd, cmdEvery = [14, 24], bearer = false, scale = SC, name = '' }) {
    const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const list = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const v = (i - (cols - 1) / 2) * dx + (rnd() - 0.5) * 0.3, u = -j * dz + (rnd() - 0.5) * 0.3;
      const x = cx + fx * u + rx * v, z = cz + fz * u + rz * v;
      const p = kind.add({ x, z, y: height(x, z), yaw: yaw + (rnd() - 0.5) * 0.08, scale: scale * (0.97 + rnd() * 0.06) });
      p.play(idle, { fade: false, speed: 0.92 + rnd() * 0.16, offset: rnd() * 2 });
      list.push(p);
    }
    if (bearer) poles.push([cx + fx * 2.4, cz + fz * 2.4, yaw]);
    if (cmd) drills.push({ kind, list, idle, cmd, every: cmdEvery, t: cmdEvery[0] * (0.4 + rnd() * 0.6), busy: 0, name });
    return list;
  }

  // ------------------------------------------------------------------ muster field (parade ground outside the east town gate)
  const MU = L.MUSTER, T0 = L.TGATES[0];
  if (MU && MU.r > 0 && T0) {
    const face = Math.atan2(T0.x - MU.x, T0.z - MU.z);              // the blocks stand facing the town
    const fx = Math.sin(face), fz = Math.cos(face), rx = Math.cos(face), rz = -Math.sin(face);
    const at = (u, v) => [MU.x + fx * u + rx * v, MU.z + fz * u + rz * v];
    let c = at(2, -19); block(kinds.spear, { cx: c[0], cz: c[1], yaw: face, cols: 6, rows: 4, idle: 'Idle_Shield_Loop', cmd: 'Shield_OneShot', bearer: true, name: 'spear' });
    c = at(2, 0); block(kinds.guard, { cx: c[0], cz: c[1], yaw: face, cols: 6, rows: 3, idle: 'Sword_Idle', cmd: 'Sword_Block', bearer: true, name: 'guard' });
    c = at(2, 19); block(kinds.sword, { cx: c[0], cz: c[1], yaw: face, cols: 6, rows: 3, idle: 'Sword_Idle', cmd: 'Sword_Regular_A', bearer: true, name: 'sword' });
    if (kinds.hero) {                                                // the shieldmaiden leads the guard block
      c = at(11, 0);
      const p = kinds.hero.add({ x: c[0], z: c[1], y: height(c[0], c[1]), yaw: face, scale: HERO });
      p.play('Sword_Idle', { fade: false, offset: 0.4 });
      drills.push({ kind: kinds.hero, list: [p], idle: 'Sword_Idle', cmd: 'Sword_Block', every: [16, 26], t: 9, busy: 0 });
    }
  }

  // ------------------------------------------------------------------ marching column on the main road
  const marchers = [];
  function column(pts, s0, s1, n, offsets = [-1.2, 1.2]) {
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'), len = curve.getLength();
    const lo = Math.min(len - 4, s0), hi = Math.min(len - 2, s1), gap = 3.4, order = ['spear', 'spear', 'guard', 'sword', 'guard', 'sword', 'spear'];
    const col = { curve, len, lo, hi, mode: 'walk', timer: 0, dir: 1, list: [] };
    const nrow = Math.ceil(n / offsets.length);
    for (let k = 0; k < n; k++) {
      const row = Math.floor(k / offsets.length), kind = kinds[order[row % order.length]], f = 0.95 + rnd() * 0.1;
      const m = { kind, p: kind.add({ y: 0, scale: SC }), s: lo + 3 + (nrow - row) * gap, off: offsets[k % offsets.length], v: base * SC * f, f, col, yawT: 0, idle: kind === kinds.spear ? 'Idle_Shield_Loop' : 'Sword_Idle' };
      m.p.play('Walk_Loop', { fade: false, speed: f, offset: rnd() * 1.3 });
      col.list.push(m); marchers.push(m);
    }
    return col;
  }
  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  function pose(m, dirSign) {                                          // position on the road + heading
    const { curve, len } = m.col, u = Math.min(1, Math.max(0, m.s / len));
    curve.getPointAt(u, _a); curve.getPointAt(Math.min(1, Math.max(0, (m.s + dirSign * 1.2) / len)), _b);
    let tx = _b.x - _a.x, tz = _b.z - _a.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    m.p.x = _a.x + tz * m.off; m.p.z = _a.z - tx * m.off; m.p.y = walkY(m.p.x, m.p.z);
    return Math.atan2(tx, tz);
  }
  const main = road('main');
  const cols = [];
  if (main && kinds.spear) cols.push(column(main.pts, 8, 150, 12));
  for (const c of cols) for (const m of c.list) { m.p.yaw = m.yawT = pose(m, 1); }

  // ------------------------------------------------------------------ guard posts at the town gates + the camp
  const posts = [];
  const gatePost = (G) => {
    if (!G) return;
    // the moat fills 8..20 m in front of the gate (the bridge crosses it): the posts stand on the far bank beside the road
    const nyaw = Math.atan2(G.nx, G.nz), tx = G.nz, tz = -G.nx;      // tangent along the wall
    [[-1, 'spear', 25], [1, 'spear', 25], [-1.9, 'guard', 25], [1.9, 'guard', 25]].forEach(([s, kn, d]) => {
      const x = G.x + G.nx * d + tx * s * 6.4, z = G.z + G.nz * d + tz * s * 6.4, kind = kinds[kn];
      const p = kind.add({ x, z, y: height(x, z), yaw: nyaw + (rnd() - 0.5) * 0.1, scale: SC });
      p.play(kn === 'spear' ? 'Idle_Shield_Loop' : 'Sword_Idle', { fade: false, offset: rnd() * 2 });
    });
  };
  for (const G of L.TGATES) gatePost(G);

  const C = L.CAMP, pairs = [];
  if (C && C.r > 0) {
    // sparring pairs: two claymore fighters trade blows, rest, trade again
    [[22, 8, 0.5], [30, -4, 2.2], [14, -14, -0.7]].forEach(([dx, dz, ry]) => {
      const x = C.x + dx, z = C.z + dz, fx = Math.sin(ry), fz = Math.cos(ry);
      const a = kinds.sword.add({ x: x - fx * 1.7, z: z - fz * 1.7, y: height(x, z), yaw: ry, scale: SC }), b = kinds.sword.add({ x: x + fx * 1.7, z: z + fz * 1.7, y: height(x, z), yaw: ry + Math.PI, scale: SC });
      a.play('Sword_Idle', { fade: false }); b.play('Sword_Idle', { fade: false });
      pairs.push({ a, b, t: 2 + rnd() * 4, busy: 0, turn: 0 });
    });
    // a spear block drilling in front of the tents
    block(kinds.spear, { cx: C.x - 12, cz: C.z + 34, yaw: 0.2, cols: 5, rows: 3, idle: 'Idle_Shield_Loop', cmd: 'Shield_OneShot', bearer: true, name: 'camp' });
  }

  // ------------------------------------------------------------------ winged horses: a flock circling the town (p34: none in the pasture)
  const flyers = [], PEG = 1.8;
  if (peg) {
    const KP = L.KEEP || { x: 0, z: 0 };
    [[0, 118, 46, 15, 0.0], [1, 150, 62, 18, 2.1], [2, 92, 38, 13, 4.0]].forEach(([i, r, alt, sp, ph]) => {
      const p = peg.add({ x: KP.x + r, z: KP.z, y: alt, yaw: 0, scale: PEG }); p.play('Fly', { fade: false, offset: rnd() });
      flyers.push({ p, r, alt, w: (i % 2 ? -1 : 1) * sp / r, a: ph, ph, mode: 'Fly', cx: KP.x, cz: KP.z });
    });
    if (typeof location !== 'undefined' && /[?&]q=/.test(location.search)) { window.__bwFly = flyers; window.__bwArmy = { kinds, peg }; }     // dev pages only
    // p34 P1 (owner): no winged horses resting in the stable pasture any more — only normal horses and cows there
  }

  // ------------------------------------------------------------------ standard bearers: pole + waving pennant
  if (poles.length && M && M.flag) {
    const h = 6.2;
    for (const [x, z, yaw] of poles) flags.add(x, height(x, z) + h, z, yaw + Math.PI, 0.85);
    flags.build(scene, M.flag);
    const pg = new THREE.CylinderGeometry(0.07, 0.1, h, 6); pg.translate(0, h / 2, 0);
    const pm = new THREE.InstancedMesh(pg, new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 0.85 }), poles.length);
    poles.forEach(([x, z], i) => pm.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, height(x, z), z)));
    pm.castShadow = true; pm.frustumCulled = false; scene.add(pm);
  }

  // ------------------------------------------------------------------ per-frame logic
  function update(t, dt, camera) {
    // marching columns: walk, halt at the end, about-face, walk back
    for (const col of cols) {
      let front = -1e9;
      for (const m of col.list) front = Math.max(front, m.s * col.dir);
      const end = col.dir > 0 ? col.hi : -col.lo;
      if (col.mode === 'walk' && front >= end) { col.mode = 'halt'; col.timer = 3.5; for (const m of col.list) m.p.play(m.idle, { speed: 1 }); }
      else if (col.mode === 'halt') { col.timer -= dt; if (col.timer <= 0) { col.dir = -col.dir; col.mode = 'turn'; for (const m of col.list) m.yawT = pose(m, col.dir); } }
      else if (col.mode === 'turn') {
        let ok = true; for (const m of col.list) if (Math.abs(wrap(m.yawT - m.p.yaw)) > 0.12) ok = false;
        if (ok) { col.mode = 'walk'; for (const m of col.list) m.p.play('Walk_Loop', { speed: m.f }); }
      }
      for (const m of col.list) {
        if (col.mode === 'walk') { m.s += col.dir * m.v * dt; m.yawT = pose(m, col.dir); }
        const d = wrap(m.yawT - m.p.yaw), mx = (col.mode === 'walk' ? TURN * 2 : TURN) * dt;
        m.p.yaw += Math.max(-mx, Math.min(mx, d));
        if (m.p.yaw > Math.PI) m.p.yaw -= PI2; else if (m.p.yaw < -Math.PI) m.p.yaw += PI2;
      }
    }
    // block commands: every few seconds a whole block performs its drill move together, then falls back to the stance
    for (const d of drills) {
      if (d.busy > 0) { d.busy -= dt; if (d.busy <= 0) for (const p of d.list) p.play(d.idle, { speed: 0.92 + rnd() * 0.16 }); continue; }
      d.t -= dt;
      if (d.t <= 0) { d.t = d.every[0] + rnd() * (d.every[1] - d.every[0]); d.busy = clipDur(d.kind, d.cmd) + 0.2; for (const p of d.list) p.play(d.cmd, { speed: 0.95 + rnd() * 0.1 }); }
    }
    // sparring
    for (const s of pairs) {
      s.t -= dt;
      if (s.busy > 0) { s.busy -= dt; if (s.busy <= 0) { s.a.play('Sword_Idle'); s.b.play('Sword_Idle'); s.t = 3 + rnd() * 5; } }
      else if (s.t <= 0) {
        const na = rnd() < 0.5 ? 'Sword_Regular_A' : 'Sword_Regular_B';
        s.a.play(na); s.b.play(na === 'Sword_Regular_A' ? 'Sword_Regular_B' : 'Sword_Regular_A', { offset: 0.35 });
        s.busy = Math.max(clipDur(kinds.sword, 'Sword_Regular_A'), clipDur(kinds.sword, 'Sword_Regular_B')) + 0.3;
      }
    }
    flags.update(t);
    for (const f of flyers) {                                          // flock: banked circles, flap while climbing, glide while sinking
      f.a += f.w * dt; const x = f.cx + Math.cos(f.a) * f.r, z = f.cz + Math.sin(f.a) * f.r, ph = t * 0.25 + f.ph;
      f.p.x = x; f.p.z = z; f.p.y = height(x, z) + f.alt + Math.sin(ph) * 7;
      f.p.yaw = f.w > 0 ? -f.a : -f.a + Math.PI; f.p.roll = f.w > 0 ? 0.32 : -0.32;
      const climbing = Math.cos(ph) > -0.1, want = climbing ? 'Fly' : 'Glide';
      if (want !== f.mode) { f.mode = want; f.p.play(want, { speed: 1 }); }
    }
    for (const k of Object.values(kinds)) k.update(t, camera);
    if (peg) peg.update(t, camera);
  }
  // the camp follows the level tier of the barracks (unitlook.js): cloth colour + gear tint, no rebuild
  function setTiers(lv = {}) {
    const t = tierOfL(lv.barracks || 1);
    for (const n of ['spear', 'sword', 'guard', 'hero']) if (kinds[n]) { kinds[n].setCloth(CLOTH[t].c, CLOTH[t].k); tintGear(kinds[n], t); }
    if (lv.stable) setPlumeTier(tierOfL(lv.stable));                    // (the knights' horsehair: gear_plume.js, shared with life.js + battles)
  }
  return { update, kinds, cols, setTiers };
}
