// RP4 test arena (dev only).  A flat arena + the hero (Elina) + the combat core attached EXACTLY like rpg.js will do it (pre / post / frame hooks, host-driven movement).
// Built by dev/rp4_dev_build.sh (three + loader bundled; combat.js and combat/*.js are loaded as real ES modules from assets/rpg/, like in the game).
// Dev API for the proof driver: window.__rp4.  Enemies are PLACEHOLDERS (the game's own legionary / werewolf / troll): test only, owner only.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const q = new URLSearchParams(location.search);
const W0 = +(q.get('w') || innerWidth), H0 = +(q.get('h') || innerHeight);
const HERO_H = 1.75, MODEL_H = 0.98, SC = HERO_H / MODEL_H, ARENA = 21, WALK = 1.18, RUN = 4.39, STRIDE_W = 2.75, STRIDE_R = 5.49;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), wrapPi = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };
const parseGLB = (buf, path) => { const l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder); return l.parseAsync(buf, path); };
const base = new URL('assets/', location.href).href, rpgBase = base + 'rpg/';

const root = document.getElementById('game'); root.style.cssText = 'position:fixed;left:0;top:0;width:' + W0 + 'px;height:' + H0 + 'px;overflow:hidden;background:#0a0f18;touch-action:none';
const renderer = new THREE.WebGLRenderer({ antialias: q.get('aa') != null, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(+(q.get('dpr') || 1)); renderer.setSize(W0, H0); root.appendChild(renderer.domElement); renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0c1420); scene.fog = new THREE.Fog(0x0c1420, 22, 58);
const camera = new THREE.PerspectiveCamera(q.get('fov') ? +q.get('fov') : (W0 < H0 ? 62 : 52), W0 / H0, 0.3, 120); scene.add(camera);
scene.add(new THREE.HemisphereLight(0xbdd6ff, 0x2a2118, 1.1)); const sun = new THREE.DirectionalLight(0xfff0d8, 2.2); sun.position.set(-6, 12, 8); scene.add(sun);
// arena floor: grid texture; a ring of low pillars so the camera and the lock-on have something to read against
{ const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#26303f'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#3a4a62'; g.lineWidth = 2; for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.04)'; for (let i = 0; i < 400; i++) g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(ARENA * 2 / 4, ARENA * 2 / 4); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(ARENA + 4, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, metalness: 0 })); scene.add(floor);
  const pm = new THREE.MeshStandardMaterial({ color: 0x59667c, roughness: 0.9 }); for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, p = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.75, 3.2 + (i % 3) * 0.8, 8), pm); p.position.set(Math.sin(a) * (ARENA + 1.5), 1.6, Math.cos(a) * (ARENA + 1.5)); scene.add(p); } }
const tag = document.createElement('div'); tag.textContent = 'RP4 TEST ARENA · PLACEHOLDER ENEMIES · OWNER ONLY'; tag.style.cssText = 'position:absolute;left:8px;bottom:4px;font:10px/1 monospace;color:rgba(200,210,225,.45);pointer-events:none;z-index:50'; root.appendChild(tag);

// ---- the hero, loaded like rpg.js loadHero()
const hero = { grp: new THREE.Group(), model: null, mixer: null, acts: {}, clips: [] };
const S = { x: 0, y: 0, z: -4, body: 0, camYaw: 0, pitch: 0.34, dist: 4.4, vx: 0, vz: 0, st: 'loco', speed: 0, grounded: true, phase: 0, inp: { x: 0, y: 0 }, keys: new Set() };
let cmb = null;
async function loadHero() {
  const res = await fetch(rpgBase + (q.get('hero') || 'elina') + '.glb'); const gltf = await parseGLB(await res.arrayBuffer(), rpgBase);
  const model = gltf.scene; hero.model = model; model.scale.setScalar(SC); hero.grp.add(model); model.traverse((o) => { if (o.isMesh || o.isSkinnedMesh) o.frustumCulled = false; });
  hero.mixer = new THREE.AnimationMixer(model); hero.clips = gltf.animations;
  for (const n of ['idle', 'walk', 'run', 'dodge']) { const clip = gltf.animations.find((a) => a.name === n); const a = hero.mixer.clipAction(clip); a.timeScale = 0; a.setEffectiveWeight(0); a.play(); hero.acts[n] = { a, d: clip.duration, w: 0, tw: 0 }; }
  scene.add(hero.grp);
}
function animate(dt) {                                                     // the host's locomotion blend (same numbers as rpg.js)
  const A = hero.acts; for (const n in A) A[n].tw = 0; const v = S.speed;
  if (S.st === 'loco') { const wr = clamp((v - WALK) / (RUN - WALK), 0, 1), ww = v < WALK ? clamp(v / WALK, 0, 1) : 1 - wr, wi = v < WALK ? 1 - ww : 0; A.idle.tw = wi; A.walk.tw = ww * (1 - wr); A.run.tw = wr;
    const rate = A.walk.tw * v / STRIDE_W + A.run.tw * v / STRIDE_R, tw = A.walk.tw + A.run.tw; if (tw > 0.01) S.phase = (S.phase + (rate / tw) * dt) % 1; A.walk.a.time = S.phase * A.walk.d; A.run.a.time = S.phase * A.run.d; A.idle.a.time = (A.idle.a.time + dt) % A.idle.d; }
  let sum = 0; const k = Math.min(1, dt / 0.11); for (const n in A) { const o = A[n]; o.w += (o.tw - o.w) * k; sum += o.w; } for (const n in A) { const o = A[n]; o.a.setEffectiveWeight(sum > 1e-4 ? o.w / sum : (n === 'idle' ? 1 : 0)); } hero.mixer.update(0);
}
const hostMove = (dx, dz) => { S.x += dx; S.z += dz; const r = Math.hypot(S.x, S.z); if (r > ARENA - 0.6) { S.x *= (ARENA - 0.6) / r; S.z *= (ARENA - 0.6) / r; } };
const hgt = () => 0;

