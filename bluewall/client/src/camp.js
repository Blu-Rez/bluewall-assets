// The attacker's army camp (p30; the owner 19:22 + 19:51): ONE real tent per squad of the army — its colour is the squad's ring colour (the same colour edges the squad's card),
// its size follows the squad's head-count — plus the tall standard that flies the ATTACKER'S OWN crest.  Nothing else.
// It stands BEHIND the deployed army (p37, owner 6 Oct 12:06: "one group in front of the tents, one group inside them" — the camp now reads the army's own plan, armyplan.js, and pitches itself
// behind the last row with clear ground between), on a fixed spot for a given army (the same in the home map and in a battle: world.js setCamp / battle.js), and goes away with the battle.
//   const camp = await createCamp({ scene, height, dp, emblem, army });  camp.update(t);  camp.dispose();   (army = { type: head-count })
//   dp = { x, z, nx, nz } the deploy point in front of the first gate (n = away from the enemy base)
// BT1_R2: the camp is a list of SLOT RECORDS { kind, x, z, ry } (camp_slots.js: command / barracks / supply / siege / healer tents, the banner, the palisade) and camp_slots.json names the MODEL of every kind
// (null = today's piece: the pavilion / the standard with the attacker's crest / no palisade).  A model enters by editing that table, nothing here changes; a model that fails to load keeps the fallback.
// The pavilions have two levels of detail (camptents.js lod 0 / 1) picked per tent by its size on the screen: update(t, camera).
//   createCamp({ ..., table, load })   table = the slot table (default camp_slots.json), load = (assetKey) => Promise<gltf> (default assets.js loadGLB) - the tests pass their own
import * as THREE from 'three';
import { drawCrest } from './emblems.js';
import { pavilionGeo } from './camptents.js';
import { SQUAD_COLOR } from './squadring.js';
import { planArmy, toFrame } from './armyplan.js';
import { staticSolids } from './solids.js';
import { planCamp } from './campplan.js';
import * as L from './layout.js';
import { hamlets } from './hamlets.js';
import { TUNE } from './battlesim.js';
import { CAMP_TABLE, TENT_KINDS, PAVILION_R, checkCampTable, squadKinds, tentSlots, bannerSlot, palisadeSlots } from './camp_slots.js';
import { loadGLB } from './assets.js';

const SQUAD_ORDER = Object.keys(SQUAD_COLOR);

