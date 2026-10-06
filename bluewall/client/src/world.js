// Assembles the kingdom: lights, sky, terrain, water, castle, town, forest,
// dragon and giants. Returns update(t, dt) + pick targets.
import { pb, pe } from './prof.js';
import * as THREE from 'three';
import * as L from './layout.js';
import { Batcher, mat4 } from './util.js';
import { rng, smooth } from './noise.js';
import { makeMaterials } from './materials.js';
import { setGemEnv, jewelEnvironment } from './gemgeo.js';
import { buildSky, envSky } from './sky.js';
import { buildWeather, WIND } from './weather.js';
import { settings } from './settings.js';
import { buildFairies } from './fairies.js';
import { bannerTexture, plaqueTextures } from './textures.js';
import { tagReflected } from './reflect.js';
import { buildTerrain, buildWater, buildBackdrop, forestDensity, seasonWeights, roadPoints as ROAD_PTS } from './terrain.js';
import { roadDist as roadEdge } from './roads.js';
import { hamletD, hamlets } from './hamlets.js';
import { nomads, nomadD, keepClear, treeClear, buildNomads } from './nomads.js';
import { buildCastle } from './castle.js';
import { buildBuildings } from './buildings.js';
import { buildTown } from './town.js';
import { buildMines } from './mines.js';
import { buildMilitary } from './military.js';
import { gemBadge } from './gems.js';
import { buildArmy } from './army.js';
import { buildPatrols } from './patrol.js';
import { buildDefenses, lateDefenses } from './defense.js';
import { buildMoat } from './moat.js';
import { buildFalls } from './falls.js';
import { createLevels } from './levels.js';
import { applySkin, ENT, levelOf } from './skin.js';
import { wsD } from './worksites.js';
import { buildWorksites } from './wsbuild.js';
import { buildDefField } from './defbuild.js';
import { buildWsLife } from './wslife.js';
import { patchDestruct, initDestruct } from './destruct.js';
import { buildVaults } from './vault.js';
import { buildStores } from './stores.js';
import { buildFortDay } from './fort_day.js';
import { Flames, Pools, Flags, Particles, Decals, fireflies } from './fx.js';
import { Heraldry } from './her_flags.js';
import { buildDragon } from './dragon.js';
import { loadAssets, instance, loadLate, LATE, meadowLod } from './assets.js';
import { buildLife } from './life.js';
import { makeGroundY, bridgesFromLayout } from './nav.js';
import { buildUnits } from './units.js';
import { bakeVillage, bakePieces, livePiece } from './village.js';
import { buildWheat } from './crops.js';
import { buildTrees, TREE_TIME } from './trees.js';
import { rockKit, rockGroup, ROCKS } from './sc_rocks.js';
import { bushKit, BUSH } from './sc_bush.js';
import { groundShadows } from './sc_shadow.js';
import { planGardens, buildGardens } from './sc_farm.js';
import { grayTex } from './util.js';
import { rebakeAtlases } from './sc_cards.js';
import { season } from './tod.js';
import { T as THEME, onTheme } from './theme.js';
import { createTesla } from './tesla.js';
import { createHomeDragonlings } from './dragonling_home.js';
import { createCamp } from './camp.js';

const tick = () => new Promise((r) => requestAnimationFrame(() => r()));

