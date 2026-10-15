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
import { ROADS, roadDist } from './roads.js';
import { createKind } from './crowd.js';
import { peasantHeadProp } from './peasanthead.js';
import { mergeSkinned } from './creature.js';
import { axeProp, AXE_GRIP } from './gear_axe.js';
import { crowdShadows, cowPatch, coatPatch, smoothSkinned, measure, prepHorse, scaleK } from './pas_life.js';
import * as TL from './tr2_life.js';                                   // TR2-S4d: Tripo animals + villagers
import { sites, counts, wsLevel, tierOf, inClip } from './worksites.js';
import { planStores } from './stores.js';
import * as C1 from './c1_kinds.js';       // C1: workers / carts of the panning + smokehouse sites
import * as C2 from './c2_kinds.js';       // C2: workers / carts of the sawmill / masonry / smelter sites
import { LEVEL_CAP } from './tiers.js';   // TR2-S4b: the level cap (30 today, 50 when the server says so)
import { steer, turnTo, approach, smooth01, makeGrid, smoothLine, clampN } from './walk_kit.js';   // AN1_R2: acceleration / braking / limited turns, the walking grids of the sites, smoothed cart lines

const PS0 = 1.75 * 0.95;                        // the people's scale (pas_life.js); the Tripo villagers are calibrated to metres: scale 1
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
Object.assign(TRADES, C1.TRADES, C2.TRADES);      // (C1 / C2: new kinds only)
// P1: mint / refinery (C3) and mill / bakery / butcher (C4) shipped no workers: who stands where (site-local metres, the building is at the back, z < 0; a town lot's clip rectangle drops what is outside the lot)
Object.assign(TRADES, {
  mill: [{ k: 'man', w: 3, tasks: [K(-2.6, -0.2, -2.6, -2, 'Interact', 6, 11), K(2.6, 0.2, 2.6, -2, 'Interact', 6, 11), K(5, 3, 5, 1.5, 'Interact', 5, 9), K(-6, 3, -6, 1.5, 'Fixing_Kneeling', 5, 9)] },
         { k: 'woman', f: 1, w: 1, tasks: [K(0, 2.5, 0, 0.5, 'Idle_Talking_Loop', 5, 9), K(-9, 5, -9, 3.5, 'Fixing_Kneeling', 5, 9)] }],
  bakery: [{ k: 'woman', f: 1, w: 3, tasks: [K(-5.2, 5, -5.2, 3.4, 'Interact', 6, 11), K(-2, -0.5, -2, -3, 'Interact', 6, 11), K(2, -0.5, 2, -3, 'Interact', 6, 11), K(6.5, 0.5, 6.5, -2.5, 'Interact', 5, 9)] },
           { k: 'man', w: 2, tasks: [K(5.4, 1.6, 6.5, -1.5, 'Interact', 5, 9), K(0, 3, 0, 1, 'Idle_Talking_Loop', 5, 9)] }],
  butcher: [{ k: 'man', w: 3, tasks: [K(-6.5, 4.2, -6.5, 2.5, 'Interact', 6, 11), K(0, -1.5, 0, -4, 'Interact', 6, 11), K(8.5, 1.5, 8.5, -1, 'Interact', 5, 9)] },
            { k: 'woman', f: 1, w: 1, tasks: [K(7.5, 3.2, 7.5, 1.2, 'Interact', 5, 9)] }],
  mint: [{ k: 'man', w: 3, tasks: [K(-3.1, 4.9, -3.1, 3, 'Interact', 7, 12), K(0.2, 4.9, 0.2, 3, 'Interact', 7, 12), K(3.7, 4.9, 3.7, 2.9, 'Interact', 7, 12), K(-4.6, 8, -4.7, 6.3, 'Fixing_Kneeling', 6, 10)] },
         { k: 'man', w: 2, tasks: [K(4.9, -2.5, 4.9, -4, 'Idle_Talking_Loop', 6, 11), K(-1, -0.3, -1, -3, 'Interact', 5, 9)] }],
  refinery: [{ k: 'man', w: 3, tasks: [K(1.2, 5.6, 1.2, 3.6, 'Interact', 6, 11), K(5.4, 5.4, 5.4, 3.5, 'Interact', 6, 11), K(6.4, -1.3, 6.4, -3.8, 'Interact', 7, 12), K(-2.2, -5.2, -2.2, -8, 'Interact', 7, 12)] },
             { k: 'man', w: 2, tasks: [K(-8.6, -1, -8.6, -3.8, 'Interact', 6, 10), K(11.6, -1, 11.6, -3.8, 'Fixing_Kneeling', 6, 10)] }],
});
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
Object.assign(STORE_OF, C1.STORE_OF, { sawmill: 'wood', masonry: 'stone', smelter: 'iron', mint: 'gold', refinery: 'oil', mill: 'food', bakery: 'food', butcher: 'food' });      // (C2's own product stores `planks` / `cutstone` / `ironbars` do not exist in stores.js yet: they haul to the raw-material store)
// P1: the chain (owner: «گندم → آسیاب → آرد → نانوایی»): a supply site's carts drive to the nearest processing site that stands at the castle level, a processing site's carts to its store
const CHAIN = { farm: 'mill', mill: 'bakery', lumber: 'sawmill', quarry: 'masonry', iron: 'smelter', gold: 'mint', panning: 'mint', oil: 'refinery', fishery: 'smokehouse', slaughter: 'butcher' };
export const chainDest = (site, castle = 30) => {
  const want = CHAIN[site.kind]; if (!want) return null; let best = null, bd = 1e9;
  for (const t of sites()) if (t.kind === want && t.id !== site.id && wsLevel(t, castle) > 0) { const d = Math.hypot(t.x - site.x, t.z - site.z); if (d < bd) { bd = d; best = t; } }
  return best;
};
export function haulRoute(site, castle = 30) {
  try {
    const dest = chainDest(site, castle), st = dest ? null : planStores().find((s) => s.id === STORE_OF[site.kind]); if (!dest && !st) return null;
    const G = graph(), front = toW(site, 0, site.r * 0.55), a = G.near(front[0], front[1]);
    const fd = dest ? toW(dest, 0, dest.r * 0.55) : null, b = fd ? G.near(fd[0], fd[1]) : G.near(st.x, st.z);
    const path = shortest(a, b); if (!path || path.length < 2) return null;
    const route = [[front[0], front[1]], ...path, fd ? [fd[0], fd[1]] : [st.x + Math.sin(st.ry) * 6, st.z + Math.cos(st.ry) * 6]];
    const cum = [0]; for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]));
    return { pts: route, cum, len: cum[cum.length - 1], dest: dest ? dest.id : null };
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
  // TR2-S4d: villagers + animals of the Tripo library when it is loaded (tr2_life.js), else the old crowds below
  const TP = TL.ready() && ['villager_man', 'villager_woman', 'villager_youngman', 'villager_oldman'].every(TL.has);
  const TA = TL.ready() && ['animal_cow', 'animal_horse_white', 'animal_horse_brown', 'animal_horse_black', 'animal_sheep', 'animal_pig'].every(TL.has);
  const PS = TP ? 1 : PS0;
  const kinds = {}, agents = [], animals = [], carts = [], boats = [], alive = { people: false, animals: false };
  const MOVE = 1.35;                                          // m/s a worker walks at
  let castle = opt.castle || 30, populated = false;

  // ---- step 1: the people (4 kinds), 2: the animals (cow, horse, sheep, pig), 3: boats / carts meshes, 4: populate
  const makePeople = () => {
    if (TP) {                                                              // no tools in the hands and no work / sit clips: every clip but Walk_Loop is the frozen frame (tr2_life.js)
      const mkT = (key, cap, fem) => { const k = TL.people(key, { capacity: cap, fps: 15, lod2: { cloth: fem ? 0x7d5b4a : 0x6e5a42, legs: fem ? 0x4a3a30 : 0x3b3129, h: 1.8 } }); if (k) { crowdShadows(k, shadows); root.add(k.group); } return k; };
      kinds.man = mkT('villager_man', 110, false); kinds.woman = mkT('villager_woman', 60, true); kinds.axe = kinds.pick = mkT('villager_youngman', 100, false); kinds.rod = mkT('villager_oldman', 24, false);
      alive.people = !!(kinds.man && kinds.woman && kinds.axe && kinds.rod); return;
    }
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
    if (TA) {                                                              // static Tripo animals (tr2_life.js): the clip names only pick a procedural gait
      const fa = (spec, len, cap) => { const k = TL.fauna(spec, { len, capacity: cap, shadows }); if (k) root.add(k.group); return k; };
      kinds.cow = fa('animal_cow', 3.3, 40); kinds.horse = TL.horses({ len: 3.4, capacity: 40, shadows }); if (kinds.horse) root.add(kinds.horse.group);
      kinds.sheep = fa('animal_sheep', 1.6, 40); kinds.pig = fa('animal_pig', 1.8, 40);
      alive.animals = !!(kinds.cow && kinds.horse && kinds.sheep && kinds.pig); return;
    }
    const animKind = (src, clips, cap, patch) => {
      const k = createKind({ gltf: { scene: src, animations: src.userData.pasClips }, anims: { animations: src.userData.pasClips }, clips, capacity: cap, fps: 20 });
      if (patch) patch(k); crowdShadows(k, shadows); root.add(k.group); return k;
    };
    const fit = (src, len) => { const M = measure(src, [], []); return { k: len / Math.max(M.size.x, M.size.z), y: -M.minY, M }; };
    const gaitOf = (src, k) => { try { const M = measure(src, [], [['Walk', 0.6]]); return M.v.Walk ? clampN(M.v.Walk * k, 0.5, 3) : 0; } catch (e) { return 0; } };      // AN1_R2: m/s the Walk clip was made for, at this kind's scale
    if (models.cow) {
      const src = SkeletonUtils.clone(models.cow.scene); mergeSkinned(src); smoothSkinned(src); src.userData.pasClips = models.cow.animations;
      const clips = ['Idle', 'Idle_2', 'Idle_Headlow', 'Eating', 'Walk'].filter((n) => models.cow.animations.some((a) => a.name === n));
      kinds.cow = animKind(src, clips, 40, cowPatch); const f = fit(src, 3.3); kinds.cow.fit = { k: f.k, y: f.y * f.k }; kinds.cow.has = (n) => clips.includes(n); kinds.cow.vnat = gaitOf(src, f.k);
    }
    if (models.horse) {
      const src = prepHorse(models.horse); const clips = ['Idle', 'Eating', 'Walk'].filter((n) => models.horse.animations.some((a) => a.name === n));
      kinds.horse = animKind(src, clips, 40, null); const f = fit(src, 3.4); kinds.horse.fit = { k: f.k, y: f.y * f.k }; kinds.horse.has = (n) => clips.includes(n); kinds.horse.vnat = gaitOf(src, f.k);
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
  // ---- AN1_R2: the walking grids of the sites (walk_kit.js): rasterised from the site's own meshes (walls, fences, crates, crops, pen floors, pads, jetty planks), a few ms per frame,
  // only for sites that have a worker or an animal near the camera.  Until a grid is ready its people stand still (a handful of frames).
  let wsMeshes = null; const grids = new Map(), gridQ = [];
  const collectMeshes = () => {
    let top = root; while (top.parent) top = top.parent; wsMeshes = new Map();
    top.traverse((o) => { if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || !o.name || o.name.indexOf('ws:') !== 0 || /:far$|glass/.test(o.name)) return; if (o.material && o.material.transparent) return; const id = o.name.split(':')[1]; (wsMeshes.get(id) || wsMeshes.set(id, []).get(id)).push(o); });
  };
  const gridOf = (site) => {
    let g = grids.get(site.id); if (g !== undefined) return g;
    if (!wsMeshes) collectMeshes();
    const ms = wsMeshes.get(site.id); if (!ms || !ms.length) { grids.set(site.id, null); return null; }
    g = makeGrid({ cx: site.x, cz: site.z, R: clampN((site.r || 22) * 1.15 + 6, 24, 56), meshes: ms, height, waterY: L.MOAT.level }); grids.set(site.id, g); gridQ.push(g); return g;
  };
  // where a task is really done: its spot, moved to the nearest free cell when it lies inside a prop (cached per grid)
  const taskXZ = (a, t) => {
    const g = a.g; let q = g && g.ready ? g.tp.get(t) : null; if (q) return q;
    const w = toW(a.S.site, t.x, t.z); if (g && g.ready) { q = g.nearest(w[0], w[1], 2.0) || w; g.tp.set(t, q); return q; } return w;
  };
  const pickTask = (a) => {
    const S = a.S, busy = S.busy, g = a.g, comp = g && g.ready ? g.compAt(a.p.x, a.p.z) : 0; let best = null;
    for (let tries = 0; tries < 10; tries++) {
      const t = a.role.tasks[(rnd() * a.role.tasks.length) | 0]; if (t === a.task || busy.has(t)) continue;
      if (comp > 0) { const [x, z] = taskXZ(a, t); if (g.compAt(x, z) !== comp) continue; }            // only jobs this worker can walk to
      best = t; break;
    }
    return best || a.task;
  };
  function spawnSite(site, lv) {
    const S = { site, lv, agents: [], animals: [], busy: new Set(), carts: [], boats: [] };
    const c = counts(site, lv); let trades = tradesOf(site, lv) || [];
    if (site.clip) { trades = trades.map((t) => ({ ...t, tasks: t.tasks.filter((k) => inClip(site.clip, k.x, k.z)) })).filter((t) => t.tasks.length); c.workers = Math.min(c.workers || 0, trades.reduce((n, t) => n + t.tasks.length, 0)); }       // P1: a town lot keeps its people inside the lot (one per task spot)
    if (alive.people && trades.length) {
      const total = trades.reduce((s, t) => s + t.w, 0), nW = Math.max(0, c.workers - (site.kind === 'fishery' ? (c.fishermen || 0) : 0));
      for (let i = 0; i < nW; i++) {
        let r = ((i * 0.618) % 1) * total, role = trades[0]; for (const t of trades) { if (r < t.w) { role = t; break; } r -= t.w; }
        const t0 = role.tasks[i % role.tasks.length], [wx, wz] = toW(site, t0.x, t0.z);
        const p = person(role.k, wx, wz, site.ry, 'Idle_Loop', rnd() * 3); if (!p) continue;
        const a = { p, S, role, task: t0, state: 'work', t: R2(0, t0.b), clip: null, cd: 0, gx: wx, gz: wz, m: { v: 0 }, walking: false }; p.yaw = site.ry + Math.atan2(t0.fx - t0.x, t0.fz - t0.z); a.fy = p.yaw; setClip(a, t0.clip);
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
        const lx = pen.cx + (rnd() * 2 - 1) * pen.hw * 0.85, lz = pen.cz + (rnd() * 2 - 1) * pen.hd * 0.85, [wx, wz] = toW(site, lx, lz), sc = k.fit.k * R2(0.92, 1.08), cv = pen.sp === 'cow' ? (rnd() * 5) | 0 : pen.sp === 'horse' ? (rnd() * 3) | 0 : 0;
        const p = k.add({ x: wx, y: height(wx, wz), z: wz, yaw: rnd() * 6.28, scale: k.static ? sc : pen.sp === 'cow' || pen.sp === 'horse' ? scaleK(sc, cv) : sc, coat: cv }); p.cr = 3; p.lift = k.fit.y * (sc / k.fit.k);
        p.y += p.lift; const an = { p, S, sp: pen.sp, pen, k, state: 'stand', t: R2(1, 6), clip: null, walks: pen.sp === 'cow' || pen.sp === 'horse', tx: 0, tz: 0, lx, lz, m: { v: 0 } };
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
  Object.assign(CART_OF, C1.CART_OF, C2.CART_OF, { mint: ['ws_cart3', 'ws_goldbars', 3], refinery: ['ws_cart2', 'ws_barrelold', 3], mill: ['ws_cart1', 'ws_sack', 4], bakery: ['ws_cart1', 'ws_farmcrate_empty', 3], butcher: ['ws_cart3', 'ws_barrel', 3] });
  // AN1_R2 carts: a smoothed road line (walk_kit smoothLine, tangent tails at both ends), a trapezoid speed profile (the horse's Walk clip is played at the rate of the speed it really goes),
  // the cart on a 4.6 m hitch behind the horse, and a turn-round at each end (the horse steps round on the spot, the cart swings after it) instead of a 180° flip.  Still a pure function of time.
  const CART_ACC = 0.9, HITCH = 4.6, PIVOT = 3.6;
  const liftOf = (Ln) => {                                                  // 1 where the route runs on a cobble street (town.js lays the ribbon 7 cm over the terrain), blurred
    const n = Math.ceil(Ln.len / 2) + 1, a = new Float32Array(n), o = {};
    for (let i = 0; i < n; i++) { Ln.at(Math.min(Ln.len, i * 2), o); a[i] = roadDist(o.x, o.z, 'cobble') < -0.2 ? 1 : 0; }
    const b = a.slice(); for (let i = 0; i < n; i++) b[i] = (a[Math.max(0, i - 1)] + a[i] * 2 + a[Math.min(n - 1, i + 1)]) / 4; return b;
  };
  const liftAt = (b, sd) => { const f = clampN(sd / 2, 0, b.length - 1), i = Math.floor(f), u = f - i; return b[i] * (1 - u) + b[Math.min(b.length - 1, i + 1)] * u; };
  const roadY = (x, z, f) => { const h = height(x, z); return f > 0.001 ? h + f * (Math.max(h, 0.2) + 0.07 - h) : h; };
  function spawnCarts(S, n) {
    const rt = haulRoute(S.site, typeof castle === 'number' ? castle : 30); if (!rt || rt.len < 20) return;
    if (!rt.L) { rt.L = smoothLine(rt.pts, { iter: 2, step: 0.5 }); rt.lift = liftOf(rt.L); }
    const [cartName, loadName, nLoad] = CART_OF[S.site.kind] || CART_OF.lumber;
    for (let i = 0; i < n; i++) {
      const speed = R2(1.4, 1.8), ta = speed / CART_ACC, stand = R2(3, 6), leg = rt.L.len / speed + ta, cycle = 2 * (leg + stand + PIVOT);
      const o = { S, rt, speed, stand, leg, sgn: rnd() < 0.5 ? 1 : -1, cycle, off: (i / n) * cycle + R2(0, 12), cartName, loadName, nLoad, x: 0, z: 0, yaw: 0, cyaw: 0, mode: '', dmode: '', dv: 0, has: false, horse: null, driver: null, cx: 0, cz: 0 };
      if (kinds.horse) { const k = kinds.horse, sc = k.fit.k; const cv = (rnd() * 3) | 0; o.horse = k.add({ x: 0, y: -999, z: 0, yaw: 0, scale: k.static ? sc : scaleK(sc, cv), coat: cv }); o.horse.cr = 3; o.horse.lift = k.fit.y; }
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
      const lv = typeof c === 'number' ? wsLevel(s, c) : Math.max(0, Math.min(LEVEL_CAP, c[s.kind] | 0)), old = SITES_LIFE.get(s.id); if (old && old.lv === lv) continue;
      if (old) clearSite(old); SITES_LIFE.set(s.id, spawnSite(s, lv)); n++;
    }
    populated = true; return n;
  }

  // TR2-S5: the player moved a production lot (siteIds) and / or a storehouse (storeIds = 'wood' …): the people, animals and carts of every site that depends on it are made again at the new places
  // (a site's workers stand around ITS place; its carts drive to its store / to the next site of the chain).  Returns the number of sites made again.
  function respawn(siteIds = new Set(), storeIds = new Set()) {
    let n = 0;
    for (const [id, S] of [...SITES_LIFE]) {
      const site = S && S.site; if (!site) continue;
      const dest = chainDest(site, typeof castle === 'number' ? castle : 30);
      if (siteIds.has(id) || (dest ? siteIds.has(dest.id) : storeIds.has(STORE_OF[site.kind]))) { clearSite(S); SITES_LIFE.delete(id); n++; }
    }
    for (const id of [...SITES_LIFE.keys()]) if (!sites().some((q) => q.id === id)) { clearSite(SITES_LIFE.get(id)); SITES_LIFE.delete(id); }
    // AN1_R2 (TR2-S5 rebase): the walking grid of a moved site was rasterised from its OLD meshes and place: forget it (and the mesh index, the moved site's meshes are new) so gridOf makes it again where it stands now
    for (const id of siteIds) { const g = grids.get(id); if (g) { const gi = gridQ.indexOf(g); if (gi >= 0) gridQ.splice(gi, 1); } grids.delete(id); }
    wsMeshes = null;
    refresh(castle); return n;
  }

  // ---- per frame
  const cam = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(), pp = new THREE.Vector3(), tmp = { x: 0, z: 0, yaw: 0 };
  const eul = new THREE.Euler(), q2 = new THREE.Quaternion();
  // AN1_R2: workers and pen animals walk with walk_kit.steer (acceleration, braking, limited turns, moving only along the facing) on A* routes through the site's grid; the gait clip
  // is played at the rate of the speed the body really has, and ends in the idle pose when the walker has stopped.  The floor height comes from the grid (pads, pen floors, planks).
  const beginWalk = (p, sp) => { sp = Math.max(0.2, sp); if (p.startWalk) p.startWalk(sp); else p.play('Walk_Loop', { speed: sp }); };
  function stepAgent(a, dt) {
    const p = a.p, site = a.S.site, g = a.g || (a.g = gridOf(site)), m = a.m || (a.m = { v: 0 });
    if (a.fixed) { if (g && g.ready && !a.gy) { a.gy = true; p.y = g.y(p.x, p.z); } return; }
    if (g && !g.ready) return;                                                     // the grid is still being built: stand
    if (g && !a.placed) { a.placed = true; const q = a.state === 'work' ? taskXZ(a, a.task) : g.nearest(p.x, p.z, 2.4); if (q) { p.x = q[0]; p.z = q[1]; a.gx = q[0]; a.gz = q[1]; } }
    if (a.state === 'work') {
      turnTo(p, a.fy, 2.4, dt); a.t -= dt; m.v = 0; a.walking = false;
      if (a.t <= 0) {
        const nt = pickTask(a);
        if (nt === a.task) a.t = R2(a.task.a, a.task.b);
        else {
          const [gx, gz] = taskXZ(a, nt), path = g ? g.path(p.x, p.z, gx, gz) : [[gx, gz]];
          if (path && path.length) { a.S.busy.delete(a.task); a.task = nt; a.S.busy.add(nt); a.gx = gx; a.gz = gz; a.path = path; a.pi = 0; a.state = 'walk'; a.fy = site.ry + Math.atan2(nt.fx - nt.x, nt.fz - nt.z); m.stuck = 0; }
          else a.t = R2(3, 6);                                                     // no way there (a closed yard, a blocked spot): keep this job a while
        }
      }
    } else {
      const wp = a.path[a.pi], last = a.pi === a.path.length - 1, ws = (p.kind.stats.walkSpeed || 1.25) * PS;
      const rem = steer(p, m, wp[0], wp[1], dt, { vmax: MOVE, acc: 1.3, dec: 1.9, turn: 3.0, stopD: last ? 0.02 : 0.3, pass: !last, free: g ? g.free : null });
      if (rem < (last ? 0.04 : 0.3)) { if (last) { p.x = a.gx; p.z = a.gz; m.v = 0; a.state = 'work'; a.t = R2(a.task.a, a.task.b); } else a.pi++; }
      else if (m.stuck > 1.0 && g) { m.stuck = 0; const path = g.path(p.x, p.z, a.gx, a.gz); if (path) { a.path = path; a.pi = 0; } else { m.v = 0; a.state = 'work'; a.t = R2(2, 4); } }
      if (a.state === 'walk') {
        if (m.v > 0.14) { if (!a.walking) { a.walking = true; a.clip = 'Walk_Loop'; beginWalk(p, m.v / ws); } else p.setSpeed(clampN(m.v / ws, 0.12, 1.8)); }
        else if (a.walking && m.v < 0.08) { a.walking = false; setClip(a, 'Idle_Loop'); }
        else if (!a.walking) setClip(a, 'Idle_Loop');                              // turning on the spot before the first step
      } else { a.walking = false; setClip(a, a.task.clip); }
    }
    p.y = g ? g.y(p.x, p.z) : height(p.x, p.z);
  }
  // a random walk target inside the animal's pen that it can reach: [[x,z]…] or null
  const penTarget = (a, g) => {
    for (let i = 0; i < 6; i++) {
      const lx = a.pen.cx + (rnd() * 2 - 1) * a.pen.hw * 0.85, lz = a.pen.cz + (rnd() * 2 - 1) * a.pen.hd * 0.85, [wx, wz] = toW(a.S.site, lx, lz);
      if (!g) { if (Math.hypot(wx - a.p.x, wz - a.p.z) > 1.5) return [[wx, wz]]; continue; }
      const q = g.nearest(wx, wz, 0.6, g.compAt(a.p.x, a.p.z)); if (!q || Math.hypot(q[0] - a.p.x, q[1] - a.p.z) < 1.5) continue;
      const path = g.path(a.p.x, a.p.z, q[0], q[1]); if (path) return path;
    }
    return null;
  };
  function stepAnimal(a, dt) {
    const p = a.p, k = a.k, site = a.S.site, g = a.g || (a.g = gridOf(site)), m = a.m || (a.m = { v: 0 });
    if (g && !g.ready) return;
    if (g && !a.placed) { a.placed = true; const q = g.nearest(p.x, p.z, 2.4, 0); if (q) { p.x = q[0]; p.z = q[1]; } }
    a.t -= dt; const vn = k.vnat || (a.sp === 'horse' ? 1.5 : 1.0);
    if (a.state === 'walk') {
      const wp = a.path[a.pi], last = a.pi === a.path.length - 1;
      const rem = steer(p, m, wp[0], wp[1], dt, { vmax: 0.85 * vn, acc: 0.7, dec: 1.0, turn: 1.5, pivot: false, stopD: last ? 0.1 : 0.5, pass: !last, free: g ? g.free : null });
      if (rem < (last ? 0.12 : 0.5)) { if (last) { m.v = 0; a.state = 'stand'; a.t = R2(2, 6); } else a.pi++; }
      else if (m.stuck > 1.5 || a.t <= 0) { m.v = 0; a.state = 'stand'; a.t = R2(2, 4); }
      if (a.state === 'walk') {
        const rate = clampN(m.v / vn, 0.3, 1.6);
        if (m.v > 0.1 * vn) { if (a.clip !== 'Walk') { a.clip = 'Walk'; p.play('Walk', { speed: rate }); } else if (p.setSpeed) p.setSpeed(rate); }
        else if (a.clip !== 'Idle') { a.clip = 'Idle'; p.play('Idle'); }          // turning on the spot before the first step
      } else if (a.clip !== 'Idle') { a.clip = 'Idle'; p.play('Idle'); }
    } else if (a.t <= 0) {
      const r = rnd();
      if (a.walks && r < 0.35) { const path = penTarget(a, g); if (path) { a.path = path; a.pi = 0; a.state = 'walk'; a.t = 25; m.stuck = 0; } else { a.state = 'stand'; a.t = R2(2, 4); } }
      else if (a.walks && r < 0.75 && k.has('Eating')) { a.state = 'graze'; a.t = R2(6, 14); a.clip = 'Eating'; p.play('Eating'); }
      else if (!a.walks && r < 0.2 && k.has('Jump')) { a.state = 'stand'; a.t = R2(3, 7); a.clip = 'Jump'; p.play('Jump'); a.yawT = p.yaw + R2(-1, 1); }
      else { a.state = 'stand'; a.t = R2(3, 8); a.clip = 'Idle'; p.play('Idle'); if (!a.walks) a.yawT = p.yaw + R2(-0.8, 0.8); }
    }
    if (a.state !== 'walk' && a.yawT !== undefined && turnTo(p, a.yawT, 0.9, dt) < 0.02) a.yawT = undefined;   // (sheep and pigs have no walk clip: they only turn, slowly)
    p.y = (g ? g.y(p.x, p.z) : height(p.x, p.z)) + p.lift;
  }
  // the cart's pose at time T of its cycle: go (loaded) · unload + turn round · back · load + turn round.  Fills c.s / vel / om / hy (horse heading) / cy (cart heading) / loaded
  const trap = (tau, len, v, ta) => {                                          // [distance, speed] of a leg of length len: accelerate over ta, cruise at v, brake over ta
    const Tt = len / v + ta; if (tau <= 0) return [0, 0]; if (tau >= Tt) return [len, 0];
    if (tau < ta) return [0.5 * (v / ta) * tau * tau, (v / ta) * tau];
    if (tau > Tt - ta) { const r = Tt - tau; return [len - 0.5 * (v / ta) * r * r, (v / ta) * r]; }
    return [0.5 * v * ta + v * (tau - ta), v];
  };
  const rotTo = (a0, a1, sgn, u) => { let d = wrap(a1 - a0); if (sgn > 0 && d < 0) d += 2 * Math.PI; else if (sgn < 0 && d > 0) d -= 2 * Math.PI; return a0 + d * u; };
  const cA = { x: 0, z: 0 }, cB = { x: 0, z: 0 };
  const hdg = (Ln, sd) => { Ln.at(sd - 1, cA); Ln.at(sd + 1, cB); return Math.atan2(cB.x - cA.x, cB.z - cA.z); };            // heading of the line at sd (chord ±1 m)
  const chord = (Ln, sH, sB) => { Ln.at(sB, cA); Ln.at(sH, cB); return Math.atan2(cB.x - cA.x, cB.z - cA.z); };               // from the point behind (sB) to the horse (sH)
  function cartPose(c, T) {
    const Ln = c.rt.L, len = Ln.len, v = c.speed, ta = v / CART_ACC, leg = c.leg, w = c.stand + PIVOT, lag = 1.0;
    c.om = 0;
    if (T < leg) { const [sd, vel] = trap(T, len, v, ta); c.ph = 'go'; c.s = sd; c.vel = vel; c.hy = hdg(Ln, sd); c.cy = chord(Ln, sd, sd - HITCH); c.loaded = true; return; }
    if (T < leg + w) {                                                         // at the destination: unload, then the horse turns round on the spot
      const tau = T - leg, u = clampN((tau - c.stand) / PIVOT, 0, 1), h0 = hdg(Ln, len), c0 = chord(Ln, len, len - HITCH), c1 = chord(Ln, len, len + HITCH);
      c.ph = 'w1'; c.s = len; c.vel = 0; c.hy = h0 + c.sgn * Math.PI * smooth01(u); c.om = tau > c.stand ? c.sgn * Math.PI * 6 * u * (1 - u) / PIVOT : 0;
      c.cy = rotTo(c0, c1, c.sgn, smooth01((tau - c.stand - lag) / (PIVOT - lag))); c.loaded = tau < c.stand; return;
    }
    if (T < 2 * leg + w) { const tau = T - leg - w, [sd, vel] = trap(tau, len, v, ta); c.ph = 'back'; c.s = len - sd; c.vel = vel; c.hy = hdg(Ln, c.s) + Math.PI; c.cy = chord(Ln, c.s, c.s + HITCH); c.loaded = false; return; }
    const tau = T - 2 * leg - w, u = clampN((tau - c.stand) / PIVOT, 0, 1), h0 = hdg(Ln, 0) + Math.PI, c0 = chord(Ln, 0, HITCH), c1 = chord(Ln, 0, -HITCH);
    c.ph = 'w2'; c.s = 0; c.vel = 0; c.hy = h0 + c.sgn * Math.PI * smooth01(u); c.om = tau > c.stand ? c.sgn * Math.PI * 6 * u * (1 - u) / PIVOT : 0;
    c.cy = rotTo(c0, c1, c.sgn, smooth01((tau - c.stand - lag) / (PIVOT - lag))); c.loaded = tau > c.stand;
  }
  function drawCarts(t, dt) {
    const need = {}, vnH = (kinds.horse && kinds.horse.vnat) || 1.5, wsD = alive.people ? (kinds.man.stats.walkSpeed || 1.25) * PS : 1.25;
    for (const c of carts) {
      c.vis = false; const o = c.rt.pts[0]; if (Math.hypot(cam.x - o[0], cam.z - o[1]) > 900) { if (c.horse) c.horse.y = -999; if (c.driver) c.driver.y = -999; c.has = false; continue; }
      cartPose(c, (t + c.off) % c.cycle);
      const Ln = c.rt.L; Ln.at(c.s, tmp); const hx = tmp.x, hz = tmp.z, f = liftAt(c.rt.lift, c.s), sn = Math.sin(c.hy), cs = Math.cos(c.hy), yH = roadY(hx, hz, f);
      c.x = hx; c.z = hz; c.yaw = c.hy; c.cyaw = c.cy;
      const moving = c.vel > 0.05 || Math.abs(c.om) > 0.05, vh = Math.max(c.vel, Math.abs(c.om) * 0.9);
      if (c.horse) {
        c.horse.x = hx; c.horse.z = hz; c.horse.y = yH + c.horse.lift; c.horse.yaw = c.hy;
        const rate = clampN(vh / vnH, 0.3, 1.8);
        if (moving) { if (c.mode !== 'w') c.horse.play('Walk', { speed: rate }); else if (c.horse.setSpeed) c.horse.setSpeed(rate); } else if (c.mode !== 'i') c.horse.play('Idle');
      }
      if (c.driver) {                                                          // walks at the horse's head (1.6 m to its right, 0.6 m ahead); his gait follows the speed he really has
        const d = c.driver, px = d.x, pz = d.z; d.x = hx + cs * 1.6 + sn * 0.6; d.z = hz - sn * 1.6 + cs * 0.6; d.y = roadY(d.x, d.z, f); d.yaw = c.hy;
        if (c.has && dt > 0) c.dv += (Math.hypot(d.x - px, d.z - pz) / dt - c.dv) * Math.min(1, dt * 10); else c.dv = vh;
        if (c.dv > 0.12) { if (c.dmode !== 'w') { c.dmode = 'w'; beginWalk(d, c.dv / wsD); } else d.setSpeed(clampN(c.dv / wsD, 0.15, 1.8)); } else if (c.dmode !== 'i') { c.dmode = 'i'; d.play('Idle_Loop'); }
      }
      c.mode = moving ? 'w' : 'i'; c.has = true;
      const ci = cartI[c.cartName]; if (!ci) continue;
      const cxp = hx - Math.sin(c.cy) * HITCH, czp = hz - Math.cos(c.cy) * HITCH, y2 = roadY(cxp, czp, f);
      m4.compose(pp.set(cxp, y2 + 0.05, czp), q.setFromAxisAngle(up, c.cy - Math.PI / 2), sc.set(1, 1, 1)); c.m = m4.clone(); c.y2 = y2; c.cxp = cxp; c.czp = czp;
      (need[c.cartName] = need[c.cartName] || []).push(c);
      if (c.loaded) (need['L:' + c.loadName] = need['L:' + c.loadName] || []).push(c);
    }
    for (const [name, ci] of Object.entries(cartI)) { const list = need[name] || []; list.forEach((c, i) => ci.set(i, c.m)); ci.flush(list.length); }
    for (const [name, li] of Object.entries(loadI)) {
      const list = need['L:' + name] || [], LD = LOADS[name] || LOADS.ws_logs; let n2 = 0;
      for (const c of list) {
        const fx = Math.sin(c.cyaw), fz = Math.cos(c.cyaw), rx = Math.cos(c.cyaw), rz = -Math.sin(c.cyaw);
        for (const [lx, lz, dy, ry] of LD.it) { if (n2 >= LOAD_CAP) break; m4.compose(pp.set(c.cxp + fx * lx + rx * lz, c.y2 + BED + dy, c.czp + fz * lx + rz * lz), q.setFromAxisAngle(up, c.cyaw - Math.PI / 2 + ry), sc.set(LD.s, LD.s, LD.s)); li.set(n2++, m4); }
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
    if (gridQ.length && gridQ[0].pump(5)) gridQ.shift();                       // AN1_R2: the site grids are built a few ms per frame
    for (const a of agents) { const o = a.S.site; if (Math.hypot(cam.x - o.x, cam.z - o.z) < WORK_DIST) stepAgent(a, sim); }
    for (const a of animals) { const o = a.S.site; if (Math.hypot(cam.x - o.x, cam.z - o.z) < WORK_DIST) stepAnimal(a, sim); }
    drawCarts(t, sim); drawBoats(t);
    for (const k of new Set(Object.values(kinds))) if (k.update) k.update(t, camera, { lodDist: 70, lod2Dist: k.people ? 150 : 1e9, maxDist: FAR_DIST });      // (a Set: axe / pick share one Tripo kind)
  }
  const steps = [makePeople, makeAnimals, makeMeshes, () => refresh(castle)];
  return { steps, update, refresh, respawn, root, kinds, agents, animals, carts, boats, grids, gridOf, stats: () => ({ agents: agents.length, animals: animals.length, carts: carts.length, boats: boats.length }), group: root, tradesOf };      // TR2-S5: + respawn
}
