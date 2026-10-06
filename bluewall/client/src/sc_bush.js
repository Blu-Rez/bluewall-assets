// Countryside bushes (p22 "scatter"): two real shrub models (the leafy EZ-Tree shrub the forest uses near the castle and the dense round
// Quaternius shrub, its red leaves turned green) baked once at load into a card atlas (three side views + a top view each) and drawn as
// soft round card-bushes (replace the flat-shaded icosahedra and the red GLB shrubs): 3 crossed cards + a canopy card, spherical normals,
// cards fade when edge-on, the leaves sway with the wind, per-bush tint, season colours like the deciduous trees (autumn gold / red,
// a dusting of snow in winter). One InstancedMesh (one draw call) for all of them, 8 triangles a bush, no shadow casting.
import * as THREE from 'three';
import { toFloatGeo } from './assets.js';
import { bakeAtlas, cardGeometry, cardFadeShader } from './sc_cards.js';
import { WIND } from './weather.js';
import { seasonWeights } from './terrain.js';

// variants: the leafy EZ-Tree shrub and the dense round Quaternius shrub (its red leaves desaturated and tinted green in the bake)
const NAMES = [['ez_bush_b', 0], ['bush', 1]];

// the shrub's leaf cards only (no bare stems under the bush), normalised to height 1 with the lowest leaves on the ground; both shrubs get
// the same leaf colour so the two variants read as one species (per-bush tint and the seasons do the rest)
const LEAF = new THREE.Color(0.5, 0.74, 0.7), LEAF2 = new THREE.Color(0.55, 0.78, 0.4);
const GRAY = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP
  vec4 sdc = texture2D( map, vMapUv ); float gl = dot( pow( max( sdc.rgb, vec3( 0.0 ) ), vec3( 0.4545 ) ), vec3( 0.3, 0.55, 0.15 ) ) * 1.6;
  diffuseColor *= vec4( vec3( pow( min( gl, 1.0 ), 2.2 ) ), sdc.a );
#endif`); };
function modelParts(gltf, gray) {
  gltf.scene.updateMatrixWorld(true);
  const raw = [];
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const leaf = !!(o.material.map && (o.material.alphaTest > 0 || o.material.transparent || /leav/i.test(o.material.name + o.name)));
    if (leaf) raw.push(o);
  });
  const box = new THREE.Box3(); for (const o of raw) box.expandByObject(o);
  const h = box.max.y - box.min.y, k = 1 / Math.max(0.01, h), cx = (box.max.x + box.min.x) / 2, cz = (box.max.z + box.min.z) / 2;
  const norm = new THREE.Matrix4().makeScale(k, k, k).multiply(new THREE.Matrix4().makeTranslation(-cx, -box.min.y, -cz));
  const parts = raw.map((o) => {
    const g = toFloatGeo(o.geometry); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(norm, o.matrixWorld));
    const m = o.material.clone(); m.alphaTest = 0.5; m.transparent = false; m.side = THREE.DoubleSide; m.color.copy(gray ? LEAF2 : LEAF);
    return { geometry: g, material: m, leaf: true, onBake: gray ? GRAY : null };
  });
  return { parts, half: Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * k / 2 };
}

