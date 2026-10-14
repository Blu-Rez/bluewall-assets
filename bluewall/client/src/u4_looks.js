// u4_looks.js — p39 / worker U4: the gryphon (lv 23) and the gryphon knight (lv 25, hero) from REAL models.
//
// GRYPHON: "Gryphon-simple animated" by Twqero (CC-BY 4.0), packed by dev/u4_mkglb.mjs as web/assets/u4_gryphon.glb: its own mesh, its own texture,
// its own 38-bone skeleton - nothing re-rigged, nothing re-coloured. The file ships ONE loop ("Action", 7.8 s, a perched idle): that loop is
// `Rest`; the five clips the battle needs (Fly, Hover, Atk, Hit, Die) are keyed here on the ARTIST'S bones (wing shoulder / elbow / hand, chest, head,
// fore legs, hind legs, tail) - animation only, the geometry is never touched.
//   const { scene, animations } = buildU4Gryphon(gltf)          // -> what crowd.js createKind({ gltf: out, anims: out, clips: U4_CLIPS }) wants
// All motion is deterministic (no random numbers) and sampled at 30 fps.
import * as THREE from 'three';

export const U4_CLIPS = ['Rest', 'Fly', 'Hover', 'Atk', 'Hit', 'Die'];
// the forge-tier sheen (unitlook.js GLINT: tier 3 gold, 4 ice, 5 crystal blue) tuned for this model's light, real texture: x0.3 keeps the beast readable in the game's own light (the brown wings stay brown at tier 3, 4 silver, 5 steel-blue)
export const u4Glint = (g, k = 0.3) => (g ? [g[0], g[1] * k] : undefined);
const FPS = 30, AX = { x: new THREE.Vector3(1, 0, 0), z: new THREE.Vector3(0, 0, 1) };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const down = (ph) => 0.5 - 0.5 * Math.cos(ph);                                // 0 = wings up, 1 = wings down (a flap phase in radians)

// ---- the rig: every bone with its rest pose and the bone-local axes that correspond to the WORLD axes x (pitch) and z (roll) of the standing model
function rigOf(scene) {
  scene.updateMatrixWorld(true);
  const R = {}, wq = new THREE.Quaternion();
  scene.traverse((o) => {
    if (!o.isBone) return;
    o.getWorldQuaternion(wq); const inv = wq.clone().invert();
    R[o.name.replace('_Armature', '')] = { o, q0: o.quaternion.clone(), p0: o.position.clone(), ax: AX.x.clone().applyQuaternion(inv), az: AX.z.clone().applyQuaternion(inv) };
  });
  return R;
}
// pose entry per bone: { wx, wz: radians about the world x / z axis (rest frame), ex, ey, ez: local euler, dx, dy, dz: shift in the parent's frame }
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _o = new THREE.Quaternion();
function clipOf(R, name, dur, fn, loop = true) {
  const n = Math.max(2, Math.round(dur * FPS)), times = [], QV = {}, PV = {}, keys = Object.keys(R);
  for (const k of keys) { QV[k] = []; PV[k] = []; }
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * dur; times.push(t);
    const pose = fn(loop ? (i % n) / n : i / n, t) || {};
    for (const k of keys) {
      const b = R[k], p = pose[k];
      _q.copy(b.q0);
      if (p) {
        _o.identity();
        if (p.wx) _o.multiply(_q.clone().setFromAxisAngle(b.ax, p.wx));
        if (p.wz) _o.multiply(_q.clone().setFromAxisAngle(b.az, p.wz));
        if (p.ex || p.ey || p.ez) _o.multiply(_q.clone().setFromEuler(_e.set(p.ex || 0, p.ey || 0, p.ez || 0)));
        _q.copy(b.q0).multiply(_o);
      }
      QV[k].push(_q.x, _q.y, _q.z, _q.w);
      PV[k].push(b.p0.x + (p && p.dx || 0), b.p0.y + (p && p.dy || 0), b.p0.z + (p && p.dz || 0));
    }
  }
  const tracks = [];
  for (const k of keys) {
    const nm = R[k].o.name;
    tracks.push(new THREE.QuaternionKeyframeTrack(nm + '.quaternion', times, QV[k]));
    if (PV[k].some((v, i) => Math.abs(v - PV[k][i % 3]) > 1e-6)) tracks.push(new THREE.VectorKeyframeTrack(nm + '.position', times, PV[k]));
  }
  return new THREE.AnimationClip(name, dur, tracks);
}

// ---- the five battle clips (angles in radians; the wing's rest pose is "raised", wz > 0 swings the left wing down, the right wing mirrors it)
const WINGS = (fn) => { const o = {}; for (const [side, sg] of [['L', -1], ['R', 1]]) { const w = fn(side, sg); for (const k in w) o[k + side] = w[k]; } return o; };
function flap(ph, A) {                                                           // one wing-beat: shoulder leads, elbow and hand lag
  return WINGS((side, sg) => ({
    w01: { wz: sg * (A.base + A.sh * down(ph)) },
    w02: { wz: sg * (A.el0 + A.el * down(ph - 0.7)) },
    w03: { wz: sg * (A.ha0 + A.ha * down(ph - 1.4)) },
    w04: { wz: sg * (A.in0 + A.in * down(ph - 0.35)) },
  }));
}
const FLY = { base: 0.15, sh: 1.45, el0: 0, el: 0.4, ha0: 0, ha: 0.55, in0: 0, in: 0.5 };
const HOV = { base: 0.2, sh: 1.1, el0: 0, el: 0.3, ha0: 0, ha: 0.4, in0: 0, in: 0.35 };

