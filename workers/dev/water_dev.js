// water lookdev: terrain + water + town/castle walls + moat banks + water life only (no GLB models) — a fast stand-in for the full world.
// ?h=12&q=high&cam=px,py,pz,tx,ty,tz&s=3&sp=0.5&rain=1&t0=30&jump=x,z
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { Batcher } from '../bot/bluebot_v2/bluewall/client/src/util.js';
import { makeMaterials } from '../bot/bluebot_v2/bluewall/client/src/materials.js';
import { buildSky } from '../bot/bluebot_v2/bluewall/client/src/sky.js';
import { buildTerrain, buildWater } from '../bot/bluebot_v2/bluewall/client/src/terrain.js';
import { buildCastle } from '../bot/bluebot_v2/bluewall/client/src/castle.js';
import { buildMoat } from '../bot/bluebot_v2/bluewall/client/src/moat.js';
import { Flames, Pools } from '../bot/bluebot_v2/bluewall/client/src/fx.js';
import { sample, season } from '../bot/bluebot_v2/bluewall/client/src/tod.js';
import { PHTEX } from '../bot/bluebot_v2/bluewall/client/src/assets.js';
import { createReflect, tagReflected } from '../bot/bluebot_v2/bluewall/client/src/reflect.js';

(async () => {
  const U = new URLSearchParams(location.search), hour = +(U.get('h') ?? 12), q = U.get('q') || 'high';
  if (U.get('s') != null) window.__bwSeason = { s: +U.get('s'), p: +(U.get('sp') || 0.6) };
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.8, 3200);
  const c = (U.get('cam') || '152,30,108,122,-0.5,60').split(',').map(Number); camera.position.set(c[0], c[1], c[2]); camera.lookAt(c[3], c[4], c[5]);
  const tl = new THREE.TextureLoader(), ph = {};
  await Promise.all(PHTEX.map((k) => new Promise((ok) => tl.load('assets/tex/' + k + '.webp', (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = k.endsWith('_n') ? THREE.NoColorSpace : THREE.SRGBColorSpace; ph[k] = t; ok(); }, undefined, () => ok()))));
  const M = makeMaterials();
  scene.fog = new THREE.FogExp2(0x1d3159, 0.0017); scene.background = new THREE.Color(0x02040b);
  const key = new THREE.DirectionalLight(0xbfd0ff, 3.2); key.target.position.set(0, 0, 0); scene.add(key, key.target);
  const hemi = new THREE.HemisphereLight(0x6f8fd0, 0x2a3222, 1.3); scene.add(hemi);
  const sky = buildSky(scene, M, { flare: false });
  const terrain = buildTerrain(scene, M, q, ph, renderer, { season: season() });
  const water = buildWater(scene, terrain.fastHeight);
  const B = new Batcher(), flames = new Flames(), pools = new Pools();
  const Q = { level: q, shadows: false };
  const ctx = { B, M, height: terrain.height, houses: [], levelHooks: [], weaponSites: [], targets: [],
    tgt() { return 0; }, live() {}, hex() {}, towerRoof() { return null; }, pick() {}, flag() {}, flagSmall() {}, banner() {}, weapon() {}, beacon() {}, plaque() {}, crystal() {}, kit() {}, grain() {}, inst() {}, decal() {}, smokeAt() { return {}; },
    torch(x, y, z, o = {}) {
      flames.add(x, y + 0.35, z, o.big ? 2.6 : o.forge ? 3.0 : 1.5, o.forge ? [1, 0.42, 0.12] : [1, 0.62, 0.25]);
      if (o.post) { const gy = terrain.height(x, z); B.add(new THREE.CylinderGeometry(0.1, 0.14, y - gy, 6), M.wood, new THREE.Matrix4().makeTranslation(x, gy + (y - gy) / 2, z), { tint: 0x5a3a22 }); B.add(new THREE.CylinderGeometry(0.28, 0.14, 0.35, 8), M.metal, new THREE.Matrix4().makeTranslation(x, y, z)); }
      if (o.pool) pools.add(x, terrain.height(x, z) + 0.06, z, o.big ? 7.5 : o.forge ? 8 : 5.2);
    },
    pool(x, y, z, r, color, a) { pools.add(x, y, z, r, color, a); },
  };
  if (!U.get('nocastle')) buildCastle(ctx);
  const moat = buildMoat(ctx, { scene, M, Q, height: terrain.height, fastHeight: terrain.fastHeight, water });
  const statics = B.build(scene);
  flames.build(scene, M.glow); pools.build(scene, M.glow);
  tagReflected([...statics, key, hemi]);
  const refl = createReflect({ renderer, scene, camera, water, level: U.get('refl') === '0' ? 'medium' : q });
  const W = { cover: 0.15, grey: 0, fog: 1, rain: +(U.get('rain') || 0), snow: 0, wind: 0.3, flash: 0, turbidity: 0, kind: U.get('rain') ? 'rain' : 'clear' };
  let P = null;
  const setHour = (h) => {
    P = { ...sample(h) }; for (const k of Object.keys(P)) if (P[k] && P[k].clone) P[k] = P[k].clone();
    key.color.copy(P.key); key.intensity = P.keyI; key.position.copy(P.keyDir).multiplyScalar(320);
    hemi.color.copy(P.hemiSky); hemi.groundColor.copy(P.hemiGnd); hemi.intensity = P.hemiI;
    scene.fog.color.copy(P.fog); scene.fog.density = P.fogD; if (scene.background) scene.background.copy(P.fog);
    sky.setTime(P, W); water.setTime(P, W); flames.setNight(P.night); pools.setNight(Math.max(0, (P.night - 0.15) / 0.85));
    M.rune.emissiveIntensity = 0.9 + 1.7 * P.night; M.window && (M.window.emissiveIntensity = 0.15 + 2.1 * P.night);
    renderer.toneMappingExposure = P.exposure; if (window.__dev) window.__dev.P = P;
    if (U.get('bgfix') !== '0') { renderer.setClearColor(P.fog, 1); scene.background = null; }   // (= the reflect.js patch: a Color background clears the mirror opaque)
  };
  setHour(hour);
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera)); const bloom = new UnrealBloomPass(new THREE.Vector2(Math.ceil(size.x / 3), Math.ceil(size.y / 3)), P.bloom, 0.45, 1.05); composer.addPass(bloom); composer.addPass(new OutputPass());
  let t = +(U.get('t0') || 20), frames = 0, last = performance.now();
  window.__dev = { scene, camera, water, moat, P, THREE, renderer, setT: (v) => { t = v; }, setHour };
  const loop = () => {
    const now = performance.now(), dt = U.get('fixed') ? 1 / 30 : Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    water.update(t); moat.update(t, dt, camera, P); flames.update(t); pools.update(t); sky.update(t, dt, 1, camera);
    refl.update(dt);
    bloom.strength = P.bloom; if (P.night > 0.25) composer.render(); else renderer.render(scene, camera);
    window.__frames = ++frames; requestAnimationFrame(loop);
  };
  loop();
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
