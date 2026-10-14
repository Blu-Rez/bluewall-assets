// small cloth test scene (no world): a stone wall with tapestries, a tower pole with a flag, a gate lintel with the plaque
import * as THREE from 'three';
import { Heraldry, setGateName } from '../../bot/bluebot_v2/bluewall/client/src/her_flags.js';
import { Batcher, mat4 } from '../../bot/bluebot_v2/bluewall/client/src/util.js';
import { makeMaterials } from '../../bot/bluebot_v2/bluewall/client/src/materials.js';
import { setEmblem } from '../../bot/bluebot_v2/bluewall/client/src/textures.js';
const q = new URLSearchParams(location.search), W = +(q.get('w') || 390), H = +(q.get('h') || 844), night = q.get('n') === '1';
await document.fonts.load('900 64px Cinzel').catch(() => {});
const r = new THREE.WebGLRenderer({ antialias: true }); r.setSize(W, H); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = night ? 1.1 : 1.0; r.shadowMap.enabled = true;
document.body.style.margin = '0'; document.body.appendChild(r.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(night ? 0x0a1426 : 0x9cc0e8); scene.fog = new THREE.FogExp2(scene.background, 0.004);
const cam = new THREE.PerspectiveCamera(45, W / H, 0.5, 2000);
const v = (q.get('cam') || '0,8,30,0,7,0').split(',').map(Number); cam.position.set(v[0], v[1], v[2]); cam.lookAt(v[3], v[4], v[5]);
const key = new THREE.DirectionalLight(night ? 0x6f8fd0 : 0xfff2dd, night ? 0.5 : 3.0); key.position.set(-60, 90, 70); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, far: 300 }); scene.add(key);
scene.add(new THREE.HemisphereLight(night ? 0x203050 : 0x9fbff0, 0x2a3222, night ? 0.5 : 1.2));
if (night) { const pl = new THREE.PointLight(0xff9a45, 220, 30, 1.8); pl.position.set(0, 4, 6); scene.add(pl); }
const M = makeMaterials(); const B = new Batcher(); const HF = new Heraldry(B, M);
if (q.get('e')) setEmblem(q.get('e'));
setGateName(q.get('name') != null ? q.get('name') : 'Blꪊe Heart');
const BOX = new THREE.BoxGeometry(1, 1, 1);
B.add(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), M.stoneDark, mat4(0, 0, 0), { tint: 0x556644 });
// wall 40 m long, 9.5 high, 4.2 thick, facing +z; tapestries on the front face
const T = 4.2, WH = 9.5;
B.add(BOX, M.stone, mat4(0, WH / 2, 0, 0, 40, WH, T), { worldUV: 0.085 });
B.add(BOX, M.stoneDark, mat4(0, WH - 0.35, T / 2 + 0.15, 0, 40, 0.5, 0.35), { worldUV: 0.085, tint: 0xb9bdc8 });
B.add(BOX, M.rune, mat4(0, WH * 0.62, T / 2 + 0.06, 0, 39.6, 1.15, 0.1), { uvScale: [40 / 11, 1] });
for (let k = 0; k < 16; k++) B.add(BOX, M.stone, mat4(-18.5 + k * 2.3, WH + 0.85, T / 2 - 0.35, 0, 1.25, 1.7, 0.7), { worldUV: 0.085 });
const hh = WH - 0.72 - 3.3, h = hh / 1.12;
for (const x of [-12, 0, 12]) HF.banner(x, WH - 0.72 - h / 2, T / 2 + 0.2, 0, 2.4, h, 0, { tapestry: true });
// a free banner on a bracket, a gate lintel with the plaque, a tower pole with a flag
B.add(BOX, M.stone, mat4(-26, 8, 0, 0, 7.4, 16, 7.4), { worldUV: 0.085 });
HF.banner(-26, 9, 3.85, 0, 3.2, 6);
B.add(BOX, M.stone, mat4(26, 13.2, 0, 0, 14.4, 5.6, 5.2), { worldUV: 0.085 });
HF.plaque(26, 13.25, 2.66, 0, 9.2, 2.6);
B.add(new THREE.CylinderGeometry(0.06, 0.1, 4.5, 6), M.wood, mat4(8, WH + 2.25 + 4, -6), { tint: 0x4a3424 });
B.add(BOX, M.stone, mat4(8, (WH + 4) / 2, -6, 0, 3, WH + 4, 3), { worldUV: 0.085 });
HF.add(8, WH + 4 + 4.5 - 0.55, -6, 0.6, 1.0);
B.add(new THREE.CylinderGeometry(0.1, 0.17, 8.5, 8), M.wood, mat4(-8, WH + 4.25 + 4, -6), { tint: 0x4a3424 });
HF.add(-8, WH + 4 + 8.5 - 1.21, -6, 0.4, 2.2);
B.build(scene); HF.build(scene);
if (night && M.plaqueMat) M.plaqueMat.emissiveIntensity = 1.55;
const t0 = +(q.get('t') || 3);
let frames = 0;
const loop = () => { HF.update(t0 + frames * 0.0); r.render(scene, cam); frames++; if (frames < 3) requestAnimationFrame(loop); else window.__ready = true; };
loop();
window.__scene = scene;