export async function buildWorld(renderer, scene, Q, progress) {
  const OWN = { dragon: Q.hasDragon !== false };
  const M = makeMaterials();
  M.flag.alphaTest = 0.5;
  const A = await loadAssets((f) => progress(0.02 + f * 0.42, 'Loading models…'));
  if (L.MAP === 'day') applyFortTextures(M, A);
  // tier skins (wood / stone / iron / gold / diamond / crystal by structure level, skin.js) — must be set before anything is batched
  applySkin(M.stone, 0); applySkin(M.stoneDark, 1); applySkin(M.roof, 2); applySkin(M.gold, 3); applySkin(M.rune, 4);
  progress(0.46, 'Painting the sky…'); await tick();

  // ------------------------------------------------ lights + atmosphere (driven by tod.sample)
  const DAY = false;
  scene.fog = new THREE.FogExp2(0x1d3159, 0.0017);
  scene.background = new THREE.Color(0x02040b);
  const key = new THREE.DirectionalLight(0xbfd0ff, 3.2);
  key.position.set(-150, 230, 150); key.target.position.set(0, 0, 0);
  scene.add(key, key.target);
  if (Q.shadows) {
    key.castShadow = true;
    key.shadow.mapSize.set(Q.shadowSize, Q.shadowSize);
    const c = key.shadow.camera; c.left = -110; c.right = 110; c.top = 110; c.bottom = -110; c.near = 20; c.far = 700;
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.35;
  }
  const hemi = new THREE.HemisphereLight(0x6f8fd0, 0x2a3222, 1.3); scene.add(hemi);
  const sky = buildSky(scene, M, { flare: Q.level === 'high' || Q.level === 'ultra' });
  const pmrem = new THREE.PMREMGenerator(renderer), E = envSky(M);
  let envRT = null;
  try { setGemEnv(jewelEnvironment(pmrem)); } catch (e) { console.warn('gem env', e); }   // (one fixed jewel-box environment for every gem: see gemgeo.js)
  const refreshEnv = (P, W) => { E.sky.setTime(P, W); E.sky.update(0, 0, 1, null); const rt = pmrem.fromScene(E.scene, 0.02, 0.1, 100, { size: 128 }); scene.environment = rt.texture; if (envRT) envRT.dispose(); envRT = rt; };
  M.banner = new THREE.MeshStandardMaterial({ map: bannerTexture(), side: THREE.FrontSide, roughness: 1, alphaTest: 0.5, emissive: 0x0d2a5c, emissiveIntensity: 0.3 });
  progress(0.5, 'Raising the mountains…'); await tick();

  const terrain = buildTerrain(scene, M, Q.level, A.ph, renderer, { season: season(), theme: THEME.grass });
  const height = terrain.height;
  const water = buildWater(scene, terrain.fastHeight);
  water.setTheme(THEME.water);
  const backdrop = buildBackdrop(scene);
  const thunderQ = [];
  const weather = buildWeather(scene, { height: terrain.fastHeight, quality: Q.level, onThunder: (e) => { if (thunderQ.length < 6) thunderQ.push(e); }, season: () => season().s, hour: () => (lastP ? lastP.hour : 12) });
  progress(0.6, 'Laying the Blue Wall…'); await tick();

  // ------------------------------------------------ builders' context
  const B = new Batcher(), flames = new Flames(), pools = new Pools(), flags = new Heraldry(B, M), decals = new Decals();   // (her_flags.js: all the castle's cloth + the gate plaque)
  const picks = [], lights = [], smokers = [], anim = [];
  let lightBudget = Q.lights;
  const kitList = { hex: [], village: [], grain: [], troof: [[], []] }, instLists = {}, TROOF = [];
  const pieceM = (x, y, z, ry, s) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(s, s, s));
  const liveBy = new Map(), downSaved = [];
  const ctx = { levelHooks: [],
    weaponSites: [],
    // battle targets (castle.js, vault.js, ...): every destructible structure registers its footprint and tags the next batched pieces with its id
    targets: [],
    tgt(t) { const id = ctx.targets.length + 1; ctx.targets.push({ id, ...t }); B.bid(id); return id; },
    // loose meshes that belong to the structure being built (a vault's crown gem, a mine's machine ...): they vanish when it collapses (targetDown)
    live(...objs) { const id = B.tagB; if (!id) return; let a = liveBy.get(id); if (!a) liveBy.set(id, a = []); for (const o of objs) if (o) a.push(o); },
    B, M, height, houses: [],
    hex(name, x, y, z, ry, s) { kitList.hex.push({ name, matrix: pieceM(x, y, z, ry, s) }); },
    // round tower roof from the village kit (blue-tinted tiles); returns the tip height
    towerRoof(x, y, z, radius, i) {
      if (!A.models.kit_village) return null;
      const sc = radius / 2.8, sy = sc * 1.18;
      kitList.troof[i % 2].push({ name: 'Roof_Tower_RoundTiles', bid: B.tagB, matrix: new THREE.Matrix4().compose(new THREE.Vector3(x, y + 0.45 * sy, z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (x * 7 + z * 3) % 6.28), new THREE.Vector3(sc, sy, sc)) });
      return y + 0.45 * sy + 6.79 * sy;
    },
    grain(x, y, z, ry, s) { kitList.grain.push({ name: 'building_grain', matrix: pieceM(x, y, z, ry, s), bid: B.tagB }); },
    kit(name, x, y, z, ry, s) { kitList.village.push({ name, matrix: pieceM(x, y, z, ry, s), bid: B.tagB }); },
    inst(name, x, z, ry, s) { (instLists[name] = instLists[name] || []).push(pieceM(x, height(x, z), z, ry, s)); },
    liveWindmill(x, y, z, ry, s) {
      const o = A.models.kit_hex && livePiece(A.models.kit_hex, 'building_windmill_blue'); if (!o) return;
      o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); scene.add(o); ctx.liveWM = o;
      const fan = o.getObjectByName('building_windmill_top_fan_blue');
      if (fan) anim.push((t, dt) => { fan.rotation.z -= dt * 0.7; });
    },
    pick(b, id) { picks.push({ id, box: new THREE.Box3(new THREE.Vector3(b.x - b.r, b.y0, b.z - b.r), new THREE.Vector3(b.x + b.r, b.y1, b.z + b.r)) }); },
    torch(x, y, z, o = {}) {
      flames.add(x, y + 0.35, z, o.big ? 2.6 : o.forge ? 3.0 : 1.5, o.forge ? [1, 0.42, 0.12] : [1, 0.62, 0.25], B.tagB);
      if (o.post) {
        const gy = height(x, z);
        B.add(new THREE.CylinderGeometry(0.1, 0.14, y - gy, 6), M.wood, mat4(x, gy + (y - gy) / 2, z), { tint: 0x5a3a22 });
        B.add(new THREE.CylinderGeometry(0.28, 0.14, 0.35, 8), M.metal, mat4(x, y, z));
      }
      if (o.sconce) B.add(new THREE.BoxGeometry(0.25, 0.7, 0.25), M.metal, mat4(x, y - 0.25, z, o.ry || 0));
      if (o.pool) pools.add(x, height(x, z) + 0.06, z, o.big ? 7.5 : o.forge ? 8 : 5.2);
      if (o.light && lightBudget > 0) {
        lightBudget--;
        const l = new THREE.PointLight(o.forge ? 0xff7a2a : 0xff9a45, o.big ? 180 : 120, o.big ? 30 : 24, 1.8);
        l.position.set(x, y + 1.2, z); scene.add(l); lights.push({ l, base: l.intensity, seed: Math.random() * 10 });
      }
    },
    pool(x, y, z, r, color, a) { pools.add(x, y, z, r, color, a); },
    decal(x, z, r, a = 0.4) { decals.add(x, height(x, z) + 0.05, z, r, a); },
    flag(x, y, z, ry, s = 1) { flags.add(x, y, z, ry, s, B.tagB); },
    flagSmall(x, y, z, ry) { flags.add(x, y, z, ry, 0.45, B.tagB); },
    banner(x, y, z, ry, w, h, o) { flags.banner(x, y, z, ry, w, h, B.tagB, o); },     // waving cloth (her_flags.js); o.tapestry: it hangs against a wall
    weapon(x, y, z, a, kind, R) { ctx.weaponSites.push({ x, y, z, a, r: R, tid: B.tagB, kind: kind === 'cannon' ? 'cannon' : kind === 'quad' ? 'quad' : kind === 'wizard' ? 'wizard' : kind === 'frost' ? 'frost' : kind === 'flame' ? 'flame' : kind === 'dragonbane' ? 'dragonbane' : 'ballista', wk: kind || null }); },   // ballistas are built after the first frame (ballista.js)
    beacon(x, y, z) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 2.2, 4.0), toneMapped: false }));
      orb.position.set(x, y + 1.4, z); scene.add(orb);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowBlue, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }));
      glow.position.copy(orb.position); glow.scale.setScalar(16); scene.add(glow);
      anim.push((t) => { const k = 0.8 + 0.2 * Math.sin(t * 2.1); glow.scale.setScalar(14 + 4 * k); glow.material.opacity = 0.6 + 0.3 * k; });
      ctx.live(orb, glow);
    },
    crystal(x, y, z) {
      const g = new THREE.OctahedronGeometry(1.6, 0); g.scale(1, 1.9, 1);
      const cr = new THREE.Mesh(g, M.crystal); cr.position.set(x, y, z); cr.castShadow = false; scene.add(cr);
      const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0).scale(1, 1.9, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 2.6, 4.2), toneMapped: false }));
      cr.add(inner);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowBlue, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 }));
      glow.position.set(x, y, z); glow.scale.setScalar(14); scene.add(glow);
      // light beam into the sky
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.8, 90, 20, 1, true), new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 } },
        vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vD; void main(){ vUv = uv; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); vD = -mv.z; gl_Position = projectionMatrix*mv; }',
        fragmentShader: 'uniform float uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vD; void main(){ float edge = pow(abs(dot(vN, vV)), 1.5); float fade = pow(1.0 - vUv.y, 1.6); float wave = 0.75 + 0.25*sin(vUv.y*40.0 - uTime*3.0); float a = edge*fade*wave*0.42*smoothstep(12.0, 90.0, vD); gl_FragColor = vec4(vec3(0.35,0.7,1.0)*a, a); }',
      }));
      beam.position.set(x, y + 45, z); scene.add(beam); ctx.beam = beam;
      let pl = null;
      if (lightBudget > 0) { lightBudget--; pl = new THREE.PointLight(0x4aa8ff, 260, 40, 1.6); pl.position.set(x, y + 1, z); scene.add(pl); }
      const sparks = new Particles(scene, { count: 160, tex: M.glowBlue, color: [0.5, 0.85, 1.4] });
      let acc = 0;
      anim.push((t, dt) => {
        cr.rotation.y = t * 0.6; cr.position.y = y + Math.sin(t * 1.3) * 0.45;
        const k = 0.85 + 0.15 * Math.sin(t * 2.4);
        glow.scale.setScalar(12 + 5 * k); if (pl) pl.intensity = 220 + 80 * k;
        beam.material.uniforms.uTime.value = t;
        acc += dt;
        while (acc > 0.05) { acc -= 0.05; const a = Math.random() * 6.28, d = 1 + Math.random() * 5; sparks.emit(x + Math.cos(a) * d, 0.6, z + Math.sin(a) * d, 0, 1.6 + Math.random() * 2, 0, 3.5, 0.5 + Math.random() * 0.4, 0, 0.9); }
        sparks.update(dt, 0.995, 0.4);
      });
    },
    windmill(x, y, z, ry) {
      const hub = new THREE.Group(); hub.position.set(x, y, z); hub.rotation.y = ry; scene.add(hub);
      const rot = new THREE.Group(); rot.position.z = 3.3; hub.add(rot);
      const wm = M.wood.clone(); wm.vertexColors = false; wm.color.set(0x8a6a48);
      const sail = new THREE.MeshStandardMaterial({ color: 0xd9cfb8, roughness: 1, side: THREE.DoubleSide });
      for (let k = 0; k < 4; k++) {
        const arm = new THREE.Group(); arm.rotation.z = k * Math.PI / 2; rot.add(arm);
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 9.5, 0.3), wm); beam.position.y = 4.8; arm.add(beam);
        const s = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 7.2), sail); s.position.set(1.1, 5.4, 0.05); arm.add(s);
        beam.castShadow = s.castShadow = true;
      }
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), wm); rot.add(cap);
      anim.push((t, dt) => { rot.rotation.z -= dt * 0.55; });
    },
    smokeAt(x, y, z, heavy = false) { const s = { x, y, z, heavy, acc: Math.random(), off: false }; smokers.push(s); return s; },
    plaque(x, y, z, face, w, h) { M.plaqueMat = flags.plaque(x, y, z, face, w, h, B.tagB); },    // the realm's name over the gate (her_flags.setGateName)
  };

  if (DAY) {
    buildFortDay(ctx);
    progress(0.7, 'Building the town…'); await tick();
  } else {
    buildCastle(ctx);
    progress(0.7, 'Building the town…'); await tick();
    buildBuildings(ctx);
    ctx.town = buildTown(ctx, A, Q, scene);
    ctx.mines = buildMines(ctx, A, Q, scene, anim);
    ctx.military = buildMilitary(ctx, { scene, A, Q });
  }
  const badges = [];
  for (const m of (ctx.mines ? ctx.mines.list : [])) {
    const b = gemBadge(m.id); b.position.copy(m.top); scene.add(b); badges.push({ id: m.id, sprite: b, y: m.top.y });
  }
  anim.push((t) => { for (const [i, b] of badges.entries()) b.sprite.position.y = b.y + Math.sin(t * 1.8 + i) * 0.6; });
  // ctx.levelHooks (filled by mines / vaults): (n) => … callbacks run when a level changes
  buildDefenses(ctx);
  const vaults = buildVaults(ctx, { scene, M, Q, A, height }) || { setFill() {}, update() {}, list: [] };
  const stores = buildStores(ctx, { M, height }) || { list: [], setFill() {} };            // p38: wood / stone / iron / gold / oil / food storehouses
  const moat = buildMoat(ctx, { scene, M, Q, A, height, fastHeight: terrain.fastHeight, water }) || { update() {} };
  const falls = buildFalls({ scene, fh: terrain.fastHeight || height }) || { update() {} };
  // the houses of the town: clusters of ~26 m cells become destructible targets (the whole block crumbles together)
  { const cell = 26, map = new Map();
    for (const h of ctx.houses) { const k = Math.floor(h.x / cell) + ',' + Math.floor(h.z / cell); if (!map.has(k)) map.set(k, []); map.get(k).push(h); }
    for (const arr of map.values()) {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, hy = 0; for (const h of arr) { x0 = Math.min(x0, h.x); x1 = Math.max(x1, h.x); z0 = Math.min(z0, h.z); z1 = Math.max(z1, h.z); hy = Math.max(hy, (h.floors || 2)); }
      const id = ctx.tgt({ type: 'house', x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0 + 9, d: z1 - z0 + 9, h: 5 + hy * 3.2, rot: 0, n: arr.length, share: +(0.5 + 0.16 * arr.length).toFixed(2) });
      for (const h of arr) h.tid = id;
    }
    B.bid(0); }
  const staticMeshes = B.build(scene);
  if (Q.level === 'high' || Q.level === 'ultra') tagReflected([...staticMeshes, key, hemi]);   // what the moat mirrors (reflect.js)
  { const seen = new Set(); for (const m of staticMeshes) if (!seen.has(m.material)) { seen.add(m.material); patchDestruct(m.material); } initDestruct(ctx.targets, terrain.fastHeight || height); }   // (the battle collapses the tagged structures of the home map: destruct.js)
  // real kit houses + farm pieces, each kit baked into one mesh per material
  let glass = null;
  if (A.models.kit_village) {
    const v = bakeVillage(scene, A.models.kit_village, ctx.houses, { shadows: !!Q.shadows });
    glass = v.glass;
    if (glass) { glass.emissive = new THREE.Color(0xffa24a); glass.emissiveIntensity = 0; glass.transparent = false; glass.opacity = 1; glass.color.set(0x2a3340); glass.roughness = 0.2; glass.metalness = 0.1; }
    for (const c of v.chimneys) if (Math.random() < 0.7) ctx.smokeAt(c.x, c.y, c.z);
    if (kitList.village.length) bakePieces(scene, A.models.kit_village, kitList.village, { shadows: !!Q.shadows, tag: 'props' });
    kitList.troof.forEach((list, k) => {
      if (!list.length) return;
      const tr = bakePieces(scene, A.models.kit_village, list, { shadows: !!Q.shadows, tag: 'troof' + k });
      for (const m of tr.meshes) if (/Tiles/.test(m.material.name) && (TROOF.push(m) || true)) {
        m.material = m.material.clone(); m.material.map = grayTex(m.material.map);
        m.material.color.setRGB(k ? 0.42 : 0.34, k ? 0.6 : 0.52, k ? 1.25 : 1.1);
        applySkin(m.material, 2, ENT.wall);
      }
    });
    // p37 (owner 6 Oct 12:06, «لول مکس همه چیز آبی»): at the top levels the kit houses (barracks, treasury, the homes on the plaza) get the towers' blue slate roofs; lower down they keep the kit's terracotta
    {
      const rm = v.meshes.filter((m) => /Tiles/.test(m.material.name)).map((m) => ({ mt: m.material, orig: m.material.map, gray: grayTex(m.material.map) }));
      const paint = (Tt) => { const blue = Tt.level >= 29; for (const r of rm) { r.mt.map = blue ? r.gray : r.orig; if (blue) r.mt.color.setRGB(0.34, 0.52, 1.1); else r.mt.color.setRGB(1, 1, 1); r.mt.needsUpdate = true; } };
      paint(THEME); onTheme(paint);
    }
  }
  if (A.models.kit_hex && kitList.hex.length) bakePieces(scene, A.models.kit_hex, kitList.hex, { shadows: !!Q.shadows, tag: 'hex' });
  if (A.models.kit_hex && kitList.grain.length) {
    const gr = bakePieces(scene, A.models.kit_hex, kitList.grain, { shadows: false, tag: 'grain' });
    for (const m of gr.meshes) { m.material = m.material.clone(); m.material.color.setRGB(0.78, 0.6, 0.32); m.material.roughness = 1; }
  }
  // nomad camps (nomads.js): every tent, rug and hearth ring is one merged mesh; the fires, glow pools, smoke and a few barrels / crates reuse what exists
  const nomadMesh = (() => {
    const nb = buildNomads(scene, terrain.fastHeight, { shadows: !!Q.shadows }); if (!nb) return null;
    for (const C of nomads()) {
      const y = terrain.fastHeight(C.x, C.z); flames.add(C.x, y + 0.4, C.z, 1.5, [1, 0.58, 0.22]); pools.add(C.x, y + 0.06, C.z, 5.5); ctx.smokeAt(C.x, y + 1.3, C.z);
      for (const q of C.props) ctx.inst(q.k, q.x, q.z, q.ry, q.s);
    }
    return nb.mesh;
  })();
  for (const [k, list] of Object.entries(instLists)) instance(scene, A.models[k], list, { cast: !!Q.shadows });
  { // wheat: green in spring, golden in summer, harvested (stubble + hay) in autumn and winter
    const S = season();
    if (S.s === 0 || S.s === 1 || (S.s === 2 && S.p < 0.12)) {
      L.FARMS.forEach((F, fi) => {
        const plot = fi === 0 ? 0 : 4, cx = plot % 3, cy = Math.floor(plot / 3), pw = F.w / 3, pd = F.d / 2;
        const ox = -F.w / 2 + cx * pw + pw / 2, oz = -F.d / 2 + cy * pd + pd / 2;
        const wheat = buildWheat(scene, { x: F.x + ox * Math.cos(F.rot) + oz * Math.sin(F.rot), z: F.z - ox * Math.sin(F.rot) + oz * Math.cos(F.rot), rot: F.rot, w: pw - 4, d: pd - 4, height,
          scale: Q.level === 'low' ? 1.8 : 1.4, step: 0.55, rows: 0.75, green: S.s === 0 ? 1 - S.p : 0 });
        anim.push((t) => wheat.update(t));
      });
    }
  }
  flames.build(scene, M.glow); pools.build(scene, M.glow); flags.build(scene, M.flag); decals.build(scene, M.glowWhite);
  if (DAY) { flames.points.visible = false; pools.mesh && (pools.mesh.visible = false); }
  // winter: snow settles on roofs, wall walks and merlons (any upward-facing surface)
  {
    const SWs = seasonWeights(season()), amt = Math.min(1, SWs.snow * 1.4);
    if (amt > 0.05) {
      const mats = new Set([M.roof, M.stone, M.stoneDark, M.wood]);
      if (ctx.town && ctx.town.mats) for (const k of ['roof', 'stone', 'brick', 'plaster']) mats.add(ctx.town.mats[k]);
      scene.traverse((o) => { if (o.isMesh && o.material && /RoundTiles|RockTrim|hexagons/.test(o.material.name || '')) mats.add(o.material); });
      for (const m of mats) snowify(m, amt);
    }
  }
  progress(0.78, 'Planting the forest…'); await tick();

  // ------------------------------------------------ forest, rocks, bushes
  const nScene0 = scene.children.length;
  const forest = buildForest(scene, height, Q, ctx.innerTrees || [], DAY, A, renderer);
  scatterFlora(scene, height, Q, A, DAY, moat.shore);
  // every tree / bush / rock / flower / blade of grass is an instance of one of these: a battle clears the ground where the army stands (clearZones)
  const scatter = []; for (let i = nScene0; i < scene.children.length; i++) scene.children[i].traverse((c) => { if (c.isInstancedMesh) scatter.push(c); });
  const zoneSaved = [];
  const smoke = new Particles(scene, { count: 420, tex: M.glowWhite, blending: THREE.NormalBlending, color: DAY ? [0.92, 0.93, 0.95] : [0.16, 0.18, 0.24] });
  const embers = new Particles(scene, { count: 240, tex: M.glow, color: [1.4, 0.6, 0.2] });
  const dust = new Particles(scene, { count: 200, tex: M.glowWhite, blending: THREE.NormalBlending, color: [0.3, 0.27, 0.22] });
  const ffly = DAY ? { update() {} } : fireflies(scene, M.glow, forest.edges, height);
  progress(0.86, 'Waking the army…'); await tick();

  // ------------------------------------------------ dragon + giants
  const breath = new Particles(scene, { count: 900, tex: M.glowBlue, color: [0.55, 1.1, 2.2] });
  let dragon = buildDragon(scene, M, breath, Q.level, DAY);
  dragon.s = dragon.curve.getLength() * 0.62;
  const shakeReq = { v: 0 };
  const onSlam = (root) => {
    const p = new THREE.Vector3(0, 0, 6).applyQuaternion(root.quaternion).add(root.position);
    for (let k = 0; k < 26; k++) { const a = Math.random() * 6.28, sp = 2 + Math.random() * 5; dust.emit(p.x, p.y + 0.4, p.z, Math.cos(a) * sp, 1 + Math.random() * 2.5, Math.sin(a) * sp, 1.6 + Math.random(), 2.5 + Math.random() * 2, 2.2, 0.7); }
    shakeReq.v = Math.max(shakeReq.v, 0.5); shakeReq.at = p.clone();
  };
  const fairies = buildFairies(scene, M, [[L.PLAZA.x, 1.5, L.PLAZA.z, 6, 9], [L.LAKE.x + 20, 0.5, L.LAKE.z - 10, 4, 14], [L.PASTURE.x - 40, 1, L.PASTURE.z - 10, 3, 12]]);
  const units = buildUnits(scene, A, terrain.fastHeight, { wallTop: DAY ? 7.75 : 9.6, onSlam,
    workSpots: DAY ? [[6, -20], [22, -10], [-20, -2], [16, 16], [-12, 22], [4, 12]] : [[14, -4], [28, -18], [-10, 20], [20, 24], [-28, 18], [4, 20]] });

  const patrols = buildPatrols(scene, A, { density: Q.level === 'low' ? 0.5 : 1, sites: ctx.weaponSites });

  progress(0.95, 'Lighting the torches…'); await tick();

  // ------------------------------------------------ update
  const tmpV = new THREE.Vector3();
  let bat = null;                                                  // attack mode state (setBattle)
  let lodT = -9, mlodT = -9, world_keepClear = 0;
  function update(t, dt, camera) {
    pb();
    weather.update(t, dt, camera); pe('weather');
    if (camera && t - mlodT > 0.3) { mlodT = t; meadowLod(camera); }
    sky.update(t, dt, renderer.getPixelRatio(), camera); pe('sky');
    water.update(t); pe('water');
    flames.update(t); pools.update(t); flags.update(t); ffly.update(t); fairies.update(t, dt); pe('flames+fairies');
    if (forest.ez) {
      forest.ez.update(t);
      if (forest.ez.lod && !bat && t - lodT > 0.5) {      // the pool of real trees follows the ground point the camera looks at (home only: a battle freezes it)
        lodT = t; camera.getWorldDirection(tmpV);
        const k = tmpV.y < -0.05 ? Math.min(700, -camera.position.y / tmpV.y) : 80;
        forest.ez.lod.tick(camera.position.x + tmpV.x * k, camera.position.z + tmpV.z * k);
      }
    }
    pe('forest');
    M.rune.emissiveIntensity = TS.rune * LV.rune * (0.85 + 0.15 * Math.sin(t * 1.1));
    M.runeTex.offset.x = t * 0.015;
    for (const f of anim) f(t, dt);
    pe('anim');
    for (const L2 of lights) L2.l.intensity = L2.base * TS.lamps * (0.82 + 0.1 * Math.sin(t * 13 + L2.seed) + 0.08 * Math.sin(t * 23.7 + L2.seed * 2));
    for (const s of smokers) {
      if (s.off) continue;
      s.acc += dt * (s.heavy ? 5 : 2.2);
      while (s.acc > 1) {
        s.acc -= 1;
        smoke.emit(s.x + (Math.random() - 0.5) * 0.4, s.y, s.z + (Math.random() - 0.5) * 0.4, 0.5 + Math.random() * 0.4, 1.4 + Math.random() * 0.8, 0.2 + Math.random() * 0.3, 5 + Math.random() * 2, s.heavy ? 1.8 : 1.3, 3.2, s.heavy ? 0.5 : 0.35);
        if (s.heavy && Math.random() < 0.6) embers.emit(s.x, s.y - 1, s.z, (Math.random() - 0.5) * 1.2, 2.5 + Math.random() * 2, (Math.random() - 0.5) * 1.2, 1.4 + Math.random(), 0.35, 0, 1);
      }
    }
    pe('lamps+smokers');
    smoke.update(dt, 0.995, 0.08); embers.update(dt, 0.99, 0.2); dust.update(dt, 0.95, -0.4); breath.update(dt, 0.965, 3.2); pe('particles');
    if (dragon.root.visible) dragon.update(t, dt);
    pe('dragon');
    if (!bat) { units.update(dt); patrols && patrols.update(t, dt, camera); }
    pe('units+patrols');
    lateTick(); pe('lateTick');
    if (!bat) { if (campHome) campHome.update(t); life.update(t, dt, lastP, camera); pe('life'); army.update(t, dt, camera, lastP); pe('army'); }
    if (tesla) { tesla.update(t, dt); if (extras.ballistas && !extras.ballistas.__ts) { extras.ballistas.__ts = 1; syncWeapons(); } }
    if (dlings) dlings.update(t, dt, camera);
    pe('tesla+dlings');
    extras.update(t, dt, camera, lastP); pe('extras'); if (worksites) worksites.update(t, camera); if (defField) defField.update(t, camera); if (wsLife) wsLife.update(t, dt, camera); moat.update(t, dt, camera, lastP); pe('moat'); falls.update(t, dt, camera, lastP); levels.update(t, dt); vaults.update(t, dt, camera, lastP); pe('falls+levels+vaults');
    if (shakeReq.v > 0 && camera) {
      const d = camera.position.distanceTo(shakeReq.at || tmpV.set(0, 0, 0));
      shakeReq.out = shakeReq.v * Math.max(0, 1 - d / 160); shakeReq.v = Math.max(0, shakeReq.v - dt * 1.6);
    } else shakeReq.out = 0;
  }
  // ------------------------------------------------ time of day
  const TS = { rune: 2.4, lamps: 1, envAt: -1e9, envHour: -99, envCover: 0 };
  // p35 P9: a new castle level changes the mood: meadow + water now, light / sky / fog with the next sample, the reflections within a moment (houses get their colours when the town is built)
  onTheme((T) => { water.setTheme(T.water); if (terrain.bake && terrain.bake.setTheme) terrain.bake.setTheme(T.grass); TS.envAt = -1e9; TS.envHour = -99; });
  const GREY = new THREE.Color();
  function setTime(P, now) {
    lastP = P;
    const W = weather.W;
    key.color.copy(P.key); key.intensity = P.keyI * (1 - 0.78 * Math.pow(W.cover, 1.7)); key.position.copy(P.keyDir).multiplyScalar(320).add(key.target.position);
    hemi.color.copy(P.hemiSky).lerp(GREY.copy(P.fog).multiplyScalar(1.2), W.grey * 0.6); hemi.groundColor.copy(P.hemiGnd);
    hemi.intensity = P.hemiI * (1 - 0.2 * W.cover) + W.flash * 2.5;
    const fl = (P.fog.r + P.fog.g + P.fog.b) / 3;
    scene.fog.color.copy(P.fog).lerp(GREY.setRGB(fl * 1.05, fl * 1.08, fl * 1.15), W.grey);
    scene.fog.density = P.fogD * W.fog / (+settings.viewDist || 1); scene.background.copy(scene.fog.color);
    sky.setTime(P, W); water.setTime(P, W); weather.setLight(P); if (W.fog > 1.01) { water.mesh.material.uniforms.uFogCol.value.copy(scene.fog.color); water.mesh.material.uniforms.uFogD.value = scene.fog.density; }
    const n = P.night;
    M.window.emissiveIntensity = 0.15 + 2.1 * n;
    if (glass) glass.emissiveIntensity = 0.05 + 2.6 * n;
    TS.rune = 0.9 + 1.7 * n; TS.lamps = Math.max(0, (n - 0.15) / 0.85);
    flames.setNight(n); pools.setNight(TS.lamps); ffly.setNight && ffly.setNight(n); fairies.setNight(n);
    if (ctx.mines) ctx.mines.setNight(n);
    if (M.plaqueMat) M.plaqueMat.emissiveIntensity = 0.35 + 1.2 * n;
    let dh = Math.abs(P.hour - TS.envHour); dh = Math.min(dh, 24 - dh);
    if ((dh > 0.4 || Math.abs(W.cover - TS.envCover) > 0.12) && now - TS.envAt > 8000) { refreshEnv(P, W); TS.envAt = now; TS.envHour = P.hour; TS.envCover = W.cover; }
  }

  progress(1, 'Ready!');
  const gv = new THREE.Vector3();
  const creatures = [{ id: 'dragon', r: 10, center: () => dragon.position },
    ...units.giants.map((g) => ({ id: 'giant', unit: true, r: 6.5, center: () => gv.set(g.position.x, g.position.y + 8, g.position.z) }))];
  // ------------------------------------------------ life (streamed after the first frame)
  // Late content is built into hidden buckets (one per model) inside `stage`. main.js then compiles every shader in the
  // background and reveals the buckets one per frame, so nothing compiles or uploads in the middle of a visible frame.
  let lastP = null;
  const stage = new THREE.Group(); stage.name = 'late-stage'; scene.add(stage);
  let curDefers = null;                                  // swaps that must happen exactly when the new model becomes visible
  const defer = (f) => { if (curDefers) curDefers.push(f); else f(); };
  const swapDragon = (d) => defer(() => { scene.remove(dragon.root); d.s = dragon.s; dragon = d; dragon.root.visible = OWN.dragon; });
  // what the walkers stand on: the terrain, or the bridge deck while they cross a moat / the river (else they sink into the water under the bridge)
  const deck = makeGroundY(bridgesFromLayout(L)), walkY = (x, z) => deck(x, z, terrain.fastHeight(x, z));
  const life = buildLife(stage, terrain.fastHeight, Q, {
    walkY, person: (k, sc) => units.make(k, sc), picks, creatures, breath, dragonCurve: dragon.curve, birds: () => (weather.W.kind === 'clear' || weather.W.kind === 'cloudy') && weather.W.rain < 0.05, dragonsOn: () => OWN.dragon,
    setDragon: swapDragon,
    hideGiants() { defer(() => { for (const g of units.giants) g.visible = false; for (let i = creatures.length - 1; i >= 0; i--) if (creatures[i].unit) creatures.splice(i, 1); }); },
    hideWindmill() { defer(() => { if (ctx.liveWM) ctx.liveWM.visible = false; }); },
    slam: onSlam, smoke: (x, y, z, heavy) => ctx.smokeAt(x, y, z, heavy),
  });
  const events = { onBallista: null };                  // main.js hooks sounds here
  let army = { update() {} }, extras = { update() {} };
  const lateApi = (bucket) => ({ scene: bucket, height: terrain.fastHeight, walkY, Q, picks, creatures, ctx, weather, breath, dragonCurve: dragon.curve, life, M, A,
    setDragon: swapDragon, own: OWN, defer, onFire: (x, y, z, kind) => { if (events.onBallista) events.onBallista(x, y, z, kind); } });
  const buildQ = [], revealQ = [], DEVLOG = !!(Q.dev);
  let lateP = null, lateDone = null, loadDone = false, lateStep = 0, lateBudget = 6, lateBuilt = 0;
  const bucketFor = (name) => { const b = new THREE.Group(); b.name = 'late:' + name; b.visible = false; stage.add(b); return b; };
  function buildOne(n, g) {
    const defers = []; curDefers = defers; const t0 = performance.now(); let b = null;
    try { b = life.add(n, g); } catch (e) { console.warn('late', n, e); }
    curDefers = null;
    if (b) revealQ.push({ b, defers });
    lateBuilt++;
    if (DEVLOG) console.info('[late] build ' + n + ' ' + (performance.now() - t0).toFixed(1) + 'ms');
  }
  // after the models: army + extra defenses, each into its own hidden bucket
  let worksites = null, wsLife = null, wsLifeSteps = null, defField = null;
  const lateJobs = [
    // p38: the worksites (wood, stone, iron, gold, oil, farm, livestock, fisheries, slaughterhouse, greenhouse) — one hidden bucket, revealed like the rest
    // p38: the traps and the defensive buildings in front of the gates (defplan.js / defbuild.js)
    () => { const b = bucketFor('deffield'); const defers = []; curDefers = defers; try { defField = buildDefField(b, A.models.kit_def, terrain.fastHeight, { shadows: !!Q.shadows, level: levelOf('keep') || 30 }); ctx.levelHooks.push(() => { if (defField) defField.rebuild(levelOf('keep') || 30); }); } catch (e) { console.warn('deffield', e); } curDefers = null; revealQ.push({ b, defers }); },
    () => { const b = bucketFor('worksites'); const defers = []; curDefers = defers; try { worksites = buildWorksites(b, A.models.kit_ws, terrain.fastHeight, { shadows: !!Q.shadows, castle: levelOf('keep') || 30 }); ctx.levelHooks.push(() => { if (worksites) worksites.rebuild(levelOf('keep') || 30); }); } catch (e) { console.warn('worksites', e); } curDefers = null; revealQ.push({ b, defers }); },
    // p38: the people, animals, boats and carts of the worksites (wslife.js) — the crowds are created in pieces, one late job each, so no frame stalls
    () => {
      const b = bucketFor('wslife'); const defers = []; curDefers = defers;
      try {
        const cm = (g) => { let m = null; g && g.scene.traverse((o) => { if (!m && o.isMesh && o.material && o.material.name !== 'Tack' && o.material.map) m = o.material.map; }); return m; };
        const M2 = A.models; wsLife = buildWsLife(b, terrain.fastHeight, { models: { peasant_m: M2.peasant_m, peasant_f: M2.peasant_f, anims: M2.anims, cow: M2.cow, horse: M2.horse_m2m_bay }, coats: [cm(M2.horse_m2m_black), cm(M2.horse_m2m_grey)], sheep: M2.an_sheep, pig: M2.an_pig, kit: M2.kit_ws, shadows: !!Q.shadows, castle: levelOf('keep') || 30 });
        wsLifeSteps = wsLife.steps.slice(); ctx.levelHooks.push(() => { if (wsLife) wsLife.refresh(levelOf('keep') || 30); });
      } catch (e) { console.warn('wslife', e); wsLife = null; }
      curDefers = null; revealQ.push({ b, defers });
    },
    () => { if (wsLifeSteps && wsLifeSteps.length) try { wsLifeSteps.shift()(); } catch (e) { console.warn('wslife step', e); } },
    () => { if (wsLifeSteps && wsLifeSteps.length) try { wsLifeSteps.shift()(); } catch (e) { console.warn('wslife step', e); } },
    () => { if (wsLifeSteps && wsLifeSteps.length) try { wsLifeSteps.shift()(); } catch (e) { console.warn('wslife step', e); } },
    () => { while (wsLifeSteps && wsLifeSteps.length) try { wsLifeSteps.shift()(); } catch (e) { console.warn('wslife step', e); } },
    () => { const b = bucketFor('army'); const defers = []; curDefers = defers; try { const la = lateApi(b); la.armyLv = armyLv; army = buildArmy(la) || army; if (armyLv && army.setTiers) army.setTiers(armyLv); } catch (e) { console.warn('army', e); } curDefers = null; revealQ.push({ b, defers }); },
    () => { const b = bucketFor('defenses'); const defers = []; curDefers = defers; try { extras = lateDefenses(lateApi(b)) || extras; } catch (e) { console.warn('defenses', e); } curDefers = null; revealQ.push({ b, defers }); },
  ];
  // called every frame from update(): at most ~6 ms of late building per frame
  function lateTick() {
    if (!lateP) return;
    if (buildQ.length) {
      const t0 = performance.now();
      do { const [n, g] = buildQ.shift(); buildOne(n, g); } while (buildQ.length && performance.now() - t0 < lateBudget);
    } else if (loadDone && lateStep < lateJobs.length) {
      const t0 = performance.now(); lateJobs[lateStep++](); if (DEVLOG) console.info('[late] job ' + lateStep + ' ' + (performance.now() - t0).toFixed(1) + 'ms');
    } else if (loadDone && lateDone) { const r = lateDone; lateDone = null; r(); }
  }
  // resolves when every late model is loaded and built (still hidden)
  function startLate() {
    if (lateP) return lateP;
    lateP = new Promise((res) => { lateDone = res; });
    loadLate(A, LATE, (n, g) => buildQ.push([n, g])).then(() => { loadDone = true; });
    return lateP;
  }
  // 0..1 progress of loading + building the late content; the budget (ms per frame) is raised while the loading screen is up
  const lateProgress = () => Math.min(1, (lateBuilt + lateStep) / (LATE.length + lateJobs.length));
  const setLateBudget = (ms) => { lateBudget = ms; };
  // make the next `n` buckets visible; returns how many are still hidden
  function revealLate(n = 1) {
    for (let i = 0; i < n && revealQ.length; i++) { const r = revealQ.shift(); r.b.visible = true; for (const f of r.defers) { try { f(); } catch (e) { console.warn('reveal', e); } } }
    return revealQ.length;
  }
  // ------------------------------------------------ castle & town evolution with the level (levels.js)
  const levels = createLevels({ scene, M, ctx, TROOF, flags, town: ctx.town, mines: ctx.mines, Q });
  const LV = levels.LV, setLevel = (n) => levels.setLevel(n);
  setLevel(Q.level0 || 20);
  // owned creatures (dragons for players who have one — the owner does for now)
  function setOption(k, v) {
    if (k === 'level') setLevel(v);
    if (k === 'dragon') { OWN.dragon = !!v; if (dragon.root) dragon.root.visible = OWN.dragon; }
  }
  setOption('dragon', OWN.dragon);
  // ------------------------------------------------ attack mode: the enemy base IS this map. Everything that belongs to the owner's own life is hidden
  // (camp army, villagers, animals, patrols, dragon, giants, badges); the structures stay and are driven by the battle sim (destruct.js).
  function setBattle(on) {
    if (on === !!bat) return;
    if (dlings) dlings.setBattle(on);
    if (campHome) campHome.group.visible = !on;                      // (a battle pitches its own camp on the same spot)
    if (nomadMesh) nomadMesh.visible = !on;                          // the attack map shows the base, not the nomads
    targetsUp(); restoreZones();
    if (on) {
      bat = { stage: stage.children.map((c) => [c, c.visible]), people: units.units.map((u) => u.root.visible), dragon: dragon.root.visible, giants: units.giants.map((g) => g.visible), badges: badges.map((b) => b.sprite.visible), patrol: patrols ? patrols.kinds.map((k) => k.group.visible) : [] };
      for (const c of stage.children) if (c.name !== 'late:defenses' && c.name !== 'late:worksites' && c.name !== 'late:wslife' && c.name !== 'late:deffield') c.visible = false;     // (p38: the enemy's worksites and the people at work stay)
      for (const u of units.units) u.root.visible = false;               // gate guards, villagers, the stable's trainer and groom: not in the enemy base
      dragon.root.visible = false; for (const g of units.giants) g.visible = false; for (const b of badges) b.sprite.visible = false; if (patrols) patrols.kinds.forEach((k) => { k.group.visible = false; });
      if (extras.ballistas) extras.ballistas.setManual(true);
    } else {
      const o = bat; bat = null;
      for (const [c, v] of o.stage) c.visible = v;
      units.units.forEach((u, i) => { u.root.visible = o.people[i] !== false; });
      dragon.root.visible = o.dragon && OWN.dragon; units.giants.forEach((g, i) => { g.visible = o.giants[i]; }); badges.forEach((b, i) => { b.sprite.visible = o.badges[i]; }); if (patrols) patrols.kinds.forEach((k, i) => { k.group.visible = o.patrol[i]; });
      flames.reset(); flags.reset(); if (extras.ballistas) { extras.ballistas.setManual(false); extras.ballistas.reset(); }
      keepCampClear();
    }
  }
  const targetDown = (id) => {
    flames.hide(id); flags.hide(id); if (extras.ballistas) extras.ballistas.hide(id); if (tesla) tesla.hide(id);
    const a = liveBy.get(id); if (a) for (const o of a) { downSaved.push([o, o.visible]); o.visible = false; o.userData.down = true; }
  };
  // rects: oriented boxes { x, z, tx, tz, nx, nz, l0, l1, b0, b1 } (lateral along (tx,tz), back along (nx,nz), both relative to x,z): instances inside are hidden until restoreZones
  const clearZones = (rects) => {
    restoreZones();
    for (const im of scatter) {
      const a = im.instanceMatrix.array, n = im.count; let saved = null;
      for (let i = 0; i < n; i++) {
        const x = a[i * 16 + 12], z = a[i * 16 + 14]; if (x === 0 && z === 0 && a[i * 16] === 0) continue;
        for (const r of rects) {
          const dx = x - r.x, dz = z - r.z, l = dx * r.tx + dz * r.tz, b = dx * r.nx + dz * r.nz;
          if (l < r.l0 || l > r.l1 || b < r.b0 || b > r.b1) continue;
          if (!saved) saved = new Map(); saved.set(i, a.slice(i * 16, i * 16 + 16)); a.fill(0, i * 16, i * 16 + 16); break;
        }
      }
      if (saved) { im.instanceMatrix.needsUpdate = true; zoneSaved.push([im, saved]); }
    }
    return zoneSaved.reduce((s2, z) => s2 + z[1].size, 0);
  };
  const restoreZones = () => { for (const [im, saved] of zoneSaved) { const a = im.instanceMatrix.array; for (const [i, m] of saved) a.set(m, i * 16); im.instanceMatrix.needsUpdate = true; } zoneSaved.length = 0; };
  // Where the army musters: in front of the main gate, on the stretch of ground with the least in the way (houses, mills, water, steep slopes, crops).
  // Searched once per base: distance 44..76 m from the gate, shifted sideways -70..70 m; the cost is measured over the 140 x 50 m the army covers.
  let metaCache = null;
  const baseMetaNow = () => {
    if (metaCache) return metaCache;
    if (!L.TOWN) return null;
    const gates = L.TGATES.map((g) => ({ x: g.x, z: g.z, nx: g.nx, nz: g.nz })), g0 = gates[0], tx = -g0.nz, tz = g0.nx;
    const solid = ctx.targets.filter((t) => t.type !== 'wall' && t.type !== 'gate');
    let best = { d: 62, lat: 0 }, bc = 1e9;
    for (let d = 44; d <= 76; d += 4) for (let lat = -70; lat <= 70; lat += 7) {
      const cx = g0.x + g0.nx * d + tx * lat, cz = g0.z + g0.nz * d + tz * lat; let cost = 0, n = 0;
      for (let l = -70; l <= 70; l += 5) for (let bk = -2; bk <= 46; bk += 5) {
        const x = cx + tx * l + g0.nx * bk, z = cz + tz * l + g0.nz * bk; n++;
        const hh = height(x, z), sl = Math.abs(height(x + 4, z) - hh) + Math.abs(height(x, z + 4) - hh);
        if (solid.some((t) => Math.hypot(t.x - x, t.z - z) < Math.max(t.w, t.d) * 0.62 + 3)) cost += 6;
        if (hh < 0.4) cost += 12; if (sl > 3.2) cost += 2; if (L.fieldD(x, z) < 1.1) cost += 1;
      }
      cost = cost / n + (d - 44) * 0.004 + Math.abs(lat) * 0.0006;               // (a slight pull toward the gate and the middle: a short, straight march)
      if (cost < bc) { bc = cost; best = { d, lat }; }
    }
    return (metaCache = { gates, town: L.TOWN.map((p) => [p[0], p[1]]), keep: { x: L.KEEP.x, z: L.KEEP.z }, deploy: best });
  };
  // the deploy zone in front of the gate, the army camp and the muster field stay open ground for good (B26): no tree, rock, bush or flower stands there
  {
    const m = baseMetaNow(), rects = [];
    if (m) { const g0 = m.gates[0], tx = -g0.nz, tz = g0.nx, d = m.deploy.d, lat = m.deploy.lat; rects.push({ x: g0.x + g0.nx * d + tx * lat, z: g0.z + g0.nz * d + tz * lat, tx, tz, nx: g0.nx, nz: g0.nz, l0: -86, l1: 76, b0: -8, b1: 92 }); }
    for (const Z of [L.CAMP, L.MUSTER]) if (Z && Z.r > 0) rects.push({ x: Z.x, z: Z.z, tx: 1, tz: 0, nx: 0, nz: 1, l0: -(Z.r + 8), l1: Z.r + 8, b0: -(Z.r + 8), b1: Z.r + 8 });
    const inside = (x, z) => rects.some((r) => { const dx = x - r.x, dz = z - r.z, l = dx * r.tx + dz * r.tz, b = dx * r.nx + dz * r.nz; return l >= r.l0 && l <= r.l1 && b >= r.b0 && b <= r.b1; });
    if (forest.ez && forest.ez.lod) forest.ez.lod.exclude(inside);
    let gone = 0;
    for (const im of scatter) {
      const a = im.instanceMatrix.array, n = im.count; let ch = false;
      for (let i = 0; i < n; i++) { const x = a[i * 16 + 12], z = a[i * 16 + 14]; if (x === 0 && z === 0 && a[i * 16] === 0) continue; if (inside(x, z)) { a.fill(0, i * 16, i * 16 + 16); ch = true; gone++; } }
      if (ch) im.instanceMatrix.needsUpdate = true;
    }
    world_keepClear = gone;
  }
  const targetsUp = () => { for (const [o, v] of downSaved) { o.visible = v; o.userData.down = false; } downSaved.length = 0; if (tesla) tesla.set(teslaN); };
  // Tesla coils (shop): built the first time one is shown (home: the player's own count; a raid: the enemy's)
  let tesla = null, armyLv = null, teslaN = 0, dlings = null;
  const syncWeapons = () => { if (extras.ballistas && extras.ballistas.replace) extras.ballistas.replace(tesla ? tesla.ids() : []); };
  const teslaApi = {
    set(n) { teslaN = n | 0; if (!(n > 0) && !tesla) return; try { tesla = tesla || createTesla({ scene, targets: ctx.targets, meta: baseMetaNow(), height: terrain.fastHeight || height }); tesla.set(n); syncWeapons(); } catch (e) { console.warn('tesla', e); } },
    orb: (id) => (tesla ? tesla.orb(id) : null), fire: (id) => tesla && tesla.fire(id), hide: (id) => tesla && tesla.hide(id), get count() { return tesla ? tesla.count : 0; },
    sync: syncWeapons, ids: () => (tesla ? tesla.ids() : []),
  };
  // the field camp (camp.js) stands in the home map too, on the same spot and at the same angle as in a battle (the deploy point in front of the first gate), flying the owner's crest
  let campHome = null, campEmblem = null, campBusy = false, campRect = null;
  const keepCampClear = () => { if (campRect && !bat) clearZones([campRect]); };                    // (p37: the tents stand further back for a big army — the trees, rocks and grass there give way, and come back after a battle's own clearing is undone)
  const setCamp = async (emblem, army) => {
    const key = emblem + '|' + Object.entries(army || {}).filter(([, n]) => n > 0).sort().join(';');
    if (campBusy || !emblem || key === campEmblem) return;
    const m = baseMetaNow(); if (!m) return;
    campBusy = true;
    try {
      const g0 = m.gates[0], tx = -g0.nz, tz = g0.nx, d = m.deploy.d, lat = m.deploy.lat;
      const c = await createCamp({ scene, height: terrain.fastHeight || height, dp: { x: g0.x + g0.nx * d + tx * lat, z: g0.z + g0.nz * d + tz * lat, nx: g0.nx, nz: g0.nz }, emblem, army, targets: ctx.targets });
      if (campHome) campHome.dispose(); campHome = c; campEmblem = key; c.group.visible = !bat;
      campRect = { x: g0.x + g0.nx * d + tx * lat, z: g0.z + g0.nz * d + tz * lat, tx, tz, nx: g0.nx, nz: g0.nz, ...c.rect };
      if (forest.ez && forest.ez.lod) forest.ez.lod.exclude((x, z) => { const dx = x - campRect.x, dz = z - campRect.z, l = dx * tx + dz * tz, b = dx * g0.nx + dz * g0.nz; return l >= campRect.l0 && l <= campRect.l1 && b >= campRect.b0 && b <= campRect.b1; });
      keepCampClear();
    } catch (e) { console.warn('camp home', e); } finally { campBusy = false; }
  };
  const setArmyTiers = (lv) => { armyLv = lv; if (army.setTiers) army.setTiers(lv); };
  // the green Dragonlings at the Lair (dragonling_home.js): an egg until the shop's egg is bought, then two of them
  const setDragonlings = (owned) => { if (!dlings) { try { dlings = createHomeDragonlings({ scene, height: terrain.fastHeight || height }); ctx.levelHooks.push(() => dlings.refresh()); } catch (e) { console.warn('dragonlings', e); return; } } dlings.set(owned); };
  return {
    update, setTime, picks, water, get keptClear() { return world_keepClear; }, get lod() { return forest.ez ? forest.ez.lod : null; }, fastHeight: terrain.fastHeight, setBattle, targetDown, clearZones, key, stage, get ballistas() { return extras.ballistas || null; }, get dragon() { return dragon; }, giants: units.giants, shake: shakeReq, creatures, setOption, startLate, revealLate, lateProgress, setLateBudget, patrols, events, get late() { return extras; },
    setWeather: (m, snap) => weather.setMode(m, snap), weatherIcon: (base) => weather.icon() || base, weather,
    // p37 (old N6): a phone's GPU that lost its context comes back with every target EMPTY (the picture went half as bright, the ground black): paint again what was drawn into targets
    restoreGpu() { try { if (terrain.bake && terrain.bake.redo) terrain.bake.redo(null); } catch (e) { console.warn('restore ground', e); } try { rebakeAtlases(renderer); } catch (e) { console.warn('restore cards', e); }
      try { setGemEnv(jewelEnvironment(pmrem)); } catch (e) { console.warn('restore gems', e); } TS.envAt = -1e9; TS.envHour = -99; },
    exposureMul: (calm) => (calm ? 1 + weather.W.flashSoft * 0.05 : 1 + weather.W.flash * 0.5),      // (calm = in an attack: a lightning flash used to lift the whole picture by up to 23 % and flicker it at 14 Hz - measured; now a 5 % swell without the flicker) takeThunder: () => thunderQ.splice(0),
    get breathing() { return dragon.root.visible && dragon.breathing; },
    badges, setLevel, levels, vaults, stores, falls, church: ctx.town && ctx.town.church, ctx, assets: A, mats: M, targets: ctx.targets,
    // what the battle sim needs besides the targets: the gates (muster point in front of the first one), the town ring polygon, the keep
    get baseMeta() { return baseMetaNow(); },
    tesla: teslaApi, setArmyTiers, setDragonlings, setCamp, get armyLv() { return armyLv; },
    get moatStats() { return moat.stats || null; },
  };
}

