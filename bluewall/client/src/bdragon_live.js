// The battle dragons drawn exactly like the dragons that circle the home map (owner 5 Oct 08:23: "still not the dragon of the main map"):
// the same Prowler model, one skinned mesh per dragon (creature.js makeCreature), the painted skin texture read as grey and multiplied by a tint (util.js grayMap recipe),
// the same rim light, a real wing-beat from the skeleton - no baked frames.  A battle has 10 of them at most, so every dragon is its own skinned mesh.
// The kind has the interface of a baked crowd kind (crowd.js createKind: add / remove / update / info / stats / drawn / group), so bunits.js drives it like any other.
//   p = kind.add({ x, y, z, yaw, scale })   p.x / y / z / yaw / scale / pitch / roll are plain fields (the unit view moves them), p.play(name, { fade, speed, offset }), p.setSpeed(k)
// Materials and geometry are made ONCE per kind and shared by all its dragons (so a kind costs one program, one set of buffers; the home model is never touched or disposed).
import * as THREE from 'three';
import { makeCreature } from './creature.js';

// tint = the colour the grey skin is multiplied with; rim = rim light (rgb, scaled by rimK); eye = the glow of the eyes.  (the home guardian is 0x5f8fe8 with a blue rim)
export const LIVE_LOOK = {
  dragon: { tint: 0xd92e20, rim: [1.0, 0.22, 0.10], rimK: 0.7, eye: 0xffa421, gain: 1.25 },
  baby: { tint: 0xe23a28, rim: [1.0, 0.26, 0.11], rimK: 0.7, eye: 0xffbb33, gain: 1.25 },
  // the foe's guardians: dark charcoal hide, hot orange rim and eyes (they never look like ours)
  edragon: { tint: 0x4a4240, rim: [1.0, 0.5, 0.12], rimK: 0.8, eye: 0xff8a14, gain: 1.35 },
  ebaby: { tint: 0x554b48, rim: [1.0, 0.52, 0.14], rimK: 0.8, eye: 0xff9a1c, gain: 1.35 },
};
export const LIVE = (typeof window !== 'undefined' ? (window.__bwLook = window.__bwLook || {}) : {});      // live handles of the materials (tune a look in a running game)

const gray = (gain) => `float bwG = 0.0;
#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  { vec3 gm = pow( max( sampledDiffuseColor.rgb, vec3( 0.0 ) ), vec3( 0.4545 ) ); float gr = dot( gm, vec3( 0.3, 0.55, 0.15 ) ); float gl = min( 1.0, gr * ${gain.toFixed(2)} ); bwG = gr; sampledDiffuseColor.rgb = vec3( pow( gl, 2.2 ) ); }
  diffuseColor *= sampledDiffuseColor;
#endif`;

