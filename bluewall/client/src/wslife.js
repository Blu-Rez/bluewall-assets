// Life on the worksites (p38, owner 6 Oct 2026: «بزرگ‌تر یعنی ماهی‌گیرها بیشتر بشن، دام‌ها بیشتر» — the numbers grow with the level): the people, animals, boats and carts
// that work the sites of worksites.js.  Everything is a GPU crowd instance (crowd.js: baked skeleton animation, 2-5 draws per kind) or a plain InstancedMesh (boats, carts, loads).
//   buildWsLife(group, height, { models, kit, cow, horse, sheep, pig, shadows, castle }) -> { steps: [fn…], update(t, dt, camera), refresh(castle), stats() }
//     steps = the heavy part split in pieces (create the crowds, then populate) so the loading screen / late jobs never stall for long.
// Per site and level (counts(site, lv)): workers walk between the work spots of their trade and play the matching clip (chop, hammer, kneel, tend…); animals graze in their pens;
// fishing boats patrol the water with a fisherman sitting in each; horse-drawn carts carry the product along the haul road and the country roads to the storehouse (stores.js) and back.
// Cart / boat positions are pure functions of time (nothing to keep in sync); workers and animals are small state machines that only run near the camera.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import * as L from './layout.js';
import { ROADS } from './roads.js';
import { createKind } from './crowd.js';
import { peasantHeadProp } from './peasanthead.js';
import { mergeSkinned } from './creature.js';
import { axeProp, AXE_GRIP } from './gear_axe.js';
import { crowdShadows, cowPatch, coatPatch, smoothSkinned, measure, prepHorse, scaleK } from './pas_life.js';
import { sites, counts, wsLevel, tierOf } from './worksites.js';
import { planStores } from './stores.js';

