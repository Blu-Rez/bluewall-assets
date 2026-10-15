// TR2_H H2 + H3 — the ground line of the Tripo town houses (own file).  Until now a house stood on the lawn like a box pasted on it: no contact shadow, no footing.
//   H2  contact shadow: ONE InstancedMesh of soft quads (sc_shadow.js groundShadows, the game's own blob shadow) under every house, a little wider than the footprint      (+1 draw call)
//   H3  stone footing : ONE merged mesh of two low courses (box, M.stone — the castle's own stone material, so +0 programs) round every house, sunk into the terrain on the low side    (+1 draw call)
// Both are children of the planned-town group: they appear with the town and go with it when it is rebuilt (town_build.js).  Visual only: nothing here is a target, a nav obstacle or a shadow caster.
import * as THREE from 'three';
import { Batcher, mat4 } from './util.js';
import { groundShadows } from './sc_shadow.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const STONE_LIGHT = new THREE.Color(1.5, 1.52, 1.6), STONE_LOW = new THREE.Color(1.12, 1.14, 1.2);          // linear multipliers on the dark-blue stone texture (a value > 1 lightens it): the pale blue-grey of the walls
export const GROUND_COURSES = [[0.6, 0.05, STONE_LOW], [0.28, 0.11, STONE_LIGHT]];                          // [how much wider than the GROUND-FLOOR footprint (m), top height above the house's ground (m), colour]

// feet: [{ x, z, ry, w, d, y, gw, gd, gx, gz }]  (world centre of the house body, yaw, bbox footprint (the shadow), the ground height the house stands on, ground-floor footprint + its world centre (the footing))
export function townGround(group, feet, { height, M }) {
  const out = { shadow: null, footing: null };
  if (!feet.length) return out;
  out.shadow = groundShadows(group, feet.map((f) => ({ x: f.x, z: f.z, w: f.w, d: f.d, ry: f.ry })), height, { pad: 2.0, sun: [0.1, -0.08], strength: 0.4, name: 'town_contact' });
  if (M && M.stone) {
    const B = new Batcher();
    for (const f of feet) {
      for (const [wide, top, col] of GROUND_COURSES) {
        const h = top + 0.55;                                                                              // sunk 0.55 m: on a slope the low side shows a footing, the high side is buried
        B.add(BOX, M.stone, mat4(f.gx ?? f.x, f.y + top - h / 2, f.gz ?? f.z, f.ry, (f.gw ?? f.w) + wide, h, (f.gd ?? f.d) + wide), { worldUV: 0.4, tint: col, tintLinear: true });
      }
    }
    const ms = B.build(group, { cast: false, receive: true, name: 'town_footing' });
    out.footing = ms[0] || null;
  }
  return out;
}
