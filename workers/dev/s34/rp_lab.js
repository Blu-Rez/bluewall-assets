// bare three.js lab: the REAL squadring.js + ringpath.js on a grass plane, the game's camera (fov 50, behind the army, pitch .9).  ?d=215 (camera distance) &mode=drag|staged
import * as THREE from 'three';
import { createSquadRings } from '../../bot/bluebot_v2/bluewall/client/src/squadring.js';
import { createRingPaths } from '../../bot/bluebot_v2/bluewall/client/src/ringpath.js';
const Q = new URLSearchParams(location.search), D = +(Q.get('d') || 215), W = 390, Hh = 844;
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(W, Hh); renderer.setPixelRatio(+(Q.get('dpr') || 1)); document.body.style.margin = 0; document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x7d8f4a);
const cvs = document.createElement('canvas'); cvs.width = cvs.height = 256; const g = cvs.getContext('2d'); g.fillStyle = '#7d8f4a'; g.fillRect(0, 0, 256, 256);
for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${40 + Math.random() * 60},${70 + Math.random() * 70},${20 + Math.random() * 30},.25)`; g.fillRect(Math.random() * 256, Math.random() * 256, 3, 3); }
const gt = new THREE.CanvasTexture(cvs); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(40, 40); gt.colorSpace = THREE.SRGBColorSpace;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: gt })); scene.add(ground);
const camera = new THREE.PerspectiveCamera(50, W / Hh, 0.8, 3200);
const types = ['spear', 'sword', 'archer', 'cavalry', 'axerider', 'pegasus', 'baby', 'dragon', 'giant', 'shieldmaiden', 'lord'];
const pos = { spear: [20, 30], sword: [4, 38], archer: [-14, 28], cavalry: [-30, 40], axerider: [-26, 16], pegasus: [26, 6], baby: [4, 8], dragon: [18, -10], giant: [34, 12], shieldmaiden: [12, 20], lord: [-8, 18] };
const units = []; for (const t of types) { const [cx, cz] = pos[t]; const n = t === 'shieldmaiden' || t === 'lord' ? 1 : 5; for (let i = 0; i < n; i++) units.push({ type: t, x: cx + Math.cos(i * 1.3) * 3, z: cz + Math.sin(i * 1.3) * 3, hp: 5, dead: false }); }
const sim = { units, deploy: { nx: 0, nz: 1 } };      // (front = -n = towards -z, the base)
const H = () => 0, rings = createSquadRings(scene, { height: H, types }), paths = createRingPaths(scene, { height: H });
const PI = +(Q.get('pitch') || 0.9); camera.position.set(0, Math.sin(PI) * D, 28 + Math.cos(PI) * D); camera.lookAt(0, 0, 28);
const col = (t) => new THREE.Color({ spear: '#ff6b6b', sword: '#ffa94d', archer: '#8ce99a', giant: '#e599f7', baby: '#4dabf7', cavalry: '#38d9a9' }[t] || '#9fe6ff');
const mode = Q.get('mode') || 'drag';
const gh = mode === 'drag' ? [{ t: 'sword', x: -8, z: -48, mode: 'drag', prog: +(Q.get('prog') || 0) }] : [{ t: 'archer', x: -34, z: -30, mode: 'staged' }, { t: 'giant', x: 40, z: -34, mode: 'staged' }, { t: 'sword', x: 6, z: -52, mode: 'staged' }];
const lit = new Set(mode === 'drag' ? ['sword'] : []);
let t = 3.1;
for (let f = 0; f < 6; f++) { rings.update(sim, lit, 0.2, t += 0.2, gh, camera.position); }
const list = gh.map((q) => { const I = rings.info(q.t), dx = q.x - I.cx, dz = q.z - I.cz, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L; return { x0: I.cx + ux * I.r * 0.96, z0: I.cz + uz * I.r * 0.96, x1: q.x - ux * I.r * 0.96, z1: q.z - uz * I.r * 0.96, color: col(q.t), k: q.mode === 'staged' ? 1 : q.prog || 0, a: q.mode === 'staged' ? 0.85 : 1 }; });
paths.update(list, t, D);
renderer.render(scene, camera);
setTimeout(() => { renderer.render(scene, camera); window.__ready = true; }, 1800);      // (the portraits decode a moment after the first frame)
