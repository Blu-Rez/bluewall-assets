// The kingdom's winged horses (pegasus.glb: home flock + pasture in army.js, battle in bunits.js): coat, points, mane and wings.
//   dressPegasus(gltf, look = PEG_LOOK)   once per loaded model, before it is used (idempotent). Nothing is drawn extra: vertex colours
//   (from the rest pose: darker muzzle and lower legs, dark hooves, wing feathers shading from white to ice / steel blue at the tips,
//   silver-blue mane and tail) + a small shader hook (soft iridescence on the feathers, sheen on the hair) on the model's own two materials.
// Taste switch: PEG_LOOK — 'pearl' (default): light pearl-silver coat with white dapples, smoky points, silver-blue hair, white wings
// tipped ice -> steel blue · 'storm': true dapple grey, charcoal points, black-navy hair, slate-tipped wings · 'snow': snow white,
// silver muzzle, ice-white hair with royal-blue ends, sapphire-tipped wings.
import * as THREE from 'three';
import { bwExtra } from './crowd.js';

export const PEG_LOOK = 'pearl';
export const PEG_LOOKS = ['pearl', 'storm', 'snow'];
// grey: how much of the artist's dapple-grey coat is laid over the white one (0 white … 1 dapple grey)
const LOOKS = {
  pearl: { grey: 0.5, coat: [1.05, 1.07, 1.12], point: 0x4c4f58, pointK: 0.6, hoof: 0x26272c, mane: [0xd7e2f2, 0x8eaad2], wing: [0xffffff, 0xcfe4fb, 0x416fb2], iri: 0.55, clear: 0.35 },
  storm: { grey: 1, coat: [1.0, 1.02, 1.08], point: 0x2a2c33, pointK: 0.8, hoof: 0x18191c, mane: [0x2a3142, 0x0f1626], wing: [0xe9edf3, 0x9fb1c8, 0x26395c], iri: 0.35, clear: 0.3 },
  snow: { grey: 0, coat: [1.02, 1.04, 1.08], point: 0x9aa3b4, pointK: 0.38, hoof: 0x6f7480, mane: [0xf2f7ff, 0x3a6dc4], wing: [0xffffff, 0xd9ecff, 0x2457bd], iri: 0.75, clear: 0.45 },
};
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const NOSE = new THREE.Vector3(0, 1.5, 1.42);