// ------------------------------------------------ forest
function buildForest(scene, height, Q, inner, DAY, A, renderer) {
  const r = rng(404);
  // pine geometry with baked colors
  const parts = [];
  const add = (geo, col, y) => { const g = geo.index ? geo.toNonIndexed() : geo; g.translate(0, y, 0); const c = new THREE.Color(col).convertSRGBToLinear(); const a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv'); parts.push(g); };
  add(new THREE.CylinderGeometry(0.22, 0.34, 2.4, 6), '#5a3d26', 1.2);
  // layered pine: each tier darker at the base, sunlit at the tip (painted look)
  const tiers = [[2.6, 3.0, 2.2], [2.2, 2.8, 3.5], [1.8, 2.6, 4.7], [1.35, 2.3, 5.8], [0.85, 2.0, 6.8]];
  const dk = new THREE.Color(DAY ? '#24501c' : '#1a3a20').convertSRGBToLinear(), lt = new THREE.Color(DAY ? '#7cb342' : '#3d6a3a').convertSRGBToLinear();
  tiers.forEach(([rad, hh, y], ti) => {
    const g0 = new THREE.ConeGeometry(rad, hh, 7, 1); g0.rotateY(ti * 0.7);
    const pp = g0.attributes.position;
    for (let i = 0; i < pp.count; i++) { const yy = pp.getY(i); if (yy < -hh / 2 + 0.01) pp.setY(i, yy - 0.25 * ((i * 7919) % 3) / 2); }
    const g = g0.toNonIndexed(); g.translate(0, y, 0); g.computeVertexNormals();
    const p2 = g.attributes.position, a = new Float32Array(p2.count * 3), cc = new THREE.Color();
    for (let i = 0; i < p2.count; i++) { const k = Math.min(1, Math.max(0, (p2.getY(i) - (y - hh / 2)) / hh)); cc.copy(dk).lerp(lt, Math.pow(k, 0.8) * (0.55 + ti * 0.1)); a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv'); parts.push(g);
  });
  const pineGeo = mergeSimple(parts);
  const pineMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: false, envMapIntensity: 0.3 });
  const trees = { near: [], far: [] }, edges = [];
  const tries = Q.level === 'low' ? 8000 : Q.level === 'medium' ? 12000 : 16000;
  for (let i = 0; i < tries; i++) {
    const a = r() * Math.PI * 2, d = 150 + Math.sqrt(r()) * 420, x = Math.cos(a) * d, z = Math.sin(a) * d;
    const den = forestDensity(x, z);
    const lone = den < 0.05 && r() < (DAY ? 0.07 : 0.04) && L.sdTown(x, z) > 24 && L.fieldD(x, z) > 1.2 && roadEdge(x, z) > 4 && !L.nearMine(x, z, 46) && hamletD(x, z) > 26 && nomadD(x, z) > 26 && wsD(x, z) > 4 && !treeClear(x, z, 8);
    if (!lone && r() > den * 0.85) continue;
    const h = height(x, z);
    if (h < 0.4 || h > 105 + L.NOISE.fbm(x * 0.02, z * 0.02, 2) * 25) continue;
    const s = 0.75 + r() * 0.95 + (h > 30 ? -0.15 : 0);
    const m = mat4(x, h - 0.2, z, r() * 6.28, s, s * (0.9 + r() * 0.35), s);
    (d < 230 ? trees.near : trees.far).push({ m, c: 0.8 + r() * 0.4, d });
    if (den > 0.2 && den < 0.45 && r() < 0.1 && d < 160) edges.push([x, z]);
  }
  for (const [x, z] of inner) { const s = 0.9 + r() * 0.4; trees.near.push({ m: mat4(x, height(x, z) - 0.2, z, r() * 6.28, s, s, s), c: 1, d: 0 }); }
  // broadleaf trees around the town & fields
  const leafParts = [];
  const add2 = (geo, colr, y, sc) => { const g = geo.index ? geo.toNonIndexed() : geo; g.scale(sc[0], sc[1], sc[2]); g.translate(0, y, 0); const c = new THREE.Color(colr).convertSRGBToLinear(); const aa = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < aa.length; i += 3) { aa[i] = c.r; aa[i + 1] = c.g; aa[i + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(aa, 3)); g.deleteAttribute('uv'); leafParts.push(g); };
  add2(new THREE.CylinderGeometry(0.25, 0.4, 3, 6), '#4a3322', 1.5, [1, 1, 1]);
  add2(new THREE.IcosahedronGeometry(2.2, 1), DAY ? '#4f8a2c' : '#3b5e2c', 4.2, [1, 0.85, 1]);
  add2(new THREE.IcosahedronGeometry(1.5, 1), DAY ? '#6aa63a' : '#4a7034', 5.4, [1, 0.9, 1]);
  const leafGeo = mergeSimple(leafParts);
  const leafList = [];
  for (let i = 0; i < 900 && leafList.length < 140; i++) {
    const a = r() * 6.28, d = 150 + r() * 120, x = Math.cos(a) * d, z = Math.sin(a) * d;
    const sd = L.sdTown(x, z);
    if (sd < 22 || forestDensity(x, z) > 0.3 || L.nearMine(x, z, 44) || hamletD(x, z) < 24 || nomadD(x, z) < 24 || wsD(x, z) < 3 || treeClear(x, z, 6)) continue;
    if (L.fieldD(x, z) < 1.15 || Math.hypot(x - L.WINDMILL.x, z - L.WINDMILL.z) < 14 || roadEdge(x, z) < 3) continue;
    const h = height(x, z); if (h < 0.5) continue;
    if (r() > 0.35) continue;
    const s = 0.8 + r() * 0.6;
    leafList.push(mat4(x, h - 0.2, z, r() * 6.28, s, s, s));
  }
  // hamlets (p22): fenced kitchen gardens behind the houses and a few broadleaf / fruit trees around them, so from above a hamlet reads as a
  // farmstead among trees, not boxes on a lawn
  const SWh = seasonWeights(season());
  const gardens = planGardens(hamlets(), (x, z) => roadEdge(x, z) > 2 && L.fieldD(x, z) > 1.1 && height(x, z) > 0.5 && !treeClear(x, z, 2));
  buildGardens(scene, gardens, height, { autumn: SWh.w[2], winter: SWh.w[3] });
  const rh = rng(5353);                                                // (own random stream: the forest keeps its trees)
  for (const H of hamlets()) {
    const n = 4 + ((rh() * 3) | 0);
    for (let k = 0, put = 0; k < n * 4 && put < n; k++) {
      const a = rh() * 6.28, d = 20 + rh() * 10, x = H.x + Math.cos(a) * d, z = H.z + Math.sin(a) * d;
      if (gardens.some((g) => Math.hypot(g.x - x, g.z - z) < Math.max(g.w, g.d) * 0.5 + 4)) continue;
      if (H.houses.some((h) => Math.hypot(h.x - x, h.z - z) < Math.max(h.w, h.d) * 0.5 + 4) || roadEdge(x, z) < 3.5 || L.fieldD(x, z) < 1.15 || treeClear(x, z, 4)) continue;
      const h = height(x, z); if (h < 0.5) continue;
      const s = 0.7 + rh() * 0.4; trees.near.push({ m: mat4(x, h - 0.2, z, rh() * 6.28, s, s, s), d: 3, group: 'broad' }); put++;
    }
  }
  // ... and a soft ground shadow under each farmhouse (out there the sun's shadow map does not reach)
  groundShadows(scene, hamlets().flatMap((H) => H.houses.map((h) => ({ x: h.x, z: h.z, w: h.w, d: h.d, ry: h.ry }))), height);
  // realistic EZ-Tree trees near, baked impostors far
  let ez = null;
  if (A && A.models.ez_pine_a) {
    for (const m of leafList) trees.near.push({ m, d: 1, group: 'broad' });
    ez = buildTrees(renderer, scene, A, trees.near, trees.far, Q, r, season()); trees.near = []; trees.far = [];
  }
  // (fallback) near trees: Quaternius models, far forest: light procedural pines
  else if (A && A.models.pine1) {
    const kinds = ['pine5', 'pine5', 'pine5', 'pine4', 'pine4', 'pine2', 'pine2', 'pine1', 'tree3', 'tree5', 'tree4', 'tree5'];
    const buckets = {}, cap = Q.level === 'low' ? 40 : Q.level === 'medium' ? 80 : 120;
    trees.near.sort((p1, p2) => p1.d - p2.d);
    const real = trees.near.slice(0, cap); trees.far.push(...trees.near.slice(cap)); trees.near = real;
    for (const t2 of trees.near) {
      const k = kinds[(r() * kinds.length) | 0], m = t2.m.clone();
      const sc = k.startsWith('pine') ? 1.35 : 1.15; m.multiply(new THREE.Matrix4().makeScale(sc, sc, sc));
      (buckets[k] = buckets[k] || []).push(m);
    }
    for (const [k, list] of Object.entries(buckets)) instance(scene, A.models[k], list, { cast: !!Q.shadows });
    trees.near = [];
  }
  for (const [key, cast] of [['near', !!Q.shadows], ['far', false]]) {
    const list = trees[key]; if (!list.length) continue;
    const im = new THREE.InstancedMesh(pineGeo, pineMat, list.length);
    const col = new THREE.Color();
    list.forEach((t2, i) => { im.setMatrixAt(i, t2.m); im.setColorAt(i, col.setRGB(t2.c, t2.c * (0.95 + r() * 0.1), t2.c)); });
    im.castShadow = cast; im.receiveShadow = true; im.computeBoundingSphere();
    scene.add(im);
  }
  if (leafList.length && !ez) {
    const im = new THREE.InstancedMesh(leafGeo, pineMat, leafList.length);
    leafList.forEach((m, i) => im.setMatrixAt(i, m));
    im.castShadow = !!Q.shadows; im.receiveShadow = true; scene.add(im);
  }
  // rocks (p22): natural groups of procedural boulders in the scanned moss-rock texture (sc_rocks.js) — a main rock leaning into the slope with
  // a few half-buried stones around it; slabs and crags up the hills. scatterFlora() adds the meadow rocks and builds the kit (one mesh per kind).
  const kit = rockKit(A && A.ph, Q, { snow: Math.min(1, seasonWeights(season()).snow * 1.3) });
  const inGarden = (x, z) => gardens.some((g) => Math.hypot(g.x - x, g.z - z) < Math.max(g.w, g.d) * 0.5 + 2.5);
  const rockOk = (x, z) => !inGarden(x, z) && !(L.sdTown(x, z) < 20 || roadEdge(x, z) < 2 || L.nearMine(x, z, 38) || hamletD(x, z) < 22 || nomadD(x, z) < 22 || wsD(x, z) < 8 || treeClear(x, z, 4)) && height(x, z) >= 0.2;
  const nGroups = Q.level === 'low' ? 80 : Q.level === 'medium' ? 105 : 125;
  for (let i = 0, g = 0; i < 1800 && g < nGroups; i++) {
    const a = r() * 6.28, d = 150 + Math.sqrt(r()) * 420, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (!rockOk(x, z)) continue;
    const big = smooth(20, 70, height(x, z));
    if (r() > 0.25 + big * 0.5) continue;
    rockGroup(kit, r, x, z, 0.55 + r() * 1.1 + big * 3.2 * r(), height, rockOk, { mountain: big });
    g++;
  }
  // bushes along the moat & roads (p22): soft card bushes baked from the EZ-Tree shrubs (sc_bush.js), some in little clumps; one draw call
  const bushOk = (x, z) => !inGarden(x, z) && !(L.sdTown(x, z) < 18 || roadEdge(x, z) < 1.5 || L.fieldD(x, z) < 1.05 || L.nearMine(x, z, 38) || hamletD(x, z) < 20 || nomadD(x, z) < 20 || wsD(x, z) < 6 || treeClear(x, z, 4)) && height(x, z) >= 0.3;
  const bk = bushKit(renderer, A, { season: season(), uTime: TREE_TIME }), bushes = bk.list, nBush = Q.level === 'low' ? 200 : 280;
  for (let i = 0; i < 2400 && bushes.length < nBush; i++) {
    const a = r() * 6.28, d = 140 + r() * 140, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (!bushOk(x, z)) continue;
    const s = 0.85 + r() * 1.05, n = r() < 0.35 ? 1 + ((r() * 2) | 0) : 0;
    bk.add(x, height(x, z) - 0.06, z, s, r() * 6.28, 1 + r() * 0.35);
    for (let k = 0; k < n; k++) {
      const aa = r() * 6.28, dd = s * (0.7 + r() * 0.6), px = x + Math.cos(aa) * dd, pz = z + Math.sin(aa) * dd;
      if (bushOk(px, pz)) bk.add(px, height(px, pz) - 0.06, pz, s * (0.55 + r() * 0.3), r() * 6.28, 1 + r() * 0.35);
    }
  }
  if (!edges.length) edges.push([80, 60]);
  return { edges, ez };
}