const PS = 1.75 * 0.95;                         // the people's scale (pas_life.js)
const rnd = (() => { let s = 90210; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
const R2 = (a, b) => a + (b - a) * rnd();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const toW = (s, lx, lz) => [s.x + lx * Math.cos(s.ry) + lz * Math.sin(s.ry), s.z - lx * Math.sin(s.ry) + lz * Math.cos(s.ry)];
const WORK_DIST = 300, FAR_DIST = 460;           // m from the camera: workers / animals are simulated inside WORK_DIST, crowds drawn inside FAR_DIST

// ------------------------------------------------------------------------------------------------ the trades: where a worker goes and what he does there (site-local metres)
// task: [x, z, faceX, faceZ, clip, minSec, maxSec]   (he stands at x,z looking at faceX,faceZ)
const K = (x, z, fx, fz, clip, a = 6, b = 12) => ({ x, z, fx, fz, clip, a, b });
const TRADES = {
  lumber: [
    { k: 'axe', w: 3, tasks: [K(-8.5, -14.5, -12, -17, 'Sword_Attack', 8, 15), K(10.5, -15.5, 13, -18, 'Sword_Attack', 8, 15), K(-3, -13, -2, -17, 'Sword_Attack', 8, 15), K(3.5, -13.5, 4, -17, 'Sword_Attack', 8, 15), K(-7, 11.5, -7, 9, 'Fixing_Kneeling', 5, 9)] },
    { k: 'man', w: 2, tasks: [K(8.2, 4.8, 9.5, 3, 'Interact', 6, 11), K(1.5, -1.5, 0, -6, 'Interact', 5, 9), K(-7, 11.5, -7, 9, 'Fixing_Kneeling', 5, 9), K(-4, 7, -4, 5, 'Idle_Talking_Loop', 5, 9)] },
  ],
  quarry: [
    { k: 'pick', w: 3, tasks: [K(-8, -11, -8, -15, 'Sword_Attack', 8, 14), K(9, -13, 9, -17, 'Sword_Attack', 8, 14), K(0, -16, 0, -20, 'Sword_Attack', 8, 14), K(-3, -6.5, -3, -9, 'Interact', 5, 9)] },
    { k: 'man', w: 2, tasks: [K(6, 3.4, 6, 5, 'Interact', 6, 11), K(-11, 1.5, -13, 3, 'Fixing_Kneeling', 5, 9), K(8, 8, 8, 6.5, 'Interact', 5, 8), K(-4, 10, -4, 8, 'Idle_Talking_Loop', 5, 9)] },
  ],
  iron: [
    { k: 'pick', w: 3, tasks: [K(0, -6, 0, -10, 'Sword_Attack', 8, 14), K(-3.5, 8, -3, 10, 'Fixing_Kneeling', 6, 10), K(3.5, 7, 3, 9, 'Fixing_Kneeling', 6, 10)] },
    { k: 'man', w: 2, tasks: [K(-12.5, 2.5, -15, 0, 'Interact', 7, 12), K(-9, 4.5, -9, 6, 'Interact', 6, 10), K(9, 1.5, 9, 3, 'Interact', 6, 10), K(-8, 9, -8, 12, 'Fixing_Kneeling', 5, 9)] },
  ],
  gold: [
    { k: 'pick', w: 2, tasks: [K(0, -6, 0, -10, 'Sword_Attack', 8, 14), K(-3.5, 8, -3, 10, 'Fixing_Kneeling', 6, 10)] },
    { k: 'man', w: 3, tasks: [K(-9, 9, -9, 11, 'Fixing_Kneeling', 6, 11), K(6, 10, 7, 12, 'Fixing_Kneeling', 6, 11), K(10, 3, 9, 4.5, 'Interact', 6, 10), K(-13, 4, -15, 2, 'Interact', 6, 10), K(8, 6, 8, 8, 'Idle_Talking_Loop', 5, 9)] },
  ],
  farm: (lv) => {
    const slots = [[-20, -2], [20, -2], [-20, 7], [20, 7], [-20, -11], [20, -11], [-6, -22], [8, -22]], n = counts({ kind: 'farm' }, lv).plots;
    const plots = slots.slice(0, n).map(([cx, cz]) => K(cx, cz + 4.6, cx, cz, 'Fixing_Kneeling', 8, 16));
    return [{ k: 'man', f: 0, w: 2, tasks: [...plots, K(0, -3.5, 0, -9, 'Interact', 5, 8), K(5, 5, 6, 3.5, 'Interact', 5, 8)] }, { k: 'woman', f: 1, w: 2, tasks: [...plots, K(-6, 5, -6, 3, 'Interact', 5, 9), K(-12, -0.5, -12, -3, 'Interact', 5, 9)] }];
  },
  livestock: (lv) => {
    const cells = [[-9, 4], [9, 4], [-9, 16], [9, 16]], n = counts({ kind: 'livestock' }, lv).pens;
    const t = []; for (let i = 0; i < n; i++) { const [cx, cz] = cells[i]; t.push(K(cx - 3, cz + 4.6, cx - 3, cz + 2.6, 'Interact', 6, 11), K(cx + 3.4, cz - 4.6, cx + 3.4, cz - 1.6, 'Fixing_Kneeling', 5, 9)); }
    t.push(K(0, 7, 0, 9, 'Idle_Talking_Loop', 5, 9), K(-15, -4, -17, -4, 'Interact', 5, 8));
    return [{ k: 'man', w: 3, tasks: t }, { k: 'woman', f: 1, w: 1, tasks: t }];
  },
  fishery: [
    { k: 'woman', f: 1, w: 3, tasks: [K(-9, 8, -9, 6, 'Interact', 6, 10), K(-3, 8, -3, 6, 'Interact', 6, 10), K(3, 8, 3, 6, 'Interact', 6, 10), K(9, 8, 9, 6, 'Interact', 6, 10), K(-10, -1.5, -10, -4, 'Fixing_Kneeling', 6, 10), K(10, -1.5, 10, -4, 'Fixing_Kneeling', 6, 10)] },
    { k: 'man', w: 3, tasks: [K(-5, -6.5, -5, -9, 'Interact', 5, 9), K(2, -6.5, 2, -9, 'Interact', 5, 9), K(0, 5, 0, 9, 'Idle_Talking_Loop', 5, 9), K(-14, 0, -14, -2.5, 'Fixing_Kneeling', 6, 10)] },
  ],
  slaughter: [
    { k: 'man', w: 3, tasks: [K(0, -1, 0, -6, 'Interact', 6, 11), K(11, -2.2, 11, -4, 'Interact', 6, 11), K(6, 2, 6, 0, 'Interact', 5, 9), K(9, 5.6, 9, 4, 'Interact', 6, 11), K(-5, 6, -5, 4.5, 'Interact', 5, 9)] },
    { k: 'woman', f: 1, w: 1, tasks: [K(-3, 7.5, -3, 9, 'Fixing_Kneeling', 5, 9), K(2, 6.5, 2, 4.5, 'Interact', 5, 9)] },
  ],
  greenhouse: (lv) => {
    const slots = [[-6.2, -9], [6.2, -9], [-6.2, -2.6], [6.2, -2.6], [-6.2, 3.8], [6.2, 3.8]], n = counts({ kind: 'greenhouse' }, lv).houses;
    const t = []; for (let i = 0; i < n; i++) { const [cx, cz] = slots[i]; t.push(K(cx - 2, cz, cx - 2, cz + 1.25, 'Fixing_Kneeling', 8, 14), K(cx + 2, cz, cx + 2, cz - 1.25, 'Fixing_Kneeling', 8, 14)); }
    return [{ k: 'woman', f: 1, w: 3, tasks: [...t, K(-8, 7.5, -8, 9, 'Interact', 5, 9)] }, { k: 'man', w: 2, tasks: [K(0, 8, 3, 9, 'Interact', 5, 9), K(8, 8, 6, 9, 'Fixing_Kneeling', 5, 9), ...t.slice(0, 2)] }];
  },
  oil: (lv) => {
    const spots = [[0, 0, 3.6], [-8.5, -5, 2.8], [8, -4, 2.8], [-5, 5.5, 2.4], [6.5, 6, 2.4], [-12, 1, 2.2], [12, 2, 2.2]], n = counts({ kind: 'oil' }, lv).wells;
    const w = []; for (let i = 0; i < n; i++) { const [cx, cz, r] = spots[i]; w.push(K(cx, cz + r + 2.8, cx, cz + r + 1.2, 'Interact', 7, 12)); }
    return [{ k: 'man', w: 3, tasks: w }, { k: 'man', w: 2, tasks: [K(-6, 11, -6, 9.5, 'Fixing_Kneeling', 6, 10), K(5, 11, 5, 9.5, 'Fixing_Kneeling', 6, 10), K(0, 18, 0, 20, 'Idle_Talking_Loop', 6, 11), K(-9, 18, -10, 20, 'Interact', 5, 9)] }];
  },
};
const tradesOf = (site, lv) => { const t = TRADES[site.kind]; return typeof t === 'function' ? t(lv) : t; };

// the pens / yards where animals live: [kind, cx, cz, halfW, halfD, max]
function pensOf(site, lv) {
  const c = counts(site, lv), out = [];
  if (site.kind === 'livestock') {
    const cells = [[-9, 4, 'cow', 5], [9, 4, 'sheep', 10], [-9, 16, 'pig', 8], [9, 16, 'horse', 4]];
    for (let i = 0; i < c.pens; i++) out.push({ sp: cells[i][2], cx: cells[i][0], cz: cells[i][1], hw: 4.6, hd: 2.8, max: cells[i][3] });
  } else if (site.kind === 'farm') out.push({ sp: 'cow', cx: -5, cz: 12, hw: 8, hd: 4, max: 4 }, { sp: 'sheep', cx: 6, cz: 12, hw: 7, hd: 4, max: 6 }, { sp: 'horse', cx: 0, cz: 17.5, hw: 4, hd: 1.5, max: 2 });
  else if (site.kind === 'slaughter') out.push({ sp: 'pig', cx: -2, cz: 11.4, hw: 7, hd: 1.2, max: 4 }, { sp: 'sheep', cx: 2, cz: 11.4, hw: 7, hd: 1.2, max: 3 });
  return out;
}

// ------------------------------------------------------------------------------------------------ the haul roads: a graph over ROADS, shortest path site -> storehouse
let GRAPH = null;
export function graph() {
  if (GRAPH) return GRAPH;
  const N = [], H = new Map(), key = (x, z) => Math.floor(x / 8) + ',' + Math.floor(z / 8);
  const add = (x, z, road) => { const i = N.push({ x, z, e: [], road }) - 1, k = key(x, z); if (!H.has(k)) H.set(k, []); H.get(k).push(i); return i; };
  const link = (a, b) => { const d = Math.hypot(N[a].x - N[b].x, N[a].z - N[b].z); N[a].e.push([b, d]); N[b].e.push([a, d]); };
  for (const r of ROADS) {
    let prev = -1, first = -1;
    for (let i = 0; i < r.pts.length - 1 + (r.closed ? 1 : 0); i++) {
      const a = r.pts[i], b = r.pts[(i + 1) % r.pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(len / 7));
      for (let k = 0; k < n; k++) { const t = k / n, id = add(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, r.name); if (prev >= 0) link(prev, id); else first = id; prev = id; }
    }
    const lastP = r.pts[r.closed ? 0 : r.pts.length - 1], id = add(lastP[0], lastP[1], r.name); if (prev >= 0) link(prev, id);
    if (r.closed && first >= 0) link(id, first);
  }
  for (let i = 0; i < N.length; i++) {                           // crossings / T-junctions: nodes of different roads within 6 m
    const kx = Math.floor(N[i].x / 8), kz = Math.floor(N[i].z / 8);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const j of H.get((kx + dx) + ',' + (kz + dz)) || []) if (j > i && N[j].road !== N[i].road && Math.hypot(N[i].x - N[j].x, N[i].z - N[j].z) < 6) link(i, j);
  }
  return (GRAPH = { N, H, near(x, z) { let b = -1, bd = 1e9; for (let i = 0; i < N.length; i++) { const d = (N[i].x - x) ** 2 + (N[i].z - z) ** 2; if (d < bd) { bd = d; b = i; } } return b; } });
}
export function shortest(a, b) {                                        // Dijkstra (binary heap)
  const { N } = graph(), dist = new Float64Array(N.length).fill(1e9), prev = new Int32Array(N.length).fill(-1), heap = [[0, a]]; dist[a] = 0;
  const push = (it) => { heap.push(it); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  while (heap.length) { const [d, u] = pop(); if (d > dist[u]) continue; if (u === b) break; for (const [v, w] of N[u].e) if (d + w < dist[v]) { dist[v] = d + w; prev[v] = u; push([d + w, v]); } }
  if (dist[b] >= 1e9) return null; const out = []; for (let u = b; u >= 0; u = prev[u]) out.push([N[u].x, N[u].z]); return out.reverse();
}
const STORE_OF = { lumber: 'wood', quarry: 'stone', iron: 'iron', gold: 'gold', oil: 'oil', farm: 'food', livestock: 'food', fishery: 'food', slaughter: 'food', greenhouse: 'food' };
export function haulRoute(site) {
  try {
    const st = planStores().find((s) => s.id === STORE_OF[site.kind]); if (!st) return null;
    const G = graph(), front = toW(site, 0, site.r * 0.55), a = G.near(front[0], front[1]), b = G.near(st.x, st.z);
    const path = shortest(a, b); if (!path || path.length < 2) return null;
    const route = [[front[0], front[1]], ...path, [st.x + Math.sin(st.ry) * 6, st.z + Math.cos(st.ry) * 6]];
    const cum = [0]; for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]));
    return { pts: route, cum, len: cum[cum.length - 1] };
  } catch (e) { console.warn('haulRoute', site.id, e); return null; }
}
function alongRoute(rt, s, out) {                                // position + heading at distance s
  s = Math.max(0, Math.min(rt.len, s)); let i = 1; while (i < rt.cum.length - 1 && rt.cum[i] < s) i++;
  const a = rt.pts[i - 1], b = rt.pts[i], seg = rt.cum[i] - rt.cum[i - 1] || 1, t = (s - rt.cum[i - 1]) / seg;
  out.x = a[0] + (b[0] - a[0]) * t; out.z = a[1] + (b[1] - a[1]) * t; out.yaw = Math.atan2(b[0] - a[0], b[1] - a[1]); return out;
}