export function buildU4Gryphon(gltf) {
  const scene = gltf.scene, R = rigOf(scene), rest = (gltf.animations || [])[0];
  const out = [];
  if (rest) { const c = rest.clone(); c.name = 'Rest'; out.push(c); }
  // Fly: cruising wing-beat, the chest rides the stroke, fore legs folded, hind legs trailing, tail streaming
  out.push(clipOf(R, 'Fly', 0.9, (u) => {
    const ph = u * Math.PI * 2, d = down(ph - 0.3);
    return { ...flap(ph, FLY),
      main009: { dy: 0.1 * d, wx: 0.05 },
      main001: { wx: -0.08 + 0.05 * Math.cos(ph) },
      main002: { wx: 0.1 - 0.05 * Math.cos(ph) },
      fl01L: { wx: -0.9 }, fl01R: { wx: -0.9 }, fl02L: { wx: 0.6 }, fl02R: { wx: 0.6 },
      bl01L: { wx: 0.5 }, bl01R: { wx: 0.5 }, bl02L: { wx: -0.5 }, bl02R: { wx: -0.5 },
      main004: { wx: 0.1 * Math.sin(ph - 0.6) }, main005: { wx: 0.12 * Math.sin(ph - 1.0) }, main006: { wx: 0.14 * Math.sin(ph - 1.4) }, main007: { wx: 0.16 * Math.sin(ph - 1.8) }, main008: { wx: 0.18 * Math.sin(ph - 2.2) } };
  }));
  // Hover: slow, deep wing-beat, nose up, legs hanging
  out.push(clipOf(R, 'Hover', 1.2, (u) => {
    const ph = u * Math.PI * 2, d = down(ph - 0.3);
    return { ...flap(ph, HOV),
      main009: { dy: 0.12 * d, wx: -0.22 },
      main001: { wx: -0.1 }, main002: { wx: 0.18 },
      fl01L: { wx: -0.2 }, fl01R: { wx: -0.2 }, bl01L: { wx: 0.1 }, bl01R: { wx: 0.1 },
      main004: { wx: 0.08 * Math.sin(ph - 0.8) }, main006: { wx: 0.1 * Math.sin(ph - 1.5) }, main008: { wx: 0.12 * Math.sin(ph - 2.2) } };
  }));
  // Atk: rear back (0 - 0.35 s), strike (0.35 - 0.55 s: the claws and the beak land at 0.43 s), recover
  out.push(clipOf(R, 'Atk', 1.0, (u, t) => {
    const wind = ss(0, 0.35, t) * (1 - ss(0.35, 0.43, t)), hit = ss(0.33, 0.43, t) * (1 - ss(0.52, 0.95, t)), ph = Math.PI * 2 * t * 1.3;
    return { ...flap(ph, { ...FLY, sh: 1.0 + 0.3 * wind }),
      main009: { dy: 0.1 * wind - 0.08 * hit, wx: -0.22 * wind + 0.2 * hit },
      main001: { wx: -0.2 * wind + 0.2 * hit }, main002: { wx: -0.15 * wind + 0.3 * hit },
      fl01L: { wx: -0.4 * wind + 0.8 * hit }, fl01R: { wx: -0.4 * wind + 0.8 * hit }, fl02L: { wx: 0.2 * wind - 0.3 * hit }, fl02R: { wx: 0.2 * wind - 0.3 * hit },
      bl01L: { wx: 0.2 * hit }, bl01R: { wx: 0.2 * hit } };
  }, false));
  // Hit: a flinch - the chest rocks back, the wings flare
  out.push(clipOf(R, 'Hit', 0.5, (u, t) => {
    const k = Math.sin(Math.PI * clamp(t / 0.5, 0, 1)), ph = Math.PI * 2 * t * 2;
    return { ...flap(ph, { ...FLY, sh: 1.2 }), main009: { wx: -0.3 * k, dy: -0.1 * k }, main001: { wx: -0.25 * k }, main002: { wx: -0.4 * k }, fl01L: { wx: -0.4 * k }, fl01R: { wx: -0.4 * k } };
  }, false));
  // Die: the wings go limp and droop, the head drops, the legs go slack
  out.push(clipOf(R, 'Die', 1.0, (u, t) => {
    const k = ss(0, 0.8, t);
    return { ...WINGS((side, sg) => ({ w01: { wz: sg * (0.15 + 0.9 * k) }, w02: { wz: sg * 0.5 * k }, w03: { wz: sg * 0.7 * k }, w04: { wz: sg * 0.4 * k } })),
      main009: { wx: 0.25 * k, dy: -0.2 * k }, main001: { wx: 0.35 * k }, main002: { wx: 0.6 * k },
      fl01L: { wx: 0.6 * k }, fl01R: { wx: 0.6 * k }, bl01L: { wx: 0.35 * k }, bl01R: { wx: 0.35 * k } };
  }, false));
  return { scene, animations: out };
}