const DONE = new WeakSet();
export function dressPegasus(gltf, look = PEG_LOOK) {
  if (!gltf || DONE.has(gltf)) return gltf; DONE.add(gltf);
  const L = LOOKS[look] || LOOKS.pearl, cPoint = new THREE.Color(L.point), cHoof = new THREE.Color(L.hoof), cM0 = new THREE.Color(L.mane[0]), cM1 = new THREE.Color(L.mane[1]);
  const cW = L.wing.map((h) => new THREE.Color(h)), c = new THREE.Color(), v = new THREE.Vector3(), white = new THREE.Color(1, 1, 1);
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => {
    if (!o.isSkinnedMesh || !o.material) return;
    const m = o.material, g = o.geometry, n = g.attributes.position.count, uv = g.attributes.uv, col = new Float32Array(n * 3), feathers = /Feather/i.test(m.name);
    const iri = new Float32Array(n);                                                // 1 = a feather (iridescence), 2 = hair (sheen)
    for (let i = 0; i < n; i++) {
      o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld);                    // rest pose, metres: +z = nose, y up
      if (!feathers) {
        const u0 = uv ? uv.getX(i) : 0, v0 = uv ? uv.getY(i) : 0;
        if (v0 > 0.85 && u0 < 0.45 && v.y > 1.3) { c.copy(cM0).lerp(cM1, 0.3); iri[i] = 3; }   // the mane + forelock (painted in a dark band of the coat atlas)
        else {
          // the coat: smoky points on the muzzle and the lower legs, dark hooves
          const muzzle = sm(0.34, 0.12, v.distanceTo(NOSE)), legs = sm(0.62, 0.22, v.y), hoof = sm(0.13, 0.07, v.y);
          c.copy(white).lerp(cPoint, Math.max(muzzle, legs) * L.pointK).lerp(cHoof, hoof);
        }
      } else {
        const u0 = uv ? uv.getX(i) : 0, v0 = uv ? uv.getY(i) : 0;
        if (u0 > 0.86 && v0 < 0.6) {                                                // mane + tail (the hair strip of the atlas)
          const t = v.z < 0 ? sm(-0.55, -2.2, v.z) : 0.25; c.copy(cM0).lerp(cM1, t); iri[i] = 2;
        } else {                                                                    // wing feathers: white at the leading edge -> tinted tips
          const span = sm(0.35, 3.1, Math.abs(v.x)), chord = Math.max(0, Math.min(1, (0.68 - v.z) / 1.12));
          const tip = Math.min(1, chord ** 1.4 * (0.45 + 0.75 * span) + span * span * 0.35);
          c.copy(cW[0]).lerp(cW[1], sm(0.15, 0.5, tip)).lerp(cW[2], sm(0.45, 0.98, tip) * (0.4 + 0.6 * span)); iri[i] = 1;
        }
      }
      const o0 = g.attributes.color;                                                // (the feathers carry the artist's own vertex shading: keep it)
      col[i * 3] = c.r * (o0 ? o0.getX(i) : 1); col[i * 3 + 1] = c.g * (o0 ? o0.getY(i) : 1); col[i * 3 + 2] = c.b * (o0 ? o0.getZ(i) : 1);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aIri', new THREE.BufferAttribute(iri, 1));
    m.vertexColors = true;
    if (!feathers) {
      m.color.setRGB(...L.coat); if (m.clearcoat !== undefined) m.clearcoat = L.clear;
      if (L.grey > 0 && gltf.parser && m.map && typeof document !== 'undefined') {   // the artist's dapple-grey coat (in the same file, unused so far; same uv layout) over the white one
        const json = gltf.parser.json, idx = (json.images || []).findIndex((im) => /coat_grey/i.test(im.name || '')), white0 = m.map.image;
        if (idx >= 0 && white0) gltf.parser.loadImageSource(idx, gltf.parser.textureLoader).then((t) => {
          if (!t || !t.image || !m.map) return;
          const W = white0.width, H = white0.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
          g.drawImage(white0, 0, 0, W, H); g.globalAlpha = L.grey; g.drawImage(t.image, 0, 0, W, H);
          m.map.image = cv; m.map.needsUpdate = true;
        }).catch(() => {});
      }
    } else { m.color.setRGB(1, 1, 1); m.emissive && m.emissive.setRGB(0.02, 0.025, 0.04); }
    m.needsUpdate = true;
    const U = { uIri: { value: L.iri } };
    bwExtra.set(m, {
      key: feathers ? 'pegf' : 'pegc', uniforms: U,
      vHead: 'attribute float aIri; varying float vIri;', vMain: 'vIri = aIri;',
      fHead: 'uniform float uIri; varying float vIri;',
      frag: !feathers ? [
        // the mane: its own colour (vertex colour) with the strands of the painted band as light / dark variation
        ['color_fragment', `#ifdef USE_MAP
if (vIri > 2.5) diffuseColor.rgb = vColor.rgb * (0.72 + 0.6 * smoothstep(0.004, 0.05, dot(sampledDiffuseColor.rgb, vec3(0.333))));
#endif`],
        ['roughnessmap_fragment', 'if (vIri > 2.5) roughnessFactor = 0.45;'],
      ] : [
        ['roughnessmap_fragment', 'if (vIri > 1.5) roughnessFactor = 0.42;'],
        // soft mother-of-pearl at grazing angles on the feathers (lit: it adds nothing at night), a sheen on the hair
        ['emissivemap_fragment', `{ float bwF = pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 2.0);
  if (vIri > 0.5 && vIri < 1.5) diffuseColor.rgb *= mix(vec3(1.0), mix(vec3(0.78, 0.95, 1.12), vec3(1.08, 0.86, 1.12), bwF), bwF * uIri); }`],
      ],
    });
  });
  return gltf;
}
