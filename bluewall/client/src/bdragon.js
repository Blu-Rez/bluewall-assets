// The look of the battle dragons (owner 4 Oct 21:51): the big dragon and the baby dragon are OLD, worn RED beasts (deep oxblood / brick, a darker belly, warm worn
// highlights), their breath is orange.  They are the very Prowler model the home sky circles with, drawn here through the baked crowd (crowd.js), so the paint is done
// in the shader through the crowd's `bwExtra` hook: the painted skin texture is read as a light/dark map and re-coloured through a three-step ramp (dark -> mid -> light),
// the belly (faces that look down) is darker, and a thin warm rim catches the edges like the rim light of the home dragons.  No canvas read-back, no extra texture.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { bwExtra } from './crowd.js';

// colours are sRGB hex (three converts them to the linear working space); tuned in the running game under the real sun (a brick-brown albedo turns orange there: the red must be deep, G almost 0)
export const DRAGON_LOOK = {
  dragon: { dark: 0x160303, mid: 0x560b0a, light: 0x9a1810, belly: 0.5, rim: [1.0, 0.36, 0.1], rimK: 0.32, gain: 1.55, eye: 0xffa421 },
  baby: { dark: 0x1a0404, mid: 0x640d0b, light: 0xa81c12, belly: 0.5, rim: [1.0, 0.44, 0.14], rimK: 0.32, gain: 1.6, eye: 0xffbb33 },
  // the foe's guardians: dark charcoal hide, hot orange rim and eyes (so they never look like ours)
  edragon: { dark: 0x050506, mid: 0x1e1b1d, light: 0x5a504d, belly: 0.55, rim: [1.0, 0.5, 0.12], rimK: 0.55, gain: 1.5, eye: 0xff8a14 },
  ebaby: { dark: 0x070606, mid: 0x2a2124, light: 0x6a5a55, belly: 0.55, rim: [1.0, 0.52, 0.14], rimK: 0.55, gain: 1.55, eye: 0xff9a1c },
};

// the tier sheen of a red dragon stays in the warm family (unitlook.js GLINT is gold / ice-white / crystal-blue: blue on a dark red hide turns it purple)
// the live uniforms of the painted copies (so a look can be tuned in a running game: __bwLook.dragon.uLight.value.set(0x...))
export const LIVE = (typeof window !== 'undefined' ? (window.__bwLook = window.__bwLook || {}) : {});
export const EMBER = [null, null, null, [0xffb45a, 0.06], [0xffc27a, 0.08], [0xffa040, 0.11]];

// 'Fly' (one clean wing beat of the landing clip, played forth and back = a loop) and 'Perch' (the crouched pose); once per model
export function prowlerFly(pw) {
  if (pw.__bwFly) return; pw.__bwFly = true;
  const noRoot = (c) => { c.tracks = c.tracks.filter((t) => !/(Root|root).*\.(position)$/.test(t.name)); return c; };
  const land = pw.animations.find((c) => c.name === 'Landing');
  const beat = noRoot(THREE.AnimationUtils.subclip(land, 'beat', 0, 32, 30)), D = beat.duration;
  const tracks = beat.tracks.map((t) => {
    const n = t.times.length, k = t.getValueSize(), times = new Float32Array(n * 2 - 1), vals = new Float32Array((n * 2 - 1) * k);
    for (let i = 0; i < n; i++) { times[i] = t.times[i]; for (let c = 0; c < k; c++) vals[i * k + c] = t.values[i * k + c]; }
    for (let i = n - 2, j = n; i >= 0; i--, j++) { times[j] = 2 * t.times[n - 1] - t.times[i]; for (let c = 0; c < k; c++) vals[j * k + c] = t.values[i * k + c]; }
    return new t.constructor(t.name, times, vals);
  });
  const fly = new THREE.AnimationClip('Fly', 2 * D, tracks);
  const perch = noRoot(THREE.AnimationUtils.subclip(land, 'Perch', 128, 131, 30));
  pw.animations.push(fly, perch);
}

// one painted copy of the Prowler for a look (DRAGON_LOOK.dragon / .baby): { scene, animations } ready for createKind
export function dragonVariant(pw, look, key = 'dragon') {
  const sc = SkeletonUtils.clone(pw.scene), junk = [];
  sc.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh) junk.push(o); });        // (the source file carries the rig's control-shape widgets as plain meshes)
  for (const o of junk) o.parent && o.parent.remove(o);
  const U = {
    uDark: { value: new THREE.Color(look.dark) }, uMid: { value: new THREE.Color(look.mid) }, uLight: { value: new THREE.Color(look.light) },
    uRim: { value: new THREE.Vector3(...look.rim).multiplyScalar(look.rimK) }, uGain: { value: look.gain }, uBelly: { value: look.belly },
  };
  LIVE[key] = U;
  const extra = {
    key: 'dragon', uniforms: U,
    fHead: 'uniform vec3 uDark; uniform vec3 uMid; uniform vec3 uLight; uniform vec3 uRim; uniform float uGain; uniform float uBelly;',
    frag: [
      // the skin: light/dark of the painted map -> ramp; faces that look down (the belly) are darker
      ['normal_fragment_maps', `#ifdef USE_MAP
{ float bwL = clamp(dot(pow(max(diffuseColor.rgb, vec3(0.0)), vec3(0.4545)), vec3(0.3, 0.55, 0.15)) * uGain, 0.0, 1.0);
  vec3 bwC = mix(uDark, uMid, smoothstep(0.0, 0.42, bwL)); bwC = mix(bwC, uLight, smoothstep(0.38, 0.96, bwL));
  vec3 bwN = inverseTransformDirection(normal, viewMatrix);
  bwC *= mix(1.0, uBelly, smoothstep(0.1, 0.75, -bwN.y));
  diffuseColor.rgb = bwC; totalEmissiveRadiance += bwC * 0.2; }                       // (a little self-glow: the red must stay red under the blue light of the field)
#endif`],
      // the rim light of the home dragons, warm
      ['emissivemap_fragment', `{ float bwF = pow(1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0), 2.4); totalEmissiveRadiance += uRim * bwF; }`],
    ],
  };
  sc.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material.clone();
    if (m.emissiveMap) {                                              // the eye: a hot amber glow instead of the green one
      m.map = null; m.emissiveMap = null; m.color.set(0x000000); m.emissive.set(look.eye); m.emissiveIntensity = 2.4; m.roughness = 0.4;
    } else {
      m.color.set(0xffffff); m.emissive = new THREE.Color(0x000000);
      m.envMapIntensity = 0.35; m.roughness = Math.max(m.roughness, 0.9);
      bwExtra.set(m, extra);
    }
    o.material = m;
  });
  return { scene: sc, animations: pw.animations };
}