// ------------------------------------------------------------------------------------------------ an instanced copy of a kit piece (all of its parts)
function instOf(kit, name, cap, shadows) {
  const node = kit && kit.scene.getObjectByName(name); if (!node) return null;
  node.updateWorldMatrix(true, true); const inv = new THREE.Matrix4().copy(node.matrixWorld).invert(), parts = [];
  node.traverse((o) => { if (o.isMesh) { const g = o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); if (!g.attributes.normal) g.computeVertexNormals(); const mat = Array.isArray(o.material) ? o.material[0] : o.material; parts.push({ g, mat }); } });
  const meshes = parts.map(({ g, mat }) => { const m = mat.clone(); if (!/Glass|Fence|Banner|Cloth/i.test(m.name)) m.side = THREE.FrontSide; const im = new THREE.InstancedMesh(g, m, cap); im.count = 0; im.frustumCulled = false; im.castShadow = !!shadows; im.receiveShadow = true; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); return im; });
  const box = new THREE.Box3().setFromObject(node);
  return { meshes, size: box.getSize(new THREE.Vector3()), set(i, m) { for (const im of meshes) im.setMatrixAt(i, m); }, flush(n) { for (const im of meshes) { im.count = n; im.instanceMatrix.needsUpdate = true; im.visible = n > 0; } } };
}

