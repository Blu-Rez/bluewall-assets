// The blue dragon — patrols around the Blue Wall forever. Body is a tube
// that follows its own flight path (serpentine motion for free), wings flap
// and glide, every so often it breathes blue fire.
import * as THREE from 'three';

const RING = 10, SPINE = 26, SEG = 1.25;

function rimify(mat, color, power = 2.2, strength = 0.9) {
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { float fr = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), ${power.toFixed(2)});
        totalEmissiveRadiance += vec3(${color.map((c) => c.toFixed(3)).join(',')}) * fr * ${strength.toFixed(2)}; }`);
  };
  return mat;
}
export { rimify };

export function buildDragon(scene, M, fxBreath, quality, day = false) {
  const root = new THREE.Group(); root.name = 'dragon';
  scene.add(root);

  // ------------------------------------------------ flight path
  const P = day
    ? [[-72, 46, -22], [-42, 52, -70], [18, 48, -80], [70, 44, -42], [80, 42, 18], [52, 46, 68], [2, 58, 8], [-48, 48, 62], [-82, 44, 30]]
    : [[-64, 44, -30], [-24, 52, -70], [36, 46, -58], [70, 40, -8], [52, 42, 46], [8, 50, 62], [-10, 58, 6], [-40, 48, 40], [-82, 40, 30], [-90, 38, -10]];
  const curve = new THREE.CatmullRomCurve3(P.map((p) => new THREE.Vector3(...p)), true, 'centripetal');
  const LEN = curve.getLength();
  const at = (s, out) => curve.getPointAt(((s % LEN) + LEN) % LEN / LEN, out);

  // ------------------------------------------------ body tube
  const nv = SPINE * RING;
  const pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
  const radius = new Float32Array(SPINE);
  for (let i = 0; i < SPINE; i++) {
    const t = i / (SPINE - 1);
    radius[i] = 1.2 * (t < 0.22 ? 0.75 + t / 0.22 * 0.75 : t < 0.45 ? 1.5 + Math.sin((t - 0.22) / 0.23 * Math.PI / 2) * 0.95 : 2.45 * Math.pow(1 - (t - 0.45) / 0.55, 1.35) + 0.12);
  }
  const cTop = new THREE.Color('#1c4fb4').convertSRGBToLinear(), cBelly = new THREE.Color('#8fd6ff').convertSRGBToLinear(), cRidge = new THREE.Color('#0d2a6a').convertSRGBToLinear();
  for (let i = 0; i < SPINE; i++) for (let k = 0; k < RING; k++) {
    const a = k / RING * Math.PI * 2, belly = Math.max(0, -Math.cos(a)); // k=0 top
    const c = cTop.clone().lerp(cBelly, Math.pow(belly, 1.5) * 0.8);
    if (k === 0) c.copy(cRidge);
    const j = (i * RING + k) * 3; col[j] = c.r; col[j + 1] = c.g; col[j + 2] = c.b;
  }
  const idx = [];
  for (let i = 0; i < SPINE - 1; i++) for (let k = 0; k < RING; k++) {
    const a = i * RING + k, b = i * RING + (k + 1) % RING, c = (i + 1) * RING + k, d = (i + 1) * RING + (k + 1) % RING;
    idx.push(a, c, b, b, c, d);
  }
  const bodyGeo = new THREE.BufferGeometry();
  bodyGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  bodyGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  bodyGeo.setIndex(idx);
  const skin = rimify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.35, emissive: 0x0a2459, emissiveIntensity: day ? 0.1 : 0.5, envMapIntensity: 1.0 }), [0.25, 0.6, 1.3], 2.0, day ? 0.3 : 0.9);
  const body = new THREE.Mesh(bodyGeo, skin); body.castShadow = true; body.frustumCulled = false;
  root.add(body);

  // ------------------------------------------------ head
  const head = new THREE.Group(); root.add(head);
  const hm = skin;
  const skull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 2.6), hm); skull.position.set(0, 0.2, -0.2); head.add(skull);
  const snoutG = new THREE.CylinderGeometry(0.45, 1.05, 3.4, 6); snoutG.rotateX(Math.PI / 2);
  const snout = new THREE.Mesh(snoutG, hm); snout.position.set(0, 0.05, 2.6); snout.scale.set(1, 0.72, 1); head.add(snout);
  const jawPivot = new THREE.Group(); jawPivot.position.set(0, -0.45, 0.6); head.add(jawPivot);
  const jawG = new THREE.CylinderGeometry(0.35, 0.8, 3.2, 6); jawG.rotateX(Math.PI / 2);
  const jaw = new THREE.Mesh(jawG, hm); jaw.position.set(0, -0.1, 1.7); jaw.scale.set(1, 0.45, 1); jawPivot.add(jaw);
  const hornM = new THREE.MeshStandardMaterial({ color: 0xd8e6f5, roughness: 0.5, emissive: 0x16305a, emissiveIntensity: 0.4 });
  for (const e of [-1, 1]) {
    const hg = new THREE.ConeGeometry(0.28, 3.2, 6); hg.rotateX(-Math.PI / 2 - 0.5);
    const horn = new THREE.Mesh(hg, hornM); horn.position.set(e * 0.75, 0.9, -1.8); horn.rotation.y = e * 0.25; head.add(horn);
    const fg = new THREE.ConeGeometry(0.2, 1.6, 4); fg.rotateX(-Math.PI / 2 - 0.2);
    const frill = new THREE.Mesh(fg, hornM); frill.position.set(e * 1.1, 0.1, -1.4); frill.rotation.y = e * 0.8; head.add(frill);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 1.8, 3.2), toneMapped: false }));
    eye.position.set(e * 0.78, 0.55, 0.95); head.add(eye);
  }
  head.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  head.scale.setScalar(1.25);

  // ------------------------------------------------ wings
  // spread pose, right wing, local frame: x = out, y = up, z = forward
  const W0 = [[0.4, 0, 1.4], [7.5, 0.6, 3.0], [14, 1.2, 0.6], [23, 0.2, -3.5], [19, 0, -8.5], [12.5, 0, -10.2], [1.2, 0, -5.4], [6, 0.3, -7.5]];
  const WTRI = [0, 1, 6, 1, 2, 6, 2, 3, 4, 2, 4, 7, 4, 5, 7, 2, 7, 6, 5, 6, 7];
  const wingMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75, metalness: 0.0, emissive: 0x071d4a, emissiveIntensity: day ? 0.1 : 0.35 });
  const wcA = new THREE.Color('#0d2a6e').convertSRGBToLinear(), wcB = new THREE.Color('#2560c0').convertSRGBToLinear();
  const wings = [-1, 1].map((side) => {
    const g = new THREE.BufferGeometry(), wp = new Float32Array(W0.length * 3), wc = new Float32Array(W0.length * 3);
    W0.forEach((p, i) => { const c = (i <= 3) ? wcA : wcB; wc[i * 3] = c.r; wc[i * 3 + 1] = c.g; wc[i * 3 + 2] = c.b; });
    g.setAttribute('position', new THREE.BufferAttribute(wp, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(wc, 3));
    g.setIndex(side > 0 ? WTRI : WTRI.map((v, i) => WTRI[i - (i % 3) + (2 - (i % 3))]));
    const m = new THREE.Mesh(g, wingMat); m.castShadow = true; m.frustumCulled = false;
    root.add(m);
    // arm bones (leading edge)
    const boneG = new THREE.CylinderGeometry(0.18, 0.32, 1, 6); boneG.translate(0, 0.5, 0); boneG.rotateX(Math.PI / 2);
    const bones = [0, 1, 2].map(() => { const b = new THREE.Mesh(boneG, hm); b.castShadow = true; root.add(b); return b; });
    return { side, g, wp, m, bones };
  });

  // ------------------------------------------------ light (belly glow)
  let glow = null;
  if (quality !== 'low') { glow = new THREE.PointLight(0x4aa8ff, 0, 60, 1.6); root.add(glow); }

  // ------------------------------------------------ animation state
  const hist = { s: 0 };
  const v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const pts = Array.from({ length: SPINE + 2 }, () => new THREE.Vector3());
  const T = new THREE.Vector3(), S = new THREE.Vector3(), U = new THREE.Vector3(), tmp = new THREE.Vector3();
  const frames = Array.from({ length: SPINE }, () => ({ T: new THREE.Vector3(), S: new THREE.Vector3(), U: new THREE.Vector3() }));
  const mBasis = new THREE.Matrix4(), qTmp = new THREE.Quaternion();
  const speed = 15;
  let breath = 0, nextBreath = 9, bank = 0, flapPhase = 0;
  const mouth = new THREE.Vector3(), fwd = new THREE.Vector3();

  function frameAt(i, p0, p1) {
    const f = frames[i];
    f.T.subVectors(p0, p1).normalize();
    f.S.crossVectors(f.T, up).normalize();
    f.U.crossVectors(f.S, f.T).normalize();
    return f;
  }

  function update(t, dt) {
    hist.s += speed * dt;
    // bank from path curvature
    at(hist.s + 6, tmp); at(hist.s, v); const a1 = Math.atan2(tmp.x - v.x, tmp.z - v.z);
    at(hist.s - 6, tmp); const a0 = Math.atan2(v.x - tmp.x, v.z - tmp.z);
    let da = a1 - a0; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    bank += (THREE.MathUtils.clamp(-da * 2.2, -0.75, 0.75) - bank) * Math.min(1, dt * 2);

    const wave = (i) => Math.sin(t * 2.2 - i * 0.38) * 0.35 * (i / SPINE);
    for (let i = 0; i < SPINE + 2; i++) { at(hist.s - (i - 1) * SEG, pts[i]); pts[i].y += Math.sin(t * 0.7 - i * 0.12) * 0.4; }
    for (let i = 0; i < SPINE; i++) {
      const f = frameAt(i, pts[i], pts[i + 1] ?? pts[i]);
      const b = bank * (1 - i / SPINE * 0.6);
      // roll frame by bank
      S.copy(f.S).multiplyScalar(Math.cos(b)).addScaledVector(f.U, Math.sin(b));
      U.copy(f.U).multiplyScalar(Math.cos(b)).addScaledVector(f.S, -Math.sin(b));
      f.S.copy(S); f.U.copy(U);
      const c = pts[i + 1], sway = wave(i), rr = radius[i];
      for (let k = 0; k < RING; k++) {
        const a = k / RING * Math.PI * 2, ridge = k === 0 ? (i > 2 && i < SPINE - 3 ? 1.45 : 1.2) : 1;
        const cy = Math.cos(a) * rr * ridge * (k === 0 ? 1 : 0.92), cx = Math.sin(a) * rr * 1.05;
        const j = (i * RING + k) * 3;
        pos[j] = c.x + f.S.x * (cx + sway) + f.U.x * cy;
        pos[j + 1] = c.y + f.S.y * (cx + sway) + f.U.y * cy;
        pos[j + 2] = c.z + f.S.z * (cx + sway) + f.U.z * cy;
      }
    }
    bodyGeo.attributes.position.needsUpdate = true; bodyGeo.computeVertexNormals(); bodyGeo.computeBoundingSphere();

    // head at the front of the spine
    const f0 = frames[0];
    T.copy(f0.T);
    mBasis.makeBasis(f0.S.clone().negate(), f0.U, T);
    head.quaternion.setFromRotationMatrix(mBasis);
    head.quaternion.multiply(qTmp.setFromEuler(new THREE.Euler(0.15 + Math.sin(t * 0.9) * 0.08, Math.sin(t * 0.5) * 0.15, 0)));
    head.position.copy(pts[1]).addScaledVector(T, 1.4).addScaledVector(f0.U, 0.3);

    // wings at the shoulder (spine index 8)
    const fs = frames[8], sh = pts[9];
    const gliding = Math.sin(t * 0.35) > 0.35;
    flapPhase += dt * (gliding ? 1.2 : 5.6);
    const flap = gliding ? 0.1 + Math.sin(flapPhase) * 0.05 : Math.sin(flapPhase) * 0.62;
    const tipLag = gliding ? 0.08 : Math.sin(flapPhase - 0.9) * 0.45;
    const fold = gliding ? 1 : 0.9 + 0.1 * Math.cos(flapPhase);
    for (const w of wings) {
      const s = w.side;
      for (let i = 0; i < W0.length; i++) {
        let [x, y, z] = W0[i];
        x *= i >= 2 && i <= 5 ? fold : 1;
        const lift = x * Math.tan(flap) + Math.max(0, x - 7.5) * Math.tan(tipLag);
        y += lift;
        const wx = sh.x + fs.S.x * (x * s + s * 1.2) + fs.U.x * (y + 1.2) + fs.T.x * z;
        const wy = sh.y + fs.S.y * (x * s + s * 1.2) + fs.U.y * (y + 1.2) + fs.T.y * z;
        const wz = sh.z + fs.S.z * (x * s + s * 1.2) + fs.U.z * (y + 1.2) + fs.T.z * z;
        w.wp[i * 3] = wx; w.wp[i * 3 + 1] = wy; w.wp[i * 3 + 2] = wz;
      }
      w.g.attributes.position.needsUpdate = true; w.g.computeVertexNormals(); w.g.computeBoundingSphere();
      for (let b = 0; b < 3; b++) {
        const A = new THREE.Vector3().fromArray(w.wp, b * 3), Bv = new THREE.Vector3().fromArray(w.wp, (b + 1) * 3);
        const bone = w.bones[b]; bone.position.copy(A);
        bone.lookAt(Bv); bone.scale.set(1.25 - b * 0.3, 1.25 - b * 0.3, A.distanceTo(Bv));
      }
    }

    // breath
    nextBreath -= dt;
    if (nextBreath <= 0 && breath <= 0) { breath = 1.8; nextBreath = 13 + Math.random() * 8; }
    fwd.set(0, 0, 1).applyQuaternion(head.quaternion);
    mouth.copy(head.position).addScaledVector(fwd, 4.2).addScaledVector(f0.U, -0.4);
    if (breath > 0) {
      breath -= dt;
      jawPivot.rotation.x = 0.55;
      const vel = speed;
      for (let k = 0; k < 7; k++) {
        const sp = 5;
        fxBreath.emit(mouth.x, mouth.y, mouth.z,
          fwd.x * 34 + T.x * vel + (Math.random() - 0.5) * sp, fwd.y * 34 + T.y * vel + (Math.random() - 0.5) * sp - 3, fwd.z * 34 + T.z * vel + (Math.random() - 0.5) * sp,
          0.7 + Math.random() * 0.4, 2.2 + Math.random() * 1.5, 3.5, 0.9);
      }
      if (glow) { glow.intensity = 900 * Math.min(1, breath); glow.position.copy(mouth).addScaledVector(fwd, 8); }
    } else {
      jawPivot.rotation.x += (0.06 + Math.sin(t * 1.3) * 0.04 - jawPivot.rotation.x) * Math.min(1, dt * 6);
      if (glow) { glow.intensity = 60; glow.position.copy(pts[8]).addScaledVector(frames[8].U, -3); }
    }
  }
  update(0, 0.016);
  return { root, update, get position() { return pts[4]; }, get breathing() { return breath > 0; }, curve, get s() { return hist.s; }, set s(v2) { hist.s = v2; } };
}
