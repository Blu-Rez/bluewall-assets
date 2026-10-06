// The little mage on the wizard tower (owner 5 Oct 01:29, "this little mage — make him help"): castle.js lifts the roof of every third roofed tower onto four pillars and
// asks for a 'wizard' site under it.  Here the mage (the very model + staff of the attacking mage, a baked crowd instance) stands on that platform, sways in his idle clips,
// and in a raid turns to the target and casts (fire(tid, x, y, z)), the sim's orb flies from the tower.  Hidden when the tower falls (hide), back after a battle (reset).
//   const wz = createWizards({ scene, sites })  wz.update(t, dt, camera)  wz.fire(tid, x, y, z)  wz.hide(tid)  wz.reset()  wz.replace(tids)  wz.setManual(on)  wz.has(tid)
import { loadGLB } from './assets.js';
import { createKind } from './crowd.js';

const SCALE = 2.5;                       // a battle mage is 1.75; on a tower top he has to read from the strategy camera
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export function createWizards({ scene, sites }) {
  const none = { update() {}, count: 0, fire() {}, hide() {}, reset() {}, replace() {}, setManual() {}, has: () => false };
  if (!sites || !sites.length) return none;
  const S = sites.map((s) => ({ s, p: null, yaw: Math.PI / 2 - s.a, want: Math.PI / 2 - s.a, castUntil: 0, dead: false, repl: false, shown: false, look: Math.random() * 6 }));
  let kind = null, manual = false;
  (async () => {
    const [mg, st, kk] = await Promise.all([loadGLB('skel_mage'), loadGLB('skel_staff'), loadGLB('kk_anims')]);
    if (!mg || !kk) return;
    kind = createKind({ gltf: mg, anims: { animations: kk.animations }, clips: ['Idle_A', 'Idle_B', 'Ranged_Magic_Shoot'],
      props: st ? [{ gltf: st, bone: 'handslotr', s: 1, pos: [0, 0, 0], rot: [0, 0, 0] }] : [], capacity: S.length + 2, hue: 'swap' });
    scene.add(kind.group);
    for (const b of S) show(b);
  })().catch((e) => console.warn('wizards', e));
  function show(b) { if (!kind || b.shown || b.dead || b.repl) return; b.p = kind.add({ x: b.s.x, y: b.s.y, z: b.s.z, yaw: b.yaw, scale: SCALE * (0.98 + Math.random() * 0.04) }); b.p.play(Math.random() < 0.5 ? 'Idle_A' : 'Idle_B', { fade: false, offset: Math.random() * 2 }); b.shown = true; }
  function hideB(b) { if (b.p && kind) { kind.remove(b.p); b.p = null; } b.shown = false; }
  let tt = 0;
  function update(t, dt, camera) {
    if (!kind) return;
    tt += dt;
    for (const b of S) {
      if (!b.p) { if (!b.dead && !b.repl) show(b); continue; }
      if (b.dead || b.repl) { hideB(b); continue; }
      if (!manual) b.want = Math.PI / 2 - b.s.a + Math.sin(tt * 0.25 + b.look) * 0.5;            // (at home he looks around the field)
      b.yaw += Math.max(-dt * 4, Math.min(dt * 4, wrap(b.want - b.yaw)));
      b.p.yaw = b.yaw;
      if (b.castUntil && t > b.castUntil) { b.castUntil = 0; b.p.play(Math.random() < 0.5 ? 'Idle_A' : 'Idle_B', { fade: true }); }
    }
    kind.update(t, camera, { lodDist: 110, lod2Dist: 300 });
  }
  const has = (tid) => S.some((b) => b.s.tid === tid);
  return {
    update, count: S.length, has, S,
    setManual(on) { manual = on; },
    fire(tid, tx, ty, tz) {
      for (const b of S) if (b.s.tid === tid && b.p && !b.dead) {
        b.want = Math.atan2(tx - b.s.x, tz - b.s.z);
        b.p.play('Ranged_Magic_Shoot', { fade: true, speed: 1.15 }); b.castUntil = (kind && kind.group.userData.now || 0) + 1.0;
      }
    },
    hide(tid) { for (const b of S) if (b.s.tid === tid) { b.dead = true; hideB(b); } },
    replace(tids) { const set = new Set(tids || []); for (const b of S) { b.repl = set.has(b.s.tid); if (b.repl) hideB(b); } },
    reset() { for (const b of S) { b.dead = false; if (kind) show(b); } },
  };
}