// hand tools of the trades (flat-coloured props in the frame of gear_axe.js: shaft along +y, the grip at the origin)
function toolProp(kind) {
  const g = new THREE.Group(), col = (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.8, metalness: 0.1, name: 'tool' });
  const add = (geo, hex, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const n = geo.attributes.position.count, c = new THREE.Color(hex), a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); geo.rotateX(rx); geo.rotateY(ry); geo.rotateZ(rz); geo.translate(x, y, z); const m = new THREE.Mesh(geo, col(0xffffff)); g.add(m); };
  if (kind === 'pick') {            // a miner's pick: ash haft, an iron head with two curved points
    add(new THREE.CylinderGeometry(0.013, 0.016, 0.62, 6), 0x7a5a3a, 0, 0.12, 0);
    add(new THREE.BoxGeometry(0.2, 0.03, 0.03), 0x59616c, 0, 0.44, 0);
    add(new THREE.ConeGeometry(0.018, 0.12, 6), 0x59616c, -0.14, 0.44, 0, 0, 0, Math.PI / 2 + 0.2); add(new THREE.ConeGeometry(0.018, 0.12, 6), 0x59616c, 0.14, 0.44, 0, 0, 0, -Math.PI / 2 - 0.2);
  } else if (kind === 'rod') {      // a fishing rod: a long thin cane, a reel, a hint of line
    add(new THREE.CylinderGeometry(0.004, 0.011, 1.15, 5), 0x8a6a46, 0, 0.45, 0, 0, 0, 0.35); add(new THREE.CylinderGeometry(0.003, 0.003, 0.5, 4), 0xdfe3ea, 0.33, 0.95, 0.0, 0, 0, 0.02);
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8), 0x3b4048, 0.03, 0.05, 0.03, Math.PI / 2, 0, 0);
  }
  return { scene: g };
}

