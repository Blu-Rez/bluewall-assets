// Real dragon model (rigged glTF) flying the patrol curve: banks into turns,
// flaps (ping-pong sub-clip of the model's flight animation), glides, and
// breathes blue fire. Recoloured to the Blue Wall's blue.
import * as THREE from 'three';
import { makeCreature } from './creature.js';
import { rimify } from './dragon.js';
import { grayMap } from './util.js';

// cfg: { yaw, length, flap: { clip, from, to }, tint }
export function buildModelDragon(scene, gltf, fxBreath, curve, cfg = {}) {
  const c = makeCreature(gltf, { length: cfg.length || 30, yaw: cfg.yaw || 0 });
  if (!c) return null;
  const root = c.root; root.name = 'dragon'; scene.add(root);
  // the source file carries the rig's control-shape widgets as plain meshes: drop them
  const junk = []; c.inner.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh) junk.push(o); }); for (const o of junk) o.parent.remove(o);
  c.inner.traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone();
    if (cfg.tint) o.material.color.set(cfg.tint);
    rimify(o.material, cfg.rim || [0.25, 0.55, 1.0], 2.4, 0.7);
    if (cfg.tint && o.material.map) grayMap(o.material);
    o.frustumCulled = false;
  });
  // flap loop: a slice of the flight clip, played back and forth, root motion removed
  let flap = null;
  if (cfg.flap) {
    const src = c.clips.find((a) => a.name === cfg.flap.clip);
    if (src) {
      const fps = 30, sub = THREE.AnimationUtils.subclip(src, 'flap', Math.round(cfg.flap.from * fps), Math.round(cfg.flap.to * fps), fps);
      sub.tracks = sub.tracks.filter((t) => !/(Root|root).*\.(position)$/.test(t.name));
      flap = c.mixer.clipAction(sub); flap.setLoop(THREE.LoopPingPong, Infinity); flap.play();
    }
  }
  if (!flap) c.play(/fly|flap|.*/i);
  const head = (() => { let h = null; c.inner.traverse((o) => { if (!h && o.isBone && /head/i.test(o.name)) h = o; }); return h; })();
  const LEN = curve.getLength();
  const hist = { s: LEN * 0.6 };
  const p = new THREE.Vector3(), p2 = new THREE.Vector3(), fwd = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), m = new THREE.Matrix4(), q = new THREE.Quaternion(), qb = new THREE.Quaternion();
  const mouth = new THREE.Vector3(), ahead = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1);
  let breath = 0, nextBreath = 9, bank = 0;
  const glow = cfg.light === false ? { intensity: 0, position: new THREE.Vector3() } : new THREE.PointLight(0x4aa8ff, 0, 60, 1.6); if (glow.isLight) scene.add(glow);
  const at = (s, out) => curve.getPointAt((((s % LEN) + LEN) % LEN) / LEN, out);

  function update(t, dt) {
    hist.s += (cfg.speed || 14) * dt;
    at(hist.s, p); at(hist.s + 4, p2); at(hist.s + 18, ahead);
    fwd.subVectors(p2, p).normalize();
    ahead.sub(p).normalize();
    const turn = fwd.x * ahead.z - fwd.z * ahead.x;
    bank += (THREE.MathUtils.clamp(-turn * 2.4, -0.65, 0.65) - bank) * Math.min(1, dt * 1.5);
    root.position.copy(p);
    m.lookAt(p2, p, up); q.setFromRotationMatrix(m);
    qb.setFromAxisAngle(Z, bank);
    root.quaternion.copy(q).multiply(qb);
    // flap faster while climbing, slow glide while descending
    if (flap) flap.timeScale = THREE.MathUtils.lerp(flap.timeScale, fwd.y > -0.02 ? 1.15 : 0.45, Math.min(1, dt * 2));
    nextBreath -= dt;
    if (nextBreath <= 0 && breath <= 0) { breath = 1.8; nextBreath = (cfg.breathEvery || 13) + Math.random() * 8; }
    if (breath > 0) {
      breath -= dt;
      if (head) head.getWorldPosition(mouth); else mouth.copy(p).addScaledVector(fwd, (cfg.length || 30) * 0.45);
      mouth.addScaledVector(fwd, 2);
      for (let k = 0; k < 12; k++) {
        const sp = 26 + Math.random() * 10;
        fxBreath.emit(mouth.x, mouth.y, mouth.z, fwd.x * sp + (Math.random() - 0.5) * 6, fwd.y * sp - 4 + (Math.random() - 0.5) * 6, fwd.z * sp + (Math.random() - 0.5) * 6, 0.9 + Math.random() * 0.4, 1.6 + Math.random() * 1.8, 3.5, 0.9);
      }
      glow.intensity = 900 * Math.min(1, breath); glow.position.copy(mouth).addScaledVector(fwd, 8);
    } else glow.intensity = 0;
    c.mixer.update(dt);
  }
  return { root, update, curve, get position() { return root.position; }, get breathing() { return breath > 0; }, get s() { return hist.s; }, set s(v2) { hist.s = v2; } };
}
