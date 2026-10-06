// The green Dragonlings at home (p22 — the owner: "I didn't see the small dragon").
// Once the Lair can train Dragonlings (Lair Lv 12), two of them live at the Lair: one hovers over the nest, the other circles the hill and
// now and then swoops low past the cave.
// Lazy: dragonling.glb (180 KB) is fetched only the first time they are shown. Two skinned clones (two draw calls), one mixer each,
// updated at 30 Hz near the camera and frozen when far away or in battle.
//   const dl = createHomeDragonlings({ scene, height });  dl.set(owned)  dl.update(t, dt, camera)  dl.setBattle(on)
import * as THREE from 'three';
import * as L from './layout.js';
import { loadGLB, cloneSkinned } from './assets.js';
import { levelOf, ENT } from './skin.js';
import { paintDragonling } from './dlcolor.js';

const LEN = 6.2;                                     // nose-to-tail metres (the big dragon is ~30 m, the baby ~12 m)

export function createHomeDragonlings({ scene, height }) {
  const LA = L.LAIR;
  if (!LA || !(LA.r > 0)) return { set() {}, update() {}, setBattle() {} };
  const ry = Math.atan2(-LA.x, -LA.z), fx = Math.sin(ry), fz = Math.cos(ry);          // the lair's front (its cave opens toward the town)
  const y0 = height(LA.x, LA.z);
  const NEST = new THREE.Vector3(LA.x + fx * 3, y0 + 1.75, LA.z + fz * 3);
  let owned = false, battle = false, gltf = null, loading = false, failed = false, acc = 0;
  const root = new THREE.Group(); root.name = 'dragonlings'; root.visible = false; scene.add(root);


  // ---- the two dragonlings
  const D = [];                                    // { o, mixer, mode: 'hover' | 'circle', ph }
  async function build() {
    if (gltf || loading || failed) return; loading = true;
    try {
      gltf = await loadGLB('dragonling');
      if (!gltf) throw new Error('dragonling.glb did not load');
      for (const c of gltf.animations) c.name = c.name.replace(/^.*\|/, '');
      paintDragonling(gltf.scene, levelOf(ENT.lair));
      const box = new THREE.Box3().setFromObject(gltf.scene), sz = box.getSize(new THREE.Vector3()), k = LEN / Math.max(0.01, sz.x, sz.z);
      const clip = (n) => gltf.animations.find((a) => a.name === n) || gltf.animations[0];
      for (let i = 0; i < 2; i++) {
        const o = cloneSkinned(gltf); o.scale.setScalar(k); o.rotation.order = 'YXZ';
        o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.frustumCulled = false; } });
        const mixer = new THREE.AnimationMixer(o);
        const a = mixer.clipAction(clip(i ? 'Fast_Flying' : 'Flying_Idle')); a.play(); a.time = Math.random() * a.getClip().duration;
        root.add(o); D.push({ o, mixer, mode: i ? 'circle' : 'hover', ph: i * 2.1 });
      }
    } catch (e) { console.warn('dragonlings', e); failed = true; gltf = null; }
    loading = false; apply();
  }
  const lairOn = () => levelOf(ENT.lair) >= 1;
  function apply() {
    if (gltf) paintDragonling(gltf.scene, levelOf(ENT.lair));                       // (the colour follows the Lair level)
    const on = !battle && lairOn();
    root.visible = on && owned && D.length > 0;
    if (on && owned && !gltf && !failed) build();
  }
  const v = new THREE.Vector3(), prev = new THREE.Vector3();
  function update(t, dt, camera) {
    if (!root.visible) return;
    const far = camera && camera.position.distanceTo(NEST) > 420;
    if (far) return;
    acc += dt; if (acc < 1 / 30) return; const st = acc; acc = 0;                    // 30 Hz is plenty for two small creatures
    for (const d of D) {
      d.mixer.update(st);
      prev.copy(d.o.position);
      if (d.mode === 'hover') {                                                     // over the nest: a slow drift and bob, turning to look around
        const a = t * 0.23 + d.ph;
        d.o.position.set(NEST.x + Math.cos(a) * 2.2, NEST.y + 5.2 + Math.sin(t * 1.3) * 0.6, NEST.z + Math.sin(a) * 2.2);
        d.o.rotation.set(0, ry + Math.sin(t * 0.31 + d.ph) * 0.9, 0);
      } else {                                                                      // circling the hill; every ~24 s a low pass in front of the cave
        const a = t * 0.34 + d.ph, dip = Math.max(0, Math.sin(t * 0.26)) ** 6, r = 30 - dip * 12;
        d.o.position.set(LA.x + Math.cos(a) * r, y0 + 22 - dip * 13 + Math.sin(t * 0.9) * 1.2, LA.z + Math.sin(a) * r);
        v.subVectors(d.o.position, prev);
        if (v.lengthSq() > 1e-6) { d.o.rotation.y = Math.atan2(v.x, v.z); d.o.rotation.z = -0.38; d.o.rotation.x = -v.y * 2; }
      }
    }
  }
  return {
    set(o) { owned = !!o; apply(); },
    setBattle(on) { battle = !!on; apply(); },
    refresh: apply,                                                                  // (the lair's level changed)
    update,
  };
}
