// u3_lab.js — fast lab for the U3 units: builds the kind with the REAL code (client/src/u3_looks.js) and shows one instance per clip, frozen at a chosen phase.
//   u3_lab.html?u=lich|darkrider &t=tier &az=0.6 &cam=x,y,z,tx,ty,tz &clips=Idle_A:0.2,Running_A:0.1,... &sc=scale &gap=spacing &fov=30 &day=1
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { setupLichU3, setupDarkRiderU3 } from '../bot/bluebot_v2/bluewall/client/src/u3_looks.js';
(async () => {
  const Q = new URLSearchParams(location.search), u = Q.get('u') || 'lich', tier = +(Q.get('t') || 3);
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const M = {}, need = async (n) => (M[n] || (M[n] = await ld.loadAsync('assets/' + n + '.glb').catch((e) => { console.warn('glb', n, e); return null; })));
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(Q.get('day') ? 0x8fb6dc : 0x15305e);
  scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x2c3a52, 1.5)); const sun = new THREE.DirectionalLight(0xfff2dd, 2.4); sun.position.set(30, 50, 40); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: Q.get('day') ? 0x5b7a52 : 0x1d2c44, roughness: 1 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  await need('kk_anims'); if (u === 'darkrider') { await need('u3_dragon_dark'); await need('u3_dk_knight'); }
  const K = {}, TYPE = {}, G = new THREE.Group(); scene.add(G);
  const step = async (name, f) => { K[name] = f(); G.add(K[name].group); };
  const count = { [u]: 8 }, TT = { [u]: tier };
  const ctx = { M, need, step, TYPE, count, TT, K };
  const ok = u === 'lich' ? await setupLichU3(ctx) : await setupDarkRiderU3(ctx);
  window.__lab = { ok, K, TYPE, M, THREE, scene, ld };
  const kind = K[u]; if (!kind) { window.__err = 'no kind (' + ok + ')'; return; }
  const DEF = { lich: 'Idle_A:0.3,Running_A:0.15,Ranged_Magic_Shoot:0.35,Hit_A:0.25,Death_A:0.7', darkrider: 'Idle_loop:0.5,Flying_loop:0.2,Attack:0.4,Flying_loop:0.9' };
  const list = (Q.get('clips') || DEF[u]).split(',').map((s) => { const [n, o] = s.split(':'); return [n, +(o || 0)]; });
  const sc = +(Q.get('sc') || (u === 'lich' ? 3.3 : 1.5)), gap = +(Q.get('gap') || (u === 'lich' ? 9 : 22)), az = +(Q.get('az') || 0.6), lift = +(Q.get('lift') || (u === 'lich' ? 0 : 8));
  list.forEach(([n, off], i) => { const p = kind.add({ x: (i - (list.length - 1) / 2) * gap, y: lift, z: 0, yaw: az, scale: sc }); const ok2 = p.play(n, { fade: false, offset: off }); if (!ok2) console.warn('no clip', n); window['__p' + i] = p; });
  const cam = new THREE.PerspectiveCamera(+(Q.get('fov') || 30), innerWidth / innerHeight, 0.5, 2000);
  const c = (Q.get('cam') || (u === 'lich' ? '0,9,48,0,5,0' : '0,26,80,0,10,0')).split(',').map(Number); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); cam.updateMatrixWorld(true);
  window.__frames = 0; const T = 10;
  const loop = () => { try { kind.update(T, cam); renderer.render(scene, cam); } catch (e) { window.__err = String(e.stack || e); console.error(e); } window.__frames++; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
