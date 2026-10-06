// The peasant models of the pack (peasant_m / peasant_f) come WITHOUT a head — only body, arms, legs and feet — so the stable trainer,
// the groom, the farrier and the village folk walked around headless (owner, 5 Oct: «مربیِ اصطبل سر نداره»).
// This builds a small procedural head (skull, jaw, nose, ears, eyes, hair; one merged mesh with vertex colours, ~700 triangles) that
// rides on the 'Head' bone: as a plain mesh child of the bone for regular skinned characters (units.js), or as a rigid "prop" of the
// baked-animation crowd (pas_life.js: createKind({ props: [peasantHeadProp(female)] })).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const SKIN = [0xcf9f7a, 0xc48f6a, 0xd8ab86], HAIR_M = [0x46301f, 0x2c2018, 0x6a4a2a], HAIR_F = [0x3a2620, 0x5a3a24, 0x2a1d1a];
const _c = new THREE.Color();
const cache = new Map();

function part(g, hex, p = [0, 0, 0], s = [1, 1, 1], rx = 0) {
  if (rx) g.rotateX(rx);
  g.scale(s[0], s[1], s[2]); g.translate(p[0], p[1], p[2]);
  const n = g.attributes.position.count, col = new Float32Array(n * 3); _c.set(hex);
  for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g;
}

// bone space of 'Head' (Y up through the head, +Z the way it looks): the origin is the base of the skull
export function peasantHeadGeometry(female = false, variant = 0) {
  const key = (female ? 'f' : 'm') + variant; if (cache.has(key)) return cache.get(key);
  const skin = SKIN[variant % SKIN.length], hair = (female ? HAIR_F : HAIR_M)[variant % 3];
  const sk = (r) => new THREE.SphereGeometry(r, 14, 10);
  const P = [];
  {                                                                                              // skull + jaw in ONE egg-shaped mesh (no crease between two spheres)
    const g = sk(1), pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < 0) { pos.setX(i, pos.getX(i) * (1 + 0.30 * y)); pos.setZ(i, pos.getZ(i) * (1 + 0.22 * y)); } }
    P.push(part(g, skin, [0, 0.098, 0.01], [0.07, 0.1, 0.082]));
  }
  P.push(part(new THREE.ConeGeometry(0.013, 0.032, 6), new THREE.Color(skin).multiplyScalar(0.93).getHex(), [0, 0.08, 0.094], [1, 1, 1], Math.PI / 2 + 0.12));   // nose
  for (const e of [-1, 1]) {
    P.push(part(sk(1), skin, [e * 0.071, 0.092, 0.0], [0.013, 0.027, 0.018]));                      // ears
    P.push(part(sk(1), 0x1d1a18, [e * 0.028, 0.102, 0.077], [0.0078, 0.0078, 0.006]));            // eyes
    P.push(part(sk(1), hair, [e * 0.028, 0.116, 0.079], [0.014, 0.0042, 0.006]));                  // brows
  }
  // hair: a dome over the top and the back, the forehead stays free
  const dome = new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.56);
  P.push(part(dome, hair, [0, 0.104, -0.014], [0.077, 0.1, 0.09], 0.12));
  if (female) {
    P.push(part(sk(1), hair, [0, 0.064, -0.052], [0.062, 0.1, 0.04]));                            // long hair behind the neck
    P.push(part(sk(1), hair, [0, 0.152, -0.056], [0.038, 0.036, 0.036]));                           // bun
  }
  const geo = mergeGeometries(P, false); geo.computeVertexNormals(); geo.computeBoundingSphere();
  cache.set(key, geo); return geo;
}

// a regular mesh for a skinned character: head.add(...) on the 'Head' bone
export function peasantHead(female = false, variant = 0) {
  const m = new THREE.Mesh(peasantHeadGeometry(female, variant), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0 }));
  m.name = 'PeasantHead'; m.castShadow = true; return m;
}

// a prop for the baked crowd (crowd.js createKind props: rigid parts that follow one bone)
export function peasantHeadProp(female = false, variant = 0) {
  const g = new THREE.Group(); g.add(peasantHead(female, variant));
  return { gltf: { scene: g }, bone: 'Head', s: 1, pos: [0, 0, 0], rot: [0, 0, 0] };
}
