// Planar reflection of the moat (high / ultra only).
// A mirrored copy of the camera draws the castle, the walls, the towers and the town into a small render target (alpha = drawn; the sky and the hills stay the water's own blue, a mirrored fogged hill only turned the water milky) (about a third of
// the screen size) every third frame; the water shader mixes it in (up to 60 % on the structures, 35 % average) under its ripples. Only objects on REFL_LAYER are drawn, so
// the pass costs about as many draw calls as the castle batch has meshes (the budget is 25).  It switches itself off below 0.85 dynamic
// resolution, in battle, while the page is hidden, and when the camera is under the water level.
import * as THREE from 'three';

export const REFL_LAYER = 5;
const MAX_CALLS = 25;

// mark what the mirror may draw: the batched castle/town meshes and the lights that shade them
export function tagReflected(objs) {
  let n = 0;
  for (const o of objs) {
    if (!o) continue;
    let lens = false; o.traverse((c) => { if (c.isLensflare) lens = true; });
    if (lens) continue;
    o.traverse((c) => { c.layers.enable(REFL_LAYER); n++; });
  }
  return n;
}

export function createReflect({ renderer, scene, camera, water, level = 'medium', DYN = { s: 1 } }) {
  const on = level === 'high' || level === 'ultra';
  const U = water.mesh.material.uniforms;
  const dummy = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); dummy.needsUpdate = true;
  U.uRef.value = dummy; U.uRA.value = 0;
  if (!on) return { enabled: false, update() {}, setActive() {}, dispose() {}, stats: () => ({ on: false }) };

  const vcam = new THREE.PerspectiveCamera(); vcam.layers.set(REFL_LAYER);
  // the mirror must see the very same lights as the main view (else every material would need a second shader program)
  const tagLights = () => scene.traverse((o) => { if (o.isLight && !o.layers.isEnabled(REFL_LAYER)) o.layers.enable(REFL_LAYER); });
  let tk = 0, still = 0, lastOk = false; tagLights();
  const lastM = new THREE.Matrix4(), same = (a, b) => { for (let i = 0; i < 16; i++) if (Math.abs(a[i] - b[i]) > 2e-4) return false; return true; };   // (p28: a still camera sees the very same mirror picture: re-draw it once a second instead of every third frame)
  let rt = null, rw = 0, rh = 0, frame = 0, act = 0, want = 1, calls = 0, drawn = 0;
  const texM = new THREE.Matrix4(), plane = new THREE.Plane(), clip = new THREE.Vector4(), q = new THREE.Vector4();
  const camPos = new THREE.Vector3(), fwd = new THREE.Vector3(), tgt = new THREE.Vector3(), v1 = new THREE.Vector3();
  const sz = new THREE.Vector2();

  function size() {
    renderer.getDrawingBufferSize(sz);
    const w = Math.max(160, Math.min(512, Math.round(sz.x * 0.3))), h = Math.max(160, Math.min(768, Math.round(sz.y * 0.3)));
    if (rt && w === rw && h === rh) return;
    if (rt) rt.dispose();
    rw = w; rh = h;
    rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.UnsignedByteType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, generateMipmaps: false });
    rt.texture.colorSpace = THREE.LinearSRGBColorSpace;
    U.uRef.value = rt.texture;
  }

  function render() {
    const wy = water.mesh.position.y;
    camera.updateMatrixWorld();
    camPos.setFromMatrixPosition(camera.matrixWorld);
    if (camPos.y <= wy + 0.6) return false;
    size();
    // the camera as seen in the water surface: position, look-at and up mirrored about y = wy
    fwd.set(0, 0, -1).transformDirection(camera.matrixWorld);
    tgt.copy(camPos).addScaledVector(fwd, 10);
    vcam.position.set(camPos.x, 2 * wy - camPos.y, camPos.z);
    v1.set(0, 1, 0).transformDirection(camera.matrixWorld); v1.y = -v1.y;
    vcam.up.copy(v1);
    vcam.lookAt(tgt.x, 2 * wy - tgt.y, tgt.z);
    vcam.fov = camera.fov; vcam.aspect = camera.aspect; vcam.near = camera.near; vcam.far = Math.min(camera.far, 1500);
    vcam.updateProjectionMatrix(); vcam.updateMatrixWorld();
    // what the water shader needs to find a world point in the picture (computed before the near plane is tilted)
    texM.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    texM.multiply(vcam.projectionMatrix).multiply(vcam.matrixWorldInverse);
    U.uRM.value.copy(texM); U.uRY.value = wy;
    // oblique near plane = the water surface: nothing below it is drawn (the wall feet in the moat, the bed)
    plane.set(new THREE.Vector3(0, 1, 0), -wy).applyMatrix4(vcam.matrixWorldInverse);
    clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    const p = vcam.projectionMatrix.elements;
    q.x = (Math.sign(clip.x) + p[8]) / p[0]; q.y = (Math.sign(clip.y) + p[9]) / p[5]; q.z = -1; q.w = (1 + p[10]) / p[14];
    clip.multiplyScalar(2 / clip.dot(q));
    p[2] = clip.x; p[6] = clip.y; p[10] = clip.z + 1 - 0.003; p[14] = clip.w;
    vcam.projectionMatrixInverse.copy(vcam.projectionMatrix).invert();

    const prevRT = renderer.getRenderTarget(), sm = renderer.shadowMap, nu = sm.needsUpdate, au = sm.autoUpdate, xr = renderer.xr.enabled;
    const cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha();
    const ac = renderer.autoClear, info = renderer.info.render.calls, ar = renderer.info.autoReset;
    sm.autoUpdate = false; sm.needsUpdate = false; renderer.xr.enabled = false;
    renderer.info.autoReset = false;
    renderer.setRenderTarget(rt); renderer.autoClear = true;
    renderer.setClearColor(scene.fog ? scene.fog.color : 0x000000, 0); renderer.clear(true, true, false);
    const bg = scene.background; scene.background = null;   // (a Color background would clear the mirror opaque: the lake turned fog-pale)
    renderer.render(scene, vcam);
    scene.background = bg;
    calls = renderer.info.render.calls - info;
    renderer.info.autoReset = ar;
    renderer.setRenderTarget(prevRT); renderer.autoClear = ac; renderer.setClearColor(cc, ca);
    sm.autoUpdate = au; sm.needsUpdate = nu; renderer.xr.enabled = xr;
    drawn++;
    return true;
  }

  const api = {
    enabled: true, off: false, every: 3,                 // (off: a dev / cool-mode switch)
    // call once per drawn frame, right before the scene is rendered
    update(dt, { battle = false } = {}) {
      if (++tk % 240 === 0) tagLights();
      want = (api.off || battle || DYN.s < 0.85 || document.hidden) ? 0 : 1;
      if (want && (frame++ % api.every === 0 || act < 0.01)) {
        camera.updateMatrixWorld();
        if (lastOk && act > 0.9 && still < 19 && same(camera.matrixWorld.elements, lastM.elements)) still++;      // reuse the last picture
        else if (!render()) { want = 0; lastOk = false; } else { still = 0; lastOk = true; lastM.copy(camera.matrixWorld); }
      }
      act += (want - act) * Math.min(1, dt * (want ? 2.5 : 6));
      if (act < 0.004) act = 0;
      U.uRA.value = act;
    },
    setActive(v) { want = v ? 1 : 0; },
    stats: () => ({ on: true, act, calls, drawn, w: rw, h: rh, budget: MAX_CALLS }),
    dispose() { if (rt) rt.dispose(); dummy.dispose(); },
  };
  return api;
}
