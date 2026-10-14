// b1_dev.js — B1 DEV FLAG: coloured placeholder boxes for the town plan (b1_townplan.js).  OFF by default: without ?b1town=1 in the page URL nothing is built (+0 programs, +0 draw calls).
//   ?b1town=1            level-30 plan        ?b1town=1&b1lv=12   the plan as it stands at castle level 12
// Two InstancedMeshes (house bodies, door marks) only; this is a look-at-the-plan tool, not final art (B2 / B3 / C* bring the real models).
import * as THREE from 'three';
import { planTown, KINDS } from './b1_townplan.js';
import { layoutFromGame } from './b1_layout.js';

const COL = {
  cottage: 0x8fc1ff, craftsman: 0xffbf47, merchant: 0x43d9c4, noble: 0xb98cff,
  tavern: 0xff8f4d, townhall: 0xffffff, chapel: 0xff9ccb, well: 0x35c8ff,
  sawmill: 0x7bd43f, masonry: 0xa9b4c2, smelter: 0xff5a36, mint: 0xffd400, refinery: 0xff2f2f, mill: 0xe8d3a8, bakery: 0xffa86b, butcher: 0xd1495b, smokehouse: 0x1fb5a8, jeweler: 0xf06bf0,
};
const HEIGHT = { cottage: 4.2, craftsman: 5.4, merchant: 6.4, noble: 8, tavern: 6.2, townhall: 8.5, chapel: 9, well: 1.3, sawmill: 5.5, masonry: 5.5, smelter: 7, mint: 6.5, refinery: 8, mill: 7, bakery: 5, butcher: 4.8, smokehouse: 5, jeweler: 5.4 };

export function b1Dev(ctx, scene) {
  if (typeof location === 'undefined') return null;
  const Q = new URLSearchParams(location.search);
  if (Q.get('b1town') !== '1') return null;                                   // flag off: nothing happens
  const lv = Math.max(1, Math.min(30, Math.round(+(Q.get('b1lv') || 30)) || 30));
  const list = planTown(layoutFromGame(), lv).filter((p) => !p.existing && COL[p.kind] != null);
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), list.length);
  const door = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x06101f }), list.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), c = new THREE.Color();
  list.forEach((p, i) => {
    const h = HEIGHT[p.kind] || 5, gy = ctx.height(p.x, p.z);
    q.setFromAxisAngle(up, p.ry);
    m.compose(new THREE.Vector3(p.x, gy + h / 2, p.z), q, new THREE.Vector3(p.w, h, p.d)); body.setMatrixAt(i, m);
    body.setColorAt(i, c.setHex(COL[p.kind]));
    const dz = p.d / 2 + 0.05, dw = Math.min(2, p.w * 0.3);                      // the door side is local +z (it faces the street)
    m.compose(new THREE.Vector3(p.x + Math.sin(p.ry) * dz, gy + 1.1, p.z + Math.cos(p.ry) * dz), q, new THREE.Vector3(dw, 2.2, 0.3)); door.setMatrixAt(i, m);
  });
  body.name = door.name = 'b1town'; body.frustumCulled = door.frustumCulled = false;
  scene.add(body, door);
  const info = { list, level: lv, kinds: Object.keys(KINDS).filter((k) => list.some((p) => p.kind === k)) };
  window.__b1town = info;                                                        // (dev pages read it: counts, ids)
  return info;
}
