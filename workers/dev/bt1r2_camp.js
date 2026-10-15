// bt1r2_camp.js - BT1_R2 job 2: the CAMP SLOT dev page.  The real camp.js (createCamp) on a plain hill with an army of ten squads; ?stand=1 puts EXISTING assets in the slots of the table (dev-only stand-ins: they show that a model enters by a
// JSON edit and nothing else), ?far=1 / ?near=1 force the pavilions' level of detail, ?palisade=1 turns the fence on (stand-in: a short crate).  window.__camp.report() -> slots + kinds + lod counts.
import * as THREE from 'three';
import { createCamp } from '../bot/bluebot_v2/bluewall/client/src/camp.js';
import { CAMP_TABLE } from '../bot/bluebot_v2/bluewall/client/src/camp_slots.js';
const Q = new URLSearchParams(location.search), W = +(Q.get('w') || 1300), H = +(Q.get('h') || 600);
const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); R.setSize(W, H); R.setPixelRatio(1); R.shadowMap.enabled = true; document.body.style.margin = '0'; document.body.appendChild(R.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xb7cde6); scene.add(new THREE.HemisphereLight(0xffffff, 0x556644, 1.0)); const dl = new THREE.DirectionalLight(0xfff2dd, 2.2); dl.position.set(60, 90, -40); dl.castShadow = true; dl.shadow.mapSize.set(2048, 2048);
Object.assign(dl.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, near: 1, far: 400 }); scene.add(dl);
const height = (x, z) => 0.05 * z + 1.2 * Math.sin(x * 0.05) + 0.8 * Math.sin(z * 0.07);
const gg = new THREE.PlaneGeometry(500, 500, 100, 100); gg.rotateX(-Math.PI / 2); { const p = gg.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i))); gg.computeVertexNormals(); }
const ground = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ color: 0x6f8f4a, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
const cam = new THREE.PerspectiveCamera(Q.get('fov') ? +Q.get('fov') : 52, W / H, 0.5, 3000);
const ARMY = { spear: 40, sword: 30, guard: 12, archer: 40, cavalry: 12, catapult: 4, mage: 10, ram: 3, cannon: 4, giant: 3 };
let camp = null;
const STAND = { command: ['tent_general', 6, 5.2], supply: ['stall', 3.4, 3.4], siege: ['weaponstand', 3.2, 3.4], banner: ['banner', 17, 2], palisade: ['crate', 1.4, 1] };
function table() {
  const t = JSON.parse(JSON.stringify(CAMP_TABLE));
  if (Q.get('stand')) for (const [k, [m, h, r]] of Object.entries(STAND)) { if (k === 'palisade' && !Q.get('palisade')) continue; Object.assign(t.kinds[k], { model: m, h, r: k === 'banner' || k === 'palisade' ? null : r }); }
  if (Q.get('broken')) { t.kinds.supply.model = 'no_such_tent'; t.kinds.supply.h = 3; t.kinds.supply.r = 3; }
  return t;
}
async function build() {
  const sx = +(Q.get('sx') || 0);
  camp = await createCamp({ scene, height, dp: { x: sx, z: 0, nx: 0, nz: 1 }, emblem: 'flame', army: ARMY, targets: [], table: table() });
  return camp.info;
}
window.__camp = {
  build, cam,
  look(x, y, z, tx, ty, tz) { cam.position.set(x, y, z); cam.lookAt(tx, ty, tz); cam.updateMatrixWorld(true); camp.update(2, cam); R.render(scene, cam); },
  report: () => ({ slots: camp.slots, kinds: camp.info.kinds, lod: camp.info.lod(), tents: camp.info.tents.length, rect: camp.rect, calls: R.info.render.calls, tris: R.info.render.triangles }),
  png: () => R.domElement.toDataURL('image/png'),
};
window.__campReady = true;