// list: [{ x, y, z, s (height, m), ry, w (width factor) }]
export function buildBushes(renderer, scene, A, list, { season = null, uTime = { value: 0 } } = {}) {
  const names = NAMES.filter(([k]) => A && A.models[k]);
  if (!names.length || !list.length) return null;
  const V = names.map(([k, gray]) => modelParts(A.models[k], gray));
  const half = Math.max(...V.map((v) => v.half)) * 1.04, top = 1.03, CELL = 256, W = CELL * 4, H = CELL * 2;
  // atlas rows: variant 0 at the bottom, variant 1 on top (the shader picks one per bush); columns: yaw 0, 60, 120 deg, top view
  const yaws = [0, Math.PI / 3, (2 * Math.PI) / 3];
  const tex = bakeAtlas(renderer, V.map((v, row) => ({ parts: v.parts, half, top,
    views: yaws.map((yaw, c) => ({ yaw, rect: [c * CELL + 2, row * CELL + 2, CELL - 4, CELL - 4] })).concat([{ top: true, rect: [3 * CELL + 2, row * CELL + 2, CELL - 4, CELL - 4] }]) })), W, H, 1.15);
  const pad = 2 / CELL, uvr = (c) => [c / 4 + pad / 4, pad / 2, (c + 1) / 4 - pad / 4, 0.5 - pad / 2];       // row 0; the shader shifts v by 0.5 for variant 1
  const cards = yaws.map((yaw, c) => ({ yaw, rect: uvr(c), half, top })).concat([{ h: true, y: 0.5, half: half * 0.98, rect: uvr(3) }]);
  const geo = cardGeometry(cards, [0, 0.42, 0]);
  const SW = seasonWeights(season), autumn = SW.w[2], winter = SW.w[3], spring = SW.w[0];
  const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.88, metalness: 0, envMapIntensity: 0.25 });
  mat.name = 'sc_bush';
  const U = { uTime, uWind: WIND, uGust: WIND.gust, uSnowB: { value: Math.min(1, SW.snow * 1.3) } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'uniform float uTime; uniform float uWind; uniform float uGust;\nvarying float vUpS;\n' + sh.vertexShader
      .replace('#include <uv_vertex>', V.length < 2 ? '#include <uv_vertex>' : `#include <uv_vertex>
#ifdef USE_INSTANCING
  vMapUv.y += step(0.5, fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453)) * 0.5;
#endif`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
  vUpS = normal.y;
  {
    vec3 ip = vec3(0.0);
  #ifdef USE_INSTANCING
    ip = vec3(instanceMatrix[3][0], 0.0, instanceMatrix[3][2]);
  #endif
    float w = (0.3 + uWind * 1.2 + uGust * 1.5), ph = ip.x * 0.11 + ip.z * 0.07, k = position.y * position.y;
    transformed.x += sin(uTime * (1.6 + uWind) + ph) * 0.05 * k * w;
    transformed.z += cos(uTime * (1.3 + uWind) + ph * 1.3) * 0.035 * k * w;
  }`);
    cardFadeShader(sh, 0.12, 0.45);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSnowB; varying float vUpS;')
      .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\n  normal *= faceDirection;\n#endif')      // both faces of a card share the bush's round normal
      .replace('#include <color_fragment>', `#include <color_fragment>
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.82, 0.86, 0.92) * (0.7 + 0.3 * vUpS), uSnowB * smoothstep(0.55, 0.9, vUpS) * 0.8);`);
  };
  mat.customProgramCacheKey = () => 'sc_bush1';
  const im = new THREE.InstancedMesh(geo, mat, list.length); im.name = 'sc_bushes';
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), P = new THREE.Vector3(), S = new THREE.Vector3(), c = new THREE.Color();
  const AUT = ['#e3b23c', '#d9822b', '#c4512e', '#a83a26', '#e8c547', '#8f9a3e'].map((x) => new THREE.Color(x));
  list.forEach((b, i) => {
    const wf = b.w || 1;
    im.setMatrixAt(i, m4.compose(P.set(b.x, b.y, b.z), q.setFromAxisAngle(Y, b.ry), S.set(b.s * wf, b.s, b.s * wf)));
    const f = ((i * 0.618034) % 1), g = ((i * 0.414213) % 1);
    c.setHSL(0.24 + f * 0.08, 0.3 + g * 0.25, 0.5 + ((i * 0.7548) % 1) * 0.22);                        // olive .. fresh green, light .. dark
    c.lerp(new THREE.Color(1, 1, 1), 0.35).multiplyScalar(1.05);
    if (spring > 0.05) c.lerp(new THREE.Color(0.9, 1.15, 0.75), spring * 0.35);
    if (autumn > 0.05) c.lerp(AUT[(i * 5 + 1) % AUT.length].clone().multiplyScalar(1.45), Math.min(1, autumn * (0.35 + g * 0.75)));
    if (winter > 0.05) c.lerp(new THREE.Color(0.62, 0.6, 0.52), winter * 0.55);
    im.setColorAt(i, c);
  });
  im.castShadow = false; im.receiveShadow = true; im.computeBoundingSphere();
  scene.add(im);
  return { mesh: im, tex };
}

// One kit per world: buildForest() lists the roadside / moat bushes, scatterFlora() adds the meadow and bank shrubs and builds it once.
export const BUSH = { kit: null };
export function bushKit(renderer, A, opts) {
  const kit = {
    list: [],
    add(x, y, z, s, ry, w = 1) { kit.list.push({ x, y, z, s, ry, w }); },
    build(scene) {
      if (kit.done) return kit.res; kit.done = true;
      kit.res = renderer ? buildBushes(renderer, scene, A, kit.list, opts) : null;
      if (!kit.res && kit.list.length) {                                    // (fallback: plain round shrubs)
        const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0x3d5a2c, roughness: 1 }), kit.list.length);
        const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), P = new THREE.Vector3(), S = new THREE.Vector3();
        kit.list.forEach((b, i) => im.setMatrixAt(i, m4.compose(P.set(b.x, b.y, b.z), q.setFromAxisAngle(Y, b.ry), S.set(b.s * 0.8 * b.w, b.s * 0.5, b.s * 0.8 * b.w))));
        im.receiveShadow = true; im.name = 'sc_bushes'; scene.add(im); kit.res = { mesh: im };
      }
      return kit.res;
    },
  };
  BUSH.kit = kit;
  return kit;
}
