// Gem vaults (owned by the "economy" workstream): one treasury hall per gem (ruby / emerald / turquoise) in front of the Blue Wall gate.
// Each hall wears a giant cut gem as its crown, a fabulous gem floats above it, and in front of the door a stone basin is heaped with
// real cut gems — the pile grows and shrinks with the wallet (n / cap), a full vault glitters and pulses.
//   planVaults()                         -> footprints (the town reserves them so no house is built there)
//   buildVaults(ctx, api)                -> { setFill({ ruby:{n,cap}, ... }), update(t, dt, camera, P), list } (before the static batch)
import * as THREE from 'three';
import * as L from './layout.js';
import { roadDist } from './roads.js';
import { marketSpot } from './terrain.js';
import { mat4 } from './util.js';
import { rng } from './noise.js';
import { gemGeometry, gemMaterial, gemPileMaterial, GEM_LOOK } from './gemgeo.js';
import { ENT, levelOf } from './skin.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = (rt, rb, h, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s);
const IDS = ['ruby', 'emerald', 'turq'];
const ROOFC = { ruby: 0xc2294a, emerald: 0x23a463, turq: 0x2f94d8 };
const PILE_N = 120;

let PLAN = null;
export function planVaults() {
  if (PLAN) return PLAN;
  PLAN = [];
  if (!L.TOWN) return PLAN;
  const G = L.GATE, nx = G.nx, nz = G.nz, tx = -nz, tz = nx, MK = marketSpot();
  const free = (x, z) => L.sdPoly(L.OUTER, x, z) >= 13 && L.sdTown(x, z) <= -42 && roadDist(x, z) >= 9
    && (!MK || Math.hypot(x - MK.x, z - MK.z) >= MK.r + 14) && L.TGATES.every((g) => Math.hypot(x - g.x, z - g.z) >= 34)
    && PLAN.every((v) => Math.hypot(x - v.x, z - v.z) >= 27);
  const targets = [[-30, 30], [30, 31], [-60, 36]];
  IDS.forEach((id, i) => {
    const [s, d] = targets[i];
    let best = null;
    for (let r = 0; r <= 16 && !best; r += 2) for (let a = 0; a < 16 && !best; a++) {
      const ang = (a / 16) * Math.PI * 2, ox = Math.cos(ang) * r, oz = Math.sin(ang) * r;
      const x = G.x + nx * d + tx * s + ox, z = G.z + nz * d + tz * s + oz;
      if (free(x, z)) best = { x, z };
    }
    if (!best) best = { x: G.x + nx * d + tx * s, z: G.z + nz * d + tz * s };
    // the door faces the main street (the axis out of the gate)
    const q = Math.max(16, (best.x - G.x) * nx + (best.z - G.z) * nz), qx = G.x + nx * q, qz = G.z + nz * q;
    PLAN.push({ id, x: best.x, z: best.z, ry: Math.atan2(qx - best.x, qz - best.z), r: 16 });
  });
  return PLAN;
}