function snowify(mat, amount) {
  if (!mat || mat.userData.snow) return; mat.userData.snow = true;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    sh.uniforms.uSnowAmt = { value: amount };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vUpN;')
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n#ifdef USE_INSTANCING\nvUpN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal).y;\n#else\nvUpN = normalize(mat3(modelMatrix) * objectNormal).y;\n#endif');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSnowAmt; varying float vUpN;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.9, 0.95), uSnowAmt * smoothstep(0.42, 0.78, vUpN));');
  };
  mat.customProgramCacheKey = () => prevKey() + '|snow';
  mat.needsUpdate = true;
}

function mergeSimple(parts) {
  let n = 0; for (const p of parts) n += p.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const p of parts) {
    pos.set(p.attributes.position.array, o * 3); nor.set(p.attributes.normal.array, o * 3); col.set(p.attributes.color.array, o * 3);
    o += p.attributes.position.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeBoundingSphere();
  return g;
}

// ------------------------------------------------ fort textures (Quaternius village PBR)
function applyFortTextures(M, A) {
  const mk = (set, rep, extra = {}) => {
    const t = A.tex[set]; if (!t || !t.map) return null;
    const c = (x) => { if (!x) return null; const y = x.clone(); y.repeat.set(rep, rep); y.needsUpdate = true; return y; };
    return new THREE.MeshStandardMaterial({ map: c(t.map), normalMap: c(t.normalMap), roughnessMap: c(t.roughnessMap), roughness: 1, metalness: 0, vertexColors: true, envMapIntensity: 0.55, ...extra });
  };
  M.stoneLight = mk('UnevenBrick', 2.4) || M.stoneLight;
  M.stoneDark = mk('RockTrim', 2.0) || M.stoneDark;
  M.plaster = mk('Plaster', 1.6) || M.plaster;
  M.roof = mk('RoundTiles', 0.9) || M.roof;
}

