import * as THREE from 'three';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { nomads, buildNomads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nomads.js';
L.setMap('night'); buildRoads();
const S = 720;
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(S, S);
r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15; r.outputColorSpace = THREE.SRGBColorSpace; document.body.style.margin = 0; document.body.appendChild(r.domElement);
const sc = new THREE.Scene(); sc.background = new THREE.Color(0x9fc2e8); sc.fog = new THREE.FogExp2(0x9fc2e8, 0.004);
const cam = new THREE.PerspectiveCamera(46, 1, 0.5, 2000);
const key = new THREE.DirectionalLight(0xfff0d8, 2.6); key.position.set(-60, 90, 50); sc.add(key); sc.add(new THREE.HemisphereLight(0x8fb4e8, 0x4a4a32, 1.1));
const plan = nomads(); const C = plan[+(new URLSearchParams(location.search).get('c') || 1)] || plan[0];
// ground
const gg = new THREE.PlaneGeometry(160, 160, 80, 80); gg.rotateX(-Math.PI / 2); const p = gg.attributes.position;
for (let i = 0; i < p.count; i++) { p.setY(i, L.height(C.x + p.getX(i), C.z + p.getZ(i))); }
gg.computeVertexNormals(); sc.add(new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ color: 0x5f7f3c, roughness: 1 })));
gg.translate(C.x, 0, C.z);
const nb = buildNomads(sc, L.height, { shadows: false });
// the rest of the plan is far away; only this camp is near the camera
window.__info = { camps: plan.length, tris: nb.tris, camp: [C.x, C.z, C.tents.length] };
window.__shot = (a) => { cam.position.set(C.x + a.dx, L.height(C.x, C.z) + a.h, C.z + a.dz); cam.lookAt(C.x + (a.tx || 0), L.height(C.x, C.z) + (a.ty || 1), C.z + (a.tz || 0)); r.render(sc, cam); return true; };
window.__ready = true;