// ---- one tick of the host (the same order rpg.js update() will have with the RP4 hooks)
function update(dt) {
  let ix = S.inp.x, iy = S.inp.y; const K = S.keys; if (K.has('KeyW') || K.has('ArrowUp')) iy += 1; if (K.has('KeyS') || K.has('ArrowDown')) iy -= 1; if (K.has('KeyD')) ix += 1; if (K.has('KeyA')) ix -= 1;
  if (K.has('ArrowLeft')) S.camYaw += 1.9 * dt; if (K.has('ArrowRight')) S.camYaw -= 1.9 * dt;
  let m = Math.hypot(ix, iy); if (m > 1) { ix /= m; iy /= m; m = 1; } if (m < 0.1) { ix = iy = 0; m = 0; }
  const sp = Math.sin(S.camYaw), cp = Math.cos(S.camYaw), wantX = sp * iy - cp * ix, wantZ = cp * iy + sp * ix;
  const busy = cmb ? cmb.pre(dt, S, wantX, wantZ, m) : false;
  const target = m > 0 ? (m < 0.55 ? WALK * (m / 0.55) : WALK + (RUN - WALK) * ((m - 0.55) / 0.45)) : 0, ml = Math.hypot(wantX, wantZ) || 1;
  if (!busy) { const acc = 16 * dt; S.vx += clamp((wantX / ml) * target - S.vx, -acc, acc); S.vz += clamp((wantZ / ml) * target - S.vz, -acc, acc); hostMove(S.vx * dt, S.vz * dt); if (Math.hypot(S.vx, S.vz) > 0.25) S.body += wrapPi(Math.atan2(S.vx, S.vz) - S.body) * Math.min(1, dt * 13); S.speed = Math.hypot(S.vx, S.vz); } else S.speed = 0;
  hero.grp.position.set(S.x, S.y, S.z); hero.grp.rotation.y = S.body;
  animate(dt); if (cmb) cmb.post(dt);
}
function placeCamera() {            // the host's behind-the-hero camera (rpg.js placeCamera): D m back, 0.55 m over her right shoulder, pivot 1.45 m up, looks along the yaw / pitch
  const cy = Math.cos(S.camYaw), sy = Math.sin(S.camYaw), cp = Math.cos(S.pitch), sp = Math.sin(S.pitch), vx = sy * cp, vy = -sp, vz = cy * cp, D = S.dist;
  const px = S.x, py = S.y + 1.45, pz = S.z; camera.position.set(px - vx * D + (-cy) * 0.55, py - vy * D + 0.1, pz - vz * D + sy * 0.55); camera.lookAt(camera.position.x + vx, camera.position.y + vy, camera.position.z + vz); camera.updateMatrixWorld();
}
let tNow = 0;
function renderFrame(dt) { placeCamera(); if (cmb) cmb.frame(dt, tNow * 1000); renderer.render(scene, camera); }