function flagTex(id) {
  const W = 512, H = 320, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1a4592'); gr.addColorStop(1, '#071a46'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#cfdbec'; g.lineWidth = 11; g.strokeRect(9, 9, W - 18, H - 18); g.strokeStyle = '#6d86ad'; g.lineWidth = 3; g.strokeRect(25, 25, W - 50, H - 50);
  try { drawCrest(g, id, W / 2, H / 2, 236); } catch (e) { /* the crest is a bonus: the cloth is a proper navy standard without it */ }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// a tileable woven-canvas texture (fine thread weave, soft stains, rain streaks) — used as colour + bump on every tent
function canvasTex() {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d', { willReadFrequently: true });      // (p38: it reads the pixels back below - on a GPU canvas that read waited for every queued GPU job, seconds on a phone)
  let seed = 90210; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const im = g.createImageData(S, S), d = im.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const th = (((x >> 1) + (y >> 1)) & 1) ? 7 : -7, row = ((y % 4) < 2 ? 3 : -3) + ((x % 4) < 2 ? -3 : 3), v = 238 + th * 0.8 + row * 0.7 + (rnd() - 0.5) * 12, i = (y * S + x) * 4;
    d[i] = d[i + 1] = v; d[i + 2] = v - 2; d[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const wrap = (fn) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) fn(ox, oy); };
  for (let k = 0; k < 46; k++) {                                                    // soft stains and lighter sun-bleached patches
    const x = rnd() * S, y = rnd() * S, r = 14 + rnd() * 46, dark = rnd() < 0.7, a = 0.05 + rnd() * 0.09;
    wrap((ox, oy) => { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, dark ? `rgba(92,82,64,${a})` : `rgba(255,255,250,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); });
  }
  for (let k = 0; k < 34; k++) {                                                    // rain streaks running down the canvas
    const x = rnd() * S, y = rnd() * S, len = 50 + rnd() * 150, a = 0.04 + rnd() * 0.07, w = 1 + rnd() * 2.2;
    wrap((ox, oy) => { const gr = g.createLinearGradient(0, y + oy, 0, y + oy + len); gr.addColorStop(0, 'rgba(80,72,56,0)'); gr.addColorStop(0.2, `rgba(80,72,56,${a})`); gr.addColorStop(1, 'rgba(80,72,56,0)'); g.fillStyle = gr; g.fillRect(x + ox, y + oy, w, len); });
  }
  { const im2 = g.getImageData(0, 0, S, S), d2 = im2.data; for (let i = 0; i < d2.length; i += 4) { const n = (rnd() - 0.5) * 5; d2[i] += n; d2[i + 1] += n; d2[i + 2] += n; } g.putImageData(im2, 0, 0); }   // (dither: the soft stains must not band)
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

const TENT_LO_PX = 110;                             // BT1_R2: a tent whose picture is smaller than this (px tall, at the real screen size) is drawn with the far pavilion
// BT1_R2: the model of one slot kind from the table: { parts: [{ geo, mat, m }] }, the file scaled to row.h, turned by row.yaw, centred on its footprint and standing on y = 0.
async function slotModel(row, load) {
  const g = await load(row.model); if (!g || !g.scene) throw new Error('model file ' + row.model + ' did not load');
  g.scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g.scene), size = box.getSize(new THREE.Vector3()); if (!(size.y > 0)) throw new Error('model has no size');
  const sc = row.h / size.y;
  const base = new THREE.Matrix4().makeRotationY(((row.yaw || 0) * Math.PI) / 180).multiply(new THREE.Matrix4().makeScale(sc, sc, sc)).multiply(new THREE.Matrix4().makeTranslation(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2));
  const parts = []; let tris = 0;
  g.scene.traverse((o) => { if (o.isMesh && o.geometry) { parts.push({ geo: o.geometry, mat: o.material, m: base.clone().multiply(o.matrixWorld) }); tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } });
  if (!parts.length) throw new Error('model has no meshes');
  return { parts, tris: Math.round(tris), calls: parts.length };
}

export async function createCamp({ scene, height, dp, emblem, army, targets, table = CAMP_TABLE, load = loadGLB }) {
  const nx = dp.nx, nz = dp.nz, tx0 = -nz, tz0 = nx, yaw = Math.atan2(nx, nz);
  const at = (l, b) => [dp.x + tx0 * l + nx * b, dp.z + tz0 * l + nz * b];
  // where the army stands (armyplan.js: the same plan the battle lines the soldiers up by): the tents begin FRONT m behind its last row, the standard in the middle of the army's width
  const plan = planArmy(Object.fromEntries(Object.entries(army || {}).filter(([, n]) => n > 0)), TUNE.ur, true, toFrame(staticSolids(), dp));
  const group = new THREE.Group(); group.name = 'attackerCamp'; scene.add(group);
  const disposables = [];

  // ---- the tents: one pavilion per squad.  Its two canvas shades come from the instance colour (pure magenta / half-magenta vertices are "the squad colour" / "its darker shade").
  const tex = canvasTex(); disposables.push(tex);
  const mat = new THREE.MeshPhysicalMaterial({ vertexColors: true, map: tex, bumpMap: tex, bumpScale: 1.6, roughness: 0.92, metalness: 0, sheen: 0.6, sheenRoughness: 0.55, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide }); disposables.push(mat);
  mat.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <color_vertex>', `vColor = vec4(1.0); vColor.rgb *= color;
    float m1 = step(0.99, color.r) * step(0.99, color.b) * step(color.g, 0.01);
    float m2 = step(0.99, color.r) * step(0.99, color.b) * step(0.15, color.g) * step(color.g, 0.30);
    #ifdef USE_INSTANCING_COLOR
    vColor.rgb = mix(vColor.rgb, instanceColor.rgb, m1);
    vColor.rgb = mix(vColor.rgb, instanceColor.rgb * vec3(0.6, 0.6, 0.64), m2);
    #endif`); };
  const rank = (t) => { const i = SQUAD_ORDER.indexOf(t); return i < 0 ? 99 : i; };
  let squads = Object.entries(army || {}).filter(([, n]) => n > 0).sort((a, b) => rank(a[0]) - rank(b[0])).map(([t, n]) => ({ t, n, col: SQUAD_COLOR[t] || '#9fe6ff' }));
  if (!squads.length) squads = [0, 1, 2].map((i) => ({ t: 'x' + i, n: 6, col: '#5f86c9' }));
  const nMax = Math.max(1, ...squads.map((q) => q.n));

  // ---- BT1_R2: which model stands in which kind of slot (camp_slots.json).  A kind with a model that loads gets it; every other kind (and every failure) keeps today's piece.
  const kindOf = squadKinds(squads, table), KR = table.kinds || {}, tableBad = checkCampTable(table), kstate = {}, MODELS = {};
  for (const kd of [...new Set([...kindOf, 'banner', 'palisade'])]) {
    const row = KR[kd]; kstate[kd] = { state: 'fallback', model: row ? row.model : null, why: '' };
    if (!row || !row.model) continue;
    const bad = tableBad.filter((b) => b.startsWith(kd + ':'));
    try { if (bad.length) throw new Error(bad.join('; ')); MODELS[kd] = await slotModel(row, load); kstate[kd].state = 'model'; kstate[kd].tris = MODELS[kd].tris; kstate[kd].calls = MODELS[kd].calls; }
    catch (e) { kstate[kd].state = 'failed'; kstate[kd].why = String(e.message || e).slice(0, 160); console.warn('camp slot ->', kd, 'keeps its fallback:', e); }
  }
  squads.forEach((q, i) => { const kd = kindOf[i]; q.kind = kd; q.k = MODELS[kd] ? KR[kd].r / PAVILION_R : 1.1 + 0.45 * Math.sqrt(q.n / nMax); });   // the first tents' size (k = 1) and a little bigger for a bigger squad: 1.1 .. 1.55 (a model tent: the room its footprint needs)
  // placement (owner 6 Oct 14:16: «the tents BEHIND the army, a horizontal band, on the mountain side, real and pretty»): campplan.js — a band as wide as the army right behind its last rank, every
  // tent exactly GAP from its neighbours, pitched on the mountain slope where the ground behind the plain climbs.  Nothing solid in the way: the farms with their fences, the farmhouse, the hamlets,
  // the mill and the buildings of the base.
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const solid = (targets || []).filter((t) => t.type !== 'wall' && t.type !== 'gate');
  const farmHouse = L.FIELDS ? [[L.FIELDS.x + L.FIELDS.w / 2 + 18, L.FIELDS.z + 4, 13], [L.FIELDS.x + L.FIELDS.w / 2 + 10, L.FIELDS.z - 14, 7]] : [];
  const hamletHouses = (() => { try { return hamlets().flatMap((H) => H.houses.map((h) => [h.x, h.z, Math.max(h.w, h.d) * 0.75 + 3])); } catch (e) { return []; } })();
  const blocked = (l, b, r) => {
    const [x, z] = at(l, b);
    for (const t of solid) if (Math.hypot(t.x - x, t.z - z) < Math.max(t.w, t.d) * 0.62 + r + 2) return true;
    for (const F of L.FARMS || []) { const dx = x - F.x, dz = z - F.z, c = Math.cos(F.rot), s = Math.sin(F.rot), ox = dx * c - dz * s, oz = dx * s + dz * c; if (Math.abs(ox) < F.w / 2 + r + 5 && Math.abs(oz) < F.d / 2 + r + 5) return true; }
    for (const [hx, hz, hr] of farmHouse) if (Math.hypot(hx - x, hz - z) < hr + r + 2) return true;
    for (const [hx, hz, hr] of hamletHouses) if (Math.hypot(hx - x, hz - z) < hr + r) return true;
    if (L.WINDMILL && Math.hypot(x - L.WINDMILL.x, z - L.WINDMILL.z) < 16 + r) return true;
    return false;
  };
  const H0 = height(dp.x, dp.z), cp = planCamp({ plan, squads: squads.map((q) => ({ k: q.k })), height: (l, b) => { const [x, z] = at(l, b); return height(x, z); }, blocked, seed: hash(squads.map((q) => q.t).join('|')) });
  const POLE = cp.pole, Bs = cp.Bs, latC = cp.latC, poleFound = cp.poleFound, fallback = cp.fallback;
  const lc = POLE.l, B0 = POLE.b;
  const items = cp.items.map((t) => ({ ...t, q: squads[t.i] }));
  let rl0 = POLE.l - 8, rl1 = POLE.l + 8, rb0 = POLE.b - 8, rb1 = POLE.b + 8; for (const t of items) { rl0 = Math.min(rl0, t.l - t.r - 8); rl1 = Math.max(rl1, t.l + t.r + 8); rb0 = Math.min(rb0, t.b - t.r - 8); rb1 = Math.max(rb1, t.b + t.r + 8); }
  const rect = { l0: rl0, l1: rl1, b0: rb0, b1: rb1 };          // (what a battle's ground clearing should also cover)

  // ---- the SLOT RECORDS { kind, x, z, ry }: tents (one per squad), the banner, the palisade (only when its model is set: no fence is drawn today)
  const tents = tentSlots({ items, at, frameYaw: yaw, kinds: kindOf, squads }).map((sl, i) => ({ ...sl, col: new THREE.Color(items[i].q.col).multiplyScalar(0.95) }));
  const banner = bannerSlot({ pole: POLE, at, frameYaw: yaw });
  const fence = MODELS.palisade ? palisadeSlots({ rect, at, frameYaw: yaw, len: KR.palisade.len, blocked }) : [];
  const slots = [...tents, banner, ...fence];

  // pitched on the slope: the piece leans with 60 % of the ground's slope, and sits so that its lower side touches the ground and the upper side is dug in
  const UP = new THREE.Vector3(0, 1, 0), ONE = new THREE.Vector3(1, 1, 1);
  const pitch = (sl, rr, sc) => {
    const hc = height(sl.x, sl.z), e = Math.max(2, rr * 0.8), gx = (height(sl.x + e, sl.z) - height(sl.x - e, sl.z)) / (2 * e), gz = (height(sl.x, sl.z + e) - height(sl.x, sl.z - e)) / (2 * e), sln = Math.hypot(gx, gz);
    const nm = UP.clone().lerp(new THREE.Vector3(-gx, 1, -gz).normalize(), 0.6).normalize(), q = new THREE.Quaternion().setFromUnitVectors(UP, nm).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sl.ry, 0)));
    return new THREE.Matrix4().compose(new THREE.Vector3(sl.x, hc - 0.4 * Math.min(sln, 1) * rr - 0.1, sl.z), q, sc);
  };
  // a model in its slots: one instanced mesh per mesh of the file
  const modelAt = (kd, list, rrOf) => {
    const M = MODELS[kd]; if (!M || !list.length) return;
    for (const part of M.parts) {
      const im = new THREE.InstancedMesh(part.geo, part.mat, list.length); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
      list.forEach((sl, i) => im.setMatrixAt(i, pitch(sl, rrOf(sl), ONE).multiply(part.m)));
      group.add(im);
    }
  };

  // the pavilions (the fallback of every tent kind without a model): near = the full p30b tent, far = the same tent in ~1/9 of the triangles; each tent is on the side its size on the screen says (update)
  const pav = tents.filter((sl) => !MODELS[sl.kind]).map((sl) => ({ sl, mx: pitch(sl, sl.r, new THREE.Vector3(sl.k, sl.k, sl.k)), lo: false, D: 2 * sl.r }));
  let setLod = null, info_lod = null;
  if (pav.length) {
    const A = { A: 0xff00ff, B: 0xf1ead6, wall: 0xe9e1cb, hem: 0x857a60 }, geoHi = pavilionGeo(A), geoLo = pavilionGeo({ ...A, lod: 1 });
    const mk = (geo) => { const im = new THREE.InstancedMesh(geo, mat, pav.length); im.castShadow = true; im.receiveShadow = false; im.frustumCulled = false; im.setColorAt(0, pav[0].sl.col); group.add(im); return im; };   // (setColorAt first: both meshes compile the SAME shader variant)
    const hi = mk(geoHi), lo = mk(geoLo);
    const assign = () => {
      let h = 0, l = 0;
      for (const p of pav) { const im = p.lo ? lo : hi, j = p.lo ? l++ : h++; im.setMatrixAt(j, p.mx); im.setColorAt(j, p.sl.col); }
      hi.count = h; lo.count = l; hi.visible = h > 0; lo.visible = l > 0;
      for (const im of [hi, lo]) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
    };
    assign(); let sig = '';
    setLod = (camera) => {                                      // (a tent whose picture is under TENT_LO_PX high takes the far version; 20 % of hysteresis so none flickers)
      const vh = (typeof window !== 'undefined' ? window.innerHeight : 390) * Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1), tf = 2 * Math.tan((camera.fov * Math.PI) / 360), s2 = camera.position.x + ',' + camera.position.y + ',' + camera.position.z + ',' + camera.fov + ',' + vh;
      if (s2 === sig) return; sig = s2; let ch = false;
      for (const p of pav) { const d = Math.max(1, Math.hypot(camera.position.x - p.sl.x, camera.position.y - p.mx.elements[13], camera.position.z - p.sl.z)), px = (p.D / (d * tf)) * vh, lo2 = p.lo ? px < TENT_LO_PX * 1.2 : px < TENT_LO_PX; if (lo2 !== p.lo) { p.lo = lo2; ch = true; } }
      if (ch) assign();
    };
    info_lod = () => ({ hi: hi.count, lo: lo.count });
  }
  for (const kd of TENT_KINDS) modelAt(kd, tents.filter((sl) => sl.kind === kd), (sl) => sl.r);
  modelAt('palisade', fence, () => KR.palisade.len * 0.5);

  // ---- the standard: a tall pole with the ATTACKER'S crest, waving.  (BT1_R2: banner.model = the pole, the cloth stays the attacker's own)
  const uni = { value: 0 };
  {
    const x = banner.x, z = banner.z, y = height(x, z), h = MODELS.banner ? KR.banner.h : 17;
    if (MODELS.banner) modelAt('banner', [banner], () => 2);
    else {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, h, 8), new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 })); pole.position.set(x, y + h / 2 - 0.2, z); pole.castShadow = true; group.add(pole);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), new THREE.MeshStandardMaterial({ color: 0xcdb36a, roughness: 0.4, metalness: 0.6 })); ball.position.set(x, y + h - 0.1, z); group.add(ball);
      disposables.push(pole.geometry, pole.material, ball.geometry, ball.material);
    }
    const w = 7.2, hh = 4.5, fg = new THREE.PlaneGeometry(w, hh, 16, 3); fg.translate(w / 2, -hh / 2, 0);
    const m = new THREE.MeshStandardMaterial({ map: flagTex(emblem || 'swords'), roughness: 0.78, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uni;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;').replace('#include <begin_vertex>', `#include <begin_vertex>
        float k = position.x / ${w.toFixed(1)};
        transformed.z += sin(position.x * 1.5 - uTime * 4.6) * 0.42 * k;
        transformed.y += sin(position.x * 1.0 - uTime * 3.1) * 0.14 * k;`);
    };
    const f = new THREE.Mesh(fg, m); f.position.set(x, y + h - 0.6, z); f.rotation.y = yaw - Math.PI / 2; f.castShadow = true; f.frustumCulled = false; group.add(f); disposables.push(fg, m, m.map);
  }
  const slotInfo = slots.map((sl) => ({ kind: sl.kind, x: +sl.x.toFixed(2), z: +sl.z.toFixed(2), ry: +sl.ry.toFixed(3), squad: sl.squad || null, state: kstate[sl.kind] ? kstate[sl.kind].state : 'fallback' }));
  return {
    group, rect, slots: slotInfo,
    info: { Bs, back1: plan.back1, latC, poleFound, fallback, H0: +H0.toFixed(1), pole: [POLE.l, POLE.b], kinds: kstate, lod: () => (info_lod ? info_lod() : null), tents: items.map((t) => [t.q.t, +t.l.toFixed(1), +t.b.toFixed(1), +t.r.toFixed(1), +height(...at(t.l, t.b)).toFixed(1)]) },
    update(t, camera) { uni.value = t; if (setLod && camera) setLod(camera); },
    dispose() { scene.remove(group); group.traverse((o) => { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); }); disposables.forEach((d) => { try { d.dispose && d.dispose(); } catch (e) { /* ignore */ } }); },
  };
}