export function buildVaults(ctx, api) {
  const { scene, M, height } = api, B = ctx.B;
  const plan = planVaults(), list = [], live = [];
  if (!plan.length) return { setFill() {}, update() {}, list };
  const R = rng(777);

  for (const V of plan) {
    const L0 = GEM_LOOK[V.id], c = Math.cos(V.ry), s = Math.sin(V.ry);
    const P = (lx, lz) => [V.x + lx * c + lz * s, V.z - lx * s + lz * c];
    const y0 = Math.max(0.3, height(V.x, V.z));
    const put = (geo, mat, m, o) => B.add(geo, mat, m, o);
    const box = (mat, lx, y, lz, sx, sy, sz, o = {}) => { const [x, z] = P(lx, lz); put(BOX, mat, mat4(x, y, z, V.ry, sx, sy, sz), o); };
    const stoneUV = { worldUV: 0.1 };
    B.tag(ENT['vault_' + V.id]);
    ctx.tgt({ type: 'vault', gem: V.id, x: V.x, z: V.z, w: 17, d: 14, h: 14, rot: V.ry });

    // ---- base + steps + hall
    box(M.stoneDark, 0, y0 + 0.45, 0, 17, 1.1, 14, { ...stoneUV, tint: 0xb4bac8 });
    for (let k = 0; k < 3; k++) box(M.stone, 0, y0 + 0.15 + k * 0.28, 8 - k * 0.7, 6.4 - k * 0.6, 0.3, 1.2, { ...stoneUV, tint: 0xd8dae2 });
    box(M.stone, 0, y0 + 4.6, 0, 12.2, 7.8, 9.4, { ...stoneUV, tint: 0xe6e2da });
    box(M.stoneDark, 0, y0 + 8.65, 0, 13.2, 0.7, 10.4, { ...stoneUV, tint: 0x9aa0ad });                      // cornice
    box(M.stoneDark, 0, y0 + 1.4, 0, 12.9, 0.6, 10.1, { ...stoneUV, tint: 0xb9bdc8 });                       // skirting
    for (const e of [-1, 1]) box(M.rune, e * 6.14, y0 + 5.2, 0, 0.1, 1.1, 8.4, { uvScale: [0.8, 1] });         // glowing rune bands on the flanks
    box(M.rune, 0, y0 + 5.4, 4.76, 10.4, 1.0, 0.1, { uvScale: [0.9, 1] });
    // gem-coloured trim: gold frame + gem inlays
    box(M.gold, 0, y0 + 8.25, 4.78, 11.6, 0.28, 0.2); box(M.gold, 0, y0 + 2.1, 4.78, 11.6, 0.28, 0.2);
    // corner towers with gem-coloured spires
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const [x, z] = P(sx * 6.3, sz * 5.1);
      put(CYL(1.55, 1.8, 9.2, 10), M.stone, mat4(x, y0 + 4.8, z), { ...stoneUV, tint: 0xd9d6d0 });
      put(CYL(1.8, 1.9, 0.5, 10), M.stoneDark, mat4(x, y0 + 9.5, z), { ...stoneUV, tint: 0x9aa0ad });
      put(new THREE.ConeGeometry(2.1, 3.6, 10, 1, true), M.roof, mat4(x, y0 + 11.5, z), { tint: ROOFC[V.id], uvScale: [3, 2] });
      put(new THREE.SphereGeometry(0.3, 8, 6), M.gold, mat4(x, y0 + 13.5, z));
    }
    // door: arch of dark wood with golden bars, flanking pillars with braziers
    box(M.stoneDark, 0, y0 + 3.0, 4.74, 4.6, 5.4, 0.7, { ...stoneUV, tint: 0xa9adb8 });
    box(M.dark, 0, y0 + 2.7, 4.98, 3.2, 4.6, 0.2);
    for (let k = -1.4; k <= 1.41; k += 0.7) box(M.gold, k, y0 + 2.7, 5.12, 0.1, 4.6, 0.1);
    for (const e of [-1, 1]) {
      box(M.stone, e * 3.1, y0 + 2.6, 5.5, 0.9, 5.2, 0.9, { ...stoneUV, tint: 0xe6e2da });
      const [bx, bz] = P(e * 3.1, 5.5);
      ctx.torch(bx, y0 + 5.5, bz, { pool: true });
    }
    // banner with the crest
    { const [bx, bz] = P(0, 4.9); ctx.banner(bx, y0 + 7.2, bz, V.ry, 2.6, 2.4); }

    // ---- the pile basin in front of the door
    const [px, pz] = P(0, 11.6), bry = y0 + 0.5;
    put(CYL(4.1, 4.4, 1.0, 20), M.stoneDark, mat4(px, bry, pz), { ...stoneUV, tint: 0xb4bac8 });
    put(new THREE.TorusGeometry(4.1, 0.28, 6, 24).rotateX(Math.PI / 2), M.gold, mat4(px, bry + 0.52, pz));
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, [qx, qz] = [px + Math.cos(a) * 4.5, pz + Math.sin(a) * 4.5]; put(CYL(0.22, 0.22, 1.6, 6), M.gold, mat4(qx, y0 + 0.8, qz)); }
    ctx.pool(px, y0 + 0.06, pz, 9, [GEM_LOOK[V.id].glow >> 16 & 255, GEM_LOOK[V.id].glow >> 8 & 255, GEM_LOOK[V.id].glow & 255].map((v) => v / 255), 0.28);
    // ---- the live parts: gem crown, floating hero gem, glow, pile
    const geo = gemGeometry(V.id);
    const crown = new THREE.Mesh(geo, gemMaterial(V.id, { envMapIntensity: 1.25, glow: 0.32 }));
    const [cx, cz] = P(0, 0); crown.position.set(cx, y0 + 8.9, cz); crown.scale.set(5.2, 5.2, 5.2); crown.rotation.y = V.ry; scene.add(crown);
    const hero = new THREE.Mesh(geo, gemMaterial(V.id, { envMapIntensity: 1.6, glow: 0.45 })); hero.scale.setScalar(1.7); scene.add(hero);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowWhite, color: L0.glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 }));
    glow.scale.setScalar(12); scene.add(glow);
    // pile: gems heaped in a mound; the first N (lowest) are shown for a fill of N / PILE_N
    const pile = new THREE.InstancedMesh(geo, gemPileMaterial(V.id), PILE_N); pile.name = 'gem-pile-' + V.id;
    const spots = [];
    for (let i = 0; i < PILE_N; i++) {
      const rr = 3.1 * Math.sqrt(R()), a = R() * 6.283, h = 0.4 + 1.9 * Math.pow(1 - rr / 3.3, 1.5) + R() * 0.25;
      spots.push({ x: Math.cos(a) * rr, z: Math.sin(a) * rr, y: h, sc: 0.5 + R() * 0.38, rx: (R() - 0.5) * 1.6, ry: R() * 6.283, rz: (R() - 0.5) * 1.6 });
    }
    spots.sort((p, q) => p.y + R() * 0.5 - (q.y + R() * 0.5));
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler();
    spots.forEach((sp, i) => { m4.compose(new THREE.Vector3(px + sp.x, bry + 0.55 + sp.y * 0.9, pz + sp.z), q4.setFromEuler(e4.set(sp.rx, sp.ry, sp.rz)), new THREE.Vector3(sp.sc, sp.sc, sp.sc)); pile.setMatrixAt(i, m4); });
    pile.instanceMatrix.needsUpdate = true; pile.count = Math.round(PILE_N * 0.5); pile.castShadow = false; pile.frustumCulled = false; scene.add(pile);
    ctx.live(crown, hero, glow, pile);
    B.tag(0); B.bid(0);
    ctx.pick({ x: V.x, z: V.z, y0: 0, y1: y0 + 14, r: 9 }, 'vault_' + V.id);
    const top = new THREE.Vector3(V.x, y0 + 17, V.z);
    list.push({ id: V.id, x: V.x, y: y0, z: V.z, ry: V.ry, top, pileCenter: new THREE.Vector3(px, bry, pz) });
    live.push({ id: V.id, crown, hero, glow, pile, top, f: 0.5, target: 0.5, mats: [crown.material, hero.material, pile.material], baseY: y0 + 15.2 });
    ctx.levelHooks.push(() => { const k = (levelOf('vault_' + V.id) - 1) / 19; crown.scale.setScalar(3.6 + 1.9 * k); hero.scale.setScalar(1.2 + 0.7 * k); });
  }

  let night = 0;
  return {
    list,
    setFill(w) {
      for (const v of live) { const q = w && w[v.id]; if (!q || !(q.cap > 0)) continue; v.target = Math.min(1, Math.max(0, q.n / q.cap)); }
    },
    update(t, dt, camera, P) {
      night = P ? P.night : night;
      for (const v of live) {
        v.f += (v.target - v.f) * Math.min(1, dt * 2.2);                              // the pile rises / sinks smoothly
        const n = Math.round(PILE_N * v.f), full = v.target > 0.985;
        if (v.pile.count !== n) v.pile.count = n;
        v.hero.position.set(v.top.x, v.baseY + Math.sin(t * 1.3 + v.id.length) * 0.45, v.top.z); v.hero.rotation.y = t * 0.7;
        v.glow.position.copy(v.hero.position);
        const pulse = full ? 0.75 + 0.25 * Math.sin(t * 4) : 0.9;
        v.glow.material.opacity = (0.22 + 0.35 * v.f + night * 0.3) * pulse; v.glow.scale.setScalar(10 + 5 * v.f + (full ? 2 * Math.sin(t * 4) : 0));
        const e = 0.22 + night * 0.5 + (full ? 0.25 + 0.2 * Math.sin(t * 4) : 0);
        v.mats[0].emissiveIntensity = 0.25 + night * 0.4; v.mats[1].emissiveIntensity = e + 0.2; v.mats[2].emissiveIntensity = 0.2 + night * 0.35 + (full ? 0.2 : 0);
      }
    },
  };
}
