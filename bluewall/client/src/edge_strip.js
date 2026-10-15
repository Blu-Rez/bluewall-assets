// TR2_H step 4 — the rim of the map.  rpg.js EDGE_R = 420 m: the hero walks up a bare slope to an invisible circle (frames TR2_S4a_R3 edges: no horizon, no wall, nothing says "this is the end").  A band of
// rocks and trees on r = 395 .. 420 (a few rocks to 428), thin at 395 and thick at the rim, makes the rim readable: a green-grey wall with boulders at its foot.
//   Only what the game already draws: the rocks go into the countryside rock kit (sc_rocks.js rockKit — the same three instanced meshes the meadow rocks use; with ?s4c_rocks=1 they are the library rocks)
//   and the trees into the far forest list (trees.js buildTrees: the baked impostor groups that exist anyway) => +0 draw calls, +0 programs.  Own random stream: the rest of the world is built exactly as before.
//   URL ?edge=0 = no strip (before / after frames).  Visual only; nothing here is a target, a nav obstacle or a light.
import { rng } from './noise.js';
import { rockGroup } from './sc_rocks.js';
import { mat4 } from './util.js';

const QS = typeof location !== 'undefined' ? location.search : '';
export const EDGE = { on: !/[?&]edge=0\b/.test(QS), R0: 395, R1: 420, ROCK_OUT: 432, T0: 428, T1: 462, trees: 0, rocks: 0 };
const slopeAt = (height, x, z) => Math.hypot(height(x + 2, z) - height(x - 2, z), height(x, z + 2) - height(x, z - 2)) / 4;

// trees: { near, far } of world.js buildForest (the strip goes to `far`: impostors; `near` is the castle's neighbourhood).  count by quality: low 380, medium 520, high 650 (fewer if the slope is too steep)
export function edgeTrees(trees, height, level = 'low') {
  if (!EDGE.on || !trees || !trees.far) return 0;
  const R = rng(4242), want = level === 'low' ? 380 : level === 'medium' ? 520 : 650;
  let n = 0;
  for (let i = 0; i < want * 14 && n < want; i++) {
    const a = R() * Math.PI * 2, t = R(), d = EDGE.T0 + (EDGE.T1 - EDGE.T0) * Math.sqrt(t);                  // sqrt: even per area, then thinned below
    if (R() > 0.05 + 0.95 * ((d - EDGE.T0) / (EDGE.T1 - EDGE.T0)) ** 1.6) continue;                           // very thin next to the walkable rim, thick at the back
    const x = Math.cos(a) * d, z = Math.sin(a) * d, h = height(x, z);
    if (h < 0.4 || slopeAt(height, x, z) > 1.15) continue;                                                      // not in the water, not on a cliff
    const s = 1.0 + R() * 0.8 + (d - EDGE.T0) / (EDGE.T1 - EDGE.T0) * 0.45;
    trees.far.push({ m: mat4(x, h - 0.2, z, R() * 6.28, s, s * (0.9 + R() * 0.35), s), c: 0.8 + R() * 0.4, d, group: R() < 0.22 ? 'broad' : undefined });
    n++;
  }
  EDGE.trees = n; return n;
}

// rocks: the sc_rocks kit of world.js (call before kit.build).  A few big boulders at the rim, mid ones in front, small ones scattered, every one with the kit's own satellites
export function edgeRocks(kit, height, level = 'low') {
  if (!EDGE.on || !kit) return 0;
  const R = rng(9191), want = level === 'low' ? 230 : level === 'medium' ? 300 : 380, ok = (x, z) => height(x, z) >= 0.2;
  let n = 0;
  for (let i = 0; i < want * 8 && n < want; i++) {
    const big = n < want * 0.12 ? 1 : n < want * 0.5 ? 0.5 : 0;                                                  // first the big ones (rim), then mid, then small
    // boulders stand on the last walkable metres (EDGE_R 420; behind it the slope hides them from the hero: frames step 4, pass 3) — nothing here is solid, so the boulders are moderate (a hero that walks into one
    // clips only its outer foot) and the mid / small rocks lie further in
    const a = R() * Math.PI * 2, d = big === 1 ? 420 + R() * (EDGE.ROCK_OUT - 420) : big ? 410 + R() * 14 : 398 + Math.pow(R(), 0.7) * (426 - 398);
    const x = Math.cos(a) * d, z = Math.sin(a) * d; if (!ok(x, z)) continue;
    const s = big === 1 ? 2.8 + R() * 1.8 : big ? 1.6 + R() * 1.4 : 0.7 + R() * 1.1;
    rockGroup(kit, R, x, z, s, height, ok, { mountain: big === 1 ? 1 : 0 });
    n++;
  }
  EDGE.rocks = n; return n;
}