// ------------------------------------------------ grass, flowers, bushes, rocks (real models)
function scatterFlora(scene, height, Q, A, DAY, shore) {
  const kit = ROCKS.kit, bk = BUSH.kit, rr = rng(3131);
  if (!A || !A.models.grass) { if (kit) kit.build(scene); if (bk) bk.build(scene); return; }
  const r = rng(909), N = L.NOISE;
  const lists = {};
  const push = (k, m) => (lists[k] = lists[k] || []).push(m);
  const q = Q.level === 'low' ? 0.35 : Q.level === 'medium' ? 0.6 : 1;
  const base = { grass: 560, grasst: 90, grassw: 120, flower3: 52, flower4: 26, bush: 36, bushf: 22, fern: 40, clover: 76, rock1: 22, rock2: 22, rock3: 20, pebble1: 40, pebble2: 40, mushroom: 0, plant: 20 };   // (denser meadows: the open country must not look bare)
  const SWf = seasonWeights(season()), wint = SWf.w[3], spr = SWf.w[0], aut = SWf.w[2];
  const sk = (k) => (/^flower|clover/.test(k) ? Math.max(0, 1 + spr * 1.2 - aut * 0.6 - wint) : /^grass|fern|plant/.test(k) ? 1 - wint * 0.7 : 1);
  const want = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, Math.round(v * q * sk(k))]));
  const R = { grass: 115, grasst: 130, grassw: 120, flower3: 110, flower4: 110, bush: 130, bushf: 110, fern: 140, clover: 100, rock1: 150, rock2: 150, rock3: 150, pebble1: 90, pebble2: 90, mushroom: 140, plant: 120 };
  for (const [k, n] of Object.entries(want)) {
    let placed = 0;
    for (let i = 0; i < n * 8 && placed < n; i++) {
      const a = r() * 6.28, d = Math.sqrt(r()) * R[k] * 1.9, x = Math.cos(a) * d, z = Math.sin(a) * d;
      const sd = L.sdPoly(L.OUTER, x, z), sdT = L.sdTown(x, z);
      if ((sd > -3 && sd < 3.5) || (sdT > -4 && sdT < 4)) continue;   // wall footprints
      if (sdT < 0 && sd > 0) continue;                             // the lower town is streets & houses
      if (L.fieldD(x, z) < 1.1) continue;                           // crops
      if (sd < 0 && !['grass', 'grassw', 'clover', 'pebble1', 'pebble2', 'flower3'].includes(k)) continue;
      if (sd < 0 && r() > 0.35) continue;                         // yard stays mostly clear
      const h = height(x, z); if (h < 0.1) continue;
      if (roadEdge(x, z) < 1 || keepClear(x, z, 2) || nomadD(x, z) < 13 || wsD(x, z) < 4 || (k !== 'grass' && k !== 'grasst' && k !== 'clover' && hamletD(x, z) < 19)) continue;
      if (/^(rock|bush|fern|plant|mushroom)/.test(k) && treeClear(x, z, 2)) continue;   // the pasture: grass and flowers only (the herd grazes there)
      if (k !== 'grass' && k !== 'grasst' && k !== 'clover' && k !== 'pebble1' && k !== 'pebble2' && L.nearMine(x, z, 34)) continue;   // the mining yards stay tidy
      const patch = N.fbm(x * 0.06 + (k.length * 3), z * 0.06, 2);
      if (k.startsWith('grass') && patch < -0.15) continue;
      const big = k.startsWith('rock') ? 0.8 + r() * 1.6 : k.startsWith('bush') ? 1.1 + r() * 0.8 : k.startsWith('grass') ? 0.55 + r() * 0.5 : 0.8 + r() * 0.6;
      if (k === 'bush' && bk) { bk.add(x, h - 0.06, z, 0.95 * big, r() * 6.28, 1 + r() * 0.3); placed++; continue; }   // (p22: the round shrubs are card bushes, no red leaves)
      if (k.startsWith('rock') && kit) {           // (p22: the meadow rocks are sc_rocks boulders too — same spots as before, own random stream)
        r(); r(); rockGroup(kit, rr, x, z, 0.45 + big * 0.55, height, (px, pz) => roadEdge(px, pz) > 1 && L.fieldD(px, pz) > 1.1 && height(px, pz) > 0.1, { sats: rr() < 0.45 ? 0 : 1 + ((rr() * 2) | 0) });
        placed++; continue;
      }
      push(k, mat4(x, h - 0.05, z, r() * 6.28, big, big * (0.85 + r() * 0.35), big));
      placed++;
    }
  }
  // the banks: ferns, leafy plants, shrubs and wet pebbles crowd the waterline (positions come from the moat builder)
  if (shore && shore.length) {
    const rb = rng(5151), LVb = L.MOAT.level;
    //            kind      chance  inland range (m)   size
    const BANK = [['fern', 0.55, 1.2, 6.5, 0.9, 0.7], ['grassw', 0.5, 0.4, 5.0, 0.7, 0.5], ['plant', 0.14, 1.5, 6, 0.9, 0.5], ['bush', 0.12, 4, 10, 1.1, 0.8],
      ['pebble1', 0.4, -0.5, 1.4, 0.8, 0.8], ['pebble2', 0.4, -0.5, 1.4, 0.8, 0.8], ['flower3', 0.14, 1, 5, 0.9, 0.5], ['clover', 0.22, 0.6, 5, 0.9, 0.5]];
    for (const [k, chance, o0, o1, sz, sv] of BANK) {
      if (!A.models[k]) continue;
      for (const [x, z, dx, dz] of shore) {
        if (rb() > chance * q) continue;
        const off = o0 + rb() * (o1 - o0), lat = (rb() - 0.5) * 2.4, px = x + dx * off - dz * lat, pz = z + dz * off + dx * lat, h = height(px, pz);
        if (h < LVb - 0.25 || h > LVb + 4 || roadEdge(px, pz) < 1.2 || L.fieldD(px, pz) < 1.1) continue;
        const big = (sz + rb() * sv) * (k.startsWith('bush') ? 1.1 : 1);
        if (k === 'bush' && bk) { bk.add(px, h - 0.06, pz, 0.95 * big, rb() * 6.28, 1 + rb() * 0.3); continue; }
        push(k, mat4(px, h - 0.05, pz, rb() * 6.28, big, big * (0.85 + rb() * 0.35), big));
      }
    }
  }
  // a tuft of grass / fern at the foot of the bigger rocks (no new meshes: they join the meadow's instances)
  if (kit) {
    const rg = rng(4242);
    for (const b of kit.bases) {
      if (b.r < 0.6 || Math.hypot(b.x, b.z) > 330 || rg() > 0.75 * (q + 0.3)) continue;
      const a = rg() * 6.28, d = b.r * (0.85 + rg() * 0.3), x = b.x + Math.cos(a) * d, z = b.z + Math.sin(a) * d, h = height(x, z);
      if (h < 0.1 || roadEdge(x, z) < 1 || L.fieldD(x, z) < 1.1) continue;
      const k = rg() < 0.55 ? 'grass' : rg() < 0.6 ? 'fern' : 'grasst', big = (k === 'fern' ? 0.8 : 0.65) + rg() * 0.45;
      if (A.models[k]) push(k, mat4(x, h - 0.05, z, rg() * 6.28, big, big * (0.85 + rg() * 0.35), big));
    }
    kit.build(scene);
  }
  if (bk) bk.build(scene);
  for (const [k, list] of Object.entries(lists)) instance(scene, A.models[k], list, { cast: !!Q.shadows && Q.level !== 'medium' && k.startsWith('rock'), receive: true, chunk: 110, lod: true });
}