// ------------------------------------------------------------------------------------------------ the world of the sites
export function buildWsLife(group, height, opt) {
  const { models = {}, kit = null, shadows = false } = opt;
  const anims = models.anims, root = new THREE.Group(); root.name = 'wslife'; group.add(root);
  const kinds = {}, agents = [], animals = [], carts = [], boats = [], alive = { people: false, animals: false };
  const MOVE = 1.35;                                          // m/s a worker walks at
  let castle = opt.castle || 30, populated = false;

  // ---- step 1: the people (4 kinds), 2: the animals (cow, horse, sheep, pig), 3: boats / carts meshes, 4: populate
  const makePeople = () => {
    if (!anims || !models.peasant_m || !models.peasant_f) return;
    const base = ['Idle_Loop', 'Walk_Loop'], lod2 = (cloth, legs) => ({ cloth, legs, h: 1.8 });
    const mk = (m, fem, extra, clips, cap, props = []) => { const k = createKind({ gltf: m, anims, clips: [...base, ...clips], capacity: cap, fps: 15, props: [peasantHeadProp(fem, fem ? 1 : 0), ...props], lod2: lod2(fem ? 0x7d5b4a : 0x6e5a42, fem ? 0x4a3a30 : 0x3b3129) }); k.people = true; crowdShadows(k, shadows); root.add(k.group); return k; };
    kinds.man = mk(models.peasant_m, false, 0, ['Interact', 'Fixing_Kneeling', 'Idle_Talking_Loop', 'Sitting_Idle_Loop', 'Idle_Torch_Loop'], 110);
    kinds.axe = mk(models.peasant_m, false, 0, ['Sword_Attack', 'Fixing_Kneeling'], 40, [{ gltf: axeProp({ blued: false }), bone: 'hand_r', s: 0.6, pos: AXE_GRIP.pos, rot: AXE_GRIP.rotDeg.map((d) => d * Math.PI / 180) }]);
    kinds.pick = mk(models.peasant_m, false, 0, ['Sword_Attack', 'Interact', 'Fixing_Kneeling'], 60, [{ gltf: toolProp('pick'), bone: 'hand_r', s: 1.0, pos: [0, 0, 0], rot: [Math.PI / 2, -Math.PI / 2, 0] }]);
    kinds.woman = mk(models.peasant_f, true, 1, ['Interact', 'Fixing_Kneeling', 'Idle_Talking_Loop'], 60);
    kinds.rod = mk(models.peasant_m, false, 0, ['Idle_Torch_Loop', 'Sitting_Idle_Loop'], 24, [{ gltf: toolProp('rod'), bone: 'hand_r', s: 1.0, pos: [0, 0, 0], rot: [Math.PI / 2, -Math.PI / 2, 0] }]);
    alive.people = true;
  };
  const sizeOf = {};
  const makeAnimals = () => {
    const animKind = (src, clips, cap, patch) => {
      const k = createKind({ gltf: { scene: src, animations: src.userData.pasClips }, anims: { animations: src.userData.pasClips }, clips, capacity: cap, fps: 20 });
      if (patch) patch(k); crowdShadows(k, shadows); root.add(k.group); return k;
    };
    const fit = (src, len) => { const M = measure(src, [], []); return { k: len / Math.max(M.size.x, M.size.z), y: -M.minY, M }; };
    if (models.cow) {
      const src = SkeletonUtils.clone(models.cow.scene); mergeSkinned(src); smoothSkinned(src); src.userData.pasClips = models.cow.animations;
      const clips = ['Idle', 'Idle_2', 'Idle_Headlow', 'Eating', 'Walk'].filter((n) => models.cow.animations.some((a) => a.name === n));
      kinds.cow = animKind(src, clips, 40, cowPatch); const f = fit(src, 3.3); kinds.cow.fit = { k: f.k, y: f.y * f.k }; kinds.cow.has = (n) => clips.includes(n);
    }
    if (models.horse) {
      const src = prepHorse(models.horse); const clips = ['Idle', 'Eating', 'Walk'].filter((n) => models.horse.animations.some((a) => a.name === n));
      kinds.horse = animKind(src, clips, 40, null); const f = fit(src, 3.4); kinds.horse.fit = { k: f.k, y: f.y * f.k }; kinds.horse.has = (n) => clips.includes(n);
      if (opt.coats && opt.coats.length) coatPatch(kinds.horse, [null, ...opt.coats]);
    }
    for (const [id, g, len] of [['sheep', opt.sheep, 1.6], ['pig', opt.pig, 1.8]]) {
      if (!g) continue;
      const src = SkeletonUtils.clone(g.scene); mergeSkinned(src); src.userData.pasClips = g.animations;
      const clips = ['Idle', 'Jump'].filter((n) => g.animations.some((a) => a.name === n));
      kinds[id] = animKind(src, clips, 40, null); const f = fit(src, len); kinds[id].fit = { k: f.k, y: f.y * f.k }; kinds[id].has = (n) => clips.includes(n);
    }
    alive.animals = true;
  };
  // carts and boats: kit pieces as instanced meshes
  let boatI = null; const cartI = {}, loadI = {};
  const makeMeshes = () => {
    if (!kit) return;
    boatI = instOf(kit, 'ws_rowboat', 24, shadows); if (boatI) boatI.meshes.forEach((m) => root.add(m));
    for (const n of ['ws_cart1', 'ws_cart2', 'ws_cart3']) { const c = instOf(kit, n, 24, shadows); if (c) { cartI[n] = c; c.meshes.forEach((m) => root.add(m)); } }
    for (const n of ['ws_logs', 'ws_stoneblocks', 'ws_boulderA', 'ws_goldbars', 'ws_barrelold', 'ws_farmcrate_apple', 'ws_sack', 'ws_barrel', 'ws_fishset', 'ws_farmcrate_empty']) { const c = instOf(kit, n, 120, shadows); if (c) { loadI[n] = c; c.meshes.forEach((m) => root.add(m)); } }
  };

  // ---- people on a site
  const person = (kindName, x, z, yaw, clip, phase) => {
    const k = kinds[kindName]; if (!k) return null;
    const p = k.add({ x, y: height(x, z), z, yaw, scale: PS, clip, phase }); p.cr = 2.6; p.kind = k; return p;
  };
  const setClip = (a, clip) => { if (a.clip !== clip) { a.clip = clip; a.p.play(clip); } };
  const pickTask = (a) => {
    const S = a.S, busy = S.busy; let best = null;
    for (let tries = 0; tries < 8; tries++) { const t = a.role.tasks[(rnd() * a.role.tasks.length) | 0]; if (t !== a.task && !busy.has(t)) { best = t; break; } }
    return best || a.role.tasks[(rnd() * a.role.tasks.length) | 0];
  };
  function spawnSite(site, lv) {
    const S = { site, lv, agents: [], animals: [], busy: new Set(), carts: [], boats: [] };
    const c = counts(site, lv), trades = tradesOf(site, lv) || [];
    if (alive.people && trades.length) {
      const total = trades.reduce((s, t) => s + t.w, 0), nW = Math.max(0, c.workers - (site.kind === 'fishery' ? (c.fishermen || 0) : 0));
      for (let i = 0; i < nW; i++) {
        let r = ((i * 0.618) % 1) * total, role = trades[0]; for (const t of trades) { if (r < t.w) { role = t; break; } r -= t.w; }
        const t0 = role.tasks[i % role.tasks.length], [wx, wz] = toW(site, t0.x, t0.z);
        const p = person(role.k, wx, wz, site.ry, 'Idle_Loop', rnd() * 3); if (!p) continue;
        const a = { p, S, role, task: t0, state: 'work', t: R2(0, t0.b), clip: null, cd: 0, gx: wx, gz: wz }; p.yaw = site.ry + Math.atan2(t0.fx - t0.x, t0.fz - t0.z); setClip(a, t0.clip);
        S.busy.add(t0); S.agents.push(a); agents.push(a);
      }
    }
    // fishermen: on the jetty tip (rod, standing) and in the moving boats (sitting)
    if (site.kind === 'fishery') spawnFishery(S, c);
    // animals in the pens
    const pens = pensOf(site, lv); let left = c.animals || 0;
    for (const pen of pens) {
      const k = kinds[pen.sp]; if (!k || left <= 0) continue;
      const n = Math.min(pen.max, Math.ceil(left / Math.max(1, pens.filter((q) => q.max > 0).length))); left -= n;
      for (let i = 0; i < n; i++) {
        const lx = pen.cx + (rnd() * 2 - 1) * pen.hw * 0.85, lz = pen.cz + (rnd() * 2 - 1) * pen.hd * 0.85, [wx, wz] = toW(site, lx, lz), sc = k.fit.k * R2(0.92, 1.08);
        const p = k.add({ x: wx, y: height(wx, wz), z: wz, yaw: rnd() * 6.28, scale: pen.sp === 'cow' ? scaleK(sc, (rnd() * 5) | 0) : pen.sp === 'horse' ? scaleK(sc, (rnd() * 3) | 0) : sc }); p.cr = 3; p.lift = k.fit.y * (sc / k.fit.k);
        p.y += p.lift; const an = { p, S, sp: pen.sp, pen, k, state: 'stand', t: R2(1, 6), clip: null, walks: pen.sp === 'cow' || pen.sp === 'horse', tx: 0, tz: 0, lx, lz };
        const first = pen.sp === 'sheep' || pen.sp === 'pig' ? 'Idle' : (rnd() < 0.6 ? (k.has('Eating') ? 'Eating' : 'Idle') : 'Idle'); p.play(first, { fade: false, offset: rnd() * 2 }); an.clip = first; an.state = first === 'Eating' ? 'graze' : 'stand';
        S.animals.push(an); animals.push(an);
      }
    }
    if (c.carts && kit) spawnCarts(S, c.carts);
    return S;
  }
  const SITES_LIFE = new Map();
  // what sits on the cart bed: scale + [x along the cart, z across, lift, yaw] per piece (kit sizes: logs 4.5 m, stone 3.6, boulder 4, sack 1 m long across)
  const BED = 1.1, LOAD_CAP = 120;
  const grid = (xs, zs, ys, h) => { const o = []; for (const y of ys) for (const x of xs) for (const z of zs) o.push([x, z, y * h, 0]); return o; };
  const LOADS = {
    ws_logs: { s: 0.8, it: [[0, 0, 0, 0]] }, ws_stoneblocks: { s: 0.5, it: [[-1.0, 0, 0, 0], [1.0, 0.05, 0, 0.3]] }, ws_boulderA: { s: 0.42, it: [[-1.0, 0.05, 0, 0.5], [1.0, -0.05, 0, 2.1]] },
    ws_goldbars: { s: 1, it: grid([-1, 1], [0], [0, 1], 0.33) }, ws_barrelold: { s: 1, it: grid([-1.3, 0, 1.3], [-0.45, 0.45], [0], 1) }, ws_barrel: { s: 1, it: grid([-1.3, 0, 1.3], [-0.45, 0.45], [0], 1) },
    ws_farmcrate_apple: { s: 1.3, it: grid([-0.8, 0.8], [-0.45, 0.45], [0, 1], 0.46) }, ws_farmcrate_empty: { s: 1.3, it: grid([-0.8, 0.8], [-0.45, 0.45], [0, 1], 0.46) },
    ws_sack: { s: 1.3, it: [...grid([-1.5, -0.5, 0.5, 1.5], [0], [0], 1), ...grid([-1, 0, 1], [0], [1], 0.55)] }, ws_fishset: { s: 0.9, it: [[-1.0, 0, 0, 0], [1.0, 0, 0, 0.2]] },
  };
  const CART_OF = { lumber: ['ws_cart1', 'ws_logs', 3], quarry: ['ws_cart2', 'ws_stoneblocks', 2], iron: ['ws_cart2', 'ws_boulderA', 2], gold: ['ws_cart3', 'ws_goldbars', 3], oil: ['ws_cart2', 'ws_barrelold', 3], farm: ['ws_cart1', 'ws_farmcrate_apple', 3], livestock: ['ws_cart1', 'ws_sack', 4], fishery: ['ws_cart3', 'ws_fishset', 3], slaughter: ['ws_cart3', 'ws_barrel', 3], greenhouse: ['ws_cart1', 'ws_farmcrate_empty', 3] };
  function spawnCarts(S, n) {
    const rt = haulRoute(S.site); if (!rt || rt.len < 20) return;
    const [cartName, loadName, nLoad] = CART_OF[S.site.kind] || CART_OF.lumber;
    for (let i = 0; i < n; i++) {
      const speed = R2(1.9, 2.4), cycle = (rt.len * 2) / speed + 2 * R2(6, 10);
      const o = { S, rt, speed, wait: 7, cycle, off: (i / n) * cycle + R2(0, 12), cartName, loadName, nLoad, x: 0, z: 0, yaw: 0, mode: '', horse: null, driver: null, cx: 0, cz: 0 };
      if (kinds.horse) { const k = kinds.horse, sc = k.fit.k; o.horse = k.add({ x: 0, y: -999, z: 0, yaw: 0, scale: scaleK(sc, (rnd() * 3) | 0) }); o.horse.cr = 3; o.horse.lift = k.fit.y; }
      if (alive.people) { o.driver = kinds.man.add({ x: 0, y: -999, z: 0, yaw: 0, scale: PS }); o.driver.cr = 2.4; }
      S.carts.push(o); carts.push(o);
    }
  }
  // ---- fishery: the water, the jetty tip, the boats
  const LV = () => L.MOAT.level;
  const wet = (x, z, m = 0.5) => height(x, z) < LV() - m;
  function patrol(site, lane) {                                // a line of water (ping-pong lane) near the site's water point
    const w = site.water || toW(site, 0, 24), best = { len: 0 };
    for (let tries = 0; tries < 60; tries++) {
      const a = rnd() * 6.283, ox = w[0] + (rnd() * 2 - 1) * 10 + Math.cos(a + 1.57) * lane * 4, oz = w[1] + (rnd() * 2 - 1) * 10 + Math.sin(a + 1.57) * lane * 4; if (!wet(ox, oz, 0.7)) continue;
      let f = 0, bk = 0; while (f < 30 && wet(ox + Math.cos(a) * (f + 2), oz + Math.sin(a) * (f + 2), 0.6)) f += 2; while (bk < 30 && wet(ox - Math.cos(a) * (bk + 2), oz - Math.sin(a) * (bk + 2), 0.6)) bk += 2;
      const len = f + bk; if (len > best.len) { best.len = len; best.x0 = ox - Math.cos(a) * (bk - 1), best.z0 = oz - Math.sin(a) * (bk - 1), best.x1 = ox + Math.cos(a) * (f - 1), best.z1 = oz + Math.sin(a) * (f - 1); }
    }
    return best.len >= 8 ? best : null;
  }
  function spawnFishery(S, c) {
    const site = S.site, fishers = c.fishermen || 0, moving = Math.max(0, c.boats - Math.ceil(c.boats / 2)), tipZ = site.variant === 'river' ? 14.5 : 19;
    let used = 0;
    for (let i = 0; i < moving && boatI && used < fishers; i++) {
      const lane = patrol(site, i - moving / 2); if (!lane) continue;
      const b = { S, lane, speed: R2(0.55, 0.9), off: rnd() * 100, x: 0, z: 0, yaw: 0, man: null };
      if (alive.people) { b.man = kinds.rod.add({ x: 0, y: -999, z: 0, yaw: 0, scale: PS, clip: 'Sitting_Idle_Loop', phase: rnd() * 3 }); b.man.cr = 2.4; }
      S.boats.push(b); boats.push(b); used++;
    }
    // the rest of the fishermen stand at the jetty tip and along its sides
    for (let i = 0; used < fishers; i++, used++) {
      const lx = ((i % 5) - 2) * 1.5 * (i % 2 ? 1 : -1) * 0.55, lz = tipZ - 0.7 * (i % 3) - (site.variant === 'river' ? 1 : 0), [wx, wz] = toW(site, lx * 0.4, lz);
      if (!alive.people) break; const p = kinds.rod.add({ x: wx, y: height(wx, wz), z: wz, yaw: site.ry + R2(-0.4, 0.4), scale: PS, clip: rnd() < 0.5 ? 'Idle_Torch_Loop' : 'Idle_Loop', phase: rnd() * 3 }); p.cr = 2.4;
      p.kind = kinds.rod; const fa = { p, S, fixed: true }; S.agents.push(fa); agents.push(fa);
    }
  }
  // ---- populate / clear / refresh
  function clearSite(S) {
    for (const a of S.agents) { a.p.kind && a.p.kind.remove(a.p); const i = agents.indexOf(a); if (i >= 0) agents.splice(i, 1); }
    for (const a of S.animals) { a.k.remove(a.p); const i = animals.indexOf(a); if (i >= 0) animals.splice(i, 1); }
    for (const o of S.carts) { o.horse && kinds.horse.remove(o.horse); o.driver && kinds.man.remove(o.driver); const i = carts.indexOf(o); if (i >= 0) carts.splice(i, 1); }
    for (const b of S.boats) { b.man && kinds.rod.remove(b.man); const i = boats.indexOf(b); if (i >= 0) boats.splice(i, 1); }
  }
  function refresh(c = castle) {
    castle = c; if (!alive.people && !alive.animals) return 0; let n = 0;
    for (const s of sites()) {
      const lv = typeof c === 'number' ? wsLevel(s, c) : Math.max(0, Math.min(30, c[s.kind] | 0)), old = SITES_LIFE.get(s.id); if (old && old.lv === lv) continue;
      if (old) clearSite(old); SITES_LIFE.set(s.id, spawnSite(s, lv)); n++;
    }
    populated = true; return n;
  }

  // ---- per frame
  const cam = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(), pp = new THREE.Vector3(), tmp = { x: 0, z: 0, yaw: 0 };
  const eul = new THREE.Euler(), q2 = new THREE.Quaternion();
  function stepAgent(a, dt, t) {
    const p = a.p; if (a.fixed) return;
    if (a.state === 'work') {
      a.t -= dt; if (a.t <= 0) { a.S.busy.delete(a.task); a.task = pickTask(a); a.S.busy.add(a.task); const [wx, wz] = toW(a.S.site, a.task.x, a.task.z); a.gx = wx; a.gz = wz; a.state = 'walk'; setClip(a, 'Walk_Loop'); }
    } else {
      const dx = a.gx - p.x, dz = a.gz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.25) { a.state = 'work'; a.t = R2(a.task.a, a.task.b); p.x = a.gx; p.z = a.gz; p.yaw = a.S.site.ry + Math.atan2(a.task.fx - a.task.x, a.task.fz - a.task.z); setClip(a, a.task.clip); }
      else { const st = Math.min(d, MOVE * dt), want = Math.atan2(dx, dz); p.yaw += wrap(want - p.yaw) * Math.min(1, dt * 7); p.x += (dx / d) * st; p.z += (dz / d) * st; p.setSpeed(Math.max(0.6, Math.min(1.5, MOVE / ((a.p.kind.stats.walkSpeed || 1.25) * PS)))); }
    }
    p.y = height(p.x, p.z);
  }
  function stepAnimal(a, dt) {
    const p = a.p, k = a.k; a.t -= dt;
    if (a.state === 'walk') {
      const dx = a.tx - p.x, dz = a.tz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.4 || a.t <= 0) { a.state = 'stand'; a.t = R2(2, 6); if (a.clip !== 'Idle') { a.clip = 'Idle'; p.play('Idle'); } }
      else { const sp = a.sp === 'horse' ? 1.5 : 1.0, st = Math.min(d, sp * dt); p.yaw += wrap(Math.atan2(dx, dz) - p.yaw) * Math.min(1, dt * 3); p.x += Math.sin(p.yaw) * st; p.z += Math.cos(p.yaw) * st; }
    } else if (a.t <= 0) {
      const r = rnd();
      if (a.walks && r < 0.35) { const [lx, lz] = [a.pen.cx + (rnd() * 2 - 1) * a.pen.hw * 0.85, a.pen.cz + (rnd() * 2 - 1) * a.pen.hd * 0.85], [wx, wz] = toW(a.S.site, lx, lz); a.tx = wx; a.tz = wz; a.state = 'walk'; a.t = 14; a.clip = 'Walk'; p.play('Walk'); }
      else if (a.walks && r < 0.75 && k.has('Eating')) { a.state = 'graze'; a.t = R2(6, 14); a.clip = 'Eating'; p.play('Eating'); }
      else if (!a.walks && r < 0.2 && k.has('Jump')) { a.state = 'stand'; a.t = R2(3, 7); a.clip = 'Jump'; p.play('Jump'); p.yaw += R2(-1, 1); }
      else { a.state = 'stand'; a.t = R2(3, 8); a.clip = 'Idle'; p.play('Idle'); if (!a.walks) p.yaw += R2(-0.8, 0.8); }
    }
    p.y = height(p.x, p.z) + p.lift;
  }
  function drawCarts(t) {
    const need = {}; let n = 0;
    for (const c of carts) {
      c.vis = false; const o = c.rt.pts[0]; if (Math.hypot(cam.x - o[0], cam.z - o[1]) > 900) { if (c.horse) c.horse.y = -999; if (c.driver) c.driver.y = -999; continue; }
      const T = (t + c.off) % c.cycle, leg = c.rt.len / c.speed; let s, loaded, moving = true;
      if (T < leg) { s = T * c.speed; loaded = true; } else if (T < leg + c.wait) { s = c.rt.len; loaded = true; moving = false; }
      else if (T < 2 * leg + c.wait) { s = c.rt.len - (T - leg - c.wait) * c.speed; loaded = false; } else { s = 0; loaded = false; moving = false; }
      const back = !loaded && moving; alongRoute(c.rt, s, tmp); let yaw = tmp.yaw + (back ? Math.PI : 0);
      c.yaw += wrap(yaw - c.yaw) * 0.25; if (c.first !== true) { c.yaw = yaw; c.first = true; }
      c.x = tmp.x; c.z = tmp.z; const y = height(c.x, c.z);
      // the cart trails the horse by 4.3 m; the driver walks at the horse's head
      const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), hx = c.x, hz = c.z, cxp = c.x - fx * 4.6, czp = c.z - fz * 4.6;
      if (c.horse) { c.horse.x = hx; c.horse.z = hz; c.horse.y = y + c.horse.lift; c.horse.yaw = c.yaw; if (c.mode !== (moving ? 'w' : 'i')) { c.horse.play(moving ? 'Walk' : 'Idle'); } }
      if (c.driver) { c.driver.x = hx + fz * 1.6 + fx * 0.6; c.driver.z = hz - fx * 1.6 + fz * 0.6; c.driver.y = height(c.driver.x, c.driver.z); c.driver.yaw = c.yaw; if (c.mode !== (moving ? 'w' : 'i')) c.driver.play(moving ? 'Walk_Loop' : 'Idle_Loop'); }
      c.mode = moving ? 'w' : 'i';
      const ci = cartI[c.cartName]; if (!ci) continue;
      const y2 = height(cxp, czp), pitch = Math.atan2(y - y2, 4.6) * 0.0;
      m4.compose(pp.set(cxp, y2 + 0.05, czp), q.setFromAxisAngle(up, c.yaw - Math.PI / 2), sc.set(1, 1, 1)); c.m = m4.clone(); c.y2 = y2; c.cxp = cxp; c.czp = czp;
      (need[c.cartName] = need[c.cartName] || []).push(c);
      if (loaded) (need['L:' + c.loadName] = need['L:' + c.loadName] || []).push(c);
    }
    for (const [name, ci] of Object.entries(cartI)) { const list = need[name] || []; list.forEach((c, i) => ci.set(i, c.m)); ci.flush(list.length); }
    for (const [name, li] of Object.entries(loadI)) {
      const list = need['L:' + name] || [], LD = LOADS[name] || LOADS.ws_logs; let n2 = 0;
      for (const c of list) {
        const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), rx = Math.cos(c.yaw), rz = -Math.sin(c.yaw);
        for (const [lx, lz, dy, ry] of LD.it) { if (n2 >= LOAD_CAP) break; m4.compose(pp.set(c.cxp + fx * lx + rx * lz, c.y2 + BED + dy, c.czp + fz * lx + rz * lz), q.setFromAxisAngle(up, c.yaw - Math.PI / 2 + ry), sc.set(LD.s, LD.s, LD.s)); li.set(n2++, m4); }
      }
      li.flush(n2);
    }
  }
  function drawBoats(t) {
    let n = 0;
    for (const b of boats) {
      const ln = b.lane, L2 = Math.hypot(ln.x1 - ln.x0, ln.z1 - ln.z0), leg = L2 / b.speed, T = (t * 1 + b.off) % (2 * leg + 8), fwd = T < leg + 4;
      let u = T < leg ? T / leg : T < leg + 4 ? 1 : T < 2 * leg + 4 ? 1 - (T - leg - 4) / leg : 0; u = u * u * (3 - 2 * u) * 0.5 + u * 0.5;
      b.x = ln.x0 + (ln.x1 - ln.x0) * u; b.z = ln.z0 + (ln.z1 - ln.z0) * u;
      const dir = Math.atan2(ln.x1 - ln.x0, ln.z1 - ln.z0) + (fwd ? 0 : Math.PI); if (b.yaw === undefined) b.yaw = dir; else b.yaw += wrap(dir - b.yaw) * 0.05;
      const bob = Math.sin(t * 1.3 + b.off) * 0.05, rl = Math.sin(t * 0.9 + b.off * 2) * 0.03, y = LV() - 0.12 + bob;
      eul.set(0, 0, rl); q2.setFromEuler(eul); q.setFromAxisAngle(up, b.yaw + (boatI && boatI.size.x > boatI.size.z ? Math.PI / 2 : 0)).multiply(q2);
      m4.compose(pp.set(b.x, y, b.z), q, sc.set(1, 1, 1)); if (boatI && n < 24) boatI.set(n++, m4);
      if (b.man) { b.man.x = b.x; b.man.z = b.z; b.man.y = y + 0.55; b.man.yaw = b.yaw + Math.PI; }
    }
    if (boatI) boatI.flush(n);
  }
  let last = 0;
  function update(t, dt, camera) {
    if (!populated) return; camera.getWorldPosition(cam);
    const sim = Math.min(0.1, dt);
    for (const a of agents) { if (a.fixed) continue; const o = a.S.site; if (Math.hypot(cam.x - o.x, cam.z - o.z) < WORK_DIST) stepAgent(a, sim, t); }
    for (const a of animals) { const o = a.S.site; if (Math.hypot(cam.x - o.x, cam.z - o.z) < WORK_DIST) stepAnimal(a, sim); }
    drawCarts(t); drawBoats(t);
    for (const k of Object.values(kinds)) if (k.update) k.update(t, camera, { lodDist: 70, lod2Dist: k.people ? 150 : 1e9, maxDist: FAR_DIST });
  }
  const steps = [makePeople, makeAnimals, makeMeshes, () => refresh(castle)];
  return { steps, update, refresh, root, kinds, agents, animals, carts, boats, stats: () => ({ agents: agents.length, animals: animals.length, carts: carts.length, boats: boats.length }), group: root, tradesOf };
}