// ---- inputs: joystick (left half), look-drag (right half), keys
{ const joy = document.createElement('div'); joy.style.cssText = 'position:absolute;z-index:41;width:124px;height:124px;margin:-62px 0 0 -62px;border-radius:50%;border:1.5px solid rgba(205,214,224,.5);background:radial-gradient(circle,rgba(40,46,54,.18),rgba(20,24,30,.42));box-shadow:0 0 14px rgba(61,245,224,.22);pointer-events:none;display:none';
  const nub = document.createElement('i'); nub.style.cssText = 'position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(235,240,246,.75),rgba(120,130,142,.55));border:1.5px solid rgba(61,245,224,.8)'; joy.appendChild(nub); root.appendChild(joy);
  let jid = -1, lid = -1, jx = 0, jy = 0, lx = 0, ly = 0;
  root.addEventListener('pointerdown', (e) => { if (e.target !== renderer.domElement) return; const r = root.getBoundingClientRect(), x = e.clientX - r.left; if (x < r.width / 2 && jid < 0) { jid = e.pointerId; jx = e.clientX; jy = e.clientY; joy.style.left = (jx - r.left) + 'px'; joy.style.top = (jy - r.top) + 'px'; nub.style.transform = ''; joy.style.display = 'block'; } else if (lid < 0) { lid = e.pointerId; lx = e.clientX; ly = e.clientY; } });
  window.addEventListener('pointermove', (e) => { if (e.pointerId === jid) { let dx = e.clientX - jx, dy = e.clientY - jy; const l = Math.hypot(dx, dy), R = 50; if (l > R) { dx *= R / l; dy *= R / l; } nub.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; S.inp.x = dx / R; S.inp.y = -dy / R; } else if (e.pointerId === lid) { S.camYaw -= (e.clientX - lx) * 0.0055; S.pitch = clamp(S.pitch + (e.clientY - ly) * 0.004, -0.2, 1.0); lx = e.clientX; ly = e.clientY; } });
  const end = (e) => { if (e.pointerId === jid) { jid = -1; S.inp.x = S.inp.y = 0; joy.style.display = 'none'; } if (e.pointerId === lid) lid = -1; }; window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  window.addEventListener('keydown', (e) => { if (cmb && cmb.key(e.code)) { e.preventDefault(); return; } S.keys.add(e.code); }); window.addEventListener('keyup', (e) => S.keys.delete(e.code)); }

// ---- boot: attach the combat core the way rpg.js does (lazy ES module by URL)
async function boot() {
  await loadHero(); hero.grp.position.set(S.x, S.y, S.z);
  if (q.get('nocmb') != null) { window.__rp4 = api; window.__ready = true; return; }
  const mod = await import(base + 'rpg/combat.js' + (q.get('v') ? '?v=' + q.get('v') : ''));
  cmb = await mod.attach({ scene, hgt }, hero, { THREE, camera, scene, root, base: rpgBase, v: '', parseGLB, hostMove, hgt, pixelRatio: +(q.get('dpr') || 1), btns: null, kinds: (q.get('kinds') || 'soldier,beast,brute').split(','), seed: +(q.get('seed') || 1) });
  // dev-only extra buttons (the game has its own jump / dodge / sprint)
  const L = cmb.hud.LAYOUT; cmb.hud.add('dodge', L.dodge, undefined, (n, d) => { if (d) cmb.press('dodge'); });
  window.__rp4 = api; window.__ready = true;
}
const api = {
  THREE, S, hero, renderer, camera, scene, get cmb() { return cmb; }, get sim() { return cmb.sim; },
  step(sec, dtf = 1 / 60) { const n = Math.round(sec / dtf); for (let i = 0; i < n; i++) { tNow += dtf; update(dtf); if (i === n - 1) { placeCamera(); } else { placeCamera(); } if (cmb) cmb.frame(dtf, tNow * 1000); } return n; },
  render() { renderer.render(scene, camera); },   // (the camera already carries the combat framing + shake from the last step(): the host order is placeCamera -> cmb.frame -> render)
  setCam(yaw, pitch, dist, fov) { if (yaw != null) S.camYaw = yaw; if (pitch != null) S.pitch = pitch; if (dist != null) S.dist = dist; if (fov != null) { camera.fov = fov; camera.updateProjectionMatrix(); } if (cmb) cmb.undoCam && cmb.undoCam(); placeCamera(); },
  setPos(x, z, body) { S.x = x; S.z = z; if (body != null) S.body = body; S.vx = S.vz = 0; },
  input(x, y) { S.inp.x = x; S.inp.y = y; }, press(n) { cmb.press(n); },
  programs() { return renderer.info.programs.map((p) => p.name + ':' + p.cacheKey.length); },
  info() { const r = renderer.info; return { calls: r.render.calls, tris: r.render.triangles, programs: r.programs ? r.programs.length : -1, geometries: r.memory.geometries, textures: r.memory.textures }; },
  resize(w, h) { root.style.width = w + 'px'; root.style.height = h + 'px'; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); },
};
boot().catch((e) => { window.__err = String(e && e.stack || e); console.error(e); });
let last = performance.now(); (function loop(now) { requestAnimationFrame(loop); if (!window.__ready || q.get('manual') != null) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; tNow += dt; update(dt); renderFrame(dt); })(performance.now());