export function createLiveKind({ gltf, look, key = 'dragon', rim = null, clipNames = ['Fly', 'Perch'] }) {
  const group = new THREE.Group(); group.name = 'liveDragons_' + key;
  const clips = {}, info = {};
  for (const n of clipNames) { const c = (gltf.animations || []).find((a) => a.name === n); if (c) { clips[n] = c; info[n] = { dur: c.duration, base: 0, count: Math.round(c.duration * 30) }; } }
  if (!clips.Fly) throw new Error('live dragon: no Fly clip');
  const U = { uRim: { value: new THREE.Vector3(...(rim || look.rim)).multiplyScalar(look.rimK) }, uGlow: { value: new THREE.Vector3(...(look.glow || [0, 0, 0])) } };   // (look.glow: a hot glow that follows the bright parts of the skin texture (the ridges of the scales), look.rimPow: the rim light's falloff, default 2.4 = the home dragons)
  const mats = new Map(), geos = new Map(), hand = { mats: [], U };
  const shade = (m0) => {
    const m = m0.clone();
    if (m.emissiveMap) {                                              // the eye: a hot glow
      m.map = null; m.emissiveMap = null; m.color.set(0x000000); m.emissive.set(look.eye); m.emissiveIntensity = 2.4; m.roughness = 0.4; return m;
    }
    m.color.set(look.tint); m.envMapIntensity = look.env != null ? look.env : Math.min(m.envMapIntensity ?? 1, 1); if (look.rough != null) m.roughness = look.rough;       // (look.env / look.rough: less sky reflection = a deeper, more saturated hide)
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uRim = U.uRim; sh.uniforms.uGlow = U.uGlow;
      sh.fragmentShader = 'uniform vec3 uRim;\nuniform vec3 uGlow;\n' + sh.fragmentShader.replace('#include <map_fragment>', gray(look.gain || 1.25))
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { float fr = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), ${(look.rimPow || 2.4).toFixed(2)}); totalEmissiveRadiance += uRim * fr${look.glow ? ' + uGlow * pow(bwG, ' + (look.glowPow || 3).toFixed(1) + ')' : ''}; }`);
    };
    m.customProgramCacheKey = () => 'bwlivedrg' + (look.gain || 1.25).toFixed(2) + (look.rimPow ? 'p' + look.rimPow : '') + (look.glow ? 'g' + (look.glowPow || 3) : '');
    hand.mats.push(m); return m;
  };
  const all = [];
  const _pm = new THREE.Matrix4(), _fr = new THREE.Frustum(), _sph = new THREE.Sphere(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), _up = new THREE.Vector3(0, 1, 0);
  let lastT = null;

  function add({ x = 0, y = 0, z = 0, yaw = 0, scale = 1 } = {}) {
    const c = makeCreature(gltf, {});                                 // native size (the unit view scales it), no normalising
    if (!c) throw new Error('live dragon: no creature');
    c.inner.position.set(0, 0, 0);                                    // (makeCreature stands the model on y = 0 by its lowest vertex: keep the model's own origin, like the baked crowd had)
    { const junk = []; c.inner.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh && o.material && o.material.opacity === 0) junk.push(o); }); for (const o of junk) o.parent.remove(o); }      // (the rig's 15 control-shape widgets: opacity 0, yet each was a draw call in the main pass and again in the shadow pass)
    c.inner.traverse((o) => {
      if (!o.isMesh) return;
      if (!mats.has(o.material)) mats.set(o.material, shade(o.material));
      o.material = mats.get(o.material);
      if (!geos.has(o.geometry)) geos.set(o.geometry, o.geometry.clone());
      o.geometry = geos.get(o.geometry);
      o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false;
    });
    const p = { x, y, z, yaw, scale, pitch: 0, roll: 0, c, name: '', _act: null, vis: true };
    p.play = (name, { fade = true, speed = 1, offset = 0 } = {}) => {
      const clip = clips[name]; if (!clip) return false;
      const a = c.mixer.clipAction(clip); a.reset(); a.timeScale = speed; a.setLoop(THREE.LoopRepeat, Infinity);
      if (offset) a.time = offset % clip.duration;
      a.play();
      if (p._act && p._act !== a) { if (fade) p._act.crossFadeTo(a, 0.3, false); else p._act.stop(); }
      p._act = a; p.name = name; return true;
    };
    p.setSpeed = (sp) => { if (p._act && Math.abs(p._act.timeScale - sp) > 1e-3) p._act.timeScale = sp; };
    group.add(c.root);
    all.push(p); return p;
  }
  function remove(p) { const i = all.indexOf(p); if (i >= 0) { all.splice(i, 1); group.remove(p.c.root); p.c.mixer.stopAllAction(); } }

  function update(t, camera) {
    const dt = lastT == null ? 0 : Math.min(0.1, Math.max(0, t - lastT)); lastT = t;
    _pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm);
    for (const p of all) {
      _sph.center.set(p.x, p.y + p.scale * 0.35, p.z); _sph.radius = p.cr || p.scale * 1.3;
      const vis = _fr.intersectsSphere(_sph); p.c.root.visible = vis;
      if (!vis) continue;
      p.c.mixer.update(dt);
      const r = p.c.root; r.position.set(p.x, p.y, p.z); r.scale.setScalar(p.scale);
      _q.setFromAxisAngle(_up, p.yaw); if (p.pitch || p.roll) _q.multiply(_q2.setFromEuler(_e.set(p.pitch || 0, 0, p.roll || 0)));
      r.quaternion.copy(_q);
    }
  }
  LIVE[key + 'Live'] = hand;
  return { group, add, remove, update, info, stats: { walkSpeed: 1 }, instances: all, get drawn() { return [all.filter((p) => p.c.root.visible).length]; }, hand };
}
