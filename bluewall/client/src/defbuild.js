// The defence field in the world (p38): the traps + the defensive buildings of defplan.js, baked from kit_def.glb (one merged mesh per material and gate; the small things only appear near by).
//   buildDefField(parent, gltf, hf, { shadows, level }) -> { group, rebuild(level), update(t, camera), count() }
import * as THREE from 'three';
import { bakePieces } from './village.js';
import { defItems, planDefs } from './defplan.js';
import * as L from './layout.js';

export const DEF_NEAR = 230, DEF_FAR = 560;                      // m from the camera: the small traps appear inside DEF_NEAR, a whole gate's field vanishes beyond DEF_FAR
const BIG = new Set(['hedgehog', 'watchtower', 'brazier', 'ballista', 'firestone', 'tesla', 'crossbow']);     // seen from far (silhouette); the rest only from near by

export function buildDefField(parent, gltf, hf, { shadows = true, level = 30 } = {}) {
  const group = new THREE.Group(); group.name = 'deffield'; parent.add(group);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), sc = new THREE.Vector3(), cp = new THREE.Vector3();
  let cur = -1, parts = [], shown = 0;
  const dispose = (g) => { g.traverse((o) => { if (o.isMesh && o.geometry) o.geometry.dispose(); }); group.remove(g); };
  function rebuild(lv = level) {
    lv = Math.max(0, Math.min(30, Math.round(lv))); if (lv === cur) return 0; cur = lv;
    for (const p of parts) dispose(p.g); parts = [];
    const items = defItems(lv); shown = items.length;
    const gates = L.TGATES || [];
    gates.forEach((G, gi) => {
      const big = [], small = [];
      for (const it of items) {
        if (it.gate !== gi) continue;
        m4.compose(v.set(it.x, hf(it.x, it.z) - 0.03, it.z), q.setFromAxisAngle(up, it.ry), sc.set(it.s, it.s, it.s));
        (BIG.has(it.id) ? big : small).push({ name: it.n, matrix: m4.clone() });
      }
      const g = new THREE.Group(); g.name = 'def:gate' + gi; group.add(g);
      if (gltf && big.length) bakePieces(g, gltf, big, { shadows, tag: 'def:' + gi });
      const minor = new THREE.Group(); minor.name = 'minor'; g.add(minor); g.userData.minor = minor;
      if (gltf && small.length) bakePieces(minor, gltf, small, { shadows: false, tag: 'def:' + gi + ':minor' });
      parts.push({ g, x: G.x + G.nx * 45, z: G.z + G.nz * 45 });
    });
    return shown;
  }
  rebuild(level);
  let lastT = -9;
  function update(t, camera) {                                    // distance LOD, four times a second
    if (!camera || t - lastT < 0.25) return; lastT = t; camera.getWorldPosition(cp);
    for (const p of parts) { const d = Math.hypot(cp.x - p.x, cp.z - p.z, cp.y * 0.5); p.g.visible = d < DEF_FAR; const mn = p.g.userData.minor; if (mn) mn.visible = d < DEF_NEAR; }
  }
  return { group, rebuild, update, count: () => shown, plan: planDefs };
}
